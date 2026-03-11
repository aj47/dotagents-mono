# Langfuse Bug Fix Loop Ledger

## Purpose
Track recent Langfuse sessions/traces inspected so this loop does not repeat the same evidence without new signals.

## Recently inspected
| Date | Session ID | Trace ID | Outcome | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-09 | `conv_1773024143793_v7qtjonjy` | `session_1773024143795_wrbpe7lkn` | Not a product bug | `discord-recap-tweeter-v3` skill file was created after the failed run, so no code fix justified. |
| 2026-03-09 | `conv_1773028533776_ldsjpjgh5` | `session_1773028533777_0ya0av86q` | Fixed | Main agent over-delegated a simple repo question to `augustus`; user had to correct the system. |
| 2026-03-11 | `conv_1773175305930_77qxfmg2z` | `session_1773175401371_tauywx6ze` | Fixed | ACP run looped on `github:create_issue` because it kept sending `milestone: 0`; follow-up QA narrowed the fix to the traced GitHub placeholders only. |

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

### 2026-03-11 - GitHub create_issue scope correction after QA
- Reviewed the ledger and outstanding QA feedback first, then re-inspected session `conv_1773175305930_77qxfmg2z` / trace `session_1773175401371_tauywx6ze` via `langfuse-cli`.
- Confirmed from the traced generation payload that the failing MCP calls specifically carried `assignees: []`, `labels: []`, and `milestone: 0`; the evidence did not justify broad pruning of empty strings, nulls, or unrelated-tool optional fields.
- Chosen follow-up: narrow the sanitization to the traced `github:create_issue` placeholders and add a regression test proving unrelated tools still receive empty optional values unchanged.

#### Evidence
- Evidence ID: `github-create-issue-milestone-placeholder`
- Scope: Align the GitHub issue-creation placeholder fix with the actual Langfuse evidence by stripping only the traced invalid `github:create_issue` placeholders and avoiding broader optional-argument pruning.
- Commit range: `cdb34fd523739a2ffa5ddd6da9e5d011fd8da5cc..3a7d0725621d0d8c4711b4aee0ab4b176dd8bf99`
- Rationale: The prior implementation solved the traced loop but overreached by pruning empty/null optional values for every MCP tool without corresponding evidence. Narrowing the behavior to the traced GitHub placeholders preserves the first-run fix while reducing regression risk for other tools that may legitimately distinguish between omitted and explicitly empty optional values.
- QA feedback: Addressed reviewer finding that the previous change/evidence overclaimed generic optional-argument pruning when the Langfuse trace only showed `github:create_issue` placeholders (`milestone: 0`, `assignees: []`, `labels: []`).
- Before evidence: Langfuse trace `session_1773175401371_tauywx6ze` (session `conv_1773175305930_77qxfmg2z`) still shows the failing generation emitting `github:create_issue` tool arguments with `assignees: []`, `labels: []`, and `milestone: 0` before the MCP server returned `Validation Failed`. Re-inspection via `langfuse-cli` did not surface evidence for empty-string/null pruning on unrelated tools, so the broader sanitization from the prior commit was not trace-backed.
- Change: Updated `apps/desktop/src/main/mcp-service.ts` to strip only the traced GitHub `create_issue` placeholders (`assignees: []`, `labels: []`, `milestone <= 0`). Extended `apps/desktop/src/main/mcp-service.option-b.test.ts` with a guard test that unrelated tools still receive empty-string, empty-array, and null optional values unchanged.
- After evidence: The GitHub regression test still verifies that traced placeholder arguments are removed before `github:create_issue` executes, while the new unrelated-tool regression test verifies that empty optional values are no longer pruned generically. This brings the implementation and the evidence back into scope alignment.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/mcp-service.option-b.test.ts` → passed (`7 tests`, exit 0). Vitest emitted a pre-existing `apps/mobile/tsconfig.json` parse warning about resolving `expo/tsconfig.base`, but the targeted desktop test file still completed successfully.
- Blockers/remaining uncertainty: No live desktop repro was needed because this iteration only changed MCP argument sanitization for a traced tool call. I revalidated against the same Langfuse trace, but I did not broaden verification beyond the targeted desktop regression file because the change intentionally narrowed scope.

