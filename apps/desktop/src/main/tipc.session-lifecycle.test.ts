import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getTipcSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "tipc.ts"), "utf8")
}

describe("processWithAgentMode session lifecycle", () => {
  it("cleans up session runtime state in the standard agent-mode finally block", () => {
    const source = getTipcSource()
    const startIndex = source.indexOf("async function processWithAgentMode(")
    const endIndex = source.indexOf("export async function runAgentLoopSession(")

    expect(startIndex).toBeGreaterThanOrEqual(0)
    expect(endIndex).toBeGreaterThan(startIndex)

    const processWithAgentModeSection = source.slice(startIndex, endIndex)

    expect(processWithAgentModeSection).toContain("} finally {")
    expect(processWithAgentModeSection).toContain("agentSessionStateManager.cleanupSession(sessionId)")
  })
})