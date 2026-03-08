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
