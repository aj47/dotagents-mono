import type { MCPToolCall, MCPToolResult } from "./mcp-service"
import { assessToolBatch } from "./convergence-controller"
import { sanitizeMessageContentForDisplay } from "@dotagents/shared"

type ConversationEntry = {
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: MCPToolCall[]
  toolResults?: MCPToolResult[]
  ephemeral?: boolean
  skipModelReplay?: boolean
}

type ReplayMessage = {
  role: "user" | "assistant"
  content: string
}

function truncateReplayText(content: string, maxChars: number, preserveTail: boolean = true): string {
  const trimmed = content.trim()
  if (trimmed.length <= maxChars) return trimmed
  if (!preserveTail || maxChars < 160) {
    return `${trimmed.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`
  }

  const headChars = Math.ceil(maxChars * 0.67)
  const tailChars = Math.max(80, maxChars - headChars)
  const head = trimmed.slice(0, headChars).trimEnd()
  const tail = trimmed.slice(trimmed.length - tailChars).trimStart()
  return `${head}\n\n[replay truncated]\n\n${tail}`
}

function extractContextRefs(content: string): string[] {
  return Array.from(new Set(content.match(/Context ref:\s*ctx_[a-z0-9]+/gi) ?? []))
}

function tryParseJsonPayload(content: string): Record<string, unknown> | null {
  const sanitized = content
    .replace(/\n?Context ref:\s*ctx_[a-z0-9]+\s*$/gi, "")
    .trim()

  if (!sanitized.startsWith("{") || !sanitized.endsWith("}")) return null

  try {
    const parsed = JSON.parse(sanitized)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null
  } catch {
    return null
  }
}

function compactExecuteCommandResult(content: string): string {
  const parsed = tryParseJsonPayload(content)
  if (!parsed) {
    return truncateReplayText(content, 1200)
  }

  const lines: string[] = []
  const command = typeof parsed.command === "string" ? parsed.command : ""
  if (command) {
    lines.push(`command: ${truncateReplayText(command, 220, false)}`)
  }

  const success = parsed.success === true
  const outputTruncated = parsed.outputTruncated === true

  if (!success) {
    const errorText = typeof parsed.error === "string"
      ? parsed.error
      : typeof parsed.stderr === "string"
        ? parsed.stderr
        : content
    lines.push(`error: ${truncateReplayText(errorText, 900)}`)
  } else {
    const stdout = typeof parsed.stdout === "string" ? parsed.stdout : ""
    const stderr = typeof parsed.stderr === "string" ? parsed.stderr : ""
    if (stdout.trim()) {
      lines.push(`stdout: ${truncateReplayText(stdout, 1000)}`)
    }
    if (stderr.trim()) {
      lines.push(`stderr: ${truncateReplayText(stderr, 400)}`)
    }
    if (outputTruncated) {
      lines.push("output: [truncated]")
    }
  }

  const retrySuggestion = typeof parsed.retrySuggestion === "string" ? parsed.retrySuggestion : ""
  if (retrySuggestion.trim()) {
    lines.push(`retry: ${truncateReplayText(retrySuggestion, 220, false)}`)
  }

  const hint = typeof parsed.hint === "string" ? parsed.hint : ""
  if (hint.trim()) {
    lines.push(`hint: ${truncateReplayText(hint, 220, false)}`)
  }

  const refs = extractContextRefs(content)
  if (refs.length > 0) {
    lines.push(...refs)
  }

  return lines.join("\n").trim()
}

function compactReadMoreContextResult(content: string): string {
  const parsed = tryParseJsonPayload(content)
  if (!parsed) return truncateReplayText(content, 900)

  const lines: string[] = []
  if (typeof parsed.mode === "string") lines.push(`mode: ${parsed.mode}`)
  if (typeof parsed.query === "string" && parsed.query.trim()) lines.push(`query: ${truncateReplayText(parsed.query, 140, false)}`)
  if (typeof parsed.preview === "string" && parsed.preview.trim()) lines.push(`preview: ${truncateReplayText(parsed.preview, 500)}`)
  if (typeof parsed.excerpt === "string" && parsed.excerpt.trim()) lines.push(`excerpt: ${truncateReplayText(parsed.excerpt, 700)}`)
  if (Array.isArray(parsed.matches) && parsed.matches.length > 0) {
    const first = parsed.matches[0] as Record<string, unknown>
    if (typeof first.excerpt === "string") {
      lines.push(`match: ${truncateReplayText(first.excerpt, 700)}`)
    }
  }
  const refs = extractContextRefs(content)
  if (refs.length > 0) lines.push(...refs)
  return lines.join("\n").trim()
}

function compactToolReplayText(toolName: string, result: MCPToolResult | undefined): string {
  if (!result) return "[pending]"

  const joined = result.content.map((item) => item.text).join("\n").trim()
  if (!joined) {
    return result.isError ? "[error]" : "[no output]"
  }

  let compacted: string
  if (toolName === "execute_command") {
    compacted = compactExecuteCommandResult(joined)
  } else if (toolName === "read_more_context") {
    compacted = compactReadMoreContextResult(joined)
  } else if (toolName === "load_skill_instructions") {
    compacted = truncateReplayText(joined, 1200)
  } else {
    compacted = truncateReplayText(joined, 1000)
  }

  return compacted
}

function compactToolBatchReplay(
  toolCalls: MCPToolCall[],
  toolResults: Array<MCPToolResult | undefined>,
): string | null {
  const assessment = assessToolBatch(toolCalls)
  const lines: string[] = []

  for (let i = 0; i < toolCalls.length; i++) {
    const toolCall = toolCalls[i]
    const toolName = toolCall.name

    // Completion-only tools should be represented by their materialized assistant
    // messages rather than replayed as raw tool control chatter.
    if (assessment.communicationOnly || toolName === "respond_to_user" || toolName === "mark_work_complete" || toolName === "set_session_title") {
      continue
    }

    const replayText = compactToolReplayText(toolName, toolResults[i])
    if (!replayText) continue
    lines.push(`[${toolName}] ${replayText}`)
  }

  return lines.length > 0 ? lines.join("\n\n") : null
}

export function buildModelReplayMessages(
  history: ConversationEntry[],
  options: { addSummaryPrompt?: boolean } = {},
): ReplayMessage[] {
  const replayMessages: ReplayMessage[] = []

  for (let i = 0; i < history.length; i++) {
    const entry = history[i]
    const rawContent = typeof entry.content === "string" ? entry.content : ""
    const sanitizedContent = sanitizeMessageContentForDisplay(rawContent).trim()

    if (entry.role === "assistant" && entry.skipModelReplay) continue

    if (entry.role === "assistant" && entry.toolCalls && entry.toolCalls.length > 0) {
      if (sanitizedContent.length > 0) {
        replayMessages.push({ role: "assistant", content: sanitizedContent })
      }

      const collectedResults: Array<MCPToolResult | undefined> = []
      let consumedToolMessages = 0
      let resultMessageIndex = i + 1

      while (
        resultMessageIndex < history.length &&
        history[resultMessageIndex].role === "tool" &&
        collectedResults.length < entry.toolCalls.length
      ) {
        const toolEntry = history[resultMessageIndex]
        if (toolEntry.toolResults && toolEntry.toolResults.length > 0) {
          collectedResults.push(...toolEntry.toolResults)
        } else {
          collectedResults.push(undefined)
        }
        consumedToolMessages += 1
        resultMessageIndex += 1
      }

      while (collectedResults.length < entry.toolCalls.length) {
        collectedResults.push(undefined)
      }

      const replayToolBatch = compactToolBatchReplay(entry.toolCalls, collectedResults.slice(0, entry.toolCalls.length))
      if (replayToolBatch) {
        replayMessages.push({ role: "user", content: replayToolBatch })
      }

      if (consumedToolMessages > 0) {
        i += consumedToolMessages
      }
      continue
    }

    if (entry.role === "tool") {
      if (entry.toolResults?.length) {
        const replayToolBatch = compactToolBatchReplay(
          entry.toolResults.map(() => ({ name: "tool_result_passthrough", arguments: {} })),
          entry.toolResults,
        )
        if (replayToolBatch) {
          replayMessages.push({ role: "user", content: replayToolBatch })
        }
      } else if (sanitizedContent) {
        replayMessages.push({
          role: "user",
          content: truncateReplayText(sanitizedContent, 1200),
        })
      }
      continue
    }

    if (!sanitizedContent) continue
    replayMessages.push({
      role: entry.role,
      content: sanitizedContent,
    })
  }

  if (options.addSummaryPrompt && replayMessages.length > 0 && replayMessages[replayMessages.length - 1].role === "assistant") {
    replayMessages.push({ role: "user", content: "Please provide a brief summary of what was accomplished." })
  }

  return replayMessages
}
