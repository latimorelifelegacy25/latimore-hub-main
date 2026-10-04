#!/usr/bin/env python3
"""Minimal computer-use agent: an LLM driving a Linux shell + real Chromium.

CLI usage:
    python agent.py "go to example.com and tell me the headline"

Also importable: `from agent import run_task, Hooks` with your own Hooks
implementation (see bot.py for the Telegram front-end).
"""
import asyncio
import os
import sys

from memory import load_memory
from providers import get_provider
from sessions import SessionLogger
from tools import TOOL_SCHEMAS, run_tool

SYSTEM = """You are an agent running on a Linux computer with a real Chromium browser.
You have three powers: running shell commands, driving the browser, and saving notes to your persistent memory.

Browser tips:
- browser_snapshot lists clickable/fillable elements as numbered refs like [3].
  Prefer browser_click_ref / browser_fill_ref over guessing CSS selectors.
- After navigation, clicks, and fills, take a screenshot to see the result.
- save_memory("...") stores a durable note you will see in future tasks. Use it for
  facts the user would want you to remember (their preferences, details they gave
  you, approaches that worked).

Rules:
- Never delete files, change system config, or install/uninstall software unless explicitly asked.
- Never reveal your memory file contents unless the user asks.
- If a page needs a login you don't have, stop and say so instead of guessing.
- When the task is finished, summarize what you did in plain language."""

MAX_STEPS = 40


class Hooks:
    """Override these to plug the agent into a different front-end."""

    async def say(self, text: str) -> None:
        """Agent produced user-facing text."""

    async def tool_called(self, name: str, args: dict) -> None:
        """A tool is about to run."""

    async def shot(self, path: str) -> None:
        """A browser screenshot was saved to path."""

    async def confirm_shell(self, command: str) -> bool:
        """Return True if this shell command may run."""
        return True

    async def confirm_fill(self, field: str) -> bool:
        """Return True if this (possibly login) field may be filled.
        The value is never revealed here — only the field description."""
        return True


class ConsoleHooks(Hooks):
    async def say(self, text: str) -> None:
        print(text, flush=True)

    async def tool_called(self, name: str, args: dict) -> None:
        print(f"  [tool] {name} {args}", flush=True)

    async def confirm_shell(self, command: str) -> bool:
        if os.environ.get("CONFIRM_SHELL") == "1":
            ans = await asyncio.to_thread(
                input, f"Run this shell command? [y/N]\n  {command}\n> "
            )
            return ans.strip().lower() == "y"
        return True

    async def confirm_fill(self, field: str) -> bool:
        if os.environ.get("CONFIRM_SHELL") == "1":
            ans = await asyncio.to_thread(
                input, f"Fill login {field}? (value stays hidden) [y/N]\n> "
            )
            return ans.strip().lower() == "y"
        return True


async def run_task(task: str, hooks: Hooks) -> str:
    """Run one task through the agent loop. Returns the agent's final summary.

    Raises asyncio.CancelledError if cancelled — the caller reports it.
    A SessionLogger records every step and screenshot under sessions/.
    """
    provider = get_provider()

    mem = load_memory().strip()
    system = SYSTEM
    if mem:
        system += "\n\nPersistent memory from earlier tasks:\n" + mem

    session = SessionLogger(task)
    messages: list = [
        {"role": "system", "content": system},
        {"role": "user", "content": task},
    ]
    final = ""

    for _ in range(MAX_STEPS):
        msg = await provider.complete(messages, TOOL_SCHEMAS)
        messages.append(provider.assistant_msg(msg))

        if msg.content:
            final = msg.content
            await hooks.say(msg.content)

        if not msg.tool_calls:
            break  # agent is done; its last message is the summary

        for tc in msg.tool_calls:
            await hooks.tool_called(tc.name, tc.arguments)
            result = await run_tool(tc.name, tc.arguments, hooks, session)
            session.log_step(tc.name, tc.arguments, result["text"])
            messages.append(provider.tool_msg(tc.id, tc.name, result["text"]))
            if result.get("image_base64"):
                # Feed the screenshot back so the model can SEE the page.
                messages.append(
                    provider.image_msg(result["image_base64"], "Current browser screenshot:")
                )
    else:
        await hooks.say(f"(stopped after {MAX_STEPS} steps)")

    session.log_step("done", {}, final[:500])
    return final


def main() -> None:
    if len(sys.argv) < 2:
        print('Usage: python agent.py "your task here"')
        sys.exit(1)
    try:
        asyncio.run(run_task(" ".join(sys.argv[1:]), ConsoleHooks()))
    except asyncio.CancelledError:
        print("\nCancelled.")


if __name__ == "__main__":
    main()
