# Langfuse Bug Fix Loop

## Purpose

Track inspected Langfuse sessions/traces, observed failures, suspected causes, fixes attempted, verification results, and remaining leads so the investigation loop does not repeat the same evidence.

## Recently Inspected Sessions / Traces

| Date | Session ID | Trace ID | Status | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-08 | conv_1772915850389_hzuikwa8l | session_1772915850391_hzuikwa8l | fix implemented (verification blocked) | User asked `can you check my Claude usage stats`; the run correctly told them manual Google login was required, but verification kept treating the request as unfinished, so the loop continued through more browser/login attempts and Langfuse still ended with `output: null`. Root repo issue found: verification had no terminal handoff path for deliverable responses that were explicitly waiting on user action. |
| 2026-03-08 | conv_1772432432747_7ibvlw0k0 | session_1772432432218_cdjv7gyla | fix implemented (verification blocked) | User clarified `I meant Claude Code by Anthropic.`; the run hit max iterations and Langfuse `output` ended as stale progress text (`Let me search for the correct URL and browse to it.`) plus a timeout note instead of a real blocker/partial-result summary. Root repo issue found: max-iteration finalization trusted the latest assistant text even when it was only an in-progress status update. |
| 2026-03-08 | conv_1772942234347_xyec3dx8u | session_1772942234349_piwpgovtd | fix implemented | User asked `What should I do`; the trace contained the right guidance but `output` was raw pseudo-tool text starting with `[respond_to_user] { ... }` instead of the clean user-facing answer. Root repo issue found: final output helpers preserved pseudo-tool wrappers when the model wrote them as plain assistant text instead of making a native tool call. |
| 2026-03-08 | conv_1772917235730_melwhp7ys | session_1772917234993_92gait83c | fix implemented | User explicitly complained that delegation should not block the main agent; trace ended with `output: null` after long-running `delegate_to_agent` spans. Root repo issue found: internal delegation ignored `waitForResult=false`, making non-blocking delegation impossible for internal agents. |
| 2026-03-08 | conv_1772944149514_dhmqtdvqt | session_1772944149515_tgt7e6ykh | fix implemented (verification blocked) | Simple user input `Hi` produced trace `output: null`; the only observation was `LLM Call` with error `API key expired. Please renew the API key.` Root repo issue found: provider/API errors could escape before `finalContent` was populated, leaving the run trace blank instead of preserving a terminal error message. |
| 2026-03-08 | conv_1772646724648_5kkw3rvk0 | session_1772646831952_uu14j453h, session_1772647013485_6tkgbaizi | fix implemented (verification blocked) | Follow-up recovery case around opening local PR worktrees in iTerm. First trace stalled after successful tool work and warnings; second trace successfully called `respond_to_user` with the completed result, then continued into unrequested GitHub file lookups and ended `output: null`. Root repo issue found: successful `respond_to_user` output was not preserved as fallback `finalContent`, so later speculative work/interruption could blank the run trace. |

## Investigations

### 2026-03-08 — Max-iteration timeout could preserve stale progress text as final output

- Langfuse evidence reviewed:
  - `conv_1772432432747_7ibvlw0k0` / `session_1772432432218_cdjv7gyla`
  - user input: `I meant Claude Code by Anthropic.`
  - trace outcome: final `output` was `Let me search for the correct URL and browse to it.` followed by the generic timeout note
  - observations showed repeated `Streaming LLM Call` outputs that were still in-progress status updates (`Let me open Claude Code by Anthropic...`, `Let me search for the correct URL...`) rather than a user-ready answer
- Repo reconstruction:
  - `apps/desktop/src/main/llm.ts` uses the max-iteration branch to finalize timed-out runs.
  - before this change, that branch pulled the latest assistant message from the current turn and blindly appended the timeout note.
  - when the latest assistant text was only a progress update, the user-facing result became stale intent-to-act text instead of a useful blocker summary.
- Concrete root cause:
  - max-iteration finalization treated any assistant text as acceptable final content, even if it was a non-deliverable progress update.
  - this let single-run failures surface as `Let me ...` text plus a timeout note, which still failed the user's intent because no concrete result or blocker summary was delivered.
- Fix implemented:
  - `apps/desktop/src/main/llm.ts`
    - added `getLatestDeliverableAssistantMessageInCurrentTurn()` to recover a real assistant answer from the current run when one exists
    - in the max-iteration finalizer, prefer a stored `respond_to_user` message if present
    - otherwise prefer the latest deliverable assistant message from the current turn
    - otherwise replace stale progress text with `buildIncompleteTaskFallback(...)` using an explicit timeout/failure reason instead of echoing `Let me ...`
  - tests added/updated:
    - `apps/desktop/src/main/llm.test.ts`

### 2026-03-08 — Pseudo `respond_to_user` text leaked into final trace output

- Langfuse evidence reviewed:
  - `conv_1772942234347_xyec3dx8u` / `session_1772942234349_piwpgovtd`
  - user input: `What should I do`
  - trace outcome: `output` was the raw string `[respond_to_user] { "text": "Do this now ..." }`
  - the same trace's `Streaming LLM Call` observation showed `output.content` containing pseudo-tool text for `respond_to_user`, while the actual native `toolCalls` only included `mark_work_complete`
- Repo reconstruction:
  - `apps/desktop/src/main/llm.ts` already preserves a real stored `respond_to_user` tool result via `preferStoredUserResponse()`.
  - however, when the model emits pseudo-tool syntax as plain assistant text instead of actually calling `respond_to_user`, there is nothing in `session-user-response-store` to rescue the final output.
  - `apps/desktop/src/main/agent-run-utils.ts` treated any non-empty `finalContent` / latest assistant message as already good and returned it unchanged.
- Concrete root cause:
  - final output selection did not sanitize pseudo-tool wrapper text like `[respond_to_user] { ... }` when it appeared in normal assistant content.
  - this meant a single run could produce the correct answer semantically, but still fail the user's intent by showing the wrapper instead of the answer itself.
- Fix implemented:
  - `apps/desktop/src/main/agent-run-utils.ts`
    - added helper logic to parse pseudo `respond_to_user` JSON blocks from assistant text
    - unwrap the embedded `text` / `images` content into clean user-facing markdown
    - apply that normalization in both `getPreferredDelegationOutput()` and `preferStoredUserResponse()` so delegated flows and top-level trace finalization both benefit
  - tests added/updated:
    - `apps/desktop/src/main/agent-run-utils.test.ts`

### 2026-03-08 — Internal delegation ignored `waitForResult=false`

- Langfuse evidence reviewed:
  - `conv_1772917235730_melwhp7ys` / `session_1772917234993_92gait83c`
  - user input (summarized): the main agent should not get stuck when delegating to another agent and should be able to continue while the delegated response arrives later.
  - trace outcome: `output: null`; observations showed repeated `delegate_to_agent` tool spans with warning/unfinished timing, consistent with a stalled delegation flow.
- Repo reconstruction:
  - `apps/desktop/src/main/system-prompts.ts` already tells the model to use the internal agent for parallel work.
  - `apps/desktop/src/main/acp/acp-router-tool-definitions.ts` exposes `waitForResult` on `delegate_to_agent`.
  - `apps/desktop/src/main/acp/acp-router-tools.ts` contradicted that contract: `executeInternalAgent()` explicitly ignored `waitForResult` and always awaited `runInternalSubSession()`.
- Concrete root cause:
  - for `agentName: "internal"`, background delegation was impossible even though the tool contract and prompt surface implied it should work.
  - this makes the user's stated intent unattainable in a single run whenever the main agent chooses the built-in internal agent for delegation.
- Fix implemented:
  - `apps/desktop/src/main/acp/acp-router-tools.ts`
    - honor `waitForResult=false` for internal delegation
    - start the internal sub-session in the background
    - keep delegated run state updated so `check_agent_status` can later return completed output or failure details
  - `apps/desktop/src/main/acp/acp-router-tool-definitions.ts`
    - clarify that `waitForResult=false` enables background delegation while the main agent continues
  - `apps/desktop/src/main/system-prompts.ts`
    - explicitly teach the model to set `waitForResult: false` for fire-and-forget internal delegation
  - tests added/updated:
    - `apps/desktop/src/main/acp/acp-router-tools.test.ts`
    - `apps/desktop/src/main/system-prompts.test.ts`

### 2026-03-08 — Provider/API errors left Langfuse trace output blank

- Langfuse evidence reviewed:
  - `conv_1772944149514_dhmqtdvqt` / `session_1772944149515_tgt7e6ykh`
  - user input: `Hi`
  - trace outcome: `output: null`
  - only recorded observation: `LLM Call` error with status message `API key expired. Please renew the API key.`
- Repo reconstruction:
  - `apps/desktop/src/main/llm.ts` catches LLM-call failures inside the agent loop and rethrows them.
  - before this change, the non-abort error path did not populate `finalContent` or append a terminal assistant message before rethrowing.
  - `tipc.ts` can still surface an outer error event, but Langfuse traces and any downstream consumers of `finalContent`/conversation state were left with a blank terminal output.
- Concrete root cause:
  - provider/API failures escaped the loop without preserving a final user-visible error string in the agent run state.
  - this turned a concrete failure into a silent/null Langfuse trace instead of a readable terminal error, which made the single-run failure harder to understand and recover from.
- Fix implemented:
  - `apps/desktop/src/main/error-utils.ts`
    - added `formatTerminalErrorMessage()` for stable, stack-trace-free terminal error text
  - `apps/desktop/src/main/llm.ts`
    - when a non-abort LLM/tool loop error occurs, persist a terminal error string into `finalContent`
    - append that terminal error as the last assistant message when needed before rethrowing
    - keep the error throw so outer callers still handle completion/error state normally
  - tests added/updated:
    - `apps/desktop/src/main/error-utils.test.ts`

### 2026-03-08 — Successful `respond_to_user` output could still collapse to blank trace output

- Langfuse evidence reviewed:
  - `conv_1772646724648_5kkw3rvk0`
  - `session_1772646831952_uu14j453h`
    - user input: `can you check if we have branches for the worktrees for 35 and 36 locally and open them up in iterm`
    - observations show mixed tool recovery: initial `execute_command` failed on `cd ~/dotagents-mono`, `iterm:create_tab` warned because there was no current iTerm window, then `iterm:create_window`/`iterm:write_to_terminal` succeeded, and the final `Streaming LLM Call` never closed.
    - trace outcome: `output: null`
  - `session_1772647013485_6tkgbaizi`
    - user input: `continue`
    - `respond_to_user` succeeded with a concrete completion message saying both PR #35 and #36 iTerm windows were open and ready.
    - immediately after that, the next generation said it would also inspect PR details and started `github:get_pull_request_files`; one of those spans never closed.
    - trace outcome: `output: null`
  - later recovery trace `session_1772647900900_1wdgjhgq2` (`i dont see 35`) partially recovered the user experience by bringing PR #35 to the front, confirming the earlier run had not cleanly finished the user-visible flow.
- Repo reconstruction:
  - `apps/desktop/src/main/builtin-tools.ts` stores `respond_to_user` content in `session-user-response-store`.
  - `apps/desktop/src/main/llm.ts` only promoted that stored response into `finalContent` inside selected completion branches.
  - if the agent sent a valid `respond_to_user` message, then kept iterating into speculative extra work and later errored/stalled/interrupted before one of those completion branches ran, the run could still end with blank `finalContent`.
- Concrete root cause:
  - a successful `respond_to_user` message was not preserved as fallback final output for the run.
  - this made single-run user success fragile: if later unnecessary work stalled, Langfuse and any consumers of `finalContent` could lose the already-generated user-facing answer and show a blank/null terminal result.
- Fix implemented:
  - `apps/desktop/src/main/agent-run-utils.ts`
    - added `preferStoredUserResponse()` to keep an existing final response but fall back to the stored `respond_to_user` message when `finalContent` is blank.
  - `apps/desktop/src/main/llm.ts`
    - after successful tool batches, seed blank `finalContent` from the stored `respond_to_user` value
    - reapply that fallback before returning and before Langfuse trace finalization so later speculative work cannot blank out an already delivered response
  - tests added/updated:
    - `apps/desktop/src/main/agent-run-utils.test.ts`
    - `apps/desktop/src/main/llm.test.ts`

## Verification Log

- Targeted test command attempted:
  - `npx -y vitest run apps/desktop/src/main/llm.test.ts`
  - `npx -y -p vitest -p @electron-toolkit/tsconfig vitest run apps/desktop/src/main/llm.test.ts`
  - `npx -y -p vitest vitest run --config /tmp/langfuse-bug-fix-vitest.config.mjs apps/desktop/src/main/llm.test.ts`
- Result:
  - blocked by missing local desktop dependencies / `node_modules`
  - immediate blocker during transform: Vite could not resolve desktop tsconfig inheritance from `@electron-toolkit/tsconfig/tsconfig.node.json`
- Manual verification completed:
  - confirmed the chosen Langfuse timeout trace ended with stale progress text rather than a deliverable answer
  - confirmed the updated max-iteration branch now distinguishes deliverable assistant text from in-progress status updates
  - confirmed the new fallback order is: stored `respond_to_user` message → latest deliverable assistant message from the current turn → explicit incomplete-task fallback

- Targeted test command attempted:
  - `pnpm --filter @dotagents/desktop test -- --run src/main/acp/acp-router-tools.test.ts src/main/system-prompts.test.ts`
- Result:
  - blocked by missing local dependencies / `node_modules`
  - failure occurred in desktop `pretest` while building `@dotagents/shared`
  - exact blocker: `tsup: command not found`
- Manual verification completed:
  - confirmed the tool contract / prompt wording / runtime behavior now align for internal async delegation
  - confirmed the async code path populates delegated run status so `check_agent_status` has terminal data to return after completion
- Targeted test command attempted:
  - `pnpm --filter @dotagents/desktop run test:run -- src/main/error-utils.test.ts`
- Result:
  - blocked by missing local dependencies / `node_modules`
  - failure occurred in desktop `pretest` while building `@dotagents/shared`
  - exact blocker: `tsup: command not found`
- Manual verification completed:
  - confirmed the chosen trace has a concrete upstream error (`API key expired`) but no terminal trace output
  - confirmed the new non-abort error path now records a cleaned terminal error string into `finalContent` before rethrowing, which should prevent future blank Langfuse outputs for this failure class
- Targeted test command attempted:
  - `pnpm --filter @dotagents/desktop exec vitest run src/main/agent-run-utils.test.ts src/main/llm.test.ts`
- Result:
  - blocked by missing local desktop dependencies / `node_modules`
  - exact blocker: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`
- Manual verification completed:
  - confirmed the `continue` trace successfully executed `respond_to_user` with the completed user-facing message before later speculative GitHub tool calls started
  - confirmed the updated loop now captures a blank `finalContent` from the stored `respond_to_user` message after successful tool batches and again before trace finalization, which should prevent future null trace outputs for this failure pattern even if later work is interrupted
- Targeted test command attempted:
  - `pnpm --filter @dotagents/desktop exec vitest run src/main/agent-run-utils.test.ts`
- Result:
  - blocked by missing local desktop dependencies / `node_modules`
  - exact blocker: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`
- Dependency-free sanity check completed:
  - used Node's `--experimental-strip-types` loader to import `apps/desktop/src/main/agent-run-utils.ts` directly
  - verified the new helper path unwraps pseudo `[respond_to_user] { "text": ... }` content into plain final text
  - verified pseudo `respond_to_user` image payloads are rendered into markdown image links

### 2026-03-08 — Verification loop should stop when a run is explicitly waiting on user action

- Langfuse evidence reviewed:
  - `conv_1772915850389_hzuikwa8l` / `session_1772915850391_hzuikwa8l`
  - user input: `can you check my Claude usage stats`
  - trace outcome: `output: null` after 73 observations even though the run had already produced deliverable blocker handoff text like `Please log in manually in the debug Chrome window, then let me know and I'll pull up your usage stats.`
  - the same trace later showed repeated browser/login attempts, a `mark_work_complete` span, multiple `respond_to_user` spans, and verifier outputs saying the task was incomplete because the stats had not been retrieved yet
- Repo reconstruction:
  - `apps/desktop/src/main/llm.ts` funnels completion candidates through `runVerificationAndHandleResult(...)`
  - when verification failed, the only terminal branches were `continue iterating` or `force incomplete after retry limit`
  - there was no branch for a valid user-facing blocker handoff where the current run should end and wait for the user's next action instead of continuing the same loop
- Concrete root cause:
  - verification logic treated `waiting on user action` responses the same as ordinary incomplete work
  - this caused futile extra iterations after a correct handoff (for example manual login / approval / permission steps), which could blank the trace output again even though the user had already been told what to do next
- Fix implemented:
  - `apps/desktop/src/main/user-action-blocker.ts`
    - added `isWaitingOnUserActionResponse()` to detect explicit handoff responses that ask the user to complete a manual step and report back
  - `apps/desktop/src/main/llm.ts`
    - extended verification results with a `stoppedForUserAction` path
    - when verification fails but the current deliverable is clearly waiting on user action, end the run immediately instead of continuing the loop
    - preserve the blocker handoff text as the final content rather than replacing it with a generic incomplete fallback
    - label the completion step as `Waiting on user action` so the progress state matches the run outcome
  - tests added/updated:
    - `apps/desktop/src/main/llm.test.ts`
      - added a regression test covering a blocker response that should stop after verification instead of spinning for more iterations
- Targeted verification attempted:
  - `pnpm --filter @dotagents/desktop test:run -- src/main/llm.test.ts`
- Result:
  - blocked by missing local desktop dependencies / `node_modules`
  - exact blocker: shared-package pretest failed with `sh: tsup: command not found` and pnpm warned that local `node_modules` are missing in this worktree
- Dependency-free sanity check completed:
  - `git diff --check -- apps/desktop/src/main/llm.ts apps/desktop/src/main/llm.test.ts apps/desktop/src/main/user-action-blocker.ts langfuse-bug-fix.md`
  - result: passed with exit code `0`

## Remaining Leads

- Review recent Langfuse traces for single-run failures with follow-up user recovery.
- Prioritize tool/generation errors and incomplete or stalled responses.
- Recheck a fresh max-iteration timeout trace after desktop dependencies are restored, to confirm Langfuse/UI now show either a real current-turn answer or an explicit incomplete-task fallback instead of stale `Let me ...` text.
- Recheck a fresh provider-error trace after dependencies are installed and the desktop app can be exercised locally, to confirm the UI and Langfuse trace now both preserve the terminal error message.
- Recheck a fresh `waiting on user action` trace (manual login / auth / approval) after dependencies are restored, to confirm the run now stops cleanly with the handoff message instead of continuing into futile extra iterations.
- Recheck a fresh post-`respond_to_user` trace once dependencies are installed and the desktop app can be exercised locally, to confirm the UI/run completion path preserves the delivered response even if later extra tool work is interrupted.
- Recheck a fresh pseudo-`respond_to_user` trace after desktop dependencies are restored, to confirm Langfuse/UI now show only the unwrapped user-facing text rather than the pseudo-tool wrapper.
- Once dependencies are available in this worktree, rerun the targeted Vitest command above and then a slightly wider desktop ACP test slice if needed.
