import { beforeEach, describe, expect, it, vi } from "vitest"

const mockStreamingCall = vi.fn()
const mockEndAgentTrace = vi.fn()

vi.mock("./config", () => ({
  configStore: { get: () => ({ mcpToolsProviderId: "openai", mcpVerifyCompletionEnabled: false, mcpFinalSummaryEnabled: false }) },
}))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./llm-fetch", () => ({ makeLLMCallWithFetch: vi.fn(), makeTextCompletionWithFetch: vi.fn(), verifyCompletionWithFetch: vi.fn(), makeLLMCallWithStreamingAndTools: mockStreamingCall }))
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
})