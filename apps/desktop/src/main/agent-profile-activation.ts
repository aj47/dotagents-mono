import { configStore } from "./config"
import { mcpService } from "./mcp-service"
import {
  agentProfileService,
  toolConfigToMcpServerConfig,
} from "./agent-profile-service"
import type { AgentProfile, Config } from "@shared/types"

export function buildConfigForActivatedProfile(
  config: Config,
  profile: AgentProfile,
): Config {
  const nextConfig: Config = {
    ...config,
    mcpCurrentProfileId: profile.id,
  }
  const modelConfig = profile.modelConfig

  if (!modelConfig) {
    return nextConfig
  }

  if (modelConfig.mcpToolsProviderId !== undefined) {
    nextConfig.mcpToolsProviderId = modelConfig.mcpToolsProviderId
  }
  if (modelConfig.mcpToolsOpenaiModel !== undefined) {
    nextConfig.mcpToolsOpenaiModel = modelConfig.mcpToolsOpenaiModel
  }
  if (modelConfig.mcpToolsGroqModel !== undefined) {
    nextConfig.mcpToolsGroqModel = modelConfig.mcpToolsGroqModel
  }
  if (modelConfig.mcpToolsGeminiModel !== undefined) {
    nextConfig.mcpToolsGeminiModel = modelConfig.mcpToolsGeminiModel
  }
  if (modelConfig.currentModelPresetId !== undefined) {
    nextConfig.currentModelPresetId = modelConfig.currentModelPresetId
  }
  if (modelConfig.sttProviderId !== undefined) {
    nextConfig.sttProviderId = modelConfig.sttProviderId
  }
  if (modelConfig.openaiSttModel !== undefined) {
    nextConfig.openaiSttModel = modelConfig.openaiSttModel
  }
  if (modelConfig.groqSttModel !== undefined) {
    nextConfig.groqSttModel = modelConfig.groqSttModel
  }
  if (modelConfig.transcriptPostProcessingProviderId !== undefined) {
    nextConfig.transcriptPostProcessingProviderId =
      modelConfig.transcriptPostProcessingProviderId
  }
  if (modelConfig.transcriptPostProcessingOpenaiModel !== undefined) {
    nextConfig.transcriptPostProcessingOpenaiModel =
      modelConfig.transcriptPostProcessingOpenaiModel
  }
  if (modelConfig.transcriptPostProcessingGroqModel !== undefined) {
    nextConfig.transcriptPostProcessingGroqModel =
      modelConfig.transcriptPostProcessingGroqModel
  }
  if (modelConfig.transcriptPostProcessingGeminiModel !== undefined) {
    nextConfig.transcriptPostProcessingGeminiModel =
      modelConfig.transcriptPostProcessingGeminiModel
  }
  if (modelConfig.ttsProviderId !== undefined) {
    nextConfig.ttsProviderId = modelConfig.ttsProviderId
  }

  return nextConfig
}

function applyActivatedAgentProfile(profile: AgentProfile): AgentProfile {
  configStore.save(buildConfigForActivatedProfile(configStore.get(), profile))

  const mcpServerConfig = toolConfigToMcpServerConfig(profile.toolConfig)
  mcpService.applyProfileMcpConfig(
    mcpServerConfig?.disabledServers ?? [],
    mcpServerConfig?.disabledTools ?? [],
    mcpServerConfig?.allServersDisabledByDefault ?? false,
    mcpServerConfig?.enabledServers ?? [],
    mcpServerConfig?.enabledRuntimeTools ?? [],
  )

  return profile
}

export function activateAgentProfile(profile: AgentProfile): AgentProfile {
  agentProfileService.setCurrentProfile(profile.id)
  return applyActivatedAgentProfile(profile)
}

export function activateAgentProfileById(profileId: string): AgentProfile {
  const profile = agentProfileService.setCurrentProfileStrict(profileId)
  return applyActivatedAgentProfile(profile)
}
