import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar always-on strip", () => {
  it("surfaces latest activity details and queue counters", () => {
    expect(sidebarSource).toContain("function AlwaysOnSessionStrip(")
    expect(sidebarSource).toContain("const latestDetails = latestEntry?.outcome || latestEntry?.details")
    expect(sidebarSource).toContain("session.pendingQuestionCount")
    expect(sidebarSource).toContain("session.answeredQuestionCount")
    expect(sidebarSource).toContain("latestEntry.kind.replace")
    expect(sidebarSource).toContain("line-clamp-2")
    expect(sidebarSource).toContain("aria-label={`${session.pendingQuestionCount} pending always-on question")
  })
})
