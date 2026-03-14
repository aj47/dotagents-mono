---
sidebar_position: 3
sidebar_label: "Protocol Ecosystem"
---

# Protocol Ecosystem

DotAgents integrates five complementary protocols that together form a complete agent orchestration platform. Each protocol answers a different question:

| Protocol | Question It Answers |
|----------|-------------------|
| **MCP** | "What tools can I access?" |
| **ACP** | "What agents can I delegate to?" |
| **Skills** | "What knowledge do I have?" |
| **Agent Profiles** | "Who am I and how am I configured?" |
| **.agents/** | "How is my configuration stored and shared?" |

---

## MCP — Model Context Protocol

MCP is Anthropic's open protocol for connecting AI models to tools and resources. DotAgents acts as an **MCP client** that connects to MCP servers.

### How It Works

```
DotAgents (MCP Client)
    │
    ├── stdio transport ──→ Local MCP Server (process)
    ├── WebSocket ──→ Remote MCP Server
    └── streamableHttp ──→ HTTP MCP Server (with OAuth 2.1)
```

### Tool Discovery

When an MCP server connects, DotAgents discovers all available tools and makes them callable by the AI agent. Tools are namespaced: `{serverName}:{toolName}`.

### Key Capabilities

- **Three transport types**: stdio (local), WebSocket, streamableHttp (remote)
- **OAuth 2.1**: Automatic token refresh for protected servers
- **Tool approval**: Optional user confirmation before execution
- **Parallel execution**: Concurrent tool calls when possible
- **Real-time progress**: Live UI updates during tool execution

---

## ACP — Agent Client Protocol

ACP is a protocol for agent-to-agent communication and delegation. DotAgents can spawn and coordinate with external AI agents.

### Delegation Flow

```
User Request
    │
    ▼
Main Agent (internal)
    │
    ├── Sees available agents via list_available_agents
    ├── Decides to delegate to "code-agent"
    ├── Calls delegate_to_agent
    │
    ▼
ACP Router
    │
    ├── Looks up agent in registry
    ├── Spawns process (e.g., claude-code-acp --acp)
    ├── Sends JSON-RPC request
    │
    ▼
External Agent
    │
    ├── Processes task
    ├── Requests permissions (bidirectional)
    ├── Returns results via streaming
    │
    ▼
Results → Main Agent → User
```

### Connection Types

| Type | Description | Example |
|------|-------------|---------|
| **Internal** | Runs within DotAgents | Default agent |
| **ACP (stdio)** | Spawns a local process | Claude Code, Auggie |
| **Remote** | Connects to HTTP endpoint | Cloud-hosted agents |

### Bidirectional Communication

ACP isn't one-way. Sub-agents can request things from the parent:
- File read/write permissions
- User approval for actions
- Access to shared resources

---

## Skills

Skills are instruction-based capability extensions based on Anthropic's Agent Skills specification. They extend agents with specialized knowledge without code changes.

### How Skills Work

```
Agent System Prompt includes:
  "Available Skills:
   - document-processing: Create, edit, and analyze .docx files
   - code-generation: Generate and refactor code"

Agent decides to use a skill
    │
    ▼
Agent calls load_skill_instructions
    │
    ▼
Full instructions loaded from .agents/skills/<id>/skill.md
    │
    ▼
Agent uses skill knowledge to complete the task
```

### Skill Properties

- **Portable** — Work across DotAgents, Claude Code, Cursor
- **Composable** — Agents can use multiple skills together
- **Shareable** — Export and import via agent bundles
- **Versioned** — Track changes in git alongside your code

---

## Agent Profiles

Agent Profiles are the unified type that consolidates agent identity, behavior, and access control.

### Profile Components

```
AgentProfile
├── Identity (id, name, displayName, description, avatar)
├── Behavior (systemPrompt, guidelines, properties)
├── Model Config (provider, model override)
├── Tool Config (enabled/disabled servers and tools)
├── Skills Config (which skills are active)
├── Connection (how to run: internal, acp, stdio, remote)
└── State (enabled, isDefault, role)
```

### Tool Access Control

Agents have fine-grained tool access:

- **enabledServers** — Whitelist of MCP servers
- **disabledServers** — Blacklist of MCP servers
- **disabledTools** — Specific tools to block
- **enabledBuiltinTools** — Whitelist of built-in tools

---

## How They Work Together

```
┌─────────────────────────────────────────────────────────────┐
│                    .agents/ Protocol                         │
│                 (Configuration Layer)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent        │  │ Skills       │  │ Memories     │      │
│  │ Profiles     │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────┐
│              Core Agent Engine                        │
│                                                      │
│  Agent Profile defines WHO the agent is              │
│  Skills define WHAT the agent knows                  │
│  Memories provide CONTEXT across sessions            │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  MCP Service     │  │  ACP Service     │          │
│  │  (Tool Access)   │  │  (Delegation)    │          │
│  └────────┬─────────┘  └────────┬─────────┘          │
└───────────┼──────────────────────┼────────────────────┘
            │                      │
            ▼                      ▼
    ┌───────────────┐      ┌───────────────┐
    │  MCP Servers  │      │  ACP Agents   │
    │  (Tools)      │      │  (Sub-agents) │
    └───────────────┘      └───────────────┘
```

### Complete Flow Example

1. **App starts** → Loads `.agents/` config (global + workspace layers)
2. **Agent initialized** → Profile loaded, skills indexed, memories attached
3. **User speaks** → Voice transcribed, sent to agent
4. **Agent reasons** → Uses skills knowledge, checks available tools
5. **Agent acts** → Calls MCP tools or delegates to ACP agents
6. **Results returned** → Displayed to user, saved to conversation history
7. **Memory updated** → Relevant context persisted for future sessions

---

## Next Steps

- **[MCP Tools](/tools/mcp)** — Configure and use MCP tool servers
- **[Agent Profiles](/agents/profiles)** — Create specialized agents
- **[Skills](/agents/skills)** — Build portable agent capabilities
- **[Multi-Agent Delegation](/agents/delegation)** — Set up ACP coordination
