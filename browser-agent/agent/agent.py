"""
Core agent loop — connects Gemini vision model to the browser controller.
Supports streaming action logs and status updates via callbacks.
"""
import asyncio
import base64
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Callable, List, Dict, Any

import google.generativeai as genai

from agent.browser import BrowserController
from config.settings import settings

logger = logging.getLogger(__name__)

# Configure Gemini client once at import time
genai.configure(api_key=settings.GEMINI_API_KEY)


class TaskStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    PAUSED    = "paused"
    COMPLETED = "completed"
    FAILED    = "failed"
    CANCELLED = "cancelled"


@dataclass
class AgentTask:
    task_id:     str
    instruction: str
    status:      TaskStatus = TaskStatus.PENDING
    created_at:  float      = field(default_factory=time.time)
    started_at:  Optional[float] = None
    finished_at: Optional[float] = None
    result:      Optional[str]   = None
    error:       Optional[str]   = None
    steps:       List[Dict]      = field(default_factory=list)
    current_url: str             = ""
    screenshot:  Optional[str]   = None   # latest b64 PNG

    def to_dict(self) -> dict:
        return {
            "task_id":     self.task_id,
            "instruction": self.instruction,
            "status":      self.status.value,
            "created_at":  self.created_at,
            "started_at":  self.started_at,
            "finished_at": self.finished_at,
            "result":      self.result,
            "error":       self.error,
            "steps":       self.steps[-50:],   # last 50 steps
            "current_url": self.current_url,
            "duration":    round(
                (self.finished_at or time.time()) - (self.started_at or self.created_at), 1
            ),
        }


class BrowserAgent:
    """
    Autonomous browser agent powered by Gemini vision.

    Callbacks (all async):
      on_screenshot(task_id, b64_png)   — new frame available
      on_step(task_id, step_dict)       — action taken / log entry
      on_status(task_id, status_str)    — status changed
      on_complete(task_id, result)      — task finished
    """

    SYSTEM_PROMPT = """You are an autonomous browser agent. You control a real web browser.
You receive screenshots of the current browser state and must decide what action to take next.

Available actions (respond with JSON):
- {"type": "navigate",     "url": "https://..."}
- {"type": "click",        "coordinate": [x, y]}
- {"type": "double_click", "coordinate": [x, y]}
- {"type": "type",         "text": "..."}
- {"type": "key",          "key": "Enter|Tab|Escape|ArrowDown|..."}
- {"type": "scroll",       "coordinate": [x, y], "scroll_direction": "up|down", "scroll_distance": 3}
- {"type": "hover",        "coordinate": [x, y]}
- {"type": "wait",         "duration": 1}
- {"type": "screenshot"}   (request fresh view)
- {"type": "done",         "result": "summary of what was accomplished"}
- {"type": "error",        "message": "reason why task cannot be completed"}

Rules:
1. Always respond with a single JSON action object and nothing else.
2. Before clicking, look carefully at the screenshot to find the exact element.
3. After typing in a search box, press Enter to submit.
4. If a page is loading, use {"type": "wait", "duration": 2}.
5. When the task is fully complete, respond with {"type": "done", "result": "..."}.
6. Be efficient — complete tasks in as few steps as possible.
7. If you cannot complete the task, respond with {"type": "error", "message": "..."}.
"""

    def __init__(
        self,
        on_screenshot: Optional[Callable] = None,
        on_step:       Optional[Callable] = None,
        on_status:     Optional[Callable] = None,
        on_complete:   Optional[Callable] = None,
    ):
        self.on_screenshot = on_screenshot
        self.on_step       = on_step
        self.on_status     = on_status
        self.on_complete   = on_complete

        self._model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=self.SYSTEM_PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0,
                max_output_tokens=512,
                response_mime_type="application/json",
            ),
        )
        self._tasks: Dict[str, AgentTask] = {}
        self._cancel_flags: Dict[str, bool] = {}
        self._pause_flags:  Dict[str, bool] = {}

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def create_task(self, instruction: str) -> AgentTask:
        task_id = str(uuid.uuid4())[:8]
        task = AgentTask(task_id=task_id, instruction=instruction)
        self._tasks[task_id] = task
        self._cancel_flags[task_id] = False
        self._pause_flags[task_id]  = False
        return task

    def get_task(self, task_id: str) -> Optional[AgentTask]:
        return self._tasks.get(task_id)

    def get_all_tasks(self) -> List[AgentTask]:
        return list(self._tasks.values())

    def cancel_task(self, task_id: str):
        self._cancel_flags[task_id] = True
        logger.info(f"[{task_id}] Cancel requested")

    def pause_task(self, task_id: str):
        self._pause_flags[task_id] = True
        if task_id in self._tasks:
            self._tasks[task_id].status = TaskStatus.PAUSED

    def resume_task(self, task_id: str):
        self._pause_flags[task_id] = False
        if task_id in self._tasks:
            self._tasks[task_id].status = TaskStatus.RUNNING

    async def run_task(self, task: AgentTask):
        """Entry point — run a task end-to-end."""
        browser = BrowserController(
            width=settings.BROWSER_WIDTH,
            height=settings.BROWSER_HEIGHT,
            headless=settings.BROWSER_HEADLESS,
            recordings_dir=settings.RECORDINGS_DIR,
            on_screenshot=self._handle_screenshot,
        )

        task.status     = TaskStatus.RUNNING
        task.started_at = time.time()
        await self._emit_status(task.task_id, TaskStatus.RUNNING)

        try:
            await browser.start(task.task_id)
            await self._agent_loop(task, browser)
        except asyncio.CancelledError:
            task.status      = TaskStatus.CANCELLED
            task.finished_at = time.time()
            await self._emit_status(task.task_id, TaskStatus.CANCELLED)
        except Exception as e:
            logger.exception(f"[{task.task_id}] Unhandled error")
            task.status      = TaskStatus.FAILED
            task.error       = str(e)
            task.finished_at = time.time()
            await self._emit_status(task.task_id, TaskStatus.FAILED)
        finally:
            await browser.stop()

        if self.on_complete:
            await self.on_complete(task.task_id, task.to_dict())

    # ------------------------------------------------------------------ #
    #  Agent loop                                                         #
    # ------------------------------------------------------------------ #

    async def _agent_loop(self, task: AgentTask, browser: BrowserController):
        # Gemini multi-turn: build history as list of Content dicts
        history = []

        max_steps = 50
        step_num  = 0

        # Seed the conversation with the task instruction
        history.append({
            "role": "user",
            "parts": [{"text": f"Task: {task.instruction}"}],
        })

        while step_num < max_steps:
            # ── Cancellation check ──────────────────────────────────────
            if self._cancel_flags.get(task.task_id):
                task.status      = TaskStatus.CANCELLED
                task.finished_at = time.time()
                await self._emit_status(task.task_id, TaskStatus.CANCELLED)
                return

            # ── Pause check ─────────────────────────────────────────────
            while self._pause_flags.get(task.task_id):
                await asyncio.sleep(0.5)

            # ── Capture screenshot ───────────────────────────────────────
            b64 = await browser.screenshot()
            if not b64:
                await asyncio.sleep(1)
                continue

            task.screenshot  = b64
            task.current_url = await browser.get_current_url()

            # ── Build vision message ─────────────────────────────────────
            img_bytes = base64.b64decode(b64)
            history.append({
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"Step {step_num + 1}. Current URL: {task.current_url}\n"
                            "What is your next action?"
                        )
                    },
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": b64,
                        }
                    },
                ],
            })

            # ── Ask Gemini ───────────────────────────────────────────────
            try:
                chat = self._model.start_chat(history=history[:-1])
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: chat.send_message(history[-1]["parts"]),
                )
                raw = response.text.strip()
                action = json.loads(raw)
            except Exception as e:
                logger.error(f"[{task.task_id}] Model error: {e}")
                await asyncio.sleep(2)
                continue

            # Add model response to history
            history.append({
                "role": "model",
                "parts": [{"text": raw}],
            })

            # ── Log step ─────────────────────────────────────────────────
            step_dict = {
                "step":      step_num + 1,
                "action":    action,
                "url":       task.current_url,
                "timestamp": time.time(),
            }
            task.steps.append(step_dict)
            await self._emit_step(task.task_id, step_dict)

            # ── Terminal actions ─────────────────────────────────────────
            if action.get("type") == "done":
                task.status      = TaskStatus.COMPLETED
                task.result      = action.get("result", "Task completed.")
                task.finished_at = time.time()
                await self._emit_status(task.task_id, TaskStatus.COMPLETED)
                await self._emit_step(task.task_id, {
                    "step": "DONE", "action": action,
                    "url": task.current_url, "timestamp": time.time()
                })
                return

            if action.get("type") == "error":
                task.status      = TaskStatus.FAILED
                task.error       = action.get("message", "Unknown error")
                task.finished_at = time.time()
                await self._emit_status(task.task_id, TaskStatus.FAILED)
                return

            # ── Execute action ───────────────────────────────────────────
            result = await browser.execute_action(action)

            # Add action result to history
            history.append({
                "role": "user",
                "parts": [{"text": f"Action result: {json.dumps(result)}"}],
            })

            # Keep history manageable (instruction + last 20 exchanges = ~42 entries)
            if len(history) > 43:
                history = history[:1] + history[-40:]

            step_num += 1
            await asyncio.sleep(0.3)

        # Max steps reached
        task.status      = TaskStatus.FAILED
        task.error       = f"Max steps ({max_steps}) reached without completion."
        task.finished_at = time.time()
        await self._emit_status(task.task_id, TaskStatus.FAILED)

    # ------------------------------------------------------------------ #
    #  Callbacks                                                          #
    # ------------------------------------------------------------------ #

    async def _handle_screenshot(self, task_id: str, b64: str):
        if task_id in self._tasks:
            self._tasks[task_id].screenshot = b64
        if self.on_screenshot:
            await self.on_screenshot(task_id, b64)

    async def _emit_step(self, task_id: str, step: dict):
        if self.on_step:
            await self.on_step(task_id, step)

    async def _emit_status(self, task_id: str, status: TaskStatus):
        if self.on_status:
            await self.on_status(task_id, status.value)
