import type { ACPAgentConfig, AgentProfile } from "../shared/types"

const logSelection = (...args: unknown[]) => console.log(`[MainAgentSelection]`, ...args)

export type MainAcpAgentSelection =
  | { resolvedName: string; repairedName?: string }
  | { error: string }

export type PreferredTopLevelAcpAgentSelection =
  | { resolvedName: string; source: "profile" | "main-agent"; repairedName?: string }
  | { error: string }

export function resolveMainAcpAgentSelection(
  configuredName: string,
  profileAgents: AgentProfile[] = [],
  legacyAgents: ACPAgentConfig[] = []
): MainAcpAgentSelection {
  const normalizedMainAgentName = configuredName.trim().toLowerCase()
  const hasConfiguredName = normalizedMainAgentName.length > 0

  logSelection(`[MainAgentSelection] Looking for main agent: "${configuredName}", profileAgents count: ${profileAgents.length}, legacyAgents count: ${legacyAgents.length}`)

  const spawnableProfileCandidates = profileAgents.filter((profile) =>
    profile.enabled !== false
    && (profile.connection.type === "acp" || profile.connection.type === "stdio")
  )

  logSelection(`[MainAgentSelection] Spawnable profile candidates: ${spawnableProfileCandidates.map(p => p.name).join(", ")}`)

  const fallbackLegacyAgents = legacyAgents.filter((agent) =>
    agent.enabled !== false && agent.connection.type === "stdio"
  )

  const configuredProfile = spawnableProfileCandidates.find((profile) => {
    const match = profile.name.trim().toLowerCase() === normalizedMainAgentName
      || profile.displayName.trim().toLowerCase() === normalizedMainAgentName
    if (match) {
      logSelection(`[MainAgentSelection] MATCHED profile: name="${profile.name}", displayName="${profile.displayName}"`)
    }
    return match
  })

  const legacyAgentMatch = fallbackLegacyAgents.find((agent) =>
    agent.name.trim().toLowerCase() === normalizedMainAgentName
    || agent.displayName.trim().toLowerCase() === normalizedMainAgentName
  )

  if (configuredProfile) {
    logSelection(`[MainAgentSelection] Found configured profile: ${configuredProfile.name}`)
    return { resolvedName: configuredProfile.name }
  }

  if (legacyAgentMatch) {
    logSelection(`[MainAgentSelection] Found legacy agent match: ${legacyAgentMatch.name}`)
    return { resolvedName: legacyAgentMatch.name }
  }

  logSelection(`[MainAgentSelection] No exact match found. Checking fallback (single available agent)...`)
  const fallbackNames = new Set<string>()
  const fallbackExternalAgents = [
    ...spawnableProfileCandidates.map((profile) => ({ name: profile.name })),
    ...fallbackLegacyAgents.map((agent) => ({ name: agent.name })),
  ].filter((agent) => {
    const dedupeKey = agent.name.trim().toLowerCase()
    if (fallbackNames.has(dedupeKey)) return false
    fallbackNames.add(dedupeKey)
    return true
  })

  logSelection(`[MainAgentSelection] Fallback candidates: ${fallbackExternalAgents.map(a => a.name).join(", ")}`)

  if (fallbackExternalAgents.length === 1) {
    logSelection(`[MainAgentSelection] Using single fallback agent: ${fallbackExternalAgents[0].name}`)
    return {
      resolvedName: fallbackExternalAgents[0].name,
      repairedName: fallbackExternalAgents[0].name,
    }
  }

  const availableNames = fallbackExternalAgents.map((profile) => profile.name)
  logSelection(`[MainAgentSelection] ERROR - no match: ${availableNames.length > 0 ? availableNames.join(", ") : "no agents"}`)
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
    && selectedProfile.enabled !== false
    && (selectedProfile.connection.type === "acp" || selectedProfile.connection.type === "stdio")
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
