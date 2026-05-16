import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "@renderer/lib/utils"
import type { ACPDelegationProgress, ACPSubAgentMessage, AgentDelegationSummaryEntry, AgentProgressUpdate, AgentRetryInfo } from "@dotagents/shared/agent-progress"
import type { Config } from "../../../shared/types"
import {
  DEFAULT_MCP_MESSAGE_QUEUE_ENABLED,
  INTERNAL_COMPLETION_NUDGE_TEXT,
} from "@dotagents/shared/mcp-api"
import { ChevronDown, ChevronUp, ChevronRight, X, AlertTriangle, Shield, Check, XCircle, Loader2, Clock, Copy, CheckCheck, GripHorizontal, Activity, Moon, Maximize2, Bot, OctagonX, MessageSquare, Brain, Volume2, Wrench, Play, Pause, Pin, GitBranch } from "lucide-react"
import { MarkdownRenderer } from "@renderer/components/markdown-renderer"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { desktopAgentSessionsClient } from "@renderer/lib/desktop-agent-sessions-client"
import { desktopConfigClient } from "@renderer/lib/desktop-config-client"
import { desktopConversationsClient } from "@renderer/lib/desktop-conversations-client"
import { desktopPanelClient } from "@renderer/lib/desktop-panel-client"
import { desktopTtsClient } from "@renderer/lib/desktop-tts-client"
import { useAgentStore, useMessageQueue, useIsQueuePaused } from "@renderer/stores"
import { AudioPlayer } from "@renderer/components/audio-player"
import { useAvailableModelsQuery, useConfigQuery, queryClient } from "@renderer/lib/queries"
import { useTheme } from "@renderer/contexts/theme-context"
import { logUI, logExpand } from "@renderer/lib/debug"
import { useNavigate } from "react-router-dom"
import { TileFollowUpInput } from "./tile-follow-up-input"
import { OverlayFollowUpInput } from "./overlay-follow-up-input"
import { MessageQueuePanel } from "@renderer/components/message-queue-panel"
import { useResizable, TILE_DIMENSIONS } from "@renderer/hooks/use-resizable"
import {
  extractRespondToUserResponseEvents,
  formatToolArguments,
  getToolArgumentEntries,
  getCompactToolExecutionPreview,
  getToolResultsSummary,
  getChatMessageDisplayState,
  hasVisibleChatMessageContent,
  isCompletionControlTool,
} from "@dotagents/shared/chat-utils"
import {
  formatAgentDelegationConversationTranscript,
  getAgentDelegationConversationMessageDisplayState,
  getAgentDelegationConversationPreview,
  getAgentDelegationConversationRenderItems,
  getAgentDelegationPresentation,
  getAgentDelegationSummaryEntries,
  isAgentDelegationActiveStatus,
  type AgentUserResponseEvent,
} from "@dotagents/shared/agent-progress"
import {
  TOOL_GROUP_MIN_SIZE,
  getToolActivityGroupDesktopSurfaceState,
  getToolActivityGroupCopyState,
  getToolActivityRunSummary,
  getToolActivityGroupStateKey,
  getToolActivityGroupSummaryState,
} from "@dotagents/shared/tool-activity-grouping"
import {
  AGENT_MODEL_FALLBACKS,
  type AgentModelConfigLike,
  buildAgentModelConfigUpdates,
  getActiveModelPreset,
  resolveAgentProviderId,
  resolveConfiguredAgentModel,
} from "@dotagents/shared/model-presets"
import {
  getBuiltInModelPresets,
  DEFAULT_MODEL_PRESET_ID,
  type CHAT_PROVIDER_ID,
} from "@dotagents/shared/providers"
import {
  DEFAULT_TTS_AUTO_PLAY,
  DEFAULT_TTS_ENABLED,
} from "@dotagents/shared/text-to-speech-settings"
import { createExpandCollapseAccessibilityLabel } from "@dotagents/shared/accessibility-utils"
import {
  CODEX_TEXT_VERBOSITY_OPTIONS,
  DEFAULT_CODEX_TEXT_VERBOSITY,
  getOpenAiReasoningEffortDefault,
  OPENAI_REASONING_EFFORT_OPTIONS,
  type CodexTextVerbosity,
  type OpenAiReasoningEffort,
} from "@dotagents/shared/agent-generation-options"
import { ToolExecutionStats } from "./tool-execution-stats"
import { ACPSessionBadge } from "./acp-session-badge"
import { AgentSummaryView } from "./agent-summary-view"
import { LoadingSpinner } from "./ui/loading-spinner"
import { buildContentTTSKey, buildResponseEventTTSKey } from "@dotagents/shared/tts-tracking"
import { consumeSessionForcedAutoPlay, hasTTSPlayed, markTTSPlayed, removeTTSKey } from "@renderer/lib/tts-tracking"
import { ttsManager } from "@renderer/lib/tts-manager"
import {
  applyChatDisplayGroupedExpansionInheritance,
  createChatMessageActionSlotRenderState,
  getChatMessageActionAvailabilityRenderState,
  getChatMessageActionCopyState,
  getChatMessageActionDesktopSurfaceState,
  getChatDisplayExpansionState,
  getChatDisplayGroupedExpansionState,
  getChatMessageContentRenderState,
  getChatMessageCopyActionAccessibilityLabel,
  getChatMessageCopyActionState,
  getChatMessageCopyActionTitle,
  getChatMessageDesktopSurfaceState,
  getChatMessageDisplayTone,
  getChatMessageExpansionActionAccessibilityLabel,
  getChatMessageExpansionActionState,
  getChatMessageExpansionActionTitle,
  getChatMessageExpansionLabel,
  getChatMessageSpeechActionState,
  getChatMessageToneDesktopClassName,
  findLastChatMessageConversationContentIndex,
  isChatMessageConversationContent,
  normalizeAssistantResponseForDedupe,
  sanitizeMessageContentForDisplay,
  sanitizeMessageContentForSpeech,
  setChatDisplayExpansionState,
  stripMarkdownMediaPayloads,
} from "@dotagents/shared/message-display-utils"
import { normalizeMarkdownThoughtContent } from "@dotagents/shared/markdown-render-parts"
import { toast } from "sonner"
import {
  formatChatRuntimeActivityContent,
  formatChatRuntimeConversationHistorySummary,
  formatChatRuntimeDelegationMessageCount,
  formatChatRuntimeDelegationMessagesLabel,
  formatChatRuntimeEarlierDelegationMessagesLabel,
  formatChatRuntimeLoadEarlierLabel,
  formatChatRuntimeModelPickerTitle,
  formatChatRuntimeRetryAttemptLabel,
  formatChatRuntimeRetryCountdownLabel,
  formatChatRuntimeThinkingPickerTitle,
  formatChatRuntimeToolApprovalFailureMessage,
  formatChatRuntimeVerbosityPickerTitle,
  formatChatRuntimeVisibleUpdatesSummary,
  getChatRuntimeBranchActionAccessibilityLabel,
  getChatRuntimeBranchActionState,
  getChatRuntimeBranchActionTitle,
  getChatRuntimeCopyState,
  getChatRuntimeDelegationStatusDesktopClassNames,
  getChatRuntimeDesktopSurfaceState,
  getChatRuntimePinAccessibilityLabel,
  getChatRuntimeStreamingContentTitle,
  getChatRuntimeToolApprovalDesktopSurfaceState,
  getChatRuntimeToolApprovalInteractionState,
  getChatRuntimeTurnDurationBadgeState,
  getFollowUpInputPresentation,
  getSessionPresentation,
  getSessionStatusDesktopRenderState,
  shouldRenderChatRuntimeActivityStep,
} from "@dotagents/shared/session-presentation"
import {
  formatIndexedToolExecutionLabel,
  formatToolExecutionCompactAccessibilityLabel,
  formatToolExecutionCount,
  getToolExecutionCopyAccessibilityLabel,
  formatToolExecutionDetailsAccessibilityName,
  formatToolExecutionHeading,
  formatToolExecutionSectionLabel,
  formatToolExecutionStructuredPayloadValue,
  getToolExecutionCallDisplayState,
  getToolExecutionCompactDesktopSurfaceState,
  getToolExecutionDetailCopyState,
  getToolExecutionDetailArgumentsState,
  getToolExecutionDetailDesktopSurfaceState,
  getToolExecutionDetailResultState,
  getToolExecutionDisplayState,
  getToolExecutionPayloadValueType,
  getToolExecutionStatusCopyState,
  getToolExecutionStatusDesktopClassName,
  getToolExecutionStructuredPayloadChildEntries,
  type ToolExecutionStructuredPayloadValue,
} from "@dotagents/shared/tool-execution-display"
import { computeTurnDurations, createTurnDurationMessages } from "@dotagents/shared/turn-duration"
import { useNowTick } from "@renderer/lib/turn-duration"

const toolActivityGroupCopy = getToolActivityGroupCopyState()
const desktopToolActivityGroupSurface = getToolActivityGroupDesktopSurfaceState()
const desktopToolExecutionCompactSurface = getToolExecutionCompactDesktopSurfaceState()
const desktopToolExecutionDetailSurface = getToolExecutionDetailDesktopSurfaceState()
const toolExecutionDetailCopy = getToolExecutionDetailCopyState()
const toolExecutionStatusCopy = getToolExecutionStatusCopyState()
const chatMessageActionCopy = getChatMessageActionCopyState()
const desktopChatMessageSurface = getChatMessageDesktopSurfaceState()
const desktopChatMessageActionSurface = getChatMessageActionDesktopSurfaceState()
const desktopRuntimeCopy = getChatRuntimeCopyState()

interface AgentProgressProps {
  progress: AgentProgressUpdate | null
  className?: string
  variant?: "default" | "overlay" | "tile"
  /** For tile variant: whether the tile is focused */
  isFocused?: boolean
  /** For tile variant: callback when tile is clicked */
  onFocus?: () => void
  /** For tile variant: callback to dismiss the tile */
  onDismiss?: () => void
  /** For tile variant: controlled collapsed state */
  isCollapsed?: boolean
  /** For tile variant: callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void
  /** For tile variant: callback when a follow-up message is sent */
  onFollowUpSent?: () => void
  /** For tile variant: show a transient startup state before the real session arrives */
  isFollowUpInputInitializing?: boolean
  /** For tile variant: callback to expand this tile to full view */
  onExpand?: () => void
  /** For tile variant: whether this tile is in expanded/full view mode */
  isExpanded?: boolean
  /** Load the next older chunk when this progress contains a partial history window. */
  onLoadEarlierConversationHistory?: () => void
  /** Whether an older history chunk is currently being loaded. */
  isLoadingEarlierConversationHistory?: boolean
  /** For tile variant: open the in-app voice continuation modal */
  onVoiceContinue?: (options: {
    conversationId?: string
    sessionId?: string
    fromTile: boolean
    continueConversationTitle?: string
    agentName?: string
    onSubmitted?: () => void
  }) => void
}

const desktopRuntimeSurface = getChatRuntimeDesktopSurfaceState()
const desktopScrollToBottomSurface = desktopRuntimeSurface.scrollToBottom
const desktopKillSwitchDialogSurface = desktopRuntimeSurface.killSwitchDialog
const desktopRetryStatusSurface = desktopRuntimeSurface.retryStatus
const desktopStreamingContentSurface = desktopRuntimeSurface.streamingContent
const desktopDelegationConversationMessageSurface = desktopRuntimeSurface.delegationConversationMessage
const desktopDelegationBubbleSurface = desktopRuntimeSurface.delegationBubble
const desktopDelegationConversationPanelSurface = desktopRuntimeSurface.delegationConversationPanel
type DelegationConversationMessageTone = keyof typeof desktopDelegationConversationMessageSurface.roleClassNames

const CONVERSATION_HISTORY_PAGE_SIZE =
  desktopRuntimeSurface.conversationHistoryBanner.pageSize

// Enhanced conversation message component

// Types for unified tool execution display items
type DisplayItem =
  | { kind: "message"; id: string; data: {
      role: "user" | "assistant" | "tool"
      content: string
      isComplete: boolean
      timestamp: number
      isThinking: boolean
      isAssistantThought?: boolean
      toolCalls?: Array<{ name: string; arguments: any }>
      toolResults?: Array<{ success: boolean; content: string; error?: string }>
      responseEvent?: AgentUserResponseEvent
      /** Absolute raw-history index to use when branching from this message */
      branchMessageIndex?: number
    } }
  | { kind: "tool_execution"; id: string; data: {
      timestamp: number
      calls: Array<{ name: string; arguments: any }>
      results: Array<{ success: boolean; content: string; error?: string }>
    } }
  | { kind: "assistant_with_tools"; id: string; data: {
      thought: string
      timestamp: number
      isComplete: boolean
      calls: Array<{ name: string; arguments: any }>
      results: Array<{ success: boolean; content: string; error?: string } | undefined>
      executionStats?: {
        durationMs?: number
        totalTokens?: number
        model?: string
      }
    } }
  | { kind: "tool_approval"; id: string; data: {
      approvalId: string
      toolName: string
      arguments: any
    } }
  | { kind: "retry_status"; id: string; data: AgentRetryInfo }
  | { kind: "streaming"; id: string; data: {
      text: string
      isStreaming: boolean
      isPlaceholder?: boolean
    } }
  | { kind: "delegation"; id: string; data: ACPDelegationProgress }
  | { kind: "tool_activity_group"; id: string; data: {
      /** The original DisplayItems that were collapsed into this group. */
      items: DisplayItem[]
      /** Short single-line preview strings for the collapsed tool group. */
      previewLines: string[]
      /** Total number of underlying tool calls across all collapsed items. */
      callCount: number
    } }

type SessionModelInfo = NonNullable<AgentProgressUpdate["modelInfo"]>

const getAgentProviderId = (config: Config | undefined): CHAT_PROVIDER_ID => resolveAgentProviderId(config)

const getConfiguredAgentModel = (config: Config | undefined, providerId: CHAT_PROVIDER_ID): string =>
  resolveConfiguredAgentModel(config, providerId)

const getModelDisplayName = (model: string): string => model.split("/").pop() || model

const SessionModelPicker: React.FC<{
  modelInfo?: SessionModelInfo
  compact?: boolean
}> = ({ modelInfo, compact = false }) => {
  const configQuery = useConfigQuery()
  const config = configQuery.data
  const providerId = getAgentProviderId(config)
  const configuredModel = getConfiguredAgentModel(config, providerId)
  const sessionModel = modelInfo?.model
  const currentValue = configuredModel || sessionModel || AGENT_MODEL_FALLBACKS[providerId]
  const providerLabel = modelInfo?.provider || getActiveModelPreset(config)?.name || providerId
  const modelsQuery = useAvailableModelsQuery(providerId, !!providerId, providerId === "openai" ? config?.currentModelPresetId || DEFAULT_MODEL_PRESET_ID : undefined)
  const modelOptions = useMemo(() => {
    const options = [...(modelsQuery.data || [])]
    if (currentValue && !options.some((model) => model.id === currentValue)) {
      options.unshift({ id: currentValue, name: getModelDisplayName(currentValue) })
    }
    return options
  }, [currentValue, modelsQuery.data])

  const handleModelChange = useCallback(async (modelId: string) => {
    if (!config || modelId === currentValue) return
    try {
      await desktopConfigClient.saveConfig({
        ...config,
        ...buildAgentModelConfigUpdates(config as AgentModelConfigLike, providerId, modelId),
      } as Config)
      await queryClient.invalidateQueries({ queryKey: ["config"] })
      await queryClient.invalidateQueries({ queryKey: ["available-models"] })
      toast.success(desktopRuntimeCopy.modelControls.model.updatedToast)
    } catch (error) {
      console.error(`${desktopRuntimeCopy.modelControls.model.updateFailedLogPrefix}:`, error)
      toast.error(desktopRuntimeCopy.modelControls.model.updateFailedToast)
    }
  }, [config, currentValue, providerId])

  if (!currentValue) return null

  return (
    <Select value={currentValue} onValueChange={handleModelChange} disabled={!config}>
      <SelectTrigger
        className={cn(
          "h-auto min-w-0 max-w-full border-0 bg-transparent p-0 text-muted-foreground/80 shadow-none hover:text-foreground focus:ring-0 focus:ring-offset-0 data-[state=open]:text-foreground [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3",
          compact ? "max-w-[150px] text-[10px]" : "max-w-[170px] text-[10px]",
        )}
        title={formatChatRuntimeModelPickerTitle(providerLabel, currentValue)}
        aria-label={desktopRuntimeCopy.modelControls.model.changeAccessibilityLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <SelectValue>
          <span className="block min-w-0 truncate">
            {providerLabel}/{getModelDisplayName(currentValue)}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px] min-w-[260px]" onClick={(event) => event.stopPropagation()}>
        {modelOptions.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <span className="truncate">{model.name || model.id}</span>
          </SelectItem>
        ))}
        {modelsQuery.isLoading && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {desktopRuntimeCopy.modelControls.model.loadingLabel}
          </div>
        )}
        {modelOptions.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            {desktopRuntimeCopy.modelControls.model.emptyLabel}
          </div>
        )}
      </SelectContent>
    </Select>
  )
}

const providerSupportsThinking = (providerId: CHAT_PROVIDER_ID): boolean =>
  providerId === "openai" || providerId === "chatgpt-web"

const providerSupportsVerbosity = (providerId: CHAT_PROVIDER_ID): boolean =>
  providerId === "chatgpt-web"

const SessionThinkingPicker: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const configQuery = useConfigQuery()
  const config = configQuery.data
  const providerId = getAgentProviderId(config)

  const currentValue: OpenAiReasoningEffort = (config?.openaiReasoningEffort as OpenAiReasoningEffort | undefined) ||
    getOpenAiReasoningEffortDefault(providerId)

  const handleChange = useCallback(async (value: string) => {
    if (!config || value === currentValue) return
    try {
      await desktopConfigClient.saveConfig({
        ...config,
        openaiReasoningEffort: value as OpenAiReasoningEffort,
      })
      await queryClient.invalidateQueries({ queryKey: ["config"] })
      toast.success(desktopRuntimeCopy.modelControls.thinking.updatedToast)
    } catch (error) {
      console.error(`${desktopRuntimeCopy.modelControls.thinking.updateFailedLogPrefix}:`, error)
      toast.error(desktopRuntimeCopy.modelControls.thinking.updateFailedToast)
    }
  }, [config, currentValue])

  if (!providerSupportsThinking(providerId)) return null

  const currentLabel = OPENAI_REASONING_EFFORT_OPTIONS.find((o) => o.value === currentValue)?.label || currentValue

  return (
    <Select value={currentValue} onValueChange={handleChange} disabled={!config}>
      <SelectTrigger
        className={cn(
          "h-auto min-w-0 max-w-full border-0 bg-transparent p-0 text-muted-foreground/80 shadow-none hover:text-foreground focus:ring-0 focus:ring-offset-0 data-[state=open]:text-foreground [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3",
          compact ? "text-[10px]" : "text-[10px]",
        )}
        title={formatChatRuntimeThinkingPickerTitle(currentLabel)}
        aria-label={desktopRuntimeCopy.modelControls.thinking.changeAccessibilityLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <SelectValue>
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Brain className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{currentLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[160px]" onClick={(event) => event.stopPropagation()}>
        {OPENAI_REASONING_EFFORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const SessionVerbosityPicker: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const configQuery = useConfigQuery()
  const config = configQuery.data
  const providerId = getAgentProviderId(config)

  const currentValue: CodexTextVerbosity = (config?.codexTextVerbosity as CodexTextVerbosity | undefined) || DEFAULT_CODEX_TEXT_VERBOSITY

  const handleChange = useCallback(async (value: string) => {
    if (!config || value === currentValue) return
    try {
      await desktopConfigClient.saveConfig({
        ...config,
        codexTextVerbosity: value as CodexTextVerbosity,
      })
      await queryClient.invalidateQueries({ queryKey: ["config"] })
      toast.success(desktopRuntimeCopy.modelControls.verbosity.updatedToast)
    } catch (error) {
      console.error(`${desktopRuntimeCopy.modelControls.verbosity.updateFailedLogPrefix}:`, error)
      toast.error(desktopRuntimeCopy.modelControls.verbosity.updateFailedToast)
    }
  }, [config, currentValue])

  if (!providerSupportsVerbosity(providerId)) return null

  const currentLabel = CODEX_TEXT_VERBOSITY_OPTIONS.find((o) => o.value === currentValue)?.label || currentValue

  return (
    <Select value={currentValue} onValueChange={handleChange} disabled={!config}>
      <SelectTrigger
        className={cn(
          "h-auto min-w-0 max-w-full border-0 bg-transparent p-0 text-muted-foreground/80 shadow-none hover:text-foreground focus:ring-0 focus:ring-offset-0 data-[state=open]:text-foreground [&>svg]:ml-1 [&>svg]:h-3 [&>svg]:w-3",
          compact ? "text-[10px]" : "text-[10px]",
        )}
        title={formatChatRuntimeVerbosityPickerTitle(currentLabel)}
        aria-label={desktopRuntimeCopy.modelControls.verbosity.changeAccessibilityLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <SelectValue>
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Volume2 className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{currentLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[160px]" onClick={(event) => event.stopPropagation()}>
        {CODEX_TEXT_VERBOSITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const StructuredPayloadTree: React.FC<{
  value: ToolExecutionStructuredPayloadValue
  textClassName: string
  maxHeightClassName: string
}> = ({ value, textClassName, maxHeightClassName }) => {
  const childEntries = getToolExecutionStructuredPayloadChildEntries(value.value)
  if (childEntries.length === 0) {
    return (
      <div className={cn(desktopToolExecutionDetailSurface.structuredPayloadTreeEmptyClassName, textClassName)}>
        {value.compactText}
      </div>
    )
  }

  return (
    <div className={cn(desktopToolExecutionDetailSurface.structuredPayloadTreeContainerClassName, maxHeightClassName)}>
      <div className={desktopToolExecutionDetailSurface.structuredPayloadTreeListClassName}>
        {childEntries.map((entry) => (
          <div key={entry.key} className={desktopToolExecutionDetailSurface.structuredPayloadTreeEntryClassName}>
            <span className={desktopToolExecutionDetailSurface.structuredPayloadTreeEntryLabelClassName} title={entry.label}>
              {entry.label}
            </span>
            <div className={desktopToolExecutionDetailSurface.structuredPayloadTreeEntryValueClassName}>
              <StructuredPayloadValueBlock
                value={formatToolExecutionStructuredPayloadValue(entry.value)}
                textClassName={textClassName}
                maxHeightClassName={maxHeightClassName}
                nested
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const StructuredPayloadValueBlock: React.FC<{
  value: ToolExecutionStructuredPayloadValue
  textClassName: string
  maxHeightClassName: string
  nested?: boolean
}> = ({ value, textClassName, maxHeightClassName, nested = false }) => {
  if (value.isCollapsible) {
    return (
      <details className={desktopToolExecutionDetailSurface.structuredPayloadDetailsClassName} onClick={(event) => event.stopPropagation()}>
        <summary className={cn(
          desktopToolExecutionDetailSurface.structuredPayloadSummaryClassName,
          nested
            ? desktopToolExecutionDetailSurface.structuredPayloadNestedSpacingClassName
            : desktopToolExecutionDetailSurface.structuredPayloadDefaultSpacingClassName,
          textClassName,
        )}>
          <ChevronRight className={desktopToolExecutionDetailSurface.structuredPayloadToggleIconClassName} />
          <span className={desktopToolExecutionDetailSurface.structuredPayloadSummaryTextClassName} title={value.compactText}>{value.compactText}</span>
          <span className={desktopToolExecutionDetailSurface.structuredPayloadLineCountClassName}>{value.lineCount} lines</span>
        </summary>
        {value.isStructured ? (
          <StructuredPayloadTree value={value} maxHeightClassName={maxHeightClassName} textClassName={textClassName} />
        ) : (
          <div className={cn(
            desktopToolExecutionDetailSurface.structuredPayloadExpandedBlockClassName,
            maxHeightClassName,
            textClassName,
          )}>
            {value.expandedText}
          </div>
        )}
      </details>
    )
  }

  if (value.isStructured) {
    return (
      <div className={cn(
        desktopToolExecutionDetailSurface.structuredPayloadInlineClassName,
        nested
          ? desktopToolExecutionDetailSurface.structuredPayloadNestedSpacingClassName
          : desktopToolExecutionDetailSurface.structuredPayloadDefaultSpacingClassName,
        textClassName,
      )}>
        {value.compactText}
      </div>
    )
  }

  if (value.isBlock) {
    return (
      <div className={cn(
        desktopToolExecutionDetailSurface.structuredPayloadBlockClassName,
        nested
          ? desktopToolExecutionDetailSurface.structuredPayloadNestedSpacingClassName
          : desktopToolExecutionDetailSurface.structuredPayloadBlockDefaultSpacingClassName,
        maxHeightClassName,
        textClassName,
      )}>
        {value.expandedText}
      </div>
    )
  }

  return (
    <div className={cn(
      desktopToolExecutionDetailSurface.structuredPayloadInlineClassName,
      nested
        ? desktopToolExecutionDetailSurface.structuredPayloadNestedSpacingClassName
        : desktopToolExecutionDetailSurface.structuredPayloadDefaultSpacingClassName,
      textClassName,
    )}>
      {value.expandedText}
    </div>
  )
}

const StructuredToolPayload: React.FC<{
  payload: unknown
  variant?: "default" | "approval"
  tone?: "neutral" | "success" | "error"
  maxHeightClassName?: string
}> = ({ payload, variant = "default", tone = "neutral", maxHeightClassName = "max-h-48" }) => {
  const entries = getToolArgumentEntries(payload)
  const formattedFallback = entries.length === 0 ? formatToolExecutionStructuredPayloadValue(payload, formatToolArguments(payload)) : null
  const isApproval = variant === "approval"
  const payloadTone = isApproval ? "approval" : tone
  const fallbackToneClass = desktopToolExecutionDetailSurface.structuredPayloadFallbackToneClassNames[payloadTone]
  const entryToneClass = desktopToolExecutionDetailSurface.structuredPayloadEntryToneClassNames[payloadTone]
  const entryHeaderBorderClass = desktopToolExecutionDetailSurface.structuredPayloadEntryHeaderBorderClassNames[payloadTone]
  const entryTextClass = desktopToolExecutionDetailSurface.structuredPayloadEntryTextClassNames[payloadTone]

  if (entries.length === 0) {
    if (!formattedFallback?.expandedText) return null
    return (
      <div className={cn(desktopToolExecutionDetailSurface.structuredPayloadFallbackBaseClassName, fallbackToneClass)} onClick={(event) => event.stopPropagation()}>
        <StructuredPayloadValueBlock
          value={formattedFallback}
          maxHeightClassName={maxHeightClassName}
          textClassName=""
        />
      </div>
    )
  }

  return (
    <div className={desktopToolExecutionDetailSurface.structuredPayloadEntryListClassName} onClick={(event) => event.stopPropagation()}>
      {entries.map(({ key, value }) => {
        const formattedValue = formatToolExecutionStructuredPayloadValue(value)
        return (
          <div
            key={key}
            className={cn(
              desktopToolExecutionDetailSurface.structuredPayloadEntryBaseClassName,
              entryToneClass,
            )}
          >
            <div className={cn(
              desktopToolExecutionDetailSurface.structuredPayloadEntryHeaderClassName,
              entryHeaderBorderClass,
            )}>
              <span className={desktopToolExecutionDetailSurface.structuredPayloadEntryKeyClassName}>{key}</span>
              <span className={desktopToolExecutionDetailSurface.structuredPayloadEntryTypeClassName}>{getToolExecutionPayloadValueType(value)}</span>
            </div>
            <StructuredPayloadValueBlock
              value={formattedValue}
              maxHeightClassName={maxHeightClassName}
              textClassName={entryTextClass}
            />
          </div>
        )
      })}
    </div>
  )
}

function extractRespondToUserResponsesFromMessages(
  messages: Array<{
    role: "user" | "assistant" | "tool"
    timestamp?: number
    toolCalls?: Array<{ name: string; arguments: unknown }>
  }>,
): AgentUserResponseEvent[] {
  return extractRespondToUserResponseEvents(messages, { idPrefix: "desktop-history" })
}

function messageStableId(message: { timestamp: number; role: string }): string {
  return `${message.timestamp}-${message.role}`
}

function shouldAutoPlayTTSForVariant(
  _variant: "default" | "overlay" | "tile",
  isSnoozed: boolean,
): boolean {
  // TTS playback ownership is centralized in the main renderer, so focus no
  // longer decides whether a tile may request auto-play. The central
  // coordinator prevents duplicate/overlapping speech. Snoozed/background
  // sessions stay quiet until they are unsnoozed/revealed.
  return !isSnoozed
}

function normalizeProgressVariant(variant: string): "default" | "overlay" | "tile" {
  return variant === "overlay" || variant === "tile" ? variant : "default"
}

function hasActiveTextSelection(container?: HTMLElement | null): boolean {
  if (typeof window === "undefined") return false

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false
  }

  if (!container) return true

  return (
    (!!selection.anchorNode && container.contains(selection.anchorNode)) ||
    (!!selection.focusNode && container.contains(selection.focusNode))
  )
}

type CompactMessageProps = {
  message: {
    role: "user" | "assistant" | "tool"
    content: string
    isComplete?: boolean
    isThinking?: boolean
    isAssistantThought?: boolean
    toolCalls?: Array<{ name: string; arguments: any }>
    toolResults?: Array<{ success: boolean; content: string; error?: string }>
    timestamp: number
    responseEvent?: AgentUserResponseEvent
  }
  ttsText?: string
  isLast: boolean
  isComplete: boolean
  hasErrors: boolean
  wasStopped?: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  /** Variant controls TTS presentation; focus does not gate centralized auto-play. */
  variant?: "default" | "overlay" | "tile"
  /** Focused session tiles are the primary conversation surface for layout/scrolling. */
  isFocused?: boolean
  /** Session ID for tracking TTS playback across remounts */
  sessionId?: string
  /** Snoozed/background sessions must not auto-play TTS */
  isSnoozed?: boolean
  /** True when the parent session surface observed this run while it was live. */
  parentObservedLiveProgress?: boolean
  /** Conversation ID for branching */
  conversationId?: string
  /** Absolute raw-history index to use when branching from this message */
  branchMessageIndex?: number
  /** Per-turn agent duration (user → final assistant), in ms. Only set on user messages. */
  turnDurationMs?: number
  /** True when the per-turn duration is still ticking live. */
  turnIsLive?: boolean
}

// Compact message component for space efficiency
const CompactMessageBase: React.FC<CompactMessageProps> = ({ message, ttsText, isLast, isComplete, hasErrors, wasStopped = false, isExpanded, onToggleExpand, variant = "default", isFocused = false, sessionId, isSnoozed = false, parentObservedLiveProgress = false, conversationId, branchMessageIndex, turnDurationMs, turnIsLive }) => {
  const messageVariant = normalizeProgressVariant(variant)
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null)
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()
  // Track the TTS keys currently being generated, so we can clean them up on unmount.
  const inFlightTtsKeysRef = useRef<string[]>([])
  // Track the last ttsSource that was successfully auto-played to prevent replay on follow-up messages
  const lastAutoPlayedSourceRef = useRef<string | null>(null)
  // Track whether this message instance, or its parent session surface, ever observed
  // the agent in a non-complete state. Final assistant messages can be created only
  // after completion, so parentObservedLiveProgress keeps live-session final replies
  // eligible for autoplay while reopened history still stays quiet.
  const observedLiveProgressRef = useRef(false)
  const configQuery = useConfigQuery()

  // Cleanup copy timeout on unmount
  // NOTE: We intentionally do NOT remove TTS tracking keys on unmount.
  // The module-level tracking set must persist across remounts (e.g., when
  // switching between single-session and multi-session views in the panel)
  // to prevent double TTS playback. Keys are removed only:
  // - On generation failure (by the .catch() handler)
  // - On session dismiss (by clearSessionTTSTracking)
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const messageDisplayState = getChatMessageDisplayState(message, {
    collapseAssistantWithToolMetadata: true,
  })
  const effectiveContent = messageDisplayState.visibleContent
  const messageBranchAction = getChatRuntimeBranchActionState({
    conversationId,
    role: message.role,
    branchMessageIndex,
  })
  const resolvedBranchMessageIndex = messageBranchAction.messageIndex
  const messageBranchAccessibilityLabel = getChatRuntimeBranchActionAccessibilityLabel(messageBranchAction)
  const messageBranchTitle = getChatRuntimeBranchActionTitle()
  const messageCopyAction = getChatMessageCopyActionState({
    role: message.role,
    content: effectiveContent,
    isAssistantComplete: isComplete,
    isCopied,
  })
  const messageCopyAccessibilityLabel = getChatMessageCopyActionAccessibilityLabel(messageCopyAction)
  const messageCopyTitle = getChatMessageCopyActionTitle(messageCopyAction)

  // Copy to clipboard handler
  const handleCopyResponse = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await copyTextToClipboard(effectiveContent)
      setIsCopied(true)
      // Clear any existing timeout before setting a new one
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(
        () => setIsCopied(false),
        chatMessageActionCopy.copy.feedbackResetDelayMs,
      )
    } catch (err) {
      console.error("Failed to copy response:", err)
    }
  }

  // Branch conversation from this message
  const handleBranchFromMessage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!conversationId || resolvedBranchMessageIndex == null) return
    try {
      const branched = await desktopConversationsClient.branchConversation(conversationId, resolvedBranchMessageIndex)
      if (branched) {
        queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
        navigate(`/${branched.id}`)
        toast.success(desktopRuntimeCopy.branch.successToast)
      } else {
        toast.error(desktopRuntimeCopy.branch.failedMessage)
      }
    } catch (err) {
      console.error(`${desktopRuntimeCopy.branch.failedMessage}:`, err)
      toast.error(desktopRuntimeCopy.branch.failedMessage)
    }
  }, [conversationId, navigate, resolvedBranchMessageIndex])

  const visibleMessageToolEntries = messageDisplayState.visibleToolEntries
  const displayToolCalls = visibleMessageToolEntries.map(({ toolCall }) => toolCall)
  const displayResults = visibleMessageToolEntries.flatMap(({ result }) => {
    if (!result) return []

    return (result.error && result.error.trim().length > 0) ||
      (result.content && result.content.trim().length > 0)
      ? [result]
      : []
  })
  const hasExtras = displayToolCalls.length > 0 || displayResults.length > 0
  const shouldCollapse = messageDisplayState.shouldCollapse
  const messageExpansionAction = getChatMessageExpansionActionState({
    shouldCollapse,
    isExpanded,
  })
  const messageExpansionAccessibilityLabel = getChatMessageExpansionActionAccessibilityLabel(messageExpansionAction)
  const messageExpansionTitle = getChatMessageExpansionActionTitle(messageExpansionAction)

  // Track the computed ttsSource (ttsText || effectiveContent) since that's what determines the
  // ttsKey and should also gate async state updates.
  const ttsSource = sanitizeMessageContentForSpeech(ttsText || effectiveContent)
  const latestTtsSourceRef = useRef(ttsSource)
  latestTtsSourceRef.current = ttsSource
  const ttsGenerationIdRef = useRef(0)

  // TTS functionality
  const generateAudio = async (): Promise<{ audio: ArrayBuffer; mimeType: string }> => {
    if (!(configQuery.data?.ttsEnabled ?? DEFAULT_TTS_ENABLED)) {
      logUI("[AgentProgress][TTS] generateAudio blocked because TTS disabled", {
        playbackId,
        sessionId,
        textPreview: ttsSource.slice(0, 80),
      })
      throw new Error("TTS is not enabled")
    }

    const generationId = ++ttsGenerationIdRef.current
    const generationSource = ttsSource

    setIsGeneratingAudio(true)
    setTtsError(null)

    try {
      logUI("[AgentProgress][TTS] generateSpeech start", {
        playbackId,
        sessionId,
        generationId,
        textLength: generationSource.length,
        textPreview: generationSource.slice(0, 80),
      })
      const result = await desktopTtsClient.generateSpeech({
        text: generationSource,
      })
      logUI("[AgentProgress][TTS] generateSpeech success", {
        playbackId,
        sessionId,
        generationId,
        mimeType: result.mimeType,
        audioByteLength: result.audio?.byteLength,
      })

      // Ignore stale completions if the TTS source changed while this request was in-flight.
      if (
        ttsGenerationIdRef.current !== generationId ||
        latestTtsSourceRef.current !== generationSource
      ) {
        logUI("[AgentProgress][TTS] generateSpeech result is stale", {
          playbackId,
          sessionId,
          generationId,
          currentGenerationId: ttsGenerationIdRef.current,
          latestTextPreview: latestTtsSourceRef.current.slice(0, 80),
        })
        return { audio: result.audio, mimeType: result.mimeType }
      }

      setAudioData(result.audio)
      setAudioMimeType(result.mimeType)
      return { audio: result.audio, mimeType: result.mimeType }
    } catch (error) {
      console.error("[TTS UI] Failed to generate TTS audio:", error)
      logUI("[AgentProgress][TTS] generateSpeech failed", {
        playbackId,
        sessionId,
        generationId,
        error: error instanceof Error ? error.message : String(error),
      })

      // Set user-friendly error message
      let errorMessage = "Failed to generate audio"
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "TTS API key not configured"
        } else if (error.message.includes("terms acceptance")) {
          errorMessage = "Groq TTS model requires terms acceptance. Visit the Groq Playground with the model selected to accept terms."
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Rate limit exceeded. Please try again later"
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection"
        } else if (error.message.includes("validation")) {
          errorMessage = "Text content is not suitable for TTS"
        } else {
          errorMessage = `TTS error: ${error.message}`
        }
      }

      // Only surface the error if this is still the latest generation for the current source.
      if (
        ttsGenerationIdRef.current === generationId &&
        latestTtsSourceRef.current === generationSource
      ) {
        setTtsError(errorMessage)
      }
      throw error
    } finally {
      // Only clear the spinner for the latest in-flight request.
      if (ttsGenerationIdRef.current === generationId) {
        setIsGeneratingAudio(false)
      }
    }
  }

  // Invalidate cached audio when the TTS source text changes (e.g. via a later progress merge)
  // so stale audio from a previous text is never played alongside the new text.
  const prevTtsSourceRef = useRef(ttsSource)
  useEffect(() => {
    if (prevTtsSourceRef.current !== ttsSource) {
      prevTtsSourceRef.current = ttsSource
      setAudioData(null)
      setAudioMimeType(null)
    }
  }, [ttsSource])

  // Detect whether this message component has observed the parent agent in a
  // non-complete state. The parent session also passes a session-level signal
  // for final messages that only mount after completion.
  useEffect(() => {
    if (!isComplete) {
      observedLiveProgressRef.current = true
    }
  }, [isComplete])
  const hasObservedLiveProgress = observedLiveProgressRef.current || parentObservedLiveProgress || !isComplete

  const isThoughtEligibleForTTS = !!message.responseEvent

  // Check if TTS button should be shown for this message. The overall session
  // can remain incomplete briefly after the final assistant prose is visible
  // (e.g. verification/title cleanup). Treat the latest non-thinking assistant
  // text as TTS-eligible immediately so hiding/snoozing the panel after seeing
  // the answer does not race ahead of autoplay. Provider thinking/thought blocks
  // stay silent by default; they should only become speakable via an explicit
  // user-facing response event or a future opt-in setting.
  const canUseTTSForAssistantMessage =
    isComplete ||
    !!message.responseEvent ||
    message.isComplete ||
    (isLast && !message.isThinking && (!message.isAssistantThought || isThoughtEligibleForTTS))
  const messageSpeechAction = getChatMessageSpeechActionState({
    role: message.role,
    content: ttsSource,
    ttsEnabled: configQuery.data?.ttsEnabled ?? DEFAULT_TTS_ENABLED,
    isThinking: message.isThinking,
    isAssistantThought: message.isAssistantThought,
    isThoughtEligibleForSpeech: isThoughtEligibleForTTS,
    isAssistantEligible: canUseTTSForAssistantMessage,
  })
  const shouldShowTTSButton = messageSpeechAction.canSpeak
  const messageTurnDurationBadgeState = getChatRuntimeTurnDurationBadgeState({
    scope: "message",
    role: message.role,
    durationMs: turnDurationMs,
    isLive: Boolean(turnIsLive),
  })
  // Auto-play only the latest assistant message. Older response-linked messages
  // remain manually replayable but should not all auto-play after reload/remount.
  const shouldAutoPlayTTS = shouldShowTTSButton && isLast
  const ttsKeys = useMemo(() => [
    message.responseEvent ? buildResponseEventTTSKey(sessionId, message.responseEvent.id, "final") : null,
    buildContentTTSKey(sessionId, ttsSource, "final"),
  ].filter((key, index, arr): key is string => Boolean(key) && arr.indexOf(key) === index), [message.responseEvent, sessionId, ttsSource])
  const playbackId = `agent-progress:${sessionId ?? "no-session"}:${message.responseEvent?.id ?? message.timestamp}`
  const shouldAutoPlayLoadedAudio =
    shouldAutoPlayTTS &&
    shouldAutoPlayTTSForVariant(messageVariant, isSnoozed) &&
    (configQuery.data?.ttsAutoPlay ?? DEFAULT_TTS_AUTO_PLAY) &&
    !ttsKeys.some((key) => hasTTSPlayed(key)) &&
    lastAutoPlayedSourceRef.current === ttsSource

  // Auto-play TTS when assistant message completes (but NOT if agent was stopped by kill switch)
  //
  // TTS AUTO-PLAY STRATEGY:
  // - Auto-play in the primary full conversation, overlay, and tile surfaces.
  // - Tile focus is layout state only; it does not block auto-play requests.
  // - Snoozed sessions intentionally don't auto-play TTS
  //   (they run silently in background - user can unsnooze to see/hear them)
  // - Additionally, we track which sessions have already played TTS in a module-level set
  //   to prevent double playback when AgentProgress remounts (e.g., when switching between
  //   single-session and multi-session views in the panel)
  useEffect(() => {
    const shouldAutoPlay = shouldAutoPlayTTSForVariant(messageVariant, isSnoozed)
    const ttsAutoPlayEnabled = configQuery.data?.ttsAutoPlay ?? DEFAULT_TTS_AUTO_PLAY

    if (!shouldAutoPlay || !shouldAutoPlayTTS || !ttsAutoPlayEnabled || audioData || isGeneratingAudio || ttsError || wasStopped) {
      logUI("[AgentProgress][TTS] autoplay skipped by initial gate", {
        playbackId,
        sessionId,
        shouldAutoPlay,
        shouldAutoPlayTTS,
        ttsAutoPlayEnabled,
        hasAudioData: !!audioData,
        isGeneratingAudio,
        hasTtsError: !!ttsError,
        wasStopped,
        messageVariant,
        isSnoozed,
        isFocused,
      })
      return undefined
    }

    // Synthetic pending-resume tiles render saved conversation history before a
    // live session exists (e.g. after branching). The last assistant message is
    // historical, so auto-playing its TTS would replay an already-heard response.
    if (sessionId?.startsWith("pending-")) {
      logUI("[AgentProgress][TTS] autoplay skipped for pending session", { playbackId, sessionId })
      return undefined
    }

    // Reopening a previous session re-renders its last assistant message with
    // `isComplete=true` from the first render. Treat as historical when neither
    // the message nor its parent session surface observed live progress. Manual
    // TTS playback remains available via the play button. The speakOnTrigger path
    // explicitly authorizes one auto-play via markSessionForcedAutoPlay, which we
    // consume here so the historical guard does not suppress that flow.
    let forced = false
    if (!hasObservedLiveProgress) {
      forced = sessionId ? consumeSessionForcedAutoPlay(sessionId) : false
      if (!forced) {
        logUI("[AgentProgress][TTS] autoplay skipped for historical complete mount", {
          playbackId,
          sessionId,
          observedLiveProgress: hasObservedLiveProgress,
          parentObservedLiveProgress,
        })
        return undefined
      }
      logUI("[AgentProgress][TTS] forced autoplay consumed", { playbackId, sessionId })
    }

    // Guard against replaying the same content on follow-up user messages.
    // When a user sends a follow-up, the message list re-evaluates and this effect
    // can re-fire even though the agent response hasn't changed. (fixes #72)
    if (ttsSource && lastAutoPlayedSourceRef.current === ttsSource) {
      logUI("[AgentProgress][TTS] autoplay skipped because source already auto-played locally", {
        playbackId,
        sessionId,
        textPreview: ttsSource.slice(0, 80),
      })
      return undefined
    }

    // If this response was already spoken from a mid-turn card or an earlier render, skip.
    if (ttsKeys.some((key) => hasTTSPlayed(key))) {
      logUI("[AgentProgress][TTS] autoplay skipped because local TTS key already played", {
        playbackId,
        sessionId,
        ttsKeys,
      })
      return undefined
    }

    logUI("[AgentProgress][TTS] claiming central autoplay keys", {
      playbackId,
      sessionId,
      forced,
      ttsKeys,
      textPreview: ttsSource.slice(0, 80),
    })
    void desktopTtsClient.claimPlaybackKeys({ ttsKeys, sessionId, forced })
      .then((claimResult: { claimed: boolean }) => {
        logUI("[AgentProgress][TTS] central autoplay claim result", {
          playbackId,
          sessionId,
          forced,
          claimed: claimResult?.claimed,
        })
        if (!claimResult?.claimed) return undefined

        // Mark as playing before starting generation to prevent renderer-local rerender races.
        if (ttsKeys.length > 0) {
          ttsKeys.forEach((key) => markTTSPlayed(key))
          inFlightTtsKeysRef.current = ttsKeys
        }

        // Track the source we're auto-playing to prevent replay on follow-up.
        lastAutoPlayedSourceRef.current = ttsSource

        return generateAudio()
      })
      .then((generated) => {
        if (!generated) return undefined
        if (latestTtsSourceRef.current !== ttsSource) {
          logUI("[AgentProgress][TTS] releasing generated autoplay because source became stale", {
            playbackId,
            sessionId,
            ttsKeys,
          })
          void desktopTtsClient.releasePlaybackKeys({ ttsKeys })
          ttsKeys.forEach((key) => removeTTSKey(key))
          inFlightTtsKeysRef.current = []
          if (lastAutoPlayedSourceRef.current === ttsSource) {
            lastAutoPlayedSourceRef.current = null
          }
          return undefined
        }

        // Generation succeeded, clear the in-flight ref (keys stay claimed centrally)
        inFlightTtsKeysRef.current = []
        logUI("[AgentProgress][TTS] autoplay generation ready for playback request", {
          playbackId,
          sessionId,
          mimeType: generated.mimeType,
          audioByteLength: generated.audio.byteLength,
        })

        return desktopTtsClient.requestPlayback({
          playbackId,
          sourceWindowId: typeof window !== "undefined" ? window.location?.pathname || "renderer" : "renderer",
          source: messageVariant,
          sessionId,
          ttsKeys,
          text: ttsSource,
          textPreview: ttsSource.slice(0, 120),
          audio: generated.audio,
          mimeType: generated.mimeType,
          autoPlay: true,
          audioOutputDeviceId: configQuery.data?.audioOutputDeviceId,
        })
          .then((result) => {
            if (result?.success === false) {
              throw new Error(result.error || "Failed to request autoplay playback")
            }
            logUI("[AgentProgress][TTS] autoplay requestPlayback success", {
              playbackId,
              sessionId,
              source: messageVariant,
            })
            return undefined
          })
      })
      .catch((error) => {
        logUI("[AgentProgress][TTS] autoplay generation promise failed", {
          playbackId,
          sessionId,
          ttsKeys,
          error: error instanceof Error ? error.message : String(error),
        })
        // If generation fails, remove from the set so user can retry
        // Only remove if these are still the in-flight keys (prevents race conditions
        // where a newer render re-added the keys and this old catch handler would delete them).
        if (
          ttsKeys.length > 0 &&
          inFlightTtsKeysRef.current.length === ttsKeys.length &&
          inFlightTtsKeysRef.current.every((key) => ttsKeys.includes(key))
        ) {
          void desktopTtsClient.releasePlaybackKeys({ ttsKeys })
          ttsKeys.forEach((key) => removeTTSKey(key))
          inFlightTtsKeysRef.current = []
        }
        // Clear the auto-played source so the user can retry
        if (lastAutoPlayedSourceRef.current === ttsSource) {
          lastAutoPlayedSourceRef.current = null
        }
        // Error is already handled in generateAudio function
      })
  }, [shouldAutoPlayTTS, configQuery.data?.ttsAutoPlay, audioData, isGeneratingAudio, isFocused, isSnoozed, ttsError, wasStopped, messageVariant, sessionId, ttsSource, message.responseEvent, ttsKeys, hasObservedLiveProgress, parentObservedLiveProgress])

  const getRoleStyle = () => {
    const tone = getChatMessageDisplayTone({
      role: message.role,
      isComplete,
      isLast,
      hasErrors,
    })
    return getChatMessageToneDesktopClassName(tone)
  }

  const handleToggleExpand = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!shouldCollapse || hasActiveTextSelection(event.currentTarget)) {
      return
    }

    const target = event.target
    if (
      target &&
      typeof (target as HTMLElement).closest === "function" &&
      (target as HTMLElement).closest("button, a, input, textarea, select, [role='button']")
    ) {
      return
    }

    onToggleExpand()
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the message click
    onToggleExpand()
  }

  const messageContentRenderState = getChatMessageContentRenderState({
    content: effectiveContent,
    isExpanded,
    shouldCollapse,
  })
  const shouldToggleFromContentClick = messageContentRenderState.isCollapsed
  const messageActionAvailabilityRenderState = getChatMessageActionAvailabilityRenderState({
    turnDuration: messageTurnDurationBadgeState.canShow,
    speech: isTTSPlaying || isGeneratingAudio,
    branch: messageBranchAction.canBranch,
    copy: messageCopyAction.canCopy,
    expansion: messageExpansionAction.canToggle,
  })
  const messageActionRenderState = createChatMessageActionSlotRenderState<React.ReactNode>({
    availability: messageActionAvailabilityRenderState,
    renderState: messageContentRenderState,
    renderers: {
      turnDuration: () => (
        <span
          className={cn(
            desktopChatMessageActionSurface.turnDurationBadgeClassName,
            messageTurnDurationBadgeState.isLive && desktopChatMessageActionSurface.turnDurationLiveClassName,
          )}
          title={messageTurnDurationBadgeState.title ?? undefined}
        >
          <Clock className={desktopChatMessageActionSurface.turnDurationIconClassName} aria-hidden="true" />
          {messageTurnDurationBadgeState.label}
        </span>
      ),
      speech: () => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            void desktopTtsClient.controlPlayback({
              type: "pause",
              playbackId,
              reason: "agent-progress-message-pause",
            })
          }}
          className={cn(
            desktopChatMessageActionSurface.buttonClassName,
            isTTSPlaying && desktopChatMessageActionSurface.activeButtonClassName
          )}
          title={isGeneratingAudio
            ? chatMessageActionCopy.speech.generatingAudioTitle
            : chatMessageActionCopy.speech.pauseLabel}
          aria-label={isGeneratingAudio
            ? chatMessageActionCopy.speech.generatingAudioLabel
            : chatMessageActionCopy.speech.pauseLabel}
        >
          {isGeneratingAudio ? (
            <Loader2 className={desktopChatMessageActionSurface.generatingAudioIconClassName} />
          ) : (
            <Volume2 className={desktopChatMessageActionSurface.playingAudioIconClassName} />
          )}
        </button>
      ),
      branch: () => (
        <button
          onClick={handleBranchFromMessage}
          className={desktopChatMessageActionSurface.buttonClassName}
          title={messageBranchTitle}
          aria-label={messageBranchAccessibilityLabel}
        >
          <GitBranch className={desktopChatMessageActionSurface.branchIconClassName} />
        </button>
      ),
      copy: () => (
        <button
          onClick={handleCopyResponse}
          className={desktopChatMessageActionSurface.buttonClassName}
          title={messageCopyTitle}
          aria-label={messageCopyAccessibilityLabel}
        >
          {isCopied ? (
            <CheckCheck className={desktopChatMessageActionSurface.copiedIconClassName} />
          ) : (
            <Copy className={desktopChatMessageActionSurface.copyIconClassName} />
          )}
        </button>
      ),
      expansion: () => (
        <button
          onClick={handleChevronClick}
          className={desktopChatMessageActionSurface.buttonClassName}
          title={messageExpansionTitle}
          aria-label={messageExpansionAccessibilityLabel}
          aria-expanded={messageExpansionAction.isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className={desktopChatMessageActionSurface.toggleIconClassName} />
          ) : (
            <ChevronDown className={desktopChatMessageActionSurface.toggleIconClassName} />
          )}
        </button>
      ),
    },
  })
  const shouldRenderMessageActionSlots = messageActionRenderState.shouldRenderActionSlots
  const visibleMessageActionEntries = messageActionRenderState.entries

  return (
    <div className={cn(
      desktopChatMessageSurface.containerClassName,
      getRoleStyle(),
      shouldToggleFromContentClick && desktopChatMessageSurface.collapsedToggleClassName
    )}>
      <div
        className={desktopChatMessageSurface.contentRowClassName}
        onClick={shouldToggleFromContentClick ? handleToggleExpand : undefined}
      >
        <div className={desktopChatMessageSurface.bodyClassName}>
          <div className={cn(
            desktopChatMessageSurface.markdownClassName,
            messageContentRenderState.isCollapsed && desktopChatMessageSurface.collapsedMarkdownClassName
          )}>
          <MarkdownRenderer content={effectiveContent.trim()} collapsed={messageContentRenderState.isCollapsed} />
          </div>
          {hasExtras && isExpanded && (
            <div className={desktopToolExecutionDetailSurface.messageExtrasContainerClassName}>
              {displayToolCalls.length > 0 && (
                <div className={desktopToolExecutionDetailSurface.messageExtrasSectionClassName}>
                  <div className={desktopToolExecutionDetailSurface.messageExtrasHeadingClassName}>
                    {formatToolExecutionHeading("tool_call", displayToolCalls.length)}:
                  </div>
                  {displayToolCalls.map((toolCall, index) => {
                    const toolArgumentsDetail = getToolExecutionDetailArgumentsState(toolCall.arguments)

                    return (
                      <div
                        key={index}
                        className={desktopToolExecutionDetailSurface.toolCallCardClassName}
                      >
                        <div className={desktopToolExecutionDetailSurface.toolCallHeaderClassName}>
                          <span className={desktopToolExecutionDetailSurface.toolCallNameClassName} title={toolCall.name}>
                            {toolCall.name}
                          </span>
                          <Badge variant="outline" className={desktopToolExecutionDetailSurface.compactBadgeClassName}>
                            {formatIndexedToolExecutionLabel("tool", index)}
                          </Badge>
                        </div>
                        {toolArgumentsDetail.hasArguments && (
                          <div>
                            <div className={desktopToolExecutionDetailSurface.messageExtrasSectionLabelClassName}>
                              {formatToolExecutionSectionLabel(toolExecutionDetailCopy.inputLabel)}
                            </div>
                            <StructuredToolPayload
                              payload={toolArgumentsDetail.content}
                              maxHeightClassName={desktopToolExecutionDetailSurface.toolCallPayloadMaxHeightClassName}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {displayResults.length > 0 && (
                <div className={desktopToolExecutionDetailSurface.messageExtrasSectionClassName}>
                  <div className={desktopToolExecutionDetailSurface.messageExtrasHeadingClassName}>
                    {formatToolExecutionHeading("tool_result", displayResults.length)}:
                  </div>
                  {displayResults.map((result, index) => {
                    const resultDetail = getToolExecutionDetailResultState(
                      result,
                      toolExecutionDetailCopy.noContentReturnedLabel,
                    )
                    const resultState = resultDetail.state
                    const resultIsSuccess = resultState === "success"
                    const resultPresentation = toolExecutionStatusCopy[resultState]
                    const resultStatusTextClass = getToolExecutionStatusDesktopClassName(resultState)

                    return (
                      <div
                        key={index}
                        className={cn(
                          desktopToolExecutionDetailSurface.resultCardBaseClassName,
                          desktopToolExecutionDetailSurface.resultCardStatusClassNames[resultState],
                        )}
                      >
                        <div className={desktopToolExecutionDetailSurface.resultHeaderClassName}>
                          <span className={cn(
                            desktopToolExecutionDetailSurface.resultStatusClassName,
                            resultStatusTextClass
                          )}>
                            {resultIsSuccess ? (
                              <Check className={desktopToolExecutionDetailSurface.resultStatusIconClassName} />
                            ) : (
                              <XCircle className={desktopToolExecutionDetailSurface.resultStatusIconClassName} />
                            )}
                            {resultPresentation.label}
                          </span>
                          <div className={desktopToolExecutionDetailSurface.resultMetaClassName}>
                            <span className={desktopToolExecutionDetailSurface.resultCharacterCountClassName}>
                              {resultDetail.characterCountLabel}
                            </span>
                            <Badge variant="outline" className={desktopToolExecutionDetailSurface.compactBadgeClassName}>
                              {formatIndexedToolExecutionLabel("result", index)}
                            </Badge>
                          </div>
                        </div>

                        <div className={desktopToolExecutionDetailSurface.resultBodyClassName}>
                          <div>
                            <div className={desktopToolExecutionDetailSurface.messageExtrasSectionLabelClassName}>
                              {formatToolExecutionSectionLabel(toolExecutionDetailCopy.outputLabel)}
                            </div>
                            <pre className={desktopToolExecutionDetailSurface.resultOutputBlockClassName}>
                              {resultDetail.content}
                            </pre>
                          </div>

                          {resultDetail.error && (
                            <div>
                              <div className={desktopToolExecutionDetailSurface.messageExtrasErrorLabelClassName}>
                                {formatToolExecutionSectionLabel(toolExecutionDetailCopy.errorDetailsLabel)}
                              </div>
                              <pre className={desktopToolExecutionDetailSurface.resultErrorBlockClassName}>
                                {resultDetail.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TTS error message - kept in flow so errors are readable */}
          {shouldShowTTSButton && ttsError && (
            <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300">
              <span className="font-medium">Audio generation failed:</span>{" "}
              {ttsError.includes("terms acceptance") ? (
                <>
                  Groq TTS model requires terms acceptance.{" "}
                  <a
                    href="https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Click here to open the Playground
                  </a>{" "}
                  and accept the terms when prompted.
                </>
              ) : (
                ttsError
              )}
            </div>
          )}
        </div>
        {shouldRenderMessageActionSlots && (
          <div className={desktopChatMessageActionSurface.actionRowClassName}>
            {visibleMessageActionEntries.map(({ slot, item }) => (
              <React.Fragment key={slot}>
                {item}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {/* TTS Audio Player - absolutely positioned so it doesn't add vertical space to the message */}
      {shouldShowTTSButton && (
        <div
          className="absolute bottom-1 right-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <AudioPlayer
            audioData={audioData || undefined}
            audioMimeType={audioMimeType || undefined}
            text={ttsSource}
            onGenerateAudio={generateAudio}
            isGenerating={isGeneratingAudio}
            error={ttsError}
            compact={true}
            autoPlay={shouldAutoPlayLoadedAudio}
            playbackId={playbackId}
            sessionId={sessionId}
            ttsKeys={ttsKeys}
            source={messageVariant}
            onPlayStateChange={setIsTTSPlaying}
            audioOutputDeviceId={configQuery.data?.audioOutputDeviceId}
            autoPlaySuppressionKey={
              message.responseEvent?.id
                ? `compact:${sessionId ?? "no-session"}:${message.responseEvent.id}`
                : `compact:${sessionId ?? "no-session"}:${message.timestamp}`
            }
          />
        </div>
      )}
    </div>
  )
}

const CompactMessage = React.memo(CompactMessageBase, (prev, next) => (
  prev.message === next.message &&
  prev.ttsText === next.ttsText &&
  prev.isLast === next.isLast &&
  prev.isComplete === next.isComplete &&
  prev.hasErrors === next.hasErrors &&
  prev.wasStopped === next.wasStopped &&
  prev.isExpanded === next.isExpanded &&
  prev.variant === next.variant &&
  prev.sessionId === next.sessionId &&
  prev.isSnoozed === next.isSnoozed &&
  prev.parentObservedLiveProgress === next.parentObservedLiveProgress &&
  prev.message.responseEvent?.id === next.message.responseEvent?.id &&
  prev.conversationId === next.conversationId &&
  prev.branchMessageIndex === next.branchMessageIndex &&
  prev.turnDurationMs === next.turnDurationMs &&
  prev.turnIsLive === next.turnIsLive
))

type CompactToolExecutionCall = { name: string; arguments: any }
type CompactToolExecutionResult = { success: boolean; content: string; error?: string } | undefined

const CompactToolExecutionList: React.FC<{
  calls: CompactToolExecutionCall[]
  results: CompactToolExecutionResult[]
  detailsExpanded: boolean
  onToggleDetails: () => void
  rowClassName?: string
  detailsClassName?: string
  executionStats?: {
    durationMs?: number
    totalTokens?: number
    model?: string
    toolUseCount?: number
    inputTokens?: number
    outputTokens?: number
  }
}> = ({
  calls,
  results,
  detailsExpanded,
  onToggleDetails,
  rowClassName = desktopToolExecutionCompactSurface.tileRowClassName,
  detailsClassName = desktopToolExecutionDetailSurface.detailListClassName,
  executionStats,
}) => {
  const copy = async (text: string) => {
    try {
      await copyTextToClipboard(text)
    } catch {}
  }

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    void copy(text)
  }

  const toolCallEntries = calls.map((call, idx) => ({ call, result: results[idx] }))

  return (
    <>
      <div className={desktopToolExecutionCompactSurface.previewListClassName}>
        {toolCallEntries.map(({ call, result }, idx) => {
          const callState = getToolExecutionCallDisplayState(result)
          const callIsPending = callState === "pending"
          const callIsSuccess = callState === "success"
          const callPresentation = toolExecutionStatusCopy[callState]
          const callStatusTextClass = getToolExecutionStatusDesktopClassName(callState)
          const toolPreview = getCompactToolExecutionPreview(
            { name: call.name, arguments: call.arguments ?? {} },
            result ?? null,
          )
          const callAccessibilityLabel = formatToolExecutionCompactAccessibilityLabel(
            callPresentation.label,
            formatToolExecutionDetailsAccessibilityName(toolPreview),
          )

          return (
            <div key={idx}>
              <button
                type="button"
                className={cn(
                  desktopToolExecutionCompactSurface.previewButtonClassName,
                  rowClassName,
                  callStatusTextClass,
                )}
                onClick={onToggleDetails}
                aria-expanded={detailsExpanded}
                aria-label={createExpandCollapseAccessibilityLabel(
                  callAccessibilityLabel,
                  detailsExpanded,
                )}
              >
                <span className={desktopToolExecutionCompactSurface.previewNameClassName} title={toolPreview}>
                  {toolPreview}
                </span>
                <span className={desktopToolExecutionCompactSurface.previewStatusIconContainerClassName}>
                  {callIsPending ? (
                    <Loader2 className={desktopToolExecutionCompactSurface.previewPendingIconClassName} />
                  ) : callIsSuccess ? (
                    <Check className={desktopToolExecutionCompactSurface.previewStatusIconClassName} />
                  ) : (
                    <XCircle className={desktopToolExecutionCompactSurface.previewStatusIconClassName} />
                  )}
                </span>
                <ChevronRight className={cn(
                  desktopToolExecutionCompactSurface.previewToggleIconClassName,
                  detailsExpanded && "rotate-90"
                )} />
              </button>
            </div>
          )
        })}
      </div>

      {detailsExpanded && (
        <div className={detailsClassName}>
          {toolCallEntries.map(({ call, result }, idx) => {
            const callIsPending = !result
            const toolArgumentsDetail = getToolExecutionDetailArgumentsState(call.arguments)
            const resultDetail = getToolExecutionDetailResultState(
              result,
              toolExecutionDetailCopy.noContentReturnedLabel,
            )
            const resultState = resultDetail.hasResult ? resultDetail.state : null
            const resultIsSuccess = resultState === "success"
            const resultStatusTextClass = resultState ? getToolExecutionStatusDesktopClassName(resultState) : ""
            return (
              <div key={idx} className={desktopToolExecutionCompactSurface.detailItemClassName}>
                {toolArgumentsDetail.hasArguments && (
                  <>
                    <div className={desktopToolExecutionDetailSurface.detailHeaderClassName}>
                      <span className={desktopToolExecutionCompactSurface.detailSectionLabelClassName}>
                        {formatToolExecutionSectionLabel(toolExecutionDetailCopy.inputLabel)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={desktopToolExecutionDetailSurface.copyButtonClassName}
                        onClick={(e) => handleCopy(e, toolArgumentsDetail.content)}
                        aria-label={getToolExecutionCopyAccessibilityLabel("input", call.name)}
                      >
                        <Copy className={desktopToolExecutionDetailSurface.copyIconClassName} /> {toolExecutionDetailCopy.copyLabel}
                      </Button>
                    </div>
                    <StructuredToolPayload
                      payload={toolArgumentsDetail.content}
                      maxHeightClassName={desktopToolExecutionDetailSurface.compactPayloadMaxHeightClassName}
                    />
                  </>
                )}
                {result && (
                  <>
                    <div className={desktopToolExecutionDetailSurface.detailHeaderClassName}>
                      <span className={cn(
                        desktopToolExecutionCompactSurface.detailResultStatusClassName,
                        resultStatusTextClass
                      )}>
                        {resultIsSuccess
                          ? formatToolExecutionSectionLabel(toolExecutionDetailCopy.outputLabel)
                          : formatToolExecutionSectionLabel(toolExecutionStatusCopy.error.label)}
                      </span>
                      <span className={desktopToolExecutionCompactSurface.detailCharacterCountClassName}>{resultDetail.characterCountLabel}</span>
                    </div>
                    {resultDetail.error && (
                      <pre className={desktopToolExecutionDetailSurface.errorBlockClassName}>
                        {resultDetail.error}
                      </pre>
                    )}
                    {resultDetail.content && (
                      <StructuredToolPayload
                        payload={resultDetail.content}
                        tone={resultIsSuccess ? "success" : "error"}
                        maxHeightClassName={desktopToolExecutionDetailSurface.compactPayloadMaxHeightClassName}
                      />
                    )}
                  </>
                )}
                {callIsPending && (
                  <div
                    className={desktopToolExecutionCompactSurface.pendingResponseClassName}
                    role="status"
                    aria-label={toolExecutionDetailCopy.pendingResponseAccessibilityLabel}
                  >
                    <Loader2 className={desktopToolExecutionCompactSurface.pendingResponseIconClassName} aria-hidden="true" />
                    <span className="sr-only">{toolExecutionDetailCopy.pendingResponseAccessibilityLabel}</span>
                  </div>
                )}
              </div>
            )
          })}
          {executionStats && (
            <ToolExecutionStats stats={executionStats} compact />
          )}
        </div>
      )}
    </>
  )
}

// Unified Tool Execution bubble combining call + response
const ToolExecutionBubble: React.FC<{
  execution: {
    timestamp: number
    calls: Array<{ name: string; arguments: any }>
    results: CompactToolExecutionResult[]
  }
  isExpanded: boolean
  onToggleExpand: () => void
}> = ({ execution, isExpanded, onToggleExpand }) => {
  return (
    <CompactToolExecutionList
      calls={execution.calls}
      results={execution.results}
      detailsExpanded={isExpanded}
      onToggleDetails={onToggleExpand}
      rowClassName={desktopToolExecutionCompactSurface.tileRowClassName}
      detailsClassName={desktopToolExecutionDetailSurface.tileDetailListClassName}
    />
  )
}

// Compact prose overrides for inline thought blocks: smaller font, tighter
// spacing, and no extra surrounds beyond the parent's left-border accent.
const THOUGHT_MARKDOWN_CLASS =
  "!prose-xs text-[11px] leading-snug [&_p]:my-0.5 [&_p]:text-[11px] [&_p]:leading-snug [&_li]:text-[11px] [&_li]:leading-snug [&_ul]:my-0.5 [&_ol]:my-0.5 [&_pre]:my-1 [&_pre]:text-[10px] [&_code]:text-[10px] [&_h1]:text-[12px] [&_h2]:text-[12px] [&_h3]:text-[11px]"

// Unified Assistant + Tool Execution component - combines thought and tool call as one message
const AssistantWithToolsBubble: React.FC<{
  data: {
    thought: string
    timestamp: number
    isComplete: boolean
    calls: Array<{ name: string; arguments: any }>
    results: Array<{ success: boolean; content: string; error?: string } | undefined>
    executionStats?: {
      durationMs?: number
      totalTokens?: number
      model?: string
    }
  }
  isExpanded: boolean
  onToggleExpand: () => void
}> = ({ data, isExpanded, onToggleExpand }) => {
  const [showToolDetails, setShowToolDetails] = useState(false)

  const toolCallEntries = data.calls.map((call, idx) => ({ call, result: data.results[idx] }))
  const resolvedResults = data.results.filter((result): result is NonNullable<typeof result> => Boolean(result))
  const toolExecutionState = getToolExecutionDisplayState(toolCallEntries.map(({ result }) => result))
  const isPending = toolExecutionState === "pending"
  const hasThought = data.thought && data.thought.trim().length > 0
  const shouldCollapse = (data.thought?.length ?? 0) > 100 || toolCallEntries.length > 0
  const toolStatusTextClass = getToolExecutionStatusDesktopClassName(toolExecutionState)
  const toolExecutionPresentation = toolExecutionStatusCopy[toolExecutionState]
  const collapsedToolPreviewLine = data.calls
    .map((call, idx) => {
      const result = data.results[idx]
      return getCompactToolExecutionPreview(
        { name: call.name, arguments: call.arguments ?? {} },
        result ?? null,
      )
    })
    .join(", ")
  const collapsedToolAccessibilityLabel = formatToolExecutionCompactAccessibilityLabel(
    toolExecutionPresentation.label,
    collapsedToolPreviewLine || formatToolExecutionCount("tool_call", data.calls.length),
  )

  // Generate result summary for collapsed state
  const collapsedResultSummary = (() => {
    if (isExpanded || isPending) return null
    if (resolvedResults.length === 0) return null
    const toolResults = resolvedResults.map(r => ({
      success: r.success,
      content: r.content,
      error: r.error,
    }))
    return getToolResultsSummary(toolResults)
  })()

  const handleToggleExpand = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!shouldCollapse || hasActiveTextSelection(event.currentTarget)) {
      return
    }

    onToggleExpand()
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand()
  }

  const handleToggleToolDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowToolDetails(!showToolDetails)
  }

  const longThought = (data.thought?.length ?? 0) > 100
  const thoughtCollapsed = longThought && !isExpanded
  const thoughtContent = hasThought ? normalizeMarkdownThoughtContent(data.thought.trim()) : ""

  return (
    <div className={cn(
      "rounded-md text-xs transition-all duration-200",
      "border border-sky-200/60 bg-sky-50/30 dark:border-sky-900/40 dark:bg-sky-950/15",
      longThought && "cursor-pointer",
      longThought && !isExpanded && "hover:brightness-95 dark:hover:brightness-110",
    )}>
      <div className="px-2 py-1 space-y-0.5" onClick={handleToggleExpand}>
        {hasThought && (
          <div className={cn(
            "border-l-2 border-amber-300/60 pl-1.5 leading-snug text-left text-[11px] text-muted-foreground dark:border-amber-700/60",
            thoughtCollapsed && "line-clamp-2",
          )}>
            <MarkdownRenderer
              content={thoughtContent}
              className={THOUGHT_MARKDOWN_CLASS}
            />
          </div>
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          <Wrench className={cn("h-3 w-3 shrink-0", toolStatusTextClass)} aria-hidden="true" />
          {hasThought && (
            <Brain className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            {!showToolDetails ? (
              <button
                type="button"
                className={cn(desktopToolExecutionCompactSurface.previewButtonClassName, toolStatusTextClass)}
                onClick={handleToggleToolDetails}
                aria-expanded={showToolDetails}
                aria-label={createExpandCollapseAccessibilityLabel(collapsedToolAccessibilityLabel, showToolDetails)}
                title={collapsedToolPreviewLine}
              >
                {isPending && <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" aria-hidden="true" />}
                <span className={desktopToolExecutionCompactSurface.previewNameClassName}>
                  {collapsedToolPreviewLine}
                </span>
                <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-40" aria-hidden="true" />
              </button>
            ) : (
              <CompactToolExecutionList
                calls={data.calls}
                results={data.results}
                detailsExpanded={showToolDetails}
                onToggleDetails={handleToggleToolDetails}
                rowClassName={desktopToolExecutionCompactSurface.rowClassName}
                detailsClassName={desktopToolExecutionCompactSurface.detailListClassName}
                executionStats={data.executionStats}
              />
            )}
          </div>
          {longThought && (
            isExpanded
              ? <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              : <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/60" />
          )}
        </div>
      </div>
    </div>
  )
}

// Collapsed group of consecutive tool-call activity.
// Each collapsed group shows compact tool preview lines so historical session
// views still communicate which tools were called without expansion.
const ToolActivityGroupBubble: React.FC<{
  group: {
    items: DisplayItem[]
    previewLines: string[]
    callCount: number
  }
  isExpanded: boolean
  onToggleExpand: () => void
  /** Render a single child DisplayItem when the group is expanded. */
  renderItem: (item: DisplayItem, index: number) => React.ReactNode
}> = ({ group, isExpanded, onToggleExpand, renderItem }) => {
  const thinkingCount = group.items.filter((item) => item.kind === "assistant_with_tools" && item.data.thought.trim().length > 0).length
  const groupSummary = getToolActivityGroupSummaryState({
    activityCount: group.items.length,
    toolCallCount: group.callCount,
    previewLines: group.previewLines,
  })

  return (
    <div className={cn(
      desktopToolActivityGroupSurface.containerClassName,
      desktopToolActivityGroupSurface.toneClassName,
      !isExpanded && desktopToolActivityGroupSurface.collapsedToggleClassName,
    )}>
      {/* Single-line collapsed header */}
      <div
        className={desktopToolActivityGroupSurface.headerClassName}
        onClick={() => !isExpanded && onToggleExpand()}
      >
        <Wrench className={desktopToolActivityGroupSurface.iconClassName} aria-hidden="true" />
        {groupSummary.shouldShowToolCallCount && (
          <span
            className={desktopToolActivityGroupSurface.countBadgeClassName}
            aria-label={groupSummary.toolCallCountLabel}
            title={groupSummary.toolCallCountLabel}
          >
            {groupSummary.toolCallCount}
          </span>
        )}
        <span className={desktopToolActivityGroupSurface.previewClassName}>
          {groupSummary.previewText}
        </span>
        {thinkingCount > 0 && (
          <Brain className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          className={desktopToolActivityGroupSurface.toggleButtonClassName}
          aria-label={isExpanded
            ? toolActivityGroupCopy.collapseAccessibilityLabel
            : toolActivityGroupCopy.expandAccessibilityLabel}
        >
          {isExpanded ? (
            <ChevronUp className={desktopToolActivityGroupSurface.toggleIconClassName} />
          ) : (
            <ChevronDown className={desktopToolActivityGroupSurface.toggleIconClassName} />
          )}
        </button>
      </div>

      {/* Expanded: render all child items */}
      {isExpanded && (
        <div className={desktopToolActivityGroupSurface.expandedContentClassName}>
          <div className={desktopToolActivityGroupSurface.expandedItemsClassName}>
            {group.items.map((item, idx) => renderItem(item, idx))}
          </div>
          <div className={desktopToolActivityGroupSurface.footerClassName}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
              className={desktopToolActivityGroupSurface.footerButtonClassName}
              aria-label={toolActivityGroupCopy.collapseFromBottomAccessibilityLabel}
              title={toolActivityGroupCopy.collapseFromBottomTitle}
            >
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
              {toolActivityGroupCopy.collapseFromBottomLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// Inline Tool Approval bubble - appears in the conversation flow
const ToolApprovalBubble: React.FC<{
  approval: {
    approvalId: string
    toolName: string
    arguments: any
  }
  onApprove: () => void
  onDeny: () => void
  isResponding: boolean
}> = ({ approval, onApprove, onDeny, isResponding }) => {
  const [showArgs, setShowArgs] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut handler for tool approval
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if already responding or if user is typing in an input
      if (isResponding) return
      const target = e.target as HTMLElement
      // Ignore when focus is on interactive elements to preserve standard keyboard navigation
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.isContentEditable
      ) {
        return
      }

      // Use e.code for more consistent Space detection across browsers/platforms
      // Space to approve (without modifiers)
      if (e.code === 'Space' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onApprove()
      }
      // Shift+Space to deny
      else if (e.code === 'Space' && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onDeny()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isResponding, onApprove, onDeny])

  // Generate preview text for collapsed view hint
  const approvalArgumentsDetail = getToolExecutionDetailArgumentsState(approval.arguments)
  const argsPreview = approvalArgumentsDetail.preview
  const approvalInteraction = getChatRuntimeToolApprovalInteractionState({
    toolName: approval.toolName,
    isArgumentsExpanded: showArgs,
    isResponding,
  })
  const approvalCopy = approvalInteraction.copy
  const approvalSurface = getChatRuntimeToolApprovalDesktopSurfaceState()
  const approvalResponding = approvalInteraction.approveButton.isDisabled

  return (
    <div className={approvalSurface.containerClassName}>
      {/* Header */}
      <div className={approvalSurface.headerClassName}>
        <Shield className={approvalSurface.iconClassName} />
        <span className={approvalSurface.titleClassName}>
          {approvalInteraction.title}
        </span>
        {approvalResponding && (
          <Loader2 className={approvalSurface.spinnerClassName} />
        )}
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className={cn(
          approvalSurface.contentClassName,
          approvalResponding && approvalSurface.contentDisabledClassName,
        )}
      >
        <div className={approvalSurface.toolRowClassName}>
          <span className={approvalSurface.toolLabelClassName}>{approvalCopy.toolLabel}:</span>
          <code className={approvalSurface.toolNameClassName}>
            {approval.toolName}
          </code>
        </div>

        {/* Arguments preview - always visible */}
        {argsPreview && (
          <div
            className={approvalSurface.argumentsPreviewClassName}
            title={argsPreview}
          >
            {argsPreview}
          </div>
        )}

        {/* Expandable arguments */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowArgs(!showArgs)}
            className={approvalSurface.expandButtonClassName}
            disabled={approvalInteraction.argumentsToggle.isDisabled}
            aria-expanded={approvalInteraction.argumentsToggle.ariaExpanded}
            aria-label={approvalInteraction.argumentsToggle.accessibilityLabel}
          >
            <ChevronRight
              className={cn(
                approvalSurface.argumentsToggleIconClassName,
                showArgs && approvalSurface.argumentsToggleIconExpandedClassName,
              )}
            />
            {approvalInteraction.argumentsToggle.label}
          </button>
          {showArgs && (
            <div className="mt-1.5">
              <StructuredToolPayload payload={approvalArgumentsDetail.content} variant="approval" maxHeightClassName="max-h-48" />
            </div>
          )}
        </div>

        {/* Action buttons with hotkey hints */}
        <div className={approvalSurface.actionStackClassName}>
          <div className={approvalSurface.actionRowClassName}>
            <Button
              variant="outline"
              size="sm"
              className={approvalSurface.denyButtonClassName}
              onClick={onDeny}
              disabled={approvalInteraction.denyButton.isDisabled}
              aria-label={approvalInteraction.denyButton.accessibilityLabel}
              title={approvalCopy.denyHotkeyTitle}
            >
              <XCircle className={approvalSurface.buttonIconClassName} />
              {approvalInteraction.denyButton.label}
            </Button>
            <Button
              size="sm"
              className={cn(
                approvalSurface.approveButtonClassName,
                approvalInteraction.approveButton.isDisabled
                  ? approvalSurface.approveButtonProcessingClassName
                  : approvalSurface.approveButtonReadyClassName
              )}
              onClick={onApprove}
              disabled={approvalInteraction.approveButton.isDisabled}
              aria-label={approvalInteraction.approveButton.accessibilityLabel}
              title={approvalCopy.approveHotkeyTitle}
            >
              {approvalInteraction.approveButton.isDisabled ? (
                <>
                  <Loader2 className={approvalSurface.approveButtonSpinnerIconClassName} />
                  {approvalInteraction.approveButton.label}
                </>
              ) : (
                <>
                  <Check className={approvalSurface.buttonIconClassName} />
                  {approvalInteraction.approveButton.label}
                </>
              )}
            </Button>
          </div>
          {!approvalResponding && (
            <div className={approvalSurface.hotkeysRowClassName}>
              <span className={approvalSurface.hotkeysLabelClassName}>{approvalCopy.hotkeysLabel}</span>
              <div className="flex flex-wrap items-center gap-1">
                <kbd className={approvalSurface.approveKeyClassName}>Space</kbd>
                <span>{approvalCopy.approveHotkeyLabel}</span>
              </div>
              <span className={approvalSurface.hotkeysSeparatorClassName} aria-hidden="true">•</span>
              <div className="flex flex-wrap items-center gap-1">
                <kbd className={approvalSurface.denyKeyClassName}>Shift+Space</kbd>
                <span>{approvalCopy.denyHotkeyLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Retry Status Banner - shows when LLM API is being retried (rate limits, network errors)
const RetryStatusBanner: React.FC<{
  retryInfo: AgentRetryInfo
}> = ({ retryInfo }) => {
  const [countdown, setCountdown] = useState(retryInfo.delaySeconds)

  // Update countdown timer
  useEffect(() => {
    if (!retryInfo.isRetrying) {
      setCountdown(0)
      return undefined
    }

    // Calculate remaining time based on startedAt
    const updateCountdown = () => {
      const elapsed = Math.floor((Date.now() - retryInfo.startedAt) / 1000)
      const remaining = Math.max(0, retryInfo.delaySeconds - elapsed)
      setCountdown(remaining)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [retryInfo.isRetrying, retryInfo.startedAt, retryInfo.delaySeconds])

  if (!retryInfo.isRetrying) return null

  const attemptText = formatChatRuntimeRetryAttemptLabel(retryInfo)

  return (
    <div className={desktopRetryStatusSurface.containerClassName}>
      {/* Header */}
      <div className={desktopRetryStatusSurface.headerClassName}>
        <Clock className={desktopRetryStatusSurface.iconClassName} />
        <span className={desktopRetryStatusSurface.titleClassName}>
          {retryInfo.reason}
        </span>
        <Loader2 className={desktopRetryStatusSurface.spinnerClassName} />
      </div>

      {/* Content */}
      <div className={desktopRetryStatusSurface.contentClassName}>
        <div className={desktopRetryStatusSurface.metaRowClassName}>
          <span className={desktopRetryStatusSurface.attemptClassName}>
            {attemptText}
          </span>
          <span className={desktopRetryStatusSurface.countdownClassName}>
            {formatChatRuntimeRetryCountdownLabel(countdown)}
          </span>
        </div>
        <p className={desktopRetryStatusSurface.descriptionClassName}>
          {desktopRuntimeCopy.retryStatus.autoRetryDescription}
        </p>
      </div>
    </div>
  )
}

// Subagent Conversation Message - individual message in the collapsible conversation
const DELEGATION_COMPACT_WIDTH = 360

function useCompactWidth<T extends HTMLElement>(threshold = DELEGATION_COMPACT_WIDTH) {
  const ref = useRef<T | null>(null)
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const update = (width: number) => setIsCompact(width < threshold)
    update(Math.round(node.getBoundingClientRect().width))

    if (typeof ResizeObserver === "undefined") {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      update(Math.round(entry.contentRect.width))
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isCompact }
}

const SubAgentConversationMessage: React.FC<{
  message: ACPSubAgentMessage
  agentName: string
  isExpanded: boolean
  onToggleExpand: () => void
  isCompact?: boolean
}> = ({ message, agentName, isExpanded, onToggleExpand, isCompact = false }) => {
  const [isCopied, setIsCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await copyTextToClipboard(message.content)
      setIsCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(
        () => setIsCopied(false),
        chatMessageActionCopy.copy.feedbackResetDelayMs,
      )
    } catch (err) {
      console.error(`${chatMessageActionCopy.copy.failedMessage}:`, err)
    }
  }

  const messageDisplayState = getAgentDelegationConversationMessageDisplayState(message, agentName)
  const { role: roleState, timestampLabel } = messageDisplayState
  const roleTone: DelegationConversationMessageTone = roleState.tone
  const RoleIcon = roleTone === "assistant"
    ? Bot
    : roleTone === "tool"
      ? Wrench
      : MessageSquare

  return (
    <div className={cn(
      desktopDelegationConversationMessageSurface.containerBaseClassName,
      desktopDelegationConversationMessageSurface.roleClassNames[roleTone],
    )}>
      <div className={desktopDelegationConversationMessageSurface.rowClassName}>
        <div className={cn(
          desktopDelegationConversationMessageSurface.iconShellBaseClassName,
          desktopDelegationConversationMessageSurface.iconClassNames[roleTone],
        )}>
          <RoleIcon className={desktopDelegationConversationMessageSurface.iconClassName} />
        </div>
        <div className={desktopDelegationConversationMessageSurface.bodyClassName}>
          <div className={cn(
            desktopDelegationConversationMessageSurface.headerBaseClassName,
            isCompact
              ? desktopDelegationConversationMessageSurface.headerCompactClassName
              : desktopDelegationConversationMessageSurface.headerDefaultClassName,
          )}>
            <span className={cn(
              desktopDelegationConversationMessageSurface.badgeBaseClassName,
              desktopDelegationConversationMessageSurface.badgeRoleClassNames[roleTone],
            )}>
              {roleState.label}
            </span>
            {timestampLabel && (
              <span className={desktopDelegationConversationMessageSurface.timestampClassName}>
                {timestampLabel}
              </span>
            )}
          </div>
          {messageDisplayState.isToolMessage ? (
            <div className={desktopDelegationConversationMessageSurface.toolStackClassName}>
              <div
                className={cn(
                  desktopDelegationConversationMessageSurface.contentBaseClassName,
                  !isExpanded && messageDisplayState.isLongContent && (
                    isCompact
                      ? desktopDelegationConversationMessageSurface.contentClampCompactClassName
                      : desktopDelegationConversationMessageSurface.contentClampDefaultClassName
                  ),
                )}
              >
                {messageDisplayState.toolSummary}
              </div>
              {messageDisplayState.serializedToolInput && (
                <div className={desktopDelegationConversationMessageSurface.toolInputBlockClassName}>
                  <div className={desktopDelegationConversationMessageSurface.toolInputLabelClassName}>
                    {desktopRuntimeCopy.delegation.toolInputLabel}
                  </div>
                  <pre className={desktopDelegationConversationMessageSurface.toolInputCodeClassName}>
                    {messageDisplayState.serializedToolInput}
                  </pre>
                </div>
              )}
              {isExpanded && messageDisplayState.shouldShowRawToolPayload && (
                <div className={desktopDelegationConversationMessageSurface.rawPayloadBlockClassName}>
                  <div className={desktopDelegationConversationMessageSurface.rawPayloadLabelClassName}>
                    {desktopRuntimeCopy.delegation.rawPayloadLabel}
                  </div>
                  <pre className={desktopDelegationConversationMessageSurface.rawPayloadCodeClassName}>
                    {messageDisplayState.rawToolPayload}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                desktopDelegationConversationMessageSurface.contentBaseClassName,
                !isExpanded && messageDisplayState.isLongContent && (
                  isCompact
                    ? desktopDelegationConversationMessageSurface.contentClampCompactClassName
                    : desktopDelegationConversationMessageSurface.contentClampDefaultClassName
                ),
              )}
            >
              {messageDisplayState.content}
            </div>
          )}
          {messageDisplayState.shouldShowToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
              className={desktopDelegationConversationMessageSurface.toggleButtonClassName}
            >
              {isExpanded ? (
                <ChevronUp className={desktopDelegationConversationMessageSurface.toggleIconClassName} />
              ) : (
                <ChevronDown className={desktopDelegationConversationMessageSurface.toggleIconClassName} />
              )}
              {getChatMessageExpansionLabel(isExpanded)}
            </button>
          )}
        </div>
        <div className={desktopDelegationConversationMessageSurface.actionColumnClassName}>
          <button
            onClick={handleCopy}
            className={desktopDelegationConversationMessageSurface.copyButtonClassName}
            title={isCopied
              ? chatMessageActionCopy.copy.copiedLabel
              : chatMessageActionCopy.copy.messageLabel}
          >
            {isCopied ? (
              <CheckCheck className={desktopDelegationConversationMessageSurface.copiedIconClassName} />
            ) : (
              <Copy className={desktopDelegationConversationMessageSurface.copyIconClassName} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const SubAgentConversationPanel: React.FC<{
  conversation: ACPSubAgentMessage[]
  delegationStatus: ACPDelegationProgress["status"]
  agentName: string
  isOpen: boolean
  onToggle: () => void
  isCompact?: boolean
  alwaysOpen?: boolean
  defaultShowAll?: boolean
}> = ({ conversation, delegationStatus, agentName, isOpen, onToggle, isCompact = false, alwaysOpen = false, defaultShowAll = false }) => {
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({})
  const [showAll, setShowAll] = useState(defaultShowAll)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const previousConversationLengthRef = useRef(conversation.length)
  const panelOpen = alwaysOpen || isOpen
  const renderItems = useMemo(
    () => getAgentDelegationConversationRenderItems(conversation, delegationStatus),
    [conversation, delegationStatus],
  )

  const toggleMessage = (key: string) => {
    setExpandedMessages(prev => setChatDisplayExpansionState(
      prev,
      key,
      !getChatDisplayExpansionState(prev, key),
    ))
  }

  const handleCopyAll = async () => {
    const fullConversation = formatAgentDelegationConversationTranscript(conversation, agentName)
    try {
      await copyTextToClipboard(fullConversation)
    } catch (err) {
      console.error(`${desktopRuntimeCopy.delegation.copyConversationLabel} failed:`, err)
    }
  }

  const conversationPreview = getAgentDelegationConversationPreview(
    conversation,
    agentName,
    isCompact
      ? desktopDelegationConversationPanelSurface.compactPreviewMaxLength
      : desktopDelegationConversationPanelSurface.defaultPreviewMaxLength,
  )

  useEffect(() => {
    if (defaultShowAll) {
      setShowAll(true)
    }
  }, [defaultShowAll])

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const node = scrollRef.current
    if (!node) return

    if (behavior === "auto") {
      node.scrollTop = node.scrollHeight
      return
    }

    node.scrollTo({ top: node.scrollHeight, behavior })
  }

  const handleScroll = () => {
    const node = scrollRef.current
    if (!node) return
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight
    setIsPinnedToBottom(distanceFromBottom < 24)
  }

  useLayoutEffect(() => {
    if (!panelOpen) return
    scrollToBottom("auto")
    setIsPinnedToBottom(true)
  }, [panelOpen])

  // Keep ACP sub-agent conversation updates pinned in the same paint as new
  // delegated messages arrive. Smooth scrolling here visibly lags behind rapid
  // conversation updates and leaves the inner session scroller off-bottom.
  useLayoutEffect(() => {
    const hadNewMessages = conversation.length > previousConversationLengthRef.current
    previousConversationLengthRef.current = conversation.length

    if (!panelOpen || !hadNewMessages || !isPinnedToBottom) {
      return
    }

    scrollToBottom("auto")
  }, [conversation.length, panelOpen, isPinnedToBottom])

  const visibleItems = showAll
    ? renderItems
    : renderItems.slice(-desktopDelegationConversationPanelSurface.recentMessagesLimit)
  const hiddenCount = renderItems.length - visibleItems.length

  return (
    <div className={desktopDelegationConversationPanelSurface.containerClassName}>
      {/* Collapsible Header */}
      <div
        className={cn(
          desktopDelegationConversationPanelSurface.headerBaseClassName,
          alwaysOpen
            ? desktopDelegationConversationPanelSurface.headerStaticClassName
            : desktopDelegationConversationPanelSurface.headerInteractiveClassName,
        )}
        onClick={alwaysOpen ? undefined : onToggle}
      >
        <div className={desktopDelegationConversationPanelSurface.headerTitleRowClassName}>
          <span className={desktopDelegationConversationPanelSurface.headerTitleClassName}>
            {panelOpen ? desktopRuntimeCopy.delegation.activityLabel : conversationPreview}
          </span>
          <Badge variant="outline" className={desktopDelegationConversationPanelSurface.countBadgeClassName}>
            {renderItems.length}
          </Badge>
        </div>
        <div className={desktopDelegationConversationPanelSurface.actionRowClassName}>
          <button
            onClick={(e) => { e.stopPropagation(); void handleCopyAll() }}
            className={desktopDelegationConversationPanelSurface.copyButtonClassName}
            title={desktopRuntimeCopy.delegation.copyConversationLabel}
            aria-label={desktopRuntimeCopy.delegation.copyConversationLabel}
          >
            <Copy className={desktopDelegationConversationPanelSurface.copyIconClassName} />
          </button>
          {!alwaysOpen && (panelOpen ? (
            <ChevronUp className={desktopDelegationConversationPanelSurface.toggleIconClassName} />
          ) : (
            <ChevronDown className={desktopDelegationConversationPanelSurface.toggleIconClassName} />
          ))}
        </div>
      </div>

      {/* Collapsible Content */}
      {panelOpen && (
        <div className={desktopDelegationConversationPanelSurface.contentContainerClassName}>
          {hiddenCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAll(true) }}
              className={desktopDelegationConversationPanelSurface.showEarlierButtonClassName}
            >
              {formatChatRuntimeEarlierDelegationMessagesLabel(hiddenCount)}
            </button>
          )}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={desktopDelegationConversationPanelSurface.scrollContainerClassName}
            style={{
              maxHeight: isCompact
                ? desktopDelegationConversationPanelSurface.compactScrollMaxHeight
                : desktopDelegationConversationPanelSurface.defaultScrollMaxHeight,
            }}
          >
            {visibleItems.map((item) => {
              if (item.kind === "tool_execution") {
                return (
	                  <ToolExecutionBubble
	                    key={item.key}
	                    execution={item.execution}
	                    isExpanded={getChatDisplayExpansionState(expandedMessages, item.key)}
	                    onToggleExpand={() => toggleMessage(item.key)}
	                  />
                )
              }

              return (
                <SubAgentConversationMessage
                  key={item.key}
	                  message={item.message}
	                  agentName={agentName}
	                  isExpanded={getChatDisplayExpansionState(expandedMessages, item.key)}
	                  onToggleExpand={() => toggleMessage(item.key)}
                  isCompact={isCompact}
                />
              )
            })}
          </div>
          {!isPinnedToBottom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsPinnedToBottom(true)
                scrollToBottom("smooth")
              }}
              className={desktopScrollToBottomSurface.compactButtonClassName}
              title={desktopRuntimeCopy.scrollToBottom.accessibilityLabel}
              aria-label={desktopRuntimeCopy.scrollToBottom.accessibilityLabel}
            >
              <ChevronDown className={desktopScrollToBottomSurface.compactIconClassName} />
              {desktopRuntimeCopy.scrollToBottom.latestLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

type DelegationInfoTone = "default" | "muted" | "success" | "error"

function isJsonLikeContent(value: string): boolean {
  const trimmed = value.trim()
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
    || (trimmed.startsWith("[") && trimmed.endsWith("]"))
  )
}

const DelegationInfoRow: React.FC<{
  label?: string
  content: string
  tone?: DelegationInfoTone
  italic?: boolean
  formatJson?: boolean
}> = ({ label, content, tone = "default", italic = false, formatJson = false }) => {
  const containerClassName = cn(
    "flex items-start gap-2 rounded-md border px-2 py-1.5",
    tone === "default" && "border-border/60 bg-background/70",
    tone === "muted" && "border-border/50 bg-muted/20",
    tone === "success" && "border-green-200/80 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20",
    tone === "error" && "border-red-200/80 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20",
  )

  const labelClassName = cn(
    "w-12 shrink-0 pt-0.5 text-[9px] font-semibold uppercase tracking-wide",
    tone === "default" && "text-muted-foreground",
    tone === "muted" && "text-muted-foreground",
    tone === "success" && "text-green-700 dark:text-green-300",
    tone === "error" && "text-red-700 dark:text-red-300",
  )

  const textClassName = cn(
    "whitespace-pre-wrap break-words text-[11px] leading-[1.2rem]",
    tone === "default" && "text-foreground",
    tone === "muted" && "text-foreground/80",
    tone === "success" && "text-green-900 dark:text-green-100",
    tone === "error" && "text-red-900 dark:text-red-100",
    italic && "italic",
  )

  const codeClassName = cn(
    "max-h-36 overflow-auto whitespace-pre-wrap break-words rounded bg-black/5 p-1.5 text-[10px] leading-4 scrollbar-thin dark:bg-white/5",
    tone === "success" && "text-green-900 dark:text-green-100",
    tone === "error" && "text-red-900 dark:text-red-100",
    (tone === "default" || tone === "muted") && "text-foreground/90",
  )

  const renderContent = () => {
    if (formatJson && isJsonLikeContent(content)) {
      try {
        const parsed = JSON.parse(content)
        return <pre className={codeClassName}>{JSON.stringify(parsed, null, 2)}</pre>
      } catch {
        // fall through to plain text rendering
      }
    }

    return <p className={textClassName}>{content}</p>
  }

  return (
    <div className={containerClassName}>
      {label && <div className={labelClassName}>{label}</div>}
      <div className="min-w-0 flex-1">{renderContent()}</div>
    </div>
  )
}

// Delegation Bubble - shows status of delegated subagent tasks
// The entire component is collapsible, and conversations persist after completion
const DelegationBubble: React.FC<{
  delegation: ACPDelegationProgress
  isExpanded?: boolean
  onToggleExpand?: () => void
  onOpenDetails?: (runId: string) => void
}> = ({ delegation, isExpanded = false, onToggleExpand, onOpenDetails }) => {
  const { ref: containerRef, isCompact } = useCompactWidth<HTMLDivElement>()
  const [isConversationOpen, setIsConversationOpen] = useState(false)
  const isRunning = isAgentDelegationActiveStatus(delegation.status)
  const isCompleted = delegation.status === 'completed'
  const isFailed = delegation.status === 'failed'
  const hasConversation = delegation.conversation && delegation.conversation.length > 0
  const statusClasses = getChatRuntimeDelegationStatusDesktopClassNames(delegation.status)

  // Track live elapsed time only while running
  const [liveElapsed, setLiveElapsed] = useState(0)

  useEffect(() => {
    // Only run timer while the delegation is actively running
    if (!isRunning) {
      return undefined
    }

    // Update immediately
    setLiveElapsed(Math.round((Date.now() - delegation.startTime) / 1000))

    // Update every second
    const interval = setInterval(() => {
      setLiveElapsed(Math.round((Date.now() - delegation.startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, delegation.startTime])

  // Calculate duration:
  // - If endTime exists (completed/failed), use it for accurate final duration
  // - If still running, use the live timer
  // - Fallback: shouldn't happen, but use endTime-based or 0
  const duration = delegation.endTime
    ? Math.round((delegation.endTime - delegation.startTime) / 1000)
    : isRunning
      ? liveElapsed
      : 0

  const handleHeaderClick = () => {
    onToggleExpand?.()
  }

  const {
    statusLabel,
    subtitle,
    sourceLabel,
    trackingLabel,
    messageCount,
  } = getAgentDelegationPresentation(
    delegation,
    isCompact
      ? desktopDelegationBubbleSurface.compactSubtitleMaxLength
      : desktopDelegationBubbleSurface.defaultSubtitleMaxLength,
  )
  const durationLabel = `${duration}s`

  useEffect(() => {
    if (isExpanded && isRunning && hasConversation) {
      setIsConversationOpen(true)
    }
  }, [hasConversation, isExpanded, isRunning])

  return (
    <div
      ref={containerRef}
      className={cn(desktopDelegationBubbleSurface.containerBaseClassName, statusClasses.containerClassName)}
    >
      {/* Single-line header - agent name leads, then status, duration, subtitle */}
      <div
        className={cn(
          desktopDelegationBubbleSurface.headerBaseClassName,
          isExpanded && desktopDelegationBubbleSurface.headerExpandedClassName,
          statusClasses.headerClassName,
        )}
        onClick={handleHeaderClick}
      >
        <Bot className={cn(desktopDelegationBubbleSurface.statusIconClassName, statusClasses.iconClassName)} />
        <span className={cn(desktopDelegationBubbleSurface.agentNameClassName, statusClasses.textClassName)}>
          {delegation.agentName}
        </span>
        {isRunning ? (
          <Loader2
            className={cn(desktopDelegationBubbleSurface.statusSpinnerClassName, statusClasses.iconClassName)}
            aria-hidden="true"
          />
        ) : isCompleted ? (
          <Check
            className={cn(desktopDelegationBubbleSurface.statusIconClassName, statusClasses.iconClassName)}
            aria-hidden="true"
          />
        ) : isFailed ? (
          <XCircle
            className={cn(desktopDelegationBubbleSurface.statusIconClassName, statusClasses.iconClassName)}
            aria-hidden="true"
          />
        ) : (
          <OctagonX
            className={cn(desktopDelegationBubbleSurface.statusIconClassName, statusClasses.iconClassName)}
            aria-hidden="true"
          />
        )}
        <span className={cn(desktopDelegationBubbleSurface.statusMetaClassName, statusClasses.mutedTextClassName)}>
          {statusLabel} · {durationLabel}
        </span>
        {subtitle && (
          <span className={desktopDelegationBubbleSurface.subtitleClassName}>
            {subtitle}
          </span>
        )}
        {messageCount > 0 && (
          <span className={desktopDelegationBubbleSurface.messageCountClassName}>
            {formatChatRuntimeDelegationMessageCount(messageCount)}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className={desktopDelegationBubbleSurface.toggleIconClassName} />
        ) : (
          <ChevronDown className={desktopDelegationBubbleSurface.toggleIconClassName} />
        )}
      </div>

      {/* Content - only shown when expanded */}
      {isExpanded && (
        <div className={desktopDelegationBubbleSurface.contentClassName}>
          <DelegationInfoRow content={delegation.task} tone="muted" />

          {delegation.progressMessage && (
            <DelegationInfoRow content={delegation.progressMessage} tone="default" italic />
          )}

          {/* Collapsible conversation panel - persists after completion */}
          {hasConversation && (
            <SubAgentConversationPanel
              conversation={delegation.conversation!}
              delegationStatus={delegation.status}
              agentName={delegation.agentName}
              isOpen={isConversationOpen}
              onToggle={() => setIsConversationOpen(!isConversationOpen)}
              isCompact={isCompact}
            />
          )}

          {/* Result summary – detect JSON payloads and render formatted */}
          {delegation.resultSummary && (
            <DelegationInfoRow content={delegation.resultSummary} tone="success" formatJson />
          )}

          {/* Error message */}
          {delegation.error && (
            <DelegationInfoRow content={delegation.error} tone="error" />
          )}

          {(hasConversation || onOpenDetails || sourceLabel || trackingLabel) && (
            <div className={cn(
              desktopDelegationBubbleSurface.footerClassName,
              isCompact && desktopDelegationBubbleSurface.footerCompactClassName,
            )}>
              <span className={cn(
                desktopDelegationBubbleSurface.footerMetaClassName,
                statusClasses.mutedTextClassName,
              )}>
                {[sourceLabel, trackingLabel].filter(Boolean).join(" · ")}
              </span>
              <div className={cn(
                desktopDelegationBubbleSurface.footerActionsClassName,
                isCompact && desktopDelegationBubbleSurface.footerActionsCompactClassName,
              )}>
                {hasConversation && !isConversationOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsConversationOpen(true)
                    }}
                    className={desktopDelegationBubbleSurface.transcriptButtonClassName}
                  >
                    Transcript
                  </button>
                )}
                {onOpenDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDetails(delegation.runId)
                    }}
                    className={desktopDelegationBubbleSurface.detailsButtonClassName}
                  >
                    {desktopRuntimeCopy.delegation.detailActionLabel}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DelegationSummaryStrip: React.FC<{
  entries: AgentDelegationSummaryEntry[]
  maxItems: number
  onOpenDetails: (runId: string) => void
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
}> = ({ entries, maxItems, onOpenDetails, isCollapsed = false, onToggleCollapsed }) => {
  if (entries.length === 0) {
    return null
  }

  const visibleEntries = entries.slice(0, maxItems)
  const activeCount = entries.filter((entry) => entry.isActive).length
  const hiddenCount = Math.max(entries.length - visibleEntries.length, 0)

  return (
    <div className="border-b border-border/30 bg-muted/5 px-1.5 py-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleCollapsed?.()
        }}
        className="mb-1 flex w-full flex-wrap items-center gap-1 rounded-sm text-left text-[9px] text-muted-foreground transition-colors hover:bg-muted/30"
        aria-label={isCollapsed
          ? desktopRuntimeCopy.delegation.expandSummaryLabel
          : desktopRuntimeCopy.delegation.collapseSummaryLabel}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? (
          <ChevronRight className="h-2.5 w-2.5 shrink-0" />
        ) : (
          <ChevronDown className="h-2.5 w-2.5 shrink-0" />
        )}
        <span className="inline-flex items-center gap-1 font-medium text-foreground/90">
          <Bot className="h-2.5 w-2.5" />
          {desktopRuntimeCopy.delegation.summaryTitle}
        </span>
        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
          {entries.length}
        </Badge>
        {activeCount > 0 && (
          <Badge variant="outline" className="h-4 border-blue-200 px-1 text-[9px] text-blue-700 dark:border-blue-800 dark:text-blue-300">
            {activeCount} {desktopRuntimeCopy.delegation.liveLabel}
          </Badge>
        )}
        {isCollapsed && hiddenCount > 0 && (
          <span className="ml-auto text-[8.5px] text-muted-foreground/80">
            +{hiddenCount} more
          </span>
        )}
      </button>

      {!isCollapsed && <div className="space-y-0.5">
        {visibleEntries.map((entry) => (
          <button
            key={entry.delegation.runId}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetails(entry.delegation.runId)
            }}
            className="flex w-full min-w-0 items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-1.5 py-1 text-left transition-colors hover:bg-muted/40"
          >
            {entry.isActive ? (
              <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin text-blue-500" />
            ) : entry.delegation.status === "completed" ? (
              <Check className="h-2.5 w-2.5 shrink-0 text-green-500" />
            ) : entry.delegation.status === "failed" ? (
              <XCircle className="h-2.5 w-2.5 shrink-0 text-red-500" />
            ) : (
              <OctagonX className="h-2.5 w-2.5 shrink-0 text-amber-500" />
            )}
            <span className="shrink-0 truncate text-[10px] font-medium leading-4 text-foreground">
              {entry.delegation.agentName}
            </span>
            <span className="shrink-0 text-[9px] text-muted-foreground">{entry.statusLabel}</span>
            {entry.subtitle && (
              <span className="min-w-0 flex-1 truncate text-[9px] text-muted-foreground/90">
                {entry.subtitle}
              </span>
            )}
            {entry.messageCount > 0 && (
              <span className="shrink-0 text-[9px] text-muted-foreground/80">
                {formatChatRuntimeDelegationMessageCount(entry.messageCount)}
              </span>
            )}
          </button>
        ))}
      </div>}
    </div>
  )
}

const DelegationDetailsDialog: React.FC<{
  delegation: ACPDelegationProgress | null
  open: boolean
  onOpenChange: (open: boolean) => void
}> = ({ delegation, open, onOpenChange }) => {
  if (!delegation) {
    return null
  }

  const {
    trackingLabel,
    sourceLabel,
    statusLabel,
    subtitle,
    messageCount,
  } = getAgentDelegationPresentation(delegation, 220)
  const hasConversation = messageCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[76vh] overflow-hidden p-3 sm:max-w-xl">
        <DialogHeader className="space-y-0.5">
          <DialogTitle className="flex flex-wrap items-center gap-1 text-[13px]">
            <Bot className="h-3 w-3" />
            <span>{delegation.agentName}</span>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              {statusLabel}
            </Badge>
          </DialogTitle>
          <DialogDescription className="space-y-0.5 text-[10px]">
            <span className="block">{subtitle}</span>
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px]">
              <span>{sourceLabel}</span>
              {trackingLabel && <span>{trackingLabel}</span>}
              {hasConversation && (
                <span>{formatChatRuntimeDelegationMessagesLabel(messageCount)}</span>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 overflow-y-auto pr-0.5">
          <DelegationInfoRow
            label={desktopRuntimeCopy.delegation.taskRoleLabel}
            content={delegation.task}
            tone="muted"
          />

          {delegation.progressMessage && (
            <DelegationInfoRow
              label={desktopRuntimeCopy.delegation.updateRoleLabel}
              content={delegation.progressMessage}
              tone="default"
              italic
            />
          )}

          {delegation.resultSummary && (
            <DelegationInfoRow
              label={desktopRuntimeCopy.delegation.resultRoleLabel}
              content={delegation.resultSummary}
              tone="success"
              formatJson
            />
          )}

          {delegation.error && (
            <DelegationInfoRow
              label={desktopRuntimeCopy.delegation.errorRoleLabel}
              content={delegation.error}
              tone="error"
            />
          )}

          {hasConversation && (
            <SubAgentConversationPanel
              conversation={delegation.conversation!}
              delegationStatus={delegation.status}
              agentName={delegation.agentName}
              isOpen
              onToggle={() => undefined}
              isCompact
              alwaysOpen
              defaultShowAll
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Streaming Content Bubble - shows real-time LLM response as it's being generated
const StreamingContentBubble: React.FC<{
  streamingContent: {
    text: string
    isStreaming: boolean
    isPlaceholder?: boolean
  }
}> = ({ streamingContent }) => {
  if (!streamingContent.text) return null

  if (streamingContent.isPlaceholder) {
    return (
      <div className={desktopStreamingContentSurface.placeholderClassName}>
        <Loader2 className={desktopStreamingContentSurface.placeholderSpinnerClassName} aria-hidden="true" />
        <span className={desktopStreamingContentSurface.placeholderTextClassName}>{streamingContent.text}</span>
      </div>
    )
  }

  const contentNode = streamingContent.isStreaming
    ? (
      <div className={desktopStreamingContentSurface.liveTextClassName}>
        {streamingContent.text}
      </div>
    )
    : <MarkdownRenderer content={streamingContent.text} />

  return (
    <div className={desktopStreamingContentSurface.containerClassName}>
      {/* Header */}
      <div className={desktopStreamingContentSurface.headerClassName}>
        <Activity className={desktopStreamingContentSurface.iconClassName} />
        <span className={desktopStreamingContentSurface.titleClassName}>
          {getChatRuntimeStreamingContentTitle(streamingContent.isStreaming)}
        </span>
        {streamingContent.isStreaming && (
          <Loader2 className={desktopStreamingContentSurface.spinnerClassName} />
        )}
      </div>

      {/* Content */}
      <div className={desktopStreamingContentSurface.contentClassName}>
        <div className={desktopStreamingContentSurface.bodyClassName}>
          {contentNode}
          {streamingContent.isStreaming && (
            <span className={desktopStreamingContentSurface.caretClassName} />
          )}
        </div>
      </div>
    </div>
  )
}



export const AgentProgress: React.FC<AgentProgressProps> = ({
  progress,
  className,
  variant = "default",
  isFocused,
  onFocus,
  onDismiss,
  isCollapsed: controlledIsCollapsed,
  onCollapsedChange,
  onFollowUpSent,
  isFollowUpInputInitializing,
  onExpand,
  isExpanded,
  onLoadEarlierConversationHistory,
  isLoadingEarlierConversationHistory = false,
  onVoiceContinue,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const shouldAutoScrollRef = useRef(true)
  const lastMessageCountRef = useRef(0)
  const lastContentLengthRef = useRef(0)
  const lastDisplayItemsCountRef = useRef(0)
  const lastScrollContentHeightRef = useRef(0)
  const lastSessionIdRef = useRef<string | undefined>(undefined)
  const pendingInitialScrollTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastDerivedUserResponseLogKeyRef = useRef<string | null>(null)
  const [showKillConfirmation, setShowKillConfirmation] = useState(false)
  const [isKilling, setIsKilling] = useState(false)
  const { isDark } = useTheme()
  const configQuery = useConfigQuery()

  const clearPendingInitialScrollAttempts = useCallback(() => {
    pendingInitialScrollTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    pendingInitialScrollTimeoutsRef.current = []
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    if (behavior === "auto" || typeof scrollContainer.scrollTo !== "function") {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
      return
    }

    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    shouldAutoScrollRef.current = shouldAutoScroll
  }, [shouldAutoScroll])

  // Tile-specific state - support controlled mode
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const isCollapsed = controlledIsCollapsed ?? internalIsCollapsed

  // Use shared resize hook for tile variant
  const {
    height: tileHeight,
    isResizing,
    handleHeightResizeStart: handleResizeStart,
  } = useResizable({
    initialHeight: TILE_DIMENSIONS.height.default,
    minHeight: TILE_DIMENSIONS.height.min,
    maxHeight: TILE_DIMENSIONS.height.max,
  })

  // Handle tile collapse toggle
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newCollapsed = !isCollapsed
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed)
    } else {
      setInternalIsCollapsed(newCollapsed)
    }
  }

  // Expansion state management - preserve across re-renders
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Tab state for Chat/Summary view toggle (only relevant when dual-model is enabled)
  const [activeTab, setActiveTab] = useState<"chat" | "summary">("chat")
  const [selectedDelegationRunId, setSelectedDelegationRunId] = useState<string | null>(null)
  const [isDelegationSummaryCollapsed, setIsDelegationSummaryCollapsed] = useState(false)

  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)

  const handleFollowUpSent = useCallback(() => {
    if (variant === "tile") {
      setShouldAutoScroll(true)
      setIsUserScrolling(false)
      // Ensure this tile is focused so shouldAutoScrollContent stays true
      // for subsequent content updates after the message is sent
      if (!isFocused && progress?.sessionId) {
        setFocusedSessionId(progress.sessionId)
      }
      scrollToBottom("auto")
    }

    onFollowUpSent?.()
  }, [onFollowUpSent, scrollToBottom, variant, isFocused, progress?.sessionId, setFocusedSessionId])
  const setSessionSnoozed = useAgentStore((s) => s.setSessionSnoozed)
  const pinnedSessionIds = useAgentStore((s) => s.pinnedSessionIds)
  const togglePinSession = useAgentStore((s) => s.togglePinSession)
  const conversationId = progress?.conversationId
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const skipTitleSaveOnBlurRef = useRef(false)

  useEffect(() => {
    setIsTitleEditing(false)
    setEditingTitle("")
    skipTitleSaveOnBlurRef.current = false
  }, [conversationId])

  // Get queued messages for this conversation (used in overlay variant)
  const queuedMessages = useMessageQueue(conversationId)
  const isQueuePaused = useIsQueuePaused(conversationId)
  const hasQueuedMessages = queuedMessages.length > 0

  // Helper to toggle expansion state for a specific item
  // Uses defaultExpanded fallback for items that haven't been explicitly toggled yet
  // (like tool executions which default to expanded)
  // By deriving the current state from prev inside the setter, this is resilient to
  // batched updates (e.g., double-clicks will correctly round-trip)
  const toggleItemExpansion = (itemKey: string, defaultExpanded: boolean) => {
    setExpandedItems(prev => {
      // Use prev[itemKey] if it exists (item was explicitly toggled before),
      // otherwise use the default expanded state for this item type
      const from = getChatDisplayExpansionState(prev, itemKey, defaultExpanded)
      const to = !from
      logExpand("AgentProgress", "toggle", { itemKey, from, to })
      return setChatDisplayExpansionState(prev, itemKey, to)
    })
  }

  // Kill switch handler - stop only this session, with fallback to global emergency stop
  const handleKillSwitch = async () => {
    if (isKilling) return // Prevent double-clicks

    setIsKilling(true)
    try {
      if (progress?.sessionId) {
        await desktopAgentSessionsClient.stopAgentSession(progress.sessionId)
      } else {
        // No session ID available, fall back to global emergency stop
        // so the kill switch always works regardless of state
        await desktopAgentSessionsClient.emergencyStopAgent()
      }
      setShowKillConfirmation(false)
    } catch (error) {
      const stopPath = progress?.sessionId ? "stopAgentSession" : "emergencyStopAgent"
      console.error(`Failed to stop agent (via ${stopPath}):`, error)
    } finally {
      setIsKilling(false)
    }
  }

  // Handle confirmation dialog
  const handleKillConfirmation = () => {
    setShowKillConfirmation(true)
  }

  const handleCancelKill = () => {
    setShowKillConfirmation(false)
  }

  const handleRestoreSession = useCallback(async () => {
    if (!progress?.sessionId) return false

    // Update local store first so the tile reflects the restored session immediately.
    setSessionSnoozed(progress.sessionId, false)
    setFocusedSessionId(progress.sessionId)

    try {
      await desktopAgentSessionsClient.unsnoozeAgentSession(progress.sessionId)
    } catch (error) {
      setSessionSnoozed(progress.sessionId, true)
      setFocusedSessionId(null)
      console.error("Failed to unsnooze session:", error)
      return false
    }

    try {
      await desktopAgentSessionsClient.focusAgentSession(progress.sessionId)
    } catch (error) {
      console.error("Failed to update UI after unsnooze:", error)
    }

    return true
  }, [progress?.sessionId, setFocusedSessionId, setSessionSnoozed])

  const handleExpandTile = useCallback(async () => {
    if (!onExpand) return
    if (progress?.isSnoozed) {
      const restored = await handleRestoreSession()
      if (!restored) return
    }
    onExpand()
  }, [handleRestoreSession, onExpand, progress?.isSnoozed])

  const isPinned = !!conversationId && pinnedSessionIds.has(conversationId)

  // Close button handler for completed agent view
  const handleClose = async () => {
    try {
      const thisId = progress?.sessionId
      const hasOtherVisible = thisId
        ? Array.from(useAgentStore.getState().agentProgressById.values()).some(
            (p) => p && p.sessionId !== thisId && !p.isSnoozed,
          )
        : false

      if (thisId && hasOtherVisible) {
        // Session-scoped dismiss: remove only this session's progress and keep panel open
        await desktopAgentSessionsClient.clearAgentSessionProgress(thisId)
      } else {
        // Last visible session: exit agent mode and hide panel
        await desktopAgentSessionsClient.closeAgentModeAndHidePanelWindow()
      }
    } catch (error) {
      console.error("Failed to close agent session/panel:", error)
    }
  }

  // Tool approval handlers
  // Track the approval ID we're responding to, to handle race conditions
  const [respondingApprovalId, setRespondingApprovalId] = useState<string | null>(null)
  // Use a ref to synchronously block re-entrancy (prevents double-click race condition)
  const respondingApprovalIdRef = useRef<string | null>(null)

  // Derive isRespondingToApproval from whether we have a pending response for the current approval
  const isRespondingToApproval = respondingApprovalId === progress?.pendingToolApproval?.approvalId

  const handleApproveToolCall = async () => {
    const approvalId = progress?.pendingToolApproval?.approvalId
    console.log(`[Tool Approval UI] handleApproveToolCall called, approvalId=${approvalId}`)
    if (!approvalId) {
      console.log(`[Tool Approval UI] No approvalId found, returning early`)
      return
    }
    // Synchronous check to prevent double-click race condition
    if (respondingApprovalIdRef.current === approvalId) {
      console.log(`[Tool Approval UI] Already responding to this approval, skipping`)
      return
    }

    respondingApprovalIdRef.current = approvalId
    setRespondingApprovalId(approvalId)
    console.log(`[Tool Approval UI] Calling desktopAgentSessionsClient.respondToToolApproval with approvalId=${approvalId}, approved=true`)
    try {
      const result = await desktopAgentSessionsClient.respondToToolApproval({
        approvalId,
        approved: true,
      })
      console.log(`[Tool Approval UI] desktopAgentSessionsClient.respondToToolApproval returned:`, result)
      // Don't reset respondingApprovalId on success - keep showing "Processing..."
      // The approval bubble will be removed when pendingToolApproval is cleared from progress
    } catch (error) {
      console.error("[Tool Approval UI] Failed to approve tool call:", error)
      toast.error(formatChatRuntimeToolApprovalFailureMessage("approve", error))
      // Only reset on error so user can retry
      respondingApprovalIdRef.current = null
      setRespondingApprovalId(null)
    }
  }

  const handleDenyToolCall = async () => {
    const approvalId = progress?.pendingToolApproval?.approvalId
    console.log(`[Tool Approval UI] handleDenyToolCall called, approvalId=${approvalId}`)
    if (!approvalId) {
      console.log(`[Tool Approval UI] No approvalId found for deny, returning early`)
      return
    }
    // Synchronous check to prevent double-click race condition
    if (respondingApprovalIdRef.current === approvalId) {
      console.log(`[Tool Approval UI] Already responding to this approval (deny), skipping`)
      return
    }

    respondingApprovalIdRef.current = approvalId
    setRespondingApprovalId(approvalId)
    console.log(`[Tool Approval UI] Calling desktopAgentSessionsClient.respondToToolApproval with approvalId=${approvalId}, approved=false`)
    try {
      const result = await desktopAgentSessionsClient.respondToToolApproval({
        approvalId,
        approved: false,
      })
      console.log(`[Tool Approval UI] desktopAgentSessionsClient.respondToToolApproval (deny) returned:`, result)
      // Don't reset respondingApprovalId on success - keep showing "Processing..."
      // The approval bubble will be removed when pendingToolApproval is cleared from progress
    } catch (error) {
      console.error("[Tool Approval UI] Failed to deny tool call:", error)
      toast.error(formatChatRuntimeToolApprovalFailureMessage("deny", error))
      // Only reset on error so user can retry
      respondingApprovalIdRef.current = null
      setRespondingApprovalId(null)
    }
  }

  if (!progress) {
    return null
  }

  const {
    currentIteration,
    maxIterations,
    steps,
    isComplete,
    finalContent,
    conversationHistory,
    sessionStartIndex,
    contextInfo,
    modelInfo,
    profileName,
    acpSessionInfo,
  } = progress
  const isQueueEnabled = configQuery.data?.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED

  // Detect if agent was stopped by kill switch
  const wasStopped = finalContent?.includes("emergency kill switch") ||
                    steps?.some(step => step.title === "Agent stopped" ||
                               step.description?.includes("emergency kill switch"))
  const shouldAutoScrollContent = variant !== "tile" || !!isFocused || !!isExpanded || !isComplete
  const observedSessionIdRef = useRef(progress.sessionId)
  const observedSessionLiveProgressRef = useRef(false)

  if (observedSessionIdRef.current !== progress.sessionId) {
    observedSessionIdRef.current = progress.sessionId
    observedSessionLiveProgressRef.current = false
  }

  useEffect(() => {
    if (!isComplete) {
      observedSessionLiveProgressRef.current = true
    }
  }, [isComplete, progress.sessionId])

  const messages = useMemo<Array<{
    role: "user" | "assistant" | "tool"
    content: string
    isComplete: boolean
    timestamp: number
    isThinking: boolean
    isAssistantThought?: boolean
    toolCalls?: Array<{ name: string; arguments: any }>
    toolResults?: Array<{ success: boolean; content: string; error?: string }>
    /** Absolute raw-history index to use when branching from this message */
    branchMessageIndex?: number
  }>>(() => {
    const nextMessages: Array<{
      role: "user" | "assistant" | "tool"
      content: string
      isComplete: boolean
      timestamp: number
      isThinking: boolean
      isAssistantThought?: boolean
      toolCalls?: Array<{ name: string; arguments: any }>
      toolResults?: Array<{ success: boolean; content: string; error?: string }>
      branchMessageIndex?: number
    }> = []
    const fallbackBaseTimestamp =
      conversationHistory?.[conversationHistory.length - 1]?.timestamp ??
      steps[steps.length - 1]?.timestamp ??
      0

    if (conversationHistory && conversationHistory.length > 0) {
      const startIndex =
        typeof sessionStartIndex === "number" && sessionStartIndex > 0
          ? Math.min(sessionStartIndex, conversationHistory.length)
          : 0
      const historyForSession =
        startIndex > 0 ? conversationHistory.slice(startIndex) : conversationHistory

      const isCompletionNudge = (content: string) => content.trim() === INTERNAL_COMPLETION_NUDGE_TEXT

      historyForSession
        .forEach((entry, localIndex) => {
          if (entry.role === "user" && isCompletionNudge(entry.content)) return
          nextMessages.push({
            role: entry.role,
            content: entry.displayContent ?? entry.content,
            isComplete: true,
            timestamp: entry.timestamp ?? fallbackBaseTimestamp + localIndex,
            isThinking: false,
            toolCalls: entry.toolCalls,
            toolResults: entry.toolResults,
            branchMessageIndex: entry.branchMessageIndex,
          })
        })

      const currentThinkingStep = !isComplete
        ? steps.find((step) => step.type === "thinking" && step.status === "in_progress")
        : undefined

      if (currentThinkingStep) {
        const isStreaming = progress.streamingContent?.isStreaming
        let latestAssistantHistoryMessage: (typeof nextMessages)[number] | undefined
        for (let i = nextMessages.length - 1; i >= 0; i--) {
          const message = nextMessages[i]
          if (
            message.role === "assistant" &&
            !message.toolCalls?.length &&
            !message.toolResults?.length &&
            hasVisibleChatMessageContent(message)
          ) {
            latestAssistantHistoryMessage = message
            break
          }
        }

        const historyAlreadyContainsThinking = !!(
          currentThinkingStep.llmContent &&
          latestAssistantHistoryMessage?.content &&
          currentThinkingStep.llmContent.endsWith(latestAssistantHistoryMessage.content)
        )

        if (
          !isStreaming &&
          !historyAlreadyContainsThinking &&
          currentThinkingStep.llmContent &&
          currentThinkingStep.llmContent.trim().length > 0
        ) {
          nextMessages.push({
            role: "assistant",
            content: currentThinkingStep.llmContent,
            isComplete: false,
            timestamp: currentThinkingStep.timestamp,
            isThinking: false,
            isAssistantThought: true,
          })
        } else if (!isStreaming) {
          if (shouldRenderChatRuntimeActivityStep(currentThinkingStep)) {
            nextMessages.push({
              role: "assistant",
              content: formatChatRuntimeActivityContent(currentThinkingStep),
              isComplete: false,
              timestamp: currentThinkingStep.timestamp,
              isThinking: true,
            })
          }
        }
      }
    } else {
      steps
        .filter((step) => step.type === "thinking")
        .forEach((step, index) => {
          if (step.llmContent && step.llmContent.trim().length > 0) {
            nextMessages.push({
              role: "assistant",
              content: step.llmContent,
              isComplete: step.status === "completed",
              timestamp: step.timestamp ?? fallbackBaseTimestamp + index,
              isThinking: false,
                isAssistantThought: true,
            })
          } else if (step.status === "in_progress" && !isComplete) {
            if (shouldRenderChatRuntimeActivityStep(step)) {
              nextMessages.push({
                role: "assistant",
                content: formatChatRuntimeActivityContent(step),
                isComplete: false,
                timestamp: step.timestamp ?? fallbackBaseTimestamp + index,
                isThinking: true,
              })
            }
          }
        })

      const normalizedFinalContent = normalizeAssistantResponseForDedupe(finalContent)
      if (normalizedFinalContent.length > 0) {
        let lastEligibleAssistantMessage: (typeof nextMessages)[number] | undefined
        for (let i = nextMessages.length - 1; i >= 0; i--) {
          const candidate = nextMessages[i]
          if (
            candidate.role === "assistant" &&
            !candidate.toolCalls?.length &&
            !candidate.toolResults?.length
          ) {
            lastEligibleAssistantMessage = candidate
            break
          }
        }
        const finalContentAlreadyInHistory =
          !!lastEligibleAssistantMessage &&
          normalizeAssistantResponseForDedupe(lastEligibleAssistantMessage.content) === normalizedFinalContent
        const lastMessage = nextMessages[nextMessages.length - 1]
        if (!finalContentAlreadyInHistory) {
          nextMessages.push({
            role: "assistant",
            content: finalContent,
            isComplete: true,
            timestamp: lastMessage?.timestamp ?? fallbackBaseTimestamp,
            isThinking: false,
          })
        }
      }
    }

    if (nextMessages.length > 1) {
      nextMessages.sort((a, b) => a.timestamp - b.timestamp)
    }

    return nextMessages
  }, [conversationHistory, finalContent, isComplete, progress.streamingContent?.isStreaming, sessionStartIndex, steps])

  const legacyResponseEvents = useMemo<AgentUserResponseEvent[]>(() => {
    if (!progress.userResponse) return []
    const orderedTexts = [...(progress.userResponseHistory || []), progress.userResponse]
    const fallbackTimestamp = messages[messages.length - 1]?.timestamp ?? steps[steps.length - 1]?.timestamp ?? 0

    return orderedTexts.map((text, index) => ({
      id: `legacy-${progress.sessionId}-${progress.runId ?? "run"}-${index + 1}`,
      sessionId: progress.sessionId,
      runId: progress.runId,
      ordinal: index + 1,
      text,
      timestamp: fallbackTimestamp + index,
    }))
  }, [messages, progress.runId, progress.sessionId, progress.userResponse, progress.userResponseHistory, steps])
  const fallbackRespondToUserEvents = useMemo(
    () => (progress.userResponse || (progress.responseEvents?.length ?? 0) > 0
      ? []
      : extractRespondToUserResponsesFromMessages(messages)),
    [messages, progress.responseEvents, progress.userResponse],
  )
  const effectiveResponseEvents = useMemo<AgentUserResponseEvent[]>(() => {
    if ((progress.responseEvents?.length ?? 0) > 0) return progress.responseEvents ?? []
    if (legacyResponseEvents.length > 0) return legacyResponseEvents
    return fallbackRespondToUserEvents
  }, [fallbackRespondToUserEvents, legacyResponseEvents, progress.responseEvents])
  const latestResponseEvent = useMemo(
    () => effectiveResponseEvents[effectiveResponseEvents.length - 1],
    [effectiveResponseEvents],
  )
  const priorResponseEvents = useMemo(
    () => effectiveResponseEvents.length > 1 ? effectiveResponseEvents.slice(0, -1) : undefined,
    [effectiveResponseEvents],
  )
  const effectiveUserResponse = latestResponseEvent?.text
  const effectiveUserResponseHistory = useMemo(
    () => priorResponseEvents?.map((event) => event.text),
    [priorResponseEvents],
  )
  // Attach respond_to_user events (which carry image markdown) onto matching
  // streamed assistant messages, or synthesize standalone assistant messages
  // for events with no streamed prose counterpart. Downstream rendering then
  // goes through the single CompactMessage path so images render uniformly.
  const enrichedMessages = useMemo(() => {
    type EnrichedMessage = (typeof messages)[number] & { responseEvent?: AgentUserResponseEvent }
    if (effectiveResponseEvents.length === 0) return messages as EnrichedMessage[]

    const copies: EnrichedMessage[] = messages.map((m) => ({ ...m }))
    const usedEventIds = new Set<string>()
    const matchedIndexes = new Set<number>()

    const eligibleIndexes = copies
      .map((m, i) => ({ m, i }))
      .filter(({ m }) =>
        isChatMessageConversationContent(m) &&
        !m.toolCalls?.length &&
        !m.toolResults?.length &&
        hasVisibleChatMessageContent(m),
      )
      .map(({ i }) => i)

    const attachEvent = (event: AgentUserResponseEvent, normalizedEventText: string) => {
      if (!normalizedEventText) return false
      const candidates = eligibleIndexes.filter((i) =>
        !matchedIndexes.has(i)
        && normalizeAssistantResponseForDedupe(copies[i].content) === normalizedEventText,
      )
      const matchIndex = candidates.find((i) => copies[i].timestamp >= event.timestamp)
        ?? (progress.isComplete ? candidates[candidates.length - 1] : undefined)
      if (matchIndex == null) return false
      copies[matchIndex].responseEvent = event
      matchedIndexes.add(matchIndex)
      usedEventIds.add(event.id)
      return true
    }

    // Pass 1: exact-text match between event and streamed assistant prose.
    for (const event of effectiveResponseEvents) {
      if (usedEventIds.has(event.id)) continue
      attachEvent(event, normalizeAssistantResponseForDedupe(event.text))
    }

    // Pass 2: match the renderer-store sanitized history form. Inline data URLs
    // are replaced in conversationHistory to keep progress state lightweight, but
    // responseEvents retain the real markdown so the attached message can render
    // images. Treat those two forms as the same response to avoid duplicate final
    // bubbles where the second one only shows [Image: ...] placeholders.
    for (const event of effectiveResponseEvents) {
      if (usedEventIds.has(event.id)) continue
      attachEvent(event, normalizeAssistantResponseForDedupe(sanitizeMessageContentForDisplay(event.text)))
    }

    // Pass 3: fuzzy match with image markdown stripped so text+image events
    // can still bind to the text-only streamed prose that carries the same words.
    for (const event of effectiveResponseEvents) {
      if (usedEventIds.has(event.id)) continue
      attachEvent(event, normalizeAssistantResponseForDedupe(stripMarkdownMediaPayloads(event.text, { stripAllImages: true })))
    }

    // Pass 4: synthesize standalone assistant messages for unmatched events.
    for (const event of effectiveResponseEvents) {
      if (usedEventIds.has(event.id)) continue
      copies.push({
        role: "assistant",
        content: event.text,
        isComplete: true,
        timestamp: event.timestamp,
        isThinking: false,
        responseEvent: event,
      })
      usedEventIds.add(event.id)
    }

    if (copies.length > 1) {
      copies.sort((a, b) => a.timestamp - b.timestamp)
    }
    return copies
  }, [effectiveResponseEvents, messages, progress.isComplete])
  // Live wall-clock tick for in-progress agent turns. Stops ticking when the
  // session is complete so completed sessions don't re-render every second.
  const turnNow = useNowTick(!isComplete)
  const turnDurationMessages = useMemo(
    () => createTurnDurationMessages(enrichedMessages),
    [enrichedMessages],
  )
  const turnDurations = useMemo(
    () => computeTurnDurations(turnDurationMessages, isComplete, turnNow),
    [isComplete, turnDurationMessages, turnNow],
  )
  const totalTurnDurationBadgeState = useMemo(
    () => getChatRuntimeTurnDurationBadgeState({
      scope: "total",
      durationMs: turnDurations.totalMs,
      isLive: turnDurations.hasLive,
    }),
    [turnDurations.hasLive, turnDurations.totalMs],
  )
  const primaryAgentLabel = useMemo(
    () => acpSessionInfo?.agentTitle ?? acpSessionInfo?.agentName ?? profileName ?? "Agent",
    [acpSessionInfo?.agentName, acpSessionInfo?.agentTitle, profileName],
  )
  const toolCallSteps = useMemo(
    () => steps.filter((step) => step.type === "tool_call" && step.executionStats),
    [steps],
  )

  if ((progress.responseEvents?.length ?? 0) === 0 && !progress.userResponse && effectiveUserResponse) {
    const logKey = `${progress.sessionId}:${effectiveUserResponse.length}:${effectiveUserResponseHistory?.length || 0}`
    if (lastDerivedUserResponseLogKeyRef.current !== logKey) {
      logUI("[AgentProgress] Derived userResponse from conversation tool calls", {
        sessionId: progress.sessionId,
        conversationId: progress.conversationId,
        responseLength: effectiveUserResponse.length,
        historyLength: effectiveUserResponseHistory?.length || 0,
        fromPendingSession: progress.sessionId.startsWith("pending-"),
      })
      lastDerivedUserResponseLogKeyRef.current = logKey
    }
  } else {
    lastDerivedUserResponseLogKeyRef.current = null
  }

  const displayItems = useMemo<DisplayItem[]>(() => {
    const generateToolExecutionId = (calls: Array<{ name: string; arguments: any }>, timestamp: number) => {
      const signature = calls
        .map((call) => `${call.name}:${formatToolArguments(call.arguments).substring(0, 50)}`)
        .join("|") + `@${timestamp}`
      let hash = 0
      for (let i = 0; i < signature.length; i++) {
        hash = ((hash << 5) - hash) + signature.charCodeAt(i)
        hash &= hash
      }
      return Math.abs(hash).toString(36)
    }

    const getItemTimestamp = (item: DisplayItem): number | null => {
      switch (item.kind) {
        case "message":
        case "tool_execution":
        case "assistant_with_tools":
          return item.data.timestamp
        case "delegation":
          return item.data.startTime
        case "retry_status":
          return item.data.startedAt
        case "tool_approval":
        case "streaming":
        case "tool_activity_group":
          return null
      }
    }

    const items: DisplayItem[] = []
    const roleCounters: Record<'user' | 'assistant' | 'tool', number> = { user: 0, assistant: 0, tool: 0 }

    for (let i = 0; i < enrichedMessages.length; i++) {
      const message = enrichedMessages[i]
      if (message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0) {
        const next = enrichedMessages[i + 1]
        const results = next && next.role === "tool" && next.toolResults ? next.toolResults : []
        const assistantIndex = ++roleCounters.assistant
        // Keep the display item ID tied to the assistant tool-call message, not
        // the eventual result timestamp. Otherwise an expanded pending tool row
        // collapses when its result arrives because the key changes.
        const toolExecId = generateToolExecutionId(message.toolCalls, message.timestamp)
        const messageDisplayState = getChatMessageDisplayState(
          {
            ...message,
            toolCalls: message.toolCalls,
            toolResults: results,
          },
          { includeResultOnlyFallback: false },
        )
        const visibleToolEntries = messageDisplayState.visibleToolEntries
        const visibleToolNames = visibleToolEntries.map(({ toolCall }) => toolCall.name)
        const hasCompletionTool = visibleToolEntries.length !== message.toolCalls.length
        const suppressThought = hasCompletionTool && !!effectiveUserResponse

        if (visibleToolEntries.length > 0) {
          const matchingStep = toolCallSteps.find(
            (step) => step.title?.includes(visibleToolNames[0]) || visibleToolNames.some((name) => step.title?.includes(name)),
          )

          items.push({
            kind: "assistant_with_tools",
            id: `assistant-tools-${assistantIndex}-${toolExecId}`,
            data: {
              thought: suppressThought ? "" : (message.content || ""),
              timestamp: message.timestamp,
              isComplete: message.isComplete,
              calls: visibleToolEntries.map(({ toolCall }) => toolCall),
              // Preserve per-call result alignment after hiding completion-control tools.
              // Some visible calls may still be pending while later visible calls already have results.
              results: visibleToolEntries.map(({ result }) => result),
              executionStats: matchingStep?.executionStats ? {
                durationMs: matchingStep.executionStats.durationMs,
                totalTokens: matchingStep.executionStats.totalTokens,
                model: matchingStep.subagentId,
              } : undefined,
            },
          })
        } else if (messageDisplayState.shouldRenderSurface) {
          // All tool calls were completion-control (respond_to_user / mark_work_complete).
          // Always render the assistant message content so previous agent responses
          // are visible inline in the conversation timeline.
          items.push({
            kind: "message",
            id: `msg-assistant-${assistantIndex}`,
            data: { ...message },
          })
        }

        if (next && next.role === "tool" && next.toolResults) {
          i++
        }
      } else if (
        message.role === "tool" &&
        message.toolResults &&
        !(i > 0 && enrichedMessages[i - 1].role === "assistant" && (enrichedMessages[i - 1].toolCalls?.length ?? 0) > 0)
      ) {
        const toolIndex = ++roleCounters.tool
        items.push({
          kind: "tool_execution",
          id: `exec-standalone-${toolIndex}`,
          data: { timestamp: message.timestamp, calls: [], results: message.toolResults },
        })
      } else if (
        message.role === "tool" &&
        !message.toolResults?.length &&
        !message.toolCalls?.length
      ) {
        // Synthetic tool-role summaries (e.g. "TOOL FAILED: ..." added for LLM
        // context when tool calls error) should not render as a standalone
        // bubble — the actual failures are already shown inside the tool call
        // stack via toolResults on the preceding tool message.
        continue
      } else {

        const roleIndex = ++roleCounters[message.role]
        items.push({
          kind: "message",
          id: `msg-${message.role}-${roleIndex}`,
          data: { ...message },
        })
      }
    }

    if (progress.retryInfo?.isRetrying) {
      items.push({
        kind: "retry_status",
        id: `retry-${progress.retryInfo.startedAt}`,
        data: progress.retryInfo,
      })
    }

    if (!progress.isComplete && progress.streamingContent?.text) {
      let latestAssistantText: (typeof enrichedMessages)[number] | undefined
      for (let i = enrichedMessages.length - 1; i >= 0; i--) {
        const message = enrichedMessages[i]
        if (
          message.role === "assistant" &&
          !message.toolCalls?.length &&
          !message.toolResults?.length &&
          hasVisibleChatMessageContent(message)
        ) {
          latestAssistantText = message
          break
        }
      }

      const historyAlreadyContainsStream = !!(
        latestAssistantText?.content &&
        progress.streamingContent.text.endsWith(latestAssistantText.content)
      )

      if (!historyAlreadyContainsStream) {
        items.push({ kind: "streaming", id: "streaming-content", data: progress.streamingContent })
      }
    } else if (!progress.isComplete && !progress.pendingToolApproval && !progress.retryInfo?.isRetrying) {
      const alreadyHasLiveThinkingMessage = items.some((item) =>
        item.kind === "message" &&
        item.data.role === "assistant" &&
        item.data.isThinking &&
        !item.data.isComplete,
      )
      const alreadyHasCurrentStateFeedback = items.some((item) =>
        item.kind === "streaming" ||
        item.kind === "tool_approval" ||
        item.kind === "retry_status" ||
        item.kind === "tool_execution" ||
        item.kind === "tool_activity_group" ||
        (
          item.kind === "assistant_with_tools" &&
          (
            item.data.calls.length > 0 ||
            item.data.results.some((result) => !!result)
          )
        ),
      )

      const activeStep = [...progress.steps].reverse().find((step) => step.status === "in_progress")
      const shouldRenderActiveStep = shouldRenderChatRuntimeActivityStep(activeStep)

      if (!alreadyHasLiveThinkingMessage && !alreadyHasCurrentStateFeedback && shouldRenderActiveStep) {
        const text = formatChatRuntimeActivityContent(activeStep)

        items.push({
          kind: "streaming",
          id: "live-thinking-placeholder",
          data: { text, isStreaming: true, isPlaceholder: true },
        })
      }
    }

    const latestDelegationsByRunId = new Map<string, { delegation: ACPDelegationProgress; timestamp: number }>()
    for (const step of progress.steps) {
      if (!step.delegation) continue

      const sortTimestamp = step.timestamp ?? step.delegation.endTime ?? step.delegation.startTime
      const existing = latestDelegationsByRunId.get(step.delegation.runId)
      if (!existing || sortTimestamp >= existing.timestamp) {
        latestDelegationsByRunId.set(step.delegation.runId, {
          delegation: step.delegation,
          timestamp: sortTimestamp,
        })
      }
    }

    for (const { delegation } of latestDelegationsByRunId.values()) {
      items.push({
        kind: "delegation",
        id: `delegation-${delegation.runId}`,
        data: delegation,
      })
    }

    const timestampedItems = items.filter((item) => getItemTimestamp(item) !== null)
    const currentStateItems = items.filter((item) => getItemTimestamp(item) === null)

    timestampedItems.sort((a, b) => (getItemTimestamp(a) ?? 0) - (getItemTimestamp(b) ?? 0))
    const sortedItems = [...timestampedItems, ...currentStateItems]

    // --- Group consecutive tool-activity DisplayItems ---
    // assistant_with_tools items that contain respond_to_user must stay visible
    // because they represent user-facing output, not background tool churn.
    const isToolActivityItem = (item: DisplayItem): boolean => {
      if (item.kind === "tool_execution") return true
      if (item.kind !== "assistant_with_tools") return false
      return !item.data.calls.some((call) => isCompletionControlTool(call.name))
    }

    const grouped: DisplayItem[] = []
    let runStart: number | null = null

    const flushToolRun = (runEnd: number) => {
      if (runStart === null) return
      const count = runEnd - runStart + 1
      if (count < TOOL_GROUP_MIN_SIZE) {
        // Too small to group — emit items individually
        for (let j = runStart; j <= runEnd; j++) grouped.push(sortedItems[j])
        runStart = null
        return
      }
      const runItems = sortedItems.slice(runStart, runEnd + 1)
      // Collapsed preview surfaces every tool call in the run as a compact
      // token, in chronological order. execute_command renders as a balanced
      // `<command>:<output-preview>` label; other tools fall back to the tool
      // name. The CSS truncate handles overflow on narrow tiles, so we emit the
      // full list and let the layout shrink it.
      const groupSummary = getToolActivityRunSummary(runItems.map((it) => {
        const calls =
          it.kind === "assistant_with_tools"
            ? it.data.calls
            : it.kind === "tool_execution"
              ? it.data.calls
              : []
        const results =
          it.kind === "assistant_with_tools"
            ? it.data.results
            : it.kind === "tool_execution"
              ? it.data.results
              : []
        return {
          toolCalls: calls.map((call) => ({
            name: call.name,
            arguments: call.arguments ?? {},
          })),
          toolResults: results,
        }
      }))
      // Prefix the first child ID so the group stays stable as the run grows
      // without sharing expansion state with any child row.
      const groupId = getToolActivityGroupStateKey(runItems[0]?.id ?? runStart)
      grouped.push({
        kind: "tool_activity_group",
        id: groupId,
        data: {
          items: runItems,
          previewLines: groupSummary.previewLines,
          callCount: groupSummary.toolCallCount,
        },
      })
      runStart = null
    }

    for (let i = 0; i < sortedItems.length; i++) {
      if (isToolActivityItem(sortedItems[i])) {
        if (runStart === null) runStart = i
      } else {
        flushToolRun(i - 1)
        grouped.push(sortedItems[i])
      }
    }
    if (runStart !== null) flushToolRun(sortedItems.length - 1)

    return grouped
  }, [enrichedMessages, effectiveUserResponse, progress.retryInfo, progress.steps, progress.streamingContent, toolCallSteps])

  const visibleDisplayItems = displayItems
  const loadedConversationHistoryCount = conversationHistory?.length ?? 0
  const conversationHistoryTotalCount = Math.max(
    progress.conversationHistoryTotalCount ?? loadedConversationHistoryCount,
    loadedConversationHistoryCount,
  )
  const hiddenConversationHistoryCount = Math.max(
    0,
    conversationHistoryTotalCount - loadedConversationHistoryCount,
  )

  const getToolActivityGroupExpanded = useCallback((item: Extract<DisplayItem, { kind: "tool_activity_group" }>) => {
    return getChatDisplayGroupedExpansionState({
      groupState: expandedItems,
      groupKey: item.id,
      inheritedKey: item.data.items[0]?.id ?? null,
    })
  }, [expandedItems])

  useEffect(() => {
    setExpandedItems(prev => applyChatDisplayGroupedExpansionInheritance({
      groupState: prev,
      groups: displayItems
        .filter((item): item is Extract<DisplayItem, { kind: "tool_activity_group" }> => item.kind === "tool_activity_group")
        .map((item) => ({
          groupKey: item.id,
          inheritedKey: item.data.items[0]?.id ?? null,
        })),
    }))
  }, [displayItems])

  const delegationSummaryEntries = useMemo<AgentDelegationSummaryEntry[]>(() => {
    return getAgentDelegationSummaryEntries(progress.steps, { maxSubtitleLength: 140 })
  }, [progress.steps])

  const selectedDelegation = useMemo(
    () => delegationSummaryEntries.find((entry) => entry.delegation.runId === selectedDelegationRunId)?.delegation ?? null,
    [delegationSummaryEntries, selectedDelegationRunId],
  )

  const handleToggleDelegationSummaryCollapsed = useCallback(() => {
    setIsDelegationSummaryCollapsed((collapsed) => !collapsed)
  }, [])

  useEffect(() => {
    if (selectedDelegationRunId && !selectedDelegation) {
      setSelectedDelegationRunId(null)
    }
  }, [selectedDelegation, selectedDelegationRunId])

  const delegationSummaryMaxItems = variant === "tile" && !isFocused && !isExpanded ? 1 : 3

  const lastAssistantDisplayIndex = useMemo(() => {
    return findLastChatMessageConversationContentIndex<DisplayItem>(
      visibleDisplayItems,
      (item) => item.kind === "message" ? item.data : null,
      (item) => item.kind === "message" && hasVisibleChatMessageContent(item.data),
    )
  }, [visibleDisplayItems])

  // Reset auto-scroll tracking refs when session changes
  // This prevents stale high-water marks from blocking auto-scroll after a clear/new session
  useEffect(() => {
    if (progress?.sessionId !== lastSessionIdRef.current) {
      lastSessionIdRef.current = progress?.sessionId
      clearPendingInitialScrollAttempts()
      lastMessageCountRef.current = 0
      lastContentLengthRef.current = 0
      lastDisplayItemsCountRef.current = 0
      lastScrollContentHeightRef.current = 0
      // Also reset auto-scroll state for new sessions
      setShouldAutoScroll(true)
    }
  }, [clearPendingInitialScrollAttempts, progress?.sessionId])

  // Keep pinned-to-bottom streaming updates in the same paint as the content commit.
  // Using useLayoutEffect here avoids a one-frame lag where new content renders above
  // the fold and the scroll position only catches up on the next animation frame.
  useLayoutEffect(() => {
    if (!shouldAutoScrollContent) return
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    // Count the text that actually renders in CompactMessage: when a responseEvent
    // is attached (respond_to_user), the message displays event.text (which may
    // carry image markdown) instead of the streamed prose. Mirror that here so
    // attaching a final response to an existing assistant message still triggers
    // an auto-scroll even when message.content itself didn't grow.
    const totalContentLength = enrichedMessages.reduce(
      (sum, msg) => sum + (msg.responseEvent?.text?.length ?? msg.content?.length ?? 0),
      0,
    ) + (progress.streamingContent?.text?.length ?? 0)

    // Check if new messages were added, content changed (streaming), or displayItems changed
    // displayItems includes tool executions, tool approvals, retry status, and streaming content
    const hasNewMessages = enrichedMessages.length > lastMessageCountRef.current
    const hasContentChanged = totalContentLength > lastContentLengthRef.current
    const hasNewDisplayItems = visibleDisplayItems.length > lastDisplayItemsCountRef.current

    // Also detect when counts decrease (e.g., streaming item removed) and reset refs
    // This ensures auto-scroll works correctly when items are removed and new ones added
    const hasMessagesDecreased = enrichedMessages.length < lastMessageCountRef.current
    const hasDisplayItemsDecreased = visibleDisplayItems.length < lastDisplayItemsCountRef.current

    if (hasMessagesDecreased || hasDisplayItemsDecreased) {
      // Reset refs when counts decrease to avoid high-water mark issues
      lastMessageCountRef.current = enrichedMessages.length
      lastContentLengthRef.current = totalContentLength
      lastDisplayItemsCountRef.current = visibleDisplayItems.length
    }

    if (hasNewMessages || hasContentChanged || hasNewDisplayItems) {
      lastMessageCountRef.current = enrichedMessages.length
      lastContentLengthRef.current = totalContentLength
      lastDisplayItemsCountRef.current = visibleDisplayItems.length

      // Only auto-scroll if we should (user hasn't manually scrolled up)
      if (shouldAutoScroll) {
        scrollToBottom("auto")
      }
    }
  }, [enrichedMessages, progress.streamingContent?.text, scrollToBottom, shouldAutoScroll, shouldAutoScrollContent, visibleDisplayItems])

  // Re-pin to bottom when the rendered content grows asynchronously (e.g. images
  // in a respond_to_user response finish loading after the initial scroll). The
  // layout-effect above runs before images decode, so without a ResizeObserver
  // the final response can land above the fold in the default bottom-pinned state.
  useEffect(() => {
    if (!shouldAutoScrollContent) return undefined
    const scrollContainer = scrollContainerRef.current
    const contentNode = scrollContentRef.current
    if (!scrollContainer || !contentNode || typeof ResizeObserver === "undefined") {
      return undefined
    }

    lastScrollContentHeightRef.current = contentNode.scrollHeight

    const observer = new ResizeObserver(() => {
      const nextHeight = contentNode.scrollHeight
      const grew = nextHeight > lastScrollContentHeightRef.current
      lastScrollContentHeightRef.current = nextHeight
      if (grew && shouldAutoScrollRef.current) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    })

    observer.observe(contentNode)
    return () => observer.disconnect()
  }, [shouldAutoScrollContent, visibleDisplayItems.length > 0])

  // Initial scroll to bottom on mount and when first display item appears
  useEffect(() => {
    if (!shouldAutoScrollContent) return undefined
    if (!scrollContainerRef.current) return undefined

    clearPendingInitialScrollAttempts()

    // Multiple attempts to ensure scrolling works with dynamic content
    const scrollAttempts = [0, 50, 100, 200]
    pendingInitialScrollTimeoutsRef.current = scrollAttempts.map((delay) => {
      return setTimeout(() => {
        requestAnimationFrame(() => {
          if (!shouldAutoScrollRef.current) return
          scrollToBottom("auto")
        })
      }, delay)
    })

    return clearPendingInitialScrollAttempts
  }, [clearPendingInitialScrollAttempts, scrollToBottom, shouldAutoScrollContent, visibleDisplayItems.length > 0])

  // Make panel focusable when agent completes (overlay variant only)
  // This enables the continue conversation input to receive focus and be interactable
  useEffect(() => {
    if (variant === "overlay" && isComplete) {
      desktopPanelClient.setPanelFocusable({ focusable: true })
    }
  }, [variant, isComplete])

  // Handle scroll events to detect user interaction
  const handleScroll = () => {
    if (!shouldAutoScrollContent) return
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5 // 5px tolerance

    // If user scrolled to bottom, resume auto-scroll
    if (isAtBottom && !shouldAutoScroll) {
      setShouldAutoScroll(true)
      setIsUserScrolling(false)
    }
    // If user scrolled up from bottom, stop auto-scroll
    else if (!isAtBottom && shouldAutoScroll) {
      clearPendingInitialScrollAttempts()
      setShouldAutoScroll(false)
      setIsUserScrolling(true)
    }
  }

  // Check for errors
  const hasErrors = steps.some(
    (step) => step.status === "error" || step.toolResult?.error,
  )
  const sessionPresentation = getSessionPresentation({
    conversationState: progress.conversationState,
    isComplete,
    pendingToolApproval: progress.pendingToolApproval,
    hasErrors,
    wasStopped,
    isSnoozed: progress.isSnoozed,
    isFocused,
    isSessionExpanded: isExpanded,
  })
  const conversationState = sessionPresentation.lifecycleState
  const conversationStateLabel = sessionPresentation.label
  const conversationStateBadgeClass = sessionPresentation.badgeClassName
  const conversationStatusIndicatorState = getSessionStatusDesktopRenderState(sessionPresentation)
  const isSessionActiveForInput = conversationState === "running" || conversationState === "needs_input"
  const followUpInputPresentation = getFollowUpInputPresentation({
    conversationState,
    isInitializingSession: isFollowUpInputInitializing,
    isQueueEnabled,
  })

  // Get status indicator for tile variant
  const getStatusIndicator = () => {
    if (conversationStatusIndicatorState.kind === "needs_input") {
      return <Shield className={conversationStatusIndicatorState.iconClassName} />
    }
    if (conversationStatusIndicatorState.kind === "blocked") {
      return <XCircle className={conversationStatusIndicatorState.iconClassName} />
    }
    if (conversationStatusIndicatorState.kind === "background") {
      return <Moon className={conversationStatusIndicatorState.iconClassName} />
    }
    if (conversationStatusIndicatorState.kind === "running") {
      return <LoadingSpinner size="sm" className={conversationStatusIndicatorState.loadingSpinnerClassName} />
    }
    return <Check className={conversationStatusIndicatorState.iconClassName} />
  }

  // Get title for tile variant
  const getTitle = () => {
    const firstUserMsg = conversationHistory?.find(m => m.role === "user")
    const firstUserContent = firstUserMsg?.content
      ? (typeof firstUserMsg.content === "string" ? firstUserMsg.content : JSON.stringify(firstUserMsg.content))
      : undefined

    if (progress.conversationTitle) {
      const isLikelyCappedTitle = progress.conversationTitle.endsWith("...") || progress.conversationTitle.endsWith("…")
      if (isLikelyCappedTitle && firstUserContent && firstUserContent.length > progress.conversationTitle.length) {
        return firstUserContent
      }
      return progress.conversationTitle
    }

    if (firstUserContent) {
      return firstUserContent
    }

    return `Session ${progress.sessionId?.substring(0, 8) || "..."}`
  }

  const startTitleEditing = (title: string) => {
    if (!conversationId) return
    setEditingTitle(title)
    setIsTitleEditing(true)
  }

  const clearTitleEditing = () => {
    setIsTitleEditing(false)
    setEditingTitle("")
  }

  const saveTitleEdit = async (currentTitle: string) => {
    if (!conversationId) {
      clearTitleEditing()
      return
    }

    const nextTitle = editingTitle.trim()
    const previousTitle = currentTitle.trim()
    if (!nextTitle || nextTitle === previousTitle) {
      clearTitleEditing()
      return
    }

    try {
      const updatedConversation = await desktopConversationsClient.renameConversationTitle(conversationId, nextTitle)
      const updatedTitle = updatedConversation?.title || nextTitle
      const currentProgress = useAgentStore.getState().agentProgressById.get(progress.sessionId) ?? progress
      useAgentStore.getState().updateSessionProgress({
        ...currentProgress,
        conversationTitle: updatedTitle,
      })
      clearTitleEditing()

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["agentSessions"] }),
        queryClient.invalidateQueries({ queryKey: ["conversation-history"] }),
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] }),
      ])
    } catch (error) {
      console.error("Failed to rename conversation title:", error)
      toast.error("Failed to rename session title")
    }
  }

  const containerClasses = cn(
    "progress-panel flex flex-col w-full rounded-xl overflow-hidden",
    variant === "tile"
      ? cn(
          "transition-all duration-200 cursor-pointer",
          progress.pendingToolApproval
            ? "border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 ring-1 ring-amber-500/30"
            : isFocused
            ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/30"
            : "border-border bg-card hover:border-border/80 hover:bg-card/80",
          isResizing && "select-none"
        )
      : variant === "overlay"
      ? "bg-background/80 backdrop-blur-sm border border-border/50 h-full"
      : "bg-muted/20 backdrop-blur-sm border border-border/40 h-full",
    isDark ? "dark" : ""
  )

  // Tile variant rendering
  if (variant === "tile") {
    const hasPendingApproval = !!progress.pendingToolApproval
    const canCollapseTile = typeof onCollapsedChange === "function"
    const tileTitle = getTitle()
    return (
      <div
        onClick={onFocus}
        className={cn(containerClasses, "relative min-h-0 border h-full group/tile", className)}
        dir="ltr"
        style={{
          WebkitAppRegion: "no-drag"
        } as React.CSSProperties}
      >
        {/* Tile Header - draggable region for window dragging on macOS */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 border-b bg-muted/30 flex-shrink-0 app-drag-region",
            canCollapseTile && "cursor-pointer",
            isCollapsed ? "px-2.5 py-1.5" : "px-3 py-2",
          )}
          onClick={(e) => {
            // Prevent clicks on the header from bubbling to the tile container's
            // onFocus handler (which would open the floating panel "hover view").
            e.stopPropagation()
            if (canCollapseTile) handleToggleCollapse(e)
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center">
              {getStatusIndicator()}
            </div>
            {isTitleEditing && conversationId ? (
              <input
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void saveTitleEdit(tileTitle)
                  } else if (event.key === "Escape") {
                    event.preventDefault()
                    skipTitleSaveOnBlurRef.current = true
                    clearTitleEditing()
                  }
                }}
                onBlur={() => {
                  if (skipTitleSaveOnBlurRef.current) {
                    skipTitleSaveOnBlurRef.current = false
                    return
                  }
                  void saveTitleEdit(tileTitle)
                }}
                autoFocus
                className={cn(
                  "app-no-drag-region h-6 min-w-0 flex-1 rounded border border-input bg-background px-1.5 font-medium text-foreground shadow-sm outline-none ring-0 focus-visible:border-ring",
                  isCollapsed ? "text-xs" : "text-sm",
                )}
                aria-label={desktopRuntimeCopy.header.renameConversationTitleLabel}
              />
            ) : (
              <span
                role={conversationId ? "button" : undefined}
                tabIndex={conversationId ? 0 : undefined}
                onClick={(event) => {
                  event.stopPropagation()
                  startTitleEditing(tileTitle)
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return
                  event.preventDefault()
                  event.stopPropagation()
                  startTitleEditing(tileTitle)
                }}
                className={cn("truncate font-medium min-w-0 cursor-text", isCollapsed ? "text-xs" : "text-sm")}
                title={conversationId ? desktopRuntimeCopy.header.renameConversationTitleLabel : tileTitle}
              >
                {tileTitle}
              </span>
            )}
            <Badge variant="outline" className={cn("h-5 shrink-0 px-1.5 text-[10px]", conversationStateBadgeClass)}>
              {conversationStateLabel}
            </Badge>
          </div>
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 app-no-drag-region">
            {canCollapseTile && (
              <Button
                variant="ghost"
                size="sm-icon"
                className="shrink-0"
                onClick={handleToggleCollapse}
                title={isCollapsed
                  ? desktopRuntimeCopy.header.expandPanelTitle
                  : desktopRuntimeCopy.header.collapsePanelTitle}
              >
                {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </Button>
            )}

            {conversationId && (
              <Button
                variant="ghost"
                size="sm-icon"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePinSession(conversationId)
                }}
                title={getChatRuntimePinAccessibilityLabel(isPinned)}
                aria-label={getChatRuntimePinAccessibilityLabel(isPinned)}
                aria-pressed={isPinned}
              >
                <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-current text-foreground")} />
              </Button>
            )}
            {/* Combined close button: stops agent if running, dismisses if complete */}
            {!isComplete ? (
              <Button variant="ghost" size="sm-icon" className="shrink-0 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleKillConfirmation(); }} title={desktopRuntimeCopy.killSwitch.sessionButtonTitle}>
                <OctagonX className="h-3.5 w-3.5" />
              </Button>
            ) : onDismiss ? (
              <Button variant="ghost" size="sm-icon" className="shrink-0" onClick={(e) => { e.stopPropagation(); onDismiss(); }} title={desktopRuntimeCopy.killSwitch.dismissButtonTitle}>
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* Collapsible content */}
        {!isCollapsed && (
          <>
            {/* Tab toggle for Chat/Summary view - only show when summaries exist */}
            {(progress.stepSummaries?.length ?? 0) > 0 && (
              <div className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("chat"); }}
                  className={cn(
                    "inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    activeTab === "chat"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span className="truncate">Chat</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("summary"); }}
                  className={cn(
                    "inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    activeTab === "summary"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Brain className="h-3 w-3" />
                  <span className="truncate">Summary</span>
                  <Badge variant="secondary" className="ml-1 h-4 shrink-0 px-1 py-0 text-[10px]">
                    {progress.stepSummaries?.length ?? 0}
                  </Badge>
                </button>
              </div>
            )}

            {/* Message Stream (Chat Tab) */}
            <div className={cn("relative flex-1 min-h-0 flex flex-col", activeTab !== "chat" && (progress.stepSummaries?.length ?? 0) > 0 && "hidden")} onClick={(e) => e.stopPropagation()}>
              <DelegationSummaryStrip
                entries={delegationSummaryEntries}
                maxItems={delegationSummaryMaxItems}
                onOpenDetails={setSelectedDelegationRunId}
                isCollapsed={isDelegationSummaryCollapsed}
                onToggleCollapsed={handleToggleDelegationSummaryCollapsed}
              />
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto scrollbar-none"
              >
                {visibleDisplayItems.length > 0 ? (
                  <div ref={scrollContentRef} className="space-y-1 p-2">
                    {displayItems.length > visibleDisplayItems.length && (
                      <div className={desktopRuntimeSurface.visibleUpdatesSummaryClassName}>
                        {formatChatRuntimeVisibleUpdatesSummary(visibleDisplayItems.length)}
                      </div>
                    )}
                    {hiddenConversationHistoryCount > 0 && (
                      <div className={desktopRuntimeSurface.conversationHistoryBanner.containerClassName}>
                        <span>{formatChatRuntimeConversationHistorySummary(loadedConversationHistoryCount, conversationHistoryTotalCount)}</span>
                        {onLoadEarlierConversationHistory && (
                          <button
                            type="button"
                            disabled={isLoadingEarlierConversationHistory}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onLoadEarlierConversationHistory()
                            }}
                            className={desktopRuntimeSurface.conversationHistoryBanner.loadButtonClassName}
                          >
                            {formatChatRuntimeLoadEarlierLabel(
                              hiddenConversationHistoryCount,
                              CONVERSATION_HISTORY_PAGE_SIZE,
                              isLoadingEarlierConversationHistory,
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {visibleDisplayItems.map((item, index) => {
                      const itemKey = item.id
                      // Final assistant message should be expanded by default when agent is complete
                      // Tool executions should be collapsed by default to reduce visual clutter
                      // unless the user has explicitly toggled them.
                      const isFinalAssistantMessage = item.kind === "message" && index === lastAssistantDisplayIndex && isComplete
                      const isExpanded = getChatDisplayExpansionState(
                        expandedItems,
                        itemKey,
                        isFinalAssistantMessage,
                      )
                      const isLastAssistant = item.kind === "message" && item.data.role === "assistant" && index === lastAssistantDisplayIndex

                      if (item.kind === "message") {
                        const turnEntry = item.data.role === "user"
                          ? turnDurations.byUserTimestamp.get(item.data.timestamp)
                          : undefined
                        return (
                          <CompactMessage
                            key={itemKey}
                            message={item.data}
                            ttsText={item.data.responseEvent?.text ?? (isLastAssistant ? effectiveUserResponse : undefined)}
                            isLast={isLastAssistant}
                            isComplete={isComplete}
                            hasErrors={hasErrors}
                            wasStopped={wasStopped}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
                            variant="tile"
                            isFocused={isFocused}
                            sessionId={progress.sessionId}
                            isSnoozed={progress.isSnoozed}
                            parentObservedLiveProgress={observedSessionLiveProgressRef.current}
                            conversationId={progress.conversationId}
                            branchMessageIndex={item.data.branchMessageIndex}
                            turnDurationMs={turnEntry?.durationMs}
                            turnIsLive={turnEntry?.isLive}
                          />
                        )
                      } else if (item.kind === "assistant_with_tools") {
                        return (
                          <AssistantWithToolsBubble
                            key={itemKey}
                            data={item.data}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
                          />
                        )
                      } else if (item.kind === "tool_approval") {
                        return (
                          <ToolApprovalBubble
                            key={itemKey}
                            approval={item.data}
                            onApprove={handleApproveToolCall}
                            onDeny={handleDenyToolCall}
                            isResponding={isRespondingToApproval}
                          />
                        )
                      } else if (item.kind === "retry_status") {
                        return <RetryStatusBanner key={itemKey} retryInfo={item.data} />
                      } else if (item.kind === "streaming") {
                        return <StreamingContentBubble key={itemKey} streamingContent={item.data} />
                      } else if (item.kind === "delegation") {
                        const delegationExpanded = getChatDisplayExpansionState(expandedItems, itemKey)
                        return (
                          <DelegationBubble
                            key={itemKey}
                            delegation={item.data}
                            isExpanded={delegationExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, false)}
                          />
                        )
                      } else if (item.kind === "tool_activity_group") {
                        const groupExpanded = getToolActivityGroupExpanded(item)
                        return (
                          <ToolActivityGroupBubble
                            key={itemKey}
                            group={item.data}
                            isExpanded={groupExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, groupExpanded)}
                            renderItem={(child, childIdx) => {
                              const childKey = child.id || `group-child-${childIdx}`
                              const childExpanded = getChatDisplayExpansionState(expandedItems, childKey)
                              if (child.kind === "assistant_with_tools") {
                                return (
                                  <AssistantWithToolsBubble
                                    key={childKey}
                                    data={child.data}
                                    isExpanded={childExpanded}
                                    onToggleExpand={() => toggleItemExpansion(childKey, childExpanded)}
                                  />
                                )
                              }
                              return (
                                <ToolExecutionBubble
                                  key={childKey}
                                  execution={(child as any).data}
                                  isExpanded={childExpanded}
                                  onToggleExpand={() => toggleItemExpansion(childKey, childExpanded)}
                                />
                              )
                            }}
                          />
                        )
                      } else {
                        return (
                          <ToolExecutionBubble
                            key={itemKey}
                            execution={item.data}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
                          />
                        )
                      }
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" aria-hidden="true" />
                    <span className="sr-only">{desktopRuntimeCopy.activity.loadingAgentActivityAccessibilityLabel}</span>
                  </div>
                )}
              </div>
              {isUserScrolling && visibleDisplayItems.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShouldAutoScroll(true)
                    setIsUserScrolling(false)
                    scrollToBottom("smooth")
                  }}
                  className={desktopScrollToBottomSurface.buttonClassName}
                  title={desktopRuntimeCopy.scrollToBottom.accessibilityLabel}
                  aria-label={desktopRuntimeCopy.scrollToBottom.accessibilityLabel}
                >
                  <ChevronDown className={desktopScrollToBottomSurface.iconClassName} />
                  {desktopRuntimeCopy.scrollToBottom.latestLabel}
                </button>
              )}
            </div>

            {/* Tool Approval - Fixed position outside scroll area */}
            {progress.pendingToolApproval && (
              <div className="flex-shrink-0">
                <ToolApprovalBubble
                  approval={progress.pendingToolApproval}
                  onApprove={handleApproveToolCall}
                  onDeny={handleDenyToolCall}
                  isResponding={isRespondingToApproval}
                />
              </div>
            )}

            {/* Summary View Tab */}
            {activeTab === "summary" && (progress.stepSummaries?.length ?? 0) > 0 && (
              <div className="relative flex-1 min-h-0 overflow-y-auto p-3" onClick={(e) => e.stopPropagation()}>
                <AgentSummaryView
                  progress={progress}
                  conversationId={progress.conversationId}
                />
              </div>
            )}

            {/* Footer with status/model controls — always render so model picker, thinking,
                and verbosity stay reachable on inactive sessions too. */}
            <div
              className={cn(
                "border-t bg-muted/20 text-muted-foreground flex-shrink-0",
                "px-3 py-1.5 text-xs",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-x-2">
                  {profileName && (
                    <span className="text-[10px] text-primary/70 truncate max-w-[60px]">
                      {profileName}
                    </span>
                  )}
                  {profileName && <span className="text-muted-foreground/50">•</span>}
                  <SessionModelPicker modelInfo={modelInfo} compact />
                  <SessionThinkingPicker compact />
                  <SessionVerbosityPicker compact />
                  {!isComplete && contextInfo && contextInfo.maxTokens > 0 && (
                    <div className="flex shrink-0 items-center gap-1">
                      <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300 ease-out rounded-full",
                            contextInfo.estTokens / contextInfo.maxTokens > 0.9
                              ? "bg-red-500"
                              : contextInfo.estTokens / contextInfo.maxTokens > 0.7
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                          style={{
                            width: `${Math.min(100, (contextInfo.estTokens / contextInfo.maxTokens) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {totalTurnDurationBadgeState.canShow && (
                  <span
                    className={cn(
                      desktopRuntimeSurface.turnDurationBadge.compactClassName,
                      totalTurnDurationBadgeState.isLive && desktopRuntimeSurface.turnDurationBadge.liveClassName,
                    )}
                    title={totalTurnDurationBadgeState.title ?? undefined}
                  >
                    <Clock className={desktopRuntimeSurface.turnDurationBadge.compactIconClassName} aria-hidden="true" />
                    {totalTurnDurationBadgeState.label}
                  </span>
                )}
                {!isComplete && (
                  <span className="shrink-0 whitespace-nowrap">Step {currentIteration}/{isFinite(maxIterations) ? maxIterations : "∞"}</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Message Queue Panel - hidden when collapsed */}
        {!isCollapsed && hasQueuedMessages && progress.conversationId && (
          <div className="px-3 py-1.5 border-t flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <MessageQueuePanel
              conversationId={progress.conversationId}
              messages={queuedMessages}
              compact={false}
              isPaused={isQueuePaused}
            />
          </div>
        )}

        {/* Follow-up input - hidden when collapsed for compact view */}
        {!isCollapsed && (
          <TileFollowUpInput
            conversationId={progress.conversationId}
            sessionId={progress.sessionId}
            isSessionActive={isSessionActiveForInput}
            isInitializingSession={isFollowUpInputInitializing}
            presentation={followUpInputPresentation}
            agentName={profileName}
            conversationTitle={progress.conversationTitle}
            className="flex-shrink-0"
            onMessageSent={handleFollowUpSent}
            onVoiceContinue={onVoiceContinue}
          />
        )}

        {/* Kill Switch Confirmation Dialog */}
        {showKillConfirmation && (
          <div className={desktopKillSwitchDialogSurface.overlayClassName}>
            <div className={desktopKillSwitchDialogSurface.cardClassName}>
              <div className={desktopKillSwitchDialogSurface.headerClassName}>
                <AlertTriangle className={desktopKillSwitchDialogSurface.iconClassName} />
                <h3 className={desktopKillSwitchDialogSurface.titleClassName}>
                  {desktopRuntimeCopy.killSwitch.sessionTitle}
                </h3>
              </div>
              <p className={desktopKillSwitchDialogSurface.messageClassName}>
                {desktopRuntimeCopy.killSwitch.sessionMessage}
              </p>
              <div className={desktopKillSwitchDialogSurface.actionsClassName}>
                <Button variant="outline" size="sm" onClick={handleCancelKill} disabled={isKilling}>
                  {desktopRuntimeCopy.common.cancel}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleKillSwitch} disabled={isKilling}>
                  {isKilling
                    ? desktopRuntimeCopy.killSwitch.sessionPendingActionLabel
                    : desktopRuntimeCopy.killSwitch.sessionActionLabel}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default/Overlay variant rendering
  return (
    <div
      className={cn(containerClasses, "min-h-0", className)}
      dir="ltr"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Unified Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/30 bg-muted/10 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {wasStopped && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 shrink-0">
              Terminated
            </Badge>
          )}
          {/* Session title — prominent */}
          <span className="text-xs font-medium text-foreground truncate min-w-0">
            {getTitle()}
          </span>
          <Badge variant="outline" className={cn("h-5 shrink-0 px-1.5 text-[10px]", conversationStateBadgeClass)}>
            {conversationStateLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Profile/agent name — secondary */}
          {profileName && (
            <span className="text-[10px] text-primary/70 truncate max-w-[80px]">
              {profileName}
            </span>
          )}
          {/* Model/provider controls stay available even before live session metadata arrives */}
          <>
            {profileName && <span className="text-muted-foreground/50">•</span>}
            <SessionModelPicker modelInfo={modelInfo} />
            <SessionThinkingPicker />
            <SessionVerbosityPicker />
          </>
          {/* Context fill indicator */}
          {!isComplete && contextInfo && contextInfo.maxTokens > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300 ease-out rounded-full",
                    contextInfo.estTokens / contextInfo.maxTokens > 0.9
                      ? "bg-red-500"
                      : contextInfo.estTokens / contextInfo.maxTokens > 0.7
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                  style={{
                    width: `${Math.min(100, (contextInfo.estTokens / contextInfo.maxTokens) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                {Math.min(100, Math.round((contextInfo.estTokens / contextInfo.maxTokens) * 100))}%
              </span>
            </div>
          )}
          {totalTurnDurationBadgeState.canShow && (
            <span
              className={cn(
                desktopRuntimeSurface.turnDurationBadge.fullClassName,
                totalTurnDurationBadgeState.isLive && desktopRuntimeSurface.turnDurationBadge.liveClassName,
              )}
              title={totalTurnDurationBadgeState.title ?? undefined}
            >
              <Clock className={desktopRuntimeSurface.turnDurationBadge.fullIconClassName} aria-hidden="true" />
              {totalTurnDurationBadgeState.label}
            </span>
          )}
          {!isComplete && (
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {`${currentIteration}/${isFinite(maxIterations) ? maxIterations : "∞"}`}
            </span>
          )}
          {!isComplete ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleKillConfirmation}
              disabled={isKilling}
              title={desktopRuntimeCopy.killSwitch.sessionExecutionButtonTitle}
            >
              <OctagonX className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={handleClose}
              title={desktopRuntimeCopy.killSwitch.closeButtonTitle}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tab toggle for Chat/Summary view - only show when summaries exist */}
      {(progress.stepSummaries?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("chat"); }}
            className={cn(
              "inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              activeTab === "chat"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            <span className="truncate">Chat</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab("summary"); }}
            className={cn(
              "inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              activeTab === "summary"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Brain className="h-3 w-3" />
            <span className="truncate">Summary</span>
            <Badge variant="secondary" className="ml-1 h-4 shrink-0 px-1 py-0 text-[10px]">
              {progress.stepSummaries?.length ?? 0}
            </Badge>
          </button>
        </div>
      )}

      {/* Message Stream - Left-aligned content (Chat Tab) */}
      <div className={cn("relative flex min-h-0 flex-1 flex-col", activeTab !== "chat" && (progress.stepSummaries?.length ?? 0) > 0 && "hidden")}>
        <DelegationSummaryStrip
          entries={delegationSummaryEntries}
          maxItems={delegationSummaryMaxItems}
          onOpenDetails={setSelectedDelegationRunId}
          isCollapsed={isDelegationSummaryCollapsed}
          onToggleCollapsed={handleToggleDelegationSummaryCollapsed}
        />
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {visibleDisplayItems.length > 0 ? (
            <div ref={scrollContentRef} className="space-y-1 p-2">
              {displayItems.length > visibleDisplayItems.length && (
                <div className={desktopRuntimeSurface.visibleUpdatesSummaryClassName}>
                  {formatChatRuntimeVisibleUpdatesSummary(visibleDisplayItems.length)}
                </div>
              )}
              {hiddenConversationHistoryCount > 0 && (
                <div className={desktopRuntimeSurface.conversationHistoryBanner.containerClassName}>
                  <span>{formatChatRuntimeConversationHistorySummary(loadedConversationHistoryCount, conversationHistoryTotalCount)}</span>
                  {onLoadEarlierConversationHistory && (
                    <button
                      type="button"
                      disabled={isLoadingEarlierConversationHistory}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onLoadEarlierConversationHistory()
                      }}
                      className={desktopRuntimeSurface.conversationHistoryBanner.loadButtonClassName}
                    >
                      {formatChatRuntimeLoadEarlierLabel(
                        hiddenConversationHistoryCount,
                        CONVERSATION_HISTORY_PAGE_SIZE,
                        isLoadingEarlierConversationHistory,
                      )}
                    </button>
                  )}
                </div>
              )}
              {visibleDisplayItems.map((item, index) => {
                const itemKey = item.id || (item.kind === "message"
                  ? `msg-${messageStableId(item.data as any)}`
                  : item.kind === "tool_approval"
                  ? `approval-${(item.data as any).approvalId}`
                  : `exec-${(item as any).data?.id || (item as any).data?.timestamp}`)

                // Final assistant message should be expanded by default when agent is complete
                // Tool executions should be collapsed by default to reduce visual clutter
                // unless the user has explicitly toggled it.
                const isFinalAssistantMessage = item.kind === "message" && index === lastAssistantDisplayIndex && isComplete
                const isExpanded = getChatDisplayExpansionState(
                  expandedItems,
                  itemKey,
                  isFinalAssistantMessage,
                )

                if (item.kind === "message") {
                  const isLastAssistant = index === lastAssistantDisplayIndex
                  const turnEntry = item.data.role === "user"
                    ? turnDurations.byUserTimestamp.get(item.data.timestamp)
                    : undefined
                  return (
                    <CompactMessage
                      key={itemKey}
                      message={item.data}
                      ttsText={item.data.responseEvent?.text ?? (isLastAssistant ? effectiveUserResponse : undefined)}
                      isLast={isLastAssistant}
                      isComplete={isComplete}
                      hasErrors={hasErrors}
                      wasStopped={wasStopped}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
                      variant={variant}
                      isFocused={isFocused}
                      sessionId={progress.sessionId}
                      isSnoozed={progress.isSnoozed}
                      parentObservedLiveProgress={observedSessionLiveProgressRef.current}
                      conversationId={progress.conversationId}
                      branchMessageIndex={item.data.branchMessageIndex}
                      turnDurationMs={turnEntry?.durationMs}
                      turnIsLive={turnEntry?.isLive}
                    />
                  )
                } else if (item.kind === "assistant_with_tools") {
                  return (
                    <AssistantWithToolsBubble
                      key={itemKey}
                      data={item.data}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
                    />
                  )
                } else if (item.kind === "tool_approval") {
                  return (
                    <ToolApprovalBubble
                      key={itemKey}
                      approval={item.data}
                      onApprove={handleApproveToolCall}
                      onDeny={handleDenyToolCall}
                      isResponding={isRespondingToApproval}
                    />
                  )
                } else if (item.kind === "retry_status") {
                  return (
                    <RetryStatusBanner
                      key={itemKey}
                      retryInfo={item.data}
                    />
                  )
                } else if (item.kind === "streaming") {
                  return (
                    <StreamingContentBubble
                      key={itemKey}
                      streamingContent={item.data}
                    />
                  )
                } else if (item.kind === "delegation") {
                  const delegationExpanded = getChatDisplayExpansionState(expandedItems, itemKey)
                  return (
                    <DelegationBubble
                      key={itemKey}
                      delegation={item.data}
                      isExpanded={delegationExpanded}
                      onToggleExpand={() => toggleItemExpansion(itemKey, false)}
                      onOpenDetails={setSelectedDelegationRunId}
                    />
                  )
                } else if (item.kind === "tool_activity_group") {
                  const groupExpanded = getToolActivityGroupExpanded(item)
                  return (
                    <ToolActivityGroupBubble
                      key={itemKey}
                      group={item.data}
                      isExpanded={groupExpanded}
                      onToggleExpand={() => toggleItemExpansion(itemKey, groupExpanded)}
                      renderItem={(child, childIdx) => {
                        const childKey = child.id || `group-child-${childIdx}`
                        const childExpanded = getChatDisplayExpansionState(expandedItems, childKey)
                        if (child.kind === "assistant_with_tools") {
                          return (
                            <AssistantWithToolsBubble
                              key={childKey}
                              data={child.data}
                              isExpanded={childExpanded}
                              onToggleExpand={() => toggleItemExpansion(childKey, childExpanded)}
                            />
                          )
                        }
                        return (
                          <ToolExecutionBubble
                            key={childKey}
                            execution={(child as any).data}
                            isExpanded={childExpanded}
                            onToggleExpand={() => toggleItemExpansion(childKey, childExpanded)}
                          />
                        )
                      }}
                    />
                  )
                } else {
                  return (
                    <ToolExecutionBubble
                      key={itemKey}
                      execution={item.data}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
                    />
                  )
                }
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" aria-hidden="true" />
              <span className="sr-only">{desktopRuntimeCopy.activity.loadingAgentActivityAccessibilityLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tool Approval - Fixed position outside scroll area for overlay variant */}
      {progress.pendingToolApproval && (
        <div className="flex-shrink-0 mx-2 mb-2">
          <ToolApprovalBubble
            approval={progress.pendingToolApproval}
            onApprove={handleApproveToolCall}
            onDeny={handleDenyToolCall}
            isResponding={isRespondingToApproval}
          />
        </div>
      )}

      <DelegationDetailsDialog
        delegation={selectedDelegation}
        open={!!selectedDelegation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDelegationRunId(null)
          }
        }}
      />

      {/* Summary View Tab */}
      {activeTab === "summary" && (progress.stepSummaries?.length ?? 0) > 0 && (
        <div className="relative flex-1 min-h-0 overflow-y-auto p-3" onClick={(e) => e.stopPropagation()}>
          <AgentSummaryView
            progress={progress}
            conversationId={progress.conversationId}
          />
        </div>
      )}

      {/* Message Queue Panel - shows queued messages in overlay */}
      {hasQueuedMessages && progress.conversationId && (
        <div className="px-3 py-2 border-t flex-shrink-0">
          <MessageQueuePanel
            conversationId={progress.conversationId}
            messages={queuedMessages}
            compact={false}
            isPaused={isQueuePaused}
          />
        </div>
      )}

      {/* Follow-up input - for continuing conversation in the floating panel */}
      <OverlayFollowUpInput
        conversationId={progress.conversationId}
        sessionId={progress.sessionId}
        isSessionActive={isSessionActiveForInput}
        presentation={followUpInputPresentation}
        agentName={profileName}
        className="flex-shrink-0"
      />

      {/* Default variant: Original slim full-width progress bar */}
      {variant !== "overlay" && !isComplete && (
        <div className="h-0.5 w-full bg-muted/50">
          <div
            className={`h-full bg-primary transition-all duration-500 ease-out${!isFinite(maxIterations) ? " animate-pulse w-full" : ""}`}
            style={isFinite(maxIterations) ? {
              width: `${Math.min(100, (currentIteration / maxIterations) * 100)}%`,
            } : undefined}
          />
        </div>
      )}

      {/* Kill Switch Confirmation Dialog */}
      {showKillConfirmation && (
        <div className={desktopKillSwitchDialogSurface.overlayClassName}>
          <div className={desktopKillSwitchDialogSurface.cardClassName}>
            <div className={desktopKillSwitchDialogSurface.headerClassName}>
              <AlertTriangle className={desktopKillSwitchDialogSurface.iconClassName} />
              <h3 className={desktopKillSwitchDialogSurface.titleClassName}>
                {desktopRuntimeCopy.killSwitch.sessionTitle}
              </h3>
            </div>
            <p className={desktopKillSwitchDialogSurface.messageClassName}>
              {desktopRuntimeCopy.killSwitch.sessionMessageWithOtherSessions}
            </p>
            <div className={desktopKillSwitchDialogSurface.actionsClassName}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelKill}
                disabled={isKilling}
              >
                {desktopRuntimeCopy.common.cancel}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleKillSwitch}
                disabled={isKilling}
              >
                {isKilling
                  ? desktopRuntimeCopy.killSwitch.sessionPendingActionLabel
                  : desktopRuntimeCopy.killSwitch.sessionActionLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
