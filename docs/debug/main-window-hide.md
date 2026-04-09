# Main window hide — debugging log

Tracking two recurring bugs in the desktop Electron app:

1. **App disappears from the macOS Cmd‑Tab (app switcher).**
2. **After submitting a prompt from the floating text‑input panel, the main window hides.**

Use this document as a running log: add dated entries under "Attempts & findings" as things are tried.

---

## 1. Known reproduction (best guess, to be verified)

### Cmd‑Tab disappearance
- Open the app, focus another app so DotAgents is in the background.
- Trigger the floating text‑input panel via the global hotkey (`Ctrl+T` default) or the "create input" mic button.
- Submit a prompt.
- Optional: dismiss the panel, switch back to another app, then `Cmd+Tab`.
- **Expected:** DotAgents is listed in the Cmd‑Tab switcher.
- **Actual:** DotAgents is not listed.

### Main window hides after panel submit
- Open the main window so it is visible.
- From another app (so no DotAgents BrowserWindow is focused), press `Ctrl+T` to open the floating text input.
- Type a prompt and submit.
- **Expected:** After submit, the main window is still visible with agent progress.
- **Actual:** The main window is hidden entirely; only the floating panel is visible (or nothing).

> TODO: confirm with the user whether the repro is "opened from another app" or "opened from inside main". Behaviour is very different between the two.

---

## 2. Architectural overview

### Windows involved
| ID | File | Flags | Notes |
|----|------|-------|-------|
| `main` | `window.ts` `createMainWindow` | regular window, `titleBarStyle: hiddenInset` on macOS | Primary app UI. |
| `panel` | `window.ts` `createPanelWindow` | `skipTaskbar: true`, always‑on‑top, initially `focusable: false` | Floating overlay for recording / text input / agent progress. |
| `setup` | `window.ts` `createSetupWindow` | fixed 800×600 | Onboarding. |

### State flags that gate hide/show decisions (`window.ts`)
- `isAppQuitting` — set in `setAppQuitting()` (called from `before-quit`); allows real close.
- `allowExpectedMainHide` — one‑shot flag set by intentional main hide paths; prevents the unexpected‑hide auto‑recovery.
- `panelHiddenByMainFocus` — panel was hidden because main gained focus; restored on main blur.
- `panelOpenedWithMain` — panel was explicitly shown alongside main (don't auto‑hide on main focus).
- `lastMainBlurWithoutAppFocusAt` — timestamp of main blur with no focused BrowserWindow (app deactivating).
- `lastIntentionalTextInputPanelHideAt` — short suppression window after intentional text‑input panel hide.
- `state.isTextInputActive` (in `state.ts`) — panel is in text‑input mode; affects mode dedup logic.
- `state.isAgentModeActive` — agent session is running; drives panel `agent` mode.
- `isHeadlessMode` — gates all GUI operations.

### Activation policy / dock
`app-switcher.ts` centralises macOS Cmd‑Tab visibility:
- `ensureAppSwitcherPresence(reason)` — `setActivationPolicy("regular")` + `app.dock.show()`, **only if `configStore.get().hideDockIcon !== true`**.
- `showAndFocusMainWindow(win, reason)` — calls the above, then `app.show()`, `win.restore/show/focus()`.

Activation policy is also touched by:
- `createMainWindow` → `win.on("show")` — unconditional `app.dock.show()` + `setActivationPolicy("regular")` when main is shown.
- `win.on("close")` (macOS) — switches to `"accessory"` and hides dock when `hideDockIcon === true`.
- `hideFloatingPanelWindow` — persists `floatingPanelAutoShow: false` but does not touch activation policy.

---

## 3. Code paths that hide the MAIN window

`rg '\.hide\(' apps/desktop/src/main/` finds **only two** main‑window hide sites (the rest are panel hides):

1. **`window.ts:296` — `hideMainWindowForTextInputPanelOpen()`**
   Called from `showPanelWindowAndShowTextInput()` at line 1202 when:
   ```
   process.platform === "darwin"
   && BrowserWindow.getFocusedWindow() === null   // no DotAgents window focused (app is background)
   && main.isVisible() === true                   // main is visible behind another app
   ```
   Sets `allowExpectedMainHide = true` and calls `main.hide()`. There is no matching "restore main" path. **Nothing re‑shows main after the text input closes or the prompt is submitted.**

2. **`window.ts:456` — `win.on("close")` handler**
   On macOS, `e.preventDefault()` + `win.hide()` unless the app is quitting, to keep the app in Cmd‑Tab. Sets `allowExpectedMainHide = true` before hiding.

`menu.ts:51` calls `window.hide()` on some window reference but in menu handling; not a panel/text‑input path.

### Unexpected‑hide recovery (safety net)
`createMainWindow` → `win.on("hide")` checks:
```
!isAppQuitting
&& !cfg.hideDockIcon
&& !allowExpectedMainHide
&& !win.isMinimized()
&& !app.isHidden()
&& !blurredIntoAppDeactivation      // main blurred with no focused window in the last 250ms
```
If all true, calls `ensureAppSwitcherPresence("main.hide.recover")` then `app.show()` + `win.show()` via `setTimeout(..., 0)`.

Covered by `window.main-hide-recovery.test.ts` — tests cover the recovery path and the deactivation skip. There is already a passing regression test at line 273 ("hides the visible main window before opening text input from another app") that asserts `hideMainWindowForTextInputPanelOpen` fires for the backgrounded‑app case.

---

## 4. Text‑input submit flow (panel → main → agent)

### Renderer: `apps/desktop/src/renderer/src/pages/panel.tsx`
1. `handleTextSubmit(text)` — line ~743:
   - `setShowTextInput(false)`
   - `tipcClient.clearTextInputState({})` → main: `state.isTextInputActive = false`
   - `mcpTextInputMutation.mutate({ text, conversationId })`
   - **Does NOT call `hidePanelWindow` and does NOT call `showMainWindow`.**
2. `mcpTextInputMutation`:
   - `onSuccess`: `setShowTextInput(false)` + `clearTextInputState({})`. **No panel hide, no main show.**
   - `onError`: same + `hidePanelWindow({})`.
3. Auto mode switch useEffect at line ~895: when `anyActiveNonSnoozed` becomes `true`, calls `requestPanelMode("agent")` which dispatches `setPanelMode("agent")` via IPC, causing `restorePanelSizeForMode("agent")` and a panel resize/reposition.

### Main: `apps/desktop/src/main/tipc.ts`
- `createMcpTextInput` (line 1822):
  - Creates/finds a conversation, revives or starts a session, fires `processWithAgentMode(...)` **fire‑and‑forget**. Never touches the main window.
- `hidePanelWindow` (line 918) → `hideFloatingPanelWindow()` in `window.ts`:
  - Marks intentional text‑input hide, suppresses auto‑show, persists `floatingPanelAutoShow: false`, hides the panel. Never touches the main window.
- `clearTextInputState` (line 2744): just clears `state.isTextInputActive`. Never touches the main window.

### Conclusion of the submit flow
**Nothing in the submit path hides the main window directly.** The main window is only hidden by `hideMainWindowForTextInputPanelOpen` at the moment the text input is opened. If the text input opens from a backgrounded state, the main window is hidden pre‑emptively and **never restored**. The user perceives this as "main hides after I submit" because they only notice the hidden main after the panel disappears.

---

## 5. Hypotheses (ranked)

### H1 — Main is hidden on text‑input OPEN and never restored (highest confidence)
**Evidence:** `hideMainWindowForTextInputPanelOpen` sets `allowExpectedMainHide = true` and calls `main.hide()`; no code path ever re‑shows `main` after the text input closes, submits, or errors. The behaviour is covered by a passing test, meaning it's "working as designed" — but the design likely doesn't match user expectation.

**Why it feels like "hides after submit":** The panel is still visible on top of the user's other app, so the user doesn't notice main is gone until the panel hides (on submit success in some flows, on cancel/error in others).

**Scope:** Only fires on macOS, only when `BrowserWindow.getFocusedWindow() === null` at the moment the text‑input panel opens (i.e., user is in another app). If the text input is opened from inside the main window itself, `focusedWindow === main` → main is not hidden.

**Verification:** Log at entry of `handleTextSubmit`, `hideMainWindowForTextInputPanelOpen`, and `mcpTextInputMutation.onSuccess`. Confirm the sequence: open‑from‑background → `hideMainWindowForTextInputPanelOpen` fires → no `showMainWindow` after submit.

**Fix sketch:** Track whether main was hidden by this path (new flag `mainHiddenForTextInputPanelOpen`) and restore main on: text input cancel, submit success/error, `hidePanelWindow` IPC, and `stopTextInputAndHidePanelWindow`. Only restore if the user's current frontmost app is DotAgents (to avoid stealing focus when the user switched to a different app mid‑prompt).

### H2 — `win.on("hide")` recovery is suppressed by deactivation race
**Evidence:** `shouldRecoverFromUnexpectedHide` skips recovery if `lastMainBlurWithoutAppFocusAt` is within 250ms. Recent commit `19c03bde` ("Fix desktop focus‑steal on app deactivation") added this. If the user submits in a way that triggers a brief deactivation (panel → agent mode → `setAlwaysOnTop` flicker), the recovery path may be silently skipped.

**Verification:** Log `lastMainBlurWithoutAppFocusAt`, `blurredIntoAppDeactivation`, `allowExpectedMainHide`, and `shouldRecoverFromUnexpectedHide` on every `main.on("hide")`.

### H3 — Cmd‑Tab drops because only the panel window is visible
**Evidence:** After H1 fires, the only visible DotAgents window is the panel, which is `skipTaskbar:true` and `focusable:false`. macOS tracks Cmd‑Tab presence based on *regular* windows; with only a skip‑taskbar overlay visible and activation policy set to `"regular"`, Cmd‑Tab may still show the app, but some macOS versions drop the entry when the app's only "window" is a borderless always‑on‑top overlay.

**Verification:** After reproducing, run in the macOS debugger: `print !NSApp.isHidden`, check `app.getActivationPolicy()`, check `app.dock.isVisible()`, check list of visible BrowserWindows. Compare against a healthy state.

### H4 — `configStore.hideDockIcon === true` silently gates `ensureAppSwitcherPresence`
**Evidence:** `app-switcher.ts` line 11: `if (cfg.hideDockIcon === true) return`. If the user ever toggled "hide dock icon", every Cmd‑Tab recovery path becomes a no‑op.

**Verification:** Check the user's saved config. If `hideDockIcon === true`, this is expected; otherwise rule it out.

### H5 — `floatingPanelAutoShow` persistence side‑effects (issue #281 regression)
**Evidence:** `hideFloatingPanelWindow` writes `floatingPanelAutoShow: false` to the configStore. On the next launch, agent progress will not re‑show the panel. This is a separate bug but can masquerade as "window disappears", so worth confirming it isn't the cause.

**Verification:** Tail the `configStore` save log during the repro; after the bug hits, inspect `~/.agents/config` or wherever the store lives.

---

## 6. Logging to add during the next debug session

Most of the relevant paths already `logApp(...)`; the gaps are in the renderer and around main show/hide transitions.

### Main process (add `logApp` calls; keep formatting consistent with surrounding lines)

**`apps/desktop/src/main/window.ts`**
- `showMainWindow(url?)` entry — log `{url, snapshot: getWindowFocusDebugSnapshot()}`.
- `hideMainWindowForTextInputPanelOpen` — already logs "Hiding main window…"; add a `callstack: new Error().stack` field to capture who invoked the chain.
- `win.on("hide")` recovery branch — add the decision reasons object explicitly: `{isAppQuitting, hideDockIcon: cfg.hideDockIcon, allowExpectedMainHide, isMinimized, isAppHidden, blurredIntoAppDeactivation, shouldRecoverFromUnexpectedHide}`.
- `win.on("show")` — log the resulting `activationPolicy` via `app.getActivationPolicy?.()` and `dockVisible`.

**`apps/desktop/src/main/app-switcher.ts`**
- `ensureAppSwitcherPresence(reason)` — log entry + outcome: `{reason, hideDockIcon, activationPolicyBefore, activationPolicyAfter, dockWasVisible, dockIsVisible}`.

**`apps/desktop/src/main/tipc.ts`**
- `createMcpTextInput` — already logs "Request received"; also log at the end with `{mainVisible: WINDOWS.get("main")?.isVisible?.()}`.

### Renderer (use `logUI`, matching existing debug tags in `panel.tsx`)

**`apps/desktop/src/renderer/src/pages/panel.tsx`**
- `handleTextSubmit` entry — `logUI("[Panel] handleTextSubmit", {textLength: text.length, currentConversationId, selectedAgentId, showTextInput})`.
- `mcpTextInputMutation.onSuccess` — log. Same for `onError` with the error.
- The mode‑change useEffect at ~L895 — log every `requestPanelMode` call with the `targetMode` and reason.

### Turning on extended logging
- Set env `DEBUG=app,ui,keybinds` (see `apps/desktop/src/main/debug.ts` / `getDebugFlags`). Flags already gate `logApp` / `logUI` output.
- Relaunch with `pnpm dev` and observe the main‑process and renderer consoles while reproducing.

---

## 7. Verification checklist (to run during the next session)

Do these in order and record the outcome under "Attempts & findings":

1. **Confirm repro path.** Is the text input opened from inside main, or from a backgrounded state via the global hotkey? Ask the user to repro both cases and confirm which one exhibits the bug.
2. **Inspect config.** `cat ~/.agents/config.json` (or wherever `configStore` writes). Record `hideDockIcon` and `floatingPanelAutoShow`.
3. **Run the hide‑recovery test.** `pnpm --filter @dotagents/desktop test window.main-hide-recovery` — should stay green. If it fails, priority is to fix the test regression first.
4. **Add the log‑points listed in §6.** Commit behind a WIP branch.
5. **Reproduce the bug once** and capture the full main‑process + renderer logs.
6. **Walk the captured logs** and mark which hypothesis (H1–H5) is confirmed.
7. **Check `app.getActivationPolicy()` and `app.dock.isVisible()`** at the moment Cmd‑Tab drops (e.g., via a new `debugAppSwitcherState` tipc procedure triggered with a temporary hotkey). Record the observed values.

---

## 8. Related code pointers

| File | Section | What to look at |
|------|---------|------------------|
| `apps/desktop/src/main/window.ts` | L240, L280, L300, L385, L472, L849, L1172 | All flags and handlers above. |
| `apps/desktop/src/main/app-switcher.ts` | L6, L22 | Activation policy + dock logic. |
| `apps/desktop/src/main/tipc.ts` | L918, L1822, L2744 | `hidePanelWindow`, `createMcpTextInput`, `clearTextInputState`. |
| `apps/desktop/src/main/keyboard.ts` | L1‑100 | Hotkey wiring (`showPanelWindowAndShowTextInput`, etc). |
| `apps/desktop/src/renderer/src/pages/panel.tsx` | L150, L338, L361, L743, L895, L1114 | Mutations, `handleTextSubmit`, mode effect, TextInputPanel wiring. |
| `apps/desktop/src/main/window.main-hide-recovery.test.ts` | L150, L273 | Existing regression coverage. |
| `apps/desktop/src/main/emit-agent-progress.ts` | | Agent progress side‑effects on panel mode. |

### Related commits
- `e27a4369` — Fix macOS Cmd+Tab app switcher behavior.
- `6483f1f1` — Fix macOS Cmd+Tab app switcher behavior (#40).
- `4c1c7d7d` — Reduce floating panel app switcher churn.
- `19c03bde` — Fix desktop focus‑steal on app deactivation.
- `2553e8d1` — fix(desktop): harden floating text‑input focus flow.
- `fcecb2c5` — Issue #281 (hide floating panel setting should persist).
- `95b6ff0f` — fix(desktop): persist dock icon visibility and cmd+tab on app restart.
- `14b64439` — fix: restore Command+Tab visibility when main window is shown.
- `1038a78b` — fix: keep app in Cmd+Tab on macOS by hiding main window instead of destroying.

### Related GitHub issues
- `#281` — Hide floating panel setting should persist (closed, merged in `fcecb2c5`).

---

## 9. Attempts & findings (append dated entries below)

### 2026-04-09 — initial deep‑dive
- Mapped all main‑window hide sites. Only two: `hideMainWindowForTextInputPanelOpen` and `win.on("close")`.
- Confirmed `handleTextSubmit` and the MCP text‑input mutation never hide the main window or call `showMainWindow`.
- Strong hypothesis (H1): `hideMainWindowForTextInputPanelOpen` intentionally hides main when the user opens the text input from a backgrounded state; there is no restore path. The user experiences this as "main hides after submit" because that is when they first notice it.
- Cmd‑Tab disappearance (H3) is likely a downstream symptom of H1: when only the `skipTaskbar:true` panel is visible, macOS may drop the Cmd‑Tab entry until a regular window is re‑shown.
- Existing test `window.main-hide-recovery.test.ts` already locks in the "hide main before text‑input open" behaviour as intentional, so any fix must update that test.
- No logging changes yet. No config inspection yet.

### 2026-04-09 — repro path confirmed by user
- User confirmed: they reproduce the "main hides after submit" bug by pressing the global hotkey **from inside another app while DotAgents is backgrounded**.
- This is exactly the code path that triggers `hideMainWindowForTextInputPanelOpen`. **H1 is confirmed as the root cause** for the "main hides after submit" symptom — no further logging needed to confirm H1.
- H3 (Cmd‑Tab drop) is still unconfirmed and may be independent; likely worth verifying only after a fix for H1 lands.

### 2026-04-09 — desired behavior confirmed by user
> "It should remain how it was. If it was already hidden that's ok it can remain hidden. But if it was open and visible it should not hide."

- **Requirement:** Preserve the main window's visibility across text‑input open/close. Don't hide it if it was visible; don't show it if it was hidden.
- **Implication:** `hideMainWindowForTextInputPanelOpen` should be **removed** (or gated off) entirely. Previously visible main windows must stay visible throughout the text‑input flow.
- **Known risk from removing the hide:** Commit `2553e8d1` ("harden floating text‑input focus flow") and the `hideMainWindowForTextInputPanelOpen` helper itself were added to avoid a focus‑steal issue where, on macOS, focusing the panel re‑activates the DotAgents app and drags a visible main window in front of the user's other app. Removing the hide may re‑expose that bug. Mitigations to evaluate:
  - `showPanelWindow()` already uses `showInactive()` paths; confirm the panel code never calls `panel.focus()` synchronously while main is visible.
  - `setPanelFocusable(true)` is called without `andFocus`, relying on the renderer to focus the textarea through the already‑visible webContents. This is the existing mitigation from `2553e8d1`. It may be sufficient on its own.
  - If focus‑steal regresses, fall back to a shorter surgical mitigation: set the main window to `setVisibleOnAllWorkspaces(false)` or temporarily lower its level, instead of hiding it.
- **Test impact:** `window.main-hide-recovery.test.ts` line 273 currently asserts `main.hide` **is** called on the "open from another app" path. This assertion needs to flip to assert main.hide is **not** called, and a new assertion that main stays visible should be added.
- **Proposed minimal fix (pending user approval before implementation):**
  1. In `apps/desktop/src/main/window.ts` `showPanelWindowAndShowTextInput`: delete the `shouldHideVisibleMainBeforeTextInputOpen` computation and the call to `hideMainWindowForTextInputPanelOpen()`.
  2. Keep the log line for observability, now reporting "Preserving existing main window visibility".
  3. Optionally delete `hideMainWindowForTextInputPanelOpen` entirely if no other callers (`rg` shows it is only called from `showPanelWindowAndShowTextInput`).
  4. Update the existing regression test to assert `main.hide` is NOT called.
  5. Add a new test: main visible, open text input from backgrounded state → main stays visible, panel shown.
  6. Manually verify on macOS:
     - Text input open from another app → panel appears, main stays in its previous on‑screen position, no focus flash.
     - Text input open from inside main → behavior unchanged (was already working).
     - Cmd‑Tab after submit → DotAgents is still listed (H3 should no longer reproduce).

### 2026-04-09 — fix implemented on branch `fix/preserve-main-on-text-input-open`
- Deleted `hideMainWindowForTextInputPanelOpen()` helper and its call site in `showPanelWindowAndShowTextInput`. The log line was rewritten to report `mainVisible` instead of `shouldHideVisibleMainBeforeTextInputOpen`.
- `allowExpectedMainHide` is still used by the `win.on("close")` path (macOS close‑to‑hide), so the variable stayed.
- Flipped the existing regression test (`window.main-hide-recovery.test.ts` line 273) to assert `main.hide` is **not** called and `main.isVisible() === true` after `showPanelWindowAndShowTextInput` runs from a backgrounded state. Renamed the test to "preserves a visible main window when opening text input from another app".
- Added a new test "does not hide a hidden main window when opening text input from another app" covering the hidden‑stay‑hidden half of the requirement.
- Updated the source‑grep regression test in `panel.recording-layout.test.ts` to assert that `shouldHideVisibleMainBeforeTextInputOpen`, `hideMainWindowForTextInputPanelOpen()`, and the helper definition itself are **not** present in `window.ts` anymore.
- **Test results:**
  - Targeted: `window.main-hide-recovery.test.ts` (7 tests) and `panel.recording-layout.test.ts` (10 tests) both pass.
  - Full `pnpm --filter @dotagents/desktop test:run`:
    - Baseline (without my changes): 650 passed / 73 failed.
    - With my changes: 651 passed / 73 failed. Zero new failures; one new passing test (the added hidden‑stay‑hidden case).
  - The 73 pre‑existing failures are in unrelated renderer settings/UI tests with `forwardRef`/`useContext` mock issues — not caused by this change.
- **Typecheck:** Required `pnpm build:shared` and `pnpm --filter @dotagents/core build` first (stale dist in the workspace). After rebuild, only one error remains: `src/main/tipc.ts(75,10): Import declaration conflicts with local declaration of 'generateEdgeTTS'` — introduced by commit `1b3c68eae` ("Fix desktop Edge TTS websocket transport") on 2026-04-05, unrelated to this change.
- **Commit status:** Not yet committed. Pending user approval before commit/push per repo policy.
- **Still to verify manually on macOS after merge:**
  1. Cmd‑Tab behavior after a full open‑submit cycle from a backgrounded state (H3).
  2. Focus‑steal: does the main window briefly flash to the front when the panel text input opens? This is the regression risk called out in H1's fix section.

<!-- Next entries template:

### YYYY-MM-DD — <short label>
- Repro: <what you did>
- Observed: <relevant logs, screenshots>
- Decision: <next hypothesis/fix to try>

-->


