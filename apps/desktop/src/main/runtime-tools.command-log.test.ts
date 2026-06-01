import os from "node:os"
import path from "node:path"
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./mcp-service", () => ({ mcpService: { getAvailableTools: vi.fn(() => []) } }))
vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: { getActiveSessions: vi.fn(() => []), getSession: vi.fn(() => undefined) },
}))
vi.mock("./state", () => ({ agentSessionStateManager: { getSessionRunId: vi.fn(() => 1) }, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: { loadConversation: vi.fn().mockResolvedValue(null) } }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: vi.fn(() => undefined),
  getRootAppSessionForAcpSession: vi.fn(() => undefined),
  setAcpSessionTitleOverride: vi.fn(),
}))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: vi.fn(() => undefined),
    getSkills: vi.fn(() => []),
    refreshFromDisk: vi.fn(() => []),
    upgradeGitHubSkillToLocal: vi.fn(),
  },
}))

let tempDataFolder: string | null = null

describe("execute_command durable session command log", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    tempDataFolder = await mkdtemp(path.join(os.tmpdir(), "dotagents-cmdlog-"))
    const runtime = await import("./session-command-runtime")
    runtime.__setSessionCommandRuntimeDataFolderForTests(tempDataFolder)
    runtime.__resetSessionCommandRuntimeForTests()
  })

  afterEach(async () => {
    const runtime = await import("./session-command-runtime")
    runtime.__setSessionCommandRuntimeDataFolderForTests(null)
    if (tempDataFolder) {
      await rm(tempDataFolder, { recursive: true, force: true })
      tempDataFolder = null
    }
  })

  it("writes the full stdout, stderr, and metadata for a successful command", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "execute_command",
      { command: "printf 'hello\\nworld\\n'" },
      "session-log-success",
    )

    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(typeof payload.commandId).toBe("string")
    expect(payload.commandId).toMatch(/^cmd_/)
    expect(typeof payload.fullStdoutPath).toBe("string")
    expect(typeof payload.fullStderrPath).toBe("string")

    const stdoutOnDisk = await readFile(payload.fullStdoutPath, "utf8")
    expect(stdoutOnDisk).toBe("hello\nworld\n")

    const stderrOnDisk = await readFile(payload.fullStderrPath, "utf8")
    expect(stderrOnDisk).toBe("")

    const metadataPath = payload.fullStdoutPath.replace(/\.stdout\.log$/, ".json")
    const metadata = JSON.parse(await readFile(metadataPath, "utf8"))
    expect(metadata).toEqual(expect.objectContaining({
      commandId: payload.commandId,
      command: "printf 'hello\\nworld\\n'",
      sessionId: "session-log-success",
      exitCode: 0,
      stdoutBytes: Buffer.byteLength("hello\nworld\n", "utf8"),
      stderrBytes: 0,
    }))
    expect(typeof metadata.startedAt).toBe("string")
    expect(typeof metadata.endedAt).toBe("string")
    expect(typeof metadata.durationMs).toBe("number")
    expect(metadata.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("persists full stdout even when the assistant-facing payload is truncated", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    // Emit > 10K characters of stdout so the assistant payload gets truncated
    // while the durable log keeps the complete output.
    const command = "for i in $(seq 1 12000); do printf 'line-%05d\\n' $i; done"
    const result = await executeRuntimeTool(
      "execute_command",
      { command, timeout: 60000 },
      "session-log-truncation",
    )

    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.outputTruncated).toBe(true)
    expect(payload.stdout.length).toBeLessThan(11000)
    expect(typeof payload.fullStdoutPath).toBe("string")

    const stdoutOnDisk = await readFile(payload.fullStdoutPath, "utf8")
    expect(stdoutOnDisk).toContain("line-00001\n")
    expect(stdoutOnDisk).toContain("line-12000\n")
    expect(stdoutOnDisk.length).toBeGreaterThan(payload.stdout.length)
  })

  it("records the command log when the command exits with a non-zero status", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "execute_command",
      { command: "printf 'oops\\n' 1>&2 && exit 7" },
      "session-log-failure",
    )

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.exitCode).toBe(7)
    expect(typeof payload.commandId).toBe("string")
    expect(typeof payload.fullStderrPath).toBe("string")

    const stderrOnDisk = await readFile(payload.fullStderrPath, "utf8")
    expect(stderrOnDisk).toBe("oops\n")

    const metadataPath = payload.fullStderrPath.replace(/\.stderr\.log$/, ".json")
    const metadata = JSON.parse(await readFile(metadataPath, "utf8"))
    expect(metadata).toEqual(expect.objectContaining({
      commandId: payload.commandId,
      sessionId: "session-log-failure",
      exitCode: 7,
      stderrBytes: Buffer.byteLength("oops\n", "utf8"),
    }))
    expect(typeof metadata.errorMessage).toBe("string")
  })

  it("does not write a command log when no session id is supplied", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "execute_command",
      { command: "echo no-session" },
    )

    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.commandId).toBeUndefined()
    expect(payload.fullStdoutPath).toBeUndefined()

    const sessionsRoot = path.join(tempDataFolder!, "runtime", "sessions")
    const entries = await readdir(sessionsRoot).catch(() => [])
    expect(entries).toEqual([])
  })
})
