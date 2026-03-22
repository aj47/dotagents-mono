---
name: electron-ui-recording
description: "Record real Electron product UI before/after videos and key frames using Playwright over CDP. Use when the user asks to record the app UI, capture before/after evidence for a bug fix, or validate Electron behavior with screenshots or video."
---

# Electron UI Recording

## Overview
Use this skill when you need evidence from the real Electron app UI, not a mocked browser page.

Success means:
1. validate the issue on the current source first
2. launch the desktop app with CDP enabled
3. attach Playwright to the running Electron window
4. record before artifacts
5. make the change and verify it
6. record after artifacts
7. compare critical frames
8. clean up every process you started

## Preconditions
- Use `pnpm` only.
- From this repo, fresh worktrees may need:

```bash
pnpm install
pnpm build:shared
pnpm build:core
```

- Prefer the desktop app, not Expo web or a plain browser build, when the behavior is Electron-specific.

## Standard Workflow

### 1. Validate before changing code
- Inspect the current source path tied to the issue.
- Reproduce the behavior in the real running app before calling it a valid bug.
- Record concrete UI signals to compare later, for example:
  - toolbar visible vs removed
  - button present vs absent
  - pin icon count
  - text/copy changed
  - layout moved from main pane to sidebar

### 2. Launch Electron with remote debugging
From repo root:

```bash
REMOTE_DEBUGGING_PORT=9333 pnpm --filter @dotagents/desktop dev:no-sherpa -- -d
```

If the default dev wrapper is needed instead:

```bash
REMOTE_DEBUGGING_PORT=9333 pnpm dev -- -d
```

Requirements:
- CDP must be reachable at `http://127.0.0.1:9333`
- use the real product window
- keep the app running while Playwright is attached

### 3. Create a disposable recorder workspace
Use `/tmp`, not the repo:

```bash
mkdir -p /tmp/electron-ui-recording
cd /tmp/electron-ui-recording
pnpm init -y
pnpm add -D playwright@1.50.0
```

Keep recorder files disposable:
- `inspect.mjs`
- `record-ui.mjs`
- screenshots
- mp4 outputs

### 4. Attach Playwright over CDP
Minimal connection pattern:

```js
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9333");
const context = browser.contexts()[0];
const page = context.pages()[0];

await page.waitForLoadState("networkidle").catch(() => {});
await page.screenshot({ path: "/tmp/electron-ui-recording/frame.png" });
```

If multiple pages exist:
- inspect titles and URLs
- choose the app window, not devtools or helper windows

### 5. Record before and after artifacts
Run the same recorder twice:
- once before the fix
- once after the fix

Store artifacts in `/tmp`, for example:

```text
/tmp/electron-ui-recording/before.mp4
/tmp/electron-ui-recording/after.mp4
/tmp/electron-ui-recording/before-loaded.png
/tmp/electron-ui-recording/after-loaded.png
```

For deterministic captures:
- wait for the target UI to settle
- navigate to the exact screen under test
- perform the same small interactions in both recordings
- if the UI is too static, add a small mouse move or scroll so the recorder emits enough frames

### 6. Analyze critical frames
Always save key screenshots in addition to video.

Check the exact success/failure signals:
- is the old control still visible
- did the new control appear
- did the layout move where expected
- does the text match the intended copy
- does the changed state persist in the target tile/panel

Prefer concrete comparisons such as:
- `topBarVisible: true -> false`
- `pinButtons: 0 -> 1`

### 7. Clean up
Kill the processes you started when done:

```bash
pkill -f '/absolute/path/to/worktree' || true
```

Also watch for stale Electron instances from other worktrees holding the single-instance lock.

## What To Avoid
- Do not skip source validation before fixing the issue.
- Do not rely only on reading the diff; confirm behavior in the running UI.
- Do not record a plain browser page for Electron-only behavior.
- Do not leave artifacts in the repo; use `/tmp`.
- Do not leave Electron, Vite, or recorder processes running.
- Do not assume the first page returned by CDP is the correct app window.
- Do not trust a dev server capture if the built artifact and live UI disagree; note the mismatch explicitly and capture the validated target.

## Useful Checks
Check whether CDP is exposed:

```bash
curl -s http://127.0.0.1:9333/json | jq '.[].title'
```

Check for leftover processes from a worktree:

```bash
ps -axo pid=,command= | grep -F '/absolute/path/to/worktree' | grep -v 'grep -F'
```

## Output Expectations
When using this skill, return:
- what was validated before the fix
- where the before/after videos were stored
- which key frames matter
- what changed in those frames
- confirmation that started processes were cleaned up
