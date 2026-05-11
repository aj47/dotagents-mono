# Agent Loop Metrics Summary - 2026-05-11

Source ledger: `2026-05-11-agent-loop-metrics.jsonl`

Commit under test: `2d3a49387`

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
| Live ChatGPT E2E | 1 | 1/1 | 2 | 2 | 10,717 ms |

## Live E2E Details

- Provider/model: `chatgpt-web` / `gpt-5.4-mini`
- Tool calls: `read_more_context: 1`, `respond_to_user: 1`
- Verifier calls: `1`
- Prompt max chars: `7,644`
- Final answer contained hidden token: `true`
- Final answer matched requested form: `true`
- Reached iteration limit: `false`
