# Mobile App Improvement Ledger

## Purpose

- Track mobile investigations, fixes, regressions, and next checks.
- Prefer one small, shippable improvement per iteration.
- Use Expo Web when practical for repeatable inspection.

## Coverage Map

### Checked screens/flows

- [x] Settings root screen and nested back navigation
- [x] Connection setup flow, save validation, and inline connection actions
- [x] Connection Settings screen back navigation, header affordance, QR scanner modal, save confirmation, and empty-save validation in Expo Web (`390x844` CSS viewport, matched screenshots)
- [x] Sessions list entry points, top actions, and empty state
- [x] Chat thread composer controls, voice/listening announcements, and disclosure states
- [x] Settings home disconnected-state Chats entry point and offline helper copy in Expo Web (`390x844` mobile viewport)
- [x] Disconnected `Chats -> + New Chat` composer helper copy, blocked send state, and pre-send guidance in Expo Web (`390x844` mobile viewport)
- [x] Settings -> Text-to-Speech voice picker modal close/action surface in Expo Web (connected desktop-settings runtime, `390x844` mobile viewport)
- [x] Settings -> Agent Loops list row actions (source-backed in this worktree)
- [x] Loop create/edit screen agent-profile selection section (source-backed in this worktree)
- [x] Agent create/edit screen (`AgentEdit`) connection-type selection and mode-specific fields (source-backed in this worktree)
- [x] Memory create/edit screen (`MemoryEdit`) importance selection section (source-backed in this worktree)
- [x] Settings desktop partial-load warning / retry state (source-backed in this worktree)

### Settings parity checklist vs desktop

- [~] Desktop `Models -> Choose a Provider for Each Job`: mobile exposes the main STT / Agent-MCP / TTS provider selectors inside `Settings -> Desktop Settings`, but broader runtime coverage across every provider combination is still incomplete.
- [~] Desktop `Models -> Speech & Voice Models`: mobile exposes TTS model and voice pickers plus the OpenAI-compatible endpoint/model selectors. This iteration improved the TTS voice picker close affordance on mobile web, but the picker trigger itself still needs deeper Expo Web semantics validation and the remaining model/preset pickers are only partially checked.
- [ ] Desktop `Providers -> Provider Setup`: desktop still owns API keys, provider-specific base URLs, local engine downloads, and quick diagnostics; mobile currently covers remote server connection (`Connection settings`) but does not yet show verified parity for provider setup controls.
- [-] Desktop-only window/general controls: launch-at-login, panel/window behavior, and desktop hotkeys are intentionally desktop-specific and should remain documented as non-mobile parity items rather than backlogged mobile gaps.

### Not yet checked

- [ ] Memory create/edit loading, error, and runtime layout states beyond the importance selector
- [ ] Agent create/edit remaining fields and built-in-agent limited-edit state outside the connection-type section
- [ ] Loop create/edit live save flow, runtime layout, and remaining fields
- [ ] Session loading, error, reconnect, and sync states
- [ ] Remaining disconnected/offline chat states after entering `Chats` beyond the new-chat text-send guard (existing-chat retry/reconnect, mic/handsfree affordances, and sync states)
- [ ] Remaining modal/sheet surfaces on narrow web viewports beyond the Settings TTS voice picker and initial Connection Settings QR/save pass (model picker, endpoint picker, agent selector, broader destructive confirmations)
- [ ] Large-text / awkward viewport behavior across Settings, Sessions, Chat, and edit screens

### Reproduced

- [x] Missing in-place CTA on the session empty state
- [x] Undersized chat composer send/accessory controls and missing web state semantics
- [x] Weak Connection inline action affordances
- [x] Connection Settings header back button rendered as a 30x30 touch target on mobile web
- [x] Connection Settings header back button still read like a bare screen-edge arrow after the 44px touch-target fix
- [x] Undersized Agent Loops `Run` / `Delete` actions in Settings source
- [x] LoopEdit profile selection chips crowd narrow screens and hide selected state behind color alone
- [x] AgentEdit connection-type chips crowd narrow screens, hide selected state behind color alone, and wrongly treat ACP like a remote URL mode
- [x] MemoryEdit importance chips crowd narrow screens and communicate priority mostly through color-only state
- [x] Settings desktop warning state squeezed long partial-load errors and a tiny text-only `Retry` action into one horizontal row
- [x] Settings -> Text-to-Speech voice picker showed a plain small `Close` action and weak picker semantics on narrow Expo Web
- [x] Settings home disabled `Go to Chats` on the disconnected default screen, stranding users away from saved chats/history with no explanation
- [x] Disconnected `Chats -> + New Chat` let users type and attempt `Send` with no usable connection config, then surfaced a raw 401-style failure plus generic retry/internet guidance

### Improved

- [x] Nested-screen back navigation
- [x] Connection first-run validation and inline action affordances
- [x] Connection Settings header back-button touch target and visual affordance on nested screens
- [x] Chat composer actions, toggles, and voice-state accessibility
- [x] Session empty-state CTA and narrow-layout guardrails
- [x] Agent Loops row action clarity, touch targets, and destructive-action affordance
- [x] LoopEdit profile selection clarity, default-agent fallback copy, and touch targets
- [x] AgentEdit connection-type clarity, touch targets, and ACP/remote field mapping
- [x] MemoryEdit importance selection clarity, touch targets, and priority guidance
- [x] Settings desktop partial-load warning clarity, retry affordance, and stale-data explanation
- [x] Settings -> Text-to-Speech voice picker close affordance plus source-level picker semantics/touch-target guardrails
- [x] Settings home Chats access and offline-state explanation on the disconnected default screen
- [x] Disconnected `Chats -> + New Chat` composer honesty, blocked-send behavior, and first-run guidance before failure

### Verified

- [x] Source-backed regression coverage for navigation, connection validation, chat composer accessibility, session empty state, agent loop row actions, LoopEdit profile selection, AgentEdit connection types, MemoryEdit importance selection, and the Settings desktop warning state
- [x] Live Expo Web before/after evidence for the Connection Settings header back-button touch-target fix at `390x844` CSS viewport
- [x] Live Expo Web before/after evidence for the Connection Settings header back-button visual affordance follow-up at `390x844`
- [x] Live Expo Web before/after evidence for the Settings -> Text-to-Speech voice picker close affordance at `390x844`
- [x] Live Expo Web before/after evidence for the disconnected Settings-home chats CTA at `390x844`
- [x] Executable vitest coverage plus a fresh Expo Web tap-through recheck for the disconnected `Settings -> Open Chats` CTA on mobile web
- [x] Live Expo Web before/after evidence plus focused send-availability coverage for disconnected `Chats -> + New Chat` at `390x844`

### Blocked

- [ ] No active runtime blocker at the moment: Expo Web is available in this worktree after rebuilding `packages/shared`.

### Still uncertain

- [ ] Expo Web still reports the TTS voice trigger and picker rows as generic focusable `DIV`s despite the new source-level picker semantics; verify whether this is a React Native Web limitation or a control-specific wiring gap before claiming full web a11y parity.
- [ ] The Connection Settings QR scanner close button measured about `66.7x43` CSS px in Expo Web during this pass, so the close affordance likely still deserves its own touch-target check before calling that modal fully tuned.
- [ ] Narrow-screen usability of the rest of `MemoryEdit` and the remaining `AgentEdit` / `LoopEdit` fields outside the newly checked sections
- [ ] The disconnected new-chat text-send path is now guarded, but mic/handsfree send affordances plus existing-chat retry/reconnect states still need their own dedicated offline runtime passes before claiming solid chat-offline coverage.

## Recent Iterations

### 2026-03-11 — Iteration 16: block disconnected new-chat sends before they fail opaquely

- Status: completed with live Expo Web before/after evidence, a targeted disconnected-chat UX fix, and focused regression coverage
- Area:
  - disconnected `Chats -> + New Chat` composer/send state in `apps/mobile/src/screens/ChatScreen.tsx`
  - new pure helper coverage in `apps/mobile/src/screens/chat-send-availability.ts`
- Why this area:
  - the ledger explicitly called out the post-`Open Chats` disconnected flow as still uncertain, so this was the highest-value next coverage expansion instead of another pass on already-tuned settings chrome
  - live Expo Web inspection found a concrete first-run/offline reliability problem: mobile let users type into a brand-new disconnected chat, tap `Send`, and only then discover a raw 401-style failure with guidance that blamed internet/retry conditions instead of missing connection setup
- What was investigated:
  - Expo Web at `390x844` through `Settings -> Open Chats -> + New Chat` on the default disconnected state
  - `apps/mobile/src/screens/ChatScreen.tsx` send gating, composer affordances, and error/debug messaging
  - existing mobile test patterns that could protect disconnected send availability without broad refactors
- Findings:
  - the disconnected `+ New Chat` flow showed no inline warning before send, kept the `Send` button active after typing, and then surfaced a raw 401-style failure after the user tried to send without a configured API key
  - the problem was larger than a single button state because any send path that reached `send()` while disconnected/no-config could fall through to confusing network/auth errors instead of a clear setup requirement
  - mobile already had the right product intent on the Settings home (`Open Chats` is fine while offline, but sending needs connection); the chat composer simply was not enforcing or explaining that intent yet
- Change made:
  - added `apps/mobile/src/screens/chat-send-availability.ts` to centralize the disconnected send-config check plus the helper/accessibility copy for the composer send state
  - updated `apps/mobile/src/screens/ChatScreen.tsx` to short-circuit `send()` when no connection config is present, keep the typed draft intact, show an inline composer notice, switch the composer placeholder to setup-focused guidance, and disable `Send` until the user both has content and a real connection config
  - added `apps/mobile/src/screens/chat-send-availability.test.ts`, updated `apps/mobile/package.json` so the focused vitest suite runs it, and tightened `apps/mobile/tests/chat-composer-accessibility.test.js` around the new disconnected send notice and disabled-state semantics
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8117 --clear`
  - `pnpm --filter @dotagents/mobile run test:vitest`
  - `node --test apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/chat-screen-density.test.js`
  - `git diff --check`
  - live Expo Web automation at `390x844` CSS viewport showing the typed disconnected new-chat state before/after the fix
- Follow-up checks:
  - inspect disconnected existing-chat retry/reconnect behavior next so the offline coverage map continues past the new-chat text path
  - do a dedicated mic/handsfree disconnected pass, since the central send guard now covers it in source but the voice affordance copy/flow still needs live runtime validation

Evidence
- Evidence ID: chat-disconnected-send-guard
- Scope: disconnected `Chats -> + New Chat` composer/send state on mobile web (`apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/screens/chat-send-availability.ts`)
- Commit range: 329351ba2e379046fad1e2617d742ff192d6f545..bd572eb1778dc3aa7498d33efc3ba9f22ef5f92a
- Rationale: The disconnected `Open Chats` fix made chat history reachable offline, but the very next uncovered step still let a first-run user type into a brand-new chat, tap `Send`, and only then hit a raw 401-style failure. Guarding that state in the composer is a clearer, more actionable mobile experience because it explains the real prerequisite before the user trips a confusing error path.
- QA feedback: Addressed the previously unresolved `settings-offline-open-chats` review findings in the remediation block below; this disconnected new-chat send guard itself is a new iteration.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--new-chat-ready--20260311.png` — `390x844` CSS viewport on Expo Web. Before this change, the disconnected `+ New Chat` screen let the user type a draft with an apparently actionable `Send` button and no inline explanation that connection setup was still required. `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--send-error--20260311.png` — same `390x844` viewport after tapping `Send`, showing the raw 401-style failure and generic retry/internet messaging that made the missing-config problem feel like a runtime/server glitch.
- Change: Added a focused disconnected send-availability helper, blocked `ChatScreen` send attempts up front when `baseUrl`/`apiKey` are not both configured, surfaced an inline composer notice plus setup-focused placeholder/accessibility copy, and disabled `Send` until the composer has both content and usable connection settings.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--after--new-chat-ready--20260311.png` — same `390x844` CSS viewport on Expo Web. The disconnected new-chat composer now keeps the typed draft visible, shows an inline explanation that saved chats remain viewable while disconnected, and leaves `Send` disabled before any confusing auth/network failure can happen.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8117 --clear` ✅ (Expo Web live at `http://localhost:8117`); `pnpm --filter @dotagents/mobile run test:vitest` ✅; `node --test apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/chat-screen-density.test.js` ✅; `git diff --check` ✅; live Expo Web before/after screenshots captured at `390x844` ✅; typed disconnected `+ New Chat` recheck confirmed visible helper copy and disabled `Send` with no raw-error attempt required ✅.
- Blockers/remaining uncertainty: This pass verified the text-entry new-chat path while disconnected, but it did not yet do a live mic/handsfree pass or an existing-chat retry/reconnect pass after entering the chats surfaces.

### 2026-03-11 — QA remediation 2: harden disconnected Open Chats coverage and correct ledger provenance

- Status: completed with live Expo Web re-verification, stronger executable regression coverage, and ledger provenance correction
- Area:
  - disconnected `Settings` home `Open Chats` CTA verification in `apps/mobile/src/screens/SettingsScreen.tsx` and extracted helper `apps/mobile/src/screens/settings-home-chats-cta.tsx`
  - prior iteration 15 evidence provenance in `mobile-app-improvement.md`
- Why this area:
  - this area deserved an immediate revisit because unresolved QA flagged two concrete issues on the last pass: the evidence `Commit range` excluded the final authored docs/evidence commit, and the automated regression coverage only regex-checked source text instead of proving the disconnected CTA still rendered and remained pressable
  - the live user-facing behavior was already valuable and should stay approved only if the ledger provenance is truthful and the behavior is protected by an executable test, not just a brittle source snapshot
- What was investigated:
  - current disconnected `Settings` home CTA wiring in `SettingsScreen.tsx`
  - existing mobile vitest/node test patterns that could cover render/press behavior without adding new dependencies
  - live Expo Web behavior at `390x844`, including a fresh disconnected-state tap-through from `Open Chats` into the `Chats` surface
- Findings:
  - the current runtime behavior remained correct: Expo Web still showed an enabled `Open Chats` CTA plus the offline helper copy, and tapping it still reached the `Chats` screen while disconnected
  - QA was right that the prior automated coverage was too weak because it only matched source strings and would not fail if the CTA became non-interactive through different wiring
  - the prior `settings-offline-open-chats` Evidence block also under-reported the authored SHA span by stopping before the final docs/evidence commit
- Change made:
  - extracted the disconnected Settings-home chats entry into a small `SettingsHomeChatsCta` helper so the rendered CTA copy and press behavior can be verified directly without broad screen refactoring
  - added `apps/mobile/src/screens/settings-home-chats-cta.test.tsx`, which renders the disconnected state, verifies the `Open Chats` label and offline helper copy, confirms the CTA is not disabled, and asserts that pressing it triggers the navigation callback
  - updated `apps/mobile/package.json` so the mobile vitest suite includes the new executable regression test, kept the source-level wiring check in `apps/mobile/tests/settings-screen-density.test.js`, and corrected the prior evidence block commit range to the full reviewed span
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8116 --clear`
  - `pnpm --filter @dotagents/mobile run test:vitest`
  - `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/session-list-empty-state.test.js`
  - `git diff --check`
  - live Expo Web automation at `390x844` CSS viewport with a fresh disconnected Settings-home screenshot saved to `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--qa-r1--20260311.png` and a tap-through into `Chats`
- Follow-up checks:
  - continue the offline/disconnected coverage map by testing what happens after entering `Chats`, especially `+ New Chat`, composer send failure handling, and reconnect/sync states
  - keep prioritizing unchecked session/error/modal surfaces rather than revisiting this Settings CTA again without a new runtime regression signal

Evidence
- Evidence ID: settings-offline-open-chats
- Scope: QA remediation pass for the disconnected `Settings` home `Open Chats` CTA, executable coverage, and ledger provenance (`apps/mobile/src/screens/settings-home-chats-cta.tsx`, `mobile-app-improvement.md`)
- Commit range: 91c7db81c8bbafe55927771981e24acde4345568..329351ba2e379046fad1e2617d742ff192d6f545
- Rationale: The disconnected Settings-home CTA had already been improved in runtime, but QA correctly flagged that the review stack still lacked a formal remediation Evidence block and that the prior recorded commit range stopped short of the reviewed head. Adding the missing evidence pair and correcting the span keeps the mobile ledger truthful and makes the already-approved offline CTA change auditable.
- QA feedback: Addressed reviewer findings that the remediation pass lacked a proper Evidence block and that the earlier `settings-offline-open-chats` commit range stopped before the final reviewed SHA.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--before--settings-home--20260311.png` — `390x844` CSS viewport on Expo Web. This is the original blocked/disconnected Settings-home state that motivated the CTA fix: users saw `Not connected` plus a visible chats action, but the action remained disabled and gave no honest offline path into saved history.
- Change: Extracted the disconnected Settings-home chats CTA into a small helper so it could receive executable render/press coverage, added focused vitest coverage for the offline helper copy plus enabled press behavior, and corrected the ledger to report the full reviewed SHA span for that change stack.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--qa-r1--20260311.png` — same `390x844` CSS viewport on Expo Web during the QA remediation pass. The disconnected Settings home still shows an enabled `Open Chats` CTA with the offline helper copy intact, and the remediation pass also live-verified that the CTA still tap-throughs into `Chats` while disconnected.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8116 --clear` ✅ (Expo Web live at `http://localhost:8116` during the remediation pass); `pnpm --filter @dotagents/mobile run test:vitest` ✅; `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/session-list-empty-state.test.js` ✅; `git diff --check` ✅; live Expo Web disconnected Settings-home screenshot captured and tap-through into `Chats` re-verified ✅.
- Blockers/remaining uncertainty: This remediation pass proved the `Open Chats` CTA stayed enabled and interactive, but it intentionally deferred the next uncovered offline gap inside `Chats` itself, which is why iteration 16 picks up the disconnected new-chat send flow above.

### 2026-03-11 — Iteration 15: unblock Chats from the disconnected Settings home

- Status: completed with live Expo Web evidence and targeted regression coverage
- Area:
  - default `Settings` home CTA on mobile web in `apps/mobile/src/screens/SettingsScreen.tsx`
  - disconnected first-run / offline entry path from `DotAgents` home into `Chats` at a `390x844` CSS viewport
- Why this area:
  - even though the settings root had already been checked, a fresh Expo Web pass found a new first-run/offline navigation problem worth a focused revisit: the home screen showed a primary `Go to Chats` action but hard-disabled it whenever the app was disconnected
  - that stranded users away from saved chats/history on mobile and weakened offline/disconnected-state coverage, which is a higher-value gap than further polishing already-tuned header chrome
- What was investigated:
  - live Expo Web startup via the existing repo workflow after rebuilding `packages/shared`
  - the default disconnected `Settings` home at `390x844`
  - current `Go to Chats` gating in `SettingsScreen.tsx` plus the destination `SessionListScreen.tsx` behavior to confirm the list itself does not require an active server connection just to render local sessions/history
- Findings:
  - the default screen rendered `Not connected` and still showed `Go to Chats`, but the CTA was disabled on the disconnected home screen in Expo Web
  - source review confirmed the button was gated directly on `config.baseUrl && config.apiKey`, even though `SessionListScreen` can render local sessions and empty-state UI without an active server connection
  - this made the default mobile home screen unnecessarily block offline review of saved chats/history and gave users little explanation about what was actually unavailable versus still safe to open
- Change made:
  - removed the disconnected-state disable guard from the Settings-home chats CTA so mobile users can still open `Chats` while offline/disconnected
  - changed the disconnected label from `Go to Chats` to `Open Chats` and added helper copy clarifying that saved chats remain viewable but sending new messages still requires a connection
  - extended `apps/mobile/tests/settings-screen-density.test.js` to lock the reachable disconnected CTA plus the new helper copy
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8115 --clear`
  - `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/session-list-empty-state.test.js`
  - `git diff --check`
  - live Expo Web automation at `390x844` CSS viewport with before/after screenshots of the Settings home and a post-change tap-through into `Chats`
- Follow-up checks:
  - inspect the disconnected `Sessions` and `Chat` flows next, especially empty/new-chat/send failure states, so offline coverage continues past the entry CTA instead of stopping at navigation
  - keep widening runtime coverage to session sync/error states or the remaining modal/sheet surfaces rather than returning to this same Settings CTA without a new regression signal

Evidence
- Evidence ID: settings-offline-open-chats
- Scope: disconnected `Settings` home chats CTA and offline helper copy on mobile web (`apps/mobile/src/screens/SettingsScreen.tsx`)
- Commit range: 91c7db81c8bbafe55927771981e24acde4345568..329351ba2e379046fad1e2617d742ff192d6f545
- Rationale: The default mobile home screen is both a first-run setup surface and an offline recovery surface. Leaving a visible primary `Go to Chats` action disabled there made the app feel more blocked than it really was, because users could not reach saved chats/history even though the chats list itself can render without an active server connection.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--before--settings-home--20260311.png` — `390x844` CSS viewport on Expo Web. Before this change, the disconnected `DotAgents` home showed `Not connected` and a visible `Go to Chats` CTA, but the button was disabled, which stranded users away from saved chats/history and did not explain what remained available offline.
- Change: Updated `apps/mobile/src/screens/SettingsScreen.tsx` so the chats CTA stays enabled while disconnected, renames the disconnected state to `Open Chats`, adds helper copy explaining offline access versus send limitations, and adds focused regression coverage in `apps/mobile/tests/settings-screen-density.test.js`.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--20260311.png` — same `390x844` CSS viewport on Expo Web. The disconnected Settings home now shows an enabled `Open Chats` action plus helper copy explaining that saved chats stay reachable while disconnected, which makes the offline/default-state navigation more honest and actionable.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8115 --clear` ✅ (Expo Web live at `http://localhost:8115`); `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/session-list-empty-state.test.js` ✅ (8/8 passing); `git diff --check` ✅; live Expo Web before/after screenshots captured ✅; live tap-through from `Open Chats` into the `Chats` screen while still disconnected ✅.
- Blockers/remaining uncertainty: This pass verified the offline/disconnected entry point into `Chats`, but it did not yet do a full disconnected runtime pass on new-chat creation, composer send failure handling, or session sync/reconnect states after entering the chats surfaces.

### 2026-03-11 — Iteration 14: make the Connection Settings back button read like a real mobile control

- Status: completed with live Expo Web evidence and targeted regression coverage
- Area:
  - `Connection Settings` nested-screen header back affordance in `apps/mobile/App.tsx`
  - the same `Settings -> Connection settings` narrow-web path at a `390x844` CSS viewport, revisited specifically because QA found the earlier touch-target fix still looked like a bare arrow at the screen edge
- Why this area:
  - the outstanding QA finding justified a focused revisit before widening coverage further: iteration 13 fixed the hit target, but the live control still under-signaled that it was actionable
  - this is still a primary exit/navigation control in the setup flow, so a small visual affordance upgrade has clear user value without broadening scope
- What was investigated:
  - live Expo Web startup via the existing repo workflow after rebuilding `packages/shared`
  - current `Connection Settings` header presentation at `390x844`
  - nearby mobile secondary-action styling already used in `ConnectionSettingsScreen.tsx`
- Findings:
  - the live back control still measured as a usable tap target after iteration 13, but visually rendered as a bare `←` with no label, fill, or border
  - on a narrow mobile web header, that made the escape action easy to parse as generic chrome instead of an explicit button
- Change made:
  - changed the shared non-root header back control to a bordered secondary pill with `← Back` content while preserving the 44px minimum touch-target helper
  - aligned the control with existing mobile secondary-action styling so the header affordance feels consistent with the rest of the app instead of bespoke chrome
  - extended `apps/mobile/tests/navigation-header.test.js` to lock the new label/icon split plus the bordered secondary treatment
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8114 --clear`
  - `node --test apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-density.test.js`
  - live Expo Web automation at `390x844` CSS viewport with before/after screenshots of `Connection Settings`
- Follow-up checks:
  - inspect the QR scanner modal close affordance next if another Connection-settings pass is justified
  - otherwise widen coverage to session loading/error/sync states or the remaining modal/sheet surfaces instead of continuing to polish this header without new evidence

Evidence
- Evidence ID: connection-settings-back-button-affordance
- Scope: `Settings -> Connection settings` nested-screen header back affordance on mobile web (`apps/mobile/App.tsx`)
- Commit range: 23866557bb3c7f1c8637f2fdf725653c151173dc..ca8211d0fa4ae1d628406c20ceabbf8c39543ebf
- Rationale: QA confirmed that iteration 13 fixed the touch-target size but still left the runtime control reading like a bare transparent arrow at the screen edge. This follow-up resolves the remaining actionability gap by making the same primary navigation control read as an explicit mobile button.
- QA feedback: Addressed the outstanding reviewer finding that iteration 13 improved hit-target size without improving visual affordance, and corrected the earlier `settings-voice-picker-close-affordance` ledger provenance to the connected desktop-settings runtime conditions.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-back-button-affordance--before--connection-settings-screen--20260311.png` — `390x844` CSS viewport on Expo Web. Before this change, the `Connection Settings` header control had the larger tap target from iteration 13 but still appeared as a plain `←` with no label, fill, or border, which under-signaled that it was the main escape action.
- Change: Updated the shared non-root stack-header back control in `apps/mobile/App.tsx` to render a bordered secondary pill with `← Back` content while preserving the minimum touch-target helper. Extended `apps/mobile/tests/navigation-header.test.js` to lock the new styling and content.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-back-button-affordance--after--connection-settings-screen--20260311.png` — same `390x844` CSS viewport on Expo Web. The `Connection Settings` header now shows `← Back` inside a light pill with a subtle border, so the primary nested-screen escape action reads as an explicit control instead of screen-edge chrome.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8114 --clear` ✅ (Expo Web live at `http://localhost:8114`); `node --test apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-density.test.js` ✅ (4/4 passing); live Expo Web before/after screenshots captured ✅.
- Blockers/remaining uncertainty: This pass specifically resolved the back-button affordance gap. The adjacent QR scanner modal close control still merits its own touch-target/visual pass, and broader session/error-state coverage remains open.

### 2026-03-11 — Iteration 13: make the Connection Settings back button reliably tappable on mobile web

- Status: completed with live Expo Web evidence and targeted regression coverage
- Area:
  - `Connection Settings` header back affordance in `apps/mobile/App.tsx`
  - reachable first-run/disconnected flow from `Settings -> Connection settings` plus adjacent runtime checks for the QR scanner modal, save confirmation, and empty-save validation at a `390x844` CSS viewport on Expo Web
- Why this area:
  - the ledger still had modal/state coverage to widen outside the already-polished TTS picker work, and live Expo Web inspection of an under-checked settings flow found a fresh primary-navigation issue worth shipping immediately
  - on the narrow mobile web pass, the nested-screen back affordance in `Connection Settings` rendered as only `30x30`, which undercut a core escape/navigation action users hit repeatedly while configuring the app
- What was investigated:
  - live Expo Web startup via the existing repo workflow after rebuilding `packages/shared`
  - the disconnected `Settings` surface, `Connection Settings`, `Scan QR Code` modal, `Save settings now` confirmation state, and `Test & Save` empty-validation error state
  - current global stack header wiring in `apps/mobile/App.tsx` plus nearby shared touch-target patterns already used in `ChatScreen.tsx`
- Findings:
  - the default nested-screen header back affordance on Expo Web measured `30x30`, below the 44px touch-target guardrail already used elsewhere in the mobile app
  - the rest of the inspected `Connection Settings` flow remained reachable and stable on web: QR scanner modal opened, save confirmation appeared, and empty-save validation showed the expected inline error
  - the QR scanner close button is close to acceptable but still measured slightly short at about `66.7x43`, so that modal should get its own follow-up pass instead of being overclaimed as fully tuned
- Change made:
  - replaced the default nested-screen back affordance with a shared custom `Go back` header button for non-root screens in `apps/mobile/App.tsx`
  - sized that control with `createMinimumTouchTargetStyle({ horizontalPadding: 12, horizontalMargin: 0 })` so nested mobile headers inherit a reliable 44px minimum tap target instead of the tiny default web hit area
  - extended `apps/mobile/tests/navigation-header.test.js` to lock the new nested-screen back-button semantics and touch-target helper usage
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8104 --clear`
  - `node --test apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-density.test.js`
  - live Expo Web automation at `390x844` CSS viewport with before/after screenshots of `Connection Settings`
  - exploratory `pnpm --filter @dotagents/mobile exec tsc --noEmit` (still fails on pre-existing unrelated `apps/mobile/src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` errors)
- Follow-up checks:
  - inspect the QR scanner modal close affordance next so the entire Connection Settings modal/escape path meets the same touch-target bar
  - return to the blocked desktop-backed settings pickers only once the reachable disconnected-state flow is exhausted or a higher-value parity path becomes available
  - keep widening runtime coverage to session loading/error/sync states and large-text/awkward viewport behavior instead of repeatedly polishing the same header area

Evidence
- Evidence ID: connection-settings-back-button-touch-target
- Scope: `Settings -> Connection settings` nested-screen header back affordance on mobile web (`apps/mobile/App.tsx`)
- Commit range: fa4d9a29599b62ea1dc7a7256731916a5c879d11..dbc6b4606bcce9f52935a8dd87a09784f1c9ab51
- Rationale: `Connection Settings` is a first-run configuration surface that users revisit often. On mobile web, the only obvious escape action at the top of that screen was rendering as a 30x30 hit target, which made a primary navigation control harder to tap reliably during setup and validation flows.
- QA feedback: Addressed the outstanding reviewer finding on the prior `settings-voice-picker-close-affordance` evidence by restoring matched-DPR tracked screenshots; this back-button improvement itself is a new iteration.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-back-button-touch-target--before--connection-settings-screen--20260311.png` — `390x844` CSS viewport on Expo Web, saved as a matched DPR2 `780x1688` PNG. The `Connection Settings` screen before the change used the default nested-screen back affordance, which browser inspection measured at only `30x30`, making the main exit action undersized for narrow-screen touch use.
- Change: Added a custom non-root stack-header back button in `apps/mobile/App.tsx` using the shared touch-target helper and explicit button accessibility metadata. Extended `apps/mobile/tests/navigation-header.test.js` to lock the nested-screen back-button wiring and minimum-target pattern.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-back-button-touch-target--after--connection-settings-screen--20260311.png` — same `390x844` CSS viewport and matched DPR2 `780x1688` PNG. The `Connection Settings` header now exposes a custom `Go back` control that browser inspection measured at `44x44`, bringing the primary nested-screen escape action up to the minimum tap-target bar even though the control still looked visually sparse and needed the follow-up affordance pass documented above.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8104 --clear` ✅ (Expo Web live at `http://localhost:8104`); `node --test apps/mobile/tests/navigation-header.test.js apps/mobile/tests/connection-settings-density.test.js` ✅ (4/4 passing); live Expo Web before/after screenshots + DOM size checks captured ✅ (`30x30` before, `44x44` after); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ❌ with pre-existing unrelated `LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors.
- Blockers/remaining uncertainty: The `Connection Settings` back-button touch-target improvement is verified, but at this point the control still looked visually sparse on mobile web and the QR scanner modal close control still measured slightly under the 44px minimum-height bar. Deeper desktop-backed settings pickers also remained unreachable from the disconnected default state.

### 2026-03-11 — Iteration 12: make the Settings TTS voice picker close action read like a real mobile control

- Status: completed with live Expo Web evidence and targeted regression coverage
- Area:
  - `Settings -> Desktop Settings -> Text-to-Speech -> Voice picker` in `apps/mobile/src/screens/SettingsScreen.tsx`
  - narrow mobile web viewport (`390x844`) while connected to a DotAgents desktop server with `Desktop Settings` and remote settings loaded
- Why this area:
  - the ledger still had modal/sheet surfaces weakly checked, and prior iterations had not yet done a live narrow-viewport pass on the TTS voice picker
  - Expo Web inspection showed a concrete actionability issue that was worth shipping immediately: once the voice picker opened, the `Close` affordance read like tiny inline text instead of a clear button on a narrow screen
- What was investigated:
  - live Expo Web startup via the existing repo workflow, including rebuilding `packages/shared` so Expo Web could actually run in this worktree
  - the connected Settings flow with loaded `Desktop Settings`, `Text-to-Speech -> Voice picker`, `Connection settings`, and reachable narrow-viewport modal behavior at `390x844`
  - current picker trigger / option / close-control markup and nearby mobile accessibility helper usage in `SettingsScreen.tsx`
  - desktop settings parity references in `apps/desktop/src/renderer/src/pages/settings-models.tsx` and `apps/desktop/src/renderer/src/pages/settings-providers.tsx`
- Findings:
  - the stale ledger blocker was wrong for this worktree: `node_modules` are present and Expo Web is available after `pnpm build:shared`
  - the open TTS voice picker modal fit the viewport, but its `Close` action was visually weak on mobile web; the browser pass described it as plain small text before the change
  - broader provider-setup surfaces still remained only partially checked, so this pass stayed intentionally focused on the reachable connected voice-picker modal rather than overclaiming wider settings parity
  - Expo Web DOM inspection still reports the picker trigger and option rows as generic focusable `DIV`s even after adding explicit picker props, so full web semantics parity remains uncertain and is tracked separately
- Change made:
  - converted the voice/model/endpoint picker triggers and picker rows in `SettingsScreen.tsx` to `Pressable` controls and added explicit source-level button/selected/expanded metadata for consistency with the rest of the mobile app
  - upgraded modal `Close` actions into pill-style bordered controls with stronger minimum sizing so the reachable voice picker exit action reads as a real button on narrow mobile web
  - kept the picker rows and trigger text constrained with minimum-height / truncation guardrails and extended `apps/mobile/tests/settings-overlay-density.test.js` to lock the new touch-target and semantics expectations
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8103 --clear`
  - `node --test apps/mobile/tests/settings-overlay-density.test.js`
  - live Expo Web automation at `390x844` with before/after screenshots for the open voice picker
  - exploratory `pnpm --filter @dotagents/mobile exec tsc --noEmit` (still fails on pre-existing unrelated `apps/mobile/src/screens/LoopEditScreen.tsx` `ApiAgentProfile.guidelines` errors)
- Follow-up checks:
  - continue the modal/sheet coverage map with the endpoint picker, model picker, agent selector, and QR flow now that Expo Web is working again
  - investigate why Expo Web still exposes the picker trigger/rows as generic focusable `DIV`s despite the new source props; likely next step is comparing this screen with known-good `Pressable` semantics already verified elsewhere in Chat
  - keep expanding the settings parity ledger toward desktop `Provider Setup` rather than repeatedly polishing the same TTS subsection

Evidence
- Evidence ID: settings-voice-picker-close-affordance
- Scope: `Settings -> Desktop Settings -> Text-to-Speech -> Voice picker` close action on mobile web (`apps/mobile/src/screens/SettingsScreen.tsx`)
- Commit range: e46d01822ce065cf4b6b0ee3aa64f0078c0cd00e..d8e290633d46a169232ceabc90a0409d1b876778
- Rationale: The TTS voice picker is a meaningful configuration surface once the mobile app is connected to a DotAgents desktop server and remote settings have loaded. On a narrow viewport, the picker needed a clearer exit affordance so the modal state feels obviously actionable instead of relying on a tiny text-only close control.
- QA feedback: Reviewer flagged a mismatched before/after screenshot size on the first pass; the tracked after screenshot now uses the matching DPR2 capture for the same `390x844` CSS viewport and view.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-voice-picker-close-affordance--before--voice-picker-open--20260311.png` — `390x844` CSS viewport in Expo Web, saved as a DPR2 `780x1688` PNG, open `Text-to-Speech -> Voice picker`. Before the change, the `Close` affordance reads as a plain text action in the picker header, which is easy to under-read on a narrow mobile surface.
- Change: Converted the picker surfaces to `Pressable`, added explicit source-level role/expanded/selected metadata, and restyled modal close actions into bordered pill buttons with stronger minimum sizing. Added focused regression assertions in `apps/mobile/tests/settings-overlay-density.test.js`.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-voice-picker-close-affordance--after--voice-picker-open--20260311.png` — same `390x844` CSS viewport and DPR2 `780x1688` PNG view. The picker header now shows `Close` as a bordered pill-style control, which reads more clearly as a tappable mobile action while keeping the sheet compact.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8103 --clear` ✅ (Expo Web live at `http://localhost:8103`); `node --test apps/mobile/tests/settings-overlay-density.test.js` ✅ (4/4 passing); live Expo Web before/after screenshots captured ✅; `pnpm --filter @dotagents/mobile exec tsc --noEmit` ❌ with pre-existing unrelated `LoopEditScreen.tsx` `ApiAgentProfile.guidelines` type errors.
- Blockers/remaining uncertainty: The visual close-affordance improvement is verified, but Expo Web still reports the picker trigger and option rows as generic focusable `DIV`s rather than surfaced button semantics. That unresolved runtime-semantic gap is documented above and should be treated as a follow-up investigation, not as solved parity.

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
