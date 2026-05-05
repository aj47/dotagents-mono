import {
  buildOperatorActionAuditContext,
  buildOperatorActionErrorResponse,
  buildOperatorAgentSessionStopResponse,
  buildOperatorRunAgentResponse,
  parseOperatorRunAgentRequestBody,
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { AgentRunExecutor } from "@dotagents/shared/agent-run-utils"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { stopAgentSessionById } from "./agent-session-actions"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "./error-utils"

export type OperatorRunAgentExecutor = AgentRunExecutor

export type OperatorAgentActionResult = OperatorRouteActionResult

function result(
  statusCode: number,
  body: unknown,
  auditContext?: OperatorActionAuditContext,
): OperatorAgentActionResult {
  return {
    statusCode,
    body,
    ...(auditContext ? { auditContext } : {}),
  }
}

export async function runOperatorAgent(
  body: unknown,
  runAgent: OperatorRunAgentExecutor,
): Promise<OperatorAgentActionResult> {
  try {
    const parsedRequest = parseOperatorRunAgentRequestBody(body)
    if (parsedRequest.ok === false) {
      return result(parsedRequest.statusCode, { error: parsedRequest.error })
    }
    const { prompt, conversationId, profileId } = parsedRequest.request

    diagnosticsService.logInfo("operator-agent-actions", `Operator run-agent: ${prompt.length} chars${conversationId ? ` (conversation ${conversationId})` : ""}`)

    const agentResult = await runAgent({
      prompt,
      conversationId,
      profileId,
    })

    return result(
      200,
      buildOperatorRunAgentResponse(agentResult),
      {
        action: "run-agent",
        success: true,
        details: { promptLength: prompt.length, conversationId },
      },
    )
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    diagnosticsService.logError("operator-agent-actions", `Operator run-agent failed: ${errorMessage}`, caughtError)
    return result(
      500,
      { error: `Agent execution failed: ${errorMessage}` },
      {
        action: "run-agent",
        success: false,
        failureReason: "run-agent-error",
      },
    )
  }
}

export async function stopOperatorAgentSession(sessionIdParam: string | undefined): Promise<OperatorAgentActionResult> {
  const sessionId = sessionIdParam?.trim()
  if (!sessionId) {
    const response = buildOperatorActionErrorResponse("agent-session-stop", "Missing session ID")
    return result(400, response, buildOperatorActionAuditContext(response))
  }

  try {
    const stopResult = await stopAgentSessionById(sessionId)
    const response = buildOperatorAgentSessionStopResponse(stopResult.sessionId, stopResult.conversationId)
    return result(200, response, buildOperatorActionAuditContext(response))
  } catch (caughtError) {
    const errorMessage = getErrorMessage(caughtError)
    const response = buildOperatorActionErrorResponse("agent-session-stop", `Failed to stop agent session: ${errorMessage}`)
    diagnosticsService.logError("operator-agent-actions", `Failed to stop agent session ${sessionId}: ${errorMessage}`, caughtError)
    return result(500, response, buildOperatorActionAuditContext(response))
  }
}
