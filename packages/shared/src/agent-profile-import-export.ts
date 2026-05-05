import type {
  AgentProfileMcpServerDefinitionLike,
  AgentProfileModelConfigLike,
  AgentProfileSkillsConfigLike,
} from "./agent-profile-config-validation"
import {
  isReservedAgentProfileMcpServerName,
  isValidAgentProfileMcpServerDefinition,
} from "./agent-profile-config-validation"
import {
  type AgentProfileMcpServerConfigLike,
  type AgentProfileSessionSnapshotProfileLike,
  toolConfigToMcpServerConfig,
} from "./agent-profile-session-snapshot"

export type AgentProfileImportData = {
  name: string
  guidelines?: string
  systemPrompt?: string
  mcpServers?: unknown
  mcpServerConfig?: unknown
  modelConfig?: unknown
  skillsConfig?: unknown
}

export type AgentProfileExportProfileLike = Pick<
  AgentProfileSessionSnapshotProfileLike,
  "displayName" | "guidelines" | "systemPrompt" | "toolConfig" | "modelConfig" | "skillsConfig"
>

export type AgentProfileExportMcpServersLike = Record<string, AgentProfileMcpServerDefinitionLike>

export type AgentProfileImportedMcpServersMergeResult = {
  mcpServers: AgentProfileExportMcpServersLike
  importedServerNames: string[]
  newServerCount: number
}

export type AgentProfileExportData = {
  version: 1
  name: string
  guidelines: string
  systemPrompt?: string
  mcpServerConfig?: AgentProfileMcpServerConfigLike
  modelConfig?: AgentProfileModelConfigLike
  skillsConfig?: AgentProfileSkillsConfigLike
  mcpServers?: Record<string, Omit<AgentProfileMcpServerDefinitionLike, "env" | "headers" | "oauth">>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseAgentProfileImportJson(profileJson: string): AgentProfileImportData {
  const importData = JSON.parse(profileJson) as unknown
  if (!isRecord(importData) || typeof importData.name !== "string" || !importData.name) {
    throw new Error("Invalid profile data: missing or invalid name")
  }
  if (importData.guidelines !== undefined && typeof importData.guidelines !== "string") {
    throw new Error("Invalid profile data: guidelines must be a string")
  }
  if (importData.systemPrompt !== undefined && typeof importData.systemPrompt !== "string") {
    throw new Error("Invalid profile data: systemPrompt must be a string")
  }

  return importData as AgentProfileImportData
}

export function sanitizeAgentProfileMcpServerForExport(
  serverConfig: AgentProfileMcpServerDefinitionLike,
): Omit<AgentProfileMcpServerDefinitionLike, "env" | "headers" | "oauth"> {
  const { env: _env, headers: _headers, oauth: _oauth, ...sanitizedConfig } = serverConfig
  return sanitizedConfig
}

export function mergeImportedAgentProfileMcpServers(
  currentMcpServers: AgentProfileExportMcpServersLike,
  importedMcpServers: unknown,
): AgentProfileImportedMcpServersMergeResult {
  const mergedServers = { ...currentMcpServers }
  const importedServerNames: string[] = []

  if (!isRecord(importedMcpServers)) {
    return {
      mcpServers: mergedServers,
      importedServerNames,
      newServerCount: 0,
    }
  }

  for (const [serverName, serverConfig] of Object.entries(importedMcpServers)) {
    const normalizedServerName = serverName.trim()
    if (!normalizedServerName) continue
    if (["__proto__", "constructor", "prototype"].includes(normalizedServerName)) continue
    if (isReservedAgentProfileMcpServerName(normalizedServerName)) continue
    if (mergedServers[normalizedServerName]) continue
    if (!isValidAgentProfileMcpServerDefinition(serverConfig)) continue

    mergedServers[normalizedServerName] = serverConfig
    importedServerNames.push(normalizedServerName)
  }

  return {
    mcpServers: mergedServers,
    importedServerNames,
    newServerCount: importedServerNames.length,
  }
}

export function getAgentProfileMcpServerNamesForExport(
  mcpServerConfig: AgentProfileMcpServerConfigLike | undefined,
  allServerNames: string[],
): string[] {
  if (!mcpServerConfig) return allServerNames
  if (mcpServerConfig.allServersDisabledByDefault) return mcpServerConfig.enabledServers || []
  return allServerNames.filter((name) => !(mcpServerConfig.disabledServers || []).includes(name))
}

export function buildAgentProfileExportData(
  profile: AgentProfileExportProfileLike,
  mcpServers?: AgentProfileExportMcpServersLike,
): AgentProfileExportData {
  const mcpServerConfig = toolConfigToMcpServerConfig(profile.toolConfig)
  const exportData: AgentProfileExportData = {
    version: 1,
    name: profile.displayName,
    guidelines: profile.guidelines || "",
  }

  if (profile.systemPrompt) exportData.systemPrompt = profile.systemPrompt
  if (mcpServerConfig) exportData.mcpServerConfig = mcpServerConfig
  if (profile.modelConfig) exportData.modelConfig = profile.modelConfig as AgentProfileModelConfigLike
  if (profile.skillsConfig) exportData.skillsConfig = profile.skillsConfig

  if (mcpServers) {
    const enabledServers: Record<string, Omit<AgentProfileMcpServerDefinitionLike, "env" | "headers" | "oauth">> = {}
    const serverNamesToExport = getAgentProfileMcpServerNamesForExport(
      mcpServerConfig,
      Object.keys(mcpServers),
    )

    for (const serverName of serverNamesToExport) {
      const serverConfig = mcpServers[serverName]
      if (serverConfig) {
        enabledServers[serverName] = sanitizeAgentProfileMcpServerForExport(serverConfig)
      }
    }

    if (Object.keys(enabledServers).length > 0) {
      exportData.mcpServers = enabledServers
    }
  }

  return exportData
}

export function serializeAgentProfileExport(
  profile: AgentProfileExportProfileLike,
  mcpServers?: AgentProfileExportMcpServersLike,
): string {
  return JSON.stringify(buildAgentProfileExportData(profile, mcpServers), null, 2)
}
