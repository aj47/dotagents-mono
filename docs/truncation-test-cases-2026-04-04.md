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