import { app } from "electron"
import {
  getSelectableMainAcpAgents,
  resolveChatProviderId,
  resolveModelPresetId,
  resolveModelPresets,
  resolveSttModelSelection,
  resolveSttProviderId,
  resolveTtsProviderId,
  resolveTtsSelection,
  sanitizeConversationSessionState,
} from "@dotagents/shared"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { agentProfileService } from "./agent-profile-service"
import { syncConfiguredRemoteAccess } from "./remote-access-runtime"
import {
  getInternalWhatsAppServerPath,
  mcpService,
  WHATSAPP_SERVER_NAME,
} from "./mcp-service"
import type { Config, MCPConfig } from "../shared/types"
import {
  DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
  DEFAULT_REMOTE_SERVER_PORT,
} from "../shared/remote-server-url"

const MASKED_SECRET_VALUE = "••••••••"
const VALID_CHAT_PROVIDERS = ["openai", "groq", "gemini"] as const
const VALID_STT_PROVIDERS = ["openai", "groq", "parakeet"] as const
const VALID_TTS_PROVIDERS = [
  "openai",
  "groq",
  "gemini",
  "kitten",
  "supertonic",
] as const
const VALID_AGENT_MODES = ["api", "acp"] as const
const VALID_REMOTE_SERVER_BIND_ADDRESSES = ["127.0.0.1", "0.0.0.0"] as const
const VALID_REMOTE_SERVER_LOG_LEVELS = ["error", "info", "debug"] as const
const VALID_GROQ_TTS_MODELS = [
  "canopylabs/orpheus-v1-english",
  "canopylabs/orpheus-arabic-saudi",
] as const
const VALID_GEMINI_TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
  "gemini-2.5-pro-preview-tts",
] as const

type ManagedSettingsInput = Record<string, unknown>

function isOneOf<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
): value is TValue {
  return typeof value === "string" && allowed.includes(value as TValue)
}

function getStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter((entry): entry is string => typeof entry === "string")
}

export function getManagedSettingsSnapshot(config: Config = configStore.get()) {
  const availablePresets = resolveModelPresets(config)
  const openaiSttSelection = resolveSttModelSelection(config, "openai")
  const groqSttSelection = resolveSttModelSelection(config, "groq")
  const openaiTtsSelection = resolveTtsSelection(config, "openai")
  const groqTtsSelection = resolveTtsSelection(config, "groq")
  const geminiTtsSelection = resolveTtsSelection(config, "gemini")
  const conversationSessionState = sanitizeConversationSessionState(config)
  const acpAgents = getSelectableMainAcpAgents(
    agentProfileService.getAll(),
    agentProfileService.getExternalAgents(),
  ).map((agent) => ({
    name: agent.name,
    displayName: agent.displayName,
  }))

  return {
    mcpToolsProviderId: resolveChatProviderId(config),
    mcpToolsOpenaiModel: config.mcpToolsOpenaiModel,
    mcpToolsGroqModel: config.mcpToolsGroqModel,
    mcpToolsGeminiModel: config.mcpToolsGeminiModel,
    currentModelPresetId: resolveModelPresetId(config),
    availablePresets: availablePresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      baseUrl: preset.baseUrl,
      isBuiltIn: preset.isBuiltIn ?? false,
    })),
    predefinedPrompts: (config.predefinedPrompts || []).map((prompt) => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    })),
    transcriptPostProcessingEnabled:
      config.transcriptPostProcessingEnabled ?? true,
    mcpRequireApprovalBeforeToolCall:
      config.mcpRequireApprovalBeforeToolCall ?? false,
    ttsEnabled: config.ttsEnabled ?? true,
    whatsappEnabled: config.whatsappEnabled ?? false,
    mcpMaxIterations: config.mcpMaxIterations ?? 10,
    streamerModeEnabled: config.streamerModeEnabled ?? false,
    sttLanguage: config.sttLanguage ?? "",
    transcriptionPreviewEnabled: config.transcriptionPreviewEnabled ?? true,
    transcriptPostProcessingPrompt:
      config.transcriptPostProcessingPrompt ?? "",
    ttsAutoPlay: config.ttsAutoPlay ?? true,
    ttsPreprocessingEnabled: config.ttsPreprocessingEnabled ?? true,
    ttsRemoveCodeBlocks: config.ttsRemoveCodeBlocks ?? true,
    ttsRemoveUrls: config.ttsRemoveUrls ?? true,
    ttsConvertMarkdown: config.ttsConvertMarkdown ?? true,
    ttsUseLLMPreprocessing: config.ttsUseLLMPreprocessing ?? false,
    mainAgentMode: config.mainAgentMode ?? "api",
    mcpMessageQueueEnabled: config.mcpMessageQueueEnabled ?? true,
    mcpVerifyCompletionEnabled: config.mcpVerifyCompletionEnabled ?? true,
    mcpFinalSummaryEnabled: config.mcpFinalSummaryEnabled ?? false,
    dualModelEnabled: config.dualModelEnabled ?? false,
    mcpUnlimitedIterations: config.mcpUnlimitedIterations ?? true,
    mcpContextReductionEnabled: config.mcpContextReductionEnabled ?? true,
    mcpToolResponseProcessingEnabled:
      config.mcpToolResponseProcessingEnabled ?? true,
    mcpParallelToolExecution: config.mcpParallelToolExecution ?? true,
    whatsappAllowFrom: config.whatsappAllowFrom ?? [],
    whatsappAutoReply: config.whatsappAutoReply ?? false,
    whatsappLogMessages: config.whatsappLogMessages ?? false,
    langfuseEnabled: config.langfuseEnabled ?? false,
    langfusePublicKey: config.langfusePublicKey ?? "",
    langfuseSecretKey: config.langfuseSecretKey ? MASKED_SECRET_VALUE : "",
    langfuseBaseUrl: config.langfuseBaseUrl ?? "",
    sttProviderId: resolveSttProviderId(config),
    openaiSttModel: openaiSttSelection.model ?? "",
    groqSttModel: groqSttSelection.model ?? "",
    ttsProviderId: resolveTtsProviderId(config),
    transcriptPostProcessingProviderId: resolveChatProviderId(
      config,
      "transcript",
    ),
    transcriptPostProcessingOpenaiModel:
      config.transcriptPostProcessingOpenaiModel || "",
    transcriptPostProcessingGroqModel:
      config.transcriptPostProcessingGroqModel || "",
    transcriptPostProcessingGeminiModel:
      config.transcriptPostProcessingGeminiModel || "",
    mainAgentName: config.mainAgentName || "",
    acpInjectRuntimeTools: config.acpInjectRuntimeTools !== false,
    openaiTtsModel: openaiTtsSelection.model,
    openaiTtsVoice: openaiTtsSelection.voice,
    openaiTtsSpeed: openaiTtsSelection.speed,
    groqTtsModel: groqTtsSelection.model,
    groqTtsVoice: groqTtsSelection.voice,
    geminiTtsModel: geminiTtsSelection.model,
    geminiTtsVoice: geminiTtsSelection.voice,
    remoteServerEnabled: config.remoteServerEnabled ?? false,
    remoteServerPort: config.remoteServerPort ?? DEFAULT_REMOTE_SERVER_PORT,
    remoteServerBindAddress:
      config.remoteServerBindAddress ?? DEFAULT_REMOTE_SERVER_BIND_ADDRESS,
    remoteServerApiKey: config.remoteServerApiKey ? MASKED_SECRET_VALUE : "",
    remoteServerLogLevel: config.remoteServerLogLevel ?? "info",
    remoteServerCorsOrigins: config.remoteServerCorsOrigins ?? [],
    remoteServerAutoShowPanel: config.remoteServerAutoShowPanel ?? false,
    remoteServerTerminalQrEnabled:
      config.remoteServerTerminalQrEnabled ?? false,
    acpAgents,
    pinnedSessionIds: conversationSessionState.pinnedSessionIds,
    archivedSessionIds: conversationSessionState.archivedSessionIds,
  }
}

export function getManagedSettingsUpdates(
  input: ManagedSettingsInput,
  currentConfig: Config = configStore.get(),
): Partial<Config> {
  const updates: Partial<Config> = {}

  if (typeof input.transcriptPostProcessingEnabled === "boolean") {
    updates.transcriptPostProcessingEnabled =
      input.transcriptPostProcessingEnabled
  }
  if (typeof input.mcpRequireApprovalBeforeToolCall === "boolean") {
    updates.mcpRequireApprovalBeforeToolCall =
      input.mcpRequireApprovalBeforeToolCall
  }
  if (typeof input.ttsEnabled === "boolean") {
    updates.ttsEnabled = input.ttsEnabled
  }
  if (typeof input.whatsappEnabled === "boolean") {
    updates.whatsappEnabled = input.whatsappEnabled
  }
  if (
    typeof input.mcpMaxIterations === "number" &&
    input.mcpMaxIterations >= 1 &&
    input.mcpMaxIterations <= 100
  ) {
    updates.mcpMaxIterations = Math.floor(input.mcpMaxIterations)
  }
  if (isOneOf(input.mcpToolsProviderId, VALID_CHAT_PROVIDERS)) {
    updates.mcpToolsProviderId = input.mcpToolsProviderId
  }
  if (typeof input.mcpToolsOpenaiModel === "string") {
    updates.mcpToolsOpenaiModel = input.mcpToolsOpenaiModel
  }
  if (typeof input.mcpToolsGroqModel === "string") {
    updates.mcpToolsGroqModel = input.mcpToolsGroqModel
  }
  if (typeof input.mcpToolsGeminiModel === "string") {
    updates.mcpToolsGeminiModel = input.mcpToolsGeminiModel
  }
  if (typeof input.currentModelPresetId === "string") {
    const validPresetIds = new Set(
      resolveModelPresets(currentConfig).map((preset) => preset.id),
    )
    if (validPresetIds.has(input.currentModelPresetId)) {
      updates.currentModelPresetId = input.currentModelPresetId
    }
  }
  if (typeof input.streamerModeEnabled === "boolean") {
    updates.streamerModeEnabled = input.streamerModeEnabled
  }
  if (typeof input.sttLanguage === "string") {
    updates.sttLanguage = input.sttLanguage
  }
  if (typeof input.transcriptionPreviewEnabled === "boolean") {
    updates.transcriptionPreviewEnabled = input.transcriptionPreviewEnabled
  }
  if (typeof input.transcriptPostProcessingPrompt === "string") {
    updates.transcriptPostProcessingPrompt =
      input.transcriptPostProcessingPrompt
  }
  if (typeof input.ttsAutoPlay === "boolean") {
    updates.ttsAutoPlay = input.ttsAutoPlay
  }
  if (typeof input.ttsPreprocessingEnabled === "boolean") {
    updates.ttsPreprocessingEnabled = input.ttsPreprocessingEnabled
  }
  if (typeof input.ttsRemoveCodeBlocks === "boolean") {
    updates.ttsRemoveCodeBlocks = input.ttsRemoveCodeBlocks
  }
  if (typeof input.ttsRemoveUrls === "boolean") {
    updates.ttsRemoveUrls = input.ttsRemoveUrls
  }
  if (typeof input.ttsConvertMarkdown === "boolean") {
    updates.ttsConvertMarkdown = input.ttsConvertMarkdown
  }
  if (typeof input.ttsUseLLMPreprocessing === "boolean") {
    updates.ttsUseLLMPreprocessing = input.ttsUseLLMPreprocessing
  }
  if (isOneOf(input.mainAgentMode, VALID_AGENT_MODES)) {
    updates.mainAgentMode = input.mainAgentMode
  }
  if (typeof input.mcpMessageQueueEnabled === "boolean") {
    updates.mcpMessageQueueEnabled = input.mcpMessageQueueEnabled
  }
  if (typeof input.mcpVerifyCompletionEnabled === "boolean") {
    updates.mcpVerifyCompletionEnabled = input.mcpVerifyCompletionEnabled
  }
  if (typeof input.mcpFinalSummaryEnabled === "boolean") {
    updates.mcpFinalSummaryEnabled = input.mcpFinalSummaryEnabled
  }
  if (typeof input.dualModelEnabled === "boolean") {
    updates.dualModelEnabled = input.dualModelEnabled
  }
  if (typeof input.mcpUnlimitedIterations === "boolean") {
    updates.mcpUnlimitedIterations = input.mcpUnlimitedIterations
  }
  if (typeof input.mcpContextReductionEnabled === "boolean") {
    updates.mcpContextReductionEnabled = input.mcpContextReductionEnabled
  }
  if (typeof input.mcpToolResponseProcessingEnabled === "boolean") {
    updates.mcpToolResponseProcessingEnabled =
      input.mcpToolResponseProcessingEnabled
  }
  if (typeof input.mcpParallelToolExecution === "boolean") {
    updates.mcpParallelToolExecution = input.mcpParallelToolExecution
  }

  const whatsappAllowFrom = getStringArray(input.whatsappAllowFrom)
  if (whatsappAllowFrom) {
    updates.whatsappAllowFrom = whatsappAllowFrom
  }
  if (typeof input.whatsappAutoReply === "boolean") {
    updates.whatsappAutoReply = input.whatsappAutoReply
  }
  if (typeof input.whatsappLogMessages === "boolean") {
    updates.whatsappLogMessages = input.whatsappLogMessages
  }

  if (typeof input.langfuseEnabled === "boolean") {
    updates.langfuseEnabled = input.langfuseEnabled
  }
  if (typeof input.langfusePublicKey === "string") {
    updates.langfusePublicKey = input.langfusePublicKey
  }
  if (
    typeof input.langfuseSecretKey === "string" &&
    input.langfuseSecretKey !== MASKED_SECRET_VALUE
  ) {
    updates.langfuseSecretKey = input.langfuseSecretKey
  }
  if (typeof input.langfuseBaseUrl === "string") {
    updates.langfuseBaseUrl = input.langfuseBaseUrl
  }

  if (isOneOf(input.sttProviderId, VALID_STT_PROVIDERS)) {
    updates.sttProviderId = input.sttProviderId
  }
  if (typeof input.openaiSttModel === "string") {
    updates.openaiSttModel = input.openaiSttModel
  }
  if (typeof input.groqSttModel === "string") {
    updates.groqSttModel = input.groqSttModel
  }

  if (isOneOf(input.ttsProviderId, VALID_TTS_PROVIDERS)) {
    updates.ttsProviderId = input.ttsProviderId
  }
  if (
    isOneOf(
      input.transcriptPostProcessingProviderId,
      VALID_CHAT_PROVIDERS,
    )
  ) {
    updates.transcriptPostProcessingProviderId =
      input.transcriptPostProcessingProviderId
  }
  if (typeof input.transcriptPostProcessingOpenaiModel === "string") {
    updates.transcriptPostProcessingOpenaiModel =
      input.transcriptPostProcessingOpenaiModel
  }
  if (typeof input.transcriptPostProcessingGroqModel === "string") {
    updates.transcriptPostProcessingGroqModel =
      input.transcriptPostProcessingGroqModel
  }
  if (typeof input.transcriptPostProcessingGeminiModel === "string") {
    updates.transcriptPostProcessingGeminiModel =
      input.transcriptPostProcessingGeminiModel
  }
  if (typeof input.mainAgentName === "string") {
    updates.mainAgentName = input.mainAgentName
  }
  if (typeof input.acpInjectRuntimeTools === "boolean") {
    updates.acpInjectRuntimeTools = input.acpInjectRuntimeTools
  }

  if (typeof input.openaiTtsModel === "string") {
    updates.openaiTtsModel = input.openaiTtsModel as
      | "gpt-4o-mini-tts"
      | "tts-1"
      | "tts-1-hd"
  }
  if (typeof input.openaiTtsVoice === "string") {
    updates.openaiTtsVoice = input.openaiTtsVoice as
      | "alloy"
      | "echo"
      | "fable"
      | "onyx"
      | "nova"
      | "shimmer"
  }
  if (
    typeof input.openaiTtsSpeed === "number" &&
    input.openaiTtsSpeed >= 0.25 &&
    input.openaiTtsSpeed <= 4.0
  ) {
    updates.openaiTtsSpeed = input.openaiTtsSpeed
  }
  if (isOneOf(input.groqTtsModel, VALID_GROQ_TTS_MODELS)) {
    updates.groqTtsModel = input.groqTtsModel
  }
  if (typeof input.groqTtsVoice === "string") {
    updates.groqTtsVoice = input.groqTtsVoice
  }
  if (isOneOf(input.geminiTtsModel, VALID_GEMINI_TTS_MODELS)) {
    updates.geminiTtsModel = input.geminiTtsModel
  }
  if (typeof input.geminiTtsVoice === "string") {
    updates.geminiTtsVoice = input.geminiTtsVoice
  }

  if (typeof input.remoteServerEnabled === "boolean") {
    updates.remoteServerEnabled = input.remoteServerEnabled
  }
  if (
    typeof input.remoteServerPort === "number" &&
    input.remoteServerPort >= 1 &&
    input.remoteServerPort <= 65535
  ) {
    updates.remoteServerPort = Math.floor(input.remoteServerPort)
  }
  if (
    isOneOf(
      input.remoteServerBindAddress,
      VALID_REMOTE_SERVER_BIND_ADDRESSES,
    )
  ) {
    updates.remoteServerBindAddress = input.remoteServerBindAddress
  }
  if (
    typeof input.remoteServerApiKey === "string" &&
    input.remoteServerApiKey !== MASKED_SECRET_VALUE
  ) {
    updates.remoteServerApiKey = input.remoteServerApiKey
  }
  if (isOneOf(input.remoteServerLogLevel, VALID_REMOTE_SERVER_LOG_LEVELS)) {
    updates.remoteServerLogLevel = input.remoteServerLogLevel
  }
  const remoteServerCorsOrigins = getStringArray(input.remoteServerCorsOrigins)
  if (remoteServerCorsOrigins) {
    updates.remoteServerCorsOrigins = remoteServerCorsOrigins
  }
  if (typeof input.remoteServerAutoShowPanel === "boolean") {
    updates.remoteServerAutoShowPanel = input.remoteServerAutoShowPanel
  }
  if (typeof input.remoteServerTerminalQrEnabled === "boolean") {
    updates.remoteServerTerminalQrEnabled = input.remoteServerTerminalQrEnabled
  }

  const conversationSessionState = sanitizeConversationSessionState(input as Config)
  if (Array.isArray(input.pinnedSessionIds)) {
    updates.pinnedSessionIds = conversationSessionState.pinnedSessionIds
  }
  if (Array.isArray(input.archivedSessionIds)) {
    updates.archivedSessionIds = conversationSessionState.archivedSessionIds
  }

  if (Array.isArray(input.predefinedPrompts)) {
    updates.predefinedPrompts = input.predefinedPrompts as any
  }

  return updates
}

export async function saveManagedConfig(
  patch: Partial<Config>,
  options: {
    remoteAccessLabel?: string
  } = {},
): Promise<{
  config: Config
  previousConfig: Config
  updatedKeys: string[]
}> {
  const previousConfig = configStore.get()
  let nextConfig = { ...previousConfig, ...patch } as Config
  const updatedKeys = Object.keys(patch)

  configStore.save(nextConfig)

  try {
    const { getAgentsLayerPaths } = await import("./agents-files/modular-config")
    const { cleanupInvalidMcpServerReferencesInLayers } = await import(
      "./agent-profile-mcp-cleanup"
    )

    const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
    const layers = workspaceAgentsFolder
      ? [
          getAgentsLayerPaths(globalAgentsFolder),
          getAgentsLayerPaths(workspaceAgentsFolder),
        ]
      : [getAgentsLayerPaths(globalAgentsFolder)]

    const validServerNames = Object.keys(nextConfig.mcpConfig?.mcpServers || {})
    const cleanupResult = cleanupInvalidMcpServerReferencesInLayers(
      layers,
      validServerNames,
    )
    if (cleanupResult.updatedProfileIds.length > 0) {
      agentProfileService.reload()
    }
  } catch {
    // best-effort cleanup only
  }

  try {
    const providerConfigChanged =
      previousConfig.openaiBaseUrl !== nextConfig.openaiBaseUrl ||
      previousConfig.openaiApiKey !== nextConfig.openaiApiKey ||
      previousConfig.groqBaseUrl !== nextConfig.groqBaseUrl ||
      previousConfig.groqApiKey !== nextConfig.groqApiKey ||
      previousConfig.geminiBaseUrl !== nextConfig.geminiBaseUrl ||
      previousConfig.geminiApiKey !== nextConfig.geminiApiKey

    if (providerConfigChanged) {
      const { clearModelsCache } = await import("./models-service")
      clearModelsCache()
    }
  } catch {
    // best-effort only; cache will eventually expire
  }

  try {
    if (
      (process.env.NODE_ENV === "production" ||
        !process.env.ELECTRON_RENDERER_URL) &&
      process.platform !== "linux"
    ) {
      app.setLoginItemSettings({
        openAtLogin: !!nextConfig.launchAtLogin,
        openAsHidden: true,
      })
    }
  } catch {
    // best-effort only
  }

  if (process.env.IS_MAC) {
    try {
      const previousHideDock = !!previousConfig.hideDockIcon
      const nextHideDock = !!nextConfig.hideDockIcon

      if (previousHideDock !== nextHideDock) {
        if (nextHideDock) {
          app.setActivationPolicy("accessory")
          app.dock.hide()
        } else {
          app.dock.show()
          app.setActivationPolicy("regular")
        }
      }
    } catch {
      // best-effort only
    }
  }

  try {
    await syncConfiguredRemoteAccess({
      label: options.remoteAccessLabel ?? "settings-management",
      previousConfig,
      nextConfig,
    })
  } catch {
    // lifecycle is best-effort
  }

  try {
    const previousWhatsappEnabled = !!previousConfig.whatsappEnabled
    const nextWhatsappEnabled = !!nextConfig.whatsappEnabled

    if (previousWhatsappEnabled !== nextWhatsappEnabled) {
      const currentMcpConfig = nextConfig.mcpConfig || { mcpServers: {} }
      const hasWhatsappServer = !!currentMcpConfig.mcpServers?.[WHATSAPP_SERVER_NAME]

      if (nextWhatsappEnabled) {
        if (!hasWhatsappServer) {
          const updatedMcpConfig: MCPConfig = {
            ...currentMcpConfig,
            mcpServers: {
              ...currentMcpConfig.mcpServers,
              [WHATSAPP_SERVER_NAME]: {
                command: "node",
                args: [getInternalWhatsAppServerPath()],
                transport: "stdio",
              },
            },
          }
          nextConfig = {
            ...nextConfig,
            mcpConfig: updatedMcpConfig,
          }
          configStore.save(nextConfig)
        }

        await mcpService.restartServer(WHATSAPP_SERVER_NAME)
      } else if (!nextWhatsappEnabled && hasWhatsappServer) {
        await mcpService.stopServer(WHATSAPP_SERVER_NAME)
      }
    } else if (nextWhatsappEnabled) {
      const whatsappSettingsChanged =
        JSON.stringify(previousConfig.whatsappAllowFrom) !==
          JSON.stringify(nextConfig.whatsappAllowFrom) ||
        previousConfig.whatsappAutoReply !== nextConfig.whatsappAutoReply ||
        previousConfig.whatsappLogMessages !== nextConfig.whatsappLogMessages

      const remoteServerSettingsChanged =
        !!nextConfig.whatsappAutoReply &&
        (previousConfig.remoteServerEnabled !== nextConfig.remoteServerEnabled ||
          previousConfig.remoteServerPort !== nextConfig.remoteServerPort ||
          previousConfig.remoteServerApiKey !== nextConfig.remoteServerApiKey)

      if (whatsappSettingsChanged || remoteServerSettingsChanged) {
        const currentMcpConfig = nextConfig.mcpConfig || { mcpServers: {} }
        if (currentMcpConfig.mcpServers?.[WHATSAPP_SERVER_NAME]) {
          await mcpService.restartServer(WHATSAPP_SERVER_NAME)
        }
      }
    }
  } catch {
    // lifecycle is best-effort
  }

  try {
    const langfuseConfigChanged =
      previousConfig.langfuseEnabled !== nextConfig.langfuseEnabled ||
      previousConfig.langfuseSecretKey !== nextConfig.langfuseSecretKey ||
      previousConfig.langfusePublicKey !== nextConfig.langfusePublicKey ||
      previousConfig.langfuseBaseUrl !== nextConfig.langfuseBaseUrl

    if (langfuseConfigChanged) {
      const { reinitializeLangfuse } = await import("./langfuse-service")
      reinitializeLangfuse()
    }
  } catch {
    // Langfuse reinitialization is best-effort
  }

  return {
    config: nextConfig,
    previousConfig,
    updatedKeys,
  }
}
