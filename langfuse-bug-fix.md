# Langfuse Bug Fix Loop Ledger

## Purpose
Track recent Langfuse sessions/traces inspected so this loop does not repeat the same evidence without new signals.

## Recently inspected
| Date | Session ID | Trace ID | Outcome | Notes |
| --- | --- | --- | --- | --- |
| 2026-03-09 | `conv_1773024143793_v7qtjonjy` | `session_1773024143795_wrbpe7lkn` | Not a product bug | `discord-recap-tweeter-v3` skill file was created after the failed run, so no code fix justified. |
| 2026-03-09 | `conv_1773028533776_ldsjpjgh5` | `session_1773028533777_0ya0av86q` | Fixed | Main agent over-delegated a simple repo question to `augustus`; user had to correct the system. |
| 2026-03-11 | `conv_1773175305930_77qxfmg2z` | `session_1773175401371_tauywx6ze` | Fixed | ACP run looped on `github:create_issue` because it kept sending `milestone: 0`; follow-up QA narrowed the fix to the traced GitHub placeholders only. |
| 2026-03-11 | `conv_1773175305930_77qxfmg2z` | `session_1773175401371_tauywx6ze` | Fixed (QA follow-up) | Re-inspected the same trace directly via Langfuse observations, added same-tool preservation coverage for valid `github:create_issue` options, and backfilled evidence provenance through commit `23569b546f010f9753852c62146bfb04d24ffb8b`. |
| 2026-03-11 | `conv_1773189947592_ng14sqy3e` | `session_1773189947593_ffkmg2v2t` | Fixed | ACP memory-hygiene run completed work, called `respond_to_user`, then still persisted a contradictory plain assistant failure message that made the run look unsuccessful. |

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
- Change: Initial fix updated `apps/desktop/src/main/mcp-service.ts` to sanitize the traced `github:create_issue` payload shape before execution and added regression coverage in `apps/desktop/src/main/mcp-service.option-b.test.ts` to assert the GitHub MCP client receives sanitized arguments. A later QA follow-up narrowed the implementation/evidence wording to the specific traced placeholders only; see the next entry.
- After evidence: Regression test exercised the traced payload shape and verified that `github:create_issue` executed without `milestone: 0` or empty optional arrays, matching the successful fallback payload shape more closely and eliminating the validation-triggering placeholder values before the MCP call was sent. The follow-up entry below records the additional guard against broader generic pruning.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/mcp-service.option-b.test.ts` initially failed because this worktree had no local `node_modules`. After linking this worktree to the existing sibling checkout dependencies, the same command passed (`6 tests`). A follow-up `pnpm --filter @dotagents/desktop exec tsc -p tsconfig.node.json --noEmit` surfaced an unrelated pre-existing environment/type-resolution blocker: `src/main/acp/internal-agent.ts(16,30): error TS2307: Cannot find module 'uuid' or its corresponding type declarations.`
- Blockers/remaining uncertainty: No live desktop repro was needed because this was MCP tool wiring rather than UI behavior. The targeted regression test passed, but full desktop typecheck remains blocked in this worktree by the unrelated `uuid` resolution issue noted above.

### 2026-03-11 - GitHub create_issue scope correction after QA
- Reviewed the ledger and outstanding QA feedback first, then re-inspected session `conv_1773175305930_77qxfmg2z` / trace `session_1773175401371_tauywx6ze` via `langfuse-cli`.
- Confirmed from the traced generation payload that the failing MCP calls specifically carried `assignees: []`, `labels: []`, and `milestone: 0`; the evidence did not justify broad pruning of empty strings, nulls, or unrelated-tool optional fields.
- Chosen follow-up: narrow the sanitization to the traced `github:create_issue` placeholders and add a regression test proving unrelated tools still receive empty optional values unchanged.

#### Evidence
- Evidence ID: `github-create-issue-milestone-placeholder`
- Scope: Align the GitHub issue-creation placeholder fix with the actual Langfuse evidence by stripping only the traced invalid `github:create_issue` placeholders and avoiding broader optional-argument pruning.
- Commit range: `cdb34fd523739a2ffa5ddd6da9e5d011fd8da5cc..3a7d0725abbc295b376a4a668c79db14834416a3`
- Rationale: The prior implementation solved the traced loop but overreached by pruning empty/null optional values for every MCP tool without corresponding evidence. Narrowing the behavior to the traced GitHub placeholders preserves the first-run fix while reducing regression risk for other tools that may legitimately distinguish between omitted and explicitly empty optional values.
- QA feedback: Addressed reviewer finding that the previous change/evidence overclaimed generic optional-argument pruning when the Langfuse trace only showed `github:create_issue` placeholders (`milestone: 0`, `assignees: []`, `labels: []`).
- Before evidence: Langfuse trace `session_1773175401371_tauywx6ze` (session `conv_1773175305930_77qxfmg2z`) still shows the failing generation emitting `github:create_issue` tool arguments with `assignees: []`, `labels: []`, and `milestone: 0` before the MCP server returned `Validation Failed`. Re-inspection via `langfuse-cli` did not surface evidence for empty-string/null pruning on unrelated tools, so the broader sanitization from the prior commit was not trace-backed.
- Change: Updated `apps/desktop/src/main/mcp-service.ts` to strip only the traced GitHub `create_issue` placeholders (`assignees: []`, `labels: []`, `milestone <= 0`). Extended `apps/desktop/src/main/mcp-service.option-b.test.ts` with a guard test that unrelated tools still receive empty-string, empty-array, and null optional values unchanged.
- After evidence: The GitHub regression test still verifies that traced placeholder arguments are removed before `github:create_issue` executes, while the new unrelated-tool regression test verifies that empty optional values are no longer pruned generically. This brings the implementation and the evidence back into scope alignment.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/mcp-service.option-b.test.ts` → passed (`7 tests`, exit 0). Vitest emitted a pre-existing `apps/mobile/tsconfig.json` parse warning about resolving `expo/tsconfig.base`, but the targeted desktop test file still completed successfully.
- Blockers/remaining uncertainty: No live desktop repro was needed because this iteration only changed MCP argument sanitization for a traced tool call. I revalidated against the same Langfuse trace, but I did not broaden verification beyond the targeted desktop regression file because the change intentionally narrowed scope.

### 2026-03-11 - GitHub create_issue QA regression hardening
- Reviewed the ledger first and picked up the outstanding QA feedback instead of choosing a new trace.
- Re-inspected session `conv_1773175305930_77qxfmg2z` / trace `session_1773175401371_tauywx6ze` directly via the Langfuse public API and confirmed generation observations `ddc3cec8-c635-4d54-be54-b7363f92f3f1`, `3e02cfa6-5bf0-438f-8a2e-b80604c06bc3`, and `79dac91d-b9da-450e-89b8-2b74776a760d` each queued `github:create_issue` with `assignees: []`, `milestone: 0`, and `labels: []` before the repeated `Validation Failed` loop.
- Chosen follow-up: backfill immutable evidence provenance across the post-`3a7d0725...` review-stack commits and add a same-tool regression proving legitimate `github:create_issue` option values survive unchanged.

#### Evidence
- Evidence ID: `github-create-issue-milestone-placeholder`
- Scope: Close the remaining QA gaps on the traced GitHub issue-creation loop by recording immutable provenance through the current handoff commit and proving same-tool valid optional arguments are preserved.
- Commit range: `3a7d0725abbc295b376a4a668c79db14834416a3..23569b546f010f9753852c62146bfb04d24ffb8b`
- Rationale: Previous QA correctly noted that commits `4afaf4100a3e735531f0d83e5023e08552aa035b`, `e4f34223d4b92abafeb06c992e310ff48a32426e`, and `d29d5f50d23a5ce522eccd1acf4bfd80eb12b043` changed the ledger history without any Evidence block covering them, and that the narrowed sanitization claim lacked a same-tool regression. Backfilling provenance and adding the preserving-values regression closes both confidence gaps without broadening runtime behavior beyond what the trace supports.
- QA feedback: Addressed reviewer findings that (1) commits after `3a7d0725abbc295b376a4a668c79db14834416a3` lacked Evidence coverage and (2) the narrowed `github:create_issue` claim needed a same-tool regression proving positive `milestone` / non-empty `assignees` / `labels` survive unchanged.
- Before evidence: Direct re-inspection of Langfuse trace `session_1773175401371_tauywx6ze` in session `conv_1773175305930_77qxfmg2z` showed generation observations `ddc3cec8-c635-4d54-be54-b7363f92f3f1`, `3e02cfa6-5bf0-438f-8a2e-b80604c06bc3`, and `79dac91d-b9da-450e-89b8-2b74776a760d` each queued `github:create_issue` with `assignees: []`, `milestone: 0`, and `labels: []` before repeated `Validation Failed` tool errors. The earlier regression suite only proved those placeholders were stripped and that unrelated tools kept empty optional values; it did not yet prove that valid `github:create_issue` optional values on the same tool were preserved.
- Change: Added a targeted regression in `apps/desktop/src/main/mcp-service.option-b.test.ts` asserting that `github:create_issue` still forwards legitimate optional values (`assignees: ["aj47"]`, `milestone: 12`, `labels: ["bug", "desktop"]`) unchanged. This handoff also backfills immutable evidence provenance for the post-`3a7d0725...` review-stack commits listed above plus handoff commit `23569b546f010f9753852c62146bfb04d24ffb8b`.
- After evidence: `apps/desktop/src/main/mcp-service.option-b.test.ts` now covers both sides of the trace-backed contract: placeholder `milestone: 0` / empty arrays are removed for `github:create_issue`, while a same-tool case verifies positive `milestone` and non-empty `assignees` / `labels` remain intact. That closes the remaining mismatch between the Langfuse evidence and the test coverage.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/mcp-service.option-b.test.ts` → passed (`8 tests`, exit 0). Vitest still emitted a pre-existing `apps/mobile/tsconfig.json` parse warning about resolving `expo/tsconfig.base`, but the targeted desktop regression file completed successfully.
- Blockers/remaining uncertainty: No live desktop repro was needed because this iteration only strengthened regression coverage around previously narrowed MCP argument sanitization. Full repo-wide type/config validation remains noisy in this worktree because of the pre-existing mobile `expo/tsconfig.base` resolution warning under the current local Node/tooling setup.

### 2026-03-11 - ACP trailing failure text after respond_to_user
- Reviewed `langfuse-bug-fix.md` first, confirmed no outstanding QA feedback file existed at `../aloops/.langfuse-bug-fix-loop.qa-feedback.txt`, and inspected recent Langfuse traces with warning/error signals.
- Chosen issue: session `conv_1773189947592_ng14sqy3e` / trace `session_1773189947593_ffkmg2v2t` failed the memory-hygiene loop despite completing the requested work and recording a valid `respond_to_user` payload.
- Langfuse observations showed the run loaded the `memory-hygiene` skill, listed memories, recovered from one failed `execute_command`, successfully appended the report, successfully called `respond_to_user`, then still ended with plain assistant text `I couldn't complete the request after multiple attempts...`.
- Reconstructed the same contradiction in the stored conversation file `~/Library/Application Support/app.dotagents/conversations/conv_1773189947592_ng14sqy3e.json`, which contained the successful `respond_to_user` tool call followed by the bogus trailing assistant failure message.

#### Evidence
- Evidence ID: `acp-respond-to-user-trailing-failure`
- Scope: Prevent ACP runs that already produced a valid current-prompt `respond_to_user` result from persisting contradictory trailing plain assistant fallback/failure text as the final conversation outcome.
- Commit range: `23569b546f010f9753852c62146bfb04d24ffb8b..bf4caed8b689e3984d22019495dbff58d874678b`
- Rationale: The traced memory-hygiene run achieved the user's intent in a single agent execution, but the app still persisted a later fallback failure string after `respond_to_user`. That contradiction makes a successful run appear failed in conversation history and can mislead the UI or downstream tracing/output selection.
- QA feedback: None (new iteration)
- Before evidence: Langfuse trace `session_1773189947593_ffkmg2v2t` in session `conv_1773189947592_ng14sqy3e` shows `load_skill_instructions`, `list_memories`, a warning `execute_command`, a successful retry `execute_command`, and a successful `respond_to_user` call with completion text. The same run still ended with trace output `I couldn't complete the request after multiple attempts...`. The persisted conversation file for that session likewise contained the successful `respond_to_user` tool call followed by the contradictory trailing assistant failure text.
- Change: Updated `apps/desktop/src/main/acp-main-agent.ts` so completion handling inspects only current-prompt `respond_to_user` calls, prunes trailing plain assistant text that appears after a successful current-prompt `respond_to_user`, and treats the run as complete when that user-facing response exists. Added a regression in `apps/desktop/src/main/acp-main-agent.test.ts` covering the exact traced sequence, including persistence.
- After evidence: The new ACP regression simulates a completed `respond_to_user` followed by trailing assistant fallback text and verifies the returned/final response remains the user-facing `respond_to_user` text, the completion is marked successful, and the contradictory assistant failure text is not present in persisted conversation history.
- Verification commands/run results: `pnpm --filter @dotagents/desktop exec vitest run src/main/acp-main-agent.test.ts` → passed (`10 tests`, exit 0). Vitest emitted pre-existing environment noise in this worktree: an unsupported Node engine warning for local Node `v25.2.1` and the existing `apps/mobile/tsconfig.json` parse warning for missing `expo/tsconfig.base`, but the targeted desktop ACP test file still completed successfully.
- Blockers/remaining uncertainty: I did not run a live Electron repro because the Langfuse trace plus persisted conversation file were enough to isolate the non-UI output-selection bug and the targeted ACP regression now covers the traced sequence. Remaining leads should focus on other traces where ACP emitted fallback/error text after a successful user-facing tool response, especially multi-tool skill runs that recover from an intermediate tool warning.

