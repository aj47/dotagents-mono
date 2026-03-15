import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getRemoteServerSource(): string {
  // Read from @dotagents/core source — desktop's remote-server.ts is a thin re-export
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const remoteServerPath = path.join(testDir, "../../../../packages/core/src/remote-server.ts")
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
