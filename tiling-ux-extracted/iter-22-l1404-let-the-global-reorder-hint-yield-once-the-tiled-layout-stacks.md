## Iteration 22 - Let the global reorder hint yield once the tiled layout stacks

### Area inspected
- `tiling-ux.md` latest notes, especially the still-open narrow-header follow-up
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger and choose an area that had not just been changed.
2. Inspect the sessions header logic for compact and very-compact widths.
3. Compare the priority of the global reorder hint against the current-layout chip when compare/grid stacks into one column.
4. Attempt a lightweight Electron renderer inspection before editing; when no inspectable target was available, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The sessions header already had compact-width logic, but the global reorder hint could still remain visible after the layout stacked under narrow width pressure.
- In that stacked state, the current-layout chip is more important because it explains why compare/grid is no longer side by side.
- The per-tile reorder handle is already visible inside the canvas, so the extra header chip becomes the more expendable cue once space gets tight.

### Assumptions
- It is acceptable to let the header-level reorder hint disappear in responsive stacked mode because the tile-level reorder handle remains visible and actionable.
- It is acceptable to prioritize truthful layout-state communication over a secondary helper chip when the header is under width pressure.
- This change is desktop-only; there is no equivalent mobile tiled-sessions header that needs a matching update.

### Decision and rationale
- Keep the reorder hint in regular multi-tile compare/grid states where it helps first-use discoverability.
- Hide that global hint once the layout is responsively stacked, and also require more than one visible tile before showing it at all.
- This is better than trimming the layout chip first, because the layout chip explains the adaptive state while the visible per-tile reorder handle still communicates how to reorder.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showReorderHint` now requires more than one visible tile and disables the header hint during responsive stacked layout.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new reorder-hint gating logic alongside the existing compact-header assertions.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Keeping the reorder hint visible even in stacked mode is lower churn, but it gives a secondary helper equal visual weight at the exact moment the header most needs to explain the adaptive layout.
- Hiding the layout chip suffix first would free space too, but it would weaken the more important explanation of why compare/grid is currently stacked.
- Removing the reorder hint entirely would reduce chrome further, but it would also give up a useful discovery cue in the roomy states where the header can comfortably afford it.

### What still needs attention
- This header-priority tweak should still be validated in a live Electron session, especially while toggling sidebar width around the compare/grid stacking breakpoint.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel resizing can create the same header pressure and one-column fallback.
- If the sessions header still feels cramped after this, the next likely pass is deciding whether the layout chip itself should compress further before the layout-button group does.
