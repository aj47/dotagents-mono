import { describe, expect, it, vi } from "vitest"

vi.mock("./window", () => ({
  WINDOWS: {
    get: vi.fn(() => null),
  },
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: vi.fn(),
}))

import { formatSteeringMessageForModel, messageQueueService } from "./message-queue-service"

describe("messageQueueService steering messages", () => {
  it("consumes active-run steering without consuming normal queued prompts", () => {
    const conversationId = `conv_${Date.now()}_${Math.random()}`
    const sessionId = `session_${Date.now()}`

    const prompt = messageQueueService.enqueue(conversationId, "finish the original task", sessionId)
    const steering = messageQueueService.enqueue(conversationId, "prefer the shorter path", sessionId, undefined, "steering")
    const otherSessionSteering = messageQueueService.enqueue(
      conversationId,
      "for a different run",
      "session_other",
      undefined,
      "steering",
    )

    const consumed = messageQueueService.consumePendingSteeringMessages(conversationId, sessionId)

    expect(consumed).toHaveLength(1)
    expect(consumed[0]).toMatchObject({
      id: steering.id,
      kind: "steering",
      status: "processing",
      text: "prefer the shorter path",
    })
    expect(messageQueueService.getQueue(conversationId).map((message) => message.id)).toEqual([
      prompt.id,
      otherSessionSteering.id,
    ])
  })

  it("formats steering as a bounded model-facing message", () => {
    expect(formatSteeringMessageForModel("switch to tests first")).toContain("<steering_message>")
    expect(formatSteeringMessageForModel("switch to tests first")).toContain("User steering:\nswitch to tests first")
    expect(formatSteeringMessageForModel("switch to tests first")).toContain("</steering_message>")
  })
})
