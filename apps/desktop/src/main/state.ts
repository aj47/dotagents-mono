// Re-export from @dotagents/core
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
