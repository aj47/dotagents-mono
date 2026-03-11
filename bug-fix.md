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
- [x] Reviewed the unresolved QA findings for `mobile-web-browser-history`, especially the weak route-history regression coverage and the unverified param-heavy linking scope.
- [x] Directly confirmed via React Navigation's `getPathFromState()` / `getStateFromPath()` that `MemoryEdit` and `LoopEdit` generated polluted Expo Web URLs like `/memories/edit?memoryId=memory-123&memory=%5Bobject%20Object%5D` and `/loops/edit?loopId=loop-123&loop=%5Bobject%20Object%5D`.
- [x] Re-reviewed the unresolved `mobile-web-qr-scanner` evidence provenance finding and explicitly deferred it for this iteration in favor of a new runtime-confirmed chat-state bug.
- [x] Reproduced a new Expo Web chat-state bug at `http://localhost:8130`: reopening a failed thread from Sessions showed a stuck `Assistant is thinking` loader instead of the saved failure + retry state.
- [x] Reviewed `bug-fix.md` and confirmed `/Users/ajjoobandi/Development/aloops/.bug-fix-loop.qa-feedback.txt` does not exist for this iteration, so prior QA findings were not picked up here.
- [x] Launched Expo Web at `http://localhost:8140`, cleared persisted mobile app storage, and live-reproduced a new unconfigured-chat gating bug from the Sessions deep link path.
- [x] Reviewed `bug-fix.md` and the current outstanding QA feedback from `/Users/ajjoobandi/Development/aloops/.bug-fix-loop.qa-feedback.txt`, then explicitly deferred the unresolved `mobile-web-browser-history`, `mobile-web-qr-scanner`, and `mobile-chat-connection-gate` QA findings for this iteration.
- [x] Launched Expo Web at `http://localhost:8150/chat`, reproduced repeated `Unexpected text node: . A text node cannot be a child of a <View>.` console errors on the initial Chat screen render, and traced the component stack back to `ChatScreen`'s `debugInfo &&` conditional.

## Not yet checked

- [ ] Desktop-specific renderer/main-process bug candidates for a future iteration.
- [ ] Remaining user-facing mobile flow bugs now that Expo Web can bundle again in this worktree.

## Reproduced

- [x] Mobile Expo Web failed to bundle in this worktree when dependencies were reused via symlinked `node_modules`; Metro threw SHA-1/watch errors for files outside the current monorepo root.
- [x] Mobile Expo Web `Scan QR Code` failed silently when browser camera permission was denied: clicking the button left the user on the same Connection screen with no scanner modal and no visible error.
- [x] Mobile Expo Web failed again in the symlinked-worktree setup even after the watch-folder fix: Metro resolved `@dotagents/shared` through the sibling worktree's package link, logged repeated invalid `exports` warnings for the sibling `packages/shared/dist/index.mjs`, and then aborted with `Unable to resolve "@dotagents/shared" from "apps/mobile/src/store/config.ts"`.
- [x] Mobile Expo Web navigation from `Settings` to `Connection` changed the visible screen but left the browser URL at `/`, so browser Back did nothing and normal web history navigation was broken.
- [x] Mobile Expo Web edit routes for existing memories and loops serialized full route objects into the URL as `memory=%5Bobject%20Object%5D` / `loop=%5Bobject%20Object%5D`; on reload or deep-link parse those truthy strings prevented `MemoryEditScreen` and `LoopEditScreen` from falling back to the intended `memoryId` / `loopId` fetch path.
- [x] Mobile Expo Web reopened failed chats from Sessions with the stale persisted placeholder assistant message, so the thread showed an indefinite `Assistant is thinking` loader and hid the actual failure + retry UI after reopening.
- [x] Mobile Expo Web still allowed unconfigured users to deep-link into `/sessions`, start a first chat, and send a message, which surfaced a raw `401` / missing API key chat error instead of redirecting them back to `Connection Settings`.
- [x] Mobile Expo Web rendered the initial `/chat` screen with an empty-string child under a `ScrollView`, which emitted the React Native Web error `Unexpected text node: . A text node cannot be a child of a <View>.` three times on initial render even though the visible chat surface otherwise looked idle.

## Fixed

- [x] `apps/mobile/metro.config.js` now adds realpaths for symlinked `node_modules` directories plus linked `@dotagents/*` workspace packages to Metro `watchFolders`, which lets Expo Web bundle in the symlinked-worktree setup used for this iteration.
- [x] `apps/mobile/src/screens/ConnectionSettingsScreen.tsx` now clears stale connection errors before QR attempts and shows a platform-aware inline error when camera permission is denied instead of failing silently on Expo Web.
- [x] QA round 1 remediation extracted the QR permission decision into a small pure helper, added executable denied-permission coverage under Vitest, and corrected the `mobile-web-qr-scanner` evidence provenance so this ledger matches the reviewed iteration.
- [x] QA round 2 remediation tightened `resolveQrScannerActivation()` to return only the permission error actually consumed by the screen, removing the unused `shouldShowScanner` plumbing while keeping the visible denied-permission recovery behavior unchanged.
- [x] `apps/mobile/metro.config.js` now pins `@dotagents/*` workspace packages to the current worktree through `resolver.extraNodeModules`, so symlinked `node_modules` trees no longer send Expo Web to a sibling worktree's stale `@dotagents/shared` package when bundling the mobile app.
- [x] `apps/mobile/App.tsx` now passes a web-only React Navigation linking config built in `apps/mobile/src/navigation/navigationLinking.ts`, so Expo Web writes stable screen paths like `/connection` into browser history and the browser Back button can return from `Connection` to `Settings`.
- [x] `apps/mobile/src/screens/edit-route-params.ts` now strips non-serializable memory/loop objects from web edit navigation, while `MemoryEditScreen.tsx` and `LoopEditScreen.tsx` now ignore stale stringified route-object params and fall back to loading the selected record by ID.
- [x] `apps/mobile/src/screens/ChatScreen.tsx` now persists settled same-length chat-message updates after a request finishes, so reopening a failed thread restores the saved error + retry state instead of the earlier blank assistant placeholder loader.
- [x] `apps/mobile/src/store/config.ts`, `apps/mobile/src/screens/SessionListScreen.tsx`, and `apps/mobile/src/screens/ChatScreen.tsx` now share a missing-connection gate so unconfigured mobile users are redirected back to `Connection Settings` before Sessions/Chat can create or send a chat, including the Sessions Rapid Fire and queued-send entry points.
- [x] `apps/mobile/src/screens/ChatScreen.tsx` now uses `shouldRenderOptionalChild()` from `apps/mobile/src/screens/chat-render-guards.ts` before rendering optional blocks whose conditions may evaluate to an empty string, so Expo Web no longer mounts invalid raw text nodes under chat `View` / `ScrollView` containers during the initial `/chat` render.

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
- [x] `pnpm --filter @dotagents/mobile exec vitest run src/navigation/navigationLinking.test.ts` now exercises real React Navigation URL round-trips for `ConnectionSettings`, `AgentEdit`, `MemoryEdit`, and `LoopEdit`, including the web-only `memoryId` / `loopId` serialization fix.
- [x] `pnpm --filter @dotagents/mobile test`
- [x] `pnpm --filter @dotagents/mobile exec tsc --noEmit` still reports only the pre-existing `src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors; no new type errors from this edit-route-param fix remain.
- [x] `git diff --check`
- [x] `pnpm --filter @dotagents/mobile exec vitest run src/screens/chat-message-persistence.test.ts`
- [x] Live Expo Web repro at `http://localhost:8130` now reopens failed chats with the saved error + retry UI visible and without the stale `Assistant is thinking` loader.
- [x] `pnpm --filter @dotagents/mobile exec tsc --noEmit` still fails only on the pre-existing `apps/mobile/src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors; the new chat persistence helper and `ChatScreen` wiring did not introduce a new type error.
- [x] `git diff --check`
- [x] `pnpm --filter @dotagents/mobile exec node --test tests/chat-connection-gate.test.js`
- [x] `pnpm --filter @dotagents/mobile exec vitest run src/store/config.test.ts`
- [x] Live Expo Web repro at `http://localhost:8140/sessions` now alerts on missing connection setup and routes the same unconfigured first-chat attempt to `/connection` instead of showing the raw `401` chat error.
- [x] Curated matching before/after screenshots for the unconfigured first-chat attempt were saved under `docs/aloops-evidence/bug-fix-loop/` at the same `1280x800` browser viewport.
- [x] `pnpm --filter @dotagents/mobile exec vitest run src/screens/chat-render-guards.test.ts`
- [x] `pnpm --filter @dotagents/mobile test`
- [x] Live Expo Web repro at `http://localhost:8150/chat` now renders the same initial chat screen without any `Unexpected text node` console errors in a fresh `390x844` mobile browser context.
- [x] Curated matching before/after screenshots for the initial chat render were saved under `docs/aloops-evidence/bug-fix-loop/` at the same `390x844` viewport.

## Blocked

- [ ] No remaining blocker for this iteration's selected Metro/worktree bug.
- [ ] No remaining blocker for this iteration's selected QR permission-handling bug.
- [ ] No remaining blocker for this iteration's selected workspace-package resolution bug.
- [ ] No remaining blocker for this iteration's selected Expo Web browser-history bug.
- [ ] No remaining blocker for this iteration's selected Expo Web edit-route-param serialization bug.
- [ ] No remaining blocker for this iteration's selected Expo Web reopened-failed-chat persistence bug.
- [ ] No remaining blocker for this iteration's selected Expo Web unconfigured-chat gating bug.
- [ ] No remaining blocker for this iteration's selected Expo Web chat empty-string render warning bug.

## Still uncertain

- [ ] Whether the historical Expo Web `normalizeApiBaseUrl is not a function` failure is still reproducible once the current worktree uses a normal local install instead of the symlink workaround.
- [ ] Whether end-to-end QR decoding works reliably on Expo Web with a real camera feed, not just modal open/close and permission handling.
- [ ] Whether Expo Web now surfaces any remaining in-app runtime warnings or user-facing mobile flow regressions once the current symlinked worktree can bundle again.
- [ ] Whether deeper Expo Web deep-link/refresh cases for edit/detail screens with route params need richer route serialization beyond the fixed `Settings` ↔ `Connection` browser-history path.
- [ ] Whether live Expo Web refresh/back navigation for memory and loop edit screens behaves correctly against a configured remote settings backend; this iteration verified the exact serializer/parser bug and screen fallback logic without re-running a full remote-backed browser session.
- [ ] Whether reopened successful chats without a message-count change were also previously stale for the same persistence reason; this iteration fixed the shared settled-message persistence path and verified the failure-state repro specifically.

## Candidate leads

- Remaining Expo Web runtime warnings such as the web-only `expo-notifications` listener limitation plus React Native Web `pointerEvents` / `shadow*` deprecation warnings.
- Mobile/runtime behavior around historical `normalizeApiBaseUrl is not a function` errors.
- Mobile Expo Web QR decoding with a real camera feed and real DotAgents QR payload once permission handling is no longer silent.
- Mobile flow/runtime bugs that can now be inspected live again because the symlinked-worktree Expo Web bundle no longer dies resolving `@dotagents/shared`.
- Mobile chat/session state edge cases after reopen, retry, and offline failures now that the placeholder-persistence bug is fixed.

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
- Commit range: `8b60032cfe4786692221f4ff84b6078cd771b812..8e3d964030b9d4983cbb2ad0067b48f34af3fd47`
- Rationale: On Expo Web, tapping `Connection settings` visibly changed screens but did not update the browser URL or history. That broke normal browser Back navigation, made the web surface feel stuck on subpages, and left route state out of sync with the URL for a core settings flow.
- QA feedback: Deferred prior QA finding for `mobile-web-qr-scanner` screenshot viewport mismatch; this iteration intentionally addresses a new Expo Web navigation bug instead of reworking the earlier QR evidence pair.
- Before evidence: `docs/aloops-evidence/bug-fix-loop/mobile-web-browser-history--before--connection-screen--20260311.png` (viewport `1440x900`, desktop browser). The screenshot shows the Connection screen immediately after tapping `Connection settings`; browser automation confirmed the URL still remained `/`, so the visible route changed without adding a browser history entry and the browser Back button could not return to `Settings`.
- Change: Added `apps/mobile/src/navigation/navigationLinking.ts` with stable screen-to-path mappings, wired `apps/mobile/App.tsx` to pass that config into `NavigationContainer` on web, and added `apps/mobile/src/navigation/navigationLinking.test.ts` plus the mobile Vitest script entry to keep the mapping covered.
- After evidence: `docs/aloops-evidence/bug-fix-loop/mobile-web-browser-history--after--connection-screen--20260311.png` (same `1440x900` viewport and same Connection screen surface). After the fix, browser automation shows the app now navigates to `/connection` when the Connection screen opens, giving the browser a real history entry so pressing browser Back returns the app to `Settings` at `/`.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/navigation/navigationLinking.test.ts` ✅ (2 tests passing for the web path mapping helper); `pnpm --filter @dotagents/mobile test` ✅ (mobile node + Vitest suites passing after adding the new regression file); `git diff --check` ✅; `pnpm --filter @dotagents/mobile exec tsc --noEmit` ⚠️ still reports unrelated pre-existing `src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors, but the earlier new `App.tsx` linking type error introduced during development no longer appears; live Expo Web validation at `http://localhost:8120` ✅ now changes `/` → `/connection` on click and browser Back returns to `/`.
- Blockers/remaining uncertainty: Verified the exact Settings→Connection browser-history regression at runtime. I did not expand this iteration into broader deep-link/refresh behavior for edit/detail screens that may need route params, so those wider Expo Web navigation cases remain unverified.

### Evidence ID: mobile-web-edit-route-params

- Scope: `apps/mobile/src/screens/SettingsScreen.tsx`, `apps/mobile/src/screens/MemoryEditScreen.tsx`, `apps/mobile/src/screens/LoopEditScreen.tsx`, and `apps/mobile/src/navigation/navigationLinking.test.ts` for Expo Web edit-route serialization
- Commit range: `2816ce82c61cffb208c34c9d8c02ab2d62dad298..8006876e7a0749a170ee7fd171577245de9e333a`
- Rationale: After the earlier browser-history fix, Expo Web started assigning URLs to deeper edit screens too. For existing memories and loops, those navigations included whole route objects, so React Navigation serialized them as `memory=%5Bobject%20Object%5D` / `loop=%5Bobject%20Object%5D`. A copied or refreshed URL could then restore a truthy string instead of a real object, causing the edit screens to skip their ID-based fetch path and risk loading the wrong state for a real user edit flow.
- QA feedback: Addresses the outstanding QA findings on `mobile-web-browser-history`: the prior regression coverage only checked object shapes instead of real URL round-trips, and it broadened web linking into param-heavy edit screens without verifying that those params serialized safely.
- Before evidence: No curated screenshot for this iteration because the runtime profile is `none` and the bug was directly confirmed through the actual React Navigation serializer/parser APIs. Running `node --input-type=module` against `@react-navigation/core` reproduced `/memories/edit?memoryId=memory-123&memory=%5Bobject%20Object%5D` and `/loops/edit?loopId=loop-123&loop=%5Bobject%20Object%5D`. Source inspection then showed `MemoryEditScreen.tsx` and `LoopEditScreen.tsx` treated any truthy `route.params.memory` / `route.params.loop` as a valid object, which would block the fallback fetch-by-ID path after a reload or pasted deep link.
- Change: Added `apps/mobile/src/screens/edit-route-params.ts` to build web-safe memory/loop edit params and to coerce route params back into trusted object-or-ID context. `SettingsScreen.tsx` now passes only `memoryId` / `loopId` on web, while `MemoryEditScreen.tsx` and `LoopEditScreen.tsx` ignore stale stringified object params and fall back to loading the selected record by ID. `navigationLinking.test.ts` now exercises real `getPathFromState()` / `getStateFromPath()` round-trips and asserts that the generated web edit URLs no longer contain `[object Object]`.
- After evidence: No screenshot for this runtime-free iteration. The targeted Vitest regression now proves the exact observable improvement: generated web edit URLs are `/memories/edit?memoryId=memory-123` and `/loops/edit?loopId=loop-123` with no serialized object payload, and stale parsed params like `memory: "[object Object]"` / `loop: "[object Object]"` are ignored so the screens recover via their ID-based load path instead of trusting broken route data.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/navigation/navigationLinking.test.ts` ✅ (7 tests passing, including React Navigation serializer/parser round-trips plus stale-param coercion checks); `pnpm --filter @dotagents/mobile test` ✅ (70 node tests + 62 Vitest assertions passing); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ⚠️ still reports only the pre-existing `src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors; `git diff --check` ✅.
- Blockers/remaining uncertainty: I did not re-run a full live Expo Web memory/loop edit session against a configured remote settings backend in this iteration, so the evidence here is serializer/parser-based rather than screenshot-based. The exact bug that was confirmed and fixed is the polluted edit URL + stale-route-param path, not broader end-to-end server-backed editing.

### Evidence ID: mobile-chat-failed-reopen-state

- Scope: `apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/screens/chat-message-persistence.ts`, and `apps/mobile/src/screens/chat-message-persistence.test.ts` for persisted chat state after reopening a failed Expo Web thread from Sessions
- Commit range: `6a051cb3b2f99b629abb31c1dc75f0de06144706..a8a6d9203fa22e3545e95b8d40cfd070ea32ab90`
- Rationale: When a mobile chat request failed, the screen replaced the in-memory assistant placeholder with the error text and retry banner, but the persistence effect only saved sessions when the message count changed. Reopening the same thread from Sessions therefore restored the older blank assistant placeholder instead of the real failure state, misleading users with an endless `Assistant is thinking` loader and hiding the retry affordance on a core chat flow.
- QA feedback: Deferred prior QA finding for `mobile-web-qr-scanner` evidence provenance; this iteration intentionally addressed a new runtime-confirmed chat-state bug instead.
- Before evidence: `docs/aloops-evidence/bug-fix-loop/mobile-chat-failed-reopen-state--before--reopened-chat--20260311.png` (viewport `1440x900`, Expo Web at `http://localhost:8130`). The screenshot shows the reopened failed thread after sending a message while disconnected, returning to Sessions, and reopening the same chat: the prior user message is visible, but the saved thread still shows `Assistant is thinking` with no visible error body, so the persisted state wrongly looks in-progress instead of failed.
- Change: Added a small chat-message persistence helper so `ChatScreen` now persists settled same-length message updates once a request finishes instead of only persisting length changes. That preserves the final error or final response that replaces the assistant placeholder without spamming storage writes during streaming, and the new Vitest file locks the exact decision logic for placeholder append vs. streaming token churn vs. settled error replacement.
- After evidence: `docs/aloops-evidence/bug-fix-loop/mobile-chat-failed-reopen-state--after--reopened-chat--20260311.png` (same `1440x900` viewport, same reopened chat surface on Expo Web). After the fix, reopening the failed thread shows the saved error text and retry UI while the stale `Assistant is thinking` loader is gone, so the persisted chat state now matches what the user actually saw before leaving the thread.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/screens/chat-message-persistence.test.ts` ✅ (3 tests passing for placeholder append, no-save during same-length streaming, and save-on-settled-error replacement); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ⚠️ still reports only the pre-existing `apps/mobile/src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` errors; `git diff --check` ✅; live Expo Web repro at `http://localhost:8130` ✅ now preserves the failed chat state on reopen and no longer shows the stale loader.
- Blockers/remaining uncertainty: The exact reproduced failure-state reopen path is fixed and live-verified. I did not spend this iteration on adjacent chat reopen cases like successful same-length completions or queued-message recovery, although the same persistence path now covers those settled same-length updates too.

### Evidence ID: mobile-chat-connection-gate

- Scope: `apps/mobile/src/store/config.ts`, `apps/mobile/src/screens/SessionListScreen.tsx`, `apps/mobile/src/screens/ChatScreen.tsx`, and `apps/mobile/tests/chat-connection-gate.test.js` for unconfigured Expo Web chat entry from the Sessions/Chat surfaces
- Commit range: `7ebb31a41aa9541acae40dc778d119c3e4dd4087..fd5476029c7dfa383db247e48bbb040f26048370`
- Rationale: The mobile onboarding flow already disabled `Go to Chats` from Settings when no API key was configured, but users could still deep-link into `/sessions`, tap `Start first chat`, and send a message. That exposed a raw OpenAI-compatible `401` missing-API-key error inside Chat instead of taking users back to the connection setup they actually needed, which is a broken first-run experience on a core product flow.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/bug-fix-loop/mobile-chat-connection-gate--before--unconfigured-chat-attempt--20260311.png` (viewport `1280x800`, desktop browser running Expo Web). After clearing persisted app storage to force an unconfigured state, navigating to `/sessions`, tapping `Start first chat`, typing `hello`, and sending, the app stayed on Chat and rendered a raw `Error: Chat failed: 401` response with the missing API key text plus `Retry`. That screenshot is insufficient because it proves the existing Settings gate was bypassable from deep-linkable chat surfaces and surfaced an internal auth failure instead of a recovery path.
- Change: Added a shared `hasConfiguredConnection()` helper plus stable missing-connection copy in `config.ts`, then used it to gate Sessions new-chat creation, pending stub auto-send, Rapid Fire background send initiation, Chat composer send, and queued-message processing. Unconfigured attempts now show the setup prompt and route back to `ConnectionSettings`, while the new targeted Node/Vitest coverage locks the guard wiring and helper semantics.
- After evidence: `docs/aloops-evidence/bug-fix-loop/mobile-chat-connection-gate--after--unconfigured-chat-attempt--20260311.png` (same `1280x800` viewport and same unconfigured first-chat attempt on Expo Web). After the fix, the same `/sessions` → `Start first chat` attempt shows the missing-connection prompt and lands on the `Connection` screen with `Not connected`, `API Key`, `Base URL`, and `Test & Save` visible, which demonstrates the user is redirected to the correct recovery flow before any raw chat request/error can occur.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec node --test tests/chat-connection-gate.test.js` ✅ (3 tests passing for Sessions gating, Rapid Fire missing-connection messaging, and Chat/queued-send guards); `pnpm --filter @dotagents/mobile exec vitest run src/store/config.test.ts` ✅ (6 tests passing, including the new trimmed-credential helper checks); live Expo Web repro at `http://localhost:8140/sessions` ✅ reproduced the broken raw-401 behavior before the fix and, after restoring the patch, reproduced the corrected alert + redirect to `/connection` in a fresh browser context with storage cleared; matching before/after screenshots saved under `docs/aloops-evidence/bug-fix-loop/` ✅.
- Blockers/remaining uncertainty: The exact reproduced Expo Web first-chat bypass is fixed and live-verified, and the same guard now covers queued-send plus Sessions Rapid Fire entry points in source/tests. I did not separately run native iOS/Android for this iteration, so the native alert presentation for the same guard remains source-verified rather than device-verified.

### Evidence ID: mobile-chat-empty-string-warning

- Scope: `apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/screens/chat-render-guards.ts`, and `apps/mobile/src/screens/chat-render-guards.test.ts` for the Expo Web `/chat` initial-render warning state
- Commit range: `fd5476029c7dfa383db247e48bbb040f26048370..8532df717564d4db6c0a8162b7b93d2efca6b1e8`
- Rationale: The chat screen appeared idle but still emitted repeated React Native Web errors on first render because an empty string was being returned as a direct child of a `ScrollView`. That polluted console-based debugging, signaled invalid render output in a core chat surface, and risked masking more important runtime errors during mobile-web investigation.
- QA feedback: Deferred prior QA findings for `mobile-web-browser-history`, `mobile-web-qr-scanner`, and `mobile-chat-connection-gate` to keep this iteration tightly focused on a newly reproduced runtime-confirmed `ChatScreen` render warning.
- Before evidence: `docs/aloops-evidence/bug-fix-loop/mobile-chat-empty-string-warning--before--chat-screen--20260311.png` (viewport `390x844`, mobile browser). The screenshot shows the default chat surface on initial load; in that same run the browser console emitted `Unexpected text node: . A text node cannot be a child of a <View>.` three times from `ChatScreen`, so even this apparently idle first-render state was mounting an invalid raw text node and generating noisy runtime errors.
- Change: Added a tiny `shouldRenderOptionalChild()` helper that converts empty or whitespace-only strings into a strict boolean `false` before JSX short-circuit rendering. `ChatScreen.tsx` now uses that helper for `debugInfo` plus adjacent optional child blocks that may be backed by strings or string-like values, and a focused Vitest file locks the helper behavior for empty, whitespace-only, visible, and truthy non-string values.
- After evidence: `docs/aloops-evidence/bug-fix-loop/mobile-chat-empty-string-warning--after--chat-screen--20260311.png` (same `390x844` viewport and same initial `/chat` surface). After restoring the fix, the chat screen still renders normally but the matched fresh-browser run emits zero `Unexpected text node` console errors, showing the invalid child is gone without changing the visible layout.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/screens/chat-render-guards.test.ts` ✅ (2 tests passing for empty/whitespace string suppression and truthy-value rendering); `pnpm --filter @dotagents/mobile test` ✅ (73 Node tests + 70 Vitest assertions passing after adding the new helper coverage); `git diff --check` ✅ before the product-change commit; live Expo Web repro at `http://localhost:8150/chat` ✅ showed `Unexpected text node` count `3` before the one-line guard revert and `0` after restoring the fix in fresh `390x844` browser contexts.
- Blockers/remaining uncertainty: This iteration fixed the confirmed empty-string child warning on the default Expo Web chat render and hardened the adjacent optional-block guard sites in `ChatScreen`. Other unrelated Expo Web warnings still appear (`expo-notifications` web-listener limitation, `pointerEvents` deprecation, and `shadow*` deprecation), but they were not the selected bug for this pass.