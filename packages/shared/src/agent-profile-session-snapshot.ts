export type ProfileMcpServerConfig = {
  disabledServers?: string[]
  disabledTools?: string[]
  allServersDisabledByDefault?: boolean
  enabledServers?: string[]
  enabledRuntimeTools?: string[]
}

export type AgentProfileToolConfigLike = ProfileMcpServerConfig

export type AgentProfileMcpServerConfigLike = ProfileMcpServerConfig

export type ProfileModelConfig = {
  agentProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  agentOpenaiModel?: string
  agentGroqModel?: string
  agentGeminiModel?: string
  agentChatgptWebModel?: string
  /** @deprecated Use agentProviderId instead. */
  mcpToolsProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  /** @deprecated Use agentOpenaiModel instead. */
  mcpToolsOpenaiModel?: string
  /** @deprecated Use agentGroqModel instead. */
  mcpToolsGroqModel?: string
  /** @deprecated Use agentGeminiModel instead. */
  mcpToolsGeminiModel?: string
  /** @deprecated Use agentChatgptWebModel instead. */
  mcpToolsChatgptWebModel?: string
  currentModelPresetId?: string
  sttProviderId?: "openai" | "groq" | "parakeet"
  openaiSttModel?: string
  groqSttModel?: string
  transcriptPostProcessingProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
  transcriptPostProcessingChatgptWebModel?: string
  ttsProviderId?: "openai" | "groq" | "gemini" | "edge" | "kitten" | "supertonic"
}

export type AgentProfileSessionSnapshotModelConfigLike = ProfileModelConfig

export type ProfileSkillsConfig = {
  enabledSkillIds?: string[]
  allSkillsDisabledByDefault?: boolean
}

export type AgentProfileSessionSnapshotSkillsConfigLike = ProfileSkillsConfig

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

export type SessionProfileSnapshot = AgentProfileSessionSnapshotLike

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
