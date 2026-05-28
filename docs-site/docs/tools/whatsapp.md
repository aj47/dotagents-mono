---
sidebar_position: 3
sidebar_label: "WhatsApp"
---

# WhatsApp Integration

DotAgents includes a WhatsApp MCP server that lets your agents send and receive WhatsApp messages.

---

## Overview

The WhatsApp integration is packaged as an MCP server in `packages/mcp-whatsapp`. It uses the Baileys WhatsApp Web library, persists auth credentials locally, and exposes WhatsApp operations as MCP tools. Once configured, your agents can:

- Send messages to WhatsApp contacts
- Receive incoming messages
- Read recent chat history
- Check pending messages
- Participate in WhatsApp conversations through the agent interface or auto-reply flow

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
        "WHATSAPP_AUTH_DIR": "~/.dotagents/whatsapp-auth",
        "WHATSAPP_ALLOW_FROM": "14155551234",
        "WHATSAPP_LOG_MESSAGES": "false"
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

Once connected, the WhatsApp MCP server exposes these tools:

| Tool | Description |
|------|-------------|
| `whatsapp_send_message` | Send a text message to a phone number or chat. |
| `whatsapp_send_media` | Send an image, video, audio, or document attachment (from path, URL, or base64). |
| `whatsapp_get_messages` | Retrieve recent messages from a chat. |
| `whatsapp_list_chats` | List available chats with recent activity. |
| `whatsapp_get_pending_messages` | Return messages that arrived since the last poll. Image attachments are returned inline as base64 image content. |
| `whatsapp_get_status` | Check connection and auth status. |
| `whatsapp_connect` | Connect to WhatsApp and generate a QR code if needed. |
| `whatsapp_disconnect` | Disconnect while keeping stored credentials. |
| `whatsapp_logout` | Log out and clear stored credentials. |

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `WHATSAPP_AUTH_DIR` | Directory for Baileys auth credentials | `~/.dotagents/whatsapp-auth` |
| `WHATSAPP_ALLOW_FROM` | Comma-separated phone numbers allowed to message the agent | Empty means all senders |
| `WHATSAPP_OPERATOR_ALLOW_FROM` | Comma-separated phone numbers allowed to run `/ops` commands | Empty means operator commands disabled |
| `WHATSAPP_AUTO_REPLY` | Automatically call DotAgents for allowed incoming messages | `false` |
| `WHATSAPP_CALLBACK_URL` | DotAgents chat completions URL for auto-reply | — |
| `WHATSAPP_CALLBACK_API_KEY` | Bearer token for the callback URL | — |
| `WHATSAPP_LOG_MESSAGES` | Log message content for diagnostics | `false` |

## Usage

Ask your agent to interact with WhatsApp:

> "Send a message to John saying I'll be 10 minutes late"

> "Check my latest WhatsApp messages"

> "Reply to the team group chat with the meeting summary"

The agent will use the WhatsApp MCP tools to carry out the action.

## Auto-Reply

Auto-reply sends allowed incoming WhatsApp messages to the DotAgents remote server and posts the agent response back to WhatsApp.

1. Enable **Settings > Remote Server** in the desktop app.
2. Copy the remote server API key.
3. Configure the WhatsApp MCP server with:

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "node",
      "args": ["packages/mcp-whatsapp/dist/index.js"],
      "env": {
        "WHATSAPP_AUTO_REPLY": "true",
        "WHATSAPP_CALLBACK_URL": "http://127.0.0.1:3210/v1/chat/completions",
        "WHATSAPP_CALLBACK_API_KEY": "your-remote-server-api-key",
        "WHATSAPP_ALLOW_FROM": "14155551234"
      }
    }
  }
}
```

Keep `WHATSAPP_ALLOW_FROM` narrow for auto-reply. Treat `WHATSAPP_CALLBACK_API_KEY` like a secret.

## Operator Commands

WhatsApp supports the same `/ops` operator command family as Discord when `WHATSAPP_OPERATOR_ALLOW_FROM` is configured. Operator commands can inspect status, health, logs, audit events, tunnels, integrations, updater state, MCP status, and can restart services or run an agent.

Operator access is separate from normal WhatsApp messaging access. A number in `WHATSAPP_ALLOW_FROM` can chat with the agent, but it cannot run `/ops` unless it is also in `WHATSAPP_OPERATOR_ALLOW_FROM`.

## Security Notes

- Use `WHATSAPP_ALLOW_FROM` before enabling auto-reply.
- Use `WHATSAPP_OPERATOR_ALLOW_FROM` only for trusted phone numbers.
- Keep `WHATSAPP_LOG_MESSAGES=false` unless you need message-level diagnostics.
- Baileys is an unofficial WhatsApp Web library; use it with that account-risk tradeoff in mind.

---

## Next Steps

- **[MCP Tools](mcp)** — Other tool integrations
- **[Remote Server & Pairing](/desktop/remote-server)** — Required for auto-reply callbacks
- **[Agent Profiles](/agents/profiles)** — Configure which agents can use WhatsApp
