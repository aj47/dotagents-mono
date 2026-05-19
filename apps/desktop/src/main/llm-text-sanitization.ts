type LlmTextMessage = { role: string; content: string }

/**
 * Replace lone UTF-16 surrogate code units before sending text to model APIs.
 * Some web/tool sources can return broken emoji fragments such as "\ud83d";
 * JSON can preserve them, but provider gateways may reject the request body.
 */
export function sanitizeTextForLlmTransport(value: string): string {
  let result = ""
  let changed = false

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)

    if (code >= 0xd800 && code <= 0xdbff) {
      const nextCode = index + 1 < value.length ? value.charCodeAt(index + 1) : 0
      if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
        result += value[index] + value[index + 1]
        index += 1
      } else {
        result += "\uFFFD"
        changed = true
      }
      continue
    }

    if (code >= 0xdc00 && code <= 0xdfff) {
      result += "\uFFFD"
      changed = true
      continue
    }

    result += value[index]
  }

  return changed ? result : value
}

export function sanitizeMessagesForLlmTransport<T extends LlmTextMessage>(
  messages: T[],
): T[] {
  let changed = false
  const sanitized = messages.map((message) => {
    const content = sanitizeTextForLlmTransport(message.content)
    if (content === message.content) return message
    changed = true
    return { ...message, content }
  })

  return changed ? sanitized : messages
}
