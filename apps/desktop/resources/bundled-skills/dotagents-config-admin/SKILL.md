---
name: dotagents-config-admin
description: "Use this skill when you need to inspect, change, or create DotAgents configuration. It teaches the canonical .agents file layout, layer precedence, and safe edit recipes for settings, models, MCP, prompts, agents, skills, tasks, and knowledge notes."
---

# DotAgents Config Admin

## Overview

Treat the layered `.agents` filesystem as the canonical editable DotAgents configuration surface.

- Global layer: `~/.agents/`
- Workspace layer: `./.agents/`
- Workspace wins on conflicts
- Prefer direct file editing over narrow app-specific config tools

When changing unfamiliar DotAgents config, inspect the relevant files first, then make the smallest safe edit.

## Canonical file map

- `~/.agents/dotagents-settings.json` or `./.agents/dotagents-settings.json` — general app settings
- `~/.agents/mcp.json` or `./.agents/mcp.json` — MCP-related config
- `~/.agents/models.json` or `./.agents/models.json` — model/provider config
- `~/.agents/system-prompt.md` or `./.agents/system-prompt.md` — system prompt override
- `~/.agents/agents.md` or `./.agents/agents.md` — agent-wide guidelines
- `~/.agents/agents/<id>/agent.md` — agent identity/frontmatter
- `~/.agents/agents/<id>/config.json` — nested per-agent config
- `~/.agents/skills/<id>/skill.md` — skill definition and instructions
- `~/.agents/tasks/<id>/task.md` — repeat task definition
- `~/.agents/knowledge/<slug>/<slug>.md` — durable knowledge note

## Layering rules

- Prefer `./.agents/` for workspace-specific behavior
- Prefer `~/.agents/` for user-wide defaults
- Create new repeat tasks in `~/.agents/tasks/` by default
- Use `./.agents/tasks/` only when intentionally overriding or shadowing a global repeat task
- Config merge is shallow by key
- Agents, skills, tasks, and knowledge notes merge by ID
- When a workspace file intentionally overrides a global file, edit the workspace copy

## Edit workflow

1. Identify the config surface the user actually wants changed
2. Inspect the existing file before editing
3. Prefer editing the canonical `.agents` file directly
4. Keep edits minimal and preserve surrounding structure
5. If a change is risky or ambiguous, ask the user before applying it

## Recipes

### Change general settings

Edit `dotagents-settings.json` for app-level behavior that is not MCP-, model-, or layout-specific.

### Change model/provider configuration

Edit `models.json` for model presets, selected preset IDs, provider API keys/base URLs, and related model settings.

### Change MCP configuration

Edit `mcp.json` for MCP server definitions and enablement-related config.

### Change prompt behavior

- Edit `system-prompt.md` to change the core assistant prompt
- Edit `agents.md` to change reusable agent-wide guidance

### Change an agent profile

- Edit `agents/<id>/agent.md` for identity, display text, role, and other frontmatter-friendly fields
- Edit `agents/<id>/config.json` for nested config like connection, tools, models, or skills config

### Change a skill

Edit `skills/<id>/skill.md`. Keep the frontmatter valid and update the markdown instructions carefully.

### Change a repeat task

Edit `~/.agents/tasks/<id>/task.md` for the canonical repeat task definition. Use `./.agents/tasks/<id>/task.md` only for an intentional workspace override. Frontmatter defines the task metadata; the markdown body is the task prompt.

### Change durable knowledge

Edit `knowledge/<slug>/<slug>.md` directly. Default most notes to `context: search-only`; reserve `context: auto` for a tiny curated subset.

## Guardrails

- Do not invent non-canonical config paths when a canonical `.agents` path exists
- Avoid broad rewrites when a targeted edit is enough
- Respect process boundaries: renderer must not import from main-only files
- If both global and workspace layers exist, verify which layer should own the change before editing