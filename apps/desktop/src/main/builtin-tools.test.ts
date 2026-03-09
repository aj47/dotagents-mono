import { beforeEach, describe, expect, it, vi } from "vitest"

const execMock = vi.fn()
const getSkillMock = vi.fn()

vi.mock("child_process", () => ({ exec: execMock }))
vi.mock("./config", () => ({ configStore: { get: vi.fn(() => ({})), set: vi.fn() } }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: {}, toolConfigToMcpServerConfig: vi.fn() }))
vi.mock("./mcp-service", () => ({ mcpService: {}, handleWhatsAppToggle: vi.fn() }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: {} }))
vi.mock("./state", () => ({ agentSessionStateManager: {}, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./memory-service", () => ({ memoryService: {} }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ setSessionUserResponse: vi.fn() }))
vi.mock("./skills-service", () => ({ skillsService: { getSkill: getSkillMock, upgradeGitHubSkillToLocal: vi.fn() } }))

const parseToolPayload = (result: any) => JSON.parse(result.content[0].text)

describe("execute_command builtin tool", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    execMock.mockImplementation((_command: string, _options: unknown, callback: (error: unknown, stdout: string, stderr: string) => void) => {
      callback(null, "ok\n", "")
    })
  })

  it("treats skillId='default' as no skill selection", async () => {
    const { executeBuiltinTool } = await import("./builtin-tools")

    const result = await executeBuiltinTool("execute_command", { command: "pwd", skillId: "default" })
    const payload = parseToolPayload(result)

    expect(result?.isError).toBe(false)
    expect(payload.success).toBe(true)
    expect(payload.skillName).toBeUndefined()
    expect(getSkillMock).not.toHaveBeenCalled()
    expect(execMock).toHaveBeenCalledWith(
      "pwd",
      expect.objectContaining({ shell: expect.any(String), timeout: 30000 }),
      expect.any(Function),
    )
  })

  it("still rejects unknown explicit skill ids", async () => {
    getSkillMock.mockReturnValue(undefined)
    const { executeBuiltinTool } = await import("./builtin-tools")

    const result = await executeBuiltinTool("execute_command", { command: "pwd", skillId: "missing-skill" })
    const payload = parseToolPayload(result)

    expect(result?.isError).toBe(true)
    expect(payload.success).toBe(false)
    expect(payload.error).toBe("Skill not found: missing-skill")
    expect(execMock).not.toHaveBeenCalled()
  })
})