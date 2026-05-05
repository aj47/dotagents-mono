import { describe, expect, it } from "vitest"
import { parseTaskMarkdown, stringifyTaskMarkdown } from "./tasks"
import type { LoopConfig } from "../types"

describe("agents-files/tasks", () => {
  it("roundtrips runContinuously in task frontmatter", () => {
    const task: LoopConfig = {
      id: "continuous-task",
      name: "Continuous task",
      prompt: "Keep processing the queue.",
      intervalMinutes: 15,
      enabled: true,
      runContinuously: true,
      maxIterations: 3,
    }

    const markdown = stringifyTaskMarkdown(task)
    expect(markdown).toContain("runContinuously: true")
    expect(markdown).toContain("maxIterations: 3")

    const parsed = parseTaskMarkdown(markdown)
    expect(parsed?.runContinuously).toBe(true)
    expect(parsed?.maxIterations).toBe(3)
  })

  it("omits runContinuously when false or missing", () => {
    const task: LoopConfig = {
      id: "interval-task",
      name: "Interval task",
      prompt: "Run occasionally.",
      intervalMinutes: 15,
      enabled: true,
    }

    const markdown = stringifyTaskMarkdown(task)
    expect(markdown).not.toContain("runContinuously")
    expect(parseTaskMarkdown(markdown)?.runContinuously).toBeUndefined()
  })
})
