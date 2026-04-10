---
sidebar_position: 2
sidebar_label: "The .agents Protocol"
---

# The .agents Protocol

The `.agents/` directory is an open standard for agent configuration. Define your skills, knowledge notes, and commands once, and they work across DotAgents, Claude Code, Cursor, Codex, and every tool adopting the protocol.

**Protocol first, product second.**

---

## Why an Open Protocol?

AI agents are proliferating across tools — coding assistants, voice interfaces, automation platforms. But each tool locks agent configuration into its own format. The `.agents` protocol solves this by providing a shared, file-based standard that any tool can read.

Your skills, knowledge notes, and agent profiles become **portable assets** that travel with your projects.

## Directory Structure

```
.agents/
├── dotagents-settings.json  # General settings
├── mcp.json                 # MCP server configuration
├── models.json              # Model presets and provider keys
├── system-prompt.md         # Custom system prompt
├── agents.md                # Agent guidelines
├── layouts/
│   └── ui.json              # UI/layout settings
├── agents/
│   └── <agent-id>/
│       ├── agent.md         # Agent profile definition
│       └── config.json      # Agent-specific configuration
├── tasks/
│   └── <task-id>/
│       └── task.md          # Recurring loop/task definition
├── skills/
│   └── <skill-id>/
│       └── skill.md         # Skill definition and instructions
├── knowledge/
│   └── project-architecture/
│       ├── project-architecture.md  # Canonical note file
│       ├── diagram.png              # Note-local asset
│       └── db-schema.pdf            # Note-local asset
└── .backups/                 # Auto-rotated timestamped backups
```

## Two-Layer System

The `.agents` protocol uses a **two-layer** configuration system:

### Global Layer (`~/.agents/`)

- Canonical source of truth for your global agent configuration
- Created automatically on first app launch
- Shared across all workspaces and projects
- Stores global skills, agent profiles, and knowledge notes

### Workspace Layer (`./.agents/`)

- Optional overlay that lives in your project directory
- Overrides global settings for project-specific configuration
- Version-controllable with git
- Set via explicit workspace configuration using the `DOTAGENTS_WORKSPACE_DIR` env var

### Merge Semantics

```
Final Config = Global Config + Workspace Config
                              (workspace wins on conflicts)
```

Agents, tasks, skills, and notes merge by ID — workspace versions override global versions with the same ID. JSON config files are shallow-merged by key, so avoid assuming nested objects merge deeply.

## File Formats

Markdown files in `.agents/` use simple `key: value` frontmatter. It is **not full YAML**.

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

### Notes (`.agents/knowledge/<slug>/<slug>.md`)

Notes are the canonical markdown knowledge artifacts in `.agents/knowledge/`. The small runtime-injected subset are **working notes**, selected with `context: auto`.

```markdown
---
kind: note
id: project-architecture
title: Project Architecture
context: auto
updatedAt: 1234567890
tags: architecture, project, context
summary: Service-oriented Electron app with layered .agents config.
---

## Details

Additional notes and context...
```

Most notes should use `context: search-only`. Reserve `context: auto` for a tiny, curated set of high-signal working notes.

### Note-Local Assets

Notes can include related files in the same folder:

- Images like diagrams or screenshots
- Documents like PDFs or design notes
- Any other supporting assets needed with the note

No fixed `assets/` subfolder is required.

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
| **Claude Code** | Skills and knowledge notes |
| **Cursor** | Skills (via `.cursor/` compatibility) |
| **Codex** | Skills and agent configuration |
| **OpenCode** | Skills support |

Skills and markdown-based `.agents` content are designed to stay portable across tools that adopt the protocol.

---

## Next Steps

- **[Protocol Ecosystem](protocol-ecosystem)** — How MCP, ACP, and Skills interoperate
- **[Skills](/agents/skills)** — Create and manage agent skills
- **[Knowledge & Notes](/agents/knowledge-notes)** — Durable agent knowledge
