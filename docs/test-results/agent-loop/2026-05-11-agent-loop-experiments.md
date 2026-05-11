# Agent Loop Efficiency Experiment Ledger - 2026-05-11

Append-only notes for agent-loop speed and efficiency experiments. Machine-readable
metrics are appended to `2026-05-11-agent-loop-metrics.jsonl`.

## 2026-05-11T22:53Z - Duplicate `read_more_context` cache, exact args only

- Change tried: cache successful `read_more_context` results within one agent run by normalized full arguments.
- First validation attempt: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts -t "deduplicates repeated read_more_context"`.
- Result: failed before exercising code because Electron's binary postinstall had not run in this worktree.
- Follow-up setup command: `pnpm --filter @dotagents/desktop rebuild electron`.
- Second validation attempt result: failed before exercising behavior because the test file allowed a runtime import of `mcp-service`, whose `./config` mock lacked `dataFolder`.
- Follow-up code hygiene: converted `llm.ts` MCP imports to `import type` and mocked `./mcp-service` in the replay test.
- Deterministic result after setup fixes: pass. Metrics row: `caseId=dedupe-read-more-context`, `readMoreContextToolExecutions=1`, `duplicateReadMoreContextCallsSkipped=1`.
- Live result: full live suite failed on `live-hard-compaction-read-more-context`; model made `read_more_context:7`, reached the iteration cap, and returned `Continuing the audit trail now.` without `HX-7492-PRISM-RIVER`.
- Decision: discard exact-args-only behavior as insufficient. Keep the useful in-run exact cache only as part of the broader semantic search cache below.

## 2026-05-11T22:58Z - Semantic `read_more_context` search cache plus answer nudge

- Change tried: reuse successful `read_more_context(mode:"search")` results by `contextRef + query` even if the model varies `maxChars`; add an ephemeral nudge after a successful context search telling the model to answer from the returned excerpts instead of repeating the same search.
- Deterministic validation: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts` passed 37/37.
- Type validation: `pnpm --filter @dotagents/desktop run typecheck:node` passed.
- Targeted live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop exec vitest run src/main/llm.agent-loop.live.test.ts -t "retrieves a buried context-ref token"` passed.
- Targeted live metric: `live-hard-compaction-read-more-context` recovered `HX-7492-PRISM-RIVER`, did not hit the iteration limit, and reduced `read_more_context` calls from the earlier baseline of 5 to 3.
- Full live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live` passed 6/6.
- Full live metric: final hard-compaction row recovered the token, avoided the iteration limit, and kept `read_more_context` calls at 3.
- Decision: keep.
