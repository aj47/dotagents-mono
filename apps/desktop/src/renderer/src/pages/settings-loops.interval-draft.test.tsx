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

describe("desktop repeat-task interval editing", () => {
  it("keeps interval and max-iteration drafts local in edit state", () => {
    expect(settingsLoopsSource).toContain('intervalMinutesDraft: "15"')
    expect(settingsLoopsSource).toContain('maxIterationsDraft: ""')
    expect(settingsLoopsSource).toContain("intervalMinutesDraft: formatLoopIntervalDraft(loop.intervalMinutes)")
    expect(settingsLoopsSource).toContain("maxIterationsDraft: formatLoopMaxIterationsDraft(loop.maxIterations)")
  })

  it("allows blank max-iteration drafts to inherit the global setting", () => {
    expect(settingsLoopsSource).toContain("if (!trimmedDraft) return undefined")
    expect(settingsLoopsSource).toContain('placeholder="Global"')
    expect(settingsLoopsSource).toContain("leave blank to inherit the general setting")
  })

  it("blocks invalid interval and max-iteration saves before persistence", () => {
    const handleSaveSection = getSection(settingsLoopsSource, "  const handleSave = async () => {", "  const handleToggleEnabled = async")

    expect(handleSaveSection).toContain("const parsedIntervalMinutes = parseLoopIntervalDraft(editing.intervalMinutesDraft)")
    expect(handleSaveSection).toContain('toast.error("Interval must be a positive whole number of minutes")')
    expect(handleSaveSection).toContain("const parsedMaxIterations = parseLoopMaxIterationsDraft(editing.maxIterationsDraft)")
    expect(handleSaveSection).toContain('toast.error(`Max iterations must be a whole number between ${LOOP_MAX_ITERATIONS_MIN} and ${LOOP_MAX_ITERATIONS_MAX}`)')
  })

  it("persists explicit max-iteration overrides alongside interval updates", () => {
    const handleSaveSection = getSection(settingsLoopsSource, "  const handleSave = async () => {", "  const handleToggleEnabled = async")

    expect(handleSaveSection).toContain("intervalMinutes: parsedIntervalMinutes,")
    expect(handleSaveSection).toContain("...(parsedMaxIterations !== undefined && { maxIterations: parsedMaxIterations }),")
  })

  it("shows configured task-specific iteration caps in the task list", () => {
    expect(settingsLoopsSource).toContain("{typeof loop.maxIterations === \"number\" && (")
    expect(settingsLoopsSource).toContain("<div>Max {loop.maxIterations} iterations</div>")
    expect(settingsLoopsSource).toContain('id="maxIterations"')
  })
})
