import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "@renderer/lib/utils"
import { AgentProgressUpdate, ACPDelegationProgress, ACPSubAgentMessage, Conversation } from "../../../shared/types"
import { INTERNAL_COMPLETION_NUDGE_TEXT, RESPOND_TO_USER_TOOL, MARK_WORK_COMPLETE_TOOL } from "../../../shared/builtin-tool-names"
import { ChevronDown, ChevronUp, ChevronRight, X, AlertTriangle, Minimize2, Shield, Check, XCircle, Loader2, Clock, Copy, CheckCheck, GripHorizontal, Activity, Moon, Maximize2, RefreshCw, Bot, OctagonX, MessageSquare, Brain, Volume2, Wrench } from "lucide-react"
import { MarkdownRenderer } from "@renderer/components/markdown-renderer"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { tipcClient } from "@renderer/lib/tipc-client"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { useAgentStore, useConversationStore, useMessageQueue, useIsQueuePaused } from "@renderer/stores"
import { AudioPlayer } from "@renderer/components/audio-player"
import { useConfigQuery, useConversationQuery } from "@renderer/lib/queries"
import { useTheme } from "@renderer/contexts/theme-context"
import { logUI, logExpand } from "@renderer/lib/debug"
import { TileFollowUpInput } from "./tile-follow-up-input"
import { OverlayFollowUpInput } from "./overlay-follow-up-input"
import { MessageQueuePanel } from "@renderer/components/message-queue-panel"
import { useResizable, TILE_DIMENSIONS } from "@renderer/hooks/use-resizable"
import { getToolResultsSummary } from "@dotagents/shared"
import { ToolExecutionStats } from "./tool-execution-stats"
import { ACPSessionBadge } from "./acp-session-badge"
import { AgentSummaryView } from "./agent-summary-view"
import { hasTTSPlayed, markTTSPlayed, removeTTSKey } from "@renderer/lib/tts-tracking"
import { ttsManager } from "@renderer/lib/tts-manager"
import { sanitizeMessageContentForSpeech } from "@shared/message-display-utils"

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
      isSummary?: boolean
      summarizedMessageCount?: number
      toolCalls?: Array<{ name: string; arguments: any }>
      toolResults?: Array<{ success: boolean; content: string; error?: string }>
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
      results: Array<{ success: boolean; content: string; error?: string }>
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
  | { kind: "mid_turn_response"; id: string; data: {
      userResponse: string
      pastResponses?: string[]
    } }

const TILE_TRANSCRIPT_PREVIEW_ITEMS = 6
const OFFSCREEN_TRANSCRIPT_BUFFER_ITEMS = 12

function mapConversationMessageForProgress(message: Conversation["messages"][number]) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    toolCalls: message.toolCalls,
    toolResults: message.toolResults,
    timestamp: message.timestamp,
    isSummary: message.isSummary,
    summarizedMessageCount: message.summarizedMessageCount,
  }
}

function extractRespondToUserContentFromArgs(args: unknown): string | null {
  if (!args || typeof args !== "object") return null

  const parsedArgs = args as Record<string, unknown>
  const text = typeof parsedArgs.text === "string" ? parsedArgs.text.trim() : ""
  const images = Array.isArray(parsedArgs.images)
    ? parsedArgs.images
    : []

  const imageMarkdown = images
    .map((image, index) => {
      if (!image || typeof image !== "object") return ""
      const parsedImage = image as Record<string, unknown>
      const url = typeof parsedImage.url === "string" ? parsedImage.url.trim() : ""
      const alt = typeof parsedImage.alt === "string" ? parsedImage.alt.trim() : ""
      const safeAlt = alt.replace(/[\[\]]/g, "") || `Image ${index + 1}`
      if (url) return `![${safeAlt}](${url})`

      const imagePath = typeof parsedImage.path === "string" ? parsedImage.path.trim() : ""
      if (!imagePath) return ""

      // Local file paths are not valid markdown image URLs in renderer sanitization.
      // Keep a textual placeholder so path-only responses are still visible in revived sessions.
      const escapedPath = imagePath.replace(/`/g, "\\`")
      return `Local image (${safeAlt}): \`${escapedPath}\``
    })
    .filter(Boolean)

  const combined = [text, imageMarkdown.join("\n\n")]
    .filter(Boolean)
    .join("\n\n")
    .trim()

  return combined.length > 0 ? combined : null
}

function extractRespondToUserResponsesFromMessages(
  messages: Array<{
    role: "user" | "assistant" | "tool"
    toolCalls?: Array<{ name: string; arguments: unknown }>
  }>,
): string[] {
  const responses: string[] = []

  for (const message of messages) {
    if (message.role !== "assistant" || !message.toolCalls?.length) continue

    for (const call of message.toolCalls) {
      if (call.name !== RESPOND_TO_USER_TOOL) continue
      const content = extractRespondToUserContentFromArgs(call.arguments)
      if (!content) continue
      if (responses[responses.length - 1] === content) continue
      responses.push(content)
    }
  }

  return responses
}

const COLLAPSED_USER_RESPONSE_SCAN_LIMIT = 2048
const COLLAPSED_USER_RESPONSE_PREVIEW_LIMIT = 160
const BOTTOM_PIN_TOLERANCE_PX = 24

function isInternalCompletionNudge(content: string): boolean {
  return content.trim() === INTERNAL_COMPLETION_NUDGE_TEXT
}

function buildCollapsedUserResponsePreview(userResponse: string): string {
  const boundedResponse = userResponse.slice(0, COLLAPSED_USER_RESPONSE_SCAN_LIMIT)
  const preview = boundedResponse
    // Avoid showing huge inline data URL payloads in the collapsed preview.
    .replace(/!\[[^\]]*\]\((?:data:image[^)]*|[^)]*)\)/gi, "[image]")
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "[embedded image]")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()

  if (!preview) return "Image response"

  if (preview.length > COLLAPSED_USER_RESPONSE_PREVIEW_LIMIT) {
    return `${preview.slice(0, COLLAPSED_USER_RESPONSE_PREVIEW_LIMIT - 1).trimEnd()}…`
  }

  if (userResponse.length > COLLAPSED_USER_RESPONSE_SCAN_LIMIT) {
    return `${preview}…`
  }

  return preview
}


// Compact message component for space efficiency
const CompactMessage: React.FC<{
  message: {
    role: "user" | "assistant" | "tool"
    content: string
    isComplete?: boolean
    isThinking?: boolean
    isSummary?: boolean
    summarizedMessageCount?: number
    toolCalls?: Array<{ name: string; arguments: any }>
    toolResults?: Array<{ success: boolean; content: string; error?: string }>
    timestamp: number
  }
  ttsText?: string
  isLast: boolean
  isComplete: boolean
  hasErrors: boolean
  wasStopped?: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  deferOffscreenRendering?: boolean
  /** Variant controls TTS auto-play - only 'overlay' variant auto-plays TTS to prevent double playback */
  variant?: "default" | "overlay" | "tile"
  /** Session ID for tracking TTS playback across remounts */
  sessionId?: string
}> = ({ message, ttsText, isLast, isComplete, hasErrors, wasStopped = false, isExpanded, onToggleExpand, deferOffscreenRendering = false, variant = "default", sessionId }) => {
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track the ttsKey that's currently being generated, so we can clean it up on unmount
  const inFlightTtsKeyRef = useRef<string | null>(null)
  const configQuery = useConfigQuery()

  // Cleanup copy timeout and in-flight TTS key on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      // If we're unmounting while TTS generation is in-flight, remove the key
      // from the tracking set so future mounts can retry generation
      const inFlightKeyAtUnmount = inFlightTtsKeyRef.current
      if (inFlightKeyAtUnmount) {
        // IMPORTANT: defer cleanup to a microtask.
        // If generation has already completed, its `.then()` handler will run
        // before this microtask and clear `inFlightTtsKeyRef`, preventing us
        // from accidentally deleting a "success" key during a view switch.
        queueMicrotask(() => {
          if (inFlightTtsKeyRef.current === inFlightKeyAtUnmount) {
            removeTTSKey(inFlightKeyAtUnmount)
            inFlightTtsKeyRef.current = null
          }
        })
      }
    }
  }, [])

  // Copy to clipboard handler
  const handleCopyResponse = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await copyTextToClipboard(message.content)
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

  const displayResults = (message.toolResults || []).filter(
    (r) =>
      (r.error && r.error.trim().length > 0) ||
      (r.content && r.content.trim().length > 0),
  )
  const hasExtras =
    (message.toolCalls?.length ?? 0) > 0 ||
    displayResults.length > 0
  const shouldCollapse = (message.content?.length ?? 0) > 100 || hasExtras
  const isSummaryMessage = message.isSummary === true
  const summarizedMessageCount = typeof message.summarizedMessageCount === "number" && message.summarizedMessageCount > 0
    ? message.summarizedMessageCount
    : null
  const summaryCountLabel = summarizedMessageCount
    ? `Represents ${summarizedMessageCount.toLocaleString()} earlier ${summarizedMessageCount === 1 ? "message" : "messages"}`
    : "Represents earlier messages outside the active window"

  // Track the computed ttsSource (ttsText || message.content) since that's what determines the
  // ttsKey and should also gate async state updates.
  const ttsSource = sanitizeMessageContentForSpeech(ttsText || message.content)
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
    }
  }, [ttsSource])

  // Check if TTS button should be shown for this message (any completed assistant message with content)
  const shouldShowTTSButton = message.role === "assistant" && isComplete && configQuery.data?.ttsEnabled && !!(message.content?.trim())
  // Auto-play TTS only on the last message
  const shouldAutoPlayTTS = shouldShowTTSButton && isLast

  // Auto-play TTS when assistant message completes (but NOT if agent was stopped by kill switch)
  //
  // TTS AUTO-PLAY STRATEGY (fixes #557 - double TTS playback):
  // - Only auto-play in "overlay" variant (panel window) to prevent double playback
  // - The panel window is the primary interaction point for agent sessions
  // - When a non-snoozed session is active, the panel window is automatically shown
  // - Snoozed sessions don't show the panel, and intentionally don't auto-play TTS
  //   (they run silently in background - user can unsnooze to see/hear them)
  // - The "default" variant (main window ConversationDisplay) and "tile" variant (session tiles)
  //   never auto-play TTS - they are for viewing/managing, not primary interaction
  // - Additionally, we track which sessions have already played TTS in a module-level set
  //   to prevent double playback when AgentProgress remounts (e.g., when switching between
  //   single-session and multi-session views in the panel)
  useEffect(() => {
    // Only auto-generate and play TTS in overlay variant to prevent double playback
    const shouldAutoPlay = variant === "overlay"
    if (!shouldAutoPlay || !shouldAutoPlayTTS || !configQuery.data?.ttsAutoPlay || audioData || isGeneratingAudio || ttsError || wasStopped) {
      return
    }

    // Create a key to track TTS playback for this specific session + content combination
    // Use ttsSource (computed above) to ensure consistency with audioData invalidation
    const ttsKey = sessionId ? `${sessionId}:${ttsSource}` : null

    // If we have a session key and TTS has already played for this content, skip
    if (ttsKey && hasTTSPlayed(ttsKey)) {
      return
    }

    // Mark as playing before starting generation to prevent race conditions
    if (ttsKey) {
      markTTSPlayed(ttsKey)
      // Track in-flight key so we can clean up on unmount
      inFlightTtsKeyRef.current = ttsKey
    }

    generateAudio()
      .then(() => {
        // Generation succeeded, clear the in-flight ref (key stays in set permanently)
        inFlightTtsKeyRef.current = null
      })
      .catch((error) => {
        // If generation fails, remove from the set so user can retry
        // Only remove if this is still the in-flight key (prevents race condition where
        // a new mount re-added the key and this old catch handler would delete it)
        if (ttsKey && inFlightTtsKeyRef.current === ttsKey) {
          removeTTSKey(ttsKey)
          inFlightTtsKeyRef.current = null
        }
        // Error is already handled in generateAudio function
      })
  }, [shouldAutoPlayTTS, configQuery.data?.ttsAutoPlay, audioData, isGeneratingAudio, ttsError, wasStopped, variant, sessionId, ttsSource])

  const getRoleStyle = () => {
    if (isSummaryMessage) {
      return "border-l-2 border-sky-400 bg-sky-400/5 ring-1 ring-sky-400/15"
    }

    switch (message.role) {
      case "user":
        return "border-l-2 border-blue-400 bg-blue-400/5"
      case "assistant":
        return isComplete && isLast && !hasErrors
          ? "border-l-2 border-green-400 bg-green-400/5"
          : "border-l-2 border-gray-400 bg-gray-400/5"
      case "tool":
        return "border-l-2 border-orange-400 bg-orange-400/5"
      default:
        return "border-l-2 border-gray-400 bg-gray-400/5"
    }
  }

  const handleToggleExpand = () => {
    if (shouldCollapse) {
      onToggleExpand()
    }
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the message click
    onToggleExpand()
  }

  return (
    <div className={cn(
      "rounded text-xs transition-all duration-200",
      getRoleStyle(),
      !isExpanded && shouldCollapse && "hover:bg-muted/20",
      shouldCollapse && "cursor-pointer"
    )}
    style={deferOffscreenRendering
      ? {
          contentVisibility: "auto",
          containIntrinsicSize: "auto 160px",
        }
      : undefined}
    >
      <div
        className="flex items-start px-2 py-1 text-left"
        onClick={handleToggleExpand}
      >
        <div className="flex-1 min-w-0">
          {isSummaryMessage && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-sky-700 dark:text-sky-200">
              <Badge
                variant="outline"
                className="border-sky-300/70 bg-sky-100/70 text-sky-700 dark:border-sky-700/70 dark:bg-sky-950/40 dark:text-sky-200"
              >
                <Brain className="mr-1 h-3 w-3" />
                Context summary
              </Badge>
              <span className="font-medium text-sky-700/80 dark:text-sky-300/80">
                {summaryCountLabel}
              </span>
            </div>
          )}
          <div className={cn(
            "leading-relaxed text-left",
            !isExpanded && shouldCollapse && "line-clamp-2"
          )}>
          <MarkdownRenderer content={(message.content ?? "").trim()} />
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
                          <pre className="rounded bg-muted/50 p-2 overflow-auto text-xs whitespace-pre-wrap max-h-80 scrollbar-thin">
                            {JSON.stringify(toolCall.arguments, null, 2)}
                          </pre>
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

          {/* TTS Audio Player - show for all completed assistant messages with content */}
          {shouldShowTTSButton && (
            <div className="mt-2 min-w-0 space-y-1">
              <AudioPlayer
                audioData={audioData || undefined}
                text={ttsSource}
                onGenerateAudio={generateAudio}
                isGenerating={isGeneratingAudio}
                error={ttsError}
                compact={true}
                autoPlay={isLast ? (configQuery.data?.ttsAutoPlay ?? true) : false}
                onPlayStateChange={setIsTTSPlaying}
              />
              {ttsError && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300">
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
    </div>
  )
}

// Helper to extract execute_command display info
function getExecuteCommandDisplay(call: { name: string; arguments: any }, result?: { success: boolean; content: string; error?: string }) {
  if (call.name !== "execute_command") return null

  const command = typeof call.arguments?.command === "string" ? call.arguments.command : null
  if (!command) return null

  let outputPreview: string | null = null
  if (result?.content) {
    try {
      const parsed = JSON.parse(result.content)
      const stdout = parsed.stdout || ""
      const stderr = parsed.stderr || ""
      const output = stdout || stderr || parsed.error || ""
      if (output) {
        // Take first meaningful line, trim whitespace
        const firstLine = output.split("\n").map((l: string) => l.trim()).filter(Boolean)[0] || ""
        outputPreview = firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine
      }
    } catch {
      // not JSON, use raw content
      const firstLine = result.content.split("\n").map((l: string) => l.trim()).filter(Boolean)[0] || ""
      outputPreview = firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine
    }
  }

  // Truncate command for display
  const displayCommand = command.length > 60 ? command.slice(0, 57) + "…" : command

  return { displayCommand, outputPreview }
}

// Unified Tool Execution bubble combining call + response
const ToolExecutionBubble: React.FC<{
  execution: {
    timestamp: number
    calls: Array<{ name: string; arguments: any }>
    results: Array<{ success: boolean; content: string; error?: string }>
  }
  isExpanded: boolean
  onToggleExpand: () => void
}> = ({ execution, isExpanded, onToggleExpand }) => {
  const copy = async (text: string) => {
    try {
      await copyTextToClipboard(text)
    } catch {}
  }

  const handleToggleExpand = () => onToggleExpand()

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    copy(text)
  }

  // Compact single-line per tool display
  return (
    <div className="space-y-0.5 text-xs">
      {execution.calls.map((call, idx) => {
        const result = execution.results[idx]
        const callIsPending = !result
        const callSuccess = result?.success
        const callResultSummary = result ? getToolResultsSummary([result]) : null
        const isToolExpanded = isExpanded
        const execCmdDisplay = getExecuteCommandDisplay(call, result)

        return (
          <div key={idx}>
            {/* Single line tool header */}
            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30",
                callIsPending
                  ? "text-blue-600 dark:text-blue-400"
                  : callSuccess
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
              )}
              onClick={handleToggleExpand}
            >
              {execCmdDisplay ? (
                <>
                  <span className="min-w-0 shrink truncate font-mono font-medium" title={call.arguments?.command}>{execCmdDisplay.displayCommand}</span>
                  <span className="shrink-0 text-[10px] opacity-60">
                    {callIsPending ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : callSuccess ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <XCircle className="h-2.5 w-2.5" />
                    )}
                  </span>
                  {!isToolExpanded && execCmdDisplay.outputPreview && (
                    <span className="min-w-0 flex-1 truncate text-[10px] font-mono opacity-50">→ {execCmdDisplay.outputPreview}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="min-w-0 shrink truncate font-mono font-medium" title={call.name}>{call.name}</span>
                  <span className="shrink-0 text-[10px] opacity-60">
                    {callIsPending ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : callSuccess ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <XCircle className="h-2.5 w-2.5" />
                    )}
                  </span>
                  {!isToolExpanded && callResultSummary && (
                    <span className="min-w-0 flex-1 truncate text-[10px] opacity-50">{callResultSummary}</span>
                  )}
                </>
              )}
              <ChevronRight className={cn(
                "h-2.5 w-2.5 opacity-40 flex-shrink-0 transition-transform",
                isToolExpanded && "rotate-90"
              )} />
            </div>

            {/* Expanded details for this tool */}
            {isToolExpanded && (
              <div className="mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]">
                {call.arguments && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="min-w-0 font-medium opacity-70">Parameters</span>
                      <Button size="sm" variant="ghost" className="h-5 shrink-0 px-1.5 text-[10px]" onClick={(e) => handleCopy(e, JSON.stringify(call.arguments, null, 2))}>
                        <Copy className="h-2 w-2 mr-0.5" /> Copy
                      </Button>
                    </div>
                    <pre className="rounded bg-muted/40 p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap max-w-full max-h-32 scrollbar-thin text-[10px]">
                      {JSON.stringify(call.arguments, null, 2)}
                    </pre>
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
                      <pre className={cn(
                        "rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px]",
                        result.success ? "bg-green-50/50 dark:bg-green-950/30" : "bg-muted/40"
                      )}>
                        {result.content}
                      </pre>
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
            )}
          </div>
        )
      })}
    </div>
  )
}

// Unified Assistant + Tool Execution component - combines thought and tool call as one message
const AssistantWithToolsBubble: React.FC<{
  data: {
    thought: string
    timestamp: number
    isComplete: boolean
    calls: Array<{ name: string; arguments: any }>
    results: Array<{ success: boolean; content: string; error?: string }>
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

  const isPending = data.results.length === 0
  const allSuccess = data.results.length > 0 && data.results.every(r => r.success)
  const hasThought = data.thought && data.thought.trim().length > 0
  const shouldCollapse = (data.thought?.length ?? 0) > 100 || data.calls.length > 0

  // Generate result summary for collapsed state
  const collapsedResultSummary = (() => {
    if (isExpanded || isPending) return null
    if (data.results.length === 0) return null
    const toolResults = data.results.map(r => ({
      success: r.success,
      content: r.content,
      error: r.error,
    }))
    return getToolResultsSummary(toolResults)
  })()

  const handleToggleExpand = () => {
    if (shouldCollapse) {
      onToggleExpand()
    }
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
      "rounded text-xs transition-all duration-200",
      "border-l-2 border-gray-400 bg-gray-400/5",
      !isExpanded && shouldCollapse && "hover:bg-muted/20",
      shouldCollapse && "cursor-pointer"
    )}>
      {/* Thought content section */}
      <div
        className="flex items-start px-2 py-1 text-left"
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

          {/* Tool execution section - compact single line per tool */}
          <div className={cn(
            hasThought ? "mt-1" : "",
            "space-y-0.5"
          )}>
            {data.calls.map((call, idx) => {
              const result = data.results[idx]
              const callIsPending = !result
              const callSuccess = result?.success
              const callResultSummary = result ? getToolResultsSummary([result]) : null
              const execCmdDisplay = getExecuteCommandDisplay(call, result)

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30",
                    callIsPending
                      ? "text-blue-600 dark:text-blue-400"
                      : callSuccess
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                  )}
                  onClick={handleToggleToolDetails}
                >
                  {execCmdDisplay ? (
                    <>
                      <span className="min-w-0 shrink truncate font-mono font-medium" title={call.arguments?.command}>{execCmdDisplay.displayCommand}</span>
                      <span className="shrink-0 text-[10px] opacity-60">
                        {callIsPending ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : callSuccess ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5" />
                        )}
                      </span>
                      {!showToolDetails && execCmdDisplay.outputPreview && (
                        <span className="min-w-0 flex-1 truncate text-[10px] font-mono opacity-50">→ {execCmdDisplay.outputPreview}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 shrink truncate font-mono font-medium" title={call.name}>{call.name}</span>
                      <span className="shrink-0 text-[10px] opacity-60">
                        {callIsPending ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : callSuccess ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5" />
                        )}
                      </span>
                      {!showToolDetails && callResultSummary && (
                        <span className="min-w-0 flex-1 truncate text-[10px] opacity-50">{callResultSummary}</span>
                      )}
                    </>
                  )}
                  <ChevronRight className={cn(
                    "h-2.5 w-2.5 opacity-40 flex-shrink-0 transition-transform",
                    showToolDetails && "rotate-90"
                  )} />
                </div>
              )
            })}
          </div>

          {/* Expanded tool details */}
          {showToolDetails && (
            <div className="mt-1 ml-3 space-y-1 border-l border-border/50 pl-2">
              {data.calls.map((call, idx) => {
                const result = data.results[idx]
                return (
                  <div key={idx} className="text-[10px] space-y-1">
                    <div className="font-medium opacity-70 break-words">Parameters:</div>
                    {call.arguments && (
                      <pre className="rounded bg-muted/40 p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap max-w-full max-h-32 scrollbar-thin text-[10px]">
                        {JSON.stringify(call.arguments, null, 2)}
                      </pre>
                    )}
                    {result && (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5 font-medium opacity-70">
                          Result:
                          <span className={cn(
                            "shrink-0 text-[10px] font-semibold",
                            result.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          )}>
                            {result.success ? "OK" : "ERR"}
                          </span>
                        </div>
                        {result.error && (
                          <pre className="rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px] bg-red-50/50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
                            {result.error}
                          </pre>
                        )}
                        {result.content && (
                          <pre className={cn(
                            "rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px]",
                            result.success ? "bg-green-50/50 dark:bg-green-950/30" : "bg-muted/40"
                          )}>
                            {result.content}
                          </pre>
                        )}
                        {!result.error && !result.content && (
                          <pre className="rounded p-1.5 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px] bg-muted/40">
                            No content
                          </pre>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
              {data.executionStats && (
                <ToolExecutionStats stats={data.executionStats} compact />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to format tool arguments for preview
const formatArgumentsPreview = (args: any): string => {
  if (!args || typeof args !== 'object') return ''
  const entries = Object.entries(args)
  if (entries.length === 0) return ''

  // Take first 3 key parameters
  const preview = entries.slice(0, 3).map(([key, value]) => {
    let displayValue: string
    if (typeof value === 'string') {
      displayValue = value.length > 30 ? value.slice(0, 30) + '...' : value
    } else if (typeof value === 'object') {
      displayValue = Array.isArray(value) ? `[${value.length} items]` : '{...}'
    } else {
      displayValue = String(value)
    }
    return `${key}: ${displayValue}`
  }).join(', ')

  if (entries.length > 3) {
    return preview + ` (+${entries.length - 3} more)`
  }
  return preview
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
            <pre className="mt-1.5 max-h-32 max-w-full overflow-x-auto rounded bg-amber-100/70 p-2 text-xs text-amber-900 whitespace-pre-wrap break-words dark:bg-amber-900/40 dark:text-amber-100">
              {JSON.stringify(approval.arguments, null, 2)}
            </pre>
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
          label: message.toolName || "Tool",
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
    <div className={cn("rounded-lg border text-xs transition-all", roleMeta.containerClass)}>
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className={cn("mt-0.5 rounded-full p-1.5 bg-white/70 dark:bg-black/20", roleMeta.iconClass)}>
          <RoleIcon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("mb-1 flex gap-2", isCompact ? "flex-col items-start" : "flex-wrap items-center")}>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", roleMeta.badgeClass)}>
              {roleMeta.label}
            </span>
            {timestampLabel && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {timestampLabel}
              </span>
            )}
          </div>
          <div
            className={cn(
              "whitespace-pre-wrap break-words text-[13px] leading-5 text-gray-700 dark:text-gray-200",
              !isExpanded && isLongContent && (isCompact ? "line-clamp-3" : "line-clamp-4"),
            )}
          >
            {message.content}
          </div>
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

// Collapsible Subagent Conversation Panel
const RECENT_MESSAGES_LIMIT = 3

const SubAgentConversationPanel: React.FC<{
  conversation: ACPSubAgentMessage[]
  agentName: string
  isOpen: boolean
  onToggle: () => void
  isCompact?: boolean
}> = ({ conversation, agentName, isOpen, onToggle, isCompact = false }) => {
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({})
  const [showAll, setShowAll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const previousConversationLengthRef = useRef(conversation.length)

  const toggleMessage = (index: number) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
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
    if (!isOpen) return
    scrollToBottom("auto")
    setIsPinnedToBottom(true)
  }, [isOpen])

  // Keep ACP sub-agent conversation updates pinned in the same paint as new
  // delegated messages arrive. Smooth scrolling here visibly lags behind rapid
  // conversation updates and leaves the inner session scroller off-bottom.
  useLayoutEffect(() => {
    const hadNewMessages = conversation.length > previousConversationLengthRef.current
    previousConversationLengthRef.current = conversation.length

    if (!isOpen || !hadNewMessages || !isPinnedToBottom) {
      return
    }

    scrollToBottom("auto")
  }, [conversation.length, isOpen, isPinnedToBottom])

  const visibleMessages = showAll
    ? conversation
    : conversation.slice(-RECENT_MESSAGES_LIMIT)
  const hiddenCount = conversation.length - visibleMessages.length

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      {/* Collapsible Header */}
      <div
        className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={onToggle}
      >
        <div className="min-w-0 flex flex-1 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-600 dark:text-gray-400">
            {isOpen ? "Recent activity" : conversationPreview}
          </span>
          <Badge variant="outline" className="h-4 shrink-0 px-1 py-0 text-[10px]">
            {conversation.length}
          </Badge>
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); void handleCopyAll() }}
            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Copy conversation"
            aria-label="Copy conversation"
          >
            <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
          </button>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="relative bg-white/50 dark:bg-black/20">
          {hiddenCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAll(true) }}
              className="w-full px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center border-b border-gray-100 dark:border-gray-800"
            >
              Show {hiddenCount} earlier message{hiddenCount > 1 ? "s" : ""}
            </button>
          )}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto p-1.5 space-y-1.5"
            style={{ maxHeight: isCompact ? "min(35vh, 240px)" : "min(40vh, 300px)" }}
          >
            {visibleMessages.map((msg, idx) => {
              const originalIdx = showAll ? idx : conversation.length - RECENT_MESSAGES_LIMIT + idx
              return (
                <SubAgentConversationMessage
                  key={originalIdx}
                  message={msg}
                  agentName={agentName}
                  isExpanded={expandedMessages[originalIdx] ?? false}
                  onToggleExpand={() => toggleMessage(originalIdx)}
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
                // Recover to the latest delegated message immediately.
                // A smooth animation here leaves the inner scroller hundreds of
                // pixels behind while streaming continues, and the scroll events
                // fired mid-animation can incorrectly flip us back out of the
                // pinned state before the viewport ever reaches the bottom.
                scrollToBottom("auto")
              }}
              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              <ChevronDown className="h-3 w-3" />
              Latest
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Delegation Bubble - shows status of delegated subagent tasks
// The entire component is collapsible, and conversations persist after completion
const DelegationBubble: React.FC<{
  delegation: ACPDelegationProgress
  isExpanded?: boolean
  onToggleExpand?: () => void
}> = ({ delegation, isExpanded = false, onToggleExpand }) => {
  const { ref: containerRef, isCompact } = useCompactWidth<HTMLDivElement>()
  const [isConversationOpen, setIsConversationOpen] = useState(false)
  const isRunning = delegation.status === 'running' || delegation.status === 'pending' || delegation.status === 'spawning'
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
  const bodyTextColor = textColor.replace('800', '700').replace('200', '300')
  const statusLabel = formatDelegationStatus(delegation.status)
  const subtitle = getDelegationSubtitle(delegation, isCompact ? 72 : 120)
  const durationLabel = `${duration}s`
  const statusBadgeClass = isCompleted
    ? 'border-green-300/70 bg-green-100/70 text-green-800 dark:border-green-700/70 dark:bg-green-900/40 dark:text-green-200'
    : isFailed
    ? 'border-red-300/70 bg-red-100/70 text-red-800 dark:border-red-700/70 dark:bg-red-900/40 dark:text-red-200'
    : isCancelled
    ? 'border-amber-300/70 bg-amber-100/70 text-amber-800 dark:border-amber-700/70 dark:bg-amber-900/40 dark:text-amber-200'
    : 'border-blue-300/70 bg-blue-100/70 text-blue-800 dark:border-blue-700/70 dark:bg-blue-900/40 dark:text-blue-200'

  return (
    <div ref={containerRef} className={cn("rounded-lg border overflow-hidden", statusColor)}>
      {/* Header - clickable to collapse/expand entire bubble */}
      <div
        className={cn(
          "px-3 py-2.5 cursor-pointer hover:opacity-90 transition-opacity",
          isExpanded && "border-b",
          headerColor
        )}
        onClick={handleHeaderClick}
      >
        <div className="flex items-start gap-2">
          <Bot className={cn("mt-0.5 h-3.5 w-3.5 flex-shrink-0", iconColor)} />
          <div className="min-w-0 flex-1">
            <div className={cn("flex gap-2", isCompact ? "flex-col items-start" : "items-start justify-between")}>
              <div className="min-w-0 flex-1">
                <div className={cn("text-xs font-medium truncate", textColor)}>
                  {delegation.agentName}
                </div>
                <div className="mt-0.5 text-[11px] leading-4 text-gray-600 dark:text-gray-400 line-clamp-2">
                  {subtitle}
                </div>
              </div>
              <div className={cn("flex items-center gap-1.5", isCompact ? "w-full justify-between" : "pl-2 flex-shrink-0")}>
                <Badge variant="outline" className={cn("h-5 rounded-full px-1.5 text-[10px] font-medium", statusBadgeClass)}>
                  {statusLabel}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                {isRunning ? (
                  <Loader2 className={cn("h-3 w-3 animate-spin", iconColor)} />
                ) : isCompleted ? (
                  <Check className={cn("h-3 w-3", iconColor)} />
                ) : isFailed ? (
                  <XCircle className={cn("h-3 w-3", iconColor)} />
                ) : (
                  <OctagonX className={cn("h-3 w-3", iconColor)} />
                )}
                <span>{durationLabel}</span>
              </span>
              {hasConversation && (
                <span>{delegation.conversation!.length} messages</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - only shown when expanded */}
      {isExpanded && (
        <div className="px-3 py-3 space-y-3">
          {/* Collapsible conversation panel - persists after completion */}
          {hasConversation && (
            <SubAgentConversationPanel
              conversation={delegation.conversation!}
              agentName={delegation.agentName}
              isOpen={isConversationOpen}
              onToggle={() => setIsConversationOpen(!isConversationOpen)}
              isCompact={isCompact}
            />
          )}

          <div className="space-y-1">
            <div className={cn("text-[11px] font-semibold uppercase tracking-wide", mutedTextColor)}>
              Task
            </div>
            <p className={cn("text-[12px] leading-4 whitespace-pre-wrap break-words", bodyTextColor)}>
              {delegation.task}
            </p>
          </div>

          {/* Progress message */}
          {delegation.progressMessage && (
            <div className="space-y-1">
              <div className={cn("text-[11px] font-semibold uppercase tracking-wide", mutedTextColor)}>
                Latest update
              </div>
              <p className={cn("text-[12px] leading-4 italic whitespace-pre-wrap break-words", mutedTextColor)}>
                {delegation.progressMessage}
              </p>
            </div>
          )}

          {/* Result summary */}
          {delegation.resultSummary && (
            <div className="space-y-1 rounded-md border border-white/60 bg-white/50 p-2 dark:border-white/10 dark:bg-black/20">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Result
              </div>
              <p className="text-[12px] leading-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {delegation.resultSummary}
              </p>
            </div>
          )}

          {/* Error message */}
          {delegation.error && (
            <div className="space-y-1 rounded-md border border-red-200/80 bg-red-100/50 p-2 dark:border-red-800/70 dark:bg-red-900/30">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                Error
              </div>
              <p className="text-[12px] leading-4 text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
                {delegation.error}
              </p>
            </div>
          )}

          {/* Status footer */}
          <div className={cn("flex items-center justify-between gap-2 border-t border-black/5 pt-2 dark:border-white/10", isCompact && "flex-col items-stretch")}>
            <span className={cn("text-[11px]", mutedTextColor)}>
              {statusLabel} · {durationLabel}
            </span>
            {hasConversation && !isConversationOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsConversationOpen(true)
                }}
                className="inline-flex h-8 items-center justify-center rounded-md border border-purple-200/80 px-3 text-[11px] font-medium text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-800/70 dark:text-purple-300 dark:hover:bg-purple-950/30"
              >
                Open conversation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
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
      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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

// Collapsed past response item - shows a single past respond_to_user call with TTS playback
const PastResponseItem: React.FC<{
  response: string
  index: number
  sessionId?: string
}> = ({ response, index, sessionId }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const configQuery = useConfigQuery()
  const shouldShowTTSButton = configQuery.data?.ttsEnabled
  const ttsResponseText = sanitizeMessageContentForSpeech(response)

  const generatePastAudio = async (): Promise<ArrayBuffer> => {
    const result = await tipcClient.generateSpeech({ text: ttsResponseText })
    return result.audio
  }

  const preview = response.length > 80 ? response.slice(0, 80) + "…" : response

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-md border border-green-200/60 dark:border-green-800/40">
      <div
        className="flex min-w-0 items-start gap-2 cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-green-500 dark:text-green-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-green-500 dark:text-green-500 flex-shrink-0" />
        )}
        <span className="text-[10px] font-medium text-green-600 dark:text-green-400 flex-shrink-0">
          #{index + 1}
        </span>
        {!isExpanded && (
          <span className="min-w-0 flex-1 text-xs text-green-700/70 dark:text-green-300/60 line-clamp-2 break-words [overflow-wrap:anywhere]">
            {preview}
          </span>
        )}
      </div>
      {isExpanded && (
        <div className="min-w-0 border-t border-green-200/40 px-2.5 pb-2 dark:border-green-800/30">
          <div className="pt-1.5 text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap break-words">
            <MarkdownRenderer content={response} />
          </div>
          {shouldShowTTSButton && (
            <div className="mt-1.5 min-w-0">
              <AudioPlayer
                text={ttsResponseText}
                onGenerateAudio={generatePastAudio}
                compact={true}
                autoPlay={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Mid-turn User Response Bubble - shows userResponse from respond_to_user mid-turn with TTS support
const MidTurnUserResponseBubble: React.FC<{
  userResponse: string
  pastResponses?: string[]
  sessionId?: string
  agentLabel?: string
  variant?: "default" | "overlay" | "tile"
  isComplete: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}> = ({
  userResponse,
  pastResponses,
  sessionId,
  agentLabel = "Agent",
  variant = "default",
  isComplete,
  isExpanded,
  onToggleExpand,
}) => {
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  const inFlightTtsKeyRef = useRef<string | null>(null)
  const configQuery = useConfigQuery()
  const ttsGenerationIdRef = useRef(0)
  const ttsSource = sanitizeMessageContentForSpeech(userResponse)
  const latestTtsSourceRef = useRef(ttsSource)
  latestTtsSourceRef.current = ttsSource

  // TTS generation function
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
      return result.audio
    } catch (error) {
      console.error("[TTS MidTurn] Failed to generate TTS audio:", error)

      let errorMessage = "Failed to generate audio"
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "TTS API key not configured"
        } else if (error.message.includes("terms acceptance")) {
          errorMessage = "Groq TTS model requires terms acceptance"
        } else if (error.message.includes("rate limit")) {
          errorMessage = "Rate limit exceeded"
        } else {
          errorMessage = `TTS error: ${error.message}`
        }
      }

      if (
        ttsGenerationIdRef.current === generationId &&
        latestTtsSourceRef.current === generationSource
      ) {
        setTtsError(errorMessage)
      }
      throw error
    } finally {
      if (ttsGenerationIdRef.current === generationId) {
        setIsGeneratingAudio(false)
      }
    }
  }

  // Auto-play TTS for mid-turn userResponse (only in overlay variant to prevent double-play)
  useEffect(() => {
    const shouldAutoPlay = variant === "overlay"
    if (!shouldAutoPlay || !ttsSource || !configQuery.data?.ttsEnabled || !configQuery.data?.ttsAutoPlay || audioData || isGeneratingAudio || ttsError || isComplete) {
      return
    }

    // Create a key to track TTS playback - use mid-turn prefix to avoid collision with completion TTS
    const ttsKey = sessionId ? `${sessionId}:mid-turn:${ttsSource}` : null

    if (ttsKey && hasTTSPlayed(ttsKey)) {
      return
    }

    // Mark as playing before starting generation
    if (ttsKey) {
      markTTSPlayed(ttsKey)
      // Also mark the non-prefixed key that the completion path will check
      // to prevent double TTS playback when session completes
      if (sessionId) {
        markTTSPlayed(`${sessionId}:${ttsSource}`)
      }
      inFlightTtsKeyRef.current = ttsKey
    }

    generateAudio()
      .then(() => {
        inFlightTtsKeyRef.current = null
      })
      .catch(() => {
        if (ttsKey && inFlightTtsKeyRef.current === ttsKey) {
          removeTTSKey(ttsKey)
          inFlightTtsKeyRef.current = null
        }
      })
  }, [ttsSource, configQuery.data?.ttsEnabled, configQuery.data?.ttsAutoPlay, audioData, isGeneratingAudio, ttsError, variant, sessionId, isComplete])

  // Cleanup in-flight TTS key on unmount
  useEffect(() => {
    return () => {
      const inFlightKeyAtUnmount = inFlightTtsKeyRef.current
      if (inFlightKeyAtUnmount) {
        queueMicrotask(() => {
          if (inFlightTtsKeyRef.current === inFlightKeyAtUnmount) {
            removeTTSKey(inFlightKeyAtUnmount)
            inFlightTtsKeyRef.current = null
          }
        })
      }
    }
  }, [])

  if (!userResponse) return null

  const shouldShowTTSButton = configQuery.data?.ttsEnabled
  const collapsedPreview = useMemo(
    () => buildCollapsedUserResponsePreview(userResponse),
    [userResponse],
  )

  const shouldKeepAudioPlayerMounted =
    shouldShowTTSButton &&
    (isExpanded || (variant === "overlay" && (configQuery.data?.ttsAutoPlay ?? true)))

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border-2 border-green-400 bg-green-50/50 dark:bg-green-950/30">
      {/* Header */}
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-start gap-2 cursor-pointer bg-green-100/50 px-3 py-2 transition-colors hover:bg-green-100/70 dark:bg-green-900/30 dark:hover:bg-green-900/40",
          isExpanded && "border-b border-green-200 dark:border-green-800",
        )}
        onClick={onToggleExpand}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
        )}
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
        <div className="min-w-0 flex-1 space-y-1 text-left">
          <div className="text-xs font-medium text-green-800 dark:text-green-200 truncate">
            {agentLabel}
          </div>
          <div
            className={cn(
              "min-w-0 text-xs text-green-700/80 dark:text-green-300/70",
              isExpanded
                ? "font-medium"
                : "line-clamp-2 break-words [overflow-wrap:anywhere]"
            )}
          >
            {isExpanded ? "Latest response" : collapsedPreview}
          </div>
        </div>
        {(isTTSPlaying || isGeneratingAudio) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              ttsManager.stopAll("agent-progress-midturn-pause")
            }}
            className={cn(
              "ml-auto shrink-0 self-start rounded p-1 transition-colors hover:bg-green-200/50 dark:hover:bg-green-800/50",
              isTTSPlaying && "animate-pulse"
            )}
            title={isGeneratingAudio ? "Generating audio…" : "Pause TTS"}
          >
            {isGeneratingAudio ? (
              <Loader2 className="h-3 w-3 animate-spin text-green-600 dark:text-green-400" />
            ) : (
              <Volume2 className="h-3 w-3 text-green-600 dark:text-green-400" />
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Content */}
          <div className="min-w-0 px-3 py-2">
            <div className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap break-words">
              <MarkdownRenderer content={userResponse} />
            </div>
          </div>
        </>
      )}

      {shouldKeepAudioPlayerMounted && (
        <div className={cn("min-w-0 px-3", isExpanded ? "pb-2" : "hidden")}>
          <AudioPlayer
            audioData={audioData || undefined}
            text={ttsSource}
            onGenerateAudio={generateAudio}
            isGenerating={isGeneratingAudio}
            error={ttsError}
            compact={true}
            autoPlay={configQuery.data?.ttsAutoPlay ?? true}
            onPlayStateChange={setIsTTSPlaying}
          />
          {isExpanded && ttsError && (
            <div className="mt-1 rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300">
              <span className="font-medium">Audio generation failed:</span> {ttsError}
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <>
          {/* Past Responses History */}
          {pastResponses && pastResponses.length > 0 && (
            <div className="border-t border-green-200/60 bg-green-50/30 px-3 py-2 dark:border-green-800/40 dark:bg-green-950/20">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-green-600/70 dark:text-green-400/60">
                  Past Responses
                </span>
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-200">
                  {pastResponses.length}
                </span>
              </div>
              <div className="space-y-1">
                {pastResponses.map((response, idx) => (
                  <PastResponseItem
                    key={`past-response-${idx}`}
                    response={response}
                    index={idx}
                    sessionId={sessionId}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
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
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const shouldAutoScrollRef = useRef(true)
  const lastMessageCountRef = useRef(0)
  const lastContentLengthRef = useRef(0)
  const lastDisplayItemsCountRef = useRef(0)
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
  const [showFullHistory, setShowFullHistory] = useState(false)

  // Get current conversation ID for deep-linking and session focus control
  const currentConversationId = useConversationStore((s) => s.currentConversationId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const setSessionSnoozed = useAgentStore((s) => s.setSessionSnoozed)

  // Get queued messages for this conversation (used in overlay variant)
  const queuedMessages = useMessageQueue(progress?.conversationId)
  const isQueuePaused = useIsQueuePaused(progress?.conversationId)
  const hasQueuedMessages = queuedMessages.length > 0

  // Helper to toggle expansion state for a specific item
  // Uses defaultExpanded fallback for items that haven't been explicitly toggled yet
  // (like tool executions which default to expanded)
  // By deriving the current state from prev inside the setter, this is resilient to
  // batched updates (e.g., double-clicks will correctly round-trip)
  const toggleItemExpansion = useCallback((itemKey: string, defaultExpanded: boolean) => {
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
  }, [])

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

  // Handle snooze/minimize
  const handleSnooze = async (e?: React.MouseEvent) => {
    e?.stopPropagation() // Prevent event bubbling
    if (!progress?.sessionId) return

    logUI('🔴 [AgentProgress OVERLAY] Minimize button clicked in OVERLAY (not sidebar):', {
      sessionId: progress.sessionId,
      currentlySnoozed: progress.isSnoozed
    })

    // Update local store first so UI reflects the change immediately
    setSessionSnoozed(progress.sessionId, true)

    try {
      // Snooze the session in backend
      await tipcClient.snoozeAgentSession({ sessionId: progress.sessionId })
    } catch (error) {
      // Rollback local state only when the API call fails to keep UI and backend in sync
      setSessionSnoozed(progress.sessionId, false)
      logUI('🔴 [AgentProgress OVERLAY] Failed to snooze, rolled back local state')
      console.error("Failed to snooze session:", error)
      return
    }

    // UI updates after successful API call - don't rollback if these fail
    try {
      // Unfocus this session so the overlay hides
      setFocusedSessionId(null)
      // Hide the panel window completely
      await tipcClient.hidePanelWindow({})
      logUI('🔴 [AgentProgress OVERLAY] Session snoozed, unfocused, and panel hidden')
    } catch (error) {
      // Log UI errors but don't rollback - the backend state is already updated
      logUI('🔴 [AgentProgress OVERLAY] Session snoozed but UI update failed')
      console.error("Failed to update UI after snooze:", error)
    }
  }

  // Close button handler for completed agent view
  const handleClose = async () => {
    try {
      const thisId = progress?.sessionId
      // Avoid subscribing every AgentProgress instance to the full progress map.
      // During streaming, that broad selector forces unrelated tiles with long
      // histories to re-render on every chunk even though this branch only runs
      // when the user clicks close.
      const agentProgressById = useAgentStore.getState().agentProgressById
      const hasOtherVisible = thisId
        ? Array.from(agentProgressById?.values() ?? []).some(p => p && p.sessionId !== thisId && !p.isSnoozed)
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

  const handleApproveToolCall = useCallback(async () => {
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
      // Only reset on error so user can retry
      respondingApprovalIdRef.current = null
      setRespondingApprovalId(null)
    }
  }, [progress?.pendingToolApproval?.approvalId])

  const handleDenyToolCall = useCallback(async () => {
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
      // Only reset on error so user can retry
      respondingApprovalIdRef.current = null
      setRespondingApprovalId(null)
    }
  }, [progress?.pendingToolApproval?.approvalId])

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
    fullConversationHistory,
    conversationCompaction,
    sessionStartIndex,
    contextInfo,
    modelInfo,
    profileName,
    acpSessionInfo,
  } = progress
  const hasErrors = steps.some(
    (step) => step.status === "error" || step.toolResult?.error,
  )

  // Detect if agent was stopped by kill switch
  const wasStopped = finalContent?.includes("emergency kill switch") ||
                    steps?.some(step => step.title === "Agent stopped" ||
                               step.description?.includes("emergency kill switch"))

  // Use conversation history if available, otherwise fall back to extracting from steps.
  // This stays stable while only the live streaming bubble changes, which avoids
  // rebuilding the whole transcript model on every streamed chunk.
  const messages = useMemo(() => {
    const nextMessages: Array<{
      role: "user" | "assistant" | "tool"
      content: string
      isComplete: boolean
      timestamp: number
      isThinking: boolean
      toolCalls?: Array<{ name: string; arguments: any }>
      toolResults?: Array<{ success: boolean; content: string; error?: string }>
    }> = []

    if (conversationHistory && conversationHistory.length > 0) {
      const startIndex =
        typeof sessionStartIndex === "number" && sessionStartIndex > 0
          ? Math.min(sessionStartIndex, conversationHistory.length)
          : 0
      const historyForSession =
        startIndex > 0 ? conversationHistory.slice(startIndex) : conversationHistory

      nextMessages.push(
        ...historyForSession
          .filter((entry) => !(entry.role === "user" && isInternalCompletionNudge(entry.content)))
          .map((entry) => ({
            role: entry.role,
            content: entry.content,
            isComplete: true,
            timestamp: entry.timestamp || Date.now(),
            isThinking: false,
            toolCalls: entry.toolCalls,
            toolResults: entry.toolResults,
          })),
      )

      const currentThinkingStep = !isComplete
        ? steps.find(
            (step) => step.type === "thinking" && step.status === "in_progress",
          )
        : undefined
      if (currentThinkingStep) {
        const isStreaming = progress.streamingContent?.isStreaming
        const latestAssistantHistoryMessage = [...nextMessages]
          .reverse()
          .find(
            (message) =>
              message.role === "assistant" &&
              !message.toolCalls?.length &&
              !message.toolResults?.length &&
              message.content.trim().length > 0,
          )
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
        .forEach((step) => {
          if (step.llmContent && step.llmContent.trim().length > 0) {
            nextMessages.push({
              role: "assistant",
              content: step.llmContent,
              isComplete: step.status === "completed",
              timestamp: step.timestamp,
              isThinking: false,
            })
          } else if (step.status === "in_progress" && !isComplete) {
            const isVerificationStep = step.title?.toLowerCase().includes("verifying")
            if (!isVerificationStep) {
              nextMessages.push({
                role: "assistant",
                content: step.description || "Agent is thinking...",
                isComplete: false,
                timestamp: step.timestamp,
                isThinking: true,
              })
            }
          }
        })

      if (finalContent && finalContent.trim().length > 0) {
        const lastMessage = nextMessages[nextMessages.length - 1]
        if (!lastMessage || lastMessage.content !== finalContent) {
          nextMessages.push({
            role: "assistant",
            content: finalContent,
            isComplete: true,
            timestamp: Date.now(),
            isThinking: false,
          })
        }
      }
    }

    nextMessages.sort((a, b) => a.timestamp - b.timestamp)
    return nextMessages
  }, [conversationHistory, finalContent, isComplete, progress.streamingContent?.isStreaming, sessionStartIndex, steps])

  const visibleConversationHistory = useMemo(
    () =>
      (conversationHistory ?? []).filter(
        (entry) => !(entry.role === "user" && isInternalCompletionNudge(entry.content)),
      ),
    [conversationHistory],
  )

  const summaryBlockCount = useMemo(
    () => visibleConversationHistory.filter((entry) => entry.isSummary).length,
    [visibleConversationHistory],
  )

  const supportsStoredHistoryViewer =
    variant === "tile" || variant === "overlay" || variant === "default"

  const shouldHydrateStoredHistory =
    supportsStoredHistoryViewer &&
    !!progress.conversationId &&
    summaryBlockCount > 0 &&
    !(fullConversationHistory?.length)

  const storedConversationQuery = useConversationQuery(
    shouldHydrateStoredHistory ? progress.conversationId ?? null : null,
  )

  const hydratedFullConversationHistory = useMemo(
    () => storedConversationQuery.data?.rawMessages?.map(mapConversationMessageForProgress),
    [storedConversationQuery.data],
  )

  const effectiveFullConversationHistory =
    fullConversationHistory ?? hydratedFullConversationHistory

  const effectiveConversationCompaction =
    conversationCompaction ?? storedConversationQuery.data?.compaction

  const visibleFullConversationHistory = useMemo(
    () =>
      (effectiveFullConversationHistory ?? []).filter(
        (entry) => !(entry.role === "user" && isInternalCompletionNudge(entry.content)),
      ),
    [effectiveFullConversationHistory],
  )

  const fullHistoryDisplayItems = useMemo<DisplayItem[]>(
    () =>
      visibleFullConversationHistory.map((entry, index) => ({
        kind: "message",
        id: `full-history-${entry.id ?? `${entry.role}-${index}`}`,
        data: {
          role: entry.role,
          content: entry.content,
          isComplete: true,
          timestamp: entry.timestamp || Date.now(),
          isThinking: false,
          toolCalls: entry.toolCalls,
          toolResults: entry.toolResults,
        },
      })),
    [visibleFullConversationHistory],
  )

  const activeWindowMessageCount = useMemo(
    () => visibleConversationHistory.filter((entry) => !entry.isSummary).length,
    [visibleConversationHistory],
  )

  const hasStoredEarlierHistory =
    visibleFullConversationHistory.length > 0 &&
    visibleFullConversationHistory.length > activeWindowMessageCount

  const hiddenEarlierHistoryCount = hasStoredEarlierHistory
    ? Math.max(0, visibleFullConversationHistory.length - activeWindowMessageCount)
    : 0

  const fullHistoryEarlierSectionLabel = hiddenEarlierHistoryCount > 0
    ? `The next ${hiddenEarlierHistoryCount} stored message${hiddenEarlierHistoryCount === 1 ? " is" : "s are"} preserved on disk and currently outside the active LLM context.`
    : null

  const fullHistoryBoundaryIndex =
    hasStoredEarlierHistory && activeWindowMessageCount > 0
      ? visibleFullConversationHistory.length - activeWindowMessageCount
      : null

  const storedHistoryMessageCount =
    effectiveConversationCompaction?.storedRawMessageCount
    ?? (visibleFullConversationHistory.length > 0 ? visibleFullConversationHistory.length : undefined)

  const representedHistoryMessageCount =
    effectiveConversationCompaction?.representedMessageCount
    ?? Math.max(visibleConversationHistory.length, visibleFullConversationHistory.length)

  const hasLegacyPartialHistoryWarning =
    !hasStoredEarlierHistory &&
    effectiveConversationCompaction?.partialReason === "legacy_summary_without_raw_messages"

  const isHydratingStoredHistory =
    shouldHydrateStoredHistory &&
    !storedConversationQuery.data &&
    (storedConversationQuery.isLoading || storedConversationQuery.isFetching)

  const hasStoredHistoryLoadError =
    shouldHydrateStoredHistory &&
    !storedConversationQuery.data &&
    storedConversationQuery.isError &&
    !hasLegacyPartialHistoryWarning

  const shouldShowStoredHistoryBanner =
    hasStoredEarlierHistory ||
    hasLegacyPartialHistoryWarning ||
    isHydratingStoredHistory ||
    hasStoredHistoryLoadError

  const isShowingStoredFullHistory =
    supportsStoredHistoryViewer && showFullHistory && hasStoredEarlierHistory

  const historyStatusBadge = useMemo(() => {
    if (isShowingStoredFullHistory) {
      return {
        label: "Full history",
        title: `Showing ${storedHistoryMessageCount ?? representedHistoryMessageCount} stored messages from disk.`,
        className: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
      }
    }

    if (hasLegacyPartialHistoryWarning) {
      return {
        label: "History partial",
        title: "Earlier summarized history is unavailable for this legacy session.",
        className: "border-amber-500/40 text-amber-700 dark:text-amber-300",
      }
    }

    if (isHydratingStoredHistory) {
      return {
        label: "Checking history",
        title: "Checking for preserved full history on disk.",
        className: "border-muted-foreground/30 text-muted-foreground",
      }
    }

    if (hasStoredHistoryLoadError) {
      return {
        label: "History warning",
        title: "Couldn't load preserved full history from disk.",
        className: "border-amber-500/40 text-amber-700 dark:text-amber-300",
      }
    }

    if (summaryBlockCount > 0 || hasStoredEarlierHistory) {
      const title = summaryBlockCount > 0
        ? hiddenEarlierHistoryCount > 0
          ? `${hiddenEarlierHistoryCount} earlier stored message${hiddenEarlierHistoryCount === 1 ? " is" : "s are"} currently represented by ${summaryBlockCount} summary block${summaryBlockCount === 1 ? "" : "s"} in the active context.`
          : `${summaryBlockCount} summary block${summaryBlockCount === 1 ? "" : "s"} currently represent earlier conversation history in the active context.`
        : "Earlier stored history exists outside the active context. Use Show Full History to inspect it."

      return {
        label: "History compacted",
        title,
        className: "border-primary/40 text-primary",
      }
    }

    return null
  }, [
    hasLegacyPartialHistoryWarning,
    hasStoredEarlierHistory,
    hasStoredHistoryLoadError,
    hiddenEarlierHistoryCount,
    isHydratingStoredHistory,
    isShowingStoredFullHistory,
    representedHistoryMessageCount,
    storedHistoryMessageCount,
    summaryBlockCount,
  ])

  const fallbackRespondToUserResponses = useMemo(
    () => (progress.userResponse ? [] : extractRespondToUserResponsesFromMessages(messages)),
    [messages, progress.userResponse],
  )
  const effectiveUserResponse = useMemo(
    () => progress.userResponse ?? fallbackRespondToUserResponses[fallbackRespondToUserResponses.length - 1],
    [fallbackRespondToUserResponses, progress.userResponse],
  )
  const effectiveUserResponseHistory = useMemo(
    () => progress.userResponseHistory
      ?? (fallbackRespondToUserResponses.length > 1
        ? fallbackRespondToUserResponses.slice(0, -1)
        : undefined),
    [fallbackRespondToUserResponses, progress.userResponseHistory],
  )
  const primaryAgentLabel = acpSessionInfo?.agentTitle
    ?? acpSessionInfo?.agentName
    ?? profileName
    ?? "Agent"

  if (!progress.userResponse && effectiveUserResponse) {
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

  // Helper function to generate a stable ID for tool executions based on content and timestamp
  const generateToolExecutionId = (calls: Array<{ name: string; arguments: any }>, timestamp: number) => {
    // Create a stable hash from tool call names, a subset of arguments, and timestamp for uniqueness
    const signature = calls.map(c => {
      const argsStr = c.arguments ? JSON.stringify(c.arguments) : ''
      return `${c.name}:${argsStr.substring(0, 50)}`
    }).join('|') + `@${timestamp}`
    // Simple hash function
    let hash = 0
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  function getItemTimestamp(item: DisplayItem): number | null {
    switch (item.kind) {
      case "message":
        return item.data.timestamp
      case "tool_execution":
        return item.data.timestamp
      case "assistant_with_tools":
        return item.data.timestamp
      case "delegation":
        return item.data.startTime
      case "retry_status":
        return item.data.startedAt
      case "tool_approval":
      case "streaming":
      case "mid_turn_response":
        return null
    }
  }

  const latestAssistantHistoryMessage = useMemo(
    () => [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "assistant" &&
          !message.toolCalls?.length &&
          !message.toolResults?.length &&
          message.content.trim().length > 0,
      ),
    [messages],
  )

  // Build unified display items that combine tool calls with subsequent results.
  // Timestamped history stays memoized while only current-state items like the
  // live streaming bubble update per chunk.
  const timestampedDisplayItems = useMemo(() => {
    const nextItems: DisplayItem[] = []
    const roleCounters: Record<'user' | 'assistant' | 'tool', number> = { user: 0, assistant: 0, tool: 0 }

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]
      if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
        const next = messages[i + 1]
        const results = next && next.role === "tool" && next.toolResults ? next.toolResults : []
        const aIndex = ++roleCounters.assistant
        const execTimestamp = next?.timestamp ?? m.timestamp
        const toolExecId = generateToolExecutionId(m.toolCalls, execTimestamp)
        const toolCallNames = m.toolCalls.map(c => c.name)
        const matchingStep = steps?.find(
          step =>
            step.type === "tool_call" &&
            step.executionStats &&
            (step.title?.includes(toolCallNames[0]) || toolCallNames.some(name => step.title?.includes(name))),
        )
        const hasCompletionTool = m.toolCalls.some(
          c => c.name === RESPOND_TO_USER_TOOL || c.name === MARK_WORK_COMPLETE_TOOL,
        )
        const suppressThought = hasCompletionTool && !!effectiveUserResponse

        nextItems.push({
          kind: "assistant_with_tools",
          id: `assistant-tools-${aIndex}-${toolExecId}`,
          data: {
            thought: suppressThought ? "" : (m.content || ""),
            timestamp: m.timestamp,
            isComplete: m.isComplete,
            calls: m.toolCalls,
            results,
            executionStats: matchingStep?.executionStats ? {
              durationMs: matchingStep.executionStats.durationMs,
              totalTokens: matchingStep.executionStats.totalTokens,
              model: matchingStep.subagentId,
            } : undefined,
          },
        })
        if (next && next.role === "tool" && next.toolResults) {
          i++
        }
      } else if (
        m.role === "tool" &&
        m.toolResults &&
        !(i > 0 && messages[i - 1].role === "assistant" && (messages[i - 1].toolCalls?.length ?? 0) > 0)
      ) {
        const tIndex = ++roleCounters.tool
        nextItems.push({ kind: "tool_execution", id: `exec-standalone-${tIndex}`, data: { timestamp: m.timestamp, calls: [], results: m.toolResults } })
      } else {
        const idx = ++roleCounters[m.role]
        nextItems.push({ kind: "message", id: `msg-${m.role}-${idx}`, data: m })
      }
    }

    if (progress.retryInfo && progress.retryInfo.isRetrying) {
      nextItems.push({
        kind: "retry_status",
        id: `retry-${progress.retryInfo.startedAt}`,
        data: progress.retryInfo,
      })
    }

    for (const step of progress.steps) {
      if (step.delegation) {
        nextItems.push({
          kind: "delegation",
          id: `delegation-${step.delegation.runId}`,
          data: step.delegation,
        })
      }
    }

    nextItems.sort((a, b) => {
      const tsA = getItemTimestamp(a) ?? 0
      const tsB = getItemTimestamp(b) ?? 0
      return tsA - tsB
    })

    return nextItems
  }, [effectiveUserResponse, messages, progress.retryInfo, progress.steps, steps])

  const currentStateDisplayItems = useMemo(() => {
    const nextItems: DisplayItem[] = []

    if (progress.streamingContent && progress.streamingContent.isStreaming && progress.streamingContent.text) {
      const historyAlreadyContainsStream = !!(
        latestAssistantHistoryMessage?.content &&
        progress.streamingContent.text.endsWith(latestAssistantHistoryMessage.content)
      )

      if (!historyAlreadyContainsStream) {
        nextItems.push({
          kind: "streaming",
          id: "streaming-content",
          data: progress.streamingContent,
        })
      }
    }

    if (effectiveUserResponse) {
      nextItems.push({
        kind: "mid_turn_response",
        id: "mid-turn-response",
        data: {
          userResponse: effectiveUserResponse,
          pastResponses: effectiveUserResponseHistory,
        },
      })
    }

    return nextItems
  }, [effectiveUserResponse, effectiveUserResponseHistory, latestAssistantHistoryMessage, progress.streamingContent])

  // NOTE: Tool approval is rendered separately outside the scroll area for visibility.
  const displayItems = useMemo(
    () => [...timestampedDisplayItems, ...currentStateDisplayItems],
    [currentStateDisplayItems, timestampedDisplayItems],
  )

  // Determine the last assistant message among display items (by position, not timestamp)
  const lastAssistantDisplayIndex = useMemo(() => {
    for (let i = timestampedDisplayItems.length - 1; i >= 0; i--) {
      const it = timestampedDisplayItems[i]
      if (it.kind === "message" && it.data.role === "assistant") return i
    }
    return -1
  }, [timestampedDisplayItems])

  const renderDisplayItem = useCallback((item: DisplayItem, displayIndex: number, renderVariant: "default" | "overlay" | "tile", deferOffscreenRendering = false) => {
    const itemKey = item.id
    const isFinalAssistantMessage = item.kind === "message" && displayIndex === lastAssistantDisplayIndex && isComplete
    const isExpanded = itemKey in expandedItems
      ? expandedItems[itemKey]
      : isFinalAssistantMessage
    const isLastAssistant = item.kind === "message" && item.data.role === "assistant" && displayIndex === lastAssistantDisplayIndex

    if (item.kind === "message") {
      return (
        <CompactMessage
          key={itemKey}
          message={item.data}
          ttsText={isLastAssistant ? effectiveUserResponse : undefined}
          isLast={isLastAssistant}
          isComplete={isComplete}
          hasErrors={hasErrors}
          wasStopped={wasStopped}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
          deferOffscreenRendering={deferOffscreenRendering}
          variant={renderVariant}
          sessionId={progress.sessionId}
        />
      )
    }

    if (item.kind === "assistant_with_tools") {
      return (
        <AssistantWithToolsBubble
          key={itemKey}
          data={item.data}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
        />
      )
    }

    if (item.kind === "tool_approval") {
      return (
        <ToolApprovalBubble
          key={itemKey}
          approval={item.data}
          onApprove={handleApproveToolCall}
          onDeny={handleDenyToolCall}
          isResponding={isRespondingToApproval}
        />
      )
    }

    if (item.kind === "retry_status") {
      return <RetryStatusBanner key={itemKey} retryInfo={item.data} />
    }

    if (item.kind === "streaming") {
      return <StreamingContentBubble key={itemKey} streamingContent={item.data} />
    }

    if (item.kind === "mid_turn_response") {
      return (
        <MidTurnUserResponseBubble
          key={itemKey}
          userResponse={item.data.userResponse}
          pastResponses={item.data.pastResponses}
          sessionId={progress.sessionId}
          agentLabel={primaryAgentLabel}
          variant={renderVariant}
          isComplete={isComplete}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleItemExpansion(itemKey, false)}
        />
      )
    }

    if (item.kind === "delegation") {
      const delegationExpanded = expandedItems[itemKey] ?? false
      return (
        <DelegationBubble
          key={itemKey}
          delegation={item.data}
          isExpanded={delegationExpanded}
          onToggleExpand={() => toggleItemExpansion(itemKey, false)}
        />
      )
    }

    return (
      <ToolExecutionBubble
        key={itemKey}
        execution={item.data}
        isExpanded={isExpanded}
        onToggleExpand={() => toggleItemExpansion(itemKey, isExpanded)}
      />
    )
  }, [effectiveUserResponse, expandedItems, handleApproveToolCall, handleDenyToolCall, hasErrors, isComplete, isRespondingToApproval, lastAssistantDisplayIndex, primaryAgentLabel, progress.sessionId, toggleItemExpansion, wasStopped])

  const renderedTimestampedDisplayItems = useMemo(
    () => timestampedDisplayItems.map((item, index) => renderDisplayItem(
      item,
      index,
      variant,
      timestampedDisplayItems.length > OFFSCREEN_TRANSCRIPT_BUFFER_ITEMS
        && index < timestampedDisplayItems.length - OFFSCREEN_TRANSCRIPT_BUFFER_ITEMS,
    )),
    [renderDisplayItem, timestampedDisplayItems, variant],
  )
  const renderedCurrentStateDisplayItems = useMemo(
    () => currentStateDisplayItems.map((item, index) => renderDisplayItem(item, timestampedDisplayItems.length + index, variant)),
    [currentStateDisplayItems, renderDisplayItem, timestampedDisplayItems.length, variant],
  )

  // Reset auto-scroll tracking refs when session changes
  // This prevents stale high-water marks from blocking auto-scroll after a clear/new session
  useEffect(() => {
    if (progress?.sessionId !== lastSessionIdRef.current) {
      lastSessionIdRef.current = progress?.sessionId
      clearPendingInitialScrollAttempts()
      lastMessageCountRef.current = 0
      lastContentLengthRef.current = 0
      lastDisplayItemsCountRef.current = 0
      // Also reset auto-scroll state for new sessions
      setShouldAutoScroll(true)
      setShowFullHistory(false)
    }
  }, [clearPendingInitialScrollAttempts, progress?.sessionId])

  // Keep pinned-to-bottom streaming updates in the same paint as the content commit.
  // Using useLayoutEffect here avoids a one-frame lag where new content renders above
  // the fold and the scroll position only catches up on the next animation frame.
  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const scrollToBottom = () => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }

    // Calculate total content length for streaming detection (including streaming content)
    const totalContentLength = messages.reduce(
      (sum, msg) => sum + (msg.content?.length ?? 0),
      0,
    ) + (progress.streamingContent?.text?.length ?? 0)

    // Check if new messages were added, content changed (streaming), or displayItems changed
    // displayItems includes tool executions, tool approvals, retry status, and streaming content
    const hasNewMessages = messages.length > lastMessageCountRef.current
    const hasContentChanged = totalContentLength > lastContentLengthRef.current
    const hasNewDisplayItems = displayItems.length > lastDisplayItemsCountRef.current

    // Also detect when counts decrease (e.g., streaming item removed) and reset refs
    // This ensures auto-scroll works correctly when items are removed and new ones added
    const hasMessagesDecreased = messages.length < lastMessageCountRef.current
    const hasDisplayItemsDecreased = displayItems.length < lastDisplayItemsCountRef.current

    if (hasMessagesDecreased || hasDisplayItemsDecreased) {
      // Reset refs when counts decrease to avoid high-water mark issues
      lastMessageCountRef.current = messages.length
      lastContentLengthRef.current = totalContentLength
      lastDisplayItemsCountRef.current = displayItems.length
    }

    if (hasNewMessages || hasContentChanged || hasNewDisplayItems) {
      lastMessageCountRef.current = messages.length
      lastContentLengthRef.current = totalContentLength
      lastDisplayItemsCountRef.current = displayItems.length

      // Only auto-scroll if we should (user hasn't manually scrolled up)
      if (shouldAutoScroll) {
        scrollToBottom()
      }
    }
  }, [messages.length, shouldAutoScroll, messages, progress.streamingContent?.text, displayItems.length, displayItems])

  // Initial scroll to bottom on mount and when first display item appears
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    clearPendingInitialScrollAttempts()

    const scrollToBottom = () => {
      if (!shouldAutoScrollRef.current) return
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }

    // Multiple attempts to ensure scrolling works with dynamic content
    const scrollAttempts = [0, 50, 100, 200]
    pendingInitialScrollTimeoutsRef.current = scrollAttempts.map((delay) => {
      return setTimeout(() => {
        requestAnimationFrame(scrollToBottom)
      }, delay)
    })

    return clearPendingInitialScrollAttempts
  }, [clearPendingInitialScrollAttempts, displayItems.length > 0])

  // Make panel focusable when agent completes (overlay variant only)
  // This enables the continue conversation input to receive focus and be interactable
  useEffect(() => {
    if (variant === "overlay" && isComplete) {
      tipcClient.setPanelFocusable({ focusable: true })
    }
  }, [variant, isComplete])

  // Handle scroll events to detect user interaction
  const handleScroll = () => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const distanceFromBottom = Math.abs(scrollHeight - clientHeight - scrollTop)
    const isAtBottom = distanceFromBottom <= BOTTOM_PIN_TOLERANCE_PX

    // If the user returns close enough to the bottom, treat it as a recovery
    // back to the live stream and snap fully to the latest content immediately.
    // A tighter threshold here can leave the shared session scroller stuck a few
    // pixels above bottom during streaming, so the very next chunk reopens a much
    // larger visible gap instead of resuming sticky-at-bottom behavior.
    if (isAtBottom && !shouldAutoScroll) {
      shouldAutoScrollRef.current = true
      scrollContainer.scrollTop = scrollContainer.scrollHeight
      requestAnimationFrame(() => {
        if (!shouldAutoScrollRef.current) return
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      })
      setShouldAutoScroll(true)
      setIsUserScrolling(false)
    }
    // If user scrolled up from bottom, stop auto-scroll
    else if (!isAtBottom && shouldAutoScroll) {
      clearPendingInitialScrollAttempts()
      shouldAutoScrollRef.current = false
      setShouldAutoScroll(false)
      setIsUserScrolling(true)
    }


  }
  // Get status indicator for tile variant
  const getStatusIndicator = () => {
    const hasPendingApproval = !!progress.pendingToolApproval
    const isSnoozed = progress.isSnoozed
    if (hasPendingApproval) {
      return <Shield className="h-4 w-4 text-amber-500 animate-pulse" />
    }
    if (!isComplete) {
      return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
    }
    if (isSnoozed) {
      return <Moon className="h-4 w-4 text-muted-foreground" />
    }
    if (hasErrors || wasStopped) {
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
    const isSnoozed = progress.isSnoozed
    const shouldLimitTileTranscript = !isFocused && !isExpanded
    const shouldUseCompactTileFooter = !isFocused && !isExpanded
    const showTileExpandAction = !!onExpand && !isExpanded && !isSnoozed
    const acpBadgeShowsAgentIdentity = !!(acpSessionInfo?.agentTitle || acpSessionInfo?.agentName)
    const showTileProfileName = !!profileName && !acpBadgeShowsAgentIdentity
    const tileDisplayItems = shouldLimitTileTranscript
      ? displayItems.slice(-TILE_TRANSCRIPT_PREVIEW_ITEMS)
      : displayItems
    const hiddenTileItemCount = displayItems.length - tileDisplayItems.length
    const tileDisplayOffset = displayItems.length - tileDisplayItems.length
    const showLimitedTilePreview = shouldLimitTileTranscript && !isShowingStoredFullHistory
    const tileTranscriptHasContent = isShowingStoredFullHistory
      ? fullHistoryDisplayItems.length > 0
      : tileDisplayItems.length > 0
    return (
      <div
        onClick={onFocus}
        className={cn(containerClasses, "relative min-h-0 border h-full group/tile", className)}
        dir="ltr"
        style={{
          WebkitAppRegion: "no-drag"
        } as React.CSSProperties}
      >
        {/* Tile Header - clickable to toggle collapse */}
        <div
          className="flex flex-wrap items-start gap-2 px-3 py-2 border-b bg-muted/30 flex-shrink-0 cursor-pointer"
          onClick={handleToggleCollapse}
        >
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="shrink-0 pt-0.5">
              {getStatusIndicator()}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium text-sm">
                {getTitle()}
              </span>
              {/* Agent name indicator in header */}
              {showTileProfileName && (
                <span className="flex items-center gap-1 text-[10px] text-primary/70">
                  <Bot className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{profileName}</span>
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">
            {historyStatusBadge && (
              <Badge
                variant="outline"
                className={cn("shrink-0 text-xs", historyStatusBadge.className)}
                title={historyStatusBadge.title}
              >
                {historyStatusBadge.label}
              </Badge>
            )}
            {hasPendingApproval && (
              <Badge variant="outline" className="shrink-0 border-amber-500 text-xs text-amber-600">
                Approval
              </Badge>
            )}
            {/* Collapse/Expand toggle */}
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleToggleCollapse} title={isCollapsed ? "Expand panel" : "Collapse panel"}>
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>

            {showTileExpandAction && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onExpand()
                }}
                title="Show only this session"
                aria-label="Show only this session"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            )}

            {!isComplete && !isSnoozed && (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); handleSnooze(e); }} title="Minimize">
                <Minimize2 className="h-3 w-3" />
              </Button>
            )}
            {isSnoozed && (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={async (e) => {
                e.stopPropagation()
                if (!progress?.sessionId) return

                // Update local store first so panel shows content immediately
                setSessionSnoozed(progress.sessionId, false)
                // Focus this session in state
                setFocusedSessionId(progress.sessionId)

                try {
                  // Unsnooze the session in backend
                  await tipcClient.unsnoozeAgentSession({ sessionId: progress.sessionId })
                } catch (error) {
                  // Rollback local state only when the API call fails to keep UI and backend in sync
                  setSessionSnoozed(progress.sessionId, true)
                  setFocusedSessionId(null)
                  console.error("Failed to unsnooze session:", error)
                  return
                }

                // UI updates after successful API call - don't rollback if these fail
                try {
                  // Keep panel state in sync for the restored session without forcing panel open.
                  await tipcClient.focusAgentSession({ sessionId: progress.sessionId })
                } catch (error) {
                  // Log UI errors but don't rollback - the backend state is already updated
                  console.error("Failed to update UI after unsnooze:", error)
                }
              }} title="Restore session">
                <Maximize2 className="h-3 w-3" />
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
            <div className={cn("relative flex min-h-0 flex-1 flex-col", activeTab !== "chat" && (progress.stepSummaries?.length ?? 0) > 0 && "hidden")} onClick={(e) => e.stopPropagation()}>
              {shouldShowStoredHistoryBanner && (
                <div className="border-b border-border/40 bg-muted/20 px-3 py-2">
                  {hasStoredEarlierHistory ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] uppercase tracking-wide">
                          History
                        </Badge>
                        <span className="min-w-0 truncate">
                          {isShowingStoredFullHistory
                            ? `Showing ${storedHistoryMessageCount ?? representedHistoryMessageCount} stored messages from disk.`
                            : summaryBlockCount > 0
                              ? `${hiddenEarlierHistoryCount} earlier message${hiddenEarlierHistoryCount === 1 ? "" : "s"} currently represented by ${summaryBlockCount} summary block${summaryBlockCount === 1 ? "" : "s"} in the active context.`
                              : `${hiddenEarlierHistoryCount} earlier message${hiddenEarlierHistoryCount === 1 ? "" : "s"} summarized out of the active context.`}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setShowFullHistory((current) => !current)}
                      >
                        {isShowingStoredFullHistory ? "Show Active Window" : "Show Full History"}
                      </Button>
                    </div>
                  ) : hasLegacyPartialHistoryWarning ? (
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Earlier summarized history is unavailable for this legacy session.</span>
                    </div>
                  ) : isHydratingStoredHistory ? (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                      <span>Checking for preserved full history on disk…</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <div className="flex min-w-0 items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Couldn&apos;t load preserved full history from disk.</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          void storedConversationQuery.refetch()
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="min-h-0 flex-1 overflow-y-auto scrollbar-hide-until-hover"
              >
                {tileTranscriptHasContent ? (
                  <div className="space-y-1 p-2">
                    {isShowingStoredFullHistory ? (
                      <>
                        <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                          Showing full history from disk. {hiddenEarlierHistoryCount > 0 && summaryBlockCount > 0
                            ? `${hiddenEarlierHistoryCount} earlier stored message${hiddenEarlierHistoryCount === 1 ? "" : "s"} ${hiddenEarlierHistoryCount === 1 ? "is" : "are"} currently represented by ${summaryBlockCount} summary block${summaryBlockCount === 1 ? "" : "s"} in the active LLM context.`
                            : "Messages above the divider may be summarized out of the current LLM context."}
                        </div>
                        {fullHistoryDisplayItems.map((item, index) => (
                          <React.Fragment key={item.id}>
                            {fullHistoryEarlierSectionLabel && index === 0 && (
                              <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-700 dark:text-sky-300">
                                {fullHistoryEarlierSectionLabel}
                              </div>
                            )}
                            {fullHistoryBoundaryIndex !== null && index === fullHistoryBoundaryIndex && (
                              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                                Active context window starts here.
                              </div>
                            )}
                            {renderDisplayItem(item, index, "tile")}
                          </React.Fragment>
                        ))}
                      </>
                    ) : (
                      <>
                        {hiddenTileItemCount > 0 && showLimitedTilePreview && (
                          <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
                            Showing latest {tileDisplayItems.length} of {displayItems.length} updates
                          </div>
                        )}
                        {showLimitedTilePreview
                          ? tileDisplayItems.map((item, index) => renderDisplayItem(item, tileDisplayOffset + index, "tile"))
                          : (
                            <>
                              {renderedTimestampedDisplayItems}
                              {renderedCurrentStateDisplayItems}
                            </>
                          )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/70" aria-hidden="true" />
                    <span className="sr-only">Loading agent activity</span>
                  </div>
                )}
              </div>
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

            {/* Footer with status info */}
            <div className={cn(
              "px-3 py-2 border-t text-xs text-muted-foreground flex-shrink-0",
              shouldUseCompactTileFooter ? "bg-muted/10" : "bg-muted/20"
            )}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  {/* ACP Session info for tile variant */}
                  {acpSessionInfo && (
                    <ACPSessionBadge info={acpSessionInfo} className="min-w-0 max-w-full" />
                  )}
                  {/* Model info - only show for non-ACP sessions */}
                  {!isComplete && modelInfo && !acpSessionInfo && !shouldUseCompactTileFooter && (
                    <span className="min-w-0 max-w-full truncate text-[10px]" title={`${modelInfo.provider}: ${modelInfo.model}`}>
                      {modelInfo.provider}/{modelInfo.model.split('/').pop()?.substring(0, 15)}
                    </span>
                  )}
                  {!isComplete && contextInfo && contextInfo.maxTokens > 0 && (
                    <div
                      className="flex shrink-0 items-center gap-1"
                      title={`Context: ${Math.round(contextInfo.estTokens / 1000)}k / ${Math.round(contextInfo.maxTokens / 1000)}k tokens (${Math.min(100, Math.round((contextInfo.estTokens / contextInfo.maxTokens) * 100))}%)`}
                    >
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
                {!isComplete && (
                  <span className="shrink-0 whitespace-nowrap">Step {currentIteration}/{isFinite(maxIterations) ? maxIterations : "∞"}</span>
                )}
                {isComplete && (
                  <span className="shrink-0 whitespace-nowrap">{wasStopped ? "Stopped" : hasErrors ? "Failed" : "Complete"}</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Message Queue Panel - shows queued messages in tile */}
        {hasQueuedMessages && progress.conversationId && (
          <div className="px-3 py-2 border-t flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <MessageQueuePanel
              conversationId={progress.conversationId}
              messages={queuedMessages}
              compact={isCollapsed}
              isPaused={isQueuePaused}
            />
          </div>
        )}

        {/* Follow-up input - always visible for quick continuation */}
        <TileFollowUpInput
          conversationId={progress.conversationId}
          sessionId={progress.sessionId}
          isSessionActive={!isComplete}
          isInitializingSession={isFollowUpInputInitializing}
          preferCompact={!isFocused && !isExpanded}
          className="flex-shrink-0"
          onRequestFocus={onFocus}
          onMessageSent={onFollowUpSent}
        />

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
  const standardTranscriptHasContent = isShowingStoredFullHistory
    ? fullHistoryDisplayItems.length > 0
    : displayItems.length > 0

  return (
    <div
      className={cn(containerClasses, "min-h-0", className)}
      dir="ltr"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Unified Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/30 bg-muted/10 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-xs font-medium",
            wasStopped && "text-red-600 dark:text-red-400"
          )}>
            {isComplete ?
              (wasStopped ? "Stopped" : hasErrors ? "Failed" : "Complete") :
              "Processing"
            }
          </span>
          {wasStopped && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              Terminated
            </Badge>
          )}
          {historyStatusBadge && (
            <Badge
              variant="outline"
              className={cn("shrink-0 px-1.5 py-0.5 text-xs", historyStatusBadge.className)}
              title={historyStatusBadge.title}
            >
              {historyStatusBadge.label}
            </Badge>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          {/* Profile/agent name - more prominent with icon */}
          {profileName && (
            <span className="flex items-center gap-1 text-[10px] text-primary/70" title={`Agent: ${profileName}`}>
              <Bot className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[80px]">{profileName}</span>
            </span>
          )}
          {/* ACP Session info (agent and model from ACP) */}
          {acpSessionInfo && (
            <ACPSessionBadge info={acpSessionInfo} />
          )}
          {/* Model and provider info - only show for non-ACP sessions */}
          {!isComplete && modelInfo && !acpSessionInfo && (
            <span className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]" title={`${modelInfo.provider}: ${modelInfo.model}`}>
              {modelInfo.provider}/{modelInfo.model.split('/').pop()?.substring(0, 20)}
            </span>
          )}
          {/* Context fill indicator */}
          {!isComplete && contextInfo && contextInfo.maxTokens > 0 && (
            <div
              className="flex items-center gap-1.5"
              title={`Context: ${Math.round(contextInfo.estTokens / 1000)}k / ${Math.round(contextInfo.maxTokens / 1000)}k tokens (${Math.min(100, Math.round((contextInfo.estTokens / contextInfo.maxTokens) * 100))}%)`}
            >
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
          {!isComplete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={handleSnooze}
              title="Minimize - run in background without showing progress"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
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
      <div className={cn("relative flex-1 min-h-0", activeTab !== "chat" && (progress.stepSummaries?.length ?? 0) > 0 && "hidden")}>
        {shouldShowStoredHistoryBanner && (
          <div className="border-b border-border/40 bg-muted/20 px-3 py-2">
            {hasStoredEarlierHistory ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px] uppercase tracking-wide">
                    History
                  </Badge>
                  <span className="min-w-0 truncate">
                    {isShowingStoredFullHistory
                      ? `Showing ${storedHistoryMessageCount ?? representedHistoryMessageCount} stored messages from disk.`
                      : summaryBlockCount > 0
                        ? `${hiddenEarlierHistoryCount} earlier message${hiddenEarlierHistoryCount === 1 ? "" : "s"} currently represented by ${summaryBlockCount} summary block${summaryBlockCount === 1 ? "" : "s"} in the active context.`
                        : `${hiddenEarlierHistoryCount} earlier message${hiddenEarlierHistoryCount === 1 ? "" : "s"} summarized out of the active context.`}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setShowFullHistory((current) => !current)}
                >
                  {isShowingStoredFullHistory ? "Show Active Window" : "Show Full History"}
                </Button>
              </div>
            ) : hasLegacyPartialHistoryWarning ? (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Earlier summarized history is unavailable for this legacy session.</span>
              </div>
            ) : isHydratingStoredHistory ? (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                <span>Checking for preserved full history on disk…</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex min-w-0 items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Couldn&apos;t load preserved full history from disk.</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    void storedConversationQuery.refetch()
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto"
        >
          {standardTranscriptHasContent ? (
            <div className="space-y-1 p-2">
              {isShowingStoredFullHistory ? (
                <>
                  <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                    Showing full history from disk. {hiddenEarlierHistoryCount > 0 && summaryBlockCount > 0
                      ? `${hiddenEarlierHistoryCount} earlier stored message${hiddenEarlierHistoryCount === 1 ? "" : "s"} ${hiddenEarlierHistoryCount === 1 ? "is" : "are"} currently represented by ${summaryBlockCount} summary block${summaryBlockCount === 1 ? "" : "s"} in the active LLM context.`
                      : "Messages above the divider may be summarized out of the current LLM context."}
                  </div>
                  {fullHistoryDisplayItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {fullHistoryEarlierSectionLabel && index === 0 && (
                        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-700 dark:text-sky-300">
                          {fullHistoryEarlierSectionLabel}
                        </div>
                      )}
                      {fullHistoryBoundaryIndex !== null && index === fullHistoryBoundaryIndex && (
                        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                          Active context window starts here.
                        </div>
                      )}
                      {renderDisplayItem(item, index, variant)}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                <>
                  {renderedTimestampedDisplayItems}
                  {renderedCurrentStateDisplayItems}
                </>
              )}
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
