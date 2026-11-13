# Contracts and Integrations

## Component contracts

### MCP tools (owner: Saturn service)

Transport: MCP Streamable HTTP at `/mcp`, or the `saturn stdio` command, which forwards to that endpoint. Every tool returns plain text. A refusal or failure is an MCP tool error whose text ends with a stable code in brackets.

| Tool | Arguments | Returns |
|---|---|---|
| `saturn_run` | `command` (one command, no shell operators); `cwd` (optional, inside the workspace); `goal` (optional) | The output if short, otherwise a status line, a digest, and an artifact id |
| `saturn_read` | `path`; `start`, `end` (optional line numbers) | Numbered lines; or an outline when the file is long and no range was given |
| `saturn_search` | `pattern` (regex, case-insensitive); `path`, `glob` (optional); `context` (0 to 3) | Matches grouped by file within a size budget; counts and an artifact id for the rest |
| `saturn_ask` | `task`; `paths` (optional) | A short answer, existing source-line excerpts, and the step count |
| `saturn_query` | `artifact_id`; exactly one of `pattern`, `lines` (`"120-180"`), `question` | The matching lines, the range, or an answer |

Every tool accepts `workspace_root`, the active project's absolute folder. Without it Saturn uses the client's MCP roots (two-second deadline), then an absolute `cwd`, then the single folder the harness or policy allows; otherwise the call is refused with a message asking for `workspace_root`. The folder must be inside the policy's allowed folders when that list is set, and inside the harness's folders when it has any. Query needs a workspace only for file-backed answers.

Read, search, ask, and query are annotated read-only; run is not. Short output is returned inline (700 estimated tokens by default); long output returns a bounded digest (450) and an artifact reference.

Error codes: `invalid_input`, `policy_violation`, `not_found`, `model_unavailable`, `model_output_invalid`, plus `unauthorized` and `permission_denied` before a tool runs.

Traceability: every tool call is a run. It records the route, the client's name and version (the stdio command forwards the real client's in `X-Saturn-Client` and sets `X-Saturn-Transport: stdio`), the MCP session id when the protocol version has one, the request id, every argument, each step, each model call's complete prompt and reply, and the exact reply text. A call refused before its tool runs (unauthorized, permission denied, workspace refused) is a run with route `rejected`; so is a refused `POST /mcp` without a valid token (`mcp_request`). Bodies are masked, capped at 2 MB, and kept 48 hours.

Behavior: calls are synchronous; `saturn_run` is bounded by `command_timeout_s` (300 s by default) and re-executes each time. Every HTTP request to `/mcp` requires `Authorization: Bearer <token>` for an enabled, unexpired, unrevoked harness, including session follow-ups. A missing or invalid token gets 401 with a `WWW-Authenticate: Bearer` challenge; no harness at all gets 503. Rejections happen before the MCP handler and create no runs. A tool the harness may not use returns `[permission_denied]`.

Progress: when the client sends a progress token, the tool reports elapsed seconds every `progress_interval_s` (15 by default) until it returns. Progress carries no partial output.

### Command policy (owner: Saturn service)

`saturn_run` and the pre-command hook ask the policy for a decision. The first step that applies decides:

| Step | Outcome |
|---|---|
| Guards | One argv without a shell; every argument that names a path resolves inside the call's folder and is not a credential file. Refused with rule `guard` |
| Deny rules | From `policy.toml`, then from the harness. Refused with rule `deny <pattern>` |
| Allow rules | From `policy.toml`. Allowed with rule `allow <pattern>` |
| Preset | `standard`: the built-in grammar; `open`: allowed. Rule `preset standard` or `preset open` |

A pattern is compared word by word after parsing; the first word as a program name; a final `*` matches any further words; `*` inside a word matches any text. The refusal message names the rule and tells the agent how to ask the owner. Each run records the deciding rule (`decision`).

The standard grammar allows tests, builds, linters in check mode, and read-only inspection: read-only git subcommands (`branch` lists only); `npm`/`pnpm`/`yarn` test, list, view, audit without `fix`, and scripts named like test, build, lint, check, typecheck, coverage, or ci; `npx` with tsc, eslint, vitest, jest, prettier and no `--yes`, `--package`, or write flags; `python -m pytest|unittest|ruff|mypy`; `uv run` of a standard command without `--with`; `make` with no target or a task-like target; `cargo` and `go` build, test, and check commands; `dotnet test|build --no-restore`; `rg`, `ls`, `dir`. `uv` commands run with `UV_NO_SYNC=1`; cargo and go run offline.

### Stdio command (owner: Saturn service)

`saturn stdio --harness <handle>` (`python -m saturn.bootstrap.cli stdio`) is an MCP server on standard input and output for clients that start a local command. It owns no tools and no state.

| Aspect | Contract |
|---|---|
| Credential | `SATURN_TOKEN` when set; otherwise the harness's token file in the Saturn home folder |
| Workspace | Adds `workspace_root` = its own working folder to a call that has none |
| Address | The configured host and port, or `SATURN_URL` |
| Starting the service | If health does not answer and `SATURN_URL` is not set, starts Saturn once through the Windows launcher and waits up to 45 s. A running service is used as it is |
| Initialize | Answered at once, before the service is up |
| Calls | Each uses a fresh upstream session, so a restarted service needs no reconnect |
| Errors | A tool error naming the cause: no token, token refused (401), no harness (503), or the service could not start |
| Output | Only protocol messages on standard output |

### Shell hooks (owner: Saturn service)

Clients run the hook relay, `python -m saturn.bootstrap.hook_relay <claude|codex> <event> --harness <handle>`. It reads the event from standard input, posts it with the harness token to Saturn, and prints the answer; on any failure it prints nothing and exits 0. It imports only the standard library.

| Endpoint | Acts when | Answer |
|---|---|---|
| `POST /api/hooks/claude/pre-tool-use` (Bash, PowerShell) and `POST /api/hooks/codex/pre-tool-use` (Bash) | The harness has hooks on, may use `saturn_run`, and has reached `/mcp` since Saturn started; the command is one plain test, build, or lint command the policy allows, in a folder Saturn may use | `200` with `permissionDecision: "deny"` and a reason naming `saturn_run`, the command, the folder, and the direct form `SATURN_DIRECT=1 <command>`. Recorded as a `saturn_hook` run with route `redirect` |
| `POST /api/hooks/claude/post-tool-use` | Hooks on; Run and Query allowed; prior MCP contact; long output from a command in scope; no `SATURN_DIRECT=1`; the digest is shorter | `200` with `updatedToolOutput`: the original result with its text replaced by a digest and artifact id |

Otherwise `204`. Both require a harness bearer token and accept up to 8 MB, counted while streaming. Codex cannot replace a tool's output, so it has no post hook. Errors: `401`, `413`, `422`; clients treat any hook failure as "continue unchanged".

### Dashboard API (owner: Saturn service)

JSON over HTTP under `/api`; OpenAPI at `/api/openapi.json`.

| Operation | Meaning |
|---|---|
| `GET /api/health` | `{"status":"ok"}` when the process is up |
| `GET /api/ready` | Store status, the selected `worker_model`, and the model server's status; `degraded` only when a model is selected and the server is unusable |
| `GET /api/overview?window=15m\|1h\|6h\|24h\|7d` | Totals, a time series, and breakdowns. `ETag`; `304` on match |
| `GET /api/runs?limit&before&tool&status&harness&q&window` | Runs newest first, with harness, workspace, route (`stdio`, `http`, `hook`, `in-process`), client name, MCP session and request ids, and policy decision. `limit` up to 200 |
| `GET /api/runs/{id}` | One run with its spans (starting with `authenticate` and `workspace`), model calls, and payloads (id, kind, size, 300-character preview) |
| `GET /api/payloads/{id}` | One full body: `request`, `response`, `llm_prompt`, or `llm_output`; `404` once expired |
| `GET /api/events?kind&limit&before` | Audit events newest first: kind (`access`, `settings`, `policy`, `install`, `model`, `service`), subject, action, actor (`dashboard`, `terminal`, `file`, `service`), detail |
| `GET /api/artifacts?limit`, `GET /api/artifacts/{id}?start&count` | Stored outputs; up to 400 numbered lines per page |
| `GET /api/local-server` | Model server reachability, latency, provider, address, and models |
| `GET /api/settings` | Settings, their limits, providers and their default addresses, file paths and load errors, unknown `.env` keys, and the policy summary. Never the API key |
| `PUT /api/settings` | Change any of `provider`, `base_url`, `model`, `reasoning_effort`, `llm_enabled`, `inline_token_limit`, `digest_token_budget`, `command_timeout_s`, `model_idle_unload_s`, `progress_interval_s`; writes `settings.toml` |
| `POST /api/settings/test-model` | One constrained tool call to the selected model; recorded as a `model_check` run |
| `GET /api/policy` | Effective rules with their sources, folders, hook scope, file path, and load error |
| `POST /api/policy/test` | `{command, folder?, harness?}` → the decision and its reason. Nothing runs |
| `GET /api/connections` | Endpoint, hook addresses, tools, presets, clients with their install records, harnesses (with handle, limits, token-file path, stdio and hook commands, installs), and recent access and install events; no tokens |
| `POST /api/connections` | Create `{name, handle?, tools, expires_at?, folders?, deny?, hooks?}`; `201` with `{harness, token}` once; the token is also saved to its file |
| `PUT /api/connections/{id}` | Replace name, tools, expiry, enabled, folders, denied commands, hooks |
| `PATCH /api/connections/{id}` | Set `{enabled}` |
| `POST /api/connections/{id}/rotate` | New token, returned once and saved to the file |
| `DELETE /api/connections/{id}` | Revoke permanently and delete the token file |
| `POST /api/connections/{id}/install` | `{client, preset, hooks, apply}`; without `apply` only the planned file changes come back |
| `POST /api/connections/uninstall` | `{client, revoke}`: remove Saturn's entries from that client |

Connections endpoints require a loopback peer; writes require `X-Client: web` and JSON; foreign origins and cross-site requests get 403; responses are not cached. Settings and model-test writes refuse a foreign `Origin`. Errors use `{"detail": "..."}` with `400`, `403`, `404`, `415`, or `422`.

Units: times are seconds since the epoch; durations are seconds; output token counts are estimates; model token counts are exact.

### Configuration files (owner: Saturn service)

| File | Format | Rules |
|---|---|---|
| `settings.toml` | Flat keys as in `PUT /api/settings` | Unknown keys and out-of-range values make the file invalid; the last good values stay |
| `policy.toml` | `preset`; `[folders] allowed`; `[commands] allow`, `deny`; `[hooks] scope` | Unknown keys, relative folders, and patterns with shell operators make it invalid; the last good policy stays |
| `credentials/<handle>.token` | One line | Owner-only permissions where the platform supports them |
| `installs.json` | List of `{client, harness_id, handle, preset, hooks, at, files[{path, backup}]}` | One record per client |

Saturn writes both TOML files atomically and with comments; `saturn policy` rewrites the file, so hand comments are not kept.

### Client configuration (owner: Saturn service, written into the client's files)

| Client | Entries |
|---|---|
| Claude Code (`~/.claude.json`, `~/.claude/settings.json`; `CLAUDE_CONFIG_DIR` moves both) | `mcpServers.saturn` = stdio command with `--harness`; `permissions.allow` = `mcp__saturn__<tool>` per preset (`mcp__saturn__*` for hands-off); PreToolUse and PostToolUse command hooks for `Bash|PowerShell` running the relay |
| Codex (`~/.codex/config.toml`; `CODEX_HOME` moves it) | One block between `# >>> saturn` and `# <<< saturn`: `[mcp_servers.saturn]` with `startup_timeout_sec = 60`, `tool_timeout_sec = 330`, `enabled_tools`, `default_tools_approval_mode` (`writes`, or `approve` for hands-off); optional `[[hooks.PreToolUse]]` for `^Bash$` |

Every other key is left as it was. A file that does not parse, or a Codex file that already defines `mcp_servers.saturn` outside the block, is refused. Each change is planned, shown, backed up, written atomically, and recorded.

### Internal ports

| Port | Implemented by | Contract |
|---|---|---|
| `ModelGateway` | `ResponsesGateway` | `call(tools, system, user, purpose)` returns a validated tool instance or raises `ModelUnavailable` or `ModelOutputInvalid`; no model selected raises `ModelUnavailable` at once |
| `ArtifactStore` | `ArtifactRepository` | Store text; fetch text, lines, or metadata; `NotFound` after expiry |
| `TelemetryWriter` | `TelemetryRepository` | Start and finish runs with harness and workspace; spans; model calls |
| `CommandRunner` | `SubprocessRunner` | Run an approved argv in a folder with a time limit |
| `AccessStore`, `AuditLog` | `SqliteAccessStore` | Harnesses with hashed tokens and limits; audit events |
| `CredentialStore` | `CredentialFiles` | Write, read, and delete a harness's token file |
| `ConfigSource` | `ConfigFiles` | Load and save `settings.toml` and `policy.toml`; a stamp that changes with the file |
| `ClientWriter`, `FileApplier`, `InstallStore` | `ClaudeCode`, `Codex`, `FileApplier`, `InstallRecords` | Plan and remove client entries; apply with backups; record installs |

## External integrations

### Model server (OpenAI Responses API)

| Aspect | Detail |
|---|---|
| Calls | `POST <base_url>/responses` for every model call |
| Status and unloading | LM Studio: `/api/v0/models`, `/api/v1/models/unload`. Ollama: `/api/tags`, `/api/ps`, unload by a generate request with `keep_alive: 0`. Other servers: `/v1/models`, never unloaded |
| Auth | Bearer token from `LOCAL_SERVER_API_KEY`, when set |
| Client | LangChain `ChatOpenAI` with `use_responses_api=True`, `store=False`, `temperature=0` |
| Limits | One call at a time by default; 180 s timeout; no automatic HTTP retry; a short circuit breaker after failures |

| Finding | Handling |
|---|---|
| `text.format` with a JSON schema is accepted but not enforced on `/v1/responses` by LM Studio | Structured output uses a function tool |
| A named `tool_choice` object is rejected | Bind the tools and send `tool_choice="required"` |
| A `ttl` field does not change a model's idle time | Saturn unloads through the server's own endpoint, and only a model its own request loaded |
| Usage arrives on the reply message | The tracing callback reads `usage_metadata` |
| First use can load a model | The deadline includes loading; setup's test call shows the time |

Ollama's Responses endpoint and unload request are implemented from its documentation and have not been tried against a real install.

### MCP clients

Any client that speaks Streamable HTTP or starts a local stdio server. HTTP requests must be addressed to localhost. Both routes use the official MCP SDK.

| Finding | Handling |
|---|---|
| Codex stops a tool call after 60 s and a server start after 10 s by default | Saturn's Codex block sets `tool_timeout_sec = 330` and `startup_timeout_sec = 60` |
| Codex's `bearer_token_env_var` takes a variable name, not a token | The stdio route carries no token at all; it reads the token file |
| Codex runs a new or changed hook only after it is trusted | Setup and Connections say to trust it with `/hooks` |
| Codex cannot replace tool output from a hook | Codex gets only the pre-command hook |
| Claude Code runs the output-replacing hook only for a command that succeeded | The pre-command hook sends noisy commands to `saturn_run` before they run |
| Claude Code ignores replacement output without the tool's own result shape | The reply copies every field and changes only the text |
| A client's sandbox and permission mode do not apply to what an MCP server runs | Saturn's own policy and path guards limit every command |

The meaning of Codex's `approve` and `writes` approval modes is taken from its documentation and has not been confirmed on a real install.

## Compatibility and change

Tool names, argument names, and error codes change only additively. The dashboard API is used by the bundled dashboard and may change with it. The store schema is versioned from 100; an older, incompatible store is refused with a message.
