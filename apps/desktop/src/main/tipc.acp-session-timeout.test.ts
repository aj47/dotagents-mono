import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("tipc ACP session timeout wiring", () => {
  it("passes the configured session timeout into ACP session runs", () => {
    expect(tipcSource).toContain("const sessionMaxDurationMs = resolveAgentSessionMaxDurationMs(config.mcpSessionTimeoutMinutes)")
    expect(tipcSource).toContain("agentSessionStateManager.startSessionRun(sessionId, profileSnapshot, {")
    expect(tipcSource).toContain("maxDurationMs: sessionMaxDurationMs")
  })
})
