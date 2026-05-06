import type {
  CHAT_PROVIDER_ID,
  TTS_PROVIDER_ID,
  OPENAI_COMPATIBLE_PRESET_ID,
  ModelPreset,
} from '@dotagents/shared/providers'
import type {
  LoopConfig as SharedLoopConfig,
} from '@dotagents/shared/types'
import type { SessionHistoryConfig } from '@dotagents/shared/session'
import type { AgentProfile as SharedAgentProfile } from '@dotagents/shared/agent-profile-domain'
import type {
  AgentConversationState,
} from '@dotagents/shared/conversation-state'
import type { MCPConfig as SharedMCPConfig } from '@dotagents/shared/mcp-utils'
import type { PushNotificationToken as SharedPushNotificationToken } from '@dotagents/shared/push-notifications'
import type { AgentExecutionConfig, PredefinedPromptsConfig, SpeechToTextConfig } from '@dotagents/shared/api-types'
import type { MainAgentConfig } from '@dotagents/shared/main-agent-selection'
import type { CloudflareTunnelConfig, RemoteServerConfig, StreamerModeConfig } from '@dotagents/shared/remote-pairing'
import type { ObservabilityConfig } from '@dotagents/shared/observability-config'
import type {
  LegacyAcpAgentConfig,
  LegacyPersonaRecord,
  LegacyPersonasData,
  LegacyProfileRecord,
  LegacyProfilesData,
} from '@dotagents/shared/agent-profile-legacy-converters'
import type { DiscordIntegrationConfig } from '@dotagents/shared/discord-config'
import type { WhatsAppIntegrationConfig } from '@dotagents/shared/whatsapp-config'
import {
  legacyAcpAgentConfigToAgentProfile as sharedLegacyAcpAgentConfigToAgentProfile,
  legacyPersonaToAgentProfile as sharedLegacyPersonaToAgentProfile,
  legacyProfileToAgentProfile as sharedLegacyProfileToAgentProfile,
} from '@dotagents/shared/agent-profile-legacy-converters'

export type { ToolCall, ToolResult, BaseChatMessage, ConversationHistoryMessage, ChatApiResponse, LoopConfig, LoopSchedule, AgentSkill, AgentSkillsData, RecordingHistoryItem, AgentProfileRole, LegacyAgentProfileRole, PreferredAgentProfileRole } from '@dotagents/shared/types'
export type { SessionHistoryConfig } from '@dotagents/shared/session'
export type { AgentExecutionConfig, PredefinedPrompt, PredefinedPromptsConfig, SpeechToTextConfig } from '@dotagents/shared/api-types'
export { normalizeAgentProfileRole } from '@dotagents/shared/types'
export type { AgentProfile, AgentProfileConnection, AgentProfileConnectionType, AgentProfilesData, AgentProfileToolConfig } from '@dotagents/shared/agent-profile-domain'
export type { ProfileMcpServerConfig, ProfileModelConfig, ProfileSkillsConfig, SessionProfileSnapshot } from '@dotagents/shared/agent-profile-session-snapshot'
export type { Conversation, ConversationBranchSource, ConversationCompactionFact, ConversationCompactionMetadata, ConversationHistoryItem, ConversationMessage, LoadedConversation } from '@dotagents/shared/conversation-domain'
export type { DetailedToolInfo, MCPConfig, MCPServerConfig, MCPTransportType, OAuthClientMetadata, OAuthConfig, OAuthServerMetadata, OAuthTokens, ServerLogEntry } from '@dotagents/shared/mcp-utils'
export type { ElicitationFormField, ElicitationFormRequest, ElicitationFormSchema, ElicitationRequest, ElicitationResult, ElicitationUrlRequest, SamplingMessage, SamplingMessageContent, SamplingRequest, SamplingResult } from '@dotagents/shared/mcp-api'
export type { AgentConversationState } from '@dotagents/shared/conversation-state'
export type { AgentProgressUpdate, AgentProgressStep, ACPSubAgentMessage, ACPDelegationProgress, ACPDelegationState, ACPConfigOption, ACPConfigOptionValue, AgentStepSummary, OnProgressCallback } from '@dotagents/shared/agent-progress'
export type { KnowledgeNote, KnowledgeNoteContext, KnowledgeNoteEntryType } from '@dotagents/shared/knowledge-note-domain'
export type { KnowledgeNoteDateFilter, KnowledgeNoteGroupSummary, KnowledgeNoteSeriesSummary, KnowledgeNoteSort, KnowledgeNotesOverview } from '@dotagents/shared/knowledge-note-grouping'
export type { PushNotificationToken } from '@dotagents/shared/push-notifications'
export type { EnhancedModelInfo, ModelInfo, ModelsDevCost, ModelsDevData, ModelsDevLimit, ModelsDevModalities, ModelsDevModel, ModelsDevProvider } from '@dotagents/shared/api-types'
export type { CloudflareTunnelConfig, RemoteServerBindAddress, RemoteServerConfig, RemoteServerLogLevel, StreamerModeConfig } from '@dotagents/shared/remote-pairing'
export type { LangfuseObservabilityConfig, LocalTraceLoggingConfig, ObservabilityConfig } from '@dotagents/shared/observability-config'
export type { MainAgentConfig, MainAgentMode } from '@dotagents/shared/main-agent-selection'
export type { LegacyAcpAgentConfig, LegacyPersonaRecord, LegacyPersonasData, LegacyProfileRecord, LegacyProfilesData } from '@dotagents/shared/agent-profile-legacy-converters'
export type { DiscordIntegrationConfig } from '@dotagents/shared/discord-config'
export type { WhatsAppIntegrationConfig } from '@dotagents/shared/whatsapp-config'

// Agent Mode Progress Tracking Types — re-exported from @dotagents/shared (see above)

// AgentStepSummary — re-exported from @dotagents/shared (see above)

// Message Queue Types — re-exported from shared package
export type { QueuedMessage, MessageQueue } from '@dotagents/shared/message-queue-utils'

// Profile Management Types
export type Profile = LegacyProfileRecord

export type ProfilesData = LegacyProfilesData

// ============================================================================
// Agent Management Types (legacy Persona types kept for backward compatibility)
// ============================================================================

/**
 * Legacy Persona definition (kept for backward compatibility / migration).
 * An agent represents a specialized AI assistant with specific capabilities,
 * system prompts, and tool access configurations.
 */
export type Persona = LegacyPersonaRecord

/**
 * Storage format for agents data (legacy format).
 */
export type PersonasData = LegacyPersonasData

// ============================================================================
// Unified Agent Profile Type
// Consolidates legacy Profile, Persona, and ACPAgentConfig into a single Agent type
// ============================================================================

/**
 * Unified Agent Profile.
 *
 * Can represent:
 * - Chat agents (isUserProfile: true) - shows in the agent picker
 * - Delegation targets (isAgentTarget: true) - available for delegate_to_agent
 * - External acpx agents (connection.type: "acpx")
 * - Internal sub-sessions (connection.type: "internal")
 */

/**
 * Role classification for an agent profile.
 * - "chat-agent": Selectable chat/voice agent shown in the agent picker
 * - "delegation-target": Available as a target for delegate_to_agent
 * - "external-agent": External acpx agent
 * - "user-profile": Deprecated alias for "chat-agent" kept for compatibility
 */
// ============================================================================
// Migration Utilities
// ============================================================================

/**
 * Convert a legacy Profile to AgentProfile.
 */
export function profileToAgentProfile(profile: Profile): SharedAgentProfile {
  return sharedLegacyProfileToAgentProfile(profile) as SharedAgentProfile
}

/**
 * Convert a legacy Persona to AgentProfile (for migration).
 */
export function personaToAgentProfile(persona: Persona): SharedAgentProfile {
  return sharedLegacyPersonaToAgentProfile(persona) as SharedAgentProfile
}

/**
 * Convert a legacy ACPAgentConfig to AgentProfile.
 */
export function acpAgentConfigToAgentProfile(config: ACPAgentConfig): SharedAgentProfile {
  return sharedLegacyAcpAgentConfigToAgentProfile(config) as SharedAgentProfile
}

// ModelPreset — re-exported from shared package (superset of all platform definitions)
export type { ModelPreset } from '@dotagents/shared/providers'

// ACPConfigOptionValue and ACPConfigOption — re-exported from @dotagents/shared (see above)

export type ACPAgentConfig = LegacyAcpAgentConfig

export type Config = Record<string, unknown> & RemoteServerConfig & CloudflareTunnelConfig & StreamerModeConfig & ObservabilityConfig & SessionHistoryConfig & MainAgentConfig & PredefinedPromptsConfig & AgentExecutionConfig & SpeechToTextConfig & DiscordIntegrationConfig & WhatsAppIntegrationConfig & {
  shortcut?: "hold-ctrl" | "ctrl-slash" | "custom"
  customShortcut?: string
  customShortcutMode?: "hold" | "toggle" // Mode for custom recording shortcut
  voiceScreenshotShortcutEnabled?: boolean
  voiceScreenshotShortcut?: "ctrl-shift-x" | "custom"
  customVoiceScreenshotShortcut?: string
  hideDockIcon?: boolean
  launchAtLogin?: boolean

  // Onboarding Configuration
  onboardingCompleted?: boolean

  // Toggle Voice Dictation Configuration
  toggleVoiceDictationEnabled?: boolean
  toggleVoiceDictationHotkey?: "fn" | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12" | "custom"
  customToggleVoiceDictationHotkey?: string

  // Theme Configuration
  themePreference?: "system" | "light" | "dark"

  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiCompatiblePreset?: OPENAI_COMPATIBLE_PRESET_ID

  modelPresets?: ModelPreset[]
  currentModelPresetId?: string

  groqApiKey?: string
  groqBaseUrl?: string

  geminiApiKey?: string
  geminiBaseUrl?: string

  // ChatGPT Web Auth Configuration
  // Either access token directly, or session token (to resolve access token via /api/auth/session)
  chatgptWebAccessToken?: string
  chatgptWebSessionToken?: string
  chatgptWebAccountId?: string
  chatgptWebBaseUrl?: string
  chatgptWebAuthEmail?: string
  chatgptWebPlanType?: string
  chatgptWebConnectedAt?: number

  // Parakeet (Local) STT Configuration
  parakeetModelPath?: string // Optional custom model path
  parakeetModelDownloaded?: boolean // Whether model has been downloaded

  // Text-to-Speech Configuration
  ttsEnabled?: boolean
  ttsAutoPlay?: boolean
  ttsProviderId?: TTS_PROVIDER_ID

  // OpenAI TTS Configuration
  openaiTtsModel?: "gpt-4o-mini-tts" | "tts-1" | "tts-1-hd"
  openaiTtsVoice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
  openaiTtsSpeed?: number // 0.25 to 4.0
  openaiTtsResponseFormat?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm"

  // Groq TTS Configuration
  groqTtsModel?: "canopylabs/orpheus-v1-english" | "canopylabs/orpheus-arabic-saudi"
  groqTtsVoice?: string

  // Gemini TTS Configuration
  geminiTtsModel?: "gemini-2.5-flash-preview-tts" | "gemini-2.5-pro-preview-tts"
  geminiTtsVoice?: string
  geminiTtsLanguage?: string

  // Edge TTS Configuration
  edgeTtsModel?: "edge-tts"
  edgeTtsVoice?: string
  edgeTtsRate?: number // 0.5 to 2.0

  // Kitten (Local) TTS Configuration
  kittenModelDownloaded?: boolean // Whether model has been downloaded
  kittenVoiceId?: number // Voice ID 0-7 (default: 0 for Voice 2 - Male)

  // Supertonic (Local) TTS Configuration
  supertonicModelDownloaded?: boolean // Whether model has been downloaded
  supertonicVoice?: string // Voice style ID (e.g., "M1", "F1") - default "M1"
  supertonicLanguage?: string // Language code (en, ko, es, pt, fr) - default "en"
  supertonicSpeed?: number // Speech speed (default: 1.05)
  supertonicSteps?: number // Denoising steps (default: 5, higher = better quality)

  // TTS Text Preprocessing Configuration
  ttsPreprocessingEnabled?: boolean
  ttsRemoveCodeBlocks?: boolean
  ttsRemoveUrls?: boolean
  ttsConvertMarkdown?: boolean
  // LLM-based TTS Preprocessing (for more natural speech output)
  ttsUseLLMPreprocessing?: boolean
  ttsLLMPreprocessingProviderId?: CHAT_PROVIDER_ID

  transcriptPostProcessingEnabled?: boolean
  transcriptPostProcessingProviderId?: CHAT_PROVIDER_ID
  transcriptPostProcessingPrompt?: string
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
  transcriptPostProcessingChatgptWebModel?: string

  // Audio Device Selection
  audioInputDeviceId?: string   // Microphone device ID (from enumerateDevices)
  audioInputDeviceLabel?: string // Last resolved microphone label (used to remap rotated IDs)
  audioOutputDeviceId?: string  // Speaker device ID (from enumerateDevices / setSinkId)

  // Text Input Configuration
  textInputEnabled?: boolean
  textInputShortcut?: "ctrl-t" | "ctrl-shift-t" | "alt-t" | "custom"
  customTextInputShortcut?: string

  // Settings Window Hotkey Configuration
  settingsHotkeyEnabled?: boolean
  settingsHotkey?: "ctrl-shift-s" | "ctrl-comma" | "ctrl-shift-comma" | "custom"
  customSettingsHotkey?: string

  // Agent Kill Switch Configuration
  agentKillSwitchEnabled?: boolean
  agentKillSwitchHotkey?:
    | "ctrl-shift-escape"
    | "ctrl-alt-q"
    | "ctrl-shift-q"
    | "custom"
  customAgentKillSwitchHotkey?: string

  // Agent mode configuration
  /** @deprecated MCP tools are now always enabled. This field is kept for backwards compatibility but ignored. */
  mcpToolsEnabled?: boolean
  agentShortcut?: "hold-ctrl-alt" | "toggle-ctrl-alt" | "ctrl-alt-slash" | "custom"
  customAgentShortcut?: string
  customAgentShortcutMode?: "hold" | "toggle"
  agentProviderId?: CHAT_PROVIDER_ID
  agentOpenaiModel?: string
  agentGroqModel?: string
  agentGeminiModel?: string
  agentChatgptWebModel?: string
  agentSystemPrompt?: string
  /** @deprecated Use agentShortcut instead. */
  mcpToolsShortcut?: "hold-ctrl-alt" | "toggle-ctrl-alt" | "ctrl-alt-slash" | "custom"
  /** @deprecated Use customAgentShortcut instead. */
  customMcpToolsShortcut?: string
  /** @deprecated Use customAgentShortcutMode instead. */
  customMcpToolsShortcutMode?: "hold" | "toggle"
  /** @deprecated Use agentProviderId instead. */
  mcpToolsProviderId?: CHAT_PROVIDER_ID
  /** @deprecated Use agentOpenaiModel instead. */
  mcpToolsOpenaiModel?: string
  /** @deprecated Use agentGroqModel instead. */
  mcpToolsGroqModel?: string
  /** @deprecated Use agentGeminiModel instead. */
  mcpToolsGeminiModel?: string
  /** @deprecated Use agentChatgptWebModel instead. */
  mcpToolsChatgptWebModel?: string
  /**
   * Reasoning effort for reasoning-capable OpenAI/Codex models. Passed as
   * `providerOptions.openai.reasoningEffort` on OpenAI generateText calls and
   * as `reasoning.effort` on ChatGPT Web Codex responses. When unset, the
   * OpenAI provider applies "medium" for GPT-5.x models and the ChatGPT Web
   * Codex provider applies "low" unless this override is set.
   */
  openaiReasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh"
  /**
   * Output verbosity for Codex (ChatGPT Web) responses. Passed through as
   * `text.verbosity` on the Codex responses payload. Defaults to "medium"
   * when unset.
   */
  codexTextVerbosity?: "low" | "medium" | "high"
  /** @deprecated Use agentSystemPrompt instead; legacy field is ignored. */
  mcpToolsSystemPrompt?: string
  /** @deprecated Kept for backward compatibility but ignored */
  mcpCustomSystemPrompt?: string
  mcpCurrentProfileId?: string
  /** @deprecated Agent mode is now always enabled. This field is kept for backwards compatibility but ignored. */
  mcpAgentModeEnabled?: boolean
  mcpAutoPasteEnabled?: boolean
  mcpAutoPasteDelay?: number

  // MCP Server Configuration
  mcpConfig?: SharedMCPConfig

  mcpRuntimeDisabledServers?: string[]

  mcpDisabledTools?: string[]

  // UI State Persistence - Collapsed/Expanded sections in Settings
  mcpToolsCollapsedServers?: string[]  // Server names that are collapsed in the Tools section
  mcpServersCollapsedServers?: string[]  // Server names that are collapsed in the Servers section

  // Conversation Configuration
  conversationsEnabled?: boolean
  maxConversationsToKeep?: number
  autoSaveConversations?: boolean

  // Provider Section Collapse Configuration
  providerSectionCollapsedOpenai?: boolean
  providerSectionCollapsedGroq?: boolean
  providerSectionCollapsedGemini?: boolean
  providerSectionCollapsedChatgptWeb?: boolean
  providerSectionCollapsedParakeet?: boolean
  providerSectionCollapsedKitten?: boolean
  providerSectionCollapsedSupertonic?: boolean

  // Panel Position Configuration
  panelPosition?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "custom"
  panelCustomPosition?: { x: number; y: number }
  panelDragEnabled?: boolean
  panelCustomSize?: { width: number; height: number }
  panelWaveformSize?: { width: number; height: number }
  panelTextInputSize?: { width: number; height: number }
  panelProgressSize?: { width: number; height: number }

  // Floating Panel Auto-Show Configuration
  // When false, the floating panel will not automatically appear during agent sessions
  // Users can still manually access the panel via hotkeys, tray menu, or UI
  floatingPanelAutoShow?: boolean

  // Hide Floating Panel When Main App is Focused
  // When true (default), the floating panel will automatically hide when the main DotAgents window is focused
  // The panel will reappear when the main window loses focus (if auto-show conditions are met)
  hidePanelWhenMainFocused?: boolean

  // API Retry Configuration
  apiRetryCount?: number
  apiRetryBaseDelay?: number
  apiRetryMaxDelay?: number

  // Context Reduction Configuration
  mcpContextTargetRatio?: number
  mcpContextLastNMessages?: number
  mcpContextSummarizeCharThreshold?: number
  mcpMaxContextTokensOverride?: number

  // Tool Response Processing Configuration
  mcpToolResponseLargeThreshold?: number
  mcpToolResponseCriticalThreshold?: number
  mcpToolResponseChunkSize?: number
  mcpToolResponseProgressUpdates?: boolean

  // Completion Verification Configuration
  mcpVerifyContextMaxItems?: number
  mcpVerifyRetryCount?: number

  // Stream Status Watcher Configuration
  streamStatusWatcherEnabled?: boolean
  streamStatusFilePath?: string

  // Legacy ACP Agent Configuration retained only for migration
  acpAgents?: ACPAgentConfig[]

  // Unified Agent Profiles (managed by agent-profile-service)
  agentProfiles?: SharedAgentProfile[]

  // Push Notification Configuration for Mobile App
  // Stores registered push notification tokens from mobile clients
  pushNotificationTokens?: SharedPushNotificationToken[]

  // Repeat Tasks Configuration
  loops?: SharedLoopConfig[]  // Scheduled repeat tasks that run at intervals
}
