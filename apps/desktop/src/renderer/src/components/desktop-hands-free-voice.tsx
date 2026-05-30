import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Ear,
  Loader2,
  Mic,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Target,
  X,
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
import { Recorder } from "@renderer/lib/recorder"
import { decodeBlobToPcm } from "@renderer/lib/audio-utils"
import { queryClient } from "@renderer/lib/queries"
import { playSound } from "@renderer/lib/sound"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"

const VISUALIZER_BAR_COUNT = 34
const INITIAL_VISUALIZER_DATA = Array<number>(VISUALIZER_BAR_COUNT).fill(0.01)
const SPEECH_RMS_THRESHOLD = 0.075
const MIN_SEGMENT_MS = 450
const RESTART_DELAY_MS = 180
const NO_SPEECH_TIMEOUT_MS = 15_000

type VoiceRuntimeConfig = Required<HandsFreeConfig> & {
  audioInputDeviceId?: string
  sttProviderId?: string
}

type HandsFreeTone = "muted" | "ready" | "active" | "busy" | "speaking" | "danger"

type VoiceTarget = {
  conversationId?: string
  sessionId?: string
  title?: string | null
  agentName?: string | null
}

type DesktopHandsFreeVoiceProps = {
  open: boolean
  conversationId?: string
  sessionId?: string
  continueConversationTitle?: string | null
  agentName?: string | null
  focusedConversationId?: string
  focusedSessionId?: string | null
  focusedConversationTitle?: string | null
  focusedAgentName?: string | null
  followFocusedTarget?: boolean
  onClose: () => void
  onFocusTarget?: (target: VoiceTarget) => void
  onStartNewSession?: () => void
  onSubmitted?: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
}

function normalizeTranscriptPreview(text?: string | null) {
  return (text || "").replace(/\s+/g, " ").trim()
}

function getPhaseTone(phase: HandsFreePhase): HandsFreeTone {
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
      return "border-border bg-background text-muted-foreground"
  }
}

function getDotClasses(tone: HandsFreeTone) {
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

function getPhaseDetail(
  phase: HandsFreePhase,
  config: VoiceRuntimeConfig | null,
  lastError: string | null,
) {
  switch (phase) {
    case "sleeping":
      return config ? `Say "${config.handsFreeWakePhrase}"` : "Waiting for wake phrase"
    case "waking":
      return "Awake"
    case "listening":
      return config ? `Sleep: "${config.handsFreeSleepPhrase}"` : "Listening"
    case "processing":
      return "Agent running"
    case "speaking":
      return "Assistant speaking"
    case "paused":
      return "Paused"
    case "error":
      return lastError || "Voice error"
    default:
      return "Listening"
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

function VoiceBars({ values, tone }: { values: number[]; tone: HandsFreeTone }) {
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
    <div className="flex h-7 w-28 items-center justify-center gap-0.5 overflow-hidden rounded border bg-background/80 px-2 py-1" aria-hidden="true">
      {values.map((value, index) => (
        <div
          key={index}
          className={cn("w-0.5 shrink-0 rounded-full transition-all duration-150", barClass)}
          style={{ height: `${Math.max(14, Math.min(100, value * 100))}%` }}
        />
      ))}
    </div>
  )
}

export function DesktopHandsFreeVoice({
  open,
  conversationId,
  sessionId,
  continueConversationTitle,
  agentName,
  focusedConversationId,
  focusedSessionId,
  focusedConversationTitle,
  focusedAgentName,
  followFocusedTarget = false,
  onClose,
  onFocusTarget,
  onStartNewSession,
  onSubmitted,
}: DesktopHandsFreeVoiceProps) {
  const [recording, setRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [runtimeConfig, setRuntimeConfig] = useState<VoiceRuntimeConfig | null>(null)
  const [handsFreeState, setHandsFreeState] = useState<HandsFreeControllerState>(createInitialHandsFreeState)
  const [visualizerData, setVisualizerData] = useState<number[]>(INITIAL_VISUALIZER_DATA)
  const [lastCapturedTranscript, setLastCapturedTranscript] = useState("")
  const [lastSubmittedText, setLastSubmittedText] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId ?? null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId ?? null)
  const [forceNewSessionTarget, setForceNewSessionTarget] = useState(false)

  const mountedRef = useRef(false)
  const openRef = useRef(open)
  const recorderRef = useRef<Recorder | null>(null)
  const recordingRef = useRef(false)
  const stateRef = useRef<HandsFreeControllerState>(createInitialHandsFreeState())
  const configRef = useRef<VoiceRuntimeConfig | null>(null)
  const finalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hadSpeechRef = useRef(false)
  const finalizingRef = useRef(false)
  const targetRef = useRef<{
    conversationId?: string
    sessionId?: string | null
    title?: string | null
    agentName?: string | null
    followFocusedTarget: boolean
  }>({
    conversationId,
    sessionId,
    title: continueConversationTitle,
    agentName,
    followFocusedTarget,
  })

  targetRef.current = forceNewSessionTarget
    ? {
        conversationId: activeConversationId ?? undefined,
        sessionId: activeSessionId,
        title: activeConversationId ? "New voice session" : null,
        agentName,
        followFocusedTarget: false,
      }
    : followFocusedTarget
      ? {
          conversationId: focusedConversationId,
          sessionId: focusedSessionId,
          title: focusedConversationTitle,
          agentName: focusedAgentName,
          followFocusedTarget,
        }
      : {
          conversationId,
          sessionId,
          title: continueConversationTitle,
          agentName,
          followFocusedTarget,
        }

  const voiceBars = useMemo(() => visualizerData.slice(-VISUALIZER_BAR_COUNT), [visualizerData])
  const tone = getPhaseTone(handsFreeState.phase)
  const phaseLabel = getHandsFreeStatusLabel(handsFreeState.phase)
  const phaseDetail = getPhaseDetail(handsFreeState.phase, runtimeConfig, handsFreeState.lastError)

  const currentTarget = getCurrentTarget()
  const targetTitle = currentTarget.title?.trim()
    || (forceNewSessionTarget ? "New voice session" : "Focused agent")
  const targetSubtitle = forceNewSessionTarget
    ? (currentTarget.conversationId ? "Voice session" : "New session")
    : currentTarget.conversationId ? "Focused session" : "New session"
  const canFocusCurrentTarget = Boolean(currentTarget.conversationId || currentTarget.sessionId)
  const primaryControlLabel = getPrimaryControlLabel(handsFreeState.phase)

  function canUpdate() {
    return mountedRef.current && openRef.current
  }

  function setRecordingValue(nextRecording: boolean) {
    recordingRef.current = nextRecording
    setRecording(nextRecording)
  }

  function setHandsFreeStateValue(
    nextStateOrUpdater:
      | HandsFreeControllerState
      | ((prev: HandsFreeControllerState) => HandsFreeControllerState),
  ) {
    const previousState = stateRef.current
    const nextState = typeof nextStateOrUpdater === "function"
      ? nextStateOrUpdater(previousState)
      : nextStateOrUpdater
    stateRef.current = nextState
    setHandsFreeState(nextState)
  }

  function clearTimers() {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current)
      finalizeTimerRef.current = null
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current)
      noSpeechTimerRef.current = null
    }
  }

  function stopRecorder() {
    recorderRef.current?.stopRecording()
    recorderRef.current = null
  }

  function resetRuntimeState() {
    clearTimers()
    finalizingRef.current = false
    hadSpeechRef.current = false
    stopRecorder()
    setRecordingValue(false)
    setIsSubmitting(false)
    setStatusMessage(null)
    setVisualizerData(INITIAL_VISUALIZER_DATA)
    setLastCapturedTranscript("")
    setLastSubmittedText("")
    setActiveConversationId(conversationId ?? null)
    setActiveSessionId(sessionId ?? null)
    setForceNewSessionTarget(false)
    setHandsFreeStateValue(createInitialHandsFreeState())
  }

  function getCurrentTarget(): VoiceTarget {
    const target = targetRef.current
    if (target.followFocusedTarget) {
      return {
        conversationId: target.conversationId ?? activeConversationId ?? undefined,
        sessionId: target.sessionId ?? activeSessionId ?? undefined,
        title: target.title ?? continueConversationTitle ?? undefined,
        agentName: target.agentName ?? undefined,
      }
    }

    return {
      conversationId: target.conversationId ?? activeConversationId ?? undefined,
      sessionId: target.sessionId ?? activeSessionId ?? undefined,
      title: target.title ?? continueConversationTitle ?? undefined,
      agentName: target.agentName ?? undefined,
    }
  }

  function shouldKeepRecorderActive() {
    const state = stateRef.current
    return canUpdate()
      && configRef.current?.handsFree === true
      && state.pauseReason !== "user"
      && state.phase !== "paused"
      && state.phase !== "error"
  }

  function scheduleRestart(delayMs = RESTART_DELAY_MS) {
    if (!shouldKeepRecorderActive()) return
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
    }
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null
      if (shouldKeepRecorderActive()) {
        void startRecording()
      }
    }, delayMs)
  }

  function scheduleNoSpeechTimeout() {
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current)
    }
    noSpeechTimerRef.current = setTimeout(() => {
      noSpeechTimerRef.current = null
      if (!recordingRef.current || hadSpeechRef.current || finalizingRef.current) return
      finalizingRef.current = true
      stopRecorder()
    }, NO_SPEECH_TIMEOUT_MS)
  }

  function finalizeSegment() {
    if (!recordingRef.current || finalizingRef.current) return
    finalizingRef.current = true
    setStatusMessage("Finalizing speech")
    stopRecorder()
  }

  function scheduleFinalization() {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current)
    }
    const debounceMs = Math.max(0, configRef.current?.handsFreeMessageDebounceMs ?? 1500)
    finalizeTimerRef.current = setTimeout(() => {
      finalizeTimerRef.current = null
      finalizeSegment()
    }, debounceMs)
  }

  function handleVoiceActivity(rms: number) {
    if (finalizingRef.current || rms < SPEECH_RMS_THRESHOLD) return

    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current)
      noSpeechTimerRef.current = null
    }
    hadSpeechRef.current = true
    scheduleFinalization()
  }

  async function invalidateConversationQueries(targetConversationId?: string | null) {
    if (targetConversationId) {
      await queryClient.invalidateQueries({ queryKey: ["conversation", targetConversationId] })
    }
    await queryClient.invalidateQueries({ queryKey: ["conversation-history"] })
  }

  async function submitHandsFreeText(text: string) {
    const finalText = normalizeTranscriptPreview(text)
    if (!finalText) return

    const target = getCurrentTarget()
    setLastSubmittedText(finalText)
    setStatusMessage("Starting agent")
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
        conversationId: target.conversationId,
        sessionId: target.sessionId,
        fromTile: true,
        startSnoozed: false,
      })

      const nextConversationId = result?.conversationId ?? target.conversationId ?? null
      setActiveConversationId(nextConversationId)
      if (target.sessionId) {
        setActiveSessionId(target.sessionId)
      }
      await invalidateConversationQueries(nextConversationId)
      onSubmitted?.()
      setStatusMessage(result?.queued ? "Queued for focused agent" : "Agent started")
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
      if (canUpdate()) {
        setIsSubmitting(false)
      }
    }
  }

  async function handleRecordEnd(recorder: Recorder, blob: Blob, duration: number) {
    if (!canUpdate() || recorderRef.current !== null) return

    setRecordingValue(false)
    setVisualizerData(INITIAL_VISUALIZER_DATA)
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current)
      finalizeTimerRef.current = null
    }
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current)
      noSpeechTimerRef.current = null
    }

    const shouldProcessSegment = finalizingRef.current
    const hadSpeech = hadSpeechRef.current
    finalizingRef.current = false
    hadSpeechRef.current = false

    if (!shouldProcessSegment) return
    if (!hadSpeech || blob.size === 0 || duration < MIN_SEGMENT_MS) {
      setStatusMessage("Listening")
      scheduleRestart()
      return
    }

    try {
      setStatusMessage("Transcribing")
      const config = configRef.current
      const pcmRecording = config?.sttProviderId === "parakeet"
        ? await decodeBlobToPcm(blob)
        : undefined
      const result = await tipcClient.transcribeChunk({
        recording: await blob.arrayBuffer(),
        pcmRecording,
      })
      const transcript = normalizeTranscriptPreview(result?.text)
      setLastCapturedTranscript(transcript)

      if (!transcript || !config) {
        setStatusMessage("Listening")
        scheduleRestart()
        return
      }

      const resolved = resolveHandsFreeUtterance({
        state: stateRef.current,
        transcript,
        wakePhrase: config.handsFreeWakePhrase,
        sleepPhrase: config.handsFreeSleepPhrase,
        now: Date.now(),
      })
      setHandsFreeStateValue(resolved.nextState)

      if (resolved.matchedSleep) {
        setStatusMessage("Sleeping")
      } else if (resolved.action.type === "send") {
        await submitHandsFreeText(resolved.action.text)
      } else if (resolved.matchedWake) {
        setStatusMessage("Awake")
        void playSound("begin_record")
      } else {
        setStatusMessage("Listening")
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
      if (shouldKeepRecorderActive()) {
        scheduleRestart()
      }
    }
  }

  async function startRecording() {
    if (!canUpdate()) return

    clearTimers()
    stopRecorder()
    finalizingRef.current = false
    hadSpeechRef.current = false
    setStatusMessage(null)
    setVisualizerData(INITIAL_VISUALIZER_DATA)

    let config: any = null
    try {
      config = await tipcClient.getConfig()
    } catch {
      config = null
    }
    if (!canUpdate()) return

    const nextRuntimeConfig: VoiceRuntimeConfig = {
      ...normalizeHandsFreeConfig(config ?? {}),
      audioInputDeviceId: config?.audioInputDeviceId,
      sttProviderId: config?.sttProviderId,
    }
    configRef.current = nextRuntimeConfig
    setRuntimeConfig(nextRuntimeConfig)

    const recorder = new Recorder()
    recorderRef.current = recorder

    recorder.on("visualizer-data", (rms) => {
      if (!canUpdate() || recorderRef.current !== recorder) return
      setVisualizerData((prev) => [...prev.slice(-(VISUALIZER_BAR_COUNT - 1)), rms])
      handleVoiceActivity(rms)
    })

    recorder.on("record-end", (blob, duration) => {
      void handleRecordEnd(recorder, blob, duration)
    })

    try {
      setRecordingValue(true)
      setStatusMessage("Listening")
      await recorder.startRecording(nextRuntimeConfig.audioInputDeviceId)
      scheduleNoSpeechTimeout()
    } catch (error) {
      stopRecorder()
      if (!canUpdate()) return
      setRecordingValue(false)
      const message = getErrorMessage(error, "Failed to access the microphone.")
      setStatusMessage(message)
      setHandsFreeStateValue((prev) => ({
        ...prev,
        phase: "error",
        resumePhase: getHandsFreeResumablePhase(prev.phase, prev.resumePhase),
        lastError: message,
      }))
      toast.error(message)
    }
  }

  function pauseByUser() {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: "paused",
      pauseReason: "user",
      resumePhase: getHandsFreeResumablePhase(prev.phase, prev.resumePhase),
    }))
    clearTimers()
    finalizingRef.current = false
    hadSpeechRef.current = false
    stopRecorder()
    setRecordingValue(false)
    setStatusMessage("Paused")
  }

  function resumeByUser() {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: prev.resumePhase ?? (prev.awakeSince ? "listening" : "sleeping"),
      pauseReason: null,
      resumePhase: null,
      lastError: null,
      recognizerErrorCount: 0,
    }))
    setStatusMessage("Listening")
    if (!recordingRef.current) {
      scheduleRestart(0)
    }
  }

  function wakeByUser() {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: "listening",
      pauseReason: null,
      resumePhase: null,
      awakeSince: Date.now(),
      lastError: null,
      recognizerErrorCount: 0,
    }))
    setStatusMessage("Awake")
    if (!recordingRef.current) {
      scheduleRestart(0)
    }
  }

  function sleepByUser() {
    setHandsFreeStateValue((prev) => transitionHandsFreeToSleeping(prev))
    setStatusMessage("Sleeping")
    if (!recordingRef.current) {
      scheduleRestart(0)
    }
  }

  function resetError() {
    setHandsFreeStateValue((prev) => ({
      ...prev,
      phase: prev.resumePhase ?? (prev.awakeSince ? "listening" : "sleeping"),
      pauseReason: null,
      resumePhase: null,
      lastError: null,
      recognizerErrorCount: 0,
    }))
    setStatusMessage("Listening")
    if (!recordingRef.current) {
      scheduleRestart(0)
    }
  }

  function handlePrimaryControl() {
    switch (handsFreeState.phase) {
      case "sleeping":
        wakeByUser()
        return
      case "paused":
        resumeByUser()
        return
      case "error":
        resetError()
        return
      default:
        pauseByUser()
    }
  }

  function startNewSessionByUser() {
    setForceNewSessionTarget(true)
    setActiveConversationId(null)
    setActiveSessionId(null)
    setLastSubmittedText("")
    setStatusMessage("New session target")
    onStartNewSession?.()
  }

  useEffect(() => {
    if (!open) return undefined

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
        handlePrimaryControl()
        return
      }

      if (key === "s") {
        if (handsFreeState.phase === "sleeping" || isSubmitting) return
        event.preventDefault()
        event.stopPropagation()
        sleepByUser()
        return
      }

      if (key === "n") {
        event.preventDefault()
        event.stopPropagation()
        startNewSessionByUser()
        return
      }

      if (key === "f") {
        const target = getCurrentTarget()
        if (!target.conversationId && !target.sessionId) return
        event.preventDefault()
        event.stopPropagation()
        onFocusTarget?.(target)
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handsFreeState.phase, isSubmitting, onClose, onFocusTarget, onStartNewSession, open])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    openRef.current = open
    if (!open) {
      resetRuntimeState()
      return undefined
    }

    void startRecording()
    return () => {
      clearTimers()
      finalizingRef.current = false
      stopRecorder()
    }
  }, [open])

  useEffect(() => {
    if (!open || !conversationId) return
    setActiveConversationId(conversationId)
  }, [conversationId, open])

  useEffect(() => {
    if (!open || !sessionId) return
    setActiveSessionId(sessionId)
  }, [open, sessionId])

  useEffect(() => {
    if (!open) return undefined

    const unlistenProgress = rendererHandlers.agentProgressUpdate.listen((update) => {
      const target = getCurrentTarget()
      const targetConversationId = target.conversationId ?? activeConversationId
      const targetSessionId = target.sessionId ?? activeSessionId
      if (targetConversationId) {
        if (update.conversationId !== targetConversationId) return
      } else if (targetSessionId) {
        if (update.sessionId !== targetSessionId) return
      } else {
        return
      }

      if (update.conversationId) setActiveConversationId(update.conversationId)
      if (update.sessionId) setActiveSessionId(update.sessionId)

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
      const target = getCurrentTarget()
      if (target.sessionId && state.sessionId && state.sessionId !== target.sessionId) return

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
  }, [activeConversationId, activeSessionId, open])

  if (!open) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] justify-end">
      <section
        className={cn(
          "pointer-events-auto grid w-[440px] max-w-full gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-md",
          getToneClasses(tone),
        )}
        aria-label="Hands-free voice"
      >
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={handlePrimaryControl}
            disabled={isSubmitting && handsFreeState.phase !== "error"}
            className={cn(
              "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-60",
              handsFreeState.phase === "error"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : handsFreeState.phase === "sleeping" || handsFreeState.phase === "paused"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border bg-background hover:bg-accent",
            )}
            title={`${primaryControlLabel} hands-free voice (V)`}
            aria-label={`${primaryControlLabel} hands-free voice`}
            aria-keyshortcuts="V"
          >
            {handsFreeState.phase === "error" ? (
              <RotateCcw className="h-4 w-4" />
            ) : handsFreeState.phase === "sleeping" || handsFreeState.phase === "paused" ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", getDotClasses(tone), recording && "animate-pulse")} />
              <div className="truncate text-sm font-semibold">{phaseLabel}</div>
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : handsFreeState.phase === "sleeping" ? (
                <Moon className="h-3.5 w-3.5 shrink-0" />
              ) : handsFreeState.phase === "listening" ? (
                <Ear className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Mic className="h-3.5 w-3.5 shrink-0" />
              )}
            </div>
            <div className="mt-1 min-w-0 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{targetTitle}</span>
              <span className="mx-1 text-muted-foreground/70">/</span>
              <span>{targetSubtitle}</span>
              <span className="mx-1 text-muted-foreground/70">/</span>
              <span>{phaseDetail}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={startNewSessionByUser}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Start new voice session (N)"
              aria-label="Start new voice session"
              aria-keyshortcuts="N"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onFocusTarget?.(currentTarget)}
              disabled={!canFocusCurrentTarget}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              title="Focus target session (F)"
              aria-label="Focus target session"
              aria-keyshortcuts="F"
            >
              <Target className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={sleepByUser}
              disabled={handsFreeState.phase === "sleeping" || isSubmitting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              title="Sleep hands-free voice (S)"
              aria-label="Sleep hands-free voice"
              aria-keyshortcuts="S"
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Close hands-free voice (Esc)"
              aria-label="Close hands-free voice"
              aria-keyshortcuts="Escape"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="flex min-w-0 flex-wrap items-center gap-1.5 border-t border-current/10 pt-2"
          aria-label="Voice hotkeys"
        >
          <span className="mr-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            Hotkeys
          </span>
          <VoiceHotkeyHint
            keys="V"
            label={primaryControlLabel}
            disabled={isSubmitting && handsFreeState.phase !== "error"}
          />
          <VoiceHotkeyHint
            keys="S"
            label="Sleep"
            disabled={handsFreeState.phase === "sleeping" || isSubmitting}
          />
          <VoiceHotkeyHint keys="N" label="New" />
          <VoiceHotkeyHint keys="F" label="Focus" disabled={!canFocusCurrentTarget} />
          <VoiceHotkeyHint keys="Esc" label="Close" />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0 text-xs">
            <div className="truncate text-muted-foreground">
              Heard: <span className="text-foreground">{lastCapturedTranscript || "Nothing yet"}</span>
            </div>
            <div className="mt-1 truncate text-muted-foreground">
              Sent: <span className="text-foreground">{lastSubmittedText || "Nothing yet"}</span>
            </div>
            {statusMessage && (
              <div className="mt-1 truncate text-muted-foreground" aria-live="polite">
                {statusMessage}
              </div>
            )}
          </div>
          <VoiceBars values={voiceBars} tone={tone} />
        </div>
      </section>
    </div>
  )
}
