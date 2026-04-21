import path from "path"
import fs from "fs"
import os from "os"
import type { Config, ModelPreset } from "./types"
import type { PathResolver } from "./interfaces/path-resolver"
import { container, ServiceTokens } from "./service-container"
import { getBuiltInModelPresets, DEFAULT_MODEL_PRESET_ID } from "@dotagents/shared"

import {
  getAgentsLayerPaths,
  loadMergedAgentsConfig,
  writeAgentsLayerFromConfig,
} from "./agents-files/modular-config"
import { safeReadJsonFileSync, safeWriteJsonFileSync } from "./agents-files/safe-file"
import {
  getAgentsSecretsLocalPath,
  migrateJsonFileSecretsToLocalStore,
  prepareConfigForPersistence,
  resolveSecretRefs,
} from "./agents-files/secrets"
import { getErrorMessage, normalizeError } from "./error-utils"

const DEFAULT_APP_ID = "app.dotagents"

// ============================================================================
// Path resolution — uses PathResolver from the service container
// ============================================================================

function getPathResolver(): PathResolver {
  return container.resolve<PathResolver>(ServiceTokens.PathResolver)
}

/**
 * Get the application data folder.
 * Uses PathResolver.getAppDataPath() + APP_ID instead of Electron's app.getPath('appData').
 */
export function getDataFolder(): string {
  return path.join(getPathResolver().getAppDataPath(), process.env.APP_ID || DEFAULT_APP_ID)
}

export function getRecordingsFolder(): string {
  return path.join(getDataFolder(), "recordings")
}

export function getConversationsFolder(): string {
  return path.join(getDataFolder(), "conversations")
}

export function getConfigPath(): string {
  return path.join(getDataFolder(), "config.json")
}

// Global agents folder: ~/.agents — the canonical, shareable location for all agent config.
// Everything lives here so it's easy to version-control, share, or distribute as a profile pack.
export const globalAgentsFolder = path.join(os.homedir(), ".agents")

// Valid Orpheus voices - used for migration validation
const ORPHEUS_ENGLISH_VOICES = ["autumn", "diana", "hannah", "austin", "daniel", "troy"]
const ORPHEUS_ARABIC_VOICES = ["fahad", "sultan", "lulwa", "noura"]

// Valid Groq TTS model IDs
const VALID_GROQ_TTS_MODELS = ["canopylabs/orpheus-v1-english", "canopylabs/orpheus-arabic-saudi"]

const AGENT_CONFIG_ALIAS_PAIRS = [
  ["agentProviderId", "mcpToolsProviderId"],
  ["agentOpenaiModel", "mcpToolsOpenaiModel"],
  ["agentGroqModel", "mcpToolsGroqModel"],
  ["agentGeminiModel", "mcpToolsGeminiModel"],
  ["agentChatgptWebModel", "mcpToolsChatgptWebModel"],
  ["agentShortcut", "mcpToolsShortcut"],
  ["customAgentShortcut", "customMcpToolsShortcut"],
  ["customAgentShortcutMode", "customMcpToolsShortcutMode"],
] as const

function syncAgentConfigAliases(config: Partial<Config>): Partial<Config> {
  const record = config as Record<string, unknown>
  for (const [preferredKey, legacyKey] of AGENT_CONFIG_ALIAS_PAIRS) {
    if (record[preferredKey] !== undefined) {
      record[legacyKey] = record[preferredKey]
    } else if (record[legacyKey] !== undefined) {
      record[preferredKey] = record[legacyKey]
    }
  }
  return config
}

/**
 * Migrate deprecated Groq TTS PlayAI models/voices to new Orpheus equivalents.
 * This ensures existing installs with saved PlayAI settings continue to work.
 */
function migrateGroqTtsConfig(config: Partial<Config>): Partial<Config> {
  // Migrate deprecated PlayAI models to Orpheus equivalents
  // Use string comparison since saved config may contain deprecated values not in current type
  const savedModel = config.groqTtsModel as string | undefined
  if (savedModel === "playai-tts") {
    config.groqTtsModel = "canopylabs/orpheus-v1-english"
  } else if (savedModel === "playai-tts-arabic") {
    config.groqTtsModel = "canopylabs/orpheus-arabic-saudi"
  } else if (savedModel && !VALID_GROQ_TTS_MODELS.includes(savedModel)) {
    // Unknown model value (user-edited config.json) - reset to default English model
    config.groqTtsModel = "canopylabs/orpheus-v1-english"
  }

  // Migrate voices: check if voice is valid for the current model
  // Guard with typeof check since config.json is user-editable and groqTtsVoice could be non-string
  const voice = config.groqTtsVoice
  const isValidVoice = voice && typeof voice === "string"

  if (config.groqTtsModel === "canopylabs/orpheus-arabic-saudi") {
    // For Arabic model, ensure voice is a valid Arabic voice
    if (!isValidVoice || !ORPHEUS_ARABIC_VOICES.includes(voice)) {
      config.groqTtsVoice = "fahad" // Default Arabic voice
    }
  } else if (config.groqTtsModel === "canopylabs/orpheus-v1-english") {
    // For English model, ensure voice is a valid English voice
    if (!isValidVoice || !ORPHEUS_ENGLISH_VOICES.includes(voice)) {
      config.groqTtsVoice = "troy" // Default English voice
    }
  }

  return syncAgentConfigAliases(config)
}

export function resolveWorkspaceAgentsFolder(): string | null {
  const envWorkspaceRoot = process.env.DOTAGENTS_WORKSPACE_DIR?.trim()
  if (!envWorkspaceRoot) return null

  const globalResolved = path.resolve(globalAgentsFolder)
  const resolvedRoot = path.isAbsolute(envWorkspaceRoot)
    ? envWorkspaceRoot
    : path.resolve(process.cwd(), envWorkspaceRoot)
  const candidate = path.join(resolvedRoot, ".agents")

  // Don't return the same directory as the global layer.
  if (path.resolve(candidate) === globalResolved) return null
  return candidate
}

/**
 * One-time migration: copy files from the old app-data/.agents location to ~/.agents.
 * Only copies files that don't already exist at the destination.
 * Skills are intentionally skipped — ~/.agents/skills already has user-authored skills.
 */
function migrateAgentsFolderToHome(dataFolder: string): void {
  const legacyAppDataAgentsFolder = path.join(dataFolder, ".agents")
  if (!fs.existsSync(legacyAppDataAgentsFolder)) return

  const copyIfMissing = (src: string, dst: string) => {
    try {
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true })
        fs.copyFileSync(src, dst)
      }
    } catch {
      // best-effort
    }
  }

  // Top-level config files
  for (const file of ["dotagents-settings.json", "mcp.json", "models.json", "system-prompt.md", "agents.md"]) {
    copyIfMissing(
      path.join(legacyAppDataAgentsFolder, file),
      path.join(globalAgentsFolder, file),
    )
  }

  // layouts/ui.json
  copyIfMissing(
    path.join(legacyAppDataAgentsFolder, "layouts", "ui.json"),
    path.join(globalAgentsFolder, "layouts", "ui.json"),
  )

}

function migratePlaintextSecretsToLocalStore(): void {
  const migrateAgentsDir = (agentsDir: string) => {
    const layer = getAgentsLayerPaths(agentsDir)
    const secretsFilePath = getAgentsSecretsLocalPath(agentsDir)
    for (const filePath of [
      layer.settingsJsonPath,
      layer.mcpJsonPath,
      layer.modelsJsonPath,
      layer.layoutJsonPath,
    ]) {
      migrateJsonFileSecretsToLocalStore(filePath, secretsFilePath, true, {
        backupDir: layer.backupsDir,
      })
    }
  }

  migrateAgentsDir(globalAgentsFolder)
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  if (workspaceAgentsFolder) migrateAgentsDir(workspaceAgentsFolder)

  migrateJsonFileSecretsToLocalStore(
    getConfigPath(),
    getAgentsSecretsLocalPath(globalAgentsFolder),
    false,
    { backupDir: path.join(getDataFolder(), ".backups") },
  )
}

type LoadedConfig = {
  config: Partial<Config>
  source: "agents" | "legacy" | "defaults"
}

const getConfig = (): LoadedConfig => {
  const dataFolder = getDataFolder()
  const configFilePath = getConfigPath()
  const legacyBackupsFolder = path.join(dataFolder, ".backups")

  // Platform-specific defaults
  const isWindows = process.platform === 'win32'

  const defaultConfig: Partial<Config> = {
    // Onboarding - not completed by default for new users
    onboardingCompleted: false,

    // Recording shortcut: On Windows, use Ctrl+/ to avoid conflicts with common shortcuts
    // On macOS, Hold Ctrl is fine since Cmd is used for most shortcuts
    shortcut: isWindows ? "ctrl-slash" : "hold-ctrl",
    voiceScreenshotShortcutEnabled: true,
    voiceScreenshotShortcut: "ctrl-shift-x",
    customVoiceScreenshotShortcut: "",

    mcpToolsShortcut: "hold-ctrl-alt",
    // Note: mcpToolsEnabled and mcpAgentModeEnabled are deprecated and always treated as true
    // Safety: optional approval prompt before each tool call (off by default)
    mcpRequireApprovalBeforeToolCall: false,
    mcpAutoPasteEnabled: false,
    mcpAutoPasteDelay: 1000, // 1 second delay by default
    mcpMaxIterations: 10, // Default max iterations for agent mode
    mcpUnlimitedIterations: true, // Default to unlimited iterations
    textInputEnabled: true,

    // Text input: On Windows, use Ctrl+Shift+T to avoid browser new tab conflict
    textInputShortcut: isWindows ? "ctrl-shift-t" : "ctrl-t",
    conversationsEnabled: true,
    maxConversationsToKeep: 100,
    autoSaveConversations: true,
    pinnedSessionIds: [],
    archivedSessionIds: [],
    // Settings hotkey defaults
    settingsHotkeyEnabled: true,
    settingsHotkey: "ctrl-shift-s",
    customSettingsHotkey: "",
    // Agent kill switch defaults
    agentKillSwitchEnabled: true,
    agentKillSwitchHotkey: "ctrl-shift-escape",
    // Toggle voice dictation defaults
    toggleVoiceDictationEnabled: false,
    toggleVoiceDictationHotkey: "fn",
    // Custom shortcut defaults
    customShortcut: "",
    customShortcutMode: "hold", // Default to hold mode for custom recording shortcut
    customTextInputShortcut: "",
    customAgentKillSwitchHotkey: "",
    customMcpToolsShortcut: "",
    customMcpToolsShortcutMode: "hold", // Default to hold mode for custom MCP tools shortcut
    customToggleVoiceDictationHotkey: "",
    // Persisted MCP runtime state
    mcpRuntimeDisabledServers: [],
    mcpDisabledTools: [],
    // Panel position defaults
    panelPosition: "top-right",
    panelDragEnabled: true,
    panelCustomSize: undefined,
    panelTextInputSize: undefined,
    panelProgressSize: undefined,
    // Floating panel auto-show - when true, panel auto-shows during agent sessions
    floatingPanelAutoShow: true,
    // Hide floating panel when main app is focused (default: enabled)
    hidePanelWhenMainFocused: true,
    // Theme preference defaults
    themePreference: "system",

    // Speech-to-Text defaults
    sttProviderId: "openai",
    openaiSttModel: "whisper-1",
    groqSttModel: "whisper-large-v3-turbo",

    // Parakeet STT defaults
    parakeetNumThreads: 2,
    parakeetModelDownloaded: false,

    // App behavior
    launchAtLogin: false,
    hideDockIcon: false,

    // TTS defaults
    ttsEnabled: true,
    ttsAutoPlay: true,
    ttsProviderId: "openai",
    ttsPreprocessingEnabled: true,
    ttsRemoveCodeBlocks: true,
    ttsRemoveUrls: true,
    ttsConvertMarkdown: true,
    // LLM-based TTS preprocessing (off by default - uses regex for fast/free processing)
    ttsUseLLMPreprocessing: false,
    // OpenAI TTS defaults
    openaiTtsModel: "gpt-4o-mini-tts",
    openaiTtsVoice: "alloy",
    openaiTtsSpeed: 1.0,
    openaiTtsResponseFormat: "mp3",
    // OpenAI Compatible Provider defaults
    openaiCompatiblePreset: "openai",
    // Groq TTS defaults
    groqTtsModel: "canopylabs/orpheus-v1-english",
    groqTtsVoice: "troy",
    // Gemini TTS defaults
    geminiTtsModel: "gemini-2.5-flash-preview-tts",
    geminiTtsVoice: "Kore",
    // Supertonic TTS defaults
    supertonicVoice: "M1",
    supertonicLanguage: "en",
    supertonicSpeed: 1.05,
    supertonicSteps: 5,

    // Provider Section Collapse defaults - collapsed by default
    providerSectionCollapsedOpenai: true,
    providerSectionCollapsedGroq: true,
    providerSectionCollapsedGemini: true,
    providerSectionCollapsedChatgptWeb: true,

    // API Retry defaults
    apiRetryCount: 3,
    apiRetryBaseDelay: 1000, // 1 second
    apiRetryMaxDelay: 30000, // 30 seconds
    // Context reduction defaults
    mcpContextReductionEnabled: true,
    mcpContextTargetRatio: 0.4,
    mcpContextLastNMessages: 3,
    mcpContextSummarizeCharThreshold: 2000,

    // Tool response processing defaults
    mcpToolResponseProcessingEnabled: true,
    mcpToolResponseLargeThreshold: 20000, // 20KB threshold for processing
    mcpToolResponseCriticalThreshold: 50000, // 50KB threshold for aggressive summarization
    mcpToolResponseChunkSize: 15000, // Size of chunks for processing
    mcpToolResponseProgressUpdates: true, // Show progress updates during processing

    // Completion verification defaults
    mcpVerifyCompletionEnabled: true,
    mcpVerifyContextMaxItems: 10,
    mcpVerifyRetryCount: 1,

    // Final summary defaults - off unless explicitly enabled
    mcpFinalSummaryEnabled: false,

    // Parallel tool execution - when enabled, multiple tool calls from a single LLM response are executed concurrently
    mcpParallelToolExecution: true,

    // Message queue - when enabled, users can queue messages while agent is processing (enabled by default)
    mcpMessageQueueEnabled: true,

    // Remote Server defaults
    remoteServerEnabled: false,
    remoteServerPort: 3210,
    remoteServerBindAddress: "127.0.0.1",
    remoteServerLogLevel: "info",
    remoteServerCorsOrigins: ["*"],
    remoteServerAutoShowPanel: false, // Don't auto-show panel by default for remote sessions

    // WhatsApp Integration defaults
    whatsappEnabled: false,
    whatsappAllowFrom: [],
    whatsappAutoReply: false,
    whatsappLogMessages: false,

    // Discord Integration defaults
    discordEnabled: false,
    discordBotToken: "",
    discordDmEnabled: false,         // DMs off by default (safety)
    discordRequireMention: true,     // Require @mention in servers by default (safety)
    discordAllowUserIds: [],
    discordAllowGuildIds: [],
    discordAllowChannelIds: [],
    discordAllowRoleIds: [],
    discordDmAllowUserIds: [],
    discordOperatorAllowUserIds: [],
    discordOperatorAllowGuildIds: [],
    discordOperatorAllowChannelIds: [],
    discordOperatorAllowRoleIds: [],
    discordDefaultProfileId: undefined,
    discordLogMessages: false,

    // Streamer Mode - hides sensitive info for screen sharing
    streamerModeEnabled: false,

    // Langfuse Observability - disabled by default
    langfuseEnabled: false,
    langfusePublicKey: undefined,
    langfuseSecretKey: undefined,
    langfuseBaseUrl: undefined, // Uses cloud.langfuse.com by default

    // Dual-Model Agent Mode defaults
    dualModelEnabled: false,
    dualModelSummarizationFrequency: "every_response",
    dualModelSummaryDetailLevel: "compact",

    // ACP Tool Injection - when true, injects DotAgents runtime tools into ACP agent sessions
    // This allows ACP agents to use delegation, user communication, and completion signaling.
    acpInjectRuntimeTools: true,
  }

  // 1) Preferred: modular `.agents` format (global + optional workspace overlay)
  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const { merged: mergedAgents, hasAnyAgentsFiles } = loadMergedAgentsConfig(
    { globalAgentsDir: globalAgentsFolder, workspaceAgentsDir: workspaceAgentsFolder }
  )

  // 2) Always load legacy config.json as the base layer (it holds API keys, preferences, etc.)
  const savedConfigRaw = safeReadJsonFileSync<Partial<Config>>(configFilePath, {
    backupDir: legacyBackupsFolder,
    defaultValue: {},
  })
  const savedConfig = resolveSecretRefs(
    savedConfigRaw,
    getAgentsSecretsLocalPath(globalAgentsFolder),
  )

  // Merge order: defaults ← config.json ← .agents (if present)
  // This ensures existing settings (API keys etc.) from config.json are always preserved,
  // while .agents files can selectively override specific values.
  const mergedConfig = hasAnyAgentsFiles
    ? { ...defaultConfig, ...savedConfig, ...mergedAgents }
    : { ...defaultConfig, ...savedConfig }

  const legacyTextInputModeSize = (mergedConfig as Record<string, unknown>).panelTextInputModeSize
  if (!mergedConfig.panelTextInputSize && legacyTextInputModeSize) {
    mergedConfig.panelTextInputSize = legacyTextInputModeSize
  }

  // Migration: Remove deprecated mode-specific panel sizes (these were never used)
  delete (mergedConfig as Record<string, unknown>).panelNormalModeSize
  delete (mergedConfig as Record<string, unknown>).panelAgentModeSize
  delete (mergedConfig as Record<string, unknown>).panelTextInputModeSize

  const legacyExists = (() => {
    try {
      return fs.existsSync(configFilePath)
    } catch {
      return false
    }
  })()

  return {
    config: migrateGroqTtsConfig(mergedConfig),
    source: hasAnyAgentsFiles ? "agents" : legacyExists ? "legacy" : "defaults",
  }
}

/**
 * Get the active model preset from config, merging built-in presets with saved data
 * This includes API keys, model preferences, and any other saved properties
 */
function getActivePreset(config: Partial<Config>): ModelPreset | undefined {
  const builtIn = getBuiltInModelPresets()
  const savedPresets = config.modelPresets || []
  const currentPresetId = config.currentModelPresetId || DEFAULT_MODEL_PRESET_ID

  // Merge built-in presets with ALL saved properties (apiKey, mcpToolsModel, transcriptProcessingModel, etc.)
  // Filter out undefined values from saved to prevent overwriting built-in defaults with undefined
  const allPresets = builtIn.map(preset => {
    const saved = savedPresets.find((s: ModelPreset) => s.id === preset.id)
    // Spread saved properties over built-in preset to preserve all customizations
    // Use defensive merge to filter out undefined values that could overwrite defaults
    return saved ? { ...preset, ...Object.fromEntries(Object.entries(saved).filter(([_, v]) => v !== undefined)) } : preset
  })

  // Add custom (non-built-in) presets
  const customPresets = savedPresets.filter((p: ModelPreset) => !p.isBuiltIn)
  allPresets.push(...customPresets)

  return allPresets.find(p => p.id === currentPresetId)
}

/**
 * Patterns that identify ChatGPT-Web-only model families. These must never be copied
 * into legacy OpenAI fields (`mcpToolsOpenaiModel`, `transcriptPostProcessingOpenaiModel`)
 * because the direct OpenAI REST endpoint cannot serve them, causing every request to
 * fail and burn through retries. See issue #310.
 */
const CHATGPT_WEB_ONLY_MODEL_PATTERNS = [
  "codex-spark",
  "gpt-5.3-codex",
  "gpt-5.2-codex",
]

function isLikelyChatGptWebOnlyModel(model: string | undefined): boolean {
  if (!model) return false
  const normalized = model.trim().toLowerCase()
  return CHATGPT_WEB_ONLY_MODEL_PATTERNS.some(pattern => normalized.includes(pattern))
}

/**
 * Sync the active preset's credentials and model preferences to legacy config fields for backward compatibility.
 * Always syncs all fields together to keep them consistent with the active preset.
 */
function syncPresetToLegacyFields(config: Partial<Config>): Partial<Config> {
  const activePreset = getActivePreset(config)
  if (activePreset) {
    // Always sync both fields to keep them consistent with the active preset
    // If preset has empty values, legacy fields should reflect that
    config.openaiApiKey = activePreset.apiKey || ''
    config.openaiBaseUrl = activePreset.baseUrl || ''

    // Always sync model preferences to keep legacy fields consistent with the active preset
    // If preset has empty/undefined values, legacy fields should reflect that.
    // Skip models that belong to ChatGPT-Web-only families so they never reach the
    // direct OpenAI REST endpoint (see issue #310).
    const agentModel = activePreset.agentModel ?? activePreset.mcpToolsModel
    config.agentOpenaiModel = isLikelyChatGptWebOnlyModel(agentModel)
      ? ''
      : (agentModel || '')
    config.mcpToolsOpenaiModel = config.agentOpenaiModel
    config.transcriptPostProcessingOpenaiModel = isLikelyChatGptWebOnlyModel(activePreset.transcriptProcessingModel)
      ? ''
      : (activePreset.transcriptProcessingModel || '')
  }
  return syncAgentConfigAliases(config)
}

export class ConfigStore {
  config: Config | undefined

  constructor() {
    const dataFolder = getDataFolder()

    // One-time migration: move files from old app-data/.agents → ~/.agents
    try {
      migrateAgentsFolderToHome(dataFolder)
      migratePlaintextSecretsToLocalStore()
    } catch {
      // best-effort
    }

    const loaded = getConfig()
    // Sync active preset credentials to legacy fields on startup
    this.config = syncPresetToLegacyFields(loaded.config) as Config

    // Migration: ensure mcpVerifyCompletionEnabled and mcpUnlimitedIterations
    // default to true. These were previously false by default and may have been
    // persisted to ~/.agents/mcp.json, overriding config.json changes.
    // This is a one-time fix: once the values are true, this is a no-op.
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      const mcpJson = safeReadJsonFileSync<Record<string, unknown>>(globalLayer.mcpJsonPath, {
        backupDir: globalLayer.backupsDir,
        defaultValue: {},
      })
      let mcpDirty = false
      if (mcpJson.mcpVerifyCompletionEnabled === false) {
        mcpJson.mcpVerifyCompletionEnabled = true
        mcpDirty = true
      }
      if (mcpJson.mcpUnlimitedIterations === false) {
        mcpJson.mcpUnlimitedIterations = true
        mcpDirty = true
      }
      if (mcpDirty) {
        safeWriteJsonFileSync(globalLayer.mcpJsonPath, mcpJson, {
          backupDir: globalLayer.backupsDir,
          maxBackups: 10,
          pretty: true,
        })
        // Also update the in-memory config
        this.config.mcpVerifyCompletionEnabled = true
        this.config.mcpUnlimitedIterations = true
      }
    } catch {
      // best-effort
    }

    // Ensure global `.agents` files exist so users/agents can edit them even if
    // we loaded from legacy config.json or defaults.
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      writeAgentsLayerFromConfig(globalLayer, this.config, {
        // Avoid rewriting user-managed files on startup; only create missing files.
        onlyIfMissing: true,
        maxBackups: 10,
      })
    } catch {
      // best-effort
    }
  }

  get(): Config {
    return (this.config as Config) || ({} as Config)
  }

  save(config: Config) {
    const nextConfig = syncPresetToLegacyFields(config) as Config
    persistConfigToDisk(nextConfig)
    this.config = nextConfig
  }

  reload(): Config {
    const loaded = getConfig()
    this.config = syncPresetToLegacyFields(loaded.config) as Config
    return this.get()
  }
}

export function trySaveConfig(config: Config): Error | null {
  try {
    configStore.save(config)
    return null
  } catch (error) {
    return normalizeError(error, "Failed to save settings to disk")
  }
}

export function persistConfigToDisk(
  config: Config,
  options: {
    agentsDir?: string
    legacyConfigFilePath?: string
    backupDir?: string
    maxBackups?: number
  } = {},
): { savedToAgentsLayer: boolean; savedToLegacyConfig: boolean } {
  const dataFolder = getDataFolder()
  const agentsDir = options.agentsDir ?? globalAgentsFolder
  const legacyConfigFilePath = options.legacyConfigFilePath ?? getConfigPath()
  const backupDir = options.backupDir ?? path.join(dataFolder, ".backups")
  const maxBackups = options.maxBackups ?? 10

  let savedToAgentsLayer = false
  let savedToLegacyConfig = false
  const failures: string[] = []

  try {
    const globalLayer = getAgentsLayerPaths(agentsDir)
    writeAgentsLayerFromConfig(globalLayer, config, { maxBackups })
    savedToAgentsLayer = true
  } catch (error) {
    failures.push(`Could not write the .agents config files (${getErrorMessage(error)})`)
  }

  try {
    const configForLegacyDisk = prepareConfigForPersistence(
      config,
      getAgentsSecretsLocalPath(agentsDir),
    )
    migrateJsonFileSecretsToLocalStore(
      legacyConfigFilePath,
      getAgentsSecretsLocalPath(agentsDir),
      false,
      { backupDir, maxBackups },
    )
    safeWriteJsonFileSync(legacyConfigFilePath, configForLegacyDisk, {
      backupDir,
      maxBackups,
      pretty: false,
    })
    savedToLegacyConfig = true
  } catch (error) {
    failures.push(`Could not write the legacy config file (${getErrorMessage(error)})`)
  }

  if (!savedToAgentsLayer && !savedToLegacyConfig) {
    throw new Error(`Failed to save settings to disk. ${failures.join(" ")}`)
  }

  return {
    savedToAgentsLayer,
    savedToLegacyConfig,
  }
}

// Lazy singleton — ConfigStore resolves PathResolver from the service container.
// The app must register PathResolver before accessing configStore.
let _configStore: ConfigStore | null = null

/**
 * Get the lazily-initialized global ConfigStore instance.
 * Requires PathResolver to be registered in the service container.
 */
export function getConfigStore(): ConfigStore {
  if (!_configStore) {
    _configStore = new ConfigStore()
  }
  return _configStore
}

/**
 * Backward-compatible configStore accessor.
 * Uses a Proxy to lazily initialize on first property access.
 */
export const configStore: ConfigStore = new Proxy({} as ConfigStore, {
  get(_target, prop, _receiver) {
    const store = getConfigStore()
    const value = (store as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === "function") {
      return value.bind(store)
    }
    return value
  },
  set(_target, prop, value) {
    const store = getConfigStore()
    ;(store as unknown as Record<string | symbol, unknown>)[prop] = value
    return true
  },
})
