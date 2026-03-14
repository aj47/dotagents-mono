/**
 * Core domain types for @dotagents/core.
 *
 * These types define the shapes used by core services (agents-files, config, etc.).
 * They are structurally compatible with the full type definitions in the desktop app.
 * Desktop's types.ts may define more detailed versions that are assignable to these.
 */

// Re-export shared types
export type { ModelPreset } from '@dotagents/shared'

// Import types used locally in this file
import type { ToolCall, ToolResult } from '@dotagents/shared'
export type { ToolCall, ToolResult } from '@dotagents/shared'

// ============================================================================
// Conversation Types
// ============================================================================

export interface ConversationMessage {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  /**
   * When true, this message is a compaction summary that represents older messages
   * in the active context window. The original raw messages may still be preserved
   * in `Conversation.rawMessages`.
   */
  isSummary?: boolean
  /**
   * Number of messages that were summarized into this summary message.
   * Only set when isSummary is true.
   */
  summarizedMessageCount?: number
}

export interface ConversationCompactionMetadata {
  /**
   * Whether the original raw message history is still preserved on disk.
   */
  rawHistoryPreserved: boolean
  /**
   * Number of raw messages preserved separately for compacted conversations.
   * Omitted for legacy compacted sessions where the original history is unavailable.
   */
  storedRawMessageCount?: number
  /**
   * Total number of messages represented by the current conversation payload.
   * For compacted conversations this includes summarized older messages plus active ones.
   */
  representedMessageCount: number
  /**
   * Timestamp of the most recent compaction pass that refreshed the active window.
   */
  compactedAt?: number
  /**
   * Marks conversations whose older raw history was previously discarded and cannot
   * be fully recovered.
   */
  partialReason?: "legacy_summary_without_raw_messages"
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ConversationMessage[]
  rawMessages?: ConversationMessage[]
  compaction?: ConversationCompactionMetadata
  metadata?: {
    totalTokens?: number
    model?: string
    provider?: string
    agentMode?: boolean
  }
}

export interface ConversationHistoryItem {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  lastMessage: string
  preview: string
}

// ============================================================================
// Config — an opaque record for config persistence logic.
// Core modules (modular-config, config) treat Config as a bag of key-value pairs.
// The desktop app's detailed Config type is structurally assignable to this.
// ============================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Config = Record<string, any>

// ============================================================================
// Agent Memory
// ============================================================================
export interface AgentMemory {
  id: string
  createdAt: number
  updatedAt: number
  sessionId?: string
  conversationId?: string
  conversationTitle?: string
  title: string
  content: string
  tags: string[]
  importance: "low" | "medium" | "high" | "critical"
  keyFindings?: string[]
  userNotes?: string
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
  enabledBuiltinTools?: string[]
}

export type ProfileModelConfig = {
  mcpToolsProviderId?: "openai" | "groq" | "gemini"
  mcpToolsOpenaiModel?: string
  mcpToolsGroqModel?: string
  mcpToolsGeminiModel?: string
  currentModelPresetId?: string
  sttProviderId?: "openai" | "groq" | "parakeet"
  openaiSttModel?: string
  groqSttModel?: string
  transcriptPostProcessingProviderId?: "openai" | "groq" | "gemini"
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
  ttsProviderId?: "openai" | "groq" | "gemini" | "kitten" | "supertonic"
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

export type AgentProfileConnectionType = "internal" | "acp" | "stdio" | "remote"

export type AgentProfileConnection = {
  type: AgentProfileConnectionType
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
  enabledBuiltinTools?: string[]
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

// ============================================================================
// ACP Agent Config (legacy)
// ============================================================================

export type ACPConnectionType = "stdio" | "remote" | "internal"

export interface ACPAgentConfig {
  name: string
  displayName: string
  description?: string
  autoSpawn?: boolean
  enabled?: boolean
  isInternal?: boolean
  connection: {
    type: ACPConnectionType
    command?: string
    args?: string[]
    env?: Record<string, string>
    cwd?: string
    baseUrl?: string
  }
}

// ============================================================================
// MCP Types (minimal shapes for LLM engine)
// ============================================================================

/**
 * Minimal MCP tool type used by the LLM engine for tool calling.
 * The full MCP service defines the complete type; this is the subset
 * needed by llm-fetch, context-budget, system-prompts, etc.
 */
export interface MCPTool {
  name: string
  description: string
  inputSchema?: Record<string, unknown>
}

export interface MCPToolCall {
  name: string
  arguments: Record<string, unknown>
}

export interface MCPToolResult {
  content: Array<{
    type: "text"
    text: string
  }>
  isError?: boolean
}

export interface LLMToolCallResponse {
  toolCalls?: MCPToolCall[]
  content?: string
}

// ============================================================================
// Agent Step Summary (re-export from shared)
// ============================================================================
export type { AgentStepSummary } from '@dotagents/shared'

// ============================================================================
// Agent Progress (re-export from shared)
// ============================================================================
export type { AgentProgressStep, AgentProgressUpdate } from '@dotagents/shared'
