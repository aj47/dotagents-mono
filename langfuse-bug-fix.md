# Langfuse Bug Fix Loop Ledger

## Purpose
Track recent Langfuse sessions/traces inspected so this loop does not repeat the same evidence without new signals.

## Recently inspected
| Date | Session ID | Trace ID | Outcome | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-09 | `conv_1773024143793_v7qtjonjy` | `session_1773024143795_wrbpe7lkn` | Not a product bug | `discord-recap-tweeter-v3` skill file was created after the failed run, so no code fix justified. |
| 2026-03-09 | `conv_1773028533776_ldsjpjgh5` | `session_1773028533777_0ya0av86q` | Fixed | Main agent over-delegated a simple repo question to `augustus`; user had to correct the system. |
| 2026-03-10 | `conv_1773094882403_dcolz2kht` | `session_1773094882403_qgq5anwqz` | Fixed | Langfuse trace output lagged behind the latest real assistant response in a long queued run, which made the trace look like the run ended with an older answer. |

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

### 2026-03-10 - Langfuse final-output selection fix

#### Evidence
- Evidence ID: `langfuse-final-output-selection`
- Scope: Ensure `processTranscriptWithAgentMode()` returns and traces the latest real user-facing assistant output instead of a stale earlier `finalContent` value when a run emits more assistant messages later in the session.
- Commit range: `bd56d13a..HEAD`
- Rationale: In the selected Langfuse session, the traced output did not match the later assistant response that was actually persisted for the same long/queued run. That makes debugging misleading and can also leak stale content to callers that consume `agentResult.content` for delivery paths.
- QA feedback: None (new iteration)
- Before evidence: Langfuse trace `session_1773094882403_qgq5anwqz` in session `conv_1773094882403_dcolz2kht` recorded input `okay yeah lets clean up first...` but its final output was the older mobile-handsfree answer (`Yep, you’re right — mobile hands-free is already merged...`). The persisted desktop conversation at `/Users/ajjoobandi/Library/Application Support/app.dotagents/conversations/conv_1773094882403_dcolz2kht.json` shows later assistant messages for that same run, including `Done — cleanup-first is in place...` and subsequent `aloops` skill responses, proving the trace output was stale relative to the actual session history.
- Change: Added `getLatestPlainAssistantMessageContent()` and `getPreferredAgentFinalOutput()` in `apps/desktop/src/main/agent-run-utils.ts`, then applied that selector in `apps/desktop/src/main/llm.ts` just before returning and ending the Langfuse trace. The selector prefers the latest plain assistant message, falls back to stored `respond_to_user` text when only tool-call wrappers exist, and preserves the emergency-stop note when present. Added focused unit coverage in `apps/desktop/src/main/agent-run-utils.test.ts`.
- After evidence: The LLM agent path now normalizes `finalContent` against the latest user-facing conversation state before returning and before `endAgentTrace(...)` runs, so Langfuse output and caller-visible final content follow the freshest real assistant response rather than an older intermediate value.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/agent-run-utils.test.ts` → failed in this worktree because local `node_modules`/`vitest` are absent (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL: Command "vitest" not found`). Fallback targeted run using already-installed main-repo dependencies: `NODE_PATH="$HOME/Development/dotagents-mono/node_modules" "$HOME/Development/dotagents-mono/node_modules/.bin/vitest" run apps/desktop/src/main/agent-run-utils.test.ts` → passed (`14 tests`). Additional hygiene check: `git diff --check` → passed. Optional typecheck attempt via shared binary: `NODE_PATH="$HOME/Development/dotagents-mono/node_modules" "$HOME/Development/dotagents-mono/node_modules/.bin/tsc" --noEmit -p apps/desktop/tsconfig.node.json` → blocked by missing worktree-local type deps (`@electron-toolkit/tsconfig`, `electron-vite/node`, `vitest/globals`).
- Blockers/remaining uncertainty: I did not do a live desktop repro because this iteration is a main-process final-output selection fix and the current worktree lacks a complete local dependency install. The unit tests cover the selector logic directly, but a future runtime pass should confirm the next long queued run writes the corrected final output into Langfuse end-to-end.

