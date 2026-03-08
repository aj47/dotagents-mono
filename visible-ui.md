## Visible UI Investigation Ledger

Purpose: track desktop UI audits driven by live renderer inspection and screenshot-backed observations.

### Conventions
- Review this file before each iteration to avoid repeating recently audited areas.
- Prefer live Electron renderer inspection with remote debugging and screenshots.
- Record blockers explicitly when screenshot capture is not possible.
- Keep each iteration small, local, and shippable.

### Iteration 2026-03-08 / 01
- Status: complete
- Screen / area reviewed: desktop sessions page top chrome with active sessions visible in compare mode
- Renderer target used: Electron renderer main page at `http://localhost:5174/` via CDP (`REMOTE_DEBUGGING_PORT=9333`); intentionally not the `/panel` target
- Before-state screenshot evidence:
  - `tmp/visible-ui-before-2026-03-08-01.png`
  - live screenshot review showed a constrained `~900x670` desktop window where the top chrome stacked into two equally prominent control rows before the session tiles began
  - the second row redundantly showed both a current-layout chip (`Compare view`) and the active segmented layout control (`Compare | Grid | Single`)
- Issues found:
  - duplicated layout state weakened hierarchy and made the sessions content start later than it needed to
  - the toolbar read as "state chip + state buttons" instead of a clearer "context hint + actions" split
- Assumptions:
  - the segmented layout control is the primary affordance for ordinary layout state, so a second passive chip is only justified when it adds unique adaptive context
  - no mobile equivalent needed; `rg` over `apps/mobile/src` found no matching sessions-layout surface
- Design rationale:
  - reduce redundant chrome before removing useful cues
  - keep adaptive context visible when it says something the selected button cannot (`Stacked to fit`, `One visible`)
  - preserve reorder and focused-session context because those still add unique information
- Code changes:
  - updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the current-layout chip only renders when `usesAdaptiveLayoutDescription` is true
  - left the segmented layout buttons as the primary current-state indicator in ordinary compare/grid/single states
  - updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new hierarchy rule
- Verification:
  - live desktop before/after inspection via `agent-browser --cdp 9333` screenshots
  - `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:web`
- After-state observation:
  - `tmp/visible-ui-after-2026-03-08-01.png`
  - the redundant current-layout chip is no longer visible in ordinary compare mode
  - the top chrome now reads more cleanly as primary start actions on row one and view-state controls on row two, which makes the header feel calmer without changing behavior
- Remaining opportunities:
  - the second row still mixes the passive reorder hint with active layout-switching controls; that is the next obvious simplification candidate if another sessions-header pass is needed
  - after this, prefer moving away from the sessions header unless live evidence shows it is still the dominant blocker

### Iteration 2026-03-08 / 02
- Status: complete with live-inspection blocker documented
- Screen / area reviewed: `Settings > Agents` edit form, specifically the `Base System Prompt (Advanced)` warning row inside the General tab
- Renderer target used:
  - attempted desktop renderer main page via `REMOTE_DEBUGGING_PORT=9333` and `ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339"`
  - no renderer target became available because the app failed before launch
- Before-state screenshot evidence:
  - blocked: no screenshot captured this iteration
  - exact blocker: `pnpm dev -- -d` failed in `packages/shared` with `sh: tsup: command not found` and repeated `node_modules missing` warnings, so the desktop app never opened for CDP attachment
  - fallback source-level observation: `apps/desktop/src/renderer/src/pages/settings-agents.tsx` rendered the advanced warning copy and `Reset to Default` action inside a single `flex items-center justify-between` row, which likely compresses the caution text or creates awkward wrapping under narrow settings widths / zoomed text
- Issues found:
  - the caution text for a consequential advanced setting competed horizontally with its secondary reset action instead of taking the readable width it needed
  - the row did not adapt for constrained settings panes, which weakens clarity at the moment users are asked to understand a risky override
- Assumptions:
  - the warning copy is more important than keeping the reset action pinned on the same line
  - preserving the button as a clearly separated secondary action is sufficient; no stronger visual treatment was needed for this small pass
  - there is no parallel mobile edit-form surface that needs the same change; the mobile settings flow uses a different `SettingsScreen` agent editing path
- Design rationale:
  - prefer readable caution copy over rigid single-line alignment in advanced settings
  - let the row wrap predictably so the message can breathe while the reset action remains discoverable and reachable
  - keep the change local to existing desktop styling instead of inventing a new alert component
- Code changes:
  - updated `apps/desktop/src/renderer/src/pages/settings-agents.tsx` so the advanced system-prompt warning row uses `flex-wrap`, top alignment, spacing, and a flexible text block with relaxed leading
  - kept `Reset to Default` visually secondary but prevented it from collapsing or stealing width from the warning text
  - added `apps/desktop/src/renderer/src/pages/settings-agents.layout.test.ts` to lock in the new wrapping behavior
- Verification:
  - attempted live app launch: `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS='--inspect=9339' pnpm dev -- -d` → failed before renderer launch because dependencies are missing in this worktree (`tsup: command not found`)
  - attempted targeted test: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-agents.layout.test.ts` → failed because `vitest` is not installed in the current workspace (`Command "vitest" not found`)
  - `git diff --check`
- After-state observation:
  - source-level after-state only: the warning row now wraps via `flex flex-wrap items-start justify-between gap-2`, the caution text can take remaining width via `min-w-0 flex-1`, and the reset button stays readable as a secondary action without forcing a cramped single-line layout
  - live after-state inspection is still pending until dependencies are installed and the desktop renderer can be launched
- Remaining opportunities:
  - once the app is runnable, capture a real screenshot of the advanced agent editor and confirm the warning row looks calm at typical settings widths and higher zoom
  - other `Settings > Agents` rows with long text plus trailing actions may deserve the same narrow-width audit, but only after live evidence confirms they are visible pain points

