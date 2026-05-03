/**
 * AgentSelector - Dropdown to select which agent profile to use for the next session.
 * Stores the selection in localStorage and exposes it via a hook for other components.
 */

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { tipcClient } from "@renderer/lib/tipc-client"
import { Bot, Check, Edit2, Plus } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import type { AgentProfile } from "../../../shared/types"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Facehash } from "facehash"

// Curated palette of vivid colors to pick from deterministically
const AVATAR_PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6",
  "#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16",
  "#f43f5e","#a855f7","#0ea5e9","#10b981","#f59e0b",
  "#e11d48","#7c3aed","#0891b2","#059669","#d97706",
]
function agentColors(seed: string): string[] {
  let h = 5381
  for (let i = 0; i < seed.length; i++) h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0
  return [0, 7, 13].map(offset => AVATAR_PALETTE[(h + offset) % AVATAR_PALETTE.length])
}

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
  /** @deprecated No longer used — the selector is always a single icon */
  compact?: boolean
}

export function AgentSelector({ selectedAgentId, onSelectAgent }: AgentSelectorProps) {
  const navigate = useNavigate()
  const { data: agents = [] } = useQuery<AgentProfile[]>({
    queryKey: ["agentProfilesSelector"],
    queryFn: () => tipcClient.getAgentProfiles(),
  })

  const enabledAgents = agents.filter((a) => a.enabled)
  const selectedAgent = enabledAgents.find((a) => a.id === selectedAgentId)
  const defaultAgent = enabledAgents.find((a) => a.isDefault) ?? enabledAgents[0]

  // If the selected agent was disabled/deleted, reset to default
  React.useEffect(() => {
    if (selectedAgentId && enabledAgents.length > 0 && !selectedAgent) {
      onSelectAgent(null)
    }
  }, [selectedAgentId, enabledAgents, selectedAgent, onSelectAgent])

  if (enabledAgents.length === 0) {
    return null
  }

  // When no agent is explicitly selected, show the default agent's avatar
  const displayAgent = selectedAgent ?? defaultAgent
  const displayName = displayAgent?.displayName || displayAgent?.name || "Default Agent"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-sm overflow-hidden hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title={displayName}
          aria-label={`Selected agent: ${displayName}`}
        >
          {displayAgent?.avatarDataUrl ? (
            <img src={displayAgent.avatarDataUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : displayAgent ? (
            <Facehash name={displayAgent.id} size={28} colors={agentColors(displayAgent.id)} />
          ) : (
            <Bot className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[300px] w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto"
      >
        {/* Default (no specific agent) */}
        <DropdownMenuItem
          onClick={() => onSelectAgent(null)}
          className="min-w-0 items-center gap-2"
        >
          <div className="h-5 w-5 shrink-0 rounded overflow-hidden flex items-center justify-center">
            {defaultAgent?.avatarDataUrl ? (
              <img src={defaultAgent.avatarDataUrl} alt={defaultAgent?.displayName || "Default Agent"} className="h-full w-full object-cover" />
            ) : defaultAgent ? (
              <Facehash name={defaultAgent.id} size={20} colors={agentColors(defaultAgent.id)} />
            ) : (
              <Bot className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Default Agent</span>
          <Check className={cn("h-3.5 w-3.5 shrink-0", selectedAgentId === null ? "opacity-100" : "opacity-0")} />
        </DropdownMenuItem>

        {enabledAgents.length > 0 && <DropdownMenuSeparator />}

        {enabledAgents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onSelect={(event) => {
              event.preventDefault()
              onSelectAgent(agent.id)
            }}
            className="min-w-0 items-center gap-2 pr-1"
          >
            <div className="h-5 w-5 shrink-0 rounded overflow-hidden flex items-center justify-center">
              {agent.avatarDataUrl ? (
                <img src={agent.avatarDataUrl} alt={agent.displayName || agent.name} className="h-full w-full object-cover" />
              ) : (
                <Facehash name={agent.id} size={20} colors={agentColors(agent.id)} />
              )}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{agent.displayName || agent.name}</span>
            <Check className={cn("h-3.5 w-3.5 shrink-0", selectedAgentId === agent.id ? "opacity-100" : "opacity-0")} />
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                navigate(`/settings/agents?edit=${encodeURIComponent(agent.id)}`)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title={`Edit ${agent.displayName || agent.name}`}
              aria-label={`Edit ${agent.displayName || agent.name}`}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => navigate("/settings/agents?create=1")}
          className="min-w-0 items-center gap-2"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground">
            <Plus className="h-4 w-4" />
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">New agent…</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
