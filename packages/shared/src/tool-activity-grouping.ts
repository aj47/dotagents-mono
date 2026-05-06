/**
 * Tool Activity Grouping
 *
 * Shared rules for grouping consecutive connected tool-call activity into
 * collapsed-by-default expandable blocks. Both desktop and mobile renderers
 * consume these helpers to decide which messages form a group and what the
 * collapsed preview should contain.
 *
 * Design constraints:
 * - No backend schema changes — operates purely on the existing message shape.
 * - User messages are NEVER grouped.
 * - User-visible final assistant responses (including respond_to_user output)
 *   are NEVER grouped — they stay rendered normally.
 * - Collapsed tool-activity groups include compact preview lines so users can
 *   see which tools were called without expanding the group.
 */

import { RESPOND_TO_USER_TOOL, isToolOnlyMessage, getToolCallsSummary } from './chat-utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal message shape accepted by the grouping logic. */
interface GroupableMessage {
  role: 'user' | 'assistant' | 'tool'
  content?: string
  toolCalls?: Array<{ name: string; arguments?: unknown }>
  toolResults?: Array<{ success: boolean; content: string; error?: string }>
}

/** A contiguous run of tool-activity messages that should be collapsed. */
export interface ToolActivityGroup {
  /** Index of the first message in the group (inclusive). */
  startIndex: number
  /** Index of the last message in the group (inclusive). */
  endIndex: number
  /** Number of messages in the group. */
  count: number
  /**
   * Collapsed preview lines — at most {@link TOOL_GROUP_PREVIEW_COUNT} entries,
   * taken from the *end* of the group (most recent activity).
   * Present for every collapsed group so historical session views still show
   * which tools were called without expanding the group.
   */
  previewLines: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of preview lines shown in the collapsed group header. */
export const TOOL_GROUP_PREVIEW_COUNT = 8

/** Minimum number of consecutive tool messages required to form a group. */
export const TOOL_GROUP_MIN_SIZE = 2

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a message contains a respond_to_user tool call,
 * which means it carries user-visible output and must NOT be grouped.
 */
function hasRespondToUserCall(message: GroupableMessage): boolean {
  if (message.role !== 'assistant' || !message.toolCalls?.length) return false
  return message.toolCalls.some((tc) => tc.name === RESPOND_TO_USER_TOOL)
}

/**
 * Decide whether a single message qualifies as "connected tool activity"
 * that can be collapsed into a group.
 *
 * A message is groupable when ALL of the following hold:
 * 1. It is NOT a user message.
 * 2. It is NOT a respond_to_user call (user-visible output).
 * 3. It is either:
 *    a. A tool-role message (raw tool result), OR
 *    b. An assistant message that is "tool-only" (has tool calls but no
 *       meaningful user-facing content).
 */
function isGroupableToolActivity(message: GroupableMessage): boolean {
  // User messages are never grouped.
  if (message.role === 'user') return false

  // respond_to_user calls produce user-visible output — never group.
  if (hasRespondToUserCall(message)) return false

  // Tool-role messages are always groupable (raw results).
  if (message.role === 'tool') return true

  // Assistant messages: only group if they are tool-only (no real content).
  return isToolOnlyMessage(message)
}

// ---------------------------------------------------------------------------
// Single-line summary for a message (used in collapsed preview)
// ---------------------------------------------------------------------------

/**
 * Produce a single-line summary string for a groupable message.
 * Used to build the collapsed preview of a tool-activity group.
 */
export function getToolActivitySummaryLine(message: GroupableMessage): string {
  if (message.toolCalls?.length) {
    return getToolCallsSummary(message.toolCalls as Array<{ name: string; arguments: Record<string, unknown> }>)
  }

  if (message.toolResults?.length) {
    return ''
  }

  // Fallback: role label
  return message.role === 'tool' ? '🔧 tool result' : '🤖 assistant'
}

// ---------------------------------------------------------------------------
// Core grouping algorithm
// ---------------------------------------------------------------------------

/**
 * Scan a list of messages and identify contiguous runs of connected
 * tool-call activity that should be collapsed by default.
 *
 * Groups of fewer than {@link TOOL_GROUP_MIN_SIZE} messages are ignored
 * (not worth collapsing a single item).
 *
 * The returned `groupByIndex` map lets renderers do
 * an O(1) lookup per message index to decide whether to render normally
 * or as part of a collapsed group.
 */
export function groupToolActivity(messages: GroupableMessage[]): {
  groupByIndex: Map<number, ToolActivityGroup>
  groups: ToolActivityGroup[]
} {
  const groups: ToolActivityGroup[] = []
  const groupByIndex = new Map<number, ToolActivityGroup>()

  let runStart: number | null = null

  const flushRun = (runEnd: number) => {
    if (runStart === null) return
    const count = runEnd - runStart + 1
    if (count < TOOL_GROUP_MIN_SIZE) {
      runStart = null
      return
    }
    const previewLines: string[] = []
    const previewStartIdx = Math.max(runStart, runEnd - TOOL_GROUP_PREVIEW_COUNT + 1)
    for (let i = previewStartIdx; i <= runEnd; i++) {
      const line = getToolActivitySummaryLine(messages[i])
      if (line) previewLines.push(line)
    }
    const group: ToolActivityGroup = {
      startIndex: runStart,
      endIndex: runEnd,
      count,
      previewLines: previewLines.length > 0 ? [previewLines.join(', ')] : [],
    }
    groups.push(group)
    for (let i = runStart; i <= runEnd; i++) {
      groupByIndex.set(i, group)
    }
    runStart = null
  }

  for (let i = 0; i < messages.length; i++) {
    if (isGroupableToolActivity(messages[i])) {
      if (runStart === null) runStart = i
    } else {
      flushRun(i - 1)
    }
  }
  // Flush any trailing run.
  if (runStart !== null) flushRun(messages.length - 1)

  return { groups, groupByIndex }
}
