/* Shapes shared with the Saturn service. Keep these in step with docs/CONTRACTS.md. */

export type WindowKey = '15m' | '1h' | '6h' | '24h' | '7d';

export interface Totals {
  runs: number;
  errors: number;
  running: number;
  raw_tokens: number;
  returned_tokens: number;
  saved_tokens: number;
  /** 0..1 share of raw tokens that was kept out; null when nothing was measured. */
  reduction: number | null;
  redactions: number;
  p50_s: number | null;
  p95_s: number | null;
  llm_calls: number;
  llm_errors: number;
  llm_in: number;
  llm_out: number;
  llm_reasoning: number;
  llm_cached: number;
  llm_p50_s: number | null;
  llm_p95_s: number | null;
}

export interface Bucket {
  /** Bucket start, seconds since epoch. */
  t: number;
  runs: number;
  errors: number;
  raw_tokens: number;
  returned_tokens: number;
  llm_calls: number;
  llm_in: number;
  llm_out: number;
  llm_reasoning: number;
}

export interface ToolRow {
  tool: string;
  runs: number;
  errors: number;
  raw: number;
  ret: number;
  llm_calls: number;
}

export interface RouteRow {
  route: string;
  runs: number;
  raw: number;
  ret: number;
}

export interface ModelRow {
  model: string;
  calls: number;
  errors: number;
  tin: number;
  tout: number;
  treason: number;
  tcached: number;
  avg_s: number | null;
}

export interface PurposeRow {
  purpose: string;
  calls: number;
  tin: number;
  tout: number;
  treason: number;
}

export interface Overview {
  window_s: number;
  bucket_s: number;
  generated_at: number;
  totals: Totals;
  series: Bucket[];
  by_tool: ToolRow[];
  by_route: RouteRow[];
  by_model: ModelRow[];
  by_purpose: PurposeRow[];
  artifacts: { count: number; bytes: number };
}

export type RunStatus = 'ok' | 'error' | 'running';

export interface Run {
  seq: number;
  id: string;
  tool: string;
  /** The harness label, or the client name for in-process callers. */
  client: string | null;
  harness_id: string | null;
  /** The folder the call worked in. */
  workspace: string | null;
  /** How the request arrived: stdio, http, hook, in-process. */
  transport: string | null;
  /** The client's own name and version. */
  client_info: string | null;
  session_id: string | null;
  request_id: string | null;
  summary: string;
  started_at: number;
  ended_at: number | null;
  status: RunStatus;
  route: string;
  /** The policy rule that allowed a command ("preset standard", "allow make deploy"), or "refused". */
  decision: string | null;
  raw_tokens: number;
  returned_tokens: number;
  artifact_id: string | null;
  error: string | null;
  exit_code: number | null;
  redactions: number;
  llm_calls: number;
  llm_in: number;
  llm_out: number;
  llm_reasoning: number;
  llm_cached: number;
}

export interface Span {
  id: string;
  run_id: string;
  parent_id: string | null;
  name: string;
  kind: string;
  started_at: number;
  ended_at: number | null;
  status: string;
  attrs: Record<string, unknown>;
}

export interface LlmCall {
  id: string;
  run_id: string;
  span_id: string | null;
  model: string;
  endpoint: string;
  started_at: number;
  ended_at: number | null;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  cached_tokens: number;
  status: string;
  error: string | null;
  prompt_preview: string;
  output_preview: string;
  purpose: string;
}

export type PayloadKind = 'request' | 'response' | 'llm_prompt' | 'llm_output';

/** A full body kept for 48 hours: what the trace lists, with a preview. */
export interface PayloadMeta {
  id: string;
  kind: PayloadKind;
  /** The model call it belongs to, for prompts and replies. */
  owner_id: string | null;
  bytes: number;
  truncated: boolean;
  expires_at: number;
  preview: string;
  /** The preview is the whole body. */
  complete: boolean;
}
export interface Payload { id: string; run_id: string; kind: PayloadKind; owner_id: string | null; bytes: number; truncated: boolean; expires_at: number; text: string }

export interface Trace {
  run: Run;
  spans: Span[];
  llm_calls: LlmCall[];
  payloads: PayloadMeta[];
}

export interface RunList {
  runs: Run[];
  next_before: number | null;
  latest_seq: number;
}

export interface ArtifactMeta {
  id: string;
  run_id: string;
  kind: string;
  title: string;
  created_at: number;
  expires_at: number;
  bytes: number;
  lines: number;
  tokens_est: number;
}

export interface ArtifactList {
  artifacts: ArtifactMeta[];
  count: number;
  bytes: number;
}

export interface ArtifactPage {
  meta: ArtifactMeta;
  start: number;
  text: string;
  total_lines: number;
}

export interface ServerModel {
  id: string;
  type: string;
  state: string;
  context: number | null;
  quantization: string | null;
}

export interface LocalServer {
  reachable: boolean;
  authorized: boolean;
  latency_ms: number | null;
  models: ServerModel[];
  error: string | null;
  configured_model: string;
  provider?: string;
  base_url?: string;
}

export interface Ready {
  status: 'ok' | 'degraded';
  store: string;
  /** The selected worker model; empty when none is selected or model use is off. */
  worker_model: string;
  local_server: { reachable: boolean; authorized: boolean; latency_ms: number | null; error: string | null };
}

export type Provider = 'lmstudio' | 'ollama' | 'openai';

export interface Tunables {
  provider: Provider;
  base_url: string;
  /** Empty when no worker model is selected: digests are made by code only. */
  model: string;
  reasoning_effort: string;
  llm_enabled: boolean;
  inline_token_limit: number;
  digest_token_budget: number;
  command_timeout_s: number;
  model_idle_unload_s: number;
  progress_interval_s: number;
}

export interface Settings {
  tunables: Tunables;
  limits: Record<string, [number, number]>;
  reasoning_efforts: string[];
  providers: Record<Provider, string>;
  help: Record<string, string>;
  environment: {
    home: string;
    settings_file: string;
    policy_file: string;
    env_file: string;
    data_dir: string;
    api_key_configured: boolean;
    unknown_env_keys: string[];
    /** File name to the reason it is not applied. */
    file_errors: Record<string, string>;
    artifact_ttl_hours: number;
    folders: string[];
    any_folder: boolean;
    preset: string;
    hook_scope: string;
  };
}

export interface ModelTest { ok: boolean; detail: string; ms: number; model: string }

export interface PolicyRule { pattern: string; source: string }
export interface Policy {
  file: string;
  error: string | null;
  preset: 'standard' | 'open';
  folders: string[];
  hook_scope: 'noisy' | 'all' | 'off';
  allow: PolicyRule[];
  deny: PolicyRule[];
}
export interface PolicyDecision { allowed: boolean; rule: string; reason: string; source: string; folder: string }

export type ClientName = 'claude' | 'codex';
export type Preset = 'standard' | 'read-only' | 'hands-off';

export interface InstallRecord {
  client: ClientName;
  harness_id: string;
  handle: string;
  preset: Preset;
  hooks: boolean;
  at: number;
  files: { path: string; backup: string | null }[];
}

export interface Harness {
  id: string;
  name: string;
  /** Stable and unique while active; client configuration refers to the harness by it. */
  handle: string;
  tools: string[];
  enabled: boolean;
  created_at: number;
  expires_at: number | null;
  revoked_at: number | null;
  last_used_at: number | null;
  /** Folders this harness may work in; empty means whatever the policy allows. */
  folders: string[];
  /** Command patterns this harness may not run. */
  deny: string[];
  hooks: boolean;
  credential_file: string;
  credential_saved: boolean;
  /** The command that starts the stdio server for this harness. */
  stdio: string[];
  /** Hook relay commands, with {event} where the hook event name goes. */
  hook_commands: Record<ClientName, string>;
  installs: InstallRecord[];
}
export interface HarnessInput {
  name: string;
  handle?: string | null;
  tools: string[];
  expires_at: number | null;
  enabled: boolean;
  folders: string[];
  deny: string[];
  hooks: boolean;
}
export interface Credential { harness: Harness; token: string }
export interface ClientInfo { name: ClientName; title: string; detected: boolean; files: string[]; install: InstallRecord | null }

export type AuditKind = 'access' | 'settings' | 'policy' | 'install' | 'model' | 'service';
export interface AuditEvent { seq: number; at: number; kind: AuditKind; subject: string; action: string; actor: string; detail: string }
export interface AuditList { events: AuditEvent[]; next_before: number | null }

export interface Connections {
  endpoint: string;
  hook_endpoints: { claude_pre: string; claude_post: string; codex_pre: string };
  tools: string[];
  presets: Record<Preset, string[]>;
  clients: ClientInfo[];
  harnesses: Harness[];
  /** Recent access and install events. */
  events: AuditEvent[];
}

export interface PlannedChange { path: string; summary: string; creates: boolean }
export interface InstallResult { client: ClientName; changes: PlannedChange[]; record?: InstallRecord }
