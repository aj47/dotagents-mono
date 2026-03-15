import { describe, it, expect, vi, beforeEach } from "vitest"
import { MessageQueueService, setMessageQueueServiceProgressEmitter } from "./message-queue-service"
import type { ProgressEmitter } from "./interfaces/progress-emitter"

// Mock debug module
vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("MessageQueueService", () => {
  let service: MessageQueueService
  let mockEmitter: ProgressEmitter

  beforeEach(() => {
    service = new MessageQueueService()
    mockEmitter = {
      emitAgentProgress: vi.fn(),
      emitSessionUpdate: vi.fn(),
      emitQueueUpdate: vi.fn(),
      emitEvent: vi.fn(),
    }
    setMessageQueueServiceProgressEmitter(mockEmitter)
  })

  it("should enqueue a message and emit update", () => {
    const msg = service.enqueue("conv-1", "Hello")
    expect(msg.id).toBeTruthy()
    expect(msg.conversationId).toBe("conv-1")
    expect(msg.text).toBe("Hello")
    expect(msg.status).toBe("pending")
    expect(mockEmitter.emitQueueUpdate).toHaveBeenCalledWith({
      conversationId: "conv-1",
      queue: expect.arrayContaining([expect.objectContaining({ text: "Hello" })]),
      isPaused: false,
    })
  })

  it("should get queue for a conversation", () => {
    service.enqueue("conv-1", "msg1")
    service.enqueue("conv-1", "msg2")
    service.enqueue("conv-2", "msg3")

    const queue1 = service.getQueue("conv-1")
    expect(queue1).toHaveLength(2)

    const queue2 = service.getQueue("conv-2")
    expect(queue2).toHaveLength(1)

    const queueEmpty = service.getQueue("conv-3")
    expect(queueEmpty).toHaveLength(0)
  })

  it("should get all queues", () => {
    service.enqueue("conv-1", "msg1")
    service.enqueue("conv-2", "msg2")

    const all = service.getAllQueues()
    expect(all).toHaveLength(2)
  })

  it("should remove a message from queue", () => {
    const msg = service.enqueue("conv-1", "Hello")
    const removed = service.removeFromQueue("conv-1", msg.id)
    expect(removed).toBe(true)
    expect(service.getQueue("conv-1")).toHaveLength(0)
  })

  it("should not remove processing message", () => {
    const msg = service.enqueue("conv-1", "Hello")
    service.markProcessing("conv-1", msg.id)
    const removed = service.removeFromQueue("conv-1", msg.id)
    expect(removed).toBe(false)
  })

  it("should clear queue", () => {
    service.enqueue("conv-1", "msg1")
    service.enqueue("conv-1", "msg2")
    const cleared = service.clearQueue("conv-1")
    expect(cleared).toBe(true)
    expect(service.getQueue("conv-1")).toHaveLength(0)
  })

  it("should not clear queue with processing message", () => {
    const msg = service.enqueue("conv-1", "msg1")
    service.markProcessing("conv-1", msg.id)
    const cleared = service.clearQueue("conv-1")
    expect(cleared).toBe(false)
  })

  it("should peek next pending message", () => {
    const msg1 = service.enqueue("conv-1", "first")
    service.enqueue("conv-1", "second")

    const peeked = service.peek("conv-1")
    expect(peeked?.id).toBe(msg1.id)
  })

  it("should not peek if first message is failed", () => {
    const msg = service.enqueue("conv-1", "msg1")
    service.markFailed("conv-1", msg.id, "error")
    expect(service.peek("conv-1")).toBeNull()
  })

  it("should mark message as processed and remove from queue", () => {
    const msg = service.enqueue("conv-1", "Hello")
    service.markProcessing("conv-1", msg.id)
    const processed = service.markProcessed("conv-1", msg.id)
    expect(processed).toBe(true)
    expect(service.getQueue("conv-1")).toHaveLength(0)
  })

  it("should mark message as failed", () => {
    const msg = service.enqueue("conv-1", "Hello")
    service.markFailed("conv-1", msg.id, "Network error")

    const queue = service.getQueue("conv-1")
    expect(queue[0].status).toBe("failed")
    expect(queue[0].errorMessage).toBe("Network error")
  })

  it("should update message text", () => {
    const msg = service.enqueue("conv-1", "original")
    const updated = service.updateMessageText("conv-1", msg.id, "updated")
    expect(updated).toBe(true)

    const queue = service.getQueue("conv-1")
    expect(queue[0].text).toBe("updated")
  })

  it("should not update text of processing message", () => {
    const msg = service.enqueue("conv-1", "original")
    service.markProcessing("conv-1", msg.id)
    const updated = service.updateMessageText("conv-1", msg.id, "new")
    expect(updated).toBe(false)
  })

  it("should reset failed message to pending", () => {
    const msg = service.enqueue("conv-1", "Hello")
    service.markFailed("conv-1", msg.id, "error")
    const reset = service.resetToPending("conv-1", msg.id)
    expect(reset).toBe(true)

    const queue = service.getQueue("conv-1")
    expect(queue[0].status).toBe("pending")
    expect(queue[0].errorMessage).toBeUndefined()
  })

  it("should not reset non-failed message", () => {
    const msg = service.enqueue("conv-1", "Hello")
    const reset = service.resetToPending("conv-1", msg.id)
    expect(reset).toBe(false)
  })

  it("should pause and resume queue", () => {
    expect(service.isQueuePaused("conv-1")).toBe(false)

    service.pauseQueue("conv-1")
    expect(service.isQueuePaused("conv-1")).toBe(true)

    // Paused state reflected in emitQueueUpdate
    expect(mockEmitter.emitQueueUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: "conv-1", isPaused: true })
    )

    service.resumeQueue("conv-1")
    expect(service.isQueuePaused("conv-1")).toBe(false)
  })

  it("should manage processing locks", () => {
    expect(service.tryAcquireProcessingLock("conv-1")).toBe(true)
    expect(service.isProcessing("conv-1")).toBe(true)
    expect(service.tryAcquireProcessingLock("conv-1")).toBe(false) // Already locked

    service.releaseProcessingLock("conv-1")
    expect(service.isProcessing("conv-1")).toBe(false)
    expect(service.tryAcquireProcessingLock("conv-1")).toBe(true) // Can acquire again
  })

  it("should not acquire lock when paused", () => {
    service.pauseQueue("conv-1")
    expect(service.tryAcquireProcessingLock("conv-1")).toBe(false)
  })

  it("should reorder queue", () => {
    const msg1 = service.enqueue("conv-1", "first")
    const msg2 = service.enqueue("conv-1", "second")
    const msg3 = service.enqueue("conv-1", "third")

    service.reorderQueue("conv-1", [msg3.id, msg1.id, msg2.id])

    const queue = service.getQueue("conv-1")
    expect(queue[0].id).toBe(msg3.id)
    expect(queue[1].id).toBe(msg1.id)
    expect(queue[2].id).toBe(msg2.id)
  })

  it("should check if conversation has queued messages", () => {
    expect(service.hasQueuedMessages("conv-1")).toBe(false)
    service.enqueue("conv-1", "Hello")
    expect(service.hasQueuedMessages("conv-1")).toBe(true)
  })

  it("should mark message as added to history", () => {
    const msg = service.enqueue("conv-1", "Hello")
    const marked = service.markAddedToHistory("conv-1", msg.id)
    expect(marked).toBe(true)

    // Should not be able to update text after added to history
    const updated = service.updateMessageText("conv-1", msg.id, "new text")
    expect(updated).toBe(false)
  })

  it("should handle no emitter without crashing", () => {
    setMessageQueueServiceProgressEmitter(null as unknown as ProgressEmitter)
    const freshService = new MessageQueueService()
    // Should not throw
    freshService.enqueue("conv-1", "Hello")
  })
})
