---
sidebar_position: 2
sidebar_label: "The .agents Protocol"
---

# The .agents Protocol

The `.agents/` directory is an open standard for agent configuration. Define your skills, knowledge concepts, and commands once, and they work across DotAgents, Claude Code, Cursor, Codex, and every tool adopting the protocol.

**Protocol first, product second.**

---

## Why an Open Protocol?

AI agents are proliferating across tools — coding assistants, voice interfaces, automation platforms. But each tool locks agent configuration into its own format. The `.agents` protocol solves this by providing a shared, file-based standard that any tool can read.

Your agents, skills, and knowledge concepts become **portable assets** that travel with your projects.

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
│       ├── agent.md         # Agent definition
│       └── config.json      # Agent-specific configuration
├── tasks/
│   └── <task-id>/
│       └── task.md          # Recurring loop/task definition
├── skills/
│   └── <skill-id>/
│       └── skill.md         # Skill definition and instructions
├── knowledge/
│   ├── index.md                    # Bundle listing (OKF §3.1, §8, §12)
│   ├── log.md                      # Update history (OKF §3.1, §9)
│   ├── references/                 # Non-markdown assets (OKF §6.3)
│   │   ├── diagram.png
│   │   └── db-schema.pdf
│   └── project-architecture/
│       └── project-architecture.md  # Concept document (OKF §4)
└── .backups/                 # Auto-rotated timestamped backups
```

## Two-Layer System

The `.agents` protocol uses a **two-layer** configuration system:

### Global Layer (`~/.agents/`)

- Canonical source of truth for your global agent configuration
- Created automatically on first app launch
- Shared across all workspaces and projects
- Stores global agents, skills, and knowledge concepts

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

Agents, tasks, skills, and concepts merge by ID — workspace versions override global versions with the same ID. JSON config files are shallow-merged by key, so avoid assuming nested objects merge deeply.

## File Formats

Markdown files in `.agents/` use simple `key: value` frontmatter. It is **not full YAML** — with one exception: knowledge concepts follow the [OKF v0.2 spec](https://github.com/GoogleCloudPlatform/open-knowledge-format), whose trust/provenance fields (`generated`, `verified`, `sources`, etc.) may use nested YAML structures as OKF defines them.

### Agents (`agent.md`)

Agents use markdown with frontmatter. Connection type is stored as `connection-type` in `agent.md`; nested connection details live in `config.json`.

```markdown
---
kind: agent
id: code-reviewer
name: code-reviewer
displayName: Code Reviewer
description: Reviews code for bugs and security issues
enabled: true
role: chat-agent
connection-type: internal
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

### Concepts (`.agents/knowledge/<slug>/<slug>.md`)

`.agents/knowledge/` is the home for [OKF (Open Knowledge Format)](https://github.com/GoogleCloudPlatform/open-knowledge-format) v0.2 knowledge bundles. The artifacts in a bundle are **concepts** — markdown documents with YAML frontmatter, carrying `type`, the single required OKF field.

```markdown
---
type: Reference
title: Project Architecture
description: Service-oriented Electron app with layered .agents config.
context: auto
generated: { by: human:you, at: 2026-09-21T02:00:00Z }
tags: [architecture, project, context]
---

## Details

Additional concept content...
```

`context: auto | search-only` is the dotagents-defined runtime-injection semantic, expressed as an OKF extension key. Most concepts should use `context: search-only`. Reserve `context: auto` for a tiny, curated set of high-signal working concepts.

See [Knowledge & Concepts](/agents/knowledge-notes) for the full format, the `references/` asset convention, and the field mappings.

### Tasks (`.agents/tasks/<task-id>/task.md`)

Tasks are repeatable prompts that the DotAgents desktop scheduler can run on an interval, wall-clock schedule, or continuous loop.

```markdown
---
kind: task
id: reviewed-daily-plan
name: Reviewed Daily Plan
enabled: true
intervalMinutes: 1440
profileId: planner
critiquePass: true
criticProfileId: strict-critic
---

Draft today's execution plan, write it to `~/.agents/tasks/reviewed-daily-plan/latest.md`, and revise it after the critique pass.
```

Use [Repeat Tasks](/agents/repeat-tasks) for the full task format, scheduler fields, same-session behavior, and critique-pass design guidance.

### Concept Assets (`references/`)

Non-markdown assets follow OKF's `references/` convention (§6.3): the file is mirrored into the bundle under `references/`, and a concept points at it via `resource:` (the underlying asset the concept describes) or `sources[].resource` (provenance). The concept body carries the curated knowledge; the asset is the evidence.

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
| **Claude Code** | Skills and knowledge concepts |
| **Cursor** | Skills (via `.cursor/` compatibility) |
| **Codex** | Skills and agent configuration |
| **OpenCode** | Skills support |

Skills and markdown-based `.agents` content are designed to stay portable across tools that adopt the protocol.

---

## Next Steps

- **[Protocol Ecosystem](protocol-ecosystem)** — How MCP, ACP, and Skills interoperate
- **[Skills](/agents/skills)** — Create and manage agent skills
- **[Knowledge & Concepts](/agents/knowledge-notes)** — Durable agent knowledge
