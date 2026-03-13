# WhatsApp Integration

DotAgents includes a WhatsApp MCP server that lets your agents send and receive WhatsApp messages.

---

## Overview

The WhatsApp integration is packaged as an MCP server in the `packages/mcp-whatsapp` directory. Once configured, your agents can:

- Send messages to WhatsApp contacts
- Receive incoming messages
- Participate in WhatsApp conversations through the agent interface

## Setup

### 1. Configure the MCP Server

Add the WhatsApp MCP server to your configuration:

```json
{
  "mcpServers": {
    "whatsapp": {
      "transport": "stdio",
      "command": "node",
      "args": ["packages/mcp-whatsapp/dist/index.js"],
      "env": {
        "WHATSAPP_SESSION_PATH": "~/.dotagents/whatsapp-session"
      }
    }
  }
}
```

### 2. WhatsApp Settings

Configure WhatsApp-specific settings in **Settings > WhatsApp**:

- Connection status
- Session management
- Message routing preferences

### 3. Enable for Your Agent

Ensure your agent's tool configuration includes the WhatsApp server:

```json
{
  "toolConfig": {
    "enabledServers": ["whatsapp"]
  }
}
```

## Available Tools

Once connected, the WhatsApp MCP server exposes tools for:

| Tool | Description |
|------|-------------|
| Send message | Send a text message to a contact or group |
| Read messages | Retrieve recent messages from a chat |
| List chats | List available conversations |

## Usage

Ask your agent to interact with WhatsApp:

> "Send a message to John saying I'll be 10 minutes late"

> "Check my latest WhatsApp messages"

> "Reply to the team group chat with the meeting summary"

The agent will use the WhatsApp MCP tools to carry out the action.

---

## Next Steps

- **[MCP Tools](mcp.md)** — Other tool integrations
- **[Agent Profiles](../agents/profiles.md)** — Configure which agents can use WhatsApp
