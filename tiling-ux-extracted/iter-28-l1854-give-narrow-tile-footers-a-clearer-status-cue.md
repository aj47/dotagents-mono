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
