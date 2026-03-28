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

| Feature | macOS | Windows | Linux |
|---------|-------|---------|-------|
| Voice recording | Yes | Yes | Yes |
| Voice transcription (STT) | Yes | Yes | Yes |
| Text-to-speech (TTS) | Yes | Yes | Yes |
| MCP tool execution | Yes | Limited | Limited |
| Keyboard hotkeys | Yes | Yes | Yes |
| Text injection | Yes | Yes | Yes |
| Agent delegation (ACP) | Yes | Yes | Yes |
| System tray | Yes | Yes | Yes |

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

| Section | Purpose |
|---------|---------|
| **General** | AI provider selection, TTS/STT settings, theme |
| **Providers** | API key management for OpenAI, Groq, Gemini |
| **Models** | Model selection and custom base URLs |
| **Capabilities** | MCP server management, tool enable/disable |
| **Agents** | Agent profile creation and management |
| **Loops** | Recurring automated task scheduling |
| **WhatsApp** | WhatsApp integration settings |

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

- **Desktop text input** uses the renderer/TIPC path for typed requests.
- **Desktop voice MCP mode** transcribes audio, then reuses the same top-level runner.
- **Headless CLI** starts the app with `--headless` and runs the same ACP/tool-routing path in a terminal.
- **QR headless pairing** starts the app with `--qr`, boots the same non-GUI runtime stack, and then prints a pairing QR code for remote/mobile clients.
- **Remote server** accepts API requests and forwards them through the same runner used by desktop and CLI.
- **Loops** create background sessions and then call into the same shared top-level execution path.
- **Desktop, headless CLI, and QR startup** now share the same MCP, loop, ACP, bundled-skill, and models.dev initialization path before their mode-specific UI, terminal, or pairing flow begins.

The repo-level feature matrix for these paths lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.

### Themes

DotAgents supports both **dark** and **light** themes with consistent design tokens across all UI components.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Hold `Ctrl` | Voice recording (macOS/Linux) |
| Hold `Ctrl+/` | Voice recording (Windows) |
| `Fn` | Toggle dictation on/off |
| Hold `Ctrl+Alt` | MCP agent mode (with tools) |
| `Ctrl+T` / `Ctrl+Shift+T` (Win) | Text input |
| `Ctrl+Shift+Escape` | Emergency stop (kill all agents) |

## Data Storage

All data is stored locally on your machine:

| Data | Location (macOS) |
|------|-------------------|
| Config | `~/Library/Application Support/DotAgents/` |
| Conversations | `~/.dotagents/conversations/` |
| Recordings | `~/.dotagents/recordings/` |
| Agent Config | `~/.agents/` |

---

## Next Steps

- **[Voice Interface](/voice/overview)** — Master the voice controls
- **[MCP Tools](/tools/mcp)** — Connect tools and services
- **[Agent Profiles](/agents/profiles)** — Create specialized agents
- **[Keyboard Shortcuts](/configuration/shortcuts)** — Full shortcut reference
