import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getTipcSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "tipc.ts"), "utf8")
}

describe("desktop MCP config validation", () => {
  it("reuses the shared MCP config import parser", () => {
    const source = getTipcSource()

    expect(source).toContain("parseMcpServerConfigImportRequestBody")
    expect(source).toContain("function parseMcpConfigImportBody(body: unknown): MCPConfig")
    expect(source).toContain("return parseMcpConfigImportBody(JSON.parse(configContent))")
    expect(source).toContain("return parseMcpConfigImportBody(JSON.parse(input.text))")
    expect(source).toContain("parseMcpConfigImportBody(input.config)")
    expect(source).not.toContain('stdio transport requires "args"')
    expect(source).not.toContain("const transportType = inferTransportType(serverConfig)")
  })
})
