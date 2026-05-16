import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const messageQueuePanelSource = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")

describe("desktop message queue panel shared state predicates", () => {
  it("uses shared queued-message eligibility rules instead of local status checks", () => {
    expect(messageQueuePanelSource).toContain("getQueuedMessageItemPresentation(message, isExpanded)")
    expect(messageQueuePanelSource).toContain("getQueuedMessageEditDraftState(editText, message.text)")
    expect(messageQueuePanelSource).toContain("getMessageQueuePanelState(messages, {")
    expect(messageQueuePanelSource).toContain("queuePanelState.clearActionState.isDisabled")
    expect(messageQueuePanelSource).toContain("queuePanelState.pauseActionState.isDisabled")
    expect(messageQueuePanelSource).toContain("queuePanelState.items.map")
    expect(messageQueuePanelSource).toContain("editDraftState.submitState")
    expect(messageQueuePanelSource).toContain("editDraftState.saveActionState.isDisabled")

    expect(messageQueuePanelSource).not.toContain("message.status === 'processing'")
    expect(messageQueuePanelSource).not.toContain('message.status === "processing"')
    expect(messageQueuePanelSource).not.toContain("message.status === 'failed'")
    expect(messageQueuePanelSource).not.toContain('message.status === "failed"')
    expect(messageQueuePanelSource).not.toContain("hasProcessingQueuedMessage(messages)")
    expect(messageQueuePanelSource).not.toContain('messages.some((m) => m.status === "processing")')
    expect(messageQueuePanelSource).not.toContain("getQueuedMessageEditSaveActionState(editText)")
    expect(messageQueuePanelSource).not.toContain("getQueuedMessageEditSubmitState(editText, message.text)")
    expect(messageQueuePanelSource).not.toContain("!queuePanelState.canClear")
    expect(messageQueuePanelSource).not.toContain("!queuePanelState.canPause")
    expect(messageQueuePanelSource).not.toContain("!editText.trim()")
  })
})
