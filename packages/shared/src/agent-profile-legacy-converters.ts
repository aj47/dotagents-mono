import {
  type AgentProfileMcpServerConfigLike,
  type AgentProfileSessionSnapshotModelConfigLike,
  type AgentProfileSessionSnapshotSkillsConfigLike,
} from "./agent-profile-session-snapshot"

export type LegacyProfileRecordLike = {
  id: string
  name: string
  guidelines: string
  createdAt: number
  updatedAt: number
  isDefault?: boolean
  mcpServerConfig?: AgentProfileMcpServerConfigLike
  modelConfig?: AgentProfileSessionSnapshotModelConfigLike
  skillsConfig?: AgentProfileSessionSnapshotSkillsConfigLike
  systemPrompt?: string
}

export type LegacyPersonaMcpServerConfigLike = {
  enabledServers: string[]
  disabledTools?: string[]
  enabledRuntimeTools?: string[]
}

export type LegacyPersonaSkillsConfigLike = {
  enabledSkillIds: string[]
}

export type LegacyPersonaModelConfigLike = {
  providerId: "openai" | "groq" | "gemini" | "chatgpt-web"
  model: string
  temperature?: number
  maxTokens?: number
}

export type LegacyPersonaConnectionLike = {
  type: "internal" | "acp-agent" | "stdio" | "remote"
  acpAgentName?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  baseUrl?: string
}

export type LegacyPersonaRecordLike = {
  id: string
  name: string
  displayName: string
  description: string
  systemPrompt: string
  guidelines: string
  properties?: Record<string, string>
  mcpServerConfig: LegacyPersonaMcpServerConfigLike
  modelConfig?: LegacyPersonaModelConfigLike
  profileModelConfig?: AgentProfileSessionSnapshotModelConfigLike
  skillsConfig: LegacyPersonaSkillsConfigLike
  connection: LegacyPersonaConnectionLike
  isStateful: boolean
  conversationId?: string
  enabled: boolean
  isBuiltIn?: boolean
  createdAt: number
  updatedAt: number
}

export type LegacyAcpAgentConfigRecordLike = {
  name: string
  displayName: string
  description?: string
  autoSpawn?: boolean
  enabled?: boolean
  isInternal?: boolean
  connection: {
    type: "stdio" | "remote" | "internal" | "acp"
    command?: string
    args?: string[]
    env?: Record<string, string>
    cwd?: string
    baseUrl?: string
  }
}

export type LegacyProfileRecord = LegacyProfileRecordLike

export type LegacyProfilesData = {
  profiles: LegacyProfileRecord[]
  currentProfileId?: string
}

export type LegacyPersonaRecord = LegacyPersonaRecordLike

export type LegacyPersonasData = {
  personas: LegacyPersonaRecord[]
}

export type LegacyAcpAgentConfig = LegacyAcpAgentConfigRecordLike

export type ConvertedAgentProfileConnectionType = "internal" | "acpx" | "remote"

export type ConvertedAgentProfileLike = {
  id: string
  name: string
  displayName: string
  description?: string
  avatarDataUrl?: string | null
  systemPrompt?: string
  guidelines?: string
  properties?: Record<string, string>
  modelConfig?: AgentProfileSessionSnapshotModelConfigLike
  toolConfig?: AgentProfileMcpServerConfigLike
  skillsConfig?: AgentProfileSessionSnapshotSkillsConfigLike
  connection: {
    type: ConvertedAgentProfileConnectionType
    agent?: string
    command?: string
    args?: string[]
    env?: Record<string, string>
    cwd?: string
    baseUrl?: string
  }
  isStateful?: boolean
  conversationId?: string
  role?: "chat-agent" | "delegation-target" | "external-agent"
  enabled: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  isDefault?: boolean
  autoSpawn?: boolean
  createdAt: number
  updatedAt: number
}

export function legacyProfileToAgentProfile(profile: LegacyProfileRecordLike): ConvertedAgentProfileLike {
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.name,
    description: undefined,
    systemPrompt: profile.systemPrompt,
    guidelines: profile.guidelines,
    properties: undefined,
    modelConfig: profile.modelConfig,
    toolConfig: profile.mcpServerConfig ? {
      disabledServers: profile.mcpServerConfig.disabledServers,
      disabledTools: profile.mcpServerConfig.disabledTools,
      allServersDisabledByDefault: profile.mcpServerConfig.allServersDisabledByDefault,
      enabledServers: profile.mcpServerConfig.enabledServers,
      enabledRuntimeTools: profile.mcpServerConfig.enabledRuntimeTools,
    } : undefined,
    skillsConfig: profile.skillsConfig,
    connection: { type: "internal" },
    isStateful: false,
    role: "chat-agent",
    enabled: true,
    isBuiltIn: false,
    isUserProfile: true,
    isAgentTarget: false,
    isDefault: profile.isDefault,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

export function legacyPersonaToAgentProfile(persona: LegacyPersonaRecordLike): ConvertedAgentProfileLike {
  const connectionType: ConvertedAgentProfileConnectionType =
    persona.connection.type === "acp-agent" || persona.connection.type === "stdio"
      ? "acpx"
      : persona.connection.type

  return {
    id: persona.id,
    name: persona.name,
    displayName: persona.displayName,
    description: persona.description,
    systemPrompt: persona.systemPrompt,
    guidelines: persona.guidelines,
    properties: persona.properties,
    modelConfig: persona.profileModelConfig,
    toolConfig: {
      enabledServers: persona.mcpServerConfig.enabledServers,
      disabledTools: persona.mcpServerConfig.disabledTools,
      enabledRuntimeTools: persona.mcpServerConfig.enabledRuntimeTools,
    },
    skillsConfig: { enabledSkillIds: persona.skillsConfig.enabledSkillIds },
    connection: {
      type: connectionType,
      command: persona.connection.command,
      args: persona.connection.args,
      env: persona.connection.env,
      cwd: persona.connection.cwd,
      baseUrl: persona.connection.baseUrl,
    },
    isStateful: persona.isStateful,
    conversationId: persona.conversationId,
    role: "delegation-target",
    enabled: persona.enabled,
    isBuiltIn: persona.isBuiltIn,
    isUserProfile: false,
    isAgentTarget: true,
    createdAt: persona.createdAt,
    updatedAt: persona.updatedAt,
  }
}

export function legacyAcpAgentConfigToAgentProfileAtTime(
  config: LegacyAcpAgentConfigRecordLike,
  now: number,
): ConvertedAgentProfileLike {
  const connectionType: ConvertedAgentProfileConnectionType =
    config.connection.type === "internal"
      ? "internal"
      : config.connection.type === "remote"
        ? "remote"
        : "acpx"

  return {
    id: config.name,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    connection: {
      type: connectionType,
      agent: config.name,
      command: config.connection.command,
      args: config.connection.args,
      env: config.connection.env,
      cwd: config.connection.cwd,
      baseUrl: config.connection.baseUrl,
    },
    role: "external-agent",
    enabled: config.enabled ?? true,
    isBuiltIn: config.isInternal,
    isUserProfile: false,
    isAgentTarget: true,
    autoSpawn: config.autoSpawn,
    createdAt: now,
    updatedAt: now,
  }
}

export function legacyAcpAgentConfigToAgentProfile(
  config: LegacyAcpAgentConfigRecordLike,
): ConvertedAgentProfileLike {
  return legacyAcpAgentConfigToAgentProfileAtTime(config, Date.now())
}
