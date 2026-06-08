import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const loopServiceSource = readFileSync(new URL("./loop-service.ts", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("continuous repeat tasks", () => {
  it("starts continuous tasks immediately", () => {
    const startLoopSection = getSection(loopServiceSource, "  startLoop(loopId: string): boolean {", "  stopLoop(loopId: string): boolean {")

    expect(startLoopSection).toContain("loop.runOnStartup || isContinuousLoop(loop)")
    expect(startLoopSection).toContain("this.scheduleNextRun(loopId, 0)")
    expect(startLoopSection).not.toContain("setImmediate(")
  })

  it("skips stale scheduled executions after a loop is disabled", () => {
    const executeLoopSection = getSection(loopServiceSource, "  private async executeLoop(", "  private scheduleNextRun(")

    expect(executeLoopSection).toContain("if (options.rescheduleAfterRun && !loop.enabled)")
    expect(executeLoopSection).toContain("Skip scheduled execution")
  })

  it("reschedules continuous tasks without waiting for the interval", () => {
    const getNextDelaySection = getSection(loopServiceSource, "  private getNextDelayMs(", "  private getIntervalMs(")

    expect(getNextDelaySection).toContain("if (isContinuousLoop(loop))")
    expect(getNextDelaySection).toContain("return 0")
  })

  it("durably disables continuous loops on emergency stop", () => {
    // Emergency stop must persist the cancel signal so the loop does not pick
    // back up after the in-flight session aborts — see issue #379.
    const section = getSection(
      loopServiceSource,
      "  emergencyStopContinuousLoops(): string[] {",
      "  startLoop(loopId: string): boolean {",
    )

    expect(section).toContain("isContinuousLoop(loop)")
    expect(section).toContain("enabled: false")
    expect(section).toContain("this.stopLoop(loop.id)")
  })

  it("mutates in-memory loop state before attempting persistence", () => {
    // Critical for the persistence-failure path: if we persisted first and
    // failed, the in-memory loop would still be `enabled: true` and the
    // in-flight executeLoop()'s finally would reschedule. See PR #492 review.
    const section = getSection(
      loopServiceSource,
      "  emergencyStopContinuousLoops(): string[] {",
      "  startLoop(loopId: string): boolean {",
    )

    const inMemoryAssignIdx = section.indexOf("this.loops[i] = updated")
    const persistCallIdx = section.indexOf("this.saveTask(updated)")

    expect(inMemoryAssignIdx).toBeGreaterThanOrEqual(0)
    expect(persistCallIdx).toBeGreaterThanOrEqual(0)
    expect(inMemoryAssignIdx).toBeLessThan(persistCallIdx)
  })
})
