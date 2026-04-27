import { AgentProgress } from "@renderer/components/agent-progress"
import { AgentProcessingView } from "@renderer/components/agent-processing-view"
import { MultiAgentProgressView } from "@renderer/components/multi-agent-progress-view"
import { Recorder } from "@renderer/lib/recorder"
import { playSound, setSoundOutputDevice } from "@renderer/lib/sound"
import { cn } from "@renderer/lib/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { rendererHandlers, tipcClient } from "~/lib/tipc-client"
import { TextInputPanel, TextInputPanelRef } from "@renderer/components/text-input-panel"
import { PanelResizeWrapper } from "@renderer/components/panel-resize-wrapper"
import { useAgentStore, useAgentProgress, useConversationStore } from "@renderer/stores"
import { useConversationQuery, useCreateConversationMutation } from "@renderer/lib/queries"
import { PanelDragBar } from "@renderer/components/panel-drag-bar"
import { useConfigQuery } from "@renderer/lib/query-client"
import { decodeBlobToPcm } from "@renderer/lib/audio-utils"
import { useTheme } from "@renderer/contexts/theme-context"
import { applySelectedAgentToNextSession } from "@renderer/lib/apply-selected-agent"
import { ttsManager } from "@renderer/lib/tts-manager"
import { logUI } from "@renderer/lib/debug"
import { formatKeyComboForDisplay } from "@shared/key-utils"
import { Send, Bot } from "lucide-react"
import { useSelectedAgentId } from "@renderer/components/agent-selector"
import type { AgentProfile } from "@shared/types"

type PendingScreenshotAttachment = { name?: string; dataUrl: string }

const DEFAULT_VISUALIZER_BAR_COUNT = 52
const MIN_VISUALIZER_BAR_COUNT = 24
const MAX_VISUALIZER_BAR_COUNT = 240
const WAVEFORM_BAR_WIDTH_PX = 2
const WAVEFORM_BAR_GAP_PX = 2
const WAVEFORM_HORIZONTAL_PADDING_PX = 16
const WAVEFORM_PANEL_CONTENT_MIN_WIDTH_PX = 280
const MIN_WAVEFORM_WIDTH =
  Math.max(
    DEFAULT_VISUALIZER_BAR_COUNT * (WAVEFORM_BAR_WIDTH_PX + WAVEFORM_BAR_GAP_PX) +
      WAVEFORM_HORIZONTAL_PADDING_PX * 2,
    WAVEFORM_PANEL_CONTENT_MIN_WIDTH_PX,
  )
const WAVEFORM_MIN_HEIGHT = 120
const WAVEFORM_WITH_PREVIEW_HEIGHT = 148
const TEXT_INPUT_MIN_HEIGHT = 180
const TEXT_INPUT_MIN_WIDTH_PX = 380
const PROGRESS_MIN_HEIGHT = 200

type PanelSize = { width: number; height: number }

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const isPanelSize = (value: unknown): value is PanelSize =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number" &&
  Number.isFinite((value as { width: number }).width) &&
  Number.isFinite((value as { height: number }).height)

const getCssViewportSize = (): PanelSize => {
  if (typeof window === "undefined") return { width: 0, height: 0 }
  return {
    width: Math.max(1, Math.round(window.innerWidth || 0)),
    height: Math.max(1, Math.round(window.innerHeight || 0)),
  }
}

const getPanelViewportScale = (
  nativePanelSize: PanelSize,
  cssViewportSize: PanelSize,
) => {
  if (
    !Number.isFinite(nativePanelSize.width) ||
    !Number.isFinite(nativePanelSize.height) ||
    !Number.isFinite(cssViewportSize.width) ||
    !Number.isFinite(cssViewportSize.height) ||
    nativePanelSize.width <= 0 ||
    nativePanelSize.height <= 0 ||
    cssViewportSize.width <= 0 ||
    cssViewportSize.height <= 0
  ) return 1
  return clamp(nativePanelSize.width / cssViewportSize.width, 0.5, 3)
}

const getInitialVisualizerData = (length = DEFAULT_VISUALIZER_BAR_COUNT) =>
  Array<number>(length).fill(-1000)

const resizeVisualizerData = (data: number[], targetLength: number): number[] => {
  if (targetLength <= 0) return []
  if (data.length === targetLength) return data
  if (data.length > targetLength) {
    return data.slice(data.length - targetLength)
  }
  return [...Array<number>(targetLength - data.length).fill(-1000), ...data]
}

interface RecordingWaveformPanelProps {
  recordingViewportRef: RefObject<HTMLDivElement | null>
  selectedAgentName: string | null
  continueConversationTitle: string | null
  visualizerData: number[]
  visualizerBarCount: number
  waveformContainerHeightPx: number
  stableViewportSize: PanelSize
  zoomCompensationScale: number
  isPreviewEnabled: boolean
  previewText: string
  submitShortcutText: string
  onSubmitRecording: () => void
}

function RecordingWaveformPanel({
  recordingViewportRef,
  selectedAgentName,
  continueConversationTitle,
  visualizerData,
  visualizerBarCount,
  waveformContainerHeightPx,
  stableViewportSize,
  zoomCompensationScale,
  isPreviewEnabled,
  previewText,
  submitShortcutText,
  onSubmitRecording,
}: RecordingWaveformPanelProps) {
  const stableWidth = stableViewportSize.width > 0 ? stableViewportSize.width : MIN_WAVEFORM_WIDTH
  const stableHeight = stableViewportSize.height > 0 ? stableViewportSize.height : WAVEFORM_MIN_HEIGHT

  return (
    <div
      ref={recordingViewportRef}
      className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden"
    >
      <div
        className="flex flex-col items-center justify-center"
        style={{
          width: `${stableWidth}px`,
          height: `${stableHeight}px`,
          transform: `scale(${zoomCompensationScale})`,
          transformOrigin: "center",
        }}
      >
        {/* Selected agent indicator during recording */}
        {selectedAgentName && !continueConversationTitle && (
          <div className="mb-1 flex max-w-[calc(100%-2rem)] items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary dark:bg-primary/10">
            <Bot className="h-3 w-3 shrink-0" />
            <span className="min-w-0 truncate font-medium">{selectedAgentName}</span>
          </div>
        )}
        {/* Continue conversation indicator */}
        {continueConversationTitle && (
          <div className="mb-1 flex max-w-[calc(100%-2rem)] items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
            <span className="opacity-70">Continuing:</span>
            <span className="min-w-0 truncate font-medium">{continueConversationTitle}</span>
          </div>
        )}
        {/* Waveform uses native panel pixels so browser zoom does not reshape it. */}
        <div
          className="pointer-events-none flex w-full items-center justify-center px-4 opacity-100 transition-all duration-300"
          style={{ height: `${waveformContainerHeightPx}px` }}
        >
          <div className="flex h-full w-full items-center justify-center gap-0.5 overflow-hidden">
            {visualizerData.slice(-visualizerBarCount).map((rms, index) => (
              <div
                key={index}
                className={cn(
                  "h-full w-0.5 shrink-0 rounded-lg",
                  "bg-red-500 dark:bg-white",
                  rms === -1000 && "bg-neutral-400 dark:bg-neutral-500",
                )}
                style={{ height: `${Math.min(100, Math.max(16, rms * 100))}%` }}
              />
            ))}
          </div>
        </div>

        {/* Transcription preview */}
        {isPreviewEnabled && previewText && (
          <div className="w-full px-4 mt-1">
            <p className="text-xs text-muted-foreground italic text-center line-clamp-2">
              {previewText}
            </p>
          </div>
        )}

        {/* Submit button and keyboard hint */}
        <div className="mt-1 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-2 px-4 text-center">
          <button
            onClick={onSubmitRecording}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "bg-blue-500 hover:bg-blue-600 text-white",
              "dark:bg-blue-600 dark:hover:bg-blue-700",
            )}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit</span>
          </button>
          <span className="min-w-0 text-center text-xs leading-relaxed text-muted-foreground">
            {submitShortcutText.toLowerCase().startsWith("release") ? (
              <>or <kbd className="inline-flex max-w-full items-center rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{submitShortcutText}</kbd></>
            ) : (
              <>or press <kbd className="inline-flex max-w-full items-center rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{submitShortcutText}</kbd></>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export function Component() {
  const [visualizerData, setVisualizerData] = useState(() =>
    getInitialVisualizerData(),
  )
  const [recording, setRecording] = useState(false)
  const [mcpMode, setMcpMode] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const isConfirmedRef = useRef(false)
  const mcpModeRef = useRef(false)
  const recordingRef = useRef(false)
  const textInputPanelRef = useRef<TextInputPanelRef>(null)
  const mcpConversationIdRef = useRef<string | undefined>(undefined)
  const mcpSessionIdRef = useRef<string | undefined>(undefined)
  const mcpScreenshotRef = useRef<PendingScreenshotAttachment | undefined>(undefined)
  const fromTileRef = useRef<boolean>(false)
  const [continueConversationTitle, setContinueConversationTitle] = useState<string | null>(null)
  const [fromButtonClick, setFromButtonClick] = useState(false)
  const [previewText, setPreviewText] = useState("")
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingViewportRef = useRef<HTMLDivElement | null>(null)
  const [recordingViewportSize, setRecordingViewportSize] = useState({ width: 0, height: 0 })
  const [nativePanelSize, setNativePanelSize] = useState<PanelSize>({ width: 0, height: 0 })
  const [cssViewportSize, setCssViewportSize] = useState<PanelSize>(() => getCssViewportSize())
  const visualizerBarCountRef = useRef(DEFAULT_VISUALIZER_BAR_COUNT)
  const { isDark } = useTheme()
  const lastRequestedModeRef = useRef<"normal" | "agent" | "textInput">("normal")

  const requestPanelMode = (mode: "normal" | "agent" | "textInput") => {
    if (lastRequestedModeRef.current === mode) return
    lastRequestedModeRef.current = mode
    tipcClient.setPanelMode({ mode })
  }


  const agentProgress = useAgentProgress()
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)

  const currentConversationId = useConversationStore((s) => s.currentConversationId)
  const setCurrentConversationId = useConversationStore((s) => s.setCurrentConversationId)
  const endConversation = useConversationStore((s) => s.endConversation)

  // Get currently selected agent for display in waveform recording UI
  const [selectedAgentId, setSelectedAgentId] = useSelectedAgentId()
  const { data: agents = [] } = useQuery<AgentProfile[]>({
    queryKey: ["agentProfilesPanel"],
    queryFn: () => tipcClient.getAgentProfiles(),
  })
  const selectedAgentName = useMemo(() => {
    if (!selectedAgentId) return null
    const agent = agents.find((a) => a.id === selectedAgentId)
    return agent?.displayName || agent?.name || null
  }, [selectedAgentId, agents])

  const conversationQuery = useConversationQuery(currentConversationId)
  const currentConversation = conversationQuery.data ?? null
  const isConversationActive = !!currentConversation

  const createConversationMutation = useCreateConversationMutation()
  const startNewConversation = async (message: string, role: "user" | "assistant") => {
    const result = await createConversationMutation.mutateAsync({ firstMessage: message, role })
    if (result?.id) {
      setCurrentConversationId(result.id)
    }
    return result
  }

  const activeSessionCount = Array.from(agentProgressById?.values() ?? [])
    .filter(progress => progress && !progress.isSnoozed && !progress.isComplete).length

  // Count all visible sessions (including completed but not snoozed) for overlay display
  // Note: focused session exception is handled separately in anyVisibleSessions below
  const visibleSessionCount = Array.from(agentProgressById?.values() ?? [])
    .filter(progress => progress && !progress.isSnoozed).length
  // Aggregate session state helpers
  // Only consider non-snoozed AND non-completed sessions as "active" for session lifecycle.
  const anyActiveNonSnoozed = activeSessionCount > 0
  // Any non-snoozed session (including completed) should show the overlay
  // Also show overlay if there's a focused session (user explicitly selected it, even if snoozed)
  const anyVisibleSessions = visibleSessionCount > 0 || (focusedSessionId && agentProgressById?.has(focusedSessionId))

  const configQuery = useConfigQuery()
  const isDragEnabled = (configQuery.data as any)?.panelDragEnabled ?? true
  // Disable transcription preview for Parakeet since live chunk PCM conversion is expensive.
  const isPreviewEnabled =
    (configQuery.data?.transcriptionPreviewEnabled ?? false) &&
    configQuery.data?.sttProviderId !== "parakeet"

  useEffect(() => {
    const updateNativePanelSize = (size: unknown) => {
      if (isPanelSize(size)) {
        setNativePanelSize((prev) => {
          if (prev.width === size.width && prev.height === size.height) return prev
          return size
        })
      }
    }

    tipcClient.getPanelSize().then(updateNativePanelSize).catch((error: unknown) => {
      console.error("Failed to get panel size for zoom compensation:", error)
    })

    const unlisten = rendererHandlers.onPanelSizeChanged.listen(updateNativePanelSize)
    return unlisten
  }, [])

  useEffect(() => {
    const updateCssViewportSize = () => {
      const nextSize = getCssViewportSize()
      setCssViewportSize((prev) => {
        if (prev.width === nextSize.width && prev.height === nextSize.height) return prev
        return nextSize
      })
    }

    updateCssViewportSize()
    window.addEventListener("resize", updateCssViewportSize)
    window.visualViewport?.addEventListener("resize", updateCssViewportSize)

    return () => {
      window.removeEventListener("resize", updateCssViewportSize)
      window.visualViewport?.removeEventListener("resize", updateCssViewportSize)
    }
  }, [])

  // Keep a ref to the configured audio input device so effect callbacks can access it synchronously
  const audioInputDeviceIdRef = useRef(configQuery.data?.audioInputDeviceId)
  useEffect(() => {
    audioInputDeviceIdRef.current = configQuery.data?.audioInputDeviceId
  }, [configQuery.data?.audioInputDeviceId])

  // Start recording with the latest configured input device. We read the main-process
  // config via IPC first so a microphone change in Settings applies to the very next
  // recording without waiting for the React Query cache to refetch (issue #303). The
  // ref is refreshed in the background so the synchronous visualizer UI stays accurate.
  const startRecordingWithFreshDevice = async () => {
    let deviceId = audioInputDeviceIdRef.current
    try {
      const freshConfig = await tipcClient.getConfig()
      if (freshConfig) {
        deviceId = freshConfig.audioInputDeviceId
        audioInputDeviceIdRef.current = deviceId
      }
    } catch {
      // Best-effort: fall back to the ref value on IPC failure.
    }
    return recorderRef.current?.startRecording(deviceId)
  }

  // Apply selected audio output device to sound effects (recording start/stop beeps)
  useEffect(() => {
    setSoundOutputDevice(configQuery.data?.audioOutputDeviceId)
  }, [configQuery.data?.audioOutputDeviceId])

  const getSubmitShortcutText = useMemo(() => {
    const config = configQuery.data
    if (!config) return "Enter"

    if (fromButtonClick) {
      return "Enter"
    }

    if (mcpMode) {
      const shortcut = config.agentShortcut || config.mcpToolsShortcut
      if (shortcut === "hold-ctrl-alt") {
        return "Release keys"
      } else if (shortcut === "toggle-ctrl-alt") {
        return "Ctrl+Alt"
      } else if (shortcut === "ctrl-alt-slash") {
        return "Ctrl+Alt+/"
      } else if (shortcut === "custom" && (config.customAgentShortcut || config.customMcpToolsShortcut)) {
        return formatKeyComboForDisplay(config.customAgentShortcut || config.customMcpToolsShortcut || "")
      }
    } else {
      const shortcut = config.shortcut
      if (shortcut === "hold-ctrl") {
        return "Release Ctrl"
      } else if (shortcut === "ctrl-slash") {
        return "Ctrl+/"
      } else if (shortcut === "custom" && config.customShortcut) {
        const mode = config.customShortcutMode || "hold"
        if (mode === "hold") {
          return "Release keys"
        }
        return formatKeyComboForDisplay(config.customShortcut)
      }
    }
    return "Enter"
  }, [configQuery.data, mcpMode, fromButtonClick])

  const handleSubmitRecording = () => {
    if (!recording) return
    isConfirmedRef.current = true
    recorderRef.current?.stopRecording()
  }

  useEffect(() => {
    if (!recording || !fromButtonClick) return undefined

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.code === "NumpadEnter") && !e.shiftKey) {
        e.preventDefault()
        handleSubmitRecording()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [recording, fromButtonClick])

  const transcribeMutation = useMutation({
    mutationFn: async ({
      blob,
      duration,
      transcript,
    }: {
      blob: Blob
      duration: number
      transcript?: string
    }) => {
      // If we have a transcript, start a conversation with it
      if (transcript && !isConversationActive) {
        await startNewConversation(transcript, "user")
      }

      // Fetch config synchronously to avoid race condition where configQuery.data
      // is undefined on early interactions (augment review feedback)
      const config = await tipcClient.getConfig()
      const isParakeet = config?.sttProviderId === "parakeet"
      const pcmRecording = isParakeet ? await decodeBlobToPcm(blob) : undefined
      await tipcClient.createRecording({
        recording: await blob.arrayBuffer(),
        pcmRecording,
        duration,
      })
    },
    onError(error) {
      tipcClient.hidePanelWindow({})
      tipcClient.displayError({
        title: error.name,
        message: error.message,
      })
    },
  })

  const mcpTranscribeMutation = useMutation({
    mutationFn: async ({
      blob,
      duration,
      transcript,
    }: {
      blob: Blob
      duration: number
      transcript?: string
    }) => {
      // Fetch config synchronously to avoid race condition where configQuery.data
      // is undefined on early interactions (augment review feedback)
      const config = await tipcClient.getConfig()
      const isParakeet = config?.sttProviderId === "parakeet"
      const pcmRecording = isParakeet ? await decodeBlobToPcm(blob) : undefined
      const arrayBuffer = await blob.arrayBuffer()

      // Use the conversationId and sessionId passed through IPC (from mic button clicks).
      // The refs are more reliable for mic button clicks as they avoid timing issues.
      const conversationIdForMcp = mcpConversationIdRef.current ?? currentConversationId
      const sessionIdForMcp = mcpSessionIdRef.current
      const screenshotForMcp = mcpScreenshotRef.current
      const wasFromTile = fromTileRef.current

      // Clear the refs after capturing to avoid reusing stale IDs
      mcpConversationIdRef.current = undefined
      mcpSessionIdRef.current = undefined
      mcpScreenshotRef.current = undefined
      fromTileRef.current = false

      // If recording was from a tile, hide the floating panel immediately
      // The session will continue in the tile view
      if (wasFromTile) {
        tipcClient.hidePanelWindow({})
      }

      const result = await tipcClient.createMcpRecording({
        recording: arrayBuffer,
        pcmRecording,
        duration,
        // Pass conversationId and sessionId if user explicitly continued a conversation,
        // otherwise undefined to create a fresh conversation/session.
        conversationId: conversationIdForMcp ?? undefined,
        sessionId: sessionIdForMcp,
        screenshot: screenshotForMcp,
        // Pass fromTile so session starts snoozed when recording was from a tile
        fromTile: wasFromTile,
      })

      // NOTE: Do NOT call continueConversation here!
      // The currentConversationId should only be set through explicit user actions
      // (like clicking "Continue" in history or using TileFollowUpInput).
      // Automatically setting it here would cause subsequent new sessions to
      // inherit this session's conversation history (session pollution bug).

      return result
    },
    onError(error) {
      // Clear the refs on error as well
      mcpConversationIdRef.current = undefined
      mcpSessionIdRef.current = undefined
      fromTileRef.current = false

      tipcClient.hidePanelWindow({})
      tipcClient.displayError({
        title: error.name,
        message: error.message,
      })
    },
    onSuccess() {
      // Don't clear progress or hide panel on success - agent mode will handle this
      // The panel needs to stay visible for agent mode progress updates
      // (unless recording was from a tile, which already hid the panel in mutationFn)
    },
  })

  const textInputMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await tipcClient.createTextInput({ text })
    },
    onError(error) {
      setShowTextInput(false)
      tipcClient.clearTextInputState({})

      tipcClient.hidePanelWindow({})
      tipcClient.displayError({
        title: error.name,
        message: error.message,
      })
    },
    onSuccess() {
      setShowTextInput(false)
      // Clear text input state
      tipcClient.clearTextInputState({})

      tipcClient.hidePanelWindow({})
    },
  })

  const mcpTextInputMutation = useMutation({
    mutationFn: async ({
      text,
      conversationId,
    }: {
      text: string
      conversationId?: string
    }) => {
      const result = await tipcClient.createMcpTextInput({ text, conversationId })

      // NOTE: Do NOT call continueConversation here!
      // The currentConversationId should only be set through explicit user actions
      // (like clicking "Continue" in history or using TileFollowUpInput).
      // Automatically setting it here would cause subsequent new sessions to
      // inherit this session's conversation history (session pollution bug).

      return result
    },
    onError(error) {
      setShowTextInput(false)
      tipcClient.clearTextInputState({})

      tipcClient.hidePanelWindow({})
      tipcClient.displayError({
        title: error.name,
        message: error.message,
      })
    },
    onSuccess() {
      setShowTextInput(false)
      // Ensure main process knows text input is no longer active (prevents textInput positioning)
      tipcClient.clearTextInputState({})
      // Don't hide panel on success - agent mode will handle this and keep panel visible
      // The panel needs to stay visible for agent mode progress updates
    },
  })

  const recorderRef = useRef<Recorder | null>(null)

  useEffect(() => {
    if (recorderRef.current) return

    const recorder = (recorderRef.current = new Recorder())

    recorder.on("record-start", () => {
      // Pass mcpMode to main process so it knows we're in MCP toggle mode
      // This is critical for preventing panel close on key release in toggle mode
      tipcClient.recordEvent({ type: "start", mcpMode: mcpModeRef.current })
    })

    recorder.on("visualizer-data", (rms) => {
      setVisualizerData((prev) => {
        const data = [...prev, rms]
        const targetLength = visualizerBarCountRef.current

        if (data.length > targetLength) {
          data.splice(0, data.length - targetLength)
        }

        return data
      })
    })

    recorder.on("record-end", (blob, duration) => {
      const currentMcpMode = mcpModeRef.current
      setRecording(false)
      recordingRef.current = false
      setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
      tipcClient.recordEvent({ type: "end" })

      if (!isConfirmedRef.current) {
        // Clear context from aborted runs so follow-up recordings start clean.
        mcpConversationIdRef.current = undefined
        mcpSessionIdRef.current = undefined
        mcpScreenshotRef.current = undefined
        fromTileRef.current = false
        setMcpMode(false)
        mcpModeRef.current = false
        setFromButtonClick(false)
        setContinueConversationTitle(null)
        return
      }

      // Check if blob is empty - silently ignore (likely accidental press)
      if (blob.size === 0) {
        console.warn("[Panel] Recording blob is empty, ignoring (likely accidental press)")
        mcpConversationIdRef.current = undefined
        mcpSessionIdRef.current = undefined
        mcpScreenshotRef.current = undefined
        fromTileRef.current = false
        setMcpMode(false)
        mcpModeRef.current = false
        setFromButtonClick(false)
        setContinueConversationTitle(null)
        tipcClient.hidePanelWindow({})
        return
      }

      // Check minimum duration (at least 100ms) - silently ignore (likely accidental press)
      if (duration < 100) {
        console.warn("[Panel] Recording duration too short:", duration, "ms - ignoring (likely accidental press)")
        mcpConversationIdRef.current = undefined
        mcpSessionIdRef.current = undefined
        mcpScreenshotRef.current = undefined
        fromTileRef.current = false
        setMcpMode(false)
        mcpModeRef.current = false
        setFromButtonClick(false)
        setContinueConversationTitle(null)
        tipcClient.hidePanelWindow({})
        return
      }

      playSound("end_record")

      // Use appropriate mutation based on mode
      if (currentMcpMode) {
        mcpTranscribeMutation.mutate({
          blob,
          duration,
        })
      } else {
        // Ensure MCP context does not leak into future MCP submissions.
        mcpConversationIdRef.current = undefined
        mcpSessionIdRef.current = undefined
        mcpScreenshotRef.current = undefined
        fromTileRef.current = false
        transcribeMutation.mutate({
          blob,
          duration,
        })
      }

      // Reset agent mode and button click state after recording
      setMcpMode(false)
      mcpModeRef.current = false
      setFromButtonClick(false)
      setContinueConversationTitle(null)
    })
  }, [mcpMode, mcpTranscribeMutation, transcribeMutation])

  useEffect(() => {
    if (!recording) {
      setRecordingViewportSize({ width: 0, height: 0 })
      return undefined
    }

    const viewport = recordingViewportRef.current
    if (!viewport || typeof ResizeObserver === "undefined") {
      return undefined
    }

    const updateViewportSize = (width: number, height: number) => {
      setRecordingViewportSize((prev) => {
        if (prev.width === width && prev.height === height) return prev
        return { width, height }
      })
    }

    updateViewportSize(
      Math.round(viewport.getBoundingClientRect().width),
      Math.round(viewport.getBoundingClientRect().height),
    )

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      updateViewportSize(
        Math.round(entry.contentRect.width),
        Math.round(entry.contentRect.height),
      )
    })
    observer.observe(viewport)

    return () => observer.disconnect()
  }, [recording])

  // Transcription preview: periodically send audio chunks for live transcription
  useEffect(() => {
    if (!recording || !isPreviewEnabled) {
      // Clear preview state when not recording
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current)
        previewTimerRef.current = null
      }
      if (!recording) {
        setPreviewText("")
      }
      return undefined
    }

    // Groq bills a minimum of 10 seconds per request, so use 10s intervals
    // after the initial call. First call fires after a short delay to
    // accumulate enough audio for a useful transcription.
    const INITIAL_DELAY_MS = 3_000
    const CHUNK_INTERVAL_MS = 10_000
    let inflight = false
    // Guard: only call the API when there is new audio since the last request.
    // We always send the FULL cumulative recording (getRecordingBlob) so the
    // WebM structure is always valid — partial blobs starting mid-stream have
    // a timestamp gap that Groq rejects as "not a valid media file".
    let lastChunkCount = 0

    const sendChunk = async () => {
      if (inflight) return
      const recorder = recorderRef.current
      if (!recorder) return
      const currentCount = recorder.getAudioChunkCount()
      if (currentCount === 0 || currentCount <= lastChunkCount) return
      const blob = recorder.getRecordingBlob()
      if (!blob || blob.size === 0) return
      // Snapshot now so a slow API response doesn't race with new chunks
      const sentUpTo = currentCount
      inflight = true
      try {
        const result = await tipcClient.transcribeChunk({
          recording: await blob.arrayBuffer(),
        })
        // Advance the pointer so the next tick skips if no new audio arrived.
        lastChunkCount = sentUpTo
        if (result?.text) {
          // Replace (not append) — each call returns the full transcript for
          // the entire recording so far, so there is no need to accumulate.
          setPreviewText(result.text)
        }
      } catch (err) {
        console.error("[Preview] Transcription error:", err)
      } finally {
        inflight = false
      }
    }

    // Fire the first transcription after a short delay, then repeat
    const initialTimer = setTimeout(() => {
      sendChunk()
      previewTimerRef.current = setInterval(sendChunk, CHUNK_INTERVAL_MS)
    }, INITIAL_DELAY_MS)

    return () => {
      clearTimeout(initialTimer)
      if (previewTimerRef.current) {
        clearInterval(previewTimerRef.current)
        previewTimerRef.current = null
      }
    }
  }, [recording, isPreviewEnabled])

  // Resize the panel window when transcription preview text appears/disappears
  useEffect(() => {
    if (!recording) return
    const hasPreview = isPreviewEnabled && previewText.length > 0
    tipcClient.resizePanelForWaveformPreview({ showPreview: hasPreview })
  }, [recording, isPreviewEnabled, previewText])

  useEffect(() => {
    const unlisten = rendererHandlers.startRecording.listen((data) => {
      // Ensure we are in normal dictation mode (not MCP/agent)
      setMcpMode(false)
      mcpModeRef.current = false
      mcpScreenshotRef.current = undefined
      setContinueConversationTitle(null)
      // Track if recording was triggered via UI button click (e.g., tray menu)
      setFromButtonClick(data?.fromButtonClick ?? false)
      // Hide text input panel if it was showing - voice recording takes precedence
      setShowTextInput(false)
      // Clear text input state in main process so panel doesn't stay in textInput mode (positioning/sizing)
      tipcClient.clearTextInputState({})
      // Set recording state immediately to show waveform UI without waiting for async mic init
      // This prevents flash of stale UI during the ~280ms mic initialization (fixes #974)
      setRecording(true)
      recordingRef.current = true
      setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
      startRecordingWithFreshDevice()?.catch((err: unknown) => {
        console.error('[panel] startRecording failed, resetting recording state:', err)
        setRecording(false)
        recordingRef.current = false
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
      })
    })

    return unlisten
  }, [])

  useEffect(() => {
    const unlisten = rendererHandlers.finishRecording.listen(() => {
      isConfirmedRef.current = true
      recorderRef.current?.stopRecording()
    })

    return unlisten
  }, [])

  useEffect(() => {
    const unlisten = rendererHandlers.stopRecording.listen(() => {
      isConfirmedRef.current = false
      recorderRef.current?.stopRecording()
    })

    return unlisten
  }, [])

  useEffect(() => {
    const unlisten = rendererHandlers.startOrFinishRecording.listen((data) => {
      // Use recordingRef instead of recording state to avoid race condition
      // where listener recreation with recording=false could trigger a new recording
      if (recordingRef.current) {
        isConfirmedRef.current = true
        recorderRef.current?.stopRecording()
      } else {
        // Force normal dictation mode - each new recording starts fresh
        setMcpMode(false)
        mcpModeRef.current = false
        mcpScreenshotRef.current = undefined
        // Track if recording was triggered via UI button click
        setFromButtonClick(data?.fromButtonClick ?? false)
        // Clear any stale "Continuing:" banner from a prior continue session
        setContinueConversationTitle(null)
        // Set recording state immediately to show waveform UI without waiting for async mic init
        // This prevents flash of stale UI during the ~280ms mic initialization (fixes #974)
        setRecording(true)
        recordingRef.current = true
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
        tipcClient.showPanelWindow({})
        startRecordingWithFreshDevice()?.catch?.((err: unknown) => {
          console.error('[panel] startRecording failed, resetting recording state:', err)
          setRecording(false)
          recordingRef.current = false
          setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
          fromTileRef.current = false
        })
      }
    })

    return unlisten
  }, []) // No dependencies - use refs for current state

  // Text input handlers
  useEffect(() => {
    const unlisten = rendererHandlers.showTextInput.listen((data) => {
      // Reset any previous pending state to ensure textarea is enabled
      textInputMutation.reset()
      mcpTextInputMutation.reset()

      // If a conversationId was provided (continue mode), set it as current
      if (data?.conversationId) {
        setCurrentConversationId(data.conversationId)
        setContinueConversationTitle(data.conversationTitle || "conversation")
      } else {
        // Clear any existing conversation ID to ensure a fresh conversation is started
        // This prevents the bug where previous session messages are included when
        // submitting a new message via the text input keybind
        endConversation()
        setContinueConversationTitle(null)
      }

      // Show text input and focus
      lastRequestedModeRef.current = "textInput"
      setShowTextInput(true)
      // Panel window is already shown by the keyboard handler
      // Focus the text input after a short delay to ensure it's rendered
      setTimeout(async () => {
        // Set initial text if provided (e.g., from predefined prompts)
        if (data?.initialText) {
          textInputPanelRef.current?.setInitialText(data.initialText)
        }

        try {
          await tipcClient.setPanelFocusable({ focusable: true, andFocus: true })
        } catch {
          // Ignore — the textarea focus attempt below may still succeed
        }

        textInputPanelRef.current?.focus()
      }, 100)
    })

    return unlisten
  }, [endConversation, setCurrentConversationId])

  useEffect(() => {
    const unlisten = rendererHandlers.hideTextInput.listen(() => {
      lastRequestedModeRef.current = "normal"
      setShowTextInput(false)
    })

    return unlisten
  }, [])

  const handleTextSubmit = async (text: string) => {
    const applied = await applySelectedAgentToNextSession({
      selectedAgentId,
      setSelectedAgentId,
      agentProfiles: agents,
      onError: (error) => {
        logUI("[Panel] Failed to apply selected agent before text submit", { selectedAgentId, error })
      },
    })
    if (!applied) {
      return false
    }

    // Capture the conversation ID at submit time - if user explicitly continued a conversation
    // from history, currentConversationId will be set. Otherwise it's null for new inputs.
    const conversationIdForMcp = currentConversationId

    // Hide the text input immediately and show processing/overlay
    setShowTextInput(false)
    // Ensure main process no longer treats panel as textInput mode
    tipcClient.clearTextInputState({})

    // Always use MCP processing
    mcpTextInputMutation.mutate({
      text,
      // Pass currentConversationId if user explicitly continued from history,
      // otherwise undefined to create a fresh conversation.
      // This prevents message leaking while still supporting explicit continuation.
      conversationId: conversationIdForMcp ?? undefined,
    })

    return true
  }



  // MCP handlers
  useEffect(() => {
    const unlisten = rendererHandlers.startMcpRecording.listen((data) => {
      // Store the conversationId, sessionId, and fromTile flag for use when recording ends
      mcpConversationIdRef.current = data?.conversationId
      mcpSessionIdRef.current = data?.sessionId
      mcpScreenshotRef.current = data?.screenshot
      fromTileRef.current = data?.fromTile ?? false
      // Track if recording was triggered via UI button click vs keyboard shortcut
      // When true, we show "Enter" as the submit hint instead of "Release keys"
      setFromButtonClick(data?.fromButtonClick ?? false)

      // Track continue conversation title for visual indicator
      // Use fallback title when conversationId is provided without explicit title
      if (data?.conversationId) {
        setContinueConversationTitle(data.conversationTitle || "conversation")
      } else {
        setContinueConversationTitle(null)
      }

      // If recording is NOT from a tile and no explicit conversationId was passed,
      // clear any existing conversation ID to ensure a fresh conversation is started.
      // This prevents the bug where previous session messages are included when
      // submitting a new message via the agent mode keybind.
      if (!data?.fromTile && !data?.conversationId) {
        endConversation()
      }

      // Hide text input panel if it was showing - voice recording takes precedence
      // This fixes bug #903 where mic button in continue conversation showed text input
      setShowTextInput(false)
      // Clear text input state in main process so panel doesn't stay in textInput mode (positioning/sizing)
      tipcClient.clearTextInputState({})

      setMcpMode(true)
      mcpModeRef.current = true
      // Set recording state immediately to show waveform UI without waiting for async mic init
      // This prevents flash of stale progress UI during the ~280ms mic initialization
      setRecording(true)
      recordingRef.current = true
      setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
      startRecordingWithFreshDevice()?.catch?.((err: unknown) => {
        console.error('[panel] startRecording failed, resetting recording state:', err)
        setRecording(false)
        recordingRef.current = false
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
        // Also clear agent context to avoid leaving the panel stuck in agent mode
        // with no active recording.
        setMcpMode(false)
        mcpModeRef.current = false
        mcpConversationIdRef.current = undefined
        mcpSessionIdRef.current = undefined
        mcpScreenshotRef.current = undefined
        fromTileRef.current = false
      })
    })

    return unlisten
  }, [endConversation])

  useEffect(() => {
    const unlisten = rendererHandlers.finishMcpRecording.listen(() => {
      isConfirmedRef.current = true
      recorderRef.current?.stopRecording()
    })

    return unlisten
  }, [])

  useEffect(() => {
    const unlisten = rendererHandlers.startOrFinishMcpRecording.listen((data) => {
      // Use recordingRef instead of recording state to avoid race condition
      // where listener recreation with recording=false could trigger a new recording
      if (recordingRef.current) {
        isConfirmedRef.current = true
        recorderRef.current?.stopRecording()
      } else {
        // Store the conversationId and sessionId for use when recording ends
        mcpConversationIdRef.current = data?.conversationId
        mcpSessionIdRef.current = data?.sessionId
        mcpScreenshotRef.current = data?.screenshot
        fromTileRef.current = data?.fromTile ?? false
        // Track if recording was triggered via UI button click vs keyboard shortcut
        setFromButtonClick(data?.fromButtonClick ?? false)
        setContinueConversationTitle(null)
        // Hide text input panel if it was showing - voice recording takes precedence
        // This fixes bug #903 where mic button in continue conversation showed text input
        setShowTextInput(false)
        // Clear text input state in main process so panel doesn't stay in textInput mode (positioning/sizing)
        tipcClient.clearTextInputState({})
        setMcpMode(true)
        mcpModeRef.current = true
        // Set recording state immediately to avoid stale progress flashing before mic init.
        setRecording(true)
        recordingRef.current = true
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
        requestPanelMode("normal") // Ensure panel is normal size for recording
        tipcClient.showPanelWindow({})
        startRecordingWithFreshDevice()?.catch?.((err: unknown) => {
          console.error('[panel] startRecording failed, resetting recording state:', err)
          setRecording(false)
          recordingRef.current = false
          setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
          // Also clear agent context to avoid leaving the panel stuck in agent mode
          // with no active recording (similar to aborted/empty/too-short early returns).
          setMcpMode(false)
          mcpModeRef.current = false
          mcpConversationIdRef.current = undefined
          mcpSessionIdRef.current = undefined
          mcpScreenshotRef.current = undefined
          fromTileRef.current = false
        })
      }
    })

    return unlisten
  }, []) // No dependencies - use refs for current state

  // Agent progress handler - request mode changes only when target changes
  // Note: Progress updates are session-aware in ConversationContext; avoid redundant mode requests here
  useEffect(() => {
    const isTextSubmissionPending = textInputMutation.isPending || mcpTextInputMutation.isPending

    // If text input is active, don't override the mode - keep it as textInput
    // This prevents the panel from becoming unfocusable while user is typing
    if (showTextInput) {
      return undefined
    }

    let targetMode: "agent" | "normal" | null = null
    if (anyActiveNonSnoozed) {
      targetMode = "agent"
      // When switching to agent/progress mode, stop any ongoing recording.
      if (recordingRef.current) {
        isConfirmedRef.current = false
        setRecording(false)
        recordingRef.current = false
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
        recorderRef.current?.stopRecording()
      }
    } else if (anyVisibleSessions && !recording) {
      targetMode = "agent"
    } else if (isTextSubmissionPending) {
      targetMode = null // keep current size briefly to avoid flicker
    } else {
      targetMode = "normal"
    }

    let tid: ReturnType<typeof setTimeout> | null = null
    if (targetMode && lastRequestedModeRef.current !== targetMode) {
      const delay = targetMode === "agent" ? 100 : 0
      tid = setTimeout(() => {
        requestPanelMode(targetMode!)
      }, delay)
    }
    return () => {
      if (tid) clearTimeout(tid)
    }
  }, [anyActiveNonSnoozed, anyVisibleSessions, recording, textInputMutation.isPending, mcpTextInputMutation.isPending, showTextInput])

  // Note: We don't need to hide text input when agentProgress changes because:
  // 1. handleTextSubmit already hides it immediately on submit (line 375)
  // 2. mcpTextInputMutation.onSuccess/onError also hide it (lines 194, 204)
  // 3. Hiding on ANY agentProgress change would close text input when background
  //    sessions get updates, which breaks the UX when user is typing

  // Clear agent progress handler
  useEffect(() => {
    const unlisten = rendererHandlers.clearAgentProgress.listen(() => {
      logUI("[Panel] clearAgentProgress received; stopping TTS and resetting local panel state")
      // Stop all TTS audio when clearing progress (ESC key pressed)
      ttsManager.stopAll("panel-clear-agent-progress")

      // Stop any ongoing recording and reset recording state
      if (recordingRef.current) {
        isConfirmedRef.current = false
        setRecording(false)
        recordingRef.current = false
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
        recorderRef.current?.stopRecording()
      }

      // Reset all mutations to clear isPending state
      transcribeMutation.reset()
      mcpTranscribeMutation.reset()
      textInputMutation.reset()
      mcpTextInputMutation.reset()

      setMcpMode(false)
      mcpModeRef.current = false
      // End conversation when clearing progress (user pressed ESC)
      if (isConversationActive) {
        endConversation()
      }
    })

    return unlisten
  }, [isConversationActive, endConversation, transcribeMutation, mcpTranscribeMutation, textInputMutation, mcpTextInputMutation])

  // Emergency stop handler - stop all TTS audio and reset processing state
  useEffect(() => {
    const unlisten = rendererHandlers.emergencyStopAgent.listen(() => {
      logUI("[Panel] emergencyStopAgent received; stopping TTS and resetting local panel state")
      ttsManager.stopAll("panel-emergency-stop")

      // Stop any ongoing recording and reset recording state
      if (recordingRef.current) {
        isConfirmedRef.current = false
        setRecording(false)
        recordingRef.current = false
        setVisualizerData(() => getInitialVisualizerData(visualizerBarCountRef.current))
        recorderRef.current?.stopRecording()
      }

      // Reset all processing states
      setMcpMode(false)
      mcpModeRef.current = false
      setShowTextInput(false)

      // Reset mutations to idle state
      transcribeMutation.reset()
      mcpTranscribeMutation.reset()
      textInputMutation.reset()
      mcpTextInputMutation.reset()
    })

    return unlisten
  }, [transcribeMutation, mcpTranscribeMutation, textInputMutation, mcpTextInputMutation])

	  // Track latest state values in a ref to avoid race conditions with auto-close timeout
	  const autoCloseStateRef = useRef({
	    anyVisibleSessions,
	    showTextInput,
	    recording,
	    isTextSubmissionPending: textInputMutation.isPending || mcpTextInputMutation.isPending
	  })

	  // Keep ref in sync with latest state
	  useEffect(() => {
	    autoCloseStateRef.current = {
	      anyVisibleSessions,
	      showTextInput,
	      recording,
	      isTextSubmissionPending: textInputMutation.isPending || mcpTextInputMutation.isPending
	    }
	  }, [anyVisibleSessions, showTextInput, recording, textInputMutation.isPending, mcpTextInputMutation.isPending])

	  // Auto-close the panel when there's nothing to show
	  useEffect(() => {
	    // Keep panel open if a text submission is still pending (to avoid flicker)
	    const isTextSubmissionPending = textInputMutation.isPending || mcpTextInputMutation.isPending
	    const showsAgentOverlay = anyVisibleSessions

	    const shouldAutoClose =
	      !showsAgentOverlay &&
	      !showTextInput &&
	      !recording &&
	      !isTextSubmissionPending

	    if (shouldAutoClose) {
	      const t = setTimeout(() => {
	        // Re-check latest state before closing to prevent race conditions
	        // State may have changed during the 200ms delay
	        const latestState = autoCloseStateRef.current
	        const stillShouldClose =
	          !latestState.anyVisibleSessions &&
	          !latestState.showTextInput &&
	          !latestState.recording &&
	          !latestState.isTextSubmissionPending

	        if (stillShouldClose) {
	          tipcClient.hidePanelWindow({})
	        }
	      }, 200)
	      return () => clearTimeout(t)
	    }

      return undefined as void

	  }, [anyVisibleSessions, showTextInput, recording, textInputMutation.isPending, mcpTextInputMutation.isPending])

  // Use appropriate minimum height based on current mode
  const hasPreviewVisible = recording && isPreviewEnabled && previewText.length > 0
  const panelViewportScale = useMemo(
    () => getPanelViewportScale(nativePanelSize, cssViewportSize),
    [nativePanelSize, cssViewportSize],
  )
  const recordingViewportScale = recording ? panelViewportScale : 1
  const stableRecordingViewportSize = useMemo(
    () => ({
      width: Math.round(recordingViewportSize.width * recordingViewportScale),
      height: Math.round(recordingViewportSize.height * recordingViewportScale),
    }),
    [recordingViewportScale, recordingViewportSize.height, recordingViewportSize.width],
  )
  const zoomCompensationScale = recordingViewportScale > 0 ? 1 / recordingViewportScale : 1
  const availableWaveformWidth = Math.max(
    0,
    stableRecordingViewportSize.width - WAVEFORM_HORIZONTAL_PADDING_PX * 2,
  )
  const visualizerBarCount = useMemo(() => {
    if (availableWaveformWidth <= 0) return DEFAULT_VISUALIZER_BAR_COUNT
    const estimatedCount = Math.floor(
      (availableWaveformWidth + WAVEFORM_BAR_GAP_PX) /
        (WAVEFORM_BAR_WIDTH_PX + WAVEFORM_BAR_GAP_PX),
    )
    return clamp(
      estimatedCount,
      MIN_VISUALIZER_BAR_COUNT,
      MAX_VISUALIZER_BAR_COUNT,
    )
  }, [availableWaveformWidth])
  const waveformContainerHeightPx = useMemo(() => {
    const availableHeight =
      stableRecordingViewportSize.height > 0
        ? stableRecordingViewportSize.height
        : hasPreviewVisible
          ? WAVEFORM_WITH_PREVIEW_HEIGHT
          : WAVEFORM_MIN_HEIGHT

    if (hasPreviewVisible) {
      return Math.round(clamp(availableHeight * 0.22, 34, 64))
    }
    return Math.round(clamp(availableHeight * 0.3, 44, 88))
  }, [hasPreviewVisible, stableRecordingViewportSize.height])

  useEffect(() => {
    visualizerBarCountRef.current = visualizerBarCount
    setVisualizerData((prev) => resizeVisualizerData(prev, visualizerBarCount))
  }, [visualizerBarCount])

  const waveformHeight = hasPreviewVisible ? WAVEFORM_WITH_PREVIEW_HEIGHT : WAVEFORM_MIN_HEIGHT
  const minWidth = showTextInput ? TEXT_INPUT_MIN_WIDTH_PX : MIN_WAVEFORM_WIDTH
  const minHeight = showTextInput ? TEXT_INPUT_MIN_HEIGHT : (anyVisibleSessions && !recording ? PROGRESS_MIN_HEIGHT : waveformHeight)
  const panelResizeMode = showTextInput ? "textInput" : anyVisibleSessions && !recording ? "agent" : "normal"

  return (
    <PanelResizeWrapper
      enableResize={true}
      minWidth={minWidth}
      minHeight={minHeight}
      viewportScale={recordingViewportScale}
      fallbackMode={panelResizeMode}
      className={cn(
        "floating-panel modern-text-strong flex h-screen flex-col text-foreground",
        isDark ? "dark" : ""
      )}
    >
      {/* Drag bar - show whenever dragging is enabled (all states of floating GUI) */}
      {isDragEnabled && (
        <PanelDragBar className="shrink-0" disabled={!isDragEnabled} />
      )}

      <div className="flex min-h-0 flex-1">
        {showTextInput ? (
          <TextInputPanel
            ref={textInputPanelRef}
            onSubmit={handleTextSubmit}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            onCancel={() => {
              logUI("[Panel] Text input cancel requested; clearing state and hiding panel", {
                currentConversationId,
                continueConversationTitle,
                selectedAgentId,
                showTextInput,
              })
              setShowTextInput(false)
              tipcClient.hidePanelWindow({})
            }}
            isProcessing={
              textInputMutation.isPending || mcpTextInputMutation.isPending
            }
            agentProgress={agentProgress}
            continueConversationTitle={continueConversationTitle}
          />
        ) : (
          <div
            className={cn(
            "voice-input-panel modern-text-strong flex h-full w-full rounded-xl transition-all duration-300",
            isDark ? "dark" : ""
          )}>

            <div className={cn("relative flex grow items-center", !recording && "overflow-hidden")}>
              {/* Agent progress overlay - left-aligned and full coverage */}
              {/* Always use MultiAgentProgressView to prevent destructive remount
                  when session count changes (1→2 or 2→1). It handles single sessions
                  gracefully by hiding the tab bar. */}
              {/* Hide overlay when recording to show waveform instead */}
              {anyVisibleSessions && !recording && (
                <MultiAgentProgressView
                  variant="overlay"
                  className="absolute inset-0 z-20"
                />
              )}

              {/* Waveform visualization and submit controls - show when recording is active */}
              {recording && (
                <RecordingWaveformPanel
                  recordingViewportRef={recordingViewportRef}
                  selectedAgentName={selectedAgentName}
                  continueConversationTitle={continueConversationTitle}
                  visualizerData={visualizerData}
                  visualizerBarCount={visualizerBarCount}
                  waveformContainerHeightPx={waveformContainerHeightPx}
                  stableViewportSize={stableRecordingViewportSize}
                  zoomCompensationScale={zoomCompensationScale}
                  isPreviewEnabled={isPreviewEnabled}
                  previewText={previewText}
                  submitShortcutText={getSubmitShortcutText}
                  onSubmitRecording={handleSubmitRecording}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </PanelResizeWrapper>
  )
}
