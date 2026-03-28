import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

describe("repeat-task max-iterations plumbing", () => {
  it("passes each task's maxIterations into the loop agent run", () => {
    expect(loopServiceSource).toContain("startSharedPromptRun({")
    expect(loopServiceSource).toContain("maxIterationsOverride: loop.maxIterations")
  })

  it("allows resume-only agent runs to override the default iteration budget", () => {
    expect(tipcSource).toContain("maxIterationsOverride?: number")
    expect(tipcSource).toContain("return startSharedResumeRun({")
    expect(tipcSource).toContain("candidateSessionIds: existingSessionId ? [existingSessionId] : [],")
    expect(tipcSource).toContain("maxIterationsOverride,")
  })
})
