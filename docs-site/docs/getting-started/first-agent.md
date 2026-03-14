---
sidebar_position: 3
sidebar_label: "Your First Agent"
---

# Your First Agent

DotAgents lets you create specialized AI agents — each with its own personality, skills, tools, and memory. This guide walks you through creating your first custom agent.

---

## What is an Agent Profile?

An agent profile defines an AI specialist. Think of it as a job description for an AI: who it is, what it knows, what tools it can use, and how it behaves.

Every agent profile has:

- **Identity** — Name, description, avatar
- **System Prompt** — Core instructions that shape behavior
- **Guidelines** — Additional rules and constraints
- **Skills** — Specialized knowledge it can access
- **Tool Access** — Which MCP servers and tools it can use
- **Model** — Which AI model powers it (optional override)

## Creating an Agent via the UI

1. Navigate to **Settings > Agents**
2. Click **"Create Agent"**
3. Fill in the profile:

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

Optionally, create `~/.agents/agents/<agent-id>/config.json` for tool and model settings:

```json
{
  "toolConfig": {
    "enabledServers": ["github", "filesystem"],
    "disabledTools": ["filesystem:delete_file"]
  },
  "modelConfig": {
    "provider": "openai",
    "model": "gpt-4o"
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
| **ACP** | Spawns an external process (e.g., Claude Code) |
| **Remote** | Connects to an HTTP endpoint |
| **stdio** | Communicates via stdin/stdout with a local process |

## Example: Research Agent

Here's a more complete example — a research agent with skills and memory:

```markdown
---
id: researcher
name: researcher
displayName: Research Assistant
description: Deep research on any topic with web search and document analysis
enabled: true
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
    "enabledSkills": ["document-processing"]
  }
}
```

## Sharing Agents

DotAgents supports exporting and importing agent bundles:

1. Go to **Settings > Agents**
2. Click **Export** on any agent to create a shareable bundle
3. Share the bundle file with others
4. They can **Import** it from their settings

Bundles include the agent profile, skills, and configuration — everything needed to recreate the agent on another machine.

---

## Next Steps

- **[Agent Profiles](/agents/profiles)** — Deep dive into profile configuration
- **[Skills](/agents/skills)** — Teach your agent new capabilities
- **[Memory](/agents/memory)** — Give your agent persistent context
- **[Multi-Agent Delegation](/agents/delegation)** — Set up agent-to-agent coordination
