# Mobile App Improvement Ledger

## Purpose

- Track mobile investigations, fixes, regressions, and next checks.
- Prefer one small, shippable improvement per iteration.
- Use Expo Web when practical for repeatable inspection.

## Recent Iterations

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
