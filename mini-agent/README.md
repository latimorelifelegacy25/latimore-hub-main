# Mini Agent — your own computer-use agent

A small but real computer-use agent: a Linux computer, a real Chromium
browser, and an LLM driving both in a loop — now with element snapshots,
a Telegram front-end, persistent memory, per-task session logs, and a
pluggable model provider.

**The pieces, mapped to files:**

| Piece | File |
|---|---|
| The running computer | `tools.py` → `run_shell()` |
| The browser | `tools.py` → `browser_*` (Playwright + real Chromium) |
| The agent loop | `agent.py` (model picks tools → code runs them → results go back) |
| Model provider (swappable) | `providers.py` (OpenAI today; add Gemini/Anthropic later) |
| Persistent memory | `memory.py` + `MEMORY.md` (read at startup, `save_memory` tool) |
| Session logs | `sessions.py` → `sessions/<timestamp>-<task>/` |
| Phone front-end | `bot.py` (Telegram) |

## Setup (Linux)

```bash
cd mini-agent
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium   # downloads a real Chromium for the agent to drive
cp .env.example .env          # then fill in your keys
export $(cat .env | xargs)
```

You need a model with vision + function calling (screenshots are how the agent
*sees* the page). `MODEL` picks the model, `PROVIDER` picks the backend
(`openai` for now — see `providers.py` to add more).

## Run it

```bash
python agent.py "go to example.com and tell me the headline"
```

Watch it think: each `[tool]` line is one action. Screenshots land in `shots/`
so you can see what it saw. Every run also gets a folder under `sessions/`
with `task.txt`, `steps.jsonl` (every tool call + result), and its screenshots —
handy for reviewing what it actually did.

To make it ask permission before every shell command:

```bash
export CONFIRM_SHELL=1
```

## How it drives the browser

`browser_snapshot` lists the page's interactive elements as numbered refs:

```
[1] button "Log in"
[2] textbox "Search"
[3] link "Pricing"
```

The agent then uses `browser_click_ref` / `browser_fill_ref` instead of
guessing CSS selectors — far more reliable than pixel coordinates or blind
selectors. Plain `browser_click` / `browser_fill` with selectors still work.

If a fill targets a login form (password field detected), the agent must get
your approval first — and the value is never shown in the approval prompt.

## Memory

The agent reads `MEMORY.md` at the start of every task and has a
`save_memory` tool, so "remember that …" actually sticks between runs.
On Telegram: `/memory` shows what it remembers, `/forget` wipes it.

## Text it from Telegram

1. On Telegram, talk to **@BotFather** → `/newbot` → copy the token.
2. Talk to **@userinfobot** → copy your numeric user ID.
3. On the Linux box:
   ```bash
   export TELEGRAM_BOT_TOKEN=<token from BotFather>
   export TELEGRAM_ALLOWED_IDS=<your user id>
   python bot.py
   ```
   (Run it inside `tmux` so it survives disconnects.)
4. Text the bot a task. It narrates each step, sends browser screenshots as it
   works, and shows **Approve / Deny** buttons before every shell command and
   every login-field fill.

Commands: `/shot` (current browser view), `/cancel` (stop the running task),
`/memory`, `/forget`. One task at a time per chat.

## Or control it over SSH

From Termux (or any phone SSH app): `pkg install openssh`, then
`ssh your-user@your-linux-box` and run `python agent.py "..."`.
**[Tailscale](https://tailscale.com)** (free for personal use) gives the Linux
box a private address reachable from your phone anywhere, no router fiddling.

## Run it in Docker

```bash
docker build -t mini-agent .
docker run -e OPENAI_API_KEY=sk-... mini-agent "your task"
# Telegram bot:
docker run -e TELEGRAM_BOT_TOKEN=... -e TELEGRAM_ALLOWED_IDS=... mini-agent python bot.py
```

Mount a volume at `/app/sessions` (and `/app/MEMORY.md`) if you want session
logs and memory to survive container restarts.

## Cost

- **Your own computer: $0.** Cheapest option, full stop.
- **Always-on without leaving your PC on:** a small VPS runs ~$5–6/month.
- **API calls:** a typical short task is a few cents. (API keys need billing
  enabled before they work.)

## Why not just run it in Termux on the phone?

The shell half works fine in Termux. The browser half doesn't: no Docker,
Chromium only via painful workarounds, and Android aggressively kills
background processes. Termux shines as the *remote control*, not the host.

## Safety notes

- `run_shell` can run *anything*. Start with `CONFIRM_SHELL=1`, and don't run
  the agent as root or on a machine with anything precious until you trust it.
- **The Telegram bot only answers the user IDs in `TELEGRAM_ALLOWED_IDS`.**
  If you leave that empty it answers *anyone who finds it* — don't. Shell
  commands and login-field fills ask for Approve/Deny by default
  (`BOT_REQUIRE_APPROVAL=1`). Fill values are never echoed back.
- `/cancel` stops the agent loop, but a shell command already running finishes
  first (commands time out at 120s).
- The agent can't log in anywhere for you — no saved passwords here. It will
  ask before filling login fields rather than guessing.
- Screenshots may contain whatever is on the page; `shots/` and `sessions/`
  are local to your machine (and git-ignored).

## Adding another model provider

See `providers.py`. Subclass `Provider`, implement `complete`,
`assistant_msg`, `tool_msg`, `image_msg`, register it in `get_provider()`,
then `PROVIDER=gemini python agent.py "..."`.
