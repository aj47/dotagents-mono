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

- `/agents` to list enabled agents and the current selection
- `/agent <agent-id-or-name>` to switch the active agent for future prompts
- `/conversations` to list recent sessions
- `/use <conversation-id-prefix>` to continue a specific session
- `/show [conversation-id-prefix]` to inspect recent messages before continuing
- `/rename <title>` to rename the current session
- `/pin [conversation-id-prefix]` to pin or unpin the current or selected session
- `/archive [conversation-id-prefix]` to archive or unarchive the current or selected session
- `/delete [conversation-id-prefix]` to delete the current or selected session
- `/delete-all` to clear all saved sessions and pinned/archive state

Use QR-based remote access while staying headless:

```bash
pnpm --filter @dotagents/desktop dev -- --qr
```

The headless CLI, QR mode, desktop UI, remote server, and loop scheduler all share the same top-level agent runner, so ACP routing and tool execution stay aligned across entry points. Fresh desktop text, voice, CLI, remote, and loop prompts now also share the same launcher and conversation/session bootstrap before entering that runner, while queued desktop follow-ups and ACP parent-resume nudges now share a dedicated resume-only launcher so they do not duplicate persisted or synthetic turns. Headless CLI conversation browsing now also resolves `/use`, `/show`, `/pin`, `/archive`, and `/delete` targets through the same conversation-selection and session-state helpers every time, so continuing or reclassifying an older session by ID or unique prefix follows one lookup path and one pinned/archived state path before it re-enters the shared prompt launcher or desktop/mobile surfaces. Those pinned/archived IDs now also hydrate through the same shared session-state normalizer in the renderer, remote settings API, and mobile sync path, so invalid payloads get stripped the same way everywhere before state is reused. CLI renames, deletes, desktop history actions, and runtime `set_session_title` now also converge on one shared conversation-management helper, so tracked session titles plus pinned/archived cleanup stay aligned across terminal, desktop UI, and runtime-tool entry points. Headless CLI agent switching plus desktop and remote/mobile profile switches now also converge on one shared activation helper, so current-profile persistence, model/STT/TTS overrides, and MCP runtime config get reapplied the same way before the next prompt runs. Agent picker readiness now also converges on one shared profile helper, so headless `/agents` output, `/agent` matching, ACP main-agent config matching, desktop next-session agent selection, mobile selector lists, and ACP-capable profile filtering all use the same enabled/default/display-name/id-prefix rules before activation. Desktop settings main-agent dropdowns, mobile ACP selector sheets, and main-process ACP validation now also share one ACP option helper, so ACP-capable profile agents and legacy stdio entries are deduped the same way before a main agent is selected or repaired. Legacy active/stop/iteration flags are likewise left to the shared session manager, which prevents one entry point from clearing another still-running session. The repo-level path matrix lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.

Headless, QR, and GUI startup also share the same runtime bootstrap for MCP, repeat tasks, ACP profile sync, bundled skills, and models.dev initialization, so both `--headless` and `--qr` now boot the same service stack as the desktop app before they diverge into the terminal REPL or QR pairing flow. The two non-GUI modes now also share one top-level launcher for startup failure handling and signal wiring; `--headless` intentionally leaves `SIGINT` / Ctrl+C to the terminal REPL so in-flight runs still stop locally before exiting, while QR mode lets the shared launcher own both `SIGINT` and `SIGTERM`. Remote server startup is likewise shared now: desktop remote access, headless CLI, and QR pairing all pass through the same remote-access bootstrap, which then reuses the same config-aware Cloudflare tunnel helper, with QR mode forcing the same named-to-quick fallback path before printing the pairing URL. Terminal QR printing now also shares one helper, so startup auto-print, manual desktop QR printing, and QR-mode override URLs all apply the same API-key, streamer-mode, and LAN/tunnel URL normalization rules before printing. Desktop startup and desktop settings reconfiguration now also converge on one config-driven remote-access reconciler, so enabling, disabling, and restarting the desktop remote server follows the same Cloudflare auto-start and teardown rules after launch. GUI quit and non-GUI graceful shutdown now also converge on the same loop/ACP/MCP/remote-server teardown helper, while desktop layers keyboard-listener cleanup on top.
The remote-server settings page now also consumes the same shared mobile-pairing URL helper that main-process status and QR paths use, so wildcard/loopback warnings, IPv6 URL formatting, and default bind/port fallbacks stay consistent between the GUI, QR output, and headless defaults. MCP server runtime classification now also goes through one shared helper, so headless `/status`, desktop capability screens, and the remote `/v1/mcp/servers` endpoint all distinguish disabled vs stopped vs connected/error/disconnected servers the same way. Repeat-task summaries now also go through one shared helper, so the desktop repeat-task page and the remote `/v1/loops` API both merge profile names with runtime last-run/next-run/is-running fields the same way.

Agent/MCP model selection now also goes through one shared provider/model resolver, so CLI status, renderer model defaults, progress metadata, MCP sampling defaults, remote API model payloads, and AI SDK runtime model creation all report the same effective provider/model pairing. Speech-provider defaults now also route through shared STT/TTS selectors, so onboarding checks, speech settings pages, transcript-provider fallbacks, remote settings payloads, and the live transcription/TTS runtime all agree on the same default provider/model/voice resolution. OpenAI-compatible preset resolution now also goes through one shared preset helper, so CLI/provider labels, remote preset payloads, weak summarization preset lookup, preset editors, and preset-scoped model fetches all apply the same built-in override, duplicate filtering, legacy OpenAI key fallback, and default preset ID rules. Conversation-history serialization now also goes through one shared formatter, so persisted tool results, desktop progress history, weak step summaries, and remote API conversation payloads all flatten tool calls/results the same way.

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
