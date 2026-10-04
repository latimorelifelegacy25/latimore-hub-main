"""Tool implementations: shell, Playwright browser, and agent memory.

One browser instance is shared for the whole run, like tabs you keep open.
Blocking work runs in threads so front-ends (e.g. the Telegram bot) stay
responsive while a long shell command or page load is in flight.
"""
import asyncio
import base64
import os
import subprocess

from playwright.sync_api import sync_playwright

from memory import append_memory

_HERE = os.path.dirname(os.path.abspath(__file__))
_SHOT_DIR = os.path.join(_HERE, "shots")
os.makedirs(_SHOT_DIR, exist_ok=True)
_shot_n = 0

_pw = sync_playwright().start()
_browser = _pw.chromium.launch(headless=True)
_page = _browser.new_page(viewport={"width": 1280, "height": 800})

# Ref map from the last accessibility snapshot: ref -> (role, name)
_last_refs: dict = {}

INTERACTIVE_ROLES = {
    "button", "link", "textbox", "checkbox", "radio", "combobox",
    "listbox", "menuitem", "menuitemcheckbox", "menuitemradio",
    "tab", "switch", "slider", "searchbox",
}


# ---------------------------------------------------------------- shell ---
async def run_shell(command: str, hooks) -> str:
    """Run a shell command, return combined stdout/stderr (truncated)."""
    if not await hooks.confirm_shell(command):
        return "User declined to run the command."

    def _run() -> str:
        try:
            p = subprocess.run(
                command, shell=True, capture_output=True, text=True, timeout=120
            )
            out = ((p.stdout or "") + (p.stderr or ""))[-8000:]
            return out or f"(exit code {p.returncode}, no output)"
        except subprocess.TimeoutExpired:
            return "Command timed out after 120 seconds."
        except Exception as e:  # noqa: BLE001 - surface it to the agent plainly
            return f"Error running command: {e}"

    return await asyncio.to_thread(_run)


# -------------------------------------------------------------- browser ---
# (sync implementations below; run_tool wraps them in threads)


def _goto(url: str) -> str:
    _page.goto(url, wait_until="domcontentloaded", timeout=30_000)
    return f"Opened {url}. Page title: {_page.title()!r}"


def _click(selector: str) -> str:
    _page.locator(selector).first.click(timeout=10_000)
    return f"Clicked {selector}."


def _click_ref(ref: int) -> str:
    _resolve_ref(ref).first.click(timeout=10_000)
    return f"Clicked element [{ref}]."


def _press(key: str) -> str:
    _page.keyboard.press(key)
    return f"Pressed {key}."


def _text() -> str:
    return _page.inner_text("body")[:8000]


def _screenshot() -> tuple:
    """Returns (message, base64_png, file_path)."""
    global _shot_n
    _shot_n += 1
    path = os.path.join(_SHOT_DIR, f"shot-{_shot_n}.png")
    _page.screenshot(path=path)
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    return f"Screenshot saved to {path}.", b64, path


def _snapshot() -> str:
    """Numbered list of interactive elements from the accessibility tree."""
    global _last_refs
    try:
        tree = _page.accessibility.snapshot()
    except Exception as e:  # noqa: BLE001
        return f"Could not capture accessibility snapshot: {e}"
    lines = []
    _last_refs = {}
    counter = 0

    def walk(node):
        nonlocal counter
        role = node.get("role") or ""
        name = (node.get("name") or "").strip()
        if role in INTERACTIVE_ROLES:
            counter += 1
            _last_refs[counter] = (role, name)
            lines.append(f'[{counter}] {role} "{name}"' if name else f"[{counter}] {role}")
        for child in node.get("children") or []:
            walk(child)

    if tree:
        walk(tree)
    if not lines:
        return "No interactive elements found in the accessibility snapshot."
    return "\n".join(lines)[:6000]


def _resolve_ref(ref: int):
    """Rebuild the ref map fresh and return a locator for that ref."""
    _snapshot()  # refresh _last_refs against the live page
    if ref not in _last_refs:
        raise ValueError(
            f"Unknown element ref [{ref}]. Take a fresh browser_snapshot first."
        )
    role, name = _last_refs[ref]
    loc = _page.get_by_role(role, name=name) if name else _page.get_by_role(role)
    return loc


def _looks_like_login(locator) -> bool:
    """Heuristic: is this field part of a login form (password input nearby)?"""
    try:
        html = locator.first.evaluate(
            "el => (el.form ? el.form.outerHTML : el.outerHTML).slice(0, 3000)"
        )
    except Exception:
        return False
    h = (html or "").lower()
    return (
        'type="password"' in h
        or "current-password" in h
        or "new-password" in h
    )


async def _guarded_fill(field_desc: str, locator_factory, text: str, hooks) -> dict:
    """Fill a field, asking for approval first if it looks like a login form."""
    def _prepare():
        loc = locator_factory()
        return loc, _looks_like_login(loc)

    loc, login = await asyncio.to_thread(_prepare)
    if login:
        if not await hooks.confirm_fill(field_desc):
            return {"text": "User declined to fill the login field."}
    await asyncio.to_thread(lambda: loc.first.fill(text, timeout=10_000))
    return {"text": f"Filled {field_desc}."}


# ------------------------------------------------------------ dispatch ---
def _fn(name, description, properties, required):
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
            },
        },
    }


TOOL_SCHEMAS = [
    _fn(
        "run_shell",
        "Run a shell command on the Linux computer. Returns stdout/stderr.",
        {"command": {"type": "string", "description": "The shell command to run."}},
        ["command"],
    ),
    _fn(
        "browser_goto",
        "Navigate the browser to a URL.",
        {"url": {"type": "string"}},
        ["url"],
    ),
    _fn(
        "browser_snapshot",
        "List the page's interactive elements (buttons, links, inputs) as numbered "
        'refs like [3]. Prefer browser_click_ref / browser_fill_ref over guessing '
        "CSS selectors.",
        {},
        [],
    ),
    _fn(
        "browser_click",
        "Click an element, addressed by a CSS selector (e.g. 'button.login', '#submit').",
        {"selector": {"type": "string"}},
        ["selector"],
    ),
    _fn(
        "browser_click_ref",
        "Click the element with this ref number from the last browser_snapshot.",
        {"ref": {"type": "integer"}},
        ["ref"],
    ),
    _fn(
        "browser_fill",
        "Type text into an input field addressed by a CSS selector. Login fields "
        "ask the user for approval first (the value is never shown to them).",
        {
            "selector": {"type": "string"},
            "text": {"type": "string"},
        },
        ["selector", "text"],
    ),
    _fn(
        "browser_fill_ref",
        "Type text into the element with this ref number from the last "
        "browser_snapshot. Login fields ask the user for approval first "
        "(the value is never shown to them).",
        {
            "ref": {"type": "integer"},
            "text": {"type": "string"},
        },
        ["ref", "text"],
    ),
    _fn(
        "browser_press",
        "Press a keyboard key, e.g. Enter, Escape, Tab.",
        {"key": {"type": "string"}},
        ["key"],
    ),
    _fn(
        "browser_text",
        "Return the visible text of the current page.",
        {},
        [],
    ),
    _fn(
        "browser_screenshot",
        "Take a screenshot so you can SEE the page. Call this after navigation, clicks, and form fills.",
        {},
        [],
    ),
    _fn(
        "save_memory",
        "Save a durable note to your persistent memory file. Use it for facts the "
        "user would want you to remember across tasks (preferences, things that "
        "worked, details they gave you).",
        {"note": {"type": "string"}},
        ["note"],
    ),
]


async def run_tool(name: str, args: dict, hooks, session=None) -> dict:
    """Execute one tool call. Always returns {'text': ..., 'image_base64'?: ...}."""
    try:
        if name == "run_shell":
            return {"text": await run_shell(args["command"], hooks)}
        if name == "browser_goto":
            return {"text": await asyncio.to_thread(_goto, args["url"])}
        if name == "browser_snapshot":
            return {"text": await asyncio.to_thread(_snapshot)}
        if name == "browser_click":
            return {"text": await asyncio.to_thread(_click, args["selector"])}
        if name == "browser_click_ref":
            return {"text": await asyncio.to_thread(_click_ref, args["ref"])}
        if name == "browser_fill":
            selector = args["selector"]
            return await _guarded_fill(
                f"field {selector!r}",
                lambda: _page.locator(selector),
                args["text"],
                hooks,
            )
        if name == "browser_fill_ref":
            ref = args["ref"]
            return await _guarded_fill(
                f"element [{ref}]",
                lambda: _resolve_ref(ref),
                args["text"],
                hooks,
            )
        if name == "browser_press":
            return {"text": await asyncio.to_thread(_press, args["key"])}
        if name == "browser_text":
            return {"text": await asyncio.to_thread(_text)}
        if name == "browser_screenshot":
            text, b64, path = await asyncio.to_thread(_screenshot)
            await hooks.shot(path)
            if session is not None:
                session.log_screenshot(path)
            return {"text": text, "image_base64": b64}
        if name == "save_memory":
            return {"text": await asyncio.to_thread(append_memory, args["note"])}
        return {"text": f"Unknown tool: {name}"}
    except Exception as e:  # noqa: BLE001 - the agent needs to see failures
        return {"text": f"Tool {name} failed: {e}"}
