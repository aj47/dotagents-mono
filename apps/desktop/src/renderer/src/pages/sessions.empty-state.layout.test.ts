import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")
const compactSessionsSource = sessionsSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactSessionsSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("sessions empty state layout", () => {
  it("top-anchors the empty state when recent session history exists so actionable history appears sooner", () => {
    expectSourceToContain("const hasRecentSessions = recentSessions.length > 0")
    expectSourceToContain(
      'className={`flex min-h-full flex-col items-center px-6 text-center ${',
    )
    expectSourceToContain(
      'hasRecentSessions ? "justify-start py-6" : "justify-center py-8"',
    )
    expectSourceToContain("{hasRecentSessions && (")
    expectSourceToContain('className="mt-6 w-full max-w-lg text-left"')
  })
})