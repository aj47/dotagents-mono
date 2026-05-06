/**
 * Core domain types for @dotagents/core.
 *
 * These types define the shapes used by core services (agents-files, config, etc.).
 * They are structurally compatible with the full type definitions in the desktop app.
 * Desktop's types.ts may define more detailed versions that are assignable to these.
 */

import type { AgentProfileRole as SharedAgentProfileRole } from '@dotagents/shared/types'

// Re-export shared types
export type { ModelPreset } from '@dotagents/shared/providers'

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

export type { AgentSkill, AgentSkillsData } from '@dotagents/shared/types'

export type { LoopConfig, LoopSchedule } from '@dotagents/shared/types'
export type {
  AgentProfileRole,
  LegacyAgentProfileRole,
  PreferredAgentProfileRole,
} from '@dotagents/shared/types'
export { normalizeAgentProfileRole } from '@dotagents/shared/types'

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
  sttProviderId?: "openai" | "groq" | "parakeet"
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

export type Profile = {
  id: string
  name: string
  guidelines: string
  createdAt: number
  updatedAt: number
  isDefault?: boolean
  mcpServerConfig?: ProfileMcpServerConfig
  modelConfig?: ProfileModelConfig
  skillsConfig?: ProfileSkillsConfig
  systemPrompt?: string
}

export type ProfilesData = {
  profiles: Profile[]
  currentProfileId?: string
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
  role?: SharedAgentProfileRole
  enabled: boolean
  isBuiltIn?: boolean
  isUserProfile?: boolean
  isAgentTarget?: boolean
  isDefault?: boolean
  autoSpawn?: boolean
  createdAt: number
  updatedAt: number
}

export type AgentProfilesData = {
  profiles: AgentProfile[]
  currentProfileId?: string
}
