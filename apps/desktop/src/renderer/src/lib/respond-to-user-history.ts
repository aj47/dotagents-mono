import { RESPOND_TO_USER_TOOL } from "../../../shared/builtin-tool-names"

type MessageWithToolCalls = {
  role: "user" | "assistant" | "tool"
  toolCalls?: Array<{ name: string; arguments: unknown }>
}

function extractRespondToUserContentFromArgs(args: unknown): string | null {
  if (!args || typeof args !== "object") return null

  const parsedArgs = args as Record<string, unknown>
  const text = typeof parsedArgs.text === "string" ? parsedArgs.text.trim() : ""
  const images = Array.isArray(parsedArgs.images)
    ? parsedArgs.images
    : []

  const imageMarkdown = images
    .map((image, index) => {
      if (!image || typeof image !== "object") return ""
      const parsedImage = image as Record<string, unknown>
      const url = typeof parsedImage.url === "string" ? parsedImage.url.trim() : ""
      const alt = typeof parsedImage.alt === "string" ? parsedImage.alt.trim() : ""
      const safeAlt = alt.replace(/[\[\]]/g, "") || `Image ${index + 1}`
      if (url) return `![${safeAlt}](${url})`

      const imagePath = typeof parsedImage.path === "string" ? parsedImage.path.trim() : ""
      if (!imagePath) return ""

      const escapedPath = imagePath.replace(/`/g, "\\`")
      return `Local image (${safeAlt}): \`${escapedPath}\``
    })
    .filter(Boolean)

  const combined = [text, imageMarkdown.join("\n\n")]
    .filter(Boolean)
    .join("\n\n")
    .trim()

  return combined.length > 0 ? combined : null
}

export function extractRespondToUserResponsesFromMessages(messages: MessageWithToolCalls[]): string[] {
  const responses: string[] = []
  const lastUserMessageIndex = messages.findLastIndex((message) => message.role === "user")
  const currentTurnMessages = lastUserMessageIndex >= 0
    ? messages.slice(lastUserMessageIndex + 1)
    : messages

  for (const message of currentTurnMessages) {
    if (message.role !== "assistant" || !message.toolCalls?.length) continue

    for (const call of message.toolCalls) {
      if (call.name !== RESPOND_TO_USER_TOOL) continue
      const content = extractRespondToUserContentFromArgs(call.arguments)
      if (!content) continue
      if (responses[responses.length - 1] === content) continue
      responses.push(content)
    }
  }

  return responses
}