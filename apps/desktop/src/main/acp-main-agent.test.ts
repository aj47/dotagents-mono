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
  getSessionForConversation: vi.fn(() => undefined),
  setSessionForConversation: vi.fn(),
  clearSessionForConversation: vi.fn(),
  touchSession: vi.fn(),
  setAcpToSpeakMcpSessionMapping: vi.fn(),
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

  it("short-circuits low-context next-step prompts before sending ACP work", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<{ isComplete?: boolean; finalContent?: string }> = []

    mockLoadConversation.mockResolvedValue({
      messages: [{ role: "user", content: "What should I do next?", timestamp: 1 }],
    })

    const result = await processTranscriptWithACPAgent("What should I do next?", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: expect.stringContaining("I need a bit more context before I can suggest the next step."),
    }))
    expect(mockSendPrompt).not.toHaveBeenCalled()
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      expect.stringContaining("I need a bit more context before I can suggest the next step."),
      "assistant",
      undefined,
      undefined,
    )
    expect(updates.at(-1)).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: expect.stringContaining("I need a bit more context before I can suggest the next step."),
    }))
  })

  it("acknowledges short pause requests with history before sending ACP work", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<{ isComplete?: boolean; finalContent?: string }> = []

    mockLoadConversation.mockResolvedValue({
      messages: [
        { role: "assistant", content: "Work on #57 now.", timestamp: 1 },
        { role: "user", content: "i actually have to hold on this for now", timestamp: 2 },
      ],
    })

    const result = await processTranscriptWithACPAgent("i actually have to hold on this for now", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: expect.stringContaining("pause this for now"),
    }))
    expect(mockSendPrompt).not.toHaveBeenCalled()
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      expect.stringContaining("pause this for now"),
      "assistant",
      undefined,
      undefined,
    )
    expect(updates.at(-1)).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: expect.stringContaining("pause this for now"),
    }))
  })

  it("short-circuits fragmentary follow-ups with history before sending ACP work", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<{ isComplete?: boolean; finalContent?: string }> = []

    mockLoadConversation.mockResolvedValue({
      messages: [
        {
          role: "user",
          content:
            "okay yeah lets clean up first and dont start any new tasks yet we should have one agent running in an item terminal window thats working on those a loops",
          timestamp: 1,
        },
        { role: "user", content: "terminals and one agent running in each", timestamp: 2 },
      ],
    })

    const result = await processTranscriptWithACPAgent("terminals and one agent running in each", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: expect.stringContaining("may have been cut off"),
    }))
    expect(mockSendPrompt).not.toHaveBeenCalled()
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      expect.stringContaining("may have been cut off"),
      "assistant",
      undefined,
      undefined,
    )
    expect(updates.at(-1)).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: expect.stringContaining("may have been cut off"),
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

  it("adds builtin response-tool instructions to ACP prompt context", async () => {
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
      "acp-session-1",
      "hello",
      expect.stringContaining("respond_to_user"),
    )

    const promptContext = mockSendPrompt.mock.calls[0]?.[3]
    expect(promptContext).toContain('injected MCP server "dotagents-builtin"')
    expect(promptContext).toContain('call "respond_to_user" first with the final user-facing answer')
    expect(promptContext).toContain('then call "mark_work_complete" with a concise completion summary')
    expect(promptContext).toContain("System Prompt: Be helpful")
    expect(promptContext).toContain("Guidelines: Stay concise")
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
      userResponse: "Final user-facing answer",
      userResponseHistory: ["First response"],
    }))
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
      userResponse: "Rendered from humanized tool title",
      finalContent: "Rendered from humanized tool title",
    }))

    expect(completedUpdate?.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          toolCalls: [expect.objectContaining({ name: "respond_to_user" })],
        }),
      ]),
    )
  })

  it("prefers current-prompt respond_to_user output over trailing fallback text and persists the clean result", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []

    mockLoadConversation.mockResolvedValue({
      messages: [
        {
          role: "assistant",
          content: "",
          toolCalls: [{ name: "respond_to_user", arguments: { text: "Older user-facing answer" } }],
          timestamp: 1,
        },
      ],
    })

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-r-current",
          title: "Tool: respond_to_user",
          status: "completed",
          rawInput: { text: "Fresh user-facing answer" },
          rawOutput: { success: true },
        },
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: "I couldn't complete the request after multiple attempts." }],
        isComplete: false,
      })

      return {
        success: false,
        response: "I couldn't complete the request after multiple attempts.",
        error: "I couldn't complete the request after multiple attempts.",
      }
    })

    const result = await processTranscriptWithACPAgent("hello", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: "Fresh user-facing answer",
      error: undefined,
    }))

    const completedUpdate = updates.at(-1)
    expect(completedUpdate).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: "Fresh user-facing answer",
      userResponse: "Fresh user-facing answer",
    }))
    expect(
      completedUpdate?.conversationHistory?.some(
        (entry: any) => entry.role === "assistant" && entry.content?.includes("couldn't complete the request after multiple attempts"),
      ),
    ).toBe(false)

    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      "",
      "assistant",
      [expect.objectContaining({ name: "respond_to_user", arguments: { text: "Fresh user-facing answer" } })],
      undefined,
    )
    expect(
      mockAddMessageToConversation.mock.calls.some(
        (call: unknown[]) => {
          const content = call[1]
          const role = call[2]
          return role === "assistant" && typeof content === "string" && content.includes("couldn't complete the request after multiple attempts")
        },
      ),
    ).toBe(false)
  })

  it("falls back to mark_work_complete summary when ACP only returns raw tool scaffolding text", async () => {
    const { processTranscriptWithACPAgent } = await import("./acp-main-agent")
    const updates: Array<any> = []
    const rawToolScaffolding = '[list_repeat_tasks] {"success":true,"tasks":[{"id":"weekly-memory-hygiene"}]}'

    mockSendPrompt.mockImplementation(async () => {
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: rawToolScaffolding }],
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        toolCall: {
          toolCallId: "tool-complete",
          title: "Tool: mark_work_complete",
          status: "completed",
          rawInput: { summary: "Reported the enabled repeat tasks to the user." },
          rawOutput: { success: true },
        },
        isComplete: false,
      })
      sessionUpdateHandler?.({
        sessionId: "acp-session-1",
        content: [{ type: "text", text: rawToolScaffolding }],
        isComplete: false,
      })

      return {
        success: true,
        response: rawToolScaffolding,
      }
    })

    const result = await processTranscriptWithACPAgent("Are there any repeat tasks that should be turned on?", {
      agentName: "test-agent",
      conversationId: "conversation-1",
      sessionId: "ui-session-1",
      runId: 1,
      onProgress: (update) => updates.push(update),
    })

    expect(result).toEqual(expect.objectContaining({
      success: true,
      response: "Reported the enabled repeat tasks to the user.",
      error: undefined,
    }))

    const completedUpdate = updates.at(-1)
    expect(completedUpdate).toEqual(expect.objectContaining({
      isComplete: true,
      finalContent: "Reported the enabled repeat tasks to the user.",
    }))
    expect(
      completedUpdate?.conversationHistory?.some(
        (entry: any) => entry.role === "assistant" && typeof entry.content === "string" && entry.content.includes("[list_repeat_tasks]"),
      ),
    ).toBe(false)
    expect(completedUpdate?.conversationHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          content: "",
          toolCalls: [expect.objectContaining({ name: "mark_work_complete" })],
        }),
        expect.objectContaining({
          role: "assistant",
          content: "Reported the enabled repeat tasks to the user.",
        }),
      ]),
    )
    expect(
      mockAddMessageToConversation.mock.calls.some(
        (call: unknown[]) => {
          const content = call[1]
          return typeof content === "string" && content.includes("[list_repeat_tasks]")
        },
      ),
    ).toBe(false)
  })

  it("persists ACP tool-call and tool-result history back to the conversation", async () => {
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

    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      "",
      "assistant",
      [expect.objectContaining({ name: "web_search" })],
      undefined,
    )
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conversation-1",
      '{\n  "content": "Found persisted result"\n}',
      "tool",
      undefined,
      [expect.objectContaining({ success: true, content: '{\n  "content": "Found persisted result"\n}' })],
    )
  })
})
