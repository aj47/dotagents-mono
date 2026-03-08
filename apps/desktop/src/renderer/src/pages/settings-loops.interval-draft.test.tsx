import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

describe("desktop repeat-task interval safeguards", () => {
  it("parses interval drafts and blocks invalid saves instead of coercing them", () => {
    expect(source).toContain("function parseLoopIntervalDraft(draft: string): number | null {")
    expect(source).toContain("const parsedIntervalMinutes = parseLoopIntervalDraft(editing.intervalMinutesDraft)")
    expect(source).toContain('toast.error("Interval must be a positive whole number of minutes")')
    expect(source).toContain("intervalMinutes: parsedIntervalMinutes,")
  })

  it("surfaces scheduling and unscheduling failures after saving a task", () => {
    expect(source).toContain('toast.error(`${saveSuccessMessage}, but it could not be scheduled right now.`)')
    expect(source).toContain('toast.error(`${saveSuccessMessage}, but its previous schedule could not be cleared right now.`)')
    expect(source).toContain('toast.error("Task enabled, but it could not be scheduled right now.")')
    expect(source).toContain('toast.error("Task disabled, but its previous schedule could not be cleared right now.")')
  })

  it("refreshes the list and shows a visible error when deleting a task that no longer exists", () => {
    expect(source).toContain('const result = await tipcClient.deleteLoop({ loopId: id })')
    expect(source).toContain('refreshLoopQueries()')
    expect(source).toContain('toast.error("This task no longer exists. Refreshed the task list.")')
    expect(source).toContain('toast.error("Failed to delete task")')
  })
})
