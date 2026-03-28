import type {
  ConversationHistoryMessage,
  ToolCall,
  ToolResult,
} from './types'

interface ToolCallLike {
  name: string
  arguments?: unknown
}

interface ToolResultLike {
  content?: unknown
  isError?: boolean
  success?: boolean
}

interface ConversationHistoryEntryLike {
  role: ConversationHistoryMessage['role']
  content: string
  toolCalls?: readonly ToolCallLike[]
  toolResults?: readonly ToolResultLike[]
  timestamp?: number
}

export interface FormatConversationHistoryMessagesOptions<
  TEntry extends ConversationHistoryEntryLike,
> {
  includeEntry?: (entry: TEntry) => boolean
  fallbackTimestamp?: () => number
}

export function formatConversationToolCalls(
  toolCalls?: readonly ToolCallLike[],
): ToolCall[] | undefined {
  return toolCalls?.map((toolCall) => ({
    name: toolCall.name,
    arguments:
      (toolCall.arguments as ToolCall['arguments'] | undefined) ?? {},
  }))
}

export function stringifyConversationToolResultContent(
  content: unknown,
): string {
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object') {
          if (typeof (item as { text?: unknown }).text === 'string') {
            return (item as { text: string }).text
          }

          if (typeof (item as { content?: unknown }).content === 'string') {
            return (item as { content: string }).content
          }
        }

        return item == null ? '' : String(item)
      })
      .filter(Boolean)
      .join('\n')
  }

  if (typeof content === 'string') {
    return content
  }

  if (content && typeof content === 'object') {
    if (typeof (content as { text?: unknown }).text === 'string') {
      return (content as { text: string }).text
    }

    if (typeof (content as { content?: unknown }).content === 'string') {
      return (content as { content: string }).content
    }
  }

  return content == null ? '' : String(content)
}

export function formatConversationToolResults(
  toolResults?: readonly ToolResultLike[],
): ToolResult[] | undefined {
  return toolResults?.map((toolResult) => {
    const content = stringifyConversationToolResultContent(toolResult.content)
    const isError = toolResult.isError ?? toolResult.success === false

    return {
      success: !isError,
      content,
      error: isError ? content : undefined,
    }
  })
}

export function formatConversationHistoryMessages<
  TEntry extends ConversationHistoryEntryLike,
>(
  history: readonly TEntry[],
  options: FormatConversationHistoryMessagesOptions<TEntry> = {},
): ConversationHistoryMessage[] {
  const { includeEntry, fallbackTimestamp } = options

  return history
    .filter((entry) => includeEntry?.(entry) ?? true)
    .map((entry) => {
      const timestamp =
        typeof entry.timestamp === 'number'
          ? entry.timestamp
          : fallbackTimestamp?.()

      return {
        role: entry.role,
        content: entry.content,
        toolCalls: formatConversationToolCalls(entry.toolCalls),
        toolResults: formatConversationToolResults(entry.toolResults),
        timestamp,
      }
    })
}
