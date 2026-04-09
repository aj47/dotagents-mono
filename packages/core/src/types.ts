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
export type KnowledgePageType = "note" | "topic" | "entity" | "project" | "idea" | "opportunity" | "daily" | "source"

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
  pageType?: KnowledgePageType
  aliases?: string[]
  backlinks?: string[]
  status?: string
  importance?: number
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
export interface LoopConfig {
  id: string
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  profileId?: string
  lastRunAt?: number
  runOnStartup?: boolean
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
  mcpToolsProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  mcpToolsOpenaiModel?: string
  mcpToolsGroqModel?: string
  mcpToolsGeminiModel?: string
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

export type AgentProfileRole = "user-profile" | "delegation-target" | "external-agent"

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
