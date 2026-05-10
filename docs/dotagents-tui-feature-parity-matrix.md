# DotAgents TUI Feature-Parity Matrix

Scope: this matrix inventories the shared desktop-server-backed capability surface that is relevant to the TUI. It does not replace the mobile/web parity matrix.

The TUI must remain a remote server client for DotAgents data and actions. Connection bootstrap may read the local desktop config and secret reference to find the server URL/API key, or use `DOTAGENTS_SERVER_URL` and `DOTAGENTS_API_KEY`; feature commands must go through `REMOTE_SERVER_API_PATHS` / `REMOTE_SERVER_API_BUILDERS` and must not add desktop IPC, sanitized tool-name assumptions, or direct `.agents` filesystem operations.

## Summary

- `scripts/dotagents-tui.ts` covers the server-backed TUI surface for settings, profiles, agents, skills, knowledge notes, loops, MCP, model presets, sessions, conversations, message queues, local speech models, integrations, tunnel, updater, API key rotation, emergency stop, and operator status/logs/audit.
- Route construction uses `getRemoteServerApiRoutePath`, `REMOTE_SERVER_API_PATHS`, and `REMOTE_SERVER_API_BUILDERS` from `@dotagents/shared/remote-server-api`.
- `apps/desktop/src/main/dotagents-tui-smoke.test.ts` verifies authenticated one-shot TUI commands, encoded params, query params, JSON bodies, CRUD flows, action flows, and chat streaming against a mock server.
- Capability commands do not use client-local `.agents` reads/writes or Electron IPC. The only local filesystem access in the TUI is bootstrap resolution of the desktop app config/API-key secret reference.
- Server routes that are not TUI commands are classified below as mobile notification, media asset, audio playback, provider discovery, or sync/recovery routes rather than unowned parity gaps.

## Prompt-To-Artifact Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Inventory every shared server capability relevant to TUI | Matrix rows cover settings/config, profiles, agents, skills, notes, loops, MCP, model presets, sessions, conversations, queues, speech models, integrations, tunnel, updater, API-key rotation, emergency stop, status, logs, and audit | Covered |
| Document route/action, existing app surface, TUI usage, flows, evidence, and exclusions | Matrix columns record all requested fields | Covered |
| Implement missing TUI commands with shared route constants/builders | `scripts/dotagents-tui.ts` imports and uses `REMOTE_SERVER_API_PATHS`, `REMOTE_SERVER_API_BUILDERS`, and `getRemoteServerApiRoutePath` | Covered |
| Avoid hardcoded `/v1` routes, sanitized tool names, filesystem capability access, and desktop IPC | Route construction is centralized through shared helpers; no `tipc`/IPC imports in the TUI; local filesystem use is bootstrap-only | Covered |
| Add focused TUI smoke tests for auth, route builders, encoded params, query params, JSON bodies, CRUD, and actions | `apps/desktop/src/main/dotagents-tui-smoke.test.ts` covers those flows | Covered |
| Run required verification | Latest Verification section records the required TUI gates | Covered |
| Classify every server-supported TUI-relevant gap | Matrix and Non-TUI Route Classification sections contain no open TUI capability gaps | Covered |

## Matrix

| Capability | Shared server route/action | Existing Electron/mobile surface | TUI command and flows | Verification evidence | Exclusion or gap classification |
| --- | --- | --- | --- | --- | --- |
| Connection, auth, and route construction | `getRemoteServerApiRoutePath(path)` prefixes shared `/v1` paths; bearer API key accepted by all routes | Desktop remote server config and mobile remote client setup | Server URL/API key from env or desktop config; all commands call `apiRequest(routeConstantOrBuilder)` | Smoke test asserts `Authorization: Bearer test-tui-key` and `/v1` paths from the mock daemon | Bootstrap config/secret reads are allowed only to locate/authenticate the remote server; DotAgents feature data stays server-backed |
| Chat completions | `POST /chat/completions` | Desktop and mobile chat surfaces | Plain text or `--once "prompt"` streams chat output | `keeps one-shot chat streaming on the chat completions endpoint` | None |
| Operator status and health | `GET /operator/status`, `GET /operator/health` | Desktop status panels; mobile Operations screen | `/status`, `/health` read server, health, sessions, integrations, and system state | `renders operator status from the shared remote server`; required `/help` smoke | None |
| Operator errors, logs, and audit | `GET /operator/errors`, `GET /operator/logs`, `GET /operator/audit` with query params | Desktop and mobile operator diagnostics | `/errors [count]`, `/logs [count] [level]`, `/audit [count]` | `routes additional operator commands through the shared server API` verifies query strings | None |
| Settings and `.agents` config | `GET/PATCH /settings` | Desktop settings pages; mobile Settings screen | `/settings` reads; `/settings patch <json>` updates shallow settings through the server | `runs filesystem resource mutations through the shared server API` verifies `PATCH /v1/settings` body | No direct `.agents` file editing in TUI; sensitive/native file helpers stay desktop-only |
| Legacy profiles | `GET /profiles`, `GET/POST /profiles/current`, `GET /profiles/:id/export`, `POST /profiles/import` | Desktop profile actions; mobile profile picker/import/export | `/profiles`, `/use <profile-id>`, `/profile export <id>`, `/profile import <json>` | `exports and imports profiles through the shared profile API` verifies encoded profile IDs and import body | None |
| Agent profiles | `GET/POST /agent-profiles`, `GET/PATCH/DELETE /agent-profiles/:id`, `POST /agent-profiles/:id/toggle` | Desktop settings agents; mobile agent edit screens | `/agents`, `/agent show|create|update|delete|toggle` | `routes remaining filesystem resource commands through the shared server API` verifies CRUD/toggle | None |
| Skills | `GET/POST /skills`, `GET/PATCH/DELETE /skills/:id`, `POST /skills/:id/toggle-profile` | Desktop skills settings; mobile skill edit screens | `/skills`, `/skill <id>`, `/skill show|create|update|delete|toggle` | Smoke tests verify create/update/delete/toggle and JSON body | Desktop file-picker import/export/GitHub helper workflows are local/native workflows, not TUI remote commands |
| Knowledge notes | `GET/POST /knowledge/notes`, `GET/PATCH/DELETE /knowledge/notes/:id` | Desktop knowledge page; mobile note edit screens | `/notes`, `/note show|create|update|delete` | Smoke tests verify create/update/delete and JSON body | Desktop bulk UI and folder-opening conveniences stay desktop-only |
| Loops and repeat tasks | `GET/POST /loops`, `PATCH/DELETE /loops/:id`, `POST /loops/:id/run`, `POST /loops/:id/toggle` | Desktop loops settings; mobile loop editor | `/loops`, `/loop create|update|delete|run|toggle` | Smoke tests verify create/update/delete/run/toggle | Opening task files in an editor is desktop-only |
| Model presets | `GET/POST /operator/model-presets`, `PATCH/DELETE /operator/model-presets/:presetId`; active preset via `PATCH /settings` | Desktop model preset manager; mobile endpoint picker/editor | `/presets`, `/preset use|create|update|delete` | Smoke tests verify preset CRUD and `/preset use` settings patch | Raw `/models` provider discovery is classified as provider lookup, not preset CRUD parity |
| MCP saved servers | `GET /mcp/servers`, `POST /mcp/servers/:name/toggle` | Desktop MCP config manager; mobile settings list/toggle | `/mcp servers`, `/mcp enable-server|disable-server <server>` | `runs MCP actions through the operator API` verifies list/toggle | Raw MCP config file editing and OAuth token import/export remain desktop/security-sensitive |
| MCP runtime, tools, logs, and actions | `GET /operator/mcp`, `GET /operator/mcp/tools`, `GET /operator/mcp/:server/logs`, `POST /operator/mcp/:server/test`, `POST /operator/actions/mcp-start|stop|restart`, `POST /operator/mcp/tools/:toolName/toggle`, `POST /operator/mcp/:server/logs/clear` | Desktop MCP runtime UI; mobile Operations screen | `/mcp`, `/mcp tools [server]`, `/mcp logs <server> [count]`, `/mcp test <server>`, `/mcp start|stop|restart <server>`, `/mcp enable-tool|disable-tool <tool>`, `/mcp clear-logs <server>` | Smoke tests verify restart body, saved server toggle, and clear logs | Tool names are passed to shared builders; no sanitized-name hardcoding in TUI |
| Conversations and sessions | `GET /operator/conversations`, `POST /operator/sessions/:sessionId/stop`, `POST /chat/completions` | Desktop session state; mobile chat/session list | `/conversations`, `/session stop <session-id>`, normal chat prompts | Smoke tests verify conversation/chat endpoint and encoded session stop | Direct `/conversations` sync/mutation routes and video asset fetches are mobile recovery/media routes, not core TUI transcript editing |
| Message queues | `GET /operator/message-queues`, `POST /operator/message-queues/:conversationId/pause|resume|clear`, `PATCH/DELETE /operator/message-queues/:conversationId/messages/:messageId`, `POST /retry` | Desktop queue store; mobile Operations queue panel | `/queues`, `/queue pause|resume|clear <conversation-id>`, `/queue msg delete|retry|update <conversation-id> <message-id> [text]` | `controls operator message queues through the shared server API` verifies encoded IDs and update body | None |
| Local speech models | `GET /operator/local-speech-models`, `GET /operator/local-speech-models/:providerId`, `POST /operator/local-speech-models/:providerId/download` | Desktop speech model services; mobile Settings model status/download | `/speech`, `/speech show <provider>`, `/speech download <provider>` | Additional operator command smoke verifies show/download | `/tts/speak` is client audio playback, not TUI model management |
| Integrations | `GET /operator/integrations`, Discord routes, WhatsApp routes | Desktop integration status/actions; mobile Operations screen | `/integrations`, `/discord [logs|connect|disconnect|clear-logs]`, `/whatsapp [connect|logout]` | Additional operator command smoke verifies integrations, Discord logs/clear, WhatsApp logout | Browser/OAuth handoff details remain app-specific where required |
| Tunnel and remote server | `GET /operator/remote-server`, `GET /operator/tunnel`, `GET /operator/tunnel/setup`, `POST /operator/tunnel/start|stop` | Desktop remote server/tunnel controls; mobile Operations screen | `/remote-server`, `/tunnel`, `/tunnel setup|start|stop` | Additional operator and lifecycle smoke tests verify status/setup/start | Native URL opening/reveal helpers remain desktop-only |
| Updater | `GET /operator/updater`, `POST /operator/updater/check|download-latest|reveal-download|open-download|open-releases` | Desktop updater actions; mobile Operations surface where safe | `/updater`, `/updater check|download|reveal|open|releases` | Additional operator command smoke verifies update check | Native reveal/open actions are still invoked through server actions, not local TUI filesystem access |
| Lifecycle and security actions | `POST /operator/actions/restart-remote-server`, `POST /operator/actions/restart-app`, `POST /operator/actions/run-agent`, `POST /operator/access/rotate-api-key`, `POST /emergency-stop` | Desktop operator actions; mobile Operations screen | `/server restart`, `/app restart`, `/run-agent <prompt-or-json>`, `/key rotate`, `/stop` | Additional operator and lifecycle smoke tests verify restart, run-agent, key rotation | None |

## Non-TUI Route Classification

| Server route family | Classification | Rationale |
| --- | --- | --- |
| `GET /models`, `GET /models/:providerId` | Provider discovery, not model preset CRUD | The TUI exposes model endpoint/preset management through `/presets`; provider discovery can be added as a read-only convenience if product wants it |
| `POST /tts/speak` | Client audio playback | Terminal TUI manages local speech model status/download, but does not own audio playback UX |
| `POST /push/register`, `/push/unregister`, `GET /push/status`, `POST /push/clear-badge` | Mobile notification lifecycle | Device token and badge actions belong to mobile/native clients |
| `GET /conversations/:id/assets/videos/:fileName` | Media asset fetch | The TUI does not render or manage video assets |
| `GET/POST/PUT /conversations` and `GET /conversations/:id` | Sync/recovery/transcript mutation | TUI parity covers chat streaming, recent operator conversations, session stop, and queues; full conversation synchronization/editing remains mobile/desktop client state work |
| Raw local file helpers for config, skills, notes, MCP, and tasks | Desktop-only native workflow | TUI capability commands intentionally use server routes instead of reading or writing local `.agents` files |

## Latest Verification

Required TUI gates:

- `pnpm build:shared`
- `pnpm --filter @dotagents/desktop exec vitest run src/main/dotagents-tui-smoke.test.ts`
- `pnpm tui -- --once "/help"`
- `pnpm --filter @dotagents/desktop typecheck:node`

Last completed result for these gates: pass.
