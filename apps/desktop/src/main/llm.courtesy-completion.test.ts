import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MCPToolCall, MCPToolResult } from "./mcp-service"

const mockMakeLLMCallWithStreamingAndTools = vi.fn()
const mockVerifyCompletionWithFetch = vi.fn()
const mockGetSessionUserResponse = vi.fn((): string | undefined => undefined)

vi.mock("./config", () => ({
  configStore: { get: () => ({ mcpToolsProviderId: "openai", mcpVerifyCompletionEnabled: true, modelPresets: [], currentModelPresetId: undefined }) },
}))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logWarning: vi.fn(), logError: vi.fn() } }))
vi.mock("./llm-fetch", () => ({ makeLLMCallWithFetch: vi.fn(), makeTextCompletionWithFetch: vi.fn(), verifyCompletionWithFetch: mockVerifyCompletionWithFetch, makeLLMCallWithStreamingAndTools: mockMakeLLMCallWithStreamingAndTools }))
vi.mock("./system-prompts", () => ({ constructSystemPrompt: vi.fn(() => "system prompt") }))
vi.mock("./state", () => ({ state: { pendingToolApprovals: new Map(), isShuttingDown: false }, agentSessionStateManager: { getSessionProfileSnapshot: vi.fn(() => undefined), createSession: vi.fn(), startSessionRun: vi.fn(() => 1), cleanupSession: vi.fn(), shouldStopSession: vi.fn(() => false), updateIterationCount: vi.fn() } }))
vi.mock("./debug", () => ({ isDebugLLM: vi.fn(() => false), logLLM: vi.fn(), isDebugTools: vi.fn(() => false), logTools: vi.fn() }))
vi.mock("./context-budget", () => ({ shrinkMessagesForLLM: vi.fn(async ({ messages }) => ({ messages, estTokensAfter: 0, maxTokens: 32000 })), estimateTokensFromMessages: vi.fn(() => 0) }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn(() => Promise.resolve()) }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { isSessionSnoozed: vi.fn(() => false), getSession: vi.fn(() => undefined) } }))
vi.mock("./conversation-service", () => ({ conversationService: { addMessageToConversation: vi.fn(() => Promise.resolve()) } }))
vi.mock("../shared", () => ({ getCurrentPresetName: vi.fn(() => "OpenAI") }))
vi.mock("./langfuse-service", () => ({ createAgentTrace: vi.fn(), endAgentTrace: vi.fn(), isLangfuseEnabled: vi.fn(() => false), flushLangfuse: vi.fn(() => Promise.resolve()) }))
vi.mock("./summarization-service", () => ({ isSummarizationEnabled: vi.fn(() => false), shouldSummarizeStep: vi.fn(() => false), summarizeAgentStep: vi.fn(), summarizationService: { getSummaries: vi.fn(() => []), getLatestSummary: vi.fn(() => undefined) } }))
vi.mock("./memory-service", () => ({ memoryService: { getAllMemories: vi.fn(() => Promise.resolve([])), saveMemory: vi.fn(() => Promise.resolve()), createMemoryFromSummary: vi.fn(() => null) } }))
vi.mock("./session-user-response-store", () => ({ clearSessionUserResponse: vi.fn(), getSessionUserResponse: mockGetSessionUserResponse, getSessionUserResponseHistory: vi.fn(() => []) }))
vi.mock("./agent-run-utils", () => ({ appendAgentStopNote: vi.fn((content: string) => content), resolveAgentIterationLimits: vi.fn((maxIterations: number) => ({ loopMaxIterations: maxIterations, guardrailBudget: 0 })) }))
vi.mock("./conversation-history-utils", () => ({ filterEphemeralMessages: vi.fn((history) => history) }))
vi.mock("./llm-tool-gating", () => ({ filterNamedItemsToAllowedTools: vi.fn((items) => ({ allowed: items, removed: [] })) }))
vi.mock("./agent-terminal-error", () => ({ appendAndPersistTerminalAssistantMessage: vi.fn(() => Promise.resolve()), buildUnexpectedAgentFailureMessage: vi.fn(() => "unexpected failure") }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: vi.fn(() => null) } }))
vi.mock("./skills-service", () => ({ skillsService: { getSkills: vi.fn(() => []), getEnabledSkillsInstructionsForProfile: vi.fn(() => undefined) } }))
vi.mock("./agent-low-context-guard", () => ({ getLowContextPromptGuardResponse: vi.fn(() => null) }))

describe("llm completion verification bypass", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockVerifyCompletionWithFetch.mockResolvedValue({ isComplete: true, confidence: 1, missingItems: [], reason: "complete" })
    mockGetSessionUserResponse.mockReturnValue(undefined)
  })

  it("skips completion verification for thank-you runs that only used respond_to_user/mark_work_complete", async () => {
    let storedResponse: string | undefined
    mockGetSessionUserResponse.mockImplementation(() => storedResponse)
    mockMakeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "respond_to_user", arguments: { text: "You're welcome, AJ. Anytime.", images: [] } }] })
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Acknowledged the user's thanks with a polite response.", confidence: 1 } }] })

    const executeToolCall = vi.fn(async (toolCall: MCPToolCall): Promise<MCPToolResult> => {
      if (toolCall.name === "respond_to_user") storedResponse = String(toolCall.arguments.text)
      return { content: [{ type: "text", text: '{"success":true}' as const }], isError: false }
    })

    const { processTranscriptWithAgentMode } = await import("./llm")
    const result = await processTranscriptWithAgentMode(
      "Thank you.",
      [
        { name: "respond_to_user", description: "Respond to the user", inputSchema: { type: "object" } },
        { name: "mark_work_complete", description: "Mark work complete", inputSchema: { type: "object" } },
      ],
      executeToolCall,
      4,
      undefined,
      "conversation-1",
      "session-1",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("You're welcome, AJ. Anytime.")
    expect(executeToolCall).toHaveBeenCalledTimes(2)
    expect(mockMakeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(2)
    expect(mockVerifyCompletionWithFetch).not.toHaveBeenCalled()
  })

  it("stops after explicit respond_to_user + mark_work_complete instead of reopening the task", async () => {
    let storedResponse: string | undefined
    mockGetSessionUserResponse.mockImplementation(() => storedResponse)
    mockVerifyCompletionWithFetch.mockResolvedValue({
      isComplete: false,
      confidence: 0.12,
      missingItems: ["Do not reopen after the final user response is already recorded."],
      reason: "A recovered earlier tool warning still appears in the transcript.",
    })
    mockMakeLLMCallWithStreamingAndTools
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "execute_command", arguments: { command: "cat ~/Documents/agent-notes/email/email-triage-plan.md" } }] })
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "respond_to_user", arguments: { text: "Done — triaged 10 unread unlabeled emails.", images: [] } }] })
      .mockResolvedValueOnce({ content: "", toolCalls: [{ name: "mark_work_complete", arguments: { summary: "Triaged 10 unread unlabeled emails.", confidence: 0.96 } }] })

    const executeToolCall = vi.fn(async (toolCall: MCPToolCall): Promise<MCPToolResult> => {
      if (toolCall.name === "respond_to_user") storedResponse = String(toolCall.arguments.text)
      return { content: [{ type: "text", text: '{"success":true}' as const }], isError: false }
    })

    const { processTranscriptWithAgentMode } = await import("./llm")
    const result = await processTranscriptWithAgentMode(
      "Run the same thing again so we label more.",
      [
        { name: "execute_command", description: "Execute a shell command", inputSchema: { type: "object" } },
        { name: "respond_to_user", description: "Respond to the user", inputSchema: { type: "object" } },
        { name: "mark_work_complete", description: "Mark work complete", inputSchema: { type: "object" } },
      ],
      executeToolCall,
      6,
      undefined,
      "conversation-1",
      "session-1",
      undefined,
      undefined,
      1,
    )

    expect(result.content).toBe("Done — triaged 10 unread unlabeled emails.")
    expect(executeToolCall.mock.calls.map(([toolCall]) => toolCall.name)).toEqual([
      "execute_command",
      "respond_to_user",
      "mark_work_complete",
    ])
    expect(mockMakeLLMCallWithStreamingAndTools).toHaveBeenCalledTimes(3)
    expect(mockVerifyCompletionWithFetch).not.toHaveBeenCalled()
  })
})