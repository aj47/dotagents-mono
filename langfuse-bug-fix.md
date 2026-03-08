# Langfuse Bug Fix Loop

## Purpose

Track inspected Langfuse sessions/traces, observed failures, suspected causes, fixes attempted, verification results, and remaining leads so the investigation loop does not repeat the same evidence.

## Recently Inspected Sessions / Traces

| Date | Session ID | Trace ID | Status | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-08 | conv_1772917235730_melwhp7ys | session_1772917234993_92gait83c | fix implemented | User explicitly complained that delegation should not block the main agent; trace ended with `output: null` after long-running `delegate_to_agent` spans. Root repo issue found: internal delegation ignored `waitForResult=false`, making non-blocking delegation impossible for internal agents. |
| 2026-03-08 | conv_1772646724648_5kkw3rvk0 | session_1772646831952_uu14j453h, session_1772647013485_6tkgbaizi | inspected-not-chosen | Follow-up recovery case (`continue`, then `i dont see 35`) with stalled/null trace outputs after tool use. Kept as a lead for a later loop if the current delegation fix is insufficient. |

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

## Remaining Leads

- Review recent Langfuse traces for single-run failures with follow-up user recovery.
- Prioritize tool/generation errors and incomplete or stalled responses.
- Revisit `conv_1772646724648_5kkw3rvk0` if more evidence is needed; its null-output traces after tool activity may indicate a second issue in completion/finalization after successful tool calls.
- Once dependencies are available in this worktree, rerun the targeted Vitest command above and then a slightly wider desktop ACP test slice if needed.