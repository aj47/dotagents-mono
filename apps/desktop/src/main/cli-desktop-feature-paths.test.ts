import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const headlessCliSource = readFileSync(new URL("./headless-cli.ts", import.meta.url), "utf8")
const remoteServerSource = readFileSync(new URL("./remote-server.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")
const agentModeRunnerSource = readFileSync(new URL("./agent-mode-runner.ts", import.meta.url), "utf8")
const appRuntimeSource = readFileSync(new URL("./app-runtime.ts", import.meta.url), "utf8")
const headlessRuntimeSource = readFileSync(new URL("./headless-runtime.ts", import.meta.url), "utf8")
const indexSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
const docsSource = readFileSync(new URL("../../CLI_DESKTOP_FEATURE_PATHS.md", import.meta.url), "utf8")

describe("CLI and desktop feature paths", () => {
  it("routes prompt entrypoints through the shared conversation/session bootstrap", () => {
    expect(agentModeRunnerSource).toContain("export function ensureAgentSessionForConversation")
    expect(agentModeRunnerSource).toContain("export async function preparePromptExecutionContext")
    expect(headlessCliSource).toContain("preparePromptExecutionContext({")
    expect(remoteServerSource).toContain("preparePromptExecutionContext({")
    expect(tipcSource).toContain("preparePromptExecutionContext({")
    expect(tipcSource).toContain("ensureAgentSessionForConversation({")
    expect(loopServiceSource).toContain("ensureAgentSessionForConversation({")
  })

  it("routes the headless CLI through the shared bootstrap and runner", () => {
    expect(headlessCliSource).toContain("toolApprovalManager.registerSessionApprovalHandler(")
    expect(headlessCliSource).toContain("runTopLevelAgentMode({")
  })

  it("routes the remote server through the shared bootstrap and runner", () => {
    expect(remoteServerSource).toContain('approvalMode: "dialog"')
    expect(remoteServerSource).toContain("runTopLevelAgentMode({")
  })

  it("keeps desktop UI and loop entry points on the shared runner", () => {
    expect(tipcSource).toContain("const result = await runTopLevelAgentMode({")
    expect(tipcSource).toContain("previousConversationHistoryOverride")
    expect(tipcSource).toContain("maxIterationsOverride?: number")
    expect(tipcSource).toContain("return processWithAgentMode(text, conversationId, existingSessionId, true, maxIterationsOverride)")
    expect(loopServiceSource).toContain("runAgentLoopSession(loop.prompt, conversation.id, sessionId, loop.maxIterations)")
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
    expect(docsSource).toContain("Shared prompt session bootstrap")
    expect(docsSource).toContain("Desktop text input")
    expect(docsSource).toContain("Desktop voice MCP mode")
    expect(docsSource).toContain("Headless CLI prompt")
    expect(docsSource).toContain("Remote server prompt")
    expect(docsSource).toContain("Repeat tasks / loops")
    expect(docsSource).toContain("Desktop GUI startup")
    expect(docsSource).toContain("Headless CLI startup")
    expect(docsSource).toContain("QR headless pairing startup")
  })
})
