import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "@renderer/lib/utils"
import { AgentProgressUpdate, ACPDelegationProgress, ACPSubAgentMessage } from "../../../shared/types"
import { INTERNAL_COMPLETION_NUDGE_TEXT, RESPOND_TO_USER_TOOL, MARK_WORK_COMPLETE_TOOL } from "../../../shared/runtime-tool-names"
import { ChevronDown, ChevronUp, ChevronRight, X, AlertTriangle, Shield, Check, XCircle, Loader2, Clock, Copy, CheckCheck, GripHorizontal, Activity, Moon, Maximize2, Bot, OctagonX, MessageSquare, Brain, Volume2, Wrench, Play, Pause, Pin, GitBranch } from "lucide-react"
import { MarkdownRenderer } from "@renderer/components/markdown-renderer"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { tipcClient } from "@renderer/lib/tipc-client"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { useAgentStore, useMessageQueue, useIsQueuePaused } from "@renderer/stores"
import { AudioPlayer } from "@renderer/components/audio-player"
import { useConfigQuery, queryClient } from "@renderer/lib/queries"
import { useTheme } from "@renderer/contexts/theme-context"
import { logUI, logExpand } from "@renderer/lib/debug"
import { useNavigate } from "react-router-dom"
import { TileFollowUpInput } from "./tile-follow-up-input"
import { OverlayFollowUpInput } from "./overlay-follow-up-input"
import { MessageQueuePanel } from "@renderer/components/message-queue-panel"
import { useResizable, TILE_DIMENSIONS } from "@renderer/hooks/use-resizable"
import {
  type AgentUserResponseEvent,
  extractRespondToUserResponseEvents,
  formatArgumentsPreview,
  formatToolArguments,
  getAgentConversationStateLabel,
  getToolArgumentEntries,
  getToolCallPreview,
  getToolResultsSummary,
  normalizeAgentConversationState,
  TOOL_GROUP_PREVIEW_COUNT,
  TOOL_GROUP_MIN_SIZE,
  getToolActivitySummaryLine,
} from "@dotagents/shared"
import { ToolExecutionStats } from "./tool-execution-stats"
import { ACPSessionBadge } from "./acp-session-badge"
import { AgentSummaryView } from "./agent-summary-view"
import { LoadingSpinner } from "./ui/loading-spinner"
import { extractSubAgentToolDisplayContent } from "@shared/delegation-tool-display"
import { buildContentTTSKey, buildResponseEventTTSKey, hasTTSPlayed, markTTSPlayed, removeTTSKey } from "@renderer/lib/tts-tracking"
import { ttsManager } from "@renderer/lib/tts-manager"
import { sanitizeMessageContentForDisplay, sanitizeMessageContentForSpeech } from "@dotagents/shared/message-display-utils"
import { toast } from "sonner"

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

// Enhanced conversation message component

// Types for unified tool execution display items
type DisplayItem =
  | { kind: "message"; id: string; data: {
      role: "user" | "assistant" | "tool"
      content: string
      isComplete: boolean
      timestamp: number
      isThinking: boolean
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
  | { kind: "retry_status"; id: string; data: {
      isRetrying: boolean
      attempt: number
      maxAttempts?: number
      delaySeconds: number
      reason: string
      startedAt: number
    } }
  | { kind: "streaming"; id: string; data: {
      text: string
      isStreaming: boolean
    } }
  | { kind: "delegation"; id: string; data: ACPDelegationProgress }
  | { kind: "tool_activity_group"; id: string; data: {
      /** The original DisplayItems that were collapsed into this group. */
      items: DisplayItem[]
      /** Short single-line preview strings for the collapsed tool group. */
      previewLines: string[]
    } }

const formatStructuredPayloadValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value === undefined) return "undefined"
  try {
    const formatted = JSON.stringify(value, null, 2)
    return formatted ?? String(value)
  } catch {
    return String(value)
  }
}

const getPayloadValueType = (value: unknown): string => {
  if (Array.isArray(value)) return `array · ${value.length}`
  if (value === null) return "null"
  return typeof value
}

const StructuredToolPayload: React.FC<{
  payload: unknown
  variant?: "default" | "approval"
  tone?: "neutral" | "success" | "error"
  maxHeightClassName?: string
}> = ({ payload, variant = "default", tone = "neutral", maxHeightClassName = "max-h-48" }) => {
  const entries = getToolArgumentEntries(payload)
  const formattedFallback = entries.length === 0 ? formatToolArguments(payload) : ""
  const isApproval = variant === "approval"
  const fallbackToneClass = isApproval
    ? "bg-amber-100/70 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
    : tone === "success"
      ? "bg-green-50/50 text-foreground dark:bg-green-950/30"
      : tone === "error"
        ? "bg-red-50/50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
        : "bg-muted/40 text-foreground"
  const entryToneClass = isApproval
    ? "border-amber-200/70 bg-amber-100/30 dark:border-amber-800/60 dark:bg-amber-900/15"
    : tone === "success"
      ? "border-green-200/70 bg-green-50/50 dark:border-green-900/60 dark:bg-green-950/30"
      : tone === "error"
        ? "border-red-200/70 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/30"
        : "border-border/40 bg-background/40 dark:bg-muted/20"
  const entryHeaderBorderClass = isApproval
    ? "border-amber-200/60 dark:border-amber-800/50"
    : tone === "success"
      ? "border-green-200/60 dark:border-green-900/50"
      : tone === "error"
        ? "border-red-200/60 dark:border-red-900/50"
        : "border-border/30"
  const entryTextClass = isApproval
    ? "text-amber-950 dark:text-amber-100"
    : tone === "error"
      ? "text-red-700 dark:text-red-300"
      : "text-foreground"

  if (entries.length === 0) {
    if (!formattedFallback) return null
    return (
      <pre className={cn(
        "max-w-full overflow-x-auto overflow-y-auto rounded p-2 text-[10px] leading-relaxed whitespace-pre-wrap break-words scrollbar-thin",
        maxHeightClassName,
        fallbackToneClass,
      )}>
        {formattedFallback}
      </pre>
    )
  }

  return (
    <div className="space-y-1.5">
      {entries.map(({ key, value }) => {
        const text = formatStructuredPayloadValue(value)
        const isBlock = typeof value === "object" || text.includes("\n") || text.length > 96
        return (
          <div
            key={key}
            className={cn(
              "overflow-hidden rounded-md border",
              entryToneClass,
            )}
          >
            <div className={cn(
              "flex items-center justify-between gap-2 border-b px-2 py-1",
              entryHeaderBorderClass,
            )}>
              <span className="min-w-0 truncate font-mono text-[10px] font-semibold">{key}</span>
              <span className="shrink-0 text-[9px] uppercase tracking-wide opacity-50">{getPayloadValueType(value)}</span>
            </div>
            {isBlock ? (
              <pre className={cn(
                "max-w-full overflow-x-auto overflow-y-auto p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words scrollbar-thin",
                maxHeightClassName,
                entryTextClass,
              )}>
                {text}
              </pre>
            ) : (
              <div className={cn("px-2 py-1.5 font-mono text-[10px] leading-relaxed break-words", entryTextClass)}>
                {text}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function isCompletionControlTool(toolName: string): boolean {
  return toolName === RESPOND_TO_USER_TOOL || toolName === MARK_WORK_COMPLETE_TOOL
}

const MARKDOWN_IMAGE_PAYLOAD_REGEX = /!\[[^\]]*\]\((?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)[^)]*\)/gi

function stripMarkdownImagePayloads(content: string): string {
  return content.replace(MARKDOWN_IMAGE_PAYLOAD_REGEX, "")
}

function hasMarkdownImagePayload(content: string): boolean {
  return /!\[[^\]]*\]\((?:data:image\/|https?:\/\/|assets:\/\/conversation-image\/)[^)]*\)/i.test(content)
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

function normalizeAssistantResponseForDedupe(content: string | undefined): string {
  return (content ?? "").replace(/\s+/g, " ").trim()
}

function shouldAutoPlayTTSForVariant(
  variant: "default" | "overlay" | "tile",
  isSnoozed: boolean,
  isFocused: boolean = false,
  isFloatingPanelVisible: boolean = false,
): boolean {
  // The floating panel owns TTS auto-play while it is visible. Tile surfaces
  // in the main window defer so the same session isn't spoken twice.
  if (variant === "tile") return isFocused && !isFloatingPanelVisible
  return !isSnoozed
}

function normalizeProgressVariant(variant: string): "default" | "overlay" | "tile" {
  return variant === "overlay" || variant === "tile" ? variant : "default"
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
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
  /** Variant controls TTS auto-play; tile variants only auto-play when focused. */
  variant?: "default" | "overlay" | "tile"
  /** Focused session tiles are the primary conversation surface and may auto-play TTS. */
  isFocused?: boolean
  /** Session ID for tracking TTS playback across remounts */
  sessionId?: string
  /** Snoozed/background sessions must never auto-play overlay TTS */
  isSnoozed?: boolean
  /** Conversation ID for branching */
  conversationId?: string
  /** Absolute raw-history index to use when branching from this message */
  branchMessageIndex?: number
}

// Compact message component for space efficiency
const CompactMessageBase: React.FC<CompactMessageProps> = ({ message, ttsText, isLast, isComplete, hasErrors, wasStopped = false, isExpanded, onToggleExpand, variant = "default", isFocused = false, sessionId, isSnoozed = false, conversationId, branchMessageIndex }) => {
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
  const configQuery = useConfigQuery()
  const isFloatingPanelVisible = useAgentStore((s) => s.isFloatingPanelVisible)

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

  // Effective rendered content: prefer the attached respond_to_user event text
  // (which carries image markdown) over the assistant prose stored on the message.
  const effectiveContent = message.responseEvent?.text ?? message.content ?? ""

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
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy response:", err)
    }
  }

  // Branch conversation from this message
  const handleBranchFromMessage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!conversationId || branchMessageIndex == null) return
    try {
      const branched = await tipcClient.branchConversation({
        conversationId,
        messageIndex: branchMessageIndex,
      })
      if (branched) {
        queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
        navigate(`/${branched.id}`)
        toast.success("Conversation branched")
      } else {
        toast.error("Failed to branch conversation")
      }
    } catch (err) {
      console.error("Failed to branch conversation:", err)
      toast.error("Failed to branch conversation")
    }
  }, [branchMessageIndex, conversationId, navigate])

  const displayResults = (message.toolResults || []).filter(
    (r) =>
      (r.error && r.error.trim().length > 0) ||
      (r.content && r.content.trim().length > 0),
  )
  const hasExtras =
    (message.toolCalls?.length ?? 0) > 0 ||
    displayResults.length > 0
  const effectiveTextContentLength = stripMarkdownImagePayloads(effectiveContent).length
  const collapseLengthLimit = hasMarkdownImagePayload(effectiveContent) ? 500 : 100
  const shouldCollapse = effectiveTextContentLength > collapseLengthLimit || hasExtras

  // Track the computed ttsSource (ttsText || effectiveContent) since that's what determines the
  // ttsKey and should also gate async state updates.
  const ttsSource = sanitizeMessageContentForSpeech(ttsText || effectiveContent)
  const latestTtsSourceRef = useRef(ttsSource)
  latestTtsSourceRef.current = ttsSource
  const ttsGenerationIdRef = useRef(0)

  // TTS functionality
  const generateAudio = async (): Promise<ArrayBuffer> => {
    if (!configQuery.data?.ttsEnabled) {
      throw new Error("TTS is not enabled")
    }

    const generationId = ++ttsGenerationIdRef.current
    const generationSource = ttsSource

    setIsGeneratingAudio(true)
    setTtsError(null)

    try {
      const result = await tipcClient.generateSpeech({
        text: generationSource,
      })

      // Ignore stale completions if the TTS source changed while this request was in-flight.
      if (
        ttsGenerationIdRef.current !== generationId ||
        latestTtsSourceRef.current !== generationSource
      ) {
        return result.audio
      }

      setAudioData(result.audio)
      setAudioMimeType(result.mimeType)
      return result.audio
    } catch (error) {
      console.error("[TTS UI] Failed to generate TTS audio:", error)

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

  // Check if TTS button should be shown for this message (any completed assistant message with content)
  const shouldShowTTSButton =
    message.role === "assistant" &&
    configQuery.data?.ttsEnabled &&
    !!ttsSource &&
    (isComplete || !!message.responseEvent)
  // Auto-play only the latest assistant message. Older response-linked messages
  // remain manually replayable but should not all auto-play after reload/remount.
  const shouldAutoPlayTTS = shouldShowTTSButton && isLast
  const shouldAutoPlayLoadedAudio =
    shouldAutoPlayTTS &&
    shouldAutoPlayTTSForVariant(messageVariant, isSnoozed, isFocused, isFloatingPanelVisible) &&
    (configQuery.data?.ttsAutoPlay ?? true) &&
    lastAutoPlayedSourceRef.current === ttsSource

  // Auto-play TTS when assistant message completes (but NOT if agent was stopped by kill switch)
  //
  // TTS AUTO-PLAY STRATEGY:
  // - Auto-play in the primary full conversation and overlay surfaces.
  // - Never auto-play tile previews/expansion content.
  // - Snoozed sessions intentionally don't auto-play TTS
  //   (they run silently in background - user can unsnooze to see/hear them)
  // - Additionally, we track which sessions have already played TTS in a module-level set
  //   to prevent double playback when AgentProgress remounts (e.g., when switching between
  //   single-session and multi-session views in the panel)
  useEffect(() => {
    const shouldAutoPlay = shouldAutoPlayTTSForVariant(messageVariant, isSnoozed, isFocused, isFloatingPanelVisible)
    const ttsAutoPlayEnabled = configQuery.data?.ttsAutoPlay ?? true

    if (!shouldAutoPlay || !shouldAutoPlayTTS || !ttsAutoPlayEnabled || audioData || isGeneratingAudio || ttsError || wasStopped) {
      return
    }

    // Synthetic pending-resume tiles render saved conversation history before a
    // live session exists (e.g. after branching). The last assistant message is
    // historical, so auto-playing its TTS would replay an already-heard response.
    if (sessionId?.startsWith("pending-")) {
      return
    }

    // Guard against replaying the same content on follow-up user messages.
    // When a user sends a follow-up, the message list re-evaluates and this effect
    // can re-fire even though the agent response hasn't changed. (fixes #72)
    if (ttsSource && lastAutoPlayedSourceRef.current === ttsSource) {
      return
    }

    const ttsKeys = [
      message.responseEvent ? buildResponseEventTTSKey(sessionId, message.responseEvent.id, "final") : null,
      buildContentTTSKey(sessionId, ttsSource, "final"),
    ].filter((key, index, arr): key is string => Boolean(key) && arr.indexOf(key) === index)

    // If this response was already spoken from a mid-turn card or an earlier render, skip.
    if (ttsKeys.some((key) => hasTTSPlayed(key))) {
      return
    }

    // Mark as playing before starting generation to prevent race conditions
    if (ttsKeys.length > 0) {
      ttsKeys.forEach((key) => markTTSPlayed(key))
      inFlightTtsKeysRef.current = ttsKeys
    }

    // Track the source we're auto-playing to prevent replay on follow-up
    lastAutoPlayedSourceRef.current = ttsSource

    generateAudio()
      .then(() => {
        // Generation succeeded, clear the in-flight ref (keys stay in the set permanently)
        inFlightTtsKeysRef.current = []
      })
      .catch((error) => {
        // If generation fails, remove from the set so user can retry
        // Only remove if these are still the in-flight keys (prevents race conditions
        // where a newer render re-added the keys and this old catch handler would delete them).
        if (
          ttsKeys.length > 0 &&
          inFlightTtsKeysRef.current.length === ttsKeys.length &&
          inFlightTtsKeysRef.current.every((key) => ttsKeys.includes(key))
        ) {
          ttsKeys.forEach((key) => removeTTSKey(key))
          inFlightTtsKeysRef.current = []
        }
        // Clear the auto-played source so the user can retry
        if (lastAutoPlayedSourceRef.current === ttsSource) {
          lastAutoPlayedSourceRef.current = null
        }
        // Error is already handled in generateAudio function
      })
  }, [shouldAutoPlayTTS, configQuery.data?.ttsAutoPlay, audioData, isGeneratingAudio, isFocused, isSnoozed, isFloatingPanelVisible, ttsError, wasStopped, variant, sessionId, ttsSource, message.responseEvent])

  const getRoleStyle = () => {
    switch (message.role) {
      case "user":
        return "border border-blue-200/60 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/30"
      case "assistant":
        return isComplete && isLast && !hasErrors
          ? "border border-green-200/60 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/30"
          : "border border-border/40 bg-muted/30"
      case "tool":
        return "border border-amber-200/60 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/20"
      default:
        return "border border-border/40 bg-muted/30"
    }
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

  const shouldToggleFromContentClick = shouldCollapse && !isExpanded

  return (
    <div className={cn(
      "relative rounded-md text-xs transition-all duration-200",
      getRoleStyle(),
      shouldToggleFromContentClick && "hover:brightness-95 dark:hover:brightness-110 cursor-pointer"
    )}>
      <div
        className="flex items-start px-2.5 py-1.5 text-left"
        onClick={shouldToggleFromContentClick ? handleToggleExpand : undefined}
      >
        <div className="flex-1 min-w-0">
          <div className={cn(
            "leading-relaxed text-left",
            !isExpanded && shouldCollapse && "line-clamp-2"
          )}>
          <MarkdownRenderer content={effectiveContent.trim()} />
          </div>
          {hasExtras && isExpanded && (
            <div className="mt-2 space-y-2 text-left">
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold opacity-70">Tool Calls ({message.toolCalls.length}):</div>
                  {message.toolCalls.map((toolCall, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border/30 bg-muted/20 p-2 text-xs"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 truncate font-mono font-semibold text-primary" title={toolCall.name}>
                          {toolCall.name}
                        </span>
                        <Badge variant="outline" className="shrink-0 whitespace-nowrap text-xs">
                          Tool {index + 1}
                        </Badge>
                      </div>
                      {toolCall.arguments && (
                        <div>
                          <div className="mb-1 text-xs font-medium opacity-70">
                            Parameters:
                          </div>
                          <StructuredToolPayload payload={toolCall.arguments} maxHeightClassName="max-h-80" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {displayResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold opacity-70">Tool Results ({displayResults.length}):</div>
                  {displayResults.map((result, index) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded-lg border p-2 text-xs",
                        result.success
                          ? "border-green-200/50 bg-green-50/30 text-green-800 dark:border-green-700/50 dark:bg-green-950/40 dark:text-green-200"
                          : "border-red-200/50 bg-red-50/30 text-red-800 dark:border-red-700/50 dark:bg-red-950/40 dark:text-red-200",
                      )}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "flex min-w-0 flex-1 items-center gap-1 font-semibold",
                          result.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {result.success ? (
                            <><Check className="h-3 w-3" /> Success</>
                          ) : (
                            <><XCircle className="h-3 w-3" /> Error</>
                          )}
                        </span>
                        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
                          <span className="whitespace-nowrap font-mono text-[10px] opacity-60">
                            {(result.content?.length || 0).toLocaleString()} chars
                          </span>
                          <Badge variant="outline" className="shrink-0 whitespace-nowrap text-xs">
                            Result {index + 1}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-medium opacity-70 mb-1">
                            Content:
                          </div>
                          <pre className="rounded bg-muted/30 p-2 text-xs whitespace-pre-wrap break-words overflow-x-auto overflow-y-auto max-w-full max-h-80 scrollbar-thin">
                            {result.content || "No content returned"}
                          </pre>
                        </div>

                        {result.error && (
                          <div>
                            <div className="text-xs font-medium text-destructive mb-1">
                              Error Details:
                            </div>
                            <pre className="rounded bg-destructive/10 p-2 text-xs whitespace-pre-wrap break-words overflow-x-auto overflow-y-auto max-w-full max-h-60 scrollbar-thin">
                              {result.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* TTS playing indicator — click to pause */}
          {(isTTSPlaying || isGeneratingAudio) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                ttsManager.stopAll("agent-progress-message-pause")
              }}
              className={cn(
                "p-1 rounded hover:bg-muted/30 transition-colors",
                isTTSPlaying && "animate-pulse"
              )}
              title={isGeneratingAudio ? "Generating audio…" : "Pause TTS"}
              aria-label={isGeneratingAudio ? "Generating audio" : "Pause TTS"}
            >
              {isGeneratingAudio ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              ) : (
                <Volume2 className="h-3 w-3 text-blue-500" />
              )}
            </button>
          )}
          {/* Branch button for user/assistant messages with a valid conversation */}
          {conversationId && branchMessageIndex != null && (message.role === "user" || message.role === "assistant") && (
            <button
              onClick={handleBranchFromMessage}
              className="p-1 rounded hover:bg-muted/30 transition-colors"
              title="Branch from here"
              aria-label="Branch conversation from this message"
            >
              <GitBranch className="h-3 w-3 opacity-60 hover:opacity-100" />
            </button>
          )}
          {/* Copy button for user prompts and all completed assistant responses */}
          {(message.role === "user" || (message.role === "assistant" && isComplete)) && (
            <button
              onClick={handleCopyResponse}
              className="p-1 rounded hover:bg-muted/30 transition-colors"
              title={isCopied ? "Copied!" : message.role === "user" ? "Copy prompt" : "Copy response"}
              aria-label={isCopied ? "Copied!" : message.role === "user" ? "Copy prompt" : "Copy response"}
            >
              {isCopied ? (
                <CheckCheck className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
              )}
            </button>
          )}
          {shouldCollapse && (
            <button
              onClick={handleChevronClick}
              className="p-1 rounded hover:bg-muted/30 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
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
  prev.message.responseEvent?.id === next.message.responseEvent?.id &&
  prev.conversationId === next.conversationId &&
  prev.branchMessageIndex === next.branchMessageIndex
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
  rowClassName = "px-1.5 py-0.5",
  detailsClassName = "mt-1 ml-3 space-y-1 border-l border-border/50 pl-2",
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
      <div className="space-y-0.5 text-xs">
        {toolCallEntries.map(({ call, result }, idx) => {
          const callIsPending = !result
          const callSuccess = result?.success
          const toolPreview = getToolCallPreview({ name: call.name, arguments: call.arguments ?? {} })

          return (
            <div key={idx}>
              <div
                className={cn(
                  "flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded text-[11px] cursor-pointer hover:bg-muted/30",
                  rowClassName,
                  callIsPending
                    ? "text-blue-600 dark:text-blue-400"
                    : callSuccess
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                )}
                onClick={onToggleDetails}
              >
                <span className="min-w-0 flex-1 truncate whitespace-nowrap font-mono font-medium" title={call.name}>
                  {toolPreview}
                </span>
                <span className="shrink-0 text-[10px] opacity-60">
                  {callIsPending ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : callSuccess ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <XCircle className="h-2.5 w-2.5" />
                  )}
                </span>
                <ChevronRight className={cn(
                  "h-2.5 w-2.5 opacity-40 flex-shrink-0 transition-transform",
                  detailsExpanded && "rotate-90"
                )} />
              </div>
            </div>
          )
        })}
      </div>

      {detailsExpanded && (
        <div className={detailsClassName}>
          {toolCallEntries.map(({ call, result }, idx) => {
            const callIsPending = !result
            const formattedArguments = formatToolArguments(call.arguments)
            return (
              <div key={idx} className="text-[10px] space-y-1">
                {formattedArguments && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="min-w-0 font-medium opacity-70">Parameters</span>
                      <Button size="sm" variant="ghost" className="h-5 shrink-0 px-1.5 text-[10px]" onClick={(e) => handleCopy(e, formattedArguments)}>
                        <Copy className="h-2 w-2 mr-0.5" /> Copy
                      </Button>
                    </div>
                    <StructuredToolPayload payload={call.arguments} maxHeightClassName="max-h-52" />
                  </>
                )}
                {result && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className={cn(
                        "min-w-0 flex-1 font-medium",
                        result.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {result.success ? "Result" : "Error"}
                      </span>
                      <span className="shrink-0 whitespace-nowrap opacity-50 text-[10px]">{(result.content?.length || 0).toLocaleString()} chars</span>
                    </div>
                    {result.error && (
                      <pre className="rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px] bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
                        {result.error}
                      </pre>
                    )}
                    {result.content && (
                      <StructuredToolPayload payload={result.content} tone={result.success ? "success" : "error"} maxHeightClassName="max-h-52" />
                    )}
                    {!result.error && !result.content && (
                      <pre className="rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px] bg-muted/40">
                        No content
                      </pre>
                    )}
                  </>
                )}
                {callIsPending && (
                  <div className="text-[10px] opacity-60 italic py-1 flex items-center gap-1" role="status" aria-label="Waiting for response">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Waiting for response</span>
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
      rowClassName="px-1.5 py-0.5"
      detailsClassName="mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]"
    />
  )
}

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
  const isPending = toolCallEntries.some(({ result }) => !result)
  const allSuccess = resolvedResults.length > 0 && toolCallEntries.every(({ result }) => result?.success === true)
  const hasThought = data.thought && data.thought.trim().length > 0
  const shouldCollapse = (data.thought?.length ?? 0) > 100 || toolCallEntries.length > 0

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

  // Tool names for display
  const toolNames = data.calls.map(c => c.name).join(', ')
  const toolCount = data.calls.length

  return (
    <div className={cn(
      "rounded-md text-xs transition-all duration-200",
      "border border-border/40 bg-muted/30",
      !isExpanded && shouldCollapse && "hover:brightness-95 dark:hover:brightness-110",
      shouldCollapse && "cursor-pointer"
    )}>
      {/* Thought content section */}
      <div
        className="flex items-start px-2.5 py-1.5 text-left"
        onClick={handleToggleExpand}
      >
        <div className="flex-1 min-w-0">
          {hasThought && (
            <div className={cn(
              "leading-relaxed text-left",
              !isExpanded && shouldCollapse && "line-clamp-2"
            )}>
              <MarkdownRenderer content={data.thought.trim()} />
            </div>
          )}

          <div className={hasThought ? "mt-1" : ""}>
            <CompactToolExecutionList
              calls={data.calls}
              results={data.results}
              detailsExpanded={showToolDetails}
              onToggleDetails={handleToggleToolDetails}
              rowClassName="px-1 py-0.5"
              detailsClassName="mt-1 ml-3 space-y-1 border-l border-border/50 pl-2"
              executionStats={data.executionStats}
            />
          </div>
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
  }
  isExpanded: boolean
  onToggleExpand: () => void
  /** Render a single child DisplayItem when the group is expanded. */
  renderItem: (item: DisplayItem, index: number) => React.ReactNode
}> = ({ group, isExpanded, onToggleExpand, renderItem }) => {
  const totalCount = group.items.length
  const collapsedPreviewLine = group.previewLines.join(', ')

  return (
    <div className={cn(
      "rounded-md text-xs transition-all duration-200",
      "border border-border/40 bg-muted/20",
      !isExpanded && "hover:brightness-95 dark:hover:brightness-110 cursor-pointer",
    )}>
      {/* Collapsed header */}
      <div
        className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5"
        onClick={() => !isExpanded && onToggleExpand()}
      >
        <Wrench className="h-3 w-3 shrink-0 text-muted-foreground/70" aria-hidden="true" />
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
          {totalCount} tool step{totalCount === 1 ? "" : "s"}
        </span>
        {!isExpanded && collapsedPreviewLine && (
          <span className="min-w-0 flex-1 truncate whitespace-nowrap font-mono text-[10px] text-muted-foreground/70">
            {collapsedPreviewLine}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          className="ml-auto shrink-0 p-0.5 rounded hover:bg-muted/30 transition-colors"
          aria-label={isExpanded ? "Collapse tool group" : "Expand tool group"}
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
          )}
        </button>
      </div>

      {/* Expanded: render all child items */}
      {isExpanded && (
        <div className="px-1.5 pb-1.5 space-y-1">
          {group.items.map((item, idx) => renderItem(item, idx))}
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
  const argsPreview = formatArgumentsPreview(approval.arguments)

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30">
        <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="min-w-0 flex-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          {isResponding ? "Processing..." : "Tool Approval Required"}
        </span>
        {isResponding && (
          <Loader2 className="ml-auto h-3 w-3 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
        )}
      </div>

      {/* Content */}
      <div ref={containerRef} className={cn("min-w-0 px-3 py-2", isResponding && "opacity-60")}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs text-amber-700 dark:text-amber-300">Tool:</span>
          <code className="max-w-full min-w-0 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
            {approval.toolName}
          </code>
        </div>

        {/* Arguments preview - always visible */}
        {argsPreview && (
          <div
            className="mb-2 rounded-md border border-amber-200/70 bg-amber-100/40 px-2 py-1.5 text-[11px] font-mono leading-relaxed text-amber-700/80 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300/80 line-clamp-2 break-words [overflow-wrap:anywhere]"
            title={argsPreview}
          >
            {argsPreview}
          </div>
        )}

        {/* Expandable arguments */}
        <div className="mb-3">
          <button
            onClick={() => setShowArgs(!showArgs)}
            className="inline-flex max-w-full items-center gap-1 text-left text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            disabled={isResponding}
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", showArgs && "rotate-90")} />
            {showArgs ? "Hide" : "View"} full arguments
          </button>
          {showArgs && (
            <div className="mt-1.5">
              <StructuredToolPayload payload={approval.arguments} variant="approval" maxHeightClassName="max-h-48" />
            </div>
          )}
        </div>

        {/* Action buttons with hotkey hints */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 min-w-[7rem] flex-1 border-red-300 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={onDeny}
              disabled={isResponding}
              title="Press Shift+Space to deny"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Deny
            </Button>
            <Button
              size="sm"
              className={cn(
                "h-7 min-w-[7rem] flex-1 text-xs text-white",
                isResponding
                  ? "cursor-not-allowed bg-green-500"
                  : "bg-green-600 hover:bg-green-700"
              )}
              onClick={onApprove}
              disabled={isResponding}
              title="Press Space to approve"
            >
              {isResponding ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Approve
                </>
              )}
            </Button>
          </div>
          {!isResponding && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-amber-700/80 dark:text-amber-300/80">
              <span className="shrink-0 font-medium uppercase tracking-wider opacity-70">Hotkeys</span>
              <div className="flex flex-wrap items-center gap-1">
                <kbd className="rounded bg-green-700 px-1 py-0.5 font-mono text-[10px] text-white">Space</kbd>
                <span>Approve</span>
              </div>
              <span className="opacity-40" aria-hidden="true">•</span>
              <div className="flex flex-wrap items-center gap-1">
                <kbd className="rounded bg-red-100 px-1 py-0.5 font-mono text-[10px] text-red-700 dark:bg-red-900/50 dark:text-red-300">Shift+Space</kbd>
                <span>Deny</span>
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
  retryInfo: {
    isRetrying: boolean
    attempt: number
    maxAttempts?: number
    delaySeconds: number
    reason: string
    startedAt: number
  }
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

  const attemptText = retryInfo.maxAttempts
    ? `Attempt ${retryInfo.attempt}/${retryInfo.maxAttempts}`
    : `Attempt ${retryInfo.attempt}`

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30">
        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="min-w-0 flex-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          {retryInfo.reason}
        </span>
        <Loader2 className="ml-auto h-3 w-3 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
      </div>

      {/* Content */}
      <div className="min-w-0 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs text-amber-700 dark:text-amber-300">
            {attemptText}
          </span>
          <span className="max-w-full min-w-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-mono font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
            Retrying in {countdown}s
          </span>
        </div>
        <p className="mt-1.5 text-xs text-amber-600 break-words dark:text-amber-400">
          The agent will automatically retry when the API is available.
        </p>
      </div>
    </div>
  )
}

// Subagent Conversation Message - individual message in the collapsible conversation
const DELEGATION_COMPACT_WIDTH = 360

const truncatePreview = (text: string | undefined, maxLength: number): string => {
  const normalized = (text ?? "").trim().replace(/\s+/g, " ")
  if (!normalized) return ""
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

const formatDelegationStatus = (status: ACPDelegationProgress["status"]): string => {
  switch (status) {
    case "pending":
    case "spawning":
      return "Starting"
    case "running":
      return "Running"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    case "failed":
    default:
      return "Failed"
  }
}

const getDelegationSubtitle = (delegation: ACPDelegationProgress, maxLength: number): string => {
  const source = delegation.status === "failed"
    ? delegation.error ?? delegation.progressMessage
    : delegation.status === "completed"
      ? delegation.resultSummary ?? delegation.progressMessage
      : delegation.progressMessage

  const conversationPreview = delegation.conversation?.length
    ? getConversationPreview(delegation.conversation, delegation.agentName, maxLength)
    : ""

  return truncatePreview(source, maxLength) || conversationPreview || truncatePreview(delegation.task, maxLength)
}

const getConversationPreview = (
  conversation: ACPSubAgentMessage[],
  agentName: string,
  maxLength: number,
): string => {
  const lastMessage = conversation[conversation.length - 1]
  if (!lastMessage) return "No conversation yet"

  const roleLabel = lastMessage.role === "assistant"
    ? agentName
    : lastMessage.role === "tool"
      ? lastMessage.toolName || "Tool"
      : "Task"

  return truncatePreview(`${roleLabel}: ${lastMessage.content}`, maxLength)
}

const getDelegationSourceLabel = (delegation: ACPDelegationProgress): string => {
  switch (delegation.connectionType) {
    case "internal":
      return "Internal session"
    case 'acpx':
    case 'acp':
    case 'stdio':
      return delegation.acpSessionId ? 'acpx session' : 'acpx agent'
    case "remote":
      return delegation.acpRunId ? "Remote ACP run" : "Remote agent"
    default:
      return "Delegated run"
  }
}

const getDelegationTrackingLabel = (delegation: ACPDelegationProgress): string | null => {
  if (delegation.subSessionId) return `Session ${delegation.subSessionId.slice(-8)}`
  if (delegation.acpSessionId) return `Session ${delegation.acpSessionId.slice(-8)}`
  if (delegation.acpRunId) return `Run ${delegation.acpRunId.slice(-8)}`
  return null
}

const getDelegationActivityTimestamp = (delegation: ACPDelegationProgress): number => (
  delegation.conversation?.[delegation.conversation.length - 1]?.timestamp
    ?? delegation.endTime
    ?? delegation.startTime
)

type DelegationSummaryEntry = {
  delegation: ACPDelegationProgress
  statusLabel: string
  subtitle: string
  sourceLabel: string
  trackingLabel: string | null
  messageCount: number
  isActive: boolean
  activityTimestamp: number
}

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
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy message:", err)
    }
  }

  const isLongContent = message.content.length > 300
  const shouldShowToggle = isLongContent
  const toolContent = useMemo(() => {
    if (message.role !== "tool") return null

    return extractSubAgentToolDisplayContent(message.content ?? "")
  }, [message.content, message.role])
  const roleMeta = (() => {
    switch (message.role) {
      case "user":
        return {
          label: "Task",
          containerClass: "border-blue-200/80 bg-blue-50/70 dark:border-blue-800/60 dark:bg-blue-950/30",
          badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
          iconClass: "text-blue-600 dark:text-blue-300",
          Icon: MessageSquare,
        }
      case "assistant":
        return {
          label: agentName,
          containerClass: "border-purple-200/80 bg-purple-50/70 dark:border-purple-800/60 dark:bg-purple-950/30",
          badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-200",
          iconClass: "text-purple-600 dark:text-purple-300",
          Icon: Bot,
        }
      case "tool":
        return {
          label: message.toolName || toolContent?.toolName || "Tool",
          containerClass: "border-amber-200/80 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30",
          badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
          iconClass: "text-amber-600 dark:text-amber-300",
          Icon: Wrench,
        }
      default:
        return {
          label: "Message",
          containerClass: "border-gray-200/80 bg-gray-50/70 dark:border-gray-700/60 dark:bg-gray-900/30",
          badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
          iconClass: "text-gray-500 dark:text-gray-300",
          Icon: MessageSquare,
        }
    }
  })()
  const RoleIcon = roleMeta.Icon
  const timestampLabel = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null

  return (
    <div className={cn("rounded-md border text-xs transition-all", roleMeta.containerClass)}>
      <div className="flex items-start gap-1.5 px-2 py-1.5">
        <div className={cn("mt-0.5 rounded-full p-1 bg-white/70 dark:bg-black/20", roleMeta.iconClass)}>
          <RoleIcon className="h-3 w-3" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("mb-0.5 flex gap-1.5", isCompact ? "flex-col items-start" : "flex-wrap items-center")}>
            <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", roleMeta.badgeClass)}>
              {roleMeta.label}
            </span>
            {timestampLabel && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {timestampLabel}
              </span>
            )}
          </div>
          {message.role === "tool" ? (
            <div className="space-y-1.5">
              <div
                className={cn(
                  "whitespace-pre-wrap break-words text-[11px] leading-[1.2rem] text-gray-700 dark:text-gray-200",
                  !isExpanded && isLongContent && (isCompact ? "line-clamp-3" : "line-clamp-4"),
                )}
              >
                {toolContent?.summary}
              </div>
              {message.toolInput && (
                <div className="space-y-1 rounded-md border border-amber-200/70 bg-white/60 p-1.5 dark:border-amber-800/60 dark:bg-black/20">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/90 dark:text-amber-300/90">
                    Tool Input
                  </div>
                  <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-amber-50/80 p-1.5 text-[10px] text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    {JSON.stringify(message.toolInput, null, 2)}
                  </pre>
                </div>
              )}
              {isExpanded && toolContent?.rawContent && toolContent.rawContent !== toolContent.summary && (
                <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 p-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Raw Payload
                  </div>
                  <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-1.5 text-[10px] text-foreground/90">
                    {toolContent.rawContent}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "whitespace-pre-wrap break-words text-[11px] leading-[1.2rem] text-gray-700 dark:text-gray-200",
                !isExpanded && isLongContent && (isCompact ? "line-clamp-3" : "line-clamp-4"),
              )}
            >
              {message.content}
            </div>
          )}
          {shouldShowToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title={isCopied ? "Copied!" : "Copy message"}
          >
            {isCopied ? (
              <CheckCheck className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

type SubAgentToolExecutionData = {
  timestamp: number
  calls: CompactToolExecutionCall[]
  results: CompactToolExecutionResult[]
}

function isDelegationActiveStatus(status: ACPDelegationProgress["status"]): boolean {
  return status === "pending" || status === "spawning" || status === "running"
}

type SubAgentConversationRenderItem =
  | { kind: "message"; key: string; message: ACPSubAgentMessage }
  | {
      kind: "tool_execution"
      key: string
      execution: SubAgentToolExecutionData
    }

function normalizeSubAgentToolArguments(toolInput: unknown): Record<string, unknown> {
  if (toolInput && typeof toolInput === "object" && !Array.isArray(toolInput)) {
    return toolInput as Record<string, unknown>
  }
  if (toolInput === undefined) return {}
  return { input: toolInput }
}

function isDelegatedToolUseMessage(message: ACPSubAgentMessage): boolean {
  return message.role === "tool" && !!message.toolName && /^using tool:/i.test((message.content ?? "").trim())
}

function isDelegatedToolResultMessage(message: ACPSubAgentMessage): boolean {
  return message.role === "tool" && /^tool result:/i.test((message.content ?? "").trim())
}

function buildDelegatedToolExecution(
  message: ACPSubAgentMessage,
  delegationStatus: ACPDelegationProgress["status"],
  resultMessage?: ACPSubAgentMessage,
): SubAgentToolExecutionData {
  const parsedMessage = extractSubAgentToolDisplayContent(message.content ?? "")
  const parsedResult = resultMessage ? extractSubAgentToolDisplayContent(resultMessage.content ?? "") : null
  const toolName = message.toolName || parsedMessage.toolName || parsedResult?.toolName || "Tool"
  const isToolUseMessage = isDelegatedToolUseMessage(message)
  const isDelegationActive = isDelegationActiveStatus(delegationStatus)
  const isPending = isToolUseMessage && !resultMessage && isDelegationActive

  let result: CompactToolExecutionResult
  if (resultMessage) {
    result = { success: true, content: parsedResult?.summary || "Tool completed" }
  } else if (!isToolUseMessage) {
    result = { success: true, content: parsedMessage.summary || "Tool completed" }
  } else if (!isDelegationActive) {
    if (delegationStatus === "failed") {
      result = {
        success: false,
        content: "",
        error: "Delegation failed before a tool result was captured.",
      }
    } else if (delegationStatus === "cancelled") {
      result = {
        success: false,
        content: "",
        error: "Delegation was cancelled before a tool result was captured.",
      }
    } else {
      result = { success: true, content: "Tool completed" }
    }
  } else {
    result = undefined
  }

  return {
    timestamp: resultMessage?.timestamp ?? message.timestamp,
    calls: [{ name: toolName, arguments: normalizeSubAgentToolArguments(message.toolInput) }],
    results: [isPending ? undefined : result],
  }
}

function buildSubAgentConversationItems(
  conversation: ACPSubAgentMessage[],
  delegationStatus: ACPDelegationProgress["status"],
): SubAgentConversationRenderItem[] {
  const items: SubAgentConversationRenderItem[] = []

  for (let index = 0; index < conversation.length; index += 1) {
    const message = conversation[index]
    if (message.role !== "tool") {
      items.push({ kind: "message", key: `msg-${index}`, message })
      continue
    }

    if (isDelegatedToolUseMessage(message)) {
      const nextMessage = conversation[index + 1]
      if (nextMessage && isDelegatedToolResultMessage(nextMessage)) {
        items.push({
          kind: "tool_execution",
          key: `tool-${index}-${index + 1}`,
          execution: buildDelegatedToolExecution(message, delegationStatus, nextMessage),
        })
        index += 1
        continue
      }

      items.push({
        kind: "tool_execution",
        key: `tool-${index}`,
        execution: buildDelegatedToolExecution(message, delegationStatus),
      })
      continue
    }

    if (message.toolName || isDelegatedToolResultMessage(message)) {
      items.push({
        kind: "tool_execution",
        key: `tool-${index}`,
        execution: buildDelegatedToolExecution(message, delegationStatus),
      })
      continue
    }

    items.push({ kind: "message", key: `msg-${index}`, message })
  }

  return items
}

// Collapsible Subagent Conversation Panel
const RECENT_MESSAGES_LIMIT = 3

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
    () => buildSubAgentConversationItems(conversation, delegationStatus),
    [conversation, delegationStatus],
  )

  const toggleMessage = (key: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleCopyAll = async () => {
    const fullConversation = conversation.map(msg => {
      const role = msg.role === 'user' ? 'Task' : msg.role === 'assistant' ? agentName : (msg.toolName || 'Tool')
      return `[${role}]\n${msg.content}`
    }).join('\n\n---\n\n')
    try {
      await copyTextToClipboard(fullConversation)
    } catch (err) {
      console.error("Failed to copy conversation:", err)
    }
  }

  const conversationPreview = getConversationPreview(conversation, agentName, isCompact ? 72 : 120)

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
    : renderItems.slice(-RECENT_MESSAGES_LIMIT)
  const hiddenCount = renderItems.length - visibleItems.length

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      {/* Collapsible Header */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 transition-colors",
          alwaysOpen ? "cursor-default" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
        )}
        onClick={alwaysOpen ? undefined : onToggle}
      >
        <div className="min-w-0 flex flex-1 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-gray-600 dark:text-gray-400">
            {panelOpen ? "Activity" : conversationPreview}
          </span>
          <Badge variant="outline" className="h-4 shrink-0 px-1 py-0 text-[9px]">
            {renderItems.length}
          </Badge>
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); void handleCopyAll() }}
            className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Copy conversation"
            aria-label="Copy conversation"
          >
            <Copy className="h-2.5 w-2.5 opacity-60 hover:opacity-100" />
          </button>
          {!alwaysOpen && (panelOpen ? (
            <ChevronUp className="h-3 w-3 text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-400" />
          ))}
        </div>
      </div>

      {/* Collapsible Content */}
      {panelOpen && (
        <div className="relative bg-white/50 dark:bg-black/20">
          {hiddenCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAll(true) }}
              className="w-full px-2 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center border-b border-gray-100 dark:border-gray-800"
            >
              Show {hiddenCount} earlier message{hiddenCount > 1 ? "s" : ""}
            </button>
          )}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto p-1 space-y-1"
            style={{ maxHeight: isCompact ? "min(32vh, 220px)" : "min(36vh, 280px)" }}
          >
            {visibleItems.map((item) => {
              if (item.kind === "tool_execution") {
                return (
                  <ToolExecutionBubble
                    key={item.key}
                    execution={item.execution}
                    isExpanded={expandedMessages[item.key] ?? false}
                    onToggleExpand={() => toggleMessage(item.key)}
                  />
                )
              }

              return (
                <SubAgentConversationMessage
                  key={item.key}
                  message={item.message}
                  agentName={agentName}
                  isExpanded={expandedMessages[item.key] ?? false}
                  onToggleExpand={() => toggleMessage(item.key)}
                  isCompact={isCompact}
                />
              )
            })}
          </div>
          {!isPinnedToBottom && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsPinnedToBottom(true)
                scrollToBottom("smooth")
              }}
              className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <ChevronDown className="h-2.5 w-2.5" />
              Latest
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
  label: string
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
      <div className={labelClassName}>{label}</div>
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
  const isRunning = isDelegationActiveStatus(delegation.status)
  const isCompleted = delegation.status === 'completed'
  const isFailed = delegation.status === 'failed'
  const isCancelled = delegation.status === 'cancelled'
  const hasConversation = delegation.conversation && delegation.conversation.length > 0

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

  const statusColor = isCompleted
    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/30'
    : isFailed
    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/30'
    : isCancelled
    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30'
    : 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30'

  const headerColor = isCompleted
    ? 'bg-green-100/50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
    : isFailed
    ? 'bg-red-100/50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    : isCancelled
    ? 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
    : 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'

  const textColor = isCompleted
    ? 'text-green-800 dark:text-green-200'
    : isFailed
    ? 'text-red-800 dark:text-red-200'
    : isCancelled
    ? 'text-amber-800 dark:text-amber-200'
    : 'text-blue-800 dark:text-blue-200'

  const iconColor = isCompleted
    ? 'text-green-600 dark:text-green-400'
    : isFailed
    ? 'text-red-600 dark:text-red-400'
    : isCancelled
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-blue-600 dark:text-blue-400'

  const handleHeaderClick = () => {
    onToggleExpand?.()
  }

  const mutedTextColor = textColor.replace('800', '600').replace('200', '400')
  const statusLabel = formatDelegationStatus(delegation.status)
  const subtitle = getDelegationSubtitle(delegation, isCompact ? 72 : 120)
  const sourceLabel = getDelegationSourceLabel(delegation)
  const trackingLabel = getDelegationTrackingLabel(delegation)
  const durationLabel = `${duration}s`
  const statusBadgeClass = isCompleted
    ? 'border-green-300/70 bg-green-100/70 text-green-800 dark:border-green-700/70 dark:bg-green-900/40 dark:text-green-200'
    : isFailed
    ? 'border-red-300/70 bg-red-100/70 text-red-800 dark:border-red-700/70 dark:bg-red-900/40 dark:text-red-200'
    : isCancelled
    ? 'border-amber-300/70 bg-amber-100/70 text-amber-800 dark:border-amber-700/70 dark:bg-amber-900/40 dark:text-amber-200'
    : 'border-blue-300/70 bg-blue-100/70 text-blue-800 dark:border-blue-700/70 dark:bg-blue-900/40 dark:text-blue-200'

  useEffect(() => {
    if (isExpanded && isRunning && hasConversation) {
      setIsConversationOpen(true)
    }
  }, [hasConversation, isExpanded, isRunning])

  return (
    <div ref={containerRef} className={cn("rounded-lg border overflow-hidden", statusColor)}>
      {/* Header - clickable to collapse/expand entire bubble */}
      <div
        className={cn(
          "px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity",
          isExpanded && "border-b",
          headerColor
        )}
        onClick={handleHeaderClick}
      >
        <div className="flex items-start gap-1.5">
          <Bot className={cn("mt-0.5 h-3 w-3 flex-shrink-0", iconColor)} />
          <div className="min-w-0 flex-1">
            <div className={cn("flex gap-1.5", isCompact ? "flex-col items-start" : "items-start justify-between")}>
              <div className="min-w-0 flex-1">
                <div className={cn("text-[11px] font-medium truncate leading-4", textColor)}>
                  {delegation.agentName}
                </div>
                <div className={cn("mt-0.5 text-[10px] leading-4 text-gray-600 dark:text-gray-400", isExpanded ? "line-clamp-2" : "line-clamp-1")}>
                  {subtitle}
                </div>
              </div>
              <div className={cn("flex items-center gap-1", isCompact ? "w-full justify-between" : "pl-1.5 flex-shrink-0")}>
                <Badge variant="outline" className={cn("h-4 rounded-full px-1 text-[9px] font-medium", statusBadgeClass)}>
                  {statusLabel}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </div>
            </div>
            {/* Compact metadata row – shown inline when collapsed, full when expanded */}
            <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] text-gray-500 dark:text-gray-400", isExpanded ? "mt-1" : "mt-0.5")}>
              <span className="inline-flex items-center gap-1">
                {isRunning ? (
                  <Loader2 className={cn("h-2.5 w-2.5 animate-spin", iconColor)} />
                ) : isCompleted ? (
                  <Check className={cn("h-2.5 w-2.5", iconColor)} />
                ) : isFailed ? (
                  <XCircle className={cn("h-2.5 w-2.5", iconColor)} />
                ) : (
                  <OctagonX className={cn("h-2.5 w-2.5", iconColor)} />
                )}
                <span>{durationLabel}</span>
              </span>
              {isExpanded && <span>{sourceLabel}</span>}
              {isExpanded && trackingLabel && <span>{trackingLabel}</span>}
              {hasConversation && (
                <span>{delegation.conversation!.length} msgs</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - only shown when expanded */}
      {isExpanded && (
        <div className="px-2 py-2 space-y-2">
          <DelegationInfoRow
            label="Task"
            content={delegation.task}
            tone="muted"
          />

          {delegation.progressMessage && (
            <DelegationInfoRow
              label="Update"
              content={delegation.progressMessage}
              tone="default"
              italic
            />
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
            <DelegationInfoRow
              label="Result"
              content={delegation.resultSummary}
              tone="success"
              formatJson
            />
          )}

          {/* Error message */}
          {delegation.error && (
            <DelegationInfoRow
              label="Error"
              content={delegation.error}
              tone="error"
            />
          )}

          {/* Status footer */}
          <div className={cn("flex items-center justify-between gap-1.5 border-t border-black/5 pt-1.5 dark:border-white/10", isCompact && "flex-col items-stretch")}>
            <span className={cn("text-[10px]", mutedTextColor)}>
              {statusLabel} · {durationLabel}
            </span>
            <div className={cn("flex items-center gap-1.5", isCompact && "w-full flex-col items-stretch")}>
              {hasConversation && !isConversationOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsConversationOpen(true)
                  }}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-purple-200/80 px-2 text-[10px] font-medium text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-800/70 dark:text-purple-300 dark:hover:bg-purple-950/30"
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
                  className="inline-flex h-7 items-center justify-center rounded-md border border-border px-2 text-[10px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DelegationSummaryStrip: React.FC<{
  entries: DelegationSummaryEntry[]
  maxItems: number
  onOpenDetails: (runId: string) => void
}> = ({ entries, maxItems, onOpenDetails }) => {
  if (entries.length === 0) {
    return null
  }

  const visibleEntries = entries.slice(0, maxItems)
  const activeCount = entries.filter((entry) => entry.isActive).length

  return (
    <div className="border-b border-border/30 bg-muted/5 px-1.5 py-1">
      <div className="mb-1 flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-medium text-foreground/90">
          <Bot className="h-2.5 w-2.5" />
          Delegations
        </span>
        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
          {entries.length}
        </Badge>
        {activeCount > 0 && (
          <Badge variant="outline" className="h-4 border-blue-200 px-1 text-[9px] text-blue-700 dark:border-blue-800 dark:text-blue-300">
            {activeCount} live
          </Badge>
        )}
      </div>

      <div className="space-y-0.5">
        {visibleEntries.map((entry) => (
          <button
            key={entry.delegation.runId}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetails(entry.delegation.runId)
            }}
            className="flex w-full items-start gap-1 rounded-md border border-border/60 bg-background/80 px-1.5 py-1 text-left transition-colors hover:bg-muted/40"
          >
            <div className="mt-0.5">
              {entry.isActive ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500" />
              ) : entry.delegation.status === "completed" ? (
                <Check className="h-2.5 w-2.5 text-green-500" />
              ) : entry.delegation.status === "failed" ? (
                <XCircle className="h-2.5 w-2.5 text-red-500" />
              ) : (
                <OctagonX className="h-2.5 w-2.5 text-amber-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1">
                <span className="truncate text-[10px] font-medium leading-4 text-foreground">{entry.delegation.agentName}</span>
                <Badge variant="outline" className="h-4 px-1 text-[9px]">
                  {entry.statusLabel}
                </Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-muted-foreground">
                {entry.subtitle}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8.5px] text-muted-foreground/90">
                <span>{entry.sourceLabel}</span>
                {entry.trackingLabel && <span>{entry.trackingLabel}</span>}
                {entry.messageCount > 0 && <span>{entry.messageCount} messages</span>}
                {entry.isActive && <span className="text-blue-600 dark:text-blue-400">Live updates</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
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

  const hasConversation = (delegation.conversation?.length ?? 0) > 0
  const trackingLabel = getDelegationTrackingLabel(delegation)
  const sourceLabel = getDelegationSourceLabel(delegation)
  const statusLabel = formatDelegationStatus(delegation.status)
  const subtitle = getDelegationSubtitle(delegation, 220)

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
              {hasConversation && <span>{delegation.conversation!.length} messages</span>}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 overflow-y-auto pr-0.5">
          <DelegationInfoRow
            label="Task"
            content={delegation.task}
            tone="muted"
          />

          {delegation.progressMessage && (
            <DelegationInfoRow
              label="Update"
              content={delegation.progressMessage}
              tone="default"
              italic
            />
          )}

          {delegation.resultSummary && (
            <DelegationInfoRow
              label="Result"
              content={delegation.resultSummary}
              tone="success"
              formatJson
            />
          )}

          {delegation.error && (
            <DelegationInfoRow
              label="Error"
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
  }
}> = ({ streamingContent }) => {
  if (!streamingContent.text) return null

  const contentNode = streamingContent.isStreaming
    ? (
      <div className="markdown-selectable whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {streamingContent.text}
      </div>
    )
    : <MarkdownRenderer content={streamingContent.text} />

  return (
    <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
        <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
          {streamingContent.isStreaming ? "Generating response..." : "Response"}
        </span>
        {streamingContent.isStreaming && (
          <Loader2 className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin ml-auto" />
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="text-xs text-blue-900 dark:text-blue-100">
          {contentNode}
          {streamingContent.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-blue-600 dark:bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
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

  // Get queued messages for this conversation (used in overlay variant)
  const queuedMessages = useMessageQueue(progress?.conversationId)
  const isQueuePaused = useIsQueuePaused(progress?.conversationId)
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
      const from = itemKey in prev ? prev[itemKey] : defaultExpanded
      const to = !from
      logExpand("AgentProgress", "toggle", { itemKey, from, to })
      return {
        ...prev,
        [itemKey]: to,
      }
    })
  }

  // Kill switch handler - stop only this session, with fallback to global emergency stop
  const handleKillSwitch = async () => {
    if (isKilling) return // Prevent double-clicks

    setIsKilling(true)
    try {
      if (progress?.sessionId) {
        await tipcClient.stopAgentSession({ sessionId: progress.sessionId })
      } else {
        // No session ID available, fall back to global emergency stop
        // so the kill switch always works regardless of state
        await tipcClient.emergencyStopAgent()
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
      await tipcClient.unsnoozeAgentSession({ sessionId: progress.sessionId })
    } catch (error) {
      setSessionSnoozed(progress.sessionId, true)
      setFocusedSessionId(null)
      console.error("Failed to unsnooze session:", error)
      return false
    }

    try {
      await tipcClient.focusAgentSession({ sessionId: progress.sessionId })
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

  const conversationId = progress?.conversationId
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
        await tipcClient.clearAgentSessionProgress({ sessionId: thisId })
      } else {
        // Last visible session: exit agent mode and hide panel
        await tipcClient.closeAgentModeAndHidePanelWindow()
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
    console.log(`[Tool Approval UI] Calling tipcClient.respondToToolApproval with approvalId=${approvalId}, approved=true`)
    try {
      const result = await tipcClient.respondToToolApproval({
        approvalId,
        approved: true,
      })
      console.log(`[Tool Approval UI] respondToToolApproval returned:`, result)
      // Don't reset respondingApprovalId on success - keep showing "Processing..."
      // The approval bubble will be removed when pendingToolApproval is cleared from progress
    } catch (error) {
      console.error("[Tool Approval UI] Failed to approve tool call:", error)
      toast.error(
        `Failed to approve tool call. ${getActionErrorMessage(error, "Please try again.")}`,
      )
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
    console.log(`[Tool Approval UI] Calling tipcClient.respondToToolApproval with approvalId=${approvalId}, approved=false`)
    try {
      const result = await tipcClient.respondToToolApproval({
        approvalId,
        approved: false,
      })
      console.log(`[Tool Approval UI] respondToToolApproval (deny) returned:`, result)
      // Don't reset respondingApprovalId on success - keep showing "Processing..."
      // The approval bubble will be removed when pendingToolApproval is cleared from progress
    } catch (error) {
      console.error("[Tool Approval UI] Failed to deny tool call:", error)
      toast.error(
        `Failed to deny tool call. ${getActionErrorMessage(error, "Please try again.")}`,
      )
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

  // Detect if agent was stopped by kill switch
  const wasStopped = finalContent?.includes("emergency kill switch") ||
                    steps?.some(step => step.title === "Agent stopped" ||
                               step.description?.includes("emergency kill switch"))
  const shouldAutoScrollContent = variant !== "tile" || !!isFocused || !!isExpanded

  const messages = useMemo<Array<{
    role: "user" | "assistant" | "tool"
    content: string
    isComplete: boolean
    timestamp: number
    isThinking: boolean
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
            content: entry.content,
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
            message.content.trim().length > 0
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
          })
        } else if (!isStreaming) {
          const isVerificationStep = currentThinkingStep.title?.toLowerCase().includes("verifying")
          if (!isVerificationStep) {
            nextMessages.push({
              role: "assistant",
              content: currentThinkingStep.description || "Agent is thinking...",
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
            })
          } else if (step.status === "in_progress" && !isComplete) {
            const isVerificationStep = step.title?.toLowerCase().includes("verifying")
            if (!isVerificationStep) {
              nextMessages.push({
                role: "assistant",
                content: step.description || "Agent is thinking...",
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
        m.role === "assistant" &&
        !m.toolCalls?.length &&
        !m.toolResults?.length &&
        m.content.trim().length > 0,
      )
      .map(({ i }) => i)

    const stripImageMarkdown = (text: string) =>
      text.replace(/!\[[^\]]*\]\([^)]*\)/g, "")

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
      attachEvent(event, normalizeAssistantResponseForDedupe(stripImageMarkdown(event.text)))
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
        const toolCallNames = message.toolCalls.map((call) => call.name)
        const visibleToolCalls = message.toolCalls
          .map((call, index) => ({ call, result: results[index] }))
          .filter(({ call }) => !isCompletionControlTool(call.name))
        const visibleToolNames = visibleToolCalls.map(({ call }) => call.name)
        const hasCompletionTool = visibleToolCalls.length !== message.toolCalls.length
        const suppressThought = hasCompletionTool && !!effectiveUserResponse

        if (visibleToolCalls.length > 0) {
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
              calls: visibleToolCalls.map(({ call }) => call),
              // Preserve per-call result alignment after hiding completion-control tools.
              // Some visible calls may still be pending while later visible calls already have results.
              results: visibleToolCalls.map(({ result }) => result),
              executionStats: matchingStep?.executionStats ? {
                durationMs: matchingStep.executionStats.durationMs,
                totalTokens: matchingStep.executionStats.totalTokens,
                model: matchingStep.subagentId,
              } : undefined,
            },
          })
        } else if (message.content.trim().length > 0) {
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

    if (progress.streamingContent?.isStreaming && progress.streamingContent.text) {
      let latestAssistantText: (typeof enrichedMessages)[number] | undefined
      for (let i = enrichedMessages.length - 1; i >= 0; i--) {
        const message = enrichedMessages[i]
        if (
          message.role === "assistant" &&
          !message.toolCalls?.length &&
          !message.toolResults?.length &&
          message.content.trim().length > 0
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
      const previewLines: string[] = []
      const previewStart = Math.max(0, runItems.length - TOOL_GROUP_PREVIEW_COUNT)
      for (let j = previewStart; j < runItems.length; j++) {
        const it = runItems[j]
        if (it.kind === "assistant_with_tools") {
          const line = getToolActivitySummaryLine({
            role: "assistant",
            toolCalls: it.data.calls,
          })
          if (line) previewLines.push(line)
        } else if (it.kind === "tool_execution") {
          const line = getToolActivitySummaryLine({
            role: "tool",
            toolResults: it.data.results,
          })
          if (line) previewLines.push(line)
        }
      }
      // Prefix the first child ID so the group stays stable as the run grows
      // without sharing expansion state with any child row.
      const groupId = `tool-activity-group:${runItems[0]?.id ?? runStart}`
      grouped.push({
        kind: "tool_activity_group",
        id: groupId,
        data: { items: runItems, previewLines: previewLines.length > 0 ? [previewLines.join(', ')] : [] },
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

  const getToolActivityGroupDefaultExpanded = useCallback((item: Extract<DisplayItem, { kind: "tool_activity_group" }>) => {
    const firstChildId = item.data.items[0]?.id
    return !!firstChildId && expandedItems[firstChildId] === true
  }, [expandedItems])

  useEffect(() => {
    setExpandedItems(prev => {
      let next = prev
      for (const item of displayItems) {
        if (item.kind !== "tool_activity_group" || item.id in prev) continue
        const firstChildId = item.data.items[0]?.id
        if (!firstChildId || prev[firstChildId] !== true) continue
        if (next === prev) next = { ...prev }
        next[item.id] = true
      }
      return next
    })
  }, [displayItems])

  const delegationSummaryEntries = useMemo<DelegationSummaryEntry[]>(() => {
    const latestByRunId = new Map<string, { delegation: ACPDelegationProgress; timestamp: number }>()

    for (const step of progress.steps) {
      if (!step.delegation) continue

      const timestamp = step.timestamp ?? getDelegationActivityTimestamp(step.delegation)
      const existing = latestByRunId.get(step.delegation.runId)
      if (!existing || timestamp >= existing.timestamp) {
        latestByRunId.set(step.delegation.runId, {
          delegation: step.delegation,
          timestamp,
        })
      }
    }

    return Array.from(latestByRunId.values())
      .map(({ delegation, timestamp }) => ({
        delegation,
        statusLabel: formatDelegationStatus(delegation.status),
        subtitle: getDelegationSubtitle(delegation, 140),
        sourceLabel: getDelegationSourceLabel(delegation),
        trackingLabel: getDelegationTrackingLabel(delegation),
        messageCount: delegation.conversation?.length ?? 0,
        isActive: isDelegationActiveStatus(delegation.status),
        activityTimestamp: timestamp,
      }))
      .sort((a, b) => b.activityTimestamp - a.activityTimestamp)
  }, [progress.steps])

  const selectedDelegation = useMemo(
    () => delegationSummaryEntries.find((entry) => entry.delegation.runId === selectedDelegationRunId)?.delegation ?? null,
    [delegationSummaryEntries, selectedDelegationRunId],
  )

  useEffect(() => {
    if (selectedDelegationRunId && !selectedDelegation) {
      setSelectedDelegationRunId(null)
    }
  }, [selectedDelegation, selectedDelegationRunId])

  const delegationSummaryMaxItems = variant === "tile" && !isFocused && !isExpanded ? 1 : 3

  const lastAssistantDisplayIndex = useMemo(() => {
    for (let i = visibleDisplayItems.length - 1; i >= 0; i--) {
      const item = visibleDisplayItems[i]
      if (item.kind === "message" && item.data.role === "assistant") return i
    }
    return -1
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
      tipcClient.setPanelFocusable({ focusable: true })
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
  const conversationState = progress.conversationState
    ? normalizeAgentConversationState(progress.conversationState, isComplete ? "complete" : "running")
    : progress.pendingToolApproval
      ? "needs_input"
      : hasErrors || wasStopped
        ? "blocked"
        : isComplete
          ? "complete"
          : "running"
  const conversationStateLabel = getAgentConversationStateLabel(conversationState)
  const conversationStateBadgeClass = conversationState === "complete"
    ? "border-green-500 text-green-700 dark:border-green-700 dark:text-green-300"
    : conversationState === "needs_input"
      ? "border-amber-500 text-amber-700 dark:border-amber-700 dark:text-amber-300"
      : conversationState === "blocked"
        ? "border-red-500 text-red-700 dark:border-red-700 dark:text-red-300"
        : "border-blue-500 text-blue-700 dark:border-blue-700 dark:text-blue-300"

  // Get status indicator for tile variant
  const getStatusIndicator = () => {
    const isSnoozed = progress.isSnoozed
    if (conversationState === "needs_input") {
      return <Shield className="h-4 w-4 text-amber-500 animate-pulse" />
    }
    if (conversationState === "running") {
      return <LoadingSpinner size="sm" className="[&>div]:gap-0 [&_img]:h-4 [&_img]:w-4" />
    }
    if (isSnoozed) {
      return <Moon className="h-4 w-4 text-muted-foreground" />
    }
    if (conversationState === "blocked") {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return <Check className="h-4 w-4 text-green-500" />
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
            <div className="shrink-0">
              {getStatusIndicator()}
            </div>
            <span className={cn("pointer-events-none truncate font-medium min-w-0", isCollapsed ? "text-xs" : "text-sm")}>
              {getTitle()}
            </span>
          </div>
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 app-no-drag-region">
            {canCollapseTile && (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleToggleCollapse} title={isCollapsed ? "Expand panel" : "Collapse panel"}>
                {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
            )}

            {conversationId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePinSession(conversationId)
                }}
                title={isPinned ? "Unpin session" : "Pin session"}
                aria-label={isPinned ? "Unpin session" : "Pin session"}
                aria-pressed={isPinned}
              >
                <Pin className={cn("h-3 w-3", isPinned && "fill-current text-foreground")} />
              </Button>
            )}
            {/* Combined close button: stops agent if running, dismisses if complete */}
            {!isComplete ? (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleKillConfirmation(); }} title="Stop agent">
                <OctagonX className="h-3 w-3" />
              </Button>
            ) : onDismiss ? (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); onDismiss(); }} title="Dismiss">
                <X className="h-3 w-3" />
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
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto scrollbar-none"
              >
                {visibleDisplayItems.length > 0 ? (
                  <div ref={scrollContentRef} className="space-y-1 p-2">
                    {displayItems.length > visibleDisplayItems.length && (
                      <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        Showing latest {visibleDisplayItems.length} updates
                      </div>
                    )}
                    {visibleDisplayItems.map((item, index) => {
                      const itemKey = item.id
                      // Final assistant message should be expanded by default when agent is complete
                      // Tool executions should be collapsed by default to reduce visual clutter
                      // unless user has explicitly toggled them (itemKey exists in expandedItems)
                      const isFinalAssistantMessage = item.kind === "message" && index === lastAssistantDisplayIndex && isComplete
                      const isExpanded = itemKey in expandedItems
                        ? expandedItems[itemKey]
                        : isFinalAssistantMessage // Only final assistant message expanded by default
                      const isLastAssistant = item.kind === "message" && item.data.role === "assistant" && index === lastAssistantDisplayIndex

                      if (item.kind === "message") {
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
                            conversationId={progress.conversationId}
                            branchMessageIndex={item.data.branchMessageIndex}
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
                        const delegationExpanded = expandedItems[itemKey] ?? false
                        return (
                          <DelegationBubble
                            key={itemKey}
                            delegation={item.data}
                            isExpanded={delegationExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, false)}
                          />
                        )
                      } else if (item.kind === "tool_activity_group") {
                        const groupExpanded = itemKey in expandedItems
                          ? expandedItems[itemKey]
                          : getToolActivityGroupDefaultExpanded(item)
                        return (
                          <ToolActivityGroupBubble
                            key={itemKey}
                            group={item.data}
                            isExpanded={groupExpanded}
                            onToggleExpand={() => toggleItemExpansion(itemKey, groupExpanded)}
                            renderItem={(child, childIdx) => {
                              const childKey = child.id || `group-child-${childIdx}`
                              const childExpanded = expandedItems[childKey] ?? false
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
                    <span className="sr-only">Loading agent activity</span>
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
                  className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
                  title="Scroll to bottom"
                  aria-label="Scroll to bottom"
                >
                  <ChevronDown className="h-3 w-3" />
                  Latest
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

            {/* Footer with status info — only show when active, omit when complete to save space */}
            {!isComplete && (
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
                    {modelInfo && (
                      <>
                        {profileName && <span className="text-muted-foreground/50">•</span>}
                        <span className="min-w-0 max-w-full truncate text-[10px]">
                          {modelInfo.provider}/{modelInfo.model.split('/').pop()?.substring(0, 15)}
                        </span>
                      </>
                    )}
                    {contextInfo && contextInfo.maxTokens > 0 && (
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
                  <span className="shrink-0 whitespace-nowrap">Step {currentIteration}/{isFinite(maxIterations) ? maxIterations : "∞"}</span>
                </div>
              </div>
            )}
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
            isSessionActive={!isComplete}
            isInitializingSession={isFollowUpInputInitializing}
            agentName={profileName}
            conversationTitle={progress.conversationTitle}
            className="flex-shrink-0"
            onMessageSent={handleFollowUpSent}
            onVoiceContinue={onVoiceContinue}
          />
        )}

        {/* Kill Switch Confirmation Dialog */}
        {showKillConfirmation && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-4 max-w-sm mx-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-medium">Stop Agent Execution</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Are you sure you want to stop this session?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCancelKill} disabled={isKilling}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleKillSwitch} disabled={isKilling}>
                  {isKilling ? "Stopping..." : "Stop Agent"}
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
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Profile/agent name — secondary */}
          {profileName && (
            <span className="text-[10px] text-primary/70 truncate max-w-[80px]">
              {profileName}
            </span>
          )}
          {/* Model and provider info */}
          {!isComplete && modelInfo && (
            <>
              {profileName && <span className="text-muted-foreground/50">•</span>}
              <span className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">
                {modelInfo.provider}/{modelInfo.model.split('/').pop()?.substring(0, 20)}
              </span>
            </>
          )}
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
              title="Stop agent execution"
            >
              <OctagonX className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={handleClose}
              title="Close"
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
        />
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {visibleDisplayItems.length > 0 ? (
            <div ref={scrollContentRef} className="space-y-1 p-2">
              {displayItems.length > visibleDisplayItems.length && (
                <div className="px-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  Showing latest {visibleDisplayItems.length} updates
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
                // unless user has explicitly toggled it (itemKey exists in expandedItems)
                const isFinalAssistantMessage = item.kind === "message" && index === lastAssistantDisplayIndex && isComplete
                const isExpanded = itemKey in expandedItems
                  ? expandedItems[itemKey]
                  : isFinalAssistantMessage // Only final assistant message expanded by default

                if (item.kind === "message") {
                  const isLastAssistant = index === lastAssistantDisplayIndex
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
                      conversationId={progress.conversationId}
                      branchMessageIndex={item.data.branchMessageIndex}
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
                  const delegationExpanded = expandedItems[itemKey] ?? false
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
                  const groupExpanded = itemKey in expandedItems
                    ? expandedItems[itemKey]
                    : getToolActivityGroupDefaultExpanded(item)
                  return (
                    <ToolActivityGroupBubble
                      key={itemKey}
                      group={item.data}
                      isExpanded={groupExpanded}
                      onToggleExpand={() => toggleItemExpansion(itemKey, groupExpanded)}
                      renderItem={(child, childIdx) => {
                        const childKey = child.id || `group-child-${childIdx}`
                        const childExpanded = expandedItems[childKey] ?? false
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
              <span className="sr-only">Loading agent activity</span>
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
        isSessionActive={!isComplete}
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-4 max-w-sm mx-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-medium">Stop Agent Execution</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Are you sure you want to stop this session? Other sessions will continue running.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelKill}
                disabled={isKilling}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleKillSwitch}
                disabled={isKilling}
              >
                {isKilling ? "Stopping..." : "Stop Agent"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
