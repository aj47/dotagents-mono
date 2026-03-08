import { EventEmitter } from "events"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockSpawn = vi.fn()

vi.mock("child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}))

vi.mock("./config", () => ({ configStore: { get: vi.fn(() => ({})) } }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: {}, toolConfigToMcpServerConfig: vi.fn() }))
vi.mock("./mcp-service", () => ({ mcpService: {}, handleWhatsAppToggle: vi.fn() }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: {} }))
vi.mock("./state", () => ({ agentSessionStateManager: {}, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ isACPRouterTool: vi.fn(() => false), executeACPRouterTool: vi.fn() }))
vi.mock("./memory-service", () => ({ memoryService: {} }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ setSessionUserResponse: vi.fn() }))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: vi.fn(),
    upgradeGitHubSkillToLocal: vi.fn(),
  },
}))

const createMockProcess = () => {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter
    stderr: EventEmitter
    kill: ReturnType<typeof vi.fn>
  }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()
  proc.kill = vi.fn()
  return proc
}

describe("executeBuiltinTool execute_command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("streams command output through onProgress before the process closes", async () => {
    const { executeBuiltinTool } = await import("./builtin-tools")
    const proc = createMockProcess()
    mockSpawn.mockReturnValue(proc)

    const progressMessages: string[] = []
    const promise = executeBuiltinTool(
      "execute_command",
      { command: "printf hi" },
      undefined,
      (message) => progressMessages.push(message),
    )

    await vi.waitFor(() => {
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    proc.stdout.emit("data", Buffer.from("hello"))
    expect(progressMessages.at(-1)).toContain("hello")

    proc.stderr.emit("data", Buffer.from("warn\n"))
    expect(progressMessages.at(-1)).toContain("hello")
    expect(progressMessages.at(-1)).toContain("[stderr] warn")

    proc.emit("close", 0)

    const result = await promise
    expect(result).not.toBeNull()
    expect(result?.isError).toBe(false)

    const payload = JSON.parse(result!.content[0].text)
    expect(payload.success).toBe(true)
    expect(payload.stdout).toBe("hello")
    expect(payload.stderr).toBe("warn\n")
    expect(mockSpawn).toHaveBeenCalledWith(
      "printf hi",
      expect.objectContaining({
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      }),
    )
  })

  it("returns partial output when the command exits non-zero", async () => {
    const { executeBuiltinTool } = await import("./builtin-tools")
    const proc = createMockProcess()
    mockSpawn.mockReturnValue(proc)

    const promise = executeBuiltinTool("execute_command", { command: "bad-command" })

    await vi.waitFor(() => {
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    proc.stdout.emit("data", Buffer.from("partial output\n"))
    proc.emit("close", 7)

    const result = await promise
    expect(result).not.toBeNull()
    expect(result?.isError).toBe(true)

    const payload = JSON.parse(result!.content[0].text)
    expect(payload.error).toContain("exit code 7")
    expect(payload.exitCode).toBe(7)
    expect(payload.stdout).toBe("partial output\n")
  })
})