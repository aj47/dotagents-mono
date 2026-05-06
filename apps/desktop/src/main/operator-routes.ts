import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { REMOTE_SERVER_API_ROUTE_PATHS } from "@dotagents/shared/remote-server-api"
import type {
  OperatorRouteActions as SharedOperatorRouteActions,
  OperatorRouteActionResult,
  OperatorRouteAuditContext,
  OperatorRouteOptions as SharedOperatorRouteOptions,
  OperatorRunAgentExecutor,
} from "@dotagents/shared/remote-server-route-contracts"

const API_ROUTES = REMOTE_SERVER_API_ROUTE_PATHS

export type {
  OperatorRouteActionResult,
  OperatorRouteAuditContext,
  OperatorRunAgentExecutor,
}

export type OperatorRouteActions = SharedOperatorRouteActions<FastifyRequest>

export type RegisterOperatorRoutesOptions = SharedOperatorRouteOptions<FastifyRequest, FastifyReply>

export function registerOperatorRoutes(
  fastify: FastifyInstance,
  options: RegisterOperatorRoutesOptions,
): void {
  const {
    actions,
    providerSecretMask,
    getRemoteServerStatus,
    getAppVersion,
    runAgent,
    scheduleRemoteServerRestartFromOperator,
    scheduleAppRestartFromOperator,
    scheduleRemoteServerRestartAfterReply,
  } = options

  // ============================================
  // Operator/Admin Endpoints
  // ============================================
  fastify.get(API_ROUTES.operatorStatus, async (_req, reply) => {
    const result = await actions.getOperatorStatus(getRemoteServerStatus())
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorHealth, async (_req, reply) => {
    const result = await actions.getOperatorHealth()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorErrors, async (req, reply) => {
    const query = req.query as { count?: string | number }
    const result = await actions.getOperatorErrors(query.count)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorLogs, async (req, reply) => {
    const query = req.query as { count?: string | number; level?: string }
    const result = await actions.getOperatorLogs(query.count, query.level)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorAudit, async (req, reply) => {
    const query = req.query as { count?: string | number }
    const result = await actions.getOperatorAudit(query.count)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorConversations, async (req, reply) => {
    const query = req.query as { count?: string | number }
    const result = await actions.getOperatorConversations(query.count)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorRemoteServer, async (_req, reply) => {
    const result = await actions.getOperatorRemoteServer(getRemoteServerStatus())
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorTunnel, async (_req, reply) => {
    const result = await actions.getOperatorTunnel()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorTunnelSetup, async (_req, reply) => {
    const result = await actions.getOperatorTunnelSetup()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorIntegrations, async (_req, reply) => {
    const result = await actions.getOperatorIntegrations()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorUpdater, async (_req, reply) => {
    const result = await actions.getOperatorUpdater(getAppVersion())
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorUpdaterCheck, async (req, reply) => {
    const result = await actions.checkOperatorUpdater()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorUpdaterDownloadLatest, async (req, reply) => {
    const result = await actions.downloadLatestOperatorUpdateAsset()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorUpdaterRevealDownload, async (req, reply) => {
    const result = await actions.revealOperatorUpdateAsset()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorUpdaterOpenDownload, async (req, reply) => {
    const result = await actions.openOperatorUpdateAsset()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorUpdaterOpenReleases, async (req, reply) => {
    const result = await actions.openOperatorReleasesPage()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorDiscord, async (_req, reply) => {
    const result = await actions.getOperatorDiscord()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorDiscordLogs, async (req, reply) => {
    const query = req.query as { count?: string | number }
    const result = await actions.getOperatorDiscordLogs(query.count)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorDiscordConnect, async (req, reply) => {
    const result = await actions.connectOperatorDiscord()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorDiscordDisconnect, async (req, reply) => {
    const result = await actions.disconnectOperatorDiscord()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorDiscordClearLogs, async (req, reply) => {
    const result = await actions.clearOperatorDiscordLogs()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorWhatsApp, async (_req, reply) => {
    const result = await actions.getOperatorWhatsApp()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorWhatsAppConnect, async (req, reply) => {
    const result = await actions.connectOperatorWhatsApp()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorWhatsAppLogout, async (req, reply) => {
    const result = await actions.logoutOperatorWhatsApp()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorLocalSpeechModels, async (_req, reply) => {
    const result = await actions.getOperatorLocalSpeechModelStatuses()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorLocalSpeechModel, async (req, reply) => {
    const params = req.params as { providerId?: string }
    const result = await actions.getOperatorLocalSpeechModelStatus(params.providerId)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorLocalSpeechModelDownload, async (req, reply) => {
    const params = req.params as { providerId?: string }
    const result = await actions.downloadOperatorLocalSpeechModel(params.providerId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorModelPresets, async (_req, reply) => {
    const result = await actions.getOperatorModelPresets(providerSecretMask)
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorModelPresets, async (req, reply) => {
    const result = await actions.createOperatorModelPreset(req.body, providerSecretMask)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.patch(API_ROUTES.operatorModelPreset, async (req, reply) => {
    const params = req.params as { presetId?: string }
    const result = await actions.updateOperatorModelPreset(params.presetId, req.body, providerSecretMask)
    if (result.auditContext) {
      actions.recordOperatorAuditEvent(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.delete(API_ROUTES.operatorModelPreset, async (req, reply) => {
    const params = req.params as { presetId?: string }
    const result = await actions.deleteOperatorModelPreset(params.presetId, providerSecretMask)
    if (result.auditContext) {
      actions.recordOperatorAuditEvent(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorTunnelStart, async (req, reply) => {
    const result = await actions.startOperatorTunnel(getRemoteServerStatus().running)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorTunnelStop, async (req, reply) => {
    const result = await actions.stopOperatorTunnel()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorRestartRemoteServer, async (req, reply) => {
    const result = await actions.restartOperatorRemoteServer(getRemoteServerStatus().running)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    if (result.shouldRestartRemoteServer) {
      scheduleRemoteServerRestartFromOperator()
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorRestartApp, async (req, reply) => {
    const result = await actions.restartOperatorApp(getAppVersion())
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    if (result.shouldRestartApp) {
      scheduleAppRestartFromOperator()
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorRunAgent, async (req, reply) => {
    const result = await actions.runOperatorAgent(req.body, runAgent)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorAgentSessionStop, async (req, reply) => {
    const params = req.params as { sessionId?: string }
    const result = await actions.stopOperatorAgentSession(params.sessionId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.get(API_ROUTES.operatorMessageQueues, async (_req, reply) => {
    const result = await actions.getOperatorMessageQueues()
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorMessageQueueClear, async (req, reply) => {
    const params = req.params as { conversationId?: string }
    const result = await actions.clearOperatorMessageQueue(params.conversationId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorMessageQueuePause, async (req, reply) => {
    const params = req.params as { conversationId?: string }
    const result = await actions.pauseOperatorMessageQueue(params.conversationId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorMessageQueueResume, async (req, reply) => {
    const params = req.params as { conversationId?: string }
    const result = await actions.resumeOperatorMessageQueue(params.conversationId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.delete(API_ROUTES.operatorMessageQueueMessage, async (req, reply) => {
    const params = req.params as { conversationId?: string; messageId?: string }
    const result = await actions.removeOperatorQueuedMessage(params.conversationId, params.messageId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorMessageQueueMessageRetry, async (req, reply) => {
    const params = req.params as { conversationId?: string; messageId?: string }
    const result = await actions.retryOperatorQueuedMessage(params.conversationId, params.messageId)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.patch(API_ROUTES.operatorMessageQueueMessage, async (req, reply) => {
    const params = req.params as { conversationId?: string; messageId?: string }
    const result = await actions.updateOperatorQueuedMessage(params.conversationId, params.messageId, req.body)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  fastify.post(API_ROUTES.operatorRotateApiKey, async (req, reply) => {
    const result = await actions.rotateOperatorRemoteServerApiKey()
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }

    if (result.shouldRestartRemoteServer) {
      scheduleRemoteServerRestartAfterReply(reply)
    }

    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/operator/mcp - Operator-level MCP summary
  fastify.get(API_ROUTES.operatorMcp, async (_req, reply) => {
    const result = await actions.getOperatorMcpStatus()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/operator/mcp/:server/logs - Get MCP server process logs
  fastify.get(API_ROUTES.operatorMcpServerLogs, async (req, reply) => {
    const params = req.params as { server?: string }
    const query = req.query as { count?: string | number }
    const result = await actions.getOperatorMcpServerLogs(params.server, query.count)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/operator/mcp/:server/logs/clear - Clear MCP server process logs
  fastify.post(API_ROUTES.operatorMcpServerLogsClear, async (req, reply) => {
    const params = req.params as { server?: string }
    const result = await actions.clearOperatorMcpServerLogs(params.server)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/operator/mcp/:server/test - Test an MCP server using its saved config
  fastify.post(API_ROUTES.operatorMcpServerTest, async (req, reply) => {
    const params = req.params as { server?: string }
    const result = await actions.testOperatorMcpServer(params.server)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/operator/mcp/tools - List MCP tools with enabled state
  fastify.get(API_ROUTES.operatorMcpTools, async (req, reply) => {
    const query = req.query as { server?: string }
    const result = await actions.getOperatorMcpTools(query.server)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/operator/mcp/tools/:toolName/toggle - Enable or disable an MCP tool
  fastify.post(API_ROUTES.operatorMcpToolToggle, async (req, reply) => {
    const params = req.params as { toolName?: string }
    const result = await actions.setOperatorMcpToolEnabled(params.toolName, req.body)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/operator/actions/mcp-start - Start an MCP server
  fastify.post(API_ROUTES.operatorMcpStart, async (req, reply) => {
    const result = await actions.startOperatorMcpServer(req.body)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/operator/actions/mcp-stop - Stop an MCP server
  fastify.post(API_ROUTES.operatorMcpStop, async (req, reply) => {
    const result = await actions.stopOperatorMcpServer(req.body)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/operator/actions/mcp-restart - Restart an MCP server
  fastify.post(API_ROUTES.operatorMcpRestart, async (req, reply) => {
    const result = await actions.restartOperatorMcpServer(req.body)
    if (result.auditContext) {
      actions.setOperatorAuditContext(req, result.auditContext)
    }
    return reply.code(result.statusCode).send(result.body)
  })
}
