## Iteration 26 - Let narrow tile follow-up composers protect input space first

### Area inspected
- `tiling-ux.md` latest notes, to pick up the open footer/follow-up density thread from Iteration 25
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` for the tile integration point

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the previously noted narrow tile footer/follow-up area instead of reworking the sessions header again.
2. Inspect `TileFollowUpInput` to see how the compact prompt and full inline composer behave under tile-width pressure.
3. Check whether the component reacts to actual tile width or mostly depends on viewport breakpoints and a single horizontal flex row.
4. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate the renderer-local change with focused tests and desktop web typecheck.

### UX problem found
- The compact follow-up prompt used a viewport breakpoint for its trailing status copy, which means a narrow tile inside a still-wide desktop window could keep unnecessary secondary text longer than it should.
- Once a tile was focused or had draft content, the full follow-up composer kept its input and action buttons on one row, so narrow tiles forced the primary text field to compete directly with prompt/image/send/voice/stop controls.
- That makes reply affordances feel cramped precisely in the tiled states where preserving a readable input target matters most.

### Assumptions
- It is acceptable to use the follow-up area's measured width rather than viewport width because this crowding happens at the tile level and is often caused by sidebars, panel widths, or layout mode choices rather than the overall window size.
- It is acceptable to give the composer actions their own compact row before hiding or removing controls, because the main problem here is input-space competition and visual hierarchy rather than excessive functionality.
- Focused layout tests, desktop renderer typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this local pass because no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Add a small measured-width rule directly in `TileFollowUpInput` so the component can adapt to the actual tile space it receives.
- Keep the compact unfocused prompt behavior, but hide its lowest-priority trailing status text once the tile gets tight.
- In the full composer state, protect the text field first by stacking the action buttons onto a second row with a subtle divider when the available width is narrow.
- This is better than shrinking everything into one row because it preserves the primary reply affordance, reduces accidental visual clutter, and keeps the existing controls discoverable.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx` to measure the component width with `ResizeObserver` and a small `TILE_FOLLOW_UP_COMPACT_WIDTH` threshold.
- Moved the compact-prompt width decision off viewport breakpoints so the trailing `Focus to type/view` status only shows when the tile itself has room.
- Updated the full inline composer so narrow tiles can split into `input row` + `actions row`, with the input getting a subtle compact shell and the actions separated by a light top divider.
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.layout.test.ts` to lock in the measured-width compact threshold, stacked-action layout, and compact-prompt behavior.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to add a broader tile-level expectation that this follow-up composer keeps input space ahead of secondary controls under narrow widths.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/tile-follow-up-input.layout.test.ts src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Hiding more controls in narrow tiles would save more space, but it would also reduce discoverability and make reply actions harder to find.
- Leaving the composer as a single row is simpler, but it keeps the least compressible part of the UI—the text field—in direct competition with secondary actions.
- A larger footer redesign could unify message queue, composer, and metadata density in one pass, but that is broader than this local improvement needed to be.

### What still needs attention
- This follow-up composer compaction should be checked in a live Electron tiled session while changing sidebar width, layout mode, and focus/maximize state together.
- The tile footer metadata row may still benefit from measured-width adaptation so status badges and step text do not feel loosely coupled from the follow-up area.
- The floating panel versus tiled-session width competition is still a root pressure source, especially when a resized panel leaves tiles just above or below compact thresholds.
