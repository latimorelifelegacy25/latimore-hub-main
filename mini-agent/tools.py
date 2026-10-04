"""Local shell and a lazily started Chromium browser."""
import os
import signal
import subprocess
import uuid
from pathlib import Path


def run_shell(command: str, timeout: int = 30) -> dict:
    if not 1 <= timeout <= 120:
        raise ValueError("timeout must be between 1 and 120 seconds")
    if os.getenv("CONFIRM_SHELL", "0") == "1":
        try:
            approved = input(f"Run shell command?\n{command}\n[y/N] ").lower() == "y"
        except EOFError:
            approved = False
        if not approved:
            return {"error": "User declined shell command"}
    with subprocess.Popen(command, shell=True, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, start_new_session=True) as process:
        try:
            output, _ = process.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            output, _ = process.communicate()
            return {"error": "Command timed out", "output": output.decode(errors="replace")[-16000:]}
    return {"exit_code": process.returncode, "output": output.decode(errors="replace")[-16000:]}


class Browser:
    def __init__(self):
        self.driver = self.browser = self.page = None

    def start(self):
        if self.page is None:
            from playwright.sync_api import sync_playwright
            self.driver = sync_playwright().start()
            self.browser = self.driver.chromium.launch(headless=os.getenv("HEADLESS", "1") != "0")
            self.page = self.browser.new_page(viewport={"width": 1280, "height": 800})
            self.page.set_default_timeout(15000)
        return self.page

    def snapshot(self):
        page = self.start()
        Path("shots").mkdir(exist_ok=True)
        path = Path("shots") / f"{uuid.uuid4().hex}.png"
        page.screenshot(path=str(path))
        return {"url": page.url, "title": page.title(), "screenshot": str(path),
                "text": page.locator("body").inner_text()[:12000]}

    def navigate(self, url):
        self.start().goto(url, wait_until="domcontentloaded", timeout=30000)
        return self.snapshot()

    def click(self, selector):
        self.start().locator(selector).click()
        return self.snapshot()

    def fill(self, selector, text):
        self.start().locator(selector).fill(text)
        return self.snapshot()

    def press(self, key):
        self.start().keyboard.press(key)
        return self.snapshot()

    def scroll(self, pixels):
        self.start().evaluate("pixels => window.scrollBy(0, pixels)", pixels)
        return self.snapshot()

    def close(self):
        try:
            if self.browser:
                self.browser.close()
        finally:
            if self.driver:
                self.driver.stop()


def tool(name, description, properties, required):
    return {"type": "function", "function": {"name": name, "description": description,
            "parameters": {"type": "object", "properties": properties, "required": required,
                           "additionalProperties": False}}}


STRING = {"type": "string"}
TOOLS = [
    tool("run_shell", "Run a shell command on this Linux computer.",
         {"command": STRING, "timeout": {"type": "integer"}}, ["command"]),
    tool("browser_navigate", "Open a full http(s) URL and see the page.", {"url": STRING}, ["url"]),
    tool("browser_snapshot", "See the current page and screenshot.", {}, []),
    tool("browser_click", "Click a Playwright selector, e.g. text=More or CSS.", {"selector": STRING}, ["selector"]),
    tool("browser_fill", "Fill a form input using a Playwright selector.", {"selector": STRING, "text": STRING}, ["selector", "text"]),
    tool("browser_press", "Press a key such as Enter, Tab or Escape.", {"key": STRING}, ["key"]),
    tool("browser_scroll", "Scroll vertically by pixels; negative means up.", {"pixels": {"type": "integer"}}, ["pixels"]),
]
