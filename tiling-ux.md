## Tiling UX investigation ledger

This file is a running investigation and decision ledger for tiled session UX in the desktop app.

## Iteration 2026-03-08 — preserve manual tile sizing during width reflow

### Areas inspected
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-tile.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiles in Compare or Grid.
2. Resize a tile wider or taller with the tile resize affordance.
3. Change available sessions width by collapsing/expanding the sidebar or resizing the floating panel.
4. Observe the tile size after the grid reflows.

### UX problems found
- Width-driven reflow in `session-grid.tsx` recalculated both width and height back to layout defaults when the container width changed by more than 20px.
- That made manual tile resizing feel fragile: a sidebar or floating-panel adjustment could silently erase the user's sizing choice.
- Resetting height during a width-only reflow was especially surprising because the user had not asked to change tile height.

### Investigation notes
- A practical live inspection attempt was made first, but no inspectable Electron target was available in this workflow (`No Electron targets found`).
- The issue was still clearly reproducible from code: the responsive reflow effect called `setSize({ width, height })` with freshly calculated defaults on significant container-width changes.

### Assumptions
- The existing shared/persisted tile size model is intentional for now, so this iteration should not introduce per-tile size persistence.
- Preserving the user's relative width delta across container-width changes is a better UX default than snapping back to the baseline layout width.
- Leaving height untouched during width-only reflow is acceptable because it avoids accidental resets and matches the user's apparent intent more closely.

### Decision and rationale
- Chosen fix: preserve the current tile width relative to the previous layout baseline and only update width during width-pressure reflow.
- Why this is better than the obvious alternative of full reset:
  - it keeps sidebar and floating-panel adjustments from acting like hidden “reset tile size” commands;
  - it maintains responsive adaptation when space changes;
  - it avoids a broader refactor of persistence or per-tile layout state.

### Code changes
- Added `calculateResponsiveTileWidth(...)` in `session-grid.tsx`.
- Updated the responsive width-change effect in `SessionTileWrapper` to preserve width ratio instead of resetting both dimensions.
- Added `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` for targeted coverage.

### Verification
- Static review confirmed the responsive width-change effect now calls `setSize({ width: calculateResponsiveTileWidth(...) })`, so width-driven reflow no longer resets height.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace dependencies in this worktree before Vitest could run (`tsup: command not found` during `build:shared`; `node_modules` is not present).

### Still needs attention
- Drag/reorder discoverability is still subtle because the tile-level drag affordance is easy to miss.
- Resize handles remain low-visibility and could use clearer affordance or feedback.
- The interaction between floating panel resizing and tiled session density still deserves a dedicated UX pass.

## Iteration 2026-03-08 — improve drag/reorder discoverability

### Areas inspected
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with at least two active tiles in Compare or Grid.
2. Without hovering each tile first, scan the grid for the control that allows reordering.
3. Compare the tile-level affordance with the header hint text.

### UX problems found
- The tile drag handle was fully hidden at rest (`opacity-0`) and only appeared on hover, so the reorder affordance was easy to miss during scan.
- The header hint said “Drag to reorder,” but the tile itself did not present a visible grab target until the user already discovered the hover state.

### Assumptions
- A lightly visible, always-present grip is an acceptable amount of extra chrome because reordering is a primary multi-session action.
- Using “grab” language is more specific than generic “drag” language because it points users toward the handle rather than the whole tile.

### Decision and rationale
- Chosen fix: keep the reorder grip visible at low emphasis by default, raise emphasis on hover/focus-within, and align supporting copy around “grab to reorder.”
- Why this is better than the obvious alternative of adding another tutorial-style hint:
  - it improves discoverability at the moment of interaction;
  - it avoids adding more permanent header text or controls;
  - it keeps the change local to existing grid and sessions-page patterns.

### Code changes
- Updated `session-grid.tsx` so draggable tiles expose a muted but always-visible reorder grip with stronger hover/focus feedback.
- Updated `sessions.tsx` reorder hint copy from “Drag” to “Grab” so the hint matches the visible handle.
- Added `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` and updated `sessions.layout-controls.test.ts` expectations.

### Verification
- Static review confirmed the drag grip no longer uses `opacity-0 hover:opacity-100` and now stays visible with muted default emphasis.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/components/session-grid.resize-behavior.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).

### Still needs attention
- Resize handles are still visually subtle compared with the now-improved reorder grip.
- Drop-target feedback could be clearer than the current ring-only treatment, especially in dense grids.
- Focus/maximized transitions could use another pass for state restoration and clearer “back to grid” continuity.

## Iteration 2026-03-08 — improve tile resize affordance clarity

### Areas inspected
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/mobile/src/screens/SessionListScreen.tsx` (scope check only)

### Repro steps
1. Open the sessions page with at least one visible tile in Compare or Grid.
2. Without already knowing the resize hotspot, scan the tile chrome for a cue that width or height can be adjusted.
3. Try to grab the right edge, bottom edge, or bottom-right corner.

### UX problems found
- Tile resize worked technically, but the right and bottom handles were effectively invisible until the pointer happened to cross a very narrow hotspot.
- The corner handle existed, but its visual weight was low enough that resizing remained easy to miss during normal scanning.
- This made resizing feel like a hidden capability rather than a first-class tiled-layout control.

### Investigation notes
- Live app inspection was attempted first via Electron tooling, but no inspectable target was available in this workflow (`No Electron targets found`).
- Code inspection showed the tile handles were implemented as transparent edge overlays with only hover background feedback, so discoverability depended on already being near the hit target.
- Cross-app scope check: mobile uses list/chat screens rather than the desktop tiled session grid, so no equivalent mobile change was needed for this iteration.

### Assumptions
- A faint always-available resize guide is acceptable chrome in the sessions grid because resizing is a primary desktop-only tiled workflow affordance.
- Increasing visible affordance slightly is better than keeping the UI visually cleaner but hiding the capability behind near-invisible hit zones.
- Titles on the resize hit targets are a worthwhile low-cost hint even though the interaction remains pointer-first.

### Decision and rationale
- Chosen fix: keep the resize hit areas local and lightweight, but add subtle visible edge guides plus a clearer bottom-right corner grip with stronger hover/active feedback.
- Why this is better than the obvious alternative of adding another header hint or settings toggle:
  - it improves discoverability exactly where the interaction happens;
  - it does not add more persistent text or controls to the sessions header;
  - it preserves the existing resize behavior and state model while making that behavior easier to understand.

### Code changes
- Updated `session-grid.tsx` right and bottom resize handles to use slightly larger hit targets with low-emphasis visible guide rails.
- Updated the corner resize handle to read more like an intentional grip with stronger hover/active styling.
- Added hover titles for width, height, and corner resize affordances.
- Added `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` to lock in the new visible affordance treatment.

### Verification
- Static review confirmed the resize affordances are no longer purely transparent overlays; they now include persistent guide rails and a more visible corner grip.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).

### Still needs attention
- Drop-target feedback is still lighter than ideal when reordering across dense grids.
- Maximized/single-view restoration could use a clearer continuity cue when returning to grid layouts.
- Floating panel resizing still influences tile density indirectly; that interaction deserves a dedicated pass once a runnable desktop environment is available.

## Iteration 2026-03-08 — recenter the active tile during single-view transitions

### Areas inspected
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Repro steps
1. Open the sessions page with enough tiles to require vertical scrolling.
2. Scroll down so a lower tile is only partially visible.
3. Use the tile maximize control to switch into Single view, or stay in Single view and page to the next/previous session.
4. Observe whether the newly active tile is re-centered or whether the view keeps the old scroll position.

### UX problems found
- Single view reused the existing scroll container, but entering Single view or paging between single-view sessions did not explicitly re-center the newly visible tile.
- That made maximize/pager transitions feel spatially inconsistent: the active tile could inherit a stale scroll offset from the previous grid position.
- Pending continuation tiles were not registered in `sessionRefs`, so the existing tile scroll helper could not target them consistently either.

### Investigation notes
- Live inspection was attempted first via Electron tooling, but there is still no inspectable target available in this workflow (`No Electron targets found`).
- Code inspection showed `scrollSessionTileIntoView(...)` was only used for route deep links, sidebar-driven scroll requests, and continue-session navigation.
- The maximize/single-view path updated `focusedSessionId`, but it did not trigger the same scroll alignment behavior after the visible tile changed.

### Assumptions
- In Single view, snapping the active tile back into view is preferable to preserving a stale outer scroll position because only one session is being emphasized.
- Reusing the existing `behavior: "auto"` centering path is acceptable because it avoids the delayed “yank” behavior already documented in the scroll-navigation code.
- Pending loading/progress tiles should follow the same centering rules as regular session tiles to keep the maximized flow consistent.

### Decision and rationale
- Chosen fix: when Single view is active and the maximized session changes, immediately re-center that tile with the existing `scrollSessionTileIntoView(...)` helper.
- Also register pending tiles in `sessionRefs` so the same centering behavior works for pending follow-up/loading states.
- Why this is better than the obvious alternative of leaving scroll position untouched:
  - it makes maximize and single-view paging feel intentional instead of inheriting previous grid scroll state;
  - it keeps the change local to the sessions page without altering tile layout state or introducing new animation behavior;
  - it reuses the existing, already-hardened scroll helper instead of inventing a second scroll path.

### Code changes
- Added a Single-view effect in `sessions.tsx` that calls `scrollSessionTileIntoView(maximizedSessionId)` whenever the active maximized session changes.
- Wrapped pending progress/loading tiles with ref-tracked containers so they participate in the same scroll targeting as regular session tiles.
- Added a targeted assertion in `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts`.

### Verification
- Static review confirmed the sessions page now recenters the active tile whenever `isFocusLayout` is true and `maximizedSessionId` changes.
- Static review also confirmed pending tiles now set `ref={(el) => setSessionRef(pendingSessionId, el)}` so the centering helper can find them.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.scroll-navigation.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).

### Still needs attention
- Returning from Single view to Compare/Grid could still use a stronger continuity cue beyond the existing “Back to …” button.
- Reorder drop-target feedback remains lighter than ideal in dense layouts.
- Floating panel resizing still deserves a direct UX pass once the desktop app is runnable in this workflow.

## Iteration 2026-03-08 — clarify active reorder drop targets

### Areas inspected
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts`

### Repro steps
1. Open the sessions page with at least two visible tiles in Compare or Grid.
2. Start dragging one tile by its reorder grip.
3. Hover another tile as the drop destination.
4. Observe how clearly the hovered tile communicates that releasing will reorder into that position.

### UX problems found
- The active drop target used a generic blue ring only, which was easy to miss in dense grids.
- The ring also looked close to a focus/selection treatment, so it did not clearly answer “can I drop here right now?”
- During drag, the UI showed where the gesture started more clearly than where it would land.

### Investigation notes
- A quick live inspection was attempted first via Electron tooling, but this workflow still has no inspectable Electron target (`No Electron targets found`).
- Code inspection showed `isDragTarget` only added a ring class on the tile wrapper, with no explicit drag-only destination cue.

### Assumptions
- Extra drag feedback is acceptable when it only appears during an active reorder gesture and does not add permanent chrome at rest.
- A small “Drop to reorder” badge is clearer than relying on color alone because it makes the target state legible even in visually busy tiles.
- Avoiding a more complex insertion-marker model is acceptable for now because wrapped tile grids make before/after indicators less obvious without a broader drag-layout change.

### Decision and rationale
- Chosen fix: strengthen the active drop target with a clearer ring, a dashed inset outline, and a small drag-only “Drop to reorder” badge.
- Why this is better than the obvious alternatives:
  - better than ring-only feedback because it makes the destination state explicit instead of implied;
  - better than adding persistent reorder instructions because it only appears at the moment of need;
  - better than a broader placeholder/insertion refactor because it improves clarity with a small local change.

### Code changes
- Updated `session-grid.tsx` so drag targets use a stronger drop-state ring plus a dashed inset overlay.
- Added a drag-only badge label (`Drop to reorder`) on the active drop target.
- Added `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts`.

### Verification
- Dependency-light source assertions passed against `session-grid.tsx` for the stronger drop-target ring, dashed overlay, and badge copy.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drop-target-feedback.test.ts src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Result: blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).

### Still needs attention
- Returning from Single view to Compare/Grid could still use a stronger continuity cue beyond the existing “Back to …” button.
- Tile content density and hierarchy inside narrow widths still deserve a pass, especially around header/footer crowding.
- Floating panel resizing still deserves a direct UX pass once the desktop app is runnable in this workflow.

## Iteration 2026-03-08 — reduce non-focused tile footer density with a compact follow-up affordance

### Areas inspected
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/components/follow-up-input.submit.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiles visible in Grid or Compare.
2. Look at the footer area of several non-focused tiles at once, especially in narrower window widths or with the sidebar open.
3. Observe how much vertical space and visual emphasis the follow-up composer consumes before the user interacts with a specific tile.

### UX problems found
- Every non-focused tile kept the full follow-up composer visible at rest, which added avoidable visual weight in dense tiled layouts.
- That made it harder for the tile body and recent session content to remain the primary visual focus when several sessions were visible together.
- The `AgentProgress` call site was already passing `preferCompact={!isFocused && !isExpanded}` and `onRequestFocus={onFocus}`, but `TileFollowUpInput` did not implement those props yet, so the intended compact behavior never materialized.

### Investigation notes
- I reviewed the current ledger first and chose tile density/hierarchy because recent iterations had already focused on resizing affordances, single-view recentering, and drag/drop clarity.
- A live desktop inspection was not practical in this workflow because earlier Electron inspection attempts still had no available target, so this pass relied on code inspection and dependency-light verification.
- `TileFollowUpInput` is currently only rendered from `AgentProgress`, which kept the change local to the tiled session workflow.

### Assumptions
- In multi-tile grid states, reducing at-rest composer chrome is better UX than keeping every action fully expanded all the time.
- Preserving the full composer for focused or expanded tiles is important so active work does not feel hidden or delayed.
- A single-row “continue/queue follow-up” affordance is a reasonable middle ground: it keeps intent visible without consuming the full footer height.
- It is acceptable for this first pass to keep the composer expanded after deliberate interaction rather than adding blur-driven auto-collapse heuristics, because the smaller initial-at-rest state delivers most of the density win with lower interaction risk.

### Decision and rationale
- Chosen fix: make `TileFollowUpInput` honor the existing compact intent from `AgentProgress` by rendering a lighter one-line affordance for non-focused, non-expanded tiles until the user engages it.
- The compact row shows a clear text CTA plus a voice shortcut, then expands back into the full inline composer when activated.
- Why this is better than the obvious alternatives:
  - better than leaving the full composer always open because it gives session content more room and clearer hierarchy in dense grids;
  - better than hiding follow-up entirely because it still advertises that continuation is available directly from the tile;
  - better than a broader footer redesign because it uses the existing component boundary and behavior model with a small local change.

### Code changes
- Updated `tile-follow-up-input.tsx` to accept the already-intended `preferCompact` and `onRequestFocus` props.
- Added compact-mode state plus a one-line footer affordance (`Continue in tile…` / `Queue follow-up…`) for non-focused grid tiles.
- Kept the existing full composer behavior for focused/expanded tiles and after compact-mode expansion.
- Collapse the compact composer back to its lighter state after a successful send.
- Updated the tile layout source-assertion test to lock in the `preferCompact={!isFocused && !isExpanded}` wiring.
- Added `apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts`.

### Verification
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts src/renderer/src/components/follow-up-input.submit.test.ts`
- Result: blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).
- Dependency-light verification passed via a Node source-assertion script covering the new compact-mode wiring, compact labels, expansion focus behavior, and the `AgentProgress` compact-mode call site.
- `git diff --check` also passed, with no whitespace or patch-formatting issues.

### Still needs attention
- Returning from Single view to Compare/Grid could still use a stronger continuity cue beyond the existing “Back to …” button.
- The compact tile composer could later gain a deliberate re-collapse behavior after blur/cancel if dense-grid usage suggests it is still too sticky after expansion.
- Floating panel resizing still deserves a direct UX pass once the desktop app is runnable in this workflow.

## Iteration 2026-03-08 — keep Single view from acting like a hidden tile-size reset

### Areas inspected
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`

### Repro steps
1. Open the sessions page with multiple visible tiles in Compare or Grid.
2. Manually resize one or more tiles to a comfortable working size.
3. Enter Single view via the tile maximize affordance or the layout controls.
4. Return to Compare or Grid.
5. Observe whether the previous multi-tile sizing feels remembered or whether Single view behaved like a hidden reset.

### UX problems found
- The shared layout-switching path cleared persisted tile sizing and bumped the tile reset key for every layout change, including transitions into and out of Single view.
- `SessionTileWrapper` also reset width and height on every layout-mode change, so Single view overwrote remembered multi-tile sizing even though the user had only asked to focus one tile temporarily.
- Resize handles remained visible in Single view even though the maximized tile already occupied the full focus layout, which made the state feel less intentional.

### Investigation notes
- I reviewed the existing ledger first and chose this area because “maximized vs grid states” was still called out as needing stronger continuity.
- This pass relied on code inspection and dependency-light verification rather than live Electron inspection because the worktree still does not have a runnable desktop test environment.
- The current tile-size model is still shared/persisted rather than truly per-tile, so this iteration focused on preventing Single view from unnecessarily destroying the remembered multi-tile baseline rather than redesigning persistence.

### Assumptions
- Single view should behave as a temporary focus mode, not as a distinct tile-sizing mode that rewrites the user’s remembered grid/compare sizing.
- Hiding resize handles in Single view is acceptable because the focused tile already fills the available layout; leaving the handles visible would imply a control that is no longer meaningfully useful in that state.
- It is acceptable that this local fix improves remembered sizing continuity without introducing full per-tile persistence for tiles that unmount during Single view, because that broader model change would be a much larger refactor.

### Decision and rationale
- Chosen fix: treat transitions involving Single view as focus-mode transitions that preserve remembered multi-tile sizing instead of clearing/resetting it.
- In `SessionTileWrapper`, render Single view at the layout-calculated full size without mutating the remembered resize state, and hide resize handles while focused.
- Why this is better than the obvious alternative of keeping the old reset behavior:
  - it makes maximize feel like a temporary focus action rather than a destructive layout reset;
  - it preserves more continuity when returning to Compare/Grid after inspecting one session closely;
  - it keeps the change local to existing sessions/grid code instead of introducing a larger persistence abstraction.

### Code changes
- Updated `sessions.tsx` so transitions involving `1x1` no longer clear persisted tile size or bump the shared tile reset key.
- Updated `session-grid.tsx` so layout-mode resets skip transitions into/out of Single view, Single view renders from layout dimensions without rewriting remembered size, and resize handles are hidden while focused.
- Added `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new focus-mode transition behavior.

### Verification
- Dependency-light source assertions passed for the new Single-view transition guard in `sessions.tsx` and the Single-view size-preservation logic in `session-grid.tsx`.
- `git diff --check` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.single-view-preservation.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).

### Still needs attention
- The “Back to …” affordance is now less destructive, but Single view could still use a clearer continuity cue about what context will be restored when exiting.
- Floating panel resizing still deserves a direct UX pass once the desktop app is runnable in this workflow.
- The shared tile-size persistence model still limits how faithfully hidden/unmounted tiles can remember independent sizes across bigger layout changes.

## Iteration 2026-03-08 — make Single view disclose hidden session context

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active sessions.
2. Enter Single view from any tile or from the layout controls.
3. Look at the header chip and the “Back to …” control.
4. Try to answer: how many sessions are currently hidden, and what exactly will happen when leaving Single view?

### UX problems found
- Single view already showed an `x of y` chip, but it still required interpretation rather than explicitly saying that other sessions were hidden behind the focused tile.
- The `Back to …` button named the destination layout, but not the hidden-session context it would restore.
- That left maximize/focus mode slightly ambiguous: it could still feel like a detached mode instead of a temporary narrowed view onto a larger session set.

### Investigation notes
- I reviewed the ledger first and chose this area because earlier iterations had already improved resize affordances, drop targets, and Single-view state preservation, while the continuity cue itself was still called out as unfinished.
- I made one quick live inspection attempt via Electron tooling before editing, but there was still no inspectable target in this workflow (`No Electron targets found`).
- The current focus-layout header already had the right component boundary for a local fix, so this did not require any session-state refactor.

### Assumptions
- Making hidden-session context explicit in Single view is worth a small amount of extra header chrome because it reduces ambiguity around what maximize/focus mode is doing.
- A compact hidden-count pill is preferable to making the restore button itself much wordier, because the context should stay visible even before the user hovers the button.
- On very tight widths, preserving the existing `x of y` chip without an extra hidden-count pill is acceptable because that count still carries the most important signal when space is constrained.

### Decision and rationale
- Chosen fix: add an explicit hidden-session count pill to the Single-view context chip on non-tiny widths, and make the restore button’s accessible label/title describe that it will show the hidden sessions again.
- Why this is better than the obvious alternatives:
  - better than leaving `x of y` as the only cue because it directly names the hidden-state consequence of Single view;
  - better than only changing tooltip copy because the continuity cue stays visible in the main header chrome;
  - better than broad layout copy changes because it keeps the improvement local to the focused-state controls.

### Code changes
- Added `getHiddenSessionCountLabel(...)` and `getRestoreLayoutActionLabel(...)` helpers in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Updated the Single-view context chip to show a dashed hidden-session pill (for example, `3 hidden` / `3 others hidden`) when space allows.
- Updated Single-view title text and restore-button label metadata so the hidden-session restoration behavior is explicit.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the hidden-session disclosure and restore-action wording.

### Verification
- `git diff --check` passed.
- Dependency-light source assertions passed for the new hidden-session chip and restore-action label wiring in `sessions.tsx`.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).

### Still needs attention
- Floating panel resizing still deserves a direct UX pass once the desktop app is runnable in this workflow.
- Single view could later gain a stronger visual relationship between the hidden-session count and the pager controls if user testing suggests the count is still too subtle.
- Dense tile content hierarchy at narrow widths still deserves another pass, especially around footer metadata and clipping.

## Iteration 2026-03-08 — make width-pressure hints explicitly blame a wide sidebar

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/hooks/use-sidebar.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiles in Compare or Grid.
2. Expand the left sidebar well beyond its default width, or reopen the app with a previously wide persisted sidebar.
3. Keep narrowing the remaining sessions area until the header shows `Tight fit` or the layout stacks.
4. Read the recovery hint and try to infer the most likely cause of the width pressure.

### UX problems found
- The stacked and near-stacked hints already suggested several recovery options, but they stayed generic even when the sidebar itself was very likely the dominant cause.
- That made the recovery path less predictable across different sidebar widths: users had to infer whether they should resize the sidebar, resize the floating panel, or just widen the whole window.
- In practice, a wide persisted sidebar can make Compare/Grid feel fragile without the UI clearly naming that pressure source.

### Investigation notes
- I reviewed the existing ledger first and chose this area because recent iterations had already focused on Single-view continuity, tile density, and drag/resize affordances, while sidebar-width behavior still needed a direct pass.
- `app-layout.tsx` passes the live `sidebarWidth` into the sessions page via outlet context, so the existing header-hint logic already had the signal needed for a local fix.
- `use-sidebar.ts` defines a default sidebar width of `176px` with resize up to `400px`, which made it reasonable to treat widths meaningfully above default as likely tile-crowding pressure.
- Live Electron inspection was attempted again, but this workflow still has no inspectable Electron target (`No Electron targets found`).

### Assumptions
- Treating `default + 64px` (240px) as the threshold for “sidebar is likely crowding tiles” is acceptable because it is materially wider than the default without waiting until the sidebar is near its max width.
- It is better UX to name the most likely cause when that cause is strongly suggested by current state, even if the user could also recover by resizing the window or floating panel.
- Keeping the fix copy-only/state-derived, rather than adding a new control, is the right scope for this iteration because the main problem is ambiguity, not missing capability.

### Decision and rationale
- Chosen fix: when Compare/Grid are stacked or near stacking and the sidebar is clearly wider than its normal resting width, switch the existing recovery hint copy to sidebar-specific wording.
- For stacked layouts, the hint now uses action-oriented recovery copy (for example, `Narrow sidebar to compare`).
- For near-stacked layouts, the warning now diagnoses the likely cause more directly (for example, `Sidebar is crowding compare`).
- Why this is better than the obvious alternative of keeping the generic hint:
  - it reduces ambiguity when a persisted wide sidebar is the most plausible culprit;
  - it improves predictability across narrow and wide sidebar states without altering layout behavior;
  - it keeps the change local to existing sessions-page hint logic rather than introducing new layout state or controls.

### Code changes
- Imported `SIDEBAR_DIMENSIONS` into `apps/desktop/src/renderer/src/pages/sessions.tsx` and added a local `SIDEBAR_TILE_PRESSURE_WIDTH` threshold.
- Added sidebar-specific stacked and near-stacked hint copy tables in `sessions.tsx`.
- Updated hint selection so width-pressure hints prefer the sidebar-specific copy when `sidebarWidth` crosses the threshold.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new threshold and sidebar-aware copy paths.

### Verification
- `git diff --check` passed.
- Dependency-light Node source assertions passed for the new sidebar-aware hint logic and the updated source-assertion test file.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Floating panel resizing still deserves a direct UX pass once the desktop app is runnable, especially because the current hint logic can only infer sidebar pressure, not actual floating-panel size.
- Dense tile content hierarchy at narrow widths still deserves another pass, especially around footer metadata and clipping.
- If a future runnable environment is available, the sidebar-pressure threshold should get a quick live sanity check across a few real window widths.

## Iteration 2026-03-08 — make floating-panel resizing visible before hover

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts`

### Repro steps
1. Open the floating desktop panel while tiled sessions are visible in the main sessions page.
2. Try to discover how to make the floating panel narrower or wider so the tiled sessions get more or less room.
3. Scan the panel edges and corners before already knowing where the resize hotspots are.
4. Hover or accidentally cross an edge hotspot and compare that experience with the at-rest state.

### UX problems found
- The floating panel already supported resizing from all edges and corners, but the handles were effectively invisible at rest (`bg-transparent hover:bg-blue-500/30`).
- That made panel resizing feel like hidden knowledge, even though panel width directly changes how much space tiled sessions have in Compare/Grid.
- Unlike the improved tile resize affordances, the panel had no panel-specific hover copy telling the user whether they were resizing width, height, or both.

### Investigation notes
- I reviewed the ledger first and chose this area because it had remained explicitly called out as needing a direct pass, while recent iterations had already focused on tile-level resizing, reorder, and Single-view continuity.
- A quick live Electron inspection was attempted before editing, but this workflow still has no inspectable target (`No Electron targets found`).
- Code inspection showed `PanelResizeWrapper` delegates all resize UX to `ResizeHandle`, whose default visual state stayed transparent until hover.

### Assumptions
- A faint always-visible resize cue on the floating panel is acceptable chrome because resizing the panel is a primary desktop-only layout control that materially affects tiled session density.
- Panel-specific hover titles like `Resize panel width` are worth the extra metadata because they reduce ambiguity without adding permanent instructional text.
- Matching the panel resize affordance philosophy to the newer tile resize affordances is preferable to introducing a separate tutorial or settings toggle.

### Decision and rationale
- Chosen fix: keep the existing edge/corner resize hit targets, but make them legible at rest with subtle guide rails and corner grips, plus explicit panel-resize titles.
- Why this is better than the obvious alternatives:
  - better than keeping the handles transparent because the user can discover resizing before accidentally finding a hotspot;
  - better than adding more header copy because the guidance now appears exactly where the interaction happens;
  - better than a broader panel-layout refactor because it improves a real UX blind spot with a small local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` with visible edge guide rails, clearer corner grips, and panel-specific hover titles for width, height, and corner resizing.
- Added `data-panel-resize-handle` markers so the affordance treatment is easier to lock down in source assertions.
- Added `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts` for targeted coverage.

### Verification
- `git diff --check` passed.
- Dependency-light Node source assertions passed against `apps/desktop/src/renderer/src/components/resize-handle.tsx` for the new guide rails, corner grip, and panel-specific resize titles.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/resize-handle.affordance.test.ts src/renderer/src/pages/panel.recording-layout.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once the desktop app is runnable here, the new panel affordances should get a quick live sanity check against the drag bar, especially along the top edge.
- If panel resizing still feels ambiguous in practice, a future pass could add drag-time feedback about how panel width affects tiled session density.
- Dense tile content hierarchy at narrow widths still deserves another pass, especially around footer metadata and clipping.

## Iteration 2026-03-08 — make compact tile footers clearer under width pressure

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/mobile/src/screens/SessionListScreen.tsx` (scope check only)
- `apps/mobile/src/screens/ChatScreen.tsx` (scope check only)

### Repro steps
1. Open the sessions page with several active tiles visible in Compare or Grid.
2. Keep tiles in their non-focused state so the compact follow-up footer remains active.
3. Narrow the sessions area by reducing window width, widening the sidebar, or keeping the floating panel open.
4. Scan the footer row in several tiles and try to identify session status and context pressure quickly.

### UX problems found
- Compact tile footers still relied on tiny low-emphasis metadata, especially an unlabeled context bar and plain trailing step text.
- Under narrow widths, the footer technically wrapped, but it did not establish enough hierarchy about what mattered most right now.
- The result was a footer that was dense without being especially legible: users had to interpret small fragments instead of scanning a clear status summary.

### Investigation notes
- I reviewed the ledger first and chose this area because recent iterations had already focused on resizing, drag/drop clarity, Single-view continuity, and panel resize affordances, while tile content hierarchy at narrow widths was still explicitly open.
- A quick live Electron inspection was attempted before editing, but there is still no inspectable target available in this workflow (`No Electron targets found`).
- I also did a mobile scope check: mobile currently uses `ChatScreen` and `SessionListScreen` patterns rather than the desktop tile footer, so there was no analogous mobile tiled-footer UI to update in this pass.

### Assumptions
- In dense multi-tile states, compact footers should prioritize explicit status and context pressure over secondary raw metadata.
- Replacing the unlabeled compact context meter with a small labeled chip is acceptable because it trades a little extra chrome for much better scanability.
- A colored status pill in compact mode is preferable to plain step text because it makes approval/error/completion state legible at a glance without expanding the tile.

### Decision and rationale
- Chosen fix: keep the existing detailed footer for focused/expanded tiles, but convert compact footers into labeled chips for context pressure and session status.
- Compact tiles now show an explicit `Context 42%`-style chip instead of a bare meter, plus a stronger status pill such as `Working · 3/10`, `Needs approval`, `Snoozed`, `Failed`, or `Complete`.
- Why this is better than the obvious alternatives:
  - better than leaving the compact footer as-is because the important state is now readable without interpretation;
  - better than removing footer metadata entirely because the user still gets meaningful density-aware feedback in grid view;
  - better than a broader tile redesign because it improves narrow-width clarity with a small local change inside the existing tile footer.

### Code changes
- Added `getCompactTileContextUsagePercent(...)` and `getCompactTileStatusLabel(...)` in `apps/desktop/src/renderer/src/components/agent-progress.tsx`.
- Updated the tile footer so compact/non-focused tiles render labeled context and status chips with tone based on pressure or state.
- Kept the existing detailed footer treatment for focused or expanded tiles.
- Extended `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with targeted source assertions for the new compact-footer treatment.

### Verification
- `git diff --check` passed.
- Dependency-light Node source assertions passed for the new compact footer helpers, chip labels, and updated tile-layout test expectations.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- The compact footer now reads more clearly, but dense tile transcripts may still benefit from slightly stronger separation between “recent activity preview” and “current state” chrome.
- If a runnable desktop environment becomes available, the new compact chips should get a quick live sanity check across a few real sidebar/panel width combinations.
- The legacy `apps/desktop/src/renderer/src/components/session-tile.tsx` footer still has older dense metadata styling if that component becomes user-facing again.

## Iteration 2026-03-08 — separate live tile state from recent history in compact previews

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/mobile/src/screens/ChatScreen.tsx` (scope check only)
- `apps/mobile/src/screens/SessionListScreen.tsx` (scope check only)

### Repro steps
1. Open the desktop sessions page with multiple active tiles visible in Compare or Grid.
2. Keep at least one tile non-focused so it stays in the compact transcript-preview mode.
3. Put that tile into an active state with streaming output or a mid-turn user-response prompt.
4. Narrow the sessions area enough that the compact transcript matters, then scan the tile quickly.

### UX problems found
- Compact tile transcript previews still mixed current/live state items into the same undifferentiated short list as recent history.
- When a tile was actively streaming or awaiting a response, the thing that mattered most right now could visually blend into older transcript items.
- The existing compact hint (`Showing latest ... updates`) also described the list as a generic history preview even when part of the preview was actually live/current state.

### Investigation notes
- I reviewed the ledger first and chose this area because the previous iteration explicitly left transcript hierarchy between recent activity and current state as still open.
- A quick live Electron inspection was attempted before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- Code inspection showed compact tiles were rendering `displayItems.slice(-TILE_TRANSCRIPT_PREVIEW_ITEMS)`, which preserved chronology but did not preserve hierarchy between timestamped history and current-state items.
- Mobile scope check: `ChatScreen` and `SessionListScreen` do not use the desktop tile transcript-preview pattern, so no parallel mobile change was needed.

### Assumptions
- In compact grid previews, surfacing what is happening now is more important than keeping a perfectly flat chronological presentation.
- A small amount of extra chrome (`Live now` / `Recent activity`) is acceptable when it only appears in compact transcript mode and improves scanability.
- This pass should stay local to `AgentProgress` rather than redesigning the full transcript component model.

### Decision and rationale
- Chosen fix: in compact tile mode, render current-state items as a separate `Live now` section ahead of the recent-history preview, and relabel the hidden-history hint to explicitly describe compact clipping.
- Why this is better than the obvious alternatives:
  - better than the old flat last-N list because active streaming/input cues no longer blend into older updates;
  - better than adding more permanent header/footer controls because the hierarchy cue appears directly in the transcript area that needs interpretation;
  - better than a broader transcript refactor because it improves a real scanability issue with a small, local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so compact tile previews derive separate `tilePreviewCurrentStateItems` and `tilePreviewRecentItems` groups.
- Added lightweight `Live now` and `Recent activity` section labels when a compact preview contains active current-state items.
- Replaced the old generic `Showing latest ... updates` banner with an explicit `... hidden in compact view` history-clipping message.
- Extended `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions for the new compact transcript hierarchy.

### Verification
- `git diff --check` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).
- Dependency-light Node source assertions passed against `apps/desktop/src/renderer/src/components/agent-progress.tsx` for the new current-state/history grouping, compact clipping label, and section headings.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- This pass improves hierarchy inside compact tile transcripts, but a runnable desktop environment is still needed to tune how prominent the new section labels feel at real narrow widths.
- The legacy `apps/desktop/src/renderer/src/components/session-tile.tsx` path still has older dense content styling if it becomes user-facing again.
- Floating-panel resizing still deserves a live sanity pass against the sessions page because panel width continues to affect tile density indirectly.

## Iteration 2026-03-08 — make Single-view pager destinations easier to understand

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with at least three active sessions.
2. Enter Single view so only one session tile is visible.
3. Look at the pager controls on the right side of the header and try to predict where the previous/next buttons will take you.
4. Hover the buttons or tab to them, especially when you are already at the first or last visible session in the pager sequence.

### UX problems found
- The Single-view pager buttons were icon-only in every width state, so the controls remained easy to overlook as navigation rather than generic chrome.
- The button labels/tooltips were generic (`Show previous/next session in single view`), so they did not tell the user which adjacent session would open next.
- Disabled edge states were also generic, which made the first/last boundary feel less intentional than it should.

### Investigation notes
- I reviewed the existing ledger first and chose this area because recent iterations had already improved hidden-session disclosure, state restoration, drag/drop clarity, resize affordances, and compact tile hierarchy, while the Single-view pager itself still lacked a stronger continuity cue.
- A quick live Electron inspection was attempted before editing, but this workflow still has no inspectable target (`No Electron targets found`).
- Code inspection showed the current Single-view header already had enough session-order context to label adjacent destinations without introducing new state or controls.

### Assumptions
- On wider headers, adding lightweight `Previous` and `Next` text next to the arrows is acceptable chrome because it improves discoverability for a primary Single-view action.
- On compact headers, preserving the icon-only buttons is the safer default to avoid crowding, as long as tooltip and accessibility copy become more descriptive.
- Naming the adjacent session in tooltip/ARIA metadata is a worthwhile local improvement even before a future live UX pass can decide whether stronger in-flow destination previews are needed.

### Decision and rationale
- Chosen fix: keep the existing pager structure, but make it communicate intent better by showing visible `Previous` / `Next` labels on wider headers and destination-aware labels/tooltips for both buttons.
- Disabled states now explicitly say when the user is already at the first or last session in Single view.
- Why this is better than the obvious alternatives:
  - better than keeping the old generic icon-only treatment because the pager reads more clearly as navigation at a glance;
  - better than adding a larger new destination-preview control because it improves clarity with minimal extra chrome;
  - better than only changing screen-reader copy because wide-header users now get a visible discoverability improvement too.

### Code changes
- Added `getSingleViewBrowseActionLabel(...)` in `apps/desktop/src/renderer/src/pages/sessions.tsx` to describe adjacent-destination and boundary states.
- Added a local `getFocusableSessionLabel(...)` helper so the pager can name previous/next sessions consistently, including pending sessions.
- Updated the Single-view pager buttons to use descriptive `aria-label`/`title` metadata and show visible `Previous` / `Next` labels when the header is not compact.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new pager-labeling behavior.

### Verification
- `git diff --check` passed.
- Dependency-light Node source assertions passed for the new Single-view pager helper, destination-aware labels, visible wide-header button text, and updated layout-controls test coverage.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once a runnable desktop environment is available, the wider-header `Previous` / `Next` labels should get a quick visual sanity check against very tight-but-not-compact widths.
- If Single view still feels disorienting in practice, a future pass could explore stronger in-flow destination previews or keyboard browsing cues.
- Floating-panel resizing still deserves a live sanity pass against the sessions page because panel width continues to affect tile density indirectly.

## Iteration 2026-03-08 — keep Single-view restore readable on very compact headers

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active sessions.
2. Enter Single view.
3. Narrow the sessions area until the header reaches its very compact state.
4. Compare the restore affordance with the nearby layout selector buttons.
5. Try to answer which control exits Single view immediately versus which controls simply select layout modes.

### UX problems found
- In the very compact Single-view header, the restore control collapsed to a layout icon-only button.
- That made the restore affordance visually compete with the nearby layout selector, because both surfaces used layout-mode icons in the same control cluster.
- The result was avoidable ambiguity right at the moment users need continuity most: leaving Single view could look like just another layout-choice button instead of a clear “go back to my previous tiled context” action.

### Investigation notes
- I reviewed the ledger first and chose this area because recent iterations had already improved hidden-session disclosure and pager labeling, but the restore affordance itself was still ambiguous on very compact widths.
- A quick live inspection attempt was made again before editing, but this workflow still has no inspectable Electron target (`No Electron targets found`).
- Code inspection showed the restore button used `<restoreLayoutOption.Icon />` and hid all visible text when `isVeryCompactSessionHeader` was true, which explains why it could read like a duplicate layout selector.

### Assumptions
- On very compact headers, a short visible `Back` label is worth the extra width because restoring the previous tiled context is a higher-priority action than preserving a purely icon-only control.
- Using a back arrow is a better visual language for this control than reusing a layout-mode icon, because the user intent is restore/navigation rather than direct mode selection.
- It is acceptable to keep the existing detailed tooltip and ARIA label as the place where the exact destination layout and hidden-session behavior remain fully spelled out.

### Decision and rationale
- Chosen fix: make the Single-view restore button read as a back/restore action by switching it to a left-chevron affordance and keeping a visible label even on very compact headers (`Back` when space is tight, `Back to Compare/Grid` otherwise).
- Why this is better than the obvious alternatives:
  - better than the old icon-only layout glyph because it distinguishes restore from the nearby layout buttons at a glance;
  - better than only changing tooltip copy because the ambiguity happened in the visible control cluster before hover;
  - better than a broader header refactor because it improves a real continuity issue with a small, local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `restoreLayoutButtonLabel` from header width state.
- Changed the Single-view restore button to use `ChevronLeft` instead of the destination layout icon.
- Kept a visible `Back` label on very compact headers and `Back to …` on wider headers.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` to lock in the new compact restore-label and back-arrow behavior.

### Verification
- Dependency-light source assertions passed for the new `restoreLayoutButtonLabel` helper, `ChevronLeft` restore affordance, and updated layout-controls assertions.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.
- I did not repeat another `vitest` run in this iteration because earlier targeted attempts in this worktree were already blocked by missing workspace test dependencies, and repeating the same failure would not add useful signal.

### Still needs attention
- Once a runnable desktop environment is available, this restore control should get a quick live sanity check against the pager and layout selector at the tightest non-overflow widths.
- If Single view still feels dense in practice, a future pass could prioritize or collapse lower-value header pills before navigation/restore controls compete for space.
- Floating-panel resizing still deserves a live sanity pass against the sessions page because panel width continues to affect tile density indirectly.

## Iteration 2026-03-08 — slim compact Single-view context chrome around restore and pager controls

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active sessions.
2. Enter Single view.
3. Narrow the sessions area until the header is compact but not fully collapsed.
4. Compare the Single-view context chip on the left with the restore button, pager, and layout controls on the right.
5. Check whether the low-priority hidden-session chip feels worth the width it consumes in that tighter state.

### UX problems found
- The compact Single-view header still spent width on a secondary hidden-session pill even after recent work made restore and pager controls clearer.
- In that tighter state, the most important actions are leaving Single view, browsing adjacent sessions, or switching layout — not re-reading a second badge that mostly duplicates information already implied by the `x of y` count.
- The result was avoidable header density right where the control cluster needs to stay obvious and stable.

### Investigation notes
- I reviewed the latest ledger first and deliberately picked the open follow-up from the previous iteration rather than revisiting resize or drag work again.
- I made another quick live Electron inspection attempt before editing, but this workflow still has no inspectable target (`No Electron targets found`).
- Code inspection showed the Single-view context chip still rendered both the position pill and the compact hidden-session pill on compact headers, even though the restore button title/ARIA metadata already carried the hidden-session restoration context.

### Assumptions
- On compact Single-view headers, preserving primary navigation/restore clarity is more important than keeping every piece of context visible as separate chrome.
- A compressed position label like `2/5` is acceptable on compact widths because the tooltip continues to spell out the full `2 of 5` meaning.
- It is acceptable to move the hidden-session count out of the visible compact chip because that context still remains available in the chip tooltip and the restore-action label.

### Decision and rationale
- Chosen fix: on compact Single-view headers, prioritize the primary control cluster by slimming the context chip to a tighter position-only treatment.
- The chip now compresses its visible position label from `x of y` to `x/y` and suppresses the lower-priority hidden-session pill while the header is compact.
- Why this is better than the obvious alternatives:
  - better than leaving the old compact chip as-is because it frees width exactly where restore/pager/layout controls compete for attention;
  - better than hiding the context chip entirely because the user still keeps a clear sense of where they are in the Single-view sequence;
  - better than a broader header refactor because it improves readability with a very small, local change.

### Code changes
- Added `shouldPrioritizeSingleViewHeaderControls` in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Added `focusedLayoutSessionPositionLabel` so compact Single view renders `x/y` while wider states keep `x of y`.
- Suppressed the visible compact hidden-session pill when that compact-priority mode is active, while keeping the richer tooltip/title context.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` source assertions for the new compact-priority behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- Dependency-light Node source assertions passed for the new compact-priority header flag, compressed `x/y` label, hidden-pill suppression guard, and tighter chip gap treatment.
- I did not repeat another `vitest` run in this iteration because earlier targeted attempts in this worktree were already blocked by missing workspace test dependencies, and repeating the same failure would not add useful signal.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once a runnable desktop environment is available, this compact Single-view header should get a quick visual sanity check around the exact breakpoint where pager buttons switch to icon-only.
- If the header still feels crowded in live use, a future pass could consider making the layout selector itself slightly more compact before further reducing session-context cues.
- Floating-panel resizing still deserves a live sanity pass against the sessions page because panel width continues to affect tile density indirectly.

## Iteration 2026-03-08 — add drag-time panel width impact feedback for tiled session density

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts`

### Repro steps
1. Open the floating panel while tiled sessions are visible in the desktop app.
2. Drag the panel's left/right or corner resize handles to change panel width.
3. Watch the resize affordance while deciding whether to make the panel wider for panel content or narrower to preserve tiled-session room.
4. Compare that interaction with the sessions page, where tile density changes indirectly as available space changes.

### UX problems found
- The panel resize handles were now visible and discoverable, but width resizing still lacked any explicit cue that it trades against room available for tiled sessions.
- That made the interaction more trial-and-error than necessary: users could resize successfully without getting any immediate help interpreting whether they were helping or hurting tiled-session density.
- Height-only and width-affecting drags also looked equally generic during the gesture, even though width changes are the ones that intersect with the tiled workflow most directly.

### Investigation notes
- I reviewed the latest ledger first and chose this area because it was still listed as open while several recent iterations had already focused on sessions-page header density.
- I made another quick live Electron inspection attempt before editing, but this workflow still has no inspectable target (`No Electron targets found`).
- Code inspection showed `PanelResizeWrapper` already tracks `currentSize` and drag lifecycle, which made it possible to add contextual drag-time feedback without introducing new state plumbing outside the existing panel resize path.
- `ResizeHandle` is only rendered from `PanelResizeWrapper` in the current desktop code, so extending the `onResizeStart` callback to include the active handle position stayed local and low-risk.

### Assumptions
- A small drag-time status pill is acceptable inside the floating panel because it only appears while resizing and directly supports the user's current gesture.
- Users benefit more from outcome-oriented language (`More room for tiled sessions` / `Less room for tiled sessions`) than from a purely technical width delta.
- It is acceptable to keep height-only drags free of this hint because those gestures do not meaningfully change tiled-session width and do not need extra tiling-related explanation.

### Decision and rationale
- Chosen fix: show a compact drag-time hint only during width-affecting panel resize gestures, using neutral copy near the starting width and switching to clearer positive/caution states once the drag meaningfully narrows or widens the panel.
- The hint also shows the live panel width so users get immediate feedback about the current size they are converging on.
- Why this is better than the obvious alternatives:
  - better than relying on handle visibility alone because it explains the tiling consequence during the gesture, not just where to drag;
  - better than a permanent badge because the information matters mainly while resizing and would otherwise add idle chrome;
  - better than wiring sessions-page state into the panel because the interaction can be clarified locally with existing resize state.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` to export `ResizeHandlePosition` and pass the active handle position through `onResizeStart`.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to:
  - track the active resize handle,
  - distinguish width-affecting handles from height-only handles,
  - show a temporary `data-panel-resize-impact-hint` pill while width resizing,
  - switch its copy between `More room for tiled sessions`, `Less room for tiled sessions`, and a neutral `Panel width affects tiled session space`,
  - display the live `Panel … px wide` width readout during the drag.
- Added `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with dependency-light source assertions that lock in the new width-impact messaging and callback wiring.

### Verification
- A targeted Node source-assertion pass succeeded for the new `ResizeHandlePosition` callback wiring, width-affecting resize guard, drag-time hint copy, data attribute, and live width readout.
- `git diff --check -- apps/desktop/src/renderer/src/components/resize-handle.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.
- I did not repeat another `vitest` run in this iteration because earlier targeted attempts in this worktree were already blocked by missing workspace test dependencies, and repeating the same failure would not add useful signal.

### Still needs attention
- Once a runnable desktop environment is available, this drag-time hint should get a quick sanity check for exact placement against the panel drag bar and against very small panel heights.
- If live use shows the pill is helpful but too subtle, a future pass could reinforce width-dominant drags further with a slightly stronger cursor-adjacent or edge-highlight treatment.
- The sessions page still deserves a live end-to-end check at different sidebar widths so the combined effect of sidebar width, panel width, and tiling density can be judged visually rather than only from code.

## Iteration 2026-03-08 — condense the compact Single-view layout selector without hiding the current mode

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with multiple active sessions.
2. Enter Single view.
3. Narrow the sessions area until the header is compact but not at the smallest icon-only breakpoint.
4. Compare the right-side control cluster: restore button, previous/next pager, and layout selector.
5. Check whether the layout selector is taking more width than it needs relative to the higher-priority restore and browsing actions.

### UX problems found
- The compact Single-view header already slimmed its context chip and pager labels, but the layout selector still showed text labels on all three layout buttons.
- That meant the lowest-priority part of the right-side cluster still consumed width even when restore and session browsing needed to stay stable and readable.
- Hiding all layout labels would have reduced width, but it would also have made the current mode harder to scan at the exact moment layout context still matters.

### Investigation notes
- I reviewed the latest ledger first and chose this as the next local improvement because the previous compact-header iteration explicitly left the layout selector itself as the next likely place to recover width.
- I made another quick live Electron inspection attempt before editing, but this workflow still has no inspectable target (`No Electron targets found`).
- Code inspection showed the layout selector already had the right component boundary and compact-breakpoint state to support a small local change without introducing new layout state.

### Assumptions
- On compact Single-view headers, restore and pager controls should get priority over showing full text labels on every layout button.
- Keeping the active layout button labeled is a better balance than making the whole selector icon-only, because it preserves clear current-mode visibility while still reclaiming width.
- It is acceptable for this condensing behavior to apply only in compact Single view, not in all compact compare/grid states, because the restore+paging competition is what makes this width pressure especially meaningful.

### Decision and rationale
- Chosen fix: when compact Single-view header controls are being prioritized, condense the layout selector so only the active layout button keeps its visible label while inactive buttons become icon-only.
- Why this is better than the obvious alternatives:
  - better than leaving all three labels visible because it frees width where restore and paging need it most;
  - better than hiding every label because the current layout still remains readable at a glance;
  - better than a broader header refactor because it improves a specific crowded state with a small local change.

### Code changes
- Added `shouldCondenseLayoutSelector` in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Updated the layout selector so compact Single-view headers hide labels on inactive layout buttons but keep the active one labeled.
- Updated button spacing to follow the per-button label visibility instead of a single all-or-nothing label rule.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` source assertions for the new compact-selector behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- A targeted Node source-assertion script passed for the new compact-selector guard, active-only label fallback, per-button spacing logic, and updated test coverage.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once a runnable desktop environment is available, this compact selector should get a quick visual sanity check right around the compact/non-compact breakpoint to confirm the active-only label feels balanced.
- If the right-side control cluster still feels crowded in practice, the next small step should probably be tuning button padding rather than hiding more layout context.
- The broader end-to-end interplay among sidebar width, panel width, and tiled-session density still needs a live pass when the desktop app is runnable here.

## Iteration 2026-03-08 — make the temporary one-visible tiled state actually expand the lone tile

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`

### Repro steps
1. Open the desktop sessions page in Compare or Grid mode.
2. End up with exactly one visible tile while keeping the selected layout in Compare or Grid.
3. Read the current-layout chip, which says the tile is “Expanded for one visible session.”
4. Compare that promise with the tile footprint and resize affordances on screen.

### UX problems found
- The sessions header already described the one-visible-tile state as expanded, but `session-grid.tsx` still sized Compare/Grid tiles from the normal multi-column layout math.
- In practice, that meant a lone visible tile could still render at half-width in Compare and half-width/half-height in Grid, leaving awkward empty space.
- The resize handles also remained visible in that temporary state even though the tile was supposed to be behaving like a focused single tile, which made the interaction harder to predict.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a still-open tile-footprint issue instead of doing another compact-header pass.
- Code inspection showed `sessions.tsx` already computes `isTemporarySingleVisibleLayout` from `visibleTileCount === 1`, while `SessionGrid` already receives `sessionCount`, but the grid rendering path was not using that information.
- A quick live inspection probe was attempted again, but the workflow still has no inspectable Electron target (`No Electron targets found`).

### Assumptions
- When Compare or Grid temporarily has only one visible tile, users benefit most if that tile fills the focus footprint without changing their remembered multi-tile layout preference.
- In that temporary state, hiding resize handles is preferable to leaving them visible, because the dominant interaction should read as “temporarily expanded” rather than “still actively resizable as a split tile.”
- It is acceptable to restore the `SessionGrid` measurement callback/types that `sessions.tsx` already expects while touching this boundary, because that keeps the adaptive-layout header logic coherent without a broader refactor.

### Decision and rationale
- Chosen fix: treat the non-Single one-visible-tile case as a temporary rendered focus footprint inside `SessionTileWrapper`, while leaving the underlying remembered Compare/Grid sizing untouched.
- Why this is better than the obvious alternatives:
  - better than only changing copy because the existing wording was already promising expansion and the layout needed to become truthful;
  - better than switching the selected layout mode to Single automatically because that would blur the difference between a temporary visibility state and the user’s chosen layout preference;
  - better than leaving resize handles visible because a temporarily expanded tile should not advertise split-tile resizing controls that no longer describe the rendered state well.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to carry `sessionCount` through grid context.
- Added a temporary `isTemporarySingleVisibleLayout` path so a lone visible Compare/Grid tile renders with the `1x1` footprint while preserving remembered multi-tile sizing underneath.
- Suppressed resize handles while that temporary expanded state is active.
- Restored `SessionGridMeasurements`, `onMeasurementsChange`, and `isResponsiveStackedTileLayout(...)` exports that the sessions page already expects from the same grid boundary.
- Updated `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with focused coverage for the new temporary-expansion and stacked-threshold behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- A targeted Node source-assertion pass succeeded for the restored measurement exports/callback, the temporary one-visible expansion guard, the rendered focus footprint, the resize-handle suppression, and the updated tests.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once a runnable desktop environment is available, this one-visible-tile state should get a quick visual sanity check in both Compare and Grid, especially when the lone tile is collapsed versus expanded.
- If the temporary expanded state still feels surprising in live use, a future pass could add a more explicit inline cue near the layout chip that this is a temporary visibility-driven expansion rather than a layout-mode switch.
- The broader end-to-end interplay among sidebar width, panel width, and tiled-session density still needs a live pass when the desktop app is runnable here.

## Iteration 2026-03-08 — make sidebar resizing easier to discover and tie it to tiled-session space

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/hooks/use-sidebar.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiles in Compare or Grid.
2. Widen the left sidebar until the sessions area feels crowded, or scan the sidebar edge to try to find the resize affordance before already knowing where it is.
3. Compare the width-pressure hint in the sessions header with the actual sidebar edge treatment.
4. Start dragging the sidebar wider or narrower and observe how much feedback the UI gives about the effect on tiled sessions.

### UX problems found
- The sessions page had already become better at blaming a wide sidebar when Compare/Grid felt crowded, but the actual sidebar resize affordance was still just a very thin hover-first strip.
- That meant the UI could diagnose the problem without making the recovery control especially discoverable.
- During an active sidebar drag, there was no direct outcome-oriented feedback about whether the gesture was giving tiled sessions more room or less room.

### Investigation notes
- I reviewed the ledger first and chose this area because recent iterations had already touched tile resize affordances, panel resize feedback, Single-view continuity, and dense tile hierarchy, while the main sidebar control itself had not received the same affordance pass.
- `sessions.tsx` already consumes `sidebarWidth` through outlet context, which made it clear the product intent already treats sidebar width as an important tiled-layout variable.
- A live Electron inspection was not practical in this workflow because there is still no inspectable desktop target available.

### Assumptions
- A subtle always-visible sidebar edge rail is acceptable chrome because sidebar width is a primary desktop layout control that materially changes tiled-session density.
- Drag-time copy should stay outcome-oriented (`More room for tiled sessions` / `Less room for tiled sessions`) rather than reading like raw implementation detail.
- Keeping this change local to the sidebar shell is a better scope than adding more sessions-header copy, because the affordance problem lives at the control itself.

### Decision and rationale
- Chosen fix: make the sidebar resize edge visible at rest, increase its hit target slightly, and add a drag-only hint bubble that explains how the current drag affects tiled-session space.
- Why this is better than the obvious alternatives:
  - better than another header hint because the user gets guidance exactly where they resize;
  - better than leaving the edge nearly invisible because it improves recovery discoverability for a width-pressure problem the app already knows how to describe;
  - better than a broader sidebar redesign because it improves clarity with a small local change in existing layout plumbing.

### Code changes
- Extended `use-sidebar.ts` with a lightweight live `resizeDelta` signal so the shell can tell whether the active drag is widening or narrowing the sidebar.
- Updated `app-layout.tsx` to show a visible low-emphasis sidebar resize rail even before hover, with a slightly larger hit area.
- Added a drag-only status bubble (`Less room for tiled sessions` / `More room for tiled sessions`) plus the current sidebar width readout when resizing on tiled-session routes.
- Added `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` to lock in the new wiring and affordance markers with dependency-light source assertions.

### Verification
- Attempted targeted verification with `pnpm exec vitest run src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` from `apps/desktop`, but it was blocked because local test dependencies are not installed in this worktree (`Command "vitest" not found`).
- Attempted a renderer typecheck with `pnpm exec tsc --noEmit -p tsconfig.web.json --pretty false`, but it was blocked because the inherited `@electron-toolkit` base config is unavailable in this workspace.
- A dependency-light Node source-assertion script passed for the new `resizeDelta` state, drag-time tiled-session impact copy, width readout, and sidebar resize data markers.
- `git diff --check` passed.

### Still needs attention
- The sidebar handle is now more discoverable, but the sessions page still cannot reason about actual floating-panel width directly from shared layout state; that broader cross-window interaction still deserves a live pass.
- If a runnable desktop environment becomes available, the new sidebar resize bubble should get a quick sanity check across very narrow windows to ensure it does not feel too intrusive.
- Dense tile transcript/body hierarchy at extreme narrow widths is still worth another pass after the major resize affordances are easier to find.

## Iteration 2026-03-08 — make clipped compact transcript history easier to recover

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiles so one or more sessions render as non-focused compact tiles.
2. Let a session accumulate enough transcript history that older updates are clipped in compact view.
3. Scan the transcript preview notice and try to understand how to reveal the hidden history from inside the tile body.

### UX problems found
- The compact transcript banner only said that earlier updates were hidden, but it did not tell the user what action would reveal them.
- The transcript area already stops click bubbling in tile mode so scrolling and inner controls do not accidentally trigger tile focus, which also means the most obvious area to click did not naturally recover the full transcript.
- That left clipped history feeling more like unexplained overflow than an intentional compact preview state.

### Investigation notes
- I reviewed the ledger first and chose this area because the previous iteration explicitly called out dense tile transcript/body hierarchy at extreme narrow widths as still unresolved.
- Code inspection in `agent-progress.tsx` confirmed the message-stream region uses `onClick={(e) => e.stopPropagation()}` while the hidden-history treatment was only passive copy.
- A live Electron inspection was still not practical in this workflow because there is no inspectable desktop target available.

### Assumptions
- Focusing the tile is the right recovery action for hidden transcript history because it preserves the existing grid/focus mental model instead of introducing another expansion mode inside compact tiles.
- Adding a small explicit CTA inside the existing banner is preferable to changing all transcript-body click behavior in one pass.
- Keeping the fix local to the compact history notice is acceptable because the main UX failure here was ambiguity, not missing transcript data.

### Decision and rationale
- Chosen fix: turn the hidden-history notice into an explicit recovery affordance that explains the outcome (`see the full transcript`) and provides a direct `Focus tile` action.
- Why this is better than the obvious alternatives:
  - better than passive copy because it tells the user exactly how to recover clipped history;
  - better than auto-expanding compact content because it avoids surprising layout changes inside dense grids;
  - better than a broader click-behavior rewrite because it improves discoverability with a small, low-risk local change.

### Code changes
- Added `handleCompactTranscriptFocus(...)` in `agent-progress.tsx` to route the compact transcript CTA back through the existing tile focus behavior.
- Reworked the hidden compact-history banner into a wrapped notice with explicit guidance (`Focus this tile to see the full transcript.`) plus a small `Focus tile` button.
- Added a targeted source-level assertion in `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the new affordance and copy.

### Verification
- Attempted targeted verification with `pnpm exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` from `apps/desktop`, but it was blocked because local test dependencies are not installed in this worktree (`Command "vitest" not found`).
- A dependency-light Node source-assertion script passed for the compact transcript focus handler, explanatory copy, button label, and updated banner layout.
- `git diff --check` passed.

### Still needs attention
- Once a runnable desktop target is available, this CTA should get a quick live sanity check to confirm the banner/button balance still feels calm in very small tiles.
- A future pass could decide whether compact transcript content itself should partially focus the tile on click, but that is broader interaction scope than this iteration.
- Summary-tab density and transcript hierarchy inside extremely narrow non-focused tiles are still worth another pass after this recovery affordance has been lived with.

## Iteration 2026-03-08 — condense narrow tile summary cards so summary mode wastes less width and height

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiles so at least one tile stays non-focused and compact.
2. Switch that tile to the `Summary` tab after the agent has produced multiple step summaries.
3. Look at the summary cards in a narrow tile, especially the header row containing timestamp, step, importance, and `Save`.
4. Compare how much room the summary-card chrome takes versus the actual summary text and findings.

### UX problems found
- The tile summary tab reused the roomy full-size summary card layout even in narrow, non-focused tiles.
- The text `Save` / `Saved` button was one of the first controls to crowd the card header, which pushed useful content downward and made summary mode feel heavier than chat mode in the same tile footprint.
- Expanded summary details also kept a larger left gutter and padding budget that read fine in wider views but spent too much scarce width in compact tiles.

### Investigation notes
- I reviewed the ledger first and chose this area because the previous iteration explicitly left summary-tab density in extremely narrow non-focused tiles as still open.
- `agent-progress.tsx` already knows when a tile is in its compact non-focused state (`!isFocused && !isExpanded`), which made it possible to scope this change to dense tiled contexts without affecting focused or overlay summaries.
- `agent-summary-view.tsx` already contains the summary-card boundary, save action, highlight block, and latest-activity footer, so the density problem could be improved locally rather than by changing tile-level state or behavior.
- Live Electron inspection was still not practical in this workflow because there is no inspectable desktop target available.

### Assumptions
- In compact tiles, the `Save summary to memory` action is secondary enough that an icon-only button is acceptable as long as tooltip and ARIA copy remain explicit.
- Focused tiles and overlay summaries should keep the fuller summary layout, because those states trade density for richer inspection intentionally.
- Reducing gutters and padding in compact summary mode is preferable to shrinking the summary text aggressively, because readability matters more than preserving generous whitespace in these dense tiles.

### Decision and rationale
- Chosen fix: add a compact summary mode for non-focused tile summaries only, then use it to slim summary-card chrome rather than changing the summary model or removing actions.
- The compact mode makes the save action icon-only with explicit accessibility metadata, tightens card/header spacing, reduces expanded-detail gutters, and trims summary-container/highlight padding.
- Why this is better than the obvious alternatives:
  - better than removing the save action because memory capture remains available without dominating the card header;
  - better than shrinking all summary text because the main problem was chrome density and wasted gutter space, not the content itself;
  - better than changing overlay/focused summary layouts too because the issue was specific to narrow tiled contexts.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to derive `shouldUseCompactTileSummaryView` and pass `compact` styling into the tile summary tab with slightly tighter container padding.
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` to:
  - accept a new `compact` prop,
  - render summary cards with tighter compact spacing,
  - use icon-only `Save` / `Saved` controls in compact mode with descriptive tooltip and ARIA labels,
  - reduce expanded-detail gutters and compact-only highlight/footer padding.
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` and `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions for the new compact-summary wiring and density treatment.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for the new compact summary prop, icon-only accessible save button, reduced expanded gutters, compact latest-activity padding, and tile summary compact-mode wiring.
- I did not repeat another `vitest` run in this iteration because earlier targeted attempts in this worktree were already blocked by missing workspace test dependencies, and repeating the same failure would not add useful signal.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once a runnable desktop target is available, this compact summary mode should get a quick visual sanity check to confirm the icon-only save action feels discoverable enough in very narrow tiles.
- If summary mode still feels heavier than chat mode in practice, the next likely local improvement is the tab switcher itself or the `Important Findings` block, not the summary-card content model.
- Transcript hierarchy and summary-tab balance in extreme narrow-width tiles still deserve a live end-to-end pass after more of the sessions page becomes inspectable here.

## Iteration 2026-03-08 — keep Compare/Grid layout switching from acting like a hidden width reset

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles in Compare.
2. Manually resize one or more tiles wider than the default split width.
3. Switch the layout to Grid, then back to Compare.
4. Observe whether the tile width feels remembered or whether the layout switch silently snaps it back.

### UX problems found
- Compare and Grid already share the same two-column width math, but switching between them still cleared persisted tile size and reset width/height to layout defaults.
- That made layout switching feel more destructive than necessary: choosing a different organization mode could silently discard a manual width preference even though the column footprint itself did not fundamentally change.
- This was especially at odds with the broader tiling goal of reducing accidental layout resets.

### Investigation notes
- I reviewed the ledger first and chose layout switching because recent iterations had already covered drag/drop affordances, resize discoverability, panel/sidebar resize feedback, and Single-view continuity.
- Code inspection showed `handleSelectTileLayout(...)` in `sessions.tsx` clears the shared persisted tile size for every non-Single transition.
- `SessionTileWrapper` in `session-grid.tsx` also reset both width and height on every non-Single layout-mode change, even though Compare and Grid both render as two columns.
- A quick live Electron inspection was still not practical in this workflow because no inspectable desktop target is available.

### Assumptions
- Preserving manual tile width across Compare/Grid switches is a better default than resetting width because both layouts use the same two-column width model.
- Height should still adapt to the chosen layout's row model, so preserving width does not imply preserving height.
- It is acceptable to keep the existing stronger reset behavior for other transitions (especially those involving Single view), because those transitions materially change the tile footprint or interaction mode.

### Decision and rationale
- Chosen fix: treat Compare ↔ Grid as a width-continuity transition.
- In the sessions page, skip the shared persisted-size clear/reset when switching between those two layouts.
- In `SessionTileWrapper`, when the layout change is Compare ↔ Grid, reset only height and preserve the current width.
- Why this is better than the obvious alternatives:
  - better than keeping the full reset because layout switching no longer behaves like a hidden width wipe;
  - better than preserving both width and height because Grid vs Compare still need different vertical footprints;
  - better than introducing a broader new persistence model because this improves a clear UX issue with a small local change.

### Code changes
- Added `shouldPreserveTileWidthAcrossLayoutChange(...)` in `apps/desktop/src/renderer/src/components/session-grid.tsx`.
- Updated `SessionTileWrapper` so Compare/Grid transitions preserve width while still resetting height for the new layout.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so Compare/Grid transitions no longer clear persisted tile size or bump the shared tile reset key.
- Extended `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with a focused helper test.
- Extended `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new guard and width-preserving behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- A targeted Node source-assertion script passed for the new Compare/Grid width-preservation helper, the sessions-page reset guard, the width-preserving `setSize(...)` branch, and the updated tests.
- I did not repeat another `vitest` run in this iteration because repeated earlier attempts in this worktree were already blocked by missing local test dependencies, and retrying the same unavailable command would not add useful signal.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once a runnable desktop target is available, Compare ↔ Grid switching should get a quick live sanity check to confirm the preserved width still feels natural when multiple tiles have been manually resized.
- A future pass could decide whether there is any case for preserving manual height across non-Single layout switches, but that needs live validation because the row-model change is more opinionated than width continuity.
- The broader end-to-end interplay among sidebar width, panel width, and tiled-session density still needs a live pass when the desktop app is runnable here.

## Iteration 2026-03-08 — make drag initiation match the visible reorder handle

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`

### Repro steps
1. Open the sessions page with at least two visible tiles in a tiled layout.
2. Try to drag from the tile body instead of from the small reorder handle in the top-left corner.
3. Notice that reordering can still start even though the UI suggests the handle is the intended affordance.
4. Compare that behavior with the header hint copy, which explicitly tells the user to grab the reorder handle.

### UX problems found
- The tile UI showed a dedicated reorder handle, but the entire tile wrapper was still marked draggable.
- That mismatch made drag behavior less predictable and increased the risk of accidental reorder attempts starting from general tile interactions instead of the visible handle.
- It also weakened discoverability because the product was visually teaching one interaction model while technically accepting another.

### Investigation notes
- I reviewed the updated ledger first and chose drag/reorder clarity because the previous pass had improved layout-switch continuity, leaving interaction predictability as a strong next local opportunity.
- `sessions.tsx` already describes reordering as a handle-driven action (`Grab the reorder handle on any session tile to reorder the grid`).
- `SessionTileWrapper` in `session-grid.tsx` still set `draggable={isDraggable && !isResizing}` on the whole tile while also rendering a dedicated drag handle, which confirmed the mismatch was local and easy to correct without changing reorder state management.
- Live UI inspection is still blocked here because no inspectable Electron target is available in this workflow.

### Assumptions
- It is better for the interaction model to match the visible affordance even if it slightly narrows the drag target, because accidental drags are more harmful than making the intended drag source explicit.
- The existing handle is already visible enough to act as the canonical drag source, especially with the sessions-page reorder hint copy that references it directly.
- Keeping the tile wrapper as the drop target is sufficient; the entire tile does not also need to be the drag source.

### Decision and rationale
- Chosen fix: make the reorder handle the drag source and leave the tile wrapper as the drop target.
- Why this is better than the obvious alternatives:
  - better than leaving the whole tile draggable because the behavior now matches the visible cue and reduces accidental reorder starts;
  - better than adding more explanatory copy alone because the mismatch was behavioral, not just instructional;
  - better than a broader drag/reorder rewrite because the state management and drop-target feedback were already adequate.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so the tile wrapper no longer starts drags directly.
- Moved the drag source wiring (`draggable`, `onDragStart`, `onDragEnd`) onto the visible reorder handle.
- Added an explicit `aria-label` to the handle to better communicate its purpose in the DOM.
- Extended `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` to lock in the handle-only drag-source behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` passed.
- A targeted Node source-assertion script passed for the handle-only drag source, the continued tile-level drop target, and the added regression test.
- Live UI inspection remains blocked in this workflow because there is no inspectable Electron target currently available.

### Still needs attention
- Once a runnable desktop target is available, this change should get a quick interaction sanity check to confirm the handle feels large enough in practice and does not make reordering feel too fiddly.
- If handle-only dragging feels slightly too precise in live use, the next local option should be enlarging the handle hit area, not reintroducing whole-tile dragging.
- Keyboard-accessible reordering remains a separate accessibility improvement area; this iteration only aligned pointer drag behavior with the visible affordance.

## Iteration 2026-03-08 — let the visible reorder handle move tiles by keyboard too

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with at least two active tiles in Compare or Grid.
2. Tab until the visible reorder handle on a tile receives focus.
3. Press arrow keys expecting the focused handle to move the tile earlier or later.
4. Notice that, before this change, nothing happened because the reorder handle only supported pointer drag.

### UX problems found
- After making the visible handle the only drag source, tile reordering was still effectively pointer-only.
- The handle was not keyboard-focusable, so a user tabbing through tile controls had no equivalent way to act on the same affordance.
- The sessions-page reorder hint only described grabbing the handle, which undersold the desired explicitness of the handle as the tile-order control.

### Investigation notes
- I reviewed the ledger first and chose this area because the previous iteration explicitly left keyboard-accessible reordering as still open.
- `SessionTileWrapper` already owned the visible reorder handle and the drag lifecycle, so keyboard support could be added locally without disturbing resize/layout logic.
- `sessions.tsx` already stored tile order in `sessionOrder`, which meant keyboard movement could reuse the same ordering state instead of inventing a second model.
- Live Electron inspection still is not practical in this workflow because there is no inspectable desktop target available.

### Assumptions
- Arrow-key movement is acceptable on the focused reorder handle because the handle is an explicit control rather than general tile content.
- Reusing the existing tile-order state is preferable to introducing a separate accessibility-only reorder path, because the behavior should stay consistent regardless of input method.
- Boundary no-ops are acceptable for first/last tiles as long as the handle label explains the available movement direction.

### Decision and rationale
- Chosen fix: make the existing reorder handle keyboard-operable instead of adding separate reorder UI.
- The handle now accepts focus, shows a visible focus ring, advertises arrow-key shortcuts, and moves the tile backward/forward with arrow keys using the same `sessionOrder` state as drag/drop.
- The sessions-page reorder hint now mentions both dragging and keyboard movement so the interaction model is clearer.
- Why this is better than the obvious alternatives:
  - better than adding a second reorder control because the visible handle remains the single canonical affordance;
  - better than leaving reorder pointer-only because focused users can now act on the same control without switching interaction mode;
  - better than a larger reorder refactor because the improvement stays local to the existing handle and ordering state.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to make the reorder handle focusable, add arrow-key handling, expose keyboard shortcut metadata, and show a focus-visible ring.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - add a small `moveSessionOrderEntry(...)` helper,
  - reuse that helper for drag-end reordering,
  - add `handleKeyboardReorder(...)` wired to the visible tile handle,
  - pass directional move availability into each regular session tile,
  - and clarify the sessions-page reorder hint copy.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new keyboard-reorder path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for the new handle keyboard handler, the arrow-key shortcut metadata, the shared session-order helper, the updated reorder hint copy, and the new regression assertions.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because there is no inspectable Electron target currently available.

### Still needs attention
- Once the desktop app is runnable here, the handle should get a live pass to confirm keyboard focus retention feels stable after a tile moves.
- If keyboard reorder still feels too hidden in practice, the next local improvement should be slightly richer inline hinting on the handle itself, not a separate reorder control.
- Screen-reader feedback after a successful move could still be improved later with an explicit live-region announcement if this interaction needs stronger post-action confirmation.

## Iteration 2026-03-08 — make stacked-layout recovery hints explicitly panel-aware

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`

### Repro steps
1. Open the sessions page in Compare or Grid while also working with a wide floating panel.
2. Narrow the overall workspace until the sessions view is stacked or almost stacked.
3. Read the existing width-pressure hint in the sessions header.
4. Notice that, before this change, the header either blamed the sidebar specifically or fell back to a generic “make room” hint even when the floating panel itself was the more obvious local pressure source.

### UX problems found
- The sessions header had a sidebar-specific width-pressure path, but no equivalent panel-specific path.
- That asymmetry made the recovery guidance less clear during tiled workflows that are actually constrained by a wide floating panel.
- The generic fallback hint was directionally correct, but it did not help users choose the most immediate action when the panel was already visibly oversized.

### Investigation notes
- I reviewed the ledger first and intentionally avoided another drag/reorder iteration because that area was handled most recently.
- `sessions.tsx` already consumed routed layout context for `sidebarWidth`, so adding panel width there was the smallest way to make the hint logic more specific.
- `panel-resize-wrapper.tsx` already proved that the renderer can read the current panel size and subscribe to `onPanelSizeChanged`, so I reused that existing pattern rather than introducing new plumbing.
- Live Electron inspection still is not practical in this workflow because there is no inspectable desktop target available.

### Assumptions
- The floating panel is only a likely contributor, not a mathematically measured cause, because it is not the same layout container as the sessions grid. I treated that heuristic as acceptable only when the sessions view is already stacked or near-stacked and the panel width is materially above its normal 600px agent default.
- A `+64px` pressure buffer above the default panel width is an acceptable threshold because the sidebar hint logic already uses the same “default plus margin” pattern and this keeps the panel-specific copy conservative.
- If both the sidebar and the panel are wide, keeping the existing sidebar-specific copy as the first-priority branch is acceptable because that behavior was already established and this iteration is adding specificity, not re-ranking all recovery advice.

### Decision and rationale
- Chosen fix: make the sessions-page stacked and near-stacked recovery hints panel-aware by threading the current floating-panel width through the desktop layout context.
- The sessions header now keeps the existing generic and sidebar-specific hints, but adds panel-specific variants when the view is under width pressure and the floating panel is noticeably wider than its default size.
- Why this is better than the obvious alternatives:
  - better than leaving the generic hint alone because it points users toward the most immediate local fix when the panel is clearly oversized;
  - better than adding a new sessions control for panel management because the problem is guidance clarity, not missing controls;
  - better than a broad layout refactor because the change stays local to existing width-awareness and preserves the current desktop patterns.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/app-layout.tsx` to load the current panel width, subscribe to panel-size changes, and pass `panelWidth` through the routed outlet context alongside `sidebarWidth`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - add a conservative panel-pressure threshold based on the 600px default agent panel width,
  - introduce panel-specific stacked and near-stacked hint variants,
  - and prefer those variants when the sessions layout is already tight and the panel is materially wider than normal.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` and `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` with source assertions covering the new context plumbing and panel-aware hint selection.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/app-layout.tsx apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for the new panel-width outlet context, the panel-size listener, the panel-pressure threshold, and the panel-specific stacked/near-stacked hint selection.
- `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because there is no inspectable Electron target currently available.

### Still needs attention
- Once the desktop app is runnable here, this hinting should get a live sanity pass to confirm the panel-specific copy appears only when it feels genuinely helpful rather than overly eager.
- The app still does not reason about the floating panel’s on-screen position or overlap, only its width; if panel placement confusion remains, the next pass should consider position-aware guidance rather than piling on more copy branches.
- If future iterations add richer panel docking or restore behavior, the sessions header could eventually link the hint copy to that stronger system state instead of the current width-based heuristic.

## Iteration 2026-03-08 — make floating-panel resize feedback explicitly warn when Compare/Grid are getting crowded

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`

### Repro steps
1. Open the desktop app with the sessions page visible in Compare or Grid and the floating panel also open.
2. Drag a panel edge or corner handle that changes width.
3. Watch the temporary resize hint near the top of the panel while widening or narrowing it.
4. Before this change, notice that the hint only said width affected tiled-session space and showed the current width, without telling you when the panel had already become wide enough to make Compare/Grid feel noticeably tight.

### UX problems found
- The drag-time hint explained direction (`less room` / `more room`) but not severity.
- Once the panel was already quite wide, the hint still looked like a generic resize status instead of a stronger warning that tiled Compare/Grid workflows were already under pressure.
- Shrinking an already-wide panel also lacked a useful intermediate message; users could be narrowing the panel and still not know that tiled layouts were likely tight until they made the panel much smaller.

### Investigation notes
- I reviewed the ledger first and chose this area because the last panel-related iteration improved sessions-page recovery hints, but the resize-time panel hint itself still stayed generic.
- `panel-resize-wrapper.tsx` already tracks the starting width, current width delta, and whether the active handle affects width, so this improvement could stay local to the existing resize hint instead of changing panel state plumbing.
- The renderer already had a focused source-assertion test for this behavior in `panel-resize-wrapper.tiling-feedback.test.ts`, which made it straightforward to lock in more specific copy and threshold logic.
- This is desktop-only behavior; there is no equivalent mobile surface to update.
- Live Electron inspection still was not practical in this workflow because there is no inspectable desktop target available.

### Assumptions
- Reusing the same conservative `600px + 64px` panel-pressure heuristic already used in sessions-page hinting is acceptable, because it keeps the drag-time hint aligned with existing desktop judgment about when the floating panel becomes unusually wide.
- It is acceptable for the hint to mention `Compare/Grid` directly even though the panel can exist outside the sessions page, because the hint only appears during manual width resizing and is specifically meant to explain tiled-workflow impact.
- A two-line hint is still an acceptable amount of transient chrome during drag as long as it remains non-interactive and disappears when resizing ends.

### Decision and rationale
- Chosen fix: make the existing floating-panel resize hint width-pressure-aware instead of purely delta-aware.
- The hint now distinguishes among neutral, relief, and crowding states, and uses stronger copy once the panel width is already in the range that is likely to crowd Compare/Grid layouts.
- Why this is better than the obvious alternatives:
  - better than leaving the hint generic because users now get immediate feedback when panel resizing has crossed from “directional change” into “this is already tight for tiled work”;
  - better than adding new controls because the gap was clarity during an existing interaction, not missing functionality;
  - better than a broader shared abstraction because this improves a specific local resize UX issue with a small, self-contained change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to:
  - add a conservative panel-pressure threshold aligned with the sessions-page heuristic,
  - introduce `getPanelTilingHint(...)` for neutral / relief / crowding copy,
  - warn more explicitly when a widened panel is already crowding Compare/Grid,
  - and keep shrinking feedback informative when the panel is still above the crowding threshold.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new threshold, helper, stronger crowding copy, and hint rendering.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for the new crowding threshold, the helper-based hint logic, the stronger Compare/Grid warning copy, and the updated regression test.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because there is no inspectable Electron target currently available.

### Still needs attention
- Once the desktop app is runnable here, this drag-time hint should get a quick live pass to confirm the stronger Compare/Grid wording feels helpful rather than too chatty while actively resizing.
- If users still seem unsure how to recover after oversizing the panel, the next local improvement should probably be an explicit reset-to-default-size affordance near panel sizing controls, not more hint copy.
- The app still does not reason about real panel overlap or screen placement during this drag interaction, so any future position-aware improvement should be based on actual bounds rather than more heuristics alone.

## Iteration 2026-03-08 — add a direct default-size recovery affordance to panel resize handles

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/main/window.ts`
- `apps/desktop/src/main/tipc.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`
- `apps/desktop/src/main/panel-recovery-actions.test.ts`

### Repro steps
1. Open the floating panel alongside tiled sessions in Compare or Grid.
2. Widen the panel until the resize hint warns that tiled sessions are getting crowded.
3. Realize the hint explains the problem, but there is still no local, resize-adjacent recovery action other than manually dragging back toward a good size.
4. If the panel was widened a lot, notice that the existing global reset action in settings or the tray is too far away and too destructive for this moment because it also resets position and broader panel state.

### UX problems found
- The panel already surfaced width-pressure feedback, but only as advisory copy.
- There was no direct recovery affordance near the resize controls themselves when tiled workflows became crowded.
- The existing global floating-panel reset was not a good substitute because it resets position and broader panel state rather than just undoing an oversize resize in the current mode.

### Investigation notes
- I reviewed the ledger first and intentionally chose the still-open panel-reset opportunity left by the previous resize-feedback pass, instead of repeating another copy-only iteration.
- `panel-resize-wrapper.tsx` already owned the resize handles and drag-time hinting, which made it the smallest local place to add a better recovery affordance.
- `window.ts` already had mode-aware default sizes for normal, agent/progress, and text-input panel states, but no renderer-safe action to reset only the current mode's size without also resetting position.
- Live Electron inspection is still blocked in this workflow because there is no inspectable Electron target available.

### Assumptions
- Double-clicking a resize handle is an acceptable expert-friendly recovery gesture here because it stays attached to the existing sizing affordance instead of adding more persistent chrome.
- Resetting to the current mode's default size is preferable to clearing persisted state and relying on migration fallbacks, because progress and text-input modes can otherwise inherit unrelated waveform widths.
- Limiting this affordance to width-affecting handles is acceptable because the user pain being solved here is tiled-session crowding caused by panel width, not general panel-height experimentation.

### Decision and rationale
- Chosen fix: let width-affecting panel resize handles reset the panel back to the current mode's default size on double-click, and teach that affordance inside the existing drag-time hint.
- The reset is mode-aware and local: waveform/normal resets to its compact default, agent/progress resets to `600×400`, and text input resets to its safer text-entry default.
- Why this is better than the obvious alternatives:
  - better than more warning copy alone because it adds an actual recovery path at the moment of friction;
  - better than calling the existing global panel reset because it avoids unexpectedly moving the panel or resetting unrelated state;
  - better than adding another always-visible button because the affordance stays attached to existing resize controls and keeps the panel chrome light.

### Code changes
- Updated `apps/desktop/src/main/window.ts` to add a mode-aware default-size helper plus `resetPanelSizeForCurrentMode()`, which restores only the active panel mode's default size and persistence bucket.
- Updated `apps/desktop/src/main/tipc.ts` to expose that current-mode size reset to the renderer.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to:
  - add a local `handleResetPanelSize()` callback,
  - wire it into width-affecting resize handles,
  - and extend the existing width-pressure hint with explicit default-size reset guidance.
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` so resettable handles advertise the default-size gesture in their title, mark themselves in the DOM, and trigger reset on double-click.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`, `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`, and `apps/desktop/src/main/panel-recovery-actions.test.ts` with regression assertions for the new affordance and mode-aware reset plumbing.

### Verification
- `git diff --check -- apps/desktop/src/main/window.ts apps/desktop/src/main/tipc.ts apps/desktop/src/renderer/src/components/resize-handle.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts apps/desktop/src/main/panel-recovery-actions.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for the mode-aware default-size helper, the new TIPC action, the renderer reset callback, and the resettable handle affordance metadata.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts apps/desktop/src/main/panel-recovery-actions.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because `electron_execute` reported `No Electron targets found`.

### Still needs attention
- Once a runnable desktop target is available, this should get a quick live pass to confirm double-clicking a width-affecting handle feels discoverable enough and does not misfire during normal resizing.
- If the gesture still feels too hidden in practice, the next local step should be a tiny persistent reset affordance near the panel drag bar while the panel is oversized, not a broader resize-system rewrite.
- Height-only resize handles still do not expose the reset gesture; that is intentional for now, but could be revisited later if users frequently need symmetric size recovery outside tiled-session workflows.

## Iteration 2026-03-08 — keep an oversized floating panel recoverable after resizing stops

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/src/renderer/src/components/panel-drag-bar.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`

### Repro steps
1. Open the floating panel alongside tiled sessions and widen it until Compare/Grid space feels crowded.
2. Stop dragging the resize handle.
3. Notice that the drag-time width-pressure hint disappears immediately.
4. Try to recover panel size without already knowing the hidden double-click-on-handle gesture.

### UX problems found
- The previous iteration added a recovery action, but only as a handle double-click gesture during or after resizing.
- Once dragging stopped, the panel could remain obviously oversized while the nearby recovery affordance effectively vanished.
- That made post-resize recovery too dependent on remembering an expert gesture instead of giving a small visible cue near the panel chrome.

### Investigation notes
- I reviewed the ledger first and deliberately chose the still-open post-resize recovery gap rather than repeating another drag-time hint copy pass.
- `panel-resize-wrapper.tsx` already knows the current live panel width, the crowding threshold, and the existing reset callback, so this could stay local without more IPC or panel-state refactoring.
- I also inspected `panel.tsx` and `panel-drag-bar.tsx` to make sure a top-edge affordance would fit the current panel shell without redesigning the drag bar.
- I attempted another live Electron inspection before editing, but it is still blocked in this workflow because `electron_execute` reports `No Electron targets found`.

### Assumptions
- A tiny persistent recovery control is acceptable when the panel remains above the tiled-workflow pressure threshold because it only appears in the already-problematic oversized state.
- Anchoring that control in the top drag-bar region is preferable to overlaying main panel content, because it keeps the affordance close to sizing chrome without covering session content.
- Reusing the existing mode-aware reset action is better than introducing a width-only partial reset, because the current product behavior already defines default size per panel mode.

### Decision and rationale
- Chosen fix: add a persistent top-edge recovery button that appears only when the panel is no longer actively resizing and is still wider than the existing crowding threshold.
- The button reuses the current-mode reset callback and lives in a `no-drag` interactive region so it can coexist with the drag bar area.
- Why this is better than the obvious alternatives:
  - better than relying on the double-click gesture alone because it gives users a visible way back after the resize interaction ends;
  - better than keeping another always-on panel control because the affordance only appears when the panel is actually oversized;
  - better than refactoring `PanelDragBar` props just to host one action because the local wrapper already had the needed width/reset state.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to:
  - derive `showPersistentPanelRecovery` from the existing width-pressure threshold plus idle resize state,
  - add a `persistentPanelRecoveryTitle` for explicit reset guidance,
  - and render an oversized-only `Reset wide panel` button in the top-edge / drag-bar region using `WebkitAppRegion: "no-drag"`.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new persistent recovery condition, title copy, DOM marker, and no-drag interactive styling.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for the new oversized-only recovery guard, title copy, DOM marker, no-drag styling, and regression assertions.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because `electron_execute` still reports `No Electron targets found`.

### Still needs attention
- Once a runnable desktop target is available, this top-edge recovery button should get a quick live pass to confirm it feels visible enough without stealing too much drag-bar space.
- If the button proves too subtle, the next local tweak should be its wording or hit area, not more persistent panel chrome.
- If it proves too intrusive on smaller panel modes, a future pass could make this affordance mode-aware in addition to width-aware.

## Iteration 2026-03-08 — acknowledge combined sidebar and panel width pressure in tiled layout hints

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`

### Repro steps
1. Open the sessions page in Compare or Grid with multiple visible tiles.
2. Widen the left sidebar and the floating panel at the same time until the sessions area stacks or is close to stacking.
3. Read the adaptive layout hint chip in the sessions header.
4. Compare that hint with the actual layout pressure sources on screen.

### UX problems found
- The sessions page already knew when the sidebar was wide and when the floating panel was wide, but the hint-selection logic only explained one source at a time.
- When both were crowding the sessions area together, the header would blame whichever single-source branch won first, which understated why tiled density felt hard to recover.
- That made the stacked / near-stacked state feel more arbitrary than it needed to, especially on narrower windows where both chrome regions often contribute at once.

### Investigation notes
- I reviewed the ledger first and deliberately chose a still-open cross-width-pressure case instead of repeating another compact-tile or Single-view pass.
- `sessions.tsx` already receives both `sidebarWidth` and `panelWidth` from routed layout context, and already computes `isSidebarLikelyCrowdingTiles` plus `isPanelLikelyCrowdingTiles`.
- Code inspection showed the current hint selection used a simple sidebar-first, panel-second fallback chain for both stacked and near-stacked hints, so the combined case had no dedicated copy.
- I attempted a live Electron probe before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- When both sidebar width and floating-panel width are materially contributing to width pressure, the UI should say so explicitly instead of pretending one chrome region is the sole cause.
- A single combined hint is preferable to rendering multiple simultaneous chips for this pass, because it improves accuracy without increasing header clutter.
- Keeping this change local to the existing sessions-header hint system is better than adding new global layout state, because the problem was selection/copy rather than missing measurements.

### Decision and rationale
- Chosen fix: add dedicated combined-pressure hint variants for both stacked and near-stacked states, and make them win whenever the sidebar and floating panel are both above their existing pressure thresholds.
- Why this is better than the obvious alternatives:
  - better than the old sidebar-first fallback because the hint now matches the real multi-source width pressure users are seeing;
  - better than showing two separate chips because it adds clarity without further crowding the sessions header;
  - better than another generic `Make room` message because it preserves actionable specificity about which desktop chrome is consuming tiled-session space.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add combined stacked and near-stacked hint-copy tables for cases where both the sidebar and floating panel are wide.
- Added `isSidebarAndPanelLikelyCrowdingTiles` so the sessions page can detect shared width pressure explicitly.
- Changed stacked and near-stacked hint selection to prefer the new combined copy before falling back to sidebar-only, panel-only, or generic pressure hints.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions that lock in the combined hint tables, combined-pressure guard, and new selection branches.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked in this workflow because no Electron renderer target is available (`No Electron targets found`).
- Attempted targeted verification with `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` from `apps/desktop`, but it is blocked in this worktree because `vitest` is not currently available (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- A targeted dependency-light Node source-assertion pass succeeded for the new combined stacked/near hint tables, the shared pressure guard, and the updated test coverage.

### Still needs attention
- Once a runnable desktop target is available, the combined-pressure labels should get a quick live pass at medium and narrow widths to confirm the wording feels clear without looking alarmist.
- If the combined chip reads too abstractly in practice, the next local step should be copy tuning, not multiple extra chips.
- The broader visual interplay among sidebar width, floating-panel width, and compact tile body density still needs an end-to-end live pass when this worktree can run the desktop renderer.

## Iteration 2026-03-08 — compact the tile chat/summary switcher on narrow tiles

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the sessions page with multiple active tiles where at least one session has step summaries.
2. Switch to a narrower tiled state (for example `2x2`, or `1x2` with tighter sidebar / window width).
3. Look at the tile-level Chat / Summary switcher row.
4. Notice how the full labels plus summary-count badge compete for width before the transcript content even starts.

### UX problems found
- The tile switcher stayed equally verbose at narrow widths even after prior compact-footer and transcript-density improvements.
- On narrower tiles, `Chat`, `Summary`, and the summary-count badge could make the row feel busier than the content it was meant to organize.
- That extra width pressure costs vertical room through wrapping and makes the tile's internal hierarchy feel heavier than it needs to in dense grid states.

### Investigation notes
- I reviewed the ledger first and deliberately chose a still-open tile-internal density issue rather than another sessions-header hint pass.
- `agent-progress.tsx` already had a local `useCompactWidth` hook for delegation bubbles, so there was an existing ResizeObserver-based pattern available without adding new shared abstractions.
- The tile switcher had no width-aware behavior of its own, so the improvement could stay local to the tile UI chrome.
- I attempted a live Electron check before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- Icon-first tab buttons are acceptable on narrow tiles as long as accessible names and hover titles still explain the action and current state.
- Keeping the summary count visible as a compact numeric badge is better than hiding it entirely, because the count is useful scanning information.
- Reusing the existing compact-width hook is preferable to introducing another tile-only measurement abstraction for one local density fix.

### Decision and rationale
- Chosen fix: reuse the existing compact-width hook on the tile container and collapse the Chat / Summary button labels once the tile is below a narrow-width threshold, while keeping the icons, selected-state styling, and summary count badge.
- Why this is better than the obvious alternatives:
  - better than an overflow menu because the primary tab switch remains directly visible and fast to hit;
  - better than removing the summary count because users still keep the scan-friendly signal that summaries exist;
  - better than leaving the row fully verbose because it reduces chrome density exactly where tiled space is most constrained.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - add a dedicated narrow-tile threshold for the tab switcher,
  - reuse `useCompactWidth` on the tile container,
  - hide Chat / Summary text labels on narrow tiles,
  - preserve explicit `aria-label` / `title` copy for both tab buttons,
  - and keep the summary count visible with a tighter compact badge style.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions for the new compact-width hook usage, compact tab spacing, accessible labels, label-hiding behavior, and compact summary badge treatment.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the new compact tile-tab threshold, hook usage, accessibility labels, compact spacing, and updated test coverage.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because `electron_execute` still reports `No Electron targets found`.

### Still needs attention
- Once a runnable desktop target is available, this tab-row compaction should get a live pass around the narrow compare / grid widths to confirm the `360px` threshold feels natural.
- If the compact mode feels too aggressive, the next local tweak should be threshold tuning before adding more tile chrome.
- The tile header action cluster may still deserve its own future density pass, but that should remain a separate iteration from this tab-switcher improvement.

## Iteration 2026-03-08 — compact narrow tile header actions with an overflow menu

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/components/ui/dropdown-menu.tsx`
- `apps/mobile/src/screens/ChatScreen.tsx`

### Repro steps
1. Open the sessions page with multiple active tiles in Compare or Grid.
2. Narrow the available tile width enough that a tile still shows both `Show only this session` and `Minimize` header actions.
3. Compare the header title area against the trailing icon cluster while the tile is not focused.
4. Notice how the header can spend scarce width on two lower-priority actions before the title and state cues have enough room.

### UX problems found
- The tile header already compacted transcript/footer chrome at narrow widths, but the action cluster still exposed every icon button directly.
- In the most common narrow active-tile case, the header could show collapse, focus-only, minimize, and stop actions plus an approval badge, which made the right edge visually noisy and more wrap-prone than the surrounding tile chrome.
- That diluted hierarchy: the most important scan signals are the session title, status, and stop/dismiss action, while `show only this session` and `minimize` are useful but secondary.

### Investigation notes
- I reviewed the ledger first and deliberately chose the still-open tile header action-cluster density issue left by the previous compact tab-row iteration.
- `agent-progress.tsx` already had a width-aware `isCompactTileChrome` signal, so the change could stay local to the tile header without adding new measurement state.
- I inspected the shared dropdown-menu component to reuse an existing desktop overflow pattern instead of inventing a custom popover/menu abstraction.
- I checked `apps/mobile/src/screens/ChatScreen.tsx` only to confirm this desktop tile-header issue was not shared mobile chrome; the mobile screen uses different header/action patterns, so no parallel mobile edit was needed.
- I attempted a live Electron probe before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- On narrow tiles, `Show only this session` and `Minimize` are secondary actions compared with collapse, stop/dismiss, session title, and approval state.
- When both of those secondary actions are present at once, moving them behind a tiny overflow menu is a better tradeoff than letting the header spend persistent width on both icons.
- If only one secondary action is available, it should remain a direct button so the header does not gain an unnecessary extra click.

### Decision and rationale
- Chosen fix: when compact tile chrome would otherwise show both `Show only this session` and `Minimize`, replace those two direct header buttons with a single `More actions` overflow trigger while keeping collapse, stop/dismiss, and restore actions directly visible.
- Also tighten compact approval-badge padding and action-row spacing so narrow tiles waste less horizontal room even before wrapping.
- Why this is better than the obvious alternatives:
  - better than a full header layout rewrite because it reduces clutter with a small local change;
  - better than always forcing an overflow menu because tiles with only one secondary action keep the faster direct button;
  - better than leaving all buttons visible because the compact header now preserves clearer hierarchy under width pressure.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - reuse `isCompactTileChrome` for a new compact-header overflow decision,
  - count when both secondary narrow-tile header actions are present,
  - replace direct `Show only this session` + `Minimize` buttons with a shared `More actions` dropdown trigger only in that dual-action compact case,
  - keep direct actions when only one secondary action is available,
  - and tighten compact approval-badge/action-row spacing.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions for the new compact overflow decision, direct-button guards, compact spacing, overflow trigger labeling, and menu item copy.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked in this workflow because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` remains blocked in this worktree because `vitest` is not currently available (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the new compact overflow-menu guard, compact badge/spacing adjustments, overflow trigger labeling, menu-item copy, and updated test coverage.

### Still needs attention
- Once a runnable desktop target is available, this compact header overflow should get a live pass around the same `360px` threshold as the tab-row compaction to confirm the extra click is worth the reduced chrome noise.
- If the overflow feels too hidden in practice, the next local tweak should be trigger wording/tooltip or threshold tuning, not another persistent row of icons.
- The tile header could still benefit from a future pass on focus/maximize affordance language, but that should remain separate from this density fix.

## Iteration 2026-03-08 — make the tile maximize affordance truthful in temporary single-tile states

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page in Compare or Grid with only one visible tile remaining.
2. Notice the header already describes the state as `Expanded for one visible session`.
3. Inspect the tile header actions.
4. Before this change, the tile could still offer `Show only this session`, even though it was already using the expanded single-tile footprint.

### UX problems found
- The tile-level maximize action remained visible in the temporary one-visible-tile state, which made Compare/Grid look like they still had another meaningful expansion step when they effectively did not.
- That extra action made the current state harder to read: users could already be looking at a single large tile, yet still see a control implying they were not.
- The action copy also used `Show only this session`, while the surrounding layout controls and restore cues consistently use `Single view`, which weakened mental-model continuity.

### Investigation notes
- I reviewed the ledger first and deliberately chose this still-open maximize/focus-language gap instead of repeating another density or panel-width pass.
- `sessions.tsx` already computes `isTemporarySingleVisibleLayout`, so the redundant-action suppression could stay local to the existing sessions-page layout logic.
- `agent-progress.tsx` already owns the tile-header action copy, so the terminology alignment could remain a tiny renderer-only change without new shared abstractions.
- I attempted a live Electron inspection before closing the iteration, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- When Compare or Grid already renders a lone visible tile at the expanded focus footprint, hiding the maximize action is preferable to exposing a redundant mode change.
- Using `Single view` in the tile action is better than `Show only this session` because it matches the sessions-header layout vocabulary users already see elsewhere.
- This local pass should improve truthfulness and continuity without changing the underlying layout-restoration behavior, which previous iterations already stabilized.

### Decision and rationale
- Chosen fix: suppress the tile maximize action whenever Compare/Grid are already in the temporary one-visible-tile state, and rename the remaining tile action to `Open in Single view`.
- Why this is better than the obvious alternatives:
  - better than leaving the redundant control visible because it removes a misleading extra step from an already-expanded state;
  - better than only renaming the action because the one-visible-tile case would still advertise an unnecessary transition;
  - better than a broader focus-layout refactor because the issue was local affordance truthfulness, not missing state.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showTileMaximize` is disabled when `isTemporarySingleVisibleLayout` is already true.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to rename the tile-level maximize copy to `Open in Single view` / `Open this session in Single view` for the overflow item and icon-button accessibility/title text.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new Single-view wording and redundant-action suppression.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- A targeted dependency-light Node source-assertion script passed for temporary-single maximize suppression and the new Single-view action copy.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because `electron_execute` still reports `No Electron targets found`.

### Still needs attention
- Once a runnable desktop target is available, this tile-level change should get a quick live pass to confirm the missing maximize action feels correct when only one tile is visible, rather than making Single view harder to discover.
- If users still find the maximize action vague in normal multi-tile states, the next local tweak should be its icon treatment or tooltip wording, not more permanent header chrome.
- The broader relationship between tile-level focus actions and the sessions-header Single-view controls still deserves an end-to-end live UX pass when this worktree can run the desktop renderer.

## Iteration 2026-03-08 — make the tile-level Single-view action understandable without hover

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the sessions page with multiple visible tiles in Compare or Grid.
2. Look at a regular-width tile header where the `Open in Single view` action is available directly instead of inside the compact overflow menu.
3. Before this change, the action appeared as a generic maximize icon button unless you hovered for the tooltip.
4. Compare that with nearby header actions like `Minimize`, which already have clearer semantics from both icon shape and copy elsewhere in the product.

### UX problems found
- The tile-level Single-view action still depended too heavily on hover text for interpretation in the common non-compact case.
- A lone maximize icon suggests generic enlargement more than a specific layout-mode transition, which is weaker than the sessions header’s explicit `Single view` terminology.
- That ambiguity made the action less discoverable precisely where there is enough width to explain it directly.

### Investigation notes
- I reviewed `tiling-ux.md` first and picked up the exact follow-up noted in the previous iteration instead of reopening resize or density work.
- The tile header already has a compact-width distinction (`isCompactTileChrome`), so the safest local change is to improve affordance wording only on wider tiles and preserve the narrow/overflow behavior.
- The existing tests for tile layout are source assertions, so I extended the same pattern instead of introducing a heavier test harness in this workflow.

### Assumptions
- Showing a short visible `Single view` label is acceptable on non-compact tiles because the header already has enough horizontal room at that breakpoint.
- Keeping the icon-only presentation in compact tiles remains appropriate because those widths already prefer reduced chrome and sometimes collapse lower-priority actions into overflow.
- Reusing the exact `Single view` wording is preferable to inventing a new synonym because the sessions header and layout controls already teach that vocabulary.

### Decision and rationale
- Chosen fix: keep the tile-level action icon, but add a visible `Single view` text label on non-compact tiles while preserving the compact icon-only/overflow behavior.
- Why this is better than the obvious alternatives:
  - better than only changing the tooltip because the affordance becomes understandable before hover;
  - better than always showing a long label because narrow tiles still need the cleaner compact treatment;
  - better than swapping icons alone because vocabulary continuity with the sessions header is the bigger clarity win here.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - derive `showExpandTileButtonLabel` from the existing compact-tile breakpoint,
  - render the direct tile expand action as a small labeled button on wider tiles,
  - keep the same `Open this session in Single view` accessibility/title text,
  - and preserve the compact icon-only/overflow behavior unchanged.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions for the new visible `Single view` label, size switch, and width-aware class logic.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion script passed for the new visible `Single view` label, width-aware button sizing, and updated test coverage.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live UI inspection remains blocked in this workflow because no Electron renderer target is available for `electron_execute` (`No Electron targets found`).

### Still needs attention
- Once a runnable desktop target is available, this labeled button should get a quick live pass around the compact breakpoint to confirm `Single view` feels worth the extra width on the last non-compact tile sizes.
- If the label proves slightly too wide in practice, the next local tweak should be shortening the visible label or adjusting compact-threshold tuning before hiding the action again.
- The broader relationship between tile-level focus actions and the sessions-header Single-view controls still deserves an end-to-end live UX pass when this worktree can run the desktop renderer.

## Iteration 2026-03-08 — move hidden-session restore context into the compact Single-view back control

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with multiple active sessions.
2. Enter `Single view`.
3. Narrow the sessions area until the header is compact but not at the smallest `Back`-only breakpoint.
4. Notice the compact Single-view chip no longer shows the hidden-session pill, but the restore control still just reads like a generic back action unless you hover it.
5. Try to answer, from the visible header alone, whether leaving Single view will reveal the hidden sessions again.

### UX problems found
- A previous iteration correctly slimmed the compact Single-view context chip to preserve room for restore, pager, and layout controls.
- That made the compact header cleaner, but it also removed the last visible hidden-session cue from the left side of the header.
- The restore button still had the right tooltip/ARIA text, yet its visible copy (`Back to …`) did not explicitly carry the hidden-session reveal context in the compact state where that context had just been removed elsewhere.

### Investigation notes
- I reviewed the latest ledger first and deliberately continued the open Single-view continuity thread instead of revisiting resize, density, or floating-panel work again.
- The existing `hiddenFocusLayoutSessionLabel` logic already knew exactly when the compact chip was suppressing the hidden-session pill, so this could stay a small local sessions-header change.
- I attempted another live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- When compact Single-view headers intentionally hide the separate hidden-session pill, the restore control is the best place to carry that reveal context because it is the action that actually brings the hidden tiles back.
- Adding a tiny hidden-session badge inside the restore button is preferable to making the whole button sentence longer, because it preserves scanability while still making the hidden-state consequence visible.
- The very smallest header breakpoint should keep the simpler `Back` treatment without an added badge, because that state is already prioritizing control survival over extra context chrome.

### Decision and rationale
- Chosen fix: show a compact hidden-session badge inside the restore button only when Single view is compact enough that the main context chip no longer displays hidden-session count.
- In that same state, shorten the visible restore label back to `Back` so the button gains explicit hidden-session context without becoming wider than the old `Back to Compare/Grid` treatment.
- Why this is better than the obvious alternatives:
  - better than restoring the old hidden-session chip because it keeps the compact header focused on primary controls;
  - better than only relying on tooltip/ARIA text because the hidden-session reveal becomes visible before hover;
  - better than a broader header refactor because the sessions page already had the right state to solve this locally.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - derive `showRestoreHiddenSessionBadge` from the existing Single-view hidden-session state,
  - reuse `getHiddenSessionCountLabel(..., { compact: true })` for compact restore-badge copy,
  - shorten the compact restore label to `Back` only when that badge is present,
  - and render the hidden-session badge inline inside the restore button.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new badge guard, compact hidden-count label reuse, restore-label branch, and inline badge styling.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked in this workflow because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the new compact restore-badge guard, restore-label branch, inline hidden-session badge, and updated test coverage.
- `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).

### Still needs attention
- Once a runnable desktop target is available, this compact restore badge should get a quick live pass to confirm it reads as helpful continuity rather than extra chrome.
- If the inline badge feels slightly too busy, the next local tweak should be copy or spacing tuning before bringing back another separate compact chip.
- The broader live relationship among tile-level `Single view`, the sessions-header restore control, and adjacent pager/layout controls still deserves an end-to-end desktop UX pass when this workflow can inspect the renderer.

## Iteration 2026-03-08 — condense compact Compare/Grid layout controls when width-pressure hints need room

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page in Compare or Grid with multiple visible tiles.
2. Narrow the sessions area until the header becomes compact and the page starts showing a stacked or near-stacked width-pressure hint.
3. Compare the left-side hint chips with the right-side layout selector.
4. Notice that, before this change, the selector still spent width on labels for all three layout buttons even though the header was already using that compact state to teach a more urgent recovery message.

### UX problems found
- Recent iterations made Single-view controls more disciplined under tight widths, but compact Compare/Grid headers still left the layout selector fully verbose.
- When stacked or near-stacked hints were already present, those extra inactive button labels competed with the more urgent width-pressure guidance and made the header more wrap-prone than necessary.
- This created avoidable visual priority inversion: the header could spend width on alternate layout labels before preserving room for the hint explaining why Compare/Grid already felt crowded.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a fresh Compare/Grid width-pressure case instead of another Single-view or floating-panel pass.
- I attempted a quick live Electron inspection before editing, but it is still blocked in this workflow because `electron_execute` reports `No Electron targets found`.
- Code inspection showed the previous `shouldCondenseLayoutSelector` guard only activated for compact Single view, even though compact Compare/Grid width-pressure hints were now one of the main other reasons the header becomes crowded.

### Assumptions
- In compact Compare/Grid headers, a stacked or near-stacked recovery hint is more important than showing visible labels on every inactive layout button.
- Keeping the active layout button labeled remains the right balance here, because users should still be able to scan the current mode at a glance while the selector reclaims some width.
- This behavior should stay scoped to compact width-pressure states rather than all compact Compare/Grid headers, because the goal is to support the urgent hint state without over-condensing calmer layouts.

### Decision and rationale
- Chosen fix: reuse the existing active-only layout-selector treatment whenever a compact Compare/Grid header is already showing a stacked or near-stacked width-pressure hint.
- Why this is better than the obvious alternatives:
  - better than leaving all three labels visible because it frees width where the width-pressure hint is already trying to explain the current problem;
  - better than hiding every label because the active layout still remains visible at a glance;
  - better than adding another special compact selector variant because the existing condense pattern already fits this header-density case.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `shouldPrioritizeWidthPressureHint` for compact Compare/Grid states that are already showing stacked or near-stacked guidance.
- Expanded `shouldCondenseLayoutSelector` so the layout selector now reuses its active-only-label treatment for either compact Single-view control pressure or compact Compare/Grid width-pressure hints.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new width-pressure condense guard.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked in this workflow because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the new compact width-pressure condense guard, the widened `shouldCondenseLayoutSelector` branch, and the updated test coverage.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` from `apps/desktop` could not run here because `vitest` is not currently available in this worktree (`Command "vitest" not found`).

### Still needs attention
- Once a runnable desktop target is available, this compact Compare/Grid selector should get a quick live pass near the stacked/near-stacked threshold to confirm the active-only label still feels obvious enough.
- If the selector still feels slightly busy in practice, the next local tweak should be padding tuning before hiding more context or adding more hint chips.
- The broader end-to-end relationship among sidebar width, floating-panel width, and compact tile body density still deserves a live renderer pass when this workflow can inspect the desktop app.

## Iteration 2026-03-08 — enlarge the reorder handle hit target without adding heavier chrome

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`

### Repro steps
1. Open the sessions page with at least two visible tiles in Compare or Grid.
2. Try reordering from the small visible handle in the top-left corner.
3. Notice that the recent handle-only drag-source change improved predictability, but also made drag initiation depend on a fairly tight target around the visible pill.
4. Compare that with the ledger follow-up from the handle-only change, which already called out live hit-area size as the next likely local tweak if the control felt too precise.

### UX problems found
- The product now correctly teaches users to drag from the visible handle, but that also means the handle’s usable hit area matters more than before.
- The existing visible grip remained fairly compact, so dense tile layouts still risked feeling a little fiddly when users tried to start a reorder gesture quickly.
- Increasing the permanent visual chrome much further would have been the wrong tradeoff because the current handle already carries the right amount of visual emphasis.

### Investigation notes
- I reviewed the ledger first and intentionally picked a non-recent follow-up from the earlier handle-only drag pass instead of revisiting Single-view or panel resizing again.
- I attempted a quick live Electron inspection before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- Code inspection confirmed the drag handle was still a single compact pill, which made hit-area expansion possible as a local wrapper change without touching reorder state or tile layout logic.

### Assumptions
- A larger invisible interaction target is preferable to a visibly larger grab pill because it improves usability without making every tile feel busier at rest.
- Keeping the existing icon and visual pill treatment is acceptable because the current affordance is already discoverable enough after the earlier drag-handle work.
- A modest `32px` outer handle target is a reasonable next step because it noticeably relaxes precision without sprawling into adjacent tile controls.

### Decision and rationale
- Chosen fix: wrap the existing visible grip in a slightly larger interactive handle target while preserving the same visual pill inside it.
- Why this is better than the obvious alternatives:
  - better than restoring whole-tile dragging because it preserves the now-clear affordance model;
  - better than making the visible pill much larger because it improves usability without adding heavier permanent chrome;
  - better than adding more instructional text because the issue was the physical target, not missing explanation.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so the reorder handle now uses a larger `h-8 w-8` interactive wrapper with the same smaller visual grip nested inside it.
- Kept drag, keyboard, title, and accessibility wiring on the outer handle target so the larger hit area applies consistently across reorder interactions.
- Extended `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` with source assertions covering the expanded hit target and nested visual pill.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked in this workflow because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the larger interactive wrapper, the preserved inner visual grip, and the updated drag-affordance coverage.
- `pnpm exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts` from `apps/desktop` could not run here because `vitest` is not currently available in this worktree (`Command "vitest" not found`).

### Still needs attention
- Once a runnable desktop target is available, this larger handle target should get a quick live sanity pass to confirm it reduces missed drags without colliding with nearby tile actions.
- If reorder still feels slightly hidden in practice, the next local improvement should be post-action feedback (for example, move confirmation for screen readers) rather than more resting chrome.
- Tile body density and hierarchy at narrow widths still remain a separate high-value area for another focused iteration.

## Iteration 2026-03-08 — add explicit post-reorder feedback in the sessions header

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with at least two visible tiles in Compare or Grid.
2. Reorder a session either by dragging the visible reorder handle or by focusing that handle and pressing an arrow key.
3. Watch the tiles move, then scan the header area.
4. Before this change, the reorder hint remained generic and there was no explicit confirmation that the move succeeded or where the session landed.

### UX problems found
- The recent reorder-handle work improved discoverability and hit targeting, but successful reorders still resolved with almost no explicit feedback.
- After keyboard reordering in particular, users had to infer success from the tile positions alone, which made the interaction feel quieter and less trustworthy than it should.
- Screen-reader users also lacked a dedicated post-action announcement describing the new position.

### Investigation notes
- I reviewed the newest ledger entries first and intentionally chose the exact follow-up that the previous reorder-handle pass called out: post-action confirmation rather than adding more resting chrome.
- I attempted a live Electron inspection before and after editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- Code inspection showed both drag and keyboard reorder paths already converge in `apps/desktop/src/renderer/src/pages/sessions.tsx`, which made a shared local feedback state possible without touching the tile component or layout math.
- Scope check: this tiled sessions surface is desktop-renderer-specific, so there is no corresponding mobile screen that needs the same change in this iteration.

### Assumptions
- A brief inline confirmation near the existing reorder hint is a better fit than a global toast because it keeps the feedback close to the affected control without feeling louder than the action.
- A transient `aria-live` announcement is sufficient accessibility coverage for this step because the action is already initiated from a focused, labeled reorder handle.
- Using position-based feedback (`Moved to 2 of 4`) is acceptable even when titles are long, because the header chip needs to stay compact and the full announcement can carry the session label.

### Decision and rationale
- Chosen fix: after a successful drag or keyboard reorder, temporarily replace the generic reorder hint with an explicit move-confirmation chip and announce the same event through an `aria-live` status region.
- Why this is better than the obvious alternatives:
  - better than doing nothing because it confirms both success and the new relative position;
  - better than a toast because it keeps the message local to the tiling header and avoids adding another global notification for a lightweight action;
  - better than more permanent instructional chrome because the extra emphasis only appears after the user has actually moved something.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track a short-lived `recentReorderFeedback` state, capture the moved session’s label/position after successful drag and keyboard reorder actions, and clear the feedback after a brief timeout.
- Added helper formatting for a full screen-reader announcement (`Moved … to position …`) and a more compact visible chip label for tight headers.
- Reused the existing header hint slot so the success chip temporarily replaces the generic reorder hint instead of adding more permanent UI.
- Added an `sr-only` `role="status"` / `aria-live="polite"` announcement for successful reorders.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new feedback state, announcement wiring, timeout cleanup, and visible confirmation chip.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked in this workflow because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the new reorder feedback state, the `aria-live` announcement, the visible confirmation chip, and the updated source-assertion test coverage.
- `pnpm exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` from `apps/desktop` still could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once a runnable desktop target is available, this confirmation chip should get a quick live pass after both drag and keyboard reorder to confirm the timing feels helpful rather than distracting.
- If the compact `Moved 2/4` label feels too terse in practice, the next local tweak should be copy/padding tuning before introducing any larger visual treatment.
- Tile body density and hierarchy at narrow widths still remain the most obvious untouched tiling-UX area for a future focused pass.

## Iteration 2026-03-08 — stop panel-width hints from blaming hidden floating panels

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/main/window.ts`
- `apps/desktop/src/main/tipc.ts`
- `apps/desktop/src/main/renderer-handlers.ts`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/main/panel-recovery-actions.test.ts`

### Repro steps
1. Open the desktop app with the sessions page visible in Compare or Grid.
2. Make the floating panel fairly wide, then hide it or let the main-window focus behavior hide it.
3. Stay on the sessions page or return to it without resizing the sidebar.
4. Before this change, the sessions header could still treat the panel as the source of width pressure because it only knew the last saved `panelWidth`, not whether the panel was actually visible.

### UX problems found
- The width-pressure hints were at risk of showing the wrong cause, which makes the tiled layout feel less predictable.
- A hidden floating panel should not be blamed for stacked/near-stacked states, especially when the user may need to act on the sidebar instead.
- The main renderer was also set up to react to live panel size changes, but the main-process notification path only targeted the panel window, so sessions-page context could drift stale after panel resizing.

### Investigation notes
- I reviewed the latest ledger entries first and intentionally skipped the recently touched reorder area.
- While preparing a possible “Reset panel” recovery action, I found a more important prerequisite: the sessions page needed trustworthy panel-state attribution first.
- Code inspection showed `app-layout.tsx` already loads `panelWidth` for routed pages and listens for `onPanelSizeChanged`, but `window.ts` only sent that event to the floating panel renderer.
- The main process already has a reliable source of truth for panel visibility (`BrowserWindow.isVisible()`), so exposing that state was the smallest coherent way to fix the attribution problem.

### Assumptions
- Treating panel-caused width pressure as valid only when the panel is visible is acceptable because an off-screen/hidden panel cannot currently consume space in the tiled sessions surface.
- Broadcasting panel size changes to the main renderer is low-risk because the sessions page was already written to listen for those updates; this change mainly makes that existing intent real.
- A source-assertion verification pass is acceptable in this environment because the worktree currently lacks installed desktop test/build dependencies, and the changed tests are themselves source-assertion tests.

### Decision and rationale
- Chosen fix: add explicit panel-visibility state to the sessions layout context, broadcast panel size changes to the main renderer as well as the panel renderer, and only treat the panel as a tiling-pressure source when it is actually visible.
- Why this is better than the obvious alternatives:
  - better than adding a new panel-reset control first, because correct diagnosis matters before recovery affordances;
  - better than relying on `panelWidth` alone, because persisted width without visibility makes the header hints less trustworthy;
  - better than polling from the sessions page, because the main process already owns the source-of-truth visibility state and can push it to both renderers with a smaller change.

### Code changes
- Updated `apps/desktop/src/main/window.ts` so `notifyPanelSizeChanged` now broadcasts to the main renderer as well as the panel renderer.
- Added `notifyPanelVisibilityChanged` in `apps/desktop/src/main/window.ts` and wired it to the panel window’s `show`/`hide` lifecycle so both renderers receive live visibility updates.
- Extended `apps/desktop/src/main/renderer-handlers.ts` with a new `onPanelVisibilityChanged` event.
- Added `getPanelVisibility` to `apps/desktop/src/main/tipc.ts` so routed pages can load the initial panel-visibility state on mount.
- Updated `apps/desktop/src/renderer/src/components/app-layout.tsx` to load both initial panel size and initial panel visibility, listen for both size and visibility updates, and pass `panelVisible` through the routed layout context.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so panel-caused width pressure is only considered when `panelVisible` is true.
- Extended the nearby source-assertion tests to lock in the new visibility event, initial visibility query, routed context plumbing, and hidden-panel gating.

### Verification
- Attempted targeted package-script tests with `pnpm --filter @dotagents/desktop test -- --run ...`, but the worktree currently has no installed dependencies; `build:shared` failed first because `tsup` was not found and `node_modules` is missing.
- Ran a dependency-light Node verification script that checked the changed source files for the same invariant fragments the nearby source-assertion tests rely on; that pass succeeded.
- `git diff --check` passed after the code changes.
- Live desktop inspection is still not practical in this workflow because there is no currently inspectable Electron renderer target.

### Still needs attention
- Once the desktop app is runnable here, this should get a live sanity pass for the exact focus-hide flow: make the panel wide, hide it by focusing the main window, and confirm sessions hints stop blaming the panel immediately.
- If the sessions page still needs a faster recovery path after this attribution fix, a small “Reset panel” action near panel-caused width hints would be the next coherent follow-up.
- Tile body density and hierarchy at narrow widths still remain the biggest untouched tiled-session content issue after this infrastructure-focused pass.

## Iteration 2026-03-08 — slim down compact transcript clipping notices in narrow tiles

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/mobile/src/screens/ChatScreen.tsx`
- `apps/mobile/src/screens/SessionListScreen.tsx`

### Repro steps
1. Open the desktop sessions page in Grid or Compare with enough active sessions to force compact tile chrome.
2. Use a narrow window or wide sidebar so a non-focused tile shows only a transcript preview instead of the full history.
3. Look at the clipped-history notice above the tile transcript preview.
4. Before this change, the notice kept the same copy density and button weight as wider tiles, so the banner could feel overly tall and wordy in the exact state where the tile is intentionally space-constrained.

### UX problems found
- The clipped-history banner was explicit, but it spent too much vertical and cognitive space inside already-dense narrow tiles.
- The full `Focus tile` button label and longer recovery sentence made the banner compete with the actual transcript preview instead of acting like lightweight recovery chrome.
- This made tile content feel heavier at the moment users most need quick scanning across multiple sessions.

### Investigation notes
- I reviewed the latest ledger entries first and intentionally skipped the most recently touched reorder and panel-attribution areas.
- Code inspection showed the clipped-history notice already had the right behavior and explicit recovery action; the main issue was presentation density, not missing capability.
- A quick scope check in the mobile chat/session-list screens did not reveal an analogous tiled transcript-preview pattern, so this iteration stayed desktop-only.
- Live app inspection was attempted again via `electron_execute`, but this workflow still has no inspectable Electron renderer target.

### Assumptions
- Using shorter recovery copy only in compact tile chrome is acceptable because wider tiles still have room for the more descriptive sentence.
- Shortening the visible button label from `Focus tile` to `Focus` in compact chrome is acceptable as long as the accessible label/title still says `Focus tile to show the full transcript`.
- A dependency-light Node source-assertion check is acceptable verification here because the worktree still lacks installed desktop dependencies (`node_modules`, `vitest`, `tsup`).

### Decision and rationale
- Chosen fix: keep the existing clipped-history affordance, but make it denser only when `isCompactTileChrome` is active by shortening the copy, tightening the spacing/line-height, and shrinking the recovery button.
- Why this is better than the obvious alternatives:
  - better than removing the banner entirely, because hidden transcript history still needs an obvious recovery path;
  - better than adding another icon/badge treatment, because the problem was too much chrome, not too little labeling;
  - better than changing behavior for all tiles, because the larger non-compact state can afford the more explicit copy without harming scanability.

### Code changes
- Added compact-aware helpers in `apps/desktop/src/renderer/src/components/agent-progress.tsx` for hidden-history copy and recovery-hint copy.
- Updated the compact transcript-clipping banner in `agent-progress.tsx` to use tighter gap/padding, `leading-snug` body copy, and a smaller `Focus` button when `isCompactTileChrome` is true.
- Kept the accessible button `title` / `aria-label` explicit (`Focus tile to show the full transcript`) so the denser visible label does not reduce clarity for assistive tech.
- Extended `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions covering the compact-aware helper functions, shorter compact copy, tighter banner classes, smaller compact button classes, and accessible labeling.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- A targeted dependency-light Node source-assertion pass succeeded for the new compact transcript-notice helpers, compact spacing classes, compact button classes, and accessible label wiring.
- `pnpm exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts` and `pnpm test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts` could not run in `apps/desktop` because the worktree currently lacks installed dependencies (`node_modules` missing; `vitest` and `tsup` not found).

### Still needs attention
- Once the desktop app is runnable here, this compact banner should get a quick live pass at very small widths to confirm the tighter copy still reads clearly at a glance.
- The summary-tab body still has room for a similar density pass if narrow tiles continue feeling top-heavy after this transcript notice change.
- If future live testing shows the shorter `Focus` label is too terse, the next local tweak should be copy tuning before adding any new chrome.

## Iteration 2026-03-08 — condense compact summary highlights so narrow tiles feel less top-heavy

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Repro steps
1. Open the desktop sessions page with enough active sessions to keep one or more tiles in compact non-focused mode.
2. Switch a narrow tile to the `Summary` tab when the session has at least one `high` or `critical` step summary.
3. Compare the top of the compact summary tab with the chat tab in the same tile footprint.
4. Before this change, the `Important Findings` treatment still rendered as a full highlight card with a title row, badge, and secondary sentence, which made the summary tab feel top-heavy before the main timeline even started.

### UX problems found
- Recent compact-summary work already slimmed the summary cards themselves, but the top-of-tab `Important Findings` block was still using a larger card-style treatment even in narrow tile mode.
- That meant the compact summary tab could still spend a disproportionate amount of vertical space on summary chrome before showing the actual activity list.
- The block also repeated the same severity information across a heading, total-count badge, and second line of copy, which was more emphasis than narrow tiles needed.

### Investigation notes
- I reviewed the latest ledger first and chose this area because the most recent open follow-up explicitly called out the summary-tab body as the next density candidate, and an earlier compact-summary iteration had already identified the `Important Findings` block as the likely next local improvement.
- Code inspection showed `agent-summary-view.tsx` already computes `criticalSummaries` and `highSummaries`, so the severity signal could be preserved while replacing the heavier compact presentation with a lighter summary row.
- I attempted a quick live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- In compact tile summaries, a one-line severity summary is sufficient because the detailed summary cards remain directly below it.
- Keeping the richer `Important Findings` card in non-compact contexts is preferable because the density problem is specific to narrow tiled views, not focused or wider summary layouts.
- Truncating the compact severity text is acceptable as long as the full breakdown remains available in the element `title`.

### Decision and rationale
- Chosen fix: keep the same important-summary detection logic, but render compact summary tabs with a lighter single-line `Important` status row instead of the heavier card-style highlight block.
- The compact row keeps the warning icon and severity counts (`critical` / `high`) while removing the extra badge and second line of copy that were making the tab feel top-heavy.
- Why this is better than the obvious alternatives:
  - better than removing the important-summary cue entirely because high-severity work still stays visible at the top of the summary tab;
  - better than shrinking the existing card only a little because the main problem was duplicated chrome, not just padding;
  - better than changing the full-size summary layout because the issue is specific to narrow tiled contexts.

### Code changes
- Added `getImportantFindingsLabel(...)` in `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` so compact and non-compact summary highlights can share the same severity breakdown while using different separators/copy.
- Updated the compact `Important Findings` treatment in `agent-summary-view.tsx` to render as a single-line summary row with a warning icon, short `Important` label, truncated severity text, and a descriptive `title`.
- Preserved the existing larger highlight card for non-compact summary views.
- Extended `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with source assertions covering the new helper, compact summary-row treatment, truncation/title behavior, and preserved non-compact block.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts tiling-ux.md` passed.
- A targeted dependency-light Node source-assertion script passed for the new important-findings helper, compact single-line summary row, truncation/title behavior, preserved non-compact highlight block, and updated layout-test coverage.
- I did not repeat another `vitest` run in this iteration because this worktree still lacks installed desktop test dependencies and recent targeted attempts were already failing for that environment reason (`vitest` / `node_modules` unavailable).

### Still needs attention
- Once the desktop app is runnable here, this compact summary highlight should get a quick live pass to confirm the one-line treatment feels meaningfully lighter without becoming too easy to miss.
- If the compact summary tab still feels heavier than chat mode in practice, the next local density candidate should be the sticky `Latest Activity` footer rather than the summary-card rows again.
- The broader end-to-end balance among compact transcript previews, compact summary mode, and tile-header density still needs a live renderer pass when this workflow can inspect the desktop app.

## Iteration 2026-03-08 — add a local reset path for tile resizing so manual sizing is easier to recover from

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`

### Repro steps
1. Open the desktop sessions page with tiled sessions visible in compare or grid mode.
2. Manually resize a tile using the right, bottom, or corner handle until the tile feels awkwardly wide, tall, or both.
3. Try to get back to the layout baseline without switching layouts or guessing where a reset control might exist.
4. Before this change, the tile handles supported dragging only, so recovery depended on more dragging or using another control path that was not obviously connected to resize undo.

### UX problems found
- Tile resizing had a direct manipulation path but no equally local recovery path, which made accidental or exploratory resizing feel stickier than it should.
- The panel resize flow already uses the desktop pattern of double-clicking the handle to reset, so tiles were inconsistent with an adjacent resizing interaction in the same app.
- Resetting tile size via layout changes is indirect and can feel like the layout mode caused the fix rather than the resize affordance itself, which increases ambiguity.

### Investigation notes
- I reviewed the latest ledger first and chose resize recovery because recent iterations improved resize visibility but had not yet given tiles an obvious local undo/reset gesture.
- Code inspection showed the tile grid already uses `useResizable(...)` with layout-specific baseline dimensions (`layoutWidth` / `layoutHeight`), which made handle-level resets a small local change instead of a broader state refactor.
- I also checked `panel-resize-wrapper.tsx` to confirm the existing desktop precedent: double-clicking a resize handle already means reset there, so matching that behavior in tiles improves consistency.
- I attempted a quick live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- Double-click is an acceptable reset gesture here because the panel already establishes that precedent inside the desktop app.
- Resetting only the dimension implied by the edge handle is less surprising than always resetting both dimensions; the corner handle remains the full reset for width and height together.
- Adding the reset affordance to the handle `title` is sufficient for this iteration because it improves discoverability without adding more persistent chrome inside already dense tiles.

### Decision and rationale
- Chosen fix: let each tile resize handle support double-click reset back to the current layout baseline, with handle-specific behavior (`width`, `height`, or both via the corner handle) and explicit reset-aware handle titles.
- This keeps recovery directly attached to the interaction that created the state, which makes resizing feel less risky and easier to experiment with.
- Why this is better than the obvious alternatives:
  - better than adding a new visible reset button because tiles are already chrome-dense and the problem can be solved with an existing handle pattern;
  - better than resetting both dimensions from every handle because width-only and height-only handles imply a more local correction;
  - better than relying on layout switching as the reset path because layout mode and resize recovery are separate user intents.

### Code changes
- Added `getTileResizeResetSize(...)` in `apps/desktop/src/renderer/src/components/session-grid.tsx` so handle resets map cleanly to width-only, height-only, or full-size recovery.
- Added `getTileResizeHandleTitle(...)` in `session-grid.tsx` so tile resize handles can advertise `Double-click to reset tile size` without repeating literal strings inline.
- Updated the right-edge, bottom-edge, and corner tile resize handles in `session-grid.tsx` to:
  - expose stable `data-session-tile-resize-handle` markers;
  - use reset-aware titles; and
  - call `setSize(...)` on `onDoubleClick` to restore the current layout baseline for the relevant dimension(s).
- Extended `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with coverage for handle-specific reset dimensions.
- Extended `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with source assertions covering the reset copy, handle markers, and double-click reset wiring.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check` passed.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` could not run in this worktree because `vitest` is not available (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- A targeted dependency-light Node source-assertion script passed for the new reset-aware titles, handle markers, double-click reset wiring, and reset copy in `session-grid.tsx`.

### Still needs attention
- Once the desktop app is runnable here, the tile handles should get a quick live pass to confirm double-click reset feels reliable and does not produce any distracting resize flash before the reset fires.
- If live testing shows the handle-title hint is too hidden for discovery, the next small improvement should be a transient helper hint after the first manual resize rather than adding permanent button chrome.
- The shared/persisted tile sizing model is still broader than this local fix; a future pass could revisit whether per-layout or per-tile persistence would make recovery even more predictable.

## Iteration 2026-03-08 — add a direct sessions-page reset action when the floating panel is crowding tiled layouts

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/main/tipc.ts`
- `apps/desktop/src/main/window.ts`
- `apps/desktop/src/main/panel-recovery-actions.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active sessions in `Compare` or `Grid`.
2. Keep the floating panel visible and resize it wide enough that the sessions header starts warning that the panel is crowding tiles or forcing stacked layout.
3. From the sessions page itself, try to immediately recover tile space without first hunting for the panel edge or switching attention to the separate floating panel window.
4. Before this change, the sessions page explained the problem but did not provide a direct fix from the place where the problem was being felt.

### UX problems found
- The sessions header could diagnose panel-caused width pressure, but it still left the user to manually locate and resize the floating panel elsewhere.
- That made the recovery path feel split across two surfaces: diagnosis in the sessions page, action in the panel window.
- In practice this weakens the usefulness of the hint, especially when the user is trying to quickly get back to a usable compare or grid layout.

### Investigation notes
- I reviewed the latest ledger first and chose the floating-panel/tiled-session intersection because it was still explicitly called out as a follow-up area after several tile density and resize passes.
- Code inspection showed the core recovery action already exists and is safe to reuse: `resetPanelSizeForCurrentMode()` is exposed through TIPC and already powers panel-local recovery affordances.
- I attempted a quick live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- Reusing the existing mode-aware panel reset action is preferable to adding a new sessions-specific resizing abstraction because the intent is recovery, not introducing another width state source.
- Showing the new action only when the panel is likely crowding tiles is acceptable because it keeps the sessions header from accumulating permanent chrome.
- Suppressing the action in the very tightest header state is an acceptable tradeoff because adding another button there would likely worsen the density problem it is trying to solve.
- Even when the sidebar is also wide, offering the panel reset is still worthwhile because recovering some room is better than offering no direct action at all.

### Decision and rationale
- Chosen fix: add a compact `Reset panel` / `Reset panel size` action directly in the sessions header whenever the floating panel is the likely cause of stacked or near-stacked tiled layouts.
- The button calls the existing mode-aware panel reset path, inherits the same blue/amber urgency tone as the width-pressure hint beside it, and stays hidden in the very tightest header state to avoid adding counterproductive clutter.
- Why this is better than the obvious alternatives:
  - better than only changing hint copy because it turns diagnosis into an immediate recovery path;
  - better than adding an always-visible panel control because the action appears only when it is relevant;
  - better than inventing a sessions-only panel width preset because it reuses the established panel sizing model and desktop recovery behavior.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - track in-flight panel reset state,
  - compute when a panel recovery action should appear,
  - call `tipcClient.resetPanelSizeForCurrentMode({})` from a new `handleResetCrowdingPanel()` callback,
  - and render a contextual recovery button next to stacked / near-stacked width-pressure hints.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new recovery gate, labels, titles, TIPC reset call, loading state, and rendered button marker.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new sessions-page recovery gate, reset handler, TIPC call, button marker, label copy, and matching test coverage.

### Still needs attention
- Once the desktop app is runnable here, this new sessions-header action should get a live pass at both compact and regular widths to confirm the button feels discoverable without crowding the layout selector.
- If live testing shows users still miss the connection between the sessions hint and the panel, the next small improvement should be copy tuning (for example emphasizing “recover room”) before adding any more controls.
- The panel-local resize affordance and the sessions-page recovery affordance now complement each other, but the broader interaction between sidebar width, panel width, and tile density still deserves a renderer-level pass in a runnable desktop environment.

## Iteration 2026-03-08 — keep manual tile heights from staying awkwardly tall after the tiled viewport shrinks

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with at least one visible tile.
2. Manually make a tile noticeably taller than the current layout baseline.
3. Shrink the main window height (or otherwise reduce the tiled viewport height) without changing layout mode.
4. Before this change, the tile could stay at its old tall height even after the viewport got much shorter, making the tiled page feel more vertically awkward than the new window size justified.

### UX problems found
- Width already had a responsive reflow path, but height did not, so tile sizing reacted more gracefully to horizontal pressure than vertical pressure.
- A tile height that felt reasonable on a tall window could become disproportionately large after the viewport shrank, pushing more of the tiled page below the fold.
- Because tile height is persisted, this could make a temporary resize experiment feel “sticky” across later window-size changes in a way that did not match the new available space.

### Investigation notes
- I reviewed the latest ledger first and deliberately picked a height-responsiveness gap rather than repeating the more recent panel-recovery or tile-reset work.
- `session-grid.tsx` already had a width-only responsive reflow effect plus layout-specific `layoutHeight` calculations, which made a height-specific follow-up possible without changing the broader resize model.
- Inspecting `use-resizable.ts` confirmed that persisted tile sizes are shared and only clamped by absolute min/max values, not by the current tiled viewport height.
- I attempted a quick live Electron probe before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- When the tiled viewport becomes meaningfully shorter, it is better to clamp overly tall manual heights back to the current layout baseline than to preserve the old oversized height literally.
- If a user already chose a shorter-than-baseline height, that preference should survive viewport shrinkage instead of being stretched back up.
- Avoiding automatic height growth on viewport expansion is acceptable for this local pass because preserving user intent is more important than trying to guess when the app should make tiles taller again.

### Decision and rationale
- Chosen fix: add a small responsive-height recovery path that only runs when the tiled viewport height shrinks noticeably, and only pulls a tile down when its current manual height no longer fits the new layout baseline.
- This keeps manual resize intent where it still fits, but prevents stale tall heights from making smaller windows feel unnecessarily clumsy.
- Why this is better than the obvious alternatives:
  - better than leaving height fully sticky because the tiled layout now reacts more predictably to vertical viewport changes;
  - better than always resetting height on any container-height change because shorter intentional heights are preserved;
  - better than scaling heights up and down symmetrically because that would start rewriting user intent during benign window growth.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - add `calculateResponsiveTileHeight(...)` for the shrink-only height-recovery decision;
  - track the last measured tiled viewport height alongside the existing width reflow state;
  - and clamp overly tall tile heights back to `layoutHeight` when the tiled viewport height drops by more than `20px` outside Single view.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with focused helper tests covering:
  - shrink-time clamping for overly tall tiles,
  - preservation of already-short manual heights,
  - and no forced growth when the viewport gets taller again.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts tiling-ux.md` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new height helper, the shrink-only recovery effect, the clamp call, and the new test coverage.

### Still needs attention
- Once the desktop app is runnable here, this height-recovery behavior should get a live pass with both `Compare` and `Grid` to confirm the `20px` shrink threshold feels natural.
- If the clamp feels too aggressive for users who intentionally keep tiles taller than the viewport, the next local tweak should be threshold or guard tuning before revisiting the broader persistence model.
- The underlying shared tile-size persistence remains broader than this fix; a future pass could still explore whether per-layout or per-tile persistence would make height behavior even more predictable.

## Iteration 2026-03-08 — give the sidebar resize rail a local reset path back to its default width

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/hooks/use-sidebar.ts`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid`.
2. Widen the left sidebar enough that the sessions header starts blaming sidebar width for tighter tiled layouts.
3. Move to the sidebar resize rail to recover space for tiles.
4. Before this change, the rail supported dragging only, so getting back to the normal resting width required manual guessing rather than a quick local reset gesture.

### UX problems found
- The sessions page could already diagnose a wide sidebar, but the sidebar edge itself still lacked a fast recovery path back to its default width.
- That made sidebar recovery less coherent than adjacent resizing surfaces in the same app: tiles and the floating panel already support local reset behavior from the resize affordance itself.
- In practice, a persisted overly wide sidebar could keep crowding tiled layouts even after the user understood the problem, because the recovery interaction was still more trial-and-error than it needed to be.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose the sidebar rail rather than repeating the more recent tile-height or panel-header recovery work.
- Code inspection showed `useSidebar()` already exposes a `reset()` helper, but `app-layout.tsx` was not wiring it into the visible resize rail.
- `sessions.tsx` already contains sidebar-specific width-pressure hints (`Narrow sidebar...` / `Sidebar is crowding...`), which made the missing local reset affordance especially noticeable.
- I attempted a lightweight live Electron inspection before documenting the result, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- Resetting the sidebar rail back to the default width is a better local recovery target than collapsing it, because the intent here is usually “give tiles their normal room back” rather than “hide the sidebar entirely.”
- Using double-click on the resize rail is acceptable because the desktop app already teaches the same reset pattern on tile and floating-panel resize handles.
- Adding a small drag-time reminder about the reset gesture is acceptable because it only appears while the user is already engaged with the sidebar resize interaction.

### Decision and rationale
- Chosen fix: make the visible sidebar resize rail support double-click reset back to the default width, and explicitly advertise that behavior in both the rail tooltip/accessibility copy and the drag-time hint bubble.
- I also hardened the hook-level `reset()` path so it clears any in-flight resize listeners/state before restoring the default width.
- Why this is better than the obvious alternatives:
  - better than relying on manual drag-only recovery because it gives users a quick predictable way back to the known-good sidebar width;
  - better than adding a new persistent `Reset sidebar` button because the recovery action stays attached to the resize control that created the state;
  - better than collapsing the sidebar automatically because that is a stronger layout change than most users want when they only need to reclaim normal tile room.

### Code changes
- Updated `apps/desktop/src/renderer/src/hooks/use-sidebar.ts` so `reset()` now:
  - clears any active resize listeners,
  - exits resize state,
  - clears live resize delta,
  - restores the default width baseline before removing persisted custom width.
- Updated `apps/desktop/src/renderer/src/components/app-layout.tsx` to:
  - wire `reset: resetSidebar` from `useSidebar()`,
  - advertise `Double-click to reset to the default width` in the sidebar resize rail tooltip/ARIA label,
  - add a small `Double-click rail to reset to default width` reminder in the drag-time sidebar hint bubble,
  - and add `onDoubleClick` handling plus a stable `data-sidebar-resize-resettable` marker on the rail.
- Extended `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` with focused source assertions covering the new double-click reset wiring and hook-side reset cleanup.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/hooks/use-sidebar.ts apps/desktop/src/renderer/src/components/app-layout.tsx apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new sidebar reset cleanup, drag-hint copy, resettable marker, double-click handler, and updated test coverage.

### Still needs attention
- Once the desktop app is runnable here, the sidebar rail should get a live pass to confirm double-click reset does not feel too easy to trigger accidentally during ordinary dragging.
- If live testing shows the tooltip/hint copy is still too subtle, the next local improvement should be a temporary `Reset sidebar` chip only when the sidebar is clearly crowding tiled sessions.
- The broader end-to-end interaction among sidebar width, panel width, and tile density still deserves a renderer-level pass in a runnable desktop environment.

## Iteration 2026-03-08 — stop `2x2` grid mode from reserving an empty second row when only two sessions are visible

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page in `Grid` with three or four visible sessions.
2. Dismiss or complete sessions until only two visible tiles remain while keeping `Grid` selected.
3. Compare the tile footprints against the available tiled viewport height.
4. Before this change, the two remaining tiles could keep the old half-height `2x2` baseline, leaving a large empty lower band even though the grid no longer needed a second row.

### UX problems found
- `2x2` height math was still hard-coded to a two-row baseline, so Grid could preserve an empty second row after the visible session count dropped to one row.
- That made tiled sessions feel more awkward than necessary at the exact moment the user had already simplified the workspace.
- The problem was especially noticeable after closing a tile from a fuller grid, because the remaining tiles could keep looking artificially compressed instead of taking back the freed height.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh layout-footprint issue instead of repeating the recently touched sidebar, panel, or reorder areas.
- Code inspection confirmed the issue in `session-grid.tsx`: width already adapts to actual columns, but `calculateTileHeight(...)` still treated every `2x2` state as two rows.
- There were no focused tests covering the `2x2` + two-visible-sessions case yet.
- I attempted a live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- Scope check: this grid-sizing behavior is desktop-renderer-specific, so there is no corresponding mobile tiled surface to update in this iteration.

### Assumptions
- When Grid only needs one visible row, reclaiming the freed height is better than preserving a literal empty second-row footprint.
- Automatic height correction should stay narrow: if a tile is still sitting at the old default row baseline, it should sync to the new baseline; clearly manual custom heights should keep winning.
- Keeping this change inside `session-grid.tsx` is preferable to adding new sessions-page layout state, because the issue is local to tile measurement and row allocation.

### Decision and rationale
- Chosen fix: make `2x2` tile height depend on the number of visible rows actually needed, and locally reconcile stale default heights when Grid moves between one-row and two-row states.
- Why this is better than the obvious alternatives:
  - better than leaving the old fixed half-height behavior because it removes a large patch of avoidable empty space;
  - better than forcing all tiles to full height in every two-session case because manual custom heights can still survive unless they were just the stale old default;
  - better than inventing another sessions-header hint because the problem was the tile footprint itself, not missing explanation.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - derive `2x2` row count from visible session count,
  - make `calculateTileHeight(...)` reserve a second row only when Grid actually needs one,
  - and reconcile stale one-row/two-row default heights so Grid expands or contracts cleanly when visible session count crosses that row boundary.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with focused coverage for the new `2x2` row-aware height behavior.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new row-count helper, stale-grid-height reconciliation, and updated test coverage.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass while moving from 4 → 2 visible Grid tiles and back to confirm the height change feels natural rather than jumpy.
- If live testing shows the current `8px` stale-default tolerance is either too eager or too strict, the next local tweak should be threshold tuning before revisiting the broader tile-size persistence model.
- The broader shared tile-size persistence model is still bigger than this local fix; a future pass could still explore whether per-layout persistence would make Grid/Compare transitions more predictable.

## Iteration 2026-03-08 — add a direct `Reset sidebar` recovery action where tiled sessions already diagnose sidebar pressure

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid`.
2. Widen the left sidebar until the sessions header starts warning that sidebar width is pushing the layout toward stacked / tighter tiled states.
3. Stay in the sessions header area where that diagnosis is visible.
4. Before this change, the header explained the problem but still offered no direct sidebar recovery action there, so the user had to remember the rail-level double-click reset or drag the sidebar manually.

### UX problems found
- The sessions header could already tell the user that sidebar width was crowding tiles, but it still stopped short of offering an immediate recovery action in the same place.
- That made the sidebar story less coherent than the floating-panel story: the sessions header already offered a direct `Reset panel` action when panel width was the active pressure source.
- In practice, this created a small context switch at the moment of diagnosis: the user had to leave the tiled-session controls, move to the sidebar rail, and recall a separate reset gesture just to recover normal tile room.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked the sidebar-header recovery gap rather than revisiting the more recent grid-height change.
- Code inspection showed the underlying sidebar reset path already existed in `app-layout.tsx` via `useSidebar().reset`, but routed pages were only receiving `sidebarWidth`, not the reset action itself.
- `sessions.tsx` already had sidebar-pressure hint logic and an existing panel-recovery button, which made the missing sidebar companion especially obvious.
- Scope check: this is specific to the desktop shell's routed layout + resizable sidebar pattern, so there is no corresponding mobile tiled surface to update in this pass.

### Assumptions
- When the sessions header is already diagnosing sidebar pressure, surfacing a small `Reset sidebar` action there is acceptable because it is directly tied to the active issue rather than adding generic new chrome.
- Only showing one contextual recovery action at a time is preferable to stacking both sidebar and panel reset buttons together, because keeping the header lean matters when width is already constrained.
- Reusing the existing sidebar reset behavior is safer than inventing a new collapse/expand workflow, because the known-good default width is the local state users most often want back.

### Decision and rationale
- Chosen fix: pass `resetSidebar` through the routed layout context and render a contextual `Reset sidebar` / `Reset sidebar width` button in the sessions header whenever sidebar width is the likely tiling pressure source.
- I intentionally suppress that button when the existing panel recovery action is already visible, so the header does not accumulate multiple competing recovery chips in the same constrained space.
- Why this is better than the obvious alternatives:
  - better than relying only on the sidebar rail gesture because the recovery action now lives beside the diagnosis that triggered it;
  - better than always showing both sidebar and panel reset buttons because a single prioritized action keeps the crowded header easier to scan;
  - better than adding another global settings control because this is a contextual tiled-layout problem with a contextual recovery path.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/app-layout.tsx` to include `resetSidebar` in the outlet context shared with routed pages.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - accept `resetSidebar` from layout context,
  - derive a `showSidebarSizeRecoveryAction` state from the existing sidebar-pressure hints,
  - prefer a compact `Reset sidebar` label on narrow headers and `Reset sidebar width` on roomier ones,
  - and render a styled sidebar recovery button beside the tiling pressure hints when panel recovery is not already occupying that slot.
- Updated `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new context wiring and sidebar recovery action.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts apps/desktop/src/renderer/src/components/app-layout.tsx apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new `resetSidebar` outlet wiring, sidebar-recovery guards, render markers, and updated source-assertion tests.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass with narrow and wide session headers to confirm the sidebar recovery button feels helpful rather than redundant with the rail double-click gesture.
- If real use shows that combined sidebar + panel pressure still feels ambiguous, the next local refinement should revisit whether both recovery actions should coexist on wider headers instead of prioritizing one.
- The broader interaction among sidebar width, floating-panel width, and layout-mode switching still deserves an end-to-end renderer pass in a runnable desktop environment.

## Iteration 2026-03-08 — make the compact tile composer behave like a temporary focus affordance

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles so at least one session remains non-focused in Compare or Grid.
2. Use the compact follow-up row in that non-focused tile (`Continue in tile…` or the voice button).
3. Before this change, notice that the composer could expand or start a voice follow-up while the tile itself still remained visually non-focused.
4. Then switch focus to another tile without typing anything and notice that the previously expanded composer could stay open, leaving extra footer chrome behind in the dense grid.

### UX problems found
- The compact tile composer was meant to be a lightweight entry point into focused work, but it did not actually request tile focus when engaged.
- That made the interaction feel inconsistent with the rest of the tiled workflow: the user was clearly acting on one tile, but the surrounding focus treatment could still suggest that another tile was primary.
- Empty expanded composers could also remain sticky after the tile returned to compact mode, which quietly reintroduced the same footer density the compact affordance was supposed to avoid.

### Investigation notes
- I reviewed the latest ledger first and chose an older open compact-composer continuity issue rather than revisiting the more recent sidebar/header/grid sizing passes.
- Code inspection confirmed that `AgentProgress` already passes `onRequestFocus={onFocus}` into `TileFollowUpInput`, but the component was not destructuring or using that prop.
- I attempted a quick live Electron inspection before finalizing, but this workflow still has no inspectable target (`No Electron targets found`).

### Assumptions
- Engaging a tile-scoped follow-up composer should count as intent to work in that tile, so requesting tile focus is the safer default than silently leaving focus elsewhere.
- When a tile returns to compact mode with no draft content, collapsing the expanded composer back to its lighter row is better than preserving empty chrome.
- Preserving expanded state while there is draft content is an acceptable tradeoff for this local pass, because hiding in-progress text would be more harmful than leaving a rare non-empty composer visible.

### Decision and rationale
- Chosen fix: make compact-composer engagement explicitly route back through the existing tile-focus model, and automatically re-collapse empty composers when the tile returns to compact mode.
- Why this is better than the obvious alternatives:
  - better than only changing copy because the actual mismatch was behavioral: the UI needed to focus the tile, not just describe that intent;
  - better than leaving expanded composers sticky because the compact row is supposed to preserve dense-grid scanability when the user is no longer actively working in that tile;
  - better than adding a new tile-substate abstraction because the existing `onRequestFocus` plumbing already expressed the right product intent.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx` to:
  - destructure and use the existing `onRequestFocus` prop,
  - request tile focus when the compact composer is expanded or when voice follow-up is started,
  - request tile focus on composer focus events so keyboard engagement also aligns with tile focus,
  - and auto-collapse empty expanded composers when the tile returns to compact mode.
- Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts` with source assertions covering the focus-request wiring and empty-state re-collapse behavior.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts` passed.
- A dependency-light Node source-assertion script passed for the new `onRequestFocus` wiring, compact-mode re-collapse guard, and focus-capture hooks.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A second dependency-light Node source-assertion script passed for the updated compact-mode source-assertion test coverage.

### Still needs attention
- Once a runnable desktop target is available, this should get a live pass to confirm focus styling, input focus, and compact-row re-collapse feel natural when moving quickly between tiles.
- If real use shows draft-bearing non-focused composers still feel too sticky, the next local pass could explore a clearer compact-with-draft state instead of immediately showing the full form.
- The broader tiled-workflow continuity between inline follow-up, Single view, and floating-panel takeovers still deserves a future end-to-end renderer pass.

## Iteration 2027-03-08 — condense compact summary `Latest Activity` into a lighter sticky row

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Repro steps
1. Open the desktop sessions page with multiple visible tiled sessions so at least one tile is in compact, non-focused `Summary` mode.
2. Switch that tile to the `Summary` tab while the agent is still running and emitting step summaries.
3. Scroll enough to notice the sticky `Latest Activity` footer at the bottom of the summary timeline.
4. Before this change, the compact state still used a padded card-style footer, which occupied more vertical space than necessary in already-tight tiled layouts.

### UX problems found
- Compact summary mode had already simplified the important-findings banner, but the sticky `Latest Activity` treatment still looked like a full card.
- In narrow or short tiles, that extra chrome made the summary timeline feel more bottom-heavy than the rest of the compact tile design.
- Because the same action summary is also represented in the timeline itself, dedicating a full compact card to the sticky footer created avoidable duplication instead of a lightweight live-status reminder.

### Investigation notes
- I reviewed the ledger first and intentionally chose an older, still-open summary-density item rather than revisiting the more recent sidebar, grid-height, or compact-composer passes.
- Code inspection confirmed that `AgentProgress` already passes `compact={shouldUseCompactTileSummaryView}` into `AgentSummaryView`, so this could stay a local summary-view refinement.
- The compact important-findings banner already established a good pattern: a single-line, title-backed summary row that preserves dense tile scanability.
- I attempted live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- In compact tiles, the sticky latest-activity treatment should act as a lightweight status reminder, not a second primary content card.
- Truncating the compact latest-activity text to a single line is acceptable because the full action summary remains available via tooltip title text and in the main summary timeline below.
- Keeping the expanded, non-compact footer unchanged is preferable in this local pass because the density problem was specific to narrow tiled summary mode rather than the broader single-view presentation.

### Decision and rationale
- Chosen fix: keep the sticky footer behavior, but render compact `Latest Activity` as a slimmer inline status row with an icon, short label, truncation, and hover title instead of a padded card.
- Why this is better than the obvious alternatives:
  - better than leaving the compact card untouched because it frees vertical space and reduces visual weight where tiles are already constrained;
  - better than removing the sticky latest indicator entirely because the user still gets a stable live-progress cue while scrolling older summaries;
  - better than changing the non-compact view too because the problem was tile density, not the overall summary information architecture.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` to:
  - derive a `latestSummaryActionTitle` tooltip label,
  - reduce compact sticky-footer top padding slightly,
  - render compact `Latest Activity` as a lighter inline row with a clock icon, `Latest` label, and truncated action summary,
  - and preserve the previous card-style presentation for non-compact summary views.
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with focused source assertions covering the new compact latest-activity treatment.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-summary-view.layout.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted targeted verification: `pnpm --filter @dotagents/desktop run typecheck:web`
- Result: blocked by missing installed desktop dependencies in this worktree (`node_modules` absent, missing `@electron-toolkit/tsconfig/tsconfig.web.json`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new compact latest-activity title, condensed row styling, truncation, and preserved non-compact card markup.
- `git diff --check` passed.

### Still needs attention
- Once the desktop app is runnable here, this compact summary footer should get a live pass at narrow widths to confirm the truncation still leaves enough context when summaries change rapidly.
- If live use shows one-line truncation hides too much status, the next local tweak should prefer a two-line clamp or an inline expand affordance before revisiting the overall summary layout.
- The broader compact-summary information hierarchy still deserves a future pass on how `Agent Activity`, important findings, and sticky live status balance against each other in very short tiles.

## Iteration 2026-03-08 — make the visible tile resize grip keyboard-accessible

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles in Compare or Grid so resize handles are visible.
2. Try to adjust a tile precisely without dragging, or while using keyboard-only navigation.
3. Before this change, the tile resize affordances exposed hover titles and double-click reset copy, but the visible corner grip itself could not receive focus or respond to keyboard input.
4. That left resize precision and accessibility overly dependent on pointer dragging alone.

### UX problems found
- Tile resizing remained effectively mouse-only even after recent affordance work made the handles more visible.
- That created an awkward gap: the UI now visibly taught resizing, but the clearest grip still could not participate in keyboard navigation or precise nudge-style adjustments.
- Adding separate visible controls would have increased tile chrome in an already dense area, so the better opportunity was to make the existing grip more capable.

### Investigation notes
- I reviewed the ledger first and intentionally chose an older resize-accessibility gap rather than revisiting the more recent compact summary or compact composer passes.
- `session-grid.tsx` already owned the visible bottom-right corner grip, the resize titles, and the shared `setSize(...)` path, which made this a local improvement.
- `use-resizable.ts` already clamps width and height through `setSize(...)`, so keyboard nudges could reuse the existing size constraints instead of introducing a second resize model.
- I attempted live Electron inspection before changing code, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- The corner grip is the right keyboard entry point because it already represents two-dimensional resizing and avoids adding three extra tab stops per tile.
- A small fixed keyboard nudge (`24px`) is a reasonable default for this iteration because it is large enough to feel meaningful without making width/height correction jumpy.
- Keeping reset on the existing pointer double-click gesture is acceptable for now because keyboard nudges are reversible and this pass is focused on local accessibility/precision rather than redesigning the whole resize interaction model.

### Decision and rationale
- Chosen fix: make the existing corner resize grip focusable, advertise arrow-key resizing in its title and accessibility text, and let arrow keys nudge width/height through the existing `setSize(...)` path.
- Why this is better than the obvious alternatives:
  - better than adding new visible buttons because it improves the current affordance without increasing tile chrome;
  - better than making every resize edge a separate keyboard stop because the corner grip already communicates two-dimensional resizing and keeps tab order lighter;
  - better than leaving resizing mouse-only because it makes the visible grip more precise and more accessible while staying local to the grid wrapper.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - add `getTileResizeKeyboardAdjustment(...)` for local arrow-key resize mapping,
  - keep the current corner grip focused on the existing resize model instead of introducing a parallel state path,
  - make the corner handle focusable with `aria-keyshortcuts`, a keyboard-aware `aria-label`, and visible focus styling,
  - and wire arrow-key nudges through the existing `setSize(...)` path using current width/height refs for repeat-safe updates.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with pure coverage for keyboard resize adjustment mapping.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with source assertions covering the new keyboard-accessible corner-grip wiring.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script checking the keyboard resize constant, helper export, corner-grip title/ARIA wiring, focusability, key handler hookup, and updated test coverage.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm the `24px` keyboard nudge feels precise enough across narrow and wide tiled layouts.
- If keyboard resizing proves valuable in practice, the next local refinement should decide whether width-only and height-only edge handles also deserve keyboard affordances or whether the corner grip remains the intentionally singular keyboard control.
- Keyboard-accessible resize reset is still not explicit; if live use shows users want a faster way back to the layout baseline without pointer double-click, that should be solved with a clearly documented local shortcut rather than extra persistent chrome.

## Iteration 2026-03-08 — add an explicit keyboard reset to the focused tile resize grip

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles so the corner resize grip is available.
2. Focus the visible bottom-right resize grip with the keyboard.
3. Use arrow keys to nudge the tile away from the layout baseline.
4. Before this change, the same focused grip still forced reset back onto a pointer-only double-click gesture, so keyboard-only users could resize but not quickly recover the default tile footprint.

### UX problems found
- The previous keyboard-resize pass fixed precision nudging but left reset discoverability split across two input models.
- That mismatch made the corner grip feel half-finished: it taught keyboard resizing, yet the easiest way back to baseline still required a mouse gesture that keyboard users could not perform.
- Adding a dedicated reset button inside every tile would have added more dense chrome than the problem justified.

### Investigation notes
- I reviewed the ledger first and intentionally picked the explicit keyboard-reset gap called out in the prior iteration's "Still needs attention" section rather than revisiting the more recent compact tile content work.
- `session-grid.tsx` already centralizes corner-grip title text, ARIA copy, reset sizing, and keyboard-resize handling, so the fix stayed local to one component.
- The existing `getTileResizeResetSize("corner", layoutWidth, layoutHeight)` helper already expressed the correct baseline target, so the reset shortcut could reuse the same path as the double-click recovery instead of inventing new sizing logic.
- I attempted live Electron inspection again in this workflow, but there is still no inspectable renderer target (`No Electron targets found`).

### Assumptions
- `Enter` is an acceptable reset shortcut on a focused resize grip because it reads as an explicit local action without colliding with the existing arrow-key nudge model.
- Restricting reset to the keyboard-accessible corner grip is acceptable for now because that grip is already the single, focusable two-dimensional resize affordance.
- Avoiding modifier-key combinations is the right default here because the shortcut needs to stay discoverable from the grip's own title and accessibility text.

### Decision and rationale
- Chosen fix: let the focused corner resize grip use `Enter` to reset back to the layout baseline, and advertise that in the grip's title, ARIA label, and `aria-keyshortcuts` metadata.
- Why this is better than the obvious alternatives:
  - better than adding a persistent reset badge or button because it improves recovery without spending more space inside already dense tiles;
  - better than teaching a hidden modifier shortcut because the affordance can now explain the action directly where focus lands;
  - better than leaving reset pointer-only because it makes the keyboard resize interaction feel complete and internally consistent.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - add `isTileResizeKeyboardResetKey(...)` for the focused corner grip,
  - route `Enter` through the existing `getTileResizeResetSize("corner", layoutWidth, layoutHeight)` path,
  - update the corner grip's title and ARIA label to explicitly mention `Enter` reset,
  - and extend `aria-keyshortcuts` so assistive tech sees the full keyboard contract.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with focused source assertions for the new reset-copy and handler wiring.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with pure coverage for the new reset-key helper.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script checking the new Enter-reset copy, helper export, handler wiring, `aria-keyshortcuts`, and updated targeted tests.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm `Enter` feels natural on the focused grip and does not surprise users who expect it to behave like a generic button activation.
- If live use shows users still miss reset recovery, the next small improvement should prefer a lightweight visible hint on focus or after the first keyboard resize rather than adding always-on tile chrome.
- The broader question of whether width-only and height-only edge handles should ever gain keyboard parity remains open, but should be decided only after validating that the corner grip is sufficient in practice.

## Iteration 2026-03-08 — add a single combined recovery action when both sidebar and panel are crowding tiled sessions

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid`.
2. Widen both the left sidebar and the floating panel until the sessions header starts warning that both surfaces are crowding the tiled area (`Shrink sidebar + panel` / `Sidebar + panel crowd tiles`).
3. Stay in the same sessions header where that diagnosis is already visible.
4. Before this change, the header still preferred a single `Reset panel` action and suppressed the sidebar recovery button, so recovering from a clearly combined problem still took at least two separate interactions.

### UX problems found
- The header could already diagnose combined sidebar + panel pressure, but its recovery affordance only handled one side of that problem.
- That created an avoidable mismatch between explanation and action: the copy said both were crowding tiles, but the CTA only fixed the floating panel first.
- In practice this made the crowded state feel more ambiguous and stickier than necessary, especially in dense tiled layouts where users were already low on room.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose the still-open combined-pressure ambiguity rather than repeating the more recent compact-summary or keyboard-resize work.
- Code inspection confirmed the gap in `sessions.tsx`: combined hint labels already existed, but action logic still prioritized panel reset and hid sidebar reset when both were wide.
- The existing sidebar reset and panel reset paths were already local and reusable, so this improvement could stay inside the sessions header instead of adding new global controls.
- I attempted a lightweight live Electron inspection for this iteration too, but the workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- When both sidebar and panel are clearly crowding tiled sessions, a single combined recovery action is more intuitive than forcing users to apply two sequential partial fixes.
- `Reset both` is an acceptable compact label because the surrounding hint chip already explains that both surfaces are the issue.
- Reusing the existing sidebar reset and floating-panel reset behaviors is safer than inventing a new broader layout-reset abstraction for this local header-level improvement.

### Decision and rationale
- Chosen fix: replace the competing single-surface recovery CTA with a combined `Reset both` / `Reset sidebar + panel` action whenever the header is specifically diagnosing combined sidebar + panel tiling pressure.
- The existing panel-only and sidebar-only recovery buttons still remain for the cases where only one surface is actually crowding tiles.
- Why this is better than the obvious alternatives:
  - better than keeping panel reset as the only visible action because the recovery CTA now matches the diagnosis users are reading;
  - better than showing two adjacent reset buttons in the same crowded header because a single combined action reduces scan noise and decision friction when space is already tight;
  - better than adding a broader `Reset layout` control because this keeps recovery local to the exact surfaces causing the current pressure.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - derive `showCombinedSizeRecoveryAction` when both sidebar and panel are crowding tiles,
  - render a compact `Reset both` / roomy `Reset sidebar + panel` CTA with the same stacked vs near-stacked styling as the existing recovery buttons,
  - wire that CTA through a new `handleResetCrowdingSidebarAndPanel()` helper that reuses `resetSidebar()` plus `tipcClient.resetPanelSizeForCurrentMode({})`,
  - suppress the individual sidebar-only and panel-only recovery buttons while the combined action is visible,
  - and keep the existing spinner/disabled state shared with panel reset so recovery remains predictable during the async panel resize reset.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new combined recovery flag, labels, handler, error path, and render marker.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new combined recovery flag, label copy, combined handler, suppression of the single-surface actions while combined recovery is active, render marker, and updated targeted test coverage.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass with both `Compare` and `Grid` to confirm the combined CTA feels clearer than separate panel/sidebar recovery buttons.
- If real use shows some users want more granular control even when both surfaces are wide, the next local refinement should compare a single combined CTA against dual buttons only on wider headers rather than adding more persistent chrome.
- The combined failure toast currently prioritizes the likely failure mode (panel reset) after the sidebar has already recovered; if live use shows that message feels confusing, the next pass should make the partial-success state more explicit.

## Iteration 2026-03-08 — make compact ACP tile footers collapse to a single primary badge

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/acp-session-badge.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active tiled sessions so at least one tile is in the compact non-focused footer state.
2. Use an ACP-backed session whose footer shows both the agent badge and the model/mode badge.
3. Compare that footer against the same tile's status/context chips in a narrow or crowded layout.
4. Before this change, the compact tile footer still rendered the full two-badge ACP treatment even though `AgentProgress` was already passing `compact={shouldUseCompactTileFooter}` into `ACPSessionBadge`.

### UX problems found
- Compact tile footers were still spending horizontal space on both ACP badges, which made the footer feel busier than the surrounding compact status/context chips.
- In narrow tiles, the long ACP model/mode badge could wrap ahead of more important state cues and make the compact footer feel visually top-heavy for its size.
- The parent tile had already decided the footer should be compact, but the child badge component ignored that decision, so the density contract was inconsistent.

### Investigation notes
- I reviewed the ledger first and chose a fresh compact-footer density issue instead of revisiting the most recent summary, grid-height, sidebar, or resize iterations.
- Code inspection showed a particularly good local target: `AgentProgress` already passed a `compact` prop to `ACPSessionBadge`, but `ACPSessionBadge` neither declared nor used that prop.
- That made this a small, coherent fix with clear user value and low risk: honor the already-expressed parent intent rather than inventing a new layout abstraction.
- I attempted a lightweight live Electron inspection before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- In compact tiled footers, the ACP agent identity is the higher-priority badge and the model/mode badge is lower-priority supporting metadata.
- Hiding the model/mode badge only in compact mode is acceptable because the tooltip still preserves the full ACP session details on hover/focus.
- If an ACP session lacks agent identity but does have model info, the model badge should remain visible rather than collapsing the component away entirely.

### Decision and rationale
- Chosen fix: teach `ACPSessionBadge` to honor its existing compact mode by slightly tightening gap spacing and suppressing the secondary model badge when an agent badge is already present.
- Why this is better than the obvious alternatives:
  - better than leaving compact footers untouched because it reduces visual competition in one of the densest tile regions;
  - better than removing ACP info entirely because the primary agent badge still preserves identity and the tooltip keeps the full detail recoverable;
  - better than adding a new footer-specific badge component because the existing badge already had the right parent contract and only needed to respect it.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/acp-session-badge.tsx` to:
  - add a typed `compact?: boolean` prop,
  - tighten badge gap spacing in compact mode,
  - and hide the secondary model/mode badge when compact mode already has a primary ACP agent badge to show.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with focused source assertions covering the new compact ACP badge behavior.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/acp-session-badge.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script that checked the new `compact` prop, compact gap handling, model-badge suppression guard, and the updated targeted layout test coverage.

### Still needs attention
- Once the desktop app is runnable here, this compact ACP footer should get a live pass in both medium and very narrow tiles to confirm the single-badge treatment improves scanability without hiding too much context.
- If real use shows users still need model visibility in compact footers, the next local refinement should compare a single combined badge label or tooltip-trigger affordance before reintroducing a second chip.
- The broader compact tile footer hierarchy still has room for a future pass on whether status, context, and ACP identity should be grouped or ordered more explicitly under severe width pressure.

## Iteration 2026-03-08 — reduce duplicate chrome in short compact summary timelines

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Repro steps
1. Open the desktop sessions page with multiple tiled sessions so at least one tile is in compact, non-focused `Summary` mode.
2. Use a session that has only one or two step summaries so the summary timeline is short.
3. Switch that tile to `Summary` and compare the visible chrome against the actual summary content.
4. Before this change, compact summary mode still spent a full heading on `Agent Activity (N steps)` and also kept the sticky `Latest` row even when there was only one summary card, which duplicated the same action summary in a very short tile.

### UX problems found
- Compact summary tiles were still using more vertical and visual emphasis than necessary for section chrome in a space-constrained surface.
- The tab badge already communicates summary count, so repeating that count in a heavier `Agent Activity (N steps)` heading added noise without adding much orientation value.
- When only one summary existed, the sticky compact `Latest` row mostly repeated the same information already visible in the lone summary card.

### Investigation notes
- I reviewed the ledger first and intentionally chose an older, still-open compact-summary hierarchy issue instead of revisiting the more recent resize-grip, combined recovery, or compact ACP footer iterations.
- Code inspection confirmed `AgentSummaryView` was the right local target: compact summary rendering already diverged for important findings and latest activity, so the remaining duplicate chrome could be addressed without changing the tile shell or tab system.
- `agent-progress.tsx` already passes `compact={shouldUseCompactTileSummaryView}`, so the change could stay fully inside the summary component and preserve existing tile wiring.
- I attempted live desktop inspection again before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- In compact tiled summary mode, the tab badge is sufficient as the primary summary-count indicator, so the internal section heading can become lighter without harming orientation.
- Suppressing the compact sticky `Latest` row when there is only one summary is acceptable because that single card already expresses the latest state.
- Keeping the existing non-compact heading and sticky latest card unchanged is preferable because the duplicate-chrome problem was specific to dense tiled summary layouts rather than the broader single-view summary presentation.

### Decision and rationale
- Chosen fix: lighten compact summary timeline chrome by replacing the heavier `Agent Activity (N steps)` heading with a smaller `Timeline` label, and only show the compact sticky `Latest` row when there is more than one summary to navigate.
- Why this is better than the obvious alternatives:
  - better than leaving the compact heading unchanged because it reduces repeated count chrome in a tile that already exposes the summary count at the tab level;
  - better than removing all timeline labeling because the lighter `Timeline` label still preserves section orientation;
  - better than removing the sticky latest row entirely because it still remains valuable in longer compact timelines where scrolling can separate the newest action from older cards.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` to:
  - derive a reusable `summaryCountLabel` for the non-compact heading,
  - render a lighter compact `Timeline` heading instead of the heavier `Agent Activity (N steps)` section title,
  - and gate the compact sticky `Latest` row behind `summaries.length > 1` so single-summary tiles do not show redundant status chrome.
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with focused source assertions covering the lighter compact heading and the new compact latest-row guard.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-summary-view.layout.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script checking the new compact timeline label, summary-count helper, compact latest-row guard, and the updated targeted test coverage.

### Still needs attention
- Once the desktop app is runnable here, this compact summary pass should get a live check with one-summary and many-summary sessions to confirm the new balance feels better in both short and scrollable timelines.
- If real use shows the compact summary tab still feels too top-heavy, the next local refinement should compare making the important-findings row collapsible or less persistent before touching summary-card content itself.
- The broader compact summary hierarchy still deserves a future pass on how `Timeline`, important findings, and sticky live status should balance when tiles are both narrow and short.

## Iteration 2026-03-08 — give tile edge resize rails the same keyboard recovery path as the corner grip

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles in `Compare` or `Grid`.
2. Notice that the right-edge and bottom-edge resize rails are visible and support pointer drag plus double-click reset.
3. Try to reach those same edge rails with keyboard navigation for a width-only or height-only adjustment.
4. Before this change, only the corner grip exposed keyboard resize and reset behavior, so the visible edge rails still behaved like pointer-only affordances.

### UX problems found
- The tiled resize model had already learned keyboard nudges and reset, but only the corner grip exposed that capability.
- That made the visible width-only and height-only rails less coherent than they looked: users could discover them visually, but not actually use them for keyboard precision or recovery.
- It also forced keyboard users toward the two-dimensional corner control even when their intent was only to adjust one dimension locally.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose the still-open resize-affordance parity gap rather than revisiting the more recent compact-content and sidebar/panel recovery iterations.
- Code inspection confirmed the change could stay local to `session-grid.tsx`: `getTileResizeKeyboardAdjustment(...)` and `getTileResizeResetSize(...)` already supported `width`, `height`, and `corner`, but the keyboard wiring only existed for the corner handle.
- That made this a small, coherent fix with clear value: extend the existing resize model to the existing visible rails instead of inventing any new layout state or controls.
- I attempted live Electron inspection again before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- Adding keyboard parity to the already-visible edge rails is acceptable even though it introduces two additional tab stops, because those rails already communicate single-axis intent and the interaction remains local to focused resizing.
- `Enter` should reset the focused width or height rail back to its local baseline, matching the corner grip's keyboard recovery model rather than teaching a second reset pattern.
- A subtle focus ring on the thin rails is acceptable because a focusable affordance needs visible focus feedback, especially on narrow hit targets.

### Decision and rationale
- Chosen fix: make the visible width and height resize rails focusable, advertise handle-specific arrow-key instructions plus `Enter` reset, and route their keyboard input through the same existing tile resize helpers as the corner grip.
- Why this is better than the obvious alternatives:
  - better than leaving the edge rails pointer-only because it makes the visible affordances behave consistently across input methods;
  - better than adding separate width/height buttons because it improves the controls users already see instead of adding more tile chrome;
  - better than forcing all keyboard resizing through the corner grip because width-only and height-only intent now has a direct, predictable target.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - extend tile resize title and ARIA helper copy for keyboard-accessible `width` and `height` rails,
  - replace the corner-only keyboard handler with a handle-type-aware `handleTileResizeKeyDown(...)` callback,
  - make the visible width and height rails focusable with handle-specific `aria-keyshortcuts`, `aria-label`, and focus styling,
  - and wire `Enter` reset plus directional arrow nudges for all three resize handle types through the shared resize helpers.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with focused source assertions covering the new edge-rail keyboard copy, accessibility metadata, and handler wiring.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` to clarify the existing keyboard-resize helper coverage now applies to visible edge and corner grips.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script covering the new width/height keyboard copy, generic keydown handler, reset wiring, handle-specific shortcut metadata, and edge/corner `onKeyDown` hookups.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm the extra keyboard stops on width and height rails feel helpful rather than noisy in dense tile navigation.
- If real use shows the extra tab stops are too heavy, the next local refinement should compare roving-focus or focus-on-demand patterns before removing keyboard parity.
- The broader question of whether resize rails should expose richer keyboard semantics (for example `role="separator"` with value announcements) should wait for live validation first rather than broadening the accessibility surface prematurely.

## Iteration 2026-03-08 — make the sidebar resize rail keyboard-accessible

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/hooks/use-sidebar.ts`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- `apps/desktop/src/renderer/src/hooks/use-sidebar.keyboard-resize.test.ts`

### Repro steps
1. Open the desktop app with the sessions page active so tiled sessions are visible.
2. Try to recover space for Compare/Grid by adjusting the left sidebar without using a pointer.
3. Before this change, the visible sidebar resize rail exposed drag and double-click reset copy, but it could not receive keyboard focus or respond to keyboard input.
4. That made a layout control with direct impact on tiled-session density feel pointer-only, even after tile resize rails had already gained keyboard support.

### UX problems found
- The sidebar resize rail was visibly present and important to tiled-session width, but it still behaved like hidden pointer-only functionality for keyboard users.
- That created an inconsistency with the newer tile resize affordances, which already taught arrow-key resize and keyboard reset behavior.
- Because sidebar width directly changes whether Compare/Grid stay comfortable, forcing recovery back onto pointer drag added unnecessary friction in a core tiled workflow.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh sidebar-width interaction gap instead of revisiting the more recent compact summary or tile-content density passes.
- Code inspection showed a good local boundary for the fix: `app-layout.tsx` already owns the visible sidebar rail, while `use-sidebar.ts` already owns width clamping, persistence, and reset behavior.
- A quick live inspection attempt via Electron tooling was made before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- One additional keyboard stop on the app-shell sidebar rail is acceptable because sidebar width materially changes the tiled-session experience and the rail is already a visible affordance.
- Matching the tile-resize keyboard step (`24px`) is a reasonable default because it keeps width nudges meaningful without feeling jumpy.
- A local focus/keyboard enhancement is preferable to adding a new visible button or wider instructional chrome because the existing rail already communicates the right mental model.

### Decision and rationale
- Chosen fix: make the existing sidebar resize rail focusable, advertise arrow-key resize plus `Enter` reset in its title/ARIA metadata, and route keyboard nudges through the existing sidebar width/persistence model.
- Why this is better than the obvious alternatives:
  - better than leaving the rail pointer-only because the sidebar is a first-order cause of tiled-session crowding;
  - better than adding a separate width stepper or reset button because it improves the control users already see without spending more sidebar chrome;
  - better than a broader accessibility refactor because it stays local to the sidebar rail and existing `use-sidebar` hook.

### Code changes
- Updated `apps/desktop/src/renderer/src/hooks/use-sidebar.ts` to:
  - export `SIDEBAR_KEYBOARD_RESIZE_STEP`, `getSidebarResizeKeyboardAdjustment(...)`, and `isSidebarResizeResetKey(...)`,
  - expose `adjustWidthBy(...)` from the hook,
  - and persist/clamp keyboard width nudges through the existing sidebar state model.
- Updated `apps/desktop/src/renderer/src/components/app-layout.tsx` to:
  - wire the existing sidebar rail to `tabIndex={0}` and `onKeyDown`,
  - add `aria-keyshortcuts="ArrowLeft ArrowRight Enter"`, keyboard-aware title copy, and focus styling,
  - and route `ArrowLeft` / `ArrowRight` to width nudges with `Enter` reset.
- Added `apps/desktop/src/renderer/src/hooks/use-sidebar.keyboard-resize.test.ts` for pure helper coverage.
- Updated `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts` with focused source assertions covering the new keyboard wiring.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/app-layout.tsx apps/desktop/src/renderer/src/hooks/use-sidebar.ts apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts apps/desktop/src/renderer/src/hooks/use-sidebar.keyboard-resize.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted verification: `pnpm exec vitest run apps/desktop/src/renderer/src/hooks/use-sidebar.keyboard-resize.test.ts apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script covering the new sidebar keyboard step constant, helper exports, `adjustWidthBy(...)` persistence path, rail focusability, keydown wiring, shortcut metadata, and updated targeted test coverage.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm the extra sidebar rail tab stop feels helpful rather than noisy in real keyboard navigation.
- If live use suggests the rail needs richer semantics for assistive tech, the next pass should evaluate a true `separator`-style interaction with announced values instead of continuing to grow ad hoc ARIA copy.
- Floating panel resize handles still do not have matching keyboard parity, so a future pass could decide whether panel-width adjustment should mirror the same keyboard recovery model when it directly crowds tiled sessions.

## Iteration 2026-03-08 — give width-affecting floating panel resize handles keyboard parity

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts`

### Repro steps
1. Open the floating desktop panel while tiled sessions are also visible or expected to stay visible in the main window.
2. Try to recover tiled-session room by narrowing the floating panel without using pointer drag.
3. Before this change, the panel resize handles exposed visible drag affordances and width-affecting handles also supported double-click reset, but none of those handles could receive keyboard focus or respond to arrow keys / `Enter`.
4. That meant a control with direct impact on Compare/Grid crowding still behaved as pointer-only even after tile and sidebar resize rails had already gained keyboard support.

### UX problems found
- Floating panel width directly affects how soon Compare/Grid layouts feel crowded, but its resize handles still lacked the same keyboard precision and recovery path as nearby tiled-workflow width controls.
- The existing handle titles only taught pointer behavior, so the visible panel resize chrome was less discoverable and less consistent for keyboard users.
- Reset was already local to width-affecting handles via double-click, but keyboard users had no equivalent way to undo an oversized panel without switching input methods.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose the still-open panel-resize parity gap instead of revisiting the more recent compact-content density passes.
- Code inspection showed a clean local boundary: `panel-resize-wrapper.tsx` already routes `onResetSize` only to width-affecting handles, so `resize-handle.tsx` could add keyboard parity without changing broader panel state or layout logic.
- `ResizeHandle` already fetches current panel size for pointer drag start, which made it a good place to add local keyboard resize math and focused recovery behavior.
- I attempted live Electron inspection again before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- It is acceptable to limit keyboard parity to width-affecting floating-panel handles for now because panel width is the part that directly crowds tiled-session layouts, while leaving top / bottom rails pointer-only avoids adding even more keyboard stops in this iteration.
- Arrow-key semantics should follow the focused handle's movement direction (for example the left rail widens on `ArrowLeft`) because that matches the visible edge/corner mental model more closely than a generic “left always shrinks” rule.
- Reusing `Enter` as the focused handle reset key is acceptable because tile and sidebar resize affordances already established that recovery pattern elsewhere in the tiled workflow.

### Decision and rationale
- Chosen fix: make the existing width-affecting floating-panel handles focusable, advertise handle-specific arrow-key instructions plus `Enter` reset in title / ARIA metadata, and reuse the existing per-handle reset affordance instead of adding more visible controls.
- Why this is better than the obvious alternatives:
  - better than leaving the handles pointer-only because panel width is a first-order cause of tiled-session crowding;
  - better than adding a separate reset or width stepper button because it improves the resize chrome users already see instead of adding more floating-panel UI;
  - better than making every panel rail keyboard-focusable immediately because this narrower pass targets the tiled-workflow pain point without multiplying focus stops for purely height-only resizing.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` to:
  - export a shared panel keyboard resize step and helper functions for arrow-key nudges plus `Enter` reset,
  - add keyboard-aware title and ARIA copy for width-affecting handles,
  - make resettable handles focusable with `aria-keyshortcuts`, `onKeyDown`, and visible focus styling,
  - and route focused arrow-key nudges through the existing panel size update path by reading current panel size and committing the adjusted size via `onResizeEnd(...)`.
- Added `apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts` for pure helper coverage of width / corner keyboard adjustments and reset-key detection.
- Updated `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts` with focused source assertions covering keyboard-aware copy, keyboard wiring, shortcut metadata, and focus-visible styling.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted verification: `pnpm exec vitest run apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/resize-handle.tsx apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts tiling-ux.md` passed.
- Fallback verification passed via a dependency-light Node source-assertion script covering the new keyboard resize step export, keyboard-accessibility guard, shortcut metadata, focusability, keydown wiring, and keyboard-aware title copy.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm the extra panel-handle tab stops feel worth it and that the directional keyboard mapping matches user intuition on left vs right corners.
- If live use suggests height-only panel resizing also needs keyboard parity, the next pass should decide whether top / bottom rails deserve the same treatment or whether a more consolidated resize mode would keep focus order cleaner.
- The floating panel still does not surface a transient tiled-space impact hint for keyboard nudges the way pointer drag does; if that gap is noticeable in live use, the next local refinement should teach keyboard resize actions to briefly echo the same crowded / relief feedback.

## Iteration 2026-03-08 — echo tiled-space pressure hints after keyboard panel resizing

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts`

### Repro steps
1. Open the floating desktop panel while the sessions page is in a tiled state like `Compare` or `Grid`.
2. Focus a width-affecting floating-panel resize handle and use arrow keys to widen, narrow, or reset the panel.
3. Before this change, pointer drag showed the transient tiled-space pressure hint, but keyboard commits updated panel width silently unless the user separately noticed the sessions layout react.
4. That made keyboard resize feel less connected to tiled-session density than pointer drag, even though both actions changed the same layout pressure.

### UX problems found
- The panel-resize wrapper already had a good transient crowded/relief hint model, but it only stayed visible while `activeResizePosition` was set during pointer drag.
- Keyboard nudges and keyboard reset went straight through `onResizeEnd(...)` / `onResetSize(...)`, so the same width change produced less explanatory feedback.
- That inconsistency made the floating panel feel less predictable in tiled workflows for keyboard users, especially when they were trying to recover room without switching input methods.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose the explicit panel-keyboard feedback gap called out in the prior iteration's `Still needs attention` section instead of revisiting tile-level affordances again.
- Code inspection showed a clean local boundary: `ResizeHandle` already owns keyboard commit behavior, while `PanelResizeWrapper` already owns the tiled-space hint logic.
- I attempted live Electron inspection again before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- Keeping the keyboard-triggered hint transient (rather than persistent) is the right default because the problem is missing feedback, not missing permanent controls.
- Reusing the existing crowded/relief hint copy is better than introducing keyboard-specific wording because the layout consequence is the same regardless of input method.
- A short timeout (`1800ms`) is acceptable here because it gives keyboard users time to notice the effect without leaving stale warning chrome on screen.

### Decision and rationale
- Chosen fix: pass commit metadata from `ResizeHandle` for keyboard and pointer resize/reset actions, then let `PanelResizeWrapper` briefly keep the existing width-impact hint visible after keyboard commits on width-affecting handles.
- Why this is better than the obvious alternatives:
  - better than adding a new visible badge or helper text because it reuses existing feedback instead of growing floating-panel chrome;
  - better than leaving keyboard commits silent because it restores parity with the pointer-drag mental model;
  - better than making all panel-resize feedback persistent because the important improvement is immediate cause-and-effect clarity, not another always-on control.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` to export `ResizeHandleCommitMeta` and include source / position / starting-size metadata when pointer or keyboard resize/reset actions commit.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to:
  - keep a short-lived timeout for keyboard-triggered width-impact hints,
  - reuse the existing crowded/relief panel hint after keyboard resize or keyboard reset,
  - and clear transient keyboard hint state when a new pointer drag starts or the timeout expires.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with focused source assertions covering the new keyboard commit metadata and transient hint path.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/components/resize-handle.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- Attempted targeted verification: `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script covering the new resize commit metadata, keyboard reset wiring, transient keyboard hint timeout, and updated targeted test coverage.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm the transient keyboard hint feels noticeable without lingering too long after successive arrow-key nudges.
- If live use shows repeated keyboard nudges need stronger continuity, the next pass should consider refreshing or slightly extending the timeout only while the same handle keeps focus rather than adding permanent helper text.
- Height-only floating-panel resize handles are still pointer-only; that should stay a deliberate follow-up decision rather than being expanded automatically from this width-pressure-focused change.

## Iteration 2026-03-08 — keep width-pressure recovery reachable on very compact tiled headers

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid`.
2. Make the available sessions area very narrow so the header falls into its tightest compact state.
3. Also keep the sidebar and/or floating panel wide enough that the header starts warning that tiled sessions are tight or stacked.
4. Compare the width-pressure diagnosis chip with the available recovery controls.

### UX problems found
- The sessions header still diagnosed width pressure in the very compact state, but the direct recovery actions (`Reset panel`, `Reset sidebar`, `Reset both`) disappeared entirely behind `!isVeryCompactSessionHeader` guards.
- That made the tightest header state paradoxical: the UI could tell the user that tiles were crowded while removing the fastest local way back.
- The remaining very-compact hint labels (`Make room`, `Tight`) were intentionally generic, so hiding the recovery CTA there also removed the clearest clue about *which* surface should be reset.

### Investigation notes
- I reviewed the ledger first and intentionally chose this follow-up instead of another tile-body density pass, because recent iterations had improved panel/sidebar recovery actions but still accepted hiding them at the narrowest header breakpoint.
- Code inspection showed the layout selector was already condensed aggressively in this state, which made it feasible to restore a smaller recovery CTA without a broader header refactor.
- A quick live Electron probe was attempted before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).

### Assumptions
- On the very compact sessions header, keeping a short culprit-specific recovery label visible (`Panel`, `Sidebar`, `Both`) is worth more than preserving the previous no-CTA state.
- Pairing those shorter labels with a reset icon is a better balance than restoring the full `Reset panel` / `Reset sidebar` copy, because the action stays identifiable without reclaiming as much width.
- Full `title` and `aria-label` metadata remain the right place for the longer explanatory copy, especially when the visible compact label has to stay terse.

### Decision and rationale
- Chosen fix: keep the existing contextual recovery actions available even on the very compact tiled header, but switch them to shorter culprit-specific visible labels plus a reset icon.
- The buttons now stay present in very compact `Compare` / `Grid` pressure states as `Panel`, `Sidebar`, or `Both`, while roomier compact headers keep the existing `Reset ...` labels.
- Why this is better than the obvious alternatives:
  - better than hiding the CTA entirely because the diagnosis now keeps an immediate local recovery path at the moment of highest pressure;
  - better than restoring the full labels at the tightest breakpoint because the header keeps a smaller footprint while preserving specificity;
  - better than making the generic hint chip itself clickable because the UI still distinguishes diagnosis from action.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to stop suppressing combined, panel-only, and sidebar-only width-pressure recovery actions on `isVeryCompactSessionHeader`.
- Added shorter very-compact visible labels (`Both`, `Panel`, `Sidebar`) while keeping the existing full-size labels for roomier headers.
- Added a `RotateCcw` action cue plus explicit `aria-label` metadata for the recovery buttons so the terse compact labels still read clearly as reset actions.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` source assertions for the new very-compact labels, button sizing, icon cue, and ARIA coverage.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- Attempted targeted verification: `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light Node source-assertion script covering the new very-compact recovery labels, continued CTA visibility, icon cue, ARIA labels, and updated test coverage.

### Still needs attention
- Once the desktop app is runnable here, this very-compact header should get a visual sanity check to confirm `Panel` / `Sidebar` / `Both` read clearly enough beside the generic `Tight` / `Make room` hint chips.
- If the tightest header still feels crowded in live use, the next local step should be reducing button padding or merging low-priority chips before considering any broader header redesign.
- The broader end-to-end interaction among sidebar width, floating-panel width, and tile density still deserves a runnable renderer pass rather than more code-only iteration.

## Iteration 2026-03-08 — clarify drag/reorder landing outcome for tiled sessions

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with at least three tiled sessions in `Grid` or `Compare`.
2. Start dragging one session tile over another reorderable tile.
3. Watch the highlighted drop target while moving a tile from earlier to later positions, then from later to earlier positions.
4. Repeat while a non-reorderable pending/continuation tile is also visible above the regular session tiles.

### UX problems found
- The highlighted drop target only said `Drop to reorder`, which identified the target tile but not whether the dragged session would land before or after that tile in the ordered session list.
- In dense multi-column grids, that ambiguity makes reorder results feel harder to predict because tile-level highlighting alone does not expose the insertion outcome.
- Code inspection also showed regular session drag indices were being offset when a non-reorderable pending tile was visible, which risked making reorder targeting harder to reason about in mixed pending + regular layouts.

### Investigation notes
- I reviewed the latest ledger entries first and deliberately avoided the most recent compact-summary and width-pressure follow-ups so this pass would cover an older still-open drag/reorder clarity gap.
- A quick live Electron probe was attempted before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`), so this iteration relied on code inspection and targeted source verification instead.
- The existing reorder model is already index-based via `moveSessionOrderEntry`, which meant the before/after landing result could be surfaced without changing the underlying interaction model or adding new drag abstractions.

### Assumptions
- Pending/continuation tiles are not part of the reorderable session list, so drag indices for regular sessions should be based on the regular session order only rather than visual offsets caused by a pending tile above them.
- A short explicit outcome label (`Drop before` / `Drop after`) is a better local improvement than adding more drag chrome, because it explains the result without competing with tile content during the drag.
- Strengthening the drop-target badge and highlight slightly is acceptable here because the state is transient and only appears while a reorder gesture is active.

### Decision and rationale
- Chosen fix: keep the current drag target highlight, but make it outcome-specific by labeling the target as `Drop before` or `Drop after` based on the existing reorder indices, while also aligning drag-target indexing to reorderable sessions only.
- This keeps the change local to the tiled session grid and avoids broader reorder refactors, but removes the main ambiguity about where the dragged tile will land.
- Why this is better than the obvious alternatives:
  - better than keeping the generic `Drop to reorder` badge because it explains the landing result instead of only identifying the hovered tile;
  - better than adding permanent reorder instructions because the extra guidance appears only during the drag gesture that needs it;
  - better than inventing a new insertion-line system for wrapped grids because the text stays truthful even when row wrapping makes geometric insertion cues harder to interpret.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to accept a `dragTargetPosition` prop, derive an outcome-specific drag badge label, and strengthen the transient drop-target highlight styling.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - centralize the current reorderable session order,
  - derive `before` / `after` target labels from the existing index-based reorder behavior,
  - and keep drag target indices aligned to regular reorderable sessions instead of offsetting them when a pending tile is visible.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts` with focused assertions for the new `Drop before` / `Drop after` badge behavior and stronger drop-target treatment.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused assertions covering the shared reorder order source, before/after target labeling helper, and the non-offset regular-session drag target wiring.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drop-target-feedback.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted targeted verification: `pnpm --filter @dotagents/desktop typecheck:web`
- Result: blocked by missing installed workspace dependencies in this worktree (`tsconfig.web.json` extends packages that are not present locally; pnpm also warned that `node_modules` is missing).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the new drag-target position prop, before/after badge labels, shared reorder-order wiring, non-offset drag target indices, and updated targeted tests.
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.

### Still needs attention
- Once the desktop app is runnable here, this needs a live drag pass in both wide and wrapped tile grids to confirm the stronger drop badge reads quickly enough during motion.
- If live use still shows hesitation during reordering, the next local step should be exploring a lightweight sequence cue for wrapped grids (for example a more explicit `before this session` / `after this session` title treatment) rather than adding persistent chrome.
- Drag discoverability is improved once a drag is underway, but the broader first-time discoverability of the reorder handle and drag affordance is still worth another dedicated iteration.

## Iteration 2026-03-08 — make the reorder handle explain itself before dragging starts

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-tile.tsx`

### Repro steps
1. Open the desktop sessions page with at least two reorderable tiled sessions.
2. Look at the top-left reorder grip on a tile before starting a drag.
3. Hover a tile, then tab to the reorder handle with the keyboard.
4. Compare how obvious the handle purpose feels before and after you actually begin dragging.

### UX problems found
- The visible reorder handle was already present at rest, but it still looked like a generic grip decoration until the user inferred its meaning from a tooltip or started interacting with it.
- Keyboard users could focus the handle and get arrow-key support, but the control itself still did not expose a visible text cue when focused.
- In dense tiled layouts, that makes first-time reordering feel more hidden than necessary even though the underlying drag and keyboard behaviors are already implemented.

### Investigation notes
- I reviewed the ledger first and deliberately picked the still-open reorder-handle discoverability follow-up from the latest drag/reorder iteration instead of revisiting the more recent width-pressure or summary-density passes.
- A quick live Electron probe was attempted before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`), so this iteration relied on code inspection plus targeted source verification.
- The current drag affordance was already lightweight, visible at rest, keyboard-accessible, and constrained to the handle itself, which meant the highest-value local improvement was better labeling rather than any new drag system or extra persistent sessions-page chrome.

### Assumptions
- A short visible label that appears on hover, keyboard focus, and during drag is enough to improve first-time comprehension without permanently taking space away from tile content.
- Using `Move` on tighter tiles and `Reorder` on wider tiles is acceptable because both labels describe the same affordance, while the shorter wording reduces overlap pressure in narrower layouts.
- Slightly strengthening the handle pill border/background on hover or focus is acceptable because the state is transient and limited to the control the user is actively exploring.

### Decision and rationale
- Chosen fix: keep the reorder grip icon visible but lightweight at rest, then let it expand into a small labeled pill (`Move` / `Reorder`) on tile hover, handle focus, and active dragging.
- This preserves the existing low-chrome look in dense grids while giving users a visible explanation at the moment they are most likely to discover the control.
- Why this is better than the obvious alternatives:
  - better than a permanently visible text badge because it improves discoverability without adding constant header clutter to every tile;
  - better than relying on the sessions-page reorder hint alone because the explanation now appears directly on the control that performs the action;
  - better than another tooltip-only tweak because pointer and keyboard users both get a visible cue before committing to the interaction.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - derive a width-aware visible reorder-handle label (`Move` in tighter tiles, `Reorder` in wider ones),
  - turn the grip chrome into an expandable pill that reveals the label on hover, keyboard focus, and drag,
  - and slightly strengthen the handle pill styling while it is being actively explored.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` with targeted source assertions covering the new labeled-pill behavior, focus/hover reveal states, and width-aware label copy.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drag-affordance.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the width-aware visible label, hover/focus reveal classes, and updated drag-affordance test expectations.

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass in both `2x2` and tighter wrapped grids to confirm the hover/focus label feels helpful without covering too much title text.
- If live use still shows hesitation, the next local step should be testing a slightly stronger focus-visible state or a one-time tile-level micro-hint, not adding persistent reorder copy to every tile.
- Reorder discoverability before hover is still only partially addressed; if this remains hard to notice in practice, a future iteration should revisit whether the sessions-header hint and tile-level affordance are working together clearly enough.

## Iteration 2026-03-08 — make the corner resize handle explain itself before dragging starts

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`

### Repro steps
1. Open the desktop sessions page with at least one non-maximized tiled session.
2. Look at the bottom-right tile resize control before hovering or dragging.
3. Hover the tile, then tab to the corner resize handle with the keyboard.
4. Compare how obvious the control purpose feels before and during resize exploration.

### UX problems found
- The tile resize system already had visible edge rails, a corner grip, double-click reset, and keyboard resizing, but the visible corner control still looked mostly like decorative geometry until the user inferred its meaning.
- Edge rails communicate directionality, yet the corner handle remained the clearest all-in-one resize affordance, so its lack of plain-language guidance made first-time resizing feel more hidden than necessary.
- That ambiguity matters most in dense tiled layouts where there is little spare chrome and users should not have to rely on a tooltip to confirm a basic tile action.

### Investigation notes
- I reviewed the ledger first and deliberately chose resize discoverability because recent passes had focused more on reorder clarity, compact headers, transcript density, and panel-width recovery than on making the existing tile resize affordance self-explanatory.
- A quick live Electron inspection was still not practical in this workflow because no inspectable renderer target is currently available (`No Electron targets found`), so this iteration relied on code inspection plus targeted source verification.
- Code inspection showed the corner resize affordance already used lightweight persistent chrome and hover/focus styling, which made a transient visible label the smallest coherent improvement.

### Assumptions
- A short label that only appears on tile hover, handle focus, and active resizing is acceptable because it improves comprehension without adding constant header/footer clutter.
- Using `Resize` on tighter tiles and `Resize tile` on wider tiles is acceptable because both labels describe the same action while the shorter copy reduces overlap pressure in narrower layouts.
- Expanding the existing corner pill slightly is preferable to adding a new separate hint elsewhere because the explanation now appears directly on the control the user will grab.

### Decision and rationale
- Chosen fix: keep the existing corner resize grip lightweight at rest, but let it expand into a small labeled pill (`Resize` / `Resize tile`) on tile hover, keyboard focus, and while resizing.
- Why this is better than the obvious alternatives:
  - better than leaving the control icon-only because the action is now more legible before the drag begins;
  - better than adding permanent tile chrome because the label appears only when the user is already exploring the affordance;
  - better than a tooltip-only clarification because pointer and keyboard users now get a visible cue before committing to the interaction.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to derive a width-aware corner resize label (`Resize` on tighter tiles, `Resize tile` on wider ones).
- Changed the corner resize handle into a slightly roomier pill that can reveal the label while preserving the existing icon, reset behavior, and keyboard shortcuts.
- Added reveal states for tile hover, handle focus, and active resizing so the label appears when the user is most likely to need the explanation.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with source assertions covering the new visible label and reveal behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts tiling-ux.md` passed.
- Dependency-light Node source assertions passed against `apps/desktop/src/renderer/src/components/session-grid.tsx` and `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` for the width-aware resize label, corner-handle reveal classes, and test coverage.
- Live UI inspection remains blocked in this workflow because no inspectable Electron target is currently available.
- I did not repeat another `vitest` run in this iteration because earlier targeted attempts in this worktree were already blocked by missing workspace test tooling, and repeating the same failure would not add useful signal.

### Still needs attention
- Once a runnable desktop environment is available, this should get a live pass in narrow `1x2` and wrapped `2x2` layouts to confirm the transient label does not cover too much tile content.
- If tile resizing still feels hidden in practice, the next local step should be evaluating whether the edge rails also need a slightly stronger focus-visible state rather than adding more persistent copy.
- Floating-panel resize handles still may benefit from a similar pre-drag explanation if live use shows the same ambiguity there, but this tile-focused pass intentionally kept the change local.

## Iteration 2026-03-08 — make floating-panel resize handles explain themselves before dragging starts

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`

### Repro steps
1. Open the floating panel while tiled sessions are visible in the desktop app.
2. Before dragging, hover a width-affecting panel resize handle (left, right, or a corner), then tab to one with the keyboard.
3. Compare how obvious the handle purpose feels before resize starts versus after you already begin dragging and see the existing panel-width hint.
4. Notice that, before this change, the handles mostly relied on thin rails, corner geometry, and tooltip text, so the action still felt more implicit than the equivalent tile resize affordance.

### UX problems found
- The floating panel already had width-pressure feedback during and after resizing, but the resize handles themselves still lacked a plain-language cue before interaction began.
- That made panel resizing feel harder to discover than the recently improved tile resize affordance, even though panel width directly affects tiled-session comfort.
- Keyboard users could focus resettable width-affecting handles, but focus mainly strengthened the chrome rather than visibly naming the action.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose the follow-up it explicitly left open rather than revisiting the most recent tile-only resize work.
- `ResizeHandle` is only used by `panel-resize-wrapper.tsx`, so this could stay as a small local renderer change without broader abstractions or cross-surface plumbing.
- `panel-resize-wrapper.tsx` already limits `onResetSize` to width-affecting handles, which gave me a conservative way to scope the visible-label treatment to the handles most relevant to tiled-session crowding.
- I attempted a live Electron inspection before finalizing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- I checked the renderer AGENTS guidance for mobile parity; this is desktop-only panel chrome and does not have a matching mobile surface to update.

### Assumptions
- A transient visible label is a better fit than more persistent panel chrome because it helps only when the user is exploring a handle.
- Limiting the label treatment to resettable width-affecting handles is acceptable because this iteration is specifically about tiled-workflow pressure and pre-drag clarity, not every possible panel resize direction.
- Using shorter `Resize` copy on left/right rails and `Resize panel` on corners is acceptable because it balances clarity with overlap risk near the panel edge.

### Decision and rationale
- Chosen fix: let width-affecting floating-panel resize handles reveal a small visible label on hover, keyboard focus, and active resize.
- The label appears directly on the handle being explored, which makes the control self-explanatory before the drag begins while keeping the default chrome lightweight.
- Why this is better than the obvious alternatives:
  - better than relying on tooltips alone because pointer and keyboard users now get an in-context visible cue before committing to the interaction;
  - better than adding another persistent panel button or banner because the explanation stays attached to the control that performs the action;
  - better than broadening the treatment to every handle immediately because the width-affecting handles are the ones that intersect tiled-session comfort most directly.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/resize-handle.tsx` to:
  - detect width-affecting panel handles locally,
  - derive a short visible label (`Resize` for left/right rails, `Resize panel` for corners),
  - position that label adjacent to the active handle,
  - and reveal it on hover, keyboard focus, and during active resize while preserving the existing title, ARIA, and reset behavior.
- Updated `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts` with source assertions for the new label helpers, DOM marker, and reveal states.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/components/resize-handle.tsx apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts` passed.
- Attempted targeted verification: `pnpm exec vitest run apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts apps/desktop/src/renderer/src/components/resize-handle.keyboard-resize.test.ts apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the new visible-label helper, width-vs-corner copy, DOM marker, hover/focus reveal states, active-resize reveal state, and updated targeted test coverage.

### Still needs attention
- Once the desktop app is runnable here, this should get a quick live pass on left/right rails and corner handles to confirm the transient labels feel helpful without obscuring too much panel content.
- If the top-corner labels visually compete with the persistent `Reset wide panel` button in oversized states, the next local tweak should be label positioning or thresholding, not removing the explanation entirely.
- Height-only top/bottom panel handles are still unlabeled on purpose; that should remain a separate decision unless live use shows the same discoverability gap outside tiled-session workflows.

## Iteration 2026-03-08 — fold compact important-findings chrome into the summary timeline header

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple tiled sessions so at least one session stays in compact, non-focused tile mode.
2. Switch that tile to `Summary` when the session has one or more `high` / `critical` step summaries.
3. Compare the top of the compact summary tab against the amount of actual timeline content visible underneath it.
4. Before this change, the compact summary tab used one row for `Important ...` and then another row for `Timeline`, which made short or narrow summary tiles feel top-heavy before the cards even started.

### UX problems found
- Compact summary mode had already slimmed the important-findings block down to a lighter single-line row, but it still occupied a full dedicated row above the timeline.
- In short or narrow tiles, that extra row made the summary tab spend disproportionate chrome on orientation before the actual summary cards.
- The separate `Important` row and `Timeline` label also split closely related signals across two stacked rows even though both describe the same section of content.

### Investigation notes
- I reviewed the ledger first and intentionally chose an older compact-summary hierarchy follow-up instead of repeating the latest resize-handle affordance work.
- The ledger already called out a likely next step of making compact important findings less persistent if summary mode still felt top-heavy in narrow/short tiles.
- Code inspection confirmed `AgentSummaryView` already owned both the compact important-findings treatment and the compact `Timeline` label, so this improvement could stay local without changing tile shell/layout state.
- I attempted live desktop inspection during verification, but this workflow still has no inspectable Electron renderer target (`No Electron targets found`).

### Assumptions
- In compact tiled summary mode, important-findings context can be expressed as an inline chip beside the `Timeline` label instead of consuming its own full-width row.
- Preserving the richer standalone `Important Findings` card in non-compact summary views is still the better default because the density issue is specific to tiled compact mode.
- Keeping the compact chip text truncated with explicit `title` / accessibility copy is acceptable because the detailed severity information remains visible in the summary cards themselves.

### Decision and rationale
- Chosen fix: remove the dedicated compact important-findings row and fold that signal into the compact summary timeline header as an inline warning chip.
- The compact header now keeps `Timeline` on the left and, when relevant, shows a small orange severity chip on the right using the same existing importance summary text.
- Why this is better than the obvious alternatives:
  - better than leaving the separate row because it saves vertical room exactly where short summary tiles feel most top-heavy;
  - better than hiding important findings entirely because the severity cue stays visible at the top of the summary timeline;
  - better than introducing another collapsible control because the hierarchy improvement stays passive, local, and predictable.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` to:
  - derive `hasImportantFindings` and `compactImportantFindingsTitle`,
  - keep the standalone orange highlight card only for non-compact summary views,
  - and render compact important findings as an inline chip inside the compact `Timeline` header row instead of a separate block.
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with source assertions covering the new compact-header chip treatment, preserved non-compact block, and the compact timeline header row.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-summary-view.layout.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- A targeted dependency-light Node source-assertion pass succeeded for the new compact important-findings guard, compact title helper, inline timeline-header chip, and updated targeted test coverage.

### Still needs attention
- Once a runnable desktop target is available, this compact summary-header treatment should get a live pass in both short and scrollable summary tiles to confirm the inline chip feels lighter without becoming too easy to miss.
- If the inline chip wraps too often on the narrowest tiles, the next local refinement should shorten the visible severity copy before considering another layout treatment.
- The broader compact summary balance among the inline important chip, sticky `Latest` row, and summary cards still deserves a live pass when this workflow can inspect the desktop renderer.

## Iteration 2026-03-08 — add a lightweight insertion cue to active reorder targets

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts`

### Repro steps
1. Open the desktop sessions page with at least three tiled sessions in `Compare` or `Grid`.
2. Start dragging one session by the visible reorder handle.
3. Hover another tile while moving from an earlier position to a later one, then repeat in the opposite direction.
4. Compare how quickly you can predict the landing position from the highlighted tile alone.

### UX problems found
- The recent `Drop before` / `Drop after` badge improved outcome clarity, but the destination tile still lacked a fast spatial cue for where the insertion would happen.
- In dense or wrapped grids, reading the small badge alone can still feel slower than ideal during motion, especially when the user is scanning for the landing edge rather than reading copy.
- The drop target highlight was strong enough to show *which* tile was active, but still weaker at showing *how* the dragged session related to that tile in sequence.

### Investigation notes
- I reviewed the ledger first and intentionally chose an older still-open reorder follow-up instead of repeating the latest compact-summary or resize-affordance passes.
- The previous reorder iteration had already introduced truthful `before` / `after` labeling and explicitly left open the possibility of a lightweight sequence cue for wrapped grids.
- A quick live Electron probe was attempted before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`), so this pass relied on code inspection plus targeted source verification.
- `session-grid.tsx` already had `dragTargetPosition`, which made it possible to add a small visual sequence cue locally without changing drag state, index math, or layout behavior.

### Assumptions
- A thin transient insertion bar is acceptable because it only appears during active drag targeting and adds no resting chrome.
- In wrapped grids, a simple top-vs-bottom cue is acceptable as a sequence hint when paired with the existing explicit `Drop before` / `Drop after` badge, even though wrapped geometry is not a perfect linear-list metaphor.
- Preserving the current badge is better than replacing it, because the bar improves scan speed while the badge keeps the outcome explicit and truthful.

### Decision and rationale
- Chosen fix: keep the stronger drag-target ring, dashed overlay, and explicit badge, then add a slim insertion cue bar at the top for `before` and at the bottom for `after`.
- This gives the drag target a faster “landing edge” signal without introducing a heavier placeholder model or more persistent tile chrome.
- Why this is better than the obvious alternatives:
  - better than relying on the badge alone because users now get a quick spatial cue while moving;
  - better than a full placeholder/insertion refactor because it stays local and low-risk;
  - better than adding more text because the improvement speeds scanning without demanding more reading during drag.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - add `getDragTargetInsertionCueClasses(...)`,
  - render a drag-only `data-session-tile-drop-sequence` bar when `dragTargetPosition` is known,
  - and place that cue at the top or bottom of the active drop target to mirror `before` / `after` ordering.
- Updated `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts` with targeted source assertions for the new helper, DOM marker, and insertion-cue styling.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts tiling-ux.md` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.drop-target-feedback.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the new insertion-cue helper, top/bottom cue classes, DOM marker, styling hook, and updated targeted test coverage.

### Still needs attention
- Once a runnable desktop target is available, this needs a live drag pass in both wide and wrapped grids to confirm the top/bottom cue reads naturally enough during motion.
- If wrapped-grid reordering still feels slightly ambiguous in practice, the next local step should be tuning cue placement or badge copy before considering a heavier placeholder treatment.
- This cue should also get a quick live sanity check against bottom-edge tile resize affordances to confirm the transient bar does not feel visually crowded near the resize rail.

## Iteration 2026-03-08 — keep reorder drop cues from competing with tile resize chrome

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drop-target-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`

### Repro steps
1. Open the sessions page with at least two visible tiles in Compare or Grid.
2. Start dragging one tile by its reorder grip.
3. Hover another tile near its lower edge so the new `Drop after` insertion bar appears.
4. Compare the active drop cue against the tile's bottom-edge and corner resize affordances.

### UX problems found
- The previous iteration added a truthful top/bottom insertion cue, but the bottom cue could visually crowd the existing height/corner resize chrome on the destination tile.
- During an active reorder gesture, resize affordances are temporarily irrelevant, so leaving them visible made the tile communicate two competing edge-based interactions at once.
- That ambiguity is strongest exactly where users need the fastest scan signal: the lower edge of the active drop target.

### Investigation notes
- I reviewed the ledger first and deliberately chose the newest still-open reorder follow-up rather than repeating the more recent compact-density or panel-affordance passes.
- I made another quick live Electron inspection attempt before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- Code inspection showed the tile wrapper always rendered resize handles whenever the tile was not collapsed/focused, even while the sessions page knew a reorder drag was active (`draggedSessionId !== null`).

### Assumptions
- Temporarily hiding tile resize chrome during an active reorder drag is acceptable because resizing is not the user's current task and the handles return immediately after drop/end.
- It is better to suppress competing affordances during drag than to permanently move the insertion cue farther inward, because preserving edge-adjacent cues keeps the before/after mapping intuitive.
- A small sessions-page wiring change is acceptable here because the drag-active signal already exists; this does not require a broader drag-state refactor.

### Decision and rationale
- Chosen fix: while any tile reorder drag is active, suppress tile resize handles so the active drop cue owns the tile edge visually.
- Why this is better than the obvious alternatives:
  - better than leaving both affordances visible because the user no longer has to parse conflicting edge signals during drag;
  - better than weakening the new insertion cue because reorder targeting remains the primary in-the-moment action;
  - better than a larger placeholder refactor because it solves the specific overlap with a small local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to accept `isReorderInteractionActive` and gate resize-handle rendering behind a new `showResizeHandles` condition.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to pass `isReorderInteractionActive={canReorderTiles && draggedSessionId !== null}` into each tiled session wrapper.
- Added `apps/desktop/src/renderer/src/components/session-grid.reorder-resize-interplay.test.ts` to lock in the new reorder/resize interaction contract.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/components/session-grid.reorder-resize-interplay.test.ts tiling-ux.md` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.reorder-resize-interplay.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the new drag-active prop, resize-handle gating, and sessions-page wiring.

### Still needs attention
- Once a runnable desktop target is available, this needs a quick live drag sanity check to confirm the disappearing resize chrome feels helpful rather than abrupt.
- If reorder still feels crowded in wrapped grids after live testing, the next local step should be tuning insertion-cue placement or badge emphasis before introducing heavier drag placeholders.
- Floating panel resizing still deserves a live cross-check against tiled drag/reorder workflows, because panel width changes can make dense-grid drag interactions feel tighter overall.

## Iteration 2026-03-08 — separate compact tile footer state from ACP identity

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple tiled sessions so at least one session stays in compact, non-focused tile mode.
2. Look at a compact tile footer for an ACP-backed session that also shows context usage.
3. Reduce the available width further by narrowing the window or leaving a sidebar/panel open.
4. Before this change, the footer presented ACP identity, context, and status as one flat wrapping row, so the most important state chip could visually compete with supporting identity metadata.

### UX problems found
- Compact tile footers had already moved to chips, but status, context, and ACP identity still shared one undifferentiated row.
- Under width pressure, that flat row made the footer harder to scan because supporting identity metadata could wrap alongside the primary state signal.
- The footer communicated everything at the same visual priority even though `Working` / `Needs approval` and context pressure are more time-sensitive than ACP identity.

### Investigation notes
- I reviewed the ledger first and intentionally avoided another reorder/resize affordance pass because recent iterations had already concentrated heavily on that area.
- The ledger still had an older open note about compact footer hierarchy: grouping status, context, and ACP identity more explicitly if the footer still felt too flat under severe width pressure.
- Code inspection confirmed `agent-progress.tsx` already owned the compact tile footer composition, so this could stay as a local hierarchy improvement without touching session layout state or tiling logic.
- I attempted a lightweight live inspection again before editing, but this workflow still has no inspectable Electron renderer target (`No Electron targets found`).

### Assumptions
- In compact tiles, it is acceptable to give status and context a dedicated primary row while demoting ACP identity to a secondary row, because ACP identity is useful orientation metadata but usually not the first thing the user needs during dense scanning.
- Preserving the existing non-compact footer layout is still the better default because the hierarchy problem is most noticeable in compact tiled states, not expanded/single-view states.
- It is acceptable to improve compact-footer clarity purely through grouping/order rather than adding another label or new control, because the issue was priority ambiguity rather than missing functionality.

### Decision and rationale
- Chosen fix: turn compact tile footers into a two-tier structure with a primary state row (`status` + `context`) and a secondary identity row (`ACP` badge) only when ACP metadata exists.
- This keeps the most actionable signals together and lets the footer degrade more gracefully when width gets tight.
- Why this is better than the obvious alternatives:
  - better than leaving one flat wrapping row because users can now scan primary tile health before secondary identity;
  - better than hiding ACP identity entirely because the badge still remains available, just at a more appropriate visual priority;
  - better than adding new labels or controls because the improvement stays passive, local, and low-chrome.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - derive `shouldShowCompactTileContextChip` and `shouldShowCompactTileIdentityRow`,
  - render compact footer state/status chips in a dedicated first row,
  - and move the ACP badge into a secondary muted row for compact tile mode only.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions covering the new compact footer hierarchy markers and the preserved ACP badge wiring.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts tiling-ux.md` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the new compact-footer state/context guard, identity-row guard, primary-row structure, and updated targeted test coverage.

### Still needs attention
- Once a runnable desktop target is available, this compact-footer hierarchy should get a live pass at narrow widths to confirm the secondary ACP row feels calmer rather than visually detached.
- Compact non-ACP footers still intentionally omit model/provider identity in dense tile mode; if users need more compact-session provenance later, that should be treated as a separate hierarchy decision rather than folded back into this row.
- Floating panel width changes should still get a live cross-check against dense compact tiles, because narrower work areas make footer hierarchy and wrapping behavior more noticeable.

## Iteration 2026-03-08 — keep panel resize recovery copy honest after keyboard nudges

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`

### Repro steps
1. Open the floating desktop panel while tiled sessions are visible or expected to stay visible nearby.
2. Focus a width-affecting panel resize handle and use arrow keys to widen, narrow, or reset the panel.
3. Wait for the transient tiled-space impact hint that appears after keyboard resize.
4. Before this change, notice that the hint still said `Double-click handle to reset to default size`, even though the focused handle also supports `Enter` reset.

### UX problems found
- The floating-panel resize system had already gained keyboard nudges and keyboard reset, but the follow-up tiling-impact hint still described only the pointer recovery path.
- That made the recovery guidance feel slightly dishonest right after a keyboard action: users were told about double-click but not about the shortcut they were already actively using.
- Because this hint exists specifically to make the tiling consequences of panel width clearer, stale pointer-only copy undermined the confidence benefit of the broader keyboard-parity work.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked a floating-panel follow-up that had not been revisited in the most recent compact-tile and reorder iterations.
- Code inspection showed the inconsistency was highly local: `resize-handle.tsx` already teaches `Enter` reset for keyboard-accessible panel handles, while `panel-resize-wrapper.tsx` still rendered a hard-coded double-click-only hint string.
- I kept the fix local to the wrapper because the underlying resize behavior was already correct; only the post-action helper copy was lagging behind the actual interaction model.
- Live Electron inspection is still blocked in this workflow because there is no inspectable renderer target available.

### Assumptions
- A slightly longer but input-inclusive reset hint is acceptable inside the transient panel pill because it removes ambiguity without adding persistent chrome.
- Inclusive copy (`Press Enter or double-click`) is better than adding new input-mode state solely for this text, because the same hint can appear after either pointer or keyboard interactions and the smaller implementation is less error-prone.
- Keeping the instruction at the wrapper level is acceptable because only width-affecting handles render this tiled-space hint, and those are already the handles with reset support.

### Decision and rationale
- Chosen fix: replace the pointer-only reset sentence in the transient panel tiling hint with inclusive guidance that covers both keyboard and pointer recovery.
- Why this is better than the obvious alternatives:
  - better than leaving the old copy because the UI now matches the actual keyboard-capable behavior users just exercised;
  - better than introducing extra interaction-source state because the simpler inclusive wording avoids new coordination logic for a purely explanatory string;
  - better than adding another visible reset control because the recovery path already exists on the resize handle and only needed clearer wording.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to store a shared `panelTilingHintResetInstruction` string and render `Press Enter or double-click to reset to default size` inside the transient width-impact hint.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with focused source assertions covering the shared helper string plus the new inclusive reset copy.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A targeted dependency-light `node` source-assertion script passed for the new shared reset-instruction constant, the inclusive `Enter` + double-click copy, and the updated regression test coverage.
- Live UI inspection remains blocked in this workflow because there is no inspectable Electron target currently available.

### Still needs attention
- Once a runnable desktop target is available, this should get a quick live keyboard-resize pass to confirm the slightly longer helper line still feels balanced in the panel hint pill.
- If live use shows the hint should feel even more mode-aware, the next small refinement could compare inclusive copy against source-specific helper text before introducing any new persistent panel chrome.
- Height-only floating-panel resize handles are still intentionally outside this width-pressure-focused hint path; that remains a separate product decision.

## Iteration 2026-03-08 — keep new sessions from reshuffling an already arranged tiled grid

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with at least two visible session tiles arranged in `Compare` or `Grid`.
2. Reorder tiles into a deliberate working order, or simply keep scanning the current arrangement.
3. Start a brand-new session while the existing tiled layout is still in use.
4. Before this change, notice that the newcomer jumps to the front and shifts the rest of the grid downward even though the user did not ask to reorganize the layout.

### UX problems found
- `sessions.tsx` treated sessions missing from `sessionOrder` as higher priority than already-arranged tiles, so newly created sessions briefly sorted to the front as soon as they appeared.
- The sync effect then reinforced that behavior by prepending new IDs to `sessionOrder`, which meant ongoing tiled comparisons could reshuffle underneath the user.
- In single-view browsing, the same prepend behavior also risked changing pager order in a way that felt unrelated to the user’s current task.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked a fresh session-organization issue instead of repeating the most recent resize, panel-hint, or reorder-affordance passes.
- Code inspection showed the disruption was local to `sessions.tsx`: both the render-time sorting path and the order-sync effect explicitly preferred new sessions at the front.
- Live desktop inspection was attempted again via `electron_execute`, but this workflow still has no inspectable Electron renderer target (`No Electron targets found`).

### Assumptions
- In an already-active tiled workflow, preserving the user’s current spatial arrangement is more valuable than auto-promoting a new tile to the first position.
- Keeping initial load sorted by freshness is still the right default because there is no existing arrangement to preserve on first mount.
- If multiple new sessions arrive together after initial load, sorting that appended tail by recent activity is an acceptable compromise because it keeps the freshest newcomer closest to the existing arranged set without disturbing established tiles.

### Decision and rationale
- Chosen fix: keep initial load ordering as newest-first, but append later new sessions after the existing valid tile order and update render-time sorting so the grid does not briefly jump before the sync effect runs.
- Why this is better than the obvious alternatives:
  - better than always prepending newcomers because the user’s existing tiled workflow now stays visually stable;
  - better than persisting a more complex “manual order” mode because the disruption came from a simple local policy that could be corrected without new state;
  - better than leaving render-time sorting unchanged because that would still allow a visible front-of-list flicker before `sessionOrder` reconciled.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so sessions missing from `sessionOrder` sort after already-arranged tiles once an active order exists.
- Updated the session-order sync effect to append new session IDs after the current valid order instead of prepending them, while keeping initial load sorted by recent activity.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the stable-order behavior and append-vs-initial-load merge logic.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback verification passed via a dependency-light `node` source-assertion script covering the new render-time ordering, appended steady-state session-order merge, and updated targeted test coverage.

### Still needs attention
- Once a runnable desktop target is available, this should get a live tiled-session sanity pass to confirm appended newcomers feel discoverable enough without reintroducing layout jumps.
- If live use shows appended newcomers are too easy to miss, the next local step should be lightweight “new session” emphasis or scroll/focus treatment rather than restoring front-of-list insertion.
- Session ordering still is not persisted across remounts; if that becomes a product need, it should be treated as a broader organization/state-restoration decision rather than folded into this local stability fix.

## Iteration 2026-03-08 — make appended newcomers discoverable without undoing stable tile order

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.new-session-affordance.test.ts`

### Repro steps
1. Open the desktop sessions page with at least two visible session tiles in `Compare` or `Grid`.
2. Keep working in the existing tiled arrangement and start a brand-new session.
3. After the stable-order change, notice that the newcomer now correctly stays appended at the end of the tiled order.
4. Before this change, there was no explicit transient cue that a new tile had joined, so appended newcomers could be easy to miss while attention stayed on the earlier tiles.

### UX problems found
- The previous iteration fixed disruptive reshuffling, but it also removed the loudest visual signal that a new session had arrived.
- Appended newcomers could be easy to miss in larger tiled grids because the header only surfaced reorder or width-pressure feedback.
- There was no temporary tile-level emphasis to help users visually locate the appended session without changing order.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked the follow-up gap it left open instead of revisiting recent resize-handle or panel-hint work.
- Code inspection showed the right local hook point was the same post-initial-load session-order sync path in `sessions.tsx`, plus `SessionTileWrapper` for brief visual emphasis.
- Live desktop inspection remains blocked in this workflow because there is still no inspectable Electron target available.

### Assumptions
- A brief, non-blocking cue is preferable to auto-scrolling or restoring front-of-list insertion, because preserving spatial stability remains the higher priority in tiled workflows.
- Temporary tile emphasis is acceptable because it improves discoverability without adding another persistent control or changing actual session order.
- Limiting this first pass to non-focus tiled states is acceptable because the immediate discoverability gap appeared in multi-tile compare/grid workflows.

### Decision and rationale
- Chosen fix: add a short-lived `New at end` header cue with polite screen-reader announcement, and briefly highlight appended tiles in the grid without affecting drag-target styling.
- Why this is better than the obvious alternatives:
  - better than re-prepending newcomers because it preserves the stable tile arrangement users just established;
  - better than auto-scrolling to the new tile because it avoids yanking the viewport while the user may still be reading another session;
  - better than adding a permanent new control because this is lightweight state feedback, not a workflow action that needs lasting chrome.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to track recently appended sessions after initial load, expire that feedback after a short timeout, and clean it up if the underlying sessions disappear.
- Added a transient blue header chip in `sessions.tsx` that announces when one or more new sessions were appended at the end of the current tiled order.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so tiles can receive an `isNewlyAdded` affordance and briefly render a lighter highlight ring that yields to stronger drag-target feedback.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new session-feedback state, announcement/chip copy, timeout cleanup, and tile-prop wiring.
- Added `apps/desktop/src/renderer/src/components/session-grid.new-session-affordance.test.ts` to lock in the temporary tile highlight behavior and its non-conflict with drag-target styling.

### Verification
- Attempted live desktop inspection with `electron_execute`, but it is still blocked here because no Electron renderer target is available (`No Electron targets found`).
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/components/session-grid.new-session-affordance.test.ts`
- Result: blocked by missing workspace dependencies in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted targeted typecheck: `pnpm --filter @dotagents/desktop typecheck:web`
- Result: blocked by missing installed workspace dependencies / base config (`Local package.json exists, but node_modules missing`; `File '@electron-toolkit/tsconfig/tsconfig.web.json' not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new-session feedback state, header cue, tile highlight wiring, and both targeted test files.
- `git diff --check` passed.

### Still needs attention
- Single-view / maximized mode still does not surface a comparable “new session arrived” cue; if that becomes a practical pain point, it should be handled without weakening tiled-order stability.
- Once the desktop app can be run in this workflow again, this should get a live pass to confirm the blue newcomer highlight is noticeable enough without competing with drag/reorder affordances.
- If live use shows appended newcomers are still too easy to miss in large grids, the next small experiment should be an optional “jump to newest” affordance or stronger hidden-session relationship in single view, not automatic scrolling.

## Iteration 2026-03-08 — surface appended newcomers inside Single view without adding more header chrome

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Enter `Single view` / maximized mode with more than one focusable session in the current session order.
2. Keep reading the currently focused session while a brand-new session is created in the background.
3. Before this change, the new session stayed appended at the end of the remembered order, but Single view itself gave no comparable visual cue that something new had arrived behind the focused session.
4. The only available hints were the existing hidden-session count and pager, which did not distinguish “already hidden” sessions from a newly appended arrival.

### UX problems found
- The previous newcomer-discoverability pass only helped multi-tile Compare/Grid states, so focused/maximized use still hid new arrivals behind unchanged Single-view chrome.
- Adding yet another standalone chip beside the already-dense Single-view restore, pager, and layout controls would have repeated the header-crowding problem that several earlier iterations were explicitly reducing.
- The existing hidden-session badge in Single view already occupied the right conceptual spot for this information, but it always communicated generic hidden-count context instead of the more time-sensitive “new session arrived” state.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked the exact follow-up gap the previous newcomer iteration left open instead of revisiting another resize or density tweak.
- Code inspection showed the existing `recentNewSessionFeedback` state already had everything needed for this pass; the gap was not missing data, but how Single view chose to present it.
- I checked for a live Electron renderer target again. A target was available, but it belonged to a different app (`SpeakMCP` at `http://localhost:5174/`), so I did not treat it as valid verification for this desktop worktree.

### Assumptions
- In Single view, temporarily prioritizing “new hidden” over the generic hidden-session badge is acceptable because the position label (`2 of 5`, etc.) still communicates overall hidden-session context.
- Reusing the existing Single-view badge / restore-button badge is preferable to adding another standalone chip because this header area already balances restore, pager, and layout controls under tight width constraints.
- It is acceptable for the screen-reader announcement to mention that the newcomer is hidden while Single view is active, because that extra context reduces ambiguity without changing the underlying ordering model.

### Decision and rationale
- Chosen fix: keep the existing tiled newcomer chip for Compare/Grid, but in Single view route the same transient newcomer state into the existing hidden-session badge / restore badge and expand the accessible copy so it explicitly says the new session is currently hidden by Single view.
- Why this is better than the obvious alternatives:
  - better than adding another standalone `New` chip because it preserves the compact Single-view header structure that earlier iterations just simplified;
  - better than auto-jumping or auto-paging to the new session because it keeps the user anchored on the session they intentionally maximized;
  - better than leaving the generic hidden-count badge unchanged because the visible cue now distinguishes a truly new arrival from the normal background context of already-hidden sessions.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so new-session announcements stay active in Single view and explicitly mention when the newcomer is hidden by the focused layout.
- Added a dedicated Single-view newcomer badge label helper in `sessions.tsx` and reused the existing hidden-session / restore badge surfaces to show transient `new hidden` feedback instead of adding another header chip.
- Extended Single-view title / restore-action copy in `sessions.tsx` so hover and assistive-text context mention newly added hidden sessions when relevant.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new Single-view newcomer badge path, restore-badge behavior on compact headers, and the updated announcement wiring.

### Verification
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new Single-view newcomer badge path, announcement wiring, and updated targeted test coverage.
- Live renderer inspection was attempted, but the available Electron target was for a different app (`SpeakMCP` at `http://localhost:5174/`), so no trustworthy in-app desktop validation was possible in this iteration.

### Still needs attention
- Once the desktop app is runnable for this worktree, this should get a live Single-view pass to confirm the reused hidden/restore badge feels noticeable enough without competing with the pager at compact widths.
- If real use shows the temporary newcomer badge is still too subtle in Single view, the next local refinement should prefer copy/spacing tuning or a more explicit pager destination hint before adding any extra permanent header chrome.
- A future follow-up could decide whether Single view ever deserves a direct `jump to newest` affordance, but only after validating that this lighter badge-based cue is insufficient.

## Iteration 2026-03-08 — let responsive stacked tiles actually use the single available column

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open tiled sessions in `Compare` or `Grid` with two or more visible sessions.
2. Narrow the sessions area until the header correctly reports `Stacked to fit` (for example by shrinking the window, widening the sidebar, or widening the floating panel).
3. Before this change, the layout messaging said the UI had fallen back to one column, but each tile still rendered from its remembered multi-column width.
4. That could leave a noticeably narrow column of tiles with wasted space on the right, plus width/corner resize affordances that no longer matched what the stacked layout was actually doing.

### UX problems found
- Responsive stacked mode explained that multiple columns no longer fit, but the tile footprint could still look like a preserved half-width compare/grid tile instead of a true single-column layout.
- Keeping width-oriented resize handles visible in that state weakened affordance clarity because stacked width was effectively being dictated by the container, not by the visible tile width control.
- The mismatch made the stacked fallback feel less intentional and more like a partial layout failure, especially at medium-narrow widths where there was still obvious unused horizontal space.

### Investigation notes
- I reviewed the latest ledger first and deliberately picked a gap it had not recently covered: actual tile footprint once the UI reports `Stacked to fit`, not another header-label or reorder-only tweak.
- Code inspection confirmed the key local behavior in `SessionTileWrapper`: `renderedWidth` only expanded for true `1x1` focus mode or the temporary one-visible-session case, not for responsive stacked multi-session states.
- I checked Electron live inspection again. A renderer target existed, but it belonged to a different app (`SpeakMCP` at `http://localhost:5174/`), so I did not treat it as valid desktop verification for this worktree.

### Assumptions
- When Compare/Grid collapses to one column because width is constrained, temporarily using the full single-column footprint is preferable to honoring a remembered narrower multi-column width, as long as the remembered width is not overwritten.
- Hiding width and corner resize handles during responsive stacked mode is acceptable because those affordances would otherwise imply a live width adjustment the stacked layout is intentionally overriding.
- Keeping the bottom height resize handle visible is still valuable in stacked mode because vertical density remains user-tunable even while width is temporarily container-driven.

### Decision and rationale
- Chosen fix: treat responsive stacked Compare/Grid as a temporary expanded-width presentation, similar in spirit to the existing one-visible-session expansion, while preserving the remembered underlying width state for when multiple columns fit again.
- Why this is better than the obvious alternatives:
  - better than resetting stored width on stack/unstack because it preserves the user’s multi-column size preference once the sessions area widens again;
  - better than adding another explicit stacked-mode control because the problem was contradictory behavior, not missing chrome;
  - better than leaving width/corner resize handles visible because removing misleading affordances makes the stacked fallback feel intentional and easier to predict.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` detects responsive stacked mode and temporarily renders tile width from the expanded single-column footprint instead of the remembered multi-column width.
- Kept remembered tile width state untouched so widening the sessions area can still restore the user’s prior compare/grid sizing preference.
- Updated `session-grid.tsx` to hide width and corner resize handles while responsive stacked mode is active, while leaving the bottom height resize affordance available.
- Extended `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` with source assertions covering the stacked-mode expanded-width path and the width-handle gating.

### Verification
- Attempted targeted test execution: `pnpm vitest run src/renderer/src/components/session-grid.single-view-preservation.test.ts src/renderer/src/components/session-grid.resize-behavior.test.ts` from `apps/desktop`
- Result: blocked by missing installed workspace dependencies in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted targeted renderer typecheck: `pnpm run typecheck:web` from `apps/desktop`
- Result: blocked by missing installed dependencies / base config (`Local package.json exists, but node_modules missing`; `File '@electron-toolkit/tsconfig/tsconfig.web.json' not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the stacked-width expansion logic and the width-handle gating in `session-grid.tsx`.
- `git diff --check` passed.
- Live Electron inspection was attempted, but the available renderer target was for a different app (`SpeakMCP`), so no trustworthy in-app validation was possible in this iteration.

### Still needs attention
- Extremely narrow sessions areas may still need a deeper follow-up because the expanded-width footprint still depends on the existing tile-width calculations and minimums.
- Once this worktree’s desktop app is runnable in the current environment, this should get a live pass to confirm stacked tiles now feel usefully full-width and that the remaining height-only resize affordance is clear enough.
- If real use shows users still want explicit width feedback while stacked, the next refinement should prefer lightweight explanatory copy or tooltip tuning before reintroducing more controls.

## Iteration 2026-03-08 — let Single view jump straight to the newest hidden newcomer

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Enter `Single view` / maximized mode with multiple focusable sessions in the remembered tile order.
2. Keep reading the current focused session while one or more brand-new sessions are appended in the background.
3. Notice the existing `new hidden` badge / restore badge context in the Single-view header.
4. Before this change, the user still had to page one tile at a time or leave Single view entirely to reach the newest arrival, even though the UI already knew that a hidden newcomer existed.

### UX problems found
- The previous Single-view newcomer pass improved awareness, but not actionability: the header could tell the user something new was hidden without offering a direct path to that new work.
- That made maximized mode feel stickier than necessary when activity continued elsewhere, especially if older hidden sessions sat between the current tile and the appended newcomer.
- Restoring the previous layout just to reach the newest session was often a stronger layout change than the user actually wanted.

### Investigation notes
- I reviewed the ledger first and deliberately chose the exact follow-up that the previous Single-view newcomer iteration left open: add an optional `jump to newest` path only if it could stay local and temporary.
- Code inspection showed `recentNewSessionFeedback` already carried the ordered newcomer IDs plus the latest label, so the missing piece was only a contextual action, not new state.
- I checked for a live Electron renderer target before finalizing; the only available target was still a different app (`SpeakMCP` at `http://localhost:5174/`), so I did not treat it as trustworthy desktop verification for this worktree.

### Assumptions
- A temporary direct jump action is acceptable in Single view because it stays scoped to the transient newcomer state instead of adding another always-on control.
- Jumping to the newest hidden newcomer is better than auto-switching focus because it preserves the user’s current reading context until they explicitly opt in.
- Keeping the action inside the existing pager group is preferable to adding another standalone chip because navigation is the closest conceptual home for “show me that new hidden session.”

### Decision and rationale
- Chosen fix: when Single view knows there is at least one newly added hidden session, show a temporary `Newest` action inside the existing pager group that jumps directly to the freshest hidden newcomer while keeping Single view active.
- Why this is better than the obvious alternatives:
  - better than auto-jumping to the newcomer because it respects the user’s current focus and avoids accidental context switches;
  - better than forcing a restore back to Compare/Grid because the user can inspect the new session without abandoning maximized mode;
  - better than another standalone header chip because the action sits with the existing Single-view navigation controls instead of creating more scattered header chrome.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - add a focused action-label helper for jumping to the newest hidden newcomer,
  - derive the freshest hidden newcomer ID/label from the existing `recentNewSessionFeedback` + `focusableSessionIds` state,
  - add a `handleJumpToNewestHiddenSession()` callback that reuses the existing focus-switch path,
  - and render a temporary blue-tinted `Newest` button (icon-only on compact headers) inside the existing Single-view pager group.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new helper, derived state, handler, and pager-button wiring.

### Verification
- Attempted live Electron inspection before finalizing, but the available renderer target was still a different app (`SpeakMCP` at `http://localhost:5174/`), so no trustworthy in-app desktop validation was possible in this iteration.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new Single-view jump helper, hidden-newcomer derivation, jump handler, pager action marker, and updated targeted test coverage.

### Still needs attention
- Once this worktree’s desktop app is runnable, this should get a live Single-view pass to confirm the temporary `Newest` action reads as a navigation shortcut rather than a layout or creation control.
- On very compact headers, the icon-only button may still need tooltip/copy tuning if the `ChevronsRight` affordance is too subtle beside the standard next-page button.
- If real use shows people want to move among multiple new hidden sessions rather than only jump to the freshest one, the next refinement should prefer better newcomer sequencing in the pager group before adding more persistent header chrome.

## Iteration 2026-03-08 — quantify floating-panel width pressure so recovery feels less guessy

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Resize the floating panel wider while Compare or Grid tiles are visible.
2. Watch the existing panel-resize hint and the sessions-header recovery CTA once the panel is clearly crowding tiled work.
3. Before this change, both surfaces told the user that the panel was “wide” or “crowding” tiles, but they did not show how far past the comfort range the panel had drifted.
4. Try to decide whether resetting the panel is worth it without already knowing the panel’s usual width.

### UX problems found
- The panel-resize hint already diagnosed crowded tiled layouts, but it only reported raw width (`728px wide`) rather than the more meaningful “how far past the comfort threshold am I?” signal.
- The sessions-header `Reset panel` / `Reset both` actions had helpful context-specific placement, but their titles still felt binary: users could not tell whether the panel was only slightly oversized or substantially crowding Compare/Grid.
- That made panel recovery feel more guess-based than necessary, especially after several earlier iterations had already made the recovery affordances easier to discover.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a fresh floating-panel clarity pass instead of revisiting the newer Single-view newcomer work.
- This iteration stayed code-driven because a trustworthy live desktop target is still not available in this workflow; previous probes only exposed a different app renderer, which would not be valid UX verification for this worktree.
- The existing `PANEL_TILE_PRESSURE_WIDTH` threshold was already the right local source of truth for “panel is materially crowding tiled work,” so this could stay a small copy/metadata refinement instead of another layout-behavior change.

### Assumptions
- Describing panel pressure relative to the existing tiled-session comfort threshold is more useful than repeating the absolute panel width, because the user cares about tiling impact rather than raw pixels.
- It is acceptable to quantify “pressure past comfort” rather than “exact pixels a reset will recover,” because the renderer knows the comfort threshold locally but does not have a guaranteed current-mode default-width value in this component path.
- Keeping the visible button labels stable while improving the resize hint detail and recovery titles is the right scope for this pass, because the main problem was predictability rather than missing controls.

### Decision and rationale
- Chosen fix: quantify panel crowding in terms of `x px past tile comfort` and thread that same pressure context into the floating-panel recovery title and the sessions-header panel/combo recovery titles.
- Why this is better than the obvious alternatives:
  - better than showing only raw width because `728px wide` still forces the user to remember what “normal” is;
  - better than renaming the buttons more aggressively because this preserves the already-learned `Reset panel` / `Reset both` actions while making their impact clearer;
  - better than adding another new badge or control because it improves the existing recovery path without adding more chrome to already crowded states.

### Code changes
- Added local panel-pressure helpers in `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` so crowded resize hints now describe the panel as, for example, `64px past tile comfort` instead of only showing raw width.
- Updated the persistent floating-panel recovery title in `panel-resize-wrapper.tsx` to include the quantified pressure when available.
- Added matching `getPanelTilePressureWidth(...)` / `getPanelTilePressureTitleSuffix(...)` helpers in `apps/desktop/src/renderer/src/pages/sessions.tsx` and appended that quantified context to the sessions-header `Reset panel` and `Reset both` titles.
- Extended the two existing source-assertion tests to lock in the new helper functions and pressure-aware copy.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node` source-assertion script passed against the changed component/page files and the updated test files.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the desktop app is runnable here, this should get a live pass to confirm `x px past tile comfort` feels clearer than the old raw-width copy while resizing the panel around the stacked / near-stacked thresholds.
- The visible sessions-header recovery button labels are still intentionally generic; if live use shows people still hesitate, the next local refinement should consider a small non-destructive pressure badge before changing button wording.
- The broader end-to-end interaction among panel width, sidebar width, and dense tile body hierarchy still deserves a true renderer pass rather than more code-only iteration.

## Iteration 2026-03-08 — show visible width-pressure badges on tiled recovery actions

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Electron renderer target probe via CDP (`http://localhost:5174/settings/general`, which is still not this worktree’s desktop sessions view)

### Repro steps
1. Open tiled sessions in Compare or Grid until the sessions header starts showing the existing stacked / near-stacked width-pressure recovery actions.
2. Widen the sidebar, the floating panel, or both until a `Reset sidebar`, `Reset panel`, or `Reset both` button appears.
3. Before this change, the tooltip/title explained the crowding in more detail, but the visible button itself still looked like a generic reset action.
4. Try to judge whether the reset is worth clicking without hovering or already remembering how far past the comfort threshold the layout has drifted.

### UX problems found
- The prior iteration quantified panel pressure in hover text, but the sessions-header recovery actions still required hover discovery for the most useful “how bad is it?” signal.
- Sidebar-only recovery was even more binary: the visible label stayed generic and the tooltip did not quantify how far past the tiled comfort threshold the sidebar had drifted.
- When both the sidebar and floating panel were crowding tiles, the combined reset action still surfaced only panel-specific quantified detail in its title, which understated the total horizontal pressure on tiled work.

### Investigation notes
- I reviewed the ledger first and intentionally chose the exact follow-up that the previous width-pressure iteration left open: add a small, non-destructive visible pressure cue before changing the learned reset button wording.
- This stayed local to `sessions.tsx` because the missing clarity was in the tiled sessions header, not in the floating-panel resize wrapper itself.
- I probed the available Electron renderer target again before documenting results; it still points at `http://localhost:5174/settings/general`, so I did not treat it as trustworthy in-app validation for the desktop sessions UI in this worktree.

### Assumptions
- A compact pressure badge is acceptable on the existing recovery buttons because it increases action clarity without adding a new control or another standalone chip.
- Hiding the badge on very compact headers is the right tradeoff because that state already prioritizes the base action label and icon over extra metadata.
- Summing sidebar and panel pressure for the combined badge is acceptable as a quick visible severity cue because the action resets both sources of crowding at once; the title now preserves the per-source detail.

### Decision and rationale
- Chosen fix: keep the existing `Reset sidebar`, `Reset panel`, and `Reset both` labels, but add a small visible pressure badge on non-very-compact headers and extend sidebar/combined titles so they quantify the actual crowding source(s).
- Why this is better than the obvious alternatives:
  - better than renaming the visible buttons more aggressively because it preserves the now-familiar action wording while making severity visible;
  - better than another separate badge/chip in the header because the pressure information stays attached to the action it explains;
  - better than panel-only quantification because tiled crowding can also come from the sidebar or the combination of both widths.

### Code changes
- Added `getSidebarTilePressureWidth(...)`, `getSidebarTilePressureTitleSuffix(...)`, `getCombinedTilePressureWidth(...)`, and `getCombinedTilePressureTitleSuffix(...)` helpers in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Added a shared `getTilePressureBadgeLabel(...)` helper so sessions-header recovery buttons can show concise visible cues like `+64px` or `64px over` without changing their main wording.
- Updated the sidebar, panel, and combined tiled recovery actions to render compact pressure badges on non-very-compact headers and to carry fuller quantified tooltip text.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new helpers, pressure-badge derivation, badge rendering, and the updated sidebar/combined title strings.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new sidebar/combined pressure helpers, the visible recovery badges, and the updated targeted test coverage.

### Still needs attention
- Once the desktop sessions UI is actually runnable in this worktree, this should get a real header pass to confirm the new badges read as useful severity cues instead of extra noise, especially near the compact-header breakpoint.
- The combined badge currently summarizes total width pressure while the title provides the per-source breakdown; if that feels too abstract in live use, the next refinement should prefer a clearer compact split badge before changing button copy again.
- Dense header states still deserve a renderer check for wrap/overflow behavior when recovery hints, newcomer cues, and layout controls appear together.

## Iteration 2026-03-08 — suppress compact newcomer chrome when width-pressure recovery already needs the header

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Electron renderer probe via `electron_execute` (still unavailable in this workflow)

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with multiple visible tiles.
2. Make the sessions area compact enough that the existing stacked / near-stacked hint and `Reset sidebar` / `Reset panel` / `Reset both` recovery action appear.
3. While that compact width-pressure state is active, create a brand-new session so the existing newcomer feedback logic tries to show its transient blue header chip.
4. Before this change, the header could end up carrying layout context, width-pressure hinting, recovery CTA(s), layout controls, and the newcomer chip at the same time.

### UX problems found
- The transient `New at end`-style header chip was still visible during compact width-pressure states, even though the header was already prioritizing recovery and layout-preservation cues.
- That newcomer chip duplicated information already available elsewhere in the same moment: the screen-reader announcement still fires, and the new tile itself already gets temporary in-grid highlighting.
- The extra chip made the compact tiled header more likely to wrap or feel noisy at exactly the moment the UI was trying to help the user recover space.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked the unresolved dense-header interaction it had just called out, rather than revisiting another Single-view-only refinement.
- Code inspection showed `showNewSessionFeedback` only suppressed reorder feedback, not compact width-pressure prioritization, so the gap was local to `sessions.tsx`.
- I attempted a quick live Electron probe before finalizing, but this workflow still cannot expose the correct renderer target (`Failed to list CDP targets`), so this stayed a code-driven iteration.

### Assumptions
- In compact Compare/Grid headers, width-pressure recovery is more urgent than a second visible newcomer cue because the new tile highlight already preserves discoverability inside the grid.
- Keeping the screen-reader announcement path unchanged is sufficient accessibility continuity for this pass; the problem was visible chrome density, not missing announcement semantics.
- This should remain a local prioritization tweak rather than a broader header re-layout, because the overlap only appears in a specific compact pressure state.

### Decision and rationale
- Chosen fix: when compact width-pressure hinting is active, keep the polite new-session announcement and tile highlight, but suppress the visible newcomer chip from the tiled header.
- Why this is better than the obvious alternatives:
  - better than removing newcomer feedback entirely because the announcement and tile highlight still make the arrival discoverable;
  - better than adding another compacted newcomer variant because the main issue was too much simultaneous chrome, not the lack of yet another cue;
  - better than a broader header refactor because one local priority rule resolves the overlap without changing established controls.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showNewSessionFeedback` now yields to `shouldPrioritizeWidthPressureHint` in compact tiled headers.
- Left `showNewSessionAnnouncement` untouched so assistive feedback still fires even when the visible chip is suppressed.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new prioritization rule and the preserved announcement path.

### Verification
- Attempted live Electron inspection before finalizing, but `electron_execute` still could not list usable CDP targets in this workflow.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new width-prioritization guard in `sessions.tsx` and the updated focused test coverage.

### Still needs attention
- Once the desktop sessions UI is runnable here, this should get a live compact-header pass to confirm the calmer header still leaves newcomers discoverable enough through the tile highlight alone.
- If live use shows the newcomer signal became too subtle under width pressure, the next refinement should prefer a lower-noise tie-in to existing recovery/context surfaces instead of restoring a standalone chip.
- Compact header density could still need one more pass if the current-layout chip and recovery hint continue to wrap together at intermediate widths.

## Iteration 2026-03-08 — stop the adaptive layout chip from competing with stacked recovery on compact headers

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Electron renderer probe via `electron_execute` (still unavailable in this workflow)

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with enough width pressure that the layout actually stacks to fit.
2. Keep the sessions header in its compact-but-not-tiniest range so the selected layout button still shows its label.
3. Compare the lower header row while the stacked recovery hint is visible.
4. Before this change, the header could show both the adaptive `Current layout` chip (`Compare · Stacked` / `Grid · Stacked`) and the stacked recovery hint at the same time, even though both were explaining the same stacked state.

### UX problems found
- In compact stacked headers, the adaptive layout chip and the stacked recovery hint were both spending space to explain the same width-driven fallback.
- That duplicate state made the lower toolbar row more likely to wrap or feel noisy right when the UI was already trying to foreground recovery actions.
- The selected layout button already preserved the user's intended mode (`Compare` / `Grid`), so the extra chip was mostly redundant in this specific compact stacked state.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose the remaining compact-header density issue it called out, rather than revisiting newcomer priority or a different tiled surface.
- Code inspection showed a clean local boundary in `sessions.tsx`: `showCurrentLayoutChip` was still purely driven by adaptive-layout state, without considering that compact stacked headers now also render an explicit recovery hint for the same condition.
- The selected layout button already keeps a truthful title (`Current layout: ... — Stacked to fit`), so removing the visible chip in this one state would not remove the deeper explanation from hover/accessibility metadata.
- I attempted a lightweight live Electron inspection before finalizing, but `electron_execute` still cannot list usable renderer targets here (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).

### Assumptions
- In compact stacked headers, the stacked recovery hint is the higher-value visible cue because it both explains the fallback and points toward recovery.
- Keeping the selected layout button plus its existing title is sufficient layout-state continuity once the redundant stacked chip is removed.
- This should stay a local priority rule for compact stacked headers rather than a broader redesign of adaptive layout messaging.

### Decision and rationale
- Chosen fix: suppress the adaptive current-layout chip when the header is compact and the stacked recovery hint is already visible.
- Why this is better than the obvious alternatives:
  - better than keeping both cues because it removes duplicate stacked-state chrome from an already constrained header row;
  - better than hiding the stacked recovery hint instead because the recovery hint is the more actionable explanation in width-pressure states;
  - better than removing adaptive layout messaging everywhere because the chip still remains useful in other adaptive states like the one-visible-session expansion case.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showCurrentLayoutChip` now yields when the header is compact and `showStackedLayoutRecoveryHint` is already active.
- Left the selected layout button title unchanged, so the current-mode control still carries the full `Current layout: ... — ...` explanation on hover/focus.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new compact stacked-header suppression rule and the continued explanatory button title.

### Verification
- Attempted live desktop inspection before finalizing, but `electron_execute` is still blocked here because no inspectable Electron renderer target is available.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new `showCurrentLayoutChip` guard, continued stacked-hint title usage, and the updated focused source-assertion test coverage.

### Still needs attention
- Once the desktop sessions UI is runnable here, this should get a live compact stacked-header pass to confirm the calmer row still makes the selected layout plus recovery action feel sufficiently self-explanatory.
- If intermediate-width headers still wrap in real use, the next local refinement should compare whether the pressure badge on recovery buttons or the generic stacked hint label should collapse first before touching broader layout controls.
- Near-stacked compact headers remain a separate case because they do not currently render the adaptive stacked chip; any further density work there should be evaluated independently.

## Iteration 2026-03-08 — make the panel-local recovery button explain oversized width without hover

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- Electron renderer probe via `electron_execute` (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`)

### Repro steps
1. Open the floating panel alongside tiled sessions and widen it until the persistent top-edge recovery button appears.
2. Stop resizing so the drag-time hint disappears and only the idle recovery button remains.
3. Compare the panel-local recovery button with the sessions-header `Reset panel` / `Reset both` actions.
4. Before this change, the sessions header could show a visible `+64px`-style pressure badge, but the panel-local button still only said `Reset wide panel` and kept the actual severity in hover text.

### UX problems found
- The persistent panel-local recovery button still looked binary after the sessions header had already learned to show visible width-pressure severity.
- That made the panel surface less self-explanatory than the sessions surface for the same crowding problem, even though the panel button is the control physically closest to the resize interaction.
- The wording `Reset wide panel` also spent visible width restating the problem instead of surfacing how far past the tiled comfort threshold the panel actually is.

### Investigation notes
- I reviewed the ledger first and deliberately chose a fresh floating-panel follow-up rather than another compact sessions-header pass.
- The remaining gap was local and coherent: `panel-resize-wrapper.tsx` already knows the current panel width and threshold, so it could mirror the existing header badge pattern without new state, IPC, or layout abstraction.
- I attempted a lightweight live Electron check before editing, but this workflow still does not expose an inspectable desktop renderer target, so I treated this as a code-driven local refinement.

### Assumptions
- Reusing the same `+Npx` severity language already used in the sessions header is better than inventing a second panel-specific badge vocabulary.
- Shortening the visible label to `Reset panel` is acceptable in the panel-local surface because the control already sits inside panel chrome and the badge now carries the “why now?” context.
- Keeping the detailed hover/ARIA title unchanged is sufficient for the full explanation; the visible badge only needs to make severity glanceable.

### Decision and rationale
- Chosen fix: keep the oversized-only persistent recovery affordance, but shorten its visible label to `Reset panel` and attach a compact inline pressure badge when the panel is actually past the tiled-session comfort threshold.
- Why this is better than the obvious alternatives:
  - better than leaving the old generic label because severity is now visible without hover;
  - better than adding another standalone chip near the drag bar because the pressure cue stays attached to the recovery action it explains;
  - better than broadening the button or adding more words because the shorter action label plus compact badge uses the same space more efficiently.

### Code changes
- Added `getPanelTilePressureBadgeLabel(...)` in `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` so the panel wrapper can derive the same compact `+Npx` severity cue already used in tiled-session recovery actions.
- Derived `persistentPanelRecoveryPressureLabel` from the existing panel width-pressure threshold logic.
- Updated the persistent recovery button to render `Reset panel` plus an inline `data-panel-size-recovery-badge` chip when pressure is above the comfort threshold.
- Extended `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with focused source assertions for the new helper, badge derivation, badge DOM marker, and updated button label.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- Result: still blocked by missing workspace test tooling in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a plain `node` source-assertion script covering the new panel pressure-badge helper, visible recovery badge markup, and updated focused test coverage.

### Still needs attention
- Once the desktop panel is runnable here, this top-edge button should get a live pass to confirm the added badge improves clarity without making the drag-bar region feel too busy.
- If the button feels slightly too wide in real use, the next local tweak should be pressure-badge thresholding or spacing tuning before removing the visible severity cue entirely.
- The broader interaction between panel width pressure, sessions-header recovery actions, and exact panel placement still needs a real renderer pass rather than more code-only iteration.

## Iteration 2026-03-08 — make active tile resizing feel measurable instead of guessy

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page in Compare or Grid mode so one or more tiles expose the visible resize handles.
2. Drag a tile's right edge, bottom edge, or corner handle.
3. While dragging, try to judge whether the tile is now at a useful size and whether recovery back to the layout default is nearby.
4. Compare that live interaction with the existing hover/focus affordances, which already explain how to start resizing but not much about the in-progress result.

### UX problems found
- The resize handles had already become more discoverable, but active tile resizing still gave very little direct feedback about the size the user was converging on.
- That made resizing feel more trial-and-error than it needed to be, especially when tuning widths in dense compare/grid layouts.
- The tile-local reset path existed on the handle, but during the drag itself there was still no visible reminder that recovery was immediate and local.

### Investigation notes
- I reviewed the ledger first and deliberately chose a fresh tile-resizing follow-up rather than another sessions-header or panel-width pass.
- `useResizable` already keeps preview dimensions current during drag via ref-backed rendering, so a live size readout could be added without changing the sizing model or adding new persistence logic.
- `session-grid.tsx` already owns the resize-handle chrome, which kept this improvement local to the tile surface instead of spreading resize status into page-level controls.
- A live Electron inspection was not practical in this workflow because there is still no inspectable desktop renderer target available.

### Assumptions
- A small drag-only size pill is acceptable chrome because it only appears during an active resize gesture and directly supports that gesture.
- Showing raw width/height feedback is more useful here than adding more permanent controls or another settings surface.
- It is acceptable for this pass to focus on pointer-drag feedback first; keyboard resizing already has explicit tooltip/ARIA guidance and does not need a broader redesign in the same iteration.

### Decision and rationale
- Chosen fix: show a compact drag-time size pill in the tile itself while a resize gesture is active, using handle-specific copy (`Width ...`, `Height ...`, or `W × H`) and including a short reset reminder on wider tiles.
- Why this is better than the obvious alternatives:
  - better than leaving drag state implicit because users can now measure the result while resizing instead of inferring it from surrounding layout changes alone;
  - better than adding a permanent badge because the information mainly matters during the gesture and would otherwise add idle chrome;
  - better than a broader resize-system refactor because the needed clarity was already available from local tile state.

### Code changes
- Exported `TileResizeHandleType` from `apps/desktop/src/renderer/src/components/session-grid.tsx` and added `getTileResizeFeedbackLabel(...)` for handle-specific drag-time copy.
- Added local `activeResizeHandle` tracking in `SessionTileWrapper` so the tile knows which handle initiated the active resize gesture.
- Rendered a temporary `data-session-tile-resize-feedback` pill at the top-right of the tile during active resizing, with compact fallback copy for narrower tiles.
- Wired each resize handle's `onMouseDown` to capture the active handle and clear it again via the existing `useResizable` `onResizeEnd` callback.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with focused source assertions for the new live resize-feedback wiring.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with a pure-function assertion for the new feedback-label helper.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- A dependency-light `node` source-assertion script passed for the new drag-time feedback helper, active-handle tracking, compact-width guard, feedback DOM marker, and handle wiring.
- I did not repeat another `vitest` run in this iteration because earlier targeted runs in this worktree were already blocked by missing workspace test tooling, and repeating the same failure would not add useful signal.
- Live desktop inspection remains blocked in this workflow because no inspectable Electron renderer target is currently available.

### Still needs attention
- Once the desktop sessions UI is runnable here, this resize pill should get a quick live pass to confirm the top-right placement does not fight tile headers or content in especially busy tiles.
- If live use shows the pill is helpful but too subtle, the next small follow-up should tune the compact-copy threshold or visual emphasis before adding any more resize chrome.
- Keyboard resizing still relies mainly on the existing handle focus/ARIA guidance; if it proves hard to interpret in practice, that should be handled as a separate focused iteration rather than broadening this drag-time pass.

## Iteration 2026-03-08 — make Single-view restore land on an obvious tile, not a blind grid jump

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`

### Repro steps
1. Open the desktop sessions page with enough visible sessions that the tiled area requires some scanning or scrolling.
2. Enter `Single view` / maximized mode on a session that is not already perfectly centered in the multi-tile layout.
3. Use `Back`, `Compare`, or `Grid` to leave Single view.
4. Notice that the restored layout keeps the correct tile focused, but the return can still feel like a visual jump because the user has to reacquire that tile inside the reopened grid.

### UX problems found
- Earlier iterations made Single view less destructive and more self-explanatory, but the exit path still relied too heavily on the user noticing the restored focus treatment after the surrounding grid reappeared.
- That made `Back to …` feel more like a mode switch than a clear handoff back to a specific place in the tiled workflow.
- The ledger had already called out this gap multiple times (`stronger continuity cue beyond the existing “Back to …” button`), so this was a good fresh follow-up without revisiting the more recent resize/panel passes.

### Investigation notes
- `sessions.tsx` already had a solid `scrollSessionTileIntoView(...)` helper for entering Single view and paging within it, but it was not reused when leaving Single view.
- The restored tile already stays logically focused, so the smallest effective change was to strengthen continuity at the moment of exit rather than invent a new persistent restore control.
- A live Electron inspection was attempted again but is still not practical here because there is no inspectable desktop renderer target available in this workflow.

### Assumptions
- Re-centering the restored tile when leaving Single view is preferable to preserving a stale scroll position because the user's intent is to reconnect with the maximized session's place in the tiled layout.
- A brief tile-local emphasis is acceptable chrome because it is transient, scoped to the restore moment, and piggybacks on existing tile focus language instead of adding another permanent header badge.
- It is acceptable to keep this pass local to sessions/grid code rather than redesigning the Single-view header again, because the main gap was spatial continuity, not missing controls.

### Decision and rationale
- Chosen fix: when the UI exits Single view, remember the last maximized session, call `scrollSessionTileIntoView(...)` for that restored tile, and briefly intensify that tile's in-grid highlight.
- Why this is better than the obvious alternatives:
  - better than adding more restore-button copy because the problem happens after the user clicks restore, when they need to find their place again in the grid;
  - better than a permanent `Returned from Single view` badge because the cue only matters during the transition back to tiled work;
  - better than a broader layout-state refactor because the code already had the necessary focus and scroll primitives.

### Code changes
- Added `RecentSingleViewRestoreFeedback` plus `getSingleViewRestoreAnnouncementLabel(...)` in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Tracked the previous focus-layout state and latest maximized session so `sessions.tsx` can detect the moment the UI leaves Single view, re-center the restored tile, and fire a short-lived screen-reader announcement.
- Passed `isRestoredFromSingleView` into tiled session wrappers from `sessions.tsx`.
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `SessionTileWrapper` briefly renders a stronger sky-tinted ring/shadow treatment for the restored tile and suppresses the newcomer highlight when both states would otherwise compete.
- Extended `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` with focused source assertions for the restore-scroll and restored-tile emphasis wiring.

### Verification
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` passed.
- Attempted targeted test execution with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.scroll-navigation.test.ts src/renderer/src/components/session-grid.single-view-preservation.test.ts`.
- Result: still blocked in this worktree by missing installed test tooling (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Live desktop inspection remains blocked in this workflow because no inspectable Electron renderer target is currently available.

### Still needs attention
- Once the desktop sessions UI is runnable here, this restore transition should get a live pass to confirm the re-centering feels helpful rather than jumpy and that the restored-tile emphasis is noticeable without reading as a warning state.
- If live use shows the new ring/shadow cue is still too subtle, the next local refinement should tune its intensity or add a very small transient badge before revisiting the Single-view header again.
- Very large grids may still benefit from a future follow-up that previews where `Back to …` will land before restore, but that should stay separate from this minimal continuity fix.

## Iteration 2026-03-08 — make keyboard tile resizing feel visible, not silent

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page in Compare or Grid mode so a tile exposes the width, height, or corner resize handle.
2. Focus one of those handles with the keyboard.
3. Press arrow keys to nudge the tile size, or press `Enter` to reset the focused dimension.
4. Notice that the tile changes size, but without the pointer-drag state there is no equally visible confirmation of the new size or the reset result.

### UX problems found
- Pointer dragging already had a live size pill, but keyboard resizing still felt visually silent even though it was fully wired.
- That created an uneven affordance story: mouse users got measurement feedback, while keyboard users had to infer success from surrounding layout movement alone.
- The focused handle title and ARIA copy explained the controls, but they did not provide immediate on-screen confirmation after each nudge or reset.

### Investigation notes
- I reviewed the ledger first and deliberately chose a new resize follow-up instead of revisiting the more recent panel-width or Single-view restoration work.
- `session-grid.tsx` already had a good transient feedback surface for pointer resizing, so the smallest effective fix was to reuse that surface for keyboard actions instead of adding new persistent chrome.
- `useResizable` already applies keyboard-triggered size changes synchronously via `setSize(...)`, which made a short-lived keyboard feedback state enough for this iteration.
- Live Electron inspection still was not practical in this workflow because there is no inspectable desktop renderer target available here.

### Assumptions
- Reusing the existing top-right resize pill for keyboard actions is acceptable because it keeps the visual language consistent between pointer and keyboard resizing.
- A short-lived feedback pill is preferable to a persistent keyboard-only badge because the information matters most immediately after the action.
- It is acceptable for compact keyboard-reset copy to prioritize resulting size over the word `reset`, because very narrow tiles have less room and the changed size is still the most important signal.

### Decision and rationale
- Chosen fix: show the same tile-local resize feedback pill briefly after keyboard nudges and keyboard resets, with keyboard-specific wording (`Enter reset` for nudges and explicit reset phrasing on wider tiles).
- Why this is better than the obvious alternatives:
  - better than leaving keyboard resizing implicit because the user now gets visible confirmation without having to compare surrounding layout changes mentally;
  - better than adding another permanent accessibility chip because the needed clarity is transient and already has a natural home in the existing resize-feedback pill;
  - better than broadening the resize-handle tooltips again because the problem was not discoverability anymore, it was post-action confirmation.

### Code changes
- Added `getTileResizeKeyboardFeedbackLabel(...)` plus a small tile-size clamping helper in `apps/desktop/src/renderer/src/components/session-grid.tsx` so keyboard resize feedback can use wording tailored to nudges vs resets.
- Added short-lived `keyboardResizeFeedback` state and timeout cleanup in `SessionTileWrapper`.
- Updated keyboard resize handling to compute the next clamped size, show the transient feedback pill, and then apply the size change or reset.
- Reused the existing `data-session-tile-resize-feedback` pill for both pointer-drag and keyboard-resize feedback by deriving a shared active handle/label.
- Cleared stale keyboard feedback when a pointer resize starts so the two feedback modes do not overlap.
- Extended `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` and `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with focused coverage for the new keyboard-feedback path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- Result: still blocked in this worktree by missing installed test tooling (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via a `node` source-assertion script covering the new keyboard feedback helper, timeout wiring, shared resize-feedback marker, and updated focused test coverage.

### Still needs attention
- Once the desktop sessions UI is runnable here, this keyboard-resize feedback should get a quick live pass to confirm the pill duration feels long enough to register without lingering.
- If live use shows `Enter reset` is still too subtle on wider tiles, the next small follow-up should tune the wording before adding any more keyboard-specific chrome.
- Pointer double-click reset still relies on the drag-style wording path; if that feels inconsistent after a live pass, it should be adjusted as a separate small copy iteration rather than broadening this keyboard-focused change.

## Iteration 2026-03-08 — let focused and stacked tiles truly fit ultra-narrow single-column space

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`
- Electron renderer probe via `electron_execute` (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`)

### Repro steps
1. Open the desktop sessions page in `Compare`, `Grid`, or `Single view`.
2. Make the available sessions area extremely narrow by shrinking the window and/or keeping the sidebar and floating panel wide.
3. Let the tiles fall back to a one-column presentation (`Stacked to fit`) or enter `Single view`.
4. Before this change, notice that the tile is conceptually in a single-column layout but can still hold onto a `200px` minimum width, causing horizontal overflow or clipped chrome in the narrowest states.

### UX problems found
- Earlier iterations correctly expanded focused / stacked tiles to a single-column footprint, but the expanded-width calculation still reused the normal `1x1` tile-width helper.
- That helper intentionally enforces the standard multi-tile minimum width (`TILE_DIMENSIONS.width.min`), which is good for manual resize states but too rigid once the UI has already chosen a forced single-column presentation.
- The result was a subtle mismatch: the layout said “one column to fit,” yet the tile could still overflow that column at the narrowest widths instead of actually fitting it.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a footprint / overflow follow-up rather than another resize-feedback or Single-view header pass.
- Code inspection showed the issue was highly local: `expandedLayoutWidth` came from `calculateTileWidth(containerWidth, gap, "1x1")`, so focused and stacked tiles still inherited the normal tile minimum.
- A lightweight live inspection attempt was made again before editing, but this workflow still does not expose an inspectable desktop renderer target for this app.

### Assumptions
- In forced single-column states (`Single view`, temporary one-visible-tile expansion, or responsive stacked layout), fitting the actual available column is better UX than preserving the normal multi-tile minimum width.
- It is acceptable to keep the existing width minimum for regular multi-column / manually resizable states, because that minimum still protects readability when tiles are not intentionally expanded to one column.
- Allowing expanded tiles to shrink below `200px` only when the available column itself is narrower is a safer local fix than changing the shared tile minimum globally.

### Decision and rationale
- Chosen fix: add a dedicated expanded-width helper that caps at the existing max width but does **not** enforce the normal multi-tile minimum, then use it only for the already-expanded tile presentation path.
- Why this is better than the obvious alternatives:
  - better than lowering the global tile minimum because it keeps ordinary compare/grid resize behavior unchanged;
  - better than leaving the old helper in place because the UI now fulfills the promise of “fit this one column” even at the narrowest widths;
  - better than another stacked-mode copy hint because the problem was actual overflow behavior, not missing explanation.

### Code changes
- Added `calculateExpandedTileWidth(...)` in `apps/desktop/src/renderer/src/components/session-grid.tsx`.
- Updated `SessionTileWrapper` so `expandedLayoutWidth` now uses that helper instead of the regular `calculateTileWidth(..., "1x1")` path.
- Extended `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` with source assertions covering the new helper and the below-minimum expanded-width behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`
- Result: still blocked in this worktree by missing installed test tooling (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Fallback dependency-light verification passed via `pnpm exec node` source assertions covering the new expanded-width helper, its use in `SessionTileWrapper`, and the updated focused regression test.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass at the narrowest realistic sidebar + floating-panel combinations to confirm the new behavior feels like graceful fitting rather than over-compression.
- Extremely narrow widths may still need a later content-density pass inside the tile body if transcript/header chrome remains too busy even after the outer tile now fits the column.
- If live use suggests focused tiles should keep a softer minimum than fully collapsed-to-column width, that should be tuned as a focused breakpoint/content decision rather than by restoring the old global minimum behavior.

## Iteration 2026-03-08 — keep floating-panel tile-impact feedback visible after pointer resize settles

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/app-layout.sidebar-resize-feedback.test.ts`

### Repro steps
1. Open the desktop app with the sessions page visible and the floating panel open.
2. Drag a width-affecting panel resize handle left or right until the existing tile-impact hint appears.
3. Release the pointer after finding a width that either helps or crowds tiled sessions.
4. Before this change, notice that the hint disappears immediately on mouse-up, so the user loses the settled-state confirmation at the exact moment they want to judge whether the new width was helpful.

### UX problems found
- The floating-panel tiling hint already explained live drag impact well, but pointer users lost that explanation the instant the drag ended.
- That made panel resizing feel less conclusive than keyboard resizing, which already kept the hint visible briefly after each nudge.
- The abrupt disappearance also weakened the reset affordance story, because users had to reacquire the separate recovery button instead of finishing the gesture with one last clear “what this did to Compare/Grid” confirmation.

### Investigation notes
- I reviewed the ledger first and intentionally picked a fresh floating-panel follow-up instead of repeating the more recent Single-view and tile-resize iterations.
- `panel-resize-wrapper.tsx` already had the correct hint surface, the starting-size metadata, and a short keyboard-only settle timeout; the gap was specifically that pointer width resizes cleared the hint immediately.
- `resize-handle.tsx` already sends pointer commit metadata for drag-end and pointer reset interactions, which kept the fix local to the wrapper instead of requiring a broader resize-system refactor.
- A live desktop inspection still was not practical in this workflow because no inspectable Electron renderer target is available here.

### Assumptions
- A short post-drag hint window is acceptable because it is transient and only appears after explicit width-resize gestures that already surface the same hint while dragging.
- It is acceptable to temporarily delay the persistent `Reset panel` chip while the short settle hint is visible, because the hint itself still carries the reset instruction and preserves continuity from the drag gesture.
- Restricting this improvement to width-affecting handles is the right scope for this pass, because only width changes directly alter tiled-session space.

### Decision and rationale
- Chosen fix: keep the existing tiled-session impact hint visible briefly after pointer-based width resizing settles, and do the same for pointer double-click reset by backfilling the missing starting-size metadata locally in the wrapper.
- Why this is better than the obvious alternatives:
  - better than leaving pointer resize end implicit because the user gets a short settled-state readout exactly when they evaluate whether Compare/Grid has enough room;
  - better than adding a new permanent badge because the need is momentary and already has a natural home in the existing resize hint;
  - better than moving this feedback into page-level sessions chrome because the cause is local to the floating panel and should stay visually anchored there.

### Code changes
- Added `PANEL_POINTER_TILING_HINT_TIMEOUT_MS` in `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`.
- Generalized the old keyboard-only timeout bookkeeping into a shared `tilingHintTimeoutRef` / `clearPendingTilingHint()` path.
- Updated `settlePanelTilingHint(...)` so width-affecting pointer commits now keep the existing hint visible briefly after drag end, while keyboard commits still use the longer timeout.
- Backfilled `startingSize` for pointer reset interactions in `handleResetPanelSize(...)` so double-click reset can also produce a settled tiling hint.
- Extended `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with focused source assertions for the new pointer settle timeout and reset-meta backfill.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- `pnpm exec node` source assertions passed for the new pointer settle timeout, shared tiling-hint timeout state, timeout selection logic, and pointer reset metadata backfill.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`.
- Result: still blocked in this worktree by missing installed test tooling (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Live desktop inspection remains blocked in this workflow because no inspectable Electron renderer target is currently available.

### Still needs attention
- Once the desktop renderer is inspectable here, this settle timeout should get a quick live pass to confirm `1200ms` feels reassuring rather than sticky.
- If live use shows users still miss the recovery path after widening the panel too far, the next small follow-up should tune the handoff between the settle hint and the persistent `Reset panel` chip rather than adding more new chrome.
- The sessions page still deserves a future density pass inside compact tiles under combined sidebar + panel pressure, but that should stay separate from this local panel-resize continuity fix.

## Iteration 2026-03-08 — collapse compact draft composers back into a lighter summary row

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- `apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`

### Repro steps
1. Open the desktop sessions page with multiple active tiled sessions so at least one non-focused tile uses the compact follow-up composer.
2. Expand that compact composer, type a draft message or attach one or more images, then move focus to another tile.
3. Before this change, notice that the full inline composer stays open just because unsent draft content exists.
4. Compare that tile against the rest of the dense grid: the draft-bearing tile quietly regains the heavier footer chrome that compact mode was supposed to reduce.

### UX problems found
- The compact tile composer already reduced at-rest chrome for empty tiles, but any unsent draft forced the full inline form to stay open even after the user moved on.
- That behavior preserved content safely, but it reintroduced avoidable vertical and visual weight in dense tiled layouts exactly when the user was no longer actively working in that tile.
- The result was an uneven grid where one stray draft could make a compact tile feel “expanded by accident” instead of intentionally active.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose the open compact-tile density follow-up rather than revisiting panel-width or Single-view continuity again.
- `AgentProgress` already scopes compact follow-up behavior to non-focused, non-expanded tiles, so `TileFollowUpInput` was the right local boundary for a draft-density fix.
- The component already preserved draft text and attachments in local state, which meant this pass could change presentation without changing message semantics.
- I did not re-run live Electron inspection for this pass because repeated attempts in this workflow still lack an inspectable renderer target; this iteration relied on code inspection plus targeted verification instead.

### Assumptions
- In compact tiled workflows, a non-focused draft should behave like a lightweight reminder rather than a permanently expanded inline form.
- Preserving the draft text and attachments is more important than preserving the full expanded chrome when the tile is no longer active.
- A short draft preview plus attachment count is sufficient orientation for a local density pass, because re-engaging the row still restores the full composer immediately.

### Decision and rationale
- Chosen fix: let compact-mode follow-up composers collapse back to the lightweight summary row even when they contain an unsent draft, while summarizing that draft with a short preview and attachment count.
- Also collapse the composer when it blurs or when the tile returns to compact mode without the form still owning focus.
- Why this is better than the obvious alternatives:
  - better than leaving draft-bearing composers fully open because dense grids keep their lighter, more consistent footer rhythm;
  - better than clearing drafts on blur because the user keeps their work and can resume with one click;
  - better than adding a separate “saved draft” control because the existing compact row already provides the right low-chrome affordance.

### Code changes
- Added `COMPACT_DRAFT_PREVIEW_LIMIT` and `getCompactDraftPreview(...)` in `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`.
- Updated compact-composer rendering so the lightweight row can summarize draft-bearing tiles instead of only empty ones.
- Added compact draft summary/title logic plus a small attachment-count badge for image-bearing drafts.
- Added `formRef`-based compact re-collapse behavior so non-focused draft composers collapse after blur or when the tile returns to compact mode without the form retaining focus.
- Extended `apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts` with source assertions covering the new draft-summary and blur-collapse behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx apps/desktop/src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node` source-assertion script passed for the new compact draft preview helper, summary label, active-focus guard, blur-collapse handler, and updated title wiring.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts`.
- Result: blocked in this worktree because direct `vitest` execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted package-script fallback: `pnpm --filter @dotagents/desktop run test -- --run src/renderer/src/components/tile-follow-up-input.compact-mode.test.ts`.
- Result: blocked by missing installed workspace deps during `pretest` (`tsup: command not found`, `node_modules missing`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm the draft-summary row feels clear enough with long text plus image attachments in narrow compare/grid states.
- If real use shows attachment-bearing drafts need a slightly stronger unsent cue, the next local tweak should prefer copy/badge tuning before adding any new persistent tile controls.
- The broader compact-tile density interplay among header chrome, transcript preview, and combined sidebar + floating-panel pressure still deserves a true end-to-end renderer pass.

## Iteration 2026-03-08 — keep panel recovery reachable while the settled resize hint is still visible

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`

### Repro steps
1. Open the floating panel while the desktop sessions page is using Compare or Grid.
2. Resize the panel wider until the existing tile-impact hint appears and release the pointer or finish a keyboard width nudge.
3. Before this change, notice that the settled hint stays visible briefly, but the persistent `Reset panel` recovery chip does not return until the hint fully times out.
4. Try to immediately undo an oversized width and compare that experience with having both the settled hint and the recovery action available together.

### UX problems found
- The previous iteration improved continuity by keeping the settled width-impact hint visible after resize end, but it still delayed the actual `Reset panel` recovery affordance until the hint disappeared.
- That created a small but real handoff gap: the UI explained that tiled sessions were crowded, yet the quickest recovery action was temporarily withheld.
- Because the same `activeResizePosition` state powered both live resize feedback and the short settled-hint window, the UI treated “gesture still in progress” and “gesture finished but hint still visible” as the same state.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose this local follow-up instead of reopening broader tile-density work.
- I made one quick live-inspection attempt before editing, but this workflow still has no inspectable Electron renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).
- Code inspection showed `showPersistentPanelRecovery` was gated on `activeResizePosition === null`, which meant the recovery chip stayed hidden during the settled-hint timeout even after the resize interaction had already ended.

### Assumptions
- Once a width resize has settled, it is better UX to restore the persistent `Reset panel` action immediately rather than waiting for the explanatory hint to disappear.
- Showing the recovery chip together with the settled hint is acceptable if the chip shifts down slightly so the two surfaces do not compete for the same top-edge space.
- This should stay a local panel-resize handoff fix rather than introducing a brand-new CTA inside the hint itself.

### Decision and rationale
- Chosen fix: split “resize gesture is still active” from “width-impact hint is still visible,” and allow the existing `Reset panel` chip to reappear as soon as the gesture ends.
- Also update the settled-hint instruction copy so it explicitly points to `Reset panel` when that recovery action is available, and nudge the chip lower while the hint is still present.
- Why this is better than the obvious alternatives:
  - better than waiting for the hint timeout because the user can recover immediately after oversizing the panel;
  - better than removing the settled hint because the user still gets the short explanatory confirmation from the previous iteration;
  - better than adding a new inline reset button inside the hint because it reuses the existing persistent recovery affordance with only a small local adjustment.

### Code changes
- Added `isResizeGestureActive` state in `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`.
- Marked pointer resize start as an active gesture, and clear that state when resize commit/reset work begins.
- Updated `showPersistentPanelRecovery` to depend on `!isResizeGestureActive` instead of `activeResizePosition === null`, so the recovery chip can coexist with the settled hint.
- Updated the settled-hint reset copy to reference `Reset panel` when the recovery chip is available.
- Shifted the recovery chip from `top-1` to `top-14` while the settled hint is visible so the two overlays do not collide.
- Extended `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new gesture-state gating, copy, and temporary position shift.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node` source-assertion script passed for the new resize-gesture state, recovery gating, settled-hint copy, and temporary `top-14` handoff positioning.
- Attempted targeted test execution: `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`.
- Result: still blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this handoff should get a quick live pass to confirm the temporary `top-14` recovery-chip offset feels balanced on narrower panel widths.
- If real usage still feels slightly busy during the settle window, the next tweak should tune copy/placement timing rather than adding more panel chrome.
- The broader compact-tile density interplay among header chrome, transcript preview, and combined sidebar + floating-panel pressure still deserves a true end-to-end renderer pass.

## Iteration 2026-03-08 — keep responsive stacked tiles from inheriting viewport-tall compare heights

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` with at least two visible sessions.
2. Narrow the available sessions width until the layout falls back to the responsive single-column presentation (`Stacked to fit`).
3. Before this change, notice that the width correctly behaves like a one-column stack, but each tile can still keep the old full-height Compare footprint.
4. Compare that result with what the user is trying to do in a stacked workflow: scan more than one session at once without each tile becoming almost a full screen tall.

### UX problems found
- The recent stacked-width improvements made the column fit correctly, but height still followed the old multi-column baseline.
- In `Compare`, that baseline is effectively viewport height, so responsive stacking could create a column of oversized tiles with too much empty vertical space.
- The mismatch made `Stacked to fit` feel only half-finished: the layout said “single column to fit,” but the tile density still behaved like the old two-column model.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh stacked-height / density follow-up instead of another panel-hint or compact-composer pass.
- Code inspection showed the issue was local to `SessionTileWrapper`: width already had a responsive stacked path, but height still reset/recovered against `layoutHeight`, which is full-height in `Compare`.
- I did not re-run live Electron inspection for this pass because repeated attempts in this workflow still do not expose an inspectable desktop renderer target, so this iteration relied on code inspection plus targeted verification.

### Assumptions
- When width pressure temporarily collapses Compare/Grid into one column, a denser half-height default is better than preserving the old full-height Compare baseline.
- Preserving the pre-stacked taller height is still valuable once the layout widens again, as long as the user did not intentionally resize height while stacked.
- In stacked mode, height reset affordances should target the stacked baseline rather than the old multi-column full-height baseline.

### Decision and rationale
- Chosen fix: add a dedicated responsive-stacked height baseline, temporarily clamp overly tall auto-heights down to that baseline when width pressure first stacks the layout, and restore the earlier taller height when stacking clears if the user left the stacked height unchanged.
- Also route height reset behavior through the stacked baseline while responsive stacking is active.
- Why this is better than the obvious alternatives:
  - better than leaving Compare tiles viewport-tall in stacked mode because the user can actually scan multiple sessions without excessive scrolling and whitespace;
  - better than permanently overwriting remembered multi-column heights because widening the layout can still return the user to their earlier taller footprint;
  - better than adding another explanatory badge because this was a behavior mismatch, not a discoverability problem.

### Code changes
- Added `calculateResponsiveStackedTileHeight(...)` in `apps/desktop/src/renderer/src/components/session-grid.tsx`.
- Added `responsiveStackedLayoutHeight` / `effectiveTileLayoutHeight` wiring in `SessionTileWrapper` so reset/default/recovery paths use a stacked-specific height baseline while the layout is temporarily single-column.
- Added `responsiveStackedAutoHeightRef` plus a layout-transition effect so overly tall auto-heights are reduced on entry to stacked mode and restored on exit only when the user did not manually change the stacked height.
- Updated keyboard and pointer height-reset paths to reset against the stacked baseline while responsive stacking is active.
- Extended `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with direct coverage for the new stacked-height helper.
- Extended `apps/desktop/src/renderer/src/components/session-grid.single-view-preservation.test.ts` with focused source assertions covering the temporary stacked-height clamp/restore behavior.

### Verification
- `git diff --check` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new stacked-height helper, stacked baseline wiring, auto-height preservation ref, and stacked reset paths.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-behavior.test.ts src/renderer/src/components/session-grid.single-view-preservation.test.ts`.
- Result: blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted targeted typecheck: `pnpm --filter @dotagents/desktop typecheck`.
- Result: blocked in this worktree because installed workspace dependencies / toolchain types are missing (`node_modules missing`, `Cannot find type definition file for 'electron-vite/node'`, `Cannot find type definition file for 'vitest/globals'`, and missing `@electron-toolkit/tsconfig/tsconfig.node.json`).

### Still needs attention
- Once the desktop renderer is inspectable here, this needs a live pass specifically in narrow `Compare` + wide-sidebar / wide-floating-panel combinations to confirm the new stacked default feels dense without feeling cramped.
- If real use shows users still want a slightly taller default in stacked mode, the next local tweak should tune that baseline rather than reintroducing full-height Compare tiles.
- The broader compact-tile density interplay among header chrome, transcript preview, and combined sidebar + floating-panel pressure still deserves a true end-to-end renderer pass.

## Iteration 2026-03-08 — keep tile size feedback visible briefly after pointer resizing ends

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`

### Repro steps
1. Open the desktop sessions page in a tiled layout such as `Compare` or `Grid`.
2. Drag a tile edge or corner resize handle until the temporary size pill appears.
3. Release the pointer after landing on the size you want.
4. Notice that, before this change, the size pill disappeared immediately on mouse-up, so the final size and nearby reset hint vanished at the exact moment the interaction ended.

### UX problems found
- Pointer resizing already had a useful in-drag size pill, but the feedback dropped out instantly when the drag ended.
- That made the result feel less settled than keyboard resizing, which already keeps feedback visible briefly after a nudge or reset.
- It also hid the local `Double-click reset` reminder right when a user might want to undo an overshoot.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh tile-resize continuity gap instead of another panel or reorder iteration.
- `session-grid.tsx` already had drag-time resize feedback plus transient keyboard resize feedback, so the cleanest fix was to extend the existing tile size pill instead of adding new chrome.
- `useResizable.ts` already passes the final pointer size through `onResizeEnd`, which made this a local renderer change without needing a broader hook refactor.
- I attempted a quick live Electron probe before editing, but this workflow still does not expose an inspectable renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).

### Assumptions
- A brief post-resize size pill is a better continuity aid than a permanent tile size badge because it helps at the moment of change without adding ongoing visual noise.
- The post-resize pill should only appear when the active resize handle actually changed its relevant dimension, so simple clicks or double-click resets do not flash redundant feedback.
- Reusing the existing size-pill copy is preferable to inventing new wording because the user problem is continuity, not terminology.

### Decision and rationale
- Chosen fix: keep the existing tile size pill alive briefly after pointer resizing ends, using the final landed size and the same local reset hint copy.
- Guard that feedback behind a handle-aware size-change check so it only appears after meaningful width, height, or corner resizing.
- Why this is better than the obvious alternatives:
  - better than leaving drag-only feedback because the landing state now feels intentional instead of abruptly silent;
  - better than adding a permanent tile-size badge because the cue appears only when it is useful;
  - better than a broader resize-system rewrite because the gap was local to end-of-interaction continuity.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - add `didTileResizeHandleChangeSize(...)` so pointer-resize completion can distinguish real size changes from no-op clicks,
  - track short-lived pointer resize feedback alongside the existing keyboard feedback,
  - show the final size pill briefly after pointer resize end,
  - and route pointer resize start through a small helper that captures the pre-resize dimensions and clears stale feedback.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with direct coverage for the new handle-aware size-change helper.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with source assertions covering the new post-resize feedback path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new pointer resize feedback state, handle-aware size-change guard, post-resize pill reuse, and updated tests.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-behavior.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts`.
- Result: blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm the post-resize pill lingers long enough to be helpful without feeling sticky.
- If the continuity improvement still feels too subtle in practice, the next local step should be tuning the timeout or copy before adding any persistent size chrome.
- Double-click tile-size reset still does not surface its own explicit post-action confirmation; if users miss that recovery gesture in live use, that should be a separate follow-up iteration.

## Iteration 2026-03-08 — make double-click tile reset feel confirmed and keep pointer reset baselines consistent

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with tiled sessions visible.
2. Resize a tile using a width, height, or corner handle so the local size pill / reset affordance is already familiar.
3. Double-click a resize handle to recover the default size.
4. Before this change, notice that the tile snapped back but did not get its own explicit post-action confirmation, so the gesture could feel like a silent jump instead of a successful reset.
5. In responsive stacked mode, the corner double-click reset also still referenced the older generic layout height instead of the stacked baseline used by the newer keyboard reset path.

### UX problems found
- Double-click reset reused the recovery gesture but not the post-action feedback continuity that pointer drag and keyboard reset already had.
- That made reset feel less discoverable and less trustworthy, especially if the size changed quickly and the user was looking for confirmation that the default landed.
- Pointer and keyboard reset paths had drifted slightly: keyboard reset already used `effectiveTileLayoutHeight`, while pointer double-click reset still passed the older raw `layoutHeight` value.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose the exact open follow-up from the prior iteration instead of starting a broader new tiling area.
- The gap was local to `SessionTileWrapper` in `session-grid.tsx`, so the smallest effective fix was to extend the existing transient size-pill system rather than adding new tile chrome.
- I did not re-attempt live Electron inspection for this pass because the current workflow has repeatedly lacked an inspectable desktop renderer target, and this change stayed inside an already well-covered local resize path.
- I also checked for adjacent mobile impact and did not find an equivalent tiled desktop resize-handle surface that needed a parallel change.

### Assumptions
- A short-lived reset-specific size pill is better than adding a permanent reset badge because the user only needs confirmation at the moment the reset lands.
- Reset feedback should explicitly say `reset` even in compact-mode copy; otherwise narrow tiles would still hide the meaning of the gesture.
- Pointer reset should share the same effective height baseline as keyboard reset while responsive stacking is active, because users should not get different recovery results from two equivalent reset gestures.

### Decision and rationale
- Chosen fix: route pointer double-click reset through a small shared helper that (a) computes the correct reset baseline, (b) shows a short-lived reset-specific size pill, and (c) preserves the existing local handle gesture.
- Also update reset feedback copy so pointer and keyboard reset labels are explicit in both regular and compact layouts.
- Why this is better than the obvious alternatives:
  - better than leaving double-click reset silent because recovery now feels acknowledged instead of abrupt;
  - better than adding another persistent control because the confirmation appears only when relevant;
  - better than keeping separate pointer vs keyboard reset baselines because equivalent reset gestures should not produce subtly different height outcomes.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - extend `getTileResizeFeedbackLabel(...)` with reset-specific copy,
  - reuse that explicit reset copy from `getTileResizeKeyboardFeedbackLabel(...)`,
  - add `handlePointerResizeReset(...)` so double-click resets now clear stale keyboard feedback, compute the effective reset size, and show a short-lived reset confirmation pill,
  - route width, height, and corner `onDoubleClick` handlers through that shared helper,
  - and align pointer reset sizing with `effectiveTileLayoutHeight` so stacked-mode reset behavior matches the keyboard path.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with direct expectations for the new reset-specific feedback copy.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with source assertions covering the shared pointer reset helper, reset-pill reuse, and effective stacked baseline wiring.

### Verification
- `git diff --check` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the reset-specific feedback copy, shared pointer reset helper, `effectiveTileLayoutHeight` reset baseline, and updated tests.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/session-grid.resize-behavior.test.ts src/renderer/src/components/session-grid.resize-affordance.test.ts`.
- Result: still blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm the reset pill feels noticeable enough without overstaying after repeated double-click resets.
- If live use still makes reset feel easy to miss on very narrow tiles, the next local tweak should adjust compact reset copy or timeout before adding new controls.
- The broader compact-tile density and panel/tiling interplay noted above still deserve a true end-to-end renderer pass once local desktop inspection is available.

## Iteration 2026-03-08 — reduce compact tile transcript depth when tiles are already narrow

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid`.
2. Narrow the working area with a wider sidebar, a wider floating panel, or a smaller window until tiles cross the compact-width breakpoint.
3. Leave a session unfocused so it stays in compact tile mode with the transcript preview visible.
4. Before this change, notice that compact tiles still previewed up to six transcript items even in the narrow breakpoint, which made the tile feel taller and busier exactly when space was most constrained.

### UX problems found
- Narrow compact tiles kept the same transcript preview depth as roomier tiles, so transcript chrome could dominate the tile under width pressure.
- That reduced scanability in dense tiled states because the preview consumed vertical space that could otherwise preserve footer metadata, summary access, and clearer tile-to-tile comparison.
- The issue was not lack of controls; it was that the compact tile mode did not get meaningfully more compact once the tile actually became narrow.

### Investigation notes
- I reviewed the latest ledger first and deliberately switched to the open compact-density follow-up rather than another resize or panel-affordance pass.
- `agent-progress.tsx` already had a compact-width signal (`isCompactTileChrome`) and a centralized transcript preview slicing path, so the smallest effective fix was to reduce the preview budget only at that narrow breakpoint.
- I did not re-run live Electron inspection for this pass because the current workflow still does not expose an inspectable renderer target, and the change stayed local to a narrow source path with direct source-assertion coverage.

### Assumptions
- Showing fewer transcript preview items in already-narrow tiles is acceptable because compact tiles are primarily for scanning status, not reading long history inline.
- The wider compact state should keep the existing six-item preview so this iteration only changes behavior when the tile has clearly crossed into tighter space.
- Keeping active/current-state items prioritized over older history remains the right hierarchy, so the change should reduce the overall preview budget without undoing the existing live-vs-recent separation.

### Decision and rationale
- Chosen fix: lower the transcript preview budget from six items to four items when a non-focused tile is already in the narrow compact-width mode.
- Reuse the existing compact-width breakpoint and transcript slicing path instead of introducing a new responsive abstraction.
- Why this is better than the obvious alternatives:
  - better than leaving the six-item preview everywhere because narrow tiles now actually become less visually dense when space gets tight;
  - better than removing the preview entirely because the tile still keeps enough recent context to remain informative;
  - better than a broader tile-layout refactor because the problem was a local density mismatch with an existing responsive signal already available.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - add `COMPACT_TILE_TRANSCRIPT_PREVIEW_ITEMS = 4`,
  - derive `tileTranscriptPreviewItemLimit` from `isCompactTileChrome`,
  - use that narrower limit when slicing compact transcript preview items,
  - and use the same limit when budgeting how much recent-history content remains after current-state items are shown.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with focused source assertions covering the new compact transcript preview limit wiring.

### Verification
- `git diff --check` passed.
- A dependency-light `node` source-assertion script passed for the new compact preview constant, limit derivation, transcript slicing, and updated source-assertion test.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`.
- Result: blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).
- Attempted targeted typecheck: `pnpm --filter @dotagents/desktop exec tsc --noEmit -p tsconfig.web.json --composite false`.
- Result: blocked in this worktree because the inherited Electron Toolkit TS config is unavailable locally (`@electron-toolkit/tsconfig/tsconfig.web.json` not found).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass in narrow `Compare` / `Grid` states to confirm four preview items is the right compact budget and does not feel too aggressive.
- If narrow tiles still feel too busy after this change, the next local follow-up should tune compact transcript chrome around hidden-history messaging or current-state item count before changing layout structure.
- The broader end-to-end interplay among compact tile header actions, transcript density, sidebar pressure, and floating-panel width still deserves a real renderer pass once local desktop inspection is available.

## Iteration 2026-03-08 — make collapsed tiles read as collapsed and easy to reopen

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with multiple visible tiles.
2. Collapse a tile from its header chevron.
3. Scan the resulting collapsed tile without hovering.
4. Before this change, notice that the tile mostly looked like a shortened header row with an icon-only chevron, so the current state (`collapsed`) and the recovery action (`expand`) were easy to miss.

### UX problems found
- The collapse toggle still used generic `panel` wording in its title even though this surface is a session tile.
- Once collapsed, the header did not explicitly say that the tile was collapsed or that clicking the header would expand it again.
- In dense tiled layouts, that made collapsed tiles slightly ambiguous during scanning: users had to infer state from the reduced height and a small chevron icon.

### Investigation notes
- I reviewed the latest ledger first and intentionally picked a tile-header clarity gap that had not been covered in the most recent resize, panel, or transcript-density passes.
- A live Electron inspection attempt was made before editing, but it remains blocked in this workflow because there is no inspectable desktop renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag`).
- `agent-progress.tsx` already owned the tile header copy and collapse control, so this was a good candidate for a small local fix without touching session state or layout mechanics.

### Assumptions
- Showing a visible `Expand` label only while the tile is collapsed is worth the small amount of extra header width because recovery is the key action in that state.
- A lightweight `Collapsed` pill plus a short hint is preferable to adding another persistent control, because the problem is state clarity rather than missing capability.
- Keeping the expanded-state collapse control icon-only is acceptable because the ambiguity is much lower before the tile body is hidden.

### Decision and rationale
- Chosen fix: keep the existing collapse interaction, but make the collapsed state self-explanatory by adding a visible `Collapsed` cue, a short `Click header to expand` hint on wider tiles, and a visible `Expand` label on the toggle button when collapsed.
- Also correct the toggle metadata from `panel` wording to `tile` wording and expose `aria-expanded` on the button.
- Why this is better than the obvious alternatives:
  - better than leaving the old icon-only collapsed state because users can now understand both state and recovery path at a glance;
  - better than adding a separate expand banner or footer row because the change stays inside the existing header chrome;
  - better than a broader header refactor because this was a local copy/affordance issue, not a layout-system problem.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - add `collapseTileActionLabel`, `collapseTileButtonVisibleLabel`, and `collapsedTileHintLabel`,
  - show a compact `Collapsed` pill in the tile header metadata row while collapsed,
  - show `Click header to expand` on wider collapsed tiles,
  - render the collapse button as `Expand` + chevron on wider collapsed tiles,
  - and use `Expand tile` / `Collapse tile` metadata plus `aria-expanded` on the toggle.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with focused source assertions covering the new collapsed-state copy and button wiring.

### Verification
- Live inspection attempt result: blocked because the Electron renderer is not inspectable in this workflow (`--inspect` target unavailable).
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new collapsed-tile labels, hint copy, visible `Expand` button state, and accessibility metadata.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`.
- Result: still blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this change should get a quick live pass to confirm the collapsed hint does not crowd narrower tile headers and that the visible `Expand` label feels proportionate.
- If collapsed tiles still read as too visually neutral in practice, the next local follow-up should tune header background/contrast before adding any more text or controls.
- The broader compact-tile organization work still has open opportunities around how header actions, transcript preview depth, and footer density balance each other under sidebar or floating-panel width pressure.

## Iteration 2026-03-08 — keep focused tiles anchored on the latest transcript after compact preview

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple tiles so at least one session is in compact, non-focused tile mode.
2. Let that tile show the compact transcript preview (latest activity only).
3. Focus or expand the tile to reveal the full transcript.
4. Before this change, the shared transcript scroller kept whatever old scroll offset it already had, so the tile could open into an arbitrary earlier part of history instead of the latest context that the compact preview was showing.

### UX problems found
- Compact tile preview intentionally emphasizes recent activity, but the transition into full transcript mode did not preserve that mental model.
- Because the same scroll container is reused, focusing or expanding a tile could reveal stale history instead of the latest/live region.
- That made the `compact preview → full transcript` transition feel discontinuous and harder to predict, especially in dense tiled workflows where users are quickly promoting one tile into attention.

### Investigation notes
- I specifically avoided another header/resize/panel pass and looked for a continuity issue inside the tile body that had not been covered recently.
- Code inspection showed no effect that reacts to `tile compact mode -> focused/expanded mode` by re-anchoring the transcript scroll position.
- The existing auto-scroll system already treats the latest transcript position as the primary steady state, so this was a good fit for a small local continuity fix instead of a new scroll model.

### Assumptions
- When users promote a compact tile into focused or expanded mode, they are usually trying to continue from the latest activity they were just previewing, not jump into older history.
- Snapping to the latest transcript context is a better default than preserving an incidental stale scroll offset from a previous viewing mode.
- Resetting the tile back into auto-scroll state on this transition is acceptable because this is a mode change, not an in-place scroll adjustment inside an already-focused transcript.

### Decision and rationale
- Chosen fix: detect when a tile leaves compact transcript mode and becomes focused or expanded, then immediately re-anchor the shared transcript scroller to the bottom/latest position and restore auto-scroll state.
- Why this is better than obvious alternatives:
  - better than preserving the old scroll offset because compact preview already frames the user around recent activity;
  - better than jumping to the top of history because that would be even less consistent with the compact preview;
  - better than a more complex scroll-position cache because the issue is transition predictability, not lack of scroll persistence infrastructure.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - detect `isCompactTileTranscriptMode`,
  - track whether the tile was previously in compact transcript mode,
  - and when the tile becomes focused or expanded, clear pending initial scroll attempts, re-pin the transcript scroller to `scrollHeight`, and restore auto-scroll / non-user-scrolling state.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with focused source assertions covering the new compact-preview transition logic.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the compact-preview transition detection and transcript re-anchoring logic.
- Attempted targeted test execution: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`.
- Result: still blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm the transition feels correct for both `focus tile` and `Single view` promotion paths, especially during active streaming.
- If users later need scroll restoration back to an earlier manual reading position, that should be treated as a separate behavior with explicit rationale; it should not silently replace the new compact-preview continuity default.
- The next tiling pass should likely move back to session-grid / sessions-level behavior rather than staying inside `agent-progress.tsx` again, to keep improvements spread across organization, resizing, and layout-state transitions.

## Iteration 2026-03-08 — make collapsed tiles stand out at the grid level without adding more controls

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.collapsed-affordance.test.ts`

### Repro steps
1. Open the desktop sessions page with several visible tiles in `Compare` or `Grid`.
2. Collapse one or more tiles so the tile body is hidden and only the condensed header remains.
3. Scan the grid quickly for which tiles are intentionally collapsed vs simply less active.
4. Before this change, the header copy was better than before, but the tile wrapper still looked almost identical to a normal tile at rest, so collapsed state remained slightly easy to miss during dense scanning.

### UX problems found
- `AgentProgress` already labels collapsed tiles clearly inside the header, but `SessionTileWrapper` was not using `isCollapsed` for any wrapper-level visual treatment beyond `height: auto` and hiding resize handles.
- In tiled workflows with multiple similar headers visible, collapsed tiles still read too neutrally from the grid level.
- That weakened reopen/discovery because users had to parse header text to confirm state instead of getting a quick container-level cue.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a session-grid-level follow-up, matching the previous note to move back out of `agent-progress.tsx`.
- Code inspection confirmed the gap was highly local: `session-grid.tsx` already handled stronger transient tile states like drag targets, newly added sessions, and restored-from-Single-view emphasis, but had no analogous low-emphasis styling for collapsed state.
- I did not attempt another live Electron inspection before editing because this workflow still does not expose an inspectable desktop renderer target, and repeated prior probes have not produced one.

### Assumptions
- A subtle wrapper-level cue is preferable to more header text because the problem is fast visual scanning, not missing wording.
- Collapsed emphasis should remain weaker than drag-target, restored-tile, or new-session states so the highest-priority transient feedback still wins.
- A dashed outline / soft tint is acceptable here because collapsed state is intentionally lower-energy than active or selected states.

### Decision and rationale
- Chosen fix: add a dedicated `showCollapsedTileHighlight` path in `SessionTileWrapper` that applies a subtle ring/shadow plus dashed overlay only when a tile is collapsed and not already showing a stronger transient state.
- Why this is better than obvious alternatives:
  - better than adding more collapsed copy because scanning state should not rely on reading more text;
  - better than reworking `agent-progress.tsx` header chrome again because the open gap was specifically at the grid/container level;
  - better than using a strong accent color because collapsed state should be visible but calm, not compete with active/reorder/recovery signals.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - derive `showCollapsedTileHighlight` from `isCollapsed` while explicitly yielding to drag-target, restored-tile, and new-session emphasis;
  - add a subtle slate ring/shadow treatment on the tile wrapper while collapsed;
  - expose `data-session-tile-collapsed` for testability; and
  - render a dashed overlay so collapsed state reads intentionally compact at a glance.
- Added `apps/desktop/src/renderer/src/components/session-grid.collapsed-affordance.test.ts` with focused source assertions for the new collapsed-state treatment.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.collapsed-affordance.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new collapsed highlight guard, wrapper data marker, dashed overlay, and the focused regression test.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm the new collapsed wrapper cue is noticeable enough in dense grids without feeling over-styled.
- If collapsed tiles still feel too neutral after live inspection, the next local follow-up should tune the `AgentProgress` tile header contrast/background rather than add more labels or controls.
- A future sessions-level pass should keep looking at broader organization behavior under sidebar and floating-panel width pressure so compact state cues stay coherent across all tiled layouts.

## Iteration 2026-03-08 — keep keyboard-reordered tiles anchored in view

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with enough active tiles in `Compare` or `Grid` that the tiled area requires some scanning or scrolling.
2. Focus a tile's reorder grip with the keyboard.
3. Press an arrow key to move that session earlier or later in the tiled order.
4. Before this change, the header announced the new position, but the moved tile itself could drift toward or beyond the viewport edge, leaving keyboard users to reacquire it manually.

### UX problems found
- Recent reorder work improved discoverability and post-action confirmation, but keyboard reordering still lacked spatial continuity inside longer/dense tile lists.
- The interaction could feel slightly disorienting because the reordered session moved in the layout without being re-anchored in view.
- That made keyboard reorder less trustworthy than maximize/restore flows, which already reuse `scrollSessionTileIntoView(...)` to preserve orientation during bigger layout transitions.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a fresh sessions-level organization follow-up instead of another panel, resize, or tile-body density pass.
- A quick live Electron probe was attempted before editing, but the renderer is still not inspectable in this workflow (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).
- Code inspection showed `handleKeyboardReorder(...)` already owned the successful keyboard-move path, while `scrollSessionTileIntoView(...)` already provided a local requestAnimationFrame-based recentering helper used by other session-navigation transitions.

### Assumptions
- Re-centering after **keyboard** reorder is acceptable because keyboard users do not have a pointer anchored on the moved tile the way drag users do.
- Reusing the existing immediate `scrollSessionTileIntoView(...)` path is preferable to introducing a reorder-specific animation because the helper is already tuned to avoid delayed outer-scroll yank.
- Limiting this pass to keyboard reorder is the right local scope; drag reorder already carries direct pointer context and does not need the same automatic recentering behavior by default.

### Decision and rationale
- Chosen fix: after a successful keyboard reorder, immediately call `scrollSessionTileIntoView(sessionId)` so the moved tile stays visually anchored while the existing header confirmation chip announces the new position.
- Why this is better than the obvious alternatives:
  - better than doing nothing because keyboard users no longer have to manually hunt for the moved tile after each arrow-key reorder;
  - better than adding another badge or tooltip because the missing piece was spatial continuity, not more explanation;
  - better than applying the same behavior to drag reorder because pointer-based reordering already has a strong physical anchor and should stay less opinionated.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `handleKeyboardReorder(...)` now calls `scrollSessionTileIntoView(sessionId)` after applying a successful move and capturing reorder feedback.
- Extended `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts` with a focused source assertion for the new keyboard-reorder recentering path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new keyboard-reorder scroll call and the updated scroll-navigation regression test.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm repeated arrow-key reorders feel helpfully anchored without feeling over-eager near viewport edges.
- If live use shows drag reorder can also lose context in very tall grids, that should be handled as a separate pass with drag-specific rationale rather than broadening this keyboard-focused fix by default.
- Broader sessions-level behavior under sidebar and floating-panel width pressure still deserves future iteration so reordering, layout switching, and recovery cues stay coherent together.

## Iteration 2026-03-08 — confirm width-pressure recovery actions after reset

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/app-layout.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/package.json`

### Repro steps
1. Open the desktop sessions page with multiple active tiles in `Compare` or `Grid`.
2. Make the sessions area tight enough that the header shows `Reset sidebar`, `Reset panel`, or `Reset both`.
3. Trigger one of those recovery actions.
4. Before this change, the button could disappear immediately once width pressure eased, leaving very little explicit confirmation that the reset actually happened or which dimension had just been corrected.

### UX problems found
- The recovery action itself was clear, but the post-click state was slightly ambiguous because success often removed the button faster than the layout change could be cognitively parsed.
- This was most noticeable in compact headers where several transient cues compete and the width-pressure action is intentionally short-lived.
- The lack of a brief success confirmation made recovery feel less trustworthy than nearby reorder/new-session/single-view flows, which already use short-lived feedback chips and announcements.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a fresh width-pressure follow-up instead of repeating the recent collapsed-tile or keyboard-reorder passes.
- Code inspection showed the sessions header already had dedicated recovery actions for sidebar, panel, and combined pressure, but no matching transient confirmation state after those actions succeeded.
- I checked nearby layout/panel code to confirm the action paths already existed and were intentionally local (`resetSidebar()` and `tipcClient.resetPanelSizeForCurrentMode({})`) so the missing piece was feedback, not another control.
- A live Electron inspection was attempted again via the renderer bridge, but the app is still not inspectable in this workflow (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`), so this remained a code-driven iteration.

### Assumptions
- A brief success chip is acceptable here because the primary problem is post-action ambiguity, not missing discoverability of the reset controls themselves.
- Reusing the existing header-feedback pattern is better than inventing a new toast or persistent badge because the recovery action belongs in the same local context as reorder/new-session/session-layout feedback.
- For panel-only reset, explicitly acknowledging that the sidebar may still be wide is helpful because a panel reset does not always fully restore tiled breathing room on its own.

### Decision and rationale
- Chosen fix: add a short-lived sessions-header recovery feedback state for `sidebar`, `panel`, and `both` reset actions, with an `aria-live` announcement plus a visible confirmation chip that temporarily takes priority over lower-value transient hints.
- Why this is better than obvious alternatives:
  - better than relying on the disappearing reset button alone because users now get explicit confirmation that the action fired;
  - better than a toast because the feedback stays anchored to the tiled-layout controls it explains;
  - better than making recovery buttons stick around longer because the goal is confidence after success, not more persistent chrome in an already compact header.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - add `RecentTilePressureRecoveryFeedback` state and compact/full label helpers for sidebar, panel, and combined reset confirmation;
  - capture that feedback after successful sidebar/panel/both recovery actions;
  - announce recovery via an `aria-live` status region; and
  - render a temporary confirmation chip (`data-tile-pressure-recovery-feedback`) that suppresses lower-priority new-session feedback while active.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new recovery-feedback state, helper copy, capture paths, and rendered chip.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new recovery-feedback path and the updated layout-controls regression test.
- Attempted package-local Vitest verification via `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/pages/sessions.layout-controls.test.ts`, but the workspace currently lacks installed package tooling (`tsup` / `vitest` not found, `node_modules` missing), so full package test execution was not possible in this environment.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a live pass to confirm the new recovery chip reads as reassuring rather than redundant in compact/tight headers.
- If live use shows repeated sidebar/panel resets deserve stronger spatial confirmation than a chip, the next pass should evaluate subtle animated header/layout response rather than adding more wording.
- The broader width-pressure area still deserves future iteration around when to surface recovery affordances before layouts become near-stacked, especially across different sidebar widths and floating-panel modes.

## Iteration 2026-03-08 — keep the focused tile anchored when switching between Compare and Grid

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts`

### Repro steps
1. Open the desktop sessions page with enough active sessions that Compare or Grid requires some scanning or scrolling.
2. Focus a specific session tile so it has clear visual priority.
3. Switch between `Compare` and `Grid` from the header layout controls.
4. Before this change, the chosen layout switched correctly, but the focused tile could jump to a different position in the reflowed grid without being re-centered.

### UX problems found
- The sessions page already recenters tiles for route navigation, sidebar-driven focus changes, Single-view transitions, and keyboard reorder, but not for Compare↔Grid layout switching.
- That made non-Single layout changes feel less spatially trustworthy than adjacent transitions because the user’s current tile of interest could drift out of view or at least out of immediate context.
- The underlying layout behavior was correct, but the lack of re-anchoring made the switch feel more like a blind reflow than an intentional mode change.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh layout-switching pass instead of another width-pressure, collapsed-tile, or tile-body-density iteration.
- Code inspection showed `handleSelectTileLayout(...)` already preserves/restores layout intent correctly, while `scrollSessionTileIntoView(...)` already exists as the local continuity tool used for several other sessions-page transitions.
- There was already dedicated recentering for entering/exiting Single view, which made the missing Compare↔Grid recentering stand out as an inconsistency rather than a missing primitive.
- A live Electron inspection was still not practical in this workflow because there is no inspectable renderer target available.

### Assumptions
- If a user has an explicitly focused session tile while staying in tiled mode, that tile should remain the primary visual anchor across Compare↔Grid switches.
- It is acceptable to limit this behavior to non-Single layout changes, because Single view already has its own focus/restore anchoring path and should not be duplicated.
- Doing nothing when there is no valid focused visible session is the right fallback; layout switching should not invent a new scroll target.

### Decision and rationale
- Chosen fix: track the previous layout mode and, when the user switches between non-Single layouts and the currently focused session is still visible, immediately call `scrollSessionTileIntoView(focusedSessionId)`.
- Why this is better than the obvious alternatives:
  - better than leaving Compare↔Grid as a pure reflow because it keeps the user’s active tile anchored through a mode change that can otherwise feel disorienting;
  - better than adding another visible hint or badge because the problem was continuity, not lack of explanation;
  - better than broadening the behavior into Single view because those transitions already have dedicated restore/maximize handling and different UX goals.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - add `previousTileLayoutModeRef`, and
  - add a non-Single layout-switch effect that recenters the current `focusedSessionId` when switching between Compare and Grid, while explicitly skipping Single-view transitions and invalid focus targets.
- Extended `apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts` with focused source assertions covering the new Compare↔Grid anchoring path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.scroll-navigation.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new previous-layout tracking, non-Single guards, focused-session visibility guard, and recentering call.
- Attempted package-local test execution with `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/pages/sessions.scroll-navigation.test.ts`, but it is still blocked in this worktree because the shared/package test toolchain is not installed (`tsup: command not found`, `node_modules missing`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check to confirm repeated Compare↔Grid switching feels pleasantly anchored rather than over-eager in longer session lists.
- If live use shows layout switching also needs a short-lived visual emphasis on the anchored tile, that should be treated as a separate follow-up after confirming whether recentering alone is sufficient.
- Future sessions-level passes can keep refining how layout switching, width pressure, and reorder behavior work together under very narrow windows and wide sidebar/panel combinations.

## Iteration 2026-03-08 — keep layout controls honest until tiled width is measured

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with multiple visible sessions.
2. Watch the layout controls as the page first renders, before the grid measurement callback has reported a real width.
3. Hover the inactive layout buttons while the tiled area is either width-constrained or temporarily showing only one visible session.
4. Before this change, the current-layout copy could infer `Stacked to fit` from the initial `0px` measurement, and the inactive buttons still used generic titles even when switching would remain adaptively stacked or expanded.

### UX problems found
- The layout controls could briefly over-predict stacked state before the grid had been measured, which made the current-layout messaging less trustworthy on first paint.
- Inactive layout buttons did not preview adaptive outcomes, so switching layouts under width pressure or one-visible-session conditions stayed more trial-and-error than necessary.
- That made the control group good at selecting modes, but weaker at explaining what the selected mode would actually look like right now.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a fresh layout-controls honesty pass instead of repeating the newest anchored-tile continuity work.
- Code inspection showed `sessionGridMeasurements.containerWidth` starts at `0`, while adaptive layout messaging was already consulting responsive stacked logic before a real measurement arrived.
- The existing layout-button `title` / `aria-label` path was already the smallest local place to improve predictability without adding new visible header chrome.
- Live Electron inspection was still not practical in this workflow because there is no inspectable renderer target available.

### Assumptions
- It is better to avoid stacked-state messaging until the sessions grid has been measured than to guess from an initial zero-width placeholder.
- Reusing the existing layout button hover/accessibility copy is preferable to adding another persistent hint, because the ambiguity lives inside the control itself.
- It is acceptable to keep predicting the one-visible-session expanded state before measurement, because that behavior depends on visible session count rather than available width.

### Decision and rationale
- Chosen fix: centralize adaptive layout description logic in a helper that only reports responsive stacked state once a real grid width exists, and reuse that helper to generate contextual layout-button titles / accessible labels.
- The inactive layout buttons now preview when a switch would still be `stacked to fit at the current width` or `expanded for one visible session`.
- Why this is better than the obvious alternatives:
  - better than leaving the old eager stacked check because first-paint layout copy no longer risks lying about width pressure;
  - better than adding more persistent header text because the explanation now appears exactly on the control being considered;
  - better than introducing new layout-preview UI because this stays local, lightweight, and consistent with the existing button affordance.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `getAdaptiveTileLayoutDescription(...)` and `getTileLayoutOptionTitle(...)`.
- Gated responsive stacked descriptions behind `hasMeasuredSessionGridWidth` while keeping one-visible-session expansion truthful.
- Updated the layout button `title` and `aria-label` so inactive buttons preview stacked/expanded outcomes when relevant.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with focused source assertions covering the new adaptive-description helper, measured-width guard, and contextual layout-button copy.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light Node source-assertion script passed for the new adaptive-description helper, measured-width guard, contextual layout-button titles, and updated regression test.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/pages/sessions.scroll-navigation.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check to confirm the contextual button copy feels helpful rather than overly verbose on hover and in assistive-tech flows.
- If live use shows layout switching still needs stronger visible predictability than hover/ARIA copy provides, the next pass should consider a subtle in-control preview indicator before adding more permanent header content.
- The broader interaction between layout switching, width pressure, and reorder/drag behavior under very narrow windows still deserves a renderer-level pass in a runnable desktop environment.

## Iteration 2026-03-08 — surface width-pressure recovery before layouts are almost stacked

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- practical renderer probe via Electron inspection tooling

### Repro steps
1. Open the desktop sessions page with multiple visible sessions in `Compare` or `Grid`.
2. Keep the sessions area compact enough that the header condenses, but not so narrow that the layout has already entered the explicit `near-stacked` warning state.
3. Widen the left sidebar and/or floating panel well past their normal comfort widths.
4. Before this change, the layout could already feel dense while the header still withheld the reset actions until the layout became near-stacked or fully stacked.

### UX problems found
- Recovery actions arrived late: users could already feel tiling pressure before the header acknowledged a concrete reset path.
- That made width recovery feel reactive rather than predictive, especially on compact-but-not-yet-warning widths.
- The existing reset actions were good once shown, but the threshold for surfacing them was too close to actual stacked behavior.

### Investigation notes
- I reviewed the latest ledger first and deliberately avoided repeating the most recent layout-control honesty pass.
- Code inspection showed the sessions header already had solid stacked and near-stacked diagnostics plus reset actions, but those actions were gated strictly behind the warning states.
- I attempted a quick renderer probe before editing, but there is still no inspectable Electron renderer target in this workflow, so this iteration remained code-driven.

### Assumptions
- If the header is already compact and a width culprit is materially beyond its comfort threshold, surfacing a reset action slightly earlier is more helpful than waiting for near-stacked copy.
- It is acceptable to keep this earlier affordance out of very compact headers, because at that size the shorter labels and hidden pressure badges would make the action less self-explanatory.
- A calmer visual treatment is better than reusing the stronger amber/blue warning styling for this earlier recovery stage, because the layout is pressured but not yet close to failure.

### Decision and rationale
- Chosen fix: introduce an `early` tile-pressure recovery state in compact (but not very compact) tiled headers when the sidebar and/or panel is materially past its comfort threshold, and reuse the existing reset actions there with calmer neutral styling.
- The header still escalates to the stronger existing `near-stacked` and `stacked` affordances when width pressure becomes more urgent.
- Why this is better than the obvious alternatives:
  - better than waiting for the old near-stacked gate because the recovery path now appears while there is still room to act before the layout is almost broken;
  - better than adding another persistent hint chip because the existing reset controls already solve the problem and only needed to become available a bit sooner;
  - better than showing the earlier affordance in very compact headers because the action remains readable and justified instead of becoming another ambiguous tiny control.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - derive shared sidebar/panel/combined tile-pressure widths once,
  - add `EARLY_TILE_PRESSURE_RECOVERY_WIDTH`, `shouldOfferEarlyTilePressureRecovery`, and `tilePressureRecoveryUrgency`,
  - allow the existing combined/sidebar/panel reset actions to appear during the new `early` state when pressure is materially high,
  - reuse a calmer neutral button tone for the `early` state while preserving the stronger stacked / near-stacked styling,
  - and prioritize compact width-pressure recovery whenever any recovery urgency is active.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the early-recovery gate, urgency state, calmer styling, updated recovery data attributes, and compact-header prioritization.

### Verification
- A dependency-light Node source-assertion script passed for the new early-recovery gate, urgency state, proactive combined recovery branch, compact-header prioritization, calmer tone class, and updated regression test coverage.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still lacks package-local test tooling (`Command "vitest" not found`, `node_modules missing`).
- Attempted `pnpm --filter @dotagents/desktop typecheck`, but it is also blocked in this worktree by missing installed dependencies / shared type packages (`node_modules missing`, missing `electron-vite` / `vitest` type definitions).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live pass to confirm the earlier reset actions feel timely and helpful rather than premature across medium-width windows.
- The exact early-recovery threshold may still want tuning after live use, especially when only one surface is wide but the sessions area itself is unusually generous.
- Future tiling passes should continue checking how these earlier recovery affordances interact with drag/reorder cues and with floating-panel resizing under different sidebar widths.

## Iteration 2026-03-08 — make the dragged tile read as “moving,” not merely faded

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts`
- practical renderer probe via Electron inspection tooling

### Repro steps
1. Open the sessions page with at least two reorderable tiles in `Compare` or `Grid`.
2. Start dragging one tile by its reorder handle.
3. Compare how clearly the UI communicates both the destination tile and the tile currently being moved.
4. Before this change, the drop target was explicit, but the dragged source tile mostly just dimmed.

### UX problems found
- Recent reorder iterations made the handle and drop destination clearer, but the drag source itself still read more like a disabled tile than an actively moving one.
- In dense grids, a simple fade made it slightly harder to keep track of which tile was in flight, especially once attention shifted toward the destination.
- That imbalance meant the reorder interaction explained “where it will land” better than “what is currently being moved.”

### Investigation notes
- I reviewed the latest ledger first and intentionally chose a fresh drag-source clarity follow-up instead of another layout-pressure or header-control pass.
- I attempted a quick renderer probe before editing, but this workflow still has no inspectable Electron renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`), so the iteration stayed code-driven.
- `SessionTileWrapper` already owned both the source-tile wrapper treatment and the reorder-handle copy, which made this a small local fix without touching session-order state.

### Assumptions
- A calmer moving-state treatment is preferable to a stronger badge or overlay because the drop target should remain the highest-priority drag cue.
- Reusing the existing reorder handle label is better than adding another top-right badge because the tile already has transient resize and drop-target feedback surfaces in other states.
- It is acceptable for this pass to stay visual-only; the reorder behavior itself was already correct and recently improved for keyboard continuity.

### Decision and rationale
- Chosen fix: give the dragged source tile a subtle in-flight ring/shadow treatment and switch the visible handle copy from `Move` / `Reorder` to `Moving` while drag is active.
- Why this is better than the obvious alternatives:
  - better than leaving the old fade-only treatment because the source tile now reads as an intentional moving state instead of a generic dimmed state;
  - better than adding another dedicated drag badge because it improves clarity without competing with existing resize/drop overlays;
  - better than a broader drag-preview refactor because the missing cue was local to the tile wrapper and handle chrome.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - derive `showDraggingTileHighlight` for the dragged source tile,
  - replace the old fade-only dragging class with a calmer ring/shadow moving-state treatment,
  - expose `data-session-tile-dragging` for focused regression coverage,
  - and switch the visible reorder-handle label to `Moving` while drag is active, with a slightly more intentional active-handle tint.
- Extended `apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts` with source assertions covering the new moving-state helper, DOM marker, handle styling, and label wiring.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.drag-affordance.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new moving-state helper, dragging data attribute, active-handle `Moving` label, and updated drag-affordance regression coverage.
- Live renderer inspection remains blocked in this workflow because there is still no inspectable Electron target available.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live drag pass to confirm the calmer source highlight reads as intentional without competing with the stronger drop-target cue.
- If live use shows the source state is still too subtle in especially dense grids, the next small follow-up should tune the moving-state contrast before adding any new drag-only chrome.
- Broader end-to-end evaluation across narrow windows, wide sidebar/panel combinations, and long scrollable tile lists is still needed so reorder clarity can be judged together with width pressure and layout switching.

## Iteration 2026-03-08 — make compact tile Single-view affordances less hover-dependent

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/AGENTS.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- `apps/mobile/src/` (scope check only; no matching tile-header action surface)

### Repro steps
1. Open the desktop sessions page with enough active sessions that some tiles switch into compact header chrome.
2. Look at a compact tile that still keeps `Single view` as a direct action because there is room for it.
3. Before this change, the maximize/focus affordance could still collapse to an icon-only button, even though the header was not crowded enough to require hiding it in overflow.
4. Look at a narrower compact tile where `Single view` is moved into the overflow menu together with `Minimize session`.
5. Before this change, the trigger still read as a generic `More actions` button, so the hidden focus path was easy to miss during scanning.

### UX problems found
- The previous wide-tile pass made `Single view` readable in roomy headers, but compact direct-action states could still fall back to a hover-dependent maximize icon.
- When narrow tiles pushed `Single view` into the overflow menu, the trigger's generic ellipsis labeling did not hint that a layout/focus action was inside.
- That made tile-level maximize/focus discoverability inconsistent exactly in the denser tiled states where the action is often most useful.

### Investigation notes
- I reviewed the latest ledger first and intentionally avoided repeating the most recent layout-pressure and drag-source work.
- Code inspection showed the gap was highly local to `AgentProgress` tile-header chrome: `showExpandTileButtonLabel` only depended on `!isCompactTileChrome`, so compact tiles never showed a short visible focus label even when overflow was not needed.
- The compact overflow trigger also still used generic `More actions` copy, which concealed the presence of `Single view` when that action moved into the menu.
- I checked `apps/mobile/src/` per the renderer guidance, but there is no matching mobile tile-header action menu to update for this desktop-specific affordance change.
- Live Electron inspection is still not practical in this workflow because there is no inspectable renderer target available.

### Assumptions
- When a compact tile keeps `Single view` as a direct action, a short visible `Single` label is worth the small amount of extra width because the action is already important enough to remain outside overflow.
- When `Single view` must move into overflow, contextual trigger metadata is better than generic `More actions` wording because it improves discoverability without reintroducing a wider visible control.
- It is acceptable to keep this pass local to desktop tile chrome rather than revisiting the sessions-page Single-view header again, because the gap here was tile-level entry discoverability.

### Decision and rationale
- Chosen fix: keep the existing compact overflow behavior, but make the entry path more honest by showing a short visible `Single` label when compact tiles keep a direct expand action and by giving the overflow trigger contextual `Single view and more actions` labeling when that focus action is hidden inside the menu.
- Why this is better than the obvious alternatives:
  - better than leaving compact direct-action states icon-only because the focus affordance can now remain readable without relying on hover or tooltip discovery;
  - better than always forcing a wider visible `Single view` button because the compact path still preserves density with a shorter label;
  - better than replacing the overflow trigger with a dedicated focus button because the existing density tradeoff stays intact while the menu becomes more truthful about what it contains.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - add a compact direct-action visible label (`Single`) for tile-level `Single view` when overflow is not needed,
  - keep the wider `Single view` label on roomy tile headers,
  - and contextualize the compact overflow trigger title / ARIA label when `Single view` is hidden in the menu.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with focused source assertions for the compact direct label, the direct-action label selection logic, and the new overflow-trigger copy.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the compact `Single` label, direct-action label-selection logic, and contextual overflow-trigger metadata.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check to confirm the short compact `Single` label stays legible without crowding the surrounding collapse/close actions.
- If live use shows the compact overflow trigger still feels too generic even with better tooltip/ARIA copy, the next local pass could explore a slightly more purpose-specific visual treatment without undoing the density win.
- Future tiling iterations should continue checking how tile-level `Single view` entry, sessions-header restore/pager controls, and dense grid states work together end to end.

## Iteration 2026-03-08 — let the floating panel drag bar own the top edge

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/panel-drag-bar.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts`

### Repro steps
1. Open the floating panel with panel dragging enabled.
2. Try to grab the top area to move the panel while also keeping resize affordances visible.
3. Before this change, the panel exposed a full-width top resize rail and a top drag bar at the same time.
4. In practice, that made the top edge ambiguous: the same area was trying to serve both “move panel” and “resize from top.”

### UX problems found
- The top drag bar and the full-width top resize handle overlapped in purpose, so the panel's top edge could feel unpredictable.
- That ambiguity is especially costly in tiled workflows because users often reach for the panel quickly to reclaim or reposition space while Compare/Grid is under pressure.
- The panel already had side rails, bottom rail, and top corners for resizing, so the dedicated top-center resize rail was the least valuable resize surface in the presence of a drag bar.

### Investigation notes
- I reviewed the latest ledger first and deliberately picked a fresh floating-panel pass rather than repeating recent tile-header, drag-source, or sessions-header work.
- Code inspection showed `PanelResizeWrapper` always mounted the `position="top"` resize handle, while `panel.tsx` also rendered `PanelDragBar` whenever `isDragEnabled` was true.
- I made one quick live Electron inspection attempt before finishing the ledger update, but this workflow still has no inspectable renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).

### Assumptions
- When the floating panel has an explicit top drag bar, moving the panel is a higher-value use of the top-center zone than pure top-edge resizing.
- Keeping the top-left and top-right corners, plus the left/right and bottom rails, is sufficient resize coverage for this local fix.
- It is acceptable to solve the ambiguity by removing the conflicting top rail rather than inventing a more complex split-zone or offset-handle system.

### Decision and rationale
- Chosen fix: add an opt-in `disableTopEdgeResize` path to `PanelResizeWrapper` and enable it from `panel.tsx` whenever the panel drag bar is active.
- Why this is better than the obvious alternatives:
  - better than leaving the overlap because the top edge now has a single dominant meaning during normal panel dragging;
  - better than removing all top-edge resizing because the top corners still support upward resizing when needed;
  - better than a broader geometry refactor because this resolves the main ambiguity with a very small, local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to accept `disableTopEdgeResize?: boolean` and skip rendering the `top` resize handle when that flag is true.
- Updated `apps/desktop/src/renderer/src/pages/panel.tsx` to pass `disableTopEdgeResize={isDragEnabled}` so the top drag bar owns the center top edge whenever dragging is enabled.
- Extended `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new prop and conditional top-handle rendering.
- Extended `apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts` with a focused assertion that the drag-enabled panel now disables the competing top-edge resize rail.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/pages/panel.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts apps/desktop/src/renderer/src/pages/panel.recording-layout.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new `disableTopEdgeResize` prop, the conditional top handle, and the `panel.tsx` wiring.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts src/renderer/src/pages/panel.recording-layout.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because no inspectable Electron target is currently available.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check to confirm the drag bar now feels more trustworthy without making top-edge resize feel unexpectedly absent.
- If live use shows some users still look for a top-center resize affordance, the next local pass should consider a subtler visual cue near the corners rather than reintroducing a full-width competing rail.
- Future panel/tile iterations should continue checking how panel movement, panel resizing, and sessions-header width-pressure recovery feel together when the sidebar is also wide.

## Iteration 2026-03-08 — keep hidden newcomers legible in compact Single-view pager controls

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with multiple active sessions.
2. Enter `Single view` on one session.
3. Let one or more new sessions arrive while the header is in a compact width where pager labels collapse.
4. Scan the pager controls and try to notice that a special action exists for the newest hidden newcomer.

### UX problems found
- The `jump to newest hidden session` control already existed, but on compact headers it collapsed to an icon-only blue button.
- That made the newcomer-specific action easy to miss exactly when the header was already under width pressure and the separate newcomer chip was intentionally suppressed.
- The result was an affordance that remained technically available but lost most of its explanatory value in the dense state where it mattered most.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh `Single view` header pass rather than repeating the most recent floating-panel drag/resize work.
- Code inspection showed the jump action always reused the pager button sizing logic, so `showSingleViewPagerLabels === false` reduced it to icon-only chrome.
- I made one quick live Electron inspection attempt before finalizing this pass, but the workflow still has no inspectable renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).

### Assumptions
- Reusing the existing hidden-new-session label vocabulary (`New`, `1 new`, `2 new`) inside the existing jump button is preferable to adding another standalone header chip.
- A tiny inline badge is acceptable extra chrome in compact Single view because the action only appears when there are hidden newcomers waiting.
- Keeping the full `Newest` label on roomy headers remains the right default, because the compact-state problem is specifically about the icon-only collapse.

### Decision and rationale
- Chosen fix: when Single-view pager labels are collapsed, keep the `jump to newest hidden session` action legible by adding a small inline newcomer badge inside the existing button.
- On compact headers the action now stays visible as an icon plus `New` / `1 new` / `2 new`, while wider headers keep the simpler `Newest` label.
- Why this is better than the obvious alternatives:
  - better than leaving the control icon-only because the newcomer purpose stays legible without relying on hover;
  - better than adding another separate chip because it keeps the signal attached to the action it describes;
  - better than always expanding full pager labels because it preserves the compact-header density improvements from earlier iterations.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the compact `jump to newest hidden session` button can render a small newcomer badge when pager labels are hidden.
- Reused `getSingleViewNewSessionBadgeLabel(...)` so the badge follows the existing `New` / `1 new` / `2 new` wording pattern.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with targeted source assertions for the compact newcomer-badge logic and rendering.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new compact newcomer-badge wiring in `sessions.tsx`.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not running with an inspectable target.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check to confirm the compact newcomer badge still leaves enough room for `Back`, pager, and layout controls together.
- If the compact newcomer action still feels too subtle in practice, a later pass could test slightly stronger grouping between the pager cluster and the newcomer jump without adding another persistent chip.
- Future tiled-session iterations should continue checking the end-to-end relationship between tile-level `Single view` entry, compact Single-view header controls, and dense multi-session recovery flows.

## Iteration 2026-03-08 — keep compact Single-view restore buttons stable by dropping the duplicate hidden badge

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the sessions page with multiple active sessions and enter `Single view`.
2. Narrow the sessions area until the header is compact.
3. Compare the `Back` restore control before and after hidden sessions or hidden newcomers accumulate.
4. Watch how much width the restore button consumes relative to the pager and layout selector.

### UX problems found
- The compact `Single view` restore button still appended a separate hidden-session badge even after the newest-hidden pager action became legible on compact headers.
- That made the restore control wider and less stable exactly where the right-side header cluster was already most space-constrained.
- In compact `Single view`, the extra restore badge had become mostly duplicate context because the position chip tooltip and restore button title already described hidden sessions, while hidden newcomers now also had their own pager action.

### Investigation notes
- I reviewed the ledger first and chose this as a narrow follow-up to the latest compact newcomer pass because that change made the restore badge redundancy much clearer in code.
- Code inspection showed the restore badge only existed in compact/very-compact `Single view` states where the header was already intentionally minimizing lower-priority chrome.
- I made a quick live Electron inspection attempt before editing, but this workflow still has no inspectable renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).

### Assumptions
- In compact `Single view`, a stable and smaller `Back` affordance is more valuable than repeating hidden-session counts as a second inline pill.
- It is acceptable to keep the richer restoration context in tooltip and accessibility copy rather than on the compact button face.
- Hidden newcomers remain sufficiently discoverable without the restore badge because the dedicated `jump to newest hidden session` action now stays legible in compact headers.

### Decision and rationale
- Chosen fix: remove the compact restore-button hidden badge path and explicitly condense the compact restore button to a stable `Back` label.
- The restore control now keeps a smaller, steadier footprint while preserving the richer `Return to … and show … hidden sessions` description in title and ARIA metadata.
- Why this is better than the obvious alternatives:
  - better than leaving the old badge because it removes duplicate chrome from the tightest header state;
  - better than moving the hidden count into the visible label because the restore button stays compact and predictable as hidden-session counts change;
  - better than a broader header refactor because it improves a specific crowded control with a very local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `shouldCondenseSingleViewRestoreButton` for compact `Single view`.
- Removed the old `showRestoreHiddenSessionBadge` / `restoreHiddenSessionBadgeLabel` path.
- Kept the restore button on a condensed `Back` label for compact headers while preserving the richer restore tooltip/ARIA copy.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new compact restore-button condensing and explicit absence of the old badge path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new compact restore-button condensing logic and the removal of the old badge path.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not running with an inspectable target.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check around the compact breakpoint to confirm the smaller `Back` button improves stability without feeling too generic.
- If compact `Single view` still feels crowded in practice, the next local pass should probably tune pager/button padding before hiding more context.
- Future tiling iterations should keep checking how compact `Single view`, newcomer actions, and restore-to-grid flows feel together across different sidebar and panel widths.

## Iteration 2026-03-08 — make compact summary cards reveal decisions and next steps before expansion

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple active sessions so at least one session remains a non-focused compact tile.
2. Switch that tile to the `Summary` tab after the agent has produced a few step summaries.
3. Keep the summary cards collapsed and quickly scan them without focusing the tile.
4. Compare cards that contain decisions or next steps with cards that only contain findings.

### UX problems found
- Compact collapsed summary cards only surfaced `N key findings` and showed nothing at all when a summary mainly contained decisions or next steps.
- That made narrow summary tiles harder to scan because actionable cards could look almost identical to less important cards until expanded.
- The result was avoidable ambiguity inside a dense tiled state where summary mode should help users triage progress quickly.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh compact-summary pass instead of another `Single view` header tweak.
- `agent-progress.tsx` already scopes non-focused tile summaries through `compact={shouldUseCompactTileSummaryView}`, so the UX gap was local to `AgentSummaryView` rather than the tile shell.
- I had already attempted a live Electron inspection earlier in this iteration, but the workflow still has no inspectable renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).

### Assumptions
- In compact tiled summaries, a single concise metadata line is worth more than keeping the old findings-only preview, because scanability matters more than perfect detail.
- Non-compact summary views should keep their existing behavior, since the density problem is specific to narrow tiled contexts.
- A line-clamped metadata preview with tooltip fallback is an acceptable tradeoff for this local pass because it improves triage without expanding card height materially.

### Decision and rationale
- Chosen fix: add a compact-only collapsed metadata preview that can surface findings, decisions, and `Next steps` before the user expands a summary card.
- Why this is better than the obvious alternatives:
  - better than the old findings-only preview because cards with decisions or next steps no longer disappear into generic summary chrome;
  - better than adding extra badges or another row of controls because it improves scanability without making compact cards busier;
  - better than changing the full-size summary layout because the issue was local to narrow tiled cards.

### Code changes
- Added `getCompactCollapsedSummaryMetaLabel(...)` in `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`.
- Updated compact collapsed summary cards to show a single-line metadata preview assembled from findings, decisions, and next-step presence, with the full text available via `title`.
- Kept the old findings-only collapsed preview for non-compact summary views.
- Extended `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with source assertions for the new compact collapsed metadata preview.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `pnpm exec node --input-type=module` source-assertion script passed for the new compact collapsed metadata helper, rendering path, and updated layout test coverage.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-summary-view.layout.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).

### Still needs attention
- Once the desktop renderer is inspectable here, this compact metadata line should get a quick visual sanity check to confirm it stays useful without feeling too subtle at very narrow widths.
- If live use shows the single-line preview truncates too aggressively, a future pass could prioritize only the highest-value segment (`Next steps` or decisions) rather than surfacing all available metadata.
- Summary-tab ordering and latest-summary recovery are still worth another pass later if tiled summary mode continues to feel harder to triage than chat mode.

## Iteration 2026-03-08 — make compact `Latest` summary strips jump back to the actual timeline card

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`
- `apps/desktop/src/shared/types.ts`

### Repro steps
1. Open the desktop sessions page with multiple active sessions so at least one session remains a non-focused compact tile.
2. Switch that tile to the `Summary` tab after a few step summaries have accumulated.
3. Scroll the compact summary timeline away from the newest card.
4. Notice that the sticky `Latest` row at the bottom tells you what just happened, but does not help you recover the matching card in the timeline.

### UX problems found
- The compact sticky `Latest` strip repeated the newest summary text, but it behaved like passive status instead of a recovery affordance.
- When the summary timeline had been scrolled away from the newest card, users had to manually hunt for that card even though the UI already knew exactly which summary was latest.
- In dense tiled layouts, that made summary mode harder to triage than chat mode because the “newest thing” cue was visible but not actionable.

### Investigation notes
- I reviewed the ledger first and deliberately chose this as a fresh follow-up to the prior compact-summary metadata pass instead of revisiting `Single view` header chrome again.
- `AgentSummaryView` already receives both `stepSummaries` and `latestSummary`, so the recovery gap was local to that component rather than the tile shell.
- The current summary cards are internally expandable, which made a local “jump + expand + temporary highlight” path feasible without broader summary state refactoring.

### Assumptions
- In compact tiled summary mode, turning the sticky `Latest` strip into a jump affordance is more valuable than keeping it as passive status text because the primary job there is recovery and triage.
- It is acceptable to auto-expand the newest card when the user explicitly activates `Latest`, because that action clearly communicates intent to inspect the newest summary in context.
- If `latestSummary` and `stepSummaries` are briefly out of sync during updates, falling back to the last summary in the rendered timeline is acceptable because it keeps the jump target honest and local to what the user can actually see.

### Decision and rationale
- Chosen fix: make the compact sticky `Latest` strip an explicit button that jumps to the newest summary card, expands it, and briefly highlights it.
- Why this is better than the obvious alternatives:
  - better than leaving the strip passive because it turns an existing cue into a real recovery tool;
  - better than reordering the full summary timeline newest-first because it preserves chronological reading while still making the newest card easy to recover;
  - better than adding a second dedicated jump control because it improves discoverability using chrome that already exists in compact tiles.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` to track rendered summary card refs plus temporary highlight state for the latest card.
- Added a local reveal path so activating the compact `Latest` strip scrolls the matching card into view, expands it, and briefly emphasizes it.
- Added a lightweight fallback from `latestSummary` to the last rendered summary so the jump target stays accurate if summary state is briefly out of sync.
- Kept the non-compact latest summary panel unchanged to avoid broadening this tiled-only UX pass.
- Extended `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with source assertions for the new jump/reveal/highlight behavior.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new latest-summary jump target, reveal, highlight, and button wiring in `agent-summary-view.tsx`.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-summary-view.layout.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not running with an inspectable target.

### Still needs attention
- Once the desktop renderer is inspectable here, this should get a quick live sanity check to confirm the compact jump lands cleanly when the timeline is already near the newest card and when the sticky footer is visible.
- If the temporary highlight feels too subtle in practice, a future pass could add a slightly stronger but still brief flash state rather than keeping a persistent “latest” badge on the card.
- Summary ordering is now easier to recover, but compact summary triage could still benefit from a later pass if very long timelines make older-but-important cards hard to scan.

## Iteration 2026-03-08 — let tiled sessions hide the floating panel directly when it is crowding Compare/Grid

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/multi-agent-progress-view.tsx`
- `apps/desktop/src/renderer/src/pages/panel.tsx`
- `apps/desktop/src/main/tipc.ts`
- `apps/desktop/src/main/window.ts`

### Repro steps
1. Open the desktop sessions page with two or more active sessions in `Compare` or `Grid`.
2. Keep the floating panel visible and widen it until the sessions header starts warning that the panel is crowding tiled layouts or only shows a combined sidebar + panel recovery button.
3. Try to reclaim room quickly from the sessions header without manually resizing the panel edge.
4. Notice that the existing header only offers reset-style recovery, even though the fastest local fix may be to temporarily hide the panel altogether.

### UX problems found
- The sessions header diagnosed panel-driven tile pressure, but it did not expose the quickest reclaim-space action: hide the panel.
- In the combined sidebar + panel case, the only in-flow recovery action was a heavier `Reset both` decision, which can feel more committal than simply getting the panel out of the way.
- Because the panel disappears entirely when hidden, using a hide action without explicit short-lived feedback would risk feeling like a silent state jump.

### Investigation notes
- I reviewed the ledger first and intentionally chose this as a fresh tiled-workflow follow-up instead of revisiting recent `Single view` header iterations.
- The renderer already has a direct `tipcClient.hidePanelWindow({})` action, and the floating panel’s own multi-session overlay already uses a local hide affordance, so this improvement could follow an existing desktop pattern.
- The current sessions header already had a short-lived recovery feedback mechanism for sidebar/panel resets, which made it a good fit for a hide action too.
- Live Electron inspection was attempted again in principle, but this workflow still has no inspectable target available.

### Assumptions
- When tiled sessions are already under width pressure, offering `Hide panel` in the same header cluster is acceptable because it is a local, reversible action that directly addresses the diagnosed problem.
- Keeping `Reset panel` / `Reset both` as the primary outlined actions while making `Hide panel` a lighter ghost action is the right hierarchy: resize recovery remains the gentler default, while hiding is the faster escape hatch.
- Reusing the existing recovery feedback chip for panel hiding is preferable to a standalone toast because it explains the disappearing control in the same area where the user acted.

### Decision and rationale
- Chosen fix: add a direct `Hide panel` action to the sessions header whenever the floating panel is already crowding tiled layouts enough that panel recovery actions are shown, and reuse the existing recovery-feedback chip to confirm the hide.
- Why this is better than the obvious alternatives:
  - better than only keeping reset actions because it gives users a faster reclaim-space path when they want tiled sessions to dominate again immediately;
  - better than replacing reset with hide because reset is still the lower-disruption option when the user wants to keep the panel visible;
  - better than adding a new global panel control elsewhere because the decision is made exactly where tile pressure is being diagnosed.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add a local `Hide panel` recovery action when panel pressure actions are already visible.
- Reused `tipcClient.hidePanelWindow({})` from the sessions page so hiding the panel follows the existing renderer → main-process recovery path.
- Extended the tile-pressure recovery feedback helpers to support a `panel-hidden` source with appropriate SR and visible chip copy.
- Added transient hide-state handling so reset/hide panel recovery actions do not race each other.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new hide action, state coordination, and feedback copy.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A focused `node --input-type=module` source-assertion script passed for the new hide-panel recovery source, action gate, handler, feedback capture, and header button wiring in `sessions.tsx`.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not currently running with an inspectable target.

### Still needs attention
- Once an inspectable desktop build is available, this should get a quick live pass to confirm the new `Hide panel` action reads clearly beside `Reset panel` / `Reset both` at compact widths.
- If real use shows combined width pressure is still confusing, a future pass could explore stronger prioritization between `Hide panel` and `Reset both` when header space gets extremely tight.
- Floating-panel resize handles and their width-impact hint still deserve another end-to-end sanity pass against tiled sessions once live inspection is possible.

## Iteration 2026-03-08 — make floating-panel resize hints disclose the tile comfort target

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`

### Repro steps
1. Open the floating panel while the desktop sessions page is using `Compare` or `Grid` with multiple visible tiles.
2. Start widening or narrowing the panel to reclaim space for the tiled sessions.
3. Read the drag-time panel hint after it starts warning that the panel affects tile density.
4. Notice that the hint describes the consequence, but not the practical target width that would restore a more comfortable tiled layout.

### UX problems found
- The drag-time hint explained that the panel was crowding Compare/Grid, but it still left users guessing where to stop narrowing.
- The persistent `Reset panel` recovery cue named the problem, but it did not translate the comfort threshold into an explicit target width either.
- That made panel-width recovery feel more trial-and-error than necessary, especially when users wanted to keep the panel open but just make it less disruptive.

### Investigation notes
- I reviewed the ledger first and chose this as a fresh floating-panel follow-up instead of revisiting the recent `Hide panel` header action.
- I made one quick live Electron inspection attempt before editing, but this workflow still has no inspectable renderer target (`No Electron targets found`).
- Code inspection showed the panel already has a concrete comfort threshold (`PANEL_TILE_PRESSURE_WIDTH`), so the UX gap was guidance clarity rather than missing state.

### Assumptions
- Exposing the existing comfort threshold directly in resize feedback is acceptable because it reduces ambiguity without adding a new control or changing behavior.
- A simple textual target (for example, `Aim for 664px or narrower`) is a better first step than adding a new visual ruler or snap behavior, because it keeps the change local and low-risk.
- The threshold can be presented as an approximate comfort target rather than a hard rule because actual tile comfort still depends on overall window/sidebar conditions.

### Decision and rationale
- Chosen fix: keep the existing resize behavior, but make the floating-panel drag hint and persistent recovery title disclose the panel comfort target width for Compare/Grid.
- The hint now tells the user when wider panels usually start tightening tiled layouts, when they are back under the comfort width, and what width to aim for when still over the limit.
- Why this is better than the obvious alternatives:
  - better than only saying `crowding` because it tells the user how to recover without guessing;
  - better than adding a snap or auto-reset because it preserves manual control while still improving predictability;
  - better than another sessions-header hint because the guidance appears exactly inside the panel resize interaction.

### Code changes
- Added `getPanelTileComfortWidthLabel()` in `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to centralize the disclosed comfort target width.
- Updated `getPanelTilingHint(...)` copy so width-affecting panel drags mention the comfort target explicitly (`Aim for ...`, `Keep narrowing toward ...`, `Back under ...`).
- Updated the persistent `Reset panel` recovery title so it also references the comfort threshold instead of only saying the panel is wide.
- Extended `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new comfort-target helper and hint strings.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new comfort-target helper, drag-time hint copy, and persistent recovery-title copy in `panel-resize-wrapper.tsx`.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`, but this worktree still lacks the package-local test binary (`Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not currently running with an inspectable target.

### Still needs attention
- Once the desktop app is inspectable here, this should get a quick live pass to confirm the disclosed width target feels helpful rather than too literal across a few real window/sidebar sizes.
- If users still overshoot or undershoot during panel resize, a future pass could explore an optional visual comfort badge or snap-to-target affordance.
- Sessions-page combined sidebar + panel pressure hints may still deserve later tuning so their guidance stays aligned with the panel-local target copy.

## Iteration 2026-03-08 — align sessions-header recovery guidance with panel comfort targets

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles in `Compare` or `Grid`.
2. Keep the floating panel visible and wide enough that the sessions header starts offering `Reset panel`, `Hide panel`, or `Reset both` recovery actions.
3. Hover or focus those recovery actions and try to infer what panel width would actually feel comfortable again if you wanted to keep the panel open.
4. Compare that with the newer floating-panel resize hint, which already discloses a comfort target width directly.

### UX problems found
- The floating-panel resize UI had already started naming the tiled-session comfort target, but the sessions-page recovery actions still described the problem more generically.
- That mismatch made the header recovery path feel more trial-and-error than the panel-local resize path, especially when deciding whether to reset, hide, or manually resize the panel.
- Combined sidebar + panel recovery actions inherited the same ambiguity because their tooltip copy only said how far over the comfort threshold the layout currently was, not what “comfortable again” meant.

### Investigation notes
- I reviewed the existing ledger first and deliberately chose this as a fresh follow-up to the latest floating-panel resize hint pass instead of revisiting a more recent Single-view or compact-tile change.
- I made one lightweight Electron inspection attempt before editing, but this workflow still has no inspectable renderer target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).
- Code inspection showed the sessions page already computes explicit sidebar/panel pressure thresholds, so the gap was guidance clarity rather than missing state or controls.

### Assumptions
- Reusing the same comfort-threshold language in the sessions header is better UX than inventing separate wording because both surfaces are explaining the same width-pressure model.
- Improving titles and accessible labels for the existing recovery actions is a worthwhile local change even without adding more visible chrome, because the actions already carry the right interaction weight and just needed clearer guidance.
- It is acceptable for this pass to improve action-level guidance first without also rewriting every stacked/near-stacked hint string, because the main mismatch was between header recovery actions and panel-local resize guidance.

### Decision and rationale
- Chosen fix: add explicit comfort-width helpers to `sessions.tsx` and use them in the sidebar/panel pressure title suffixes so recovery actions now say what width to aim for, not just how far over the threshold the current layout is.
- This automatically improves the `Reset panel`, `Hide panel`, `Reset sidebar`, and `Reset both` action titles because they already reuse those suffix helpers.
- Why this is better than the obvious alternatives:
  - better than leaving the copy generic because it reduces guesswork about when the panel/sidebar will stop crowding tiled sessions;
  - better than adding more always-visible header chrome because it keeps the change small and local to the recovery controls the user is already interacting with;
  - better than adding snap behavior right now because it improves predictability without altering resizing mechanics.

### Code changes
- Added `getSidebarTileComfortWidthLabel()` and `getPanelTileComfortWidthLabel()` in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Updated `getSidebarTilePressureTitleSuffix(...)` and `getPanelTilePressureTitleSuffix(...)` so they now include `Aim for about ... wide or narrower` guidance.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new comfort-width helpers and the updated action-copy fragments.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new sessions-page comfort-width helpers and updated action guidance.
- Attempted targeted Vitest verification with `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still does not expose a `vitest` binary (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not currently running with an inspectable target.

### Still needs attention
- The recovery action titles are now aligned with the panel-local comfort-target language, but the stacked/near-stacked hint chips themselves could still adopt similarly explicit target wording later if live usage suggests the generic hint text remains too vague.
- Once the desktop app is inspectable here, this should get a quick live sanity check to confirm the updated action titles read well in both compact and non-compact session headers.
- If panel/sidebar recovery still feels too indirect in practice, a later pass could explore making the comfort target visible in the badge or hint chrome itself rather than only in titles/accessible labels.

## Iteration 2026-03-08 — re-measure the tiled grid when floating-panel width changes

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles in `Compare` or `Grid`.
2. Leave the sidebar width unchanged, but show the floating panel and resize it wider or narrower.
3. Watch how the tiled grid responds while the available sessions width changes.
4. Compare that behavior with a sidebar-width change, which already had a dedicated `layoutChangeKey` path.

### UX problems found
- `SessionGrid` had a `layoutChangeKey` re-measurement path intended for animated layout-chrome changes, but `sessions.tsx` only keyed it off `sidebarWidth`.
- That made the floating panel a second-class layout participant even though its width also changes the effective tiled-session workspace.
- In practice, this mismatch risked making panel-resize recovery feel less predictable than sidebar-resize recovery because the grid was not explicitly told that the same class of layout change had happened.

### Investigation notes
- I reviewed the latest ledger entries first and deliberately chose a fresh sessions/grid behavior issue instead of revisiting the recent panel-copy and hint-text passes.
- A live Electron inspection was not practical in this workflow because there is still no inspectable desktop renderer target available.
- Code inspection confirmed `SessionGrid` already has a `layoutChangeKey` effect that schedules immediate and post-transition measurement updates; the gap was that panel width/visibility never fed that key.

### Assumptions
- The existing `layoutChangeKey` is intended to cover any animated layout-chrome change that affects tiled-session width, not just the sidebar.
- Using a combined sidebar/panel key is an acceptable local fix because it reuses the existing re-measurement behavior instead of introducing a second panel-specific synchronization path.
- It is acceptable for the key to include panel visibility as well as width, because hiding/showing the panel changes the available tiled-session width just as meaningfully as manual panel resizing.

### Decision and rationale
- Chosen fix: derive a combined `sessionGridLayoutChangeKey` from both `sidebarWidth` and floating-panel visibility/width, then pass that combined key into `SessionGrid`.
- Also widened the `SessionGrid` prop type so the key can be an explicit string rather than a collision-prone numeric encoding.
- Why this is better than the obvious alternatives:
  - better than leaving the key sidebar-only because it keeps panel resizing on the same responsive measurement path as other layout-chrome changes;
  - better than adding a separate panel-only effect because it preserves the existing grid contract and keeps the change local;
  - better than trying to infer everything only from `ResizeObserver` timing because the explicit key still gives the grid a reliable post-transition re-measure signal.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `layoutChangeKey` accepts `number | string` and its re-measurement comment now explicitly covers floating-panel changes.
- Added `const sessionGridLayoutChangeKey = `${sidebarWidth ?? "none"}:${panelVisible ? panelWidth ?? "auto" : "hidden"}`` in `apps/desktop/src/renderer/src/pages/sessions.tsx`.
- Passed `layoutChangeKey={sessionGridLayoutChangeKey}` to `SessionGrid` so panel width/visibility changes follow the same layout-preservation path as sidebar changes.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with a targeted source assertion for the combined layout-change key.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the widened `layoutChangeKey` type, the combined sidebar/panel key in `sessions.tsx`, and the targeted regression test assertion.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/pages/sessions.layout-controls.test.ts`, but the worktree still lacks installed workspace dependencies (`tsup: command not found`, `node_modules missing`).

### Still needs attention
- Once the desktop app is inspectable here, this should get a quick live sanity check to confirm panel drag, panel hide/show, and sidebar resize all now feel equally predictable in tiled layouts.
- The sessions header still has room for a future pass on making stacked/near-stacked pressure guidance more explicit in the visible chip text itself, not just in titles.
- If panel/sidebar pressure interactions still feel indirect after live testing, a later iteration could explore showing the current comfort target or recovery source more directly in the grid chrome.

## Iteration 2026-03-08 — make floating-panel resize hints more glanceable during tiled workflows

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- `apps/desktop/src/renderer/src/components/resize-handle.affordance.test.ts`

### Repro steps
1. Open the floating panel while sessions are visible in `Compare` or `Grid`.
2. Grab any width-affecting panel handle or corner and drag wider or narrower.
3. Try to decide quickly whether the current panel width is still safe for tiled sessions without stopping to parse the full hint sentence.
4. Compare that with the post-resize `Reset panel` chip, which already surfaces a compact overage badge more directly.

### UX problems found
- The panel already showed a helpful sentence-level resize hint, but during active dragging the guidance was still relatively text-heavy.
- That made it harder to answer the most practical resizing question at a glance: "How wide is the panel right now, and how far am I from the tiled-session comfort threshold?"
- The persistent recovery chip exposed compact overage information after the resize, but the in-gesture hint did not give the same quick-read feedback while the decision was happening.

### Investigation notes
- I reviewed the latest ledger entries first and chose this as a fresh follow-up on floating-panel/tiled-layout interaction clarity rather than revisiting the recent panel-width remeasurement work.
- I made one lightweight live renderer inspection attempt with `electron_execute`, but this workflow still has no inspectable Electron target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).
- Code inspection showed `PanelResizeWrapper` already computes the current width, comfort threshold, and tile-pressure overage, so the gap was presentation speed rather than missing state.

### Assumptions
- A compact width/pressure metric row inside the existing hint is better than replacing the hint copy entirely because it improves scanability without removing explanatory text.
- It is acceptable to keep this metric row purely visual (`aria-hidden`) because the existing hint text and handle labels already carry the accessible explanation.
- Reusing the same tile-comfort threshold model during drag is preferable to inventing a second resize-only threshold, because panel recovery guidance should stay consistent before, during, and after resizing.

### Decision and rationale
- Chosen fix: add a small metric strip to the floating-panel resize hint that shows the current panel width plus a compact status chip describing whether the panel is over the tile comfort threshold, at the limit, or still below it.
- Why this is better than the obvious alternatives:
  - better than only rewriting the sentence copy because the user can now read the key decision data without parsing a full sentence mid-drag;
  - better than adding a separate persistent meter elsewhere because it keeps the guidance local to the resize gesture;
  - better than changing actual resize mechanics because it improves predictability and confidence without introducing new snap behavior.

### Code changes
- Added `getPanelWidthBadgeLabel()` and `getPanelTilingMetricBadge()` in `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`.
- Updated the resize impact hint in `PanelResizeWrapper` to render a new `data-panel-resize-impact-metrics` chip row showing the live panel width and the current comfort-threshold status.
- Extended `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions covering the new metric helpers, chip row, and tone-based status styling.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts tiling-ux.md` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new panel width badge helper, tile-comfort metric helper, and in-hint metric row.
- Attempted targeted Vitest verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts src/renderer/src/components/resize-handle.affordance.test.ts`, but this worktree still does not expose a `vitest` binary (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live Electron inspection remains blocked in this workflow because the renderer is not running with an inspectable target.

### Still needs attention
- Once the desktop renderer is inspectable, this should get a quick live sanity check to confirm the new metric row stays readable without covering important panel content across both wide and narrow panel heights.
- If the metric row proves especially useful, a later pass could explore whether session-tile resize hints should use the same width/pressure chip language for consistency.
- If live testing shows the drag-time hint still requires too much interpretation, a later iteration could explore a stronger directional cue like `safe`, `tight`, or `over` labeling in addition to the numeric badge.

## Iteration 2026-03-08 — make stacked and tight header hints show visible pressure overage

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`

### Repro steps
1. Open the desktop sessions page with multiple visible tiles in `Compare` or `Grid`.
2. Widen the sidebar, floating panel, or both until the sessions header shows a stacked or `Tight fit`-style warning chip.
3. Without hovering the chip or reading the recovery buttons, try to estimate how far past the comfort threshold the current layout chrome is.
4. Compare that with the adjacent `Reset panel` / `Reset both` actions, which already expose compact overage badges directly.

### UX problems found
- The visible stacked and near-stacked warning chips still relied almost entirely on text labels, even when sidebar/panel pressure had already been quantified elsewhere in the same header.
- That meant the user could see *that* tiles were crowded, but not *how much* they were crowded without hovering titles or parsing the recovery actions.
- The result was inconsistent glanceability: action buttons showed compact `+Npx` pressure badges, while the warning chip that introduced the problem stayed less specific.

### Investigation notes
- I reviewed the latest ledger entries first and deliberately chose this because it was still open in the most recent sessions-header follow-ups, while other areas had been investigated more recently.
- I made one lightweight live inspection attempt via `electron_execute` before editing, but this workflow still has no inspectable Electron target (`Failed to list CDP targets. Make sure Electron is running with --inspect flag.`).
- Code inspection showed `sessions.tsx` already computes sidebar, panel, and combined pressure widths, so the gap was visible presentation rather than missing state.

### Assumptions
- When the likely crowding source is already the sidebar, panel, or both, showing the numeric overage directly on the warning chip is better UX than hiding it only in titles.
- Very compact session headers should stay text-only because adding another badge there would risk collapsing the header into pure chrome.
- Generic window-width-only stacked states can remain badge-free for now because there is no sidebar/panel overage number to expose, and forcing a synthetic badge would be noisier than helpful.

### Decision and rationale
- Chosen fix: add a small visible `+Npx` overage badge to the stacked and near-stacked warning chips whenever sidebar and/or floating-panel width is the likely crowding source.
- The badge reuses the existing tile-pressure badge language instead of inventing a second metric vocabulary.
- Why this is better than the obvious alternatives:
  - better than leaving the chip text-only because the crowding amount becomes glanceable before hover;
  - better than expanding the warning copy because the numeric badge adds clarity without making the header wordier;
  - better than always showing a badge because generic width-only stacking stays simpler and avoids synthetic or misleading numbers.

### Code changes
- Added `getVisibleTilePressureHintBadgeLabel(...)` in `apps/desktop/src/renderer/src/pages/sessions.tsx` to reuse the existing badge format for sidebar, panel, or combined pressure.
- Added `stackedLayoutRecoveryPressureLabel` and `nearStackedLayoutPressureLabel` so the warning chips only show badges outside the very-compact header state.
- Updated the stacked and near-stacked header chips to render `data-tile-pressure-stacked-badge` / `data-tile-pressure-near-badge` when a real sidebar/panel overage exists.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new helper, computed labels, and badge rendering.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new visible stacked/near pressure badge helper and badge render paths.
- Attempted targeted Vitest verification with `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still does not expose a `vitest` binary (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live renderer inspection remains blocked in this workflow because Electron is not currently running with an inspectable target.

### Still needs attention
- Once the desktop renderer is inspectable, this should get a quick live sanity check to confirm the stacked/tight chips still wrap cleanly across a few narrow and wide header widths.
- Generic window-width-only stacked states still rely on text-only warning chips; if that state proves ambiguous in live testing, a later pass could explore a different visible cue that does not pretend the sidebar/panel caused it.
- If the numeric badges prove useful in practice, a later pass could align tile-level resize guidance with the same compact overage language for consistency.

## Iteration 2026-03-08 — align responsive stacked fallback with the real two-column tile baseline

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/hooks/use-resizable.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with at least two visible sessions.
2. Narrow the main workspace (or widen surrounding chrome) until two normal-width tiles no longer fit comfortably, but two absolute-minimum tiles technically still can.
3. Notice that tiles can remain in a cramped two-column arrangement longer than expected before the responsive stacked fallback engages.
4. Compare that with the existing breakpoint test in `session-grid.resize-behavior.test.ts`, which already expects stacking to start at the normal `320px` tile baseline (`656px` total with a `16px` gap).

### UX problems found
- The responsive stacked fallback was keyed off `TILE_DIMENSIONS.width.min` (`200px`) even though the visible compare/grid layout model and existing regression test both imply a normal two-column baseline built around `TILE_DIMENSIONS.width.default` (`320px`).
- That mismatch delayed the stacked fallback until the tiled workspace was far tighter than intended, making Compare/Grid stay in a more cramped multi-column state than the rest of the UX suggested.
- Because sessions-header layout descriptions and recovery hints also depend on `isResponsiveStackedTileLayout(...)`, the header could remain too optimistic for too long under narrow widths.

### Investigation notes
- I reviewed the latest ledger entries first and initially considered adding another generic width-only badge to stacked/tight hints.
- While tracing the header hint logic back to `SessionGrid`, I found a stronger underlying issue: `calculateTileWidth(...)` uses the normal tile-width model, but `isResponsiveStackedTileLayout(...)` was still using the absolute resize minimum.
- A live Electron inspection was partially available in this workflow, but the inspectable renderer target was the `/panel` window (`http://localhost:5173/panel`), not the main sessions window, so this iteration remained code-led.

### Assumptions
- The responsive stacked fallback should engage when the normal compare/grid two-column baseline no longer fits, not only when the absolute minimum resize width is crossed.
- The existing unit test threshold (`655px` stacked, `656px` not stacked with a `16px` gap) reflects the intended UX contract and is safe to treat as the source of truth here.
- Reusing `TILE_DIMENSIONS.width.default` is preferable to hardcoding `656` because it keeps the breakpoint tied to the shared tile sizing model.

### Decision and rationale
- Chosen fix: make `isResponsiveStackedTileLayout(...)` use `TILE_DIMENSIONS.width.default` instead of `TILE_DIMENSIONS.width.min` when deciding whether Compare/Grid should fall back to a stacked single-column layout.
- Also strengthened the targeted unit test so both `Compare` (`1x2`) and `Grid` (`2x2`) explicitly lock in the intended breakpoint.
- Why this is better than the obvious alternatives:
  - better than adding more header hint chrome first, because it fixes the underlying layout-timing mismatch instead of explaining the wrong breakpoint more clearly;
  - better than hardcoding a numeric breakpoint, because the threshold stays coupled to the shared tile sizing model;
  - better than leaving the helper on `min` width, because stacked transitions, header truthfulness, and tile density now all line up with the normal tiled-session baseline.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so `isResponsiveStackedTileLayout(...)` now computes the minimum multi-column width from `TILE_DIMENSIONS.width.default` and documents why the absolute resize minimum is too permissive for this fallback.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` to rename the breakpoint test around the normal two-column baseline and to cover both `1x2` and `2x2` thresholds.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the updated `TILE_DIMENSIONS.width.default` breakpoint logic and the expanded `1x2` / `2x2` regression expectations.
- Attempted targeted verification with `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/session-grid.resize-behavior.test.ts`, but this worktree still lacks installed workspace dependencies (`tsup: command not found`, `node_modules missing` during `build:shared`).

### Still needs attention
- Once workspace dependencies are available, rerun the targeted Vitest file to confirm the breakpoint change under the real test runner instead of only via source assertions.
- Once the main sessions renderer is inspectable, sanity-check that Compare/Grid now stack at the expected earlier threshold across plain window narrowing, wide sidebar states, and wide floating-panel states.
- If the now-earlier stacked breakpoint still leaves generic window-width-only stacked states feeling ambiguous, a later iteration can revisit the deferred width-deficit badge idea with the corrected fallback timing in place.

## Iteration 2026-03-08 — make compact important-findings chips jump directly to the flagged summary

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-summary-view.tsx`
- `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts`

### Repro steps
1. Open the sessions page with multiple active tiles and switch a narrow, non-focused tile to the `Summary` tab.
2. Make sure the tile has at least one `high` or `critical` summary so the compact `Important findings` chip appears above the timeline.
3. Scan that compact summary tile and notice that the chip signals urgency, but before this change it did not help you reach the flagged card itself.
4. Try to recover the important summary from the narrow tile without expanding the whole tile first.

### UX problems found
- The compact `Important findings` chip was informative but passive, so it added urgency chrome without providing a direct recovery path.
- In dense tiled workflows, that made the chip feel closer to a warning badge than a useful organizational affordance.
- The summary view already had a `Latest` jump affordance and temporary card highlight, so the compact important-findings chip lagged behind the rest of the summary UX in navigability.

### Investigation notes
- I reviewed the ledger first and chose this area because the earlier compact-summary work explicitly left the `Important Findings` block as the next likely local improvement if summary mode still felt heavy in practice.
- Code inspection showed `AgentSummaryView` already had the exact mechanics needed for a good fix: summary refs, reveal state, and temporary highlight behavior for the compact `Latest` jump strip.
- I attempted a live Electron probe before and after editing, but the currently inspectable renderer target is `SpeakMCP` at `http://localhost:5174/settings/agents`, not the desktop sessions page, so live tiled-view verification remains blocked in this workflow.

### Assumptions
- In compact summary tiles, the most useful destination is the latest critical summary, falling back to the latest high-importance summary when no critical item exists.
- Reusing the existing reveal/highlight behavior is better than inventing a second navigation treatment because the summary view already teaches that pattern with the compact `Latest` strip.
- Adding a small chevron and button behavior to the compact chip is acceptable chrome because it clarifies intent without adding another separate row or control.

### Decision and rationale
- Chosen fix: turn the compact `Important findings` chip into a direct jump affordance that scrolls to and temporarily highlights the most important summary card in the timeline.
- Why this is better than the obvious alternatives:
  - better than leaving the chip passive because the user can now act on the warning immediately from the narrow tile;
  - better than adding another separate CTA row because it upgrades existing chrome instead of increasing compact-summary height;
  - better than jumping to the first important summary unconditionally because the latest critical/high item is usually the most relevant current destination in an active tile.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.tsx` to:
  - derive `importantTimelineSummary` from the latest critical summary, falling back to the latest high-importance summary,
  - generalize the existing latest-summary reveal logic into `revealSummaryInTimeline(...)`,
  - add `handleJumpToImportantSummary(...)`,
  - and turn the compact important-findings chip into a focus-visible button with explicit jump title/ARIA copy plus a chevron affordance.
- Updated `apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` with source assertions for the new important-summary target selection, shared reveal helper, actionable chip wiring, and updated accessibility metadata.

### Verification
- A targeted dependency-light Node source-assertion script passed for the new `importantTimelineSummary` selection, the shared `revealSummaryInTimeline(...)` helper, the actionable compact chip, and the updated layout-test assertions.
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-summary-view.tsx apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts tiling-ux.md` passed.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/agent-summary-view.layout.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live tiled-view inspection remains blocked in this workflow because the currently inspectable Electron target is not the desktop sessions page.

### Still needs attention
- Once the desktop sessions renderer is inspectable, this compact important-findings jump should get a quick live pass to confirm the chip still feels calm at very narrow widths and the highlight lands at a sensible scroll position.
- If the chip still feels too text-heavy in practice, the next local tweak should be copy/spacing tuning before adding any more compact-summary chrome.
- Compact chat/summary tiles still deserve an end-to-end live density pass once the actual sessions window—not the unrelated `SpeakMCP` target—is available for inspection.

## Iteration 2026-03-08 — show the actual side-by-side width delta in stacked and near-stacked header hints

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`

### Repro steps
1. Open the desktop sessions page with two or more visible sessions in `Compare` or `Grid`.
2. Narrow the window, widen the sidebar, or keep a wide floating panel open until the sessions header shows either a stacked recovery hint or a near-stacked warning.
3. Look at the small badge on that hint.
4. Before this change, the badge mostly reflected sidebar/panel comfort-pressure overage (`+96px`, etc.) rather than how much room the tiled layout itself actually needed or still had left.

### UX problems found
- The stacked and near-stacked hints explained the *cause* of width pressure, but their badges did not explain the *layout delta* that matters most for predicting whether side-by-side tiles will fit.
- A badge like `+96px` could be directionally useful, but it did not answer the user’s most immediate question: “How close am I to restoring / losing the side-by-side layout?”
- This made width transitions across window size, sidebar width, and floating-panel width feel harder to reason about than they needed to.

### Investigation notes
- `sessions.tsx` already had the right high-level signals (`isResponsiveStackedLayout`, near-stacked buffer, sidebar/panel pressure heuristics), but it did not expose the actual minimum multi-column width threshold.
- `session-grid.tsx` already centralizes the stacking threshold logic inside `isResponsiveStackedTileLayout(...)`, so the cleanest fix was to reuse that threshold instead of re-deriving it ad hoc in the sessions page.
- I again checked the inspectable Electron target and it is still `SpeakMCP` rather than the desktop sessions renderer, so this iteration also relied on code inspection plus targeted source-level verification instead of live tiled UI interaction.

### Assumptions
- For stacked and near-stacked hints, the most useful compact badge is the side-by-side width deficit/headroom itself, even if separate sidebar/panel pressure badges still remain useful on explicit recovery buttons.
- It is acceptable for the stacked/near-stacked hint titles to keep the existing cause-focused guidance while appending one short sentence with the actual width delta.
- Reusing the same two-column threshold for both `Compare` and `Grid` is correct here because the responsive stacking fallback already treats both modes as a two-column baseline before collapsing to one column.

### Decision and rationale
- Chosen fix: replace the stacked/near-stacked hint badges with badges that show the actual side-by-side width delta (`Need ~Xpx` when already stacked, `~Xpx left` when close to stacking), while preserving the existing sidebar/panel cause messaging and recovery actions.
- Why this is better than the obvious alternatives:
  - better than keeping the old pressure-only badges because the new labels directly answer how close the layout is to fitting side by side;
  - better than adding another row of explanation because it upgrades the existing badge slot without increasing header height;
  - better than calculating the threshold separately in the sessions page because exporting the threshold helper from `session-grid.tsx` keeps the fallback math in one place.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to export `getResponsiveStackedTileLayoutMinimumWidth(...)` and reuse it inside `isResponsiveStackedTileLayout(...)`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - compute the active multi-column threshold from measured grid gap + visible tile count,
  - derive stacked width deficit and near-stacked headroom,
  - switch the hint badges to `Need ~Xpx` / `~Xpx left`,
  - append the same width delta to the hint `title`,
  - and rename the badge data attributes to `data-tile-layout-stacked-width-badge` / `data-tile-layout-near-width-badge`.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new threshold helper usage, width-delta labels, augmented titles, and renamed badge hooks.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts` with a targeted threshold test for the new exported helper.

### Verification
- A targeted dependency-light Node source-assertion script passed for:
  - the new `getResponsiveStackedTileLayoutMinimumWidth(...)` export,
  - sessions-page width-delta helpers and derived state,
  - the renamed stacked/near width badge hooks,
  - and the updated source assertions in both affected test files.
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` could not run here because `vitest` is not currently available in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live tiled-view verification is still blocked in this workflow because the inspectable Electron renderer target is not the desktop sessions page.

### Still needs attention
- Once the real desktop sessions renderer is inspectable, confirm that `Need ~Xpx` / `~Xpx left` feels more predictable than the old pressure badges under three scenarios: plain window narrowing, wide sidebar only, and wide floating panel only.
- If users still need cause-and-effect clarity in the compact header after seeing the new delta badges, the next local refinement should be badge-copy tuning rather than adding another dedicated hint row.
- The reset buttons still use comfort-threshold overage badges, which is appropriate for now, but a later pass could check whether those action badges and the new layout-delta hint badges feel sufficiently distinct together in compact headers.

## Iteration 2026-03-08 — add a panel-local hide escape when width recovery needs more than a reset

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- live renderer probe via Electron CDP

### Repro steps
1. Open the floating panel while the desktop sessions page is using `Compare` or `Grid`.
2. Resize the panel wider until the existing tiled-session pressure hint and persistent `Reset panel` recovery chip appear.
3. Release the resize gesture and stay in the panel instead of switching back to the sessions page header.
4. Before this change, the panel-local recovery surface only offered `Reset panel`, even when the panel was materially wider than the tile-comfort width and hiding it entirely would be the fastest way to restore tiled room.

### UX problems found
- The panel already explained when its width was crowding tiled sessions, but it still omitted the most direct “get this out of the way” action at the point of interaction.
- A `Hide panel` recovery path already existed in `sessions.tsx`, so the capability was present in the product but not surfaced where users were actively resizing the panel.
- This made wide-panel recovery feel more indirect than necessary: users had to either keep nudging the panel smaller or move back to a different surface to find the stronger escape hatch.

### Investigation notes
- I reviewed the latest ledger first and intentionally avoided reopening the just-touched stacked-header badge work.
- The most recent panel entries explicitly warned against piling on new hint rows, so I kept this iteration inside the existing persistent recovery cluster rather than adding another separate surface.
- A quick Electron probe is still blocked from the actual desktop sessions renderer in this workflow; the connected target remains `SpeakMCP` at `http://localhost:5174/settings/agents`, so this pass relied on code inspection plus targeted verification.

### Assumptions
- When the floating panel is materially past the tile-comfort width, a secondary `Hide panel` action is acceptable because it shortens recovery without introducing a brand-new row of chrome.
- The hide action should only appear when the panel is meaningfully over the threshold, not merely touching it, so this iteration reuses the existing tiling deadband as a conservative gate.
- While a recovery action is in flight, temporarily disabling both recovery buttons is preferable to allowing overlapping reset/hide requests.

### Decision and rationale
- Chosen fix: extend the existing persistent panel-recovery cluster so it can also surface a direct `Hide panel` action when the panel is materially crowding tiled workflows, and update the hint instruction copy to mention that stronger escape hatch when available.
- Why this is better than the obvious alternatives:
  - better than forcing users to keep dragging narrower because hiding the panel is sometimes the clearest immediate recovery;
  - better than adding another explanatory hint row because it upgrades the existing recovery surface instead of increasing overlay density;
  - better than always showing `Hide panel` because the extra action only appears once width pressure is meaningfully past the comfort threshold.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to:
  - add `activePanelRecoveryAction` state so reset/hide actions do not overlap,
  - derive `panelTilePressureWidth` once and expose `showPersistentPanelHideRecovery` when that pressure exceeds the local deadband,
  - update the settled resize instruction copy to mention `Hide panel` when the stronger recovery option is available,
  - add `handleHidePanel()` calling `tipcClient.hidePanelWindow({})`,
  - and render a compact `data-panel-recovery-actions` cluster with a secondary `Hide panel` button plus temporary `Hiding...` / `Resetting...` labels.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new pressure-width derivation, hide-recovery gating, copy, action-state handling, and `data-panel-hide-recovery` hook.

### Verification
- Electron renderer probe: `window.location.href` still reports `http://localhost:5174/settings/agents` (`SpeakMCP`), so live tiled-view validation remains blocked in this workflow.
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A targeted dependency-light `node` source-assertion script passed for the new recovery-action state, hide CTA, copy, and updated test coverage.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` is still blocked in this worktree because direct Vitest execution is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`, `Command "vitest" not found`).

### Still needs attention
- Once the real desktop panel/sessions renderer is inspectable here, this two-button recovery cluster should get a quick live pass on narrower panel widths to confirm the added `Hide panel` chip still feels calm beside `Reset panel`.
- If the cluster feels even slightly too busy in practice, the next local refinement should tune the hide-action threshold or copy before adding any more chrome.
- A later consistency pass could decide whether the panel-local hide title should match the sessions-header hide-action wording exactly, but that is not necessary for this local behavior improvement.

## Iteration 2026-03-08 — suppress icon-only Hide panel recovery on very compact tiled headers

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- live renderer probe via `electron_execute`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with the floating panel visible and wide enough that tiled-session recovery actions appear.
2. Narrow the sessions area until the header reaches its very compact tiled state.
3. Compare the visible width-recovery controls, especially when `Reset both` or `Reset panel` is shown alongside the separate panel-hide affordance.
4. Before this change, notice that the hide affordance collapsed into an unlabeled icon-only button while the primary reset action still remained visible.

### UX problems found
- In the very compact tiled header, `Hide panel` stayed mounted as a separate control even after its visible text label disappeared.
- That left an extra icon-only button competing with the main recovery action right when header space was already at its tightest.
- The result was avoidable ambiguity: the reset action carried the clearer intent, while the unlabeled hide icon added chrome without enough in-flow explanation.

### Investigation notes
- I reviewed the ledger first and deliberately chose the still-open follow-up from the earlier `Hide panel` recovery iteration instead of reopening broader resize or Single-view work.
- A live Electron probe was possible this time, but the inspectable renderer target was currently on `http://localhost:5174/settings/agents`, not the sessions page, so the actual tiled-header state still could not be visually confirmed end-to-end.
- Code inspection showed `showHidePanelRecoveryAction` stayed true in very compact headers while `hidePanelRecoveryActionLabel` became `null`, which meant the UI still rendered an icon-only hide button using a dedicated `h-6 w-6 px-0` compact branch.

### Assumptions
- On very compact tiled headers, preserving one clear primary recovery action is more valuable than keeping every alternative action directly visible.
- Hiding the separate `Hide panel` button only at the very compact breakpoint is acceptable because users still keep that action on wider compact headers and in panel-local recovery surfaces.
- This refinement should stay local to the sessions-header recovery cluster rather than introducing a new overflow menu or broader recovery abstraction.

### Decision and rationale
- Chosen fix: suppress the sessions-header `Hide panel` recovery action entirely when the tiled header is in its very compact state, while keeping it available on wider compact/non-compact headers.
- Also removed the now-dead icon-only sizing branch for that button.
- Why this is better than the obvious alternatives:
  - better than keeping the old icon-only hide button because the tightest header state now keeps the primary reset action clearer and less ambiguous;
  - better than removing `Hide panel` everywhere because the faster escape hatch still exists when there is enough room to label it properly;
  - better than adding another compact overflow path because this improves hierarchy with a tiny local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so `showHidePanelRecoveryAction` now requires `!isVeryCompactSessionHeader`.
- Simplified `hidePanelRecoveryActionLabel` because the very-compact null-label branch is no longer reachable.
- Removed the dead icon-only size class branch from the `Hide panel` button markup.
- Extended `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new very-compact guard and the removal of the icon-only hide-button path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted verification: `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked in this worktree because `vitest` is not installed (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- A dependency-light `node --input-type=module` source-assertion script passed for the new very-compact hide-action guard, simplified label path, simplified button class, and updated layout-controls assertions.

### Still needs attention
- Once the sessions page itself is the inspectable renderer target, this should get a quick visual sanity check at the exact compact → very-compact breakpoint to confirm the remaining reset action feels calmer rather than underpowered.
- If the compact recovery cluster still feels busy in live use, the next local pass should consider whether `Hide panel` should appear only for `stacked` / `near-stacked` urgency instead of every earlier recovery state.
- The broader live interaction among sidebar width, panel width, and tiled-session header density still needs an end-to-end pass when the sessions renderer is directly inspectable here.

## Iteration 2026-03-08 — reserve header Hide panel for urgent tiled-width pressure only

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- live renderer probe via `electron_execute`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with the floating panel visible.
2. Keep the sessions header in its compact-but-not-very-compact state while making the panel wide enough to trigger the earlier pressure recovery controls.
3. Before this change, notice that the header could show both `Reset panel` / `Reset both` and `Hide panel` even before the layout had reached the `Tight fit` or stacked states.
4. Compare that with the stronger urgency states, where the extra hide escape hatch is easier to justify because the tiled layout is already close to losing or has already lost side-by-side room.

### UX problems found
- In early compact pressure states, the separate `Hide panel` action added another decision before the layout had actually become `Tight fit` or stacked.
- That diluted the hierarchy of the recovery cluster: the calmer reset action and the more drastic hide action competed too early.
- The sessions header already has limited room in compact states, so showing the strongest escape hatch before it is truly warranted made the control group feel busier than necessary.

### Investigation notes
- I reviewed the latest ledger first and chose the exact follow-up left open by the previous compact-header iteration instead of reopening a broader resize or layout-switching area.
- Code inspection showed the header-level `Hide panel` action was already gated by visibility, panel crowding, and the presence of reset actions, but not by urgency level.
- A live Electron probe was available, but the inspectable target is still `http://localhost:5174/settings/agents` rather than the desktop sessions renderer, so this remained a code-led iteration.

### Assumptions
- In compact early-pressure states, `Reset panel` / `Reset both` is the clearer first-line recovery than immediately surfacing `Hide panel`.
- It is acceptable to reserve `Hide panel` for `near-stacked` and stacked urgency because the stronger escape hatch remains available when pressure becomes more acute.
- Keeping the panel-local hide affordance unchanged is acceptable because that surface is closer to the panel interaction itself and does not consume already-tight sessions-header space.

### Decision and rationale
- Chosen fix: only show the sessions-header `Hide panel` recovery action when tile-pressure urgency is `near-stacked` or `stacked`, while leaving early compact pressure states reset-first.
- Why this is better than the obvious alternatives:
  - better than keeping `Hide panel` in all compact pressure states because the recovery cluster stays calmer before the layout is actually in trouble;
  - better than removing `Hide panel` entirely because the faster escape hatch still appears once tiled room is genuinely at risk;
  - better than adding more explanatory copy because it improves hierarchy with a tiny local behavior change.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `shouldOfferUrgentHidePanelRecoveryAction` from `tilePressureRecoveryUrgency` and require that helper before rendering the sessions-header `Hide panel` action.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new urgency helper, the tightened hide-action gate, and the regression that early compact pressure should not qualify for the header hide action.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A dependency-light `node --input-type=module` source-assertion script passed for the new urgency helper, the updated hide-action gate, and the new layout-controls assertions.
- Attempted targeted verification with `pnpm exec vitest run apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`, but this worktree still does not expose a `vitest` binary (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live tiled-view inspection is still blocked in this workflow because the inspectable Electron target is `http://localhost:5174/settings/agents`, not the sessions page.

### Still needs attention
- Once the sessions renderer itself is inspectable, verify that the compact header now feels calmer in early pressure states while still surfacing `Hide panel` quickly enough in `Tight fit` and stacked states.
- If live use still makes the compact recovery cluster feel heavy, the next local pass should tune whether early reset actions themselves should narrow further before changing copy or adding new controls.
- A later consistency pass could decide whether the panel-local hide action should also vary its emphasis by urgency, but that is not necessary for this header-only refinement.

## Iteration 2026-03-08 — make live panel-resize hints use explicit tiled-width deltas

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- live renderer probe via `electron_execute`

### Repro steps
1. Open the floating panel while the desktop sessions page is using `Compare` or `Grid`.
2. Drag a panel width handle wider or narrower and watch the live tiling-impact hint near the top of the panel.
3. Compare that live panel hint with the newer sessions-header width-pressure badges.
4. Before this change, the panel hint still described width pressure mostly as `Xpx over tile comfort` / `Xpx before tile pressure` rather than telling the user more directly how much narrower the panel needed to be or how much headroom remained.

### UX problems found
- The sessions header already used more predictive width-delta language (`Need ~Xpx` / `~Xpx left`), but the panel’s live resize hint still used older comfort-threshold phrasing.
- That made the same tiled-width problem read differently depending on which surface the user happened to be looking at.
- During an active resize gesture, `Xpx over tile comfort` was directionally weaker than `Need ~Xpx narrower`, even though the user’s immediate question is usually “how much more do I need to pull this back?”

### Investigation notes
- I reviewed the ledger first and intentionally chose a still-open floating-panel resize refinement rather than reopening the just-touched sessions-header hide-action work.
- `panel-resize-wrapper.tsx` already owned the live drag-time hint and metric badge, so this was a clean local change without any layout-state refactor.
- I attempted a quick live renderer check before editing, but the inspectable Electron target in this workflow is still `SpeakMCP` at `http://localhost:5174/settings/agents`, not the sessions/panel tiled workflow.

### Assumptions
- During active panel resizing, users benefit more from explicit directional width deltas than from more abstract comfort-threshold wording.
- Aligning the panel’s live hint language with the newer sessions-header width-delta language is preferable to introducing yet another tiled-width vocabulary.
- The persistent recovery-action badges can keep their existing compact `+Xpx` overage treatment for now because this iteration is specifically about the live drag-time hint, not the settled recovery controls.

### Decision and rationale
- Chosen fix: keep the existing live panel-resize hint surface, but change its metric badge and detail copy to use explicit tiled-width deltas such as `Need ~36px narrower` and `~44px left`.
- Why this is better than the obvious alternatives:
  - better than leaving the old `over tile comfort` phrasing because the user gets a clearer stop/continue signal while dragging;
  - better than adding another hint row because it upgrades the existing drag-time feedback without adding more chrome;
  - better than changing the settled recovery actions in the same pass because this keeps the scope small and directly tied to the live resize interaction.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to add width-delta helpers for crowded and near-crowded panel states.
- Updated the live panel resize metric badge to use `Need ~Xpx narrower` / `~Xpx left` instead of `Xpx over tile comfort` / `Xpx before tile pressure`.
- Updated the live hint detail copy to describe the same width delta in a more explicit sentence while preserving the current panel width readout.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` with source assertions for the new helper functions and live-hint wording.

### Verification
- Electron renderer probe succeeded only against `http://localhost:5174/settings/agents` (`SpeakMCP`), so live tiled-panel verification remains blocked in this workflow.
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A targeted dependency-light `node --input-type=module` source-assertion script passed for the new panel width-delta helpers, live hint copy, and updated source-assertion test expectations.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` is still blocked in this worktree because the `vitest` binary is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).

### Still needs attention
- Once the actual sessions/panel tiled renderer is inspectable here, confirm that `Need ~Xpx narrower` feels more actionable than the previous wording during real drag gestures.
- If the live panel hint still feels a bit text-heavy at narrow widths, the next local pass should tune only the detail sentence before changing badge structure or adding any new control.
- The settled panel recovery chips and the live width-delta badge now intentionally use slightly different compact labels; a later consistency pass can verify that the distinction still feels clear in practice.

## Iteration 2026-03-08 — make live panel-resize detail copy more glanceable

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- `apps/desktop/src/renderer/src/components/resize-handle.tsx`
- live renderer probe via `electron_execute`

### Repro steps
1. Open the floating panel while tiled sessions are relevant (`Compare` or `Grid`).
2. Drag a width-affecting panel resize handle and watch the live hint that appears near the top of the panel.
3. Compare how quickly the detail sentence can be scanned while the panel is moving.
4. Before this change, the detail line used longer phrases like “get back under the tiled comfort width” and “before this panel starts crowding Compare/Grid,” which made the hint read heavier than the badge above it.

### UX problems found
- The previous iteration improved the live panel badge language, but the detail sentence under it was still relatively long for a drag-time hint.
- During resizing, the user already gets the width badge and the directional status label, so the longer detail line added reading cost without adding much extra decision value.
- On narrower panel widths, that extra wording was more likely to wrap and reduce glanceability.

### Investigation notes
- I reviewed `tiling-ux.md` first and chose the still-open live-hint readability follow-up rather than reopening broader tiled-layout or header-control work.
- I attempted a live Electron check before editing; the inspectable renderer is still `http://localhost:5174/settings/agents` (`SpeakMCP`) rather than the sessions/panel tiled workflow, so this remained a code-led iteration.
- Scope check: this is desktop-only floating-panel behavior; there is no equivalent mobile tiled-panel surface that needed matching changes.

### Assumptions
- In a drag-time hint, shorter directional copy is preferable to fuller explanatory prose because the user is actively resizing rather than reading documentation.
- Keeping the same hint structure and only tightening the detail sentence is acceptable because it improves scanability without changing the underlying panel recovery model.
- Using `Compare/Grid` directly in the detail sentence is clearer than the more abstract “tiled comfort width” phrasing for this live interaction.

### Decision and rationale
- Chosen fix: keep the existing live resize hint layout, but shorten the detail sentence to direct scan-friendly phrasing:
  - crowded: `Need ~Xpx narrower for Compare/Grid comfort`
  - limit: `At the 664px Compare/Grid comfort limit`
  - relief: `~Xpx left before Compare/Grid gets tight`
- Why this is better than the obvious alternatives:
  - better than keeping the longer wording because the user gets the same directional guidance with less reading while dragging;
  - better than introducing a new compact/expanded hint mode because the improvement stays local and predictable;
  - better than changing badges or actions in the same pass because it addresses the exact open UX issue with the smallest effective change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to shorten `getPanelTilingWidthDeltaDetail(...)` across crowded, limit, and relief states.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` source assertions to lock in the new live detail wording.

### Verification
- Electron renderer probe confirmed the inspectable target is still `http://localhost:5174/settings/agents` (`SpeakMCP`), so live tiled-panel verification remains blocked in this workflow.
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A targeted `node --input-type=module` source-assertion script passed for the new `getPanelTilingWidthDeltaDetail(...)` strings.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` is still blocked in this worktree because the `vitest` binary is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).

### Still needs attention
- Once the sessions/panel tiled renderer is directly inspectable, verify that the shorter detail sentence actually reads better in motion and does not feel too terse.
- If the live hint still feels crowded on narrower panel widths, the next local pass should trim or conditionalize the reset-instruction line before changing badges or actions.
- The live hint and settled recovery badges now both use width-delta language, but a later consistency pass can still decide whether their microcopy should converge further.

## Iteration 2026-03-08 — trim the live panel hint’s reset instruction so it reads faster after resize settles

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx`
- `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts`
- live renderer probe result from this workflow

### Repro steps
1. Resize the floating panel with a width-affecting handle while tiled sessions are relevant.
2. Release the drag so the live width-impact hint remains visible briefly after resize settles.
3. If the panel is still crowding Compare/Grid, read the instruction line under the badge and detail copy.
4. Before this change, that instruction line used fuller sentences like `Still too wide? Reset panel, hide the panel, or press Enter / double-click a handle`.

### UX problems found
- Even after shortening the live detail sentence, the helper line under it still carried too many words for a drag-adjacent hint.
- The longest post-resize version repeated ideas already obvious from the visible buttons and focused resize-handle context.
- That made the lower line compete with the newer, more glanceable detail sentence instead of supporting it.

### Investigation notes
- I reviewed the ledger first and took the exact follow-up noted in the previous iteration’s `Still needs attention` section, rather than widening scope to other tiled-layout behavior.
- The instruction copy is localized in `panel-resize-wrapper.tsx` via `panelTilingHintResetInstruction`, so this was a clean microcopy-only change with no layout-state impact.
- Live verification in the actual sessions/panel renderer remains blocked in this workflow because the inspectable Electron target is still not the tiled sessions surface.

### Assumptions
- In a transient resize hint, users benefit more from compact action reminders than from full sentence-style instructions.
- It is acceptable to rely on the surrounding UI for context, so `Enter / double-click` can stand without repeating `a handle` every time.
- Keeping `Reset panel` explicit while shortening the surrounding phrasing is preferable to making the entire instruction cryptic.

### Decision and rationale
- Chosen fix: keep the same three reset-instruction states, but compress each one:
  - base: `Enter / double-click resets to default size`
  - reset available: `Still tight? Reset panel or Enter / double-click`
  - reset + hide available: `Still tight? Reset panel, hide panel, or Enter / double-click`
- Why this is better than the obvious alternatives:
  - better than leaving the longer copy because it preserves the guidance while reducing reading load;
  - better than removing the instruction line entirely because keyboard and double-click recovery still deserve explicit disclosure;
  - better than adding another visual treatment because the issue was wording density, not missing affordance.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx` to shorten all `panelTilingHintResetInstruction` variants.
- Updated `apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` source assertions for the new compact instruction strings.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/panel-resize-wrapper.tsx apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A targeted `node --input-type=module` source-assertion script passed for the shortened `panelTilingHintResetInstruction` strings.
- `pnpm exec vitest run apps/desktop/src/renderer/src/components/panel-resize-wrapper.tiling-feedback.test.ts` is still blocked in this worktree because the `vitest` binary is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`).
- Live tiled-panel verification remains blocked because the inspectable Electron target in this workflow is not the sessions renderer.

### Still needs attention
- Once the sessions/panel tiled renderer is directly inspectable, verify that the hint now feels balanced as a whole during settle-state recovery, not just in static copy review.
- If the hint still feels busy on narrower panel widths, the next local pass should consider conditionally hiding either the instruction line or the width badge during the brief settled state rather than rewriting copy again.
- A later consistency pass can decide whether the settled panel-recovery buttons should reuse any of the same shorter `Still tight?` language in tooltips or titles.

## Iteration 2026-03-08 — fold compact transcript clipping context into the Recent activity header

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- lightweight source assertions and worktree test-script behavior

### Repro steps
1. Open the desktop sessions page with multiple active sessions in Compare or Grid.
2. Narrow the tiled area until a session tile enters compact transcript preview mode.
3. Use a session that has both active current-state items (`Live now`) and older transcript history.
4. Before this change, the compact transcript could stack a full-width hidden-history banner, then `Live now`, then `Recent activity` before showing the actual recent transcript lines.

### UX problems found
- The hidden-history notice sat above the compact transcript preview as its own banner, which spent valuable vertical space on meta-chrome before the user saw actual content.
- In narrow tiled states, that banner competed with the newer `Live now` / `Recent activity` hierarchy instead of supporting it.
- The recovery action (`Focus`) was useful, but it was visually tied to the top banner rather than the history section it actually relates to.

### Investigation notes
- I reviewed `tiling-ux.md` first and intentionally chose an area that had not been the focus of the most recent Single-view and floating-panel iterations.
- Code inspection showed the compact transcript already had a good separation between current-state items and recent history; the main issue was that the clipping notice still lived as a separate block above both sections.
- Live Electron validation remained unavailable in this workflow, so this was a code-led compact-density pass.

### Assumptions
- In compact tiles, preserving more room for transcript content is more valuable than keeping the hidden-history message as a standalone banner.
- Moving the clipping cue next to `Recent activity` is acceptable because hidden transcript history conceptually belongs to that section, not the overall tile body.
- Keeping the `Focus` recovery action visible is still worth the width, but it should live in the same row as the recent-history context rather than above the entire preview.

### Decision and rationale
- Chosen fix: remove the standalone hidden-history banner and move its context into the compact `Recent activity` header as a small badge plus the existing `Focus` recovery button.
- The hidden-history copy is now shorter in-flow metadata (`N hidden` on compact chrome, `N earlier hidden` on roomier limited tiles), while the hover title preserves the fuller explanation.
- Why this is better than the obvious alternatives:
  - better than keeping the top banner because the tile reaches meaningful transcript content sooner;
  - better than deleting the clipping cue entirely because recovery context and the focus action remain visible;
  - better than a broader transcript refactor because it fixes a local density problem without changing preview limits or tile state behavior.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so compact hidden-history metadata is rendered inside the `Recent activity` header row instead of as a standalone banner above the transcript.
- Shortened the visible hidden-history labels and kept the fuller explanation in a title via `getHiddenTileHistoryTitle(...)`.
- Added local `showCompactRecentActivityMetaRow` / `showCompactRecentActivitySection` guards so the history row still appears when history is clipped even if no recent transcript lines fit under `Live now`.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` source assertions to lock in the new compact-history header treatment.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts tiling-ux.md` passed.
- Dependency-free Node source assertions passed for the new compact transcript structure, shorter hidden-history labels, and updated source-test coverage.
- Attempted targeted verification: `pnpm run test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts` (from `apps/desktop`).
- Result: blocked by missing workspace dependencies in this worktree (`node_modules` missing; `tsup: command not found` during `pretest`).
- Live UI inspection remains blocked in this workflow because the inspectable Electron target is not currently the tiled sessions renderer.

### Still needs attention
- Once a runnable desktop sessions renderer is available, verify that the new `Recent activity` header row still feels balanced when compact tiles show both a badge and the `Focus` button at the narrowest practical widths.
- If that row still feels too busy in live use, the next compact-transcript pass should consider shortening the visible button label before changing transcript content limits again.
- Floating-panel width pressure still deserves direct live validation because it can push tiles into this compact transcript state more often.

## Iteration 2026-03-08 — drop duplicate reset overage badges from urgent compact session headers

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- targeted source assertions and desktop package verification commands

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with enough sidebar and/or floating-panel width pressure to trigger `Near stacked` or `Stacked to fit` recovery UI.
2. Narrow the available tiled area until the sessions header is in its compact breakpoint, but not yet the very-compact icon-heavy state.
3. Before this change, look at the urgent width hint and nearby recovery buttons together.
4. The header could simultaneously show a layout-delta badge like `Need ~96px` or `64px left` **and** a reset-button badge like `+64px`, duplicating the width story in two different places.

### UX problems found
- In compact urgent headers, the layout hint already explained the width problem, so repeating overage numbers inside the reset buttons spent pixels without adding much decision value.
- The duplicate badges made the recovery cluster feel busier exactly where the sessions header was already under space pressure.
- Mixing `Need ~Xpx` / `Xpx left` hint language with separate `+Xpx` action badges weakened visual hierarchy by making the buttons compete with the explanatory hint.

### Investigation notes
- I reviewed `tiling-ux.md` first and intentionally chose a still-open header-density issue instead of revisiting the most recent transcript and floating-panel copy iterations.
- Code inspection in `sessions.tsx` showed the stacked / near-stacked hint badges and the reset-action badges are derived independently, so the duplicate chrome could be removed with a very local guard.
- I kept the action titles unchanged because they already preserve the fuller per-source pressure details on hover, even when the visible badge is removed.
- Live renderer inspection remains unavailable in this workflow, so this was a code-led compact-header clarity pass.

### Assumptions
- In compact urgent states, users benefit more from one clear explanatory width badge plus lighter reset buttons than from seeing two visible numeric badges at once.
- It is acceptable to keep recovery-action badges on roomy headers and early-pressure states, because those states either have more space or lack the stronger stacked-width hint.
- Preserving the existing button labels and tooltips is preferable to rewriting copy, because the problem here was duplicate visible chrome rather than unclear recovery wording.

### Decision and rationale
- Chosen fix: keep the existing reset actions, but suppress their visible pressure badges whenever the sessions header is compact and the urgency is already `stacked` or `near-stacked`.
- The stacked / near-stacked hint remains the primary explanatory surface, while the reset buttons stay available and retain their richer tooltip detail.
- Why this is better than the obvious alternatives:
  - better than removing the hint badge because the layout-level explanation is the more immediately useful cue;
  - better than hiding all recovery badges everywhere because early-pressure and roomy headers still benefit from the extra metric;
  - better than rewriting multiple labels/tooltips because the issue was density and hierarchy, not the underlying recovery actions.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to add `showTilePressureRecoveryActionBadges`, which keeps reset-action badges visible except in compact `stacked` / `near-stacked` header states.
- Reused that guard for the combined, sidebar-only, and panel-only recovery button badge labels.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new badge-visibility guard and the urgent-compact badge suppression path.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- A targeted `node --input-type=module` source-assertion script passed for `showTilePressureRecoveryActionBadges` and the combined/sidebar/panel badge guards.
- `pnpm run test:run -- src/renderer/src/pages/sessions.layout-controls.test.ts` (from `apps/desktop`) is still blocked in this worktree because workspace dependencies are missing; `pretest` fails while building `@dotagents/shared` with `tsup: command not found`.
- Live UI inspection remains blocked in this workflow because the tiled desktop sessions renderer is not currently inspectable.

### Still needs attention
- Once the desktop sessions renderer is inspectable, verify that the lighter recovery buttons still feel actionable enough in compact urgent headers without the extra visible overage badges.
- If live use shows the compact urgent header still feels noisy, the next local pass should consider simplifying either the hide-panel action or the hint copy before changing layout-control structure.
- Roomier headers still show both hint and action metrics during stacked / near-stacked states; if that feels redundant in practice, a later pass can decide whether the same suppression should extend beyond compact widths.

## Iteration 2026-03-08 — make collapsed tiles feel intentionally compact instead of merely body-hidden

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with multiple visible tiles.
2. Collapse one tile, then quickly scan it alongside normal tiles.
3. Before this change, the tile body disappeared, but the remaining card chrome still mostly looked like the normal expanded header state.
4. That made collapse feel a little cosmetic: the tile was shorter, yet not clearly re-styled as an intentionally compact secondary state.

### UX problems found
- Collapsed tiles still used the same roomy header spacing as expanded tiles, so the density gain from collapsing felt smaller than it should.
- The collapsed header kept the usual header treatment, which weakened the distinction between `active tile` and `collapsed summary` states.
- Even after earlier collapsed-state copy improvements, the overall tile still read a bit like a truncated card rather than a deliberately compact parked tile.

### Investigation notes
- I reviewed the ledger first and deliberately chose a collapsed-tile density/chrome pass rather than revisiting the most recent session-header pressure work.
- `agent-progress.tsx` already owned the tile-level collapsed header structure, so this could be improved locally without touching session ordering, resize logic, or layout-state storage.
- A quick Electron inspection attempt in this workflow did not provide a usable desktop sessions renderer view, so this iteration remained code-led.

### Assumptions
- When a tile is collapsed, users primarily need quick recognition and recovery, not full-sized active-session chrome.
- Slightly denser collapsed spacing is acceptable because the tile body is hidden and the header becomes the entire representation of that session.
- Re-styling only the collapsed state is preferable to changing all tile headers, because the UX issue was state distinction and density, not the baseline expanded header design.

### Decision and rationale
- Chosen fix: keep the existing collapse interaction and copy, but make the collapsed presentation more intentionally compact by switching the tile card to `h-auto`, tightening collapsed header padding, removing the expanded-only header divider treatment, and giving the collapsed badge/hint a slightly stronger slate-toned hierarchy.
- Why this is better than the obvious alternatives:
  - better than adding more collapsed controls because the problem was visual state quality, not missing capability;
  - better than a broader tile-header redesign because the issue was isolated to the collapsed state;
  - better than leaving the prior styling in place because the new chrome makes collapsed tiles feel more purposefully parked and less like partially hidden active cards.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - make the tile card use `h-auto` while collapsed,
  - give collapsed headers a denser `py-1.5` layout and distinct slate-tinted background,
  - keep the expanded-state header styling unchanged,
  - and strengthen the collapsed badge + hint colors so the parked state reads more intentionally.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions covering the collapsed `h-auto` container behavior plus the new collapsed-header, badge, and hint styling.
- While validating, corrected two malformed compact-option helper calls in `apps/desktop/src/renderer/src/pages/sessions.tsx` so the stacked / near-stacked width badges parse correctly again.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts apps/desktop/src/renderer/src/pages/sessions.tsx tiling-ux.md` passed.
- A targeted `node --input-type=module` source-assertion script passed for the collapsed `h-auto` card state and the new collapsed-header / badge / hint styling.
- A second targeted `node --input-type=module` source-assertion script passed for the repaired `getResponsiveStackedWidthDeficitBadgeLabel(...)` / `getResponsiveStackedWidthHeadroomBadgeLabel(...)` call syntax in `sessions.tsx`.
- `pnpm run test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts` (from `apps/desktop`) is still blocked in this worktree because workspace dependencies are missing; `pretest` fails while building `@dotagents/shared` with `tsup: command not found`.
- `pnpm run typecheck:web` (from `apps/desktop`) still cannot complete in this worktree because the inherited Electron Toolkit TS config is unavailable locally (`@electron-toolkit/tsconfig/tsconfig.web.json` missing) and package installation has not been run here. Re-running it after the `sessions.tsx` syntax repair no longer reports those parse errors.

### Still needs attention
- Once the desktop sessions renderer is inspectable, confirm the denser collapsed header still feels tappable/clickable enough in narrow `Compare` / `Grid` states.
- If live use shows collapsed tiles still blending in too much, the next local follow-up should tune collapsed-state contrast at the wrapper/header boundary before adding any more text.
- A future pass can decide whether compact collapsed tiles should also further simplify secondary header actions in very narrow widths, but that should be validated in live renderer use before changing controls.

## Iteration 2026-03-08 — make edge tile resize affordances self-describing before drag

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/session-grid.tsx`
- `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.resize-behavior.test.ts`
- `apps/desktop/src/renderer/src/components/session-grid.reorder-resize-interplay.test.ts`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with more than one visible tile.
2. Move the pointer around a tile edge without already knowing where resize interactions live.
3. Before this change, the corner handle eventually read like an action, but the right-edge and bottom-edge resize rails mostly presented as subtle lines.
4. In dense tiled layouts, that made width and height resizing feel more discoverable to experienced users than to first-pass scanning users.

### UX problems found
- The tile corner handle had a visible hover/focus label, but the width and height edge handles did not, so resize affordances were uneven.
- The right and bottom resize rails could read like generic separators instead of actionable tile controls.
- This was especially easy to miss in denser layouts where card chrome, reorder affordances, and resize rails all compete for attention.

### Investigation notes
- I reviewed `tiling-ux.md` first and intentionally chose a new resize-discoverability pass instead of repeating the most recent collapsed-tile or compact-header investigations.
- `session-grid.tsx` already owned the tiled resize handles and their pointer/keyboard affordance logic, so the improvement could stay local.
- Existing tests already used source assertions for resize affordances, which made this a good fit for a small, targeted extension instead of a broader refactor.
- Live desktop inspection remains unavailable in this workflow, so this was a code-led affordance pass.

### Assumptions
- A short transient label like `Width` / `Height` is enough to make the edge handles legible without adding persistent chrome.
- It is acceptable for the edge labels to appear only on direct handle hover/focus, rather than on general tile hover, because showing all resize labels at once would add clutter.
- Hiding the edge labels during active resize is preferable to keeping them visible, because the existing live size feedback pill already becomes the stronger signal while dragging.

### Decision and rationale
- Chosen fix: keep the existing resize rails, hit targets, keyboard support, and reset behavior, but add small hover/focus-only visible labels to the width and height edge handles.
- The corner handle keeps its existing action label, while the edge rails now describe their specific dimension so the resize system feels more consistent.
- Why this is better than the obvious alternatives:
  - better than adding always-visible resize text because persistent chrome would make tiles noisier in dense multi-session states;
  - better than enlarging or restyling every resize control because the actual usability gap here was discoverability, not basic target size;
  - better than moving resize controls into tile headers because local edge affordances preserve direct manipulation and avoid more header competition.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` to:
  - add `getTileResizeHandleVisibleLabel(...)` and `getTileResizeHandleVisibleLabelClasses(...)`,
  - generate separate visible labels for width, height, and corner resize handles,
  - show `Width` / `Resize width` and `Height` / `Resize height` pills on direct edge-handle hover or keyboard focus,
  - and keep those new edge labels hidden during active resizing so the existing live size feedback pill remains the primary signal.
- Updated `apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts` with source assertions covering the new edge-label helpers, visible-label markers, and handle-specific hover/focus styles.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/session-grid.tsx apps/desktop/src/renderer/src/components/session-grid.resize-affordance.test.ts tiling-ux.md` passed.
- A targeted `node --input-type=module` source-assertion script passed for the new width/height visible-label helpers, edge-handle markers, and handle-specific hover/focus label classes.
- `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/session-grid.resize-affordance.test.ts src/renderer/src/components/session-grid.resize-behavior.test.ts src/renderer/src/components/session-grid.reorder-resize-interplay.test.ts` is still blocked in this worktree because workspace dependencies are missing; `pretest` fails while building `@dotagents/shared` with `tsup: command not found`.
- `pnpm --filter @dotagents/desktop typecheck:web` is still blocked in this worktree because local dependencies are not installed; the inherited Electron Toolkit TS config cannot be resolved (`@electron-toolkit/tsconfig/tsconfig.web.json` missing).
- Live renderer verification remains blocked in this workflow because the tiled desktop sessions UI is not currently inspectable.

### Still needs attention
- Once the desktop sessions renderer is inspectable, confirm the new width and height labels feel noticeable enough without covering important tile content on smaller windows.
- If live use shows the labels still feel too subtle, the next local pass should adjust timing/contrast before changing the resize model itself.
- If live use shows the edge labels and corner label still feel visually inconsistent, a later pass can decide whether the corner label should also move to direct-handle hover/focus instead of general tile hover.

## Iteration 2026-03-08 — keep collapsed tiles recognition-first by overflowing extra header actions sooner

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Electron renderer probe via `electron_execute`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with multiple visible tiles.
2. Collapse a tile that still has at least two secondary actions available (for example `Single view` and `Minimize session`).
3. Before this change, the tile became visually shorter, but the header still exposed the same fuller inline action cluster as an expanded tile.
4. On already-tight tiled layouts, that made a collapsed tile feel less like a parked summary and more like a compressed active card.

### UX problems found
- Collapsed tiles are meant to optimize for quick recognition and recovery, but multiple inline secondary actions still competed with the title and collapsed-state cues.
- That reduced the scanability win from collapsing: the tile body disappeared, yet the header kept spending width on lower-priority controls.
- The result was especially awkward for collapsed tiles that were not technically at the compact-width breakpoint, because they still showed a roomier action cluster despite being in a deliberately compact state.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose a fresh collapsed-tile control-density pass instead of repeating the immediately previous resize-affordance work.
- The currently inspectable Electron renderer target in this workflow is `http://localhost:5173/settings/agents` (`SpeakMCP`), not the desktop sessions page, so this iteration remained code-led.
- Code inspection showed `AgentProgress` already had the exact local control point needed: it computes a secondary-action count for the existing overflow menu, but that logic previously only activated for compact-width tile chrome.

### Assumptions
- When a tile is collapsed, `Expand` is the primary recovery action and should stay visually obvious; `Single view` and `Minimize session` become secondary.
- Reusing the existing overflow menu is preferable to inventing a collapsed-only action pattern, because it reduces chrome without teaching users a new control model.
- It is acceptable to keep destructive/terminal actions (`Stop` / `Dismiss`) directly visible in this pass, because the main density problem was the extra focus/minimize cluster rather than every action in the header.

### Decision and rationale
- Chosen fix: when a tile is collapsed and has multiple secondary actions, route those extra actions into the existing overflow menu even if the tile is not yet in compact-width chrome.
- Why this is better than the obvious alternatives:
  - better than hiding the actions entirely because capability is preserved with less noise;
  - better than creating a new collapsed-only menu or toolbar because the fix stays local and consistent with the existing tile action model;
  - better than waiting for the compact breakpoint because collapsed state itself is already an explicit request for a calmer, recognition-first tile.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - rename the secondary action count to `tileOverflowActionCount`,
  - add `shouldUseCollapsedTileOverflowMenu`,
  - combine compact-width and collapsed-state overflow logic via `shouldUseTileOverflowMenu`,
  - and reuse the existing overflow trigger/title/ARIA path for collapsed tiles that would otherwise show multiple secondary inline actions.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions covering the new collapsed-state overflow gate and renamed shared overflow helpers.

### Verification
- Electron renderer probe succeeded, but confirmed the inspectable target is still `http://localhost:5173/settings/agents` (`SpeakMCP`) rather than the tiled sessions UI, so live sessions-page verification remains blocked in this workflow.
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts tiling-ux.md` passed.
- A targeted `node --input-type=module` source-assertion script passed for the new collapsed-overflow gate, shared overflow helper names, and updated direct-action guards.
- `pnpm run test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts` (from `apps/desktop`) is still blocked in this worktree because workspace dependencies are missing; `pretest` fails while building `@dotagents/shared` with `tsup: command not found`.

### Still needs attention
- Once the desktop sessions renderer is inspectable, verify that the collapsed header now feels calmer without making the overflow button too easy to miss on medium-width tiles.
- If live use shows the remaining inline `Stop` / `Dismiss` action still feels too dominant in collapsed state, the next local pass should evaluate that specific control before changing the broader header model.
- A later live pass should confirm that the collapsed-state overflow threshold still feels right when the sidebar and floating panel are both consuming width.

## Iteration 2026-03-08 — surface adaptive layout state on the selected condensed layout button

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/mobile/src/screens/SessionListScreen.tsx`
- `apps/mobile/src/screens/ChatScreen.tsx`

### Repro steps
1. Open the desktop sessions page with multiple sessions in `Compare` or `Grid`.
2. Narrow the available sessions width until the header condenses the layout selector down to the selected button label.
3. Hit a state where the chosen layout is adaptive rather than literal, such as `Compare` stacked into one column or a compare/grid layout temporarily showing one expanded tile because only one session is visible.
4. Before this change, the selected button still mostly read as only `Compare` / `Grid`, while the more truthful adaptive state could be hidden or deprioritized by tighter header conditions.

### UX problems found
- In condensed headers, the selected layout button can become the main visible layout-state affordance, but it previously did not reflect adaptive states directly.
- That made width-pressure cases feel less predictable: users could see `Compare` selected while the visible result was a stacked column, which weakens trust in the layout controls.
- The existing chip and recovery hint logic already explained the state elsewhere, but the control used to switch layouts still felt less self-descriptive than it should.

### Investigation notes
- I reviewed the latest ledger first and deliberately chose layout-switching clarity rather than repeating the most recent collapsed-header or resize-affordance passes.
- Code inspection showed the smallest local leverage point was the existing condensed selector path in `sessions.tsx`: it already decides when only the selected layout label should remain visible.
- Quick scope checks on the mobile session/chat screens showed no equivalent tiled layout selector, so this pass stayed desktop-only.
- Live sessions-page verification was not practical in this workflow because the tiled desktop renderer is not currently inspectable here.

### Assumptions
- When the header condenses, the selected layout button becomes important enough that it should communicate adaptive state directly instead of relying only on surrounding helper chips.
- A small secondary badge is preferable to renaming the selected button itself, because users still need to recognize the underlying chosen mode (`Compare`, `Grid`, `Single`) while also understanding the temporary adaptive state.
- It is acceptable to limit the badge to the condensed-selector case, because roomier headers already have other visible context such as the current-layout chip.

### Decision and rationale
- Chosen fix: add a compact adaptive-state badge (for example `Stacked` or `One visible`) directly on the selected layout button when the layout selector is condensed and the active layout is currently adaptive.
- Why this is better than the obvious alternatives:
  - better than renaming the selected button to only `Stacked` / `One visible`, because that would hide which persistent layout mode is actually selected;
  - better than adding another separate chip, because the selector itself is the most relevant place to explain layout state when space is tight;
  - better than showing the badge all the time, because the extra chrome is only necessary when the condensed selector becomes the primary visible layout affordance.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to:
  - derive `selectedAdaptiveLayoutButtonBadgeLabel` from the existing adaptive layout state,
  - detect `showSelectedAdaptiveLayoutBadge` only for the selected condensed button,
  - and render a small dashed inline badge on that active layout button so the selector stays truthful under stacked / single-visible fallback conditions.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions covering the new condensed-button adaptive badge path and marker.

### Verification
- A targeted `node` source-assertion script passed for the new selected adaptive layout badge fragments in both `apps/desktop/src/renderer/src/pages/sessions.tsx` and `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts tiling-ux.md` passed.
- `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts` is blocked in this worktree because the local `vitest` binary is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL: Command "vitest" not found`).
- `pnpm --filter @dotagents/desktop exec tsc --noEmit -p tsconfig.web.json --composite false` is blocked in this worktree because the inherited Electron Toolkit TS config cannot be resolved (`@electron-toolkit/tsconfig/tsconfig.web.json` missing).

### Still needs attention
- Once the tiled sessions page is inspectable, confirm the selected-button badge feels noticeable but not busy when the header is already showing stacked or near-stacked recovery hints.
- If live use shows the condensed button is still too ambiguous, the next local pass should evaluate whether the selected layout button also needs a slightly stronger active-state treatment under width pressure.
- A later pass can decide whether non-condensed adaptive states should ever surface inside the selector itself, but only if live testing shows the current chip-based explanation is still too easy to miss.

## Iteration 2026-03-08 — strengthen the selected condensed layout button when it is carrying adaptive state

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/pages/sessions.tsx`
- `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts`
- `apps/mobile/src/screens/ChatScreen.tsx` (scope check via retrieval only)
- `apps/mobile/src/screens/SessionListScreen.tsx` (scope check via retrieval only)

### Repro steps
1. Open the desktop sessions page with multiple visible sessions in `Compare` or `Grid`.
2. Narrow the sessions header until the layout selector condenses to mostly the selected button label.
3. Reach an adaptive state such as `Compare` / `Grid` stacking to one column or temporarily showing one visible tile.
4. Compare how clearly the selected layout control communicates “this is the active mode, but it is adapting right now” versus the surrounding recovery chips and hints.

### UX problems found
- The condensed selected layout button already showed the adaptive badge, but the button itself still used the same generic selected treatment as a normal non-adaptive state.
- That left too much explanatory burden on the tiny badge alone when the condensed selector was the main visible layout affordance.
- In tight headers, the selected control could still read as slightly tentative next to stronger stacked / tight recovery chips.

### Investigation notes
- I reviewed the latest ledger first and intentionally chose the next unresolved layout-control clarity gap instead of repeating another panel-resize or tile-density pass.
- A live Electron inspection was attempted first. An inspectable renderer was available, but it was on a `SpeakMCP` settings surface rather than the tiled sessions page, and a route-switch attempt did not expose the sessions UI in this workflow.
- Mobile scope check: retrieval confirmed the mobile app uses session-list and chat screens rather than the desktop tiled layout selector, so no equivalent mobile change was needed for this pass.

### Assumptions
- The selected condensed layout button should get stronger emphasis only when it is carrying adaptive state, not for every selected layout state.
- A modest active-state tint/ring is preferable to adding more visible header copy because the selector itself is already the right place to explain the current mode.
- It is acceptable to expose a small DOM marker for this state because it improves future UI inspection and source-based test coverage without changing behavior.

### Decision and rationale
- Chosen fix: keep the adaptive badge, but also give the selected condensed adaptive layout button a slightly stronger active treatment with an inset ring and tinted state.
- Why this is better than the obvious alternatives:
  - better than relying on the badge alone, because the whole control now reads as intentionally active in adaptive states;
  - better than adding another helper chip, because it strengthens the control users are already looking at;
  - better than restyling every selected layout button, because the extra emphasis is limited to the ambiguous condensed adaptive case.

### Code changes
- Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` to derive `showSelectedAdaptiveLayoutEmphasis` alongside the existing condensed adaptive badge path.
- Added `data-session-layout-selected-adaptive={mode}` on the selected condensed adaptive button for future inspection and test targeting.
- Strengthened that button’s active styling with a subtle blue-tinted background and inset ring while keeping the normal selected style for non-adaptive states.
- Updated `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` with source assertions for the new emphasis path and marker.

### Verification
- Focused source verification passed via `node` assertions for the new `showSelectedAdaptiveLayoutEmphasis` path and `data-session-layout-selected-adaptive` marker.
- `git diff --check -- apps/desktop/src/renderer/src/pages/sessions.tsx apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts`
- Result: still blocked by missing workspace test dependencies in this worktree (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL: Command "vitest" not found`).

### Still needs attention
- Once the actual tiled sessions page is inspectable, confirm the stronger selected state feels clearer without competing too much with stacked / tight recovery hints in the same header row.
- If live use shows the control is still slightly ambiguous, the next local pass should tune badge contrast or selected-button padding before adding any new hint chrome.
- A broader end-to-end pass is still needed across real window widths, sidebar widths, and floating-panel states so the selector, recovery hints, and tile layout behavior can be judged together rather than in source alone.

## Iteration 2026-03-08 — move collapsed tile Stop/Dismiss into overflow so parked headers stay calmer

### Areas inspected
- `tiling-ux.md`
- `apps/desktop/src/renderer/src/components/agent-progress.tsx`
- `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Electron renderer probe via `electron_execute`

### Repro steps
1. Open the desktop sessions page in `Compare` or `Grid` with multiple visible tiles.
2. Collapse a tile that is still active or has just completed.
3. Before this change, the tile already hid its body and could overflow `Single view` / `Minimize`, but it still kept the terminal `Stop` or `Dismiss` action inline at the far right of the parked header.
4. In dense tiled layouts, that made collapsed cards feel a little more operational and accident-prone than recognition-first.

### UX problems found
- The collapsed header had already been simplified, but an always-inline terminal action still visually competed with the title, status, and collapsed-state cues.
- On parked tiles, `Stop` / `Dismiss` remained the most click-sensitive action even though collapse is supposed to emphasize quick recognition and later recovery.
- This made collapsed tiles feel less intentionally “parked” than they should, especially when several tiles were visible at once.

### Investigation notes
- I reviewed `tiling-ux.md` first and deliberately chose the still-open collapsed-header action issue instead of repeating the most recent condensed layout-selector work.
- `AgentProgress` already had the local decision point needed: collapsed tiles were using the existing overflow menu for some secondary actions, while the terminal action still bypassed that path.
- I attempted live inspection first, but the inspectable Electron renderer in this workflow is still not the desktop tiled sessions surface, so this remained a code-led iteration.

### Assumptions
- When a tile is collapsed, the main job of the header is recognition plus low-friction reopen/recover, not exposing every terminal action inline.
- Reusing the existing overflow menu is better than inventing a new collapsed-only control pattern because it keeps behavior coherent and local.
- It is acceptable for `Stop` / `Dismiss` to take one extra click in collapsed state because the tile is already in a lower-attention parked mode and expanded tiles keep the direct path.

### Decision and rationale
- Chosen fix: when a tile is collapsed, route the terminal `Stop` / `Dismiss` action into the existing overflow menu instead of leaving it inline in the parked header.
- The overflow menu now adds a separator before the terminal action when the menu also contains `Single view` or `Minimize`, so the more consequential action still reads distinctly.
- Why this is better than the obvious alternatives:
  - better than removing the terminal action from collapsed tiles entirely because capability stays available;
  - better than keeping it inline because the header becomes calmer and less accident-prone;
  - better than a broader tile-header redesign because this fixes the specific remaining dominance problem with a very local change.

### Code changes
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to:
  - add `shouldOverflowCollapsedTerminalTileAction`,
  - extend `shouldUseCollapsedTileOverflowMenu` so collapsed active/completed tiles can use overflow even when the terminal action is the main extra control,
  - add an optional overflow separator before terminal actions,
  - render `Stop agent` and `Dismiss session` inside the dropdown for collapsed tiles,
  - and suppress the inline terminal button only for that collapsed-overflow case.
- Updated `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` with source assertions covering the new collapsed terminal-action overflow path, separator, and inline-button guards.

### Verification
- `git diff --check -- apps/desktop/src/renderer/src/components/agent-progress.tsx apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts tiling-ux.md` passed.
- A targeted `node --input-type=module` source-assertion script passed for the new collapsed terminal-action overflow guard, separator logic, dropdown items, and inline-button suppression path.
- `pnpm exec tsc -p apps/desktop/tsconfig.json --noEmit` passed.
- Attempted targeted verification: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tile-layout.test.ts`
- Result: blocked in this worktree because the local `vitest` binary is unavailable (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL: Command "vitest" not found`).
- Electron renderer probing still did not provide the real tiled sessions UI here, so live sessions-page validation remains unavailable in this workflow.

### Still needs attention
- Once the actual tiled sessions page is inspectable, confirm that hiding `Stop` / `Dismiss` behind overflow on collapsed tiles still feels discoverable enough for users who park active sessions.
- If live use shows the overflow menu now feels too easy to miss on collapsed tiles, the next local pass should improve the overflow trigger cue or tooltip before reconsidering inline actions.
- A later end-to-end pass should evaluate this collapsed-header change together with sidebar width, floating-panel width, and very dense multi-tile states rather than judging it only in source.