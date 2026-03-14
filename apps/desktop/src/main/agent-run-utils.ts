// Re-export from @dotagents/core — single source of truth
export {
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  AGENT_STOP_NOTE,
  resolveAgentIterationLimits,
  appendAgentStopNote,
  getLatestAssistantMessageContent,
  buildProfileContext,
  getPreferredDelegationOutput,
} from '@dotagents/core'
export type { AgentIterationLimits } from '@dotagents/core'
