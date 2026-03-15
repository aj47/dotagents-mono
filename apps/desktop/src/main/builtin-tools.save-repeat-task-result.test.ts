import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

// Read from @dotagents/core source — desktop's builtin-tools.ts is a thin re-export
const builtinToolsSource = readFileSync(new URL("../../../../packages/core/src/builtin-tools.ts", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("builtin save_repeat_task", () => {
  it("persists the saveLoop result and aborts before scheduling when persistence fails", () => {
    const saveRepeatTaskSection = getSection(builtinToolsSource, "  save_repeat_task: async", "  delete_repeat_task: async")

    expect(saveRepeatTaskSection).toContain("const saved = loopService.saveLoop(task)")
    expect(saveRepeatTaskSection).toContain("if (!saved) {")
    expect(saveRepeatTaskSection).toContain("success: false")
    expect(saveRepeatTaskSection).toContain('error: "Failed to persist repeat task"')

    const saveIndex = saveRepeatTaskSection.indexOf("const saved = loopService.saveLoop(task)")
    const failureGuardIndex = saveRepeatTaskSection.indexOf("if (!saved) {")
    const scheduleIndex = saveRepeatTaskSection.indexOf("if (task.enabled) {")
    const successIndex = saveRepeatTaskSection.indexOf("success: true, id: task.id")

    expect(saveIndex).toBeGreaterThanOrEqual(0)
    expect(failureGuardIndex).toBeGreaterThan(saveIndex)
    expect(scheduleIndex).toBeGreaterThan(failureGuardIndex)
    expect(successIndex).toBeGreaterThan(failureGuardIndex)
  })
})