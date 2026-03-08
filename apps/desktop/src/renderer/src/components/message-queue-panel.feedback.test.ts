import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")

describe("desktop message queue retry feedback", () => {
  it("shows visible feedback when retrying a queued message fails or is stale", () => {
    expect(source).toContain('import { toast } from "sonner"')
    expect(source).toContain('function getActionErrorMessage(error: unknown, fallback: string): string')
    expect(source).toContain('const success = await tipcClient.retryQueuedMessage({')
    expect(source).toContain('throw new Error("This queued message is no longer retryable.")')
    expect(source).toContain('console.error("[MessageQueuePanel] Failed to retry queued message:", error)')
    expect(source).toContain(
      '`Failed to retry queued message. ${getActionErrorMessage(error, "Please refresh and try again.")}`',
    )
  })
})