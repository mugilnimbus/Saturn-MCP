# Saturn dashboard

The web interface for Saturn: setup, what was kept out of the agent's context, every call with its trace and policy decision, what changed in Saturn and who changed it, the stored outputs, the model, connections, and settings.

Stack: Svelte 5 (runes), TypeScript, Vite, Vitest. No UI framework or chart library; charts are small SVG components.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, forwarding /api to a running Saturn (http://127.0.0.1:9000)
npm run check      # type and Svelte checks
npm test           # unit tests
npm run build      # production build into dist/, which the Saturn service serves at /
```

Set `API_PROXY` to point the dev server at Saturn on another local port.

## Screens

| Screen | Someone opens it to | Leaves knowing |
|---|---|---|
| Overview | Finish setup, then see whether Saturn is saving context | What is left to set up; how many tokens were withheld, how, which runs explain it, and what it cost |
| Runs | Find a specific call, including refused ones | The request as it arrived, every step with its time, each model prompt and reply, and the exact response |
| Changes (under Runs) | Find who changed Saturn and when | Every access, client, policy, settings, model, and service change, with its actor |
| Artifacts | Read output the agent did not receive | The full text, by page |
| Model | Check the model server and the worker's cost | Whether it answers, which model is used, and token and time totals |
| Connections | Give a client access, limit it, install it in Claude Code or Codex, or take it away | Which harnesses can call which tools in which folders, and where each is installed |
| Settings | Choose the model server and model, set limits, check the command policy | That the next call uses the new values, and whether a given command would run |

## Boundary map

| Folder | Owns | May depend on |
|---|---|---|
| `src/config.ts` | The few per-project settings | nothing |
| `src/lib/api/` | Talking to the service: types, HTTP, typed calls, error text | `config` |
| `src/lib/live/` | Refreshing data over time: `Poller` and `Resource` | `lib/api` |
| `src/lib/state/` | App-wide state: connection, router, preferences, toasts | `lib/api`, `lib/live` |
| `src/lib/ui/` | Presentational components (tile, figure, animated number, disclosure, dialog, chart) and chart geometry | `lib/state` only for `Toasts`; never `features/` |
| `src/lib/format.ts` | Number, duration, and time formatting | nothing |
| `src/lib/styles/` | Design tokens, shared components, layout | nothing |
| `src/features/<name>/` | One screen: its components and its pure logic | `lib/*`; features do not import each other (the shell is the only exception) |
| `src/features/shell/` | The frame around every screen: side panel, narrow-screen top bar and tab bar, local-model status, theme switch | `lib/*` |
| `src/App.svelte`, `src/main.ts` | Composition | everything above |

Rules: logic that decides what a screen says lives in plain `.ts` files with tests (`overview.ts`, `trace.ts`, `chart.ts`, `format.ts`, `access.ts`), not inside components. Every screen handles loading, empty, error, and stale states. All refreshing goes through `Resource`, which polls one request at a time, pauses while the tab is hidden, backs off on errors, and ignores late answers.

## Design decisions

- **Side panel navigation with labels**, becoming a bottom tab bar on narrow screens. Six sections fit, and labels stay visible without hover. The current section is marked quietly: accent text, a soft tint, and a thin bar on the edge.
- **No top bar on wide screens.** The page heading is the only title. The side panel's foot carries the local model's state and the theme switch; a top bar exists only on narrow screens.
- **Overview is a story, read top to bottom:** the conclusion, the path from raw output to what the agent received, the supporting numbers, the same thing over time, the runs that explain it, then the breakdown. A section that has nothing to say collapses to one sentence (the model chart when the model was not called).
- **Lists take the full width until an item is picked,** then split about 1 to 1.618 with the detail. Commands are long; a narrow column hid most of each one. Lists scroll inside the window's height.
- **Depth has three levels and one emphasis per region:** quiet cards for content, a raised card for the headline, and the neon edge only for the outcome of the story and the item being read.
- **Rarely needed detail is one click away** (`Disclosure`): the Overview breakdown tables, a harness's limits and token file with Rotate, Disable, and Revoke, revoked harnesses, the terminal and by-hand routes for a client, reasoning and unloading settings, file locations, and models that are neither loaded nor the worker.
- **Writing to another tool's files is always previewed.** Installing in a client first lists each file and what changes in it; nothing is written until Install is pressed, and Remove takes Saturn's entries out again.
- **The policy is shown and tested here, changed elsewhere.** Settings shows the effective rules with their source and answers "would this run?"; rules change through `policy.toml` or `saturn policy`, which asks before widening.
- **One comparative chart per question** rather than a chart in every tile. Tiles show a value and what it means; the chart shows the relationship. Series share one y axis that starts at zero, plot one point per sample with no smoothing, and are told apart by dash pattern as well as colour.
- **The conclusion first, in as few words as it takes.** A short sentence on Overview, Model, and each run; a strip of figures on Runs and Artifacts, where four numbers say more than a sentence.
- **Fewer words, more figures.** Explanations that were always on screen are now a figure, a chip, or a three-step line; a caption is kept only where a number needs its unit or meaning.
- **Motion marks change.** Sections rise in once when a screen opens, figures count to their value, a picked item's detail slides in, and revealed detail fades in. Opacity and position only, about half a second, off under reduced motion.
- **Strong colour only for problems.** Normal values use the accent; amber and red appear for refusals and failures.
- **Keyboard and reading alternatives.** Charts are focusable and read with the arrow keys, and each has a table view. Status is never colour alone.
- **Themes and density** are per browser and work without storage.


The [architecture model](../../docs/architecture/index.html) includes frontend file responsibilities and dependencies. Run the checks listed above for changes; visual and device checks remain separate.
