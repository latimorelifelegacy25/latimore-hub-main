"""Per-task session logs: one folder per run with steps.jsonl + screenshots.

sessions/<timestamp>-<task-slug>/
    task.txt        the original instruction
    steps.jsonl     one JSON object per tool call (time, tool, args, result)
    shot-1.png ...  screenshots taken during the task
"""
import json
import os
import shutil
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
_BASE = os.path.join(_HERE, "sessions")


class SessionLogger:
    def __init__(self, task: str):
        slug = "".join(c if c.isalnum() else "-" for c in task[:40]).strip("-")
        slug = slug or "task"
        self.dir = os.path.join(_BASE, f"{time.strftime('%Y%m%d-%H%M%S')}-{slug}")
        os.makedirs(self.dir, exist_ok=True)
        self._shots = 0
        with open(os.path.join(self.dir, "task.txt"), "w") as f:
            f.write(task)

    def log_step(self, name: str, args: dict, result_summary: str) -> None:
        entry = {
            "time": time.strftime("%H:%M:%S"),
            "tool": name,
            "args": args,
            "result": (result_summary or "")[:500],
        }
        try:
            with open(os.path.join(self.dir, "steps.jsonl"), "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception:
            pass  # logging must never break the task

    def log_screenshot(self, src_path: str) -> None:
        self._shots += 1
        try:
            shutil.copy(src_path, os.path.join(self.dir, f"shot-{self._shots}.png"))
        except Exception:
            pass
