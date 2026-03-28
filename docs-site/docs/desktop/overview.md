---
sidebar_position: 1
sidebar_label: "Overview"
---

# Desktop App

The DotAgents desktop app is the full-featured agent orchestration platform — voice-first, tool-rich, and built for power users.

---

## Overview

Built with Electron, React, and Rust, the desktop app provides:

- **Voice-first interface** — Hold to speak, release to act
- **Multi-agent system** — Specialized agents with distinct skills and tools
- **MCP tool execution** — Connect to any tool via the Model Context Protocol
- **Real-time progress** — Watch agents think and act step by step
- **Cross-platform** — macOS (full support), Windows, and Linux

## Platform Support

| Feature                   | macOS | Windows | Linux   |
| ------------------------- | ----- | ------- | ------- |
| Voice recording           | Yes   | Yes     | Yes     |
| Voice transcription (STT) | Yes   | Yes     | Yes     |
| Text-to-speech (TTS)      | Yes   | Yes     | Yes     |
| MCP tool execution        | Yes   | Limited | Limited |
| Keyboard hotkeys          | Yes   | Yes     | Yes     |
| Text injection            | Yes   | Yes     | Yes     |
| Agent delegation (ACP)    | Yes   | Yes     | Yes     |
| System tray               | Yes   | Yes     | Yes     |

## Interface

### Sessions View

The main interface displays your conversation sessions in a grid or kanban layout. Each session shows:

- Conversation thread with the agent
- Tool execution steps with real-time progress
- Token usage and performance metrics
- Agent identification (which agent handled the request)

### Panel Mode

DotAgents can run as a compact **floating panel** — a small window that stays on top of other applications. This mode provides quick access to voice recording and agent interaction without switching windows.

### Settings

The settings interface has dedicated sections:

| Section          | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| **General**      | AI provider selection, TTS/STT settings, theme |
| **Providers**    | API key management for OpenAI, Groq, Gemini    |
| **Models**       | Model selection and custom base URLs           |
| **Capabilities** | MCP server management, tool enable/disable     |
| **Agents**       | Agent profile creation and management          |
| **Loops**        | Recurring automated task scheduling            |
| **WhatsApp**     | WhatsApp integration settings                  |

## Key Features

### Agent Selection

Switch between agents using the **agent selector** dropdown in the main interface. Each agent has its own:

- System prompt and personality
- Enabled tools and MCP servers
- Skills and knowledge
- Model configuration (can override the global model)

### Real-Time Progress

When an agent executes tools, you see live progress:

1. **Thinking** — The agent is reasoning about the task
2. **Tool Call** — Shows which tool is being called and with what parameters
3. **Executing** — Real-time status of tool execution
4. **Result** — Tool output displayed inline
5. **Continuing** — Agent processes the result and decides next steps

### Conversation History

All conversations are persisted locally and searchable:

- Full message history with tool calls and results
- Session metadata (agent used, duration, token count)
- Export and review past interactions
- Continue previous conversations

### Tool Approval

For sensitive operations, DotAgents can prompt for user approval before executing tools. Configure approval policies per-agent or per-tool in the capabilities settings.

### MCP Elicitation

DotAgents supports the MCP 2025 elicitation protocol — when an MCP server needs additional input from you during tool execution, a dialog appears for you to provide it.

### Agent Bundles

Export and import complete agent configurations:

- **Export** — Package an agent's profile, skills, and config into a shareable bundle
- **Import** — Load a bundle to recreate an agent on your machine
- Share agents with teammates or the community

### Loops (Recurring Tasks)

Set up tasks that run on a schedule:

- Define a prompt and interval (e.g., "Check my email every 10 minutes")
- Select which agent handles the loop
- Monitor loop execution history
- Pause and resume loops

### Execution Paths

The desktop app exposes multiple top-level ways to run the same agent engine:

- **Desktop text input** uses the renderer/TIPC path for typed requests, queues follow-ups for active sessions when needed, and otherwise reuses the same shared prompt/session bootstrap as CLI and remote entrypoints.
- **Desktop voice MCP mode** emits transcription progress on the desktop session, then reuses the same shared prompt/session bootstrap once the transcript is ready.
- **Headless CLI** starts the app with `--headless` and runs the same ACP/tool-routing path in a terminal.
- **Headless CLI conversation browsing** now lets `/conversations`, `/use <conversation-id-prefix>`, and `/show [conversation-id-prefix]` inspect and continue prior sessions without leaving the terminal, and the history/load path for `/conversations` plus `/show` now shares the same main-process conversation-management helpers that desktop session queries use.
- **Headless CLI session state controls** now let `/pin [conversation-id-prefix]` and `/archive [conversation-id-prefix]` manage the same pinned/archived conversation state the desktop UI uses.
- **Headless CLI conversation management** now also lets `/rename <title>`, `/delete [conversation-id-prefix]`, and `/delete-all` reuse the same conversation-management path the desktop app uses, while desktop `tipc.ts` conversation history/load/save/create/add handlers and remote conversation history/recovery routes now also reuse that same helper layer.
- **Headless CLI MCP server controls** now also expose `/mcp`, `/mcp-show <server-name-prefix>`, `/mcp-enable <server-name-prefix>`, `/mcp-disable <server-name-prefix>`, `/mcp-restart <server-name-prefix>`, `/mcp-stop <server-name-prefix>`, and `/mcp-logs <server-name-prefix>`, and those commands share the same MCP server summary, selection, runtime-toggle, restart/stop, and log helpers that the desktop capabilities UI and remote MCP status/toggle routes use.
- **Headless CLI agent selection** now also exposes `/agents` and `/agent <agent-id-or-name>`, and that switch shares one activation helper with desktop agent selection plus remote/mobile profile switching so profile-specific model/audio and MCP runtime config apply the same way everywhere.
- **Headless CLI agent management** now also exposes `/agent-profiles`, `/agent-show <agent-id-or-name>`, `/agent-new <json>`, `/agent-edit <agent-id-or-name> <json>`, `/agent-toggle <agent-id-or-name>`, and `/agent-delete <agent-id-or-name>`, and those commands share the same profile-selection, create/update validation, connection sanitization, enable/disable toggle, and delete-protection helper path that the desktop Settings > Agents screen and remote `/v1/agent-profiles` routes use.
- **Headless CLI agent profile import/export** now also exposes `/agent-export <agent-id-or-name>`, `/agent-export-file <agent-id-or-name> <path>`, `/agent-import <json>`, and `/agent-import-file <path>`, and those commands share the same import/export helper path that desktop profile export/import handlers and remote `/v1/profiles/:id/export` plus `/v1/profiles/import` use.
- **Headless CLI repeat-task controls** now also expose `/loops`, `/loop-show <loop-id-or-name>`, `/loop-new <json>`, `/loop-edit <loop-id-or-name> <json>`, `/loop-toggle <loop-id-or-name>`, `/loop-run <loop-id-or-name>`, and `/loop-delete <loop-id-or-name>`, and those commands share the same repeat-task selection, JSON validation, create/update/delete, enable/disable, and manual-run helpers that the desktop repeat-task page and remote loop API use.
- **Headless CLI knowledge note controls** now also expose `/notes`, `/note-show <note-id-or-prefix>`, `/note-search <query>`, `/note-new <json>`, `/note-edit <note-id-or-prefix> <json>`, `/note-delete <note-id-or-prefix>`, and `/note-delete-all`, and those commands share the same note list/search/save/update/delete helpers that the desktop knowledge workspace and remote note API use.
- **Headless CLI and desktop agent pickers** now also share the same enabled/default-profile filtering plus display-name fallback helpers, so terminal `/agent` matching, ACP main-agent config matching, the desktop next-session selector, and mobile selector lists all stay aligned before any profile activation happens.
- **Desktop and mobile ACP main-agent pickers** now also share the same ACP option builder, so desktop settings dropdowns, mobile ACP selector sheets, and main-process ACP validation all dedupe ACP-capable profile agents plus legacy stdio entries the same way before a main agent is chosen.
- **Headless CLI skill controls** now also expose `/skills` and `/skill <id>`, and those commands now share one main-process skill-management helper with the desktop profile-skill toggle path and remote `/v1/skills` routes for current-profile lookup, sorting, and toggle handling, while the shared profile-skill rules still decide effective enablement semantics.
- **Headless CLI skill catalog management** now also exposes `/skill-show`, `/skill-new`, `/skill-edit`, `/skill-delete`, `/skill-export`, `/skill-path`, `/skill-import-file`, `/skill-import-folder`, `/skill-import-parent`, `/skill-import-github`, `/skill-scan`, and `/skill-cleanup`, and those commands now share the same catalog CRUD/import/export/open-file cleanup helpers that power the desktop Settings > Skills screen through `tipc.ts`.
- **Headless `/agents` and the desktop Agents catalog** now also share one agent-summary helper path, so both surfaces fall back from description to guidelines the same way and render the same connection/provider/server/skill/property metadata plus built-in/default/disabled/current labels before presentation diverges into terminal rows or cards.
- **QR headless pairing** starts the app with `--qr`, boots the same non-GUI runtime stack, and then prints a pairing QR code for remote/mobile clients.
- **Remote server** accepts API requests and forwards them through the same runner used by desktop and CLI.
- **Loops** create background sessions and then call into the same shared top-level execution path.
- **Repeat task summaries and runtime actions** now also share one main-process helper path, so the desktop repeat-task settings page, headless CLI repeat-task controls, and remote `/v1/loops` endpoints all report the same profile name plus running/last-run/next-run fields and apply the same enable/disable/manual-run behavior.
- **Desktop text, voice, CLI, remote, and loop entrypoints** now share the same fresh-prompt launcher above the top-level runner, while queued desktop follow-ups and ACP parent-resume nudges share a dedicated resume-only launcher so they do not duplicate persisted turns.
- **Desktop knowledge workspace + CLI note controls** now also share one main-process knowledge-note helper path through `tipc.ts`, so desktop note browsing/search/edit/delete, CLI note commands, agent-summary note saves, and remote note CRUD all normalize and persist notes the same way.
- **CLI conversation selection** now resolves full IDs and unique ID prefixes through one shared helper before the next prompt reuses the same conversation bootstrap path as desktop follow-ups.
- **CLI session pin/archive state** now also shares one set of session helpers, so pinned-first ordering plus pinned/archived conversation IDs stay aligned between the headless CLI, desktop session views, desktop config hydration, remote settings payloads, and mobile sync.
- **CLI conversation rename/delete flows** now also share one main-process helper, so terminal renames/deletes, desktop history actions, and runtime `set_session_title` all reuse the same title-sync plus pinned/archived cleanup path.
- **Conversation/session bootstrap** still lives in one place underneath those launchers, and resumed runs now reuse the same shared session-revival and history-loading path so transcription handoffs, queued follow-ups, and resumed prompts stay aligned across surfaces.
- **Runtime session state** is also owned by the shared session manager, so remote, loop, CLI, and desktop runs no longer reset the legacy active/stop/iteration flags independently.
- **Desktop, headless CLI, and QR startup** now share the same MCP, loop, ACP, bundled-skill, and models.dev initialization path before their mode-specific UI, terminal, or pairing flow begins, and the two non-GUI modes now also share one top-level launcher for startup failure handling and signal ownership.
- **Headless CLI Ctrl+C** stays owned by the terminal REPL, while the shared non-GUI launcher only claims `SIGTERM` for that mode so stop-or-exit behavior matches the CLI surface instead of racing a global shutdown handler.
- **Desktop remote access, headless CLI, and QR pairing** now share the same remote-access bootstrap, so remote-server startup plus config-driven Cloudflare auto-start and QR fallback behavior stay aligned across surfaces.
- **Desktop startup and desktop settings reconfiguration** now also share the same config-driven remote-access reconciler, so enabling, disabling, or restarting the remote server from settings follows the same Cloudflare auto-start/stop rules as app startup.
- **Terminal QR printing** now also shares one helper, so headless auto-print, desktop manual QR printing, and `--qr` override URLs all apply the same API-key, streamer-mode, and URL-resolution rules before printing pairing output.
- **Remote server settings previews and runtime status** now also share the same mobile-pairing URL helper, so loopback/wildcard warnings, IPv6 URL formatting, and default bind/port fallbacks stay aligned between the settings page, QR logic, and headless defaults.
- **MCP server status classification** now also shares one helper, so headless `/status`, the desktop capabilities screens, and the remote `/v1/mcp/servers` endpoint all distinguish disabled vs stopped vs connected/error/disconnected servers the same way.
- **MCP server management** now also shares one main-process helper, so headless MCP commands, the desktop capabilities UI runtime-toggle/restart/stop actions, and the remote MCP list/toggle routes all resolve exact-name/unique-prefix selection, runtime enablement, lifecycle actions, and recent log lookup the same way.
- **Agent/MCP model resolution** now also shares one provider/model resolver, so the settings page defaults, headless CLI status output, desktop progress metadata, remote API model payloads, MCP sampling defaults, and AI SDK runtime model creation all use the same fallback and OpenAI-compatible provider-label rules.
- **Speech provider defaults** now also share STT/TTS selectors, so onboarding checks, speech settings pages, provider badges, remote settings payloads, transcript-provider fallbacks, and runtime transcription/TTS defaults all agree on the same effective provider, model, and voice choices.
- **OpenAI-compatible preset resolution** now also shares one preset resolver, so CLI/provider labels, remote settings payloads, weak summarization preset lookup, preset editors, and preset-scoped model fetches all use the same built-in override, duplicate-filtering, legacy OpenAI-key fallback, and default preset ID rules.
- **Conversation-history serialization** now also shares one formatter, so persisted tool results, desktop progress history, weak step summaries, and remote API conversation payloads all flatten tool calls/results the same way.
- **Desktop quit and non-GUI graceful shutdown** now also share the same runtime teardown helper, so loop shutdown plus ACP, MCP, and remote-server cleanup stay aligned while the GUI layers keyboard-listener cleanup on top.

The repo-level feature matrix for these paths lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.

### Themes

DotAgents supports both **dark** and **light** themes with consistent design tokens across all UI components.

## Keyboard Shortcuts

| Shortcut                        | Action                           |
| ------------------------------- | -------------------------------- |
| Hold `Ctrl`                     | Voice recording (macOS/Linux)    |
| Hold `Ctrl+/`                   | Voice recording (Windows)        |
| `Fn`                            | Toggle dictation on/off          |
| Hold `Ctrl+Alt`                 | MCP agent mode (with tools)      |
| `Ctrl+T` / `Ctrl+Shift+T` (Win) | Text input                       |
| `Ctrl+Shift+Escape`             | Emergency stop (kill all agents) |

## Data Storage

All data is stored locally on your machine:

| Data          | Location (macOS)                           |
| ------------- | ------------------------------------------ |
| Config        | `~/Library/Application Support/DotAgents/` |
| Conversations | `~/.dotagents/conversations/`              |
| Recordings    | `~/.dotagents/recordings/`                 |
| Agent Config  | `~/.agents/`                               |

---

## Next Steps

- **[Voice Interface](/voice/overview)** — Master the voice controls
- **[MCP Tools](/tools/mcp)** — Connect tools and services
- **[Agent Profiles](/agents/profiles)** — Create specialized agents
- **[Keyboard Shortcuts](/configuration/shortcuts)** — Full shortcut reference
