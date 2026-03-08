import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

describe("sessions launch action feedback", () => {
  it("shows visible feedback when new-session launch actions fail", () => {
    const compactSource = compact(sessionsSource)

    expect(compactSource).toContain(compact("console.error(\"Failed to start text session:\", error)"))
    expect(compactSource).toContain(compact("toast.error(getSessionActionErrorMessage(\"Failed to start text session\", error))"))
    expect(compactSource).toContain(compact("console.error(\"Failed to start voice session:\", error)"))
    expect(compactSource).toContain(compact("toast.error(getSessionActionErrorMessage(\"Failed to start voice session\", error))"))
    expect(compactSource).toContain(compact("console.error(\"Failed to start prompt session:\", error)"))
    expect(compactSource).toContain(compact("toast.error(getSessionActionErrorMessage(\"Failed to start prompt session\", error))"))
  })
})