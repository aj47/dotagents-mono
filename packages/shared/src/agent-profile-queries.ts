export type AgentProfileQueryRole = "chat-agent" | "delegation-target" | "external-agent" | "user-profile"
export type PreferredAgentProfileQueryRole = Exclude<AgentProfileQueryRole, "user-profile">

export type AgentProfileQueryLike = {
  id: string
  name?: string
  displayName?: string
  enabled?: boolean
  isDefault?: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  role?: string
  connection?: {
    type?: string
  }
  connectionType?: string
}

export function normalizeAgentProfileQueryRole(
  role: string | undefined,
): PreferredAgentProfileQueryRole | undefined {
  if (!role) return undefined
  if (role === "user-profile") return "chat-agent"
  if (role === "chat-agent" || role === "delegation-target" || role === "external-agent") return role
  return undefined
}

function getConnectionType(profile: AgentProfileQueryLike): string | undefined {
  return profile.connection?.type ?? profile.connectionType
}

function dedupeProfilesById<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  const seenIds = new Set<string>()
  const deduped: T[] = []
  for (const profile of profiles) {
    if (seenIds.has(profile.id)) continue
    seenIds.add(profile.id)
    deduped.push(profile)
  }
  return deduped
}

export function isAgentProfileMatchingRole(
  profile: AgentProfileQueryLike,
  role: string,
): boolean {
  const requestedRole = normalizeAgentProfileQueryRole(role)
  if (!requestedRole) return false

  if (profile.role) {
    return normalizeAgentProfileQueryRole(profile.role) === requestedRole
  }

  switch (requestedRole) {
    case "chat-agent":
      return profile.isUserProfile === true
    case "delegation-target":
      return profile.isAgentTarget === true
    case "external-agent": {
      const connectionType = getConnectionType(profile)
      return profile.isAgentTarget === true && (connectionType === "acpx" || connectionType === "remote")
    }
    default:
      return false
  }
}

export function getAgentProfilesByRole<T extends AgentProfileQueryLike>(
  profiles: T[],
  role: string,
): T[] {
  return profiles.filter((profile) => isAgentProfileMatchingRole(profile, role))
}

export function getChatAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  const byRole = getAgentProfilesByRole(profiles, "chat-agent")
  const legacy = profiles.filter((profile) => profile.isUserProfile && !profile.role)
  return dedupeProfilesById([...byRole, ...legacy])
}

export function getEnabledChatAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  return getChatAgentProfiles(profiles).filter((profile) => profile.enabled !== false)
}

export function getDelegationAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  const byRole = getAgentProfilesByRole(profiles, "delegation-target")
  const legacy = profiles.filter((profile) => profile.isAgentTarget && !profile.role)
  return dedupeProfilesById([...byRole, ...legacy])
}

export function getExternalAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  return profiles.filter((profile) => {
    const connectionType = getConnectionType(profile)
    return profile.role === "external-agent" || connectionType === "acpx" || connectionType === "remote"
  })
}

export function getAcpxAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  return profiles.filter((profile) => getConnectionType(profile) === "acpx")
}

export function getEnabledAcpxAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  return getAcpxAgentProfiles(profiles).filter((profile) => profile.enabled !== false)
}

export function getEnabledDelegationAgentProfiles<T extends AgentProfileQueryLike>(profiles: T[]): T[] {
  return getDelegationAgentProfiles(profiles).filter((profile) => profile.enabled)
}

export function getAgentProfileByName<T extends AgentProfileQueryLike>(
  profiles: T[],
  name: string,
): T | undefined {
  return profiles.find((profile) => profile.name === name)
    ?? profiles.find((profile) => profile.displayName === name)
}

export function getCurrentAgentProfile<T extends AgentProfileQueryLike>(
  profiles: T[],
  currentProfileId?: string,
): T | undefined {
  if (currentProfileId) {
    return profiles.find((profile) => profile.id === currentProfileId)
  }

  return profiles.find((profile) => profile.isDefault)
    ?? profiles.find((profile) => profile.isBuiltIn)
}
