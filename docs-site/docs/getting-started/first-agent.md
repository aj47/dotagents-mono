---
sidebar_position: 3
sidebar_label: "Your First Agent"
---

# Your First Agent

DotAgents lets you create specialized AI agents — each with its own operating style, skills, tools, and durable knowledge. This guide walks you through creating your first custom agent.

---

## What is an Agent?

An agent is an AI specialist. Think of it as a job description for an AI: who it is, what it knows, what tools it can use, and how it behaves.

Every agent has:

- **Identity** — Name, description, avatar
- **System Prompt** — Core instructions that shape behavior
- **Guidelines** — Additional rules and constraints
- **Skills** — Specialized knowledge it can access
- **Tool Access** — Which MCP servers and tools it can use
- **Model** — Which AI model powers it (optional override for internal agents)

## Creating an Agent via the UI

1. Navigate to **Settings > Agents**
2. Click **"Create Agent"**
3. Fill in the agent:

| Field | Example |
|-------|---------|
| **Name** | `code-reviewer` |
| **Display Name** | `Code Reviewer` |
| **Description** | `Reviews code for bugs, security issues, and best practices` |
| **System Prompt** | `You are an expert code reviewer. Focus on security vulnerabilities, performance issues, and code quality. Always provide specific, actionable feedback.` |

4. Under **Tool Access**, select which MCP servers this agent can use (e.g., enable `github` for PR access)
5. Click **Save**

Your agent is now available in the agent selector dropdown.

## Creating an Agent via Files

Agents can also be defined as files in the `.agents/` directory — making them version-controllable and shareable.

### Agent Definition File

Create a file at `~/.agents/agents/<agent-id>/agent.md`:

```markdown
---
id: code-reviewer
name: code-reviewer
displayName: Code Reviewer
description: Reviews code for bugs, security issues, and best practices
enabled: true
role: chat-agent
connection-type: internal
---

You are an expert code reviewer specializing in TypeScript and React applications.

## Guidelines

- Focus on security vulnerabilities (OWASP Top 10)
- Flag performance anti-patterns
- Suggest specific, actionable improvements
- Be constructive, not critical
- Prioritize issues by severity

## What you know

- TypeScript best practices
- React patterns and anti-patterns
- Common security vulnerabilities
- Performance optimization techniques
```

### Agent Configuration

Optionally, create `~/.agents/agents/<agent-id>/config.json` for nested tool, model, skill, and connection settings. The connection type belongs in `agent.md` as `connection-type`, not in `config.json`.

```json
{
  "toolConfig": {
    "enabledServers": ["github", "filesystem"],
    "disabledTools": ["filesystem:delete_file"]
  },
  "modelConfig": {
    "provider": "openai",
    "model": "gpt-5.4-mini"
  }
}
```

## Using Your Agent

### Select the Agent

In the main interface, use the **agent selector** dropdown to switch between agents. Each agent maintains its own conversation context.

### Delegate to an Agent

From a conversation with your main agent, you can ask it to delegate tasks:

> "Ask the code reviewer to look at the changes in my latest PR"

The main agent will use ACP (Agent Client Protocol) to delegate the task to your code reviewer agent and return the results.

### Agent Connections

Agents can run in different modes:

| Connection Type | Description |
|----------------|-------------|
| **Internal** | Runs within DotAgents using your configured AI provider |
| **acpx** | Runs an external local agent through the `acpx` CLI |
| **Remote** | Connects to an HTTP endpoint |
| **stdio / ACP** | Legacy local process connection types retained for compatibility |

## Example: Research Agent

Here's a more complete example — a research agent with skills and durable knowledge:

```markdown
---
id: researcher
name: researcher
displayName: Research Assistant
description: Deep research on any topic with web search and document analysis
enabled: true
role: chat-agent
connection-type: internal
---

You are a thorough research assistant. When given a topic:

1. Search for recent, authoritative sources
2. Cross-reference multiple sources for accuracy
3. Synthesize findings into clear summaries
4. Cite your sources
5. Flag any conflicting information

Always distinguish between established facts and emerging findings.
```

With `config.json`:

```json
{
  "toolConfig": {
    "enabledServers": ["exa", "filesystem"],
    "disabledServers": ["github"]
  },
  "skillsConfig": {
    "allSkillsDisabledByDefault": true,
    "enabledSkillIds": ["document-processing"]
  }
}
```

## Sharing Agents

DotAgents supports exporting and importing agent bundles:

1. Go to **Settings > Agents**
2. Click **Export** on any agent to create a shareable bundle
3. Share the bundle file with others
4. They can **Import** it from their settings

Bundles include the agent definition, skills, and configuration — everything needed to recreate the agent on another machine.

---

## Next Steps

- **[Agents](/agents/profiles)** — Deep dive into agent configuration
- **[Skills](/agents/skills)** — Teach your agent new capabilities
- **[Knowledge & Notes](/agents/knowledge-notes)** — Give your agent durable knowledge
- **[Multi-Agent Delegation](/agents/delegation)** — Set up agent-to-agent coordination
