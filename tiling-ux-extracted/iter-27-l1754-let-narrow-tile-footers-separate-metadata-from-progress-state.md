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
