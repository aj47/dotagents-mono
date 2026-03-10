import { beforeEach, describe, expect, it, vi } from "vitest"

const mockConfig = {
  mcpToolsProviderId: "openai",
  mcpVerifyCompletionEnabled: true,
  mcpVerifyRetryCount: 0,
  mcpFinalSummaryEnabled: false,
  currentModelPresetId: undefined,
  modelPresets: [],
}
const makeLLMCallWithFetchMock = vi.fn()
const verifyCompletionWithFetchMock = vi.fn()
const endAgentTraceMock = vi.fn()
const sessionResponses = new Map<string, string>()
const sessionResponseHistory = new Map<string, string[]>()

vi.mock("./config", () => ({ configStore: { get: () => mockConfig } }))
vi.mock("./mcp-service", () => ({}))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./llm-fetch", () => ({
  makeLLMCallWithFetch: makeLLMCallWithFetchMock,
  makeTextCompletionWithFetch: vi.fn(),
  verifyCompletionWithFetch: verifyCompletionWithFetchMock,
  makeLLMCallWithStreamingAndTools: makeLLMCallWithFetchMock,
}))
vi.mock("./system-prompts", () => ({ constructSystemPrompt: vi.fn(() => "system prompt") }))
vi.mock("./state", () => ({
  state: { shouldStopAgent: false, isAgentModeActive: false, agentIterationCount: 0 },
  agentSessionStateManager: {
    shouldStopSession: vi.fn(() => false),
    getSessionProfileSnapshot: vi.fn(() => undefined),
    createSession: vi.fn(),
    startSessionRun: vi.fn(() => 1),
    updateIterationCount: vi.fn(),
    cleanupSession: vi.fn(),
  },
}))
vi.mock("./debug", () => ({ isDebugLLM: () => false, logLLM: vi.fn(), isDebugTools: () => false, logTools: vi.fn() }))
vi.mock("./context-budget", () => ({ shrinkMessagesForLLM: vi.fn(async ({ messages }) => ({ messages, estTokensAfter: 0, maxTokens: 8000 })), estimateTokensFromMessages: vi.fn(() => 0) }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn(async () => undefined) }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { isSessionSnoozed: vi.fn(() => false), getSession: vi.fn(() => undefined) } }))
vi.mock("./conversation-service", () => ({ conversationService: { addMessageToConversation: vi.fn(async () => undefined) } }))
vi.mock("../shared", () => ({ getCurrentPresetName: vi.fn(() => "OpenAI") }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: vi.fn(() => true), createAgentTrace: vi.fn(() => null), endAgentTrace: endAgentTraceMock, flushLangfuse: vi.fn(async () => undefined) }))
vi.mock("./summarization-service", () => ({
  isSummarizationEnabled: vi.fn(() => false),
  shouldSummarizeStep: vi.fn(() => false),
  summarizeAgentStep: vi.fn(),
  summarizationService: { getSummaries: vi.fn(() => []), getLatestSummary: vi.fn(() => undefined), addSummary: vi.fn() },
}))
vi.mock("./memory-service", () => ({ memoryService: { getAllMemories: vi.fn(async () => []) } }))
vi.mock("./session-user-response-store", () => ({
  setSessionUserResponse: (sessionId: string, text: string) => {
    const current = sessionResponses.get(sessionId)
    const history = sessionResponseHistory.get(sessionId) || []
    if (current && current !== text) history.push(current)
    sessionResponses.set(sessionId, text)
    sessionResponseHistory.set(sessionId, history)
  },
  getSessionUserResponse: (sessionId: string) => sessionResponses.get(sessionId),
  getSessionUserResponseHistory: (sessionId: string) => sessionResponseHistory.get(sessionId) || [],
  clearSessionUserResponse: (sessionId: string) => { sessionResponses.delete(sessionId); sessionResponseHistory.delete(sessionId) },
}))
vi.mock("../shared/builtin-tool-names", () => ({ MARK_WORK_COMPLETE_TOOL: "mark_work_complete", RESPOND_TO_USER_TOOL: "respond_to_user", INTERNAL_COMPLETION_NUDGE_TEXT: "please mark work complete" }))
vi.mock("./conversation-history-utils", () => ({ filterEphemeralMessages: (history: any[]) => history.filter((message) => !message.ephemeral) }))
vi.mock("./llm-tool-gating", () => ({ filterNamedItemsToAllowedTools: (items: any[]) => ({ allowed: items || [], removed: [] }) }))
vi.mock("../shared/message-display-utils", () => ({ sanitizeMessageContentForDisplay: (content: string) => content }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: vi.fn(() => undefined) } }))
vi.mock("./skills-service", () => ({ skillsService: { getSkills: vi.fn(() => []), getEnabledSkillsInstructionsForProfile: vi.fn(() => undefined) } }))

describe("processTranscriptWithAgentMode final output normalization", () => {
  beforeEach(() => {
    vi.resetModules()
    makeLLMCallWithFetchMock.mockReset()
    verifyCompletionWithFetchMock.mockReset()
    endAgentTraceMock.mockReset()
    sessionResponses.clear()
    sessionResponseHistory.clear()
  })

  it("returns and traces the latest plain assistant message when earlier finalContent goes stale", async () => {
    makeLLMCallWithFetchMock
      .mockResolvedValueOnce({
        content: "Earlier final answer that the verifier should reject because a newer user-facing update arrives later in the run.",
        toolCalls: [{ name: "mark_work_complete", arguments: {} }],
      })
      .mockResolvedValueOnce({ content: "Cleanup is done and one Langfuse bug-fix loop is already running." })
    verifyCompletionWithFetchMock.mockResolvedValueOnce({ isComplete: false, missingItems: ["latest user-facing output"] })

    const { processTranscriptWithAgentMode } = await import("./llm")
    const result = await processTranscriptWithAgentMode(
      "clean it up first",
      [{ name: "mark_work_complete", description: "done", inputSchema: { type: "object", properties: {} } } as any],
      async () => ({ content: [{ type: "text", text: "completed" }], isError: false }),
      2,
      undefined,
      undefined,
      "session-latest-output",
    )

    expect(result.content).toBe("Cleanup is done and one Langfuse bug-fix loop is already running.")
    expect(endAgentTraceMock).toHaveBeenCalledWith(
      "session-latest-output",
      expect.objectContaining({ output: "Cleanup is done and one Langfuse bug-fix loop is already running." }),
    )
  })

  it("returns and traces stored respond_to_user text when only tool-call wrappers reached finalContent", async () => {
    makeLLMCallWithFetchMock.mockResolvedValueOnce({
      content: "[respond_to_user] {\"text\":\"Actual final user-facing response\"}",
      toolCalls: [{ name: "respond_to_user", arguments: { text: "Actual final user-facing response" } }],
    })

    const { processTranscriptWithAgentMode } = await import("./llm")
    const { setSessionUserResponse } = await import("./session-user-response-store")
    const result = await processTranscriptWithAgentMode(
      "send the final answer",
      [{ name: "respond_to_user", description: "reply", inputSchema: { type: "object", properties: {} } } as any],
      async (toolCall: any) => {
        if (toolCall.name === "respond_to_user") setSessionUserResponse("session-respond-to-user", toolCall.arguments.text)
        return { content: [{ type: "text", text: "sent" }], isError: false }
      },
      1,
      undefined,
      undefined,
      "session-respond-to-user",
    )

    expect(result.content).toBe("Actual final user-facing response")
    expect(endAgentTraceMock).toHaveBeenCalledWith(
      "session-respond-to-user",
      expect.objectContaining({ output: "Actual final user-facing response" }),
    )
  })
})