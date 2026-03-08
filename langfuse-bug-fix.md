# Langfuse Bug Fix Loop

## Purpose

Track inspected Langfuse sessions/traces, observed failures, suspected causes, fixes attempted, verification results, and remaining leads so the investigation loop does not repeat the same evidence.

## Recently Inspected Sessions / Traces

| Date | Session ID | Trace ID | Status | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-08 | conv_1772917235730_melwhp7ys | session_1772917234993_92gait83c | fix implemented | User explicitly complained that delegation should not block the main agent; trace ended with `output: null` after long-running `delegate_to_agent` spans. Root repo issue found: internal delegation ignored `waitForResult=false`, making non-blocking delegation impossible for internal agents. |
| 2026-03-08 | conv_1772944149514_dhmqtdvqt | session_1772944149515_tgt7e6ykh | fix implemented (verification blocked) | Simple user input `Hi` produced trace `output: null`; the only observation was `LLM Call` with error `API key expired. Please renew the API key.` Root repo issue found: provider/API errors could escape before `finalContent` was populated, leaving the run trace blank instead of preserving a terminal error message. |
| 2026-03-08 | conv_1772646724648_5kkw3rvk0 | session_1772646831952_uu14j453h, session_1772647013485_6tkgbaizi | fix implemented (verification blocked) | Follow-up recovery case around opening local PR worktrees in iTerm. First trace stalled after successful tool work and warnings; second trace successfully called `respond_to_user` with the completed result, then continued into unrequested GitHub file lookups and ended `output: null`. Root repo issue found: successful `respond_to_user` output was not preserved as fallback `finalContent`, so later speculative work/interruption could blank the run trace. |

## Investigations

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

## Remaining Leads

- Review recent Langfuse traces for single-run failures with follow-up user recovery.
- Prioritize tool/generation errors and incomplete or stalled responses.
- Recheck a fresh provider-error trace after dependencies are installed and the desktop app can be exercised locally, to confirm the UI and Langfuse trace now both preserve the terminal error message.
- Recheck a fresh post-`respond_to_user` trace once dependencies are installed and the desktop app can be exercised locally, to confirm the UI/run completion path preserves the delivered response even if later extra tool work is interrupted.
- Once dependencies are available in this worktree, rerun the targeted Vitest command above and then a slightly wider desktop ACP test slice if needed.