import {
  CHAT_PROVIDER_IDS,
  STT_PROVIDERS,
  TTS_PROVIDERS,
  type CHAT_PROVIDER_ID,
  type STT_PROVIDER_ID,
  type TTS_PROVIDER_ID,
} from "./providers"
import { RESERVED_RUNTIME_TOOL_SERVER_NAMES } from "./mcp-api"

const MCP_SERVER_TRANSPORTS = ["stdio", "websocket", "streamableHttp"] as const
const STT_PROVIDER_IDS = STT_PROVIDERS.map((provider) => provider.value)
const TTS_PROVIDER_IDS = TTS_PROVIDERS.map((provider) => provider.value)

export type AgentProfileMcpServerDefinitionLike = {
  transport?: (typeof MCP_SERVER_TRANSPORTS)[number]
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
  headers?: Record<string, string>
  timeout?: number
  disabled?: boolean
  oauth?: {
    clientId?: string
    clientSecret?: string
    scope?: string
    redirectUri?: string
    useDiscovery?: boolean
    useDynamicRegistration?: boolean
    serverMetadata?: {
      authorization_endpoint?: string
      token_endpoint?: string
      issuer?: string
    }
  }
}

export type AgentProfileMcpServerValidationConfigLike = {
  disabledServers?: string[]
  disabledTools?: string[]
  enabledServers?: string[]
  enabledRuntimeTools?: string[]
  allServersDisabledByDefault?: boolean
}

export type AgentProfileModelConfigLike = {
  agentProviderId?: CHAT_PROVIDER_ID
  mcpToolsProviderId?: CHAT_PROVIDER_ID
  transcriptPostProcessingProviderId?: CHAT_PROVIDER_ID
  sttProviderId?: STT_PROVIDER_ID
  ttsProviderId?: TTS_PROVIDER_ID
  agentOpenaiModel?: string
  agentGroqModel?: string
  agentGeminiModel?: string
  agentChatgptWebModel?: string
  mcpToolsOpenaiModel?: string
  mcpToolsGroqModel?: string
  mcpToolsGeminiModel?: string
  mcpToolsChatgptWebModel?: string
  currentModelPresetId?: string
  openaiSttModel?: string
  groqSttModel?: string
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
  transcriptPostProcessingChatgptWebModel?: string
}

export type AgentProfileSkillsConfigLike = {
  enabledSkillIds?: string[]
  allSkillsDisabledByDefault?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function hasOnlyStringValues(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string")
}

export function isReservedAgentProfileMcpServerName(
  serverName: string,
  reservedServerNames: readonly string[] = RESERVED_RUNTIME_TOOL_SERVER_NAMES,
): boolean {
  const normalizedServerName = serverName.trim().toLowerCase()
  return reservedServerNames.some((reservedName) => reservedName.toLowerCase() === normalizedServerName)
}

export function isValidAgentProfileMcpServerDefinition(
  config: unknown,
): config is AgentProfileMcpServerDefinitionLike {
  if (!isRecord(config)) return false

  if (config.transport !== undefined) {
    if (typeof config.transport !== "string" || !(MCP_SERVER_TRANSPORTS as readonly string[]).includes(config.transport)) return false
  }
  if (config.command !== undefined && typeof config.command !== "string") return false
  if (config.args !== undefined && !isStringArray(config.args)) return false
  if (config.url !== undefined && typeof config.url !== "string") return false

  const transport = config.transport as string | undefined
  if (transport === "stdio" && !config.command) return false
  if ((transport === "websocket" || transport === "streamableHttp") && !config.url) return false
  if (transport === undefined && !config.command && !config.url) return false

  if (config.env !== undefined && !hasOnlyStringValues(config.env)) return false
  if (config.headers !== undefined && !hasOnlyStringValues(config.headers)) return false
  if (config.timeout !== undefined && typeof config.timeout !== "number") return false
  if (config.disabled !== undefined && typeof config.disabled !== "boolean") return false

  if (config.oauth !== undefined) {
    if (!isRecord(config.oauth)) return false
    const oauth = config.oauth
    if (oauth.clientId !== undefined && typeof oauth.clientId !== "string") return false
    if (oauth.clientSecret !== undefined && typeof oauth.clientSecret !== "string") return false
    if (oauth.scope !== undefined && typeof oauth.scope !== "string") return false
    if (oauth.redirectUri !== undefined && typeof oauth.redirectUri !== "string") return false
    if (oauth.useDiscovery !== undefined && typeof oauth.useDiscovery !== "boolean") return false
    if (oauth.useDynamicRegistration !== undefined && typeof oauth.useDynamicRegistration !== "boolean") return false
    if (oauth.serverMetadata !== undefined) {
      if (!isRecord(oauth.serverMetadata)) return false
      const serverMetadata = oauth.serverMetadata
      if (serverMetadata.authorization_endpoint !== undefined && typeof serverMetadata.authorization_endpoint !== "string") return false
      if (serverMetadata.token_endpoint !== undefined && typeof serverMetadata.token_endpoint !== "string") return false
      if (serverMetadata.issuer !== undefined && typeof serverMetadata.issuer !== "string") return false
    }
  }

  return true
}

export function isValidAgentProfileMcpServerConfig(
  config: unknown,
): config is Partial<AgentProfileMcpServerValidationConfigLike> {
  if (!isRecord(config)) return false
  if (config.disabledServers !== undefined && !isStringArray(config.disabledServers)) return false
  if (config.disabledTools !== undefined && !isStringArray(config.disabledTools)) return false
  if (config.enabledServers !== undefined && !isStringArray(config.enabledServers)) return false
  if (config.enabledRuntimeTools !== undefined && !isStringArray(config.enabledRuntimeTools)) return false
  if (config.allServersDisabledByDefault !== undefined && typeof config.allServersDisabledByDefault !== "boolean") return false
  return true
}

export function isValidAgentProfileModelConfig(
  config: unknown,
): config is Partial<AgentProfileModelConfigLike> {
  if (!isRecord(config)) return false

  for (const field of ["agentProviderId", "mcpToolsProviderId", "transcriptPostProcessingProviderId"]) {
    if (config[field] !== undefined) {
      if (typeof config[field] !== "string" || !CHAT_PROVIDER_IDS.includes(config[field] as CHAT_PROVIDER_ID)) return false
    }
  }
  if (config.sttProviderId !== undefined) {
    if (typeof config.sttProviderId !== "string" || !STT_PROVIDER_IDS.includes(config.sttProviderId as STT_PROVIDER_ID)) return false
  }
  if (config.ttsProviderId !== undefined) {
    if (typeof config.ttsProviderId !== "string" || !TTS_PROVIDER_IDS.includes(config.ttsProviderId as TTS_PROVIDER_ID)) return false
  }

  for (const field of [
    "agentOpenaiModel",
    "agentGroqModel",
    "agentGeminiModel",
    "agentChatgptWebModel",
    "mcpToolsOpenaiModel",
    "mcpToolsGroqModel",
    "mcpToolsGeminiModel",
    "mcpToolsChatgptWebModel",
    "currentModelPresetId",
    "openaiSttModel",
    "groqSttModel",
    "transcriptPostProcessingOpenaiModel",
    "transcriptPostProcessingGroqModel",
    "transcriptPostProcessingGeminiModel",
    "transcriptPostProcessingChatgptWebModel",
  ]) {
    if (config[field] !== undefined && typeof config[field] !== "string") return false
  }

  return true
}

export function isValidAgentProfileSkillsConfig(
  config: unknown,
): config is Partial<AgentProfileSkillsConfigLike> {
  if (!isRecord(config)) return false
  if (config.enabledSkillIds !== undefined && !isStringArray(config.enabledSkillIds)) return false
  if (config.allSkillsDisabledByDefault !== undefined && typeof config.allSkillsDisabledByDefault !== "boolean") return false
  return true
}
