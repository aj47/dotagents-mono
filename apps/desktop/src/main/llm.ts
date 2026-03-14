/**
 * Desktop LLM adapter.
 *
 * Re-exports the core LLM engine and wires desktop-specific services
 * (emit-agent-progress, memory-service, agent-session-tracker, conversation-service,
 * skills-service, agent-profile-service) via the setter injection pattern.
 *
 * Callers that import from this file get the same API as before;
 * the underlying implementation now lives in @dotagents/core.
 */

// Re-export everything from core LLM
export {
  postProcessTranscript,
  processTranscriptWithTools,
  processTranscriptWithAgentMode,
  MARK_WORK_COMPLETE_TOOL,
  INTERNAL_COMPLETION_NUDGE_TEXT,
  setLLMProgressEmitter,
  setLLMMemoryService,
  setLLMAgentSessionTracker,
  setLLMConversationService,
  setLLMSkillsService,
  setLLMAgentProfileService,
  setSystemPromptAdditionsFn,
} from '@dotagents/core'
export type {
  LLMMemoryService,
  LLMAgentSessionTracker,
  LLMSkillsService,
  LLMAgentProfileService,
} from '@dotagents/core'
