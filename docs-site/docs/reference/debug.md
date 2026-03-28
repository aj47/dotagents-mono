---
sidebar_position: 2
sidebar_label: "Debug & Diagnostics"
---

# CLI & Debug Flags

DotAgents includes comprehensive debug logging for development and troubleshooting.

---

## Debug Modes

Start DotAgents in development mode with specific debug flags:

```bash
pnpm dev d               # Enable ALL debug logging
pnpm dev debug-llm       # LLM calls and responses only
pnpm dev debug-tools     # MCP tool execution only
pnpm dev debug-ui        # UI focus and state changes only
```

## Debug Categories

### LLM Debug (`debug-llm`)

Logs all LLM-related operations:

- API requests (model, messages, parameters)
- API responses (content, token usage)
- Tool call decisions
- Context window management
- Continuation guards
- Message shrinking/budgeting

### Tool Debug (`debug-tools`)

Logs all MCP tool operations:

- Tool discovery from servers
- Tool call requests (name, arguments)
- Tool execution results
- Tool approval flows
- Server connection status

### UI Debug (`debug-ui`)

Logs UI state changes:

- Focus events (window focus/blur)
- State transitions
- Component lifecycle events
- Keyboard event handling

### Full Debug (`d`)

Enables all debug categories simultaneously. Use this when you're not sure what's going wrong.

## Log Output

Debug logs appear in:

- **Terminal** — When running via `pnpm dev`
- **Electron DevTools** — Main process console (View > Toggle Developer Tools)
- **Renderer DevTools** — Right-click > Inspect in the app window

## Headless CLI

Run the desktop app without opening the GUI:

```bash
pnpm --filter @dotagents/desktop dev -- --headless
```

Inside the CLI, use:

- `/status` to show the active model, current agent, current conversation, MCP state, and active sessions
- `/sessions` to list active and recent tracked agent sessions
- `/session-stop <session-id-or-prefix>` to stop one tracked agent session
- `/sessions-clear` to clear inactive sessions that do not still have queued follow-ups
- `/queues` to list conversations with queued messages
- `/queue [conversation-id-prefix]` to inspect one conversation queue
- `/queue-edit <message-id-or-prefix> <text>` to change one queued message before it runs
- `/queue-remove <message-id-or-prefix> [conversation-id-prefix]` to remove one queued message
- `/queue-retry <message-id-or-prefix> [conversation-id-prefix]` to retry one failed queued message
- `/queue-clear [conversation-id-prefix]` to clear one conversation queue
- `/queue-pause [conversation-id-prefix]` to pause queue processing for one conversation
- `/queue-resume [conversation-id-prefix]` to resume queue processing for one conversation
- `/mcp` to list MCP servers with status and transport
- `/mcp-show <server-name-prefix>` to inspect one MCP server in detail
- `/mcp-enable <server-name-prefix>` to runtime-enable a server for the current profile
- `/mcp-disable <server-name-prefix>` to runtime-disable a server for the current profile
- `/mcp-restart <server-name-prefix>` to restart an MCP server process
- `/mcp-stop <server-name-prefix>` to stop an MCP server process
- `/mcp-logs <server-name-prefix>` to inspect recent MCP server logs
- `/agents` to list agent profiles and the current selection
- `/agent <agent-id-or-name>` to switch the active agent for future prompts
- `/agent-profiles` to list all agent profiles, including disabled ones
- `/agent-show <agent-id-or-name>` to inspect a full agent profile before changing it
- `/agent-new <json>` to create an agent profile from a JSON payload
- `/agent-edit <agent-id-or-name> <json>` to update an agent profile from a JSON payload
- `/agent-toggle <agent-id-or-name>` to enable or disable an agent profile
- `/agent-delete <agent-id-or-name>` to delete an agent profile after confirmation
- `/agent-export <agent-id-or-name>` to print one agent profile as export JSON
- `/agent-export-file <agent-id-or-name> <path>` to write one exported agent profile JSON file
- `/agent-import <json>` to import an agent profile from export JSON
- `/agent-import-file <path>` to import an agent profile from a JSON file
- `/skills` to list the current profile's effective skill access
- `/skill <id>` to toggle one skill for the current profile
- `/skill-show <skill-id-or-name>` to inspect a single skill in detail
- `/skill-new <json>` to create a skill from a JSON payload
- `/skill-edit <skill-id-or-name> <json>` to update a skill from a JSON payload
- `/skill-delete <skill-id-or-name>` to delete a skill after confirmation
- `/skill-delete-many <json>` to delete multiple skills from a JSON array of selectors
- `/skill-export <skill-id-or-name>` to print a skill as `SKILL.md`
- `/skill-path <skill-id-or-name>` to print the canonical skill file path
- `/skill-import-file <path>` to import one skill markdown file
- `/skill-import-folder <path>` to import one folder containing `SKILL.md`
- `/skill-import-parent <path>` to bulk-import skill folders from a parent directory
- `/skill-import-github <owner/repo[/path]>` to import skills from GitHub
- `/skill-scan` to reload layered `.agents/skills` files
- `/skill-cleanup` to remove stale skill references from agent profiles
- `/loops` to list repeat tasks with live status, schedule, and agent info
- `/loop-show <loop-id-or-name>` to inspect a repeat task before changing it
- `/loop-new <json>` to create a repeat task from a JSON payload
- `/loop-edit <loop-id-or-name> <json>` to update a repeat task from a JSON payload
- `/loop-toggle <loop-id-or-name>` to enable or disable a repeat task
- `/loop-run <loop-id-or-name>` to run a repeat task immediately
- `/loop-delete <loop-id-or-name>` to delete a repeat task after confirmation
- `/notes` to list knowledge notes with context and tags
- `/note-show <note-id-or-prefix>` to inspect one knowledge note in detail
- `/note-search <query>` to search knowledge notes by content or metadata
- `/note-new <json>` to create a knowledge note from a JSON payload
- `/note-edit <note-id-or-prefix> <json>` to update a knowledge note from a JSON payload
- `/note-delete <note-id-or-prefix>` to delete a knowledge note after confirmation
- `/note-delete-many <json>` to delete multiple knowledge notes from a JSON array of selectors
- `/note-delete-all` to delete all knowledge notes
- `/settings` to print the shared remote/headless settings snapshot
- `/settings-edit <json>` to update the shared settings subset from a JSON payload
- `/remote-status` to inspect remote-server bind, pairing URL, and last error state
- `/remote-qr` to print the remote-server pairing QR code in the terminal
- `/cloudflare-status` to inspect Cloudflare install, login, and live tunnel state
- `/cloudflare-start` to start the configured Cloudflare tunnel mode from settings
- `/cloudflare-stop` to stop the active Cloudflare tunnel
- `/cloudflare-list` to list available named Cloudflare tunnels
- `/whatsapp-status` to inspect WhatsApp MCP availability and connection state
- `/whatsapp-connect` to start or resume WhatsApp pairing and print a terminal QR code when required
- `/whatsapp-disconnect` to disconnect the active WhatsApp session
- `/whatsapp-logout` to logout and clear saved WhatsApp credentials after confirmation
- `/bundle-items` to list exportable bundle items from the merged `.agents` layers
- `/bundle-export <path> [json]` to write a `.dotagents` bundle file
- `/bundle-preview <path>` to inspect a bundle file and merged import conflicts
- `/bundle-import <path> [json]` to import a bundle with optional conflict/component controls
- `/bundle-publish-payload <json>` to print a Hub publish payload JSON for the merged layers
- `/sandboxes` to list sandbox slots plus the active slot
- `/sandbox-baseline-save` to save or update the baseline sandbox slot
- `/sandbox-baseline-restore` to restore the baseline sandbox slot after confirmation
- `/sandbox-slot-save <name>` to snapshot the current config into a named sandbox slot
- `/sandbox-slot-switch <name>` to switch to a named sandbox slot
- `/sandbox-slot-delete <name>` to delete a non-active sandbox slot after confirmation
- `/sandbox-slot-rename <old> <new>` to rename a sandbox slot
- `/sandbox-bundle-import <path> <slot-name> [json]` to create or update a sandbox slot from a bundle import
- `/conversations` to list recent sessions
- `/use <conversation-id-prefix>` to continue a specific session
- `/show [conversation-id-prefix]` to inspect recent messages before continuing
- `/rename <title>` to rename the current session
- `/pin [conversation-id-prefix]` to pin or unpin the current or selected session
- `/archive [conversation-id-prefix]` to archive or unarchive the current or selected session
- `/delete [conversation-id-prefix]` to delete the current or selected session
- `/delete-all` to clear all saved sessions and pinned/archive state

The headless session commands above now also share the same tracked-session snapshot plus stop/cleanup helper path that desktop session queries, stop buttons, and inactive-session cleanup already use through `tipc.ts`, so CLI inspection and per-session stop behavior stay aligned with the Sessions page and active-session sidebar. The headless queue commands above now also share the same queue snapshot, queued-message selection, retry/edit recovery, pause/resume, and queued follow-up replay helpers that the desktop message-queue panel uses through `tipc.ts`, so queue inspection and recovery stay aligned before presentation diverges into terminal rows or desktop queue cards. The headless WhatsApp commands now also share the same WhatsApp management path that `Settings > WhatsApp` uses in the desktop UI, so MCP availability checks, status payload parsing, QR-required connection responses, and disconnect/logout error handling stay aligned before the CLI prints terminal state or QR output. The headless skill commands above now share the same skill catalog CRUD/import/export path that `Settings > Skills` uses in the desktop UI, so single-item and bulk delete flows, file imports, GitHub imports, markdown export, and stale profile-skill cleanup all follow one main-process implementation. The headless bundle commands now also share the same bundle-management path that desktop bundle export/import/publish dialogs and sandbox restore/import flows use, so merged global/workspace layer selection, conflict previews, publish payload generation, and post-import runtime refresh stay aligned. The headless sandbox commands now also share the same sandbox-management path that the desktop sandbox slot switcher uses in the GUI, so baseline save/restore, slot prefix matching, switch/delete/rename behavior, and bundle-backed sandbox imports all follow one main-process implementation before the terminal or desktop surfaces render status.
The headless session commands above now also share the same tracked-session snapshot plus stop/cleanup helper path that desktop session queries, stop buttons, and inactive-session cleanup already use through `tipc.ts`, so CLI inspection and per-session stop behavior stay aligned with the Sessions page and active-session sidebar. The headless queue commands above now also share the same queue snapshot, queued-message selection, retry/edit recovery, pause/resume, and queued follow-up replay helpers that the desktop message-queue panel uses through `tipc.ts`, so queue inspection and recovery stay aligned before presentation diverges into terminal rows or desktop queue cards. The headless remote-access commands now also share the same remote-access management path that `Settings > Remote Server` uses in the desktop UI, so remote-server status, manual terminal QR printing, Cloudflare install/login checks, named-tunnel listing, and tunnel start/stop behavior stay aligned before the CLI prints terminal output. The headless WhatsApp commands now also share the same WhatsApp management path that `Settings > WhatsApp` uses in the desktop UI, so MCP availability checks, status payload parsing, QR-required connection responses, and disconnect/logout error handling stay aligned before the CLI prints terminal state or QR output. The headless skill commands above now share the same skill catalog CRUD/import/export path that `Settings > Skills` uses in the desktop UI, so single-item and bulk delete flows, file imports, GitHub imports, markdown export, and stale profile-skill cleanup all follow one main-process implementation. The headless bundle commands now also share the same bundle-management path that desktop bundle export/import/publish dialogs and sandbox restore/import flows use, so merged global/workspace layer selection, conflict previews, publish payload generation, and post-import runtime refresh stay aligned. The headless sandbox commands now also share the same sandbox-management path that the desktop sandbox slot switcher uses in the GUI, so baseline save/restore, slot prefix matching, switch/delete/rename behavior, and bundle-backed sandbox imports all follow one main-process implementation before the terminal or desktop surfaces render status.

Use QR-based remote access while staying headless:

```bash
pnpm --filter @dotagents/desktop dev -- --qr
```

The headless CLI, QR mode, desktop UI, remote server, and loop scheduler all share the same top-level agent runner, so ACP routing and tool execution stay aligned across entry points. Fresh desktop text, voice, CLI, remote, and loop prompts now also share the same launcher and conversation/session bootstrap before entering that runner, while queued desktop follow-ups and ACP parent-resume nudges now share a dedicated resume-only launcher so they do not duplicate persisted or synthetic turns. Headless CLI `/status`, `/sessions`, `/session-stop`, and `/sessions-clear` now also reuse one tracked-session helper path, so active/recent session snapshots, exact/prefix session matching, per-session stop behavior, and inactive-session cleanup stay aligned with desktop session queries, stop buttons, and inactive-session cleanup before terminal formatting diverges. Headless CLI `/queues`, `/queue`, `/queue-edit`, `/queue-remove`, `/queue-retry`, `/queue-clear`, `/queue-pause`, and `/queue-resume` now also reuse one message-queue helper path, so queued-message selection, edit/retry recovery, pause/resume decisions, and queued follow-up replay stay aligned with the desktop queue panel and queued desktop follow-up processor before presentation diverges. Headless CLI conversation browsing now also resolves `/use`, `/show`, `/pin`, `/archive`, and `/delete` targets through the same conversation-selection and session-state helpers every time, so continuing or reclassifying an older session by ID or unique prefix follows one lookup path and one pinned/archived state path before it re-enters the shared prompt launcher or desktop/mobile surfaces. `/conversations` and `/show` now also reuse the same conversation-management history/load helpers that desktop `tipc.ts` session queries and remote `/v1/conversations*` history/recovery routes use, while desktop `saveConversation(...)`, `createConversation(...)`, `addMessageToConversation(...)`, and queued follow-up persistence now also share that same main-process conversation-management layer. Those pinned/archived IDs now also hydrate through the same shared session-state normalizer in the renderer, remote settings API, and mobile sync path, so invalid payloads get stripped the same way everywhere before state is reused. CLI renames, deletes, desktop history actions, and runtime `set_session_title` now also converge on one shared conversation-management helper, so tracked session titles plus pinned/archived cleanup stay aligned across terminal, desktop UI, and runtime-tool entry points. Headless CLI agent switching plus desktop and remote/mobile profile switches now also converge on one shared activation helper, so current-profile persistence, model/STT/TTS overrides, and MCP runtime config get reapplied the same way before the next prompt runs. Headless CLI `/status`, desktop profile picker data, and remote `/v1/profiles*` routes now also converge on the same current-profile/catalog helpers, so current profile reads plus user-profile, target-profile, and external-agent subsets stay aligned before terminal, desktop, or remote settings surfaces format them. Headless CLI agent profile management now also converges on one shared helper path, so `/agent-profiles`, `/agent-show`, `/agent-new`, `/agent-edit`, `/agent-toggle`, and `/agent-delete` all reuse the same profile selection, create/update validation, connection sanitization, enable/disable toggle, and delete-protection logic that desktop settings handlers and remote `/v1/agent-profiles` routes use. The backward-compatible desktop `getProfile*`, `createProfile(...)`, `updateProfile(...)`, `deleteProfile(...)`, and `setCurrentProfile(...)` IPC handlers now also converge on managed legacy-profile adapters, so those legacy payloads still come from the same current-profile guard plus shared agent-profile validation and persistence path before being reshaped for older callers. Headless CLI agent profile import/export now also converges on that same shared helper path, so `/agent-export`, `/agent-export-file`, `/agent-import`, and `/agent-import-file` reuse the same export JSON generation and import validation that desktop profile file actions and remote `/v1/profiles/import|export` routes use. Agent picker readiness now also converges on one shared profile helper, so headless `/agents` output, `/agent` matching, ACP main-agent config matching, desktop next-session agent selection, mobile selector lists, and ACP-capable profile filtering all use the same enabled/default/display-name/id-prefix rules before activation. Headless CLI `/skills` and `/skill <id>`, remote `/v1/skills` and `/v1/skills/:id/toggle-profile`, and the desktop `toggleProfileSkill(...)` handler now also converge on a shared profile-skill management helper, while the shared profile-skill rules still interpret default-vs-opt-in skill access the same way before toggles are applied. Headless `/agents` and the desktop Settings > Agents catalog now also share one summary helper path, so both surfaces apply the same description fallback plus connection/provider/server/skill/property metadata and status labels before rendering. Headless CLI repeat-task controls now also share one loop-management helper path with the desktop repeat-task settings page and remote loop API, so `/loops`, `/loop-show`, `/loop-new`, `/loop-edit`, `/loop-toggle`, `/loop-run`, and `/loop-delete` all resolve repeat-task selection, JSON payload validation, live status fields, and create/update/delete/enable/disable/manual-run behavior the same way those other surfaces do. Headless CLI MCP server controls now also share one MCP-management helper path with the desktop capabilities UI and remote MCP status/toggle routes, so `/mcp`, `/mcp-show`, `/mcp-enable`, `/mcp-disable`, `/mcp-restart`, `/mcp-stop`, and `/mcp-logs` all resolve server selection, runtime enablement, restart/stop lifecycle actions, and recent log lookup the same way those other surfaces do. Headless CLI WhatsApp controls now also share one WhatsApp-management helper path with the desktop WhatsApp settings page, so `/whatsapp-status`, `/whatsapp-connect`, `/whatsapp-disconnect`, and `/whatsapp-logout` all reuse the same MCP availability checks, status parsing, QR-required pairing handling, and disconnect/logout error interpretation before terminal or GUI state diverges. Knowledge notes now also converge on one shared management path, so desktop note browsing/search/edit/delete, agent-summary note saves, remote `/v1/knowledge/notes` CRUD, and headless CLI `/notes`, `/note-show`, `/note-search`, `/note-new`, `/note-edit`, `/note-delete`, `/note-delete-many`, and `/note-delete-all` all normalize and persist notes through the same main-process helper. Shared settings management now also covers `/settings` and `/settings-edit`, so headless settings inspection uses the same normalized `/v1/settings` snapshot as remote/mobile clients, while desktop `saveConfig(...)`, remote `PATCH /v1/settings`, and headless settings edits all reuse the same config-persistence side effects for remote access, WhatsApp, Langfuse, and model-cache updates. Headless CLI bundle management now also converges on one shared helper path, so `/bundle-items`, `/bundle-export`, `/bundle-preview`, `/bundle-import`, and `/bundle-publish-payload` reuse the same merged layer selection, workspace/global conflict preview, publish payload generation, and post-import runtime refresh that desktop bundle dialogs and sandbox import/restore flows use. Headless CLI sandbox slot management now also converges on one shared helper path, so `/sandboxes`, `/sandbox-baseline-save`, `/sandbox-baseline-restore`, `/sandbox-slot-save`, `/sandbox-slot-switch`, `/sandbox-slot-delete`, `/sandbox-slot-rename`, and `/sandbox-bundle-import` all reuse the same slot selection, baseline save/restore, switch/delete/rename, and bundle-to-slot import behavior that the desktop sandbox switcher uses. Desktop settings main-agent dropdowns, mobile ACP selector sheets, and main-process ACP validation now also share one ACP option helper, so ACP-capable profile agents and legacy stdio entries are deduped the same way before a main agent is selected or repaired. Legacy active/stop/iteration flags are likewise left to the shared session manager, which prevents one entry point from clearing another still-running session. The repo-level path matrix lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.
The headless CLI, QR mode, desktop UI, remote server, and loop scheduler all share the same top-level agent runner, so ACP routing and tool execution stay aligned across entry points. Fresh desktop text, voice, CLI, remote, and loop prompts now also share the same launcher and conversation/session bootstrap before entering that runner, while queued desktop follow-ups and ACP parent-resume nudges now share a dedicated resume-only launcher so they do not duplicate persisted or synthetic turns. Headless CLI `/status`, `/sessions`, `/session-stop`, and `/sessions-clear` now also reuse one tracked-session helper path, so active/recent session snapshots, exact/prefix session matching, per-session stop behavior, and inactive-session cleanup stay aligned with desktop session queries, stop buttons, and inactive-session cleanup before terminal formatting diverges. Headless CLI `/queues`, `/queue`, `/queue-edit`, `/queue-remove`, `/queue-retry`, `/queue-clear`, `/queue-pause`, and `/queue-resume` now also reuse one message-queue helper path, so queued-message selection, edit/retry recovery, pause/resume decisions, and queued follow-up replay stay aligned with the desktop queue panel and queued desktop follow-up processor before presentation diverges. Headless CLI conversation browsing now also resolves `/use`, `/show`, `/pin`, `/archive`, and `/delete` targets through the same conversation-selection and session-state helpers every time, so continuing or reclassifying an older session by ID or unique prefix follows one lookup path and one pinned/archived state path before it re-enters the shared prompt launcher or desktop/mobile surfaces. `/conversations` and `/show` now also reuse the same conversation-management history/load helpers that desktop `tipc.ts` session queries and remote `/v1/conversations*` history/recovery routes use, while desktop `saveConversation(...)`, `createConversation(...)`, `addMessageToConversation(...)`, and queued follow-up persistence now also share that same main-process conversation-management layer. Those pinned/archived IDs now also hydrate through the same shared session-state normalizer in the renderer, remote settings API, and mobile sync path, so invalid payloads get stripped the same way everywhere before state is reused. CLI renames, deletes, desktop history actions, and runtime `set_session_title` now also converge on one shared conversation-management helper, so tracked session titles plus pinned/archived cleanup stay aligned across terminal, desktop UI, and runtime-tool entry points. Headless CLI agent switching plus desktop and remote/mobile profile switches now also converge on one shared activation helper, so current-profile persistence, model/STT/TTS overrides, and MCP runtime config get reapplied the same way before the next prompt runs. Headless CLI `/status`, desktop profile picker data, and remote `/v1/profiles*` routes now also converge on the same current-profile/catalog helpers, so current profile reads plus user-profile, target-profile, and external-agent subsets stay aligned before terminal, desktop, or remote settings surfaces format them. Headless CLI agent profile management now also converges on one shared helper path, so `/agent-profiles`, `/agent-show`, `/agent-new`, `/agent-edit`, `/agent-toggle`, and `/agent-delete` all reuse the same profile selection, create/update validation, connection sanitization, enable/disable toggle, and delete-protection logic that desktop settings handlers and remote `/v1/agent-profiles` routes use. The backward-compatible desktop `getProfile*`, `createProfile(...)`, `updateProfile(...)`, `deleteProfile(...)`, and `setCurrentProfile(...)` IPC handlers now also converge on managed legacy-profile adapters, so those legacy payloads still come from the same current-profile guard plus shared agent-profile validation and persistence path before being reshaped for older callers. Headless CLI agent profile import/export now also converges on that same shared helper path, so `/agent-export`, `/agent-export-file`, `/agent-import`, and `/agent-import-file` reuse the same export JSON generation and import validation that desktop profile file actions and remote `/v1/profiles/import|export` routes use. Agent picker readiness now also converges on one shared profile helper, so headless `/agents` output, `/agent` matching, ACP main-agent config matching, desktop next-session agent selection, mobile selector lists, and ACP-capable profile filtering all use the same enabled/default/display-name/id-prefix rules before activation. Headless CLI `/skills` and `/skill <id>`, remote `/v1/skills` and `/v1/skills/:id/toggle-profile`, and the desktop `toggleProfileSkill(...)` handler now also converge on a shared profile-skill management helper, while the shared profile-skill rules still interpret default-vs-opt-in skill access the same way before toggles are applied. Headless `/agents` and the desktop Settings > Agents catalog now also share one summary helper path, so both surfaces apply the same description fallback plus connection/provider/server/skill/property metadata and status labels before rendering. Headless CLI repeat-task controls now also share one loop-management helper path with the desktop repeat-task settings page and remote loop API, so `/loops`, `/loop-show`, `/loop-new`, `/loop-edit`, `/loop-toggle`, `/loop-run`, and `/loop-delete` all resolve repeat-task selection, JSON payload validation, live status fields, and create/update/delete/enable/disable/manual-run behavior the same way those other surfaces do. Headless CLI MCP server controls now also share one MCP-management helper path with the desktop capabilities UI and remote MCP status/toggle routes, so `/mcp`, `/mcp-show`, `/mcp-enable`, `/mcp-disable`, `/mcp-restart`, `/mcp-stop`, and `/mcp-logs` all resolve server selection, runtime enablement, restart/stop lifecycle actions, and recent log lookup the same way those other surfaces do. Headless CLI remote access controls now also share one remote-access-management helper path with the desktop remote-server settings page, so `/remote-status`, `/remote-qr`, `/cloudflare-status`, `/cloudflare-start`, `/cloudflare-stop`, and `/cloudflare-list` all reuse the same remote-server status, terminal QR printing, Cloudflare install/login checks, named-tunnel list lookup, and tunnel start/stop handling before terminal or GUI state diverges. Headless CLI WhatsApp controls now also share one WhatsApp-management helper path with the desktop WhatsApp settings page, so `/whatsapp-status`, `/whatsapp-connect`, `/whatsapp-disconnect`, and `/whatsapp-logout` all reuse the same MCP availability checks, status parsing, QR-required pairing handling, and disconnect/logout error interpretation before terminal or GUI state diverges. Knowledge notes now also converge on one shared management path, so desktop note browsing/search/edit/delete, agent-summary note saves, remote `/v1/knowledge/notes` CRUD, and headless CLI `/notes`, `/note-show`, `/note-search`, `/note-new`, `/note-edit`, `/note-delete`, `/note-delete-many`, and `/note-delete-all` all normalize and persist notes through the same main-process helper. Shared settings management now also covers `/settings` and `/settings-edit`, so headless settings inspection uses the same normalized `/v1/settings` snapshot as remote/mobile clients, while desktop `saveConfig(...)`, remote `PATCH /v1/settings`, and headless settings edits all reuse the same config-persistence side effects for remote access, WhatsApp, Langfuse, and model-cache updates. Headless CLI bundle management now also converges on one shared helper path, so `/bundle-items`, `/bundle-export`, `/bundle-preview`, `/bundle-import`, and `/bundle-publish-payload` reuse the same merged layer selection, workspace/global conflict preview, publish payload generation, and post-import runtime refresh that desktop bundle dialogs and sandbox import/restore flows use. Headless CLI sandbox slot management now also converges on one shared helper path, so `/sandboxes`, `/sandbox-baseline-save`, `/sandbox-baseline-restore`, `/sandbox-slot-save`, `/sandbox-slot-switch`, `/sandbox-slot-delete`, `/sandbox-slot-rename`, and `/sandbox-bundle-import` all reuse the same slot selection, baseline save/restore, switch/delete/rename, and bundle-to-slot import behavior that the desktop sandbox switcher uses. Desktop settings main-agent dropdowns, mobile ACP selector sheets, and main-process ACP validation now also share one ACP option helper, so ACP-capable profile agents and legacy stdio entries are deduped the same way before a main agent is selected or repaired. Legacy active/stop/iteration flags are likewise left to the shared session manager, which prevents one entry point from clearing another still-running session. The repo-level path matrix lives in `apps/desktop/CLI_DESKTOP_FEATURE_PATHS.md`.

Headless, QR, and GUI startup also share the same runtime bootstrap for MCP, repeat tasks, ACP profile sync, bundled skills, and models.dev initialization, so both `--headless` and `--qr` now boot the same service stack as the desktop app before they diverge into the terminal REPL or QR pairing flow. The two non-GUI modes now also share one top-level launcher for startup failure handling and signal wiring; `--headless` intentionally leaves `SIGINT` / Ctrl+C to the terminal REPL so in-flight runs still stop locally before exiting, while QR mode lets the shared launcher own both `SIGINT` and `SIGTERM`. Remote server startup is likewise shared now: desktop remote access, headless CLI, and QR pairing all pass through the same remote-access bootstrap, which then reuses the same config-aware Cloudflare tunnel helper, with QR mode forcing the same named-to-quick fallback path before printing the pairing URL. Terminal QR printing now also shares one helper, so startup auto-print, manual desktop QR printing, and QR-mode override URLs all apply the same API-key, streamer-mode, and LAN/tunnel URL normalization rules before printing. Desktop startup and desktop settings reconfiguration now also converge on one config-driven remote-access reconciler, so enabling, disabling, and restarting the desktop remote server follows the same Cloudflare auto-start and teardown rules after launch. GUI quit and non-GUI graceful shutdown now also converge on the same loop/ACP/MCP/remote-server teardown helper, while desktop layers keyboard-listener cleanup on top.
The remote-server settings page now also consumes the same shared mobile-pairing URL helper that main-process status and QR paths use, so wildcard/loopback warnings, IPv6 URL formatting, and default bind/port fallbacks stay consistent between the GUI, QR output, and headless defaults. MCP server runtime classification now also goes through one shared helper, so headless `/status`, desktop capability screens, and the remote `/v1/mcp/servers` endpoint all distinguish disabled vs stopped vs connected/error/disconnected servers the same way. Repeat-task summaries and runtime actions now also go through one shared helper, so the desktop repeat-task page, headless CLI loop commands, and the remote `/v1/loops` endpoints all merge profile names with runtime last-run/next-run/is-running fields and apply the same enable/disable/manual-run behavior. Settings snapshots and validated settings updates now also go through one shared helper, so headless `/settings`, remote `/v1/settings`, masked secret handling, shared ACP main-agent options, and remote-access defaults all stay aligned before any caller formats or patches that state.

Agent/MCP model selection now also goes through one shared provider/model resolver, so CLI status, renderer model defaults, progress metadata, MCP sampling defaults, remote API model payloads, and AI SDK runtime model creation all report the same effective provider/model pairing. Speech-provider defaults now also route through shared STT/TTS selectors, so onboarding checks, speech settings pages, transcript-provider fallbacks, remote settings payloads, and the live transcription/TTS runtime all agree on the same default provider/model/voice resolution. OpenAI-compatible preset resolution now also goes through one shared preset helper, so CLI/provider labels, remote preset payloads, weak summarization preset lookup, preset editors, and preset-scoped model fetches all apply the same built-in override, duplicate filtering, legacy OpenAI key fallback, and default preset ID rules. Conversation-history serialization now also goes through one shared formatter, so persisted tool results, desktop progress history, weak step summaries, and remote API conversation payloads all flatten tool calls/results the same way.

## Common Debugging Scenarios

### Agent Not Responding

```bash
pnpm dev debug-llm
```

Check for:

- API key validation errors
- Model availability issues
- Rate limiting
- Token budget exhaustion

### Tools Not Working

```bash
pnpm dev debug-tools
```

Check for:

- Server connection failures
- Tool discovery issues
- Tool call argument errors
- Execution timeouts

### Voice Not Recording

Check:

- System microphone permissions
- Correct microphone selected in OS settings
- Keyboard accessibility permissions (macOS)
- Rust binary is built (`pnpm build-rs`)

### Mobile App Not Connecting

Check:

- Desktop app is running
- Remote server is accessible
- Correct URL in mobile settings
- Firewall/network configuration

## Environment Variables

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `SPEAKMCP_WORKSPACE_DIR` | Set workspace `.agents/` directory |
| `DEBUG`                  | Node.js debug flag                 |

## Langfuse (Production Debugging)

For production observability without terminal access, use the [Langfuse integration](/tools/observability):

- Trace all LLM calls with token usage
- Monitor tool execution success/failure
- Track agent session performance
- Debug multi-turn conversations

---

## Next Steps

- **[Observability](/tools/observability)** — Langfuse integration for production
- **[Development Setup](/development/setup)** — Full dev environment
- **[Remote API](api)** — API endpoint debugging
