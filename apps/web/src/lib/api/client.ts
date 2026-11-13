/* Typed calls to the Saturn service. One function per operation; no state here. */

import { del, get, patch, post, put, query } from './http';
import type {
  ArtifactList, ArtifactPage, AuditKind, AuditList, ClientName, Connections, Credential, Harness, HarnessInput, InstallResult,
  LocalServer, ModelTest, Overview, Payload, Policy, PolicyDecision, Preset, Ready, RunList, RunStatus, Settings, Trace, Tunables, WindowKey,
} from './types';

export interface RunFilter {
  status?: RunStatus;
  tool?: string;
  /** Harness id. */
  harness?: string;
  q?: string;
  before?: number;
  limit?: number;
  /** Only runs that started within this period. */
  window?: WindowKey;
}

const harnessPath = (id: string) => `/api/connections/${encodeURIComponent(id)}`;

export const api = {
  connections: (signal?: AbortSignal) => get<Connections>('/api/connections', signal),
  createHarness: (input: HarnessInput) => post<Credential>('/api/connections', input),
  editHarness: (id: string, input: HarnessInput) => put<Harness>(harnessPath(id), input),
  rotateHarness: (id: string) => post<Credential>(`${harnessPath(id)}/rotate`, {}),
  revokeHarness: (id: string) => del<Harness>(harnessPath(id)),
  enableHarness: (id: string, enabled: boolean) => patch<Harness>(harnessPath(id), { enabled }),
  /** With apply false, only the planned changes come back and nothing is written. */
  installHarness: (id: string, client: ClientName, preset: Preset, hooks: boolean, apply: boolean) =>
    post<InstallResult>(`${harnessPath(id)}/install`, { client, preset, hooks, apply }),
  uninstallClient: (client: ClientName, revoke: boolean) =>
    post<{ client: ClientName; revoked: boolean }>('/api/connections/uninstall', { client, revoke }),
  ready: (signal?: AbortSignal) => get<Ready>('/api/ready', signal),
  overview: (window: WindowKey, signal?: AbortSignal) => get<Overview>(`/api/overview${query({ window })}`, signal),
  runs: (filter: RunFilter, signal?: AbortSignal) => get<RunList>(`/api/runs${query({ ...filter })}`, signal),
  trace: (runId: string, signal?: AbortSignal) => get<Trace>(`/api/runs/${encodeURIComponent(runId)}`, signal),
  payload: (id: string) => get<Payload>(`/api/payloads/${encodeURIComponent(id)}`),
  events: (kind: AuditKind | null, signal?: AbortSignal) => get<AuditList>(`/api/events${query({ kind, limit: 200 })}`, signal),
  artifacts: (signal?: AbortSignal) => get<ArtifactList>('/api/artifacts', signal),
  artifact: (id: string, start: number, count: number, signal?: AbortSignal) =>
    get<ArtifactPage>(`/api/artifacts/${encodeURIComponent(id)}${query({ start, count })}`, signal),
  localServer: (signal?: AbortSignal) => get<LocalServer>('/api/local-server', signal),
  settings: () => get<Settings>('/api/settings'),
  saveSettings: (changes: Partial<Tunables>) => put<Settings>('/api/settings', changes),
  testModel: () => post<ModelTest>('/api/settings/test-model', {}),
  policy: (signal?: AbortSignal) => get<Policy>('/api/policy', signal),
  testPolicy: (command: string, folder: string | null, harness: string | null) =>
    post<PolicyDecision>('/api/policy/test', { command, folder, harness }),
};
