# Bug Fix Loop Ledger

## Purpose

- Track bugs checked in this loop so the next pass does not repeat the same investigation without new evidence.
- Prefer one concrete, user-facing bug per iteration.

## Checked

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

## Not yet checked

- [ ] Desktop-specific renderer/main-process bug candidates for a future iteration.
- [ ] User-facing mobile flow bugs now that Expo Web can bundle again in this worktree.

## Reproduced

- [x] Mobile Expo Web failed to bundle in this worktree when dependencies were reused via symlinked `node_modules`; Metro threw SHA-1/watch errors for files outside the current monorepo root.
- [x] Mobile Expo Web `Scan QR Code` failed silently when browser camera permission was denied: clicking the button left the user on the same Connection screen with no scanner modal and no visible error.

## Fixed

- [x] `apps/mobile/metro.config.js` now adds realpaths for symlinked `node_modules` directories plus linked `@dotagents/*` workspace packages to Metro `watchFolders`, which lets Expo Web bundle in the symlinked-worktree setup used for this iteration.
- [x] `apps/mobile/src/screens/ConnectionSettingsScreen.tsx` now clears stale connection errors before QR attempts and shows a platform-aware inline error when camera permission is denied instead of failing silently on Expo Web.
- [x] QA round 1 remediation extracted the QR permission decision into a small pure helper, added executable denied-permission coverage under Vitest, and corrected the `mobile-web-qr-scanner` evidence provenance so this ledger matches the reviewed iteration.
- [x] QA round 2 remediation tightened `resolveQrScannerActivation()` to return only the permission error actually consumed by the screen, removing the unused `shouldShowScanner` plumbing while keeping the visible denied-permission recovery behavior unchanged.

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

## Blocked

- [ ] No remaining blocker for this iteration's selected Metro/worktree bug.
- [ ] No remaining blocker for this iteration's selected QR permission-handling bug.

## Still uncertain

- [ ] Whether the historical Expo Web `normalizeApiBaseUrl is not a function` failure is still reproducible once the current worktree uses a normal local install instead of the symlink workaround.
- [ ] Whether the historical React Native Web `Unexpected text node ... child of a <View>` warning still maps to a concrete, local user-facing bug.
- [ ] Whether end-to-end QR decoding works reliably on Expo Web with a real camera feed, not just modal open/close and permission handling.

## Candidate leads

- Mobile React Native Web warning about unexpected text nodes inside `<View>`.
- Mobile/runtime behavior around historical `normalizeApiBaseUrl is not a function` errors.
- Mobile Expo Web QR decoding with a real camera feed and real DotAgents QR payload once permission handling is no longer silent.

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
- Commit range: `f1a861ee6c96f07e8ac57f3ca38da5ea2db90196..HEAD`
- Rationale: `Scan QR Code` is a primary mobile onboarding path from the desktop app. On Expo Web, when the browser denied camera access, the button left users on the same Connection screen with no modal and no visible explanation, which looked like a dead action and blocked recovery even though the app knew scanning could not proceed.
- QA feedback: QA round 2 reported that this evidence block still stopped at `90a3722da13dd438c0c9ac9dfdeee8d75cd16595` even though the reviewed draft head was `7624c4092c6a2e5d012942507e7da96ceb81fcb4`, so the provenance no longer covered the helper extraction, executable Vitest coverage, package wiring, screenshot refresh, and screen refactor it described. The same review also called out dead helper plumbing: `resolveQrScannerActivation()` returned `shouldShowScanner`, but its only caller already treated the helper as a simple error-or-proceed gate and never read that extra field.
- Before evidence: Screenshot: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/bug-fix-loop/.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--before--connection-qr-scanner--20260310.png` (viewport `1440x900`, desktop Chrome automation). The captured state shows the unchanged Connection screen immediately after clicking `Scan QR Code` in a browser context where camera permission was denied; no scanner dialog, camera preview, or inline guidance appears, so the action looks broken and gives the user no recovery path. Supporting runtime evidence from the same repro showed `navigator.mediaDevices.getUserMedia({ video: true })` rejecting with `NotAllowedError: Permission denied`.
- Change: Kept the existing user-visible QR permission fix intact, updated this evidence chain so its provenance reaches the current draft head, and tightened `apps/mobile/src/screens/connection-settings-qr.ts` to return only the permission error string or `null` that `ConnectionSettingsScreen.tsx` actually consumes. The denied-permission regression test in `apps/mobile/src/screens/connection-settings-qr.test.ts` now asserts that narrower contract directly, while the existing `apps/mobile/tests/connection-settings-validation.test.js` source-level check still covers the inline error wiring on the screen.
- After evidence: Screenshot: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/bug-fix-loop/.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--after--connection-qr-scanner--qa-r2--20260310.png` (same Connection screen surface, denied-permission repro refreshed in Chrome automation for QA round 2). After clicking `Scan QR Code` with browser camera permission denied, the screen still renders the inline error `Camera access is required to scan a QR code. Allow camera access in your browser and try scanning again.` directly in the visible form flow, so the observable recovery behavior remains correct after removing the unused helper field.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/screens/connection-settings-qr.test.ts` ✅ (1 file / 3 tests passing, including denied and granted permission states against the narrowed helper contract); `node --test apps/mobile/tests/connection-settings-validation.test.js` ✅ (5 tests passing, including the QR inline-error wiring assertion); `git diff --check` ✅; live Expo Web denied-permission repro at `http://localhost:8110` ✅ still shows the inline QR camera-permission error and refreshed the QA-round screenshot at `.aloops-artifacts/bug-fix-loop/mobile-web-qr-scanner--after--connection-qr-scanner--qa-r2--20260310.png`.
- Blockers/remaining uncertainty: This QA round 2 pass revalidated only the denied-permission surface called out by the findings. I did not re-run the separate granted-permission scanner-modal path or end-to-end real-camera QR decoding because the remediation here intentionally stayed limited to provenance accuracy and removing unused helper plumbing.