import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

let currentConfig: any

const mocks = vi.hoisted(() => ({
  makeLLMCallWithFetch: vi.fn(),
  makeLLMCallWithStreamingAndTools: vi.fn(),
  verifyCompletionWithFetch: vi.fn(),
  emitAgentProgress: vi.fn(() => Promise.resolve()),
  addMessageToConversation: vi.fn(async (id: string) => ({ id })),
  maybeAutoGenerateConversationTitle: vi.fn(async () => undefined),
  createSession: vi.fn(),
  startSessionRun: vi.fn(() => 1),
  getSessionProfileSnapshot: vi.fn(() => undefined),
  shouldStopSession: vi.fn(() => false),
  updateIterationCount: vi.fn(),
  cleanupSession: vi.fn(),
  isSessionSnoozed: vi.fn(() => false),
  getSession: vi.fn((id: string) => ({ id, conversationTitle: "Test conversation" })),
  updateSession: vi.fn(),
  getCurrentProfile: vi.fn(() => undefined),
  getSkills: vi.fn(() => []),
  getEnabledSkillsInstructionsForProfile: vi.fn(() => ""),
}))

vi.mock("./config", () => ({
  configStore: { get: () => currentConfig },
  globalAgentsFolder: "/tmp/global-agents",
  resolveWorkspaceAgentsFolder: () => "/tmp/workspace-agents",
}))
vi.mock("./llm-fetch", () => ({
  makeLLMCallWithFetch: mocks.makeLLMCallWithFetch,
  makeLLMCallWithStreamingAndTools: mocks.makeLLMCallWithStreamingAndTools,
  verifyCompletionWithFetch: mocks.verifyCompletionWithFetch,
  makeTextCompletionWithFetch: vi.fn(),
}))
vi.mock("./system-prompts", () => ({ constructSystemPrompt: vi.fn(() => "system prompt") }))
vi.mock("./state", () => ({ state: {}, agentSessionStateManager: mocks }))
vi.mock("./debug", () => ({ isDebugLLM: () => false, isDebugTools: () => false, logLLM: vi.fn(), logTools: vi.fn(), logApp: vi.fn() }))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./context-budget", () => ({
  shrinkMessagesForLLM: vi.fn(async ({ messages }: any) => ({ messages, estTokensAfter: 0, maxTokens: 0, appliedStrategies: [] })),
  estimateTokensFromMessages: vi.fn(() => 0),
  clearActualTokenUsage: vi.fn(), clearIterativeSummary: vi.fn(), clearContextRefs: vi.fn(), clearArchiveFrontier: vi.fn(),
}))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: mocks.emitAgentProgress }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: mocks }))
vi.mock("./conversation-service", () => ({ conversationService: { addMessageToConversation: mocks.addMessageToConversation, maybeAutoGenerateConversationTitle: mocks.maybeAutoGenerateConversationTitle } }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: vi.fn(() => false), createAgentTrace: vi.fn(), endAgentTrace: vi.fn(), flushLangfuse: vi.fn(async () => undefined) }))
vi.mock("./summarization-service", () => ({ isSummarizationEnabled: vi.fn(() => false), shouldSummarizeStep: vi.fn(() => false), summarizeAgentStep: vi.fn(), summarizationService: { getSummaries: vi.fn(() => []), getLatestSummary: vi.fn(() => undefined), addSummary: vi.fn() } }))
vi.mock("./knowledge-notes-service", () => ({ knowledgeNotesService: { createNoteFromSummary: vi.fn(), saveNote: vi.fn() } }))
vi.mock("./agent-run-utils", () => ({ appendAgentStopNote: vi.fn(), resolveAgentIterationLimits: vi.fn((maxIterations: number) => ({ loopMaxIterations: maxIterations, guardrailBudget: maxIterations })) }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: mocks.getCurrentProfile } }))
vi.mock("./skills-service", () => ({ skillsService: { getSkills: mocks.getSkills, getEnabledSkillsInstructionsForProfile: mocks.getEnabledSkillsInstructionsForProfile } }))
vi.mock("./working-notes-runtime", () => ({ loadWorkingKnowledgeNotesForPrompt: vi.fn(() => []) }))

const availableTools = [
  { name: "respond_to_user", description: "Respond to the user", inputSchema: { type: "object", properties: {} } },
  { name: "mark_work_complete", description: "Mark work complete", inputSchema: { type: "object", properties: {} } },
]

function makeExecuteToolCall(sessionId: string, runId: number) {
  return async (toolCall: any) => {
    if (toolCall.name === "respond_to_user") {
      const { appendSessionUserResponse } = await import("./session-user-response-store")
      appendSessionUserResponse({ sessionId, runId, text: String(toolCall.arguments?.text ?? "") })
    }
    return { content: [{ type: "text" as const, text: JSON.stringify({ success: true }) }], isError: false }
  }
}

async function clearResponses(...sessionIds: string[]) {
  const { clearSessionUserResponse } = await import("./session-user-response-store")
  sessionIds.forEach((sessionId) => clearSessionUserResponse(sessionId))
}

describe("processTranscriptWithAgentMode respond_to_user history", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    currentConfig = {
      mcpToolsProviderId: "openai",
      mcpToolsOpenaiModel: "gpt-4.1-mini",
      currentModelPresetId: undefined,
      modelPresets: [],
      mcpVerifyCompletionEnabled: false,
      mcpFinalSummaryEnabled: false,
    }
  })

  afterEach(async () => {
    await clearResponses("session-list", "session-followup", "session-verify")
  })

  it("preserves earlier numbered respond_to_user content in the next turn prompt", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "1. Alpha\n2. Beta\n3. Gamma" } },
        { name: "respond_to_user", arguments: { text: "Reply with the numbers you want." } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Listed choices" } }] })

    const firstRun = await processTranscriptWithAgentMode("Give me options", availableTools as any, makeExecuteToolCall("session-list", 1), 4, [], "conv-list", "session-list", undefined, undefined, 1)
    expect(firstRun.content).toBe("Reply with the numbers you want.")
    expect(firstRun.conversationHistory.filter((m) => m.role === "assistant" && m.content.includes("1. Alpha"))).toHaveLength(1)

    mocks.makeLLMCallWithStreamingAndTools.mockClear()
    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "Great — I'll focus on 2, 3, 5, 6, and 14." } },
      { name: "mark_work_complete", arguments: { summary: "Captured selected items" } },
    ] })

    await processTranscriptWithAgentMode("i like 2, 3, 5, 6, 14", availableTools as any, makeExecuteToolCall("session-followup", 1), 3, firstRun.conversationHistory as any, "conv-list", "session-followup", undefined, undefined, 1)

    const secondPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? []).map((message: any) => message.content).join("\n")
    expect(secondPrompt).toContain("1. Alpha")
    expect(secondPrompt).toContain("Reply with the numbers you want.")
  })

  it("keeps a verified explicit final response to one assistant message", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "Clean final answer" } },
      { name: "mark_work_complete", arguments: { summary: "Done" } },
    ] })
    mocks.verifyCompletionWithFetch.mockResolvedValue({ isComplete: true, conversationState: "complete", confidence: 0.96, missingItems: [] })

    const result = await processTranscriptWithAgentMode("Finish this", availableTools as any, makeExecuteToolCall("session-verify", 7), 3, [], "conv-verify", "session-verify", undefined, undefined, 7)

    expect(result.content).toBe("Clean final answer")
    expect(result.conversationHistory.filter((m) => m.role === "assistant" && m.content === "Clean final answer")).toHaveLength(1)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(1)
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(1)
  })
})