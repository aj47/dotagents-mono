import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetAgentInstance = vi.fn()
const mockGetOrCreateSession = vi.fn()
const mockSendPrompt = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()
const mockEmitAgentProgress = vi.fn(() => Promise.resolve())
const mockLoadConversation = vi.fn()
const mockAddMessageToConversation = vi.fn(() => Promise.resolve())
let sessionUpdateHandler: ((event: any) => void) | undefined

vi.mock("./acp-service", () => ({
  acpService: {
    getAgentInstance: mockGetAgentInstance,
    getOrCreateSession: mockGetOrCreateSession,
    sendPrompt: mockSendPrompt,
    on: mockOn,
    off: mockOff,
  },
}))

vi.mock("./acp-session-state", () => ({
  getMainAcpxSessionName: vi.fn((conversationId: string) => `dotagents:main:${conversationId}`),
  getSessionForConversation: vi.fn(() => undefined),
  setSessionForConversation: vi.fn(),
  touchSession: vi.fn(),
  setAcpToAppSessionMapping: vi.fn(),
}))

vi.mock("./emit-agent-progress", () => ({
  emitAgentProgress: mockEmitAgentProgress,
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    loadConversation: mockLoadConversation,
    addMessageToConversation: mockAddMessageToConversation,
  },
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("acp-main-agent", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    sessionUpdateHandler = undefined

    mockLoadConversation.mockResolvedValue(undefined)
    mockAddMessageToConversation.mockResolvedValue(undefined)
    mockGetOrCreateSession.mockResolvedValue("acp-session-1")
    mockSendPrompt.mockResolvedValue({ success: true, response: "done" })
    mockOn.mockImplementation((eventName: string, handler: (event: any) => void) => {
      if (eventName === "sessionUpdate") {
        sessionUpdateHandler = handler
      }
    })
    mockGetAgentInstance.mockReturnValue({
      agentInfo: { name: "test-agent", title: "Test Agent", version: "1.0.0" },
      sessionInfo: {
        configOptions: [
          {
            id: "model",
            name: "Model",
            type: "select",
            currentValue: "sonnet",
            options: [{ value: "sonnet", name: "Claude Sonnet" }],
          },
          {
            id: "mode",
            name: "Mode",
            type: "select",
            currentValue: "code",
            options: [{ value: "code", name: "Code" }],
          },
        ],
      },
    })
  })

  it("falls back to matching config option ids when categories are missing", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<{ acpSessionInfo?: Record<string, unknown> }> = []

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: "done",
      acpSessionId: "acp-session-1",
    }))
    expect(updates[0]?.acpSessionInfo).toEqual(expect.objectContaining({
      currentModel: "Claude Sonnet",
      currentMode: "Code",
      availableModels: [expect.objectContaining({ id: "sonnet", name: "Claude Sonnet" })],
      availableModes: [expect.objectContaining({ id: "code", name: "Code" })],
    }))
  })

  it("handles malformed config option choices without throwing", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<{ acpSessionInfo?: Record<string, unknown> }> = []

    mockGetAgentInstance.mockReturnValue({
      agentInfo: { name: "test-agent", title: "Test Agent", version: "1.0.0" },
      sessionInfo: {
        configOptions: [
          {
            id: "model",
            name: "Model",
            type: "select",
            currentValue: "sonnet",
            options: null,
          },
          {
            id: "mode",
            name: "Mode",
            type: "select",
            currentValue: "code",
            options: "invalid",
          },
        ],
      },
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result.success).toBe(true)
    expect(updates[0]?.acpSessionInfo).toEqual(expect.objectContaining({
      currentModel: "sonnet",
      currentMode: "code",
      availableModels: [],
      availableModes: [],
    }))
  })

  it("adds runtime-tool response instructions to ACP prompt context", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      profileSnapshot: {
        profileName: "augustus",
        displayName: "Auggie Agent",
        systemPrompt: "Be helpful",
        guidelines: "Stay concise",
      } as any,
    })

    expect(mockSendPrompt).toHaveBeenCalledWith(
      "test-agent",
      "dotagents:main:conversation-1",
      "hello",
      expect.stringContaining("respond_to_user"),
    )

    const promptContext = mockSendPrompt.mock.calls[0]?.[3]
    expect(promptContext).toContain("If injected DotAgents runtime tools are available")
    expect(promptContext).toContain('call "respond_to_user" first with the final user-facing answer')
    expect(promptContext).toContain('then call "mark_work_complete" with a concise internal completion summary')
    expect(promptContext).toContain("System Prompt: Be helpful")
    expect(promptContext).toContain("Guidelines: Stay concise")
  })

  it("emits staged ACP setup progress before prompting the agent", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockGetOrCreateSession.mockImplementation(async (...args: any[]) => {
      const onStage = args[5] as ((stage: string) => void) | undefined
      onStage?.("launching")
      onStage?.("initializing")
      onStage?.("creating_session")
      return "acp-session-1"
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(updates.slice(0, 4).map((update) => update.steps?.[0]?.title)).toEqual([
      "Starting test-agent...",
      "Initializing test-agent...",
      "Preparing test-agent session...",
      "Sending prompt to test-agent...",
    ])
    expect(updates.slice(0, 4).every((update) => update.isComplete === false)).toBe(true)
  })

  it("keeps ACP session/update notifications non-final until sendPrompt resolves", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: "Almost done" }],
        isComplete: true,
      })

      return { success: true, response: "Final answer" }
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    const streamedResponseUpdate = updates.find((update) => update.steps?.[0]?.title === "Agent response")
    expect(streamedResponseUpdate).toEqual(expect.objectContaining({
      isComplete: false,
      streamingContent: { text: "Almost done", isStreaming: false },
    }))

    expect(updates.at(-1)).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: "Final answer",
    }))
  })

  it("adds ACP content blocks to conversation history progressively instead of only at completion", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: "Working on it" }],
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "tool_use", name: "web_search", input: { query: "acp" } }],
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "tool_result", result: { content: "Found docs" } }],
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "resource_link", title: "ACP Docs", uri: "https://example.com/acp" }],
        isComplete: false,
      })

      return { success: true, response: "Working on it" }
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    const lastStreamingUpdate = [...updates].reverse().find((update) => update.isComplete === false)
    expect(lastStreamingUpdate?.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "assistant", content: "Working on it" }),
        expect.objectContaining({
          role: "assistant",
          toolCalls: [expect.objectContaining({ name: "web_search", arguments: { query: "acp" } })],
        }),
        expect.objectContaining({
          role: "tool",
          toolResults: [expect.objectContaining({ success: true, content: "Found docs" })],
        }),
        expect.objectContaining({ role: "assistant", content: "[ACP Docs](https://example.com/acp)" }),
      ]),
    )

    const completedUpdate = updates.at(-1)
    expect(
      completedUpdate?.conversationHistory?.filter(
        (entry: any) => entry.role === "assistant" && entry.content === "Working on it",
      ),
    ).toHaveLength(1)
  })

  it("maps ACP toolCall lifecycle updates into assistant/tool conversation history items", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: "Let me check that" }],
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-123",
          title: "Tool: web_search",
          status: "running",
          rawInput: { query: "acp session update" },
        },
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-123",
          title: "Tool: web_search",
          status: "completed",
          rawInput: { query: "acp session update" },
          rawOutput: { content: "Found the docs" },
        },
        isComplete: false,
      })

      return { success: true, response: "Let me check that" }
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    const lastStreamingUpdate = [...updates].reverse().find((update) => update.isComplete === false)
    expect(lastStreamingUpdate?.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          content: "Let me check that",
          toolCalls: [expect.objectContaining({ name: "web_search", arguments: { query: "acp session update" } })],
        }),
        expect.objectContaining({
          role: "tool",
          toolResults: [expect.objectContaining({ success: true, content: '{\n  "content": "Found the docs"\n}' })],
        }),
      ]),
    )
  })

  it("keeps fallback ACP toolCall ids unique when updates omit toolCallId", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          title: "Tool: web_search",
          status: "running",
          rawInput: { query: "first query" },
        },
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          title: "Tool: web_search",
          status: "running",
          rawInput: { query: "second query" },
        },
        isComplete: false,
      })

      return { success: true, response: "done" }
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    const lastStreamingUpdate = [...updates].reverse().find((update) => update.isComplete === false)
    expect(
      lastStreamingUpdate?.conversationHistory?.filter((entry: any) => entry.role === "assistant" && entry.toolCalls?.length),
    ).toEqual([
      expect.objectContaining({
        toolCalls: [expect.objectContaining({ arguments: { query: "first query" } })],
      }),
      expect.objectContaining({
        toolCalls: [expect.objectContaining({ arguments: { query: "second query" } })],
      }),
    ])
  })

  it("emits userResponse history for ACP respond_to_user calls and prefers it as the final response", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-r1",
          title: "Tool: respond_to_user",
          status: "completed",
          rawInput: { text: "First response" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-r2",
          title: "Tool: respond_to_user",
          status: "completed",
          rawInput: { text: "Final user-facing answer" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })

      return { success: true, response: "Internal trailing completion text" }
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result.response).toBe("Final user-facing answer")

    const lastStreamingUpdate = [...updates].reverse().find((update) => update.isComplete === false)
    expect(lastStreamingUpdate).toEqual(expect.objectContaining({
      userResponse: "Final user-facing answer",
      userResponseHistory: ["First response"],
    }))

    const completedUpdate = updates.at(-1)
    expect(completedUpdate).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: "Final user-facing answer",
    }))
    expect(completedUpdate?.responseEvents).toEqual([
      expect.objectContaining({ text: "First response" }),
      expect.objectContaining({ text: "Final user-facing answer" }),
    ])
  })

  it("uses shared monotonic fallback timestamps for ACP responseEvents", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(Number.NaN)

    try {
      mockSendPrompt.mockImplementation(async () => {
        sessionUpdateHandler?.({
          sessionId: "acp-session-1",
          toolCall: {
            toolCallId: "tool-r1",
            title: "Tool: respond_to_user",
            status: "completed",
            rawInput: { text: "First response" },
            rawOutput: { success: true },
          },
          isComplete: false,
        })
        sessionUpdateHandler?.({
          sessionId: "acp-session-1",
          toolCall: {
            toolCallId: "tool-r2",
            title: "Tool: respond_to_user",
            status: "completed",
            rawInput: { text: "Second response" },
            rawOutput: { success: true },
          },
          isComplete: false,
        })

        return { success: true, response: "Internal trailing completion text" }
      })

      await processTranscriptWithACPAgent("hello", {
        agentName: "test-agent",
        conversationId: "conversation-1",
        sessionId: "ui-session-1",
        runId: 1,
        onProgress: (update) => updates.push(update),
      })
    } finally {
      dateNowSpy.mockRestore()
    }

    const completedUpdate = updates.at(-1)
    expect(completedUpdate?.responseEvents).toEqual([
      expect.objectContaining({ text: "First response", timestamp: 0 }),
      expect.objectContaining({ text: "Second response", timestamp: 2 }),
    ])
  })

  it("uses the same fallback session identifier for ACP responseEvent ids and sessionId", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-fallback-session",
          title: "Tool: respond_to_user",
          status: "completed",
          rawInput: { text: "Fallback session response" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })

      return { success: true, response: "Internal fallback" }
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: undefined,
      runId: 1,
      onProgress: (update) => updates.push(update),
    } as any)

    const responseEvent = updates.at(-1)?.responseEvents?.[0]
    expect(responseEvent).toEqual(expect.objectContaining({
      sessionId: "acp-session",
      runId: 1,
      text: "Fallback session response",
    }))
    expect(responseEvent?.id).toContain(`acp-${responseEvent?.sessionId}-${responseEvent?.runId}-`)
  })

  it("recognizes humanized ACP respond-to-user tool titles for userResponse rendering", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-humanized-response",
          title: "Tool: Respond to User",
          status: "completed",
          rawInput: { text: "Rendered from humanized tool title" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })

      return { success: true, response: "Internal fallback" }
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result.response).toBe("Rendered from humanized tool title")

    const completedUpdate = updates.at(-1)
    expect(completedUpdate).toEqual(expect.objectContaining({
      finalContent: "Rendered from humanized tool title",
    }))
    expect(completedUpdate?.responseEvents).toEqual([
      expect.objectContaining({ text: "Rendered from humanized tool title" }),
    ])

    expect(completedUpdate?.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          toolCalls: [expect.objectContaining({ name: "respond_to_user" })],
        }),
      ]),
    )
  })

  it("recognizes injected runtime-tool aliases for respond_to_user final rendering", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-runtime-alias-response",
          title: "respond_to_user_dotagents-runtime-tools",
          status: "completed",
          rawInput: { text: "Rendered from runtime tool alias" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })

      return { success: true, response: "Internal fallback" }
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result.response).toBe("Rendered from runtime tool alias")

    const completedUpdate = updates.at(-1)
    expect(completedUpdate).toEqual(expect.objectContaining({
      finalContent: "Rendered from runtime tool alias",
    }))
    expect(completedUpdate?.responseEvents).toEqual([
      expect.objectContaining({ text: "Rendered from runtime tool alias" }),
    ])
    expect(completedUpdate?.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          toolCalls: [expect.objectContaining({ name: "respond_to_user" })],
        }),
      ]),
    )
  })

  it("persists only the final assistant response back to the conversation", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")

    mockLoadConversation.mockResolvedValue({
      messages: [{ role: "user", content: "hello", timestamp: 1 }],
    })

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-1",
          title: "Tool: web_search",
          status: "completed",
          rawInput: { query: "persist this" },
          rawOutput: { content: "Found persisted result" },
        },
        isComplete: false,
      })

      return { success: true, response: "done" }
    })

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
    })

    expect(mockAddMessageToConversation).toHaveBeenCalledTimes(1)
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      "done",
      "assistant",
    )
  })

  it("persists the final respond_to_user content instead of streamed internal ACP text", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")

    mockLoadConversation.mockResolvedValue({
      messages: [{ role: "user", content: "who are you", timestamp: 1 }],
    })

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: "**Responding to user prompt**" }],
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-r1",
          title: "Tool: respond_to_user",
          status: "completed",
          rawInput: { text: "Clean final answer" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })

      return { success: true, response: "Internal trailing completion text" }
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
    })

    expect(result.response).toBe("Clean final answer")
    expect(mockAddMessageToConversation).toHaveBeenCalledTimes(1)
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      "Clean final answer",
      "assistant",
    )
  })

  it("persists the latest respond_to_user content even when sendPrompt fails afterward", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")

    mockLoadConversation.mockResolvedValue({
      messages: [{ role: "user", content: "who are you", timestamp: 1 }],
    })

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-r1",
          title: "Tool: respond_to_user",
          status: "completed",
          rawInput: { text: "Partial final answer" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })

      throw new Error("stream interrupted")
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
    })

    expect(result).toEqual(expect.objectContaining({
      success: false,
      error: "stream interrupted",
    }))
    expect(mockAddMessageToConversation).toHaveBeenCalledTimes(1)
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      "Partial final answer",
      "assistant",
    )
  })

  it("passes the stable acpx session name back into getOrCreateSession for restart-safe reuse", async () => {
    const acpSessionState = await import("./acp-session-state")
    vi.mocked(acpSessionState.getSessionForConversation).mockReturnValue({
      sessionId: "persisted-acp-session",
      agentName: "test-agent",
      createdAt: 1,
      lastUsedAt: 1,
    })

    mockGetOrCreateSession.mockResolvedValue("persisted-acp-session")

    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
    })

    expect(mockGetOrCreateSession).toHaveBeenCalledWith(
      "test-agent",
      undefined,
      undefined,
      { appSessionId: "ui-session-1" },
      "dotagents:main:conversation-1",
      undefined,
    )
  })

  it("does not redundantly touch a reused ACP conversation mapping after persisting it", async () => {
    const acpSessionState = await import("./acp-session-state")
    vi.mocked(acpSessionState.getSessionForConversation).mockReturnValue({
      sessionId: "persisted-acp-session",
      agentName: "test-agent",
      createdAt: 1,
      lastUsedAt: 1,
    })

    mockGetOrCreateSession.mockResolvedValue("persisted-acp-session")

    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")

    await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
    })

    expect(acpSessionState.setSessionForConversation).toHaveBeenCalledWith(
      "conversation-1",
      "persisted-acp-session",
      "test-agent",
      "dotagents:main:conversation-1",
    )
    expect(acpSessionState.touchSession).not.toHaveBeenCalled()
  })
})
