## Compact UI Coverage Ledger

### Desktop checked screens / flows / states
- No desktop surfaces have screenshot-backed live verification yet in this loop; renderer startup remains blocked before first capture.
- [x] Desktop setup / first-run permissions window (`apps/desktop/src/renderer/src/pages/setup.tsx`) — source-level constrained-window review only this iteration because Electron runtime is still blocked before first renderer capture.
- [x] Desktop sessions empty state (`apps/desktop/src/renderer/src/pages/sessions.tsx`) — source-level review only this iteration because Electron runtime is still blocked before first renderer capture.
- [x] Desktop settings: general → `Modular config (.agents)` (`apps/desktop/src/renderer/src/pages/settings-general.tsx`) — source-level review only this iteration because Electron runtime is still blocked before first renderer capture; mobile has no equivalent `.agents` settings surface, so this coverage is desktop-specific.
- [x] Desktop onboarding welcome step (`apps/desktop/src/renderer/src/pages/onboarding.tsx`) — source-level first-run review only this iteration because no Electron renderer target was available for screenshot capture; mobile currently routes first-run users straight into `Settings`, so this welcome-surface coverage is desktop-specific rather than shared.

### Mobile checked screens / flows / states
- [x] Mobile Settings root screen on initial app launch (`App.tsx` initial route `Settings`) — source-level review only this iteration because Expo web runtime was blocked before launch.
- [x] Mobile Chats list / session rows / stub-from-desktop state (`SessionListScreen`) — source-level narrow-width review only this iteration because Expo web runtime is still blocked before launch.
- [x] Mobile chat screen default header + composer state (`ChatScreen`) — source-level review only this iteration because Expo web runtime was blocked before launch, but the header agent selector and default composer chrome were audited for density.
- [x] Mobile Connection settings default disconnected/error + QR scanner close-action states (`ConnectionSettingsScreen`) — source-level review only this iteration because Expo web runtime is still blocked before launch.
- [x] Mobile Desktop Settings → `Provider Selection` + `Profile & Model` subsections (`SettingsScreen`) — source-level review only this iteration because Expo web runtime is still blocked before launch; desktop `settings-providers.tsx` was cross-checked and this decorative-emoji / action-label issue is mobile-specific rather than shared.

### Not yet checked
- [ ] Desktop onboarding API key / dictation / agent steps, plus live runtime validation of the welcome and setup-permissions surfaces
- [ ] Desktop sessions active tiles / dense action rows / hover states
- [ ] Desktop settings: general remaining rows + live runtime validation of the `.agents` group
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
- [ ] Mobile settings subsections beyond the root settings screen — appearance, notifications, and remote desktop settings groups beyond `Provider Selection` / `Profile & Model`; the reviewed remote groups still need live runtime validation once Expo web is available
- [ ] Mobile sheets / menus / tooltips / helper UI
- [ ] Mobile empty / loading / error / success / disabled / long-content states
- [ ] Mobile small phone width / larger mobile web width

### Reproduced issues
- [x] Mobile Settings root screen had redundant chrome: navigation header already labels the route as `DotAgents`, while `SettingsScreen` also rendered a large in-content `Settings` title above the connection card.
- [x] Mobile Chats list stub session rows used both a leading `💻` emoji and the text suffix `· from desktop`, spending narrow-row space on duplicate provenance chrome instead of the session title.
- [x] Mobile chat screen duplicated the current-agent affordance: the navigation header already exposed a clickable current-agent badge, while `ChatScreen` also rendered a second `🤖 Agent` chip row above the composer.
- [x] Mobile Connection settings used decorative emoji in already-labeled UI (`⚠️` error banner copy, `📷 Scan QR Code`, `✕ Close`), adding narrow-width chrome without improving orientation.
- [x] Mobile Desktop Settings `Provider Selection` + `Profile & Model` used decorative emoji in already-labeled row headings/actions (`🎤`, `📝`, `🤖`, `🔊`, `📥 Import`, `📤 Export`, `📋 List`, `✏️ Custom`, `🔄`, `⏳`), spending narrow-width space on ornament and making the compact model-action row more cryptic than desktop's text-first equivalent; desktop `settings-providers.tsx` already uses explicit text labels plus standard icons, so this issue is mobile-specific rather than shared.
- [x] Desktop setup / first-run permissions used a negative top offset (`-mt-20`) and hard-coded `grid-cols-2` permission rows, creating avoidable empty space and fragile action sizing on narrow or short setup windows.
- [x] Desktop sessions empty state used oversized decorative chrome — a large muted icon bubble, full-size selector/prompts chrome, and generous vertical gaps that pushed the primary start controls lower than necessary on a high-frequency surface; the mobile `SessionListScreen` empty state is already text-only, so this issue is desktop-specific rather than shared.
- [x] Desktop settings general `Modular config (.agents)` used both a top-level `endDescription` and an in-card explanatory paragraph, then split related folder/file actions across separate `Open` and `Reveal files in Finder/Explorer` rows, adding avoidable vertical chrome on an already dense settings page; mobile has no equivalent `.agents` surface, so this issue is desktop-specific rather than shared.
- [x] Desktop onboarding welcome used oversized hero chrome for a one-action first-run surface: a `text-6xl` mic icon, `text-3xl`/`font-extrabold` headline, large paragraph spacing, and a fixed-width `w-64` primary CTA left extra empty space before the user could move into onboarding; mobile has no equivalent welcome screen today, so this issue is desktop-specific rather than shared.

### Improved
- [x] Removed the duplicate in-content `Settings` title from the mobile root settings surface to reduce non-informational vertical space and let the connection card surface sooner.
- [x] Removed the redundant `💻` prefix from mobile Chats list stub session rows and added an explicit shrinkable title row so narrow widths keep more room for the actual session title while preserving the textual `· from desktop` provenance label.
- [x] Repositioned shared desktop settings helper tooltips to prefer a vertical opening direction (`top`) with a slightly tighter offset so explanatory overlays are less likely to spill over neighboring switches/selects in dense settings rows.
- [x] Strengthened desktop tooltip regression coverage to assert the shared settings-row composition in `Control` + `ControlLabel` and a dependency-free audit of a concrete `settings-general` row.
- [x] Fixed `apps/desktop/src/renderer/src/components/ui/control.test.tsx` so the tooltip regression test now renders the nested `ControlLabel` component before traversing tooltip props, closing the QA-noted false-positive gap in the component-level assertion.
- [x] Removed the duplicate mobile chat composer agent chip so the primary composer area goes straight from attachments into the action row, relying on the existing header badge as the single agent-selection affordance.
- [x] Removed decorative emoji chrome from the mobile Connection settings error banner and QR scanner actions, while adding an explicit accessibility label for the scanner close control.
- [x] Removed decorative emoji chrome from the mobile Desktop Settings `Provider Selection` + `Profile & Model` subsections, switched the compact model-action row to explicit text labels (`Custom`, `List`, `Refresh`, `Refreshing…`), and added explicit accessibility labels plus disabled-state opacity so the narrow action row stays readable without icon-only glyphs.
- [x] Tightened the desktop setup shell, made the first-run permissions surface scroll-safe for short windows, and changed permission rows to stack by default with full-width action buttons on constrained widths before splitting into label/action columns on wider screens.
- [x] Tightened the desktop sessions empty state by shrinking the decorative icon treatment, switching the agent selector to its existing compact mode, reducing secondary-control spacing, using the smaller predefined-prompts trigger, and pulling recent sessions closer to the primary actions without shrinking the main text/voice buttons.
- [x] Tightened the desktop `.agents` settings block by merging its explanatory copy into one helper paragraph and consolidating folder/file buttons into a single wrap-safe `Open folders & files` row with shorter button labels.
- [x] Tightened the desktop onboarding welcome hero by bounding it to a narrower content width, reducing the mic icon / headline / paragraph spacing, replacing the fixed-width primary CTA with a full-width capped button, and shrinking the skip action so the next step appears sooner without removing orientation.

### Verified
- [x] Source-level regression coverage added in `apps/mobile/tests/settings-screen-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/navigation-header.test.js`.
- [x] Source-level regression coverage added in `apps/mobile/tests/session-list-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/session-list-density.test.js`.
- [x] Source-level regression coverage added in `apps/mobile/tests/chat-screen-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/chat-screen-density.test.js apps/mobile/tests/chat-composer-accessibility.test.js`.
- [x] Source-level regression coverage added in `apps/mobile/tests/connection-settings-density.test.js`.
- [x] Targeted mobile verification passed: `node --test apps/mobile/tests/connection-settings-density.test.js apps/mobile/tests/connection-settings-validation.test.js`.
- [x] Source-level regression coverage added in `apps/mobile/tests/settings-remote-provider-density.test.js`.
- [x] Targeted mobile verification passed: `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/settings-remote-provider-density.test.js`.
- [x] Dependency-free desktop regression coverage added in `apps/desktop/tests/control-tooltip-density.test.mjs`.
- [x] Targeted desktop source verification passed: `node --test apps/desktop/tests/control-tooltip-density.test.mjs`.
- [x] Re-ran `node --test apps/desktop/tests/control-tooltip-density.test.mjs` after the QA remediation; all 3 desktop tooltip density assertions still passed.
- [x] Dependency-free desktop setup regression coverage added in `apps/desktop/tests/setup-permission-density.test.mjs`.
- [x] Targeted desktop source verification passed: `node --test apps/desktop/tests/setup-permission-density.test.mjs`.
- [x] Dependency-free desktop sessions empty-state regression coverage added in `apps/desktop/tests/sessions-empty-state-density.test.mjs`.
- [x] Targeted desktop source verification passed: `node --test apps/desktop/tests/sessions-empty-state-density.test.mjs`.
- [x] Dependency-free desktop `.agents` density regression coverage added in `apps/desktop/tests/settings-general-modular-config-density.test.mjs`.
- [x] Targeted desktop source verification passed: `node --test apps/desktop/tests/settings-general-modular-config-density.test.mjs`.
- [x] Dependency-free desktop onboarding welcome density regression coverage added in `apps/desktop/tests/onboarding-welcome-density.test.mjs`.
- [x] Targeted desktop source verification passed: `node --test apps/desktop/tests/onboarding-welcome-density.test.mjs`.

### Blocked
- [x] Live mobile runtime inspection blocked: `pnpm --filter @dotagents/mobile web` failed with `node_modules missing`, `expo: command not found`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`.
- [x] Live mobile runtime inspection is still blocked in this worktree: `pnpm dev:mobile -- --web` failed with `expo: command not found`, `node_modules missing`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` before any screenshot capture.
- [x] Live mobile runtime inspection is still blocked for remote-settings subsection review in this worktree: `pnpm dev:mobile -- --web` failed with `expo: command not found`, `node_modules missing`, `spawn ENOENT`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` before Expo web launched or any screenshots could be captured.
- [x] Live desktop runtime inspection not attempted after the same dependency blocker pattern because local app dependencies appear unavailable.
- [x] Live desktop renderer inspection remained blocked this iteration: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` failed during `@dotagents/shared build` with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings.
- [x] Targeted desktop Vitest execution remained blocked for the same reason: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` failed before Vitest ran because `pnpm -w run build:shared` could not find `tsup`.
- [x] The same targeted Vitest command is still blocked after this QA remediation pass because `pnpm -w run build:shared` fails before Vitest startup with `tsup: command not found` and `node_modules missing` warnings.
- [x] Live desktop onboarding inspection is still blocked in this worktree: `electron_execute_electron-native` returned `Failed to list CDP targets. Make sure Electron is running with --inspect flag.`, and earlier `pnpm dev` attempts in this worktree still fail before launch because the shared/desktop toolchain dependencies are unavailable.

### Still uncertain
- [ ] Desktop renderer / Electron surfaces still need first live attachment and screenshot evidence once dependencies are installed.
- [ ] Desktop setup / first-run permissions are denser in source, but the real setup window still needs screenshot-backed validation at short heights and narrow widths once Electron can launch.
- [ ] Desktop onboarding welcome is denser in source, but the real first-run window still needs screenshot-backed validation for above-the-fold balance, CTA prominence, and skip-button visibility once Electron can launch.
- [ ] Desktop sessions empty state is denser in source and keeps primary actions higher, but the real renderer still needs screenshot-backed validation for above-the-fold balance, empty-state readability, and recent-sessions proximity once Electron can launch.
- [ ] Desktop settings helper-tooltip hover occlusion remains un-reproduced in a live renderer; the current coverage is shared-component/source-level only until the desktop runtime can launch for screenshot-backed review.
- [ ] Desktop settings surfaces remain unchecked at runtime; the shared settings-row audit is not a substitute for live renderer coverage.
- [ ] Desktop settings general `.agents` cleanup is denser in source, but the real renderer still needs screenshot-backed validation for button-wrap behavior, path/action alignment, and narrow-width scanability once Electron can launch.
- [ ] The repaired `control.test.tsx` assertion now renders `ControlLabel` correctly in source, but the component-level Vitest test still has not been executed in this environment because the desktop/shared toolchain is unavailable.
- [ ] Mobile Chats list row density is improved in source, but the stub-session title/date balance still needs live Expo web or device screenshot review at small-phone and larger mobile-web widths.
- [ ] Mobile chat composer, header action row, and voice-related controls still need live narrow-width review for density and possible control crowding.
- [ ] Mobile chat header badge and composer now avoid duplicate agent-selection chrome in source, but the real small-phone header truncation, keyboard-open layout, and agent-selector sheet entry flow still need live screenshot-backed validation.
- [ ] Mobile Connection settings now use plain-text error/scan/close labels in source, but the real Expo-web or device layout still needs screenshot-backed review for scanner modal overlay placement, close-button hit safety, and disconnected-state density.
- [ ] Mobile Desktop Settings `Provider Selection` + `Profile & Model` are cleaner in source, but Expo web or device screenshots are still needed to validate provider-chip wrapping, profile-action balance, and the compact model-action row at small-phone and larger mobile-web widths.

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

#### Iteration 8
Evidence
- Scope: Mobile Connection settings screen density for disconnected/error and QR scanner close-action states.
- Before evidence: Source-backed observation only because runtime was blocked — `pnpm dev:mobile -- --web` failed with `expo: command not found`, `node_modules missing`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL` before any screenshot capture. In `apps/mobile/src/screens/ConnectionSettingsScreen.tsx`, the already-styled error banner rendered `⚠️ {connectionError}`, the primary scan action rendered `📷 Scan QR Code`, and the scanner overlay close button rendered `✕ Close`, all adding decorative glyph chrome on a narrow first-run/settings surface.
- Change: Removed the decorative emoji prefixes from the mobile Connection settings error banner and QR scanner actions, added an explicit `accessibilityLabel="Close QR scanner"` to the scanner close control, and added `apps/mobile/tests/connection-settings-density.test.js` to keep the screen emoji-free while preserving clear labels.
- After evidence: Source now uses plain-text `Scan QR Code`, plain-text error copy, and a plain `Close` scanner action with an explicit accessibility label, reducing decorative chrome while keeping the first-run connection flow understandable.
- Verification commands/run results: `node --test apps/mobile/tests/connection-settings-density.test.js apps/mobile/tests/connection-settings-validation.test.js` → passed (6 tests, 0 failures, exit 0). Runtime validation remains blocked because `pnpm dev:mobile -- --web` fails before Expo launch with `expo: command not found`, `node_modules missing`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`.
- Blockers/remaining uncertainty: No before/after screenshots were possible because Expo web still cannot launch in this worktree without installed dependencies, so live validation of scanner modal layering, close-button overlap safety, and real small-phone spacing remains pending once runtime access is restored.

#### Iteration 9
Evidence
- Scope: Desktop setup / first-run permissions window density and constrained-size safety.
- Before evidence: Source-backed observation only because runtime was blocked — `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` failed during `@dotagents/shared build` with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings before any renderer target or screenshot capture. In `apps/desktop/src/renderer/src/pages/setup.tsx`, the setup shell used a negative top offset (`-mt-20`), fixed `p-10` chrome, and `PermissionBlock` used `grid-cols-2 gap-5 p-3`, which left unnecessary empty space and a brittle split layout for narrow/short setup windows.
- Change: Reworked the setup shell to use a tighter responsive container with `overflow-y-auto`, reduced the intro chrome, constrained the permission card width, and updated `PermissionBlock` to stack by default with full-width action buttons on constrained widths before switching to `md:grid-cols-[minmax(0,1fr)_auto]`; also added `apps/desktop/tests/setup-permission-density.test.mjs` to keep those density and sizing contracts in place.
- After evidence: Source now keeps the first-run permissions page scroll-safe in short windows and makes each permission row denser and more resilient on constrained widths, while preserving the same actions and granted-state messaging.
- Verification commands/run results: `node --test apps/desktop/tests/setup-permission-density.test.mjs` → passed (2 tests, 0 failures, exit 0). Runtime validation remains blocked because `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` still fails before Electron launch with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings.
- Blockers/remaining uncertainty: No before/after screenshots were possible because Electron still cannot launch in this worktree without installed dependencies, so real setup-window validation at narrow widths and short heights remains pending once desktop dependencies are available.

#### Iteration 10
Evidence
- Scope: Desktop sessions empty state density, with cross-check against the mobile sessions empty state for shared-vs-platform-specific behavior.
- Before evidence: Source-backed observation only because runtime was blocked — `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` failed during `@dotagents/shared build` with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings before any renderer target or screenshot capture. In `apps/desktop/src/renderer/src/pages/sessions.tsx`, the empty state used `rounded-full bg-muted p-4` around an `h-8 w-8` icon, a non-compact `AgentSelector`, default-size prompt chrome, and `py-8` / `gap-4` / `mt-8` spacing, pushing the main start controls lower than necessary. Cross-check: `apps/mobile/src/screens/SessionListScreen.tsx` already uses a text-only empty state (`No Sessions Yet` + subtitle), so the density issue is desktop-specific rather than shared.
- Change: Tightened the desktop empty state chrome in `apps/desktop/src/renderer/src/pages/sessions.tsx` by shrinking the decorative icon treatment, reducing the supporting copy width/size and container spacing, switching the agent selector to `compact`, using `buttonSize="sm"` for `PredefinedPromptsMenu`, and reducing the recent-sessions top margin; added `apps/desktop/tests/sessions-empty-state-density.test.mjs` to keep those density choices in place.
- After evidence: Source now keeps the desktop sessions empty state more compact around the primary actions while preserving the main text/voice buttons and recent sessions affordance; mobile remains unchanged because its equivalent empty state was already minimal.
- Verification commands/run results: `pnpm dev:mobile -- --web` → failed before launch (`expo: command not found`, `node_modules missing`, `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, exit 1). `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` → failed before Electron launch (`tsup: command not found`, `spawn ENOENT`, `node_modules missing`, exit 1). `node --test apps/desktop/tests/sessions-empty-state-density.test.mjs` → passed (2 tests, 0 failures, exit 0).
- Blockers/remaining uncertainty: No before/after screenshots were possible because desktop/mobile runtimes still cannot launch in this worktree without installed dependencies, so real renderer validation of visual balance, actual above-the-fold action placement, and recent-sessions spacing remains pending once runtime access is restored.

#### Iteration 11
Evidence
- Scope: Desktop settings general `.agents` block density, with a cross-check for whether mobile has an equivalent modular-config surface.
- Before evidence: Source-backed observation only because runtime was blocked — `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` failed during `@dotagents/shared build` with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings before any renderer target or screenshot capture, and `pnpm dev:mobile -- --web` failed with `expo: command not found`, `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, and `node_modules missing` warnings before Expo web could launch. In `apps/desktop/src/renderer/src/pages/settings-general.tsx`, the `Modular config (.agents)` group used both a top-level `endDescription` and an in-card helper paragraph, then split closely related folder/file actions across `Open` and `Reveal files in Finder/Explorer` rows. Cross-check: codebase retrieval found no equivalent mobile `.agents` / workspace-folder settings surface, so this issue is desktop-specific rather than shared.
- Change: Removed the extra `endDescription`, merged the `.agents` explanation into a single helper paragraph, consolidated the folder/file buttons into one wrap-safe `Open folders & files` row with shorter labels, and added `apps/desktop/tests/settings-general-modular-config-density.test.mjs` to keep that density contract in place.
- After evidence: Source now presents the desktop `.agents` settings block with one explanatory paragraph followed by path rows and a single compact actions row (`Global Folder`, `Workspace Folder`, `System Prompt`, `Guidelines`), reducing redundant chrome without changing the underlying actions.
- Verification commands/run results: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` → failed before Electron launch (`tsup: command not found`, `spawn ENOENT`, `node_modules missing`, exit 1). `pnpm dev:mobile -- --web` → failed before Expo launch (`expo: command not found`, `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, `node_modules missing`, exit 1). `node --test apps/desktop/tests/settings-general-modular-config-density.test.mjs` → initially failed because the first assertion searched the whole file for `endDescription={` instead of scoping to the `.agents` block; after tightening the test to the extracted `Modular config (.agents)` block, the command passed (2 tests, 0 failures, exit 0).
- Blockers/remaining uncertainty: No before/after screenshots were possible because desktop/mobile runtimes still cannot launch in this worktree without installed dependencies, so live renderer validation of button wrapping, path readability, and real narrow-width behavior remains pending once runtime access is restored.

#### Iteration 12
Evidence
- Scope: Desktop onboarding welcome-step density on the first-run surface, with a cross-check for whether mobile has an equivalent welcome screen.
- Before evidence: Live inspection remained blocked — `electron_execute_electron-native` returned `Failed to list CDP targets. Make sure Electron is running with --inspect flag.`, and earlier `pnpm dev` attempts in this worktree already failed before Electron launch because `tsup` / other desktop dependencies were unavailable. Source-backed observation: `apps/desktop/src/renderer/src/pages/onboarding.tsx` rendered the welcome step with a `text-6xl` mic icon, `text-3xl font-extrabold` heading, `mb-8` paragraph spacing, and a fixed-width `w-64` primary CTA, which spent a lot of vertical and horizontal chrome on a one-action intro screen. Cross-check: mobile currently starts on `Settings` (`apps/mobile/App.tsx` initial route) and has no equivalent dedicated welcome screen, so this issue is desktop-specific rather than shared.
- Change: Tightened the desktop onboarding welcome hero in `apps/desktop/src/renderer/src/pages/onboarding.tsx` by bounding the content width, reducing icon/headline/paragraph spacing, replacing the fixed-width CTA with a full-width capped button, shrinking the secondary skip action, and adding `apps/desktop/tests/onboarding-welcome-density.test.mjs` to preserve those compactness choices.
- After evidence: Source now renders the welcome step as a narrower, denser hero (`mx-auto max-w-xl`, `text-5xl sm:text-6xl`, `text-2xl font-bold`, `mb-6` copy, `w-full max-w-56` CTA, `size="sm"` skip button), which should keep the first actionable step higher in constrained onboarding windows without removing orientation.
- Verification commands/run results: `electron_execute_electron-native` → failed (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`). `node --test apps/desktop/tests/onboarding-welcome-density.test.mjs` → passed (2 tests, 0 failures, exit 0).
- Blockers/remaining uncertainty: No before/after screenshots were possible because no live Electron renderer target was available in this worktree and desktop launch remains dependency-blocked; visual validation of the real onboarding window's balance, CTA prominence, and any downstream step spacing remains pending once runtime access is restored.

#### Iteration 13
Evidence
- Scope: Mobile Desktop Settings `Provider Selection` + `Profile & Model` subsection density, with a cross-check against desktop `settings-providers.tsx` for shared-vs-platform-specific behavior.
- Before evidence: Source-backed observation only because runtime was blocked — `pnpm dev:mobile -- --web` failed before Expo launch with `expo: command not found`, `node_modules missing`, `spawn ENOENT`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, so no screenshot capture was possible. In `apps/mobile/src/screens/SettingsScreen.tsx`, the reviewed remote-settings subsections used decorative emoji in already-labeled headings/actions (`🎤`, `📝`, `🤖`, `🔊`, `📥 Import`, `📤 Export`, `📋 List`, `✏️ Custom`, `🔄`, `⏳`), which spent narrow-width space on ornament and made the compact model-action row cryptic. Cross-check: desktop `apps/desktop/src/renderer/src/pages/settings-providers.tsx` already uses explicit text labels plus standard icons, so this issue is mobile-specific rather than shared.
- Change: Removed the decorative emoji from the mobile provider labels and profile/model action text, converted the model action row to explicit text labels (`Custom`, `List`, `Refresh`, `Refreshing…`), added explicit accessibility labels for the compact model actions, added disabled-state opacity for the refresh action, and added `apps/mobile/tests/settings-remote-provider-density.test.js` to keep the subsection text-first.
- After evidence: Source now renders the reviewed mobile remote-settings subsections with plain-text labels and compact text-first actions, which should reduce visual noise and make the model-mode controls easier to scan and understand on narrow widths without adding extra chrome.
- Verification commands/run results: `pnpm dev:mobile -- --web` → failed before Expo launch (`expo: command not found`, `node_modules missing`, `spawn ENOENT`, `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`, exit 1). `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/settings-remote-provider-density.test.js` → passed (4 tests, 0 failures, exit 0).
- Blockers/remaining uncertainty: No before/after screenshots were possible because Expo web still cannot launch in this worktree without installed dependencies; live validation of provider-chip wrapping, action-row balance, and real tap targets remains pending once runtime access is restored.
