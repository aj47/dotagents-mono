import type { AgentUserResponseEvent } from "@dotagents/shared"

import { RESPOND_TO_USER_TOOL } from "../shared/runtime-tool-names"

type ToolCallLike = {
  name?: string
  arguments?: unknown
}

type ConversationHistoryLike = Array<{
  role?: string
  timestamp?: number
  toolCalls?: ToolCallLike[]
}>

export function normalizeUserFacingResponseContent(content: string | null | undefined): string | undefined {
  return typeof content === "string" && content.trim().length > 0
    ? content
    : undefined
}

export function extractRespondToUserContentFromArgs(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined

  const parsedArgs = args as Record<string, unknown>
  const text = typeof parsedArgs.text === "string" ? parsedArgs.text.trim() : ""
  const images = Array.isArray(parsedArgs.images) ? parsedArgs.images : []

  const imageMarkdown = images
    .map((image, index) => {
      if (!image || typeof image !== "object") return ""
      const parsedImage = image as Record<string, unknown>
      const alt = typeof parsedImage.alt === "string" && parsedImage.alt.trim().length > 0
        ? parsedImage.alt.trim()
        : `Image ${index + 1}`
      const url = typeof parsedImage.url === "string" ? parsedImage.url.trim() : ""
      const path = typeof parsedImage.path === "string" ? parsedImage.path.trim() : ""
      const dataUrl = typeof parsedImage.dataUrl === "string" ? parsedImage.dataUrl.trim() : ""
      const uri = url || dataUrl || path
      if (!uri) return ""
      return `![${alt}](${uri})`
    })
    .filter(Boolean)
    .join("\n\n")

  const combined = [text, imageMarkdown].filter(Boolean).join("\n\n").trim()
  return combined.length > 0 ? combined : undefined
}

export function getOrderedRespondToUserContentsFromToolCalls(toolCalls?: ToolCallLike[]): string[] {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return []

  const orderedResponses: string[] = []
  for (const toolCall of toolCalls) {
    if (toolCall?.name !== RESPOND_TO_USER_TOOL) continue
    const content = extractRespondToUserContentFromArgs(toolCall.arguments)
    if (content) {
      orderedResponses.push(content)
    }
  }

  return orderedResponses
}

export function getUnmaterializedUserResponseEvents<T extends { id: string }>(
  responseEvents: T[],
  materializedEventIds: Iterable<string>,
): T[] {
  const materializedIds = new Set(materializedEventIds)
  return responseEvents.filter((responseEvent) => !materializedIds.has(responseEvent.id))
}

function getLatestRespondToUserContentFromToolCalls(toolCalls?: ToolCallLike[]): string | undefined {
  const orderedResponses = getOrderedRespondToUserContentsFromToolCalls(toolCalls)
  return orderedResponses[orderedResponses.length - 1]
}

export function getLatestRespondToUserContentFromConversationHistory(
  conversationHistory: ConversationHistoryLike,
  sinceIndex = 0,
): string | undefined {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) return undefined

  let latestResponse: string | undefined
  for (const message of conversationHistory.slice(Math.max(0, sinceIndex))) {
    if (message?.role !== "assistant") continue
    const content = getLatestRespondToUserContentFromToolCalls(message.toolCalls)
    if (content) {
      latestResponse = content
    }
  }

  return latestResponse
}

function getLatestRespondToUserEventTextFromResponseEvents(
  responseEvents?: AgentUserResponseEvent[],
) : string | undefined {
  if (!Array.isArray(responseEvents) || responseEvents.length === 0) return undefined

  for (const responseEvent of [...responseEvents].sort((a, b) => b.ordinal - a.ordinal)) {
    const normalizedText = normalizeUserFacingResponseContent(responseEvent.text)
    if (normalizedText) {
      return normalizedText
    }
  }

  return undefined
}

export function resolveLatestUserFacingResponse({
  storedResponse,
  plannedToolCalls,
  conversationHistory,
  sinceIndex,
  responseEvents,
}: {
  storedResponse?: string
  plannedToolCalls?: ToolCallLike[]
  conversationHistory?: ConversationHistoryLike
  sinceIndex?: number
  responseEvents?: AgentUserResponseEvent[]
}): string | undefined {
  const normalizedStoredResponse = normalizeUserFacingResponseContent(storedResponse)

  return getLatestRespondToUserContentFromToolCalls(plannedToolCalls)
    ?? getLatestRespondToUserEventTextFromResponseEvents(responseEvents)
    ?? normalizedStoredResponse
    ?? getLatestRespondToUserContentFromConversationHistory(conversationHistory ?? [], sinceIndex)
}
