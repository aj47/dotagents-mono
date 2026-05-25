# Agent Loop Test Metrics

This directory stores versioned JSONL metrics from targeted agent-loop replay runs.

The suites only write these rows when `AGENT_LOOP_METRICS_FILE` is set. Normal test
runs do not create or mutate metrics files.

Example:

```bash
AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl \
  pnpm --filter @dotagents/desktop run test:autoresearch-replay
```

Each row includes the branch, short git SHA, suite name, case id, status, duration,
LLM call count, verifier call count, tool call count, prompt-size summary, and any
case-specific recovery checks. Live AutoResearch rows also include
`semanticEvidencePassed` and `missingResponseEvidenceGroups` so provider behavior
can be tracked without making the opt-in live suite fail on wording variance.

The package script `pnpm --filter @dotagents/desktop run test:agent-loop-live`
runs the live agent-loop E2E suite with `LIVE_AGENT_LOOP_E2E=1` and LLM-as-judge
enabled by default. Set `LIVE_AGENT_LOOP_LLM_JUDGE=0` to disable that extra judge
call. Use `pnpm --filter @dotagents/desktop run test:agent-loop-live:strict` or
set `LIVE_AGENT_LOOP_LLM_JUDGE_REQUIRED=1` to make a failed judge verdict fail
the live test rather than only recording `llmJudge*` metric fields.

## Long Electron Agent-Loop E2E

The long real-Electron suite is intentionally opt-in because it launches the
desktop app, uses real ChatGPT Web/Codex auth, starts three concurrent sessions,
and waits for delayed sandbox MCP tools. It is not part of normal `pnpm test`,
`pnpm typecheck`, or PR CI.

Prerequisites:

- A valid Codex ChatGPT auth file at `$CODEX_HOME/auth.json` or `~/.codex/auth.json`.
- No existing desktop dev process using the Electron/Vite dev ports.
- Network access to ChatGPT Web/Codex.

Run:

```bash
LONG_AGENT_LOOP_E2E=1 \
  pnpm --filter @dotagents/desktop run test:e2e:agent-loop-long
```

Artifacts are written under `apps/desktop/tmp/e2e-agent-loop/<run-id>/`,
including Electron logs, sandbox MCP tool-call JSONL, renderer CDP metrics/trace
files from `scripts/renderer-perf-recorder.ts`, runner heartbeat metrics, and
`summary.json`.

Expected runtime is a few minutes. Each sandbox tool waits about 12.5 seconds,
and each of the three sessions must execute at least five distinct sandbox tool
calls before the final audit receipt can be returned.
