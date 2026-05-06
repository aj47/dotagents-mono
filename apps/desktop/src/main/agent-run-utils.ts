export {
  AGENT_STOP_NOTE,
  AGENT_STOPPED_QUEUE_PAUSED_DESCRIPTION,
  ABORTED_BY_EMERGENCY_STOP_REASON,
  DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
  SESSION_STOPPED_BY_KILL_SWITCH_REASON,
  appendAgentStopNote,
  buildAgentStoppedProgressUpdate,
  buildProfileContext,
  describeAgentSessionId,
  getExplicitAgentStopReason,
  getPreferredDelegationOutput,
  resolveExpectedAgentStopReason,
  resolveAgentIterationLimits,
} from "@dotagents/shared/agent-run-utils"

export type {
  AgentIterationLimits,
  AgentSessionIdKind,
  AgentStoppedProgressUpdateOptions,
  ExpectedAgentStopReason,
  ProfileContextSource,
  ResolveExpectedAgentStopReasonOptions,
} from "@dotagents/shared/agent-run-utils"
