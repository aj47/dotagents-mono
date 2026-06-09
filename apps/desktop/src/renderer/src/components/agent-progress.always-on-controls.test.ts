import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress always-on controls", () => {
  it("renders goal editing and reset controls in the main always-on status band", () => {
    expect(agentProgressSource).toContain("const renderAlwaysOnStatusBand = (compact = false)")
    expect(agentProgressSource).toContain("Goal")
    expect(agentProgressSource).toContain("Set always-on goal")
    expect(agentProgressSource).toContain("Save always-on goal")
    expect(agentProgressSource).toContain("Clear and restart always-on session")
    expect(agentProgressSource).toContain("tipcClient.updateAlwaysOnSessionGoal")
    expect(agentProgressSource).toContain("tipcClient.resetAlwaysOnSession")
  })
})
