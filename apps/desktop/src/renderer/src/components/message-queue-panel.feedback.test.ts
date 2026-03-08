import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")

describe("desktop message queue action feedback", () => {
  it("shows visible feedback when queue actions fail or become stale", () => {
    expect(source).toContain('import { toast } from "sonner"')
    expect(source).toContain('function getActionErrorMessage(error: unknown, fallback: string): string')
    expect(source).toContain('const success = await tipcClient.retryQueuedMessage({')
    expect(source).toContain('throw new Error("This queued message is no longer retryable.")')
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to retry queued message:", error)')
    expect(source).toContain(
      '`Failed to retry queued message. ${getActionErrorMessage(error, "Please refresh and try again.")}`',
    )
    expect(source).toContain('const success = await tipcClient.removeFromMessageQueue({ conversationId, messageId: message.id })')
    expect(source).toContain('throw new Error("This queued message is no longer removable.")')
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to remove queued message:", error)')
    expect(source).toContain(
      '`Failed to remove queued message. ${getActionErrorMessage(error, "Please refresh and try again.")}`',
    )
    expect(source).toContain('throw new Error("This queued message can no longer be edited.")')
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to save queued message:", error)')
    expect(source).toContain(
      '`Failed to save queued message. ${getActionErrorMessage(error, "Please refresh and try again.")}`',
    )
    expect(source).toContain('const success = await tipcClient.clearMessageQueue({ conversationId })')
    expect(source).toContain('throw new Error("Wait for the current message to finish before clearing queued messages.")')
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to clear queued messages:", error)')
    expect(source).toContain(
      '`Failed to clear queued messages. ${getActionErrorMessage(error, "Please refresh and try again.")}`',
    )
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to pause queue:", error)')
    expect(source).toContain('toast.error(`Failed to pause queue. ${getActionErrorMessage(error, "Please try again.")}`)')
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to resume queue:", error)')
    expect(source).toContain('toast.error(`Failed to resume queue. ${getActionErrorMessage(error, "Please try again.")}`)')
  })
})
