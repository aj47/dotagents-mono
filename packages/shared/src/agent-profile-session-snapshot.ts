export type AgentProfileToolConfigLike = {
  disabledServers?: string[]
  disabledTools?: string[]
  allServersDisabledByDefault?: boolean
  enabledServers?: string[]
  enabledRuntimeTools?: string[]
}

export type AgentProfileMcpServerConfigLike = AgentProfileToolConfigLike

export type AgentProfileSessionSnapshotModelConfigLike = Record<string, unknown>

export type AgentProfileSessionSnapshotSkillsConfigLike = {
  enabledSkillIds?: string[]
  allSkillsDisabledByDefault?: boolean
}

export type AgentProfileSessionSnapshotProfileLike = {
  id: string
  displayName: string
  guidelines?: string
  systemPrompt?: string
  toolConfig?: AgentProfileToolConfigLike
  modelConfig?: AgentProfileSessionSnapshotModelConfigLike
  properties?: Record<string, string>
  skillsConfig?: AgentProfileSessionSnapshotSkillsConfigLike
}

export type AgentProfileSessionSnapshotLike = {
  profileId: string
  profileName: string
  guidelines: string
  systemPrompt?: string
  mcpServerConfig?: AgentProfileMcpServerConfigLike
  modelConfig?: AgentProfileSessionSnapshotModelConfigLike
  skillsInstructions?: string
  agentProperties?: Record<string, string>
  skillsConfig?: AgentProfileSessionSnapshotSkillsConfigLike
}

export function toolConfigToMcpServerConfig(
  toolConfig?: AgentProfileToolConfigLike,
): AgentProfileMcpServerConfigLike | undefined {
  if (!toolConfig) return undefined
  return {
    disabledServers: toolConfig.disabledServers,
    disabledTools: toolConfig.disabledTools,
    allServersDisabledByDefault: toolConfig.allServersDisabledByDefault,
    enabledServers: toolConfig.enabledServers,
    enabledRuntimeTools: toolConfig.enabledRuntimeTools,
  }
}

export function createSessionSnapshotFromProfile<TSnapshot extends AgentProfileSessionSnapshotLike = AgentProfileSessionSnapshotLike>(
  profile: AgentProfileSessionSnapshotProfileLike,
  skillsInstructions?: string,
): TSnapshot {
  return {
    profileId: profile.id,
    profileName: profile.displayName,
    guidelines: profile.guidelines || "",
    systemPrompt: profile.systemPrompt,
    mcpServerConfig: toolConfigToMcpServerConfig(profile.toolConfig),
    modelConfig: profile.modelConfig,
    skillsInstructions,
    agentProperties: profile.properties,
    skillsConfig: profile.skillsConfig,
  } as TSnapshot
}

export function refreshSessionSnapshotSkillsFromProfile<TSnapshot extends AgentProfileSessionSnapshotLike>(
  snapshot: TSnapshot | undefined,
  profile: AgentProfileSessionSnapshotProfileLike | undefined,
): TSnapshot | undefined {
  if (!snapshot || !profile || snapshot.profileId !== profile.id) return snapshot
  return {
    ...snapshot,
    skillsConfig: profile.skillsConfig,
    skillsInstructions: undefined,
  }
}
