import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsLoopsSource = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("desktop repeat-task save result handling", () => {
  it("does not treat create persistence failures as successful saves", () => {
    const handleSaveSection = getSection(settingsLoopsSource, "  const handleSave = async () => {", "  const handleToggleEnabled = async")

    expect(handleSaveSection).toContain("const saveResult = await tipcClient.saveLoop({ loop: loopData })")
    expect(handleSaveSection).toContain("if (saveResult?.success === false) {")
    expect(handleSaveSection).toContain('toast.error("Failed to save task")')

    const guardIndex = handleSaveSection.indexOf("if (saveResult?.success === false) {")
    const invalidateIndex = handleSaveSection.indexOf('queryClient.invalidateQueries({ queryKey: ["loops"] })')

    expect(guardIndex).toBeGreaterThanOrEqual(0)
    expect(invalidateIndex).toBeGreaterThan(guardIndex)
  })

  it("does not treat toggle persistence failures as successful updates", () => {
    const toggleSection = getSection(settingsLoopsSource, "  const handleToggleEnabled = async (loop: LoopConfig) => {", "  const handleRunNow = async")

    expect(toggleSection).toContain("const saveResult = await tipcClient.saveLoop({ loop: updatedLoop })")
    expect(toggleSection).toContain("if (saveResult?.success === false) {")
    expect(toggleSection).toContain('toast.error("Failed to update task")')

    const guardIndex = toggleSection.indexOf("if (saveResult?.success === false) {")
    const invalidateIndex = toggleSection.indexOf('queryClient.invalidateQueries({ queryKey: ["loops"] })')

    expect(guardIndex).toBeGreaterThanOrEqual(0)
    expect(invalidateIndex).toBeGreaterThan(guardIndex)
  })

  it("refreshes loop queries after a successful manual run", () => {
    const runSection = getSection(settingsLoopsSource, "  const handleRunNow = async (loop: LoopConfig) => {", "  const handleOpenTaskFile = async")

    expect(runSection).toContain("const result = await tipcClient.triggerLoop?.({ loopId: loop.id })")
    expect(runSection).toContain('queryClient.invalidateQueries({ queryKey: ["loops"] })')
    expect(runSection).toContain('queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })')

    const successIndex = runSection.indexOf('toast.success(`Running "${loop.name}"...`)')
    const loopsInvalidateIndex = runSection.indexOf('queryClient.invalidateQueries({ queryKey: ["loops"] })')
    const statusesInvalidateIndex = runSection.indexOf('queryClient.invalidateQueries({ queryKey: ["loop-statuses"] })')

    expect(loopsInvalidateIndex).toBeGreaterThanOrEqual(0)
    expect(statusesInvalidateIndex).toBeGreaterThanOrEqual(0)
    expect(successIndex).toBeGreaterThan(loopsInvalidateIndex)
    expect(successIndex).toBeGreaterThan(statusesInvalidateIndex)
  })
})
