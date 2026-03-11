# Mobile App Improvement Ledger

## Purpose

- Track mobile investigations, fixes, regressions, and next checks.
- Prefer one small, shippable improvement per iteration.
- Use Expo Web when practical for repeatable inspection.

## Coverage Map

### Checked screens/flows

- [x] Settings root screen and nested back navigation
- [x] Settings home `Text-to-Speech -> Voice` picker trigger and modal close/action surface in Expo Web (`390x844` mobile viewport)
- [x] Connection setup flow, save validation, and inline connection actions
- [x] Connection Settings screen back navigation, header affordance, QR scanner web launch guidance / close surface, save confirmation, and empty-save validation in Expo Web (`390x844` CSS viewport, matched screenshots)
- [x] Sessions list entry points, top actions, and empty state
- [x] Chat thread composer controls, voice/listening announcements, and disclosure states
- [x] `Chats` / `Chat` header agent selector blocked-state sheet plus direct `Connection settings` escape path in Expo Web (`390x844` mobile viewport)
- [x] `Chat -> + New Chat` header action density / overflow menu on Expo Web (`390x844` mobile viewport)
- [x] Settings home disconnected-state Chats entry point and offline helper copy in Expo Web (`390x844` mobile viewport)
- [x] Disconnected `Chats -> + New Chat` composer helper copy, blocked send state, and pre-send guidance in Expo Web (`390x844` mobile viewport)
- [x] Disconnected `Chats -> + New Chat` handsfree activation blocker and draft-fallback guidance in Expo Web (`390x844` mobile viewport)
- [x] Disconnected `Settings -> Hands-free Voice Mode on -> Open Chats -> + New Chat` persisted handsfree-enabled state now stays setup-required instead of auto-listening in Expo Web (`390x844` mobile viewport)
- [x] Disconnected `Chats -> + New Chat` empty debug-info state on Expo Web no longer emits repeated `Unexpected text node` console errors at `390x844`
- [x] Settings -> Text-to-Speech voice picker modal close/action surface in Expo Web (connected desktop-settings runtime, `390x844` mobile viewport)
- [x] Settings -> Agent Loops list row actions (source-backed in this worktree)
- [x] Loop create/edit screen agent-profile selection section (source-backed in this worktree)
- [x] Agent create/edit screen (`AgentEdit`) connection-type selection and mode-specific fields (source-backed in this worktree)
- [x] Memory create/edit screen (`MemoryEdit`) importance selection section (source-backed in this worktree)
- [x] Settings desktop partial-load warning / retry state (source-backed in this worktree)

### Settings parity checklist vs desktop

- [~] Desktop `Models -> Choose a Provider for Each Job`: mobile exposes the main STT / Agent-MCP / TTS provider selectors inside `Settings -> Desktop Settings`, but broader runtime coverage across every provider combination is still incomplete.
- [~] Desktop `Models -> Speech & Voice Models`: mobile exposes TTS model and voice pickers plus the OpenAI-compatible endpoint/model selectors. Live Expo Web now covers both the connected desktop-settings TTS picker close surface and the default settings-home TTS voice picker trigger/close density, but the remaining desktop-backed model/preset pickers and final web semantics validation are still only partially checked.
- [ ] Desktop `Providers -> Provider Setup`: desktop still owns API keys, provider-specific base URLs, local engine downloads, and quick diagnostics; mobile currently covers remote server connection (`Connection settings`) but does not yet show verified parity for provider setup controls.
- [-] Desktop-only window/general controls: launch-at-login, panel/window behavior, and desktop hotkeys are intentionally desktop-specific and should remain documented as non-mobile parity items rather than backlogged mobile gaps.

### Not yet checked

- [ ] Memory create/edit loading, error, and runtime layout states beyond the importance selector
- [ ] Agent create/edit remaining fields and built-in-agent limited-edit state outside the connection-type section
- [ ] Loop create/edit live save flow, runtime layout, and remaining fields
- [ ] Session loading, error, reconnect, and sync states
- [ ] Connected `Chats` / `Chat` header agent selector list contents, ACP main-agent variant, and successful agent switching after setup
- [ ] Remaining disconnected/offline chat states after entering `Chats` beyond the new-chat text-send and handsfree guards (existing-chat retry/reconnect and sync states)
- [ ] Remaining modal/sheet surfaces on narrow web viewports beyond the Settings TTS voice picker and the Connection Settings QR scanner close pass (model picker, endpoint picker, agent selector, broader destructive confirmations)
- [ ] Connection Settings QR scanner live camera-preview / successful scan state after permission is actually granted on web or native
- [ ] Large-text / awkward viewport behavior across Settings, Sessions, Chat, and edit screens

### Reproduced

- [x] Missing in-place CTA on the session empty state
- [x] Default Settings `Text-to-Speech -> Voice` used a `220x33` trigger and a `53x25` modal `Close` action on Expo Web, leaving both controls below the 44px mobile touch-target floor
- [x] Undersized chat composer send/accessory controls and missing web state semantics
- [x] Weak Connection inline action affordances
- [x] Disconnected chat agent selector sheet stranded users behind a retry-only warning with no direct path to `Connection settings`
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
- [x] Disconnected `Chats -> + New Chat` let users enable handsfree voice mode, enter an active listening state, and see speech-ready copy even when the same screen already knew sending was blocked by missing connection config
- [x] Disconnected `Settings -> Hands-free Voice Mode on -> Open Chats -> + New Chat` still auto-entered a listening-looking state on Expo Web, showing `Listening...`, a busy `🎙️ Pause` mic, and voice-active live-region copy even though chat remained disconnected and send-blocked
- [x] Disconnected `Chats -> + New Chat` emitted repeated Expo Web `Unexpected text node: . A text node cannot be a child of a <View>.` errors because blank `debugInfo` used string short-circuit rendering under a `View`
- [x] Connection Settings QR scanner modal close button measured about `66.7x42` CSS px in Expo Web, sat low with a hardcoded `top: 60`, and read like a generic overlay dismiss instead of a tuned scanner escape action
- [x] Connection Settings `Scan QR Code` did nothing visibly on Expo Web: no scanner modal, no close control, no inline blocker, and no browser-specific permission guidance after the tap
- [x] `Chat -> + New Chat` packed back navigation, agent title, new-chat, emergency-stop, handsfree, and settings controls into one crowded mobile header row at `390x844`, squeezing the title area and burying secondary actions among primary ones

### Improved

- [x] Nested-screen back navigation
- [x] Default Settings `Text-to-Speech -> Voice` picker trigger and modal close affordance now meet 44px touch-target sizing with clearer button treatment on mobile web
- [x] Connection first-run validation and inline action affordances
- [x] Connection Settings header back-button touch target and visual affordance on nested screens
- [x] Disconnected chat agent selector blocked-state clarity and direct handoff into `Connection settings`
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
- [x] Disconnected `Chats -> + New Chat` handsfree activation honesty and disconnected draft fallback guidance
- [x] Persisted/disconnected handsfree-on chat entry now stays honest: no fake listening overlay, no busy mic state, and draft-only guidance remains visible while setup is still required
- [x] Disconnected `Chats -> + New Chat` empty debug-info state no longer produces Expo Web empty-text-node console noise on open or while typing
- [x] Connection Settings QR scanner close affordance clarity, safe-area placement, and 44px touch-target coverage
- [x] Connection Settings QR scanner web launch now opens an explicit browser-permission guidance sheet with a visible escape action instead of behaving like a dead tap
- [x] `Chat -> + New Chat` header now keeps new-chat / handsfree visible while moving secondary settings and emergency-stop actions into a single overflow sheet on narrow mobile widths

### Verified

- [x] Source-backed regression coverage for navigation, connection validation, chat composer accessibility, session empty state, agent loop row actions, LoopEdit profile selection, AgentEdit connection types, MemoryEdit importance selection, and the Settings desktop warning state
- [x] Live Expo Web before/after evidence plus focused density coverage for Settings home `Text-to-Speech -> Voice` at `390x844`
- [x] Live Expo Web before/after evidence plus focused header/sheet coverage for the disconnected chat agent selector blocked state at `390x844`
- [x] Live Expo Web before/after evidence for the Connection Settings header back-button touch-target fix at `390x844` CSS viewport
- [x] Live Expo Web before/after evidence for the Connection Settings header back-button visual affordance follow-up at `390x844`
- [x] Live Expo Web before/after evidence for the Settings -> Text-to-Speech voice picker close affordance at `390x844`
- [x] Live Expo Web before/after evidence for the disconnected Settings-home chats CTA at `390x844`
- [x] Executable vitest coverage plus a fresh Expo Web tap-through recheck for the disconnected `Settings -> Open Chats` CTA on mobile web
- [x] Live Expo Web before/after evidence plus focused send-availability coverage for disconnected `Chats -> + New Chat` at `390x844`
- [x] Live Expo Web before/after evidence plus focused handsfree/chat accessibility coverage for disconnected `Chats -> + New Chat` at `390x844`
- [x] QA remediation pass for disconnected `Settings -> Hands-free Voice Mode on -> Open Chats -> + New Chat` now has matched `390x844` Expo Web before/after evidence plus focused source-backed draft-only/runtime guardrails
- [x] QA follow-up recapture for the disconnected Settings-home CTA and disconnected `Chats -> + New Chat` evidence now uses matched `390x844` Expo Web screenshots plus corrected authored commit provenance
- [x] Live Expo Web before/after evidence plus focused chat regression coverage for the disconnected `Chats -> + New Chat` empty-debug-info runtime warning at `390x844`
- [x] Live Expo Web before/after evidence plus focused connection-settings density coverage for the QR scanner modal close affordance at `390x844`
- [x] Live Expo Web before/after evidence plus focused QR helper/density coverage for the Connection Settings QR scanner web guidance sheet at `390x844`
- [x] Live Expo Web before/after evidence plus focused `Chat -> + New Chat` header-density coverage for a narrow-screen overflow menu at `390x844`

### Blocked

- [ ] No active runtime blocker at the moment: Expo Web is available in this worktree after rebuilding `packages/shared`.

### Still uncertain

- [ ] Expo Web still reports the TTS voice trigger and picker rows as generic focusable `DIV`s despite the new source-level picker semantics; verify whether this is a React Native Web limitation or a control-specific wiring gap before claiming full web a11y parity.
- [ ] The disconnected chat agent selector blocker is now actionable, but the fully connected agent list contents plus ACP main-agent switching still need their own live runtime pass before agent-selection coverage is considered complete.
- [ ] Narrow-screen usability of the rest of `MemoryEdit` and the remaining `AgentEdit` / `LoopEdit` fields outside the newly checked sections
- [ ] The disconnected new-chat text-send path and default handsfree activation path are now guarded, but existing-chat retry/reconnect and sync states still need their own dedicated offline runtime passes before claiming solid chat-offline coverage.
- [ ] The disconnected `Chats -> + New Chat` empty-debug-info warning is fixed, but unrelated offline/sync console noise (`401 Unauthorized`, `ERR_CONNECTION_REFUSED`, `syncService` fetch failures) still appears during Expo Web chat passes and needs its own dedicated investigation before claiming a clean disconnected runtime.
- [ ] The new Expo Web QR sheet makes the browser flow visible and actionable before permission is granted, but the actual camera-preview / successful scan state after allowing camera access still needs a dedicated live pass outside automation-constrained browser permissions.
- [ ] This iteration only rebalanced the `Chat -> + New Chat` header. The `Chats` list header/title width at `390x844` still needs its own dedicated density pass before the broader chat-navigation chrome is considered fully checked.

## Recent Iterations

### 2026-03-11 — Iteration 24: move secondary chat header actions into a narrow-screen overflow sheet

- Status: completed with live Expo Web before/after evidence, a focused chat-header density fix, and targeted regression coverage
- Area:
  - `apps/mobile/src/screens/ChatScreen.tsx` mobile `Chat -> + New Chat` header actions at `390x844`
  - tracked Expo Web before/after screenshots for the same narrow new-chat view
  - focused source guardrails in `apps/mobile/tests/chat-screen-density.test.js`
- Why this area:
  - this was a justified revisit to chat chrome, not a repeat polish pass on the earlier disconnected agent-selector blocker work: the previous runtime coverage proved the selector sheet path, but it did not verify whether the overall chat header still fit cleanly on a real narrow viewport
  - fresh Expo Web inspection showed a concrete usability issue on a core surface: the header tried to keep back navigation, agent context, new chat, emergency stop, handsfree, and settings all visible at once, which squeezed the title area and made secondary actions compete with primary ones
- What was investigated:
  - live Expo Web at `390x844` from the default landing screen through `Open Chats -> New chat`
  - the visible balance of chat-header controls before changing code, plus whether the lowest-frequency actions actually needed always-on header slots
  - `ChatScreen` header wiring to confirm a minimal overflow-sheet handoff could preserve settings and emergency-stop access without broadening into a navigation refactor
- Findings:
  - the `Chat` header was visibly overcrowded on narrow mobile web: the agent/title area lost space while `Settings` and `Emergency stop` occupied the same top row as higher-frequency actions like `New chat` and handsfree
  - both secondary actions remained useful, but they did not need permanent first-row placement on the empty/new-chat mobile state where header space is the scarcest
  - the smallest effective fix was to keep the primary chat actions visible and move the lower-frequency settings / emergency-stop pair into a single overflow sheet
- Change made:
  - replaced the standalone chat-header `Settings` icon with a `⋯` overflow action on mobile chat header wiring in `ChatScreen`
  - moved `Open settings` and `Emergency stop` into a bottom-sheet-style modal with clearer labels, helper copy, and full-width touch targets while preserving the existing kill-switch confirmation flow
  - extended `apps/mobile/tests/chat-screen-density.test.js` to lock the new overflow trigger and sheet content so the crowded direct emergency-stop header action does not silently return
- Verification:
  - `node --test apps/mobile/tests/chat-screen-density.test.js`
  - `git diff --check`
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--before--new-chat-header--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--after--new-chat-header--20260311.png`
  - live Expo Web browser automation at `390x844` confirming the overflow trigger replaced the separate settings/emergency-stop header icons and that the new sheet exposed both actions correctly
- Follow-up checks:
  - run a matching `Chats` list-header density pass later, since the sessions header/title area is still not explicitly verified by this narrower chat-screen fix
  - keep widening chat coverage into existing-chat reconnect/sync states and connected agent-switching rather than continuing to polish the same empty new-chat header without new evidence

Evidence
- Evidence ID: chat-header-overflow-density
- Scope: narrow-screen `Chat -> + New Chat` header action density in `apps/mobile/src/screens/ChatScreen.tsx`, focused source guardrails in `apps/mobile/tests/chat-screen-density.test.js`, and matched tracked Expo Web screenshots at `docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--before--new-chat-header--20260311.png` and `docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--after--new-chat-header--20260311.png`. This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: afd257bb849ff5f85c92cba35af52caab7139798..f1a219ba7f9d361735a56078b5f1b5743b0634c4
- Rationale: The mobile chat header is one of the highest-frequency surfaces in the app, and live Expo Web inspection showed it was trying to keep too many controls visible at once on a `390x844` viewport. Consolidating low-frequency settings and kill-switch actions into an overflow sheet resolves a real narrow-screen hierarchy problem without removing those capabilities or refactoring navigation broadly.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--before--new-chat-header--20260311.png` — `390x844` Expo Web viewport on disconnected `Open Chats -> New chat`. Before the fix, the top bar kept back navigation, the agent title chip, `New chat`, `Emergency stop`, handsfree, and `Settings` all in one cramped row, which squeezed the title area and made secondary actions visually compete with the primary chat controls.
- Change: Updated `apps/mobile/src/screens/ChatScreen.tsx` so the chat header now exposes a single overflow trigger for secondary actions, then renders `Open settings` and `Emergency stop` inside a bottom-sheet-style modal with clearer copy and larger action rows. Added focused density guardrails in `apps/mobile/tests/chat-screen-density.test.js`.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--after--new-chat-header--20260311.png` — same `390x844` Expo Web viewport and view. After the fix, the chat header keeps the primary `New chat` and handsfree controls visible while replacing separate `Settings` / `Emergency stop` buttons with one overflow action, so the top bar reads more cleanly and the secondary actions remain available through the verified sheet.
- Verification commands/run results: `node --test apps/mobile/tests/chat-screen-density.test.js` ✅ (7/7 passing, including the new overflow-sheet guardrail); `git diff --check` ✅; `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--before--new-chat-header--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-header-overflow-density--after--new-chat-header--20260311.png` ✅ (both curated screenshots are matched `390x844` PNGs from the same Expo Web mobile viewport); live Expo Web browser automation at `390x844` ✅ confirmed the overflow control replaced the separate settings/emergency-stop icons and that opening it exposed working `Open settings` and `Emergency stop` actions.
- Blockers/remaining uncertainty: This pass only verifies the narrow-screen `Chat -> + New Chat` header state with the overflow sheet closed in the matched screenshot pair. The `Chats` list header still needs its own dedicated density pass, and the responding/active-session variant of the chat header with its extra spinner state has not yet been screenshot-validated.

### 2026-03-11 — Iteration 23: stop persisted handsfree-on chat from looking live while disconnected

- Status: completed with live Expo Web QA before/after evidence, a focused disconnected-chat runtime fix, and targeted regression coverage
- Area:
  - disconnected `Settings -> Hands-free Voice Mode on -> Open Chats -> + New Chat` persisted-state path in `apps/mobile/src/screens/ChatScreen.tsx`
  - disconnected handsfree accessibility copy in `apps/mobile/src/lib/accessibility.ts`
  - tracked `390x844` Expo Web evidence for the exact QA-remediation path
- Why this area:
  - revisiting disconnected chat was justified by active unresolved QA, not by polish: the review stack still showed a realistic persisted/settings-enabled handsfree path where chat looked actively listening even while disconnected
  - fixing that path had higher value than widening into a new surface, because the earlier handsfree honesty claim was too broad until the saved-setting entry path actually matched it in runtime
- What was investigated:
  - live Expo Web at `390x844` following the exact reviewer path: enable `Hands-free Voice Mode` on Settings/home, open `Chats`, then create `+ New Chat` while still disconnected
  - the final disconnected chat state after that path, including the header toggle state, listening overlay, live-region copy, mic label, and handsfree status chip
  - `ChatScreen` and voice accessibility helpers to confirm whether the recognizer/runtime still keyed off the saved setting instead of actual disconnected send availability
- Findings:
  - QA was correct: with `Hands-free Voice Mode` enabled from Settings first, disconnected `+ New Chat` still showed a misleading live state on Expo Web, including `Listening...`, a busy `🎙️ Pause` mic, checked handsfree toggle, and voice-active live-region copy even though the same screen still blocked sending
  - the root issue was that chat keyed handsfree runtime behavior off the saved `config.handsFree` flag, so entering chat with the setting already on could auto-start listening even when no connection config existed
  - the smallest honest fix was to keep the saved setting visible, but gate the actual handsfree runtime behind real connection availability and treat disconnected voice capture as a draft-only fallback instead of a live handsfree session
- Change made:
  - split saved handsfree state from runtime-enabled handsfree state in `ChatScreen`, so disconnected chat no longer auto-starts listening or renders pause/listening affordances just because the setting was already enabled elsewhere
  - added a disconnected draft-only voice fallback that inserts dictated text into the composer instead of implying automatic send semantics when handsfree is enabled but setup is still missing
  - updated handsfree/composer/live-region accessibility copy so the disconnected persisted-setting path now says `hold to dictate a draft` / `setup required` instead of implying live listening
  - extended `apps/mobile/src/lib/accessibility.test.ts` and `apps/mobile/tests/chat-screen-handsfree-density.test.js` to lock the new runtime gate, draft-only fallback, and QA-remediation copy
- Verification:
  - `pnpm --filter @dotagents/mobile exec vitest run src/lib/accessibility.test.ts`
  - `node --test apps/mobile/tests/chat-screen-handsfree-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js`
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--before--settings-enabled-new-chat--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--after--settings-enabled-new-chat--20260311.png`
  - `git diff --check`
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit` (still reports the same pre-existing unrelated errors in `LoopEditScreen.tsx` and `settings-home-chats-cta.test.tsx`; no new type error from this handsfree fix surfaced before those failures stopped the run)
  - live Expo Web browser automation at `390x844` confirming the pre-fix path reproduced the misleading listening state and the post-fix path stayed setup-required with a non-busy `🎤 Hold` mic plus `Voice input ready.` live-region output
- Follow-up checks:
  - continue widening disconnected chat coverage with existing-chat retry/reconnect and sync states rather than revisiting this same new-chat path again without fresh evidence
  - return to the still-unchecked connected agent-selector list/model/provider settings surfaces once a connected runtime is available, since settings parity breadth remains a bigger uncovered area than further disconnected-chat polish

Evidence
- Evidence ID: chat-disconnected-handsfree-persisted-qa
- Scope: disconnected `Settings -> Hands-free Voice Mode on -> Open Chats -> + New Chat` persisted handsfree-enabled QA-remediation path plus tracked before/after screenshots (`apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/lib/accessibility.ts`, `apps/mobile/src/lib/accessibility.test.ts`, `apps/mobile/tests/chat-screen-handsfree-density.test.js`, `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--before--settings-enabled-new-chat--20260311.png`, `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--after--settings-enabled-new-chat--20260311.png`). This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: 04b6f0ba76108d68f52bc10782183ba47853bb42..547c48169391cd6b3b7d4fc3a79221c74189071a
- Rationale: The earlier disconnected handsfree fix only covered the default handsfree-off entry path, but a realistic Settings-enabled path still made disconnected chat look actively listening and voice-ready on Expo Web. Gating handsfree runtime behavior behind actual connection availability closes that trust gap without removing the saved setting itself or broadening into a larger voice-system refactor.
- QA feedback: Addressed the unresolved reviewer finding that enabling `Hands-free Voice Mode` on Settings before `Open Chats -> + New Chat` still left the disconnected chat showing a checked/busy handsfree state with `Listening...`, `🎙️ Pause`, and voice-active live-region copy.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--before--settings-enabled-new-chat--20260311.png` — `390x844` Expo Web viewport on the exact reviewer path after opening disconnected `+ New Chat` with handsfree already enabled from Settings. Before the fix, the screen still showed `Listening...`, a busy `🎙️ Pause` mic, checked handsfree toggle, and `Voice listening active. Tap mic again to stop.` even though sending was already blocked by missing setup, so the surface looked more capable than it really was.
- Change: Updated `ChatScreen` to separate saved handsfree preference from runtime-enabled handsfree behavior, prevent disconnected chat from auto-starting or rendering active handsfree controls, route disconnected voice capture into a draft-only composer fallback, and tighten the related accessibility/live-region copy in `apps/mobile/src/lib/accessibility.ts`.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--after--settings-enabled-new-chat--20260311.png` — same `390x844` Expo Web viewport and view. After the fix, the disconnected chat still preserves the saved handsfree setting, but it now shows `Setup required`, a non-busy `🎤 Hold` mic, `Voice input ready.` live-region output, and explicit draft-only/setup guidance instead of pretending handsfree is actively listening or ready to auto-send.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/lib/accessibility.test.ts` ✅ (34/34 passing, including the new disconnected handsfree draft-only/accessibility assertions; pnpm emitted the existing non-blocking Node engine warning under `v25.2.1`); `node --test apps/mobile/tests/chat-screen-handsfree-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js` ✅ (11/11 passing, including the new persisted-handsfree runtime gate assertions); `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--before--settings-enabled-new-chat--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-persisted-qa--after--settings-enabled-new-chat--20260311.png` ✅ (both curated screenshots are matched `390x844` PNGs from the same mobile Expo Web viewport); `git diff --check` ✅; `pnpm --filter @dotagents/mobile exec tsc --noEmit` ⚠️ still fails on pre-existing unrelated issues in `apps/mobile/src/screens/LoopEditScreen.tsx` (`ApiAgentProfile.guidelines`) and `apps/mobile/src/screens/settings-home-chats-cta.test.tsx` (`children` on `{}`), with no new handsfree-specific type error surfacing before those existing failures; live Expo Web browser automation at `390x844` ✅ reproduced the misleading listening state before the fix and then confirmed the post-fix path showed no listening overlay, no busy mic state, and `Voice input ready.` instead.
- Blockers/remaining uncertainty: The visible disconnected/persisted-handsfree state is now verified live, but the exact browser-microphone capture path was not audio-injected during automation; the new draft-only capture behavior on that path is therefore backed by focused source/tests plus the visible runtime state rather than a full end-to-end spoken-input run.

### 2026-03-11 — Iteration 22: make the default TTS voice picker feel tappable on mobile

- Status: completed with live Expo Web before/after evidence, a focused settings-surface touch-target fix, and targeted regression coverage
- Area:
  - default Settings-home `Text-to-Speech -> Voice` picker in `apps/mobile/src/ui/TTSSettings.tsx`
  - tracked mobile-web evidence for the default settings root at `390x844`
  - focused source guardrails in `apps/mobile/tests/tts-settings-density.test.js`
- Why this area:
  - the ledger and recent runtime work were already concentrated on disconnected chat and connection setup, so a new pass on the default settings surface widened coverage more honestly than polishing the same offline chat path again
  - live Expo Web inspection of the landing Settings screen showed a concrete usability gap on a configuration control users can hit without any setup: the local TTS voice trigger and the modal close action were both visibly undersized on mobile web
- What was investigated:
  - the default Expo Web landing state at `390x844`, specifically `Text-to-Speech -> Voice` on the root settings screen rather than the separate connected desktop-settings TTS picker already covered earlier
  - the rendered size and feel of the voice trigger before opening the picker plus the visible modal close affordance after opening it
  - `apps/mobile/src/ui/TTSSettings.tsx` to confirm whether the component was still using its own smaller touch targets instead of the shared mobile accessibility helper already adopted elsewhere in the app
- Findings:
  - the Settings-home voice trigger measured about `220x33` CSS px in Expo Web, which made an important configuration control look shallower and less tappable than nearby mobile actions
  - once the picker opened, the visible `Close` action measured about `53x25` CSS px, which was even further below the 44px touch-target floor and felt inconsistent with the stronger close affordances already added to other mobile sheets/modals
  - this gap lived in `TTSSettings`, a separate local-settings component from the previously checked connected desktop-settings picker, so the stronger earlier coverage did not actually protect the default landing-state control users see first
- Change made:
  - updated `TTSSettings` to use `createMinimumTouchTargetStyle` for both the voice trigger and the picker close action, with bordered secondary-button treatment that better matches the rest of the app's mobile controls
  - added explicit button semantics and expanded-state metadata on the voice trigger for the web-rendered picker entry point
  - extended `apps/mobile/tests/tts-settings-density.test.js` to lock the new touch-target sizing, button semantics, and modal-close styling guardrails
- Verification:
  - `node --test apps/mobile/tests/tts-settings-density.test.js`
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit` (reported pre-existing unrelated errors in `LoopEditScreen.tsx` and `settings-home-chats-cta.test.tsx`; no new TTSSettings-specific type error surfaced before those existing failures stopped the run)
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--before--settings-voice-picker--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--after--settings-voice-picker--20260311.png`
  - `git diff --check`
  - live Expo Web browser automation at `390x844` confirming the trigger grew from about `220x33` to `221x44` CSS px and the modal close action from about `53x25` to `64x44`
- Follow-up checks:
  - continue widening settings/modal coverage with the remaining unchecked picker surfaces (`Settings -> Desktop Settings` model picker, endpoint picker, and other modal states) rather than returning to disconnected chat again immediately
  - run a large-text / awkward-viewport pass on the settings root once another small high-value control or layout issue is identified there

Evidence
- Evidence ID: settings-tts-voice-picker-density
- Scope: default Settings-home `Text-to-Speech -> Voice` picker touch-target and close-action density (`apps/mobile/src/ui/TTSSettings.tsx`, `apps/mobile/tests/tts-settings-density.test.js`, `docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--before--settings-voice-picker--20260311.png`, `docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--after--settings-voice-picker--20260311.png`). This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: 501e36e601183dd3d370429df6d0b9692ef12972..eaf2fbda0791d4f80b976cd34af5bb58bc3384ef
- Rationale: The first screen mobile users see still had a TTS voice picker that looked smaller and weaker than the app's newer mobile action patterns, even though a different connected TTS picker had already been improved elsewhere. Raising both the trigger and the modal close action to 44px minimum targets removes a concrete settings usability risk on the default landing path without broadening into a larger settings refactor.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--before--settings-voice-picker--20260311.png` — `390x844` Expo Web viewport on the default Settings screen with the `Select Voice` modal open. Before the fix, the Settings-home voice trigger measured about `220x33` CSS px and the visible `Close` action about `53x25`, so both the picker entry point and the sheet escape control fell below the 44px mobile touch-target floor on a first-run-accessible configuration surface.
- Change: Updated `apps/mobile/src/ui/TTSSettings.tsx` so the Settings-home voice trigger and modal close button use the shared minimum-touch-target helper, added bordered secondary-button treatment for clearer affordance, and exposed explicit button/expanded semantics for the voice-picker trigger. Added focused node coverage in `apps/mobile/tests/tts-settings-density.test.js`.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--after--settings-voice-picker--20260311.png` — same `390x844` Expo Web viewport and view. After the fix, the Settings-home voice trigger measures about `221x44` CSS px and the visible `Close` action about `64x44`, so the default TTS picker now reads like a deliberate mobile control and the sheet escape action no longer feels undersized.
- Verification commands/run results: `node --test apps/mobile/tests/tts-settings-density.test.js` ✅ (3/3 passing, including the new trigger and close-action touch-target guardrails); `pnpm --filter @dotagents/mobile exec tsc --noEmit` ⚠️ surfaced pre-existing unrelated type errors in `apps/mobile/src/screens/LoopEditScreen.tsx` (`ApiAgentProfile.guidelines`) and `apps/mobile/src/screens/settings-home-chats-cta.test.tsx` (`children` on `{}`) before any TTSSettings-specific issue appeared; `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--before--settings-voice-picker--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/settings-tts-voice-picker-density--after--settings-voice-picker--20260311.png` ✅ (both curated screenshots are matched `780x1688` PNGs captured from the same `390x844` Expo Web viewport at DPR 2); `git diff --check` ✅; live Expo Web browser automation at `390x844` ✅ confirmed the before-state `220x33` trigger / `53x25` close control and the after-state `221x44` trigger / `64x44` close control.
- Blockers/remaining uncertainty: This iteration fixes the default local TTS picker density only. The remaining desktop-backed model/endpoint/preset pickers still need their own live Expo Web passes, and the broader mobile package typecheck currently fails on unrelated pre-existing files outside this change.

### 2026-03-11 — Iteration 21: stop disconnected chat from pretending handsfree is live

- Status: completed with live Expo Web before/after evidence, a focused disconnected-chat voice-state fix, and targeted regression coverage
- Area:
  - disconnected `Chats -> + New Chat` handsfree / voice affordances in `apps/mobile/src/screens/ChatScreen.tsx`
  - disconnected chat accessibility copy in `apps/mobile/src/lib/accessibility.ts`
  - narrow mobile web viewport (`390x844`) for the new-chat composer and header handsfree toggle attempt
- Why this area:
  - the ledger still explicitly marked disconnected chat mic/handsfree affordances as unchecked, and the latest Expo Web pass on the disconnected default runtime surfaced a concrete contradiction on a core chat surface rather than another minor polish opportunity
  - revisiting disconnected `+ New Chat` was justified because the prior send-guard pass fixed text sending, but it did not yet cover the separate voice/handsfree path that could still imply the app was ready to listen and send
- What was investigated:
  - live Expo Web at `390x844` through `Settings -> Open Chats -> + New Chat` on the disconnected default runtime
  - the behavior of the header `Hands-free voice mode` toggle, composer voice copy, and ready/listening states before and after attempting to enable handsfree without a usable connection config
  - `ChatScreen` and chat accessibility helpers to see how disconnected handsfree copy was assembled and whether activation could be blocked without refactoring voice input broadly
- Findings:
  - QA-like live inspection showed a contradiction on the disconnected new-chat screen: the same view warned users to connect in `Settings` before sending, but it still let them enable handsfree, entered an active listening state, and showed speech-ready copy like `Handsfree mode turned on. Say the wake phrase to begin.`
  - that behavior made the disconnected chat surface feel more capable than it really was, especially because handsfree semantics imply automatic sending after voice capture while the screen already knew no valid connection config existed
  - the smallest fix was to block handsfree activation when disconnected, keep the standard hold-to-dictate fallback available, and tighten the disconnected copy for both visible and accessibility guidance
- Change made:
  - blocked `toggleHandsFree` from enabling handsfree when the chat lacks connection config, and surfaced a direct disconnected explanation that points users back to `Settings` while preserving the draft-dictation fallback
  - updated the header switch accessibility hint plus composer/mic accessibility helper copy so disconnected handsfree no longer promises automatic sending
  - added focused regression coverage in `apps/mobile/src/lib/accessibility.test.ts` and `apps/mobile/tests/chat-screen-handsfree-density.test.js`
- Verification:
  - `pnpm --filter @dotagents/mobile exec vitest run src/lib/accessibility.test.ts`
  - `node --test apps/mobile/tests/chat-screen-handsfree-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js`
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--before--new-chat-handsfree--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--after--new-chat-handsfree--20260311.png`
  - `git diff --check`
  - live Expo Web browser automation at `390x844` confirming the pre-change disconnected toggle entered a misleading listening state and the post-change toggle stayed off while showing clearer fallback guidance
- Follow-up checks:
  - run a dedicated disconnected existing-chat retry/reconnect pass next so offline chat coverage keeps widening instead of staying on the same new-chat surface again
  - validate the persisted `handsFree: true` edge case in a future pass to confirm the disconnected status-chip subtitle path stays honest when users arrive with handsfree previously enabled

Evidence
- Evidence ID: chat-disconnected-handsfree-clarity
- Scope: disconnected `Chats -> + New Chat` handsfree activation blocker plus tracked before/after screenshots (`apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/lib/accessibility.ts`, `apps/mobile/src/lib/accessibility.test.ts`, `apps/mobile/tests/chat-screen-handsfree-density.test.js`, `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--before--new-chat-handsfree--20260311.png`, `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--after--new-chat-handsfree--20260311.png`). This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: d8140123116632a02df5db3c3dc3f0ff9be4c521..ace57080d1b0eafff809097c8416d70c39c3cee7
- Rationale: The disconnected send guard already prevented text sends, but the same screen still let users activate handsfree and enter a misleading listening state that implied voice requests were ready to run. Blocking that contradictory activation removes a concrete trust/usability problem on a core chat surface without broadening into a larger voice-system refactor.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--before--new-chat-handsfree--20260311.png` — `390x844` Expo Web viewport on disconnected `Chats -> + New Chat` after attempting to enable handsfree. Before the fix, the same screen that warned users to connect before sending still entered a listening state, showed handsfree-ready copy, and visually implied that voice requests were live even though automatic sending could not succeed.
- Change: Blocked disconnected handsfree activation in `ChatScreen`, tightened the disconnected fallback/debug copy, and updated chat accessibility helpers so disconnected handsfree guidance no longer promises automatic sends.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--after--new-chat-handsfree--20260311.png` — same `390x844` Expo Web viewport and view. After the fix, tapping the handsfree toggle while disconnected keeps the switch off, avoids the misleading listening state, and explains that users should connect in `Settings` before enabling handsfree while still allowing hold-to-dictate drafting.
- Verification commands/run results: `pnpm --filter @dotagents/mobile exec vitest run src/lib/accessibility.test.ts` ✅ (33/33 passing, including new disconnected handsfree guidance assertions; pnpm emitted the existing non-blocking Node engine warning under `v25.2.1`); `node --test apps/mobile/tests/chat-screen-handsfree-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js` ✅ (11/11 passing, including the new disconnected handsfree blocker guardrail); `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--before--new-chat-handsfree--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-handsfree-clarity--after--new-chat-handsfree--20260311.png` ✅ (both curated screenshots are matched `780x1688` PNGs captured from the same `390x844` Expo Web viewport); `git diff --check` ✅; live Expo Web browser automation at `390x844` ✅ confirmed the before-state misleading listening UI and the after-state blocked toggle plus clearer fallback copy.
- Blockers/remaining uncertainty: This pass covers the default disconnected handsfree-off entry path only. Existing-chat retry/reconnect, broader offline sync states, and the persisted handsfree-enabled edge case still need dedicated runtime passes before disconnected chat coverage is considered broad.

### 2026-03-11 — Iteration 20: make the blocked chat agent selector lead directly into setup

- Status: completed with live Expo Web before/after evidence, a focused chat-sheet actionability fix, and targeted regression coverage
- Area:
  - disconnected `Chats` / `Chat` header agent selector sheet in `apps/mobile/src/ui/AgentSelectorSheet.tsx`
  - chat/session header wiring in `apps/mobile/src/screens/ChatScreen.tsx` and `apps/mobile/src/screens/SessionListScreen.tsx`
  - narrow mobile web viewport (`390x844`) for the blocked agent-switching sheet and its setup handoff
- Why this area:
  - the intended next parity target was the unchecked desktop-settings model/endpoint picker surface, but live Expo Web investigation showed those remote settings sections were not reachable in the current disconnected runtime, so claiming that pass from source alone would have been weak
  - the same runtime exposed a high-value unchecked modal on a core chat flow: the header agent selector opened successfully, but its disconnected state trapped users inside a retry-only warning even though the real next step was connection setup
- What was investigated:
  - live Expo Web at `390x844` through `Chats` and `Chat` header agent selector entry points on the disconnected default state
  - the current blocked-state rendering and action wiring in `apps/mobile/src/ui/AgentSelectorSheet.tsx`
  - existing chat/session header navigation paths to confirm a small direct handoff into `ConnectionSettings` was already possible
- Findings:
  - the blocked selector state only showed `Configure server URL and API key to switch agents` plus `Retry`, which read like a dead-end warning instead of an actionable configuration flow
  - the modal did not explain that users could keep reviewing existing chats while disconnected, and it did not offer the direct setup action most users would need next
  - both `Chat` and `Chats` already had access to the `ConnectionSettings` route, so the missing behavior was a lightweight sheet-level handoff rather than a navigation-system gap
- Change made:
  - added a dedicated missing-config blocker card in `AgentSelectorSheet` with clearer setup copy, an explicit note that saved chats remain reviewable while disconnected, and a full-width `Open connection settings` action
  - wired the sheet action from both `ChatScreen` and `SessionListScreen` so blocked users can jump directly into `Connection settings` from either header selector
  - extended `apps/mobile/tests/agent-selector-sheet-density.test.js`, `apps/mobile/tests/chat-screen-density.test.js`, and `apps/mobile/tests/session-list-density.test.js` to lock the new copy, touch-target styling, and deep-link wiring
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8146 --clear`
  - `node --test apps/mobile/tests/agent-selector-sheet-density.test.js apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/session-list-density.test.js`
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--before--chat-agent-sheet--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--after--chat-agent-sheet--20260311.png`
  - `git diff --check`
  - live Expo Web browser automation at `390x844` confirming the blocked sheet showed the new action and that tapping it navigated into `Connection settings`
- Follow-up checks:
  - return to the original desktop-settings parity target once a connected runtime is available, specifically the unchecked model picker / endpoint picker / TTS model picker surfaces
  - do a dedicated connected agent-selector pass later to verify the populated list, ACP main-agent variant, and successful switching behavior rather than stopping at the disconnected blocker state

Evidence
- Evidence ID: agent-selector-config-blocker
- Scope: disconnected `Chats` / `Chat` header agent selector blocked state plus tracked before/after screenshots (`apps/mobile/src/ui/AgentSelectorSheet.tsx`, `apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/screens/SessionListScreen.tsx`, `apps/mobile/tests/agent-selector-sheet-density.test.js`, `apps/mobile/tests/chat-screen-density.test.js`, `apps/mobile/tests/session-list-density.test.js`, `docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--before--chat-agent-sheet--20260311.png`, `docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--after--chat-agent-sheet--20260311.png`). This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: 4610cd5c9ac5e1562a8b41322e52976f6c7f3145..63d1361e882049f7043f7a58c36ce970bfc2de89
- Rationale: The next unchecked desktop-settings picker surfaces were not truthfully reachable in the current disconnected runtime, but the same investigation exposed a concrete blocker on a core chat flow: agent switching surfaced a modal that explained the problem without giving users the configuration path needed to fix it. Making that blocked state actionable improves mobile clarity and control without broadening into a larger refactor.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--before--chat-agent-sheet--20260311.png` — `390x844` Expo Web viewport on the disconnected `Chats` header agent selector sheet. Before this change, the modal only told users to configure the server URL and API key, then left them with a generic `Retry` path and no direct handoff into the configuration screen that would actually unblock agent switching.
- Change: Added a dedicated setup-blocker card and full-width `Open connection settings` action inside `AgentSelectorSheet`, plus direct `ConnectionSettings` navigation wiring from both chat/session header selectors.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--after--chat-agent-sheet--20260311.png` — same `390x844` Expo Web viewport and view. After the fix, the blocked agent selector explains the setup prerequisite more clearly, tells users they can still review existing chats while disconnected, and offers a direct `Open connection settings` action that leads straight into the screen needed to finish setup.
- Verification commands/run results: `pnpm build:shared` ✅ (shared package rebuilt successfully; pnpm emitted the existing non-blocking Node engine warning under `v25.2.1`); `pnpm --filter @dotagents/mobile web --port 8146 --clear` ✅ (Expo Web served `http://localhost:8146` and hot-reloaded the updated mobile UI); `node --test apps/mobile/tests/agent-selector-sheet-density.test.js apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/session-list-density.test.js` ✅ (12/12 passing, including the new blocked-state and deep-link guardrails); `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--before--chat-agent-sheet--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/agent-selector-config-blocker--after--chat-agent-sheet--20260311.png` ✅ (both curated screenshots are matched `390x844` PNGs); `git diff --check` ✅; live Expo Web browser automation at `390x844` ✅ confirmed the new `Open connection settings` action was visible on the blocked sheet and that tapping it navigated into `Connection settings`.
- Blockers/remaining uncertainty: This pass fixes the disconnected blocker state only. The fully connected agent-selector list, ACP main-agent variant, and the originally intended desktop-settings picker parity surfaces still need their own dedicated live runtime passes once a connected DotAgents server state is available.

### 2026-03-11 — Iteration 19: stop blank chat debug state from emitting Expo Web text-node errors

- Status: completed with live Expo Web before/after evidence, a minimal disconnected-chat runtime fix, and targeted regression coverage
- Area:
  - disconnected `Chats -> + New Chat` empty debug-info state in `apps/mobile/src/screens/ChatScreen.tsx`
  - narrow mobile web viewport (`390x844`) for the disconnected new-chat ready state and subsequent typing pass
- Why this area:
  - this iteration directly addresses unresolved QA feedback on the current review stack: the claimed-verified disconnected `Chats -> + New Chat` flow still emitted reproducible Expo Web `Unexpected text node` errors on the reviewed head
  - the surface had already earned offline/send-guard coverage, so fixing the noisy runtime regression was a higher-value follow-up than widening scope again while the previous verification notes were overstated
- What was investigated:
  - live Expo Web at `390x844` through `Settings -> Open Chats -> + New Chat` on the disconnected default state
  - browser console output before opening `+ New Chat`, immediately after opening it, and after typing in the composer
  - `apps/mobile/src/screens/ChatScreen.tsx` around the `debugInfo` render path and nearby string-gated UI blocks
- Findings:
  - QA was correct: the disconnected `+ New Chat` ready state reproduced repeated `Unexpected text node: . A text node cannot be a child of a <View>.` console errors as soon as the screen opened, and typing caused additional repeats
  - the underlying UI looked mostly normal, which made the problem easy to miss visually; the warning came from the render path using `debugInfo && (...)` while `debugInfo` is initialized to `''`
  - other offline/sync console noise still exists on this path, but the empty-text-node warning itself is isolated from those broader disconnected-runtime issues
- Change made:
  - added an explicit `hasDebugInfo` boolean guard in `ChatScreen` so blank debug strings no longer render as stray text nodes under a `View` on Expo Web / React Native Web
  - extended `apps/mobile/tests/chat-screen-density.test.js` to lock the boolean guard and prevent the old `debugInfo && (...)` pattern from returning
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8144 --clear`
  - `node --test apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js`
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--before--new-chat-ready--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--after--new-chat-ready--20260311.png`
  - `git diff --check`
  - live Expo Web browser automation at `390x844` confirming the target warning reproduced before the fix, then no longer appeared after opening `+ New Chat` or typing into the composer
- Follow-up checks:
  - investigate the remaining disconnected-chat console noise (`401` / `ERR_CONNECTION_REFUSED` / sync fetch failures) so offline verification can move from this one targeted warning toward a cleaner end-to-end runtime story
  - continue widening offline coverage with existing-chat retry/reconnect and mic/handsfree disconnected flows instead of revisiting this same render guard without new evidence

Evidence
- Evidence ID: chat-debug-info-empty-state
- Scope: disconnected `Chats -> + New Chat` empty debug-info state on mobile web plus tracked before/after screenshots (`apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/tests/chat-screen-density.test.js`, `docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--before--new-chat-ready--20260311.png`, `docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--after--new-chat-ready--20260311.png`). This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: 15db6d59b2aead829c7b541f4a5a7d0f3f3fd31b..472119f71149168eb502f76b104c54e8a7730e4e
- Rationale: The disconnected new-chat send guard was already in place, but the same flow still emitted repeated Expo Web runtime errors on every open/typing pass. Fixing that blank-debug render path removes a concrete verification/trustworthiness problem on a core chat surface without broadening scope beyond the exact QA finding.
- QA feedback: Addressed the unresolved reviewer finding that the disconnected `Chats -> + New Chat` flow still emitted `Unexpected text node: . A text node cannot be a child of a <View>.` during the claimed live recheck, so the earlier verification notes were too strong until this runtime warning was actually fixed.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--before--new-chat-ready--20260311.png` — `390x844` Expo Web viewport on the disconnected `+ New Chat` ready state. Before the fix, the screen looked visually normal enough to miss the bug in a screenshot alone, but entering this exact state immediately emitted repeated `Unexpected text node` console errors because the blank `debugInfo` string was being short-circuited directly under a `View`.
- Change: Replaced the direct `debugInfo && (...)` JSX guard with an explicit `hasDebugInfo` boolean derived from `debugInfo.trim().length > 0`, and added a focused node test that fails if the old render pattern returns.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--after--new-chat-ready--20260311.png` — same `390x844` Expo Web viewport and view. After the fix, the disconnected new-chat screen still shows the same helper copy and disabled `Send` behavior, but the target `Unexpected text node` warning no longer appears when the view opens or after typing into the composer.
- Verification commands/run results: `pnpm build:shared` ✅ (shared package rebuilt successfully; pnpm emitted the existing non-blocking Node engine warning under `v25.2.1`); `pnpm --filter @dotagents/mobile web --port 8144 --clear` ✅ (Expo Web served `http://localhost:8144` and hot-reloaded the updated chat screen); `node --test apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js` ✅ (10/10 passing, including the new debug-info guardrail); `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--before--new-chat-ready--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-debug-info-empty-state--after--new-chat-ready--20260311.png` ✅ (both curated screenshots are matched `390x844` PNGs); `git diff --check` ✅; live Expo Web browser automation at `390x844` ✅ confirmed two occurrences of the target warning immediately after opening `+ New Chat` plus additional repeats after typing before the fix, then no matches for `Unexpected text node` or `A text node cannot be a child of a <View>` after the fix while the same flow and viewport were re-run.
- Blockers/remaining uncertainty: This pass fixes the specific empty-debug-info warning that QA flagged, but it does not yet resolve the other offline/sync console noise still visible on the disconnected chat path (`401 Unauthorized`, `ERR_CONNECTION_REFUSED`, `syncService` fetch failures). Those should get a dedicated follow-up before the broader disconnected-chat runtime is called clean.

### 2026-03-11 — Iteration 18: make QR scanning visibly actionable on mobile web

- Status: completed with live Expo Web before/after evidence, a focused web-permission guidance fix, and targeted regression coverage
- Area:
  - `Settings -> Connection settings -> Scan QR Code` launch state on mobile web in `apps/mobile/src/screens/ConnectionSettingsScreen.tsx`
  - supporting browser-guidance helpers in `apps/mobile/src/screens/connection-settings-qr.ts`
  - narrow mobile web viewport (`390x844`) for the QR scanner launch / permission-guidance surface
- Why this area:
  - this revisit was justified by unresolved QA on the previous QR pass: on the reviewed head, Expo Web could no longer reproduce a visible scanner modal after tapping `Scan QR Code`, so the control looked dead and the prior QR evidence was not reliably reproducible from current runtime behavior
  - fixing that gap had clearer user value than moving on to another modal surface, because QR scanning is a first-run setup affordance and mobile web users need an obvious response when camera permission has not been granted yet
- What was investigated:
  - live Expo Web at `390x844` through `Settings -> Connection settings -> Scan QR Code`
  - current `handleScanQR` permission gating plus the existing QR helper logic in `connection-settings-qr.ts`
  - whether the browser showed any modal, blocker, or close affordance before permission succeeded
- Findings:
  - on Expo Web, tapping `Scan QR Code` produced no visible modal, no `Close scanner` control, no inline blocker, and no visible browser-permission guidance; the screen looked unchanged after the tap
  - the current implementation only opened the scanner modal after camera permission was already available, which meant browser permission friction could leave the main QR action feeling inert on web
  - there was no explicit mobile-web fallback state explaining that the browser may need camera permission or that manual API key/base URL entry remained available
- Change made:
  - changed the web QR launch path so `Scan QR Code` opens a scanner sheet immediately on Expo Web instead of waiting for permission success first
  - added explicit browser guidance copy plus a visible `Allow camera access` / retry action driven by new `getQrScannerWebSheetContent` helper logic in `connection-settings-qr.ts`
  - preserved the existing camera-preview path for granted permission and kept the strengthened `Close scanner` escape action
  - extended `apps/mobile/src/screens/connection-settings-qr.test.ts` and `apps/mobile/tests/connection-settings-density.test.js` to lock the new web guidance states and launch behavior
- Verification:
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8136 --clear`
  - `pnpm --filter @dotagents/mobile run test:vitest`
  - `node --test apps/mobile/tests/connection-settings-density.test.js apps/mobile/tests/connection-settings-validation.test.js`
  - `git diff --check`
  - live Expo Web automation at `390x844` CSS viewport with matched before/after screenshots of the QR launch state
- Follow-up checks:
  - verify the actual camera-preview / successful QR scan state in a browser or native session where camera permission can be granted reliably, so this surface has coverage beyond the pre-permission guidance state
  - continue widening modal/sheet coverage next with the model picker, endpoint picker, agent selector, or import/destructive confirmation surfaces rather than staying inside `Connection Settings` again without a fresh runtime reason

Evidence
- Evidence ID: connection-settings-qr-web-guidance
- Scope: `Settings -> Connection settings -> Scan QR Code` pre-permission launch state on mobile web plus tracked before/after screenshots (`apps/mobile/src/screens/ConnectionSettingsScreen.tsx`, `apps/mobile/src/screens/connection-settings-qr.ts`, `apps/mobile/tests/connection-settings-density.test.js`, `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-qr-web-guidance--before--qr-scanner-launch--20260311.png`, `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-qr-web-guidance--after--qr-scanner-launch--20260311.png`). This scope intentionally excludes the final ledger-only provenance commit.
- Commit range: 201c24632ef54f3375626b07cb9b4f96a74ddc6d..c68dee3b6f662c21c24ff217d6304eee9938b697
- Rationale: The QR scanner is part of the first-run connection flow, but on current Expo Web the primary `Scan QR Code` action had regressed into an apparently dead tap with no visible response. Making that tap open an explicit browser-guidance sheet removes a concrete setup/actionability risk and gives mobile-web users an honest next step before camera permission is available.
- QA feedback: Addressed the unresolved reviewer finding that `Settings -> Connection settings -> Scan QR Code` produced no visible scanner modal, no close control, and no blocker/guidance state on Expo Web; also corrected the earlier `connection-settings-qr-close-affordance` evidence provenance to include its final authored docs commit.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-qr-web-guidance--before--qr-scanner-launch--20260311.png` — `390x844` CSS viewport on Expo Web. Before this change, tapping `Scan QR Code` left the `Connection settings` screen looking unchanged: there was no visible scanner modal, no `Close scanner` affordance, and no browser-specific permission guidance, so the primary QR action read like a dead tap.
- Change: Updated `ConnectionSettingsScreen` so Expo Web opens a visible QR guidance sheet immediately, added a browser-specific helper model with explicit `Allow camera access` / retry copy, and kept the existing camera-preview path plus strengthened close affordance for the granted-permission case.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-qr-web-guidance--after--qr-scanner-launch--20260311.png` — same `390x844` CSS viewport on Expo Web. After the fix, tapping `Scan QR Code` opens a visible dialog/sheet with browser camera guidance, a clear `Allow camera access` action, and a visible `Close scanner` escape control, so the QR path now communicates an actionable next step instead of failing silently.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8136 --clear` ✅ (Expo Web served `http://localhost:8136` and reloaded the updated mobile screen); `pnpm --filter @dotagents/mobile run test:vitest` ✅ (62/62 passing, including the new QR web-sheet helper coverage); `node --test apps/mobile/tests/connection-settings-density.test.js apps/mobile/tests/connection-settings-validation.test.js` ✅ (9/9 passing); `git diff --check` ✅; live Expo Web browser automation at `390x844` ✅ with matched before/after screenshots confirming the pre-change dead tap versus the new visible QR guidance dialog.
- Blockers/remaining uncertainty: This pass makes the pre-permission web QR state visible and actionable, but it does not yet prove a full granted-permission camera preview or successful scan on web/native. Browser permission prompts are still automation-constrained, so the actual post-permission scan path should get its own dedicated live pass later.

### 2026-03-11 — Iteration 17: make the QR scanner modal close control feel like a real mobile action

- Status: completed with live Expo Web before/after evidence, a focused scanner-dismiss affordance fix, and targeted regression coverage
- Area:
  - `Settings -> Connection settings -> Scan QR Code` modal close control in `apps/mobile/src/screens/ConnectionSettingsScreen.tsx`
  - narrow mobile web viewport (`390x844`) for the QR scanner modal close/action surface and safe-area placement
- Why this area:
  - even though `Connection Settings` had prior runtime coverage, the ledger still marked the QR scanner close control as uncertain because the live Expo Web button measured slightly under the 44px height bar and had never received its own dedicated modal-close pass
  - that made this a justified revisit of an unfinished modal surface, not another generic polish loop on already-approved header chrome
- What was investigated:
  - live Expo Web at `390x844` through `Settings -> Connection settings -> Scan QR Code`
  - the current QR scanner close control wording, placement, and measured touch target on web
  - nearby mobile modal-close patterns already used elsewhere in `SettingsScreen.tsx`
- Findings:
  - the QR scanner modal opened reliably, but the visible `Close` control measured about `66.7x42` CSS px in Expo Web, leaving the height just under the 44px touch-target floor
  - the button was pinned with a hardcoded `top: 60`, which left it lower than necessary on web and less adaptive to real safe-area/container conditions
  - the visible copy was generic enough that the control read more like a plain overlay dismiss than a scanner-specific mobile action
- Change made:
  - updated the QR scanner close control to use the shared `createMinimumTouchTargetStyle` helper with a 44px minimum target, a bordered pill treatment, and a safe-area-aware top offset
  - changed the visible label from `Close` to `Close scanner` so the dismiss action reads more explicitly in-context on narrow screens while preserving the existing `Close QR scanner` accessibility label
  - extended `apps/mobile/tests/connection-settings-density.test.js` to lock the explicit label, safe-area positioning, and minimum-target styling
- Verification:
  - `pnpm --filter @dotagents/mobile web --port 8132 --clear`
  - `node --test apps/mobile/tests/connection-settings-density.test.js`
  - `git diff --check`
  - live Expo Web automation at `390x844` CSS viewport with before/after screenshots of the QR scanner modal and DOM measurement of the close control
- Follow-up checks:
  - widen modal/sheet coverage next to the remaining model picker, endpoint picker, agent selector, and destructive confirmation surfaces instead of revisiting `Connection Settings` again without a fresh regression signal
  - continue the offline coverage map with existing-chat retry/reconnect or handsfree disconnected states once the next modal pass is no longer the highest-value unchecked item

Evidence
- Evidence ID: connection-settings-qr-close-affordance
- Scope: `Settings -> Connection settings -> Scan QR Code` modal close control on mobile web (`apps/mobile/src/screens/ConnectionSettingsScreen.tsx`, `apps/mobile/tests/connection-settings-density.test.js`)
- Commit range: e19461200e750340f37d895e20d72555297ea4e9..201c24632ef54f3375626b07cb9b4f96a74ddc6d
- Rationale: The QR scanner is a primary connection-setup affordance, and the only obvious way out of that modal was still slightly undersized and weakly tuned on narrow mobile web. Tightening the dismiss control removes a small but real actionability risk in a setup flow users may need repeatedly.
- QA feedback: None (new iteration)
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-qr-close-affordance--before--qr-scanner-modal--20260311.png` — `390x844` CSS viewport on Expo Web. Before this change, the scanner modal showed a generic `Close` pill about `66.7x42` CSS px at roughly `top: 60`, which left the main escape action just under the 44px touch-target bar and visually less specific than the scanner context deserved.
- Change: Updated the QR scanner modal close control to use the shared minimum-touch-target helper, moved it to a safe-area-aware top offset, strengthened the pill styling, and changed the visible text to `Close scanner` while keeping the existing accessibility label.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/connection-settings-qr-close-affordance--after--qr-scanner-modal--20260311.png` — same `390x844` CSS viewport on Expo Web. The close affordance now sits at `top: 16`, renders as a clearer bordered pill labeled `Close scanner`, and measures about `113.7x44` CSS px, so the scanner exit control reads as a deliberate mobile action and now clears the 44px minimum height bar.
- Verification commands/run results: `pnpm --filter @dotagents/mobile web --port 8132 --clear` ✅ (Expo Web served `http://localhost:8132` and reloaded the updated mobile screen); `node --test apps/mobile/tests/connection-settings-density.test.js` ✅ (3/3 passing, including the new close-control guardrail); `git diff --check` ✅; live Expo Web browser automation at `390x844` ✅ with before/after screenshots saved plus measured close-control geometry changing from about `66.7x42` before to `113.7x44` after.
- Blockers/remaining uncertainty: This pass closes the QR scanner modal-close gap, but the broader modal/sheet checklist is still incomplete. The remaining model picker, endpoint picker, agent selector, destructive confirmation surfaces, and the disconnected existing-chat/handsfree states still need dedicated runtime coverage before those areas can be claimed as fully checked.

### 2026-03-11 — QA remediation 3: recapture matched offline evidence and correct iteration 16 provenance

- Status: completed with matched-resolution Expo Web evidence recaptures, stale blocker cleanup, and corrected ledger provenance for the disconnected offline review stack
- Area:
  - historical evidence/provenance for the disconnected `Settings -> Open Chats` CTA and disconnected `Chats -> + New Chat` send-guard iterations in `mobile-app-improvement.md`
  - stale present-tense runtime-blocker wording in earlier 2026-03-09 ledger entries that no longer reflects the current worktree
  - no product code changes; this pass is limited to truthful evidence repair and comparison-safe screenshot recapture
- Why this area:
  - it deserved the immediate next pass because unresolved QA found three factual problems in the ledger: iteration 16 stopped its authored SHA span before the final docs/evidence commit, the disconnected new-chat before screenshot was a stitched `390x2060` capture paired against a `390x844` after view, and the disconnected Settings-home QA screenshot was saved at `780x1688` instead of the matched mobile viewport
  - those issues make the review stack less trustworthy even though the underlying runtime behavior was already correct, so fixing the evidence was a higher-value follow-up than widening scope again first
- What was investigated:
  - current disconnected Expo Web runtime at `390x844` for the Settings-home `Open Chats` CTA and the guarded disconnected new-chat composer
  - the pre-fix disconnected chat state reproduced by temporarily checking out `apps/mobile/src/screens/ChatScreen.tsx` from commit `329351ba2e379046fad1e2617d742ff192d6f545`
  - the tracked screenshot dimensions under `docs/aloops-evidence/mobile-app-improvement-loop`
- Findings:
  - QA was correct that the prior `chat-disconnected-send-guard` ready-to-send before capture was a full-page `390x2060` image, so it could not safely be compared against the `390x844` after screenshot for the same view
  - QA was also correct that the remediation screenshot for `settings-offline-open-chats` had drifted to `780x1688`, which broke same-view comparison against the `390x844` before capture
  - iteration 16's Evidence block really did under-report provenance by ending at `bd572eb1778dc3aa7498d33efc3ba9f22ef5f92a` instead of the full authored head `f1f7375df34698bc813e4c64ca3fe2d2cd48d5b9`
  - QA was also correct that several older 2026-03-09 source-backed entries still spoke in the present tense about missing `node_modules` / `expo`, even though Expo Web is now available in this worktree after `pnpm build:shared`
- Change made:
  - recaptured the disconnected Settings-home remediation screenshot at an exact `390x844` viewport and saved it as `settings-offline-open-chats--after--settings-home--qa-r2--20260311.png`
  - reproduced the pre-fix disconnected new-chat state, then recaptured the `ready` and `send-error` before screenshots plus the guarded after screenshot at the same `390x844` viewport using QA-specific filenames
  - corrected the historical ledger references so iteration 16 now points at the matched `qa-r1` chat screenshots and reports the full authored SHA span through `f1f7375df34698bc813e4c64ca3fe2d2cd48d5b9`, while the prior Settings remediation now references the corrected `qa-r2` screenshot
  - added the missing structured Evidence block for this remediation pass, reframed the older 2026-03-09 runtime notes as historical gaps instead of current blockers, and removed the superseded tracked screenshots that QA identified as mismatched
- Verification:
  - `pnpm --filter @dotagents/mobile web --port 8120 --clear`
  - `pnpm --filter @dotagents/mobile web --port 8121 --clear`
  - `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--new-chat-ready--qa-r1--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--send-error--qa-r1--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--after--new-chat-ready--qa-r1--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--qa-r2--20260311.png`
  - `pnpm build:shared`
  - `pnpm --filter @dotagents/mobile web --port 8131 --clear`
  - `git diff --check`
- Follow-up checks:
  - return to uncovered offline runtime behavior next, especially existing-chat retry/reconnect, mic/handsfree disconnected flows, and broader session loading/error states
  - avoid revisiting these same evidence blocks again unless a later QA pass finds another factual mismatch

Evidence
- Evidence ID: offline-evidence-provenance-repair
- Scope: QA remediation for the disconnected offline review stack in `mobile-app-improvement.md`, including the missing structured Evidence block for this section, stale runtime-blocker cleanup in older 2026-03-09 entries, and removal of superseded tracked screenshots under `docs/aloops-evidence/mobile-app-improvement-loop`
- Commit range: 91c7db81c8bbafe55927771981e24acde4345568..e32129daece486b61acc5b9993e577d93330356d
- Rationale: The underlying disconnected mobile behavior was already improved, but the ledger still contained factual QA defects: this remediation section had no required Evidence block of its own, several older entries still implied Expo Web is currently unavailable when that is no longer true in this worktree, and the repo still tracked superseded mismatched screenshots. Fixing those provenance problems is necessary so the mobile review stack stays auditable and does not mislead later parity work.
- QA feedback: Addressed reviewer findings that QA remediation 3 lacked its own required Evidence block, that stale present-tense `node_modules` / `expo` blocker claims still remained in older ledger entries despite current Expo Web availability, and that superseded `chat-disconnected-send-guard` / `settings-offline-open-chats` screenshots were still tracked after matched recaptures replaced them.
- Before evidence: QA feedback against reviewed range `91c7db81c8bbafe55927771981e24acde4345568..e32129daece486b61acc5b9993e577d93330356d` documented three provenance defects: this remediation section stopped without a literal Evidence block, multiple older entries still claimed in the present tense that Expo Web could not start because `node_modules` were missing, and the repo still tracked the known-bad screenshot files `chat-disconnected-send-guard--before--new-chat-ready--20260311.png`, `chat-disconnected-send-guard--before--send-error--20260311.png`, `chat-disconnected-send-guard--after--new-chat-ready--20260311.png`, and `settings-offline-open-chats--after--settings-home--qa-r1--20260311.png` even though matched `qa-r1` / `qa-r2` captures had superseded them.
- Change: Added this structured Evidence block directly under QA remediation 3, updated the earlier 2026-03-09 source-backed entries so they now describe the Expo Web failures as historical original-pass conditions rather than current worktree blockers, and removed the superseded tracked screenshots that no longer belong in the curated evidence set.
- After evidence: `mobile-app-improvement.md` now contains an explicit Evidence block for QA remediation 3, the earlier 2026-03-09 entries now preserve the original `expo: command not found` results as dated historical context while explicitly noting that current Expo Web availability was restored later in this worktree, and the curated evidence directory now contains only the retained offline screenshots (`settings-offline-open-chats--before--settings-home--20260311.png`, `settings-offline-open-chats--after--settings-home--20260311.png`, `settings-offline-open-chats--after--settings-home--qa-r2--20260311.png`, plus the `chat-disconnected-send-guard` `qa-r1` set) instead of the superseded mismatched files.
- Verification commands/run results: Historical recapture verification already recorded here remains `pnpm --filter @dotagents/mobile web --port 8120 --clear` ✅; `pnpm --filter @dotagents/mobile web --port 8121 --clear` ✅; `sips -g pixelWidth -g pixelHeight docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--new-chat-ready--qa-r1--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--send-error--qa-r1--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--after--new-chat-ready--qa-r1--20260311.png docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--qa-r2--20260311.png` ✅; current truthfulness cleanup additionally ran `pnpm build:shared` ✅ (shared package rebuilt successfully; pnpm emitted only non-blocking engine warnings under Node `v25.2.1`), `pnpm --filter @dotagents/mobile web --port 8131 --clear` ✅ (Expo Web started, Metro bundled `apps/mobile/index.ts`, and served `http://localhost:8131` before shutdown; Expo also emitted non-blocking package-version drift warnings), and `git diff --check` ✅.
- Blockers/remaining uncertainty: This remediation pass repairs evidence truthfulness and curated screenshot provenance only; it does not widen product/runtime coverage beyond the already-checked disconnected Settings-home and disconnected new-chat text-send flows. Existing-chat retry/reconnect plus disconnected mic/handsfree states remain the next uncovered offline surfaces.

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
- Commit range: 329351ba2e379046fad1e2617d742ff192d6f545..f1f7375df34698bc813e4c64ca3fe2d2cd48d5b9
- Rationale: The disconnected `Open Chats` fix made chat history reachable offline, but the very next uncovered step still let a first-run user type into a brand-new chat, tap `Send`, and only then hit a raw 401-style failure. Guarding that state in the composer is a clearer, more actionable mobile experience because it explains the real prerequisite before the user trips a confusing error path.
- QA feedback: Addressed the previously unresolved `settings-offline-open-chats` review findings in the remediation block below; this disconnected new-chat send guard itself is a new iteration.
- Before evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--new-chat-ready--qa-r1--20260311.png` — `390x844` CSS viewport on Expo Web. Before this change, the disconnected `+ New Chat` screen let the user type a draft with an apparently actionable `Send` button and no inline explanation that connection setup was still required. `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--before--send-error--qa-r1--20260311.png` — same `390x844` viewport after tapping `Send`, showing the raw 401-style failure and generic retry/internet messaging that made the missing-config problem feel like a runtime/server glitch.
- Change: Added a focused disconnected send-availability helper, blocked `ChatScreen` send attempts up front when `baseUrl`/`apiKey` are not both configured, surfaced an inline composer notice plus setup-focused placeholder/accessibility copy, and disabled `Send` until the composer has both content and usable connection settings.
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/chat-disconnected-send-guard--after--new-chat-ready--qa-r1--20260311.png` — same `390x844` CSS viewport on Expo Web. The disconnected new-chat composer now keeps the typed draft visible, shows an inline explanation that saved chats remain viewable while disconnected, and leaves `Send` disabled before any confusing auth/network failure can happen.
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
  - live Expo Web automation at `390x844` CSS viewport with a fresh disconnected Settings-home screenshot now re-captured as `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--qa-r2--20260311.png` and a tap-through into `Chats`
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
- After evidence: `docs/aloops-evidence/mobile-app-improvement-loop/settings-offline-open-chats--after--settings-home--qa-r2--20260311.png` — same `390x844` CSS viewport on Expo Web during the QA follow-up recapture. The disconnected Settings home still shows an enabled `Open Chats` CTA with the offline helper copy intact, and the corrected evidence pair now matches the mobile viewport used for the original blocked state.
- Verification commands/run results: `pnpm build:shared` ✅; `pnpm --filter @dotagents/mobile web --port 8116 --clear` ✅ (Expo Web live at `http://localhost:8116` during the remediation pass); `pnpm --filter @dotagents/mobile run test:vitest` ✅; `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/session-list-empty-state.test.js` ✅; `git diff --check` ✅; live Expo Web disconnected Settings-home screenshot recaptured at `390x844` and tap-through into `Chats` re-verified ✅.
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

- Status: completed with source-backed verification; live Expo Web inspection was unavailable during the original 2026-03-09 pass before this worktree later regained Expo Web runtime availability
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
  - during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8102` failed with `expo: command not found`, so live runtime inspection was deferred for that pass
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
  - when revisiting this surface in a fresh Expo Web pass, verify that longer partial-load warnings wrap cleanly above the retry button without pushing the rest of `Desktop Settings` too far down on a narrow viewport
  - continue widening coverage to session loading/error/sync states or modal/sheet surfaces rather than returning to already-improved settings subsections without a new finding

Evidence
- Scope: Settings desktop partial-load warning / retry state in `apps/mobile/src/screens/SettingsScreen.tsx`
- Before evidence: Source review showed the warning rendering as `styles.warningContainer` with `flexDirection: 'row'`, `justifyContent: 'space-between'`, and `alignItems: 'center'`, containing only `⚠️ {remoteError}` plus a text-only `Retry` action. The retry affordance had no mobile-sized button styling, no `createMinimumTouchTargetStyle(...)`, and no explanation that partially loaded desktop settings may now be stale. During the original 2026-03-09 pass, live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8102`, but the command failed with `expo: command not found`; that missing-runtime note is historical and does not describe the current worktree, where Expo Web later became available again after `pnpm build:shared`.
- Change: Reworked the Settings warning into a stacked alert card with a title, raw error detail, stale-data guidance, and a full-width retry button using the shared 44px touch-target helper plus explicit accessibility metadata. Added a focused regression test file.
- After evidence: Source now shows `styles.warningContainer` with `width: '100%'`, `gap: spacing.md`, and `alignItems: 'stretch'`; `styles.warningContent` groups the message copy; and the UI now includes `Desktop settings need attention` plus `Some desktop sections may be out of date until the retry finishes.`. The retry action now uses `styles.warningRetryButton` with `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })`, `width: '100%'`, centered label text, and `createButtonAccessibilityLabel('Retry loading desktop settings')`. `apps/mobile/tests/settings-remote-warning-state.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/settings-remote-warning-state.test.js apps/mobile/tests/agent-loops-actions.test.js` ✅ (4/4 passing); `git diff --check` ✅; during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8102` ❌ (`expo: command not found`; current worktree later regained Expo Web availability after `pnpm build:shared`).
- Blockers/remaining uncertainty: No live before/after visual evidence was captured during the original 2026-03-09 pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to the exact runtime wrapping, vertical spacing, and visual prominence of the stacked warning card until a fresh Expo Web pass revisits this surface.

### 2026-03-09 — Iteration 10: make MemoryEdit importance choices readable and tappable on narrow screens

- Status: completed with source-backed verification; live Expo Web inspection was unavailable during the original 2026-03-09 pass before this worktree later regained Expo Web runtime availability
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
  - during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8101` failed with `expo: command not found`, so live runtime inspection was deferred for that pass
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
  - when revisiting this surface in a fresh Expo Web pass, verify `MemoryEdit` on a narrow viewport and confirm the stacked importance rows, helper descriptions, and save-button spacing remain readable without excessive scrolling
  - inspect the rest of `MemoryEdit` next, especially loading/error states and large-text behavior for the title/content/tags fields, so memory coverage broadens beyond this selector subsection
  - continue widening coverage to remaining modal/sheet and session-state surfaces instead of revisiting already-checked edit selectors without a new finding

Evidence
- Scope: `MemoryEdit` importance selection in `apps/mobile/src/screens/MemoryEditScreen.tsx`
- Before evidence: Source review showed the importance control rendering as `styles.optionRow` (`flexDirection: 'row'`, `flexWrap: 'wrap'`) with each `styles.option` using only inline padding, no `createMinimumTouchTargetStyle(...)`, no explicit `accessibilityRole`, and no selected-state metadata. The UI exposed only `Low` / `Medium` / `High` / `Critical` labels with no guidance about how priority changes memory retrieval. During the original 2026-03-09 pass, live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8101`, but the command failed with `expo: command not found`; that runtime note is historical only and no longer describes the current worktree.
- Change: Reworked the MemoryEdit importance selector into full-width descriptive rows, added 44px minimum touch-target styling plus explicit button labels/hints/selected-state metadata, added a visible checkmark for the selected option, and added a focused regression test file.
- After evidence: Source now shows `styles.importanceOptions` with `width: '100%'`, `styles.importanceOption` using `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })`, and each option exposing `accessibilityRole="button"` plus `accessibilityState={{ selected: isSelected, disabled: isSaving }}`. The screen now explains `Higher-priority memories are surfaced first when the agent loads context.` and each importance row includes a description, while the selected option also shows a `✓` checkmark so selection is not color-only. `apps/mobile/tests/memory-edit-importance-options.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (22/22 passing); `git diff --check` ✅; during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8101` ❌ (`expo: command not found`; current worktree later regained Expo Web availability after `pnpm build:shared`).
- Blockers/remaining uncertainty: No live before/after visual evidence was captured during the original 2026-03-09 pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to the exact runtime spacing, copy wrapping, and scroll depth of the new MemoryEdit importance rows until a fresh Expo Web pass revisits this surface.

### 2026-03-09 — Iteration 9: make AgentEdit connection modes mobile-readable and stop misrouting ACP setup

- Status: completed with source-backed verification; live Expo Web inspection was unavailable during the original 2026-03-09 pass before this worktree later regained Expo Web runtime availability
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
  - during the original 2026-03-09 pass, Expo Web startup failed with `expo: command not found`, so live runtime inspection was deferred for that pass
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
  - when revisiting this surface in a fresh Expo Web pass, verify `AgentEdit` on a narrow viewport and confirm the stacked connection rows, long descriptions, and mode-specific fields remain readable without pushing the save action too far down
  - inspect `MemoryEdit` next so coverage continues widening across the edit flows instead of staying inside agent/loop configuration
  - validate the remaining `AgentEdit` states later, especially built-in-agent limited editing and large-text behavior across long prompt/guidelines inputs

Evidence
- Scope: `AgentEdit` connection-type selection and mode-specific setup fields in `apps/mobile/src/screens/AgentEditScreen.tsx`
- Before evidence: Source review showed `CONNECTION_TYPES` as four label-only chips, `styles.connectionTypeRow` as a wrapping row, and `styles.connectionTypeOption` using only inline padding with no `createMinimumTouchTargetStyle(...)`, no explicit button role, and no selected-state metadata. The form rendered `Base URL` for `(formData.connectionType === 'remote' || formData.connectionType === 'acp')`, while shared/server types describe `acp` as a local command-based profile (`command`, `args`, `cwd`) and only `remote` as URL-based. During the original 2026-03-09 pass, live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8097`, but the command failed with `expo: command not found`; that runtime note is historical only and no longer describes the current worktree.
- Change: Reworked the `AgentEdit` connection-type selector into full-width descriptive rows with 44px minimum touch targets and selected-state button semantics, then split the mode-specific fields so `acp` and `stdio` share local command inputs while `remote` alone shows `Base URL`. Added a focused regression test file.
- After evidence: Source now shows `styles.connectionTypeOptions` with `width: '100%'`, `styles.connectionTypeOption` using `createMinimumTouchTargetStyle({ minSize: 44, horizontalMargin: 0, ... })`, and each connection choice exposing `accessibilityRole="button"` plus `accessibilityState={{ selected: ... }}`. `AgentEditScreen.tsx` now uses `showCommandFields = formData.connectionType === 'acp' || formData.connectionType === 'stdio'` and `showRemoteBaseUrlField = formData.connectionType === 'remote'`, so ACP no longer reuses the remote-only URL field. `apps/mobile/tests/agent-edit-connection-types.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (19/19 passing); `git diff --check` ✅; during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8097` ❌ (`expo: command not found`; current worktree later regained Expo Web availability after `pnpm build:shared`).
- Blockers/remaining uncertainty: No live before/after visual evidence was captured during the original 2026-03-09 pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to the exact runtime spacing, description wrapping, and scroll depth of the new `AgentEdit` connection rows until a fresh Expo Web pass revisits this surface.

### 2026-03-09 — QA remediation 1: stop hidden AgentEdit base-URL persistence and add real switch/save coverage

- Status: completed with targeted source + behavior verification; live Expo Web remained unavailable during the original 2026-03-09 QA pass before this worktree later regained Expo Web runtime availability
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
  - when revisiting this surface in a fresh Expo Web pass, verify that switching `Remote -> ACP` clears the remote-only field value and that saving an existing ACP profile with previously stale hidden URL data does not rehydrate that URL in the form
  - keep future mobile coverage widening outside `AgentEdit` after this QA pass, especially `MemoryEdit` and broader loading/error states, instead of returning to the same subsection without a new finding

Evidence
- Scope: QA remediation for `AgentEdit` connection-type switch/save persistence and desktop agent-profile connection sanitization
- Before evidence: QA findings documented that `AgentEditScreen.tsx` still saved `connectionBaseUrl` for every connection type and only changed `connectionType` on selection, while `apps/desktop/src/main/remote-server.ts` preserved `baseUrl` during updates even for ACP profiles. The existing `apps/mobile/tests/agent-edit-connection-types.test.js` only regex-matched source text/layout and would not fail on hidden-field persistence.
- Change: Added `apps/mobile/src/screens/agent-edit-connection-utils.ts` to clear stale remote URL state on type switches and build type-specific save payloads, wired `AgentEditScreen.tsx` through that helper, added `apps/desktop/src/main/agent-profile-connection-sanitize.ts` so the server drops type-incompatible connection fields during create/update, and added focused behavior tests for both paths.
- After evidence: The mobile helper now clears `connectionBaseUrl` whenever the form leaves `remote` and only includes `connectionBaseUrl` in save payloads for `remote`. The desktop sanitization helper now returns `{ type: 'acp' | 'stdio' }` connections without `baseUrl`, returns `{ type: 'remote' }` connections without local command fields, and removes blank visible values instead of preserving stale saved ones. The new behavior tests directly cover remote-to-ACP switching, ACP save payload shaping, remote save payload shaping, stale `baseUrl` removal for ACP persistence, remote-only persistence, and explicit remote URL clearing.
- Verification commands/run results: `node --experimental-strip-types --test apps/mobile/tests/agent-edit-connection-types.test.js apps/mobile/tests/agent-edit-connection-persistence.test.mjs apps/desktop/src/main/agent-profile-connection-sanitize.test.mjs` ✅ (9/9 passing; Node emitted a non-blocking `MODULE_TYPELESS_PACKAGE_JSON` warning while importing the new mobile `.ts` helper directly for the test run); `git diff --check` ✅.
- Blockers/remaining uncertainty: No live visual evidence was captured during the original 2026-03-09 QA pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to runtime web/mobile form behavior until a fresh Expo Web pass revisits the switch/save flow.

### 2026-03-09 — Iteration 8: make LoopEdit profile selection readable and tappable on narrow screens

- Status: completed with source-backed verification; live Expo Web inspection was unavailable during the original 2026-03-09 pass before this worktree later regained Expo Web runtime availability
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
  - during the original 2026-03-09 pass, Expo Web startup failed with `expo: command not found`, so live runtime inspection was deferred for that pass
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
  - when revisiting this surface in a fresh Expo Web pass, verify the LoopEdit profile selector on a narrow viewport and confirm long profile names wrap cleanly without crowding the save action
  - inspect `MemoryEdit` next so coverage continues widening across edit flows instead of staying in Settings/Loop surfaces
  - inspect the rest of `LoopEdit` for large-text behavior, especially the prompt and interval fields, once live runtime validation is available

Evidence
- Scope: `LoopEdit` agent-profile selection in `apps/mobile/src/screens/LoopEditScreen.tsx`
- Before evidence: Source review showed `styles.profileOptions` as a wrapping chip row (`flexDirection: 'row'`, `flexWrap: 'wrap'`) and `styles.profileOption` using only `paddingVertical: spacing.sm` / `paddingHorizontal: spacing.md`, with no `createMinimumTouchTargetStyle(...)`, no explicit button role, and no selected-state metadata. The default fallback choice was labeled only as `No profile`, with no copy explaining that the loop would use the default active agent. During the original 2026-03-09 pass, live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8096`, but the command failed with `expo: command not found`; that runtime note is historical only and no longer describes the current worktree.
- Change: Reworked the LoopEdit profile selector into full-width rows, added 44px minimum touch-target styling plus explicit button labels/hints/selected-state metadata, clarified the default-agent fallback copy, and added a focused regression test file.
- After evidence: Source now shows `styles.profileOptions` with `width: '100%'`, `styles.profileOption` using `createMinimumTouchTargetStyle({ minSize: 44, ... })`, and each option exposing `accessibilityRole="button"` plus `accessibilityState={{ selected: ... }}`. The UI copy now explains `Choose a dedicated agent for this loop, or leave it on the default agent.` and `No saved agent profiles yet. This loop will use the default agent until you create one.` `apps/mobile/tests/loop-edit-profile-selection.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (16/16 passing); `git diff --check` ✅; during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8096` ❌ (`expo: command not found`; current worktree later regained Expo Web availability after `pnpm build:shared`).
- Blockers/remaining uncertainty: No live before/after visual evidence was captured during the original 2026-03-09 pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to the exact runtime spacing, text wrapping, and visual weight of the new full-width profile rows until a fresh Expo Web pass revisits this surface.

### 2026-03-09 — Iteration 7: make agent loop row actions readable and tappable

- Status: completed with source-backed verification; live Expo Web inspection was unavailable during the original 2026-03-09 pass before this worktree later regained Expo Web runtime availability
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
  - during the original 2026-03-09 pass, Expo Web startup failed with `expo: command not found`, so live runtime inspection was deferred for that pass
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
  - when revisiting this surface in a fresh Expo Web pass, verify the Agent Loops action row on a narrow viewport and confirm the switch + buttons wrap cleanly without crowding loop content
  - inspect the adjacent `LoopEdit` screen next so coverage moves from list-row actions into the loop create/edit flow itself
  - continue broadening edit-flow coverage to `MemoryEdit` and `AgentEdit`

Evidence
- Scope: Settings -> Agent Loops list row actions in `apps/mobile/src/screens/SettingsScreen.tsx`
- Before evidence: Source review showed each loop row rendering `Run` and `Delete` as tiny text controls with inline styles `padding: 4` and `fontSize: 12`, plus no explicit button labels/hints. During the original 2026-03-09 pass, live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8095`, but the command failed with `expo: command not found`; that runtime note is historical only and no longer describes the current worktree.
- Change: Reworked the loop action area into a wrapping full-width row, restyled `Run now` and `Delete` as 44px minimum touch-target buttons, and added descriptive accessibility labels/hints plus a focused regression test file.
- After evidence: Source now shows `styles.loopActions` with `width: '100%'` and `flexWrap: 'wrap'`, and both loop actions use `styles.loopActionButton` with `createMinimumTouchTargetStyle({ minSize: 44, ... })`, explicit button semantics, and descriptive labels/hints. `apps/mobile/tests/agent-loops-actions.test.js` passes and locks those guardrails.
- Verification commands/run results: `node --test apps/mobile/tests/*.test.js` ✅ (13/13 passing); `git diff --check` ✅; during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8095` ❌ (`expo: command not found`; current worktree later regained Expo Web availability after `pnpm build:shared`).
- Blockers/remaining uncertainty: No live before/after visual evidence was captured during the original 2026-03-09 pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to the exact runtime wrap/spacing of the new loop action row until a fresh Expo Web pass revisits this surface.

### 2026-03-09 — Iteration 6: make the session empty state actionable in-place

- Status: completed with source-backed verification; live Expo Web inspection was unavailable during the original 2026-03-09 pass before this worktree later regained Expo Web runtime availability
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
  - during the original 2026-03-09 pass, Expo Web startup failed with `expo: command not found`, so live runtime inspection was deferred for that pass
- Change made:
  - updated the empty-state copy to clearer chat-focused language (`No chats yet`)
  - added an in-place primary `Start first chat` CTA wired to the existing `handleCreateSession` flow
  - constrained the empty-state content width and button width so the new CTA stays centered and readable on narrow mobile layouts
  - added `apps/mobile/tests/session-list-empty-state.test.js` to lock the CTA wiring and layout guardrails
- Verification:
  - `node --test apps/mobile/tests/session-list-empty-state.test.js apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/connection-settings-validation.test.js apps/mobile/tests/navigation-header.test.js`
  - `git diff --check`
- Follow-up checks:
  - when revisiting this surface in a fresh Expo Web pass, verify the session empty state on narrow viewports and confirm the CTA remains above the Rapid Fire footer without crowding
  - continue widening coverage to under-checked screens like `AgentEdit`, `MemoryEdit`, `LoopEdit`, and session loading/error/sync states

Evidence
- Scope: Session list empty state (`Settings -> Go to Chats` with no sessions) in `apps/mobile/src/screens/SessionListScreen.tsx`
- Before evidence: Source review showed the empty state only rendered `No Sessions Yet` plus `Start a new chat to begin a conversation`, with no in-place CTA. During the original 2026-03-09 pass, live Expo Web inspection was attempted with `pnpm --filter @dotagents/mobile web --port 8094`, but the command failed with `expo: command not found`; that runtime note is historical only and no longer describes the current worktree.
- Change: Added a centered `Start first chat` button inside the empty state, wired it to `handleCreateSession`, tightened empty-state width constraints for narrow layouts, and added a focused regression test file.
- After evidence: Source now shows the empty state rendering `Start first chat` with button semantics and the existing create-session handler; `apps/mobile/tests/session-list-empty-state.test.js` passes and locks the CTA text, wiring, and width constraints.
- Verification commands/run results: `node --test apps/mobile/tests/session-list-empty-state.test.js apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/connection-settings-validation.test.js apps/mobile/tests/navigation-header.test.js` ✅ (11/11 passing); `git diff --check` ✅; during the original 2026-03-09 pass, `pnpm --filter @dotagents/mobile web --port 8094` ❌ (`expo: command not found`; current worktree later regained Expo Web availability after `pnpm build:shared`).
- Blockers/remaining uncertainty: No live Expo Web before/after visual evidence was captured during the original 2026-03-09 pass. That is now a historical evidence gap rather than a current runtime blocker; remaining uncertainty is limited to runtime spacing/visual fit of the new empty-state CTA until a fresh Expo Web pass revisits this surface.

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
