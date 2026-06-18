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
    }

    const markdown = stringifyTaskMarkdown(task)
    expect(markdown).toContain("runContinuously: true")

    const parsed = parseTaskMarkdown(markdown)
    expect(parsed?.runContinuously).toBe(true)
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

  it("roundtrips adversarial critique settings in task frontmatter", () => {
    const task: LoopConfig = {
      id: "critic-task",
      name: "Critic task",
      prompt: "Draft and improve the report.",
      intervalMinutes: 60,
      enabled: true,
      adversarialCritique: true,
      criticProfileId: "critic-agent",
    }

    const markdown = stringifyTaskMarkdown(task)
    expect(markdown).toContain("adversarialCritique: true")
    expect(markdown).toContain("criticProfileId: critic-agent")

    const parsed = parseTaskMarkdown(markdown)
    expect(parsed?.adversarialCritique).toBe(true)
    expect(parsed?.criticProfileId).toBe("critic-agent")
  })
})
