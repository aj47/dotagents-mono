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
