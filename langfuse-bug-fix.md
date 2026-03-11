# Langfuse Bug Fix Loop Ledger

## Purpose
Track recent Langfuse sessions/traces inspected so this loop does not repeat the same evidence without new signals.

## Recently inspected
| Date | Session ID | Trace ID | Outcome | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-09 | `conv_1773024143793_v7qtjonjy` | `session_1773024143795_wrbpe7lkn` | Not a product bug | `discord-recap-tweeter-v3` skill file was created after the failed run, so no code fix justified. |
| 2026-03-09 | `conv_1773028533776_ldsjpjgh5` | `session_1773028533777_0ya0av86q` | Fixed | Main agent over-delegated a simple repo question to `augustus`; user had to correct the system. |
| 2026-03-11 | `conv_1773175305930_77qxfmg2z` | `session_1773175401371_tauywx6ze` | Fixed | ACP run looped on `github:create_issue` because it kept sending `milestone: 0`; tool wiring now strips placeholder optional args before execution. |

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

## Iteration notes

### 2026-03-11 - GitHub create_issue placeholder sanitization
- Reviewed the ledger first to avoid repeating prior traces, then inspected recent Langfuse traces with tool warnings and follow-up recovery.
- Chosen issue: trace `session_1773175401371_tauywx6ze` repeatedly called `github:create_issue` with `milestone: 0`, causing `Validation Failed` loops before the agent fell back to `gh issue create`.
- Reconstructed the failure in `apps/desktop/src/main/mcp-service.ts`, where MCP tool arguments were type-coerced but not sanitized for placeholder optional values.

#### Evidence
- Evidence ID: `github-create-issue-milestone-placeholder`
- Scope: Prevent ACP/MCP GitHub issue creation runs from retry-looping on invalid placeholder optional arguments that the GitHub MCP server rejects.
- Commit range: `e46d01822ce065cf4b6b0ee3aa64f0078c0cd00e..1e8428d1b2c817ab4235e40428197f03e866f3e0`
- Rationale: Langfuse showed a concrete agent-quality failure where the run burned multiple iterations on the same invalid `github:create_issue` payload instead of completing cleanly. Stripping placeholder optional values at the MCP execution layer prevents this specific validation loop and improves first-run success for user requests that create GitHub issues.
- QA feedback: None (new iteration)
- Before evidence: Langfuse trace `session_1773175401371_tauywx6ze` in session `conv_1773175305930_77qxfmg2z` shows three `github:create_issue` calls failing with `Validation Failed` while sending optional placeholders including `milestone: 0`, `assignees: []`, and `labels: []`. The same run only completed after falling back to `gh issue create`, so the agent looped unnecessarily before achieving the user intent.
- Change: Updated `apps/desktop/src/main/mcp-service.ts` to prune empty optional strings/arrays/nulls before tool execution and to drop the invalid GitHub `create_issue` placeholder `milestone: 0`. Added regression coverage in `apps/desktop/src/main/mcp-service.option-b.test.ts` to assert the GitHub MCP client receives sanitized arguments.
- After evidence: Regression test now exercises the traced payload shape and verifies that `github:create_issue` is executed without `milestone: 0` or empty optional arrays, matching the successful fallback payload shape more closely and eliminating the validation-triggering placeholder values before the MCP call is sent.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/mcp-service.option-b.test.ts` initially failed because this worktree had no local `node_modules`. After linking this worktree to the existing sibling checkout dependencies, the same command passed (`6 tests`). A follow-up `pnpm --filter @dotagents/desktop exec tsc -p tsconfig.node.json --noEmit` surfaced an unrelated pre-existing environment/type-resolution blocker: `src/main/acp/internal-agent.ts(16,30): error TS2307: Cannot find module 'uuid' or its corresponding type declarations.`
- Blockers/remaining uncertainty: No live desktop repro was needed because this was MCP tool wiring rather than UI behavior. The targeted regression test passed, but full desktop typecheck remains blocked in this worktree by the unrelated `uuid` resolution issue noted above.

