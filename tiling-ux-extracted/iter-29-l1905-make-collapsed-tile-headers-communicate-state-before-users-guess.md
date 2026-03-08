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
