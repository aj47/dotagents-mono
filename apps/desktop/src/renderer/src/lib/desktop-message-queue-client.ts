import type { QueuedMessage } from "@dotagents/shared/message-queue-utils"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopMessageQueueSnapshot {
  conversationId: string
  messages: QueuedMessage[]
  isPaused: boolean
}

export const desktopMessageQueueClient = {
  getAllQueues(): Promise<DesktopMessageQueueSnapshot[]> {
    return tipcClient.getAllMessageQueues() as Promise<DesktopMessageQueueSnapshot[]>
  },

  removeMessage(conversationId: string, messageId: string): Promise<void> {
    return tipcClient.removeFromMessageQueue({ conversationId, messageId }) as Promise<void>
  },

  updateMessageText(conversationId: string, messageId: string, text: string): Promise<boolean> {
    return tipcClient.updateQueuedMessageText({ conversationId, messageId, text }) as Promise<boolean>
  },

  retryMessage(conversationId: string, messageId: string): Promise<void> {
    return tipcClient.retryQueuedMessage({ conversationId, messageId }) as Promise<void>
  },

  clearQueue(conversationId: string): Promise<void> {
    return tipcClient.clearMessageQueue({ conversationId }) as Promise<void>
  },

  resumeQueue(conversationId: string): Promise<void> {
    return tipcClient.resumeMessageQueue({ conversationId }) as Promise<void>
  },

  pauseQueue(conversationId: string): Promise<void> {
    return tipcClient.pauseMessageQueue({ conversationId }) as Promise<void>
  },
}
