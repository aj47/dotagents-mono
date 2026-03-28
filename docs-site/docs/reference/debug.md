---
sidebar_position: 2
sidebar_label: "Debug & Diagnostics"
---

# CLI & Debug Flags

DotAgents includes comprehensive debug logging for development and troubleshooting.

---

## Debug Modes

Start DotAgents in development mode with specific debug flags:

```bash
pnpm dev d               # Enable ALL debug logging
pnpm dev debug-llm       # LLM calls and responses only
pnpm dev debug-tools     # MCP tool execution only
pnpm dev debug-ui        # UI focus and state changes only
```

## Debug Categories

### LLM Debug (`debug-llm`)

Logs all LLM-related operations:

- API requests (model, messages, parameters)
- API responses (content, token usage)
- Tool call decisions
- Context window management
- Continuation guards
- Message shrinking/budgeting

### Tool Debug (`debug-tools`)

Logs all MCP tool operations:

- Tool discovery from servers
- Tool call requests (name, arguments)
- Tool execution results
- Tool approval flows
- Server connection status

### UI Debug (`debug-ui`)

Logs UI state changes:

- Focus events (window focus/blur)
- State transitions
- Component lifecycle events
- Keyboard event handling

### Full Debug (`d`)

Enables all debug categories simultaneously. Use this when you're not sure what's going wrong.

## Log Output

Debug logs appear in:

- **Terminal** — When running via `pnpm dev`
- **Electron DevTools** — Main process console (View > Toggle Developer Tools)
- **Renderer DevTools** — Right-click > Inspect in the app window

## Headless CLI

Run the desktop app without opening the GUI:

```bash
pnpm --filter @dotagents/desktop dev -- --headless
```

Inside the CLI, use:

- `/conversations` to list recent sessions
- `/use <conversation-id-prefix>` to continue a specific session
- `/show [conversation-id-prefix]` to inspect recent messages before continuing

Use QR-based remote access while staying headless:

```bash
pnpm --filter @dotagents/desktop dev -- --qr
```

The headless CLI, QR mode, desktop UI, remote server, and loop scheduler all share the same top-level agent runner, so ACP routing and tool execution stay aligned across entry points. Fresh desktop text, voice, CLI, remote, and loop prompts now also share the same launcher and conversation/session bootstrap before entering that runner, while queued desktop follow-ups and ACP parent-resume nudges now share a dedicated resume-only launcher so they do not duplicate persisted or synthetic turns. Headless CLI conversation browsing now also resolves `/use` and `/show` targets through the same conversation-selection helper every time, so continuing an older session by ID or unique prefix follows one lookup path before it re-enters the shared prompt launcher. Legacy active/stop/iteration flags are likewise left to the shared session manager, which prevents one entry point from clearing another still-running session. The repo-level path matrix lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.

Headless, QR, and GUI startup also share the same runtime bootstrap for MCP, repeat tasks, ACP profile sync, bundled skills, and models.dev initialization, so both `--headless` and `--qr` now boot the same service stack as the desktop app before they diverge into the terminal REPL or QR pairing flow. The two non-GUI modes now also share one top-level launcher for startup failure handling and signal wiring; `--headless` intentionally leaves `SIGINT` / Ctrl+C to the terminal REPL so in-flight runs still stop locally before exiting, while QR mode lets the shared launcher own both `SIGINT` and `SIGTERM`. Remote server startup is likewise shared now: desktop remote access, headless CLI, and QR pairing all pass through the same remote-access bootstrap, which then reuses the same config-aware Cloudflare tunnel helper, with QR mode forcing the same named-to-quick fallback path before printing the pairing URL. Terminal QR printing now also shares one helper, so startup auto-print, manual desktop QR printing, and QR-mode override URLs all apply the same API-key, streamer-mode, and LAN/tunnel URL normalization rules before printing. Desktop startup and desktop settings reconfiguration now also converge on one config-driven remote-access reconciler, so enabling, disabling, and restarting the desktop remote server follows the same Cloudflare auto-start and teardown rules after launch. GUI quit and non-GUI graceful shutdown now also converge on the same loop/ACP/MCP/remote-server teardown helper, while desktop layers keyboard-listener cleanup on top.

## Common Debugging Scenarios

### Agent Not Responding

```bash
pnpm dev debug-llm
```

Check for:

- API key validation errors
- Model availability issues
- Rate limiting
- Token budget exhaustion

### Tools Not Working

```bash
pnpm dev debug-tools
```

Check for:

- Server connection failures
- Tool discovery issues
- Tool call argument errors
- Execution timeouts

### Voice Not Recording

Check:

- System microphone permissions
- Correct microphone selected in OS settings
- Keyboard accessibility permissions (macOS)
- Rust binary is built (`pnpm build-rs`)

### Mobile App Not Connecting

Check:

- Desktop app is running
- Remote server is accessible
- Correct URL in mobile settings
- Firewall/network configuration

## Environment Variables

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `SPEAKMCP_WORKSPACE_DIR` | Set workspace `.agents/` directory |
| `DEBUG`                  | Node.js debug flag                 |

## Langfuse (Production Debugging)

For production observability without terminal access, use the [Langfuse integration](/tools/observability):

- Trace all LLM calls with token usage
- Monitor tool execution success/failure
- Track agent session performance
- Debug multi-turn conversations

---

## Next Steps

- **[Observability](/tools/observability)** — Langfuse integration for production
- **[Development Setup](/development/setup)** — Full dev environment
- **[Remote API](api)** — API endpoint debugging
