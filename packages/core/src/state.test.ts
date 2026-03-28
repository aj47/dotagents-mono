import { beforeEach, describe, expect, it, vi } from "vitest"

describe("toolApprovalManager session handlers", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("auto-resolves approvals through registered session handlers", async () => {
    const { agentSessionStateManager, toolApprovalManager } = await import("./state")

    agentSessionStateManager.createSession("session-cli")
    const handler = vi.fn().mockResolvedValue(true)
    toolApprovalManager.registerSessionApprovalHandler("session-cli", handler)

    const { promise } = toolApprovalManager.requestApproval("session-cli", "fs/read_text_file", {
      path: "/tmp/demo.txt",
    })

    await expect(promise).resolves.toBe(true)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-cli",
        toolName: "fs/read_text_file",
      }),
    )
    expect(toolApprovalManager.getPendingApprovalCount()).toBe(0)
  })

  it("removes session handlers during cleanup so future approvals do not auto-resolve", async () => {
    const { agentSessionStateManager, toolApprovalManager } = await import("./state")

    agentSessionStateManager.createSession("session-cleanup")
    const handler = vi.fn().mockResolvedValue(true)
    toolApprovalManager.registerSessionApprovalHandler("session-cleanup", handler)

    agentSessionStateManager.cleanupSession("session-cleanup")

    const { promise } = toolApprovalManager.requestApproval("session-cleanup", "fs/read_text_file", {
      path: "/tmp/demo.txt",
    })

    const raced = await Promise.race([
      promise.then(() => "resolved"),
      new Promise<string>((resolve) => setTimeout(() => resolve("pending"), 0)),
    ])

    expect(raced).toBe("pending")
    expect(handler).not.toHaveBeenCalled()

    toolApprovalManager.cancelAllApprovals()
    await expect(promise).resolves.toBe(false)
  })

  it("keeps shared runtime flags active while another session is still registered", async () => {
    const { agentSessionStateManager, state } = await import("./state")

    agentSessionStateManager.startSessionRun("session-one")
    agentSessionStateManager.startSessionRun("session-two")
    agentSessionStateManager.updateIterationCount("session-two", 4)

    agentSessionStateManager.cleanupSession("session-one")

    expect(state.isAgentModeActive).toBe(true)
    expect(state.agentIterationCount).toBe(4)
    expect(agentSessionStateManager.getActiveSessionCount()).toBe(1)

    agentSessionStateManager.cleanupSession("session-two")

    expect(state.isAgentModeActive).toBe(false)
    expect(state.agentIterationCount).toBe(0)
  })
})
