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

import { RESPOND_TO_USER_TOOL, isToolOnlyMessage, getExecuteCommandResultPreview, getToolCallPreview } from './chat-utils'
import { hexToRgba } from './colors'
import {
  getChatDisplayGroupedExpansionState,
  type ChatDisplayExpansionKey,
  type ChatDisplayGroupedExpansionInheritanceItem,
} from './message-display-utils'
import { formatToolExecutionCount } from './tool-execution-display'
import type { ToolCall, ToolResult } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal message shape accepted by the grouping logic. */
export interface ToolActivityGroupSourceMessage {
  role: 'user' | 'assistant' | 'tool'
  content?: string
  toolCalls?: Array<{ name: string; arguments?: unknown }>
  toolResults?: Array<{ success: boolean; content: string; error?: string }>
}

export interface ToolActivityPreviewToolCall {
  name: string
  arguments?: unknown
}

export interface ToolActivityPreviewToolResult {
  success: boolean
  content: string
  error?: string
}

export interface ToolActivityRunSummaryItem {
  toolCalls?: readonly ToolActivityPreviewToolCall[]
  toolResults?: readonly (ToolActivityPreviewToolResult | null | undefined)[]
  fallbackSummaryLine?: string | null
}

export interface ToolActivityRunSummary {
  toolCallCount: number
  previewLines: string[]
}

export interface ToolActivityRunSummaryOptions {
  maxItems?: number
}

/** A contiguous run of tool-activity messages that should be collapsed. */
export interface ToolActivityGroup {
  /** Index of the first message in the group (inclusive). */
  startIndex: number
  /** Index of the last message in the group (inclusive). */
  endIndex: number
  /** Number of messages in the group. */
  count: number
  /** Number of tool calls represented by the grouped activity. */
  toolCallCount: number
  /**
   * Collapsed preview lines — at most {@link TOOL_GROUP_PREVIEW_COUNT} entries,
   * taken from the *end* of the group (most recent activity).
   * Present for every collapsed group so historical session views still show
   * which tools were called without expanding the group.
   */
  previewLines: string[]
}

export interface ToolActivityGroups {
  groupByIndex: Map<number, ToolActivityGroup>
  groups: ToolActivityGroup[]
}

export interface ToolActivityGroupMobileIconState {
  name: typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.name
  size: number
  colorToken: typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.colorToken
  opacity: number
}

export type ToolActivityGroupMobileColorToken = 'info' | 'mutedForeground'
export type ToolActivityGroupMobileColorPalette = Readonly<Record<ToolActivityGroupMobileColorToken, string>>

export interface ToolActivityGroupMobileIconColors {
  color: string
}

export interface ToolActivityGroupMobileSurfaceColors {
  collapsed: {
    borderColor: string
    borderLeftColor: string
    backgroundColor: string
  }
  countBadge: {
    backgroundColor: string
    color: string
  }
  preview: {
    color: string
  }
  footerText: {
    color: string
  }
}

export type ToolActivityGroupMobileSurfaceState = typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile

export interface ToolActivityGroupMobileSurfaceRenderStateInput {
  colors: ToolActivityGroupMobileColorPalette
}

export interface ToolActivityGroupMobileSurfaceRenderState {
  surface: ToolActivityGroupMobileSurfaceState
  colors: ToolActivityGroupMobileSurfaceColors
}

export type ToolActivityGroupMobileToggleIconPlacement = 'header' | 'footer'

export interface ToolActivityGroupMobileToggleIconStateInput {
  isExpanded: boolean
  placement?: ToolActivityGroupMobileToggleIconPlacement
}

export interface ToolActivityGroupMobileToggleIconState {
  isExpanded: boolean
  placement: ToolActivityGroupMobileToggleIconPlacement
  name:
    | typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName
    | typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName
  size: number
  colorToken:
    | typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.colorToken
    | typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.footerText.colorToken
  opacity: number
}

export interface ToolActivityGroupMobileToggleIconColors {
  color: string
}

export interface ToolActivityGroupSummaryStateInput {
  activityCount: number
  toolCallCount?: number | null
  previewLines: readonly string[]
}

export interface ToolActivityGroupSummaryState {
  activityCount: number
  activityCountLabel: string
  previewText: string
  toolCallCount: number
  toolCallCountLabel: string
  shouldShowToolCallCount: boolean
  collapsedAccessibilityLabel: string
  collapseAccessibilityLabel: string
}

export type ToolActivityGroupStateKeySource = ToolActivityGroup | string | number

export type ToolActivityGroupExpansionStateInput = Readonly<Partial<Record<ChatDisplayExpansionKey, boolean>>>

export interface ToolActivityGroupRenderStateInput {
  group: ToolActivityGroup
  itemIndex: number
  groupState: ToolActivityGroupExpansionStateInput
  inheritedState?: ToolActivityGroupExpansionStateInput
  groupKey?: string
  inheritedKey?: ChatDisplayExpansionKey | null
  defaultExpanded?: boolean
}

export interface ToolActivityGroupRenderState {
  groupKey: string
  summary: ToolActivityGroupSummaryState
  isExpanded: boolean
  isFirstItem: boolean
  isLastItem: boolean
  shouldSkipCollapsedItem: boolean
  shouldRenderCollapsedHeader: boolean
  shouldRenderExpandedHeader: boolean
  shouldRenderExpandedFooter: boolean
}

export interface ToolActivityGroupMobileColoredIconState {
  name: ToolActivityGroupMobileIconState["name"] | ToolActivityGroupMobileToggleIconState["name"]
  size: number
  color: string
}

export interface ToolActivityGroupMobileRenderStateInput extends ToolActivityGroupRenderStateInput {
  colors: ToolActivityGroupMobileColorPalette
}

export interface ToolActivityGroupMobileRenderState extends ToolActivityGroupRenderState {
  copy: typeof TOOL_ACTIVITY_GROUP_PRESENTATION
  surface: typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile
  colors: ToolActivityGroupMobileSurfaceColors
  leadingIcon: ToolActivityGroupMobileColoredIconState
  headerToggleIcon: ToolActivityGroupMobileColoredIconState
  footerToggleIcon: ToolActivityGroupMobileColoredIconState
  collapsedHeader: {
    accessibilityRole: typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.collapsed.accessibilityRole
    accessibilityLabel: string
    accessibilityState: {
      expanded: boolean
    }
    ariaExpanded: boolean
  }
  expandedHeader: {
    accessibilityRole: typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.collapsed.accessibilityRole
    accessibilityLabel: string
    accessibilityState: {
      expanded: boolean
    }
    ariaExpanded: boolean
  }
  footerButton: {
    label: typeof TOOL_ACTIVITY_GROUP_PRESENTATION.collapseFromBottomLabel
    accessibilityRole: typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.footerButton.accessibilityRole
    accessibilityLabel: string
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of preview lines shown in the collapsed group header. */
export const TOOL_GROUP_PREVIEW_COUNT = 8

/** Minimum number of consecutive tool messages required to form a group. */
export const TOOL_GROUP_MIN_SIZE = 2

export const TOOL_ACTIVITY_GROUP_STATE_KEY_PREFIX = 'tool-activity-group:'

export const TOOL_ACTIVITY_GROUP_PRESENTATION = {
  collapsedFallbackLabel: 'Tool activity',
  fallbackToolResultLabel: 'tool result',
  fallbackAssistantLabel: 'assistant',
  expandAccessibilityLabel: 'Expand tool group',
  collapseAccessibilityLabel: 'Collapse tool group',
  collapseFromBottomAccessibilityLabel: 'Collapse tool group from bottom',
  collapseFromBottomTitle: 'Collapse tool group',
  collapseFromBottomLabel: 'Collapse group',
} as const

export const TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION = {
  desktop: {
    containerClassName: 'rounded-md text-xs transition-all duration-200',
    toneClassName: 'border border-sky-200/60 bg-sky-50/20 dark:border-sky-900/40 dark:bg-sky-950/10',
    collapsedToggleClassName: 'hover:brightness-95 dark:hover:brightness-110 cursor-pointer',
    headerClassName: 'flex min-w-0 items-center gap-1.5 px-2.5 py-1',
    iconClassName: 'h-3 w-3 shrink-0 text-sky-600/80 dark:text-sky-300/80',
    countBadgeClassName: 'shrink-0 rounded bg-sky-100/70 px-1 py-px font-mono text-[9px] font-semibold text-sky-800/80 dark:bg-sky-900/40 dark:text-sky-100/80',
    previewClassName: 'min-w-0 flex-1 truncate whitespace-nowrap font-mono text-[10px] text-sky-900/80 dark:text-sky-100/80',
    toggleButtonClassName: 'shrink-0 p-0.5 rounded hover:bg-muted/30 transition-colors',
    toggleIconClassName: 'h-3 w-3 text-muted-foreground/60',
    expandedContentClassName: 'space-y-1 px-1.5 pb-1.5',
    expandedItemsClassName: 'space-y-1',
    footerClassName: 'flex justify-end border-t border-sky-200/50 pt-1 dark:border-sky-900/40',
    footerButtonClassName: 'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-sky-700/75 transition-colors hover:bg-sky-100/70 hover:text-sky-900 dark:text-sky-300/75 dark:hover:bg-sky-950/60 dark:hover:text-sky-100',
  },
  mobile: {
    collapsed: {
      paddingVertical: 4,
      paddingHorizontal: 'xs',
      borderRadius: 'sm',
      borderWidth: 1,
      borderAlpha: 0.18,
      borderLeftWidth: 2,
      borderLeftAlpha: 0.42,
      backgroundAlpha: 0.04,
      colorToken: 'info',
      marginBottom: 2,
      accessibilityRole: 'button',
    },
    pressedOpacity: 0.7,
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      overflow: 'hidden',
    },
    icon: {
      name: 'construct-outline',
      size: 14,
      colorToken: 'info',
      opacity: 0.82,
    },
    countBadge: {
      minWidth: 18,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 'sm',
      fontFamilyByPlatform: {
        ios: 'Menlo',
        default: 'monospace',
      },
      backgroundAlpha: 0.12,
      fontSize: 9,
      fontWeight: '700',
      colorToken: 'info',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 10,
      fontWeight: '600',
    },
    preview: {
      numberOfLines: 1,
      ellipsizeMode: 'tail',
      fontSize: 10,
      colorToken: 'mutedForeground',
      fontFamilyByPlatform: {
        ios: 'Menlo',
        default: 'monospace',
      },
      flexShrink: 1,
      minWidth: 0,
    },
    toggleIcon: {
      collapsedName: 'chevron-down',
      expandedName: 'chevron-up',
      size: 14,
      colorToken: 'mutedForeground',
      opacity: 0.7,
    },
    footerButton: {
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
      marginBottom: 2,
      paddingHorizontal: 'xs',
      paddingVertical: 3,
      borderRadius: 'sm',
      accessibilityRole: 'button',
    },
    footerText: {
      fontSize: 10,
      fontWeight: '600',
      colorToken: 'info',
    },
  },
} as const

export function getToolActivityGroupCopyState(): typeof TOOL_ACTIVITY_GROUP_PRESENTATION {
  return TOOL_ACTIVITY_GROUP_PRESENTATION
}

export function getToolActivityGroupStateKey(source: ToolActivityGroupStateKeySource): string {
  const key = typeof source === 'object' ? source.startIndex : source
  return `${TOOL_ACTIVITY_GROUP_STATE_KEY_PREFIX}${key}`
}

export function getToolActivityGroupExpansionInheritanceItems(
  groups: readonly ToolActivityGroup[],
): ChatDisplayGroupedExpansionInheritanceItem[] {
  return groups.map((group) => ({
    groupKey: getToolActivityGroupStateKey(group),
    inheritedKey: group.startIndex,
  }))
}

export function formatToolActivityGroupCount(count: number): string {
  return formatToolExecutionCount('tool_activity', count)
}

export function formatToolActivityGroupToolCallCount(count: number): string {
  return formatToolExecutionCount('tool_call', count)
}

export function formatToolActivityGroupPreviewLine(
  previewLines: readonly string[],
  fallbackLabel: string = TOOL_ACTIVITY_GROUP_PRESENTATION.collapsedFallbackLabel,
): string {
  const preview = previewLines
    .map((line) => line.trim())
    .filter(Boolean)
    .join(', ')

  return preview || fallbackLabel
}

export function getToolActivityGroupSummaryState(
  input: ToolActivityGroupSummaryStateInput,
): ToolActivityGroupSummaryState {
  const toolCallCount = Math.max(0, input.toolCallCount ?? 0)

  return {
    activityCount: input.activityCount,
    activityCountLabel: formatToolActivityGroupCount(input.activityCount),
    previewText: formatToolActivityGroupPreviewLine(input.previewLines),
    toolCallCount,
    toolCallCountLabel: toolCallCount > 0
      ? formatToolActivityGroupToolCallCount(toolCallCount)
      : '',
    shouldShowToolCallCount: toolCallCount > 0,
    collapsedAccessibilityLabel: formatCollapsedToolActivityGroupAccessibilityLabel(input.activityCount),
    collapseAccessibilityLabel: formatToolActivityGroupCollapseAccessibilityLabel(input.activityCount),
  }
}

export function getToolActivityGroupRenderState(
  input: ToolActivityGroupRenderStateInput,
): ToolActivityGroupRenderState {
  const groupKey = input.groupKey ?? getToolActivityGroupStateKey(input.group)
  const inheritedKey = input.inheritedKey ?? input.group.startIndex
  const isExpanded = getChatDisplayGroupedExpansionState({
    groupState: input.groupState,
    groupKey,
    inheritedState: input.inheritedState,
    inheritedKey,
    defaultExpanded: input.defaultExpanded,
  })
  const isFirstItem = input.itemIndex === input.group.startIndex
  const isLastItem = input.itemIndex === input.group.endIndex

  return {
    groupKey,
    summary: getToolActivityGroupSummaryState({
      activityCount: input.group.count,
      toolCallCount: input.group.toolCallCount,
      previewLines: input.group.previewLines,
    }),
    isExpanded,
    isFirstItem,
    isLastItem,
    shouldSkipCollapsedItem: !isExpanded && !isFirstItem,
    shouldRenderCollapsedHeader: !isExpanded && isFirstItem,
    shouldRenderExpandedHeader: isExpanded && isFirstItem,
    shouldRenderExpandedFooter: isExpanded && isLastItem,
  }
}

export function getToolActivityToolCallPreview(
  toolCall: ToolActivityPreviewToolCall,
  toolResult?: ToolActivityPreviewToolResult | null,
): string {
  const args = toolCall.arguments
  const normalizedToolCall: ToolCall = {
    name: toolCall.name,
    arguments: args && typeof args === 'object' && !Array.isArray(args)
      ? args as Record<string, unknown>
      : {},
  }
  const normalizedToolResult: ToolResult | null = toolResult
    ? {
        success: toolResult.success,
        content: toolResult.content,
        error: toolResult.error,
      }
    : null

  return getExecuteCommandResultPreview(normalizedToolCall, normalizedToolResult) ??
    getToolCallPreview(normalizedToolCall)
}

export function getToolActivityGroupMobileLeadingIconState(): ToolActivityGroupMobileIconState {
  return {
    name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.name,
    size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.size,
    colorToken: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.colorToken,
    opacity: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.opacity,
  }
}

export function getToolActivityGroupMobileLeadingIconColors(
  colors: ToolActivityGroupMobileColorPalette,
): ToolActivityGroupMobileIconColors {
  const icon = getToolActivityGroupMobileLeadingIconState()

  return {
    color: hexToRgba(colors[icon.colorToken], icon.opacity),
  }
}

export function getToolActivityGroupMobileSurfaceState(): ToolActivityGroupMobileSurfaceState {
  return TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile
}

export function getToolActivityGroupMobileSurfaceColors(
  colors: ToolActivityGroupMobileColorPalette,
): ToolActivityGroupMobileSurfaceColors {
  const surface = TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile
  const collapsedColor = colors[surface.collapsed.colorToken]
  const countBadgeColor = colors[surface.countBadge.colorToken]

  return {
    collapsed: {
      borderColor: hexToRgba(collapsedColor, surface.collapsed.borderAlpha),
      borderLeftColor: hexToRgba(collapsedColor, surface.collapsed.borderLeftAlpha),
      backgroundColor: hexToRgba(collapsedColor, surface.collapsed.backgroundAlpha),
    },
    countBadge: {
      backgroundColor: hexToRgba(countBadgeColor, surface.countBadge.backgroundAlpha),
      color: countBadgeColor,
    },
    preview: {
      color: colors[surface.preview.colorToken],
    },
    footerText: {
      color: colors[surface.footerText.colorToken],
    },
  }
}

export function getToolActivityGroupMobileSurfaceRenderState({
  colors,
}: ToolActivityGroupMobileSurfaceRenderStateInput): ToolActivityGroupMobileSurfaceRenderState {
  return {
    surface: getToolActivityGroupMobileSurfaceState(),
    colors: getToolActivityGroupMobileSurfaceColors(colors),
  }
}

export function getToolActivityGroupDesktopSurfaceState(): typeof TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.desktop {
  return TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.desktop
}

export function getToolActivityGroupMobileToggleIconState(
  input: ToolActivityGroupMobileToggleIconStateInput,
): ToolActivityGroupMobileToggleIconState {
  const placement = input.placement ?? 'header'
  return {
    isExpanded: input.isExpanded,
    placement,
    name: input.isExpanded
      ? TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName
      : TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName,
    size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.size,
    colorToken: placement === 'footer'
      ? TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.footerText.colorToken
      : TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.colorToken,
    opacity: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.opacity,
  }
}

export function getToolActivityGroupMobileToggleIconColors(
  input: ToolActivityGroupMobileToggleIconStateInput,
  colors: ToolActivityGroupMobileColorPalette,
): ToolActivityGroupMobileToggleIconColors {
  const icon = getToolActivityGroupMobileToggleIconState(input)

  return {
    color: hexToRgba(colors[icon.colorToken], icon.opacity),
  }
}

export function getToolActivityGroupMobileRenderState(
  input: ToolActivityGroupMobileRenderStateInput,
): ToolActivityGroupMobileRenderState {
  const renderState = getToolActivityGroupRenderState(input)
  const surfaceRenderState = getToolActivityGroupMobileSurfaceRenderState({
    colors: input.colors,
  })
  const leadingIcon = getToolActivityGroupMobileLeadingIconState()
  const leadingIconColors = getToolActivityGroupMobileLeadingIconColors(input.colors)
  const headerToggleIcon = getToolActivityGroupMobileToggleIconState({
    isExpanded: renderState.isExpanded,
  })
  const headerToggleIconColors = getToolActivityGroupMobileToggleIconColors(
    { isExpanded: renderState.isExpanded },
    input.colors,
  )
  const footerToggleIcon = getToolActivityGroupMobileToggleIconState({
    isExpanded: true,
    placement: 'footer',
  })
  const footerToggleIconColors = getToolActivityGroupMobileToggleIconColors(
    { isExpanded: true, placement: 'footer' },
    input.colors,
  )

  return {
    ...renderState,
    copy: TOOL_ACTIVITY_GROUP_PRESENTATION,
    surface: surfaceRenderState.surface,
    colors: surfaceRenderState.colors,
    leadingIcon: {
      name: leadingIcon.name,
      size: leadingIcon.size,
      color: leadingIconColors.color,
    },
    headerToggleIcon: {
      name: headerToggleIcon.name,
      size: headerToggleIcon.size,
      color: headerToggleIconColors.color,
    },
    footerToggleIcon: {
      name: footerToggleIcon.name,
      size: footerToggleIcon.size,
      color: footerToggleIconColors.color,
    },
    collapsedHeader: {
      accessibilityRole: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.collapsed.accessibilityRole,
      accessibilityLabel: renderState.summary.collapsedAccessibilityLabel,
      accessibilityState: { expanded: false },
      ariaExpanded: false,
    },
    expandedHeader: {
      accessibilityRole: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.collapsed.accessibilityRole,
      accessibilityLabel: renderState.summary.collapseAccessibilityLabel,
      accessibilityState: { expanded: true },
      ariaExpanded: true,
    },
    footerButton: {
      label: TOOL_ACTIVITY_GROUP_PRESENTATION.collapseFromBottomLabel,
      accessibilityRole: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.footerButton.accessibilityRole,
      accessibilityLabel: renderState.summary.collapseAccessibilityLabel,
    },
  }
}

export function formatCollapsedToolActivityGroupAccessibilityLabel(count: number): string {
  return `${formatToolActivityGroupCount(count)}, collapsed. Tap to expand.`
}

export function formatToolActivityGroupCollapseAccessibilityLabel(count: number): string {
  return `Collapse ${formatToolActivityGroupCount(count)}`
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a message contains a respond_to_user tool call,
 * which means it carries user-visible output and must NOT be grouped.
 */
function hasRespondToUserCall(message: ToolActivityGroupSourceMessage): boolean {
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
function isGroupableToolActivity(message: ToolActivityGroupSourceMessage): boolean {
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
export function getToolActivitySummaryLine(message: ToolActivityGroupSourceMessage): string {
  if (message.toolCalls?.length) {
    return message.toolCalls
      .map((toolCall, index) =>
        getToolActivityToolCallPreview(toolCall, message.toolResults?.[index] ?? null))
      .join(', ')
  }

  if (message.toolResults?.length) {
    return ''
  }

  // Fallback: role label
  return message.role === 'tool'
    ? TOOL_ACTIVITY_GROUP_PRESENTATION.fallbackToolResultLabel
    : TOOL_ACTIVITY_GROUP_PRESENTATION.fallbackAssistantLabel
}

export function getToolActivityRunSummary(
  items: readonly ToolActivityRunSummaryItem[],
  options: ToolActivityRunSummaryOptions = {},
): ToolActivityRunSummary {
  const summaryItems = typeof options.maxItems === 'number'
    ? items.slice(Math.max(0, items.length - Math.max(0, options.maxItems)))
    : items
  const previewLines: string[] = []
  let toolCallCount = 0

  for (const item of items) {
    toolCallCount += item.toolCalls?.length ?? 0
  }

  for (const item of summaryItems) {
    const toolCalls = item.toolCalls ?? []
    const toolResults = item.toolResults ?? []

    if (toolCalls.length > 0) {
      for (let index = 0; index < toolCalls.length; index++) {
        const toolCall = toolCalls[index]
        if (!toolCall) continue
        previewLines.push(getToolActivityToolCallPreview(
          toolCall,
          toolResults[index] ?? null,
        ))
      }
      continue
    }

    const fallbackSummaryLine = item.fallbackSummaryLine?.trim()
    if (fallbackSummaryLine) previewLines.push(fallbackSummaryLine)
  }

  return {
    toolCallCount,
    previewLines,
  }
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
export function groupToolActivity(messages: ToolActivityGroupSourceMessage[]): ToolActivityGroups {
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
    const runMessages = messages.slice(runStart, runEnd + 1)
    const summary = getToolActivityRunSummary(
      runMessages.map((message) => ({
        toolCalls: message.toolCalls,
        toolResults: message.toolResults,
        fallbackSummaryLine: getToolActivitySummaryLine(message),
      })),
      { maxItems: TOOL_GROUP_PREVIEW_COUNT },
    )
    const group: ToolActivityGroup = {
      startIndex: runStart,
      endIndex: runEnd,
      count,
      toolCallCount: summary.toolCallCount,
      previewLines: summary.previewLines.length > 0 ? [summary.previewLines.join(', ')] : [],
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
