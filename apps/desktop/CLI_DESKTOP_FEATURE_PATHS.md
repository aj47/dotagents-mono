# CLI/Desktop Feature Paths

This file tracks the shared execution paths that keep desktop UI, headless CLI, and background entry points aligned.

## Shared agent runner

- Main runner: `apps/desktop/src/main/agent-mode-runner.ts`
- Fresh-prompt launcher: `startSharedPromptRun(...)`
- Conversation prep helper: `prepareConversationForPrompt(...)`
- Prompt/session bootstrap helpers: `preparePromptExecutionContext(...)` and `ensureAgentSessionForConversation(...)`
- Top-level execution helper: `runTopLevelAgentMode(...)`

## Shared prompt launcher

- Shared launcher file: `apps/desktop/src/main/agent-mode-runner.ts`
- Launcher helper: `startSharedPromptRun(...)`
- Prepared-context hook: `onPreparedContext(...)`
- Returned execution handle: `runPromise`

## Shared resume runner

- Shared resume file: `apps/desktop/src/main/agent-mode-runner.ts`
- Resume bootstrap helper: `prepareResumeExecutionContext(...)`
- Resume launcher helper: `startSharedResumeRun(...)`
- Prepared-context hook: `onPreparedContext(...)`
- Returned execution handle: `runPromise`

## Shared conversation history selection

- Shared selection file: `apps/desktop/src/main/conversation-history-selection.ts`
- Selection helper: `resolveConversationHistorySelection(...)`
- Current callers: `headless-cli.ts` `/use` and `/show`

## Shared prompt session bootstrap

- Shared bootstrap file: `apps/desktop/src/main/agent-mode-runner.ts`
- Session reuse helper: `ensureAgentSessionForConversation(...)`
- Prompt bootstrap helper: `preparePromptExecutionContext(...)`

## Shared startup runtime

- Main-process bootstrap helper: `apps/desktop/src/main/app-runtime.ts`
- Infrastructure helper: `registerSharedMainProcessInfrastructure(...)`
- Service startup helper: `initializeSharedRuntimeServices(...)`

## Shared headless runtime

- Headless bootstrap helper: `apps/desktop/src/main/headless-runtime.ts`
- Non-GUI startup helper: `startSharedHeadlessRuntime(...)`

## Shared remote access bootstrap

- Remote access bootstrap file: `apps/desktop/src/main/remote-access-runtime.ts`
- Shared helper: `startSharedRemoteAccessRuntime(...)`
- Remote server strategies: `"config"` for desktop startup and `"forced"` for `--headless` / `--qr`

## Shared configured remote access reconciliation

- Configured remote access file: `apps/desktop/src/main/remote-access-runtime.ts`
- Shared helper: `syncConfiguredRemoteAccess(...)`
- Desktop entry points: GUI startup and `tipc.ts saveConfig(...)`

## Shared non-GUI mode launcher

- Non-GUI launcher file: `apps/desktop/src/main/headless-runtime.ts`
- Mode launcher helper: `launchSharedHeadlessMode(...)`
- Signal registration helper: `registerSharedHeadlessTerminationHandlers(...)`

## Shared Cloudflare tunnel bootstrap

- Shared tunnel file: `apps/desktop/src/main/cloudflare-runtime.ts`
- Tunnel bootstrap helper: `startConfiguredCloudflareTunnel(...)`
- Activation modes: `"auto"` for config-driven startup and `"force"` for QR pairing

## Shared remote server QR printing

- Shared QR file: `apps/desktop/src/main/remote-server-qr.ts`
- Shared helper: `printSharedRemoteServerQrCode(...)`
- Current callers: `remote-server.ts` startup auto-print and `printQRCodeToTerminal(...)` for GUI/manual/QR-triggered printing

## Shared remote server URL rules

- Shared URL file: `apps/desktop/src/shared/remote-server-url.ts`
- Shared helpers: `buildRemoteServerBaseUrl(...)` and `resolveRemoteServerPairingPreview(...)`
- Current callers: `remote-server.ts` status/connectability resolution, `settings-remote-server.tsx` base URL preview and bind warnings, `remote-server-qr.ts` default bind/port fallback, and `headless-runtime.ts` forced LAN bind default

## Shared MCP server status classification

- Shared status file: `apps/desktop/src/shared/mcp-server-status.ts`
- Shared helpers: `resolveMcpServerRuntimeState(...)`, `countConnectedMcpServers(...)`, and `listMcpServerStatusSummaries(...)`
- Current callers: `headless-cli.ts` startup/status output, `remote-server.ts` `/v1/mcp/servers`, `settings-agents.tsx`, and `mcp-config-manager.tsx`

## Shared session history state

- Shared session file: `packages/shared/src/session.ts`
- Shared helpers: `orderItemsByPinnedFirst(...)`, `sanitizeConversationSessionState(...)`, `setConversationSessionStateMembership(...)`, `removeSessionIdFromConversationSessionState(...)`, `sanitizeSessionIdList(...)`, and `setSessionIdMembership(...)`
- Current callers: `headless-cli.ts` `/conversations`, `/pin`, and `/archive`; `conversation-management.ts`; `remote-server.ts` `/v1/settings` read/write payloads; `agent-store.ts`; `use-store-sync.ts`; `pinned-session-history.ts`; `sidebar-sessions.ts`; and mobile session-store sync/toggles

## Shared conversation management

- Shared management file: `apps/desktop/src/main/conversation-management.ts`
- Shared helpers: `renameConversationTitleAndSyncSession(...)`, `deleteConversationAndSyncSessionState(...)`, and `deleteAllConversationsAndSyncSessionState(...)`
- Current callers: `headless-cli.ts` `/rename`, `/delete`, and `/delete-all`; `tipc.ts` renderer rename/delete/delete-all actions; and `runtime-tools.ts` `set_session_title`

## Shared agent profile activation

- Shared activation file: `apps/desktop/src/main/agent-profile-activation.ts`
- Shared helpers: `buildConfigForActivatedProfile(...)`, `activateAgentProfile(...)`, and `activateAgentProfileById(...)`
- Current callers: `headless-cli.ts` `/agent`; `tipc.ts` `setCurrentProfile(...)` and `setCurrentAgentProfile(...)`; and `remote-server.ts` `POST /v1/profiles/current`

## Shared agent profile management

- Shared management file: `apps/desktop/src/main/agent-profile-management.ts`
- Shared helpers: `getManagedAgentProfiles(...)`, `getManagedAgentProfile(...)`, `resolveManagedAgentProfileSelection(...)`, `createManagedAgentProfile(...)`, `updateManagedAgentProfile(...)`, `toggleManagedAgentProfileEnabled(...)`, and `deleteManagedAgentProfile(...)`
- Current callers: `headless-cli.ts` `/agents`, `/agent-show`, `/agent-new`, `/agent-edit`, `/agent-toggle`, and `/agent-delete`; `tipc.ts` `getAgentProfiles(...)`, `createAgentProfile(...)`, `updateAgentProfile(...)`, and `deleteAgentProfile(...)`; and `remote-server.ts` `/v1/agent-profiles` list/detail/create/update/delete plus `/v1/agent-profiles/:id/toggle`

## Shared agent selector profiles

- Shared selector file: `packages/shared/src/agent-profiles.ts`
- Shared helpers: `getAgentProfileDisplayName(...)`, `getAgentProfileSummary(...)`, `getEnabledAgentProfiles(...)`, `sortAgentProfilesByPriority(...)`, `getDefaultAgentProfile(...)`, `resolveAgentProfileSelection(...)`, and `getAcpCapableAgentProfiles(...)`
- Current callers: `headless-cli.ts` `/agents` and `/agent`; `agent-selector.tsx`; `apply-selected-agent.ts`; mobile `agentSelectorOptions.ts` and `mainAgentOptions.ts`; and `main-agent-selection.ts`

## Shared agent profile management

- Shared management file: `apps/desktop/src/main/agent-profile-management.ts`
- Shared helpers: `getManagedAgentProfiles(...)`, `getManagedAgentProfile(...)`, `resolveManagedAgentProfileSelection(...)`, `createManagedAgentProfile(...)`, `updateManagedAgentProfile(...)`, `toggleManagedAgentProfileEnabled(...)`, and `deleteManagedAgentProfile(...)`
- Current callers: `headless-cli.ts` `/agent-profiles`, `/agent-show`, `/agent-new`, `/agent-edit`, `/agent-toggle`, and `/agent-delete`; `tipc.ts` profile list/detail/create/update/delete/by-role handlers; and `remote-server.ts` `/v1/agent-profiles`, `/v1/agent-profiles/:id`, `/v1/agent-profiles/:id/toggle`, `POST /v1/agent-profiles`, `PATCH /v1/agent-profiles/:id`, and `DELETE /v1/agent-profiles/:id`

## Shared ACP main-agent options

- Shared selector file: `packages/shared/src/agent-profiles.ts`
- Shared helper: `getSelectableMainAcpAgents(...)`
- Current callers: `main-agent-selection.ts`; renderer `settings-general-main-agent-options.ts` (used by `settings-general.tsx` and `settings-providers.tsx`); and mobile `mainAgentOptions.ts`

## Shared profile skill gating

- Shared selector file: `packages/shared/src/agent-profiles.ts`
- Shared helpers: `areAllSkillsEnabledForAgentProfile(...)`, `isSkillEnabledForAgentProfile(...)`, `getEnabledSkillIdsForAgentProfile(...)`, and `toggleSkillForAgentProfile(...)`
- Current callers: `agent-profile-service.ts`; `headless-cli.ts` `/skills` and `/skill`; renderer `settings-agents.tsx`; `agent-capabilities-sidebar.tsx`; and `remote-server.ts` `/v1/skills`

## Shared profile skill management

- Shared skill-management file: `apps/desktop/src/main/profile-skill-management.ts`
- Shared helpers: `getManagedSkillsCatalog(...)`, `getManagedCurrentProfileSkills(...)`, `toggleManagedSkillForCurrentProfile(...)`, and `toggleManagedSkillForProfile(...)`
- Current callers: `headless-cli.ts` `/skills` and `/skill`; `tipc.ts` `toggleProfileSkill(...)`; and `remote-server.ts` `/v1/skills` plus `/v1/skills/:id/toggle-profile`

## Shared skill catalog management

- Shared skill-catalog file: `apps/desktop/src/main/skill-management.ts`
- Shared helpers: `getManagedSkillsCatalog(...)`, `getManagedSkill(...)`, `resolveManagedSkillSelection(...)`, `createManagedSkill(...)`, `updateManagedSkill(...)`, `deleteManagedSkill(...)`, `deleteManagedSkills(...)`, `cleanupManagedStaleSkillReferences(...)`, `importManagedSkillFromMarkdown(...)`, `importManagedSkillFromFile(...)`, `importManagedSkillFromFolder(...)`, `importManagedSkillsFromParentFolder(...)`, `exportManagedSkillToMarkdown(...)`, `getManagedSkillCanonicalFilePath(...)`, `ensureManagedSkillFile(...)`, `scanManagedSkillsFolder(...)`, and `importManagedSkillFromGitHub(...)`
- Current callers: `headless-cli.ts` skill catalog commands; `profile-skill-management.ts` sorted catalog access; and `tipc.ts` skill CRUD/import/export/open-file/cleanup handlers used by `settings-skills.tsx`

## Shared agent catalog summaries

- Shared selector file: `packages/shared/src/agent-profiles.ts`
- Shared helpers: `getAgentProfileCatalogDescription(...)`, `getAgentProfileCatalogSummaryItems(...)`, and `getAgentProfileStatusLabels(...)`
- Current callers: `headless-cli.ts` `/agents`; renderer `settings-agents.tsx`

## Shared chat model selection

- Shared provider/model file: `packages/shared/src/providers.ts`
- Shared helpers: `resolveChatModelSelection(...)`, `resolveChatModelDisplayInfo(...)`, and `resolveChatProviderId(...)`
- Current callers: `ai-sdk-provider.ts` runtime model creation, `llm.ts` progress metadata, `context-budget.ts` summarization/context-window budgeting, `remote-server.ts` response/model metadata, `mcp-sampling.ts` default sampling model reporting, `headless-cli.ts` status output, and `settings-models.tsx` provider/model defaults

## Shared speech provider defaults

- Shared STT file: `packages/shared/src/stt-models.ts`
- Shared TTS file: `packages/shared/src/providers.ts`
- Shared helpers: `resolveSttProviderId(...)`, `resolveSttModelSelection(...)`, `resolveTtsProviderId(...)`, and `resolveTtsSelection(...)`
- Current callers: `tipc.ts` cloud transcription + TTS runtime defaults, `tts-llm-preprocessing.ts` transcript-provider fallback, `remote-server.ts` settings payload defaults, `settings-models.tsx` speech model/voice controls, `settings-providers.tsx` provider badges + local voice panels, `settings-general.tsx` STT language controls, and `onboarding.tsx` provider checks

## Shared OpenAI-compatible preset resolution

- Shared preset file: `packages/shared/src/providers.ts`
- Shared helpers: `resolveModelPresetId(...)`, `resolveModelPresets(...)`, and `resolveModelPreset(...)`
- Current callers: `resolveChatModelDisplayInfo(...)` for CLI/progress labels, `remote-server.ts` preset payload + validation, `summarization-service.ts` weak-model preset lookup, `settings-models.tsx` preset selection UI, `model-preset-manager.tsx` preset editor state, and `model-selector.tsx` preset-scoped model fetches

## Shared repeat task summaries

- Shared loop summary file: `apps/desktop/src/main/loop-summaries.ts`
- Shared helpers: `summarizeLoop(...)` and `summarizeLoops(...)`
- Current callers: `tipc.ts` `getLoopSummaries(...)`, `settings-loops.tsx`, and `remote-server.ts` `/v1/loops` plus repeat-task create/update responses

## Shared repeat task management

- Shared loop management file: `apps/desktop/src/main/loop-management.ts`
- Shared helpers: `getManagedLoopSummary(...)`, `getManagedLoopSummaries(...)`, `resolveManagedLoopSelection(...)`, `saveManagedLoop(...)`, `createManagedLoop(...)`, `updateManagedLoop(...)`, `toggleManagedLoopEnabled(...)`, `triggerManagedLoop(...)`, and `deleteManagedLoop(...)`
- Current callers: `headless-cli.ts` `/loops`, `/loop-show`, `/loop-new`, `/loop-edit`, `/loop-toggle`, `/loop-run`, and `/loop-delete`; `tipc.ts` `getLoopSummaries(...)` plus `saveLoop(...)`, `deleteLoop(...)`, and `triggerLoop(...)`; and `remote-server.ts` `/v1/loops`, `/v1/loops/:id/toggle`, `/v1/loops/:id/run`, plus repeat-task create/update/delete responses

## Shared MCP server management

- Shared MCP management file: `apps/desktop/src/main/mcp-management.ts`
- Shared helpers: `getManagedMcpServerSummaries(...)`, `getManagedMcpServerSummary(...)`, `resolveManagedMcpServerSelection(...)`, `setManagedMcpServerRuntimeEnabled(...)`, `restartManagedMcpServer(...)`, `stopManagedMcpServer(...)`, and `getManagedMcpServerLogs(...)`
- Current callers: `headless-cli.ts` `/mcp`, `/mcp-show`, `/mcp-enable`, `/mcp-disable`, `/mcp-restart`, `/mcp-stop`, and `/mcp-logs`; `tipc.ts` `setMcpServerRuntimeEnabled(...)`, `restartMcpServer(...)`, `stopMcpServer(...)`, and `getMcpServerLogs(...)`; and `remote-server.ts` `/v1/mcp/servers` plus `/v1/mcp/servers/:name/toggle`

## Shared knowledge note management

- Shared knowledge-note file: `apps/desktop/src/main/knowledge-note-management.ts`
- Shared helpers: `getManagedKnowledgeNotes(...)`, `getManagedKnowledgeNote(...)`, `searchManagedKnowledgeNotes(...)`, `saveManagedKnowledgeNoteFromSummary(...)`, `saveManagedKnowledgeNote(...)`, `createManagedKnowledgeNote(...)`, `updateManagedKnowledgeNote(...)`, `deleteManagedKnowledgeNote(...)`, `deleteMultipleManagedKnowledgeNotes(...)`, and `deleteAllManagedKnowledgeNotes(...)`
- Current callers: `headless-cli.ts` `/notes`, `/note-show`, `/note-search`, `/note-new`, `/note-edit`, `/note-delete`, and `/note-delete-all`; `tipc.ts` knowledge-note list/search/save/update/delete handlers; renderer `knowledge.tsx` plus `agent-summary-view.tsx`; and `remote-server.ts` `/v1/knowledge/notes` CRUD routes

## Shared conversation history serialization

- Shared conversation history file: `packages/shared/src/conversation-history.ts`
- Shared helpers: `formatConversationHistoryMessages(...)`, `formatConversationToolCalls(...)`, and `formatConversationToolResults(...)`
- Current callers: `llm.ts` incremental tool-result persistence, weak step summarization inputs, and progress `conversationHistory`, plus `remote-server.ts` chat/conversation API payloads

## Shared runtime shutdown

- Shared shutdown file: `apps/desktop/src/main/app-runtime.ts`
- Shared teardown helper: `shutdownSharedRuntimeServices(...)`
- Optional mode-specific hooks: `keyboardCleanup` and `cleanupTimeoutMs`

## Feature path matrix

1. Desktop text input
   `tipc.ts` queues follow-ups for active sessions when needed; otherwise `startDesktopPromptRun(...)` calls `startSharedPromptRun(...)` so the desktop text prompt creates/appends the user turn and reuses the same launcher/bootstrap as headless, remote, and loops before the returned `runPromise` enters `runTopLevelAgentMode(...)`.
2. Desktop voice MCP mode
   `tipc.ts` resolves the transcribing session through `ensureAgentSessionForConversation(...)`, emits transcription progress on that session, then `startDesktopPromptRun(...)` calls `startSharedPromptRun(...)` after transcription so the persisted user turn and runtime session handoff follow the same shared launcher/bootstrap rules.
3. Headless CLI prompt
   `headless-cli.ts` calls `startSharedPromptRun(...)`, registers a terminal approval handler in `onPreparedContext(...)`, then awaits the returned `runPromise`.
4. Remote server prompt
   `remote-server.ts` calls the same `startSharedPromptRun(...)`, keeps its dialog-based approval policy, preserves the snooze state of any already-active watched session when it reuses one, and awaits the returned `runPromise`.
5. Repeat tasks / loops
   `loop-service.ts` calls `startSharedPromptRun(...)` with the repeat-task session title and loop-specific `maxIterationsOverride`, then awaits the returned `runPromise`.
6. Queued desktop follow-ups / ACP parent resume
   `tipc.ts` now calls `startDesktopResumeRun(...)`, which wraps `startSharedResumeRun(...)`, so queued follow-ups revive candidate session IDs and reload prior history through the same shared resume bootstrap before `runPromise` enters `runTopLevelAgentMode(...)`; `acp/acp-background-notifier.ts` reuses the same path through `runAgentLoopSession(...)`, while both entry points still avoid appending persisted or synthetic turns.
7. Desktop GUI startup
   `index.ts` calls `registerSharedMainProcessInfrastructure(...)`, creates windows/tray, then starts MCP, loops, ACP sync, bundled skills, and models.dev via `initializeSharedRuntimeServices(...)` before its GUI-only window/tray behavior diverges.
8. Headless CLI startup
   `index.ts --headless` calls `launchSharedHeadlessMode(...)`, which wraps `startSharedHeadlessRuntime(...)`, shared non-GUI startup failure handling, and shared termination wiring before starting `headless-cli.ts`; that launcher intentionally only claims `SIGTERM`, so the terminal REPL keeps owning `SIGINT` / Ctrl+C for stop-or-exit behavior while still reusing the shared remote-access bootstrap with the forced `0.0.0.0` bind and config-driven Cloudflare tunnel activation.
9. QR headless pairing startup
   `index.ts --qr` calls `launchSharedHeadlessMode(...)`, which wraps `startSharedHeadlessRuntime(...)`, shared `SIGINT`/`SIGTERM` ownership, and shared non-GUI startup failure handling before forcing the same shared remote-access bootstrap to start the remote server, prefer the configured named tunnel, fall back to quick tunnel when needed, and hand the resulting URL to `printQRCodeToTerminal(...)` without creating windows.
10. Desktop remote access startup
    `index.ts` now calls `syncConfiguredRemoteAccess(...)`, which reuses `startSharedRemoteAccessRuntime({ remoteServerStrategy: "config", cloudflareTunnelActivation: "auto" })` for GUI startup so desktop remote-server startup and Cloudflare auto-start follow the same remote/tunnel bootstrap helper that headless and QR modes use.
11. Desktop remote access reconfiguration
    `tipc.ts saveConfig(...)` now also calls `syncConfiguredRemoteAccess(...)`, so enabling, disabling, and restarting desktop remote access after settings changes shares the same config-driven remote/tunnel reconciliation path as startup, including Cloudflare auto-start and teardown decisions.
12. Desktop GUI shutdown
    `index.ts` still handles window/tray bookkeeping locally, then calls `shutdownSharedRuntimeServices(...)` from `before-quit` so keyboard teardown, loop shutdown, ACP cleanup, MCP cleanup, and remote-server shutdown follow one shared runtime path with the same timeout policy every time the desktop app exits.
13. Headless non-GUI shutdown
    `headless-runtime.ts` logs the mode-specific shutdown banner, then calls `shutdownSharedRuntimeServices(...)` before `process.exit(...)` so `--headless` and `--qr` tear down loops, ACP, MCP, and the remote server through the same helper the GUI uses.
14. Headless CLI conversation resume selection
    `headless-cli.ts` now resolves `/use` and `/show` targets through `resolveConversationHistorySelection(...)`, so selecting a prior conversation by full ID or unique prefix goes through one shared lookup path before the next CLI prompt reuses `startSharedPromptRun(...)` with that conversation ID.
15. Headless CLI session pin/archive controls
    `headless-cli.ts` now resolves `/pin [id]` and `/archive [id]` targets through the same conversation-selection path, reorders `/conversations` through `orderItemsByPinnedFirst(...)`, and normalizes/persists `pinnedSessionIds` / `archivedSessionIds` through `sanitizeConversationSessionState(...)` plus `setConversationSessionStateMembership(...)`, so terminal session-state controls stay aligned with desktop config hydration, remote settings writes, renderer pinned ordering, and mobile sync.
16. Desktop/manual remote server QR print
    `tipc.ts printRemoteServerQRCode` calls `printQRCodeToTerminal(...)`, which now delegates to `printSharedRemoteServerQrCode(...)` so manual terminal QR output shares the same server/api-key guards and URL normalization path as startup auto-print and `--qr`.
17. Remote server startup QR auto-print
    `remote-server.ts startRemoteServerInternal(...)` now also calls `printSharedRemoteServerQrCode(...)` in `auto` mode, so headless auto-print and the desktop "Terminal QR Code" setting share one enablement, streamer-mode, and LAN URL-resolution path before printing.
18. Desktop remote settings pairing preview
    `settings-remote-server.tsx` now calls `resolveRemoteServerPairingPreview(...)`, so the settings page base URL preview plus wildcard/loopback warnings use the same bind classification and default URL builder that the main-process remote server status path uses.
19. Remote server status + headless pairing defaults
    `remote-server.ts` now builds runtime status URLs through `buildRemoteServerBaseUrl(...)`, while `remote-server-qr.ts` and `headless-runtime.ts` reuse the same shared bind/port constants, so desktop pairing previews, remote status payloads, QR fallback URLs, and headless defaults stay aligned.
20. Shared active model selection
    `packages/shared/src/providers.ts` now resolves the effective chat provider/model once, so runtime model creation, desktop progress metadata, context budgeting, remote API model payloads, MCP sampling defaults, headless CLI status output, and the renderer model settings page all use the same provider fallback, STT-model sanitization, and OpenAI-compatible provider label rules.
21. Desktop speech settings + onboarding
    `settings-models.tsx`, `settings-providers.tsx`, `settings-general.tsx`, and `onboarding.tsx` now all resolve STT/TTS provider IDs plus default model/voice values through the shared speech helpers, so provider badges, STT language controls, onboarding checks, and model/voice pickers stay aligned with runtime defaults.
22. Runtime speech generation + remote settings payload
    `tipc.ts`, `tts-llm-preprocessing.ts`, and `remote-server.ts` now all use the same shared speech selectors, so cloud transcription models, TTS model/voice defaults, transcript-provider fallbacks, and `/v1/settings` payload defaults stay aligned across desktop runtime, headless CLI, and remote clients.
23. CLI/desktop MCP server status surfaces
    `headless-cli.ts` startup/status output, `remote-server.ts` `/v1/mcp/servers`, `settings-agents.tsx`, and `mcp-config-manager.tsx` now classify each MCP server through `resolveMcpServerRuntimeState(...)` and `listMcpServerStatusSummaries(...)`, so config-disabled vs runtime-stopped vs connected/error/disconnected states stay aligned across the terminal, desktop UI, and remote API.
24. Preset-aware CLI labels + preset surfaces
    `packages/shared/src/providers.ts` now resolves merged OpenAI-compatible preset IDs and records in one place, so CLI/provider labels, remote `/v1/settings` preset payloads, weak summarization preset lookup, preset editor screens, and preset-scoped model fetches all use the same built-in override, duplicate-filtering, legacy OpenAI-key fallback, and default preset ID rules.
25. Desktop repeat task settings + remote loop API
    `settings-loops.tsx` now queries `tipc.ts getLoopSummaries(...)`, while `tipc.ts` and `remote-server.ts` both route those summary payloads through `getManagedLoopSummaries(...)`, so profile names and runtime last-run/next-run/is-running fields are merged in one main-process path before either the desktop UI or remote clients render them.
26. Desktop progress history + remote API conversation payloads
    `packages/shared/src/conversation-history.ts` now flattens tool calls and tool results into shared `ConversationHistoryMessage` / `ToolResult` shapes, so `llm.ts` incremental persistence, weak step summaries, and progress history payloads serialize the same way that `remote-server.ts` now serializes chat/conversation API history for mobile and other remote clients.
27. Headless CLI conversation management
    `headless-cli.ts` now routes `/rename`, `/delete [id]`, and `/delete-all` through `conversation-management.ts`, so terminal conversation edits/deletes reuse the same title normalization, tracked-session title sync, and pinned/archived cleanup path that the desktop app already uses.
28. Desktop history management + runtime session-title sync
    `tipc.ts` now routes renderer rename/delete/delete-all actions through `conversation-management.ts`, while `runtime-tools.ts` `set_session_title` reuses the same rename helper, so desktop history actions and agent-driven title changes converge on one main-process path for session-title synchronization and session-state cleanup.
29. Headless CLI agent selection
    `headless-cli.ts` now routes `/agent <agent-id-or-name>` through `activateAgentProfile(...)`, so terminal agent switching reuses the same current-profile persistence, per-profile model/STT/TTS settings application, and MCP runtime tool/server activation that desktop and remote/mobile switches use.
30. Headless CLI agent profile management
    `headless-cli.ts` now routes `/agents`, `/agent-show <agent-id-or-name>`, `/agent-new <json>`, `/agent-edit <agent-id-or-name> <json>`, `/agent-toggle <agent-id-or-name>`, and `/agent-delete <agent-id-or-name>` through `agent-profile-management.ts`, while `tipc.ts` and `remote-server.ts` reuse the same profile list/detail/create/update/delete/toggle helpers, so terminal agent catalog browsing, selection by ID/display-name prefix, payload validation, built-in-safe remote edits, and current-profile fallback after deletes stay aligned with the desktop Agents settings screen and remote agent-profile API.
31. Desktop agent selection + remote/mobile profile switching
    `tipc.ts` `setCurrentProfile(...)` and `setCurrentAgentProfile(...)` plus `remote-server.ts` `POST /v1/profiles/current` now route through `activateAgentProfile(...)` / `activateAgentProfileById(...)`, so desktop agent selection, legacy profile switches, and remote/mobile profile switches all reapply the same model/transcript/TTS settings plus MCP runtime config.
32. Headless CLI and desktop agent picker
    `packages/shared/src/agent-profiles.ts` now resolves enabled-agent filtering, default-agent fallback, display-name/summary fallback, ACP-capable profile filtering, and `/agent` id-or-name matching in one place, so headless `/agent`, the desktop agent selector plus `apply-selected-agent.ts`, mobile selector lists, and ACP main-agent selection all reuse the same profile readiness plus ID/display-name/unique-prefix matching rules before activation or fallback selection happens.
33. Desktop and mobile ACP main-agent pickers
    `packages/shared/src/agent-profiles.ts` now also merges ACP-capable profile agents and legacy stdio ACP entries through `getSelectableMainAcpAgents(...)`, so desktop settings main-agent dropdowns, mobile ACP selector sheets, and main-process ACP main-agent validation all expose the same deduped agent names and display names before selection resolution or settings writes happen.
34. Headless and desktop agent catalog summaries
    `packages/shared/src/agent-profiles.ts` now also resolves agent catalog descriptions, capability summary items, and status badges, so headless `/agents` output and the desktop Settings > Agents catalog both fall back from description to guidelines the same way, list the same connection/provider/server/skill/property metadata, and label built-in/default/current/disabled states from one shared helper path.
35. Headless CLI repeat-task controls
    `headless-cli.ts` now routes `/loops`, `/loop-show`, `/loop-new`, `/loop-edit`, `/loop-toggle`, `/loop-run`, and `/loop-delete` through `loop-management.ts`, while `tipc.ts getLoopSummaries(...)` plus save/delete/trigger handlers and `remote-server.ts` repeat-task endpoints reuse the same summary/runtime helpers, so repeat-task selection by ID or name, JSON payload validation, live status rendering, enable/disable persistence, create/update/delete behavior, and manual run behavior stay aligned across terminal, desktop settings, and remote/mobile.
36. Headless CLI skill toggles
    `headless-cli.ts` `/skills` and `/skill <id>`, `remote-server.ts` `/v1/skills` and `/v1/skills/:id/toggle-profile`, and `tipc.ts` `toggleProfileSkill(...)` now route through `profile-skill-management.ts`, so current-profile lookup, skill sorting, missing-skill/profile handling, and per-profile toggle responses stay aligned across terminal, desktop, and remote clients before each surface formats its own output.
37. Desktop/mobile per-profile skill enablement
    `packages/shared/src/agent-profiles.ts` now also resolves effective enabled skill IDs plus toggle transitions in one place, so `settings-agents.tsx`, `agent-capabilities-sidebar.tsx`, `agent-profile-service.ts`, and `remote-server.ts` `/v1/skills` all agree on which skills are enabled for the current profile and when a profile should collapse back to the default “all skills enabled” state.
38. Headless CLI skill catalog controls
    `headless-cli.ts` now routes `/skill-show <skill-id-or-name>`, `/skill-new <json>`, `/skill-edit <skill-id-or-name> <json>`, `/skill-delete <skill-id-or-name>`, `/skill-export <skill-id-or-name>`, `/skill-path <skill-id-or-name>`, `/skill-import-file <path>`, `/skill-import-folder <path>`, `/skill-import-parent <path>`, `/skill-import-github <owner/repo[/path]>`, `/skill-scan`, and `/skill-cleanup` through `skill-management.ts`, so terminal skill selection by ID/name/unique prefix, JSON validation, markdown export, canonical file-path lookup, file/folder/GitHub imports, and stale-reference cleanup all share one catalog-management path before output is rendered in the REPL.
39. Desktop skill settings + CLI skill catalog controls
    `settings-skills.tsx` still calls `tipc.ts`, but those main-process handlers now route through `skill-management.ts`, while `profile-skill-management.ts` reuses the same sorted catalog helper and `tipc.ts openSkillFile(...)` reuses the same canonical file bootstrap helper, so desktop skill create/update/delete/import/export/open-file actions and the headless CLI skill catalog commands now mutate, export, reveal, and clean up the same underlying skill catalog through one main-process path.
40. Headless CLI MCP server controls
    `headless-cli.ts` now routes `/mcp`, `/mcp-show`, `/mcp-enable`, `/mcp-disable`, `/mcp-restart`, `/mcp-stop`, and `/mcp-logs` through `mcp-management.ts`, while `tipc.ts` reuses the same runtime-enable, restart, stop, and log helpers for the desktop capabilities UI and `remote-server.ts` reuses the same list/toggle helpers for `/v1/mcp/servers`, so MCP server selection by exact name or unique prefix plus runtime enablement, restart/stop lifecycle actions, and recent log lookup stay aligned across terminal, desktop UI, and remote clients.
41. Headless CLI knowledge note controls
    `headless-cli.ts` now routes `/notes`, `/note-show`, `/note-search`, `/note-new`, `/note-edit`, `/note-delete`, and `/note-delete-all` through `knowledge-note-management.ts`, so terminal note listing, search, CRUD validation, and delete-all behavior stay aligned with the same note helpers the desktop knowledge workspace and remote API use.
42. Desktop knowledge workspace + CLI note controls
    `knowledge.tsx` continues to use `tipc.ts` knowledge-note handlers, but those handlers now route through `knowledge-note-management.ts`, while `agent-summary-view.tsx` reuses the same summary-save helper and `remote-server.ts` reuses the same CRUD helpers for `/v1/knowledge/notes`, so desktop note browsing/search/edit/delete, CLI note commands, summary-driven saves, and remote note CRUD all normalize and persist notes through one main-process path.
43. Headless CLI agent profile management
    `headless-cli.ts` now routes `/agent-profiles`, `/agent-show`, `/agent-new`, `/agent-edit`, `/agent-toggle`, and `/agent-delete` through `agent-profile-management.ts`, while `tipc.ts` profile list/detail/create/update/delete/by-role handlers and `remote-server.ts` `/v1/agent-profiles*` routes reuse the same helper for profile selection, create/update validation, connection sanitization, enable/disable toggles, and delete protections before CLI, desktop settings, or remote/mobile clients format their own responses.

## Parity rules

- ACP routing is decided in one place: `runTopLevelAgentMode(...)`.
- Standard MCP approval flow is inline when the caller requests `approvalMode: "inline"`.
- Fresh persisted prompt entrypoints share one launcher: `startSharedPromptRun(...)`.
- Resume-only entrypoints share one launcher: `startSharedResumeRun(...)`.
- CLI conversation selection is decided in one place: `resolveConversationHistorySelection(...)`.
- Conversation/session bootstrap is decided in one place: `preparePromptExecutionContext(...)` and `ensureAgentSessionForConversation(...)`.
- Queued follow-ups and ACP parent-resume nudges intentionally bypass `preparePromptExecutionContext(...)` and reuse `prepareResumeExecutionContext(...)` / `startSharedResumeRun(...)` so they do not duplicate persisted user turns while still sharing session revival and history loading.
- Reused sessions are refreshed in one place: `ensureAgentSessionForConversation(...)` now updates revived session metadata so temporary desktop transcription sessions and resumed prompts converge on the same runtime state.
- Remote server prompt reuse now also preserves the snooze state of already-active watched sessions through `ensureAgentSessionForConversation(...)`, so background/mobile follow-ups do not unexpectedly hide a session the desktop user is already watching.
- CLI parity comes from `toolApprovalManager.registerSessionApprovalHandler(...)`, which the shared launcher now wires up via `onPreparedContext(...)` before the run starts so terminal sessions resolve the same approval requests that the desktop UI uses.
- Remote server currently keeps `approvalMode: "dialog"` to preserve its existing approval behavior.
- Legacy runtime flags stay session-manager-owned: prompt entrypoints do not reset `state.isAgentModeActive`, `state.shouldStopAgent`, or `state.agentIterationCount` directly, so overlapping desktop, CLI, remote, and loop sessions do not clobber each other.
- GUI and headless startup now share the same MCP/loop/ACP/skills/models initialization path through `initializeSharedRuntimeServices(...)`.
- Remote server startup is now decided in one place: `startSharedRemoteAccessRuntime(...)`, so desktop remote access, headless CLI, and QR pairing all share the same remote/tunnel bootstrap before they diverge into GUI, terminal, or pairing behavior.
- Desktop startup and desktop settings reconfiguration now share the same config-driven remote-access reconciler: `syncConfiguredRemoteAccess(...)`, so runtime enable/disable/restart plus Cloudflare auto-start stay aligned with startup behavior.
- `--headless` and `--qr` now also share the same top-level non-GUI launcher through `launchSharedHeadlessMode(...)`, so startup failures and signal registration are decided in one place.
- Headless CLI intentionally narrows that shared launcher to `SIGTERM` so `headless-cli.ts` keeps owning terminal `SIGINT` / Ctrl+C behavior for stop-or-exit parity instead of racing a global shutdown handler.
- Cloudflare tunnel startup is decided in one place: `startConfiguredCloudflareTunnel(...)`, so desktop auto-start, headless CLI auto-start, and QR pairing all converge on the same named-vs-quick tunnel logic.
- Remote server QR printing is decided in one place: `printSharedRemoteServerQrCode(...)`, so startup auto-print, manual terminal QR printing, and QR-mode override URLs all share the same guard and URL-resolution rules before printing.
- Remote server pairing URL/connectability rules are decided in one place: `apps/desktop/src/shared/remote-server-url.ts`, so desktop settings previews, main-process status payloads, QR defaults, and headless bind defaults stay aligned.
- MCP server runtime state is decided in one place: `apps/desktop/src/shared/mcp-server-status.ts`, so CLI status output, desktop capability screens, and remote API status payloads all distinguish disabled vs stopped vs connected/error/disconnected the same way.
- Session-history pin/archive state is decided in one place: `orderItemsByPinnedFirst(...)`, `sanitizeConversationSessionState(...)`, `setConversationSessionStateMembership(...)`, `removeSessionIdFromConversationSessionState(...)`, `sanitizeSessionIdList(...)`, and `setSessionIdMembership(...)`, so headless CLI session controls, desktop session ordering/state, renderer config hydration, remote settings payloads, and mobile sync/toggles all treat pinned/archived conversation IDs the same way.
- Conversation rename/delete flows are decided in one place: `conversation-management.ts`, so CLI session management, desktop history actions, and runtime `set_session_title` updates all reuse the same title-sync and pinned/archived cleanup path.
- Agent profile activation is decided in one place: `buildConfigForActivatedProfile(...)`, `activateAgentProfile(...)`, and `activateAgentProfileById(...)`, so headless CLI agent switching, desktop agent selection, and remote/mobile profile switches all reuse the same current-profile persistence, model override application, and MCP runtime config path.
- Agent selector profile readiness is decided in one place: `getAgentProfileDisplayName(...)`, `getAgentProfileSummary(...)`, `getEnabledAgentProfiles(...)`, `sortAgentProfilesByPriority(...)`, `getDefaultAgentProfile(...)`, `resolveAgentProfileSelection(...)`, and `getAcpCapableAgentProfiles(...)`, so headless CLI `/agents` and `/agent`, desktop selector/apply-selected-agent flows, mobile selector lists, ACP-capable profile filtering, and ACP main-agent config matching all stay aligned before activation.
- Agent profile list/detail/CRUD/toggle behavior is decided in one place: `getManagedAgentProfiles(...)`, `getManagedAgentProfile(...)`, `resolveManagedAgentProfileSelection(...)`, `createManagedAgentProfile(...)`, `updateManagedAgentProfile(...)`, `toggleManagedAgentProfileEnabled(...)`, and `deleteManagedAgentProfile(...)`, so headless CLI agent-management commands, desktop settings TIPC handlers, and remote `/v1/agent-profiles` routes all reuse the same validation, connection sanitization, toggle, and delete-protection rules before presentation diverges.
- ACP main-agent option lists are decided in one place: `getSelectableMainAcpAgents(...)`, so desktop settings main-agent dropdowns, mobile ACP selectors, and main-process ACP main-agent validation all dedupe profile and legacy stdio agent names the same way before selection or fallback repair happens.
- Profile skill enablement is decided in one place: `areAllSkillsEnabledForAgentProfile(...)`, `isSkillEnabledForAgentProfile(...)`, `getEnabledSkillIdsForAgentProfile(...)`, and `toggleSkillForAgentProfile(...)`, so headless CLI `/skills` and `/skill`, desktop agent skill editors, `agent-profile-service.ts`, and remote/mobile `/v1/skills` payloads all interpret default-vs-opt-in skill access the same way.
- Agent catalog descriptions, metadata chips, and status badges are decided in one place: `getAgentProfileCatalogDescription(...)`, `getAgentProfileCatalogSummaryItems(...)`, and `getAgentProfileStatusLabels(...)`, so headless `/agents` and the desktop Settings > Agents catalog render the same fallback description and capability summary fields before presentation diverges into terminal lines or cards.
- Repeat task summaries and runtime actions are decided in one place: `getManagedLoopSummary(...)`, `getManagedLoopSummaries(...)`, `saveManagedLoop(...)`, `createManagedLoop(...)`, `updateManagedLoop(...)`, `toggleManagedLoopEnabled(...)`, `triggerManagedLoop(...)`, and `deleteManagedLoop(...)`, so headless CLI repeat-task controls, desktop loop summaries, TIPC repeat-task mutations, and remote repeat-task endpoints all reuse the same profile-name enrichment plus create/update/delete/start/stop/trigger behavior before the UI or API response diverges.
- MCP server selection, summaries, runtime toggles, restart/stop lifecycle actions, and log lookup are decided in one place: `getManagedMcpServerSummaries(...)`, `getManagedMcpServerSummary(...)`, `resolveManagedMcpServerSelection(...)`, `setManagedMcpServerRuntimeEnabled(...)`, `restartManagedMcpServer(...)`, `stopManagedMcpServer(...)`, and `getManagedMcpServerLogs(...)`, so headless CLI MCP controls, the desktop capabilities UI, and the remote MCP status/toggle routes all reuse the same main-process behavior before presentation diverges into terminal output, TIPC responses, or HTTP payloads.
- Active chat provider/model resolution is decided in one place: `resolveChatModelSelection(...)` and `resolveChatModelDisplayInfo(...)`, so CLI status, desktop progress metadata, renderer model defaults, remote API model payloads, and AI SDK runtime model selection stay aligned.
- STT provider/model defaults are decided in one place: `resolveSttProviderId(...)` and `resolveSttModelSelection(...)`, so onboarding, desktop speech settings, remote settings payloads, and cloud transcription runtime calls stay aligned.
- TTS provider/model/voice defaults are decided in one place: `resolveTtsProviderId(...)` and `resolveTtsSelection(...)`, so renderer speech settings, runtime synthesis paths, provider badges, local voice panels, and remote settings payloads stay aligned.
- OpenAI-compatible preset IDs and merged preset records are decided in one place: `resolveModelPresetId(...)`, `resolveModelPresets(...)`, and `resolveModelPreset(...)`, so CLI labels, preset editors, preset-scoped model fetching, weak summarization preset lookup, and remote settings payloads stay aligned.
- Repeat task summaries are decided in one place: `summarizeLoop(...)` and `summarizeLoops(...)`, so the desktop repeat-task page and remote loop API merge persisted loop config, runtime status, and profile display names the same way.
- Conversation-history serialization is decided in one place: `formatConversationHistoryMessages(...)`, `formatConversationToolCalls(...)`, and `formatConversationToolResults(...)`, so persisted tool results, progress payloads, weak step summaries, and remote API conversation history all flatten tool activity the same way.
- `--headless` and `--qr` now share the same non-GUI bootstrap, including the forced external remote-server bind on `0.0.0.0`, before diverging into either the terminal REPL or QR pairing flow.
- Runtime teardown is decided in one place: `shutdownSharedRuntimeServices(...)`, so GUI quit and non-GUI graceful shutdown both stop loops and clean up ACP, MCP, and remote-server state through the same helper.

## Verification targets

- `packages/core/src/state.test.ts`
  Confirms session-scoped approval handlers auto-resolve requests and are cleaned up with the session.
- `apps/desktop/src/main/agent-mode-runner.test.ts`
  Confirms prompt bootstrap, resume bootstrap, inline approval behavior, and ACP routing.
- `apps/desktop/src/main/conversation-history-selection.test.ts`
  Confirms CLI conversation selection resolves exact IDs, unique prefixes, and ambiguity through one shared helper.
- `apps/desktop/src/main/cli-desktop-feature-paths.test.ts`
  Confirms fresh desktop UI, queued desktop follow-ups, headless CLI, remote server, loop, GUI startup, headless startup, QR startup, headless CLI conversation selection, headless CLI session-state controls, headless CLI skill toggles, headless CLI knowledge-note controls, and ACP parent-resume paths still point at the intended shared helpers.
- `apps/desktop/src/main/remote-server.routes.test.ts`
  Confirms the remote server keeps using the shared prompt runner, routes knowledge-note CRUD through the shared note helper, does not reintroduce ad hoc legacy runtime flag resets, and sanitizes session-state payloads through the shared session helpers.
- `apps/desktop/src/main/knowledge-note-management.test.ts`
  Confirms shared knowledge-note listing/search, summary-save behavior, CRUD validation, and delete failure handling stay aligned for CLI, desktop, and remote callers.
- `apps/desktop/src/main/remote-server-qr.test.ts`
  Confirms startup auto-print, manual terminal QR printing, streamer-mode suppression, and QR-mode override URLs all converge on the shared remote-server QR helper.
- `apps/desktop/src/shared/remote-server-url.test.ts`
  Confirms loopback/wildcard host classification, IPv6 URL formatting, and desktop pairing preview warnings/base URLs stay aligned across renderer and main-process callers.
- `apps/desktop/src/shared/mcp-server-status.test.ts`
  Confirms shared MCP server runtime classification and connected-server counts stay aligned for CLI, desktop UI, and remote API callers.
- `packages/shared/src/providers.test.ts`
  Confirms shared chat provider/model resolution, merged OpenAI-compatible preset resolution, TTS provider/model/voice defaults, STT-only model sanitization, explicit provider overrides, and OpenAI-compatible provider labels stay aligned for CLI, renderer, and main-process callers.
- `packages/shared/src/session.test.ts`
  Confirms shared pinned-first ordering plus session-state normalization/membership helpers stay aligned for CLI session controls, desktop session ordering/config hydration, remote settings payloads, and mobile sync.
- `apps/desktop/src/main/conversation-management.test.ts`
  Confirms shared rename/delete/delete-all helpers synchronize tracked session titles and prune pinned/archived state for CLI, desktop, and runtime-tool callers.
- `apps/desktop/src/main/agent-profile-management.test.ts`
  Confirms shared agent-profile ordering, selection, create/update validation, built-in update restrictions, enable/disable toggles, and current-profile fallback after deletes stay aligned for CLI, desktop, and remote callers.
- `apps/desktop/src/main/agent-profile-activation.test.ts`
  Confirms shared profile activation records the current profile ID and reapplies defined model overrides without clobbering unrelated runtime settings for CLI, desktop, and remote/mobile callers.
- `apps/desktop/src/main/agent-profile-management.test.ts`
  Confirms shared profile listing, selection, create/update validation, connection sanitization, enable/disable toggles, and delete protections stay aligned for headless CLI, desktop settings handlers, and remote API callers.
- `packages/shared/src/agent-profiles.test.ts`
  Confirms shared enabled/default agent selection, display-name/summary fallback, ACP-capable filtering, CLI selector matching, and profile-skill gating stay aligned for headless CLI, desktop selector/apply flows, mobile selectors, and ACP main-agent selection.
- `packages/shared/src/conversation-history.test.ts`
  Confirms shared tool-call/result flattening and conversation-history serialization stay aligned for desktop runtime progress, persistence, and remote API callers.
- `packages/shared/src/stt-models.test.ts`
  Confirms shared STT provider/model defaults stay aligned for onboarding, renderer settings, remote settings payloads, and main-process transcription callers.
- `apps/desktop/src/main/loop-summaries.test.ts`
  Confirms repeat-task summaries prefer runtime timestamps when available and merge profile names consistently for desktop and remote callers.
- `apps/desktop/src/main/loop-management.test.ts`
  Confirms shared repeat-task selection, summary enrichment, enable/disable persistence, manual trigger conflicts, and delete behavior stay aligned for headless CLI, desktop summaries, and remote loop endpoints.
- `apps/desktop/src/main/mcp-management.test.ts`
  Confirms shared MCP server summary building, exact/prefix selection, runtime enable/disable behavior, restart/stop helpers, and log lookup stay aligned for headless CLI, desktop capabilities actions, and remote MCP routes.
- `apps/desktop/src/main/ai-sdk-provider.test.ts`
  Confirms runtime language-model creation still uses the shared chat model resolver and preserves the STT-only fallback behavior for transcript/chat usage.
- `apps/desktop/src/renderer/src/lib/apply-selected-agent.test.ts`
  Confirms desktop next-session agent application still uses the shared enabled/default agent helpers and rejects stale selector state before the run starts.
- `apps/desktop/src/main/app-runtime.test.ts`
  Confirms the shared runtime helpers register IPC/serve infrastructure, support awaited headless startup, preserve background desktop startup, and centralize GUI/headless teardown.
- `apps/desktop/src/main/headless-runtime.test.ts`
  Confirms non-GUI startup reuses the shared remote-access bootstrap, routes `--headless` / `--qr` through one shared non-GUI launcher, preserves CLI-local `SIGINT` ownership when requested, and delegates graceful shutdown through the shared teardown helper.
- `apps/desktop/src/main/remote-access-runtime.test.ts`
  Confirms remote server startup plus config-driven remote access reconciliation converge in shared helpers for desktop startup, settings changes, headless CLI, and QR runtime paths.
- `apps/desktop/src/main/cloudflare-runtime.test.ts`
  Confirms the shared Cloudflare tunnel bootstrap skips disabled auto-start, honors named-tunnel config, and falls back to quick tunnels for forced QR pairing.
- `apps/mobile/src/ui/agentSelectorOptions.test.ts`
  Confirms mobile selector profile lists still reuse the shared enabled-agent filtering plus display-name/summary helpers and the shared ACP-capable profile list.
- `apps/desktop/src/main/loop-service.max-iterations.test.ts`
  Confirms repeat tasks pass their max-iteration override through the shared prompt launcher while resume-only runs keep the same override on the shared resume launcher.
