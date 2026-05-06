import { createAgentProfileRecord, DEFAULT_AGENT_PROFILE_ENABLED } from "./agent-profile-mutations"
import {
  type AgentProfileMcpServerConfigLike,
  type AgentProfileSessionSnapshotModelConfigLike,
  type AgentProfileSessionSnapshotProfileLike,
  type AgentProfileSessionSnapshotSkillsConfigLike,
  toolConfigToMcpServerConfig,
} from "./agent-profile-session-snapshot"

export type AgentProfileTemplateLike = Omit<AgentProfileSessionSnapshotProfileLike, "id"> & {
  name?: string
  description?: string
  connection: {
    type: string
  }
  isStateful?: boolean
  role?: string
  enabled: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  isDefault?: boolean
}

export type AgentProfileRecordLike<TTemplate extends AgentProfileTemplateLike = AgentProfileTemplateLike> = TTemplate & {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type LegacyProfileLike = {
  id: string
  name: string
  guidelines: string
  createdAt?: number
  updatedAt?: number
  isDefault?: boolean
  mcpServerConfig?: AgentProfileMcpServerConfigLike
  modelConfig?: AgentProfileSessionSnapshotModelConfigLike
  skillsConfig?: AgentProfileSessionSnapshotSkillsConfigLike
  systemPrompt?: string
}

export const DEFAULT_MAIN_AGENT_PROFILE_TEMPLATE = {
  name: "main-agent",
  displayName: "Main Agent",
  description: "The primary agent that handles all user interactions",
  systemPrompt: "You are a highly autonomous and proactive assistant. Answer questions clearly and assist with a wide variety of tasks. Make as many tool calls as needed and do NOT stop to ask for permission unless absolutely necessary.",
  guidelines: "",
  connection: { type: "internal" },
  isStateful: false,
  role: "delegation-target",
  enabled: DEFAULT_AGENT_PROFILE_ENABLED,
  isBuiltIn: true,
  isUserProfile: false,
  isAgentTarget: true,
  isDefault: true,
} satisfies AgentProfileTemplateLike

export const DEFAULT_AGENT_PROFILE_TEMPLATES = [
  DEFAULT_MAIN_AGENT_PROFILE_TEMPLATE,
] as const

export function createDefaultAgentProfiles(
  idFactory: () => string,
  now: number = Date.now(),
): AgentProfileRecordLike[] {
  return DEFAULT_AGENT_PROFILE_TEMPLATES.map((profile) =>
    createAgentProfileRecord(profile, idFactory(), now),
  )
}

export function buildInternalDelegationAgentProfileCreateInput(
  name: string,
  guidelines: string,
  systemPrompt: string | undefined,
  allServerNames: string[],
  runtimeToolNames: string[],
): AgentProfileTemplateLike {
  return {
    name,
    displayName: name,
    guidelines,
    systemPrompt,
    connection: { type: "internal" },
    role: "delegation-target",
    enabled: DEFAULT_AGENT_PROFILE_ENABLED,
    isUserProfile: false,
    isAgentTarget: true,
    toolConfig: {
      disabledServers: allServerNames,
      disabledTools: runtimeToolNames,
      allServersDisabledByDefault: true,
    },
  }
}

export function agentProfileToLegacyProfile(
  profile: AgentProfileSessionSnapshotProfileLike & {
    createdAt?: number
    updatedAt?: number
    isDefault?: boolean
  },
): LegacyProfileLike {
  return {
    id: profile.id,
    name: profile.displayName,
    guidelines: profile.guidelines || "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    isDefault: profile.isDefault,
    mcpServerConfig: toolConfigToMcpServerConfig(profile.toolConfig),
    modelConfig: profile.modelConfig,
    skillsConfig: profile.skillsConfig,
    systemPrompt: profile.systemPrompt,
  }
}
