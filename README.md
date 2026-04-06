<p align="center">
  <strong>dotagents</strong>
</p>

<p align="center">
  <em>One dot. Every agent.</em>
</p>

<p align="center">
  <a href="https://github.com/aj47/dotagents-mono/releases/latest"><strong>Download</strong></a> &middot;
  <a href="https://discord.gg/cK9WeQ7jPq"><strong>Discord</strong></a> &middot;
  <a href="https://dotagents.app"><strong>Website</strong></a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-AGPL%203.0-blue.svg" alt="License: AGPL-3.0"></a>
  <a href="https://electronjs.org/"><img src="https://img.shields.io/badge/Electron-31.0.2-47848f.svg" alt="Electron"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.6.3-blue.svg" alt="TypeScript"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18.3.1-61dafb.svg" alt="React"></a>
</p>

---

DotAgents gives you a team of AI specialists — each with knowledge, skills, and tools — controlled by your voice. Built on the `.agents` open standard, so your skills work across Claude Code, Cursor, Codex, and every tool adopting the protocol.

## Preview

v1.4
<img width="1341" height="1174" alt="DotAgents v1.4" src="https://github.com/user-attachments/assets/4ea2fa66-9a22-4d56-b388-457dfc99fed6" />

[Watch the launch video on YouTube](https://www.youtube.com/watch?v=A4oKYCaeaaw)

<img width="2050" height="1564" alt="DotAgents" src="https://github.com/user-attachments/assets/a1e55c53-838f-414f-92e7-d752f74e7107" />

https://github.com/user-attachments/assets/0c181c70-d1f1-4c5d-a6f5-a73147e75182

## What is DotAgents?

DotAgents is three things:

**1. An App** — A voice-first AI agent interface. Hold to speak, release to act. Your agents listen, think, and execute tools on your behalf.

**2. The `.agents` Protocol** — An open standard for agent skills, knowledge notes, and commands. Define your skills once in `.agents/`, and they work across Claude Code, Cursor, OpenCode, and any tool that adopts the protocol.

**3. Agent Skills** — Reusable capabilities your agents can learn. Skills are portable, shareable, and composable — not locked into any single tool or vendor.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Skills** | Portable agent capabilities defined in `.agents/skills/`. Works across tools. |
| **Knowledge notes** | Persistent agent context stored in `.agents/knowledge/`. Agents retain note-based context across sessions. |
| **Agent Profiles** | Specialized AI personas with distinct skills and tools. Delegate tasks to the right agent. |
| **Voice Interface** | Hold-to-record, 30+ languages, auto-insert results into any app. Voice is the primary interface. |
| **MCP Tools** | Model Context Protocol integration for tool execution, OAuth 2.1 auth, and real-time progress. |
| **acpx Delegation** | Multi-agent coordination. Agents delegate subtasks to other agents through the `acpx` runner. |

## The `.agents` Protocol

The `.agents/` directory is an open standard for agent configuration that works across tools:

```
.agents/
├── skills/          # Reusable agent capabilities
├── knowledge/       # Persistent note context across sessions
├── commands/        # Custom agent commands
└── config.yaml      # Agent profiles and settings
```

Skills you define for DotAgents work in Claude Code, Cursor, Codex, and any tool adopting the protocol. Protocol first, product second.

## Quick Start

### Download

**[Download Latest Release](https://github.com/aj47/dotagents-mono/releases/latest)**

> **Platform Support**: macOS (Apple Silicon & Intel) with full MCP agent functionality.
> Windows/Linux: MCP tools not currently supported — see [v0.2.2](https://github.com/aj47/dotagents-mono/releases/tag/v0.2.2) for dictation-only builds.

### Usage

**Voice Recording:**

1. **Hold `Ctrl`** (macOS/Linux) or **`Ctrl+/`** (Windows) to start recording
2. **Release** to stop recording and transcribe
3. Text is automatically inserted into your active application

**MCP Agent Mode** (macOS only):

1. **Hold `Ctrl+Alt`** to start recording for agent mode
2. **Release `Ctrl+Alt`** to process with MCP tools
3. Watch real-time progress as the agent executes tools
4. Results are automatically inserted or displayed

**Text Input:**

- **`Ctrl+T`** (macOS/Linux) or **`Ctrl+Shift+T`** (Windows) for direct typing

## Features

| Category | Capabilities |
|----------|--------------|
| **Voice** | Hold-to-record, 30+ languages, Fn toggle mode, auto-insert to any app |
| **TTS** | 50+ AI voices via OpenAI, Groq, and Gemini with auto-play |
| **Multi-Agent** | Agent profiles, skill-based delegation, persistent knowledge, `acpx`-backed coordination |
| **MCP Tools** | Tool execution, OAuth 2.1 auth, real-time progress, conversation context |
| **Observability** | [Langfuse](https://langfuse.com/) integration for LLM tracing, token usage, and debugging |
| **Platform** | macOS/Windows/Linux, rate limit handling, multi-provider AI |
| **UX** | Dark/light themes, resizable panels, kill switch, conversation history |

## Configuration

**AI Providers** — Configure in settings:
- OpenAI, Groq, or Google Gemini API keys
- Model selection per provider
- Custom base URLs (optional)

**MCP Servers** — Add tools in `mcpServers` JSON format:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

**Keyboard Shortcuts**:

| Shortcut | Action |
|----------|--------|
| Hold `Ctrl` / `Ctrl+/` (Win) | Voice recording |
| `Fn` | Toggle dictation on/off |
| Hold `Ctrl+Alt` | MCP agent mode (macOS) |
| `Ctrl+T` / `Ctrl+Shift+T` (Win) | Text input |
| `Ctrl+Shift+Escape` | Kill switch |

## Development

```bash
git clone https://github.com/aj47/dotagents-mono.git && cd dotagents-mono
nvm use
pnpm install && pnpm build-rs && pnpm dev
```

See **[DEVELOPMENT.md](DEVELOPMENT.md)** for full setup, build commands, troubleshooting, and architecture details.

For the static marketing site, run:

```bash
cd website
python3 -m http.server 4321
```

### Architecture

```
dotagents-mono/
├── apps/
│   ├── desktop/     # Electron app (voice, agents, MCP)
│   └── mobile/      # React Native mobile app
├── packages/
│   └── shared/      # Shared utilities, types, and constants
├── website/         # Static marketing site for dotagents.app
└── .agents/         # The open standard — skills, knowledge notes, commands
```

## Contributing

We welcome contributions. Fork the repo, create a feature branch, and open a Pull Request.

**[Discord](https://discord.gg/cK9WeQ7jPq)** | **[Website](https://dotagents.app)**

## License

This project is licensed under the [AGPL-3.0 License](./LICENSE).

## Acknowledgments

Built on [Whispo](https://github.com/egoist/whispo). Powered by [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), [Groq](https://groq.com/), [Google](https://ai.google.dev/). [MCP](https://modelcontextprotocol.io/). [Electron](https://electronjs.org/). [React](https://reactjs.org/). [Rust](https://rust-lang.org/).

---

**Made with care by the DotAgents community**
