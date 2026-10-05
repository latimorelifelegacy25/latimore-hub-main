"""SQLite store for the memory layer (standard library only)."""
import errno
import os
import re
import sqlite3
import stat
import time
from pathlib import Path
from urllib.parse import urlsplit

from .redact import redact_text, sanitize_url

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal TEXT NOT NULL,
    outcome TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'model',
    started_at TEXT NOT NULL,
    ended_at TEXT,
    iterations INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS visited_urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    visited_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    tool TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT '',
    redacted_input TEXT NOT NULL DEFAULT '',
    ok INTEGER NOT NULL DEFAULT 1,
    called_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    fact TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'user',
    confidence REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'user',
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_urls_session ON visited_urls(session_id);
CREATE INDEX IF NOT EXISTS idx_calls_session ON tool_calls(session_id);
"""
TABLES = ["sessions", "visited_urls", "tool_calls", "knowledge", "preferences"]
STOPWORDS = {"the", "and", "for", "that", "this", "with", "from", "are", "was", "you", "your",
             "all", "can", "has", "have", "not", "but", "what", "when", "how", "into", "out"}


def now_iso(ts=None) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(ts if ts is not None else time.time()))


def default_db_path() -> Path:
    env = os.getenv("MEMORY_DB")
    if env:
        return Path(env).expanduser()
    return Path(__file__).resolve().parent.parent / "memory_data" / "memory.db"


def detect_fts5(conn) -> bool:
    """True when SQLite was built with FTS5 and a virtual table can be created."""
    try:
        options = " ".join(row[0] for row in conn.execute("PRAGMA compile_options"))
        if "ENABLE_FTS5" not in options:
            return False
        conn.execute("CREATE VIRTUAL TABLE temp.__fts5_probe USING fts5(x)")
        conn.execute("DROP TABLE temp.__fts5_probe")
        return True
    except sqlite3.Error:
        return False


def query_terms(text: str, limit: int = 12):
    seen = []
    for word in re.findall(r"[A-Za-z0-9]{3,}", str(text or "")[:2000].lower()):
        if word not in STOPWORDS and word not in seen:
            seen.append(word)
    return seen[:limit]


def _like_escape(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


STATUSES = ("done", "failed", "step_limit")


def normalize_domain(value) -> str:
    """'https://u@*.Bank.com:8443/x?y' -> 'bank.com'. Raises ValueError for anything that is not a
    dotted hostname (bare labels such as 'com' are refused: too broad)."""
    text = str(value or "").strip().lower()[:300]
    text = re.sub(r"^[a-z][a-z0-9+.-]*://", "", text)
    text = re.split(r"[/?#]", text, maxsplit=1)[0]
    text = text.rsplit("@", 1)[-1]
    text = re.sub(r":\d{1,5}$", "", text)
    text = text.lstrip("*.").strip(".")
    if not re.fullmatch(r"[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})+", text):
        raise ValueError(f"not a valid domain (need at least one dot, e.g. example.com): {value!r}")
    return text


class UnsafePathError(OSError):
    """MEMORY_DB (or its directory) is a symlink or not a regular file: refuse to touch it."""


def _open_private(path: Path):
    """Create/open the DB file without following symlinks; fchmod on the fd, never chmod(path)."""
    parent = path.parent
    # Reject symlinks anywhere in the directory chain (before creating anything).
    if os.path.realpath(parent) != os.path.abspath(parent):
        raise UnsafePathError(f"refusing memory directory reached through a symlink: {parent}")
    created = not parent.exists()
    parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if created:  # never chmod a directory the user pointed us at
        dfd = os.open(parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            os.fchmod(dfd, 0o700)
        finally:
            os.close(dfd)
    try:
        fd = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    except OSError as exc:
        if exc.errno == errno.ELOOP:
            raise UnsafePathError(f"refusing symlinked memory DB: {path}") from exc
        raise
    try:
        st = os.fstat(fd)
        if not stat.S_ISREG(st.st_mode):
            raise UnsafePathError(f"memory DB is not a regular file: {path}")
        if st.st_nlink > 1:  # hardlink to some other file: never fchmod/write it
            raise UnsafePathError(f"refusing hard-linked memory DB: {path}")
        os.fchmod(fd, 0o600)
    finally:
        os.close(fd)


class Store:
    def __init__(self, path=None, use_fts=None):
        self.path = Path(path) if path else default_db_path()
        _open_private(self.path)
        self.conn = sqlite3.connect(self.path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA secure_delete=ON")
        self.conn.executescript(SCHEMA)
        if "status" not in [r[1] for r in self.conn.execute("PRAGMA table_info(sessions)")]:
            self.conn.execute("ALTER TABLE sessions ADD COLUMN status TEXT NOT NULL DEFAULT ''")
        self.fts = detect_fts5(self.conn) if use_fts in (None, True) else False
        if self.fts:
            self._init_fts()
        self.conn.commit()

    # -- setup ---------------------------------------------------------
    def _init_fts(self):
        c = self.conn
        c.execute("CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(topic, fact)")
        c.execute("CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(goal, outcome)")
        for fts, main, cols in (("knowledge_fts", "knowledge", "topic, fact"),
                                ("sessions_fts", "sessions", "goal, outcome")):
            c.execute(f"DELETE FROM {fts} WHERE rowid NOT IN (SELECT id FROM {main})")
            c.execute(f"INSERT INTO {fts}(rowid, {cols}) SELECT id, {cols} FROM {main} "
                      f"WHERE id NOT IN (SELECT rowid FROM {fts})")

    def close(self):
        self.conn.close()

    # -- writes --------------------------------------------------------
    def start_session(self, goal) -> int:
        cur = self.conn.execute("INSERT INTO sessions(goal, started_at) VALUES (?,?)",
                                (redact_text(goal), now_iso()))
        sid = cur.lastrowid
        if self.fts:
            self.conn.execute("INSERT INTO sessions_fts(rowid, goal, outcome) SELECT id, goal, outcome "
                              "FROM sessions WHERE id=?", (sid,))
        self.conn.commit()
        return sid

    def end_session(self, session_id, outcome, iterations=0, status="done"):
        outcome = redact_text(outcome or "", 300)
        status = status if status in STATUSES else "failed"
        self.conn.execute("UPDATE sessions SET outcome=?, source='model', ended_at=?, iterations=?, status=? "
                          "WHERE id=?", (outcome, now_iso(), int(iterations), status, session_id))
        if self.fts:
            self.conn.execute("DELETE FROM sessions_fts WHERE rowid=?", (session_id,))
            self.conn.execute("INSERT INTO sessions_fts(rowid, goal, outcome) SELECT id, goal, outcome "
                              "FROM sessions WHERE id=?", (session_id,))
        self.conn.commit()

    def add_visited_url(self, url, title="", session_id=None):
        # Sanitised exactly once, here (callers pass raw values).
        self.conn.execute("INSERT INTO visited_urls(session_id, url, title, visited_at) VALUES (?,?,?,?)",
                          (session_id, sanitize_url(url), redact_text(title or ""), now_iso()))
        self.conn.commit()

    def add_tool_call(self, session_id, tool, action, redacted_input, ok):
        self.conn.execute(
            "INSERT INTO tool_calls(session_id, tool, action, redacted_input, ok, called_at) VALUES (?,?,?,?,?,?)",
            (session_id, redact_text(tool, 80), redact_text(action, 80),
             redact_text(redacted_input), 1 if ok else 0, now_iso()))
        self.conn.commit()

    def add_knowledge(self, topic, fact, source="user", confidence=1.0) -> int:
        cur = self.conn.execute(
            "INSERT INTO knowledge(topic, fact, source, confidence, created_at) VALUES (?,?,?,?,?)",
            (redact_text(topic, 200), redact_text(fact), source, float(confidence), now_iso()))
        kid = cur.lastrowid
        if self.fts:
            self.conn.execute("INSERT INTO knowledge_fts(rowid, topic, fact) SELECT id, topic, fact "
                              "FROM knowledge WHERE id=?", (kid,))
        self.conn.commit()
        return kid

    def set_preference(self, key, value, source="user"):
        self.conn.execute(
            "INSERT INTO preferences(key, value, source, updated_at) VALUES (?,?,?,?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value, source=excluded.source, "
            "updated_at=excluded.updated_at",
            (redact_text(key, 100), redact_text(value, 300), source, now_iso()))
        self.conn.commit()

    # -- reads ---------------------------------------------------------
    def list_knowledge(self, source=None, limit=100):
        sql, args = "SELECT * FROM knowledge", []
        if source:
            sql += " WHERE source=?"
            args.append(source)
        rows = self.conn.execute(sql + " ORDER BY id DESC LIMIT ?", (*args, limit)).fetchall()
        return [dict(r) for r in rows]

    def list_preferences(self, source=None):
        sql, args = "SELECT * FROM preferences", []
        if source:
            sql += " WHERE source=?"
            args.append(source)
        return [dict(r) for r in self.conn.execute(sql + " ORDER BY key", args)]

    def recent_sessions(self, limit=20, with_outcome=False):
        sql = "SELECT * FROM sessions" + (" WHERE outcome != ''" if with_outcome else "")
        return [dict(r) for r in self.conn.execute(sql + " ORDER BY id DESC LIMIT ?", (limit,))]

    def search_knowledge(self, query, limit=10, source=None):
        return self._search("knowledge", "knowledge_fts", ("topic", "fact"), query, limit, source)

    def search_sessions(self, query, limit=5):
        return self._search("sessions", "sessions_fts", ("goal", "outcome"), query, limit, None,
                            extra="outcome != '' AND source='model'")

    def _search(self, table, fts_table, cols, query, limit, source, extra=None):
        terms = query_terms(query)
        if not terms:
            return []
        conds, args = [], []
        if source:
            conds.append("source=?")
            args.append(source)
        if extra:
            conds.append(extra)
        if self.fts:
            match = " OR ".join(f'"{t}"' for t in terms)
            ranked = self.conn.execute(
                f"SELECT rowid FROM {fts_table} WHERE {fts_table} MATCH ? ORDER BY rank LIMIT 200", (match,)
            ).fetchall()
            ids = [r[0] for r in ranked]
            if not ids:
                return []
            marks = ",".join("?" * len(ids))
            sql = f"SELECT * FROM {table} t WHERE t.id IN ({marks})" + "".join(f" AND {c}" for c in conds)
            by_id = {r["id"]: dict(r) for r in self.conn.execute(sql, (*ids, *args))}
            return [by_id[i] for i in ids if i in by_id][:limit]
        like = " OR ".join(f"({cols[0]} LIKE ? ESCAPE '\\' OR {cols[1]} LIKE ? ESCAPE '\\')" for _ in terms)
        params = [p for t in terms for p in (f"%{_like_escape(t)}%",) * 2]
        sql = f"SELECT * FROM {table} WHERE ({like})" + "".join(f" AND {c}" for c in conds)
        rows = [dict(r) for r in self.conn.execute(sql + " ORDER BY id DESC LIMIT 200", (*params, *args))]

        def score(row):
            blob = f"{row[cols[0]]} {row[cols[1]]}".lower()
            return sum(t in blob for t in terms)
        rows.sort(key=score, reverse=True)  # stable: ties stay newest-first
        return rows[:limit]

    # -- retention / forgetting ---------------------------------------
    def prune(self, max_tool_calls=500, max_sessions=200, max_urls=1000, retention_days=90, now=None):
        cutoff = now_iso((now if now is not None else time.time()) - retention_days * 86400)
        c, removed = self.conn, {}

        def trim(table, col, keep):
            n = c.execute(f"DELETE FROM {table} WHERE {col} < ?", (cutoff,)).rowcount
            n += c.execute(f"DELETE FROM {table} WHERE id NOT IN "
                           f"(SELECT id FROM {table} ORDER BY id DESC LIMIT ?)", (max(keep, 0),)).rowcount
            removed[table] = n
        trim("tool_calls", "called_at", max_tool_calls)
        trim("visited_urls", "visited_at", max_urls)
        trim("sessions", "started_at", max_sessions)
        # Only model-sourced knowledge ages out; human notes are kept until forgotten.
        removed["knowledge"] = c.execute("DELETE FROM knowledge WHERE source!='user' AND created_at < ?",
                                         (cutoff,)).rowcount
        c.execute("DELETE FROM tool_calls WHERE session_id IS NOT NULL AND session_id NOT IN (SELECT id FROM sessions)")
        c.execute("DELETE FROM visited_urls WHERE session_id IS NOT NULL AND session_id NOT IN (SELECT id FROM sessions)")
        if self.fts:
            self._init_fts()
        c.commit()
        return removed

    def forget_all(self):
        counts = {t: self.conn.execute(f"DELETE FROM {t}").rowcount for t in TABLES}
        if self.fts:
            self.conn.execute("DELETE FROM knowledge_fts")
            self.conn.execute("DELETE FROM sessions_fts")
        self.conn.commit()
        self._vacuum()
        return counts

    def forget_session(self, session_id):
        counts = self._delete_session_rows(session_id)
        self.conn.commit()
        self._vacuum()
        return counts

    def _delete_session_rows(self, session_id):
        c = self.conn
        counts = {"tool_calls": c.execute("DELETE FROM tool_calls WHERE session_id=?", (session_id,)).rowcount,
                  "visited_urls": c.execute("DELETE FROM visited_urls WHERE session_id=?", (session_id,)).rowcount,
                  "sessions": c.execute("DELETE FROM sessions WHERE id=?", (session_id,)).rowcount}
        if self.fts:
            c.execute("DELETE FROM sessions_fts WHERE rowid=?", (session_id,))
        return counts

    def forget_url_domain(self, domain):
        """Delete visits to the domain (and subdomains), every session that made such a visit
        (with its tool calls and URLs), and any tool call whose input mentions the host."""
        domain = normalize_domain(domain)

        def on_domain(host):
            host = host.lower().strip(".")
            return host == domain or host.endswith("." + domain)
        c = self.conn
        url_ids, session_ids = [], set()
        for row in c.execute("SELECT id, session_id, url FROM visited_urls"):
            try:
                host = urlsplit(row["url"]).hostname or ""
            except ValueError:
                continue
            if on_domain(host):
                url_ids.append(row["id"])
                if row["session_id"] is not None:
                    session_ids.add(row["session_id"])
        counts = {"domain": domain, "visited_urls": 0, "sessions": 0, "tool_calls": 0}
        for sid in session_ids:
            for key, n in self._delete_session_rows(sid).items():
                counts[key] += n
        for uid in url_ids:
            counts["visited_urls"] += c.execute("DELETE FROM visited_urls WHERE id=?", (uid,)).rowcount
        call_ids = [r["id"] for r in c.execute("SELECT id, redacted_input FROM tool_calls")
                    if any(on_domain(tok) for tok in re.findall(r"[A-Za-z0-9][A-Za-z0-9.-]*", r["redacted_input"]))]
        for cid in call_ids:
            counts["tool_calls"] += c.execute("DELETE FROM tool_calls WHERE id=?", (cid,)).rowcount
        c.commit()
        self._vacuum()
        return counts

    def forget_fact(self, fact_id):
        n = self.conn.execute("DELETE FROM knowledge WHERE id=?", (fact_id,)).rowcount
        if self.fts:
            self.conn.execute("DELETE FROM knowledge_fts WHERE rowid=?", (fact_id,))
        self.conn.commit()
        self._vacuum()
        return {"knowledge": n}

    def _vacuum(self):
        try:
            self.conn.execute("VACUUM")
        except sqlite3.Error:
            pass

    # -- misc ----------------------------------------------------------
    def stats(self):
        out = {t: self.conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in TABLES}
        out.update(db_path=str(self.path), fts5=self.fts,
                   db_bytes=self.path.stat().st_size if self.path.exists() else 0)
        return out

    def export(self):
        return {t: [dict(r) for r in self.conn.execute(f"SELECT * FROM {t} ORDER BY 1")] for t in TABLES}
