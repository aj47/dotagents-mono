# GitHub issues then Langfuse

## GitHub Issues Worked

### Issue #185 — Codex ACP preset may be using the wrong launch command

- Open issue count at start of iteration: 27
- Status: Closed after local handoff commit and resolution comment
- Diagnosis: The desktop Codex preset was still configured around `codex-acp` plus a global npm install hint, while the current upstream adapter docs emphasize invoking Codex ACP via `npx @zed-industries/codex-acp` (or a release binary).
- Changes:
  - Switched the built-in Codex preset to `connectionCommand: "npx"` with `connectionArgs: "@zed-industries/codex-acp"`
  - Updated the setup guidance to show the `npx` flow and mention the release binary fallback
  - Preserved backward-compatible preset detection for already-saved agents that still use `codex-acp`
  - Updated the targeted ACP setup regression test to lock in the new preset values and legacy detection support
- Verification:
  - `node --test apps/desktop/tests/settings-agents-acp-setup.test.mjs` ✅ passed (3/3)
  - `pnpm --filter @dotagents/desktop typecheck:web` ⚠️ failed because workspace dependencies are not installed (`node_modules` missing; `@electron-toolkit/tsconfig/tsconfig.web.json` not found)
- Blockers/follow-ups:
  - Full desktop TypeScript/runtime validation is currently blocked by missing local dependencies in this worktree
  - Resolution comment: https://github.com/aj47/dotagents-mono/issues/185#issuecomment-4102386621

#### Evidence

- Evidence ID: codex-acp-preset-command
- Scope: GitHub issue #185 — desktop Codex ACP preset defaults and setup guidance
- Commit range: 4a3b9ccf43b0474209c53a53d1339ebe186c71ba..06aea347a02bd46c351eea58f5c406471f84cb73
- Rationale: Users configuring the built-in Codex agent preset were being pointed at a launch command/setup path that no longer matched the upstream adapter guidance, which risks failed verification and confusing setup instructions.
- QA feedback: None (new iteration)
- Before evidence: No tracked screenshot for this source-level settings fix. Before-state source evidence was the preset in `apps/desktop/src/renderer/src/pages/settings-agents.tsx` using `connectionCommand: "codex-acp"` and `installCommand: "npm install -g @zed-industries/codex-acp"`, which diverged from the documented `npx` invocation.
- Change: Updated the Codex preset to use `npx @zed-industries/codex-acp`, refreshed the setup/auth copy, kept legacy `codex-acp` profiles recognized as the Codex preset, and expanded the ACP setup regression test accordingly.
- After evidence: No tracked screenshot for this source-level settings fix. After-state source evidence is the same preset file now configuring `connectionCommand: "npx"`, `connectionArgs: "@zed-industries/codex-acp"`, plus backward-compatible Codex preset detection for legacy saved agents.
- Verification commands/run results: `node --test apps/desktop/tests/settings-agents-acp-setup.test.mjs` passed; `pnpm --filter @dotagents/desktop typecheck:web` failed with `TS6053` because `@electron-toolkit/tsconfig/tsconfig.web.json` is unavailable in this worktree and pnpm reported `node_modules` missing.
- Blockers/remaining uncertainty: No functional blocker for the preset change itself, but broader desktop validation remains limited until dependencies are installed in this worktree.

### Issue #192 — Repeat task creation should always write to ~/.agents/tasks

- Open issue count at start of iteration: 26
- Status: Closed after local handoff commit and resolution comment
- Diagnosis: The desktop/mobile save path already persists repeat tasks to the global layer via `loopService.saveLoop(...)`, but the bundled `.agents` config guidance and default system prompt did not explicitly tell agents that new repeat tasks belong in `~/.agents/tasks/` by default. That left room for agent-driven direct-file edits to create workspace-layer tasks by mistake, matching the issue report.
- Changes:
  - Updated the bundled `dotagents-config-admin` skill to state that new repeat tasks belong in `~/.agents/tasks/` by default and that `./.agents/tasks/` should only be used for intentional overrides
  - Updated the repeat-task recipe in that skill to point at `~/.agents/tasks/<id>/task.md` as the canonical path
  - Added matching default system-prompt guidance so agents doing direct `.agents` edits learn the same rule even before loading the skill
  - Expanded the bundled-skill and system-prompt regression tests to lock in the new repeat-task layer guidance
- Verification:
  - `git diff --check` ✅ passed
  - `node --test apps/desktop/tests/repeat-task-guidance.test.mjs` ✅ passed (1/1)
  - `pnpm --filter @dotagents/desktop test -- --run src/main/bundled-skills.test.ts src/main/system-prompts.test.ts` ⚠️ failed before running tests because this worktree has no `node_modules/`; the desktop `pretest` step invokes `pnpm -w run build:shared`, which then fails with `sh: tsup: command not found`
- Blockers/follow-ups:
  - Full automated test execution for this iteration is blocked until dependencies are installed in this worktree
  - Resolution comment: https://github.com/aj47/dotagents-mono/issues/192#issuecomment-4102400860

#### Evidence

- Evidence ID: repeat-task-global-default
- Scope: GitHub issue #192 — repeat task creation guidance should default to the global `~/.agents/tasks` layer
- Commit range: 06aea347a02bd46c351eea58f5c406471f84cb73..15deb5f45ff0483b7dae646b1b827914b37c9a61
- Rationale: The product already treats the global layer as the canonical home for repeat tasks, but agent-facing config guidance did not encode that rule. That mismatch allowed agent-driven file edits to create workspace-layer tasks unexpectedly, which can hide tasks behind override semantics and confuse users about where repeat tasks should live.
- QA feedback: Explicit deferral: the outstanding prior QA note targeted the previous #185 ledger commit-range field and was preserved as-is for this iteration; this evidence block covers new issue #192 work.
- Before evidence: No tracked screenshot for this source-level guidance fix. Before-state evidence was `apps/desktop/resources/bundled-skills/dotagents-config-admin/SKILL.md` and `apps/desktop/src/main/system-prompts-default.ts` describing layered `.agents` config in general but not stating that new repeat tasks should default to `~/.agents/tasks/`, which left agent-created tasks vulnerable to landing in `./.agents/tasks/` by mistake.
- Change: Added explicit repeat-task layer rules to the bundled config-admin skill and the default system prompt, and extended the corresponding regression tests so the canonical global-path guidance stays enforced.
- After evidence: No tracked screenshot for this source-level guidance fix. After-state evidence is the same skill/system-prompt sources now stating that new repeat tasks belong in `~/.agents/tasks/` by default and that `./.agents/tasks/` is only for intentional workspace overrides, plus test assertions locking in that wording.
- Verification commands/run results: `git diff --check` passed; `node --test apps/desktop/tests/repeat-task-guidance.test.mjs` passed (1/1) and asserts the repeat-task guidance strings in `apps/desktop/resources/bundled-skills/dotagents-config-admin/SKILL.md` plus `apps/desktop/src/main/system-prompts-default.ts`; `pnpm --filter @dotagents/desktop test -- --run src/main/bundled-skills.test.ts src/main/system-prompts.test.ts` failed during `build:shared` because `packages/shared` could not run `tsup` (`sh: tsup: command not found`) and pnpm reported `node_modules` missing at both repo root and `apps/desktop`.
- Blockers/remaining uncertainty: The functional fix is low-risk and localized to agent guidance plus tests, but the targeted Vitest run remains unexecuted in this worktree until dependencies are installed.

### Issue #191 — [Langfuse] Runaway agent session: $5.15 cost, 49-min polling loop (session_1774056666742_zgazn0hyh)

- Open issue count at start of iteration: 25
- Status: Closed after local handoff commit and resolution comment
- Diagnosis: Async delegated runs returned a generic “use `check_agent_status`” message, the router prompt told the orchestrator to monitor delegated progress, and `handleCheckAgentStatus` had no backoff or poll-limit logic. That left the orchestrator free to re-check delegated status every turn, matching the 49-minute Langfuse polling loop described in the issue.
- Changes:
  - Added explicit async delegation guidance telling the orchestrator to prefer `waitForResult: true` when it needs a delegated result in the same turn
  - Tracked repeated `check_agent_status` calls for active async runs, increased the recommended poll interval up to 60s, and suppressed further polling after 8 checks
  - Updated ACP router tool definitions and router/system prompt guidance to tell models not to poll delegated status in a tight loop
  - Added a focused source-level regression test covering the new polling guardrail wording and constants
- Verification:
  - `node --test apps/desktop/tests/delegation-polling-guardrails.test.mjs` ✅ passed (3/3)
  - `git diff --check` ✅ passed
  - `if [ -d node_modules ]; then pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit; else echo '__TS_SKIP__ node_modules missing'; fi` ⚠️ skipped full TypeScript validation because this worktree has no `node_modules/`
- Blockers/follow-ups:
  - Full desktop TypeScript/runtime validation remains limited until workspace dependencies are installed
  - Resolution comment: https://github.com/aj47/dotagents-mono/issues/191#issuecomment-4102439202

#### Evidence

- Evidence ID: delegated-agent-polling-guardrails
- Scope: GitHub issue #191 — prevent runaway `check_agent_status` loops for delegated async runs
- Commit range: 15deb5f45ff0483b7dae646b1b827914b37c9a61..dacea9bcd6f883a24754f61e7759ad3d15e9eddf
- Rationale: The Langfuse-backed issue documented a 49-minute, $5.15 session where the orchestrator repeatedly polled delegated status without meaningful progress. Adding actual backoff/suppression plus clearer `waitForResult` guidance reduces the risk of expensive runaway loops while preserving async delegation for legitimate background work.
- QA feedback: Addressed the outstanding reviewer findings from the prior stack by preparing a stable committed ledger update for #185/#192 and by replacing the earlier ad hoc #192 verification note with a checked-in `apps/desktop/tests/repeat-task-guidance.test.mjs` test in this iteration.
- Before evidence: No tracked screenshot for this source-level reliability fix. Before-state evidence was issue #191’s Langfuse trace plus the ACP delegation source: async delegation results in `apps/desktop/src/main/acp/acp-router-tools.ts` told the model to use `check_agent_status` but did not expose a poll interval, poll cap, or suppression path, and the ACP router guidance still encouraged progress monitoring without warning against tight loops.
- Change: Added async delegation result guidance to prefer `waitForResult: true` when immediate results are needed, implemented escalating poll intervals and polling suppression in `handleCheckAgentStatus`, updated ACP router/tool/system prompts to discourage tight loops, and added a focused source-level regression test for the new guardrails.
- After evidence: No tracked screenshot for this source-level reliability fix. After-state evidence is `apps/desktop/src/main/acp/acp-router-tools.ts` now returning recommended poll intervals plus polling suppression for repeated async status checks, `apps/desktop/src/main/acp/acp-router-tool-definitions.ts` and `apps/desktop/src/main/acp/acp-smart-router.ts` steering models toward `waitForResult`/sparse polling, and `apps/desktop/tests/delegation-polling-guardrails.test.mjs` passing against those guardrails.
- Verification commands/run results: `node --test apps/desktop/tests/delegation-polling-guardrails.test.mjs` passed (3/3); `git diff --check` passed; `if [ -d node_modules ]; then pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit; else echo '__TS_SKIP__ node_modules missing'; fi` returned `__TS_SKIP__ node_modules missing`, so full desktop typechecking could not run in this worktree.
- Blockers/remaining uncertainty: The new guardrails directly address the reported delegated polling loop, but a broader cost/duration circuit-breaker was intentionally left out of this narrow fix and could still be worth revisiting if future traces show runaway sessions through another path.

### Issue #195 — [Langfuse] Repeated claude-sonnet-4-6 credential cooldown errors causing failed retries and 10–25m sessions

- Open issue count at start of iteration: 25
- Status: Closed after local handoff commit and resolution comment
- Diagnosis: `apps/desktop/src/main/llm-fetch.ts` originally treated retryable/429 API errors as retryable even when the actual provider error said all credentials for the requested model were cooling down. That meant the app could keep re-entering the standard retry path against a model with no warm credentials, matching the Langfuse issue’s repeated long-running failure pattern. Later refactors extracted the cooldown/account-limit classification into `apps/desktop/src/main/llm-retry-policy.ts`, so the current fail-fast path is split across the classifier and `llm-fetch.ts`.
- Changes:
  - Added `isCredentialCooldownError(...)` to detect provider errors that explicitly report all credentials for a model are cooling down (now housed in `apps/desktop/src/main/llm-retry-policy.ts` after the later retry-policy extraction)
  - Marked those cooldown-exhaustion errors non-retryable even if the provider also reports `statusCode: 429` or `isRetryable: true`
  - Added a cooldown-specific warning/normalized error path so the failure now exits immediately with clearer guidance instead of burning more retries
  - Added a focused Vitest regression in `apps/desktop/src/main/llm-fetch.test.ts`
  - Added a runnable source-level Node regression in `apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` for this dependency-light worktree
- Verification:
  - `node --test apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` ✅ passes again after the QA remediation below updated it for the retry-policy extraction
  - `git diff --check` ✅ passed
  - `pnpm exec vitest run apps/desktop/src/main/llm-fetch.test.ts` ⚠️ failed because this worktree has no installed dependencies (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`)
- Blockers/follow-ups:
  - Full behavioral execution of the Vitest regression is blocked until workspace dependencies are installed
  - Resolution comment: https://github.com/aj47/dotagents-mono/issues/195#issuecomment-4102454362

#### Evidence

- Evidence ID: llm-fetch-cooldown-fail-fast
- Scope: GitHub issue #195 — fail fast when the requested model has no warm credentials instead of retrying cooldown exhaustion
- Commit range: ed69666a7440c808c3fa0cbf046e7d9554367094..ae2373b2a65124029d849806883f9e2ac44f8b30
- Rationale: Langfuse showed repeated 10–25 minute sessions where the same exhausted model kept getting retried after the provider had already reported that all credentials were cooling down. Failing fast on that concrete condition reduces wasted latency/cost and surfaces a more actionable error sooner.
- QA feedback: None (new iteration)
- Before evidence: No tracked screenshot for this source-level reliability fix. Before-state evidence was `apps/desktop/src/main/llm-fetch.ts` treating `429` / structured retryable API errors as retryable without a carve-out for provider messages like `All credentials for model claude-sonnet-4-6 are cooling down`, which matched issue #195’s repeated cooldown loops.
- Change: Added credential-cooldown detection in the retry classifier (now `apps/desktop/src/main/llm-retry-policy.ts` after later refactoring), short-circuited retries for that condition in `apps/desktop/src/main/llm-fetch.ts` with cooldown-specific diagnostics and a clearer normalized error, added a focused Vitest regression in `apps/desktop/src/main/llm-fetch.test.ts`, and kept a runnable source-level guardrail test in `apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs`.
- After evidence: No tracked screenshot for this source-level reliability fix. After-state evidence is `apps/desktop/src/main/llm-retry-policy.ts` now classifying cooldown exhaustion as `credential-cooldown`, while `apps/desktop/src/main/llm-fetch.ts` logs `Skipping retry because all credentials for the requested model are cooling down` and surfaces a fail-fast cooldown message, with matching assertions in both `apps/desktop/src/main/llm-fetch.test.ts` and `apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs`.
- Verification commands/run results: `node --test apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` passes again after the QA remediation below updated it for the retry-policy extraction; `git diff --check` passed; `pnpm exec vitest run apps/desktop/src/main/llm-fetch.test.ts` failed with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found`, confirming this worktree still lacks the dependencies needed for the full Vitest run.
- Blockers/remaining uncertainty: The fail-fast guard directly addresses the concrete cooldown-exhaustion pattern from issue #195, but broader model/provider failover is still a separate follow-up if future traces show users want automatic fallback instead of an immediate surfaced error.

### Issue #195 follow-up — QA remediation for cooldown guardrail sync after retry-policy extraction

- Open issue count at start of iteration: 16
- Status: Follow-up committed for QA remediation; issue #195 remains closed
- Diagnosis: The later issue #196 retry-policy extraction moved cooldown classification into `apps/desktop/src/main/llm-retry-policy.ts`, but the dependency-light guardrail test and the issue #195 ledger text still assumed the old `llm-fetch.ts`-only implementation. That made the exact documented verification command fail and left the ledger misleading at reviewed HEAD.
- Changes:
  - Updated `apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` so it now asserts the current split architecture: cooldown classification in `apps/desktop/src/main/llm-retry-policy.ts` and fail-fast handling in `apps/desktop/src/main/llm-fetch.ts`
  - Refreshed the existing issue #195 ledger entry so it points to `llm-retry-policy.ts` as the current home of the cooldown classifier instead of implying the logic still lives only inside `llm-fetch.ts`
- Verification:
  - `node --test apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` ✅ passed (2/2)
  - `node --experimental-strip-types --test apps/desktop/tests/llm-retry-policy.test.ts` ✅ passed (4/4)
  - `git diff --check` ✅ passed
- Blockers/follow-ups:
  - `pnpm exec vitest run apps/desktop/src/main/llm-fetch.test.ts` remains blocked by missing installed dependencies in this worktree (`Command "vitest" not found`)
  - Open GitHub issues still remain for later Phase 1 iterations; this pass was intentionally limited to clearing the outstanding QA regression on the current branch

#### Evidence

- Evidence ID: llm-fetch-cooldown-guardrail-sync
- Scope: QA remediation for GitHub issue #195 — keep the cooldown fail-fast guardrail test and ledger aligned with the extracted retry classifier
- Commit range: 39ebe79068574dc99c9d43a202a1581fec13a7d7..2f28fb53d2d17c0c41fdc4ef7d870c699fca2f78
- Rationale: The branch had an exact reviewer-reported regression: the documented dependency-light verification command no longer passed after cooldown classification moved into `llm-retry-policy.ts`, and the ledger still described the old code location. Realigning the guardrail test and notes restores trustworthy verification for the existing fail-fast fix.
- QA feedback: Addressed reviewer findings 1-2 from the 2026-03-20 QA pass on evidence ID `llm-fetch-cooldown-fail-fast`: the guardrail test was updated for `llm-retry-policy.ts`, and the ledger text now reflects the extracted classifier instead of claiming the cooldown detection still lives only in `llm-fetch.ts`.
- Before evidence: No tracked screenshot for this source-level QA remediation. Before-state evidence was the failing command `node --test apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs`, whose regex assertions still expected `isCredentialCooldownError(...)` to be declared directly in `apps/desktop/src/main/llm-fetch.ts`, plus the stale issue #195 ledger text describing that old layout.
- Change: Updated `apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` to assert cooldown classification in `apps/desktop/src/main/llm-retry-policy.ts` and the fail-fast branch in `apps/desktop/src/main/llm-fetch.ts`, and refreshed the issue #195 ledger entry to describe that split truthfully.
- After evidence: No tracked screenshot for this source-level QA remediation. After-state evidence is the same guardrail command passing against the current architecture and the issue #195 ledger entry now naming `apps/desktop/src/main/llm-retry-policy.ts` as the classifier home while preserving the `llm-fetch.ts` fail-fast behavior notes.
- Verification commands/run results: `node --test apps/desktop/tests/llm-fetch-cooldown-guardrails.test.mjs` passed (2/2); `node --experimental-strip-types --test apps/desktop/tests/llm-retry-policy.test.ts` passed (4/4); `git diff --check` passed.
- Blockers/remaining uncertainty: Full Vitest confirmation for `apps/desktop/src/main/llm-fetch.test.ts` is still blocked until workspace dependencies are installed, but the exact QA-reported command now passes again and the ledger is no longer stale about the retry-classifier location.

### Issue #196 — [Langfuse] Repeated Claude account rate-limit errors causing failed retries in Main Agent sessions

- Open issue count at start of iteration: 25
- Status: Closed after local handoff commit and resolution comment
- Diagnosis: `apps/desktop/src/main/llm-fetch.ts` treated generic `429` rate limits as indefinitely retryable even when the provider message explicitly said the request would exceed the account-level rate limit. That kept the request on the same retry path instead of surfacing a fail-fast error, matching the repeated Langfuse failures in issue #196.
- Changes:
  - Extracted pure retry classification into `apps/desktop/src/main/llm-retry-policy.ts` so retry decisions can be tested without installed workspace dependencies
  - Added `account-rate-limit` detection for provider messages like `This request would exceed your account's rate limit. Please try again later.`
  - Updated `withRetry(...)` in `apps/desktop/src/main/llm-fetch.ts` to fail fast on account-level rate-limit exhaustion with a targeted warning and clearer normalized error instead of re-entering the indefinite `429` retry path
  - Added a focused Vitest regression in `apps/desktop/src/main/llm-fetch.test.ts`
  - Added a runnable Node behavioral test in `apps/desktop/tests/llm-retry-policy.test.ts` covering credential cooldown, account-level rate limits, generic `429`, and empty-response paths
- Verification:
  - `node --experimental-strip-types --test apps/desktop/tests/llm-retry-policy.test.ts` ✅ passed (4/4)
  - `git diff --check` ✅ passed
  - `pnpm exec vitest run apps/desktop/src/main/llm-fetch.test.ts` ⚠️ failed because this worktree still has no installed dependencies (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`)
- Blockers/follow-ups:
  - Full Vitest execution for the touched `llm-fetch.test.ts` coverage remains blocked until dependencies are installed in this worktree
  - Broader model/provider fallback on account-level rate limits is still a separate follow-up if future traces show fail-fast is not sufficient
  - Resolution comment: https://github.com/aj47/dotagents-mono/issues/196#issuecomment-4102485718

#### Evidence

- Evidence ID: llm-fetch-account-rate-limit-fail-fast
- Scope: GitHub issue #196 — fail fast when the provider reports account-level rate-limit exhaustion instead of retrying the same exhausted request path
- Commit range: dda8adff05412617697262e477ed644f14084b14..7e08f2531124d0c39c61eb83b2770f18ccbec93e
- Rationale: Langfuse showed repeated Main Agent failures spending time and retries on requests that the provider had already rejected at the account level. Distinguishing account-level exhaustion from generic transient `429`s reduces wasted retries/cost and surfaces a more actionable failure immediately.
- QA feedback: Explicit deferral: prior unresolved QA findings on the #191/#195 stack remain open for a later iteration; this iteration focused on new issue #196, while also strengthening retry-policy behavior coverage beyond the earlier regex-only guardrail style.
- Before evidence: No tracked screenshot for this source-level reliability fix. Before-state evidence was `apps/desktop/src/main/llm-fetch.ts` treating account-exhaustion messages like `This request would exceed your account's rate limit. Please try again later.` the same as generic retryable `429`s, which kept the request on the indefinite rate-limit retry path.
- Change: Added pure retry classification in `apps/desktop/src/main/llm-retry-policy.ts`, taught it to recognize account-level rate-limit exhaustion separately from credential cooldown and generic `429`s, wired `apps/desktop/src/main/llm-fetch.ts` through that classifier, and added targeted coverage in both `apps/desktop/src/main/llm-fetch.test.ts` and `apps/desktop/tests/llm-retry-policy.test.ts`.
- After evidence: No tracked screenshot for this source-level reliability fix. After-state evidence is `apps/desktop/src/main/llm-fetch.ts` now logging `Skipping retry because the provider account is currently rate limited` and surfacing a fail-fast normalized error for account-level exhaustion, while `apps/desktop/tests/llm-retry-policy.test.ts` passes against the new retry classifier behavior for cooldown, account-limit, generic `429`, and empty-response cases.
- Verification commands/run results: `node --experimental-strip-types --test apps/desktop/tests/llm-retry-policy.test.ts` passed (4/4); `git diff --check` passed; `pnpm exec vitest run apps/desktop/src/main/llm-fetch.test.ts` failed with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found`, confirming this worktree still lacks the dependencies needed for the full Vitest run.
- Blockers/remaining uncertainty: The fail-fast guard directly addresses the concrete account-level exhaustion pattern from issue #196, but the repo still lacks installed dependencies for the full Vitest confirmation and the change intentionally stops short of automatic model/provider fallback.

### Issue #165 — [Langfuse] Agent uses stale repo path /Users/ajjoobandi/aj47/dotagents

- Open issue count at start of iteration: 24
- Status: Fixed locally; pending handoff commit and resolution comment
- Diagnosis: The active checked-in `.agents/agents.md` prompt still told the agent that AJ's current main project was `aj47/dotagents`, which is stale relative to this repo (`aj47/dotagents-mono`). That prompt text is a credible root cause for sessions drifting toward the old filesystem path noted in the Langfuse issue.
- Changes:
  - Updated `.agents/agents.md` to name `aj47/dotagents-mono` as the current main project
  - Added explicit guidance to trust the active workspace/repo path from the environment instead of assuming an old repo path
  - Added a focused dependency-light regression test in `apps/desktop/tests/repo-path-guidance.test.mjs`
- Verification:
  - `node --test apps/desktop/tests/repo-path-guidance.test.mjs` ✅ passed (1/1)
  - `git diff --check` ✅ passed
- Blockers/follow-ups:
  - Historical `.agents/.backups/agents.md.*.bak` snapshots still contain the old wording by design, but the active checked-in prompt no longer does and those backup files were not modified in this iteration

#### Evidence

- Evidence ID: repo-path-guidance
- Scope: GitHub issue #165 — remove stale repo-path guidance that could steer agents toward the old DotAgents location
- Commit range: 233a916e868c27e75dc6d6afb881c66f5b41a537..<pending>
- Rationale: Langfuse captured agent runs attempting commands in `/Users/ajjoobandi/aj47/dotagents`, which wastes iterations and risks follow-on failures. The checked-in agent guidance still named the old project slug, so updating that durable prompt reduces the chance of path drift in future sessions.
- QA feedback: None (new iteration)
- Before evidence: No tracked screenshot for this source-level prompt fix. Before-state evidence was `.agents/agents.md` stating `current main project is aj47/dotagents`, which is stale for this repo and plausibly explains the old-path behavior reported in issue #165.
- Change: Updated `.agents/agents.md` to point at `aj47/dotagents-mono`, added explicit instruction to trust the environment-provided workspace/repo path, and added `apps/desktop/tests/repo-path-guidance.test.mjs` to keep the checked-in prompt aligned.
- After evidence: No tracked screenshot for this source-level prompt fix. After-state evidence is `.agents/agents.md` now naming `aj47/dotagents-mono` and warning against assuming an old repo path, with `apps/desktop/tests/repo-path-guidance.test.mjs` passing against that guidance.
- Verification commands/run results: `node --test apps/desktop/tests/repo-path-guidance.test.mjs` passed (1/1); `git diff --check` passed.
- Blockers/remaining uncertainty: Backup snapshots under `.agents/.backups/` still preserve historical wording, but the active checked-in prompt used for current guidance is corrected and the backups were intentionally left untouched.

## Langfuse Traces Inspected

- None this iteration. Phase 1 remains active because open GitHub issues still exist.