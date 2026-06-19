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
- **Remote server** — Optional local HTTP API for mobile pairing, operator dashboards, and automation
- **Artifacts browser** — Find files, media, PDFs, HTML reports, and URLs produced by recent conversations

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
- Compact tool activity summaries that group calls, show counts, and keep large payloads collapsed
- Per-session model, thinking, verbosity, and service-tier controls when the selected provider supports them

### Panel Mode

DotAgents can run as a compact **floating panel** — a small window that stays on top of other applications. This mode provides quick access to voice recording and agent interaction without switching windows.

### Artifacts

The **Artifacts** view scans conversation history for user-facing outputs and links them back to their source sessions:

- Local files mentioned by agents, including markdown, text, PDFs, images, audio, video, and HTML
- URL references from conversation output
- Search and kind filters
- Inline previews for supported local artifacts
- Open, copy path or URL, and reveal-in-folder actions

HTML previews are sandboxed, and remote HTTP media is treated as an external URL rather than silently loading it as a trusted local preview.

### Settings

The settings interface has dedicated sections:

| Section | Purpose |
|---------|---------|
| **General** | AI provider selection, TTS/STT settings, theme |
| **Providers** | API key management for OpenAI, Groq, Gemini |
| **Models** | Model selection and custom base URLs |
| **Capabilities** | MCP server management, tool enable/disable |
| **Agents** | Agent profile creation and management |
| **Repeat Tasks** | Recurring automated task scheduling and critique passes |
| **Discord** | Discord bot integration, access lists, and default agent routing |
| **WhatsApp** | WhatsApp integration settings |
| **Remote Server** | Mobile QR pairing, API key, port/bind address, and tunnel controls |

## Key Features

### Agent Selection

Switch between agents using the **agent selector** dropdown in the main interface. Each agent has its own:

- System prompt and operating style
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
- Search across session prompts and final responses
- Archive sessions to keep the active sidebar focused without deleting history
- Group, reorder, rename, pin, and collapse sidebar sessions

### Tool Approval

For sensitive operations, DotAgents can prompt for user approval before executing tools. Configure approval policies per-agent or per-tool in the capabilities settings.

### MCP Elicitation

DotAgents supports the MCP 2025 elicitation protocol — when an MCP server needs additional input from you during tool execution, a dialog appears for you to provide it.

### Agent Bundles

Export and import complete agent configurations:

- **Export** — Package an agent's profile, skills, and config into a shareable bundle
- **Import** — Load a bundle to recreate an agent on your machine
- Share agents with teammates or the community

### Remote Server and Mobile Pairing

Enable **Settings > Remote Server** when you want DotAgents mobile, operator dashboards, or OpenAI-compatible clients to use your desktop runtime. The desktop app generates a bearer token and QR code for mobile pairing, and can optionally expose the server through a Cloudflare Tunnel.

### Messaging Integrations

Discord and WhatsApp let trusted messages reach the desktop agent runtime:

- **Discord** — DMs, mentions, and configured guild/channel traffic can run a selected agent profile. Operator slash commands are separately allowlisted.
- **WhatsApp** — MCP-backed messaging tools can send, read, and auto-reply to WhatsApp messages through the WhatsApp package.

### Repeat Tasks

Set up tasks that run on a schedule. See [Repeat Tasks](/agents/repeat-tasks) for the file format, cadence options, same-session behavior, and built-in critique pass.

- Define a prompt and interval (for example, "Check my email every 10 minutes")
- Select which agent handles the loop
- Enable a built-in worker -> critic -> worker revision pass
- Monitor loop execution history
- Pause and resume loops

### Themes

DotAgents supports both **dark** and **light** themes with consistent design tokens across all UI components.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Hold `Ctrl` | Voice recording (macOS/Linux) |
| Hold `Ctrl+/` | Voice recording (Windows) |
| `Fn` | Toggle dictation on/off |
| Hold `Ctrl+Alt` | Agent mode (with skills and tools) |
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
- **[Remote Server & Pairing](/desktop/remote-server)** — Connect mobile and remote clients
- **[Discord Integration](/tools/discord)** — Connect a Discord bot to trusted agents
- **[Keyboard Shortcuts](/configuration/shortcuts)** — Full shortcut reference
