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

  it("preserves loop runOnStartup state through the mobile loop routes", () => {
    const source = getRemoteServerSource()
    const createLoopSection = getSection(source, '// POST /v1/loops - Create a new loop/repeat task', '// PATCH /v1/loops/:id - Update a loop/repeat task')
    const updateLoopSection = getSection(source, '// PATCH /v1/loops/:id - Update a loop/repeat task', '// DELETE /v1/loops/:id - Delete a loop/repeat task')

    expect(createLoopSection).toContain('runOnStartup?: unknown')
    expect(createLoopSection).toContain('runOnStartup must be a boolean when provided')
    expect(createLoopSection).toContain('const runOnStartup = typeof body.runOnStartup === "boolean" ? body.runOnStartup : false')
    expect(createLoopSection).toContain('runOnStartup,')

    expect(updateLoopSection).toContain('runOnStartup?: unknown')
    expect(updateLoopSection).toContain('runOnStartup must be a boolean when provided')
    expect(updateLoopSection).toContain('const runOnStartup = typeof body.runOnStartup === "boolean" ? body.runOnStartup : undefined')
    expect(updateLoopSection).toContain('...(runOnStartup !== undefined && { runOnStartup }),')
  })
})
