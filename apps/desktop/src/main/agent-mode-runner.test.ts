import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  configGet: vi.fn(),
  trySaveConfig: vi.fn(),
  getCurrentProfile: vi.fn(),
  getAllProfiles: vi.fn(),
  createSessionSnapshotFromProfile: vi.fn(),
  startSession: vi.fn(),
  updateSession: vi.fn(),
  completeSession: vi.fn(),
  errorSession: vi.fn(),
  getTrackerProfileSnapshot: vi.fn(),
  getStateProfileSnapshot: vi.fn(),
  startSessionRun: vi.fn(),
  cleanupSession: vi.fn(),
  shouldStopSession: vi.fn(),
  requestApproval: vi.fn(),
  getInitializationStatus: vi.fn(),
  initialize: vi.fn(),
  registerExistingProcessesWithAgentManager: vi.fn(),
  getAvailableTools: vi.fn(),
  getAvailableToolsForProfile: vi.fn(),
  executeToolCall: vi.fn(),
  processTranscriptWithAgentMode: vi.fn(),
  processTranscriptWithACPAgent: vi.fn(),
  resolvePreferredTopLevelAcpAgentSelection: vi.fn(),
  emitAgentProgress: vi.fn(),
  addMessageToConversation: vi.fn(),
  createConversationWithId: vi.fn(),
  generateConversationIdPublic: vi.fn(),
  loadConversation: vi.fn(),
}))

vi.mock("./config", () => ({
  configStore: { get: mocks.configGet },
  trySaveConfig: mocks.trySaveConfig,
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getCurrentProfile: mocks.getCurrentProfile,
    getAll: mocks.getAllProfiles,
  },
  createSessionSnapshotFromProfile: mocks.createSessionSnapshotFromProfile,
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    startSession: mocks.startSession,
    updateSession: mocks.updateSession,
    completeSession: mocks.completeSession,
    errorSession: mocks.errorSession,
    getSessionProfileSnapshot: mocks.getTrackerProfileSnapshot,
  },
}))

vi.mock("./state", () => ({
  agentSessionStateManager: {
    getSessionProfileSnapshot: mocks.getStateProfileSnapshot,
    startSessionRun: mocks.startSessionRun,
    cleanupSession: mocks.cleanupSession,
    shouldStopSession: mocks.shouldStopSession,
  },
  toolApprovalManager: {
    requestApproval: mocks.requestApproval,
  },
}))

vi.mock("./mcp-service", () => ({
  mcpService: {
    getInitializationStatus: mocks.getInitializationStatus,
    initialize: mocks.initialize,
    registerExistingProcessesWithAgentManager: mocks.registerExistingProcessesWithAgentManager,
    getAvailableTools: mocks.getAvailableTools,
    getAvailableToolsForProfile: mocks.getAvailableToolsForProfile,
    executeToolCall: mocks.executeToolCall,
  },
}))

vi.mock("./llm", () => ({
  processTranscriptWithAgentMode: mocks.processTranscriptWithAgentMode,
}))

vi.mock("./acp-main-agent", () => ({
  processTranscriptWithACPAgent: mocks.processTranscriptWithACPAgent,
}))

vi.mock("./main-agent-selection", () => ({
  resolvePreferredTopLevelAcpAgentSelection: mocks.resolvePreferredTopLevelAcpAgentSelection,
}))

vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: mocks.emitAgentProgress,
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    addMessageToConversation: mocks.addMessageToConversation,
    createConversationWithId: mocks.createConversationWithId,
    generateConversationIdPublic: mocks.generateConversationIdPublic,
    loadConversation: mocks.loadConversation,
  },
}))

vi.mock("./error-utils", () => ({
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}))

describe("agent-mode-runner", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.configGet.mockReturnValue({
      mainAgentMode: "api",
      mainAgentName: "",
      acpAgents: [],
      mcpRequireApprovalBeforeToolCall: false,
      mcpUnlimitedIterations: false,
      mcpMaxIterations: 5,
      remoteServerAutoShowPanel: false,
    })
    mocks.getCurrentProfile.mockReturnValue(undefined)
    mocks.getAllProfiles.mockReturnValue([])
    mocks.resolvePreferredTopLevelAcpAgentSelection.mockReturnValue(null)
    mocks.startSession.mockReturnValue("session-new")
    mocks.startSessionRun.mockReturnValue(7)
    mocks.shouldStopSession.mockReturnValue(false)
    mocks.getInitializationStatus.mockReturnValue({
      isInitializing: false,
      progress: { current: 0, total: 0, currentServer: undefined },
    })
    mocks.initialize.mockResolvedValue(undefined)
    mocks.emitAgentProgress.mockResolvedValue(undefined)
    mocks.getAvailableTools.mockReturnValue([])
    mocks.getAvailableToolsForProfile.mockReturnValue([])
    mocks.processTranscriptWithAgentMode.mockResolvedValue({
      content: "done",
      conversationHistory: [],
    })
    mocks.processTranscriptWithACPAgent.mockResolvedValue({
      success: true,
      response: "delegated answer",
    })
    mocks.generateConversationIdPublic.mockReturnValue("generated-conversation")
  })

  it("maps stored conversation history when continuing a prompt", async () => {
    mocks.addMessageToConversation.mockResolvedValue({
      id: "conv-1",
      messages: [
        {
          role: "assistant",
          content: "Earlier answer",
          timestamp: 10,
          toolCalls: [{ name: "respond_to_user", arguments: { text: "Earlier answer" } }],
          toolResults: [{ success: true, content: "saved tool output" }],
        },
        {
          role: "user",
          content: "Current prompt",
          timestamp: 20,
          toolCalls: [],
          toolResults: [],
        },
      ],
    })

    const { prepareConversationForPrompt } = await import("./agent-mode-runner")
    const result = await prepareConversationForPrompt("Current prompt", "conv-1")

    expect(result).toEqual({
      conversationId: "conv-1",
      previousConversationHistory: [
        {
          role: "assistant",
          content: "Earlier answer",
          timestamp: 10,
          toolCalls: [{ name: "respond_to_user", arguments: { text: "Earlier answer" } }],
          toolResults: [
            {
              content: [{ type: "text", text: "saved tool output" }],
              isError: false,
            },
          ],
        },
      ],
    })
  })

  it("uses inline approvals for the standard agent path", async () => {
    mocks.configGet.mockReturnValue({
      mainAgentMode: "api",
      mainAgentName: "",
      acpAgents: [],
      mcpRequireApprovalBeforeToolCall: true,
      mcpUnlimitedIterations: false,
      mcpMaxIterations: 5,
    })
    mocks.requestApproval.mockReturnValue({
      approvalId: "approval-1",
      promise: Promise.resolve(false),
    })
    mocks.processTranscriptWithAgentMode.mockImplementation(
      async (_text, _tools, executeToolCall) => {
        const result = await executeToolCall({
          name: "dangerous_tool",
          arguments: { path: "/tmp/demo.txt" },
        })
        return {
          content: result.content[0]?.text || "",
          conversationHistory: [],
        }
      },
    )

    const { runTopLevelAgentMode } = await import("./agent-mode-runner")
    const result = await runTopLevelAgentMode({
      text: "Run this tool",
      conversationId: "conv-inline",
      existingSessionId: "session-inline",
      approvalMode: "inline",
    })

    expect(mocks.requestApproval).toHaveBeenCalledWith(
      "session-inline",
      "dangerous_tool",
      { path: "/tmp/demo.txt" },
    )
    expect(mocks.executeToolCall).not.toHaveBeenCalled()
    expect(mocks.completeSession).toHaveBeenCalledWith(
      "session-inline",
      "Agent completed successfully",
    )
    expect(result.content).toBe("Tool call denied by user: dangerous_tool")
  })

  it("routes ACP-backed runs through the delegated agent path", async () => {
    mocks.configGet.mockReturnValue({
      mainAgentMode: "acp",
      mainAgentName: "legacy-agent",
      acpAgents: [],
      mcpRequireApprovalBeforeToolCall: false,
      mcpUnlimitedIterations: false,
      mcpMaxIterations: 5,
    })
    mocks.resolvePreferredTopLevelAcpAgentSelection.mockReturnValue({
      resolvedName: "shared-agent",
      source: "main-agent",
      repairedName: "shared-agent",
    })

    const { runTopLevelAgentMode } = await import("./agent-mode-runner")
    const result = await runTopLevelAgentMode({
      text: "Delegate this",
      conversationId: "conv-acp",
      existingSessionId: "session-acp",
    })

    expect(mocks.trySaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ mainAgentName: "shared-agent" }),
    )
    expect(mocks.processTranscriptWithACPAgent).toHaveBeenCalledWith(
      "Delegate this",
      expect.objectContaining({
        agentName: "shared-agent",
        conversationId: "conv-acp",
        sessionId: "session-acp",
        runId: 7,
      }),
    )
    expect(mocks.cleanupSession).toHaveBeenCalledWith("session-acp")
    expect(result).toMatchObject({
      content: "delegated answer",
      usedAcp: true,
    })
  })
})
