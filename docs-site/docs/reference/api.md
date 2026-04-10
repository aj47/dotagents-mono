---
sidebar_position: 1
sidebar_label: "Remote API"
---

# Remote API Reference

DotAgents exposes a Fastify HTTP API for the mobile app, operator dashboards, local automation, and OpenAI-compatible clients. The server is disabled by default; enable it in **Settings > Remote Server**.

---

## Base URL and Auth

Local default:

```text
http://127.0.0.1:3210
```

Every protected endpoint expects:

```http
Authorization: Bearer <remote-server-api-key>
```

Use `127.0.0.1` for local clients. Use a LAN IP, hostname, or Cloudflare Tunnel URL only when you intentionally expose the server.

## OpenAI-Compatible Chat

### `POST /v1/chat/completions`

Runs an agent through an OpenAI-compatible chat completions shape. Supports streaming and non-streaming responses.

```json
{
  "model": "agent:general-assistant",
  "messages": [
    {"role": "user", "content": "Search recent AI news and summarize the important bits."}
  ],
  "stream": true
}
```

Notes:

- Use the desktop-configured model or an agent/model alias exposed by `/v1/models`.
- Tool use, MCP calls, skills, knowledge notes, and loop context are handled by the desktop runtime.
- Streaming responses use server-sent events compatible with OpenAI-style clients.

### `GET /v1/models`

Lists model and agent aliases that the remote client can use.

### `GET /v1/models/:providerId`

Lists known models for one provider profile when the desktop runtime can resolve them.

## Agent and Content Management

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/agent-profiles` | List configured agent profiles. |
| `GET /v1/agent-profiles/:id` | Fetch one agent profile. |
| `POST /v1/agent-profiles` | Create an agent profile. |
| `PATCH /v1/agent-profiles/:id` | Update an agent profile. |
| `DELETE /v1/agent-profiles/:id` | Delete an agent profile. |
| `POST /v1/agent-profiles/:id/toggle` | Enable or disable an agent profile. |
| `GET /v1/skills` | List skills available to agents. |
| `POST /v1/skills/:id/toggle-profile` | Enable or disable a skill for a profile. |
| `GET /v1/knowledge/notes` | List knowledge notes. |
| `GET /v1/knowledge/notes/:id` | Fetch one knowledge note. |
| `POST /v1/knowledge/notes` | Create a knowledge note. |
| `PATCH /v1/knowledge/notes/:id` | Update a knowledge note. |
| `DELETE /v1/knowledge/notes/:id` | Delete a knowledge note. |
| `GET /v1/loops` | List scheduled/autonomous loops. |
| `POST /v1/loops` | Create a loop. |
| `PATCH /v1/loops/:id` | Update a loop. |
| `DELETE /v1/loops/:id` | Delete a loop. |
| `POST /v1/loops/:id/toggle` | Enable or disable a loop. |
| `POST /v1/loops/:id/run` | Run a loop immediately. |

## Conversations and Push

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/conversations` | List conversations. |
| `POST /v1/conversations` | Create a conversation. |
| `GET /v1/conversations/:id` | Fetch a conversation and messages. |
| `PUT /v1/conversations/:id` | Update conversation metadata/messages. |
| `POST /v1/emergency-stop` | Stop the active remote run. |
| `POST /v1/push/register` | Register a push notification token. |
| `POST /v1/push/unregister` | Remove a push notification token. |
| `GET /v1/push/status` | Read push notification status. |
| `POST /v1/push/clear-badge` | Clear the mobile badge count. |

## MCP and Settings

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/mcp/servers` | List configured MCP servers and connection status. |
| `POST /v1/mcp/servers/:name/toggle` | Enable or disable an MCP server. |
| `GET /v1/settings` | Read non-secret app settings for remote clients. |
| `PATCH /v1/settings` | Update remote-safe settings. |
| `GET /v1/profiles` | List provider/model profiles for mobile settings. |
| `GET /v1/profiles/current` | Read the active provider/model profile. |
| `POST /v1/profiles/current` | Switch the active provider/model profile. |
| `GET /v1/profiles/:id/export` | Export a provider/model profile. |
| `POST /v1/profiles/import` | Import a provider/model profile. |

## Operator Endpoints

Operator endpoints are intended for trusted dashboards and automations.

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/operator/status` | Operator status summary. |
| `GET /v1/operator/health` | Health and build/runtime metadata. |
| `GET /v1/operator/errors` | Recent error events. |
| `GET /v1/operator/logs` | Recent operator log events. |
| `GET /v1/operator/audit` | Audit events. |
| `GET /v1/operator/conversations` | Operator conversation list. |
| `GET /v1/operator/remote-server` | Remote server status/config snapshot. |
| `GET /v1/operator/tunnel` | Cloudflare Tunnel status. |
| `GET /v1/operator/tunnel/setup` | Tunnel setup instructions/status. |
| `POST /v1/operator/tunnel/start` | Start tunnel exposure. |
| `POST /v1/operator/tunnel/stop` | Stop tunnel exposure. |
| `GET /v1/operator/integrations` | Integration status summary. |
| `GET /v1/operator/whatsapp` | WhatsApp MCP/operator status. |
| `POST /v1/operator/whatsapp/connect` | Connect/start WhatsApp integration. |
| `POST /v1/operator/whatsapp/logout` | Log out WhatsApp integration. |
| `GET /v1/operator/discord` | Discord integration status. |
| `GET /v1/operator/discord/logs` | Discord logs. |
| `POST /v1/operator/discord/connect` | Connect Discord integration. |
| `POST /v1/operator/discord/disconnect` | Disconnect Discord integration. |
| `POST /v1/operator/discord/logs/clear` | Clear Discord logs. |
| `GET /v1/operator/updater` | Updater status. |
| `POST /v1/operator/updater/check` | Trigger update check. |
| `POST /v1/operator/updater/download-latest` | Download the latest update artifact. |
| `POST /v1/operator/updater/reveal-download` | Reveal the downloaded update in Finder/Explorer. |
| `POST /v1/operator/updater/open-download` | Open the downloaded update. |
| `POST /v1/operator/updater/open-releases` | Open the GitHub releases page. |
| `GET /v1/operator/mcp` | Operator MCP status. |
| `POST /v1/operator/actions/mcp-restart` | Restart MCP services. |
| `POST /v1/operator/actions/restart-remote-server` | Restart the remote server. |
| `POST /v1/operator/actions/restart-app` | Restart the desktop app. |
| `POST /v1/operator/actions/run-agent` | Run an agent from the operator surface. |
| `POST /v1/operator/access/rotate-api-key` | Rotate the remote API key. |

## Pairing Mobile

1. Enable **Settings > Remote Server** in desktop.
2. Show the QR code in desktop remote server settings.
3. In mobile, open **Connection Settings** and scan it.
4. Mobile stores the base URL and bearer token in device storage.

See [Remote Server & Mobile Pairing](/desktop/remote-server) for setup and security guidance.

## Compatibility Notes

- Legacy endpoints like `/chat`, `/conversations`, and `/mcp/execute` are no longer the documented surface. Use `/v1/*` endpoints.
- The API is local-first. Do not expose it without an API key, CORS review, and tunnel/firewall controls.
- Provider model catalogs change frequently; use `/v1/models` or provider APIs for exact availability.

---

## Next Steps

- **[Mobile App](/mobile/overview)** — Mobile client that uses this API
- **[Remote Server & Pairing](/desktop/remote-server)** — Setup, QR pairing, and tunnel guidance
- **[Settings Reference](/configuration/settings)** — Configuration options
