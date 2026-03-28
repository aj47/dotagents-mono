import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")

function getSection(
  source: string,
  startMarker: string,
  endMarker: string,
): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("tipc saveLoop", () => {
  it("propagates loop persistence failures instead of hardcoding success", () => {
    const saveLoopSection = getSection(
      tipcSource,
      "saveLoop: t.procedure",
      "deleteLoop: t.procedure",
    )

    expect(saveLoopSection).toContain(
      "const result = saveManagedLoop(loopService, input.loop)",
    )
    expect(saveLoopSection).toContain("return { success: result.success }")
    expect(saveLoopSection).not.toContain("return { success: true }")
  })
})
