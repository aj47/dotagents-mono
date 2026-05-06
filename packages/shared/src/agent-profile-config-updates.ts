import type {
  AgentProfileMcpServerValidationConfigLike,
  AgentProfileModelConfigLike,
  AgentProfileSkillsConfigLike,
} from "./agent-profile-config-validation"

export type AgentProfileMcpConfigUpdateLike = AgentProfileMcpServerValidationConfigLike
export type AgentProfileModelConfigUpdateLike = AgentProfileModelConfigLike
export type AgentProfileSkillsConfigUpdateLike = AgentProfileSkillsConfigLike

const DEFAULT_AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES = ["mark_work_complete"]

function hasOwnUpdate<T extends object>(
  updates: T,
  key: keyof T,
): boolean {
  return Object.prototype.hasOwnProperty.call(updates, key)
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
