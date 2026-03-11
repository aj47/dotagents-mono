# Bug Fix Loop Ledger

## Purpose

- Track bugs checked in this loop so the next pass does not repeat the same investigation without new evidence.
- Prefer one concrete, user-facing bug per iteration.

## Checked

- [x] Reviewed outstanding QA feedback from `/Users/ajjoobandi/Development/aloops/.bug-fix-loop.qa-feedback.txt` and explicitly deferred the unresolved `mobile-web-qr-scanner` screenshot viewport mismatch for this iteration.
- [x] Reviewed QA round 1 findings for `mobile-web-qr-scanner` evidence provenance and weak denied-permission regression coverage.
- [x] Reviewed QA round 1 findings for the Metro watch-folders remediation scope.
- [x] Reviewed QA round 2 finding for evidence provenance drift in `mobile-expo-symlink-watchfolders`.
- [x] Reviewed QA round 2 findings for `mobile-web-qr-scanner` evidence provenance drift and unused helper plumbing.
- [x] Reviewed `apps/desktop/DEBUGGING.md` for documented runtime workflows.
- [x] Reviewed prior loop ledgers and notes in `mobile-app-improvement.md` and `langfuse-bug-fix.md`.
- [x] Reviewed mobile connection/config code and shared base-URL normalization utilities.
- [x] Attempted the documented Expo Web workflow in this worktree and recorded the exact dependency/runtime failures.
- [x] Re-ran Expo Web after a minimal non-install dependency workaround plus `pnpm build:shared`.
- [x] Reviewed the current `ConnectionSettingsScreen.tsx` QR scanner flow and existing mobile connection tests for a concrete web repro path.
- [x] Live-checked Expo Web QR scanning in fresh browser contexts with denied and granted camera permission to separate the silent failure path from the working modal path.
- [x] Re-created the symlink-based mobile runtime workaround in this worktree and re-ran `pnpm --filter @dotagents/mobile web --port 8112` to look for a fresh concrete failure now that Metro watch folders are fixed.
- [x] Reviewed `apps/mobile/metro.config.js`, `packages/shared/package.json`, and the Metro regression tests after Expo Web failed resolving `@dotagents/shared` from the symlinked dependency tree.
- [x] Launched Expo Web on `http://localhost:8120`, reproduced the browser-history failure between `Settings` and `Connection`, and reviewed `apps/mobile/App.tsx` for the missing web linking config.

## Not yet checked

- [ ] Desktop-specific renderer/main-process bug candidates for a future iteration.
- [ ] User-facing mobile flow bugs now that Expo Web can bundle again in this worktree.

## Reproduced

- [x] Mobile Expo Web failed to bundle in this worktree when dependencies were reused via symlinked `node_modules`; Metro threw SHA-1/watch errors for files outside the current monorepo root.
- [x] Mobile Expo Web `Scan QR Code` failed silently when browser camera permission was denied: clicking the button left the user on the same Connection screen with no scanner modal and no visible error.
- [x] Mobile Expo Web failed again in the symlinked-worktree setup even after the watch-folder fix: Metro resolved `@dotagents/shared` through the sibling worktree's package link, logged repeated invalid `exports` warnings for the sibling `packages/shared/dist/index.mjs`, and then aborted with `Unable to resolve "@dotagents/shared" from "apps/mobile/src/store/config.ts"`.
- [x] Mobile Expo Web navigation from `Settings` to `Connection` changed the visible screen but left the browser URL at `/`, so browser Back did nothing and normal web history navigation was broken.

## Fixed

- [x] `apps/mobile/metro.config.js` now adds realpaths for symlinked `node_modules` directories plus linked `@dotagents/*` workspace packages to Metro `watchFolders`, which lets Expo Web bundle in the symlinked-worktree setup used for this iteration.
- [x] `apps/mobile/src/screens/ConnectionSettingsScreen.tsx` now clears stale connection errors before QR attempts and shows a platform-aware inline error when camera permission is denied instead of failing silently on Expo Web.
- [x] QA round 1 remediation extracted the QR permission decision into a small pure helper, added executable denied-permission coverage under Vitest, and corrected the `mobile-web-qr-scanner` evidence provenance so this ledger matches the reviewed iteration.
- [x] QA round 2 remediation tightened `resolveQrScannerActivation()` to return only the permission error actually consumed by the screen, removing the unused `shouldShowScanner` plumbing while keeping the visible denied-permission recovery behavior unchanged.
- [x] `apps/mobile/metro.config.js` now pins `@dotagents/*` workspace packages to the current worktree through `resolver.extraNodeModules`, so symlinked `node_modules` trees no longer send Expo Web to a sibling worktree's stale `@dotagents/shared` package when bundling the mobile app.
- [x] `apps/mobile/App.tsx` now passes a web-only React Navigation linking config built in `apps/mobile/src/navigation/navigationLinking.ts`, so Expo Web writes stable screen paths like `/connection` into browser history and the browser Back button can return from `Connection` to `Settings`.

## Verified

- [x] `node --test apps/mobile/tests/metro-config-watchfolders.test.js`
- [x] Re-ran the targeted Metro watch-folder regression test after QA feedback and it now loads `metro.config.js` plus a symlink fixture instead of regex-checking source text.
- [x] `pnpm --filter @dotagents/mobile test`
- [x] `git diff --check`
- [x] `pnpm --filter @dotagents/mobile web --port 8103` now reaches `Web Bundled ... apps/mobile/index.ts` instead of the earlier Metro SHA-1 failure.
- [x] `node --test apps/mobile/tests/connection-settings-validation.test.js apps/mobile/tests/connection-settings-density.test.js`
- [x] Live Expo Web repro on `http://localhost:8110` now shows an inline camera-permission error after `Scan QR Code` in a denied-permission browser context.
- [x] Live Expo Web regression check on `http://localhost:8110` still opens the scanner modal with an active camera preview when camera permission is granted.
- [x] `pnpm --filter @dotagents/mobile run test:vitest`
- [x] `node --test apps/mobile/tests/connection-settings-validation.test.js apps/mobile/tests/package-scripts.test.js`
- [x] Refreshed the denied-permission QR screenshot on `http://localhost:8110` at `.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--after--connection-qr-scanner--qa-r1--20260310.png`.
- [x] `pnpm --filter @dotagents/mobile exec vitest run src/screens/connection-settings-qr.test.ts`
- [x] `node --test apps/mobile/tests/connection-settings-validation.test.js`
- [x] Refreshed the denied-permission QR screenshot on `http://localhost:8110` at `.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--after--connection-qr-scanner--qa-r2--20260310.png`.
- [x] `pnpm build:shared`
- [x] Re-ran `node --test apps/mobile/tests/metro-config-watchfolders.test.js` after pinning workspace packages to the current worktree and confirmed the new resolver mapping coverage passes.
- [x] `pnpm --filter @dotagents/mobile web --port 8112` now reaches `Web Bundled ... apps/mobile/index.ts` with `LOG  [web] Logs will appear in the browser console` instead of failing to resolve `@dotagents/shared`.
- [x] `pnpm --filter @dotagents/mobile exec vitest run src/navigation/navigationLinking.test.ts`
- [x] `pnpm --filter @dotagents/mobile test`
- [x] `git diff --check`
- [x] `pnpm --filter @dotagents/mobile exec tsc --noEmit` still reports unrelated pre-existing `src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors, but the temporary new `App.tsx` linking type error introduced during this iteration was removed before the final verification run.
- [x] Live Expo Web regression check on `http://localhost:8120` now changes the browser path from `/` to `/connection` on `Connection settings`, and browser Back returns the app to `Settings` at `/`.

## Blocked

- [ ] No remaining blocker for this iteration's selected Metro/worktree bug.
- [ ] No remaining blocker for this iteration's selected QR permission-handling bug.
- [ ] No remaining blocker for this iteration's selected workspace-package resolution bug.
- [ ] No remaining blocker for this iteration's selected Expo Web browser-history bug.

## Still uncertain

- [ ] Whether the historical Expo Web `normalizeApiBaseUrl is not a function` failure is still reproducible once the current worktree uses a normal local install instead of the symlink workaround.
- [ ] Whether the historical React Native Web `Unexpected text node ... child of a <View>` warning still maps to a concrete, local user-facing bug.
- [ ] Whether end-to-end QR decoding works reliably on Expo Web with a real camera feed, not just modal open/close and permission handling.
- [ ] Whether Expo Web now surfaces any remaining in-app runtime warnings or user-facing mobile flow regressions once the current symlinked worktree can bundle again.
- [ ] Whether deeper Expo Web deep-link/refresh cases for edit/detail screens with route params need richer route serialization beyond the fixed `Settings` ↔ `Connection` browser-history path.

## Candidate leads

- Mobile React Native Web warning about unexpected text nodes inside `<View>`.
- Mobile/runtime behavior around historical `normalizeApiBaseUrl is not a function` errors.
- Mobile Expo Web QR decoding with a real camera feed and real DotAgents QR payload once permission handling is no longer silent.
- Mobile flow/runtime bugs that can now be inspected live again because the symlinked-worktree Expo Web bundle no longer dies resolving `@dotagents/shared`.

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

### Evidence ID: mobile-web-qr-scanner

- Scope: `apps/mobile/src/screens/ConnectionSettingsScreen.tsx` Expo Web QR scan action when browser camera permission is denied
- Commit range: `f1a861ee6c96f07e8ac57f3ca38da5ea2db90196..3a3952feb660032537330ed8255e5f0945b2b4ac`
- Rationale: `Scan QR Code` is a primary mobile onboarding path from the desktop app. On Expo Web, when the browser denied camera access, the button left users on the same Connection screen with no modal and no visible explanation, which looked like a dead action and blocked recovery even though the app knew scanning could not proceed.
- QA feedback: QA round 2 reported that this evidence block still stopped at `90a3722da13dd438c0c9ac9dfdeee8d75cd16595` even though the reviewed draft head was `7624c4092c6a2e5d012942507e7da96ceb81fcb4`, so the provenance no longer covered the helper extraction, executable Vitest coverage, package wiring, screenshot refresh, and screen refactor it described. The same review also called out dead helper plumbing: `resolveQrScannerActivation()` returned `shouldShowScanner`, but its only caller already treated the helper as a simple error-or-proceed gate and never read that extra field.
- Before evidence: Screenshot: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/bug-fix-loop/.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--before--connection-qr-scanner--20260310.png` (viewport `1440x900`, desktop Chrome automation). The captured state shows the unchanged Connection screen immediately after clicking `Scan QR Code` in a browser context where camera permission was denied; no scanner dialog, camera preview, or inline guidance appears, so the action looks broken and gives the user no recovery path. Supporting runtime evidence from the same repro showed `navigator.mediaDevices.getUserMedia({ video: true })` rejecting with `NotAllowedError: Permission denied`.
- Change: Kept the existing user-visible QR permission fix intact, updated this evidence chain so its provenance reaches the current draft head, and tightened `apps/mobile/src/screens/connection-settings-qr.ts` to return only the permission error string or `null` that `ConnectionSettingsScreen.tsx` actually consumes. The denied-permission regression test in `apps/mobile/src/screens/connection-settings-qr.test.ts` now asserts that narrower contract directly, while the existing `apps/mobile/tests/connection-settings-validation.test.js` source-level check still covers the inline error wiring on the screen.
- After evidence: Screenshot: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/bug-fix-loop/.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--after--connection-qr-scanner--qa-r2--20260310.png` (same Connection screen surface, denied-permission repro refreshed in Chrome automation for QA round 2). After clicking `Scan QR Code` with browser camera permission denied, the screen still renders the inline error `Camera access is required to scan a QR code. Allow camera access in your browser and try scanning again.` directly in the visible form flow, so the observable recovery behavior remains correct after removing the unused helper field.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/screens/connection-settings-qr.test.ts` ✅ (1 file / 3 tests passing, including denied and granted permission states against the narrowed helper contract); `node --test apps/mobile/tests/connection-settings-validation.test.js` ✅ (5 tests passing, including the QR inline-error wiring assertion); `git diff --check` ✅; live Expo Web denied-permission repro at `http://localhost:8110` ✅ still shows the inline QR camera-permission error and refreshed the QA-round screenshot at `.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--after--connection-qr-scanner--qa-r2--20260310.png`.
- Blockers/remaining uncertainty: This QA round 2 pass revalidated only the denied-permission surface called out by the findings. I did not re-run the separate granted-permission scanner-modal path or end-to-end real-camera QR decoding because the remediation here intentionally stayed limited to provenance accuracy and removing unused helper plumbing.

### Evidence ID: mobile-symlinked-shared-resolution

- Scope: `apps/mobile/metro.config.js` Expo Web bundling in a symlinked-worktree setup where `apps/mobile/node_modules` points at another checkout's dependency tree
- Commit range: `e46d01822ce065cf4b6b0ee3aa64f0078c0cd00e..e6f58ec20d21dcb0b7fda94d42dc5efab96ceda4`
- Rationale: The mobile bug-fix workflow depends on `pnpm --filter @dotagents/mobile web`, but in this worktree Expo Web still crashed before any user-flow debugging could happen. Even after the earlier watch-folder fix, Metro followed the symlinked `@dotagents/shared` package into a sibling worktree instead of the current checkout, hit a missing `dist/index.mjs` export there, and aborted the bundle. Pinning workspace packages to the current worktree restores the actual mobile runtime needed for further product-bug investigation.
- QA feedback: None (new iteration)
- Before evidence: Reproduced with the same minimal non-install workaround used earlier in this ledger: symlinked `node_modules` from a sibling worktree, `pnpm build:shared`, then `pnpm --filter @dotagents/mobile web --port 8112`. Before the fix, Expo logged repeated warnings that `apps/mobile/node_modules/@dotagents/shared` resolved to `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/packages/shared/dist/index.mjs` even though that file did not exist there, then failed with `Unable to resolve "@dotagents/shared" from "apps/mobile/src/store/config.ts"`.
- Change: Added a small Metro helper that discovers the current worktree's `@dotagents/*` packages under `apps/*` and `packages/*`, then feeds that map into `resolver.extraNodeModules` so workspace imports resolve to the current checkout instead of whichever sibling checkout a symlinked `node_modules` tree happens to reference. Extended `apps/mobile/tests/metro-config-watchfolders.test.js` to lock the `@dotagents/shared` mapping to `packages/shared` in the current worktree.
- After evidence: Re-running `pnpm --filter @dotagents/mobile web --port 8112` after restarting Metro now reaches `Web Bundled 888ms apps/mobile/index.ts (954 modules)` followed by `LOG  [web] Logs will appear in the browser console`. The prior `@dotagents/shared` resolution failure and sibling-package export warnings do not recur in the successful bundling run, and the new regression test confirms the resolver mapping points at the current worktree's `packages/shared` path.
- Verification commands/run results: `pnpm build:shared` ✅; `node --test apps/mobile/tests/metro-config-watchfolders.test.js` ✅ (3 tests passing, including the new workspace-package pinning assertion); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8112` ✅ (`Waiting on http://localhost:8112`, then `Web Bundled 888ms apps/mobile/index.ts (954 modules)` and `LOG  [web] Logs will appear in the browser console`).
- Blockers/remaining uncertainty: Verification intentionally stopped at the reproduced bundle failure that blocked further mobile debugging. I did not spend this iteration on a separate in-app mobile flow bug after the bundle recovered; the next pass can now use the restored Expo Web runtime to investigate the remaining user-facing candidates in this ledger.

### Evidence ID: mobile-web-browser-history

- Scope: `apps/mobile/App.tsx` Expo Web browser history between `Settings` and `Connection`
- Commit range: `8b60032cfe4786692221f4ff84b6078cd771b812..2645f2e4cd2c8220bfc6a9f158ccce8abbd5085e`
- Rationale: On Expo Web, tapping `Connection settings` visibly changed screens but did not update the browser URL or history. That broke normal browser Back navigation, made the web surface feel stuck on subpages, and left route state out of sync with the URL for a core settings flow.
- QA feedback: Deferred prior QA finding for `mobile-web-qr-scanner` screenshot viewport mismatch; this iteration intentionally addresses a new Expo Web navigation bug instead of reworking the earlier QR evidence pair.
- Before evidence: `docs/aloops-evidence/bug-fix-loop/mobile-web-browser-history--before--connection-screen--20260311.png` (viewport `1440x900`, desktop browser). The screenshot shows the Connection screen immediately after tapping `Connection settings`; browser automation confirmed the URL still remained `/`, so the visible route changed without adding a browser history entry and the browser Back button could not return to `Settings`.
- Change: Added `apps/mobile/src/navigation/navigationLinking.ts` with stable screen-to-path mappings, wired `apps/mobile/App.tsx` to pass that config into `NavigationContainer` on web, and added `apps/mobile/src/navigation/navigationLinking.test.ts` plus the mobile Vitest script entry to keep the mapping covered.
- After evidence: `docs/aloops-evidence/bug-fix-loop/mobile-web-browser-history--after--connection-screen--20260311.png` (same `1440x900` viewport and same Connection screen surface). After the fix, browser automation shows the app now navigates to `/connection` when the Connection screen opens, giving the browser a real history entry so pressing browser Back returns the app to `Settings` at `/`.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/navigation/navigationLinking.test.ts` ✅ (2 tests passing for the web path mapping helper); `pnpm --filter @dotagents/mobile test` ✅ (mobile node + Vitest suites passing after adding the new regression file); `git diff --check` ✅; `pnpm --filter @dotagents/mobile exec tsc --noEmit` ⚠️ still reports unrelated pre-existing `src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors, but the earlier new `App.tsx` linking type error introduced during development no longer appears; live Expo Web validation at `http://localhost:8120` ✅ now changes `/` → `/connection` on click and browser Back returns to `/`.
- Blockers/remaining uncertainty: Verified the exact Settings→Connection browser-history regression at runtime. I did not expand this iteration into broader deep-link/refresh behavior for edit/detail screens that may need route params, so those wider Expo Web navigation cases remain unverified.