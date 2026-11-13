// Architecture model. Edit this model; the viewer and checker are shared assets.
window.ARCH_MODEL = {
  "name": "Saturn",
  "palette": "violet",
  "note": "As-built local, single-user MCP system. Saturn owns the service, bridge, CLI, dashboard, configuration, and evidence store. Client configuration, project files, operating system, and model server remain outside. Application operations are reused in the HTTP and CLI processes; an in-process CLI call is not an HTTP hop.",
  "data": [
    {
      "id": "tool_call",
      "name": "Tool call",
      "fields": {
        "tool": "string",
        "arguments": "json",
        "workspace_root": "path",
        "cwd": "path"
      }
    },
    {
      "id": "tool_result",
      "name": "Tool result",
      "fields": {
        "text": "text",
        "is_error": "boolean",
        "artifact_id": "string"
      }
    },
    {
      "id": "failure",
      "name": "Failure",
      "fields": {
        "code": "string",
        "message": "text",
        "status": "integer"
      }
    },
    {
      "id": "caller",
      "name": "Caller context",
      "fields": {
        "harness": "harness",
        "workspace": "path",
        "arguments": "json",
        "transport": "string",
        "client_info": "string",
        "session_id": "string",
        "request_id": "string"
      }
    },
    {
      "id": "harness",
      "name": "Harness",
      "fields": {
        "id": "string",
        "name": "string",
        "handle": "string",
        "tools": "list",
        "enabled": "boolean",
        "expires_at": "timestamp",
        "revoked_at": "timestamp",
        "folders": "list",
        "deny": "list",
        "hooks": "boolean"
      }
    },
    {
      "id": "credential",
      "name": "Harness credential",
      "fields": {
        "handle": "string",
        "token": "string"
      },
      "note": "The token is held in a local credential file. The database stores a SHA-256 digest, not the token."
    },
    {
      "id": "policy",
      "name": "Command policy",
      "fields": {
        "preset": "enum",
        "folders": "list",
        "allow": "list",
        "deny": "list",
        "hook_scope": "enum"
      }
    },
    {
      "id": "support_candidates",
      "name": "Claim support inputs",
      "fields": {
        "claims": "list",
        "evidence": "evidence[]"
      }
    },
    {
      "id": "support_review",
      "name": "Claim support verdicts",
      "fields": {
        "candidate": "integer",
        "supported": "boolean",
        "evidence_indexes": "list"
      }
    },
    {
      "id": "support_result",
      "name": "Claim support result",
      "fields": {
        "accepted": "list",
        "rejected": "integer",
        "warning": "string"
      }
    },
    {
      "id": "settings",
      "name": "Runtime settings",
      "fields": {
        "provider": "enum",
        "base_url": "url",
        "model": "string",
        "reasoning_effort": "enum",
        "llm_enabled": "boolean",
        "inline_token_limit": "integer",
        "digest_token_budget": "integer",
        "command_timeout_s": "integer",
        "model_idle_unload_s": "integer",
        "progress_interval_s": "number"
      }
    },
    {
      "id": "startup_settings",
      "name": "Startup settings",
      "fields": {
        "home": "path",
        "host": "string",
        "port": "integer",
        "data_dir": "path",
        "api_key_configured": "boolean",
        "shutdown_grace_s": "number",
        "llm_timeout_s": "number",
        "llm_concurrency": "integer",
        "internal_timing": "boolean"
      },
      "note": "Only presence of the API key is exposed to the dashboard. Raw secrets are not public settings data."
    },
    {
      "id": "config_stamp",
      "name": "File change stamp",
      "fields": {
        "mtime_ns": "integer",
        "size": "integer"
      }
    },
    {
      "id": "command",
      "name": "Authorized command",
      "fields": {
        "argv": "list",
        "cwd": "path",
        "timeout_s": "number",
        "environment": "map"
      }
    },
    {
      "id": "command_output",
      "name": "Captured command result",
      "fields": {
        "exit_code": "integer",
        "output": "text",
        "duration_s": "number",
        "timed_out": "boolean",
        "output_truncated": "boolean"
      }
    },
    {
      "id": "file_text",
      "name": "File content",
      "fields": {
        "path": "path",
        "lines": "list",
        "total_lines": "integer"
      }
    },
    {
      "id": "search_request",
      "name": "Search request",
      "fields": {
        "pattern": "string",
        "path": "path",
        "glob": "string",
        "context": "integer",
        "max_matches": "integer"
      }
    },
    {
      "id": "search_result",
      "name": "Search result",
      "fields": {
        "hits": "list",
        "total_matches": "integer",
        "files_scanned": "integer",
        "skipped": "integer",
        "partial_scan": "boolean",
        "partial_storage": "boolean"
      }
    },
    {
      "id": "digest",
      "name": "Deterministic digest",
      "fields": {
        "kind": "enum",
        "confidence": "number",
        "findings": "list",
        "lines": "integer"
      }
    },
    {
      "id": "excerpt",
      "name": "Ranked excerpt",
      "fields": {
        "lines": "list",
        "goal": "text",
        "chunk_tokens": "integer",
        "max_chunks": "integer"
      }
    },
    {
      "id": "facts",
      "name": "Model facts",
      "fields": {
        "facts": "list",
        "rejected": "integer",
        "warnings": "list"
      }
    },
    {
      "id": "research",
      "name": "Research state",
      "fields": {
        "task": "text",
        "sources": "list",
        "max_steps": "integer",
        "seeded": "integer",
        "steps": "list",
        "pending": "json",
        "done_calls": "list",
        "force_finish": "boolean",
        "prompt_tokens": "integer"
      }
    },
    {
      "id": "model_request",
      "name": "Model request",
      "fields": {
        "model": "string",
        "base_url": "url",
        "purpose": "string",
        "tools": "list",
        "system": "text",
        "user": "text",
        "max_output_tokens": "integer"
      }
    },
    {
      "id": "model_reply",
      "name": "Model reply",
      "fields": {
        "tool_calls": "list",
        "usage": "json"
      }
    },
    {
      "id": "observation",
      "name": "Research observation",
      "fields": {
        "call": "string",
        "observation": "text",
        "signature": "string",
        "shown_whole": "string"
      }
    },
    {
      "id": "evidence",
      "name": "Research answer",
      "fields": {
        "answer": "text",
        "evidence": "list",
        "unverified": "integer",
        "steps": "integer",
        "finished": "boolean"
      },
      "note": "Citations are checked for source and line existence. This does not establish semantic support."
    },
    {
      "id": "hook_event",
      "name": "Shell hook event",
      "fields": {
        "tool_name": "string",
        "tool_input": "json",
        "tool_response": "json",
        "cwd": "path",
        "event": "enum"
      }
    },
    {
      "id": "hook_result",
      "name": "Shell hook response",
      "fields": {
        "status": "integer",
        "permissionDecision": "string",
        "permissionDecisionReason": "text",
        "updatedToolOutput": "json"
      }
    },
    {
      "id": "owner_request",
      "name": "Owner operation",
      "fields": {
        "operation": "string",
        "changes": "json",
        "origin": "url",
        "confirmation": "boolean"
      }
    },
    {
      "id": "install_plan",
      "name": "Client installation plan",
      "fields": {
        "client": "enum",
        "preset": "enum",
        "hooks": "boolean",
        "handle": "string",
        "name": "string",
        "harness": "harness",
        "changes": "list"
      }
    },
    {
      "id": "install_record",
      "name": "Client installation record",
      "fields": {
        "client": "enum",
        "harness_id": "string",
        "handle": "string",
        "preset": "enum",
        "hooks": "boolean",
        "at": "timestamp",
        "files": "list"
      }
    },
    {
      "id": "client_entries",
      "name": "Managed client entries",
      "fields": {
        "client": "enum",
        "files": "list",
        "stdio": "list",
        "hooks": "list",
        "pre_approved": "list"
      }
    },
    {
      "id": "dashboard_page",
      "name": "Dashboard projection",
      "fields": {
        "view": "enum",
        "data": "json",
        "etag": "string",
        "next_before": "integer",
        "latest_seq": "integer"
      }
    },
    {
      "id": "browser_state",
      "name": "Browser preferences and navigation",
      "fields": {
        "theme": "enum",
        "density": "enum",
        "route": "string",
        "filters": "json"
      }
    },
    {
      "id": "model_status",
      "name": "Model server status",
      "fields": {
        "provider": "enum",
        "base_url": "url",
        "reachable": "boolean",
        "authorized": "boolean",
        "latency_ms": "number",
        "models": "list",
        "error": "text"
      }
    },
    {
      "id": "lifecycle",
      "name": "Model ownership",
      "fields": {
        "ours": "list",
        "active": "map",
        "idle_timers": "map"
      }
    },
    {
      "id": "service_state",
      "name": "Service lifecycle",
      "fields": {
        "status": "enum",
        "port": "integer",
        "control_dir": "path",
        "model": "string"
      }
    },
    {
      "id": "schema_state",
      "name": "SQLite schema state",
      "fields": {
        "user_version": "integer",
        "migration_index": "integer"
      }
    },
    {
      "id": "regex_request",
      "name": "Isolated regex request",
      "fields": {
        "lines": "list",
        "pattern": "string",
        "flags": "integer",
        "context": "integer",
        "maximum": "integer"
      }
    },
    {
      "id": "run",
      "name": "Runs record",
      "fields": {
        "seq": "integer",
        "id": "string",
        "tool": "string",
        "client": "string",
        "harness_id": "string",
        "workspace": "string",
        "summary": "string",
        "started_at": "number",
        "ended_at": "number",
        "status": "string",
        "route": "string",
        "decision": "string",
        "raw_tokens": "integer",
        "returned_tokens": "integer",
        "artifact_id": "string",
        "error": "string",
        "exit_code": "integer",
        "redactions": "integer",
        "llm_calls": "integer",
        "llm_in": "integer",
        "llm_out": "integer",
        "llm_reasoning": "integer",
        "llm_cached": "integer",
        "transport": "string",
        "client_info": "string",
        "session_id": "string",
        "request_id": "string"
      }
    },
    {
      "id": "span",
      "name": "Spans record",
      "fields": {
        "id": "string",
        "run_id": "string",
        "parent_id": "string",
        "name": "string",
        "kind": "string",
        "started_at": "number",
        "ended_at": "number",
        "status": "string",
        "attrs": "string"
      }
    },
    {
      "id": "model_call",
      "name": "Llm Calls record",
      "fields": {
        "id": "string",
        "run_id": "string",
        "span_id": "string",
        "model": "string",
        "endpoint": "string",
        "started_at": "number",
        "ended_at": "number",
        "input_tokens": "integer",
        "output_tokens": "integer",
        "reasoning_tokens": "integer",
        "cached_tokens": "integer",
        "status": "string",
        "error": "string",
        "prompt_preview": "string",
        "output_preview": "string",
        "purpose": "string"
      }
    },
    {
      "id": "artifact",
      "name": "Artifacts record",
      "fields": {
        "id": "string",
        "run_id": "string",
        "kind": "string",
        "title": "string",
        "created_at": "number",
        "expires_at": "number",
        "bytes": "integer",
        "lines": "integer",
        "tokens_est": "integer",
        "content": "bytes"
      }
    },
    {
      "id": "harness_record",
      "name": "Harnesses record",
      "fields": {
        "id": "string",
        "name": "string",
        "handle": "string",
        "digest": "string",
        "tools": "string",
        "enabled": "integer",
        "created_at": "number",
        "expires_at": "number",
        "revoked_at": "number",
        "last_used_at": "number",
        "folders": "string",
        "deny": "string",
        "hooks": "integer"
      }
    },
    {
      "id": "audit_event",
      "name": "Audit Events record",
      "fields": {
        "seq": "integer",
        "at": "number",
        "kind": "string",
        "subject": "string",
        "action": "string",
        "actor": "string",
        "detail": "string"
      }
    },
    {
      "id": "payload",
      "name": "Payloads record",
      "fields": {
        "id": "string",
        "run_id": "string",
        "kind": "string",
        "owner_id": "string",
        "created_at": "number",
        "expires_at": "number",
        "bytes": "integer",
        "truncated": "integer",
        "content": "bytes"
      }
    },
    {
      "id": "kv",
      "name": "Kv record",
      "fields": {
        "key": "string",
        "value": "string"
      }
    },
    {
      "id": "masked_text",
      "name": "Masked text",
      "fields": {
        "text": "text",
        "replacements": "integer"
      }
    },
    {
      "id": "model_control",
      "name": "Provider control request",
      "fields": {
        "operation": "enum",
        "model": "string",
        "provider": "enum",
        "base_url": "url"
      }
    },
    {
      "id": "file_change",
      "name": "Client file change",
      "fields": {
        "path": "path",
        "before": "text",
        "after": "text",
        "summary": "text"
      }
    },
    {
      "id": "file_write_result",
      "name": "Client file write result",
      "fields": {
        "path": "path",
        "backup": "path",
        "error": "text"
      }
    },
    {
      "id": "evaluation_report",
      "name": "Fixture evaluation report",
      "fields": {
        "case": "string",
        "passed": "boolean",
        "problems": "list",
        "returned_tokens": "integer",
        "wall_s": "number",
        "llm_in": "integer",
        "llm_out": "integer",
        "model": "string",
        "repeat": "integer"
      }
    },
    {
      "id": "checkout_setup",
      "name": "Checkout setup request",
      "fields": {
        "root": "path",
        "unattended": "boolean",
        "service_python": "string",
        "node": "string",
        "saturn_home": "path"
      }
    },
    {
      "id": "checkout_report",
      "name": "Checkout verification report",
      "fields": {
        "step": "string",
        "command": "string[]",
        "exit_code": "integer",
        "elapsed_seconds": "number",
        "diagnostics": "masked text"
      }
    },
    {
      "id": "golden_manifest",
      "name": "Golden dataset manifest",
      "fields": {
        "version": "string",
        "sources": "list",
        "cases": "list",
        "splits": "json",
        "asset_hashes": "json",
        "selection_rule": "text",
        "scoring_version": "string",
        "corpus_hash": "string"
      }
    },
    {
      "id": "golden_assets",
      "name": "Golden source assets",
      "fields": {
        "source_id": "string",
        "revision": "string",
        "licence": "string",
        "attribution": "text",
        "capture": "json",
        "content_hash": "string",
        "relative_path": "path"
      }
    },
    {
      "id": "golden_labels",
      "name": "Golden expected results",
      "fields": {
        "case_id": "string",
        "source_family": "string",
        "required_facts": "list",
        "evidence": "list",
        "negative_expectations": "list",
        "follow_ups": "list",
        "semantic_review": "json"
      }
    },
    {
      "id": "golden_report",
      "name": "Golden dataset validation",
      "fields": {
        "valid": "boolean",
        "diagnostics": "list",
        "coverage": "json",
        "split_conflicts": "list",
        "duplicate_findings": "list",
        "limitations": "list",
        "review_accepted": "boolean"
      }
    },
    {
      "id": "golden_workspace",
      "name": "Materialized corpus workspace",
      "fields": {
        "root": "path",
        "copied_assets": "list"
      }
    },
    {
      "id": "benchmark_plan",
      "name": "Benchmark execution plan",
      "fields": {
        "corpus_sha256": "string",
        "commit": "string",
        "models": "list",
        "schedules": "json",
        "seed": "integer",
        "repetitions": "integer",
        "limits": "json",
        "environment": "json",
        "provisional": "boolean"
      }
    },
    {
      "id": "benchmark_observation",
      "name": "Benchmark workflow observation",
      "fields": {
        "case_id": "string",
        "model": "string",
        "harness_id": "string",
        "request_id": "string",
        "timestamps": "json",
        "responses": "list",
        "usage": "json",
        "resources": "json",
        "outcome": "string",
        "grade": "json"
      }
    },
    {
      "id": "benchmark_report",
      "name": "Benchmark execution report",
      "fields": {
        "identity": "benchmark_plan",
        "counts": "json",
        "metrics": "json",
        "baseline": "json",
        "limitations": "list",
        "failures": "list",
        "provisional": "boolean"
      }
    },
    {
      "id": "timing_interval",
      "name": "Monotonic timing interval",
      "fields": {
        "id": "string",
        "parent_id": "string",
        "stage": "string",
        "category": "string",
        "start_ns": "integer",
        "end_ns": "integer",
        "status": "string"
      }
    },
    {
      "id": "timing_scope",
      "name": "Bounded request timing scope",
      "fields": {
        "profile_id": "string",
        "service_instance_id": "string",
        "run_id": "string",
        "request_identity_digest": "string",
        "clock": "string",
        "root_start_ns": "integer",
        "root_end_ns": "integer",
        "intervals": "timing_interval[]",
        "reserved_collector": "boolean",
        "lost_intervals": "integer",
        "complete": "boolean",
        "reason": "string"
      }
    },
    {
      "id": "timing_profile",
      "name": "Optional internal timing profile",
      "fields": {
        "schema_version": "integer",
        "scope": "timing_scope",
        "outcome": "string",
        "export_boundary": "string",
        "complete": "boolean",
        "reason": "string"
      }
    },
    {
      "id": "internal_latency_plan",
      "name": "Internal latency execution plan",
      "fields": {
        "corpus_sha256": "string",
        "commit": "string",
        "seed": "integer",
        "conditions": "json",
        "schedules": "json",
        "hardware": "json",
        "settings": "json",
        "limits": "json",
        "primary_workflows": "integer",
        "overhead_workflows": "integer",
        "excluded_workflows": "integer",
        "provisional": "boolean"
      }
    },
    {
      "id": "internal_latency_observation",
      "name": "Correlated internal latency observation",
      "fields": {
        "workflow": "benchmark_observation",
        "profile": "timing_profile",
        "expected_profile": "boolean",
        "collection_deadline": "number",
        "valid_intervals": "boolean",
        "internal_union_ns": "integer",
        "wait_union_ns": "integer",
        "backend_union_ns": "integer",
        "unattributed_ns": "integer",
        "overlap_ns": "integer",
        "coverage": "number",
        "paired_observation_id": "string",
        "limitations": "list"
      }
    },
    {
      "id": "internal_latency_report",
      "name": "Internal latency report",
      "fields": {
        "identity": "internal_latency_plan",
        "counts": "json",
        "stage_metrics": "json",
        "waiting": "json",
        "backend_envelopes": "json",
        "coverage": "json",
        "overlap": "json",
        "instrumentation_cost": "json",
        "hardware": "json",
        "reproduction": "json",
        "failures": "list",
        "limitations": "list",
        "provisional": "boolean"
      }
    }
  ],
  "parts": [
    {
      "id": "owner",
      "name": "Developer",
      "kind": "external",
      "lane": "top",
      "does": "Configures access and settings, runs local controls, and inspects evidence."
    },
    {
      "id": "clients",
      "name": "Claude Code and Codex",
      "kind": "external",
      "lane": "left",
      "does": "Select a workspace and request tools. Their own permission modes control confirmation before a call."
    },
    {
      "id": "model_server",
      "name": "Local model server",
      "kind": "external",
      "lane": "right",
      "does": "Runs the optional worker model and exposes model-list and model-management APIs."
    },
    {
      "id": "project",
      "name": "Project files",
      "kind": "external",
      "lane": "right",
      "does": "Supplies the files in each selected workspace. Project ownership remains outside Saturn."
    },
    {
      "id": "operating_system",
      "name": "Operating system",
      "kind": "external",
      "lane": "right",
      "does": "Runs child processes under the developer account. Allowed project code is not isolated by an operating-system sandbox."
    },
    {
      "id": "client_files",
      "name": "Client configuration files",
      "kind": "external",
      "lane": "left",
      "does": "Hold client-owned settings and Saturn-managed registration, approval, and hook entries."
    },
    {
      "id": "saturn",
      "kind": "group",
      "name": "Saturn",
      "does": "Runs bounded local tools and returns concise results with stored evidence.",
      "children": [
        {
          "id": "service",
          "kind": "group",
          "name": "HTTP service and application operations",
          "does": "Hosts local HTTP endpoints and shared application operations. CLI hosts reuse those operations in-process.",
          "children": [
            {
              "id": "ingress",
              "kind": "group",
              "name": "Request identity and workspace",
              "does": "Request identity and workspace",
              "children": [
                {
                  "id": "ingress_refresh",
                  "name": "Refresh live configuration",
                  "kind": "step",
                  "in": "tool_call",
                  "out": "tool_call",
                  "does": "Refresh live configuration",
                  "code": [
                    "services/saturn/src/saturn/transport/authentication.py",
                    "services/saturn/src/saturn/transport/mcp_server.py",
                    "services/saturn/src/saturn/application/workspace_scope.py"
                  ]
                },
                {
                  "id": "ingress_host",
                  "name": "Trusted Host header",
                  "kind": "decision",
                  "test": "The Host header names this machine",
                  "branches": {
                    "trusted": "saturn.service.ingress.ingress_configured",
                    "otherwise": "saturn.service.ingress.replies.http_failure (error)"
                  },
                  "code": [
                    "services/saturn/src/saturn/transport/authentication.py",
                    "services/saturn/src/saturn/transport/mcp_server.py",
                    "services/saturn/src/saturn/application/workspace_scope.py"
                  ]
                },
                {
                  "id": "ingress_configured",
                  "name": "Harness configured",
                  "kind": "decision",
                  "test": "At least one harness is configured",
                  "branches": {
                    "configured": "saturn.service.ingress.ingress_token",
                    "otherwise": "saturn.service.ingress.replies.not_configured (error)"
                  },
                  "code": [
                    "services/saturn/src/saturn/transport/authentication.py",
                    "services/saturn/src/saturn/transport/mcp_server.py",
                    "services/saturn/src/saturn/application/workspace_scope.py"
                  ]
                },
                {
                  "id": "ingress_token",
                  "name": "Bearer credential accepted",
                  "kind": "decision",
                  "test": "Exactly one bearer header identifies an enabled, unexpired, non-revoked harness",
                  "branches": {
                    "accepted": "saturn.service.ingress.protocol.mcp_method",
                    "otherwise": "saturn.service.ingress.replies.auth_failure (error)"
                  },
                  "code": [
                    "services/saturn/src/saturn/transport/authentication.py",
                    "services/saturn/src/saturn/transport/mcp_server.py",
                    "services/saturn/src/saturn/application/workspace_scope.py"
                  ]
                },
                {
                  "id": "ingress_tool",
                  "name": "Tool permission",
                  "kind": "decision",
                  "test": "The harness includes the requested tool",
                  "branches": {
                    "permitted": "saturn.service.ingress.workspace.workspace_source",
                    "otherwise": "saturn.service.ingress.replies.reject_tool (error)"
                  },
                  "code": [
                    "services/saturn/src/saturn/transport/authentication.py",
                    "services/saturn/src/saturn/transport/mcp_server.py",
                    "services/saturn/src/saturn/application/workspace_scope.py"
                  ]
                },
                {
                  "id": "workspace",
                  "kind": "group",
                  "name": "Call-local workspace",
                  "does": "Call-local workspace",
                  "children": [
                    {
                      "id": "workspace_source",
                      "name": "Select workspace source",
                      "kind": "decision",
                      "test": "The highest-priority workspace source available",
                      "branches": {
                        "explicit": "saturn.service.ingress.workspace.workspace_valid",
                        "client_roots": "saturn.service.ingress.workspace.workspace_valid",
                        "absolute_cwd": "saturn.service.ingress.workspace.workspace_valid",
                        "single_allowed_folder": "saturn.service.ingress.workspace.workspace_valid",
                        "otherwise": "saturn.service.ingress.workspace.workspace_optional"
                      },
                      "code": "services/saturn/src/saturn/application/workspace_scope.py"
                    },
                    {
                      "id": "workspace_valid",
                      "name": "Existing absolute folder",
                      "kind": "decision",
                      "test": "Every candidate is an existing absolute directory",
                      "branches": {
                        "valid": "saturn.service.ingress.workspace.workspace_global",
                        "otherwise": "saturn.service.ingress.workspace.workspace_optional"
                      },
                      "code": "services/saturn/src/saturn/application/workspace_scope.py"
                    },
                    {
                      "id": "workspace_global",
                      "name": "Global folder boundary",
                      "kind": "decision",
                      "test": "The resolved workspace is inside the global allowed folders, or that list is empty",
                      "branches": {
                        "inside": "saturn.service.ingress.workspace.workspace_harness",
                        "otherwise": "saturn.service.ingress.workspace.workspace_optional"
                      },
                      "code": "services/saturn/src/saturn/application/workspace_scope.py"
                    },
                    {
                      "id": "workspace_harness",
                      "name": "Harness folder boundary",
                      "kind": "decision",
                      "test": "The workspace is inside this harness's folders, or that list is empty",
                      "branches": {
                        "inside": "saturn.service.ingress.workspace.workspace_bind",
                        "otherwise": "saturn.service.ingress.workspace.workspace_optional"
                      },
                      "code": "services/saturn/src/saturn/application/workspace_scope.py"
                    },
                    {
                      "id": "workspace_bind",
                      "name": "Build call-scoped file and command adapters",
                      "kind": "step",
                      "code": "services/saturn/src/saturn/bootstrap/container.py",
                      "does": "Builds per-call roots without changing another call's workspace.",
                      "in": [
                        "tool_call",
                        "caller"
                      ],
                      "out": "tool_call"
                    },
                    {
                      "id": "workspace_optional",
                      "name": "Artifact query without an explicit workspace",
                      "kind": "decision",
                      "test": "The tool is saturn_query and no explicit workspace_root was supplied",
                      "branches": {
                        "artifact_only": "saturn.service.ingress.workspace.workspace_no_root",
                        "otherwise": "saturn.service.ingress.replies.reject_workspace (error)"
                      },
                      "code": "services/saturn/src/saturn/application/workspace_scope.py"
                    },
                    {
                      "id": "workspace_no_root",
                      "name": "Keep artifact access without assigning file roots",
                      "kind": "step",
                      "code": "services/saturn/src/saturn/transport/mcp_server.py",
                      "in": "tool_call",
                      "out": "tool_call",
                      "does": "Keep artifact access without assigning file roots"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/workspace_scope.py"
                },
                {
                  "id": "replies",
                  "kind": "group",
                  "name": "Ingress refusals",
                  "does": "Ingress refusals",
                  "children": [
                    {
                      "id": "not_configured",
                      "name": "Return HTTP 503 before tool dispatch",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "failure",
                      "does": "Return HTTP 503 before tool dispatch",
                      "code": [
                        "services/saturn/src/saturn/transport/authentication.py",
                        "services/saturn/src/saturn/transport/mcp_server.py"
                      ]
                    },
                    {
                      "id": "auth_failure",
                      "name": "Record rejected POST and return HTTP 401",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "failure",
                      "does": "Record rejected POST and return HTTP 401",
                      "code": [
                        "services/saturn/src/saturn/transport/authentication.py",
                        "services/saturn/src/saturn/transport/mcp_server.py"
                      ]
                    },
                    {
                      "id": "reject_tool",
                      "name": "Record tool permission refusal",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "failure",
                      "does": "Record tool permission refusal",
                      "code": [
                        "services/saturn/src/saturn/transport/authentication.py",
                        "services/saturn/src/saturn/transport/mcp_server.py"
                      ]
                    },
                    {
                      "id": "reject_workspace",
                      "name": "Record workspace selection refusal",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "failure",
                      "does": "Record workspace selection refusal",
                      "code": [
                        "services/saturn/src/saturn/transport/authentication.py",
                        "services/saturn/src/saturn/transport/mcp_server.py"
                      ]
                    },
                    {
                      "id": "http_failure",
                      "name": "Return trusted-host or request validation failure",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "failure",
                      "does": "Return trusted-host or request validation failure",
                      "code": [
                        "services/saturn/src/saturn/transport/authentication.py",
                        "services/saturn/src/saturn/transport/mcp_server.py"
                      ]
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/transport/authentication.py",
                    "services/saturn/src/saturn/transport/mcp_server.py"
                  ]
                },
                {
                  "id": "protocol",
                  "kind": "group",
                  "name": "MCP protocol requests",
                  "does": "MCP protocol requests",
                  "children": [
                    {
                      "id": "mcp_method",
                      "name": "MCP method",
                      "kind": "decision",
                      "test": "The MCP request is a tool call, tool discovery, or session housekeeping",
                      "branches": {
                        "call": "saturn.service.ingress.protocol.tool_schema",
                        "discovery": "saturn.service.ingress.protocol.tool_catalog",
                        "otherwise": "saturn.service.ingress.protocol.mcp_housekeeping"
                      },
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "tool_schema",
                      "name": "Tool arguments validate",
                      "kind": "decision",
                      "test": "The request names a public tool and satisfies its argument schema",
                      "branches": {
                        "valid": "saturn.service.ingress.ingress_refresh",
                        "otherwise": "saturn.service.ingress.replies.http_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "tool_catalog",
                      "name": "Return tool definitions and service instructions",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "tool_result",
                      "does": "Return tool definitions and service instructions",
                      "code": [
                        "services/saturn/src/saturn/transport/mcp_server.py",
                        "services/saturn/src/saturn/transport/server_info.py"
                      ]
                    },
                    {
                      "id": "mcp_housekeeping",
                      "name": "Handle initialization and session lifecycle",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "tool_result",
                      "does": "Handle initialization and session lifecycle",
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/transport/mcp_server.py"
                }
              ],
              "code": [
                "services/saturn/src/saturn/transport/authentication.py",
                "services/saturn/src/saturn/transport/mcp_server.py",
                "services/saturn/src/saturn/application/workspace_scope.py"
              ]
            },
            {
              "id": "tools",
              "kind": "group",
              "name": "Bounded tool operations",
              "does": "Runs the five public tools and the shared digest and research workflows.",
              "children": [
                {
                  "id": "dispatch",
                  "kind": "group",
                  "name": "Dispatch and progress",
                  "does": "Dispatch and progress",
                  "children": [
                    {
                      "id": "tool_route",
                      "name": "Select public tool",
                      "kind": "decision",
                      "test": "The requested tool name",
                      "branches": {
                        "run": "saturn.service.tools.run.run_parse",
                        "read": "saturn.service.tools.read.files.read_path",
                        "search": "saturn.service.tools.search.traversal.search_pattern",
                        "ask": "saturn.service.tools.research.preparation.ask_task",
                        "otherwise": "saturn.service.tools.query.query_selector"
                      },
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "progress_tick",
                      "name": "Progress interval",
                      "kind": "event",
                      "trigger": "A pending tool operation reaches its configured progress interval",
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "progress_enabled",
                      "name": "Progress enabled",
                      "kind": "decision",
                      "test": "The configured interval is greater than zero",
                      "branches": {
                        "enabled": "saturn.service.tools.dispatch.progress_schedule",
                        "otherwise": "saturn.service.tools.dispatch.progress_skip"
                      },
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "progress_schedule",
                      "name": "Start the advisory heartbeat task",
                      "kind": "step",
                      "rules": [
                        "Default progress interval: 15 s. The task is cancelled when the operation finishes."
                      ],
                      "in": "tool_call",
                      "out": "tool_call",
                      "does": "Start the advisory heartbeat task",
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "progress_send",
                      "name": "Send elapsed progress",
                      "kind": "step",
                      "stops": "Progress is advisory; the pending operation continues independently.",
                      "in": "tool_call",
                      "out": "tool_call",
                      "does": "Send elapsed progress",
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    },
                    {
                      "id": "progress_skip",
                      "name": "Continue without progress",
                      "kind": "step",
                      "stops": "The pending operation continues without a progress notification.",
                      "in": "tool_call",
                      "out": "tool_call",
                      "does": "Continue without progress",
                      "code": "services/saturn/src/saturn/transport/mcp_server.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/transport/mcp_server.py"
                },
                {
                  "id": "run",
                  "kind": "group",
                  "name": "Command execution",
                  "does": "Command execution",
                  "children": [
                    {
                      "id": "run_parse",
                      "name": "Parse one argv and resolve cwd",
                      "kind": "step",
                      "does": "Parses platform quoting without invoking a shell and resolves cwd inside the call roots.",
                      "in": "tool_call",
                      "out": "command",
                      "code": [
                        "services/saturn/src/saturn/application/command_service.py",
                        "services/saturn/src/saturn/domain/policy.py",
                        "services/saturn/src/saturn/domain/command_grammar.py"
                      ]
                    },
                    {
                      "id": "run_cwd",
                      "name": "Valid working directory",
                      "kind": "decision",
                      "test": "The resolved cwd is an existing permitted directory",
                      "branches": {
                        "valid": "saturn.service.tools.run.policy.policy_guard",
                        "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                      },
                      "code": [
                        "services/saturn/src/saturn/application/command_service.py",
                        "services/saturn/src/saturn/domain/policy.py",
                        "services/saturn/src/saturn/domain/command_grammar.py"
                      ]
                    },
                    {
                      "id": "policy",
                      "kind": "group",
                      "name": "Command and path authorization",
                      "does": "Command and path authorization",
                      "children": [
                        {
                          "id": "policy_guard",
                          "name": "Unconditional path guards",
                          "kind": "decision",
                          "test": "Parsed path arguments stay inside the call roots and avoid recognized credential files",
                          "branches": {
                            "safe": "saturn.service.tools.run.policy.policy_deny",
                            "otherwise": "saturn.service.tools.run.policy.policy_refuse (error)"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/policy.py",
                            "services/saturn/src/saturn/domain/command_grammar.py"
                          ]
                        },
                        {
                          "id": "policy_deny",
                          "name": "Denied command rule",
                          "kind": "decision",
                          "test": "A global or harness deny rule matches the parsed words",
                          "branches": {
                            "denied": "saturn.service.tools.run.policy.policy_refuse (error)",
                            "otherwise": "saturn.service.tools.run.policy.policy_allow"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/policy.py",
                            "services/saturn/src/saturn/domain/command_grammar.py"
                          ]
                        },
                        {
                          "id": "policy_allow",
                          "name": "Explicit allow rule",
                          "kind": "decision",
                          "test": "A global allow rule matches the parsed words",
                          "branches": {
                            "allowed": "saturn.service.tools.run.runner.preparation.runner_env",
                            "otherwise": "saturn.service.tools.run.policy.policy_open"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/policy.py",
                            "services/saturn/src/saturn/domain/command_grammar.py"
                          ]
                        },
                        {
                          "id": "policy_open",
                          "name": "Open command preset",
                          "kind": "decision",
                          "test": "The global command preset is open",
                          "branches": {
                            "open": "saturn.service.tools.run.runner.preparation.runner_env",
                            "otherwise": "saturn.service.tools.run.policy.policy_grammar"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/policy.py",
                            "services/saturn/src/saturn/domain/command_grammar.py"
                          ]
                        },
                        {
                          "id": "policy_grammar",
                          "name": "Standard command grammar",
                          "kind": "decision",
                          "test": "The program, subcommand, and options match the built-in check or inspection forms",
                          "branches": {
                            "standard": "saturn.service.tools.run.runner.preparation.runner_env",
                            "otherwise": "saturn.service.tools.run.policy.policy_refuse (error)"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/policy.py",
                            "services/saturn/src/saturn/domain/command_grammar.py"
                          ]
                        },
                        {
                          "id": "policy_refuse",
                          "name": "Return the deciding refusal and rule",
                          "kind": "step",
                          "does": "Refuses the command without execution and records the deciding policy span.",
                          "in": "command",
                          "out": "failure",
                          "code": [
                            "services/saturn/src/saturn/domain/policy.py",
                            "services/saturn/src/saturn/domain/command_grammar.py"
                          ]
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/domain/policy.py",
                        "services/saturn/src/saturn/domain/command_grammar.py"
                      ]
                    },
                    {
                      "id": "runner",
                      "kind": "group",
                      "name": "Owned process execution",
                      "does": "Owned process execution",
                      "children": [
                        {
                          "id": "preparation",
                          "kind": "group",
                          "name": "Command environment and launcher checks",
                          "does": "Command environment and launcher checks",
                          "children": [
                            {
                              "id": "runner_env",
                              "name": "Scrub environment and select project interpreter",
                              "kind": "step",
                              "rules": [
                                "Secret-named environment variables are removed.",
                                "uv does not sync; Cargo and Go use offline/read-only dependency settings.",
                                "A project virtual environment takes precedence for bare Python."
                              ],
                              "in": "command",
                              "out": "command",
                              "does": "Scrub environment and select project interpreter",
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_executable",
                              "name": "Executable available",
                              "kind": "decision",
                              "test": "The command resolves on the scrubbed PATH or to the project Python",
                              "branches": {
                                "found": "saturn.service.tools.run.runner.preparation.runner_windows",
                                "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                              },
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_windows",
                              "name": "Windows batch launcher",
                              "kind": "decision",
                              "test": "The resolved executable is a .cmd or .bat launcher",
                              "branches": {
                                "batch": "saturn.service.tools.run.runner.preparation.runner_safe_args",
                                "otherwise": "saturn.service.tools.run.runner.process.runner_spawn"
                              },
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_safe_args",
                              "name": "Batch argument safety",
                              "kind": "decision",
                              "test": "Every argument matches the safe Windows launcher character set",
                              "branches": {
                                "safe": "saturn.service.tools.run.runner.process.runner_spawn",
                                "otherwise": "saturn.service.tools.run.policy.policy_refuse (error)"
                              },
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                        },
                        {
                          "id": "process",
                          "kind": "group",
                          "name": "Process capture and cancellation",
                          "does": "Process capture and cancellation",
                          "children": [
                            {
                              "id": "runner_spawn",
                              "name": "Start the owned child process",
                              "kind": "step",
                              "rules": [
                                "stdin is closed. stdout and stderr are captured together.",
                                "POSIX commands start in a new session."
                              ],
                              "in": "command",
                              "out": "command_output",
                              "does": "Start the owned child process",
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_capture",
                              "name": "Capture budget",
                              "kind": "decision",
                              "test": "Captured output is below 30,000,000 bytes",
                              "branches": {
                                "room": "saturn.service.tools.run.runner.process.runner_keep",
                                "otherwise": "saturn.service.tools.run.runner.process.runner_drop"
                              },
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_keep",
                              "name": "Append captured bytes",
                              "kind": "step",
                              "in": "command_output",
                              "out": "command_output",
                              "does": "Append captured bytes",
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_drop",
                              "name": "Drain excess bytes and mark truncation",
                              "kind": "step",
                              "in": "command_output",
                              "out": "command_output",
                              "does": "Drain excess bytes and mark truncation",
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_completion",
                              "name": "Process completion",
                              "kind": "decision",
                              "test": "The command completes before its deadline and the output reader drains",
                              "branches": {
                                "complete": "saturn.service.tools.run.reply.run_redact",
                                "timeout": "saturn.service.tools.run.runner.process.runner_kill",
                                "otherwise": "saturn.service.tools.run.runner.process.runner_cancel"
                              },
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_kill",
                              "name": "Kill the owned process tree after timeout",
                              "kind": "step",
                              "rules": [
                                "Default command deadline: 300 s. Output-drain deadline: 5 s."
                              ],
                              "in": "command_output",
                              "out": "command_output",
                              "does": "Kill the owned process tree after timeout",
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            },
                            {
                              "id": "runner_cancel",
                              "name": "Kill the owned process tree after cancellation",
                              "kind": "step",
                              "in": "command_output",
                              "out": "failure",
                              "does": "Kill the owned process tree after cancellation",
                              "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/infrastructure/command_runner.py"
                    },
                    {
                      "id": "reply",
                      "kind": "group",
                      "name": "Command output selection",
                      "does": "Command output selection",
                      "children": [
                        {
                          "id": "run_redact",
                          "name": "Strip ANSI and mask captured output",
                          "kind": "step",
                          "code": "services/saturn/src/saturn/domain/redaction.py",
                          "in": "command_output",
                          "out": "command_output",
                          "does": "Strip ANSI and mask captured output"
                        },
                        {
                          "id": "run_inline",
                          "name": "Inline result budget",
                          "kind": "decision",
                          "test": "The status and output fit the configured inline budget",
                          "branches": {
                            "fits": "saturn.service.tools.run.reply.run_format",
                            "otherwise": "saturn.service.evidence.artifacts.artifact_write"
                          },
                          "code": "services/saturn/src/saturn/application/command_service.py"
                        },
                        {
                          "id": "run_format",
                          "name": "Return complete short output and exit status",
                          "kind": "step",
                          "in": "command_output",
                          "out": "tool_result",
                          "does": "Return complete short output and exit status",
                          "code": "services/saturn/src/saturn/application/command_service.py"
                        },
                        {
                          "id": "run_digest_reply",
                          "name": "Return digest and artifact reference",
                          "kind": "step",
                          "rules": [
                            "Reply is masked and clipped to the inline budget."
                          ],
                          "in": [
                            "digest",
                            "facts",
                            "artifact"
                          ],
                          "out": "tool_result",
                          "does": "Return digest and artifact reference",
                          "code": "services/saturn/src/saturn/application/command_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/command_service.py"
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/application/command_service.py",
                    "services/saturn/src/saturn/domain/policy.py",
                    "services/saturn/src/saturn/domain/command_grammar.py"
                  ]
                },
                {
                  "id": "read",
                  "kind": "group",
                  "name": "Read and outline files",
                  "does": "Read and outline files",
                  "children": [
                    {
                      "id": "files",
                      "kind": "group",
                      "name": "Bounded text access",
                      "does": "Bounded text access",
                      "children": [
                        {
                          "id": "read_path",
                          "name": "Readable file path",
                          "kind": "decision",
                          "test": "The resolved path is within the call roots and is not a recognized credential file",
                          "branches": {
                            "safe": "saturn.service.tools.read.files.read_exists",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                        },
                        {
                          "id": "read_exists",
                          "name": "Regular file available",
                          "kind": "decision",
                          "test": "The path names a regular file",
                          "branches": {
                            "file": "saturn.service.tools.read.files.read_size",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                        },
                        {
                          "id": "read_size",
                          "name": "File size limit",
                          "kind": "decision",
                          "test": "The file is at most 5,000,000 bytes",
                          "branches": {
                            "within": "saturn.service.tools.read.files.read_bytes",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                        },
                        {
                          "id": "read_bytes",
                          "name": "Read UTF-8 text and preserve line positions",
                          "kind": "step",
                          "in": "tool_call",
                          "out": "file_text",
                          "does": "Read UTF-8 text and preserve line positions",
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                        },
                        {
                          "id": "read_binary",
                          "name": "Binary content check",
                          "kind": "decision",
                          "test": "No NUL byte occurs in the first 4096 bytes",
                          "branches": {
                            "text": "saturn.service.tools.read.files.read_mask",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                        },
                        {
                          "id": "read_mask",
                          "name": "Mask secrets line by line",
                          "kind": "step",
                          "in": "file_text",
                          "out": "file_text",
                          "does": "Mask secrets line by line",
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/infrastructure/filesystem.py"
                    },
                    {
                      "id": "render",
                      "kind": "group",
                      "name": "File result selection",
                      "does": "File result selection",
                      "children": [
                        {
                          "id": "read_range",
                          "name": "Explicit line range",
                          "kind": "decision",
                          "test": "The call supplies start or end",
                          "branches": {
                            "requested": "saturn.service.tools.read.render.read_range_valid",
                            "otherwise": "saturn.service.tools.read.render.read_inline"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_range_valid",
                          "name": "Nonempty line range",
                          "kind": "decision",
                          "test": "The clamped range contains at least one source line",
                          "branches": {
                            "valid": "saturn.service.tools.read.render.read_number",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_number",
                          "name": "Number and bound the requested lines",
                          "kind": "step",
                          "rules": [
                            "Explicit ranges use at most twice the inline token budget."
                          ],
                          "in": "file_text",
                          "out": "tool_result",
                          "does": "Number and bound the requested lines",
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_inline",
                          "name": "Whole-file inline budget",
                          "kind": "decision",
                          "test": "The numbered file fits the inline budget",
                          "branches": {
                            "fits": "saturn.service.tools.read.render.read_whole",
                            "otherwise": "saturn.service.tools.read.render.read_outline"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_whole",
                          "name": "Return the complete numbered file",
                          "kind": "step",
                          "in": "file_text",
                          "out": "tool_result",
                          "does": "Return the complete numbered file",
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_outline",
                          "name": "Recognized source outline",
                          "kind": "decision",
                          "test": "The outline extractor finds headings or symbols",
                          "branches": {
                            "found": "saturn.service.tools.read.render.read_symbols",
                            "otherwise": "saturn.service.tools.read.render.read_prefix"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_symbols",
                          "name": "Return at most 60 outline entries",
                          "kind": "step",
                          "in": "file_text",
                          "out": "tool_result",
                          "does": "Return at most 60 outline entries",
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        },
                        {
                          "id": "read_prefix",
                          "name": "Return the first 15 lines",
                          "kind": "step",
                          "in": "file_text",
                          "out": "tool_result",
                          "does": "Return the first 15 lines",
                          "code": [
                            "services/saturn/src/saturn/application/workspace_service.py",
                            "services/saturn/src/saturn/domain/outline.py"
                          ]
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/application/workspace_service.py",
                        "services/saturn/src/saturn/domain/outline.py"
                      ]
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/application/workspace_service.py",
                    "services/saturn/src/saturn/infrastructure/filesystem.py",
                    "services/saturn/src/saturn/domain/outline.py"
                  ]
                },
                {
                  "id": "search",
                  "kind": "group",
                  "name": "Search and retain evidence",
                  "does": "Search and retain evidence",
                  "children": [
                    {
                      "id": "traversal",
                      "kind": "group",
                      "name": "Candidate traversal",
                      "does": "Candidate traversal",
                      "children": [
                        {
                          "id": "search_pattern",
                          "name": "Valid search expression",
                          "kind": "decision",
                          "test": "The case-insensitive regex compiles",
                          "branches": {
                            "valid": "saturn.service.tools.search.traversal.search_walk",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_walk",
                          "name": "Walk selected files and apply glob filters",
                          "kind": "step",
                          "code": "services/saturn/src/saturn/infrastructure/filesystem.py",
                          "rules": [
                            "Dependency/cache directories and recognized credential files are skipped."
                          ],
                          "in": "search_request",
                          "out": "file_text",
                          "does": "Walk selected files and apply glob filters"
                        },
                        {
                          "id": "search_budget",
                          "name": "Search file budget",
                          "kind": "decision",
                          "test": "Scanned plus skipped files remain below 3000",
                          "branches": {
                            "room": "saturn.service.tools.search.traversal.search_readable",
                            "otherwise": "saturn.service.tools.search.traversal.search_partial"
                          },
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_readable",
                          "name": "Readable candidate",
                          "kind": "decision",
                          "test": "The candidate can be read as bounded text",
                          "branches": {
                            "readable": "saturn.service.tools.search.regex.regex_literal",
                            "otherwise": "saturn.service.tools.search.traversal.search_skip"
                          },
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_skip",
                          "name": "Count skipped candidate and continue",
                          "kind": "step",
                          "in": "file_text",
                          "out": "search_result",
                          "does": "Count skipped candidate and continue",
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "matches",
                          "kind": "group",
                          "name": "Candidate match retention",
                          "does": "Candidate match retention",
                          "children": [
                            {
                              "id": "search_matches",
                              "name": "Candidate has matches",
                              "kind": "decision",
                              "test": "The candidate contains at least one matching line",
                              "branches": {
                                "matches": "saturn.service.tools.search.traversal.matches.search_storage",
                                "otherwise": "saturn.service.tools.search.traversal.search_next"
                              },
                              "code": "services/saturn/src/saturn/application/workspace_service.py"
                            },
                            {
                              "id": "search_storage",
                              "name": "Stored-result byte budget",
                              "kind": "decision",
                              "test": "Retained matches fit the artifact byte budget minus coverage metadata",
                              "branches": {
                                "room": "saturn.service.tools.search.traversal.matches.search_retain",
                                "otherwise": "saturn.service.tools.search.traversal.search_partial"
                              },
                              "code": "services/saturn/src/saturn/application/workspace_service.py"
                            },
                            {
                              "id": "search_retain",
                              "name": "Retain original line numbers and context",
                              "kind": "step",
                              "in": "file_text",
                              "out": "search_result",
                              "does": "Retain original line numbers and context",
                              "code": "services/saturn/src/saturn/application/workspace_service.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_next",
                          "name": "More candidates",
                          "kind": "decision",
                          "test": "Another candidate remains in the selected traversal",
                          "branches": {
                            "more": "saturn.service.tools.search.traversal.search_budget",
                            "otherwise": "saturn.service.tools.search.output.search_any"
                          },
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_partial",
                          "name": "Mark the remaining scan or stored results partial",
                          "kind": "step",
                          "in": "search_result",
                          "out": "search_result",
                          "does": "Mark the remaining scan or stored results partial",
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/workspace_service.py"
                    },
                    {
                      "id": "output",
                      "kind": "group",
                      "name": "Search result selection",
                      "does": "Search result selection",
                      "children": [
                        {
                          "id": "search_any",
                          "name": "Retained matches available",
                          "kind": "decision",
                          "test": "At least one matching block was retained",
                          "branches": {
                            "found": "saturn.service.tools.search.output.search_render",
                            "otherwise": "saturn.service.tools.search.output.search_empty"
                          },
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_empty",
                          "name": "Return no-match and coverage counts",
                          "kind": "step",
                          "in": "search_result",
                          "out": "tool_result",
                          "does": "Return no-match and coverage counts",
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_render",
                          "name": "Build the bounded search reply",
                          "kind": "step",
                          "rules": [
                            "Public search context: 0–3 lines. Up to 40 displayed matches. Displayed lines are clipped at 200 characters."
                          ],
                          "in": "search_result",
                          "out": "search_result",
                          "does": "Build the bounded search reply",
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_overflow",
                          "name": "More evidence than displayed",
                          "kind": "decision",
                          "test": "A matching file, matching line, or full line text is omitted from the reply",
                          "branches": {
                            "omitted": "saturn.service.tools.search.output.search_store",
                            "otherwise": "saturn.service.tools.search.output.search_reply"
                          },
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_store",
                          "name": "Store the examined matching evidence",
                          "kind": "step",
                          "in": "search_result",
                          "out": "artifact",
                          "does": "Store the examined matching evidence",
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        },
                        {
                          "id": "search_reply",
                          "name": "Return matches, counts, and optional artifact reference",
                          "kind": "step",
                          "in": [
                            "search_result",
                            "artifact"
                          ],
                          "out": "tool_result",
                          "does": "Return matches, counts, and optional artifact reference",
                          "code": "services/saturn/src/saturn/application/workspace_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/workspace_service.py"
                    },
                    {
                      "id": "regex",
                      "kind": "group",
                      "name": "Isolated regex matching",
                      "does": "Isolated regex matching",
                      "children": [
                        {
                          "id": "regex_literal",
                          "name": "Literal pattern",
                          "kind": "decision",
                          "test": "The pattern contains no regex operators",
                          "branches": {
                            "literal": "saturn.service.tools.search.regex.regex_inline",
                            "otherwise": "saturn.service.tools.search.regex.regex_worker"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        },
                        {
                          "id": "regex_inline",
                          "name": "Match literal text in-process",
                          "kind": "step",
                          "in": "file_text",
                          "out": "search_result",
                          "does": "Match literal text in-process",
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        },
                        {
                          "id": "regex_worker",
                          "name": "Regex worker ready",
                          "kind": "decision",
                          "test": "The spawn worker becomes ready within 10 seconds",
                          "branches": {
                            "ready": "saturn.service.tools.search.regex.regex_send",
                            "otherwise": "saturn.service.tools.search.regex.regex_stop"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        },
                        {
                          "id": "regex_send",
                          "name": "Send the bounded matching request",
                          "kind": "step",
                          "in": "regex_request",
                          "out": "search_result",
                          "does": "Send the bounded matching request",
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        },
                        {
                          "id": "regex_deadline",
                          "name": "Regex result deadline",
                          "kind": "decision",
                          "test": "The worker returns a result within one second",
                          "branches": {
                            "answered": "saturn.service.tools.search.regex.regex_result",
                            "otherwise": "saturn.service.tools.search.regex.regex_stop"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        },
                        {
                          "id": "regex_result",
                          "name": "Return matched source lines and total count",
                          "kind": "step",
                          "in": "search_result",
                          "out": "search_result",
                          "does": "Return matched source lines and total count",
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        },
                        {
                          "id": "regex_stop",
                          "name": "Terminate the regex worker and report invalid input",
                          "kind": "step",
                          "in": "regex_request",
                          "out": "failure",
                          "does": "Terminate the regex worker and report invalid input",
                          "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/infrastructure/regex_matcher.py"
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/application/workspace_service.py",
                    "services/saturn/src/saturn/domain/text_ops.py"
                  ]
                },
                {
                  "id": "query",
                  "kind": "group",
                  "name": "Query stored output",
                  "does": "Query stored output",
                  "children": [
                    {
                      "id": "query_selector",
                      "name": "Exactly one selector",
                      "kind": "decision",
                      "test": "Exactly one of pattern, lines, or question is nonempty",
                      "branches": {
                        "valid": "saturn.service.tools.query.query_artifact",
                        "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "query_artifact",
                      "name": "Live artifact available",
                      "kind": "decision",
                      "test": "The artifact exists and has not expired",
                      "branches": {
                        "available": "saturn.service.evidence.artifacts.artifact_cached",
                        "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "query_mode",
                      "name": "Selected query mode",
                      "kind": "decision",
                      "test": "The selector is a regex, line range, or research question",
                      "branches": {
                        "pattern": "saturn.service.tools.query.query_regex",
                        "lines": "saturn.service.tools.query.query_range",
                        "otherwise": "saturn.service.tools.research.preparation.ask_enabled"
                      },
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "query_regex",
                      "name": "Prepare artifact regex matching",
                      "kind": "step",
                      "rules": [
                        "Up to 60 matches; context clamped to 0–4 lines.",
                        "Result budget: inline budget plus 300 tokens."
                      ],
                      "in": "artifact",
                      "out": "regex_request",
                      "does": "Prepare artifact regex matching",
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "query_range",
                      "name": "Valid artifact line range",
                      "kind": "decision",
                      "test": "The range parses and remains nonempty after clamping",
                      "branches": {
                        "valid": "saturn.service.tools.query.query_number",
                        "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "query_regex_reply",
                      "name": "Render bounded artifact matches",
                      "kind": "step",
                      "in": "search_result",
                      "out": "tool_result",
                      "does": "Render bounded artifact matches",
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "query_number",
                      "name": "Return numbered artifact lines",
                      "kind": "step",
                      "in": "artifact",
                      "out": "tool_result",
                      "does": "Return numbered artifact lines",
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/ask_service.py"
                },
                {
                  "id": "digest",
                  "kind": "group",
                  "name": "Code-first digest",
                  "does": "Code-first digest",
                  "children": [
                    {
                      "id": "deterministic",
                      "kind": "group",
                      "name": "Deterministic extraction",
                      "does": "Deterministic extraction",
                      "children": [
                        {
                          "id": "digest_parse",
                          "name": "Classify output and extract deterministic findings",
                          "kind": "step",
                          "rules": [
                            "Parsers cover pytest, diagnostic output, tracebacks, diffs, JSON, and logs."
                          ],
                          "in": "command_output",
                          "out": "digest",
                          "does": "Classify output and extract deterministic findings",
                          "code": [
                            "services/saturn/src/saturn/domain/digest.py",
                            "services/saturn/src/saturn/application/digest_service.py"
                          ]
                        },
                        {
                          "id": "digest_model",
                          "name": "Model enhancement requested",
                          "kind": "decision",
                          "test": "Model use is enabled and either a goal is supplied or code confidence is below 0.5",
                          "branches": {
                            "needed": "saturn.service.tools.digest.mapping.digest_condense",
                            "otherwise": "saturn.service.tools.digest.deterministic.digest_code"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/digest.py",
                            "services/saturn/src/saturn/application/digest_service.py"
                          ]
                        },
                        {
                          "id": "digest_code",
                          "name": "Render the code-only digest",
                          "kind": "step",
                          "rules": [
                            "Default digest budget: 450 estimated tokens."
                          ],
                          "in": "digest",
                          "out": "digest",
                          "does": "Render the code-only digest",
                          "code": [
                            "services/saturn/src/saturn/application/digest_service.py",
                            "services/saturn/src/saturn/domain/tokens.py"
                          ]
                        },
                        {
                          "id": "classifier",
                          "kind": "group",
                          "name": "Output classification",
                          "does": "Output classification",
                          "children": [
                            {
                              "id": "digest_kind",
                              "name": "Detected output format",
                              "kind": "decision",
                              "test": "The detector classifies the text by its signatures",
                              "branches": {
                                "pytest": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_pytest",
                                "diff": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_diff",
                                "traceback": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_traceback",
                                "lint": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_lint",
                                "diagnostics": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_diagnostics",
                                "json": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_json",
                                "log": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_log",
                                "otherwise": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic"
                              },
                              "code": "services/saturn/src/saturn/domain/digest.py"
                            },
                            {
                              "id": "parsers",
                              "kind": "group",
                              "name": "Format-specific extraction",
                              "does": "Format-specific extraction",
                              "children": [
                                {
                                  "id": "digest_pytest",
                                  "name": "Extract pytest failures",
                                  "kind": "step",
                                  "does": "Groups failed test names, assertion details, and the session summary.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_diff",
                                  "name": "Summarize a Git diff",
                                  "kind": "step",
                                  "does": "Counts changed files, added lines, and removed lines.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_traceback",
                                  "name": "Extract traceback frames",
                                  "kind": "step",
                                  "does": "Keeps the exception and the last relevant source frame.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_lint",
                                  "name": "Group coded lint findings",
                                  "kind": "step",
                                  "does": "Groups diagnostic codes and their representative source locations.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_diagnostics",
                                  "name": "Group compiler diagnostics",
                                  "kind": "step",
                                  "does": "Groups source locations, severities, and repeated diagnostic text.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_json",
                                  "name": "Summarize JSON shape",
                                  "kind": "step",
                                  "does": "Reports array size and sampled types, or at most 12 object keys.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_log",
                                  "name": "Rank log errors and warnings",
                                  "kind": "step",
                                  "does": "Counts log levels and ranks error and warning findings.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                },
                                {
                                  "id": "digest_generic",
                                  "name": "Rank generic findings and output tail",
                                  "kind": "step",
                                  "does": "Selects summaries, error-like lines, repeated templates, and a bounded output tail.",
                                  "in": "command_output",
                                  "out": "digest",
                                  "code": "services/saturn/src/saturn/domain/digest.py"
                                }
                              ],
                              "code": "services/saturn/src/saturn/domain/digest.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/domain/digest.py"
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/domain/digest.py",
                        "services/saturn/src/saturn/application/digest_service.py"
                      ]
                    },
                    {
                      "id": "mapping",
                      "kind": "group",
                      "name": "Ranked model excerpts",
                      "does": "Ranked model excerpts",
                      "children": [
                        {
                          "id": "digest_condense",
                          "name": "Deduplicate and rank source excerpts",
                          "kind": "step",
                          "rules": [
                            "At most 10 chunks of 1800 estimated tokens. Original line numbers and repeat counts are retained."
                          ],
                          "in": "command_output",
                          "out": "excerpt",
                          "does": "Deduplicate and rank source excerpts",
                          "code": [
                            "services/saturn/src/saturn/domain/condense.py",
                            "services/saturn/src/saturn/application/graphs/digest_graph.py"
                          ]
                        },
                        {
                          "id": "digest_chunks",
                          "name": "Excerpt chunks available",
                          "kind": "decision",
                          "test": "At least one ranked excerpt remains",
                          "branches": {
                            "chunks": "saturn.service.tools.digest.mapping.digest_map",
                            "otherwise": "saturn.service.tools.digest.reduction.digest_reduce"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/condense.py",
                            "services/saturn/src/saturn/application/graphs/digest_graph.py"
                          ]
                        },
                        {
                          "id": "digest_map",
                          "name": "Request at most six short facts per excerpt",
                          "kind": "step",
                          "rules": [
                            "Chunk requests allow 500 output tokens and 180 characters per claim."
                          ],
                          "in": "excerpt",
                          "out": "model_request",
                          "does": "Request at most six short facts per excerpt",
                          "code": [
                            "services/saturn/src/saturn/domain/condense.py",
                            "services/saturn/src/saturn/application/graphs/digest_graph.py"
                          ]
                        },
                        {
                          "id": "digest_fact",
                          "name": "Cited excerpt line exists",
                          "kind": "decision",
                          "test": "A returned fact has a known excerpt line and a nonempty claim",
                          "branches": {
                            "valid": "saturn.service.tools.digest.mapping.digest_accept",
                            "otherwise": "saturn.service.tools.digest.mapping.digest_reject"
                          },
                          "code": [
                            "services/saturn/src/saturn/domain/condense.py",
                            "services/saturn/src/saturn/application/graphs/digest_graph.py"
                          ]
                        },
                        {
                          "id": "digest_accept",
                          "name": "Keep the fact and its repeat count",
                          "kind": "step",
                          "in": "model_reply",
                          "out": "facts",
                          "does": "Keep the fact and its repeat count",
                          "code": [
                            "services/saturn/src/saturn/domain/condense.py",
                            "services/saturn/src/saturn/application/graphs/digest_graph.py"
                          ]
                        },
                        {
                          "id": "digest_reject",
                          "name": "Drop an unverifiable fact",
                          "kind": "step",
                          "in": "model_reply",
                          "out": "facts",
                          "does": "Drop an unverifiable fact",
                          "code": [
                            "services/saturn/src/saturn/domain/condense.py",
                            "services/saturn/src/saturn/application/graphs/digest_graph.py"
                          ]
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/domain/condense.py",
                        "services/saturn/src/saturn/application/graphs/digest_graph.py"
                      ]
                    },
                    {
                      "id": "reduction",
                      "kind": "group",
                      "name": "Validated digest result",
                      "does": "Validated digest result",
                      "children": [
                        {
                          "id": "digest_reduce",
                          "name": "Sort and deduplicate facts by source line",
                          "kind": "step",
                          "in": "facts",
                          "out": "facts",
                          "does": "Sort and deduplicate facts by source line",
                          "code": [
                            "services/saturn/src/saturn/application/graphs/digest_graph.py",
                            "services/saturn/src/saturn/application/digest_service.py"
                          ]
                        },
                        {
                          "id": "digest_fallback",
                          "name": "Keep deterministic findings and attach a model warning",
                          "kind": "step",
                          "in": "failure",
                          "out": "digest",
                          "does": "Keep deterministic findings and attach a model warning",
                          "code": [
                            "services/saturn/src/saturn/application/graphs/digest_graph.py",
                            "services/saturn/src/saturn/application/digest_service.py"
                          ]
                        },
                        {
                          "id": "digest_merge",
                          "name": "Merge new facts within the reply budget",
                          "kind": "step",
                          "in": [
                            "digest",
                            "facts"
                          ],
                          "out": "digest",
                          "does": "Merge new facts within the reply budget",
                          "code": [
                            "services/saturn/src/saturn/application/graphs/digest_graph.py",
                            "services/saturn/src/saturn/application/digest_service.py"
                          ]
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/application/graphs/digest_graph.py",
                        "services/saturn/src/saturn/application/digest_service.py"
                      ]
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/application/digest_service.py",
                    "services/saturn/src/saturn/domain/digest.py",
                    "services/saturn/src/saturn/domain/condense.py",
                    "services/saturn/src/saturn/application/graphs/digest_graph.py"
                  ]
                },
                {
                  "id": "research",
                  "kind": "group",
                  "name": "Bounded read-only research",
                  "does": "Bounded read-only research",
                  "children": [
                    {
                      "id": "preparation",
                      "kind": "group",
                      "name": "Research inputs",
                      "does": "Research inputs",
                      "children": [
                        {
                          "id": "ask_task",
                          "name": "Nonempty research task",
                          "kind": "decision",
                          "test": "The task contains non-whitespace text",
                          "branches": {
                            "valid": "saturn.service.tools.research.preparation.ask_enabled",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/ask_service.py"
                        },
                        {
                          "id": "ask_enabled",
                          "name": "Worker enabled",
                          "kind": "decision",
                          "test": "Model use is enabled in runtime settings",
                          "branches": {
                            "enabled": "saturn.service.tools.research.preparation.ask_seed",
                            "otherwise": "saturn.service.evidence.trace.tool_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/ask_service.py"
                        },
                        {
                          "id": "ask_seed",
                          "name": "Inspect at most three provided sources",
                          "kind": "step",
                          "rules": [
                            "Seeded observations do not spend model steps. A source can be a file, directory, or stored artifact."
                          ],
                          "in": "tool_call",
                          "out": "research",
                          "does": "Inspect at most three provided sources",
                          "code": "services/saturn/src/saturn/application/ask_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/ask_service.py"
                    },
                    {
                      "id": "loop",
                      "kind": "group",
                      "name": "Bounded action loop",
                      "does": "Bounded action loop",
                      "children": [
                        {
                          "id": "ask_finish_only",
                          "name": "Only Finish may be offered",
                          "kind": "decision",
                          "test": "The step budget is nearly exhausted, an action was repeated, or all given sources are already shown",
                          "branches": {
                            "finish_only": "saturn.service.tools.research.loop.ask_offer_finish",
                            "otherwise": "saturn.service.tools.research.loop.ask_offer_tools"
                          },
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_offer_finish",
                          "name": "Offer only the Finish schema",
                          "kind": "step",
                          "in": "research",
                          "out": "model_request",
                          "does": "Offer only the Finish schema",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_offer_tools",
                          "name": "Offer ListDir, ReadLines, Grep, and Finish",
                          "kind": "step",
                          "rules": [
                            "Six model steps. Scratchpad budget: 2600 estimated tokens. Graph recursion limit: 24."
                          ],
                          "in": "research",
                          "out": "model_request",
                          "does": "Offer ListDir, ReadLines, Grep, and Finish",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_action",
                          "name": "Research action",
                          "kind": "decision",
                          "test": "The parsed action or step limit determines the next operation",
                          "branches": {
                            "finish": "saturn.service.tools.research.answer.ask_verify",
                            "step_limit": "saturn.service.tools.research.answer.ask_unfinished",
                            "read": "saturn.service.tools.research.loop.ask_repeat",
                            "list": "saturn.service.tools.research.loop.ask_repeat",
                            "grep": "saturn.service.tools.research.loop.ask_repeat",
                            "otherwise": "saturn.service.tools.research.loop.ask_invalid"
                          },
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_invalid",
                          "name": "Record invalid model reply and spend a step",
                          "kind": "step",
                          "in": "failure",
                          "out": "research",
                          "does": "Record invalid model reply and spend a step",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_repeat",
                          "name": "Redundant observation",
                          "kind": "decision",
                          "test": "The same action was done before or the requested source was already shown in full",
                          "branches": {
                            "redundant": "saturn.service.tools.research.loop.ask_force_finish",
                            "otherwise": "saturn.service.tools.research.observations.ask_tool"
                          },
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_force_finish",
                          "name": "Record redundancy and require Finish next",
                          "kind": "step",
                          "in": "research",
                          "out": "research",
                          "does": "Record redundancy and require Finish next",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                    },
                    {
                      "id": "observations",
                      "kind": "group",
                      "name": "Read-only observations",
                      "does": "Read-only observations",
                      "children": [
                        {
                          "id": "ask_tool",
                          "name": "Read-only research operation",
                          "kind": "decision",
                          "test": "The selected action is directory listing, a line read, or search",
                          "branches": {
                            "listing": "saturn.service.tools.research.observations.ask_list",
                            "read": "saturn.service.tools.research.observations.ask_read",
                            "otherwise": "saturn.service.tools.research.observations.ask_grep"
                          },
                          "code": "services/saturn/src/saturn/application/agent_tools.py"
                        },
                        {
                          "id": "ask_list",
                          "name": "List at most 80 visible directory entries",
                          "kind": "step",
                          "in": "research",
                          "out": "observation",
                          "does": "List at most 80 visible directory entries",
                          "code": "services/saturn/src/saturn/application/agent_tools.py"
                        },
                        {
                          "id": "ask_read",
                          "name": "Read at most 120 lines of a file or artifact",
                          "kind": "step",
                          "in": "research",
                          "out": "observation",
                          "does": "Read at most 120 lines of a file or artifact",
                          "code": "services/saturn/src/saturn/application/agent_tools.py"
                        },
                        {
                          "id": "ask_grep",
                          "name": "Search with progressively broader patterns",
                          "kind": "step",
                          "rules": [
                            "At most 400 candidate files, three matches per file, and 40 displayed lines. Each observation is capped at 700 tokens."
                          ],
                          "in": "research",
                          "out": "observation",
                          "does": "Search with progressively broader patterns",
                          "code": "services/saturn/src/saturn/application/agent_tools.py"
                        },
                        {
                          "id": "ask_tool_error",
                          "name": "Record a tool error as an observation",
                          "kind": "step",
                          "in": "failure",
                          "out": "observation",
                          "does": "Record a tool error as an observation",
                          "code": "services/saturn/src/saturn/application/agent_tools.py"
                        },
                        {
                          "id": "ask_observe",
                          "name": "Append observation and action signature",
                          "kind": "step",
                          "in": "observation",
                          "out": "research",
                          "does": "Append observation and action signature",
                          "code": "services/saturn/src/saturn/application/agent_tools.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/agent_tools.py"
                    },
                    {
                      "id": "answer",
                      "kind": "group",
                      "name": "Answer and evidence",
                      "does": "Answer and evidence",
                      "children": [
                        {
                          "id": "ask_verify",
                          "name": "Evidence line exists",
                          "kind": "decision",
                          "test": "The cited source and line can be read",
                          "branches": {
                            "valid": "saturn.service.tools.research.answer.ask_keep",
                            "otherwise": "saturn.service.tools.research.answer.ask_drop"
                          },
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_keep",
                          "name": "Keep readable citations as review inputs",
                          "kind": "step",
                          "choice": "A second model review checks claim support",
                          "why": "The owner chose model review and omission of unsupported claims. Source-line existence alone is insufficient.",
                          "in": "evidence",
                          "out": "evidence",
                          "does": "Keep readable citations as review inputs",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_drop",
                          "name": "Drop the citation and count it as unverified",
                          "kind": "step",
                          "in": "evidence",
                          "out": "evidence",
                          "does": "Drop the citation and count it as unverified",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_unfinished",
                          "name": "Report exhausted steps and suggest a narrower task",
                          "kind": "step",
                          "in": "research",
                          "out": "tool_result",
                          "does": "Report exhausted steps and suggest a narrower task",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        },
                        {
                          "id": "ask_answer",
                          "name": "Return the masked answer and checked citations",
                          "kind": "step",
                          "rules": [
                            "Answer budget: 450 tokens plus a 150-token evidence allowance."
                          ],
                          "in": "evidence",
                          "out": "tool_result",
                          "does": "Return the masked answer and checked citations",
                          "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/graphs/agent_graph.py"
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/application/ask_service.py",
                    "services/saturn/src/saturn/application/graphs/agent_graph.py",
                    "services/saturn/src/saturn/application/agent_tools.py"
                  ]
                },
                {
                  "id": "support",
                  "kind": "group",
                  "name": "Claim support review",
                  "does": "Claim support review",
                  "children": [
                    {
                      "id": "support_prepare",
                      "name": "Build claim and evidence candidates",
                      "kind": "step",
                      "does": "Splits research answers at sentence and newline boundaries. Keeps each digest fact as one candidate. Assigns candidate and evidence indexes.",
                      "rules": [
                        "Research uses at most five cited locations. Each review source is capped at the existing 700-token observation budget.",
                        "Digest review uses the existing bounded excerpt. The model cannot change a candidate claim."
                      ],
                      "in": [
                        "evidence",
                        "facts"
                      ],
                      "out": "support_candidates",
                      "code": [
                        "services/saturn/src/saturn/application/graphs/support.py",
                        "services/saturn/src/saturn/application/graphs/agent_graph.py",
                        "services/saturn/src/saturn/application/graphs/digest_graph.py"
                      ]
                    },
                    {
                      "id": "support_ready",
                      "name": "Review has claims and source text",
                      "kind": "decision",
                      "test": "At least one candidate and readable cited source are available",
                      "branches": {
                        "ready": "saturn.service.tools.support.support_request",
                        "otherwise": "saturn.service.tools.support.validation.support_empty"
                      },
                      "code": [
                        "services/saturn/src/saturn/application/graphs/support.py",
                        "services/saturn/src/saturn/application/graphs/agent_graph.py",
                        "services/saturn/src/saturn/application/graphs/digest_graph.py"
                      ]
                    },
                    {
                      "id": "support_request",
                      "name": "Request one support review for the candidate batch",
                      "kind": "step",
                      "does": "Asks the worker to mark a candidate supported only when all its claims follow from the cited text. Treats source text as untrusted data.",
                      "in": "support_candidates",
                      "out": "model_request",
                      "code": [
                        "services/saturn/src/saturn/application/graphs/support.py",
                        "services/saturn/src/saturn/application/graphs/agent_graph.py",
                        "services/saturn/src/saturn/application/graphs/digest_graph.py"
                      ]
                    },
                    {
                      "id": "validation",
                      "kind": "group",
                      "name": "Review decisions",
                      "does": "Review decisions",
                      "children": [
                        {
                          "id": "support_valid",
                          "name": "Review verdict is usable",
                          "kind": "decision",
                          "test": "The verdict has a unique known candidate index and only known cited evidence indexes",
                          "branches": {
                            "valid": "saturn.service.tools.support.validation.support_supported",
                            "otherwise": "saturn.service.tools.support.validation.support_drop"
                          },
                          "code": "services/saturn/src/saturn/application/graphs/support.py"
                        },
                        {
                          "id": "support_supported",
                          "name": "Claim supported",
                          "kind": "decision",
                          "test": "The reviewer explicitly accepts the complete candidate and names at least one valid cited source",
                          "branches": {
                            "supported": "saturn.service.tools.support.validation.support_keep",
                            "otherwise": "saturn.service.tools.support.validation.support_drop"
                          },
                          "code": "services/saturn/src/saturn/application/graphs/support.py"
                        },
                        {
                          "id": "support_keep",
                          "name": "Keep original claim words and accepted citations",
                          "kind": "step",
                          "in": "support_review",
                          "out": "support_result",
                          "does": "Keep original claim words and accepted citations",
                          "code": "services/saturn/src/saturn/application/graphs/support.py"
                        },
                        {
                          "id": "support_drop",
                          "name": "Omit rejected, missing, duplicated, or invalid verdicts",
                          "kind": "step",
                          "in": "support_review",
                          "out": "support_result",
                          "does": "Omit rejected, missing, duplicated, or invalid verdicts",
                          "code": "services/saturn/src/saturn/application/graphs/support.py"
                        },
                        {
                          "id": "support_empty",
                          "name": "Return no model claims",
                          "kind": "step",
                          "does": "Omits all unreviewed claims when evidence is absent or the review is unavailable or malformed. Preserves deterministic digest findings.",
                          "in": [
                            "failure",
                            "support_candidates"
                          ],
                          "out": "support_result",
                          "code": "services/saturn/src/saturn/application/graphs/support.py"
                        },
                        {
                          "id": "support_result",
                          "name": "Return accepted claims and review outcome",
                          "kind": "step",
                          "does": "Reports omitted claims and review failures. Labels retained claims as model reviewed, without claiming proof of correctness.",
                          "in": "support_result",
                          "out": [
                            "evidence",
                            "facts"
                          ],
                          "code": "services/saturn/src/saturn/application/graphs/support.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/graphs/support.py"
                    }
                  ],
                  "choice": "Bounded support review with conservative omission",
                  "why": "The owner approved one review per answer or digest excerpt, omission after missing or failed review, and preservation of original claim text.",
                  "code": [
                    "services/saturn/src/saturn/application/graphs/support.py",
                    "services/saturn/src/saturn/application/graphs/agent_graph.py",
                    "services/saturn/src/saturn/application/graphs/digest_graph.py"
                  ]
                }
              ]
            },
            {
              "id": "model",
              "kind": "group",
              "name": "Model gateway and lifecycle",
              "does": "Model gateway and lifecycle",
              "children": [
                {
                  "id": "gateway",
                  "kind": "group",
                  "name": "Constrained model requests",
                  "does": "Constrained model requests",
                  "children": [
                    {
                      "id": "gateway_selected",
                      "name": "Worker model selected",
                      "kind": "decision",
                      "test": "The configured model id is nonempty",
                      "branches": {
                        "selected": "saturn.service.model.gateway.gateway_breaker",
                        "otherwise": "saturn.service.model.errors.model_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_breaker",
                      "name": "Circuit breaker open",
                      "kind": "decision",
                      "test": "The recent server-failure cooldown has not elapsed",
                      "branches": {
                        "cooling": "saturn.service.model.errors.model_failure (error)",
                        "otherwise": "saturn.service.model.lifecycle.model_idle_enabled"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_send",
                      "name": "Mask messages and send a required tool call",
                      "kind": "step",
                      "rules": [
                        "Responses API; temperature 0; store false; transport retries 0.",
                        "Default concurrency: one model request. Default timeout: 180 s."
                      ],
                      "in": "model_request",
                      "out": "model_request",
                      "does": "Mask messages and send a required tool call",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_transport",
                      "name": "Model transport outcome",
                      "kind": "decision",
                      "test": "The model request returns a reply or a transport error",
                      "branches": {
                        "reply": "saturn.service.model.gateway.gateway_parse",
                        "authentication": "saturn.service.model.errors.gateway_auth_error",
                        "timeout_or_connection": "saturn.service.model.errors.gateway_connection_error",
                        "otherwise": "saturn.service.model.errors.model_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_parse",
                      "name": "First returned tool call validates",
                      "kind": "decision",
                      "test": "The first tool call names an offered schema and its arguments pass Pydantic validation",
                      "branches": {
                        "valid": "saturn.service.model.gateway.gateway_result",
                        "otherwise": "saturn.service.model.gateway.gateway_retry"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_retry",
                      "name": "Schema correction attempt remains",
                      "kind": "decision",
                      "test": "Fewer than two schema-call attempts have run",
                      "branches": {
                        "retry": "saturn.service.model.gateway.gateway_correct",
                        "otherwise": "saturn.service.model.errors.model_invalid (error)"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_correct",
                      "name": "Append the rejection reason to the next request",
                      "kind": "step",
                      "in": "model_reply",
                      "out": "model_request",
                      "does": "Append the rejection reason to the next request",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_result",
                      "name": "Return the parsed model action",
                      "kind": "step",
                      "does": "Returns the validated first tool call. Additional returned tool calls are not executed.",
                      "in": "model_reply",
                      "out": "model_reply",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/infrastructure/llm.py"
                },
                {
                  "id": "errors",
                  "kind": "group",
                  "name": "Model failure handling",
                  "does": "Model failure handling",
                  "children": [
                    {
                      "id": "gateway_auth_error",
                      "name": "Open the breaker for 30 seconds",
                      "kind": "step",
                      "in": "failure",
                      "out": "failure",
                      "does": "Open the breaker for 30 seconds",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "gateway_connection_error",
                      "name": "Open the breaker for 10 seconds",
                      "kind": "step",
                      "in": "failure",
                      "out": "failure",
                      "does": "Open the breaker for 10 seconds",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "model_failure",
                      "name": "Report model unavailable",
                      "kind": "step",
                      "in": "failure",
                      "out": "failure",
                      "does": "Report model unavailable",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    },
                    {
                      "id": "model_invalid",
                      "name": "Report invalid structured output",
                      "kind": "step",
                      "in": "model_reply",
                      "out": "failure",
                      "does": "Report invalid structured output",
                      "code": "services/saturn/src/saturn/infrastructure/llm.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/infrastructure/llm.py"
                },
                {
                  "id": "lifecycle",
                  "kind": "group",
                  "name": "Owned model unloading",
                  "does": "Owned model unloading",
                  "children": [
                    {
                      "id": "model_idle_enabled",
                      "name": "Idle unloading enabled",
                      "kind": "decision",
                      "test": "The configured idle unload time is greater than zero",
                      "branches": {
                        "enabled": "saturn.service.model.lifecycle.model_ownership",
                        "otherwise": "saturn.service.model.lifecycle.model_leave"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "model_ownership",
                      "name": "Model was unloaded before Saturn used it",
                      "kind": "decision",
                      "test": "The model was not already owned, had no active calls, and was reported unloaded",
                      "branches": {
                        "claim": "saturn.service.model.lifecycle.model_claim",
                        "otherwise": "saturn.service.model.lifecycle.model_activity"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "model_claim",
                      "name": "Mark this model instance as Saturn-owned",
                      "kind": "step",
                      "in": "model_status",
                      "out": "lifecycle",
                      "does": "Mark this model instance as Saturn-owned",
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "model_activity",
                      "name": "Cancel idle timer and count active use",
                      "kind": "step",
                      "in": "lifecycle",
                      "out": "lifecycle",
                      "does": "Cancel idle timer and count active use",
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "model_leave",
                      "name": "Leave externally loaded or unmanaged models alone",
                      "kind": "step",
                      "stops": "The request continues without a new model-ownership claim.",
                      "in": "lifecycle",
                      "out": "lifecycle",
                      "does": "Leave externally loaded or unmanaged models alone",
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "model_last_call",
                      "name": "Last owned call completed",
                      "kind": "decision",
                      "test": "The model is Saturn-owned and its active-call count reaches zero",
                      "branches": {
                        "idle": "saturn.service.model.lifecycle.model_schedule",
                        "otherwise": "saturn.service.model.lifecycle.model_leave"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "model_schedule",
                      "name": "Schedule the owned model idle timer",
                      "kind": "step",
                      "rules": [
                        "Default idle delay: 120 s."
                      ],
                      "stops": "The timer waits until activity cancels it or its deadline arrives.",
                      "in": "lifecycle",
                      "out": "lifecycle",
                      "does": "Schedule the owned model idle timer",
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    },
                    {
                      "id": "idle",
                      "kind": "group",
                      "name": "Idle deadline and unloading",
                      "does": "Idle deadline and unloading",
                      "children": [
                        {
                          "id": "model_idle_tick",
                          "name": "Idle model deadline",
                          "kind": "event",
                          "trigger": "The owned model reaches its idle deadline",
                          "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                        },
                        {
                          "id": "model_still_idle",
                          "name": "Still owned and idle",
                          "kind": "decision",
                          "test": "No active call uses the model and Saturn still owns it",
                          "branches": {
                            "idle": "saturn.service.model.provider.provider_unload",
                            "otherwise": "saturn.service.model.lifecycle.model_leave"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                        },
                        {
                          "id": "model_unloaded",
                          "name": "Provider unload succeeded",
                          "kind": "decision",
                          "test": "The provider reports a successful unload",
                          "branches": {
                            "success": "saturn.service.model.lifecycle.idle.model_forget",
                            "otherwise": "saturn.service.model.lifecycle.model_schedule"
                          },
                          "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                        },
                        {
                          "id": "model_forget",
                          "name": "Clear ownership and record unloading",
                          "kind": "step",
                          "in": "lifecycle",
                          "out": "audit_event",
                          "does": "Clear ownership and record unloading",
                          "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/infrastructure/model_lifecycle.py"
                },
                {
                  "id": "provider",
                  "kind": "group",
                  "name": "Local provider adapter",
                  "does": "Local provider adapter",
                  "children": [
                    {
                      "id": "provider_cache",
                      "name": "Fresh provider snapshot",
                      "kind": "decision",
                      "test": "The cached provider and URL match and the snapshot is young enough",
                      "branches": {
                        "cached": "saturn.service.model.provider.provider_reply",
                        "otherwise": "saturn.service.model.provider.provider_select"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    },
                    {
                      "id": "provider_select",
                      "name": "Configured model provider",
                      "kind": "decision",
                      "test": "The provider is LM Studio, Ollama, or another local compatible server",
                      "branches": {
                        "lmstudio": "saturn.service.model.provider.provider_lmstudio",
                        "ollama": "saturn.service.model.provider.provider_ollama",
                        "otherwise": "saturn.service.model.provider.provider_openai"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    },
                    {
                      "id": "provider_lmstudio",
                      "name": "Read LM Studio model state",
                      "kind": "step",
                      "rules": [
                        "Model listing uses /api/v0/models. Unload uses POST /api/v1/models/unload."
                      ],
                      "in": "settings",
                      "out": "model_status",
                      "does": "Read LM Studio model state",
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    },
                    {
                      "id": "provider_ollama",
                      "name": "Read Ollama available and loaded models",
                      "kind": "step",
                      "rules": [
                        "Listing uses /api/tags and /api/ps. Unload uses /api/generate with keep_alive 0."
                      ],
                      "choice": "Ollama connection verified independently of model quality",
                      "why": "Ollama 0.40.12 with qwen3:1.7b passed discovery, a Responses tool call, loaded-state tracking, and keep_alive 0 unloading. The owner confirmed connection verification as the scope; small-model quality is a separate diagnostic.",
                      "in": "settings",
                      "out": "model_status",
                      "does": "Read Ollama available and loaded models",
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    },
                    {
                      "id": "provider_openai",
                      "name": "Read compatible /v1/models listing",
                      "kind": "step",
                      "rules": [
                        "Loaded state is unknown and unloading is unsupported for this provider."
                      ],
                      "in": "settings",
                      "out": "model_status",
                      "does": "Read compatible /v1/models listing",
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    },
                    {
                      "id": "provider_reply",
                      "name": "Return reachability, authorization, models, and latency",
                      "kind": "step",
                      "in": "model_status",
                      "out": "model_status",
                      "does": "Return reachability, authorization, models, and latency",
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    },
                    {
                      "id": "provider_unload",
                      "name": "Send the provider-specific unload request",
                      "kind": "step",
                      "in": "lifecycle",
                      "out": "model_status",
                      "does": "Send the provider-specific unload request",
                      "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/infrastructure/local_server.py"
                }
              ],
              "code": [
                "services/saturn/src/saturn/infrastructure/llm.py",
                "services/saturn/src/saturn/infrastructure/model_lifecycle.py",
                "services/saturn/src/saturn/infrastructure/local_server.py"
              ]
            },
            {
              "id": "control",
              "kind": "group",
              "name": "Local administration",
              "does": "Local administration",
              "children": [
                {
                  "id": "owner",
                  "kind": "group",
                  "name": "Local owner boundary",
                  "does": "Local owner boundary",
                  "children": [
                    {
                      "id": "owner_peer",
                      "name": "Loopback owner request",
                      "kind": "decision",
                      "test": "The caller peer is a loopback address",
                      "branches": {
                        "local": "saturn.service.control.owner.owner_origin",
                        "otherwise": "saturn.service.control.owner.owner_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/transport/access_api.py"
                    },
                    {
                      "id": "owner_origin",
                      "name": "Same-origin management",
                      "kind": "decision",
                      "test": "Origin matches the request scheme and Host and fetch-site is not cross-site",
                      "branches": {
                        "same": "saturn.service.control.owner.owner_method",
                        "otherwise": "saturn.service.control.owner.owner_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/transport/access_api.py"
                    },
                    {
                      "id": "owner_method",
                      "name": "Management write",
                      "kind": "decision",
                      "test": "The method changes local access",
                      "branches": {
                        "write": "saturn.service.control.owner.owner_headers",
                        "otherwise": "saturn.service.control.owner.owner_dispatch"
                      },
                      "code": "services/saturn/src/saturn/transport/access_api.py"
                    },
                    {
                      "id": "owner_headers",
                      "name": "Management write headers",
                      "kind": "decision",
                      "test": "X-Client is web and mutation bodies use application/json",
                      "branches": {
                        "valid": "saturn.service.control.owner.owner_dispatch",
                        "otherwise": "saturn.service.control.owner.owner_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/transport/access_api.py"
                    },
                    {
                      "id": "owner_dispatch",
                      "name": "Owner access operation",
                      "kind": "decision",
                      "test": "The owner requests lifecycle, installation, or a read projection",
                      "branches": {
                        "create": "saturn.service.control.access.creation.access_valid",
                        "edit": "saturn.service.control.access.mutations.access_existing",
                        "rotate": "saturn.service.control.access.mutations.access_active",
                        "enable_or_disable": "saturn.service.control.access.mutations.access_active",
                        "revoke": "saturn.service.control.access.revocation.access_revoke",
                        "install": "saturn.service.control.connect.preview.connect_plan",
                        "otherwise": "saturn.service.control.api.reads.api_projection"
                      },
                      "code": "services/saturn/src/saturn/transport/access_api.py"
                    },
                    {
                      "id": "owner_failure",
                      "name": "Return a bounded owner-API error",
                      "kind": "step",
                      "in": "owner_request",
                      "out": "failure",
                      "does": "Return a bounded owner-API error",
                      "code": "services/saturn/src/saturn/transport/access_api.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/transport/access_api.py"
                },
                {
                  "id": "access",
                  "kind": "group",
                  "name": "Harness lifecycle",
                  "does": "Harness lifecycle",
                  "children": [
                    {
                      "id": "creation",
                      "kind": "group",
                      "name": "Harness creation",
                      "does": "Harness creation",
                      "children": [
                        {
                          "id": "access_valid",
                          "name": "Harness fields validate",
                          "kind": "decision",
                          "test": "Name, tools, future expiry, absolute folders, and denied patterns are valid",
                          "branches": {
                            "valid": "saturn.service.control.access.creation.access_handle",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_handle",
                          "name": "Usable unique handle",
                          "kind": "decision",
                          "test": "The requested or suggested handle has the supported syntax and is unused",
                          "branches": {
                            "valid": "saturn.service.control.access.creation.access_create",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_create",
                          "name": "Generate token and persist its digest and harness",
                          "kind": "step",
                          "rules": [
                            "Name: 1–80 characters. Handle: 1–40 lowercase letters, digits, and hyphens.",
                            "At most 20 folders and 50 denied command patterns."
                          ],
                          "in": "owner_request",
                          "out": [
                            "harness",
                            "harness_record",
                            "credential"
                          ],
                          "does": "Generate token and persist its digest and harness",
                          "code": [
                            "services/saturn/src/saturn/application/access_service.py",
                            "services/saturn/src/saturn/domain/access.py",
                            "services/saturn/src/saturn/infrastructure/access_store.py"
                          ]
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/access_service.py"
                    },
                    {
                      "id": "mutations",
                      "kind": "group",
                      "name": "Harness state changes",
                      "does": "Harness state changes",
                      "children": [
                        {
                          "id": "access_existing",
                          "name": "Existing harness",
                          "kind": "decision",
                          "test": "The requested harness exists",
                          "branches": {
                            "exists": "saturn.service.control.access.mutations.access_active",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_active",
                          "name": "Revoked access check",
                          "kind": "decision",
                          "test": "The existing harness has not been revoked",
                          "branches": {
                            "active": "saturn.service.control.access.mutations.access_operation",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_operation",
                          "name": "Harness mutation",
                          "kind": "decision",
                          "test": "The requested operation is edit, rotation, or enabled-state change",
                          "branches": {
                            "edit": "saturn.service.control.access.mutations.access_edit",
                            "rotate": "saturn.service.control.access.mutations.access_rotate",
                            "otherwise": "saturn.service.control.access.mutations.access_enable"
                          },
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_edit",
                          "name": "Validate and persist changed harness fields",
                          "kind": "step",
                          "in": "owner_request",
                          "out": "harness_record",
                          "does": "Validate and persist changed harness fields",
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_rotate",
                          "name": "Replace token digest and local credential",
                          "kind": "step",
                          "does": "Generates a replacement token and updates its digest and credential file under the access-service lock.",
                          "in": "owner_request",
                          "out": [
                            "harness_record",
                            "credential"
                          ],
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_enable",
                          "name": "Persist enabled or disabled state",
                          "kind": "step",
                          "in": "owner_request",
                          "out": "harness_record",
                          "does": "Persist enabled or disabled state",
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/access_service.py"
                    },
                    {
                      "id": "revocation",
                      "kind": "group",
                      "name": "Access revocation",
                      "does": "Access revocation",
                      "children": [
                        {
                          "id": "access_revoke",
                          "name": "Already revoked",
                          "kind": "decision",
                          "test": "The harness is already revoked",
                          "branches": {
                            "already": "saturn.service.control.access.revocation.access_view",
                            "otherwise": "saturn.service.control.access.revocation.access_mark_revoked"
                          },
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_mark_revoked",
                          "name": "Disable access, mark revocation, and delete token file",
                          "kind": "step",
                          "in": "owner_request",
                          "out": "harness_record",
                          "does": "Disable access, mark revocation, and delete token file",
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        },
                        {
                          "id": "access_view",
                          "name": "Return nonsecret harness metadata",
                          "kind": "step",
                          "in": "harness_record",
                          "out": "dashboard_page",
                          "does": "Return nonsecret harness metadata",
                          "code": "services/saturn/src/saturn/application/access_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/access_service.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/access_service.py"
                },
                {
                  "id": "connect",
                  "kind": "group",
                  "name": "Client registration",
                  "does": "Client registration",
                  "children": [
                    {
                      "id": "preview",
                      "kind": "group",
                      "name": "Managed entry preview",
                      "does": "Managed entry preview",
                      "children": [
                        {
                          "id": "connect_plan",
                          "name": "Build a registration and removal preview",
                          "kind": "step",
                          "does": "Builds managed entries for the selected harness, tools, permission preset, and optional hooks.",
                          "in": "owner_request",
                          "out": "install_plan",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/claude.py",
                            "services/saturn/src/saturn/infrastructure/clients/codex.py"
                          ]
                        },
                        {
                          "id": "connect_existing",
                          "name": "Existing harness usable",
                          "kind": "decision",
                          "test": "The named harness is absent or is enabled and non-revoked",
                          "branches": {
                            "usable": "saturn.service.control.connect.preview.connect_client",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/claude.py",
                            "services/saturn/src/saturn/infrastructure/clients/codex.py"
                          ]
                        },
                        {
                          "id": "connect_client",
                          "name": "Client writer",
                          "kind": "decision",
                          "test": "The selected client is Claude Code or Codex",
                          "branches": {
                            "claude": "saturn.service.control.connect.preview.connect_claude",
                            "codex": "saturn.service.control.connect.preview.connect_codex",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/claude.py",
                            "services/saturn/src/saturn/infrastructure/clients/codex.py"
                          ]
                        },
                        {
                          "id": "connect_claude",
                          "name": "Plan Claude registration, approvals, and shell hooks",
                          "kind": "step",
                          "rules": [
                            "JSON equality ignores formatting. Unrelated configuration keys remain unchanged.",
                            "Standard preapproves read tools; hands-off preapproves all Saturn tools."
                          ],
                          "in": "install_plan",
                          "out": "client_entries",
                          "does": "Plan Claude registration, approvals, and shell hooks",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/claude.py",
                            "services/saturn/src/saturn/infrastructure/clients/codex.py"
                          ]
                        },
                        {
                          "id": "connect_codex",
                          "name": "Codex registration conflict",
                          "kind": "decision",
                          "test": "The file has no unmanaged Saturn block and is valid TOML",
                          "branches": {
                            "valid": "saturn.service.control.connect.preview.connect_codex_block",
                            "otherwise": "saturn.service.control.owner.owner_failure (error)"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/claude.py",
                            "services/saturn/src/saturn/infrastructure/clients/codex.py"
                          ]
                        },
                        {
                          "id": "connect_codex_block",
                          "name": "Plan the managed Codex registration block",
                          "kind": "step",
                          "rules": [
                            "Startup timeout 60 s; tool timeout 330 s.",
                            "Standard uses writes; hands-off uses approve."
                          ],
                          "choice": "Client permission mode controls confirmation",
                          "why": "The owner verified prompts in manual mode and no prompts in full-permission mode for both clients. An isolated interface-table relocation preserved all parsed settings. Four fixture cases retained unrelated settings through reconnect and removal. The live layout repair preserved all parsed values and file mode; doctor confirmed both client registrations match.",
                          "in": "install_plan",
                          "out": "client_entries",
                          "does": "Plan the managed Codex registration block",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/claude.py",
                            "services/saturn/src/saturn/infrastructure/clients/codex.py"
                          ]
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/application/connect_service.py",
                        "services/saturn/src/saturn/infrastructure/clients/claude.py",
                        "services/saturn/src/saturn/infrastructure/clients/codex.py"
                      ]
                    },
                    {
                      "id": "application",
                      "kind": "group",
                      "name": "Confirmed installation",
                      "does": "Confirmed installation",
                      "children": [
                        {
                          "id": "connect_apply",
                          "name": "Explicit installation confirmation",
                          "kind": "decision",
                          "test": "The caller asks to apply the previewed changes",
                          "branches": {
                            "apply": "saturn.service.control.connect.application.connect_create_harness",
                            "otherwise": "saturn.service.control.connect.application.connect_preview"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_preview",
                          "name": "Return preview without writing client files",
                          "kind": "step",
                          "in": "client_entries",
                          "out": "dashboard_page",
                          "does": "Return preview without writing client files",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_create_harness",
                          "name": "New harness needed",
                          "kind": "decision",
                          "test": "The installation plan has no existing harness",
                          "branches": {
                            "create": "saturn.service.control.access.creation.access_create",
                            "otherwise": "saturn.service.control.connect.application.files.connect_fresh"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "files",
                          "kind": "group",
                          "name": "Client file transaction",
                          "does": "Client file transaction",
                          "children": [
                            {
                              "id": "connect_fresh",
                              "name": "Preview still current",
                              "kind": "decision",
                              "test": "Every target still matches the preview before any file is written",
                              "branches": {
                                "current": "saturn.service.control.connect.application.files.connect_backup",
                                "otherwise": "saturn.service.control.connect.recovery.connect_restore"
                              },
                              "code": "services/saturn/src/saturn/infrastructure/clients/files.py"
                            },
                            {
                              "id": "connect_backup",
                              "name": "Back up and write the managed client changes",
                              "kind": "step",
                              "in": "client_entries",
                              "out": "install_record",
                              "does": "Back up and write the managed client changes",
                              "code": "services/saturn/src/saturn/infrastructure/clients/files.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/infrastructure/clients/files.py"
                        },
                        {
                          "id": "persistence",
                          "kind": "group",
                          "name": "Installation commit",
                          "does": "Installation commit",
                          "children": [
                            {
                              "id": "connect_validate",
                              "name": "Planned file operations completed",
                              "kind": "decision",
                              "test": "Every planned file replacement succeeds",
                              "branches": {
                                "valid": "saturn.service.control.connect.application.persistence.connect_record",
                                "otherwise": "saturn.service.control.connect.recovery.connect_restore"
                              },
                              "code": "services/saturn/src/saturn/application/connect_service.py"
                            },
                            {
                              "id": "connect_record",
                              "name": "Persist installation record",
                              "kind": "step",
                              "in": "install_record",
                              "out": "install_record",
                              "does": "Persist installation record",
                              "code": "services/saturn/src/saturn/application/connect_service.py"
                            },
                            {
                              "id": "connect_saved",
                              "name": "Installation record saved",
                              "kind": "decision",
                              "test": "The installation record is saved successfully",
                              "branches": {
                                "saved": "saturn.service.control.connect.application.persistence.connect_audit",
                                "otherwise": "saturn.service.control.connect.recovery.connect_restore"
                              },
                              "code": "services/saturn/src/saturn/application/connect_service.py"
                            },
                            {
                              "id": "connect_audit",
                              "name": "Record successful installation audit event",
                              "kind": "step",
                              "failure": "An audit failure reports that registration was saved; it does not claim registration was rolled back.",
                              "in": "install_record",
                              "out": "install_record",
                              "does": "Record successful installation audit event",
                              "code": "services/saturn/src/saturn/application/connect_service.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/application/connect_service.py"
                        }
                      ],
                      "code": [
                        "services/saturn/src/saturn/application/connect_service.py",
                        "services/saturn/src/saturn/infrastructure/clients/files.py"
                      ]
                    },
                    {
                      "id": "recovery",
                      "kind": "group",
                      "name": "Installation failure recovery",
                      "does": "Installation failure recovery",
                      "children": [
                        {
                          "id": "connect_restore",
                          "name": "Restore changed files in reverse order",
                          "kind": "step",
                          "does": "Restores original bytes and permissions for existing files and removes files created by the failed attempt. Retains backups and attempts every restoration.",
                          "rules": [
                            "Covers ordinary application errors; no crash or power-loss transaction guarantee.",
                            "Detect a changed preview before any write. Serialize each installation attempt."
                          ],
                          "in": "failure",
                          "out": "failure",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_restored",
                          "name": "Every file restored",
                          "kind": "decision",
                          "test": "All attempted file restorations completed",
                          "branches": {
                            "restored": "saturn.service.control.connect.recovery.connect_recovery_ok",
                            "otherwise": "saturn.service.control.connect.recovery.connect_recovery_partial"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_recovery_ok",
                          "name": "Retain original failure with completed recovery",
                          "kind": "step",
                          "in": "failure",
                          "out": "failure",
                          "does": "Retain original failure with completed recovery",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_recovery_partial",
                          "name": "Add failed paths and backup locations to the failure",
                          "kind": "step",
                          "in": "failure",
                          "out": "failure",
                          "does": "Add failed paths and backup locations to the failure",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_revoke_new",
                          "name": "Harness created by failed installation",
                          "kind": "decision",
                          "test": "This attempt created a new harness",
                          "branches": {
                            "created": "saturn.service.control.connect.recovery.connect_revoke_attempt",
                            "otherwise": "saturn.service.control.connect.recovery.connect_recovery_report"
                          },
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_revoke_attempt",
                          "name": "Revoke the new harness and remove its credential",
                          "kind": "step",
                          "failure": "Adds revocation errors to the recovery failure; keeps the original installation error.",
                          "in": "failure",
                          "out": "failure",
                          "does": "Revoke the new harness and remove its credential",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        },
                        {
                          "id": "connect_recovery_report",
                          "name": "Report original failure and recovery outcome",
                          "kind": "step",
                          "in": "failure",
                          "out": "failure",
                          "does": "Report original failure and recovery outcome",
                          "code": [
                            "services/saturn/src/saturn/application/connect_service.py",
                            "services/saturn/src/saturn/infrastructure/clients/files.py"
                          ]
                        }
                      ],
                      "choice": "Restore files and revoke only access created by the failed attempt",
                      "why": "The owner approved application-error recovery while retaining backups and reporting every recovery error.",
                      "code": [
                        "services/saturn/src/saturn/application/connect_service.py",
                        "services/saturn/src/saturn/infrastructure/clients/files.py"
                      ]
                    },
                    {
                      "id": "removal",
                      "kind": "group",
                      "name": "Reversible client removal",
                      "does": "Reversible client removal",
                      "children": [
                        {
                          "id": "connect_remove",
                          "name": "Remove only Saturn-managed entries and the install record",
                          "kind": "step",
                          "in": "owner_request",
                          "out": "install_record",
                          "does": "Remove only Saturn-managed entries and the install record",
                          "code": "services/saturn/src/saturn/application/connect_service.py"
                        },
                        {
                          "id": "connect_remove_revoke",
                          "name": "Revoke after removal",
                          "kind": "decision",
                          "test": "The owner requested removal with revocation",
                          "branches": {
                            "revoke": "saturn.service.control.access.revocation.access_mark_revoked",
                            "otherwise": "saturn.service.control.connect.removal.connect_removed"
                          },
                          "code": "services/saturn/src/saturn/application/connect_service.py"
                        },
                        {
                          "id": "connect_removed",
                          "name": "Return removal result and retained backup paths",
                          "kind": "step",
                          "in": "install_record",
                          "out": "dashboard_page",
                          "does": "Return removal result and retained backup paths",
                          "code": "services/saturn/src/saturn/application/connect_service.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/application/connect_service.py"
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/application/connect_service.py",
                    "services/saturn/src/saturn/infrastructure/clients/claude.py",
                    "services/saturn/src/saturn/infrastructure/clients/codex.py",
                    "services/saturn/src/saturn/infrastructure/clients/files.py"
                  ]
                },
                {
                  "id": "settings",
                  "kind": "group",
                  "name": "Live configuration",
                  "does": "Live configuration",
                  "children": [
                    {
                      "id": "settings_stamp",
                      "name": "Read settings and policy file stamps",
                      "kind": "step",
                      "in": "owner_request",
                      "out": "config_stamp",
                      "does": "Read settings and policy file stamps",
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    },
                    {
                      "id": "settings_changed",
                      "name": "File changed",
                      "kind": "decision",
                      "test": "mtime and size differ from the last observed stamp",
                      "branches": {
                        "changed": "saturn.service.control.settings.settings_read",
                        "otherwise": "saturn.service.control.settings.settings_current"
                      },
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    },
                    {
                      "id": "settings_read",
                      "name": "Parse changed settings and command policy",
                      "kind": "step",
                      "in": [
                        "settings",
                        "policy"
                      ],
                      "out": [
                        "settings",
                        "policy"
                      ],
                      "does": "Parse changed settings and command policy",
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    },
                    {
                      "id": "settings_valid",
                      "name": "Configuration validates",
                      "kind": "decision",
                      "test": "Known keys, types, supported enums, local URL, limits, and policy patterns all validate",
                      "branches": {
                        "valid": "saturn.service.control.settings.settings_apply",
                        "otherwise": "saturn.service.control.settings.settings_keep"
                      },
                      "code": [
                        "services/saturn/src/saturn/application/tunables.py",
                        "services/saturn/src/saturn/domain/addresses.py",
                        "services/saturn/src/saturn/infrastructure/config_files.py"
                      ]
                    },
                    {
                      "id": "settings_keep",
                      "name": "Retain the last good configuration and expose the error",
                      "kind": "step",
                      "in": "failure",
                      "out": "dashboard_page",
                      "does": "Retain the last good configuration and expose the error",
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    },
                    {
                      "id": "settings_apply",
                      "name": "Swap valid runtime settings and record the change",
                      "kind": "step",
                      "in": [
                        "settings",
                        "policy"
                      ],
                      "out": "audit_event",
                      "does": "Swap valid runtime settings and record the change",
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    },
                    {
                      "id": "settings_current",
                      "name": "Continue with the current configuration",
                      "kind": "step",
                      "in": [
                        "settings",
                        "policy"
                      ],
                      "out": "tool_call",
                      "does": "Continue with the current configuration",
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    },
                    {
                      "id": "settings_save",
                      "name": "Validate and save owner settings or policy changes",
                      "kind": "step",
                      "rules": [
                        "Settings and policy take effect on the next relevant call. Startup environment changes require a restart."
                      ],
                      "in": "owner_request",
                      "out": [
                        "settings",
                        "policy"
                      ],
                      "does": "Validate and save owner settings or policy changes",
                      "code": "services/saturn/src/saturn/application/live_config.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/live_config.py"
                },
                {
                  "id": "api",
                  "kind": "group",
                  "name": "Dashboard projections",
                  "does": "Dashboard projections",
                  "children": [
                    {
                      "id": "api_operation",
                      "name": "Local JSON operation",
                      "kind": "decision",
                      "test": "The request selects settings, model test, policy simulation, or a read projection",
                      "branches": {
                        "settings": "saturn.service.control.api.api_settings_origin",
                        "model_test": "saturn.service.control.api.api_settings_origin",
                        "policy_test": "saturn.service.control.api.api_policy_test",
                        "otherwise": "saturn.service.control.api.reads.api_projection"
                      },
                      "code": "services/saturn/src/saturn/transport/http_api.py"
                    },
                    {
                      "id": "api_settings_origin",
                      "name": "Settings write origin",
                      "kind": "decision",
                      "test": "Origin is absent or its authority matches Host",
                      "branches": {
                        "same": "saturn.service.control.api.api_settings_action",
                        "otherwise": "saturn.service.control.owner.owner_failure (error)"
                      },
                      "code": "services/saturn/src/saturn/transport/http_api.py"
                    },
                    {
                      "id": "api_settings_action",
                      "name": "Settings action",
                      "kind": "decision",
                      "test": "The operation is a settings save or a model test",
                      "branches": {
                        "save": "saturn.service.control.settings.settings_save",
                        "otherwise": "saturn.service.control.api.api_model_test"
                      },
                      "code": "services/saturn/src/saturn/transport/http_api.py"
                    },
                    {
                      "id": "api_model_test",
                      "name": "Reset the model breaker and request one test tool call",
                      "kind": "step",
                      "code": "services/saturn/src/saturn/application/model_check.py",
                      "in": "owner_request",
                      "out": "model_request",
                      "does": "Reset the model breaker and request one test tool call"
                    },
                    {
                      "id": "api_policy_test",
                      "name": "Evaluate policy without executing a command",
                      "kind": "step",
                      "in": "owner_request",
                      "out": "dashboard_page",
                      "does": "Evaluate policy without executing a command",
                      "code": "services/saturn/src/saturn/transport/http_api.py"
                    },
                    {
                      "id": "reads",
                      "kind": "group",
                      "name": "Read projections",
                      "does": "Read projections",
                      "children": [
                        {
                          "id": "api_projection",
                          "name": "Projection type",
                          "kind": "decision",
                          "test": "The requested projection is health, readiness, overview, runs, payloads, artifacts, events, settings, or connections",
                          "branches": {
                            "health": "saturn.service.control.api.reads.api_health",
                            "readiness": "saturn.service.control.api.reads.api_ready",
                            "overview": "saturn.service.control.api.pages.api_etag",
                            "otherwise": "saturn.service.control.api.pages.api_page"
                          },
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_health",
                          "name": "Return process liveness",
                          "kind": "step",
                          "in": "owner_request",
                          "out": "dashboard_page",
                          "does": "Return process liveness",
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_ready",
                          "name": "Worker usable or unselected",
                          "kind": "decision",
                          "test": "The store works and either the worker is usable or no worker is selected",
                          "branches": {
                            "ready": "saturn.service.control.api.reads.api_health",
                            "otherwise": "saturn.service.control.api.reads.api_degraded"
                          },
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_degraded",
                          "name": "Report degraded model readiness",
                          "kind": "step",
                          "does": "Reports the model-server problem separately from store readiness. Code-only tools can continue.",
                          "in": "model_status",
                          "out": "dashboard_page",
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/transport/http_api.py"
                    },
                    {
                      "id": "pages",
                      "kind": "group",
                      "name": "Bounded page reads",
                      "does": "Bounded page reads",
                      "children": [
                        {
                          "id": "api_etag",
                          "name": "Overview ETag matches",
                          "kind": "decision",
                          "test": "If-None-Match matches the current store fingerprint and time bucket",
                          "branches": {
                            "unchanged": "saturn.service.control.api.pages.api_not_modified",
                            "otherwise": "saturn.service.control.api.pages.api_page"
                          },
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_not_modified",
                          "name": "Return HTTP 304",
                          "kind": "step",
                          "in": "dashboard_page",
                          "out": "dashboard_page",
                          "does": "Return HTTP 304",
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_page",
                          "name": "Projection inputs and record available",
                          "kind": "decision",
                          "test": "Window, filter, pagination, and requested record are valid",
                          "branches": {
                            "valid": "saturn.service.control.api.pages.api_render",
                            "otherwise": "saturn.service.control.api.pages.api_missing"
                          },
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_missing",
                          "name": "Return HTTP 400 or 404 for the projection",
                          "kind": "step",
                          "in": "owner_request",
                          "out": "failure",
                          "does": "Return HTTP 400 or 404 for the projection",
                          "code": "services/saturn/src/saturn/transport/http_api.py"
                        },
                        {
                          "id": "api_render",
                          "name": "Project bounded run, artifact, access, and usage data",
                          "kind": "step",
                          "rules": [
                            "Runs and events: 1–200 per page. Artifacts: 1–500. Artifact chunks: 1–400 lines."
                          ],
                          "in": [
                            "run",
                            "artifact",
                            "harness_record",
                            "audit_event",
                            "settings",
                            "policy"
                          ],
                          "out": "dashboard_page",
                          "does": "Project bounded run, artifact, access, and usage data",
                          "code": [
                            "services/saturn/src/saturn/transport/http_api.py",
                            "services/saturn/src/saturn/infrastructure/metrics_queries.py",
                            "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                          ]
                        }
                      ],
                      "code": "services/saturn/src/saturn/transport/http_api.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/transport/http_api.py"
                }
              ],
              "code": [
                "services/saturn/src/saturn/transport/http_api.py",
                "services/saturn/src/saturn/transport/access_api.py",
                "services/saturn/src/saturn/application/access_service.py",
                "services/saturn/src/saturn/application/connect_service.py"
              ]
            },
            {
              "id": "evidence",
              "kind": "group",
              "name": "Traces and bounded storage",
              "does": "Traces and bounded storage",
              "children": [
                {
                  "id": "trace",
                  "kind": "group",
                  "name": "Request and response recording",
                  "does": "Request and response recording",
                  "children": [
                    {
                      "id": "trace_start",
                      "name": "Create a run and masked request payload",
                      "kind": "step",
                      "in": [
                        "tool_call",
                        "caller"
                      ],
                      "out": [
                        "tool_call",
                        "run",
                        "payload",
                        "span"
                      ],
                      "does": "Create a run and masked request payload",
                      "code": [
                        "services/saturn/src/saturn/application/recorder.py",
                        "services/saturn/src/saturn/domain/models.py"
                      ]
                    },
                    {
                      "id": "trace_finish",
                      "name": "Finalize run status and counters",
                      "kind": "step",
                      "in": "tool_result",
                      "out": [
                        "tool_result",
                        "run"
                      ],
                      "does": "Finalize run status and counters",
                      "code": "services/saturn/src/saturn/application/recorder.py"
                    },
                    {
                      "id": "trace_response",
                      "name": "Store the masked full response and return it",
                      "kind": "step",
                      "in": "tool_result",
                      "out": [
                        "tool_result",
                        "payload"
                      ],
                      "does": "Store the masked full response and return it",
                      "code": "services/saturn/src/saturn/application/recorder.py"
                    },
                    {
                      "id": "tool_failure",
                      "name": "Shape a tool error and record its outcome",
                      "kind": "step",
                      "in": "failure",
                      "out": "tool_result",
                      "does": "Shape a tool error and record its outcome",
                      "code": [
                        "services/saturn/src/saturn/domain/errors.py",
                        "services/saturn/src/saturn/transport/mcp_server.py"
                      ]
                    },
                    {
                      "id": "trace_model",
                      "name": "Record model previews, usage, and full payloads",
                      "kind": "step",
                      "code": "services/saturn/src/saturn/infrastructure/tracing.py",
                      "in": [
                        "model_request",
                        "model_reply"
                      ],
                      "out": [
                        "model_call",
                        "payload",
                        "span"
                      ],
                      "does": "Record model previews, usage, and full payloads"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/recorder.py"
                },
                {
                  "id": "artifacts",
                  "kind": "group",
                  "name": "Artifact repository",
                  "does": "Artifact repository",
                  "children": [
                    {
                      "id": "artifact_write",
                      "name": "Mask and bound a complete output artifact",
                      "kind": "step",
                      "rules": [
                        "Maximum artifact text: 25,000,000 bytes. Default lifetime: 48 h. Content is zlib-compressed."
                      ],
                      "in": "command_output",
                      "out": [
                        "artifact",
                        "command_output"
                      ],
                      "does": "Mask and bound a complete output artifact",
                      "code": "services/saturn/src/saturn/infrastructure/artifact_repo.py"
                    },
                    {
                      "id": "artifact_cached",
                      "name": "Valid artifact in the line cache",
                      "kind": "decision",
                      "test": "The artifact is live and its decompressed lines are cached",
                      "branches": {
                        "cached": "saturn.service.evidence.artifacts.artifact_lines",
                        "otherwise": "saturn.service.evidence.artifacts.artifact_load"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/artifact_repo.py"
                    },
                    {
                      "id": "artifact_load",
                      "name": "Decompress and mask stored artifact lines",
                      "kind": "step",
                      "in": "artifact",
                      "out": "file_text",
                      "does": "Decompress and mask stored artifact lines",
                      "code": "services/saturn/src/saturn/infrastructure/artifact_repo.py"
                    },
                    {
                      "id": "artifact_lines",
                      "name": "Return source lines and refresh cache recency",
                      "kind": "step",
                      "rules": [
                        "The decompressed-line LRU keeps at most four artifacts."
                      ],
                      "in": "file_text",
                      "out": "file_text",
                      "does": "Return source lines and refresh cache recency",
                      "code": "services/saturn/src/saturn/infrastructure/artifact_repo.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/infrastructure/artifact_repo.py"
                },
                {
                  "id": "retention",
                  "kind": "group",
                  "name": "Retention and schema",
                  "does": "Retention and schema",
                  "children": [
                    {
                      "id": "schema_compatible",
                      "name": "Compatible SQLite schema",
                      "kind": "decision",
                      "test": "The store is empty or its version is in the supported migration range",
                      "branches": {
                        "compatible": "saturn.service.evidence.retention.schema_migrate",
                        "otherwise": "saturn.service.evidence.retention.schema_refuse"
                      },
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    },
                    {
                      "id": "schema_migrate",
                      "name": "Apply pending migrations in transactions",
                      "kind": "step",
                      "rules": [
                        "Schema versions start at 100. Current migrations advance the store to version 102.",
                        "One locked SQLite connection; WAL mode; 5000 ms busy timeout."
                      ],
                      "in": "schema_state",
                      "out": "schema_state",
                      "does": "Apply pending migrations in transactions",
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    },
                    {
                      "id": "schema_refuse",
                      "name": "Refuse an incompatible store without resetting it",
                      "kind": "step",
                      "stops": "Startup fails with instructions to move the incompatible store aside.",
                      "in": "schema_state",
                      "out": "failure",
                      "does": "Refuse an incompatible store without resetting it",
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    },
                    {
                      "id": "retention_expire",
                      "name": "Remove expired artifacts and full payloads",
                      "kind": "step",
                      "rules": [
                        "Artifact and full-payload TTL: 48 h. Run summaries and audit events have no automatic retention limit."
                      ],
                      "in": [
                        "artifact",
                        "payload"
                      ],
                      "out": [
                        "artifact",
                        "payload"
                      ],
                      "does": "Remove expired artifacts and full payloads",
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    },
                    {
                      "id": "retention_budget",
                      "name": "Artifact byte budget exceeded",
                      "kind": "decision",
                      "test": "Uncompressed artifact byte totals exceed 512,000,000",
                      "branches": {
                        "over": "saturn.service.evidence.retention.retention_oldest",
                        "otherwise": "saturn.service.evidence.retention.retention_done"
                      },
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    },
                    {
                      "id": "retention_oldest",
                      "name": "Delete the oldest artifact and recheck totals",
                      "kind": "step",
                      "in": "artifact",
                      "out": "artifact",
                      "does": "Delete the oldest artifact and recheck totals",
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    },
                    {
                      "id": "retention_done",
                      "name": "Clear decompressed caches after eviction",
                      "kind": "step",
                      "stops": "The store is within its current retention and byte limits.",
                      "in": "artifact",
                      "out": "artifact",
                      "does": "Clear decompressed caches after eviction",
                      "code": [
                        "services/saturn/src/saturn/infrastructure/db.py",
                        "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                        "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                      ]
                    }
                  ],
                  "code": [
                    "services/saturn/src/saturn/infrastructure/db.py",
                    "services/saturn/src/saturn/infrastructure/artifact_repo.py",
                    "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                  ]
                },
                {
                  "id": "masking",
                  "kind": "group",
                  "name": "Secret masking",
                  "does": "Secret masking",
                  "children": [
                    {
                      "id": "mask_known",
                      "name": "Configured secret appears",
                      "kind": "decision",
                      "test": "A configured secret is nonempty, has at least eight characters, and appears in the text",
                      "branches": {
                        "found": "saturn.service.evidence.masking.mask_replace",
                        "otherwise": "saturn.service.evidence.masking.mask_patterns"
                      },
                      "code": "services/saturn/src/saturn/domain/redaction.py"
                    },
                    {
                      "id": "mask_replace",
                      "name": "Replace configured secrets without moving source lines",
                      "kind": "step",
                      "in": "masked_text",
                      "out": "masked_text",
                      "does": "Replace configured secrets without moving source lines",
                      "code": "services/saturn/src/saturn/domain/redaction.py"
                    },
                    {
                      "id": "mask_patterns",
                      "name": "Recognized credential pattern",
                      "kind": "decision",
                      "test": "A token, private key, bearer value, or supported secret assignment matches",
                      "branches": {
                        "matches": "saturn.service.evidence.masking.mask_pattern_replace",
                        "otherwise": "saturn.service.evidence.masking.mask_done"
                      },
                      "code": "services/saturn/src/saturn/domain/redaction.py"
                    },
                    {
                      "id": "mask_pattern_replace",
                      "name": "Replace credential patterns and preserve newlines",
                      "kind": "step",
                      "in": "masked_text",
                      "out": "masked_text",
                      "does": "Replace credential patterns and preserve newlines",
                      "code": "services/saturn/src/saturn/domain/redaction.py"
                    },
                    {
                      "id": "mask_done",
                      "name": "Return masked text and replacement count",
                      "kind": "step",
                      "in": "masked_text",
                      "out": "masked_text",
                      "does": "Return masked text and replacement count",
                      "code": "services/saturn/src/saturn/domain/redaction.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/domain/redaction.py"
                },
                {
                  "id": "payloads",
                  "kind": "group",
                  "name": "Bounded full-body retention",
                  "does": "Bounded full-body retention",
                  "children": [
                    {
                      "id": "payload_size",
                      "name": "Full body exceeds its limit",
                      "kind": "decision",
                      "test": "The UTF-8 body exceeds 2,000,000 bytes",
                      "branches": {
                        "oversized": "saturn.service.evidence.payloads.payload_cut",
                        "otherwise": "saturn.service.evidence.payloads.payload_compress"
                      },
                      "code": "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                    },
                    {
                      "id": "payload_cut",
                      "name": "Cut at a valid UTF-8 boundary and mark truncation",
                      "kind": "step",
                      "in": "payload",
                      "out": "payload",
                      "does": "Cut at a valid UTF-8 boundary and mark truncation",
                      "code": "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                    },
                    {
                      "id": "payload_compress",
                      "name": "Compress and persist the full-body record",
                      "kind": "step",
                      "rules": [
                        "Full request, response, and model bodies expire after 48 h."
                      ],
                      "in": "payload",
                      "out": "payload",
                      "does": "Compress and persist the full-body record",
                      "code": "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/infrastructure/telemetry_repo.py"
                },
                {
                  "id": "timing",
                  "kind": "group",
                  "name": "Optional internal-stage timing",
                  "does": "Optional internal-stage timing",
                  "children": [
                    {
                      "id": "entry",
                      "kind": "group",
                      "name": "Optional request timing admission",
                      "does": "Optional request timing admission",
                      "children": [
                        {
                          "id": "begin",
                          "kind": "event",
                          "name": "A measured MCP request enters the service",
                          "trigger": "An MCP tool-call request reaches the first Saturn-owned HTTP application boundary",
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "enabled",
                          "kind": "decision",
                          "name": "Startup timing capture is enabled",
                          "test": "SATURN_INTERNAL_TIMING was enabled at service startup",
                          "branches": {
                            "enabled": "saturn.service.evidence.timing.entry.capacity",
                            "otherwise": "saturn.service.evidence.timing.entry.off"
                          },
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "off",
                          "kind": "step",
                          "name": "Continue the existing request without profiling",
                          "does": "Continue the existing request without profiling",
                          "in": "tool_call",
                          "out": "tool_call",
                          "stops": "The existing request continues without additional timing capture.",
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "capacity",
                          "kind": "decision",
                          "name": "A full collector lease is available",
                          "test": "Fewer than 64 full-profile collectors are active",
                          "branches": {
                            "available": "saturn.service.evidence.timing.entry.allocate",
                            "otherwise": "saturn.service.evidence.timing.entry.overflow"
                          },
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "allocate",
                          "kind": "step",
                          "name": "Create a request-local monotonic scope and collector lease",
                          "does": "Create a request-local monotonic scope and collector lease",
                          "in": "tool_call",
                          "out": "timing_scope",
                          "rules": [
                            "Use monotonic nanoseconds from one process instance.",
                            "Use opaque bounded IDs and task-local parent stacks.",
                            "Session setup and administration calls are outside tool-call measurement counts."
                          ],
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "overflow",
                          "kind": "step",
                          "name": "Keep a minimal capacity marker until the request ends",
                          "does": "Keep a minimal capacity marker until the request ends",
                          "in": "tool_call",
                          "out": "timing_scope",
                          "rules": [
                            "No full collector lease is reserved.",
                            "The original request is neither refused nor queued.",
                            "The marker has complete=false and no stage intervals."
                          ],
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/transport/internal_timing.py"
                    },
                    {
                      "id": "capture",
                      "kind": "group",
                      "name": "Bounded interval observation",
                      "does": "Bounded interval observation",
                      "children": [
                        {
                          "id": "sources",
                          "kind": "group",
                          "name": "Existing operation boundaries",
                          "does": "Existing operation boundaries",
                          "children": [
                            {
                              "id": "choose",
                              "kind": "decision",
                              "name": "Select the observed boundary class",
                              "test": "The observed operation has a fixed boundary category",
                              "branches": {
                                "application": "saturn.service.evidence.timing.capture.sources.application",
                                "database lock": "saturn.service.evidence.timing.capture.sources.database_lock",
                                "database operation": "saturn.service.evidence.timing.capture.sources.database_operation",
                                "model semaphore": "saturn.service.evidence.timing.capture.sources.model_slot",
                                "backend": "saturn.service.evidence.timing.capture.sources.backend",
                                "otherwise": "saturn.service.evidence.timing.capture.sources.unknown"
                              },
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            },
                            {
                              "id": "application",
                              "kind": "step",
                              "name": "Measure owned authentication, configuration, validation, policy, redaction, digest, and response-construction boundaries",
                              "does": "Measure owned authentication, configuration, validation, policy, redaction, digest, and response-construction boundaries",
                              "in": "timing_scope",
                              "out": "timing_interval",
                              "rules": [
                                "Retain monotonic endpoints, parent ID, fixed stage name, and terminal status.",
                                "Observe the existing operation without changing capacity, ordering, cancellation, or response behavior."
                              ],
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            },
                            {
                              "id": "database_lock",
                              "kind": "step",
                              "name": "Measure acquisition of the existing database lock",
                              "does": "Measure acquisition of the existing database lock",
                              "in": "timing_scope",
                              "out": "timing_interval",
                              "rules": [
                                "Retain monotonic endpoints, parent ID, fixed stage name, and terminal status.",
                                "Observe the existing operation without changing capacity, ordering, cancellation, or response behavior.",
                                "Acquisition elapsed includes lock-acquisition overhead; do not invent a separate queue-depth measurement."
                              ],
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            },
                            {
                              "id": "database_operation",
                              "kind": "step",
                              "name": "Measure internal storage operations after database lock acquisition",
                              "does": "Measure internal storage operations after database lock acquisition",
                              "in": "timing_scope",
                              "out": "timing_interval",
                              "rules": [
                                "Retain monotonic endpoints, parent ID, fixed stage name, and terminal status.",
                                "Observe the existing operation without changing capacity, ordering, cancellation, or response behavior.",
                                "SQLite busy waiting remains part of the operation envelope; no separate value is inferred."
                              ],
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            },
                            {
                              "id": "model_slot",
                              "kind": "step",
                              "name": "Measure acquisition of the existing model-call semaphore",
                              "does": "Measure acquisition of the existing model-call semaphore",
                              "in": "timing_scope",
                              "out": "timing_interval",
                              "rules": [
                                "Retain monotonic endpoints, parent ID, fixed stage name, and terminal status.",
                                "Observe the existing operation without changing capacity, ordering, cancellation, or response behavior.",
                                "Acquisition elapsed includes semaphore-acquisition overhead; only directly observed contention is reported."
                              ],
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            },
                            {
                              "id": "backend",
                              "kind": "step",
                              "name": "Measure command, project-file I/O, client roots, and model-server request envelopes",
                              "does": "Measure command, project-file I/O, client roots, and model-server request envelopes",
                              "in": "timing_scope",
                              "out": "timing_interval",
                              "rules": [
                                "Retain monotonic endpoints, parent ID, fixed stage name, and terminal status.",
                                "Observe the existing operation without changing capacity, ordering, cancellation, or response behavior.",
                                "Envelopes include adapter work and are not pure inference or child-process CPU measurements."
                              ],
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            },
                            {
                              "id": "unknown",
                              "kind": "step",
                              "name": "Record an unknown boundary as unattributed",
                              "does": "Record an unknown boundary as unattributed",
                              "in": "timing_scope",
                              "out": "timing_interval",
                              "rules": [
                                "Retain monotonic endpoints, parent ID, fixed stage name, and terminal status.",
                                "Observe the existing operation without changing capacity, ordering, cancellation, or response behavior."
                              ],
                              "code": "services/saturn/src/saturn/domain/internal_timing.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/domain/internal_timing.py"
                        },
                        {
                          "id": "bounded",
                          "kind": "decision",
                          "name": "The interval buffer has room",
                          "test": "The collector has fewer than 4096 retained intervals",
                          "branches": {
                            "room": "saturn.service.evidence.timing.capture.append",
                            "otherwise": "saturn.service.evidence.timing.capture.drop"
                          },
                          "code": "services/saturn/src/saturn/domain/internal_timing.py"
                        },
                        {
                          "id": "append",
                          "kind": "step",
                          "name": "Append the bounded interval to the request-local scope",
                          "does": "Append the bounded interval to the request-local scope",
                          "in": [
                            "timing_scope",
                            "timing_interval"
                          ],
                          "out": "timing_scope",
                          "rules": [
                            "No raw arguments, paths, contents, SQL text, SQL parameters, headers, or tokens are recorded."
                          ],
                          "code": "services/saturn/src/saturn/domain/internal_timing.py"
                        },
                        {
                          "id": "drop",
                          "kind": "step",
                          "name": "Increment the interval-loss count and mark the scope incomplete",
                          "does": "Increment the interval-loss count and mark the scope incomplete",
                          "in": [
                            "timing_scope",
                            "timing_interval"
                          ],
                          "out": "timing_scope",
                          "code": "services/saturn/src/saturn/domain/internal_timing.py"
                        },
                        {
                          "id": "more",
                          "kind": "decision",
                          "name": "The request has another observed boundary",
                          "test": "The request continues before final response send, error, or cancellation",
                          "branches": {
                            "more": "saturn.service.evidence.timing.capture.sources.choose",
                            "otherwise": "saturn.service.evidence.timing.finish.seal"
                          },
                          "code": "services/saturn/src/saturn/domain/internal_timing.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/domain/internal_timing.py"
                    },
                    {
                      "id": "finish",
                      "kind": "group",
                      "name": "Timing completion and release",
                      "does": "Timing completion and release",
                      "children": [
                        {
                          "id": "seal",
                          "kind": "step",
                          "name": "Seal the service window after final send or terminal interruption",
                          "does": "Seal the service window after final send or terminal interruption",
                          "in": "timing_scope",
                          "out": "timing_profile",
                          "rules": [
                            "Final ASGI send return does not prove client receipt.",
                            "Record error or cancellation status and incomplete boundaries.",
                            "Keep legacy wall-clock traces unchanged; inaccessible SDK work remains unattributed."
                          ],
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "size",
                          "kind": "decision",
                          "name": "The encoded timing profile fits the payload budget",
                          "test": "The encoded profile is at most 2000000 bytes",
                          "branches": {
                            "fits": "saturn.service.evidence.timing.finish.export.bind",
                            "otherwise": "saturn.service.evidence.timing.finish.shorten"
                          },
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "shorten",
                          "kind": "step",
                          "name": "Replace an oversized profile with a minimal incomplete marker",
                          "does": "Replace an oversized profile with a minimal incomplete marker",
                          "in": "timing_profile",
                          "out": "timing_profile",
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "export",
                          "kind": "group",
                          "name": "Existing trace payload export",
                          "does": "Existing trace payload export",
                          "children": [
                            {
                              "id": "bind",
                              "kind": "decision",
                              "name": "The profile has one matching tool run",
                              "test": "The service instance and request identity bind the profile to exactly one run",
                              "branches": {
                                "bound": "saturn.service.evidence.timing.finish.export.persist",
                                "otherwise": "saturn.service.evidence.timing.finish.export.missing"
                              },
                              "code": "services/saturn/src/saturn/transport/internal_timing.py"
                            },
                            {
                              "id": "persist",
                              "kind": "step",
                              "name": "Store an additive timing payload through the telemetry repository",
                              "does": "Store an additive timing payload through the telemetry repository",
                              "in": "timing_profile",
                              "out": [
                                "timing_profile",
                                "payload"
                              ],
                              "rules": [
                                "Use kind=timing with the existing local administration trace/payload API and payload expiry.",
                                "Keep the database schema and existing response projections compatible.",
                                "Profile-export writes are outside the measured response window and do not instrument themselves."
                              ],
                              "code": "services/saturn/src/saturn/transport/internal_timing.py"
                            },
                            {
                              "id": "saved",
                              "kind": "decision",
                              "name": "Profile export succeeds",
                              "test": "The timing payload write completes",
                              "branches": {
                                "saved": "saturn.service.evidence.timing.finish.export.publish",
                                "otherwise": "saturn.service.evidence.timing.finish.export.failed"
                              },
                              "code": "services/saturn/src/saturn/transport/internal_timing.py"
                            },
                            {
                              "id": "publish",
                              "kind": "step",
                              "name": "Make the completed profile available through the existing trace API",
                              "does": "Make the completed profile available through the existing trace API",
                              "in": "timing_profile",
                              "out": "timing_profile",
                              "code": "services/saturn/src/saturn/transport/internal_timing.py"
                            },
                            {
                              "id": "missing",
                              "kind": "step",
                              "name": "Keep the original response and record unavailable correlation",
                              "does": "Keep the original response and record unavailable correlation",
                              "in": "timing_profile",
                              "out": "timing_profile",
                              "rules": [
                                "No anonymous body or invented run binding is stored.",
                                "A required missing profile remains visible to the benchmark."
                              ],
                              "code": "services/saturn/src/saturn/transport/internal_timing.py"
                            },
                            {
                              "id": "failed",
                              "kind": "step",
                              "name": "Keep the original response after timing export fails",
                              "does": "Keep the original response after timing export fails",
                              "in": "timing_profile",
                              "out": "timing_profile",
                              "rules": [
                                "No request retry or fabricated zero-duration profile."
                              ],
                              "code": "services/saturn/src/saturn/transport/internal_timing.py"
                            }
                          ],
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "leased",
                          "kind": "decision",
                          "name": "This scope reserved a full collector lease",
                          "test": "The scope owns a full-profile collector lease",
                          "branches": {
                            "leased": "saturn.service.evidence.timing.finish.release",
                            "otherwise": "saturn.service.evidence.timing.finish.done"
                          },
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "release",
                          "kind": "step",
                          "name": "Release the scope-owned collector lease",
                          "does": "Release the scope-owned collector lease",
                          "in": "timing_profile",
                          "out": "timing_profile",
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        },
                        {
                          "id": "done",
                          "kind": "step",
                          "name": "Finish optional observation without changing the original request",
                          "does": "Finish optional observation without changing the original request",
                          "in": "timing_profile",
                          "out": "timing_profile",
                          "stops": "The optional timing scope is complete and owns no collector capacity.",
                          "code": "services/saturn/src/saturn/transport/internal_timing.py"
                        }
                      ],
                      "code": "services/saturn/src/saturn/transport/internal_timing.py"
                    }
                  ],
                  "choice": "Bounded optional observation of existing boundaries, exported through the existing trace API.",
                  "why": "Public MCP request context binds the collector through final HTTP send. Monotonic intervals remain bounded and separate backend execution from internal work.",
                  "rejected": [
                    "Inferring queue wait from unrelated latency percentiles.",
                    "Adding a general request queue for a measurement.",
                    "Patching dependency source or changing normal scheduling."
                  ],
                  "code": "services/saturn/src/saturn/transport/internal_timing.py"
                }
              ],
              "code": [
                "services/saturn/src/saturn/application/recorder.py",
                "services/saturn/src/saturn/infrastructure/tracing.py",
                "services/saturn/src/saturn/infrastructure/artifact_repo.py"
              ]
            },
            {
              "id": "hooks",
              "kind": "group",
              "name": "Optional shell-output integration",
              "does": "Optional shell-output integration",
              "children": [
                {
                  "id": "input",
                  "kind": "group",
                  "name": "Hook input and eligibility",
                  "does": "Hook input and eligibility",
                  "children": [
                    {
                      "id": "hook_auth",
                      "name": "Accepted hook credential",
                      "kind": "decision",
                      "test": "The bearer credential identifies a live harness",
                      "branches": {
                        "accepted": "saturn.service.hooks.input.hook_size",
                        "otherwise": "saturn.service.hooks.input.hook_error"
                      },
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    },
                    {
                      "id": "hook_size",
                      "name": "Hook event size",
                      "kind": "decision",
                      "test": "Declared and streamed body size do not exceed 8,000,000 bytes",
                      "branches": {
                        "bounded": "saturn.service.hooks.input.hook_json",
                        "otherwise": "saturn.service.hooks.input.hook_error"
                      },
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    },
                    {
                      "id": "hook_json",
                      "name": "Hook JSON shape",
                      "kind": "decision",
                      "test": "The event validates as a supported hook payload",
                      "branches": {
                        "valid": "saturn.service.hooks.input.hook_eligible",
                        "otherwise": "saturn.service.hooks.input.hook_error"
                      },
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    },
                    {
                      "id": "hook_eligible",
                      "name": "Harness can use the hook",
                      "kind": "decision",
                      "test": "Hooks are enabled, required tools are granted, and the harness reached MCP since service start",
                      "branches": {
                        "eligible": "saturn.service.hooks.input.hook_phase",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    },
                    {
                      "id": "hook_phase",
                      "name": "Hook phase",
                      "kind": "decision",
                      "test": "The event is PreToolUse or Claude PostToolUse",
                      "branches": {
                        "pre": "saturn.service.hooks.pre.hook_shell",
                        "otherwise": "saturn.service.hooks.post.hook_post_shape"
                      },
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    },
                    {
                      "id": "hook_error",
                      "name": "Return a bounded hook HTTP error",
                      "kind": "step",
                      "in": "hook_event",
                      "out": "failure",
                      "does": "Return a bounded hook HTTP error",
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    },
                    {
                      "id": "hook_pass",
                      "name": "Return HTTP 204 and leave the shell tool unchanged",
                      "kind": "step",
                      "in": "hook_event",
                      "out": "hook_result",
                      "does": "Return HTTP 204 and leave the shell tool unchanged",
                      "code": "services/saturn/src/saturn/transport/hook_api.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/transport/hook_api.py"
                },
                {
                  "id": "pre",
                  "kind": "group",
                  "name": "Pre-tool redirection",
                  "does": "Pre-tool redirection",
                  "children": [
                    {
                      "id": "hook_shell",
                      "name": "Supported shell and workspace",
                      "kind": "decision",
                      "test": "The event has a supported shell, command text, and permitted cwd",
                      "branches": {
                        "valid": "saturn.service.hooks.pre.hook_direct",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_direct",
                      "name": "Direct marker or unsuitable command",
                      "kind": "decision",
                      "test": "The command is marked direct or is not one plain command",
                      "branches": {
                        "bypass": "saturn.service.hooks.input.hook_pass",
                        "otherwise": "saturn.service.hooks.pre.hook_scope"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_scope",
                      "name": "Hook command scope",
                      "kind": "decision",
                      "test": "The scope is off, all, or noisy with a matching command",
                      "branches": {
                        "off": "saturn.service.hooks.input.hook_pass",
                        "matches": "saturn.service.hooks.pre.hook_policy",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_policy",
                      "name": "Saturn would permit the command",
                      "kind": "decision",
                      "test": "The same command passes Saturn's policy and folder guards",
                      "branches": {
                        "permitted": "saturn.service.hooks.pre.hook_redirect",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_redirect",
                      "name": "Decline the shell call and point to saturn_run",
                      "kind": "step",
                      "does": "Returns a client hook instruction. The hook does not execute the command.",
                      "in": "hook_event",
                      "out": "hook_result",
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/hook_service.py"
                },
                {
                  "id": "post",
                  "kind": "group",
                  "name": "Claude output replacement",
                  "does": "Claude output replacement",
                  "children": [
                    {
                      "id": "hook_post_shape",
                      "name": "Supported completed shell result",
                      "kind": "decision",
                      "test": "The shell result is a dictionary with stdout text",
                      "branches": {
                        "supported": "saturn.service.hooks.post.hook_post_budget",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_post_budget",
                      "name": "Output merits a digest",
                      "kind": "decision",
                      "test": "The output exceeds the inline budget and hook scope accepts the command",
                      "branches": {
                        "long": "saturn.service.hooks.post.hook_store",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_store",
                      "name": "Mask and store already-captured shell output",
                      "kind": "step",
                      "in": "hook_event",
                      "out": "artifact",
                      "does": "Mask and store already-captured shell output",
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_shorter",
                      "name": "Digest is shorter",
                      "kind": "decision",
                      "test": "The rendered digest uses fewer estimated tokens than the original output",
                      "branches": {
                        "shorter": "saturn.service.hooks.post.hook_replace",
                        "otherwise": "saturn.service.hooks.input.hook_pass"
                      },
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    },
                    {
                      "id": "hook_replace",
                      "name": "Replace stdout while preserving the shell-result shape",
                      "kind": "step",
                      "rules": [
                        "Only Claude supports this post-tool output replacement. Codex uses pre-tool redirection only."
                      ],
                      "in": "digest",
                      "out": "hook_result",
                      "does": "Replace stdout while preserving the shell-result shape",
                      "code": "services/saturn/src/saturn/application/hook_service.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/application/hook_service.py"
                }
              ],
              "code": [
                "services/saturn/src/saturn/transport/hook_api.py",
                "services/saturn/src/saturn/application/hook_service.py",
                "services/saturn/src/saturn/domain/hook_policy.py"
              ]
            },
            {
              "id": "lifecycle",
              "kind": "group",
              "name": "Service lifecycle",
              "does": "Service lifecycle",
              "children": [
                {
                  "id": "service_start",
                  "name": "Service start",
                  "kind": "event",
                  "trigger": "The foreground or Windows-managed server starts",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                },
                {
                  "id": "service_config",
                  "name": "Read startup environment and build application resources",
                  "kind": "step",
                  "in": "startup_settings",
                  "out": "service_state",
                  "does": "Read startup environment and build application resources",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                },
                {
                  "id": "service_recover",
                  "name": "Mark orphaned runs interrupted and evict expired bodies",
                  "kind": "step",
                  "in": "service_state",
                  "out": "run",
                  "does": "Mark orphaned runs interrupted and evict expired bodies",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                },
                {
                  "id": "service_ready",
                  "name": "Start MCP sessions and record service readiness",
                  "kind": "step",
                  "stops": "The HTTP service is listening for new calls.",
                  "in": "service_state",
                  "out": "audit_event",
                  "does": "Start MCP sessions and record service readiness",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                },
                {
                  "id": "service_stop",
                  "name": "Service stop",
                  "kind": "event",
                  "trigger": "A signal or a managed stop marker requests shutdown",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                },
                {
                  "id": "service_drain",
                  "name": "Drain pending HTTP calls for the grace period",
                  "kind": "step",
                  "rules": [
                    "Default shutdown grace: 5 s. Remaining operations are cancelled."
                  ],
                  "in": "service_state",
                  "out": "service_state",
                  "does": "Drain pending HTTP calls for the grace period",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                },
                {
                  "id": "service_close",
                  "name": "Record shutdown and close stores and workers",
                  "kind": "step",
                  "stops": "The service process exits after cleanup.",
                  "in": "service_state",
                  "out": "audit_event",
                  "does": "Record shutdown and close stores and workers",
                  "code": [
                    "services/saturn/src/saturn/bootstrap/app.py",
                    "services/saturn/src/saturn/bootstrap/cli.py",
                    "services/saturn/src/saturn/bootstrap/managed_server.py"
                  ]
                }
              ],
              "code": [
                "services/saturn/src/saturn/bootstrap/app.py",
                "services/saturn/src/saturn/bootstrap/cli.py",
                "services/saturn/src/saturn/bootstrap/managed_server.py"
              ]
            }
          ],
          "code": [
            "services/saturn/src/saturn/bootstrap/app.py",
            "services/saturn/src/saturn/bootstrap/container.py",
            "services/saturn/src/saturn/application/ports.py",
            "services/saturn/src/saturn/application/limits.py"
          ]
        },
        {
          "id": "bridge",
          "kind": "group",
          "name": "Client-launched bridge and hook relay",
          "does": "Client-launched bridge and hook relay",
          "children": [
            {
              "id": "stdio",
              "kind": "group",
              "name": "Authenticated stdio forwarding",
              "does": "Authenticated stdio forwarding",
              "children": [
                {
                  "id": "bridge_receive",
                  "name": "Read the client request and load its credential",
                  "kind": "step",
                  "code": "services/saturn/src/saturn/bootstrap/cli.py",
                  "in": "tool_call",
                  "out": [
                    "tool_call",
                    "credential"
                  ],
                  "does": "Read the client request and load its credential"
                },
                {
                  "id": "bridge_token",
                  "name": "Local token available",
                  "kind": "decision",
                  "test": "SATURN_TOKEN or the named harness credential file supplies a token",
                  "branches": {
                    "present": "saturn.bridge.stdio.upstream.bridge_health",
                    "otherwise": "saturn.bridge.stdio.upstream.bridge_error"
                  },
                  "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                },
                {
                  "id": "upstream",
                  "kind": "group",
                  "name": "Local service session",
                  "does": "Local service session",
                  "children": [
                    {
                      "id": "bridge_health",
                      "name": "Service already healthy",
                      "kind": "decision",
                      "test": "The local service responds to its health endpoint",
                      "branches": {
                        "healthy": "saturn.bridge.stdio.upstream.bridge_workspace",
                        "otherwise": "saturn.bridge.stdio.upstream.bridge_startable"
                      },
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    },
                    {
                      "id": "bridge_startable",
                      "name": "Automatic startup available",
                      "kind": "decision",
                      "test": "No explicit SATURN_URL is set and the bridge runs on Windows",
                      "branches": {
                        "startable": "saturn.bridge.stdio.upstream.bridge_start",
                        "otherwise": "saturn.bridge.stdio.upstream.bridge_error"
                      },
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    },
                    {
                      "id": "bridge_start",
                      "name": "Start this checkout and wait for readiness",
                      "kind": "step",
                      "rules": [
                        "The bridge waits up to 45 s after starting the service."
                      ],
                      "in": "tool_call",
                      "out": "service_state",
                      "does": "Start this checkout and wait for readiness",
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    },
                    {
                      "id": "bridge_workspace",
                      "name": "Supply the startup folder for omitted workspace_root",
                      "kind": "step",
                      "in": "tool_call",
                      "out": "tool_call",
                      "does": "Supply the startup folder for omitted workspace_root",
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    },
                    {
                      "id": "bridge_forward",
                      "name": "Forward over a fresh authenticated HTTP session",
                      "kind": "step",
                      "rules": [
                        "HTTP read timeout: 360 s. Original client identity and progress metadata are forwarded."
                      ],
                      "in": "tool_call",
                      "out": "tool_call",
                      "does": "Forward over a fresh authenticated HTTP session",
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    },
                    {
                      "id": "bridge_reply",
                      "name": "Return the protocol result to the original client",
                      "kind": "step",
                      "in": "tool_result",
                      "out": "tool_result",
                      "does": "Return the protocol result to the original client",
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    },
                    {
                      "id": "bridge_error",
                      "name": "Explain missing credential or unavailable service",
                      "kind": "step",
                      "in": "failure",
                      "out": "tool_result",
                      "does": "Explain missing credential or unavailable service",
                      "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
                }
              ],
              "code": "services/saturn/src/saturn/transport/stdio_bridge.py"
            },
            {
              "id": "relay",
              "kind": "group",
              "name": "Fail-open shell hook relay",
              "does": "Fail-open shell hook relay",
              "children": [
                {
                  "id": "relay_supported",
                  "name": "Supported bounded hook event",
                  "kind": "decision",
                  "test": "The client/event pair is supported and the nonempty body fits 8,000,000 bytes",
                  "branches": {
                    "supported": "saturn.bridge.relay.relay_token",
                    "otherwise": "saturn.bridge.relay.relay_skip"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
                },
                {
                  "id": "relay_token",
                  "name": "Hook credential available",
                  "kind": "decision",
                  "test": "The environment override or credential file supplies a token",
                  "branches": {
                    "present": "saturn.bridge.relay.relay_send",
                    "otherwise": "saturn.bridge.relay.relay_skip"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
                },
                {
                  "id": "relay_send",
                  "name": "Post the event to the local hook endpoint",
                  "kind": "step",
                  "rules": [
                    "Pre-tool relay timeout: 9 s. Claude post-tool timeout: 115 s."
                  ],
                  "in": "hook_event",
                  "out": "hook_event",
                  "does": "Post the event to the local hook endpoint",
                  "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
                },
                {
                  "id": "relay_response",
                  "name": "Usable hook response",
                  "kind": "decision",
                  "test": "The service returns HTTP 200 before the relay deadline",
                  "branches": {
                    "usable": "saturn.bridge.relay.relay_print",
                    "otherwise": "saturn.bridge.relay.relay_skip"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
                },
                {
                  "id": "relay_print",
                  "name": "Print the hook response and exit successfully",
                  "kind": "step",
                  "in": "hook_result",
                  "out": "hook_result",
                  "does": "Print the hook response and exit successfully",
                  "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
                },
                {
                  "id": "relay_skip",
                  "name": "Print nothing and exit successfully",
                  "kind": "step",
                  "does": "Leaves the original shell command or output unchanged after an unsupported event, missing token, or service failure.",
                  "in": "failure",
                  "out": "hook_result",
                  "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
                }
              ],
              "code": "services/saturn/src/saturn/bootstrap/hook_relay.py"
            }
          ],
          "code": [
            "services/saturn/src/saturn/transport/stdio_bridge.py",
            "services/saturn/src/saturn/bootstrap/hook_relay.py"
          ]
        },
        {
          "id": "cli",
          "kind": "group",
          "name": "Terminal controls",
          "does": "Terminal controls",
          "children": [
            {
              "id": "setup",
              "kind": "group",
              "name": "Guided setup",
              "does": "Guided setup",
              "children": [
                {
                  "id": "cli_setup",
                  "name": "Setup command",
                  "kind": "event",
                  "trigger": "The developer runs saturn setup",
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                },
                {
                  "id": "cli_requirements",
                  "name": "Check requirements and create missing home templates",
                  "kind": "step",
                  "in": "owner_request",
                  "out": "startup_settings",
                  "does": "Check requirements and create missing home templates",
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                },
                {
                  "id": "cli_model",
                  "name": "Configure a worker",
                  "kind": "decision",
                  "test": "The developer selects a provider instead of skipping model setup",
                  "branches": {
                    "configure": "saturn.cli.setup.cli_model_list",
                    "otherwise": "saturn.cli.setup.cli_start_choice"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                },
                {
                  "id": "cli_model_list",
                  "name": "List models and test the selected model",
                  "kind": "step",
                  "in": "settings",
                  "out": "model_request",
                  "does": "List models and test the selected model",
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                },
                {
                  "id": "cli_start_choice",
                  "name": "Service running or start requested",
                  "kind": "decision",
                  "test": "The service is healthy or the developer requests startup",
                  "branches": {
                    "running": "saturn.cli.setup.cli_client_choice",
                    "start": "saturn.cli.launcher.launcher_platform",
                    "otherwise": "saturn.cli.setup.cli_client_choice"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                },
                {
                  "id": "cli_client_choice",
                  "name": "Interactive client connection",
                  "kind": "decision",
                  "test": "An interactive terminal and client selection allow connection setup",
                  "branches": {
                    "connect": "saturn.service.control.connect.preview.connect_plan",
                    "otherwise": "saturn.cli.setup.cli_doctor"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                },
                {
                  "id": "cli_doctor",
                  "name": "Check configuration, service, model, credentials, and managed entries",
                  "kind": "step",
                  "in": "owner_request",
                  "out": "dashboard_page",
                  "does": "Check configuration, service, model, credentials, and managed entries",
                  "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
                }
              ],
              "code": "services/saturn/src/saturn/bootstrap/setup_cli.py"
            },
            {
              "id": "admin",
              "kind": "group",
              "name": "Owner commands",
              "does": "Owner commands",
              "children": [
                {
                  "id": "cli_admin",
                  "name": "Administration command",
                  "kind": "event",
                  "trigger": "The developer requests settings, policy, connection, run, event, or diagnostic commands",
                  "code": "services/saturn/src/saturn/bootstrap/admin_cli.py"
                },
                {
                  "id": "cli_widen",
                  "name": "Command widens access",
                  "kind": "decision",
                  "test": "A requested policy change grants broader access",
                  "branches": {
                    "widen": "saturn.cli.admin.cli_terminal",
                    "otherwise": "saturn.cli.admin.cli_apply"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/admin_cli.py"
                },
                {
                  "id": "cli_terminal",
                  "name": "Interactive confirmation",
                  "kind": "decision",
                  "test": "The terminal is interactive and the developer confirms the change",
                  "branches": {
                    "confirmed": "saturn.cli.admin.cli_apply",
                    "otherwise": "saturn.cli.admin.cli_abort"
                  },
                  "code": [
                    "services/saturn/src/saturn/bootstrap/admin_cli.py",
                    "services/saturn/src/saturn/bootstrap/terminal.py"
                  ]
                },
                {
                  "id": "cli_apply",
                  "name": "Apply a local owner operation through shared use cases",
                  "kind": "step",
                  "in": "owner_request",
                  "out": "owner_request",
                  "does": "Apply a local owner operation through shared use cases",
                  "code": "services/saturn/src/saturn/bootstrap/admin_cli.py"
                },
                {
                  "id": "cli_abort",
                  "name": "Return without changing owner configuration",
                  "kind": "step",
                  "in": "owner_request",
                  "out": "failure",
                  "does": "Return without changing owner configuration",
                  "code": "services/saturn/src/saturn/bootstrap/admin_cli.py"
                },
                {
                  "id": "cli_print",
                  "name": "Print the result in the terminal",
                  "kind": "step",
                  "in": "dashboard_page",
                  "out": "dashboard_page",
                  "does": "Print the result in the terminal",
                  "code": "services/saturn/src/saturn/bootstrap/admin_cli.py"
                }
              ],
              "code": "services/saturn/src/saturn/bootstrap/admin_cli.py"
            },
            {
              "id": "launcher",
              "kind": "group",
              "name": "Windows managed lifecycle",
              "does": "Windows managed lifecycle",
              "children": [
                {
                  "id": "cli_launch",
                  "name": "Lifecycle command",
                  "kind": "event",
                  "trigger": "The developer requests saturn start, stop, or status",
                  "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                },
                {
                  "id": "launcher_platform",
                  "name": "Windows launcher available",
                  "kind": "decision",
                  "test": "The host supports the managed PowerShell launcher",
                  "branches": {
                    "windows": "saturn.cli.launcher.launcher_action",
                    "otherwise": "saturn.cli.launcher.shutdown.launcher_unsupported"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                },
                {
                  "id": "launcher_action",
                  "name": "Managed lifecycle action",
                  "kind": "decision",
                  "test": "The command requests start, stop, or status",
                  "branches": {
                    "start": "saturn.cli.launcher.startup.launcher_port",
                    "stop": "saturn.cli.launcher.shutdown.launcher_identity",
                    "otherwise": "saturn.cli.launcher.shutdown.launcher_status"
                  },
                  "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                },
                {
                  "id": "startup",
                  "kind": "group",
                  "name": "Managed process startup",
                  "does": "Managed process startup",
                  "children": [
                    {
                      "id": "launcher_port",
                      "name": "Port available for this managed instance",
                      "kind": "decision",
                      "test": "The port is free or already owned by the matching managed instance",
                      "branches": {
                        "available": "saturn.cli.launcher.startup.launcher_start",
                        "otherwise": "saturn.cli.launcher.shutdown.launcher_refuse"
                      },
                      "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                    },
                    {
                      "id": "launcher_start",
                      "name": "Launch the service and wait for its run-specific ready marker",
                      "kind": "step",
                      "code": "scripts/saturn.ps1",
                      "in": "service_state",
                      "out": "service_state",
                      "does": "Launch the service and wait for its run-specific ready marker"
                    }
                  ],
                  "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                },
                {
                  "id": "shutdown",
                  "kind": "group",
                  "name": "Managed stop and status",
                  "does": "Managed stop and status",
                  "children": [
                    {
                      "id": "launcher_identity",
                      "name": "Matching managed process identity",
                      "kind": "decision",
                      "test": "The stored process identity belongs to this managed service",
                      "branches": {
                        "matches": "saturn.cli.launcher.shutdown.launcher_stop",
                        "otherwise": "saturn.cli.launcher.shutdown.launcher_refuse"
                      },
                      "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                    },
                    {
                      "id": "launcher_stop",
                      "name": "Write the run-specific stop marker",
                      "kind": "step",
                      "code": "scripts/saturn.ps1",
                      "in": "service_state",
                      "out": "service_state",
                      "does": "Write the run-specific stop marker"
                    },
                    {
                      "id": "launcher_status",
                      "name": "Report managed, unmanaged, stopped, or stopping state",
                      "kind": "step",
                      "code": "scripts/saturn.ps1",
                      "in": "service_state",
                      "out": "dashboard_page",
                      "does": "Report managed, unmanaged, stopped, or stopping state"
                    },
                    {
                      "id": "launcher_refuse",
                      "name": "Refuse an occupied port or unrelated process",
                      "kind": "step",
                      "in": "service_state",
                      "out": "failure",
                      "does": "Refuse an occupied port or unrelated process",
                      "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                    },
                    {
                      "id": "launcher_unsupported",
                      "name": "Explain that the host needs a foreground serve process",
                      "kind": "step",
                      "in": "owner_request",
                      "out": "failure",
                      "does": "Explain that the host needs a foreground serve process",
                      "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                    }
                  ],
                  "code": "services/saturn/src/saturn/bootstrap/launcher.py"
                }
              ],
              "code": "services/saturn/src/saturn/bootstrap/launcher.py"
            },
            {
              "id": "checkout",
              "kind": "group",
              "name": "Checkout installation and verification",
              "does": "Prepares a source checkout and verifies it without connecting clients or changing existing runtime configuration.",
              "choice": "Keep dependency preparation separate from runtime model and client configuration.",
              "why": "The existing Saturn home and explicit client-installation controls remain authoritative. CI needs no model, credential, or paid API.",
              "rejected": [
                "Copy a root .env: the accepted startup settings live in the Saturn home.",
                "Connect clients during unattended setup: client edits need the existing preview and confirmation flow.",
                "Use a real service for the smoke check: startup verification must be disposable and reproducible."
              ],
              "children": [
                {
                  "id": "tools",
                  "kind": "group",
                  "name": "Requirements",
                  "does": "Requirements",
                  "children": [
                    {
                      "id": "setup",
                      "kind": "event",
                      "name": "Prepare a checkout",
                      "trigger": "The developer runs python scripts/setup.py, with --yes for unattended defaults",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "requirements",
                      "kind": "step",
                      "name": "Read tool versions and locked inputs",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Reads the current Python, uv, Node.js, npm, Python pin, Node pin, and dependency lockfiles.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "tools",
                      "kind": "decision",
                      "name": "Required tools are compatible",
                      "test": "Python is at least 3.12 and uv, npm, and a Node version supported by the frontend lockfile are available",
                      "branches": {
                        "compatible": "saturn.cli.checkout.dependencies.python_install",
                        "otherwise": "saturn.cli.checkout.result.failed"
                      },
                      "code": "scripts/setup.py"
                    }
                  ],
                  "code": "scripts/setup.py"
                },
                {
                  "id": "dependencies",
                  "kind": "group",
                  "name": "Locked dependencies and dashboard build",
                  "does": "Locked dependencies and dashboard build",
                  "children": [
                    {
                      "id": "python_install",
                      "kind": "step",
                      "name": "Install locked Python dependencies",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Runs uv sync --locked with the service Python pin in services/saturn.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "python_ok",
                      "kind": "decision",
                      "name": "Python installation succeeded",
                      "test": "The locked dependency command exits with status zero",
                      "branches": {
                        "success": "saturn.cli.checkout.dependencies.node_install",
                        "otherwise": "saturn.cli.checkout.result.failed"
                      },
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "node_install",
                      "kind": "step",
                      "name": "Install locked dashboard dependencies",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Runs npm ci in apps/web through the host platform executable resolver.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "node_ok",
                      "kind": "decision",
                      "name": "Dashboard installation succeeded",
                      "test": "npm ci exits with status zero",
                      "branches": {
                        "success": "saturn.cli.checkout.dependencies.build",
                        "otherwise": "saturn.cli.checkout.result.failed"
                      },
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "build",
                      "kind": "step",
                      "name": "Build the existing dashboard",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Runs npm run build without changing frontend source, package manifests, or lockfiles.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "build_ok",
                      "kind": "decision",
                      "name": "Dashboard build succeeded",
                      "test": "The build exits with status zero and produces dist/index.html",
                      "branches": {
                        "success": "saturn.cli.checkout.environment.env_exists",
                        "otherwise": "saturn.cli.checkout.result.failed"
                      },
                      "code": "scripts/setup.py"
                    }
                  ],
                  "code": "scripts/setup.py"
                },
                {
                  "id": "environment",
                  "kind": "group",
                  "name": "Startup environment preservation",
                  "does": "Startup environment preservation",
                  "children": [
                    {
                      "id": "env_exists",
                      "kind": "decision",
                      "name": "The startup environment already exists",
                      "test": "The .env file exists in SATURN_HOME or the default per-user Saturn home",
                      "branches": {
                        "exists": "saturn.cli.checkout.environment.keep_env",
                        "otherwise": "saturn.cli.checkout.environment.input.interactive"
                      },
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "keep_env",
                      "kind": "step",
                      "name": "Keep the existing startup environment",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Preserves existing environment bytes without displaying or replacing values.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "create_env",
                      "kind": "step",
                      "name": "Create only the missing home environment",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Creates the home .env without overwriting a concurrent file. Uses private POSIX permissions and quoted dotenv values. Leaves a checkout .env untouched.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "create_outcome",
                      "kind": "decision",
                      "name": "The new environment was created safely",
                      "test": "The exclusive environment write succeeded",
                      "branches": {
                        "created": "saturn.cli.checkout.smoke.smoke_prepare",
                        "concurrent_file_exists": "saturn.cli.checkout.environment.keep_env",
                        "otherwise": "saturn.cli.checkout.result.failed"
                      },
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "input",
                      "kind": "group",
                      "name": "Startup settings input",
                      "does": "Collect and validate new startup settings",
                      "children": [
                        {
                          "id": "interactive",
                          "kind": "decision",
                          "name": "The setup can ask for settings",
                          "test": "Input is a terminal and neither --yes nor CI selects unattended defaults",
                          "branches": {
                            "guided": "saturn.cli.checkout.environment.input.ask",
                            "otherwise": "saturn.cli.checkout.environment.input.defaults"
                          },
                          "code": "scripts/setup.py"
                        },
                        {
                          "id": "ask",
                          "kind": "step",
                          "name": "Collect startup settings privately",
                          "in": "checkout_setup",
                          "out": "checkout_report",
                          "does": "Explains the startup settings from .env.example and collects values. Hides API-key input and never prints secret values.",
                          "code": "scripts/setup.py"
                        },
                        {
                          "id": "defaults",
                          "kind": "step",
                          "name": "Use optional-model defaults",
                          "in": "checkout_setup",
                          "out": "checkout_report",
                          "does": "Uses documented loopback, port, process limits, and an empty optional model API key. Downloads no model.",
                          "code": "scripts/setup.py"
                        },
                        {
                          "id": "valid",
                          "kind": "decision",
                          "name": "Startup settings are valid",
                          "test": "Startup values satisfy the existing Settings contract and can round-trip through dotenv encoding",
                          "branches": {
                            "valid": "saturn.cli.checkout.environment.create_env",
                            "otherwise": "saturn.cli.checkout.result.failed"
                          },
                          "code": "scripts/setup.py"
                        }
                      ],
                      "code": "scripts/setup.py"
                    }
                  ],
                  "code": "scripts/setup.py"
                },
                {
                  "id": "smoke",
                  "kind": "group",
                  "name": "Owned isolated smoke process",
                  "does": "Owned isolated smoke process",
                  "children": [
                    {
                      "id": "smoke_prepare",
                      "kind": "step",
                      "name": "Prepare an isolated smoke service",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Creates a disposable home and client directories under var/, clears inherited Saturn configuration and credentials, and chooses a free loopback port.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "smoke_start",
                      "kind": "step",
                      "name": "Start the owned smoke process",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Starts the installed service Python directly in a child process. Leaves regular services and real client configuration untouched.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "smoke_ok",
                      "kind": "decision",
                      "name": "The smoke service serves health and dashboard",
                      "test": "The owned child serves HTTP 200 for /api/health and the built dashboard within 60 seconds",
                      "branches": {
                        "healthy": "saturn.cli.checkout.smoke.smoke_stop",
                        "otherwise": "saturn.cli.checkout.smoke.smoke_fail_stop"
                      },
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "smoke_stop",
                      "kind": "step",
                      "name": "Stop the successful smoke process",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Stops only the owned child. Waits up to ten seconds, then terminates that child if necessary.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "smoke_fail_stop",
                      "kind": "step",
                      "name": "Stop the failed smoke process",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Stops only the owned child after failure and keeps diagnostic output under var/. Waits up to ten seconds before forced cleanup.",
                      "code": "scripts/setup.py"
                    }
                  ],
                  "code": "scripts/setup.py"
                },
                {
                  "id": "verification",
                  "kind": "group",
                  "name": "Automated checks",
                  "does": "Automated checks",
                  "children": [
                    {
                      "id": "check",
                      "kind": "event",
                      "name": "Check an installed checkout",
                      "trigger": "The developer runs python scripts/check.py or continuous integration runs the same command",
                      "code": "scripts/check.py"
                    },
                    {
                      "id": "run_checks",
                      "kind": "step",
                      "name": "Run the recorded automated checks",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Runs Python lint, types, non-live tests, setup-script contract tests, frontend checks/tests/build, the architecture checker, and the isolated startup smoke check. Uses disposable runtime and client paths.",
                      "code": "scripts/check.py"
                    },
                    {
                      "id": "checks_ok",
                      "kind": "decision",
                      "name": "All checks succeeded",
                      "test": "Every required check exits with status zero",
                      "branches": {
                        "pass": "saturn.cli.checkout.verification.checks_done",
                        "otherwise": "saturn.cli.checkout.verification.checks_failed"
                      },
                      "code": "scripts/check.py"
                    },
                    {
                      "id": "checks_done",
                      "kind": "ui",
                      "name": "Report successful checks",
                      "does": "Reports the checks that passed. Real-model, manual browser, and machine-specific checks remain separate.",
                      "code": "scripts/check.py"
                    },
                    {
                      "id": "checks_failed",
                      "kind": "ui",
                      "name": "Report failed checks",
                      "does": "Names each failed check and exits nonzero. Does not replace real configuration or start persistent services.",
                      "code": "scripts/check.py"
                    }
                  ],
                  "code": "scripts/check.py"
                },
                {
                  "id": "automation",
                  "kind": "group",
                  "name": "Continuous integration",
                  "does": "Continuous integration",
                  "children": [
                    {
                      "id": "ci",
                      "kind": "event",
                      "name": "A checkout verification workflow is triggered",
                      "trigger": "The developer manually starts the workflow with both, linux, or windows; a newer same-branch run cancels an older run.",
                      "code": ".github/workflows/ci.yml"
                    },
                    {
                      "id": "windows",
                      "kind": "decision",
                      "name": "Select the requested operating systems",
                      "test": "The manual platform choice is both, windows, or linux",
                      "branches": {
                        "both": "saturn.cli.checkout.automation.ci_windows",
                        "windows": "saturn.cli.checkout.automation.ci_windows_only",
                        "otherwise": "saturn.cli.checkout.automation.ci_linux"
                      },
                      "code": ".github/workflows/ci.yml"
                    },
                    {
                      "id": "ci_windows",
                      "kind": "step",
                      "name": "Verify Linux and Windows runners",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Checks out committed files, installs uv, the service Python pin, and the Node pin, then runs setup --yes and check.py on both runners.",
                      "code": ".github/workflows/ci.yml"
                    },
                    {
                      "id": "ci_linux",
                      "kind": "step",
                      "name": "Verify the Linux runner",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Checks out committed files, installs uv, the service Python pin, and the Node pin, then runs setup --yes and check.py on Linux.",
                      "code": ".github/workflows/ci.yml"
                    },
                    {
                      "id": "ci_windows_only",
                      "kind": "step",
                      "name": "Verify the Windows runner",
                      "in": "checkout_setup",
                      "out": "checkout_report",
                      "does": "Installs pinned tools, runs setup twice, and checks the checkout on Windows.",
                      "code": ".github/workflows/ci.yml"
                    }
                  ],
                  "code": ".github/workflows/ci.yml"
                },
                {
                  "id": "result",
                  "kind": "group",
                  "name": "Setup results",
                  "does": "Setup results",
                  "children": [
                    {
                      "id": "done",
                      "kind": "ui",
                      "name": "Show the start and check commands",
                      "does": "Reports successful preparation and the foreground serve command. Explains that model and client configuration use existing terminal or dashboard controls.",
                      "code": "scripts/setup.py"
                    },
                    {
                      "id": "failed",
                      "kind": "ui",
                      "name": "Report the failed setup step",
                      "does": "Reports the failed command or validation, a repair action, and a nonzero exit status. Existing environment and client configuration remain intact.",
                      "code": "scripts/setup.py"
                    }
                  ],
                  "code": "scripts/setup.py"
                }
              ],
              "code": [
                "scripts/setup.py",
                "scripts/check.py",
                ".github/workflows/ci.yml"
              ]
            }
          ],
          "code": [
            "services/saturn/src/saturn/bootstrap/cli.py",
            "services/saturn/src/saturn/bootstrap/setup_cli.py",
            "services/saturn/src/saturn/bootstrap/admin_cli.py"
          ]
        },
        {
          "id": "home",
          "kind": "group",
          "name": "Saturn home files",
          "does": "Keeps installation configuration, credentials, managed-file backups, and installation records outside project checkouts.",
          "children": [
            {
              "id": "home_env",
              "name": "Startup environment",
              "kind": "store",
              "keeps": [
                "startup_settings"
              ],
              "code": "services/saturn/src/saturn/infrastructure/config.py",
              "does": "Startup environment"
            },
            {
              "id": "home_settings",
              "name": "Runtime settings and command policy",
              "kind": "store",
              "keeps": [
                "settings",
                "policy",
                "config_stamp"
              ],
              "code": "services/saturn/src/saturn/infrastructure/config_files.py",
              "does": "Runtime settings and command policy"
            },
            {
              "id": "home_credentials",
              "name": "Harness token files",
              "kind": "store",
              "keeps": "credential",
              "code": "services/saturn/src/saturn/infrastructure/credential_files.py",
              "rules": [
                "Credential files use the harness handle. Their contents never enter client registration entries."
              ],
              "does": "Harness token files"
            },
            {
              "id": "home_installs",
              "name": "Install records and client-file backups",
              "kind": "store",
              "keeps": [
                "install_record",
                "client_entries"
              ],
              "code": "services/saturn/src/saturn/infrastructure/clients/files.py",
              "does": "Install records and client-file backups"
            }
          ],
          "code": "services/saturn/src/saturn/infrastructure/config.py"
        },
        {
          "id": "database",
          "name": "SQLite evidence and access store",
          "kind": "store",
          "keeps": [
            "run",
            "span",
            "model_call",
            "artifact",
            "harness_record",
            "audit_event",
            "payload",
            "kv"
          ],
          "code": "services/saturn/src/saturn/infrastructure/db.py",
          "does": "Keeps one installation's shared evidence and access metadata. Harnesses do not have isolated stores."
        },
        {
          "id": "dashboard",
          "kind": "ui",
          "name": "Browser dashboard",
          "does": "Shows service evidence and local controls. Browser navigation and preferences stay in the browser.",
          "children": [
            {
              "id": "inspect",
              "kind": "group",
              "name": "Evidence views",
              "does": "Evidence views",
              "children": [
                {
                  "id": "ui_overview",
                  "name": "Open Overview",
                  "kind": "event",
                  "trigger": "The developer opens Overview",
                  "code": "apps/web/src/features"
                },
                {
                  "id": "ui_runs",
                  "name": "Open Runs or a trace",
                  "kind": "event",
                  "trigger": "The developer filters runs or selects a run",
                  "code": "apps/web/src/features"
                },
                {
                  "id": "ui_artifacts",
                  "name": "Open stored output",
                  "kind": "event",
                  "trigger": "The developer opens an artifact page",
                  "code": "apps/web/src/features"
                },
                {
                  "id": "ui_changes",
                  "name": "Open Changes",
                  "kind": "event",
                  "trigger": "The developer filters audit events",
                  "code": "apps/web/src/features"
                },
                {
                  "id": "ui_model",
                  "name": "Inspect model status",
                  "kind": "event",
                  "trigger": "The developer opens the Model view",
                  "code": "apps/web/src/features"
                },
                {
                  "id": "ui_evidence",
                  "name": "Show evidence tables, charts, and trace details",
                  "kind": "ui",
                  "does": "Displays bounded projections, payload expiry, captured source lines, and model usage.",
                  "code": "apps/web/src/features"
                }
              ],
              "code": "apps/web/src/features"
            },
            {
              "id": "settings",
              "kind": "group",
              "name": "Settings controls",
              "does": "Settings controls",
              "children": [
                {
                  "id": "ui_settings",
                  "name": "Open Settings",
                  "kind": "event",
                  "trigger": "The developer opens Settings",
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_save",
                  "name": "Save model or output settings",
                  "kind": "event",
                  "trigger": "The developer saves a valid settings draft",
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_test",
                  "name": "Test the saved model",
                  "kind": "event",
                  "trigger": "The developer requests one model tool-call test",
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_policy",
                  "name": "Test a command policy",
                  "kind": "event",
                  "trigger": "The developer asks whether a command would run",
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_dirty",
                  "name": "Unsaved draft on navigation",
                  "kind": "decision",
                  "test": "A dirty form would be discarded by leaving the view",
                  "branches": {
                    "dirty": "saturn.dashboard.settings.ui_discard",
                    "otherwise": "saturn.dashboard.settings.ui_render"
                  },
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_discard",
                  "name": "Discard confirmed",
                  "kind": "decision",
                  "test": "The developer confirms discarding unsaved edits",
                  "branches": {
                    "discard": "saturn.dashboard.settings.ui_render",
                    "otherwise": "saturn.dashboard.settings.ui_keep"
                  },
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_keep",
                  "name": "Keep the current draft",
                  "kind": "ui",
                  "does": "Keep the current draft",
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                },
                {
                  "id": "ui_render",
                  "name": "Show settings, provider status, and validation messages",
                  "kind": "ui",
                  "does": "Show settings, provider status, and validation messages",
                  "code": "apps/web/src/features/settings/ModelTab.svelte"
                }
              ],
              "code": "apps/web/src/features/settings/ModelTab.svelte"
            },
            {
              "id": "connections",
              "kind": "group",
              "name": "Client access controls",
              "does": "Client access controls",
              "children": [
                {
                  "id": "ui_connections",
                  "name": "Open Connections",
                  "kind": "event",
                  "trigger": "The developer opens Connections",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_create",
                  "name": "Create a harness",
                  "kind": "event",
                  "trigger": "The developer submits a new harness",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_edit",
                  "name": "Edit harness access",
                  "kind": "event",
                  "trigger": "The developer changes harness tools, folders, expiry, or enabled state",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_rotate",
                  "name": "Rotate a token",
                  "kind": "event",
                  "trigger": "The developer confirms token rotation",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_revoke",
                  "name": "Revoke a harness",
                  "kind": "event",
                  "trigger": "The developer confirms permanent revocation",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_install",
                  "name": "Preview or install client entries",
                  "kind": "event",
                  "trigger": "The developer previews installation and then chooses Install",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_remove",
                  "name": "Remove client entries",
                  "kind": "event",
                  "trigger": "The developer confirms removal from a client",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                },
                {
                  "id": "ui_access",
                  "name": "Show harnesses, previews, and installation outcomes",
                  "kind": "ui",
                  "does": "Show harnesses, previews, and installation outcomes",
                  "code": "apps/web/src/features/connections/ConnectionsView.svelte"
                }
              ],
              "code": "apps/web/src/features/connections/ConnectionsView.svelte"
            },
            {
              "id": "polling",
              "kind": "group",
              "name": "Live resource state",
              "does": "Live resource state",
              "children": [
                {
                  "id": "ui_poll",
                  "name": "Refresh a visible resource",
                  "kind": "event",
                  "trigger": "The polling deadline or an explicit refresh requests a fetch",
                  "code": "apps/web/src/lib/live/poll.ts"
                },
                {
                  "id": "poll_active",
                  "name": "Visible and online",
                  "kind": "decision",
                  "test": "The tab is visible, the device is online, and the poller is running",
                  "branches": {
                    "active": "saturn.dashboard.polling.poll_inflight",
                    "otherwise": "saturn.dashboard.polling.poll_pause"
                  },
                  "code": "apps/web/src/lib/live/poll.ts"
                },
                {
                  "id": "poll_inflight",
                  "name": "Fetch already running",
                  "kind": "decision",
                  "test": "A request is already in flight",
                  "branches": {
                    "running": "saturn.dashboard.polling.poll_again",
                    "otherwise": "saturn.dashboard.polling.request.poll_fetch"
                  },
                  "code": "apps/web/src/lib/live/poll.ts"
                },
                {
                  "id": "poll_again",
                  "name": "Request one follow-up fetch",
                  "kind": "ui",
                  "does": "Coalesces refresh requests until the current fetch finishes.",
                  "code": "apps/web/src/lib/live/poll.ts"
                },
                {
                  "id": "poll_pause",
                  "name": "Abort the request and advance the generation",
                  "kind": "ui",
                  "does": "Cancels timers and ignores responses from an older generation.",
                  "code": "apps/web/src/lib/live/poll.ts"
                },
                {
                  "id": "request",
                  "kind": "group",
                  "name": "Fetch generations",
                  "does": "Fetch generations",
                  "children": [
                    {
                      "id": "poll_fetch",
                      "name": "Fetch the selected JSON projection",
                      "kind": "step",
                      "code": "apps/web/src/lib/api/http.ts",
                      "in": "owner_request",
                      "out": "owner_request",
                      "does": "Fetch the selected JSON projection"
                    },
                    {
                      "id": "poll_current",
                      "name": "Current response generation",
                      "kind": "decision",
                      "test": "The returned response belongs to the latest generation",
                      "branches": {
                        "current": "saturn.dashboard.polling.request.poll_success",
                        "otherwise": "saturn.dashboard.polling.poll_pause"
                      },
                      "code": "apps/web/src/lib/live/poll.ts"
                    },
                    {
                      "id": "poll_success",
                      "name": "Fetch succeeded",
                      "kind": "decision",
                      "test": "The JSON request returned a usable result",
                      "branches": {
                        "success": "saturn.dashboard.polling.result.poll_ready",
                        "otherwise": "saturn.dashboard.polling.result.poll_has_data"
                      },
                      "code": "apps/web/src/lib/live/poll.ts"
                    }
                  ],
                  "code": "apps/web/src/lib/live/poll.ts"
                },
                {
                  "id": "result",
                  "kind": "group",
                  "name": "Ready, stale, and error states",
                  "does": "Ready, stale, and error states",
                  "children": [
                    {
                      "id": "poll_ready",
                      "name": "Publish data and clear the stale error",
                      "kind": "ui",
                      "code": "apps/web/src/lib/live/resource.svelte.ts",
                      "does": "Publish data and clear the stale error"
                    },
                    {
                      "id": "poll_has_data",
                      "name": "Previous data available",
                      "kind": "decision",
                      "test": "The resource has a previous successful value",
                      "branches": {
                        "available": "saturn.dashboard.polling.result.poll_stale",
                        "otherwise": "saturn.dashboard.polling.result.poll_error"
                      },
                      "code": "apps/web/src/lib/live/resource.svelte.ts"
                    },
                    {
                      "id": "poll_stale",
                      "name": "Retain the last data and mark it stale",
                      "kind": "ui",
                      "code": "apps/web/src/lib/live/resource.svelte.ts",
                      "does": "Retain the last data and mark it stale"
                    },
                    {
                      "id": "poll_error",
                      "name": "Show the initial error and Retry action",
                      "kind": "ui",
                      "code": "apps/web/src/lib/live/resource.svelte.ts",
                      "does": "Show the initial error and Retry action"
                    },
                    {
                      "id": "poll_backoff",
                      "name": "Schedule the next fetch with backoff and jitter",
                      "kind": "ui",
                      "rules": [
                        "Failure backoff is exponential, capped at 60 s by default, with 0.9–1.1 jitter."
                      ],
                      "does": "Schedule the next fetch with backoff and jitter",
                      "code": "apps/web/src/lib/live/resource.svelte.ts"
                    }
                  ],
                  "code": "apps/web/src/lib/live/resource.svelte.ts"
                }
              ],
              "code": "apps/web/src/lib/live/poll.ts"
            },
            {
              "id": "shell",
              "kind": "group",
              "name": "Navigation, appearance, and chart access",
              "does": "Navigation, appearance, and chart access",
              "children": [
                {
                  "id": "ui_navigate",
                  "name": "Change screen or appearance",
                  "kind": "event",
                  "trigger": "The developer changes the route, theme, or density",
                  "code": "apps/web/src/features/shell"
                },
                {
                  "id": "ui_storage",
                  "name": "Browser storage available",
                  "kind": "decision",
                  "test": "Browser preferences can be read or written",
                  "branches": {
                    "available": "saturn.dashboard.shell.ui_preferences",
                    "otherwise": "saturn.dashboard.shell.ui_memory"
                  },
                  "code": "apps/web/src/features/shell"
                },
                {
                  "id": "ui_preferences",
                  "name": "Browser preference store",
                  "kind": "store",
                  "keeps": "browser_state",
                  "code": "apps/web/src/lib/state/prefs.svelte.ts",
                  "does": "Browser preference store"
                },
                {
                  "id": "ui_memory",
                  "name": "Keep preferences in memory",
                  "kind": "ui",
                  "does": "Keeps the interface usable without persistent browser storage.",
                  "code": "apps/web/src/features/shell"
                },
                {
                  "id": "ui_navigation",
                  "name": "Render labeled navigation for the current layout",
                  "kind": "ui",
                  "code": "apps/web/src/lib/state/routes.ts",
                  "does": "Render labeled navigation for the current layout"
                },
                {
                  "id": "ui_chart",
                  "name": "Inspect a chart",
                  "kind": "event",
                  "trigger": "The developer uses pointer, keyboard, or the table alternative",
                  "code": "apps/web/src/features/shell"
                },
                {
                  "id": "ui_chart_view",
                  "name": "Show the selected sample or data table",
                  "kind": "ui",
                  "code": "apps/web/src/lib/ui/Chart.svelte",
                  "does": "Show the selected sample or data table"
                }
              ],
              "code": "apps/web/src/features/shell"
            }
          ],
          "code": "apps/web/src/App.svelte"
        }
      ],
      "choice": "One local, single-user system",
      "why": "The service, CLI, dashboard, and stores use the same local configuration and application contracts.",
      "rejected": [
        "Separate stored data per harness: the implemented store is shared.",
        "Operating-system isolation: commands run with the developer account."
      ]
    },
    {
      "id": "evaluation",
      "name": "Fixture evaluation caller",
      "kind": "external",
      "lane": "left",
      "code": "services/saturn/evals/run_evals.py",
      "does": "Calls an isolated Saturn with an evaluation-only credential, compares expected fixture results, restores saved settings, and writes reports."
    },
    {
      "id": "benchmark",
      "name": "Independent benchmark preparation",
      "kind": "group",
      "lane": "left",
      "does": "Builds one reviewed, versioned corpus outside the Saturn runtime.",
      "children": [
        {
          "id": "curation",
          "name": "Corpus preparation process",
          "kind": "group",
          "does": "Acquires sources, labels expected results, validates the corpus, and freezes accepted assets.",
          "children": [
            {
              "id": "sources",
              "name": "Source acquisition",
              "kind": "group",
              "does": "Records provenance and acquires immutable source assets.",
              "children": [
                {
                  "id": "start",
                  "name": "Prepare the shared golden dataset",
                  "kind": "event",
                  "trigger": "The developer requests dataset preparation",
                  "code": "bench/corpus.py"
                },
                {
                  "id": "select",
                  "name": "Record source selection and provenance",
                  "kind": "step",
                  "in": "none",
                  "out": "golden_manifest",
                  "does": "Record source selection and provenance",
                  "rules": [
                    "One corpus for every benchmark workload.",
                    "Real redistributable inputs take precedence.",
                    "Historical Saturn fixtures remain development-only."
                  ],
                  "code": "bench/dataset/selection.json"
                },
                {
                  "id": "licence",
                  "name": "Source provenance permits acquisition",
                  "kind": "decision",
                  "test": "Each selected source has an immutable reference and a redistribution licence",
                  "branches": {
                    "valid": "benchmark.curation.sources.capture",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                },
                {
                  "id": "capture",
                  "name": "Acquire and hash source assets",
                  "kind": "step",
                  "in": "golden_manifest",
                  "out": "golden_assets",
                  "does": "Acquire and hash source assets",
                  "rules": [
                    "Download source data without executing remote scripts.",
                    "Reviewed capture commands run in disposable workspaces.",
                    "Original and normalized capture hashes remain distinct."
                  ],
                  "code": "bench/dataset/captures.json"
                },
                {
                  "id": "assets_valid",
                  "name": "Acquired assets match their source records",
                  "kind": "decision",
                  "test": "Every asset hash, relative path, licence record, and capture record is valid",
                  "branches": {
                    "valid": "benchmark.curation.labels.oracle",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                }
              ],
              "code": [
                "bench/dataset/manifest.json",
                "bench/dataset/captures.json",
                "bench/corpus.py"
              ]
            },
            {
              "id": "labels",
              "name": "Independent expected results",
              "kind": "group",
              "does": "Defines source-grounded labels and checks coverage, split separation, and independent review.",
              "children": [
                {
                  "id": "oracle",
                  "name": "Label required facts from independent source evidence",
                  "kind": "step",
                  "in": "golden_assets",
                  "out": "golden_labels",
                  "does": "Label required facts from independent source evidence",
                  "rules": [
                    "No expected answer is derived from Saturn or a model response.",
                    "Cases declare follow-ups, supported facts, refusals, and abstention.",
                    "Labels stay outside the workspace exposed to the worker."
                  ],
                  "code": "bench/dataset/cases.json"
                },
                {
                  "id": "split",
                  "name": "Assign whole source families to one split",
                  "kind": "step",
                  "in": "golden_labels",
                  "out": "golden_manifest",
                  "does": "Assign whole source families to one split",
                  "rules": [
                    "Related projects, controlled variants, and copied content share a source family."
                  ],
                  "code": [
                    "bench/dataset/selection.json",
                    "bench/dataset/cases.json"
                  ]
                },
                {
                  "id": "separated",
                  "name": "Development and evaluation contain independent families",
                  "kind": "decision",
                  "test": "Source ancestry review and duplicate checks show no unresolved split leakage",
                  "branches": {
                    "valid": "benchmark.curation.labels.coverage",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                },
                {
                  "id": "coverage",
                  "name": "The corpus meets the declared coverage contract",
                  "kind": "decision",
                  "test": "The candidate meets the 60-case minimum, the 20/40 family-separated split, equal primary-tool coverage, and the source-diversity contract",
                  "branches": {
                    "valid": "benchmark.curation.labels.review",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                },
                {
                  "id": "review",
                  "name": "Record independent review of semantic labels",
                  "kind": "step",
                  "in": "golden_labels",
                  "out": "golden_report",
                  "does": "Record independent review of semantic labels",
                  "rules": [
                    "Exact evidence and deterministic oracles are checked against the assets.",
                    "A model judge cannot be the sole label authority.",
                    "Disagreements remain explicit until resolved."
                  ],
                  "code": "bench/corpus.py"
                },
                {
                  "id": "reviewed",
                  "name": "All expected results have completed review",
                  "kind": "decision",
                  "test": "Every semantic label has independent human review and every disagreement is resolved",
                  "branches": {
                    "valid": "benchmark.curation.freeze.validate",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                }
              ],
              "code": "bench/corpus.py"
            },
            {
              "id": "freeze",
              "name": "Corpus validation",
              "kind": "group",
              "does": "Blocks invalid candidates and freezes a fully reviewed corpus.",
              "children": [
                {
                  "id": "validate",
                  "name": "Validate schemas, hashes, coverage, and scoring rules",
                  "kind": "step",
                  "in": "golden_manifest",
                  "out": "golden_report",
                  "does": "Validate schemas, hashes, coverage, and scoring rules",
                  "code": "bench/corpus.py"
                },
                {
                  "id": "valid",
                  "name": "The complete corpus validates",
                  "kind": "decision",
                  "test": "The corpus schema, asset hashes, source links, evidence, coverage, and review records all pass",
                  "branches": {
                    "valid": "benchmark.curation.freeze.publish",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                },
                {
                  "id": "publish",
                  "name": "Freeze the versioned corpus and scoring identity",
                  "kind": "step",
                  "in": "golden_report",
                  "out": "golden_manifest",
                  "does": "Freeze the versioned corpus and scoring identity",
                  "rules": [
                    "A content or scoring change creates a new version.",
                    "All workload schedules reference this manifest and its case IDs.",
                    "The dataset contract adds no production queue or timing instrumentation."
                  ],
                  "code": "bench/corpus.py"
                },
                {
                  "id": "reject",
                  "name": "Record why the candidate cannot be frozen",
                  "kind": "step",
                  "in": "golden_report",
                  "out": "golden_report",
                  "does": "Record why the candidate cannot be frozen",
                  "code": "bench/corpus.py"
                }
              ],
              "code": "bench/corpus.py"
            }
          ],
          "code": "bench/corpus.py"
        },
        {
          "id": "dataset",
          "name": "One versioned golden dataset",
          "kind": "store",
          "keeps": [
            "golden_manifest",
            "golden_assets",
            "golden_labels"
          ],
          "does": "Keeps the shared assets, case catalogue, reviewed labels, and immutable corpus identity.",
          "code": "bench/dataset/manifest.json"
        },
        {
          "id": "reports",
          "name": "Dataset validation records",
          "kind": "store",
          "keeps": [
            "golden_report"
          ],
          "does": "Keeps coverage, exclusions, limitations, duplicate checks, and freeze failures.",
          "code": "bench/corpus.py"
        },
        {
          "id": "access",
          "name": "Corpus inspection and input workspaces",
          "kind": "group",
          "does": "Validates the same corpus, prepares label review, materializes inputs, or requests freezing.",
          "code": "bench/__main__.py",
          "children": [
            {
              "id": "invoke",
              "name": "Inspect or prepare the shared corpus",
              "kind": "event",
              "trigger": "The developer runs the corpus CLI",
              "code": "bench/__main__.py"
            },
            {
              "id": "load",
              "name": "Read the corpus and compute its integrity report",
              "kind": "step",
              "in": "golden_manifest",
              "out": "golden_report",
              "does": "Read the corpus and compute its integrity report",
              "code": "bench/corpus.py"
            },
            {
              "id": "integrity",
              "name": "The corpus passes integrity validation",
              "kind": "decision",
              "test": "All schemas, hashes, source evidence, coverage, and split checks pass",
              "branches": {
                "valid": "benchmark.access.mode",
                "otherwise": "benchmark.curation.freeze.reject"
              },
              "code": "bench/corpus.py"
            },
            {
              "id": "mode",
              "name": "Select the requested corpus operation",
              "kind": "decision",
              "test": "The CLI operation is validate, review, materialize, or freeze",
              "branches": {
                "validate": "benchmark.access.report",
                "review": "benchmark.access.packet",
                "materialize": "benchmark.access.workspace.destination",
                "freeze": "benchmark.curation.labels.reviewed",
                "otherwise": "benchmark.curation.freeze.reject"
              },
              "code": "bench/corpus.py"
            },
            {
              "id": "report",
              "name": "Report integrity and review readiness separately",
              "kind": "step",
              "in": "golden_report",
              "out": "golden_report",
              "does": "Report integrity and review readiness separately",
              "code": "bench/corpus.py"
            },
            {
              "id": "packet",
              "name": "Prepare independent-review records with oracle hashes",
              "kind": "step",
              "in": "golden_report",
              "out": "golden_labels",
              "does": "Prepare independent-review records with oracle hashes",
              "code": "bench/corpus.py",
              "rules": [
                "No reviewer identity or acceptance is invented."
              ]
            },
            {
              "id": "workspace",
              "name": "Input-only workspace",
              "kind": "group",
              "does": "Creates a separate workspace that excludes scoring metadata and labels.",
              "code": "bench/corpus.py",
              "children": [
                {
                  "id": "destination",
                  "name": "The destination is a separate empty folder",
                  "kind": "decision",
                  "test": "The destination is empty and neither contains nor lies inside the dataset",
                  "branches": {
                    "valid": "benchmark.access.workspace.copy",
                    "otherwise": "benchmark.curation.freeze.reject"
                  },
                  "code": "bench/corpus.py"
                },
                {
                  "id": "copy",
                  "name": "Copy registered input assets without labels",
                  "kind": "step",
                  "in": "golden_manifest",
                  "out": "golden_workspace",
                  "does": "Copy registered input assets without labels",
                  "code": "bench/corpus.py",
                  "rules": [
                    "Only manifest assets are copied.",
                    "Manifest, case catalogue, schema, and review records stay outside the workspace.",
                    "Synthetic credential input uses its explicit workspace path."
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "workspace",
          "name": "Materialized benchmark inputs",
          "kind": "store",
          "keeps": [
            "golden_workspace"
          ],
          "does": "Keeps disposable source assets and captures without scoring labels.",
          "code": "bench/corpus.py"
        },
        {
          "id": "execution",
          "name": "Benchmark execution contract",
          "kind": "group",
          "does": "Plans isolated public-interface measurements against the shared corpus.",
          "children": [
            {
              "id": "prepare",
              "kind": "group",
              "name": "Isolated execution preparation",
              "does": "Isolated execution preparation",
              "children": [
                {
                  "id": "start",
                  "kind": "event",
                  "name": "Request all benchmark workloads",
                  "trigger": "The developer requests the benchmark execution suite",
                  "code": "bench/runner.py"
                },
                {
                  "id": "plan",
                  "kind": "step",
                  "name": "Record schedules, environment, identities, and resource limits",
                  "does": "Record schedules, environment, identities, and resource limits",
                  "in": "golden_manifest",
                  "out": "benchmark_plan",
                  "rules": [
                    "Five measured passes follow one excluded warm-up pass.",
                    "Two clean-start reproduction runs use one measured pass each.",
                    "Current worker plus two local alternatives use identical case IDs.",
                    "No worker prompt tuning uses evaluation cases."
                  ],
                  "code": "bench/execution.py"
                },
                {
                  "id": "valid",
                  "kind": "decision",
                  "name": "The corpus identity is intact",
                  "test": "Corpus validation and all input hashes pass",
                  "branches": {
                    "valid": "benchmark.execution.prepare.reviewed",
                    "otherwise": "benchmark.execution.finish.fail"
                  },
                  "code": "bench/runner.py"
                },
                {
                  "id": "reviewed",
                  "kind": "decision",
                  "name": "Independent semantic review is complete",
                  "test": "The corpus has a valid freeze marker and accepted review records",
                  "branches": {
                    "reviewed": "benchmark.execution.prepare.isolate",
                    "otherwise": "benchmark.execution.prepare.provisional"
                  },
                  "code": "bench/runner.py"
                },
                {
                  "id": "provisional",
                  "kind": "step",
                  "name": "Mark every result provisional and preserve the candidate identity",
                  "does": "Mark every result provisional and preserve the candidate identity",
                  "in": "benchmark_plan",
                  "out": "benchmark_plan",
                  "rules": [
                    "No accepted golden-quality result or final model ranking.",
                    "No automatic reviewer acceptance or label change."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "isolate",
                  "kind": "step",
                  "name": "Start an owned service and create input-only workspaces and harnesses",
                  "does": "Start an owned service and create input-only workspaces and harnesses",
                  "in": "benchmark_plan",
                  "out": "benchmark_plan",
                  "rules": [
                    "All runtime state belongs under var/bench/.",
                    "Use public CLI, MCP, and HTTP interfaces only.",
                    "Never change regular client files, home, policy, or model configuration.",
                    "Benchmark-owned workers use 32,768 context tokens and full GPU layer offload.",
                    "Only the current benchmark-owned worker remains resident; pre-existing models remain untouched."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "ready",
                  "kind": "decision",
                  "name": "The isolated service and selected models are available",
                  "test": "Public health, authentication, and model compatibility checks pass",
                  "branches": {
                    "ready": "benchmark.execution.workload.schedule",
                    "otherwise": "benchmark.execution.finish.cleanup"
                  },
                  "code": "bench/runner.py"
                }
              ],
              "code": "bench/runner.py"
            },
            {
              "id": "workload",
              "kind": "group",
              "name": "Shared-corpus workload execution",
              "does": "Shared-corpus workload execution",
              "children": [
                {
                  "id": "schedule",
                  "kind": "step",
                  "name": "Balance model order and select fixed corpus case-ID schedules",
                  "does": "Balance model order and select fixed corpus case-ID schedules",
                  "in": "benchmark_plan",
                  "out": "benchmark_plan",
                  "rules": [
                    "All 40 evaluation workflows run for each selected model.",
                    "Load runs use the current worker, concurrency 1, 2, and 4.",
                    "Separate harnesses cover balanced, busy-versus-quiet, and bounded burst schedules.",
                    "Cancellation uses lifecycle-eligible corpus cases."
                  ],
                  "code": "bench/execution.py"
                },
                {
                  "id": "replay",
                  "kind": "step",
                  "name": "Translate stored captures and workflow requests into public tool arguments",
                  "does": "Translate stored captures and workflow requests into public tool arguments",
                  "in": "benchmark_plan",
                  "out": "tool_call",
                  "rules": [
                    "Capture replay includes process startup and excludes original upstream command duration.",
                    "A local replay helper emits only registered capture bytes and recorded exit status.",
                    "The isolated policy permits only the fixed replay command.",
                    "Artifact follow-ups bind the producer from the same workflow and harness."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "dispatch",
                  "kind": "step",
                  "name": "Submit authenticated calls and record monotonic timing",
                  "does": "Submit authenticated calls and record monotonic timing",
                  "in": "tool_call",
                  "out": "benchmark_observation",
                  "rules": [
                    "One in-flight request per harness supports unambiguous public run correlation.",
                    "Observer process records scheduled, submitted, completed, and cancelled timestamps."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "cancel",
                  "kind": "decision",
                  "name": "The scheduled request requires cancellation",
                  "test": "The corpus lifecycle permits cancellation and the schedule selects it",
                  "branches": {
                    "cancel": "benchmark.execution.workload.cancel_call",
                    "otherwise": "benchmark.execution.observe.collect"
                  },
                  "code": "bench/runner.py"
                },
                {
                  "id": "cancel_call",
                  "kind": "step",
                  "name": "Send protocol cancellation and check completion and recovery",
                  "does": "Send protocol cancellation and check completion and recovery",
                  "in": "benchmark_observation",
                  "out": "benchmark_observation",
                  "rules": [
                    "Report late completion separately from acknowledged cancellation.",
                    "Verify the next ordinary corpus request completes."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "more",
                  "kind": "decision",
                  "name": "The suite has remaining scheduled work within its time budget",
                  "test": "More selected workflows remain and the six-hour suite limit has not expired",
                  "branches": {
                    "more": "benchmark.execution.workload.schedule",
                    "otherwise": "benchmark.execution.finish.cleanup"
                  },
                  "code": "bench/runner.py"
                }
              ],
              "code": "bench/runner.py"
            },
            {
              "id": "observe",
              "kind": "group",
              "name": "Measurement and scoring",
              "does": "Measurement and scoring",
              "children": [
                {
                  "id": "collect",
                  "kind": "step",
                  "name": "Collect responses, public traces, usage, and process resources",
                  "does": "Collect responses, public traces, usage, and process resources",
                  "in": "benchmark_observation",
                  "out": "benchmark_observation",
                  "rules": [
                    "Observe owned service process and descendant CPU and peak resident memory at 100 ms intervals.",
                    "Model-server resources remain separate and require observable process ownership.",
                    "Never infer internal queue wait by subtracting unrelated latency samples.",
                    "Unobservable internal queue wait and provider usage remain unavailable."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "score",
                  "kind": "step",
                  "name": "Apply deterministic oracles and prepare blind semantic review",
                  "does": "Apply deterministic oracles and prepare blind semantic review",
                  "in": "benchmark_observation",
                  "out": "benchmark_observation",
                  "rules": [
                    "Use fixed corpus scoring rules and per-tool macro averages.",
                    "Keep latency, expected refusal, command failure, and infrastructure failure distinct.",
                    "Semantic output grades remain provisional until independent review.",
                    "Every failed, incompatible, cancelled, timed-out, and unexecuted case remains visible."
                  ],
                  "code": "bench/execution.py"
                },
                {
                  "id": "persist",
                  "kind": "step",
                  "name": "Persist raw observations and complete-workflow sizes",
                  "does": "Persist raw observations and complete-workflow sizes",
                  "in": "benchmark_observation",
                  "out": "benchmark_observation",
                  "rules": [
                    "Raw records go to var/bench/<run-id>/.",
                    "Keep UTF-8 bytes, token estimates, and provider-reported usage separate.",
                    "Correlate runs by isolated harness and request identity, never by latest global sequence."
                  ],
                  "code": "bench/runner.py"
                }
              ],
              "code": "bench/runner.py"
            },
            {
              "id": "finish",
              "kind": "group",
              "name": "Recovery and comparison",
              "does": "Recovery and comparison",
              "children": [
                {
                  "id": "fail",
                  "kind": "step",
                  "name": "Record preflight refusal without submitting benchmark calls",
                  "does": "Record preflight refusal without submitting benchmark calls",
                  "in": "benchmark_plan",
                  "out": "benchmark_report",
                  "code": "bench/runner.py"
                },
                {
                  "id": "cleanup",
                  "kind": "step",
                  "name": "Stop owned processes and revoke temporary access",
                  "does": "Stop owned processes and revoke temporary access",
                  "in": "benchmark_observation",
                  "out": "benchmark_observation",
                  "rules": [
                    "Cleanup runs on success, interruption, timeout, and error.",
                    "Retain models loaded before the suite.",
                    "Unload only benchmark-owned models.",
                    "Preserve raw evidence and record cleanup failures."
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "compare",
                  "kind": "step",
                  "name": "Compare clean starts and compatible baseline records",
                  "does": "Compare clean starts and compatible baseline records",
                  "in": "benchmark_observation",
                  "out": "benchmark_report",
                  "rules": [
                    "First run establishes the initial service baseline.",
                    "A missing compatible historical baseline is unavailable, never invented.",
                    "Raw asset size is a size reference, not an equivalent quality baseline.",
                    "Report p50/p95 and sample counts; suppress p99 below 100 samples.",
                    "Regression tolerances are diagnostic: 20% p95 latency, 10% throughput, and two percentage points quality.",
                    "No retrospective absolute service-level target is invented."
                  ],
                  "code": "bench/execution.py"
                },
                {
                  "id": "report",
                  "kind": "step",
                  "name": "Write durable results with coverage, limitations, and unmeasured items",
                  "does": "Write durable results with coverage, limitations, and unmeasured items",
                  "in": "benchmark_report",
                  "out": "benchmark_report",
                  "rules": [
                    "Durable summaries go to private/artifacts/bench/<date>/.",
                    "Publish no final quality ranking before independent label and output review."
                  ],
                  "code": "bench/runner.py"
                }
              ],
              "code": "bench/runner.py"
            },
            {
              "id": "internal_latency",
              "kind": "group",
              "name": "Internal-stage latency contract",
              "does": "Internal-stage latency contract",
              "children": [
                {
                  "id": "prepare",
                  "kind": "group",
                  "name": "Internal-latency execution preparation",
                  "does": "Internal-latency execution preparation",
                  "children": [
                    {
                      "id": "start",
                      "kind": "event",
                      "name": "Request internal-stage latency measurements",
                      "trigger": "The developer requests the internal-latency benchmark",
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "plan",
                      "kind": "step",
                      "name": "Record immutable schedules, timing schema, and hardware conditions",
                      "does": "Record immutable schedules, timing schema, and hardware conditions",
                      "in": "golden_manifest",
                      "out": "internal_latency_plan",
                      "rules": [
                        "Two conditions: model-disabled core and current-worker semaphore context.",
                        "Each condition schedules 1020 workflows: 880 measured and 140 excluded.",
                        "The overhead experiment schedules 200 paired observations and 40 excluded warm-ups.",
                        "Whole suite: 2280 workflows; seed 20261029; six-hour cap.",
                        "Capture CPU/core counts, affinity/container limits, RAM/swap, OS, clock resolution, data-device/filesystem, and available power/thermal/load counters.",
                        "Unavailable hardware counters remain unavailable; no host tuning or new monitoring installation."
                      ],
                      "code": "bench/execution.py"
                    },
                    {
                      "id": "hardware",
                      "kind": "group",
                      "name": "Hardware counter availability",
                      "does": "Records available hardware values and explicit unavailable values without host changes.",
                      "children": [
                        {
                          "id": "read",
                          "kind": "step",
                          "name": "Read the next unprivileged hardware or host-state counter",
                          "does": "Read the next unprivileged hardware or host-state counter",
                          "in": "internal_latency_plan",
                          "out": "internal_latency_plan",
                          "code": "bench/runner.py"
                        },
                        {
                          "id": "available",
                          "kind": "decision",
                          "name": "The requested counter is readable",
                          "test": "The counter is supported and readable without privilege changes",
                          "branches": {
                            "available": "benchmark.execution.internal_latency.prepare.hardware.keep",
                            "otherwise": "benchmark.execution.internal_latency.prepare.hardware.unknown"
                          },
                          "code": "bench/runner.py"
                        },
                        {
                          "id": "keep",
                          "kind": "step",
                          "name": "Record the observed counter value and its source",
                          "does": "Record the observed counter value and its source",
                          "in": "internal_latency_plan",
                          "out": "internal_latency_plan",
                          "code": "bench/runner.py"
                        },
                        {
                          "id": "unknown",
                          "kind": "step",
                          "name": "Record an unavailable value and its reason",
                          "does": "Record an unavailable value and its reason",
                          "in": "internal_latency_plan",
                          "out": "internal_latency_plan",
                          "code": "bench/runner.py"
                        },
                        {
                          "id": "more",
                          "kind": "decision",
                          "name": "Hardware fields remain to be inspected",
                          "test": "More predeclared environment fields remain",
                          "branches": {
                            "more": "benchmark.execution.internal_latency.prepare.hardware.read",
                            "otherwise": "benchmark.execution.internal_latency.prepare.valid"
                          },
                          "code": "bench/runner.py"
                        }
                      ],
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "valid",
                      "kind": "decision",
                      "name": "The shared corpus retains its recorded identity",
                      "test": "Schemas, registered source hashes, case IDs, and split checks pass",
                      "branches": {
                        "valid": "benchmark.execution.internal_latency.prepare.isolate",
                        "otherwise": "benchmark.execution.internal_latency.reporting.fail"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "isolate",
                      "kind": "step",
                      "name": "Prepare owned service homes and the existing input-only workspace",
                      "does": "Prepare owned service homes and the existing input-only workspace",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_plan",
                      "rules": [
                        "Startup-only profiling flag; default remains disabled.",
                        "Do not change regular home, clients, policy, model residency, or labels.",
                        "Pending independent review preserves provisional status."
                      ],
                      "code": "bench/runner.py"
                    }
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "measure",
                  "kind": "group",
                  "name": "Fixed internal-latency conditions",
                  "does": "Fixed internal-latency conditions",
                  "children": [
                    {
                      "id": "mode",
                      "kind": "decision",
                      "name": "Select the predeclared measurement condition",
                      "test": "The schedule selects core, model-slot context, or instrumentation cost",
                      "branches": {
                        "core": "benchmark.execution.internal_latency.measure.core",
                        "model-slot context": "benchmark.execution.internal_latency.measure.model",
                        "instrumentation cost": "benchmark.execution.internal_latency.measure.overhead",
                        "otherwise": "benchmark.execution.internal_latency.reporting.fail"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "core",
                      "kind": "step",
                      "name": "Configure the owned service with no model selected",
                      "does": "Configure the owned service with no model selected",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_plan",
                      "rules": [
                        "Verify zero provider requests.",
                        "Retain expected model-unavailable responses without assigning quality scores."
                      ],
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "model",
                      "kind": "step",
                      "name": "Configure only the current worker and preserve existing model residency",
                      "does": "Configure only the current worker and preserve existing model residency",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_plan",
                      "rules": [
                        "Use ornith-1.0-9b with recorded provider, quantization, context, parallelism, and observable GPU inventory.",
                        "Five passes of all 40 evaluation workflows at concurrency 1, 2, 4, and bursts of four.",
                        "Two clean-start warm-up and measured concurrency-one passes follow.",
                        "No model downloads or prompt tuning.",
                        "Use context 32768, one parallel prediction, full GPU layer offload, and one Saturn model-call slot; incompatible pre-existing residency blocks this condition."
                      ],
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "ready",
                      "kind": "decision",
                      "name": "The current-worker condition is available",
                      "test": "The current worker is compatible and preparation succeeds without changing pre-existing residency",
                      "branches": {
                        "ready": "benchmark.execution.internal_latency.measure.dispatch",
                        "otherwise": "benchmark.execution.internal_latency.measure.blocked"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "overhead",
                      "kind": "step",
                      "name": "Alternate matched instrumentation-on and instrumentation-off development passes",
                      "does": "Alternate matched instrumentation-on and instrumentation-off development passes",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_plan",
                      "rules": [
                        "Two model-disabled owned services each receive 20 excluded warm-up cases.",
                        "Five matched pairs use all 20 existing development workflows.",
                        "Retain the 200 paired observations separately and never subtract their cost estimate from stage timings.",
                        "The paired comparison measures incremental capture cost, not disabled-hook cost against the earlier uninstrumented checkout.",
                        "Stop individual tool-call round-trip timers before diagnostic trace collection; report collection duration and observer CPU separately.",
                        "Phase service CPU includes profile export and diagnostic reads; it is instrumented-workload cost, not pure capture CPU."
                      ],
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "dispatch",
                      "kind": "step",
                      "name": "Submit fixed same-corpus workflows through public MCP",
                      "does": "Submit fixed same-corpus workflows through public MCP",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_observation",
                      "rules": [
                        "One outstanding request per harness; preserve producer and follow-up identity.",
                        "Rotate the four workload conditions across five passes.",
                        "Keep the existing 90-second call and 180-second workflow limits.",
                        "Client round-trip, backend envelopes, and service timing windows remain separate."
                      ],
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "blocked",
                      "kind": "step",
                      "name": "Record every affected scheduled case as unexecuted",
                      "does": "Record every affected scheduled case as unexecuted",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_observation",
                      "rules": [
                        "The model-disabled condition remains runnable.",
                        "No substituted worker or hidden missing case."
                      ],
                      "code": "bench/runner.py"
                    }
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "collection",
                  "kind": "group",
                  "name": "Correlated public timing collection",
                  "does": "Correlated public timing collection",
                  "children": [
                    {
                      "id": "read",
                      "kind": "step",
                      "name": "Collect the returned response and its matching public trace payload",
                      "does": "Collect the returned response and its matching public trace payload",
                      "in": "internal_latency_observation",
                      "out": "internal_latency_observation",
                      "rules": [
                        "Read only through existing local administration trace/payload APIs.",
                        "Use service instance, isolated harness, session/request identity, and run ID; never latest global sequence."
                      ],
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "required",
                      "kind": "decision",
                      "name": "This observation requires an enabled timing profile",
                      "test": "The fixed condition expects timing capture to be enabled",
                      "branches": {
                        "required": "benchmark.execution.internal_latency.collection.available",
                        "otherwise": "benchmark.execution.internal_latency.reporting.aggregate"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "available",
                      "kind": "decision",
                      "name": "The matching profile is available",
                      "test": "The trace contains a profile for this exact request",
                      "branches": {
                        "available": "benchmark.execution.internal_latency.collection.valid",
                        "otherwise": "benchmark.execution.internal_latency.collection.deadline"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "deadline",
                      "kind": "decision",
                      "name": "The bounded collection deadline remains",
                      "test": "Fewer than five seconds have elapsed since the tool response",
                      "branches": {
                        "wait": "benchmark.execution.internal_latency.collection.read",
                        "otherwise": "benchmark.execution.internal_latency.collection.incomplete"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "valid",
                      "kind": "decision",
                      "name": "The profile is complete and its intervals are valid",
                      "test": "Clock identity, request binding, parent IDs, endpoints, bounds, and completeness validate",
                      "branches": {
                        "valid": "benchmark.execution.internal_latency.reporting.aggregate",
                        "otherwise": "benchmark.execution.internal_latency.collection.incomplete"
                      },
                      "code": "bench/runner.py"
                    },
                    {
                      "id": "incomplete",
                      "kind": "step",
                      "name": "Retain the outcome with missing, incomplete, invalid, or blocked timing",
                      "does": "Retain the outcome with missing, incomplete, invalid, or blocked timing",
                      "in": "internal_latency_observation",
                      "out": "internal_latency_observation",
                      "rules": [
                        "Keep scheduled/outcome counts and failure reasons.",
                        "Invalid profiles do not enter valid-duration denominators and never become zero latency."
                      ],
                      "code": "bench/runner.py"
                    }
                  ],
                  "code": "bench/runner.py"
                },
                {
                  "id": "reporting",
                  "kind": "group",
                  "name": "Internal attribution and complete reporting",
                  "does": "Internal attribution and complete reporting",
                  "children": [
                    {
                      "id": "aggregate",
                      "kind": "step",
                      "name": "Calculate stage durations, interval unions, overlap, and uncovered time",
                      "does": "Calculate stage durations, interval unions, overlap, and uncovered time",
                      "in": "internal_latency_observation",
                      "out": "internal_latency_report",
                      "rules": [
                        "Inclusive and exclusive stage durations use monotonic intervals from the same service instance.",
                        "Subtract unions of nested children rather than summing overlapping spans.",
                        "Keep internal processing, actual waiting, and backend envelopes separate; concurrent categories can overlap.",
                        "Unattributed time is the uncovered part of the same request window.",
                        "Internal elapsed time is not process CPU time; inaccessible SQLite busy waiting remains inseparable.",
                        "Group by condition, workload, tool, source family, and pass; report valid counts, median/range/p50/p95 and p99 only with at least 100 valid samples."
                      ],
                      "code": "bench/execution.py"
                    },
                    {
                      "id": "persist",
                      "kind": "step",
                      "name": "Persist raw profiles, timings, failures, and hardware observations",
                      "does": "Persist raw profiles, timings, failures, and hardware observations",
                      "in": "internal_latency_report",
                      "out": "internal_latency_report",
                      "rules": [
                        "Raw output under var/bench/<run-id>/; durable summaries under private/artifacts/bench/<date>/.",
                        "Retain resource counter gaps, collection failures, contamination, and all scheduled outcomes.",
                        "No model-quality score, pure-inference claim, or absolute latency target is invented."
                      ],
                      "code": "bench/execution.py"
                    },
                    {
                      "id": "more",
                      "kind": "decision",
                      "name": "Scheduled work remains within the suite cap",
                      "test": "More fixed observations remain and the six-hour cap has not expired",
                      "branches": {
                        "more": "benchmark.execution.internal_latency.measure.mode",
                        "otherwise": "benchmark.execution.internal_latency.reporting.cleanup"
                      },
                      "code": "bench/execution.py"
                    },
                    {
                      "id": "cleanup",
                      "kind": "step",
                      "name": "Stop owned services and release only benchmark-owned access and models",
                      "does": "Stop owned services and release only benchmark-owned access and models",
                      "in": "internal_latency_report",
                      "out": "internal_latency_report",
                      "rules": [
                        "Run on success, failure, or interruption.",
                        "Preserve previously loaded models and the regular service."
                      ],
                      "code": "bench/execution.py"
                    },
                    {
                      "id": "report",
                      "kind": "step",
                      "name": "Report internal stages, contention context, instrumentation impact, and reproduction",
                      "does": "Report internal stages, contention context, instrumentation impact, and reproduction",
                      "in": "internal_latency_report",
                      "out": "internal_latency_report",
                      "rules": [
                        "Two clean starts compare against the same condition at concurrency one with diagnostic p95 tolerance of 20%.",
                        "Investigate tolerance misses before a reproducibility claim.",
                        "Cross-hardware or incompatible conditions are not normalized into regressions.",
                        "Disclose provisional corpus status and keep previous end-to-end measurements unchanged."
                      ],
                      "code": "bench/execution.py"
                    },
                    {
                      "id": "fail",
                      "kind": "step",
                      "name": "Record preparation failure and every remaining scheduled case",
                      "does": "Record preparation failure and every remaining scheduled case",
                      "in": "internal_latency_plan",
                      "out": "internal_latency_report",
                      "code": "bench/execution.py"
                    }
                  ],
                  "code": "bench/execution.py"
                }
              ],
              "choice": "Observe real operation boundaries through an optional service profile and public-interface corpus workloads.",
              "why": "One unchanged corpus drives model-disabled, model-slot, clean-start, and paired profiling-cost schedules. Stage intervals separate observed processing, storage, waiting, and backend envelopes.",
              "rejected": [
                "A new synthetic dataset for each timing test.",
                "Replacing missing stage timings with zero.",
                "Calling a model-disabled run a model-semaphore contention test."
              ],
              "code": "bench/runner.py"
            }
          ],
          "code": "bench/runner.py"
        },
        {
          "id": "results",
          "name": "Benchmark run evidence",
          "kind": "store",
          "keeps": [
            "benchmark_plan",
            "benchmark_observation",
            "benchmark_report",
            "internal_latency_plan",
            "internal_latency_observation",
            "internal_latency_report"
          ],
          "does": "Keeps raw observations, aggregate reports, and reproduction comparisons."
        }
      ],
      "code": "bench/corpus.py"
    }
  ],
  "links": [
    {
      "to": "saturn.bridge.stdio.bridge_receive",
      "label": "tool_call",
      "kind": "data",
      "from": "clients",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.bridge.stdio.bridge_token",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.bridge.stdio.bridge_receive"
    },
    {
      "to": "saturn.bridge.stdio.upstream.bridge_forward",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.bridge.stdio.upstream.bridge_workspace"
    },
    {
      "to": "saturn.service.ingress.ingress_host",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.bridge.stdio.upstream.bridge_forward"
    },
    {
      "to": "saturn.bridge.stdio.upstream.bridge_reply",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.ingress.protocol.tool_catalog"
    },
    {
      "to": "clients",
      "label": "tool_result",
      "kind": "result",
      "from": "saturn.bridge.stdio.upstream.bridge_reply",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.bridge.stdio.bridge_receive",
      "label": "credential",
      "kind": "store",
      "from": "saturn.home.home_credentials"
    },
    {
      "to": "clients",
      "label": "tool_result",
      "kind": "result",
      "from": "saturn.bridge.stdio.upstream.bridge_error",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.bridge.stdio.upstream.bridge_health",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.bridge.stdio.upstream.bridge_start"
    },
    {
      "to": "saturn.service.ingress.ingress_host",
      "label": "tool_call",
      "kind": "data",
      "from": "clients",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "clients",
      "label": "tool_result",
      "kind": "result",
      "from": "saturn.service.ingress.protocol.mcp_housekeeping",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "clients",
      "label": "failure",
      "kind": "result",
      "from": "saturn.service.ingress.replies.not_configured",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "clients",
      "label": "failure",
      "kind": "result",
      "from": "saturn.service.ingress.replies.auth_failure",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.database",
      "label": "run",
      "kind": "store",
      "from": "saturn.service.ingress.replies.auth_failure"
    },
    {
      "to": "clients",
      "label": "failure",
      "kind": "result",
      "from": "saturn.service.ingress.replies.http_failure",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.service.ingress.ingress_tool",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.ingress.ingress_refresh"
    },
    {
      "to": "saturn.service.evidence.trace.trace_response",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.ingress.replies.reject_tool"
    },
    {
      "to": "clients",
      "label": "tool_result",
      "kind": "result",
      "from": "saturn.service.evidence.trace.trace_response",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.database",
      "label": "run",
      "kind": "store",
      "from": "saturn.service.ingress.replies.reject_tool"
    },
    {
      "to": "saturn.service.evidence.trace.trace_response",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.ingress.replies.reject_workspace"
    },
    {
      "to": "saturn.database",
      "label": "run",
      "kind": "store",
      "from": "saturn.service.ingress.replies.reject_workspace"
    },
    {
      "to": "saturn.service.tools.dispatch.progress_enabled",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.ingress.workspace.workspace_bind"
    },
    {
      "to": "saturn.service.evidence.trace.trace_start",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.tools.dispatch.progress_schedule"
    },
    {
      "to": "saturn.service.tools.dispatch.tool_route",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.evidence.trace.trace_start"
    },
    {
      "to": "saturn.service.tools.run.run_cwd",
      "label": "command",
      "kind": "data",
      "from": "saturn.service.tools.run.run_parse"
    },
    {
      "to": "saturn.service.tools.run.runner.preparation.runner_executable",
      "label": "command",
      "kind": "data",
      "from": "saturn.service.tools.run.runner.preparation.runner_env"
    },
    {
      "to": "operating_system",
      "label": "command",
      "kind": "control",
      "from": "saturn.service.tools.run.runner.process.runner_spawn",
      "contract": {
        "mode": "Owned child process with argv, no command shell",
        "timeout": "300 s command default; 5 s final output drain",
        "retry": "None"
      }
    },
    {
      "to": "saturn.service.tools.run.runner.process.runner_capture",
      "label": "command_output",
      "kind": "result",
      "from": "operating_system",
      "contract": {
        "mode": "Owned child process with argv, no command shell",
        "timeout": "300 s command default; 5 s final output drain",
        "retry": "None"
      }
    },
    {
      "to": "saturn.service.tools.run.runner.process.runner_completion",
      "label": "command_output",
      "kind": "data",
      "from": "saturn.service.tools.run.runner.process.runner_keep"
    },
    {
      "to": "saturn.service.tools.run.reply.run_inline",
      "label": "command_output",
      "kind": "data",
      "from": "saturn.service.tools.run.reply.run_redact"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.run.reply.run_format"
    },
    {
      "to": "saturn.service.evidence.trace.trace_response",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.evidence.trace.trace_finish"
    },
    {
      "to": "saturn.bridge.stdio.upstream.bridge_reply",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.evidence.trace.trace_response"
    },
    {
      "to": "saturn.database",
      "label": "run",
      "kind": "store",
      "from": "saturn.service.evidence.trace.trace_start"
    },
    {
      "to": "saturn.database",
      "label": "run",
      "kind": "store",
      "from": "saturn.service.evidence.trace.trace_finish"
    },
    {
      "to": "saturn.database",
      "label": "payload",
      "kind": "store",
      "from": "saturn.service.evidence.trace.trace_response"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.evidence.trace.tool_failure"
    },
    {
      "to": "saturn.service.evidence.trace.tool_failure",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.tools.run.policy.policy_refuse"
    },
    {
      "to": "saturn.service.tools.run.runner.process.runner_completion",
      "label": "command_output",
      "kind": "data",
      "from": "saturn.service.tools.run.runner.process.runner_drop"
    },
    {
      "to": "saturn.service.tools.run.reply.run_redact",
      "label": "command_output",
      "kind": "data",
      "from": "saturn.service.tools.run.runner.process.runner_kill"
    },
    {
      "to": "saturn.service.evidence.trace.tool_failure",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.tools.run.runner.process.runner_cancel"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_parse",
      "label": "command_output",
      "kind": "data",
      "from": "saturn.service.evidence.artifacts.artifact_write"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.classifier.digest_kind",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.digest_parse"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic"
    },
    {
      "to": "saturn.service.tools.run.reply.run_digest_reply",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.digest_code"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.run.reply.run_digest_reply"
    },
    {
      "to": "saturn.database",
      "label": "artifact",
      "kind": "store",
      "from": "saturn.service.evidence.artifacts.artifact_write"
    },
    {
      "to": "saturn.service.tools.digest.mapping.digest_chunks",
      "label": "excerpt",
      "kind": "data",
      "from": "saturn.service.tools.digest.mapping.digest_condense"
    },
    {
      "to": "saturn.service.model.gateway.gateway_selected",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.tools.digest.mapping.digest_map"
    },
    {
      "to": "saturn.service.model.gateway.gateway_send",
      "label": "lifecycle",
      "kind": "data",
      "from": "saturn.service.model.lifecycle.model_activity"
    },
    {
      "to": "model_server",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_send",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.service.model.gateway.gateway_transport",
      "label": "model_reply",
      "kind": "result",
      "from": "model_server",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.service.tools.digest.mapping.digest_fact",
      "label": "model_reply",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_result"
    },
    {
      "to": "saturn.service.tools.support.support_prepare",
      "label": "facts",
      "kind": "data",
      "from": "saturn.service.tools.digest.mapping.digest_accept"
    },
    {
      "to": "saturn.service.tools.support.support_ready",
      "label": "support_candidates",
      "kind": "data",
      "from": "saturn.service.tools.support.support_prepare"
    },
    {
      "to": "saturn.service.model.gateway.gateway_selected",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.tools.support.support_request"
    },
    {
      "to": "saturn.service.tools.support.validation.support_valid",
      "label": "model_reply",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_result"
    },
    {
      "to": "saturn.service.tools.support.validation.support_result",
      "label": "support_result",
      "kind": "data",
      "from": "saturn.service.tools.support.validation.support_keep"
    },
    {
      "to": "saturn.service.tools.digest.reduction.digest_reduce",
      "label": "facts",
      "kind": "data",
      "from": "saturn.service.tools.support.validation.support_result"
    },
    {
      "to": "saturn.service.tools.digest.reduction.digest_merge",
      "label": "facts",
      "kind": "data",
      "from": "saturn.service.tools.digest.reduction.digest_reduce"
    },
    {
      "to": "saturn.service.tools.run.reply.run_digest_reply",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.reduction.digest_merge"
    },
    {
      "to": "saturn.service.evidence.trace.trace_model",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_send"
    },
    {
      "to": "saturn.database",
      "label": "model_call",
      "kind": "store",
      "from": "saturn.service.evidence.trace.trace_model"
    },
    {
      "to": "saturn.service.tools.digest.reduction.digest_reduce",
      "label": "facts",
      "kind": "data",
      "from": "saturn.service.tools.digest.mapping.digest_reject"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_pytest"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_diff"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_traceback"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_lint"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_diagnostics"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_json"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_model",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.classifier.parsers.digest_log"
    },
    {
      "to": "saturn.service.tools.digest.reduction.digest_fallback",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.model_failure"
    },
    {
      "to": "saturn.service.tools.run.reply.run_digest_reply",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.reduction.digest_fallback"
    },
    {
      "to": "saturn.service.model.gateway.gateway_send",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_correct"
    },
    {
      "to": "saturn.service.tools.digest.reduction.digest_fallback",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.model_invalid"
    },
    {
      "to": "saturn.service.model.errors.model_failure",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.gateway_auth_error"
    },
    {
      "to": "saturn.service.model.errors.model_failure",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.gateway_connection_error"
    },
    {
      "to": "saturn.service.tools.read.files.read_binary",
      "label": "file_text",
      "kind": "data",
      "from": "saturn.service.tools.read.files.read_bytes"
    },
    {
      "to": "saturn.service.tools.read.render.read_range",
      "label": "file_text",
      "kind": "data",
      "from": "saturn.service.tools.read.files.read_mask"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.read.render.read_whole"
    },
    {
      "to": "saturn.service.tools.read.files.read_bytes",
      "label": "file_text",
      "kind": "data",
      "from": "project",
      "contract": {
        "mode": "Local filesystem read under the selected roots",
        "timeout": "Synchronous bounded reads; regex execution has a separate deadline",
        "retry": "None"
      }
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.read.render.read_number"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.read.render.read_symbols"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.read.render.read_prefix"
    },
    {
      "to": "saturn.service.tools.search.traversal.search_budget",
      "label": "file_text",
      "kind": "data",
      "from": "saturn.service.tools.search.traversal.search_walk"
    },
    {
      "to": "saturn.service.tools.search.regex.regex_result",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.regex.regex_inline"
    },
    {
      "to": "saturn.service.tools.search.traversal.matches.search_matches",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.regex.regex_result"
    },
    {
      "to": "saturn.service.tools.search.traversal.search_next",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.traversal.matches.search_retain"
    },
    {
      "to": "saturn.service.tools.search.output.search_overflow",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.output.search_render"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.search.output.search_reply"
    },
    {
      "to": "saturn.service.tools.search.output.search_reply",
      "label": "artifact",
      "kind": "data",
      "from": "saturn.service.tools.search.output.search_store"
    },
    {
      "to": "saturn.database",
      "label": "artifact",
      "kind": "store",
      "from": "saturn.service.tools.search.output.search_store"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.search.output.search_empty"
    },
    {
      "to": "saturn.service.tools.search.traversal.search_next",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.traversal.search_skip"
    },
    {
      "to": "saturn.service.tools.search.output.search_any",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.traversal.search_partial"
    },
    {
      "to": "saturn.service.tools.search.regex.regex_deadline",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.regex.regex_send"
    },
    {
      "to": "saturn.service.evidence.trace.tool_failure",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.tools.search.regex.regex_stop"
    },
    {
      "to": "saturn.service.evidence.artifacts.artifact_lines",
      "label": "file_text",
      "kind": "data",
      "from": "saturn.service.evidence.artifacts.artifact_load"
    },
    {
      "to": "saturn.service.tools.query.query_mode",
      "label": "file_text",
      "kind": "data",
      "from": "saturn.service.evidence.artifacts.artifact_lines"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.query.query_number"
    },
    {
      "to": "saturn.service.evidence.artifacts.artifact_load",
      "label": "artifact",
      "kind": "store",
      "from": "saturn.database"
    },
    {
      "to": "saturn.service.tools.search.regex.regex_literal",
      "label": "regex_request",
      "kind": "data",
      "from": "saturn.service.tools.query.query_regex"
    },
    {
      "to": "saturn.service.tools.query.query_regex_reply",
      "label": "search_result",
      "kind": "data",
      "from": "saturn.service.tools.search.regex.regex_result"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.query.query_regex_reply"
    },
    {
      "to": "saturn.service.tools.dispatch.progress_enabled",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.ingress.workspace.workspace_no_root"
    },
    {
      "to": "saturn.service.tools.research.loop.ask_finish_only",
      "label": "research",
      "kind": "data",
      "from": "saturn.service.tools.research.preparation.ask_seed"
    },
    {
      "to": "saturn.service.model.gateway.gateway_selected",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.tools.research.loop.ask_offer_tools"
    },
    {
      "to": "saturn.service.tools.research.loop.ask_action",
      "label": "model_reply",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_result"
    },
    {
      "to": "saturn.service.tools.support.support_prepare",
      "label": "evidence",
      "kind": "data",
      "from": "saturn.service.tools.research.answer.ask_keep"
    },
    {
      "to": "saturn.service.tools.research.answer.ask_answer",
      "label": "evidence",
      "kind": "data",
      "from": "saturn.service.tools.support.validation.support_result"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.research.answer.ask_answer"
    },
    {
      "to": "saturn.service.tools.research.observations.ask_observe",
      "label": "observation",
      "kind": "data",
      "from": "saturn.service.tools.research.observations.ask_list"
    },
    {
      "to": "saturn.service.tools.research.loop.ask_finish_only",
      "label": "research",
      "kind": "data",
      "from": "saturn.service.tools.research.observations.ask_observe"
    },
    {
      "to": "saturn.service.model.gateway.gateway_selected",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.tools.research.loop.ask_offer_finish"
    },
    {
      "to": "saturn.service.tools.research.observations.ask_observe",
      "label": "observation",
      "kind": "data",
      "from": "saturn.service.tools.research.observations.ask_read"
    },
    {
      "to": "saturn.service.tools.research.observations.ask_observe",
      "label": "observation",
      "kind": "data",
      "from": "saturn.service.tools.research.observations.ask_grep"
    },
    {
      "to": "saturn.service.tools.research.loop.ask_finish_only",
      "label": "research",
      "kind": "data",
      "from": "saturn.service.tools.research.loop.ask_force_finish"
    },
    {
      "to": "saturn.service.tools.research.observations.ask_tool_error",
      "label": "observation",
      "kind": "data",
      "from": "saturn.service.tools.research.observations.ask_read"
    },
    {
      "to": "saturn.service.tools.research.observations.ask_observe",
      "label": "observation",
      "kind": "data",
      "from": "saturn.service.tools.research.observations.ask_tool_error"
    },
    {
      "to": "saturn.service.tools.research.loop.ask_action",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.model_invalid"
    },
    {
      "to": "saturn.service.tools.research.loop.ask_finish_only",
      "label": "research",
      "kind": "data",
      "from": "saturn.service.tools.research.loop.ask_invalid"
    },
    {
      "to": "saturn.service.evidence.trace.trace_finish",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.tools.research.answer.ask_unfinished"
    },
    {
      "to": "saturn.service.tools.support.support_prepare",
      "label": "evidence",
      "kind": "data",
      "from": "saturn.service.tools.research.answer.ask_drop"
    },
    {
      "to": "saturn.service.tools.support.validation.support_result",
      "label": "support_result",
      "kind": "data",
      "from": "saturn.service.tools.support.validation.support_empty"
    },
    {
      "to": "saturn.service.evidence.trace.tool_failure",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.model_failure"
    },
    {
      "to": "saturn.service.tools.support.validation.support_result",
      "label": "support_result",
      "kind": "data",
      "from": "saturn.service.tools.support.validation.support_drop"
    },
    {
      "to": "saturn.service.tools.support.validation.support_empty",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.model.errors.model_failure"
    },
    {
      "to": "saturn.service.model.lifecycle.model_activity",
      "label": "lifecycle",
      "kind": "data",
      "from": "saturn.service.model.lifecycle.model_claim"
    },
    {
      "to": "saturn.database",
      "label": "audit_event",
      "kind": "store",
      "from": "saturn.service.model.lifecycle.model_claim"
    },
    {
      "to": "saturn.service.model.gateway.gateway_send",
      "label": "lifecycle",
      "kind": "data",
      "from": "saturn.service.model.lifecycle.model_leave"
    },
    {
      "to": "saturn.service.model.lifecycle.model_last_call",
      "label": "model_reply",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_result"
    },
    {
      "to": "saturn.service.model.lifecycle.idle.model_still_idle",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.model.lifecycle.idle.model_idle_tick"
    },
    {
      "to": "model_server",
      "label": "model_control",
      "kind": "control",
      "from": "saturn.service.model.provider.provider_unload",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.service.model.lifecycle.idle.model_unloaded",
      "label": "model_status",
      "kind": "result",
      "from": "model_server",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.database",
      "label": "audit_event",
      "kind": "store",
      "from": "saturn.service.model.lifecycle.idle.model_forget"
    },
    {
      "to": "saturn.service.model.provider.provider_cache",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.inspect.ui_model"
    },
    {
      "to": "model_server",
      "label": "model_control",
      "kind": "data",
      "from": "saturn.service.model.provider.provider_lmstudio",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.service.model.provider.provider_reply",
      "label": "model_status",
      "kind": "result",
      "from": "model_server",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.dashboard.inspect.ui_evidence",
      "label": "model_status",
      "kind": "data",
      "from": "saturn.service.model.provider.provider_reply"
    },
    {
      "to": "saturn.dashboard.inspect.ui_model",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "model_server",
      "label": "model_control",
      "kind": "data",
      "from": "saturn.service.model.provider.provider_ollama",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "model_server",
      "label": "model_control",
      "kind": "data",
      "from": "saturn.service.model.provider.provider_openai",
      "contract": {
        "mode": "Loopback HTTP; Responses tool calls or provider model-management API",
        "timeout": "180 s model-call default; model-management deadlines are adapter-specific",
        "retry": "Transport retries disabled; one schema-correction retry"
      }
    },
    {
      "to": "saturn.service.control.settings.settings_stamp",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.ingress.ingress_refresh"
    },
    {
      "to": "saturn.service.control.settings.settings_changed",
      "label": "config_stamp",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_stamp"
    },
    {
      "to": "saturn.service.ingress.ingress_tool",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_current"
    },
    {
      "to": "saturn.service.evidence.trace.trace_start",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.ingress.workspace.workspace_bind"
    },
    {
      "to": "saturn.service.control.settings.settings_stamp",
      "label": "settings",
      "kind": "store",
      "from": "saturn.home.home_settings"
    },
    {
      "to": "saturn.service.control.settings.settings_valid",
      "label": "settings",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_read"
    },
    {
      "to": "saturn.service.control.settings.settings_current",
      "label": "audit_event",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_apply"
    },
    {
      "to": "saturn.database",
      "label": "audit_event",
      "kind": "store",
      "from": "saturn.service.control.settings.settings_apply"
    },
    {
      "to": "saturn.dashboard.settings.ui_render",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_keep"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.settings.ui_save"
    },
    {
      "to": "saturn.home.home_settings",
      "label": "settings",
      "kind": "store",
      "from": "saturn.service.control.settings.settings_save"
    },
    {
      "to": "saturn.database",
      "label": "settings",
      "kind": "store",
      "from": "saturn.service.control.settings.settings_save"
    },
    {
      "to": "saturn.dashboard.settings.ui_render",
      "label": "settings",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_save"
    },
    {
      "to": "saturn.dashboard.settings.ui_save",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.dashboard.settings.ui_render",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.owner.owner_failure"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.settings.ui_test"
    },
    {
      "to": "saturn.service.model.gateway.gateway_selected",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.service.control.api.api_model_test"
    },
    {
      "to": "saturn.dashboard.settings.ui_render",
      "label": "model_reply",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_result"
    },
    {
      "to": "saturn.dashboard.settings.ui_test",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.settings.ui_policy"
    },
    {
      "to": "saturn.dashboard.settings.ui_render",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.api_policy_test"
    },
    {
      "to": "saturn.dashboard.settings.ui_policy",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_create"
    },
    {
      "to": "saturn.service.control.access.revocation.access_view",
      "label": "harness_record",
      "kind": "data",
      "from": "saturn.service.control.access.creation.access_create"
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.access.revocation.access_view"
    },
    {
      "to": "saturn.database",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.access.creation.access_create"
    },
    {
      "to": "saturn.dashboard.connections.ui_create",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.home.home_credentials",
      "label": "credential",
      "kind": "store",
      "from": "saturn.service.control.access.creation.access_create"
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_edit"
    },
    {
      "to": "saturn.service.control.access.revocation.access_view",
      "label": "harness_record",
      "kind": "data",
      "from": "saturn.service.control.access.mutations.access_edit"
    },
    {
      "to": "saturn.database",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.access.mutations.access_edit"
    },
    {
      "to": "saturn.dashboard.connections.ui_edit",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_rotate"
    },
    {
      "to": "saturn.service.control.access.revocation.access_view",
      "label": "harness_record",
      "kind": "data",
      "from": "saturn.service.control.access.mutations.access_rotate"
    },
    {
      "to": "saturn.database",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.access.mutations.access_rotate"
    },
    {
      "to": "saturn.dashboard.connections.ui_rotate",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.home.home_credentials",
      "label": "credential",
      "kind": "store",
      "from": "saturn.service.control.access.mutations.access_rotate"
    },
    {
      "to": "saturn.service.control.access.revocation.access_view",
      "label": "harness_record",
      "kind": "data",
      "from": "saturn.service.control.access.mutations.access_enable"
    },
    {
      "to": "saturn.database",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.access.mutations.access_enable"
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_revoke"
    },
    {
      "to": "saturn.service.control.access.revocation.access_view",
      "label": "harness_record",
      "kind": "data",
      "from": "saturn.service.control.access.revocation.access_mark_revoked"
    },
    {
      "to": "saturn.database",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.access.revocation.access_mark_revoked"
    },
    {
      "to": "saturn.dashboard.connections.ui_revoke",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.owner.owner_failure"
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "tool_call",
      "kind": "data",
      "from": "clients",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "clients",
      "label": "failure",
      "kind": "result",
      "from": "saturn.service.control.owner.owner_failure",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_connections"
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_render"
    },
    {
      "to": "saturn.dashboard.connections.ui_connections",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.owner.owner_peer",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_install"
    },
    {
      "to": "saturn.service.control.connect.preview.connect_existing",
      "label": "install_plan",
      "kind": "data",
      "from": "saturn.service.control.connect.preview.connect_plan"
    },
    {
      "to": "saturn.service.control.connect.application.connect_apply",
      "label": "client_entries",
      "kind": "data",
      "from": "saturn.service.control.connect.preview.connect_claude"
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.connect.application.connect_preview"
    },
    {
      "to": "saturn.service.control.connect.preview.connect_claude",
      "label": "file_change",
      "kind": "data",
      "from": "client_files",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.dashboard.connections.ui_install",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "client_files",
      "label": "file_change",
      "kind": "store",
      "from": "saturn.service.control.connect.application.files.connect_backup",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.service.control.connect.application.persistence.connect_validate",
      "label": "file_write_result",
      "kind": "result",
      "from": "client_files",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.service.control.connect.application.persistence.connect_saved",
      "label": "install_record",
      "kind": "data",
      "from": "saturn.service.control.connect.application.persistence.connect_record"
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "install_record",
      "kind": "data",
      "from": "saturn.service.control.connect.application.persistence.connect_audit"
    },
    {
      "to": "saturn.home.home_installs",
      "label": "install_record",
      "kind": "store",
      "from": "saturn.service.control.connect.application.files.connect_backup"
    },
    {
      "to": "saturn.home.home_installs",
      "label": "install_record",
      "kind": "store",
      "from": "saturn.service.control.connect.application.persistence.connect_record"
    },
    {
      "to": "saturn.database",
      "label": "audit_event",
      "kind": "store",
      "from": "saturn.service.control.connect.application.persistence.connect_audit"
    },
    {
      "to": "saturn.service.control.connect.application.connect_apply",
      "label": "client_entries",
      "kind": "data",
      "from": "saturn.service.control.connect.preview.connect_codex_block"
    },
    {
      "to": "saturn.service.control.connect.preview.connect_codex",
      "label": "file_change",
      "kind": "data",
      "from": "client_files",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.service.control.connect.application.files.connect_fresh",
      "label": "harness",
      "kind": "data",
      "from": "saturn.service.control.access.creation.access_create"
    },
    {
      "to": "client_files",
      "label": "restore backed-up files and remove newly created files",
      "kind": "control",
      "from": "saturn.service.control.connect.recovery.connect_restore",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.service.control.connect.recovery.connect_restored",
      "label": "file recovery outcome",
      "kind": "result",
      "from": "client_files",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.service.control.connect.recovery.connect_revoke_new",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.connect.recovery.connect_recovery_ok"
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.connect.recovery.connect_recovery_report"
    },
    {
      "to": "saturn.service.control.connect.recovery.connect_revoke_new",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.connect.recovery.connect_recovery_partial"
    },
    {
      "to": "saturn.service.control.connect.recovery.connect_recovery_report",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.connect.recovery.connect_revoke_attempt"
    },
    {
      "to": "saturn.home.home_credentials",
      "label": "remove the new harness credential",
      "kind": "control",
      "from": "saturn.service.control.connect.recovery.connect_revoke_attempt"
    },
    {
      "to": "saturn.database",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.connect.recovery.connect_revoke_attempt"
    },
    {
      "to": "saturn.service.control.connect.removal.connect_remove",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.connections.ui_remove"
    },
    {
      "to": "client_files",
      "label": "file_change",
      "kind": "store",
      "from": "saturn.service.control.connect.removal.connect_remove",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.service.control.connect.removal.connect_remove_revoke",
      "label": "file_write_result",
      "kind": "result",
      "from": "client_files",
      "contract": {
        "mode": "Local JSON/TOML file operation with backup before writes",
        "timeout": "Synchronous filesystem operation",
        "retry": "No automatic overwrite after a validation failure"
      }
    },
    {
      "to": "saturn.dashboard.connections.ui_access",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.connect.removal.connect_removed"
    },
    {
      "to": "saturn.home.home_installs",
      "label": "install_record",
      "kind": "store",
      "from": "saturn.service.control.connect.removal.connect_remove"
    },
    {
      "to": "saturn.dashboard.connections.ui_remove",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.home.home_credentials",
      "label": "harness_record",
      "kind": "store",
      "from": "saturn.service.control.access.revocation.access_mark_revoked"
    },
    {
      "to": "saturn.service.control.connect.removal.connect_removed",
      "label": "harness_record",
      "kind": "data",
      "from": "saturn.service.control.access.revocation.access_mark_revoked"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.inspect.ui_overview"
    },
    {
      "to": "saturn.dashboard.inspect.ui_evidence",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_render"
    },
    {
      "to": "saturn.service.control.api.pages.api_render",
      "label": "run",
      "kind": "store",
      "from": "saturn.database"
    },
    {
      "to": "saturn.dashboard.inspect.ui_overview",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.inspect.ui_runs"
    },
    {
      "to": "saturn.dashboard.inspect.ui_runs",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.inspect.ui_artifacts"
    },
    {
      "to": "saturn.dashboard.inspect.ui_artifacts",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.inspect.ui_changes"
    },
    {
      "to": "saturn.dashboard.inspect.ui_changes",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.settings.ui_settings"
    },
    {
      "to": "saturn.dashboard.settings.ui_render",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_render"
    },
    {
      "to": "saturn.service.control.api.pages.api_render",
      "label": "settings",
      "kind": "store",
      "from": "saturn.home.home_settings"
    },
    {
      "to": "saturn.dashboard.settings.ui_settings",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.dashboard.inspect.ui_evidence",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_not_modified"
    },
    {
      "to": "saturn.dashboard.inspect.ui_evidence",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_missing"
    },
    {
      "to": "saturn.service.control.api.reads.api_projection",
      "label": "tool_call",
      "kind": "data",
      "from": "clients",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "clients",
      "label": "dashboard_page",
      "kind": "result",
      "from": "saturn.service.control.api.reads.api_health",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "clients",
      "label": "dashboard_page",
      "kind": "result",
      "from": "saturn.service.control.api.reads.api_degraded",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.bridge.relay.relay_supported",
      "label": "tool_call",
      "kind": "data",
      "from": "clients",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.service.hooks.input.hook_auth",
      "label": "hook_event",
      "kind": "data",
      "from": "saturn.bridge.relay.relay_send"
    },
    {
      "to": "saturn.bridge.relay.relay_response",
      "label": "hook_result",
      "kind": "data",
      "from": "saturn.service.hooks.pre.hook_redirect"
    },
    {
      "to": "clients",
      "label": "hook_result",
      "kind": "result",
      "from": "saturn.bridge.relay.relay_print",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.service.evidence.trace.trace_start",
      "label": "hook_result",
      "kind": "data",
      "from": "saturn.service.hooks.pre.hook_redirect"
    },
    {
      "to": "saturn.service.tools.digest.deterministic.digest_parse",
      "label": "artifact",
      "kind": "data",
      "from": "saturn.service.hooks.post.hook_store"
    },
    {
      "to": "saturn.service.hooks.post.hook_shorter",
      "label": "digest",
      "kind": "data",
      "from": "saturn.service.tools.digest.deterministic.digest_code"
    },
    {
      "to": "saturn.bridge.relay.relay_response",
      "label": "hook_result",
      "kind": "data",
      "from": "saturn.service.hooks.post.hook_replace"
    },
    {
      "to": "saturn.database",
      "label": "artifact",
      "kind": "store",
      "from": "saturn.service.hooks.post.hook_store"
    },
    {
      "to": "saturn.bridge.relay.relay_response",
      "label": "hook_result",
      "kind": "data",
      "from": "saturn.service.hooks.input.hook_pass"
    },
    {
      "to": "clients",
      "label": "hook_result",
      "kind": "result",
      "from": "saturn.bridge.relay.relay_skip",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.bridge.relay.relay_response",
      "label": "failure",
      "kind": "data",
      "from": "saturn.service.hooks.input.hook_error"
    },
    {
      "to": "saturn.bridge.relay.relay_response",
      "label": "hook_event",
      "kind": "data",
      "from": "saturn.bridge.relay.relay_send"
    },
    {
      "to": "saturn.service.lifecycle.service_config",
      "label": "startup_settings",
      "kind": "data",
      "from": "saturn.service.lifecycle.service_start"
    },
    {
      "to": "saturn.service.evidence.retention.schema_compatible",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.service.lifecycle.service_config"
    },
    {
      "to": "saturn.service.lifecycle.service_recover",
      "label": "schema_state",
      "kind": "data",
      "from": "saturn.service.evidence.retention.schema_migrate"
    },
    {
      "to": "saturn.service.evidence.retention.retention_expire",
      "label": "run",
      "kind": "data",
      "from": "saturn.service.lifecycle.service_recover"
    },
    {
      "to": "saturn.service.evidence.retention.retention_budget",
      "label": "artifact",
      "kind": "data",
      "from": "saturn.service.evidence.retention.retention_expire"
    },
    {
      "to": "saturn.service.lifecycle.service_ready",
      "label": "artifact",
      "kind": "data",
      "from": "saturn.service.evidence.retention.retention_done"
    },
    {
      "to": "saturn.service.lifecycle.service_config",
      "label": "startup_settings",
      "kind": "store",
      "from": "saturn.home.home_env"
    },
    {
      "to": "saturn.database",
      "label": "schema_state",
      "kind": "store",
      "from": "saturn.service.evidence.retention.schema_migrate"
    },
    {
      "to": "saturn.database",
      "label": "run",
      "kind": "store",
      "from": "saturn.service.lifecycle.service_recover"
    },
    {
      "to": "saturn.database",
      "label": "audit_event",
      "kind": "store",
      "from": "saturn.service.lifecycle.service_ready"
    },
    {
      "to": "saturn.service.evidence.retention.retention_expire",
      "label": "artifact",
      "kind": "store",
      "from": "saturn.database"
    },
    {
      "to": "saturn.service.evidence.retention.retention_budget",
      "label": "artifact",
      "kind": "data",
      "from": "saturn.service.evidence.retention.retention_oldest"
    },
    {
      "to": "saturn.service.lifecycle.service_drain",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.service.lifecycle.service_stop"
    },
    {
      "to": "saturn.service.lifecycle.service_close",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.service.lifecycle.service_drain"
    },
    {
      "to": "saturn.database",
      "label": "audit_event",
      "kind": "store",
      "from": "saturn.service.lifecycle.service_close"
    },
    {
      "to": "saturn.service.model.provider.provider_unload",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.service.lifecycle.service_drain"
    },
    {
      "to": "saturn.cli.setup.cli_requirements",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.cli.setup.cli_setup"
    },
    {
      "to": "saturn.cli.setup.cli_model",
      "label": "startup_settings",
      "kind": "data",
      "from": "saturn.cli.setup.cli_requirements"
    },
    {
      "to": "saturn.service.model.gateway.gateway_selected",
      "label": "model_request",
      "kind": "data",
      "from": "saturn.cli.setup.cli_model_list"
    },
    {
      "to": "saturn.cli.setup.cli_start_choice",
      "label": "model_reply",
      "kind": "data",
      "from": "saturn.service.model.gateway.gateway_result"
    },
    {
      "to": "saturn.cli.setup.cli_doctor",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.connect.application.connect_preview"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.cli.setup.cli_doctor"
    },
    {
      "to": "owner",
      "label": "dashboard_page",
      "kind": "ui",
      "from": "saturn.cli.admin.cli_print"
    },
    {
      "to": "saturn.home.home_env",
      "label": "startup_settings",
      "kind": "store",
      "from": "saturn.cli.setup.cli_requirements"
    },
    {
      "to": "saturn.home.home_settings",
      "label": "model_request",
      "kind": "store",
      "from": "saturn.cli.setup.cli_model_list"
    },
    {
      "to": "saturn.cli.setup.cli_setup",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.cli.setup.cli_client_choice",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.cli.launcher.startup.launcher_start"
    },
    {
      "to": "saturn.cli.admin.cli_widen",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.cli.admin.cli_admin"
    },
    {
      "to": "saturn.service.control.settings.settings_save",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.cli.admin.cli_apply"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "settings",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_save"
    },
    {
      "to": "saturn.cli.admin.cli_admin",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "failure",
      "kind": "data",
      "from": "saturn.cli.admin.cli_abort"
    },
    {
      "to": "saturn.service.control.api.reads.api_projection",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.cli.admin.cli_apply"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_render"
    },
    {
      "to": "saturn.service.control.connect.preview.connect_plan",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.cli.admin.cli_apply"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.connect.application.connect_preview"
    },
    {
      "to": "saturn.cli.launcher.launcher_platform",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.cli.launcher.cli_launch"
    },
    {
      "to": "saturn.cli.launcher.shutdown.launcher_status",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.cli.launcher.startup.launcher_start"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.cli.launcher.shutdown.launcher_status"
    },
    {
      "to": "saturn.cli.launcher.cli_launch",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "failure",
      "kind": "data",
      "from": "saturn.cli.launcher.shutdown.launcher_refuse"
    },
    {
      "to": "saturn.cli.launcher.shutdown.launcher_status",
      "label": "service_state",
      "kind": "data",
      "from": "saturn.cli.launcher.shutdown.launcher_stop"
    },
    {
      "to": "saturn.cli.admin.cli_print",
      "label": "failure",
      "kind": "data",
      "from": "saturn.cli.launcher.shutdown.launcher_unsupported"
    },
    {
      "to": "saturn.dashboard.polling.poll_active",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.polling.ui_poll"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.polling.request.poll_fetch"
    },
    {
      "to": "saturn.dashboard.polling.request.poll_current",
      "label": "dashboard_page",
      "kind": "data",
      "from": "saturn.service.control.api.pages.api_render"
    },
    {
      "to": "saturn.dashboard.polling.request.poll_current",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.polling.request.poll_fetch"
    },
    {
      "to": "saturn.dashboard.polling.result.poll_backoff",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.dashboard.polling.result.poll_stale"
    },
    {
      "to": "saturn.dashboard.polling.result.poll_backoff",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.dashboard.polling.result.poll_error"
    },
    {
      "to": "saturn.dashboard.settings.ui_dirty",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.shell.ui_navigate"
    },
    {
      "to": "saturn.dashboard.shell.ui_storage",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.dashboard.settings.ui_render"
    },
    {
      "to": "saturn.dashboard.shell.ui_navigation",
      "label": "browser_state",
      "kind": "store",
      "from": "saturn.dashboard.shell.ui_preferences"
    },
    {
      "to": "saturn.dashboard.shell.ui_navigate",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.dashboard.shell.ui_navigation",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.dashboard.settings.ui_render"
    },
    {
      "to": "saturn.dashboard.shell.ui_navigation",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.dashboard.shell.ui_memory"
    },
    {
      "to": "saturn.dashboard.shell.ui_chart_view",
      "label": "owner_request",
      "kind": "data",
      "from": "saturn.dashboard.shell.ui_chart"
    },
    {
      "to": "saturn.dashboard.shell.ui_chart",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.evidence.trace.trace_start",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.tools.dispatch.progress_skip"
    },
    {
      "to": "saturn.service.tools.dispatch.progress_send",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.tools.dispatch.progress_tick"
    },
    {
      "to": "clients",
      "label": "tool_call",
      "kind": "result",
      "from": "saturn.service.tools.dispatch.progress_send",
      "contract": {
        "mode": "MCP JSON-RPC over stdio or Streamable HTTP, according to the selected entry path",
        "timeout": "Client tool timeout; generated Codex entry uses 330 s",
        "retry": "No automatic command retry"
      }
    },
    {
      "to": "saturn.service.evidence.masking.mask_known",
      "label": "command_output",
      "kind": "data",
      "from": "saturn.service.tools.run.reply.run_redact"
    },
    {
      "to": "saturn.service.evidence.masking.mask_patterns",
      "label": "masked_text",
      "kind": "data",
      "from": "saturn.service.evidence.masking.mask_replace"
    },
    {
      "to": "saturn.service.tools.run.reply.run_inline",
      "label": "masked_text",
      "kind": "data",
      "from": "saturn.service.evidence.masking.mask_done"
    },
    {
      "to": "saturn.service.evidence.masking.mask_done",
      "label": "masked_text",
      "kind": "data",
      "from": "saturn.service.evidence.masking.mask_pattern_replace"
    },
    {
      "to": "saturn.service.evidence.payloads.payload_size",
      "label": "tool_call",
      "kind": "data",
      "from": "saturn.service.evidence.trace.trace_start"
    },
    {
      "to": "saturn.database",
      "label": "payload",
      "kind": "store",
      "from": "saturn.service.evidence.payloads.payload_compress"
    },
    {
      "to": "saturn.service.evidence.payloads.payload_size",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.evidence.trace.trace_response"
    },
    {
      "to": "saturn.service.evidence.payloads.payload_compress",
      "label": "payload",
      "kind": "data",
      "from": "saturn.service.evidence.payloads.payload_cut"
    },
    {
      "to": "evaluation",
      "label": "owner_request",
      "kind": "ui",
      "from": "owner"
    },
    {
      "to": "saturn.service.control.api.api_operation",
      "label": "tool_call",
      "kind": "data",
      "from": "evaluation",
      "contract": {
        "mode": "Local operation",
        "timeout": "Caller deadline",
        "retry": "None"
      }
    },
    {
      "to": "evaluation",
      "label": "evaluation_report",
      "kind": "result",
      "from": "saturn.service.control.api.pages.api_render",
      "contract": {
        "mode": "Local operation",
        "timeout": "Caller deadline",
        "retry": "None"
      }
    },
    {
      "to": "saturn.service.ingress.ingress_host",
      "label": "tool_call",
      "kind": "data",
      "from": "evaluation",
      "contract": {
        "mode": "Local operation",
        "timeout": "Caller deadline",
        "retry": "None"
      }
    },
    {
      "to": "evaluation",
      "label": "tool_result",
      "kind": "data",
      "from": "saturn.service.evidence.trace.trace_response",
      "contract": {
        "mode": "Local operation",
        "timeout": "Caller deadline",
        "retry": "None"
      }
    },
    {
      "to": "evaluation",
      "label": "settings",
      "kind": "data",
      "from": "saturn.service.control.settings.settings_save",
      "contract": {
        "mode": "Local operation",
        "timeout": "Caller deadline",
        "retry": "None"
      }
    },
    {
      "from": "saturn.cli.checkout.tools.setup",
      "to": "saturn.cli.checkout.tools.requirements",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.tools.requirements",
      "to": "saturn.cli.checkout.tools.tools",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.dependencies.python_install",
      "to": "saturn.cli.checkout.dependencies.python_ok",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.dependencies.node_install",
      "to": "saturn.cli.checkout.dependencies.node_ok",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.dependencies.build",
      "to": "saturn.cli.checkout.dependencies.build_ok",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.environment.keep_env",
      "to": "saturn.cli.checkout.smoke.smoke_prepare",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.environment.input.ask",
      "to": "saturn.cli.checkout.environment.input.valid",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.environment.input.defaults",
      "to": "saturn.cli.checkout.environment.input.valid",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.environment.create_env",
      "to": "saturn.cli.checkout.environment.create_outcome",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.smoke.smoke_prepare",
      "to": "saturn.cli.checkout.smoke.smoke_start",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.smoke.smoke_start",
      "to": "saturn.cli.checkout.smoke.smoke_ok",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.smoke.smoke_stop",
      "to": "saturn.cli.checkout.result.done",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.smoke.smoke_fail_stop",
      "to": "saturn.cli.checkout.result.failed",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.verification.check",
      "to": "saturn.cli.checkout.verification.run_checks",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.verification.run_checks",
      "to": "saturn.cli.checkout.verification.checks_ok",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.automation.ci",
      "to": "saturn.cli.checkout.automation.windows",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.automation.ci_windows",
      "to": "saturn.cli.checkout.tools.setup",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.automation.ci_linux",
      "to": "saturn.cli.checkout.tools.setup",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.automation.ci_linux",
      "to": "saturn.cli.checkout.verification.check",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "saturn.cli.checkout.automation.ci_windows",
      "to": "saturn.cli.checkout.verification.check",
      "label": "checkout_report",
      "kind": "data"
    },
    {
      "from": "owner",
      "to": "benchmark.curation.sources.start",
      "label": "prepare the shared corpus",
      "kind": "control",
      "contract": {
        "mode": "Local source curation followed by corpus validation; source records retain the capture commands",
        "timeout": "No benchmark model calls in this slice",
        "retry": "Explicit rerun after correcting rejected input"
      }
    },
    {
      "from": "benchmark.curation.sources.start",
      "to": "benchmark.curation.sources.select",
      "label": "golden_manifest",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.sources.select",
      "to": "benchmark.curation.sources.licence",
      "label": "golden_manifest",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.sources.capture",
      "to": "benchmark.curation.sources.assets_valid",
      "label": "golden_assets",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.labels.oracle",
      "to": "benchmark.curation.labels.split",
      "label": "golden_labels",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.labels.split",
      "to": "benchmark.curation.labels.separated",
      "label": "golden_manifest",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.labels.review",
      "to": "benchmark.curation.labels.reviewed",
      "label": "golden_report",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.freeze.validate",
      "to": "benchmark.curation.freeze.valid",
      "label": "golden_report",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.freeze.publish",
      "to": "benchmark.dataset",
      "label": "golden_manifest",
      "kind": "data"
    },
    {
      "from": "benchmark.curation.freeze.reject",
      "to": "benchmark.reports",
      "label": "golden_report",
      "kind": "data"
    },
    {
      "from": "owner",
      "to": "benchmark.access.invoke",
      "label": "inspect or prepare corpus",
      "kind": "control",
      "contract": {
        "mode": "Local Python CLI",
        "timeout": "No model or network call",
        "retry": "Explicit rerun after correction"
      }
    },
    {
      "from": "benchmark.access.invoke",
      "to": "benchmark.access.load",
      "label": "golden_manifest",
      "kind": "data"
    },
    {
      "from": "benchmark.dataset",
      "to": "benchmark.access.load",
      "label": "golden_manifest",
      "kind": "store"
    },
    {
      "from": "benchmark.access.load",
      "to": "benchmark.access.integrity",
      "label": "golden_report",
      "kind": "data"
    },
    {
      "from": "benchmark.access.report",
      "to": "benchmark.reports",
      "label": "golden_report",
      "kind": "store"
    },
    {
      "from": "benchmark.access.packet",
      "to": "owner",
      "label": "golden_labels",
      "kind": "ui"
    },
    {
      "from": "benchmark.access.workspace.copy",
      "to": "benchmark.workspace",
      "label": "golden_workspace",
      "kind": "store"
    },
    {
      "to": "benchmark.execution.prepare.start",
      "label": "run benchmark suite",
      "kind": "control",
      "from": "owner",
      "contract": {
        "mode": "Local benchmark CLI after execution-contract approval",
        "timeout": "Six-hour suite cap; 90 seconds per call and 180 seconds per workflow",
        "retry": "No hidden retries; explicit reruns are separate observations"
      }
    },
    {
      "to": "benchmark.execution.prepare.plan",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.prepare.start"
    },
    {
      "to": "benchmark.execution.prepare.valid",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.prepare.plan"
    },
    {
      "to": "benchmark.execution.prepare.isolate",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.prepare.provisional"
    },
    {
      "to": "benchmark.execution.prepare.ready",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.prepare.isolate"
    },
    {
      "to": "benchmark.execution.workload.replay",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.workload.schedule"
    },
    {
      "to": "benchmark.execution.workload.dispatch",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.workload.replay"
    },
    {
      "to": "benchmark.execution.workload.cancel",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.workload.dispatch"
    },
    {
      "to": "benchmark.execution.observe.collect",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.workload.cancel_call"
    },
    {
      "to": "benchmark.execution.observe.score",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.observe.collect"
    },
    {
      "to": "benchmark.execution.observe.persist",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.observe.score"
    },
    {
      "to": "benchmark.execution.workload.more",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.observe.persist"
    },
    {
      "to": "benchmark.execution.finish.compare",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.finish.cleanup"
    },
    {
      "to": "benchmark.execution.finish.report",
      "label": "benchmark_observation",
      "kind": "data",
      "from": "benchmark.execution.finish.compare"
    },
    {
      "to": "benchmark.results",
      "label": "benchmark_report",
      "kind": "store",
      "from": "benchmark.execution.finish.fail"
    },
    {
      "to": "benchmark.results",
      "label": "benchmark_report",
      "kind": "store",
      "from": "benchmark.execution.finish.report"
    },
    {
      "to": "saturn.cli.checkout.tools.setup",
      "label": "checkout_report",
      "kind": "data",
      "from": "saturn.cli.checkout.automation.ci_windows_only"
    },
    {
      "to": "saturn.cli.checkout.verification.check",
      "label": "checkout_report",
      "kind": "data",
      "from": "saturn.cli.checkout.automation.ci_windows_only"
    },
    {
      "from": "saturn.service.evidence.timing.entry.begin",
      "to": "saturn.service.evidence.timing.entry.enabled",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.entry.allocate",
      "to": "saturn.service.evidence.timing.capture.sources.choose",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.entry.overflow",
      "to": "saturn.service.evidence.timing.finish.seal",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.sources.application",
      "to": "saturn.service.evidence.timing.capture.bounded",
      "label": "timing_interval",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.sources.database_lock",
      "to": "saturn.service.evidence.timing.capture.bounded",
      "label": "timing_interval",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.sources.database_operation",
      "to": "saturn.service.evidence.timing.capture.bounded",
      "label": "timing_interval",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.sources.model_slot",
      "to": "saturn.service.evidence.timing.capture.bounded",
      "label": "timing_interval",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.sources.backend",
      "to": "saturn.service.evidence.timing.capture.bounded",
      "label": "timing_interval",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.sources.unknown",
      "to": "saturn.service.evidence.timing.capture.bounded",
      "label": "timing_interval",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.append",
      "to": "saturn.service.evidence.timing.capture.more",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.capture.drop",
      "to": "saturn.service.evidence.timing.capture.more",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.seal",
      "to": "saturn.service.evidence.timing.finish.size",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.shorten",
      "to": "saturn.service.evidence.timing.finish.export.bind",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.export.persist",
      "to": "saturn.service.evidence.timing.finish.export.saved",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.export.publish",
      "to": "saturn.service.evidence.timing.finish.leased",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.export.missing",
      "to": "saturn.service.evidence.timing.finish.leased",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.export.failed",
      "to": "saturn.service.evidence.timing.finish.leased",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.release",
      "to": "saturn.service.evidence.timing.finish.done",
      "label": "timing_scope",
      "kind": "data"
    },
    {
      "from": "saturn.service.evidence.timing.finish.export.persist",
      "to": "saturn.database",
      "label": "payload",
      "kind": "store"
    },
    {
      "from": "benchmark.execution.internal_latency.prepare.start",
      "to": "benchmark.execution.internal_latency.prepare.plan",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.prepare.plan",
      "to": "benchmark.execution.internal_latency.prepare.hardware.read",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.prepare.isolate",
      "to": "benchmark.execution.internal_latency.measure.mode",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.measure.core",
      "to": "benchmark.execution.internal_latency.measure.dispatch",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.measure.model",
      "to": "benchmark.execution.internal_latency.measure.ready",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.measure.overhead",
      "to": "benchmark.execution.internal_latency.measure.dispatch",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.measure.dispatch",
      "to": "benchmark.execution.internal_latency.collection.read",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.measure.blocked",
      "to": "benchmark.execution.internal_latency.collection.incomplete",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.collection.read",
      "to": "benchmark.execution.internal_latency.collection.required",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.collection.incomplete",
      "to": "benchmark.execution.internal_latency.reporting.aggregate",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.reporting.aggregate",
      "to": "benchmark.execution.internal_latency.reporting.persist",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.reporting.persist",
      "to": "benchmark.execution.internal_latency.reporting.more",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.reporting.fail",
      "to": "benchmark.execution.internal_latency.reporting.cleanup",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.reporting.cleanup",
      "to": "benchmark.execution.internal_latency.reporting.report",
      "label": "internal_latency_observation",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.reporting.report",
      "to": "benchmark.results",
      "label": "internal_latency_report",
      "kind": "store"
    },
    {
      "from": "benchmark.execution.internal_latency.measure.dispatch",
      "to": "saturn.service.evidence.timing.entry.begin",
      "label": "begin optional scope for the measured MCP call",
      "kind": "monitor"
    },
    {
      "from": "saturn.service.evidence.timing.finish.export.publish",
      "to": "benchmark.execution.internal_latency.collection.read",
      "label": "timing_profile",
      "kind": "monitor"
    },
    {
      "from": "benchmark.execution.internal_latency.prepare.hardware.read",
      "to": "benchmark.execution.internal_latency.prepare.hardware.available",
      "label": "internal_latency_plan",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.prepare.hardware.keep",
      "to": "benchmark.execution.internal_latency.prepare.hardware.more",
      "label": "internal_latency_plan",
      "kind": "data"
    },
    {
      "from": "benchmark.execution.internal_latency.prepare.hardware.unknown",
      "to": "benchmark.execution.internal_latency.prepare.hardware.more",
      "label": "internal_latency_plan",
      "kind": "data"
    }
  ],
  "journeys": [
    {
      "id": "stdio_request",
      "name": "Client starts an authenticated stdio bridge",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.stdio.bridge_receive -> saturn.bridge.stdio.bridge_token -> saturn.bridge.stdio.upstream.bridge_health -> saturn.bridge.stdio.upstream.bridge_workspace -> saturn.bridge.stdio.upstream.bridge_forward -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_catalog -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.home.home_credentials -> saturn.bridge.stdio.bridge_receive"
      ]
    },
    {
      "id": "stdio_missing_token",
      "name": "Bridge cannot find its harness credential",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.stdio.bridge_receive -> saturn.bridge.stdio.bridge_token -> saturn.bridge.stdio.upstream.bridge_error -> clients"
      ]
    },
    {
      "id": "stdio_windows_start",
      "name": "Windows bridge starts a stopped local service",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.stdio.bridge_receive -> saturn.bridge.stdio.bridge_token -> saturn.bridge.stdio.upstream.bridge_health -> saturn.bridge.stdio.upstream.bridge_startable -> saturn.bridge.stdio.upstream.bridge_start -> saturn.bridge.stdio.upstream.bridge_health -> saturn.bridge.stdio.upstream.bridge_workspace -> saturn.bridge.stdio.upstream.bridge_forward -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_catalog -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ]
    },
    {
      "id": "stdio_stopped",
      "name": "Bridge cannot automatically start this service",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.stdio.bridge_receive -> saturn.bridge.stdio.bridge_token -> saturn.bridge.stdio.upstream.bridge_health -> saturn.bridge.stdio.upstream.bridge_startable -> saturn.bridge.stdio.upstream.bridge_error -> clients"
      ]
    },
    {
      "id": "mcp_initialize",
      "name": "Client initializes or closes an MCP session",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.mcp_housekeeping -> clients"
      ]
    },
    {
      "id": "mcp_unconfigured",
      "name": "MCP has no configured harness",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.replies.not_configured -> clients"
      ]
    },
    {
      "id": "mcp_wrong_token",
      "name": "MCP token is missing, expired, revoked, or disabled",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.replies.auth_failure -> clients",
        "saturn.service.ingress.replies.auth_failure -> saturn.database"
      ]
    },
    {
      "id": "mcp_bad_host",
      "name": "Request names an untrusted Host",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.replies.http_failure -> clients"
      ]
    },
    {
      "id": "mcp_bad_arguments",
      "name": "Public tool arguments fail schema validation",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.replies.http_failure -> clients"
      ]
    },
    {
      "id": "tool_permission_refused",
      "name": "Harness lacks the requested tool",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.replies.reject_tool -> saturn.service.evidence.trace.trace_response -> clients",
        "saturn.service.ingress.replies.reject_tool -> saturn.database"
      ]
    },
    {
      "id": "workspace_missing",
      "name": "Workspace selection refused: missing",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_optional -> saturn.service.ingress.replies.reject_workspace -> saturn.service.evidence.trace.trace_response -> clients",
        "saturn.service.ingress.replies.reject_workspace -> saturn.database"
      ]
    },
    {
      "id": "workspace_invalid",
      "name": "Workspace selection refused: invalid",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_optional -> saturn.service.ingress.replies.reject_workspace -> saturn.service.evidence.trace.trace_response -> clients",
        "saturn.service.ingress.replies.reject_workspace -> saturn.database"
      ]
    },
    {
      "id": "workspace_global",
      "name": "Workspace selection refused: global",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_optional -> saturn.service.ingress.replies.reject_workspace -> saturn.service.evidence.trace.trace_response -> clients",
        "saturn.service.ingress.replies.reject_workspace -> saturn.database"
      ]
    },
    {
      "id": "workspace_harness",
      "name": "Workspace selection refused: harness",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_optional -> saturn.service.ingress.replies.reject_workspace -> saturn.service.evidence.trace.trace_response -> clients",
        "saturn.service.ingress.replies.reject_workspace -> saturn.database"
      ]
    },
    {
      "id": "command_inline",
      "name": "Run a permitted command with short output",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.evidence.trace.trace_start -> saturn.database",
        "saturn.service.evidence.trace.trace_finish -> saturn.database",
        "saturn.service.evidence.trace.trace_response -> saturn.database"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_direct_http",
      "name": "Return a short command result directly over HTTP",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> clients"
      ]
    },
    {
      "id": "command_bad_cwd",
      "name": "Refuse an invalid command working directory",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_refused_path",
      "name": "Refuse command: path",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_refuse -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_refused_deny",
      "name": "Refuse command: deny",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_refuse -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_refused_grammar",
      "name": "Refuse command: grammar",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.policy.policy_refuse -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_allow",
      "name": "Run a command permitted by allow policy",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_open",
      "name": "Run a command permitted by open policy",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_not_found",
      "name": "Report a missing executable",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_windows_batch",
      "name": "Run a safe Windows batch launcher",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.preparation.runner_safe_args -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_unsafe_batch",
      "name": "Refuse unsafe Windows batch arguments",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.preparation.runner_safe_args -> saturn.service.tools.run.policy.policy_refuse -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_capture_limit",
      "name": "Continue draining output after the capture limit",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_drop -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_timeout",
      "name": "Kill and report a timed-out command",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.runner.process.runner_kill -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_cancel",
      "name": "Kill the owned tree after request cancellation",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.runner.process.runner_cancel -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_digest",
      "name": "Store long output and return a code-only digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.evidence.artifacts.artifact_write -> saturn.database"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "command_model_digest",
      "name": "Enhance a long-output digest with checked model facts",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.digest.mapping.digest_fact -> saturn.service.tools.digest.mapping.digest_accept -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.digest.reduction.digest_reduce -> saturn.service.tools.digest.reduction.digest_merge -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.model.gateway.gateway_send -> saturn.service.evidence.trace.trace_model -> saturn.database"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_unknown_line",
      "name": "Drop a fact that cites a line absent from its excerpt",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.digest.mapping.digest_fact -> saturn.service.tools.digest.mapping.digest_reject -> saturn.service.tools.digest.reduction.digest_reduce -> saturn.service.tools.digest.reduction.digest_merge -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_empty_excerpt",
      "name": "Reduce an empty set of model excerpts",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.reduction.digest_reduce -> saturn.service.tools.digest.reduction.digest_merge -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_pytest",
      "name": "Extract a deterministic pytest digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_pytest -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_diff",
      "name": "Extract a deterministic diff digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_diff -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_traceback",
      "name": "Extract a deterministic traceback digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_traceback -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_lint",
      "name": "Extract a deterministic lint digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_lint -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_diagnostics",
      "name": "Extract a deterministic diagnostics digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_diagnostics -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_json",
      "name": "Extract a deterministic json digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_json -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_format_log",
      "name": "Extract a deterministic log digest",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_log -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_no_model",
      "name": "Fall back to code after a missing worker model",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.errors.model_failure -> saturn.service.tools.digest.reduction.digest_fallback -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_cooldown",
      "name": "Fall back while the model circuit breaker is open",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.errors.model_failure -> saturn.service.tools.digest.reduction.digest_fallback -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_correction",
      "name": "Retry malformed model arguments once",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_retry -> saturn.service.model.gateway.gateway_correct -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.digest.mapping.digest_fact -> saturn.service.tools.digest.mapping.digest_accept -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.digest.reduction.digest_reduce -> saturn.service.tools.digest.reduction.digest_merge -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_invalid_model",
      "name": "Fall back after the schema correction retry is exhausted",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_retry -> saturn.service.model.errors.model_invalid -> saturn.service.tools.digest.reduction.digest_fallback -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_server_authentication",
      "name": "Fall back after model authentication failure",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.errors.gateway_auth_error -> saturn.service.model.errors.model_failure -> saturn.service.tools.digest.reduction.digest_fallback -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_server_connection",
      "name": "Fall back after model connection failure",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.errors.gateway_connection_error -> saturn.service.model.errors.model_failure -> saturn.service.tools.digest.reduction.digest_fallback -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_server_http_status",
      "name": "Fall back after model http_status failure",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.errors.model_failure -> saturn.service.tools.digest.reduction.digest_fallback -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_whole",
      "name": "Read a complete short file",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "project -> saturn.service.tools.read.files.read_bytes"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_range",
      "name": "Read a bounded range from a source file",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_range_valid -> saturn.service.tools.read.render.read_number -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_bad_range",
      "name": "Refuse an empty or out-of-file range",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_range_valid -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_symbols",
      "name": "Return the source outline for a long file",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_outline -> saturn.service.tools.read.render.read_symbols -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_prefix",
      "name": "Return a short prefix for text without symbols",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_outline -> saturn.service.tools.read.render.read_prefix -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_refused_path",
      "name": "Refuse file read: path",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_refused_missing",
      "name": "Refuse file read: missing",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_refused_size",
      "name": "Refuse file read: size",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "read_refused_binary",
      "name": "Refuse file read: binary",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_inline",
      "name": "Search files and return all retained matches",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.matches.search_storage -> saturn.service.tools.search.traversal.matches.search_retain -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_render -> saturn.service.tools.search.output.search_overflow -> saturn.service.tools.search.output.search_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_artifact",
      "name": "Store matches omitted from the short search reply",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.matches.search_storage -> saturn.service.tools.search.traversal.matches.search_retain -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_render -> saturn.service.tools.search.output.search_overflow -> saturn.service.tools.search.output.search_store -> saturn.service.tools.search.output.search_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.tools.search.output.search_store -> saturn.database"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_invalid_regex",
      "name": "Refuse an invalid search expression",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_no_matches",
      "name": "Report no matching files",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_empty -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_skip_file",
      "name": "Skip an unreadable or oversized search candidate",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.traversal.search_skip -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_empty -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_loop",
      "name": "Continue scanning the next candidate",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.matches.search_storage -> saturn.service.tools.search.traversal.matches.search_retain -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.matches.search_storage -> saturn.service.tools.search.traversal.matches.search_retain -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_render -> saturn.service.tools.search.output.search_overflow -> saturn.service.tools.search.output.search_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_file_limit",
      "name": "Report a partial scan at the file-count limit",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_partial -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_empty -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_byte_limit",
      "name": "Report partially retained matches at the artifact byte limit",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.matches.search_storage -> saturn.service.tools.search.traversal.search_partial -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_render -> saturn.service.tools.search.output.search_overflow -> saturn.service.tools.search.output.search_store -> saturn.service.tools.search.output.search_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_regex_worker",
      "name": "Use the isolated worker for a regex",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_worker -> saturn.service.tools.search.regex.regex_send -> saturn.service.tools.search.regex.regex_deadline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.search.traversal.matches.search_matches -> saturn.service.tools.search.traversal.matches.search_storage -> saturn.service.tools.search.traversal.matches.search_retain -> saturn.service.tools.search.traversal.search_next -> saturn.service.tools.search.output.search_any -> saturn.service.tools.search.output.search_render -> saturn.service.tools.search.output.search_overflow -> saturn.service.tools.search.output.search_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_regex_start_failure",
      "name": "Report a worker startup failure",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_worker -> saturn.service.tools.search.regex.regex_stop -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "search_regex_timeout",
      "name": "Terminate regex matching after its deadline",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.search.traversal.search_pattern -> saturn.service.tools.search.traversal.search_walk -> saturn.service.tools.search.traversal.search_budget -> saturn.service.tools.search.traversal.search_readable -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_worker -> saturn.service.tools.search.regex.regex_send -> saturn.service.tools.search.regex.regex_deadline -> saturn.service.tools.search.regex.regex_stop -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_lines",
      "name": "Read numbered lines from a stored artifact",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_load -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.query.query_range -> saturn.service.tools.query.query_number -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.database -> saturn.service.evidence.artifacts.artifact_load"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_cache",
      "name": "Read a live artifact from the line cache",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.query.query_range -> saturn.service.tools.query.query_number -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_pattern",
      "name": "Search artifact lines",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_load -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.query.query_regex -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_inline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.query.query_regex_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_regex_worker",
      "name": "Search artifact lines through the isolated matcher",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_load -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.query.query_regex -> saturn.service.tools.search.regex.regex_literal -> saturn.service.tools.search.regex.regex_worker -> saturn.service.tools.search.regex.regex_send -> saturn.service.tools.search.regex.regex_deadline -> saturn.service.tools.search.regex.regex_result -> saturn.service.tools.query.query_regex_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_selectors",
      "name": "Refuse ambiguous artifact selectors",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_expired",
      "name": "Report a missing or expired artifact",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_bad_range",
      "name": "Refuse an invalid artifact line range",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_load -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.query.query_range -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_without_workspace",
      "name": "Read stored evidence without selecting a file workspace",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_optional -> saturn.service.ingress.workspace.workspace_no_root -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_load -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.query.query_range -> saturn.service.tools.query.query_number -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ]
    },
    {
      "id": "workspace_from_client_roots",
      "name": "Select the workspace from client roots",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.service.ingress.workspace.workspace_source": "No explicit workspace_root was supplied. The available client roots is selected using the implemented priority order."
      }
    },
    {
      "id": "workspace_from_absolute_cwd",
      "name": "Select the workspace from absolute cwd",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.service.ingress.workspace.workspace_source": "No explicit workspace_root was supplied. The available absolute cwd is selected using the implemented priority order."
      }
    },
    {
      "id": "workspace_from_single_harness_folder",
      "name": "Select the workspace from single harness folder",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.service.ingress.workspace.workspace_source": "No explicit workspace_root was supplied. The available single harness folder is selected using the implemented priority order."
      }
    },
    {
      "id": "workspace_from_single_global_folder",
      "name": "Select the workspace from single global folder",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.service.ingress.workspace.workspace_source": "No explicit workspace_root was supplied. The available single global folder is selected using the implemented priority order."
      }
    },
    {
      "id": "ask_answer",
      "name": "Research a project question and verify its citations",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "query_question",
      "name": "Research a question about a stored artifact",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.query.query_selector -> saturn.service.tools.query.query_artifact -> saturn.service.evidence.artifacts.artifact_cached -> saturn.service.evidence.artifacts.artifact_load -> saturn.service.evidence.artifacts.artifact_lines -> saturn.service.tools.query.query_mode -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_empty_task",
      "name": "Refuse an empty research task",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_disabled",
      "name": "Report a disabled research worker",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_directory",
      "name": "Research by directory",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.loop.ask_repeat -> saturn.service.tools.research.observations.ask_tool -> saturn.service.tools.research.observations.ask_list -> saturn.service.tools.research.observations.ask_observe -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_finish -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_source_lines",
      "name": "Research by source_lines",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.loop.ask_repeat -> saturn.service.tools.research.observations.ask_tool -> saturn.service.tools.research.observations.ask_read -> saturn.service.tools.research.observations.ask_observe -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_finish -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_search",
      "name": "Research by search",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.loop.ask_repeat -> saturn.service.tools.research.observations.ask_tool -> saturn.service.tools.research.observations.ask_grep -> saturn.service.tools.research.observations.ask_observe -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_finish -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_repeated_action",
      "name": "Stop repeating an already-seen observation",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.loop.ask_repeat -> saturn.service.tools.research.loop.ask_force_finish -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_finish -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_tool_refused",
      "name": "Keep a refused research read as an observation",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.loop.ask_repeat -> saturn.service.tools.research.observations.ask_tool -> saturn.service.tools.research.observations.ask_read -> saturn.service.tools.research.observations.ask_tool_error -> saturn.service.tools.research.observations.ask_observe -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_finish -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_invalid_reply",
      "name": "Spend a step on malformed research output",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_retry -> saturn.service.model.errors.model_invalid -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.loop.ask_invalid -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_finish -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_limit",
      "name": "Report a research loop that exhausts its steps",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_unfinished -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_bad_citation",
      "name": "Drop an unreadable or out-of-range citation",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_drop -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.validation.support_empty -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_model_failure",
      "name": "Report an unavailable research model",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.errors.model_failure -> saturn.service.evidence.trace.tool_failure -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_unsupported_claim",
      "name": "Omit a research claim rejected by the reviewer",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_drop -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_invalid_review",
      "name": "Omit a research claim with invalid review indexes",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_drop -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "ask_review_failure",
      "name": "Omit unreviewed claims after a model review failure",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.errors.model_failure -> saturn.service.tools.support.validation.support_empty -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "digest_unsupported_claim",
      "name": "Keep deterministic findings after a rejected model claim",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.evidence.artifacts.artifact_write -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.mapping.digest_condense -> saturn.service.tools.digest.mapping.digest_chunks -> saturn.service.tools.digest.mapping.digest_map -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.digest.mapping.digest_fact -> saturn.service.tools.digest.mapping.digest_accept -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_drop -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.digest.reduction.digest_reduce -> saturn.service.tools.digest.reduction.digest_merge -> saturn.service.tools.run.reply.run_digest_reply -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ],
      "notes": {
        "saturn.bridge.stdio.upstream.bridge_reply": "The stdio bridge returns this response to the original client. Direct HTTP calls use the corresponding HTTP response path."
      }
    },
    {
      "id": "model_claim",
      "name": "Saturn takes ownership of a previously unloaded model",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_claim -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.model.lifecycle.model_claim -> saturn.database"
      ]
    },
    {
      "id": "model_unmanaged",
      "name": "Model unloading is disabled",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.research.preparation.ask_task -> saturn.service.tools.research.preparation.ask_enabled -> saturn.service.tools.research.preparation.ask_seed -> saturn.service.tools.research.loop.ask_finish_only -> saturn.service.tools.research.loop.ask_offer_tools -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_leave -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.research.loop.ask_action -> saturn.service.tools.research.answer.ask_verify -> saturn.service.tools.research.answer.ask_keep -> saturn.service.tools.support.support_prepare -> saturn.service.tools.support.support_ready -> saturn.service.tools.support.support_request -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.service.tools.support.validation.support_valid -> saturn.service.tools.support.validation.support_supported -> saturn.service.tools.support.validation.support_keep -> saturn.service.tools.support.validation.support_result -> saturn.service.tools.research.answer.ask_answer -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ]
    },
    {
      "id": "model_call_finishes",
      "name": "Last owned model call schedules unloading",
      "type": "signal",
      "paths": [
        "saturn.service.model.gateway.gateway_result -> saturn.service.model.lifecycle.model_last_call -> saturn.service.model.lifecycle.model_schedule",
        "saturn.service.model.lifecycle.model_last_call -> saturn.service.model.lifecycle.model_leave"
      ]
    },
    {
      "id": "model_idle_unload",
      "name": "Unload the still-idle owned model",
      "type": "timer",
      "paths": [
        "saturn.service.model.lifecycle.idle.model_idle_tick -> saturn.service.model.lifecycle.idle.model_still_idle -> saturn.service.model.provider.provider_unload -> model_server -> saturn.service.model.lifecycle.idle.model_unloaded -> saturn.service.model.lifecycle.idle.model_forget -> saturn.database"
      ]
    },
    {
      "id": "model_idle_retry",
      "name": "Retry failed idle unloading at the next idle deadline",
      "type": "timer",
      "paths": [
        "saturn.service.model.lifecycle.idle.model_idle_tick -> saturn.service.model.lifecycle.idle.model_still_idle -> saturn.service.model.provider.provider_unload -> model_server -> saturn.service.model.lifecycle.idle.model_unloaded -> saturn.service.model.lifecycle.model_schedule"
      ]
    },
    {
      "id": "model_idle_cancel",
      "name": "Leave an active or externally owned model loaded",
      "type": "timer",
      "paths": [
        "saturn.service.model.lifecycle.idle.model_idle_tick -> saturn.service.model.lifecycle.idle.model_still_idle -> saturn.service.model.lifecycle.model_leave"
      ]
    },
    {
      "id": "provider_lmstudio",
      "name": "Inspect lmstudio model availability",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_model -> saturn.service.model.provider.provider_cache -> saturn.service.model.provider.provider_select -> saturn.service.model.provider.provider_lmstudio -> model_server -> saturn.service.model.provider.provider_reply -> saturn.dashboard.inspect.ui_evidence",
        "owner -> saturn.dashboard.inspect.ui_model"
      ]
    },
    {
      "id": "provider_ollama",
      "name": "Inspect ollama model availability",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_model -> saturn.service.model.provider.provider_cache -> saturn.service.model.provider.provider_select -> saturn.service.model.provider.provider_ollama -> model_server -> saturn.service.model.provider.provider_reply -> saturn.dashboard.inspect.ui_evidence",
        "owner -> saturn.dashboard.inspect.ui_model"
      ]
    },
    {
      "id": "provider_compatible",
      "name": "Inspect compatible model availability",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_model -> saturn.service.model.provider.provider_cache -> saturn.service.model.provider.provider_select -> saturn.service.model.provider.provider_openai -> model_server -> saturn.service.model.provider.provider_reply -> saturn.dashboard.inspect.ui_evidence",
        "owner -> saturn.dashboard.inspect.ui_model"
      ]
    },
    {
      "id": "provider_cached",
      "name": "Return a fresh model-status snapshot",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_model -> saturn.service.model.provider.provider_cache -> saturn.service.model.provider.provider_reply -> saturn.dashboard.inspect.ui_evidence",
        "owner -> saturn.dashboard.inspect.ui_model"
      ]
    },
    {
      "id": "settings_unchanged",
      "name": "Use unchanged settings and policy",
      "type": "call",
      "paths": [
        "saturn.service.ingress.ingress_refresh -> saturn.service.control.settings.settings_stamp -> saturn.service.control.settings.settings_changed -> saturn.service.control.settings.settings_current -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.home.home_settings -> saturn.service.control.settings.settings_stamp"
      ]
    },
    {
      "id": "settings_file_edit",
      "name": "Apply a valid configuration-file edit",
      "type": "data",
      "paths": [
        "saturn.home.home_settings -> saturn.service.control.settings.settings_stamp -> saturn.service.control.settings.settings_changed -> saturn.service.control.settings.settings_read -> saturn.service.control.settings.settings_valid -> saturn.service.control.settings.settings_apply -> saturn.service.control.settings.settings_current -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.control.settings.settings_apply -> saturn.database"
      ]
    },
    {
      "id": "settings_file_invalid",
      "name": "Keep last good settings after an invalid edit",
      "type": "data",
      "paths": [
        "saturn.home.home_settings -> saturn.service.control.settings.settings_stamp -> saturn.service.control.settings.settings_changed -> saturn.service.control.settings.settings_read -> saturn.service.control.settings.settings_valid -> saturn.service.control.settings.settings_keep -> saturn.dashboard.settings.ui_render"
      ]
    },
    {
      "id": "settings_saved",
      "name": "Save valid dashboard settings",
      "type": "user",
      "paths": [
        "saturn.dashboard.settings.ui_save -> saturn.service.control.api.api_operation -> saturn.service.control.api.api_settings_origin -> saturn.service.control.api.api_settings_action -> saturn.service.control.settings.settings_save -> saturn.home.home_settings",
        "saturn.service.control.settings.settings_save -> saturn.database",
        "saturn.service.control.settings.settings_save -> saturn.dashboard.settings.ui_render",
        "owner -> saturn.dashboard.settings.ui_save"
      ]
    },
    {
      "id": "settings_cross_origin",
      "name": "Refuse cross-origin settings writes",
      "type": "user",
      "paths": [
        "saturn.dashboard.settings.ui_save -> saturn.service.control.api.api_operation -> saturn.service.control.api.api_settings_origin -> saturn.service.control.owner.owner_failure -> saturn.dashboard.settings.ui_render",
        "owner -> saturn.dashboard.settings.ui_save"
      ]
    },
    {
      "id": "model_test",
      "name": "Test the selected worker with a real tool schema",
      "type": "user",
      "paths": [
        "saturn.dashboard.settings.ui_test -> saturn.service.control.api.api_operation -> saturn.service.control.api.api_settings_origin -> saturn.service.control.api.api_settings_action -> saturn.service.control.api.api_model_test -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.dashboard.settings.ui_render",
        "saturn.service.model.gateway.gateway_send -> saturn.service.evidence.trace.trace_model -> saturn.database",
        "owner -> saturn.dashboard.settings.ui_test"
      ]
    },
    {
      "id": "policy_simulation",
      "name": "Check a proposed command without running it",
      "type": "user",
      "paths": [
        "saturn.dashboard.settings.ui_policy -> saturn.service.control.api.api_operation -> saturn.service.control.api.api_policy_test -> saturn.dashboard.settings.ui_render",
        "owner -> saturn.dashboard.settings.ui_policy"
      ]
    },
    {
      "id": "access_create",
      "name": "Owner create harness access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_create -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.creation.access_valid -> saturn.service.control.access.creation.access_handle -> saturn.service.control.access.creation.access_create -> saturn.service.control.access.revocation.access_view -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.access.creation.access_create -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_create"
      ]
    },
    {
      "id": "credential_create",
      "name": "Save the create local harness token",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_create -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.creation.access_valid -> saturn.service.control.access.creation.access_handle -> saturn.service.control.access.creation.access_create -> saturn.home.home_credentials",
        "owner -> saturn.dashboard.connections.ui_create"
      ]
    },
    {
      "id": "access_edit",
      "name": "Owner edit harness access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_edit -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.mutations.access_existing -> saturn.service.control.access.mutations.access_active -> saturn.service.control.access.mutations.access_operation -> saturn.service.control.access.mutations.access_edit -> saturn.service.control.access.revocation.access_view -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.access.mutations.access_edit -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_edit"
      ]
    },
    {
      "id": "access_rotate",
      "name": "Owner rotate harness access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_rotate -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.mutations.access_active -> saturn.service.control.access.mutations.access_operation -> saturn.service.control.access.mutations.access_rotate -> saturn.service.control.access.revocation.access_view -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.access.mutations.access_rotate -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_rotate"
      ]
    },
    {
      "id": "credential_rotate",
      "name": "Save the rotate local harness token",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_rotate -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.mutations.access_active -> saturn.service.control.access.mutations.access_operation -> saturn.service.control.access.mutations.access_rotate -> saturn.home.home_credentials",
        "owner -> saturn.dashboard.connections.ui_rotate"
      ]
    },
    {
      "id": "access_enabled",
      "name": "Owner enabled harness access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_edit -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.mutations.access_active -> saturn.service.control.access.mutations.access_operation -> saturn.service.control.access.mutations.access_enable -> saturn.service.control.access.revocation.access_view -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.access.mutations.access_enable -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_edit"
      ]
    },
    {
      "id": "access_revoke",
      "name": "Owner revoke harness access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_revoke -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.revocation.access_revoke -> saturn.service.control.access.revocation.access_mark_revoked -> saturn.service.control.access.revocation.access_view -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.access.revocation.access_mark_revoked -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_revoke"
      ]
    },
    {
      "id": "access_already_revoked",
      "name": "Repeat an already-completed revocation",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_revoke -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.revocation.access_revoke -> saturn.service.control.access.revocation.access_view -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_revoke"
      ]
    },
    {
      "id": "access_error_invalid_fields",
      "name": "Refuse harness change: invalid_fields",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_create -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.creation.access_valid -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_create"
      ]
    },
    {
      "id": "access_error_duplicate_handle",
      "name": "Refuse harness change: duplicate_handle",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_create -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.creation.access_valid -> saturn.service.control.access.creation.access_handle -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_create"
      ]
    },
    {
      "id": "access_error_missing",
      "name": "Refuse harness change: missing",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_edit -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.mutations.access_existing -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_edit"
      ]
    },
    {
      "id": "access_error_revoked",
      "name": "Refuse harness change: revoked",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_edit -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.access.mutations.access_existing -> saturn.service.control.access.mutations.access_active -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_edit"
      ]
    },
    {
      "id": "owner_remote_peer",
      "name": "Refuse remote access-management requests",
      "type": "call",
      "paths": [
        "clients -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_failure -> clients"
      ]
    },
    {
      "id": "owner_cross_origin",
      "name": "Refuse cross-origin access-management requests",
      "type": "call",
      "paths": [
        "clients -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_failure -> clients"
      ]
    },
    {
      "id": "owner_bad_headers",
      "name": "Refuse access mutations without the write headers",
      "type": "call",
      "paths": [
        "clients -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_failure -> clients"
      ]
    },
    {
      "id": "owner_access_read",
      "name": "Read local harness metadata",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_connections -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_connections"
      ]
    },
    {
      "id": "connect_claude_preview",
      "name": "Preview claude configuration without writing",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_preview -> saturn.dashboard.connections.ui_access",
        "client_files -> saturn.service.control.connect.preview.connect_claude",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_claude_apply",
      "name": "Install the confirmed claude configuration",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.application.persistence.connect_record -> saturn.service.control.connect.application.persistence.connect_saved -> saturn.service.control.connect.application.persistence.connect_audit -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.connect.application.files.connect_backup -> saturn.home.home_installs",
        "saturn.service.control.connect.application.persistence.connect_record -> saturn.home.home_installs",
        "saturn.service.control.connect.application.persistence.connect_audit -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_codex_preview",
      "name": "Preview codex configuration without writing",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_codex -> saturn.service.control.connect.preview.connect_codex_block -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_preview -> saturn.dashboard.connections.ui_access",
        "client_files -> saturn.service.control.connect.preview.connect_codex",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_codex_apply",
      "name": "Install the confirmed codex configuration",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_codex -> saturn.service.control.connect.preview.connect_codex_block -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.application.persistence.connect_record -> saturn.service.control.connect.application.persistence.connect_saved -> saturn.service.control.connect.application.persistence.connect_audit -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.connect.application.files.connect_backup -> saturn.home.home_installs",
        "saturn.service.control.connect.application.persistence.connect_record -> saturn.home.home_installs",
        "saturn.service.control.connect.application.persistence.connect_audit -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_new_harness",
      "name": "Create access before writing a new client registration",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.access.creation.access_create -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.application.persistence.connect_record -> saturn.service.control.connect.application.persistence.connect_saved -> saturn.service.control.connect.application.persistence.connect_audit -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.access.creation.access_create -> saturn.home.home_credentials",
        "saturn.service.control.access.creation.access_create -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_unusable_harness",
      "name": "Refuse disabled or revoked installation access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_unknown_client",
      "name": "Refuse an unsupported client writer",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_codex_conflict",
      "name": "Refuse malformed or unmanaged conflicting Codex entries",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_codex -> saturn.service.control.owner.owner_failure -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_write_failure",
      "name": "Restore client files after an installation write fails",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.recovery.connect_restore -> client_files -> saturn.service.control.connect.recovery.connect_restored -> saturn.service.control.connect.recovery.connect_recovery_ok -> saturn.service.control.connect.recovery.connect_revoke_new -> saturn.service.control.connect.recovery.connect_recovery_report -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_stale_preview",
      "name": "Refuse a changed client preview and recover new access",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.recovery.connect_restore -> client_files -> saturn.service.control.connect.recovery.connect_restored -> saturn.service.control.connect.recovery.connect_recovery_ok -> saturn.service.control.connect.recovery.connect_revoke_new -> saturn.service.control.connect.recovery.connect_recovery_report -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_record_failure",
      "name": "Restore client files after installation-record persistence fails",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.application.persistence.connect_record -> saturn.service.control.connect.application.persistence.connect_saved -> saturn.service.control.connect.recovery.connect_restore -> client_files -> saturn.service.control.connect.recovery.connect_restored -> saturn.service.control.connect.recovery.connect_recovery_ok -> saturn.service.control.connect.recovery.connect_revoke_new -> saturn.service.control.connect.recovery.connect_recovery_report -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_recovery_incomplete",
      "name": "Report an installation whose file recovery also fails",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.recovery.connect_restore -> client_files -> saturn.service.control.connect.recovery.connect_restored -> saturn.service.control.connect.recovery.connect_recovery_partial -> saturn.service.control.connect.recovery.connect_revoke_new -> saturn.service.control.connect.recovery.connect_recovery_report -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "connect_failed_new_harness",
      "name": "Revoke access created for a failed installation",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_install -> saturn.service.control.owner.owner_peer -> saturn.service.control.owner.owner_origin -> saturn.service.control.owner.owner_method -> saturn.service.control.owner.owner_headers -> saturn.service.control.owner.owner_dispatch -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_create_harness -> saturn.service.control.access.creation.access_create -> saturn.service.control.connect.application.files.connect_fresh -> saturn.service.control.connect.application.files.connect_backup -> client_files -> saturn.service.control.connect.application.persistence.connect_validate -> saturn.service.control.connect.recovery.connect_restore -> client_files -> saturn.service.control.connect.recovery.connect_restored -> saturn.service.control.connect.recovery.connect_recovery_ok -> saturn.service.control.connect.recovery.connect_revoke_new -> saturn.service.control.connect.recovery.connect_revoke_attempt -> saturn.service.control.connect.recovery.connect_recovery_report -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.connect.recovery.connect_revoke_attempt -> saturn.home.home_credentials",
        "saturn.service.control.connect.recovery.connect_revoke_attempt -> saturn.database",
        "owner -> saturn.dashboard.connections.ui_install"
      ]
    },
    {
      "id": "client_remove",
      "name": "Remove registration while retaining the harness",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_remove -> saturn.service.control.connect.removal.connect_remove -> client_files -> saturn.service.control.connect.removal.connect_remove_revoke -> saturn.service.control.connect.removal.connect_removed -> saturn.dashboard.connections.ui_access",
        "saturn.service.control.connect.removal.connect_remove -> saturn.home.home_installs",
        "owner -> saturn.dashboard.connections.ui_remove"
      ]
    },
    {
      "id": "client_remove_revoke",
      "name": "Remove registration and revoke its harness",
      "type": "user",
      "paths": [
        "saturn.dashboard.connections.ui_remove -> saturn.service.control.connect.removal.connect_remove -> client_files -> saturn.service.control.connect.removal.connect_remove_revoke -> saturn.service.control.access.revocation.access_mark_revoked -> saturn.home.home_credentials",
        "saturn.service.control.access.revocation.access_mark_revoked -> saturn.database",
        "saturn.service.control.access.revocation.access_mark_revoked -> saturn.service.control.connect.removal.connect_removed -> saturn.dashboard.connections.ui_access",
        "owner -> saturn.dashboard.connections.ui_remove"
      ]
    },
    {
      "id": "dashboard_overview",
      "name": "Inspect overview evidence",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_overview -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_etag -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.inspect.ui_evidence",
        "saturn.database -> saturn.service.control.api.pages.api_render",
        "owner -> saturn.dashboard.inspect.ui_overview"
      ]
    },
    {
      "id": "dashboard_runs",
      "name": "Inspect runs evidence",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_runs -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.inspect.ui_evidence",
        "saturn.database -> saturn.service.control.api.pages.api_render",
        "owner -> saturn.dashboard.inspect.ui_runs"
      ]
    },
    {
      "id": "dashboard_artifacts",
      "name": "Inspect artifacts evidence",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_artifacts -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.inspect.ui_evidence",
        "saturn.database -> saturn.service.control.api.pages.api_render",
        "owner -> saturn.dashboard.inspect.ui_artifacts"
      ]
    },
    {
      "id": "dashboard_changes",
      "name": "Inspect changes evidence",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_changes -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.inspect.ui_evidence",
        "saturn.database -> saturn.service.control.api.pages.api_render",
        "owner -> saturn.dashboard.inspect.ui_changes"
      ]
    },
    {
      "id": "dashboard_settings",
      "name": "Inspect runtime settings and validation messages",
      "type": "user",
      "paths": [
        "saturn.dashboard.settings.ui_settings -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.settings.ui_render",
        "saturn.home.home_settings -> saturn.service.control.api.pages.api_render",
        "owner -> saturn.dashboard.settings.ui_settings"
      ]
    },
    {
      "id": "overview_not_modified",
      "name": "Keep the overview after HTTP 304",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_overview -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_etag -> saturn.service.control.api.pages.api_not_modified -> saturn.dashboard.inspect.ui_evidence",
        "owner -> saturn.dashboard.inspect.ui_overview"
      ]
    },
    {
      "id": "dashboard_record_missing",
      "name": "Show missing or expired evidence",
      "type": "user",
      "paths": [
        "saturn.dashboard.inspect.ui_artifacts -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_missing -> saturn.dashboard.inspect.ui_evidence",
        "owner -> saturn.dashboard.inspect.ui_artifacts"
      ]
    },
    {
      "id": "liveness",
      "name": "Read process liveness",
      "type": "call",
      "paths": [
        "clients -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.reads.api_health -> clients"
      ]
    },
    {
      "id": "readiness",
      "name": "Read readiness without requiring a worker model",
      "type": "call",
      "paths": [
        "clients -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.reads.api_ready -> saturn.service.control.api.reads.api_health -> clients"
      ]
    },
    {
      "id": "readiness_degraded",
      "name": "Report a selected but unavailable worker",
      "type": "call",
      "paths": [
        "clients -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.reads.api_ready -> saturn.service.control.api.reads.api_degraded -> clients"
      ]
    },
    {
      "id": "hook_redirect",
      "name": "Redirect a permitted noisy shell call to saturn_run",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.pre.hook_shell -> saturn.service.hooks.pre.hook_direct -> saturn.service.hooks.pre.hook_scope -> saturn.service.hooks.pre.hook_policy -> saturn.service.hooks.pre.hook_redirect -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_print -> clients",
        "saturn.service.hooks.pre.hook_redirect -> saturn.service.evidence.trace.trace_start -> saturn.database"
      ]
    },
    {
      "id": "hook_post",
      "name": "Replace long successful Claude shell output",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.post.hook_post_shape -> saturn.service.hooks.post.hook_post_budget -> saturn.service.hooks.post.hook_store -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.hooks.post.hook_shorter -> saturn.service.hooks.post.hook_replace -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_print -> clients",
        "saturn.service.hooks.post.hook_store -> saturn.database"
      ]
    },
    {
      "id": "hook_pass_ineligible",
      "name": "Leave shell behavior unchanged: ineligible",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_pass_shell",
      "name": "Leave shell behavior unchanged: shell",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.pre.hook_shell -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_pass_direct",
      "name": "Leave shell behavior unchanged: direct",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.pre.hook_shell -> saturn.service.hooks.pre.hook_direct -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_pass_scope",
      "name": "Leave shell behavior unchanged: scope",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.pre.hook_shell -> saturn.service.hooks.pre.hook_direct -> saturn.service.hooks.pre.hook_scope -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_pass_policy",
      "name": "Leave shell behavior unchanged: policy",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.pre.hook_shell -> saturn.service.hooks.pre.hook_direct -> saturn.service.hooks.pre.hook_scope -> saturn.service.hooks.pre.hook_policy -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_post_shape",
      "name": "Leave completed shell output unchanged: shape",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.post.hook_post_shape -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_post_short",
      "name": "Leave completed shell output unchanged: short",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.post.hook_post_shape -> saturn.service.hooks.post.hook_post_budget -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_digest_not_shorter",
      "name": "Leave shell output unchanged after an unhelpful digest",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_eligible -> saturn.service.hooks.input.hook_phase -> saturn.service.hooks.post.hook_post_shape -> saturn.service.hooks.post.hook_post_budget -> saturn.service.hooks.post.hook_store -> saturn.service.tools.digest.deterministic.digest_parse -> saturn.service.tools.digest.deterministic.classifier.digest_kind -> saturn.service.tools.digest.deterministic.classifier.parsers.digest_generic -> saturn.service.tools.digest.deterministic.digest_model -> saturn.service.tools.digest.deterministic.digest_code -> saturn.service.hooks.post.hook_shorter -> saturn.service.hooks.input.hook_pass -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_error_token",
      "name": "Reject hook input and fail open in the relay: token",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_error -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_error_oversized",
      "name": "Reject hook input and fail open in the relay: oversized",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_error -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "hook_error_json",
      "name": "Reject hook input and fail open in the relay: json",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.service.hooks.input.hook_auth -> saturn.service.hooks.input.hook_size -> saturn.service.hooks.input.hook_json -> saturn.service.hooks.input.hook_error -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "relay_unsupported",
      "name": "Ignore an unsupported or oversized relay event",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "relay_no_credential",
      "name": "Fail open without a relay credential",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "relay_service_down",
      "name": "Fail open when the service fails to answer",
      "type": "call",
      "paths": [
        "clients -> saturn.bridge.relay.relay_supported -> saturn.bridge.relay.relay_token -> saturn.bridge.relay.relay_send -> saturn.bridge.relay.relay_response -> saturn.bridge.relay.relay_skip -> clients"
      ]
    },
    {
      "id": "start_service",
      "name": "Start a foreground or managed service",
      "type": "signal",
      "paths": [
        "saturn.service.lifecycle.service_start -> saturn.service.lifecycle.service_config -> saturn.service.evidence.retention.schema_compatible -> saturn.service.evidence.retention.schema_migrate -> saturn.service.lifecycle.service_recover -> saturn.service.evidence.retention.retention_expire -> saturn.service.evidence.retention.retention_budget -> saturn.service.evidence.retention.retention_done -> saturn.service.lifecycle.service_ready",
        "saturn.home.home_env -> saturn.service.lifecycle.service_config",
        "saturn.service.evidence.retention.schema_migrate -> saturn.database",
        "saturn.service.lifecycle.service_recover -> saturn.database",
        "saturn.service.lifecycle.service_ready -> saturn.database"
      ]
    },
    {
      "id": "start_incompatible_store",
      "name": "Refuse a store from an incompatible schema",
      "type": "signal",
      "paths": [
        "saturn.service.lifecycle.service_start -> saturn.service.lifecycle.service_config -> saturn.service.evidence.retention.schema_compatible -> saturn.service.evidence.retention.schema_refuse"
      ]
    },
    {
      "id": "artifact_budget_eviction",
      "name": "Remove oldest artifacts until the budget fits",
      "type": "data",
      "paths": [
        "saturn.service.evidence.artifacts.artifact_write -> saturn.database -> saturn.service.evidence.retention.retention_expire -> saturn.service.evidence.retention.retention_budget -> saturn.service.evidence.retention.retention_oldest -> saturn.service.evidence.retention.retention_budget -> saturn.service.evidence.retention.retention_done"
      ]
    },
    {
      "id": "shutdown_service",
      "name": "Drain requests and close the local service",
      "type": "signal",
      "paths": [
        "saturn.service.lifecycle.service_stop -> saturn.service.lifecycle.service_drain -> saturn.service.lifecycle.service_close -> saturn.database",
        "saturn.service.lifecycle.service_drain -> saturn.service.model.provider.provider_unload -> model_server -> saturn.service.model.lifecycle.idle.model_unloaded -> saturn.service.model.lifecycle.idle.model_forget -> saturn.database"
      ]
    },
    {
      "id": "setup_with_model",
      "name": "Configure a worker and connect a client from the terminal",
      "type": "user",
      "paths": [
        "saturn.cli.setup.cli_setup -> saturn.cli.setup.cli_requirements -> saturn.cli.setup.cli_model -> saturn.cli.setup.cli_model_list -> saturn.service.model.gateway.gateway_selected -> saturn.service.model.gateway.gateway_breaker -> saturn.service.model.lifecycle.model_idle_enabled -> saturn.service.model.lifecycle.model_ownership -> saturn.service.model.lifecycle.model_activity -> saturn.service.model.gateway.gateway_send -> model_server -> saturn.service.model.gateway.gateway_transport -> saturn.service.model.gateway.gateway_parse -> saturn.service.model.gateway.gateway_result -> saturn.cli.setup.cli_start_choice -> saturn.cli.setup.cli_client_choice -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_claude -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_preview -> saturn.cli.setup.cli_doctor -> saturn.cli.admin.cli_print -> owner",
        "saturn.cli.setup.cli_requirements -> saturn.home.home_env",
        "saturn.cli.setup.cli_model_list -> saturn.home.home_settings",
        "owner -> saturn.cli.setup.cli_setup"
      ]
    },
    {
      "id": "setup_skip_model",
      "name": "Complete setup without a worker or client installation",
      "type": "user",
      "paths": [
        "saturn.cli.setup.cli_setup -> saturn.cli.setup.cli_requirements -> saturn.cli.setup.cli_model -> saturn.cli.setup.cli_start_choice -> saturn.cli.setup.cli_client_choice -> saturn.cli.setup.cli_doctor -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.setup.cli_setup"
      ]
    },
    {
      "id": "setup_start",
      "name": "Request managed startup during guided setup",
      "type": "user",
      "paths": [
        "saturn.cli.setup.cli_setup -> saturn.cli.setup.cli_requirements -> saturn.cli.setup.cli_model -> saturn.cli.setup.cli_start_choice -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.launcher_action -> saturn.cli.launcher.startup.launcher_port -> saturn.cli.launcher.startup.launcher_start -> saturn.cli.setup.cli_client_choice -> saturn.cli.setup.cli_doctor -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.setup.cli_setup"
      ]
    },
    {
      "id": "cli_narrow_policy",
      "name": "Apply a policy restriction from the terminal",
      "type": "user",
      "paths": [
        "saturn.cli.admin.cli_admin -> saturn.cli.admin.cli_widen -> saturn.cli.admin.cli_apply -> saturn.service.control.settings.settings_save -> saturn.home.home_settings",
        "saturn.service.control.settings.settings_save -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.admin.cli_admin"
      ]
    },
    {
      "id": "cli_widen_policy",
      "name": "Confirm a terminal operation that broadens access",
      "type": "user",
      "paths": [
        "saturn.cli.admin.cli_admin -> saturn.cli.admin.cli_widen -> saturn.cli.admin.cli_terminal -> saturn.cli.admin.cli_apply -> saturn.service.control.settings.settings_save -> saturn.home.home_settings",
        "saturn.service.control.settings.settings_save -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.admin.cli_admin"
      ]
    },
    {
      "id": "cli_abort_policy",
      "name": "Refuse an unconfirmed broader policy",
      "type": "user",
      "paths": [
        "saturn.cli.admin.cli_admin -> saturn.cli.admin.cli_widen -> saturn.cli.admin.cli_terminal -> saturn.cli.admin.cli_abort -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.admin.cli_admin"
      ]
    },
    {
      "id": "cli_runs",
      "name": "Inspect stored evidence from the terminal while Saturn is stopped",
      "type": "user",
      "paths": [
        "saturn.cli.admin.cli_admin -> saturn.cli.admin.cli_widen -> saturn.cli.admin.cli_apply -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.cli.admin.cli_print -> owner",
        "saturn.database -> saturn.service.control.api.pages.api_render",
        "owner -> saturn.cli.admin.cli_admin"
      ]
    },
    {
      "id": "cli_connect",
      "name": "Preview client installation from the terminal",
      "type": "user",
      "paths": [
        "saturn.cli.admin.cli_admin -> saturn.cli.admin.cli_widen -> saturn.cli.admin.cli_apply -> saturn.service.control.connect.preview.connect_plan -> saturn.service.control.connect.preview.connect_existing -> saturn.service.control.connect.preview.connect_client -> saturn.service.control.connect.preview.connect_codex -> saturn.service.control.connect.preview.connect_codex_block -> saturn.service.control.connect.application.connect_apply -> saturn.service.control.connect.application.connect_preview -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.admin.cli_admin"
      ],
      "notes": {
        "saturn.cli.admin.cli_apply": "Calls the shared application operations in this CLI process; no HTTP service is required."
      }
    },
    {
      "id": "windows_start",
      "name": "Start a Windows-managed service",
      "type": "user",
      "paths": [
        "saturn.cli.launcher.cli_launch -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.launcher_action -> saturn.cli.launcher.startup.launcher_port -> saturn.cli.launcher.startup.launcher_start -> saturn.cli.launcher.shutdown.launcher_status -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.launcher.cli_launch"
      ]
    },
    {
      "id": "windows_port_occupied",
      "name": "Refuse to replace an unrelated listening process",
      "type": "user",
      "paths": [
        "saturn.cli.launcher.cli_launch -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.launcher_action -> saturn.cli.launcher.startup.launcher_port -> saturn.cli.launcher.shutdown.launcher_refuse -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.launcher.cli_launch"
      ]
    },
    {
      "id": "windows_stop",
      "name": "Stop the matching Windows-managed service",
      "type": "user",
      "paths": [
        "saturn.cli.launcher.cli_launch -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.launcher_action -> saturn.cli.launcher.shutdown.launcher_identity -> saturn.cli.launcher.shutdown.launcher_stop -> saturn.cli.launcher.shutdown.launcher_status -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.launcher.cli_launch"
      ]
    },
    {
      "id": "windows_identity",
      "name": "Refuse to stop a process that does not match",
      "type": "user",
      "paths": [
        "saturn.cli.launcher.cli_launch -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.launcher_action -> saturn.cli.launcher.shutdown.launcher_identity -> saturn.cli.launcher.shutdown.launcher_refuse -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.launcher.cli_launch"
      ]
    },
    {
      "id": "windows_status",
      "name": "Inspect managed service status",
      "type": "user",
      "paths": [
        "saturn.cli.launcher.cli_launch -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.launcher_action -> saturn.cli.launcher.shutdown.launcher_status -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.launcher.cli_launch"
      ]
    },
    {
      "id": "launcher_linux",
      "name": "Explain foreground startup on a non-Windows host",
      "type": "user",
      "paths": [
        "saturn.cli.launcher.cli_launch -> saturn.cli.launcher.launcher_platform -> saturn.cli.launcher.shutdown.launcher_unsupported -> saturn.cli.admin.cli_print -> owner",
        "owner -> saturn.cli.launcher.cli_launch"
      ]
    },
    {
      "id": "poll_success",
      "name": "Refresh a visible dashboard resource",
      "type": "timer",
      "paths": [
        "saturn.dashboard.polling.ui_poll -> saturn.dashboard.polling.poll_active -> saturn.dashboard.polling.poll_inflight -> saturn.dashboard.polling.request.poll_fetch -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.polling.request.poll_current -> saturn.dashboard.polling.request.poll_success -> saturn.dashboard.polling.result.poll_ready"
      ]
    },
    {
      "id": "poll_hidden",
      "name": "Pause a hidden or offline resource",
      "type": "timer",
      "paths": [
        "saturn.dashboard.polling.ui_poll -> saturn.dashboard.polling.poll_active -> saturn.dashboard.polling.poll_pause"
      ]
    },
    {
      "id": "poll_coalesced",
      "name": "Coalesce refresh requests during an active fetch",
      "type": "timer",
      "paths": [
        "saturn.dashboard.polling.ui_poll -> saturn.dashboard.polling.poll_active -> saturn.dashboard.polling.poll_inflight -> saturn.dashboard.polling.poll_again"
      ]
    },
    {
      "id": "poll_old_generation",
      "name": "Ignore a response from a cancelled fetch",
      "type": "timer",
      "paths": [
        "saturn.dashboard.polling.ui_poll -> saturn.dashboard.polling.poll_active -> saturn.dashboard.polling.poll_inflight -> saturn.dashboard.polling.request.poll_fetch -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> saturn.dashboard.polling.request.poll_current -> saturn.dashboard.polling.poll_pause"
      ]
    },
    {
      "id": "poll_stale",
      "name": "Keep existing data after refresh failure",
      "type": "timer",
      "paths": [
        "saturn.dashboard.polling.ui_poll -> saturn.dashboard.polling.poll_active -> saturn.dashboard.polling.poll_inflight -> saturn.dashboard.polling.request.poll_fetch -> saturn.dashboard.polling.request.poll_current -> saturn.dashboard.polling.request.poll_success -> saturn.dashboard.polling.result.poll_has_data -> saturn.dashboard.polling.result.poll_stale -> saturn.dashboard.polling.result.poll_backoff"
      ]
    },
    {
      "id": "poll_initial_error",
      "name": "Show an initial failure with Retry",
      "type": "timer",
      "paths": [
        "saturn.dashboard.polling.ui_poll -> saturn.dashboard.polling.poll_active -> saturn.dashboard.polling.poll_inflight -> saturn.dashboard.polling.request.poll_fetch -> saturn.dashboard.polling.request.poll_current -> saturn.dashboard.polling.request.poll_success -> saturn.dashboard.polling.result.poll_has_data -> saturn.dashboard.polling.result.poll_error -> saturn.dashboard.polling.result.poll_backoff"
      ]
    },
    {
      "id": "navigation_clean",
      "name": "Navigate without unsaved settings",
      "type": "user",
      "paths": [
        "saturn.dashboard.shell.ui_navigate -> saturn.dashboard.settings.ui_dirty -> saturn.dashboard.settings.ui_render -> saturn.dashboard.shell.ui_storage -> saturn.dashboard.shell.ui_preferences -> saturn.dashboard.shell.ui_navigation",
        "owner -> saturn.dashboard.shell.ui_navigate"
      ]
    },
    {
      "id": "navigation_discard",
      "name": "Confirm discarding an unsaved draft",
      "type": "user",
      "paths": [
        "saturn.dashboard.shell.ui_navigate -> saturn.dashboard.settings.ui_dirty -> saturn.dashboard.settings.ui_discard -> saturn.dashboard.settings.ui_render -> saturn.dashboard.shell.ui_navigation",
        "owner -> saturn.dashboard.shell.ui_navigate"
      ]
    },
    {
      "id": "navigation_keep",
      "name": "Keep an unsaved draft on the current screen",
      "type": "user",
      "paths": [
        "saturn.dashboard.shell.ui_navigate -> saturn.dashboard.settings.ui_dirty -> saturn.dashboard.settings.ui_discard -> saturn.dashboard.settings.ui_keep",
        "owner -> saturn.dashboard.shell.ui_navigate"
      ]
    },
    {
      "id": "preferences_memory",
      "name": "Use appearance settings without browser storage",
      "type": "user",
      "paths": [
        "saturn.dashboard.shell.ui_navigate -> saturn.dashboard.settings.ui_dirty -> saturn.dashboard.settings.ui_render -> saturn.dashboard.shell.ui_storage -> saturn.dashboard.shell.ui_memory -> saturn.dashboard.shell.ui_navigation",
        "owner -> saturn.dashboard.shell.ui_navigate"
      ]
    },
    {
      "id": "chart_access",
      "name": "Read chart values with pointer, keyboard, or table",
      "type": "user",
      "paths": [
        "saturn.dashboard.shell.ui_chart -> saturn.dashboard.shell.ui_chart_view",
        "owner -> saturn.dashboard.shell.ui_chart"
      ]
    },
    {
      "id": "tool_without_progress",
      "name": "Run a tool with heartbeat notifications disabled",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_skip -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ]
    },
    {
      "id": "tool_progress",
      "name": "Send an advisory progress notification for a running call",
      "type": "timer",
      "paths": [
        "saturn.service.tools.dispatch.progress_tick -> saturn.service.tools.dispatch.progress_send -> clients"
      ]
    },
    {
      "id": "mask_known_secret",
      "name": "Mask a configured credential before returning captured output",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.evidence.masking.mask_known -> saturn.service.evidence.masking.mask_replace -> saturn.service.evidence.masking.mask_patterns -> saturn.service.evidence.masking.mask_done -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ]
    },
    {
      "id": "mask_pattern_secret",
      "name": "Mask a recognized credential pattern in captured output",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.evidence.masking.mask_known -> saturn.service.evidence.masking.mask_patterns -> saturn.service.evidence.masking.mask_pattern_replace -> saturn.service.evidence.masking.mask_done -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients"
      ]
    },
    {
      "id": "payload_small",
      "name": "Persist a bounded full request body",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.evidence.trace.trace_start -> saturn.service.evidence.payloads.payload_size -> saturn.service.evidence.payloads.payload_compress -> saturn.database"
      ]
    },
    {
      "id": "payload_large",
      "name": "Retain a truncated full-body record",
      "type": "call",
      "paths": [
        "clients -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.read.files.read_path -> saturn.service.tools.read.files.read_exists -> saturn.service.tools.read.files.read_size -> saturn.service.tools.read.files.read_bytes -> saturn.service.tools.read.files.read_binary -> saturn.service.tools.read.files.read_mask -> saturn.service.tools.read.render.read_range -> saturn.service.tools.read.render.read_inline -> saturn.service.tools.read.render.read_whole -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> saturn.bridge.stdio.upstream.bridge_reply -> clients",
        "saturn.service.evidence.trace.trace_response -> saturn.service.evidence.payloads.payload_size -> saturn.service.evidence.payloads.payload_cut -> saturn.service.evidence.payloads.payload_compress -> saturn.database"
      ]
    },
    {
      "id": "fixture_evaluation",
      "name": "Evaluate synthetic MCP cases against an isolated service",
      "type": "user",
      "paths": [
        "owner -> evaluation -> saturn.service.control.api.api_operation -> saturn.service.control.api.reads.api_projection -> saturn.service.control.api.pages.api_page -> saturn.service.control.api.pages.api_render -> evaluation",
        "evaluation -> saturn.service.ingress.ingress_host -> saturn.service.ingress.ingress_configured -> saturn.service.ingress.ingress_token -> saturn.service.ingress.protocol.mcp_method -> saturn.service.ingress.protocol.tool_schema -> saturn.service.ingress.ingress_refresh -> saturn.service.ingress.ingress_tool -> saturn.service.ingress.workspace.workspace_source -> saturn.service.ingress.workspace.workspace_valid -> saturn.service.ingress.workspace.workspace_global -> saturn.service.ingress.workspace.workspace_harness -> saturn.service.ingress.workspace.workspace_bind -> saturn.service.tools.dispatch.progress_enabled -> saturn.service.tools.dispatch.progress_schedule -> saturn.service.evidence.trace.trace_start -> saturn.service.tools.dispatch.tool_route -> saturn.service.tools.run.run_parse -> saturn.service.tools.run.run_cwd -> saturn.service.tools.run.policy.policy_guard -> saturn.service.tools.run.policy.policy_deny -> saturn.service.tools.run.policy.policy_allow -> saturn.service.tools.run.policy.policy_open -> saturn.service.tools.run.policy.policy_grammar -> saturn.service.tools.run.runner.preparation.runner_env -> saturn.service.tools.run.runner.preparation.runner_executable -> saturn.service.tools.run.runner.preparation.runner_windows -> saturn.service.tools.run.runner.process.runner_spawn -> operating_system -> saturn.service.tools.run.runner.process.runner_capture -> saturn.service.tools.run.runner.process.runner_keep -> saturn.service.tools.run.runner.process.runner_completion -> saturn.service.tools.run.reply.run_redact -> saturn.service.tools.run.reply.run_inline -> saturn.service.tools.run.reply.run_format -> saturn.service.evidence.trace.trace_finish -> saturn.service.evidence.trace.trace_response -> evaluation",
        "evaluation -> saturn.service.control.api.api_operation -> saturn.service.control.api.api_settings_origin -> saturn.service.control.api.api_settings_action -> saturn.service.control.settings.settings_save -> saturn.home.home_settings",
        "saturn.service.control.settings.settings_save -> evaluation"
      ],
      "notes": {
        "evaluation": "The evaluation caller saves the original settings and restores them in a finally block. Run it against its own service and harness; disposable reports use the explicit --out override."
      }
    },
    {
      "id": "checkout_existing",
      "name": "Prepare a checkout and preserve existing configuration",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.keep_env -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done"
      ]
    },
    {
      "id": "checkout_guided",
      "name": "Prepare a new home with guided startup settings",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.ask -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.environment.create_env -> saturn.cli.checkout.environment.create_outcome -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done"
      ]
    },
    {
      "id": "checkout_defaults",
      "name": "Prepare a new home without prompts or a model",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.defaults -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.environment.create_env -> saturn.cli.checkout.environment.create_outcome -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done"
      ]
    },
    {
      "id": "checkout_tools_failed",
      "name": "Report a failed tools preparation step",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "checkout_python_failed",
      "name": "Report a failed python preparation step",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "checkout_node_failed",
      "name": "Report a failed node preparation step",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "checkout_build_failed",
      "name": "Report a failed build preparation step",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "checkout_invalid",
      "name": "Refuse invalid startup settings",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.ask -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "checkout_smoke_failed",
      "name": "Stop and report a failed isolated service",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.keep_env -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_fail_stop -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "checkout_checks",
      "name": "Verify an installed checkout",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.verification.check -> saturn.cli.checkout.verification.run_checks -> saturn.cli.checkout.verification.checks_ok -> saturn.cli.checkout.verification.checks_done"
      ]
    },
    {
      "id": "checkout_checks_failed",
      "name": "Report failed checkout checks",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.verification.check -> saturn.cli.checkout.verification.run_checks -> saturn.cli.checkout.verification.checks_ok -> saturn.cli.checkout.verification.checks_failed"
      ]
    },
    {
      "id": "checkout_ci_linux",
      "name": "Run automated Linux checkout preparation",
      "type": "signal",
      "paths": [
        "saturn.cli.checkout.automation.ci -> saturn.cli.checkout.automation.windows -> saturn.cli.checkout.automation.ci_linux -> saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.keep_env -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done",
        "saturn.cli.checkout.automation.ci_linux -> saturn.cli.checkout.verification.check -> saturn.cli.checkout.verification.run_checks -> saturn.cli.checkout.verification.checks_ok -> saturn.cli.checkout.verification.checks_done"
      ]
    },
    {
      "id": "checkout_ci_windows",
      "name": "Run manually requested Linux and Windows preparation",
      "type": "signal",
      "paths": [
        "saturn.cli.checkout.automation.ci -> saturn.cli.checkout.automation.windows -> saturn.cli.checkout.automation.ci_windows -> saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.defaults -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.environment.create_env -> saturn.cli.checkout.environment.create_outcome -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done",
        "saturn.cli.checkout.automation.ci_windows -> saturn.cli.checkout.verification.check -> saturn.cli.checkout.verification.run_checks -> saturn.cli.checkout.verification.checks_ok -> saturn.cli.checkout.verification.checks_done"
      ]
    },
    {
      "id": "checkout_env_race",
      "name": "Preserve a concurrently created environment",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.defaults -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.environment.create_env -> saturn.cli.checkout.environment.create_outcome -> saturn.cli.checkout.environment.keep_env -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done"
      ]
    },
    {
      "id": "checkout_env_failed",
      "name": "Report an environment write failure",
      "type": "user",
      "paths": [
        "saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.defaults -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.environment.create_env -> saturn.cli.checkout.environment.create_outcome -> saturn.cli.checkout.result.failed"
      ]
    },
    {
      "id": "golden_dataset_freeze",
      "name": "Freeze one reviewed golden dataset",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.labels.oracle -> benchmark.curation.labels.split -> benchmark.curation.labels.separated -> benchmark.curation.labels.coverage -> benchmark.curation.labels.review -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.validate -> benchmark.curation.freeze.valid -> benchmark.curation.freeze.publish -> benchmark.dataset"
      ]
    },
    {
      "id": "golden_dataset_reject_source",
      "name": "Reject golden dataset source failure",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_dataset_reject_assets",
      "name": "Reject golden dataset assets failure",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_dataset_reject_split",
      "name": "Reject golden dataset split failure",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.labels.oracle -> benchmark.curation.labels.split -> benchmark.curation.labels.separated -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_dataset_reject_coverage",
      "name": "Reject golden dataset coverage failure",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.labels.oracle -> benchmark.curation.labels.split -> benchmark.curation.labels.separated -> benchmark.curation.labels.coverage -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_dataset_reject_review",
      "name": "Reject golden dataset review failure",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.labels.oracle -> benchmark.curation.labels.split -> benchmark.curation.labels.separated -> benchmark.curation.labels.coverage -> benchmark.curation.labels.review -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_dataset_reject_validation",
      "name": "Reject golden dataset validation failure",
      "type": "user",
      "paths": [
        "owner -> benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.labels.oracle -> benchmark.curation.labels.split -> benchmark.curation.labels.separated -> benchmark.curation.labels.coverage -> benchmark.curation.labels.review -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.validate -> benchmark.curation.freeze.valid -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_dataset_process",
      "name": "Prepare corpus assets through the local process",
      "type": "call",
      "paths": [
        "benchmark.curation.sources.start -> benchmark.curation.sources.select -> benchmark.curation.sources.licence -> benchmark.curation.sources.capture -> benchmark.curation.sources.assets_valid -> benchmark.curation.labels.oracle -> benchmark.curation.labels.split -> benchmark.curation.labels.separated -> benchmark.curation.labels.coverage -> benchmark.curation.labels.review -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.validate -> benchmark.curation.freeze.valid -> benchmark.curation.freeze.publish -> benchmark.dataset"
      ]
    },
    {
      "id": "golden_corpus_validate",
      "name": "Corpus validate",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.access.report -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_review",
      "name": "Corpus review",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.access.packet -> owner"
      ]
    },
    {
      "id": "golden_corpus_materialize",
      "name": "Corpus materialize",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.access.workspace.destination -> benchmark.access.workspace.copy -> benchmark.workspace"
      ]
    },
    {
      "id": "golden_corpus_bad_workspace",
      "name": "Corpus bad workspace",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.access.workspace.destination -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_invalid",
      "name": "Corpus invalid",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_bad_operation",
      "name": "Corpus bad operation",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_pending_review",
      "name": "Corpus pending review",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_freeze",
      "name": "Corpus freeze",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.validate -> benchmark.curation.freeze.valid -> benchmark.curation.freeze.publish -> benchmark.dataset"
      ]
    },
    {
      "id": "golden_corpus_freeze_invalid",
      "name": "Corpus freeze invalid",
      "type": "call",
      "paths": [
        "owner -> benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.curation.labels.reviewed -> benchmark.curation.freeze.validate -> benchmark.curation.freeze.valid -> benchmark.curation.freeze.reject -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_cli_event",
      "name": "Corpus CLI request starts local inspection",
      "type": "call",
      "paths": [
        "benchmark.access.invoke -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.access.report -> benchmark.reports"
      ]
    },
    {
      "id": "golden_corpus_stored_assets",
      "name": "Read the stored corpus for validation",
      "type": "data",
      "paths": [
        "benchmark.dataset -> benchmark.access.load -> benchmark.access.integrity -> benchmark.access.mode -> benchmark.access.report -> benchmark.reports"
      ]
    },
    {
      "id": "benchmark_execution_invalid",
      "name": "Benchmark execution invalid",
      "type": "call",
      "paths": [
        "owner -> benchmark.execution.prepare.start -> benchmark.execution.prepare.plan -> benchmark.execution.prepare.valid -> benchmark.execution.finish.fail -> benchmark.results"
      ]
    },
    {
      "id": "benchmark_execution_unavailable",
      "name": "Benchmark execution unavailable",
      "type": "call",
      "paths": [
        "owner -> benchmark.execution.prepare.start -> benchmark.execution.prepare.plan -> benchmark.execution.prepare.valid -> benchmark.execution.prepare.reviewed -> benchmark.execution.prepare.provisional -> benchmark.execution.prepare.isolate -> benchmark.execution.prepare.ready -> benchmark.execution.finish.cleanup -> benchmark.execution.finish.compare -> benchmark.execution.finish.report -> benchmark.results"
      ]
    },
    {
      "id": "benchmark_execution_complete",
      "name": "Benchmark execution complete",
      "type": "call",
      "paths": [
        "owner -> benchmark.execution.prepare.start -> benchmark.execution.prepare.plan -> benchmark.execution.prepare.valid -> benchmark.execution.prepare.reviewed -> benchmark.execution.prepare.isolate -> benchmark.execution.prepare.ready -> benchmark.execution.workload.schedule -> benchmark.execution.workload.replay -> benchmark.execution.workload.dispatch -> benchmark.execution.workload.cancel -> benchmark.execution.observe.collect -> benchmark.execution.observe.score -> benchmark.execution.observe.persist -> benchmark.execution.workload.more -> benchmark.execution.finish.cleanup -> benchmark.execution.finish.compare -> benchmark.execution.finish.report -> benchmark.results"
      ]
    },
    {
      "id": "benchmark_execution_cancel",
      "name": "Benchmark execution cancel",
      "type": "call",
      "paths": [
        "owner -> benchmark.execution.prepare.start -> benchmark.execution.prepare.plan -> benchmark.execution.prepare.valid -> benchmark.execution.prepare.reviewed -> benchmark.execution.prepare.isolate -> benchmark.execution.prepare.ready -> benchmark.execution.workload.schedule -> benchmark.execution.workload.replay -> benchmark.execution.workload.dispatch -> benchmark.execution.workload.cancel -> benchmark.execution.workload.cancel_call -> benchmark.execution.observe.collect -> benchmark.execution.observe.score -> benchmark.execution.observe.persist -> benchmark.execution.workload.more -> benchmark.execution.finish.cleanup -> benchmark.execution.finish.compare -> benchmark.execution.finish.report -> benchmark.results"
      ]
    },
    {
      "id": "benchmark_execution_repeat",
      "name": "Benchmark execution repeat",
      "type": "call",
      "paths": [
        "owner -> benchmark.execution.prepare.start -> benchmark.execution.prepare.plan -> benchmark.execution.prepare.valid -> benchmark.execution.prepare.reviewed -> benchmark.execution.prepare.isolate -> benchmark.execution.prepare.ready -> benchmark.execution.workload.schedule -> benchmark.execution.workload.replay -> benchmark.execution.workload.dispatch -> benchmark.execution.workload.cancel -> benchmark.execution.observe.collect -> benchmark.execution.observe.score -> benchmark.execution.observe.persist -> benchmark.execution.workload.more -> benchmark.execution.workload.schedule -> benchmark.execution.workload.replay -> benchmark.execution.workload.dispatch -> benchmark.execution.workload.cancel -> benchmark.execution.observe.collect -> benchmark.execution.observe.score -> benchmark.execution.observe.persist -> benchmark.execution.workload.more -> benchmark.execution.finish.cleanup -> benchmark.execution.finish.compare -> benchmark.execution.finish.report -> benchmark.results"
      ]
    },
    {
      "id": "benchmark_execution_start",
      "name": "Start the benchmark suite",
      "type": "call",
      "paths": [
        "benchmark.execution.prepare.start -> benchmark.execution.prepare.plan -> benchmark.execution.prepare.valid -> benchmark.execution.prepare.reviewed -> benchmark.execution.prepare.isolate -> benchmark.execution.prepare.ready -> benchmark.execution.workload.schedule -> benchmark.execution.workload.replay -> benchmark.execution.workload.dispatch -> benchmark.execution.workload.cancel -> benchmark.execution.observe.collect -> benchmark.execution.observe.score -> benchmark.execution.observe.persist -> benchmark.execution.workload.more -> benchmark.execution.finish.cleanup -> benchmark.execution.finish.compare -> benchmark.execution.finish.report -> benchmark.results"
      ]
    },
    {
      "id": "checkout_ci_windows_only",
      "name": "Run manually requested Windows preparation",
      "type": "signal",
      "paths": [
        "saturn.cli.checkout.automation.ci -> saturn.cli.checkout.automation.windows -> saturn.cli.checkout.automation.ci_windows_only -> saturn.cli.checkout.tools.setup -> saturn.cli.checkout.tools.requirements -> saturn.cli.checkout.tools.tools -> saturn.cli.checkout.dependencies.python_install -> saturn.cli.checkout.dependencies.python_ok -> saturn.cli.checkout.dependencies.node_install -> saturn.cli.checkout.dependencies.node_ok -> saturn.cli.checkout.dependencies.build -> saturn.cli.checkout.dependencies.build_ok -> saturn.cli.checkout.environment.env_exists -> saturn.cli.checkout.environment.input.interactive -> saturn.cli.checkout.environment.input.defaults -> saturn.cli.checkout.environment.input.valid -> saturn.cli.checkout.environment.create_env -> saturn.cli.checkout.environment.create_outcome -> saturn.cli.checkout.smoke.smoke_prepare -> saturn.cli.checkout.smoke.smoke_start -> saturn.cli.checkout.smoke.smoke_ok -> saturn.cli.checkout.smoke.smoke_stop -> saturn.cli.checkout.result.done",
        "saturn.cli.checkout.automation.ci_windows_only -> saturn.cli.checkout.verification.check -> saturn.cli.checkout.verification.run_checks -> saturn.cli.checkout.verification.checks_ok -> saturn.cli.checkout.verification.checks_done"
      ]
    },
    {
      "id": "internal_timing_application",
      "name": "Observe application timing",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_database_lock",
      "name": "Observe database lock timing",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.database_lock -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_database_operation",
      "name": "Observe database operation timing",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.database_operation -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_model_slot",
      "name": "Observe model slot timing",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.model_slot -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_backend",
      "name": "Observe backend timing",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.backend -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_unknown",
      "name": "Observe unknown timing",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.unknown -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_disabled",
      "name": "Continue with profiling disabled",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.off"
      ]
    },
    {
      "id": "internal_timing_capacity",
      "name": "Preserve a request when collector capacity is full",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.overflow -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_interval_limit",
      "name": "Retain a profile with explicit interval loss",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.drop -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_repeat",
      "name": "Observe another boundary in the same request",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.database_operation -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_byte_limit",
      "name": "Replace an oversized profile with an incomplete marker",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.shorten -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_unbound",
      "name": "Preserve the response without inventing a run binding",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.missing -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_export_error",
      "name": "Preserve the response after a profile write fails",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.failed -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done"
      ]
    },
    {
      "id": "internal_timing_payload_storage",
      "name": "Keep the bounded optional timing payload",
      "type": "call",
      "paths": [
        "saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done",
        "saturn.service.evidence.timing.finish.export.persist -> saturn.database"
      ]
    },
    {
      "id": "internal_latency_core",
      "name": "Run the core internal latency condition",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_model",
      "name": "Run the model internal latency condition",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.model -> benchmark.execution.internal_latency.measure.ready -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_overhead",
      "name": "Run the overhead internal latency condition",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.overhead -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_disabled_pair",
      "name": "Keep a deliberately disabled overhead observation",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.overhead -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_profile_missing",
      "name": "Record a profile missing after bounded collection",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.deadline -> benchmark.execution.internal_latency.collection.incomplete -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_collection_poll",
      "name": "Poll the trace without retrying the tool",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.deadline -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_profile_invalid",
      "name": "Keep an invalid profile outside timing denominators",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.collection.incomplete -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_worker_blocked",
      "name": "Keep the current-worker condition explicitly blocked",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.model -> benchmark.execution.internal_latency.measure.ready -> benchmark.execution.internal_latency.measure.blocked -> benchmark.execution.internal_latency.collection.incomplete -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_bad_corpus",
      "name": "Reject a changed corpus before internal measurements",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.reporting.fail -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_bad_mode",
      "name": "Reject an undefined internal workload condition",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.reporting.fail -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_repeat",
      "name": "Execute the next fixed internal workload",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.model -> benchmark.execution.internal_latency.measure.ready -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_service_observation",
      "name": "Correlate public calls and optional service profiles",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> saturn.service.evidence.timing.entry.begin -> saturn.service.evidence.timing.entry.enabled -> saturn.service.evidence.timing.entry.capacity -> saturn.service.evidence.timing.entry.allocate -> saturn.service.evidence.timing.capture.sources.choose -> saturn.service.evidence.timing.capture.sources.application -> saturn.service.evidence.timing.capture.bounded -> saturn.service.evidence.timing.capture.append -> saturn.service.evidence.timing.capture.more -> saturn.service.evidence.timing.finish.seal -> saturn.service.evidence.timing.finish.size -> saturn.service.evidence.timing.finish.export.bind -> saturn.service.evidence.timing.finish.export.persist -> saturn.service.evidence.timing.finish.export.saved -> saturn.service.evidence.timing.finish.export.publish -> saturn.service.evidence.timing.finish.leased -> saturn.service.evidence.timing.finish.release -> saturn.service.evidence.timing.finish.done",
        "saturn.service.evidence.timing.finish.export.publish -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_hardware_unavailable",
      "name": "Retain an unavailable hardware counter",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.unknown -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    },
    {
      "id": "internal_latency_hardware_repeat",
      "name": "Read the next declared hardware field",
      "type": "call",
      "paths": [
        "benchmark.execution.internal_latency.prepare.start -> benchmark.execution.internal_latency.prepare.plan -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.keep -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.hardware.read -> benchmark.execution.internal_latency.prepare.hardware.available -> benchmark.execution.internal_latency.prepare.hardware.unknown -> benchmark.execution.internal_latency.prepare.hardware.more -> benchmark.execution.internal_latency.prepare.valid -> benchmark.execution.internal_latency.prepare.isolate -> benchmark.execution.internal_latency.measure.mode -> benchmark.execution.internal_latency.measure.core -> benchmark.execution.internal_latency.measure.dispatch -> benchmark.execution.internal_latency.collection.read -> benchmark.execution.internal_latency.collection.required -> benchmark.execution.internal_latency.collection.available -> benchmark.execution.internal_latency.collection.valid -> benchmark.execution.internal_latency.reporting.aggregate -> benchmark.execution.internal_latency.reporting.persist -> benchmark.execution.internal_latency.reporting.more -> benchmark.execution.internal_latency.reporting.cleanup -> benchmark.execution.internal_latency.reporting.report -> benchmark.results"
      ]
    }
  ]
};
