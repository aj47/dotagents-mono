export type AgentProfileAcpxConnectionLike = {
  type?: string
  agent?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  baseUrl?: string
}

export type AgentProfileAcpxMigrationProfileLike = {
  name: string
  connection: AgentProfileAcpxConnectionLike
}

export type LegacyAcpAgentConfigLike = {
  name: string
  connection: {
    type?: string
  }
}

export type LegacyAcpRuntimeConfigLike = Record<string, unknown> & {
  mainAgentMode?: string
  acpAgents?: unknown
  acpInjectRuntimeTools?: unknown
}

export function normalizeAgentProfileConnectionForAcpx<TProfile extends AgentProfileAcpxMigrationProfileLike>(
  profile: TProfile,
): { profile: TProfile; changed: boolean } {
  if (profile.connection.type === "internal" || profile.connection.type === "remote") {
    return { profile, changed: false }
  }

  const nextProfile = {
    ...profile,
    connection: {
      type: "acpx",
      ...(profile.connection.command || profile.connection.agent ? {} : { agent: profile.name }),
      ...(profile.connection.agent ? { agent: profile.connection.agent } : {}),
      ...(profile.connection.command ? { command: profile.connection.command } : {}),
      ...(profile.connection.args ? { args: profile.connection.args } : {}),
      ...(profile.connection.env ? { env: profile.connection.env } : {}),
      ...(profile.connection.cwd ? { cwd: profile.connection.cwd } : {}),
    },
  }

  return { profile: nextProfile, changed: true }
}

export function migrateAgentProfilesForAcpxRuntime<
  TProfile extends AgentProfileAcpxMigrationProfileLike,
  TLegacyAgent extends LegacyAcpAgentConfigLike,
>(
  profiles: TProfile[],
  legacyAgents: TLegacyAgent[] = [],
): {
  profiles: TProfile[]
  legacyAgentsToAdd: TLegacyAgent[]
  skippedRemoteAgentNames: string[]
  normalizedProfileCount: number
  changed: boolean
} {
  let normalizedProfileCount = 0
  const seenNames = new Set(profiles.map((profile) => profile.name))
  const nextProfiles = profiles.map((profile) => {
    const result = normalizeAgentProfileConnectionForAcpx(profile)
    if (result.changed) normalizedProfileCount += 1
    return result.profile
  })

  const legacyAgentsToAdd: TLegacyAgent[] = []
  const skippedRemoteAgentNames: string[] = []
  for (const legacyAgent of legacyAgents) {
    if (legacyAgent.connection.type === "remote") {
      skippedRemoteAgentNames.push(legacyAgent.name)
      continue
    }

    if (seenNames.has(legacyAgent.name)) continue
    legacyAgentsToAdd.push(legacyAgent)
    seenNames.add(legacyAgent.name)
  }

  return {
    profiles: nextProfiles,
    legacyAgentsToAdd,
    skippedRemoteAgentNames,
    normalizedProfileCount,
    changed: normalizedProfileCount > 0 || legacyAgentsToAdd.length > 0,
  }
}

export function migrateLegacyAcpRuntimeConfig<TConfig extends LegacyAcpRuntimeConfigLike>(
  config: TConfig,
): { config: TConfig; changed: boolean } {
  let changed = false
  const nextConfig = { ...config } as TConfig

  if (nextConfig.mainAgentMode === "acp") {
    nextConfig.mainAgentMode = "acpx"
    changed = true
  }

  if (Array.isArray(nextConfig.acpAgents) && nextConfig.acpAgents.length > 0) {
    delete nextConfig.acpAgents
    changed = true
  }

  if ("acpInjectRuntimeTools" in nextConfig) {
    delete nextConfig.acpInjectRuntimeTools
    changed = true
  }

  return { config: nextConfig, changed }
}
