export type AgentProfileReferenceCleanupSummary = {
  updatedProfileIds: string[]
  removedReferenceCount: number
}

export type AgentProfileMcpReferenceCleanupSummary = AgentProfileReferenceCleanupSummary
export type AgentProfileSkillReferenceCleanupSummary = AgentProfileReferenceCleanupSummary

export type AgentProfileMcpReferenceProfile = {
  id: string
  updatedAt?: number
  toolConfig?: {
    enabledServers?: string[]
  }
}

export type AgentProfileSkillReferenceProfile = {
  id: string
  updatedAt?: number
  skillsConfig?: {
    enabledSkillIds?: string[]
  }
}

export type AgentProfileReferenceCleanupLayerStore<TLayer, TProfile extends { id: string }> = {
  loadProfiles(layer: TLayer): TProfile[]
  writeProfile(layer: TLayer, profile: TProfile): void
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function cleanupInvalidReferencesInProfileLayers<TLayer, TProfile extends { id: string }>(
  layers: TLayer[],
  store: AgentProfileReferenceCleanupLayerStore<TLayer, TProfile>,
  cleanupProfiles: (profiles: TProfile[]) => { profiles: TProfile[] } & AgentProfileReferenceCleanupSummary,
): AgentProfileReferenceCleanupSummary {
  const combinedUpdatedProfileIds: string[] = []
  let removedReferenceCount = 0

  for (const layer of layers) {
    const result = cleanupProfiles(store.loadProfiles(layer))
    if (result.updatedProfileIds.length === 0) continue

    const updatedProfilesById = new Map(result.profiles.map((profile) => [profile.id, profile]))
    for (const profileId of result.updatedProfileIds) {
      const profile = updatedProfilesById.get(profileId)
      if (!profile) continue
      store.writeProfile(layer, profile)
    }

    combinedUpdatedProfileIds.push(...result.updatedProfileIds)
    removedReferenceCount += result.removedReferenceCount
  }

  return {
    updatedProfileIds: uniqueSorted(combinedUpdatedProfileIds),
    removedReferenceCount,
  }
}

export function cleanupInvalidMcpServerReferencesInProfiles<TProfile extends AgentProfileMcpReferenceProfile>(
  profiles: TProfile[],
  validServerNames: Iterable<string>,
  now: number = Date.now(),
): { profiles: TProfile[] } & AgentProfileMcpReferenceCleanupSummary {
  const validServerNameSet = new Set(Array.from(validServerNames))
  const updatedProfileIds: string[] = []
  let removedReferenceCount = 0

  const nextProfiles = profiles.map((profile) => {
    const currentServerNames = profile.toolConfig?.enabledServers ?? []
    if (currentServerNames.length === 0) return profile

    const nextServerNames = currentServerNames.filter((serverName) => validServerNameSet.has(serverName))
    if (nextServerNames.length === currentServerNames.length) return profile

    removedReferenceCount += currentServerNames.length - nextServerNames.length
    updatedProfileIds.push(profile.id)

    return {
      ...profile,
      updatedAt: now,
      toolConfig: {
        ...profile.toolConfig,
        enabledServers: nextServerNames,
      },
    } as TProfile
  })

  return {
    profiles: nextProfiles,
    updatedProfileIds: uniqueSorted(updatedProfileIds),
    removedReferenceCount,
  }
}

export function cleanupInvalidMcpServerReferencesInProfileLayers<
  TLayer,
  TProfile extends AgentProfileMcpReferenceProfile,
>(
  layers: TLayer[],
  validServerNames: Iterable<string>,
  store: AgentProfileReferenceCleanupLayerStore<TLayer, TProfile>,
  now: number = Date.now(),
): AgentProfileMcpReferenceCleanupSummary {
  const validServerNameList = Array.from(validServerNames)
  return cleanupInvalidReferencesInProfileLayers(layers, store, (profiles) =>
    cleanupInvalidMcpServerReferencesInProfiles(profiles, validServerNameList, now),
  )
}

export function cleanupInvalidSkillReferencesInProfiles<TProfile extends AgentProfileSkillReferenceProfile>(
  profiles: TProfile[],
  validSkillIds: Iterable<string>,
  now: number = Date.now(),
): { profiles: TProfile[] } & AgentProfileSkillReferenceCleanupSummary {
  const validSkillIdSet = new Set(Array.from(validSkillIds))
  const updatedProfileIds: string[] = []
  let removedReferenceCount = 0

  const nextProfiles = profiles.map((profile) => {
    const currentSkillIds = profile.skillsConfig?.enabledSkillIds ?? []
    if (currentSkillIds.length === 0) return profile

    const nextSkillIds = currentSkillIds.filter((skillId) => validSkillIdSet.has(skillId))
    if (nextSkillIds.length === currentSkillIds.length) return profile

    removedReferenceCount += currentSkillIds.length - nextSkillIds.length
    updatedProfileIds.push(profile.id)

    return {
      ...profile,
      updatedAt: now,
      skillsConfig: {
        ...profile.skillsConfig,
        enabledSkillIds: nextSkillIds,
      },
    } as TProfile
  })

  return {
    profiles: nextProfiles,
    updatedProfileIds: uniqueSorted(updatedProfileIds),
    removedReferenceCount,
  }
}

export function cleanupInvalidSkillReferencesInProfileLayers<
  TLayer,
  TProfile extends AgentProfileSkillReferenceProfile,
>(
  layers: TLayer[],
  validSkillIds: Iterable<string>,
  store: AgentProfileReferenceCleanupLayerStore<TLayer, TProfile>,
  now: number = Date.now(),
): AgentProfileSkillReferenceCleanupSummary {
  const validSkillIdList = Array.from(validSkillIds)
  return cleanupInvalidReferencesInProfileLayers(layers, store, (profiles) =>
    cleanupInvalidSkillReferencesInProfiles(profiles, validSkillIdList, now),
  )
}
