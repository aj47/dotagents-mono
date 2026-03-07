# Mobile App Improvement Ledger

## Purpose

- Track mobile investigations, fixes, regressions, and next checks.
- Prefer one small, shippable improvement per iteration.
- Use Expo Web when practical for repeatable inspection.

## Recent Iterations

### 2026-03-07 — Iteration 1: restore nested-screen back navigation

- Status: completed
- Area:
  - mobile navigation header behavior in `apps/mobile/App.tsx`
  - live flow inspected in Expo Web: `Settings -> Connection -> back`
- Why this area:
  - `ui-audit.md` already covered recent mobile Settings layout work, so this pass avoided repeating those top-level responsiveness fixes.
  - Expo Web inspection exposed a functional first-run usability bug on an unlogged secondary screen: opening `Connection` removed any usable in-app back navigation.
- What was investigated:
  - current mobile web/dev workflow via `pnpm --filter @dotagents/mobile web`
  - stack header config in `apps/mobile/App.tsx`
  - live Expo Web behavior on the initial `Settings` screen and nested `Connection` screen
- Findings:
  - the stack navigator set a custom `headerLeft` logo for every screen, which suppressed the default native-stack back button on nested screens like `Connection`
  - on mobile web this trapped the user on secondary screens unless another path happened to navigate them away
- Change made:
  - kept the branded logo only on the root `Settings` screen
  - let nested screens fall back to the default back button/header behavior
  - added a lightweight regression test in `apps/mobile/tests/navigation-header.test.js`
- Verification:
  - `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - `node --test apps/mobile/tests/navigation-header.test.js`
  - live Expo Web regression check at `http://localhost:8088`:
    - opened `Connection settings`
    - confirmed a visible back control on `Connection`
    - confirmed it returns to `Settings`
- Follow-up checks:
  - inspect `ConnectionSettingsScreen.tsx` for clearer first-run save/test feedback when the API key is empty; current `Test & Save` behavior is ambiguous
  - audit web accessibility/tap targets for text-only actions in Connection and TTS voice picker flows (`Show/Hide`, `Reset to default`, modal close, voice rows)
  - investigate the Expo Web runtime errors seen during verification, especially `normalizeApiBaseUrl is not a function` and `Unexpected text node ... child of a <View>`

## Candidate Areas

- Connection screen validation and feedback
- Session list navigation and empty/loading states
- Chat composer responsiveness and accessibility
- Expo Web runtime warnings/errors and web-specific reliability