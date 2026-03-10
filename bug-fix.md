# Bug Fix Loop Ledger

## Purpose

- Track bugs checked in this loop so the next pass does not repeat the same investigation without new evidence.
- Prefer one concrete, user-facing bug per iteration.

## Checked

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
- Commit range: `bd56d13a07e1a6df5234fdc7d4451fec98974697..HEAD`
- Rationale: The repo's mobile debugging workflow depends on `pnpm --filter @dotagents/mobile web`, but this worktree could not even bundle the app once dependencies were reused from a sibling checkout. Metro only watched the current monorepo root, so any symlink-resolved files under the sibling `node_modules` store or linked `@dotagents/shared` package failed SHA-1 lookup and blocked all further mobile runtime validation.
- QA feedback: None (new iteration)
- Before evidence: Reproduced with `pnpm --filter @dotagents/mobile web --port 8103` after wiring temporary symlinked dependencies and building `packages/shared`. Before the fix, Metro failed with `Failed to get the SHA-1 for: .../mobile-app-improvement-loop/node_modules/.pnpm/.../expo-status-bar/src/StatusBar.ts`, and after the first partial watch-folder fix it still failed on `.../mobile-app-improvement-loop/packages/shared/dist/index.js`. Those logs directly confirmed that symlink-resolved dependency and workspace-package realpaths were outside Metro's watch set.
- Change: Updated `apps/mobile/metro.config.js` to centralize `nodeModulesPaths`, add a `collectWatchFolders(...)` helper that includes each existing node_modules path and its realpath, and add `addWorkspacePackageWatchFolders(...)` so linked `@dotagents/*` workspace package realpaths are also watched. Added `apps/mobile/tests/metro-config-watchfolders.test.js` to lock the new watch-folder logic into source-backed regression coverage.
- After evidence: Re-running `pnpm --filter @dotagents/mobile web --port 8103` after restarting Metro now reaches `Web Bundled 780ms apps/mobile/index.ts (958 modules)` and logs `LOG  [web] Logs will appear in the browser console` instead of failing on SHA-1 lookup errors. This is the observable improvement needed to unblock further live mobile bug investigation in this worktree.
- Verification commands/run results: `node --test apps/mobile/tests/metro-config-watchfolders.test.js` ✅; `pnpm --filter @dotagents/mobile test` ✅ (65 node tests + 50 vitest tests passing); `git diff --check` ✅; `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8103` ✅ bundling succeeds after restart (remaining output only shows non-blocking version/engine warnings).
- Blockers/remaining uncertainty: Verification used temporary ignored symlinks to sibling `node_modules` because this worktree still lacks a normal local install. The selected bug is fixed for the reproduced symlinked-worktree scenario, but I have not yet spent this iteration on a separate user-facing mobile flow bug now that Expo Web is unblocked.