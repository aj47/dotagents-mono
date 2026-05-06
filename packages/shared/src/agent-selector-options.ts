import {
  getAcpxMainAgentOptions,
  toMainAgentProfile,
  type MainAcpLegacyAgentCandidate,
} from "./main-agent-selection"

export type AgentSelectorProfileCandidate = {
  id: string
  name?: string
  displayName?: string
  description?: string
  guidelines?: string
  enabled?: boolean
  isDefault?: boolean
  connection?: {
    type?: string
  }
  connectionType?: string
}

export interface SelectableAgentProfile {
  id: string
  name: string
  guidelines?: string
  description?: string
  selectorMode: "profile" | "acpx"
  selectionValue: string
}

export type AgentSelectorSettings = {
  mainAgentMode?: "api" | "acpx" | "acp"
  acpxAgents?: MainAcpLegacyAgentCandidate[]
} | null | undefined

export function getEnabledAgentProfiles<T extends { enabled?: boolean }>(profiles: T[] = []): T[] {
  return profiles.filter((profile) => profile.enabled !== false)
}

export function getDefaultAgentProfile<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
): T | undefined {
  return profiles.find((profile) => profile.isDefault)
    ?? profiles.find((profile) => profile.name === "main-agent")
    ?? profiles[0]
}

export function getSelectedAgentProfile<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
  selectedAgentId?: string | null,
): T | undefined {
  if (!selectedAgentId) return undefined
  return profiles.find((profile) => profile.id === selectedAgentId)
}

export function getDisplayAgentProfile<T extends AgentSelectorProfileCandidate>(
  profiles: T[] = [],
  selectedAgentId?: string | null,
): T | undefined {
  return getSelectedAgentProfile(profiles, selectedAgentId) ?? getDefaultAgentProfile(profiles)
}

export function toSelectableAgentProfile(profile: AgentSelectorProfileCandidate): SelectableAgentProfile {
  const summary = profile.description || profile.guidelines || ""

  return {
    id: profile.id,
    name: profile.displayName || profile.name || profile.id,
    guidelines: summary,
    description: summary,
    selectorMode: "profile",
    selectionValue: profile.id,
  }
}

export function buildSelectorProfiles(
  settings?: AgentSelectorSettings,
  agentProfiles: AgentSelectorProfileCandidate[] = [],
): { selectorMode: "profile" | "acpx"; profiles: SelectableAgentProfile[] } {
  const enabledAgentProfiles = getEnabledAgentProfiles(agentProfiles)

  if (settings?.mainAgentMode === "acpx" || settings?.mainAgentMode === "acp") {
    return {
      selectorMode: "acpx",
      profiles: getAcpxMainAgentOptions(settings, enabledAgentProfiles).map((option) => ({
        ...toMainAgentProfile(option),
        selectorMode: "acpx",
        selectionValue: option.name,
      })),
    }
  }

  return {
    selectorMode: "profile",
    profiles: enabledAgentProfiles.map(toSelectableAgentProfile),
  }
}
