type TextContentBlock = {
  type?: unknown
  text?: unknown
}

const TOOL_RESULT_PREFIX = /^tool result:\s*/i
const LEGACY_TOOL_RESULT_PATTERN = /^tool:\s*([^\n]+)\nresult:\s*([\s\S]*)$/i

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function isJsonLike(value: string): boolean {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
    || (trimmed.startsWith("[") && trimmed.endsWith("]"))
  )
}

function extractTextBlocks(content: unknown): string | null {
  if (!Array.isArray(content)) return null

  const text = content
    .map((item) => {
      const block = item as TextContentBlock | null | undefined
      return block?.type === "text" && typeof block.text === "string"
        ? block.text.trim()
        : ""
    })
    .filter(Boolean)
    .join("\n\n")
    .trim()

  return text || null
}

function decodeStructuredToolPayload(payload: string): string {
  let current = payload.trim()

  for (let depth = 0; depth < 2; depth += 1) {
    if (!isJsonLike(current)) break

    try {
      const parsed = JSON.parse(current)
      const extractedText = extractTextBlocks(parsed)
      if (extractedText && extractedText !== current) {
        current = extractedText
        continue
      }
      return JSON.stringify(parsed, null, 2)
    } catch {
      break
    }
  }

  return current
}

export function stringifySubAgentToolResultContent(content: unknown, maxLength = 4000): string {
  const flattened = extractTextBlocks(content)
    ?? (typeof content === "string" ? content : content == null ? "" : safeStringify(content))

  const normalized = decodeStructuredToolPayload(flattened).trim() || "Tool completed"
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function extractSubAgentToolDisplayContent(rawContent: string): {
  toolName?: string
  summary: string
  rawContent: string
} {
  const raw = (rawContent ?? "").trim()
  if (!raw) {
    return {
      summary: "Tool activity",
      rawContent: "",
    }
  }

  const legacyMatch = raw.match(LEGACY_TOOL_RESULT_PATTERN)
  const toolName = legacyMatch?.[1]?.trim() || undefined
  const payload = (legacyMatch?.[2] ?? raw.replace(TOOL_RESULT_PREFIX, "")).trim()
  const summary = decodeStructuredToolPayload(payload).trim() || raw || "Tool activity"

  return {
    toolName,
    summary,
    rawContent: raw,
  }
}