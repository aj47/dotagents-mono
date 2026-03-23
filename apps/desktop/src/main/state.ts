// Re-export from @dotagents/core
import type { AgentSessionState as CoreAgentSessionState } from "@dotagents/core"

export {
  state,
  isHeadlessMode,
  setHeadlessMode,
  agentProcessManager,
  suppressPanelAutoShow,
  isPanelAutoShowSuppressed,
  llmRequestAbortManager,
  agentSessionStateManager,
  toolApprovalManager,
} from "@dotagents/core"
export type { AgentSessionState } from "@dotagents/core"
export type AgentSessionStopReason = NonNullable<CoreAgentSessionState["stopReason"]>
