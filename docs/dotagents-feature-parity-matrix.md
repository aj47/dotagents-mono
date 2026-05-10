# DotAgents Mobile/Web Feature-Parity Matrix

Scope: this matrix inventories Electron desktop and mobile/web availability for shared DotAgents capabilities. TUI implementation is explicitly out of scope for this pass; no TUI files are required or changed by this mobile/web parity objective.

## Summary

- Shared desktop server coverage exists for the mobile/web client-relevant read/create/update/delete/action flows for settings/config, legacy profiles, agent profiles, skills, knowledge notes, loops, MCP runtime/status controls, model presets, local speech models, sessions/conversations, message queues, and operator actions.
- Mobile/web coverage exists through `apps/mobile/src/lib/settingsApi.ts`, the shared `ExtendedSettingsApiClient`, `SettingsScreen`, edit screens, `ChatScreen`, `SessionListScreen`, and `OperationsScreen`.
- Remaining mobile/web gaps are classified as desktop-only local file-dialog/OAuth/folder-opening workflows, native OS helpers, or security-sensitive raw config editing that should not be exposed directly to mobile/web without a separate product/security design.

## Prompt-To-Artifact Checklist

| Requirement | Concrete evidence | Status |
| --- | --- | --- |
| Inventory Electron desktop capabilities touching `.agents`, config, sessions, MCP, skills, notes, agents, loops, model presets, profiles, local speech models, queues, and operator actions | Matrix rows below reference desktop renderer/main files, `mobile-api-routes.ts`, `operator-routes.ts`, and action adapters | Covered |
| Record Electron source, server route/action, mobile/web interface, verification evidence, and remaining gap for each capability | Matrix rows below contain those exact columns; TUI is not a column because it is out of scope | Covered |
| Ignore TUI implementation work and make no TUI file changes | This artifact records TUI as out of scope only. Dirty TUI files in the worktree are pre-existing/parallel-pass files and are not part of this mobile/web pass | Covered |
| Implement missing server routes/actions needed for mobile/web parity | Server route constants and registrations cover the shared client-relevant CRUD/action surface; shared operator/local-speech adapters are covered by focused tests | Covered |
| Implement missing mobile/web UI/client methods for shared server-backed capabilities | Mobile/web surfaces are recorded from `SettingsScreen`, edit screens, `ChatScreen`, `SessionListScreen`, `OperationsScreen`, and `settingsApi.ts`; mobile tests cover the source contracts | Covered |
| Add focused tests proving representative mobile/web flows go through the shared desktop server | Shared client tests, mobile operator-client tests, desktop server-route tests, and mobile source checks are listed in the verification checklist | Covered |
| Run and pass relevant shared, desktop-server, and mobile/web verification suites | See Latest Verification section | Covered |
| Do not mark complete until no unclassified mobile/web parity gaps remain | Remaining gaps are classified below as deliberate desktop-only/security-sensitive/native exceptions | Covered |

## Matrix

| Capability | Electron UI/API Source | Shared Server Route/Action Availability | Mobile/Web Availability | Verification Evidence | Remaining Mobile/Web Gap |
| --- | --- | --- | --- | --- | --- |
| Shared route contract/client surface | `packages/shared/src/remote-server-api.ts`, `apps/desktop/src/main/mobile-api-routes.ts`, `apps/desktop/src/main/operator-routes.ts` | `REMOTE_SERVER_API_ROUTES`, `REMOTE_SERVER_API_BUILDERS`, `MobileApiRouteActions`, `OperatorRouteActions` | `packages/shared/src/settings-api-client.ts`; mobile wrapper in `apps/mobile/src/lib/settingsApi.ts` | `packages/shared/src/settings-api-client.test.ts`; `apps/desktop/src/main/remote-server.routes.test.ts`; `apps/mobile/src/lib/settingsApi.operator.test.ts` | None |
| `.agents` settings/config | Desktop settings pages, `tipc.getConfig`, `tipc.saveConfig`, `.agents` helpers in `apps/desktop/src/main/tipc.ts` | `GET/PATCH /v1/settings` through `settings-actions.ts`; sensitive updates audited | `SettingsScreen` remote settings; `OperationsScreen` remote access settings; `settingsClient.updateSettings` | `packages/shared/src/settings-api-client.test.ts`; `apps/desktop/src/main/remote-server.routes.test.ts`; mobile settings tests | Desktop folder reveal/open helpers remain desktop-only native filesystem actions |
| Legacy profile selection/import/export | `profile-actions.ts` and desktop settings/profile consumers | `GET /profiles`, `GET/POST /profiles/current`, `GET /profiles/:id/export`, `POST /profiles/import` | `SettingsScreen` profile picker plus import/export modal; `store/profile.ts` loads current server profile | `packages/shared/src/settings-api-client.test.ts`; `apps/mobile/tests/settings-remote-provider-density.test.js` | None |
| Agent profiles | `apps/desktop/src/renderer/src/pages/settings-agents.tsx`, `agent-profile-actions.ts`, `agent-profile-service.ts` | `GET/POST /agent-profiles`, `GET/PATCH/DELETE /agent-profiles/:id`, `POST /agent-profiles/:id/toggle` | `SettingsScreen` Agents section; `AgentEditScreen` create/update/delete/toggle | `packages/shared/src/settings-api-client.test.ts`; `apps/mobile/tests/settings-agent-management-density.test.js`; `apps/mobile/tests/agent-edit-density.test.js` | Desktop command verification/install handoff remains native/security-sensitive |
| Skills | `settings-skills` / `settings-agents` desktop UI, `skill-actions.ts`, `skills-service.ts` | `GET/POST /skills`, `GET/PATCH/DELETE /skills/:id`, `POST /skills/:id/toggle-profile` | `SettingsScreen` Skills section; `SkillEditScreen` create/update/delete/toggle | `packages/shared/src/settings-api-client.test.ts`; `apps/mobile/tests/settings-screen-density.test.js`; mobile source checks | Desktop file picker/import-folder/GitHub-import/export-to-file workflows remain desktop-only local file operations |
| Knowledge notes | `apps/desktop/src/renderer/src/pages/knowledge.tsx`, `knowledge-note-actions.ts`, `knowledge-notes-service.ts` | `GET/POST /knowledge/notes`, `GET/PATCH/DELETE /knowledge/notes/:id` | `SettingsScreen` Knowledge Notes section; `KnowledgeNoteEditScreen` create/update/delete/promote | `packages/shared/src/settings-api-client.test.ts`; `apps/mobile/tests/settings-knowledge-notes-density.test.js`; `apps/mobile/tests/knowledge-note-edit-context-options.test.js` | Desktop grouped/search overview, bulk deletes, and folder-open actions are richer desktop-only affordances; mobile CRUD is covered |
| Agent loops / repeat tasks | `apps/desktop/src/renderer/src/pages/settings-loops.tsx`, `repeat-task-actions.ts`, `loop-service.ts` | `GET/POST /loops`, `PATCH/DELETE /loops/:id`, `POST /loops/:id/toggle`, `POST /loops/:id/run` | `SettingsScreen` Agent Loops section; `LoopEditScreen`; `ChatScreen` quick-start loop execution | `packages/shared/src/settings-api-client.test.ts`; `apps/mobile/tests/agent-loops-actions.test.js`; `apps/mobile/tests/loop-edit-*` | Opening task files in the local editor remains desktop-only |
| MCP saved server enablement | `apps/desktop/src/renderer/src/components/mcp-config-manager.tsx`, `mcp-server-actions.ts` | `GET /mcp/servers`, `POST /mcp/servers/:name/toggle` | `SettingsScreen` lists and toggles saved MCP servers | `packages/shared/src/settings-api-client.test.ts`; mobile settings source checks | Raw MCP config import/export, OAuth token flows, and full server config editing are secret-bearing desktop-local workflows |
| MCP runtime/tools/logs | `settings-mcp-tools.tsx`, `operator-mcp-actions.ts` | `GET /operator/mcp`, logs, clear logs, test, tools, tool toggle, start/stop/restart routes | `OperationsScreen` runtime status, logs, tests, tool toggles, and server start/stop/restart controls | `apps/mobile/tests/operations-screen-remote-ops.test.js`; `apps/desktop/src/main/remote-server.routes.test.ts` | None for safe operator runtime controls |
| Model presets | `apps/desktop/src/renderer/src/components/model-preset-manager.tsx`, `operator-model-preset-actions.ts` | `GET/POST /operator/model-presets`, `PATCH/DELETE /operator/model-presets/:presetId`; shared helpers in `packages/shared/src/model-presets.ts` | `SettingsScreen` endpoint picker/editor creates, updates, deletes, and activates presets | `packages/shared/src/settings-api-client.test.ts`; `apps/desktop/src/main/remote-server.routes.test.ts`; mobile settings source checks | None |
| Local speech models | Desktop local STT/TTS model services through `operator-local-speech-actions.ts` | `GET /operator/local-speech-models`, `GET /operator/local-speech-models/:providerId`, `POST /operator/local-speech-models/:providerId/download`; shared adapter in `packages/shared/src/local-speech-models.ts` | `SettingsScreen` loads model statuses and starts local model downloads for desktop STT/TTS providers | `packages/shared/src/local-speech-models.test.ts`; `apps/desktop/src/main/remote-server.routes.test.ts`; mobile settings source checks | Local recording/playback UI remains client-specific; route parity for model status/download is covered |
| Sessions and conversations | Desktop conversation/session state via `conversation-actions.ts`, session stores, and `tipc`/agent loop runner APIs | `GET/POST/PUT /conversations`, `GET /conversations/:id`, chat completion and recovery routes | Mobile sync service, `ChatScreen`, `SessionListScreen`, conversation search, pin/archive flows | `packages/shared/src/settings-api-client.test.ts`; `apps/mobile/tests/session-list-*`; `apps/mobile/src/lib/openaiClient.sanitize.test.ts` | Desktop renderer-only layout affordances are UI-specific |
| Message queues | `operator-message-queue-actions.ts`, desktop message queue store | `GET /operator/message-queues`, clear/pause/resume, message delete/retry/update routes | `OperationsScreen` queue panel; `MessageQueuePanel`; mobile queued-message controls | `apps/mobile/tests/operations-screen-remote-ops.test.js`; `apps/mobile/tests/message-queue-panel-density.test.js`; `packages/shared/src/settings-api-client.test.ts` | None |
| Operator actions and integrations | `operator-*` actions for status, health, logs, audit, tunnel, integrations, updater, restart, run-agent, API-key rotation, emergency stop | `/operator/status`, health/errors/logs/audit, tunnel, integrations, Discord, WhatsApp, updater, restart, run-agent, rotate key, emergency stop | `OperationsScreen` remote operator console and safe controls | `apps/mobile/src/lib/settingsApi.operator.test.ts`; `apps/mobile/tests/operations-screen-remote-ops.test.js`; `packages/shared/src/operator-actions.test.ts`; `apps/desktop/src/main/remote-server.routes.test.ts` | Desktop-only reveal/open installer actions are native OS helpers; safe remote actions are covered |

## Verification Checklist

- Server route registration: `apps/desktop/src/main/remote-server.routes.test.ts`
- Shared client route coverage: `packages/shared/src/settings-api-client.test.ts`
- Shared operator action adapter coverage: `packages/shared/src/operator-actions.test.ts`
- Shared local speech model adapter coverage: `packages/shared/src/local-speech-models.test.ts`
- Mobile/web operator client methods: `apps/mobile/src/lib/settingsApi.operator.test.ts`
- Mobile/web chat/recovery API route usage: `apps/mobile/src/lib/openaiClient.sanitize.test.ts`
- Mobile/web UI source checks: `apps/mobile/tests/*`

## Latest Verification

- `pnpm --filter @dotagents/shared build`: pass
- `CI=1 pnpm --filter @dotagents/shared test -- src/settings-api-client.test.ts src/operator-actions.test.ts src/local-speech-models.test.ts`: pass, 65 tests
- `CI=1 pnpm --filter @dotagents/shared test -- src/mcp-api.test.ts`: pass, 14 tests
- `CI=1 pnpm --filter @dotagents/desktop test -- src/main/remote-server.routes.test.ts`: pass, includes workspace dependency build and 25 route tests
- `CI=1 pnpm --filter @dotagents/mobile test`: pass, 128 node tests and 92 Vitest tests

## Completion Audit

Objective: implement complete mobile/web parity with Electron desktop for shared DotAgents capabilities, without making TUI changes.

| Success Criterion | Evidence | Audit Result |
| --- | --- | --- |
| Inventory desktop capabilities touching `.agents`, config, sessions, MCP, skills, notes, agents, loops, model presets, profiles, local speech models, queues, and operator actions | Matrix rows cover each named capability with Electron source references | Satisfied |
| Record Electron source, server route/action availability, mobile/web availability, verification evidence, and remaining gap | Matrix columns match those required fields; there is no TUI implementation column | Satisfied |
| Ignore TUI implementation work | Scope states TUI is out of scope. Existing dirty TUI files are not part of this mobile/web artifact | Satisfied for this pass |
| Implement missing server routes/actions needed for mobile/web parity | Route/action surface is covered by shared client tests and desktop server-route tests | Satisfied |
| Implement missing mobile/web UI/client methods | Mobile surfaces and tests cover Settings, edit screens, Chat, Sessions, Operations, model presets, local speech, queues, and operator controls | Satisfied |
| Add focused tests for representative mobile/web flows through the shared desktop server | Shared client tests, mobile operator tests, mobile chat route tests, and desktop server-route tests are listed above | Satisfied |
| Run relevant verification suites | Latest Verification section lists all required shared, desktop-server, and mobile/web gates as passing | Satisfied |
| No unclassified mobile/web parity gaps remain | Remaining gaps are classified as desktop-only native helpers, local file dialogs, OAuth/raw config editing, or security-sensitive workflows | Satisfied |
