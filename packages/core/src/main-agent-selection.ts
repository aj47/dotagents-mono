import type { ACPAgentConfig, AgentProfile } from './types'

export type MainAcpAgentSelection =
  | { resolvedName: string; repairedName?: string }
  | { error: string }

export function resolveMainAcpAgentSelection(
  configuredName: string,
  profileAgents: AgentProfile[] = [],
  legacyAgents: ACPAgentConfig[] = []
): MainAcpAgentSelection {
  const normalizedMainAgentName = configuredName.trim().toLowerCase()
  const hasConfiguredName = normalizedMainAgentName.length > 0

  const spawnableProfileCandidates = profileAgents.filter((profile) =>
    profile.enabled !== false
    && (profile.connection.type === "acp" || profile.connection.type === "stdio")
  )

  const fallbackLegacyAgents = legacyAgents.filter((agent) =>
    agent.enabled !== false && agent.connection.type === "stdio"
  )

  const configuredProfile = spawnableProfileCandidates.find((profile) =>
    profile.name.trim().toLowerCase() === normalizedMainAgentName
    || profile.displayName.trim().toLowerCase() === normalizedMainAgentName
  )

  const legacyAgentMatch = fallbackLegacyAgents.find((agent) =>
    agent.name.trim().toLowerCase() === normalizedMainAgentName
    || agent.displayName.trim().toLowerCase() === normalizedMainAgentName
  )

  if (configuredProfile) {
    return { resolvedName: configuredProfile.name }
  }

  if (legacyAgentMatch) {
    return { resolvedName: legacyAgentMatch.name }
  }

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