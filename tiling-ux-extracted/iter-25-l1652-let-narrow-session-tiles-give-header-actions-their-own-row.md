## Iteration 25 - Let narrow session tiles give header actions their own row

### Area inspected
- `tiling-ux.md` latest notes, to avoid repeating the recent sessions-header and floating-panel passes
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` (verification-only maintenance after the test run exposed stale expectations)

### Repro steps reviewed
1. Re-read the latest ledger and choose a still-open area inside the tile itself rather than the sessions-page header.
2. Inspect the `tile` variant in `AgentProgress`, especially the relationship between the title/profile area and the trailing action chrome.
3. Check whether the tile header currently reacts to actual tile width or only relies on generic flex wrapping.
4. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The tile header already allowed wrapping, but it did not deliberately react to the tile's own measured width.
- In narrow tiled states, the title/profile area and the dismiss/collapse/maximize controls still competed for the same horizontal row, which makes the tile feel cramped and the primary session label harder to scan.
- This showed up most clearly in stacked or sidebar-constrained layouts, where the tile width can become tight even when the overall desktop window is still fairly wide.

### Assumptions
- It is acceptable to use the tile's measured width as the trigger for this pass, because the crowding issue happens inside the tile chrome itself rather than at the viewport level.
- It is acceptable to keep the same actions and behaviors, and only change their arrangement, because the main issue here is readability and predictability rather than missing controls.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Add a small compact-width rule for tiled `AgentProgress` cards and let the trailing action group intentionally break onto its own row once the tile gets narrow.
- Add a subtle separator and spacing adjustment for that compact action row so the tile header reads as `identity first, controls second` instead of one crowded strip.
- This is better than relying on accidental flex wrapping alone because it gives the title/profile block a stable first row and makes narrow tiles easier to scan without removing any controls.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to measure tile width in the `tile` variant with a small `TILE_COMPACT_WIDTH` threshold.
- Wired that measured compact state into the tile header so narrow tiles add a little extra vertical spacing and move the action group onto a dedicated full-width row with a subtle top divider.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the compact tile threshold, measured-width hook usage, and compact action-row classes.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` so verification matches the current reorder-hint implementation after the broader desktop test run exposed stale expectations there.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Hiding more tile metadata or removing actions would save more space, but it would also reduce discoverability or information density before trying a simpler layout-only fix.
- Leaving the current flex-wrap behavior alone is simpler, but it makes the narrow-tile result dependent on incidental wrapping instead of an intentional hierarchy.
- A larger adaptive tile-header redesign could improve this area further, but that would be a broader refactor than this focused readability pass needs.

### What still needs attention
- This tile-header compaction should still be validated in a live Electron tiled session, especially while changing layout modes and sidebar width together.
- The next strongest in-tile candidate is whether the footer/follow-up area also needs a tighter compact mode when the tile is both narrow and collapsed.
- The floating panel vs tiled-session width competition still matters because it continues to create the narrow states that expose these tile-density issues.
