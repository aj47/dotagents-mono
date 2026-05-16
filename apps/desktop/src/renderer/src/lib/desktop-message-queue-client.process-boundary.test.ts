import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-message-queue-client.ts", import.meta.url), "utf8")
const messageQueuePanelSource = readFileSync(new URL("../components/message-queue-panel.tsx", import.meta.url), "utf8")
const useStoreSyncSource = readFileSync(new URL("../hooks/use-store-sync.ts", import.meta.url), "utf8")

describe("desktop message queue renderer client", () => {
  it("centralizes message queue IPC channels", () => {
    expect(clientSource).toContain('from "@dotagents/shared/session-presentation"')
    expect(clientSource).not.toContain('from "@dotagents/shared/message-queue-utils"')
    expect(clientSource).toContain("rendererHandlers.onMessageQueueUpdate.listen(listener)")
    expect(clientSource).toContain("tipcClient.getAllMessageQueues()")
    expect(clientSource).toContain("tipcClient.removeFromMessageQueue({ conversationId, messageId })")
    expect(clientSource).toContain("tipcClient.updateQueuedMessageText({ conversationId, messageId, text })")
    expect(clientSource).toContain("tipcClient.retryQueuedMessage({ conversationId, messageId })")
    expect(clientSource).toContain("tipcClient.clearMessageQueue({ conversationId })")
    expect(clientSource).toContain("tipcClient.resumeMessageQueue({ conversationId })")
    expect(clientSource).toContain("tipcClient.pauseMessageQueue({ conversationId })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps message queue UI and store hydration off direct queue IPC channels", () => {
    const combinedSource = [messageQueuePanelSource, useStoreSyncSource].join("\n")

    expect(messageQueuePanelSource).toContain("desktopMessageQueueClient.removeMessage(conversationId, message.id)")
    expect(messageQueuePanelSource).toContain("desktopMessageQueueClient.updateMessageText(conversationId, message.id, newText)")
    expect(messageQueuePanelSource).toContain("desktopMessageQueueClient.retryMessage(conversationId, message.id)")
    expect(messageQueuePanelSource).toContain("desktopMessageQueueClient.clearQueue(conversationId)")
    expect(messageQueuePanelSource).toContain("desktopMessageQueueClient.resumeQueue(conversationId)")
    expect(messageQueuePanelSource).toContain("desktopMessageQueueClient.pauseQueue(conversationId)")
    expect(useStoreSyncSource).toContain("desktopMessageQueueClient.onMessageQueueUpdate(")
    expect(useStoreSyncSource).toContain("desktopMessageQueueClient.getAllQueues()")
    expect(combinedSource).not.toContain("rendererHandlers.onMessageQueueUpdate")
    expect(combinedSource).not.toContain("tipcClient.getAllMessageQueues(")
    expect(combinedSource).not.toContain("tipcClient.removeFromMessageQueue(")
    expect(combinedSource).not.toContain("tipcClient.updateQueuedMessageText(")
    expect(combinedSource).not.toContain("tipcClient.retryQueuedMessage(")
    expect(combinedSource).not.toContain("tipcClient.clearMessageQueue(")
    expect(combinedSource).not.toContain("tipcClient.resumeMessageQueue(")
    expect(combinedSource).not.toContain("tipcClient.pauseMessageQueue(")
  })
})
