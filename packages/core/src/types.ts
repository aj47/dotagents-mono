/**
 * Core domain types for @dotagents/core.
 *
 * These types define the shapes used by core services (agents-files, config, etc.).
 * They are structurally compatible with the full type definitions in the desktop app.
 * Desktop's types.ts may define more detailed versions that are assignable to these.
 */

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

export type {
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteEntryType,
} from '@dotagents/shared/knowledge-note-domain'

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
export type {
  AgentProfile,
  AgentProfileConnection,
  AgentProfileConnectionType,
  AgentProfilesData,
  AgentProfileToolConfig,
} from '@dotagents/shared/agent-profile-domain'

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
