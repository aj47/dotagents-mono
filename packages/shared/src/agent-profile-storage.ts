export type AgentProfileStorageProfileLike = {
  id: string
}

export type AgentProfilesDataLike<TProfile extends AgentProfileStorageProfileLike> = {
  profiles: TProfile[]
  currentProfileId?: string
}

export type AgentProfileLegacyMigrationProfileLike = AgentProfileStorageProfileLike & {
  isDefault?: boolean
}

export type LegacyProfilesDataLike<TLegacyProfile extends AgentProfileStorageProfileLike> = {
  profiles: readonly TLegacyProfile[]
  currentProfileId?: string
}

export type LegacyPersonasDataLike<TLegacyPersona extends AgentProfileStorageProfileLike> = {
  personas: readonly TLegacyPersona[]
}

export type AgentProfileStorageLegacyAcpAgentLike = {
  name: string
}

export type AgentProfileLegacyMigrationSources<
  TLegacyProfile extends AgentProfileStorageProfileLike,
  TLegacyPersona extends AgentProfileStorageProfileLike,
  TLegacyAcpAgent extends AgentProfileStorageLegacyAcpAgentLike,
> = {
  legacyProfilesData?: LegacyProfilesDataLike<TLegacyProfile> | null
  legacyPersonasData?: LegacyPersonasDataLike<TLegacyPersona> | null
  legacyAcpAgents?: readonly TLegacyAcpAgent[] | null
}

export type AgentProfileLegacyMigrationConverters<
  TAgentProfile extends AgentProfileLegacyMigrationProfileLike,
  TLegacyProfile extends AgentProfileStorageProfileLike,
  TLegacyPersona extends AgentProfileStorageProfileLike,
  TLegacyAcpAgent extends AgentProfileStorageLegacyAcpAgentLike,
> = {
  profileToAgentProfile: (profile: TLegacyProfile) => TAgentProfile
  personaToAgentProfile: (persona: TLegacyPersona) => TAgentProfile
  acpAgentConfigToAgentProfile: (agent: TLegacyAcpAgent) => TAgentProfile
}

export type AgentProfileLegacyMigrationResult<
  TAgentProfile extends AgentProfileLegacyMigrationProfileLike,
> = {
  profiles: TAgentProfile[]
  counts: {
    legacyProfiles: number
    legacyPersonas: number
    legacyAcpAgents: number
  }
  duplicateIds: string[]
}

export function mergeAgentProfileLayers<TProfile extends AgentProfileStorageProfileLike>(
  globalProfiles: readonly TProfile[],
  workspaceProfiles: readonly TProfile[],
): TProfile[] {
  const mergedById = new Map<string, TProfile>()

  for (const profile of globalProfiles) {
    mergedById.set(profile.id, profile)
  }

  for (const profile of workspaceProfiles) {
    mergedById.set(profile.id, profile)
  }

  return Array.from(mergedById.values())
}

export function buildAgentProfilesDataFromLayers<TProfile extends AgentProfileStorageProfileLike>(
  globalProfiles: readonly TProfile[],
  workspaceProfiles: readonly TProfile[],
  currentProfileId?: string,
): AgentProfilesDataLike<TProfile> {
  return {
    profiles: mergeAgentProfileLayers(globalProfiles, workspaceProfiles),
    currentProfileId,
  }
}

export function migrateAgentProfilesFromLegacySources<
  TAgentProfile extends AgentProfileLegacyMigrationProfileLike,
  TLegacyProfile extends AgentProfileStorageProfileLike,
  TLegacyPersona extends AgentProfileStorageProfileLike,
  TLegacyAcpAgent extends AgentProfileStorageLegacyAcpAgentLike,
>(
  sources: AgentProfileLegacyMigrationSources<TLegacyProfile, TLegacyPersona, TLegacyAcpAgent>,
  converters: AgentProfileLegacyMigrationConverters<TAgentProfile, TLegacyProfile, TLegacyPersona, TLegacyAcpAgent>,
): AgentProfileLegacyMigrationResult<TAgentProfile> {
  const profiles: TAgentProfile[] = []
  const seenIds = new Set<string>()
  const duplicateIds: string[] = []

  const appendUniqueProfile = (id: string, createProfile: () => TAgentProfile): void => {
    if (seenIds.has(id)) {
      duplicateIds.push(id)
      return
    }

    profiles.push(createProfile())
    seenIds.add(id)
  }

  const legacyProfiles = sources.legacyProfilesData?.profiles ?? []
  for (const legacyProfile of legacyProfiles) {
    appendUniqueProfile(legacyProfile.id, () => {
      const profile = converters.profileToAgentProfile(legacyProfile)
      if (sources.legacyProfilesData?.currentProfileId === legacyProfile.id) {
        return { ...profile, isDefault: true } as TAgentProfile
      }
      return profile
    })
  }

  const legacyPersonas = sources.legacyPersonasData?.personas ?? []
  for (const persona of legacyPersonas) {
    appendUniqueProfile(persona.id, () => converters.personaToAgentProfile(persona))
  }

  const legacyAcpAgents = sources.legacyAcpAgents ?? []
  for (const acpAgent of legacyAcpAgents) {
    appendUniqueProfile(acpAgent.name, () => converters.acpAgentConfigToAgentProfile(acpAgent))
  }

  return {
    profiles,
    counts: {
      legacyProfiles: legacyProfiles.length,
      legacyPersonas: legacyPersonas.length,
      legacyAcpAgents: legacyAcpAgents.length,
    },
    duplicateIds,
  }
}
