## Tiling UX investigation ledger

### Iteration 1 — drag/reorder clarity
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make drag/reorder more discoverable without changing the existing reordering model

### Areas inspected
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/panel-drag-bar.tsx`
- `apps/desktop/src/renderer/src/components/session-tile.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`

### Repro steps used
1. Open the sessions page with multiple active tiles.
2. Try to infer whether tiles can be reordered before hovering a specific tile corner.
3. Move the pointer around a tile header and edges, then compare the visibility of drag vs resize affordances.
4. Consider narrow windows where several toolbar controls and tile chrome already compete for attention.

### UX problems found
- The reorder handle in `SessionTileWrapper` was fully hidden until hover.
- The previous affordance was only a small icon, so it was easy to miss or confuse with other tile chrome.
- Reordering was supported by the whole draggable tile, but the UI did not communicate that capability early enough.

### Assumptions
- It is acceptable to improve discoverability without changing the underlying drag-and-drop behavior, because the current implementation already works and this iteration is meant to stay local.
- A persistent but low-emphasis handle is preferable to a hover-only handle because tiled views already have many competing interactive regions.
- Code inspection plus targeted renderer tests are sufficient for this pass because no main-process behavior or data model changed.

### Decision and rationale
- Keep the existing drag model, but make the affordance visible at rest.
- Use a subtle chip-style handle instead of a naked icon so the action reads as intentional rather than incidental decoration.
- Reveal a short `Drag` label only on roomy layouts to improve discoverability without crowding dense/narrow tiles.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so tiles opt into a hover group and show a persistent drag chip.
- Increased the visual clarity of the handle with border, background, slight shadow, and stronger hover/drag opacity states.
- Added `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new drag affordance treatment.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro: attempted earlier in this workflow, but no inspectable Electron target was available.

### Tradeoffs considered
- Making the full tile look draggable would be more obvious, but it would conflict with the tile’s click-to-focus and collapse interactions.
- Moving the handle into the tile header actions cluster would save space, but would make reorder compete directly with stop/dismiss/maximize actions.
- A larger always-visible label on all breakpoints would improve discoverability further, but would add unnecessary chrome in already dense layouts.

### What still needs attention
- Resize handles are still more subtle than the drag chip, especially on the right and bottom edges.
- Focus/maximized terminology in the sessions layout controls could use another pass for consistency.
- Narrow-window tile sizing and overflow behavior deserve a dedicated iteration.
- Floating panel resize UX still needs a separate tiled-workflow review.

### Iteration 2 — preserve tile height during responsive reflow
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: reduce accidental tile height resets when sidebar width or window width changes trigger a layout reflow

### Areas inspected
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`

### Repro steps used
1. Inspect how `SessionTileWrapper` reacts after a user manually resizes a tile.
2. Follow the responsive reflow effect that runs when `containerWidth` changes.
3. Compare that behavior with sidebar collapse/expand and other width-only layout changes.
4. Check whether the resize update persists through the shared `session-tile` localStorage key.

### UX problems found
- Width-only reflow was recalculating both width and height, even when the user only changed available columns.
- Because `setSize` persists the shared `session-tile` size, a sidebar width change could permanently overwrite a user-adjusted tile height.
- The result was hard-to-predict layout behavior: tiles could suddenly become shorter or taller after sidebar toggles even though the user never asked to reset height.

### Assumptions
- Preserving user-set tile height across width-only reflow is preferable to aggressively refitting both axes, because the brief prioritizes reducing accidental resizing and layout resets.
- Explicit layout changes (`1x2`, `2x2`, `1x1`) should still reset both width and height because those are intentional mode switches.
- Code inspection plus targeted renderer tests are sufficient for this pass because the fix is local to renderer sizing logic and does not touch main-process APIs.

### Decision and rationale
- Keep responsive reflow for width changes so tiled columns still adapt to the available space.
- Limit that width-triggered reflow to the width axis only, preserving the current tile height unless the user explicitly changes layout mode or resets sizing.
- This is better than disabling responsive reflow entirely because it keeps the grid adaptive without causing surprising height loss.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so the width-change reflow only recalculates `width`.
- Clarified the nearby code comment to document that layout changes still recalculate both axes while responsive width changes preserve height.
- Added `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the non-resetting behavior.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.responsive-reflow.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro attempt via renderer inspection was not available because no inspectable Electron target was running.

### Tradeoffs considered
- Recalculating both axes keeps tiles more tightly fit to the viewport, but it violates user expectation once a manual height has been chosen.
- Disabling responsive reflow altogether would preserve custom sizing, but it would leave tile widths stale after sidebar and window width changes.
- Adding per-tile persisted sizes could solve this more comprehensively, but it would be a much broader product and state decision than this iteration needs.

### What still needs attention
- Resize handles are still visually subtle compared with the drag affordance and deserve a dedicated affordance pass.
- Narrow-window layouts may still produce awkward empty space or dense chrome once multiple controls wrap.
- Focus/maximized wording in the sessions toolbar still feels slightly inconsistent.
- Floating panel resize affordances still need a tiled-workflow-specific review.

### Iteration
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make drag/reorder more discoverable and reduce uncertainty while dragging

### Areas inspected
- `tiling-ux.md` previous iteration notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` (new)
- existing source-level renderer layout tests for sessions and tile UX

### Repro steps used
1. Open the sessions page with at least two active session tiles.
2. Look at the header and each tile without hovering anything first.
3. Try to determine whether tiles can be reordered and how to start doing it.
4. Start dragging a tile and watch how clearly the destination is communicated.

### UX problems found
- Reordering was available, but first-use discoverability was still weak because the per-tile cue depended on hover.
- The existing tile affordance was easy to miss on dense layouts because its text only appeared on very wide screens.
- Drag targets had a ring, but no explicit drop label, so the interaction still felt tentative during reorder.

### Assumptions
- It is acceptable to keep drag behavior on the whole tile for now and improve the cues around it, because that is the smallest change that improves discoverability without introducing new gesture rules.
- It is acceptable to rely on source inspection plus targeted tests instead of a live Electron repro in this iteration, because the change is local to renderer tile chrome and does not alter IPC or persistence behavior.
- A small helper chip in the sessions header is acceptable because the header already wraps after the previous layout-controls iteration.

### Decision and rationale
- Add a lightweight header hint only when reordering is actually possible (`>1` active session tiles).
- Make the per-tile reorder affordance visible by default and place it in the gap above the tile so it improves discoverability without covering tile content.
- Add a compact `Drop here` cue and stronger drag-target styling so reorder feels more predictable while dragging.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to show a `Drag to reorder` helper chip when multiple active sessions are present.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so the drag affordance is persistent, visually clearer, and paired with a stronger `Drop here` target cue during drag.
- Added `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the discoverability and drop-target UX.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro: not run in this iteration; acceptable because the change was limited to local renderer styling and source-level UX cues.

### Tradeoffs considered
- Making only the tile chip more visible would help somewhat, but a header-level hint reduces first-use ambiguity better.
- Switching to handle-only dragging could reduce accidental drags, but it would be a behavior change and needs a more deliberate validation pass.
- Adding directional insertion markers (before/after) would imply semantics that the current reorder algorithm does not explicitly model, so a neutral `Drop here` cue is safer for now.

### What still needs attention
- Tile resize affordances are still subtle, especially on the right and bottom edges.
- Narrow-window density and clipping inside tile chrome should be revisited now that layout controls and drag cues are clearer.
- Maximized vs grid behavior under aggressive sidebar width changes still deserves a dedicated predictability pass.
- Floating panel resize affordances still need a dedicated pass for tiled-session workflows.

### Iteration 4 — make tile resize targets easier to acquire
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: reduce missed grabs on tile resize handles without adding heavy permanent chrome

### Areas inspected
- `tiling-ux.md` previous iteration notes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` (comparison only; no changes this pass)

### Repro steps used
1. Inspect the tiled-session wrapper around `AgentProgress` and compare the visible drag cue with the right and bottom resize rails.
2. Follow the actual hit areas for width, height, and corner resizing in `SessionTileWrapper`.
3. Consider dense tiles and narrower windows where the user has little spare pointer room near the tile edge.
4. Attempt a live Electron repro; if no inspectable renderer is available, fall back to source inspection plus targeted renderer verification.

### UX problems found
- The right and bottom resize handles were still only `1.5px` thick and sat almost entirely on the tile edge, so users had to aim too precisely.
- Resize was technically available, but it was less discoverable and less forgiving than the newer drag affordance.
- The corner handle signaled two-axis resize, but the width-only and height-only intent remained easy to miss until after a failed grab.

### Assumptions
- It is acceptable to extend the resize hit target slightly into the surrounding grid gap because that space is already reserved visual breathing room and does not hide tile content.
- Hover-only helper labels are acceptable here because they appear only when the pointer is already near a resize target, keeping the resting tile chrome compact.
- Source inspection plus targeted tests and typecheck are sufficient for this pass because no persistence model, IPC contract, or session state behavior changed.

### Decision and rationale
- Keep the current resize behavior and persistence model unchanged.
- Increase the effective hit area for the right, bottom, and corner handles by wrapping each handle in a larger invisible interaction zone.
- Keep the visible rail slim, then add short axis-specific hover hints (`Resize width`, `Resize height`, `Resize tile`) so resize intent becomes clearer before drag begins.
- This is better than making the rails permanently much thicker because it improves acquisition without making every tile look heavier or more crowded.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so width, height, and corner handles use larger interaction shells with slim internal indicators.
- Added compact hover hints near each resize target to clarify which dimension will change.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the larger hit-target shells and hover guidance.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro attempt via renderer inspection was not available because no inspectable Electron target was running.

### Tradeoffs considered
- Permanently visible `Resize` labels would improve discoverability further, but they would add too much repeated chrome to already dense tiles.
- Simply thickening the rails would help hit rate, but it would also make the tile edges feel visually heavy.
- A broader shared resize-affordance abstraction across tiled sessions and the floating panel could reduce duplication, but that is a larger cleanup than this focused iteration needs.

### What still needs attention
- Maximized vs grid behavior still deserves a predictability pass, especially when sidebar width changes while a tile is expanded.
- Narrow-window density and clipping inside tile headers/footers should be revisited now that drag and resize affordances are clearer.
- Floating panel resize handles still need their own UX pass so their discoverability better matches tiled-session resizing.

### Iteration
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make tile resizing more discoverable without changing resize behavior or persistence rules

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` (new)

### Repro steps used
1. Open the sessions page with active tiles in grid mode.
2. Look for any indication that tile edges can be resized before hovering near the edge.
3. Compare the visibility of the drag affordance against the width, height, and corner resize affordances.
4. Inspect whether hover and active resize feedback are strong enough to make the drag direction obvious.

### UX problems found
- The right and bottom resize handles were effectively invisible until hover, so they read more like accidental hotspots than explicit controls.
- The corner grip existed, but its chrome was too subtle compared with the now-visible drag affordance above the tile.
- The resize surfaces had no explicit guidance text, which made width-only vs height-only resizing harder to infer.

### Assumptions
- It is acceptable to improve resize affordances purely through renderer chrome and hover states without changing drag mechanics, because the current resize behavior already works and this iteration is about clarity.
- It is acceptable for resize handles to remain mouse-first in this iteration; adding keyboard resize would be a larger interaction design task.
- Using titles and labels on the handles is acceptable even though the primary win here is visual discoverability, because they reinforce intent with minimal risk.

### Decision and rationale
- Keep the same three resize entry points (right edge, bottom edge, corner), but make them faintly visible even at rest.
- Strengthen the corner handle with clearer chrome so it reads as the combined width+height affordance.
- Add explicit width/height/corner resize guidance text so the interaction is easier to predict before dragging.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add always-visible low-key resize rails, stronger hover/active states, and clearer corner-handle chrome.
- Added explicit `title` and `aria-label` guidance for width, height, and corner tile resizing.
- Added `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the intended resize affordance styling and guidance strings.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro: not run in this iteration; acceptable because the change stayed within renderer-only affordance styling and descriptive labels.

### Tradeoffs considered
- Making the rails much larger would improve discoverability further, but would also increase overlap with tile content and risk feeling visually heavy.
- Replacing the rails with a single visible `Resize` badge would be more obvious, but would hide the axis-specific entry points that already exist.
- Changing resize persistence or axis behavior in the same pass would expand scope beyond affordance clarity and raise regression risk.

### What still needs attention
- Narrow-window density and clipping inside tile chrome should be revisited now that layout and resize affordances are clearer.
- Maximized vs grid behavior under aggressive sidebar width changes still deserves a dedicated predictability pass.
- Focus/maximized terminology in the sessions toolbar could still be made more consistent.
- Floating panel resize affordances still need a dedicated pass for tiled-session workflows.

### Iteration 5 — stack narrow grids to a full-width column
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: prevent awkward narrow-window tile sizing when the sessions grid cannot actually fit two minimum-width columns

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` (new)

### Repro steps used
1. Review the current width calculation for `1x2` and `2x2` session layouts.
2. Compare that logic with `TILE_DIMENSIONS.width.min` and the grid gap to see what happens once the container becomes narrower than two minimum-width tiles plus spacing.
3. Follow how `useResizable` clamps widths during responsive reflow and during previously persisted tile sizes.
4. Attempt a live renderer repro, then fall back to source inspection and targeted tests when no inspectable Electron target is available.

### UX problems found
- `1x2` and `2x2` always sized tiles as if two columns should exist, even when the viewport/sidebar combination no longer had room for two minimum-width tiles.
- Once the layout wrapped to one column, tiles could still keep the old narrower width, leaving awkward empty space instead of using the available width.
- The shared resizable min-width clamp could fight the responsive fallback on very narrow containers, making the stacked layout less predictable.

### Assumptions
- It is acceptable to keep the selected layout mode (`2-up` or `Grid`) visible while responsively stacking the rendered tiles to one column, because this preserves the user's intent without silently changing toolbar state.
- It is acceptable to temporarily relax the tile min-width only when the available container width is smaller than the standard minimum, because clipping is worse than allowing a narrower tile in that specific constrained case.
- Code inspection plus focused unit tests are sufficient for this pass because the change is local to renderer sizing math and a live Electron target was not available.

### Decision and rationale
- Add an explicit single-column fallback for non-maximized layouts when two minimum-width tiles plus the inter-tile gap cannot fit.
- In that fallback, let tiles use the full available grid width instead of preserving the previous narrower two-column width.
- Align the resizable width bounds with the current container width so responsive stacking and persisted widths do not fight each other.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to compute an effective column count and return full-width tiles when narrow windows cannot support two columns.
- Updated the same file to derive resizable `minWidth`/`maxWidth` from the current grid width and cap tile rendering with `maxWidth: 100%`.
- Added `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to lock in the responsive single-column fallback and narrow-width resize bounds.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro attempt via renderer inspection was not possible because no inspectable CDP target was running.

### Tradeoffs considered
- Automatically switching the selected layout mode to `Maximized` on narrow widths would be more explicit, but it would also make the UI state feel unstable as the sidebar or window width changes.
- Keeping the old two-column tile width while letting tiles wrap avoids a behavior change, but it leaves obvious empty space and makes the stacked layout look accidental.
- Reworking stacked-layout height semantics in the same pass could improve density further, but it would expand scope beyond the narrow-window width predictability problem.

### What still needs attention
- `2-up` tiles remain tall when they stack to one column, so stacked-height density may deserve a follow-up iteration.
- Maximized vs grid terminology and state clarity in the sessions toolbar still deserve a consistency pass.
- Floating panel resize UX still needs a dedicated tiled-workflow review, especially where panel resizing competes with the sessions page for horizontal space.

### Iteration 6 — keep stacked 2-up tiles denser
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: keep narrow stacked `2-up` layouts scannable by avoiding full-height tiles once the grid collapses from side-by-side into a single column

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`

### Repro steps used
1. Review how `calculateTileHeight` behaves for `1x2`, `2x2`, and `1x1` layouts.
2. Compare the new narrow-width single-column fallback with the previous `1x2` full-height rule.
3. Check whether the earlier responsive-reflow logic would preserve a now-too-tall height even when `2-up` crosses from two columns into one.
4. Validate the intended breakpoint behavior with focused unit tests and the existing responsive-reflow regression test.

### UX problems found
- After the width fallback landed, narrow `2-up` layouts still kept full-height tiles, which made the stacked state feel more like a series of maximized views than a compact comparative layout.
- Because responsive reflow intentionally preserved user-set height, crossing the two-column breakpoint could keep an overly tall height even when the layout semantics had clearly changed.
- The result was improved width fit but still suboptimal density on narrow windows, especially when the sidebar reduced the sessions page to a single usable column.

### Assumptions
- It is acceptable for `2-up` to become a vertically stacked, half-height browsing mode when horizontal space runs out, because that preserves the spirit of showing multiple active sessions at once better than full-height stacked tiles do.
- It is acceptable to retarget height on width reflow only when the effective `2-up` column count changes, because that keeps the earlier “preserve user-adjusted height” behavior intact for ordinary sidebar/window nudges.
- Focused unit tests and typechecking are sufficient for this pass because the change remains local to renderer layout math and no live Electron inspection target is currently available.

### Decision and rationale
- Keep `1x2` full-height when there is enough room for side-by-side tiles.
- Once `1x2` collapses to a single column, switch its target height to the same half-height rhythm used by `2x2` so roughly two tiles remain visible per viewport.
- Preserve custom height during ordinary width reflow, but allow a targeted height retarget when `1x2` crosses the narrow stacking breakpoint.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `calculateTileHeight` now considers container width and gives narrow stacked `1x2` tiles a half-height target.
- Refined responsive reflow in the same file so width changes still preserve height by default, but crossing the `2-up` column breakpoint can retarget height for the stacked layout.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` and updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new density rule.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro was still not available because no inspectable CDP target was running.

### Tradeoffs considered
- Keeping full-height `2-up` tiles in the stacked fallback preserves the old sizing rule, but it makes the narrow state feel far too close to a maximized layout.
- Retargeting height on every width change would overcorrect and reintroduce the accidental height-reset problem from an earlier iteration.
- Automatically switching the layout mode from `2-up` to `Grid` or `Maximized` at the breakpoint would be more explicit, but it would also make the toolbar state feel unstable during normal resizing.

### What still needs attention
- Maximized vs grid terminology and state clarity in the sessions toolbar still deserve a consistency pass.
- Floating panel resize UX still needs a dedicated tiled-workflow review, especially where panel resizing competes with the sessions page for horizontal space.
- A future pass could validate these stacked-state changes in a live Electron session once an inspectable renderer target is available.

### Iteration 7 — make floating panel resizing easier to discover
- Date: 2026-03-07
- Scope: desktop tiled sessions + floating panel workflow
- Focus for this iteration: make the floating panel’s resize capability more visible and predictable when users need to rebalance space between the panel and tiled session views

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts`

### Repro steps used
1. Review how the floating panel is wrapped and where resize handles are injected.
2. Compare the current panel resize affordances against the now-improved tiled-session resize affordances.
3. Attempt a live renderer inspection to confirm the current panel behavior in-app.
4. If no inspectable Electron target is available, fall back to source inspection plus focused renderer tests.

### UX problems found
- The floating panel’s resize handles were effectively transparent hotspots until the user hovered the exact edge or corner.
- Unlike the tiled session cards, the panel gave almost no resting-state clue that it could be resized, which makes the feature easy to miss during tiled workflows.
- The resize interaction had no live descriptive feedback, so users had to infer whether they were adjusting width, height, or both.

### Assumptions
- It is acceptable to improve only the panel’s resize discoverability and live feedback in this pass, because the underlying resize behavior, persistence, and IPC flow already work.
- A subtle corner grip, edge rails, and hover hint are acceptable because they improve discoverability without adding heavy permanent chrome over the panel content.
- Code inspection plus targeted tests are sufficient for this pass because a live Electron inspection target was not available and the change stayed renderer-local.

### Decision and rationale
- Keep all existing panel resize entry points and persistence behavior unchanged.
- Add low-key visible resize rails plus a clearer corner grip so the panel reads as resizable before the user hunts for an invisible hotspot.
- Add a compact `Resize panel` hint with live `width × height` feedback while dragging so the interaction feels more intentional and easier to trust.
- Add explicit panel-specific `title` and `aria-label` strings to the live resize targets so their purpose is clearer and easier to lock down in tests.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add group-based panel resize chrome: right/bottom rails, a visible corner grip, and a compact resize hint with live size feedback during drag.
- Updated the same file so the wrapper tracks active resize state and visually strengthens the affordances while the user is resizing.
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` to accept explicit `title` and `ariaLabel` props for panel resize targets.
- Added `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new discoverability and labeling treatment.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts src/renderer/src/pages/panel.recording-layout.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro attempt via renderer inspection was not possible because no inspectable CDP target was running.

### Tradeoffs considered
- Making every panel edge permanently bright would improve discoverability further, but it would make the floating panel feel heavier and more distracting during normal use.
- Moving to a single explicit resize button would be more obvious, but it would hide the existing direct-manipulation model and add an extra step for a simple adjustment.
- Reworking panel positioning or resizing semantics in the same pass could improve the overall workflow more dramatically, but it would expand scope far beyond this localized affordance improvement.

### What still needs attention
- The sessions toolbar still mixes `Focus`, `Focused view`, and maximize language in slightly inconsistent ways.
- A future tiled-workflow pass could validate whether panel resize affordances should adapt more strongly by panel mode (`normal`, `agent`, `textInput`).
- Live Electron verification is still worth doing once an inspectable desktop target is available.

### Iteration 7 — make focused layout a true one-up view
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make the `Focus` / maximized layout behave predictably by showing one session instead of stretching every tile into an expanded stacked view

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` (new)
- `apps/desktop/src/renderer/src/components/session-grid.tsx` (read for sizing implications only; no code changes this pass)

### Repro steps used
1. Review how the sessions page derives `tileLayoutMode`, `focusedSessionId`, and the rendered tile list.
2. Trace what happens when layout mode becomes `1x1`, both from the toolbar and from a tile maximize action.
3. Compare the toolbar copy (`Focus`, `Maximized`) with the actual rendering behavior in code.
4. Validate the intended one-up behavior and the surrounding cues with focused renderer tests and desktop web typecheck.

### UX problems found
- The `1x1` layout expanded tiles visually, but still rendered every active session, so “focus” behaved more like a stack of maximized tiles than a true one-up view.
- Because multiple expanded tiles could still appear, the transition from grid to focus mode was harder to predict and did not match the toolbar wording.
- Drag/reorder cues remained available even when only a single tile should meaningfully be shown, adding ambiguity in the focused state.

### Assumptions
- It is acceptable to choose the first available tile as a fallback focused session when no valid `focusedSessionId` exists, because hiding all tiles would be worse than showing a deterministic one-up fallback.
- It is acceptable to keep the toolbar label as `Focus` for now and fix the behavior first, because behavior mismatch was the bigger usability issue than copy alone.
- Source inspection, focused tests, and desktop web typecheck are sufficient for this pass because the change stays local to renderer session selection and tile chrome.

### Decision and rationale
- In `1x1`, derive a single `maximizedSessionId` from the current focused session when possible, otherwise fall back to the first visible pending/active tile.
- Render only that one tile in focused layout, while leaving the non-focused layouts unchanged.
- Replace reorder guidance in focused mode with a compact `Focused view` summary so the user understands that showing one of many sessions is intentional rather than a rendering bug.
- This is better than silently leaving all expanded tiles visible because it makes focus mode match both user expectation and the existing maximize affordance.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive a `maximizedSessionId`, filter visible session tiles in `1x1`, and gate pending tiles so focused layout shows only the selected session.
- Updated the same file to disable drag/reorder cues for focused layout and show a compact `Focused view` summary when one tile is being shown out of several.
- Added `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the one-up rendering and focused-layout cue logic.
- Adjusted focused-layout copy in `sessions.tsx` so the `1x1` tooltip and active-layout label describe the state more accurately.

### Verification
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Live Electron repro: not available in this iteration because no inspectable Electron target was running.

### Tradeoffs considered
- Keeping all tiles visible in `1x1` preserves more context, but it makes the focus/maximize control feel misleading and keeps the layout harder to predict.
- Automatically mutating global focused-session state on every `1x1` entry would make selection more explicit, but it adds store-side effects that this local renderer fix does not need.
- Renaming `Focus` to `Maximized` everywhere in the same pass could improve terminology consistency further, but behavior correctness was the higher-value change for this iteration.

### What still needs attention
- `Focus` vs `Grid` terminology in the toolbar could still use a small copy/design pass now that the one-up behavior is correct.
- Floating panel resize UX still needs a dedicated tiled-workflow review, especially where panel resizing competes with the sessions page for horizontal space.
- A future pass should validate the focused-layout behavior in a live Electron session once an inspectable renderer target is available.

### Iteration 8 — clarify single-session layout state
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: reduce terminology mismatch and ambiguity around the one-up layout so the toolbar state, tile action, and focused-layout summary all describe the same behavior more clearly

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps used
1. Review the sessions toolbar labels and tooltips for `2-up`, `Grid`, and the `1x1` layout.
2. Compare that copy with the tile-level entry point that moves a session into the one-up state.
3. Inspect the focused-layout summary chip to see whether it identifies which session is being shown.
4. Attempt a live renderer inspection to validate the current state in-app; if unavailable, fall back to source inspection plus targeted renderer tests.

### UX problems found
- The same layout state was described three different ways: `Focus` in the toolbar, `Focused view` in the summary chip, and `Maximize tile` on the per-tile affordance.
- In one-up mode, the summary chip explained that only one tile was visible, but it did not identify which session was being shown.
- That mismatch made the maximized-vs-grid transition feel more ambiguous than it needed to, especially after the earlier change that made `1x1` a true one-tile layout.

### Assumptions
- It is acceptable to keep existing internal state names like `focusedSessionId`, `isFocusLayout`, and `handleMaximizeTile` for now, because this pass is about user-facing clarity rather than internal renaming.
- It is acceptable to use `Single` / `Single view` language for the toolbar and summary because it describes the actual rendered outcome more directly than `Focus` does.
- Source inspection, targeted renderer tests, and desktop web typecheck are sufficient for this pass because the change is copy/UI-local and a live Electron inspection target was not available.

### Decision and rationale
- Rename the `1x1` toolbar affordance from `Focus` to `Single` and describe it as `Show one session at a time`.
- Update the active-layout summary chip to use the same `Single view` language and identify the currently shown session by title (with a safe session-id fallback).
- Rename the per-tile entry affordance from `Maximize tile` to `Show only this session` so the action text matches the resulting layout state.
- This is better than keeping the previous mixed terminology because it reduces the mental translation users had to do between tile action, toolbar state, and resulting layout.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the `1x1` layout button now uses `Single` / `Show one session at a time` copy and `Single view` as the active-state label.
- Added a small `getSessionTileLabel(...)` helper in the same file so the focused-layout summary chip can identify the currently shown session instead of only saying `Showing 1 of N`.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so the tile one-up action now says `Show only this session` and exposes the same wording through `aria-label`.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`, `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`, and `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new terminology and focused-session summary behavior.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/components/agent-progress.tile-layout.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro attempt via renderer inspection was not possible because no inspectable CDP target was running.

### Tradeoffs considered
- Renaming everything to `Maximized` would align with the existing iconography, but it still emphasizes presentation more than the practical outcome of showing one session at a time.
- Keeping `Focus` everywhere would preserve existing wording, but it is more abstract and does not explain the one-up rendering result as directly.
- Broadly renaming internal variables and handlers would improve consistency further, but it would add churn without materially improving the user-facing behavior in this local pass.

### What still needs attention
- The sessions toolbar could still benefit from a future design pass on density and wrapping when many controls are visible at once.
- Live Electron validation remains worthwhile once an inspectable desktop target is available, especially for confirming how the new `Single view` chip reads at different widths.
- A future pass could explore whether one-up mode should offer a clearer next/previous-session browsing affordance without returning to grid.

### Iteration 8 — make the panel’s content-facing edge obviously resizable
- Date: 2026-03-07
- Scope: desktop tiled sessions and floating panel workflows
- Focus for this iteration: make floating-panel width resizing clearer from the left edge, because that is the edge that directly intersects with tiled session space

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/panel.tsx` (usage/context only; no code changes this pass)

### Repro steps used
1. Review which panel edges already have visible resize cues versus which edges only expose invisible hit targets.
2. Compare those cues with how the floating panel typically affects tiled sessions, especially when the panel sits on the right and width changes happen from the left/content-facing edge.
3. Follow how `ResizeHandle` exposes titles/ARIA today and whether it can provide hover-direction context back to the wrapper.
4. Validate the intended affordance updates with the focused panel resize test and desktop web typecheck.

### UX problems found
- The floating panel already exposed left/right/top/bottom hit targets, but the visible resize rails only appeared on the right and bottom edges.
- In tiled workflows, the panel edge that matters most for layout competition is usually the left edge, because that is the side that expands into or releases space back to the sessions view.
- The helper chip always read as a generic `Resize panel` hint near the bottom-right corner, so it did not clarify whether the current gesture would change width, height, or both.

### Assumptions
- It is acceptable to make the left edge more visible than before without changing resize mechanics, because the current behavior already works and the main issue is discoverability where the panel competes with tiled sessions.
- It is acceptable to add lightweight hover-state wiring to `ResizeHandle` because that is a local renderer-only change and the component is already panel-specific in practice.
- Source inspection, the focused affordance test, and desktop web typecheck are sufficient for this pass because no main-process resize contract or persistence behavior changed.

### Decision and rationale
- Add a mirrored left resize rail so the sessions-facing panel edge no longer looks inert.
- Track which resize handle is hovered/active and use that to reposition the helper hint plus switch its label between `Resize width`, `Resize height`, and `Resize panel`.
- Slightly enlarge the live edge hit targets so left/right/bottom acquisition is more forgiving without adding heavy permanent chrome.
- This is better than only strengthening the bottom-right corner cue because it clarifies the exact edge users are most likely to drag when balancing the panel against tiled sessions.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add a visible left resize rail, highlight the relevant rail while hovering/resizing, and reposition the helper hint based on the active edge/corner.
- Updated the same file so the helper text becomes directional (`Resize width`, `Resize height`, `Resize panel`) instead of always reading as a generic bottom-right resize hint.
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` to export the handle position type, report hover/start position back to the wrapper, and slightly enlarge the edge/corner hit targets.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the left-edge rail, directional hint plumbing, and larger edge-hit classes.

### Verification
- `pnpm exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Live Electron repro: not available in this iteration because no inspectable Electron target was running.

### Tradeoffs considered
- Showing strong rails on every panel edge all the time would be even more explicit, but it would make the floating panel feel heavier and more decorative.
- A permanently visible text badge on the left edge would improve first-use discovery further, but it would also compete with panel content in a narrow floating window.
- Changing panel min-size logic or adding snapping behavior could further improve resizing, but that would broaden scope beyond the immediate discoverability problem.

### What still needs attention
- `Focus` vs `Grid` terminology in the sessions toolbar could still use a dedicated copy/design cleanup pass.
- A future pass could validate both the focused-session layout and the left-edge panel resize cues in a live Electron session once an inspectable renderer target is available.
- If panel resizing still feels ambiguous in practice, the next likely follow-up is a more explicit top-edge or corner treatment rather than another sessions-grid change.

### Iteration 9 — add in-place browsing for single-session layout
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make the `Single view` state easier to use by letting users move to the previous or next session without leaving the one-up layout

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps used
1. Review how `sessions.tsx` derives `maximizedSessionId` and what controls are still visible once `tileLayoutMode === "1x1"`.
2. Follow what a user can do after entering `Single view` from the toolbar or a tile action.
3. Attempt a live Electron renderer inspection to validate the current in-app state.
4. Fall back to source inspection plus targeted renderer tests when no inspectable Electron target is available.

### UX problems found
- `Single view` correctly showed only one session, but it still trapped navigation behind prior focus state or a mode switch back to grid.
- The summary chip explained that one session was shown, but it did not help users move through the rest of the ordered session set.
- That made the maximized/grid transition feel less smooth than it should, because one-up mode became a dead end instead of a focused browsing state.

### Assumptions
- It is acceptable to use the existing ordered session list as the browsing sequence in `Single view`, because that preserves the same ordering the grid already communicates.
- It is acceptable to stop at the first/last session instead of wrapping, because edge-disabled pager controls are more predictable than silent wraparound in a focused layout.
- Source inspection, a failed-but-documented Electron inspection attempt, targeted tests, and desktop web typecheck are sufficient for this pass because the change is renderer-local and does not alter persistence or main-process contracts.

### Decision and rationale
- Keep `Single view` as a true one-tile layout, but add compact previous/next controls directly in the sessions header while that mode is active.
- Show the current position (`N of M`) alongside the existing `Single view` summary so users can tell where they are in the ordered set before navigating.
- This is better than forcing users back to grid to switch sessions, because it keeps the one-up workflow focused while preserving the existing tile order and layout-switching model.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive shared `focusableSessionIds` for focused-layout selection and navigation.
- Added a small `handleStepFocusedSession(...)` helper in the same file plus compact previous/next buttons that only appear in `Single view` when there is more than one session to browse.
- Expanded the `Single view` summary chip to show the current session position (`N of M`) so the focused state reads as intentional browsing instead of a generic one-of-many notice.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new one-up pager behavior and position summary.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Live Electron repro attempt via renderer inspection failed because no inspectable Electron target was running.

### Tradeoffs considered
- Wrapping previous/next navigation in a loop would reduce dead ends, but it would also make the active ordering feel less explicit and easier to overshoot.
- Adding a larger textual pager (`Previous session` / `Next session`) would be more explicit, but it would add unnecessary header width in an already dense toolbar.
- Automatically changing `focusedSessionId` when entering `Single view` could make the initial selection more explicit, but it would add extra state mutation beyond the local UX problem being solved here.

### What still needs attention
- The sessions toolbar remains fairly dense when many controls and helper chips are visible at once, so a future pass should revisit wrapping and priority on narrower widths.
- Live Electron validation is still worth doing once an inspectable desktop target is available, especially to confirm the new `Single view` pager reads clearly beside the active-layout summary.
- A future follow-up could explore keyboard shortcuts for previous/next session browsing inside `Single view` if the pointer-only pager still feels too hidden in practice.

### Iteration 9 — make layout switching read clearly at rest
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: reduce layout-mode ambiguity in the sessions toolbar so users can understand the current tiling mode without relying on hover tooltips

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx` (terminology/context only; no code changes this pass)

### Repro steps used
1. Review the sessions toolbar labels and titles for the segmented layout control.
2. Compare what a user can understand at rest versus what only becomes clear on hover.
3. Check whether the current wording distinguishes side-by-side comparison from generic grid browsing and single-session mode.
4. Attempt a live Electron inspection; if no inspectable renderer target is available, validate the renderer-only change with focused tests and typecheck.

### UX problems found
- The `2-up` label was concise but jargon-heavy, so it conveyed structure more than user intent.
- The active layout meaning was mostly hidden behind hover titles like `Current layout: 2 columns`, which made the toolbar harder to parse at a glance.
- `Grid`, `Single view`, tile-level `Show only this session`, and older focus/maximize concepts were close enough to feel related but not yet aligned into one obvious at-rest story.

### Assumptions
- It is acceptable to improve layout switching clarity purely through copy and local toolbar chrome because the underlying layout behavior already works and previous iterations focused on behavior correctness.
- A compact always-visible current-layout descriptor is acceptable even in the wrapping sessions header because it replaces hover-only understanding with a small amount of stable guidance.
- Source inspection, focused renderer tests, and desktop web typecheck are sufficient for this pass because no main-process behavior or persistence logic changed and no inspectable Electron target was available.

### Decision and rationale
- Rename the side-by-side option from `2-up` to `Compare` so the button describes intent instead of internal layout jargon.
- Keep `Grid` and `Single`, but add a compact current-layout chip that explains the active mode in plain language (`Compare view · Side by side`, etc.).
- Keep the existing segmented control and active-button treatment instead of redesigning the toolbar, because the smallest useful change here is clearer wording plus an at-rest cue.
- This is better than only updating hover titles because the main problem was first-glance comprehension, not missing tooltip detail.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to relabel the `1x2` mode as `Compare` and tighten the related tooltip copy.
- Added plain-language layout metadata (`Compare view`, `Grid view`, `Single view` + short descriptors) and surfaced it as a compact current-layout chip next to the layout control.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the clearer labels and the new current-layout descriptor.

### Verification
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Live Electron repro attempt via renderer inspection was not possible because no inspectable CDP target was running.

### Tradeoffs considered
- Renaming only `2-up` would help, but the current mode would still be hard to interpret at rest without hovering.
- A broader toolbar redesign could make layout switching even clearer, but it would add unnecessary scope and regression surface for a copy/clarity issue.
- Renaming the single-session mode back to `Focus` would align with some internal state names, but it would also risk confusion with “focus a tile/session” interactions elsewhere in the product.

### What still needs attention
- The new current-layout chip should eventually be validated in a live Electron session to confirm it helps more than it crowds the wrapping header.
- A future pass could make the layout descriptor responsive to the effective narrow-window fallback (for example, when `Compare` temporarily stacks instead of remaining side by side).
- Floating panel resizing versus sessions-page width competition is still worth another dedicated tiled-workflow pass once live inspection is available.

### Iteration 10 — separate toolbar actions from layout context
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make the sessions header easier to scan and less crowded at narrow widths by separating primary actions from layout/context chrome

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- prior sessions toolbar and focus-layout notes for consistency with existing terminology work

### Repro steps used
1. Review the current sessions header structure around the start buttons, layout controls, reorder hint, focused-view summary, and cleanup actions.
2. Consider how those controls wrap once the sidebar is expanded or the window width becomes tight.
3. Check whether always-visible helper chips are competing directly with session-start actions in the same visual row.
4. Attempt live renderer inspection; if unavailable, validate the renderer-only change with focused tests and typecheck.

### UX problems found
- The sessions header mixed session-start actions, layout controls, contextual chips, browse buttons, and cleanup actions in one wrapping control area, so narrow states felt busier than they needed to.
- The current-layout chip and reorder/focus hints competed with primary actions instead of reading as secondary context.
- On smaller widths, repeated text like `Drag to reorder` and the layout description increased wrap pressure even though the core meaning could still be preserved with shorter chrome.

### Assumptions
- It is acceptable to reorganize the existing header into clearer rows without changing any control behavior, because the main problem here is scanability and density rather than missing functionality.
- It is acceptable to shorten some helper-chip text on the smallest widths, because these chips are secondary guidance and should yield space to the primary session actions.
- Source inspection, focused renderer tests, desktop web typecheck, and an attempted Electron inspection are sufficient for this pass because the change is renderer-local and no inspectable Electron target was available.

### Decision and rationale
- Split the sessions header into two layers: a primary row for agent selection / start actions / history-cleanup actions, and a secondary row for layout state, reorder/focus context, and layout switching.
- Keep the existing controls and copy model intact so the improvement stays local and low-risk.
- Reduce narrow-width pressure by hiding the layout descriptor and using a shorter reorder label on the smallest breakpoint while preserving the full meaning on larger widths.
- This is better than simply shrinking every control, because separation of concerns improves scanability and wrapping predictability without making the toolbar feel cryptic.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to restructure the sessions header into a primary actions row and a secondary layout/context row.
- Moved the current-layout chip into the contextual row and made its descriptive suffix responsive so narrow widths keep the essential label first.
- Shortened the reorder helper on the smallest breakpoint and slightly tightened the focused-session summary truncation so status chips fit more gracefully under width pressure.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the two-row toolbar structure and the responsive helper-chip behavior.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Removing the current-layout chip entirely on narrow widths would reduce chrome further, but it would undo the earlier at-rest clarity improvement.
- A broader toolbar redesign with new overflow menus could save even more space, but it would add behavior changes and more product risk than this local cleanup warrants.
- Keeping a single mixed toolbar row preserves the old structure, but it leaves contextual hints competing directly with the controls users need most often.

### What still needs attention
- The reorganized toolbar should still be validated in a live Electron session once an inspectable desktop target is available.
- A future pass could make the current-layout descriptor reflect the effective narrow stacked fallback, not just the selected layout mode.
- If the header still feels busy in practice, the next likely refinement is deciding which secondary chips deserve to collapse first before introducing any new overflow UI.

### Iteration 11 — reflect responsive stacking in the layout-state chip
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make the sessions toolbar describe the effective rendered layout when `Compare` or `Grid` collapses to one column under narrow window/sidebar widths

### Areas inspected
- `tiling-ux.md` latest notes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps used
1. Review the current layout chip copy in `sessions.tsx` and compare it with the responsive single-column fallback in `session-grid.tsx`.
2. Trace whether the sessions page knows when `Compare` / `Grid` has stacked because of narrow width or sidebar pressure.
3. Attempt a live Electron renderer inspection to confirm the state in-app.
4. If no inspectable renderer target is available, validate the renderer-only behavior with focused tests and desktop web typecheck.

### UX problems found
- The selected layout mode and the effective rendered layout could drift apart at narrow widths: tiles stacked into one column while the toolbar still implied `Side by side` or `More at once`.
- That mismatch made layout switching feel less predictable during sidebar expansion/collapse and other width changes.
- The sessions page had renderer wiring for layout-state updates, but the ledger and layout-controls test did not yet lock in that responsive stacked-state behavior.

### Assumptions
- It is acceptable to keep the selected layout mode (`Compare` / `Grid`) stable while separately signaling the responsive one-column fallback, because users should not lose their chosen mode just because the current width is temporarily constrained.
- A compact `Stacked` cue is acceptable even in the dense sessions header because it only appears when the previous description would otherwise be misleading.
- Source inspection, a failed-but-documented Electron inspection attempt, targeted tests, and desktop web typecheck are sufficient for this pass because the behavior is renderer-local and no inspectable Electron target was running.

### Decision and rationale
- Keep the existing layout selection model and responsive width fallback unchanged.
- Surface the *effective* narrow fallback in the current-layout chip by switching its description to a compact stacked-state cue (`Stacked` / `Stacked to fit`) whenever multi-tile layouts collapse to one column.
- Wire that cue from actual `SessionGrid` measurements instead of heuristics derived from toolbar state, so the sessions page reflects the same width/gap logic the grid already uses for tile layout.
- This is better than silently leaving the previous description in place because it reduces ambiguity without destabilizing the selected layout mode.

### Code changes
- Confirmed and retained the renderer wiring in `apps/desktop/src/renderer/src/components/session-grid.tsx` that reports live grid measurements and exposes `isResponsiveStackedTileLayout(...)` for the sessions page.
- Confirmed and retained the sessions-page layout-state logic in `apps/desktop/src/renderer/src/pages/sessions.tsx` that swaps the current-layout chip to a stacked-state description when narrow widths force a one-column fallback.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the measurement plumbing and responsive stacked-state chip behavior.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Automatically changing the selected layout button when narrow widths force stacking would be more explicit, but it would also make the toolbar state feel unstable while the sidebar or window size changes.
- Leaving the old description in place avoids more chrome, but it makes the toolbar tell an increasingly misleading story right when users most need layout predictability.
- A larger warning-style badge would stand out more, but the sessions header already carries several compact status cues and does not need heavier visual interruption for a temporary responsive fallback.

### What still needs attention
- This stacked-state cue should still be validated in a live Electron session once an inspectable desktop target is available.
- If the header still feels busy in practice, the next likely refinement is deciding whether the reorder helper or layout-description suffix should collapse first at the tightest widths.
- A future tiled-workflow pass could revisit whether the floating panel should contribute more explicit feedback when its width is the reason the sessions grid has stacked.

### Iteration 11 — make layout state truthful when responsive stacking kicks in
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: keep the sessions toolbar honest when `Compare` or `Grid` modes collapse into a one-column stack on narrower widths

### Areas inspected
- `tiling-ux.md` latest notes, especially the follow-up about responsive stacked fallback wording
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Electron renderer inspection availability via `electron_execute`

### Repro steps used
1. Review how the current-layout chip and active layout button titles are derived in `sessions.tsx`.
2. Compare that wording with the responsive column-collapse logic in `session-grid.tsx`.
3. Check whether `Compare view · Side by side` or `Grid view · More at once` can remain visible even after the grid has stacked to one column.
4. Attempt a lightweight Electron renderer inspection; if no inspectable target exists, validate with focused renderer tests and desktop web typecheck.

### UX problems found
- The current-layout chip described the selected mode, not the effective responsive result, so narrow states could still claim `Side by side` after the grid had stacked vertically.
- The active segmented-control button title had the same problem, which meant both visible and hover text could reinforce the wrong mental model.
- This mismatch is most noticeable precisely when width is constrained, which makes the toolbar feel less trustworthy during sidebar-open and smaller-window workflows.

### Assumptions
- It is acceptable to treat responsive single-column collapse as a temporary presentation state rather than a layout-mode change, because the user's selected mode should still remain `Compare` or `Grid`.
- It is acceptable to use the grid's measured width and gap as the truth source for the descriptor, because that reuses the same sizing rules the tiles already follow instead of inventing a second breakpoint heuristic.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and does not affect persistence or main-process behavior.

### Decision and rationale
- Keep the selected layout label (`Compare view` / `Grid view`) stable so users still know which mode they chose.
- Swap only the descriptive suffix to `Stacked` / `Stacked to fit` when the grid has responsively fallen back to one column with multiple visible tiles.
- Surface the short `Stacked` label even on the smallest breakpoint, because hiding all descriptor text on narrow screens would leave the misleading state invisible exactly where it matters most.
- This is better than silently changing the selected mode to `Single view`, because the user did not choose a maximized one-tile mode — the UI is simply adapting the chosen multi-tile mode to fit the available width.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to expose grid measurements to callers and added `isResponsiveStackedTileLayout(...)` so other UI can reuse the actual column-collapse logic.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track live grid width/gap, derive whether the current tiled layout is temporarily stacked, and reflect that in the current-layout chip plus active-button title.
- Kept the chip compact by showing the short `Stacked` text on the smallest breakpoint and the fuller `Stacked to fit` wording from `sm` upward.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new responsive-state behavior.

### Verification
- `pnpm exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Replacing `Compare` or `Grid` with `Single view` during responsive collapse would be more literal about the one-column result, but it would confuse the difference between a deliberate mode switch and a width-driven fallback.
- Leaving the descriptor static avoids extra measurement plumbing, but it keeps the toolbar lying about the visible layout.
- Showing the full `Stacked to fit` phrase on the smallest breakpoint would be more explicit, but the shorter `Stacked` label preserves the truth without reintroducing the density problem from earlier iterations.

### What still needs attention
- This should still be validated in a live Electron session to confirm the stacked descriptor appears at the right moments during real sidebar resizing and window-width transitions.
- The floating panel vs tiled-session width competition is still worth a dedicated pass once a live inspectable renderer is available, since that interaction can trigger the same responsive stacking thresholds.
- If responsive layout state keeps becoming more nuanced, a future pass may need to decide whether the segmented control itself should expose lightweight width-aware affordances instead of relying only on the current-layout chip.

### Iteration 12 — reduce repeated agent chrome inside narrow session tiles
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: improve tile density and visual hierarchy by removing repeated agent identity from persistent footer/composer chrome

### Areas inspected
- `tiling-ux.md` latest notes to avoid repeating recent layout-mode work
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Electron renderer inspection availability via `electron_execute`

### Repro steps used
1. Review the tile variant in `agent-progress.tsx`, especially the always-visible header, footer, queue panel, and follow-up input.
2. Check which tile surfaces repeat `profileName` while the same tile is already showing that identity in the header.
3. Compare the full follow-up composer with the newer compact `preferCompact` prompt path to see whether the extra agent label still adds value in constrained tiles.
4. Attempt a lightweight Electron renderer inspection; if unavailable, validate the iteration through targeted renderer tests and desktop web typecheck.

### UX problems found
- The tile header already exposed agent identity, but the footer repeated the same `profileName`, which cost horizontal space that could otherwise go to ACP/model/context metadata.
- The tile follow-up input repeated the agent label again above the composer, making the persistent tile chrome feel denser than necessary even after earlier narrow-width work.
- This repetition is most noticeable in compare/grid layouts where several tiles are visible at once and each extra metadata row compounds visual noise.

### Assumptions
- It is acceptable to keep agent identity only in the tile header because that header remains visible outside the scrollable transcript area, so users still retain orientation while reading or replying.
- It is acceptable for the tile footer to focus on operational metadata instead of identity, because the footer's primary job is to summarize state like ACP/model/context/step progress.
- Targeted renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and does not alter session state or persistence.

### Decision and rationale
- Keep agent identity in the tile header, where it best supports scanability and title/context grouping.
- Remove the duplicate `profileName` from the tile footer so narrow tiles preserve room for more actionable runtime metadata.
- Remove the duplicate agent indicator from `TileFollowUpInput`, since the tile already communicates ownership in the header and the composer now benefits more from reduced vertical chrome.
- This is better than restyling the repeated labels into smaller badges, because reducing duplication entirely improves density and hierarchy more than merely shrinking redundant content.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to stop repeating `profileName` in the tile footer.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to stop passing agent identity into `TileFollowUpInput` for tiled sessions.
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx` to remove the now-redundant agent indicator row and related prop/import.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new single-source agent identity behavior for tiles.

### Verification
- `pnpm exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Keeping the footer and composer labels while only truncating them harder would preserve explicitness, but it would still waste chrome on information the header already provides.
- Removing the header label instead would make the footer/composer carry identity lower in the tile, which is worse for multi-tile scanning and title association.
- Replacing the duplicate labels with icons only would save some space, but it would still keep redundant UI elements competing with more useful metadata.

### What still needs attention
- The compact follow-up prompt path should eventually be validated in a live Electron session to confirm the lighter composer feels discoverable when several tiles are visible.
- The tile footer may still benefit from a future prioritization pass around whether context usage deserves a more explicit textual cue when space is available.
- The floating panel / tiled-session interaction is still open for a dedicated resizing pass once a live inspectable renderer is available.

### Iteration 12 — reduce repeated follow-up chrome in unfocused tiles
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: reduce footer density and wasted vertical space inside multi-tile grids by collapsing the full follow-up composer in unfocused tiles into a lighter focus-first affordance

### Areas inspected
- `tiling-ux.md` latest notes, to avoid repeating the recent toolbar / stacked-state passes
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/components/follow-up-input.submit.test.ts`
- Electron renderer inspection availability via `electron_execute`

### Repro steps used
1. Review the tile footer structure in `agent-progress.tsx`, especially what remains visible in non-focused grid tiles.
2. Inspect `tile-follow-up-input.tsx` to see whether every tile always renders the full inline composer, even when the tile is not focused.
3. Compare that behavior with the stated tiled-workflow goals around density, spacing, and visual hierarchy.
4. Attempt a lightweight Electron renderer inspection; if no inspectable target exists, validate the renderer-only change with targeted tests and desktop web typecheck.

### UX problems found
- Every tile rendered the full follow-up composer all the time, including agent indicator, input field, and action buttons, even when the tile was not the one the user was actively reading or replying in.
- In compare/grid layouts this repeated footer chrome consumed vertical space across multiple tiles, making transcript content feel more cramped and visually noisy.
- The full composer also diluted hierarchy: unfocused tiles visually competed with the focused tile even though replying usually starts by selecting the tile first.

### Assumptions
- It is acceptable for unfocused grid tiles to require one focus click before showing the full composer, because that matches the existing focus-first tiled workflow and preserves a clear primary interaction target.
- It is acceptable to keep the full composer visible for the focused tile, single-view / expanded tile, or any tile with a draft or attachments, because hidden draft state would be worse than extra density.
- Targeted renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Add a compact follow-up affordance for unfocused non-expanded tiles instead of showing the full composer everywhere.
- Keep the compact row explicit enough to remain discoverable (`Continue conversation...` / `Queue message...` / `Agent is replying…` plus a `Focus to type/view` cue), but much lighter than the full control strip.
- Restore the full composer immediately for the focused tile, expanded/single-view tile, or any tile that already contains draft content, so the change saves space without hiding active work.
- This is better than simply shrinking the existing composer, because the main issue is duplicated interaction chrome across many tiles, not just individual control size.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx` to support a compact focus-first mode via `preferCompact` and `onRequestFocus` props.
- Added a lightweight compact footer treatment for unfocused tiles while preserving the existing full composer for focused / expanded / draft-holding states.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so tiled session cards pass `preferCompact={!isFocused && !isExpanded}` and reuse the tile focus handler when the compact prompt is activated.
- Added `apps/desktop/src/renderer/src/components/tile-follow-up-input.layout.test.ts` to lock in the compact-affordance contract and the focused-tile fallback to the full composer.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/tile-follow-up-input.layout.test.ts src/renderer/src/components/agent-progress.tile-layout.test.ts src/renderer/src/components/follow-up-input.submit.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Leaving the full composer visible in every tile keeps zero-click reply access, but it preserves the dense repeated footer problem and weakens focus hierarchy.
- Hiding the entire follow-up affordance in unfocused tiles would save slightly more space, but it would make continuation feel less discoverable than a compact prompt.
- A larger redesign with overflow menus or floating reply chrome could save even more space, but it would add broader behavior changes before this simpler hierarchy fix is validated.

### What still needs attention
- This compact footer should still be validated in a live Electron session to confirm the focus transition feels natural during actual tile clicking and drag/reorder workflows.
- The floating panel vs tiled-session width competition remains a good next pass, especially because panel width changes can intensify the same tile-density pressure this change is trying to relieve.
- If tile interiors still feel busy after this, the next likely refinement is deciding whether unfocused tiles should also soften or compress some of their lower-priority metadata rows.

### Iteration 13 — lock width resizing in full-width tile states
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make maximized and responsive stacked tiles feel more predictable by removing misleading width-resize affordances once a tile is already supposed to fill the row

### Areas inspected
- `tiling-ux.md` latest notes, especially the still-open resize-affordance follow-up
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`

### Repro steps used
1. Review how `SessionTileWrapper` computes width/height targets and resize bounds for `1x2`, `2x2`, and `1x1` layouts.
2. Check whether responsive one-column fallback and `Single` view still render right-edge / corner resize handles.
3. Trace how a previously persisted `session-tile` width would behave when the layout later becomes full-width.
4. Attempt live Electron inspection first; if no inspectable renderer is available, validate the renderer-local fix with focused tests and desktop web typecheck.

### UX problems found
- Tiles that were already meant to be full-width still exposed width and corner resize handles, which implied a useful horizontal resize action even though shrinking the card mostly created awkward empty gutters.
- That was especially confusing in `Single` view, where a “maximized” tile could still be manually narrowed into a card-like width.
- Because tile size persists through the shared `session-tile` key, an old narrow width could also leak into later full-width states until another layout event corrected it.

### Assumptions
- It is acceptable to keep height resizing available in full-width states, because users may still want to control transcript density vertically even when horizontal layout should remain stable.
- It is acceptable to lock width in responsive stacked states as well as `Single` view, because once the grid has already collapsed to one column the primary UX goal is a clean full-row tile, not custom gutter creation.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Treat `Single` view and responsive one-column stacked tile states as width-locked layouts.
- Keep the bottom height-resize rail visible there, but hide the right-edge and corner handles so the affordances match the actual useful actions.
- Clamp any persisted width back to the computed full-width target whenever the layout enters one of these width-locked states.
- This is better than merely restyling the width handles, because the main issue is misleading capability and layout unpredictability, not just handle visibility.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add `shouldLockTileWidth(...)` and use it to identify full-width tile states.
- Updated the same file so width bounds collapse to the computed full-width target in those states, preventing persisted narrow widths from leaking into maximized/stacked layouts.
- Hid the width-edge and corner resize handles when width is locked, while keeping the bottom height-resize handle available.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`, `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`, and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new width-locking contract.

### Verification
- `pnpm exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Leaving width resize enabled everywhere preserves maximum control, but it makes full-width states feel inconsistent and easy to accidentally degrade.
- Disabling all resizing in full-width states would simplify the chrome further, but it would also remove a still-useful height adjustment for dense transcript browsing.
- Introducing per-layout persisted size keys could solve this more comprehensively, but it would be a broader persistence decision than this local affordance fix needs.

### What still needs attention
- This width-lock behavior should still be validated in a live Electron session to confirm the affordance change feels obvious during actual layout switching and sidebar-width changes.
- A future pass could decide whether two-column layouts with only one visible tile should also opportunistically expand to fill more horizontal space.
- The floating panel vs tiled-session width interaction remains worth a dedicated pass, especially because panel-size changes can push the grid into the same width-locked stacked state.

### Iteration 14 — soften unfocused tile footer metadata
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: reduce footer noise in multi-tile layouts by collapsing lower-priority runtime metadata until a tile is focused or expanded

### Areas inspected
- `tiling-ux.md` latest notes, especially the open follow-up about lower-priority tile metadata
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/acp-session-badge.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.layout.test.ts`

### Repro steps used
1. Review the tile footer in `agent-progress.tsx` after the recent focus-first follow-up input pass.
2. Check which footer details remain visible in unfocused, non-expanded tiles and which of those are essential versus secondary.
3. Compare ACP-session footer chrome with non-ACP model/provider metadata to see whether multi-tile scanability is being hurt by repeated detail.
4. Attempt a lightweight Electron renderer inspection; if unavailable, validate the renderer-only change with focused tests and desktop web typecheck.

### UX problems found
- After the compact follow-up composer change, unfocused tiles still showed the same runtime footer detail as focused tiles, so the bottom chrome remained busier than the reading state needed.
- Non-ACP tiles kept model/provider labels visible even when the tile was not the active reading or reply target, which added scan noise without changing the next likely action.
- ACP tiles could show multiple footer badges at once, which made secondary runtime detail compete with transcript content and the newer compact follow-up affordance.

### Assumptions
- It is acceptable for unfocused, non-expanded tiles to defer some runtime detail until focus, because the tile header and transcript remain visible and the hidden details are secondary rather than task-blocking.
- It is acceptable to preserve context usage and step/status cues in compact footers, because those are the most actionable at-a-glance signals while an agent is running.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Add a compact footer state for unfocused, non-expanded tiles instead of showing the same metadata density everywhere.
- In that compact state, hide non-ACP model/provider text and collapse ACP session chrome into a single tooltip-backed badge, while keeping context usage plus step/status visible.
- Slightly soften the compact footer background so inactive tiles read as quieter without removing important state.
- This is better than removing footers entirely, because users still keep the most useful live-state cues while lower-priority detail yields to transcript space and hierarchy.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `shouldUseCompactTileFooter` for unfocused, non-expanded tiles.
- Used that compact state to soften the footer background, hide non-ACP model/provider text until focus, and request compact ACP badge rendering in tiled footers.
- Updated `apps/desktop/src/renderer/src/components/acp-session-badge.tsx` to support a compact single-badge mode with the same tooltip detail preserved behind hover.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in compact-footer behavior.
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.layout.test.ts` to remove a stale expectation for the already-removed `agentName` tile composer prop so the tile UX tests match current code.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts src/renderer/src/components/tile-follow-up-input.layout.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅
- Electron renderer inspection attempt via `electron_execute` failed because no inspectable Electron target was running with `--inspect`.

### Tradeoffs considered
- Keeping full model/provider and ACP badge detail visible in every tile preserves maximum information density, but it makes unfocused tiles look more active than they really are.
- Hiding all footer metadata in unfocused tiles would save more space, but it would also remove useful live-state cues like context pressure and step progress.
- Reworking the footer into a broader overflow or disclosure pattern could save more width, but it would add behavior and complexity beyond this small hierarchy-focused refinement.

### What still needs attention
- This compact footer treatment should still be validated in a live Electron session, especially with real sidebar width changes and drag/reorder interactions.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel width can trigger the same density pressure that compact tile chrome is trying to relieve.
- If tiles still feel busy after this, the next likely refinement is deciding whether unfocused transcript summaries or status badges should also soften slightly when another tile is active.

### Iteration 15 — let lone compare/grid tiles fill the available space
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: avoid awkward half-empty layouts when only one tile is visible but the user is still in `Compare` or `Grid`

### Areas inspected
- `tiling-ux.md` latest notes, especially the open follow-up about opportunistically expanding single visible tiles
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`

### Repro steps used
1. Review how `sessions.tsx` computes `visibleTileCount` and passes it into `SessionGrid`.
2. Trace `SessionTileWrapper` sizing to see how `Compare` and `Grid` behave when that count drops to `1`.
3. Compare width and height behavior for a lone tile against the existing goals around reducing awkward empty space and predictable full-width states.
4. Attempt a lightweight live Electron renderer inspection; if unavailable, validate the renderer-local change with focused tests and desktop web typecheck.

### UX problems found
- In `Compare` and `Grid`, a single visible tile still inherited multi-tile sizing rules, so it could sit in a half-width card with unused horizontal space.
- In `Grid`, the lone tile also kept the 2-row half-height target, which made the page look artificially sparse and short for the only visible session.
- Width resizing also remained conceptually misleading for that state, because narrowing the only visible tile mostly recreated avoidable gutters rather than a useful layout choice.

### Assumptions
- It is acceptable to keep the selected layout mode as `Compare` or `Grid` while a lone visible tile temporarily fills the row, because users usually want that mode restored automatically once another tile appears.
- It is acceptable for a lone visible tile in non-single layouts to use full height as well as full width, because there is no longer a competing tile that benefits from the denser half-height rhythm.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Treat `sessionCount === 1` as a temporary full-space fallback inside `SessionGrid`, even when the selected layout mode remains `Compare` or `Grid`.
- In that state, size the tile to the full available row and full available height so the sessions page no longer looks like a half-empty multi-column layout.
- Lock width resizing for the same state so the affordances continue to match the most useful layout behavior and do not encourage recreating awkward gutters.
- This is better than changing the selected layout mode automatically, because it fixes the visible awkwardness without making the toolbar state jump around when tiles appear or disappear.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionGridContext` now carries `sessionCount` into each tile wrapper.
- Updated the same file so `calculateTileWidth(...)`, `calculateTileHeight(...)`, and `shouldLockTileWidth(...)` treat a lone visible tile as a full-width, full-height state even when `Compare` or `Grid` remains selected.
- Kept the existing responsive stacked logic intact for multi-tile layouts while extending width-locking to the new single-visible-tile fallback.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`, `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`, and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new single-tile sizing contract.

### Verification
- `pnpm exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅
- Electron renderer inspection attempt via `electron_execute` failed because Electron was not running with `--inspect`.

### Tradeoffs considered
- Leaving lone tiles at multi-column width/height preserves stricter layout semantics, but it makes the sessions page feel visibly underused and harder to read.
- Automatically switching the toolbar state to `Single` when only one tile is visible would be explicit, but it would also make the layout controls feel unstable as sessions start, finish, or get dismissed.
- Expanding width but keeping `Grid` half-height would reduce some empty space, but it would still leave the only visible tile feeling arbitrarily short.

### What still needs attention
- This lone-tile fallback should still be validated in a live Electron session, especially while sessions appear/disappear and while sidebar width changes at the same time.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel resizing can trigger the same one-tile and stacked-width transitions.
- If the sessions toolbar still feels ambiguous in these transient states, a future pass could consider whether the current-layout chip should explicitly explain when `Compare` or `Grid` is temporarily showing a single expanded tile.

### Iteration 16 — retarget lone-tile fallback when visible tile count changes
- Date: 2026-03-07
- Scope: desktop tiled sessions
- Focus for this iteration: make the new lone-tile compare/grid fallback actually take effect as soon as the visible tile count changes, even when width and layout mode do not

### Areas inspected
- `tiling-ux.md` latest notes, especially the just-completed lone-tile fallback pass
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`

### Repro steps used
1. Re-read how `sessions.tsx` computes `visibleTileCount` and passes it into `SessionGrid`.
2. Trace the new lone-tile sizing math in `session-grid.tsx` and compare it with the effects that actually call `setSize(...)`.
3. Consider a transition where a second visible tile appears or disappears while the container width and selected layout stay unchanged.
4. Attempt a lightweight Electron renderer inspection; if no inspectable target exists, validate with focused renderer tests and desktop web typecheck.

### UX problems found
- The lone-tile fallback math existed, but the tile wrapper only reapplied size on reset, layout-mode change, initialization, or width change.
- That meant the UI could stay visually stuck in the previous footprint when the visible tile count changed on its own.
- The result was a brief but noticeable predictability gap right in the state transition the earlier fallback was meant to improve.

### Assumptions
- It is acceptable to retarget both width and height when the UI crosses the lone-visible-tile boundary, because that reflects a meaningful change in layout semantics rather than an incidental resize.
- It is acceptable to keep this retarget narrowly scoped to the one-tile fallback boundary, because moving from two tiles to three tiles should not wipe out deliberate sizing choices.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Keep the existing lone-tile sizing and width-lock behavior from Iteration 15.
- Add a dedicated session-count transition effect so tiles immediately retarget to the correct full-row or multi-tile footprint when the fallback toggles on or off.
- Leave the earlier width-only responsive reflow behavior intact for ordinary sidebar/window width changes.
- This is better than waiting for a later width or layout event to clean things up, because the current layout should become truthful as soon as the tile set changes.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` tracks whether the lone-visible-tile fallback is active and retargets both width and height when that state changes.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new session-count-driven retarget behavior.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ⚠️ fails on an unrelated pre-existing renderer error in `src/renderer/src/components/agent-progress.tsx` (`TS2448: Block-scoped variable 'hasErrors' used before its declaration`)

### Tradeoffs considered
- Leaving the fallback as pure sizing math is lower churn, but it leaves stale footprints visible until some unrelated event forces a reflow.
- Retargeting on every session-count change would be too aggressive, because multi-tile layouts should still preserve manual sizing when the count changes within the same general mode.
- Automatically switching the layout button to `Single` would be more literal, but it would blur the difference between a deliberate one-up mode and a temporary one-tile compare/grid state.

### What still needs attention
- This session-count transition should still be validated in a live Electron session once an inspectable renderer target is available.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel resizing can trigger the same one-tile and stacked-width transitions.
- If the sessions toolbar still feels ambiguous in these transient states, a future pass could consider whether the current-layout chip should explicitly explain when `Compare` or `Grid` is temporarily showing a single expanded tile.

## Iteration 18 - Clarify when compare/grid temporarily expands a single visible tile

### Area inspected
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx` (verification-only cleanup after typecheck surfaced a non-tiling issue)

### Repro steps reviewed
1. Open the sessions page with `Compare` or `Grid` selected.
2. Reduce the visible tile set to one session by snoozing, filtering, or temporarily leaving only a pending tile.
3. Observe that the remaining tile intentionally expands to fill the available space.
4. Check the current-layout chip in the toolbar.

### UX problem found
- The selected layout mode correctly remains `Compare view` or `Grid view`, but the chip description could still read like the steady-state layout (`Side by side` / `More at once`) even when only one tile is visible.
- That made an adaptive, intentional fallback feel suspicious, as if the layout controls and the canvas disagreed.

### Assumptions
- The chosen layout mode should remain selected even when only one tile is currently visible, because the user intent is still compare/grid and the original layout should resume automatically when another visible tile returns.
- A truthful description inside the existing current-layout chip is enough; adding another badge or control would add visual weight without improving control.

### Decision and rationale
- Keep the primary layout label (`Compare view` / `Grid view`) so the selected mode remains stable.
- Swap the chip description to an adaptive single-visible state (`Expanded for one visible session`, compact: `One visible`) whenever compare/grid is temporarily rendering a lone visible tile.
- This is better than silently switching to `Single view`, because that would imply the user's chosen layout mode changed, which is not what happened.

### Code changes
- In `apps/desktop/src/renderer/src/pages/sessions.tsx`:
  - Added a dedicated adaptive state for `!isFocusLayout && visibleTileCount === 1`.
  - Introduced explicit long/compact copy for the temporary one-visible-tile state.
  - Reused the current-layout chip's existing adaptive-description rendering path so the label stays stable while the description stays truthful.
- In `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`:
  - Added coverage that locks in the new one-visible adaptive description behavior.
  - Updated the responsive-layout source assertions to reflect the shared adaptive-description path.
- In `apps/desktop/src/renderer/src/components/agent-progress.tsx`:
  - Moved the derived `hasErrors` constant earlier in the component after verification exposed a typecheck ordering issue unrelated to the tiling change.

### Verification
- `electron_execute` lightweight renderer inspection attempt could not proceed because there is no inspectable Electron renderer target in this environment.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Leaving the description unchanged is lower churn, but it leaves the toolbar sounding incorrect at the exact moment the layout is adapting correctly.
- Automatically switching the selected mode to `Single view` would be more literal, but it would falsely suggest that the user changed modes rather than temporarily losing visible peers.
- Adding a separate explanatory badge would make the state explicit, but it would cost more horizontal space in an already dense toolbar.

### What still needs attention
- The sessions toolbar remains fairly dense when reorder hints, focus-browse controls, and layout-state chips all appear together on narrower widths.
- Floating-panel resizing should still be reviewed against tiled mode at narrower sidebar widths to make sure panel drag affordances do not crowd or visually compete with tile resize affordances.

## Iteration 19 - Align tile reordering with the visible drag handle

### Area inspected
- `tiling-ux.md` latest notes to avoid repeating the recent lone-tile sizing passes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger entries and choose a fresh area that had not been the focus of the last few iterations.
2. Inspect how `SessionTileWrapper` exposes reordering and compare that with the visible reorder chip above each tile.
3. Trace the header-level reorder hint in `sessions.tsx` to see what behavior the UI currently promises.
4. Attempt a lightweight Electron renderer inspection; if no inspectable target exists, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The sessions page showed a dedicated reorder chip above each tile, but the code made the entire tile draggable.
- That mismatch made the interaction less predictable: the UI implied a handle-based action while the implementation allowed drag starts from anywhere inside the tile.
- Whole-tile dragging also increases the risk of accidental reorders while users are reading, selecting, or interacting with tile content.

### Assumptions
- It is acceptable to make the visible reorder chip the sole drag source because the existing UI already frames that chip as the reorder affordance.
- It is acceptable to keep the drop-target and ordering logic unchanged because the main issue is where dragging begins, not how the destination is resolved.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Move drag initiation from the whole tile wrapper to the visible reorder chip.
- Update the sessions-page hint copy so it explicitly says to drag the reorder handle, matching the new behavior.
- Keep the persistent chip and drop-target cue intact so discoverability remains strong while accidental drags become less likely.
- This is better than leaving whole-tile dragging in place because it aligns the interaction model with the visible affordance instead of asking users to guess which parts of the tile are safe to manipulate.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` no longer marks the whole tile as draggable.
- Updated the same file so the persistent reorder chip now acts as the real drag handle with grab/grabbing cursor feedback and an explicit reorder label.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the toolbar hint now says users should drag the reorder handle, not any part of the tile.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new handle-first drag contract.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Keeping whole-tile dragging is lower effort, but it preserves the core mismatch between the visible affordance and the actual drag zone.
- Adding more explanatory copy without changing behavior would improve discoverability slightly, but it would not reduce accidental drags.
- A larger keyboard-accessible reorder system could improve accessibility further, but that is a broader follow-up; this pass targets the smallest effective fix to the current pointer interaction.

### What still needs attention
- The new handle-only drag behavior should still be validated in a live Electron session, especially with real tile content interactions like text selection and follow-up controls.
- Keyboard-accessible reordering remains a possible future improvement if tiled session management becomes more reorder-heavy.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel resizing can still affect whether tiled content feels stable or cramped.

## Iteration 20 - Persist layout choice across sessions-page remounts

### Area inspected
- `tiling-ux.md` latest notes to avoid repeating the recent drag/resize affordance passes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- local renderer persistence patterns in nearby desktop components

### Repro steps reviewed
1. Re-read the latest ledger and choose an area that had not been the focus of the last few iterations.
2. Inspect how `sessions.tsx` initializes `tileLayoutMode` and `previousLayoutModeRef`.
3. Check whether the selected layout survives a sessions-page remount or app reopen, especially after entering `Single view` and then leaving it again.
4. Attempt a lightweight Electron renderer inspection; if no inspectable target exists, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The sessions page still initialized `tileLayoutMode` from a hardcoded default (`Compare`), so users could lose their chosen layout when the page remounted or the app reopened.
- That made layout switching feel less trustworthy because the toolbar state did not remember a deliberate choice like `Grid` or `Single`.
- The same gap also weakened `Single view` predictability across remounts, because the last non-single layout used for restore-on-exit was only kept in memory.

### Assumptions
- It is acceptable to persist this preference in renderer `localStorage`, because the layout mode is a local UI choice similar to other desktop renderer preferences and does not need a main-process config contract.
- It is acceptable to keep the persistence scoped to the sessions page rather than per workspace or per sidebar width, because the current problem is loss of an intentional choice, not the lack of more advanced context-aware defaults.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Persist both the current selected layout and the previous non-single layout used when leaving `Single view`.
- Restore those values on mount so the sessions toolbar, the rendered tile layout, and the `Single view` exit path all pick up where the user left them.
- Keep the existing layout-switching behavior otherwise unchanged, including the tile-size reset on layout changes.
- This is better than always defaulting back to `Compare`, because predictable restoration reduces layout ambiguity without adding any new controls or abstractions.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add local storage helpers for the current tile layout and the previous non-single layout.
- Initialized `tileLayoutMode` and `previousLayoutModeRef` from that persisted preference instead of hardcoded `Compare` defaults.
- Updated the layout selection handler to persist the selected mode alongside the restore target for exiting `Single view`.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new layout-persistence wiring.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Keeping layout choice ephemeral is lower effort, but it makes the tiled workflow feel reset-prone and less intentional.
- Persisting only the current layout would help partly, but it would still leave `Single view` restore behavior ambiguous after a remount.
- Moving this preference into shared config would make it more globally explicit, but that would add unnecessary IPC and persistence scope for a renderer-local UX preference.

### What still needs attention
- This persistence should still be validated in a live Electron session to confirm the restored layout feels correct during actual route changes and app relaunches.
- A future pass could decide whether tile collapse state or focused-session state should also restore selectively, or whether that would feel too sticky between sessions.
- The floating panel vs tiled-session width competition remains a strong next candidate because width pressure still influences how useful each restored layout feels.

## Iteration 21 - Remove duplicate single-view wording from the sessions header

### Area inspected
- `tiling-ux.md` latest notes, especially the still-open toolbar density follow-up
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps reviewed
1. Review the current sessions header while `Single view` is active, including the active-layout chip, focused-session summary chip, and previous/next pager.
2. Compare which pieces of that header communicate unique information versus repeated wording.
3. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- In `Single view`, the current-layout chip already says `Single view`, but the adjacent focused-session chip repeated that same wording again.
- That duplication added wrap pressure right next to the previous/next pager without giving users new information.
- The extra repeated label was most likely to crowd the header in the exact narrow states where focused browsing should feel calm and obvious.

### Assumptions
- It is acceptable for the secondary chip to become session-centric instead of layout-centric, because the active-layout chip already communicates that the page is in `Single view`.
- It is acceptable to hide the current session label on the tighter breakpoint while keeping the `N of M` position badge visible, because the pager and tooltip still preserve orientation when horizontal space is scarce.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Keep the existing `Single view` layout chip and pager behavior unchanged.
- Simplify the focused-session context chip so it shows position first (`N of M`) and only adds the session label when enough width is available.
- Replace the repeated `Single view` / `Only ...` wording with a more direct session-centric cue (`Showing ...`) plus a compact fallback (`Browsing sessions`) when there is no derived label.
- This is better than keeping both chips layout-centric because it removes duplicate chrome while preserving the information users actually need to stay oriented.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the focused-session chip no longer repeats the `Single view` label or icon already shown in the active-layout chip.
- Kept the position badge always visible, moved the session name behind a wider-breakpoint label, and added a simple fallback copy path when no session title is available.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new session-centric summary treatment.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Leaving the chip unchanged is lower effort, but it keeps redundant layout wording right beside the pager where space is already limited.
- Merging the chip into the pager could save even more space, but it would be a larger structural change than this local density improvement requires.
- Removing the focused-session chip entirely would reduce chrome further, but it would also throw away useful orientation like `N of M` and the current session title.

### What still needs attention
- This refined `Single view` header should still be validated in a live Electron session, especially while resizing the sidebar and stepping through sessions with the pager.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel width can still make the same header controls feel cramped.
- If the sessions header is still too busy after this, the next likely pass is deciding whether the reorder hint or layout-description suffix should collapse first at the tightest widths.

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

## Iteration 23 - Compress the layout-button group at the tightest header widths

### Area inspected
- `tiling-ux.md` latest notes after the reorder-hint priority pass
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`

### Repro steps reviewed
1. Review the current sessions header once the measured grid width crosses into the existing compact and very-compact thresholds.
2. Compare the space used by the layout-state chip against the `Compare / Grid / Single` button group.
3. Check whether the layout buttons still keep their full text labels even after the header is already in its tightest state.
4. Validate the intended compression with focused sessions-header tests and desktop web typecheck.

### UX problem found
- The sessions header already collapsed some helper text at compact widths, but the layout-button group still kept full `Compare`, `Grid`, and `Single` labels at the tightest threshold.
- Those labels compete directly with the current-layout chip, pager, and other remaining high-priority header chrome.
- At that point the icons, active state, tooltip text, and ARIA labels are already enough to preserve layout-switching clarity.

### Assumptions
- It is acceptable for the layout buttons to become icon-only at the very-compact header width because each button already has a distinct icon, active styling, tooltip, and accessible label.
- It is acceptable to keep the full labels on normal and compact widths; the extra compression is only needed at the tightest measured state.
- This remains desktop-specific; there is no equivalent mobile tiled-sessions toolbar that needs the same change.

### Decision and rationale
- Keep the existing three direct-select layout buttons and all layout-switching behavior unchanged.
- At the very-compact header width, hide the button text labels and tighten the horizontal padding so the control group keeps fitting without crowding higher-value context.
- This is better than shrinking the layout-state chip first because the chip explains the currently rendered adaptive state, while the button group can stay understandable through icons and tooltips.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showLayoutButtonLabels` from the existing very-compact header threshold.
- Updated the same file so layout buttons use text labels with normal padding in roomier states, then switch to icon-only with tighter padding at the tightest width.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new icon-only tight-width behavior and padding logic.

### Verification
- Live Electron inspection was not rerun in this pass because an earlier attempt in this workflow already confirmed there is no inspectable renderer target available with `--inspect`.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Keeping the text labels visible at every width is lower churn, but it spends scarce horizontal space on information that the icons and tooltips already convey.
- Compressing the layout-state chip further first would free some room, but it would also weaken the more important explanation of what the canvas is currently doing.
- Replacing the segmented buttons with a dropdown would save even more space, but it would add interaction cost to one of the most common tiled-layout actions.

### What still needs attention
- These two header-density passes should still be validated in a live Electron session, especially while resizing the sidebar repeatedly across the compact and very-compact thresholds.
- The floating panel vs tiled-session width competition remains a strong next candidate because panel resizing can push the same header into its compact states.
- If layout switching still feels cramped after this, the next likely pass is deciding whether the active-layout chip and button group should share a more unified compact treatment.

## Iteration 22 - make sessions header density follow the actual tiled width

### Area inspected
- `tiling-ux.md` latest notes, especially the follow-up about header density under width pressure
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`

### Repro steps reviewed
1. Review the sessions header chips and hints while multiple tiles are visible and while `Single view` is active.
2. Compare the current responsive behavior with sidebar/panel-driven width pressure rather than only full-window breakpoints.
3. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The header still depended on viewport breakpoints like `sm` and `md`, so its density did not always match the actual width available to the sessions surface.
- When the sidebar or floating panel squeezed the sessions page, the layout-description suffix, focused-session label, and reorder hint could all remain visible longer than they should.
- That made the header more likely to wrap or feel crowded in the same constrained states where tiled browsing most needs to stay calm and legible.

### Assumptions
- It is acceptable to use measured sessions-grid width as a proxy for header width because the chips and controls live in the same content region and the main issue is local density, not exact pixel-perfect sync.
- It is acceptable to hide redundant secondary text before hiding unique guidance, because the active layout label and tooltips still preserve meaning when space is limited.
- Focused renderer tests and desktop web typecheck are sufficient for this pass because the change is renderer-local and `electron_execute` could not attach to a live inspectable Electron target.

### Decision and rationale
- Introduce small width thresholds based on the measured sessions area, not the whole window.
- Hide the layout-description suffix first when the tiled area becomes compact, keep a short adaptive label only in the middle range, and collapse the reorder hint to icon-only in the tightest range.
- Apply the same measured-width rule to the focused-session chip so `Single view` keeps the useful `N of M` badge while dropping the longer `Showing ...` text earlier.
- This is better than relying only on viewport breakpoints because the cramped states are often created by sidebar/panel competition inside a still-wide desktop window.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive compact/tight header states from `sessionGridMeasurements.containerWidth`.
- Made the current-layout chip collapse its descriptive suffix based on measured tiled width rather than `sm` breakpoints.
- Made the focused-session chip keep the position badge but drop the longer session label once the tiled area becomes compact.
- Made the reorder hint degrade from `Drag to reorder` to `Reorder`, then to icon-only, based on the same measured-width thresholds.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the width-aware density rules.

### Verification
- `electron_execute` renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Keeping the old `sm`/`md` behavior is simpler, but it responds to the wrong dimension for tiled workflows because the sessions area can shrink independently of the full window.
- Hiding the reorder hint before the layout-description suffix would save space too, but the reorder hint carries more unique information than the layout chip's secondary copy.
- Rebuilding the whole header into a more adaptive layout could help further, but that would be a broader UI refactor than this local density pass requires.

### What still needs attention
- This width-aware header behavior should still be validated in a live Electron session, especially while changing sidebar width and panel width together.
- The floating panel vs tiled-session width competition remains the clearest next candidate now that the sessions header reacts better to constrained space.
- If the header still feels busy after live validation, the next likely pass is whether the pager group or reorder hint should relocate or merge at the tightest widths.

## Iteration 23 - Keep single-view browsing near the current position when a tile disappears

### Area inspected
- `tiling-ux.md` latest notes to avoid repeating the recent header-density passes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/stores/agent-store.ts` (focus state contract only; no changes)

### Repro steps reviewed
1. Review how `sessions.tsx` chooses the visible tile while `Single view` is active.
2. Trace what happens when the currently shown session disappears because it is snoozed, dismissed, or otherwise leaves the visible focusable set.
3. Compare that fallback with the intended feel of previous/next browsing in `Single view`.
4. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- `Single view` correctly showed one tile at a time, but if the current session disappeared the code always fell back to the first visible session.
- That made focused browsing feel jumpy because the user could be reading or stepping through later sessions and suddenly get snapped back to the top of the list.
- The jump was especially awkward after recent pager improvements, because the UI now implies a stable browsing sequence rather than a reset-prone one.

### Assumptions
- It is acceptable to treat the previous visible ordering as the best fallback signal, because `Single view` already uses the existing tile order as its browsing sequence.
- It is acceptable to choose the session now occupying the removed tile's former index, falling back to the previous neighbor only when the removed session was last, because that best preserves the user's place without adding new controls or persistence.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Keep the current focused session whenever it is still visible.
- When it disappears in `Single view`, resolve the next visible session from the prior focusable ordering instead of always jumping to the first tile.
- Sync the renderer store to that derived fallback so the pager, summary chip, and focus state all stay aligned.
- This is better than the old first-item fallback because it preserves browsing continuity and makes `Single view` feel more like stepping through a sequence than restarting it after every removal.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add a small `getFocusLayoutFallbackSessionId(...)` helper based on the previous focusable session ordering.
- Tracked the previous focusable session list with a ref so disappearing sessions can resolve to the nearest surviving neighbor.
- Updated the same file so `maximizedSessionId` uses the new neighbor-preserving fallback and syncs the store's `focusedSessionId` to the resolved session while `Single view` is active.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new single-view fallback behavior.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Keeping the old first-visible fallback is simpler, but it makes focused browsing feel reset-prone and harder to predict after snoozing or dismissing the current tile.
- Remembering a richer browsing history stack could preserve intent even more precisely, but it would add more state than this local predictability fix needs.
- Automatically wrapping to the start/end of the list after removals would avoid dead ends, but it would make the browsing sequence feel less spatially grounded than staying near the removed tile's position.

### What still needs attention
- This neighbor-preserving fallback should still be validated in a live Electron session, especially while dismissing, snoozing, and stepping through sessions with the `Single view` pager.
- The floating panel vs tiled-session width competition remains a strong next candidate because width pressure still changes how stable and useful each layout feels.
- If `Single view` still feels jumpy in practice, a future pass could decide whether focus should also prefer the most recently interacted tile when new sessions arrive mid-browse.

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

## Iteration 27 - Let narrow tile footers separate metadata from progress state

### Area inspected
- `tiling-ux.md` latest notes, to continue the open in-tile density thread from Iteration 26 instead of revisiting the sessions header or panel chrome again
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps reviewed
1. Re-read the ledger and intentionally pick the footer-density follow-up that was still open after the narrow composer pass.
2. Inspect the tiled `AgentProgress` footer, especially how ACP/model/context metadata competes with the trailing `Step` / completion status.
3. Compare the current footer behavior in wide vs narrow tiles and check whether it reacts to measured tile width or only to focus/expanded state.
4. Attempt a lightweight Electron renderer inspection before changing anything; if unavailable, validate with focused tests and desktop web typecheck.

### UX problem found
- The tile footer already wrapped, but its compactness logic was tied mainly to focus/expanded state rather than actual tile width.
- In narrow tiles, the trailing `Step` / completion status could wrap onto an incidental extra line while the metadata row above continued to behave like a wide layout.
- That made the footer feel loosely organized right above the follow-up input, especially in stacked or sidebar-constrained layouts where a tile can be narrow even while focused.

### Assumptions
- It is acceptable to reuse the tile's existing measured-width signal for the footer instead of introducing a second width observer, because the footer is part of the same tile density problem as the header.
- It is acceptable to hide lower-priority footer metadata such as model info in narrow focused tiles, because preserving a readable footer hierarchy is more important than showing every secondary detail under width pressure.
- No matching mobile change is required for this pass because the behavior changed here is the desktop renderer's tiled `AgentProgress` variant.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this local pass because no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Treat narrow tiles as compact in the footer even when they are focused or expanded, so low-priority footer details do not keep crowding the row just because the tile is active.
- Give the trailing status/progress line its own deliberate row in narrow tiles with a subtle divider, instead of relying on accidental flex wrapping.
- This is better than removing more footer information outright because it improves hierarchy and predictability with a small local layout change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so narrow tiles now opt into compact footer behavior via the existing measured tile-width signal.
- Added a `shouldStackTileFooterLayout` narrow-width rule in the same file so footer metadata stays on the first row while `Step` / completion status moves onto a dedicated second row with a subtle top divider.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the measured-width compact footer rule and the dedicated narrow footer status row.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the footer to wrap incidentally is simpler, but it keeps the narrow-state hierarchy feeling accidental and makes the trailing status line easy to orphan visually.
- Removing more metadata entirely would reduce clutter further, but it would also throw away useful context before trying a smaller organization-only fix.
- Creating a footer-specific width observer could tune the threshold more precisely, but it would add complexity without clear benefit over the tile's existing measured-width signal.

### What still needs attention
- This footer compaction should still be validated in a live Electron tiled session while changing layout mode, sidebar width, and focus state together.
- The floating panel versus tiled-session width competition is still a root cause worth revisiting now that more of the tile chrome adapts gracefully under narrow widths.
- If narrow tiles still feel crowded after this, the next likely in-tile follow-up is a measured-width pass on collapsed-state summaries or message-queue/footer interactions.

## Iteration 28 - Make collapsed tiles actually collapse secondary chrome

### Area inspected
- `tiling-ux.md` latest notes, specifically the open follow-up about collapsed-state summaries and message-queue/footer interactions
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/components/message-queue-panel.tsx` for the compact queue treatment already available in tiles

### Repro steps reviewed
1. Re-read the latest ledger to avoid revisiting the recent header-density and narrow-footer passes.
2. Inspect the tile-variant render path in `AgentProgress`, especially what stays visible when `isCollapsed` is true.
3. Compare the actual collapsed behavior with the intended purpose of collapsing a tile in a dense tiled workflow.
4. Attempt a lightweight Electron renderer inspection before and after the change; if unavailable, validate with focused renderer tests and desktop web typecheck.

### UX problem found
- The tile transcript, summary tab, and footer already respected `isCollapsed`, but the queued-messages panel and follow-up composer still rendered below the collapsed header.
- That meant collapsing a tile did not reliably reclaim vertical space or reduce visual competition, because two footer-like sections could still linger underneath the supposedly collapsed card.
- The remaining chrome also made collapse feel less intentional: users were hiding the content body, but not the secondary actions that visually belong to that body.

### Assumptions
- It is acceptable for collapsed tiles to hide the full queue panel and follow-up composer, because collapsing a tile is an explicit request to reduce density rather than keep all actions continuously available.
- It is acceptable to preserve awareness with a compact summary strip instead of full controls, because users can still expand the tile to act while keeping the collapsed state calmer and more predictable.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented Electron inspection attempt are sufficient for this pass because the change is renderer-local and no inspectable Electron target was running with `--inspect`.

### Decision and rationale
- Treat collapsed tiles as a true compact state: hide the full queue panel and full follow-up composer while collapsed.
- Replace those lingering sections with one compact summary strip that reuses the existing collapsed response-preview logic when available, otherwise falls back to queue/summary/session-status cues.
- Keep the strip informative but light by showing one primary summary line plus small queue/status badges, instead of stacking multiple footer blocks.
- This is better than leaving the old behavior in place because collapsing a tile now reliably reduces height and ambiguity without removing situational awareness.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive a `collapsedTileSummary` from the latest user response preview, queued-message state, summary availability, follow-up initialization, or current session state.
- Added a compact collapsed summary strip in the same file with a primary summary line, queued-message badge, and status pill.
- Updated the tile variant so the full `MessageQueuePanel` and `TileFollowUpInput` only render while the tile is expanded.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new collapsed-summary behavior and the gating of queue/reply chrome behind `!isCollapsed`.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Hiding everything except the header would reclaim even more space, but it would remove too much awareness about queued work or recent output.
- Keeping the full queue/composer visible is simpler, but it makes the collapsed state feel visually inconsistent and undermines its density-saving purpose.
- Moving queue/reply actions into new always-visible collapsed controls could preserve actionability, but it would add more chrome to the very state that should feel calmer.

### What still needs attention
- This collapsed summary strip should still be validated in a live Electron session, especially while collapsing focused vs unfocused tiles and while queued messages are paused or actively waiting.
- The floating panel versus tiled-session width competition remains open, particularly whether panel width should trigger clearer sessions-page feedback before layouts feel cramped.
- If collapsed tiles still feel noisy in practice, the next likely pass is whether the header itself should expose a clearer expanded/collapsed state cue or a stronger collapsed-height affordance.

## Iteration 28 - Give narrow tile footers a clearer status cue

### Area inspected
- `tiling-ux.md` latest notes, specifically the open tile-footer follow-up from Iteration 27
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/mobile/src` equivalent-surface check via `rg` (no matching tiled-session/footer surface found)

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the still-open tile-footer density follow-up instead of revisiting the sessions header again.
2. Inspect the tile footer in `AgentProgress`, especially the relationship between metadata on the left and the trailing `Step ...` / completion state on narrow tiles.
3. Attempt a lightweight Electron renderer inspection before editing; `electron_execute` could not attach because no inspectable Electron target was running with `--inspect`.
4. Compare whether the footer compactness and status treatment react to actual tile width or only to focus/expanded state.

### UX problem found
- The tile footer already wrapped and, in narrow states, could place status on its own row, but the trailing `Step ...` / `Complete` text still rendered like plain loose copy rather than a deliberate status cue.
- That made the footer feel visually under-structured right above the follow-up composer, especially in narrow tiles where the divider row often contained only a single bare label.
- The footer also stacked whenever the tile was compact, even if there was no metadata worth separating from the status row.

### Assumptions
- It is acceptable to keep the same footer information and improve only its hierarchy, because the main issue here is readability and predictability rather than missing data.
- It is acceptable to use the tile's measured compact state as the primary trigger, because the crowding issue is caused by local tile width rather than overall window width.
- This change remains desktop-only; a repo search under `apps/mobile/src` found no equivalent tiled-session footer surface to update.

### Decision and rationale
- Keep the existing metadata set and narrow-footer stacking behavior in principle, but make stacking conditional on there actually being metadata to separate from the status row.
- Derive a single `tileFooterStatusLabel` and render it as a compact pill, with an explicit `Status` lead-in only in the stacked narrow state.
- This is better than leaving the footer as loose text because it preserves the current information density while making the status feel intentional, scannable, and visually anchored above the follow-up area.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `showTileModelInfo`, `showTileContextMeter`, `hasTileFooterMetadata`, and `tileFooterStatusLabel` directly inside the tile variant.
- Updated the same file so narrow footer stacking now only happens when there is actual metadata to separate, and the trailing status renders as a compact bordered pill instead of plain text.
- Added a subtle `Status` eyebrow label for the stacked narrow-footer row to clarify the hierarchy without adding always-on chrome in wider states.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new compact-footer gating, derived status label, and pill-style status treatment.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `rg -n "variant=\"tile\"|TileFollowUpInput|SessionGrid|Single view|Compare view|sessions layout" apps/mobile/src` (cwd repo root) returned no matches, so no equivalent mobile tiled-footer change was needed.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the current stacked footer alone would be the lowest-risk option, but it keeps the status row visually weaker than the metadata and follow-up composer around it.
- Hiding more footer metadata in narrow tiles would reduce crowding further, but it would also remove useful context before first improving hierarchy with a smaller UI-only change.
- A larger footer redesign could merge status, queue, and follow-up areas more tightly, but that would be broader than this local readability pass needed to be.

### What still needs attention
- This clearer narrow-footer status treatment should still be validated in a live Electron session while resizing tiles, changing layout mode, and toggling focus/maximize state together.
- The floating panel versus tiled-session width competition is still a root pressure source, especially when the panel width pushes tiles around the compact threshold.
- If narrow footers still feel busy in practice, a future pass could decide whether context usage deserves a compact text label or a stronger adaptive treatment alongside the status pill.

## Iteration 29 - Make collapsed tile headers communicate state before users guess

### Area inspected
- `tiling-ux.md` latest notes, specifically the open follow-up from the collapsed-tile pass about giving the header a clearer collapsed/expanded cue
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/package.json` to check whether a lightweight inspectable Electron run was practical before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally avoid revisiting the recent narrow-footer and follow-up-composer passes.
2. Inspect the tile header in `AgentProgress`, especially what makes a collapsed tile look different before the user clicks into the collapsed summary strip.
3. Attempt a lightweight live desktop check by launching `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222`, then try `electron_execute` before changing anything.
4. Compare the current collapsed cue with the existing collapsed summary strip to see whether the header itself still leaves too much ambiguity.

### UX problem found
- Collapsed tiles already had a calmer summary strip, but the header itself still relied mostly on the chevron icon to explain state.
- That makes the tile easy to misread as merely shorter rather than intentionally collapsed, especially when several tiles are stacked and the summary strip still contains useful content.
- The header also kept its bottom border while the collapsed summary strip drew its own top border, which made the collapsed seam feel a little heavier than necessary.

### Assumptions
- It is acceptable to add a small always-visible collapsed-state chip only while the tile is collapsed, because the problem is state clarity and discoverability rather than missing controls.
- It is acceptable to make the collapsed header slightly calmer by removing the redundant divider and nudging the background, because this is a local visual hierarchy improvement rather than a behavior change.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented live Electron inspection attempt are sufficient for this pass because `electron_execute` still could not attach to a CDP target after launching the dev app with an inspect argument.

### Decision and rationale
- Add a subtle `Collapsed` state pill directly in the tile header action row, so users can identify the state without inferring it from the chevron alone.
- Make the header border conditional so collapsed tiles rely on the summary strip's divider instead of showing a heavier double seam.
- Add `aria-expanded` to the collapse toggle so the control communicates the content state more explicitly to assistive tech.
- This is better than adding more controls or text because it improves clarity with one small, local cue while keeping the header compact.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so the tile header now conditionally applies its divider only while expanded and slightly deepens the collapsed header background.
- Added a subtle `Collapsed` chip in the same file's header action row, with a tooltip explaining that clicking the header expands the tile.
- Added `aria-expanded={!isCollapsed}` to the collapse/expand button in the tile header.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the conditional header border/background treatment, the collapsed-state chip, and the toggle accessibility state.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` launched the desktop dev app, but `electron_execute` still failed to list CDP targets, so no live renderer inspection was available for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the header alone would be the smallest possible change, but it keeps collapsed state too dependent on users noticing icon direction and height differences.
- Adding a longer explanatory subtitle in the header would make the state even clearer, but it would also add more text noise to already dense tiles.
- Introducing a new dedicated collapse control row would separate the concept more strongly, but that would work against the goal of making collapse feel lighter and more compact.

### What still needs attention
- This collapsed-header cue should still be validated in a live Electron session while collapsing focused and unfocused tiles in both compare and single-view workflows.
- The floating panel versus tiled-session width competition remains open, especially whether panel width should trigger earlier feedback before tile layouts feel cramped.
- If collapsed tiles still feel ambiguous in practice, the next likely follow-up is whether the collapsed summary strip itself should expose a clearer focus/expand affordance when several tiles are stacked closely.

## Iteration 29 - Clarify tile collapse vs Single view actions

### Area inspected
- `tiling-ux.md` latest notes, specifically the open follow-up about whether collapsed tiles still need a clearer expanded/collapsed state cue
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps reviewed
1. Re-read the ledger and intentionally choose a local tile-action clarity pass instead of reopening broader panel-width behavior.
2. Inspect the tile header controls and collapsed-state fallback copy in `AgentProgress`, especially the collapse button title, the one-up/maximize button label, and the final collapsed-summary fallback.
3. Attempt a lightweight Electron renderer inspection before editing; `electron_execute` still could not attach because no inspectable Electron target was running with `--inspect`.
4. Compare the tile wording against the sessions toolbar language (`Single view`) to see where tile-level actions still used panel-centric or generic phrasing.

### UX problem found
- The tile collapse toggle still used `Expand panel` / `Collapse panel`, which is misleading inside a tiled session card because the user is not manipulating the floating panel.
- The tile one-up action still said `Show only this session`, which was understandable but did not match the sessions toolbar's established `Single view` terminology.
- The collapsed-state fallback `Expand to continue` was slightly too generic once the UI now has both tile expansion and `Single view` as separate concepts.

### Assumptions
- It is acceptable to fix this iteration purely through tile-level copy and accessibility labels, because the interaction mechanics already behave correctly and the issue is clarity, not capability.
- It is acceptable to align the tile action with `Single view`, because that wording is already established elsewhere in the sessions UI and reduces cross-surface terminology drift.

### Decision and rationale
- Keep the existing tile actions and layout behavior unchanged.
- Rename the tile collapse button to `Expand tile details` / `Collapse tile details` so it describes the actual scope of the action.
- Rename the one-up tile action to `Show this session in Single view` so the tile affordance matches the sessions toolbar language.
- Update the final collapsed-summary fallback to `Expand tile to continue` so collapsed tiles no longer use ambiguous expand wording.
- This is better than adding new labels or more permanent chrome because it reduces ambiguity without increasing tile density.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so the tile collapse button now uses tile-specific `title` and `aria-label` copy instead of panel terminology.
- Updated the same file so the tile's one-up/maximize affordance now says `Show this session in Single view`.
- Updated the collapsed-state fallback summary in the same file from `Expand to continue` to `Expand tile to continue`.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new tile-collapse wording, `Single view` phrasing, and collapsed-summary copy.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the old strings in place is lower churn, but it preserves a real scope mismatch between tile actions and panel actions.
- Renaming everything around maximize/focus again at the sessions-toolbar level would be broader, but this iteration only needed to fix the remaining tile-local mismatch.
- Adding visible text labels next to the icons would improve discoverability further, but it would also add repeated chrome to a header that has already needed multiple density passes.

### What still needs attention
- This tile-action wording pass should still be validated in a live Electron tiled session, especially while collapsing a tile and then using the one-up action so the distinction feels clearer in practice.
- The floating panel versus tiled-session width competition remains open for a deeper behavior pass now that the tile-local language is more consistent.
- If collapsed tiles still feel ambiguous after live validation, a future pass could decide whether the header needs a stronger persistent expanded/collapsed state cue beyond improved copy.

## Iteration 30 - Give Single view a clear path back to the previous layout

### Area inspected
- `tiling-ux.md` latest notes, specifically the still-open maximized-vs-grid predictability theme rather than another tile-copy-only pass
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/mobile/src` equivalent-surface check via `rg` (no matching sessions-layout surface found)

### Repro steps reviewed
1. Re-read the ledger and intentionally choose a not-recently-investigated transition problem: how users exit `Single view` after entering it from a tile or the toolbar.
2. Inspect `sessions.tsx` to compare how entering `Single view` works (`handleMaximizeTile`, persisted previous layout) versus how leaving it is communicated in the header.
3. Attempt a lightweight Electron renderer inspection before editing; `electron_execute` still could not attach because no inspectable Electron target was running with `--inspect`.
4. Review the existing layout and focus tests to confirm that previous-layout restoration already existed in code, but only as implicit behavior rather than an explicit affordance.

### UX problem found
- `Single view` already remembered the previous non-single layout, but the header did not expose that recovery path directly.
- Users could click `Compare` or `Grid`, but they had to remember which layout they came from, which makes the maximized-vs-grid transition feel less predictable than it should.
- That mismatch was especially noticeable after entering `Single view` from a tile action, where the mental model is closer to “zoom into this, then go back” than “pick a new global layout from scratch.”

### Assumptions
- It is acceptable to keep the underlying layout-state model unchanged and improve only the exit affordance, because the stored previous-layout behavior already works correctly.
- It is acceptable to add one more compact header control in `Single view`, because it appears only in that mode and directly reduces ambiguity in a high-value transition.
- This is desktop-only; a quick `rg` check under `apps/mobile/src` found no equivalent sessions-layout surface that needed the same change.

### Decision and rationale
- Keep the existing direct-select layout buttons unchanged.
- Add a small contextual restore button in `Single view` that returns to the remembered previous multi-tile layout (`Compare` or `Grid`).
- Label it as `Back to …` on roomier headers and fall back to icon-only on very compact widths, so the affordance stays explicit without reopening the header-density problem.
- This is better than making the active `Single` button toggle back to the previous layout, because a dedicated restore affordance is more discoverable and preserves the existing direct-select semantics of the layout group.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `restoreLayoutMode` / `restoreLayoutOption` from the already-persisted `previousLayoutModeRef` while `Single view` is active.
- Added a `handleRestorePreviousLayout` callback in the same file and surfaced it as a compact header button with `Return to …` accessibility text.
- Made the restore affordance adapt to header density by showing `Back to Compare` / `Back to Grid` labels only when there is enough room.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new explicit restore path.

### Verification
- `electron_execute` lightweight renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `rg -n "Single view|Compare view|Session tile layout|tileLayoutMode|Show one session at a time|Compare sessions side by side" apps/mobile/src` (cwd repo root) returned no matches, so no equivalent mobile update was needed.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving exit-from-`Single view` implicit is lower churn, but it keeps a real predictability gap in the maximized-vs-grid workflow.
- Turning the active `Single` button into a toggle-back control would save space, but it would weaken the now-clear direct-select behavior of the layout group and be less self-explanatory.
- Automatically restoring the previous layout when browsing past the first/last session in `Single view` would feel clever, but it would also make the layout state less predictable during a simple navigation action.

### What still needs attention
- This restore affordance should still be validated in a live Electron session, especially after entering `Single view` from a tile, browsing a few sessions, and then returning to the previous layout.
- The floating panel versus tiled-session width competition remains the bigger cross-surface behavior issue once the local `Single view` transition is clearer.
- If `Single view` still feels sticky in practice, the next likely pass is whether the layout group itself needs a stronger active-state relationship between the restore button and the selected `Single` mode.

## Iteration 31 - Let floating-panel resize handles quickly give space back to tiled sessions

### Area inspected
- `tiling-ux.md` latest notes, specifically the still-open floating-panel versus tiled-session width-pressure thread
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- `apps/desktop/package.json` for a practical live desktop check path

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the not-recently-implemented floating-panel width-pressure follow-up instead of another sessions-header or in-tile density pass.
2. Inspect `PanelResizeWrapper` to compare what the current resize affordance explains on hover versus what recovery actions it offers after a user has manually enlarged the panel.
3. Launch `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` and attempt `electron_execute` before editing; the dev app started, but the renderer still did not expose inspectable CDP targets in this environment.
4. Compare the existing minimum-size boundary feedback with the still-missing “quickly shrink this back down” path that matters when the panel is crowding tiled sessions.

### UX problem found
- The floating panel already made resizing more discoverable and already explained when a drag hit the minimum size floor.
- But once a user had expanded the panel, there was still no quick recovery path to reclaim space for tiled sessions besides dragging the same edge back manually.
- That made the resize workflow feel one-directional: the UI could explain the floor, but it did not help users snap back toward a compact footprint when the panel started crowding the main tiled workflow.

### Assumptions
- It is acceptable to make the quick-recovery action axis-aware and local to the existing resize handles, because users already understand those handles as the place where panel size is controlled.
- It is acceptable for the quick shrink behavior to target the current mode's existing minimum width and/or height instead of a separate preset size, because the immediate goal is to give space back predictably without inventing new persistence rules.
- Focused affordance tests, desktop web typecheck, and a failed-but-documented live Electron inspection attempt are sufficient for this pass because the change is renderer-local and the launched dev app still did not expose inspectable CDP targets.

### Decision and rationale
- Keep the current drag-based resizing and minimum-size logic unchanged.
- Add a double-click shortcut directly on the existing resize handles so users can quickly shrink width, height, or both axes back to the current mode's compact minimum footprint.
- Surface that shortcut in the existing hover hint and handle titles so the behavior is discoverable from the same affordance, rather than introducing new always-visible panel chrome.
- This is better than adding a separate reset button because it keeps the recovery action tied to the resize interaction itself, reduces pointer travel, and avoids adding more permanent controls to a narrow floating window.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` so resize handles can emit an explicit `onDoubleClick` action in addition to drag and hover behavior.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to derive axis-aware compact-size targets from the current handle (`width`, `height`, or both) and persist the compacted size with the same mode-aware panel-size saving path used after drag resize.
- Added an inline blue compact-action badge to the existing hover hint so handles now advertise `Double-click to shrink ...` when hovered.
- Updated handle titles so the quick-shrink path is also exposed through native hover text.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new compact-size helper, hover hint, double-click wiring, and updated handle titles.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` launched the desktop dev app, but `electron_execute` still failed to list inspectable CDP targets, so no live renderer inspection was available for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Lowering the panel minimum sizes would release even more space to tiled sessions, but it would also change the actual layout constraints instead of first improving recoverability within the existing rules.
- Adding a visible reset/compact button inside the panel would make the recovery action obvious, but it would permanently consume chrome inside a surface that is already under width pressure.
- Snapping all dimensions back to a larger remembered preset could feel less abrupt, but it would not solve the immediate “I need this panel out of the tiles' way right now” workflow as directly as shrinking the active axis to its minimum.

### What still needs attention
- This double-click shrink path should still be validated in a live Electron session, especially while the main app is showing tiled sessions and the panel has been manually widened enough to crowd the layout.
- The broader floating panel versus tiled-session width competition is still open, especially whether the panel's default agent-mode width should adapt more intelligently before users need to intervene manually.
- If panel recovery still feels too hidden in practice, the next likely follow-up is deciding whether the hover hint should become a slightly stronger at-rest cue on the content-facing resize edge.

## Iteration 31 - Explain how to recover from width-driven stacked layouts

### Area inspected
- `tiling-ux.md` latest notes, specifically the still-open issue that panel/sidebar/window width pressure can make tiled layouts feel cramped or unexpectedly stacked
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/mobile/src` equivalent-surface check via `rg` (no matching sessions-layout surface found)
- `apps/desktop/package.json` and a lightweight dev launch attempt to see whether live Electron inspection was practical before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the still-open width-pressure thread instead of another tile-local copy pass.
2. Inspect `sessions.tsx` around `isResponsiveStackedLayout`, the current-layout chip, and the layout button group to compare what the UI says when `Compare` or `Grid` can no longer render side by side.
3. Attempt a lightweight live desktop check by launching `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222`, then try `electron_execute` before changing anything.
4. Check whether there is an equivalent mobile surface that would also need the same hint; none turned up under `apps/mobile/src`.

### UX problem found
- The current-layout chip already became truthful under width pressure by switching to `Stacked to fit`, but it still only described the current state.
- That left a small but important gap: when `Compare` or `Grid` stacked into one column because the sessions area got squeezed, users were told what happened but not how to recover.
- In practice that can make layout switching feel less predictable, especially when panel/sidebar/window width is the real cause and the user could otherwise interpret the stacked state as the layout controls no longer doing anything useful.

### Assumptions
- It is acceptable to solve this with a small contextual hint instead of new controls, because the issue is recovery clarity rather than missing capability.
- It is acceptable to phrase the hint around widening the sessions area rather than naming a specific cause such as sidebar or floating panel width, because the same recovery action covers all of those width-pressure sources.
- Focused renderer tests, desktop web typecheck, and a failed-but-documented live Electron inspection attempt are sufficient for this pass because `electron_execute` still could not attach to a CDP target after launching the dev app with an inspect argument.

### Decision and rationale
- Keep the existing layout controls and adaptive stacked behavior unchanged.
- Add a contextual recovery chip whenever `Compare` or `Grid` is active but currently stacked by width pressure.
- Make the hint mode-specific (`Widen to compare side by side` / `Widen to restore grid`) and adapt it for tighter headers (`Restore side by side`, `Restore grid`, or just `Widen`).
- This is better than adding another button or auto-switching layouts because it reduces ambiguity while preserving the current direct-select layout model and avoiding accidental resets.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `STACKED_LAYOUT_RECOVERY_HINTS` for the non-single layouts.
- Derived `stackedLayoutRecoveryHint`, `showStackedLayoutRecoveryHint`, and `stackedLayoutRecoveryLabel` from the existing responsive stacked-layout state in the same file.
- Added a compact contextual hint chip next to the current-layout chip so squeezed tiled layouts now explain how to get back to the intended multi-column arrangement.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new recovery hint and to make the source-based expectations resilient to the current file formatting.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` launched, but `electron_execute` still could not attach to an inspectable Electron target, so no live renderer verification was available for this pass.
- `rg -n "Single view|Compare view|Grid view|Session tile layout|Stacked to fit|Back to Compare|Back to Grid" apps/mobile/src` (cwd repo root) returned no matches, so no equivalent mobile update was needed.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the UI as-is would be the lowest-churn option, but it keeps a recovery gap exactly where squeezed layouts already risk feeling surprising.
- Turning the stacked-state hint into a new interactive button could be more explicit, but there is no direct action to perform other than creating more width, so a passive contextual cue is more honest.
- Automatically switching from `Grid` or `Compare` to `Single view` under width pressure would simplify the visible result, but it would make layout state feel less stable and harder to predict when width changes back.

### What still needs attention
- This new stacked-layout recovery hint should still be validated in a live Electron session while resizing the app window, changing sidebar width, and opening or resizing the floating panel.
- The broader floating-panel-versus-tiled-session width competition is still open; this pass improves feedback but does not change the underlying width negotiation.
- If live testing shows users still miss the reason layouts stack, the next likely pass is adding earlier or richer width-pressure feedback around the panel-resize interaction itself rather than only inside the sessions header.

## Iteration 32 - Keep a width-recovery cue visible on widened floating panels

### Area inspected
- `tiling-ux.md` latest notes, specifically the open follow-up about adding earlier width-pressure feedback around the panel-resize interaction itself
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight live renderer inspection attempt via `electron_execute`

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the still-open floating-panel-versus-tiled-session width-pressure thread instead of another sessions-header pass.
2. Inspect `PanelResizeWrapper` to compare what it communicates while hovered or actively resizing versus what it communicates after the panel has already been widened and is now crowding tiled sessions.
3. Attempt a lightweight live desktop check with `electron_execute`; no inspectable Electron target was available in this environment.
4. Review the existing panel affordance tests to confirm that the current UX already explains resize and double-click-to-shrink on hover, but not before users rediscover the left resize edge.

### UX problem found
- The floating panel already explains drag resize and the double-click shrink shortcut, but only once the user hovers a resize handle.
- When the panel has already been widened enough to squeeze tiled sessions, the most important next action is often to give space back quickly, yet the UI still goes visually quiet at rest.
- That makes width recovery feel more like a remembered trick than an obvious nearby option, especially when the left edge is the part of the panel competing directly with tiled sessions.

### Assumptions
- It is acceptable to treat the floating panel's left edge as the content-facing edge in the common desktop workflow, because the panel typically sits to the right of the tiled sessions area and that edge is where width recovery matters most.
- It is acceptable to make this cue reminder-only rather than interactive chrome, because the actual control already exists on the resize handle and the gap is discoverability at rest.
- Focused affordance tests and desktop web typecheck are sufficient for this pass because the change is renderer-local and live Electron inspection was not available.

### Decision and rationale
- Keep the existing hover and drag affordances unchanged.
- Add a subtle left-edge reminder chip that appears only when the panel is materially wider than its compact minimum and no resize interaction is already active.
- Let the reminder adapt between a short `Shrink width` label and a fuller `Double-click edge to shrink width` label based on how much extra width is currently consuming space.
- This is better than adding a new persistent button because it advertises the recovery path earlier without adding another permanent control to a narrow floating surface.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to import `ChevronsLeft` and define a width-recovery reminder threshold for materially widened panels.
- Added `showRestingWidthRecoveryHint` and `restingWidthRecoveryLabel` in the same file so the panel can surface a low-key width-recovery cue only while idle and only when reclaiming width would actually give space back.
- Rendered a subtle left-edge reminder chip beside the content-facing resize edge while the panel is widened, leaving the existing hover hint and resize behavior unchanged.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new idle-state width-recovery cue and its adaptive label behavior.

### Verification
- `electron_execute` renderer inspection attempt failed because no inspectable Electron target was running with `--inspect`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the current hover-only hinting in place would be lower churn, but it keeps the width-recovery action hidden exactly when users are most likely to need it.
- Adding a visible shrink button inside the floating panel would be more explicit, but it would also permanently consume panel chrome and duplicate an action already owned by the resize edge.
- Auto-shrinking the panel when layouts stack would reclaim space faster, but it would make panel behavior less predictable and override user resizing decisions.

### What still needs attention
- This left-edge reminder should still be validated in a live Electron session while the sessions page is visible and the floating panel has been widened enough to force stacked layouts or tighter headers.
- The broader floating-panel-versus-tiled-session width negotiation remains open; this pass improves recoverability, not the underlying allocation behavior.
- If the reminder still proves too subtle in practice, the next likely pass is whether the sessions surface should react earlier when the panel crosses a width threshold that predictably degrades tiled layouts.

## Iteration 33 - Warn before Compare or Grid actually collapse into stacked mode

### Area inspected
- `tiling-ux.md` latest notes, specifically the open follow-up about making the sessions surface react earlier before width pressure actually degrades tiled layouts
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- lightweight Electron launch plus `electron_execute` to see whether the sessions surface was inspectable before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the not-yet-implemented follow-up about earlier width-pressure feedback instead of another panel-edge pass.
2. Inspect `sessions.tsx` around `isResponsiveStackedLayout`, the current-layout chip, the stacked recovery hint, and the reorder hint to compare what the UI says before and after the layout actually falls back to one column.
3. Launch `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` and attempt `electron_execute` before editing.
4. Compare the current toolbar behavior when `Compare` or `Grid` is still technically side by side but already close enough to the stacking threshold that a small sidebar, panel, or window-width change will flip the layout.

### UX problem found
- The sessions header only explained width pressure after the layout had already stacked, via the existing `Stacked to fit` chip and recovery hint.
- Just before that threshold, the UI still looked fully stable even though a very small width loss could abruptly collapse `Compare` or `Grid` into one column.
- In that tighter pre-stack state, the reorder hint could still consume the same limited toolbar space even though the more urgent user need was understanding that the current multi-column layout was fragile.

### Assumptions
- It is acceptable to use a small fixed early-warning buffer before the actual stack threshold, because the goal is not pixel-perfect forecasting but giving users a little reaction time before a highly noticeable layout change.
- It is acceptable to prioritize the width-pressure hint over the reorder hint when space is already tight, because preserving layout predictability is more urgent than reminding users about drag reordering in that moment.
- Focused source-based tests, desktop web typecheck, and a documented-but-limited Electron run are sufficient for this pass because the change is local to the sessions header and the inspectable renderer target in this environment was not the actual sessions surface.

### Decision and rationale
- Keep the existing stacked fallback and stacked recovery hint unchanged.
- Add a new passive warning chip for `Compare` and `Grid` when the measured sessions area is within a small buffer of the responsive stacking threshold, even before the layout has actually stacked.
- Use `Close to stacking` on roomier headers, `Tight fit` on compact headers, and `Tight` on very compact headers so the warning stays present without overwhelming narrower toolbars.
- Hide the reorder hint while this warning is active so the header prioritizes the more time-sensitive explanation instead of competing chips.
- This is better than auto-switching layouts or adding another control because it improves predictability early while preserving the current direct-select layout model and user-chosen panel/sidebar sizes.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `NEAR_RESPONSIVE_STACKED_LAYOUT_WARNING_BUFFER` and a mode-aware `NEAR_STACKED_LAYOUT_HINTS` map.
- Derived `nearStackedLayoutHint`, `showNearStackedLayoutHint`, and `nearStackedLayoutHintLabel` from the existing `isResponsiveStackedTileLayout(...)` helper by simulating a small additional width loss.
- Added an amber warning chip beside the current layout context when `Compare` or `Grid` is close to stacking, using `AlertTriangle` for faster visual scanning.
- Updated the same file so the reorder hint steps aside while the tighter width-pressure warning is active.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new warning threshold, copy, visual treatment, and reorder-hint suppression path.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` (cwd repo root) launched successfully.
- `electron_execute` attached after reset, but the inspectable target in this environment was `https://techfren.net/blog/future-of-software` rather than the sessions renderer, so no direct tiled-session UI inspection was available for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the UI as stacked-only feedback would be lower churn, but it keeps the layout change feeling abrupt whenever width pressure crosses the threshold unexpectedly.
- Making the warning chip interactive would suggest there is a direct fix button inside the sessions header, which would be misleading because the real fix is reclaiming width.
- Auto-shrinking the panel or auto-switching layouts sooner would react faster, but it would also make the interface less predictable by overriding user choices before the fallback is actually necessary.

### What still needs attention
- This early warning should still be validated on the real sessions surface while resizing the app window, changing sidebar width, and widening or shrinking the floating panel across the warning threshold.
- The broader width negotiation is still open; this pass improves anticipatory feedback, not the underlying allocation rules between tiled sessions and the floating panel.
- If the warning still feels too subtle in practice, the next likely follow-up is deciding whether panel-aware wording or a slightly stronger visual transition is warranted only while the floating panel is the active source of pressure.

## Iteration 33 - Move the panel width-recovery reminder onto the edge itself

### Area inspected
- `tiling-ux.md` latest panel-width notes, especially Iteration 32's new idle reminder
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts`
- lightweight `electron_execute` inspection to see whether a live desktop renderer was available before relying on runtime UX checks

### Repro steps reviewed
1. Re-read the ledger and intentionally stay on the still-open floating-panel-versus-tiled-session width-pressure thread.
2. Inspect the new idle width-recovery reminder in `PanelResizeWrapper` and compare its at-rest placement with the rest of the panel affordance layer.
3. Attempt a lightweight live renderer inspection with `electron_execute`; the available target resolved to `https://techfren.net/admin`, so it was not a reliable desktop-app surface for this workflow.
4. Review the panel affordance tests and nearby panel layout regression coverage before changing the reminder.

### UX problem found
- The new idle reminder added in Iteration 32 improved discoverability, but it still lived inside the panel body as a rounded chip.
- That placement competes with panel content instead of reading like part of the sessions-facing resize edge, and it risks feeling like overlay chrome rather than a direct clue about where to act.
- The adaptive long label also increased visual footprint right when the panel is already consuming too much width.

### Assumptions
- It is acceptable to refine the new reminder immediately instead of waiting for a broader refactor because the issue is local to the existing affordance layer and does not change panel behavior.
- It is acceptable to keep the reminder label short (`Shrink width`) because the richer hover hint and handle `title` text already explain drag and double-click gestures.
- Focused renderer tests plus desktop web typecheck are sufficient for this pass because the floating panel is a desktop-only Electron surface and the available inspectable renderer target was unrelated to the app.

### Decision and rationale
- Keep the idle reminder, but attach it visually to the left/content-facing edge as a small edge tab instead of an in-panel chip.
- Strengthen the idle left resize rail whenever that reminder is showing so the edge itself reads as the recovery surface before hover.
- Remove the longer at-rest label variant and keep the persistent cue compact; leave the richer hover and active resize messaging unchanged.
- This is better than adding more wording or another button because it improves scanability, reduces content overlap, and points attention toward the actual resize edge.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` so `panelResizeRailClassName` can render a stronger idle left rail when the width-recovery reminder is active.
- Moved the idle reminder to an edge-attached tab (`rounded-r-full`, `border-l-0`, `-left-1`) so it reads as part of the sessions-facing resize edge rather than a chip floating over panel content.
- Simplified the idle reminder copy to a consistent `Shrink width` label and kept the richer hover/double-click guidance in the existing interactive hint layer.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the stronger left rail state and the new edge-tab reminder structure.

### Verification
- `electron_execute` connected to an unrelated target (`https://techfren.net/admin`), so no trustworthy live desktop-app verification was available for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts src/renderer/src/pages/panel.recording-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the Iteration 32 chip in place would have been lower churn, but it kept the recovery hint visually inside the panel instead of on the edge users need to rediscover.
- Keeping the longer adaptive label would explain more in the idle state, but it would also consume more horizontal space on the same surface that is already crowding tiles.
- Turning the reminder into a clickable button would be more explicit, but it would duplicate the existing resize handle rather than clarifying it.

### What still needs attention
- This edge-tab reminder should still be validated in a real desktop session while resizing the floating panel against tiled sessions, especially at narrower window widths and wider sidebars.
- The broader panel-versus-tiles width allocation remains open; this pass improves recovery clarity after the panel is already wide, not whether the panel should widen less aggressively in the first place.
- If the edge-tab reminder is still too subtle in practice, the next likely follow-up is adding sessions-side feedback or adaptive panel defaults before layouts get squeezed into stacked mode.

## Iteration 34 - Make stacked-layout recovery guidance truthful when panel width is the cause

### Area inspected
- `tiling-ux.md` latest notes, especially the still-open panel-versus-tiles width-pressure thread
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- lightweight `electron_execute` check for a live desktop renderer target before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the still-open cross-surface width-pressure thread instead of another tile-internal density pass.
2. Inspect the stacked and near-stacked recovery chips in `sessions.tsx`, especially the visible labels versus the richer tooltip copy.
3. Compare that sessions-page guidance with the newer panel resize affordances, which already teach `Shrink width` on the floating panel edge.
4. Attempt a lightweight live renderer check before editing; `electron_execute` attached to an unrelated `techfren.net` tab instead of a trustworthy desktop sessions surface, so runtime validation was not practical in this environment.

### UX problem found
- The sessions page already explained when compare/grid had stacked and already exposed a recovery chip, but that chip still only told users to `Widen` the sessions area.
- In real tiled workflows, the floating panel or sidebar is often the reason compare/grid lost width, so a widen-only cue is directionally incomplete.
- That mismatch made the sessions header and the panel edge affordances tell slightly different stories about the same recovery path.

### Assumptions
- It is acceptable to solve this with copy and hint-label changes instead of layout behavior changes, because the current issue is recovery clarity rather than a missing capability.
- It is acceptable for the visible chip to say `Make room` rather than naming a single specific action, because the practical fixes can include widening the sessions area, narrowing a sidebar, or shrinking the floating panel.
- Focused sessions-header tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and no trustworthy live desktop renderer target was available.

### Decision and rationale
- Keep the current stacked and near-stacked layout detection unchanged.
- Update the stacked recovery chip so its visible label no longer implies widening is the only fix; use `Make room to compare`, `Make room for grid`, and compact `Make room` variants instead.
- Expand the tooltip copy to explicitly name the real recovery options: widen the sessions area, narrow the sidebar, or shrink the floating panel.
- This is better than keeping `Widen` because it aligns the sessions-page guidance with the panel-resize affordances and reduces ambiguity about which surface the user should adjust.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `STACKED_LAYOUT_RECOVERY_HINTS` now use room-making copy rather than widen-only copy.
- Updated the same file so the stacked recovery tooltip now explicitly mentions shrinking the floating panel or narrowing the sidebar as valid recovery paths.
- Changed the very-compact fallback label from `Widen` to `Make room` so the tightest header state stays truthful too.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new labels and tooltip copy.

### Verification
- `electron_execute` connected to `https://techfren.net/blog/future-of-software`, so no trustworthy live desktop-app renderer validation was available for this iteration.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Leaving the chip as `Widen` is lower churn, but it keeps the sessions page implying a narrower recovery path than the panel affordances actually support.
- Naming every recovery source directly in the visible chip (`Shrink panel or widen sessions`) would be more explicit, but it would add too much width and visual weight to an already dense header.
- Automatically shrinking the panel when layouts stack would reclaim space faster, but it would override a user-controlled panel width and broaden scope beyond this clarity pass.

### What still needs attention
- This copy alignment should still be validated in a real desktop session while the floating panel, sidebar width, and sessions layout all compete for space.
- The broader panel-versus-tiles width allocation remains open; this pass makes recovery guidance clearer but does not change how aggressively the panel consumes width in agent mode.
- If users still miss the recovery path in practice, the next likely follow-up is a stronger sessions-side cue before the layout actually stacks, or smarter panel defaults that avoid cramped states earlier.

## Iteration 35 - Keep the current session visible when leaving Single view

### Area inspected
- `tiling-ux.md` latest notes, especially the still-open maximized-vs-grid predictability thread around `Single view`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight Electron launch plus `electron_execute` to see whether the sessions surface was inspectable before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose a not-recently-implemented `Single view` transition detail instead of another width-pressure or panel-edge pass.
2. Inspect `sessions.tsx` around `handleSelectTileLayout`, `handleRestorePreviousLayout`, the single-view pager, and the existing `scrollSessionTileIntoView(...)` helper.
3. Launch `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` and probe the Electron renderer with `electron_execute` before editing.
4. Compare what happens when a user browses to a different session in `Single view` and then exits back to `Compare` or `Grid`.

### UX problem found
- The page already remembered the previous non-single layout and already let users browse sessions while in `Single view`.
- But when users left `Single view`, the code restored the layout without explicitly re-revealing the session they had been browsing.
- In longer session lists, that makes the transition feel slightly disorienting: the layout comes back, but the user's mental anchor can disappear if the restored multi-tile view is scrolled elsewhere.

### Assumptions
- It is acceptable to treat the currently shown single-view session as the best anchor to preserve when returning to `Compare` or `Grid`, because that is the session the user was most recently reading.
- It is acceptable to solve this with the existing `scrollSessionTileIntoView(...)` helper instead of a new abstraction, because the needed behavior is just a delayed reveal after the layout changes.
- Focused source-based tests, desktop web typecheck, and a limited-but-documented Electron inspection are sufficient for this pass because the change is renderer-local and the live renderer target was not the actual sessions surface.

### Decision and rationale
- Keep the existing `Single view` entry, browsing, and previous-layout restoration model unchanged.
- When leaving `Single view` for any multi-tile layout, capture the currently shown single-view session id and reuse the existing scroll helper to reveal that same tile once the restored layout renders.
- Apply the behavior centrally inside `handleSelectTileLayout(...)` so it covers both the dedicated `Back to ...` restore button and direct layout-button changes.
- This is better than only patching the restore button because it preserves context consistently regardless of how the user exits `Single view`.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track the currently visible single-view session in `singleViewReturnSessionIdRef`.
- Updated the same file so `handleSelectTileLayout(...)` captures a `sessionIdToRevealOnRestore` whenever the user leaves `1x1` for `Compare` or `Grid` and calls `scrollSessionTileIntoView(...)` after switching layouts.
- Added a small effect to keep the return-target ref aligned with the current `maximizedSessionId` while `Single view` changes.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new reveal-on-restore behavior.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` launched successfully.
- `electron_execute` attached to a live DotAgents renderer, but the target opened on `http://localhost:19007/` (settings surface) rather than the sessions page, so no trustworthy tiled-session runtime validation was available for this pass.
- `pnpm exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd `apps/desktop`) ✅
- `pnpm run typecheck:web` (cwd `apps/desktop`) ✅

### Tradeoffs considered
- Leaving the current behavior alone is lower churn, but it keeps the restore transition slightly jumpier than the single-view pager implies.
- Patching only the `Back to ...` affordance would help one path, but it would still leave direct layout-button exits behaving differently.
- Adding new persistent header text like `Return to this session in grid` would explain the behavior more explicitly, but it would add chrome to a header that has already needed repeated density work.

### What still needs attention
- This reveal-on-restore behavior should still be validated on the real sessions surface after entering `Single view`, browsing several sessions, and exiting via both the restore button and the direct layout buttons.
- The broader floating-panel versus tiled-session width allocation remains open; this pass improves context continuity, not how much space the tiles receive.
- If `Single view` still feels sticky in practice after live validation, the next likely follow-up is whether the sessions header needs a slightly stronger relationship between the active `Single` mode and the contextual `Back to ...` affordance.

## Iteration 35 - Explain why width resizing disappears in full-width tile states

### Area inspected
- `tiling-ux.md` latest entries to avoid repeating the recent panel-width and sessions-header warning work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- lightweight desktop launch plus `electron_execute` to see whether a trustworthy tiled sessions renderer was available before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally move away from the recent width-pressure copy passes in the sessions header and floating panel.
2. Inspect `SessionTileWrapper` to see how resize affordances behave when `Single`, responsive stacked compare/grid, or a single visible tile already require full-width tiles.
3. Trace the existing width-lock logic (`shouldLockTileWidth(...)`) and compare it with the hover labels and active resize handles.
4. Attempt a lightweight live check by launching desktop dev mode and attaching with `electron_execute`; the available inspectable renderer was not a trustworthy tiled sessions surface, so runtime UI inspection was not practical for this pass.

### UX problem found
- In full-width tile states, the width and corner resize handles disappear entirely, while the bottom height handle still looks like the normal resize affordance.
- That makes tile resizing feel inconsistent across layout modes because the UI does not explain that width is intentionally controlled by the current layout rather than by the tile itself.
- The result is avoidable ambiguity right when users move between grid/compare and stacked or maximized states, especially after a narrow window, wide sidebar, or only one visible session changes the row structure.

### Assumptions
- It is acceptable to solve this with affordance clarity rather than behavior changes because the existing full-width locking is intentional and already protects layout stability.
- It is acceptable to add a passive right-edge explanation instead of another control because the problem is discoverability, not a missing action.
- Focused component tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and the available inspectable renderer target was not the real sessions UI.

### Decision and rationale
- Keep the current width-locking behavior unchanged for `Single`, responsive stacked, and single-visible-tile states.
- Add a passive right-edge width-lock rail with a concise hover explanation whenever width resizing is unavailable because the layout already requires a full-width tile.
- Update the remaining bottom resize affordance so its label and accessibility copy become `Resize height only` when width is layout-controlled.
- Use reason-specific messaging (`Width follows Single view`, `Width fills the row`, `Width follows stacked layout`) so users understand why the affordance changed instead of seeing width resize simply vanish.
- This is better than reintroducing disabled resize handles or adding another toolbar control because it keeps the interaction local to the tile edge and reduces ambiguity without adding clutter.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to export `getTileWidthLockHint(...)`, which maps width-locked states to user-facing explanation text.
- Updated the same file so `SessionTileWrapper` renders a passive right-edge lock rail with hover copy when width resizing is unavailable.
- Updated the bottom resize affordance in the same file so hover and accessibility copy switch to `Resize height only` while width follows the current layout.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to lock in the width-lock explanation mapping.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the new width-lock rail and the axis-specific height-only guidance.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` (cwd repo root) launched successfully.
- `electron_execute` attached, but the available renderer target resolved to `http://localhost:19007/` rather than the desktop sessions UI, so no trustworthy live tiled-session inspection was available for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving width-locked states unchanged would be the smallest code delta, but it keeps width resize disappearing without explanation and makes the remaining height handle feel inconsistent.
- Showing disabled width and corner handles would preserve symmetry, but it would add visual noise and suggest an action that still cannot succeed.
- Explaining the state in the sessions header instead of inside the tile would centralize copy, but it would separate the guidance from the actual resize affordance and make the cause harder to scan.

### What still needs attention
- This new width-lock explanation should still be validated in a real desktop tiled session while switching between `Single`, `Compare`, and `Grid`, especially during narrow-width transitions and single-visible-tile fallback.
- The broader layout allocation problem remains open; this pass clarifies why tile width cannot change, but it does not change when sessions lose a column in the first place.
- If the passive right-edge reminder still feels too subtle in practice, the next likely follow-up is deciding whether the locked state should briefly animate or whether a compact header-level explanation is needed only on the first transition into full-width mode.

## Iteration 36 - Preserve the panel's anchored edge during manual resize

### Area inspected
- `tiling-ux.md` latest entries to avoid repeating the recent tile-width-lock and sessions-header work
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- `apps/desktop/src/main/tipc.ts`
- `apps/desktop/src/main/panel-position.ts`
- lightweight Electron renderer inspection to see whether a trustworthy floating-panel target was available before/after the change

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally pick the still-open floating-panel versus tiled-session width-allocation thread.
2. Trace how the panel resize wrapper computes width and height deltas for left, top, and corner handles.
3. Compare that renderer flow with the main-process `updatePanelSize(...)` path to see whether manual resize also repositions the floating panel.
4. Use lightweight Electron inspection to confirm whether the running target exposed the actual floating panel for live validation; the available target was the main app `Chats` surface rather than the floating panel window.

### UX problem found
- The floating panel exposed left, top, and corner resize handles, but the manual `updatePanelSize(...)` path only changed size and did not also move the panel window.
- In tiled workflows, that means shrinking the sessions-facing left edge can fail to actually return room to tiled sessions because the panel origin stays fixed.
- The mismatch also makes top and corner handles less predictable because their visual affordance implies edge-anchored resizing while the underlying window behavior only updates width and height.

### Assumptions
- It is acceptable to preserve the opposite edge relative to the panel's current bounds instead of snapping back to a preset position because manual resize should respect the user's current floating-panel placement.
- It is acceptable not to persist a newly shifted custom position in this pass because the highest-value issue is the live resize interaction itself; persisting custom-position deltas can follow separately if needed.
- Focused main/renderer tests plus desktop typecheck are sufficient for this pass because the change is local to panel resize wiring and the available inspectable Electron target was not the floating panel window.

### Decision and rationale
- Preserve the panel's anchored edge during manual resize by passing the active resize handle into the main process and deriving the new window position from the current bounds plus the requested size.
- Treat left-edge resizing as keeping the right edge fixed, top-edge resizing as keeping the bottom edge fixed, and top-left resizing as keeping both right and bottom edges fixed.
- Keep right and bottom anchored resizes origin-stable so the existing direct-size behavior remains unchanged for those handles.
- Constrain the resulting position to the screen after the anchored adjustment so the panel still respects the existing safety bounds.
- This is better than only tweaking hint text because it fixes the actual mismatch between the affordance and the resulting window behavior, especially when users are trying to free space for tiled sessions.

### Code changes
- Updated `apps/desktop/src/main/panel-position.ts` to export `PanelResizeAnchor` and `calculateAnchoredPanelPosition(...)` for edge-aware resize positioning.
- Updated `apps/desktop/src/main/tipc.ts` so `updatePanelSize(...)` accepts an optional `resizeAnchor`, computes the anchored position from the current bounds, constrains it to screen, and applies `setPosition(...)` alongside `setSize(...)`.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to track the active resize handle in a ref and pass that anchor through during live resize, final persistence, and double-click compact recovery.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the renderer-to-main resize-anchor wiring.
- Added `apps/desktop/src/main/panel-resize-anchor.test.ts` to lock in the anchored-position math and the main-process resize repositioning path.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/main/panel-resize-anchor.test.ts src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck` (cwd repo root) ✅
- `electron_execute` attached to a live Electron renderer, but the inspectable target resolved to the main app `Chats` window rather than the floating panel window, so no trustworthy panel-window runtime drag validation was available for this iteration.

### Tradeoffs considered
- Leaving manual resize origin-stable is the lowest-risk option, but it keeps the left/top/corner handles visually promising behavior that the window does not actually deliver.
- Recomputing position from the user's preset dock position on every resize would also keep the panel anchored, but it would ignore custom floating placement and feel more jumpy once the panel has been moved.
- Adding a new shrink button or stronger copy would improve discoverability, but it would not fix the underlying problem that panel resizing can fail to release space back to tiled sessions.

### What still needs attention
- This anchored-resize behavior should still be validated on the real floating panel by widening and shrinking from the left edge while tiled sessions are visible behind it.
- If custom-position users expect the new left/top resize offsets to persist across reopen or mode restore, a follow-up may need to persist updated custom coordinates after resize-end rather than only the size.
- The broader tiled-session layout allocation question remains open; this pass makes panel resize behavior more predictable, but it does not yet decide when the app should proactively suggest or trigger narrower panel footprints.

## Iteration 36 - Preserve manual tile width when switching between Compare and Grid

### Area inspected
- `tiling-ux.md` latest notes, specifically the still-open layout-switch predictability thread rather than the recent width-pressure copy work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`

### Repro steps reviewed
1. Re-read the ledger and intentionally choose a not-recently-addressed layout-switch problem instead of another sessions-header or panel-edge hint pass.
2. Inspect `sessions.tsx` around `handleSelectTileLayout(...)` to see whether layout changes still clear the shared `session-tile` size unconditionally.
3. Inspect `SessionTileWrapper` in `session-grid.tsx` to compare what happens on `resetKey` changes versus `layoutMode` changes after a user has manually resized a tile.
4. Attempt a lightweight live renderer check with `electron_execute`; a DotAgents renderer was available at `http://localhost:19007/`, but it was on the chats/settings surface rather than a trustworthy tiled sessions page, so runtime validation of this exact workflow was not practical.

### UX problem found
- `handleSelectTileLayout(...)` still cleared the shared `session-tile` persisted size and bumped the grid reset key on every layout change.
- `SessionTileWrapper` also retargeted both width and height whenever `layoutMode` changed.
- That meant a user who manually widened or narrowed tiles in `Compare` would lose that width immediately when switching to `Grid`, even though both modes keep the same side-by-side multi-tile width rhythm on roomy windows.
- The result made layout switching feel more like an accidental resize reset than an intentional density change.

### Assumptions
- It is acceptable to preserve manual tile width across `Compare` ↔ `Grid` only when both modes are still true side-by-side multi-tile layouts, because that is where the horizontal structure is actually unchanged.
- It is acceptable for `Grid` to keep retargeting height even when width is preserved, because showing more sessions at once is the main semantic difference between `Grid` and `Compare`.
- It is acceptable for `Single view`, responsive stacked states, and single-visible-tile fallbacks to keep resetting width, because those states intentionally make width layout-controlled.

### Decision and rationale
- Keep the current full reset behavior for transitions involving `Single view` or any layout state where width is already locked by the layout.
- Preserve user-adjusted tile width when switching between `Compare` and `Grid` in a true multi-tile side-by-side layout, while still retargeting height to the selected mode's density.
- Stop clearing the shared tile size preemptively for ordinary `Compare` ↔ `Grid` switches; let the tile wrapper decide whether the current transition can safely preserve width.
- This is better than preserving both axes, because `Grid` would stop feeling denser than `Compare`, and it is better than resetting both axes because that keeps discarding a valid user sizing choice for no structural reason.

### Code changes
- Added `shouldPreserveTileWidthOnLayoutChange(...)` to `apps/desktop/src/renderer/src/components/session-grid.tsx` to centralize when a layout transition can safely keep a manual width.
- Updated the layout-mode sizing effect in the same file so `Compare` ↔ `Grid` transitions now preserve width but still retarget height, while other transitions continue to retarget both axes.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `handleSelectTileLayout(...)` only clears the persisted `session-tile` size and bumps `tileResetKey` when the transition should truly reset sizing.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`, `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`, and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new transition rules.

### Verification
- `electron_execute` attached to a live DotAgents renderer at `http://localhost:19007/`, but the available surface was chats/settings rather than the sessions page, so no trustworthy runtime validation of this tiled-session workflow was available for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the old full-reset behavior would have been lower churn, but it keeps throwing away manual width changes even when the horizontal layout structure is effectively unchanged.
- Preserving both width and height across `Compare` ↔ `Grid` would maximize continuity, but it would also weaken the density difference that makes `Grid` worth selecting.
- Introducing per-layout persisted sizes could make `Single view` return paths smarter too, but that is a broader persistence decision than this targeted predictability pass needs.

### What still needs attention
- This width-preservation path should still be validated on the real sessions surface after manually resizing in `Compare`, switching to `Grid`, and switching back again at both roomy and tighter window widths.
- `Single view` still performs a full size reset when entered or left, so the next maximized-vs-grid follow-up is whether a previous multi-tile width should survive a temporary `Single view` detour too.
- The broader panel-versus-tiles width allocation remains open; this pass reduces accidental resets during layout switching, not how much room tiled sessions receive.

## Iteration 37 - Clarify tile reorder insertion direction

### Area inspected
- `tiling-ux.md` latest entries to avoid repeating the recent layout-switch and panel-resize work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- lightweight Electron renderer inspection to see whether a live tiled-sessions surface was available for runtime drag validation

### Repro steps reviewed
1. Re-read the ledger tail and intentionally choose drag/reorder clarity rather than another width-lock or panel-edge follow-up.
2. Inspect `SessionTileWrapper` to see how the reorder handle and drag target cue are rendered while dragging.
3. Trace the reorder algorithm in `sessions.tsx` to confirm what the existing `dragTargetIndex` actually means during a drop.
4. Use `electron_execute` to check whether the running renderer exposed live tiled sessions; the available target was the `Chats` surface with no session-tile drag UI to exercise.

### UX problem found
- The existing drop cue only said `Drop here`, even though the current reorder algorithm inserts the dragged tile at the hovered tile's index.
- That makes the actual behavior effectively “drop before this tile,” but the UI did not communicate that insertion direction.
- The small top-right badge also floated away from the tile's leading edge, so the drop target felt more like a generic hover state than a clear insertion marker.

### Assumptions
- It is acceptable to clarify the existing before-target insertion rule instead of redesigning the reorder algorithm in this pass, because the goal here is reducing ambiguity with the smallest coherent change.
- It is acceptable to keep the current reorder semantics unchanged for now rather than adding before/after cursor splitting, because that would be a broader interaction model change with more edge cases in wrapped grids.
- Focused source-level test coverage plus renderer typecheck are sufficient for this pass because the live Electron surface did not expose actual session tiles for trustworthy drag validation.

### Decision and rationale
- Keep the reorder behavior itself unchanged, but make the drop target explicitly communicate `Drop before`.
- Replace the floating top-right badge with a top-edge insertion marker so the cue visually attaches to the edge where the dragged tile will land.
- Update the sessions-header reorder hint to describe the same behavior in plain language: dragging a tile onto another tile places it before that session.
- This is better than only changing the text label inside the old badge because it improves both the wording and the spatial mapping of the cue without introducing a more complex reorder model.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so drag targets now show a full-width top insertion line plus a `Drop before` pill instead of a detached `Drop here` badge.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the sessions-header reorder hint explains the actual before-target insertion behavior.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new hint copy and top-edge drop marker.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` attached to a live renderer, but the available window was the `Chats` surface rather than a live tiled-sessions view, so no trustworthy drag runtime validation was available for this iteration.

### Tradeoffs considered
- Leaving the cue as `Drop here` would be the smallest code delta, but it keeps the actual insertion position ambiguous.
- Changing the reorder algorithm to support before/after placement based on cursor position could be more powerful, but it would add interaction complexity before the simpler ambiguity problem is solved.
- Moving the reorder affordance fully inside the tile header might reduce overflow risk, but it would compete with existing tile header content and action density.

### What still needs attention
- This drag cue should still be validated on a real tiled sessions surface with multiple active tiles, especially across wrapped two-column grids and narrow stacked layouts.
- If users still hesitate during drag-and-drop, the next likely follow-up is deciding whether the hovered tile should support before/after insertion zones instead of a single before-target rule.
- The drag handle itself still sits above the tile chrome; if clipping or crowding shows up in practice, a later pass can revisit its placement separately from insertion feedback.

## Iteration 37 - Restore the previous multi-tile width after leaving Single view

### Area inspected
- `tiling-ux.md`, specifically the open follow-up from Iteration 36 rather than another panel-width or header-density pass
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`

### Repro steps reviewed
1. Re-read the ledger and choose the still-open `Single view` width-reset follow-up instead of revisiting already-recent panel or header work.
2. Inspect `handleSelectTileLayout(...)` in `sessions.tsx` to confirm that transitions leaving `Single view` still clear shared tile sizing and bump `tileResetKey`.
3. Inspect `SessionTileWrapper` in `session-grid.tsx` to confirm that layout changes from `Single view` always retarget width to the default layout width rather than any previous multi-tile width.
4. Launch `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` and attach `electron_execute`; the live renderer again landed on the chats/settings surface at `http://localhost:19007/`, so the actual tiled sessions workflow was not trustworthily reachable for runtime validation.

### UX problem found
- A temporary trip through `Single view` still wiped out a user's manually chosen multi-tile width.
- That made `Single view` feel like a destructive layout reset rather than a temporary focus mode, especially when users wanted to inspect one session and then return to a carefully sized `Compare` or `Grid` arrangement.
- The problem was sharper because Iteration 36 already taught `Compare` and `Grid` to preserve width between each other, so `Single view` remained the one obvious layout switch that still broke width continuity.

### Assumptions
- It is acceptable to remember the current tile width only when the pre-`Single view` layout is a true side-by-side multi-tile state, because full-width stacked states and lone-tile fallbacks do not represent a meaningful user-chosen comparison width.
- It is acceptable to capture the current width from the rendered tile DOM just before entering `Single view`, because the value needed is the currently visible width the user perceives, not a broader persisted-layout abstraction.
- It is acceptable to keep `Single view` itself fully layout-controlled and full-width, because the goal is continuity when leaving it, not making one-up mode manually resizable.

### Decision and rationale
- Capture the visible multi-tile width only when entering `Single view` from a non-locked side-by-side layout.
- Continue resetting tile size when entering `Single view`, because one-up mode should still snap to the intentionally full-width/full-height layout.
- Restore the captured width only when leaving `Single view` for a side-by-side layout where width resizing is actually available again.
- This is better than keeping the existing full reset because it preserves user intent, and better than introducing per-layout persisted sizes because it solves the immediate predictability gap with much smaller surface area and lower risk.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track `singleViewReturnTileWidthRef`, capture the current visible tile width before entering `Single view` only when the current layout is not width-locked, and stop doing a second full size reset when leaving `Single view`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to thread a `layoutRestoreWidth` value through grid context and restore that width when `SessionTileWrapper` transitions from `Single view` back into a true side-by-side multi-tile layout.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new capture-and-restore behavior.

### Verification
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` (cwd repo root) launched successfully.
- `electron_execute` attached to a live DotAgents renderer, but the reachable target was still the chats/settings surface at `http://localhost:19007/` rather than the sessions page, so no trustworthy live tiled-session runtime validation was available for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Preserving the width across every `Single view` transition unconditionally would be simpler, but it would also restore misleading full-width values from stacked or lone-tile fallback states.
- Storing separate persisted widths per layout mode might make the behavior even richer later, but it would add a broader persistence model to solve a narrower continuity problem.
- Restoring width from local storage instead of the rendered tile would reduce DOM coupling, but the rendered width is the most trustworthy source of what the user actually had on screen immediately before switching modes.

### What still needs attention
- This `Single view` width-restore path should still be validated on the real sessions surface after manually resizing in `Compare` or `Grid`, entering `Single view`, browsing to another session, and returning via both the restore button and direct layout buttons.
- If returning from `Single view` into a tighter window or wider sidebar causes the restored width to feel too sticky, a future pass may need an explicit clamp-or-forget rule once the restored value is far from the current target width.
- The broader panel-versus-tiles width allocation remains open; this pass preserves layout continuity, but it does not change when tiles lose columns or when the floating panel should yield space earlier.

## Iteration 38 - Forget stale Single view return widths after the layout tightens

### Area inspected
- `tiling-ux.md`, specifically the still-open width-stickiness follow-up from Iteration 37
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`

### Repro steps reviewed
1. Re-read Iteration 37 and choose the unresolved `Single view` width-stickiness follow-up instead of revisiting panel-edge affordances or reorder cues.
2. Inspect `SessionTileWrapper` in `session-grid.tsx` to confirm that leaving `Single view` restored the captured multi-tile width whenever width resizing was unlocked again.
3. Compare that restore path with the current `targetTileWidth` and `maxWidth` logic to see how a stale wide value could survive after the sessions area became materially tighter.
4. Attempt a lightweight `electron_execute` attach for runtime inspection; a live renderer target was available, but it was not a trustworthy tiled-sessions surface, so this iteration stayed code-and-test validated.

### UX problem found
- Iteration 37 restored width continuity when leaving `Single view`, but it still trusted the previously captured width too eagerly.
- If the user resized a compare/grid tile wide, entered `Single view`, and then returned after the sessions area got narrower because of a smaller window, wider sidebar, or other layout pressure, the old width could come back and dominate the row.
- That made the restored layout feel sticky and hard to predict: the app technically remembered the prior width, but the result could now fight the current compare/grid geometry instead of fitting it.

### Assumptions
- It is acceptable to forget a restored width once it overshoots the current side-by-side target by a meaningful margin, because the user's intent is better represented by the current layout target than by a stale width captured under materially different space.
- It is acceptable to use a modest relative tolerance instead of a more complex per-layout persistence model, because this pass is solving a local predictability issue rather than inventing a new sizing system.
- It is acceptable to keep narrower-than-target restored widths, because those still reflect an intentional user choice without forcing an oversized dominant tile.

### Decision and rationale
- Keep restoring widths from `Single view`, but only when the restored value is still reasonably close to the current compare/grid target width.
- Clamp the candidate width to the current `maxWidth`, then drop it entirely if it exceeds roughly 135% of the current target width.
- This is better than always restoring because it preserves continuity on mild size changes while preventing stale hero-tile widths from hijacking tighter layouts.
- This is also better than snapping every return to the default target width, because users still keep their manual sizing when the surrounding layout has only changed a little.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add `getSingleViewLayoutRestoreWidth(...)`, which filters restored widths against the current target/max bounds before applying them after a `Single view` exit.
- Updated the same restore effect in `SessionTileWrapper` to use that helper instead of blindly reapplying any remembered width whenever width resizing becomes available again.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` with direct coverage for the keep-vs-forget restore-width rule.
- Updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new helper-driven restore path.

### Verification
- `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ⚠️ The wrapper unexpectedly executed the broader desktop suite; the changed tests passed, but the run still failed because of an unrelated pre-existing assertion in `src/renderer/src/components/agent-progress.performance.test.ts`.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` could attach to a live renderer target, but not to a trustworthy tiled-sessions surface, so no direct runtime validation was recorded for this iteration.

### Tradeoffs considered
- Always restoring the remembered width is simpler, but it keeps the sticky oversized-layout problem open.
- Forgetting the remembered width on every `Single view` exit would be predictable, but it would throw away useful continuity for mild window-size changes.
- A more adaptive rule based on sidebar width, floating panel width, and column count transitions could be richer later, but it would add more moving parts than needed for this local fix.

### What still needs attention
- The 135% tolerance is intentionally conservative and should still be validated on the real sessions surface with manual width adjustments across several window/sidebar widths.
- The broader question of when floating panel pressure should proactively change or hint at tile layout remains open; this pass only prevents stale restore widths from worsening that pressure.
- If runtime validation shows that users still lose too much intentional width after moderate layout changes, the next follow-up is tuning the tolerance or basing it on column-count transitions rather than a single relative threshold.

## Iteration 39 - Make clipped multi-tile transcripts read like an intentional preview

### Area inspected
- `tiling-ux.md` latest entries to avoid repeating the recent width-lock, single-view restore, and panel-edge work
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx` to confirm how focused vs unfocused tile state is passed into `AgentProgress`
- lightweight `electron_execute` inspection to see whether a real sessions surface was reachable before editing

### Repro steps reviewed
1. Re-read the ledger tail and intentionally choose a not-recently-investigated tile-density problem instead of another layout-switch or panel-width pass.
2. Inspect the tile variant in `AgentProgress` to see how unfocused multi-tile sessions limit transcript history and what copy explains that state.
3. Trace `sessions.tsx` to confirm that non-focused, non-expanded tiles intentionally render in a compact preview mode rather than a broken or partially loaded state.
4. Attach `electron_execute` to the available renderer target; the live window was still the settings/chats surface at `http://localhost:19007/` rather than a trustworthy tiled sessions page, so runtime validation of this exact tile workflow was not practical.

### UX problem found
- Unfocused multi-tile session tiles intentionally show only the latest transcript slice, but the existing inline notice only said `Showing latest 6 of N updates`.
- That described the clipping mechanically without explaining that the tile was in an intentional recent-updates preview state.
- The result made dense multi-tile transcripts feel more like accidental truncation than a deliberate tradeoff, especially when several active sessions each had long histories.

### Assumptions
- It is acceptable to solve this with clearer preview-state language instead of another control because the recovery path already exists: focusing the tile or opening `Single view`.
- It is acceptable to keep the change local to the transcript callout rather than adding more persistent header chrome, because the immediate ambiguity happens exactly where users encounter clipped history.
- Focused source-level tests plus `typecheck:web` are sufficient for this pass because the change is renderer-local and the available live Electron surface was not the real tiled sessions view.

### Decision and rationale
- Keep the existing transcript limiting behavior for unfocused multi-tile tiles.
- Replace the generic hidden-count strip with a clearer `Recent updates preview` callout that explicitly says how many earlier updates are hidden.
- Add a short recovery sentence inside the same callout: `Focus this tile or open Single view for full history.`
- This is better than adding another button because it removes ambiguity without increasing action density, and better than leaving the old copy because it tells users both why the tile looks clipped and how to get the full session back.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to compute `showTileTranscriptPreviewHint` and `hiddenTileTranscriptCountLabel` for compact multi-tile transcript previews.
- Replaced the old `Showing latest ...` strip in the same file with a two-line `Recent updates preview` callout that explains hidden history and points users to focus or `Single view` for the full transcript.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new preview wording and the renderer conditions that trigger it.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` attached successfully, but the reachable window remained the settings/chats surface instead of tiled sessions, so no trustworthy runtime validation of the preview copy was available for this iteration.

### Tradeoffs considered
- Leaving the old `Showing latest ...` copy would be the smallest delta, but it keeps dense tiles looking accidentally clipped.
- Adding a dedicated `Show full history` button inside each preview would be more explicit, but it would add another control to already dense tile chrome for an action the tile already supports via focus and `Single view`.
- Moving the preview explanation into the tile header would make the state more persistent, but it would also compete with existing title/action affordances and add noise even when users are looking directly at the transcript area.

### What still needs attention
- This new preview wording should still be validated on a real tiled sessions surface with several long-running sessions to make sure it feels helpful rather than repetitive.
- If users still miss the distinction between preview tiles and focused tiles, the next likely follow-up is a lightweight header-level `Preview` badge that only appears when earlier transcript history is hidden.
- The broader open layout-allocation thread remains separate; this pass clarifies clipped transcript density inside tiles, not how much space tiled sessions receive relative to sidebars or the floating panel.

## Iteration 39 - Move the reorder handle onto the tile edge instead of floating above it

### Area inspected
- `tiling-ux.md`, specifically the drag/reorder follow-up left open in Iteration 36 rather than redoing the recent `Single view` width work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- a lightweight desktop runtime attach via `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` plus `electron_execute`

### Repro steps reviewed
1. Re-read the latest ledger entries and pick the still-open drag-handle placement issue instead of another width-restore or header-density pass.
2. Inspect the drag source in `SessionTileWrapper` and confirm that the per-tile reorder affordance still renders as a pill above the tile chrome using `absolute left-3 -top-2 ...`.
3. Reconfirm the earlier tradeoff: the handle should stay separate from the main tile content so scrolling, text selection, and content interaction remain unaffected.
4. Launch the desktop app and attach `electron_execute`; the renderer was reachable, but the trustworthy surface available was the chats/settings UI rather than a live tiled-sessions layout, so runtime validation for tiled drag placement remained limited.

### UX problem found
- The reorder handle was still visually floating above the tile rather than feeling attached to it.
- That created two risks: it could crowd the top edge where drop indicators and neighboring tiles already compete for attention, and it could look visually detached from the tile it controls.
- The earlier drag-affordance pass solved discoverability, but the handle still felt like an extra chip hovering near the tile instead of a clear edge grab point.

### Assumptions
- It is acceptable to make the handle more compact as long as it remains persistently visible and keeps a strong tooltip/ARIA label, because the sessions header already explains that tiles can be reordered.
- It is acceptable for the label to expand mainly on hover/focus/drag instead of always taking width, because the per-tile control's main job is to mark the grab surface without adding constant chrome to every tile.
- It is acceptable to keep the handle on the tile edge rather than moving it fully into the header, because that preserves separation from tile actions and avoids increasing header action density.

### Decision and rationale
- Replace the floating top chip with a compact edge-attached reorder tab anchored to the tile's left edge near the header band.
- Keep the grip icon always visible, but let the `Reorder` text expand on hover, focus, or active drag.
- This is better than keeping the always-wide floating chip because it reduces vertical crowding and feels more physically attached to the controlled tile.
- This is better than moving the handle fully into the header because it avoids competing with tile title/action chrome while still staying easy to target.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to replace the above-tile reorder chip with an edge-attached tab (`absolute -left-2 top-4 ... rounded-r-full rounded-l-md border-l-0`).
- Added focused class-name helpers so the handle can stay persistently visible while the `Reorder` label expands only on hover, focus, or drag.
- Updated the tooltip and ARIA copy to `Drag this handle to reorder session` so the more compact visual treatment still has explicit intent.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new handle placement and expanding-label affordance.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` launched successfully and `electron_execute` attached to a live renderer, but the reachable UI was still chats/settings rather than a trustworthy tiled-sessions surface, so no direct live drag validation was recorded for this iteration.

### Tradeoffs considered
- Keeping the current floating chip would preserve the clearest always-visible text label, but it would leave the vertical crowding/clipping concern open.
- Making the edge handle icon-only all the time would reduce chrome even further, but it would overcorrect and weaken discoverability too much.
- Moving the entire reorder control into the tile header would feel more conventional in some apps, but here it would compete with existing header actions and density.

### What still needs attention
- This edge-attached handle should still be visually validated on a real sessions surface across one-column, two-column, and wrapped grids to confirm that the hover-expanding label does not clash with tile content.
- The broader panel-versus-tiles width-allocation question remains open; this pass improves reorder clarity but does not change when tiles lose columns under sidebar or floating-panel pressure.
- If runtime validation shows that the expanding label still feels too subtle, the next likely follow-up is adding a slightly stronger edge highlight or micro-tooltip when the tile first becomes draggable.

## Iteration 40 - Make the floating-panel width recovery tab directly actionable

### Area inspected
- `tiling-ux.md`, specifically the still-open floating-panel versus tiled-session width-pressure thread rather than the most recent drag-handle or transcript-preview passes
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight Electron renderer inspection before editing to see whether the current surface exposed a trustworthy tiled-sessions or floating-panel workflow

### Repro steps reviewed
1. Re-read the ledger and intentionally choose a not-recently-implemented floating-panel follow-up instead of revisiting the latest tile-local chrome work.
2. Inspect `PanelResizeWrapper` to compare the visible idle `Shrink width` edge tab with the actual interactive resize handles.
3. Attach `electron_execute` before editing; the reachable renderer was still the main settings surface at `http://localhost:19007/`, so no trustworthy live tiled-session or floating-panel repro was available.
4. Check whether the visible edge tab was itself actionable or only a passive visual reminder while the real recovery interaction remained hidden on the handle beneath it.

### UX problem found
- The left-edge `Shrink width` reminder improved discoverability, but it still rendered inside the non-interactive affordance layer.
- That made the cue feel slightly deceptive: it looked like an edge tab users could act on directly, yet it was only a visual reminder while the actual recovery gesture still depended on rediscovering the narrow resize handle.
- In crowded tiled workflows, that extra indirection weakens the value of the reminder exactly when users most need a fast, obvious way to give space back to the sessions area.

### Assumptions
- It is acceptable to keep drag-resize behavior on the existing edge handle and make the visible tab primarily a recovery affordance, because the goal is to make the visible cue actionable without reworking the underlying resize interaction.
- It is acceptable for the tab to support direct shrink via double-click and keyboard activation, because that matches the existing shrink interaction already advertised on hover and improves accessibility without adding a new concept.
- Focused affordance tests, desktop web typecheck, and a documented-but-unhelpful Electron attach are sufficient for this pass because the change is renderer-local and the live renderer surface in this environment was not the relevant tiled-session or panel workflow.

### Decision and rationale
- Keep the current panel resize mechanics, hover hints, and left-edge recovery reminder label unchanged.
- Move the resting `Shrink width` cue out of the purely decorative layer and render it as a focusable edge-tab button wired to the same width-compaction path.
- When hovered or focused, let that tab highlight the left resize edge so the visible cue and the resize surface reinforce each other.
- This is better than leaving the tab visual-only because it removes a misleading gap between appearance and behavior, and better than adding a separate reset button because it keeps the recovery action attached to the edge already competing with tiled sessions for space.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add `RESTING_WIDTH_RECOVERY_HINT_TITLE` plus `handleRestingWidthRecoveryHintAction`, which reuses the existing left-edge compact-resize path.
- Moved the resting `Shrink width` cue out of the pointer-events-free overlay and rendered it as a single focusable edge-tab button so the visible reminder now matches the actionable control.
- Wired that new tab to hover/focus the left resize edge and to trigger width compaction on double-click or keyboard activation, with explicit title and ARIA copy.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new actionable-tab wiring and accessibility hooks.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` attached successfully before editing, but the reachable renderer was still the settings surface at `http://localhost:19007/` rather than a trustworthy tiled-sessions or floating-panel workflow, so no direct runtime panel validation was available for this iteration.

### Tradeoffs considered
- Leaving the current tab visual-only would be lower churn, but it keeps the cue looking more actionable than it really is.
- Making the tab itself start drag-resize would align even more tightly with the edge handle, but it would require a broader resize-handle interaction change than this local follow-up needs.
- Adding a separate compact button inside the panel would be explicit, but it would add new chrome on a surface already under width pressure and duplicate the edge-owned recovery action.

### What still needs attention
- This actionable edge tab should still be validated on a real floating panel while tiled sessions are visible behind it, especially to confirm the hover/focus highlight feels obvious enough without interfering with drag resizing on the left edge.
- The broader panel-versus-tiles width allocation problem remains open; this pass improves recovery immediacy after the panel is already wide, not how aggressively the panel consumes width in the first place.
- If live validation shows users still try to drag the tab itself, the next likely follow-up is deciding whether the left resize handle should widen into the tab footprint so the visible cue also becomes a larger drag target.

## Iteration 40 - Make single-view browsing less blind on compact headers

### Area inspected
- `tiling-ux.md`, specifically the still-open need for clearer focused-layout controls instead of repeating the latest drag-handle work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- a lightweight live renderer attach with `electron_execute`

### Repro steps reviewed
1. Re-read the latest ledger entries and avoid recently revisiting drag-handle or width-restore work.
2. Inspect the `Single view` header controls in `sessions.tsx`, especially the focus hint chip plus previous/next buttons.
3. Confirm that on compact headers the focused-session chip drops the session title, leaving only `X of Y` on the left and two generic arrow buttons on the right.
4. Attach to the running renderer with `electron_execute`; the reachable surface was the settings/chats UI at `http://localhost:19007/`, not a trustworthy live tiled-sessions state, so runtime validation for this specific header behavior remained code- and test-driven.

### UX problem found
- In `Single view`, previous/next browsing still depended too much on generic arrow buttons whose tooltip and ARIA copy did not say where they would go.
- When the sessions header got compact, the focused-session hint intentionally hid the session title to save space, but that also made the browse controls feel disconnected from the session they were cycling through.
- Pending continuation tiles could also fall back to an awkward synthetic ID-based label in these focused-layout hints.

### Assumptions
- It is acceptable to spend a small amount of header width on a compact browse label when the full focused-session hint can no longer show the current title, because that swaps ambiguity for context instead of adding net-new control clutter.
- It is acceptable to use destination-aware tooltips/ARIA labels for previous/next buttons, because `Single view` browsing is a high-intent action and the extra specificity reduces guesswork.
- It is acceptable to label pending focused sessions as `Continuing session`, because that is more product-meaningful than exposing an internal pending session ID.

### Decision and rationale
- Keep the existing focused-layout structure, but make the browsing group itself carry more context when the header is tight.
- Add destination-aware labels for the previous/next buttons so they explain which session they will reveal, or that the user is already at the first/last session.
- Show a compact current-session browse label between the arrows only when the main focused-session hint can no longer show the full session title.
- This is better than adding more separate header chips because it improves the existing browse affordance right where the decision happens.
- This is better than leaving the arrows generic because it reduces the "blind carousel" feeling without changing layout mode behavior or tile sizing rules.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so focused-layout session labels come from a shared `focusableSessionLabelById` map rather than ad hoc lookups.
- Improved `getSessionTileLabel(...)` to return `Continuing session` for pending synthetic IDs instead of exposing `pending-*` fragments.
- Added previous/next destination labels and edge-state copy (`Already showing the first/last session in Single view`) for `Single view` browse buttons.
- Added a compact inline browse label between the arrows on tight headers, showing the current session title when possible or `index/count` on very compact widths.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new focused-layout labeling and browse-context behavior.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` successfully attached to a live renderer and confirmed the desktop app was reachable, but the available runtime surface was settings/chats rather than a trustworthy tiled-sessions scenario, so this iteration's UX validation remains source- and test-backed.

### Tradeoffs considered
- Leaving the arrows icon-only with generic labels would preserve the lightest chrome, but it would keep `Single view` browsing ambiguous exactly when the header becomes more compressed.
- Moving all focused-session context into a new separate chip would add more chrome and split the mental model further across the header.
- Showing the current session title inside the browse group at all widths would be clearer in isolation, but it would duplicate the roomy-header focus chip and make the control cluster denser than necessary.

### What still needs attention
- This focused-layout browse label should still be visually validated on a real multi-session tiled surface to ensure it wraps cleanly beside layout buttons at several sidebar widths.
- The broader panel-versus-tiles width-allocation issue is still open; this pass clarifies `Single view` browsing but does not change when compare/grid layouts collapse under width pressure.
- If future runtime validation shows that users still miss the meaning of `Single view`, the next likely follow-up is a more explicit transition cue when switching into or out of the focused layout.

## Iteration 41 - Add one-click panel width recovery from tiled-session layout pressure

### Area inspected
- `tiling-ux.md`, specifically the still-open panel-versus-tiles width-allocation note from iterations 39 and 40
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- panel resize IPC paths in `apps/desktop/src/main/tipc.ts`, `apps/desktop/src/main/window.ts`, and `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- a lightweight live renderer attach with `electron_execute`

### Repro steps reviewed
1. Re-read the latest ledger entries and avoid repeating the recent single-view browse-label work.
2. Inspect the width-pressure states in `sessions.tsx`, especially the passive `Make room` and `Tight fit` hints.
3. Trace how the floating panel already compacts itself from the left edge inside `panel-resize-wrapper.tsx` and confirm the same `updatePanelSize` / `savePanelModeSize` IPC flow is available from the sessions page.
4. Attach to the running renderer with `electron_execute`; the reachable surface was still the settings/chats UI at `http://localhost:19007/`, not a trustworthy live tiled-sessions-plus-panel workflow, so runtime validation for this specific scenario remained code- and test-driven.

### UX problem found
- When compare or grid layouts are already stacked, or about to stack, the sessions header explains the problem but does not offer the quickest local fix.
- The hint text already tells users to shrink the floating panel, but that recovery path still requires them to remember a separate panel affordance or manually drag the panel edge.
- This makes the width conflict feel descriptive rather than actionable right at the moment tiled sessions lose clarity.

### Assumptions
- It is acceptable to add one compact recovery button beside the existing layout controls when width pressure is active, because it replaces a multi-step workaround with a direct action rather than adding persistent new chrome.
- It is acceptable to shrink the floating panel by requesting width `0` with a left-edge resize anchor, because the existing main-process panel sizing logic already clamps that to the current mode's minimum safe width and preserves the panel's content-facing edge behavior.
- It is acceptable to keep this action available even when the panel might already be near its minimum width, because the no-op cost is low and avoids adding more cross-window state bookkeeping to a local UX fix.

### Decision and rationale
- Keep the existing stacked / near-stacked hint chips, but add a direct `Shrink panel` recovery action whenever those width-pressure states are active.
- Reuse the same panel resize persistence path the floating panel already uses so the sessions page does not invent a new abstraction for reclaiming width.
- Keep the button compact and adaptive: text on normal/compact headers, icon-only on very tight headers, spinner while the IPC action is in flight.
- This is better than leaving the hints passive because it turns advice into an immediate fix at the exact point where layout clarity is lost.
- This is better than introducing a broader auto-resize heuristic because it is a smaller, safer local change that still reduces ambiguity and effort.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add local panel size/mode guards plus `handleShrinkPanelForLayoutPressure`, which fetches the current panel size and mode, compacts width through `tipcClient.updatePanelSize({ width: 0, resizeAnchor: "left" })`, and persists the resulting size.
- Added a context-aware `Shrink panel` button to the sessions header whenever compare/grid are stacked or near stacking, including icon-only behavior for very tight headers and a spinner while the action runs.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new width-recovery action, IPC wiring, and header affordance rendering.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` successfully attached to a live renderer before editing, but the reachable runtime surface was still settings/chats rather than a trustworthy tiled-sessions-plus-floating-panel scenario, so this iteration's behavior validation remains source- and test-backed.

### Tradeoffs considered
- Leaving the existing `Make room` / `Tight fit` hints alone would keep chrome lighter, but it preserves a frustrating gap between noticing layout pressure and fixing it.
- Auto-shrinking the floating panel as soon as width pressure appears could be even faster, but it would be a more opinionated cross-window behavior change with a higher risk of surprising users.
- Adding the recovery action inside the hint chip itself would keep problem and action visually fused, but it would make the left-side status area denser and more wrap-prone than the existing right-side control cluster.

### What still needs attention
- This new recovery action should still be validated on a real sessions-plus-panel workflow to confirm the button appears at the right thresholds and that the resulting width change feels obvious enough without toast confirmation.
- The broader panel-versus-tiles allocation issue is still open; this pass speeds up recovery after width pressure is detected, but it does not decide whether the panel should proactively stay narrower while tiled sessions are active.
- If live validation shows users want even less friction, the next likely follow-up is deciding whether stacked-state detection should also surface a stronger inline recommendation or an optional automatic panel-width suggestion.

## Iteration 41 - Keep the way back from Single view readable on very compact headers

### Area inspected
- `tiling-ux.md`, specifically the latest focused-layout notes so this pass did not repeat the most recent browse-label work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and choose a focused-layout follow-up that had not just been implemented.
2. Inspect the `Single view` header controls in `sessions.tsx`, especially the restore button behavior across compact and very-compact header widths.
3. Confirm that the current restore affordance still collapsed all the way to icon-only on the tightest header state.
4. Attempt a lightweight runtime check with `electron_execute`; the reachable renderer was the `Chats` surface at `http://localhost:19007/` rather than a trustworthy tiled-sessions view, so this iteration stayed code- and test-validated.

### UX problem found
- `Single view` already exposes a restore path back to the remembered multi-tile layout, but that button became icon-only on the very tightest headers.
- In that compact state, the relationship between `Single view` and its previous layout became harder to scan, especially because the same header is already compressing other context for space.
- The result made the transition feel a little more implicit than it needed to be right where users most need a quick, confident way back to `Compare` or `Grid`.

### Assumptions
- It is acceptable to spend a small amount of width on a one-word `Back` label at the tightest header state, because that label carries more transition clarity than a purely icon-only affordance.
- It is acceptable to keep the fuller `Back to Compare` / `Back to Grid` label on roomier headers, because those states can afford the extra specificity without reopening the header-density problem.
- Focused source-based tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled-sessions runtime surface was available.

### Decision and rationale
- Keep the existing restore behavior and the full `Back to ...` label on normal/compact headers.
- Replace the icon-only very-compact state with a compact `Back` label instead of hiding all text.
- Keep the tighter padding for that very-compact variant so the button stays readable without taking as much room as the full restore label.
- This is better than leaving the button icon-only because it restores the missing transition cue, and better than always showing the full layout name because it avoids reintroducing the same narrow-header crowding that earlier iterations were trimming.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive a `singleViewRestoreLabel` that becomes `Back` on very compact headers and `Back to ${restoreLayoutOption.label}` otherwise.
- Updated the same file so the restore button keeps slightly tighter padding for the very-compact `Back` variant.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new compact restore-label behavior.

### Verification
- `electron_execute` attached successfully, but the reachable renderer was `http://localhost:19007/` on the `Chats` surface rather than a trustworthy tiled-sessions workflow, so no direct runtime validation was recorded for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the restore button icon-only on very compact headers would keep the lowest chrome, but it also keeps the exit path more implicit than it should be.
- Showing the full `Back to Compare/Grid` label at every width would maximize explicitness, but it would spend too much horizontal space in the exact header state already under the most pressure.
- Adding another dedicated `Single view` state chip or transition hint would be more explicit, but it would also add more chrome instead of making the existing affordance do a better job.

### What still needs attention
- This compact `Back` label should still be visually validated on a real sessions surface at several sidebar widths to make sure it stays readable beside the browse controls and layout buttons.
- The broader panel-versus-tiles width-allocation issue remains open; this pass improves `Single view` exit clarity, not when multi-tile layouts lose columns.
- If live validation still shows users missing the relationship between `Single view` and the previous layout, the next likely follow-up is a stronger explicit transition cue when entering focused mode, not just when leaving it.

## Iteration 42 - Make compact Single view state more explicit without widening the header

### Area inspected
- `tiling-ux.md`, especially the most recent focused-layout entries so this pass picked up the next unresolved clue instead of repeating the last change
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the latest ledger notes and choose the focused-layout gap that still remained open after the compact `Back` label work.
2. Inspect the `Single view` summary chip in `sessions.tsx`, especially how it reads once the session header becomes compact and the main focused-session label disappears.
3. Confirm that the chip still spent width on a verbose `1 of N` count while the visible header state itself became less explicit on tighter widths.
4. Attempt a lightweight runtime inspection with `electron_execute`; the reachable renderer was still the `Chats` surface at `http://localhost:19007/` rather than a trustworthy tiled-sessions page, so this pass stayed code- and test-validated.

### UX problem found
- The previous iteration made the way back from `Single view` clearer, but entering and being in `Single view` was still somewhat implicit once the header tightened.
- On compact headers, the focused summary chip kept a relatively wide `1 of N` badge while not surfacing the mode name itself.
- That meant the most space-constrained state was still the least explicit about being in a one-up layout, even though that is exactly where the tile grid context has already been compressed away.

### Assumptions
- It is acceptable to spend a small amount of chip space on a visible `Single` mode label for compact headers, because that label restores state clarity in the exact layout state where the main session label has been suppressed.
- It is acceptable to shorten the visible position badge from `1 of N` to `1/N` only on compact headers, because the full wording still remains in the tooltip title while the denser label better fits the constrained header.
- Source-based tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and the available Electron renderer target was not a trustworthy sessions surface.

### Decision and rationale
- Keep roomy `Single view` headers session-centric so the visible chip can continue emphasizing the current session label when there is enough space.
- On compact headers only, prepend an explicit `Single` mode label inside the focused summary chip.
- Also switch the visible focused-position badge to `current/total` on compact headers while keeping the tooltip text verbose.
- This is better than leaving the compact chip as-is because it makes the one-up state easier to scan without adding a brand-new control, and better than always showing a longer `Single view` label because the shorter `Single` cue preserves the narrow-header density gains from earlier iterations.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showFocusedLayoutModeLabel`, `focusedLayoutModeLabel`, and a width-aware `focusedLayoutCountLabel` for the focused summary chip.
- Updated the same file so compact headers show a visible `Single` label and a denser `current/total` count badge while roomy headers keep the prior session-centric presentation.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the compact `Single` label and condensed count behavior.

### Verification
- `electron_execute` attached successfully, but the reachable renderer was still `http://localhost:19007/` on the `Chats` surface rather than a trustworthy tiled-sessions workflow, so no direct runtime validation was recorded for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the compact focused chip unchanged would keep the absolute minimum chrome, but it also keeps the one-up state less explicit precisely when the surrounding tile context has disappeared.
- Showing `Single view` in full inside the chip would be more verbose, but it would spend too much width in the header state already under the most pressure.
- Adding a separate new state chip or banner would be more forceful, but it would add more UI surface area instead of improving the clarity of the summary element users already scan.

### What still needs attention
- This compact `Single` chip should still be visually validated on a real sessions surface, especially beside the browse controls at several sidebar widths, to confirm the shorter count plus mode label reads well in practice.
- The broader panel-versus-tiles width-allocation question remains open; this pass improves focused-layout state clarity, not when multi-tile layouts lose columns.
- If live validation still shows that users miss the transition into `Single view`, the next likely follow-up is deciding whether entering focused mode needs a stronger temporary cue or animation rather than more persistent header chrome.

## Iteration 43 - Stop suggesting floating-panel recovery when the panel cannot actually shrink

### Area inspected
- `tiling-ux.md`, specifically the open panel-versus-tiles width-pressure thread so this pass did not repeat the recent focused-layout work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/main/tipc.ts`
- `apps/desktop/src/main/panel-recovery-actions.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger entries and choose an area that had not just been investigated.
2. Reinspect the compare/grid width-pressure hints and the existing `Shrink panel` recovery button in `sessions.tsx`.
3. Trace what panel state the renderer could already read (`getPanelMode`, `getPanelSize`, panel resize events) and identify the missing piece needed to decide whether panel shrink is still actionable.
4. Confirm that the earlier recovery button could still appear even when the floating panel was already at its minimum effective width, leaving the copy and action more optimistic than the real state.

### UX problem found
- The prior iteration added a useful `Shrink panel` recovery action, but it still assumed that shrinking the panel was always relevant whenever compare/grid felt width pressure.
- In practice, that advice becomes misleading when the floating panel is already at its minimum width or not visible, because the sessions header keeps implying there is still panel width left to reclaim.
- That weakens trust in the recovery affordance: users can be told to take an action that no longer materially helps.

### Assumptions
- It is acceptable to add one small renderer-safe panel-state read endpoint in TIPC, because the sessions page needs just enough cross-window context to decide whether an existing recovery affordance is truthful.
- It is acceptable to hide the `Shrink panel` action until the sessions page can confirm the panel is both visible and wider than its current mode's minimum width, because avoiding misleading recovery advice is more important than always showing the button immediately.
- It is acceptable to keep this state synchronized only when width-pressure hints are active and on panel-size changes, because that limits complexity and cost for a local UX refinement.

### Decision and rationale
- Keep the existing width-pressure hints and the earlier recovery action, but only surface the `Shrink panel` button when the floating panel can actually shrink further.
- Add alternate tooltip copy for stacked / near-stacked hints that drops the panel recommendation once the panel is already effectively compact.
- Reuse current panel sizing rules from the main process by exposing the current panel mode, visibility, and minimum width through TIPC instead of duplicating width constraints in the renderer.
- This is better than leaving the earlier button always visible because it keeps the recovery affordance trustworthy.
- This is better than introducing a broader auto-allocation heuristic because it fixes a concrete ambiguity with a much smaller, safer change.

### Code changes
- Added `getFloatingPanelLayoutState` to `apps/desktop/src/main/tipc.ts` so the renderer can read whether the floating panel is visible, which mode it is in, and what its current minimum width is.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track `PanelLayoutPressureState`, refresh it when width-pressure hints are active, and re-sync it on `rendererHandlers.onPanelSizeChanged`.
- Updated the same sessions page so the `Shrink panel` action only appears when the panel is visible and wider than its current minimum width.
- Added `titleWithoutPanelRecovery` variants for stacked / near-stacked hints so tooltip guidance no longer tells users to shrink the floating panel when that advice is no longer actionable.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/main/panel-recovery-actions.test.ts` to lock in the new panel-state gating and TIPC exposure.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/main/panel-recovery-actions.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:node` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- No trustworthy live tiled-sessions runtime surface was available for this pass, so validation remains source-, test-, and typecheck-backed.

### Tradeoffs considered
- Keeping the earlier button always visible would preserve the most direct recovery path, but it would continue suggesting an action that may already be exhausted.
- Hiding the button whenever panel state is unknown creates a small chance of a brief missing affordance while state loads, but that is still better than presenting a confidently wrong action.
- Duplicating panel min-width rules directly in the renderer would avoid a new TIPC endpoint, but it would be more fragile and easier to let drift from the main-process sizing rules.

### What still needs attention
- This new gating should still be runtime-validated on a real tiled-sessions-plus-floating-panel workflow, especially around visibility toggles and transitions between waveform and text-input panel modes.
- The broader panel-versus-tiles allocation problem is still open; this pass makes the recovery advice more truthful, not more proactive.
- If future runtime validation shows the remaining panel-state lag around show/hide transitions is noticeable, the next likely follow-up is a dedicated visibility-change signal rather than further widening the sessions header UI.

## Iteration 44 - Re-sync tiled layout pressure when floating-panel visibility or mode changes

### Area inspected
- `tiling-ux.md`, specifically Iteration 43's follow-up note about possible lag around panel show/hide transitions
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/main/window.ts`
- `apps/desktop/src/main/renderer-handlers.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/main/panel-recovery-actions.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger entry and intentionally choose the not-yet-addressed follow-up around panel visibility / mode transition lag.
2. Reinspect how `sessions.tsx` keeps `panelLayoutPressureState` in sync while compare / grid recovery hints are visible.
3. Trace which main-process events already reach the renderer and confirm that only `onPanelSizeChanged` was wired into the sessions recovery path.
4. Check the available Electron renderer target before and after the code change; it was reachable at `http://localhost:19007/`, but the visible surface did not expose the tiled session layout controls needed for trustworthy live validation.

### UX problem found
- Iteration 43 made the `Shrink panel` action more truthful, but the sessions page still refreshed that truth only on initial hint display and panel size changes.
- The floating panel can become more or less relevant to tiled layouts when it is shown, hidden, or switched between `normal`, `agent`, and `textInput` modes even if no size-change event fires.
- That creates a small but real stale-state window where recovery hints can keep recommending panel-related actions after the panel disappeared or after its effective minimum width changed.

### Assumptions
- It is acceptable to add one lightweight renderer event for floating-panel layout-state changes, because the stale behavior came from missing cross-window timing rather than incorrect layout math.
- It is acceptable for the sessions page to keep using `getFloatingPanelLayoutState()` as the source of truth rather than duplicating state in the event payload, because that keeps the signal generic and centralizes the sizing rules in the main process.
- Source-based tests plus desktop typechecks are sufficient for this pass because the running Electron surface was not a trustworthy tiled-session workflow even though the renderer was reachable.

### Decision and rationale
- Add a generic `onFloatingPanelLayoutStateChanged` renderer signal and emit it when the panel is shown, hidden, or changes mode.
- Keep the existing `getFloatingPanelLayoutState()` read path in `sessions.tsx`, but re-sync it from both panel-size changes and the new layout-state signal whenever width-pressure hints are active.
- This is better than trying to infer show/hide or mode changes from size events because those transitions are logically distinct and do not always resize the panel.
- This is better than widening the sessions UI with more persistent panel warnings because it improves correctness of the existing recovery copy instead of adding new chrome.

### Code changes
- Added `onFloatingPanelLayoutStateChanged` to `apps/desktop/src/main/renderer-handlers.ts`.
- Updated `apps/desktop/src/main/window.ts` to add `notifyFloatingPanelLayoutStateChanged()` and send that event on panel show, panel hide, and real panel-mode changes.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the compare/grid recovery state re-syncs from both `onPanelSizeChanged` and `onFloatingPanelLayoutStateChanged` while width-pressure hints are visible.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/main/panel-recovery-actions.test.ts` to lock in the new cross-window signal.

### Verification
- `electron_execute` could reach the running renderer at `/`, but the visible page did not expose the tiled-session layout controls (`aria-label="Session tile layout"` was absent), so no trustworthy live tiled-workflow validation was recorded.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/main/panel-recovery-actions.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:node` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Emitting full panel state in the renderer event would reduce one async read, but it would duplicate data-shape responsibilities and make future consumers more coupled to the event payload.
- Polling panel state while recovery hints are visible would eventually converge, but it would be noisier and less deterministic than responding to explicit show/hide/mode transitions.
- Doing nothing would keep the implementation smaller, but it would leave the sessions recovery hints slightly less trustworthy during exactly the cross-window transitions users are likely to notice.

### What still needs attention
- This should still be visually validated in a real tiled multi-session workflow with the floating panel toggled visible/hidden and switched between waveform, progress, and text-input modes.
- The underlying product question of how aggressively the app should help users rebalance sidebar width, tiled sessions, and floating-panel width is still open.
- If runtime validation shows that users still miss why layouts stack under width pressure, the next follow-up should probably improve explanation or recovery prioritization rather than adding more event plumbing.

## Iteration 45 - Offer a direct hide-panel recovery when the floating panel is already compact

### Area inspected
- `tiling-ux.md`, specifically the newly-updated panel-versus-tiles recovery thread to avoid repeating the visibility/mode sync work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger entries and look for a still-open width-pressure improvement that had not already been implemented.
2. Reinspect the compare/grid recovery controls in `sessions.tsx`, especially the state where the floating panel is visible but cannot shrink any further.
3. Confirm that the sessions header could now stop suggesting `Shrink panel`, but still offered no direct in-context action to reclaim that width when hiding the panel was the remaining obvious recovery step.
4. Re-check the available Electron renderer target; it was still reachable but still did not expose a trustworthy tiled-session control surface for live validation.

### UX problem found
- After Iterations 43 and 44, the sessions page became more truthful about when shrinking the panel was possible, but it still left users at a dead end once the panel was already at minimum width.
- In that state, the floating panel can still be the clearest local cause of stacked or nearly-stacked tiled sessions, yet the header offers no immediate action to reclaim the space.
- That makes the recovery flow feel incomplete: the app correctly stops suggesting an impossible action, but does not surface the next-most-reasonable one.

### Assumptions
- It is acceptable to add one more compact recovery action in the sessions header when it is conditional, local, and only appears while tiled layouts are actually under width pressure.
- It is acceptable to scope the new action to the case where the panel is visible but cannot shrink further, because showing both `Shrink panel` and `Hide panel` at once would add unnecessary decision load.
- Renderer-source tests plus web typecheck are sufficient for this pass because the change is renderer-local and the currently reachable runtime surface still is not a trustworthy tiled multi-session workflow.

### Decision and rationale
- Add a `Hide panel` action beside the existing tiled-layout recovery controls, but only when the floating panel is visible and already at its effective minimum width.
- Keep `Shrink panel` as the first-line, less disruptive action whenever the panel can still narrow further.
- Optimistically mark the panel as hidden in local recovery state after the hide request so the stale action disappears immediately instead of lingering until the next async sync.
- This is better than doing nothing because it turns a previously exhausted recovery path into a complete one without widening the UI in the common case.
- This is better than always showing both actions because it reduces ambiguity and preserves the header's density until the stronger action is actually needed.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track `isHidingPanelForLayoutPressure`, derive `showHidePanelForLayoutPressure`, and render a compact `Hide panel` button with width-pressure-aware copy.
- Updated the same file to call `tipcClient.hidePanelWindow({})`, optimistically flip `panelLayoutPressureState.isVisible` to `false`, and show a dedicated failure toast if hiding the panel fails.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new conditional hide action, copy, handler, disabled state, and iconography.

### Verification
- `electron_execute` still reached the app renderer, but the visible `/` surface still did not expose the tiled-session layout controls needed for a trustworthy live validation pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Showing both `Shrink panel` and `Hide panel` at the same time would make all recovery options explicit, but it would also add redundant controls and increase decision friction in the already-dense header.
- Automatically hiding the floating panel when layouts stack would reclaim space fastest, but it would be too aggressive for a local UX iteration and could feel like the app was moving windows unexpectedly.
- Leaving the user with only sidebar/widen-window guidance would keep the header simpler, but it would ignore the very panel that is still consuming the scarce width.

### What still needs attention
- This new hide-panel affordance should be runtime-validated with a real multi-session tiled layout to confirm that the action reads as a strong-but-clear fallback rather than an abrupt escape hatch.
- The tooltip copy for width-pressure chips still prioritizes sizing guidance over panel-hide guidance; if runtime feedback suggests the new button feels surprising, the next follow-up should refine the explanatory copy rather than add more controls.
- More broadly, the app still does not proactively arbitrate between sidebar width, tiled sessions, and floating-panel presence; the current work improves recovery, not automatic balance.

## Iteration 44 - Only commit tile reordering on an actual drop

### Area inspected
- `tiling-ux.md`, specifically the most recent focused-layout and floating-panel entries so this pass did not repeat those areas
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger entries and choose an area that had not just been investigated.
2. Trace the current drag/reorder flow between `SessionTileWrapper` and the sessions page handlers.
3. Confirm that reorder currently commits from `handleDragEnd` whenever a tile had been hovered earlier, regardless of whether the user actually drops on a tile.
4. Check the existing drag-affordance tests to see how much of this behavior was already locked in.
5. Attempt a lightweight runtime inspection via `electron_execute` and confirm the only reachable renderer surface was still `http://localhost:19007/` on `Chats`, not a trustworthy tiled-sessions workflow.

### UX problem found
- Tile reordering was committed on `dragend`, not on `drop`.
- That means a user can hover another tile, change their mind, and release outside the grid, yet still get a reorder they did not explicitly complete.
- This makes drag/reorder feel harder to predict and increases the chance of accidental organization changes.

### Assumptions
- It is acceptable to treat an explicit tile `drop` as the only valid reorder commit signal, because that matches the visible `Drop before` cue more closely than the earlier `dragend` behavior.
- It is acceptable to keep the current leading-edge drop cue behavior for now, because the biggest immediate UX problem was accidental commit timing rather than target visualization.
- Source-based tests plus renderer typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled-sessions runtime surface was available.

### Decision and rationale
- Move reorder commit responsibility from the sessions page `handleDragEnd` path to a new per-tile `onDrop` path.
- Keep `dragend` only for cleanup of transient drag state.
- This is better than the previous behavior because it aligns the data change with the user's explicit drop action instead of any drag termination.
- This is better than introducing more drag-state heuristics because it fixes the core ambiguity with a very small, local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` accepts `onDrop`, prevents the default browser drop behavior, and forwards actual tile drops to the parent.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so reordering happens inside `handleDrop(targetIndex)` and `handleDragEnd()` now only clears `draggedSessionId` and `dragTargetIndex`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new drop handler and guard against slipping back to drag-end-driven commits.

### Verification
- `electron_execute` reached only `http://localhost:19007/` on the `Chats` surface, so no direct tiled-sessions runtime validation was possible for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping reorder on `dragend` avoids wiring a new callback, but it keeps the accidental-reorder failure mode.
- Adding more complex pointer tracking or drop-zone heuristics could also reduce mistakes, but that would be heavier than necessary for the concrete issue observed here.
- Clearing the drop cue on more drag transitions may still be worth exploring later, but it is independent from making the commit action itself truthful.

### What still needs attention
- This should still be runtime-validated on a real tiled-sessions surface to confirm native drag events behave as expected across macOS/Electron and that the drop cue remains clear.
- The reorder cue itself may still need a follow-up pass for better discoverability or clearer cancellation feedback, especially when a drag leaves the grid after hovering a target.
- The broader question of whether reordering should also support keyboard-accessible movement remains open, but that is a separate enhancement from fixing accidental drop commits.

## Iteration 45 - Let wide two-tile Grid layouts use the full available height

### Area inspected
- `tiling-ux.md`, specifically the still-open empty-space and density thread rather than the just-finished drag/drop commit fix
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`

### Repro steps reviewed
1. Re-read the latest ledger entries and choose an area that had not just been investigated.
2. Reinspect `calculateTileHeight()` for `Grid` mode and compare its behavior for one, two, and three-plus visible sessions.
3. Confirm that a wide `2x2` layout with only two visible sessions still forces half-height cards, leaving a large empty lower half instead of using the available vertical space.
4. Trace the existing reflow and session-count-change effects to see whether tile height would update predictably if the two-tile grid height rule became adaptive.
5. Keep validation code- and test-backed because the available live renderer target remained the unrelated `Chats` surface rather than a trustworthy tiled-sessions view.

### UX problem found
- `Grid` mode treated two visible sessions like a four-cell grid even when only the top row existed.
- On wide windows, that made both tiles unnecessarily short and left a large empty lower area.
- The result weakened visual hierarchy and made the layout feel like it was wasting space rather than showing a purposeful two-tile arrangement.

### Assumptions
- It is acceptable for wide `Grid` mode with only two visible sessions to look more like an expanded two-tile row than a literal half-empty four-cell matrix, because reducing dead space is more valuable than preserving a rigid unseen second row.
- It is acceptable to keep the narrow stacked `Grid` fallback dense, because once the grid collapses to one column the more useful behavior is still to keep multiple sessions visible vertically.
- Targeted grid-math tests plus renderer typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled-sessions runtime surface was available.

### Decision and rationale
- Keep `Grid` width behavior unchanged, but let wide two-session grids use the full available tile height.
- Preserve the existing half-height behavior for true multi-row grids and for narrow stacked fallbacks.
- Add explicit height retargeting when width breakpoints or session-count changes move the layout into or out of this sparse wide-grid state.
- This is better than leaving the fixed half-height rule because it removes obvious wasted space without changing layout controls or persistence semantics.
- This is better than inventing a new dedicated `2-up grid` mode because the existing `Grid` selection can already adapt locally to the number of visible tiles.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` with `shouldUseSparseWideGridHeight()` so wide `2x2` layouts with two or fewer visible sessions can use full-height tiles.
- Updated the same file so Grid height retargets when the layout enters or leaves that sparse wide-grid state after session-count changes.
- Generalized the responsive width-reflow height check to compare previous and next computed target heights instead of hard-coding the earlier compare-only breakpoint rule.
- Updated `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the expanded two-tile grid behavior and the new retargeting paths.

### Verification
- No trustworthy live tiled-sessions renderer target was available; the reachable renderer remained the unrelated `http://localhost:19007/` `Chats` surface.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the old fixed half-height `Grid` rule would preserve a stricter grid metaphor, but it would continue wasting obvious space whenever only two sessions are present.
- Switching wide two-tile `Grid` all the way over to compare-specific width or toolbar semantics would be more explicit, but it would also make the selected layout feel less stable than necessary.
- Expanding sparse grids vertically only after manual user action could avoid any automatic height changes, but it would leave a common empty-space problem unresolved by default.

### What still needs attention
- This adaptive two-tile `Grid` height should still be runtime-validated on a real sessions surface, especially when sessions appear or disappear quickly and when sidebar width nudges the layout between sparse-wide and stacked states.
- If the full-height wide two-tile grid now feels too similar to `Compare`, a follow-up may need to differentiate the two states more through spacing or microcopy rather than forcing the older emptier geometry back.
- The broader panel-versus-tiles allocation issue remains open; this pass removes wasted vertical space inside tiles, not when the sessions area loses horizontal room to sidebars or the floating panel.

## Iteration 46 - Make the floating panel width-recovery tab behave like a normal button

### Area inspected
- `tiling-ux.md`, specifically the recent floating-panel recovery entries so this pass would build on the existing panel-versus-tiles work instead of repeating it
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`

### Repro steps reviewed
1. Re-read the ledger and choose a tiled-workflow-adjacent area that had not just been iterated on directly.
2. Reinspect the floating panel's resting width-recovery affordance, which appears after the panel has been widened beyond its minimum width.
3. Confirm that the recovery tab is rendered as a button and supports keyboard activation, but pointer activation still requires a double-click.
4. Re-check the available Electron renderer target; it remained reachable but still did not expose a trustworthy tiled desktop workflow for live validation.

### UX problem found
- The left-edge `Shrink width` recovery affordance looks like an explicit button, but pointer users had to double-click it.
- That interaction is slower and less predictable than it appears, especially when users are trying to quickly reclaim width for tiled sessions.
- The mismatch also creates an awkward inconsistency: keyboard activation behaves like a normal control, while pointer activation behaves like a hidden gesture.

### Assumptions
- It is acceptable for the dedicated recovery tab to use single-click activation even while the actual resize handles keep their double-click-to-compact behavior, because the tab is an explicit CTA rather than a generic drag surface.
- It is acceptable to keep this change local to the renderer affordance without adding new panel state, because the main issue was interaction semantics rather than sizing logic.
- Targeted affordance tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled desktop runtime surface was available.

### Decision and rationale
- Change the resting width-recovery tab from double-click activation to normal single-click activation.
- Update the tooltip copy so it truthfully says `Click to shrink width` while preserving the drag guidance.
- Keep double-click compact behavior on the actual resize handles, where that gesture still maps naturally to the resize surface.
- This is better than the previous behavior because explicit recovery actions should behave like normal buttons instead of requiring a hidden second click.
- This is better than broadening the panel UI with more explanatory chrome because it improves the existing recovery affordance directly.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` so the resting `Shrink width` tab triggers on `onClick` instead of `onDoubleClick`.
- Updated the same file's recovery-tab title copy from `Double-click to shrink width` to `Click to shrink width`.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the single-click behavior and revised copy.

### Verification
- `electron_execute` could still reach a renderer target, but it remained an unrelated/non-trustworthy surface for tiled desktop validation rather than the desktop sessions workflow needed here.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping double-click on the recovery tab would preserve parity with resize handles, but it would keep the explicit CTA feeling more obscure than it looks.
- Switching both the tab and all resize handles to single-click compact actions would reduce gesture variety, but it would be too aggressive for the actual drag handles and could increase accidental compaction.
- Adding more copy to explain the tab's double-click behavior would clarify the old interaction, but it would still be less direct than simply making the control behave like a normal button.

### What still needs attention
- This change should still be runtime-validated in a real tiled desktop workflow to confirm the click affordance feels immediate and does not compete awkwardly with hover-based resize hints.
- The broader floating-panel/tiled-sessions relationship is still reactive rather than proactive; this pass improves one recovery affordance, not the overall allocation strategy.
- A future follow-up could evaluate whether the recovery tab label itself should become more tile-aware (for example, emphasizing reclaiming space) once the runtime flow is easier to validate.

## Iteration 46 - Clear stale reorder targets when a drag leaves the tile

### Area inspected
- `tiling-ux.md`, specifically the still-open drag/reorder cancellation note rather than the most recent sparse-grid height work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- lightweight `electron_execute` inspection to confirm whether a trustworthy tiled-sessions surface was reachable before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally choose a drag/reorder clarity follow-up that had not just been implemented.
2. Inspect `SessionTileWrapper` to trace which drag lifecycle events currently update or clear `dragTargetIndex`.
3. Confirm in `sessions.tsx` that the sessions page only handled drag start, drag over, drop, and drag end.
4. Use `electron_execute` to inspect the running renderer; the desktop app was reachable at `http://localhost:19007/`, but the visible surface was still `Chats` without tiled-session controls, so no trustworthy runtime drag repro was available.

### UX problem found
- The visible `Drop before` cue could remain highlighted after the drag left a tile because the code never cleared the hover target until either another tile received `dragover` or the whole drag ended.
- That meant users could briefly see an insertion marker while hovering empty space or after moving away from the intended target.
- The stale cue weakened the earlier reorder-clarity work because the indicator no longer matched the tile currently under the drag.

### Assumptions
- It is acceptable to clear the target as soon as the drag truly leaves the hovered tile, because the cue should only exist while that tile is the active insertion target.
- It is acceptable to keep the change tile-local instead of adding broader grid-level drag bookkeeping, because the immediate issue is stale hover state rather than the reorder model itself.
- Source-based drag-affordance tests plus renderer typecheck are sufficient for this pass because no trustworthy live tiled-sessions runtime surface was available.

### Decision and rationale
- Add an explicit `onDragLeave` cleanup path from `SessionTileWrapper` back to `sessions.tsx`.
- Only clear the target when the drag actually leaves the tile, not when it moves between descendants inside the same tile.
- This is better than leaving cleanup to `dragend` because it keeps the insertion cue truthful throughout the drag, not just after cancellation or drop.
- This is better than inventing a larger grid-level drag manager because it fixes the concrete mismatch with a very small, local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` accepts `onDragLeave`, ignores descendant-to-descendant drag churn, and clears the target when the drag truly exits the tile.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `handleDragLeave(targetIndex)`, which only clears `dragTargetIndex` if that tile is still the active hover target.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new drag-leave cleanup wiring and guard.

### Verification
- `electron_execute` confirmed the desktop renderer was reachable at `http://localhost:19007/`, but the visible surface remained `Chats` without `aria-label="Session tile layout"`, so no trustworthy live tiled-session drag validation was available.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the existing behavior unchanged would keep the code smaller, but it would continue showing stale insertion cues during cancellation or empty-gap hovers.
- Clearing the target from a grid-level `dragleave` only would help when leaving the whole grid, but it would still leave the cue stale when moving off a tile into interior gaps.
- Reworking drag-and-drop around a more advanced before/after insertion model could also improve cancellation clarity later, but it is broader than needed for this focused mismatch.

### What still needs attention
- This drag-leave cleanup should still be runtime-validated on a real tiled-sessions surface to confirm Electron drag events provide the expected descendant `relatedTarget` behavior across actual session tiles.
- If runtime validation shows gaps between tiles still feel visually ambiguous during drag, the next likely follow-up is a lightweight grid-level empty-space or cancellation cue rather than more header copy.
- Keyboard-accessible tile reordering remains an open enhancement separate from this pointer-drag cleanup.

## Iteration 47 - Remove duplicated stacked-state header chrome

### Area inspected
- `tiling-ux.md`, specifically the newest entries to avoid repeating the recent sparse-grid and drag cleanup work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection to check whether a trustworthy tiled-sessions runtime surface was available before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally choose a sessions-header density follow-up that had not just been implemented.
2. Inspect `sessions.tsx` around the adaptive layout chip, stacked recovery hint, and panel-recovery controls.
3. Confirm that responsive-stacked compare/grid states could render both a current-layout chip (`Compare/Grid · Stacked to fit`) and a dedicated recovery chip (`Make room…`) at the same time.
4. Use `electron_execute` to inspect the running renderer; the desktop app was reachable at `http://localhost:19007/`, but the visible surface was still `Chats` without tiled-session controls, so no trustworthy tiled runtime repro was available.

### UX problem found
- In responsive-stacked compare/grid states, the header duplicated the same status in two places: the selected layout button already showed the chosen mode, the adaptive current-layout chip restated that the mode had stacked, and the stacked recovery chip separately explained the width problem.
- That duplication increased header density exactly when the sessions area was already under width pressure.
- The extra chip made wrapping and scanning worse without adding much decision-making value because the recovery chip already carried the important message and next step.

### Assumptions
- It is acceptable to treat the selected layout button group as the primary current-state indicator for compare/grid modes, because it already remains visible and pressed while the header is crowded.
- It is acceptable to keep the adaptive current-layout chip only for the `one visible session` case, because that state has no separate warning/recovery chip and still benefits from explicit explanation.
- Source-backed layout-controls tests plus renderer typecheck are sufficient for this pass because no trustworthy live tiled-sessions runtime surface was available.

### Decision and rationale
- Stop showing the adaptive current-layout chip for responsive-stacked compare/grid states.
- Keep the chip for the temporary `Expanded for one visible session` case, where it still adds unique context.
- This is better than leaving the stacked chip duplication in place because it reduces visual noise and wrapping in the exact narrow state that needs clearer hierarchy.
- This is better than a broader header refactor because the current issue is specific redundancy, and the selected layout buttons plus the existing recovery chip already provide enough context.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showCurrentLayoutChip` is now limited to `isTemporarySingleVisibleLayout` instead of every adaptive layout state.
- Tightened the related chip-description guards so compact/full adaptive copy is only computed when that chip is actually shown.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new rule that stacked recovery states stay less cluttered while the one-visible-session case still keeps its explanatory chip.

### Verification
- `electron_execute` confirmed the desktop renderer was reachable at `http://localhost:19007/`, but the visible surface remained `Chats` without `aria-label="Session tile layout"`, so no trustworthy live tiled-session validation was available.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the current-layout chip in stacked states would preserve an extra textual description, but it would continue duplicating information already conveyed by the selected button and the recovery chip.
- Removing the current-layout chip for all adaptive states would simplify the header further, but it would also drop useful explanation for the `one visible session` fallback where no dedicated warning chip exists.
- Repacking the header into a new combined hint/action component could also reduce clutter later, but that would be a broader UI change than needed for this focused improvement.

### What still needs attention
- This pass improves stacked-state density, but it does not yet address the larger question of how aggressively the sessions header should collapse or reprioritize controls when several secondary actions are visible at once.
- The panel-versus-tiles relationship is still mostly reactive messaging; a future iteration could revisit whether panel recovery actions should better reflect reclaiming desktop space without overpromising a layout restoration.
- Runtime validation on a real tiled-sessions surface is still needed to confirm the simplified stacked-state header reads clearly at different window widths and sidebar sizes.

## Iteration 47 - Make empty-space drag states explain cancellation instead of going silent

### Area inspected
- `tiling-ux.md`, specifically Iteration 46's open follow-up about grid-gap drag ambiguity
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally choose the drag/reorder follow-up that had not just been implemented.
2. Inspect the sessions drag state after Iteration 46, especially the path where `dragTargetIndex` is cleared once the drag leaves a tile.
3. Confirm that when a drag is active but no tile is currently targeted, the grid no longer shows stale insertion UI but also no longer explains what releasing in empty space will do.
4. Use `electron_execute` to check whether a trustworthy tiled-sessions surface is reachable before editing; the available renderer was still `http://localhost:19007/` on `Chats` without `aria-label="Session tile layout"`, so runtime validation for this workflow remained code-driven.

### UX problem found
- Iteration 46 correctly stopped stale `Drop before` cues from lingering after the drag left a tile.
- But once the drag moved into empty grid space or between tiles, the sessions surface went visually quiet.
- That silence made cancellation harder to read: releasing in empty space now keeps the existing order, but the UI no longer said so, which leaves users guessing whether the last hovered target still matters.

### Assumptions
- It is acceptable to solve this with a passive grid-level status hint instead of adding a new drop target, because the missing piece is cancellation clarity rather than another reorder surface.
- It is acceptable for the hint to appear only while a drag is active and no tile is targeted, because tile-local `Drop before` cues already communicate the true drop destination when one exists.
- It is acceptable to keep this desktop-only; `rg -n "SessionGrid|Session tile layout|Drag to reorder|Release to keep order|Single view|Compare view|Grid view" apps/mobile/src` returned no matches, so there was no equivalent mobile tiling surface to update in this pass.

### Decision and rationale
- Keep the current reorder model unchanged: only dropping on a tile commits a new order.
- Add a subtle centered overlay inside the session grid whenever a drag is active but no tile is currently targeted.
- Use a fuller label on roomier layouts (`Drag over a tile to reorder · Release to keep order`) and a shorter `Release to keep order` label on tighter widths so the message stays helpful without becoming its own density problem.
- This is better than leaving the empty-space state silent because it makes cancellation truthful exactly where users need reassurance, and better than adding an interactive grid-wide drop zone because empty space is not actually a valid reorder destination.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to accept an optional `overlay` slot and made the grid container `relative` so local status UI can sit above the tiled area without affecting layout measurements.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showGridReorderIdleHint` and `gridReorderIdleHintLabel` from the existing drag state.
- Added a noninteractive `role="status"` / `aria-live="polite"` grid overlay in the same file so empty-space drag states now explain that releasing keeps the current order.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new overlay slot and drag-idle guidance.

### Verification
- `electron_execute` confirmed the desktop renderer was reachable at `http://localhost:19007/`, but the visible surface was still `Chats` without `aria-label="Session tile layout"`, so no trustworthy live tiled-session drag validation was available for this iteration.
- `rg -n "SessionGrid|Session tile layout|Drag to reorder|Release to keep order|Single view|Compare view|Grid view" apps/mobile/src` (cwd repo root) returned no matches (exit `1`), so no equivalent mobile change was needed.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the empty-space state silent would be lower churn, but it would keep cancellation ambiguous right after the stale-target cleanup landed.
- Making empty grid space look like an actual drop zone would be more explicit, but it would also be misleading because releasing there does not produce a reorder.
- Always showing the longer drag/cancel sentence would explain more, but it would spend too much horizontal space on tighter tiled layouts where the overlay itself should stay lightweight.

### What still needs attention
- This neutral drag-idle overlay should still be validated on a real tiled-sessions surface to confirm it feels well-placed while dragging across actual grid gaps in Electron.
- If runtime validation shows users still hesitate during cancellation, the next likely follow-up is a slightly stronger relationship between the neutral overlay and the original dragged tile, not another header-level hint.
- Keyboard-accessible tile reordering remains open as a separate enhancement from clarifying pointer drag cancellation.

### Iteration 17 — make completed-session cleanup obvious in the sessions header
- Date: 2026-03-08
- Scope: desktop tiled sessions
- Focus for this iteration: improve session organization by making the completed-session cleanup action understandable at a glance instead of effectively hiding it behind an icon-only control

### Areas inspected
- `tiling-ux.md` latest notes to avoid repeating the recent drag/reorder and tile-density passes
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Electron renderer availability via `electron_execute`

### Repro steps used
1. Review the sessions header actions row and identify controls that still rely on hover/tooltips for basic meaning.
2. Check whether completed-session cleanup already communicates when there is backlog taking up tile space.
3. Attempt a lightweight Electron renderer inspection to validate the current sessions surface in-app.
4. Fall back to renderer-source inspection plus targeted tests/typecheck when the inspectable surface is not the tiled sessions page.

### UX problems found
- The completed-session cleanup affordance was an icon-only ghost button, so it was easy to miss and hard to interpret without hovering.
- The header gave no at-rest indication of how many completed sessions were currently eligible to be cleared from the tiled workspace.
- That made session cleanup feel less discoverable exactly when users most need it to reclaim grid space and reduce clutter.

### Assumptions
- It is acceptable to keep this as a local copy/chrome improvement because the underlying clear-completed behavior already exists and the main issue is discoverability.
- It is acceptable to show a small numeric badge for completed sessions in the header because reclaiming tile space is a sessions-organization action, not unrelated status noise.
- Source inspection, a documented Electron inspection attempt, a targeted renderer test, and desktop web typecheck are sufficient for this pass because the change is renderer-local and no inspectable tiled-sessions target was available.

### Decision and rationale
- Keep the existing cleanup action in the primary header row, but make it self-explanatory with responsive text (`Clear completed` / `Clear`) plus a compact count badge.
- Preserve a tighter icon-plus-count version for very compact widths so the action gains meaning without becoming another wide toolbar control.
- This is better than changing the icon alone, because the real problem was hidden intent and missing backlog visibility, not just visual styling.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive a human-readable completed-session label/title and a responsive cleanup-button label based on header width.
- Updated the same file so the clear-completed action now shows a count badge and keeps the full explanatory label on roomier widths while staying compact on tighter ones.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new count-aware, non-icon-only cleanup affordance.

### Verification
- `electron_execute` reached the desktop renderer at `http://localhost:19007/`, but the visible route was `Chats` rather than the tiled sessions surface, so no trustworthy live sessions validation was available for this iteration.
- `pnpm vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the action icon-only would keep the row slightly lighter, but it would preserve the discoverability problem and keep cleanup backlog invisible at rest.
- Replacing the button with a larger warning chip would make cleanup louder, but it would spend too much toolbar space on a secondary action.
- Moving cleanup into an overflow menu would reduce immediate chrome, but it would further hide an already easy-to-miss organization action.

### What still needs attention
- This clearer cleanup action should still be validated on the real sessions page in Electron to confirm the count badge feels helpful rather than noisy next to the start/history controls.
- The sessions header still contains several secondary chips and actions, so a future pass may need to decide which controls collapse first when sidebar width gets especially tight.
- Tile-internal spacing and hierarchy are improved, but a later pass could still inspect whether transcript summaries or status badges need another narrow-width polish now that header cleanup is clearer.

## Iteration 48 - Let reorder handles work from the keyboard too

### Area inspected
- `tiling-ux.md`, specifically the newest drag/reorder entries so this pass would extend the open keyboard-accessibility gap instead of repeating the just-finished cancellation work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally pick an area that had not just been investigated directly.
2. Inspect the per-tile reorder handle in `SessionTileWrapper` and confirm it is visually persistent but only supports drag interactions.
3. Inspect `sessions.tsx` to confirm reordering logic already exists as a linear `sessionOrder` mutation that could be reused without inventing a second model.
4. Check the running renderer with `electron_execute`; it remained reachable at `http://localhost:19007/`, but the visible surface was still `Chats` without `aria-label="Session tile layout"`, so no trustworthy live tiled-sessions repro was available.

### UX problem found
- The reorder affordance became much clearer for pointer users over the last few iterations, but it still behaved like a pointer-only feature.
- Keyboard users could focus the tile contents, yet there was no equally direct way to move a session earlier or later in the tiled order.
- That left drag/reorder discoverability uneven: the UI now advertises reordering clearly, but the only working path still depended on drag-and-drop.

### Assumptions
- It is acceptable to treat tile order as a linear earlier/later list even in two-column grid layouts, because the visible order already flows left-to-right then top-to-bottom and a spatial reordering model would be materially heavier.
- It is acceptable to put keyboard movement directly on the existing reorder handle instead of adding separate move buttons, because the handle is already the established entry point for rearranging tiles.
- Targeted affordance/layout tests plus renderer typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled-sessions runtime surface was available.

### Decision and rationale
- Keep the current drag-and-drop model, but let the reorder handle also move a session earlier/later with arrow keys when the handle is focused.
- Make the handle visibly focusable so keyboard users can tell they are on the movable control.
- Update the header hint copy on roomier widths from drag-only language to `Drag or use arrows` so the non-pointer path is discoverable without adding extra chrome.
- This is better than adding standalone move buttons because it keeps the interaction attached to the existing rearrange affordance instead of growing tile chrome.
- This is better than leaving reordering pointer-only because it makes the improved reorder affordance usable through another direct, predictable input path.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so the reorder handle is now a real focusable button with a focus ring, `aria-keyshortcuts`, and arrow-key handling for earlier/later moves.
- Updated the same file's reorder-handle tooltip and aria label so they explain both drag and arrow-key movement.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `handleKeyboardReorder(sessionId, direction)`, reuse the existing `sessionOrder` mutation model, clear transient drag state, and scroll the moved session back into view.
- Updated the sessions header hint copy from `Drag to reorder` to `Drag or use arrows` and expanded the tooltip copy accordingly.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the keyboard path and discoverability copy.

### Verification
- `electron_execute` confirmed the desktop renderer was reachable at `http://localhost:19007/`, but the visible surface remained `Chats` without `aria-label="Session tile layout"`, so no trustworthy live tiled-session validation was available for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving keyboard support out would keep the reorder handle simpler, but it would continue making a prominently exposed control effectively pointer-dependent.
- Adding separate up/down move buttons would be more explicit, but it would add visible density to every tile for a capability that fits naturally on the existing reorder handle.
- Building a more spatial grid-aware reordering model could make arrow behavior match columns more literally later, but it would be much heavier than needed for the current earlier/later ordering model.

### What still needs attention
- This keyboard path should still be runtime-validated on a real tiled-sessions surface to confirm focus stays stable on the moved handle and the focus ring feels appropriately visible in Electron.
- If users need stronger feedback after a keyboard move, a future pass may want a subtle moved-state announcement or temporary status chip rather than additional permanent tile chrome.
- Pointer and keyboard reordering now both exist, but broader accessibility work such as explicit screen-reader move announcements or alternative reorder shortcuts remains open.

## Iteration 49 - Make drag-drop reorder match the visible “Drop before” cue

### Area inspected
- `tiling-ux.md`, specifically the latest reorder work so this pass extended a still-open predictability gap instead of repeating the just-finished keyboard-accessibility pass
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- lightweight `electron_execute` inspection of the running renderer before documenting results

### Repro steps reviewed
1. Re-read the ledger and intentionally avoid the most recent header-density and width-restore areas.
2. Inspect `handleDrop(...)` in `sessions.tsx` and compare its insertion math with the tile-level `Drop before` cue in `session-grid.tsx`.
3. Inspect how regular session tiles derive their drag index when a pending continuation tile is visible above them.
4. Probe the running renderer with `electron_execute`; it was reachable at `http://localhost:19007/`, but the visible surface was still `Chats` without `aria-label="Session tile layout"`, so no trustworthy live tiled-sessions repro was available.

### UX problem found
- The drag target copy and chrome clearly say `Drop before`, but the reorder math still inserted the dragged tile at the hovered tile's raw index after removal.
- When dragging a tile downward, that made the result land after the hovered tile instead of before it, so the visible cue could lie.
- The problem got worse when a pending tile was visible: regular tiles were using an index offset that included the pending tile, even though the reorderable session order did not.

### Assumptions
- It is acceptable to keep the drag model as `drop before the hovered tile`, because that is already what the visual insertion rail and label communicate.
- It is acceptable to treat pending tiles as non-reorderable context rather than part of the draggable order, because only active session tiles expose reorder affordances.
- Targeted renderer tests plus `typecheck:web` are sufficient for this pass because the fix is renderer-local and the reachable Electron target was not the real tiled-sessions surface.

### Decision and rationale
- Keep the existing drag affordance and drop cue unchanged, but make the reorder math match the promise the UI is already making.
- Normalize drag indices to the reorderable session list only, so pending tiles no longer skew which session is treated as the drop target.
- Reuse a shared move helper for drag-drop and keyboard reorder so both paths keep the same core list-mutation behavior while preserving the drag-specific `drop before` adjustment.
- This is better than changing the cue text because the UI was already describing the more intuitive behavior; the implementation was what needed to catch up.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `getDropBeforeInsertIndex(...)` and `moveSessionToIndex(...)` so drag-drop and keyboard reorder share clearer, smaller list-mutation helpers.
- Updated the same file's `handleDrop(...)` logic so dragging downward now inserts before the hovered tile rather than after it.
- Removed the pending-tile index offset from regular session tiles in `sessions.tsx`, so drag target indices now stay aligned with the actual reorderable session list.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new insertion math and the removal of the pending-tile skew.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `electron_execute` reached the renderer at `http://localhost:19007/`, but the visible route was still `Chats` rather than the tiled sessions page, so no trustworthy live drag-drop validation was available for this iteration.

### Tradeoffs considered
- Changing the `Drop before` cue to a vaguer label like `Move here` would have been smaller, but it would leave the underlying reorder behavior less predictable than it needs to be.
- Including pending tiles in the reorder order would keep raw visual indices aligned, but it would create a stranger model where a non-draggable/pending tile implicitly affects active-session rearrangement.
- Building a richer drag preview or moved-state toast in the same pass could improve feedback further, but it would expand scope beyond the concrete ordering bug this iteration set out to fix.

### What still needs attention
- This drag fix should still be runtime-validated on the real sessions surface, especially with three or more active tiles and a visible pending continuation tile.
- If users still need stronger feedback after a keyboard or drag reorder, the next likely follow-up is a lightweight `moved to position` announcement rather than more permanent chrome.
- Broader reorder accessibility work, such as explicit screen-reader move announcements, remains open now that the visible pointer cue is truthful again.

## Iteration 49 - Keep compact tiled-session headers action-first

### Area inspected
- `tiling-ux.md`, specifically the newest drag/reorder and cleanup entries so this pass would address a different compact-width organization gap instead of repeating the latest work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection of the running renderer before and after editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose an area that had not just been investigated directly.
2. Inspect the lower sessions header row in `sessions.tsx`, where passive chips (`Stacked`, `Tight fit`, `Single`, `Reorder`, temporary layout context) and direct controls share the same wrapping container.
3. Check whether compact-width logic reduced labels but still left passive chips competing with actionable controls for first-row space.
4. Attempt a lightweight Electron validation; the reachable renderer did not expose the tiled sessions surface, so this pass relied on source inspection plus targeted tests and typecheck.

### UX problem found
- On compact session headers, the lower toolbar still mixed passive explanatory chips and direct controls in the same wrapping row.
- That made layout buttons, restore actions, and panel-recovery buttons more likely to shift downward or change position based on whichever hint chips happened to be visible.
- The result was visually backwards for tight spaces: explanation could take the prime row while the controls users actually needed became less stable and less scannable.

### Assumptions
- It is acceptable to preserve all existing hints while changing their row priority, because the problem was hierarchy and wrapping predictability rather than missing information.
- It is acceptable for passive chips to fall beneath the action row on compact headers, because actions like layout switching, restoring from single view, and reclaiming panel space are more time-sensitive than at-rest explanation.
- Targeted renderer tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled-sessions runtime surface was available in Electron.

### Decision and rationale
- Keep the same controls and hint chips, but on compact headers split the lower toolbar into an action-first row and a passive-meta row whenever any tiling/status chips are present.
- Leave roomy headers unchanged so the denser two-sided layout still works when there is enough width.
- This is better than hiding more hints because it improves priority and predictability without reducing guidance.
- This is better than adding another breakpoint-specific abstraction or overflow menu because the existing structure only needed clearer ordering, not new controls.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `hasCompactSessionHeaderMeta` and `shouldSplitSessionHeaderRows` from the existing compact-width and hint-visibility state.
- Updated the same file so compact lower-header layouts add vertical gap, move passive chips onto an `order-2 basis-full` row, and keep the direct controls in an `order-1` full-width action row.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new action-priority split logic and compact-row ordering classes.

### Verification
- `electron_execute` reached a renderer target, but it showed `DotAgents`/settings without `[aria-label="Session tile layout"]`, so there was still no trustworthy live tiled-sessions runtime validation available for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the compact header as-is would keep the markup slightly simpler, but it would continue giving passive context equal or higher visual priority than the controls users need to react.
- Hiding more chips on compact widths would free space, but it would also remove useful explanation in states like responsive stacking and focused single-view browsing.
- Moving every lower-header layout into permanently stacked rows would be more uniform, but it would waste space on roomier widths where the current side-by-side layout remains effective.

### What still needs attention
- This compact action-first wrap should still be validated on a real tiled sessions surface to confirm the new row order feels stable when the sidebar and floating panel widths change.
- If the lower header still feels busy after runtime validation, the next likely follow-up is deciding which secondary action groups collapse first under extreme width pressure, not adding more chips.
- Tile-internal hierarchy remains a separate follow-up area once header priority behavior has been runtime-checked.

## Iteration 50 - Keep compact tile headers action-first

### Area inspected
- `tiling-ux.md`, specifically the latest entries to avoid repeating the recent sessions-header work and to pick the still-open tile-internal hierarchy follow-up
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally choose a tile-internal hierarchy pass instead of another sessions-header or drag/reorder iteration.
2. Inspect the tile header in `AgentProgress`, especially how compact-width tiles place passive chips like `Collapsed` and `Approval` beside direct action buttons.
3. Attempt a lightweight live renderer inspection before editing; `electron_execute` could reach `DotAgents` settings and then `Chats` at `http://localhost:19007/`, but neither surface exposed `aria-label="Session tile layout"`, so no trustworthy live tiled-session repro was available.
4. Compare the compact tile-header cluster with the newer sessions-header action-first pattern already used elsewhere in the desktop app.

### UX problem found
- On compact tile widths, the header already moved its right-side chrome onto a full-width row, but that row still mixed passive status chips (`Collapsed`, `Approval`) with direct icon buttons.
- That made narrow tile controls less stable: passive status could consume the same prime row space as collapse, single-view, background, and stop/dismiss actions.
- The result weakened scanability in the exact state where tiles are already under width pressure, because explanation and action were competing at the same hierarchy level.

### Assumptions
- It is acceptable to treat compact tile header actions as higher priority than passive state chips, because the chips remain visible while the direct controls are the elements users most need to reach quickly under width pressure.
- It is acceptable to reuse the same action-first split pattern already used in the sessions header, because this is a local hierarchy problem rather than a need for a new tile-specific abstraction.
- A documented renderer inspection attempt, focused source-backed tile-layout tests, and desktop web typecheck are sufficient for this pass because no trustworthy live tiled-session surface was reachable in Electron.

### Decision and rationale
- Keep the existing compact tile header breakpoint and controls, but split passive tile-status chips onto their own secondary row when a compact tile actually has header meta to show.
- Keep the action buttons on the first compact row so collapse, single-view, background, and stop/dismiss actions stay positionally stable.
- This is better than hiding the chips because the state cues still matter, and better than leaving everything mixed because narrow headers should prioritize what users can act on first.
- This is better than inventing new overflow or disclosure controls because the current header already had the needed information; it just needed clearer row priority.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `hasTileHeaderMeta` / `shouldSplitTileHeaderRows` for compact tile headers.
- Updated the same file so compact tile header chips now move onto an `order-2` full-width row while the direct tile action buttons stay on an `order-1` full-width row.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new action-first compact-header structure.

### Verification
- `electron_execute` reached the desktop renderer at `http://localhost:19007/`, but the available surfaces were settings and chats rather than a trustworthy tiled sessions page, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the compact tile header mixed would be lower churn, but it would keep passive chips competing with actual controls on the narrowest tile state.
- Hiding `Collapsed` or `Approval` on compact widths would save more room, but it would also remove useful at-rest state cues that users still need while scanning several tiles.
- Replacing the icon actions with persistent text labels would make actions more explicit, but it would reopen the tile-header density problem that multiple earlier iterations were trying to reduce.

### What still needs attention
- This compact tile-header split should still be runtime-validated on a real tiled sessions surface to confirm the row order feels stable while tiles resize, collapse, and enter `Single view`.
- The tile footer and transcript area remain separate hierarchy surfaces; a future pass could still check whether status badges or summary-callout spacing need another compact-width polish.
- The broader floating-panel versus tiled-session width allocation problem remains open; this pass improves tile-local scanability, not how much space tiles receive overall.

## Iteration 51 - Retarget layout-driven tile heights when vertical space changes

### Area inspected
- `tiling-ux.md`, specifically the latest entries to avoid repeating the recent tile-header and toolbar passes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose a still-open layout-responsiveness area rather than another header, reorder, or tile-internal hierarchy pass.
2. Inspect how `SessionGrid` measures `containerHeight` and how `SessionTileWrapper` reacts to that measurement.
3. Confirm that tile height retargeting already happens for layout changes, lone-visible-tile fallback changes, sparse two-tile grid changes, and width-driven reflow, but not for pure vertical container-height changes.
4. Attempt a lightweight live renderer inspection before editing; `electron_execute` could reach `http://localhost:19007/`, but the reachable surfaces were settings and chats rather than a trustworthy tiled sessions page, so no runtime repro of the sessions grid was available.

### UX problem found
- Compare and Grid tiles could keep a stale height after the available vertical space changed, because the wrapper never reacted to a pure `containerHeight` change.
- That made the tiled layout feel less predictable across window-height changes and other vertical-space shifts: tiles could stay too tall, too short, or leave awkward dead space until some unrelated width or layout event happened.
- A naive fix that always reset height on vertical changes would solve the stale-height problem, but it would also clobber deliberate user height adjustments.

### Assumptions
- If a tile's current height still matches the previous layout target closely, it is acceptable to treat that height as layout-driven and automatically retarget it when the available vertical space changes.
- If the current height has already diverged materially from the previous layout target, it is acceptable to preserve it as a likely user-authored manual resize.
- A documented live-renderer inspection attempt, focused session-grid tests, and desktop web typecheck are sufficient for this pass because the sessions surface was not reachable in the running Electron target.

### Decision and rationale
- Add a dedicated vertical reflow check in `SessionTileWrapper` that watches `containerHeight` changes with the same jitter guard used elsewhere.
- Only retarget height when the tile is still effectively following the previous layout target; otherwise preserve the existing height.
- This is better than unconditionally resetting height because it keeps manual resize intent intact, and better than leaving the old behavior because the layout now responds predictably to real vertical-space changes.
- This is better than introducing a new persisted "manual height" flag because the current tolerance-based check keeps the change local and low-risk.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add `shouldRetargetTileHeightOnContainerHeightChange()` and a new `containerHeight` reflow effect.
- The new effect compares the current tile height against the previous target height and only calls `setSize({ height: targetTileHeight })` when the tile still appears layout-driven.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` with direct coverage for the new retargeting rule.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new vertical reflow effect and its source-level guard rails.

### Verification
- `electron_execute` reached the desktop renderer at `http://localhost:19007/`, but the available surfaces were settings and chats rather than a trustworthy tiled sessions page, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Unconditionally resetting height on every meaningful vertical change would be simpler, but it would make manual tile-height adjustments feel fragile.
- Leaving height entirely untouched on vertical changes preserves manual sizes perfectly, but it keeps the layout stale in ordinary auto-sized cases.
- Tracking a new explicit "manual vs auto height" persistence flag could be more exact, but it would introduce broader state semantics for a problem that can be solved locally with a small tolerance check.

### What still needs attention
- This vertical reflow behavior should still be runtime-validated on a real tiled sessions surface, especially while resizing the window height and while floating-panel changes alter the available scroll area.
- If live validation shows that some panel-driven vertical changes should force a stronger re-layout than the current tolerance rule provides, a follow-up may need to distinguish between ordinary viewport growth/shrink and explicit layout-mode transitions.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves height responsiveness inside the grid, not how much overall space the tiled area receives.

## Iteration 52 - Make width-locked tiles explain themselves sooner

### Area inspected
- `tiling-ux.md`, specifically the newest header and reflow entries so this pass would avoid another recent compact-header iteration
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally choose a resize-clarity gap that had not been the most recent focus.
2. Inspect the `SessionTileWrapper` locked-width rail and compare its discoverability with the now-stronger drag affordance and other resize hints.
3. Follow when `shouldLockTileWidth(...)` becomes true in stacked, single-view, and one-visible full-row tile states.
4. Check the running renderer with `electron_execute`; it was reachable at `http://localhost:19007/`, but the visible surface was still `Chats` rather than tiled sessions, so no trustworthy live repro was available.

### UX problem found
- Width-locked tiles already had a helpful explanation, but it only appeared when the pointer hit the tiny right-edge rail itself.
- In stacked or full-width tile states, users are more likely to perceive “width resize doesn’t do anything” before they realize the layout intentionally owns that dimension.
- That made the width-lock affordance feel more like a hidden exception than an understandable layout rule.

### Assumptions
- It is acceptable to reveal the width-lock explanation when the whole tile is hovered or focused within, because the cue still only appears in layout-locked states and does not add permanent chrome.
- It is acceptable to keep the existing resize-lock behavior and persistence rules unchanged, because the usability gap here is discoverability rather than incorrect sizing math.
- A documented renderer inspection attempt, the focused resize-affordance test, and desktop web typecheck are sufficient for this pass because the real tiled sessions surface was not reachable in the running Electron target.

### Decision and rationale
- Keep the current width-lock behavior, labels, and titles.
- Make the lock rail and its `Width follows …` hint respond to whole-tile hover and focus-within, not just the narrow right-edge hotspot.
- This is better than a permanently visible badge because it keeps resting chrome light, and better than the previous edge-only reveal because users can discover the explanation from normal tile exploration instead of precision-hovering a slim rail.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add a dedicated `lockedWidthHintClassName` and reveal the width-lock hint on `group-hover/session-tile` and `group-focus-within/session-tile`.
- Updated the same file so the locked-width rail also strengthens on tile focus-within, not just tile hover.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the broader hover/focus reveal behavior for layout-locked width guidance.

### Verification
- `electron_execute` reached the desktop renderer at `http://localhost:19007/`, but the visible route was `Chats` rather than the tiled sessions surface, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- A permanently visible `Width follows …` badge would be even clearer, but it would add repeated chrome to every full-width tile state.
- Leaving the explanation on the edge-only hotspot would keep the implementation slightly smaller, but it would preserve the discoverability gap in the exact states where users are most likely to question width resizing.
- Moving the explanation into tile headers or footers would be more explicit, but it would spread layout-lock messaging into content regions that already have their own density concerns.

### What still needs attention
- This width-lock cue should still be runtime-validated on the real tiled sessions surface, especially when a user focuses a tile and then tries to resize while the layout is stacked or in `Single view`.
- If live validation shows that users still miss the width lock, the next likely follow-up is a stronger focused-state cue rather than more permanent tile chrome.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass clarifies why width is fixed in full-row states, not when the app should reclaim more space overall.

## Iteration 53 - Add a lightweight header cue when a tile is only showing recent transcript history

### Area inspected
- `tiling-ux.md`, specifically the older transcript-preview follow-up and the newest resize/layout entries so this pass would not repeat the most recent work
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps reviewed
1. Re-read the ledger and intentionally choose an older open follow-up rather than another resize-affordance or header-compaction pass.
2. Inspect the tile variant in `AgentProgress` to compare where preview-state messaging already exists versus where users first scan tile state.
3. Confirm that clipped multi-tile transcripts already show an in-body `Recent updates preview` callout, but the tile header itself still has no lighter-weight scan cue for that state.
4. Reuse the same-session constraint that live tiled-session validation was not practical because the reachable renderer surfaces were still chats/settings rather than the real tiled sessions view.

### UX problem found
- Unfocused multi-tile transcript previews already explain themselves inside the transcript area, but users scanning several tiles from the header level still have no quick cue that a tile is showing only recent history.
- That means the state explanation arrives slightly late: only after the user has already looked deeper into the transcript body.
- The result is better than before the preview callout existed, but still weaker than the collapsed and approval states, which already advertise themselves directly in header chrome.

### Assumptions
- It is acceptable to add a very small `Preview` chip in tile headers only when earlier transcript history is hidden, because this mirrors existing passive state chips like `Collapsed` and `Approval` without adding permanent chrome to all tiles.
- It is acceptable to reuse the existing preview-copy recovery path (`Focus this tile or open Single view for full history.`) rather than invent a new control, because the usability gap is scanability, not missing actions.
- The focused tile-layout source test and desktop web typecheck are sufficient for this pass because no trustworthy live tiled sessions surface was available in the attached renderer.

### Decision and rationale
- Keep the existing transcript-body preview callout unchanged.
- Add a lightweight header-level `Preview` badge only when the tile is currently hiding earlier transcript history.
- Fold that badge into the existing header-meta row logic so narrow headers keep their action-first structure while still surfacing preview state.
- This is better than moving all preview explanation into the header because the transcript area still needs the fuller explanation, and better than leaving the state body-only because users often scan tiles from the header before reading message content.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `showTileHeaderPreviewBadge` from the existing transcript-preview state.
- Updated the same file so `hasTileHeaderMeta` now includes the preview badge, keeping compact headers on the same action-first / passive-meta split.
- Added a small blue `Preview` chip with a tooltip that reuses the existing hidden-history explanation and recovery guidance.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new header-preview badge conditions and copy.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- A larger header badge like `Recent updates preview` would be more explicit, but it would also consume too much space in narrow tiles and fight the compact-header work from recent iterations.
- Keeping the preview explanation only in the transcript body would be lower churn, but it would preserve the scanability gap when users glance across several tiles.
- Adding a dedicated `Show full history` button to the header would be more actionable, but it would add control chrome to a state that already has a clear recovery path via tile focus and `Single view`.

### What still needs attention
- This header preview cue should still be runtime-validated on a real tiled sessions surface to make sure it feels helpful rather than repetitive next to the existing transcript-body callout.
- If the badge feels too subtle in practice, the next likely follow-up is adjusting its color/wording rather than adding another new control.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves tile-state scanability, not overall space distribution.

## Iteration 54 - Keep the remaining height-resize path visible when width is layout-locked

### Area inspected
- `tiling-ux.md`, specifically the newest resize-affordance and vertical-reflow entries to avoid another sessions-header iteration
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally stay on tile-local resize behavior instead of repeating another header-density or layout-chip pass.
2. Inspect how `SessionTileWrapper` presents affordances in width-locked states (`Single view`, stacked compare/grid, and one-visible full-row fallback).
3. Confirm that the recent pass now explains why width is fixed on whole-tile hover/focus, but the remaining bottom-edge `Resize height only` cue still mainly requires hovering the bottom hotspot itself.
4. Attempt a lightweight live renderer inspection before editing; `electron_execute` reached `http://localhost:19007/`, but the visible route was still `Chats` rather than the tiled sessions surface, so no trustworthy runtime repro was available.

### UX problem found
- Width-locked tiles were easier to understand after the previous iteration, but they still advertised the one remaining adjustable axis less clearly than the now-prominent width-lock cue.
- In stacked or `Single view` states, that asymmetry can make the whole tile feel frozen even though height resizing still works.
- Because the bottom affordance only fully explained itself from its local hotspot, users had to discover the surviving resize path with more precision than the adjacent locked-width explanation.

### Assumptions
- It is acceptable to reveal the height-only cue on whole-tile hover/focus only when width is already layout-locked, because that is the exact state where users most need help understanding what still changes.
- It is acceptable for the right-edge lock explanation and bottom-edge height-only cue to appear together transiently in those states, because the pair communicates a complete resizing model without adding permanent chrome.
- A documented renderer inspection attempt, the focused resize-affordance test, and desktop web typecheck are sufficient for this pass because the real tiled sessions route was not reachable in the running Electron target.

### Decision and rationale
- Keep the resize behavior unchanged: width remains layout-controlled in full-row states, and height remains adjustable.
- In those width-locked states, let the bottom height rail thicken and its `Resize height only` hint appear from ordinary tile hover/focus as well as direct bottom-edge hover.
- This is better than a permanent badge because it keeps resting chrome light, and better than leaving the old behavior because the remaining useful resize path no longer feels hidden relative to the width-lock explanation.
- This is better than moving the copy into the header because the cue stays attached to the actual draggable edge.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add `heightResizeRailClassName` and `heightResizeHintClassName`.
- Updated the same file so width-locked tiles reveal the bottom `Resize height only` cue and strengthen the bottom rail on whole-tile hover/focus, while preserving the older edge-only behavior for ordinary two-axis resize states.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the new width-locked bottom-edge reveal behavior.

### Verification
- `electron_execute` reached the desktop renderer at `http://localhost:19007/`, but the visible route was `Chats` rather than the tiled sessions surface, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the bottom cue on handle-hover only would keep the implementation slightly smaller, but it would preserve the asymmetry where the locked axis explains itself more clearly than the remaining editable one.
- Showing a permanent `Height still resizes` badge would be clearer at rest, but it would add repeated chrome to every full-width tile state.
- Rewriting the right-edge lock copy to also mention height would centralize the message, but it would make that hint longer and less directly attached to the draggable bottom edge.

### What still needs attention
- This paired width-lock plus height-only cue should still be runtime-validated on the real tiled sessions surface, especially while switching among `Single view`, stacked compare/grid, and wider side-by-side states.
- If live validation shows that the two transient cues feel too busy together, the next likely follow-up is a more unified compact locked-state treatment rather than more hover copy.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass clarifies the local resize model, not when the app should proactively reclaim more room for tiled sessions.

## Iteration 55 - Keep panel recovery actions explicit in the tightest tiled-session headers

### Area inspected
- `tiling-ux.md`, specifically the newest resize-affordance entries so this pass would avoid repeating another tile-edge discoverability change
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the still-open floating-panel-versus-tiled-session pressure area rather than another tile-local resize pass.
2. Inspect the sessions header logic for `showShrinkPanelForLayoutPressure` and `showHidePanelForLayoutPressure`, especially how those actions behave under `isVeryCompactSessionHeader`.
3. Confirm that the pressure hints already stay visible in narrow headers, but the panel recovery buttons themselves collapse to icon-only controls at the tightest breakpoint.
4. Attempt a lightweight live renderer inspection before editing; `electron_execute` reached `http://localhost:19007/`, but the attached surface was a separate `Chats` app rather than this repo's tiled sessions view, so no trustworthy runtime repro was available.

### UX problem found
- In the tightest tiled-session header state, the floating-panel recovery actions depended on tooltip discovery because both `Shrink panel` and `Hide panel` lost their visible labels.
- That weakened the recovery path right when users most need it: the header is already warning that tiled sessions are cramped, but the actions that would make room become less self-explanatory.
- The icon-only state was especially easy to miss as a meaningful layout-recovery control because it looked like generic toolbar chrome rather than a direct response to the pressure warning.

### Assumptions
- It is acceptable to keep short visible labels (`Shrink`, `Hide`) even at the tightest header breakpoint because the action row already wraps independently from the passive meta row.
- It is acceptable to prefer short labels over icon-only buttons here because these are high-priority recovery actions, not low-priority secondary chrome.
- A documented live-renderer inspection attempt, the focused sessions layout-controls test, and desktop web typecheck are sufficient for this pass because the attached Electron target was not the real tiled sessions surface for this repo.

### Decision and rationale
- Keep the existing panel recovery actions and titles, but give them short visible labels in `isVeryCompactSessionHeader` states instead of collapsing them to icons alone.
- Use `Shrink` and `Hide` as the shortest plain-language labels that still explain the intent without depending on hover titles.
- This is better than the previous icon-only treatment because it makes the recovery path readable at a glance, and better than longer labels because the header is still under real width pressure.
- This is better than adding a new badge or explanatory row because the needed action already exists; it just needed to stay legible in the narrowest state.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so very compact panel-pressure actions now use `Shrink` and `Hide` labels instead of `null`.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in those short-label rules for the very compact sessions header.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was a separate `Chats` app rather than the repo's tiled sessions page, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the actions icon-only at the tightest breakpoint would preserve a few more pixels, but it would keep the highest-value recovery controls dependent on tooltip discovery.
- Restoring the full `Shrink panel` / `Hide panel` labels everywhere would be clearer, but it would spend more horizontal space than necessary in the narrowest header state.
- Adding another passive warning badge about the floating panel would be more explicit, but it would add chrome without making the actual recovery action easier to use.

### What still needs attention
- This compact panel-recovery labeling should still be runtime-validated on a real tiled sessions surface to confirm the short labels feel clear without making the action row too busy.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves action clarity when pressure exists, not when the app should automatically reclaim more room.
- A future pass could still test whether the pressure actions deserve stronger visual emphasis than the surrounding ghost buttons when stacked or near-stacked warnings are active.

## Iteration 56 - Offer the stronger panel escape hatch as soon as layouts have already stacked

### Area inspected
- `tiling-ux.md`, specifically the newest resize-affordance entries so this pass would avoid another tile-edge follow-up and instead revisit the still-open panel-versus-tiles allocation problem
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection of the running renderer before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose the broader floating-panel interaction gap rather than another tile-local affordance pass.
2. Inspect the sessions header logic that appears when compare/grid is stacked or close to stacking.
3. Confirm that stacked layouts already show `Shrink panel` when the floating panel can get narrower, but defer `Hide panel` until after the panel is already at minimum width.
4. Attempt a quick live renderer inspection; the renderer was reachable at `http://localhost:19007/`, but the visible surface was still the chats shell rather than a trustworthy tiled sessions repro, so this pass remained code-led.

### UX problem found
- Once compare or grid has already collapsed into a stacked fallback, users are in a higher-friction state than a mere early warning.
- In that already-stacked state, only offering `Shrink panel` when the panel is still wide forces a trial-and-error recovery flow: users must first shrink, then see whether they also need to hide.
- That makes the strongest, most predictable recovery action feel artificially delayed even though the layout is already degraded.

### Assumptions
- It is acceptable to surface both `Shrink panel` and `Hide panel` together only after the layout has already stacked, because that is an urgent recovery state where slightly more header chrome is justified.
- It is acceptable to keep near-stacked warnings less aggressive and continue deferring `Hide panel` there until shrinking is no longer available, because the layout has not yet actually broken into a stacked fallback.
- A documented renderer inspection attempt, the focused sessions layout-controls source test, and desktop web typecheck are sufficient for this pass because the live tiled sessions surface was not reachable.

### Decision and rationale
- Keep `Shrink panel` as the first, less-disruptive recovery action.
- Also expose `Hide panel` immediately whenever compare/grid is already stacked and the floating panel is visible, even if the panel can still shrink.
- Update the stacked-state hide tooltip copy so it clearly reads as the strongest recovery option rather than a duplicate of `Shrink panel`.
- This is better than the previous staged flow because it removes unnecessary trial-and-error in the exact state where users most need a decisive way back to a multi-column layout.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so stacked layouts derive `showHidePanelForStackedLayoutPressure` and keep `Hide panel` available whenever the floating panel is visible.
- Kept near-stacked behavior conservative: those warning states still only surface `Hide panel` once width shrinking is no longer available.
- Updated the stacked-state hide tooltip copy to emphasize that hiding restores the most room.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new stacked-state action-availability rule and revised tooltip copy.

### Verification
- `electron_execute` reached the desktop renderer at `http://localhost:19007/`, but the visible route was still the chats shell rather than a trustworthy tiled sessions repro, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the old staged flow was slightly lighter visually, but it preserved avoidable extra steps in a state that is already failing the user’s intended layout.
- Showing `Hide panel` during both stacked and near-stacked warnings would be more forceful, but it would over-promote a stronger action before the layout has actually fallen back.
- Replacing `Shrink panel` entirely with `Hide panel` in stacked states would be simpler, but it would remove the lower-disruption recovery path that may still be enough.

### What still needs attention
- This stronger stacked-state recovery path should still be runtime-validated on a real tiled sessions surface to confirm that the extra button feels helpful rather than crowded in compact headers.
- If real use shows that `Shrink panel` almost never recovers side-by-side compare/grid once stacking has already happened, a later pass could promote `Hide panel` more strongly or auto-order the actions by likely effectiveness.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves recovery clarity, not automatic space management.

## Iteration 57 - Prioritize the strongest panel recovery action once layouts have already stacked

### Area inspected
- `tiling-ux.md`, specifically the newest stacked-layout and floating-panel recovery entries so this pass would build on the still-open prioritization question instead of repeating a tile-edge or header-labeling tweak
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection of the attached renderer before editing

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally stay on the open floating-panel-versus-tiles allocation thread rather than revisiting another resize affordance.
2. Inspect the sessions header action row for already-stacked compare/grid layouts after Iteration 56 made both `Shrink panel` and `Hide panel` available.
3. Confirm that the stronger escape hatch now exists, but it still renders with the same low-emphasis ghost treatment and after `Shrink panel`, which makes the two recovery actions feel equally recommended even though hiding is the most reliable way to reclaim room once stacking has already happened.
4. Attempt a quick live renderer inspection before editing; `electron_execute` still reached `http://localhost:19007/` but the attached surface was the `Chats` shell rather than a trustworthy tiled sessions route, so this pass remained code-led.

### UX problem found
- After layouts have already degraded into a stacked fallback, the header exposed both panel recovery actions but did not communicate which one is most likely to succeed.
- Because `Shrink panel` rendered first and both actions shared the same subdued chrome, users still had to infer hierarchy from tooltip wording rather than from the visible UI.
- That preserved unnecessary ambiguity in the exact state where users most need a decisive recovery path back to side-by-side or multi-column sessions.

### Assumptions
- It is acceptable to visually prioritize `Hide panel` only when layouts are already stacked, because that is a degraded state where stronger guidance is more valuable than perfectly neutral action styling.
- It is acceptable to keep `Shrink panel` available as a secondary action in that state, because some users will still prefer the less disruptive recovery step even when hiding is more reliable.
- A documented live-renderer inspection attempt, the focused sessions layout-controls source test, and desktop web typecheck are sufficient for this pass because the attached Electron target still was not the repo's real tiled sessions surface.

### Decision and rationale
- Keep both recovery actions in stacked states, but explicitly prioritize `Hide panel` there.
- Render `Hide panel` before `Shrink panel` once layouts have already stacked, and give it a stronger blue recovery treatment while leaving the less-disruptive shrink action in the existing secondary style.
- Keep near-stacked warnings unchanged so the UI does not over-promote the stronger action before the layout has actually degraded.
- This is better than merely changing tooltip copy because the visible hierarchy now matches the real recovery likelihood, and better than removing `Shrink panel` because users still retain the gentler option.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `prioritizeHidePanelForLayoutPressure` from the already-stacked panel-pressure state.
- Added shared secondary and prioritized panel-recovery button class strings so the stacked-state `Hide panel` action can use stronger visual emphasis without introducing a new button abstraction.
- Refactored the panel recovery buttons into local JSX variables so the action row can swap their order when `Hide panel` should be prioritized.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new stacked-state prioritization, emphasized styling, and action-order behavior.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was still the `Chats` shell rather than a trustworthy tiled sessions route, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving both buttons visually equal would keep the implementation slightly smaller, but it would preserve the need to guess which recovery action is most effective after stacking has already happened.
- Promoting `Hide panel` in both stacked and near-stacked states would be more forceful, but it would oversteer users before the layout has actually failed into a stacked fallback.
- Replacing `Shrink panel` entirely with the stronger action would simplify the header, but it would remove the lower-disruption path that some users may still want to try first.

### What still needs attention
- This stacked-state action hierarchy should still be runtime-validated on a real tiled sessions surface to confirm that the emphasized `Hide panel` button feels helpful rather than too visually dominant in compact headers.
- If real use shows that the strengthened `Hide panel` treatment works well, a future pass could test whether the stacked-state hint chip itself should visually coordinate with that stronger action emphasis.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves recovery prioritization after stacking, not proactive space management before it happens.

## Iteration 58 - Announce successful tile reorders so the new position is explicit

### Area inspected
- `tiling-ux.md`, specifically the newest entries to avoid repeating the recent floating-panel recovery prioritization work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- lightweight `electron_execute` inspection of the attached renderer before documenting results

### Repro steps reviewed
1. Re-read the latest ledger entries and intentionally choose a different open area than the recent stacked-layout/panel-recovery thread.
2. Inspect the reorder handlers in `sessions.tsx`, especially `handleDrop(...)` and `handleKeyboardReorder(...)`, to see what explicit feedback users get after a reorder succeeds.
3. Confirm that the UI already exposes reorder affordances clearly, but only the transient insertion/cancellation cues explain the action while it is happening.
4. Probe the running Electron renderer with `electron_execute`; it was reachable at `http://localhost:19007/`, but the visible surface was still the `Chats` shell and did not expose `aria-label="Session tile layout"`, so this pass remained source- and test-validated.

### UX problem found
- The tiled sessions UI now makes drag-and-drop and keyboard reorder discoverable, but once a reorder succeeds it still goes visually and semantically quiet.
- That leaves keyboard users without an explicit confirmation of the new position, and drag users likewise have to infer the result only from the reordered layout.
- The gap is most noticeable after recent reorder clarity work because the interaction is now easier to start than it is to confirm.

### Assumptions
- It is acceptable to solve this with a lightweight polite live-region announcement instead of more persistent visible chrome, because the missing piece is post-action confirmation rather than another permanent control.
- It is acceptable to announce the moved session label plus its new ordinal position, because that gives users the minimum confirmation needed without inventing a separate reorder history model.
- A documented Electron inspection attempt, the focused drag-affordance source test, and desktop web typecheck are sufficient for this pass because the real tiled sessions renderer was not reachable.

### Decision and rationale
- Keep the current drag/drop and keyboard reorder behavior unchanged.
- Add a polite screen-reader status announcement whenever a reorder actually changes the session order, using the existing session label and the new `position of total` result.
- Trigger the same announcement path from both drag/drop reorder and keyboard reorder so confirmation stays consistent across input methods.
- This is better than adding visible toast/chip feedback because it improves confirmation without adding more tile or header chrome, and better than leaving reorders silent because users now get an explicit result after the move completes.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `getSessionReorderAnnouncement(...)` plus local `reorderAnnouncement` state for successful reorder results.
- Added a memoized `reorderableSessionLabelById` map in the same file so drag/drop and keyboard reorder can announce the moved session with stable user-facing labels.
- Updated `handleDrop(...)` and `handleKeyboardReorder(...)` in the same file to announce successful position changes after the new order is committed.
- Added a visually hidden `role="status"` / `aria-live="polite"` region near the active sessions grid so the reorder result is announced without adding visible chrome.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new announcement helper, live-region wiring, and non-functional changes to the reorder handlers.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was still the `Chats` shell and `aria-label="Session tile layout"` was absent, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving reorder confirmation implicit would keep the implementation slightly smaller, but it would preserve a real accessibility and predictability gap after the move completes.
- Adding visible toast or inline badge feedback would also confirm the action, but it would spend more permanent or transient visual chrome on an already dense tiled workflow.
- Announcing only keyboard reorders would improve accessibility somewhat, but it would create inconsistent confirmation behavior between keyboard and drag interactions.

### What still needs attention
- This reorder announcement should still be runtime-validated on a real tiled sessions surface to confirm the live-region timing feels natural after both drag/drop and arrow-key reorder in Electron.
- If runtime validation shows users still want stronger confirmation, a future pass could add a subtle temporary visual cue on the moved tile without replacing the live-region announcement.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves reorder confirmation, not layout width negotiation.

## Iteration 59 - Make tile context usage readable at a glance in roomier footers

### Area inspected
- `tiling-ux.md`, specifically the older open notes about tile-footer hierarchy and whether context usage needed a clearer textual cue rather than revisiting the most recent reorder or panel-recovery work
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight `electron_execute` inspection of the attached renderer before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally pick an older tile-internal density follow-up instead of the newest reorder and floating-panel threads.
2. Inspect the tile footer in `AgentProgress`, especially the runtime metadata row that shows ACP/model details plus the context-usage meter.
3. Confirm that wide focused/expanded tiles already had enough room for richer footer metadata, but the context signal itself still rendered as a bare progress bar with no persistent text explaining what it represented.
4. Probe the running renderer with `electron_execute`; it was still attached to `http://localhost:19007/` on the `Chats` shell rather than a trustworthy tiled sessions surface, so this pass remained code- and test-led.

### UX problem found
- In tiled session footers, the context-usage signal relied mostly on a tiny bar and a hover tooltip.
- That made it easy to miss or misread at a glance, especially because neighboring footer metadata is textual while the context signal alone was purely graphical.
- The ambiguity was most noticeable in roomier focused/expanded tiles where there was enough space to explain the metric without paying the density cost that compact tiles would suffer.

### Assumptions
- It is acceptable to add a textual context cue only when the tile footer is already in its roomier state, because compact and unfocused tiles still need to stay as light as possible.
- It is acceptable to keep the compact footer path meter-only, because the main problem is discoverability where space exists, not forcing more chrome into already-tight layouts.
- A documented renderer inspection attempt, the focused tile-layout source test, and desktop web typecheck are sufficient for this pass because the attached Electron target was not the real tiled sessions route.

### Decision and rationale
- Keep the existing footer meter and tooltip behavior.
- Add a lightweight inline `Context N%` label beside the meter only when the tile is using its roomier footer state.
- Reuse shared derived footer state so the bar fill, tooltip, and new text cue all stay aligned.
- This is better than leaving the meter unlabeled because the footer becomes self-explanatory at a glance, and better than always showing full token counts because that would spend too much space on compact or multi-tile states.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive tile-local context usage ratio, percent, and tooltip copy for the tile footer.
- Added a small `Context …%` footer label in the same file for non-compact tile footers while keeping compact/unfocused footers meter-only.
- Added a local compact token-count formatter so the footer tooltip copy stays readable without repeating raw math inline.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new derived context state and wide-footer label wiring.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was still the `Chats` shell rather than a trustworthy tiled sessions route, so live tiled-session validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the footer meter graphical-only would keep the implementation smaller, but it would preserve a real scanability gap in the one tile state that actually has room to explain itself.
- Showing full token counts directly in the footer would be more precise, but it would add more visual weight than needed for an at-a-glance tile signal.
- Adding the text cue in every footer state would be more consistent, but it would reintroduce density pressure in compact and multi-tile layouts where the lighter meter-only treatment is still appropriate.

### What still needs attention
- This footer context label should still be runtime-validated on a real tiled sessions surface to confirm it reads clearly beside ACP/model metadata while tiles resize and focus changes.
- If runtime validation shows users want more precision than `Context N%`, a later pass could test whether roomy tiles should show compact token counts inline while compact tiles keep the current lighter label-free meter.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves tile-local footer clarity, not how much horizontal room tiled sessions receive.

## Iteration 59 - Make clipped-history tile badges read as a state, not generic preview chrome

### Area inspected
- `tiling-ux.md`, specifically the open follow-up from Iteration 53 rather than the more recent floating-panel recovery thread
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight `electron_execute` inspection of the attached renderer before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally choose an older open tile-internal follow-up instead of repeating the latest floating-panel/header recovery work.
2. Inspect the tile header preview badge added in Iteration 53 and compare its at-rest scanability against stronger state chips like `Collapsed` and `Approval`.
3. Confirm that the tile body already explains hidden transcript history well, but the header badge still only says `Preview`, which can read like generic UI chrome rather than a meaningful tile state.
4. Probe the running Electron renderer with `electron_execute`; it was reachable at `http://localhost:19007/`, but the visible surface was still the `Chats` shell rather than the tiled sessions page, so this pass remained source- and test-validated.

### UX problem found
- The header-level clipped-history badge helped surface state earlier than the transcript body, but `Preview` remained too generic to communicate what was actually being previewed.
- During tile scanning, `Preview` can read like incidental product chrome instead of a warning that earlier transcript history is currently hidden.
- That weakens the header cue right where it is supposed to reduce ambiguity before a user starts reading the tile body.

### Assumptions
- It is acceptable to make the badge copy slightly more explicit (`Recent only` on roomy tiles, `Recent` on compact tiles) because that adds clarity without introducing a new control.
- It is acceptable to slightly strengthen the badge styling while keeping it in the same passive-meta row, because the goal is better scanability rather than turning clipped history into a primary action.
- A documented Electron inspection attempt, the focused tile-layout source test, and desktop web typecheck are sufficient for this pass because the real tiled sessions surface was not inspectable.

### Decision and rationale
- Keep the existing transcript-body preview callout and recovery guidance unchanged.
- Replace the header badge's generic `Preview` label with width-aware copy that reads more like a state: `Recent only` on normal tiles and `Recent` on compact tiles.
- Tighten the tooltip copy to match that framing (`Showing recent updates only...`) and slightly strengthen the badge colors so the state reads sooner while scanning several tiles.
- This is better than adding another control because the recovery path already exists, and better than keeping `Preview` because the badge now describes the actual clipped-history state instead of a vague UI concept.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `tileHeaderPreviewBadgeLabel` and `tileHeaderPreviewBadgeTitle` from the existing clipped-history state.
- Updated the same badge so roomy tiles show `Recent only`, compact tiles show `Recent`, and the styling uses a slightly stronger blue treatment.
- Left the transcript-body `Recent updates preview` callout unchanged so the fuller explanation still appears where users encounter the clipped history directly.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new label logic, tooltip copy, and strengthened badge styling.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was still the `Chats` shell rather than the tiled sessions page, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the label as `Preview` would keep the smallest badge footprint, but it would preserve ambiguity about what state the chip is actually communicating.
- Replacing the badge with a longer `Recent updates preview` label would be more explicit in isolation, but it would spend too much width in already compact tile headers.
- Adding a dedicated `Show full history` button would be more direct, but it would add new action chrome for an issue that is really about state clarity, not missing capability.

### What still needs attention
- This stronger clipped-history badge should still be runtime-validated on a real tiled sessions surface to confirm the wording feels clearer without becoming repetitive beside the transcript-body callout.
- If runtime validation shows the stronger blue badge now competes too much with `Approval`, the next likely follow-up is rebalancing color intensity rather than changing the wording again.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves tile-internal state clarity, not layout width negotiation.

## Iteration 60 - Stop promising near-stacked panel shrink recovery when it will not actually clear the warning

### Area inspected
- `tiling-ux.md`, specifically the older floating-panel allocation follow-up from Iterations 56-57 after completing a separate tile-internal pass in Iteration 59
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection of the attached renderer before documenting results

### Repro steps reviewed
1. Re-read the ledger and intentionally return to the still-open panel-versus-tiles allocation thread rather than revisiting the new tile preview badge immediately.
2. Inspect the near-stacked sessions header logic around `showShrinkPanelForLayoutPressure`, `showHidePanelForLayoutPressure`, and the warning-buffer calculation.
3. Confirm that near-stacked headers still surface `Shrink panel` whenever the floating panel can get narrower, even if shrinking it all the way to `minWidth` would still leave the layout inside the near-stacked warning zone.
4. Probe the attached renderer for `aria-label="Session tile layout"`; the renderer was still reachable at `http://localhost:19007/`, but the visible surface remained the `Chats` shell, so this pass stayed code- and test-validated.

### UX problem found
- In the near-stacked state, the header could recommend `Shrink panel` with tooltip copy that promised it would keep sessions from stacking.
- That promise was not always true: if the panel could only recover a small amount of width, the layout could remain in the same warning state even after a full shrink.
- This creates avoidable trial-and-error: users are told a milder action should solve the pressure, then may have to discover afterward that `Hide panel` was still the real fix.

### Assumptions
- It is acceptable to estimate post-shrink sessions width as the current grid width plus the recoverable panel-width delta, because the floating panel and sessions area compete directly for horizontal space.
- It is acceptable to surface `Hide panel` in near-stacked states when shrinking cannot clear the warning buffer, because the UI is then preventing misleading guidance rather than over-promoting a stronger action arbitrarily.
- It is acceptable to keep the stronger visual prioritization reserved for already-stacked states, because near-stacked is still a warning rather than an already degraded fallback.
- The renderer probe plus focused source test and desktop web typecheck are sufficient for this pass because the attached Electron target still was not the real tiled sessions surface.

### Decision and rationale
- Derive how much width a full panel shrink could realistically recover, then evaluate whether that recovered width would move the sessions area out of the near-stacked warning zone.
- If shrinking can clear the warning, keep the existing conservative flow and tooltip copy.
- If shrinking cannot clear the warning, keep `Shrink panel` available as a milder “helps somewhat” action but also surface `Hide panel`, and soften the shrink tooltip so it no longer over-promises.
- This is better than the old logic because the recovery guidance now reflects likely outcomes instead of implying that every shrink-capable panel can fully solve near-stacked pressure.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `panelWidthGainFromShrinkingForLayoutPressure` and `sessionGridWidthAfterShrinkingPanelForLayoutPressure` from the current floating-panel state.
- Added `canResolveNearStackedLayoutPressureByShrinkingPanel` plus `showHidePanelForNearStackedLayoutPressure` so near-stacked headers can decide whether a full panel shrink actually clears the warning buffer.
- Updated the near-stacked `Shrink panel` tooltip copy so it only promises to prevent stacking when the computed shrink is actually sufficient; otherwise it now explains that shrinking helps somewhat but hiding is more reliable.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new width-recovery calculation, the new near-stacked hide-action condition, and the revised shrink-tooltip branch.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface still reported title `Chats` and did not expose `aria-label="Session tile layout"`, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the old logic intact would keep the action row slightly simpler, but it would continue making a stronger promise for `Shrink panel` than the width math can always support.
- Promoting `Hide panel` visually in these near-stacked states too would be more forceful, but it would blur the distinction between “warning” and “already stacked” states.
- Replacing `Shrink panel` entirely once it cannot fully clear the warning would be more decisive, but it would remove a still-useful lower-disruption action that can recover some room immediately.

### What still needs attention
- This smarter near-stacked recovery guidance should still be runtime-validated on a real tiled sessions surface to confirm that showing both actions only when shrink cannot clear the warning feels intuitive rather than overly cautious.
- If runtime use shows that the “helps a bit, hide is more reliable” shrink tooltip reads too verbose, the next likely follow-up is shortening that copy while preserving the same truthfulness.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves the honesty of recovery guidance, not automatic space rebalancing.

## Iteration 61 - Let the tightest Single view headers show position only once

### Area inspected
- `tiling-ux.md`, especially the earlier `Single view` header-density iterations around the focused summary chip, compact browse label, and compact `Back` affordance
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the recent panel-recovery passes.
2. Inspect the `Single view` header logic in `sessions.tsx`, especially the combination of the focused summary chip and the previous/next browse group on compact and very compact widths.
3. Confirm that on the very tightest headers the focused summary chip already shows `Single · current/total` while the browse group also shows the same `current/total` label between the arrows.
4. Probe the attached renderer with `electron_execute`; the reachable surface was still `Chats` at `http://localhost:19007/` without the tiled sessions page, so this pass stayed source- and test-validated.

### UX problem found
- On very compact `Single view` headers, the focused summary chip and the browse group were both surfacing the same position cue (`current/total`).
- That duplication spent width in the exact state where the header is already juggling `Back`, previous/next browsing, and layout switching.
- The repeated count also weakened hierarchy: the summary chip is mainly there to explain mode/state, while the browse group is the more natural place for the current position once the user is actively paging.

### Assumptions
- It is acceptable for the very-compact focused summary chip to drop its visible count badge when the browse group is already showing the same position, because the chip still keeps the explicit `Single` mode cue and its tooltip retains the fuller context.
- It is acceptable to let the browse group own the visible `current/total` label on the tightest headers, because that keeps the position indicator closest to the previous/next action it describes.
- Focused source-based tests and desktop web typecheck are sufficient for this pass because the change is renderer-local and no trustworthy tiled-sessions runtime surface was available.

### Decision and rationale
- Keep the existing focused summary chip, compact browse label, and browse-button tooltip behavior unchanged on roomy and merely compact headers.
- On very compact headers only, hide the focused summary chip's visible count badge when the browse group is already using that same `current/total` label.
- Keep the browse group's inline position label as the single visible count cue in that state.
- This is better than removing the browse label, because that would make previous/next browsing more ambiguous again.
- This is better than keeping both counts, because the tighter state benefits more from removing redundant chrome than from repeating the same orientation signal twice.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `focusedSessionBrowsePositionLabel` and `showFocusedLayoutCountBadge` from the existing focused-layout state.
- Updated the same file so very compact `Single view` headers keep the `Single` mode cue in the focused summary chip while letting the browse group own the lone visible `current/total` label.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new browse-position and summary-badge coordination.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new focused-summary badge visibility rule.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was still the `Chats` shell and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving both visible counts in place would preserve the status quo, but it would keep redundant chrome exactly where the header can least afford it.
- Removing the browse-group label instead would save similar width, but it would push the current-position cue away from the previous/next controls and make the pager feel less self-explanatory.
- Replacing the count with a truncated current-session title on the tightest headers could add more context, but it would be a riskier width tradeoff than this smaller de-duplication pass.

### What still needs attention
- This de-duplicated very-compact `Single view` header should still be visually validated on a real tiled sessions surface to confirm the remaining `Back` button, browse group, and layout controls wrap cleanly across sidebar widths.
- If runtime validation still shows `Single view` feeling too implicit on the tightest widths, the next likely follow-up is testing a slightly stronger enter/exit transition cue rather than adding more permanent header chrome.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves maximized-header density, not when the app should proactively reclaim more horizontal space.

## Iteration 62 - Keep the floating panel's width-recovery tab stable while users hover it

### Area inspected
- `tiling-ux.md`, specifically the older floating-panel/tiled-workflow recovery thread instead of the more recent `Single view` header passes
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally pick a not-recently-inspected floating-panel affordance follow-up.
2. Inspect the left-edge `Shrink width` recovery tab in `PanelResizeWrapper`, especially how it interacts with `hoveredResizeHandle` and `showRestingWidthRecoveryHint`.
3. Confirm that the tab sets the left-edge hover state on mouse enter and focus, but the visibility condition still hides the tab whenever any resize handle is highlighted.
4. Probe the attached renderer with `electron_execute`; it remained reachable at `http://localhost:19007/`, but the visible surface was still `Chats`, not a trustworthy floating-panel-plus-tiled-sessions workflow.

### UX problem found
- The visible `Shrink width` edge tab was meant to act like an explicit recovery CTA for reclaiming sessions space from the floating panel.
- But hovering or focusing that tab set `hoveredResizeHandle` to `left`, which made `showRestingWidthRecoveryHint` flip false and removed the tab.
- That makes the control feel unstable right when the user tries to use it, weakening confidence in a recovery affordance that should feel immediate and predictable.

### Assumptions
- It is acceptable to keep the recovery tab visible while the left edge itself is highlighted, because that preserves the existing intent of reinforcing the sessions-facing resize rail rather than treating the tab as a separate state.
- It is acceptable to keep hiding the tab during active resize or while other edges are highlighted, because the goal is stability for the same control, not permanently increasing panel chrome.
- A focused source-backed test and desktop web typecheck are sufficient for this pass because the reachable runtime surface was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the existing tab copy, placement, and left-edge highlight behavior unchanged.
- Narrow the hide condition so the recovery tab stays visible when the highlighted resize handle is also `left`.
- Still hide it during active resize and when another edge/corner is highlighted, so the panel does not gain extra persistent chrome.
- This is better than adding more explanatory UI because the actual problem was a local visibility contradiction, not missing instructions.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` so `showRestingWidthRecoveryHint` stays true when the currently highlighted resize handle is `left`.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the refined visibility condition.
- Added a focused test assertion covering the intended hover/focus stability of the width-recovery tab.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface still exposed `Chats` rather than a trustworthy floating-panel/tiled-sessions workflow, so live validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the old condition in place would keep the code slightly simpler, but it would preserve a visible CTA that disappears when hovered or focused.
- Keeping the tab visible for every highlighted edge would avoid conditional complexity, but it would make the recovery cue linger in unrelated resize states.
- Reworking the tab into a larger drag surface could also help, but that is a separate interaction-shape decision and larger than this local stability fix.

### What still needs attention
- This hover/focus stability fix should still be runtime-validated on a real floating-panel-plus-tiled-sessions workflow to confirm the tab now feels steady and the left-edge highlight remains helpful.
- If live use still suggests people expect to drag the visible tab itself, the next likely follow-up is widening the left resize handle into more of the tab footprint rather than changing copy again.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves recovery affordance stability, not when the app should proactively reclaim more width.

## Iteration 62 - Keep Single view return controls visually attached to layout switching

### Area inspected
- `tiling-ux.md`, especially the earlier `Single view` restore iterations and the still-open note about a stronger relationship between active `Single` mode and the restore affordance
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- previously attached renderer surface status from `electron_execute` (`Chats`, not the tiled sessions page)

### Repro steps reviewed
1. Re-read the ledger and intentionally choose an older `Single view` follow-up instead of repeating the most recent near-stacked floating-panel pass.
2. Inspect the compact sessions action row in `sessions.tsx`, especially the order of panel-recovery actions, the `Back to ...` restore button, the single-view pager, and the layout switcher.
3. Confirm that the restore affordance still rendered as a separate generic button ahead of the pager and layout group, even though its meaning is specifically “leave `Single view` and return to the remembered tiled mode.”
4. Keep this pass source- and test-led because the reachable renderer target still was not the repo's actual tiled sessions surface.

### UX problem found
- The dedicated `Back to Compare/Grid` affordance was explicit, but it still lived in the action row like a generic standalone button rather than part of the layout-mode cluster.
- In `Single view`, that weakened the relationship between the selected `Single` layout button and the contextual way back to the remembered multi-tile layout.
- On tighter headers, the separation made the exit path feel slightly more arbitrary than the pager and layout controls around it, even though it is fundamentally a mode-transition control.

### Assumptions
- It is acceptable to keep the restore behavior unchanged and only improve grouping, because the current issue is scanability and relationship clarity rather than missing capability.
- It is acceptable to reuse the existing layout-switcher styling and simply cluster the restore affordance beside it, because this is a local sessions-header hierarchy problem rather than a new interaction model.
- Focused source-backed tests plus desktop web typecheck are sufficient for this pass because the attached runtime surface still was not a trustworthy tiled sessions repro.

### Decision and rationale
- Keep the explicit `Back to ...` restore affordance from earlier iterations.
- Move it into a shared `sessionTileModeControls` cluster with the persistent layout switcher so it reads as part of the same layout-mode control family.
- Leave the single-view pager separate, since it changes which session is being shown rather than which layout mode is active.
- This is better than changing the restore semantics or adding more explanatory chrome because it makes the relationship clearer with a very small local markup change.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to extract `singleViewRestoreButton`, `sessionTileLayoutButtonGroup`, and `sessionTileModeControls` so the restore affordance now renders directly beside the layout switcher.
- Kept the existing restore button copy (`Back` / `Back to ...`), title, icon, and behavior unchanged.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new mode-control clustering structure.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- Live tiled-sessions runtime validation was still not practical because the reachable renderer target remained a separate `Chats` surface rather than this repo's sessions page.

### Tradeoffs considered
- Leaving the restore button as a standalone action would keep the markup slightly flatter, but it would preserve the weak visual relationship between `Single view` and its remembered return path.
- Folding the restore behavior into the active `Single` button would reduce chrome further, but earlier iterations intentionally kept direct-select layout semantics stable and a dedicated restore path more discoverable.
- Grouping the pager with the layout controls too would create one larger cluster, but pager actions are session-navigation controls, not layout-mode controls.

### What still needs attention
- This tighter restore/layout grouping should still be runtime-validated on a real tiled sessions surface, especially in compact headers where pager, panel-recovery, and layout controls all compete for width.
- If `Single view` still feels sticky after live validation, the next likely follow-up is whether panel-recovery actions or the pager should yield first when compact headers need one more level of prioritization.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves the clarity of the `Single view` exit relationship, not space negotiation between surfaces.

## Iteration 63 - Keep compact Single view navigation and layout switching ahead of panel recovery

### Area inspected
- `tiling-ux.md`, especially Iteration 62's note about compact `Single view` needing one more priority decision
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`

### Repro steps reviewed
1. Re-read the ledger to pick up the explicit follow-up left open by Iteration 62 instead of starting a new layout-control thread.
2. Inspect the compact `Single view` action row ordering in `sessions.tsx`, focusing on the pager, the layout-mode cluster, and the stacked/near-stacked floating-panel recovery actions.
3. Confirm the intended compact-header priority: changing which session is shown and changing the layout should stay more immediately reachable than reclaiming panel width.
4. Validate the structure through focused source-backed tests and desktop web typecheck because a trustworthy live tiled-sessions surface still was not available in the attached runtime.

### UX problem found
- After Iteration 62 grouped the `Back to ...` affordance with the layout switcher, compact `Single view` still had one unresolved hierarchy question: floating-panel recovery actions could compete with the pager and layout controls in the same cramped action row.
- In that state, the most session-centric controls could lose visual priority even though people in `Single view` are more likely to first browse sessions or exit back to a tiled mode than immediately change floating-panel visibility.
- The result was not a missing capability, but a scan-order issue on narrow headers where recovery actions could feel too eager relative to core `Single view` navigation.

### Assumptions
- It is acceptable to keep the existing panel-recovery actions available in compact `Single view`; the issue is their placement priority, not whether recovery should exist.
- It is acceptable to treat pager plus layout-mode controls as the primary compact `Single view` cluster because both directly affect what the user is viewing, while panel recovery is a secondary workspace-management step.
- Focused source-backed tests plus `typecheck:web` remain sufficient for this pass because live tiled-sessions runtime validation still was not reliably available.

### Decision and rationale
- Keep the panel-recovery actions intact, but defer them behind the pager and `sessionTileModeControls` when `Single view` is shown in a compact header.
- Continue showing panel-recovery actions inline in roomier contexts so the improvement stays narrowly targeted to the cramped `Single view` case.
- This is better than removing recovery actions or adding more copy because it resolves the hierarchy problem with a small ordering change that preserves all existing affordances.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to extract `layoutPressureActionButtons`, `focusedSessionBrowseControls`, and `shouldDeferLayoutPressureActionsInCompactSingleView` so compact `Single view` headers now render browse controls and the layout-mode cluster before panel-recovery actions.
- Kept the pager, restore affordance, layout switcher, and panel-recovery copy/behavior unchanged outside of the compact ordering rule.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new compact `Single view` control priority.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- Live tiled-sessions runtime validation still was not practical because the reachable renderer target was not a trustworthy sessions-page repro.

### Tradeoffs considered
- Leaving panel-recovery actions ahead of the pager/layout cluster would preserve a flatter action row, but it would keep the compact `Single view` scan order biased toward workspace recovery instead of core viewing/navigation actions.
- Hiding panel-recovery actions entirely in compact `Single view` would simplify the row further, but it would remove an available recovery path exactly when narrow headers may make it useful.
- Folding pager and recovery actions into one larger shared group would reduce separation, but it would blur the difference between session navigation, layout mode changes, and workspace-width recovery.

### What still needs attention
- This compact control-priority change should still be runtime-validated on a real tiled sessions surface to confirm the row now reads in the intended order under real width pressure.
- If live use still shows too much header competition, the next likely follow-up is whether near-stacked warnings or other passive metadata should yield before controls in the tightest widths.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass only improves compact `Single view` control hierarchy.

## Iteration 63 - Let compact Single view keep layout and browsing controls ahead of panel recovery

### Area inspected
- `tiling-ux.md`, specifically the open follow-up from Iteration 62 about whether panel-recovery actions or the pager should yield first on compact `Single view` headers
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally pick the still-open compact-`Single view` prioritization follow-up instead of repeating the recent panel-recovery copy work.
2. Inspect the right side of the sessions header in `sessions.tsx`, especially the order of panel-recovery actions, the `Single view` pager, and the restore/layout controls.
3. Confirm that compact headers still rendered panel-recovery actions before the pager and layout controls, which means they could claim the first wrap slot even though they are secondary to mode switching and in-place browsing during `Single view`.
4. Probe the attached renderer with `electron_execute`; it was still reachable at `http://localhost:19007/`, but the visible surface remained the `Chats` shell rather than the tiled sessions page, so this pass stayed source- and test-validated.

### UX problem found
- On compact `Single view` headers, panel-recovery actions (`Shrink panel` / `Hide panel`) still rendered ahead of the pager and layout controls.
- When horizontal room got tight, that ordering could make the recovery actions feel more primary than the controls that actually define and navigate the current tiled state.
- The result was subtle but important hierarchy drift: users in `Single view` need to keep mode-switching and previous/next session browsing visually anchored first, while panel recovery should help without taking over the header.

### Assumptions
- It is acceptable to keep the same recovery actions, labels, tooltips, and behavior, because the issue here is header priority and wrapping order rather than missing capability.
- It is acceptable to scope this to compact `Single view` only, because compare/grid pressure states still benefit from surfacing panel recovery earlier when multiple tiles are actively competing for space.
- Source-backed tests plus desktop web typecheck are sufficient for this pass because the reachable renderer target still was not the actual tiled sessions surface.

### Decision and rationale
- Keep the existing panel-recovery actions available.
- In compact `Single view` only, defer those recovery actions until after the pager and the restore/layout-mode cluster.
- Extract the pager and panel-recovery controls into named fragments so the intended priority is explicit in code and easy to lock down in tests.
- This is better than removing recovery actions on tight headers because users still need them, and better than leaving the old order because the active mode/navigation controls now stay visually attached first when wrapping occurs.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to extract `layoutPressureActionButtons` and `focusedSessionBrowseControls` from the compact header action row.
- Added `shouldDeferLayoutPressureActionsInCompactSingleView` so compact `Single view` headers render panel-recovery actions after browsing and layout controls instead of before them.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new compact `Single view` priority order.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface still reported title `Chats` and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving panel-recovery actions first would keep the action row flatter, but it would preserve the weak hierarchy in the exact compact state where priority matters most.
- Hiding one of the recovery actions on compact `Single view` would reduce clutter further, but it would also remove an available recovery path instead of simply demoting it.
- Moving recovery actions after the pager/layout controls in every layout would over-correct; compare/grid pressure states still benefit from surfacing those actions earlier.

### What still needs attention
- This compact `Single view` reprioritization should still be runtime-validated on a real tiled sessions surface to confirm the wrap behavior reads more clearly across sidebar widths.
- If live validation still shows header pressure, the next likely follow-up is whether the pager label or one of the panel-recovery labels should compress further before the layout controls give up space.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves control hierarchy under pressure, not automatic space negotiation.

## Iteration 64 - Let the floating panel's visible shrink tab actually drag like it claims

### Area inspected
- `tiling-ux.md`, especially Iteration 62's open note about whether the visible width-recovery tab should act more like part of the resize affordance
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger and intentionally pick a floating-panel/tiled-workflow follow-up that had not been revisited recently.
2. Inspect `PanelResizeWrapper` around the visible `Shrink width` recovery tab and compare its behavior with the text it already exposed in the title tooltip.
3. Confirm that the tab was clickable and hover-stable, but still did not support pointer drag even though its copy implied a resize relationship.
4. Probe the attached renderer with `electron_execute`; the reachable surface still exposed the `Chats` shell rather than a trustworthy tiled sessions workflow, so this pass remained source- and test-validated.

### UX problem found
- The visible width-recovery tab already sat directly on the sessions-facing resize edge and its title said `Click to shrink width. Drag ... to resize panel width.`
- In practice, the tab only supported click-to-shrink; dragging it did nothing because the true resize gesture still lived on the thinner left-edge handle behind/around it.
- That mismatch creates a trust problem in a local but important affordance: the UI looked and read like a drag target, but users had to discover that only the narrow invisible edge actually resized the panel.

### Assumptions
- It is acceptable to keep the tab's existing single-click shrink behavior and add drag behavior on top, because the user value here is making the visible affordance more truthful rather than replacing a working shortcut.
- It is acceptable to treat a small pointer movement threshold as the divider between `click to shrink` and `drag to resize`, because that preserves the existing quick action while allowing the same surface to behave like the resize affordance users expect.
- Focused renderer tests plus desktop web typecheck are sufficient for this pass because the reachable Electron renderer still was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the visible `Shrink width` tab and its current role as the quickest way to give space back to tiled sessions.
- Let that same tab begin a left-edge resize drag once the pointer moves past a small threshold, while preserving normal click-to-shrink when there is no real drag.
- Update the tooltip copy to explicitly say `Drag this tab...` and give the tab an `ew-resize` cursor so its behavior and appearance are aligned.
- This is better than just changing copy again because the underlying problem was not wording alone; it was that the visible control and the actual drag affordance still disagreed.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add a small drag-threshold gesture for the resting width-recovery tab.
- Extended `handleResizeStart` in the same file so the tab can reuse the existing left-edge resize flow with the pointer-down size captured at gesture start.
- Added document-level move/up handling for that tab so dragging it now routes through the existing resize update + persist path, while plain click still triggers the compact-width shortcut.
- Updated the tab title copy to `Click to shrink width. Drag this tab to resize panel width.` and added an `ew-resize` cursor to reinforce that it is a resize surface.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new drag threshold, pointer-down wiring, drag-to-resize reuse of the left-edge flow, and updated tab styling/copy.

### Verification
- `electron_execute` reached the attached renderer, but it still exposed the `Chats` shell rather than a trustworthy tiled sessions + floating-panel workflow, so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the tab click-only would keep the implementation smaller, but it would preserve a visible affordance that still overstates its drag behavior.
- Widening the hidden left resize handle without changing the tab itself would help somewhat, but it would still leave the visible control feeling misleadingly separate from the actual drag interaction.
- Replacing the shrink tab with a pure drag handle would make the resize story cleaner, but it would remove a high-value one-click recovery action that already helps users give space back to tiled sessions quickly.

### What still needs attention
- This drag-enabled recovery tab should still be runtime-validated in a real floating-panel-plus-tiled-sessions workflow to confirm the click-vs-drag threshold feels forgiving and the gesture does not trigger accidental shrinks.
- If live use shows that people now expect the whole tab footprint to be even more forgiving, the next likely follow-up is whether the left-edge handle and tab should share a slightly larger combined drag target.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves honesty and usability of one recovery affordance, not when the app should proactively reclaim more width.

## Iteration 64 - Restore model comparison cues in roomy multi-tile footers without re-crowding narrow tiles

### Area inspected
- `tiling-ux.md`, specifically older tile-footer hierarchy notes to avoid repeating the recent sessions-header and panel-recovery work
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose an older tile-internal follow-up rather than another header-compaction or panel-recovery pass.
2. Inspect the tile footer rules in `agent-progress.tsx`, especially the interaction between `shouldUseCompactTileFooter`, `showTileModelInfo`, and the width-based `isCompactTileVariant` signal.
3. Confirm that non-ACP model/provider info was still hidden for every unfocused, non-expanded tile, even when the tile remained roomy enough to support a short model badge.
4. Probe the attached renderer with `electron_execute`; it was still reachable at `http://localhost:19007/`, but the visible surface remained `Chats` rather than the tiled sessions page, so this pass stayed source- and test-validated.

### UX problem found
- Earlier density passes correctly removed lower-priority footer chrome from cramped tiles, but the current rule also suppresses non-ACP model info in roomier compare/grid tiles simply because they are not focused.
- That weakens side-by-side scanability in tiled workflows: users can compare transcript progress, status, and context pressure, but lose a quick at-rest cue for which model each roomy tile is using.
- The current behavior over-applies a compact-footers decision beyond the narrow-width state it was really trying to protect.

### Assumptions
- It is acceptable to revisit the older `hide model info in unfocused footers` decision now that later passes already reduced other footer noise, because the remaining chrome budget in roomy tiles is materially better than it was when that decision was made.
- It is acceptable to keep truly compact tiles unchanged and only restore model info when `isCompactTileVariant` is false, because narrow tiles still need the lighter footer treatment more than they need richer comparison metadata.
- Focused source-backed tests plus desktop web typecheck are sufficient for this pass because the attached Electron target still was not the tiled sessions route.

### Decision and rationale
- Keep `shouldUseCompactTileFooter` for the overall quieter unfocused-footer treatment.
- Decouple non-ACP model visibility from focus state and instead key it off tile width, so roomy multi-tile cards can still surface a short provider/model cue.
- Leave compact tiles and ACP compact-badge behavior unchanged so the earlier narrow-width density wins remain intact.
- This is better than restoring model text everywhere because it improves compare/grid scanability where space exists without reintroducing the footer crowding that earlier passes intentionally removed.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so `showTileModelInfo` now depends on `!isCompactTileVariant` instead of the broader `!shouldUseCompactTileFooter` rule.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new width-aware footer-model rule and document the intended comparison-focused behavior.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface still reported title `Chats` and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving model info hidden in every unfocused tile would keep the footer marginally quieter, but it would preserve a real comparison blind spot in roomy side-by-side layouts.
- Restoring model info in all compact and unfocused states would maximize consistency, but it would undo the earlier density improvements exactly where tiles are already tight.
- Adding a new dedicated model badge treatment or disclosure would provide more explicitness, but it would be a larger chrome change than necessary for this small scanability fix.

### What still needs attention
- This width-aware footer-model restoration should still be runtime-validated on a real tiled sessions surface to confirm the extra badge feels helpful rather than busy while tiles resize and focus changes.
- If live use shows roomy unfocused footers are still too dense, the next likely refinement is a softer visual treatment for the restored model text rather than hiding it again outright.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves tile-local comparison clarity, not how much room the tiled layout receives.

## Iteration 65 - Quantify panel-recovery actions so tiled-session relief is easier to predict

### Area inspected
- `tiling-ux.md`, specifically the still-open floating-panel-versus-tiled-session allocation thread rather than the most recent tile-footer pass
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose an older allocation/panel-pressure follow-up instead of another tile-internal density pass.
2. Inspect the sessions header logic around `showShrinkPanelForLayoutPressure`, `showHidePanelForLayoutPressure`, and the existing title copy for those actions.
3. Confirm that the header already offered the right recovery actions, but visible labels still did not communicate how much room `Shrink panel` would actually buy back versus `Hide panel`.
4. Probe the attached renderer with `electron_execute`; it remained reachable at `http://localhost:19007/`, but the visible surface was still `Chats` rather than a trustworthy tiled sessions repro, so this pass stayed source- and test-validated.

### UX problem found
- When tiled layouts are stacked or near-stacked because the floating panel is crowding the sessions area, the header already exposes `Shrink panel` and/or `Hide panel`.
- But users still have to infer the likely effect of each action from wording alone, even after Iteration 60 made the near-stacked copy more truthful.
- That keeps panel recovery a little too guessy: `Shrink panel` might recover a meaningful amount of width or only a small amount, yet the visible control does not preview that outcome unless users hover the tooltip and mentally translate it.

### Assumptions
- It is acceptable to use the current recoverable panel-width delta as an approximate proxy for session-width relief because the floating panel and the tiled sessions area compete directly for horizontal space.
- It is acceptable to round the recovery estimate to whole pixels because the goal is decision clarity, not exact geometry reporting.
- It is acceptable to keep the new visible cue off compact headers, because adding more inline text in already-cramped action rows would risk reintroducing the crowding that several recent iterations removed.
- Focused source-backed tests plus desktop web typecheck remain sufficient for this pass because the reachable Electron target still was not the real tiled sessions surface.

### Decision and rationale
- Keep the existing `Shrink panel` / `Hide panel` actions and ordering rules unchanged.
- Add a small non-compact `+Npx` badge to `Shrink panel` so users can see the approximate room a full shrink would recover before they click.
- Extend both recovery-action tooltips with the same approximate width-return detail so even compact headers still provide the outcome estimate on hover.
- This is better than adding another control because the needed actions already exist, and better than hiding the estimate only in tooltip copy because the mild-action decision becomes more scannable without materially expanding the control set.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `shrinkPanelForLayoutPressureRecoveryWidth`, `shrinkPanelForLayoutPressureRecoveryLabel`, and matching tooltip-detail strings from the existing panel-width pressure calculation.
- Added the same approximate width-detail treatment for `Hide panel` tooltips using the current visible panel width as the `full relief` estimate.
- Rendered a compact tabular-numeric `+Npx` badge inside the `Shrink panel` button only when the header is not compact, preserving the tighter action rows on smaller widths.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new width-estimate derivation, tooltip-detail wiring, and visible badge rendering.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface still reported title `Chats` and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the actions unchanged would keep the header slightly simpler, but it would preserve the remaining guesswork around how much relief a panel shrink is likely to provide.
- Showing recovery estimates on every compact header too would maximize visibility, but it would also add width exactly where recent iterations have been carefully reducing header competition.
- Adding a new dedicated “recover space” control or auto-resizing the panel would be more forceful, but it would introduce broader behavior changes when the current issue is mostly about outcome clarity for existing actions.

### What still needs attention
- This recovery-estimate cue should still be runtime-validated on a real tiled sessions surface to confirm that the non-compact `+Npx` badge reads as helpful rather than noisy while panel width, sidebar width, and window width all change.
- If live use shows that people still hesitate between `Shrink panel` and `Hide panel`, the next likely follow-up is whether `Hide panel` also needs a lightweight visible outcome badge in roomy headers instead of relying on tooltip copy plus button priority alone.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves predictability of existing recovery actions, not when the app should automatically reclaim more width.

## Iteration 66 - Let very compact Single view headers drop redundant passive summary chrome

### Area inspected
- `tiling-ux.md`, specifically Iteration 63's open note about whether passive metadata should yield before controls in the tightest headers
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally pick the still-open compact-header metadata follow-up instead of repeating the recent panel-recovery estimate work.
2. Inspect the `Single view` summary-chip logic in `sessions.tsx`, especially how `focusedLayoutModeLabel`, `focusedLayoutCountLabel`, the pager label, and compact-width booleans interact.
3. Confirm that in very compact `Single view`, the pager already absorbs the `1/N` position label while the summary chip still renders, even though it no longer has meaningful secondary content to show.
4. Probe the attached renderer with `electron_execute`; it remained reachable at `http://localhost:19007/`, but the visible surface was still the `Chats` shell rather than a trustworthy tiled sessions repro, so this pass stayed source- and test-validated.

### UX problem found
- In very compact `Single view`, the passive summary chip could collapse into an almost-empty state because the session-count badge moves into the pager and the roomy `Showing ...` / `Browsing sessions` copy is intentionally suppressed.
- That means the header can spend a whole metadata row on a chip that contributes little or no distinct information while the real work happens in the pager and layout controls.
- The result is subtle but costly in a tight header: extra chrome, a weaker visual hierarchy, and a risk of awkward compact copy such as a bare `Single` marker where the active layout is already obvious from the controls.

### Assumptions
- It is acceptable for the pager and active layout buttons to carry the compact `Single view` context on the narrowest headers, because those controls already express both current mode and current session position.
- It is acceptable to keep the summary chip unchanged on roomier compact and non-compact headers, because it still adds useful explanatory context there.
- Focused source-backed tests plus desktop web typecheck remain sufficient for this pass because the reachable renderer target still was not the actual tiled sessions surface.

### Decision and rationale
- Introduce a dedicated `showFocusedLayoutSummaryChip` guard so the passive `Single view` summary only renders when it still adds meaningful context.
- In very compact `Single view`, let that summary chip yield entirely once the pager has absorbed the count and the verbose session/browsing copy is hidden.
- Reuse that same guard when deciding whether the compact header needs a separate metadata row, so the header no longer splits itself just to show redundant passive chrome.
- This is better than keeping the chip always visible because the narrowest state already has stronger active cues, and better than removing the chip from all compact headers because medium-width compact layouts still benefit from the extra explanation.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showFocusedLayoutSummaryChip` from the existing compact-header visibility rules and only render the `Single view` summary when it still adds count or descriptive context.
- Updated the same file so `hasCompactSessionHeaderMeta` keys off `showFocusedLayoutSummaryChip`, allowing very compact `Single view` headers to avoid a redundant metadata row.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new summary-chip guard and compact-header split behavior.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface still reported title `Chats` and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the summary chip always on would preserve maximum redundancy, but it would also keep spending header space on passive context that the narrowest `Single view` state already communicates elsewhere.
- Hiding the summary chip for every compact header would simplify the logic further, but it would remove useful explanatory context in medium-width compact layouts where the count badge and summary still fit comfortably.
- Moving the `1/N` count back out of the pager and into the passive chip would preserve the old row structure, but it would weaken the session-navigation affordance that recent iterations intentionally brought closer to the active controls.

### What still needs attention
- This very-compact `Single view` compaction should still be runtime-validated on a real tiled sessions surface to confirm the header now reads more cleanly across different sidebar widths.
- If live use still shows too much passive header competition, the next likely follow-up is whether near-stacked warning chips or temporary layout-state chips should yield earlier than they do today on the tightest headers.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass reduces redundant compact-header chrome, not how the app chooses to reclaim width.

## Iteration 67 - Let compact compare/grid headers prefer actionable recovery controls over passive pressure chips

### Area inspected
- `tiling-ux.md`, specifically the latest compact-header notes so this pass would not repeat the recent `Single view` cleanup
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the still-open compact compare/grid pressure-state follow-up instead of another `Single view` or floating-panel resize pass.
2. Inspect `sessions.tsx` around `showStackedLayoutRecoveryHint`, `showNearStackedLayoutHint`, panel-recovery buttons, and `hasCompactSessionHeaderMeta`.
3. Confirm that compact headers could still render passive stacked/near-stacked chips even when `Shrink panel` / `Hide panel` actions were already available, forcing extra metadata chrome in the same constrained state.
4. Probe the attached renderer with `electron_execute`; it was still reachable at `http://localhost:19007/`, but the visible surface remained the `Chats` shell rather than a trustworthy tiled sessions page, so this pass stayed source- and test-validated.

### UX problem found
- In compact compare/grid headers, passive layout-pressure chips (`Make room`, `Tight fit`) could remain visible even when actionable panel-recovery buttons were already present.
- That duplicated the same state explanation across a passive chip and an active button cluster, while also making the compact header more likely to split into an extra metadata row.
- The result weakened hierarchy under width pressure: users are better served by seeing the controls that can immediately recover space than by keeping redundant passive warning chrome beside them.

### Assumptions
- It is acceptable for compact headers to rely on the existing panel-recovery buttons and their detailed tooltips to communicate the pressure state when those actions are available, because those controls already explain both the problem and the remedy.
- It is acceptable to keep the passive pressure chips on roomy headers and on compact headers without available panel-recovery actions, because those are the states where the extra context still earns its space.
- Focused source-backed tests plus desktop web typecheck are sufficient for this pass because the reachable Electron target still was not the real tiled sessions route.

### Decision and rationale
- Add a compact-header guard that suppresses passive stacked/near-stacked hint chips only when `Shrink panel` or `Hide panel` actions are already available.
- Reuse that same guard when deciding whether the compact header needs a separate metadata row, so redundant pressure chips no longer force extra wrap in the exact state where space is tightest.
- Leave the underlying pressure detection, labels, and action behavior unchanged.
- This is better than removing the chips everywhere because roomy and non-actionable states still benefit from passive context, and better than keeping the chips on compact headers because it preserves duplicated chrome where active recovery controls are already doing the more useful job.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `shouldHidePassiveLayoutPressureHintChipsOnCompactHeader`, `showPassiveStackedLayoutRecoveryHint`, and `showPassiveNearStackedLayoutHint`.
- Updated the same file so `hasCompactSessionHeaderMeta` keys off the new passive-chip booleans, allowing compact compare/grid headers to avoid a redundant metadata row when actionable panel-recovery buttons are already present.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new compact-header suppression rule and the renamed passive-chip render gates.

### Verification
- `electron_execute` reached the attached renderer, but it still reported `http://localhost:19007/` with title `Chats` and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the passive chips visible would preserve maximum redundancy, but it would keep spending compact-header space on information that the recovery buttons already communicate more usefully.
- Hiding the pressure chips on all headers would simplify the chrome further, but it would also remove valuable passive state context in roomy layouts and in cases where no recovery action is currently available.
- Reworking the recovery buttons themselves into status+action hybrids could express the state even more explicitly, but it would be a broader control redesign than this local hierarchy fix needs.

### What still needs attention
- This compact compare/grid pressure-state cleanup should still be runtime-validated on a real tiled sessions surface to confirm the header now stays clearer across sidebar widths and floating-panel widths.
- If live use still shows too much compact-header competition in compare/grid mode, the next likely follow-up is whether one of the recovery button labels or badges should compress further before layout controls give up space.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass reduces redundant compact-header chrome, not how or when the app should proactively reclaim width.

## Iteration 68 - Let very compact one-visible compare/grid headers spend their chip on the adaptive state, not the redundant base mode

### Area inspected
- `tiling-ux.md`, specifically the latest compact-header notes to avoid repeating the recent pressure-chip cleanup
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the still-open very-compact header hierarchy thread rather than another floating-panel action pass.
2. Inspect `sessions.tsx` around `showCurrentLayoutChip`, `showLayoutDescriptionSuffix`, and `showCompactAdaptiveLayoutDescription` for the temporary `one visible session` compare/grid fallback.
3. Confirm that the chip still rendered on very compact headers, but once the header crossed the tight breakpoint it dropped the adaptive description and kept only the base `Compare view` / `Grid view` label.
4. Probe the attached renderer with `electron_execute`; it was still reachable at `http://localhost:19007/`, but the visible surface remained the `Chats` shell rather than a trustworthy tiled sessions page, so this pass stayed source- and test-validated.

### UX problem found
- In the temporary `one visible session` compare/grid state, the current-layout chip exists to explain why the selected multi-tile mode is temporarily showing only one tile.
- But on the very tightest headers, the chip dropped the adaptive `One visible` wording and kept only the already-redundant base layout name.
- That spent compact-header space on the least useful part of the message: the selected layout was already shown by the pressed layout button, while the missing piece was the adaptive fallback explanation.

### Assumptions
- It is acceptable to let the selected layout buttons remain the primary visible cue for `Compare` / `Grid` on the tightest headers, because they are always present and already communicate the persistent mode choice.
- It is acceptable for the very-compact chip to prioritize `One visible` over `Compare view` / `Grid view`, because the title tooltip still preserves the full `Current layout: …` explanation while the visible label can focus on the more decision-relevant adaptive state.
- Focused source-backed tests plus desktop web typecheck are sufficient for this pass because the reachable renderer target still was not the real tiled sessions route.

### Decision and rationale
- Keep the temporary one-visible chip, because that state still benefits from explicit explanation.
- On very compact headers only, swap the chip's primary visible label from the persistent base layout name to the adaptive short description (`One visible`).
- Leave compact and roomy headers unchanged so they can still show the fuller `Compare view · One visible` / `Grid view · One visible` treatment when space allows.
- This is better than removing the chip entirely because it preserves the explanation that a multi-tile layout is temporarily behaving differently, and better than keeping the old label because the old very-compact treatment used scarce space on information already visible elsewhere.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showVeryCompactAdaptiveLayoutLabel` and `currentLayoutChipLabel` from the existing temporary-layout state.
- Updated the same file so the current-layout chip now renders `activeLayoutCompactDescription` as its primary visible label on very compact headers instead of repeating `LAYOUT_LABELS[tileLayoutMode]`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new very-compact `One visible` prioritization.

### Verification
- `electron_execute` reached the attached renderer, but it still reported `http://localhost:19007/` with title `Chats` and did not expose the tiled sessions controls, so no trustworthy live tiled-session validation was practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the chip unchanged would keep the implementation smallest, but it would preserve a very-compact label that repeats the selected mode while hiding the actual adaptation users need explained.
- Removing the chip entirely on very compact headers would reduce chrome further, but it would also erase the only explicit explanation for why compare/grid is temporarily presenting a single full-width tile.
- Showing both the base layout and adaptive state even on very compact headers would maximize explicitness, but it would spend exactly the width budget this pass is trying to protect.

### What still needs attention
- This very-compact one-visible label prioritization should still be runtime-validated on a real tiled sessions surface to confirm the shorter chip reads clearly next to icon-only layout buttons.
- If live use shows the chip is still too subtle, the next likely follow-up is whether the icon or tooltip treatment should make the temporary-state explanation slightly more discoverable without re-expanding the label.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves compact-header message density, not how or when the app reclaims width.

## Iteration 69 - Quantify the panel-edge shrink tab so tiled-width recovery feels predictable

### Area inspected
- `tiling-ux.md`, specifically the recent compact-header iterations so this pass would avoid another header-only refinement
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally pivot away from the recent sessions-header compaction work.
2. Inspect the floating panel resize wrapper around the persistent sessions-facing `Shrink width` reminder tab and its tooltip copy.
3. Confirm that the tab already kept width recovery discoverable, but still required users to guess how much space a click would actually reclaim for tiled workflows.
4. Probe the attached renderer with `electron_execute`; it was reachable, but the visible surface stayed on the `Chats` shell at `/` and did not expose a trustworthy floating-panel + tiled-sessions repro, so this pass stayed source- and test-validated.

### UX problem found
- The floating panel already shows a persistent left-edge `Shrink width` tab after the panel has been widened, which is good for discoverability.
- But the tab and its tooltip still did not preview the amount of width that would be given back, so the action remained slightly guessy in the same way the sessions-header `Shrink panel` action used to be.
- In tiled workflows, that missing outcome cue matters: users are deciding whether shrinking the panel is worth it specifically to recover more compare/grid room.

### Assumptions
- It is acceptable to use `currentSize.width - minWidth` as the visible shrink amount because the resting tab always returns the panel to its minimum width, so that delta is the exact local outcome the control triggers.
- It is acceptable to show the recovery delta only on the persistent panel-edge tab, because that tab already appears only once the panel is meaningfully wider than its minimum and therefore has room for a small badge.
- Focused source-backed tests plus desktop web typecheck are sufficient for this pass because the reachable renderer target still was not the actual tiled sessions + floating panel surface.

### Decision and rationale
- Keep the existing `Shrink width` control, placement, and click/drag behavior unchanged.
- Add a compact tabular-numeric width-delta badge (`-Npx`) to the visible left-edge reminder tab so users can see the approximate size change before clicking.
- Mirror that same outcome detail into the button tooltip (`Click to shrink width by about Npx...`) so keyboard and hover discovery stay aligned with the visible badge.
- This is better than adding another recovery control or more copy because the affordance already exists; it just needed a clearer preview of the result.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to derive `restingWidthRecoveryAmount`, `restingWidthRecoveryAmountLabel`, and `restingWidthRecoveryHintTitle` from the current panel width versus minimum width.
- Added a small shared badge style and rendered the `-Npx` recovery badge in both the decorative reminder tab and the live clickable width-recovery tab so the visual and interactive surfaces stay consistent.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new quantified badge and tooltip treatment.

### Verification
- `electron_execute` reached the attached renderer, but it still reported the `Chats` shell at `/` and did not expose a trustworthy floating-panel/tiled-sessions repro for live validation.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the tab unchanged would keep the chrome slightly simpler, but it would preserve unnecessary guesswork around how much room shrinking the panel will recover.
- Reusing a `+Npx` framing like the sessions header could emphasize session-space gain, but on the panel edge itself `-Npx` is the more direct description of what the panel will do.
- Showing a larger explanatory label (`Shrink width by 120px`) would be more explicit, but it would also make the edge tab wider and more visually intrusive than needed.

### What still needs attention
- This quantified panel-edge recovery cue should still be runtime-validated on a real tiled sessions surface to confirm the extra badge feels helpful rather than fussy while the panel is resized repeatedly.
- If live use still shows hesitation between dragging and clicking the reminder tab, the next likely follow-up is whether the hover hint should echo the same width delta for ordinary left-edge resize handles, not just the resting recovery tab.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves predictability of manual width recovery, not when the app should automatically reclaim space.

## Iteration 70 - Echo the shrink-to-min width delta on ordinary panel width handles

### Area inspected
- `tiling-ux.md`, specifically Iteration 69's open follow-up about ordinary width-handle hints still lacking the same quantified recovery outcome as the resting tab
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight `electron_execute` inspection before documenting results

### Repro steps reviewed
1. Re-read the ledger first and intentionally continue the still-open floating-panel/tiled-workflow follow-up instead of returning to the just-touched sessions header.
2. Inspect `PanelResizeWrapper` around `panelResizeCompactHintLabel`, `restingWidthRecoveryAmount`, and the existing hover hint chip row.
3. Confirm that the resting left-edge `Shrink width` tab already showed `-Npx`, but ordinary left/right width-handle hover hints still only said `Double-click to shrink width` without previewing how much space would be reclaimed.
4. Probe the attached renderer with `electron_execute`; it remained reachable at `http://localhost:19007/`, but the visible surface was still `Chats` rather than the tiled sessions page, so this pass stayed source- and test-validated.

### UX problem found
- The dedicated left-edge recovery tab already made panel-width reclamation feel more predictable by exposing the approximate `-Npx` outcome.
- The ordinary left/right width handles still lacked that same outcome preview, so users hovering the actual resize affordances had to infer what `Double-click to shrink width` would do.
- That mismatch weakens consistency in the exact tiled workflows where panel width is being adjusted to give space back to the sessions grid.

### Assumptions
- It is acceptable to reuse the same recovery delta already calculated for the resting tab because the shrink target is the same `minWidth` outcome, so the value remains honest across both affordances.
- It is acceptable to show the quantified delta only for the ordinary left/right width handles, because corner handles shrink both width and height and a width-only amount there would be less clear.
- A documented renderer inspection attempt, the focused panel affordance source test, and desktop renderer typecheck are sufficient for this pass because the attached Electron surface was still not a trustworthy tiled sessions route.

### Decision and rationale
- Keep the existing `Double-click to shrink width` hover hint text.
- Add the same `-Npx` recovery badge to ordinary left/right width-handle hover hints whenever the panel is wider than its minimum width.
- Reuse the existing blue recovery badge styling so the tab and ordinary handle hints read as one coherent recovery system.
- This is better than rewriting the hover text into a longer sentence because it keeps the hint compact while still making the outcome predictable at a glance.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to derive a width-handle-specific compact recovery badge label from the existing `restingWidthRecoveryAmount` state.
- Rendered that `-Npx` badge inside the ordinary left/right width-handle hover hint row, alongside the existing `Double-click to shrink width` chip.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new left/right handle recovery-delta hint behavior.

### Verification
- `electron_execute` reached `http://localhost:19007/`, but the attached surface was still the `Chats` shell rather than the tiled sessions page, so live tiled-workflow validation was not practical for this iteration.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the quantified delta only on the resting recovery tab would be lower churn, but it would preserve the inconsistency between the explicit reminder tab and the ordinary width handles.
- Expanding the hover hint copy into a full sentence like `Double-click to shrink width by about Npx` would be more explicit in isolation, but it would also make the already-compact hover chip heavier and harder to scan.
- Showing the same width badge on corner handles too would increase consistency slightly, but it would blur the fact that corner double-click also changes height.

### What still needs attention
- This width-handle recovery estimate should still be runtime-validated on a real floating-panel-plus-tiled-sessions workflow to confirm the extra badge feels helpful rather than repetitive next to the resting tab.
- If live use still suggests people hesitate between drag and double-click on ordinary width handles, the next likely follow-up is whether the left-edge hover hint should also reflect the same outcome in its title text rather than only via the inline badge.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves predictability of manual width recovery, not when the app should automatically reclaim width.

## Iteration 72 - Remove redundant tile-level Single view entry when compare/grid already shows one tile

### Area inspected
- `tiling-ux.md`, specifically the latest floating-panel iterations so this pass could move back to the session-tiling surface without repeating the recent handle work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the just-touched floating-panel handle thread.
2. Inspect the tiled sessions page around `visibleTileCount`, `isTemporarySingleVisibleLayout`, and `showTileMaximize`.
3. Confirm that compare/grid already has a header-level explanation for the temporary one-tile state (`Expanded for one visible session` / `One visible`) while each tile still exposed `Show this session in Single view` as a separate action.
4. Probe the attached renderer with `electron_execute`; it was reachable, but it still exposed the `Chats` shell rather than a trustworthy tiled sessions repro, so this pass stayed source- and test-validated.

### UX problem found
- When compare or grid temporarily shows only one visible tile, the page already communicates that state clearly in the sessions header.
- The tile itself could still show the `Show this session in Single view` button, even though clicking it would not materially change what the user sees.
- That creates a small but real ambiguity at the maximized-vs-grid boundary: the UI appears to offer a distinct view transition when the layout is already effectively one-up.

### Assumptions
- It is acceptable to treat `visibleTileCount === 1` as the right threshold for hiding the tile-level maximize affordance because compare/grid surfaces all visible tiles at once; if only one tile is visible, the tile CTA is redundant rather than informative.
- It is acceptable to keep the global layout controls unchanged, because users may still intentionally switch the page into explicit `Single view`; this pass only removes the misleading per-tile shortcut.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the attached renderer still was not the real tiled sessions surface.

### Decision and rationale
- Keep the page-level layout controls and the temporary one-visible status chip exactly as they are.
- Hide the tile-level `Single view` affordance unless compare/grid is actually showing more than one visible tile.
- This is better than removing `Single view` access entirely because deliberate layout switching still matters, and better than leaving the redundant tile action in place because it reduces ambiguity without adding new controls.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showTileMaximize` now requires both `!isFocusLayout` and `visibleTileCount > 1`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new guard for both ordinary tiles and the pending tile path.

### Verification
- `electron_execute` reached the attached renderer, but it still exposed the `Chats` shell rather than a reliable tiled sessions workflow, so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the tile CTA visible would keep behavior unchanged, but it would preserve a misleading distinction between `temporarily one visible tile` and `Single view` right where the product is already trying to make layout state clearer.
- Auto-switching compare/grid into explicit `Single view` when only one tile remains would reduce redundancy too, but it would be a much bigger state-management decision and could surprise users when additional sessions reappear.
- Disabling the tile button instead of hiding it would explain the state, but it would also add inert chrome to an already dense tile header when the header-level layout chip already carries that explanation.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the missing tile CTA feels cleaner rather than making users hunt for the page-level `Single view` control.
- The neighboring maximized-vs-grid question is whether re-entering multi-tile compare/grid should restore focus to the previously active tile more explicitly when several sessions are available again.
- Drag/reorder discoverability and tile-resize affordance clarity remain open areas separate from this one-up redundancy fix.

## Iteration 71 - Quantify width-handle tooltips so manual panel shrink stays predictable beyond the reminder tab

### Area inspected
- `tiling-ux.md`, specifically Iteration 70's open follow-up about ordinary width-handle titles still lagging behind the quantified hover badge
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally continue the floating-panel resize UX thread rather than reopening the recent sessions-header compaction work.
2. Inspect the panel resize wrapper around `restingWidthRecoveryAmount`, the ordinary width-handle hover badge, and the static `getPanelResizeHandleTitle` copy.
3. Confirm that the in-app left/right width-handle hint could already show the reclaimable `-Npx` delta, but the native handle tooltip still said only `Double-click to shrink width` with no outcome preview.
4. Probe the attached renderer with `electron_execute`; it remained reachable at `http://localhost:19007/`, but the visible surface was still the `Chats` shell rather than a trustworthy tiled sessions repro, so this pass stayed source- and test-validated.

### UX problem found
- Users can now discover panel-width recovery through both the ordinary width-handle hover badge and the persistent `Shrink width` reminder tab.
- But the standard browser/native tooltip on the live width handles still lagged behind those in-app cues: it described the shortcut, but not the approximate `Npx` outcome.
- That left one of the most conventional discovery paths slightly behind the rest of the UI, especially for users who hover for confirmation before double-clicking rather than reading the inline hint chip.

### Assumptions
- It is acceptable to reuse `currentSize.width - minWidth` for width-handle tooltips because double-clicking a width edge already compacts the panel back to its minimum width, so that delta is the real local outcome.
- It is acceptable to keep the quantified preview limited to width-only handles, because that is the most directly relevant control for reclaiming tiled-session room and avoids overloading the corner-handle copy with mixed width/height details.
- Focused source-backed tests plus desktop web typecheck remain sufficient for this pass because the reachable Electron target still was not the actual tiled sessions surface.

### Decision and rationale
- Keep the visible hover badges and the existing double-click behavior unchanged.
- Update the ordinary left/right resize-handle tooltips to say `Double-click to shrink width by about Npx` whenever the panel is wider than its minimum.
- Leave the width-handle tooltip generic when there is no recoverable width, and leave corner/height handles unchanged.
- This is better than adding more persistent chrome because it improves an existing discovery surface, and better than changing every handle tooltip because only width-only edges directly map to the tiled-width recovery decision.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` so `getPanelResizeHandleTitle` accepts an optional width-recovery amount and returns quantified width-handle copy when a meaningful shrink delta exists.
- Updated the same file so the live `left` and `right` `ResizeHandle` instances pass `restingWidthRecoveryAmount` into their tooltip titles while other handles keep their prior copy.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new quantified width-handle tooltip behavior.

### Verification
- `electron_execute` reached the attached renderer, but it still reported `http://localhost:19007/` with title `Chats` and did not expose a trustworthy tiled sessions + floating-panel surface for live validation.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the handle tooltips generic would keep the implementation smaller, but it would preserve an inconsistency where some recovery affordances previewed the outcome and others did not.
- Adding even more visible badges or buttons would make the resizing surface noisier than necessary when a tooltip-level fix already closes the predictability gap.
- Quantifying corner-handle tooltips too could further align every resize surface, but it would also complicate copy for a control that changes both width and height at once.

### What still needs attention
- This quantified width-handle tooltip should still be runtime-validated on a real tiled sessions surface to confirm it feels helpful rather than repetitive beside the existing hover badge and reminder tab.
- If live use still shows uncertainty around drag-versus-double-click on the width edges, the next likely follow-up is whether the width-only hover hint badge should visually distinguish `drag` from `shrink` a bit more strongly while hovered.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves predictability of manual width recovery, not when the app should automatically reclaim space.

## Iteration 73 - Give tile resize edges a clearer at-rest affordance

### Area inspected
- `tiling-ux.md`, specifically the most recent sessions-side and floating-panel iterations so this pass could avoid reopening the just-touched panel-handle work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose an area that had not been investigated recently.
2. Inspect `SessionTileWrapper` around the persistent drag handle, right-edge width handle, bottom-edge height handle, and the width-locked fallback rail.
3. Confirm in source that reorder already had a strong always-visible chip while resize still depended mostly on thin rails plus hover-only labels.
4. Probe the attached renderer with `electron_execute`; it was reachable, but it still exposed the `Chats` shell rather than a reliable tiled sessions surface, so this pass stayed source- and test-validated.

### UX problem found
- Tile reordering now has a clear persistent affordance, but tile resizing still asks users to infer interactivity from very thin right and bottom rails.
- That makes resize behavior easier to miss at a glance, especially in dense multi-tile views where the tile chrome already competes for attention.
- The result is an asymmetry in discoverability: tiles visibly advertise that they can move, but they do not equally advertise that they can resize.

### Assumptions
- It is acceptable to add a very small always-visible grip cap to the existing right and bottom resize edges because it improves recognition without changing resize rules, tile geometry, or layout persistence.
- It is acceptable to leave the width-locked right edge unchanged in this pass because the goal is to clarify active resize affordances, not redesign the locked-state explanation that already has dedicated copy.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the attached Electron surface still was not the actual tiled sessions page.

### Decision and rationale
- Keep the existing resize rails, hover labels, hit targets, and width-lock rules exactly as they are.
- Add a tiny capsule-style grip marker to the active right-edge width handle and bottom-edge height handle so those edges read as controls even before a precise edge hover.
- Keep the grip subtle and aligned with the existing background/border treatment so it improves discoverability without turning every tile edge into heavy permanent chrome.
- This is better than only increasing rail opacity because it gives users a more recognizable control shape, and better than adding full labels at rest because that would crowd dense multi-tile layouts.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add a shared resize-grip capsule style and tiny grip bars for the active right-edge and bottom-edge tile resize handles.
- Left the existing hover labels (`Resize width`, `Resize height`, `Resize tile`) and the width-locked explanatory path intact.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the new grip classes and placements.

### Verification
- `electron_execute` reached the attached renderer, but it still reported the `Chats` shell rather than a trustworthy tiled sessions repro, so live tiled-workflow validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Only increasing the rail thickness/opacity would be lower churn, but it would still leave resize controls looking more like borders than purposeful handles.
- Adding fully visible `Resize width` / `Resize height` labels at rest would improve discoverability further, but it would also add too much permanent chrome in crowded multi-tile layouts.
- Mirroring the same grip treatment onto the width-locked edge might improve visual symmetry, but it risks implying that width is draggable in states where layout intentionally owns the row width.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the new grip caps feel helpful rather than fussy while tiles resize, stack, and switch layouts.
- If live use still shows hesitation around tile resizing, the next likely follow-up is whether the width-locked edge also needs a more obvious non-draggable marker rather than only the current hover explanation.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves local tile-resize discoverability, not how much horizontal room tiled sessions receive overall.

## Iteration 73 - Show the hide-panel width payoff inline so stacked-layout recovery choices are easier to compare

### Area inspected
- `tiling-ux.md`, specifically the latest floating-panel and sessions-header iterations so this pass could continue the panel-versus-tiles recovery thread without repeating the recent handle-only work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose a still-open stacked-layout recovery decision rather than reopening the just-touched width-handle hint thread.
2. Inspect `sessions.tsx` around `showShrinkPanelForLayoutPressure`, `showHidePanelForLayoutPressure`, and the inline recovery badge labels for the two floating-panel actions.
3. Confirm that `Shrink panel` already exposed a visible `+Npx` badge in roomy headers while `Hide panel` only mentioned its larger recovery amount inside the tooltip text.
4. Probe the attached renderer with `electron_execute`; it was reachable at `http://localhost:19007/`, but the visible surface was still the `Chats` shell rather than a trustworthy tiled sessions route, so this pass stayed source- and test-validated.

### UX problem found
- When compare/grid is stacked or close to stacking, users may see both `Shrink panel` and `Hide panel` as recovery actions.
- The UI already computed both reclaimed-width amounts, but only `Shrink panel` surfaced that payoff inline.
- That forced users to compare one visible outcome against one tooltip-only outcome, making the recovery choice less scannable right when screen space is already under pressure.

### Assumptions
- It is acceptable to treat the full visible panel width as the hide action's recovery amount because hiding the floating panel reclaims that width for the sessions area.
- It is acceptable to keep the new badge hidden on compact headers because `Shrink panel` already follows that density rule and the narrow-header priority is preserving action labels over extra numeric chrome.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the reachable Electron target still was not the real tiled sessions surface.

### Decision and rationale
- Keep the existing `Hide panel` copy, icon, tooltip, and action priority unchanged.
- Add the same compact `+Npx` recovery badge style already used by `Shrink panel` so both recovery actions preview their width payoff inline.
- This is better than moving more explanation into tooltips because users can now compare `shrink` versus `hide` at a glance, and better than adding new controls because it clarifies an existing decision without expanding the UI.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `hidePanelForLayoutPressureRecoveryLabel` from the existing hidden-panel recovery width.
- Rendered that badge inside the `Hide panel` button using the same compact recovery-pill styling already used by `Shrink panel`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new inline hide-panel recovery label behavior.

### Verification
- `electron_execute` reached the attached renderer, but it still exposed `http://localhost:19007/` with title `Chats` rather than a reliable tiled sessions workflow, so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the hide recovery amount in the tooltip only would be lower churn, but it would preserve an asymmetry in the exact comparison users are being asked to make.
- Showing the recovery badge on compact headers too would make the action outcome even more explicit, but it would also crowd the already tight header where action ordering matters more.
- Rewriting the button labels into longer sentences like `Hide panel (+320px)` would be more direct in isolation, but it would also make the compact action row heavier and harder to scan.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the extra hide badge improves comparison without making the stacked-layout recovery row feel noisy.
- If live use still suggests hesitation between `Shrink panel` and `Hide panel`, the next likely follow-up is whether the prioritized action should adapt when the two recovery amounts are very close rather than only when the layout is already stacked.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass makes the recovery tradeoff clearer, not smarter by default.

## Iteration 74 - Keep tile resize affordances visible when focus is already inside a tile

### Area inspected
- `tiling-ux.md`, specifically the newly updated panel-recovery iteration so this pass could deliberately move to a different focus area
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- lightweight `electron_execute` inspection before documenting results

### Repro steps reviewed
1. Re-read the ledger first and intentionally switch from the just-touched panel-recovery thread to tile resize discoverability.
2. Inspect `session-grid.tsx` around `resizeRailClassName`, `heightResizeRailClassName`, `resizeCornerClassName`, and the existing `group-hover` / `group-focus-within` affordance states.
3. Confirm that reorder discoverability and locked-width explanations already responded to `group-focus-within`, but the main width/corner resize chrome still mostly depended on pointer hover.
4. Probe the attached renderer with `electron_execute`; it was still reachable at `http://localhost:19007/`, but the visible surface remained the `Chats` shell rather than a trustworthy tiled sessions route, so this pass stayed source- and test-validated.

### UX problem found
- Once focus moves inside a session tile, users are already interacting with that tile's content, which is a natural moment to rediscover nearby tile controls.
- The reorder handle and locked-width explanation already become clearer in that state, but the main width and corner resize affordances still quiet down unless the pointer is hovering the exact edge.
- That inconsistency makes resizable tiles feel less obviously adjustable for keyboard-heavy or text-focused workflows, even though resize remains available.

### Assumptions
- It is acceptable to use `group-focus-within` for resize chrome because focus commonly lands inside tile content while people are working, so that state is a reasonable proxy for `this tile is currently active`.
- It is acceptable to keep the text hint chips hover-only while revealing the rails/corner visuals on focus, because that improves discoverability without adding too much persistent text noise during typing.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the attached Electron target still was not the real tiled sessions surface.

### Decision and rationale
- Keep the resize handles themselves, tooltips, hit targets, and hint copy unchanged.
- Extend `group-focus-within` styling to the width rail, bottom rail thickness, and corner resize chrome so active tiles telegraph resizability more consistently.
- Do not auto-show all resize hint labels on focus; the visual chrome is enough to improve discoverability without cluttering the tile while someone is reading or typing.
- This is better than leaving hover as the only discovery path because it helps active-tile workflows, and better than a broader refactor to focusable resize controls because it is a small, coherent change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so the ordinary width rail now brightens and thickens on `group-focus-within/session-tile`.
- Updated the same file so the bottom resize rail and corner resize chrome also respond to `group-focus-within/session-tile` using the same visual language already used on hover.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the new focus-within resize-affordance classes.

### Verification
- `electron_execute` reached the attached renderer, but it still exposed `http://localhost:19007/` with title `Chats` rather than a reliable tiled sessions workflow, so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving resize chrome hover-only would keep the UI slightly quieter, but it would continue treating keyboard/text-focused tile activity as less important than pointer hover for discoverability.
- Revealing all resize hint labels on focus too would be more explicit, but it would also add multiple text chips around a tile during normal editing.
- Converting resize handles into focusable controls could improve accessibility further, but that is a bigger interaction change than this pass needed.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the focus-based resize chrome feels helpful rather than distracting while typing inside a tile.
- If resize discoverability still feels weak in live use, the next likely follow-up is whether one of the resize handles should expose a lightweight focusable explanation state instead of relying only on hover tooltips.
- Drag/reorder clarity and the broader floating-panel-versus-tile allocation problem remain open adjacent threads.

## Iteration 75 - Make Single-view exit controls explicitly promise which tile stays active

### Area inspected
- `tiling-ux.md`, specifically Iteration 72's open note about whether leaving `Single view` should restore the previously active tile more explicitly
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- lightweight `electron_execute` inspection before editing

### Repro steps reviewed
1. Re-read the ledger first and intentionally pick the open `Single view` follow-up instead of repeating the most recent resize-affordance investigation.
2. Inspect `sessions.tsx` around `singleViewReturnSessionIdRef`, `handleSelectTileLayout(...)`, `singleViewRestoreButton`, and the layout button titles/ARIA.
3. Confirm that the current implementation already preserves and scrolls the shown session when leaving `Single view`, but the restore and layout-switch controls only said `Return to Compare/Grid` without telling users that the shown session stays active.
4. Probe the attached renderer with `electron_execute`; it was still reachable at `http://localhost:19007/`, but the visible surface remained the `Chats` shell rather than a trustworthy tiled-sessions route, so this pass stayed source- and test-validated.

### UX problem found
- Leaving `Single view` already keeps the currently shown session focused and scrolled back into view, but that outcome was mostly implicit.
- The exit controls described only the target layout (`Compare view` / `Grid view`), so the handoff back to multi-tile mode could still feel a little ambiguous.
- That ambiguity matters most on compact/icon-heavy headers, where tooltip and ARIA copy do more of the explanation work because the visible controls are intentionally terse.

### Assumptions
- It is acceptable to improve this through control-copy clarity instead of new visible chrome, because the underlying behavior is already correct and the main issue is predictability/scanability.
- It is acceptable to reuse the existing focused-session label fallback for the restore context, because that keeps the wording local to the sessions page and avoids inventing a new naming path.
- Focused source-backed tests plus desktop web typecheck are sufficient here because the attached Electron target still was not the real tiled sessions surface.

### Decision and rationale
- Keep the restore behavior, layout switching behavior, and visible button labels unchanged.
- Make the `Single view` exit path explicit in button titles and ARIA so both the dedicated `Back to ...` affordance and the direct Compare/Grid buttons explain that the shown session stays the active tile.
- This is better than adding another visible badge or helper chip because it resolves the ambiguity with a very small local change and avoids re-crowding the already-dense sessions header.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `singleViewRestoreSessionLabel`, `singleViewRestoreFocusContext`, and `singleViewRestoreTitle` from the currently shown session.
- Updated the dedicated `singleViewRestoreButton` to use that explicit restore title/ARIA instead of the older generic `Return to Compare/Grid` copy.
- Updated the direct Compare/Grid layout buttons so, while `Single view` is active, their title/ARIA also explain that returning to a tiled layout keeps the shown session active.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new explicit restore-context wording.

### Verification
- `electron_execute` reached the attached renderer, but it still exposed `http://localhost:19007/` with title `Chats` rather than a reliable tiled sessions workflow, so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Adding a new visible chip like `Keeps this tile active` would make the behavior even more explicit, but it would also add more header competition in the same compact states that earlier iterations tried to calm down.
- Leaving the behavior implicit would keep the code slightly simpler, but it would preserve a small clarity gap exactly at the maximized-vs-grid transition the ledger already called out.
- Renaming the visible `Back to ...` label itself into a longer sentence would be more explicit at rest, but it would cost too much horizontal space relative to the size of the problem.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the more explicit restore/tool-tip language feels helpful in compact headers instead of too wordy.
- If live use still suggests confusion when returning to multi-tile layouts, the next likely follow-up is a transient visual cue on the restored active tile rather than more persistent header copy.
- Drag/reorder clarity and the broader floating-panel-versus-tile allocation problem remain open adjacent threads.

## Iteration 75 - Make wide two-tile Grid states explain why they look expanded

### Area inspected
- `tiling-ux.md`, especially the older wide-grid note from Iteration 45 plus the newest resize-focused entries so this pass could pick an unrefreshed thread
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- lightweight `electron_execute` inspection before finalizing verification notes

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the just-touched resize-affordance thread.
2. Revisit the older Grid follow-up from Iteration 45: wide `2x2` with only two visible sessions intentionally uses full height to avoid a dead second row, but that state can look deceptively close to `Compare`.
3. Inspect `sessions.tsx` around `activeLayoutDescription`, `activeLayoutCompactDescription`, and `showCurrentLayoutChip` to confirm only the one-visible fallback currently gets explicit adaptive-state copy.
4. Inspect `session-grid.tsx` to confirm the sparse wide grid behavior is still driven by `shouldUseSparseWideGridHeight(...)`.
5. Probe the attached renderer with `electron_execute`; it was still reachable but not on a trustworthy tiled desktop sessions surface, so this pass remained source- and test-validated.

### UX problem found
- Grid intentionally stretches to full height when only two visible sessions remain in a roomy two-column layout.
- That geometry is good because it removes a large empty row, but it can also read like `Compare` rather than `Grid` because the header only explicitly explained the one-visible fallback.
- Users can therefore end up in a truthful but ambiguous state: the selected layout button says `Grid`, while the visible result looks like a focused two-up compare layout.

### Assumptions
- It is acceptable to treat this as an adaptive Grid state rather than a separate layout mode because the underlying user choice is still `Grid`; only the fill strategy changes.
- It is acceptable to reuse the existing current-layout chip instead of adding a new control because the problem is explanation, not missing functionality.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the reachable Electron target still was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the existing sparse wide Grid sizing behavior unchanged.
- Extend the adaptive layout copy so Grid explicitly says it is `Expanded for two visible sessions` whenever the sparse wide grid rule is active.
- Reuse the same compact/very-compact chip path already used for the one-visible fallback so the explanation scales with header width.
- This is better than reverting to a half-empty grid because the roomy fill behavior still improves space usage, and better than inventing a new layout mode because it clarifies the current behavior without adding another choice.

### Code changes
- Exported `shouldUseSparseWideGridHeight` from `apps/desktop/src/renderer/src/components/session-grid.tsx` so the sessions header can describe the same effective layout state the grid sizing code already uses.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to detect the sparse wide Grid state, add `Expanded for two visible sessions` / `Two visible` labels, and show the adaptive current-layout chip for that state just like the existing one-visible fallback.
- Updated `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to lock in the sparse wide Grid detection helper.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new adaptive Grid copy and chip behavior.

### Verification
- `electron_execute` reached the attached renderer, but it still was not a reliable tiled desktop sessions route, so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Reverting wide two-tile Grid back to half-height cards would make Grid look more distinct from Compare, but it would also reintroduce a visibly wasted bottom row.
- Adding a brand-new `2-up Grid` mode would be more explicit in isolation, but it would complicate layout switching for a behavior that is already just an adaptive presentation of Grid.
- Leaving the behavior undocumented in the header would be the lowest-churn option, but it would preserve a known ambiguity right where the layout controls are supposed to explain the current state.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the new copy makes wide two-tile Grid feel clearer instead of noisy.
- If users still confuse wide two-tile Grid with Compare in live use, the next likely follow-up is visual differentiation inside the tiles or container spacing rather than more header text.
- Drag/reorder clarity, internal tile density, and the floating-panel-versus-tiled-width allocation problem remain open neighboring threads.

## Iteration 76 - Keep queued-message chrome compact in background tiles

### Area inspected
- `tiling-ux.md`, especially Iteration 75 so this pass could move to an unrefreshed neighboring thread instead of reworking header copy again
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/message-queue-panel.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight `electron_execute` probe before editing

### Repro steps reviewed
1. Re-read the latest ledger entries first and avoid the just-touched layout-explanation thread.
2. Inspect `agent-progress.tsx` tile rendering around the footer, queued-message panel, and follow-up composer to compare how background tiles already compact some chrome but not others.
3. Notice that `TileFollowUpInput` already switches to a lighter focus-first affordance in unfocused/unexpanded tiles, while `MessageQueuePanel` still renders its full card.
4. Confirm in source that the tile currently passes `compact={isCollapsed}` even though the queue panel only renders when `!isCollapsed`, so that compact path never actually activates for open tiles.
5. Probe the attached Electron renderer; it was reachable but sitting at `http://localhost:19007/` with title `Chats`, not a trustworthy tiled desktop sessions surface, so this pass stayed source- and test-validated.

### UX problem found
- Background tiles already intentionally suppress some detail so users can scan multiple sessions at once.
- Queued-message chrome broke that pattern: an unfocused tile could still show the full queued-messages card with its own header, actions, paused notice, and editable list, which visually dominated the tile body.
- That made multi-session grids feel denser and noisier than necessary, especially when a background tile also showed transcript preview copy and the compact follow-up affordance.
- The current `compact={isCollapsed}` prop also meant the tile never actually used the compact queue summary while open, so the component already had the right UI but the tiled workflow was not benefiting from it.

### Assumptions
- It is acceptable for unfocused and non-expanded tiles to prioritize scanability over in-place queue editing because focusing the tile is already the established path for richer interaction.
- It is acceptable to keep focused and single-view tiles on the full queue card so users still retain detailed queue management where they have enough attention and space.
- Source-backed verification plus targeted tests are sufficient for this pass because the available Electron renderer was not on a reliable tiled sessions route.

### Decision and rationale
- Reuse the existing compact `MessageQueuePanel` mode for background tiles instead of inventing new queue-specific tile UI.
- Treat `!isFocused && !isExpanded` as the switch, matching the existing focus-first behavior already used by the tile follow-up composer.
- Keep the full queue card for focused or expanded tiles, where the extra editing controls remain useful.
- This is better than removing queue visibility from background tiles entirely because users still see that queued work exists, and better than keeping the full card everywhere because it reduces visual weight without losing the richer UI when users intentionally focus a session.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `shouldUseCompactTileQueuePanel` from the tile focus/single-view state and pass it to `MessageQueuePanel`.
- Replaced the ineffective `compact={isCollapsed}` tile usage so open background tiles now actually use the compact queue summary.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new compact queue-panel rule and guard against regressing back to the unreachable `isCollapsed` wiring.

### Verification
- `electron_execute` reached a renderer target, but it was not the tiled desktop sessions workflow (`http://localhost:19007/`, title `Chats`), so live validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Compacting queue chrome in all narrow tiles would reduce clutter further, but it would also hide queue details in focused states where users are likely trying to manage them.
- Leaving the full queue card in background tiles preserves maximum control density, but it makes the tiled scan view noisier and less hierarchy-driven.
- Creating a brand-new tile-only queue summary would offer more tailoring, but the existing compact `MessageQueuePanel` already solves the problem with much less churn.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the compact queue summary feels appropriately lightweight and does not make paused queues too easy to overlook.
- If queued background tiles still feel busy after this, the next likely follow-up is transcript-preview density or footer spacing rather than adding more queue controls.
- Drag/reorder discoverability, tile-internal hierarchy under extreme width pressure, and the floating-panel-versus-sessions width negotiation remain open threads.

## Iteration 77 - Briefly mark the moved tile after a reorder lands

### Area inspected
- `tiling-ux.md`, especially Iteration 76 so this pass could move to a different open thread instead of immediately revisiting queue density
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- lightweight `electron_execute` probe before finalizing the change

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the older drag/reorder follow-up rather than the just-touched tile-internal queue-density thread.
2. Inspect `sessions.tsx` around `handleDrop(...)`, `handleKeyboardReorder(...)`, and the existing polite reorder announcement to confirm reorder success already had semantic feedback but no visible landing cue.
3. Inspect `SessionTileWrapper` in `session-grid.tsx` to compare the current drag-target and dragging states with what users see after the interaction finishes.
4. Probe the attached renderer with `electron_execute`; it was reachable at `http://localhost:19007/`, but the visible surface was still `Chats` and did not expose `aria-label="Session tile layout"`, so this pass remained source- and test-validated.

### UX problem found
- Successful reorders already announce `Moved ... to position ...` through a live region, but the tile itself goes visually quiet as soon as the drag or arrow-key interaction completes.
- That forces users to scan the whole grid to confirm where the moved session landed, especially after keyboard reorder where there is no pointer motion to help track it.
- The missing piece is not another permanent control; it is a short-lived visual confirmation on the moved tile itself.

### Assumptions
- It is acceptable to add a brief visual cue on the moved tile because the ledger already has the accessible live-region confirmation, and this pass is specifically filling the remaining sighted-user feedback gap.
- It is acceptable to attach that cue to the existing reorder handle and tile outline rather than adding a toast or banner, because users most need the feedback at the destination tile itself.
- A focused drag-affordance source test plus desktop web typecheck are sufficient here because the available Electron renderer was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the current reorder model, drop cues, and live-region announcement unchanged.
- After a successful drag/drop or keyboard reorder, briefly mark the moved tile with a success-toned outline and a `Moved` reorder handle state.
- Clear any old cue when a new drag begins so the tile state always reflects the most recent completed move.
- This is better than adding more persistent chrome because it gives fast post-action confirmation without making already-dense tiles busier at rest, and better than relying on the live region alone because sighted users can now immediately spot the landing tile.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track `recentlyReorderedSessionId`, manage a short visual-cue timeout, clear stale cues on new drags, and trigger the cue from both drag/drop and keyboard reorder success paths.
- Updated the same file so `SessionProgressTile` passes `isRecentlyReordered` down to the tile wrapper for the moved session.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` can render a temporary success-styled tile outline plus a `Moved` reorder handle state with a check icon.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new temporary moved-tile cue wiring and styling hooks.

### Verification
- `electron_execute` reached a renderer target, but it was still `http://localhost:19007/` with title `Chats` rather than the tiled desktop sessions route, so live runtime validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving reorder confirmation entirely to the live region would keep the implementation smaller, but it would preserve a visual feedback gap for drag and keyboard users who need to quickly locate the moved tile.
- Adding a toast or header-level chip would also confirm success, but it would pull attention away from the destination tile and add more transient chrome to an already busy area.
- Using a stronger persistent tile badge would be more obvious, but it would overstay its usefulness after the reorder has already been understood.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the `Moved` cue lasts long enough to help without lingering awkwardly during rapid consecutive reorders.
- If live use still suggests users lose track of reorders, the next likely follow-up is whether drag-drop should also scroll the moved tile more deliberately when the grid is tall rather than adding more permanent reorder UI.
- The broader floating-panel-versus-sessions width negotiation and tile-internal density work remain open neighboring threads.

## Iteration 78 - Preserve manual tile width during ordinary responsive reflow

### Area inspected
- `tiling-ux.md`, especially the most recent drag and tile-density iterations so this pass could move back to an older unresolved sizing-predictability thread
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- lightweight live inspection attempt via `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222`, `electron_reset`, and `electron_execute`

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the just-touched drag/reorder and tile-density threads.
2. Revisit the older responsive-reflow logic in `SessionTileWrapper` and compare it with the newer height-preservation helper to see whether width still resets too aggressively on sidebar/window width changes.
3. Inspect `useResizable` to confirm `setSize(...)` both clamps and persists width, which means a layout-driven reflow can overwrite a user-chosen width permanently.
4. Launch a fresh desktop dev target and probe the attached renderer before editing; the renderer bridge connected, but the visible surface was still `http://localhost:19007/` with title `Chats`, not a trustworthy tiled desktop sessions route, so this pass stayed source- and test-validated.

### UX problem found
- Earlier iterations already stopped ordinary width changes from clobbering a manual tile height, but the same reflow path still always wrote `width: targetTileWidth`.
- That meant a user could deliberately resize tiles to a preferred side-by-side width, then lose that choice as soon as the sidebar or window width changed even if the layout still remained a valid multi-tile row.
- Because the reflow path uses `setSize(...)`, the reset was not just visual for the current frame; it also rewrote the persisted tile width and made the resizing model feel harder to predict.

### Assumptions
- It is acceptable to preserve manual width across ordinary width-only reflow whenever the current width still fits the new bounds, because the brief explicitly prioritizes reducing accidental resizing and layout resets.
- It is acceptable to keep retargeting widths that were still following the old layout-computed width, because those are layout-driven sizes rather than meaningful user overrides.
- It is acceptable to clamp preserved widths to the new min/max bounds instead of preserving them exactly when the container tightens, because preventing overflow and clipping is more important than preserving an impossible width.

### Decision and rationale
- Add a small helper that decides whether width should change on container-width reflow.
- Preserve manual widths by default, clamp them only when new bounds require it, and retarget only when the tile was still tracking the previous layout-driven width.
- Keep the existing height retarget behavior on width breakpoints unchanged so stacked-density and sparse-grid transitions still adapt correctly.
- This is better than always writing the new target width because it respects deliberate user sizing, and better than disabling width reflow entirely because layout-driven widths still adapt and impossible widths still get clamped safely.

### Code changes
- Added `getResponsiveTileWidthOnContainerWidthChange(...)` to `apps/desktop/src/renderer/src/components/session-grid.tsx` so responsive width reflow can distinguish manual widths from layout-driven widths while still honoring tighter bounds.
- Updated the same file so width-change reflow now computes the previous target width, preserves manual widths when appropriate, clamps widths that no longer fit, and only calls `setSize(...)` when width and/or height actually need to change.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` with direct helper coverage for preserved widths, layout-driven retargeting, and bound clamping.
- Updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new responsive-width decision path at the source level.

### Verification
- Live desktop inspection attempt: launched `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222`, then used `electron_reset` and `electron_execute`; the available renderer target was still `http://localhost:19007/` with title `Chats`, so live tiled-session validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Preserving manual width unconditionally would avoid resets, but it could leave tiles wider or narrower than the current container can safely support.
- Retargeting width on every container change keeps the layout mathematically neat, but it ignores deliberate user sizing and makes sidebar toggles feel like hidden resets.
- Adding more persistent width controls in the toolbar could make sizing more explicit, but the current problem is not missing controls; it is that existing direct-manipulation width choices were being overwritten too eagerly.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm preserved widths feel natural during repeated sidebar collapse/expand and window resizing.
- If live usage still reveals width surprises, the next likely follow-up is whether per-layout or per-session width memory is needed rather than another global heuristic.
- The broader floating-panel-versus-sessions width negotiation and tile-internal density work remain open neighboring threads.

## Iteration 79 - Prefer shrinking the floating panel when it already restores tiled layout

### Area inspected
- `tiling-ux.md`, especially the most recent responsive-reflow and drag iterations so this pass could move to an unresolved floating-panel-versus-tiling decision thread instead of revisiting the just-touched work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- lightweight live inspection attempt via `electron_execute`

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the newest drag and width-preservation threads.
2. Inspect the sessions header layout-pressure logic around `Shrink panel` and `Hide panel` to see how the primary recovery action is chosen once the floating panel forces tiled sessions into a stacked state.
3. Probe the available Electron renderer before editing; the connected target was still `http://localhost:19007/` with title `Chats` rather than a reliable tiled desktop sessions route, so this pass remained source- and test-validated.
4. Compare the stacked and near-stacked branches to see whether the current prioritization reflects which action actually restores the tiled layout, not just which action is more drastic.

### UX problem found
- In already-stacked layouts, the sessions header always visually prioritized `Hide panel` whenever the floating panel was visible, even if shrinking the panel to its saved minimum width would already restore the tiled layout.
- That made the UI feel more destructive than necessary: users were being nudged toward fully removing the panel even when a lighter-weight resize would solve the immediate problem.
- The weaker copy on `Shrink panel` also undersold its value in the specific case where shrinking was enough to restore side-by-side or multi-column tiling.

### Assumptions
- It is acceptable to promote `Shrink panel` over `Hide panel` when shrinking alone restores the tiled layout, because the brief explicitly prioritizes reducing accidental resets and making tiled behavior easier to predict.
- It is acceptable to keep `Hide panel` available as a secondary action in that state, because some users will still prefer the maximum-width recovery once the panel is already competing with tiled sessions.
- A source-backed test plus desktop web typecheck are sufficient for this pass because the available Electron renderer was not the actual tiled desktop sessions workflow.

### Decision and rationale
- Teach the stacked-layout recovery path to detect whether shrinking the floating panel alone would unstack the tiled layout.
- When shrinking is sufficient, keep both actions visible but make `Shrink panel` the emphasized action and upgrade its tooltip copy to explicitly say it restores the tiled layout.
- When shrinking is not sufficient, keep the existing `Hide panel` prioritization so the stronger fallback still leads.
- This is better than always prioritizing `Hide panel` because it reduces unnecessary panel dismissal, and better than removing `Hide panel` because the stronger recovery path is still useful when shrinking cannot restore the layout on its own.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to compute `canResolveStackedLayoutPressureByShrinkingPanel` using the existing responsive stacking heuristic and the post-shrink session-grid width.
- Updated the same file so stacked layouts now derive both `prioritizeShrinkPanelForLayoutPressure` and `prioritizeHidePanelForLayoutPressure`, allowing `Shrink panel` to become the primary action when it already restores the tiled layout.
- Refined the stacked-state `Shrink panel` tooltip copy so it now explicitly distinguishes between restoring side-by-side sessions, restoring multiple columns, or merely freeing more room.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new stacked-layout shrink-resolution detection, prioritization state, and upgraded tooltip copy.

### Verification
- `electron_execute` reached a renderer target, but it was still `http://localhost:19007/` with title `Chats` instead of the tiled desktop sessions route, so live runtime validation was not practical for this pass.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping `Hide panel` as the always-primary action would keep the logic simpler, but it would continue to encourage a more disruptive recovery action even when the panel only needs a smaller width.
- Removing `Hide panel` whenever shrinking can restore tiling would make the UI less flexible for users who still want the maximum reclaimed width.
- Adding a new intermediate panel-state control would offer more nuance, but it would also add more header chrome when the existing two actions already cover the needed recovery range.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the revised action emphasis feels intuitive during rapid window and sidebar changes.
- The broader floating-panel-versus-sessions width negotiation is still open: this pass only improves which recovery action gets emphasized after pressure is detected, not when the panel should preemptively change behavior.
- Tile-internal density and hierarchy under extreme width pressure remain open neighboring threads once the panel/layout interplay feels steadier.

## Iteration 80 - Let compact clipped-history tiles spend less space repeating the preview explanation

### Area inspected
- `tiling-ux.md`, especially Iterations 76 and 79 so this pass could intentionally move off the just-touched panel-priority thread and onto the still-open tile-density follow-up noted there
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight live inspection attempt earlier in this pass via `electron_execute`, which still exposed `http://localhost:19007/` with title `Chats` rather than a trustworthy tiled desktop sessions surface

### Repro steps reviewed
1. Re-read the ledger first and choose the open tile-internal density thread instead of revisiting the newest floating-panel recovery work.
2. Inspect the tile transcript-preview path in `AgentProgress`, especially the interaction between the header `Recent` badge and the body-level `Recent updates preview` callout.
3. Confirm in source that clipped-history preview only appears on unfocused, non-expanded background tiles, which means the full two-line body explanation is competing directly with the compact queue/follow-up affordances in the same scan-oriented state.
4. Reuse the earlier live renderer probe result for this pass: the connected renderer remained the `Chats` shell rather than the tiled desktop sessions route, so the change stayed source- and test-validated.

### UX problem found
- Background tiles that show clipped transcript history already advertise that state in the header via the `Recent` / `Recent only` badge.
- The transcript area still spent a relatively tall two-line callout on the same explanation, even on compact tiles where vertical space is already scarce and the tile is supposed to behave like a quick scan surface.
- That repeated explanation pushed the first visible transcript item lower than necessary and made compact background tiles feel denser than the newer queue and footer treatments around them.

### Assumptions
- It is acceptable for the body callout to stop repeating the preview-mode label, because the header badge already owns that explanation and is visible in the same clipped-history state.
- It is acceptable for the body callout to lean on the existing tooltip for the full recovery guidance, because the brief prioritizes reducing repeated chrome while still keeping the explanation reachable.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the reachable Electron target still was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the transcript-preview callout in the message area so the clipped-history state remains obvious where users encounter it.
- Let the header badge carry the `Recent` / `Recent only` state label, while the body callout focuses on the hidden-count consequence plus the recovery action.
- Keep the body callout to a single wrap-aware row in all preview tiles, using a slightly tighter compact-tile spacing and a shorter `Focus for full history` action label when width is most constrained.
- Reuse the same full tooltip text for the callout so the complete explanation is still available without permanently spending extra height.
- This is better than removing the body callout entirely because users still get an in-stream cue, and better than leaving the old repeated two-line explanation because preview tiles regain space for actual transcript content.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `tileTranscriptPreviewActionLabel` from the existing clipped-history state while keeping the shared tooltip explanation.
- Updated the same file so the body transcript-preview callout now renders as a single wrap-aware hidden-count + recovery row instead of repeating the preview label and a second explanatory line.
- Kept a slightly tighter compact-tile spacing plus the shorter `Focus for full history` action copy where width pressure is highest.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new action-label wiring, tighter callout styling, and simplified preview-hint structure.

### Verification
- Live inspection attempt remained non-actionable for tiled sessions: `electron_execute` still reached `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Removing the body preview callout once the header badge exists would save even more space, but it would also make the clipped-history state easier to miss inside the transcript area itself.
- Leaving the existing two-line explanation unchanged would preserve maximum explicitness, but it would keep spending too much vertical space in the exact compact background-tile state where scanability matters most.
- Keeping the `Recent updates preview` wording inside both the header badge and body callout would be simpler, but it would preserve the hierarchy problem this pass is trying to reduce.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the leaner preview callout feels lighter without becoming too easy to overlook.
- If compact background tiles still feel busy after this, the next likely density follow-up is footer spacing/context-meter hierarchy rather than further transcript-preview copy changes.

## Iteration 81 - Hide low-signal context meters in compact background tile footers

### Area inspected
- `tiling-ux.md`, especially Iteration 80's next-step note so this pass could intentionally continue the tile-density thread without revisiting the just-changed transcript preview copy
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- earlier live inspection result from this workflow, which still exposed `http://localhost:19007/` with title `Chats` rather than the tiled desktop sessions surface

### Repro steps reviewed
1. Re-read the latest ledger entry first and choose the footer spacing/context-meter hierarchy thread it explicitly left open.
2. Inspect the compact tile footer logic in `AgentProgress`, especially `shouldUseCompactTileFooter`, `showTileContextMeter`, and the footer metadata row.
3. Confirm in source that compact background tiles still render the context meter whenever any context info exists, even when usage is low and the meter is not the most important signal in a scan-oriented multi-tile state.
4. Reuse the earlier live renderer probe result for this pass: the reachable target remained the `Chats` shell rather than the tiled desktop sessions route, so the change stayed source- and test-validated.

### UX problem found
- Compact background tiles already compress footer chrome, but they were still rendering the context meter for every in-progress session with context data.
- In a multi-tile scan view, a low-usage context bar is often low-signal information compared with status, queued work, or clipped-history recovery cues.
- Repeating that low-signal bar across many background tiles makes the footer feel busier than necessary and weakens the hierarchy of the warnings that actually matter.

### Assumptions
- It is acceptable for compact background tiles to hide low-usage context meters, because the brief prioritizes reducing ambiguity and repeated chrome in dense tiled states.
- It is acceptable to keep the context meter visible in roomy or focused states, and to keep showing it in compact footers once usage becomes elevated, because near-limit context is meaningfully actionable.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the reachable Electron renderer still was not the actual tiled sessions workflow.

### Decision and rationale
- Keep full context visibility in roomier tile states where the footer has enough space.
- In compact footers, only surface the context meter once usage reaches the existing elevated threshold (`>= 70%`), so the bar acts more like a warning than constant background noise.
- Reuse the existing threshold semantics and tooltip/title path instead of inventing a new warning model.
- This is better than removing the compact context meter entirely because elevated-context sessions still stand out, and better than leaving it always on because low-signal footer chrome no longer repeats across every background tile.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to separate `hasTileContextInfo` from `showTileContextMeter`, compute `shouldHighlightCompactTileContextMeter`, and only render the compact footer meter when context usage is elevated.
- Kept the existing title text and wide-tile percentage label behavior so the footer still preserves richer context detail when space allows.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new compact-footer context-meter gating logic.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still reached `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Removing the compact context meter completely would simplify the footer further, but it would also hide genuinely important near-limit context pressure in the exact scan view where users may need to choose which session to focus next.
- Keeping the meter always visible preserves full transparency, but it spends footer space on low-signal information and makes the dense tiled view harder to scan.
- Adding a new textual warning badge for compact context pressure could be more explicit, but it would add more chrome than necessary when the existing bar + tooltip already communicates the warning once the meter is reserved for elevated usage.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the hidden low-usage meters make footers feel calmer without making context pressure too easy to miss.
- If compact background tiles still feel busy after this, the next likely density follow-up is whether ACP badge/status spacing can collapse a bit further before another transcript or footer copy change.

## Iteration 82 - Make elevated compact context meters read as labeled warnings

### Area inspected
- `tiling-ux.md`, especially Iteration 81 so this pass could continue the compact-footer hierarchy thread without re-opening the just-settled low-signal hiding rule
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight live inspection attempt via `electron_execute`, which still exposed `http://localhost:19007/` with title `Chats` rather than a trustworthy tiled desktop sessions surface

### Repro steps reviewed
1. Re-read the latest ledger entries first and intentionally choose the open compact-footer hierarchy follow-up instead of switching to a different panel or header thread.
2. Inspect the current compact tile footer logic in `AgentProgress`, especially the post-Iteration-81 path where the context meter only appears in compact footers once usage is elevated.
3. Confirm in source that the elevated compact meter still rendered as a tiny unlabeled bar, while roomier footers already had an explicit `Context N%` label.
4. Re-check the reachable renderer target; it still remained the `Chats` shell rather than the tiled desktop sessions route, so this pass stayed source- and test-validated.

### UX problem found
- Iteration 81 successfully removed low-signal compact meters, but the remaining elevated compact-state meter still appeared as a small unlabeled colored dash.
- In dense multi-tile layouts, that makes elevated context pressure easier to miss or misread as generic footer chrome, especially beside compact ACP badges and status pills.
- The compact footer therefore still had a hierarchy gap: the meter only survived when it mattered more, but it still did not explain itself at a glance.

### Assumptions
- It is acceptable to spend a little more compact-footer width on a short labeled warning (`Ctx` plus percent) because the previous iteration already reclaimed the chrome budget by hiding low-signal compact meters entirely.
- It is acceptable to keep roomy footer context labeling unchanged, because those states already have a readable `Context N%` treatment and do not need a second design path.
- No corresponding mobile change is required for this pass because the behavior being refined is the desktop renderer's tiled `AgentProgress` footer.
- Focused source-backed verification plus desktop web typecheck are sufficient here because the reachable Electron renderer still was not the actual tiled sessions workflow.

### Decision and rationale
- Keep Iteration 81's elevated-only compact meter gating unchanged.
- When the compact footer does show context pressure, render it as a small grouped pill containing `Ctx`, the meter, and the percentage so it reads as intentional warning metadata instead of a stray line.
- Leave the roomy-footer `Context N%` label unchanged so the compact and roomy states each use the smallest label that is still self-explanatory for their chrome budget.
- This is better than leaving the bar unlabeled because the surviving compact warning now explains itself, and better than switching compact footers to the full roomy copy because the shorter label preserves density.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `showCompactTileContextUsageLabel` from the existing elevated compact meter state.
- Updated the same file so compact footer context warnings now render as a grouped `Ctx` + meter + percent pill, while roomier footers keep the existing `Context N%` text label.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new compact warning label and grouped-chip styling.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still reached `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the elevated compact meter as a bare bar would keep the footer minimally small, but it would preserve an avoidable scanability problem in the exact warning state the UI now intentionally surfaces.
- Replacing the compact warning with the full roomy `Context N%` text would be more explicit, but it would spend more width than needed in dense tiled layouts.
- Switching to a text-only compact badge without the bar would simplify the shape, but it would throw away the existing color/level cue that already helps the warning read quickly.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the compact `Ctx` warning pill reads clearly beside ACP/status metadata while tiles resize and focus shifts.
- If compact background tiles still feel a bit busy after this, the next likely density follow-up is whether ACP badge/status spacing can collapse slightly further before touching transcript or layout chrome again.

## Iteration 83 - Tighten compact ACP footer chrome in tiled sessions

### Area inspected
- `tiling-ux.md`, especially Iteration 82 and its remaining follow-up about ACP badge/status spacing in compact tile footers
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/acp-session-badge.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- quick live renderer inspection via `electron_execute`, which still surfaced the `Chats` shell without any `.progress-panel` tiles, so this pass remained source- and test-validated

### Repro steps reviewed
1. Re-read the latest ledger entry first and intentionally continue the compact tile-footer density thread instead of revisiting headers or panel recovery.
2. Inspect the current compact tile footer implementation in `AgentProgress`, especially the footer row that stacks metadata and status when the tile width is narrow.
3. Inspect `ACPSessionBadge` to confirm how compact ACP metadata is rendered inside that footer.
4. Confirm via source that the compact footer still used roomy gaps, a relatively heavy compact ACP badge, and a separate `Status` eyebrow above a self-labeling status pill.
5. Re-check the reachable renderer target; it still was not a real tiled desktop sessions surface, so verification stayed targeted to tests and typecheck.

### UX problem found
- Compact tiled footers had already become calmer overall, but ACP-backed footers still spent more chrome than necessary once tiles were narrow or unfocused.
- The compact ACP badge still used relatively roomy badge styling, and the stacked footer added a separate `Status` eyebrow even though the status pill itself already communicated the state.
- That made dense multi-tile footers feel slightly over-segmented: too many small pills and labels competing for attention in a surface that should read as lightweight supporting metadata.

### Assumptions
- It is acceptable to make the compact ACP badge visually lighter and tighter because compact ACP rendering is only used in the tile footer path here, while non-compact ACP surfaces keep their existing more descriptive styling.
- It is acceptable to remove the compact stacked-footer `Status` eyebrow because the remaining status pill already names the state (`Step`, `Complete`, `Failed`, etc.) and does not require another label above it.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the available Electron renderer target still was not the tiled sessions workflow.

### Decision and rationale
- Keep the same metadata set in compact tile footers; do not hide ACP information outright.
- Tighten the compact ACP badge styling so it visually matches the other compact footer pills instead of reading as a heavier standalone badge.
- Tighten compact footer spacing and padding slightly so ACP metadata, compact context warnings, and status consume less horizontal and vertical budget.
- Remove the redundant compact stacked-footer `Status` eyebrow and right-align the status pill on its own row when the footer stacks.
- This is better than hiding ACP metadata because users still need the context, and better than keeping the eyebrow because the pill already communicates the meaning with less noise.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/acp-session-badge.tsx` so compact ACP badges use tighter spacing and a lighter rounded-pill treatment.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so compact tile footers use denser spacing, slightly smaller compact padding, and a simpler stacked status row without the redundant `Status` label.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the denser compact footer spacing and the new compact ACP badge styling.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still reached the `Chats` shell and found no `.progress-panel` tiles.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the compact ACP badge and stacked `Status` eyebrow unchanged would avoid any visual churn, but it would preserve low-value chrome in the exact compact states where density matters most.
- Hiding ACP metadata altogether in compact footers would free more space, but it would remove comparison context users still need when several sessions are tiled.
- Reworking the entire footer into a new abstraction would be disproportionate for this iteration; the chosen change keeps the existing structure and simply makes it read more cleanly.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the lighter compact ACP pill and eyebrow-free stacked status row feel clearer rather than too subtle.
- If compact background tiles still feel busy after this, the next likely density follow-up is whether the compact status pill itself should soften slightly before hiding any more metadata.

## Iteration 83 - Preserve manual tile height across width breakpoint reflow

### Area inspected
- `tiling-ux.md`, especially the latest compact-tile notes so this pass could deliberately move to a different open thread instead of continuing the just-touched footer-density work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- lightweight live inspection attempt via `electron_execute`, which still exposed `http://localhost:19007/` with title `Chats` rather than a trustworthy tiled desktop sessions surface

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose a different area than the recent `AgentProgress` density passes.
2. Inspect `SessionTileWrapper` in `session-grid.tsx`, especially the responsive width/height reflow effects that react to window, sidebar, and floating-panel width changes.
3. Compare the vertical reflow path with the width reflow path to see whether both preserve deliberate manual tile sizing.
4. Re-check the reachable renderer target before editing; it still remained the `Chats` shell instead of the tiled desktop sessions route, so this pass stayed source- and test-validated.

### UX problem found
- The vertical reflow path already preserved manual tile height unless the tile was still following the previous layout-driven height.
- The width reflow path did not: whenever a width breakpoint changed the computed target height, it unconditionally snapped the tile height to the new layout target.
- That made tiled resizing feel less trustworthy because a user-adjusted tile height could be lost just by narrowing or widening the sessions area via window changes, sidebar changes, or floating-panel width changes.

### Assumptions
- It is acceptable to preserve a manual height across width breakpoint changes when the tile has already diverged from the previous layout target, because the user explicitly chose that height and the brief prioritizes reducing accidental layout resets.
- It is still acceptable to retarget height when the tile is effectively following the prior layout-driven height, because in that case the user has not expressed a conflicting preference and the new breakpoint should still adapt cleanly.
- Focused renderer tests plus desktop web typecheck are sufficient for this pass because the reachable Electron renderer still was not the actual tiled sessions workflow.

### Decision and rationale
- Reuse the same layout-driven-height tolerance idea already used for container-height reflow instead of inventing a new state flag or persistence model.
- Add an explicit width-reflow height-retarget helper so the code documents the intended rule: width breakpoint changes may update height, but only while the current height is still effectively layout-driven.
- Keep width clamping behavior unchanged so genuine out-of-bounds widths still recover responsively.
- This is better than the old unconditional height reset because manual resizing survives ordinary width pressure, and better than never retargeting height on width breakpoints because layout-driven tiles still adapt cleanly when users have not overridden them.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to factor the shared layout-driven height check into a small helper and expose a width-reflow-specific `shouldRetargetTileHeightOnContainerWidthChange(...)` helper.
- Updated the same file so the responsive width reflow effect now consults that helper instead of always resetting height whenever the computed target height changes.
- Kept the existing width-clamping logic and breakpoint-driven width restoration behavior unchanged.
- Updated `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` with focused unit coverage for the new width-reflow height-preservation helper.
- Updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` so the source contract now locks in the new helper-backed width-reflow behavior.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still reached `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the unconditional width-reflow height reset in place would keep the logic slightly shorter, but it would continue to erase deliberate manual height choices during ordinary window or panel width changes.
- Never retargeting height on width breakpoint changes would preserve manual sizing, but it would also let layout-driven tiles get stuck in the wrong height after responsive column changes.
- Tracking an explicit `isHeightUserResized` flag could be more precise, but it would add more state and persistence complexity than needed when the existing tolerance-based pattern already works for vertical reflow.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the preserved manual height feels right while dragging the sidebar or resizing the floating panel across compare/grid breakpoints.
- The neighboring open resizing thread is whether the single-visible-tile and sparse-wide-grid retarget paths should also become more conservative about overriding manual height after users have deliberately resized tiles.

## Iteration 84 - Mark the remembered multi-tile return target while Single view is active

### Area inspected
- `tiling-ux.md`, especially the latest width-reflow notes so this pass could intentionally move to a different open thread instead of repeating the recent resizing work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- Live renderer probe via `electron_execute`, which still exposed `http://localhost:19007/` with title `Chats` rather than the tiled desktop sessions surface

### Repro steps reviewed
1. Re-read the ledger first and choose the still-open maximized-vs-grid predictability thread instead of continuing density or resize work.
2. Inspect the Single-view header controls in `sessions.tsx`, especially the relationship between the explicit `Back to ...` button and the Compare/Grid buttons that remain visible beside it.
3. Confirm in source that, while Single view is active, Compare and Grid both render as similarly inactive buttons even though only one is the remembered multi-tile return target.
4. Attempt a lightweight live check before editing; the reachable renderer remained the `Chats` shell instead of the desktop sessions route, so this pass stayed source- and test-validated.

### UX problem found
- Single view already had a dedicated restore button, but the adjacent Compare and Grid buttons still looked symmetrical.
- That made the relationship between the current maximized state and the remembered multi-tile state harder to parse at a glance, especially after entering Single view from a tile maximize action and then browsing to a different session.
- The copy also treated both non-single buttons as `Return to ...`, even though only one was truly the remembered return target and the other was a fresh layout switch.

### Assumptions
- It is acceptable to keep both the explicit restore button and the full layout button group, because users may still want to jump directly to the non-remembered layout from Single view.
- It is acceptable to solve this through local copy and styling only, because the underlying layout-switching behavior already works and this iteration is about predictability rather than state changes.
- No corresponding mobile change is required for this pass because the behavior being refined is specific to the desktop sessions tiling header.
- Focused source-backed tests plus desktop web typecheck are sufficient here because the available Electron renderer still was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the existing Single-view restore button so there is still an explicit `way back` affordance.
- Mark the remembered multi-tile layout inside the Compare/Grid button group so the restore target is visible even if users scan the layout buttons first.
- Differentiate the button copy: the remembered target says `Return to ... (last tiled layout)`, while the alternate multi-tile option says `Switch from Single view to ...`.
- Show a compact `Back target` badge only on roomier headers, while compact headers still get a subtle highlight on the remembered layout button without adding more chrome.
- This is better than removing one of the controls because it preserves flexibility, and better than tooltip-only clarification because the remembered return path becomes visible before hover.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so Single-view restore copy now explicitly mentions the `last tiled layout`.
- Updated the same file so the layout button group derives `isSingleViewRestoreTarget`, distinguishes `Return` vs `Switch` titles, and gives the remembered layout button a subtle highlight in Single view.
- Added a roomy-header-only `Back target` badge to the remembered Compare/Grid button so the return destination is clearer without crowding compact headers.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new copy and remembered-layout emphasis.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still reached `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Removing the explicit `Back to ...` button and relying only on the remembered layout button would reduce duplication, but it would also make the recovery path less obvious for first-time users in Single view.
- Leaving the buttons visually symmetric and relying only on titles would keep the chrome unchanged, but it would preserve the ambiguity this pass is trying to reduce.
- Adding a larger explanatory chip outside the button group would be more explicit, but it would spend more header space than necessary in a control cluster that already has several compact actions.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the remembered-layout emphasis feels helpful rather than redundant beside the existing restore button.
- If compact Single-view headers still feel slightly over-specified, the next focused pass should consider whether the explicit restore button and the remembered-layout styling can be merged more cleanly at the narrowest widths.
- The broader floating-panel-versus-tiled-layout interaction remains open; this pass only clarifies how users leave Single view once they are there.

## Iteration 84 - Explain when the panel is already at minimum width during tiled layout pressure

### Area inspected
- `tiling-ux.md`, specifically the most recent resizing/layout-pressure notes so this pass could move to a different local issue instead of continuing the just-touched tile-height reflow thread
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` for existing minimum-width wording and panel-resize affordance patterns
- lightweight live inspection via `electron_execute`, which still resolved to `http://localhost:19007/` with title `Chats` rather than a trustworthy desktop tiled-sessions route

### Repro steps reviewed
1. Re-read the ledger first and deliberately choose a fresh area in the sessions header recovery controls instead of continuing the latest tile-size preservation work.
2. Inspect the stacked / near-stacked recovery logic in `sessions.tsx`, especially the conditions that decide when `Shrink panel` and `Hide panel` actions appear.
3. Compare that with `panel-resize-wrapper.tsx`, which already surfaces `Minimum width reached` while dragging the panel.
4. Check the live Electron target before editing; it still exposed the generic `Chats` shell, so this pass stayed source- and test-validated.

### UX problem found
- When compare/grid is stacked or close to stacking and the floating panel is already at its minimum width, the sessions header may show `Hide panel` without also showing `Shrink panel`.
- That state is functionally correct, but it is not self-explanatory: users have to infer that panel shrinking is no longer possible from the absence of the shrink action.
- This makes tiled recovery feel less predictable at exactly the moment when panel resizing and tiled-session width pressure intersect.

### Assumptions
- Reusing the panel-resize subsystem's existing `minimum width` language is acceptable because it keeps the tiled header aligned with an already-established desktop resizing concept instead of inventing a new term.
- A small explanatory chip plus a stronger hide-button tooltip is enough for this pass; a broader redesign of layout-pressure controls is unnecessary because the immediate problem is ambiguity, not lack of available actions.
- Focused source-contract coverage plus desktop renderer typecheck are sufficient validation for this iteration because the reachable Electron renderer still was not the actual tiled desktop sessions workflow.

### Decision and rationale
- Add an explicit header chip when tiled layout pressure exists, the panel is visible, and it is already at minimum width, so users can immediately understand why `Shrink panel` is unavailable.
- Also append that same explanation to the hide-panel tooltip so mouse, keyboard, and assistive-technology users get the rationale directly on the remaining recovery action.
- Keep the chip neutral rather than warning-styled because this is explanatory state, not a second competing alert.
- This is better than leaving the current behavior alone because it removes a hidden rule, and better than introducing a disabled `Shrink panel` button because that would spend more header space and add control clutter for a state that only needs brief explanation.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive a `showPanelAtMinimumWidthLayoutPressureHint` state when tiled layout pressure exists, the panel is visible, and it cannot shrink any further.
- Added compact/responsive copy for that state (`Min width`, `Panel min width`, `Panel already at minimum width`) plus a tooltip explaining that shrinking will no longer free more tiled width.
- Updated the same file so the `Hide panel` tooltip now explicitly says hiding is the only remaining panel recovery action when the panel is already at minimum width.
- Added the new explanatory chip to the sessions header meta row and included it in the compact-header row-splitting logic so it stays readable without displacing the primary controls unpredictably.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new state derivation, copy, tooltip detail, compact-header metadata handling, and rendered chip.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` returned `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the hide-only state implicit would keep the header slightly smaller, but it would preserve an avoidable moment of confusion right in a high-pressure recovery state.
- Showing a disabled `Shrink panel` button could make the unavailable action explicit, but it would add more chrome and compete with the actual recovery action in already-constrained headers.
- Escalating the explanation into another warning-styled chip would make it louder, but it would overstate the issue; the better UX is calm explanation of the remaining option.

### What still needs attention
- This should still be runtime-validated on a real desktop tiled-sessions surface to confirm the new chip reads clearly beside stacked/near-stacked hints while sidebar width and floating-panel width change together.
- The next adjacent panel/tile workflow question is whether the prioritized recovery action should become even more outcome-explicit (for example, distinguishing `restores side-by-side` vs `only adds room`) without making the compact header noisy again.

## Iteration 85 - Remove duplicate compact "Recent" header chrome from session tiles

### Area inspected
- `tiling-ux.md`, specifically the latest panel/layout-pressure entries so this pass could shift to a different tiled-view concern instead of continuing stacked-layout recovery controls
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight live inspection via `electron_execute`, which again only exposed the generic `Chats` shell rather than a trustworthy desktop tiled-sessions route

### Repro steps reviewed
1. Re-read the ledger and deliberately pick a tile-internal density issue rather than another global layout or panel-resize adjustment.
2. Inspect the `AgentProgress` tile variant header/body logic to see how compact tiles explain transcript preview mode when the tile is unfocused.
3. Compare the compact header badges with the in-body transcript preview hint that already appears above the tile transcript list.
4. Check the reachable Electron renderer before editing; it still was not the actual tiled desktop sessions workflow, so this pass stayed code- and test-validated.

### UX problem found
- Unfocused compact tiles can show two separate cues for the same state: a header `Recent` badge and an inline transcript preview hint explaining that earlier updates are hidden.
- The body hint is already clearer because it includes both the hidden-update count and the recovery path (`Focus for full history` / open Single view).
- Keeping the extra compact header badge spends precious horizontal and vertical header space on repeated explanation, which makes narrow tiled grids feel busier and pushes action buttons into a split-row state sooner than necessary.

### Assumptions
- The inline transcript preview hint is the better primary explanation for compact tiles because it sits next to the clipped content it describes and already contains the actionable wording.
- Removing only the compact header badge is a safe local change because wider tiles can still benefit from the higher-level `Recent only` header cue without over-densifying the chrome.
- Focused source-contract coverage plus renderer typecheck are sufficient validation for this iteration because the currently reachable Electron renderer still was not the desktop tiled sessions surface.

### Decision and rationale
- Suppress the header transcript-preview badge for compact tiles while keeping the existing inline transcript preview hint intact.
- Continue showing the header badge on wider tiles, where the extra cue is less crowded and helps explain why only recent activity is visible at a glance.
- Let compact headers reserve split-row treatment for more durable or higher-priority states like `Collapsed` and `Approval` instead of spending that structure on a duplicate preview hint.
- This is better than leaving both cues in place because it reduces redundant chrome, and better than removing the inline hint because the inline version carries the useful count and action guidance.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so the tile transcript preview badge now renders only when the tile is not compact.
- Simplified the preview-badge label logic in the same file so the remaining wide-tile badge always reads `Recent only`.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` so the source contract now locks in the compact-suppression rule and the narrower scope of compact header split-row usage.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still returned the generic `Chats` shell rather than the desktop tiled sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the compact `Recent` badge would preserve one extra at-a-glance cue, but it would continue to duplicate the better inline explanation and increase header clutter in the exact layouts that need less chrome.
- Removing both the header badge and the inline hint would save even more space, but it would hide the reason compact tiles only show recent updates and remove the explicit path to full history.
- Converting the compact badge into a more subtle icon-only indicator would reduce text but still preserve duplicate state chrome, so it would not solve the underlying density problem as well as removing the redundant cue.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm that compact tile headers feel calmer without making preview mode too implicit during active multitasking.
- The next adjacent tile-density thread is whether compact tiles should also tone down other transient chrome, such as when transcript preview, queue state, and approval state all compete inside a very narrow tile.

## Iteration 86 - Remove duplicate compact approval header chrome when approval cards are already visible

### Area inspected
- `tiling-ux.md`, specifically Iterations 84-85 so this pass could continue the compact-tile density thread without revisiting the same `Recent only` cleanup
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight live inspection via `electron_execute`, which still only exposed `http://localhost:19007/` with title `Chats` rather than a trustworthy desktop tiled-sessions route

### Repro steps reviewed
1. Re-read the ledger first and deliberately stay on the next compact tile-density opportunity rather than returning to session-header layout pressure controls.
2. Inspect `AgentProgress` tile header meta logic for compact tiles, especially how `Approval`, `Collapsed`, and transcript-preview cues decide whether the header splits into two rows.
3. Compare the compact approval header cue with the stronger approval signals already present on the same tile: amber tile treatment, shield status icon, and the full inline approval card rendered outside the scroll area.
4. Check the reachable Electron target before editing; it still was not the actual tiled desktop sessions workflow, so this pass stayed code- and test-validated.

### UX problem found
- Expanded compact tiles with pending tool approval can spend header space on an `Approval` badge even though the tile already has a pulsing shield status icon, amber emphasis, and a full inline approval card directly below the transcript area.
- That duplicate header badge is most costly on narrow tiles because it can force the compact header into a split-row state sooner, pushing the actual action buttons farther away from the title.
- The badge is still useful for collapsed tiles, where the inline approval card is hidden and users need an explicit text cue that approval is waiting.

### Assumptions
- The inline approval card, amber tile styling, and shield status icon together are sufficient approval affordance for expanded compact tiles, so removing the extra badge there will not hide the state.
- Keeping the badge for collapsed tiles is the safest compromise because collapsed tiles intentionally hide the approval card and otherwise rely more on compact summary chrome.
- Focused source-contract coverage plus renderer typecheck are sufficient validation for this pass because the reachable Electron surface still was not the real tiled desktop sessions route.

### Decision and rationale
- Show the header `Approval` badge only when it still adds unique value: on roomy tiles or when the tile is collapsed.
- Suppress that badge for expanded compact tiles, where it duplicates stronger existing approval cues and makes narrow headers busier than necessary.
- Recompute compact header meta/split-row logic from the filtered approval badge signal so compact expanded approval tiles can keep controls on the primary row more often.
- This is better than leaving the badge everywhere because it removes redundant chrome in the exact layouts that are most space-constrained, and better than removing the badge entirely because collapsed tiles would lose their clearest explicit approval label.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `showTileHeaderApprovalBadge`, which now keeps the approval badge only for collapsed or non-compact tiles.
- Updated the same file so `hasTileHeaderMeta` follows that filtered badge state instead of treating every pending approval as header meta.
- Updated the header rendering to use `showTileHeaderApprovalBadge`, allowing expanded compact approval tiles to avoid a redundant badge and unnecessary split-row pressure.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new compact approval-badge rule and the narrower compact-header split-row criteria.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still returned `http://localhost:19007/` with title `Chats`, not the desktop tiled sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the approval badge everywhere would preserve one extra textual cue, but it would continue to duplicate stronger approval signals and consume scarce compact-header space.
- Removing the approval badge from all tile states would simplify the header further, but collapsed tiles would lose the clearest explicit approval label once the inline card is hidden.
- Replacing the badge with different compact wording or an icon-only chip would still preserve extra transient chrome instead of addressing the underlying duplication.

### What still needs attention
- This should still be runtime-validated on a real desktop tiled-sessions surface to confirm compact approval tiles feel cleaner without making approval state too implicit during rapid multitasking.
- The next adjacent compact-tile density question is whether other transient states, especially queued follow-up status in combination with approval or transcript-preview hints, should also step back when stronger in-tile explanations are already visible.

## Iteration 87 - Make stacked panel-recovery actions visibly say when they restore tiled layout

### Area inspected
- `tiling-ux.md`, especially the latest panel/layout-pressure entries so this pass could continue the still-open stacked-recovery clarity thread instead of revisiting the just-touched compact tile density work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Live renderer probe via `electron_execute`, which still exposed `http://localhost:19007/` with title `Chats` rather than the tiled desktop sessions surface

### Repro steps reviewed
1. Re-read the ledger first and intentionally pick up the open question from the latest stacked-layout recovery iteration.
2. Inspect the existing stacked recovery logic in `sessions.tsx`, especially where `Shrink panel` already distinguishes `restores side-by-side` versus `only adds room` in tooltip copy.
3. Confirm the asymmetry: `Shrink panel` already had richer tooltip outcomes, but the visible action row still mainly showed action names plus `+Npx`, so users still had to hover to learn whether the primary action actually restores compare/grid.
4. Probe the attached renderer before editing; the reachable target remained the generic `Chats` shell instead of a trustworthy tiled sessions route, so this pass stayed source- and test-validated.

### UX problem found
- In already-stacked compare/grid states, the sessions header can visually prioritize either `Shrink panel` or `Hide panel`, but that priority still relied heavily on hover text to explain whether the action truly restores the tiled layout.
- The inline `+Npx` pills were useful for comparing reclaimed width, but they did not answer the more important product question: `Will this actually get me back to side-by-side / columns, or does it only make things a bit less cramped?`
- `Hide panel` also always described itself as restoring `the most room`, even in cases where it could specifically restore compare/grid, which undersold the outcome of the stronger recovery path.

### Assumptions
- It is acceptable to keep this improvement limited to already-stacked states, because that is where the restore-vs-only-more-room distinction matters most and the latest ledger explicitly called out that exact ambiguity.
- It is acceptable to spend a small visible outcome chip only on roomy headers, because compact headers are already optimized around action ordering and avoiding extra chrome.
- It is acceptable to compute whether hiding the panel restores stacked layout using the same existing responsive stacking heuristic that already determines whether shrinking restores it; this keeps the decision model consistent and local.
- Focused source-backed tests plus desktop web typecheck remain sufficient for this pass because the reachable Electron target still was not the actual tiled desktop sessions workflow.

### Decision and rationale
- Keep the existing action row, prioritization model, and `+Npx` comparison pills in place.
- Add a compact visible outcome pill only on the prioritized stacked-state recovery action when it truly restores the tiled layout, using plain outcome language (`Restores side by side` / `Restores columns`) instead of more abstract wording.
- Upgrade `Hide panel` stacked-state tooltip copy so it also distinguishes between `restores side-by-side / columns` and `restores the most room`, matching the already-richer shrink behavior.
- Tighten `Hide panel` prioritization so it is only visually promoted when hiding really does restore the stacked layout and shrinking is not already the lighter successful fix.
- This is better than adding another passive header chip because the explanation stays attached to the action users are deciding about, and better than showing another permanent badge on compact headers because it keeps the narrow recovery row calm.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `canResolveStackedLayoutPressureByHidingPanel` from the existing stacked-layout heuristic and full panel-width recovery.
- Refined the same file so `prioritizeHidePanelForLayoutPressure` only promotes `Hide panel` when hiding actually restores the stacked layout and shrinking is not already sufficient.
- Added a roomy-header-only `prioritizedLayoutPressureOutcomeLabel` (`Restores side by side` / `Restores columns`) and render path so the prioritized stacked recovery action visibly explains its payoff instead of showing only a numeric width delta.
- Updated the stacked `Hide panel` tooltip copy to explicitly say when hiding restores side-by-side sessions or multiple tiled columns.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new hide-resolution detection, prioritization constraint, visible outcome pill, and outcome-specific hide tooltip copy.

### Verification
- Live inspection remained non-actionable for tiled sessions: `electron_execute` still reached `http://localhost:19007/` with title `Chats`, not the desktop sessions route.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the improvement at tooltip-only copy would keep the header slightly smaller, but it would preserve the main ambiguity the ledger called out: users still would not know at a glance whether the promoted action truly restores the tiled layout.
- Replacing both actions' `+Npx` pills with longer textual outcome labels would be more verbally explicit, but it would make the action row harder to compare and noisier than necessary.
- Adding a separate passive `Restores compare` chip outside the buttons would explain the state, but it would disconnect the explanation from the actionable control and compete with the other header metadata chips.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the new prioritized outcome pill feels helpful rather than redundant beside the existing blue emphasis and numeric secondary-action badge.
- The next adjacent panel/tile workflow question is whether near-stacked warning states should get a similarly visible outcome cue when only one remaining panel action can actually prevent stacking, without overloading the compact header.

## Iteration 88 - Let queued follow-up chrome step back behind stronger compact tile states

### Area inspected
- `tiling-ux.md`, especially the latest compact-tile density entry and its explicit follow-up question about queued follow-up status competing with approval or transcript-preview hints
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Live renderer probe via `electron_execute`, which failed to connect to the current Electron target, so this pass stayed source- and test-validated

### Repro steps reviewed
1. Re-read the ledger first and intentionally continue the newly-open compact-tile density question instead of revisiting the just-finished panel recovery work.
2. Inspect the tile variant in `agent-progress.tsx`, focusing on the relationship between compact queue chrome, pending approval UI, and the `Recent only` transcript-preview hint.
3. Confirm the crowded case: unfocused compact tiles could still render the compact `MessageQueuePanel` even when a stronger transient explanation was already visible inside the tile.
4. Probe the live renderer before editing; the Electron inspection path was unavailable, so validation stayed focused on source-backed tests and desktop web typecheck.

### UX problem found
- In narrow background tiles, queued follow-up state could keep a dedicated compact queue panel even when the tile was already explaining a more urgent transient state, especially pending tool approval or `Recent only` transcript preview mode.
- That created stacked secondary chrome in the exact multitasking layout where users most need quick visual hierarchy and lower ambiguity.
- The queue state still mattered, but a full compact management panel was visually louder than necessary when approval or transcript truncation was already the primary thing to notice.

### Assumptions
- It is acceptable for compact background tiles to downgrade queue management from a full panel to a passive summary when a stronger tile state is already visible, because focusing or expanding the tile still restores the richer queue controls.
- It is acceptable to keep this behavior scoped to the existing compact/background conditions (`!isFocused && !isExpanded`) so primary tiles do not lose direct queue management affordances.
- Focused tile-layout tests plus desktop web typecheck are sufficient for this pass because the change is renderer-local and no usable live Electron tiled-sessions target was reachable.

### Decision and rationale
- Keep queued follow-up state visible, but let it yield hierarchy in compact background tiles when approval or transcript-preview hints are already carrying the more important explanation.
- Replace the full compact queue panel in that crowded case with a small footer status pill (`N queued` / `N queued paused`) that preserves awareness without consuming a full extra tile band.
- Keep the existing compact queue panel everywhere else, especially when queue state is the primary thing worth managing.
- This is better than hiding queue state entirely because users still get passive awareness, and better than leaving the full queue panel everywhere because it reduces stacked chrome and makes the higher-priority tile state easier to scan.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `shouldInlineCompactTileQueueSummary` for compact background tiles that already show approval or transcript-preview pressure.
- Added compact queue summary label/title helpers and rendered the new queue state as a footer pill beside the tile status pill.
- Updated the same file so the full tile `MessageQueuePanel` now yields to that inline summary only in the crowded compact-state case.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new compact queue-summary rule, footer-pill rendering, and the updated queue-panel gating condition.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` failed to connect to the current Electron target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the compact queue panel in place everywhere would preserve direct queue actions, but it would keep over-emphasizing secondary queue management in already-crowded narrow tiles.
- Hiding queue state completely whenever approval or preview hints exist would reduce chrome even more, but it would make queued follow-ups too easy to miss during multitasking.
- Moving queue state into the header instead of the footer would save similar space, but it would compete with already-busy compact header controls and transient badges.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the footer pill reads clearly enough when compact approval cards and transcript-preview hints are both present.
- A future adjacent pass could decide whether paused queue state deserves a stronger visual priority than waiting queue state in compact tiles, especially if multiple paused sessions appear at once.

## Iteration 89 - Make near-stacked panel recovery visibly say when it prevents stacking

### Area inspected
- `tiling-ux.md`, especially Iteration 87's explicit follow-up question about near-stacked warning states needing a visible outcome cue
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Live renderer probe via `electron_execute`, which failed to connect to the current Electron target, so this pass stayed source- and test-validated

### Repro steps reviewed
1. Re-read the ledger first and intentionally continue the open near-stacked panel-recovery question instead of revisiting compact tile density.
2. Inspect the existing `showNearStackedLayoutHint` branch in `sessions.tsx`, especially how `Shrink panel` already distinguishes `keeps tiled sessions from stacking` versus `only gives a bit more room` in tooltip copy.
3. Confirm the remaining ambiguity: the visible action row only promoted stacked-state success, while near-stacked recovery still relied on hover text to explain whether an action would actually keep compare/grid from collapsing.
4. Check the renderer target before editing; Electron inspection was unavailable, so this pass stayed bounded to source-backed tests and typecheck.

### UX problem found
- In near-stacked warning states, the header could show one or two panel recovery actions, but the primary question still was not visible at a glance: `Will this actually keep my tiled layout from stacking, or does it only buy a little extra room?`
- `Hide panel` also always described itself as preventing stacking whenever the near-stacked warning was active, even though some window/sidebar combinations can remain tight enough that hiding only improves room without fully clearing the warning.
- When `Hide panel` was the only remaining successful action in near-stacked state, it still was not visually promoted ahead of the weaker `Shrink panel` action.

### Assumptions
- It is acceptable to reuse the same responsive stacked-layout heuristic plus the existing near-stacked warning buffer to determine whether hiding the panel actually clears the near-stacked warning, because that keeps the success criteria aligned with the warning itself.
- It is acceptable to keep the visible outcome chip limited to roomy headers, matching the earlier stacked-state pattern and avoiding new compact-header clutter.
- Focused source-backed tests plus desktop web typecheck remain sufficient for this pass because the live Electron tiled-sessions route was not reachable.

### Decision and rationale
- Extend the existing prioritized recovery pattern from stacked states to near-stacked states, but only when a panel action genuinely prevents stacking rather than merely freeing space.
- Show the same blue promoted treatment on the successful near-stacked action and give it a plain-language outcome pill (`Keeps side by side` / `Keeps columns`) so the benefit is visible without hover.
- Upgrade near-stacked `Hide panel` copy so it only promises prevention when hiding truly clears the warning; otherwise it now says it gives more room but the tight-fit warning may remain.
- Promote `Hide panel` ahead of `Shrink panel` in near-stacked state only when hiding is the sole action that actually prevents stacking.
- This is better than adding another passive warning chip because the explanation stays attached to the action users are choosing, and better than promoting `Hide panel` unconditionally because it avoids over-selling a heavier action when it does not actually solve the warning.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `canResolveNearStackedLayoutPressureByHidingPanel` using the near-stacked warning buffer and full panel-width recovery.
- Expanded `prioritizeShrinkPanelForLayoutPressure`, `prioritizeHidePanelForLayoutPressure`, and `prioritizedLayoutPressureOutcomeLabel` so near-stacked states can visibly promote the action that actually keeps tiled layout from stacking.
- Updated near-stacked `Hide panel` tooltip copy to distinguish between `keeps tiled sessions from stacking` and `gives more room, though the tight-fit warning may remain`.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new near-stacked hide-resolution detection, prioritization rules, visible outcome pill text, and corrected tooltip copy.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` failed to connect to the current Electron target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving near-stacked clarification in tooltip text only would keep the button row slightly smaller, but it would preserve the main ambiguity this pass targeted: the effective action would still not explain itself until hover.
- Always promoting `Hide panel` in near-stacked state would make the stronger action more obvious, but it would also overweight a more disruptive change when shrinking is already sufficient or when hiding still does not fully clear the warning.
- Showing outcome pills on every near-stacked action would be more explicit, but it would add more header noise than necessary and weaken the value of the promoted-action treatment.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the near-stacked promoted action reads clearly and does not feel too similar to the already-stacked recovery styling.
- A nearby follow-up could decide whether the passive near-stacked warning chip itself should become more outcome-oriented on roomy headers, or whether that would be redundant now that the successful action carries the explanation.

## Iteration 90 - Let promoted near-stacked recovery actions replace redundant passive warning chrome

### Area inspected
- `tiling-ux.md`, especially Iteration 89's explicit follow-up question about whether the passive near-stacked warning chip had become redundant once a promoted action already explained the outcome
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Live renderer probe via `electron_execute`, which failed to connect even after `electron_reset`, so this pass stayed source- and test-validated

### Repro steps reviewed
1. Re-read the ledger first and intentionally continue the open near-stacked follow-up instead of starting a different tiling subproblem.
2. Inspect the wide-header near-stacked path in `sessions.tsx`, especially where the passive `Close to stacking` / `Tight fit` chip can coexist with a prioritized panel action carrying `Keeps side by side` or `Keeps columns`.
3. Confirm the asymmetry: compact headers already hide passive pressure chips when recovery actions are present, but roomy headers could still show both the passive warning chip and the promoted action outcome.
4. Probe the live Electron target before editing; the current target was not reachable, so validation stayed focused on source-backed tests and desktop web typecheck.

### UX problem found
- In roomy near-stacked states, the header could show both a passive amber warning chip and a promoted recovery action that already explained how to prevent stacking.
- That duplicated meaning across two adjacent pieces of header chrome, spent width on repeated guidance, and made the sessions controls row feel busier than necessary.
- The redundancy was strongest in near-stacked state because the promoted action outcome (`Keeps side by side` / `Keeps columns`) already communicates the key warning in plain language.

### Assumptions
- It is acceptable to let the passive near-stacked warning chip yield only when a promoted recovery action is already visible on roomy headers, because compact headers already follow that principle and this keeps the change local.
- It is acceptable to leave already-stacked passive chip behavior unchanged in this iteration, because the open question was specifically about near-stacked redundancy and stacked state still benefits from explicit current-state context.
- Focused source-backed tests plus desktop web typecheck are sufficient for this pass because the live Electron tiled-sessions surface was not reachable and the change stays renderer-local.
- No mobile change is needed because this improvement is specific to the desktop tiled-sessions header; there is no equivalent mobile tiling header to keep in sync.

### Decision and rationale
- Keep near-stacked detection, warning copy, and promoted panel-recovery outcome labels unchanged.
- Hide the passive near-stacked warning chip on roomy headers only when a promoted recovery action is already visible and can explain how to keep the layout from stacking.
- Preserve the passive chip when no promoted action exists, so the warning remains visible when there is not already a successful recovery path being explained inline.
- This is better than always showing both elements because it removes duplicate chrome, and better than removing the chip unconditionally because it keeps the warning available in weaker-action states.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `shouldHidePassiveNearStackedLayoutHint` from the existing near-stacked state, header density, prioritized action state, and visible outcome label.
- Updated the same file so `showPassiveNearStackedLayoutHint` yields to the promoted action only in that specific roomy-header case.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new suppression rule and the reasoning seam it depends on.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` failed to connect to the current Electron target, and `electron_reset` could not reattach to a usable renderer.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping both the passive warning chip and the promoted action preserves maximum warning visibility, but it duplicates meaning and wastes header room.
- Removing the passive near-stacked chip everywhere would simplify the header further, but it would also hide the warning in cases where no action is clearly successful.
- Applying the same suppression to already-stacked state might reduce chrome further, but it risks removing useful current-state context and would broaden scope beyond the specific follow-up question.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm that the promoted near-stacked action is clear enough without the extra passive chip on roomy headers.
- A nearby follow-up could decide whether roomy already-stacked states should eventually use similar de-duplication, or whether their passive chip still earns its keep by explaining the current degraded layout.
- If action-less near-stacked states still feel ambiguous, the next likely pass is making that passive warning chip slightly more outcome-oriented only when no successful recovery action is available.

## Iteration 90 - Make paused queue state stand out more clearly in compact tiles

### Area inspected
- `tiling-ux.md`, specifically Iteration 89 so this pass could move away from the just-touched panel-recovery header thread
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight live inspection attempt via `electron_execute`, which remained unavailable for the current Electron target

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose an older open tile-internal hierarchy follow-up rather than continuing the near-stacked header work.
2. Inspect the compact tile queue-summary path in `agent-progress.tsx`, especially the inline footer pill used when approval or transcript-preview hints are already visible.
3. Compare the paused compact-summary treatment with the richer compact `MessageQueuePanel` treatment to see whether paused state still reads as a stronger intervention state than ordinary waiting.
4. Check the collapsed-tile summary row too, because collapsed tiles are another compact tiled surface where queued work must remain visible without becoming ambiguous.

### UX problem found
- Compact queue summaries in tiles still used the generic `Clock` icon and a status-last label (`N queued paused`), so paused queues were not as easy to scan as they could be when several dense tiles were visible together.
- The full compact `MessageQueuePanel` already treated paused state more clearly, so the inline compact-summary fallback felt weaker and slightly inconsistent in the very states where the UI intentionally compresses chrome.
- Collapsed tiles had the same problem: queued work stayed visible, but paused queues still looked too similar to ordinary waiting queues.

### Assumptions
- It is acceptable to make paused queue state more explicit in compact tile summaries without changing queue behavior, because the user-value here is hierarchy and recognizability rather than new controls.
- It is acceptable to reuse the existing paused-versus-waiting visual language from `MessageQueuePanel` so compact tile summaries stay consistent with the richer queue-management surface.
- Focused source-backed tile-layout verification plus desktop renderer typecheck remain sufficient for this pass because live Electron inspection was not currently available.

### Decision and rationale
- Keep queue awareness in compact tiles, but make paused state read as the stronger intervention state by switching those summaries to the pause icon, state-first copy, and stronger paused styling.
- Reuse one shared paused/waiting tone for both the inline compact footer pill and the collapsed summary badge so compact tiles stay visually consistent.
- Keep ordinary waiting queues calmer and leave the richer interactive queue panel unchanged, because the problem was the weaker paused fallback treatment, not missing controls.
- This is better than adding more queue controls to compact tiles because the goal is faster scanning and clearer hierarchy, not more chrome.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive a shared compact tile queue-status icon, label, title, and paused/waiting tone classes.
- Changed compact inline queue summaries to use state-first paused copy (`Paused · N queued`), the `Pause` icon, and a slightly stronger paused emphasis.
- Updated collapsed-tile queue badges to reuse the same compact queue-status treatment so paused queues remain easy to spot after a tile is collapsed.
- Expanded `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new paused-queue icon, copy, shared styling, and collapsed-badge plumbing.

### Verification
- Live inspection remained unavailable for this pass: `electron_execute` could not reach a usable tiled desktop sessions target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the existing compact queue summaries alone would avoid churn, but it would keep paused queues too visually close to ordinary waiting queues in dense tiled views.
- Copy-only changes without the pause icon or stronger paused treatment would help somewhat, but they would still undersell paused state during quick visual scanning.
- Promoting paused queue state into the tile header would make it louder, but it would also compete with approval and transcript-preview cues in an already busy compact header.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the stronger paused pill feels helpful rather than too attention-grabbing when multiple paused tiles are visible.
- If compact tile queue state still feels crowded in practice, a nearby follow-up could decide whether waiting queues should soften further when approval or transcript-preview explanations are present.

## Iteration 91 - Restore manual tile height after a Single view round-trip

### Area inspected
- `tiling-ux.md`, specifically the latest header-pressure and compact-tile notes so this pass could move to a different open tiling thread instead of repeating recent sessions-header work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which failed to connect to the current Electron target, so this pass stayed source- and test-validated

### Repro steps reviewed
1. Re-read the ledger first and intentionally leave the just-touched near-stacked header/compact queue threads alone.
2. Inspect the existing `Single view` restore path in `sessions.tsx`, especially `singleViewReturnTileWidthRef`, `handleSelectTileLayout(...)`, and the `clearPersistedSize("session-tile")` reset on entry.
3. Trace how `SessionTileWrapper` restores size when leaving `Single view` and confirm it already restores remembered width but still unconditionally resets height back to `targetTileHeight`.
4. Check the existing resize/reflow tests to confirm there was no height-specific restore seam yet.

### UX problem found
- Users could manually resize tiled session height, briefly open `Single view`, and then lose that preferred multi-tile height on the way back.
- The width path already behaved more predictably because it remembered the previous side-by-side width, so height reset felt like an accidental inconsistency at the maximize-vs-grid boundary.
- The reset was especially awkward for users who intentionally make compare/grid tiles taller for long transcripts, because `Single view` became a destructive detour instead of a temporary focused inspection state.

### Assumptions
- It is acceptable to restore a remembered multi-tile height only when the pre-`Single view` tile height differed materially from the layout target, because that is a strong enough signal of deliberate manual resizing while avoiding stale restores from ordinary layout-driven full-height states.
- It is acceptable to clamp the remembered height to the existing resizable tile bounds instead of inventing a new restore heuristic, because the codebase already uses those bounds as the source of truth for safe tile sizing.
- Focused source-backed tests plus desktop web typecheck remain sufficient for this pass because the current Electron target was not inspectable and the change stays renderer-local.

### Decision and rationale
- Keep entering `Single view` as a full reset to the one-up footprint.
- Before that reset, capture the current tile height only when it looks like a true manual override rather than the current layout's ordinary target height.
- Pass that remembered height through `SessionGrid` and restore it when leaving `Single view`, alongside the already-restored remembered width.
- This is better than always restoring the last measured height because it avoids reapplying layout-driven full-height fallback sizes from temporary one-visible states, and better than leaving the current behavior because it makes `Single view` feel like a reversible zoom instead of a resize reset.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to import `calculateTileHeight`, track `singleViewReturnTileHeightRef`, measure the current visible tile height, and capture it only when it differs from the current layout target by more than a pixel.
- Updated the same file so `SessionGrid` now receives both `layoutRestoreWidth` and `layoutRestoreHeight` for the post-`Single view` restore path.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to thread `layoutRestoreHeight` through context, add `getSingleViewLayoutRestoreHeight(...)`, and restore remembered height when leaving `Single view` for a tiled layout.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`, `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`, and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new capture and restore behavior.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` failed to connect to the current Electron target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving height reset behavior unchanged would avoid extra state plumbing, but it would keep `Single view` feeling needlessly destructive after a manual resize.
- Always restoring the last measured height would preserve more cases, but it would also risk carrying over layout-driven full-height states from temporary one-visible or sparse-grid conditions where the old height was not actually user intent.
- Adding a more complex container-relative height heuristic could smooth more edge cases, but it would broaden scope beyond the local predictability problem and introduce extra policy where existing resize bounds already provide a safe clamp.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface, especially by manually resizing compare/grid height, entering `Single view`, resizing the sidebar, and then returning to confirm the restored height still feels intentional.
- A nearby follow-up could decide whether compare/grid layout switches should also preserve deliberate manual height when the target height changes less drastically, or whether the existing retargeting rules are still the better default.
- Another adjacent resize thread is whether the single-visible and sparse-grid height-retarget paths should become slightly more conservative once a tile has clearly diverged from layout-driven height.

## Iteration 92 - Name the reorder target so drag-and-drop feels less ambiguous

### Area inspected
- `tiling-ux.md`, especially Iterations 89–91 so this pass could avoid the just-touched panel-pressure and resize-restoration threads
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which failed to connect to the current Electron target, so this pass stayed source- and test-validated

### Repro steps reviewed
1. Re-read the ledger first and deliberately pick a different open area: drag/reorder clarity.
2. Inspect `SessionTileWrapper` in `session-grid.tsx`, especially the reorder handle copy and the visual drop-target chip.
3. Trace where session labels already exist in `sessions.tsx` to confirm the UI could reuse real tile names without inventing new state.
4. Check the existing drag-affordance tests to confirm the current behavior still only promised a generic `Drop before` cue.

### UX problem found
- During drag-and-drop, the target chip only said `Drop before`, which makes users infer the target tile from position alone.
- That ambiguity is small in roomy two-tile states, but it grows when tiles are dense, titles wrap, or several sessions look visually similar.
- The reorder handle also described a generic `session`, so keyboard and drag affordances did not reinforce which specific tile would move or receive the insertion point.

### Assumptions
- It is acceptable to reuse the existing `getSessionTileLabel(...)` helper for reorder UI because that helper already defines the best available human-readable tile identity for the sessions surface.
- It is acceptable to keep the change visual-only and local to the tile wrapper rather than adding a larger reorder tutorial, because the main problem here is ambiguity at the moment of action, not missing feature surface area.
- Truncating long target labels inside the chip is acceptable because the chip's job is quick orientation; the full label remains available via the `title` attribute.

### Decision and rationale
- Keep the current reorder handle and drop-line pattern, but make both affordances label-aware.
- Pass each draggable tile's resolved label into `SessionTileWrapper`, use it in the reorder handle `title`/`aria-label`, and show it in the drop-target chip as `Drop before <tile label>`.
- Truncate the visible target name instead of widening the chip indefinitely so the cue stays readable in dense tiled layouts.
- This is better than adding more permanent drag chrome because it improves clarity exactly when users need it without making every tile busier at rest.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `SessionProgressTile` resolves each tile's existing session label and passes it into `SessionTileWrapper`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so reorder handles derive label-aware `title` and `aria-label` text.
- Updated the same file so the drag target chip now shows `Drop before` plus the target tile's truncated label, with a full-label hover title.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the label plumbing and the new target-aware reorder copy.

### Verification
- Live inspection remained unavailable for this pass: `electron_execute` failed to connect to a usable Electron renderer target.
- `pnpm vitest --run apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the generic `Drop before` chip alone would avoid prop plumbing, but it would keep reorder intent unnecessarily implicit in dense tiled states.
- Showing full labels without truncation would be more explicit, but long conversation titles could make the chip balloon and fight the very compact layouts where clarity matters most.
- Adding always-visible per-tile ordering numbers could also reduce ambiguity, but it would introduce more persistent chrome than this localized, interaction-time cue.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the named drop chip reads clearly during a live drag and does not feel too wide on very narrow tiles.
- A nearby follow-up could decide whether reorder live-region announcements should also name the destination neighbor (for example, `before <tile label>`) rather than only reporting the final numeric position.
- Another adjacent drag/discoverability thread is whether empty-space drop should gain a complementary `Keep current order` or `Move to end` cue when users drag below the final tile in long stacked states.

## Iteration 93 - Preserve manual tile height across temporary session-count layout shifts

### Area inspected
- `tiling-ux.md`, especially Iterations 91–92 so this pass could avoid repeating the newest drag-copy work while picking up a still-open resize predictability thread
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which failed to connect to the current Electron renderer target, so this pass stayed source-, test-, and typecheck-validated

### Repro steps reviewed
1. Re-read the ledger first and explicitly avoid the just-touched reorder/discoverability area.
2. Inspect `SessionTileWrapper` in `session-grid.tsx`, especially the effects that react to `isSingleVisibleTileFallback` and `isSparseWideGridLayout` changes.
3. Confirm those paths still forced `height: targetTileHeight` whenever session count temporarily changed the layout state, even if the tile had already diverged from the previous layout target via manual resizing.
4. Review the existing resize helper tests and source-contract tests to confirm there was no shared helper or explicit expectation for session-count-driven height preservation yet.

### UX problem found
- Temporary session-count transitions could still wipe out a deliberate manual tile height.
- This showed up in two local-but-frequent cases: when Compare/Grid briefly became a lone visible tile and when wide Grid crossed into or out of the sparse two-tile full-height row state.
- The reset made tiled sizing feel harder to predict because a user could resize on purpose, dismiss or complete a neighboring session, and still lose their preferred height even without intentionally changing layouts.

### Assumptions
- It is acceptable to keep retargeting width immediately for the lone-visible fallback while becoming more conservative only about height, because row footprint truthfulness matters for layout integrity whereas height is the axis users most often tune for reading comfort.
- It is acceptable to use the prior computed layout target height as the signal for whether a tile was still layout-driven, because the surrounding code already uses that same distinction for width- and container-driven reflow behavior.
- Source-backed tests plus desktop web typecheck are sufficient for this pass because the Electron renderer target was unavailable and the change stays local to renderer tiling behavior.

### Decision and rationale
- Keep the existing temporary layout transitions, but stop treating them as unconditional height resets.
- For both lone-visible fallback changes and sparse wide Grid changes, only retarget height when the current tile height still closely matches the previous layout-driven target.
- Continue retargeting lone-visible width immediately so the tile still expands or contracts to the truthful row width when visible-session count changes.
- This is better than the previous unconditional reset because it preserves clear user intent, and better than never retargeting because layout-driven tiles should still adapt automatically when the temporary layout state truly changes.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add `shouldRetargetTileHeightOnSessionCountChange(...)`, mirroring the existing conservative layout-driven height retarget rules used for other responsive reflow paths.
- Updated the same file so the lone-visible fallback effect now reuses the prior computed layout target height, always retargets width, and only reapplies `targetTileHeight` when the current height still appears layout-driven.
- Updated the same file so the sparse wide Grid effect now skips height resets when the tile has clearly diverged from the previous layout target.
- Updated `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new helper and the more conservative session-count-driven resize behavior.

### Verification
- Live inspection remained unavailable for this pass: `electron_execute` failed to connect to the current Electron renderer target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the current unconditional retargeting alone would avoid another helper and ref, but it would keep neighboring-session changes feeling like accidental height resets.
- Never retargeting height on these transitions would preserve more manual states, but it would also leave ordinary layout-driven tiles stranded at stale heights after temporary one-visible or sparse-grid transitions.
- Tracking a richer interaction history for resize intent could be more exact, but it would add broader state complexity where the existing prior-target comparison already provides a small, coherent heuristic.

### What still needs attention
- This should still be runtime-validated in the real desktop sessions surface, especially by manually resizing tile height and then changing visible session count through close/complete transitions in both Compare and Grid.
- A nearby follow-up could decide whether the same prior-target preservation rule should also apply to additional session-count-driven transitions beyond the lone-visible and sparse-wide cases if new resets show up in practice.
- Another adjacent resize thread is whether the UI should surface a clearer transient hint when width changes automatically but height is intentionally preserved, so users understand why only one axis moved.

## Iteration 94 - Show live width/height deltas while resizing the floating panel

### Area inspected
- `tiling-ux.md`, especially the latest session-grid resize and older floating-panel entries so this pass could move to a different, not-recently-touched local UX gap
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- lightweight live inspection attempt via `electron_execute`, which failed to connect to the current Electron target

### Repro steps reviewed
1. Re-read the ledger first and intentionally pivot away from the newest tile-density, drag, and session-grid height-preservation threads.
2. Inspect `PanelResizeWrapper` around the active helper hint, especially the current `width × height` feedback shown during drag.
3. Compare that feedback with the tiled-workflow use case where users are often resizing the floating panel specifically to reclaim or spend a known amount of horizontal room.
4. Attempt a lightweight live Electron probe before editing; because the target was not reachable, validate with focused source-backed tests instead.

### UX problem found
- While actively resizing the floating panel, the helper hint only exposed the resulting panel size (`width × height`), not how much width or height had actually changed since the drag began.
- That made the interaction slightly harder to judge in tiled workflows, because users are often making a relative decision (`give sessions ~100px back`, `make the panel a bit taller`) rather than aiming for an exact final panel size.
- The panel already surfaces shrink-to-min outcomes before drag begins, so the active-drag state felt like it lost some of that decision support at the exact moment the user was manipulating the size.

### Assumptions
- It is acceptable to add compact live delta badges only while a resize is active, because the user value is mid-drag predictability rather than more resting chrome.
- It is acceptable to derive deltas from the existing resize start size ref, because that is already the source of truth for the current drag gesture and avoids introducing new resize state.
- Focused source-backed verification is sufficient for this pass because the current Electron target was not reachable and the change stays renderer-local.

### Decision and rationale
- Keep the existing directional resize hint, live final size readout, and min-size constraint badges.
- Add compact `Width ±Npx` and/or `Height ±Npx` badges while resizing so the active hint shows both the current footprint and the relative change from where the drag started.
- Show only the axes that the active handle actually controls, so width-only drags stay compact and corner drags can show both deltas.
- This is better than replacing the existing size readout because users benefit from both pieces of information: current absolute size for precision, and relative delta for judging how much space they are reclaiming from or giving to tiled sessions.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add small helpers for signed resize deltas and axis-aware live delta labels.
- Updated the same file so active panel resize hints derive width/height deltas from `resizeStartSizeRef` and the active resize handle.
- Rendered compact blue delta badges in the active resize hint row, alongside the existing `width × height` readout and minimum-size badge.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the new helper functions, active-delta calculations, and live badge render path.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` failed to connect to the current Electron target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ⚠️ blocked by pre-existing unrelated `sessions.tsx` errors: `trailingReorderDropTargetIndex` used before declaration at lines 1300, 1317, and 1327.

### Tradeoffs considered
- Leaving the active hint unchanged would be the smallest code delta, but it would keep users translating absolute size into relative change by eye during a drag.
- Replacing the current `width × height` readout with deltas only would make change more obvious, but it would remove the precise final-size feedback that is still useful while resizing.
- Adding permanent resting-state delta chrome would make the behavior more explicit, but it would also add noise to a surface that already has hover hints, recovery tabs, and resize rails.

### What still needs attention
- This should still be runtime-validated on a real floating-panel-plus-tiled-sessions workflow to confirm the extra delta badges feel helpful rather than busy during repeated drags.
- If live use shows the active hint getting too wide during corner drags, a nearby follow-up could decide whether one axis should collapse to `W/H` shorthand on very compact panel sizes.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves mid-drag feedback, not when the app should proactively suggest or reclaim panel width.

## Iteration 95 - Remove duplicate Single view restore chrome on compact headers

### Area inspected
- `tiling-ux.md`, especially Iterations 91 and 94 so this pass could revisit an older maximize-vs-grid predictability thread instead of repeating the newest floating-panel work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which again failed because no inspectable Electron target was available

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose an older open focus-layout clarity thread.
2. Inspect the Single view header controls in `sessions.tsx`, especially the dedicated `Back to ...` button plus the already-highlighted restore target inside the layout button group.
3. Compare roomy, compact, and very-compact header states to see where that duplication costs the most horizontal room.
4. Attempt a live Electron check before editing; because no inspectable renderer target was available, validate the behavior with focused source-backed tests and typecheck.

### UX problem found
- In Single view, the header could show both a dedicated restore button and a separately highlighted restore target in the layout picker for the same action.
- That duplicated meaning, spent space on repeated chrome, and made compact Single view headers feel busier than necessary right next to browse arrows and panel-recovery actions.
- The duplication was most awkward on standard compact headers, where layout labels were still visible enough to communicate the restore target without needing a second button.

### Assumptions
- It is acceptable to keep an explicit dedicated restore button only where it still earns its space, because the user problem here is duplicate affordances rather than missing restore access.
- It is acceptable to rely on the existing layout-button restore target as the primary compact-header exit path, as long as that target becomes visually clearer when the separate button is hidden.
- It is acceptable to keep the dedicated restore button on very compact headers because those layout buttons can become icon-only there, making a separate `Back` affordance still useful.
- No mobile change is needed because this work is specific to the desktop tiled-sessions header; there is no equivalent mobile tiled layout control row to keep in sync.

### Decision and rationale
- Keep the existing Single view restore behavior and persistence rules unchanged.
- Hide the dedicated restore button on standard compact headers, where the labeled layout buttons already provide a clear return path.
- When that separate button is hidden, promote the remembered restore target inside the layout group with stronger blue emphasis and a compact `Back` badge.
- Keep the dedicated restore button on roomy headers and very compact headers, where it still improves clarity without the same density penalty.
- This is better than always showing both restore affordances because it removes redundant chrome, and better than removing the dedicated button everywhere because the very-compact icon-only case still benefits from an explicit way back.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showDedicatedSingleViewRestoreButton` so the separate restore button now yields on standard compact headers.
- Updated the same file so compact headers promote the remembered restore target inside the layout group with stronger blue styling and a short `Back` badge.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new restore-button gating, target-promotion path, and badge labeling.
- Refreshed one stale reorder-hint expectation in `sessions.layout-controls.test.ts` while touching the targeted verification file.

### Verification
- Live inspection remained unavailable for this pass: `electron_execute` reported that no inspectable Electron target was running.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the duplicate restore button and highlighted layout target together would avoid changing familiar chrome, but it would keep compact Single view headers busier than necessary.
- Removing the dedicated restore button everywhere would simplify the header further, but it would underserve very compact icon-only layout controls where an explicit `Back` affordance still helps.
- Keeping the dedicated restore button and removing the layout-target emphasis instead would preserve a more explicit button, but it would make the layout picker less self-explanatory and weaken direct layout switching.

### What still needs attention
- This should still be runtime-validated on a real desktop sessions surface, especially around the 620px to 760px compact-header range where the deduplication rule now changes.
- A nearby follow-up could decide whether the roomy-header case should also eventually collapse to a single restore affordance, or whether the extra dedicated button there still feels helpful in practice.
- Another adjacent maximize-vs-grid thread is whether switching directly between Compare and Grid after leaving Single view should preserve more user sizing intent when the layout footprint changes only modestly.

## Iteration 95 - Soften waiting queue chrome when compact tiles already have a stronger explanation

### Area inspected
- `tiling-ux.md`, specifically Iteration 90's open follow-up about whether ordinary waiting queue state should step back further when approval or transcript-preview cues are already visible in compact tiles
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which still failed to connect to a usable Electron target, so this pass stayed source- and test-validated

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the most recent panel-resize thread.
2. Inspect the compact tile footer logic in `agent-progress.tsx`, especially the inline queue-summary path used only when approval or transcript-preview hints already occupy the tile.
3. Compare the inline waiting summary with the paused summary and the collapsed-tile queue badge to see whether ordinary waiting queue chrome was still more attention-grabbing than it needed to be in already-crowded tiles.
4. Check the existing tile-layout source-contract test to confirm the current implementation still reused the same amber waiting treatment for both inline crowded states and collapsed queue badges.

### UX problem found
- In compact background tiles, the inline queue summary only appears when stronger explanations are already visible, but ordinary waiting state still used the same amber queue styling as more standalone queue surfaces.
- That made the footer pill compete more than necessary with approval and clipped-history cues in the exact narrow states where the UI is trying to preserve hierarchy.
- Paused queues still deserved stronger emphasis, and collapsed tiles still benefit from a clearer queue badge because they hide the inline explanations that make the crowded expanded state different.

### Assumptions
- It is acceptable to soften only the crowded inline waiting summary while leaving paused queue treatment alone, because paused remains the more urgent intervention state.
- It is acceptable to keep collapsed waiting queue badges stronger than the new inline waiting pill, because collapsed tiles hide the richer in-tile explanations and therefore still benefit from a more explicit queue cue.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the current Electron target was not reachable and the change stays renderer-local.

### Decision and rationale
- Split compact queue-summary styling into two local cases: a calmer inline waiting pill for the crowded expanded-tile footer, and the existing stronger badge treatment for collapsed/standalone queue cues.
- Keep paused inline and collapsed queue states visually strong so intervention-required queue status still stands out quickly.
- Soften only the inline waiting title copy too, from `pause or manage` to `manage`, because the crowded summary is now meant to preserve awareness rather than advertise secondary controls.
- This is better than hiding waiting queue state entirely because users still retain passive awareness, and better than leaving the amber styling everywhere because it reduces competition with more important tile explanations in narrow multitasking layouts.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to split the former shared compact queue-status class into `inlineCompactTileQueueStatusClassName` and `collapsedTileQueueStatusClassName`.
- Softened the inline waiting-state pill to a neutral border/background/text treatment while keeping paused inline state on the stronger orange treatment.
- Kept collapsed waiting badges on the stronger amber styling and adjusted the inline waiting tooltip copy to focus on queue management rather than pause affordances.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new split styling, softer waiting tooltip copy, and the distinction between inline crowded and collapsed queue cues.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` failed to connect to the current Electron target.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the amber waiting pill unchanged would avoid churn, but it would keep ordinary queue awareness competing too strongly with more urgent compact-tile explanations.
- Softening both inline and collapsed waiting states together would reduce color usage further, but it would also weaken queue visibility in collapsed tiles where fewer other cues remain visible.
- Removing the inline waiting summary entirely would create the calmest footer, but it would also make queued follow-ups too easy to miss during rapid multitasking.

### What still needs attention
- This should still be runtime-validated on a real tiled desktop sessions surface to confirm the calmer waiting pill remains noticeable enough when approval or transcript-preview explanations are already visible.
- A nearby follow-up could decide whether the inline waiting pill should also become slightly shorter on extremely narrow tiles (for example, a more compact label) if live use shows footer wrap pressure.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass focused on tile-internal hierarchy, not cross-pane space management.

## Iteration 96 - Keep compact panel-recovery actions quantitative until headers get truly tight

### Area inspected
- `tiling-ux.md`, especially Iterations 87, 89, 94, and 95 so this pass could pick up the still-open panel-versus-tiles allocation thread without repeating the newest tile-internal density work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which failed because no inspectable Electron target was available

### Repro steps reviewed
1. Re-read the latest ledger entries first and avoid the just-touched queue/footer thread.
2. Inspect the compact-header panel-recovery logic in `sessions.tsx`, especially where stacked/near-stacked recovery buttons decide whether to show `+Npx` width badges.
3. Compare the compact and very-compact header branches to see whether the current gating is removing too much guidance too early.
4. Attempt a live renderer check before editing; because no inspectable Electron target was available, validate the change with focused source-backed tests and web typecheck.

### UX problem found
- The sessions header already computes useful quantitative recovery labels like `+84px`, but it dropped them for every compact header, not just the truly space-starved ones.
- In the 620px–760px compact range, users could still see the recommended action styling, but they lost the concrete width comparison that helps explain why `Shrink panel` may be enough while `Hide panel` is the heavier fallback.
- That made panel-versus-tiles tradeoffs feel less legible exactly in the widths where the floating panel is most likely to be competing with Compare/Grid space.

### Assumptions
- It is acceptable for standard compact headers to keep short numeric badges because `+Npx` pills are materially smaller than the longer explanatory outcome chips already reserved for roomier headers.
- It is acceptable to keep hiding those badges on very compact headers because once the header crosses the tighter breakpoint, preserving action-label legibility matters more than keeping comparative width math visible.
- No store or behavior change is needed here because the underlying recovery prioritization already exists; the issue is information density, not decision logic.

### Decision and rationale
- Restore the existing `+Npx` recovery pills for compact compare/grid headers, but only until the header reaches the stricter `isVeryCompactSessionHeader` breakpoint.
- Keep the current very-compact behavior unchanged so the narrowest headers still prioritize short action labels over secondary quantitative chrome.
- This is better than leaving compact headers badge-free because it makes panel recovery more legible where there is still room, and better than showing the badges at every width because the narrowest state still needs stronger restraint.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `shrinkPanelForLayoutPressureRecoveryLabel` and `hidePanelForLayoutPressureRecoveryLabel` now stay visible until the header reaches the `isVeryCompactSessionHeader` threshold instead of disappearing for all compact headers.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new breakpoint rule and the continued render path for both recovery badges.

### Verification
- Live inspection remained unavailable for this pass: `electron_execute` reported no inspectable Electron target.
- `pnpm --filter @dotagents/desktop run pretest && pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts && pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the compact-header suppression untouched would keep the header slightly quieter, but it would continue hiding useful comparative feedback before space is actually exhausted.
- Restoring the longer outcome chips on compact headers too would make the recommendation more explicit, but it would add more width pressure than this pass needs and risks repeating the same density problem Iterations 90+ were trying to reduce.
- Showing `+Npx` badges even on very compact headers would maximize comparability, but it would make the tightest action rows more wrap-prone and visually noisy.

### What still needs attention
- This should still be runtime-validated on a real desktop tiled-sessions surface, especially around the compact-to-very-compact breakpoint where the numeric recovery pills now disappear later.
- A nearby follow-up could decide whether the promoted action in compact headers still needs a shorter explicit outcome badge (`Restore` / `Keep`) when the header is too tight for the roomy explanatory pill but still wide enough for one small semantic cue.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves compact recovery legibility, not when the app should proactively suggest or reclaim panel width.

## Iteration 97 - Give very compact panel-recovery actions a tiny semantic outcome cue

### Area inspected
- `tiling-ux.md`, especially Iteration 96 so this pass could continue an open compact-header panel-recovery thread without repeating the just-finished quantitative-badge work.
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which again failed because no inspectable Electron target was available.

### Repro steps reviewed
1. Re-read the ledger first and deliberately pick the explicit open follow-up from Iteration 96 rather than a newer unrelated tile-density thread.
2. Inspect the compact-header panel-recovery button logic in `sessions.tsx`, especially the branch where roomy headers show `Restores ...` / `Keeps ...` pills, compact headers fall back to `+Npx`, and very compact headers drop both.
3. Compare the promoted shrink/hide action path with the secondary action path to see what meaning survives once the very-compact breakpoint removes width badges.
4. Attempt a live Electron inspection before editing; because no inspectable renderer target was available, validate with focused source-backed tests and desktop web typecheck.

### UX problem found
- The previous iteration intentionally kept `+Npx` recovery badges on standard compact headers, but once the header crossed into the very-compact breakpoint the prioritized action lost both the roomy semantic outcome pill and the numeric recovery badge.
- That left the promoted button visually stronger than its sibling, but not more self-explanatory: users could still see `Shrink` or `Hide`, yet they lost the quick answer to whether that action would restore the layout or merely help a little.
- The ambiguity was most noticeable in narrow compare/grid states where the app is already trying to steer users toward the better panel-recovery action.

### Assumptions
- It is acceptable to add a tiny semantic cue only on the prioritized very-compact action, because standard compact headers already regained quantitative `+Npx` guidance in Iteration 96 and do not need more chrome.
- It is acceptable to reuse the existing promoted-outcome badge styling for a short `Restore` / `Keep` label, because that keeps the new cue visually consistent with the roomy-header outcome pills while staying materially smaller.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the current Electron target was not reachable and the change stays renderer-local.

### Decision and rationale
- Keep the roomy-header `Restores ...` / `Keeps ...` outcome pills unchanged.
- Keep the compact-header `+Npx` width badges unchanged where they still fit.
- Add a tiny `Restore` or `Keep` badge only when the header reaches the very-compact breakpoint and the action is already the prioritized panel-recovery option.
- This is better than leaving the very-compact promoted action badge-free because it restores the missing semantic guidance, and better than forcing `+Npx` math back into the narrowest headers because the shorter cue is more predictable without reintroducing wrap pressure.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `compactPrioritizedLayoutPressureOutcomeLabel` and a shared `layoutPressureOutcomeBadgeLabel` for panel-recovery actions.
- Updated the same file so prioritized `Shrink` / `Hide` actions reuse the existing blue outcome badge slot for a short `Restore` / `Keep` label when the header is very compact and the roomy/quantitative badge paths are unavailable.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new very-compact semantic badge path and the shared badge-label render logic.

### Verification
- Live inspection remained unavailable for this pass: `electron_execute` reported that no inspectable Electron target was running.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving very-compact promoted actions badge-free would avoid any width increase, but it would keep the most important recovery action underspecified right when other guidance has already been stripped away.
- Restoring `+Npx` badges on very-compact headers too would preserve consistency with the wider compact state, but those numeric pills were removed for a reason and are more likely to crowd the narrowest action rows.
- Replacing the action label itself with `Restore` / `Keep` would surface the outcome more directly, but it would weaken the concrete action verb (`Shrink` / `Hide`) that tells users what will actually happen.

### What still needs attention
- This should still be runtime-validated on a real desktop tiled-sessions surface, especially below the `TIGHT_SESSION_HEADER_WIDTH` breakpoint to confirm the extra tiny badge clarifies the promoted action without making the row feel cramped.
- A nearby follow-up could decide whether the secondary very-compact action now deserves an even calmer treatment when one option is clearly promoted, or whether the current symmetry still feels easier to scan.
- The broader floating-panel versus tiled-session allocation problem remains open; this pass improves very-compact action clarity, not when the app should proactively suggest or reclaim panel width.

## Iteration 97 - Keep tile resize feedback informative after the drag begins

### Area inspected
- `tiling-ux.md`, especially the latest header, queue-density, and panel-resize entries so this pass could return to tile resizing without repeating the most recent work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- Lightweight live inspection attempt via `electron_reset`, which confirmed there was no inspectable Electron target available for this pass

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose a tiled-session resize-affordance thread that had not been investigated recently.
2. Inspect `session-grid.tsx` to compare the resting resize rails, hover hints, and locked-width explanation against the active-drag state.
3. Inspect `use-resizable.ts` to confirm what live width/height data already exists during drag and whether a local handle-specific hint could be derived without a broader refactor.
4. Attempt a lightweight Electron connection before editing; because no inspectable target was available, validate the change with targeted tests and renderer typecheck.

### UX problem found
- Tiles already show helpful resize rails and hover labels before drag starts, but once resizing begins the feedback stays generic instead of telling the user what footprint they are actively shaping.
- That makes it harder to stop at a predictable tile size, especially in Compare and Grid states where small manual width or height changes noticeably affect density and empty space.
- The floating panel recently gained richer active resize feedback, so tile resizing now felt comparatively less informative during the moment of interaction.

### Assumptions
- It is acceptable to add live size labels only while a resize is active, because the user value is mid-drag predictability rather than more resting chrome.
- It is acceptable to track the active tile resize handle locally inside `SessionTileWrapper`, because `use-resizable` already provides the live width and height preview and only the hint presentation needs to know which axis the user grabbed.
- No mobile change is needed because the mobile app does not expose an equivalent tiled desktop resize surface.

### Decision and rationale
- Keep the existing resize rails, grab targets, locked-width explanation, and hover discoverability unchanged.
- Promote the hint attached to the active resize handle into a persistent live readout once drag begins.
- Make the live copy axis-aware: width drags show `Width · Npx`, height drags show `Height · Npx` or `Height only · Npx`, and corner drags show the full `Wpx × Hpx` footprint.
- Give the active hint the same blue emphasis already used elsewhere for active resize feedback so it reads as an in-progress state rather than a passive tooltip.
- This is better than adding permanent extra chrome because it improves the exact moment of uncertainty, and better than leaving the hint generic because it reduces guesswork without changing tile layout behavior.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add `getActiveTileResizeHintLabel(...)` for compact live width/height readouts during tile resizing.
- Updated the same file so `SessionTileWrapper` tracks which resize handle is active, clears that state when resizing ends, and swaps the generic hover hint for a persistent live measurement label while the drag is in progress.
- Added active blue emphasis to the live resize hint so it stays visible even after the pointer moves away from the original hover hotspot during drag.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to lock in the new live hint labels.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to cover the active resize-hint helper, per-handle state wiring, and render path changes.

### Verification
- Live inspection was unavailable for this pass: `electron_reset` reported that no inspectable Electron target was running.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the existing resize hints unchanged would be the smallest code delta, but it would keep users estimating tile size by eye after drag begins.
- Adding a permanent size badge near every resize handle would make resizing more explicit, but it would add resting chrome to already busy tiles and work against the broader density goals in this ledger.
- Showing relative deltas instead of live size would also help, but absolute size is the more immediately useful signal for tiles because users often want consistent heights or widths across sessions.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the live labels feel helpful rather than distracting during repeated resize gestures.
- A nearby follow-up could decide whether tile resizing should also expose a relative delta badge, similar to the floating panel, if live use suggests users care more about change amount than final footprint.
- Another adjacent resize thread is whether very narrow stacked layouts should surface a stronger explanation for why corner resize is unavailable once width is layout-locked and only height remains adjustable.

## Iteration 98 - Keep the missing corner resize hotspot self-explanatory when width is locked

### Area inspected
- `tiling-ux.md`, especially Iteration 97's open follow-up about very narrow stacked layouts and missing corner-resize clarity
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which failed because no inspectable Electron target was running

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the explicit open resize-affordance follow-up from Iteration 97 instead of revisiting header or panel work.
2. Inspect the width-locked tile path in `session-grid.tsx`, especially the branch where right-edge and corner resize handles disappear and only the bottom-edge height handle remains.
3. Compare the width-lock hint, bottom-edge title/label, and missing corner state to see how clearly the UI still explained what could be resized.
4. Attempt a lightweight Electron inspection before editing; because no inspectable target was available, validate with focused source-backed tests and desktop web typecheck.

### UX problem found
- When tiles enter Single view, one-visible fallback, or stacked narrow layouts, width resizing correctly locks and the right-edge lock hint stays available.
- But the familiar bottom-right corner resize hotspot disappeared entirely, leaving users to infer that only height remained resizable from the bottom edge alone.
- In practice that made the interaction feel less predictable in the exact narrow states where users are already adapting to layout pressure and changing affordances.

### Assumptions
- It is acceptable to keep a non-interactive visual corner cue in width-locked states, because the user problem is discoverability and explanation rather than restoring forbidden width resizing.
- It is acceptable to reuse the existing width-lock reasons and tighten their title copy so they explicitly mention the bottom-edge height path, because this preserves the current layout model instead of adding new controls.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the current Electron target was not reachable and the change stays renderer-local.

### Decision and rationale
- Keep width-lock behavior itself unchanged: width still remains fixed in Single view, single-visible fallback, and responsive stacked layouts.
- Add a small blocked corner cue back into the bottom-right hotspot whenever width is locked so the missing corner affordance reads as intentionally unavailable rather than absent by accident.
- Pair that cue with a short `Width fixed` hover/focus hint while keeping the existing bottom-edge `Resize height only` path.
- Update width-lock explanatory titles to explicitly say `Drag the bottom edge to resize height`, so both the right-side lock rail and the bottom-edge resize handle explain the new interaction model.
- This is better than re-enabling corner drag in locked states because that would fight the layout rules, and better than leaving only the bottom-edge handle because it reduces ambiguity at the tile's most familiar resize hotspot.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `getTileWidthLockHint(...)` titles now explicitly point users to the bottom-edge height resize path when width is layout-locked.
- Updated the same file to add a non-interactive dashed blocked-corner cue plus a compact `Width fixed` hint in the bottom-right hotspot whenever width resizing is unavailable.
- Kept the existing bottom-edge resize control and active resize feedback intact; this pass only improves resting-state explanation and hotspot continuity.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the blocked-corner cue, hint label, and stronger width-lock guidance.
- Updated `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` so the width-lock helper contract now covers the new bottom-edge guidance copy.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` returned `No Electron targets found. Make sure your Electron app is running with --inspect=9222 flag.`
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the current width-lock state unchanged would avoid extra chrome, but it would keep the missing corner hotspot underexplained in narrow tiled layouts.
- Re-enabling a draggable corner while silently clamping width would preserve a familiar gesture, but it would make resize behavior feel misleading because width still cannot actually change.
- Moving all explanation into longer bottom-edge copy alone would improve titles, but it would still leave the missing bottom-right hotspot visually unexplained before hover.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the blocked corner cue clarifies the interaction without feeling like a broken control.
- A nearby follow-up could decide whether the `Width fixed` hint should become even more context-specific (`Stacked width`, `Single view width`) if live use suggests the generic label is not explanatory enough.
- Another adjacent thread is whether extremely narrow stacked tiles should also compress the bottom-edge `Resize height only` hint copy further if hover labels begin to crowd dense tile content.

## Iteration 98 - Preserve manual tile height when Compare and Grid keep the same footprint

### Area inspected
- `tiling-ux.md`, especially the older open note in Iteration 95 about whether Compare and Grid should preserve more user sizing intent when switching away from Single view without a major footprint change
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- Lightweight live inspection attempt via `electron_execute`, which failed because no inspectable Electron target was running

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the most recent resize-affordance thread.
2. Inspect `SessionTileWrapper`'s layout-change effect in `session-grid.tsx`, especially how it preserves manual width across Compare/Grid switches but still retargets height unconditionally.
3. Compare that behavior against `calculateTileHeight(...)` and `shouldUseSparseWideGridHeight(...)` to find cases where Compare and Grid already resolve to the same effective tile height.
4. Attempt a lightweight Electron inspection before editing; because no inspectable target was available, validate the change with targeted tests and renderer typecheck.

### UX problem found
- Compare and Grid can already share the same effective tile height in a few common situations, including wide two-session layouts, narrow stacked layouts, and temporary one-visible-session states.
- Even in those footprint-equivalent states, switching between Compare and Grid still reset tile height to the layout target, which wiped out a user's deliberate height choice for no visible layout benefit.
- That made layout switching feel more destructive than necessary and undermined the goal of predictable maximized-vs-grid and compare-vs-grid transitions.

### Assumptions
- It is acceptable to preserve manual height only when the previous and next layout targets are effectively the same, because that protects user intent without hiding meaningful layout changes.
- It is acceptable to keep Single view transitions unchanged, because Single view still represents a deliberate full-footprint mode switch with its own restore behavior.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the Electron target was not reachable and the change stays renderer-local.

### Decision and rationale
- Add a local `shouldPreserveTileHeightOnLayoutChange(...)` helper alongside the existing width-preservation helper.
- Preserve manual height on Compare↔Grid switches only when the computed previous and next target heights are equal within the existing layout-driven tolerance.
- Keep retargeting height for real footprint changes, such as switching into ordinary multi-row Grid or entering/leaving Single view.
- This is better than always preserving height because actual layout changes should still feel truthful, and better than always resetting height because equal-footprint switches should not discard a user's sizing preference.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to export `shouldPreserveTileHeightOnLayoutChange(...)`, derived from the existing tile-height calculation rules.
- Updated the same file so `SessionTileWrapper` now preserves height during layout switches when Compare and Grid keep the same effective tile height, while still restoring captured Single view height and retargeting real footprint changes.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to cover the new height-preservation decision across wide, narrow, one-visible, and true multi-row grid cases.
- Updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` so the source-contract coverage reflects the new width-and-height preservation path.

### Verification
- Live inspection was unavailable for this pass: `electron_execute` returned `No Electron targets found. Make sure your Electron app is running with --inspect=9222 flag.`
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving height resets unchanged would avoid new branching, but it would keep layout switching needlessly destructive in equal-footprint states.
- Preserving height across every Compare↔Grid switch would reduce resets further, but it would also keep stale manual heights when Grid genuinely needs a denser half-height layout.
- Reworking all layout-change size logic into a broader abstraction would centralize the rules, but it would be a larger refactor than this local UX problem requires.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm that Compare↔Grid switches now feel smoother when two sessions are visible or when the layout is stacked by width pressure.
- A nearby follow-up could decide whether width and height preservation rules should also consider direct sidebar-width changes that alter layout mode labels without materially changing the rendered footprint.
- Another adjacent thread is whether width-locked stacked layouts should explain corner-resize unavailability more explicitly now that active resize feedback is stronger elsewhere.

## Iteration 99 - Quantify how much width stacked and near-stacked layouts still need

### Area inspected
- `tiling-ux.md`, especially Iterations 96, 97, and 98 so this pass could stay on the broader panel-versus-tiles allocation thread without repeating the most recent tile-size preservation work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- Lightweight live renderer inspection via `electron_execute`; an inspectable renderer was available, but it was currently on the app root surface rather than the tiled sessions page, so this pass could not visually confirm the new sessions-header chips without mutating the running UI state

### Repro steps reviewed
1. Re-read the ledger first and deliberately avoid the most recent tile-internal density and height-preservation threads.
2. Inspect the stacked / near-stacked header logic in `sessions.tsx`, especially where passive hint chips already explain `Make room` or `Tight fit` while panel-recovery buttons optionally show `+Npx` only when the floating panel is the recovery lever.
3. Inspect `session-grid.tsx` to confirm the exact responsive stacking threshold, so any new cue would reuse the same layout math instead of inventing a new breakpoint.
4. Run focused tests and renderer typecheck after the change; use live inspection only as a supplemental signal because the reachable renderer target was not already on the sessions surface.

### UX problem found
- The sessions header already told users when Compare or Grid had stacked, or when they were close to stacking, but the passive hint chips still lacked a compact answer to the natural follow-up question: how much room is missing?
- Panel recovery buttons partially solved that by showing `+Npx`, but only when the floating panel was visible and part of the fix.
- When the panel was already hidden, already at minimum width, or simply not the dominant cause, the remaining guidance stayed qualitative (`Make room`, `Tight fit`) instead of helping users judge whether a small sidebar/window change would be enough.

### Assumptions
- It is acceptable to derive the new width-gap cue from the same minimum-two-column threshold already used by `isResponsiveStackedTileLayout(...)`, because this keeps the new feedback truthful to the actual layout rules.
- It is acceptable for near-stacked warnings to use the existing warning buffer in that same calculation, because the user value is knowing roughly how much extra width clears the warning rather than only how much avoids immediate stacking.
- It is acceptable to suppress the new badge on very compact headers, because that breakpoint already intentionally trims secondary chrome to keep primary controls legible.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the live inspectable renderer was not already on the sessions surface and the change stays renderer-local.

### Decision and rationale
- Add a small width-gap badge to the passive stacked and near-stacked header chips whenever those chips are visible and the header is not at the very-compact breakpoint.
- Keep the existing `Make room` / `Tight fit` labels and the existing panel-recovery actions unchanged.
- Reuse the sessions layout math to show `Need Npx` rather than a new semantic guess, so the cue stays consistent across sidebar-width changes, window-width changes, and panel visibility differences.
- This is better than leaving the passive chips qualitative because it makes window/sidebar tradeoffs more predictable even when no panel action applies, and better than adding a new control because it improves clarity without expanding the sessions header interaction model.

### Code changes
- Added `getResponsiveStackedLayoutWidthShortfall(...)` to `apps/desktop/src/renderer/src/components/session-grid.tsx` so the missing-width calculation reuses the same responsive two-column threshold as the grid itself.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive stacked and near-stacked width-gap labels from that helper, including the existing near-stacked warning buffer.
- Updated the passive stacked and near-stacked sessions-header chips to render a compact `Need Npx` badge in standard and compact headers while keeping very compact headers unchanged.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to lock in the shared shortfall helper behavior.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new width-gap chip wiring.
- While verifying, updated stale width-lock title expectations in `session-grid.narrow-layout.test.ts` so the test matches the current source contract introduced by the earlier blocked-corner resize-affordance pass.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` could reach a renderer target, but it was on `http://127.0.0.1:19007/` at the app root surface rather than the tiled sessions view, so the new sessions-header chips were not directly runtime-validated.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the passive chips qualitative would avoid extra header chrome, but it would keep width pressure vague whenever the floating panel is not the recovery path.
- Reusing the panel-style `+Npx` badge on passive chips would be shorter, but it would read more like recovered width than missing width; `Need Npx` is slightly longer but more self-explanatory.
- Showing the new badge on very compact headers too would maximize consistency, but it would reintroduce the same density pressure the header-breakpoint work was intentionally reducing.
- Adding a one-click sidebar or window-management action would be more forceful, but it would be a broader product decision than this local clarity improvement needs.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the new `Need Npx` badges feel helpful rather than overly numeric in day-to-day use.
- A nearby follow-up could decide whether the passive width-gap badge should become even shorter in compact headers when an adjacent action row is also present, or whether the current explicit wording is the better tradeoff.
- Another adjacent thread is whether the sessions header should eventually distinguish between width needed to restore columns and width needed to regain a more comfortable tile density, if future layout rules become more nuanced than the current two-column threshold plus warning buffer.

## Iteration 99 - Let width-locked tiles keep the old corner target useful for height resizing

### Area inspected
- `tiling-ux.md`, especially Iterations 97 and 98 so this pass could return to tile-resize clarity without repeating the most recent height-preservation work
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- Lightweight live inspection attempt via `electron_reset` + `electron_execute`; an inspectable renderer existed, but it was sitting on a `chrome-error://chromewebdata/` localhost-refused page instead of a usable sessions surface

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the still-open width-locked resize thread called out at the end of Iteration 98.
2. Inspect `SessionTileWrapper` to compare the crossed-out bottom-right corner treatment, the right-side width-lock explanation, and the remaining bottom-edge height handle.
3. Check whether the width-locked state only explains why corner resize is unavailable, or also helps users succeed when they still aim near the old bottom-right target.
4. Attempt a lightweight live renderer inspection before editing; because the connected renderer was on a localhost error page rather than the sessions UI, validate the change with focused source-backed tests and desktop web typecheck.

### UX problem found
- Width-locked tiles already showed a dashed right rail, a crossed-out corner, and copy about dragging the bottom edge, but the explanation still leaned more on why width was locked than on helping the user recover from the lost corner affordance.
- The remaining height-only handle still stopped short of the bottom-right corner, so users aiming where diagonal resize usually lives could hit explanation chrome instead of the still-valid height resize path.
- That made stacked and temporary full-width tile states feel more disabled than they needed to, even though height resizing remained available.

### Assumptions
- It is acceptable to let the height-only drag target extend under the locked corner indicator, because the corner is purely explanatory in this state and the remaining useful action is vertical resize.
- It is acceptable to make the width-lock copy explicitly mention that corner resize is unavailable, because the ambiguity is about the missing two-axis affordance rather than the layout rule itself.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the available Electron target was not on a runnable sessions surface.

### Decision and rationale
- Keep the existing width-lock rail and crossed-out corner icon so the UI still explains that width follows layout.
- Make the width-lock titles say `Corner resize is unavailable here...` so the disabled affordance is named directly instead of being implied.
- Change the tiny corner hint from a passive `Width fixed` label to the more actionable `Use bottom edge`.
- Extend the bottom-edge height resize hit target into the bottom-right area when width is locked so users who still aim near the old corner affordance now succeed instead of missing the only remaining resize path.
- This is better than adding more permanent chrome because it improves the interaction itself, and better than leaving the dead-ish corner gap alone because it reduces relearning cost in stacked and single-visible fallback states.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so all width-locked resize titles now explicitly explain that corner resize is unavailable and direct users to the bottom edge.
- Updated the same file so the locked bottom-right hint now says `Use bottom edge` instead of only restating that width is fixed.
- Updated the same file so the bottom-edge height resize handle expands farther right when width is locked, letting near-corner drags still resize height.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the new copy and the width-locked bottom-handle hit-target expansion.

### Verification
- Live inspection was only partially available for this pass: `electron_reset` connected to a renderer target, but `electron_execute` showed `chrome-error://chromewebdata/` with `ERR_CONNECTION_REFUSED` instead of the sessions UI.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the current width-locked copy alone would avoid churn, but it would keep the bottom-right state more explanatory than recoverable.
- Adding a brand-new dedicated `height only` badge near the corner would increase clarity, but it would also add more always-visible chrome to already constrained tiles.
- Removing the locked corner indicator entirely and simply letting the larger bottom handle take over would improve success rate, but it would hide why two-axis resize disappeared and make the behavior feel inconsistent.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm that extending the height handle into the bottom-right zone feels intuitive and does not create accidental drags.
- A nearby follow-up could decide whether width-locked tiles should also get a short active drag delta or live height badge near the bottom-right corner itself, mirroring the richer active feedback elsewhere.
- Another adjacent resize thread is whether direct sidebar-width changes should surface a calmer transient cue when they cause a previously resizable compare/grid layout to become width-locked.

## Iteration 100 - Keep the compact reorder hint understandable instead of icon-only

### Area inspected
- `tiling-ux.md`, especially the older drag/reorder iterations so this pass could revisit discoverability without repeating the newest resize-heavy work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Lightweight live inspection via `electron_execute`; a renderer target was available, but it was on the app root/settings surface rather than the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid another resize-only pass.
2. Inspect the sessions header meta row in `sessions.tsx`, especially `showReorderHint`, `reorderHintTitle`, and `reorderHintLabel` across compact breakpoints.
3. Compare that behavior with the existing source-contract tests covering layout controls and drag affordances.
4. Probe the running renderer before updating the ledger; because the reachable surface was not the tiled sessions view, validate with targeted tests instead of pretending to visually confirm the exact header state.

### UX problem found
- The global reorder hint stayed visible in very compact tiled-session headers, but it collapsed to a grip icon with no text.
- In that state the chip read more like decorative chrome than actionable guidance, especially compared with nearby compact chips that still keep a short semantic label.
- That weakened drag/reorder discoverability exactly when header density was already making layout controls harder to parse.

### Assumptions
- It is acceptable to spend a few more pixels on a tiny verb in the tightest header state, because the sessions header already splits rows under pressure and the user value is reducing ambiguity rather than minimizing chrome at all costs.
- It is acceptable to use a shorter label than the normal compact `Reorder` copy, because the main goal at this breakpoint is recognizability, not full instruction text.
- Targeted source-backed tests are sufficient here because the change is renderer-local and the reachable Electron surface was not the actual tiled sessions workflow.

### Decision and rationale
- Keep the existing dashed reorder hint chip and full hover title unchanged.
- Change the very-compact label from `null` to `Move`, while preserving `Reorder` for compact headers and `Drag or use arrows` for roomier ones.
- This is better than leaving the chip icon-only because it restores meaning at a glance, and better than using the longer `Reorder` label everywhere because the tighter breakpoint still benefits from a shorter word.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the very-compact reorder hint now renders `Move` instead of collapsing to icon-only chrome.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new very-compact reorder label contract.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` so the layout-header coverage now expects the compact `Move` label at the tightest breakpoint.

### Verification
- `electron_execute` could reach a live renderer target, but it was on `http://localhost:19007/` at the app root/settings surface rather than the tiled sessions page, so this pass was not visually confirmed in the exact workflow.
- `pnpm vitest --run apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the icon-only chip unchanged would keep the header slightly smaller, but it would preserve an avoidable clarity gap.
- Reusing the longer `Reorder` label for the tightest breakpoint would be more explicit, but it would spend more width than necessary in the highest-pressure header state.
- Removing the hint entirely at the very-compact breakpoint would reduce chrome further, but it would make reorder discovery depend too heavily on noticing per-tile handles alone.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm that `Move` is the right compact word and does not feel too generic beside nearby layout and panel chips.
- A nearby follow-up could decide whether the sessions header should also keep a similarly compact textual reorder cue in responsive stacked layouts once higher-priority width-pressure guidance is already understood.
- Another adjacent thread is whether reorder success announcements should eventually include a destination neighbor label in addition to the numeric position for even clearer post-move confirmation.

## Iteration 101 - Let promoted panel recovery actions replace redundant stacked hint chips on roomy headers

### Area inspected
- `tiling-ux.md`, especially Iterations 99 and 100 so this pass could return to sessions-header layout-pressure clarity without repeating the most recent reorder-label work
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was on the app root/settings surface rather than the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid another reorder or tile-resize pass.
2. Inspect the sessions-header layout-pressure logic in `sessions.tsx`, especially how stacked layouts can render both a passive dashed `Make room` chip and promoted panel recovery actions with explicit `Restores…` outcome badges.
3. Compare that behavior with the nearby near-stacked suppression path, which already hides the passive warning chip on roomy headers once a promoted action explains how to avoid stacking.
4. Probe the live renderer before editing; because the reachable target was the app root/settings surface instead of the tiled sessions workflow, validate with focused source-backed tests and renderer typecheck.

### UX problem found
- Roomy stacked compare/grid headers could show a passive `Make room...` chip even when a promoted panel action already told the user exactly what would happen, such as `Restores side by side` or `Restores columns`.
- That duplicated the same recovery story across multiple pieces of chrome and made the header feel busier than the nearby near-stacked state, which already prefers the promoted action over the passive chip.
- In practice the extra chip diluted the stronger recommendation instead of helping users choose the best next step.

### Assumptions
- It is acceptable to mirror the existing near-stacked suppression pattern for fully stacked states, because the same principle applies: once a promoted action clearly explains the recovery outcome, the passive chip becomes redundant.
- It is acceptable to keep the passive stacked chip in compact headers or whenever no promoted action explains the result, because those cases still benefit from the extra context.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron surface was not the actual tiled sessions workflow.

### Decision and rationale
- Add a `shouldHidePassiveStackedLayoutRecoveryHint` guard that mirrors the existing near-stacked suppression behavior.
- Hide the passive stacked hint only on roomy headers and only when a promoted shrink/hide panel action already carries the recovery explanation.
- Keep all recovery math, labels, actions, and compact-header behavior unchanged.
- This is better than leaving the duplicate chip in place because it reduces header noise without removing useful guidance, and better than hiding the chip unconditionally because non-promoted cases still need passive context.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so roomy stacked headers now suppress the passive dashed recovery chip when a promoted panel action already explains that it restores side-by-side compare or grid columns.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new stacked-chip suppression contract alongside the existing near-stacked behavior.

### Verification
- `electron_execute` reached a live renderer target, but it was on `http://localhost:19007/` at the app root/settings surface rather than the tiled sessions page, so this pass was not visually confirmed in the exact workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the passive stacked chip visible everywhere would preserve more explicit status context, but it would keep duplicating the promoted recovery explanation on roomy headers.
- Hiding the stacked chip whenever any panel action exists would over-prune guidance, because secondary or non-promoted actions do not always explain the most useful outcome clearly enough.
- Reworking the whole header into a larger priority system would centralize the rules, but it would be a bigger refactor than this local redundancy fix requires.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm that removing the redundant stacked chip makes the promoted recovery action feel clearer rather than too abrupt.
- A nearby follow-up could decide whether the panel-min-width chip should also collapse more aggressively once hiding the panel is the only meaningful remaining action.
- Another adjacent thread is whether reorder success announcements should include destination-neighbor context now that the compact reorder hint itself is more understandable.

## Iteration 102 - Surface a calm transition cue when Compare/Grid suddenly lose width resizing

### Area inspected
- `tiling-ux.md`, especially Iteration 99's width-gap work, Iteration 101's stacked-header simplification, and the still-open note about sidebar-width changes silently making Compare/Grid width-locked
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Lightweight live inspection via `electron_execute`; a renderer target was reachable, but it was on the app root/settings surface rather than the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the explicit open width-lock transition thread instead of repeating the newest panel-recovery cleanup work.
2. Inspect `sessions.tsx`, especially the existing stacked / near-stacked passive chips, compact-header breakpoints, and `isResponsiveStackedLayout` measurement flow.
3. Compare what users currently learn when the sessions area narrows enough to stack: the ongoing `Make room` state is visible, but the moment width resizing disappears is not explicitly surfaced.
4. Probe the running renderer before editing; because the reachable target was the app root/settings surface instead of tiled sessions, validate the local change with focused source-backed tests and renderer typecheck.

### UX problem found
- The sessions header already explains the steady-state stacked condition, but it does not explicitly acknowledge the transition moment when Compare or Grid stops allowing width resize because the available width collapsed into a stacked layout.
- During sidebar or window width changes, that can make the interaction feel slightly silent: the layout stacks, the corner/right-edge affordances change, and users are left to infer why width resize no longer behaves the same.
- The persistent stacked chip helps after the fact, but it is calmer status context than a transition explanation, so the loss of manual width control can still feel abrupt.

### Assumptions
- It is acceptable to solve this with a brief sessions-header cue instead of new permanent chrome inside every tile, because the confusion is about a layout-level transition rather than a per-tile control model.
- It is acceptable for the cue to appear on any post-measurement transition into responsive stacked Compare/Grid, including layout switches made while already narrow, because the user value is the same: explaining that width now follows layout and height remains adjustable.
- Focused source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface was not the actual tiled sessions workflow.

### Decision and rationale
- Add a short-lived, calm header cue whenever Compare or Grid newly enter the responsive stacked state after initial measurement.
- Keep the existing passive stacked / near-stacked chips and panel-recovery actions unchanged; the new cue is additive only at the transition moment, then self-clears.
- Phrase the cue around the new rule (`Width follows stacked layout` / compact `Width fixed`) and the remaining successful action (`Use bottom edge` / compact `Bottom edge`).
- This is better than doing nothing because it reduces the feeling of a silent affordance change, and better than a permanent extra chip because the ongoing stacked state is already covered by existing header context.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track a brief `recentWidthLockHintLayoutMode` state with timeout cleanup, driven by a false-to-true transition in `isResponsiveStackedLayout` after initial measurement.
- Added a helper title so Compare and Grid can explain the same transition in layout-specific language without duplicating render logic.
- Added a transient header `status` chip that briefly appears in stacked Compare/Grid states with `Width follows stacked layout` / `Width fixed` plus `Use bottom edge` / `Bottom edge` at larger compact widths.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new transition-cue logic and to refresh the older compact-header meta expectation now that this chip is part of the header state model.

### Verification
- `electron_execute` could reach a live renderer target, but it was on `http://127.0.0.1:19007/` at the app root/settings surface rather than the tiled sessions page, so this pass was not visually confirmed in the exact workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the existing stacked chip alone would avoid any new state, but it would keep the width-lock transition mostly implicit.
- Adding a permanent width-lock badge would be more explicit, but it would add lasting header chrome for a problem that is strongest only at the moment of change.
- Solving this only inside tile-level resize affordances would help after users inspect a tile, but it would not explain the layout-level transition as clearly as a single header cue.

### What still needs attention
- This should still be runtime-validated during an actual sidebar/window resize on the tiled sessions surface to confirm the transient cue feels helpful rather than noisy.
- A nearby follow-up could decide whether width becoming resizable again after widening the sessions area also deserves a tiny transient confirmation, or whether regaining the visible handles is already self-explanatory enough.
- Another adjacent thread is whether the cue should eventually distinguish between container-width-driven transitions and explicit user layout switches made while already narrow, if real usage suggests those moments feel meaningfully different.

## Iteration 103 - Let hide-panel recovery absorb the minimum-width explanation on roomier headers

### Area inspected
- `tiling-ux.md`, especially the open follow-up note at the end of Iteration 101 about whether the panel-min-width chip should collapse more aggressively once hiding the panel is the only meaningful remaining action
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was on the root `Chats` surface instead of the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay adjacent to the latest panel-recovery work without repeating the stacked-chip suppression change itself.
2. Inspect the `showPanelAtMinimumWidthLayoutPressureHint` path in `sessions.tsx`, especially how it interacts with `showHidePanelForLayoutPressure`, `hidePanelForLayoutPressureOnlyRemainingActionDetail`, and compact-header row splitting.
3. Check whether the passive `Panel already at minimum width` chip still adds unique value on headers where the visible `Hide panel` action already explains the only remaining recovery path.
4. Do a lightweight live renderer probe before editing; because the reachable target was not the sessions workflow, validate with focused source-backed tests and renderer typecheck.

### UX problem found
- Once the floating panel was already at minimum width, roomier tiled-session headers could still render a passive `Panel already at minimum width` chip while also showing a visible `Hide panel` action.
- In that state the chip mostly repeated what the action title already explained: shrinking is no longer available and hiding the panel is the remaining way to recover width.
- The extra chip added header noise in an area that is already under density pressure during stacked or near-stacked tiled workflows.

### Assumptions
- It is acceptable to keep the passive minimum-width chip only in the very-compact header state, because that is where the visible action labels are shortest and the extra context still earns its space.
- It is acceptable to let the hide-panel button title carry the fuller explanation on roomier headers, because the action is already present and explicitly describes that it is the only remaining panel recovery option.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron surface was not the actual tiled sessions page and the change stays renderer-local.

### Decision and rationale
- Add a `showPassivePanelAtMinimumWidthLayoutPressureHint` gate that only keeps the passive chip in the very-compact header state.
- Reuse that same gate for `hasCompactSessionHeaderMeta` so compact headers do not split rows to make space for a chip that is no longer rendered.
- Keep the existing hide-panel action, minimum-width copy, and `only remaining panel recovery action` tooltip detail unchanged.
- This is better than leaving the passive chip visible everywhere because it reduces redundant chrome around the active recovery action, and better than removing the chip everywhere because the tightest headers still benefit from the shorthand `Min width` explanation.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showPassivePanelAtMinimumWidthLayoutPressureHint` from the existing minimum-width state and only surface that passive chip on very compact headers.
- Updated the same file so compact-header row-splitting logic now keys off the new passive-chip visibility instead of the raw minimum-width state.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new passive-chip gating and the expectation that roomier headers rely on the hide-panel action/title instead of a separate minimum-width chip.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached `http://localhost:19007/`, but it was on the root `Chats` surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop run typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the passive chip visible on all headers would preserve the most explicit explanation, but it would keep repeating information next to the active `Hide panel` recovery control.
- Removing the chip everywhere would maximize cleanup, but it would make the tightest headers harder to parse because the visible action label compresses to `Hide` there.
- Replacing the chip with a new badge on the button itself could also work, but it would add new chrome instead of simply letting the existing action own the explanation.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm that roomier headers now feel calmer without making the missing shrink action feel mysterious.
- A nearby follow-up could decide whether the very-compact `Min width` chip should eventually collapse into the hide-panel button itself if that tight breakpoint still feels too busy in live use.
- Another adjacent thread is whether reorder success announcements should include destination-neighbor context now that the header-level reorder hint and panel-pressure chrome are both a bit cleaner.

## Iteration 104 - Add destination-neighbor context to reorder completion feedback

### Area inspected
- `tiling-ux.md`, especially the open reorder-announcement follow-up at the end of Iteration 103
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was on the root `Chat` surface instead of the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the still-open reorder-feedback thread instead of continuing the recent panel-width/header-density work.
2. Inspect `sessions.tsx` around drag-drop and keyboard reorder handling, focusing on how the live-region announcement is built after `nextOrder` is committed.
3. Confirm that the current success copy only says `Moved <session> to position X of Y`, which forces users to mentally map the numeric position back onto the visible row of tiles.
4. Probe the reachable renderer before editing; because it was not the tiled sessions workflow, validate the change with focused source-backed tests plus renderer typecheck.

### UX problem found
- After a drag or keyboard reorder succeeds, the polite live-region feedback only announces the destination index.
- In dense tiled layouts, numeric position alone is less intuitive than spatial context because users usually judge the result relative to neighboring tiles they can already see.
- That makes successful reorders slightly harder to trust, especially when several sessions have similar titles or when the row wraps differently across window widths.

### Assumptions
- It is acceptable to improve only the accessibility/status announcement in this pass, because the main ambiguity happens after the reorder completes rather than during pointer targeting.
- It is acceptable to describe the destination relative to neighboring sessions (`before`, `after`, `between`) using the post-reorder order, because that matches how users visually verify the result.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron surface was not the actual tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Extend the reorder announcement helper so it can append destination-neighbor context when previous and/or next session labels are available.
- Derive that context from the committed `nextOrder` rather than from drag-target metadata so the message always reflects the final persisted arrangement.
- Keep the numeric position in the copy and add the neighbor phrase after it, preserving existing orientation while making the result more spatially legible.
- This is better than leaving the message index-only because it reduces ambiguity after a successful move, and better than adding more visible reorder chrome because the clarity boost happens in existing feedback rather than new UI.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `getSessionReorderAnnouncement` now accepts optional previous/next neighbor labels and adds `before`, `after`, or `between` destination context when available.
- Added `getSessionReorderAnnouncementContext(...)` in the same file to derive neighboring session labels from the committed order using the existing `reorderableSessionLabelById` map.
- Wired both drag-drop and keyboard reorder success paths to pass the new context into the existing live-region announcement.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new neighbor-aware announcement structure.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached `http://localhost:19007/`, but it was on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the existing numeric-only message would avoid any copy changes, but it would continue to make users translate the spoken destination back into the visual layout themselves.
- Replacing the numeric position entirely with only neighbor context would feel more spatial, but it would drop a useful stable reference for keyboard reorders and screen reader review.
- Adding more persistent visible reorder labels could improve discoverability, but it would add chrome to a part of the UI that already has density pressure; improving the existing completion feedback is the smaller, calmer change.

### What still needs attention
- This should still be runtime-validated on a real tiled sessions surface to confirm the longer live-region copy feels helpful rather than overly verbose during repeated keyboard reorders.
- A nearby follow-up could decide whether visible drag target affordances should also mention neighbor context more explicitly on narrow wrapped grids where `Drop before` alone may still feel abstract.
- Another adjacent thread is whether maximized-vs-grid transitions should preserve more obvious reorder orientation cues when users temporarily leave and re-enter multi-tile layouts.

## Iteration 105 - Name the dragged session inside visible reorder targets

### Area inspected
- `tiling-ux.md`, especially the open drag-target clarity follow-up at the end of Iteration 104
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was still on the root `Chat` surface instead of the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the recent header-density and reorder-completion announcement work.
2. Inspect the per-tile drag target indicator in `session-grid.tsx` and the trailing end-drop zone copy in `sessions.tsx`.
3. Confirm that the visible drag cues still say generic phrases like `Drop before <session>` and `Drop to move to end`, which require users to remember which session is currently being moved.
4. Probe the reachable renderer before editing; because it was not the tiled sessions workflow, validate the change with focused source-backed tests plus renderer typecheck.

### UX problem found
- During drag reordering, the active insertion cues describe only the destination, not the item in motion.
- On wrapped or dense grids, that makes the target feel more abstract because `before <session>` still forces users to hold the dragged session identity in working memory.
- The ambiguity is strongest when several sessions have similar titles or when the row wraps differently across window widths, because the visible cue is spatial but only half-specific.

### Assumptions
- It is acceptable to keep this pass scoped to temporary drag-state chrome rather than changing the broader reorder model, because the problem is about moment-to-moment targeting clarity.
- It is acceptable to show slightly longer transient labels while dragging, because they only appear during an active reorder gesture and reduce ambiguity enough to justify the extra text.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Update the active per-tile drop indicator to explicitly name the dragged session (`Move <dragged>`) and pair it with a second line that names the destination relation (`Before <target>`).
- Update the trailing end-drop zone to use the same pattern so the end-of-list target also names the dragged session instead of only saying `move to end`.
- Keep the change local to existing drag affordances instead of adding new controls or persistent badges.
- This is better than leaving the cues generic because it reduces working-memory load during drag reorder, and better than adding new always-visible labels because it improves clarity only when the user is actively moving a tile.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` accepts an optional `draggedTileLabel` and uses it to render a two-line active drop indicator with explicit `Move <dragged>` plus `Before <target>` copy and a matching tooltip title.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so regular session tiles pass the current dragged-session label into `SessionTileWrapper` and the trailing end-drop zone now shows `Move <dragged>` above `To end` / `To end of sessions`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new dragged-session-aware affordance strings and end-drop-zone structure.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached the renderer, but it was still on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the single-line `Drop before <target>` pill would preserve the most compact affordance, but it would continue to hide which session is actually moving.
- Adding the dragged-session name only to the tooltip/title would help mouse hover, but it would still leave the visible cue vague during touchpad or fast pointer movement.
- Introducing larger directional arrows or dedicated insertion cards could add even more clarity, but they would increase visual disruption compared with a small copy upgrade inside the existing affordances.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the two-line drag cue feels clear without feeling bulky on the narrowest wrapped grids.
- A nearby follow-up could test whether the per-tile drop indicator should adapt its wording or alignment when the grid collapses to a single column and `Before` starts to read more like `Above`.
- Another adjacent thread is whether maximized-vs-grid transitions should preserve more obvious reorder orientation cues when users temporarily leave and re-enter multi-tile layouts.

## Iteration 106 - Preserve grid-order orientation inside Single view summary

### Area inspected
- `tiling-ux.md`, especially the open maximized-vs-grid orientation note at the end of Iteration 105
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was still on the root `Chat` surface instead of the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally switch away from the just-finished drag-target wording work.
2. Inspect the `Single view` summary chip, browse controls, and restore-path logic in `sessions.tsx`.
3. Confirm that focused mode already shows `N of M` plus the current session label, but still drops most of the session's relationship to the surrounding multi-tile order.
4. Probe the reachable renderer before editing; because it was not the tiled sessions workflow, validate the change with focused source-backed tests plus renderer typecheck.

### UX problem found
- `Single view` already tells users which session they are viewing and its numeric position, but that still leaves the tile's place in the former grid abstract.
- After users reorder tiles or browse through several sessions, returning temporarily to a one-up view can make the surrounding order harder to keep in mind because the summary no longer says whether the current session sits before, after, or between nearby sessions.
- That weakens continuity between maximized and multi-tile states even though the underlying ordering is preserved.

### Assumptions
- It is acceptable to reuse the existing reorder-neighbor context helper for `Single view`, because the user value is the same: preserve spatial order in human terms rather than only numeric position.
- It is acceptable to show the extra neighbor context only on roomier headers, because compact and very-compact states already carry heavier density pressure.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Extend the `Single view` summary chip so roomier headers can also show the current session's neighbor context (`Before …`, `After …`, `Between …`) in addition to the existing position count and session title.
- Reuse the existing reorder neighbor-context helper rather than adding a second orientation model.
- Include the same neighbor context in the summary chip's title so hover/focus keeps the fuller explanation even if the visible text truncates.
- This is better than leaving `Single view` as position-only because it preserves more of the grid mental model during temporary one-up detours, and better than adding a separate new chip because the context fits naturally inside the existing focused summary.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive focused-view neighbor context from `focusableSessionIds`, `maximizedSessionId`, and the existing `focusableSessionLabelById` map using the shared reorder-neighbor helper.
- Updated the same file so roomier `Single view` summaries now surface that context inline and include it in the summary title.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new neighbor-context derivation and focused-summary render path.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached the renderer, but it was still on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the summary at `N of M` only would stay shorter, but it would continue to hide the more intuitive relationship to neighboring sessions that users actually saw in the grid.
- Adding a separate standalone orientation chip could make the cue more visually distinct, but it would cost more header space than folding the same information into the existing summary.
- Showing the neighbor context on compact headers too would maximize consistency, but those breakpoints already prioritize keeping the layout and browse controls readable.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the extra focused-summary context helps without making roomy `Single view` headers feel crowded.
- A nearby follow-up could decide whether the focused-session browse controls should also expose the same neighbor context in their middle label or tooltip when the summary chip is hidden on tighter widths.
- Another adjacent thread is whether the single-column stacked fallback should eventually swap `Before`/`After` wording to `Above`/`Below` anywhere that vertical order becomes visually dominant.

## Iteration 106 - Give visible reorder targets the same neighbor context as reorder announcements

### Area inspected
- `tiling-ux.md`, especially the still-open drag-target clarity follow-up at the end of Iteration 105
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was still on the root `Chat` surface instead of the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on the open reorder-target clarity thread rather than returning to the recent panel-width/header-density work.
2. Inspect the visible per-tile drag target indicator in `session-grid.tsx` after Iteration 105's `Move <dragged> / Before <target>` pass.
3. Compare that visible cue with the newer completion-feedback helper in `sessions.tsx`, which already knows how to describe a destination as `before`, `after`, or `between` neighboring sessions.
4. Probe the reachable renderer before editing; because it was still not the tiled sessions workflow, validate the change with focused source-backed tests plus renderer typecheck.

### UX problem found
- Iteration 105 made visible drag targets better by naming the dragged session, but the spatial half of the cue still defaulted to `before <target>`.
- On wrapped or tight grids, that is still less explicit than the final reorder announcement because the visible target can already infer richer context like `between <previous> and <next>` or `after <previous>`.
- The result was a small wording mismatch: completion feedback became more spatially precise than the live target users are aiming at during the drag itself.

### Assumptions
- It is acceptable to reuse the same neighbor-context vocabulary from reorder completion feedback for the visible target cue, because both surfaces describe the same insertion result.
- It is acceptable to compute that context from the current ordered session ids plus the hovered target index rather than introducing a new reorder-preview abstraction, because the existing `moveSessionToIndex(...)` and `getDropBeforeInsertIndex(...)` helpers already model the insertion rule accurately.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the existing two-line drag target structure from Iteration 105 so the cue still names the dragged session explicitly.
- Replace the visible destination line with a neighbor-aware context label (`before`, `after`, or `between`) derived from the same post-insertion preview logic used by reorder announcements.
- Thread the computed context/title from `sessions.tsx` into `SessionTileWrapper` so the page layer owns reorder semantics and the grid component only renders the richer copy.
- This is better than leaving `before <target>` everywhere because it gives users a more literal picture of where the tile will land on wrapped grids, and better than adding more visual chrome because it improves the existing indicator rather than expanding the interaction model.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to extract `getSessionReorderNeighborContextLabel(...)`, reuse it inside `getSessionReorderAnnouncement(...)`, and add `getSessionReorderDropTargetIndicatorCopy(...)` for hover-target preview copy.
- Updated the same file so active drag targets derive `dropTargetIndicatorContextLabel` / `dropTargetIndicatorTitle` from the current reorderable session order before passing them into `SessionProgressTile`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` accepts those optional props and renders the visible drag indicator as `Move <dragged>` plus a neighbor-aware second line instead of hardcoding `Before <target>`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the shared neighbor-context helper, the new indicator props, and the updated visible drag-target copy/title structure.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached `http://localhost:19007/`, but it was still on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the visible cue as `Move <dragged> / Before <target>` would preserve the most compact wording, but it would keep the target less spatially precise than the reorder completion feedback users hear afterward.
- Computing preview copy fully inside `SessionTileWrapper` would reduce prop plumbing, but it would mix reorder semantics into the grid component instead of keeping them in the sessions page that already owns ordering logic.
- Adding larger insertion cards or neighbor badges could make wrapped-grid placement even more explicit, but it would add more visual disruption than this small copy-level improvement inside the existing indicator.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm that the richer `between` / `after` copy remains readable on the narrowest wrapped grids.
- A nearby follow-up could test whether single-column stacked layouts should swap `before`/`after` wording toward `above`/`below` once the spatial model becomes strictly vertical.
- Another adjacent thread is whether the trailing end-drop zone should also surface the nearest previous-neighbor label once the sessions list gets long enough that `To end of sessions` feels too abstract.

## Iteration 107 - Use vertical reorder language when tiled sessions stack to one column

### Area inspected
- `tiling-ux.md`, especially the still-open stacked-reorder wording follow-up at the end of Iteration 106
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was still on the root `Chat` surface instead of the tiled sessions workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on the open stacked-reorder wording thread instead of revisiting the recent panel/header work.
2. Inspect the reorder-neighbor helper and drag-target preview copy introduced in Iteration 106.
3. Compare that copy with the responsive stacked-layout path, where the selected `2-up` / `Grid` mode collapses into a strict one-column vertical stack.
4. Probe the reachable renderer before editing; because it was still not the tiled sessions workflow, validate the change with focused source-backed tests plus desktop web typecheck.

### UX problem found
- Once tiled sessions collapse into a single visible column, reorder feedback still used `before` / `after`, which no longer matches the spatial model users see on screen.
- The trailing drop zone also kept `To end of sessions`, which is more abstract than the actual gesture in stacked mode: dragging below the current stack.
- That mismatch makes stacked reordering feel slightly less direct and predictable than the same interaction on wider grids.

### Assumptions
- It is acceptable to treat responsive one-column tiled layouts as visually vertical for copy purposes without changing the underlying ordering model, because the interaction result is the same and the improvement is purely about clearer spatial language.
- It is acceptable to keep `between A and B` unchanged while only swapping `before` / `after` to `above` / `below`, because `between` already reads naturally in both wrapped and stacked layouts.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Reuse the existing reorder-neighbor helper, but let stacked layouts opt into vertical vocabulary so visible drag targets and completion announcements read as `above` / `below` where appropriate.
- Update the stacked trailing drop zone to `To bottom` / `To bottom of stack` with matching titles so the final drop target also follows the same vertical mental model.
- Leave wider multi-column layouts on `before` / `after` so copy still matches the looser left-to-right / wrap-aware placement model there.
- This is better than keeping one vocabulary everywhere because it reduces the small but real mental translation users have to do once the layout becomes unambiguously vertical, and better than adding new visual chrome because the change fits inside the existing cues.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `getSessionReorderNeighborContextLabel(...)`, `getSessionReorderAnnouncement(...)`, and `getSessionReorderDropTargetIndicatorCopy(...)` can opt into stacked-layout vertical wording.
- Updated the same file so stacked drag-target previews and reorder announcements pass `vertical: isResponsiveStackedLayout`.
- Updated the stacked idle/end-drop-zone copy in `sessions.tsx` to use `To bottom` / `To bottom of stack` and `below all visible sessions` wording instead of `end of sessions`.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the vertical wording path and the stacked trailing-drop-zone copy.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached the renderer, but it was still on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm vitest run apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving `before` / `after` everywhere would preserve one shared vocabulary, but it forces users to mentally translate a vertical stack back into abstract ordering terms.
- Switching every reorder surface to `above` / `below` would overshoot on wrapped multi-column grids, where the spatial model is less strictly vertical.
- Surfacing the previous-neighbor label directly inside the trailing end-drop zone could make the destination even more concrete, but that is a slightly larger follow-up than this wording-only pass needed.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the new `above` / `below` wording feels clearer in stacked mode without sounding odd during rapid drag movement.
- A nearby follow-up could decide whether the stacked trailing drop zone should also name the current last visible session once the list is long enough that `To bottom of stack` still feels abstract.
- If future compact stacked-state hints or tooltips are added, they should keep the same vertical vocabulary so the model stays consistent.

## Iteration 107 - Re-orient users after leaving Single view by briefly marking the kept-visible tile

### Area inspected
- `tiling-ux.md`, especially the open maximized-vs-grid continuity note at the end of Iteration 105 and the recent Single-view summary work in Iteration 106
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was still on the root `Chat` surface instead of the tiled sessions page

### Repro steps reviewed
1. Re-read the ledger first and intentionally move away from the most recent drag-target copy work.
2. Inspect the `Single view` restore path in `sessions.tsx`, especially the logic that already remembers which session should remain visible after users browse within one-up mode.
3. Confirm that leaving `Single view` already scrolls the kept session back into view, but does not visually mark which tile the user was just looking at once several tiles reappear.
4. Probe the reachable renderer before editing; because it was still not the tiled sessions workflow, validate the change with focused source-backed tests plus desktop typecheck.

### UX problem found
- The restore flow already preserves the right session and scrolls it into view, but the returned tiled layout gives no immediate visual cue about which tile is the one the user was just browsing.
- On larger grids or after quick browse-next / browse-previous hops inside `Single view`, that makes the transition back to multi-tile mode feel slightly ambiguous even though the underlying restore behavior is correct.
- The result is a continuity gap: the system keeps context correctly, but users still have to visually scan to rediscover it.

### Assumptions
- It is acceptable to use a short-lived visual cue instead of another persistent control, because the ambiguity happens during the restore transition rather than as a standing discoverability problem.
- It is acceptable to reuse the tile wrapper for this cue, because the value is local to one tile and does not require a new grid-level abstraction.
- Focused source-backed verification plus desktop typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the existing restore behavior that scrolls the kept session into view.
- Add a brief blue ring plus small `Kept visible` pill to the tile that remains visible after leaving `Single view`.
- Clear that cue on later layout switches and drag starts so it helps re-orientation without lingering into unrelated interactions.
- This is better than adding a new permanent label or toolbar control because the user need is transitional: the main problem is quickly spotting the preserved tile the moment the grid returns.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track a short-lived `recentlyRestoredFromSingleViewSessionId`, trigger it when restoring from `Single view`, clear it on drag start / later layout changes, and thread the prop into pending and regular session tiles.
- Updated the same file's focused-layout source-contract test to lock in the new restore-cue state, timeout, and tile prop wiring.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` can render a transient blue attention ring plus a top-edge `Kept visible` pill for the restored tile.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new tile-level cue rendering.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached a renderer target, but it was still on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck` (cwd repo root) ✅

### Tradeoffs considered
- Relying on scroll-only restore keeps the code smallest, but it still leaves users to visually hunt for the tile they were just viewing once the grid repopulates.
- Adding a persistent `current session` badge would be more explicit, but it would add always-on chrome for a momentary transition issue.
- Announcing the restore only via screen-reader/live-region copy would help accessibility but would not solve the visual re-orientation problem for sighted users; that can be layered later if needed.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the pill and blue ring are noticeable without feeling too busy on dense grids.
- A nearby follow-up could add a paired polite live-region announcement so keyboard and screen-reader users get the same re-orientation cue when the layout returns from `Single view`.
- Another adjacent thread is whether single-column stacked layouts should also adapt reorder destination wording from `before` / `after` toward `above` / `below` once spatial order becomes strictly vertical.

## Iteration 108 - Announce the kept-visible tile when returning from Single view

### Area inspected
- `tiling-ux.md`, especially the open accessibility follow-up at the end of the latest `Single view` restore iteration
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- Existing restore-cue rendering in `apps/desktop/src/renderer/src/components/session-grid.tsx`
- Lightweight live renderer inspection via `electron_execute`; the renderer was reachable at `/sessions`, but the visible surface was still the chat UI rather than the tiled sessions workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay off the recent reorder-copy and panel-width threads.
2. Inspect the existing `Single view` restore path in `sessions.tsx`, including the short-lived `Kept visible` visual cue added in the previous pass.
3. Check whether that restore path also emits any screen-reader announcement when the grid returns.
4. Probe the reachable renderer before editing; because it still was not the tiled sessions workflow, validate the change with focused source-backed tests plus renderer typecheck.

### UX problem found
- The latest pass made the return from `Single view` easier to spot visually, but it stayed silent for keyboard and screen-reader users.
- That means the system preserves the right tile and even highlights it briefly, yet non-visual users still do not get an equivalent cue that the app returned to a tiled layout and kept the same session visible.
- The result was a small but meaningful continuity gap in the maximized-vs-grid transition: visual users gained context, assistive-tech users did not.

### Assumptions
- It is acceptable to reuse the same short-lived restore state that powers the visual cue as the trigger for a live-region announcement, because both signals describe the same transition.
- It is acceptable to announce the restored tiled layout label plus the kept-visible session name without adding another persistent UI element, because the need is transitional rather than always-on.
- Focused source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface still was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the existing visual `Kept visible` ring/pill unchanged.
- Add a second polite `sr-only` status region that announces `Returned to <layout>. Kept <session> visible.` whenever the app restores from `Single view` to a tiled layout.
- Derive that message directly from the existing `recentlyRestoredFromSingleViewSessionId`, the current tiled layout mode, and the same session-label map already used elsewhere in the page.
- This is better than adding a new visible label because the problem is not lack of chrome; it is missing non-visual continuity during a transition the UI already models correctly.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `getSingleViewReturnAnnouncement(...)` and derive `recentSingleViewReturnAnnouncementLabel` from the existing restore-cue state.
- Updated the same file to render a dedicated polite `sr-only` live region for that restore announcement alongside the existing reorder announcement.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new announcement helper, derived restore-announcement label, and live-region wiring.

### Verification
- Live inspection was partially available only: `electron_execute` reached the renderer at `/sessions`, but the visible content still was the chat surface rather than the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Relying on the visual cue alone keeps the implementation smallest, but it leaves assistive-tech users without the same re-orientation signal during the restore transition.
- Adding another visible badge in the header would make the announcement easier to spot for sighted users, but it would add extra chrome for a momentary state that is already visually covered by the tile-level cue.
- Routing this through the existing reorder live-region string would reduce one DOM node, but it would mix two different transition types instead of keeping restore and reorder announcements independently legible.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the new live-region copy sounds helpful rather than noisy when users repeatedly browse and restore `Single view`.
- A nearby follow-up could decide whether the restore announcement should also include relative position context such as `2 of 5` once that proves helpful for assistive-tech navigation.
- Another adjacent thread is whether other tiled-layout transitions with strong visual-only cues (for example responsive stacking or panel-recovery outcomes) also need paired non-visual announcements.

## Iteration 108 - Make the trailing reorder drop zone name its actual destination

### Area inspected
- `tiling-ux.md`, especially the still-open trailing end-drop-zone follow-up at the end of Iteration 107
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight live renderer inspection via `electron_execute`; a renderer target was reachable, but it was still on the root `Chat` surface instead of the tiled sessions workflow

### Repro steps reviewed
1. Re-read the updated ledger first and intentionally stay on the nearby trailing-drop-zone clarity thread rather than shifting to an unrelated layout area.
2. Inspect how the dedicated end-drop-zone copy is currently derived in `sessions.tsx`.
3. Compare that generic `To end` / `To bottom of stack` wording with the richer neighbor-aware preview already used for per-tile drag targets.
4. Probe the reachable renderer before editing; because it was still not the tiled sessions workflow, validate the change with focused source-backed tests plus desktop web typecheck.

### UX problem found
- The dedicated trailing drop zone clearly exposed the “move to the last position” gesture, but during drag it still described the destination generically instead of naming the concrete neighbor relationship users care about.
- On longer session lists, `To end` / `To bottom of stack` is less direct than `after <last visible session>` or `below <last visible session>`, especially once per-tile targets already provide richer placement language.
- That left the final drop target slightly more abstract than the intermediate per-tile drag targets around it.

### Assumptions
- It is acceptable to reuse the existing drag-target preview helper for the trailing drop zone rather than adding a second end-specific copy helper, because both surfaces describe the same insertion result.
- It is acceptable for the trailing drop-zone label to become longer during drag, because the zone already has full-row width plus truncation/title support and clarity at drop time is worth the extra specificity.
- Focused source-backed verification plus desktop web typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the trailing drop zone itself and its existing fallback strings.
- While dragging, derive the zone's visible label and title from `getSessionReorderDropTargetIndicatorCopy(...)` using the trailing insertion index so the end target can say `after ...` / `below ...` just like regular drag targets.
- Fall back to the generic `To end` / `To bottom of stack` strings only when preview copy is unavailable.
- This is better than leaving the end zone generic because it makes the most distant reorder target feel just as concrete as the tile-level targets without adding any new controls or behaviors.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to compute `gridReorderEndDropZonePreviewCopy` from the existing reorder-preview helper using `trailingReorderDropTargetIndex`.
- Updated the same file so the trailing drop zone now prefers `gridReorderEndDropZonePreviewCopy?.contextLabel` and `?.title`, falling back to the previous generic stacked/non-stacked strings only when needed.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new trailing-preview derivation and fallback plumbing.

### Verification
- Live inspection was only partially available for this pass: `electron_execute` reached the renderer, but it was still on the root `Chat` surface rather than the tiled sessions workflow.
- `pnpm vitest run apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Keeping the end-drop zone generic would preserve the shortest label, but it would continue to make the most important “send to last position” target less spatially concrete than the per-tile targets.
- Adding a brand-new end-target copy helper would work, but it would duplicate logic that the existing reorder-preview helper already models correctly.
- Only updating the zone title while leaving the visible label generic would help hover users somewhat, but it would miss the more immediate clarity improvement during active dragging.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the longer trailing-target labels stay readable on the narrowest stacked layouts.
- A nearby follow-up could decide whether compact stacked headers should keep the generic `To bottom` wording even during drag if real-world truncation proves too aggressive.
- If drag feedback still feels ambiguous after runtime validation, the next likely improvement is stronger visual distinction between the dedicated trailing drop zone and ordinary tile-edge targets rather than more copy changes.

## Iteration 109 - Make the trailing reorder drop zone read like a dedicated last-position slot

### Area inspected
- `tiling-ux.md`, especially the open follow-up at the end of the latest trailing-drop-zone copy iteration
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Lightweight Electron renderer inspection via `electron_execute`; the app was reachable at `/sessions`, but the visible content was still the chat surface rather than the tiled multi-session workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the still-open trailing-drop-zone visual-distinction thread instead of repeating the recent copy-only reorder passes.
2. Inspect the dedicated end-drop-zone render path in `sessions.tsx`, especially how it differs visually from per-tile insertion cues while dragging.
3. Compare its chrome with the ordinary tile reorder handle and drag-target indicators to see whether the “move to last position” affordance looks uniquely intentional.
4. Probe the running renderer before editing; because the reachable surface was still not the tiled sessions workflow, validate with focused source-backed tests plus desktop renderer typecheck.

### UX problem found
- The dedicated trailing drop zone already had better wording than before, but it still looked too much like a generic dashed card with a `GripVertical` icon.
- That grip icon is visually associated with the drag handle itself, so using it inside the end target weakens the distinction between “this is the thing you drag” and “this is the special slot you can drop into to send a tile to the last position.”
- The result was that the final reorder target became semantically clearer in copy, but still not as visually self-explanatory as it could be.

### Assumptions
- It is acceptable to improve this with renderer-only chrome instead of another behavior change, because the existing drag model and end-target insertion logic already work correctly.
- It is acceptable to add a small marker label above the trailing zone, because this target is only visible during an active drag and the extra chrome is scoped to that moment.
- Focused source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the dedicated trailing drop zone and all existing reorder semantics unchanged.
- Replace the grip-like visual treatment with a dedicated `last position` / `bottom of stack` marker that sits above the zone, paired with a faint top insertion rail.
- Let that marker switch to `Release at ...` wording when the trailing slot becomes the active drag target, so the zone reads like a deliberate destination rather than another tile-like object.
- This is better than adding even more destination copy inside the body alone because the remaining ambiguity was visual identity, not missing words.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to import `ArrowDownToLine` and derive a compact/expanded `gridReorderEndDropZoneMarkerLabel` that distinguishes idle versus active trailing-drop-zone states.
- Updated the same file so the trailing reorder drop zone now renders with extra top padding, an overhanging marker pill, and a faint insertion rail instead of a `GripVertical` icon inside the drop body.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the new marker-label strings and the new trailing-zone structure.

### Verification
- Live inspection was partially available only: `electron_execute` reached `http://localhost:19007/sessions`, but the visible UI was still the chat surface rather than a tiled multi-session layout.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the zone as a generic dashed card would keep the smallest code diff, but it would continue to make the dedicated last-position target feel visually interchangeable with other drag chrome.
- Keeping a `GripVertical` icon inside the zone preserves visual consistency with reorder handles, but that is exactly the wrong consistency for a destination surface that should look distinct from a drag source.
- A larger redesign with arrows, insertion cards, or sticky footer chrome could make the last-position target even louder, but it would add more disruption than this local clarity pass needs.

### What still needs attention
- This should still be runtime-validated on an actual tiled sessions surface to confirm the new marker pill feels helpful without crowding the narrowest stacked drag state.
- A nearby follow-up could decide whether the trailing drop zone should gain slightly stronger active-state animation or contrast once real drag usage is observed.
- If the last-position slot is still missed in practice, the next likely improvement is placement behavior such as making the zone feel more anchored to the bottom edge of the visible stack rather than further increasing copy.

## Iteration 110 - Add a direct sidebar-collapse recovery action for tiled layout pressure

### Area inspected
- `tiling-ux.md`, specifically the latest reorder-focused iterations so this pass would avoid revisiting the same area again
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- A quick live renderer probe via `electron_execute`; a renderer target was reachable, but it was still not the tiled multi-session workflow, so validation remained source-backed

### Repro steps reviewed
1. Re-read the ledger first and intentionally move away from the recent drag/reorder iterations.
2. Inspect the sessions header logic that decides when compare/grid layouts are stacked or near-stacked.
3. Compare the existing recovery copy with the actual available actions once the floating panel or the sidebar squeezes the grid.
4. Probe the reachable renderer before editing; because it still was not the tiled sessions surface, validate the change with focused source-contract tests plus renderer typecheck.

### UX problem found
- The sessions header already tells users to narrow the sidebar when horizontal space gets tight, but the page only exposed floating-panel recovery actions.
- That left a gap between the diagnosis and the available fix: the UI knew the sidebar could be part of the pressure problem, yet offered no direct one-click way to reclaim that width from the same place.
- The result was avoidable friction during tiled compare/grid use, especially when the sidebar alone could restore side-by-side columns without forcing a broader layout reset.

### Assumptions
- It is acceptable to expose sidebar recovery from the sessions page through routed layout context, because the sidebar is part of the same desktop shell and collapsing it is an existing reversible action rather than a new product concept.
- It is acceptable to show the new action only when collapsing the sidebar would actually restore or preserve multi-column tiling, because that keeps the header focused on high-signal recovery options instead of adding another generic control.
- Focused source-backed verification plus renderer typecheck are sufficient for this pass because the reachable Electron target still was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Add a direct `Collapse sidebar` recovery action to the sessions header when the current sidebar width is expanded and collapsing it would clear the stacked / near-stacked pressure condition.
- Keep the existing floating-panel actions, but let the new sidebar action participate in the same promoted-action system so the header can prefer the least ambiguous fix.
- Only surface this action when it is truly corrective, not merely width-adjacent, so the control feels trustworthy rather than opportunistic.
- This is better than only adjusting copy because the missing piece was not awareness; it was an immediate, local way to take the hinted recovery step.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/app-layout.tsx` to pass a one-way `collapseSidebar` action through the outlet context alongside `sidebarWidth`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to compute whether collapsing the sidebar would resolve stacked or near-stacked layout pressure, then render a `Collapse sidebar` header action with the same promoted/secondary styling, outcome badge, and reclaimed-width badge used by panel recovery actions.
- Updated the same page so compact-header passive pressure chips and compact single-view action deferral now account for sidebar recovery too.
- Added `apps/desktop/src/renderer/src/components/app-layout.layout.test.ts` and expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new outlet-context plumbing and sidebar-recovery action logic.

### Verification
- Live inspection was partially available only: `electron_execute` reached a renderer target, but it was still not the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/components/app-layout.layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- One incorrect verification guess was discarded during the pass: `pnpm --filter @dotagents/desktop exec tsc --noEmit -p tsconfig.renderer.json` failed because the package uses `tsconfig.web.json`, not `tsconfig.renderer.json`.

### Tradeoffs considered
- Keeping the existing copy-only hint would preserve the smallest diff, but it would continue to make sidebar pressure feel diagnosable without being locally actionable.
- Showing a sidebar action whenever the sidebar is merely expanded would add noise and could feel arbitrary, so this pass limits the button to cases where collapse actually restores or protects multi-column tiling.
- Replacing the panel actions with only a sidebar action would be too opinionated, because the floating panel is still a real competing surface and sometimes remains the better recovery path.

### What still needs attention
- This should still be runtime-validated on a real tiled compare/grid workflow to confirm the new action reads clearly alongside panel actions at narrow widths.
- A nearby follow-up could decide whether the header should expose a similarly direct `Expand sidebar` recovery reversal after the user restores layout room.
- Another adjacent thread is whether stacked/near-stacked transitions themselves deserve a shared non-visual announcement path, similar to the recent `Single view` restore announcement work.

## Iteration 111 - Compact active floating-panel resize hints on narrow widths

### Area inspected
- `tiling-ux.md`, especially the older floating-panel follow-up about active resize hints getting too wide during compact corner drags
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts`
- A quick live renderer probe via `electron_execute`; a renderer target was reachable, but it still was not the tiled multi-session workflow
- `apps/mobile/src` via `rg` to confirm there is no matching mobile tiled-session surface that needs the same change

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the recent reorder and sidebar-pressure iterations.
2. Inspect the floating-panel resize hint path, especially the active hint body that can show the base label, live size, width delta, height delta, and min-size warning together.
3. Focus on the narrow states that matter most to tiled workflows: a small floating panel plus an active corner drag while horizontal space is already constrained.
4. Probe the reachable renderer before editing; because it still was not the tiled sessions surface, validate with focused source-backed tests plus desktop renderer typecheck.

### UX problem found
- The floating panel’s active resize hint could get too wordy on narrow panel widths, especially during corner drags where both axis deltas and a minimum-size warning may appear together.
- That extra copy pressure shows up precisely when tiled sessions are already competing for horizontal space, so the hint risks feeling cramped or noisy instead of helpful.
- The underlying resize behavior was fine; the issue was the compactness and readability of live feedback in constrained panel states.

### Assumptions
- It is acceptable to shorten active resize copy only on narrow floating panels because the meanings of width, height, and min-size feedback remain intact even when abbreviated.
- It is acceptable to keep the full wording on roomier panels so discoverability does not regress where space is available.
- Source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface still was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the existing floating-panel resize mechanics, handles, and feedback model unchanged.
- When the panel is actively being resized and its width is below a compact threshold, shorten the live hint copy by switching `Width` / `Height` to `W` / `H`, compacting minimum-size warnings to `Min width` / `Min height` / `Min size`, and tightening the `width × height` readout.
- Leave hover/resting hint language unchanged so only the high-pressure active state becomes denser.
- This is better than adding wrapping or hiding feedback entirely because it preserves the same information while reducing the chance that the hint feels oversized relative to a narrow floating panel.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add a `COMPACT_ACTIVE_PANEL_RESIZE_HINT_WIDTH` threshold and derive `useCompactActiveResizeHintCopy` during active resize.
- Updated the same file so axis delta badges and minimum-size warnings can render compact variants on narrow panels.
- Tightened the active size readout in the same compact state from `width × height` spacing to `width×height` spacing.
- Expanded `apps/desktop/src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` to lock in the compact-threshold wiring and the new shorthand feedback strings.

### Verification
- Live inspection was partially available only: `electron_execute` reached a renderer target, but it still was not the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.affordance.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅
- `rg -n "Single view|Compare view|tileLayoutMode|SessionGrid|session-grid|SessionTile" apps/mobile/src` (cwd repo root) returned no matches, so there was no obvious mobile counterpart to update in parallel.

### Tradeoffs considered
- Letting the hint wrap would preserve full wording, but multi-line resize feedback would feel heavier and less stable in a small floating panel.
- Hiding one of the delta badges on narrow widths would save more space, but it would also make corner drags less informative exactly when both axes are changing.
- A larger redesign that repositions or hard-caps the hint could improve this further, but that is a broader chrome/layout decision than this focused compaction pass needs.

### What still needs attention
- This should still be runtime-validated in a real tiled session workflow to confirm the compact labels feel clear rather than cryptic when users are actively resizing a narrow floating panel.
- If the hint still feels too wide in practice, the next likely follow-up is a max-width or wrap-vs-fade treatment rather than more abbreviation alone.
- The broader floating-panel-vs-grid interaction still deserves another pass around how panel resizing, stacked-state recovery, and header controls work together across different sidebar widths.

## Iteration 112 - Non-visual announcements for stacked and near-stacked tiling pressure

### Area inspected
- `tiling-ux.md`, especially the open follow-up about whether stacked / near-stacked transitions should share a non-visual announcement path
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- A quick live renderer probe via `electron_execute`; a renderer target was reachable, but it still was not the tiled multi-session workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the recent sidebar-recovery and floating-panel compact-hint passes.
2. Inspect the responsive stacked / near-stacked hint logic in `sessions.tsx`, including the existing visual chips and the recent `Single view` restore live-region pattern.
3. Focus on width-driven transitions caused by window resizing, sidebar width, or floating-panel width changes, because those are the easiest tiling shifts to miss without a visual cue.
4. Because the reachable Electron target still was not the tiled sessions workflow, validate with focused source-backed tests plus desktop renderer typecheck.

### UX problem found
- The sessions page already explains stacked and near-stacked layout pressure visually, but those transitions still had no shared non-visual announcement path.
- That made width-driven tiling changes less predictable for keyboard and screen-reader users, and it also meant the existing `Single view` restore announcement pattern was not mirrored for one of the other most important layout-state shifts.
- The biggest gap was not missing recovery actions; it was missing confirmation that the tiling mode had just tightened, relaxed, or fully recovered.

### Assumptions
- It is acceptable to announce only transitions, not every render, because repeated announcements during active resizing would be noisy and harder to trust.
- It is acceptable to keep the copy short and state-oriented rather than listing every recovery action, because the goal is orientation and predictability, not duplicating the full visual hint text.
- Focused source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface still was not the tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Add a dedicated layout-pressure live-region path that announces transitions into `near`, `stacked`, and recovered `stable` states for compare and grid layouts.
- Reuse the existing sessions-page pattern of `sr-only` polite status regions rather than introducing new infrastructure.
- Skip announcing on the first observed state so the page does not read out ambient layout pressure during initial render or hydration.
- This is better than relying on visual chips alone because resize-driven tiling changes can otherwise feel abrupt, especially when they are caused indirectly by sidebar or floating-panel width changes.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add a `LayoutPressureAnnouncementState` helper path plus concise messages for stacked, near-stacked, partially recovered, and fully recovered compare/grid states.
- Updated the same page to track previous responsive pressure state with refs, announce only on transitions after the first observed state, and reset the announcement when tiling becomes irrelevant (for example `Single view` or only one visible tile).
- Added a third `sr-only` polite status region near the existing reorder and `Single view` restore announcements so stacked / near-stacked transitions share the same non-visual delivery pattern.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new helper, transition-tracking state, and live-region output.

### Verification
- Live inspection was partially available only: `electron_execute` reached a renderer target, but it still was not the tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Reusing the full visual chip copy for announcements would have been more explicit, but it would also be much noisier during width changes and would duplicate recovery details that are already present in the UI.
- Announcing every resize tick while near or stacked would give more continuous feedback, but it would quickly become distracting and reduce confidence in the signal.
- A broader shared accessibility abstraction was unnecessary here because the sessions page already had adjacent live-region patterns to extend safely.

### What still needs attention
- This should still be runtime-validated in a real tiled compare/grid workflow to make sure the announcements feel timely and not too chatty during active width changes.
- If runtime behavior still feels noisy, the next refinement is likely debouncing or suppressing the `near` announcement during very short-lived threshold crossings while keeping `stacked` transitions immediate.
- The broader tile-header density pass is still open: visual chips, recovery actions, and control hierarchy in very narrow widths could still use another focused simplification iteration.

## Iteration 113 - Move compact Single view context off the busiest control row

### Area inspected
- `tiling-ux.md`, especially Iteration 112's still-open note about very narrow header density
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on the still-open tile-header density thread instead of revisiting the latest layout-pressure announcement work.
2. Inspect the compact `Single view` header path in `sessions.tsx`, especially the relationship between browse controls, the focused-layout summary chip, layout buttons, and deferred layout-pressure actions.
3. Compare what the control row prioritizes on compact headers once multiple sessions are browseable in `Single view`.
4. Validate the refinement with focused source-contract tests plus desktop renderer web typecheck, because live tiled-session inspection was still not reliably available.

### UX problem found
- Compact `Single view` headers could still put too much descriptive context onto the busiest control row by using the pager's middle chip for a session title.
- That made previous/next browsing compete directly with layout switching and any deferred recovery actions on the same narrow row.
- The header already had a secondary summary row that could carry richer context more cheaply, but the compact state was not using that hierarchy fully.

### Assumptions
- It is acceptable to shorten the pager's middle label to position-only on compact `Single view` headers, because the previous/next buttons already expose full session titles via tooltips and aria labels.
- It is acceptable to move the richer session identity down into the focused-layout summary chip, because that row is secondary context rather than the main interaction row.
- Focused source-backed verification plus desktop renderer web typecheck are sufficient for this pass because the change is renderer-local and no reliable tiled Electron repro surface was available.

### Decision and rationale
- Keep the compact `Single view` browse controls and summary chip, but rebalance what each row says.
- On compact-but-not-very-compact `Single view` headers with browseable sessions, let the pager's middle chip show the compact position label (`N of M`) instead of the session title.
- Use the summary chip to keep the richer `Showing <session>` context in that compact state, so context remains visible without bloating the control row.
- This is better than removing session context entirely because the information still matters, and better than leaving the pager title-heavy because the control row is the part of the header most likely to wrap or crowd first.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add a `shouldPreferCompactFocusedSessionBrowsePositionLabel` helper for compact `Single view` headers with browseable sessions.
- Updated the same file so compact `Single view` pagers prefer the short position label while the focused-layout summary chip can keep the session-centric `Showing ...` context.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` to lock in the new compact browse-label and summary-chip hierarchy.

### Verification
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the session title in the compact pager preserves the richest inline context, but it spends scarce control-row width on context that the summary row can carry more safely.
- Hiding the summary chip instead would simplify the header visually, but it would remove too much session context from compact `Single view` and make the pager/tooltips do all the work.
- A broader redesign such as icon-only layout controls or overflow menus could save even more space, but that would be a larger control-model change than this focused hierarchy fix.

### What still needs attention
- This should still be runtime-validated in an actual tiled `Single view` workflow to confirm the shorter pager label and richer summary chip feel clearer rather than split across too many places.
- If compact headers still feel crowded in practice, the next likely follow-up is deciding whether compact `Single view` should also collapse layout-button text earlier when browse and recovery controls are both present.
- The broader compare/grid header-density thread remains open for very narrow states where multiple recovery chips and actions still compete for space.

## Iteration 113 - Ignore stale Single-view return heights when the restored tiled footprint changed

### Area inspected
- `tiling-ux.md`, especially the older maximize-vs-grid sizing notes and the earlier `Single view` height-restore pass
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- A quick live renderer probe via `electron_execute`; a renderer target was reachable at `http://localhost:19007/sessions`, but it still rendered the generic `Chat` surface instead of a trustworthy tiled multi-session workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally avoid the just-touched announcement and floating-panel copy threads.
2. Inspect the `Single view` restore path in `SessionTileWrapper`, especially the asymmetry between width restore and height restore.
3. Compare `getSingleViewLayoutRestoreWidth(...)` with `getSingleViewLayoutRestoreHeight(...)` and check whether height restore had any guard against stale pre-maximize geometry.
4. Validate the hypothesis against layout states where the tiled footprint can legitimately change while `Single view` is active, such as stacked compare, sparse two-tile grid, or a grid that regains a second row.

### UX problem found
- The `Single view` return path already restored width conservatively, but height still came back almost unconditionally after only clamping to the global min/max bounds.
- That made maximized-vs-grid transitions less predictable when the restored tiled layout changed meaningfully while `Single view` was active.
- In practice, a remembered tall height from a roomy two-tile state could be reapplied to a denser restored grid or stacked compare state, making the return feel stale rather than intentionally preserved.

### Assumptions
- It is acceptable to treat restored height like restored width and require it to stay reasonably close to the current tiled target, because the brief prioritizes reducing accidental layout resets without preserving obviously stale geometry.
- It is acceptable to keep modest manual height overrides when they are still near the restored layout target, because that preserves user intent without carrying forward full-height states that no longer match the layout semantics.
- Focused source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface was not the real tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the existing `Single view` height capture behavior.
- Make `getSingleViewLayoutRestoreHeight(...)` take the current target tiled height and only restore remembered height when it still fits that target closely enough, using the same style of conservative target-relative guard already used for width restores.
- This is better than always restoring the last remembered height because it stops stale roomy heights from leaking into denser restored layouts, and better than removing restore entirely because modest manual height intent still survives normal `Single view` round-trips.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add a `SINGLE_VIEW_HEIGHT_RESTORE_MAX_TARGET_MULTIPLIER`, clamp the current target height, and make `getSingleViewLayoutRestoreHeight(...)` reject remembered heights that are no longer close enough to the restored tiled target.
- Updated the same file so the `Single view` exit path now passes `targetTileHeight` into the height-restore helper instead of restoring any clamped remembered height unconditionally.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` to cover both acceptable and stale height-restore cases.
- Updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new target-aware restore call shape.

### Verification
- Live inspection was partially available only: `electron_execute` reached `http://localhost:19007/sessions`, but the visible UI was still the generic `Chat` surface rather than a reliable tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving the previous unconditional height restore in place would preserve more remembered states, but it would keep reapplying stale tall geometry after meaningful layout changes.
- Dropping `Single view` height restore entirely would avoid stale cases, but it would also regress the useful manual-height preservation work from the earlier maximize round-trip pass.
- A more elaborate container-relative restore heuristic could smooth additional edge cases, but it would add more policy than this local stale-restore guard needs.

### What still needs attention
- This should still be runtime-validated in the real desktop sessions surface, especially by entering `Single view`, changing width pressure or visible session count, and then returning to compare/grid.
- A nearby follow-up could decide whether remembered width and height should share a single reusable restore-sanity helper once more restore paths appear.
- The broader maximize-vs-grid predictability thread is still open around whether some restored layouts should surface a brief visible cue when previously remembered sizing was intentionally discarded.

## Iteration 114 - Keep hide-panel recovery as a last resort when smaller fixes already work

### Area inspected
- `tiling-ux.md`, especially the open compare/grid header-density note about secondary recovery actions competing for space
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- A lightweight live renderer probe via `electron_execute`; the renderer was reachable, but the visible surface was still the generic `Chat` UI rather than a trustworthy tiled multi-session workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose the still-open header-prioritization thread instead of another recent `Single view` restore pass.
2. Inspect the stacked / near-stacked compare-grid recovery logic in `sessions.tsx`, especially how `Shrink panel`, `Collapse sidebar`, and `Hide panel` are derived and ordered.
3. Confirm that `Hide panel` could still be rendered even when a less disruptive action was already prioritized to restore or preserve the tiled layout.
4. Re-check the available runtime surface with `electron_execute`; a renderer target was reachable, but it still was not a trustworthy tiled-sessions state for direct UX validation.

### UX problem found
- The sessions header already prioritizes the least disruptive recovery action visually, but it could still keep `Hide panel` visible beside it.
- In practice, that meant stacked or near-stacked states could present a stronger fallback action even when `Shrink panel` or `Collapse sidebar` already solved the problem.
- That made the recovery strip denser than necessary and weakened the guidance hierarchy by asking users to evaluate a more drastic option they did not actually need.

### Assumptions
- It is acceptable to treat `Hide panel` as a last-resort recovery action in this header because hiding the floating panel is materially more disruptive than shrinking it or collapsing the sidebar.
- It is acceptable to preserve `Hide panel` only when it is the prioritized fix or when no smaller recovery action is currently prioritized, because the goal here is reducing choice overload rather than removing recovery coverage.
- Focused source-backed verification plus desktop renderer typecheck are sufficient for this pass because the reachable Electron surface was not a reliable tiled sessions workflow and the change is renderer-local.

### Decision and rationale
- Keep the existing recovery math and prioritization logic for `Shrink panel`, `Collapse sidebar`, and `Hide panel`.
- Add one more presentation rule: when a less disruptive action is already prioritized, suppress the visible `Hide panel` action instead of showing it in parallel.
- Also tie the compact-header min-width hint and compact `Single view` action deferral logic to that same final `Hide panel` visibility decision so the header stays internally consistent.
- This is better than leaving all three actions visible because it reduces clutter and makes the guidance feel more intentional.
- This is better than removing `Hide panel` more broadly because the strong fallback still matters when it is truly the only useful local recovery path.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `hasLessDisruptiveLayoutPressureRecoveryAction` and `showHidePanelForLayoutPressureAction`.
- Updated the same file so the panel-min-width hint, compact-header chip suppression, compact `Single view` deferral check, hide-panel label, and hide-panel button all follow the final last-resort visibility rule.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new last-resort hide-panel heuristic and the related compact-header wiring.

### Verification
- Live inspection was still limited: `electron_execute` could reach a renderer target, but the visible UI remained the generic `Chat` surface rather than a reliable tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck:web` (cwd repo root) ✅

### Tradeoffs considered
- Leaving `Hide panel` visible whenever it was technically available would preserve maximum explicitness, but it would keep the header denser and make the action hierarchy less trustworthy.
- Hiding both `Hide panel` and `Collapse sidebar` whenever `Shrink panel` works would simplify the strip further, but it would also remove a still-reasonable non-panel fallback that some users may prefer locally.
- Replacing the whole recovery strip with a menu or overflow affordance could save even more space, but that would be a broader interaction change than this focused clarity pass needs.

### What still needs attention
- This should still be runtime-validated in a real compare/grid tiled workflow to confirm that the simplified recovery strip feels clearer at several window widths and sidebar states.
- If the header still feels crowded when multiple non-hide recovery actions remain visible, the next likely follow-up is deciding whether compact states should collapse lower-priority recovery actions even further rather than only hiding `Hide panel`.
- The broader panel-versus-tiles allocation question remains open; this pass improves recovery prioritization, not when the panel or sidebar should yield width proactively.

## Iteration 115 - Explain when Single view returns with a refreshed tiled size

### Area inspected
- `tiling-ux.md`, especially Iteration 113's still-open maximize-vs-grid predictability note about discarded remembered sizing lacking a visible cue
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- A quick renderer probe via `electron_execute`; a renderer target was reachable, but it still was not a trustworthy tiled multi-session sessions workflow for direct runtime validation

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on the still-open maximize-vs-grid predictability thread instead of revisiting the newest panel-recovery prioritization pass.
2. Inspect the `Single view` restore path in `sessions.tsx`, especially where the page captures remembered tile size before maximizing and hands restore values back to `SessionGrid` when returning to compare or grid.
3. Compare that page-level restore flow with the newer conservative restore guards in `session-grid.tsx` to confirm that stale remembered sizing could now be dropped intentionally with no page-level explanation.
4. Check the available live renderer surface; `electron_execute` could reach a renderer, but it still was not the real tiled sessions UI, so verification stayed focused on renderer-local tests and typecheck.

### UX problem found
- The recent stale-restore guard improved layout predictability, but it also made some `Single view` returns silently ignore previously remembered width and/or height.
- From the user's perspective, that means returning to compare or grid can sometimes keep the same focused session visible yet come back at a different size with no explanation.
- That ambiguity matters most in maximize-vs-grid transitions because the layout change is already cognitively expensive; silent restore rejection can feel like a reset rather than an intentional fit-to-layout decision.

### Assumptions
- It is acceptable to add a brief transient cue in the sessions header when remembered `Single view` sizing is intentionally discarded, because the goal is clarity rather than introducing another persistent state indicator.
- It is acceptable to reuse the existing `Single view` return announcement path and compact header chip patterns instead of inventing a new feedback system, because this keeps the change local and consistent with the rest of the sessions page.
- Focused source-backed verification plus full desktop package typecheck are sufficient for this pass because the reachable Electron surface was not a reliable tiled sessions workflow and the change stays renderer-local.

### Decision and rationale
- Keep the conservative restore behavior from the previous `Single view` sizing pass.
- When leaving `Single view`, compute whether the remembered width, height, or both would now be rejected for the restored tiled footprint.
- If so, surface a short-lived visible chip such as `Fit Compare` / `Fit Grid` with a width/height/size badge, and append the same explanation to the existing polite `Single view` return announcement.
- This is better than relaxing the restore guard because predictability should come from preserving only valid remembered sizing, not from forcing stale geometry back into a changed layout.
- This is better than relying on a screen-reader-only announcement because the original open issue was specifically about visible clarity for sighted users re-orienting after a maximize round-trip.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track `SessionGridMeasurements` with `containerHeight` as well as width/gap so the page can evaluate return-to-tiled sizing against the current footprint.
- Updated the same file to derive whether `Single view` return width and/or height will be discarded, store a brief transient cue state, and show a compact visible chip plus richer polite return announcement when that happens.
- Kept the change local by reusing existing header chip styling, `Single view` return timing, and focus-layout restore flow instead of changing `SessionGrid` behavior again.
- Expanded `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new restore-adjustment helper flow, header chip, and measurement wiring.

### Verification
- Live inspection remained limited: `electron_execute` could reach a renderer target, but it still was not a trustworthy tiled sessions workflow.
- `pnpm vitest run apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` (cwd repo root) ✅
- `pnpm --filter @dotagents/desktop typecheck` (cwd repo root) ✅

### Tradeoffs considered
- Removing the stale-restore guard would avoid needing a cue, but it would reintroduce the less predictable stale sizing behavior the previous pass intentionally fixed.
- Adding a persistent banner or another permanent control would make the reason more obvious, but it would spend scarce header space on information that only matters immediately after the layout transition.
- A shared reusable restore-feedback abstraction could reduce duplication later, but that would be more structure than this local sessions-page refinement needs today.

### What still needs attention
- This should still be runtime-validated in the real desktop tiled sessions workflow to confirm the chip appears at the right moment, reads clearly at compact widths, and disappears quickly enough.
- If the cue feels too subtle in practice, the next likely follow-up is deciding whether the restored tile itself should also get a slightly stronger temporary size-adjusted highlight beyond the existing return marker.
- The broader maximize-vs-grid predictability thread is healthier now, but tile resizing affordances and header density still deserve more passes once a trustworthy live tiled surface is available.

## Iteration 116 - Let tile resize handles snap back to the current layout fit

### Area inspected
- `tiling-ux.md`, especially Iteration 115 and the older open notes about tile resize affordances still needing another pass.
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- A quick renderer probe via `electron_execute`; a renderer target was reachable, but it still was not a trustworthy tiled multi-session workflow for direct runtime validation.

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on the still-open tile-resize affordance thread instead of revisiting the newest Single view and panel-recovery work.
2. Inspect the current tile resize handles and confirm the grid supports manual width, height, and corner resizing but does not offer a local way to return one tile to layout-managed sizing.
3. Compare that with the floating panel resize pattern, which already uses double-click on resize handles as a compact recovery gesture.
4. Confirm `SessionTileWrapper` already knows the current layout target width and height, so it can restore a tile locally without resetting the whole layout.

### UX problem found
- Once a tile is manually resized, getting back to the current layout fit is indirect. Users currently need a broader layout reset path even when only one tile looks "off".
- That makes resize outcomes feel stickier than intended and increases ambiguity after Compare ↔ Grid switches or after leaving `Single view`.
- The floating panel already teaches a lightweight pattern — double-clicking a resize handle — for compacting and recovering size, but tiled sessions did not offer the equivalent local recovery gesture.

### Assumptions made
- Reusing the floating panel's double-click-to-recover pattern is acceptable because both surfaces already expose drag handles and local size persistence.
- Axis-specific restore is better than a single blanket reset: the right edge should restore width, the bottom edge should restore height, and the corner should restore both dimensions.
- Updating the existing hover hint copy and native titles is enough for this iteration; a new always-visible reset control would add more tile chrome than this local problem needs.

### Decision and rationale
- Added double-click recovery on tile resize handles:
  - right edge → restore layout width
  - bottom edge → restore layout height
  - corner → restore the full layout size
- Updated hover hint copy and handle titles to advertise the gesture where users already look while resizing.
- This is better than adding a separate reset button because it keeps recovery local to the resize affordance, avoids persistent new chrome, and follows an existing desktop pattern already used by the floating panel.

### Code changes
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
  - added pure helper copy for idle resize hints and handle titles
  - wired double-click handlers to snap the tile back to the current layout target width, height, or full size
  - updated handle titles and hover hint labels to mention the fit/restore gesture
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
  - added direct assertions for the new resize-hint and handle-title copy
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
  - added source-level coverage that the new double-click restore handlers are wired to the actual resize handles

### Verification
- Renderer probe: target reachable, but still not the real tiled desktop sessions workflow, so live runtime validation for this exact gesture remains pending.
- Automated verification: `pnpm --filter @dotagents/desktop run pretest && pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` ✅ (`28` tests passed).

### What still needs attention
- This should still be runtime-validated in the real desktop tiled sessions workflow to confirm the new double-click gesture feels discoverable and does not conflict with quick drag starts on the resize edges.
- A nearby follow-up could decide whether width-locked tiles should also surface a tiny post-reset confirmation when the bottom-edge double-click restores only height, since width is intentionally still layout-controlled.
- The broader header-density and panel-versus-tiles allocation threads remain open; this pass improves local tile-size recovery, not cross-surface space competition.

## Iteration 117 - Confirm height-only fit resets when width still follows layout

### Area inspected
- `tiling-ux.md`, especially Iteration 116's still-open note about width-locked bottom-edge resets lacking a post-reset confirmation
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- A practical desktop probe via `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` plus `electron_execute`; the renderer target was reachable, but it still landed on a general chat surface rather than a trustworthy tiled multi-session workflow for direct runtime validation

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on a gap that had not yet been implemented: the width-locked bottom-edge double-click path.
2. Inspect `SessionTileWrapper`'s restore handlers and confirm that bottom-edge double-click already restores height, but does so silently when width remains layout-controlled.
3. Compare that with the nearby tile-level and header-level transient cue patterns to confirm there was already an established visual language for brief explanatory feedback.
4. Try to reach a live desktop renderer before editing; a renderer target was available, but it was not the actual tiled sessions workflow, so the decision stayed grounded in source inspection plus targeted renderer-local verification.

### UX problem found
- In width-locked states, bottom-edge double-click is intentionally asymmetric: it restores only height because width still belongs to the layout.
- That makes the gesture mechanically useful but slightly ambiguous. After the reset, users can see the tile changed height, yet they still get no direct confirmation that width remained layout-managed on purpose rather than being ignored.
- This ambiguity is most likely in stacked compare/grid states and single-row fallback states, where users are already re-orienting around width pressure and missing corner-resize affordances.

### Assumptions made
- A tiny tile-local transient confirmation is acceptable because the ambiguity happens at the tile affordance itself, not at the page header level.
- Reusing the same calm blue pill language already used for other local tiled cues is preferable to adding another persistent control or badge.
- It is acceptable to limit this pass to the width-locked bottom-edge restore path instead of broadening all restore gestures, because this was the specific unresolved ambiguity and the smallest effective fix.

### Decision and rationale
- Added a short-lived tile-local confirmation only when a width-locked tile uses bottom-edge double-click to restore height and the height actually changes.
- The cue reads `Height fit` with a small `Width follows layout` badge so the outcome is explicit: the reset succeeded, but only on the axis users were allowed to change.
- This is better than adding a permanent badge because the explanation matters primarily at the moment of the reset.
- This is better than broadening the cue to all restore gestures because ordinary width/corner restore behavior is already more self-evident and did not need extra chrome.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to add a tiny reusable helper for the locked-width height-reset cue copy.
- Updated the same component to track a short-lived tile-local confirmation state, clear it when new resize gestures begin, and show it only when bottom-edge double-click changes height while width remains layout-locked.
- Rendered the cue near the tile's bottom edge with polite live-region semantics and a compact badge so it stays local to the gesture without permanently adding chrome.
- Expanded `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` to lock in the new cue copy and restore wiring.

### Verification
- Live investigation attempt: `pnpm --filter @dotagents/desktop dev:no-sherpa -- --inspect=9222` brought up an inspectable renderer, but it was still not a trustworthy tiled sessions surface for this exact workflow.
- `pnpm --filter @dotagents/desktop run pretest && pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` ✅ (`30` tests passed)
- `pnpm --filter @dotagents/desktop typecheck` ✅

### Tradeoffs considered
- Relying only on the existing hover hint/title would keep the UI quieter, but it would still leave the completed action slightly ambiguous after the double-click finishes.
- Promoting the explanation into a header-level chip would centralize the message, but it would be less local to the tile action and spend scarce header space on a per-tile interaction.
- Showing the same cue on every restore gesture would improve consistency, but it would also add more transient motion/chrome than the specific ambiguity warrants.

### What still needs attention
- This should still be runtime-validated in the real tiled desktop sessions workflow to confirm the bottom-edge cue appears at the right moment and does not feel redundant during repeated height resets.
- A nearby follow-up could decide whether the cue should compress further on extremely short tiles or very narrow stacked layouts if live use shows the badge wrapping awkwardly.
- The broader header-density and panel-versus-tiles allocation threads remain open; this pass improves one local resize outcome, not cross-surface space competition.

## Iteration 118 - Keep compact tiled headers anchored on layout controls before recovery actions

### Area inspected
- `tiling-ux.md`, especially Iteration 117's note that the broader header-density and panel-versus-tiles allocation thread was still open.
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- A small renderer probe via `electron_execute`; a renderer target was reachable, but it was still not a trustworthy multi-session tiled workflow for validating compact-header wrapping live.

### Repro steps reviewed
1. Re-read the ledger first and deliberately stay on an open area rather than revisiting the recent tile-resize cue work.
2. Inspect the compact sessions header render order in `sessions.tsx`, especially where layout-pressure recovery buttons, single-view browsing controls, and the layout switcher share the same compact row.
3. Confirm that passive pressure chips were already suppressed in cramped headers, but promoted panel/sidebar recovery actions still rendered ahead of the core layout switcher except in a compact Single view special case.
4. Compare that ordering with the product goal: keep layout switching predictable and discoverable even while width pressure is already causing stacked or near-stacked states.

### UX problem found
- In compact tiled headers, pressure-recovery actions such as `Shrink panel`, `Collapse sidebar`, or `Hide panel` could take the leading slot ahead of the core layout controls.
- That makes the layout switcher feel less stable exactly when users are already re-orienting around a cramped sessions area.
- The result is subtle but important: the header spends its clearest position on situational recovery actions instead of the always-relevant control that explains and changes the current tile organization.

### Assumptions made
- On compact headers, layout switching is the more primary control than panel/sidebar recovery actions because it is always relevant to understanding the tiled surface, while recovery actions are conditional suggestions.
- It is acceptable to generalize the existing compact Single view deferral pattern to all compact tiled headers rather than inventing a new special case for compare/grid only.
- Reordering the controls is enough for this pass; a larger visual redesign or dropdown overflow treatment would be a broader change than this local improvement needs.

### Decision and rationale
- Generalized the compact-header ordering rule so any compact sessions header with promoted layout-pressure recovery actions now keeps the core tiled controls ahead of those actions.
- In practice that means compact headers render in this order:
  - focused-session browsing controls (when present)
  - layout mode controls
  - panel/sidebar recovery actions
- This is better than the old compact behavior because the primary tiling affordance stays in a predictable place even when pressure-recovery buttons appear.
- This is better than hiding recovery actions entirely because users still need the recovery paths; they are just visually deferred behind the main organization controls.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to replace the narrow `shouldDeferLayoutPressureActionsInCompactSingleView` check with a broader `shouldDeferLayoutPressureActionsInCompactHeader` rule based on compact width plus the presence of recovery actions.
- Kept the render change local by reusing the existing header row and simply moving layout-pressure actions after the browse/layout control groups in compact states.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the generalized compact-header ordering rule.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` so Single view coverage now points at the generalized compact-header behavior instead of the old special-case name.

### Verification
- Live probe remained limited: `electron_execute` could reach a renderer target, but it still was not a trustworthy compact tiled multi-session workflow for direct runtime validation.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts && pnpm --filter @dotagents/desktop typecheck` ✅

### Tradeoffs considered
- Keeping recovery actions first in compact headers would preserve their urgency, but it continues to displace the main layout control at exactly the moment the layout needs to stay easiest to understand.
- Hiding secondary recovery actions behind a menu would reduce crowding further, but it would add interaction cost and a new abstraction for a problem that ordering alone improves locally.
- Creating a separate compare/grid-only rule would be slightly narrower, but the same compact-header predictability problem also exists in Single view, so the generalized rule is simpler and more coherent.

### What still needs attention
- This should still be runtime-validated in the real desktop tiled sessions workflow to confirm the new ordering feels more stable at narrow widths and does not make recovery actions feel too hidden when they wrap.
- If compact headers still feel crowded in live use, the next likely follow-up is deciding whether the secondary recovery actions need overflow treatment or stronger prioritization beyond simple ordering.
- The broader panel-versus-tiles allocation problem is still not fully solved; this pass improves control order and predictability, not the underlying amount of width available.

## Iteration 119 - Show only the primary recovery action on compact tiled headers

### Area inspected
- `tiling-ux.md`, especially Iteration 118's still-open note about compact headers potentially needing stronger recovery-action prioritization
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts`
- A quick renderer probe via `electron_execute`; the reachable target was still `http://localhost:19007/sessions` showing the generic `Chat` surface rather than a trustworthy tiled multi-session workflow

### Repro steps reviewed
1. Re-read the ledger first and intentionally stay on the still-open compact-header density thread instead of revisiting recent resize or announcement work.
2. Inspect how compact tiled headers derive and render `layoutPressureActionButtons`, especially after the previous pass moved them behind browse and layout controls.
3. Check whether compact headers could still render multiple recovery buttons (`Shrink panel`, `Collapse sidebar`, `Hide panel`) once layout pressure was active.
4. Compare that button density against the decision standard for tiled views: keep organization controls clear and reduce ambiguity rather than merely adding more controls.

### UX problem found
- The previous ordering pass made compact headers more stable, but it could still leave multiple recovery buttons competing for width on the same narrow action row.
- In practice, that meant the sessions toolbar could still ask users to scan several similar width-recovery options right after the layout controls, even though one action was already prioritized in code.
- The result was a narrower but still noisy control strip in the exact window sizes where the sessions surface most needs a single obvious next step.

### Assumptions made
- On compact headers, it is acceptable to surface only one visible recovery action when several are available, because the primary goal is to keep the tiled organization controls legible and predictable.
- Reusing the existing priority sort is acceptable; when multiple actions exist, the first sorted action is already the best available local recommendation or the least disruptive fallback.
- Focused source-backed tests plus desktop renderer typecheck are sufficient for this pass because the available Electron surface was not the real tiled sessions UI and the change is renderer-local.

### Decision and rationale
- Keep the existing recovery computation and prioritization logic unchanged.
- On compact session headers only, collapse the rendered recovery actions down to the first sorted action instead of showing every available button.
- Keep roomy headers unchanged so broader layouts can still expose the fuller recovery set.
- This is better than adding overflow UI right now because it delivers the main clarity win with a very local change and no new interaction model.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `compactHeaderLayoutPressureActionButtons` and `visibleLayoutPressureActionButtons`, so compact headers render only the primary layout-pressure recovery action while roomy headers still render the full list.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new compact-header action slicing and render path.
- Updated `apps/desktop/src/renderer/src/pages/sessions.focus-layout.test.ts` so Single view coverage follows the same compact-header render path.

### Verification
- Live probe remained limited: `electron_execute` could reach a renderer target, but it was still the generic `Chat` surface rather than a trustworthy tiled sessions workflow.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.focus-layout.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅

### Tradeoffs considered
- Leaving all compact recovery actions visible preserves maximum explicitness, but it keeps the narrow toolbar busier than necessary and weakens the existing prioritization logic.
- Moving secondary recovery actions into a new overflow menu could preserve access while saving space, but that would add a new interaction pattern for a problem this smaller prioritization step already improves.
- Hiding recovery actions more broadly on roomy headers would reduce clutter further, but spacious layouts have enough room to support broader recovery visibility without displacing the main tiling controls.

### What still needs attention
- This should still be runtime-validated in a real tiled desktop sessions workflow to confirm that the single compact recovery action feels helpful rather than too restrictive.
- If compact headers still feel crowded in live use, the next likely follow-up is an overflow treatment for the hidden secondary recovery actions rather than another ordering tweak.
- The broader panel-versus-tiles allocation problem remains open; this pass simplifies compact recovery presentation, not the underlying width competition itself.

## Iteration 120 - Keep stacked tile reorder handles self-explanatory after the header hint yields

### Area inspected
- `tiling-ux.md`, especially the older reorder-discoverability note in Iteration 22 and the more recent open panel-vs-tiles density thread
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts`
- A lightweight live renderer probe via `electron_execute`

### Repro steps reviewed
1. Re-read the ledger first and intentionally choose an area that had not been investigated recently: drag/reorder clarity rather than more header-density or resize work.
2. Inspect the reorder affordances in `session-grid.tsx`, including the persistent tile-edge drag handle, drag-state drop markers, and the existing header-level reorder hint.
3. Compare that with Iteration 22's decision to hide the global reorder hint once compare/grid responsively stack into one column.
4. Check whether a real tiled desktop sessions workflow was practically reachable for live validation; `electron_execute` reached `http://localhost:19007/sessions`, but the surface was still the generic `Chat` UI rather than a trustworthy tiled multi-session workflow.

### UX problem found
- The previous reorder work intentionally let the header-level reorder hint disappear in responsive stacked mode so the layout-state chip could take priority.
- In that same stacked state, the remaining tile-level reorder handle stayed mostly low-emphasis and hover-dependent, even though it had become the primary visible reorder affordance.
- That made reorder discoverability weaker exactly where users are already re-orienting around a narrower one-column layout.

### Assumptions made
- It is acceptable to improve the stacked-state reorder affordance at the tile level rather than re-introducing a global header hint, because the earlier decision to prioritize layout-state communication in the header is still correct.
- A stronger resting handle plus a short always-visible label is enough for this pass; adding another badge, tooltip, or overlay would add more chrome than this local discoverability problem needs.
- This is desktop-only work; there is no matching mobile tiled-session reorder surface that requires the same change.

### Decision and rationale
- Keep the header-level reorder hint suppressed in responsive stacked mode.
- In that stacked one-column state, promote each tile's reorder handle instead:
  - keep the label visible without requiring hover
  - shorten the idle label to `Move`
  - give the resting handle a slightly stronger blue-tinted emphasis
- This is better than bringing back the global header hint because it keeps the header focused on explaining the adaptive layout while making the actual local drag affordance easier to notice where users act.
- This is better than a broader drag/reorder redesign because the problem was specifically stacked-state discoverability, and a tile-local emphasis change solves that with much lower churn.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to export `shouldPromoteTileReorderHandle(...)`, deriving when tile-level reorder affordances should be promoted in stacked layouts.
- Updated the same component so stacked compare/grid layouts keep the reorder handle label visible, switch the idle label from `Reorder` to `Move`, and tint the resting handle/icon to stand out more clearly.
- Updated `apps/desktop/src/renderer/src/components/session-grid.narrow-layout.test.ts` with direct assertions for the stacked-state promotion helper.
- Updated `apps/desktop/src/renderer/src/components/session-grid.responsive-reflow.test.ts` with source-level coverage that the promoted stacked-state handle styling and label are wired into the component.

### Verification
- Live probe remained limited: `electron_execute` could reach `http://localhost:19007/sessions`, but it still rendered the generic `Chat` surface rather than a trustworthy tiled sessions workflow for direct reorder validation.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.narrow-layout.test.ts src/renderer/src/components/session-grid.responsive-reflow.test.ts` ✅
- `pnpm --filter @dotagents/desktop typecheck:web` ✅

### Tradeoffs considered
- Restoring the header-level reorder hint in stacked mode would improve discoverability, but it would re-open the exact header-priority problem Iteration 22 intentionally fixed.
- Adding a new tooltip or overlay would make the affordance even more explicit, but it would also spend more visual budget and motion on a problem a stronger resting handle already improves locally.
- Moving the handle inside the tile body could make it more noticeable, but it would compete more directly with tile content and would be a broader layout change than this pass requires.

### What still needs attention
- This should still be runtime-validated in a real tiled desktop sessions workflow to confirm the promoted handle feels easier to notice without reading as too noisy.
- If live use still shows hesitation around drag targets in stacked mode, the next likely follow-up is improving drop-target preview clarity rather than adding more resting chrome.
- The broader panel-versus-tiles allocation and floating-panel intersection threads remain open; this pass improves reorder discoverability inside stacked tiles, not cross-surface width contention.