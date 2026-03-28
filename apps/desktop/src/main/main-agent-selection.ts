import {
  getAcpCapableAgentProfiles,
  isAcpCapableAgentProfile,
  resolveAgentProfileSelection,
} from "@dotagents/shared"
import type { ACPAgentConfig, AgentProfile } from "../shared/types"

export type MainAcpAgentSelection =
  | { resolvedName: string; repairedName?: string }
  | { error: string }

export type PreferredTopLevelAcpAgentSelection =
  | { resolvedName: string; source: "profile" | "main-agent"; repairedName?: string }
  | { error: string }

interface MainAcpAgentCandidate {
  id: string
  name: string
  displayName?: string
  enabled?: boolean
}

export function resolveMainAcpAgentSelection(
  configuredName: string,
  profileAgents: AgentProfile[] = [],
  legacyAgents: ACPAgentConfig[] = []
): MainAcpAgentSelection {
  const normalizedMainAgentName = configuredName.trim().toLowerCase()
  const hasConfiguredName = normalizedMainAgentName.length > 0

  const spawnableProfileCandidates = getAcpCapableAgentProfiles(profileAgents)

  const fallbackLegacyAgents = legacyAgents.filter((agent) =>
    agent.enabled !== false && agent.connection.type === "stdio"
  )

  const selectionCandidates: MainAcpAgentCandidate[] = [
    ...spawnableProfileCandidates.map((profile) => ({
      id: profile.id || profile.name,
      name: profile.name,
      displayName: profile.displayName,
      enabled: profile.enabled,
    })),
    ...fallbackLegacyAgents.map((agent) => ({
      id: agent.name,
      name: agent.name,
      displayName: agent.displayName,
      enabled: agent.enabled,
    })),
  ]

  const {
    ambiguousProfiles: ambiguousCandidates,
    selectedProfile,
  } = resolveAgentProfileSelection(selectionCandidates, configuredName)

  if (selectedProfile) {
    return { resolvedName: selectedProfile.name }
  }

  if (ambiguousCandidates?.length) {
    const ambiguousNames = [...new Set(ambiguousCandidates.map((agent) => agent.name))]
    return {
      error: `ACP main agent "${configuredName}" matches multiple enabled ACP/stdio agents: ${ambiguousNames.join(", ")}. Configure mainAgentName to a more specific agent ID, name, or display name.`,
    }
  }

  const fallbackNames = new Set<string>()
  const fallbackExternalAgents = selectionCandidates.filter((agent) => {
    const dedupeKey = agent.name.trim().toLowerCase()
    if (fallbackNames.has(dedupeKey)) return false
    fallbackNames.add(dedupeKey)
    return true
  })

  if (fallbackExternalAgents.length === 1) {
    return {
      resolvedName: fallbackExternalAgents[0].name,
      repairedName: fallbackExternalAgents[0].name,
    }
  }

  const availableNames = fallbackExternalAgents.map((profile) => profile.name)
  return {
    error: availableNames.length > 0
      ? hasConfiguredName
        ? `ACP main agent "${configuredName}" is not available. Configure mainAgentName to one of: ${availableNames.join(", ")}`
        : `ACP main agent is not configured. Configure mainAgentName to one of: ${availableNames.join(", ")}`
      : hasConfiguredName
        ? `ACP main agent "${configuredName}" is not available and no enabled ACP/stdio agents were found.`
        : "ACP main agent is not configured and no enabled ACP/stdio agents were found.",
  }
}

export function resolvePreferredTopLevelAcpAgentSelection({
  currentProfile,
  sessionProfileId,
  mainAgentMode,
  mainAgentName,
  profileAgents = [],
  legacyAgents = [],
}: {
  currentProfile?: AgentProfile
  sessionProfileId?: string
  mainAgentMode?: "api" | "acp"
  mainAgentName?: string
  profileAgents?: AgentProfile[]
  legacyAgents?: ACPAgentConfig[]
}): PreferredTopLevelAcpAgentSelection | null {
  const sessionProfile = sessionProfileId
    ? profileAgents.find((profile) => profile.id === sessionProfileId)
    : undefined
  const selectedProfile = sessionProfile ?? currentProfile

  if (
    selectedProfile
    && isAcpCapableAgentProfile(selectedProfile)
  ) {
    return {
      resolvedName: selectedProfile.name,
      source: "profile",
    }
  }

  if (mainAgentMode !== "acp") {
    return null
  }

  if (!mainAgentName?.trim()) {
    return null
  }

  const selection = resolveMainAcpAgentSelection(mainAgentName ?? "", profileAgents, legacyAgents)
  if ("error" in selection) {
    return selection
  }

  return {
    ...selection,
    source: "main-agent",
  }
}
