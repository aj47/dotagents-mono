import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const headlessCliSource = readFileSync(new URL("./headless-cli.ts", import.meta.url), "utf8")
const remoteServerSource = readFileSync(new URL("./remote-server.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")
const acpBackgroundNotifierSource = readFileSync(new URL("./acp/acp-background-notifier.ts", import.meta.url), "utf8")
const agentModeRunnerSource = readFileSync(new URL("./agent-mode-runner.ts", import.meta.url), "utf8")
const appRuntimeSource = readFileSync(new URL("./app-runtime.ts", import.meta.url), "utf8")
const headlessRuntimeSource = readFileSync(new URL("./headless-runtime.ts", import.meta.url), "utf8")
const indexSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
const docsSource = readFileSync(new URL("../../CLI_DESKTOP_FEATURE_PATHS.md", import.meta.url), "utf8")

describe("CLI and desktop feature paths", () => {
  it("routes fresh prompt entrypoints through the shared launcher and conversation/session bootstrap", () => {
    expect(agentModeRunnerSource).toContain("export async function startSharedPromptRun")
    expect(agentModeRunnerSource).toContain("export function ensureAgentSessionForConversation")
    expect(agentModeRunnerSource).toContain("export async function preparePromptExecutionContext")
    expect(headlessCliSource).toContain("startSharedPromptRun({")
    expect(remoteServerSource).toContain("startSharedPromptRun({")
    expect(tipcSource).toContain("return startSharedPromptRun({")
    expect(tipcSource).toContain("ensureAgentSessionForConversation({")
    expect(loopServiceSource).toContain("await startSharedPromptRun({")
  })

  it("routes the headless CLI through the shared launcher and runner", () => {
    expect(headlessCliSource).toContain("toolApprovalManager.registerSessionApprovalHandler(")
    expect(headlessCliSource).toContain("onPreparedContext:")
    expect(headlessCliSource).toContain("const agentResult = await runPromise")
  })

  it("routes the remote server through the shared launcher and runner", () => {
    expect(remoteServerSource).toContain('approvalMode: "dialog"')
    expect(remoteServerSource).toContain("const agentResult = await runPromise")
    expect(remoteServerSource).not.toContain("state.isAgentModeActive = true")
    expect(remoteServerSource).not.toContain("state.shouldStopAgent = false")
    expect(remoteServerSource).not.toContain("state.agentIterationCount = 0")
  })

  it("keeps desktop UI and loop entry points on the shared runner", () => {
    expect(tipcSource).toContain("const result = await runTopLevelAgentMode({")
    expect(tipcSource).toContain("async function startDesktopPromptRun(")
    expect(tipcSource).toContain("maxIterationsOverride?: number")
    expect(loopServiceSource).toContain("maxIterationsOverride: loop.maxIterations")
  })

  it("keeps queued prompts and internal resume nudges on the resume-only runner path", () => {
    expect(tipcSource).toContain("await processWithAgentMode(queuedMessage.text, conversationId, existingSessionId, shouldStartSnoozed)")
    expect(tipcSource).toContain("return processWithAgentMode(text, conversationId, existingSessionId, true, maxIterationsOverride)")
    expect(acpBackgroundNotifierSource).toContain("await runAgentLoopSession(")
  })

  it("shares GUI, headless CLI, and QR startup through the same bootstrap helpers", () => {
    expect(appRuntimeSource).toContain("export function registerSharedMainProcessInfrastructure")
    expect(appRuntimeSource).toContain("export async function initializeSharedRuntimeServices")
    expect(headlessRuntimeSource).toContain("export async function startSharedHeadlessRuntime")
    expect(headlessRuntimeSource).toContain('mcpStrategy: "await"')
    expect(headlessRuntimeSource).toContain('acpStrategy: "await"')
    expect(indexSource).toContain("registerSharedMainProcessInfrastructure()")
    expect(indexSource).toContain("startSharedHeadlessRuntime({")
    expect(indexSource).toContain('label: "headless-runtime"')
    expect(indexSource).toContain('label: "qr-runtime"')
    expect(indexSource).toContain('label: "desktop-runtime"')
    expect(indexSource).toContain("initializeSharedRuntimeServices({")
  })

  it("documents every shared feature path explicitly", () => {
    expect(docsSource).toContain("Shared prompt launcher")
    expect(docsSource).toContain("Shared prompt session bootstrap")
    expect(docsSource).toContain("Desktop text input")
    expect(docsSource).toContain("Desktop voice MCP mode")
    expect(docsSource).toContain("Headless CLI prompt")
    expect(docsSource).toContain("Remote server prompt")
    expect(docsSource).toContain("Repeat tasks / loops")
    expect(docsSource).toContain("Queued desktop follow-ups / ACP parent resume")
    expect(docsSource).toContain("Desktop GUI startup")
    expect(docsSource).toContain("Headless CLI startup")
    expect(docsSource).toContain("QR headless pairing startup")
  })
})
