/**
 * Core domain types for @dotagents/core.
 *
 * These types define the shapes used by core services (agents-files, config, etc.).
 * They are structurally compatible with the full type definitions in the desktop app.
 * Desktop's types.ts may define more detailed versions that are assignable to these.
 */

import type { AgentProfileRole as SharedAgentProfileRole } from '@dotagents/shared/types'
import type {
  ProfileMcpServerConfig as SharedProfileMcpServerConfig,
  ProfileModelConfig as SharedProfileModelConfig,
  ProfileSkillsConfig as SharedProfileSkillsConfig,
} from '@dotagents/shared/agent-profile-session-snapshot'

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
export type {
  ProfileMcpServerConfig,
  ProfileModelConfig,
  ProfileSkillsConfig,
  SessionProfileSnapshot,
} from '@dotagents/shared/agent-profile-session-snapshot'

// ============================================================================
// Profile & Agent Types
// ============================================================================

export type Profile = {
  id: string
  name: string
  guidelines: string
  createdAt: number
  updatedAt: number
  isDefault?: boolean
  mcpServerConfig?: SharedProfileMcpServerConfig
  modelConfig?: SharedProfileModelConfig
  skillsConfig?: SharedProfileSkillsConfig
  systemPrompt?: string
}

export type ProfilesData = {
  profiles: Profile[]
  currentProfileId?: string
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
  modelConfig?: SharedProfileModelConfig
  toolConfig?: AgentProfileToolConfig
  skillsConfig?: SharedProfileSkillsConfig
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
