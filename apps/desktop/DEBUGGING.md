# DotAgents Debugging Guide

## 🔧 Quick Start: Enable Debug Logging

**Always start with a debug port + debug logging enabled** - this captures LLM calls, tool execution, UI events, and app lifecycle:

```bash
# Pick any free port. It does NOT need to be 9222.
# (Different worktrees may already be using common ports.)
# Optional check: lsof -nP -iTCP:9333 -sTCP:LISTEN
REMOTE_DEBUGGING_PORT=9333 pnpm dev -- -d
```

Then connect via Chrome DevTools: `chrome://inspect` → Configure → `localhost:9333`.

If you also need programmatic CDP automation (`electron_execute_electron-native`), add a Node inspect port too:

```bash
REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -d
```

Selective flags:
| Flag | Description |
|------|-------------|
| `--debug-llm` / `-dl` | LLM API calls and responses |
| `--debug-tools` / `-dt` | MCP tool execution |
| `--debug-ui` / `-dui` | UI/renderer console logs |
| `--debug-app` / `-dapp` | App lifecycle events |
| `--debug-keybinds` / `-dk` | Keyboard shortcut handling |

Environment variable alternative: `DEBUG=* pnpm dev`

---

## Debugging Protocols

Electron has **two separate debugging protocols**. They serve different purposes and connect to different processes.

### 1. `--inspect` (V8 Inspector / Node.js Main Process)

Debugs the **main process** (Node.js). This is the protocol used by `electron_execute_electron-native` and similar CDP automation tools.

```bash
# Pass --inspect to the Electron main process via ELECTRON_EXTRA_LAUNCH_ARGS:
ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9229" pnpm dev -- -d
```

- Exposes targets on `http://localhost:9229/json`
- Connect with: Chrome → `chrome://inspect` → add `localhost:9229`
- Or use Node.js debugger: `node --inspect-brk`
- **Required for**: `electron_execute_electron-native` tool, programmatic CDP automation

> ⚠️ `--inspect` may not work with `electron-vite dev` depending on how it spawns the Electron process.
> If `http://localhost:9229/json` returns empty, the flag was not picked up.
> In that case, use `--remote-debugging-port` instead (see below).

### 2. `--remote-debugging-port` (Chrome DevTools Protocol / Renderer)

Debugs the **renderer processes** (browser windows). This is the standard Chrome DevTools experience.

```bash
REMOTE_DEBUGGING_PORT=9222 pnpm dev -- -d
```

- Set via `REMOTE_DEBUGGING_PORT` env var (handled in `src/main/index.ts` via `app.commandLine.appendSwitch`)
- **Do NOT** pass as CLI arg (`pnpm dev -- --remote-debugging-port=9222` will NOT work)
- Connect with: Chrome → `chrome://inspect` → Configure → add `localhost:9222` → inspect
- Shows renderer windows (main app, panel, settings) in Chrome DevTools
- `http://localhost:9222/json/version` returns browser info
- `http://localhost:9222/json/list` may show multiple renderer targets (commonly `/` and `/panel`)
- If you want the main app, inspect the `/` target — the panel target is easy to attach to by mistake

> ⚠️ `electron_execute_electron-native` still needs `--inspect`; renderer remote debugging alone is not enough.
> Use `--inspect` for programmatic automation.

### Practical gotchas

- Use non-default ports when needed; Chrome often already owns common debug ports.
- If Electron-native attaches to the panel or an empty renderer, reset/reconnect and inspect the `/` target instead.
- Even on the correct renderer, `window.electron` may be unavailable from some automation contexts because of isolated worlds. If that happens, verify IPC from the inspected page's DevTools console instead of assuming the preload bridge is directly visible.

### Summary

| Protocol | Env Var / Flag | Port | Debugs | Use For |
|----------|---------------|------|--------|---------|
| `--inspect` | `ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9229"` | 9229 | Main process (Node.js) | CDP automation, `electron-native` tool |
| `--remote-debugging-port` | `REMOTE_DEBUGGING_PORT=9222` | 9222 | Renderer (browser) | Chrome DevTools UI inspection |

---

## Renderer performance capture to disk

For rendering slowdowns, run the app with renderer CDP enabled and record metrics/trace artifacts into `apps/desktop/tmp/perf/`:

```bash
# Terminal 1: run the app with renderer + main-process debugging enabled
REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9339" pnpm dev -- -dui -dapp

# Terminal 2: record renderer metrics until you stop it
pnpm --filter @dotagents/desktop perf:renderer:record -- --port 9333 --duration-seconds 0 --metrics-interval-ms 1000

# Optional: capture a focused 20s DevTools trace while reproducing jank
pnpm --filter @dotagents/desktop perf:renderer:record -- --port 9333 --trace-seconds 20 --label session-stream
```

Artifacts written per run:

- `*.metrics.jsonl` → sampled CDP `Performance.getMetrics()` output plus page metadata
- `*.trace.json` → Chrome trace events ready for Perfetto/DevTools (when `--trace-seconds` is used)
- `*.meta.json` → target/port/session metadata for the capture

Recommended workflow:

1. Start the app with `REMOTE_DEBUGGING_PORT` enabled.
2. Start the metrics recorder.
3. Reproduce the slowdown with multiple long conversations active.
4. Run a short `--trace-seconds 20` capture during the janky window.
5. Compare heap, node count, `TaskDuration`, `ScriptDuration`, `LayoutDuration`, and the trace flame chart.

## Session switching autoresearch loop

For repeatable optimization of switching between many large sessions, use the
synthetic session-switch benchmark. It drives the renderer through CDP and a
dev-only harness instead of starting real agents, so runs are deterministic and
safe to repeat.

```bash
# Terminal 1: run the desktop app with renderer CDP enabled
REMOTE_DEBUGGING_PORT=9333 pnpm dev -- -dui -dapp

# Terminal 2: run a fixed benchmark scenario
pnpm --filter @dotagents/desktop perf:session-switch -- --port 9333 --scenario large --switches 30

# Optional: include a Chrome trace for Perfetto/DevTools inspection
pnpm --filter @dotagents/desktop perf:session-switch -- --port 9333 --scenario huge --switches 20 --trace

# Single large fake session presets for 500/1000-message manual stress tests
pnpm --filter @dotagents/desktop perf:session-switch -- --port 9333 --scenario single-500 --switches 5
pnpm --filter @dotagents/desktop perf:session-switch -- --port 9333 --scenario single-1000 --switches 5

# Compare a candidate run against a saved baseline and get keep/discard guidance
pnpm --filter @dotagents/desktop perf:session-switch:compare -- \
  --baseline tmp/perf/session-switch/baseline.results.json \
  --candidate tmp/perf/session-switch/candidate.results.json
```

Artifacts are written under `apps/desktop/tmp/perf/session-switch/`:

- `*.results.json` → summary metrics and CDP metric deltas
- `*.events.jsonl` → one row per session switch
- `*.trace.json` → Chrome trace when `--trace` is passed
- `results.tsv` → autoresearch-style ledger for baseline/variant comparison

Key metrics to compare before keeping an optimization:

- `switchLatencyP50Ms`, `switchLatencyP95Ms`, `maxSwitchLatencyMs`
- long-task count and total duration
- JS heap delta and DOM node count
- CDP deltas: `TaskDuration`, `ScriptDuration`, `LayoutDuration`, `RecalcStyleDuration`

Recommended feedback loop:

1. Run a baseline and save the generated `*.results.json` path.
2. Make one targeted optimization hypothesis.
3. Re-run the exact same scenario.
4. Run `perf:session-switch:compare` against the baseline and candidate.
5. Keep the change only if the comparator says `keep`, or if the result is
   `inconclusive` but the code is simpler and the metrics are neutral.
6. Discard/rework if the comparator says `discard`.

Default comparator thresholds:

- `keep`: p95 improves by at least 10%.
- `discard`: p95 regresses by more than 5%.
- `discard`: heap delta regresses by more than 50 MB.
- `discard`: DOM node count regresses by more than 10%.
- otherwise: `inconclusive`.

Comparator artifacts:

- `*.comparison.json` → full baseline/candidate diff and decision
- `comparisons.tsv` → autoresearch-style keep/discard ledger

The harness is gated behind `localStorage.dotagents.sessionSwitchPerfHarness =
"true"` and is only initialized in dev/test renderer builds. The benchmark
script enables that flag automatically over CDP and reloads the renderer target
if needed.

To manually preseed a fake large session in the app UI, enable both harness keys
from the renderer DevTools console and reload:

```javascript
localStorage.setItem("dotagents.sessionSwitchPerfHarness", "true")
localStorage.setItem("dotagents.sessionSwitchPerfPreseed", "1000") // or "500"
location.reload()
```

For custom preseed fixtures, store JSON instead:

```javascript
localStorage.setItem("dotagents.sessionSwitchPerfPreseed", JSON.stringify({
  sessionCount: 2,
  messagesPerSession: 1000,
  messageChars: 800,
  stepsPerSession: 120,
}))
location.reload()
```

---

## IPC Methods (Testing from DevTools Console)

Once connected to a renderer window via `chrome://inspect`:

```javascript
// Config
window.electron.ipcRenderer.invoke('getConfig')
window.electron.ipcRenderer.invoke('saveConfig', { config: {...} })

// Agent
window.electron.ipcRenderer.invoke('getAgentSessions')
window.electron.ipcRenderer.invoke('emergencyStopAgent')
window.electron.ipcRenderer.invoke('createMcpTextInput', { text: 'hi', conversationId: null })

// Agents
window.electron.ipcRenderer.invoke('getAgentProfiles')
window.electron.ipcRenderer.invoke('getCurrentAgentProfile')

// Navigation (app uses BrowserRouter, not HashRouter)
window.location.href = '/settings/general'
window.location.href = '/settings/agents'
```

> All IPC procedures are defined in `apps/desktop/src/main/tipc.ts`

---

## Mobile App
```bash
pnpm dev:mobile  # Press 'w' for web → localhost:8081
```
