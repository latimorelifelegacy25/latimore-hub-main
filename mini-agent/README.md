# Mini Agent — your own computer-use agent

A tiny but real version of the setup I run on: a Linux computer, a real
Chromium browser, and an LLM driving both in a loop. ~200 lines of Python.

**The three pieces, mapped to files:**

| Piece | Here |
|---|---|
| The running computer | `tools.py` → `run_shell()` (plain `subprocess` on your Linux box, or inside the Docker container) |
| The browser | `tools.py` → `browser_*` (Playwright driving real Chromium) |
| The glue (agent loop) | `agent.py` (LLM picks tools → code runs them → results go back to the LLM) |

## Setup (Linux)

```bash
cd mini-agent
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium   # downloads a real Chromium for the agent to drive
cp .env.example .env          # then put your OpenAI key in .env
# agent.py loads .env automatically
```

You need a model with vision + function calling (screenshots are how the agent
*sees* the page). Set `MODEL` in `.env` to whatever is current.

## Run it

```bash
python agent.py "go to example.com and tell me the headline"
python agent.py "search for the cheapest 65W USB-C charger and summarize the top 3 results"
```

Watch it think: each `[tool]` line is one action. Screenshots land in `shots/`
so you can see what it saw. It stops on its own (40-step cap) with a summary.

To make it ask permission before every shell command:

```bash
export CONFIRM_SHELL=1
```

## Run it in Docker (closest to "a computer in the cloud")

```bash
docker build -t mini-agent .
docker run --env-file .env mini-agent python agent.py "your task"
# Add -it if CONFIRM_SHELL=1 so you can answer approval prompts.
```

## Control it from your phone

You don't need to sit at the Linux box. From Termux (or any phone SSH app):

```bash
pkg install openssh
ssh your-user@your-linux-box
```

then run `python agent.py "..."` remotely. Two upgrades worth knowing:

- **`tmux`** — start the agent inside `tmux` and it keeps running after you
  disconnect your phone. Reattach later with `tmux attach`.
- **[Tailscale](https://tailscale.com)** — free for personal use, gives your
  Linux box a private address reachable from your phone anywhere, no router
  or port-forwarding fiddling.

## Cost

- **Your own computer: $0.** This is the cheapest option, full stop.
- **Always-on without leaving your PC on:** a small VPS (Hetzner, DigitalOcean)
  runs about **$5–6/month** and handles this workload easily.
- **The API calls** cost whatever your OpenAI usage costs — a typical short task
  is a few cents. (Note: an API key needs billing enabled before it works.)

## Why not just run it in Termux on the phone?

The shell half works fine in Termux. The browser half doesn't: no Docker,
Chromium only via painful workarounds, and Android aggressively kills
background processes. Termux shines as the *remote control*, not the host.

## Safety notes

- `run_shell` can run *anything*. Start with `CONFIRM_SHELL=1`, and don't run
  the agent as root or on a machine with anything precious until you trust it.
- The browser starts without saved passwords or existing login sessions.
- Screenshots may contain whatever is on the page; the `shots/` folder is
  local to your machine.
- Browser sessions start fresh, but the agent can fill login forms if you give
  it credentials. The model receives page text, screenshots, and shell output.
- Shell approval is a prompt, not a sandbox. Use Docker to isolate the host;
  shell commands still have access to the container's environment and files.

## Configuration

`.env.example` starts with `CONFIRM_SHELL=1`. Set it to `0` for unattended runs.
Set `HEADLESS=0` to watch Chromium on a machine with a display. `MAX_STEPS`
defaults to 40; override it with `python agent.py --max-steps 10 "your task"`.
Shell commands have a 30-second default timeout (maximum 120 seconds).
The agent makes one final summary call when it reaches the tool-loop limit.

## Where to take it next

1. Add an approval step before `browser_fill` on login-looking forms.
2. Give it a memory file it can read/write between runs.
3. Swap the CLI for a Telegram bot so you can text it tasks from your phone.
4. Mount a persistent folder into the Docker container so files survive restarts.
