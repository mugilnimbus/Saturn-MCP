# Security

Saturn is a trusted local administration tool with partly trusted MCP callers. Keep it bound to loopback. It runs commands under the developer's account and is not an operating-system sandbox.

## Access boundaries

| Interface | Boundary |
|---|---|
| MCP `/mcp` | Exactly one bearer header per request; an active harness and a permitted tool |
| Workspace | The call's folder must be inside the policy's allowed folders (when set) and the harness's folders (when set) |
| Commands | Guards, deny rules (global and harness), allow rules, then the preset; see below |
| Shell hooks | Active bearer and hooks switched on for the harness; redirect requires Run and prior MCP contact; replacement requires Run, Query, and prior MCP contact |
| Connections API | Loopback peer, same-origin and fetch-site checks, a custom header on writes |
| Dashboard and the rest of `/api` | Trusted local interface; no account or login |
| File tools | Path inside the call's folder, credential-file refusal, 5 MB file cap |
| Command runner | No shell string, secret-named environment variables removed, output and time bounds |

Harnesses share stored outputs and traces; tool permissions and folders limit what each may do, but are not separate user isolation.

## Commands run outside the client's sandbox

A client's permission mode decides whether it asks before calling a Saturn tool; it is not passed to Saturn, and the client's sandbox does not cover commands Saturn runs. Saturn's policy is the limit:

1. **Guards always apply.** No shell; every argument that names a path must resolve inside the call's folder (absolute paths, `..`, and existing links are checked) and must not be a credential file.
2. **Deny wins.** Global deny rules and the harness's denied commands are checked before any allow rule.
3. **The standard preset** allows tests, builds, linters in check mode, and read-only inspection. It refuses forms that change source files (`--fix`, `--write`, `ruff format` without `--check`), install or fetch dependencies (`npm audit fix`, `npx --yes`, `uv run --with`, `dotnet` without `--no-restore`), create git refs, and run arbitrary project scripts or make targets. `uv` runs without syncing; cargo and go run offline.
4. **Allow rules** are explicit owner decisions; they never lift the guards. `preset = "open"` allows anything not denied, guards included.

Allowed builds and tests still run project code with the developer's privileges.

## Credentials

1. A harness is created in Connections, by `saturn connect`, or by `saturn setup`.
2. Its token (32 random bytes) is stored as a SHA-256 hash in the store, and in plain form in `~/.saturn/credentials/<handle>.token` so a local client can start without the token in its configuration. The file gets owner-only permissions where the platform supports them; on Windows it inherits the user profile's access rules.
3. Rotation replaces the token and the file; revocation deletes the file and is permanent.

Lists and errors never return tokens; creation and rotation return the token once with `no-store`. Client configuration written by Saturn names the harness handle, never a token. Treat the Saturn home folder like an SSH key folder: it holds every token and the model server's API key.

## Who can change what

| Change | Needs |
|---|---|
| Create a harness or write client configuration from the terminal | An interactive terminal and a confirmation |
| Widen the policy from the terminal (allow, open preset, remove a deny, add a folder to a non-empty list) | An interactive terminal and a confirmation |
| The same from the dashboard | A click on the local dashboard |
| Settings | The dashboard, `saturn settings set`, or an editor |

An agent's shell tool gives no interactive terminal, so it cannot confirm these commands. The dashboard API and the files in the Saturn home folder are reachable by any process running as the developer, including an agent's own shell; the client's approval of shell commands and of edits outside the project is what guards them. Every change, including a hand edit of `settings.toml` or `policy.toml`, is recorded in the audit log with its actor.

## Protection limits

- Full request arguments, replies, and model prompts and replies are kept for 48 hours so a request can be traced end to end. They are masked the same way, capped at 2 MB each, and readable only through the local dashboard API and the terminal.
- Captured output, file lines, artifact titles and content, model prompts, and final answers and evidence are masked for the API key and recognized credential shapes, including Saturn tokens. Masking preserves line positions and errs toward masking (a value after a `token=`-like name is masked even when it is a number). It cannot recognize every secret.
- File tools refuse known credential files, including `.env`, keys, `.mcp.json`, `settings.local.json`, and `.token` files.
- Caller-chosen regular expressions run in a separate process with a one-second deadline.
- Artifact expiry is checked on every read.
- Hook bodies are counted while streaming and refused above 8 MB.
- Code checks that each cited line exists. A second model review checks whether the cited text supports each claim.
- Saturn omits claims without an explicit, valid review acceptance. A failed review returns no unreviewed model claims.
- Model review can accept an unsupported claim or reject a supported claim. It does not prove correctness.
- An unload that fails keeps ownership and is retried at idle and at shutdown.

Do not put credentials in ordinary source files or command arguments and rely on masking to hide them.

## Not provided

- OAuth, user accounts, remote administration, TLS, encrypted storage, or per-harness data isolation.
- An enforcement boundary in shell hooks: they are optional, bypassable with `SATURN_DIRECT=1`, and fail open.
- Guaranteed model behavior or protection from every prompt-injection input.

The service and the model server address must be loopback. The launcher disables URL access logs; custom hosting must keep them off, because a client may put a credential in a URL by mistake.
