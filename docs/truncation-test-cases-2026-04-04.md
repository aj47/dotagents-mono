## Truncation Test Cases — 2026-04-04

Scope: regression coverage and comparison for the context-budget fixes implemented after `docs/langfuse-truncation-report-2026-04-03.md`.

## Latest validation run

All commands below were run successfully on 2026-04-04:

- `pnpm run pretest && pnpm vitest run src/main/context-budget.test.ts`
  - cwd: `apps/desktop`
  - result: `18/18` tests passed
- `pnpm typecheck`
  - cwd: `apps/desktop`
  - result: passed
- `node --test apps/desktop/tests/context-read-more-density.test.mjs`
  - cwd: repo root
  - result: `3/3` tests passed

Live E2E harness added and validated on 2026-05-11:

- `pnpm --filter @dotagents/desktop run test:agent-loop-live`
  - cwd: repo root
  - result: skipped by default unless `LIVE_AGENT_LOOP_E2E=1` is set
- `LIVE_AGENT_LOOP_E2E=1 pnpm --filter @dotagents/desktop run test:agent-loop-live`
  - cwd: repo root
  - provider: local Codex ChatGPT auth from `~/.codex/auth.json`
  - result: passed against the real provider
- `pnpm --filter @dotagents/desktop exec vitest run src/main/llm.respond-to-user-history.test.ts`
  - cwd: repo root
  - result: `36/36` tests passed, including the adapted AutoResearch replay fixtures and deterministic final-answer recovery
- `pnpm --filter @dotagents/desktop run test:autoresearch-replay`
  - cwd: repo root
  - result: `5/5` adapted AutoResearch replay cases passed
- `pnpm --filter @dotagents/desktop run test:respond-to-user-regressions`
  - cwd: repo root
  - result: `55/55` tests passed after `build:workspace-deps`
- `pnpm --filter @dotagents/desktop run typecheck:node`
  - cwd: repo root
  - result: passed

## Before vs after summary

| Area | Before | After |
|---|---|---|
| External tool truncation | Runtime/MCP-truncated output could be truncated again | Already-truncated outputs are protected |
| Tool-result truncation shape | Head-only | Head + tail |
| Tool-result truncation pressure | Triggered at `>3000` chars, always if matched | Triggered at `>4000` chars and only under budget pressure (`>80%` target) |
| Tool-result keep size | `1800` chars | `2400` chars |
| Archive frontier | Could keep reapplying after first archive | Only applies when current overflow pressure exists |
| Microcompact | Always-on | Budget-aware |
| `read_more_context` default | `1200` chars | `1500` chars |
| `read_more_context` cap | `4000` for all modes | `12000` for direct recovery modes, `4000` for search |

## Automated test cases now covering the fixes

Primary file: `apps/desktop/src/main/context-budget.test.ts`

| ID | Test name | What it protects |
|---|---|---|
| TC-01 | `truncates oversized tool results before tier-1 summarization` | Baseline Tier 0b truncation still works when it should |
| TC-02 | `preserves both head and tail when truncating mapped tool results` | Prevents head-only loss on mapped tool results |
| TC-03 | `does not re-truncate already truncated runtime tool output` | Prevents double truncation of runtime-truncated shell output |
| TC-04 | `keeps actual-token scaling after aggressive truncation and preserves the original budget baseline` | Preserves actual-token scaling logic after truncation |
| TC-05 | `preserves the initial token baseline when actual usage comes from session state` | Same as above for session-recorded token usage |
| TC-06 | `does not treat bracketed user logs as mapped tool results or JSON payloads` | Avoids false-positive tool/payload truncation |
| TC-07 | `batch-summarizes contiguous oversized conversational messages in one call` | Batch summary path still works |
| TC-08 | `archives older raw history behind a rolling summary frontier` | Archive frontier still works under real overflow |
| TC-09 | `keeps search-mode excerpts within maxChars even for long queries` | Search-mode reads stay bounded |
| TC-10 | `skips tool-result truncation when comfortably under budget` | Tool-result Tier 0b is now budget-aware |
| TC-11 | `allows larger read_more_context excerpts for direct recovery modes` | Larger direct recovery windows work |
| TC-12 | `keeps search-mode read_more_context capped even when larger maxChars is requested` | Search mode remains bounded despite larger request |
| TC-13 | `does not reapply archive frontier when there is no new overflow` | Archive frontier no longer sticks unnecessarily |
| TC-14 | `skips microcompact when context is comfortably under budget` | Microcompact no longer runs unconditionally |
| TC-15 | `keeps truncated payload messages protected after archive frontier reorders messages` | Protected truncated payloads survive downstream reordering |

Secondary file: `apps/desktop/tests/context-read-more-density.test.mjs`

| ID | Test name | What it protects |
|---|---|---|
| TC-16 | `runtime tool surface exposes read_more_context` | Runtime tool is still wired up |
| TC-17 | `agent prompts teach the model to use Context refs` | Prompt contract still teaches recovery behavior |
| TC-18 | `batch summary context refs snapshot source messages before splicing` | Batch-summary refs still preserve original source context |

Live opt-in file: `apps/desktop/src/main/llm.agent-loop.live.test.ts`

| ID | Test name | What it protects |
|---|---|---|
| TC-19 | `retrieves a buried context-ref token through the real agent loop` | Exercises production agent loop + real ChatGPT Codex provider + context-budget truncation + `read_more_context` recovery on an oversized historical tool result |

Adapted AutoResearch deterministic replay: `apps/desktop/src/main/llm.respond-to-user-history.test.ts`

| ID | Test name | What it protects |
|---|---|---|
| TC-20 | `replays AutoResearch case-a-approval-boundary: Approval boundary after context gathering through the agent-loop continuation harness` | Preserves the ask-before-mutation approval boundary and current known/unknown/blocker/next-action structure after read-only context gathering |
| TC-21 | `replays AutoResearch case-b-did-it-download: Did it download? through the agent-loop continuation harness` | Status follow-ups like "did it dl" keep recent file/blocker evidence, do not replay stale long-context material, and hide `mark_work_complete` so the model answers rather than prematurely finishing |
| TC-22 | `replays AutoResearch case-c-try-it-first-alias: Try it first / alias debugging through the agent-loop continuation harness` | "test it" histories preserve the probe-only/simulation boundary, command alias correction, and no-download evidence |
| TC-23 | `replays AutoResearch case-d-skill-registry-diagnosis: Skill registry diagnosis through the agent-loop continuation harness` | Skill-on-disk but missing-from-runtime-registry histories preserve both facts and keep the answer focused on registry refresh rather than filesystem recreation |
| TC-24 | `replays AutoResearch case-e-full-long-context-continuation: Full long-context continuation through the agent-loop continuation harness` | A 615-message continuation produces a 609-message compact digest while keeping the current skill-registry blocker and next safest action recoverable |
| TC-25 | `requires recovered read_more_context evidence to become the final answer` | Ensures context-ref recovery is not merely present in tool history; the retrieved hidden token must appear in the next prompt and final user-facing answer |

## Mapping back to the Langfuse report

Source report: `docs/langfuse-truncation-report-2026-04-03.md`

| Report item | Status | Coverage |
|---|---|---|
| Scenario A / Hypothesis 1 — double truncation | Addressed | TC-02, TC-03 |
| Hypothesis 3 — always-on microcompact | Addressed | TC-14 |
| Hypothesis 4 — sticky archive frontier | Addressed | TC-08, TC-13 |
| Hypothesis 5 — inadequate `read_more_context` recovery | Partially addressed | TC-09, TC-11, TC-12, TC-16, TC-17 |
| Scenario B — compaction trigger behavior | Partially covered | TC-07, TC-18 |
| Scenario G — re-read/cost loops | Not directly unit-tested | needs live Langfuse comparison |
| Scenario E/F — browser/continuation-session pressure | Not directly unit-tested | needs live/manual validation |

## Recommended live comparison protocol

These code-level tests are green, but we still need a real before/after Langfuse comparison on fresh traces.

### Run one or two representative sessions

- a multi-tool coding session with repeated file/tool reads
- a browser-heavy session with large DOM/tool payloads

### Compare these metrics in Langfuse

- count of traces with `aggressive_truncate`
- count of traces with `archive_frontier`
- count of `ctx_*` references per trace
- total `(N chars omitted)` across generations
- iteration count and total cost for similar tasks

### Success criteria

- fewer `archive_frontier` applications on follow-up turns
- fewer repeated truncation markers for already-truncated results
- fewer `read_more_context` recovery round-trips for direct inspection
- equal or lower iteration count for comparable tasks

## Rerun commands

<augment_code_snippet mode="EXCERPT">
````bash
cd apps/desktop
pnpm run pretest && pnpm vitest run src/main/context-budget.test.ts
pnpm typecheck

cd ..
node --test apps/desktop/tests/context-read-more-density.test.mjs
````
</augment_code_snippet>

## Notes

- This document is the current test catalog for the truncation fix set.
- It documents the automated regression coverage we now have.
- It does **not** replace a fresh post-change Langfuse measurement run.
