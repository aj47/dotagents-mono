/**
 * AgentSelector - Dropdown to select which agent profile to use for the next session.
 * Stores the selection in localStorage and exposes it via a hook for other components.
 */

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { tipcClient } from "@renderer/lib/tipc-client"
import { Bot, ChevronDown, Check } from "lucide-react"
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
  const { data: agents = [] } = useQuery<AgentProfile[]>({
    queryKey: ["agentProfilesSelector"],
    queryFn: () => tipcClient.getAgentProfiles(),
  })

  const enabledAgents = agents.filter((a) => a.enabled)
  const selectedAgent = enabledAgents.find((a) => a.id === selectedAgentId)

  // If the selected agent was disabled/deleted, reset to default
  React.useEffect(() => {
    if (selectedAgentId && enabledAgents.length > 0 && !selectedAgent) {
      onSelectAgent(null)
    }
  }, [selectedAgentId, enabledAgents, selectedAgent, onSelectAgent])

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
          className={cn(
            "gap-1.5 text-xs font-normal",
            compact && "h-7 px-2",
          )}
        >
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[120px] truncate">{displayName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
        {/* Default (no specific agent) */}
        <DropdownMenuItem
          onClick={() => onSelectAgent(null)}
          className="gap-2"
        >
          <Check className={cn("h-3.5 w-3.5", selectedAgentId === null ? "opacity-100" : "opacity-0")} />
          <div className="flex flex-col">
            <span className="text-sm">Default Agent</span>
            <span className="text-xs text-muted-foreground">Use the default agent profile</span>
          </div>
        </DropdownMenuItem>

        {enabledAgents.length > 0 && <DropdownMenuSeparator />}

        {enabledAgents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className="gap-2"
          >
            <Check className={cn("h-3.5 w-3.5", selectedAgentId === agent.id ? "opacity-100" : "opacity-0")} />
            <div className="flex flex-col">
              <span className="text-sm">{agent.displayName || agent.name}</span>
              {agent.description && (
                <span className="text-xs text-muted-foreground line-clamp-1">{agent.description}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
