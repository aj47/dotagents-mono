import type { AgentProgressUpdate } from "./agent-progress"
import type { ConversationHistoryMessage, ToolCall, ToolResult } from "./types"

type DelegationConversationMessage = NonNullable<
  NonNullable<AgentProgressUpdate["steps"][number]["delegation"]>["conversation"]
>[number]

// Inline data URLs can be megabytes long; replace them in display/budget text.
const INLINE_DATA_IMAGE_REGEX = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/gi
const MARKDOWN_VIDEO_LINK_REGEX = /(^|[^!])\[([^\]]*)\]\((assets:\/\/conversation-video\/[^)]+|https?:\/\/[^)]+\.(?:mp4|m4v|webm|mov|ogv)(?:[?#][^)]*)?)\)/gi
const MAX_PROGRESS_MESSAGE_CONTENT_CHARS = 8_000
const MAX_PROGRESS_RESPONSE_CONTENT_CHARS = 16_000
const MAX_PROGRESS_STREAMING_CONTENT_CHARS = 12_000
const MAX_PROGRESS_STEP_CONTENT_CHARS = 4_000
const MAX_PROGRESS_DELEGATION_MESSAGES = 8

function hasInlineDataImage(content: string): boolean {
  return !!content && /data:image\//i.test(content)
}

export function sanitizeMessageContentForDisplay(content: string): string {
  if (!hasInlineDataImage(content)) {
    return content
  }

  return content.replace(INLINE_DATA_IMAGE_REGEX, (_match, altText: string) => {
    const cleanedAlt = altText?.trim()
    return cleanedAlt ? `[Image: ${cleanedAlt}]` : "[Image]"
  })
}

function truncateTextForDisplay(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content

  const marker = `\n\n[Truncated ${content.length - maxChars} characters for display]`
  const available = Math.max(0, maxChars - marker.length)
  if (available <= 0) return marker.slice(0, maxChars)

  const headChars = Math.ceil(available * 0.72)
  const tailChars = available - headChars
  return `${content.slice(0, headChars)}${marker}${tailChars > 0 ? content.slice(-tailChars) : ""}`
}

function sanitizeTextForProgressDisplay(content: string, maxChars: number): string {
  return truncateTextForDisplay(sanitizeMessageContentForDisplay(content), maxChars)
}

function sanitizeToolResultForDisplay(toolResult: ToolResult): ToolResult {
  const content = sanitizeTextForProgressDisplay(toolResult.content, MAX_PROGRESS_STEP_CONTENT_CHARS)
  const error = typeof toolResult.error === "string"
    ? sanitizeTextForProgressDisplay(toolResult.error, MAX_PROGRESS_STEP_CONTENT_CHARS)
    : toolResult.error

  if (content === toolResult.content && error === toolResult.error) {
    return toolResult
  }

  return {
    ...toolResult,
    content,
    error,
  }
}

function sanitizeToolCallForDisplay(toolCall: ToolCall): ToolCall {
  let changed = false
  const nextArguments: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(toolCall.arguments ?? {})) {
    if (typeof value === "string") {
      const nextValue = sanitizeTextForProgressDisplay(value, MAX_PROGRESS_STEP_CONTENT_CHARS)
      nextArguments[key] = nextValue
      if (nextValue !== value) changed = true
    } else {
      nextArguments[key] = value
    }
  }

  return changed ? { ...toolCall, arguments: nextArguments } : toolCall
}

function sanitizeConversationMessageForProgressDisplay(
  entry: ConversationHistoryMessage,
  maxContentChars: number,
): ConversationHistoryMessage {
  const nextContent = sanitizeTextForProgressDisplay(entry.content, maxContentChars)
  const nextDisplayContent = typeof entry.displayContent === "string"
    ? sanitizeTextForProgressDisplay(entry.displayContent, maxContentChars)
    : entry.displayContent
  const nextToolCalls = entry.toolCalls?.map(sanitizeToolCallForDisplay)
  const nextToolResults = entry.toolResults?.map(sanitizeToolResultForDisplay)
  const toolCallsChanged = !!nextToolCalls && nextToolCalls.some((toolCall, index) => toolCall !== entry.toolCalls?.[index])
  const toolResultsChanged = !!nextToolResults && nextToolResults.some((toolResult, index) => toolResult !== entry.toolResults?.[index])

  if (
    nextContent === entry.content &&
    nextDisplayContent === entry.displayContent &&
    !toolCallsChanged &&
    !toolResultsChanged
  ) {
    return entry
  }

  return {
    ...entry,
    content: nextContent,
    displayContent: nextDisplayContent,
    toolCalls: nextToolCalls,
    toolResults: nextToolResults,
  }
}

function sanitizeDelegationConversationMessageForProgressDisplay(
  entry: DelegationConversationMessage,
  maxContentChars: number,
): DelegationConversationMessage {
  const nextEntry = sanitizeConversationMessageForProgressDisplay(entry, maxContentChars)
  return nextEntry === entry ? entry : { ...entry, ...nextEntry }
}

export function sanitizeMessageContentForSpeech(content: string): string {
  if (!content) {
    return content
  }

  // Strip markdown image payloads (including inline data URLs) before TTS.
  // This keeps speech requests small and avoids reading non-verbal content.
  return content
    .replace(MARKDOWN_IMAGE_REGEX, (_match, altText: string) => {
      const cleanedAlt = altText?.trim()
      return cleanedAlt ? `Image: ${cleanedAlt}` : "Image"
    })
    .replace(MARKDOWN_VIDEO_LINK_REGEX, (_match, prefix: string, label: string) => {
      const cleanedLabel = label?.trim()
      return `${prefix}${cleanedLabel ? `Video: ${cleanedLabel}` : "Video"}`
    })
}

/**
 * Normalize user-facing preview text for compact conversation/session lists.
 *
 * Thinking markup is useful in the full transcript, but sidebar/search previews
 * should surface readable prose instead of literal `<think>` tags. Prefer text
 * outside closed thought blocks; for an in-flight/open thought, fall back to the
 * thought text so the preview remains meaningful while reasoning is streaming.
 */
export function normalizeMessagePreviewText(value?: string | null): string | null {
  if (!value) return null

  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim() || null
  const openThink = value.match(/<think>([\s\S]*)$/i)
  if (openThink && !/<\/think>/i.test(openThink[1])) {
    const openThinkText = normalize(openThink[1])
    if (openThinkText) return openThinkText
  }

  const withoutClosed = normalize(value.replace(/<think>[\s\S]*?<\/think>/gi, ''))
  if (withoutClosed) return withoutClosed

  const closedThink = value.match(/<think>([\s\S]*?)<\/think>/i)
  const closedThinkText = normalize(closedThink?.[1] ?? '')
  if (closedThinkText) return closedThinkText

  return normalize(value)
}

function sanitizeConversationHistoryForDisplay(
  conversationHistory: AgentProgressUpdate["conversationHistory"]
): AgentProgressUpdate["conversationHistory"] {
  if (!conversationHistory?.length) {
    return conversationHistory
  }

  let changed = false
  const sanitized = conversationHistory.map((entry) => {
    const nextEntry = sanitizeConversationMessageForProgressDisplay(entry, MAX_PROGRESS_MESSAGE_CONTENT_CHARS)
    if (nextEntry !== entry) changed = true
    return nextEntry
  })

  return changed ? sanitized : conversationHistory
}

function sanitizeStepsForDisplay(
  steps: AgentProgressUpdate["steps"],
): AgentProgressUpdate["steps"] {
  if (!steps?.length) return steps

  let changed = false
  const sanitized = steps.map((step) => {
    const nextDescription = typeof step.description === "string"
      ? sanitizeTextForProgressDisplay(step.description, MAX_PROGRESS_STEP_CONTENT_CHARS)
      : step.description
    const nextLlmContent = typeof step.llmContent === "string"
      ? sanitizeTextForProgressDisplay(step.llmContent, MAX_PROGRESS_STEP_CONTENT_CHARS)
      : step.llmContent
    const nextContent = typeof step.content === "string"
      ? sanitizeTextForProgressDisplay(step.content, MAX_PROGRESS_STEP_CONTENT_CHARS)
      : step.content
    const nextToolCall = step.toolCall ? sanitizeToolCallForDisplay(step.toolCall) : step.toolCall
    const nextToolResult = step.toolResult ? sanitizeToolResultForDisplay(step.toolResult) : step.toolResult
    const nextDelegation = step.delegation
      ? (() => {
          let delegationChanged = false
          const conversation = Array.isArray(step.delegation?.conversation)
            ? (() => {
                const originalConversation = step.delegation.conversation
                const windowedConversation = originalConversation.slice(-MAX_PROGRESS_DELEGATION_MESSAGES)
                if (windowedConversation.length !== originalConversation.length) {
                  delegationChanged = true
                }
                const sanitizedConversation = windowedConversation.map((message) => {
                  const nextMessage = sanitizeDelegationConversationMessageForProgressDisplay(
                    message,
                    MAX_PROGRESS_MESSAGE_CONTENT_CHARS,
                  )
                  if (nextMessage !== message) delegationChanged = true
                  return nextMessage
                })
                return sanitizedConversation
              })()
            : step.delegation.conversation
          const task = sanitizeTextForProgressDisplay(step.delegation.task, MAX_PROGRESS_STEP_CONTENT_CHARS)
          const progressMessage = typeof step.delegation.progressMessage === "string"
            ? sanitizeTextForProgressDisplay(step.delegation.progressMessage, MAX_PROGRESS_STEP_CONTENT_CHARS)
            : step.delegation.progressMessage
          const resultSummary = typeof step.delegation.resultSummary === "string"
            ? sanitizeTextForProgressDisplay(step.delegation.resultSummary, MAX_PROGRESS_STEP_CONTENT_CHARS)
            : step.delegation.resultSummary
          const error = typeof step.delegation.error === "string"
            ? sanitizeTextForProgressDisplay(step.delegation.error, MAX_PROGRESS_STEP_CONTENT_CHARS)
            : step.delegation.error

          if (
            !delegationChanged &&
            conversation === step.delegation.conversation &&
            task === step.delegation.task &&
            progressMessage === step.delegation.progressMessage &&
            resultSummary === step.delegation.resultSummary &&
            error === step.delegation.error
          ) {
            return step.delegation
          }

          return {
            ...step.delegation,
            conversation,
            task,
            progressMessage,
            resultSummary,
            error,
          }
        })()
      : step.delegation

    if (
      nextDescription === step.description &&
      nextLlmContent === step.llmContent &&
      nextContent === step.content &&
      nextToolCall === step.toolCall &&
      nextToolResult === step.toolResult &&
      nextDelegation === step.delegation
    ) {
      return step
    }

    changed = true
    return {
      ...step,
      description: nextDescription,
      llmContent: nextLlmContent,
      content: nextContent,
      toolCall: nextToolCall,
      toolResult: nextToolResult,
      delegation: nextDelegation,
    }
  })

  return changed ? sanitized : steps
}

export function sanitizeAgentProgressUpdateForDisplay(
  update: AgentProgressUpdate
): AgentProgressUpdate {
  const sanitizedHistory = sanitizeConversationHistoryForDisplay(update.conversationHistory)
  const sanitizedSteps = sanitizeStepsForDisplay(update.steps)
  const finalContent = typeof update.finalContent === "string"
    ? sanitizeTextForProgressDisplay(update.finalContent, MAX_PROGRESS_RESPONSE_CONTENT_CHARS)
    : update.finalContent
  const userResponse = typeof update.userResponse === "string"
    ? sanitizeTextForProgressDisplay(update.userResponse, MAX_PROGRESS_RESPONSE_CONTENT_CHARS)
    : update.userResponse
  const spokenContent = typeof update.spokenContent === "string"
    ? sanitizeTextForProgressDisplay(update.spokenContent, MAX_PROGRESS_RESPONSE_CONTENT_CHARS)
    : update.spokenContent
  const streamingContent = update.streamingContent
    ? {
        ...update.streamingContent,
        text: sanitizeTextForProgressDisplay(
          update.streamingContent.text,
          MAX_PROGRESS_STREAMING_CONTENT_CHARS,
        ),
      }
    : update.streamingContent
  const responseEvents = update.responseEvents?.map((event) => {
    const text = sanitizeTextForProgressDisplay(event.text, MAX_PROGRESS_RESPONSE_CONTENT_CHARS)
    return text === event.text ? event : { ...event, text }
  })
  const userResponseHistory = update.userResponseHistory?.map((response) =>
    sanitizeTextForProgressDisplay(response, MAX_PROGRESS_RESPONSE_CONTENT_CHARS)
  )

  const responseEventsChanged = !!responseEvents && responseEvents.some((event, index) => event !== update.responseEvents?.[index])
  const userResponseHistoryChanged = !!userResponseHistory && userResponseHistory.some((response, index) => response !== update.userResponseHistory?.[index])
  const streamingChanged = streamingContent?.text !== update.streamingContent?.text

  if (
    sanitizedHistory === update.conversationHistory &&
    sanitizedSteps === update.steps &&
    finalContent === update.finalContent &&
    userResponse === update.userResponse &&
    spokenContent === update.spokenContent &&
    !streamingChanged &&
    !responseEventsChanged &&
    !userResponseHistoryChanged
  ) {
    return update
  }

  return {
    ...update,
    conversationHistory: sanitizedHistory,
    steps: sanitizedSteps,
    finalContent,
    userResponse,
    spokenContent,
    streamingContent,
    responseEvents,
    userResponseHistory,
  }
}
