# Mobile App Improvement Ledger

## Purpose

- Track mobile investigations, fixes, regressions, and next checks.
- Prefer one small, shippable improvement per iteration.
- Use Expo Web when practical for repeatable inspection.

## Coverage Map

### Checked screens/flows

- [x] Settings root screen and nested back navigation
- [x] Connection setup flow, save validation, and inline connection actions
- [x] Sessions list entry points, top actions, and empty state
- [x] Chat thread composer controls, voice/listening announcements, and disclosure states
- [x] Settings -> Agent Loops list row actions (source-backed in this worktree)
- [x] Loop create/edit screen agent-profile selection section (source-backed in this worktree)
- [x] Agent create/edit screen (`AgentEdit`) connection-type selection and mode-specific fields (source-backed in this worktree)

### Not yet checked

- [ ] Memory create/edit screen (`MemoryEdit`)
- [ ] Agent create/edit remaining fields and built-in-agent limited-edit state outside the connection-type section
- [ ] Loop create/edit live save flow, runtime layout, and remaining fields
- [ ] Session loading, error, reconnect, and sync states
- [ ] Modal/sheet surfaces on narrow web viewports (model picker, agent selector, voice pickers)
- [ ] Large-text / awkward viewport behavior across Settings, Sessions, Chat, and edit screens
- [ ] Settings reconnect warning state (`⚠️ Failed to load: settings`)

### Reproduced

- [x] Missing in-place CTA on the session empty state
- [x] Undersized chat composer send/accessory controls and missing web state semantics
- [x] Weak Connection inline action affordances
- [x] Undersized Agent Loops `Run` / `Delete` actions in Settings source
- [x] LoopEdit profile selection chips crowd narrow screens and hide selected state behind color alone
- [x] AgentEdit connection-type chips crowd narrow screens, hide selected state behind color alone, and wrongly treat ACP like a remote URL mode

### Improved

- [x] Nested-screen back navigation
- [x] Connection first-run validation and inline action affordances
- [x] Chat composer actions, toggles, and voice-state accessibility
- [x] Session empty-state CTA and narrow-layout guardrails
- [x] Agent Loops row action clarity, touch targets, and destructive-action affordance
- [x] LoopEdit profile selection clarity, default-agent fallback copy, and touch targets
- [x] AgentEdit connection-type clarity, touch targets, and ACP/remote field mapping

### Verified

- [x] Source-backed regression coverage for navigation, connection validation, chat composer accessibility, session empty state, agent loop row actions, LoopEdit profile selection, and AgentEdit connection types

### Blocked

- [-] Live Expo Web inspection in this worktree while `node_modules` is absent (`expo: command not found`)

### Still uncertain

- [ ] Runtime visual fit of source-backed fixes made while Expo Web is unavailable in this worktree
- [ ] Narrow-screen usability of `MemoryEdit` and the remaining `AgentEdit` / `LoopEdit` fields outside the newly checked sections

## Recent Iterations

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
