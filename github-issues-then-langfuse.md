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

## Langfuse Traces Inspected

- None this iteration. Phase 1 remains active because open GitHub issues still exist.