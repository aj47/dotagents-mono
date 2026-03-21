# GitHub issues then Langfuse

## GitHub Issues Worked

### Issue #185 — Codex ACP preset may be using the wrong launch command

- Open issue count at start of iteration: 27
- Status: Fixed locally; ready for branch sync
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
  - Issue not closed yet in this ledger entry until the handoff commit exists

#### Evidence

- Evidence ID: codex-acp-preset-command
- Scope: GitHub issue #185 — desktop Codex ACP preset defaults and setup guidance
- Commit range: TBD
- Rationale: Users configuring the built-in Codex agent preset were being pointed at a launch command/setup path that no longer matched the upstream adapter guidance, which risks failed verification and confusing setup instructions.
- QA feedback: None (new iteration)
- Before evidence: No tracked screenshot for this source-level settings fix. Before-state source evidence was the preset in `apps/desktop/src/renderer/src/pages/settings-agents.tsx` using `connectionCommand: "codex-acp"` and `installCommand: "npm install -g @zed-industries/codex-acp"`, which diverged from the documented `npx` invocation.
- Change: Updated the Codex preset to use `npx @zed-industries/codex-acp`, refreshed the setup/auth copy, kept legacy `codex-acp` profiles recognized as the Codex preset, and expanded the ACP setup regression test accordingly.
- After evidence: No tracked screenshot for this source-level settings fix. After-state source evidence is the same preset file now configuring `connectionCommand: "npx"`, `connectionArgs: "@zed-industries/codex-acp"`, plus backward-compatible Codex preset detection for legacy saved agents.
- Verification commands/run results: `node --test apps/desktop/tests/settings-agents-acp-setup.test.mjs` passed; `pnpm --filter @dotagents/desktop typecheck:web` failed with `TS6053` because `@electron-toolkit/tsconfig/tsconfig.web.json` is unavailable in this worktree and pnpm reported `node_modules` missing.
- Blockers/remaining uncertainty: No functional blocker for the preset change itself, but broader desktop validation remains limited until dependencies are installed in this worktree.

## Langfuse Traces Inspected

- None this iteration. Phase 1 remains active because open GitHub issues still exist.