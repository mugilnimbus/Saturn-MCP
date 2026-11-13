# Benchmark contract

The benchmark uses one versioned golden dataset for quality, latency, concurrency, bursts, cancellation, and regression comparison.
A golden dataset contains fixed inputs and reviewed expected results.
Candidate runs remain provisional until independent dataset and output review is complete.

## Scope

| Included | Measurement |
|---|---|
| Golden dataset and holdout split | Required facts, evidence support, refusals, completeness, and explicit abstention |
| Complete workflow | Initial response, bounded follow-up retrieval, output size, latency, and model usage |
| System performance | Latency distributions, throughput, errors, service CPU, and memory |
| Multiple harnesses | Bounded concurrency, mixed tools, a busy harness alongside a quiet harness, and bursts |
| Queuing and cancellation | Observable waiting, completion, cancellation, and recovery |
| Model comparison | Current worker and two locally available alternatives, subject to compatibility checks |
| Regression comparison | Results against an explicitly selected, compatible baseline |

A large provider matrix, overnight tests, scheduled monitoring, and notifications are outside this first benchmark.
No result is a certification or a billing-savings claim.

## One corpus

Store the corpus under `bench/dataset/`.
Use one manifest, one case catalogue, shared source assets, and source attribution records.
Store disposable capture environments and raw acquisition output under `var/bench/`.
The manifest references assets by relative path and SHA-256 digest.
Resolve checkout and runtime paths on the local machine.

Every workload selects case IDs from this manifest.
Quality runs use the full evaluation split. Performance runs use declared case-ID schedules from the same split.
Concurrency changes arrival time, harness assignment, and request order. It does not replace case content or expected results.
Cancellation changes the request lifecycle; the cancellation expectation is recorded in the same case.
Protocol tests may use small unit-test inputs. Those inputs are excluded from benchmark scores and benchmark comparisons.

The initial coverage floor is 60 reviewed cases from at least six independent source families.
Allocate 20 cases to development and 40 cases to evaluation.
Use at least two independent source families in development and four different source families in evaluation.
Give each tool four primary development cases and eight primary evaluation cases.
A multi-step case has one primary tool and may include follow-up calls to other tools.
The corpus validator enforces these coverage limits.
A source family includes related projects, forks, derived captures, and controlled variants.
Split entire source families. Never place related variants in both splits.
A provenance or duplication conflict blocks freezing; it does not justify an undocumented replacement.

## Source selection

Select sources with a written rule before inspecting Saturn answers.
Use real, redistributable project files and actual tool output wherever possible.
Include at least three project ecosystems or distinct tool-output families.
Do not use only Saturn's own code, supported parsers, or historical evaluation fixtures.
Historical Saturn fixtures are development material. They are excluded from primary evaluation scores.

Cover test reports, diagnostics, builds, structured output, ordinary logs, source code, and documentation.
Include short output, long output, repetitive output, mixed formats, and formats without a dedicated parser.
Include easy, difficult, answerable, and unanswerable tasks.
Keep an inclusion/exclusion ledger for considered sources. Record the reason and the licence decision for each exclusion.
Record coverage by source family, tool, format, input size, difficulty, and expected outcome.
Report results by these groups as well as in aggregate.
Use the mean of per-tool quality scores as the primary aggregate.
Report per-source-family quality separately. Freeze any operational workload weighting before evaluation.

A source record includes its URL, immutable revision or archive identity, licence, attribution, and content hash.
Redistribute material only after the licence and provenance review passes.
Capture records include the tool version, command, environment, exit status, and captured stream boundaries.
Clearly distinguish live command execution from replay of captured output in every timing result.
Document any timestamp or path normalization and preserve a hash of the original capture.
Define normalization before scoring. Never normalize away the fact being tested.

Controlled defects or adversarial changes belong to this same corpus.
Record the original asset, change, reason, expected behavior, and derived hash.
Use synthetic credentials for redaction cases. Do not collect real credentials or private project data.
Do not execute downloaded capture scripts during dataset acquisition.
Review any command before executing a capture inside a disposable environment.

## Case record

| Field | Meaning |
|---|---|
| Identity | Stable case ID, source-family ID, dataset version, and split |
| Provenance | Source IDs, revisions, licences, and asset hashes |
| Coverage | Tool, format, size, difficulty, and expected outcome |
| Input | Relative workspace assets and the fixed request arguments |
| Workflow | Initial request, fixed follow-up requests, and a termination rule |
| Oracle | Required facts, acceptable alternatives, and exact supporting source locations |
| Negative expectations | Unsupported claims, prohibited actions, and expected refusals or abstention |
| Evidence | Source excerpts and line references sufficient to verify the oracle |
| Budgets | Response and workflow limits, with units and justification |
| Lifecycle | Normal completion and applicable cancellation/recovery expectations |
| Review | Label author, independent review status, disagreements, and resolution |

Each declared tool request has an expected outcome.
Cross-file questions include all evidence needed to determine the answer.
A truncated response must disclose incomplete coverage where the case expects that disclosure.
A refusal case distinguishes an allowed quoted string from a prohibited action.
Presence of an adversarial word alone is not evidence that an instruction was followed.

## Labels and scoring

Write expected facts from source evidence and independent tool results before obtaining Saturn answers for the case.
Do not derive an expected answer from a model response or Saturn's existing parser behavior.
Use exact checks for deterministic facts, counts, ranges, and refusal codes.
Use a fixed semantic rubric for paraphrases, completeness, evidence support, and unsupported claims.
Require independent human review of semantic labels and ambiguous cases before freezing.
Upstream human-reviewed labels can satisfy independent review when their provenance and applicability are recorded.
Record disagreement and resolution. Unreviewed labels block evaluation release.
A model judge may assist review; it cannot be the sole authority for the golden labels.

Score required-fact recall, factual precision, evidence support, completeness, and correct abstention separately.
Check both source-location validity and whether the evidence supports the claim.
An empty answer does not receive a perfect factual-precision score. Report the denominator and abstention separately.
The corpus cannot establish general security, general model accuracy, or performance on unseen ecosystems.

Report the complete initial-plus-follow-up response size and all observed model calls.
Keep output bytes, token estimates, and provider-reported model usage separate.
Do not rank models solely by output length or omit failed, incompatible, cancelled, or timed-out cases.

## Bias controls

- Freeze source-selection rules, labels, scoring, splits, and workload selections before the evaluation run.
- Check exact duplicates and normalized near-duplicates across splits.
- Review shared ancestry and copied content across source families.
- Retain unsupported formats and cases with little possible output reduction.
- Use the same case IDs and task budgets for every model.
- Record model-specific adapters and settings. Do not assume identical numeric settings imply equal conditions.
- Restrict prompt and configuration tuning to development cases.
- Balance model order and workload order across repeated runs.
- Blind model identity during semantic output review.
- Report uncertainty, group-level results, exclusions, and known coverage gaps.

The evaluation split is a holdout from local tuning. Publicly available inputs cannot be guaranteed absent from model training.
Keep labels away from the benchmark workspace exposed to Saturn and its worker.
The workload receives only case inputs and request text. The scorer reads labels from outside that workspace.

## Validation and freeze

1. Validate the manifest and every case against the declared schema.
2. Verify every asset digest and source reference.
3. Check licence records, relative paths, and synthetic-secret handling.
4. Verify case coverage, source-family separation, and duplicate checks.
5. Validate every evidence range and deterministic oracle.
6. Verify independent semantic-label review and resolved disagreements.
7. Produce the coverage and limitations report.
8. Freeze the accepted manifest, asset hashes, labels, and scoring version.

A failed check prevents freezing. Keep the diagnostics and the rejected candidate for correction.
A change after freezing creates a new dataset version and invalidates direct baseline comparison until compatibility is reviewed.
A deliberately refreshed holdout is a new version; do not keep tuning against a repeatedly inspected holdout.

## Execution boundary

Use public MCP, HTTP, or CLI interfaces for Saturn measurements. Do not import Saturn implementation internals.
Create isolated Saturn homes, credentials, workspaces, and harnesses under `var/bench/`.
Do not change regular client configuration, command policy, or model settings.
Model loading requires a declared quiet execution window. Retain any model that was loaded before the benchmark.
The harness uses dependencies installed by the existing setup workflow.
Record environment metadata, commit, corpus hash, model identity, settings, sample counts, and raw outcomes with each run.

The execution contract below requires approval before harness implementation.
Independent review still controls corpus freezing and final quality claims.
The CLI implements this execution contract. Candidate runs require `--provisional`.

## Execution contract

Run `uv run --project services/saturn --no-sync python -m bench run --provisional` from the checkout root.
Use an explicit candidate mode for exploratory runs before independent review.
Candidate mode must preserve every review requirement and mark every report provisional.
A candidate run cannot create a freeze marker or establish a final model ranking.

### Measurements and tools

| Measurement | Method |
|---|---|
| Workflow latency | Monotonic clock around public MCP calls and every declared follow-up |
| Throughput and errors | Completed workflows divided by wall time; retain all attempted and unexecuted cases |
| Output reduction | Compare complete returned UTF-8 bytes with the corresponding raw inputs; report per-case results |
| Context savings | Offline: `python -m bench savings --input <case results>`. Compare returned bytes with raw reference bytes and with a capped raw baseline (default 32,768 bytes, a stated assumption). Report aggregate and per-case median, with a 95% case-bootstrap interval |
| Token and model cost | Separate token estimates, provider usage, model calls, and wall time; omit unavailable billing cost |
| Service resources | Sample owned service processes and descendants every 100 ms; report CPU seconds and peak resident memory |
| Model resources | Report separately when observable; do not charge shared model-server memory to Saturn |
| Waiting | Record scheduled, submitted, first observable service event, and completed times |
| Internal queue wait | Report only an existing public trace with matching request identity; otherwise report unavailable |
| Cancellation | Record cancellation submission, acknowledgement, late completion, and the next request's recovery |
| Quality | Apply the existing scoring rubric; separate deterministic checks from blind semantic output review |

Use the installed Python MCP client and HTTP client for requests.
Use standard process clocks and platform process counters for resource observations.
A resource counter that is unavailable must not silently become zero.
Record the benchmark observer's resource cost separately.
Show the runner's `--help` and public trace inspector commands before the first measured run.

### Targets

The owner approved these targets on 2026-10-31. They apply to later runs; earlier results stay as recorded.

| Metric | Target |
|---|---|
| Saturn-internal p95 latency, no model | Under 100 ms |
| Unexpected Saturn-side tool errors | 0 |
| Workflow failures | 0 |
| Median per-case context saved, overall | At least 90% |
| `saturn_read` inline route (small files) | Overhead under 1 KB per call, limited to the header and line-number prefixes |
| `saturn_read` on files over the inline limit | At least 60% smaller than raw |
| Reproduction | Within ±20% p95 |
| Model-call failure rate | Reported only; provider faults are classified apart from Saturn errors |

The 2026-10-29 results meet all targets except one. One Ornith reproduction missed the band at -20.2%.
The first `saturn_read` target was replaced on 2026-10-31 with the owner's approval. Line numbers let an agent cite and re-read exact lines, so the overhead is by design.

### Fixed schedules

| Phase | Schedule |
|---|---|
| Development check | Use the 20 development cases for adapter verification; exclude their results from holdout scores |
| Warm-up | One excluded pass through the 40 evaluation workflows for each selected model |
| Primary comparison | Five measured passes through all 40 evaluation workflows for each model |
| Reproduction | Two clean service starts; one warm-up and one measured evaluation pass per model at each start |
| Balanced contention | Current worker; four evaluation families in sorted, interleaved order; concurrency 1, 2, and 4; five passes each |
| Busy versus quiet | Current worker; two harnesses; three busy requests per quiet request; five complete 40-case passes |
| Burst | Current worker; submit four requests together; wait for the group to finish; five complete 40-case passes |
| Cancellation | Five repetitions of each lifecycle-eligible evaluation case; cancel after 100 ms; record early completion separately |

Use one outstanding request per harness. Increase concurrency with separate harnesses.
A workflow keeps its producer artifact and follow-ups on the same harness.
Use seed 20261029 for reproducible order generation.
Rotate model order across passes and clean starts. Rotate the six load conditions across the five passes. Save every generated schedule before submitting calls.
Use the same output budgets and case content for every model.
Report loading and warm-up duration separately from steady-state results.

Select `ornith-1.0-9b`, `qwen3.8-27b`, `gemma-4-12b-it-qat`, `gemma-4-e4b-it`, and `gemma-4-26b-a4b-it-qat` from the local model inventory.
Record the exact discovered identifier, quantization, context settings, provider, and generation settings.
Benchmark-owned LM Studio loads use 32,768 context tokens, one parallel prediction, and full GPU layer offload.
Release only the previous benchmark-owned worker before a worker change. Preserve models loaded before the suite.
Worker changes reset the worker cache. Keep the first workflow in the measurement and record loading time separately.
A missing or incompatible model remains an explicit result. Do not substitute a model after inspecting holdout answers.
Run the contention phases on the current worker only. This bounds the workload without creating a provider matrix.

### Isolation, limits, and recovery

Create a separate service home and input-only workspace beneath `var/bench/<run-id>/`.
Use the documented home configuration files and public HTTP API to configure the isolated service and create temporary harness credentials.
Pass model credentials through an ignored environment file. Never include credentials in run records or command arguments.
Do not copy regular client registrations or change the regular service.
Use a fixed local replay helper for capture-based cases. Permit only that command in the isolated policy.
The replay helper emits registered bytes and the recorded exit status. It does not execute captured upstream command text.
Report replay latency separately from original command execution, which this suite does not measure.

Allow 90 seconds per public call, 180 seconds per workflow, and six hours for the complete suite.
Do not retry silently. Record timeout, incompatibility, interruption, and remaining unexecuted cases.
Preserve failure observations in denominators. Separate expected refusals and command failures from infrastructure errors.
Stop owned service processes and revoke temporary access on success, failure, and interruption.
Retain previously loaded models. Unload only models loaded and owned by this suite.
Record unrelated machine or model-server activity. Mark affected measurements as contaminated instead of hiding them.

### Comparison and reporting

The first complete run establishes the service baseline. No compatible historical service baseline currently exists.
Raw output is a size reference. Raw output alone is not an equivalent answer-quality or service-latency baseline.
Compare historical results only when corpus, scoring, schedules, hardware, model identities, and settings are compatible.
Report differences caused by intentional changes instead of treating incompatible runs as regressions.

Report median, minimum, maximum, p50, p95, sample counts, and error counts per phase and model.
Report p99 only for groups with at least 100 measured samples.
Separate variation between repeated passes from variation between source families.
Quality uses a per-tool macro average and separate per-family scores.
Blind model names during semantic output review. Keep the identity mapping outside the review packet.
The owner chose the sample rule on 2026-10-31, before any semantic score existed: review the first measured pass of each worker (phases primary-004, primary-005, primary-006 for the three-model plan used on 2026-10-29 and 2026-10-31), 120 answers. The five-model plan has 25 primary phases, so a new review would need a new sample rule from the owner.
The rule is fixed. Do not change it after scoring starts.
Do not convert automated paraphrase checks into independently reviewed semantic scores.

Use diagnostic regression tolerances of 20% for p95 latency, 10% for throughput, and two percentage points for quality.
These tolerances require approval with this execution contract. They are not established service-level guarantees.
No absolute latency or throughput pass target has been agreed. Report observed values without inventing a pass threshold.
A reproduction outside the tolerances requires investigation before a reproducible-performance claim.
Missing counters, incomplete phases, pending review, and contamination remain visible in the summary.
Keep raw observations in `var/bench/<run-id>/` and write a short summary with the environment record for each run worth keeping.
Record the commit, corpus identity, machine, tool versions, settings, schedule, and baseline identity with every result.

## Recorded results

The README summarizes the newest runs. These are the earlier full records, with the run dates and checkouts.

The first full run ran 2,300 workflows through public interfaces; 1,920 were measured.
One 60-case corpus supplied every workload. The primary comparison used 40 evaluation cases over five passes per model.

| Worker | Quantization | Primary workflows | p95 workflow seconds | Unexpected tool errors | Recorded model-call failures |
|---|---|---:|---:|---:|---:|
| Ornith 1.0 9B | Q4_K_M | 200 | 12.923 | 0 | 3 |
| Qwen3 VL 8B | Q4_K_M | 200 | 3.561 | 2 | 2 |
| Gemma 4 12B QAT | Q4_0 | 200 | 9.287 | 0 | 5 |

The Linux host used an i7-13700K, 30.6 GiB RAM, and two RTX 3080 Ti devices.
LM Studio served one worker at a time with full GPU layer offload, 32,768 context tokens, and one parallel prediction.
Saturn allowed one concurrent model call. Per-device utilization was not measured. Unrelated desktop activity was uncontrolled.

With Ornith, one and four harnesses completed 0.289 and 0.300 workflows/s; p95 increased from 14.556 to 40.943 seconds.
Across measured work, three workflows returned unexpected tool errors and 43 model calls failed. No workflow transport failures occurred.
All 80 cancellation cases accepted a follow-up read. Server cancellation acknowledgement was unavailable.

Results remain provisional: 18 semantic labels and blind output review require independent review.
Five of six clean-start p95 comparisons met the ±20% diagnostic tolerance. Ornith's second repeat missed it at −20.2%.
No final quality ranking, billing savings, or general reproducibility claim follows from these results.
Captured-command replay excludes the original upstream command duration. No equivalent raw-agent workflow or historical baseline was measured.

On 2026-11-02, dataset 0.2.0 ran 3,100 planned workflows through five local workers on the same host. Four workers finished. The `gemma-4-26b-a4b-it-qat` model server crashed after its first warm-up, so its 360 workflows did not run and it has no result.

| Worker | Primary workflows done | Literal fact recall | p95 workflow seconds |
|---|---:|---:|---:|
| Ornith 1.0 9B | 199 of 200 | 0.956 | 12.2 |
| Qwen3.8 27B | 200 of 200 | 0.960 | 14.0 |
| Gemma 4 12B QAT | 200 of 200 | 0.960 | 10.3 |
| Gemma 4 E4B | 195 of 200 | 0.941 | 4.4 |

Saturn returned 98.9% fewer bytes than the raw output (95% interval 98.5% to 99.2%); the median case saved 96.9%. The raw baseline is the size of the source or captured output, not a measured agent workflow.
`saturn_read` is larger than the raw file in 20 of 32 cases because it adds a header and line numbers.
Recall is a literal text match. Semantic quality was not measured in this run, and the labels have had model review only. Do not compare this table with the 2026-10-29 table: the workers and the corpus version differ.

On 2026-11-13, a real agent did eight tasks twice: once with its own shell tools, once with Saturn's tools only. The agent was a Claude Code subagent on Claude Sonnet, one run per task and arm (16 runs). The tasks replayed recorded command output and searched pinned source files. Saturn used the Ornith worker model.

| Arm | Runs that gave every required fact | Median tokens per run | Median tool calls | Median seconds |
|---|---:|---:|---:|---:|
| Shell tools | 8 of 8 | 46,556 | 3 | 11.3 |
| Saturn | 8 of 8 | 46,656 | 3 | 11.2 |

Both arms answered every task correctly. Total tokens were 373,469 for the shell arm and 374,182 for Saturn. The median change was +0.5% (Saturn used more), and no task differed by more than 2.4%. This test shows no token saving for Saturn.
The reason is the test size, not a proven fault in Saturn. Each subagent starts with about 46,000 tokens of fixed context, and most outputs are small: four replayed outputs are 5 KB or less, and three tasks read short source files. Only one output is large, a 174 KB file list that is about 48,000 estimated tokens raw. The corpus benchmark above measures output size, and this test does not show a gain at the level of a whole task. A long session, where tool output stays in context, was not tested.
Limits: one run per task and arm gives no spread. Tool use was instructed, not enforced, and the agents reported their own tools. The Grep tool was not available to the shell arm, so four shell runs retried with Bash. Success is a literal text match. See the [agent test procedure](#agent-ab-test).

The internal-timing run ran 2,280 internal-timing workflows on the same host and corpus.
The suite finished in 58 minutes: 1,760 main measurements, 200 profiling-cost observations, and 320 excluded observations.
All 2,800 enabled profiles were valid. The 150 disabled profiles were correctly absent.

With no model, 1,144 measured tool calls made zero provider calls:

| Observed stage | p50 ms per request | p95 ms per request |
|---|---:|---:|
| Configuration refresh | 0.012 | 0.022 |
| Authentication | 0.097 | 0.191 |
| Workspace checks | 0.049 | 0.089 |
| Command policy | 0.078 | 0.145 |
| Database-lock acquisition total | 0.020 | 0.245 |
| Internal processing and storage | 4.887 | 77.197 |

Internal processing includes redaction and deterministic digests. Backend execution and observed waiting remain separate.
These values measure elapsed time, not CPU time. The host remained an uncontrolled interactive desktop.
Thirty of 78 stage reproduction comparisons missed ±20%. All core misses changed p95 by less than 0.230 ms.
Unequal-sample percentile interpolation affected model-slot comparisons. No general reproducibility claim follows.
All tool calls completed. Eighteen measured model calls failed; existing fallbacks preserved tool completion.
One hundred matched profiling-cost pairs had a median enabled-minus-disabled tool-RTT sum of 0.237 ms, ranging from −34.912 to +32.480 ms.
Profiling remains disabled by default. See the [internal timing procedure](#internal-stage-latency-contract) for boundaries and limits.

Output token counts are estimates (about 3.6 characters per token). Model usage comes from the model server; failed calls can lack usage.

## Agent A/B test

This test asks a real coding agent to do the same task twice: once with its own shell tools only (arm `shell`), and once with Saturn's tools only (arm `saturn`).
It measures what the corpus benchmark cannot: the tokens a whole agent task uses.

| Item | Choice |
|---|---|
| Agent | A Claude Code subagent on Claude Sonnet, with a fresh context for each run |
| Tasks | 8 tasks in `bench/agent.py`, each built from a corpus case: test failures, lint, a diff, a large file inventory, a definition search, and two source questions |
| Workspace | The corpus inputs, `_replay.py`, and `_captures.json`. Commands replay recorded output with the recorded exit code |
| Runs | One run per task and arm (16 runs), chosen by the owner to limit token use |
| Success | Every required fact appears in the answer, by literal match |
| Tokens | The subagent total that the harness reports at the end of each run |
| Worker model | Ornith 1.0 9B, on for the 2026-11-13 run. Saturn made 8 model calls during the 16 runs |

Steps:

1. `python -m bench agent-prepare --output var/bench/agent-<date>/workspace` copies the inputs into a new workspace.
2. Allow the replay script in Saturn's policy: `saturn policy allow "python _replay.py *"`. Remove the rule after the test.
3. `python -m bench agent-prompts --output <workspace>` prints the 16 prompts.
4. Run each prompt in a new subagent. Record its answer, total tokens, tool uses, and duration in `runs.json`.
5. `python -m bench agent-grade --input var/bench/agent-<date>/runs.json` scores each run and compares the arms.

Limits: one run per task gives no spread. Tool use is instructed, not enforced, and the tools line is reported by the agent itself.
Each subagent total includes the same fixed starting context, so the percentage saved is smaller than in a long session where tool output stays in context.
Small outputs return unchanged from Saturn, so most tasks can save little. The result applies to this agent, model, and task set only.

Result of 2026-11-13: both arms gave every required fact in 8 of 8 tasks. The median tokens per run were 46,556 (shell) and 46,656 (Saturn), so the test shows no saving. About 46,000 tokens of every run are the fixed starting context. Four replayed outputs are 5 KB or less and three tasks read short source files. A test of this kind needs long outputs and a long session before a difference can show. The Grep tool was not available in the test session, and four shell runs retried with Bash.

## Internal-stage latency contract

The internal runner uses optional service instrumentation through the existing MCP and administration APIs.
Its purpose is to measure Saturn's own processing and waiting, with backend execution reported separately.
The existing end-to-end results remain unchanged.

Run the complete provisional internal suite from the repository root:

```bash
uv run --project services/saturn --no-sync python -m bench internal --provisional --output var/bench/internal-run
```

The regular service can remain stopped. The runner reads its documented settings file and creates isolated service homes.
Use `--phase-limit 1` for an excluded adapter diagnostic. The report lists every phase omitted by that limit.

### Measurement boundaries

The service window starts at the first Saturn-owned HTTP application boundary and ends after the final response-body send returns.
This boundary measures the application's send operation, not delivery to the client.
MCP tool-call identity must bind the window to exactly one existing run.
Session setup and administration traffic stay outside tool-call measurement counts.
Client round-trip time remains separate. Network, stdio-bridge, kernel, and pre-application server waiting are outside this window.
SDK stages without an accessible boundary remain unattributed. Do not patch dependency source or invent separate decoder or encoder timings.

| Class | Recorded boundaries |
|---|---|
| Internal processing | Configuration refresh, authentication, workspace/path checks, owned argument validation, policy checks, redaction, token estimation, deterministic digest processing, and response construction |
| Internal storage | Evidence compression, run/audit/payload writes, artifact reads, and SQLite operations after acquisition of the database lock |
| Actual waiting | Acquisition of the existing database lock and the existing model-call semaphore |
| Backend execution | Command-runner execution envelope, project-file read/search envelopes, client roots requests, model-server preparation requests, and provider request envelopes |
| Unattributed | Elapsed service time outside observed intervals; inaccessible SDK decoding, validation, serialization, or scheduling cannot receive invented labels |

Provider and command envelopes include their adapter work. They are not measurements of pure GPU inference or child-process CPU time.
SQLite operation time can include SQLite's own busy waiting. That waiting remains inseparable until an observable boundary exists.
There is no new general request queue. Measure the existing lock and semaphore without changing their capacity or ordering.
Acquisition elapsed time includes acquisition overhead. Report contention or queue depth only when directly observable without changing acquisition.

Record monotonic nanosecond endpoints, interval IDs, parent IDs, fixed stage names, categories, and terminal status.
Retain wall-clock timestamps only for correlation. Never subtract clocks from different processes or service starts.
Calculate inclusive durations and exclusive durations after subtracting the union of nested child intervals.
Report internal-stage, waiting, and backend interval unions independently. Report exclusive category unions after removing observed child intervals. Concurrent categories can overlap; report that overlap explicitly.
Calculate coverage and unattributed time from interval unions within the same request window.
Do not add overlapping categories or subtract unrelated latency percentiles.
Measured internal elapsed time is not CPU time. Keep process CPU observations separate.
Missing, invalid, clipped, or incomplete profiles remain visible in request counts and are excluded from valid-duration denominators.

### Optional instrumentation

Use a startup-only `SATURN_INTERNAL_TIMING` flag, disabled by default.
Enable it only in benchmark-owned homes for these runs. Requests cannot enable profiling through an argument or header.
Instrumentation must preserve responses, policy decisions, access controls, timeouts, cancellation, lock behavior, and model-call ordering.

Keep intervals in request-local memory with task-local parent stacks. Concurrent requests and child tasks must not share a mutable stack. Allow at most 64 active full-profile collectors and 4,096 intervals per collector.
Record a minimal incomplete marker when collector capacity is exhausted. Do not refuse or queue the original request.
Mark interval-limit loss explicitly. Do not silently score a partial profile as complete.
Bound each encoded profile to the existing 2,000,000-byte payload limit. An oversized profile becomes a minimal incomplete marker.
Use fixed stage names and opaque bounded IDs. Do not record tokens, headers, SQL text, SQL parameters, file contents, or request bodies.

Seal the profile after the service window ends, including error or cancellation status.
Store one additive `timing` payload through the existing telemetry store and local administration trace/payload API.
Collect a required profile for at most five seconds after the response. A collection poll never retries the tool call.
Keep the existing payload expiry and access rules. No database migration or new public endpoint is required.
Exclude profile-export writes from their own instrumentation to prevent recursion.
Export happens after the measured service window. Its effect remains part of the paired instrumentation-cost experiment.
A correlation or export failure must preserve the original response. The benchmark records a missing profile instead of zero latency.
Release collector capacity on success, error, cancellation, and export failure.

### Shared-corpus schedules

Use the existing 60-case candidate, source-family split, case IDs, requests, follow-ups, replay helper, and output budgets.
Do not add synthetic benchmark datasets or change semantic labels.
Retain provisional status while independent corpus review is pending. No timing run creates reviewer acceptance or a freeze marker.
Run two separately reported conditions:

- **Core:** no model selected in the isolated service. Verify zero provider requests. Retain expected model-unavailable behavior separately from successful deterministic operations.
- **Model-slot contention:** use only `ornith-1.0-9b`, the worker used in the previous contention run. Measure semaphore waiting and provider envelopes separately.

Use 32,768 context tokens, one parallel prediction, full GPU layer offload, and one Saturn model-call slot for that condition.

The model-backed condition explains the context of model-slot waiting. Its wait times depend on backend service time and hardware.
It is not a model-free CPU baseline. No model-quality ranking is part of this contract.
Preserve pre-existing model residency. A missing or incompatible worker blocks that condition explicitly; the core condition can still run.
Do not unload a pre-existing model, download a model, or tune a model prompt.

| Schedule | Per condition |
|---|---|
| Adapter check | One excluded pass through all 20 development workflows |
| Initial warm-up | One excluded pass through all 40 evaluation workflows |
| Internal measurements | Five complete evaluation passes at concurrency 1, 2, and 4, plus bursts of four: 800 workflows |
| Clean-start checks | Two new service homes, each with 40 excluded warm-up workflows and 40 measured concurrency-one workflows |

Each condition schedules 1,020 workflows: 880 measured and 140 excluded observations.
Rotate the four load conditions over five passes. Keep one outstanding call per harness and preserve producer/follow-up identity.
Use seed 20261029. Save schedules and settings before execution.
Compare clean-start per-stage p95 with the same condition's primary concurrency-one measurements.
The existing ±20% diagnostic latency tolerance applies. Report a tolerance miss and investigate its traces.

Measure instrumentation cost separately with the 20 development workflows, without a model.
Use two owned services with timing enabled and disabled. Warm each service with one excluded 20-case pass.
Run five matched pairs of complete 20-case passes, alternating enabled/disabled order.
Report the 200 paired observations separately from primary latency measurements. Do not subtract this estimate from recorded stage durations.
Time individual tool-call round trips before diagnostic trace collection. Report collection duration and observer CPU separately.
Phase service CPU includes profile export and diagnostic reads; identify it as instrumented-workload cost.
The comparison measures the effect of enabled profiling. Disabled-hook cost relative to the earlier uninstrumented checkout remains unmeasured.

The complete schedule has 2,280 workflows: 1,760 primary/reproduction measurements, 200 instrumentation-cost observations, and 320 excluded observations.
Retain the existing 90-second call, 180-second workflow, and six-hour suite limits.
No silent retries, replacement cases, or omission of failed, unsupported, cancelled, or unexecuted work is permitted.

### Hardware and report

Record CPU model, physical/logical cores, affinity or container limits, RAM, swap, OS/kernel, language/library versions, and monotonic clock resolution.
Record the Saturn data path's backing device and filesystem without collecting unrelated file or process contents.
Capture CPU governor/frequency, temperature, aggregate system load, and available memory before and after phases when readable without privileges.
Record worker identity, quantization, provider version, context, parallelism, and observable GPU/resident-model inventory for the model-backed condition.
Report unavailable counters explicitly. Do not install monitoring tools or change CPU, power, GPU, or filesystem settings.
Keep verification jobs outside measurement windows. Record known overlapping work and retain affected observations with contamination labels.
Do not normalize results across different hardware or compare incompatible conditions as regressions.

Report stage latency, lock/semaphore waiting, backend envelopes, coverage, unattributed time, overlap, failures, and valid sample counts.
Group by condition, workload, tool, source family, and pass. Report median, range, p50, and p95; report p99 only with at least 100 valid samples.
Report observer/process CPU and service memory separately from model-server resources.
Report instrumentation-on/off impact and disabled-profile expectations separately from missing-profile failures.
No absolute latency target, pure-CPU claim, internal-queue inference, or new quality score is implied.
Store raw profiles under `var/bench/<run-id>/` and write a short summary for each run worth keeping.

## Source families

Each source uses a pinned revision. Original licence and attribution files are retained with its assets.
An upstream Python test asset uses a `.py.txt` suffix to prevent accidental pytest collection. Its original path remains in the provenance record.

| Project | Split | Licence | Revision |
|---|---|---|---|
| [pallets/click](https://github.com/pallets/click/tree/2247b35ea1c47c727d7a06e51fa280e12a863ff6) | development | BSD-3-Clause | `2247b35ea1c4` |
| [tj/commander.js](https://github.com/tj/commander.js/tree/ba6d13ddb4243e5913367734f8c159089ffe7834) | development | MIT | `ba6d13ddb424` |
| [psf/requests](https://github.com/psf/requests/tree/3c7baaa05ab4aa49cc819ce3a819d260de19c157) | evaluation | Apache-2.0 | `3c7baaa05ab4` |
| [BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep/tree/91f5d22ef48bde459d90a8c7dbeab416e97d0f2b) | evaluation | MIT OR Unlicense | `91f5d22ef48b` |
| [go-chi/chi](https://github.com/go-chi/chi/tree/9f8adb1aabaa8a91180a821111d3f8e668d1c0bf) | evaluation | MIT | `9f8adb1aabaa` |
| [sindresorhus/p-limit](https://github.com/sindresorhus/p-limit/tree/a8a6fbec4e0e866d6d779b10889bb4f5567e70eb) | evaluation | MIT | `a8a6fbec4e0e` |

## Corpus tools

Run these commands from the repository root after setup:

```bash
uv run --project services/saturn --no-sync python -m bench validate
uv run --project services/saturn --no-sync python -m bench review --output var/bench/review-packet.json
uv run --project services/saturn --no-sync python -m bench materialize --output var/bench/input-workspace
```

Validation reports integrity and review readiness separately. A structurally valid candidate can still have pending independent reviews.
Materialization accepts a new empty workspace and copies only source assets and captures. It excludes the manifest, labels, and review records.
The schema is available in `dataset/schema.json`. Inspect a metadata file with `python -m json.tool bench/dataset/manifest.json`.

A reviewer checks each semantic oracle against its cited source excerpt. Record reviewer identity, the case-context hash, the oracle hash, the decision, and any disagreement.
Accepted reviews use the basis `independent human source review` and belong in `dataset/reviews.json`. Never invent reviewer attestations.
The freeze command refuses incomplete review or invalid inputs:

```bash
uv run --project services/saturn --no-sync python -m bench freeze
```

Freeze creates an immutable identity marker. It does not publish files or run a benchmark.

## Coverage limits

This corpus is a convenience sample of six public projects across four ecosystems. It is not a random sample of developer work.
Controlled changes, missing-value markers, and the synthetic credential are declared in the manifest and selection records.
Public source can occur in model training. Project-family separation prevents local tuning leakage, but cannot establish training-data independence.
Stored output replay measures Saturn's processing path; it excludes the original upstream command execution time.
The corpus has limited production-log and multilingual coverage. Read `dataset/selection.json` before interpreting aggregate results.
