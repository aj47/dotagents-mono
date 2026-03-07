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