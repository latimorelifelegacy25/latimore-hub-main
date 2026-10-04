#!/usr/bin/env python3
"""Telegram front-end for the mini agent.

Setup:
  1. On Telegram, talk to @BotFather -> /newbot -> copy the token.
  2. Talk to @userinfobot -> copy your numeric user ID.
  3. On your Linux box:
         export TELEGRAM_BOT_TOKEN=<token from BotFather>
         export TELEGRAM_ALLOWED_IDS=<your user id>
         python bot.py
     (Run it inside tmux so it survives disconnects.)
  4. Text the bot a task. It narrates each step, sends browser screenshots,
     asks Approve / Deny before every shell command and login-field fill,
     and remembers notes across tasks.

Commands: /shot (current browser view), /cancel (stop the running task),
/memory (show what the agent remembers), /forget (wipe its memory).

Security: the bot only answers user IDs listed in TELEGRAM_ALLOWED_IDS.
"""
import asyncio
import os
import uuid

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from agent import Hooks, run_task
from memory import MEMORY_PATH, load_memory
from tools import run_tool

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ALLOWED = {
    x.strip()
    for x in os.environ.get("TELEGRAM_ALLOWED_IDS", "").split(",")
    if x.strip()
}
SEND_SHOTS = os.environ.get("SEND_SHOTS", "1") == "1"
REQUIRE_APPROVAL = os.environ.get("BOT_REQUIRE_APPROVAL", "1") == "1"

pending: dict[str, asyncio.Future] = {}  # approval token -> waiting future
busy: set[int] = set()  # chat ids with a task currently running
running_tasks: dict[int, asyncio.Task] = {}  # chat id -> agent task


def _authorized(user_id: int) -> bool:
    return not ALLOWED or str(user_id) in ALLOWED


class TelegramHooks(Hooks):
    def __init__(self, chat_id: int, context: ContextTypes.DEFAULT_TYPE):
        self.chat_id = chat_id
        self.context = context

    async def _send(self, text: str) -> None:
        # Telegram caps messages at 4096 chars.
        await self.context.bot.send_message(self.chat_id, text[:4000])

    async def say(self, text: str) -> None:
        await self._send(text)

    async def tool_called(self, name: str, args: dict) -> None:
        arg_str = str(args)
        if len(arg_str) > 200:
            arg_str = arg_str[:200] + "..."
        await self._send(f"\u2699\ufe0f {name} {arg_str}")

    async def shot(self, path: str) -> None:
        if SEND_SHOTS:
            with open(path, "rb") as f:
                await self.context.bot.send_photo(self.chat_id, photo=f)

    async def _ask(self, prompt: str) -> bool:
        """Approve/Deny inline-keyboard prompt. Returns False on deny/timeout."""
        token = uuid.uuid4().hex[:8]
        fut = asyncio.get_running_loop().create_future()
        pending[token] = fut
        keyboard = InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton("Approve", callback_data=f"ap:{token}"),
                    InlineKeyboardButton("Deny", callback_data=f"dn:{token}"),
                ]
            ]
        )
        await self.context.bot.send_message(
            self.chat_id, prompt, reply_markup=keyboard
        )
        try:
            return await asyncio.wait_for(fut, timeout=300)
        except asyncio.TimeoutError:
            return False  # silence = no
        except asyncio.CancelledError:
            if not fut.done():
                fut.cancel()
            raise
        finally:
            pending.pop(token, None)

    async def confirm_shell(self, command: str) -> bool:
        if not REQUIRE_APPROVAL:
            return True
        shown = command if len(command) <= 500 else command[:500] + "..."
        return await self._ask(f"The agent wants to run this shell command:\n\n{shown}")

    async def confirm_fill(self, field: str) -> bool:
        if not REQUIRE_APPROVAL:
            return True
        return await self._ask(
            f"The agent wants to fill a login field ({field}).\n"
            "The value stays hidden and is never shown here."
        )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update.effective_user.id):
        return
    await update.message.reply_text(
        "I'm your computer-use agent. Just text me a task.\n\n"
        "Commands:\n"
        "/shot - what the browser sees right now\n"
        "/cancel - stop the running task\n"
        "/memory - show what I remember\n"
        "/forget - wipe my memory"
    )


async def shot_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update.effective_user.id):
        return
    hooks = TelegramHooks(update.effective_chat.id, context)
    result = await run_tool("browser_screenshot", {}, hooks)
    await update.message.reply_text(result["text"])


async def memory_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update.effective_user.id):
        return
    mem = load_memory()
    await update.message.reply_text(mem[:4000] if mem.strip() else "Memory is empty.")


async def forget_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update.effective_user.id):
        return
    with open(MEMORY_PATH, "w") as f:
        f.write("# Agent memory\n\nDurable notes saved by the agent across tasks.\n")
    await update.message.reply_text("Memory wiped.")


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _authorized(update.effective_user.id):
        return
    chat_id = update.effective_chat.id
    task = running_tasks.get(chat_id)
    if task and not task.done():
        task.cancel()
        await update.message.reply_text("Cancelling…")
    else:
        await update.message.reply_text("Nothing running right now.")


async def on_approval(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    try:
        action, token = query.data.split(":", 1)
    except ValueError:
        return
    fut = pending.get(token)
    if fut and not fut.done():
        fut.set_result(action == "ap")
    try:
        await query.edit_message_text("Approved." if action == "ap" else "Denied.")
    except Exception:
        pass  # message already edited / deleted; not worth failing over


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    if not _authorized(user_id):
        await update.message.reply_text(
            "This bot is locked to its owner and doesn't take tasks from strangers."
        )
        return
    if chat_id in busy:
        await update.message.reply_text(
            "Still working on the last one — /cancel it first if you want to stop it."
        )
        return
    busy.add(chat_id)
    hooks = TelegramHooks(chat_id, context)
    await update.message.reply_text("On it. I'll narrate as I go. (/cancel to stop me)")
    task = asyncio.create_task(run_task(update.message.text, hooks))
    running_tasks[chat_id] = task
    try:
        final = await task
        await update.message.reply_text(
            f"Done:\n\n{final[:3800]}" if final else "Done (no summary)."
        )
    except asyncio.CancelledError:
        await update.message.reply_text("Cancelled.")
    except Exception as e:  # noqa: BLE001 - tell the user plainly
        await update.message.reply_text(f"Something broke: {e}")
    finally:
        busy.discard(chat_id)
        running_tasks.pop(chat_id, None)


def main() -> None:
    if not TOKEN:
        raise SystemExit("Set TELEGRAM_BOT_TOKEN first (see README).")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("shot", shot_command))
    app.add_handler(CommandHandler("cancel", cancel_command))
    app.add_handler(CommandHandler("memory", memory_command))
    app.add_handler(CommandHandler("forget", forget_command))
    app.add_handler(CallbackQueryHandler(on_approval))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    print("Bot running. Text it a task on Telegram.")
    app.run_polling()


if __name__ == "__main__":
    main()
