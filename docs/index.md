# DotAgents Documentation

> **One dot. Every agent.** Your assistant. Your machine. Your rules.

Welcome to the DotAgents documentation. DotAgents is a voice-first AI agent orchestrator that gives you a team of AI specialists — each with memory, skills, and tools — controlled by your voice.

Built on the `.agents` open standard, your skills work across Claude Code, Cursor, Codex, and every tool adopting the protocol.

---

## Quick Navigation

### Get Started

- **[Installation](getting-started/installation.md)** — Download and install DotAgents on macOS, Windows, or Linux
- **[Quick Start](getting-started/quickstart.md)** — Up and running in under 5 minutes
- **[Your First Agent](getting-started/first-agent.md)** — Create and configure your first AI agent

### Core Concepts

- **[Architecture Overview](concepts/architecture.md)** — How DotAgents is built and how the pieces fit together
- **[The .agents Protocol](concepts/dot-agents-protocol.md)** — The open standard for agent configuration
- **[Protocol Ecosystem](concepts/protocol-ecosystem.md)** — MCP, ACP, Skills, and how they interoperate

### Platform Guides

- **[Desktop App](desktop/overview.md)** — The full-featured Electron desktop experience
- **[Mobile App](mobile/overview.md)** — AI agents on iOS, Android, and the web
- **[Voice Interface](voice/overview.md)** — Hold to speak, release to act

### Agent System

- **[Agent Profiles](agents/profiles.md)** — Specialized AI personas with distinct skills and tools
- **[Skills](agents/skills.md)** — Portable, reusable agent capabilities
- **[Memory](agents/memory.md)** — Persistent context across sessions
- **[Multi-Agent Delegation (ACP)](agents/delegation.md)** — Agents delegating tasks to other agents

### Tools & Integrations

- **[MCP Tools](tools/mcp.md)** — Connect to any tool via the Model Context Protocol
- **[WhatsApp Integration](tools/whatsapp.md)** — Send and receive messages through WhatsApp
- **[Observability (Langfuse)](tools/observability.md)** — Monitor, trace, and debug your agents
- **[AI Providers](tools/providers.md)** — Configure OpenAI, Groq, Google Gemini, and local models

### Configuration

- **[Settings Reference](configuration/settings.md)** — All configurable options in one place
- **[MCP Server Configuration](configuration/mcp-servers.md)** — Add and manage tool servers
- **[Keyboard Shortcuts](configuration/shortcuts.md)** — Every hotkey and shortcut

### Security & Privacy

- **[Security Model](security/security.md)** — How DotAgents protects your data
- **[Privacy Policy](security/privacy.md)** — Zero data collection, local-first design

### Development

- **[Development Setup](development/setup.md)** — Clone, build, and run from source
- **[Architecture Deep Dive](development/architecture.md)** — Technical architecture for contributors
- **[Contributing](development/contributing.md)** — How to contribute to DotAgents

### Reference

- **[Remote API](reference/api.md)** — HTTP API for mobile and external clients
- **[CLI & Debug Flags](reference/debug.md)** — Debug logging and diagnostic tools
- **[Glossary](reference/glossary.md)** — Key terms and definitions

---

## What is DotAgents?

DotAgents is three things:

**1. An App** — A voice-first AI agent interface. Hold to speak, release to act. Your agents listen, think, and execute tools on your behalf. Available on desktop (macOS, Windows, Linux) and mobile (iOS, Android).

**2. The `.agents` Protocol** — An open standard for agent skills, memories, and commands. Define your skills once in `.agents/`, and they work across Claude Code, Cursor, OpenCode, and any tool that adopts the protocol.

**3. Agent Skills** — Reusable capabilities your agents can learn. Skills are portable, shareable, and composable — not locked into any single tool or vendor.

---

## Community & Support

- **[Discord](https://discord.gg/cK9WeQ7jPq)** — Join the DotAgents community
- **[GitHub](https://github.com/aj47/dotagents-mono)** — Source code, issues, and releases
- **[Website](https://dotagents.app)** — dotagents.app

---

## License

DotAgents is open source under the [AGPL-3.0 License](https://github.com/aj47/dotagents-mono/blob/main/LICENSE).
