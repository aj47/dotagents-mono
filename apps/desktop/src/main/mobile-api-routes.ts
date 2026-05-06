import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { REMOTE_SERVER_API_ROUTE_PATHS } from "@dotagents/shared/remote-server-api"
import type {
  MobileApiActionResult,
  MobileApiRouteActions as SharedMobileApiRouteActions,
  MobileApiRouteOptions as SharedMobileApiRouteOptions,
  MobileApiRunAgentExecutor,
} from "@dotagents/shared/remote-server-route-contracts"

const API_ROUTES = REMOTE_SERVER_API_ROUTE_PATHS

export type {
  MobileApiActionResult,
  MobileApiRunAgentExecutor,
}

export type MobileApiRouteActions = SharedMobileApiRouteActions<FastifyRequest, FastifyReply>

export type RegisterMobileApiRoutesOptions = SharedMobileApiRouteOptions<FastifyRequest, FastifyReply>

export function registerMobileApiRoutes(
  fastify: FastifyInstance,
  options: RegisterMobileApiRoutesOptions,
): void {
  const {
    actions,
    providerSecretMask,
    remoteServerSecretMask,
    discordSecretMask,
    langfuseSecretMask,
    runAgent,
    notifyConversationHistoryChanged,
    scheduleRemoteServerLifecycleActionAfterReply,
  } = options

  fastify.post(API_ROUTES.chatCompletions, async (req, reply) => {
    return actions.handleChatCompletionRequest(req.body, req.headers.origin, reply, runAgent)
  })

  fastify.get(API_ROUTES.models, async (_req, reply) => {
    const result = actions.getModels()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/models/:providerId - Fetch available models for a provider
  fastify.get(API_ROUTES.modelsByProvider, async (req, reply) => {
    const params = req.params as { providerId?: string }
    const result = await actions.getProviderModels(params.providerId)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/profiles - List all profiles
  fastify.get(API_ROUTES.profiles, async (_req, reply) => {
    const result = actions.getProfiles()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/profiles/current - Get current profile details
  fastify.get(API_ROUTES.currentProfile, async (_req, reply) => {
    const result = actions.getCurrentProfile()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/profiles/current - Set current profile
  fastify.post(API_ROUTES.currentProfile, async (req, reply) => {
    const result = actions.setCurrentProfile(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/profiles/:id/export - Export a profile as JSON
  fastify.get(API_ROUTES.profileExport, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.exportProfile(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/profiles/import - Import a profile from JSON
  fastify.post(API_ROUTES.profileImport, async (req, reply) => {
    const result = actions.importProfile(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/bundles/exportable-items - List bundle-exportable desktop items
  fastify.get(API_ROUTES.bundleExportableItems, async (_req, reply) => {
    const result = actions.getBundleExportableItems()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/bundles/export - Export a DotAgents bundle as JSON
  fastify.post(API_ROUTES.bundleExport, async (req, reply) => {
    const result = await actions.exportBundle(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/bundles/import/preview - Preview pasted DotAgents bundle JSON
  fastify.post(API_ROUTES.bundleImportPreview, async (req, reply) => {
    const result = await actions.previewBundleImport(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/bundles/import - Import pasted DotAgents bundle JSON
  fastify.post(API_ROUTES.bundleImport, async (req, reply) => {
    const result = await actions.importBundle(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/mcp/servers - List MCP servers with status
  fastify.get(API_ROUTES.mcpServers, async (_req, reply) => {
    const result = actions.getMcpServers()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/mcp/servers/:name/toggle - Toggle MCP server enabled/disabled
  fastify.post(API_ROUTES.mcpServerToggle, async (req, reply) => {
    const params = req.params as { name?: string }
    const result = actions.toggleMcpServer(params.name, req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/mcp/config/export - Export MCP server configs
  fastify.get(API_ROUTES.mcpConfigExport, async (_req, reply) => {
    const result = actions.exportMcpServerConfigs()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/mcp/config/import - Import MCP server configs
  fastify.post(API_ROUTES.mcpConfigImport, async (req, reply) => {
    const result = actions.importMcpServerConfigs(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // PUT /v1/mcp/config/servers/:name - Add or update MCP server config
  fastify.put(API_ROUTES.mcpConfigServer, async (req, reply) => {
    const params = req.params as { name?: string }
    const result = actions.upsertMcpServerConfig(params.name, req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // DELETE /v1/mcp/config/servers/:name - Remove MCP server config
  fastify.delete(API_ROUTES.mcpConfigServer, async (req, reply) => {
    const params = req.params as { name?: string }
    const result = actions.deleteMcpServerConfig(params.name)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/settings - Get relevant settings for mobile app
  fastify.get(API_ROUTES.settings, async (_req, reply) => {
    const result = actions.getSettings(providerSecretMask)
    return reply.code(result.statusCode).send(result.body)
  })

  // PATCH /v1/settings - Update settings
  fastify.patch(API_ROUTES.settings, async (req, reply) => {
    const result = await actions.updateSettings(req.body, {
      providerSecretMask,
      remoteServerSecretMask,
      discordSecretMask,
      langfuseSecretMask,
    })

    if (result.remoteServerLifecycleAction) {
      scheduleRemoteServerLifecycleActionAfterReply(reply, result.remoteServerLifecycleAction)
    }

    if (result.auditContext) {
      actions.recordOperatorAuditEvent(req, result.auditContext)
    }

    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/agent-sessions/candidates - List active and recent sessions for pickers
  fastify.get(API_ROUTES.agentSessionCandidates, async (req, reply) => {
    const result = actions.getAgentSessionCandidates(req.query)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/conversations/:id - Fetch conversation state for recovery
  fastify.get(API_ROUTES.conversation, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.getConversation(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/conversations/:id/assets/videos/:fileName - Stream conversation video asset for mobile
  fastify.get(API_ROUTES.conversationVideoAsset, async (req, reply) => {
    const params = req.params as { id?: string; fileName?: string }
    const result = await actions.getConversationVideoAsset(params.id, params.fileName, req.headers.range)
    if (result.headers) {
      for (const [name, value] of Object.entries(result.headers)) {
        reply.header(name, value)
      }
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/tts/speak - Synthesize speech via the desktop's TTS providers.
  fastify.post(API_ROUTES.ttsSpeak, async (req, reply) => {
    const result = await actions.synthesizeSpeech(req.body)
    if (result.headers) {
      for (const [name, value] of Object.entries(result.headers)) {
        reply.header(name, value)
      }
    }
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/push/register - Register a push notification token
  fastify.post(API_ROUTES.pushRegister, async (req, reply) => {
    const result = actions.registerPushToken(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/push/unregister - Unregister a push notification token
  fastify.post(API_ROUTES.pushUnregister, async (req, reply) => {
    const result = actions.unregisterPushToken(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/push/status - Get push notification status
  fastify.get(API_ROUTES.pushStatus, async (_req, reply) => {
    const result = actions.getPushStatus()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/push/clear-badge - Clear badge count for a token
  fastify.post(API_ROUTES.pushClearBadge, async (req, reply) => {
    const result = actions.clearPushBadge(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/conversations - List all conversations
  fastify.get(API_ROUTES.conversations, async (_req, reply) => {
    const result = await actions.getConversations()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/conversations - Create a new conversation from mobile data
  fastify.post(API_ROUTES.conversations, async (req, reply) => {
    const result = await actions.createConversation(req.body, notifyConversationHistoryChanged)
    return reply.code(result.statusCode).send(result.body)
  })

  // PUT /v1/conversations/:id - Update an existing conversation
  fastify.put(API_ROUTES.conversation, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.updateConversation(params.id, req.body, notifyConversationHistoryChanged)
    return reply.code(result.statusCode).send(result.body)
  })

  // Kill switch endpoint - emergency stop all agent sessions
  fastify.post(API_ROUTES.emergencyStop, async (_req, reply) => {
    const result = await actions.triggerEmergencyStop()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/skills - List all skills
  fastify.get(API_ROUTES.skills, async (_req, reply) => {
    const result = actions.getSkills()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/skills/:id - Get one skill
  fastify.get(API_ROUTES.skill, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.getSkill(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/skills - Create a new skill
  fastify.post(API_ROUTES.skills, async (req, reply) => {
    const result = actions.createSkill(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/skills/import/markdown - Import a skill from SKILL.md content
  fastify.post(API_ROUTES.skillImportMarkdown, async (req, reply) => {
    const result = actions.importSkillFromMarkdown(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/skills/import/github - Import skill(s) from a GitHub repository
  fastify.post(API_ROUTES.skillImportGitHub, async (req, reply) => {
    const result = await actions.importSkillFromGitHub(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/skills/:id/export/markdown - Export one skill as SKILL.md content
  fastify.get(API_ROUTES.skillExportMarkdown, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.exportSkillToMarkdown(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // PATCH /v1/skills/:id - Update a skill
  fastify.patch(API_ROUTES.skill, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.updateSkill(params.id, req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // DELETE /v1/skills/:id - Delete a skill
  fastify.delete(API_ROUTES.skill, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.deleteSkill(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/skills/:id/toggle-profile - Toggle skill for current profile
  fastify.post(API_ROUTES.skillToggleProfile, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.toggleProfileSkill(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/knowledge/notes - List all knowledge notes
  fastify.get(API_ROUTES.knowledgeNotes, async (req, reply) => {
    const result = await actions.getKnowledgeNotes(req.query)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/knowledge/notes/search - Search knowledge notes
  fastify.post(API_ROUTES.knowledgeNotesSearch, async (req, reply) => {
    const result = await actions.searchKnowledgeNotes(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/knowledge/notes/delete-multiple - Delete selected knowledge notes
  fastify.post(API_ROUTES.knowledgeNotesDeleteMultiple, async (req, reply) => {
    const result = await actions.deleteMultipleKnowledgeNotes(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/knowledge/notes/delete-all - Delete all knowledge notes
  fastify.post(API_ROUTES.knowledgeNotesDeleteAll, async (_req, reply) => {
    const result = await actions.deleteAllKnowledgeNotes()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/knowledge/notes/:id - Get one knowledge note
  fastify.get(API_ROUTES.knowledgeNote, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.getKnowledgeNote(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // DELETE /v1/knowledge/notes/:id - Delete a knowledge note
  fastify.delete(API_ROUTES.knowledgeNote, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.deleteKnowledgeNote(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/agent-profiles - List all agent profiles
  fastify.get(API_ROUTES.agentProfiles, async (req, reply) => {
    const query = req.query as { role?: string }
    const result = actions.getAgentProfiles(query.role)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/agent-profiles/verify-command - Verify an external agent command
  fastify.post(API_ROUTES.agentProfileVerifyCommand, async (req, reply) => {
    const result = await actions.verifyExternalAgentCommand(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/agent-profiles/reload - Reload modular agent profile files
  fastify.post(API_ROUTES.agentProfilesReload, async (_req, reply) => {
    const result = actions.reloadAgentProfiles()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/agent-profiles/:id/toggle - Toggle agent profile enabled state
  fastify.post(API_ROUTES.agentProfileToggle, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.toggleAgentProfile(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/agent-profiles/:id - Get single agent profile with full detail
  fastify.get(API_ROUTES.agentProfile, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.getAgentProfile(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/agent-profiles - Create a new agent profile
  fastify.post(API_ROUTES.agentProfiles, async (req, reply) => {
    const result = actions.createAgentProfile(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // PATCH /v1/agent-profiles/:id - Update an agent profile
  fastify.patch(API_ROUTES.agentProfile, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.updateAgentProfile(params.id, req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // DELETE /v1/agent-profiles/:id - Delete an agent profile
  fastify.delete(API_ROUTES.agentProfile, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = actions.deleteAgentProfile(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/loops - List all repeat tasks
  fastify.get(API_ROUTES.loops, async (_req, reply) => {
    const result = await actions.getRepeatTasks()
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/loops/statuses - List repeat task runtime statuses
  fastify.get(API_ROUTES.loopStatuses, async (_req, reply) => {
    const result = await actions.getRepeatTaskStatuses()
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/loops/import/markdown - Import a repeat task from task.md content
  fastify.post(API_ROUTES.loopImportMarkdown, async (req, reply) => {
    const result = await actions.importRepeatTaskFromMarkdown(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/loops/:id/toggle - Toggle repeat task enabled state
  fastify.post(API_ROUTES.loopToggle, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.toggleRepeatTask(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/loops/:id/run - Run a repeat task immediately
  fastify.post(API_ROUTES.loopRun, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.runRepeatTask(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/loops/:id/start - Start scheduling a repeat task
  fastify.post(API_ROUTES.loopStart, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.startRepeatTask(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/loops/:id/stop - Stop scheduling a repeat task
  fastify.post(API_ROUTES.loopStop, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.stopRepeatTask(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // GET /v1/loops/:id/export/markdown - Export one repeat task as task.md content
  fastify.get(API_ROUTES.loopExportMarkdown, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.exportRepeatTaskToMarkdown(params.id)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/knowledge/notes - Create a new knowledge note
  fastify.post(API_ROUTES.knowledgeNotes, async (req, reply) => {
    const result = await actions.createKnowledgeNote(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // PATCH /v1/knowledge/notes/:id - Update a knowledge note
  fastify.patch(API_ROUTES.knowledgeNote, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.updateKnowledgeNote(params.id, req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // POST /v1/loops - Create a new loop/repeat task
  fastify.post(API_ROUTES.loops, async (req, reply) => {
    const result = await actions.createRepeatTask(req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // PATCH /v1/loops/:id - Update a loop/repeat task
  fastify.patch(API_ROUTES.loop, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.updateRepeatTask(params.id, req.body)
    return reply.code(result.statusCode).send(result.body)
  })

  // DELETE /v1/loops/:id - Delete a loop/repeat task
  fastify.delete(API_ROUTES.loop, async (req, reply) => {
    const params = req.params as { id?: string }
    const result = await actions.deleteRepeatTask(params.id)
    return reply.code(result.statusCode).send(result.body)
  })
}
