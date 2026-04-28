import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("./app-layout.tsx", import.meta.url), "utf8")

describe("app layout session retention", () => {
  it("keeps store-backed sessions in the collapsed active preview list", () => {
    expect(appLayoutSource).toContain("const trackedActiveSessions = sessionData?.activeSessions ?? []")
    expect(appLayoutSource).toContain("const recentCompletedSessions =")
    expect(appLayoutSource).toContain("sessionData?.recentCompletedSessions ?? sessionData?.recentSessions ?? []")
    expect(appLayoutSource).toContain("for (const [sessionId, progress] of agentProgressById.entries())")
    expect(appLayoutSource).toContain('status: "active"')
    expect(appLayoutSource).toContain("const isVisiblyActive = isFocused || !isSnoozed")
  })

  it("lets settings move up when the expanded session list shrinks", () => {
    expect(appLayoutSource).toContain("sessions and settings scroll together")
    expect(appLayoutSource).toContain("mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden")
    expect(appLayoutSource).toContain('className="shrink-0"')
  })
})