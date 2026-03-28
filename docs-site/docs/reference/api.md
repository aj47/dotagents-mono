---
sidebar_position: 1
sidebar_label: "Remote API"
---

# Remote API Reference

DotAgents runs a Fastify HTTP server that the mobile app and external clients use to interact with the agent engine.

---

## Overview

The remote server starts automatically with the desktop app and exposes an HTTP API for:

- Sending messages to agents
- Managing conversations
- Transcribing audio
- Managing MCP servers
- Health checks

## Endpoints

### Chat

#### `POST /chat`

Send a message to the agent and get a response.

**Request:**

```json
{
  "message": "Search for recent AI news",
  "agentId": "general-assistant",
  "options": {
    "stream": true
  }
}
```

**Response:** Streaming SSE or JSON response with the agent's reply.

#### `POST /chat/{conversationId}`

Continue an existing conversation.

**Request:**

```json
{
  "message": "Tell me more about the first result"
}
```

### Conversations

#### `GET /conversations`

List all conversations.

**Response:**

```json
[
  {
    "id": "conv_abc123",
    "title": "AI News Research",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:05:00Z",
    "agentId": "general-assistant",
    "messageCount": 12
  }
]
```

#### `GET /conversations/{id}`

Get a conversation's full history including messages, tool calls, and results.

### Transcription

#### `POST /transcribe`

Transcribe audio using the configured STT provider.

**Request:** Multipart form data with audio file.

**Response:**

```json
{
  "text": "Search for the latest AI news",
  "language": "en",
  "duration": 2.5
}
```

### MCP Servers

#### `GET /mcp/servers`

List all configured MCP servers and their status.

**Response:**

```json
[
  {
    "name": "github",
    "status": "connected",
    "tools": ["search_repositories", "create_issue", "list_pulls"]
  }
]
```

#### `POST /mcp/execute`

Execute an MCP tool directly.

**Request:**

```json
{
  "server": "github",
  "tool": "search_repositories",
  "arguments": {
    "query": "dotagents"
  }
}
```

### Session Control

#### `POST /sessions/{id}/stop`

Emergency stop a specific agent session.

### Settings

#### `GET /settings`

Get current application settings (excluding sensitive data like API keys).

### Repeat Tasks

#### `GET /v1/loops`

List repeat tasks with their merged runtime state.

#### `POST /v1/loops`

Create a repeat task.

**Request:**

```json
{
  "name": "Inbox sweep",
  "prompt": "Check inbox for urgent mail",
  "intervalMinutes": 15,
  "enabled": true,
  "runOnStartup": true,
  "maxIterations": 4,
  "profileId": "ops-agent"
}
```

#### `PATCH /v1/loops/{id}`

Update a repeat task. Set `"profileId": null` to clear the assigned agent and `"maxIterations": null` to clear the override.

#### `POST /v1/loops/{id}/toggle`

Toggle a repeat task between enabled and disabled.

#### `POST /v1/loops/{id}/run`

Trigger a repeat task immediately.

#### `DELETE /v1/loops/{id}`

Delete a repeat task.

### Health

#### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "version": "1.4.0"
}
```

## Authentication

The remote server uses Bearer token authentication:

```
Authorization: Bearer <token>
```

Configure the token in the desktop app settings.

## Connecting from Mobile

1. Start DotAgents desktop — the remote server starts automatically
2. Note the URL shown in the app (typically `http://localhost:PORT`)
3. On mobile, enter this URL in Connection Settings or scan the QR code
4. The mobile app now uses this API for all agent interactions

## Rate Limiting

The remote server includes built-in rate limiting to prevent abuse and manage API costs.

---

## Next Steps

- **[Mobile App](/mobile/overview)** — Mobile client that uses this API
- **[Debug Reference](debug)** — Debugging the remote server
- **[Settings Reference](/configuration/settings)** — Configuration options
