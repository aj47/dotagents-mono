import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getRemoteServerSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerPath = path.join(testDir, "remote-server.ts")
  return readFileSync(remoteServerPath, "utf8")
}

function getDuplicateRoutes(source: string): Array<{ key: string; lines: number[] }> {
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

function getSection(source: string, startMarker: string, endMarker: string): string {
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

  it("routes mobile chat requests through ACP main-agent handling when configured", () => {
    const source = getRemoteServerSource()

    expect(source).toContain('cfg.mainAgentMode === "acp" && cfg.mainAgentName')
    expect(source).toContain("processTranscriptWithACPAgent")
  })

  it("exposes remote server, tunnel, and Discord settings in the remote settings GET/PATCH routes", () => {
    const source = getRemoteServerSource()
    const settingsGetSection = getSection(source, 'fastify.get("/v1/settings"', '// PATCH /v1/settings - Update settings')
    const settingsPatchSection = getSection(source, 'fastify.patch("/v1/settings"', '// Conversation Recovery Endpoints (for mobile app)')

    expect(settingsGetSection).toContain("remoteServerEnabled")
    expect(settingsGetSection).toContain("remoteServerApiKey: getMaskedRemoteServerApiKey(cfg.remoteServerApiKey)")
    expect(settingsGetSection).toContain("cloudflareTunnelMode")
    expect(settingsGetSection).toContain("cloudflareTunnelCredentialsPath")
    expect(settingsGetSection).toContain("discordEnabled")
    expect(settingsGetSection).toContain("discordBotToken: getMaskedDiscordBotToken(cfg)")
    expect(settingsGetSection).toContain("whatsappOperatorAllowFrom")
    expect(settingsGetSection).toContain("discordOperatorAllowUserIds")
    expect(settingsGetSection).toContain("discordOperatorAllowGuildIds")
    expect(settingsGetSection).toContain("discordOperatorAllowChannelIds")
    expect(settingsGetSection).toContain("discordDefaultProfileId")

    expect(settingsPatchSection).toContain("body.remoteServerEnabled")
    expect(settingsPatchSection).toContain("body.remoteServerApiKey !== REMOTE_SERVER_SECRET_MASK")
    expect(settingsPatchSection).toContain("updates.cloudflareTunnelHostname")
    expect(settingsPatchSection).toContain("body.discordEnabled")
    expect(settingsPatchSection).toContain("body.discordBotToken !== DISCORD_SECRET_MASK")
    expect(settingsPatchSection).toContain("body.whatsappOperatorAllowFrom")
    expect(settingsPatchSection).toContain("updates.discordAllowUserIds")
    expect(settingsPatchSection).toContain("updates.discordOperatorAllowUserIds")
    expect(settingsPatchSection).toContain("updates.discordOperatorAllowGuildIds")
    expect(settingsPatchSection).toContain("updates.discordOperatorAllowChannelIds")
    expect(settingsPatchSection).toContain("const remoteServerLifecycleAction = getRemoteServerLifecycleAction(cfg, nextConfig)")
    expect(settingsPatchSection).toContain("scheduleRemoteServerLifecycleActionAfterReply(reply, remoteServerLifecycleAction)")
    expect(settingsPatchSection).toContain("getDiscordLifecycleAction(cfg, nextConfig)")
  })

  it("registers the operator remote-operations endpoints", () => {
    const source = getRemoteServerSource()
    const operatorSection = getSection(source, '// Operator/Admin Endpoints', 'fastify.post("/v1/chat/completions"')

    expect(operatorSection).toContain('fastify.get("/v1/operator/status"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/health"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/errors"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/audit"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/remote-server"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/tunnel"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/tunnel/setup"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/integrations"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/updater"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/updater/check"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/updater/download-latest"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/updater/reveal-download"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/updater/open-download"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/updater/open-releases"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/discord"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/discord/logs"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/discord/connect"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/discord/disconnect"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/discord/logs/clear"')
    expect(operatorSection).toContain('fastify.get("/v1/operator/whatsapp"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/whatsapp/connect"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/whatsapp/logout"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/tunnel/start"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/tunnel/stop"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/actions/restart-remote-server"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/actions/restart-app"')
    expect(operatorSection).toContain('fastify.post("/v1/operator/access/rotate-api-key"')
  })

  it("keeps operator summaries redacted and restart actions scheduled", () => {
    const source = getRemoteServerSource()
    const operatorHelpersSection = getSection(
      source,
      "function clampOperatorCount",
      "/**\n * Starts the remote server, forcing it to be enabled regardless of config.",
    )
    const operatorSection = getSection(source, '// Operator/Admin Endpoints', 'fastify.post("/v1/chat/completions"')

    expect(operatorHelpersSection).toContain(".map(({ timestamp, level, component, message }) => ({")
    expect(operatorHelpersSection).not.toContain("stack")
    expect(operatorHelpersSection).not.toContain("qrCode")
    expect(operatorHelpersSection).toContain("scheduleRemoteServerRestartFromOperator")
    expect(operatorHelpersSection).toContain("scheduleAppRestartFromOperator")
    expect(operatorHelpersSection).toContain("scheduleRemoteServerLifecycleActionAfterReply")
    expect(source).toContain("checkForUpdatesAndDownload")
    expect(source).toContain("downloadLatestReleaseAsset")
    expect(source).toContain("revealDownloadedReleaseAsset")
    expect(source).toContain("openDownloadedReleaseAsset")
    expect(source).toContain("openManualReleasesPage")
    expect(source).toContain("const OPERATOR_AUDIT_LOG_LIMIT = 200")
    expect(source).toContain("operator-audit-log.jsonl")
    expect(source).toContain("function ensureOperatorAuditLogLoaded")
    expect(source).toContain("remoteServerOperatorAllowDeviceIds")
    expect(source).toContain("function isProtectedOperatorAccessPath")
    expect(source).toContain("Trusted device ID required for operator access")
    expect(source).toContain("fs.appendFileSync(operatorAuditLogPath")
    expect(source).toContain('"x-device-id"')
    expect(source).toContain("function recordOperatorAuditEvent")
    expect(source).toContain("function buildOperatorAuditResponse")
    expect(operatorHelpersSection).toContain("reply.raw.once(\"finish\", run)")
    expect(operatorHelpersSection).toContain("void restartRemoteServer().catch")
    expect(operatorHelpersSection).toContain("app.relaunch()")
    expect(operatorHelpersSection).toContain("app.quit()")
    expect(operatorSection).toContain("scheduleRemoteServerRestartFromOperator()")
    expect(operatorSection).toContain("scheduleAppRestartFromOperator()")
    expect(operatorSection).toContain("scheduleTaskAfterReply(reply, \"restart remote server after API key rotation\"")
  })

  it("audits sensitive settings updates without persisting secrets", () => {
    const source = getRemoteServerSource()
    const settingsPatchSection = getSection(source, 'fastify.patch("/v1/settings"', '// Conversation Recovery Endpoints (for mobile app)')

    expect(settingsPatchSection).toContain("let attemptedSensitiveSettingsKeys: string[] = []")
    expect(settingsPatchSection).toContain("getSensitiveOperatorSettingsKeys(body as Record<string, unknown>)")
    expect(settingsPatchSection).toContain("const sensitiveUpdatedKeys = Object.keys(updates).filter((key) => SENSITIVE_OPERATOR_SETTINGS_KEYS.has(key))")
    expect(source).toContain('"whatsappOperatorAllowFrom"')
    expect(source).toContain('"discordOperatorAllowUserIds"')
    expect(settingsPatchSection).toContain('action: "settings-sensitive-update"')
    expect(settingsPatchSection).toContain("details: { attempted: attemptedSensitiveSettingsKeys }")
    expect(settingsPatchSection).toContain("updated: sensitiveUpdatedKeys")
    expect(settingsPatchSection).toContain("remoteServerLifecycleAction")
    expect(settingsPatchSection).toContain("discordLifecycleAction")
    expect(settingsPatchSection).not.toContain("details: { apiKey")
    expect(settingsPatchSection).not.toContain("details: { remoteServerApiKey")
  })

  it("applies session-aware ACP MCP filtering for injected tool routes", () => {
    const source = getRemoteServerSource()
    const listInjectedMcpToolsSection = getSection(source, "const listInjectedMcpTools = async", "const callInjectedMcpTool = async")
    const callInjectedMcpToolSection = getSection(source, "const callInjectedMcpTool = async", "const handleInjectedMcpProtocolRequest = async")
    const streamableMcpSection = getSection(source, "const handleInjectedMcpProtocolRequest = async", "// POST /mcp/tools/list")

    expect(source).toContain("function getAcpMcpRequestContext")
    expect(source).toContain("function getInjectedBuiltinToolsForAcpSession")
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
    expect(listInjectedMcpToolsSection).toContain("getInjectedBuiltinToolsForAcpSession(acpSessionToken)")
    expect(listInjectedMcpToolsSection).toContain("reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })")
    expect(listInjectedMcpToolsSection).toContain("reply.send({ tools: injectedBuiltinTools.tools })")
    expect(listInjectedMcpToolsSection).not.toContain("mcpService.getAvailableTools()")
    expect(source).toContain("?? getPendingAppSessionForClientSessionToken(acpSessionToken)")
    expect(callInjectedMcpToolSection).toContain("getInjectedBuiltinToolsForAcpSession(acpSessionToken)")
    expect(callInjectedMcpToolSection).toContain("reply.code(401).send({ error: INVALID_ACP_SESSION_CONTEXT_ERROR })")
    expect(callInjectedMcpToolSection).toContain("injectedBuiltinTools.requestContext.appSessionId")
    expect(callInjectedMcpToolSection).toContain("injectedBuiltinTools.requestContext.profileSnapshot.mcpServerConfig")
    expect(callInjectedMcpToolSection).not.toContain("profileSnapshot?.mcpServerConfig")
    expect(streamableMcpSection).toContain("new StreamableHTTPServerTransport")
    expect(streamableMcpSection).toContain("reply.hijack()")
    expect(streamableMcpSection).toContain("transport.handleRequest(req.raw, reply.raw, req.body)")
  })

  it("does not report repeat task toggles as successful when loop persistence fails", () => {
    const source = getRemoteServerSource()
    const toggleLoopSection = getSection(source, 'fastify.post("/v1/loops/:id/toggle"', '// POST /v1/loops/:id/run - Run a repeat task immediately')

    expect(toggleLoopSection).toContain("const saved = loopService.saveLoop(updated)")
    expect(toggleLoopSection).toContain('if (!saved) {')
    expect(toggleLoopSection).toContain('return reply.code(500).send({ error: "Failed to persist repeat task toggle" })')

    const saveIndex = toggleLoopSection.indexOf("const saved = loopService.saveLoop(updated)")
    const failureIndex = toggleLoopSection.indexOf('return reply.code(500).send({ error: "Failed to persist repeat task toggle" })')
    const successIndex = toggleLoopSection.indexOf("return reply.send({")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("does not report repeat task creation as successful when loop persistence fails", () => {
    const source = getRemoteServerSource()
    const createLoopSection = getSection(source, 'fastify.post("/v1/loops"', '// PATCH /v1/loops/:id - Update a loop/repeat task')

    expect(createLoopSection).toContain("const saved = loopService.saveLoop(newLoop)")
    expect(createLoopSection).toContain('if (!saved) {')
    expect(createLoopSection).toContain('return reply.code(500).send({ error: "Failed to persist repeat task" })')

    const saveIndex = createLoopSection.indexOf("const saved = loopService.saveLoop(newLoop)")
    const failureIndex = createLoopSection.indexOf('return reply.code(500).send({ error: "Failed to persist repeat task" })')
    const successIndex = createLoopSection.indexOf('return reply.send({ loop: await formatLoopResponse(loopService?.getLoop(newLoop.id) ?? newLoop) })')

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })

  it("does not report repeat task updates as successful when loop persistence fails", () => {
    const source = getRemoteServerSource()
    const updateLoopSection = getSection(source, 'fastify.patch("/v1/loops/:id"', '// DELETE /v1/loops/:id - Delete a loop/repeat task')

    expect(updateLoopSection).toContain("const saved = loopService.saveLoop(updated)")
    expect(updateLoopSection).toContain('if (!saved) {')
    expect(updateLoopSection).toContain('return reply.code(500).send({ error: "Failed to persist repeat task" })')

    const saveIndex = updateLoopSection.indexOf("const saved = loopService.saveLoop(updated)")
    const failureIndex = updateLoopSection.indexOf('return reply.code(500).send({ error: "Failed to persist repeat task" })')
    const successIndex = updateLoopSection.indexOf('return reply.send({ success: true, loop: await formatLoopResponse(loopService?.getLoop(params.id) ?? updated) })')

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureIndex).toBeGreaterThan(saveIndex)
    expect(successIndex).toBeGreaterThan(failureIndex)
  })
})
