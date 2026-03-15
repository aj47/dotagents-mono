import React, { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Loader2, Mic, Send } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { TextInputPanel } from "./text-input-panel"
import { Recorder } from "@renderer/lib/recorder"
import { decodeBlobToPcm } from "@renderer/lib/audio-utils"
import { tipcClient } from "@renderer/lib/tipc-client"
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
  fromTile?: boolean
  continueConversationTitle?: string | null
  agentName?: string | null
  onSubmitted?: () => void
}

const VISUALIZER_BAR_COUNT = 56
const INITIAL_VISUALIZER_DATA = Array<number>(VISUALIZER_BAR_COUNT).fill(0.01)

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === "string" && error.trim()) return error.trim()
  return fallback
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
  fromTile = false,
  continueConversationTitle,
  agentName,
  onSubmitted,
}: SessionActionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [visualizerData, setVisualizerData] = useState<number[]>(INITIAL_VISUALIZER_DATA)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const isMountedRef = useRef(false)
  const recorderRef = useRef<Recorder | null>(null)
  const shouldSubmitVoiceRef = useRef(false)
  const isClosedRef = useRef(false)

  const canUpdateDialogState = () => isMountedRef.current && !isClosedRef.current

  const canHandleRecorderCallback = (recorder: Recorder, allowPendingSubmit: boolean = false) => {
    if (!canUpdateDialogState()) return false
    if (recorderRef.current === recorder) return true
    return allowPendingSubmit && shouldSubmitVoiceRef.current
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

  const stopRecorder = () => {
    recorderRef.current?.stopRecording()
    recorderRef.current = null
  }

  const handleTextSubmit = async (text: string) => {
    setIsSubmitting(true)
    try {
      if (sessionId) {
        useAgentStore.getState().appendUserMessageToSession(sessionId, text)
      }

      await tipcClient.createMcpTextInput({
        text,
        conversationId,
        fromTile,
      })

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

  const startVoiceRecording = async () => {
    if (!canUpdateDialogState()) return

    stopRecorder()
    shouldSubmitVoiceRef.current = false
    setStatusMessage(null)
    setVisualizerData(INITIAL_VISUALIZER_DATA)

    const recorder = new Recorder()
    recorderRef.current = recorder

    recorder.on("visualizer-data", (rms) => {
      if (!canHandleRecorderCallback(recorder)) return
      setVisualizerData((prev) => [...prev.slice(-(VISUALIZER_BAR_COUNT - 1)), rms])
    })

    recorder.on("record-end", (blob, duration) => {
      void (async () => {
        if (!canHandleRecorderCallback(recorder, true)) return

        setRecording(false)
        setVisualizerData(INITIAL_VISUALIZER_DATA)

        if (!shouldSubmitVoiceRef.current) {
          return
        }

        if (blob.size === 0 || duration < 100) {
          if (!canHandleRecorderCallback(recorder, true)) return
          setIsSubmitting(false)
          setStatusMessage("Recording too short — try again.")
          toast.error("Recording too short — try again.")
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

          await tipcClient.createMcpRecording({
            recording: await blob.arrayBuffer(),
            pcmRecording,
            duration,
            conversationId,
            sessionId,
            fromTile,
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
      setRecording(true)
      const config = await tipcClient.getConfig()
      await recorder.startRecording(config?.audioInputDeviceId)
    } catch (error) {
      stopRecorder()
      if (!canUpdateDialogState()) return
      setRecording(false)
      const message = getErrorMessage(error, "Failed to access the microphone.")
      setStatusMessage(message)
      toast.error(message)
      closeDialog()
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
      setRecording(false)
      setIsSubmitting(false)
      setStatusMessage(null)
      setVisualizerData(INITIAL_VISUALIZER_DATA)
      stopRecorder()
      return undefined
    }

    void startVoiceRecording()

    return () => {
      shouldSubmitVoiceRef.current = false
      stopRecorder()
    }
  }, [open, mode])

  useEffect(() => {
    if (!open || mode !== "voice" || !recording || isSubmitting) return undefined

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
  }, [open, mode, recording, isSubmitting])

  const title = mode === "voice"
    ? (conversationId ? "Continue with voice" : "Start with voice")
    : (conversationId ? "Continue with text" : "Start with text")

  const description = mode === "voice"
    ? "Record inside the main app window without opening the hover panel."
    : "Compose your message inside the main app window without opening the hover panel."

  const voiceBars = useMemo(() => visualizerData.slice(-VISUALIZER_BAR_COUNT), [visualizerData])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        shouldSubmitVoiceRef.current = false
        stopRecorder()
      }
      onOpenChange(nextOpen)
    }}>
      <DialogContent className={cn("sm:max-w-2xl", mode === "voice" && "sm:max-w-xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {mode === "text" ? (
          <div className="min-h-[360px]">
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
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {agentName && !continueConversationTitle && (
                <div className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-primary">
                  <Bot className="h-3 w-3" />
                  <span className="font-medium">{agentName}</span>
                </div>
              )}
              {continueConversationTitle && (
                <div className="inline-flex max-w-full items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  <span className="opacity-70">Continuing:</span>
                  <span className="truncate font-medium">{continueConversationTitle}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex min-h-[168px] flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Mic className={cn("h-4 w-4 text-primary", recording && "animate-pulse")} />
                  )}
                  <span>{statusMessage ?? (recording ? "Listening…" : "Preparing microphone…")}</span>
                </div>

                <div className="flex h-24 w-full items-end justify-center gap-1 rounded-lg bg-background/80 px-3 py-4">
                  {voiceBars.map((value, index) => (
                    <div
                      key={index}
                      className="w-1.5 shrink-0 rounded-full bg-red-500/90 transition-all dark:bg-white"
                      style={{ height: `${Math.max(12, Math.min(100, value * 100))}%` }}
                    />
                  ))}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Click submit or press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Enter</kbd> when you’re done.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
                disabled={isSubmitting}
                onClick={closeDialog}
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
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Submit</span>
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}