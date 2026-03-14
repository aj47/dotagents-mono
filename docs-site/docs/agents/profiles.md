---
sidebar_position: 1
sidebar_label: "Agent Profiles"
---

# Agent Profiles

Agent profiles define specialized AI personas — each with its own identity, behavior, skills, tools, and connection method. Think of them as job descriptions for your AI agents.

---

## Profile Structure

Every agent profile has these components:

```
AgentProfile
├── Identity
│   ├── id              — Unique identifier
│   ├── name            — Canonical name for lookup
│   ├── displayName     — User-facing name
│   ├── description     — What this agent does
│   └── avatarDataUrl   — Optional avatar image
│
├── Behavior
│   ├── systemPrompt    — Core instructions
│   ├── guidelines      — Additional rules
│   └── properties      — Key-value metadata
│
├── Model Configuration
│   ├── provider        — AI provider override
│   └── model           — Model override
│
├── Tool Access
│   ├── enabledServers      — Whitelist of MCP servers
│   ├── disabledServers     — Blacklist of MCP servers
│   ├── disabledTools       — Specific tools to block
│   └── enabledBuiltinTools — Whitelist of built-in tools
│
├── Skills
│   └── enabledSkills   — Which skills this agent can use
│
├── Connection
│   ├── type            — internal | acp | stdio | remote
│   ├── command         — Process to spawn (acp/stdio)
│   ├── args            — Process arguments
│   ├── env             — Environment variables
│   └── baseUrl         — Remote endpoint URL
│
└── State
    ├── enabled         — Is this agent active?
    ├── isDefault       — Is this the default agent?
    ├── isBuiltIn       — Is this a system agent?
    └── role            — delegation-target | user-profile | system-agent
```

## Creating Profiles

### Via the UI

1. Go to **Settings > Agents**
2. Click **Create Agent**
3. Fill in the identity fields (name, description)
4. Write a system prompt that defines the agent's behavior
5. Configure tool access (which MCP servers and tools to enable)
6. Optionally override the model/provider
7. Save

### Via Files

Create an `agent.md` file in `~/.agents/agents/<agent-id>/`:

```markdown
---
id: devops-assistant
name: devops-assistant
displayName: DevOps Assistant
description: Manages infrastructure, deployments, and CI/CD pipelines
enabled: true
---

You are a DevOps expert specializing in cloud infrastructure and CI/CD.

## Core Competencies

- AWS, GCP, and Azure infrastructure
- Docker and Kubernetes
- GitHub Actions and CI/CD pipelines
- Terraform and infrastructure as code
- Monitoring and alerting

## Guidelines

- Always verify before running destructive commands
- Prefer infrastructure as code over manual changes
- Suggest monitoring and rollback strategies
- Follow the principle of least privilege
```

Optionally add `config.json` in the same directory:

```json
{
  "toolConfig": {
    "enabledServers": ["github", "filesystem", "docker"],
    "disabledTools": ["filesystem:delete_file"]
  },
  "modelConfig": {
    "provider": "openai",
    "model": "gpt-4o"
  },
  "skillsConfig": {
    "enabledSkills": ["docker-management", "ci-cd"]
  }
}
```

## Connection Types

### Internal

The default. The agent runs within DotAgents using your configured AI provider.

```json
{
  "connection": {
    "type": "internal"
  }
}
```

### ACP (Agent Client Protocol)

Spawns an external agent process for delegation. Used for Claude Code, Auggie, and other ACP-compatible agents.

```json
{
  "connection": {
    "type": "acp",
    "command": "claude-code-acp",
    "args": ["--acp"],
    "env": {
      "ANTHROPIC_API_KEY": "sk-..."
    }
  }
}
```

### Remote

Connects to an HTTP endpoint hosting an agent.

```json
{
  "connection": {
    "type": "remote",
    "baseUrl": "https://my-agent-server.com/api"
  }
}
```

### stdio

Communicates with a local process via stdin/stdout.

```json
{
  "connection": {
    "type": "stdio",
    "command": "python",
    "args": ["my_agent.py"]
  }
}
```

## Tool Access Control

### MCP Server Access

Control which MCP servers an agent can use:

```json
{
  "toolConfig": {
    "enabledServers": ["github", "filesystem"],
    "disabledServers": ["database"]
  }
}
```

- **enabledServers** — Only these servers are available (whitelist)
- **disabledServers** — These servers are blocked (blacklist)
- If neither is set, the agent has access to all configured MCP servers

### Individual Tool Control

Disable specific tools within enabled servers:

```json
{
  "toolConfig": {
    "disabledTools": [
      "filesystem:delete_file",
      "github:delete_repository"
    ]
  }
}
```

### Built-in Tool Control

Control access to DotAgents' built-in tools:

```json
{
  "toolConfig": {
    "enabledBuiltinTools": [
      "mark_work_complete",
      "respond_to_user",
      "load_skill_instructions"
    ]
  }
}
```

- `undefined` or `null` → all built-in tools available
- `[]` → all built-in tools available (unconfigured)
- `["tool1", "tool2"]` → only listed tools + essential tools
- `mark_work_complete` is always enabled regardless of configuration

## Agent Roles

| Role | Description |
|------|-------------|
| **delegation-target** | Can receive delegated tasks from other agents |
| **user-profile** | User-created agent profile |
| **system-agent** | Built-in system agent |

## Sharing Profiles

### Export

1. Go to **Settings > Agents**
2. Click **Export** on any agent
3. A bundle file is created containing the profile, skills, and configuration

### Import

1. Go to **Settings > Agents**
2. Click **Import**
3. Select a bundle file
4. The agent is recreated with all its configuration

Bundles are portable across machines and users.

---

## Next Steps

- **[Skills](skills)** — Teach agents specialized knowledge
- **[Memory](memory)** — Give agents persistent context
- **[Multi-Agent Delegation](delegation)** — Set up agent coordination
- **[MCP Tools](/tools/mcp)** — Configure available tools
