import { agentProcessManager, llmRequestAbortManager, state, agentSessionStateManager, toolApprovalManager } from "./state"
import { emitAgentProgress } from "./emit-agent-progress"
import { agentSessionTracker } from "./agent-session-tracker"
import { messageQueueService } from "./message-queue-service"
import { acpProcessManager, acpClientService } from "./acp"
import { acpService } from "./acp-service"
import { clearSessionUserResponse } from "./session-user-response-store"
import { runEmergencyStopAll } from "./emergency-stop-core"

/**
 * Centralized emergency stop: abort LLM requests, kill tracked child processes,
 * and reset agent state.
 *
 * NOTE: This does NOT stop MCP servers - they are persistent infrastructure
 * that should remain running across agent mode sessions.
 *
 * Returns before/after counts for logging.
 */
export async function emergencyStopAll(): Promise<{ before: number; after: number }> {
  return runEmergencyStopAll({
    toolApprovalManager,
    agentSessionStateManager,
    agentSessionTracker,
    messageQueueService,
    emitAgentProgress,
    llmRequestAbortManager,
    agentProcessManager,
    state,
    clearSessionUserResponse,
    acpClientService,
    acpProcessManager,
    acpService,
  })
}