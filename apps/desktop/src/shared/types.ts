import type {
  CHAT_PROVIDER_ID,
  STT_PROVIDER_ID,
  TTS_PROVIDER_ID,
  OPENAI_COMPATIBLE_PRESET_ID,
  ModelPreset,
} from '@dotagents/shared/providers'
import type {
  ToolCall,
  ToolResult,
  LoopConfig as SharedLoopConfig,
} from '@dotagents/shared/types'
import type {
  AgentConversationState,
} from '@dotagents/shared/conversation-state'
import {
  legacyAcpAgentConfigToAgentProfile as sharedLegacyAcpAgentConfigToAgentProfile,
  legacyPersonaToAgentProfile as sharedLegacyPersonaToAgentProfile,
  legacyProfileToAgentProfile as sharedLegacyProfileToAgentProfile,
} from '@dotagents/shared/agent-profile-legacy-converters'

export type { ToolCall, ToolResult, BaseChatMessage, ConversationHistoryMessage, ChatApiResponse, LoopConfig, LoopSchedule, AgentSkill, AgentSkillsData } from '@dotagents/shared/types'
export type { AgentConversationState } from '@dotagents/shared/conversation-state'
export type { AgentProgressUpdate, AgentProgressStep, ACPSubAgentMessage, ACPDelegationProgress, ACPDelegationState, ACPConfigOption, ACPConfigOptionValue, AgentStepSummary, OnProgressCallback } from '@dotagents/shared/agent-progress'
export type { KnowledgeNote, KnowledgeNoteContext, KnowledgeNoteEntryType } from '@dotagents/core'

export type KnowledgeNoteSort =
  | "relevance"
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc"

export type KnowledgeNoteDateFilter = "all" | "7d" | "30d" | "90d" | "year"

export type KnowledgeNoteSeriesSummary = {
  key: string
  label: string
  count: number
}

export type KnowledgeNoteGroupSummary = {
  key: string
  label: string
  totalCount: number
  directCount: number
  seriesSummaries: KnowledgeNoteSeriesSummary[]
}

export type KnowledgeNotesOverview = {
  total: number
  autoCount: number
  searchOnlyCount: number
  groups: KnowledgeNoteGroupSummary[]
}

export type RecordingHistoryItem = {
  id: string
  createdAt: number
  duration: number
  transcript: string
}

// Predefined Prompts Types
export interface PredefinedPrompt {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

// MCP Server Configuration Types
export type MCPTransportType = "stdio" | "websocket" | "streamableHttp"

// OAuth 2.1 Configuration Types
export interface OAuthClientMetadata {
  client_name: string
  redirect_uris: string[]
  grant_types: string[]
  response_types: string[]
  scope?: string
  token_endpoint_auth_method?: string
}

export interface OAuthTokens {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  expires_at?: number // Calculated expiration timestamp
}

export interface OAuthServerMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  registration_endpoint?: string
  jwks_uri?: string
  scopes_supported?: string[]
  response_types_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export interface OAuthConfig {
  // Server metadata (discovered or manually configured)
  serverMetadata?: OAuthServerMetadata

  // Client registration info (from dynamic registration or manual config)
  clientId?: string
  clientSecret?: string
  clientMetadata?: OAuthClientMetadata

  // Stored tokens
  tokens?: OAuthTokens

  // Configuration options
  scope?: string
  useDiscovery?: boolean // Whether to use .well-known/oauth-authorization-server
  useDynamicRegistration?: boolean // Whether to use RFC7591 dynamic client registration
  // Optional override for redirect URI (e.g., when the provider disallows custom schemes)
  redirectUri?: string

  // Pending authorization state (used during OAuth flow)
  pendingAuth?: {
    codeVerifier: string
    state: string
  }
}

export interface MCPServerConfig {
  // Transport configuration
  transport?: MCPTransportType // defaults to "stdio" for backward compatibility

  // For stdio transport (local command-based servers)
  command?: string
  args?: string[]
  env?: Record<string, string>

  // For remote transports (websocket/streamableHttp)
  url?: string

  // Custom HTTP headers for streamableHttp transport
  headers?: Record<string, string>

  // OAuth configuration for protected servers
  oauth?: OAuthConfig

  // Common configuration
  timeout?: number
  disabled?: boolean
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>
}

export interface ServerLogEntry {
  timestamp: number
  message: string
}

export interface DetailedToolInfo {
  name: string
  description: string
  sourceKind: "mcp" | "runtime"
  sourceName: string
  sourceLabel: string
  serverName?: string
  enabled: boolean
  serverEnabled: boolean
  inputSchema: any
}

// Agent Mode Progress Tracking Types — re-exported from @dotagents/shared (see above)

// AgentStepSummary — re-exported from @dotagents/shared (see above)

// Message Queue Types — re-exported from shared package
export type { QueuedMessage, MessageQueue } from '@dotagents/shared/message-queue-utils'

// Conversation Types
export interface ConversationMessage {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  /**
   * Optional display-only override for renderer history. This is persisted so
   * saved sessions can show UI-only annotations such as Codex thinking blocks,
   * but model replay must continue to use `content`.
   */
  displayContent?: string
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

export interface ConversationCompactionFact {
  /** Raw-message index this fact was extracted from before compaction. */
  sourceMessageIndex: number
  /** Persisted message id for provenance when available. */
  sourceMessageId?: string
  sourceRole: "user" | "assistant" | "tool" | string
  timestamp?: number
  excerpt: string
  repoSlugs?: string[]
  urls?: string[]
  paths?: string[]
  identifiers?: string[]
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
  /** Stable checkpoint summary persisted during the latest compaction pass. */
  summary?: string
  /** Message id of the synthetic summary message in Conversation.messages. */
  summaryMessageId?: string
  /** Message id of the first raw message replayed after the summary checkpoint. */
  firstKeptMessageId?: string
  /** Raw-message index of the first message replayed after the summary checkpoint. */
  firstKeptMessageIndex?: number
  summarizedRange?: {
    startMessageId?: string
    endMessageId?: string
    startIndex: number
    endIndex: number
  }
  summarizedMessageCount?: number
  /** Estimated token count for the summarized range before compaction. */
  tokensBefore?: number
  /** Deterministic high-signal facts extracted from the summarized range. */
  extractedFacts?: ConversationCompactionFact[]
  /**
   * Marks conversations whose older raw history was previously discarded and cannot
   * be fully recovered.
   */
  partialReason?: "legacy_summary_without_raw_messages"
}

/**
 * Provenance metadata for conversations created via "Branch from here".
 */
export interface ConversationBranchSource {
  /** The conversation ID that this conversation was branched from */
  sourceConversationId: string
  /** The index of the message (in the source conversation) that the branch was created from */
  sourceMessageIndex: number
  /** Timestamp of when the branch was created */
  branchedAt: number
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
  /** Branch provenance: set when this conversation was created by branching from another */
  branchSource?: ConversationBranchSource
}

export interface LoadedConversation extends Conversation {
  /** Start index of `messages` within the persisted conversation when loaded as a window. */
  messageOffset?: number
  /** Total number of persisted display messages before windowing. */
  totalMessageCount?: number
  /** Raw-history branch index represented before the first loaded display message. */
  branchMessageIndexOffset?: number
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

export type ProfileMcpServerConfig = {
  disabledServers?: string[]
  disabledTools?: string[]
  // When true, newly-added MCP servers (added after profile creation) are also disabled by default
  // This ensures strict opt-in behavior for profiles created with "all MCPs disabled"
  allServersDisabledByDefault?: boolean
  // When allServersDisabledByDefault is true, this list contains servers that are explicitly ENABLED
  // (i.e., servers the user has opted-in to use for this profile)
  enabledServers?: string[]
  // When set, only these runtime tools are enabled (whitelist approach for agents)
  // If undefined, all runtime tools are available (default behavior)
  enabledRuntimeTools?: string[]
}

export type ProfileModelConfig = {
  // Agent model settings
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
  // STT Provider settings
  sttProviderId?: "openai" | "groq" | "parakeet"
  openaiSttModel?: string
  groqSttModel?: string
  // Transcript Post-Processing settings
  transcriptPostProcessingProviderId?: "openai" | "groq" | "gemini" | "chatgpt-web"
  transcriptPostProcessingOpenaiModel?: string
  transcriptPostProcessingGroqModel?: string
  transcriptPostProcessingGeminiModel?: string
  transcriptPostProcessingChatgptWebModel?: string
  // TTS Provider settings
  ttsProviderId?: "openai" | "groq" | "gemini" | "edge" | "kitten" | "supertonic"
}

// Per-agent skills configuration.
// Missing config or allSkillsDisabledByDefault=false means all skills are enabled.
// When allSkillsDisabledByDefault=true, only enabledSkillIds are enabled.
export type ProfileSkillsConfig = {
  // List of skill IDs that are enabled for this agent
  enabledSkillIds?: string[]
  // When true, newly-added skills are also disabled by default for this agent
  // This ensures strict opt-in behavior
  allSkillsDisabledByDefault?: boolean
}

// Profile Management Types
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

/**
 * Snapshot of profile settings captured at session creation time.
 * This ensures session isolation - changes to the global profile don't affect running sessions.
 */
export type SessionProfileSnapshot = {
  profileId: string
  profileName: string
  guidelines: string
  systemPrompt?: string
  mcpServerConfig?: ProfileMcpServerConfig
  modelConfig?: ProfileModelConfig
  /** Skills instructions to inject into the system prompt (from agent's enabled skills) */
  skillsInstructions?: string
  /** Dynamic agent properties exposed in system prompt (from agent's properties) */
  agentProperties?: Record<string, string>
  skillsConfig?: ProfileSkillsConfig
}

// ============================================================================
// Agent Management Types (legacy Persona types kept for backward compatibility)
// ============================================================================

/**
 * MCP server and tool access configuration for an agent.
 * Controls which MCP servers and tools the agent can access.
 */
type PersonaMcpServerConfig = {
  /** MCP servers enabled for this agent */
  enabledServers: string[]
  /** Specific tools disabled within enabled servers */
  disabledTools?: string[]
  /** Runtime tools enabled for this agent */
  enabledRuntimeTools?: string[]
}

/**
 * Model configuration for an agent.
 * When using the built-in internal agent, this defines which LLM to use.
 * When using an external ACP agent, model config is handled by that agent.
 *
 * @deprecated Use ProfileModelConfig instead for full preset support.
 * Kept for backward compatibility with existing agent data.
 */
type PersonaModelConfig = {
  /** LLM provider for this agent */
  providerId: "openai" | "groq" | "gemini" | "chatgpt-web"
  /** Model name/identifier */
  model: string
  /** Optional temperature override (0-2) */
  temperature?: number
  /** Optional max tokens override */
  maxTokens?: number
}

/**
 * Skills configuration for an agent.
 * Defines which skills are enabled for this agent.
 */
type PersonaSkillsConfig = {
  /** Skill IDs enabled for this agent */
  enabledSkillIds: string[]
}

/**
 * Connection configuration for an agent.
 * Defines how to connect to the agent's underlying implementation.
 *
 * Two main modes:
 * 1. Built-in agent (type: "internal") - Uses DotAgents' internal agent with agent's model config
 * 2. External ACP agent (type: "acp-agent") - Delegates to a configured ACP agent by name
 */
type PersonaConnectionConfig = {
  /**
   * Connection type:
   * - "internal": Uses built-in DotAgents agent (model config from agent)
   * - "acp-agent": Uses an external ACP agent (model config from agent settings)
   * - "stdio": Direct stdio process (legacy, for advanced use)
   * - "remote": Remote HTTP endpoint (legacy, for advanced use)
   */
  type: "internal" | "acp-agent" | "stdio" | "remote"
  /** For acp-agent: Name of the ACP agent to use */
  acpAgentName?: string
  /** For stdio: command to run */
  command?: string
  /** For stdio: command arguments */
  args?: string[]
  /** For stdio: environment variables */
  env?: Record<string, string>
  /** For stdio: working directory */
  cwd?: string
  /** For remote: base URL of the agent server */
  baseUrl?: string
}

/**
 * Legacy Persona definition (kept for backward compatibility / migration).
 * An agent represents a specialized AI assistant with specific capabilities,
 * system prompts, and tool access configurations.
 */
export type Persona = {
  /** Unique identifier for the agent */
  id: string
  /** Internal name (used for referencing) */
  name: string
  /** Human-readable display name */
  displayName: string
  /** Description of what this agent does */
  description: string
  /** System prompt that defines the agent's behavior */
  systemPrompt: string
  /** Additional guidelines for the agent */
  guidelines: string
  /**
   * Dynamic properties for this agent.
   * Exposed in the system prompt as "Property Name: Value" format.
   */
  properties?: Record<string, string>
  /** MCP server and tool access configuration */
  mcpServerConfig: PersonaMcpServerConfig
  /**
   * @deprecated Use profileModelConfig instead for full preset support.
   * Kept for backward compatibility.
   */
  modelConfig?: PersonaModelConfig
  /**
   * Model configuration using the same format as profiles.
   * Only used when connection.type is "internal".
   * When using an external ACP agent, model is configured in agent settings.
   */
  profileModelConfig?: ProfileModelConfig
  /** Skills configuration */
  skillsConfig: PersonaSkillsConfig
  /** Connection configuration for the underlying agent */
  connection: PersonaConnectionConfig
  /** Whether this agent maintains conversation state */
  isStateful: boolean
  /** Current conversation ID for stateful agents */
  conversationId?: string
  /** Whether this agent is enabled */
  enabled: boolean
  /** Whether this is a built-in agent (cannot be deleted) */
  isBuiltIn?: boolean
  /** Creation timestamp */
  createdAt: number
  /** Last update timestamp */
  updatedAt: number
}

/**
 * Storage format for agents data (legacy format).
 */
export type PersonasData = {
  /** List of all agents */
  personas: Persona[]
}

// ============================================================================
// Unified Agent Profile Type
// Consolidates legacy Profile, Persona, and ACPAgentConfig into a single Agent type
// ============================================================================

/**
 * Connection type for an agent profile.
 * - "internal": Uses built-in DotAgents agent (model config from profile)
 * - "acpx": External agent executed through the acpx CLI
 * - "remote": Remote HTTP endpoint
 */
export type AgentProfileConnectionType = "internal" | "acpx" | "acp" | "stdio" | "remote"

/**
 * Connection configuration for an agent profile.
 */
export type AgentProfileConnection = {
  type: AgentProfileConnectionType
  /** For acpx custom adapters: command to run through `acpx --agent` */
  command?: string
  /** For acpx custom adapters: command arguments */
  args?: string[]
  /** For acpx sessions: built-in or configured acpx agent id */
  agent?: string
  /** For acpx custom adapters: environment variables */
  env?: Record<string, string>
  /** For acpx sessions: preferred working directory */
  cwd?: string
  /** For remote: base URL of the agent server */
  baseUrl?: string
}

/**
 * Tool access configuration for an agent profile.
 * Controls which MCP servers and tools the agent can access.
 */
export type AgentProfileToolConfig = {
  /** MCP servers enabled for this agent (whitelist) */
  enabledServers?: string[]
  /** MCP servers disabled for this agent (blacklist) */
  disabledServers?: string[]
  /** Specific tools disabled */
  disabledTools?: string[]
  /** Runtime tools enabled (whitelist) - if undefined, all are available */
  enabledRuntimeTools?: string[]
  /** When true, newly-added servers are disabled by default */
  allServersDisabledByDefault?: boolean
}

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
export type PreferredAgentProfileRole = "chat-agent" | "delegation-target" | "external-agent"
export type LegacyAgentProfileRole = "user-profile"
export type AgentProfileRole = PreferredAgentProfileRole | LegacyAgentProfileRole

export function normalizeAgentProfileRole(role: AgentProfileRole | string | undefined): PreferredAgentProfileRole | undefined {
  if (!role) return undefined
  if (role === "user-profile") return "chat-agent"
  if (role === "chat-agent" || role === "delegation-target" || role === "external-agent") return role
  return undefined
}

export type AgentProfile = {
  /** Unique identifier */
  id: string
  /** Canonical name used for lookup (defaults to displayName; no longer auto-slugified) */
  name: string
  /** Human-readable display name (the single user-facing name) */
  displayName: string
  /** Description of what this agent does */
  description?: string
  /** Custom avatar as a base64 data URL. If absent, a deterministic face is generated. */
  avatarDataUrl?: string | null

  // Behavior
  /** System prompt that defines the agent's behavior */
  systemPrompt?: string
  /** Additional guidelines for the agent */
  guidelines?: string
  /** Dynamic properties exposed in system prompt */
  properties?: Record<string, string>

  // Model Configuration (only for internal execution)
  /** Model configuration - uses ProfileModelConfig format */
  modelConfig?: ProfileModelConfig

  // Tool Access
  /** Tool and MCP server access configuration */
  toolConfig?: AgentProfileToolConfig

  // Skills
  /** Skills configuration */
  skillsConfig?: ProfileSkillsConfig

  // Connection - how to run this agent
  /** Connection configuration for the underlying agent */
  connection: AgentProfileConnection

  // State
  /** Whether this agent maintains conversation state */
  isStateful?: boolean
  /** Current conversation ID for stateful agents */
  conversationId?: string

  // Role Classification
  /** Role classification for this agent profile */
  role?: AgentProfileRole

  // Flags
  /** Whether this agent is enabled */
  enabled: boolean
  /** Whether this is a built-in agent (cannot be deleted) */
  isBuiltIn?: boolean
  /** Whether this appears in the agent picker (legacy, use role instead) */
  isUserProfile?: boolean
  /** Whether this is available as a delegation target (legacy, use role instead) */
  isAgentTarget?: boolean
  /** Whether this is the default profile */
  isDefault?: boolean
  /** Whether to auto-spawn this agent on app startup (for ACP agents) */
  autoSpawn?: boolean

  // Timestamps
  createdAt: number
  updatedAt: number
}

/**
 * Storage format for agent profiles.
 */
export type AgentProfilesData = {
  profiles: AgentProfile[]
  currentProfileId?: string
}

// ============================================================================
// Migration Utilities
// ============================================================================

/**
 * Convert a legacy Profile to AgentProfile.
 */
export function profileToAgentProfile(profile: Profile): AgentProfile {
  return sharedLegacyProfileToAgentProfile(profile) as AgentProfile
}

/**
 * Convert a legacy Persona to AgentProfile (for migration).
 */
export function personaToAgentProfile(persona: Persona): AgentProfile {
  return sharedLegacyPersonaToAgentProfile(persona) as AgentProfile
}

/**
 * Convert a legacy ACPAgentConfig to AgentProfile.
 */
export function acpAgentConfigToAgentProfile(config: ACPAgentConfig): AgentProfile {
  return sharedLegacyAcpAgentConfigToAgentProfile(config) as AgentProfile
}

// ModelPreset — re-exported from shared package (superset of all platform definitions)
export type { ModelPreset } from '@dotagents/shared/providers'

// ============================================================================
// Model Information Types
// ============================================================================

/**
 * Basic model information returned from provider APIs (OpenAI, Groq, Gemini).
 * This is the minimal structure for displaying and selecting models.
 */
export interface ModelInfo {
  id: string
  name: string
  description?: string
  context_length?: number
  created?: number
  /** Whether this model supports speech-to-text transcription */
  supportsTranscription?: boolean
}

// ============================================================================
// Models.dev API Types
// Types for enhanced model information from https://models.dev API
// ============================================================================

/**
 * Cost information for a model (USD per million tokens).
 */
export interface ModelsDevCost {
  /** Cost per million input tokens */
  input: number
  /** Cost per million output tokens */
  output: number
  /** Cost per million reasoning tokens (optional) */
  reasoning?: number
  /** Cost per million cache read tokens (optional) */
  cache_read?: number
  /** Cost per million cache write tokens (optional) */
  cache_write?: number
}

/**
 * Token limits for a model.
 */
export interface ModelsDevLimit {
  /** Maximum context window size (tokens) */
  context: number
  /** Maximum output tokens */
  output: number
  /** Maximum input tokens (optional, usually same as context) */
  input?: number
}

/**
 * Input/output modalities supported by a model.
 */
export interface ModelsDevModalities {
  /** Input modalities (e.g., ["text", "image", "audio"]) */
  input: string[]
  /** Output modalities (e.g., ["text", "image"]) */
  output: string[]
}

/**
 * Model information from models.dev API.
 * Contains detailed metadata about model capabilities and pricing.
 */
export interface ModelsDevModel {
  /** Model identifier (e.g., "gpt-4o", "claude-3-opus") */
  id: string
  /** Human-readable model name */
  name: string
  /** Model family (optional, e.g., "GPT-4", "Claude 3") */
  family?: string

  // Capability flags
  /** Whether the model supports file/image attachments */
  attachment: boolean
  /** Whether the model supports reasoning/chain-of-thought */
  reasoning: boolean
  /** Whether the model supports tool/function calling */
  tool_call: boolean
  /** Whether the model supports structured output (JSON mode) */
  structured_output: boolean
  /** Whether the model supports temperature parameter */
  temperature: boolean

  // Metadata
  /** Knowledge cutoff date (optional) */
  knowledge?: string
  /** Release date (optional) */
  release_date?: string
  /** Last updated date (optional) */
  last_updated?: string
  /** Whether model weights are publicly available */
  open_weights: boolean

  /** Pricing information (USD per million tokens) */
  cost: ModelsDevCost
  /** Token limits */
  limit: ModelsDevLimit
  /** Supported input/output modalities */
  modalities: ModelsDevModalities
}

/**
 * Provider information from models.dev API.
 * Contains metadata about an LLM provider and its available models.
 */
export interface ModelsDevProvider {
  /** Provider identifier (e.g., "openai", "anthropic") */
  id: string
  /** Human-readable provider name */
  name: string
  /** NPM package name for the provider SDK */
  npm: string
  /** API endpoint (optional) */
  api?: string
  /** Environment variable for API key */
  env: string
  /** Documentation URL */
  doc: string
  /** Available models from this provider */
  models: Record<string, ModelsDevModel>
}

/**
 * Complete models.dev data structure.
 * Maps provider IDs to their provider information and models.
 */
export type ModelsDevData = Record<string, ModelsDevProvider>

/**
 * Enhanced model information combining basic ModelInfo with models.dev data.
 * Used when we have additional metadata from the models.dev API.
 * Backward compatible - all enhanced fields are optional.
 */
export interface EnhancedModelInfo extends ModelInfo {
  /** Model family (e.g., "GPT-4", "Claude 3") */
  family?: string

  // Capability flags from models.dev
  /** Whether the model supports file/image attachments */
  supportsAttachment?: boolean
  /** Whether the model supports reasoning/chain-of-thought */
  supportsReasoning?: boolean
  /** Whether the model supports tool/function calling */
  supportsToolCalls?: boolean
  /** Whether the model supports structured output (JSON mode) */
  supportsStructuredOutput?: boolean
  /** Whether the model supports temperature parameter */
  supportsTemperature?: boolean

  // Metadata from models.dev
  /** Knowledge cutoff date */
  knowledge?: string
  /** Release date */
  releaseDate?: string
  /** Last updated date */
  lastUpdated?: string
  /** Whether model weights are publicly available */
  openWeights?: boolean

  // Pricing (USD per million tokens)
  /** Cost per million input tokens */
  inputCost?: number
  /** Cost per million output tokens */
  outputCost?: number
  /** Cost per million reasoning tokens */
  reasoningCost?: number
  /** Cost per million cache read tokens */
  cacheReadCost?: number
  /** Cost per million cache write tokens */
  cacheWriteCost?: number

  // Limits
  /** Maximum context window size (tokens) */
  contextLimit?: number
  /** Maximum input tokens */
  inputLimit?: number
  /** Maximum output tokens */
  outputLimit?: number

  // Modalities
  /** Input modalities (e.g., ["text", "image", "audio"]) */
  inputModalities?: string[]
  /** Output modalities (e.g., ["text", "image"]) */
  outputModalities?: string[]
}

// Legacy ACP Agent Configuration Types (read-only migration input)
type ACPConnectionType = "stdio" | "remote" | "internal" | "acp"

// ACPConfigOptionValue and ACPConfigOption — re-exported from @dotagents/shared (see above)

export interface ACPAgentConfig {
  // Unique identifier for the agent
  name: string
  // Human-readable display name
  displayName: string
  // Description of what the agent does
  description?: string
  // Whether to auto-spawn this agent on app startup
  autoSpawn?: boolean
  // Whether this agent is enabled
  enabled?: boolean
  // Whether this is a built-in internal agent (cannot be deleted)
  isInternal?: boolean
  // Connection configuration
  connection: {
    // Legacy connection type retained for one-way migration into acpx-backed profiles.
    type: ACPConnectionType
    // For stdio/acp: command to run (e.g., "auggie", "claude-code-acp")
    command?: string
    // For stdio/acp: command arguments (e.g., ["--acp"])
    args?: string[]
    // For stdio/acp: environment variables
    env?: Record<string, string>
    // For stdio/acp: working directory to spawn the agent in
    cwd?: string
    // For remote: base URL of the ACP server
    baseUrl?: string
  }
}

export type Config = {
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

  sttProviderId?: STT_PROVIDER_ID

  openaiApiKey?: string
  openaiBaseUrl?: string
  openaiCompatiblePreset?: OPENAI_COMPATIBLE_PRESET_ID

  modelPresets?: ModelPreset[]
  currentModelPresetId?: string

  groqApiKey?: string
  groqBaseUrl?: string
  groqSttPrompt?: string

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

  // Speech-to-Text Language Configuration
  sttLanguage?: string
  openaiSttLanguage?: string
  openaiSttModel?: string
  groqSttLanguage?: string
  groqSttModel?: string

  // Transcription Preview - show live transcription while recording
  transcriptionPreviewEnabled?: boolean

  // Parakeet (Local) STT Configuration
  parakeetModelPath?: string // Optional custom model path
  parakeetNumThreads?: number // Number of threads (default: 2)
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
  mcpRequireApprovalBeforeToolCall?: boolean
  mcpAutoPasteEnabled?: boolean
  mcpAutoPasteDelay?: number
  mcpMaxIterations?: number
  mcpUnlimitedIterations?: boolean

  // MCP Server Configuration
  mcpConfig?: MCPConfig

  mcpRuntimeDisabledServers?: string[]

  mcpDisabledTools?: string[]

  // UI State Persistence - Collapsed/Expanded sections in Settings
  mcpToolsCollapsedServers?: string[]  // Server names that are collapsed in the Tools section
  mcpServersCollapsedServers?: string[]  // Server names that are collapsed in the Servers section

  // Conversation Configuration
  conversationsEnabled?: boolean
  maxConversationsToKeep?: number
  autoSaveConversations?: boolean

  // Session History Configuration
  pinnedSessionIds?: string[]
  archivedSessionIds?: string[]

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
  mcpContextReductionEnabled?: boolean
  mcpContextTargetRatio?: number
  mcpContextLastNMessages?: number
  mcpContextSummarizeCharThreshold?: number
  mcpMaxContextTokensOverride?: number

  // Tool Response Processing Configuration
  mcpToolResponseProcessingEnabled?: boolean
  mcpToolResponseLargeThreshold?: number
  mcpToolResponseCriticalThreshold?: number
  mcpToolResponseChunkSize?: number
  mcpToolResponseProgressUpdates?: boolean

  // Completion Verification Configuration
  mcpVerifyCompletionEnabled?: boolean
  mcpVerifyContextMaxItems?: number
  mcpVerifyRetryCount?: number

  // Final Summary Configuration
  mcpFinalSummaryEnabled?: boolean

  // Dual-Model Configuration
  dualModelEnabled?: boolean

  // Parallel Tool Execution Configuration
  mcpParallelToolExecution?: boolean

  // Message Queue Configuration - when enabled, users can queue messages while agent is processing
  mcpMessageQueueEnabled?: boolean

  // Predefined Prompts - frequently used prompts that can be quickly accessed
  predefinedPrompts?: PredefinedPrompt[]

	  // Remote Server Configuration
	  remoteServerEnabled?: boolean
	  remoteServerPort?: number
	  remoteServerBindAddress?: "127.0.0.1" | "0.0.0.0"
	  remoteServerApiKey?: string
	  remoteServerLogLevel?: "error" | "info" | "debug"
	  remoteServerCorsOrigins?: string[]
		  remoteServerOperatorAllowDeviceIds?: string[]
	  remoteServerAutoShowPanel?: boolean // Auto-show floating panel when receiving remote messages
	  remoteServerTerminalQrEnabled?: boolean // Print QR code to terminal for mobile app pairing (auto-enabled in headless mode)

  // Cloudflare Tunnel Configuration
  // Tunnel mode: "quick" for random URLs (no account required), "named" for persistent URLs (requires account)
  cloudflareTunnelMode?: "quick" | "named"
  // Auto-start tunnel on app startup (requires remote server to be enabled)
  cloudflareTunnelAutoStart?: boolean
  // Named tunnel configuration (for persistent URLs)
  cloudflareTunnelId?: string // The tunnel UUID (e.g., "abc123-def456-...")
  cloudflareTunnelName?: string // Human-readable tunnel name
  cloudflareTunnelCredentialsPath?: string // Path to credentials JSON file (defaults to ~/.cloudflared/<tunnel-id>.json)
  cloudflareTunnelHostname?: string // Custom hostname for the tunnel (e.g., "myapp.example.com")

  // WhatsApp Integration Configuration
  whatsappEnabled?: boolean
  whatsappAllowFrom?: string[]  // Phone numbers allowed to message (international format without +)
  whatsappOperatorAllowFrom?: string[] // Phone numbers allowed to issue /ops commands
  whatsappAutoReply?: boolean   // Auto-reply to messages using agent
  whatsappLogMessages?: boolean // Log message content (privacy concern)

  // Discord Integration Configuration
  discordEnabled?: boolean
  discordBotToken?: string
  discordDmEnabled?: boolean
  discordRequireMention?: boolean
  discordAllowUserIds?: string[]
  discordAllowGuildIds?: string[]
  discordAllowChannelIds?: string[]
  discordAllowRoleIds?: string[]
  discordDmAllowUserIds?: string[]
  discordOperatorAllowUserIds?: string[]
  discordOperatorAllowGuildIds?: string[]
  discordOperatorAllowChannelIds?: string[]
  discordOperatorAllowRoleIds?: string[]
  discordDefaultProfileId?: string
  discordLogMessages?: boolean
  /**
   * Session epoch counter per Discord conversation key (DM channel, guild
   * channel, or thread). Incremented by the `/new` slash command to fork a
   * fresh conversation while preserving the previous session's history in
   * the agent's conversation store.
   *
   * Absent or 0 means "no suffix" (backward-compatible with pre-session
   * behavior). See `getDiscordConversationId` in discord-utils.ts.
   */
  discordConversationEpochs?: Record<string, number>

  // Stream Status Watcher Configuration
  streamStatusWatcherEnabled?: boolean
  streamStatusFilePath?: string

  // Legacy ACP Agent Configuration retained only for migration
  acpAgents?: ACPAgentConfig[]

  // Unified Agent Profiles (managed by agent-profile-service)
  agentProfiles?: AgentProfile[]

  // Main agent mode: "api" uses external LLM API, "acpx" uses an acpx-managed agent as the brain
  mainAgentMode?: "api" | "acpx"

  // Name of the acpx agent profile to use when mainAgentMode is "acpx"
  mainAgentName?: string

  // Streamer Mode Configuration
  // When enabled, hides sensitive information (phone numbers, QR codes, API keys) for screen sharing
  streamerModeEnabled?: boolean

  // Push Notification Configuration for Mobile App
  // Stores registered push notification tokens from mobile clients
  pushNotificationTokens?: PushNotificationToken[]

  // Langfuse Observability Configuration
  // When enabled, traces all LLM calls, agent sessions, and MCP tool calls
  langfuseEnabled?: boolean
  langfusePublicKey?: string
  langfuseSecretKey?: string
  langfuseBaseUrl?: string // Default: https://cloud.langfuse.com (or custom self-hosted URL)

  // Local Trace Logging — opt-in JSONL logs on disk (independent of Langfuse Cloud)
  // When enabled, each agent trace/session is appended to its own local JSONL
  // file. Useful when Langfuse Cloud free-tier limits would block
  // capture and the user only wants local logs for debugging.
  localTraceLoggingEnabled?: boolean
  localTraceLogPath?: string // Default directory: <dataFolder>/traces

  // Repeat Tasks Configuration
  loops?: SharedLoopConfig[]  // Scheduled repeat tasks that run at intervals
}

// Push Notification Token (from mobile clients)
export interface PushNotificationToken {
  token: string
  type: 'expo'
  platform: 'ios' | 'android'
  registeredAt: number
  deviceId?: string
  badgeCount?: number // Tracks unread notification count for this device
}


// MCP Elicitation Types (Protocol 2025-11-25)
export interface ElicitationFormField {
  type: "string" | "number" | "boolean" | "enum"
  title?: string
  description?: string
  default?: string | number | boolean
  // String-specific
  minLength?: number
  maxLength?: number
  format?: "email" | "uri" | "date" | "date-time"
  // Number-specific
  minimum?: number
  maximum?: number
  // Enum-specific
  enum?: string[]
  enumNames?: string[]
}

export interface ElicitationFormSchema {
  type: "object"
  properties: Record<string, ElicitationFormField>
  required?: string[]
}

export interface ElicitationFormRequest {
  mode: "form"
  serverName: string
  message: string
  requestedSchema: ElicitationFormSchema
  requestId: string
}

export interface ElicitationUrlRequest {
  mode: "url"
  serverName: string
  message: string
  url: string
  elicitationId: string
  requestId: string
}

export type ElicitationRequest = ElicitationFormRequest | ElicitationUrlRequest

export interface ElicitationResult {
  action: "accept" | "decline" | "cancel"
  content?: Record<string, string | number | boolean | string[]>
}

// MCP Sampling Types (Protocol 2025-11-25)
export interface SamplingMessageContent {
  type: "text" | "image" | "audio"
  text?: string
  data?: string
  mimeType?: string
}

export interface SamplingMessage {
  role: "user" | "assistant"
  content: SamplingMessageContent | SamplingMessageContent[]
}

export interface SamplingRequest {
  serverName: string
  requestId: string
  messages: SamplingMessage[]
  systemPrompt?: string
  maxTokens: number
  temperature?: number
  modelPreferences?: {
    hints?: Array<{ name?: string }>
    costPriority?: number
    speedPriority?: number
    intelligencePriority?: number
  }
}

export interface SamplingResult {
  approved: boolean
  model?: string
  content?: SamplingMessageContent
  stopReason?: string
}
