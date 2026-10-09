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

### Choose a provider

The default is `PROVIDER=openai` with `OPENAI_API_KEY`. An optional
`OPENAI_BASE_URL` selects an OpenAI-compatible endpoint.

To use Anthropic, set `PROVIDER=anthropic`, supply `ANTHROPIC_API_KEY` in your
local `.env`, and replace `MODEL=gpt-4.1-mini` with the Claude model you want
to use. This uses Anthropic's OpenAI SDK compatibility endpoint; the tool loop,
screenshots, shell confirmation, and opt-in memory stay the same. The mini-agent
runs on your Linux host or in Docker; it is not a Vercel serverless worker.

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

The image sets `MEMORY=0`, so a default container run stores nothing persistent.
To opt in to memory (not recommended with an unrestricted shell; see Memory), mount a named volume (see [Memory](#memory)):
`docker run --rm -e MEMORY=1 -v mini-agent-memory:/app/memory_data --env-file .env mini-agent python agent.py "..."`.

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

## Memory

An optional local memory layer (standard library only, SQLite). It is **opt-in
and OFF by default**. Enable it for one run with `--memory`, or persistently
with `MEMORY=1`; `--no-memory` always forces it off. With it off the agent
behaves exactly as before and creates no files. When on, the agent prints
`memory enabled: stored notes are untrusted data; keep CONFIRM_SHELL=1`.

### Read this first: memory is NOT a trust boundary

The protections below are real but **the shell tool can bypass all of them**.
`run_shell` runs as the same OS user as the agent, so it can read, edit or
delete `memory_data/memory.db` directly (and, if you opted in to
Docker with a mounted memory volume, that volume too), and it can run
`python agent.py memory ...` or `sqlite3` itself. Memory plus an unrestricted
shell is therefore not a security boundary. Anything the model can influence
(for example a web page steering its final answer) must be treated as capable of
reaching a later prompt if the shell was used to write it into the user-notes
section. The real controls are:

1. **`CONFIRM_SHELL=1`**: review every shell command before it runs.
2. **Run in Docker**, and mount the memory volume only when you actually need it.

Recalled text is labelled as data and the model is told not to follow it; that is
a mitigation, not a guarantee.

### What is stored (`memory_data/memory.db`, or `MEMORY_DB`)

- `sessions`: your goal, a short model-written final message (redacted, max 300
  chars, `source='model'`), a status (`done` / `failed` / `step_limit`), times and iteration count.
- `visited_urls`: scheme and host (and port) only: never the path, query, fragment or credentials. Plus the page title.
- `tool_calls`: tool name, action name, a redacted input summary, ok flag, time.
  For `run_shell` only the **program name and an argument count** are kept, never the arguments.
- `knowledge` and `preferences`: only what you add with the CLI.

### What is NEVER stored

Page text, screenshots, shell command output, tool results, shell arguments,
text typed into forms (`browser_fill`/typing values are always `[REDACTED]`), and values of
arguments named like `password|pass|secret|token|key|card|cvv|ssn|auth|pw|pin|otp|cookie|session`.
Every stored string is normalised (NFKC, zero-width/soft-hyphen characters removed,
`%XX` decoded once, input capped at 20,000 characters, all patterns linear-time) and scanned for OpenAI/Anthropic/Stripe/Google/GitHub/Slack/npm/Hugging Face
keys, AWS access keys, Bearer tokens, JWTs, PEM private-key blocks, `Cookie:` headers, JSON or
`key=value` secrets (`"password": "..."`, `apiKey`, `client_secret`, `pin`, ...),
"password is ..." prose, URL credentials, US SSNs, and card numbers (Luhn-valid, or
next to the words card/cc/credit). Key names are judged by whole words, so notes like "token usage: 5k", "password reset flow" or "secretary: Ann" are left alone. A token split by spaces is only caught at the very start of a string. Strings are cut to 500 characters.
Emails are kept. This is pattern matching and will miss some formats.

### What reaches the prompt

At most ~1500 characters, appended to the **user** message (never the system
prompt) inside an `<untrusted_memory>` block: first your notes and preferences, then earlier **goals with a
status only** ("check portal (status: done)"). The model's free-text final message
is stored but never recalled. Each item is stripped of control characters, `<`, `>`, `|`
and the delimiter tags, capped at 200 characters, and dropped if it contains chat-role
markers (`system:`, `assistant:`, `user:`, `<|...|>`). Visited URLs and page content are never recalled.

### Other protections

- The model has no memory tool; it cannot write notes or preferences through the tool API.
- The data directory is created `0700`, the DB `0600` (via `fchmod` on the opened file), with SQLite `secure_delete` on.
  A symlinked `MEMORY_DB`, a symlink anywhere in its directory path, or a hard-linked DB file is refused (memory is disabled for that run with a warning). If your checkout is reached through a symlink, point `MEMORY_DB` at a real path.
- Write commands (`remember`, `prefer`, `forget`) refuse unless stdin **and** stdout are a TTY, so a
  model calling the CLI through the (output-capturing) shell tool is refused. That is a speed bump only; see above.
- `python agent.py memory ...` is only treated as the CLI when `memory` is its own argument followed by a known subcommand;
  a task string such as `"memory forget --all"` is just a task.
- Memory errors print a short warning and never stop a run.

### CLI (human only; run it yourself in a terminal)

```bash
python agent.py memory remember "billing" "Send invoices to the Pottsville office"
python agent.py memory prefer tone formal
python agent.py memory list            # list/stats/export also work without a TTY
python agent.py memory stats
python agent.py memory export > memory-backup.json
python agent.py memory forget --fact 3
python agent.py memory forget --session 12
python agent.py memory forget --url-domain example.com   # accepts example.com:8443, *.example.com, user@example.com, URLs; refuses bare labels like "com";
                                                         # also deletes every session that visited it
python agent.py memory forget --all                      # always asks for confirmation
```

### Retention (applied automatically at the start of each memory-enabled run)

| Variable | Default | Meaning |
|---|---|---|
| `MEMORY_RETENTION_DAYS` | 90 | delete tool calls, URLs, sessions and model-sourced rows older than this |
| `MEMORY_MAX_TOOL_CALLS` | 500 | keep only the newest N rows |
| `MEMORY_MAX_SESSIONS` | 200 | keep only the newest N sessions |
| `MEMORY_MAX_URLS` | 1000 | keep only the newest N visited URLs |

Notes you added with `remember`/`prefer` are never auto-pruned; remove them with `forget`.

### Wipe it

`python agent.py memory forget --all`, or `rm -rf memory_data`, or in Docker `docker volume rm mini-agent-memory`.

### Docker

The image sets `MEMORY=0` and has no volume, so nothing persists by default. Opt in with
`-e MEMORY=1 -v mini-agent-memory:/app/memory_data`, only for runs that need it. Manage it from a terminal:
`docker run --rm -it -v mini-agent-memory:/app/memory_data mini-agent python agent.py memory list`.

Recall uses SQLite FTS5 when your SQLite build has it (`memory stats` shows `fts5: True`), otherwise a `LIKE` keyword match.

Tests: `python3 -m unittest discover -s . -p 'test_*.py' -v` (agent tests need `pip install -r requirements.txt`).

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
2. Let the agent suggest notes for you to approve (it never writes memory itself today).
3. Swap the CLI for a Telegram bot so you can text it tasks from your phone.
4. Mount a persistent folder into the Docker container so files survive restarts.
