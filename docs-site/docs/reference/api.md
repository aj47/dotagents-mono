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
| `POST /v1/agent-profiles/reload` | Reload agent profiles from disk. |
| `POST /v1/agent-profiles/verify-command` | Verify an external agent command before saving. |
| `GET /v1/skills` | List skills available to agents. |
| `GET /v1/skills/:id` | Fetch one skill. |
| `PATCH /v1/skills/:id` | Update one skill. |
| `POST /v1/skills/:id/toggle-profile` | Enable or disable a skill for a profile. |
| `POST /v1/skills/delete-multiple` | Delete several skills in one request. |
| `POST /v1/skills/import/github` | Import a skill from GitHub. |
| `POST /v1/skills/import/markdown` | Import a skill from markdown content. |
| `GET /v1/skills/:id/export/markdown` | Export one skill as markdown. |
| `POST /v1/bundles/export` | Export an agent bundle. |
| `POST /v1/bundles/import/preview` | Preview an agent bundle import. |
| `POST /v1/bundles/import` | Import an agent bundle. |
| `GET /v1/knowledge/notes` | List knowledge notes. |
| `GET /v1/knowledge/notes/:id` | Fetch one knowledge note. |
| `POST /v1/knowledge/notes` | Create a knowledge note. |
| `PATCH /v1/knowledge/notes/:id` | Update a knowledge note. |
| `DELETE /v1/knowledge/notes/:id` | Delete a knowledge note. |
| `POST /v1/knowledge/notes/search` | Search knowledge notes. |
| `POST /v1/knowledge/notes/delete` | Delete selected knowledge notes. |
| `POST /v1/knowledge/notes/delete-all` | Delete all knowledge notes. |
| `GET /v1/loops` | List scheduled/autonomous loops. |
| `POST /v1/loops` | Create a loop. |
| `PATCH /v1/loops/:id` | Update a loop. |
| `DELETE /v1/loops/:id` | Delete a loop. |
| `POST /v1/loops/import/markdown` | Import a loop from `task.md` markdown content. |
| `GET /v1/loops/:id/export/markdown` | Export one loop as `task.md` markdown content. |
| `POST /v1/loops/:id/toggle` | Enable or disable a loop. |
| `POST /v1/loops/:id/run` | Run a loop immediately. |

Loop create and update payloads support the same core fields as `.agents/tasks/<task-id>/task.md`, including `intervalMinutes`, `schedule`, `runContinuously`, `runOnStartup`, `speakOnTrigger`, `continueInSession`, `lastSessionId`, `profileId`, `maxIterations`, `critiquePass`, and `criticProfileId`.

When `critiquePass` is `true`, the desktop runtime runs worker -> critic -> worker revision inside one repeat-task run. `criticProfileId` is optional and is only active while `critiquePass` is enabled. See [Repeat Tasks](/agents/repeat-tasks) for examples and critique design guidance.

## Conversations and Push

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/conversations` | List conversations. |
| `POST /v1/conversations` | Create a conversation. |
| `GET /v1/conversations/:id` | Fetch a conversation and messages. |
| `PUT /v1/conversations/:id` | Update conversation metadata/messages. |
| `DELETE /v1/conversations/:id` | Delete one conversation. |
| `DELETE /v1/conversations` | Delete all conversations. |
| `POST /v1/conversations/:id/branch` | Branch a conversation into a new session. |
| `GET /v1/agent-sessions/candidates` | List active and recent sessions for repeat-task continuation pickers. |
| `POST /v1/agent-sessions/tool-approvals/:approvalId/respond` | Approve or deny a pending tool call. |
| `GET /v1/conversations/:id/assets/images/:fileName` | Stream an image attachment that belongs to a conversation. |
| `GET /v1/conversations/:id/assets/videos/:fileName` | Stream a video attachment that belongs to a conversation. |
| `POST /v1/emergency-stop` | Stop the active remote run. |
| `POST /v1/push/register` | Register a push notification token. |
| `POST /v1/push/unregister` | Remove a push notification token. |
| `GET /v1/push/status` | Read push notification status. |
| `POST /v1/push/clear-badge` | Clear the mobile badge count. |

## Speech and Media

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/stt/transcribe` | Transcribe uploaded audio with the desktop-configured STT provider. |
| `POST /v1/tts/speak` | Generate speech audio with the desktop-configured TTS provider. |
| `GET /v1/conversations/:id/assets/images/:fileName` | Stream conversation-local image assets for mobile clients. |
| `GET /v1/conversations/:id/assets/videos/:fileName` | Stream conversation-local video assets for mobile clients. |

## MCP and Settings

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/mcp/servers` | List configured MCP servers and connection status. |
| `GET /v1/mcp/servers/:name/config` | Fetch one MCP server config. |
| `PUT /v1/mcp/servers/:name/config` | Create or replace one MCP server config. |
| `DELETE /v1/mcp/servers/:name` | Delete one MCP server config. |
| `POST /v1/mcp/servers/:name/toggle` | Enable or disable an MCP server. |
| `GET /v1/mcp/servers/:name/oauth` | Read OAuth status for one MCP server. |
| `POST /v1/mcp/servers/:name/oauth/start` | Start OAuth flow for one MCP server. |
| `POST /v1/mcp/servers/:name/oauth/revoke` | Revoke OAuth credentials for one MCP server. |
| `GET /v1/mcp/config/export` | Export MCP configuration. |
| `POST /v1/mcp/config/import` | Import MCP configuration. |
| `GET /v1/settings` | Read non-secret app settings for remote clients. |
| `PATCH /v1/settings` | Update remote-safe settings. |
| `GET /v1/profiles` | List provider/model profiles for mobile settings. |
| `GET /v1/profiles/current` | Read the active provider/model profile. |
| `POST /v1/profiles/current` | Switch the active provider/model profile. |
| `GET /v1/profiles/:id/export` | Export a provider/model profile. |
| `POST /v1/profiles/import` | Import a provider/model profile. |

## ACP-Injected MCP Transport

These endpoints are active runtime endpoints used by ACP/acpx delegation and injected runtime tools. They are not the normal user-facing MCP configuration API above.

| Endpoint | Purpose |
|----------|---------|
| `POST /mcp/:acpSessionToken` | Initialize or send a Streamable HTTP MCP request scoped to an ACP session token. |
| `GET /mcp/:acpSessionToken` | Open the Streamable HTTP server-to-client stream for an ACP session token. |
| `DELETE /mcp/:acpSessionToken` | Close the injected MCP transport for an ACP session token. |
| `POST /mcp/tools/list` | List injected runtime tools for the current request context. |
| `POST /mcp/:acpSessionToken/tools/list` | List injected runtime tools scoped to an ACP session token. |
| `POST /mcp/tools/call` | Call an injected runtime tool in the current request context. |
| `POST /mcp/:acpSessionToken/tools/call` | Call an injected runtime tool scoped to an ACP session token. |

## Operator Endpoints

Operator endpoints are intended for trusted dashboards and automations.

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/operator/status` | Operator status summary. |
| `GET /v1/operator/health` | Health and build/runtime metadata. |
| `GET /v1/operator/errors` | Recent error events. |
| `POST /v1/operator/errors/clear` | Clear recent operator error events. |
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
| `GET /v1/operator/mcp/tools` | List MCP tools for operator management. |
| `POST /v1/operator/mcp/tools/toggle` | Enable or disable an MCP tool from the operator surface. |
| `GET /v1/operator/mcp/:server/logs` | Read logs for one MCP server. |
| `POST /v1/operator/mcp/:server/logs/clear` | Clear logs for one MCP server. |
| `POST /v1/operator/actions/mcp-start` | Start MCP services. |
| `POST /v1/operator/actions/mcp-stop` | Stop MCP services. |
| `POST /v1/operator/actions/mcp-restart` | Restart MCP services. |
| `POST /v1/operator/actions/mcp-test` | Test MCP configuration. |
| `POST /v1/operator/actions/restart-remote-server` | Restart the remote server. |
| `POST /v1/operator/actions/restart-app` | Restart the desktop app. |
| `POST /v1/operator/actions/run-agent` | Run an agent from the operator surface. |
| `POST /v1/operator/actions/stop-tts` | Stop text-to-speech playback. |
| `POST /v1/operator/access/rotate-api-key` | Rotate the remote API key. |
| `GET /v1/operator/diagnostics/report` | Generate or read an operator diagnostics report. |
| `POST /v1/operator/diagnostics/report/save` | Save an operator diagnostics report. |
| `POST /v1/operator/sessions/:sessionId/show` | Show one operator session. |
| `POST /v1/operator/sessions/:sessionId/snooze` | Snooze one operator session. |
| `POST /v1/operator/sessions/:sessionId/unsnooze` | Unsnooze one operator session. |
| `POST /v1/operator/sessions/:sessionId/stop` | Stop one operator session. |
| `POST /v1/operator/sessions/:sessionId/clear` | Clear one operator session. |
| `POST /v1/operator/sessions/clear-inactive` | Clear inactive operator sessions. |
| `POST /v1/operator/sessions/snooze-and-hide-panel` | Snooze sessions and hide the panel. |
| `GET /v1/operator/message-queues` | List operator message queues. |
| `PATCH /v1/operator/message-queues/:conversationId/messages/:messageId` | Update a queued message. |
| `DELETE /v1/operator/message-queues/:conversationId/messages/:messageId` | Delete a queued message. |
| `POST /v1/operator/message-queues/:conversationId/messages/:messageId/retry` | Retry a queued message. |
| `POST /v1/operator/message-queues/:conversationId/pause` | Pause a message queue. |
| `POST /v1/operator/message-queues/:conversationId/resume` | Resume a message queue. |
| `POST /v1/operator/message-queues/:conversationId/clear` | Clear a message queue. |
| `GET /v1/operator/model-presets` | List operator model presets. |
| `POST /v1/operator/model-presets` | Create an operator model preset. |
| `PATCH /v1/operator/model-presets/:presetId` | Update an operator model preset. |
| `DELETE /v1/operator/model-presets/:presetId` | Delete an operator model preset. |
| `GET /v1/operator/providers/chatgpt-web/auth` | Read ChatGPT web auth status. |
| `POST /v1/operator/providers/chatgpt-web/auth/login` | Start ChatGPT web login. |
| `POST /v1/operator/providers/chatgpt-web/auth/logout` | Log out ChatGPT web auth. |
| `POST /v1/operator/windows/main/show` | Show the main window. |
| `POST /v1/operator/windows/panel/show` | Show the panel window. |
| `POST /v1/operator/windows/panel/hide` | Hide the panel window. |
| `POST /v1/operator/windows/panel/reset` | Reset panel window position and size. |

## Pairing Mobile

1. Enable **Settings > Remote Server** in desktop.
2. Show the QR code in desktop remote server settings.
3. In mobile, open **Connection Settings** and scan it.
4. Mobile stores the base URL and bearer token in device storage.

See [Remote Server & Mobile Pairing](/desktop/remote-server) for setup and security guidance.

## Compatibility Notes

- Legacy endpoints like `/chat`, `/conversations`, and `/mcp/execute` are no longer the documented surface. Use `/v1/*` endpoints.
- The `/mcp/:acpSessionToken` endpoints above are current internal ACP/acpx runtime transport endpoints, not legacy `/mcp/execute` endpoints.
- The API is local-first. Do not expose it without an API key, CORS review, and tunnel/firewall controls.
- Provider model catalogs change frequently; use `/v1/models` or provider APIs for exact availability.

---

## Next Steps

- **[Mobile App](/mobile/overview)** — Mobile client that uses this API
- **[Remote Server & Pairing](/desktop/remote-server)** — Setup, QR pairing, and tunnel guidance
- **[Settings Reference](/configuration/settings)** — Configuration options
