# Sub-Agents Mobile View Ledger

## Purpose

- Track focused, shippable improvements to the mobile sub-agents experience.
- Review this file before each iteration to avoid redoing recently covered areas without new evidence.
- Keep notes on current behavior, constraints, decisions, fixes, validation, and next checks.

## Mobile surfaces in scope

- `apps/mobile/src/ui/AgentSelectorSheet.tsx` — chat/session header entry point for agent switching.
- `apps/mobile/src/screens/SettingsScreen.tsx` — `Agents` and `Agent Loops` sections.
- `apps/mobile/src/screens/AgentEditScreen.tsx` — agent editing flow.
- `apps/mobile/src/screens/LoopEditScreen.tsx` — loop editing flow.

## Workflow notes

- Mobile dev workflow confirmed from repo scripts/docs:
  - `pnpm --filter @dotagents/mobile web`
  - repeatable local inspection used: `pnpm --filter @dotagents/mobile exec expo start --web --port 19007`
- Prefer Expo Web narrow-screen inspection first, then add focused source-level tests and TypeScript verification.
- Keep changes local and high-signal; avoid broad redesigns.

## Known layout constraints

- The mobile app uses a stacked navigation flow with sub-agent controls split between chat headers and long settings accordions.
- Narrow screens (~390px wide) compress header controls and make dense lists harder to scan.
- Agent loops can become text-heavy quickly because prompt content is shown inline.

## Iteration log

### 2026-03-08 — Iteration 1: clarify the mobile agent selector empty state

- Status: shipped locally.
- Areas reviewed first:
  - `AgentSelectorSheet`
  - `Settings > Agents`
  - `Settings > Agent Loops`
- Live inspection:
  - Ran `pnpm --filter @dotagents/mobile exec expo start --web --port 19007`.
  - Inspected Expo Web at ~390px wide.
  - Confirmed `Settings > Agents` listed multiple configured agents while the chat header selector sheet could show an empty state.
- Current behavior observed before the fix:
  - Chats header exposed the current agent.
  - Tapping it opened `AgentSelectorSheet`.
  - On the inspected mobile view, the sheet said `No agents available` / equivalent empty copy despite the app still showing a current agent and the settings screen listing configured agents.
- Issue selected:
  - The selector empty state felt contradictory and gave no clear next step, reducing trust in the main mobile agent-switching affordance.
- Decision:
  - Do not redesign the selector.
  - Keep the fix local to the sheet: make the state self-explanatory, preserve current-agent context, and provide a direct route back to Settings.
- Implemented fix:
  - Updated `apps/mobile/src/ui/AgentSelectorSheet.tsx` to:
    - refresh the current profile context when the sheet opens,
    - add a mode-aware subtitle,
    - show a `Current: ...` badge in the empty state,
    - replace the vague empty text with mode-aware guidance,
    - add an `Open Agent Settings` action with a mobile-sized touch target.
  - Added `apps/mobile/tests/agent-selector-sheet.test.js` covering the new behavior.
- Validation evidence:
  - `node --test apps/mobile/tests/agent-selector-sheet.test.js` ✅
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅
  - Re-verified in Expo Web mobile viewport that the sheet now shows:
    - explanatory subtitle,
    - current-agent badge,
    - improved empty-state copy,
    - `Open Agent Settings` navigation action.
- Remaining nearby issues noted, not addressed this iteration:
  - Header touch targets still look tight on narrow screens.
  - `Settings > Agents` rows feel cramped once toggles and metadata are visible.
  - `Agent Loops` remains dense and text-heavy for mobile scanning.
- Next checks:
  - Inspect the non-empty selector state on a real configured server with multiple selectable agents.
  - Tighten touch targets in the chat/session headers if still below comfortable mobile size.
  - Reduce density in `Settings > Agent Loops` with a local readability improvement.

### 2026-03-08 — Iteration 2: make loop actions reliably tappable on mobile

- Status: shipped locally.
- Areas reviewed first:
  - this ledger
  - `Settings > Agent Loops`
  - `Settings > Agents`
  - chat header selector trigger sizing
- Live inspection before the fix:
  - Reused Expo Web at `http://localhost:19007` in a ~390px mobile viewport.
  - Confirmed `Settings > Agent Loops` was the highest-friction sub-agents surface on narrow screens.
  - Measured a representative loop action rail before changes at roughly:
    - toggle `40x20`
    - `Run` `43x22`
    - `Delete` `60x22`
  - The right-side action rail was compressed beside long loop copy, making the destructive action especially easy to mis-tap.
- Issue selected:
  - Loop action controls were below comfortable mobile touch-target size and visually crowded for a dense, high-consequence row.
- Decision:
  - Keep the fix local to the loop action rail.
  - Do not redesign loop cards yet.
  - Reuse the shared mobile `createMinimumTouchTargetStyle` pattern instead of inventing a new layout helper.
- Implemented fix:
  - Updated `apps/mobile/src/screens/SettingsScreen.tsx` to:
    - give the loop toggle wrapper, `Run`, and `Delete` a shared minimum `44px` touch target,
    - add consistent vertical spacing between loop actions,
    - add explicit accessibility roles/labels/hints for the loop toggle, run, and delete actions.
  - Added `apps/mobile/tests/settings-loop-actions-mobile.test.js` covering the touch-target and accessibility wiring.
- Validation evidence:
  - `node --test apps/mobile/tests/settings-loop-actions-mobile.test.js` ✅
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit` ✅
  - Re-verified in Expo Web mobile viewport after the fix:
    - loop toggle hit target `71x44`
    - `Run` `71x44`
    - `Delete` `71x44`
    - controls now expose explicit accessible names/roles in the rendered web accessibility tree.
- Remaining nearby issues noted, not addressed this iteration:
  - The visual loop switch still exposes an extra unnamed inner focusable switch node on web, so accessibility semantics are improved but not fully clean yet.
  - Loop cards remain text-heavy overall; readability can still improve without a broad redesign.
  - `Settings > Agents` action rails still feel tight on narrow screens.
- Next checks:
  - Remove the duplicate unnamed inner loop switch exposure on web without regressing the larger hit target.
  - Reduce loop-card text density with a local hierarchy improvement once action semantics are clean.
  - Revisit the `Settings > Agents` action rail for similar touch-target improvements.