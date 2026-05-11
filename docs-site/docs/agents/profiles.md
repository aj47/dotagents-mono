---
sidebar_position: 1
sidebar_label: "Agents"
---

# Agents

Agents are specialized AI workers with their own identity, system prompt, tool access, skills, model overrides, and connection mode. The UI writes the same files described here, so anything created in **Settings > Agents** can also be reviewed and versioned on disk.

The route for this page remains `/agents/profiles` because the desktop API and TypeScript types still use `AgentProfile` internally.

## File Layout

Each agent lives under `.agents/agents/<agent-id>/`:

```text
.agents/
`-- agents/
    `-- code-reviewer/
        |-- agent.md      # identity, role, connection type, system prompt
        `-- config.json   # tool, model, skill, and connection details
```

`agent.md` is required. `config.json` is optional and is only needed for nested settings that do not fit in simple frontmatter.

The global layer is `~/.agents/`. A workspace can add `./.agents/`; workspace agents with the same `id` override global agents.

## `agent.md`

`agent.md` uses simple `key: value` frontmatter, followed by the system prompt body. It is not full YAML.

```markdown
---
kind: agent
id: code-reviewer
name: code-reviewer
displayName: Code Reviewer
description: Reviews TypeScript changes for bugs and security issues
enabled: true
role: chat-agent
connection-type: internal
guidelines: Prioritize correctness, security, and actionable feedback.
---

You are an expert code reviewer specializing in TypeScript, React, and Electron.

When reviewing changes:

- Focus on behavior, security, and maintainability
- Reference concrete files and lines when possible
- Separate blocking issues from optional suggestions
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | No | Usually `agent`. |
| `id` | Yes | Stable unique identifier. Defaults from the folder name if omitted. |
| `name` | Yes | Canonical lookup name. Defaults to `id` if omitted. |
| `displayName` | Yes | User-facing name. Defaults to `name` if omitted. |
| `description` | No | Short summary shown in pickers and settings. |
| `enabled` | No | `true` by default. |
| `role` | No | `chat-agent`, `delegation-target`, or `external-agent`. |
| `connection-type` | No | `internal`, `acpx`, `acp`, `stdio`, or `remote`. Defaults to `internal`. Prefer `acpx` for external local agents. |
| `guidelines` | No | Short single-line behavior guidance. Longer instructions belong in the body. |
| `isDefault` | No | Marks the default chat agent. |
| `isStateful` | No | Keeps conversation state for the agent. |
| `autoSpawn` | No | Starts the external agent automatically when applicable. |

`user-profile` is accepted as a legacy alias for `chat-agent`, but new configs should use `chat-agent`.

## `config.json`

`config.json` stores nested configuration. Do not put the connection `type` here; the loader reads it from `connection-type` in `agent.md`.

```json
{
  "toolConfig": {
    "enabledServers": ["github", "filesystem"],
    "disabledTools": ["filesystem:delete_file"],
    "enabledRuntimeTools": [
      "set_session_title",
      "execute_command",
      "read_more_context",
      "mark_work_complete",
      "delegate_to_agent",
      "check_agent_status",
      "respond_to_user"
    ]
  },
  "modelConfig": {
    "provider": "openai",
    "model": "gpt-5.4-mini"
  },
  "skillsConfig": {
    "allSkillsDisabledByDefault": true,
    "enabledSkillIds": ["api-testing", "ci-cd"]
  }
}
```

### Config Sections

| Section | Description |
|---------|-------------|
| `toolConfig` | MCP server, MCP tool, and DotAgents runtime-tool access. |
| `modelConfig` | Provider/model overrides for internal agents. |
| `skillsConfig` | Per-agent skill access. Missing config means all skills are available. |
| `connection` | Extra connection fields such as `agent`, `command`, `args`, `cwd`, `env`, or `baseUrl`. |

## Connection Types

### Internal

Internal agents run inside DotAgents with the configured model provider.

```markdown
---
id: product-advisor
name: product-advisor
displayName: Product Advisor
enabled: true
role: chat-agent
connection-type: internal
---

You help evaluate product tradeoffs.
```

Internal agents usually do not need a `connection` section in `config.json`.

### acpx

Use `acpx` for external local agents that DotAgents can run through the `acpx` CLI.

```markdown
---
id: claude-reviewer
name: claude-reviewer
displayName: Claude Reviewer
description: Delegation target backed by Claude Code through acpx
enabled: true
role: delegation-target
connection-type: acpx
---

You review code changes and return prioritized findings.
```

```json
{
  "connection": {
    "agent": "claude-code",
    "cwd": "/path/to/workspace"
  }
}
```

`connection.agent` is the preferred acpx token. Known command names such as `codex-acp`, `claude-code-acp`, `auggie`, and `opencode` are also mapped to acpx tokens when only `connection.command` is set.

### Custom acpx Adapter

For a custom local adapter, keep `connection-type: acpx` in `agent.md` and put the command details in `config.json`:

```json
{
  "connection": {
    "command": "python",
    "args": ["my_agent.py", "--acp"],
    "cwd": "/path/to/agent",
    "env": {
      "AGENT_CONFIG": "production"
    }
  }
}
```

### Remote

Remote agents connect to an HTTP endpoint.

```markdown
---
id: hosted-analyst
name: hosted-analyst
displayName: Hosted Analyst
enabled: true
role: delegation-target
connection-type: remote
---

You handle long-running analysis tasks.
```

```json
{
  "connection": {
    "baseUrl": "https://agent.example.com/api"
  }
}
```

### stdio and Legacy ACP

`stdio` and `acp` are still accepted connection types for compatibility. Prefer `acpx` for new local external agents unless you are maintaining an existing integration.

## Tool Access

`toolConfig` controls which MCP servers, MCP tools, and runtime tools an agent can use.

```json
{
  "toolConfig": {
    "enabledServers": ["github", "filesystem"],
    "disabledServers": ["database"],
    "disabledTools": ["filesystem:delete_file"],
    "enabledRuntimeTools": [
      "set_session_title",
      "execute_command",
      "read_more_context",
      "mark_work_complete",
      "delegate_to_agent",
      "check_agent_status",
      "respond_to_user"
    ],
    "allServersDisabledByDefault": true
  }
}
```

| Field | Behavior |
|-------|----------|
| `enabledServers` | Whitelist of MCP servers available to the agent. |
| `disabledServers` | Servers blocked even if configured globally. |
| `disabledTools` | Individual tools blocked by server/tool identifier. |
| `enabledRuntimeTools` | Runtime-tool whitelist. Omit it to use the filesystem-first default runtime tools, including `set_session_title`, `execute_command`, `read_more_context`, and `mark_work_complete`. If you set an explicit list, include any default tools the agent should keep. |
| `allServersDisabledByDefault` | New MCP servers remain disabled until explicitly enabled. |

`mark_work_complete` remains available even when runtime tools are restricted.

## Skill Access

Missing `skillsConfig`, or `allSkillsDisabledByDefault: false`, means all loaded skills are available to the agent. To opt into specific skills, set `allSkillsDisabledByDefault: true` and list `enabledSkillIds`.

```json
{
  "skillsConfig": {
    "allSkillsDisabledByDefault": true,
    "enabledSkillIds": ["api-testing", "document-processing"]
  }
}
```

## Roles

| Role | Description |
|------|-------------|
| `chat-agent` | Selectable chat or voice agent shown in the agent picker. |
| `delegation-target` | Can receive delegated tasks from another agent. |
| `external-agent` | Backed by an external acpx, stdio, ACP, or remote connection. |

External connection types default to delegation behavior when no role is set.

## Creating Agents

### Via the UI

1. Go to **Settings > Agents**.
2. Click **Create Agent**.
3. Fill in identity, prompt, role, connection, tools, skills, and optional model settings.
4. Save.

### Via Files

Create `~/.agents/agents/<agent-id>/agent.md`, then add `config.json` only if the agent needs nested tool, model, skill, or connection settings.

For workspace-specific agents, use `./.agents/agents/<agent-id>/` inside the project. Workspace agents with matching IDs override global agents.

## Next Steps

- **[Your First Agent](/getting-started/first-agent)** - Build a simple agent from the UI or files
- **[Skills](skills)** - Add reusable instructions to agents
- **[Multi-Agent Delegation](delegation)** - Configure agents that delegate work
- **[The .agents Protocol](/concepts/dot-agents-protocol)** - Understand layered file-based config
