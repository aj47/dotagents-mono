import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const headlessCliSource = readFileSync(
  new URL("./headless-cli.ts", import.meta.url),
  "utf8",
)
const remoteServerSource = readFileSync(
  new URL("./remote-server.ts", import.meta.url),
  "utf8",
)
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const loopServiceSource = readFileSync(
  new URL("./loop-service.ts", import.meta.url),
  "utf8",
)
const acpBackgroundNotifierSource = readFileSync(
  new URL("./acp/acp-background-notifier.ts", import.meta.url),
  "utf8",
)
const agentModeRunnerSource = readFileSync(
  new URL("./agent-mode-runner.ts", import.meta.url),
  "utf8",
)
const conversationHistorySelectionSource = readFileSync(
  new URL("./conversation-history-selection.ts", import.meta.url),
  "utf8",
)
const appRuntimeSource = readFileSync(
  new URL("./app-runtime.ts", import.meta.url),
  "utf8",
)
const remoteAccessRuntimeSource = readFileSync(
  new URL("./remote-access-runtime.ts", import.meta.url),
  "utf8",
)
const cloudflareRuntimeSource = readFileSync(
  new URL("./cloudflare-runtime.ts", import.meta.url),
  "utf8",
)
const headlessRuntimeSource = readFileSync(
  new URL("./headless-runtime.ts", import.meta.url),
  "utf8",
)
const indexSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
const docsSource = readFileSync(
  new URL("../../CLI_DESKTOP_FEATURE_PATHS.md", import.meta.url),
  "utf8",
)

describe("CLI and desktop feature paths", () => {
  it("routes fresh prompt entrypoints through the shared launcher and conversation/session bootstrap", () => {
    expect(agentModeRunnerSource).toContain(
      "export async function startSharedPromptRun",
    )
    expect(agentModeRunnerSource).toContain(
      "export async function startSharedResumeRun",
    )
    expect(agentModeRunnerSource).toContain(
      "export function ensureAgentSessionForConversation",
    )
    expect(agentModeRunnerSource).toContain(
      "export async function preparePromptExecutionContext",
    )
    expect(agentModeRunnerSource).toContain(
      "export async function prepareResumeExecutionContext",
    )
    expect(headlessCliSource).toContain("startSharedPromptRun({")
    expect(remoteServerSource).toContain("startSharedPromptRun({")
    expect(tipcSource).toContain("return startSharedPromptRun({")
    expect(tipcSource).toContain("ensureAgentSessionForConversation({")
    expect(loopServiceSource).toContain("await startSharedPromptRun({")
  })

  it("routes the headless CLI through the shared launcher and runner", () => {
    expect(headlessCliSource).toContain(
      "toolApprovalManager.registerSessionApprovalHandler(",
    )
    expect(headlessCliSource).toContain("onPreparedContext:")
    expect(headlessCliSource).toContain("const agentResult = await runPromise")
  })

  it("shares CLI conversation selection through one helper before continuing a prior conversation", () => {
    expect(conversationHistorySelectionSource).toContain(
      "export function resolveConversationHistorySelection",
    )
    expect(headlessCliSource).toContain("resolveConversationHistorySelection(")
    expect(headlessCliSource).toContain('case "/use":')
    expect(headlessCliSource).toContain('case "/show":')
    expect(headlessCliSource).toContain(
      "requestedConversationId: currentConversationId",
    )
  })

  it("routes the remote server through the shared launcher and runner", () => {
    expect(remoteServerSource).toContain('approvalMode: "dialog"')
    expect(remoteServerSource).toContain("const agentResult = await runPromise")
    expect(remoteServerSource).not.toContain("state.isAgentModeActive = true")
    expect(remoteServerSource).not.toContain("state.shouldStopAgent = false")
    expect(remoteServerSource).not.toContain("state.agentIterationCount = 0")
  })

  it("keeps desktop UI and loop entry points on the shared runner", () => {
    expect(tipcSource).toContain("async function startDesktopPromptRun(")
    expect(tipcSource).toContain("async function startDesktopResumeRun(")
    expect(tipcSource).toContain("maxIterationsOverride?: number")
    expect(loopServiceSource).toContain(
      "maxIterationsOverride: loop.maxIterations",
    )
  })

  it("keeps queued prompts and internal resume nudges on the resume-only runner path", () => {
    expect(tipcSource).toContain("} = await startDesktopResumeRun({")
    expect(tipcSource).toContain(
      "candidateSessionIds: existingSessionId ? [existingSessionId] : [],",
    )
    expect(acpBackgroundNotifierSource).toContain("await runAgentLoopSession(")
  })

  it("shares GUI, headless CLI, and QR startup through the same bootstrap helpers", () => {
    expect(appRuntimeSource).toContain(
      "export function registerSharedMainProcessInfrastructure",
    )
    expect(appRuntimeSource).toContain(
      "export async function initializeSharedRuntimeServices",
    )
    expect(appRuntimeSource).toContain(
      "export async function shutdownSharedRuntimeServices",
    )
    expect(cloudflareRuntimeSource).toContain(
      "export async function startConfiguredCloudflareTunnel",
    )
    expect(remoteAccessRuntimeSource).toContain(
      "export async function startSharedRemoteAccessRuntime",
    )
    expect(remoteAccessRuntimeSource).toContain(
      "export async function syncConfiguredRemoteAccess",
    )
    expect(headlessRuntimeSource).toContain(
      "export async function startSharedHeadlessRuntime",
    )
    expect(headlessRuntimeSource).toContain(
      "export async function launchSharedHeadlessMode",
    )
    expect(headlessRuntimeSource).toContain(
      "export function registerSharedHeadlessTerminationHandlers",
    )
    expect(headlessRuntimeSource).toContain("cloudflareTunnelActivation")
    expect(headlessRuntimeSource).toContain("startSharedRemoteAccessRuntime({")
    expect(remoteAccessRuntimeSource).toContain(
      "startConfiguredCloudflareTunnel",
    )
    expect(remoteAccessRuntimeSource).toContain("startRemoteServerForced({")
    expect(remoteAccessRuntimeSource).toContain("return startRemoteServer()")
    expect(headlessRuntimeSource).toContain("shutdownSharedRuntimeServices({")
    expect(indexSource).toContain("registerSharedMainProcessInfrastructure()")
    expect(indexSource).toContain("syncConfiguredRemoteAccess({")
    expect(indexSource).toContain("launchSharedHeadlessMode({")
    expect(indexSource).toContain("shutdownSharedRuntimeServices({")
    expect(indexSource).toContain('cloudflareTunnelActivation: "auto"')
    expect(indexSource).toContain('cloudflareTunnelActivation: "force"')
    expect(tipcSource).toContain("await syncConfiguredRemoteAccess({")
    expect(indexSource).toContain('terminationSignals: ["SIGTERM"]')
    expect(indexSource).toContain('label: "headless-runtime"')
    expect(indexSource).toContain('label: "qr-runtime"')
    expect(indexSource).toContain('label: "desktop-runtime"')
    expect(indexSource).toContain("initializeSharedRuntimeServices({")
  })

  it("documents every shared feature path explicitly", () => {
    expect(docsSource).toContain("Shared prompt launcher")
    expect(docsSource).toContain("Shared resume runner")
    expect(docsSource).toContain("Shared conversation history selection")
    expect(docsSource).toContain("Shared prompt session bootstrap")
    expect(docsSource).toContain("Shared remote access bootstrap")
    expect(docsSource).toContain(
      "Shared configured remote access reconciliation",
    )
    expect(docsSource).toContain("Shared non-GUI mode launcher")
    expect(docsSource).toContain("Shared Cloudflare tunnel bootstrap")
    expect(docsSource).toContain("Shared runtime shutdown")
    expect(docsSource).toContain("Desktop text input")
    expect(docsSource).toContain("Desktop voice MCP mode")
    expect(docsSource).toContain("Headless CLI prompt")
    expect(docsSource).toContain("Remote server prompt")
    expect(docsSource).toContain("Repeat tasks / loops")
    expect(docsSource).toContain(
      "Queued desktop follow-ups / ACP parent resume",
    )
    expect(docsSource).toContain("Desktop GUI startup")
    expect(docsSource).toContain("Headless CLI startup")
    expect(docsSource).toContain("QR headless pairing startup")
    expect(docsSource).toContain("Desktop remote access startup")
    expect(docsSource).toContain("Desktop remote access reconfiguration")
    expect(docsSource).toContain("Desktop GUI shutdown")
    expect(docsSource).toContain("Headless non-GUI shutdown")
    expect(docsSource).toContain("Headless CLI conversation resume selection")
  })
})
