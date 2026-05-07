import type {
  Conversation,
  ConversationHistoryItem,
  LoadedConversation,
} from "@dotagents/shared/conversation-domain"
import type { ToolCall, ToolResult } from "@dotagents/shared/types"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopLoadConversationRequest {
  conversationId: string
  messageLimit?: number
}

export interface DesktopCreateConversationRequest {
  firstMessage: string
  role?: "user" | "assistant"
}

export interface DesktopAddMessageToConversationRequest {
  conversationId: string
  content: string
  role: "user" | "assistant" | "tool"
  toolCalls?: Array<{ name: string; arguments: unknown }> | ToolCall[]
  toolResults?: Array<{ success: boolean; content: string; error?: string }> | ToolResult[]
}

export const desktopConversationsClient = {
  getConversationHistory(): Promise<ConversationHistoryItem[]> {
    return tipcClient.getConversationHistory() as Promise<ConversationHistoryItem[]>
  },

  loadConversation(request: DesktopLoadConversationRequest): Promise<LoadedConversation | null> {
    return tipcClient.loadConversation(request) as Promise<LoadedConversation | null>
  },

  saveConversation(conversation: Conversation): Promise<void> {
    return tipcClient.saveConversation({ conversation }) as Promise<void>
  },

  createConversation(request: DesktopCreateConversationRequest): Promise<Conversation> {
    return tipcClient.createConversation(request) as Promise<Conversation>
  },

  addMessageToConversation(request: DesktopAddMessageToConversationRequest): Promise<Conversation | null> {
    return tipcClient.addMessageToConversation(request) as Promise<Conversation | null>
  },

  renameConversationTitle(conversationId: string, title: string): Promise<Conversation | null> {
    return tipcClient.renameConversationTitle({ conversationId, title }) as Promise<Conversation | null>
  },

  deleteConversation(conversationId: string): Promise<void> {
    return tipcClient.deleteConversation({ conversationId }) as Promise<void>
  },

  deleteAllConversations(): Promise<void> {
    return tipcClient.deleteAllConversations() as Promise<void>
  },

  branchConversation(conversationId: string, messageIndex: number): Promise<Conversation | null> {
    return tipcClient.branchConversation({ conversationId, messageIndex }) as Promise<Conversation | null>
  },
}
