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

## Shared non-GUI mode launcher

- Non-GUI launcher file: `apps/desktop/src/main/headless-runtime.ts`
- Mode launcher helper: `launchSharedHeadlessMode(...)`
- Signal registration helper: `registerSharedHeadlessTerminationHandlers(...)`

## Shared Cloudflare tunnel bootstrap

- Shared tunnel file: `apps/desktop/src/main/cloudflare-runtime.ts`
- Tunnel bootstrap helper: `startConfiguredCloudflareTunnel(...)`
- Activation modes: `"auto"` for config-driven startup and `"force"` for QR pairing

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
   `remote-server.ts` calls the same `startSharedPromptRun(...)`, keeps its dialog-based approval policy, and awaits the returned `runPromise`.
5. Repeat tasks / loops
   `loop-service.ts` calls `startSharedPromptRun(...)` with the repeat-task session title and loop-specific `maxIterationsOverride`, then awaits the returned `runPromise`.
6. Queued desktop follow-ups / ACP parent resume
   `tipc.ts` now calls `startDesktopResumeRun(...)`, which wraps `startSharedResumeRun(...)`, so queued follow-ups revive candidate session IDs and reload prior history through the same shared resume bootstrap before `runPromise` enters `runTopLevelAgentMode(...)`; `acp/acp-background-notifier.ts` reuses the same path through `runAgentLoopSession(...)`, while both entry points still avoid appending persisted or synthetic turns.
7. Desktop GUI startup
   `index.ts` calls `registerSharedMainProcessInfrastructure(...)`, creates windows/tray, then starts MCP, loops, ACP sync, bundled skills, and models.dev via `initializeSharedRuntimeServices(...)`; when the remote server comes up, it also reuses `startConfiguredCloudflareTunnel({ activation: "auto" })` so desktop remote access follows the same tunnel bootstrap rules as non-GUI modes.
8. Headless CLI startup
   `index.ts --headless` calls `launchSharedHeadlessMode(...)`, which wraps `startSharedHeadlessRuntime(...)`, shared non-GUI startup failure handling, and shared termination wiring before starting `headless-cli.ts`; that launcher intentionally only claims `SIGTERM`, so the terminal REPL keeps owning `SIGINT` / Ctrl+C for stop-or-exit behavior while still reusing the same config-driven Cloudflare tunnel bootstrap as desktop after forcing the remote server on `0.0.0.0`.
9. QR headless pairing startup
   `index.ts --qr` calls `launchSharedHeadlessMode(...)`, which wraps `startSharedHeadlessRuntime(...)`, shared `SIGINT`/`SIGTERM` ownership, and shared non-GUI startup failure handling before forcing the same shared tunnel helper to prefer the configured named tunnel, fall back to quick tunnel when needed, and hand the resulting URL to `printQRCodeToTerminal(...)` without creating windows.
10. Desktop GUI shutdown
    `index.ts` still handles window/tray bookkeeping locally, then calls `shutdownSharedRuntimeServices(...)` from `before-quit` so keyboard teardown, loop shutdown, ACP cleanup, MCP cleanup, and remote-server shutdown follow one shared runtime path with the same timeout policy every time the desktop app exits.
11. Headless non-GUI shutdown
    `headless-runtime.ts` logs the mode-specific shutdown banner, then calls `shutdownSharedRuntimeServices(...)` before `process.exit(...)` so `--headless` and `--qr` tear down loops, ACP, MCP, and the remote server through the same helper the GUI uses.

## Parity rules

- ACP routing is decided in one place: `runTopLevelAgentMode(...)`.
- Standard MCP approval flow is inline when the caller requests `approvalMode: "inline"`.
- Fresh persisted prompt entrypoints share one launcher: `startSharedPromptRun(...)`.
- Resume-only entrypoints share one launcher: `startSharedResumeRun(...)`.
- Conversation/session bootstrap is decided in one place: `preparePromptExecutionContext(...)` and `ensureAgentSessionForConversation(...)`.
- Queued follow-ups and ACP parent-resume nudges intentionally bypass `preparePromptExecutionContext(...)` and reuse `prepareResumeExecutionContext(...)` / `startSharedResumeRun(...)` so they do not duplicate persisted user turns while still sharing session revival and history loading.
- Reused sessions are refreshed in one place: `ensureAgentSessionForConversation(...)` now updates revived session metadata so temporary desktop transcription sessions and resumed prompts converge on the same runtime state.
- CLI parity comes from `toolApprovalManager.registerSessionApprovalHandler(...)`, which the shared launcher now wires up via `onPreparedContext(...)` before the run starts so terminal sessions resolve the same approval requests that the desktop UI uses.
- Remote server currently keeps `approvalMode: "dialog"` to preserve its existing approval behavior.
- Legacy runtime flags stay session-manager-owned: prompt entrypoints do not reset `state.isAgentModeActive`, `state.shouldStopAgent`, or `state.agentIterationCount` directly, so overlapping desktop, CLI, remote, and loop sessions do not clobber each other.
- GUI and headless startup now share the same MCP/loop/ACP/skills/models initialization path through `initializeSharedRuntimeServices(...)`.
- `--headless` and `--qr` now also share the same top-level non-GUI launcher through `launchSharedHeadlessMode(...)`, so startup failures and signal registration are decided in one place.
- Headless CLI intentionally narrows that shared launcher to `SIGTERM` so `headless-cli.ts` keeps owning terminal `SIGINT` / Ctrl+C behavior for stop-or-exit parity instead of racing a global shutdown handler.
- Cloudflare tunnel startup is decided in one place: `startConfiguredCloudflareTunnel(...)`, so desktop auto-start, headless CLI auto-start, and QR pairing all converge on the same named-vs-quick tunnel logic.
- `--headless` and `--qr` now share the same non-GUI bootstrap, including the forced external remote-server bind on `0.0.0.0`, before diverging into either the terminal REPL or QR pairing flow.
- Runtime teardown is decided in one place: `shutdownSharedRuntimeServices(...)`, so GUI quit and non-GUI graceful shutdown both stop loops and clean up ACP, MCP, and remote-server state through the same helper.

## Verification targets

- `packages/core/src/state.test.ts`
  Confirms session-scoped approval handlers auto-resolve requests and are cleaned up with the session.
- `apps/desktop/src/main/agent-mode-runner.test.ts`
  Confirms prompt bootstrap, resume bootstrap, inline approval behavior, and ACP routing.
- `apps/desktop/src/main/cli-desktop-feature-paths.test.ts`
  Confirms fresh desktop UI, queued desktop follow-ups, headless CLI, remote server, loop, GUI startup, headless startup, QR startup, and ACP parent-resume paths still point at the intended shared helpers.
- `apps/desktop/src/main/remote-server.routes.test.ts`
  Confirms the remote server keeps using the shared prompt runner and does not reintroduce ad hoc legacy runtime flag resets.
- `apps/desktop/src/main/app-runtime.test.ts`
  Confirms the shared runtime helpers register IPC/serve infrastructure, support awaited headless startup, preserve background desktop startup, and centralize GUI/headless teardown.
- `apps/desktop/src/main/headless-runtime.test.ts`
  Confirms non-GUI startup reuses the shared runtime bootstrap, forces the external remote-server bind, optionally layers the shared Cloudflare tunnel bootstrap on top, routes `--headless` / `--qr` through one shared non-GUI launcher, preserves CLI-local `SIGINT` ownership when requested, and delegates graceful shutdown through the shared teardown helper.
- `apps/desktop/src/main/cloudflare-runtime.test.ts`
  Confirms the shared Cloudflare tunnel bootstrap skips disabled auto-start, honors named-tunnel config, and falls back to quick tunnels for forced QR pairing.
- `apps/desktop/src/main/loop-service.max-iterations.test.ts`
  Confirms repeat tasks pass their max-iteration override through the shared prompt launcher while resume-only runs keep the same override on the shared resume launcher.
