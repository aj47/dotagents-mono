# CLI/Desktop Feature Paths

This file tracks the shared execution paths that keep desktop UI, headless CLI, and background entry points aligned.

## Shared agent runner

- Main runner: `apps/desktop/src/main/agent-mode-runner.ts`
- Conversation prep helper: `prepareConversationForPrompt(...)`
- Top-level execution helper: `runTopLevelAgentMode(...)`

## Shared startup runtime

- Main-process bootstrap helper: `apps/desktop/src/main/app-runtime.ts`
- Infrastructure helper: `registerSharedMainProcessInfrastructure(...)`
- Service startup helper: `initializeSharedRuntimeServices(...)`

## Feature path matrix

1. Desktop text input
   `tipc.ts` creates or revives the conversation/session, then calls `processWithAgentMode(...)`, which now delegates to `runTopLevelAgentMode(...)`.
2. Desktop voice MCP mode
   `tipc.ts` transcribes audio, updates the session/conversation, then reuses the same `processWithAgentMode(...)` wrapper.
3. Headless CLI prompt
   `headless-cli.ts` appends the user turn with `prepareConversationForPrompt(...)`, registers a terminal approval handler for the session, then calls `runTopLevelAgentMode(...)`.
4. Remote server prompt
   `remote-server.ts` appends the user turn with `prepareConversationForPrompt(...)`, revives the matching session if present, and calls `runTopLevelAgentMode(...)`.
5. Repeat tasks / loops
   `loop-service.ts` creates the conversation/session for the scheduled task and then calls `runAgentLoopSession(...)`, which forwards to `processWithAgentMode(...)` and ultimately `runTopLevelAgentMode(...)`.
6. Desktop GUI startup
   `index.ts` calls `registerSharedMainProcessInfrastructure(...)`, creates windows/tray, then starts MCP, loops, ACP sync, bundled skills, and models.dev via `initializeSharedRuntimeServices(...)`.
7. Headless CLI startup
   `index.ts --headless` calls the same infrastructure and runtime helpers before forcing the remote server on `0.0.0.0` and launching the terminal CLI.

## Parity rules

- ACP routing is decided in one place: `runTopLevelAgentMode(...)`.
- Standard MCP approval flow is inline when the caller requests `approvalMode: "inline"`.
- CLI parity comes from `toolApprovalManager.registerSessionApprovalHandler(...)`, which lets terminal sessions resolve the same approval requests that the desktop UI uses.
- Remote server currently keeps `approvalMode: "dialog"` to preserve its existing approval behavior.
- GUI and headless startup now share the same MCP/loop/ACP/skills/models initialization path through `initializeSharedRuntimeServices(...)`.

## Verification targets

- `packages/core/src/state.test.ts`
  Confirms session-scoped approval handlers auto-resolve requests and are cleaned up with the session.
- `apps/desktop/src/main/agent-mode-runner.test.ts`
  Confirms conversation prep, inline approval behavior, and ACP routing.
- `apps/desktop/src/main/cli-desktop-feature-paths.test.ts`
  Confirms desktop UI, headless CLI, remote server, loop, GUI startup, and headless startup paths still point at shared helpers.
- `apps/desktop/src/main/app-runtime.test.ts`
  Confirms the shared startup helper registers IPC/serve infrastructure, supports awaited headless startup, and preserves background desktop startup.
