import type { Settings } from "./api-types"
import { formatConfigListInput } from "./config-list-input"
import { MCP_MAX_ITERATIONS_DEFAULT } from "./mcp-api"

export const REMOTE_SETTINGS_SECRET_MASK = "••••••••"

export type RemoteSettingsInputDrafts = Record<string, string>

export function getRemoteSettingsSecretInputDraft(
  value: string | undefined,
  secretMask: string = REMOTE_SETTINGS_SECRET_MASK,
): string {
  return value === secretMask ? "" : value || ""
}

export function buildRemoteSettingsInputDrafts(
  settings: Settings,
  options: { secretMask?: string } = {},
): RemoteSettingsInputDrafts {
  const secretMask = options.secretMask ?? REMOTE_SETTINGS_SECRET_MASK

  return {
    sttLanguage: settings.sttLanguage || "",
    openaiSttLanguage: settings.openaiSttLanguage || "",
    groqSttLanguage: settings.groqSttLanguage || "",
    groqSttPrompt: settings.groqSttPrompt || "",
    transcriptPostProcessingPrompt: settings.transcriptPostProcessingPrompt || "",
    transcriptPostProcessingOpenaiModel: settings.transcriptPostProcessingOpenaiModel || "",
    transcriptPostProcessingGroqModel: settings.transcriptPostProcessingGroqModel || "",
    transcriptPostProcessingGeminiModel: settings.transcriptPostProcessingGeminiModel || "",
    transcriptPostProcessingChatgptWebModel: settings.transcriptPostProcessingChatgptWebModel || "",
    mcpMaxIterations: String(settings.mcpMaxIterations ?? MCP_MAX_ITERATIONS_DEFAULT),
    whatsappAllowFrom: formatConfigListInput(settings.whatsappAllowFrom),
    discordBotToken: getRemoteSettingsSecretInputDraft(settings.discordBotToken, secretMask),
    discordAllowUserIds: formatConfigListInput(settings.discordAllowUserIds, { separator: "newline" }),
    discordAllowGuildIds: formatConfigListInput(settings.discordAllowGuildIds, { separator: "newline" }),
    discordAllowChannelIds: formatConfigListInput(settings.discordAllowChannelIds, { separator: "newline" }),
    discordAllowRoleIds: formatConfigListInput(settings.discordAllowRoleIds, { separator: "newline" }),
    discordDmAllowUserIds: formatConfigListInput(settings.discordDmAllowUserIds, { separator: "newline" }),
    openaiApiKey: getRemoteSettingsSecretInputDraft(settings.openaiApiKey, secretMask),
    openaiBaseUrl: settings.openaiBaseUrl || "",
    groqApiKey: getRemoteSettingsSecretInputDraft(settings.groqApiKey, secretMask),
    groqBaseUrl: settings.groqBaseUrl || "",
    geminiApiKey: getRemoteSettingsSecretInputDraft(settings.geminiApiKey, secretMask),
    geminiBaseUrl: settings.geminiBaseUrl || "",
    langfusePublicKey: settings.langfusePublicKey || "",
    langfuseSecretKey: getRemoteSettingsSecretInputDraft(settings.langfuseSecretKey, secretMask),
    langfuseBaseUrl: settings.langfuseBaseUrl || "",
    localTraceLogPath: settings.localTraceLogPath || "",
  }
}
