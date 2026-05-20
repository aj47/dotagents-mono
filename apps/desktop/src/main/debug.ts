import { isDebugLLM } from "@dotagents/core"

const MAX_LLM_LOG_STRING_CHARS = 360
const MAX_LLM_LOG_ARRAY_ITEMS = 12
const MAX_LLM_LOG_DEPTH = 4

function isFullLLMTraceLoggingEnabled(): boolean {
  const raw = process.env.DEBUG_LLM_FULL_TRACE || process.env.DEBUG_LLM_RAW || ""
  return /^(1|true|yes|on)$/i.test(raw)
}

function isLLMContentPreviewEnabled(): boolean {
  const raw = process.env.DEBUG_LLM_PREVIEW || ""
  return /^(1|true|yes|on)$/i.test(raw)
}

function ts(): string {
  return new Date().toISOString()
}

function summarizeString(value: string): string {
  if (value.length <= MAX_LLM_LOG_STRING_CHARS) return value
  return `[${value.length} chars] ${value.slice(0, MAX_LLM_LOG_STRING_CHARS)}...`
}

function isTraceArrayKey(key?: string): boolean {
  return /^(messages|conversationHistory|rawMessages|toolResults|toolCalls|responseEvents|userResponseHistory)$/i.test(key ?? "")
}

function isContentKey(key?: string): boolean {
  return /^(content|prompt|transcript|system|input|output|response|finalContent|userResponse|text|arguments)$/i.test(key ?? "")
}

function summarizeTraceArray(values: unknown[]) {
  let totalContentChars = 0
  let toolCallCount = 0
  let toolResultCount = 0
  const roles: string[] = []
  const toolNames: string[] = []

  for (const value of values) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue
    const record = value as Record<string, unknown>
    if (typeof record.role === "string") roles.push(record.role)
    if (typeof record.content === "string") totalContentChars += record.content.length
    if (Array.isArray(record.toolCalls)) {
      toolCallCount += record.toolCalls.length
      for (const call of record.toolCalls) {
        if (call && typeof call === "object") {
          const callRecord = call as Record<string, unknown>
          const name = typeof callRecord.name === "string"
            ? callRecord.name
            : typeof callRecord.toolName === "string"
              ? callRecord.toolName
              : undefined
          if (name) toolNames.push(name)
        }
      }
    }
    if (Array.isArray(record.toolResults)) toolResultCount += record.toolResults.length
  }

  return {
    redacted: "llm-trace-array",
    count: values.length,
    totalContentChars,
    roles: roles.slice(0, MAX_LLM_LOG_ARRAY_ITEMS),
    toolCallCount,
    toolResultCount,
    toolNames: Array.from(new Set(toolNames)).slice(0, MAX_LLM_LOG_ARRAY_ITEMS),
  }
}

function sanitizeLLMDebugValue(value: unknown, key?: string, depth = 0): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split("\n").slice(0, 8).join("\n"),
    }
  }

  if (typeof value === "string") {
    return summarizeString(value)
  }

  if (value === null || typeof value !== "object") {
    return value
  }

  if (Array.isArray(value)) {
    if (isTraceArrayKey(key)) return summarizeTraceArray(value)
    if (depth >= MAX_LLM_LOG_DEPTH) return { redacted: "max-depth", count: value.length }
    return value.slice(0, MAX_LLM_LOG_ARRAY_ITEMS).map((entry) =>
      sanitizeLLMDebugValue(entry, key, depth + 1)
    )
  }

  if (depth >= MAX_LLM_LOG_DEPTH) {
    return { redacted: "max-depth", keys: Object.keys(value as Record<string, unknown>) }
  }

  const output: Record<string, unknown> = {}
  for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (isTraceArrayKey(entryKey) && Array.isArray(entryValue)) {
      output[entryKey] = summarizeTraceArray(entryValue)
      continue
    }
    if (isContentKey(entryKey) && typeof entryValue === "string") {
      output[entryKey] = {
        redacted: "llm-content",
        length: entryValue.length,
        ...(isLLMContentPreviewEnabled() ? { preview: summarizeString(entryValue) } : {}),
      }
      continue
    }
    output[entryKey] = sanitizeLLMDebugValue(entryValue, entryKey, depth + 1)
  }
  return output
}

function formatLLMDebugArg(arg: unknown): string {
  if (typeof arg === "string") return summarizeString(arg)
  try {
    return JSON.stringify(sanitizeLLMDebugValue(arg), null, 2)
  } catch {
    return String(arg)
  }
}

export function logLLM(...args: unknown[]) {
  if (!isDebugLLM()) return
  const formattedArgs = isFullLLMTraceLoggingEnabled()
    ? args
    : args.map(formatLLMDebugArg)
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] [DEBUG][LLM]`, ...formattedArgs)
}

export {
  initDebugFlags,
  isDebugLLM,
  isDebugTools,
  isDebugKeybinds,
  isDebugUI,
  logTools,
  logKeybinds,
  logApp,
  logUI,
  logMCP,
  logACP,
  getDebugFlags,
} from "@dotagents/core"
