# MCP Server Configuration

Detailed guide for configuring MCP tool servers in DotAgents.

---

## Configuration Methods

### 1. Settings UI

Go to **Settings > Capabilities** and use the MCP config manager to add, edit, and remove servers.

### 2. Configuration File

Edit `.agents/mcp.json` (or the `mcpServers` key in your main config):

```json
{
  "mcpServers": {
    "server-name": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {}
    }
  }
}
```

### 3. Workspace Override

Create `.agents/mcp.json` in your project directory to add project-specific servers. These merge with (and override) your global configuration.

## Server Configuration Schema

```typescript
interface MCPServerConfig {
  // Transport type
  transport?: "stdio" | "websocket" | "streamableHttp"

  // stdio transport
  command?: string              // Executable to run
  args?: string[]               // Command arguments
  env?: Record<string, string>  // Environment variables

  // Remote transports
  url?: string                  // Server URL
  headers?: Record<string, string>  // HTTP headers

  // OAuth 2.1 (streamableHttp)
  oauth?: {
    clientId: string
    clientSecret: string
    authorizationUrl: string
    tokenUrl: string
    scopes: string[]
  }

  // Options
  timeout?: number    // Connection timeout in ms
  disabled?: boolean  // Disable without removing
}
```

## Common Server Configurations

### Filesystem Access

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
  }
}
```

### GitHub

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token"
    }
  }
}
```

### Brave Search

```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "your-api-key"
    }
  }
}
```

### Puppeteer (Browser Control)

```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

### PostgreSQL

```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/db"
    }
  }
}
```

### Memory (Key-Value Store)

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

### Exa (AI Web Search)

```json
{
  "exa": {
    "transport": "streamableHttp",
    "url": "https://mcp.exa.ai/mcp",
    "headers": {
      "Authorization": "Bearer your-exa-api-key"
    }
  }
}
```

### Remote Server with OAuth 2.1

```json
{
  "protected-service": {
    "transport": "streamableHttp",
    "url": "https://api.service.com/mcp",
    "oauth": {
      "clientId": "your-client-id",
      "clientSecret": "your-client-secret",
      "authorizationUrl": "https://auth.service.com/authorize",
      "tokenUrl": "https://auth.service.com/token",
      "scopes": ["read", "write"]
    }
  }
}
```

## Server Management

### Enable/Disable

Disable a server without removing its configuration:

```json
{
  "server-name": {
    "disabled": true,
    "command": "npx",
    "args": ["..."]
  }
}
```

### Status Monitoring

DotAgents tracks server connection status:

| Status | Meaning |
|--------|---------|
| **Connected** | Server is running and responsive |
| **Connecting** | Attempting to establish connection |
| **Disconnected** | Server is not running |
| **Error** | Connection failed |

### Server Lifecycle

- **stdio servers** are spawned when needed and kept alive while DotAgents runs
- **Remote servers** connect on demand and maintain persistent connections
- All servers are disconnected when DotAgents exits

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't connect | Check command path, args, and env variables |
| Tool calls fail | Verify the server is running (`npx` may need network) |
| OAuth errors | Check client ID, secret, and URLs |
| Timeout errors | Increase the `timeout` value |
| Permission denied | Check file permissions for stdio commands |

---

## Next Steps

- **[MCP Tools](../tools/mcp.md)** — Using tools in conversations
- **[Settings Reference](settings.md)** — All configuration options
- **[Agent Profiles](../agents/profiles.md)** — Per-agent tool access
