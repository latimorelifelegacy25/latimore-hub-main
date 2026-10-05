"""Redaction helpers. Everything written to the memory DB goes through here.

Standard library only. The guiding rule: store metadata, never raw content.

Performance rule: every regex here is linear-time. Untrusted input is truncated to
MAX_INPUT characters before any regex runs, every quantifier is bounded (<= ~200), and
quantifiers that cannot usefully backtrack are possessive. Key *names* are classified in
Python (word sets), not with regex alternations, so there is no `[\\w-]*(?:a|b)[\\w-]*` shape.
"""
import json
import re
import unicodedata
from urllib.parse import unquote, urlsplit, urlunsplit

MAX_LEN = 500
MAX_INPUT = 20_000
REDACTED = "[REDACTED]"

# Tool-argument NAMES whose values are never stored (names come from the model, so be broad).
SENSITIVE_KEY_RE = re.compile(
    r"password|passwd|passw|pass|pwd|secret|token|key|card|cvv|cvc|ssn|auth|credential|pw|pin|otp|cookie|session",
    re.I)
# Tools that type user-supplied text into pages: only locator-ish args survive.
TYPING_TOOL_RE = re.compile(r"fill|type|typing", re.I)
LOCATOR_KEYS = {"selector", "ref", "element"}

_STRONG_WORDS = {"password", "passwords", "passwd", "passw0rd", "passphrase", "passcode", "secret", "secrets",
                 "credential", "credentials", "apikey", "cvv", "cvc", "ssn", "pwd", "pw"}
_STRONG_PAIRS = {("api", "key"), ("access", "key"), ("private", "key"), ("secret", "key"), ("client", "secret")}
_WEAK_LONG = {"token", "tokens", "cookie", "session", "auth", "authorization", "bearer"}  # need >=8 chars + digit
_WEAK_SHORT = {"pin", "otp", "pass"}  # need >=4 chars + digit
_WORD_SPLIT_RE = re.compile(r"[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+")

_VALUE = r"\"[^\"]{0,200}\"|'[^']{0,200}'|[^\s,;&}\]\[\"']{1,200}"

# Token formats: (name, regex, validator or None). Validator False => leave the match alone.
def _openai_ok(m):
    rest = m.group(0)[3:]
    if rest.startswith(("proj-", "svcacct-", "admin-")):
        return True
    return not re.fullmatch(r"[a-z]+(?:-[a-z]+)+", rest)  # hyphenated lowercase words: a slug, not a key


SECRET_PATTERNS = [
    ("jwt", re.compile(r"\beyJ[\w-]{5,200}+\.[\w-]{5,1000}+\.[\w-]{0,400}+"), None),
    ("anthropic-key", re.compile(r"\bsk-ant-[\w-]{8,200}+"), None),
    ("openai-key", re.compile(r"\bsk-(?:proj-|svcacct-|admin-)?[\w-]{8,200}+"), _openai_ok),
    ("stripe-key", re.compile(r"\b[sr]k_(?:live|test)_[A-Za-z0-9]{8,200}+"), None),
    ("npm-token", re.compile(r"\bnpm_[A-Za-z0-9]{8,200}+"), None),
    ("huggingface-token", re.compile(r"\bhf_[A-Za-z0-9]{8,200}+"), None),
    ("google-key", re.compile(r"\bAIza[\w-]{30,200}+"), None),
    ("github-token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,200}+|github_pat_\w{20,200}+)"), None),
    ("slack-token", re.compile(r"\bxox[abposr]-[A-Za-z0-9-]{10,200}+"), None),
    ("aws-access-key", re.compile(r"\b(?:AKIA|ASIA|AGPA|AIDA|AROA)[0-9A-Z]{16}\b"), None),
    ("bearer-token", re.compile(r"\bBearer[ \t]{1,5}[\w.~+/=-]{8,500}+", re.I), None),
]
_PEM_RE = re.compile(r"-----BEGIN [A-Z ]{0,40}PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]{0,40}PRIVATE KEY-----|\Z)")
_COOKIE_RE = re.compile(r"cookie:[ \t]{0,3}([^\n]{1,500})", re.I)
_AUTH_COLON_RE = re.compile(r"\bauthorization[ \t]{0,3}[:=][ \t]{0,3}(?:(?:basic|token)[ \t]{1,3})?[\w.~+/=-]{6,200}+", re.I)
_AUTH_SCHEME_RE = re.compile(r"\bauthorization[ \t]{1,3}(?:basic|bearer|token)[ \t]{1,3}[\w.~+/=-]{6,200}+", re.I)
_URL_CREDS_RE = re.compile(r"(?<=://)[^\s/@:]{1,100}+:[^\s/@]{1,100}+(?=@)")
_KV_RE = re.compile(r"(?P<k>(?:--?)?[\"']?[\w.-]{1,40}+[\"']?)(?P<sep>[ \t]{0,3}[=:][ \t]{0,3})(?P<v>" + _VALUE + r")")
_FLAG_RE = re.compile(r"(?P<k>--?[\w.-]{1,40}+)(?P<sep>[ \t]{1,3})(?P<v>[^\s,;&}\]\[\"']{1,200})")
_PROSE_RE = re.compile(
    r"\b(?P<w>passphrase|passcode|password|passwd|pass|pin|otp|cvv|cvc|"
    r"(?:2fa|mfa|verification|security|recovery|backup)[ \t]{1,3}code)\b"
    r"(?P<c>[ \t]{0,3}(?:(?:is|was)[ \t]{1,3}|[:=][ \t]{0,3})|[ \t]{1,3})(?P<v>[^\s,;]{1,100})", re.I)
_PHRASE_RE = re.compile(r"(\b(?:seed|recovery)[ \t]{1,3}(?:phrase|words?)\b(?:[ \t]{0,3}(?:is|was|:|=)){1,2}[ \t]{0,3})[^\n]{1,200}", re.I)
_SSN_RE = re.compile(r"(?<!\d)(?!000|666|9\d\d)\d{3}[ .-]\d{2}[ .-]\d{4}(?!\d)")
_SSN_CONTEXT_RE = re.compile(r"((?:ssn|social[ \t]{1,5}security)(?:(?!\d).){0,20}?)(?<!\d)\d{3}[ .-]?\d{2}[ .-]?\d{4}(?!\d)", re.I)
_ID_BEFORE_RE = re.compile(r"\b(?:id|order|ref|invoice|ticket|tracking|no)\.?[ \t]{0,3}#?[ \t]{0,3}$", re.I)
_CARD_RE = re.compile(r"(?<!\d)\d(?:[ .-]?\d){12,60}")
_CARD_WORD = r"(?:card|cc|credit)"
_CARD_AFTER_WORD_RE = re.compile(r"(\b" + _CARD_WORD + r"\b[^\d]{0,12})((?<!\d)\d(?:[ .-]?\d){12,18}+)(?!\d)", re.I)
_CARD_BEFORE_WORD_RE = re.compile(r"((?<!\d)\d(?:[ .-]?\d){12,18}+)([^\d]{0,12}\b" + _CARD_WORD + r"\b)", re.I)
_URL_RE = re.compile(r"https?://[^\s\"'<>]{1,2000}+", re.I)
_ENV_ASSIGN_RE = re.compile(r"[A-Za-z_]\w{0,60}+=")
_TOKEN_PREFIX_RE = re.compile(r"(?:sk-|sk_live_|sk_test_|rk_live_|ghp_|gho_|ghu_|ghs_|ghr_|github_pat_|AKIA|ASIA|npm_|hf_|xox|eyJ|AIza)")
_SPACED_TOKEN_RE = re.compile(r"(?:sk-|sk_live_|sk_test_|ghp_|github_pat_|AKIA|npm_|hf_|xox|eyJ|AIza)(?:[A-Za-z0-9_-]|[ ](?=[A-Za-z0-9_-])){0,80}+")
_TOKEN_ANYWHERE_RE = re.compile(
    r"(?:ghp_|gho_|ghs_|ghu_|ghr_|github_pat_|sk-|sk_live_|sk_test_|npm_|hf_|xox[abprs]-|AKIA|ASIA|AIza|eyJ)[A-Za-z0-9_-]{8,200}+")
_SAFE_LONG_PROGRAM_RE = re.compile(r"(?:python|pip|ruby|perl|php|node|sha\d+sum|md5sum|base64|b2sum)[\d.]*")
_PROGRAM_RE = re.compile(r"[A-Za-z][A-Za-z0-9_.+-]{0,39}")

RULE_NAMES = [n for n, _, _ in SECRET_PATTERNS] + [
    "pem-private-key", "cookie-header", "authorization-header (+scheme without colon)", "url-credentials",
    "key/value & JSON secrets (word-classified keys, value criteria)", "cli flags", "prose password/pin/cvv/otp/codes",
    "seed/recovery phrase", "us-ssn (+context)", "card-number (luhn / card-word / luhn+extra digits)",
    "url-query-stripped", "sensitive-arg-key", "typing-tool-values",
    "unicode-normalize+Cf-strip+url-decode", "spaced token run at string start"]


def luhn_ok(digits: str) -> bool:
    total, alt = 0, False
    for ch in reversed(digits):
        d = int(ch)
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        alt = not alt
    return total % 10 == 0


def _card_sub(match):
    d = re.sub(r"\D", "", match.group(0))
    if 13 <= len(d) <= 19 and luhn_ok(d):
        return REDACTED
    if len(d) > 19:  # Luhn-valid number followed/preceded by extra digits
        for n in range(19, 12, -1):
            if luhn_ok(d[:n]) or luhn_ok(d[-n:]):
                return REDACTED
    return match.group(0)


def _card_word_sub(group_with_digits):
    def sub(m):
        digits = re.sub(r"\D", "", m.group(group_with_digits))
        if not 13 <= len(digits) <= 19:
            return m.group(0)
        other = m.group(3 - group_with_digits)
        return (other + REDACTED) if group_with_digits == 2 else (REDACTED + other)
    return sub


def _truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: max(limit - 1, 0)] + "…"


def _normalize(value) -> str:
    """Truncate, NFKC, drop format chars (zero-width, soft hyphen), URL-decode once, neutralise control chars."""
    text = (value if isinstance(value, str) else str(value))[:MAX_INPUT]
    text = unicodedata.normalize("NFKC", text)[:MAX_INPUT]
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Cf")
    text = unquote(text)
    text = "".join(ch for ch in unicodedata.normalize("NFKC", text)[:MAX_INPUT] if unicodedata.category(ch) != "Cf")
    return "".join(" " if (unicodedata.category(ch) == "Cc" and ch != "\n") else ch for ch in text)


def sanitize_url(url, limit: int = MAX_LEN) -> str:
    """Return scheme://host[:port] only: no path, userinfo, query, or fragment."""
    text = _normalize(str(url or "")[:4000]).replace("\n", " ").strip()
    try:
        parts = urlsplit(text)
        host = parts.hostname or ""
        port = parts.port
        netloc = host + (f":{port}" if port else "")
        clean = urlunsplit((parts.scheme, netloc, "", "", "")) if host else ""
    except ValueError:
        clean = ""
    return _truncate(clean, limit)


def _strip_url_query(match):
    """For URLs inside free text: keep scheme/host/path, drop userinfo, query, fragment."""
    try:
        p = urlsplit(match.group(0))
        netloc = (p.hostname or "") + (f":{p.port}" if p.port else "")
        return urlunsplit((p.scheme, netloc, p.path, "", ""))
    except ValueError:
        return match.group(0).split("#")[0].split("?")[0]


def _key_level(key: str):
    """'strong' | 'weak' | None for a key NAME, judged by whole words (so 'secretary', 'tokenizer',
    'passport', 'keyboard', 'pinterest' are not secrets)."""
    words = [w.lower() for w in _WORD_SPLIT_RE.findall(key)]
    if not words:
        return None
    if any(w in _STRONG_WORDS for w in words) or any(p in _STRONG_PAIRS for p in zip(words, words[1:])):
        return "strong"
    if "pass" in words and len(words) > 1:  # db_pass, user_pass
        return "strong"
    if any(w in _WEAK_LONG or w in _WEAK_SHORT for w in words):
        return "weak"
    return None


def _weak_value_ok(key: str, val: str) -> bool:
    words = {w.lower() for w in _WORD_SPLIT_RE.findall(key)}
    has_digit = any(c.isdigit() for c in val)
    if words & _WEAK_LONG:
        return len(val) >= 8 and has_digit
    return len(val) >= 4 and has_digit


def _kv_sub(match):
    k, v = match.group("k"), match.group("v")
    key = k.lstrip("-").strip("\"'")
    level = _key_level(key)
    if not level or v.startswith("[REDACTED"):
        return match.group(0)
    quoted_val = v[:1] in "\"'"
    val = v.strip("\"'")
    if k[-1:] in "\"'" and quoted_val:  # structured (JSON-like): always
        ok = True
    elif level == "strong":
        ok = len(val) >= 1
    else:
        ok = _weak_value_ok(key, val)
    return f"{k}{match.group('sep')}{REDACTED}" if ok else match.group(0)


def _prose_sub(match):
    w = re.sub(r"\s+", " ", match.group("w").lower())
    v = match.group("v")
    if v.startswith("[REDACTED"):
        return match.group(0)
    explicit = bool(match.group("c").strip())
    digit = any(c.isdigit() for c in v)
    if w in ("cvv", "cvc"):
        ok = re.fullmatch(r"\d{3,4}", v) is not None
    elif w == "security code":
        ok = re.fullmatch(r"\d{3,8}", v) is not None
    elif w in ("pin", "otp", "pass") or w.endswith(" code"):
        ok = (digit and len(v) >= 4) or (explicit and w.split()[0] in ("recovery", "backup"))
    else:  # password / passwd / passphrase / passcode
        ok = (explicit and len(v) >= 1) or (digit and len(v) >= 4)
    return match.group(0)[: match.start("v") - match.start()] + REDACTED if ok else match.group(0)


def _ssn_sub(match):
    before = match.string[max(0, match.start() - 14): match.start()]
    return match.group(0) if _ID_BEFORE_RE.search(before) else REDACTED


def _sub_validated(pattern, validator):
    return lambda m: REDACTED if validator is None or validator(m) else m.group(0)


def _redact_leading_spaced_token(text: str) -> str:
    """A token split by spaces is only handled at the very start of the string: redact that run only."""
    stripped = text.lstrip()
    m = _SPACED_TOKEN_RE.match(stripped)
    if not m or " " not in m.group(0):
        return text
    run = m.group(0)
    collapsed = run.replace(" ", "")
    tail = collapsed[len(_TOKEN_PREFIX_RE.match(collapsed).group(0)):] if _TOKEN_PREFIX_RE.match(collapsed) else ""
    strong = any(p.match(collapsed) and (v is None or v(p.match(collapsed))) for _, p, v in SECRET_PATTERNS)
    if strong and (any(c.isdigit() or c.isupper() for c in tail)):
        return REDACTED + stripped[len(run):]
    return text


def _redact_core(text: str) -> str:
    text = _redact_leading_spaced_token(text)
    text = _PEM_RE.sub(REDACTED, text)
    text = _URL_RE.sub(_strip_url_query, text)
    for _, pattern, validator in SECRET_PATTERNS:
        text = pattern.sub(_sub_validated(pattern, validator), text)
    text = _COOKIE_RE.sub(lambda m: m.group(0) if not ("=" in m.group(1) or any(c.isdigit() for c in m.group(1)))
                          or m.group(1).startswith("[REDACTED") else "Cookie: " + REDACTED, text)
    text = _AUTH_COLON_RE.sub(REDACTED, text)
    text = _AUTH_SCHEME_RE.sub(REDACTED, text)
    text = _URL_CREDS_RE.sub(REDACTED, text)
    text = _KV_RE.sub(_kv_sub, text)
    text = _FLAG_RE.sub(_kv_sub, text)
    text = _PROSE_RE.sub(_prose_sub, text)
    text = _PHRASE_RE.sub(lambda m: m.group(1) + REDACTED, text)
    text = _SSN_CONTEXT_RE.sub(lambda m: m.group(1) + REDACTED, text)
    text = _SSN_RE.sub(_ssn_sub, text)
    text = _CARD_AFTER_WORD_RE.sub(_card_word_sub(2), text)
    text = _CARD_BEFORE_WORD_RE.sub(_card_word_sub(1), text)
    return _CARD_RE.sub(_card_sub, text)


def redact_text(value, limit: int = MAX_LEN) -> str:
    """Redact secrets in any string, then truncate to `limit` characters."""
    text = _redact_core(_normalize(value))
    return _truncate(re.sub(r"\s+", " ", text).strip(), limit)


def shell_summary(command):
    """(program basename or 'shell', argument count). Arguments are never kept.

    Anything we cannot parse with certainty yields the literal 'shell'.
    """
    text = _normalize(str(command or "")[:MAX_INPUT]).replace("\n", " ").strip()
    rest = text
    while True:
        m = _ENV_ASSIGN_RE.match(rest)
        if not m:
            break
        raw_value = rest[m.end():].split(None, 1)[0] if rest[m.end():].strip() else ""
        if any(ch in raw_value for ch in "\\$`\"'"):
            return "shell", len(text.split())
        rest = rest[m.end() + len(raw_value):].lstrip()
    head, _, tail = rest.partition(" ")
    argc = len(tail.split())
    name = head.rsplit("/", 1)[-1]
    if (not _PROGRAM_RE.fullmatch(name) or _TOKEN_ANYWHERE_RE.search(name) or _secret_hit(name)
            or (len(name) >= 8 and any(c.isdigit() for c in name) and not _SAFE_LONG_PROGRAM_RE.fullmatch(name))):
        return "shell", argc
    return name, argc


def _secret_hit(name: str) -> bool:
    return redact_text(name, 100) != name


def redact_shell_command(command, limit: int = 200) -> str:
    program, argc = shell_summary(command)
    return f"{program} (+{argc} args)"


def tool_action(tool: str, args) -> str:
    """Short action name: program for shell, tool suffix for browser tools."""
    if tool == "run_shell":
        command = (args or {}).get("command", "") if isinstance(args, dict) else ""
        return shell_summary(command)[0]
    return redact_text(str(tool).removeprefix("browser_"), 60)


def redact_tool_input(tool: str, args) -> dict:
    """Return a JSON-safe dict of tool arguments with sensitive values removed."""
    if not isinstance(args, dict):
        return {}
    out = {}
    typing = bool(TYPING_TOOL_RE.search(str(tool)))
    for key, value in args.items():
        key = redact_text(str(key)[:200], 60)
        if tool == "run_shell" and key == "command":
            program, argc = shell_summary(value)
            out["program"], out["argc"] = program, argc
        elif typing and key not in LOCATOR_KEYS:
            out[key] = REDACTED
        elif SENSITIVE_KEY_RE.search(key):
            out[key] = REDACTED
        elif key == "url" or key.endswith("_url"):
            out[key] = sanitize_url(value)
        elif isinstance(value, (bool, int, float)) or value is None:
            out[key] = value
        elif isinstance(value, str):
            out[key] = redact_text(value)
        else:
            out[key] = redact_text(json.dumps(value, default=str)[:MAX_INPUT])
    return out


def redacted_input_json(tool: str, args) -> str:
    return _truncate(json.dumps(redact_tool_input(tool, args), default=str), MAX_LEN)
