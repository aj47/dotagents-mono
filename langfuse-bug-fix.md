# Langfuse Bug Fix Loop Ledger

## Purpose
Track recent Langfuse sessions/traces inspected so this loop does not repeat the same evidence without new signals.

## Recently inspected
| Date | Session ID | Trace ID | Outcome | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-09 | `conv_1773024143793_v7qtjonjy` | `session_1773024143795_wrbpe7lkn` | Not a product bug | `discord-recap-tweeter-v3` skill file was created after the failed run, so no code fix justified. |
| 2026-03-09 | `conv_1773028533776_ldsjpjgh5` | `session_1773028533777_0ya0av86q` | Fixed | Main agent over-delegated a simple repo question to `augustus`; user had to correct the system. |
| 2026-03-09 | `conv_1772998067482_jy0eeumz0` | `session_1772998067446_0h8pm9x8f` | Fixed | `execute_command` now treats only string `skillId: "default"` as the compatibility sentinel and rejects invalid non-string `skillId` values with regression coverage. |

## Iteration notes

### 2026-03-09 - Prompt over-delegation fix
- Started by reviewing `apps/desktop/OBSERVABILITY.md` and `apps/desktop/DEBUGGING.md`.
- Dismissed one false lead where a skill genuinely did not exist yet.
- Chosen issue: mandatory delegation guidance caused a poor first run on a simple repo question.

#### Evidence
- Scope: Reduce unnecessary delegation in ACP main-agent runs when the task is simple enough to answer directly with available tools.
- Before evidence: Langfuse trace `session_1773028533777_0ya0av86q` shows the user asked `how does the QA agent work in aloops. will it work for any loop`; the first model step immediately called `delegate_to_agent` for `augustus`. In the same conversation (`conv_1773028533776_ldsjpjgh5`), the user later had to send `Use available tools directly via native function-calling, or provide a complete final answer.` The injected prompt in `apps/desktop/src/main/system-prompts.ts` explicitly said `ALWAYS delegate to a matching agent BEFORE responding` and `Only respond directly if NO agent matches the request`.
- Change: Updated `apps/desktop/src/main/system-prompts.ts` so delegation guidance prefers direct execution for simple/local tasks, reserves delegation for explicit/specialized/parallel cases, and tells the agent to incorporate delegated results into a complete answer. Added `apps/desktop/src/main/system-prompts.test.ts` coverage for the new wording.
- After evidence: The delegation prompt no longer contains the mandatory `ALWAYS delegate` / `Only respond directly if NO agent matches` rules, and now contains direct-answer preference plus delegation-result synthesis guidance. Regression test passes against the updated prompt builder.
- Verification commands/run results: `NODE_PATH="$HOME/Development/dotagents-mono/node_modules" "$HOME/Development/dotagents-mono/node_modules/.bin/vitest" run apps/desktop/src/main/system-prompts.test.ts` → passed (`2 tests`). Initial `pnpm --filter @dotagents/desktop test -- src/main/system-prompts.test.ts` was blocked because this worktree has no local `node_modules`.
- Blockers/remaining uncertainty: I did not perform a live desktop repro because this iteration only changed prompt text and the worktree lacks a local dependency install. Remaining lead: inspect whether delegated-run output selection should prefer explicit `respond_to_user` content more aggressively when sub-agents do run.

## Next promising leads
- Sessions where delegated sub-agent output was low quality or not synthesized cleanly by the parent agent
- Recent traces with tool/generation errors that map to app behavior instead of external provider/network failures
- Runs that ended without satisfying the user in a single agent execution

### 2026-03-09 - `execute_command` default-skill compatibility
- Re-reviewed the ledger first to avoid the already-inspected over-delegation and missing-skill traces.
- Queried recent Langfuse traces and compared several blank-output runs before choosing the one with concrete tool-failure evidence.
- Chosen issue: a user request to create an ACP-related issue stalled after the model called `execute_command` with `skillId: "default"`, which the tool rejected as a missing skill.

#### Evidence
- Scope: Make `execute_command` resilient when the model sends the compatibility sentinel `skillId: "default"` instead of omitting `skillId`.
- Before evidence: Langfuse trace `session_1772998067446_0h8pm9x8f` in session `conv_1772998067482_jy0eeumz0` shows a user request: `Create an issue to make the ACP connections better. Something is wrong in the tracking and it's dropping off and on`. Observation `74124026-524e-4f5c-bea3-e3fb78b8b627` (`execute_command`) failed with `{"success":false,"error":"Skill not found: default"}` after the model sent `{"command":"git log --oneline -10","skillId":"default"}`; a later retry observation `200ab890-d5fd-4920-85fb-636d2d335b27` failed the same way for `{"command":"git diff HEAD~1..HEAD","skillId":"default"}`. The trace has no final output, so the user intent was not completed in that run.
- Change: Updated `apps/desktop/src/main/builtin-tools.ts` so `execute_command` trims `skillId` and treats `default` (case-insensitive) as no skill selection, which falls back to the current working directory instead of erroring. Updated the `execute_command` schema text in `apps/desktop/src/main/builtin-tool-definitions.ts` to explicitly tell the model to omit `skillId` for the current working directory and note that `default` is treated the same. Added `apps/desktop/src/main/builtin-tools.test.ts` coverage for the new compatibility behavior while keeping explicit unknown skill IDs rejected.
- After evidence: Static repo evidence shows `execute_command` now normalizes `skillId` before lookup, so `default` no longer enters the `Skill not found` branch. The new unit test codifies the exact trace-backed regression (`skillId: "default"` executes without a skill lookup) and preserves the existing error behavior for a real missing skill ID.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/builtin-tools.test.ts` → failed immediately with `Command "vitest" not found`. `pnpm --filter @dotagents/desktop test -- --run src/main/builtin-tools.test.ts` → failed during `pretest` because the worktree has no local dependencies installed (`packages/shared` build could not find `tsup`; pnpm warned `node_modules missing`). `NODE_PATH="$HOME/Development/dotagents-mono/node_modules" "$HOME/Development/dotagents-mono/node_modules/.bin/vitest" run apps/desktop/src/main/builtin-tools.test.ts` → passed (`2 tests`).
- Blockers/remaining uncertainty: No blocker remains for targeted unit verification of this fix; the regression test passes in this worktree via the documented external-Vitest workaround. I did not rerun a live desktop repro for this QA pass because the finding was limited to correcting the ledger evidence, so remaining uncertainty is only whether a separate post-tool-execution failure mode exists in other blank-output traces.

### 2026-03-09 - `execute_command` compatibility QA remediation
- Re-read the QA findings file and this ledger before making any changes.
- Kept the scope strictly on the already-inspected `execute_command` trace and the broadened runtime behavior called out by QA.
- Chosen issue: the previous compatibility fix silently treated non-string `skillId` values as omitted, which was broader than the Langfuse-backed `skillId: "default"` regression.

#### Evidence
- Scope: Narrow `execute_command` compatibility so only string `skillId: "default"` is treated as omitted; reject invalid non-string `skillId` inputs.
- Before evidence: QA finding 1 showed `executeBuiltinTool("execute_command", { command: "pwd", skillId: 123 })` succeeded because `apps/desktop/src/main/builtin-tools.ts` normalized non-string `skillId` values to `undefined` before validation. The targeted test file only covered lowercase string `"default"` and an unknown string skill ID, so this broader regression was not pinned down.
- Change: Added explicit runtime validation in `apps/desktop/src/main/builtin-tools.ts` that returns `skillId parameter must be a string if provided` when `skillId` is present but not a string, while preserving the string `"default"` compatibility path. Extended `apps/desktop/src/main/builtin-tools.test.ts` with a numeric `skillId` regression test that asserts the tool errors before any skill lookup or shell execution.
- After evidence: Repo inspection now shows `execute_command` rejects non-string `skillId` values before the `"default"` normalization branch. The targeted test file now covers three cases: string `"default"` compatibility, invalid numeric `skillId` rejection, and explicit missing-string skill rejection.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/builtin-tools.test.ts` → failed in this worktree with `Command "vitest" not found`. `NODE_PATH="$HOME/Development/dotagents-mono/node_modules" "$HOME/Development/dotagents-mono/node_modules/.bin/vitest" run apps/desktop/src/main/builtin-tools.test.ts` → passed (`1 file`, `3 tests`).
- Blockers/remaining uncertainty: No blocker remains for this QA scope. I did not re-query Langfuse or perform a live desktop repro because the remediation was limited to runtime input validation and targeted unit coverage against the already-selected trace-backed issue.

