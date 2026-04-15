import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { INTERNAL_COMPLETION_NUDGE_TEXT } from "../shared/runtime-tool-names"

let currentConfig: any

const mocks = vi.hoisted(() => ({
  makeLLMCallWithFetch: vi.fn(),
  makeLLMCallWithStreamingAndTools: vi.fn(),
  verifyCompletionWithFetch: vi.fn(),
  emitAgentProgress: vi.fn(() => Promise.resolve()),
  addMessageToConversation: vi.fn(async (...args: any[]) => ({ id: args[0] })),
  maybeAutoGenerateConversationTitle: vi.fn(async () => undefined),
  createSession: vi.fn(),
  startSessionRun: vi.fn(() => 1),
  getSessionProfileSnapshot: vi.fn(() => undefined),
  shouldStopSession: vi.fn(() => false),
  updateIterationCount: vi.fn(),
  cleanupSession: vi.fn(),
  isSessionSnoozed: vi.fn(() => false),
  getSession: vi.fn((id: string): { id: string; conversationTitle: string } | undefined => ({ id, conversationTitle: "Test conversation" })),
  updateSession: vi.fn(),
  getCurrentProfile: vi.fn(() => undefined),
  getSkills: vi.fn(() => []),
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
vi.mock("./state", () => ({ state: {}, agentSessionStateManager: mocks }))
vi.mock("./debug", () => ({ isDebugLLM: () => false, isDebugTools: () => false, logLLM: vi.fn(), logTools: vi.fn(), logApp: vi.fn() }))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
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
vi.mock("./skills-service", () => ({ skillsService: { getSkills: mocks.getSkills, getEnabledSkillsInstructionsForProfile: mocks.getEnabledSkillsInstructionsForProfile } }))
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
      "session-resume",
      "session-resume-followup",
      "session-command",
      "session-tool-error",
      "session-blank-response",
      "session-review-loop",
      "session-review-loop-final-answer",
      "session-clean-final",
    )
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

  it("stores one tool transcript entry per tool call instead of one giant merged blob", async () => {
    const { processTranscriptWithAgentMode } = await import("./llm")

    mocks.makeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({
        content: "",
        toolCalls: [
          { name: "execute_command", arguments: { command: "pwd" } },
          { name: "execute_command", arguments: { command: "ls" } },
        ],
      })
      .mockResolvedValueOnce({
        content: "",
        toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Captured tool output" } }],
      })

    const result = await processTranscriptWithAgentMode(
      "Inspect the workspace",
      availableTools as any,
      makeExecuteToolCall("session-command", 1, {
        execute_command: (toolCall: any) => ({
          content: [{
            type: "text" as const,
            text: JSON.stringify({ success: true, command: toolCall.arguments.command }),
          }],
          isError: false,
        }),
      }),
      3,
      [],
      "conv-command",
      "session-command",
      undefined,
      undefined,
      1,
    )

    const executeToolMessages = result.conversationHistory.filter((message) =>
      message.role === "tool" && message.content.includes("[execute_command]")
    )
    expect(executeToolMessages).toHaveLength(2)
    expect(executeToolMessages[0]?.content).toContain("\"command\":\"pwd\"")
    expect(executeToolMessages[1]?.content).toContain("\"command\":\"ls\"")
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
