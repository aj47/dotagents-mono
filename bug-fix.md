# Bug Fix Loop Ledger

## Purpose

- Track bugs checked in this loop so the next pass does not repeat the same investigation without new evidence.
- Prefer one concrete, user-facing bug per iteration.

## Checked

- [x] Reviewed QA round 1 findings for the Metro watch-folders remediation scope.
- [x] Reviewed QA round 2 finding for evidence provenance drift in `mobile-expo-symlink-watchfolders`.
- [x] Reviewed `apps/desktop/DEBUGGING.md` for documented runtime workflows.
- [x] Reviewed prior loop ledgers and notes in `mobile-app-improvement.md` and `langfuse-bug-fix.md`.
- [x] Reviewed mobile connection/config code and shared base-URL normalization utilities.
- [x] Attempted the documented Expo Web workflow in this worktree and recorded the exact dependency/runtime failures.
- [x] Re-ran Expo Web after a minimal non-install dependency workaround plus `pnpm build:shared`.

## Not yet checked

- [ ] Desktop-specific renderer/main-process bug candidates for a future iteration.
- [ ] User-facing mobile flow bugs now that Expo Web can bundle again in this worktree.

## Reproduced

- [x] Mobile Expo Web failed to bundle in this worktree when dependencies were reused via symlinked `node_modules`; Metro threw SHA-1/watch errors for files outside the current monorepo root.

## Fixed

- [x] `apps/mobile/metro.config.js` now adds realpaths for symlinked `node_modules` directories plus linked `@dotagents/*` workspace packages to Metro `watchFolders`, which lets Expo Web bundle in the symlinked-worktree setup used for this iteration.

## Verified

- [x] `node --test apps/mobile/tests/metro-config-watchfolders.test.js`
- [x] Re-ran the targeted Metro watch-folder regression test after QA feedback and it now loads `metro.config.js` plus a symlink fixture instead of regex-checking source text.
- [x] `pnpm --filter @dotagents/mobile test`
- [x] `git diff --check`
- [x] `pnpm --filter @dotagents/mobile web --port 8103` now reaches `Web Bundled ... apps/mobile/index.ts` instead of the earlier Metro SHA-1 failure.

## Blocked

- [ ] No remaining blocker for this iteration's selected Metro/worktree bug.

## Still uncertain

- [ ] Whether the historical Expo Web `normalizeApiBaseUrl is not a function` failure is still reproducible once the current worktree uses a normal local install instead of the symlink workaround.
- [ ] Whether the historical React Native Web `Unexpected text node ... child of a <View>` warning still maps to a concrete, local user-facing bug.
- [ ] Whether the `Scan QR Code` Expo Web flow still has a user-facing modal/camera problem now that bundling works again.

## Candidate leads

- Mobile Expo Web QR scanner flow not surfacing a usable scanner modal.
- Mobile React Native Web warning about unexpected text nodes inside `<View>`.
- Mobile/runtime behavior around historical `normalizeApiBaseUrl is not a function` errors.

## Evidence

### Evidence ID: mobile-expo-symlink-watchfolders

- Scope: `apps/mobile/metro.config.js` Expo Web bundling in a worktree that reuses dependencies through symlinked `node_modules`
- Commit range: `bd56d13a07e1a6df5234fdc7d4451fec98974697..2e83588112191103dde691452c893406aa662bf1`
- Rationale: The repo's mobile debugging workflow depends on `pnpm --filter @dotagents/mobile web`, but this worktree could not even bundle the app once dependencies were reused from a sibling checkout. Metro only watched the current monorepo root, so any symlink-resolved files under the sibling `node_modules` store or linked `@dotagents/shared` package failed SHA-1 lookup and blocked all further mobile runtime validation.
- QA feedback: QA round 2 found that this evidence block still had inconsistent provenance: its `Commit range` stopped at `17a06845755cb97039e228340bd124821ea9c3a9` even though the reviewed iteration is `bd56d13a07e1a6df5234fdc7d4451fec98974697..2e83588112191103dde691452c893406aa662bf1`, while the same block's `Change` and verification text already described the later test-hardening commit in that omitted tail.
- Before evidence: Reproduced with `pnpm --filter @dotagents/mobile web --port 8103` after wiring temporary symlinked dependencies and building `packages/shared`. Before the fix, Metro failed with `Failed to get the SHA-1 for: .../mobile-app-improvement-loop/node_modules/.pnpm/.../expo-status-bar/src/StatusBar.ts`, and after the first partial watch-folder fix it still failed on `.../mobile-app-improvement-loop/packages/shared/dist/index.js`. Those logs directly confirmed that symlink-resolved dependency and workspace-package realpaths were outside Metro's watch set.
- Change: Kept the Metro watch-folder fix intact, pinned the evidence range to the exact QA-reviewed commit span, exported small test-only helpers from `apps/mobile/metro.config.js`, and replaced the prior regex-only test with a Node test that loads the config, checks `config.watchFolders` against the configured `nodeModulesPaths`, and uses a temporary symlink fixture to assert that both a symlinked `node_modules` path and a linked `@dotagents/shared` package realpath are included in the computed watch folders.
- After evidence: The observable product evidence remains the same: rerunning `pnpm --filter @dotagents/mobile web --port 8103` after restarting Metro reaches `Web Bundled 780ms apps/mobile/index.ts (958 modules)` and logs `LOG  [web] Logs will appear in the browser console` instead of failing on SHA-1 lookup errors. In addition, the repo now has automated regression coverage that directly exercises the Metro watch-folder computation against a symlinked fixture rather than only regex-checking source text.
- Verification commands/run results: `node --test apps/mobile/tests/metro-config-watchfolders.test.js` ✅ (2 tests passing; confirms the loaded config computes `watchFolders` from `nodeModulesPaths` and includes realpaths for a symlinked `node_modules` tree plus linked `@dotagents/shared` package); `git diff --check` ✅; prior iteration evidence still stands for `pnpm build:shared` ✅ and `pnpm --filter @dotagents/mobile web --port 8103` ✅ bundling succeeds after restart.
- Blockers/remaining uncertainty: Verification used temporary ignored symlinks to sibling `node_modules` because this worktree still lacks a normal local install. The selected bug is fixed for the reproduced symlinked-worktree scenario, but I have not yet spent this iteration on a separate user-facing mobile flow bug now that Expo Web is unblocked.