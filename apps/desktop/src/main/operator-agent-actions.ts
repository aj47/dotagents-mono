import {
  runOperatorAgentAction,
  stopOperatorAgentSessionAction,
  type OperatorAgentActionOptions,
} from "@dotagents/shared/operator-actions"
import type { AgentRunExecutor } from "@dotagents/shared/agent-run-utils"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { stopAgentSessionById } from "./agent-session-actions"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "./error-utils"

export type OperatorRunAgentExecutor = AgentRunExecutor

export type OperatorAgentActionResult = OperatorRouteActionResult

const agentActionOptions: OperatorAgentActionOptions = {
  diagnostics: {
    logInfo: (...args) => diagnosticsService.logInfo(...args),
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    stopAgentSessionById,
  },
}

export async function runOperatorAgent(
  body: unknown,
  runAgent: OperatorRunAgentExecutor,
): Promise<OperatorAgentActionResult> {
  return runOperatorAgentAction(body, runAgent, agentActionOptions)
}

export async function stopOperatorAgentSession(sessionIdParam: string | undefined): Promise<OperatorAgentActionResult> {
  return stopOperatorAgentSessionAction(sessionIdParam, agentActionOptions)
}
