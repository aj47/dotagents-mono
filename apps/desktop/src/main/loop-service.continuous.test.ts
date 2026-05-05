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
    expect(startLoopSection).toContain("void this.executeLoop(loopId, { rescheduleAfterRun: true })")
  })

  it("reschedules continuous tasks without waiting for the interval", () => {
    const getNextDelaySection = getSection(loopServiceSource, "  private getNextDelayMs(", "}\n}\n\nexport const loopService")

    expect(loopServiceSource).toContain("getNextRepeatTaskDelayMs")
    expect(getNextDelaySection).toContain("const scheduling = getNextRepeatTaskDelayMs(loop, now)")
    expect(getNextDelaySection).toContain("return scheduling.delayMs")
  })
})
