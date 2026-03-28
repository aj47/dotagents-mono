export type AgentProfileConnectionType =
  | "internal"
  | "acp"
  | "stdio"
  | "remote"

export interface AgentProfileLike {
  id: string
  name: string
  displayName?: string | null
  description?: string | null
  guidelines?: string | null
  enabled?: boolean
  isDefault?: boolean
  connectionType?: AgentProfileConnectionType | null
  connection?: {
    type?: AgentProfileConnectionType | null
  } | null
}

export interface ResolvedAgentProfileSelection<TProfile> {
  ambiguousProfiles?: TProfile[]
  selectedProfile?: TProfile
}

function normalizeAgentProfileText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function normalizeSelectionQuery(query: string): string {
  return query.trim().toLowerCase()
}

function getAgentProfileSelectionCandidates(
  profile: Pick<AgentProfileLike, "id" | "name" | "displayName">,
): string[] {
  const candidates = [
    normalizeSelectionQuery(profile.id),
    normalizeSelectionQuery(profile.name),
    normalizeSelectionQuery(getAgentProfileDisplayName(profile)),
  ].filter(Boolean)

  return [...new Set(candidates)]
}

function compareAgentProfilePriority<TProfile extends AgentProfileLike>(
  left: TProfile,
  right: TProfile,
  priorityProfileId?: string | null,
): number {
  const leftPriority =
    (priorityProfileId && left.id === priorityProfileId ? -4 : 0)
    + (left.isDefault ? -2 : 0)
    + (normalizeSelectionQuery(left.name) === "main-agent" ? -1 : 0)
  const rightPriority =
    (priorityProfileId && right.id === priorityProfileId ? -4 : 0)
    + (right.isDefault ? -2 : 0)
    + (normalizeSelectionQuery(right.name) === "main-agent" ? -1 : 0)

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  const leftLabel = normalizeSelectionQuery(getAgentProfileDisplayName(left) || left.id)
  const rightLabel = normalizeSelectionQuery(getAgentProfileDisplayName(right) || right.id)
  return leftLabel.localeCompare(rightLabel)
}

export function getAgentProfileDisplayName(
  profile: Pick<AgentProfileLike, "name" | "displayName">,
): string {
  const displayName = normalizeAgentProfileText(profile.displayName)
  if (displayName) {
    return displayName
  }

  return normalizeAgentProfileText(profile.name)
}

export function getAgentProfileSummary(
  profile: Pick<AgentProfileLike, "description" | "guidelines">,
): string | undefined {
  const description = normalizeAgentProfileText(profile.description)
  if (description) {
    return description
  }

  const guidelines = normalizeAgentProfileText(profile.guidelines)
  return guidelines || undefined
}

export function getAgentProfileConnectionType(
  profile: Pick<AgentProfileLike, "connectionType" | "connection">,
): AgentProfileConnectionType | undefined {
  return profile.connectionType ?? profile.connection?.type ?? undefined
}

export function isAgentProfileEnabled(
  profile: Pick<AgentProfileLike, "enabled">,
): boolean {
  return profile.enabled !== false
}

export function getEnabledAgentProfiles<TProfile extends AgentProfileLike>(
  profiles: readonly TProfile[],
): TProfile[] {
  return profiles.filter((profile) => isAgentProfileEnabled(profile))
}

export function sortAgentProfilesByPriority<TProfile extends AgentProfileLike>(
  profiles: readonly TProfile[],
  options: {
    priorityProfileId?: string | null
  } = {},
): TProfile[] {
  return [...profiles].sort((left, right) =>
    compareAgentProfilePriority(left, right, options.priorityProfileId),
  )
}

export function getDefaultAgentProfile<TProfile extends AgentProfileLike>(
  profiles: readonly TProfile[],
): TProfile | undefined {
  const enabledProfiles = getEnabledAgentProfiles(profiles)

  return enabledProfiles.find((profile) => profile.isDefault)
    ?? enabledProfiles.find(
      (profile) => normalizeSelectionQuery(profile.name) === "main-agent",
    )
    ?? enabledProfiles[0]
}

export function resolveAgentProfileSelection<TProfile extends AgentProfileLike>(
  profiles: readonly TProfile[],
  query: string,
): ResolvedAgentProfileSelection<TProfile> {
  const normalizedQuery = normalizeSelectionQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactProfile = profiles.find((profile) =>
    getAgentProfileSelectionCandidates(profile).includes(normalizedQuery),
  )
  if (exactProfile) {
    return { selectedProfile: exactProfile }
  }

  const matchingProfiles = profiles.filter((profile) =>
    getAgentProfileSelectionCandidates(profile).some((candidate) =>
      candidate.startsWith(normalizedQuery),
    ),
  )

  if (matchingProfiles.length === 1) {
    return { selectedProfile: matchingProfiles[0] }
  }

  if (matchingProfiles.length > 1) {
    return { ambiguousProfiles: matchingProfiles }
  }

  return {}
}

export function isAcpCapableAgentProfile(
  profile: Pick<AgentProfileLike, "enabled" | "connectionType" | "connection">,
): boolean {
  if (!isAgentProfileEnabled(profile)) {
    return false
  }

  const connectionType = getAgentProfileConnectionType(profile)
  return connectionType === "acp" || connectionType === "stdio"
}

export function getAcpCapableAgentProfiles<TProfile extends AgentProfileLike>(
  profiles: readonly TProfile[],
): TProfile[] {
  return profiles.filter((profile) => isAcpCapableAgentProfile(profile))
}
