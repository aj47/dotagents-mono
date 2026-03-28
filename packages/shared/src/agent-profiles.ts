export type AgentProfileConnectionType = "internal" | "acp" | "stdio" | "remote"

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

export interface AgentProfileCatalogLike extends AgentProfileLike {
  isBuiltIn?: boolean | null
  modelConfig?: {
    mcpToolsProviderId?: string | null
  } | null
  toolConfig?: {
    enabledServers?: readonly string[] | null
  } | null
  skillsConfig?: {
    allSkillsDisabledByDefault?: boolean | null
    enabledSkillIds?: readonly string[] | null
  } | null
  properties?: Record<string, unknown> | null
}

export interface LegacyAcpAgentLike {
  name: string
  displayName?: string | null
  enabled?: boolean
  connection?: {
    type?: AgentProfileConnectionType | null
  } | null
}

export interface MainAcpAgentOption {
  id: string
  name: string
  displayName: string
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
    (priorityProfileId && left.id === priorityProfileId ? -4 : 0) +
    (left.isDefault ? -2 : 0) +
    (normalizeSelectionQuery(left.name) === "main-agent" ? -1 : 0)
  const rightPriority =
    (priorityProfileId && right.id === priorityProfileId ? -4 : 0) +
    (right.isDefault ? -2 : 0) +
    (normalizeSelectionQuery(right.name) === "main-agent" ? -1 : 0)

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  const leftLabel = normalizeSelectionQuery(
    getAgentProfileDisplayName(left) || left.id,
  )
  const rightLabel = normalizeSelectionQuery(
    getAgentProfileDisplayName(right) || right.id,
  )
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

export function getAgentProfileCatalogDescription(
  profile: Pick<AgentProfileLike, "description" | "guidelines">,
  fallback?: string,
): string | undefined {
  return getAgentProfileSummary(profile) ?? fallback
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

export function getAgentProfileStatusLabels(
  profile: Pick<AgentProfileCatalogLike, "enabled" | "isBuiltIn" | "isDefault">,
  options: {
    isCurrent?: boolean
  } = {},
): string[] {
  const labels: string[] = []

  if (options.isCurrent) {
    labels.push("current")
  }

  if (profile.isBuiltIn) {
    labels.push("built-in")
  }

  if (profile.isDefault) {
    labels.push("default")
  }

  if (!isAgentProfileEnabled(profile)) {
    labels.push("disabled")
  }

  return labels
}

export function getAgentProfileCatalogSummaryItems(
  profile: Pick<
    AgentProfileCatalogLike,
    | "connectionType"
    | "connection"
    | "modelConfig"
    | "toolConfig"
    | "skillsConfig"
    | "properties"
  >,
  options: {
    availableSkillCount?: number
  } = {},
): string[] {
  const items: string[] = []

  const connectionType = getAgentProfileConnectionType(profile)
  if (connectionType) {
    items.push(connectionType)
  }

  const providerId = normalizeAgentProfileText(
    profile.modelConfig?.mcpToolsProviderId,
  )
  if (providerId) {
    items.push(providerId)
  }

  const enabledServerCount = profile.toolConfig?.enabledServers?.length ?? 0
  if (enabledServerCount > 0) {
    items.push(
      `${enabledServerCount} server${enabledServerCount === 1 ? "" : "s"}`,
    )
  }

  const explicitEnabledSkillCount =
    profile.skillsConfig?.enabledSkillIds?.length ?? 0
  const availableSkillCount =
    typeof options.availableSkillCount === "number" &&
    Number.isFinite(options.availableSkillCount)
      ? Math.max(0, Math.floor(options.availableSkillCount))
      : undefined
  const enabledSkillCount =
    typeof availableSkillCount === "number"
      ? (!profile.skillsConfig?.allSkillsDisabledByDefault
        ? availableSkillCount
        : explicitEnabledSkillCount)
      : (profile.skillsConfig?.allSkillsDisabledByDefault
        ? explicitEnabledSkillCount
        : 0)
  if (enabledSkillCount > 0) {
    items.push(`${enabledSkillCount} skill${enabledSkillCount === 1 ? "" : "s"}`)
  }

  const propertyCount = profile.properties
    ? Object.keys(profile.properties).length
    : 0
  if (propertyCount > 0) {
    items.push(`${propertyCount} prop${propertyCount === 1 ? "" : "s"}`)
  }

  return items
}

function normalizeSkillIds(skillIds: readonly string[]): string[] {
  return [
    ...new Set(
      skillIds.filter(
        (skillId) =>
          typeof skillId === "string" && skillId.trim().length > 0,
      ),
    ),
  ]
}

export function areAllSkillsEnabledForAgentProfile(
  profile: Pick<AgentProfileCatalogLike, "skillsConfig"> | null | undefined,
): boolean {
  return !profile?.skillsConfig?.allSkillsDisabledByDefault
}

export function isSkillEnabledForAgentProfile(
  profile: Pick<AgentProfileCatalogLike, "skillsConfig"> | null | undefined,
  skillId: string,
): boolean {
  const normalizedSkillId = skillId.trim()
  if (!normalizedSkillId) {
    return false
  }

  if (areAllSkillsEnabledForAgentProfile(profile)) {
    return true
  }

  return (profile?.skillsConfig?.enabledSkillIds ?? []).includes(
    normalizedSkillId,
  )
}

export function getEnabledSkillIdsForAgentProfile(
  profile: Pick<AgentProfileCatalogLike, "skillsConfig"> | null | undefined,
  allSkillIds: readonly string[],
): string[] {
  const normalizedSkillIds = normalizeSkillIds(allSkillIds)
  if (areAllSkillsEnabledForAgentProfile(profile)) {
    return normalizedSkillIds
  }

  const enabledSkillIds = new Set(profile?.skillsConfig?.enabledSkillIds ?? [])
  return normalizedSkillIds.filter((skillId) => enabledSkillIds.has(skillId))
}

export function toggleSkillForAgentProfile(
  profile: Pick<AgentProfileCatalogLike, "skillsConfig"> | null | undefined,
  skillId: string,
  allSkillIds: readonly string[],
): {
  enabledSkillIds: string[]
  allSkillsDisabledByDefault: boolean
} {
  const normalizedSkillId = skillId.trim()
  const normalizedAllSkillIds = normalizeSkillIds(allSkillIds)
  if (!normalizedSkillId) {
    return areAllSkillsEnabledForAgentProfile(profile)
      ? {
        enabledSkillIds: [],
        allSkillsDisabledByDefault: false,
      }
      : {
        enabledSkillIds: normalizedAllSkillIds.filter((availableSkillId) =>
          (profile?.skillsConfig?.enabledSkillIds ?? []).includes(
            availableSkillId,
          ),
        ),
        allSkillsDisabledByDefault: true,
      }
  }

  if (areAllSkillsEnabledForAgentProfile(profile)) {
    return {
      enabledSkillIds: normalizedAllSkillIds.filter(
        (availableSkillId) => availableSkillId !== normalizedSkillId,
      ),
      allSkillsDisabledByDefault: true,
    }
  }

  const enabledSkillIds = new Set(profile?.skillsConfig?.enabledSkillIds ?? [])
  if (enabledSkillIds.has(normalizedSkillId)) {
    enabledSkillIds.delete(normalizedSkillId)
  } else {
    enabledSkillIds.add(normalizedSkillId)
  }

  if (
    normalizedAllSkillIds.length > 0 &&
    normalizedAllSkillIds.every((availableSkillId) =>
      enabledSkillIds.has(availableSkillId),
    )
  ) {
    return {
      enabledSkillIds: [],
      allSkillsDisabledByDefault: false,
    }
  }

  return {
    enabledSkillIds: normalizedAllSkillIds.filter((availableSkillId) =>
      enabledSkillIds.has(availableSkillId),
    ),
    allSkillsDisabledByDefault: true,
  }
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

  return (
    enabledProfiles.find((profile) => profile.isDefault) ??
    enabledProfiles.find(
      (profile) => normalizeSelectionQuery(profile.name) === "main-agent",
    ) ??
    enabledProfiles[0]
  )
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

export function getSelectableMainAcpAgents<
  TProfile extends AgentProfileLike,
  TLegacyAgent extends LegacyAcpAgentLike,
>(
  profileAgents: readonly TProfile[],
  legacyAgents: readonly TLegacyAgent[] = [],
): MainAcpAgentOption[] {
  const options: MainAcpAgentOption[] = []
  const seen = new Set<string>()

  const addOption = (
    id: string | null | undefined,
    name: string | null | undefined,
    displayName: string | null | undefined,
  ) => {
    const normalizedName = normalizeAgentProfileText(name)
    if (!normalizedName) {
      return
    }

    const dedupeKey = normalizeSelectionQuery(normalizedName)
    if (seen.has(dedupeKey)) {
      return
    }
    seen.add(dedupeKey)

    options.push({
      id: normalizeAgentProfileText(id) || normalizedName,
      name: normalizedName,
      displayName: normalizeAgentProfileText(displayName) || normalizedName,
    })
  }

  for (const profile of getAcpCapableAgentProfiles(profileAgents)) {
    addOption(profile.id, profile.name, getAgentProfileDisplayName(profile))
  }

  for (const agent of legacyAgents) {
    if (agent.enabled === false || agent.connection?.type !== "stdio") {
      continue
    }

    addOption(agent.name, agent.name, agent.displayName)
  }

  return options
}
