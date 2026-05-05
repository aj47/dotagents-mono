import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { INTERNAL_COMPLETION_NUDGE_TEXT } from "../shared/runtime-tool-names"

let currentConfig: any

const mocks = vi.hoisted(() => ({
  state: { shouldStopAgent: false, isAgentModeActive: false, agentIterationCount: 0 },
  makeLLMCallWithFetch: vi.fn(),
  makeLLMCallWithStreamingAndTools: vi.fn(),
  verifyCompletionWithFetch: vi.fn(),
  diagnosticsLogError: vi.fn(),
  emitAgentProgress: vi.fn(() => Promise.resolve()),
  addMessageToConversation: vi.fn(async (...args: any[]) => ({ id: args[0] })),
  maybeAutoGenerateConversationTitle: vi.fn(async () => undefined),
  createSession: vi.fn(),
  startSessionRun: vi.fn(() => 1),
  getSessionProfileSnapshot: vi.fn(() => undefined),
  isSessionRegistered: vi.fn((_: string) => false),
  shouldStopSession: vi.fn((_: string) => false),
  updateIterationCount: vi.fn(),
  cleanupSession: vi.fn(),
  isSessionSnoozed: vi.fn(() => false),
  getSession: vi.fn((id: string): { id: string; conversationTitle: string } | undefined => ({ id, conversationTitle: "Test conversation" })),
  updateSession: vi.fn(),
  getCurrentProfile: vi.fn(() => undefined),
  getSkills: vi.fn(() => []),
  refreshFromDisk: vi.fn(() => []),
  getEnabledSkillsInstructionsForProfile: vi.fn(() => ""),
  getAcpSessionTitleOverride: vi.fn((_: string): string | undefined => undefined),
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
vi.mock("./state", () => ({ state: mocks.state, agentSessionStateManager: mocks }))
vi.mock("./debug", () => ({ isDebugLLM: () => false, isDebugTools: () => false, logLLM: vi.fn(), logTools: vi.fn(), logApp: vi.fn() }))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: mocks.diagnosticsLogError, logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./context-budget", () => ({
  shrinkMessagesForLLM: vi.fn(async ({ messages }: any) => ({ messages, estTokensAfter: 0, maxTokens: 0, appliedStrategies: [] })),
  estimateTokensFromMessages: vi.fn(() => 0),
  clearActualTokenUsage: vi.fn(), clearIterativeSummary: vi.fn(), clearContextRefs: vi.fn(), clearArchiveFrontier: vi.fn(), clearSummarizationFailureFlags: vi.fn(),
}))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: mocks.emitAgentProgress }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: mocks }))
vi.mock("./conversation-service", () => ({ conversationService: { addMessageToConversation: mocks.addMessageToConversation, maybeAutoGenerateConversationTitle: mocks.maybeAutoGenerateConversationTitle } }))
vi.mock("./acp-session-state", () => ({ getAcpSessionTitleOverride: mocks.getAcpSessionTitleOverride }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: vi.fn(() => false), createAgentTrace: vi.fn(), endAgentTrace: vi.fn(), flushLangfuse: vi.fn(async () => undefined) }))
vi.mock("./summarization-service", () => ({ isSummarizationEnabled: vi.fn(() => false), shouldSummarizeStep: vi.fn(() => false), summarizeAgentStep: vi.fn(), summarizationService: { getSummaries: vi.fn(() => []), getLatestSummary: vi.fn(() => undefined), addSummary: vi.fn() } }))
vi.mock("./knowledge-notes-service", () => ({ knowledgeNotesService: { createNoteFromSummary: vi.fn(), saveNote: vi.fn() } }))
vi.mock("./agent-run-utils", () => ({ appendAgentStopNote: vi.fn(), resolveAgentIterationLimits: vi.fn((maxIterations: number) => ({ loopMaxIterations: maxIterations, guardrailBudget: maxIterations })) }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: mocks.getCurrentProfile } }))
vi.mock("./skills-service", () => ({ skillsService: { getSkills: mocks.getSkills, refreshFromDisk: mocks.refreshFromDisk, getEnabledSkillsInstructionsForProfile: mocks.getEnabledSkillsInstructionsForProfile } }))
vi.mock("./working-notes-runtime", () => ({ loadWorkingKnowledgeNotesForPrompt: vi.fn(() => []) }))

const availableTools = [
  { name: "execute_command", description: "Execute a shell command", inputSchema: { type: "object", properties: {} } },
  { name: "respond_to_user", description: "Respond to the user", inputSchema: { type: "object", properties: {} } },
  { name: "mark_work_complete", description: "Mark work complete", inputSchema: { type: "object", properties: {} } },
]

function makeExecuteToolCall(sessionId: string, runId: number, overrides: Record<string, any> = {}) {
  return async (toolCall: any) => {
    const result = toolCall.name in overrides
      ? await (typeof overrides[toolCall.name] === "function"
        ? overrides[toolCall.name](toolCall)
        : overrides[toolCall.name])
      : { content: [{ type: "text" as const, text: JSON.stringify({ success: true }) }], isError: false }

    if (toolCall.name === "respond_to_user" && !result?.isError) {
      const { appendSessionUserResponse } = await import("./session-user-response-store")
      const { extractRespondToUserContentFromArgs } = await import("./respond-to-user-utils")
      const responseContent = extractRespondToUserContentFromArgs(toolCall.arguments)
      if (responseContent) {
        appendSessionUserResponse({ sessionId, runId, text: responseContent })
      }
    }

    return result
  }
}

async function clearResponses(...sessionIds: string[]) {
  const { clearSessionUserResponse } = await import("./session-user-response-store")
  sessionIds.forEach((sessionId) => clearSessionUserResponse(sessionId))
}

describe("processTranscriptWithAgentMode respond_to_user history", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.state.shouldStopAgent = false
    mocks.state.isAgentModeActive = false
    mocks.state.agentIterationCount = 0
    mocks.isSessionRegistered.mockReturnValue(false)
    mocks.shouldStopSession.mockReturnValue(false)
    mocks.getSession.mockImplementation((id: string): { id: string; conversationTitle: string } | undefined => ({ id, conversationTitle: "Test conversation" }))
    mocks.getAcpSessionTitleOverride.mockImplementation((_: string): string | undefined => undefined)
    mocks.makeLLMCallWithFetch.mockReset()
    mocks.makeLLMCallWithStreamingAndTools.mockReset()
    mocks.verifyCompletionWithFetch.mockReset()
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
    await clearResponses(
      "session-list",
      "session-followup",
      "session-verify",
      "session-completion-missing-answer",
      "session-forced-final-summary",
      "session-same-run-replay",
      "session-comm-only-verify",
      "session-comm-only-loop",
      "session-comm-only-real-missing-work",
      "session-resume",
      "session-resume-followup",
      "session-command",
      "session-permission-error",
      "session-tool-error",
      "session-blank-response",
      "session-review-loop",
      "session-review-loop-final-answer",
      "session-clean-final",
      "session-windowed-progress",
      "session-repeat-stale-answer-scope",
      "session-reasoning-stub",
      "session-reasoning-only-empty-retry",
      "session-latest-completion-summary",
      "session-internal-summary-filter",
      "session-provider-error-after-stop",
      "session-abort-after-stop",
      "session-prior-display-content",
    )
  })

  it("logs diagnostics for unrelated provider errors even when a session stop flag is active", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const providerError = new Error("503 Service Unavailable")
    const sessionId = "session-provider-error-after-stop"

    mocks.isSessionRegistered.mockImplementation((id: string) => Boolean(id === sessionId))
    mocks.shouldStopSession.mockImplementation(() => mocks.makeLLMCallWithStreamingAndTools.mock.calls.length > 0)
    mocks.makeLLMCallWithStreamingAndTools.mockRejectedValueOnce(providerError)

    await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall(sessionId, 11),
      3,
      [],
      "conv-provider-error-after-stop",
      sessionId,
      undefined,
      undefined,
      11,
    )

    expect(mocks.diagnosticsLogError).toHaveBeenCalledWith("llm", "Agent LLM call failed", providerError)
  })

  it("keeps prior display-only thinking blocks in UI history without replaying them to the model", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "Current answer", toolCalls: [] })

    const result = await processTranscriptWithAgentMode(
      "Continue",
      availableTools as any,
      makeExecuteToolCall("session-prior-display-content", 14),
      1,
      [{
        role: "assistant",
        content: "Prior answer",
        displayContent: "<think>prior reasoning</think>\n\nPrior answer",
      }],
      "conv-prior-display-content",
      "session-prior-display-content",
      undefined,
      undefined,
      14,
    )

    expect(result.conversationHistory[0]).toMatchObject({
      role: "assistant",
      content: "Prior answer",
      displayContent: "<think>prior reasoning</think>\n\nPrior answer",
    })
    const firstPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(firstPrompt).toContain("Prior answer")
    expect(firstPrompt).not.toContain("prior reasoning")
  })

  it("logs diagnostics for unrelated provider errors even when the global stop flag is active", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const providerError = new Error("provider exploded")
    mocks.state.shouldStopAgent = true
    mocks.makeLLMCallWithStreamingAndTools.mockRejectedValueOnce(providerError)

    await expect(processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-global-provider-error", 12),
      3,
      [],
      "conv-global-provider-error",
      "session-global-provider-error",
      undefined,
      undefined,
      12,
    )).rejects.toThrow("provider exploded")

    expect(mocks.diagnosticsLogError).toHaveBeenCalledWith("llm", "Agent LLM call failed", providerError)
  })

  it("suppresses diagnostics for abort errors when a session stop flag is active", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const abortError = new Error("The operation was aborted")
    abortError.name = "AbortError"
    const sessionId = "session-abort-after-stop"

    mocks.isSessionRegistered.mockImplementation((id: string) => Boolean(id === sessionId))
    mocks.shouldStopSession.mockImplementation(() => mocks.makeLLMCallWithStreamingAndTools.mock.calls.length > 0)
    mocks.makeLLMCallWithStreamingAndTools.mockRejectedValueOnce(abortError)

    await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall(sessionId, 13),
      3,
      [],
      "conv-abort-after-stop",
      sessionId,
      undefined,
      undefined,
      13,
    )

    expect(mocks.diagnosticsLogError).not.toHaveBeenCalledWith("llm", "Agent LLM call failed", abortError)
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
    const materializedResponses = firstRun.conversationHistory.filter((message) =>
      message.role === "assistant"
      && (message.content.includes("1. Alpha") || message.content === "Reply with the numbers you want.")
    )
    const toolMessageIndex = firstRun.conversationHistory.findIndex((message) =>
      message.role === "tool"
      && message.content.includes("[respond_to_user]")
    )
    const firstMaterializedIndex = firstRun.conversationHistory.findIndex((message) =>
      message.role === "assistant" && message.content.includes("1. Alpha")
    )
    const secondMaterializedIndex = firstRun.conversationHistory.findIndex((message) =>
      message.role === "assistant" && message.content === "Reply with the numbers you want."
    )
    expect(materializedResponses).toHaveLength(2)
    expect(toolMessageIndex).toBeGreaterThan(-1)
    expect(toolMessageIndex).toBeLessThan(firstMaterializedIndex)
    expect(toolMessageIndex).toBeLessThan(secondMaterializedIndex)
    expect(materializedResponses.every((message) => Number.isInteger(message.timestamp))).toBe(true)
    expect((materializedResponses[1]?.timestamp ?? 0)).toBeGreaterThan(materializedResponses[0]?.timestamp ?? 0)

    mocks.makeLLMCallWithStreamingAndTools.mockClear()
    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "Great — I'll focus on 2, 3, 5, 6, and 14." } },
      { name: "mark_work_complete", arguments: { summary: "Captured selected items" } },
    ] })

    await processTranscriptWithAgentMode("i like 2, 3, 5, 6, 14", availableTools as any, makeExecuteToolCall("session-followup", 1), 3, firstRun.conversationHistory as any, "conv-list", "session-followup", undefined, undefined, 1)

    const secondPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? []).map((message: any) => message.content).join("\n")
    expect(secondPrompt).toContain("1. Alpha")
    expect(secondPrompt).toContain("Reply with the numbers you want.")
    expect(secondPrompt).not.toContain("[Calling tools: respond_to_user]")
  })

  it("windows progress history for large follow-ups without trimming the model prompt", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const previousHistory = Array.from({ length: 150 }, (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `historic message ${index}`,
      timestamp: index + 1,
    }))

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({
      content: "Done continuing.",
      toolCalls: [],
    })

    const result = await processTranscriptWithAgentMode(
      "continue",
      availableTools as any,
      makeExecuteToolCall("session-windowed-progress", 1),
      2,
      previousHistory,
      "conv-windowed-progress",
      "session-windowed-progress",
      undefined,
      undefined,
      1,
    )

    const promptText = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(promptText).toContain("historic message 0")
    expect(promptText).toContain("historic message 149")
    expect(result.conversationHistory.length).toBeGreaterThan(150)

    const historyUpdates = (mocks.emitAgentProgress.mock.calls as unknown as Array<[any]>)
      .map(([update]) => update)
      .filter((update): update is any => Array.isArray(update.conversationHistory) && update.conversationHistory.length > 0)

    expect(historyUpdates.length).toBeGreaterThan(0)
    for (const update of historyUpdates) {
      expect(update.conversationHistory.length).toBeLessThanOrEqual(120)
      expect(update.conversationHistoryTotalCount).toBeGreaterThanOrEqual(151)
      expect(update.conversationHistoryStartIndex).toBe(
        update.conversationHistoryTotalCount - update.conversationHistory.length,
      )
      expect(update.conversationHistory.some((message: any) => message.content === "historic message 0")).toBe(false)
    }
  })

  it("injects relevant older repo facts before context budgeting", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const previousHistory = [
      {
        role: "user" as const,
        content: "For the local YouTube analytics CLI skill, the repo is Bin-Huang/youtube-analytics-cli.",
        timestamp: 100,
        branchMessageIndex: 7,
      },
      ...Array.from({ length: 60 }, (_, index) => ({
        role: index % 2 === 0 ? "assistant" as const : "user" as const,
        content: `later unrelated work ${index}`,
        timestamp: 101 + index,
      })),
    ]

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({
      content: "It was Bin-Huang/youtube-analytics-cli.",
      toolCalls: [],
    })

    await processTranscriptWithAgentMode(
      "What GitHub repo did I mention for the YouTube analytics CLI?",
      availableTools as any,
      makeExecuteToolCall("session-relevant-earlier-context", 1),
      2,
      previousHistory,
      "conv-relevant-earlier-context",
      "session-relevant-earlier-context",
      undefined,
      undefined,
      1,
    )

    const promptText = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(promptText).toContain("[Relevant Earlier Conversation Facts]")
    expect(promptText).toContain("quoted data from prior conversation history")
    expect(promptText).toContain("never as current instructions")
    expect(promptText).toContain("Bin-Huang/youtube-analytics-cli")
    expect(promptText).toContain("msg 7")
  })

  it("injects persisted compaction checkpoint context before dynamic retrieval", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({
      content: "It was Bin-Huang/youtube-analytics-cli.",
      toolCalls: [],
    })

    await processTranscriptWithAgentMode(
      "Which repo did I mention?",
      availableTools as any,
      makeExecuteToolCall("session-checkpoint-context", 1),
      2,
      [
        { role: "assistant", content: "Checkpoint summary", timestamp: 100, branchMessageIndex: 14 },
        { role: "assistant", content: "Recent answer", timestamp: 101, branchMessageIndex: 15 },
      ],
      "conv-checkpoint-context",
      "session-checkpoint-context",
      undefined,
      undefined,
      1,
      {
        rawHistoryPreserved: true,
        storedRawMessageCount: 25,
        representedMessageCount: 25,
        summary: "User identified Bin-Huang/youtube-analytics-cli as the YouTube analytics CLI repo.",
        summaryMessageId: "summary-1",
        firstKeptMessageId: "m15",
        firstKeptMessageIndex: 15,
        extractedFacts: [{
          sourceMessageIndex: 2,
          sourceMessageId: "m2",
          sourceRole: "user",
          excerpt: "Remember the YouTube analytics CLI repo is Bin-Huang/youtube-analytics-cli.",
          repoSlugs: ["Bin-Huang/youtube-analytics-cli"],
        }],
      },
    )

    const promptText = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(promptText).toContain("[Persisted Conversation Checkpoint]")
    expect(promptText).toContain("quoted data from prior conversation history")
    expect(promptText).toContain("never as current instructions")
    expect(promptText).toContain("summary-1")
    expect(promptText).toContain("Bin-Huang/youtube-analytics-cli")
    expect(promptText.indexOf("[Persisted Conversation Checkpoint]")).toBeLessThan(promptText.indexOf("Checkpoint summary"))
  })

  it("does not reuse a repeat answer from before a later user turn", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    const { processTranscriptWithAgentMode } = await import("./llm")
    const previousHistory = [
      { role: "user" as const, content: "status?" },
      { role: "assistant" as const, content: "Old status answer." },
      { role: "user" as const, content: "Deploy the update" },
      { role: "tool" as const, content: "[execute_command] deployment succeeded" },
      { role: "assistant" as const, content: "Deployment is complete." },
    ]

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "execute_command", arguments: { command: "" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Fresh status answer." } },
      ] })
    mocks.verifyCompletionWithFetch.mockResolvedValue({ isComplete: true, conversationState: "complete", confidence: 0.97, missingItems: [] })

    const result = await processTranscriptWithAgentMode(
      "status?",
      availableTools as any,
      makeExecuteToolCall("session-repeat-stale-answer-scope", 1),
      4,
      previousHistory as any,
      "conv-repeat-stale-answer-scope",
      "session-repeat-stale-answer-scope",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Fresh status answer.")
    expect(result.content).not.toBe("Deployment is complete.")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(2)
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

  it("accepts verified plain assistant text without nudging for a response tool first", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    const { processTranscriptWithAgentMode } = await import("./llm")
    const progressUpdates: any[] = []

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "Yes — that will work.", toolCalls: [] })
    mocks.verifyCompletionWithFetch.mockResolvedValue({ isComplete: true, conversationState: "complete", confidence: 0.96, missingItems: [] })

    const result = await processTranscriptWithAgentMode("Will this approach work?", availableTools as any, makeExecuteToolCall("session-plain-text", 1), 4, [], "conv-plain-text", "session-plain-text", (update) => progressUpdates.push(update), undefined, 1)

    expect(result.content).toBe("Yes — that will work.")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(1)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(1)

    const promptText = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(promptText).not.toContain(INTERNAL_COMPLETION_NUDGE_TEXT)

    const completedUpdate = progressUpdates.find((update) => update.isComplete)
    expect(completedUpdate?.finalContent).toBe("Yes — that will work.")
    expect(completedUpdate?.userResponse).toBeUndefined()
    expect(completedUpdate?.responseEvents).toBeUndefined()
  })

  it("asks for the missing final answer instead of auto-generating a summary after bare mark_work_complete", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    currentConfig.mcpFinalSummaryEnabled = false
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "mark_work_complete", arguments: { summary: "Internal completion metadata" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Here is the actual final answer." } },
        { name: "mark_work_complete", arguments: { summary: "Delivered final answer" } },
      ] })

    mocks.verifyCompletionWithFetch.mockResolvedValue({ isComplete: true, conversationState: "complete", confidence: 0.97, missingItems: [] })

    const result = await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-completion-missing-answer", 1),
      4,
      [],
      "conv-completion-missing-answer",
      "session-completion-missing-answer",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Here is the actual final answer.")
    expect(mocks.makeLLMCallWithFetch).not.toHaveBeenCalled()

    const secondPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(secondPrompt).toContain("without first providing the final user-facing answer")
    expect(secondPrompt).toContain("Do not add a second recap or summary")
  })

  it("does not promote internal completion metadata when verification is disabled", async () => {
    currentConfig.mcpVerifyCompletionEnabled = false
    currentConfig.mcpFinalSummaryEnabled = false
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "mark_work_complete", arguments: { summary: "Internal completion metadata" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Here is the actual answer." } },
        { name: "mark_work_complete", arguments: { summary: "Delivered answer" } },
      ] })

    const result = await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-internal-summary-filter", 1),
      4,
      [],
      "conv-internal-summary-filter",
      "session-internal-summary-filter",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Here is the actual answer.")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(2)
  })

  it("uses the latest completion summary when promoting mark_work_complete summary to final content", async () => {
    currentConfig.mcpVerifyCompletionEnabled = false
    currentConfig.mcpFinalSummaryEnabled = false
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "mark_work_complete", arguments: { summary: "Earlier stale answer." } },
      { name: "mark_work_complete", arguments: { summary: "Latest authoritative answer." } },
    ] })

    const result = await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-latest-completion-summary", 1),
      4,
      [],
      "conv-latest-completion-summary",
      "session-latest-completion-summary",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Latest authoritative answer.")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(1)
  })

  it("does not finalize with a reasoning summary as the user-facing answer", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    currentConfig.mcpFinalSummaryEnabled = false
    const { processTranscriptWithAgentMode } = await import("./llm")
    const progressUpdates: any[] = []

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({
        content: undefined,
        reasoningSummary: "I should inspect more transcript chunks, but I am about to stop.",
        toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Internal stop" } }],
      })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "I inspected the next chunk and added 50 more topics." } },
        { name: "mark_work_complete", arguments: { summary: "Delivered the additional topics" } },
      ] })

    mocks.verifyCompletionWithFetch.mockResolvedValue({ isComplete: true, conversationState: "complete", confidence: 0.97, missingItems: [] })

    const result = await processTranscriptWithAgentMode(
      "Gather another 50 missed topics",
      availableTools as any,
      makeExecuteToolCall("session-reasoning-stub", 1),
      4,
      [],
      "conv-reasoning-stub",
      "session-reasoning-stub",
      (update) => progressUpdates.push(update),
      undefined,
      1,
    )

    expect(result.content).toBe("I inspected the next chunk and added 50 more topics.")
    expect(result.content).not.toContain("<think>")
    expect(result.conversationHistory.some((message) => message.role === "assistant" && message.content.includes("<think>"))).toBe(false)
    expect(mocks.addMessageToConversation.mock.calls.some((call) => String(call[1] ?? "").includes("<think>"))).toBe(false)
    expect(result.conversationHistory.some((message) => message.role === "assistant" && message.displayContent?.includes("<think>"))).toBe(true)
    expect(mocks.addMessageToConversation.mock.calls.some((call) => String(call[5]?.displayContent ?? "").includes("<think>"))).toBe(true)

    const progressConversationText = progressUpdates
      .flatMap((update) => update.conversationHistory ?? [])
      .map((message) => message.content)
      .join("\n")
    expect(progressConversationText).not.toContain("<think>")

    const progressDisplayText = progressUpdates
      .flatMap((update) => update.conversationHistory ?? [])
      .map((message) => message.displayContent ?? "")
      .join("\n")
    expect(progressDisplayText).toContain("<think>\nI should inspect more transcript chunks, but I am about to stop.\n</think>")

    const secondPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(secondPrompt).toContain("without first providing the final user-facing answer")
    expect(secondPrompt).not.toContain("I should inspect more transcript chunks")
  })

  it("treats reasoning-summary-only responses as empty and retries", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({
        content: undefined,
        reasoningSummary: "I should keep working before answering.",
        toolCalls: undefined,
      })
      .mockResolvedValueOnce({ content: "Recovered after retry", toolCalls: [] })

    const result = await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-reasoning-only-empty-retry", 1),
      4,
      [],
      "conv-reasoning-only-empty-retry",
      "session-reasoning-only-empty-retry",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Recovered after retry")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(2)

    const retryPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(retryPrompt).toContain("Previous request had empty response")
    expect(result.conversationHistory.some((message) => message.role === "assistant" && message.content.includes("I should keep working"))).toBe(false)
  })

  it("only generates a separate final summary when final-summary mode is enabled", async () => {
    currentConfig.mcpFinalSummaryEnabled = true
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Internal completion metadata" } }],
    })
    mocks.makeLLMCallWithFetch.mockResolvedValueOnce({ content: "Forced summary answer", toolCalls: [] })

    const result = await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-forced-final-summary", 1),
      3,
      [],
      "conv-forced-final-summary",
      "session-forced-final-summary",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Forced summary answer")
    expect(mocks.makeLLMCallWithFetch).toHaveBeenCalledTimes(1)
  })

  it("keeps the internal completion nudge ephemeral across resumed runs", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "Delegated work is finished." } },
      { name: "mark_work_complete", arguments: { summary: "Resumed parent session" } },
    ] })

    const resumedRun = await processTranscriptWithAgentMode(
      INTERNAL_COMPLETION_NUDGE_TEXT,
      availableTools as any,
      makeExecuteToolCall("session-resume", 1),
      3,
      [
        { role: "user", content: "Please finish the parent task." },
        { role: "assistant", content: "Delegating the final step now." },
      ] as any,
      "conv-resume",
      "session-resume",
      undefined,
      undefined,
      1,
    )

    expect(resumedRun.conversationHistory.map((message) => message.content)).not.toContain(INTERNAL_COMPLETION_NUDGE_TEXT)
    expect(
      mocks.addMessageToConversation.mock.calls.some(([, content, role]) => role === "user" && content === INTERNAL_COMPLETION_NUDGE_TEXT)
    ).toBe(false)

    mocks.makeLLMCallWithStreamingAndTools.mockClear()
    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "Follow-up stayed clean." } },
      { name: "mark_work_complete", arguments: { summary: "Handled follow-up" } },
    ] })

    await processTranscriptWithAgentMode(
      "continue",
      availableTools as any,
      makeExecuteToolCall("session-resume-followup", 1),
      3,
      resumedRun.conversationHistory as any,
      "conv-resume",
      "session-resume-followup",
      undefined,
      undefined,
      1,
    )

    const followupPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[0]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(followupPrompt).toContain("Please finish the parent task.")
    expect(followupPrompt).toContain("Delegated work is finished.")
    expect(followupPrompt).not.toContain(INTERNAL_COMPLETION_NUDGE_TEXT)
  })

  it("nudges the model to omit invalid execute_command skillId values after a tool failure", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "execute_command", arguments: { command: "pwd && ls -la", skillId: "aj47/dotagents-mono" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "I reran the command in the workspace root." } },
        { name: "mark_work_complete", arguments: { summary: "Checked workspace root" } },
      ] })

    await processTranscriptWithAgentMode(
      "Show me the workspace root",
      availableTools as any,
      makeExecuteToolCall("session-command", 1, {
        execute_command: {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: "Invalid execute_command.skillId: aj47/dotagents-mono",
              guidance: "skillId must be an exact loaded skill id from Available Skills. Omit skillId for normal workspace or repository commands. Never use repo names, file paths, URLs, or GitHub slugs as skillId.",
              retrySuggestion: "Retry the same command without skillId unless you explicitly need to run inside a loaded skill directory.",
            }, null, 2),
          }],
          isError: true,
        },
      }),
      4,
      [],
      "conv-command",
      "session-command",
      undefined,
      undefined,
      1,
    )

    const secondPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(secondPrompt).toContain("Invalid execute_command.skillId: aj47/dotagents-mono")
    expect(secondPrompt).toContain("Retry the same command without skillId")
    expect(secondPrompt).toContain("Do not use repo names, file paths, URLs, or GitHub slugs as skillId")
  })

  it("does not inject unrecoverable permissions notes for failed tools", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "execute_command", arguments: { command: "cat /private/file" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "The command failed with access denied." } },
        { name: "mark_work_complete", arguments: { summary: "Explained command failure" } },
      ] })

    await processTranscriptWithAgentMode(
      "Read that file if possible",
      availableTools as any,
      makeExecuteToolCall("session-permission-error", 1, {
        execute_command: {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ success: false, error: "access denied", stderr: "Permission denied" }, null, 2),
          }],
          isError: true,
        },
      }),
      4,
      [],
      "conv-permission-error",
      "session-permission-error",
      undefined,
      undefined,
      1,
    )

    const retryPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(retryPrompt).toContain("TOOL FAILED: execute_command")
    expect(retryPrompt).toContain("access denied")
    expect(retryPrompt).not.toContain("Some tools (execute_command) have unrecoverable errors")
    expect(retryPrompt).not.toContain("Please complete what you can or explain what cannot be done")
  })

  it("routes failed communication-only tool batches through error recovery before retrying", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Interim answer" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Recovered final answer" } },
        { name: "mark_work_complete", arguments: { summary: "Recovered from tool failure" } },
      ] })

    const result = await processTranscriptWithAgentMode(
      "Answer the user",
      availableTools as any,
      makeExecuteToolCall("session-tool-error", 1, {
        respond_to_user: {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ success: false, error: "respond_to_user failed to deliver" }, null, 2),
          }],
          isError: true,
        },
      }),
      4,
      [],
      "conv-tool-error",
      "session-tool-error",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Recovered final answer")
    const retryPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(retryPrompt).toContain("TOOL FAILED: respond_to_user")
  })

  it("does not replay same-run materialized respond_to_user text into the next iteration prompt", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "First interim answer" } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Final answer" } },
        { name: "mark_work_complete", arguments: { summary: "Done" } },
      ] })

    mocks.verifyCompletionWithFetch.mockResolvedValueOnce({
      isComplete: false,
      conversationState: "running",
      confidence: 0.4,
      missingItems: ["Needs final answer"],
    })

    const result = await processTranscriptWithAgentMode(
      "Answer the user",
      availableTools as any,
      makeExecuteToolCall("session-same-run-replay", 1),
      4,
      [],
      "conv-same-run-replay",
      "session-same-run-replay",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Final answer")
    expect(result.conversationHistory.some((message) =>
      message.role === "assistant" && message.content === "First interim answer"
    )).toBe(true)

    const secondPrompt = (mocks.makeLLMCallWithStreamingAndTools.mock.calls[1]?.[0] ?? [])
      .map((message: any) => message.content)
      .join("\n")
    expect(secondPrompt).toContain("[respond_to_user]")
    expect(secondPrompt.split("First interim answer").length - 1).toBe(0)
  })

  it("verifies the first communication-only respond_to_user turn instead of making a second agent call", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "First next-steps answer" } },
    ] })

    mocks.verifyCompletionWithFetch.mockResolvedValue({
      isComplete: true,
      conversationState: "complete",
      confidence: 0.94,
      missingItems: [],
    })

    const result = await processTranscriptWithAgentMode(
      "what's next on desktop",
      availableTools as any,
      makeExecuteToolCall("session-comm-only-verify", 1),
      4,
      [],
      "conv-comm-only-verify",
      "session-comm-only-verify",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("First next-steps answer")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(1)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(1)
  })

  it("does not auto-complete on the first communication-only respond_to_user when verify is disabled", async () => {
    currentConfig.mcpVerifyCompletionEnabled = false
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Working on it..." } },
      ] })
      .mockResolvedValueOnce({ content: "", toolCalls: [
        { name: "respond_to_user", arguments: { text: "Final answer after more work" } },
        { name: "mark_work_complete", arguments: { summary: "Finished" } },
      ] })

    const result = await processTranscriptWithAgentMode(
      "Do the work",
      availableTools as any,
      makeExecuteToolCall("session-comm-only-verify", 1),
      4,
      [],
      "conv-comm-only-verify",
      "session-comm-only-verify",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Final answer after more work")
    expect(mocks.makeLLMCallWithStreamingAndTools.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(mocks.verifyCompletionWithFetch).not.toHaveBeenCalled()
  })

  it("finalizes when verification only complains about the missing internal completion signal", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    currentConfig.mcpVerifyRetryCount = 0
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockImplementation(async () => ({
      content: "",
      toolCalls: [
        { name: "respond_to_user", arguments: { text: "Depth 3 reporting complete." } },
      ],
    }))
    mocks.verifyCompletionWithFetch.mockResolvedValue({
      isComplete: false,
      conversationState: "running",
      reason: "Completion signal is missing.",
      missingItems: ["mark_work_complete was not called"],
    })

    const result = await processTranscriptWithAgentMode(
      "Return a depth 3 message",
      availableTools as any,
      makeExecuteToolCall("session-comm-only-loop", 1),
      6,
      [],
      "conv-comm-only-loop",
      "session-comm-only-loop",
      undefined,
      undefined,
      1,
    )

    expect(result.totalIterations).toBe(1)
    expect(result.content).toBe("Depth 3 reporting complete.")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(1)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(1)
    expect(result.conversationHistory.filter((message) => message.role === "assistant" && message.content === "Depth 3 reporting complete.")).toHaveLength(1)

    const updatesWithResponseEvents = (mocks.emitAgentProgress.mock.calls as unknown as Array<[any]>)
      .map(([update]) => update.responseEvents)
      .filter(Boolean)
    expect(updatesWithResponseEvents.at(-1)).toHaveLength(1)
  })

  it("finalizes when verification reason only says mark_work_complete was not called", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    currentConfig.mcpVerifyRetryCount = 0
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockImplementation(async () => ({
      content: "",
      toolCalls: [
        { name: "respond_to_user", arguments: { text: "Completed and sent final answer." } },
      ],
    }))
    mocks.verifyCompletionWithFetch.mockResolvedValue({
      isComplete: false,
      conversationState: "running",
      reason: "mark_work_complete was not called",
      missingItems: [],
    })

    const result = await processTranscriptWithAgentMode(
      "Complete the task and report back",
      availableTools as any,
      makeExecuteToolCall("session-missing-mark-work-complete", 1),
      6,
      [],
      "conv-missing-mark-work-complete",
      "session-missing-mark-work-complete",
      undefined,
      undefined,
      1,
    )

    expect(result.totalIterations).toBe(1)
    expect(result.content).toBe("Completed and sent final answer.")
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(1)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(1)
  })

  it("keeps iterating when communication-only verification reports real missing work", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    currentConfig.mcpVerifyRetryCount = 0
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockImplementation(async () => ({
      content: "",
      toolCalls: [
        { name: "respond_to_user", arguments: { text: "Still working on it." } },
      ],
    }))
    mocks.verifyCompletionWithFetch.mockResolvedValue({
      isComplete: false,
      conversationState: "running",
      reason: "The requested result has not been delivered.",
      missingItems: ["Needs the actual final answer"],
    })

    const result = await processTranscriptWithAgentMode(
      "Return the final result",
      availableTools as any,
      makeExecuteToolCall("session-comm-only-real-missing-work", 1),
      6,
      [],
      "conv-comm-only-real-missing-work",
      "session-comm-only-real-missing-work",
      undefined,
      undefined,
      1,
    )

    expect(result.totalIterations).toBeGreaterThan(1)
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(5)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(5)
  })

  it("keeps iterating when verification reason reports missing work even if missingItems only mention completion signal", async () => {
    currentConfig.mcpVerifyCompletionEnabled = true
    currentConfig.mcpVerifyRetryCount = 0
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools.mockImplementation(async () => ({
      content: "",
      toolCalls: [
        { name: "respond_to_user", arguments: { text: "Still finalizing." } },
      ],
    }))
    mocks.verifyCompletionWithFetch.mockResolvedValue({
      isComplete: false,
      conversationState: "running",
      reason: "The requested result has not been delivered.",
      missingItems: ["mark_work_complete was not called"],
    })

    const result = await processTranscriptWithAgentMode(
      "Return the final result",
      availableTools as any,
      makeExecuteToolCall("session-comm-only-reason-missing-work", 1),
      6,
      [],
      "conv-comm-only-reason-missing-work",
      "session-comm-only-reason-missing-work",
      undefined,
      undefined,
      1,
    )

    expect(result.totalIterations).toBeGreaterThan(1)
    expect(mocks.makeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(5)
    expect(mocks.verifyCompletionWithFetch).toHaveBeenCalledTimes(5)
  })

  it("ignores blank response events when resolving the final visible answer", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")
    const { appendSessionUserResponse } = await import("./session-user-response-store")

    appendSessionUserResponse({ sessionId: "session-blank-response", runId: 9, text: "Visible answer", timestamp: 1000 })
    appendSessionUserResponse({ sessionId: "session-blank-response", runId: 9, text: "   ", timestamp: 1000 })

    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Used stored answer" } }],
    })

    const result = await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("session-blank-response", 9),
      3,
      [],
      "conv-blank-response",
      "session-blank-response",
      undefined,
      undefined,
      9,
    )

    expect(result.content).toBe("Visible answer")
    expect(result.conversationHistory.filter((message) => message.role === "assistant" && message.content === "Visible answer")).toHaveLength(1)
    expect(result.conversationHistory.filter((message) => message.role === "assistant" && message.content === "   ")).toHaveLength(0)
  })

  it("uses the ACP title override when delegated session progress has no tracked session title", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.getSession.mockImplementation((id: string) =>
      id === "delegated-title-session"
        ? undefined
        : { id, conversationTitle: "Test conversation" },
    )
    mocks.getAcpSessionTitleOverride.mockImplementation((id: string) =>
      id === "delegated-title-session" ? "Delegated research" : undefined,
    )
    mocks.makeLLMCallWithStreamingAndTools.mockResolvedValueOnce({ content: "", toolCalls: [
      { name: "respond_to_user", arguments: { text: "Done" } },
      { name: "mark_work_complete", arguments: { summary: "Done" } },
    ] })

    await processTranscriptWithAgentMode(
      "Finish this",
      availableTools as any,
      makeExecuteToolCall("delegated-title-session", 10),
      3,
      [],
      "conv-delegated-title",
      "delegated-title-session",
      undefined,
      undefined,
      10,
    )

    expect(mocks.emitAgentProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "delegated-title-session",
        conversationTitle: "Delegated research",
      }),
    )
  })
})
