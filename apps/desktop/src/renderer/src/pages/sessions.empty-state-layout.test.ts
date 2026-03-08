import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")
const compactSessionsSource = sessionsSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactSessionsSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("sessions empty-state layout", () => {
  it("keeps the start actions and recent-session recovery path visible with tighter vertical spacing", () => {
    expectSourceToContain(
      'className="flex flex-col items-center justify-center px-6 py-4 text-center"',
    )
    expectSourceToContain('className="bg-muted mb-2 rounded-full p-3"')
    expectSourceToContain('className="mt-4 w-full max-w-lg text-left"')
  })
})