import {
  isChatProviderId,
  STT_PROVIDERS,
  TTS_PROVIDERS,
  type STT_PROVIDER_ID,
  type TTS_PROVIDER_ID,
} from "./providers"
import type {
  AgentProfileMcpServerValidationConfigLike,
  AgentProfileModelConfigLike,
  AgentProfileSkillsConfigLike,
} from "./agent-profile-config-validation"

export type AgentProfileMcpConfigUpdateLike = AgentProfileMcpServerValidationConfigLike
export type AgentProfileModelConfigUpdateLike = AgentProfileModelConfigLike
export type AgentProfileSkillsConfigUpdateLike = AgentProfileSkillsConfigLike
export type AgentProfileAgentModelProvider = NonNullable<AgentProfileModelConfigUpdateLike["agentProviderId"]>
export type AgentProfileAgentModelField =
  | "agentOpenaiModel"
  | "agentGroqModel"
  | "agentGeminiModel"
  | "agentChatgptWebModel"

const DEFAULT_AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES = ["mark_work_complete"]
const STT_PROVIDER_IDS = STT_PROVIDERS.map((provider) => provider.value)
const TTS_PROVIDER_IDS = TTS_PROVIDERS.map((provider) => provider.value)

function hasOwnUpdate<T extends object>(
  updates: T,
  key: keyof T,
): boolean {
  return Object.prototype.hasOwnProperty.call(updates, key)
}

function normalizeStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const values = value.filter((item): item is string => typeof item === "string")
  return values.length > 0 ? values : undefined
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function isSttProviderId(value: unknown): value is STT_PROVIDER_ID {
  return typeof value === "string" && STT_PROVIDER_IDS.includes(value as STT_PROVIDER_ID)
}

function isTtsProviderId(value: unknown): value is TTS_PROVIDER_ID {
  return typeof value === "string" && TTS_PROVIDER_IDS.includes(value as TTS_PROVIDER_ID)
}

function omitUndefinedValues<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter((entry) => entry[1] !== undefined),
  ) as T
}

export function normalizeAgentProfileModelConfigForEdit(
  value: AgentProfileModelConfigUpdateLike | Record<string, unknown> | null | undefined,
): AgentProfileModelConfigUpdateLike | undefined {
  if (!value) return undefined

  const config = value as Record<string, unknown>
  const agentProviderId = isChatProviderId(config.agentProviderId)
    ? config.agentProviderId
    : isChatProviderId(config.mcpToolsProviderId)
      ? config.mcpToolsProviderId
      : undefined
  const mcpToolsProviderId = isChatProviderId(config.mcpToolsProviderId)
    ? config.mcpToolsProviderId
    : agentProviderId

  return omitUndefinedValues({
    agentProviderId,
    mcpToolsProviderId,
    agentOpenaiModel: stringValue(config.agentOpenaiModel) ?? stringValue(config.mcpToolsOpenaiModel),
    agentGroqModel: stringValue(config.agentGroqModel) ?? stringValue(config.mcpToolsGroqModel),
    agentGeminiModel: stringValue(config.agentGeminiModel) ?? stringValue(config.mcpToolsGeminiModel),
    agentChatgptWebModel: stringValue(config.agentChatgptWebModel) ?? stringValue(config.mcpToolsChatgptWebModel),
    mcpToolsOpenaiModel: stringValue(config.mcpToolsOpenaiModel) ?? stringValue(config.agentOpenaiModel),
    mcpToolsGroqModel: stringValue(config.mcpToolsGroqModel) ?? stringValue(config.agentGroqModel),
    mcpToolsGeminiModel: stringValue(config.mcpToolsGeminiModel) ?? stringValue(config.agentGeminiModel),
    mcpToolsChatgptWebModel: stringValue(config.mcpToolsChatgptWebModel) ?? stringValue(config.agentChatgptWebModel),
    currentModelPresetId: stringValue(config.currentModelPresetId),
    sttProviderId: isSttProviderId(config.sttProviderId) ? config.sttProviderId : undefined,
    openaiSttModel: stringValue(config.openaiSttModel),
    groqSttModel: stringValue(config.groqSttModel),
    transcriptPostProcessingProviderId: isChatProviderId(config.transcriptPostProcessingProviderId)
      ? config.transcriptPostProcessingProviderId
      : undefined,
    transcriptPostProcessingOpenaiModel: stringValue(config.transcriptPostProcessingOpenaiModel),
    transcriptPostProcessingGroqModel: stringValue(config.transcriptPostProcessingGroqModel),
    transcriptPostProcessingGeminiModel: stringValue(config.transcriptPostProcessingGeminiModel),
    transcriptPostProcessingChatgptWebModel: stringValue(config.transcriptPostProcessingChatgptWebModel),
    ttsProviderId: isTtsProviderId(config.ttsProviderId) ? config.ttsProviderId : undefined,
  })
}

export function normalizeAgentProfileMcpConfigForEdit(
  value: AgentProfileMcpConfigUpdateLike | Record<string, unknown> | null | undefined,
): AgentProfileMcpConfigUpdateLike | undefined {
  if (!value) return undefined

  const config = value as Record<string, unknown>
  return omitUndefinedValues({
    disabledServers: normalizeStringList(config.disabledServers),
    enabledServers: normalizeStringList(config.enabledServers),
    disabledTools: normalizeStringList(config.disabledTools),
    enabledRuntimeTools: normalizeStringList(config.enabledRuntimeTools),
    allServersDisabledByDefault: config.allServersDisabledByDefault === true,
  })
}

export function normalizeAgentProfileSkillsConfigForEdit(
  value: AgentProfileSkillsConfigUpdateLike | Record<string, unknown> | null | undefined,
): AgentProfileSkillsConfigUpdateLike | undefined {
  if (!value) return undefined

  const config = value as Record<string, unknown>
  return omitUndefinedValues({
    enabledSkillIds: normalizeStringList(config.enabledSkillIds),
    allSkillsDisabledByDefault: config.allSkillsDisabledByDefault === true,
  })
}

export function formatAgentProfileModelConfigForRequest(
  modelConfig: AgentProfileModelConfigUpdateLike | null | undefined,
): AgentProfileModelConfigUpdateLike | undefined {
  if (!modelConfig) return undefined
  return { ...modelConfig }
}

export function formatAgentProfileMcpConfigForRequest(
  mcpConfig: AgentProfileMcpConfigUpdateLike | null | undefined,
): AgentProfileMcpConfigUpdateLike | undefined {
  if (!mcpConfig) return undefined
  return {
    disabledServers: mcpConfig.disabledServers,
    enabledServers: mcpConfig.enabledServers,
    disabledTools: mcpConfig.disabledTools,
    enabledRuntimeTools: mcpConfig.enabledRuntimeTools,
    allServersDisabledByDefault: mcpConfig.allServersDisabledByDefault === true,
  }
}

export function formatAgentProfileSkillsConfigForRequest(
  skillsConfig: AgentProfileSkillsConfigUpdateLike | null | undefined,
): AgentProfileSkillsConfigUpdateLike | undefined {
  if (!skillsConfig) return undefined
  return {
    enabledSkillIds: skillsConfig.enabledSkillIds ?? [],
    allSkillsDisabledByDefault: skillsConfig.allSkillsDisabledByDefault === true,
  }
}

export function mergeAgentProfileMcpConfig(
  existingConfig: AgentProfileMcpConfigUpdateLike | undefined,
  updates: Partial<AgentProfileMcpConfigUpdateLike>,
): AgentProfileMcpConfigUpdateLike {
  return {
    ...(existingConfig ?? {}),
    ...(hasOwnUpdate(updates, "disabledServers") && { disabledServers: updates.disabledServers }),
    ...(hasOwnUpdate(updates, "disabledTools") && { disabledTools: updates.disabledTools }),
    ...(hasOwnUpdate(updates, "allServersDisabledByDefault") && { allServersDisabledByDefault: updates.allServersDisabledByDefault }),
    ...(hasOwnUpdate(updates, "enabledServers") && { enabledServers: updates.enabledServers }),
    ...(hasOwnUpdate(updates, "enabledRuntimeTools") && {
      // Empty array is treated as "not configured" (allow all runtime tools) — clear persisted whitelist.
      enabledRuntimeTools: updates.enabledRuntimeTools && updates.enabledRuntimeTools.length > 0
        ? updates.enabledRuntimeTools
        : undefined,
    }),
  }
}

export function isAgentProfileMcpServerEnabled(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  serverName: string,
): boolean {
  if (mcpConfig?.allServersDisabledByDefault) return (mcpConfig.enabledServers ?? []).includes(serverName)
  return !(mcpConfig?.disabledServers ?? []).includes(serverName)
}

export function isAgentProfileMcpToolEnabled(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  toolName: string,
): boolean {
  return !(mcpConfig?.disabledTools ?? []).includes(toolName)
}

export function isAgentProfileRuntimeToolEnabled(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  toolName: string,
  essentialRuntimeToolNames: readonly string[] = DEFAULT_AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES,
): boolean {
  if (essentialRuntimeToolNames.includes(toolName)) return true
  const enabledRuntimeTools = mcpConfig?.enabledRuntimeTools
  if (!enabledRuntimeTools || enabledRuntimeTools.length === 0) return true
  return enabledRuntimeTools.includes(toolName)
}

export function getAgentProfileMcpConfigAfterServerToggle(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  serverName: string,
): AgentProfileMcpConfigUpdateLike {
  if (mcpConfig?.allServersDisabledByDefault) {
    const currentEnabledServers = mcpConfig.enabledServers ?? []
    const enabledServers = currentEnabledServers.includes(serverName)
      ? currentEnabledServers.filter((name) => name !== serverName)
      : [...currentEnabledServers, serverName]

    return mergeAgentProfileMcpConfig(mcpConfig, {
      enabledServers,
      disabledServers: undefined,
      allServersDisabledByDefault: true,
    })
  }

  const currentDisabledServers = mcpConfig?.disabledServers ?? []
  const disabledServers = currentDisabledServers.includes(serverName)
    ? currentDisabledServers.filter((name) => name !== serverName)
    : [...currentDisabledServers, serverName]

  return mergeAgentProfileMcpConfig(mcpConfig, {
    disabledServers,
    enabledServers: undefined,
    allServersDisabledByDefault: false,
  })
}

export function getAgentProfileMcpConfigAfterSetAllServersEnabled(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  enabled: boolean,
): AgentProfileMcpConfigUpdateLike {
  return mergeAgentProfileMcpConfig(mcpConfig, {
    disabledServers: enabled ? [] : undefined,
    enabledServers: enabled ? undefined : [],
    allServersDisabledByDefault: !enabled,
  })
}

export function getAgentProfileMcpConfigAfterToolToggle(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  toolName: string,
): AgentProfileMcpConfigUpdateLike {
  const currentDisabledTools = mcpConfig?.disabledTools ?? []
  const disabledTools = currentDisabledTools.includes(toolName)
    ? currentDisabledTools.filter((name) => name !== toolName)
    : [...currentDisabledTools, toolName]

  return mergeAgentProfileMcpConfig(mcpConfig, {
    disabledTools: disabledTools.length > 0 ? disabledTools : undefined,
  })
}

export function getAgentProfileRuntimeToolsConfigAfterSetAllEnabled(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  enabled: boolean,
  essentialRuntimeToolNames: readonly string[] = DEFAULT_AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES,
): AgentProfileMcpConfigUpdateLike {
  return mergeAgentProfileMcpConfig(mcpConfig, {
    enabledRuntimeTools: enabled ? undefined : [...essentialRuntimeToolNames],
  })
}

export function getAgentProfileRuntimeToolsConfigAfterToggle(
  mcpConfig: AgentProfileMcpConfigUpdateLike | undefined,
  toolName: string,
  allRuntimeToolNames: readonly string[],
  essentialRuntimeToolNames: readonly string[] = DEFAULT_AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES,
): AgentProfileMcpConfigUpdateLike {
  if (essentialRuntimeToolNames.includes(toolName)) {
    return mergeAgentProfileMcpConfig(mcpConfig, {})
  }

  const currentEnabledRuntimeTools = mcpConfig?.enabledRuntimeTools ?? []
  if (currentEnabledRuntimeTools.length === 0) {
    return mergeAgentProfileMcpConfig(mcpConfig, {
      enabledRuntimeTools: allRuntimeToolNames.filter((name) => name !== toolName),
    })
  }

  const currentSet = new Set(currentEnabledRuntimeTools)
  if (currentSet.has(toolName)) {
    currentSet.delete(toolName)
  } else {
    currentSet.add(toolName)
  }

  const allRuntimeToolSet = new Set(allRuntimeToolNames)
  const hasAllRuntimeToolsEnabled = allRuntimeToolNames.length > 0
    && allRuntimeToolNames.every((name) => currentSet.has(name))

  const enabledRuntimeTools = hasAllRuntimeToolsEnabled
    ? []
    : [
      ...allRuntimeToolNames.filter((name) => currentSet.has(name)),
      ...Array.from(currentSet).filter((name) => !allRuntimeToolSet.has(name)),
    ]

  return mergeAgentProfileMcpConfig(mcpConfig, {
    enabledRuntimeTools,
  })
}

export function mergeAgentProfileModelConfig(
  existingConfig: AgentProfileModelConfigUpdateLike | undefined,
  updates: Partial<AgentProfileModelConfigUpdateLike>,
): AgentProfileModelConfigUpdateLike {
  return {
    ...(existingConfig ?? {}),
    ...(updates.agentProviderId !== undefined && { agentProviderId: updates.agentProviderId, mcpToolsProviderId: updates.agentProviderId }),
    ...(updates.agentOpenaiModel !== undefined && { agentOpenaiModel: updates.agentOpenaiModel, mcpToolsOpenaiModel: updates.agentOpenaiModel }),
    ...(updates.agentGroqModel !== undefined && { agentGroqModel: updates.agentGroqModel, mcpToolsGroqModel: updates.agentGroqModel }),
    ...(updates.agentGeminiModel !== undefined && { agentGeminiModel: updates.agentGeminiModel, mcpToolsGeminiModel: updates.agentGeminiModel }),
    ...(updates.agentChatgptWebModel !== undefined && { agentChatgptWebModel: updates.agentChatgptWebModel, mcpToolsChatgptWebModel: updates.agentChatgptWebModel }),
    ...(updates.mcpToolsProviderId !== undefined && { mcpToolsProviderId: updates.mcpToolsProviderId, agentProviderId: updates.mcpToolsProviderId }),
    ...(updates.mcpToolsOpenaiModel !== undefined && { mcpToolsOpenaiModel: updates.mcpToolsOpenaiModel, agentOpenaiModel: updates.mcpToolsOpenaiModel }),
    ...(updates.mcpToolsGroqModel !== undefined && { mcpToolsGroqModel: updates.mcpToolsGroqModel, agentGroqModel: updates.mcpToolsGroqModel }),
    ...(updates.mcpToolsGeminiModel !== undefined && { mcpToolsGeminiModel: updates.mcpToolsGeminiModel, agentGeminiModel: updates.mcpToolsGeminiModel }),
    ...(updates.mcpToolsChatgptWebModel !== undefined && { mcpToolsChatgptWebModel: updates.mcpToolsChatgptWebModel, agentChatgptWebModel: updates.mcpToolsChatgptWebModel }),
    ...(updates.currentModelPresetId !== undefined && { currentModelPresetId: updates.currentModelPresetId }),
    ...(updates.sttProviderId !== undefined && { sttProviderId: updates.sttProviderId }),
    ...(updates.openaiSttModel !== undefined && { openaiSttModel: updates.openaiSttModel }),
    ...(updates.groqSttModel !== undefined && { groqSttModel: updates.groqSttModel }),
    ...(updates.transcriptPostProcessingProviderId !== undefined && { transcriptPostProcessingProviderId: updates.transcriptPostProcessingProviderId }),
    ...(updates.transcriptPostProcessingOpenaiModel !== undefined && { transcriptPostProcessingOpenaiModel: updates.transcriptPostProcessingOpenaiModel }),
    ...(updates.transcriptPostProcessingGroqModel !== undefined && { transcriptPostProcessingGroqModel: updates.transcriptPostProcessingGroqModel }),
    ...(updates.transcriptPostProcessingGeminiModel !== undefined && { transcriptPostProcessingGeminiModel: updates.transcriptPostProcessingGeminiModel }),
    ...(updates.transcriptPostProcessingChatgptWebModel !== undefined && { transcriptPostProcessingChatgptWebModel: updates.transcriptPostProcessingChatgptWebModel }),
    ...(updates.ttsProviderId !== undefined && { ttsProviderId: updates.ttsProviderId }),
  }
}

export function getAgentProfileAgentModelProvider(
  modelConfig: AgentProfileModelConfigUpdateLike | undefined,
): AgentProfileAgentModelProvider | undefined {
  return modelConfig?.agentProviderId ?? modelConfig?.mcpToolsProviderId
}

export function getAgentProfileAgentModelField(
  provider: AgentProfileAgentModelProvider,
): AgentProfileAgentModelField {
  if (provider === "openai") return "agentOpenaiModel"
  if (provider === "groq") return "agentGroqModel"
  if (provider === "gemini") return "agentGeminiModel"
  return "agentChatgptWebModel"
}

export function getAgentProfileAgentModelValue(
  modelConfig: AgentProfileModelConfigUpdateLike | undefined,
  provider: AgentProfileAgentModelProvider,
): string {
  if (!modelConfig) return ""
  if (provider === "openai") return modelConfig.agentOpenaiModel ?? modelConfig.mcpToolsOpenaiModel ?? ""
  if (provider === "groq") return modelConfig.agentGroqModel ?? modelConfig.mcpToolsGroqModel ?? ""
  if (provider === "gemini") return modelConfig.agentGeminiModel ?? modelConfig.mcpToolsGeminiModel ?? ""
  return modelConfig.agentChatgptWebModel ?? modelConfig.mcpToolsChatgptWebModel ?? ""
}

export function buildAgentProfileAgentModelUpdate(
  provider: AgentProfileAgentModelProvider,
  model: string,
): Partial<AgentProfileModelConfigUpdateLike> {
  return {
    agentProviderId: provider,
    [getAgentProfileAgentModelField(provider)]: model,
  }
}

export function mergeAgentProfileSkillsConfig(
  existingConfig: AgentProfileSkillsConfigUpdateLike | undefined,
  updates: Partial<AgentProfileSkillsConfigUpdateLike>,
): AgentProfileSkillsConfigUpdateLike {
  return {
    ...(existingConfig ?? {}),
    ...(updates.enabledSkillIds !== undefined && { enabledSkillIds: updates.enabledSkillIds }),
    ...(updates.allSkillsDisabledByDefault !== undefined && { allSkillsDisabledByDefault: updates.allSkillsDisabledByDefault }),
  }
}

export function hasAllAgentProfileSkillsEnabledByDefault(
  skillsConfig: AgentProfileSkillsConfigUpdateLike | undefined,
): boolean {
  return !skillsConfig || !skillsConfig.allSkillsDisabledByDefault
}

export function getEnabledAgentProfileSkillIds(
  skillsConfig: AgentProfileSkillsConfigUpdateLike | undefined,
): string[] | null {
  if (hasAllAgentProfileSkillsEnabledByDefault(skillsConfig) || !skillsConfig) return null
  return skillsConfig.enabledSkillIds ?? []
}

export function isAgentProfileSkillEnabled(
  skillsConfig: AgentProfileSkillsConfigUpdateLike | undefined,
  skillId: string,
): boolean {
  if (hasAllAgentProfileSkillsEnabledByDefault(skillsConfig) || !skillsConfig) return true
  return (skillsConfig.enabledSkillIds ?? []).includes(skillId)
}

export function toggleAgentProfileSkillConfig(
  skillsConfig: AgentProfileSkillsConfigUpdateLike | undefined,
  skillId: string,
  allSkillIds: string[] = [],
): AgentProfileSkillsConfigUpdateLike {
  if (hasAllAgentProfileSkillsEnabledByDefault(skillsConfig) || !skillsConfig) {
    return {
      enabledSkillIds: allSkillIds.filter((id) => id !== skillId),
      allSkillsDisabledByDefault: true,
    }
  }

  const currentEnabledSkills = skillsConfig.enabledSkillIds ?? []
  const isCurrentlyEnabled = currentEnabledSkills.includes(skillId)
  const nextEnabledSkillIds = isCurrentlyEnabled
    ? currentEnabledSkills.filter((id) => id !== skillId)
    : [...currentEnabledSkills, skillId]

  const allAvailableSkillIds = new Set(allSkillIds)
  const hasAllAvailableSkillsEnabled = allAvailableSkillIds.size > 0
    && Array.from(allAvailableSkillIds).every((id) => nextEnabledSkillIds.includes(id))

  if (hasAllAvailableSkillsEnabled) {
    return {
      enabledSkillIds: [],
      allSkillsDisabledByDefault: false,
    }
  }

  return {
    enabledSkillIds: nextEnabledSkillIds,
    allSkillsDisabledByDefault: true,
  }
}

export function getAgentProfileSkillsConfigAfterEnable(
  skillsConfig: AgentProfileSkillsConfigUpdateLike | undefined,
  skillId: string,
): AgentProfileSkillsConfigUpdateLike | undefined {
  if (hasAllAgentProfileSkillsEnabledByDefault(skillsConfig) || !skillsConfig) return undefined

  const currentEnabledSkills = skillsConfig.enabledSkillIds ?? []
  if (currentEnabledSkills.includes(skillId)) return undefined

  return {
    enabledSkillIds: [...currentEnabledSkills, skillId],
    allSkillsDisabledByDefault: true,
  }
}
