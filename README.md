# Saturn MCP

<img src="apps/web/public/logo.png" alt="Saturn" width="96" />

Saturn is an MCP server that keeps long tool output out of a coding agent's context. It is for anyone who runs an agent such as Claude Code or Codex against a real codebase and watches test logs, lint reports, and file dumps eat the context window.

## What problem it solves

| Without Saturn | With Saturn |
|---|---|
| Every tool result is re-read on every later turn | Long output stays in a local store |
| A 25,000-token lint report costs those tokens again and again | The agent gets a short digest and an artifact id |
| The conversation moves toward compaction | The context window stays free |
| The agent usually needed five lines of the report | The agent asks for exactly the part it needs |

## What it does

The agent calls Saturn instead of running the noisy command itself. Saturn runs it, keeps the full output in a local store, and returns a short digest with an artifact id. The agent can then ask for exactly the part it needs.

| Tool | What the agent gets |
|---|---|
| `saturn_run` | Runs a test, build, lint, or read-only git command. Short output comes back unchanged; long output becomes a digest of the failures plus an artifact id. |
| `saturn_read` | A file with line numbers. A long file returns an outline, then exact line ranges on request. |
| `saturn_search` | Regex search across files, capped to a size budget, with counts for what was left out. |
| `saturn_ask` | A read-only worker explores files and answers briefly. A second model review checks claims against their cited source text. |
| `saturn_query` | Part of a stored output: by regex, by line range, or by question. |

## Results

| Setup | Value |
|---|---|
| CPU | Intel i7-13700K |
| Memory | 30.6 GiB |
| GPUs | 2 × NVIDIA RTX 3080 Ti |
| OS | Linux |
| Model server | LM Studio, one worker at a time |
| Corpus | 60 cases from click, requests, ripgrep, chi, commander, and p-limit |
| Interface tested | Saturn's public MCP tools |

| Measure | Result |
|---|---|
| Output returned, against the raw output | 98.9% fewer bytes (95% interval 98.5% to 99.2%); median case 96.9% |
| Real agent, 8 tasks, with and without Saturn | 8 of 8 correct in both; token totals within 1% |
| Saturn's own time per call, no model | 4.9 ms median for processing and storage |
| Profiling cost, off by default | 0.237 ms median per call |
| Throughput with 1 and 4 agents | 0.289 and 0.300 workflows per second |
| Cancellation | 80 of 80 cases accepted a follow-up read |

| Worker model | Workflows done | Literal fact recall | p95 workflow seconds |
|---|---:|---:|---:|
| Ornith 1.0 9B | 199 of 200 | 0.956 | 12.2 |
| Qwen3.8 27B | 200 of 200 | 0.960 | 14.0 |
| Gemma 4 12B QAT | 200 of 200 | 0.960 | 10.3 |
| Gemma 4 E4B | 195 of 200 | 0.941 | 4.4 |

| Saturn stage, no model | p50 ms | p95 ms |
|---|---:|---:|
| Configuration refresh | 0.012 | 0.022 |
| Authentication | 0.097 | 0.191 |
| Workspace checks | 0.049 | 0.089 |
| Command policy | 0.078 | 0.145 |
| Database-lock acquisition | 0.020 | 0.245 |
| Processing and storage | 4.887 | 77.197 |

| Limit | What it means |
|---|---|
| Bytes, not tokens | The 98.9% is a size. It is not a count of an agent's tokens. |
| Agent test | Outputs were small, so it shows no accuracy loss, not a token saving. |
| Recall | A literal text match. Model review only; human review is pending. |
| Gemma 4 26B | Its model server crashed during warm-up, so it has no result. |
| `saturn_read` | Larger than the raw file in 20 of 32 cases, because it adds line numbers. |

The [benchmark procedure and full results](bench/README.md) show how to reproduce these numbers.

## Requirements

| Need | Detail |
|---|---|
| Git, Python, uv | Git, [Python 3.12 or newer](https://www.python.org/downloads/), and [uv](https://docs.astral.sh/uv/getting-started/installation/) |
| Node.js and npm | [Node.js and npm](https://nodejs.org/en/download). Node `24.22.0` is pinned in `.nvmrc`. The dashboard also accepts `^20.19.0 \|\| >=22.12.0` |
| Internet | For dependency installation. Python uses `services/saturn/uv.lock`; the dashboard uses `apps/web/package-lock.json` |
| Not needed | A database server, a GPU, a model download, or an API key for deterministic digests. SQLite comes with Python |
| Platforms | The foreground service runs on Linux and Windows. Background start needs Windows and PowerShell 7. macOS setup is not verified |

## Quick start

1. Check that the tools are installed. Each command prints a version:
   ```bash
   git --version
   uv --version
   node --version
   ```
2. Install what is missing:

   | Missing | Install |
   |---|---|
   | `uv` on Linux or macOS | `curl -LsSf https://astral.sh/uv/install.sh \| sh`, then open a new terminal |
   | `uv` on Windows | `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 \| iex"`, then open a new terminal |
   | `git` | [git-scm.com/downloads](https://git-scm.com/downloads) |
   | `node` | [nodejs.org](https://nodejs.org/en/download). Version `24.22.0` is pinned in `.nvmrc` |

   `uv` also finds Python 3.12 for you, so you do not need to install Python yourself.
3. Clone the repository and open it:
   ```bash
   git clone https://github.com/mugilnimbus/Saturn-MCP.git saturn-mcp
   cd saturn-mcp
   ```
4. Install the locked dependencies and build the dashboard:
   ```bash
   uv run --no-project python scripts/setup.py
   ```
5. Start Saturn:
   ```bash
   uv run --project services/saturn --no-sync saturn serve
   ```
6. In a second terminal, connect your client. See [Connect Claude Code and Codex](#connect-claude-code-and-codex) for each option:
   ```bash
   uv run --project services/saturn --no-sync saturn connect claude --preset standard
   uv run --project services/saturn --no-sync saturn connect codex --preset standard
   ```
7. Optional: choose a worker model from the terminal. Use the id your model server lists:
   ```bash
   uv run --project services/saturn --no-sync saturn settings set model <model-id>
   ```
8. Check everything:
   ```bash
   uv run --project services/saturn --no-sync saturn doctor
   ```
9. Start a new Claude Code session, or restart Codex.

| Prefer the browser? | Where |
|---|---|
| Dashboard | `http://127.0.0.1:9000/` |
| Choose a worker model | **Settings** |
| Connect a client | **Connections** |

| About setup | Detail |
|---|---|
| What it does | Installs the locked dependencies, builds the dashboard, and creates only a missing Saturn-home `.env` |
| How it tests | It checks health and the built dashboard with a disposable service, then stops that service |
| What it keeps | Existing environment files |
| What it does not do | Connect clients, install global commands, or download models. It never changes PATH |
| Unattended | `uv run --no-project python scripts/setup.py --yes`. Run it again after dependency changes |
| Saturn home | `~/.saturn`. Set `SATURN_HOME` before setup and serve to use another. The checkout's `.env` is not used by setup |
| Startup settings | See [Configuration](#configuration) |

### Connect Claude Code and Codex

1. Start Saturn in one terminal and leave it running:
   ```bash
   uv run --project services/saturn --no-sync saturn serve
   ```
2. In a second, interactive terminal, connect Claude Code:
   ```bash
   uv run --project services/saturn --no-sync saturn connect claude --preset standard
   ```
3. Connect Codex:
   ```bash
   uv run --project services/saturn --no-sync saturn connect codex --preset standard
   ```
4. Read the changes Saturn shows for each client, then confirm.
5. Start a new Claude Code session. Restart Codex.
6. In Codex, run `/hooks` and trust the Saturn hook.
7. Check the result:
   ```bash
   uv run --project services/saturn --no-sync saturn doctor
   ```

| Option | What it does |
|---|---|
| Dashboard | **Connections** previews and installs the same changes with a click |
| `--preset` | `standard`: read tools run without asking, and the client asks before Saturn runs a command. `read-only`: no command running. `hands-off`: nothing asks |
| `--hooks`, `--no-hooks` | Add the shell hooks, or leave them out. See [Optional: shell hooks](#optional-shell-hooks) |
| `--print` | Shows the entries without writing them |
| Connected already | Run `saturn disconnect claude` or `saturn disconnect codex` first, or Saturn adds a second harness such as `claude-code-2` |
| Undo | `saturn disconnect <client>`, or `saturn uninstall` for every client |

### Optional terminal setup and global command

1. Run any terminal command from the project root as `uv run --project services/saturn --no-sync saturn <command>`, for example `... saturn doctor`.
2. On Windows, run `./scripts/register-saturn.ps1` from PowerShell 7 to register the `saturn` command for the current user. It is optional.
3. Keep `saturn serve` running in another terminal on Linux. On Windows, the wizard can start the background service.
4. Run `saturn setup`. The wizard covers the model server, worker model, service, and clients. It shows client changes before it asks to apply them.
5. For Codex, trust the hooks through `/hooks`.

### Model server, without a window

| Server | Start it |
|---|---|
| LM Studio | `lms daemon up`, then `lms get <model>`, then `lms server start` (address `http://127.0.0.1:1234/v1`) |
| Ollama | `ollama serve`, then `ollama pull <model>` (address `http://127.0.0.1:11434/v1`) |

Pick a model that supports tool calls; setup tests it. Saturn unloads a model it loaded after two idle minutes, and never one you loaded yourself.

### Check and undo

| Command | What it does |
|---|---|
| `saturn doctor` | Checks every configuration file, the service, the model server and model, and each connected client, and says how to fix what fails |
| `saturn disconnect codex` | Removes Saturn's entries from a client. Add `--revoke` to also revoke its harness |
| `saturn uninstall` | Does the same for every client and lists the remaining steps |

## How connecting works

A **harness** is one client's access: a name, a handle, the tools it may call, optional folders and denied commands, whether its shell hooks are on, and a token. Connecting writes Saturn into the client's own configuration, for every project:

| Client | Saturn's entries |
|---|---|
| Claude Code | `~/.claude.json`: the `saturn` MCP server. `~/.claude/settings.json`: tool approvals and, optionally, two shell hooks |
| Codex | `~/.codex/config.toml`: one block between `# >>> saturn` markers with the server, both timeouts, the enabled tools, and optionally a shell hook |

| Topic | How it works |
|---|---|
| Tokens | None in client configuration. The entries run `saturn stdio --harness <handle>`, which reads the token from `~/.saturn/credentials/`. Rotating a token needs no client change |
| Permissions | A preset: **Standard** (read tools run without asking; the client asks before Saturn runs a command), **Read-only** (no command running), or **Hands-off** (nothing asks) |
| Changes | Every change is shown first, backed up, recorded, and reversible |
| By hand | `saturn connect <client> --print` shows the entries without writing them. Connections has a copyable version |
| Other clients | Start `saturn stdio --harness <handle>`, or use Streamable HTTP at `http://127.0.0.1:9000/mcp` with `Authorization: Bearer <token>` |
| Who decides | The client's permission mode decides whether it asks before a Saturn tool. Its sandbox does not cover commands Saturn runs; Saturn's policy does |

The client's own permission mode decides whether it asks before calling a Saturn tool. Its sandbox does not cover commands Saturn runs; Saturn's own policy does.

## What agents may run

Saturn runs commands in its own process, so its policy is the limit. The rules are in `~/.saturn/policy.toml`:

| Setting | Meaning |
|---|---|
| `preset` | `standard`: built-in test, build, lint, and read-only inspection commands. `open`: anything not denied |
| `[folders] allowed` | Folders agents may work in. Empty: any folder an agent names as its workspace |
| `[commands] allow`, `deny` | Command patterns, compared word by word; a final `*` matches any further words. Deny wins |
| `[hooks] scope` | `noisy` (test, build, lint), `all`, or `off` |

| Always enforced | Detail |
|---|---|
| Paths | Every argument that names a path stays inside the call's folder |
| Credentials | Credential files are never readable |
| Not standard | Commands that change source files, install or fetch dependencies, or run an arbitrary project script. Allow them explicitly |

```bash
saturn policy test "npm run deploy"
```

```bash
saturn policy allow "npm run deploy"
```

| Policy change | How it works |
|---|---|
| Widening | Asks you to confirm in a terminal |
| Per harness | Each harness can narrow the policy with its own folders and denied commands (on Connections) |
| Hand edits | Apply on the next call. An invalid file is not applied; the dashboard and `saturn doctor` show why |

## Configuration

Runtime files live in the Saturn home, `~/.saturn` by default. `SATURN_HOME` selects another location:

| File | Holds | Change it with |
|---|---|---|
| `.env` | The model server's API key and values needed before start | An editor; restart Saturn |
| `settings.toml` | Model server, address, model, output and time limits | Dashboard Settings, `saturn settings set <key> <value>`, or an editor |
| `policy.toml` | Command rules, folders, hook scope | `saturn policy …` or an editor |
| `credentials/` | One token file per harness | Connections (rotate, revoke) |
| `installs.json`, `backups/` | What Saturn wrote into each client, and the files before | `saturn connect`, `disconnect` |
| `data/` | The store: runs, traces, outputs, harnesses, audit log | Nothing; it is Saturn's |

Startup environment variables come from the Saturn home's `.env`, or the process environment:

| Variable | Default | Purpose and source |
|---|---|---|
| `LOCAL_SERVER_API_KEY` | empty | Optional key from the local model server. Setup hides input and does not display the value. |
| `SATURN_HOST` | `127.0.0.1` | Loopback interface. Remote listening is refused. |
| `SATURN_PORT` | `9000` | Unused local TCP port. |
| `SATURN_DATA_DIR` | empty | Optional store path. Empty selects `data/` in the Saturn home. |
| `SATURN_SHUTDOWN_GRACE_S` | `5` | Request shutdown allowance, from 0 through 600 seconds. |
| `SATURN_LLM_TIMEOUT_S` | `180` | Model-call timeout, greater than 0 and at most 3600 seconds. |
| `SATURN_LLM_CONCURRENCY` | `1` | Concurrent model calls, from 1 through 8. |
| `SATURN_INTERNAL_TIMING` | `false` | Bounded internal request timing. Enable only for isolated profiling; restart to apply. |

Set `SATURN_HOME` in the process environment to select the home before reading `.env`.
`SATURN_URL` and `SATURN_TOKEN` are optional bridge/hook client variables, not startup settings to enter during checkout setup.
Never commit a real `.env`. Setup quotes new values, validates them, and refuses values that dotenv would expand or alter.

`settings.toml` keys:

| Key | Default | Meaning |
|---|---|---|
| `provider` | `lmstudio` | `lmstudio`, `ollama`, or `openai` (any other OpenAI-compatible server) |
| `base_url` | `http://127.0.0.1:1234/v1` | Model server address on this computer |
| `model` | empty | Worker model id; empty means digests by code only |
| `reasoning_effort` | `none` | Sent to the model; `none` is fastest |
| `llm_enabled` | `true` | Use the model at all |
| `inline_token_limit` | 700 | Output up to this size is returned unchanged |
| `digest_token_budget` | 450 | Largest digest |
| `command_timeout_s` | 300 | A command running longer is stopped |
| `model_idle_unload_s` | 120 | Unload a model Saturn loaded after this idle time; 0 keeps it |
| `progress_interval_s` | 15 | Progress updates on a long call; 0 turns them off |

`saturn config` shows every file, setting, and rule with where it came from.

## See what happened

| Question | Dashboard | Terminal |
|---|---|---|
| What did agents run, and what did it save? | Overview, Runs | `saturn runs` |
| What exactly came in, which path did it take, what did the model see and say, and what went back? | A run's trace | `saturn runs show <id> --full` |
| Why was a command allowed or refused, for which harness, in which folder? | A run's trace | `saturn runs show <id>` |
| Who changed access, settings, the policy, or a client, and when? | Runs → What changed in Saturn | `saturn events` |
| Is everything working? | Model, Settings | `saturn doctor`, `saturn logs` |

| A run's trace, top to bottom | What it shows |
|---|---|
| Request | How it arrived (stdio, HTTP, or a shell hook), the client's name and version, the MCP request id, and every argument |
| Path | Each step with its time: authentication, workspace choice, policy rule, command, digest, each model call |
| Model calls | The complete prompt (every message and the tools offered) and the complete reply |
| Response | Exactly what the agent received, or the error it was told |

| Also recorded | Detail |
|---|---|
| Refused requests | A bad token, a tool the harness may not use, or a folder outside the policy are kept as rejected runs |
| Retention | Full bodies are masked and kept for 48 hours. The run, its steps, and short previews are kept after that |
| Terminal views | Read the store directly, so they work while Saturn is stopped |

## Start, stop, and status

```bash
saturn start
```

| Command | What it does |
|---|---|
| `saturn start` | Starts Saturn in a hidden background process and waits for it to answer |
| `saturn stop` | Lets requests finish for up to `SATURN_SHUTDOWN_GRACE_S` seconds, runs cleanup, and unloads any model Saturn loaded |
| `saturn status` | Shows whether Saturn runs |
| `saturn serve` | Runs Saturn in a terminal (use this on other platforms) |

All three work from any folder and accept `--port`, `--timeout`, and `--json`. The launcher never stops a process it did not start. A client's `saturn stdio` starts Saturn when it is not running.

## Optional: shell hooks

| Hook | Behavior |
|---|---|
| Before a plain test, build, or lint command | Saturn declines it and tells the agent to call `saturn_run` (`SATURN_DIRECT=1 <command>` is the way out) |
| After a successful command with long output | Claude Code shows Saturn's digest instead. Codex cannot replace output, so it gets the first hook only |
| Scope | Only for a harness that has reached Saturn's tools |
| When Saturn is down | Hooks never block: the command runs as usual |

| Hook task | Command |
|---|---|
| Add hooks when you connect Claude Code | `saturn connect claude --hooks` |
| Add hooks when you connect Codex | `saturn connect codex --hooks` |
| Add hooks to a client that is already connected | `saturn connect claude --harness claude-code --hooks`, or `saturn connect codex --harness codex --hooks` |
| Preview the hook entries without writing | Add `--print` (or `--diff` for the changed lines) |
| Choose which commands hooks catch | `saturn policy hooks noisy` (test, build, lint), `saturn policy hooks all`, or `saturn policy hooks off` |
| Turn hooks off without changing the client | `saturn policy hooks off` |
| Trust the Codex hook | Run `/hooks` inside Codex |
| Check the result | `saturn doctor` |

## How it works

[Open the layered architecture and request flows](docs/architecture/index.html).

| Step | What happens |
|---|---|
| 1. Policy | A command is parsed without a shell, its path arguments are kept inside the call's folder, and it is checked against deny rules, allow rules, and the preset. The deciding rule is recorded |
| 2. Digest by code | Output is classified (pytest, linter, compiler diagnostics, traceback, diff, JSON, log). Failures are extracted, grouped, and counted. No model is used |
| 3. Model only when needed | If code cannot tell what matters, or the caller states a goal, the output is deduplicated and ranked and the worker model reads short excerpts. Invalid citations are dropped. A second model review omits claims it does not accept |
| 4. Worker | For `saturn_ask`, a bounded LangGraph loop lets the model pick read-only tools, with the evidence checked |

See the [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), and [security](docs/SECURITY.md).

## Development

Run these commands from the project root:

| Task | Command |
|---|---|
| Guided dependency setup | `python scripts/setup.py` |
| Unattended dependency setup | `python scripts/setup.py --yes` |
| Lint, types, tests, build, architecture, and isolated startup | `python scripts/check.py` |
| Foreground service | `uv run --project services/saturn --no-sync saturn serve` |
| Run the complete benchmark contract | `uv run --project services/saturn --no-sync python -m bench run --provisional` |
| Run internal timing and profiling-cost schedules | `uv run --project services/saturn --no-sync python -m bench internal --provisional` |
| Prepare the agent A/B test workspace and prompts | `uv run --project services/saturn --no-sync python -m bench agent-prepare --output var/bench/agent/workspace` |
| Service command help | `uv run --project services/saturn --no-sync saturn --help` |
| Frontend development server | `npm --prefix apps/web run dev` |

| Development topic | Detail |
|---|---|
| Frontend | The Vite server forwards `/api` to port 9000. Browser developer tools inspect requests and console errors |
| API docs | `http://127.0.0.1:9000/api/docs` while Saturn runs |
| Development data | Use a separate `SATURN_HOME` under `var/`, with the same home for administration commands. Stop that service before removing its home |
| `check.py` | Isolates its runtime and client directories under `var/`. It excludes live-model tests |
| Manual checks | Browser regressions in `apps/web/tests`, real-model evaluations, Windows launcher tests in `scripts/tests/test-saturn.ps1` (stop the managed Windows service first) |
| CI | Runs only from **Run workflow** on the **Actions** tab. Select **both** (default), **linux**, or **windows**. A newer run cancels an older one on the same branch |
| Local against hosted | Local checks include Windows type analysis, but a local pass does not show that a hosted run or another operating system passed |

## Troubleshooting

| Problem | Action |
|---|---|
| `python` is missing on Linux | Use `python3` with Python 3.12 or newer for the setup and check scripts. |
| A tool is missing or Node is unsupported | Follow the setup error's installation link. Use the Node version in `.nvmrc`, then open a new terminal. |
| Dependency installation fails | Read the named step's output. Check network access and retry setup. Keep the committed lockfiles. |
| The dashboard is not built | Run `python scripts/setup.py --yes` from the project root. |
| Port 9000 is occupied | Choose another `SATURN_PORT` in the Saturn home's `.env`, restart the service, and open that port. |
| Startup settings are invalid | Repair the named variable in the Saturn home's `.env`. An existing file is preserved by setup. |
| Isolated startup fails | Read the log path printed under `var/guided-setup/`. Retry setup after fixing the reported error. |
| Model server is absent | Keep the worker model empty. Deterministic digests do not need a model server. |
| A client does not see Saturn | Start a new Claude Code session or restart Codex, then run `saturn doctor` with the same Saturn home. |

## Limits

| Limit | What it means |
|---|---|
| Local, single user | Harnesses share stored outputs. The dashboard and its API are a trusted local interface without a login |
| Not a sandbox | Allowed builds and tests run project code with your privileges |
| Masking | Catches configured values and common credential shapes, not every possible secret |
| Model review | Can accept an incorrect claim or reject a correct one. A failed review omits model claims; deterministic findings remain |
| Model quality | A working provider connection does not guarantee reliable tool calls or claim review from the chosen model |

## Contributing and license

Saturn is licensed under the [Apache License, Version 2.0](LICENSE). The benchmark corpus in `bench/dataset` holds files from other projects; each keeps its own licence (see [NOTICE](NOTICE) and the table in `bench/README.md`).


## Local operations

### Where things live

Everything is in the Saturn home folder: `~/.saturn`, or the folder named by `SATURN_HOME`.

| Path | Holds |
|---|---|
| `.env` | `LOCAL_SERVER_API_KEY` and values needed before start: `SATURN_HOST`, `SATURN_PORT`, `SATURN_DATA_DIR`, `SATURN_SHUTDOWN_GRACE_S`, `SATURN_LLM_TIMEOUT_S`, `SATURN_LLM_CONCURRENCY` |
| `settings.toml` | Model server, address, model, output budgets, command time limit, idle unload time, progress interval |
| `policy.toml` | Preset, allowed folders, allow and deny rules, hook scope |
| `credentials/<handle>.token` | One token per harness |
| `installs.json`, `backups/` | Saturn's entries in each client and the files as they were before |
| `data/saturn.db` | The store |

`saturn config` lists every file and value with where it came from; unknown `.env` keys are reported. `.env` changes need a restart; `settings.toml` and `policy.toml` apply on the next call.

### Setting up

1. `saturn setup` in your own terminal: requirements, model server, model test, start, clients, check.
2. To connect a client later: `saturn connect claude` or `saturn connect codex` (`--harness`, `--preset`, `--hooks`/`--no-hooks`, `--print` to only show the change). The dashboard's Connections page does the same.
3. `saturn doctor` (`--deep` also tests the model) checks everything and exits non-zero on a failure.

Connecting needs an interactive terminal and a confirmation, or a click in the dashboard.

### Multiple projects

| Topic | How it works |
|---|---|
| Folder | A client sends its project's absolute folder as `workspace_root` |
| No folder sent | `saturn stdio` adds its own working folder, the one the client was started in |
| Several projects | Calls keep separate folders, so simultaneous projects do not affect each other |
| Allowed folders | The folder must be inside `[folders] allowed` when that list is set, and inside the harness's folders when it has any |
| `python` | Bare `python` uses the project's `.venv` when available, otherwise Saturn's interpreter |
| Dependencies | `uv run` does not sync. `cargo` and `go` run offline |

### Process control

| Command | Effect |
|---|---|
| `saturn start` | Start in the background (Windows) and wait for it to answer |
| `saturn status` | Running, stopping, stopped, or an unmanaged process on the port |
| `saturn stop` | Request shutdown; requests get `SATURN_SHUTDOWN_GRACE_S` seconds |
| `saturn serve` | Run in this terminal (any platform) |
| `saturn logs` | The background server's error log (`--stdout` for its output) |

`--timeout` changes how long the caller waits; it never force-kills a server. The launcher refuses an occupied port and never stops a process it did not start.

| Check | Meaning |
|---|---|
| `/api/health` answers | The process is alive |
| `/api/ready` reports `degraded` | A model is selected but the model server is not usable; code digests still work |
| MCP 401 | Token missing, wrong, disabled, expired, or revoked |
| MCP 503 | No harness exists yet |

### Observability

| Question | Dashboard | Terminal |
|---|---|---|
| What ran, and what did it save? | Overview, Runs | `saturn runs` (`--tool`, `--status`, `--harness`, `--json`) |
| Why was it allowed or refused? | A run's trace | `saturn runs show <id>` |
| What exactly came in and went out, and what did the model see? | A run's trace (Show full) | `saturn runs show <id> --full` |
| Who changed what? | Runs → What changed in Saturn | `saturn events` (`--kind access|settings|policy|install|model|service`) |

Full request, response, and model bodies are kept 48 hours; runs, steps, and previews are kept until the data folder is replaced.

### Backup and restore

1. Stop Saturn and confirm it is stopped.
2. Copy the whole Saturn home folder to private storage; it holds tokens and the API key.
3. To restore, keep Saturn stopped and put the folder back.
4. Start Saturn and run `saturn doctor`.

Restoring an older folder restores its access state too; review Connections afterwards.

### Removing Saturn

1. `saturn uninstall` removes Saturn's entries from every connected client and revokes their harnesses.
2. `saturn stop`.
3. On Windows, `.\scripts\register-saturn.ps1 -Remove` from the repository.
4. Delete the Saturn home folder.


## Testing

Use the existing project environments. Installing dependencies is a separate setup step.

| Area | Directory | Command |
|---|---|---|
| Service lint | `services/saturn` | `uv run --no-sync ruff check src tests evals` |
| Service types | `services/saturn` | `uv run --no-sync mypy` |
| Service tests | `services/saturn` | `uv run --no-sync pytest -m "not live"` |
| Dashboard types | `apps/web` | `npm run check` |
| Dashboard tests | `apps/web` | `npm test -- --run` |
| Dashboard build | `apps/web` | `npm run build` |
| Golden corpus integrity | Repository root | `uv run --project services/saturn --no-sync python -m bench validate` |
| Golden label review | Repository root | `uv run --project services/saturn --no-sync python -m bench review --output var/bench/review-packet.json` |
| Architecture model | Repository root | `node docs/architecture/check.mjs` |
| Windows launcher | Repository root | `pwsh -NoProfile -File scripts/tests/test-saturn.ps1` |

The [benchmark dataset contract](bench/README.md) defines shared inputs, scoring, provenance, and review requirements. Corpus validation does not measure model quality or performance.

### Isolation

- Build test containers with `files=False` (configuration, credentials, and installs in memory) or a temporary `home_raw`, and `db_path=":memory:"`. The shared fixture asserts the resolved home and data folder before building.
- Point `CLAUDE_CONFIG_DIR` and `CODEX_HOME` at temporary folders before exercising client connection; tests never touch a real client's files.
- Subprocess tests start Saturn with `SATURN_HOME` set to a temporary folder and a free port.
- Launcher tests require the managed service to be stopped and use isolated control paths.

### What the suites cover

| Area | Covered by |
|---|---|
| Policy: standard grammar, path guards, rule order, harness narrowing | `test_policy.py` |
| Settings and policy files, client writers, hook relay | `test_setup.py` |
| Harness lifecycle, credential files, audit log, install API, MCP permissions and folders | `test_access.py` |
| Commands: `settings`, `policy`, `connect`, `doctor`, `runs`, `events`, `config` | `test_cli.py` |
| Hooks for Claude Code and Codex, redirect tracing | `test_hook.py` |
| Live configuration reload, settings persistence, policy endpoints | `test_transport.py` |
| Stdio with a harness token file and workspace defaulting, against a real server process | `test_stdio_bridge.py` |
| Request, path, model bodies, reply, rejected requests, body expiry and masking | `test_tracing.py` |

### Evaluation

1. Start an isolated Saturn with its own `SATURN_HOME`, a model server, and a selected model.
2. Create an evaluation-only harness and put its token in `SATURN_EVAL_TOKEN`.
3. Run `services/saturn/evals/run_evals.py --url <isolated-server> --workspace-root <repository>`; `--models a,b` compares models.
4. Inspect the responses, stored artifacts, evidence lines, and recorded model usage; use `--out var/evals/<run>` for disposable reports, or another folder to keep them.
5. Unload only models the evaluation loaded.

The runner restores the original settings afterwards. Fixture success is not a claim about arbitrary projects, and line-existence checks do not establish that a citation supports its claim.

### Boundary probes

- Use synthetic credentials and ordinary files for masking tests.
- Use sibling fixture folders for containment tests; never inspect unrelated real files.
- Check refused command forms with `saturn policy test` or the policy tests; never execute them.
- Test permissions on existing HTTP sessions as well as new ones.

Visual checks, real-model evaluation, process observations, and automated checks are different kinds of evidence. A build or a mocked model call does not show that a feature works end to end.
