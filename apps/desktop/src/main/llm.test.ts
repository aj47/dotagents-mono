import { beforeEach, describe, expect, it, vi } from "vitest"

const defaultConfig = {
  mcpToolsProviderId: "openai",
  mcpVerifyCompletionEnabled: false,
  mcpFinalSummaryEnabled: false,
}
const mockConfigGet = vi.fn(() => ({ ...defaultConfig }))
const mockStreamingCall = vi.fn()
const mockVerifyCompletion = vi.fn()
const mockEndAgentTrace = vi.fn()

vi.mock("./config", () => ({
  configStore: { get: mockConfigGet },
}))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./llm-fetch", () => ({ makeLLMCallWithFetch: vi.fn(), makeTextCompletionWithFetch: vi.fn(), verifyCompletionWithFetch: mockVerifyCompletion, makeLLMCallWithStreamingAndTools: mockStreamingCall }))
vi.mock("./system-prompts", () => ({ constructSystemPrompt: vi.fn(() => "prompt") }))
vi.mock("./state", () => ({ state: { shouldStopAgent: false, agentIterationCount: 0 }, agentSessionStateManager: { shouldStopSession: vi.fn(() => false), getSessionProfileSnapshot: vi.fn(() => undefined), createSession: vi.fn(), startSessionRun: vi.fn(() => 1), updateIterationCount: vi.fn(), cleanupSession: vi.fn() } }))
vi.mock("./debug", () => ({ isDebugLLM: vi.fn(() => false), isDebugTools: vi.fn(() => false), logLLM: vi.fn(), logTools: vi.fn() }))
vi.mock("./context-budget", () => ({ shrinkMessagesForLLM: vi.fn(async ({ messages }: any) => ({ messages, estTokensAfter: 0, maxTokens: 8192 })), estimateTokensFromMessages: vi.fn(() => 0) }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn(async () => {}) }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { isSessionSnoozed: vi.fn(() => false), getSession: vi.fn(() => ({ conversationTitle: "Test session", profileSnapshot: { profileName: "Main Agent" } })) } }))
vi.mock("./conversation-service", () => ({ conversationService: { addMessageToConversation: vi.fn(async () => {}) } }))
vi.mock("../shared", () => ({ getCurrentPresetName: vi.fn(() => "default") }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: vi.fn(() => true), createAgentTrace: vi.fn(), endAgentTrace: mockEndAgentTrace, flushLangfuse: vi.fn(async () => {}) }))
vi.mock("./summarization-service", () => ({ isSummarizationEnabled: vi.fn(() => false), shouldSummarizeStep: vi.fn(() => false), summarizeAgentStep: vi.fn(), summarizationService: { addSummary: vi.fn() } }))
vi.mock("./memory-service", () => ({ memoryService: { getAllMemories: vi.fn(async () => []), createMemoryFromSummary: vi.fn(() => undefined), saveMemory: vi.fn(async () => {}) } }))
vi.mock("./llm-tool-gating", () => ({ filterNamedItemsToAllowedTools: vi.fn((items: any) => items) }))

describe("processTranscriptWithAgentMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfigGet.mockReturnValue({ ...defaultConfig })
    mockStreamingCall.mockReset()
    mockVerifyCompletion.mockReset()
    mockEndAgentTrace.mockReset()
  })

  it("keeps a successful respond_to_user message as trace output when a later iteration errors", async () => {
    const { setSessionUserResponse, clearSessionUserResponse } = await import("./session-user-response-store")
    const { processTranscriptWithAgentMode } = await import("./llm")

    clearSessionUserResponse("session-respond-fallback")
    mockStreamingCall
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "respond_to_user", arguments: { text: "Done! Two iTerm windows are ready." } }] })
      .mockRejectedValueOnce(new Error("later speculative tool step failed"))

    const executeToolCall = vi.fn(async (toolCall: any) => {
      if (toolCall.name === "respond_to_user") {
        setSessionUserResponse("session-respond-fallback", toolCall.arguments.text)
      }
      return { content: [{ type: "text", text: '{"success":true}' }], isError: false }
    })

    await expect(processTranscriptWithAgentMode(
      "continue",
      [{ name: "respond_to_user", description: "Send a response", inputSchema: { type: "object", properties: {}, required: [] } } as any],
      executeToolCall,
      3,
      [],
      "conv-respond-fallback",
      "session-respond-fallback",
      undefined,
      undefined,
      1,
    )).rejects.toThrow("later speculative tool step failed")

    expect(mockEndAgentTrace).toHaveBeenCalledWith(
      "session-respond-fallback",
      expect.objectContaining({ output: "Done! Two iTerm windows are ready." }),
    )
  })

  it("finishes immediately after a deliverable respond_to_user follows successful real work", async () => {
    const { setSessionUserResponse, clearSessionUserResponse } = await import("./session-user-response-store")
    const { processTranscriptWithAgentMode } = await import("./llm")

    clearSessionUserResponse("session-issue-respond-finish")
    mockConfigGet.mockReturnValue({
      ...defaultConfig,
      mcpVerifyCompletionEnabled: true,
    })
    mockStreamingCall
      .mockResolvedValueOnce({
        content: "",
        toolCalls: [{
          name: "github:create_issue",
          arguments: { title: "Conversation History", body: "Preserve full data on disk" },
        }],
      })
      .mockResolvedValueOnce({
        content: "Issue #58 created.",
        toolCalls: [{
          name: "respond_to_user",
          arguments: { text: "Filed issue #58 with the conversation-history preservation plan." },
        }],
      })
      .mockImplementation(() => {
        throw new Error("unexpected extra llm call after respond_to_user")
      })
    mockVerifyCompletion.mockResolvedValue({
      isComplete: true,
      confidence: 0.99,
      missingItems: [],
      reason: "The issue was created and the user was given the final result.",
    })

    const executeToolCall = vi.fn(async (toolCall: any) => {
      if (toolCall.name === "respond_to_user") {
        setSessionUserResponse("session-issue-respond-finish", toolCall.arguments.text)
      }
      return { content: [{ type: "text", text: '{"success":true}' }], isError: false }
    })

    const result = await processTranscriptWithAgentMode(
      "can you add a GitHub issue",
      [
        { name: "github:create_issue", description: "Create issue", inputSchema: { type: "object", properties: {}, required: [] } },
        { name: "respond_to_user", description: "Send a response", inputSchema: { type: "object", properties: {}, required: [] } },
      ] as any,
      executeToolCall,
      4,
      [],
      "conv-issue-respond-finish",
      "session-issue-respond-finish",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Filed issue #58 with the conversation-history preservation plan.")
    expect(mockStreamingCall).toHaveBeenCalledTimes(2)
    expect(mockVerifyCompletion).toHaveBeenCalledTimes(1)
    expect(mockEndAgentTrace).toHaveBeenCalledWith(
      "session-issue-respond-finish",
      expect.objectContaining({ output: "Filed issue #58 with the conversation-history preservation plan." }),
    )
  })

  it("replaces stale progress text with an incomplete fallback when max iterations are reached", async () => {
    const { clearSessionUserResponse } = await import("./session-user-response-store")
    const { processTranscriptWithAgentMode } = await import("./llm")

    clearSessionUserResponse("session-timeout-fallback")
    mockConfigGet.mockReturnValue({
      ...defaultConfig,
      mcpVerifyCompletionEnabled: true,
    })
    mockStreamingCall.mockResolvedValue({
      content: "Let me search for the correct URL and browse to it.",
      toolCalls: [],
    })

    const result = await processTranscriptWithAgentMode(
      "I meant Claude Code by Anthropic.",
      [{ name: "mark_work_complete", description: "Finish", inputSchema: { type: "object", properties: {}, required: [] } } as any],
      vi.fn(async () => ({ content: [{ type: "text", text: '{"success":true}' }], isError: false })),
      1,
      [],
      "conv-timeout-fallback",
      "session-timeout-fallback",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toContain("I couldn't complete the request after multiple attempts.")
    expect(result.content).toContain("Reached maximum iteration limit while the agent was still in progress.")
    expect(result.content).not.toContain("Let me search for the correct URL")
    expect(mockEndAgentTrace).toHaveBeenCalledWith(
      "session-timeout-fallback",
      expect.objectContaining({ output: result.content }),
    )
  })

  it("uses the latest deliverable assistant message from the current turn instead of a later progress update on timeout", async () => {
    const { clearSessionUserResponse } = await import("./session-user-response-store")
    const { processTranscriptWithAgentMode } = await import("./llm")

    clearSessionUserResponse("session-timeout-deliverable")
    mockConfigGet.mockReturnValue({
      ...defaultConfig,
      mcpVerifyCompletionEnabled: true,
    })
    mockStreamingCall
      .mockResolvedValueOnce({
        content: "The correct URL is https://claude.ai/code.",
        toolCalls: [],
      })
      .mockResolvedValueOnce({
        content: "Let me browse to it now.",
        toolCalls: [],
      })

    const result = await processTranscriptWithAgentMode(
      "I meant Claude Code by Anthropic.",
      [{ name: "mark_work_complete", description: "Finish", inputSchema: { type: "object", properties: {}, required: [] } } as any],
      vi.fn(async () => ({ content: [{ type: "text", text: '{"success":true}' }], isError: false })),
      2,
      [],
      "conv-timeout-deliverable",
      "session-timeout-deliverable",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toContain("The correct URL is https://claude.ai/code.")
    expect(result.content).toContain("Task may not be fully complete - reached maximum iteration limit")
    expect(result.content).not.toContain("Let me browse to it now")
  })

  it("stops the run when verification fails but the response is waiting on user action", async () => {
    const { clearSessionUserResponse } = await import("./session-user-response-store")
    const { processTranscriptWithAgentMode } = await import("./llm")

    const blockerText = "Please log in manually in the debug Chrome window, then let me know and I'll pull up your usage stats."

    clearSessionUserResponse("session-user-action-blocker")
    mockConfigGet.mockReturnValue({
      ...defaultConfig,
      mcpVerifyCompletionEnabled: true,
    })
    mockStreamingCall.mockResolvedValue({
      content: blockerText,
      toolCalls: [],
    })
    mockVerifyCompletion.mockResolvedValue({
      isComplete: false,
      confidence: 0.9,
      missingItems: ["Claude usage stats were not retrieved"],
      reason: "The agent cannot continue until the user completes the required manual login step.",
    })

    const result = await processTranscriptWithAgentMode(
      "can you check my Claude usage stats",
      [{ name: "mark_work_complete", description: "Finish", inputSchema: { type: "object", properties: {}, required: [] } } as any],
      vi.fn(async () => ({ content: [{ type: "text", text: '{"success":true}' }], isError: false })),
      4,
      [],
      "conv-user-action-blocker",
      "session-user-action-blocker",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe(blockerText)
    expect(mockVerifyCompletion).toHaveBeenCalledTimes(1)
    expect(mockStreamingCall).toHaveBeenCalledTimes(3)
    expect(mockEndAgentTrace).toHaveBeenCalledWith(
      "session-user-action-blocker",
      expect.objectContaining({ output: blockerText }),
    )
  })

  it("nudges repeated tool-only exploration to synthesize or ask focused follow-up questions", async () => {
    const { clearSessionUserResponse } = await import("./session-user-response-store")
    const { processTranscriptWithAgentMode } = await import("./llm")

    clearSessionUserResponse("session-tool-only-synthesis")

    let llmCallCount = 0
    mockStreamingCall.mockImplementation(async (messages: Array<{ role: string; content: string }>) => {
      llmCallCount += 1
      const hasSynthesisNudge = messages.some((message) =>
        message.role === "user" && message.content.includes("You've already gathered substantial context."),
      )

      if (hasSynthesisNudge) {
        return {
          content:
            "I reviewed the hub bundles and notes. Before we decide the first starter packs, should we optimize for founders, personal productivity, or AI engineers?",
          toolCalls: [],
        }
      }

      return {
        content: "Let me gather a bit more context before I answer.",
        toolCalls: [
          {
            name: "execute_command",
            arguments: { command: `echo context-pass-${llmCallCount}` },
          },
        ],
      }
    })

    const result = await processTranscriptWithAgentMode(
      "Can you gather context on starter packs and ask me follow-up questions?",
      [{ name: "execute_command", description: "Run command", inputSchema: { type: "object", properties: {}, required: [] } } as any],
      vi.fn(async () => ({ content: [{ type: "text", text: '{"success":true}' }], isError: false })),
      4,
      [],
      "conv-tool-only-synthesis",
      "session-tool-only-synthesis",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toContain("should we optimize for founders, personal productivity, or AI engineers")
    expect(llmCallCount).toBe(4)
    expect(mockEndAgentTrace).toHaveBeenCalledWith(
      "session-tool-only-synthesis",
      expect.objectContaining({ output: result.content }),
    )
  })
})
