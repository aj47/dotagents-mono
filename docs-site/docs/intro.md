---
sidebar_position: 1
sidebar_label: "Welcome"
slug: /intro
---

# DotAgents Documentation

DotAgents is a desktop-first agent runtime with mobile control, voice input, file-backed agent configuration, MCP tools, and acpx delegation. These docs are organized around setup paths and operating surfaces, not feature marketing.

## Who Are You?

| You want to... | Start with... |
|----------------|---------------|
| Install DotAgents and send a first message | [Quick Start](getting-started/quickstart) |
| Download or build the desktop app | [Installation](getting-started/installation) |
| Create a specialized agent | [Your First Agent](getting-started/first-agent) |
| Pair the mobile app | [Remote Server & Mobile Pairing](desktop/remote-server) |
| Connect tools | [MCP Tools](tools/mcp) |
| Connect chat channels | [WhatsApp](tools/whatsapp) or [Discord](tools/discord) |
| Understand the file format | [The .agents Protocol](concepts/dot-agents-protocol) |
| Contribute to the repo | [Development Setup](development/setup) |

## Quick Setup

Install from source with the platform script:

```bash
curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash
```

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.ps1 | iex
```

Then follow [Quick Start](getting-started/quickstart) to configure a provider, run the app, and send a first message.

## How DotAgents Is Organized

| Area | What it covers |
|------|----------------|
| [Getting Started](getting-started/quickstart) | Install, first run, first agent, and setup flow |
| [Desktop](desktop/overview) | Electron app, sessions, panel, remote server, updater, and desktop integrations |
| [Mobile](mobile/overview) | Expo app, QR pairing, voice UX, operations dashboard, and mobile settings |
| [Agents](agents/profiles) | Agent files, repeat tasks, skills, knowledge notes, and acpx delegation |
| [Tools & Integrations](tools/mcp) | MCP tools, providers, WhatsApp, Discord, and Langfuse |
| [Configuration](configuration/settings) | Settings, MCP server config, and keyboard shortcuts |
| [Security](security/model) | Local-first data model, pairing, permissions, and privacy |
| [Reference](reference/api) | Remote API, headless CLI, diagnostics, and glossary |
| [Development](development/setup) | Monorepo map, build/release workflow, architecture, and docs coverage |

## Core Concepts

DotAgents has four core pieces:

1. **Desktop runtime** - The Electron app owns local agent sessions, tools, remote server APIs, integrations, and privileged system access.
2. **Mobile control surface** - The mobile app pairs to the desktop remote server for chat, voice, settings, and operations.
3. **Agent configuration** - Agents, skills, tasks, notes, MCP servers, and models live in layered `.agents` files.
4. **Tool and delegation layer** - MCP connects tools; acpx and ACP-compatible agents handle delegated work.

## Important References

- [Remote API](reference/api) - Every documented Fastify route used by mobile and external clients
- [Build, Release, Deploy](development/build-release-deploy) - Packaging, signing, docs builds, and deployment flow
- [Docs Coverage](development/docs-coverage) - The checklist and verifier used to keep docs aligned with source
- [Debug & Diagnostics](reference/debug) - Logs, diagnostic checks, and troubleshooting commands

## Community

- [Discord](https://discord.gg/cK9WeQ7jPq)
- [GitHub](https://github.com/aj47/dotagents-mono)
- [Docs](https://dotagents.app)
