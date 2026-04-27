import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const acpSessionBadgeSource = readFileSync(new URL("./acp-session-badge.tsx", import.meta.url), "utf8")
const messageQueuePanelSource = readFileSync(new URL("./message-queue-panel.tsx", import.meta.url), "utf8")
const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")

describe("agent progress tile layout", () => {
  it("wraps the tile header chrome for narrow session widths and zoomed text", () => {
    expect(agentProgressSource).toContain(
      '"flex flex-wrap items-center gap-1.5 border-b bg-muted/30 flex-shrink-0 app-drag-region"'
    )
    expect(agentProgressSource).toContain('canCollapseTile && "cursor-pointer"')
    expect(agentProgressSource).toContain('isCollapsed ? "px-2.5 py-1.5" : "px-3 py-2"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-center gap-1.5"')
    expect(agentProgressSource).toContain('className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 app-no-drag-region"')
  })

  it("wraps the tile footer metadata row and preserves trailing status visibility", () => {
    expect(agentProgressSource).toContain('className="flex items-center justify-between gap-2"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-center gap-x-2"')
    expect(agentProgressSource).toContain('<SessionModelPicker modelInfo={modelInfo} compact />')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap">Step')
  })

  it("lets the tile chat-summary switcher and delegation preview adapt to narrow widths", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5"'
    )
    expect(agentProgressSource).toContain(
      '"inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"'
    )
    expect(agentProgressSource).toContain('<span className="truncate">Summary</span>')
    expect(agentProgressSource).toContain(
      '"flex flex-wrap items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 transition-colors"'
    )
    expect(agentProgressSource).toContain('alwaysOpen ? "cursor-default" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"')
    expect(agentProgressSource).toContain('className="min-w-0 flex flex-1 items-center gap-1.5"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 truncate text-[10px] font-medium text-gray-600 dark:text-gray-400"'
    )
  })

  it("surfaces latest delegated activity and a richer live details dialog from the tile chat area", () => {
    expect(agentProgressSource).toContain('Delegations')
    expect(agentProgressSource).toContain('Details')
    expect(agentProgressSource).toContain('<DelegationSummaryStrip')
    expect(agentProgressSource).toContain('<DelegationDetailsDialog')
    expect(agentProgressSource).toContain('alwaysOpen')
    expect(agentProgressSource).toContain('defaultShowAll')
  })

  it("reuses compact delegated info rows for task/update/result sections", () => {
    expect(agentProgressSource).toContain('const DelegationInfoRow: React.FC<{')
    expect(agentProgressSource).toContain('"flex items-start gap-2 rounded-md border px-2 py-1.5"')
    expect(agentProgressSource).toContain('"w-12 shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-wide"')
    expect(agentProgressSource).toContain('<DelegationInfoRow')
    expect(agentProgressSource).toContain('label="Task"')
    expect(agentProgressSource).toContain('label="Update"')
    expect(agentProgressSource).toContain('label="Result"')
  })

  it("tightens delegated headers, action buttons, and details dialog spacing", () => {
    expect(agentProgressSource).toContain('"px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity"')
    expect(agentProgressSource).toContain('className={cn("h-4 rounded-full px-1 text-[9px] font-medium", statusBadgeClass)}')
    expect(agentProgressSource).toContain('className="inline-flex h-7 items-center justify-center rounded-md border border-purple-200/80 px-2 text-[10px] font-medium text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-800/70 dark:text-purple-300 dark:hover:bg-purple-950/30"')
    expect(agentProgressSource).toContain('className="inline-flex h-7 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-foreground transition-colors hover:bg-muted"')
    expect(agentProgressSource).toContain('className="max-h-[76vh] overflow-hidden p-3 sm:max-w-xl"')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-1 text-[13px]"')
  })

  it("compresses sub-agent conversation cards and activity panel padding", () => {
    expect(agentProgressSource).toContain('className={cn("rounded-md border text-xs transition-all", roleMeta.containerClass)}')
    expect(agentProgressSource).toContain('className="flex items-start gap-1.5 px-2 py-1.5"')
    expect(agentProgressSource).toContain('className={cn("mt-0.5 rounded-full p-1 bg-white/70 dark:bg-black/20", roleMeta.iconClass)}')
    expect(agentProgressSource).toContain('className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", roleMeta.badgeClass)}')
    expect(agentProgressSource).toContain('className="overflow-y-auto p-1 space-y-1"')
    expect(agentProgressSource).toContain('style={{ maxHeight: isCompact ? "min(32vh, 220px)" : "min(36vh, 280px)" }}')
  })

  it("caps ACP session badges to the available tile width and truncates long labels", () => {
    expect(acpSessionBadgeSource).toContain(
      '"inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 cursor-help"'
    )
    expect(acpSessionBadgeSource).toContain("function getConfigOptionLabel")
    expect(acpSessionBadgeSource).toContain("Array.isArray(option.options)")
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-medium"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"'
    )
    expect(acpSessionBadgeSource).toContain('className="truncate"')
  })

  it("keeps tile message-stream tool execution rows readable at narrow widths and zoom", () => {
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain(
      'rowClassName = "px-1.5 py-0.5"'
    )
    expect(agentProgressSource).toContain('rowClassName="px-1 py-0.5"')
    expect(agentProgressSource).toContain('className="min-w-0 flex-1 truncate whitespace-nowrap font-mono font-medium"')
    expect(agentProgressSource).toContain('className="mb-1 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex shrink-0 flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap opacity-50 text-[10px]"')
    expect(agentProgressSource).toContain('() => buildSubAgentConversationItems(conversation, delegationStatus)')
    expect(agentProgressSource).toContain('<ToolExecutionBubble')
  })

  it("renders collapsed tool previews inline with the group title", () => {
    expect(agentProgressSource).toContain('const collapsedPreviewLine = group.previewLines.join')
    expect(agentProgressSource).toContain('!isExpanded && collapsedPreviewLine')
    expect(agentProgressSource).toContain('flex-1 truncate whitespace-nowrap font-mono')
  })

  it("keeps tool group expansion state separate from child rows", () => {
    expect(agentProgressSource).toContain('const groupId = `tool-activity-group:${runItems[0]?.id ?? runStart}`')
    expect(agentProgressSource).toContain('getToolActivityGroupDefaultExpanded')
    expect(agentProgressSource).toContain('next[item.id] = true')
  })

  it("stops delegated tool rows from showing a loading spinner after terminal completion", () => {
    expect(agentProgressSource).toContain('function isDelegationActiveStatus(status: ACPDelegationProgress["status"]): boolean {')
    expect(agentProgressSource).toContain('const isPending = isToolUseMessage && !resultMessage && isDelegationActive')
    expect(agentProgressSource).toContain('error: "Delegation failed before a tool result was captured."')
    expect(agentProgressSource).toContain('error: "Delegation was cancelled before a tool result was captured."')
    expect(agentProgressSource).toContain('if (message.role !== "tool") {')
    expect(agentProgressSource).toContain('return message.role === "tool" && /^tool result:/i.test((message.content ?? "").trim())')
    expect(agentProgressSource).toContain('if (message.toolName || message.toolInput !== undefined || isDelegatedToolResultMessage(message)) {')
    expect(agentProgressSource).toContain('if (hasRenderableStructuredMessageContent(message)) {')
    expect(agentProgressSource).toContain('items.push({ kind: "message", key: `msg-structured-${index}`, message })')
    expect(agentProgressSource).toContain('if (hasStructuredToolData && structuredToolCalls.length === 0 && structuredToolResults.length > 0) {')
    expect(agentProgressSource).toContain('if (!attachStructuredResultToPendingExecution(result)) {')
    expect(agentProgressSource).toContain('appendToolExecutionItem(`tool-structured-${index}`, structuredExecution, true)')
    expect(agentProgressSource).toContain('function normalizeStructuredToolResultContent(')
    expect(agentProgressSource).toContain('if (typeof result.content === "string") {')
    expect(agentProgressSource).not.toContain('content: result.content || "Tool completed"')
    expect(agentProgressSource).toContain('() => buildSubAgentConversationItems(conversation, delegationStatus)')
  })

  it("keeps respond_to_user assistant tool calls outside collapsed tool activity groups", () => {
    expect(agentProgressSource).toContain('return !item.data.calls.some((call) => isCompletionControlTool(call.name))')
    expect(agentProgressSource).toContain('function isCompletionControlTool(toolName: string): boolean {')
  })

  it("wraps expanded tool detail chrome and caps tool output blocks inside narrow tiles", () => {
    expect(agentProgressSource).toContain(
      'detailsClassName="mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center justify-between gap-1.5"'
    )
    expect(agentProgressSource).toContain(
      'detailsClassName = "mt-1 ml-3 space-y-1 border-l border-border/50 pl-2"'
    )
    expect(agentProgressSource).toContain(
      'overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px]'
    )
  })

  it("keeps structured tool payloads compact and collapses payloads over two lines", () => {
    expect(agentProgressSource).toContain('const COLLAPSIBLE_PAYLOAD_LINE_THRESHOLD = 2')
    expect(agentProgressSource).toContain('lineCount > COLLAPSIBLE_PAYLOAD_LINE_THRESHOLD')
    expect(agentProgressSource).toContain('<details className="group"')
    expect(agentProgressSource).toContain('const StructuredPayloadTree: React.FC')
    expect(agentProgressSource).toContain('getStructuredPayloadChildEntries(value.value)')
    expect(agentProgressSource).toContain('title={value.compactText}>{value.compactText}</span>')
    expect(agentProgressSource).not.toContain('{value.expandedText}\n        </pre>')
  })

  it("keeps the session model visible and clickable as a picker", () => {
    expect(agentProgressSource).toContain('const SessionModelPicker: React.FC')
    expect(agentProgressSource).toContain('aria-label="Change agent model"')
    expect(agentProgressSource).toContain('buildAgentModelConfigUpdates(config, providerId, modelId)')
    expect(agentProgressSource).toContain('{modelInfo && (')
    expect(agentProgressSource).toContain('{(profileName || modelInfo || contextInfo || !isComplete) && (')
  })

  it("keeps inline tool approval cards readable in narrow tiles and under zoom", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="mb-2 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="max-w-full min-w-0 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"'
    )
    expect(agentProgressSource).toContain(
      'className="mb-2 rounded-md border border-amber-200/70 bg-amber-100/40 px-2 py-1.5 text-[11px] font-mono leading-relaxed text-amber-700/80 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300/80 line-clamp-2 break-words [overflow-wrap:anywhere]"'
    )
    expect(agentProgressSource).toContain('className="space-y-1.5"')
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1.5 text-[10px] text-amber-700/80 dark:text-amber-300/80"'
    )
  })

  it("keeps the session-tile scroll-to-bottom affordance scoped inside the chat area", () => {
    expect(agentProgressSource).toContain('title="Scroll to bottom"')
    expect(agentProgressSource).toContain('aria-label="Scroll to bottom"')
    expect(agentProgressSource).toContain('scrollToBottom("smooth")')
    expect(agentProgressSource).toContain(
      'className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"'
    )
  })

  it("uses a lightweight plain-text path for active streaming bubbles before final markdown rendering", () => {
    expect(agentProgressSource).toContain('const contentNode = streamingContent.isStreaming')
    expect(agentProgressSource).toContain('className="markdown-selectable whitespace-pre-wrap break-words [overflow-wrap:anywhere]"')
    expect(agentProgressSource).toContain(': <MarkdownRenderer content={streamingContent.text} />')
  })

  it("wraps retry banners and queue chrome safely in narrow tile footers", () => {
    expect(agentProgressSource).toContain(
      'className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 px-3 py-2"')
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center gap-2"')
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-xs"'
    )
    expect(messageQueuePanelSource).toContain(
      '"min-w-0 flex-1"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex shrink-0 items-center gap-1"'
    )
    expect(messageQueuePanelSource).toContain(
      '"flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 flex-1 items-center gap-1.5"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="border-b border-orange-200 bg-orange-100/30 px-2.5 py-1 text-[10px] text-orange-700 break-words dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 items-start gap-2"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="flex min-w-0 flex-1 items-start gap-1.5"'
    )
    expect(messageQueuePanelSource).toContain(
      'className="ml-auto flex shrink-0 items-center gap-0.5 self-start"'
    )
    expect(messageQueuePanelSource).not.toContain(
      '"ml-auto flex shrink-0 flex-wrap items-center gap-1 self-start transition-opacity"'
    )
  })

  it("keeps shared audio player and compact TTS errors readable under width pressure", () => {
    expect(audioPlayerSource).toContain('const compactStatusText = hasAudio')
    expect(audioPlayerSource).toContain(
      '"inline-flex items-center"'
    )
    expect(audioPlayerSource).toContain('className="h-10 w-10 shrink-0 p-0"')
    expect(audioPlayerSource).toContain(
      'className={cn("min-w-0 max-w-full space-y-2 rounded-lg bg-muted/50 p-3", className)}'
    )
    expect(audioPlayerSource).toContain('className="flex flex-wrap items-center gap-3"')
    expect(audioPlayerSource).toContain('className="min-w-0 flex-1 space-y-1"')
    expect(audioPlayerSource).toContain('className="ml-auto flex min-w-0 max-w-full items-center gap-2"')
    expect(audioPlayerSource).toContain('aria-label="Audio position"')
    expect(audioPlayerSource).toContain('aria-label="Audio volume"')
    expect(agentProgressSource).toContain(
      'className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300"'
    )
  })

  it("does not auto-play TTS for tile expansion/collapse interactions", () => {
    expect(agentProgressSource).toContain('function shouldAutoPlayTTSForVariant')
    expect(agentProgressSource).toContain('if (variant === "tile") return isFocused && !isFloatingPanelVisible')
  })

  it("uses shared conversation-state normalization across agent progress surfaces", () => {
    expect(agentProgressSource).toContain('getAgentConversationStateLabel')
    expect(agentProgressSource).toContain('normalizeAgentConversationState(progress.conversationState, isComplete ? "complete" : "running")')
    expect(agentProgressSource).toContain('conversationState === "needs_input"')
    expect(agentProgressSource).toContain('conversationState === "blocked"')
    expect(agentProgressSource).toContain(
      'Badge variant="outline" className={cn("h-4 rounded-full px-1 text-[9px] font-medium", statusBadgeClass)}'
    )
    expect(agentProgressSource).toContain('const conversationStateBadgeClass = conversationState === "complete"')
  })
})
