import type {
  AgentProfileMcpServerValidationConfigLike,
  AgentProfileModelConfigLike,
  AgentProfileSkillsConfigLike,
} from "./agent-profile-config-validation"

export type AgentProfileMcpConfigUpdateLike = AgentProfileMcpServerValidationConfigLike
export type AgentProfileModelConfigUpdateLike = AgentProfileModelConfigLike
export type AgentProfileSkillsConfigUpdateLike = AgentProfileSkillsConfigLike

export function mergeAgentProfileMcpConfig(
  existingConfig: AgentProfileMcpConfigUpdateLike | undefined,
  updates: Partial<AgentProfileMcpConfigUpdateLike>,
): AgentProfileMcpConfigUpdateLike {
  return {
    ...(existingConfig ?? {}),
    ...(updates.disabledServers !== undefined && { disabledServers: updates.disabledServers }),
    ...(updates.disabledTools !== undefined && { disabledTools: updates.disabledTools }),
    ...(updates.allServersDisabledByDefault !== undefined && { allServersDisabledByDefault: updates.allServersDisabledByDefault }),
    ...(updates.enabledServers !== undefined && { enabledServers: updates.enabledServers }),
    ...(updates.enabledRuntimeTools !== undefined && {
      // Empty array is treated as "not configured" (allow all runtime tools) — clear persisted whitelist.
      enabledRuntimeTools: updates.enabledRuntimeTools.length > 0
        ? updates.enabledRuntimeTools
        : undefined,
    }),
  }
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
