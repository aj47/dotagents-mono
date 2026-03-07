# Mobile App Improvement Ledger

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

