import React, { useState, useRef } from "react"
import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Textarea } from "@renderer/components/ui/textarea"
import { Mic, Send, X, Plus } from "lucide-react"
import { AgentSelector, useSelectedAgentId } from "./agent-selector"
import { tipcClient } from "@renderer/lib/tipc-client"
import type { AgentProfile } from "@shared/types"

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

  const applySelectedAgentToNextSession = async () => {
    try {
      const agents = await tipcClient.getAgentProfiles()
      const enabledAgents = (agents as AgentProfile[]).filter((agent) => agent.enabled)

      let agentIdToApply: string | null = selectedAgentId
      if (agentIdToApply) {
        const selectedAgent = enabledAgents.find((agent) => agent.id === agentIdToApply)
        if (!selectedAgent) {
          setSelectedAgentId(null)
          agentIdToApply = null
        }
      }

      if (!agentIdToApply) {
        const defaultAgent =
          enabledAgents.find((agent) => agent.isDefault)
          ?? enabledAgents.find((agent) => agent.name === "main-agent")
          ?? enabledAgents[0]
        agentIdToApply = defaultAgent?.id ?? null
      }

      if (!agentIdToApply) return true

      const result = await tipcClient.setCurrentAgentProfile({ id: agentIdToApply })
      return !!result?.success
    } catch {
      return false
    }
  }

  const handleSubmit = async () => {
    if (text.trim() && !isProcessing) {
      const applied = await applySelectedAgentToNextSession()
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
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    onVoiceStart()
  }

  if (showTextInput) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-card border-b", className)}>
        <div className="flex items-center gap-2 self-start pt-1">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Agent</span>
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
          placeholder="Type your message... (Enter to send, Shift+Enter for new line, Esc to cancel)"
          className="min-h-[60px] max-h-[120px] flex-1 resize-none"
          disabled={isProcessing}
          autoFocus
        />
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            onClick={() => { void handleSubmit() }}
            disabled={!text.trim() || isProcessing}
            className="h-8"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setText("")
              setShowTextInput(false)
            }}
            disabled={isProcessing}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-between gap-3 p-3 bg-card border-b", className)}>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleShowTextInput}
          disabled={isProcessing || isRecording}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Text</span>
        </Button>
        <Button
          variant={isRecording ? "destructive" : "secondary"}
          onClick={handleVoiceClick}
          disabled={isProcessing}
          className="gap-2"
        >
          <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
          <span>{isRecording ? "Recording..." : "Voice"}</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Start a new agent session
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

