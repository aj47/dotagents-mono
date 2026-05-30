import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Bot,
  Ear,
  Loader2,
  Mic,
  Moon,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Square,
  Volume2,
} from "lucide-react"
import {
  createInitialHandsFreeState,
  getHandsFreeResumablePhase,
  getHandsFreeStatusLabel,
  normalizeHandsFreeConfig,
  resolveHandsFreeUtterance,
  transitionHandsFreeToSleeping,
  type HandsFreeConfig,
  type HandsFreeControllerState,
  type HandsFreePhase,
} from "@dotagents/shared"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { TextInputPanel } from "./text-input-panel"
import { Recorder } from "@renderer/lib/recorder"
import { decodeBlobToPcm } from "@renderer/lib/audio-utils"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { queryClient } from "@renderer/lib/queries"
import { cn } from "@renderer/lib/utils"
import { playSound } from "@renderer/lib/sound"
import { useAgentStore } from "@renderer/stores"

export type SessionActionDialogMode = "text" | "voice"

interface SessionActionDialogProps {
  open: boolean
  mode: SessionActionDialogMode
  onOpenChange: (open: boolean) => void
  selectedAgentId?: string | null
  onSelectAgent?: (agentId: string | null) => void
  initialText?: string
  conversationId?: string
  sessionId?: string
  // Retained for prop compatibility; the dialog now uses fromTile-style launch
  // semantics so it can suppress hover-panel auto-show without forcing the
  // session into background/silent mode.
  fromTile?: boolean
  continueConversationTitle?: string | null
  agentName?: string | null
  onSubmitted?: () => void
}

const VISUALIZER_BAR_COUNT = 52
const INITIAL_VISUALIZER_DATA = Array<number>(VISUALIZER_BAR_COUNT).fill(0.01)
const HANDS_FREE_SPEECH_RMS_THRESHOLD = 0.075
const MIN_STANDARD_RECORDING_MS = 100
const MIN_HANDS_FREE_SEGMENT_MS = 450
const HANDS_FREE_RESTART_DELAY_MS = 180
const HANDS_FREE_NO_SPEECH_TIMEOUT_MS = 15_000

type VoiceRuntimeMode = "standard" | "hands-free"

type VoiceRuntimeConfig = Required<HandsFreeConfig> & {
  audioInputDeviceId?: string
  sttProviderId?: string
}

type HandsFreeTone = "muted" | "ready" | "active" | "busy" | "speaking" | "danger"

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
}

function normalizeTranscriptPreview(text?: string | null) {
  return (text || "").replace(/\s+/g, " ").trim()
}

function getHandsFreeTone(phase: HandsFreePhase): HandsFreeTone {
  switch (phase) {
    case "sleeping":
    case "paused":
      return "muted"
    case "waking":
      return "ready"
    case "listening":
      return "active"
    case "processing":
      return "busy"
    case "speaking":
      return "speaking"
    case "error":
      return "danger"
    default:
      return "muted"
  }
}

function getHandsFreeSubtitle(phase: HandsFreePhase, config: VoiceRuntimeConfig | null, lastError: string | null) {
  switch (phase) {
    case "sleeping":
      return config ? `Wake phrase: "${config.handsFreeWakePhrase}"` : "Waiting for wake phrase"
    case "waking":
      return "Awake"
    case "listening":
      return config ? `Sleep phrase: "${config.handsFreeSleepPhrase}"` : "Listening"
    case "processing":
      return "Agent is running"
    case "speaking":
      return "Assistant audio is playing"
    case "paused":
      return "Recognizer paused"
    case "error":
      return lastError || "Recognizer needs attention"
    default:
      return undefined
  }
}

function getPrimaryControlLabel(phase: HandsFreePhase) {
  switch (phase) {
    case "sleeping":
      return "Wake"
    case "paused":
      return "Resume"
    case "error":
      return "Retry"
    default:
      return "Pause"
  }
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return target.isContentEditable
    || tagName === "input"
    || tagName === "textarea"
    || tagName === "select"
}

function getToneClasses(tone: HandsFreeTone) {
  switch (tone) {
    case "ready":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "active":
      return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    case "busy":
      return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "speaking":
      return "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300"
    case "danger":
      return "border-destructive/25 bg-destructive/10 text-destructive"
    case "muted":
    default:
      return "border-border bg-muted/40 text-muted-foreground"
  }
}

function getToneDotClasses(tone: HandsFreeTone) {
  switch (tone) {
    case "ready":
      return "bg-emerald-500"
    case "active":
      return "bg-sky-500"
    case "busy":
      return "bg-amber-500"
    case "speaking":
      return "bg-violet-500"
    case "danger":
      return "bg-destructive"
    case "muted":
    default:
      return "bg-muted-foreground"
  }
}

function VoiceBars({
  values,
  tone,
  compact = false,
}: {
  values: number[]
  tone: HandsFreeTone
  compact?: boolean
}) {
  const barClass = tone === "danger"
    ? "bg-destructive"
    : tone === "busy"
      ? "bg-amber-500"
      : tone === "speaking"
        ? "bg-violet-500"
        : tone === "active" || tone === "ready"
          ? "bg-sky-500"
          : "bg-muted-foreground/70"

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-0.5 overflow-hidden rounded-md border bg-background/80 px-3",
        compact ? "h-16 py-2" : "h-24 py-3",
      )}
      aria-hidden="true"
    >
      {values.map((value, index) => (
        <div
          key={index}
          className={cn("w-0.5 shrink-0 rounded-full transition-all duration-150", barClass)}
          style={{ height: `${Math.max(12, Math.min(100, value * 100))}%` }}
        />
      ))}
    </div>
  )
}

function VoiceHotkeyHint({
  keys,
  label,
  disabled = false,
}: {
  keys: string
  label: string
  disabled?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 rounded-md border bg-background/80 px-1.5 py-1 text-[11px] font-medium text-muted-foreground",
        disabled && "opacity-45",
      )}
    >
      <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none text-foreground">
        {keys}
      </kbd>
      <span className="truncate">{label}</span>
    </span>
  )
}

export function SessionActionDialog({
  open,
  mode,
  onOpenChange,
  selectedAgentId = null,
  onSelectAgent = () => {},
  initialText,
  conversationId,
  sessionId,
  continueConversationTitle,
  agentName,
  onSubmitted,
}: SessionActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [visualizerData, setVisualizerData] = useState<number[]>(INITIAL_VISUALIZER_DATA)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [voiceRuntimeMode, setVoiceRuntimeMode] = useState<VoiceRuntimeMode>("standard")
  const [voiceRuntimeConfig, setVoiceRuntimeConfig] = useState<VoiceRuntimeConfig | null>(null)
  const [handsFreeState, setHandsFreeState] = useState<HandsFreeControllerState>(createInitialHandsFreeState)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [lastCapturedTranscript, setLastCapturedTranscript] = useState("")
  const [lastSubmittedText, setLastSubmittedText] = useState("")
  const [activeHandsFreeConversationId, setActiveHandsFreeConversationId] = useState<string | null>(
    conversationId ?? null,
  )
  const isMountedRef = useRef(false)
  const recorderRef = useRef<Recorder | null>(null)
  const recordingRef = useRef(false)
  const shouldSubmitVoiceRef = useRef(false)
  const isClosedRef = useRef(false)
  const voiceRuntimeModeRef = useRef<VoiceRuntimeMode>("standard")
  const voiceRuntimeConfigRef = useRef<VoiceRuntimeConfig | null>(null)
  const handsFreeStateRef = useRef<HandsFreeControllerState>(createInitialHandsFreeState())
  const handsFreeFinalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handsFreeRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handsFreeNoSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handsFreeSegmentHadSpeechRef = useRef(false)
  const handsFreeFinalizingRef = useRef(false)
  const activeHandsFreeConversationIdRef = useRef<string | null>(conversationId ?? null)

  const canUpdateDialogState = () => isMountedRef.current && !isClosedRef.current

  const canHandleRecorderCallback = (recorder: Recorder, allowPendingSubmit: boolean = false) => {
    if (!canUpdateDialogState()) return false
    if (recorderRef.current === recorder) return true
    return allowPendingSubmit && (shouldSubmitVoiceRef.current || handsFreeFinalizingRef.current)
  }

  const closeDialog = () => {
    isClosedRef.current = true
    setStatusMessage(null)
    onOpenChange(false)
  }

  const invalidateConversationQueries = async (targetConversationId?: string) => {
    if (targetConversationId) {
      await queryClient.invalidateQueries({ queryKey: ["conversation", targetConversationId] })
    }
    await queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
  }

  const clearHandsFreeTimers = () => {
    if (handsFreeFinalizeTimerRef.current) {
      clearTimeout(handsFreeFinalizeTimerRef.current)
      handsFreeFinalizeTimerRef.current = null
    }
    if (handsFreeRestartTimerRef.current) {
      clearTimeout(handsFreeRestartTimerRef.current)
      handsFreeRestartTimerRef.current = null
    }
    if (handsFreeNoSpeechTimerRef.current) {
      clearTimeout(handsFreeNoSpeechTimerRef.current)
      handsFreeNoSpeechTimerRef.current = null
    }
  }

  const stopRecorder = () => {
    recorderRef.current?.stopRecording()
    recorderRef.current = null
  }

  const setRecordingValue = (nextRecording: boolean) => {
    recordingRef.current = nextRecording
    setRecording(nextRecording)
  }

  const setVoiceRuntimeModeValue = (nextMode: VoiceRuntimeMode) => {
    voiceRuntimeModeRef.current = nextMode
    setVoiceRuntimeMode(nextMode)
  }

  const setHandsFreeStateValue = (
    nextStateOrUpdater:
      | HandsFreeControllerState
      | ((prev: HandsFreeControllerState) => HandsFreeControllerState),
  ) => {
    const previousState = handsFreeStateRef.current
    const nextState = typeof nextStateOrUpdater === "function"
      ? nextStateOrUpdater(previousState)
      : nextStateOrUpdater
    handsFreeStateRef.current = nextState
    setHandsFreeState(nextState)
  }

  const resetVoiceRuntimeState = () => {
    clearHandsFreeTimers()
    shouldSubmitVoiceRef.current = false
    handsFreeFinalizingRef.current = false
    handsFreeSegmentHadSpeechRef.current = false
    setRecordingValue(false)
    setIsSubmitting(false)
    setStatusMessage(null)
    setVisualizerData(INITIAL_VISUALIZER_DATA)
    setLiveTranscript("")
    setLastCapturedTranscript("")
    setLastSubmittedText("")
    setVoiceRuntimeModeValue("standard")
    setVoiceRuntimeConfig(null)
    voiceRuntimeConfigRef.current = null
    setActiveHandsFreeConversationId(conversationId ?? null)
    activeHandsFreeConversationIdRef.current = conversationId ?? null
    setHandsFreeStateValue(createInitialHandsFreeState())
  }

  const shouldKeepHandsFreeRecorderActive = () => {
    const state = handsFreeStateRef.current
    return canUpdateDialogState()
      && voiceRuntimeModeRef.current === "hands-free"
      && voiceRuntimeConfigRef.current?.handsFree === true
      && state.pauseReason !== "user"
      && state.phase !== "paused"
      && state.phase !== "error"
  }

  const scheduleHandsFreeRestart = (delayMs = HANDS_FREE_RESTART_DELAY_MS) => {
    if (!shouldKeepHandsFreeRecorderActive()) return
    if (handsFreeRestartTimerRef.current) {
      clearTimeout(handsFreeRestartTimerRef.current)
    }
    handsFreeRestartTimerRef.current = setTimeout(() => {
      handsFreeRestartTimerRef.current = null
      if (shouldKeepHandsFreeRecorderActive()) {
        void startVoiceRecording()
      }
    }, delayMs)
  }

  const scheduleHandsFreeNoSpeechTimeout = () => {
    if (handsFreeNoSpeechTimerRef.current) {
      clearTimeout(handsFreeNoSpeechTimerRef.current)
    }
    handsFreeNoSpeechTimerRef.current = setTimeout(() => {
      handsFreeNoSpeechTimerRef.current = null
      if (
        voiceRuntimeModeRef.current !== "hands-free"
        || !recordingRef.current
        || handsFreeSegmentHadSpeechRef.current
        || handsFreeFinalizingRef.current
      ) {
        return
      }

      handsFreeFinalizingRef.current = true
      stopRecorder()
    }, HANDS_FREE_NO_SPEECH_TIMEOUT_MS)
  }

  const finalizeHandsFreeSegment = () => {
    if (!recordingRef.current || voiceRuntimeModeRef.current !== "hands-free" || handsFreeFinalizingRef.current) return
    handsFreeFinalizingRef.current = true
    setStatusMessage("Finalizing speech...")
    stopRecorder()
  }

  const scheduleHandsFreeFinalization = () => {
    if (voiceRuntimeModeRef.current !== "hands-free") return
    if (handsFreeFinalizeTimerRef.current) {
      clearTimeout(handsFreeFinalizeTimerRef.current)
    }
    const debounceMs = Math.max(0, voiceRuntimeConfigRef.current?.handsFreeMessageDebounceMs ?? 1500)
    handsFreeFinalizeTimerRef.current = setTimeout(() => {
      handsFreeFinalizeTimerRef.current = null
      finalizeHandsFreeSegment()
    }, debounceMs)
  }

  const handleHandsFreeVoiceActivity = (rms: number) => {
    if (handsFreeFinalizingRef.current || voiceRuntimeModeRef.current !== "hands-free") return
    if (rms < HANDS_FREE_SPEECH_RMS_THRESHOLD) return

    if (handsFreeNoSpeechTimerRef.current) {
      clearTimeout(handsFreeNoSpeechTimerRef.current)
      handsFreeNoSpeechTimerRef.current = null
    }
    handsFreeSegmentHadSpeechRef.current = true
    scheduleHandsFreeFinalization()
  }

  const handleTextSubmit = async (text: string) => {
    setIsSubmitting(true)
    try {
      // SessionActionDialog is rendered inside the main app window and its
      // description explicitly promises "without opening the hover panel".
      // Keep the session foreground/audible for TTS autoplay while still
      // suppressing floating-panel auto-show via the tile-origin hint.
      const result = await tipcClient.createMcpTextInput({
        text,
        conversationId,
        sessionId,
        fromTile: true,
        startSnoozed: false,
      })

      if (sessionId && !result?.queued) {
        useAgentStore.getState().appendUserMessageToSession(sessionId, text)
      }

      await invalidateConversationQueries(conversationId)
      onSubmitted?.()
      closeDialog()
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to start the session."))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitHandsFreeText = async (text: string) => {
    const finalText = normalizeTranscriptPreview(text)
    if (!finalText) return

    setLastSubmittedText(finalText)
    setStatusMessage("Starting agent...")
    setIsSubmitting(true)
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: "processing",
      resumePhase: "listening",
      awakeSince: prev.awakeSince ?? Date.now(),
      lastError: null,
      recognizerErrorCount: 0,
    }))

    try {
      const result = await tipcClient.createMcpTextInput({
        text: finalText,
        conversationId: activeHandsFreeConversationIdRef.current ?? conversationId,
        sessionId,
        fromTile: true,
        startSnoozed: false,
      })

      const nextConversationId = result?.conversationId
        ?? activeHandsFreeConversationIdRef.current
        ?? conversationId
        ?? null
      activeHandsFreeConversationIdRef.current = nextConversationId
      setActiveHandsFreeConversationId(nextConversationId)

      await invalidateConversationQueries(nextConversationId ?? undefined)
      onSubmitted?.()
      setStatusMessage(result?.queued ? "Queued. Listening for more." : "Agent started.")
    } catch (error) {
      const message = getErrorMessage(error, "Failed to start voice session.")
      setStatusMessage(message)
      setHandsFreeStateValue((prev) => ({
        ...prev,
        phase: "error",
        resumePhase: getHandsFreeResumablePhase(prev.phase, prev.resumePhase),
        lastError: message,
        recognizerErrorCount: prev.recognizerErrorCount + 1,
      }))
      toast.error(message)
    } finally {
      if (canUpdateDialogState()) {
        setIsSubmitting(false)
      }
    }
  }

  const handleHandsFreeRecordEnd = async (recorder: Recorder, blob: Blob, duration: number) => {
    if (!canHandleRecorderCallback(recorder, true)) return

    setRecordingValue(false)
    setVisualizerData(INITIAL_VISUALIZER_DATA)
    if (handsFreeFinalizeTimerRef.current) {
      clearTimeout(handsFreeFinalizeTimerRef.current)
      handsFreeFinalizeTimerRef.current = null
    }
    if (handsFreeNoSpeechTimerRef.current) {
      clearTimeout(handsFreeNoSpeechTimerRef.current)
      handsFreeNoSpeechTimerRef.current = null
    }

    const shouldProcessSegment = handsFreeFinalizingRef.current
    const hadSpeech = handsFreeSegmentHadSpeechRef.current
    handsFreeFinalizingRef.current = false
    handsFreeSegmentHadSpeechRef.current = false

    if (!shouldProcessSegment) return
    if (!hadSpeech || blob.size === 0 || duration < MIN_HANDS_FREE_SEGMENT_MS) {
      setStatusMessage("Listening...")
      scheduleHandsFreeRestart()
      return
    }

    try {
      setStatusMessage("Transcribing speech...")
      const runtimeConfig = voiceRuntimeConfigRef.current
      const pcmRecording = runtimeConfig?.sttProviderId === "parakeet"
        ? await decodeBlobToPcm(blob)
        : undefined
      const result = await tipcClient.transcribeChunk({
        recording: await blob.arrayBuffer(),
        pcmRecording,
      })
      const transcript = normalizeTranscriptPreview(result?.text)
      setLiveTranscript("")
      setLastCapturedTranscript(transcript)

      if (!transcript) {
        setStatusMessage("Listening...")
        scheduleHandsFreeRestart()
        return
      }

      const config = voiceRuntimeConfigRef.current
      if (!config) {
        setStatusMessage("Voice configuration unavailable.")
        scheduleHandsFreeRestart()
        return
      }

      const resolved = resolveHandsFreeUtterance({
        state: handsFreeStateRef.current,
        transcript,
        wakePhrase: config.handsFreeWakePhrase,
        sleepPhrase: config.handsFreeSleepPhrase,
        now: Date.now(),
      })
      setHandsFreeStateValue(resolved.nextState)

      if (resolved.matchedSleep) {
        setStatusMessage("Sleeping.")
      } else if (resolved.action.type === "send") {
        await submitHandsFreeText(resolved.action.text)
      } else if (resolved.matchedWake) {
        setStatusMessage("Awake.")
        void playSound("begin_record")
      } else {
        setStatusMessage("Listening...")
      }
    } catch (error) {
      const message = getErrorMessage(error, "Failed to process hands-free speech.")
      setStatusMessage(message)
      setHandsFreeStateValue((prev) => ({
        ...prev,
        phase: "error",
        resumePhase: getHandsFreeResumablePhase(prev.phase, prev.resumePhase),
        lastError: message,
        recognizerErrorCount: prev.recognizerErrorCount + 1,
      }))
      toast.error(message)
    } finally {
      if (shouldKeepHandsFreeRecorderActive()) {
        scheduleHandsFreeRestart()
      }
    }
  }

  const startVoiceRecording = async () => {
    if (!canUpdateDialogState()) return

    clearHandsFreeTimers()
    stopRecorder()
    shouldSubmitVoiceRef.current = false
    handsFreeFinalizingRef.current = false
    handsFreeSegmentHadSpeechRef.current = false
    setStatusMessage(null)
    setVisualizerData(INITIAL_VISUALIZER_DATA)

    let config: any = null
    try {
      config = await tipcClient.getConfig()
    } catch {
      config = null
    }
    if (!canUpdateDialogState()) return

    const handsFreeConfig = normalizeHandsFreeConfig(config ?? {})
    const runtimeConfig: VoiceRuntimeConfig = {
      ...handsFreeConfig,
      audioInputDeviceId: config?.audioInputDeviceId,
      sttProviderId: config?.sttProviderId,
    }
    voiceRuntimeConfigRef.current = runtimeConfig
    setVoiceRuntimeConfig(runtimeConfig)
    const nextMode: VoiceRuntimeMode = runtimeConfig.handsFree ? "hands-free" : "standard"
    setVoiceRuntimeModeValue(nextMode)

    if (nextMode === "hands-free") {
      setHandsFreeStateValue((prev) => {
        if (prev.phase !== "sleeping" || prev.awakeSince || prev.pauseReason) return prev
        return createInitialHandsFreeState()
      })
    }

    const recorder = new Recorder()
    recorderRef.current = recorder

    recorder.on("visualizer-data", (rms) => {
      if (!canHandleRecorderCallback(recorder)) return
      setVisualizerData((prev) => [...prev.slice(-(VISUALIZER_BAR_COUNT - 1)), rms])
      handleHandsFreeVoiceActivity(rms)
    })

    recorder.on("record-end", (blob, duration) => {
      void (async () => {
        if (!canHandleRecorderCallback(recorder, true)) return

        if (voiceRuntimeModeRef.current === "hands-free") {
          await handleHandsFreeRecordEnd(recorder, blob, duration)
          return
        }

        setRecordingValue(false)
        setVisualizerData(INITIAL_VISUALIZER_DATA)

        if (!shouldSubmitVoiceRef.current) {
          return
        }

        if (blob.size === 0 || duration < MIN_STANDARD_RECORDING_MS) {
          if (!canHandleRecorderCallback(recorder, true)) return
          setIsSubmitting(false)
          setStatusMessage("Recording too short. Try again.")
          toast.error("Recording too short. Try again.")
          if (canUpdateDialogState()) {
            await startVoiceRecording()
          }
          return
        }

        try {
          playSound("end_record")
          if (!canHandleRecorderCallback(recorder, true)) return
          setStatusMessage("Starting session…")
          const config = await tipcClient.getConfig()
          const pcmRecording = config?.sttProviderId === "parakeet"
            ? await decodeBlobToPcm(blob)
            : undefined

          // Match handleTextSubmit: keep the session foreground/audible for
          // TTS autoplay while still suppressing hover-panel auto-show.
          await tipcClient.createMcpRecording({
            recording: await blob.arrayBuffer(),
            pcmRecording,
            duration,
            conversationId,
            sessionId,
            fromTile: true,
            startSnoozed: false,
          })

          await invalidateConversationQueries(conversationId)
          onSubmitted?.()
          if (canUpdateDialogState()) {
            closeDialog()
          }
        } catch (error) {
          if (!canUpdateDialogState()) return
          setStatusMessage(getErrorMessage(error, "Failed to start voice session."))
          toast.error(getErrorMessage(error, "Failed to start voice session."))
          await startVoiceRecording()
        } finally {
          if (canUpdateDialogState()) {
            setIsSubmitting(false)
          }
        }
      })()
    })

    try {
      if (!canUpdateDialogState()) return
      setRecordingValue(true)
      if (nextMode === "hands-free") {
        setStatusMessage("Listening...")
      }
      await recorder.startRecording(runtimeConfig.audioInputDeviceId)
      if (nextMode === "hands-free") {
        scheduleHandsFreeNoSpeechTimeout()
      }
    } catch (error) {
      stopRecorder()
      if (!canUpdateDialogState()) return
      setRecordingValue(false)
      const message = getErrorMessage(error, "Failed to access the microphone.")
      setStatusMessage(message)
      toast.error(message)
      closeDialog()
    }
  }

  const pauseHandsFreeByUser = () => {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: "paused",
      pauseReason: "user",
      resumePhase: getHandsFreeResumablePhase(prev.phase, prev.resumePhase),
    }))
    handsFreeFinalizingRef.current = false
    handsFreeSegmentHadSpeechRef.current = false
    clearHandsFreeTimers()
    stopRecorder()
    setRecordingValue(false)
    setStatusMessage("Paused.")
  }

  const resumeHandsFreeByUser = () => {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: prev.resumePhase ?? (prev.awakeSince ? "listening" : "sleeping"),
      pauseReason: null,
      resumePhase: null,
      lastError: null,
      recognizerErrorCount: 0,
    }))
    setStatusMessage("Listening...")
    if (!recordingRef.current) {
      scheduleHandsFreeRestart(0)
    }
  }

  const wakeHandsFreeByUser = () => {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: "listening",
      pauseReason: null,
      resumePhase: null,
      awakeSince: Date.now(),
      lastError: null,
      recognizerErrorCount: 0,
    }))
    setStatusMessage("Awake.")
    if (!recordingRef.current) {
      scheduleHandsFreeRestart(0)
    }
  }

  const sleepHandsFreeByUser = () => {
    setHandsFreeStateValue((prev) => transitionHandsFreeToSleeping(prev))
    setStatusMessage("Sleeping.")
    if (!recordingRef.current) {
      scheduleHandsFreeRestart(0)
    }
  }

  const resetHandsFreeError = () => {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: prev.resumePhase ?? (prev.awakeSince ? "listening" : "sleeping"),
      pauseReason: null,
      resumePhase: null,
      lastError: null,
      recognizerErrorCount: 0,
    }))
    setStatusMessage("Listening...")
    if (!recordingRef.current) {
      scheduleHandsFreeRestart(0)
    }
  }

  const handleHandsFreePrimaryControl = () => {
    switch (handsFreeState.phase) {
      case "sleeping":
        wakeHandsFreeByUser()
        return
      case "paused":
        resumeHandsFreeByUser()
        return
      case "error":
        resetHandsFreeError()
        return
      default:
        pauseHandsFreeByUser()
    }
  }

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    isClosedRef.current = !open

    if (!open || mode !== "voice") {
      resetVoiceRuntimeState()
      stopRecorder()
      return undefined
    }

    void startVoiceRecording()

    return () => {
      shouldSubmitVoiceRef.current = false
      handsFreeFinalizingRef.current = false
      clearHandsFreeTimers()
      stopRecorder()
    }
  }, [open, mode])

  useEffect(() => {
    if (!open || mode !== "voice" || voiceRuntimeMode !== "standard" || !recording || isSubmitting) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === "Enter" || event.code === "NumpadEnter") && !event.shiftKey) {
        event.preventDefault()
        shouldSubmitVoiceRef.current = true
        setIsSubmitting(true)
        setStatusMessage("Finalizing recording…")
        stopRecorder()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, mode, voiceRuntimeMode, recording, isSubmitting])

  useEffect(() => {
    if (!open || mode !== "voice" || voiceRuntimeMode !== "hands-free") return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented
        || event.metaKey
        || event.ctrlKey
        || event.altKey
        || event.shiftKey
        || isEditableKeyboardTarget(event.target)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === "v") {
        event.preventDefault()
        event.stopPropagation()
        handleHandsFreePrimaryControl()
        return
      }

      if (key === "s") {
        if (handsFreeState.phase === "sleeping" || isSubmitting) return
        event.preventDefault()
        event.stopPropagation()
        sleepHandsFreeByUser()
        return
      }

      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault()
        event.stopPropagation()
        handsFreeFinalizingRef.current = false
        clearHandsFreeTimers()
        stopRecorder()
        closeDialog()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handsFreeState.phase, isSubmitting, mode, open, voiceRuntimeMode])

  useEffect(() => {
    activeHandsFreeConversationIdRef.current = activeHandsFreeConversationId
  }, [activeHandsFreeConversationId])

  useEffect(() => {
    if (!conversationId) return
    activeHandsFreeConversationIdRef.current = conversationId
    setActiveHandsFreeConversationId(conversationId)
  }, [conversationId])

  useEffect(() => {
    if (!open || mode !== "voice") return undefined

    const unlistenProgress = rendererHandlers.agentProgressUpdate.listen((update) => {
      const targetConversationId = activeHandsFreeConversationIdRef.current
      if (
        voiceRuntimeModeRef.current !== "hands-free"
        || !targetConversationId
        || update.conversationId !== targetConversationId
      ) {
        return
      }

      setHandsFreeStateValue((prev) => {
        if (prev.pauseReason === "user" || prev.phase === "paused" || prev.phase === "error" || prev.phase === "sleeping") {
          return prev
        }

        if (update.isComplete) {
          return {
            ...prev,
            phase: prev.phase === "speaking" ? "speaking" : "listening",
            resumePhase: prev.phase === "speaking" ? "listening" : null,
            lastError: null,
          }
        }

        if (prev.phase === "speaking") {
          return { ...prev, resumePhase: "processing" }
        }

        return {
          ...prev,
          phase: "processing",
          resumePhase: "listening",
          awakeSince: prev.awakeSince ?? Date.now(),
          lastError: null,
        }
      })
    })

    const unlistenTts = rendererHandlers.ttsPlaybackStateChanged.listen((state) => {
      if (voiceRuntimeModeRef.current !== "hands-free") return
      if (state.status === "loading" || state.status === "playing") {
        setHandsFreeStateValue((prev) => {
          if (prev.pauseReason === "user" || prev.phase === "paused" || prev.phase === "error" || prev.phase === "sleeping") {
            return prev
          }
          return {
            ...prev,
            phase: "speaking",
            resumePhase: getHandsFreeResumablePhase(prev.phase, prev.resumePhase),
          }
        })
        return
      }

      if (state.status === "ended" || state.status === "idle" || state.status === "error") {
        setHandsFreeStateValue((prev) => {
          if (prev.phase !== "speaking") return prev
          return {
            ...prev,
            phase: prev.resumePhase ?? (prev.awakeSince ? "listening" : "sleeping"),
            resumePhase: null,
          }
        })
      }
    })

    return () => {
      unlistenProgress()
      unlistenTts()
    }
  }, [open, mode])

  const isHandsFreeMode = mode === "voice" && voiceRuntimeMode === "hands-free"
  const handsFreeTone = getHandsFreeTone(handsFreeState.phase)
  const handsFreeStatusLabel = getHandsFreeStatusLabel(handsFreeState.phase)
  const handsFreeSubtitle = getHandsFreeSubtitle(
    handsFreeState.phase,
    voiceRuntimeConfig,
    handsFreeState.lastError,
  )
  const handsFreePrimaryControlLabel = getPrimaryControlLabel(handsFreeState.phase)
  const standardVoiceTone: HandsFreeTone = isSubmitting
    ? "busy"
    : recording
      ? "active"
      : "muted"

  const title = mode === "voice"
    ? isHandsFreeMode
      ? (conversationId ? "Continue hands-free" : "Hands-free voice")
      : (conversationId ? "Continue with voice" : "Start with voice")
    : (conversationId ? "Continue with text" : "Start with text")

  const description = mode === "voice"
    ? isHandsFreeMode
      ? "Hands-free mode"
      : "Voice capture"
    : "Compose your message inside the main app window without opening the hover panel."

  const voiceBars = useMemo(() => visualizerData.slice(-VISUALIZER_BAR_COUNT), [visualizerData])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        shouldSubmitVoiceRef.current = false
        handsFreeFinalizingRef.current = false
        clearHandsFreeTimers()
        stopRecorder()
      }
      onOpenChange(nextOpen)
    }}>
      <DialogContent
        className={cn(
          "flex max-h-[calc(100vh-48px)] flex-col sm:max-w-2xl",
          mode === "text" && "h-[560px]",
          mode === "voice" && (isHandsFreeMode ? "sm:max-w-2xl" : "sm:max-w-xl"),
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === "text" ? (
          <div className="flex min-h-0 flex-1">
            <TextInputPanel
              onSubmit={handleTextSubmit}
              selectedAgentId={selectedAgentId}
              onSelectAgent={onSelectAgent}
              onCancel={closeDialog}
              isProcessing={isSubmitting}
              initialText={initialText}
              continueConversationTitle={continueConversationTitle}
              showAgentSelector={false}
            />
          </div>
        ) : isHandsFreeMode ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
              {agentName && !continueConversationTitle && (
                <div className="inline-flex min-w-0 items-center gap-1 rounded border bg-primary/10 px-2 py-1 text-primary">
                  <Bot className="h-3 w-3 shrink-0" />
                  <span className="truncate font-medium">{agentName}</span>
                </div>
              )}
              {continueConversationTitle && (
                <div className="inline-flex min-w-0 max-w-full items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-blue-700 dark:text-blue-300">
                  <span className="shrink-0 opacity-70">Continuing</span>
                  <span className="truncate font-medium">{continueConversationTitle}</span>
                </div>
              )}
              {activeHandsFreeConversationId && (
                <div className="inline-flex min-w-0 items-center gap-1 rounded border bg-muted/40 px-2 py-1 text-muted-foreground">
                  <Radio className="h-3 w-3 shrink-0" />
                  <span className="truncate">Session linked</span>
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className={cn("rounded-lg border p-4", getToneClasses(handsFreeTone))}>
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", getToneDotClasses(handsFreeTone), recording && "animate-pulse")} />
                      <div className="truncate text-sm font-semibold">{handsFreeStatusLabel}</div>
                    </div>
                    {handsFreeSubtitle && (
                      <div className="mt-1 truncate text-xs opacity-80">{handsFreeSubtitle}</div>
                    )}
                  </div>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : handsFreeState.phase === "speaking" ? (
                    <Volume2 className="h-4 w-4 shrink-0" />
                  ) : handsFreeState.phase === "sleeping" ? (
                    <Moon className="h-4 w-4 shrink-0" />
                  ) : (
                    <Ear className="h-4 w-4 shrink-0" />
                  )}
                </div>

                <VoiceBars values={voiceBars} tone={handsFreeTone} />

                <div className="mt-3 grid gap-2 text-xs">
                  <div className="min-h-[2rem] border-t border-current/15 pt-2">
                    <div className="mb-0.5 font-medium text-muted-foreground">Last heard</div>
                    <div className="line-clamp-2 text-foreground">
                      {liveTranscript || lastCapturedTranscript || "No speech captured yet."}
                    </div>
                  </div>
                  <div className="min-h-[2rem] border-t border-current/15 pt-2">
                    <div className="mb-0.5 font-medium text-muted-foreground">Last agent request</div>
                    <div className="line-clamp-2 text-foreground">
                      {lastSubmittedText || "Nothing sent from this voice session yet."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                    handsFreeState.phase === "error"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : handsFreeState.phase === "paused"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : handsFreeState.phase === "sleeping"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border bg-background hover:bg-accent",
                  )}
                  onClick={handleHandsFreePrimaryControl}
                  disabled={isSubmitting && handsFreeState.phase !== "error"}
                  title={`${handsFreePrimaryControlLabel} hands-free voice (V)`}
                  aria-label={`${handsFreePrimaryControlLabel} hands-free voice`}
                  aria-keyshortcuts="V"
                >
                  {handsFreeState.phase === "error" ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : handsFreeState.phase === "paused" || handsFreeState.phase === "sleeping" ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  <span>
                    {handsFreePrimaryControlLabel}
                  </span>
                </button>

                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
                  onClick={sleepHandsFreeByUser}
                  disabled={handsFreeState.phase === "sleeping" || isSubmitting}
                  title="Sleep hands-free voice (S)"
                  aria-keyshortcuts="S"
                >
                  <Moon className="h-4 w-4" />
                  <span>Sleep</span>
                </button>

                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
                  onClick={() => {
                    handsFreeFinalizingRef.current = false
                    clearHandsFreeTimers()
                    stopRecorder()
                    closeDialog()
                  }}
                  disabled={isSubmitting}
                  title="Close voice (Esc)"
                  aria-keyshortcuts="Escape"
                >
                  <Square className="h-4 w-4" />
                  <span>Close voice</span>
                </button>

                <div className="rounded-md border bg-background/50 p-2" aria-label="Voice hotkeys">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    Hotkeys
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <VoiceHotkeyHint
                      keys="V"
                      label={handsFreePrimaryControlLabel}
                      disabled={isSubmitting && handsFreeState.phase !== "error"}
                    />
                    <VoiceHotkeyHint
                      keys="S"
                      label="Sleep"
                      disabled={handsFreeState.phase === "sleeping" || isSubmitting}
                    />
                    <VoiceHotkeyHint keys="Esc" label="Close" disabled={isSubmitting} />
                  </div>
                </div>

                <div className="mt-auto border-t pt-3 text-xs">
                  <div className="font-medium text-muted-foreground">Runtime</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Mic</span>
                    <span className={cn("font-medium", recording ? "text-sky-600 dark:text-sky-300" : "text-muted-foreground")}>
                      {recording ? "Armed" : "Idle"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Silence</span>
                    <span className="font-medium text-foreground">
                      {voiceRuntimeConfig ? `${voiceRuntimeConfig.handsFreeMessageDebounceMs}ms` : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {statusMessage && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground" aria-live="polite">
                {statusMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
              {agentName && !continueConversationTitle && (
                <div className="inline-flex min-w-0 items-center gap-1 rounded border bg-primary/10 px-2 py-1 text-primary">
                  <Bot className="h-3 w-3 shrink-0" />
                  <span className="truncate font-medium">{agentName}</span>
                </div>
              )}
              {continueConversationTitle && (
                <div className="inline-flex min-w-0 max-w-full items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-blue-700 dark:text-blue-300">
                  <span className="shrink-0 opacity-70">Continuing</span>
                  <span className="truncate font-medium">{continueConversationTitle}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex min-h-[150px] flex-col justify-center gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className={cn("h-2.5 w-2.5 rounded-full", getToneDotClasses(standardVoiceTone), recording && "animate-pulse")} />
                      <span>{isSubmitting ? "Starting agent" : recording ? "Recording voice" : "Preparing microphone"}</span>
                    </div>
                    {statusMessage && (
                      <div className="mt-1 truncate text-xs text-muted-foreground" aria-live="polite">
                        {statusMessage}
                      </div>
                    )}
                  </div>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Mic className={cn("h-4 w-4 shrink-0 text-primary", recording && "animate-pulse")} />
                  )}
                </div>

                <VoiceBars values={voiceBars} tone={standardVoiceTone} compact />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className="flex min-w-0 flex-wrap items-center gap-1.5"
                aria-label="Voice hotkeys"
              >
                <span className="mr-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  Hotkeys
                </span>
                <VoiceHotkeyHint keys="Enter" label="Run" disabled={!recording || isSubmitting} />
                <VoiceHotkeyHint keys="Esc" label="Cancel" disabled={isSubmitting} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={closeDialog}
                  title="Cancel voice recording (Esc)"
                  aria-keyshortcuts="Escape"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  disabled={!recording || isSubmitting}
                  onClick={() => {
                    shouldSubmitVoiceRef.current = true
                    setIsSubmitting(true)
                    setStatusMessage("Finalizing recording…")
                    stopRecorder()
                  }}
                  title="Run recording (Enter)"
                  aria-keyshortcuts="Enter"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Run recording</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
