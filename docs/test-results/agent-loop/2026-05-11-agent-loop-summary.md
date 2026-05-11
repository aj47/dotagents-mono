# Agent Loop Metrics Summary - 2026-05-11

Source ledger: `2026-05-11-agent-loop-metrics.jsonl`

Recorded ledger commit: `3fbe1bc9d`

Latest post-merge validation commit: `3dd604df4`

## Commands

```bash
AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop run test:autoresearch-replay
AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts -t "requires recovered read_more_context"
AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live
```

## Results

| Suite | Cases | Pass rate | LLM calls | Tool calls | Duration |
|---|---:|---:|---:|---:|---:|
| AutoResearch replay | 5 | 5/5 | 1 each | 1 each | 2-7 ms |
| Deterministic context recovery | 1 | 1/1 | 2 | 3 | 6 ms |
| Live AutoResearch E2E | 5 | 5/5 execution, 1/5 semantic evidence | 1-3 each | 0-1 each | 9,986-34,093 ms |
| Live context-ref E2E | 1 | 1/1 | 4 | 5 | 21,737 ms |

Live merged-branch aggregate: `6/6` execution rows passed, `111,298 ms`, `12`
LLM calls, `8` verifier calls, `7` tool calls, and `0` iteration-limit hits.

Post-merge rerun at `3dd604df4`: `LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live` passed `6/6` after the iteration-limit fallback scoping fix.

## Live AutoResearch Details

| Case | Semantic evidence | LLM calls | Verifier calls | Tool calls | Duration | Iterations |
|---|---:|---:|---:|---:|---:|---:|
| case-a-approval-boundary | true | 3 | 1 | 1 | 23,755 ms | 3 |
| case-b-did-it-download | false | 1 | 1 | 0 | 11,655 ms | 1 |
| case-c-try-it-first-alias | false | 1 | 1 | 0 | 9,986 ms | 1 |
| case-d-skill-registry-diagnosis | false | 1 | 1 | 0 | 10,072 ms | 1 |
| case-e-full-long-context-continuation | false | 2 | 3 | 1 | 34,093 ms | 2 |

## Context-Ref Details

- Provider/model: `chatgpt-web` / `gpt-5.4-mini`
- Tool calls: `read_more_context: 5`
- Verifier calls: `1`
- Prompt max chars: `26,028`
- Final answer contained hidden token: `true`
- Final answer matched requested form: `true`
- Reached iteration limit: `false`
