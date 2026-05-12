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

## 2026-05-11T23:30Z - Omit cached duplicate excerpt

- Change tried: shorten duplicate `read_more_context` results by removing the cached excerpt and only pointing the model at the earlier matching result.
- Deterministic validation: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts -t "deduplicates repeated read_more_context|requires recovered read_more_context"` passed 2/2.
- Type validation: `pnpm --filter @dotagents/desktop run typecheck:node` passed.
- Targeted live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop exec vitest run src/main/llm.agent-loop.live.test.ts -t "retrieves a buried context-ref token"` failed.
- Live metric: `live-hard-compaction-read-more-context` reached the iteration limit, executed `read_more_context:4`, and did not include `HX-7492-PRISM-RIVER` in the final answer.
- Decision: discard. The short duplicate response saves deterministic prompt chars but removes useful enough evidence from the live model loop.

## 2026-05-11T23:33Z - Direct search guidance for known compacted-context queries

- Change tried: update compacted-context prompt guidance so agents call `read_more_context(mode: "search")` directly when the needed detail/query is already known, using `mode: "overview"` first only for orientation.
- Prompt validation: `pnpm --filter @dotagents/desktop exec vitest run src/main/system-prompts.test.ts -t "compacted-context search"` passed 1/1.
- Type validation: `pnpm --filter @dotagents/desktop run typecheck:node` passed.
- Targeted live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop exec vitest run src/main/llm.agent-loop.live.test.ts -t "retrieves a buried context-ref token"` passed.
- Targeted live metric: `live-hard-compaction-read-more-context` recovered `HX-7492-PRISM-RIVER`, avoided the iteration limit, and reduced `read_more_context` calls from the prior kept row's 3 to 2.
- Full live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live` passed 6/6.
- Full live metric: final hard-compaction row used `read_more_context:2`, recovered the hidden token, and avoided the iteration limit. AutoResearch live rows had provider variance, but those cases do not expose `read_more_context`, so this prompt branch is inactive for them.
- Decision: keep.

## 2026-05-11T23:38Z - Skip redundant verifier retries after actionable feedback

- Change tried: when the verifier returns concrete `reason` or `missingItems`, stop retrying that same verifier decision immediately and feed the actionable feedback back into the next agent iteration. Keep verifier retries for ambiguous/malformed verifier output.
- Deterministic validation: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts` passed 38/38.
- Type validation: `pnpm --filter @dotagents/desktop run typecheck:node` passed.
- Full live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live` passed 6/6.
- Live AutoResearch metric: latest full run reduced verifier calls from the prior full run's 17 to 8 and reduced iteration-limit hits from 2 to 1.
- Live hard-compaction metric: remained correct with `read_more_context:2`, hidden token recovered, and no iteration-limit hit.
- Decision: keep.

## 2026-05-11T23:43Z - Status follow-up verifier prompt

- Change tried: teach the verifier that grounded status answers can complete status/failure/next-action follow-ups even when older background work remains unfinished.
- First full live e2e: AutoResearch passed 5/5 and improved prompt chars from 41,332 to 30,099, but the hard-compaction case failed. It returned a procedural continuation, did not include `HX-7492-PRISM-RIVER`, and did not match the requested form.
- Refinement tried: add a verifier guard that procedural "continuing/searching/checking" replies are not deliverables.
- Refined validation: `pnpm --filter @dotagents/desktop exec vitest run src/main/llm-verification-replay.test.ts` passed 10/10, `pnpm --filter @dotagents/desktop run typecheck:node` passed, and full live e2e passed 6/6.
- Refined live metric versus the prior kept full live run: AutoResearch prompt chars increased from 41,332 to 49,561, LLM calls increased from 8 to 9, and duration increased from 93,740ms to 112,770ms. Hard-compaction still passed, but `read_more_context` increased from 2 to 3 and prompt chars increased from 28,764 to 30,733.
- Decision: discard. The status-only rule caused a correctness failure, and the guarded version removed the failure but regressed the primary hard-compaction metric.

## 2026-05-11T23:55Z - Procedural `respond_to_user` guard after context recovery

- Change tried: if the current turn already has a successful `read_more_context(mode:"search")` result and the agent then calls `respond_to_user` with procedural progress text like "continuing/searching", skip verifier finalization and nudge the agent to answer from the returned excerpt.
- Deterministic validation: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts` passed 39/39.
- Type validation: `pnpm --filter @dotagents/desktop run typecheck:node` passed.
- Targeted live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop exec vitest run src/main/llm.agent-loop.live.test.ts -t "retrieves a buried context-ref token"` passed.
- Targeted live metric versus the prior kept full hard-compaction row: LLM calls decreased from 4 to 3, prompt chars decreased from 28,764 to 22,297, duration decreased from 26,608ms to 20,309ms, and the hidden token remained correct. `read_more_context` increased from 2 to 3 in that sample.
- Full live e2e: `AGENT_LOOP_METRICS_FILE=docs/test-results/agent-loop/2026-05-11-agent-loop-metrics.jsonl LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live` passed 6/6.
- Full live metric versus the prior kept full live run: AutoResearch semantic passes improved from 1/5 to 3/5, but aggregate prompt chars increased from 41,332 to 60,454 and iteration-limit hits increased from 1 to 2. The hard-compaction row stayed correct, but `read_more_context` increased from 2 to 4 and prompt chars increased from 28,764 to 41,431; that hard-compaction run made only `read_more_context` calls, so the new communication-only guard did not fire in that sample.
- Decision: keep as a narrow correctness guard for a real procedural-response failure mode, but do not count it as a read-count optimization. Continue optimizing query/read-count variance separately.
