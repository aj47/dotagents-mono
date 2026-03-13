# The .agents Protocol

The `.agents/` directory is an open standard for agent configuration. Define your skills, memories, and commands once, and they work across DotAgents, Claude Code, Cursor, Codex, and every tool adopting the protocol.

**Protocol first, product second.**

---

## Why an Open Protocol?

AI agents are proliferating across tools — coding assistants, voice interfaces, automation platforms. But each tool locks agent configuration into its own format. The `.agents` protocol solves this by providing a shared, file-based standard that any tool can read.

Your skills, memories, and agent profiles become **portable assets** that travel with your projects.

## Directory Structure

```
.agents/
├── speakmcp-settings.json   # General settings
├── mcp.json                 # MCP server configuration
├── models.json              # Model presets and provider keys
├── system-prompt.md         # Custom system prompt
├── agents.md                # Agent guidelines
├── layouts/
│   └── ui.json              # UI/layout settings
├── agents/
│   └── <agent-id>/
│       ├── agent.md          # Agent profile definition
│       └── config.json       # Agent-specific configuration
├── skills/
│   └── <skill-id>/
│       └── skill.md          # Skill definition and instructions
├── memories/
│   ├── memory_1.md           # Persistent memory entry
│   └── memory_2.md
└── .backups/                 # Auto-rotated timestamped backups
```

## Two-Layer System

The `.agents` protocol uses a **two-layer** configuration system:

### Global Layer (`~/.agents/`)

- Canonical source of truth for your personal agent configuration
- Created automatically on first app launch
- Updated when you change settings in the UI
- Shared across all workspaces and projects

### Workspace Layer (`./.agents/`)

- Optional overlay that lives in your project directory
- Overrides global settings for project-specific configuration
- Version-controllable with git
- Set via `SPEAKMCP_WORKSPACE_DIR` env var or auto-discovered

### Merge Semantics

```
Final Config = Global Config + Workspace Config
                              (workspace wins on conflicts)
```

Skills and memories merge by ID — workspace versions override global versions with the same ID.

## File Formats

### Agent Profiles (`agent.md`)

Agent profiles use markdown with frontmatter:

```markdown
---
id: code-reviewer
name: code-reviewer
displayName: Code Reviewer
description: Reviews code for bugs and security issues
enabled: true
---

You are an expert code reviewer...

## Guidelines

- Focus on security vulnerabilities
- Provide actionable feedback
```

### Skills (`skill.md`)

Skills are instruction files with metadata:

```markdown
---
kind: skill
id: document-processing
name: Document Processing
description: Create, edit, and analyze .docx files
createdAt: 1234567890
updatedAt: 1234567890
source: local
---

# Document Processing Skill

## Overview
This skill enables working with Word documents...
```

### Memories (`memory.md`)

Memories are persistent context entries:

```markdown
---
kind: memory
id: project-architecture
createdAt: 1234567890
updatedAt: 1234567890
title: Project Architecture
content: This project uses a microservices architecture with...
importance: high
tags: architecture, project, context
keyFindings: ["Uses microservices", "PostgreSQL database", "Redis caching"]
---

Additional notes and context...
```

### JSON Configuration Files

Standard JSON files for structured settings:

```json
// mcp.json
{
  "mcpServers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "..." }
    }
  }
}
```

## Resilience

The `.agents` protocol is built to be resilient:

- **Atomic writes** — Writes to a temp file first, then renames to prevent corruption
- **Timestamped backups** — Auto-rotated backup copies in `.backups/`
- **Auto-recovery** — Automatic recovery from corrupted files using backups
- **Human-readable** — All files are markdown or JSON — editable by hand

## Cross-Tool Compatibility

The `.agents/` directory is designed to work across AI tools:

| Tool | Support |
|------|---------|
| **DotAgents** | Full support (native) |
| **Claude Code** | Skills and memories |
| **Cursor** | Skills (via `.cursor/` compatibility) |
| **Codex** | Skills and agent configuration |
| **OpenCode** | Skills support |

Skills you define for DotAgents work in Claude Code, Cursor, and any tool that reads the `.agents/` directory.

---

## Next Steps

- **[Protocol Ecosystem](protocol-ecosystem.md)** — How MCP, ACP, and Skills interoperate
- **[Skills](../agents/skills.md)** — Create and manage agent skills
- **[Memory](../agents/memory.md)** — Persistent agent context
