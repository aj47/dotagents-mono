## Iteration 24 - Explain when floating-panel resizing hits a minimum size floor

### Area inspected
- `tiling-ux.md` latest notes, to avoid repeating the recent header-density and single-view passes
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/panel.tsx` (min-size usage/context only; no code changes this pass)

### Repro steps reviewed
1. Re-read the latest ledger notes and pick the still-open floating-panel vs tiled-session width-pressure follow-up.
2. Inspect how `PanelResizeWrapper` currently communicates active resizing, especially once the drag hits `minWidth` or `minHeight`.
3. Compare that feedback with the tiled-workflow use case where users are often shrinking the panel specifically to release space back to the sessions page.
4. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The floating panel already showed clearer rails and a live `Resize width` / `Resize height` hint, but it still gave no explanation when a resize gesture stopped because the panel had reached its minimum size.
- In tiled workflows, that missing feedback is especially awkward because users often drag the panel smaller to recover horizontal room for session tiles.
- When the panel silently refuses to shrink further, the interaction feels harder to predict and easier to misread as a missed drag or sticky resize behavior.

### Assumptions
- It is acceptable to keep the existing min-size rules unchanged in this pass, because the immediate issue is clarity at the constraint boundary rather than the constraint values themselves.
- It is acceptable to show the constraint cue only while the user is actively resizing and only for the constrained axis, because that keeps the resting panel chrome quiet while still explaining the surprising moment.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Keep the existing resize mechanics and minimum dimensions, but surface a compact inline badge when the active resize gesture is being clamped by `minWidth`, `minHeight`, or both.
- Make the cue axis-aware (`Minimum width reached`, `Minimum height reached`, or `Minimum size reached`) so users understand exactly why the drag stopped.
- This is better than always showing min-size copy because it explains the constraint only at the moment it matters, without adding permanent noise to the floating panel.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to detect when the active resize handle is hitting the panel's minimum width and/or height.
- Added a small amber constraint badge to the existing live resize hint so panel resizing now explains when it is being clamped.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new constraint-label helper, min-bound detection, and visible minimum-size badge.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Lowering the panel minimum sizes might reduce width competition more directly, but it would also change actual layout constraints without first improving clarity around the existing behavior.
- Showing a persistent `Min width` / `Min height` label would make the rule more explicit, but it would add always-on chrome to a panel that already competes for limited space.
- Adding snapping or automatic sessions-page feedback when the panel causes stacking could help more dramatically, but that is a larger workflow change than this local predictability fix.

### What still needs attention
- This minimum-size cue should still be validated in a live Electron session, especially while dragging the floating panel against real sessions-page width changes and sidebar resizing.
- The floating panel vs tiled-session width competition remains open for a deeper behavior pass now that the resize boundary is clearer; likely next options are min-size tuning, smarter panel defaults, or sessions-page feedback when panel width triggers stacking.
- If floating-panel resizing still feels ambiguous in practice, a future pass could decide whether the panel should expose stronger corner/top-edge affordances or a more explicit min-size hint before dragging begins.
