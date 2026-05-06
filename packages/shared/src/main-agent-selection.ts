export type MainAcpAgentOption = {
  name: string
  displayName: string
}

export type MainAgentOption = MainAcpAgentOption
export type MainAgentMode = "api" | "acpx"
export type LegacyMainAgentMode = MainAgentMode | "acp"

export interface MainAgentConfig {
  mainAgentMode?: MainAgentMode
  mainAgentName?: string
}

export type MainAcpProfileCandidate = {
  id?: string
  name?: string
  displayName?: string
  enabled?: boolean
  connection?: {
    type?: string
  }
  connectionType?: string
}

export type MainAcpLegacyAgentCandidate = {
  name?: string
  displayName?: string
  enabled?: boolean
  connection?: {
    type?: string
  }
  connectionType?: string
}

export type MainAcpAgentSelection =
  | { resolvedName: string; repairedName?: string }
  | { error: string }

export type PreferredTopLevelAcpAgentSelection =
  | { resolvedName: string; source: "profile" | "main-agent"; repairedName?: string }
  | { error: string }

const PROFILE_ACP_CONNECTION_TYPES = new Set(["acpx", "acp", "stdio"])
const LEGACY_ACP_CONNECTION_TYPES = new Set(["acp", "stdio"])

function getConnectionType(candidate: MainAcpProfileCandidate | MainAcpLegacyAgentCandidate): string | undefined {
  return candidate.connection?.type ?? candidate.connectionType
}

function normalizeName(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function toLookupKey(value: string | undefined): string {
  return normalizeName(value)?.toLowerCase() ?? ""
}

function isEnabled(candidate: { enabled?: boolean }): boolean {
  return candidate.enabled !== false
}

export function isMainAcpProfileCandidate(profile: MainAcpProfileCandidate): boolean {
  if (!isEnabled(profile)) return false
  const connectionType = getConnectionType(profile)
  return !!connectionType && PROFILE_ACP_CONNECTION_TYPES.has(connectionType)
}

export function isLegacyMainAcpAgentCandidate(agent: MainAcpLegacyAgentCandidate): boolean {
  if (!isEnabled(agent)) return false

  const connectionType = getConnectionType(agent)
  if (!connectionType) {
    return true
  }

  return LEGACY_ACP_CONNECTION_TYPES.has(connectionType)
}

function addMainAcpAgentOption(
  options: MainAcpAgentOption[],
  seen: Set<string>,
  name: string | undefined,
  displayName: string | undefined,
): void {
  const normalizedName = normalizeName(name)
  if (!normalizedName) return

  const dedupeKey = normalizedName.toLowerCase()
  if (seen.has(dedupeKey)) return
  seen.add(dedupeKey)

  options.push({
    name: normalizedName,
    displayName: normalizeName(displayName) ?? normalizedName,
  })
}

export function getSelectableMainAcpAgents(
  profileAgents: MainAcpProfileCandidate[] = [],
  legacyAgents: MainAcpLegacyAgentCandidate[] = [],
): MainAcpAgentOption[] {
  const options: MainAcpAgentOption[] = []
  const seen = new Set<string>()

  for (const agent of profileAgents) {
    if (!isMainAcpProfileCandidate(agent)) continue
    addMainAcpAgentOption(options, seen, agent.name, agent.displayName)
  }

  for (const agent of legacyAgents) {
    if (!isLegacyMainAcpAgentCandidate(agent)) continue
    addMainAcpAgentOption(options, seen, agent.name, agent.displayName)
  }

  return options
}

export function getAcpxMainAgentOptions(
  settings?: { acpxAgents?: MainAcpLegacyAgentCandidate[] } | null,
  agentProfiles: MainAcpProfileCandidate[] = [],
): MainAgentOption[] {
  return getSelectableMainAcpAgents(agentProfiles, settings?.acpxAgents ?? [])
}

export function toMainAgentProfile(option: MainAgentOption): { id: string; name: string; guidelines: string } {
  return {
    id: `main-agent:${option.name}`,
    name: option.displayName,
    guidelines: "acpx main agent",
  }
}

export function resolveMainAcpAgentSelection(
  configuredName: string,
  profileAgents: MainAcpProfileCandidate[] = [],
  legacyAgents: MainAcpLegacyAgentCandidate[] = [],
): MainAcpAgentSelection {
  const normalizedMainAgentName = toLookupKey(configuredName)
  const hasConfiguredName = normalizedMainAgentName.length > 0

  const spawnableProfileCandidates = profileAgents.filter(isMainAcpProfileCandidate)
  const fallbackLegacyAgents = legacyAgents.filter(isLegacyMainAcpAgentCandidate)

  const configuredProfile = spawnableProfileCandidates.find((profile) =>
    toLookupKey(profile.name) === normalizedMainAgentName
    || toLookupKey(profile.displayName) === normalizedMainAgentName
  )

  const legacyAgentMatch = fallbackLegacyAgents.find((agent) =>
    toLookupKey(agent.name) === normalizedMainAgentName
    || toLookupKey(agent.displayName) === normalizedMainAgentName
  )

  const configuredProfileName = normalizeName(configuredProfile?.name)
  if (configuredProfileName) {
    return { resolvedName: configuredProfileName }
  }

  const legacyAgentName = normalizeName(legacyAgentMatch?.name)
  if (legacyAgentName) {
    return { resolvedName: legacyAgentName }
  }

  const fallbackNames = new Set<string>()
  const fallbackExternalAgents = [
    ...spawnableProfileCandidates.map((profile) => ({ name: normalizeName(profile.name) })),
    ...fallbackLegacyAgents.map((agent) => ({ name: normalizeName(agent.name) })),
  ].filter((agent): agent is { name: string } => {
    if (!agent.name) return false

    const dedupeKey = agent.name.toLowerCase()
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
        ? `acpx main agent "${configuredName}" is not available. Configure mainAgentName to one of: ${availableNames.join(", ")}`
        : `acpx main agent is not configured. Configure mainAgentName to one of: ${availableNames.join(", ")}`
      : hasConfiguredName
        ? `acpx main agent "${configuredName}" is not available and no enabled acpx agents were found.`
        : "acpx main agent is not configured and no enabled acpx agents were found.",
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
  currentProfile?: MainAcpProfileCandidate
  sessionProfileId?: string
  mainAgentMode?: LegacyMainAgentMode
  mainAgentName?: string
  profileAgents?: MainAcpProfileCandidate[]
  legacyAgents?: MainAcpLegacyAgentCandidate[]
}): PreferredTopLevelAcpAgentSelection | null {
  const sessionProfile = sessionProfileId
    ? profileAgents.find((profile) => profile.id === sessionProfileId)
    : undefined
  const selectedProfile = sessionProfile ?? currentProfile

  if (selectedProfile && isMainAcpProfileCandidate(selectedProfile)) {
    const selectedProfileName = normalizeName(selectedProfile.name)
    if (selectedProfileName) {
      return {
        resolvedName: selectedProfileName,
        source: "profile",
      }
    }
  }

  if (mainAgentMode !== "acpx" && mainAgentMode !== "acp") {
    return null
  }

  if (!mainAgentName?.trim()) {
    return null
  }

  const selection = resolveMainAcpAgentSelection(mainAgentName, profileAgents, legacyAgents)
  if ("error" in selection) {
    return selection
  }

  return {
    ...selection,
    source: "main-agent",
  }
}
