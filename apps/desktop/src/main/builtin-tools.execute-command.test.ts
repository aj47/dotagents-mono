import { beforeEach, describe, expect, it, vi } from "vitest"

const mockExec = vi.fn()

vi.mock("./config", () => ({ configStore: { get: vi.fn(), save: vi.fn() } }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: {}, toolConfigToMcpServerConfig: vi.fn() }))
vi.mock("./mcp-service", () => ({ mcpService: {}, handleWhatsAppToggle: vi.fn() }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions: vi.fn(() => []) } }))
vi.mock("./state", () => ({ agentSessionStateManager: {}, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./memory-service", () => ({ memoryService: {} }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ setSessionUserResponse: vi.fn() }))
vi.mock("./skills-service", () => ({ skillsService: { getSkill: vi.fn() } }))
vi.mock("child_process", () => ({ exec: mockExec }))

function parseTextResult(result: Awaited<ReturnType<typeof import("./builtin-tools")["executeBuiltinTool"]>>) {
  expect(result).not.toBeNull()
  expect(result?.content[0]?.type).toBe("text")
  return JSON.parse((result?.content[0] as { text: string }).text)
}

describe("builtin execute_command", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns partial success when stdout exceeds maxBuffer", async () => {
    const hugeStdout = `total 2\nmatch line\n${"x".repeat(12_000)}`

    mockExec.mockImplementation((_command: string, _options: unknown, callback: (error: unknown, stdout: string, stderr: string) => void) => {
      const error = Object.assign(new Error("stdout maxBuffer length exceeded"), {
        code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER",
        stdout: hugeStdout,
        stderr: "",
      })

      callback(error, hugeStdout, "")
      return {} as never
    })

    const { executeBuiltinTool } = await import("./builtin-tools")
    const result = await executeBuiltinTool("execute_command", { command: 'grep -Rin "chloe" ~/Documents/agent-notes' })

    expect(result?.isError).toBe(false)

    const payload = parseTextResult(result)
    expect(payload.success).toBe(true)
    expect(payload.bufferExceeded).toBe(true)
    expect(payload.partialOutput).toBe(true)
    expect(payload.outputTruncated).toBe(true)
    expect(payload.warning).toContain("exceeded the execute_command buffer")
    expect(payload.hint).toContain("head/tail/sed")
    expect(payload.stdout).toContain("match line")
    expect(payload.stdout).toContain("OUTPUT TRUNCATED")
  })

  it("keeps normal command failures as errors", async () => {
    mockExec.mockImplementation((_command: string, _options: unknown, callback: (error: unknown, stdout: string, stderr: string) => void) => {
      const error = Object.assign(new Error("Command failed: grep bad"), {
        code: 2,
        stdout: "",
        stderr: "grep: bad pattern",
      })

      callback(error, "", "grep: bad pattern")
      return {} as never
    })

    const { executeBuiltinTool } = await import("./builtin-tools")
    const result = await executeBuiltinTool("execute_command", { command: "grep bad" })

    expect(result?.isError).toBe(true)

    const payload = parseTextResult(result)
    expect(payload.success).toBe(false)
    expect(payload.error).toContain("Command failed")
    expect(payload.stderr).toContain("bad pattern")
    expect(payload.bufferExceeded).toBeUndefined()
  })
})