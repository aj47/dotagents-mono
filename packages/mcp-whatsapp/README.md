# WhatsApp MCP Server for DotAgents

This MCP (Model Context Protocol) server enables WhatsApp messaging capabilities for DotAgents. It allows AI agents to send and receive WhatsApp messages, making your voice assistant accessible via WhatsApp.

## Features

- **Send Messages**: Send WhatsApp messages to any phone number
- **Receive Messages**: Get notified of incoming messages
- **Chat History**: View recent messages from any chat
- **Auto-Reply**: Optionally auto-reply to messages using DotAgents' AI
- **Persistent Auth**: QR code authentication is saved for reconnection

## Prerequisites

- Node.js 24.x recommended via the repo `.nvmrc` (minimum: 20.19.4)
- A WhatsApp account with the mobile app installed
- DotAgents desktop app running (for auto-reply feature)

## Installation

### Option 1: Add to DotAgents (Recommended)

1. Open DotAgents Settings → Tools → MCP Servers
2. Click "Add Server" and enter:
   - Name: `whatsapp`
   - Command: `node`
   - Args: `["packages/mcp-whatsapp/dist/index.js"]`
3. Save and the server will start automatically

### Option 2: Manual Configuration

Add to your MCP config file (`~/.agents/mcp.json`):

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "node",
      "args": ["/path/to/dotagents-mono/packages/mcp-whatsapp/dist/index.js"],
      "env": {
        "WHATSAPP_ALLOW_FROM": "14155551234,14155555678",
        "WHATSAPP_LOG_MESSAGES": "true"
      }
    }
  }
}
```

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `WHATSAPP_AUTH_DIR` | Directory for auth credentials | `~/.dotagents/whatsapp-auth` |
| `WHATSAPP_ALLOW_FROM` | Comma-separated phone numbers allowed to message | (all allowed) |
| `WHATSAPP_AUTO_REPLY` | Auto-reply to messages via DotAgents | `false` |
| `WHATSAPP_CALLBACK_URL` | DotAgents API URL for auto-reply | - |
| `WHATSAPP_CALLBACK_API_KEY` | DotAgents API key for auto-reply | - |
| `WHATSAPP_LOG_MESSAGES` | Log message content (privacy) | `false` |

## First-Time Setup

1. Start DotAgents with the WhatsApp MCP server configured
2. Ask the AI: "Connect to WhatsApp"
3. A QR code will appear in the terminal/logs
4. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
5. Scan the QR code
6. You're connected!

## Available Tools

### whatsapp_send_message
Send a message to a phone number or chat.

```
Send "Hello!" to 14155551234
```

### whatsapp_get_messages
Get recent messages from a chat.

```
Show me the last 10 messages from 14155551234
```

### whatsapp_list_chats
List all chats with recent activity.

```
List my WhatsApp chats
```

### whatsapp_get_pending_messages
Get new messages that arrived since last check.

```
Check for new WhatsApp messages
```

### whatsapp_get_status
Check connection status.

```
What's my WhatsApp connection status?
```

### whatsapp_connect
Connect to WhatsApp (generates QR if needed).

### whatsapp_disconnect
Disconnect while keeping credentials.

### whatsapp_logout
Logout and clear all credentials.

## Auto-Reply Setup

To enable automatic replies to WhatsApp messages:

1. Enable DotAgents' remote server (Settings → Remote Server)
2. Note the API key and port
3. Configure the WhatsApp MCP server:

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "node",
      "args": ["packages/mcp-whatsapp/dist/index.js"],
      "env": {
        "WHATSAPP_AUTO_REPLY": "true",
        "WHATSAPP_CALLBACK_URL": "http://localhost:3210/v1/chat/completions",
        "WHATSAPP_CALLBACK_API_KEY": "your-api-key-here",
        "WHATSAPP_ALLOW_FROM": "14155551234"
      }
    }
  }
}
```

Now when someone on the allowlist messages you, DotAgents will automatically generate a response!

## Security Considerations

1. **Allowlist**: Use `WHATSAPP_ALLOW_FROM` to restrict who can message your AI
2. **Unofficial API**: This uses Baileys, an unofficial WhatsApp Web library. Use responsibly.
3. **Account Risk**: While rare, using unofficial APIs could risk your WhatsApp account
4. **Privacy**: Set `WHATSAPP_LOG_MESSAGES=false` to avoid logging message content

## Troubleshooting

### QR Code Not Appearing
- Check the terminal/logs where DotAgents is running
- Try disconnecting and reconnecting

### Connection Keeps Dropping
- Ensure stable internet connection
- Check if WhatsApp is still linked on your phone
- Try logging out and re-authenticating

### Messages Not Sending
- Verify the phone number format (country code, no + sign)
- Check if connected: "What's my WhatsApp status?"
- Look for errors in the logs

### Auto-Reply Not Working
- Verify remote server is running
- Check API key is correct
- Ensure sender is on the allowlist

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
pnpm dev
```

## License

MIT - Part of the DotAgents project.
