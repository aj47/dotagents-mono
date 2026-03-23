import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const bundleServiceSource = readFileSync(new URL("./bundle-service.ts", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("bundle repeat-task validation", () => {
  it("requires integer max-iteration caps for imported repeat tasks", () => {
    const repeatTaskSection = getSection(
      bundleServiceSource,
      "function isBundleRepeatTask(value: unknown): value is BundleRepeatTask {",
      "function isBundleKnowledgeNote",
    )

    expect(repeatTaskSection).toContain('typeof value.maxIterations !== "number"')
    expect(repeatTaskSection).toContain("!Number.isInteger(value.maxIterations)")
    expect(repeatTaskSection).toContain("value.maxIterations < 1")
  })
})
