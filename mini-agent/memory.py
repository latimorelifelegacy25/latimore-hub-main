"""Persistent memory: a Markdown file the agent reads at startup and can append to.

The agent gets the whole file in its system prompt and has a `save_memory`
tool, so "remember that my ..." actually sticks between tasks.
"""
import os
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
MEMORY_PATH = os.path.join(_HERE, "MEMORY.md")
_HEADER = (
    "# Agent memory\n"
    "\n"
    "Durable notes saved by the agent across tasks. Newest entries go at the end.\n"
)


def _ensure() -> None:
    if not os.path.exists(MEMORY_PATH):
        with open(MEMORY_PATH, "w") as f:
            f.write(_HEADER)


def load_memory() -> str:
    _ensure()
    with open(MEMORY_PATH) as f:
        return f.read()


def append_memory(note: str) -> str:
    _ensure()
    stamp = time.strftime("%Y-%m-%d %H:%M")
    note = " ".join(note.split())  # collapse whitespace/newlines
    if not note:
        return "Nothing to save."
    with open(MEMORY_PATH, "a") as f:
        f.write(f"\n- {stamp}: {note}\n")
    return "Saved to memory."
