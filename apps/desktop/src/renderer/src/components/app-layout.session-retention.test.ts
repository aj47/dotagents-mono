import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("./app-layout.tsx", import.meta.url), "utf8")

describe("app layout session retention", () => {
  it("keeps store-backed sessions in the collapsed active preview list", () => {
    expect(appLayoutSource).toContain("const trackedActiveSessions = sessionData?.activeSessions ?? []")
    expect(appLayoutSource).toContain("const recentSessions = sessionData?.recentSessions ?? []")
    expect(appLayoutSource).toContain("for (const [sessionId, progress] of agentProgressById.entries())")
    expect(appLayoutSource).toContain('status: "active"')
    expect(appLayoutSource).toContain("const isVisiblyActive = isFocused || !isSnoozed")
  })
})