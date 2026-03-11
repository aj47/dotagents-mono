import { beforeEach, describe, expect, it, vi } from "vitest"

const mockAddMessageToConversation = vi.fn(() => Promise.resolve())
const mockEmitAgentProgress = vi.fn(() => Promise.resolve())
const mockConstructSystemPrompt = vi.fn(() => "system prompt")
const mockMakeLLMCallWithFetch = vi.fn()
const mockMakeLLMCallWithStreamingAndTools = vi.fn()
const mockGetCurrentProfile = vi.fn(() => null)
const mockGetSkills = vi.fn(() => [])
const mockGetEnabledSkillsInstructionsForProfile = vi.fn(() => undefined)
const mockGetAllMemories = vi.fn(() => Promise.resolve([]))
const mockCreateSession = vi.fn()
const mockGetSessionProfileSnapshot = vi.fn(() => undefined)
const mockCleanupSession = vi.fn()
const mockClearSessionUserResponse = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: () => ({
      mcpToolsProviderId: "openai",
      modelPresets: [],
      currentModelPresetId: undefined,
    }),
  },
}))

vi.mock("./diagnostics", () => ({
  diagnosticsService: {
    logWarning: vi.fn(),
    logError: vi.fn(),
  },
}))

vi.mock("./llm-fetch", () => ({
  makeLLMCallWithFetch: mockMakeLLMCallWithFetch,
  makeTextCompletionWithFetch: vi.fn(),
  verifyCompletionWithFetch: vi.fn(),
  makeLLMCallWithStreamingAndTools: mockMakeLLMCallWithStreamingAndTools,
}))

vi.mock("./system-prompts", () => ({
  constructSystemPrompt: mockConstructSystemPrompt,
}))

vi.mock("./state", () => ({
  state: { pendingToolApprovals: new Map(), isShuttingDown: false },
  agentSessionStateManager: {
    getSessionProfileSnapshot: mockGetSessionProfileSnapshot,
    createSession: mockCreateSession,
    startSessionRun: vi.fn(() => 1),
    cleanupSession: mockCleanupSession,
  },
}))

vi.mock("./debug", () => ({
  isDebugLLM: vi.fn(() => false),
  logLLM: vi.fn(),
  isDebugTools: vi.fn(() => false),
  logTools: vi.fn(),
}))

vi.mock("./context-budget", () => ({
  shrinkMessagesForLLM: vi.fn((messages) => messages),
  estimateTokensFromMessages: vi.fn(() => 0),
}))

vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: mockEmitAgentProgress,
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    isSessionSnoozed: vi.fn(() => false),
    getSession: vi.fn(() => undefined),
  },
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    addMessageToConversation: mockAddMessageToConversation,
  },
}))

vi.mock("../shared", () => ({
  getCurrentPresetName: vi.fn(() => "OpenAI"),
}))

vi.mock("./langfuse-service", () => ({
  createAgentTrace: vi.fn(),
  endAgentTrace: vi.fn(),
  isLangfuseEnabled: vi.fn(() => false),
  flushLangfuse: vi.fn(() => Promise.resolve()),
}))

vi.mock("./summarization-service", () => ({
  isSummarizationEnabled: vi.fn(() => false),
  shouldSummarizeStep: vi.fn(() => false),
  summarizeAgentStep: vi.fn(),
  summarizationService: {
    getSummaries: vi.fn(() => []),
    getLatestSummary: vi.fn(() => undefined),
  },
}))

vi.mock("./memory-service", () => ({
  memoryService: {
    getAllMemories: mockGetAllMemories,
    saveMemory: vi.fn(() => Promise.resolve()),
    createMemoryFromSummary: vi.fn(() => null),
  },
}))

vi.mock("./session-user-response-store", () => ({
  clearSessionUserResponse: mockClearSessionUserResponse,
  getSessionUserResponse: vi.fn(() => undefined),
  getSessionUserResponseHistory: vi.fn(() => []),
}))

vi.mock("./agent-run-utils", () => ({
  appendAgentStopNote: vi.fn((content: string) => content),
  resolveAgentIterationLimits: vi.fn((maxIterations: number) => ({
    loopMaxIterations: maxIterations,
    guardrailBudget: 0,
  })),
}))

vi.mock("./conversation-history-utils", () => ({
  filterEphemeralMessages: vi.fn((history) => history),
}))

vi.mock("./llm-tool-gating", () => ({
  filterNamedItemsToAllowedTools: vi.fn((items) => items),
}))

vi.mock("./agent-terminal-error", () => ({
  appendAndPersistTerminalAssistantMessage: vi.fn(() => Promise.resolve()),
  buildUnexpectedAgentFailureMessage: vi.fn(() => "unexpected failure"),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getCurrentProfile: mockGetCurrentProfile,
  },
}))

vi.mock("./skills-service", () => ({
  skillsService: {
    getSkills: mockGetSkills,
    getEnabledSkillsInstructionsForProfile: mockGetEnabledSkillsInstructionsForProfile,
  },
}))

describe("llm low-context guard", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockAddMessageToConversation.mockResolvedValue(undefined)
    mockEmitAgentProgress.mockResolvedValue(undefined)
    mockGetCurrentProfile.mockReturnValue(null)
    mockGetSkills.mockReturnValue([])
    mockGetEnabledSkillsInstructionsForProfile.mockReturnValue(undefined)
    mockGetAllMemories.mockResolvedValue([])
    mockGetSessionProfileSnapshot.mockReturnValue(undefined)
  })

  it("short-circuits bare next-step prompts before loading heavy context or LLM work", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const progressUpdates: Array<Record<string, unknown>> = []
    const executeToolCall = vi.fn()

    const result = await processTranscriptWithAgentMode(
      "What should I do next?",
      [{ name: "execute_command", description: "Run shell commands", inputSchema: { type: "object" } }],
      executeToolCall,
      10,
      undefined,
      "conversation-1",
      "session-1",
      (update) => progressUpdates.push(update as unknown as Record<string, unknown>),
      undefined,
      1,
    )

    expect(result).toEqual(expect.objectContaining({
      content: expect.stringContaining("I need a bit more context before I can suggest the next step."),
      totalIterations: 0,
    }))
    expect(executeToolCall).not.toHaveBeenCalled()
    expect(mockConstructSystemPrompt).not.toHaveBeenCalled()
    expect(mockMakeLLMCallWithFetch).not.toHaveBeenCalled()
    expect(mockMakeLLMCallWithStreamingAndTools).not.toHaveBeenCalled()
    expect(mockGetCurrentProfile).not.toHaveBeenCalled()
    expect(mockGetSkills).not.toHaveBeenCalled()
    expect(mockGetAllMemories).not.toHaveBeenCalled()

    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      "What should I do next?",
      "user",
      undefined,
      undefined,
    )
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      expect.stringContaining("I need a bit more context before I can suggest the next step."),
      "assistant",
      undefined,
      undefined,
    )
    expect(progressUpdates.at(-1)).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: expect.stringContaining("I need a bit more context before I can suggest the next step."),
      userResponse: expect.stringContaining("I need a bit more context before I can suggest the next step."),
      userResponseHistory: [
        expect.stringContaining("I need a bit more context before I can suggest the next step."),
      ],
    }))
    expect(mockClearSessionUserResponse).toHaveBeenCalledWith("session-1")
    expect(mockCreateSession).toHaveBeenCalledWith("session-1", undefined)
    expect(mockCleanupSession).toHaveBeenCalledWith("session-1")
  })
})