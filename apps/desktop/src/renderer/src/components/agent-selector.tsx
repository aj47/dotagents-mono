/**
 * AgentSelector - Dropdown to select which agent profile to use for the next session.
 * Stores the selection in localStorage and exposes it via a hook for other components.
 */

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { AlertTriangle, Bot, Check, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import type { AgentProfile } from "../../../shared/types"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"

const STORAGE_KEY = "dotagents-selected-agent"
const STORAGE_EVENT = "dotagents-selected-agent-changed"

function getAgentLoadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim()
  }

  return "Failed to load agents"
}

function loadSelectedAgentId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveSelectedAgentId(agentId: string | null): void {
  try {
    if (agentId) {
      localStorage.setItem(STORAGE_KEY, agentId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<string | null>(STORAGE_EVENT, { detail: agentId }))
  }
}

export function useSelectedAgentId(): [string | null, (id: string | null) => void] {
  const [selectedId, setSelectedId] = React.useState<string | null>(() => loadSelectedAgentId())

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setSelectedId(event.newValue)
      }
    }

    const handleSelectedAgentChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>
      setSelectedId(customEvent.detail ?? null)
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(STORAGE_EVENT, handleSelectedAgentChanged as EventListener)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(STORAGE_EVENT, handleSelectedAgentChanged as EventListener)
    }
  }, [])

  const setAndPersist = React.useCallback((id: string | null) => {
    setSelectedId(id)
    saveSelectedAgentId(id)
  }, [])

  return [selectedId, setAndPersist]
}

interface AgentSelectorProps {
  selectedAgentId: string | null
  onSelectAgent: (agentId: string | null) => void
  compact?: boolean
}

export function AgentSelector({ selectedAgentId, onSelectAgent, compact = false }: AgentSelectorProps) {
  const { data: agents = [], error, isLoading, isFetching, refetch } = useQuery<AgentProfile[]>({
    queryKey: ["agentProfilesSelector"],
    queryFn: () => tipcClient.getAgentProfiles(),
  })

  const enabledAgents = agents.filter((a) => a.enabled)
  const selectedAgent = enabledAgents.find((a) => a.id === selectedAgentId)
  const buttonClassName = cn(
    "min-w-0 max-w-[min(13rem,calc(100vw-2rem))] justify-between gap-1.5 text-xs font-normal",
    compact && "h-7 px-2",
  )

  // If the selected agent was disabled/deleted, reset to default
  React.useEffect(() => {
    if (selectedAgentId && enabledAgents.length > 0 && !selectedAgent) {
      onSelectAgent(null)
    }
  }, [selectedAgentId, enabledAgents, selectedAgent, onSelectAgent])

  if ((isLoading || isFetching) && agents.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={buttonClassName}
        disabled
        aria-label="Loading agents"
        title="Loading agents"
      >
        <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-left">Loading agents...</span>
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
      </Button>
    )
  }

  if (error && agents.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={buttonClassName}
        onClick={() => void refetch()}
        aria-label="Retry loading agents"
        title={getAgentLoadErrorMessage(error)}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span className="min-w-0 flex-1 truncate text-left">Retry agents</span>
      </Button>
    )
  }

  if (enabledAgents.length === 0) {
    return null
  }

  const displayName = selectedAgent?.displayName || selectedAgent?.name || "Default Agent"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={buttonClassName}
          title={displayName}
        >
          <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-left">{displayName}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[300px] w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto"
      >
        {/* Default (no specific agent) */}
        <DropdownMenuItem
          onClick={() => onSelectAgent(null)}
          className="min-w-0 items-start gap-2"
        >
          <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", selectedAgentId === null ? "opacity-100" : "opacity-0")} />
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="truncate text-sm font-medium">Default Agent</span>
            <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]">
              Use the default agent profile
            </span>
          </div>
        </DropdownMenuItem>

        {enabledAgents.length > 0 && <DropdownMenuSeparator />}

        {enabledAgents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className="min-w-0 items-start gap-2"
          >
            <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", selectedAgentId === agent.id ? "opacity-100" : "opacity-0")} />
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="truncate text-sm font-medium">{agent.displayName || agent.name}</span>
              {agent.description && (
                <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]">
                  {agent.description}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
