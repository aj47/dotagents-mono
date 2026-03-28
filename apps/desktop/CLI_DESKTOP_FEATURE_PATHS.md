# CLI/Desktop Feature Paths

This file tracks the shared execution paths that keep desktop UI, headless CLI, and background entry points aligned.

## Shared agent runner

- Main runner: `apps/desktop/src/main/agent-mode-runner.ts`
- Conversation prep helper: `prepareConversationForPrompt(...)`
- Prompt/session bootstrap helpers: `preparePromptExecutionContext(...)` and `ensureAgentSessionForConversation(...)`
- Top-level execution helper: `runTopLevelAgentMode(...)`

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

## Feature path matrix

1. Desktop text input
   `tipc.ts` queues follow-ups for active sessions when needed; otherwise `createMcpTextInput` calls `preparePromptExecutionContext(...)` so the desktop text prompt creates/appends the user turn and reuses the same session bootstrap as headless and remote before `processWithAgentMode(...)` delegates to `runTopLevelAgentMode(...)`.
2. Desktop voice MCP mode
   `tipc.ts` resolves the transcribing session through `ensureAgentSessionForConversation(...)`, emits transcription progress on that session, then calls `preparePromptExecutionContext(...)` after transcription so the persisted user turn and runtime session handoff follow the same shared bootstrap before reusing `processWithAgentMode(...)`.
3. Headless CLI prompt
   `headless-cli.ts` calls `preparePromptExecutionContext(...)`, registers a terminal approval handler for the returned session, then calls `runTopLevelAgentMode(...)`.
4. Remote server prompt
   `remote-server.ts` calls the same `preparePromptExecutionContext(...)`, keeps its dialog-based approval policy, and calls `runTopLevelAgentMode(...)`.
5. Repeat tasks / loops
   `loop-service.ts` creates the scheduled-task conversation, uses `ensureAgentSessionForConversation(...)` to create the runtime session, then calls `runAgentLoopSession(...)`, which forwards to `processWithAgentMode(...)` and ultimately `runTopLevelAgentMode(...)`.
6. Desktop GUI startup
   `index.ts` calls `registerSharedMainProcessInfrastructure(...)`, creates windows/tray, then starts MCP, loops, ACP sync, bundled skills, and models.dev via `initializeSharedRuntimeServices(...)`.
7. Headless CLI startup
   `index.ts --headless` calls the same infrastructure and runtime helpers before forcing the remote server on `0.0.0.0` and launching the terminal CLI.
8. QR headless pairing startup
   `index.ts --qr` calls `startSharedHeadlessRuntime(...)`, starts the remote server on `0.0.0.0`, optionally starts a Cloudflare tunnel, then prints the pairing QR code without creating windows.

## Parity rules

- ACP routing is decided in one place: `runTopLevelAgentMode(...)`.
- Standard MCP approval flow is inline when the caller requests `approvalMode: "inline"`.
- Conversation/session bootstrap is decided in one place: `preparePromptExecutionContext(...)` and `ensureAgentSessionForConversation(...)`.
- Reused sessions are refreshed in one place: `ensureAgentSessionForConversation(...)` now updates revived session metadata so temporary desktop transcription sessions and resumed prompts converge on the same runtime state.
- CLI parity comes from `toolApprovalManager.registerSessionApprovalHandler(...)`, which lets terminal sessions resolve the same approval requests that the desktop UI uses.
- Remote server currently keeps `approvalMode: "dialog"` to preserve its existing approval behavior.
- Legacy runtime flags stay session-manager-owned: prompt entrypoints do not reset `state.isAgentModeActive`, `state.shouldStopAgent`, or `state.agentIterationCount` directly, so overlapping desktop, CLI, remote, and loop sessions do not clobber each other.
- GUI and headless startup now share the same MCP/loop/ACP/skills/models initialization path through `initializeSharedRuntimeServices(...)`.
- `--headless` and `--qr` now share the same non-GUI bootstrap, including the forced external remote-server bind on `0.0.0.0`, before diverging into either the terminal REPL or QR pairing flow.

## Verification targets

- `packages/core/src/state.test.ts`
  Confirms session-scoped approval handlers auto-resolve requests and are cleaned up with the session.
- `apps/desktop/src/main/agent-mode-runner.test.ts`
  Confirms conversation/session bootstrap, inline approval behavior, and ACP routing.
- `apps/desktop/src/main/cli-desktop-feature-paths.test.ts`
  Confirms desktop UI, headless CLI, remote server, loop, GUI startup, headless startup, and QR startup paths still point at shared helpers.
- `apps/desktop/src/main/remote-server.routes.test.ts`
  Confirms the remote server keeps using the shared prompt runner and does not reintroduce ad hoc legacy runtime flag resets.
- `apps/desktop/src/main/app-runtime.test.ts`
  Confirms the shared startup helper registers IPC/serve infrastructure, supports awaited headless startup, and preserves background desktop startup.
- `apps/desktop/src/main/headless-runtime.test.ts`
  Confirms non-GUI startup reuses the shared runtime bootstrap, forces the external remote-server bind, and cleans up services through one graceful shutdown path.
