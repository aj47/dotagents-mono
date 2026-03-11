import type { MCPToolCall, MCPToolResult } from "./mcp-service"
import { conversationService } from "./conversation-service"
import { getErrorMessage } from "./error-utils"

export type TerminalConversationMessage = {
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: MCPToolCall[]
  toolResults?: MCPToolResult[]
  timestamp?: number
  ephemeral?: boolean
}

function cleanTerminalErrorMessage(errorText: string): string {
  return errorText
    .replace(/^(error|exception):\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.:;,\s]+$/, "")
}

export function buildUnexpectedAgentFailureMessage(error: unknown): string {
  const raw = getErrorMessage(error, "Unknown error")
  const cleaned = cleanTerminalErrorMessage(raw)

  if (!cleaned || cleaned.toLowerCase() === "unknown error") {
    return "I couldn't complete the request because an unexpected error interrupted the run. Please try again."
  }

  return `I couldn't complete the request because an unexpected error interrupted the run: ${cleaned}. Please try again.`
}

export async function appendAndPersistTerminalAssistantMessage(params: {
  conversationId?: string
  conversationHistory: TerminalConversationMessage[]
  assistantContent: string
}): Promise<void> {
  const { conversationId, conversationHistory, assistantContent } = params
  const lastMessage = conversationHistory[conversationHistory.length - 1]

  if (
    lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.content === assistantContent
  ) {
    return
  }

  conversationHistory.push({
    role: "assistant",
    content: assistantContent,
    timestamp: Date.now(),
  })

  if (conversationId) {
    await conversationService.addMessageToConversation(conversationId, assistantContent, "assistant")
  }
}