## Compact UI Coverage Ledger

### Desktop checked screens / flows / states
- No desktop surfaces have screenshot-backed live verification yet in this loop; renderer startup remains blocked before first capture.

### Mobile checked screens / flows / states
- [x] Mobile Settings root screen on initial app launch (`App.tsx` initial route `Settings`) — source-level review only this iteration because Expo web runtime was blocked before launch.
- [x] Mobile Chats list / session rows / stub-from-desktop state (`SessionListScreen`) — source-level narrow-width review only this iteration because Expo web runtime is still blocked before launch.
- [x] Mobile chat screen default header + composer state (`ChatScreen`) — source-level review only this iteration because Expo web runtime was blocked before launch, but the header agent selector and default composer chrome were audited for density.

### Not yet checked
- [ ] Desktop onboarding / setup / welcome / first run
- [ ] Desktop sessions empty state
- [ ] Desktop sessions active tiles / dense action rows / hover states
- [ ] Desktop settings: general
- [ ] Desktop settings: providers + models
- [ ] Desktop settings: capabilities
- [ ] Desktop settings: agents
- [ ] Desktop settings: repeat tasks
- [ ] Desktop settings: memories
- [ ] Desktop panel window
- [ ] Desktop modals / dialogs / tooltips / popovers / menus
- [ ] Desktop narrow window / awkward aspect ratios / zoom
- [ ] Desktop loading / error / disabled / long-content states
- [ ] Mobile onboarding / setup / welcome / first run
- [ ] Mobile chat follow-up flows, voice overlay states, queued-message panel, retry banner, and long-message states at small-phone and larger mobile web widths
- [ ] Mobile settings subsections beyond the root settings screen (connection, appearance, notifications, remote desktop settings groups)
- [ ] Mobile sheets / menus / tooltips / helper UI
- [ ] Mobile empty / loading / error / success / disabled / long-content states
- [ ] Mobile small phone width / larger mobile web width

### Reproduced issues
- [x] Mobile Settings root screen had redundant chrome: navigation header already labels the route as `DotAgents`, while `SettingsScreen` also rendered a large in-content `Settings` title above the connection card.
- [x] Mobile Chats list stub session rows used both a leading `💻` emoji and the text suffix `· from desktop`, spending narrow-row space on duplicate provenance chrome instead of the session title.
- [x] Mobile chat screen duplicated the current-agent affordance: the navigation header already exposed a clickable current-agent badge, while `ChatScreen` also rendered a second `🤖 Agent` chip row above the composer.

### Improved
- [x] Removed the duplicate in-content `Settings` title from the mobile root settings surface to reduce non-informational vertical space and let the connection card surface sooner.
- [x] Removed the redundant `💻` prefix from mobile Chats list stub session rows and added an explicit shrinkable title row so narrow widths keep more room for the actual session title while preserving the textual `· from desktop` provenance label.
- [x] Repositioned shared desktop settings helper tooltips to prefer a vertical opening direction (`top`) with a slightly tighter offset so explanatory overlays are less likely to spill over neighboring switches/selects in dense settings rows.
- [x] Strengthened desktop tooltip regression coverage to assert the shared settings-row composition in `Control` + `ControlLabel` and a dependency-free audit of a concrete `settings-general` row.
- [x] Fixed `apps/desktop/src/renderer/src/components/ui/control.test.tsx` so the tooltip regression test now renders the nested `ControlLabel` component before traversing tooltip props, closing the QA-noted false-positive gap in the component-level assertion.
- [x] Removed the duplicate mobile chat composer agent chip so the primary composer area goes straight from attachments into the action row, relying on the existing header badge as the single agent-selection affordance.

### Verified
- [x] Source-level regression coverage added in `apps/mobile/tests/settings-screen-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/navigation-header.test.js`.
- [x] Source-level regression coverage added in `apps/mobile/tests/session-list-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/session-list-density.test.js`.
- [x] Source-level regression coverage added in `apps/mobile/tests/chat-screen-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js`.
- [x] Dependency-free desktop regression coverage added in `apps/desktop/tests/control-tooltip-density.test.mjs`.
- [x] Targeted desktop source verification passed: `node --test apps/desktop/tests/control-tooltip-density.test.mjs`.
- [x] Re-ran `node --test apps/desktop/tests/control-tooltip-density.test.mjs` after the QA remediation; all 3 desktop tooltip density assertions still passed.

### Blocked
- [x] Live mobile runtime inspection blocked: `pnpm --filter @dotagents/mobile web` failed with `node_modules missing`, `expo: command not found`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`.
- [x] Live mobile runtime inspection is still blocked in this worktree: `pnpm dev:mobile -- --web` failed with `expo: command not found`, `node_modules missing`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` before any screenshot capture.
- [x] Live desktop runtime inspection not attempted after the same dependency blocker pattern because local app dependencies appear unavailable.
- [x] Live desktop renderer inspection remained blocked this iteration: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` failed during `@dotagents/shared build` with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings.
- [x] Targeted desktop Vitest execution remained blocked for the same reason: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` failed before Vitest ran because `pnpm -w run build:shared` could not find `tsup`.
- [x] The same targeted Vitest command is still blocked after this QA remediation pass because `pnpm -w run build:shared` fails before Vitest startup with `tsup: command not found` and `node_modules missing` warnings.

### Still uncertain
- [ ] Desktop renderer / Electron surfaces still need first live attachment and screenshot evidence once dependencies are installed.
- [ ] Desktop settings helper-tooltip hover occlusion remains un-reproduced in a live renderer; the current coverage is shared-component/source-level only until the desktop runtime can launch for screenshot-backed review.
- [ ] Desktop settings surfaces remain unchecked at runtime; the shared settings-row audit is not a substitute for live renderer coverage.
- [ ] The repaired `control.test.tsx` assertion now renders `ControlLabel` correctly in source, but the component-level Vitest test still has not been executed in this environment because the desktop/shared toolchain is unavailable.
- [ ] Mobile Chats list row density is improved in source, but the stub-session title/date balance still needs live Expo web or device screenshot review at small-phone and larger mobile-web widths.
- [ ] Mobile chat composer, header action row, and voice-related controls still need live narrow-width review for density and possible control crowding.
- [ ] Mobile chat header badge and composer now avoid duplicate agent-selection chrome in source, but the real small-phone header truncation, keyboard-open layout, and agent-selector sheet entry flow still need live screenshot-backed validation.

### Iterations

#### Iteration 1
Evidence
- Scope: Initialize compact UI ledger and prepare runtime-first inspection workflow for desktop/mobile.
- Before evidence: `compact-ui.md` was missing; reviewed `apps/desktop/DEBUGGING.md` for renderer/main-process inspection workflow.
- Change: Created this checklist-driven coverage ledger with explicit cross-platform sections and an evidence contract.
- After evidence: `compact-ui.md` now exists and can be updated as a running coverage map.
- Verification commands/run results: `view compact-ui.md` previously returned file not found; `view apps/desktop/DEBUGGING.md` confirmed recommended desktop debug ports and mobile Expo web workflow.
- Blockers/remaining uncertainty: No live runtime attached yet; next step is to inspect a live desktop or mobile surface and capture before-state visual evidence.

#### Iteration 2
Evidence
- Scope: Mobile root Settings screen decluttering on the initial launch surface.
- Before evidence: Source-backed observation only because runtime was blocked — `SettingsScreen` rendered `<Text style={styles.h1}>Settings</Text>` above the connection card while `App.tsx` already configured the root stack screen title as `DotAgents`; attempted Expo web launch failed before any screenshot capture.
- Change: Removed the duplicate in-content `Settings` heading from `apps/mobile/src/screens/SettingsScreen.tsx` and added `apps/mobile/tests/settings-screen-density.test.js` to preserve header orientation while preventing the redundant title from coming back.
- After evidence: Source now starts the Settings scroll content directly with the connection card, reducing top-of-screen chrome on the mobile root settings surface.
- Verification commands/run results: `pnpm --filter @dotagents/mobile web` → failed (`expo: command not found`, `node_modules missing`, exit 1). `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/navigation-header.test.js` → passed (3 tests, 0 failures).
- Blockers/remaining uncertainty: No before/after screenshots were possible because Expo web could not launch without installed dependencies; visual validation of real spacing and any neighboring layout effects remains pending once runtime access is restored.

#### Iteration 3
Evidence
- Scope: Desktop shared settings helper-tooltip overlay safety for dense settings rows.
- Before evidence: Source-backed risk review only because runtime was blocked — `ControlLabel` in `apps/desktop/src/renderer/src/components/ui/control.tsx` rendered helper tooltips with `side="right"` and `align="start"`, while desktop settings rows place the interactive control in the right column (`sm:max-w-[48%]`), making the tooltip most likely to open into neighboring switches/selects. No live reproduction or screenshot-backed review was achieved in this iteration.
- Change: Updated `ControlLabel` to prefer `side="top"` with `sideOffset={6}` so helper overlays open vertically instead of into the settings control column, and added an initial regression assertion in `apps/desktop/src/renderer/src/components/ui/control.test.tsx` for the new placement.
- After evidence: Source now positions the shared desktop helper tooltip above the label, reducing the chance that hover help occludes or steals clicks from adjacent controls in dense settings forms, but the issue remained source-identified rather than live-reproduced.
- Verification commands/run results: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` → failed during predev (`tsup: command not found`, `node_modules missing`, exit 1). `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` → failed before Vitest startup because `pnpm -w run build:shared` could not find `tsup` (exit 1). The prior draft's redacted `node --input-type=module -e` fallback is not auditable and should not be treated as verified evidence.
- Blockers/remaining uncertainty: No before/after screenshots were possible because the desktop renderer could not start without installed dependencies; live hover validation is still needed to confirm the tooltip no longer covers nearby controls at real window sizes.

#### Iteration 4
Evidence
- Scope: QA remediation for desktop tooltip verification accuracy and regression coverage strength.
- Before evidence: `compact-ui.md` overstated the desktop tooltip work as reproduced/checked/verified despite only source-level evidence, `apps/desktop/src/renderer/src/components/ui/control.test.tsx` asserted only `TooltipContent` props in isolation, and `electron_execute_electron-native` returned `Failed to list CDP targets. Make sure Electron is running with --inspect flag.`.
- Change: Updated `apps/desktop/src/renderer/src/components/ui/control.test.tsx` to compose a full shared settings row with an adjacent right-hand control, added `apps/desktop/tests/control-tooltip-density.test.mjs` to tie the shared tooltip placement to the concrete `Main Agent Mode` row in `settings-general.tsx`, and corrected the ledger so desktop runtime coverage is recorded as blocked/uncertain instead of reproduced/checked.
- After evidence: The desktop tooltip regression coverage now checks both the shared row split (`sm:max-w-[52%]` + `sm:max-w-[48%]`) and the top-opening tooltip contract, while the ledger explicitly treats live renderer validation as pending rather than complete.
- Verification commands/run results: `node --test apps/desktop/tests/control-tooltip-density.test.mjs` → passed (3 tests, 0 failures, exit 0). `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` → failed before Vitest startup because `pnpm -w run build:shared` could not find `tsup` (exit 1). `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` → failed during predev with `tsup: command not found` before a renderer target was available (exit 1).
- Blockers/remaining uncertainty: No before/after screenshots were possible because the desktop renderer still cannot launch without the missing desktop/shared toolchain dependencies, so live hover/click interference remains unverified until that blocker is removed.

#### Iteration 5
Evidence
- Scope: QA round 2 remediation for the broken desktop component-level tooltip regression test.
- Before evidence: QA found that `apps/desktop/src/renderer/src/components/ui/control.test.tsx` read `controlLabel.props.children` from the unresolved `<ControlLabel ... />` element nested inside `Control`, so the test would fail before proving the tooltip contract once Vitest became runnable.
- Change: Added a local `renderFunctionComponent(...)` helper in `apps/desktop/src/renderer/src/components/ui/control.test.tsx` and used it to render the nested `ControlLabel` element before traversing the `TooltipProvider` / `TooltipContent` subtree.
- After evidence: The tooltip regression test now inspects the rendered `ControlLabel` output rather than the unresolved JSX element, so the assertion path reaches the shared tooltip props it claims to verify.
- Verification commands/run results: `node --test apps/desktop/tests/control-tooltip-density.test.mjs` → passed (3 tests, 0 failures, exit 0). `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` → still blocked before Vitest startup because `pnpm -w run build:shared` failed with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings (exit 1).
- Blockers/remaining uncertainty: The component-level test logic is repaired, but this environment still cannot execute the Vitest file end-to-end until desktop/shared dependencies are installed, and live renderer screenshot validation remains blocked for the same reason.

#### Iteration 6
Evidence
- Scope: Mobile Chats list stub-session row density on narrow widths.
- Before evidence: Source-backed observation only because runtime was blocked — `pnpm --filter @dotagents/mobile web` failed with `expo: command not found`, `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, and `node_modules missing` warnings before any screenshot capture. In `apps/mobile/src/screens/SessionListScreen.tsx`, stub rows rendered both a leading `💻` emoji before the title and the textual suffix `· from desktop` in the metadata line, duplicating provenance chrome in an already tight row.
- Change: Removed the leading desktop emoji from `SessionListScreen`, introduced a dedicated `sessionTitleRow` with `minWidth: 0`, and added `apps/mobile/tests/session-list-density.test.js` to keep the row shrinkable while preserving the textual stub-session indicator.
- After evidence: Source now gives the session title the full leading row width and still labels stub sessions via `· from desktop`, which should improve scanability and title truncation on narrow mobile widths without losing provenance context.
- Verification commands/run results: `pnpm --filter @dotagents/mobile web` → failed (`expo: command not found`, `node_modules missing`, exit 1). `node --test apps/mobile/tests/session-list-density.test.js` → passed (2 tests, 0 failures, exit 0).
- Blockers/remaining uncertainty: No before/after screenshots were possible because Expo web still cannot launch without installed dependencies, so the real title/date/truncation balance still needs live runtime review once mobile dependencies are available.

#### Iteration 7
Evidence
- Scope: Mobile chat default header + composer density, specifically duplicate agent-selection chrome above the composer.
- Before evidence: Source-backed observation only because runtime was blocked — `pnpm dev:mobile -- --web` failed with `expo: command not found`, `node_modules missing`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` before any screenshot capture. In `apps/mobile/src/screens/ChatScreen.tsx`, the navigation header already rendered a clickable current-agent badge (`Current agent: ${currentAgentLabel}. Tap to change.` / `{currentAgentLabel} ▼`), while the composer also rendered a second `🤖 Agent` chip row above the input controls.
- Change: Removed the duplicate composer-level agent chip row from `ChatScreen` and added `apps/mobile/tests/chat-screen-density.test.js` to keep agent selection anchored in the navigation header without reintroducing the extra composer chrome.
- After evidence: Source now moves directly from pending image thumbnails into the main composer action row, reducing vertical clutter on the mobile chat surface while preserving the existing header badge as the agent-selector entry point.
- Verification commands/run results: `pnpm dev:mobile -- --web` → failed (`expo: command not found`, `node_modules missing`, exit 1). `node --test apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js` → passed (6 tests, 0 failures, exit 0).
- Blockers/remaining uncertainty: No before/after screenshots were possible because Expo web still cannot launch in this worktree without installed dependencies, so real-device or Expo-web validation of header truncation, keyboard-open spacing, and agent-selector discoverability remains pending once runtime access is restored.
