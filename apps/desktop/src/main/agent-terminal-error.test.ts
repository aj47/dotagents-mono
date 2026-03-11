import { beforeEach, describe, expect, it, vi } from "vitest"

const mockAddMessageToConversation = vi.fn(() => Promise.resolve())

vi.mock("./conversation-service", () => ({
  conversationService: {
    addMessageToConversation: mockAddMessageToConversation,
  },
}))

describe("agent terminal error helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddMessageToConversation.mockResolvedValue(undefined)
  })

  it("builds a clean user-visible failure message for unexpected terminal errors", async () => {
    const { buildUnexpectedAgentFailureMessage } = await import("./agent-terminal-error")

    expect(buildUnexpectedAgentFailureMessage(new Error("Cannot connect to API:"))).toBe(
      "I couldn't complete the request because an unexpected error interrupted the run: Cannot connect to API. Please try again.",
    )
  })

  it("appends and persists a terminal assistant message once", async () => {
    const { appendAndPersistTerminalAssistantMessage } = await import("./agent-terminal-error")

    const conversationHistory = [
      { role: "user" as const, content: "Reply with exactly: session test ok" },
    ]

    await appendAndPersistTerminalAssistantMessage({
      conversationId: "conv-test",
      conversationHistory,
      assistantContent:
        "I couldn't complete the request because an unexpected error interrupted the run: Cannot connect to API. Please try again.",
    })

    expect(conversationHistory).toHaveLength(2)
    expect(conversationHistory[1]).toMatchObject({
      role: "assistant",
      content:
        "I couldn't complete the request because an unexpected error interrupted the run: Cannot connect to API. Please try again.",
    })
    expect(mockAddMessageToConversation).toHaveBeenCalledWith(
      "conv-test",
      "I couldn't complete the request because an unexpected error interrupted the run: Cannot connect to API. Please try again.",
      "assistant",
    )

    await appendAndPersistTerminalAssistantMessage({
      conversationId: "conv-test",
      conversationHistory,
      assistantContent:
        "I couldn't complete the request because an unexpected error interrupted the run: Cannot connect to API. Please try again.",
    })

    expect(conversationHistory).toHaveLength(2)
    expect(mockAddMessageToConversation).toHaveBeenCalledTimes(1)
  })
})