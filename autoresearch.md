# Autoresearch: Faster agent-loop e2e tests

## Objective
Reduce the `@dotagents/desktop` live agent-loop e2e runtime while preserving meaningful real agent-loop coverage and UI responsiveness.

Target workload: `apps/desktop/src/main/llm.agent-loop.live.test.ts` via:

```bash
./autoresearch.sh
```

## Current baseline reset
- Previous progress was cleaned and squashed into PR #479: https://github.com/aj47/dotagents-mono/pull/479
- Squashed PR branch: `autoresearch/e2e-agent-loop-speedup-pr`
- Squashed commit: `02627f050` (`Improve live agent-loop e2e speed`)
- Prior best before reset: `48.426s` from kept run #28 (`966f4bc`) versus new-log baseline `91.552s` (`-47.1%`).
- `autoresearch.jsonl` has been reset to config-only so the next run becomes the new baseline on top of the squashed progress.

## Metrics
- **Primary**: `e2e_seconds` (s, lower is better).
- **Secondary**:
  - `live_case_count`, `live_pass_count`, `live_fail_count`
  - `live_duration_ms_total`, `live_duration_ms_max`
  - `llm_calls_total`, `verifier_calls_total`, `llm_judge_calls_total`, `tool_calls_total`
  - `ui_ready_ms`, `ui_input_latency_ms`, `ui_long_task_count`

## Coverage constraints
Preserve about 5 live e2e cases covering:
1. continuation/status recovery from prior history,
2. stale-context/completion-summary avoidance,
3. long-context compaction or context-ref recovery,
4. safe tool use/context gathering before final response,
5. completion/response delivery through `respond_to_user` / final state.

Do not weaken assertions, fake metrics, skip the real provider by default, or remove underlying deterministic coverage.

## Carried-forward learnings
- Keep the focused 5-case live suite plus deterministic replay checks in `autoresearch.checks.sh`.
- Keep optional LLM judge disabled by default and strict-only.
- Keep UI smoke as a backpressure check, but investigate its reliability: many later runs failed with ~820–850ms RAF delay even on unchanged best source.
- Source changes kept in PR #479:
  - exact-answer `read_more_context` suppression/nudge,
  - case-insensitive `read_more_context` search cache keys,
  - condensed verifier prompt,
  - verifier final-assistant duplicate suppression,
  - high-signal fallback needles for `readMoreContext` search,
  - communication-only no-tool verifier skip.
- Avoid repeating discarded paths unless new diagnostics justify them:
  - broad `read_more_context` suppression/default-mode changes,
  - read-more-context search-output complexity,
  - broad agent/system prompt condensation,
  - verifier bypasses that are not proven to trigger,
  - low-level Codex payload tweaks,
  - test-runner `tsx`/`vitest` invocation changes.

## Next promising work
- First run `./autoresearch.sh` once to establish the post-squash baseline.
- If UI smoke keeps failing on unchanged source, prioritize a UI-smoke reliability investigation that preserves the responsiveness requirement rather than weakening thresholds.
- If e2e remains stable, target hard-compaction/read_more_context or immigration execute_command call count with diagnostic-backed source changes.
