# Mobile App Improvement Ledger

## Purpose

- Track mobile investigations, fixes, regressions, and next checks.
- Prefer one small, shippable improvement per iteration.
- Use Expo Web when practical for repeatable inspection.

## Settings parity checklist vs desktop

- [x] Mobile `Desktop Settings -> Profile & Model` exposes remote profile switching plus provider/model controls that map to the desktop settings model/config surfaces.
- [x] Mobile `Desktop Settings -> Skills`, `MCP Servers`, `Memories`, `Agents`, and `Agent Loops` expose the main remote-management surfaces that desktop users can inspect and change.
- [x] Mobile chat header agent switching now matches the desktop selector expectation in API mode by listing enabled agent profiles instead of only legacy user profiles.
- [ ] Desktop host-only `General` settings (`Launch at Login`, `Hide Dock Icon`, app hotkeys, `.agents` folder paths) are still not configurable from mobile. Rationale: they change desktop-host behavior rather than mobile runtime behavior. Next step: decide whether mobile should remotely edit those host settings or explicitly document them as desktop-only.
- [ ] Desktop `Remote Server` setup/parity is still only partially checked from mobile. `Connection` covers entering a known base URL and API key, but mobile has not yet been validated against the desktop remote-server enable/pairing workflow end-to-end.

## Coverage Map

### Checked screens/flows

- [x] Settings root screen and nested back navigation
- [x] Connection setup flow, save validation, and inline connection actions
- [x] Sessions list entry points, top actions, and empty state
- [x] Chat thread composer controls, voice/listening announcements, and disclosure states
- [x] Settings -> Agent Loops list row actions (source-backed in this worktree)
- [x] Loop create/edit screen agent-profile selection section (source-backed in this worktree)
- [x] Agent create/edit screen (`AgentEdit`) connection-type selection and mode-specific fields (source-backed in this worktree)
- [x] Memory create/edit screen (`MemoryEdit`) importance selection section (source-backed in this worktree)
- [x] Settings desktop partial-load warning / retry state (source-backed in this worktree)
- [x] Chat header agent selector sheet in API mode on a narrow Expo Web viewport
- [x] Settings local text-to-speech voice picker sheet in Expo Web on a narrow viewport
- [x] Settings desktop `Profile & Model -> Select Model` picker sheet in Expo Web on a narrow viewport

### Not yet checked

- [ ] Memory create/edit loading, error, and runtime layout states beyond the importance selector
- [ ] Agent create/edit remaining fields and built-in-agent limited-edit state outside the connection-type section
- [ ] Loop create/edit live save flow, runtime layout, and remaining fields
- [ ] Session loading, error, reconnect, and sync states
- [ ] Modal/sheet surfaces beyond the checked chat/local-TTS/model selectors on narrow web viewports (remote TTS voice picker, TTS model picker, endpoint picker, confirmations)
- [ ] Large-text / awkward viewport behavior across Settings, Sessions, Chat, and edit screens

### Reproduced

- [x] Missing in-place CTA on the session empty state
- [x] Undersized chat composer send/accessory controls and missing web state semantics
- [x] Weak Connection inline action affordances
- [x] Undersized Agent Loops `Run` / `Delete` actions in Settings source
- [x] LoopEdit profile selection chips crowd narrow screens and hide selected state behind color alone
- [x] AgentEdit connection-type chips crowd narrow screens, hide selected state behind color alone, and wrongly treat ACP like a remote URL mode
- [x] MemoryEdit importance chips crowd narrow screens and communicate priority mostly through color-only state
- [x] Settings desktop warning state squeezed long partial-load errors and a tiny text-only `Retry` action into one horizontal row
- [x] Chat header agent selector sheet said `No agents available` even though `Settings -> Agents` listed multiple enabled agents on the same connected server
- [x] Settings local TTS voice picker lost its viewport-anchored web sheet guardrails and left the `Close` action below the 44px minimum touch-target height
- [x] Settings desktop model picker modal exposed a `Close` action below the 44px minimum touch-target height on Expo Web

### Improved

- [x] Nested-screen back navigation
- [x] Connection first-run validation and inline action affordances
- [x] Chat composer actions, toggles, and voice-state accessibility
- [x] Session empty-state CTA and narrow-layout guardrails
- [x] Agent Loops row action clarity, touch targets, and destructive-action affordance
- [x] LoopEdit profile selection clarity, default-agent fallback copy, and touch targets
- [x] AgentEdit connection-type clarity, touch targets, and ACP/remote field mapping
- [x] MemoryEdit importance selection clarity, touch targets, and priority guidance
- [x] Settings desktop partial-load warning clarity, retry affordance, and stale-data explanation
- [x] Chat header agent selector parity with desktop agent profiles in API mode
- [x] Settings local TTS voice picker close affordance and viewport anchoring on Expo Web
- [x] Settings shared overlay close affordances for model/configuration modals on Expo Web

### Verified

- [x] Source-backed regression coverage for navigation, connection validation, chat composer accessibility, session empty state, agent loop row actions, LoopEdit profile selection, AgentEdit connection types, MemoryEdit importance selection, and the Settings desktop warning state
- [x] Live Expo Web verification that the chat header agent selector now lists enabled agents and updates the header label after selection
- [x] Live Expo Web verification that the local TTS voice picker now spans the viewport width and exposes a 44px-tall close action on a narrow screen
- [x] Live Expo Web verification that the `Profile & Model` model picker now exposes a 44px-tall `Close` action on a narrow screen

### Blocked

- [ ] No current blocking Expo Web runtime issue in this worktree after rebuilding `packages/shared`

### Still uncertain

- [ ] Runtime visual fit of earlier source-backed fixes that still have not had a dedicated live Expo Web pass in this worktree
- [ ] Narrow-screen usability of the rest of `MemoryEdit` and the remaining `AgentEdit` / `LoopEdit` fields outside the newly checked sections
- [ ] Other modal/sheet surfaces still need live parity checks, especially the remote TTS voice picker, TTS model picker, endpoint picker, and destructive confirmations

## Recent Iterations

### 2026-03-10 — Iteration 14: make settings modal close affordances reliably tappable on mobile web

- Status: completed with live Expo Web verification
- Area:
  - desktop `Settings -> Profile & Model -> Select Model` picker in `apps/mobile/src/screens/SettingsScreen.tsx`
  - shared `SettingsScreen` modal close affordance used by the model picker, endpoint picker, remote TTS model picker, remote TTS voice picker, and import-profile modal
- Why this area:
  - the ledger still listed model pickers as an unchecked modal/sheet surface on narrow Expo Web viewports, so this was a good way to widen real runtime coverage instead of polishing an already-checked flow
  - live Expo Web inspection found a concrete actionability issue on a high-value configuration surface: the model picker's `Close` action was visibly below the 44px mobile tap-height guardrail
- What was investigated:
  - live Expo Web behavior at `http://localhost:8105` on a `390x664` iPhone-12-sized viewport in `Settings -> Desktop Settings -> Profile & Model -> Select Model`
  - the shared `modalCloseButton` style and existing settings overlay regression tests in `apps/mobile/tests/settings-overlay-density.test.js`
  - outstanding QA feedback in `../../aloops/.mobile-app-improvement-loop.qa-feedback.txt` about Iteration 13 still using a moving commit range
- Findings:
  - the `Select Model` modal's `Close` action measured about `53x25`, which is too short for a reliable mobile touch target even though the rest of the sheet fit the viewport
  - `SettingsScreen` reused the same undersized `modalCloseButton` style across the model picker, endpoint picker, remote TTS model picker, remote TTS voice picker, and import-profile modal, so one shared fix could improve multiple configuration overlays at once
  - the current QA stack also still needed the Iteration 13 evidence range bounded to a real commit SHA instead of `HEAD`
- Change made:
  - added `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })` to the shared `modalCloseButton` style in `SettingsScreen.tsx` so settings modal close affordances keep the existing text-first appearance but reach the 44px minimum mobile tap height
  - extended `apps/mobile/tests/settings-overlay-density.test.js` with a regression guard for the shared 44px close-action target
  - bounded Iteration 13's `voice-picker-offscreen` evidence block to the reviewed end SHA instead of a moving `HEAD`
- Verification:
  - `pnpm --filter @dotagents/mobile web --port 8105`
  - `node --test apps/mobile/tests/settings-overlay-density.test.js`
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `git diff --check`
  - live Expo Web verification at `http://localhost:8105`
- Follow-up checks:
  - inspect the adjacent remote desktop `Text-to-Speech -> Voice` and `Text-to-Speech -> Model` pickers next so the rest of the unchecked settings-modal coverage gets live runtime passes instead of only inheriting this shared close-button fix source-side
  - inspect endpoint picker and destructive confirmation sheets on narrow web viewports before making broader claims about settings-modal parity

Evidence
- Evidence ID: model-picker-close-target
- Scope: shared `SettingsScreen` modal close affordance in `apps/mobile/src/screens/SettingsScreen.tsx`, live-verified through `Desktop Settings -> Profile & Model -> Select Model`
- Commit range: 1aba66708f799fdb095f49196476784fdf699d6d..0c3a128d8c7c390fb889d8138eca064b78021457
- Rationale: The desktop settings model picker is a meaningful mobile configuration flow, and on Expo Web its primary dismissal affordance was only about `53x25`, which is too small for dependable tapping on a narrow viewport. Fixing the shared close-button style resolves that live usability risk on the checked model picker and lifts the same touch-target guardrail across sibling settings modals that reuse the same header control.
- QA feedback: Addressing prior QA feedback that Iteration 13 still used a moving commit range, while also fixing a new model-picker close-target issue found during this iteration's live Expo Web pass.
- Before evidence: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/model-picker-close-target--before--settings-model-picker--20260310.png`. Live Expo Web inspection on a `390x664` iPhone-12-sized viewport showed the `Select Model` sheet open from `Desktop Settings -> Profile & Model` with a `Close` action measuring about `53x25`. That before state was insufficient because the main dismissal control for a high-value settings modal fell below the expected 44px mobile tap height.
- Change: Added the shared `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })` guardrail to `SettingsScreen`'s `modalCloseButton`, added a focused regression test for the shared overlay close target, and replaced Iteration 13's moving `..HEAD` evidence range with the reviewed end SHA.
- After evidence: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/model-picker-close-target--after--settings-model-picker--20260310.png`. On the same `390x664` viewport, live Expo Web verification measured the `Close` action at `53x44` with computed `min-width: 44px` and `min-height: 44px`, while the control remained fully visible in the header above the search field. This after state is preferable because the model picker's dismissal affordance is now reliably tappable without sacrificing the compact sheet header layout.
- Verification commands/run results: `pnpm --filter @dotagents/mobile web --port 8105` ✅ (Expo Web started successfully at `http://localhost:8105`); `node --test apps/mobile/tests/settings-overlay-density.test.js` ✅ (3/3 passing); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅ (completed with a non-blocking Node engine warning under Node `v25.2.1`); `git diff --check` ✅; live Expo Web verification at `http://localhost:8105` ✅ (model-picker `Close` measured `53x44` on a `390x664` viewport and remained fully visible in the header).
- Blockers/remaining uncertainty: This iteration live-verified the shared close-button guardrail only through the `Profile & Model` model picker. The sibling endpoint picker, remote TTS model picker, remote TTS voice picker, and import-profile modal now inherit the same source-backed fix, but they still need dedicated runtime passes; destructive confirmations remain unchecked.

### 2026-03-10 — Iteration 13: restore the local TTS voice picker sheet guardrails on mobile web

- Status: completed with live Expo Web verification
- Area:
  - local `Text-to-Speech -> Voice` picker in `apps/mobile/src/ui/TTSSettings.tsx`
  - narrow Expo Web Settings flow on the default mobile configuration screen
- Why this area:
  - unresolved QA feedback called out that the earlier voice-picker fix had been dropped from the reviewed stack, so the worktree lost viewport-anchoring and 44px close-button guardrails on an important modal/sheet surface
  - the ledger still had voice pickers listed as weakly checked modal coverage, so fixing and re-verifying this sheet widened coverage without revisiting a fully-settled area
- What was investigated:
  - current `TTSSettings.tsx` styles and `apps/mobile/tests/tts-settings-density.test.js` against the prior QA-described regression
  - earlier shipped commit `45b352d16f0c1b49b0af3938a7905dce7ab3f508` to recover the exact viewport-anchor and touch-target guardrails that were lost
  - live Expo Web behavior at `http://localhost:8104` on an iPhone-12-sized viewport before and after the fix
- Findings:
  - the current worktree had indeed dropped the earlier web-sheet guardrails: `modalOverlay` no longer used `StyleSheet.absoluteFillObject`, `modalContent` no longer forced full-width sheet coverage, and the `Close` control no longer used `createMinimumTouchTargetStyle(...)`
  - live Expo Web inspection at `390x664` showed the clearest user-visible regression as an undersized `Close` hit target at roughly `53x25`, which is below the 44px minimum mobile touch-target height
  - even when the sheet still happened to fit this viewport, the missing source guardrails left the picker fragile for awkward web containers and no longer matched the previously shipped behavior QA referenced
- Change made:
  - restored the viewport-anchored modal overlay with `StyleSheet.absoluteFillObject` so the web sheet reliably covers the full viewport
  - restored full-width sheet sizing for the picker content and reinstated a 44px minimum close-button touch target via `createMinimumTouchTargetStyle(...)`
  - extended `apps/mobile/tests/tts-settings-density.test.js` so it now guards the 44px close action plus the web-specific viewport-anchor/full-width sheet behavior
  - committed the previously referenced Iteration 12 chat-agent-selector screenshots and froze that older Evidence block to an explicit commit range so the ledger's screenshot provenance is durable instead of depending on untracked files plus a moving `HEAD`
- Verification:
  - `pnpm --filter @dotagents/mobile web --port 8104`
  - `node --test apps/mobile/tests/tts-settings-density.test.js`
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `git diff --check`
  - live Expo Web verification at `http://localhost:8104`
- Follow-up checks:
  - inspect the remote desktop `Text-to-Speech -> Voice` picker next so modal coverage includes both the local and remote TTS voice-selection flows instead of only the local one
  - keep widening modal/sheet coverage to model pickers and destructive confirmations rather than polishing this local picker again without a new regression signal

Evidence
- Evidence ID: voice-picker-offscreen
- Scope: local Settings `Text-to-Speech -> Voice` picker in `apps/mobile/src/ui/TTSSettings.tsx` plus durable provenance for the prior chat-agent-selector screenshots
- Commit range: 3b42e30f107d2fc1f2b60719f47f270023679d54..1aba66708f799fdb095f49196476784fdf699d6d
- Rationale: The reviewed stack had dropped the earlier voice-picker web-sheet guardrails, so an important settings modal lost explicit viewport anchoring and the `Close` action fell back below the minimum mobile tap height. That left the picker fragile on narrow/awkward web containers and meant the ledger no longer matched the actually shipped UI behavior. This pass also resolves the evidence-provenance risk from the prior iteration by committing the referenced screenshots and replacing the older moving-`HEAD` range with a stable one.
- QA feedback: Addressing prior QA findings that the local TTS voice picker regression from `45b352d16f0c1b49b0af3938a7905dce7ab3f508` had been dropped and that Iteration 12's screenshot-backed evidence was not durably committed.
- Before evidence: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/voice-picker-offscreen--before--settings-voice-picker--qa-r1--20260310.png`. Live Expo Web inspection on a `390x664` iPhone-12-sized viewport showed the local TTS voice picker open with a visually tight header and a `Close` control that measured only about `53x25`, which is too short for reliable mobile tapping. Source review at the same time confirmed the web-specific viewport-anchor/full-width sheet guardrails had been removed, so this before state was both less tappable in the observed viewport and structurally fragile across other narrow containers.
- Change: Restored `StyleSheet.absoluteFillObject` on the web overlay, restored full-width sheet sizing, reinstated `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })` for the picker close action, expanded the density test to lock those guardrails back in, and committed the earlier chat-agent-selector screenshots referenced by Iteration 12.
- After evidence: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/voice-picker-offscreen--after--settings-voice-picker--qa-r1--20260310.png`. On the same `390x664` viewport, live Expo Web verification measured the picker sheet at `left=0`, `right=390`, `width=390`, and `bottom=664`, matching the viewport exactly, while the `Close` action now measured about `53.2x44` with a computed `min-height` of `44px`. This after state is preferable because the modal now has explicit web viewport guardrails again and the primary dismissal control meets the expected mobile hit-target height.
- Verification commands/run results: `pnpm --filter @dotagents/mobile web --port 8104` ✅ (Expo Web started successfully at `http://localhost:8104`); `node --test apps/mobile/tests/tts-settings-density.test.js` ✅ (3/3 passing); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅ (completed with a non-blocking Node engine warning under Node `v25.2.1`); `git diff --check` ✅; live Expo Web verification at `http://localhost:8104` ✅ (voice picker sheet measured full viewport width/height anchoring and the close button measured `53.2x44`).
- Blockers/remaining uncertainty: This pass fixed and live-verified the local TTS voice picker only. The adjacent remote desktop TTS voice picker in `SettingsScreen` still has not had a dedicated Expo Web modal pass in this worktree, and no large-text or landscape validation was performed for either picker yet.

### 2026-03-10 — Iteration 12: restore chat agent-selector parity with desktop-managed agents

- Status: completed with live Expo Web verification
- Area:
  - chat header agent selector sheet in `apps/mobile/src/ui/AgentSelectorSheet.tsx`
  - connected chat flow reached from `Settings -> Go to Chats -> existing chat session`
- Why this area:
  - the ledger still had modal/sheet coverage weak on narrow web viewports, and a fresh Expo Web pass found a core chat control failing on a primary screen instead of a niche edit form
  - the issue was also a settings/configuration parity gap: `Settings -> Agents` showed multiple desktop-managed agents, but the chat selector modal claimed none were available
- What was investigated:
  - live Expo Web behavior on an iPhone-12-sized viewport in the connected chat flow and the adjacent `Settings -> Agents` surface
  - `AgentSelectorSheet.tsx`, `profile.ts`, and the desktop remote-server endpoints for `/v1/profiles` vs `/v1/agent-profiles`
  - existing mobile selector/chat density tests and the shared `ApiAgentProfile` type contract
- Findings:
  - in API mode, the mobile chat selector still fetched legacy `/profiles`, which only returns user profiles, while the actual agent-management surface and desktop selector use `/agent-profiles`
  - on the connected server used for this pass, that mismatch produced an empty `No agents available` modal even though `Settings -> Agents` listed enabled agents like `Main Agent`, `augustus`, and `Web Browser`
  - the shared `ApiAgentProfile` type was also missing `guidelines`, even though the desktop remote-server list response already returns it and nearby mobile screens rely on it
- Change made:
  - switched the API-mode chat selector to fetch enabled desktop agent profiles from `/agent-profiles` and map them into the mobile selector rows using the display name plus description/guidelines helper copy
  - kept ACP-mode selector behavior intact, so ACP main-agent selection still comes from `mainAgentName` + ACP-capable agent options
  - aligned `packages/shared/src/api-types.ts` so `ApiAgentProfile` includes optional `guidelines`, which matches the server response and unblocks clean mobile typechecking
  - extended `apps/mobile/tests/agent-selector-sheet-density.test.js` with a regression guard that the API-mode selector uses enabled desktop agent profiles and no longer calls the legacy `getProfiles()` path
- Verification:
  - `pnpm build:shared`
  - `node --test apps/mobile/tests/agent-selector-sheet-density.test.js apps/mobile/tests/chat-screen-density.test.js`
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `git diff --check`
  - live Expo Web verification at `http://localhost:8103`
- Follow-up checks:
  - inspect the remaining unchecked modal/sheet surfaces next, especially model-picker and voice-picker states on narrow viewports, instead of returning to this selector without a new regression signal
  - run a dedicated settings-parity pass for desktop host-only `General` and `Remote Server` configuration so the ledger better separates intentional desktop-only gaps from missing mobile configuration

Evidence
- Evidence ID: chat-agent-selector-parity
- Scope: chat header agent selector parity in `apps/mobile/src/ui/AgentSelectorSheet.tsx` and connected chat flow on Expo Web
- Commit range: bd56d13a07e1a6df5234fdc7d4451fec98974697..3b42e30f107d2fc1f2b60719f47f270023679d54
- Rationale: Mobile users could reach a live chat and see multiple agents in `Settings -> Agents`, but the primary in-chat selector sheet still reported `No agents available`. That broke a meaningful runtime configuration flow on mobile and created a direct parity mismatch with desktop-managed agent switching.
- QA feedback: None (new iteration)
- Before evidence: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/chat-agent-selector-parity--before--chat-agent-selector-dialog--20260310.png` and `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/chat-agent-selector-parity--before--settings-agents-expanded--20260310.png`. Playwright Chromium on an iPhone 12-sized `390x664` viewport showed the chat selector sheet open with `Select Agent` + `No agents available`, while the adjacent Settings evidence showed multiple configured agents. This before state was insufficient because the core chat control hid valid runtime choices that mobile users could already see elsewhere in the app.
- Change: Rewired API-mode selector loading from legacy user profiles to enabled desktop agent profiles, preserved ACP-mode selection behavior, aligned the shared agent-profile type with the server response, and added regression coverage for the selector's data-source parity.
- After evidence: `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/chat-agent-selector-parity--after--chat-agent-selector-dialog--20260310.png` and `/Users/ajjoobandi/Development/dotagents-mono-worktrees/mobile-app-improvement-loop/.aloops-artifacts/mobile-app-improvement-loop/chat-agent-selector-parity--after--chat-header-selected-agent--20260310.png`. On the same `390x664` viewport, the selector sheet now lists available agents instead of an empty state, and selecting `augustus` updates the chat header label before being restored to `Main Agent`. This after state is preferable because the primary chat control now exposes the same enabled agent choices users can inspect in Settings and provides immediate feedback that the selection took effect.
- Verification commands/run results: `pnpm build:shared` ✅; `node --test apps/mobile/tests/agent-selector-sheet-density.test.js apps/mobile/tests/chat-screen-density.test.js` ✅ (7/7 passing); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅; `git diff --check` ✅; live Expo Web verification at `http://localhost:8103` ✅ (selector listed agents; selecting `augustus` updated the chat header, then the state was restored to `Main Agent`).
- Blockers/remaining uncertainty: This iteration cleared the earlier Expo Web startup blocker in this worktree, but it did not yet cover the remaining unchecked modal/sheet surfaces or desktop-host-only settings parity decisions. Runtime warnings unrelated to this fix (for example Expo web notification-listener limitations and React Native Web deprecation warnings) were observed earlier in the session but were not part of this shippable change.

### 2026-03-09 — Iteration 11: make the Settings desktop warning readable and actionable on narrow screens

- Status: completed with source-backed verification; live Expo Web inspection was blocked by missing dependencies in this worktree
- Area:
  - `Settings` desktop partial-load warning in `apps/mobile/src/screens/SettingsScreen.tsx`
  - warning state reached when some desktop settings endpoints fail but the app still has enough data to show the `Desktop Settings` section, e.g. `Failed to load: settings`
- Why this area:
  - the ledger still had the Settings reconnect/partial-load warning unchecked, and recent iterations had focused more on edit forms than on cross-cutting screen states
  - source review showed a concrete narrow-screen/actionability problem: the warning crammed a long error message and a tiny text-only `Retry` action into one horizontal row with no explanation that some visible values might now be stale
- What was investigated:
  - current warning markup/styles and retry affordance in `SettingsScreen.tsx`
  - nearby mobile button/touch-target patterns already used elsewhere in the app
  - attempted Expo Web startup via the existing repo workflow
- Findings:
  - live runtime inspection is still blocked in this worktree because both root and `apps/mobile` `node_modules` are absent, so `pnpm --filter @dotagents/mobile web --port 8102` fails with `expo: command not found`
  - the warning used a single horizontal row, which is fragile for longer partial-failure messages like `Failed to load: profiles, MCP servers, settings`
  - the `Retry` affordance was rendered as small inline text instead of a clear full-width action, and the UI did not explain that desktop values might be temporarily out of date
- Change made:
  - reworked the Settings warning into a stacked alert card with a clear title, the raw failure detail, and a short stale-data explanation
  - converted `Retry` into a full-width 44px minimum touch-target button with explicit accessibility label and hint
  - added `apps/mobile/tests/settings-remote-warning-state.test.js` to lock the warning copy, retry semantics, and narrow-layout guardrails
- Verification:
  - `node --test apps/mobile/tests/settings-remote-warning-state.test.js apps/mobile/tests/agent-loops-actions.test.js`
  - `git diff --check`
  - attempted Expo Web verification via `pnpm --filter @dotagents/mobile web --port 8102`
- Follow-up checks:
  - once dependencies are available, verify in Expo Web that longer partial-load warnings wrap cleanly above the retry button without pushing the rest of `Desktop Settings` too far down on a narrow viewport
  - continue widening coverage to session loading/error/sync states or modal/sheet surfaces rather than returning to already-improved settings subsections without a new finding

Evidence
- Scope: Settings desktop partial-load warning / retry state in `apps/mobile/src/screens/SettingsScreen.tsx`
- Before evidence: Source review showed the warning rendering as `styles.warningContainer` with `flexDirection: 'row'`, `justifyContent: 'space-between'`, and `alignItems: 'center'`, containing only `⚠️ {remoteError}` plus a text-only `Retry` action. The retry affordance had no mobile-sized button styling, no `createMinimumTouchTargetStyle(...)`, and no explanation that partially loaded desktop settings may now be stale. Live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8102`, but the command failed because both root and mobile `node_modules` are missing and `expo` was not found.
- Change: Reworked the Settings warning into a stacked alert card with a title, raw error detail, stale-data guidance, and a full-width retry button using the shared 44px touch-target helper plus explicit accessibility metadata. Added a focused regression test file.
- After evidence: Source now shows `styles.warningContainer` with `width: '100%'`, `gap: spacing.md`, and `alignItems: 'stretch'`; `styles.warningContent` groups the message copy; and the UI now includes `Desktop settings need attention` plus `Some desktop sections may be out of date until the retry finishes.`. The retry action now uses `styles.warningRetryButton` with `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })`, `width: '100%'`, centered label text, and `createButtonAccessibilityLabel('Retry loading desktop settings')`. `apps/mobile/tests/settings-remote-warning-state.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/settings-remote-warning-state.test.js apps/mobile/tests/agent-loops-actions.test.js` ✅ (4/4 passing); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8102` ❌ (`node_modules` missing, `expo: command not found`).
- Blockers/remaining uncertainty: No live before/after visual evidence this iteration because Expo Web still cannot start in the current worktree. Remaining uncertainty is limited to the exact runtime wrapping, vertical spacing, and visual prominence of the stacked warning card until dependencies are available.

### 2026-03-09 — Iteration 10: make MemoryEdit importance choices readable and tappable on narrow screens

- Status: completed with source-backed verification; live Expo Web inspection was blocked by missing dependencies in this worktree
- Area:
  - `MemoryEdit` importance selection in `apps/mobile/src/screens/MemoryEditScreen.tsx`
  - create/edit flow reached from `Settings -> Memories -> + Create New Memory` or tapping an existing memory
- Why this area:
  - the ledger still had `MemoryEdit` uncovered, and recent iterations were concentrated on sessions, chat, loops, and agent setup rather than the memory-edit flow
  - source review found a concrete narrow-screen/accessibility issue in a high-value decision control: importance was rendered as four small wrap chips with no explanatory copy, no explicit button semantics, and no selected-state metadata
- What was investigated:
  - current `MemoryEditScreen.tsx` markup/styles for the importance picker and save flow
  - existing mobile narrow-screen selector patterns in `LoopEdit` and `AgentEdit`
  - attempted Expo Web startup via the existing repo workflow
- Findings:
  - live runtime inspection is still blocked in this worktree because both root and `apps/mobile` `node_modules` are absent, so `pnpm --filter @dotagents/mobile web --port 8101` fails with `expo: command not found`
  - the importance selector used a wrapping chip row with inline padding only, which is fragile on narrow mobile widths
  - the chosen importance level was communicated mostly through color alone, and the UI did not explain how importance affects memory retrieval priority
- Change made:
  - converted the MemoryEdit importance selector into full-width stacked options with descriptive copy, explicit selected-state button semantics, and a visible checkmark for the chosen level
  - enforced 44px minimum touch targets for each importance choice using the shared mobile accessibility helper
  - added `apps/mobile/tests/memory-edit-importance-options.test.js` to lock the priority guidance copy, accessibility semantics, and narrow-layout guardrails
- Verification:
  - `node --test apps/mobile/tests/*.test.js`
  - `git diff --check`
  - attempted Expo Web verification via `pnpm --filter @dotagents/mobile web --port 8101`
- Follow-up checks:
  - once dependencies are available, verify `MemoryEdit` in Expo Web on a narrow viewport and confirm the stacked importance rows, helper descriptions, and save-button spacing remain readable without excessive scrolling
  - inspect the rest of `MemoryEdit` next, especially loading/error states and large-text behavior for the title/content/tags fields, so memory coverage broadens beyond this selector subsection
  - continue widening coverage to remaining modal/sheet and session-state surfaces instead of revisiting already-checked edit selectors without a new finding

Evidence
- Scope: `MemoryEdit` importance selection in `apps/mobile/src/screens/MemoryEditScreen.tsx`
- Before evidence: Source review showed the importance control rendering as `styles.optionRow` (`flexDirection: 'row'`, `flexWrap: 'wrap'`) with each `styles.option` using only inline padding, no `createMinimumTouchTargetStyle(...)`, no explicit `accessibilityRole`, and no selected-state metadata. The UI exposed only `Low` / `Medium` / `High` / `Critical` labels with no guidance about how priority changes memory retrieval. Live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8101`, but the command failed because both root and mobile `node_modules` are missing and `expo` was not found.
- Change: Reworked the MemoryEdit importance selector into full-width descriptive rows, added 44px minimum touch-target styling plus explicit button labels/hints/selected-state metadata, added a visible checkmark for the selected option, and added a focused regression test file.
- After evidence: Source now shows `styles.importanceOptions` with `width: '100%'`, `styles.importanceOption` using `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })`, and each option exposing `accessibilityRole="button"` plus `accessibilityState={{ selected: isSelected, disabled: isSaving }}`. The screen now explains `Higher-priority memories are surfaced first when the agent loads context.` and each importance row includes a description, while the selected option also shows a `✓` checkmark so selection is not color-only. `apps/mobile/tests/memory-edit-importance-options.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (22/22 passing); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8101` ❌ (`node_modules` missing, `expo: command not found`).
- Blockers/remaining uncertainty: No live before/after visual evidence this iteration because Expo Web still cannot start in the current worktree. Remaining uncertainty is limited to the exact runtime spacing, copy wrapping, and scroll depth of the new MemoryEdit importance rows until dependencies are available.

### 2026-03-09 — Iteration 9: make AgentEdit connection modes mobile-readable and stop misrouting ACP setup

- Status: completed with source-backed verification; live Expo Web inspection was blocked by missing dependencies in this worktree
- Area:
  - `AgentEdit` connection-type selection and mode-specific fields in `apps/mobile/src/screens/AgentEditScreen.tsx`
  - create/edit flow reached from `Settings -> Agent Profiles -> + Create New Agent` or tapping an existing agent
- Why this area:
  - the ledger still had `AgentEdit` unchecked, and recent passes were concentrated on Settings rows, sessions, chat, and one `LoopEdit` subsection
  - source review found a concrete reliability/usability problem in a high-leverage form control: the four connection modes were rendered as small wrap chips with color-only selection, and the `ACP` mode incorrectly exposed a `Base URL` field even though the shared/server types expect ACP profiles to use local command fields like `stdio`
- What was investigated:
  - current `AgentEditScreen.tsx` connection-type selector, conditional field rendering, and save payload mapping
  - shared/mobile/server agent profile types and handlers in `packages/shared/src/api-types.ts`, `apps/desktop/src/shared/types.ts`, and `apps/desktop/src/main/remote-server.ts`
  - attempted Expo Web startup via the existing repo workflow
- Findings:
  - live runtime inspection was blocked because the workspace currently lacks `node_modules`, so `expo` could not start
  - the connection-type control used small wrapping pills with no explicit button semantics or selected-state metadata, which is fragile on narrow mobile widths
  - `ACP` profiles loaded and saved `connectionCommand` / `connectionArgs` / `connectionCwd`, but the form only showed `Base URL` for `acp`, making that mode misleading and preventing users from editing the fields the backend actually uses
- Change made:
  - converted the `AgentEdit` connection-type selector into full-width stacked options with descriptive copy, 44px minimum touch targets, and explicit selected-state button semantics
  - changed the mode-specific field rendering so `acp` and `stdio` both expose `Command`, `Arguments`, and `Working Directory`, while `remote` alone shows `Base URL`
  - added `apps/mobile/tests/agent-edit-connection-types.test.js` to lock the selector accessibility/mobile layout guardrails and the ACP-vs-remote field mapping
- Verification:
  - `node --test apps/mobile/tests/*.test.js`
  - `git diff --check`
  - attempted Expo Web verification via `pnpm --filter @dotagents/mobile web --port 8097`
- Follow-up checks:
  - once dependencies are installed, verify `AgentEdit` in Expo Web on a narrow viewport and confirm the stacked connection rows, long descriptions, and mode-specific fields remain readable without pushing the save action too far down
  - inspect `MemoryEdit` next so coverage continues widening across the edit flows instead of staying inside agent/loop configuration
  - validate the remaining `AgentEdit` states later, especially built-in-agent limited editing and large-text behavior across long prompt/guidelines inputs

Evidence
- Scope: `AgentEdit` connection-type selection and mode-specific setup fields in `apps/mobile/src/screens/AgentEditScreen.tsx`
- Before evidence: Source review showed `CONNECTION_TYPES` as four label-only chips, `styles.connectionTypeRow` as a wrapping row, and `styles.connectionTypeOption` using only inline padding with no `createMinimumTouchTargetStyle(...)`, no explicit button role, and no selected-state metadata. The form rendered `Base URL` for `(formData.connectionType === 'remote' || formData.connectionType === 'acp')`, while shared/server types describe `acp` as a local command-based profile (`command`, `args`, `cwd`) and only `remote` as URL-based. Live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8097` but failed because `node_modules` is missing and `expo` was not found.
- Change: Reworked the `AgentEdit` connection-type selector into full-width descriptive rows with 44px minimum touch targets and selected-state button semantics, then split the mode-specific fields so `acp` and `stdio` share local command inputs while `remote` alone shows `Base URL`. Added a focused regression test file.
- After evidence: Source now shows `styles.connectionTypeOptions` with `width: '100%'`, `styles.connectionTypeOption` using `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })`, and each connection choice exposing `accessibilityRole="button"` plus `accessibilityState={{ selected: ... }}`. `AgentEditScreen.tsx` now uses `showCommandFields = formData.connectionType === 'acp' || formData.connectionType === 'stdio'` and `showRemoteBaseUrlField = formData.connectionType === 'remote'`, so ACP no longer reuses the remote-only URL field. `apps/mobile/tests/agent-edit-connection-types.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (19/19 passing); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8097` ❌ (`node_modules` missing, `expo: command not found`).
- Blockers/remaining uncertainty: No live before/after visual evidence this iteration because Expo Web cannot start in the current worktree. Remaining uncertainty is limited to the exact runtime spacing, description wrapping, and scroll depth of the new `AgentEdit` connection rows until dependencies are available.

### 2026-03-09 — QA remediation 1: stop hidden AgentEdit base-URL persistence and add real switch/save coverage

- Status: completed with targeted source + behavior verification; live Expo Web remained blocked by missing dependencies in this worktree
- Area:
  - `AgentEdit` connection-type switching and save payload construction in `apps/mobile/src/screens/AgentEditScreen.tsx`
  - agent-profile connection persistence sanitization in `apps/desktop/src/main/remote-server.ts`
- Why this area:
  - QA found that the earlier ACP/remote fix improved the visible form fields, but hidden `Base URL` state could still survive a remote-to-ACP change or an edit of an already-stale ACP profile because the mobile save path still submitted `connectionBaseUrl` too broadly and the server preserved `baseUrl` regardless of connection type
  - QA also found the earlier regression test only matched source text/layout and did not exercise the switch/save persistence path
- Findings:
  - `AgentEdit` only changed `connectionType` on tap, so hidden remote URL state could linger in form state after switching away from `remote`
  - the save payload still populated all connection fields, so hidden values could continue crossing connection modes
  - the desktop remote server rebuilt `connection` objects by mixing request fields with existing saved fields without dropping type-incompatible properties, which let stale `baseUrl` survive ACP saves
- Change made:
  - added a small mobile connection helper that clears hidden remote URL state when leaving `remote` and only sends type-appropriate connection fields during save
  - added a small desktop sanitization helper so create/update persistence keeps only fields valid for the chosen connection type and treats blank visible inputs as explicit clears instead of silently preserving stale saved values
  - added behavior-focused tests for the mobile switch/save path and the desktop connection sanitization path, while keeping the earlier narrow-layout/source guardrails test
- Verification:
  - `node --experimental-strip-types --test apps/mobile/tests/agent-edit-connection-types.test.js apps/mobile/tests/agent-edit-connection-persistence.test.mjs apps/desktop/src/main/agent-profile-connection-sanitize.test.mjs`
  - `git diff --check`
- Follow-up checks:
  - once dependencies are available, verify in Expo Web that switching `Remote -> ACP` clears the remote-only field value and that saving an existing ACP profile with previously stale hidden URL data does not rehydrate that URL in the form
  - keep future mobile coverage widening outside `AgentEdit` after this QA pass, especially `MemoryEdit` and broader loading/error states, instead of returning to the same subsection without a new finding

Evidence
- Scope: QA remediation for `AgentEdit` connection-type switch/save persistence and desktop agent-profile connection sanitization
- Before evidence: QA findings documented that `AgentEditScreen.tsx` still saved `connectionBaseUrl` for every connection type and only changed `connectionType` on selection, while `apps/desktop/src/main/remote-server.ts` preserved `baseUrl` during updates even for ACP profiles. The existing `apps/mobile/tests/agent-edit-connection-types.test.js` only regex-matched source text/layout and would not fail on hidden-field persistence.
- Change: Added `apps/mobile/src/screens/agent-edit-connection-utils.ts` to clear stale remote URL state on type switches and build type-specific save payloads, wired `AgentEditScreen.tsx` through that helper, added `apps/desktop/src/main/agent-profile-connection-sanitize.ts` so the server drops type-incompatible connection fields during create/update, and added focused behavior tests for both paths.
- After evidence: The mobile helper now clears `connectionBaseUrl` whenever the form leaves `remote` and only includes `connectionBaseUrl` in save payloads for `remote`. The desktop sanitization helper now returns `{ type: 'acp' | 'stdio' }` connections without `baseUrl`, returns `{ type: 'remote' }` connections without local command fields, and removes blank visible values instead of preserving stale saved ones. The new behavior tests directly cover remote-to-ACP switching, ACP save payload shaping, remote save payload shaping, stale `baseUrl` removal for ACP persistence, remote-only persistence, and explicit remote URL clearing.
- Verification commands/run results: `node --experimental-strip-types --test apps/mobile/tests/agent-edit-connection-types.test.js apps/mobile/tests/agent-edit-connection-persistence.test.mjs apps/desktop/src/main/agent-profile-connection-sanitize.test.mjs` ✅ (9/9 passing; Node emitted a non-blocking `MODULE_TYPELESS_PACKAGE_JSON` warning while importing the new mobile `.ts` helper directly for the test run); `git diff --check` ✅.
- Blockers/remaining uncertainty: Expo Web is still unavailable in this worktree because dependencies are missing, so this remediation pass has no new live visual evidence. Remaining uncertainty is limited to runtime web/mobile form behavior until the existing dependency blocker is cleared.

### 2026-03-09 — Iteration 8: make LoopEdit profile selection readable and tappable on narrow screens

- Status: completed with source-backed verification; live Expo Web inspection was blocked by missing dependencies in this worktree
- Area:
  - `LoopEdit` agent-profile selection in `apps/mobile/src/screens/LoopEditScreen.tsx`
  - create/edit flow reached from `Settings -> Agent Loops -> + Create New Loop` or tapping an existing loop
- Why this area:
  - the previous iteration improved loop list-row actions, so the next high-value coverage expansion was the adjacent and still-unchecked loop create/edit flow
  - source review showed the optional agent-profile selector still used small wrap chips with color-only selection, which is especially fragile on narrow mobile widths and weak for accessibility
- What was investigated:
  - attempted Expo Web startup via the existing repo workflow
  - current `LoopEditScreen.tsx` markup and styles for the profile-selection section
  - existing mobile accessibility/touch-target helpers used elsewhere in the app
- Findings:
  - live runtime inspection was blocked because the workspace currently lacks `node_modules`, so `expo` could not start
  - `styles.profileOptions` used a wrapping chip row and each `profileOption` only used inline padding, with no minimum 44px touch target guardrail
  - profile choices lacked explicit button semantics and selected-state metadata, so the currently chosen agent was communicated mostly through color alone
  - the default fallback behavior was not explained, which makes `No profile` ambiguous when creating a loop quickly on mobile
- Change made:
  - converted the LoopEdit profile selector from wrapping chips into full-width stacked rows better suited to narrow screens
  - added explicit button labels, hints, and selected-state metadata for the default-agent option and each saved agent profile
  - added clearer copy explaining what the default-agent option means and what happens when no saved agent profiles exist yet
  - added `apps/mobile/tests/loop-edit-profile-selection.test.js` to lock the layout, touch-target, and accessibility guardrails
- Verification:
  - `node --test apps/mobile/tests/*.test.js`
  - `git diff --check`
  - attempted Expo Web verification via `pnpm --filter @dotagents/mobile web --port 8096`
- Follow-up checks:
  - once dependencies are installed, verify the LoopEdit profile selector in Expo Web on a narrow viewport and confirm long profile names wrap cleanly without crowding the save action
  - inspect `MemoryEdit` next so coverage continues widening across edit flows instead of staying in Settings/Loop surfaces
  - inspect the rest of `LoopEdit` for large-text behavior, especially the prompt and interval fields, once live runtime validation is available

Evidence
- Scope: `LoopEdit` agent-profile selection in `apps/mobile/src/screens/LoopEditScreen.tsx`
- Before evidence: Source review showed `styles.profileOptions` as a wrapping chip row (`flexDirection: 'row'`, `flexWrap: 'wrap'`) and `styles.profileOption` using only `paddingVertical: spacing.sm` / `paddingHorizontal: spacing.md`, with no `createMinimumTouchTargetStyle(...)`, no explicit button role, and no selected-state metadata. The default fallback choice was labeled only as `No profile`, with no copy explaining that the loop would use the default active agent. Live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8096` but failed because `node_modules` is missing and `expo` was not found.
- Change: Reworked the LoopEdit profile selector into full-width rows, added 44px minimum touch-target styling plus explicit button labels/hints/selected-state metadata, clarified the default-agent fallback copy, and added a focused regression test file.
- After evidence: Source now shows `styles.profileOptions` with `width: '100%'`, `styles.profileOption` using `createMinimumTouchTargetStyle({ minSize: 44, ... })`, and each option exposing `accessibilityRole="button"` plus `accessibilityState={{ selected: ... }}`. The UI copy now explains `Choose a dedicated agent for this loop, or leave it on the default agent.` and `No saved agent profiles yet. This loop will use the default agent until you create one.` `apps/mobile/tests/loop-edit-profile-selection.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (16/16 passing); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8096` ❌ (`node_modules` missing, `expo: command not found`).
- Blockers/remaining uncertainty: No live before/after visual evidence this iteration because Expo Web cannot start in the current worktree. Remaining uncertainty is limited to the exact runtime spacing, text wrapping, and visual weight of the new full-width profile rows until dependencies are available.

### 2026-03-09 — Iteration 7: make agent loop row actions readable and tappable

- Status: completed with source-backed verification; live Expo Web inspection was blocked by missing dependencies in this worktree
- Area:
  - Settings -> Agent Loops list in `apps/mobile/src/screens/SettingsScreen.tsx`
  - row actions for existing loops: enable toggle, `Run`, and `Delete`
- Why this area:
  - the recent ledger heavily covered Connection, Sessions, and Chat composer surfaces, so this pass widened coverage to an under-checked Settings management surface
  - loop rows currently packed the actionable controls into a tiny side column, which is especially risky on narrow mobile widths because `Run` and `Delete` were rendered as tiny text actions instead of clear buttons
- What was investigated:
  - attempted Expo Web startup via the existing repo workflow
  - current loop row markup, action labels, and styles in `SettingsScreen.tsx`
- Findings:
  - live runtime inspection was blocked because the workspace currently lacks `node_modules`, so `expo` could not start
  - the per-loop `Run` and `Delete` actions used only `padding: 4` with `fontSize: 12`, well below the app's recent 44px touch-target guardrails
  - those actions also lacked explicit button labels/hints, making them less discoverable and less trustworthy as primary row actions
- Change made:
  - converted the loop action area into a full-width wrapping action row better suited to narrow screens
  - restyled `Run now` and `Delete` as bordered button-like controls with 44px minimum touch targets and centered labels
  - added explicit button roles, labels, and hints for running a loop immediately and opening delete confirmation
  - added `apps/mobile/tests/agent-loops-actions.test.js` to lock the touch-target and accessibility guardrails
- Verification:
  - `node --test apps/mobile/tests/*.test.js`
  - `git diff --check`
  - attempted Expo Web verification via `pnpm --filter @dotagents/mobile web --port 8095`
- Follow-up checks:
  - once dependencies are installed, verify the Agent Loops action row in Expo Web on a narrow viewport and confirm the switch + buttons wrap cleanly without crowding loop content
  - inspect the adjacent `LoopEdit` screen next so coverage moves from list-row actions into the loop create/edit flow itself
  - continue broadening edit-flow coverage to `MemoryEdit` and `AgentEdit`

Evidence
- Scope: Settings -> Agent Loops list row actions in `apps/mobile/src/screens/SettingsScreen.tsx`
- Before evidence: Source review showed each loop row rendering `Run` and `Delete` as tiny text controls with inline styles `padding: 4` and `fontSize: 12`, plus no explicit button labels/hints. Live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8095` but failed because `node_modules` is missing and `expo` was not found.
- Change: Reworked the loop action area into a wrapping full-width row, restyled `Run now` and `Delete` as 44px minimum touch-target buttons, and added descriptive accessibility labels/hints plus a focused regression test file.
- After evidence: Source now shows `styles.loopActions` with `width: '100%'` and `flexWrap: 'wrap'`, and both loop actions use `styles.loopActionButton` with `createMinimumTouchTargetStyle({ minSize: 44, ... })`, explicit button semantics, and descriptive labels/hints. `apps/mobile/tests/agent-loops-actions.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (13/13 passing); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8095` ❌ (`node_modules` missing, `expo: command not found`).
- Blockers/remaining uncertainty: No live before/after visual evidence this iteration because Expo Web cannot start in the current worktree. Remaining uncertainty is limited to the exact runtime wrap/spacing of the new loop action row until dependencies are available.

### 2026-03-09 — Iteration 6: make the session empty state actionable in-place

- Status: completed with source-backed verification; live Expo Web inspection was blocked by missing dependencies in this worktree
- Area:
  - session list empty state in `apps/mobile/src/screens/SessionListScreen.tsx`
  - intended flow: `Settings -> Go to Chats` with zero existing sessions
- Why this area:
  - recent iterations heavily covered `Connection` and `Chat composer`, so this pass widened screen coverage to a different major surface and state
  - the session empty state had explanatory copy, but no in-place primary action near the empty-state content, forcing first-time users to jump back to the header button to proceed
- What was investigated:
  - current session empty-state rendering and styles in `SessionListScreen.tsx`
  - current mobile/web runner setup in `apps/mobile/package.json`
  - attempted Expo Web startup via the existing repo workflow
- Findings:
  - the empty state only showed `No Sessions Yet` plus helper text, with no CTA embedded in the focal empty-state area
  - on narrow mobile layouts, that weakens actionability and hierarchy because the only visible next step lives separately in the top header
  - live runtime inspection was blocked because the workspace currently lacks `node_modules`, so `expo` could not start
- Change made:
  - updated the empty-state copy to clearer chat-focused language (`No chats yet`)
  - added an in-place primary `Start first chat` CTA wired to the existing `handleCreateSession` flow
  - constrained the empty-state content width and button width so the new CTA stays centered and readable on narrow mobile layouts
  - added `apps/mobile/tests/session-list-empty-state.test.js` to lock the CTA wiring and layout guardrails
- Verification:
  - `node --test apps/mobile/tests/session-list-empty-state.test.js apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/connection-settings-validation.test.js apps/mobile/tests/navigation-header.test.js`
  - `git diff --check`
- Follow-up checks:
  - once dependencies are installed, verify the session empty state in Expo Web on narrow viewports and confirm the CTA remains above the Rapid Fire footer without crowding
  - continue widening coverage to under-checked screens like `AgentEdit`, `MemoryEdit`, `LoopEdit`, and session loading/error/sync states

Evidence
- Scope: Session list empty state (`Settings -> Go to Chats` with no sessions) in `apps/mobile/src/screens/SessionListScreen.tsx`
- Before evidence: Source review showed the empty state only rendered `No Sessions Yet` plus `Start a new chat to begin a conversation`, with no in-place CTA. Live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8094` but failed because `node_modules` is missing and `expo` was not found.
- Change: Added a centered `Start first chat` button inside the empty state, wired it to `handleCreateSession`, tightened empty-state width constraints for narrow layouts, and added a focused regression test file.
- After evidence: Source now shows the empty state rendering `Start first chat` with button semantics and the existing create-session handler; `apps/mobile/tests/session-list-empty-state.test.js` passes and locks the CTA text, wiring, and width constraints.
- Verification commands/run results: `node --test apps/mobile/tests/session-list-empty-state.test.js apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/connection-settings-validation.test.js apps/mobile/tests/navigation-header.test.js` ✅ (11/11 passing); `git diff --check` ✅; `pnpm --filter @dotagents/mobile web --port 8094` ❌ (`node_modules` missing, `expo: command not found`).
- Blockers/remaining uncertainty: No live Expo Web before/after visual evidence this iteration because dependencies are not installed in the worktree. Remaining uncertainty is limited to runtime spacing/visual fit of the new empty-state CTA until Expo Web can be launched.

### 2026-03-07 — Iteration 5: enlarge chat composer accessory controls and expose edit-toggle state on web

- Status: completed
- Area:
  - chat composer accessory controls in `apps/mobile/src/screens/ChatScreen.tsx`
  - live flow inspected in Expo Web: `Settings -> Go to Chats -> New Chat`
- Why this area:
  - iteration 4 already improved the adjacent `Send` control, and its follow-up notes called out the neighboring composer accessories as still too small.
  - fresh Expo Web inspection confirmed a concrete accessibility/usability issue: `Attach images` and `Edit before send` were only about `32x32`, and `Edit before send` did not expose its toggled state in the web accessibility tree.
- What was investigated:
  - current accessory control markup and shared sizing styles in `ChatScreen.tsx`
  - live Expo Web DOM/accessibility output for `Attach images` and `Edit before send` before changing code
- Findings:
  - both accessory controls were undersized for mobile touch targets at roughly `32x32`
  - `Edit before send` changed visual styling when toggled, but Expo Web did not emit `aria-checked`, so assistive tech could not reliably detect its on/off state
- Change made:
  - increased the shared chat composer accessory control size from `32x32` to `44x44`
  - added explicit `aria-checked` wiring to the `Edit before send` switch so Expo Web exposes its live checked state
  - extended `apps/mobile/tests/chat-composer-accessibility.test.js` with coverage for the accessory control touch-target size and edit-toggle accessibility state
- Verification:
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `node --test apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-validation.test.js`
  - live Expo Web verification at `http://localhost:8093`:
    - confirmed `Attach images` renders at `44x44`
    - confirmed `Edit before send` renders at `44x44`
    - confirmed `Edit before send` exposes `aria-checked="false"` / `"true"` and updates the accessibility tree state when toggled
- Follow-up checks:
  - investigate the adjacent chat composer TTS toggle, which shares the larger touch target now but still lacks an explicit accessibility label/state pass
  - investigate the unrelated Settings warning after reconnecting: `⚠️ Failed to load: settings`
  - investigate the Expo Web runtime errors noted in earlier passes, especially `normalizeApiBaseUrl is not a function` and `Unexpected text node ... child of a <View>`

### 2026-03-07 — Iteration 4: make the chat composer Send control accessible on mobile web

- Status: completed
- Area:
  - chat composer action row in `apps/mobile/src/screens/ChatScreen.tsx`
  - live flow inspected in Expo Web: `Settings -> Go to Chats -> New Chat`
- Why this area:
  - the ledger already covered Connection follow-ups, so this pass avoided repeating that work and moved to a fresh chat composer issue.
  - fresh Expo Web inspection reproduced a concrete usability/accessibility bug: the composer `Send` control rendered as a tiny clickable `div` instead of a clearly exposed button.
- What was investigated:
  - current composer markup/styles in `ChatScreen.tsx`
  - live Expo Web accessibility tree and rendered box sizing for the composer controls
- Findings:
  - `Send` was missing explicit button semantics in the composer row, so Expo Web did not expose it as a button in the accessibility tree
  - the enabled control measured about `48x23`, which is too small for a reliable mobile tap target
- Change made:
  - added `accessibilityRole`, label, hint, and disabled state metadata to the composer `Send` control
  - increased the composer `Send` control to a 44px minimum height with centered content and a wider tap target
  - added `apps/mobile/tests/chat-composer-accessibility.test.js` to lock the semantics and touch-target guardrails
- Verification:
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `node --test apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-validation.test.js`
  - live Expo Web verification at `http://localhost:8092`:
    - confirmed the empty composer exposes `Send message` as a disabled button
    - confirmed typing a draft keeps `Send message` exposed as a button
    - confirmed the rendered `Send` control measures `64x44`
- Follow-up checks:
  - investigate the adjacent chat composer accessory controls (`Attach images`, `Edit before send`), which still render at roughly `32x32` in Expo Web
  - investigate the unrelated Settings warning after reconnecting: `⚠️ Failed to load: settings`
  - investigate the Expo Web runtime errors noted in earlier passes, especially `normalizeApiBaseUrl is not a function` and `Unexpected text node ... child of a <View>`

### 2026-03-07 — Iteration 3: strengthen Connection inline action accessibility

- Status: completed
- Area:
  - Connection screen inline actions in `apps/mobile/src/screens/ConnectionSettingsScreen.tsx`
  - live flow inspected in Expo Web: `Settings -> Connection`
- Why this area:
  - iteration 2 already fixed first-run save validation in Connection, and its follow-up notes called out weak accessibility semantics for text-only actions.
  - fresh Expo Web inspection confirmed a concrete usability issue: `Show/Hide` and `Reset to default` worked, but rendered as tiny text-only controls with weak button affordance.
- What was investigated:
  - current inline action markup and styles in `ConnectionSettingsScreen.tsx`
  - live Expo Web behavior and accessibility output for `Show/Hide` and `Reset to default`
- Findings:
  - both controls were exposed as small inline text actions instead of clear button-like controls
  - Expo Web showed weak hit areas and semantics for assistive tech compared with the primary actions on the same screen
- Change made:
  - restyled the API key visibility toggle and Base URL reset action as bordered pill buttons with a 44px minimum height
  - added descriptive accessibility labels/hints so the controls are announced as clear buttons
  - extended `apps/mobile/tests/connection-settings-validation.test.js` with regression coverage for the new accessibility/touch-target guardrails
- Verification:
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `node --test apps/mobile/tests/connection-settings-validation.test.js`
  - live Expo Web verification at `http://localhost:8091`:
    - confirmed `Show API key` / `Hide API key` are exposed as buttons and toggle the input masking correctly
    - confirmed `Reset base URL to default` is exposed as a button and restores `https://api.openai.com/v1`
    - confirmed both inline actions render at 44px height after the change
- Follow-up checks:
  - investigate why `Scan QR Code` does not surface a visible scanner modal in Expo Web, so the web flow remains nonfunctional there
  - investigate the unrelated Settings warning after reconnecting: `⚠️ Failed to load: settings`
  - investigate the Expo Web runtime errors noted in earlier passes, especially `normalizeApiBaseUrl is not a function` and `Unexpected text node ... child of a <View>`

### 2026-03-07 — Iteration 2: stop misleading empty-key saves on Connection

- Status: completed
- Area:
  - first-run validation and save feedback in `apps/mobile/src/screens/ConnectionSettingsScreen.tsx`
  - live flow inspected in Expo Web: `Settings -> Connection -> Test & Save`
- Why this area:
  - the previous iteration already covered nested navigation in the same flow, and its follow-up notes pointed to ambiguous first-run connection feedback.
  - fresh Expo Web investigation reproduced a concrete usability bug: `Test & Save` could navigate away with no API key entered while leaving the app disconnected.
- What was investigated:
  - current `ConnectionSettingsScreen.tsx` save/validation logic
  - live Expo Web behavior for default OpenAI URL + empty API key
  - live Expo Web regression for a valid local server config (`http://localhost:3210/v1` + API key)
- Findings:
  - the screen defaulted an empty base URL to OpenAI and then allowed save/navigation when no API key was present on a disconnected first run
  - this looked like a successful save even though the app remained unusable and `Go to Chats` stayed disabled
- Change made:
  - added a first-run guard so disconnected users cannot save the default connection screen without providing an API key
  - the screen now stays in place and shows: `Enter an API key or scan a DotAgents QR code before saving`
  - added a lightweight regression test in `apps/mobile/tests/connection-settings-validation.test.js`
- Verification:
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `node --test apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-validation.test.js`
  - live Expo Web verification at `http://localhost:8082`:
    - left API key empty with default base URL and confirmed the screen stayed put with the new inline error
    - entered `http://localhost:3210/v1` plus `test-key` and confirmed save still returns to `Settings` with `Connected`
- Follow-up checks:
  - audit accessibility semantics for text-only actions in Connection (`Show/Hide`, `Reset to default`, scanner close) because Expo Web exposed them weakly in the accessibility tree
  - investigate the unrelated Settings warning after reconnecting: `⚠️ Failed to load: settings`
  - investigate the Expo Web runtime errors noted in the prior iteration, especially `normalizeApiBaseUrl is not a function` and `Unexpected text node ... child of a <View>`

### 2026-03-07 — Iteration 1: restore nested-screen back navigation

- Status: completed
- Area:
  - mobile navigation header behavior in `apps/mobile/App.tsx`
  - live flow inspected in Expo Web: `Settings -> Connection -> back`
- Why this area:
  - `ui-audit.md` already covered recent mobile Settings layout work, so this pass avoided repeating those top-level responsiveness fixes.
  - Expo Web inspection exposed a functional first-run usability bug on an unlogged secondary screen: opening `Connection` removed any usable in-app back navigation.
- What was investigated:
  - current mobile web/dev workflow via `pnpm --filter @dotagents/mobile web`
  - stack header config in `apps/mobile/App.tsx`
  - live Expo Web behavior on the initial `Settings` screen and nested `Connection` screen
- Findings:
  - the stack navigator set a custom `headerLeft` logo for every screen, which suppressed the default native-stack back button on nested screens like `Connection`
  - on mobile web this trapped the user on secondary screens unless another path happened to navigate them away
- Change made:
  - kept the branded logo only on the root `Settings` screen
  - let nested screens fall back to the default back button/header behavior
  - added a lightweight regression test in `apps/mobile/tests/navigation-header.test.js`
- Verification:
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `node --test apps/mobile/tests/navigation-header.test.js`
  - live Expo Web regression check at `http://localhost:8088`:
    - opened `Connection settings`
    - confirmed a visible back control on `Connection`
    - confirmed it returns to `Settings`
- Follow-up checks:
  - inspect `ConnectionSettingsScreen.tsx` for clearer first-run save/test feedback when the API key is empty; current `Test & Save` behavior is ambiguous
  - audit web accessibility/tap targets for text-only actions in Connection and TTS voice picker flows (`Show/Hide`, `Reset to default`, modal close, voice rows)
  - investigate the Expo Web runtime errors seen during verification, especially `normalizeApiBaseUrl is not a function` and `Unexpected text node ... child of a <View>`

## Candidate Areas

- Connection screen accessibility semantics and tap targets
- Session list navigation and empty/loading states
- Chat composer responsiveness and accessibility
- Expo Web runtime warnings/errors and web-specific reliability

## Archived iterations from origin/main

The following notes were added independently on `origin/main` and are preserved here for reference.

Purpose: track investigation and incremental, shippable improvements to the Expo mobile app.

## Workflow notes
- Prefer existing scripts and run app in Expo Web for repeatable inspection.
- Focus one concrete, user-visible improvement per iteration.
- Add targeted tests and verification for each code change.

## Iteration Log

### 2026-03-07 - Iteration 1
- Status: Shipped.
- Area selected: Settings screen toggle accessibility (screen-reader clarity).
- Investigation notes:
  - Used existing Expo Web workflow: `pnpm --filter @dotagents/mobile exec expo start --web --port 19007`.
  - Audited no-auth flows in web: Settings, Connection Settings, Sessions, Chat.
  - Found multiple unlabeled `Switch` controls announced as generic switches.
  - Highest-value immediate fix was on toggles users hit most in Settings plus MCP server toggles when available.
- Change made:
  - Added `apps/mobile/src/lib/accessibility.ts` with normalized label builders:
    - `createSwitchAccessibilityLabel(settingName)`
    - `createMcpServerSwitchAccessibilityLabel(serverName)`
  - Wired explicit accessibility labels in `apps/mobile/src/screens/SettingsScreen.tsx` for:
    - Hands-free Voice Mode
    - Text-to-Speech
    - Message Queuing
    - Push Notifications
    - Dynamic MCP server switches
  - Added `apps/mobile` test script in `package.json` (`vitest run`) and declared `vitest` devDependency.
- Tests/verification:
  - Added `apps/mobile/src/lib/accessibility.test.ts` (5 unit tests for label generation + fallbacks).
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅
  - Re-verified in Expo Web DOM that switches expose `aria-label` values (e.g., `Hands-free Voice Mode toggle`).
- Next checks:
  - Add labels/hints for remaining remote-settings toggles (Streamer Mode, STT/TTS advanced, Tool Execution, WhatsApp/Langfuse).
  - Audit touch targets and keyboard navigation order in Settings sections with many controls.
  - Validate dynamic type / larger text behavior on Settings and Chat composer in Expo Web.

### 2026-03-07 - Iteration 2
- Status: Shipped.
- Area selected: Chat composer control semantics (screen-reader and keyboard accessibility).
- Investigation notes:
  - Confirmed existing mobile web workflow and used repo script: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Investigated Chat flow in Expo Web (`Connection settings` -> `Test & Save` -> `Go to Chats` -> `+ New Chat`).
  - Inspected composer controls in DOM/accessibility tree:
    - Image attach already exposed as labeled button.
    - TTS emoji toggle was interactive but exposed as generic element without proper switch semantics/state.
    - Send control lacked explicit accessibility metadata consistency.
- Change made:
  - Extended `apps/mobile/src/lib/accessibility.ts` with `createButtonAccessibilityLabel(actionName)` to keep action button labels normalized and testable.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` composer controls:
    - TTS toggle now has explicit switch semantics (`accessibilityRole="switch"`, labeled as `Text-to-Speech toggle`, plus state via `accessibilityState` and `aria-checked`).
    - Send control now has explicit button semantics (`accessibilityRole="button"`, stable label/hint, disabled state metadata).
  - Expanded unit tests in `apps/mobile/src/lib/accessibility.test.ts` for the new button label helper.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (8 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web that TTS now exposes `role="switch"` and `aria-checked` transitions (`false -> true -> false`) and Send is exposed as a labeled button with disabled semantics.
- Next checks:
  - Validate Chat composer behavior and readability under large text scaling/dynamic type.
  - Audit message action affordances (copy, speak, expand/collapse) for keyboard-only navigation order.
  - Review chat header icon-only controls (new chat, emergency stop, settings) for minimum touch target size and descriptive accessibility hints.

### 2026-03-07 - Iteration 3
- Status: Shipped.
- Area selected: Chat header icon controls (touch-target reliability and switch semantics).
- Investigation notes:
  - Reused existing Expo Web workflow: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Investigated Chat header controls in Expo Web after navigating `Connection settings -> Test & Save -> Go to Chats -> New Chat`.
  - Measured controls in DOM and found multiple undersized/tightly packed targets in header actions:
    - New chat: ~`29.68 x 33.5`
    - Hands-free: ~`40 x 36`
    - Settings: ~`42 x 35.5`
  - Concrete risk: destructive Emergency Stop was adjacent to small controls with no spacing, increasing accidental-tap likelihood.
- Change made:
  - Added `createMinimumTouchTargetStyle` in `apps/mobile/src/lib/accessibility.ts` to centralize minimum hit-target sizing/spacing for tappable controls.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` header controls to use shared touch-target styles:
    - Back / New chat / Emergency stop / Hands-free / Settings now use minimum 44x44 targets.
    - Added small horizontal spacing between header controls to reduce mis-taps.
  - Improved header accessibility metadata:
    - Added descriptive `accessibilityHint` for back, new chat, emergency stop, and settings.
    - Converted hands-free header control from generic button semantics to switch semantics (`accessibilityRole="switch"`, `accessibilityState`, `aria-checked`) with stable label.
  - Expanded `apps/mobile/src/lib/accessibility.test.ts` with touch-target helper tests.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (10 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web/Playwright that right-side header actions now render at `>=44x44`, include spacing, and hands-free exposes switch semantics with `aria-checked` transitions (`false -> true -> false`).
- Next checks:
  - Validate Chat composer under larger text scaling to ensure input/send/mic controls remain usable without overlap.
  - Audit message-level actions (expand/collapse tool details, speak, copy) for keyboard/tab order and explicit hints.
  - Review Session list header actions for the same minimum touch-target guardrail.

### 2026-03-07 - Iteration 4
- Status: Shipped.
- Area selected: Connection Settings quick actions + form field accessibility.
- Investigation notes:
  - Reused existing Expo Web workflow: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Audited initial setup flow with keyboard/accessibility focus on the Connection Settings screen.
  - Found small quick-action controls and missing explicit input labels:
    - API key `Show/Hide` and `Reset to default` controls were previously tiny and under-labeled.
    - API key and Base URL inputs depended on placeholder text for naming.
- Change made:
  - Extended `apps/mobile/src/lib/accessibility.ts` with `createTextInputAccessibilityLabel(fieldName)` for stable form-input naming.
  - Updated `apps/mobile/src/screens/ConnectionSettingsScreen.tsx`:
    - Added explicit button semantics/labels/hints for API key `Show/Hide` and `Reset to default` actions.
    - Enforced minimum 44px touch targets for those inline actions via `createMinimumTouchTargetStyle`.
    - Added explicit input accessibility labels/hints for API key and Base URL fields.
  - Expanded `apps/mobile/src/lib/accessibility.test.ts` with coverage for the new input-label helper.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (13 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web DOM/accessibility tree:
    - API key `Show/Hide` now exposes descriptive button labels and `44px` height (`46.86x44`, `44x44`).
    - `Reset to default` now exposes a descriptive button label and `44px` height (`105.54x44`).
    - API key/Base URL now expose explicit input labels (`API key input`, `Base URL input`) rather than placeholder-only naming.
- Next checks:
  - Apply the same minimum touch-target guardrail to Sessions screen actions (`+ New Chat`, `Clear All`, top-right settings icon).
  - Improve message-level expand/collapse controls in Chat to reduce keyboard tab friction and add clearer labels.
  - Validate Connection Settings with larger text scaling to ensure inline actions do not wrap/overlap.

### 2026-03-07 - Iteration 5
- Status: Shipped.
- Area selected: Sessions list action controls (tap reliability + action semantics).
- Investigation notes:
  - Reused existing Expo Web workflow: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Audited Sessions screen controls with Playwright automation after navigating to Chats.
  - Measured undersized touch targets before changes:
    - `+ New Chat`: `110.01 x 32.5`
    - `Clear All`: `77.72 x 32.5`
    - Header settings icon: `44 x 38.5`
  - All controls were labeled and keyboard-focusable, but each missed the `>=44x44` minimum touch target guideline.
- Change made:
  - Updated `apps/mobile/src/screens/SessionListScreen.tsx` to use shared touch-target guardrails via `createMinimumTouchTargetStyle`:
    - `+ New Chat`, `Clear All`, and header settings now render with minimum `44px` height/width.
    - Added explicit descriptive button labels/hints for these actions with `createButtonAccessibilityLabel` for stable semantics.
  - Added targeted regression test in `apps/mobile/src/lib/accessibility.test.ts` to verify explicit `horizontalMargin: 0` overrides are respected by `createMinimumTouchTargetStyle`.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (14 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web/Playwright after fix:
    - `+ New Chat`: `102.01 x 44`
    - `Clear All`: `77.72 x 44`
    - Header settings icon: `44 x 44`
    - All now meet `>=44x44` touch target guidance.
- Next checks:
  - Improve message-level Chat actions (copy/speak/expand) with clearer labels/hints and keyboard order audit.
  - Validate large-text/dynamic-type behavior on Sessions list rows and Rapid Fire footer controls.
  - Audit destructive actions (`Delete Session`, `Clear All`) for confirmation copy consistency and accidental-tap safeguards.

### 2026-03-07 - Iteration 6
- Status: Shipped.
- Area selected: Chat message/tool disclosure controls (screen-reader naming + expanded-state semantics).
- Investigation notes:
  - Reused existing Expo Web workflow from repo scripts: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Investigated Chat flow with browser automation and keyboard traversal on message-level controls.
  - Confirmed ambiguous semantics before fix:
    - Message/tool disclosure controls relied on icon text or hints, with missing explicit labels on key toggles.
    - Expanded/collapsed state was not consistently exposed as `aria-expanded` on web for disclosure actions.
- Change made:
  - Extended `apps/mobile/src/lib/accessibility.ts` with `createExpandCollapseAccessibilityLabel(targetName, isExpanded)` for normalized disclosure labels with fallback handling.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` disclosure controls:
    - Collapsible message header now has explicit label (`Expand message` / `Collapse message`) and explicit `aria-expanded` state.
    - Collapsed tool execution summary row now has explicit button semantics, descriptive label, hint, and `aria-expanded={false}`.
    - Per-tool details header now has explicit label (`Expand/Collapse <tool> tool details`) and explicit `aria-expanded` transitions.
  - Expanded `apps/mobile/src/lib/accessibility.test.ts` with coverage for the new disclosure-label helper.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (17 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web automation:
    - Message disclosure toggle exposes `role="button"`, label transitions (`Expand message`/`Collapse message`), and `aria-expanded` toggles (`false`/`true`).
    - Tool summary disclosure row exposes `role="button"`, `aria-label="Expand tool execution details"`, and `aria-expanded="false"`.
    - Tool detail headers expose descriptive labels (for example `Expand execute_command tool details`) with `aria-expanded` transitions (`false -> true`).
- Next checks:
  - Add a dedicated per-message `Copy` action in Chat (currently missing from message action row) with keyboard and screen-reader semantics.
  - Apply minimum `44x44` touch-target guardrails to Chat message-level actions (`Read aloud`, collapse toggles, and tool disclosure row).
  - Add explicit accessibility label/hint to the Chat composer text input for keyboard/screen-reader clarity.

### 2026-03-07 - Iteration 7
- Status: Shipped.
- Area selected: Chat composer text input semantics (stable naming + discoverable hint text).
- Investigation notes:
  - Reused existing Expo Web workflow from repo scripts: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Audited Chat composer input in Expo Web accessibility tree after navigating to Chat.
  - Confirmed composer `TextInput` was exposed as a `textbox` with no explicit input label or description attributes.
  - Accessible name was derived from placeholder text only (`Type or hold mic` / `Type or tap mic` / `Listening…`), causing the announced field name to shift with mode state.
- Change made:
  - Extended `apps/mobile/src/lib/accessibility.ts` with `createChatComposerAccessibilityHint({ handsFree, listening, isWeb })` for consistent mode-aware hint text and keyboard-send guidance on web.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` composer input:
    - Added explicit input label via `createTextInputAccessibilityLabel('Message composer')`.
    - Added dynamic `accessibilityHint` using the shared helper.
    - Added web `aria-describedby` linkage to a hidden hint text node (`chat-composer-hint`) so description text is exposed in Expo Web accessibility tooling.
  - Expanded `apps/mobile/src/lib/accessibility.test.ts` with dedicated tests for `createChatComposerAccessibilityHint`.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (21 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web automation:
    - Composer now exposes `aria-label="Message composer input"`.
    - Composer now exposes `aria-describedby="chat-composer-hint"` with state-aware hint text.
    - Accessible name remains stable while placeholders change for hands-free state (`Type or hold mic` ↔ `Type or tap mic`).
- Next checks:
  - Add explicit live-region semantics for listening/transcription status so voice-state changes are announced without focus changes.
  - Apply minimum `44x44` touch-target guardrails to Chat message-level actions (`Read aloud`, collapse toggles, and tool disclosure row).
  - Add a dedicated per-message `Copy` action in Chat with clear labels/hints and keyboard order validation.

### 2026-03-07 - Iteration 8
- Status: Shipped.
- Area selected: Voice listening/transcription announcements (live-region semantics in Chat composer flow).
- Investigation notes:
  - Reused existing Expo Web workflow from repo scripts: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Re-audited Chat voice flow in Expo Web (`Go to Chats` -> `+ New Chat`) and inspected accessibility tree/DOM updates during mic hold/release.
  - Confirmed pre-fix gap: dynamic voice state text (`Listening...`, `Release to send/edit`, transcript preview updates) changed visually but did not use any live region semantics, so screen readers would not reliably announce state transitions.
- Change made:
  - Extended `apps/mobile/src/lib/accessibility.ts` with `createVoiceInputLiveRegionAnnouncement(...)`:
    - Normalizes voice/transcript announcements.
    - Includes mode-aware guidance (`Release to send`, `Release to edit`, or `Tap mic again to stop`).
    - Falls back to `Voice input ready.` when idle.
    - Truncates very long transcript text for concise announcements.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx`:
    - Added hidden web live-region node (`nativeID: chat-voice-status-live-region`) with `aria-live="polite"` and `accessibilityLiveRegion="polite"`.
    - Wired live-region content to current voice state (`listening`, `handsFree`, `willCancel`, `liveTranscript`, `sttPreview`) so updates are announced without moving focus.
  - Expanded `apps/mobile/src/lib/accessibility.test.ts` with focused coverage for the new helper.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (26 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web automation:
    - `#chat-voice-status-live-region` now exposes `aria-live="polite"`.
    - Live-region text transitions observed across voice states:
      - `Voice input ready.`
      - `Voice listening active. Release to send your message.`
      - `Voice listening active... Transcript: ...`
      - `Voice input captured. Transcript: ...`
- Next checks:
  - Add explicit accessibility label/hint and stable role semantics to the main Chat mic `Pressable` (currently focusable but easy to interpret ambiguously in assistive tech).
  - Apply minimum `44x44` touch-target guardrails to Chat message-level actions (`Read aloud`, collapse toggles, tool disclosure row).
  - Add a dedicated per-message `Copy` action in Chat with clear labels/hints and keyboard-order validation.

### 2026-03-07 - Iteration 9
- Status: Shipped.
- Area selected: Chat composer main mic control semantics (assistive-tech clarity and state exposure).
- Investigation notes:
  - Reused existing Expo Web workflow from repo scripts: `pnpm --filter @dotagents/mobile web --port 19007`.
  - Navigated through setup and verified in an active Chat thread (`Connection settings -> Test & Save -> Go to Chats -> + New Chat`).
  - Confirmed pre-fix gap in Expo Web accessibility tree/DOM:
    - Chat mic control was keyboard-focusable but had no explicit role/label metadata, so assistive tech relied on changing emoji/text (`🎤 Hold` / `🎤 Talk`) for naming.
    - Mode and listening state instructions were not explicit on the control itself.
- Change made:
  - Extended `apps/mobile/src/lib/accessibility.ts` with mic-specific helpers:
    - `createMicControlAccessibilityLabel()` for stable, explicit control naming.
    - `createMicControlAccessibilityHint(...)` for mode-aware guidance (push-to-talk, hands-free, release-to-edit/send behavior).
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` main mic `Pressable` to include:
    - `accessibilityRole="button"`
    - stable `accessibilityLabel` via shared helper
    - dynamic `accessibilityHint` via shared helper
    - explicit busy state via `accessibilityState={{ busy: listening }}` and `aria-busy`
  - Expanded `apps/mobile/src/lib/accessibility.test.ts` with dedicated tests for the new mic helpers.
- Tests/verification:
  - Ran: `pnpm --filter @dotagents/mobile test src/lib/accessibility.test.ts` ✅ (31 tests).
  - Ran: `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅.
  - Re-verified in Expo Web automation on ChatScreen mic (not Sessions Rapid Fire):
    - Mic now renders as `button` with `aria-label="Voice input microphone button"` in both hands-free OFF and ON states.
    - `aria-busy` transitions correctly during listening (`false -> true -> false`) in both hands-free tap mode and push-to-talk hold/release mode.
- Next checks:
  - Apply minimum `44x44` touch-target guardrails to Chat message-level actions (`Read aloud`, collapse toggles, tool disclosure row).
  - Add a dedicated per-message `Copy` action in Chat with clear labels/hints and keyboard-order validation.
  - Validate large-text/dynamic-type behavior for Chat composer controls (attach/TTS/edit-before-send/send) to avoid overlap/wrapping regressions.
