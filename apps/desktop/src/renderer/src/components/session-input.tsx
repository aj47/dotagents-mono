import React, { useState, useRef } from "react"
import { applySelectedAgentToNextSession } from "@renderer/lib/apply-selected-agent"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Textarea } from "@renderer/components/ui/textarea"
import { Mic, Send, X, Plus } from "lucide-react"
import { AgentSelector, useSelectedAgentId } from "./agent-selector"
import {
  getAppShellSessionStartCopyState,
  getAppShellSessionStartDesktopSurfaceState,
} from "@dotagents/shared/app-shell"

const sessionStartCopy = getAppShellSessionStartCopyState()
const sessionStartDesktopSurface = getAppShellSessionStartDesktopSurfaceState()
const sessionStartExpandedSurface = sessionStartDesktopSurface.expanded
const sessionStartIdleSurface = sessionStartDesktopSurface.idle

interface SessionInputProps {
  onTextSubmit: (text: string) => void
  onVoiceStart: () => void
  isRecording?: boolean
  isProcessing?: boolean
  className?: string
  showTextInput?: boolean
  onShowTextInputChange?: (show: boolean) => void
}

export function SessionInput({
  onTextSubmit,
  onVoiceStart,
  isRecording = false,
  isProcessing = false,
  className,
  showTextInput: controlledShowTextInput,
  onShowTextInputChange,
}: SessionInputProps) {
  const [internalShowTextInput, setInternalShowTextInput] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useSelectedAgentId()

  const showTextInput = controlledShowTextInput ?? internalShowTextInput
  const setShowTextInput = (show: boolean) => {
    setInternalShowTextInput(show)
    onShowTextInputChange?.(show)
  }
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    if (text.trim() && !isProcessing) {
      const applied = await applySelectedAgentToNextSession({
        selectedAgentId,
        setSelectedAgentId,
      })
      if (!applied) return
      onTextSubmit(text.trim())
      setText("")
      setShowTextInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      setText("")
      setShowTextInput(false)
    }
  }

  const handleShowTextInput = () => {
    setShowTextInput(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleVoiceClick = async () => {
    const applied = await applySelectedAgentToNextSession({
      selectedAgentId,
      setSelectedAgentId,
    })
    if (!applied) return
    onVoiceStart()
  }

  if (showTextInput) {
    return (
      <div
        className={cn(
          sessionStartExpandedSurface.containerClassName,
          className,
        )}
      >
        <div className={sessionStartExpandedSurface.agentPickerClassName}>
          <span className={sessionStartExpandedSurface.agentLabelClassName}>
            {sessionStartCopy.agentSelectorLabel}
          </span>
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            compact
          />
        </div>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={sessionStartCopy.textInputPlaceholder}
          className={sessionStartExpandedSurface.textAreaClassName}
          disabled={isProcessing}
          autoFocus
        />
        <div className={sessionStartExpandedSurface.actionsClassName}>
          <Button
            size="sm"
            onClick={() => {
              void handleSubmit()
            }}
            disabled={!text.trim() || isProcessing}
            className={sessionStartExpandedSurface.actionButtonClassName}
          >
            <Send className={sessionStartExpandedSurface.actionIconClassName} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setText("")
              setShowTextInput(false)
            }}
            disabled={isProcessing}
            className={sessionStartExpandedSurface.actionButtonClassName}
          >
            <X className={sessionStartExpandedSurface.actionIconClassName} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(sessionStartIdleSurface.containerClassName, className)}>
      <div className={sessionStartIdleSurface.actionsClassName}>
        <Button
          onClick={handleShowTextInput}
          disabled={isProcessing || isRecording}
          className={sessionStartIdleSurface.actionButtonClassName}
        >
          <Plus className={sessionStartIdleSurface.actionIconClassName} />
          <span>{sessionStartCopy.newTextActionLabel}</span>
        </Button>
        <Button
          variant={isRecording ? "destructive" : "secondary"}
          onClick={handleVoiceClick}
          disabled={isProcessing}
          className={sessionStartIdleSurface.actionButtonClassName}
        >
          <Mic
            className={cn(
              sessionStartIdleSurface.actionIconClassName,
              isRecording && sessionStartIdleSurface.recordingIconClassName,
            )}
          />
          <span>
            {isRecording
              ? sessionStartCopy.recordingActionLabel
              : sessionStartCopy.voiceActionLabel}
          </span>
        </Button>
      </div>
      <div className={sessionStartIdleSurface.metaClassName}>
        <div className={sessionStartIdleSurface.descriptionClassName}>
          {sessionStartCopy.idleDescription}
        </div>
        <AgentSelector
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          compact
        />
      </div>
    </div>
  )
}
