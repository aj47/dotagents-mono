---
sidebar_position: 5
sidebar_label: "Multi-Agent Delegation"
---

# Multi-Agent Delegation (ACP)

DotAgents supports multi-agent orchestration through the Agent Client Protocol (ACP). Your main agent can delegate tasks to specialized sub-agents — each running as a separate process with its own capabilities.

---

## How Delegation Works

```
User: "Review the code in my latest PR and fix any issues"
    │
    ▼
Main Agent (internal)
    │
    ├── Sees available agents: Code Reviewer, Bug Fixer
    │
    ├── Delegates review to Code Reviewer
    │   │
    │   ▼
    │   Code Reviewer Agent (ACP)
    │   ├── Reads PR changes via GitHub MCP
    │   ├── Analyzes code quality
    │   └── Returns findings
    │
    ├── Delegates fixes to Bug Fixer with findings
    │   │
    │   ▼
    │   Bug Fixer Agent (ACP)
    │   ├── Reads flagged files
    │   ├── Applies fixes
    │   └── Returns result
    │
    └── Summarizes results to user
```

## Setting Up Delegation

### 1. Create a Delegation-Target Agent

First, create an agent that can receive delegated tasks:

```markdown
---
id: code-reviewer
name: code-reviewer
displayName: Code Reviewer
description: Reviews code for bugs, security issues, and best practices
enabled: true
role: delegation-target
connection-type: internal
---

You are a meticulous code reviewer...
```

Key: set `role: delegation-target` so the main agent knows this agent is available for delegation.

### 2. Configure the Connection

Set the connection type in the agent's `agent.md` frontmatter. Put command details, environment variables, working directory, or remote URL in `config.json`.

#### Internal Agent (uses DotAgents' LLM)

```markdown
---
id: code-reviewer
name: code-reviewer
displayName: Code Reviewer
description: Reviews code for bugs, security issues, and best practices
enabled: true
role: delegation-target
connection-type: internal
---

You are a meticulous code reviewer...
```

#### Claude Code via acpx

```markdown
---
id: claude-reviewer
name: claude-reviewer
displayName: Claude Reviewer
description: Reviews code through Claude Code
enabled: true
role: delegation-target
connection-type: acpx
---

You are a meticulous code reviewer...
```

```json
{
  "connection": {
    "agent": "claude-code"
  }
}
```

#### Custom acpx Adapter

This example assumes the agent's `agent.md` has `connection-type: acpx`.

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

### 3. Enable Delegation on the Main Agent

Ensure the main agent has access to the delegation runtime tools:

```json
{
  "toolConfig": {
    "enabledRuntimeTools": [
      "set_session_title",
      "execute_command",
      "read_more_context",
      "mark_work_complete",
      "delegate_to_agent",
      "check_agent_status",
      "respond_to_user"
    ]
  }
}
```

## The ACP Protocol

### Communication

ACP uses **JSON-RPC 2.0** for agent-to-agent communication. DotAgents routes local external agents through `acpx`:

```
Main Agent                    Sub-Agent
    │                             │
    ├── runs/create ────────────► │
    │                             ├── processes task
    │  ◄──── permission request ──┤
    ├── permission grant ────────►│
    │                             ├── continues
    │  ◄──── streaming output ────┤
    │  ◄──── runs/complete ───────┤
    │                             │
```

### Bidirectional Capabilities

Sub-agents can request things from the parent:

| Request | Description |
|---------|-------------|
| **File read** | Read files from the workspace |
| **File write** | Write files to the workspace |
| **Permission** | Ask for user approval before actions |
| **Resource access** | Request access to shared resources |

### Session Management

- Each delegation creates a **run** with a unique session ID
- Runs are tracked by the **agentSessionStateManager** (in-flight) and **agentSessionTracker** (completed)
- Sub-agents can be **stateful** — maintaining context across multiple delegations

## Delegation Tools

The main agent sees available delegation targets in prompt context and uses these runtime tools for delegation:

### `delegate_to_agent`

Sends a task to a specific agent:

```
→ delegate_to_agent({
    agentId: "code-reviewer",
    task: "Review the changes in PR #42 for security issues",
    context: { pr_number: 42 }
  })
← { result: "Found 3 issues: ...", status: "complete" }
```

### `check_agent_status`

Checks an async delegated run:

```
→ check_agent_status({ runId: "acp_delegation_..." })
← { status: "completed", output: "..." }
```

## Timeouts and Lifecycle

| Setting | Default | Description |
|---------|---------|-------------|
| **Task timeout** | Configurable per agent | Max time for a single delegation |
| **Idle timeout** | Configurable | Kill idle agent processes |
| **Emergency stop** | `Ctrl+Shift+Escape` | Abort all active agents immediately |

## Example: Multi-Agent Workflow

Here's a complete example of setting up a two-agent workflow:

### Agent 1: Researcher

```markdown
---
id: researcher
name: researcher
displayName: Research Assistant
description: Deep research on topics using web search
enabled: true
role: delegation-target
---

You are a thorough researcher. Search the web, cross-reference sources,
and provide detailed findings with citations.
```

### Agent 2: Writer

```markdown
---
id: writer
name: writer
displayName: Content Writer
description: Writes polished content based on research
enabled: true
role: delegation-target
---

You are a skilled writer. Take research findings and produce clear,
engaging content. Maintain accuracy while making the content accessible.
```

### Usage

> "Research the latest trends in AI agent frameworks and write a blog post summary"

The main agent will:
1. Delegate research to the **Research Assistant**
2. Receive findings
3. Delegate writing to the **Content Writer** with the research
4. Return the finished blog post

---

## Next Steps

- **[Agents](profiles)** — Configure agent connections
- **[MCP Tools](/tools/mcp)** — Tools available to delegated agents
- **[Architecture](/concepts/architecture)** — System design overview
