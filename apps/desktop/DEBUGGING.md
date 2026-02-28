# SpeakMCP Debugging Guide

## 🔧 Quick Start: Enable Debug Logging

**Always start with a debug port + debug logging enabled** - this captures LLM calls, tool execution, UI events, and app lifecycle:

```bash
# Pick any free port. It does NOT need to be 9222.
# (Different worktrees may already be using common ports.)
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
- Shows renderer windows (settings page, panel) in Chrome DevTools
- `http://localhost:9222/json/version` returns browser info
- `http://localhost:9222/json/list` may return `[]` — this is normal for Electron; use `chrome://inspect` instead

> ⚠️ This protocol does **not** expose page-level targets via `/json/list` in Electron.
> The `electron_execute_electron-native` tool will report "No Electron targets found" with this protocol.
> Use `--inspect` for programmatic automation.

### Summary

| Protocol | Env Var / Flag | Port | Debugs | Use For |
|----------|---------------|------|--------|---------|
| `--inspect` | `ELECTRON_EXTRA_LAUNCH_ARGS="--inspect=9229"` | 9229 | Main process (Node.js) | CDP automation, `electron-native` tool |
| `--remote-debugging-port` | `REMOTE_DEBUGGING_PORT=9222` | 9222 | Renderer (browser) | Chrome DevTools UI inspection |

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

// Navigation
window.location.hash = '/settings/general'
window.location.hash = '/settings/agents'
```

> All IPC procedures are defined in `apps/desktop/src/main/tipc.ts`

---

## Mobile App
```bash
pnpm dev:mobile  # Press 'w' for web → localhost:8081
```
