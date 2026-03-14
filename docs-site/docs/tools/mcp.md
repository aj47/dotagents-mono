---
sidebar_position: 1
sidebar_label: "MCP Tools"
---

# MCP Tools

DotAgents connects to tools and services through the **Model Context Protocol (MCP)** — Anthropic's open standard for connecting AI models to external capabilities. Any MCP server works with DotAgents.

---

## What is MCP?

MCP (Model Context Protocol) defines how AI applications connect to tool servers. DotAgents is an **MCP client** that connects to **MCP servers** — external processes or HTTP endpoints that expose tools your agents can call.

```
DotAgents (MCP Client)
    │
    ├── stdio ──→ Local MCP Server (spawned process)
    ├── WebSocket ──→ Remote MCP Server
    └── streamableHttp ──→ HTTP MCP Server (+ OAuth 2.1)
```

## Adding MCP Servers

### Via the UI

1. Go to **Settings > Capabilities**
2. Click **Add MCP Server** or use the MCP config manager
3. Enter the server configuration in JSON format
4. Click Save — the server connects automatically

### Via Configuration File

Add servers to your `.agents/mcp.json` or the settings:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    },
    "exa": {
      "transport": "streamableHttp",
      "url": "https://mcp.exa.ai/mcp"
    }
  }
}
```

## Transport Types

### stdio (Local)

Spawns a local process and communicates via stdin/stdout with JSON-RPC:

```json
{
  "server-name": {
    "transport": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
    "env": {
      "API_KEY": "your-key"
    }
  }
}
```

Best for: Local tools, file system access, development tools.

### WebSocket (Remote)

Connects to a remote server via WebSocket:

```json
{
  "server-name": {
    "transport": "websocket",
    "url": "wss://my-server.com/mcp"
  }
}
```

Best for: Persistent connections to remote services.

### streamableHttp (Remote with OAuth)

Connects to an HTTP endpoint with streaming support and optional OAuth 2.1:

```json
{
  "server-name": {
    "transport": "streamableHttp",
    "url": "https://api.service.com/mcp",
    "headers": {
      "Authorization": "Bearer token"
    }
  }
}
```

Best for: Cloud services, APIs requiring authentication.

## Server Configuration

### Full Configuration Schema

```json
{
  "server-name": {
    "transport": "stdio | websocket | streamableHttp",
    "command": "string",
    "args": ["string"],
    "env": { "KEY": "value" },
    "url": "string",
    "headers": { "Key": "value" },
    "oauth": {
      "clientId": "string",
      "clientSecret": "string",
      "authorizationUrl": "string",
      "tokenUrl": "string",
      "scopes": ["string"]
    },
    "timeout": 30000,
    "disabled": false
  }
}
```

### OAuth 2.1

For MCP servers that require authentication, DotAgents supports OAuth 2.1 with:

- Automatic token refresh
- Dynamic client registration (RFC 7591)
- PKCE support
- Secure token storage

## Tool Naming

Tools are namespaced by their server name:

```
{serverName}:{toolName}
```

Examples:
- `github:search_repositories`
- `filesystem:read_file`
- `exa:web_search`

### Built-in Tools

DotAgents also provides built-in tools with special prefixes:

| Tool | Description |
|------|-------------|
| `speakmcp-settings:list_mcp_servers` | List configured MCP servers |
| `speakmcp-settings:load_skill_instructions` | Load a skill's full instructions |
| `speakmcp-settings:mark_work_complete` | Signal task completion |
| `speakmcp-builtin:respond_to_user` | Send a response (supports images) |
| `speakmcp-builtin:delegate_to_agent` | Delegate to a sub-agent |
| `speakmcp-builtin:list_available_agents` | List delegation targets |

## Tool Discovery

When an MCP server connects, DotAgents automatically discovers all available tools. Each tool includes:

- **Name** — Tool identifier
- **Description** — What the tool does
- **Input Schema** — JSON Schema defining expected parameters

The agent sees these tools in its context and can call them as needed.

## Tool Execution Flow

```
Agent decides to call a tool
    │
    ▼
Tool approval check (if enabled)
    │
    ├── Auto-approved → proceed
    └── Needs approval → show dialog → user approves/denies
    │
    ▼
Route to correct MCP server
    │
    ▼
MCP server executes the tool
    │
    ▼
Result returned to agent
    │
    ▼
Agent processes result and continues
```

## Tool Approval

Configure tool approval policies to require user confirmation before sensitive tools execute:

- **Per-agent** — Set approval requirements in agent profiles
- **Per-tool** — Require approval for specific tools
- **Global** — Default approval policy for all tools

## Enabling/Disabling Tools

### Per Server

Disable an entire MCP server:

```json
{
  "server-name": {
    "disabled": true
  }
}
```

### Per Tool

In the agent's `config.json`, disable specific tools:

```json
{
  "toolConfig": {
    "disabledTools": ["filesystem:delete_file", "github:delete_repository"]
  }
}
```

### Via the UI

Go to **Settings > Capabilities** to toggle individual tools on/off using the tool manager interface.

## Popular MCP Servers

| Server | Package | Description |
|--------|---------|-------------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | Read/write local files |
| **GitHub** | `@modelcontextprotocol/server-github` | GitHub API access |
| **Brave Search** | `@modelcontextprotocol/server-brave-search` | Web search |
| **Memory** | `@modelcontextprotocol/server-memory` | Persistent key-value memory |
| **Puppeteer** | `@modelcontextprotocol/server-puppeteer` | Browser automation |
| **PostgreSQL** | `@modelcontextprotocol/server-postgres` | Database queries |
| **Exa** | `mcp.exa.ai` | AI-powered web search |

See the [MCP Server Registry](https://modelcontextprotocol.io/servers) for a full list of available servers.

## MCP Elicitation

DotAgents supports the MCP 2025 elicitation protocol. When an MCP server needs additional input during tool execution (e.g., selecting from options, providing credentials), a dialog appears for you to provide it.

---

## Next Steps

- **[MCP Server Configuration](/configuration/mcp-servers)** — Detailed server setup
- **[AI Providers](providers)** — Configure LLM providers
- **[WhatsApp Integration](whatsapp)** — WhatsApp MCP server
- **[Observability](observability)** — Monitor tool execution
