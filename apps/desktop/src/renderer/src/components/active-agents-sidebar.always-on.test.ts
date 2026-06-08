import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar always-on strip", () => {
  it("surfaces recent log progress and queue counters", () => {
    expect(sidebarSource).toContain("function AlwaysOnSessionStrip(")
    expect(sidebarSource).toContain("session.recentLogEntries")
    expect(sidebarSource).toContain("function getAlwaysOnEntryDetails")
    expect(sidebarSource).toContain("function getAlwaysOnLogKindClassName")
    expect(sidebarSource).toContain("session.pendingQuestionCount")
    expect(sidebarSource).toContain("session.answeredQuestionCount")
    expect(sidebarSource).toContain("function formatAlwaysOnStatusLabel")
    expect(sidebarSource).toContain("function isAlwaysOnPromptDerivedTitle")
    expect(sidebarSource).toContain("const alwaysOnSessionIds = useMemo")
    expect(sidebarSource).toContain(">Log</span>")
    expect(sidebarSource).toContain(">Queue</span>")
    expect(sidebarSource).toContain(">Answered</span>")
    expect(sidebarSource).toContain("Needs answer")
    expect(sidebarSource).toContain("Latest work")
    expect(sidebarSource).toContain("function formatAlwaysOnLogKind")
    expect(sidebarSource).toContain("formatAlwaysOnLogKind(entry.kind)")
    expect(sidebarSource).toContain("isAlwaysOnPromptDerivedTitle(entry.session.conversationTitle)")
    expect(sidebarSource).toContain("line-clamp-2")
    expect(sidebarSource).toContain("aria-label={`${session.pendingQuestionCount} pending always-on question")
  })
})
