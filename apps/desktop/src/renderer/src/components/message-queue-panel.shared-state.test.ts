import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const messageQueuePanelSource = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")

describe("desktop message queue panel shared state predicates", () => {
  it("uses shared queued-message eligibility rules instead of local status checks", () => {
    expect(messageQueuePanelSource).toContain("isQueuedMessageProcessing(message)")
    expect(messageQueuePanelSource).toContain("isQueuedMessageFailed(message)")
    expect(messageQueuePanelSource).toContain("canMutateQueuedMessage(message)")
    expect(messageQueuePanelSource).toContain("canEditQueuedMessage(message)")
    expect(messageQueuePanelSource).toContain("hasProcessingQueuedMessage(messages)")

    expect(messageQueuePanelSource).not.toContain("message.status === 'processing'")
    expect(messageQueuePanelSource).not.toContain('message.status === "processing"')
    expect(messageQueuePanelSource).not.toContain("message.status === 'failed'")
    expect(messageQueuePanelSource).not.toContain('message.status === "failed"')
    expect(messageQueuePanelSource).not.toContain('messages.some((m) => m.status === "processing")')
  })
})
