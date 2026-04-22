/**
 * Core domain types for @dotagents/core.
 *
 * These types define the shapes used by core services (agents-files, config, etc.).
 * They are structurally compatible with the full type definitions in the desktop app.
 * Desktop's types.ts may define more detailed versions that are assignable to these.
 */

// Re-export shared types
export type { ModelPreset } from '@dotagents/shared'

// ============================================================================
// Config — an opaque record for config persistence logic.
// Core modules (modular-config, config) treat Config as a bag of key-value pairs.
// The desktop app's detailed Config type is structurally assignable to this.
// ============================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = Record<string, any>

// ============================================================================
// Knowledge Note
// ============================================================================
export type KnowledgeNoteContext = "auto" | "search-only"
export type KnowledgeNoteEntryType = "note" | "entry" | "overview"

export interface KnowledgeNote {
  id: string
  title: string
  context: KnowledgeNoteContext
  updatedAt: number
  tags: string[]
  body: string
  summary?: string
  createdAt?: number
  references?: string[]
  group?: string
  series?: string
  entryType?: KnowledgeNoteEntryType
}

// ============================================================================
// Agent Skill
// ============================================================================
export interface AgentSkill {
  id: string
  name: string
  description: string
  instructions: string
  createdAt: number
  updatedAt: number
  source?: "local" | "imported"
  filePath?: string
}

// ============================================================================
// Loop Config (Repeat Tasks)
// ============================================================================

/**
 * Wall-clock schedule for a repeat task.
 * - `daily`: fires at each HH:MM in `times` every day.
 * - `weekly`: fires at each HH:MM in `times` on each day in `daysOfWeek`
 *   (0=Sunday, 6=Saturday).
 * All times are interpreted in the machine's local timezone.
 */
export type LoopSchedule =
  | { type: "daily"; times: string[] }
  | { type: "weekly"; times: string[]; daysOfWeek: number[] }

export interface LoopConfig {
  id: string
  name: string
  prompt: string
  /** Fallback fixed interval (minutes) when `schedule` is not set. */
  intervalMinutes: number
  enabled: boolean
  profileId?: string
  lastRunAt?: number
  runOnStartup?: boolean
  /**
   * If true, the session is automatically unsnoozed when the loop completes
   * so the renderer auto-plays TTS for the assistant response. The session
   * still runs snoozed (quietly in the background) during execution — it only
   * wakes up after the result is ready, showing the panel and triggering TTS.
   * Snoozed sessions intentionally suppress TTS auto-play until unsnoozed.
   */
  speakOnTrigger?: boolean
  /**
   * If true, consecutive iterations of this task reuse the most recent
   * session/conversation (revived from completed sessions) so the agent
   * retains prior context. If the prior session can't be revived, a new
   * one is created. Requires `lastSessionId` to be tracked between runs.
   */
  continueInSession?: boolean
  /**
   * When `continueInSession` is enabled, the id of the session to resume on
   * the next run. Auto-populated after each run; may also be set explicitly
   * by the user to pin a specific past session. If the referenced
   * session/conversation can no longer be revived, this field is replaced
   * on the next run with the id of the newly-created fallback session
   * (rather than cleared).
   */
  lastSessionId?: string
  /** Start the next run immediately after the previous run finishes. */
  runContinuously?: boolean
  /** Wall-clock schedule. When present, supersedes `intervalMinutes`. */
  schedule?: LoopSchedule
}

// ============================================================================
// Profile & Agent Types
// ============================================================================

export type ProfileMcpServerConfig = {
  disabledServers?: string[]
  disabledTools?: string[]
  allServersDisabledByDefault?: boolean
  enabledServers?: string[]
  enabledRuntimeTools?: string[]
}

export type ProfileModelConfig = {
  agentProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  agentOpenaiModel?: string
  agentGroqModel?: string
  agentGeminiModel?: string
  agentChatgptWebModel?: string
  /** @deprecated Use agentProviderId instead. */
  mcpToolsProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  /** @deprecated Use agentOpenaiModel instead. */
  mcpToolsOpenaiModel?: string
  /** @deprecated Use agentGroqModel instead. */
  mcpToolsGroqModel?: string
  /** @deprecated Use agentGeminiModel instead. */
  mcpToolsGeminiModel?: string
  /** @deprecated Use agentChatgptWebModel instead. */
  mcpToolsChatgptWebModel?: string
  currentModelPresetId?: string
  sttProviderId?: "openai" | "groq" | "chatgpt-web" | "parakeet"
  openaiSttModel?: string
  groqSttModel?: string
  transcriptPostProcessingProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
  transcriptPostProcessingChatgptWebModel?: string
  ttsProviderId?: "openai" | "groq" | "gemini" | "edge" | "kitten" | "supertonic"
}

export type ProfileSkillsConfig = {
  // Missing config or allSkillsDisabledByDefault=false means all skills are enabled.
  // When allSkillsDisabledByDefault=true, only enabledSkillIds are enabled.
  enabledSkillIds?: string[]
  allSkillsDisabledByDefault?: boolean
}

export type SessionProfileSnapshot = {
  profileId: string
  profileName: string
  guidelines: string
  systemPrompt?: string
  mcpServerConfig?: ProfileMcpServerConfig
  modelConfig?: ProfileModelConfig
  skillsInstructions?: string
  agentProperties?: Record<string, string>
  skillsConfig?: ProfileSkillsConfig
}

export type AgentProfileConnectionType = "internal" | "acpx" | "acp" | "stdio" | "remote"

export type AgentProfileConnection = {
  type: AgentProfileConnectionType
  agent?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
  baseUrl?: string
}

export type AgentProfileToolConfig = {
  enabledServers?: string[]
  disabledServers?: string[]
  disabledTools?: string[]
  enabledRuntimeTools?: string[]
  allServersDisabledByDefault?: boolean
}

export type PreferredAgentProfileRole = "chat-agent" | "delegation-target" | "external-agent"
export type LegacyAgentProfileRole = "user-profile"
export type AgentProfileRole = PreferredAgentProfileRole | LegacyAgentProfileRole

export type AgentProfile = {
  id: string
  name: string
  displayName: string
  description?: string
  avatarDataUrl?: string | null
  systemPrompt?: string
  guidelines?: string
  properties?: Record<string, string>
  modelConfig?: ProfileModelConfig
  toolConfig?: AgentProfileToolConfig
  skillsConfig?: ProfileSkillsConfig
  connection: AgentProfileConnection
  isStateful?: boolean
  conversationId?: string
  role?: AgentProfileRole
  enabled: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  isDefault?: boolean
  autoSpawn?: boolean
  createdAt: number
  updatedAt: number
}
