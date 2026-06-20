import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./window", () => ({
  WINDOWS: new Map(),
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: () => ({}),
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("MessageQueueService injection targets", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("lets ordinary queued messages proceed past a pending injection message", async () => {
    const { messageQueueService } = await import("./message-queue-service")
    const conversationId = `conv-${Date.now()}-${Math.random()}`

    const first = messageQueueService.enqueue(
      conversationId,
      "Inject after tool",
    )
    const second = messageQueueService.enqueue(
      conversationId,
      "Normal follow-up",
    )

    expect(
      messageQueueService.setInjectionTarget(
        conversationId,
        first.id,
        "after_next_tool_response",
      ),
    ).toBe(true)

    expect(messageQueueService.peek(conversationId)?.id).toBe(second.id)

    const injectionMessage = messageQueueService.peekInjectionTarget(
      conversationId,
      "after_next_tool_response",
    )
    expect(injectionMessage?.id).toBe(first.id)
    expect(messageQueueService.markProcessing(conversationId, injectionMessage!.id)).toBe(true)
    expect(messageQueueService.markProcessed(conversationId, injectionMessage!.id)).toBe(true)
    expect(messageQueueService.peek(conversationId)?.id).toBe(second.id)
  })

  it("can clear a pending message injection target", async () => {
    const { messageQueueService } = await import("./message-queue-service")
    const conversationId = `conv-${Date.now()}-${Math.random()}`
    const message = messageQueueService.enqueue(
      conversationId,
      "Queued follow-up",
    )

    expect(
      messageQueueService.setInjectionTarget(
        conversationId,
        message.id,
        "after_next_agent_response",
      ),
    ).toBe(true)
    expect(messageQueueService.peek(conversationId)).toBeNull()

    expect(
      messageQueueService.setInjectionTarget(conversationId, message.id, null),
    ).toBe(true)
    expect(messageQueueService.peek(conversationId)?.id).toBe(message.id)
  })
})
