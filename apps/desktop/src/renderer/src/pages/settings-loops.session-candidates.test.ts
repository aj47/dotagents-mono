import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsLoopsSource = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

describe("settings loops session candidates", () => {
  it("uses shared session candidate merge and label helpers", () => {
    expect(settingsLoopsSource).toContain("buildAgentSessionCandidateOptions")
    expect(settingsLoopsSource).toContain("formatAgentSessionCandidateLabel")
    expect(settingsLoopsSource).not.toContain("function formatSessionLabel")
    expect(settingsLoopsSource).not.toContain("const seen = new Set<string>()")
  })
})
