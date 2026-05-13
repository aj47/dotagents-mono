/**
 * AgentSelector - Dropdown to select which agent profile to use for the next session.
 * Stores the selection in localStorage and exposes it via a hook for other components.
 */

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { desktopAgentProfilesClient } from "@renderer/lib/desktop-agent-profiles-client"
import { Bot, Check, Edit2, Plus } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import type { AgentProfile } from "@dotagents/shared/agent-profile-domain"
import {
  formatAgentSelectorEditLabel,
  formatAgentSelectorSelectedAccessibilityLabel,
  getDefaultAgentProfile,
  getDisplayAgentProfile,
  getEnabledAgentProfiles,
  getAgentSelectorCommonCopyState,
  getAgentSelectorDesktopSurfaceState,
  getSelectedAgentProfile,
} from "@dotagents/shared/agent-selector-options"
import {
  SELECTED_AGENT_CHANGED_EVENT,
  SELECTED_AGENT_STORAGE_KEY,
  loadSelectedAgentId,
  saveSelectedAgentId as saveSelectedAgentIdToStorage,
} from "@dotagents/shared/selected-agent-persistence"
import { getAgentAvatarColors } from "@dotagents/shared/agent-avatar-colors"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { Facehash } from "facehash"

const selectorCopy = getAgentSelectorCommonCopyState()
const selectorSurface = getAgentSelectorDesktopSurfaceState()

function saveSelectedAgentId(agentId: string | null): void {
  saveSelectedAgentIdToStorage(agentId)

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<string | null>(SELECTED_AGENT_CHANGED_EVENT, { detail: agentId }))
  }
}

export function useSelectedAgentId(): [string | null, (id: string | null) => void] {
  const [selectedId, setSelectedId] = React.useState<string | null>(() => loadSelectedAgentId())

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SELECTED_AGENT_STORAGE_KEY) {
        setSelectedId(event.newValue)
      }
    }

    const handleSelectedAgentChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>
      setSelectedId(customEvent.detail ?? null)
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(SELECTED_AGENT_CHANGED_EVENT, handleSelectedAgentChanged as EventListener)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(SELECTED_AGENT_CHANGED_EVENT, handleSelectedAgentChanged as EventListener)
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
    queryFn: () => desktopAgentProfilesClient.getAgentProfiles(),
  })

  const enabledAgents = getEnabledAgentProfiles(agents)
  const selectedAgent = getSelectedAgentProfile(enabledAgents, selectedAgentId)
  const defaultAgent = getDefaultAgentProfile(enabledAgents)

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
  const displayAgent = getDisplayAgentProfile(enabledAgents, selectedAgentId)
  const displayName = displayAgent?.displayName || displayAgent?.name || selectorCopy.defaultAgentLabel

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={selectorSurface.triggerClassName}
          title={displayName}
          aria-label={formatAgentSelectorSelectedAccessibilityLabel(displayName)}
        >
          {displayAgent?.avatarDataUrl ? (
            <img src={displayAgent.avatarDataUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : displayAgent ? (
            <Facehash name={displayAgent.id} size={selectorSurface.triggerAvatarSize} colors={getAgentAvatarColors(displayAgent.id)} />
          ) : (
            <Bot className={selectorSurface.triggerBotIconClassName} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={selectorSurface.contentClassName}
      >
        {/* Default (no specific agent) */}
        <DropdownMenuItem
          onClick={() => onSelectAgent(null)}
          className={selectorSurface.itemClassName}
        >
          <div className={selectorSurface.avatarClassName}>
            {defaultAgent?.avatarDataUrl ? (
              <img
                src={defaultAgent.avatarDataUrl}
                alt={defaultAgent?.displayName || selectorCopy.defaultAgentLabel}
                className="h-full w-full object-cover"
              />
            ) : defaultAgent ? (
              <Facehash name={defaultAgent.id} size={selectorSurface.menuAvatarSize} colors={getAgentAvatarColors(defaultAgent.id)} />
            ) : (
              <Bot className={selectorSurface.menuBotIconClassName} />
            )}
          </div>
          <span className={selectorSurface.labelClassName}>{selectorCopy.defaultAgentLabel}</span>
          <Check className={cn(selectorSurface.checkIconClassName, selectedAgentId === null ? "opacity-100" : "opacity-0")} />
        </DropdownMenuItem>

        {enabledAgents.length > 0 && <DropdownMenuSeparator />}

        {enabledAgents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onSelect={(event) => {
              event.preventDefault()
              onSelectAgent(agent.id)
            }}
            className={selectorSurface.agentItemClassName}
          >
            <div className={selectorSurface.avatarClassName}>
              {agent.avatarDataUrl ? (
                <img src={agent.avatarDataUrl} alt={agent.displayName || agent.name} className="h-full w-full object-cover" />
              ) : (
                <Facehash name={agent.id} size={selectorSurface.menuAvatarSize} colors={getAgentAvatarColors(agent.id)} />
              )}
            </div>
            <span className={selectorSurface.labelClassName}>{agent.displayName || agent.name}</span>
            <Check className={cn(selectorSurface.checkIconClassName, selectedAgentId === agent.id ? "opacity-100" : "opacity-0")} />
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                navigate(`/settings/agents?edit=${encodeURIComponent(agent.id)}`)
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className={selectorSurface.editButtonClassName}
              title={formatAgentSelectorEditLabel(agent.displayName || agent.name)}
              aria-label={formatAgentSelectorEditLabel(agent.displayName || agent.name)}
            >
              <Edit2 className={selectorSurface.editIconClassName} />
            </button>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => navigate("/settings/agents?create=1")}
          className={selectorSurface.itemClassName}
        >
          <div className={selectorSurface.createActionIconWrapperClassName}>
            <Plus className={selectorSurface.newAgentIconClassName} />
          </div>
          <span className={selectorSurface.labelClassName}>{selectorCopy.newAgentLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
