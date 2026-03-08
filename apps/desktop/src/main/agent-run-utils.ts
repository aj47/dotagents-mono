import type { SessionProfileSnapshot } from "../shared/types"

export const DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET = 60
export const AGENT_STOP_NOTE =
  "(Agent mode was stopped by emergency kill switch)"

export interface AgentIterationLimits {
  loopMaxIterations: number
  guardrailBudget: number
}

interface ConversationMessageLike {
  role: string
  content?: string | null
}

interface RespondToUserImageLike {
  alt?: unknown
  path?: unknown
  dataUrl?: unknown
}

type ProfileContextSource = {
  profileName?: string
  displayName?: string
  guidelines?: string
  systemPrompt?: string
}

export function resolveAgentIterationLimits(
  requestedMaxIterations: number,
): AgentIterationLimits {
  if (requestedMaxIterations === Number.POSITIVE_INFINITY) {
    return {
      loopMaxIterations: Number.POSITIVE_INFINITY,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    }
  }

  if (!Number.isFinite(requestedMaxIterations)) {
    return {
      loopMaxIterations: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    }
  }

  const normalizedMaxIterations = Math.max(
    1,
    Math.floor(requestedMaxIterations),
  )
  return {
    loopMaxIterations: normalizedMaxIterations,
    guardrailBudget: normalizedMaxIterations,
  }
}

export function appendAgentStopNote(content: string): string {
  const normalizedContent = typeof content === "string" ? content.trimEnd() : ""
  if (normalizedContent.includes(AGENT_STOP_NOTE)) {
    return normalizedContent
  }

  return normalizedContent.length > 0
    ? `${normalizedContent}\n\n${AGENT_STOP_NOTE}`
    : AGENT_STOP_NOTE
}

export function getLatestAssistantMessageContent(
  conversation?: ConversationMessageLike[],
): string | undefined {
  if (!Array.isArray(conversation)) return undefined

  for (let index = conversation.length - 1; index >= 0; index--) {
    const message = conversation[index]
    if (message?.role !== "assistant") continue
    if (typeof message.content !== "string") continue

    const trimmedContent = message.content.trim()
    if (trimmedContent.length > 0) {
      return message.content
    }
  }

  return undefined
}

function extractRespondToUserContentFromArgs(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined

  const parsedArgs = args as { text?: unknown; images?: unknown }
  const text = typeof parsedArgs.text === "string" ? parsedArgs.text.trim() : ""
  const images = Array.isArray(parsedArgs.images) ? parsedArgs.images : []

  const imageMarkdown = images
    .map((image, index) => {
      if (!image || typeof image !== "object") return ""

      const parsedImage = image as RespondToUserImageLike
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

function extractLeadingJsonObject(content: string, startIndex: number): string | undefined {
  let depth = 0
  let inString = false
  let isEscaped = false

  for (let index = startIndex; index < content.length; index++) {
    const char = content[index]

    if (inString) {
      if (isEscaped) {
        isEscaped = false
        continue
      }
      if (char === "\\") {
        isEscaped = true
        continue
      }
      if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === "{") {
      depth++
      continue
    }

    if (char === "}") {
      depth--
      if (depth === 0) {
        return content.slice(startIndex, index + 1)
      }
    }
  }

  return undefined
}

function unwrapPseudoRespondToUserContent(content: string | undefined | null): string | undefined {
  if (typeof content !== "string") return undefined

  const trimmed = content.trim()
  if (!trimmed.match(/^\[respond_to_user\]\s*/i)) return undefined

  const jsonStart = trimmed.indexOf("{")
  if (jsonStart < 0) return undefined

  const jsonObject = extractLeadingJsonObject(trimmed, jsonStart)
  if (!jsonObject) return undefined

  try {
    return extractRespondToUserContentFromArgs(JSON.parse(jsonObject))
  } catch {
    return undefined
  }
}

function normalizeUserFacingContent(content: string | undefined | null): string {
  return unwrapPseudoRespondToUserContent(content)
    ?? (typeof content === "string" ? content : "")
}

export function isToolCallPlaceholderResponse(content: string): boolean {
  const trimmed = content.trim()
  return /^\[(?:Calling tools?|Tool|Tools?):[^\]]+\]$/i.test(trimmed)
}

export function needsNativeToolCallingReminder(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed) return false

  return /<\|tool_calls_section_begin\|>|<\|tool_call_begin\|>/i.test(trimmed)
    || isToolCallPlaceholderResponse(trimmed)
}

function isLikelyProgressOnlyResponse(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed) return false

  const lowerRaw = trimmed.toLowerCase()
  const hasStructuredDeliverable =
    /\n[-*]\s|\n\d+\.\s/.test(trimmed) || /\bhere(?:'s| is)\b/.test(lowerRaw)
  if (hasStructuredDeliverable) {
    return false
  }

  const normalized = lowerRaw.replace(/\s+/g, " ")
  const wordCount = normalized.split(" ").filter(Boolean).length
  if (wordCount > 40) {
    return false
  }

  return /(?:^|[.!?]\s+)(?:let me|i'?ll|i will|i'm going to|now i'?ll|next i'?ll|i need to|i still need to|i should)\b/.test(normalized)
}

export function buildProfileContext(
  profile: ProfileContextSource | SessionProfileSnapshot | undefined,
  existingContext?: string,
): string | undefined {
  if (!profile && !existingContext) return undefined

  const parts: string[] = []
  const displayName = profile && "displayName" in profile && typeof profile.displayName === "string"
    ? profile.displayName.trim()
    : ""
  const profileName = displayName
    || (typeof profile?.profileName === "string" ? profile.profileName.trim() : "")

  if (existingContext) parts.push(existingContext)
  if (profileName) parts.push(`[Acting as: ${profileName}]`)
  if (profile?.systemPrompt) parts.push(`System Prompt: ${profile.systemPrompt}`)
  if (profile?.guidelines) parts.push(`Guidelines: ${profile.guidelines}`)

  return parts.length > 0 ? parts.join("\n\n") : undefined
}

export function getPreferredDelegationOutput(
  output: string | undefined,
  conversation?: ConversationMessageLike[],
): string {
  const latestAssistantContent = normalizeUserFacingContent(
    getLatestAssistantMessageContent(conversation),
  )

  if (latestAssistantContent.trim().length > 0) {
    return latestAssistantContent
  }

  return normalizeUserFacingContent(output)
}

export function preferStoredUserResponse(
  currentFinalContent: string,
  storedUserResponse?: string | null,
): string {
  const normalizedCurrentFinalContent = normalizeUserFacingContent(currentFinalContent)
  const normalizedStoredUserResponse = normalizeUserFacingContent(storedUserResponse)

  if (
    normalizedCurrentFinalContent.trim().length > 0
    && !isLikelyProgressOnlyResponse(normalizedCurrentFinalContent)
  ) {
    return normalizedCurrentFinalContent
  }

  if (normalizedStoredUserResponse.trim().length > 0) {
    return normalizedStoredUserResponse
  }

  return normalizedCurrentFinalContent
}
