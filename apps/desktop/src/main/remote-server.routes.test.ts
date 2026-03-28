import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getRemoteServerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerPath = path.join(testDir, "remote-server.ts")
  return readFileSync(remoteServerPath, "utf8")
}

function getDuplicateRoutes(
  source: string,
): Array<{ key: string; lines: number[] }> {
  const routeRegex = /fastify\.(get|post|patch|delete|put)\("([^"]+)"/g
  const linesByRoute = new Map<string, number[]>()

  for (const match of source.matchAll(routeRegex)) {
    const method = match[1]?.toUpperCase()
    const route = match[2]
    const matchIndex = match.index ?? 0
    const line = source.slice(0, matchIndex).split("\n").length
    const key = `${method} ${route}`
    linesByRoute.set(key, [...(linesByRoute.get(key) ?? []), line])
  }

  return [...linesByRoute.entries()]
    .filter(([, lines]) => lines.length > 1)
    .map(([key, lines]) => ({ key, lines }))
}

function getSection(
  source: string,
  startMarker: string,
  endMarker: string,
): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("remote-server route registration", () => {
  it("does not register duplicate Fastify method/path pairs", () => {
    const source = getRemoteServerSource()
    const duplicates = getDuplicateRoutes(source)

    expect(duplicates).toEqual([])
  })

  it("shares MCP server list and runtime toggles through the management helper", () => {
    const source = getRemoteServerSource()
    const mcpSection = getSection(
      source,
      "// GET /v1/mcp/servers - List MCP servers with status",
      "// GET /v1/settings - Get relevant settings for mobile app",
    )

    expect(source).toContain('from "./mcp-management"')
    expect(source).toContain('from "./mcp-management-store"')
    expect(mcpSection).toContain(
      "const servers = getManagedMcpServerSummaries(mcpManagementStore)",
    )
    expect(mcpSection).toContain(
      "const result = setManagedMcpServerRuntimeEnabled(",
    )
    expect(mcpSection).not.toContain("listMcpServerStatusSummaries(")
    expect(mcpSection).not.toContain("mcpService.setServerRuntimeEnabled(")
  })

  it("routes mobile chat requests through the shared prompt runner", () => {
    const source = getRemoteServerSource()

    expect(source).toContain("startSharedPromptRun({")
    expect(source).toContain("const agentResult = await runPromise")
    expect(source).toContain('approvalMode: "dialog"')
    expect(source).not.toContain("processTranscriptWithACPAgent(")
    expect(source).not.toContain("resolvePreferredTopLevelAcpAgentSelection({")
  })

  it("routes remote profile switches through the shared activation helper", () => {
    const source = getRemoteServerSource()
    const profileSwitchSection = getSection(
      source,
      'fastify.post("/v1/profiles/current"',
      "// GET /v1/profiles/:id/export - Export a profile as JSON",
    )

    expect(source).toContain('from "./agent-profile-activation"')
    expect(profileSwitchSection).toContain(
      "const profile = activateAgentProfileById(profileId)",
    )
    expect(profileSwitchSection).not.toContain(
      "mcpService.applyProfileMcpConfig(",
    )
    expect(profileSwitchSection).not.toContain("toolConfigToMcpServerConfig(")
  })

  it("shares agent profile CRUD routes with the main-process management helper", () => {
    const source = getRemoteServerSource()
    const agentProfileSection = getSection(
      source,
      "// GET /v1/agent-profiles - List all agent profiles",
      "// Repeat Tasks Management Endpoints (for mobile app)",
    )

    expect(source).toContain('from "./agent-profile-management"')
    expect(agentProfileSection).toContain("getManagedAgentProfiles()")
    expect(agentProfileSection).toContain("getManagedAgentProfile(params.id)")
    expect(agentProfileSection).toContain(
      "toggleManagedAgentProfileEnabled(params.id)",
    )
    expect(agentProfileSection).toContain("createManagedAgentProfile(body)")
    expect(agentProfileSection).toContain(
      "updateManagedAgentProfile(params.id, body)",
    )
    expect(agentProfileSection).toContain(
      "deleteManagedAgentProfile(params.id)",
    )
    expect(agentProfileSection).not.toContain("sanitizeAgentProfileConnection(")
    expect(agentProfileSection).not.toContain(
      "VALID_AGENT_PROFILE_CONNECTION_TYPES",
    )
    expect(agentProfileSection).not.toContain("agentProfileService.create(")
    expect(agentProfileSection).not.toContain("agentProfileService.update(")
    expect(agentProfileSection).not.toContain("agentProfileService.delete(")
  })

  it("leaves legacy runtime flag ownership to the shared session manager", () => {
    const source = getRemoteServerSource()

    expect(source).toContain("startSharedPromptRun({")
    expect(source).toContain("const agentResult = await runPromise")
    expect(source).not.toContain("state.isAgentModeActive = true")
    expect(source).not.toContain("state.shouldStopAgent = false")
    expect(source).not.toContain("state.agentIterationCount = 0")
  })

  it("routes startup and manual terminal QR printing through the shared helper", () => {
    const source = getRemoteServerSource()

    expect(source).toContain("printSharedRemoteServerQrCode({")
    expect(source).toContain('mode: "auto"')
    expect(source).toContain('mode: "manual"')
    expect(source).not.toContain('urlOverride.endsWith("/v1")')
    expect(source).not.toContain("printTerminalQRCode(serverUrl")
  })

  it("applies session-aware ACP MCP filtering for injected tool routes", () => {
    const source = getRemoteServerSource()
    const listInjectedMcpToolsSection = getSection(
      source,
      "const listInjectedMcpTools = async",
      "const callInjectedMcpTool = async",
    )
    const callInjectedMcpToolSection = getSection(
      source,
      "const callInjectedMcpTool = async",
      "const handleInjectedMcpProtocolRequest = async",
    )
    const streamableMcpSection = getSection(
      source,
      "const handleInjectedMcpProtocolRequest = async",
      "// POST /mcp/tools/list - List all available injected runtime tools",
    )

    expect(source).toContain("function getAcpMcpRequestContext")
    expect(source).toContain("function getInjectedRuntimeToolsForAcpSession")
    expect(source).toContain("getPendingAppSessionForClientSessionToken")
    expect(source).toContain("if (!profileSnapshot) return undefined")
    expect(source).toContain('fastify.post("/mcp/:acpSessionToken"')
    expect(source).toContain('fastify.get("/mcp/:acpSessionToken"')
    expect(source).toContain('fastify.delete("/mcp/:acpSessionToken"')
    expect(source).toContain('fastify.post("/mcp/:acpSessionToken/tools/list"')
    expect(source).toContain('fastify.post("/mcp/:acpSessionToken/tools/call"')
    expect(source).toContain("INVALID_ACP_SESSION_CONTEXT_ERROR")
    expect(source).toContain("StreamableHTTPServerTransport")
    expect(source).toContain("isInitializeRequest(req.body)")
    expect(listInjectedMcpToolsSection).toContain(
      "getInjectedRuntimeToolsForAcpSession(acpSessionToken)",
    )
    expect(listInjectedMcpToolsSection).toContain(".code(401)")
    expect(listInjectedMcpToolsSection).toContain(
      ".send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })",
    )
    expect(listInjectedMcpToolsSection).toContain(
      "reply.send({ tools: injectedRuntimeTools.tools })",
    )
    expect(listInjectedMcpToolsSection).not.toContain(
      "mcpService.getAvailableTools()",
    )
    expect(source).toContain(
      "getPendingAppSessionForClientSessionToken(acpSessionToken)",
    )
    expect(callInjectedMcpToolSection).toContain(
      "getInjectedRuntimeToolsForAcpSession(acpSessionToken)",
    )
    expect(callInjectedMcpToolSection).toContain(".code(401)")
    expect(callInjectedMcpToolSection).toContain(
      ".send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })",
    )
    expect(callInjectedMcpToolSection).toContain(
      "injectedRuntimeTools.requestContext.appSessionId",
    )
    expect(callInjectedMcpToolSection).toContain(
      "injectedRuntimeTools.requestContext.profileSnapshot.mcpServerConfig",
    )
    expect(callInjectedMcpToolSection).not.toContain(
      "profileSnapshot?.mcpServerConfig",
    )
    expect(streamableMcpSection).toContain("new StreamableHTTPServerTransport")
    expect(streamableMcpSection).toContain("reply.hijack()")
    expect(streamableMcpSection).toContain(
      "transport.handleRequest(req.raw, reply.raw, req.body)",
    )
  })

  it("shares knowledge note routes with the desktop and CLI note manager", () => {
    const source = getRemoteServerSource()
    const notesSection = getSection(
      source,
      "// GET /v1/knowledge/notes - List all knowledge notes",
      "// Agent Management Endpoints (for mobile app)",
    )

    expect(source).toContain('from "./knowledge-note-management"')
    expect(notesSection).toContain("getManagedKnowledgeNotes()")
    expect(notesSection).toContain("getManagedKnowledgeNote(params.id)")
    expect(notesSection).toContain("deleteManagedKnowledgeNote(params.id)")
    expect(source).toContain("createManagedKnowledgeNote(body)")
    expect(source).toContain("updateManagedKnowledgeNote(params.id, body)")
    expect(notesSection).not.toContain("knowledgeNotesService.getAllNotes(")
    expect(notesSection).not.toContain("knowledgeNotesService.createNote(")
    expect(notesSection).not.toContain("knowledgeNotesService.updateNote(")
    expect(notesSection).not.toContain("knowledgeNotesService.deleteNote(")

    expect(source).toContain('fastify.get("/v1/knowledge/notes"')
    expect(source).toContain('fastify.get("/v1/knowledge/notes/:id"')
    expect(source).toContain('fastify.post("/v1/knowledge/notes"')
    expect(source).toContain('fastify.patch("/v1/knowledge/notes/:id"')
    expect(source).toContain('fastify.delete("/v1/knowledge/notes/:id"')

    expect(source).not.toContain('fastify.get("/v1/memories"')
    expect(source).not.toContain('fastify.post("/v1/memories"')
    expect(source).not.toContain('fastify.patch("/v1/memories/:id"')
    expect(source).not.toContain('fastify.delete("/v1/memories/:id"')
  })

  it("does not report repeat task toggles as successful when loop persistence fails", () => {
    const source = getRemoteServerSource()
    const toggleLoopSection = getSection(
      source,
      'fastify.post("/v1/loops/:id/toggle"',
      "// POST /v1/loops/:id/run - Run a repeat task immediately",
    )

    expect(toggleLoopSection).toContain(
      "const result = toggleManagedLoopEnabled(loopService, params.id)",
    )
    expect(toggleLoopSection).toContain("if (!result.success) {")
    expect(toggleLoopSection).toContain(".code(500)")
    expect(toggleLoopSection).toContain(
      '.send({ error: "Failed to persist repeat task toggle" })',
    )

    const saveIndex = toggleLoopSection.indexOf(
      "const result = toggleManagedLoopEnabled(loopService, params.id)",
    )
    const failureIndex = toggleLoopSection.indexOf(
      '.send({ error: "Failed to persist repeat task toggle" })',
    )
    const successIndex = toggleLoopSection.indexOf("return reply.send({")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("does not report repeat task creation as successful when loop persistence fails", () => {
    const source = getRemoteServerSource()
    const createLoopSection = getSection(
      source,
      'fastify.post("/v1/loops"',
      "// PATCH /v1/loops/:id - Update a loop/repeat task",
    )

    expect(createLoopSection).toContain(
      "const result = createManagedLoop(loopService, body)",
    )
    expect(createLoopSection).toContain("if (!result.success) {")
    expect(createLoopSection).toContain(
      'result.error === "invalid_input" ? 400 : 500',
    )
    expect(createLoopSection).toContain("runOnStartup?: unknown")
    expect(createLoopSection).toContain("maxIterations?: unknown")
    expect(createLoopSection).toContain(
      'result.errorMessage || "Failed to persist repeat task"',
    )

    const saveIndex = createLoopSection.indexOf(
      "const result = createManagedLoop(loopService, body)",
    )
    const failureIndex = createLoopSection.indexOf(
      'result.errorMessage || "Failed to persist repeat task"',
    )
    const successIndex = createLoopSection.indexOf("return reply.send({")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("does not report repeat task updates as successful when loop persistence fails", () => {
    const source = getRemoteServerSource()
    const updateLoopSection = getSection(
      source,
      'fastify.patch("/v1/loops/:id"',
      "// DELETE /v1/loops/:id - Delete a loop/repeat task",
    )

    expect(updateLoopSection).toContain(
      "const result = updateManagedLoop(loopService, params.id, body)",
    )
    expect(updateLoopSection).toContain("if (!result.success) {")
    expect(updateLoopSection).toContain('result.error === "invalid_input"')
    expect(updateLoopSection).toContain('result.error === "not_found"')
    expect(updateLoopSection).toContain("runOnStartup?: unknown")
    expect(updateLoopSection).toContain("maxIterations?: unknown")
    expect(updateLoopSection).toContain(
      'result.errorMessage || "Failed to persist repeat task"',
    )

    const saveIndex = updateLoopSection.indexOf(
      "const result = updateManagedLoop(loopService, params.id, body)",
    )
    const failureIndex = updateLoopSection.indexOf(
      'result.errorMessage || "Failed to persist repeat task"',
    )
    const successIndex = updateLoopSection.indexOf("return reply.send({")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("shares repeat task summaries with the desktop loop surface", () => {
    const source = getRemoteServerSource()
    const listLoopsSection = getSection(
      source,
      "// GET /v1/loops - List all repeat tasks",
      "// POST /v1/loops/:id/toggle - Toggle repeat task enabled state",
    )

    expect(source).toContain('from "./loop-summaries"')
    expect(source).toContain('from "./loop-management"')
    expect(source).toContain("return getManagedLoopSummary(loopService, loop)")
    expect(listLoopsSection).toContain(
      "loops: getManagedLoopSummaries(loopService)",
    )
    expect(listLoopsSection).not.toContain("new Map(statuses.map(")
    expect(listLoopsSection).not.toContain("profileName:")
    expect(listLoopsSection).not.toContain("isRunning:")
    expect(listLoopsSection).not.toContain("nextRunAt:")
  })

  it("shares conversation-history serialization with the desktop runtime", () => {
    const source = getRemoteServerSource()

    expect(source).toContain("formatConversationHistoryMessages(")
    expect(source).not.toContain("function formatConversationHistoryForApi(")
    expect(source).not.toContain("toolCalls: entry.toolCalls?.map(")
    expect(source).not.toContain("toolResults: entry.toolResults?.map(")
  })

  it("sanitizes session-state payloads through the shared session helpers", () => {
    const source = getRemoteServerSource()
    const settingsPatchSection = getSection(
      source,
      "// PATCH /v1/settings - Update settings",
      "// Conversation Recovery Endpoints (for mobile app)",
    )

    expect(source).toContain("sanitizeConversationSessionState(")
    expect(settingsPatchSection).toContain(
      "const conversationSessionState = sanitizeConversationSessionState(body)",
    )
    expect(settingsPatchSection).toContain(
      "updates.pinnedSessionIds = conversationSessionState.pinnedSessionIds",
    )
    expect(settingsPatchSection).toContain(
      "updates.archivedSessionIds = conversationSessionState.archivedSessionIds",
    )
    expect(settingsPatchSection).not.toContain(
      'body.pinnedSessionIds.every((id: unknown) => typeof id === "string")',
    )
    expect(settingsPatchSection).not.toContain(
      'body.archivedSessionIds.every((id: unknown) => typeof id === "string")',
    )
  })

  it("shares current-profile skill routes with the desktop and CLI skill manager", () => {
    const source = getRemoteServerSource()
    const skillsSection = getSection(
      source,
      "// GET /v1/skills - List all skills",
      "// Knowledge Notes Management Endpoints (for mobile app)",
    )

    expect(source).toContain('from "./profile-skill-management"')
    expect(skillsSection).toContain("getManagedCurrentProfileSkills()")
    expect(skillsSection).toContain(
      "toggleManagedSkillForCurrentProfile(params.id)",
    )
    expect(skillsSection).not.toContain("skillsService.getSkills()")
    expect(skillsSection).not.toContain(
      "agentProfileService.toggleProfileSkill(",
    )
  })
})
