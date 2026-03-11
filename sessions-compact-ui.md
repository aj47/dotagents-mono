# Sessions compact UI ledger

Last updated: 2026-03-11

## Desktop sessions surfaces checked

- [x] Main desktop sessions route `/` — empty active-sessions state with left sidebar recent sessions visible — 2026-03-10
- [x] Desktop empty-state `Recent Sessions` list at `1440x900` — populated with real local conversation history; row width, title truncation, pin/timestamp chrome, and hover/focus affordances inspected live in the main `/` renderer target — 2026-03-10
- [x] Desktop left sidebar `Sessions` rail at `1440x900` — expanded past-session rows, `Load more sessions`, and the boundary between session-picking vs. Agents/Settings inspected live in the Electron renderer — 2026-03-11
- [ ] Desktop active session tile grid with populated sessions
- [ ] Desktop session tile selected / hovered / focused / pressed states
- [ ] Desktop session tile overflow / badges / timestamps / previews under populated state
- [ ] Desktop empty / loading / syncing / error / offline variants beyond current empty-state check
- [ ] Desktop narrow-window and awkward-aspect-ratio sessions behavior

## Mobile sessions surfaces checked

- [x] Mobile Expo web `Sessions` screen — empty state after enabling Chats navigation — 2026-03-10
- [x] Mobile Expo web `Sessions` screen — populated synthetic session-list state with long titles/previews and one active row — 2026-03-10
- [x] Mobile Expo web `Chats` list at `390x844` — populated real local sessions inspected live for top chrome, row hierarchy, timestamp weight, previews, and destructive adjacent controls; no code change shipped in this pass — 2026-03-11
- [x] Mobile Expo web `Chats` list at `390x844` — populated seeded sessions re-checked live with matched before/after screenshots; header action-row hierarchy updated so `+ New Chat` stays primary while `Clear all` drops into lower-emphasis count context — 2026-03-11
- [ ] Mobile loading / syncing / error / offline states
- [ ] Mobile very small width / larger mobile width comparisons
- [ ] Mobile delete / long-press / overflow-adjacent affordances

## Shared issues across desktop/mobile

- [ ] None confirmed yet

### Platform-specific notes

- [x] `desktop-empty-recent-session-row-chrome` is desktop-specific so far: the desktop empty-state `Recent Sessions` list had a narrow max width plus always-visible row-level pin chrome, while the mobile sessions list already uses full-width rows and has no equivalent per-row pin affordance.
- [x] `desktop-sidebar-session-recognition` is desktop-specific so far: the left sidebar compresses past-session picking into a narrow rail next to Agents/Settings, while the mobile chats list already gives full-width rows and clearer section isolation.

## Not yet checked

- [ ] Desktop populated tile grid density and hierarchy
- [ ] Desktop tile selection safety / clickability under hover chrome
- [ ] Desktop and mobile offline/error/syncing states
- [ ] Desktop and mobile search / sort / filter / overflow affordances where present
- [ ] Desktop and mobile high-volume session-list behavior
- [ ] Mobile top-of-list action-row behavior at narrower-than-390px widths and with active syncing spinner

## Reproduced issues

- [x] `mobile-session-row-density`: Reproduced on mobile Expo web at `390x844` with seeded long-title/long-preview sessions; rows measured roughly `98–124px` tall before the fix, so only about five conversations fit above the rapid-fire control.
- [x] `mobile-chats-action-row-hierarchy`: Reproduced on mobile Expo web `Chats` at `390x844` with a seeded populated list; the header placed `Clear All` as the only secondary control opposite `+ New Chat`, so the destructive affordance read like a peer action before users had even scanned how many chats existed.
- [x] `desktop-empty-recent-session-row-chrome`: Reproduced on desktop at `1440x900` in the empty-state `Recent Sessions` list; the list was capped to roughly `448px` wide and each idle row still reserved about `18px` for an always-visible unpinned pin button, so long titles truncated early despite abundant unused desktop width.
- [x] `desktop-sidebar-session-recognition`: Reproduced on desktop at `1440x900` in the expanded left `Sessions` rail with no active sessions; each past-session row measured about `147px × 24px`, spent `12px` plus gap on a low-signal archive icon, and left only about `117px` for the title while the sessions block flowed directly into Agents/Settings with minimal boundary.

## Improved

- [x] `mobile-session-row-density`: Compacted mobile session rows by clamping previews to one line and trimming vertical spacing in the row container/header/preview stack; after the change, the same seeded rows measured roughly `92–94px` tall and visibly fit more content in the initial viewport.
- [x] `mobile-chats-action-row-hierarchy`: Added a muted chat-count label to the mobile chats header and demoted `Clear all` into the secondary metadata cluster with a smaller touch-target padding profile, so the destructive action stops reading like a co-primary control while the list gains immediate count context.
- [x] `desktop-empty-recent-session-row-chrome`: Widened the desktop empty-state `Recent Sessions` list from `max-w-md` to `max-w-xl`, tightened row padding/gaps, and collapsed the unpinned pin affordance to zero idle width so titles get more room while pinning still appears on hover/focus or when already pinned.
- [x] `desktop-sidebar-session-recognition`: Removed redundant archive chrome from desktop sidebar past-session rows, tightened the list gutter, and added a divider under the sessions block so titles get more width and the session-picking surface reads as distinct from Agents/Settings.

## Verified

- [x] Desktop runtime available via Electron renderer target on `http://localhost:9343/json/list` — 2026-03-10
- [x] Mobile Expo web runtime available on `http://localhost:8081` — 2026-03-10
- [x] Targeted source regression check passed: `node --test apps/mobile/tests/session-list-density.test.js` — 3/3 passing — 2026-03-10
- [x] Mobile runtime re-check passed at `390x844` with the same seeded list state; row heights dropped from about `98–124px` to `92–94px` and before/after screenshots were captured — 2026-03-10
- [x] Targeted source regression check passed: `node --test apps/desktop/tests/sessions-empty-state-density.test.mjs` — 3/3 passing — 2026-03-10
- [x] Desktop runtime re-check passed at `1440x900` on the main `/` renderer target: the empty-state recent-session row width grew from roughly `448px` to `576px`, the idle title width grew from about `358px` to `516px`, and the idle pin affordance dropped from about `18px` visible width to `0px` with `pointer-events: none` until hover/focus — 2026-03-10
- [x] Targeted source regression check passed: `node --test apps/desktop/tests/active-agents-sidebar-density.test.mjs apps/desktop/tests/sessions-empty-state-density.test.mjs` — 5/5 passing — 2026-03-11
- [x] Desktop runtime re-check passed at `1440x900` on the main `/` renderer target: the first sidebar past-session row grew from about `147px` row width / `117px` title width with a `12px` archive icon to about `151px` row width / `143px` title width with the icon removed, and the sessions block now renders with a visible `175px` divider before Agents/Settings — 2026-03-11
- [x] Mobile runtime re-check passed at `390x844` on the real populated `Chats` list; no change shipped, but the action-row chrome, title/preview hierarchy, timestamp weight, and `Clear All` prominence were inspected live and logged for follow-up prioritization — 2026-03-11
- [x] Targeted source regression check passed: `node --test apps/mobile/tests/session-list-density.test.js` — 4/4 passing — 2026-03-11
- [x] Mobile runtime re-check passed at `390x844` on Expo web with a seeded populated chats list; matched before/after screenshots confirm the header now shows `4 chats` context and a smaller `Clear all` secondary action while preserving `+ New Chat` as the lone primary CTA — 2026-03-11

## Blocked

- [x] `pnpm --filter @dotagents/desktop typecheck:web` still fails on pre-existing unrelated `TS7030` errors in `apps/desktop/src/renderer/src/hooks/use-store-sync.ts` at lines `170` and `174`; this iteration did not touch that file — 2026-03-11

## Still uncertain

- [ ] Whether the most valuable next desktop change is in the sidebar recent-sessions list or the populated main tile grid once active sessions are present
- [ ] Whether the desktop sidebar active-session rows still waste title width on hidden hover-only action buttons once an active session is available to inspect live
- [ ] Whether the mobile long-press delete affordance remains discoverable after compacting row content
- [ ] Whether the mobile chats header should collapse `Clear all` into overflow entirely on narrower widths or when the syncing spinner is visible, now that the count-context demotion is in place
- [ ] Whether the desktop empty-state `Recent Sessions` list should also surface pin affordance visibility on touch/non-hover environments beyond keyboard focus, or if the current focus-visible path is sufficient

## Evidence

### Evidence block — mobile-session-row-density

- Evidence ID: `mobile-session-row-density`
- Scope: Mobile Expo web `Sessions` list at `390x844`, captured during the original pass with a locally seeded long-title/long-preview dataset to stress row density and truncation.
- Commit range: `e46d01822ce065cf4b6b0ee3aa64f0078c0cd00e..65bd286b65e0fe2f5261ad7b45602ce3fc929d37`
- Rationale: Mobile session rows currently spend too much vertical space on repeated secondary text, limiting how many conversations users can scan before scrolling.
- QA feedback: Reviewer requested a corrected commit range and tighter provenance for the original seeded mobile scenario; both are corrected here.
- Before evidence: `docs/aloops-evidence/sessions-compact-ui-loop/mobile-session-row-density--before--session-list-seeded--20260310.png` — before-state screenshot at `390x844 mobile` shows the original locally seeded long-title/long-preview list capture used during that pass; in that captured state only about five rows fit above the rapid-fire control because rows stretched to about `98–124px` tall and spent a full extra line on preview text.
- Change: In `apps/mobile/src/screens/SessionListScreen.tsx`, clamp session previews to one line and tighten row vertical spacing (`paddingVertical`, header gap, preview bottom gap) while preserving the full-row tap target and existing metadata line.
- After evidence: `docs/aloops-evidence/sessions-compact-ui-loop/mobile-session-row-density--after--session-list-seeded--20260310.png` — after-state screenshot at the same `390x844 mobile` viewport shows the original locally seeded capture after the row compaction; measured row heights dropped to about `92–94px`, improving above-the-fold scanability without removing message-count or desktop-origin metadata.
- Verification commands/run results: `node --test apps/mobile/tests/session-list-density.test.js` ✅ (3/3 passing). During the original pass, a Puppeteer runtime check on `http://127.0.0.1:8081` captured the seeded before/after screenshots and measured row heights changing from roughly `124/122/98/122/122` to `94/92/92/92/92`. In the subsequent QA pass, the same compact row behavior was also observed on a real populated `Chats` list at `390x844`, even though the exact local seeded dataset was not committed.
- Blockers/remaining uncertainty: The exact locally seeded dataset used for the original screenshots was not preserved as a committed repro harness, so the repo can verify the source constraints and the live density outcome but not replay that exact capture path from scratch. Long-press delete discoverability after the denser layout remains unverified on touch hardware/native shells.

### Evidence block — desktop-empty-recent-session-row-chrome

- Evidence ID: `desktop-empty-recent-session-row-chrome`
- Scope: Desktop main `/` renderer target at `1440x900 desktop`, focused on the empty-state `Recent Sessions` list populated from real local conversation history.
- Commit range: `65bd286b65e0fe2f5261ad7b45602ce3fc929d37..5707586f8b16276ed2768306446c50d90baf851f`
- Rationale: The desktop empty-state recent-session list was truncating titles much earlier than necessary because the list stayed narrowly capped on a wide viewport and every idle row permanently spent space on low-signal pin chrome, reducing scanability before a user had even started a new session.
- QA feedback: Addressed prior reviewer findings by correcting the earlier mobile evidence provenance in this ledger; this desktop row-chrome reduction is new work for the current iteration.
- Before evidence: `docs/aloops-evidence/sessions-compact-ui-loop/desktop-empty-recent-session-row-chrome--before--empty-state-recent-sessions--20260310.png` — before-state screenshot at `1440x900 desktop` shows the empty-state recent-session list occupying only a narrow central column with long titles already ellipsized. Live measurement on the first row showed a row width of about `448px`, a title width of about `358px`, and a trailing metadata cluster of about `44px`, including an always-visible unpinned pin button that consumed about `18px` even while idle.
- Change: In `apps/desktop/src/renderer/src/pages/sessions.tsx`, widen the empty-state recent-session list to `max-w-xl`, tighten row padding/gaps, and collapse the unpinned pin control to zero idle width with `pointer-events: none` until the row is hovered or focus moves into it.
- After evidence: `docs/aloops-evidence/sessions-compact-ui-loop/desktop-empty-recent-session-row-chrome--after--empty-state-recent-sessions--20260310.png` — after-state screenshot at the same `1440x900 desktop` viewport shows a broader, calmer recent-session list that surfaces more title text before truncation. Live re-measurement on the first row showed a row width of about `576px`, an idle title width of about `516px`, and the idle pin wrapper reduced to `0px` width with `opacity: 0` and `pointer-events: none`; on hover/focus the pin affordance still expands back to about `20px` and becomes interactive.
- Verification commands/run results: `node --test apps/desktop/tests/sessions-empty-state-density.test.mjs` ✅ (3/3 passing). Desktop runtime re-check via Puppeteer connected to `http://127.0.0.1:9343` on the main `/` renderer target at `1440x900` captured before/after screenshots and measured the first recent-session row changing from roughly `448x32` with `358px` of title width and an always-visible `18px` pin control to roughly `576x28` with `516px` of idle title width, `0px` idle pin width, and hover/focus re-expanding the pin control to about `20px` with `pointer-events: auto`.
- Blockers/remaining uncertainty: This pass validated keyboard focus and pointer hover reveal in the desktop renderer, but did not cover touch-only/non-hover desktop environments or a populated active-session tile grid. The next highest-risk desktop follow-up remains the populated main grid and selected/hovered tile states.

### Evidence block — desktop-sidebar-session-recognition

- Evidence ID: `desktop-sidebar-session-recognition`
- Scope: Desktop main `/` renderer target at `1440x900 desktop`, focused on the expanded left `Sessions` rail while the main pane remained in the empty-state `No Active Sessions` view.
- Commit range: `3c0c0d81aece8eebc887209d95e8bc2f0a661d2d..683a8919495abb8d4c22b6d56129c7ad837c04a2`
- Rationale: The desktop left sessions rail is a primary session-picking surface, but similar past-session titles were being compressed into nearly indistinguishable truncated strings because the rail spent scarce width on redundant archive chrome and then visually ran straight into Agents/Settings without a clear boundary.
- QA feedback: Prior reviewer finding is now documented honestly rather than waived away: the stored screenshot pair for this older evidence block has raw-pixel provenance drift, so treat the DOM measurements below as the trustworthy comparison and the screenshots as illustrative-only.
- Before evidence: `docs/aloops-evidence/sessions-compact-ui-loop/desktop-sidebar-session-recognition--before--sidebar-empty-state--20260311.png` — intended before-state capture of the same desktop sidebar surface, showing the expanded left `Sessions` rail packed into a narrow strip beside Agents/Settings with several near-identical truncated titles and minimal visual separation below `Load more sessions`. Live measurement on the first past-session row showed about `147px` total row width, a `12px` archive icon plus gap, and only about `117px` of actual title width; however, the stored PNG is `1577x986`, so it is not a pixel-perfect match to the after capture.
- Change: In `apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx`, remove the redundant archive icon from past-session rows, trim the list gutter/row padding for more usable title width, expose the full title on hover via `title`, and add a bottom divider so the sessions block reads as a distinct session-picking section before Agents/Settings.
- After evidence: `docs/aloops-evidence/sessions-compact-ui-loop/desktop-sidebar-session-recognition--after--sidebar-empty-state--20260311.png` — intended after-state capture of that desktop sidebar surface, showing the left rail giving each past session more visible title text before truncation and a clearer section break before the lower navigation groups. Live re-measurement on the first past-session row showed about `151px` total row width and about `143px` of title width with the icon removed, while the sessions block now renders with a visible `175px` divider boundary above Agents/Settings; the stored PNG is `2880x1800`, so this screenshot pair should not be treated as a strict like-for-like visual diff.
- Verification commands/run results: `node --test apps/desktop/tests/active-agents-sidebar-density.test.mjs apps/desktop/tests/sessions-empty-state-density.test.mjs` ✅ (5/5 passing). Live desktop runtime re-check via Electron renderer CDP at `http://127.0.0.1:9345` on the main `/` target measured the first sidebar past-session row improving from roughly `147x24` with a `12px` archive icon and `117px` title width to roughly `151x24` with a single `143px` title span and no redundant icon; a browser-automation after capture at the same `1440x900` viewport confirmed the clearer section break and denser session recognition surface. `pnpm --filter @dotagents/desktop typecheck:web` ⚠️ still fails on pre-existing unrelated `TS7030` errors in `apps/desktop/src/renderer/src/hooks/use-store-sync.ts` (`170`, `174`).
- Blockers/remaining uncertainty: This pass covered only past-session rows in the no-active-sessions desktop state. Active sidebar rows with hover-only snooze/stop actions and the populated main tile grid still need live inspection once a reproducible active-session runtime is available. In addition, the stored before/after screenshot pair has raw-pixel provenance drift (`1577x986` vs `2880x1800`) despite targeting the same desktop surface; exact matched-resolution re-capture is currently blocked because the pre-change UI is no longer present in the active worktree, so use the recorded DOM measurements above as the reliable comparison for that older evidence block.

### Evidence block — mobile-chats-action-row-hierarchy

- Evidence ID: `mobile-chats-action-row-hierarchy`
- Scope: Mobile Expo web `Chats` list at `390x844 mobile`, using a local seeded session dataset with long titles/previews and one active row to stress top-of-list chrome before the rapid-fire control.
- Commit range: `993cbed3fa192908a4625da51171ffab67c1dd7b..195783325f48bd54d40e3ec4f7c5808c2c56c97b`
- Rationale: The chats header is part of the session-picking surface, but on narrow mobile widths it jumped straight from the primary `+ New Chat` CTA to a destructive `Clear All` control with no count context, making chrome louder than the actual list and increasing the chance of scanning or tapping the wrong thing before users oriented themselves.
- QA feedback: Deferred the outstanding older reviewer finding about `desktop-sidebar-session-recognition` screenshot provenance for direct re-capture in this iteration; that block is now documented honestly above, while this mobile header-hierarchy fix is new work.
- Before evidence: `docs/aloops-evidence/sessions-compact-ui-loop/mobile-chats-action-row-hierarchy--before--chats-list--20260311.png` — before-state screenshot at `390x844 mobile` shows a populated chats list whose header presents `+ New Chat` and `Clear All` as the only two peer actions above the rows. In that state the destructive control sits at the same visual level as the creation CTA, and users get no immediate sense of how many chats exist before their attention is pulled into chrome.
- Change: In `apps/mobile/src/screens/SessionListScreen.tsx`, add a muted chat-count label to the secondary header cluster, tighten the secondary control padding, and change the copy to `Clear all` so the destructive action reads as metadata-level utility rather than a co-primary CTA. `apps/mobile/tests/session-list-density.test.js` now guards that count-context cluster and compact secondary touch-target styling.
- After evidence: `docs/aloops-evidence/sessions-compact-ui-loop/mobile-chats-action-row-hierarchy--after--chats-list--20260311.png` — after-state screenshot at the same `390x844 mobile` viewport shows the header leading with `+ New Chat`, then a muted `4 chats` label, then the smaller `Clear all` action. The list now communicates list size before destructive affordances, and the secondary action occupies less visual weight while remaining reachable.
- Verification commands/run results: `node --test apps/mobile/tests/session-list-density.test.js` ✅ (4/4 passing). Live Expo web runtime re-check via Puppeteer on `http://127.0.0.1:8081` at `390x844` captured matched before/after screenshots from the same seeded populated state; after the change, the header rendered `4 chats` at about `42px` width in muted caption styling and `Clear all` as a smaller secondary action (`~66px` wide with `8px/4px` padding) while `+ New Chat` remained the only prominent filled CTA.
- Blockers/remaining uncertainty: This pass used a local seeded mobile dataset rather than live synced conversations so the action-row chrome could be reproduced consistently. I did not yet validate even narrower widths, spinner-visible syncing, or native long-press/touch behavior around the demoted destructive action.
