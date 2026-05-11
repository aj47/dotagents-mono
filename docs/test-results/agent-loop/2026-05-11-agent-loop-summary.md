# Agent Loop Metrics Summary - 2026-05-11

Source ledger: `2026-05-11-agent-loop-metrics.jsonl`

Commit under test: `885a739c5`

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
| Deterministic context recovery | 1 | 1/1 | 2 | 3 | 5 ms |
| Live AutoResearch E2E | 5 | 5/5 execution, 2/5 semantic evidence | 1-4 each | 0-1 each | 9,655-77,396 ms |
| Live context-ref E2E | 1 | 1/1 | 4 | 3 | 23,610 ms |

## Live AutoResearch Details

| Case | Semantic evidence | LLM calls | Verifier calls | Tool calls | Duration | Iterations |
|---|---:|---:|---:|---:|---:|---:|
| case-a-approval-boundary | true | 4 | 4 | 0 | 31,832 ms | 4 |
| case-b-did-it-download | false | 1 | 1 | 0 | 10,836 ms | 1 |
| case-c-try-it-first-alias | true | 1 | 1 | 0 | 9,655 ms | 1 |
| case-d-skill-registry-diagnosis | false | 1 | 1 | 0 | 15,657 ms | 1 |
| case-e-full-long-context-continuation | false | 4 | 8 | 1 | 77,396 ms | 4 |

## Context-Ref Details

- Provider/model: `chatgpt-web` / `gpt-5.4-mini`
- Tool calls: `read_more_context: 3`
- Verifier calls: `1`
- Prompt max chars: `25,807`
- Final answer contained hidden token: `true`
- Final answer matched requested form: `true`
- Reached iteration limit: `false`
