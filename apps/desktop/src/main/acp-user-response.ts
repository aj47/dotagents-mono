import { type AgentProgressUpdate } from "../shared/types"
import { BUILTIN_SERVER_NAME, RESPOND_TO_USER_TOOL } from "../shared/builtin-tool-names"

export type ConversationHistoryMessage = NonNullable<AgentProgressUpdate["conversationHistory"]>[number]

function normalizeAcpUserResponseToolName(name: string | undefined): string | undefined {
  if (!name) return undefined

  const trimmed = name.trim()
  if (!trimmed) return undefined

  const withoutToolPrefix = trimmed.replace(/^tool:\s*/i, "")
  const withoutBuiltinPrefix = withoutToolPrefix.startsWith(`${BUILTIN_SERVER_NAME}:`)
    ? withoutToolPrefix.slice(BUILTIN_SERVER_NAME.length + 1)
    : withoutToolPrefix

  const normalized = withoutBuiltinPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized.endsWith(RESPOND_TO_USER_TOOL) ? RESPOND_TO_USER_TOOL : withoutToolPrefix
}

function extractRespondToUserContentFromArgs(args: unknown): string | undefined {
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
      const path = typeof parsedImage.path === "string" ? parsedImage.path.trim() : ""
      const dataUrl = typeof parsedImage.dataUrl === "string" ? parsedImage.dataUrl.trim() : ""
      const uri = dataUrl || path
      if (!uri) return ""
      return `![${alt}](${uri})`
    })
    .filter(Boolean)
    .join("\n\n")

  const combined = [text, imageMarkdown].filter(Boolean).join("\n\n").trim()
  return combined.length > 0 ? combined : undefined
}

export function deriveAcpUserResponseState(
  conversationHistory: ConversationHistoryMessage[],
  currentRunStartIndex = 0
): {
  userResponse?: string
  userResponseHistory?: string[]
} {
  const responses: string[] = []

  for (const message of conversationHistory.slice(currentRunStartIndex)) {
    if (message.role !== "assistant" || !message.toolCalls?.length) continue

    for (const toolCall of message.toolCalls) {
      if (normalizeAcpUserResponseToolName(toolCall.name) !== RESPOND_TO_USER_TOOL) continue
      const content = extractRespondToUserContentFromArgs(toolCall.arguments)
      if (!content) continue
      if (responses[responses.length - 1] === content) continue
      responses.push(content)
    }
  }

  const userResponse = responses[responses.length - 1]
  return {
    userResponse,
    userResponseHistory: responses.length > 1 ? responses.slice(0, -1) : undefined,
  }
}