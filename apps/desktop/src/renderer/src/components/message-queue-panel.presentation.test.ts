import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")

describe("desktop message queue panel presentation", () => {
  it("uses shared queue presentation helpers for visible copy and labels", () => {
    expect(source).toContain("MESSAGE_QUEUE_PANEL_PRESENTATION")
    expect(source).toContain("formatMessageQueueCompactLabel(messages.length, isPaused)")
    expect(source).toContain("formatMessageQueuePanelTitle(messages.length, isPaused)")
    expect(source).toContain("getQueuedMessageItemPresentation(message, isExpanded)")
    expect(source).toContain("getMessageQueueListToggleLabel(isListCollapsed)")
    expect(source).toContain("messagePresentation")
    expect(source).not.toContain('{isPaused ? "Paused" : "Queued"} ({messages.length})')
    expect(source).not.toContain("Paused. Click Resume to continue.</div>")
  })
})
