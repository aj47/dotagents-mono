import React, { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@renderer/lib/utils"
import { AgentProgressUpdate } from "@shared/types"
import { ScrollArea } from "@renderer/components/ui/scroll-area"
import {
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Shield,
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  Copy,
  CheckCheck,
  OctagonX,
  Check,
  Loader2,
  Volume2,
  XCircle,
} from "lucide-react"
import { Button } from "@renderer/components/ui/button"
import { MarkdownRenderer } from "@renderer/components/markdown-renderer"
import { MessageQueuePanel } from "@renderer/components/message-queue-panel"
import { useMessageQueue, useIsQueuePaused } from "@renderer/stores"
import { tipcClient } from "@renderer/lib/tipc-client"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { AudioPlayer } from "@renderer/components/audio-player"
import { useConfigQuery } from "@renderer/lib/queries"
import { ttsManager } from "@renderer/lib/tts-manager"
import { removeTTSKey } from "@renderer/lib/tts-tracking"
import { isMissingApiKeyErrorMessage } from "@shared/api-key-error-utils"
import { toast } from "sonner"

const MIN_HEIGHT = 120
const MAX_HEIGHT = 4000 // Allow tiles to fill large displays - effectively no practical limit
const DEFAULT_HEIGHT = 280

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
}

interface SessionTileProps {
  session: {
    id: string
    conversationId?: string
    conversationTitle?: string
    status: "active" | "completed" | "error" | "stopped"
    startTime: number
    endTime?: number
    currentIteration?: number
    maxIterations?: number
    lastActivity?: string
    errorMessage?: string
    isSnoozed?: boolean
  }
  progress?: AgentProgressUpdate | null
  isFocused?: boolean
  onFocus?: () => void
  onStop?: () => void
  onSnooze?: () => void
  onUnsnooze?: () => void
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function SessionTile({
  session,
  progress,
  isFocused,
  onFocus,
  onStop,
  onSnooze,
  onUnsnooze,
  onRetry,
  onDismiss,
  className,
}: SessionTileProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [tileHeight, setTileHeight] = useState(DEFAULT_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)
  // Use stable message ID (timestamp+role) instead of array index to track copied message
  // This prevents the checkmark from appearing on the wrong message if messages are inserted/removed
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const activeResizeCleanupRef = useRef<(() => void) | null>(null)

  // Generate stable message ID from timestamp and role
  const getMessageId = (message: { role: string; timestamp?: number; id?: string }, index: number) => {
    if (message.id) return message.id
    return `${message.timestamp || index}-${message.role}`
  }

  // TTS state
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null)
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)
  const inFlightTtsKeyRef = useRef<string | null>(null)
  const configQuery = useConfigQuery()
  const ttsGenerationIdRef = useRef(0)

  // Cleanup timeout and in-flight TTS key on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      activeResizeCleanupRef.current?.()
      activeResizeCleanupRef.current = null
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
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

  // Get queued messages for this conversation
  const queuedMessages = useMessageQueue(session.conversationId)
  const isQueuePaused = useIsQueuePaused(session.conversationId)

  // Copy message to clipboard
  const handleCopyMessage = async (e: React.MouseEvent, content: string, messageId: string) => {
    e.stopPropagation()
    try {
      await copyTextToClipboard(content)
      setCopiedMessageId(messageId)
      // Clear any existing timeout before setting a new one
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error("Failed to copy message:", err)
    }
  }

  // TTS audio generation
  const lastAssistantContent = React.useMemo(() => {
    const msgs = progress?.conversationHistory || []
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant" && msgs[i].content?.trim()) {
        return msgs[i].content
      }
    }
    return null
  }, [progress?.conversationHistory])

  const latestTtsSourceRef = useRef(lastAssistantContent)
  latestTtsSourceRef.current = lastAssistantContent

  const isSessionComplete = session.status === "completed" || session.status === "error" || session.status === "stopped"
  const shouldShowTTS = !!lastAssistantContent && isSessionComplete && !!configQuery.data?.ttsEnabled

  // Invalidate cached audio when the TTS source text changes
  const prevTtsSourceRef = useRef(lastAssistantContent)
  useEffect(() => {
    if (prevTtsSourceRef.current !== lastAssistantContent) {
      prevTtsSourceRef.current = lastAssistantContent
      setAudioData(null)
      setAudioMimeType(null)
      setTtsError(null)
    }
  }, [lastAssistantContent])

  const generateAudio = async (): Promise<ArrayBuffer> => {
    if (!configQuery.data?.ttsEnabled || !lastAssistantContent) {
      throw new Error("TTS is not enabled")
    }

    const generationId = ++ttsGenerationIdRef.current
    const generationSource = lastAssistantContent

    setIsGeneratingAudio(true)
    setTtsError(null)

    try {
      const result = await tipcClient.generateSpeech({ text: generationSource })

      if (ttsGenerationIdRef.current !== generationId || latestTtsSourceRef.current !== generationSource) {
        return result.audio
      }

      setAudioData(result.audio)
      setAudioMimeType(result.mimeType)
      return result.audio
    } catch (error) {
      console.error("[SessionTile TTS] Failed to generate audio:", error)
      let errorMessage = "Failed to generate audio"
      if (error instanceof Error) {
        if (error.message.includes("API key")) errorMessage = "TTS API key not configured"
        else if (error.message.includes("rate limit")) errorMessage = "Rate limit exceeded"
        else errorMessage = `TTS error: ${error.message}`
      }
      if (ttsGenerationIdRef.current === generationId) {
        setTtsError(errorMessage)
      }
      throw error
    } finally {
      if (ttsGenerationIdRef.current === generationId) {
        setIsGeneratingAudio(false)
      }
    }
  }

  // Tool approval state
  const [isRespondingToApproval, setIsRespondingToApproval] = useState(false)

  // Tool approval handlers
  const handleApproveToolCall = async () => {
    const approvalId = progress?.pendingToolApproval?.approvalId
    if (!approvalId) return
    setIsRespondingToApproval(true)
    try {
      await tipcClient.respondToToolApproval({ approvalId, approved: true })
    } catch (error) {
      console.error("Failed to approve tool call:", error)
      toast.error(
        `Failed to approve tool call. ${getActionErrorMessage(error, "Please try again.")}`,
      )
      setIsRespondingToApproval(false)
    }
  }

  const handleDenyToolCall = async () => {
    const approvalId = progress?.pendingToolApproval?.approvalId
    if (!approvalId) return
    setIsRespondingToApproval(true)
    try {
      await tipcClient.respondToToolApproval({ approvalId, approved: false })
    } catch (error) {
      console.error("Failed to deny tool call:", error)
      toast.error(
        `Failed to deny tool call. ${getActionErrorMessage(error, "Please try again.")}`,
      )
      setIsRespondingToApproval(false)
    }
  }

  // Reset responding state when approval changes (cleared or new approval)
  useEffect(() => {
    setIsRespondingToApproval(false)
  }, [progress?.pendingToolApproval?.approvalId])

  const isActive = session.status === "active"
  const isComplete = session.status === "completed"
  const hasError = session.status === "error"
  const isStopped = session.status === "stopped"
  const isSnoozed = session.isSnoozed
  const hasPendingApproval = !!progress?.pendingToolApproval
  const hasQueuedMessages = queuedMessages.length > 0

  // Toggle collapse state for the session tile
  // Note: stopPropagation() is intentional here - when users click the header to
  // expand/collapse, we don't want to also trigger the tile-level onFocus handler.
  // The collapse/expand action is distinct from selecting/focusing a session.
  const handleToggleCollapse = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    setIsCollapsed(prev => !prev)
  }

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    activeResizeCleanupRef.current?.()
    const startY = e.clientY
    const startHeight = tileHeight
    let rafId: number | null = null
    let lastHeight = startHeight

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY
      lastHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta))
      // Throttle state updates to one per animation frame to avoid jank
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (!isMountedRef.current) {
            rafId = null
            return
          }
          setTileHeight(lastHeight)
          rafId = null
        })
      }
    }

    const cleanupResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    const handleMouseUp = () => {
      cleanupResize()
      activeResizeCleanupRef.current = null
      if (!isMountedRef.current) return
      setIsResizing(false)
      setTileHeight(lastHeight)
    }

    activeResizeCleanupRef.current = cleanupResize
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }, [tileHeight])

  // Get status color dot
  const getStatusIndicator = () => {
    const dotColor = hasPendingApproval
      ? "bg-amber-500"
      : isActive
        ? "bg-blue-500"
        : isSnoozed
          ? "bg-gray-400"
          : isComplete
            ? "bg-green-500"
            : (hasError || isStopped)
              ? "bg-red-500"
              : "bg-gray-400"
    const shouldPulse = hasPendingApproval || isActive
    return (
      <span
        className={cn(
          "inline-block h-2 w-2 shrink-0 rounded-full",
          dotColor,
          shouldPulse && "animate-pulse",
        )}
      />
    )
  }

  // Get title - prefer conversationTitle, fall back to progress data
  const getTitle = () => {
    if (session.conversationTitle) {
      return session.conversationTitle
    }
    if (progress?.conversationTitle) {
      return progress.conversationTitle
    }
    // Extract from first user message in conversation
    const firstUserMsg = progress?.conversationHistory?.find(m => m.role === "user")
    if (firstUserMsg?.content) {
      return firstUserMsg.content.length > 50
        ? firstUserMsg.content.substring(0, 50) + "..."
        : firstUserMsg.content
    }
    return `Session ${session.id.substring(0, 8)}`
  }

  // Extended message type to include error messages for display
  type DisplayMessage = {
    role: "user" | "assistant" | "tool" | "error"
    content: string
    toolCalls?: { name: string; arguments: Record<string, unknown> }[]
    toolResults?: { success: boolean; content: string; error?: string }[]
    timestamp?: number
    id?: string
  }

  // Get conversation messages to display, integrating session error message chronologically
  const messages = React.useMemo((): DisplayMessage[] => {
    const baseMessages: DisplayMessage[] = (progress?.conversationHistory || []).map(m => ({
      ...m,
      role: m.role as "user" | "assistant" | "tool"
    }))

    // If the session is currently errored, integrate the error message into the transcript.
    if (session.status === "error" && session.errorMessage) {
      // Use session.startTime as fallback to ensure stable timestamp for React key generation
      // (Date.now() would create non-deterministic keys on each render)
      const errorEntry: DisplayMessage = {
        role: "error",
        content: session.errorMessage,
        timestamp: session.endTime || session.startTime,
        id: `error-${session.id}`, // Stable unique ID for error messages
      }

      const messagesWithError = [...baseMessages]

      // If endTime is available, insert chronologically; otherwise append to end
      if (session.endTime) {
        let insertIndex = messagesWithError.length // Default to end

        for (let i = 0; i < messagesWithError.length; i++) {
          const msgTimestamp = messagesWithError[i].timestamp || 0
          if (msgTimestamp > session.endTime) {
            insertIndex = i
            break
          }
        }

        messagesWithError.splice(insertIndex, 0, errorEntry)
      } else {
        // No endTime - append error at the end so it's still visible
        messagesWithError.push(errorEntry)
      }

      return messagesWithError
    }

    return baseMessages
  }, [progress?.conversationHistory, session.errorMessage, session.endTime, session.startTime])

  return (
    <div
      onClick={onFocus}
      className={cn(
        "flex flex-col rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer",
        hasPendingApproval
          ? "border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 ring-1 ring-amber-500/30"
          : isFocused
          ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/30"
          : "border-border bg-card hover:border-border/80 hover:bg-card/80",
        isResizing && "select-none",
        className
      )}
      style={{ height: isCollapsed ? "auto" : tileHeight }}
    >
      {/* Header - clicking on left portion (status, title) toggles collapse */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 flex-shrink-0">
        {/* Clickable area for collapse toggle - includes status indicator and title */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Expand session" : "Collapse session"}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm"
          onClick={handleToggleCollapse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleToggleCollapse(e)
            }
          }}
          title={isCollapsed ? "Click to expand" : "Click to collapse"}
        >
          {getStatusIndicator()}
          <span className="flex-1 truncate font-medium text-sm">
            {getTitle()}
          </span>
          {/* Collapse indicator chevron */}
          {isCollapsed ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />}
        </div>
        {/* Action buttons - clicking these should NOT trigger collapse */}
        <div className="flex items-center gap-1">
          {/* TTS playing indicator — click to pause */}
          {(isTTSPlaying || isGeneratingAudio) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                ttsManager.stopAll("session-tile-pause")
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
          {isActive && !isSnoozed && onSnooze && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onSnooze(); }} title="Minimize">
              <Minimize2 className="h-3 w-3" />
            </Button>
          )}
          {isSnoozed && onUnsnooze && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onUnsnooze(); }} title="Restore">
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
          {isActive && onStop && (
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onStop(); }} title="Stop">
              <OctagonX className="h-3 w-3" />
            </Button>
          )}
          {(hasError || isStopped) && onRetry && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onRetry(); }} title="Retry">
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDismiss(); }} title="Dismiss">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <>
          {/* Conversation content - scrollable */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  {isActive ? "Starting..." : "No messages"}
                </div>
              ) : (
                messages.map((message, index) => {
                  const messageId = getMessageId(message, index)
                  const isCopied = copiedMessageId === messageId

                  // Render error messages with special styling
                  if (message.role === "error") {
                    const errorContent = typeof message.content === "string"
                      ? message.content
                      : JSON.stringify(message.content)
                    const shouldShowModelSettingsCta = isMissingApiKeyErrorMessage(errorContent)

                    return (
                      <div key={messageId} className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                          Error
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {errorContent}
                        </div>
                        {shouldShowModelSettingsCta && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                void tipcClient.showMainWindow({ url: "/settings/models" })
                              }}
                            >
                              Open Model Settings
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Check if this is the last assistant message (for TTS)
                  const isLastAssistant = message.role === "assistant" &&
                    typeof message.content === "string" &&
                    message.content === lastAssistantContent

                  return (
                    <div
                      key={messageId}
                      className={cn(
                        "text-sm",
                        message.role === "user"
                          ? "pl-0"
                          : message.role === "assistant"
                          ? "pl-3 border-l-2 border-blue-500/30"
                          : "pl-3 border-l-2 border-muted"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="capitalize">{message.role}</span>
                        {message.role === "user" && typeof message.content === "string" && (
                          <button
                            onClick={(e) => handleCopyMessage(e, message.content as string, messageId)}
                            className="p-1 rounded hover:bg-muted/30 transition-colors"
                            title={isCopied ? "Copied!" : "Copy prompt"}
                            aria-label={isCopied ? "Copied!" : "Copy prompt"}
                          >
                            {isCopied ? (
                              <CheckCheck className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        )}
                      </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {typeof message.content === "string" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <span>{JSON.stringify(message.content)}</span>
                      )}
                    </div>
                    {/* TTS Audio Player for last assistant message */}
                    {isLastAssistant && shouldShowTTS && (
                      <div className="mt-2 min-w-0 space-y-1">
                        <AudioPlayer
                          audioData={audioData || undefined}
                          audioMimeType={audioMimeType || undefined}
                          text={lastAssistantContent}
                          onGenerateAudio={generateAudio}
                          isGenerating={isGeneratingAudio}
                          error={ttsError}
                          compact={true}
                          autoPlay={configQuery.data?.ttsAutoPlay ?? true}
                          onPlayStateChange={setIsTTSPlaying}
                        />
                        {ttsError && (
                          <div className="rounded-md bg-red-50 p-2 text-xs text-red-700 break-words [overflow-wrap:anywhere] dark:bg-red-900/20 dark:text-red-300">
                            <span className="font-medium">Audio generation failed:</span> {ttsError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )
                })
              )}

            </div>
          </ScrollArea>

          {/* Pending tool approval - FIXED position outside scroll area for visibility */}
          {hasPendingApproval && progress?.pendingToolApproval && (
            <div className="px-3 py-2 border-t border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  {isRespondingToApproval ? "Processing..." : "Tool Approval Required"}
                </span>
                {isRespondingToApproval && (
                  <Loader2 className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-spin ml-auto" />
                )}
              </div>
              <div className={cn("text-sm text-amber-700 dark:text-amber-300", isRespondingToApproval && "opacity-60")}>
                <code className="text-xs font-mono font-medium bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                  {progress.pendingToolApproval.toolName}
                </code>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                  onClick={handleDenyToolCall}
                  disabled={isRespondingToApproval}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Deny
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "h-6 text-xs text-white",
                    isRespondingToApproval
                      ? "bg-green-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={handleApproveToolCall}
                  disabled={isRespondingToApproval}
                >
                  {isRespondingToApproval ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Message Queue Panel */}
          {hasQueuedMessages && session.conversationId && (
            <div className="px-3 py-2 border-t flex-shrink-0">
              <MessageQueuePanel
                conversationId={session.conversationId}
                messages={queuedMessages}
                compact={isCollapsed}
                isPaused={isQueuePaused}
              />
            </div>
          )}

          {/* Footer with status info */}
          <div className="px-3 py-2 border-t bg-muted/20 text-xs text-muted-foreground flex-shrink-0 flex items-center gap-2">
            {progress?.profileName && (
              <span className="text-[10px] truncate max-w-[80px] text-primary/70" title={`Profile: ${progress.profileName}`}>
                {progress.profileName}
              </span>
            )}
            {progress?.profileName && isActive && progress?.modelInfo && (
              <span className="text-muted-foreground/50">•</span>
            )}
            {isActive && progress?.modelInfo && (
              <span className="text-[10px] truncate max-w-[100px]" title={`${progress.modelInfo.provider}: ${progress.modelInfo.model}`}>
                {progress.modelInfo.provider}/{progress.modelInfo.model.split('/').pop()?.substring(0, 15)}
              </span>
            )}
            {session.currentIteration && session.maxIterations && (
              <span>
                Step {session.currentIteration}/{session.maxIterations}
              </span>
            )}
            {session.lastActivity && (
              <span className="ml-2 truncate">{session.lastActivity}</span>
            )}
            {hasQueuedMessages && (
              <span className="ml-2 text-blue-500">
                • {queuedMessages.length} queued
              </span>
            )}
          </div>

          {/* Resize handle */}
          <div
            className="h-2 cursor-ns-resize flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors flex-shrink-0"
            onMouseDown={handleResizeStart}
          >
            <GripHorizontal className="h-3 w-3 text-muted-foreground/50" />
          </div>
        </>
      )}
    </div>
  )
}
