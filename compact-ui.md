## Compact UI Coverage Ledger

### Desktop checked screens / flows / states
- [x] Desktop settings helper-tooltip rows across shared settings pages (`apps/desktop/src/renderer/src/components/ui/control.tsx`, including General and other settings groups that use `ControlLabel`) — source-level audit only this iteration because the desktop runtime could not launch.

### Mobile checked screens / flows / states
- [x] Mobile Settings root screen on initial app launch (`App.tsx` initial route `Settings`) — source-level review only this iteration because Expo web runtime was blocked before launch.

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
- [ ] Mobile chat / composer / follow-up flows
- [ ] Mobile settings subsections beyond the root settings screen (connection, appearance, notifications, remote desktop settings groups)
- [ ] Mobile sheets / menus / tooltips / helper UI
- [ ] Mobile empty / loading / error / success / disabled / long-content states
- [ ] Mobile small phone width / larger mobile web width

### Reproduced issues
- [x] Mobile Settings root screen had redundant chrome: navigation header already labels the route as `DotAgents`, while `SettingsScreen` also rendered a large in-content `Settings` title above the connection card.
- [x] Desktop settings helper tooltips opened to the right of the inline info icon inside `ControlLabel`, which points the overlay into the right-hand control column used by switches/selects in dense settings rows and risks covering adjacent controls on hover.

### Improved
- [x] Removed the duplicate in-content `Settings` title from the mobile root settings surface to reduce non-informational vertical space and let the connection card surface sooner.
- [x] Repositioned shared desktop settings helper tooltips to prefer a vertical opening direction (`top`) with a slightly tighter offset so explanatory overlays are less likely to spill over neighboring switches/selects in dense settings rows.

### Verified
- [x] Source-level regression coverage added in `apps/mobile/tests/settings-screen-density.test.js`.
- [x] Targeted verification passed: `node --test apps/mobile/tests/settings-screen-density.test.js apps/mobile/tests/navigation-header.test.js`.
- [x] Desktop regression coverage updated in `apps/desktop/src/renderer/src/components/ui/control.test.tsx` to assert helper tooltips open above the label instead of into the control column.
- [x] Dependency-free static verification passed: `node --input-type=module -e "..."` confirmed the desktop tooltip placement change and regression test text are present.

### Blocked
- [x] Live mobile runtime inspection blocked: `pnpm --filter @dotagents/mobile web` failed with `node_modules missing`, `expo: command not found`, and `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`.
- [x] Live desktop runtime inspection not attempted after the same dependency blocker pattern because local app dependencies appear unavailable.
- [x] Live desktop renderer inspection remained blocked this iteration: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` failed during `@dotagents/shared build` with `tsup: command not found`, `spawn ENOENT`, and `node_modules missing` warnings.
- [x] Targeted desktop Vitest execution remained blocked for the same reason: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` failed before Vitest ran because `pnpm -w run build:shared` could not find `tsup`.

### Still uncertain
- [ ] Desktop renderer / Electron surfaces still need first live attachment and screenshot evidence once dependencies are installed.
- [ ] Desktop hover validation is still pending for `ControlLabel` tooltips under real renderer widths, especially near dense switch/select rows where the overlay previously risked covering neighboring controls.
- [ ] Mobile chat composer, header action row, and agent selector chip still need live narrow-width review for density and possible control crowding.

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
- Before evidence: Source-backed observation only because runtime was blocked — `ControlLabel` in `apps/desktop/src/renderer/src/components/ui/control.tsx` rendered helper tooltips with `side="right"` and `align="start"`, while desktop settings rows place the interactive control in the right column (`sm:max-w-[48%]`), making the tooltip most likely to open into neighboring switches/selects. Attempted desktop launch via the documented debug flow failed before any screenshot capture.
- Change: Updated `ControlLabel` to prefer `side="top"` with `sideOffset={6}` so helper overlays open vertically instead of into the settings control column, and added a regression assertion in `apps/desktop/src/renderer/src/components/ui/control.test.tsx` for the new placement.
- After evidence: Source now positions the shared desktop helper tooltip above the label, reducing the chance that hover help occludes or steals clicks from adjacent controls in dense settings forms.
- Verification commands/run results: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui` → failed during predev (`tsup: command not found`, `node_modules missing`, exit 1). `node --input-type=module -e "..."` → passed (`static desktop tooltip assertions passed`). `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/ui/control.test.tsx` → failed before Vitest startup because `pnpm -w run build:shared` could not find `tsup`.
- Blockers/remaining uncertainty: No before/after screenshots were possible because the desktop renderer could not start without installed dependencies; live hover validation is still needed to confirm the tooltip no longer covers nearby controls at real window sizes.
