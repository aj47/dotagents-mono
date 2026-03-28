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

Use QR-based remote access while staying headless:

```bash
pnpm --filter @dotagents/desktop dev -- --qr
```

The headless CLI, QR mode, desktop UI, remote server, and loop scheduler all share the same top-level agent runner, so ACP routing and tool execution stay aligned across entry points. Desktop text, voice, CLI, remote, and loop prompts now also share the same conversation/session bootstrap helpers before entering that runner. The repo-level path matrix lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.

Headless, QR, and GUI startup also share the same runtime bootstrap for MCP, repeat tasks, ACP profile sync, bundled skills, and models.dev initialization, so both `--headless` and `--qr` now boot the same service stack as the desktop app before they diverge into the terminal REPL or QR pairing flow.

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

| Variable | Description |
|----------|-------------|
| `SPEAKMCP_WORKSPACE_DIR` | Set workspace `.agents/` directory |
| `DEBUG` | Node.js debug flag |

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
