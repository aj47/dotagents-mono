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

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
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
