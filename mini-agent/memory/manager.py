"""Failure-proof facade used by agent.py. Memory problems never crash a run."""
import os
import sys

from .recall import build_memory_block
from .redact import redacted_input_json, tool_action
from .store import Store

DEFAULTS = {"MEMORY_MAX_TOOL_CALLS": 500, "MEMORY_MAX_SESSIONS": 200,
            "MEMORY_MAX_URLS": 1000, "MEMORY_RETENTION_DAYS": 90}


def env_int(name: str) -> int:
    try:
        return int(os.getenv(name, DEFAULTS[name]))
    except ValueError:
        return DEFAULTS[name]


def warn(exc) -> None:
    print(f"[memory] warning: {type(exc).__name__}: {str(exc)[:100]} (continuing without it)",
          file=sys.stderr)


class NullMemory:
    """Used when memory is off or failed to open: every call is a no-op."""
    enabled = False

    def recall_block(self, goal): return ""
    def log_tool(self, tool, args, ok): pass
    def log_url(self, url, title=""): pass
    def end(self, outcome, iterations, status="done"): pass


NULL = NullMemory()


class SessionMemory(NullMemory):
    enabled = True

    def __init__(self, store, session_id):
        self.store, self.session_id = store, session_id

    def recall_block(self, goal):
        try:
            return build_memory_block(goal, self.store)
        except Exception as exc:
            warn(exc)
            return ""

    def log_tool(self, tool, args, ok):
        try:
            self.store.add_tool_call(self.session_id, tool, tool_action(tool, args),
                                     redacted_input_json(tool, args), bool(ok))
        except Exception as exc:
            warn(exc)

    def log_url(self, url, title=""):
        try:
            self.store.add_visited_url(url, title or "", self.session_id)  # Store sanitises once
        except Exception as exc:
            warn(exc)

    def end(self, outcome, iterations, status="done"):
        try:
            self.store.end_session(self.session_id, outcome, iterations, status)
            self.store.close()
        except Exception as exc:
            warn(exc)


def start_session(goal):
    """Open the DB, prune old rows, start a session. Returns NULL on any failure."""
    try:
        store = Store()
        store.prune(env_int("MEMORY_MAX_TOOL_CALLS"), env_int("MEMORY_MAX_SESSIONS"),
                    env_int("MEMORY_MAX_URLS"), env_int("MEMORY_RETENTION_DAYS"))
        return SessionMemory(store, store.start_session(goal))
    except Exception as exc:
        warn(exc)
        return NULL
