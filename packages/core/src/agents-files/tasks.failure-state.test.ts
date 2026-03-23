import { describe, expect, it } from "vitest"
import { parseTaskMarkdown, stringifyTaskMarkdown } from "./tasks"

describe("task failure-state frontmatter", () => {
  it("round-trips repeat-task failure metadata", () => {
    const markdown = stringifyTaskMarkdown({
      id: "broken-repeat-task",
      name: "Broken Repeat Task",
      prompt: "Say hello",
      intervalMinutes: 1,
      enabled: false,
      runOnStartup: true,
      lastRunAt: 1774247279000,
      consecutiveFailures: 3,
      lastFailureAt: 1774247285000,
      lastFailureMessage: "OpenAI API key is missing.",
      autoPausedAt: 1774247285000,
    })

    expect(markdown).toContain("consecutiveFailures: 3")
    expect(markdown).toContain("lastFailureAt: 1774247285000")
    expect(markdown).toContain("lastFailureMessage: OpenAI API key is missing.")
    expect(markdown).toContain("autoPausedAt: 1774247285000")

    expect(parseTaskMarkdown(markdown)).toEqual({
      id: "broken-repeat-task",
      name: "Broken Repeat Task",
      prompt: "Say hello",
      intervalMinutes: 1,
      enabled: false,
      runOnStartup: true,
      lastRunAt: 1774247279000,
      consecutiveFailures: 3,
      lastFailureAt: 1774247285000,
      lastFailureMessage: "OpenAI API key is missing.",
      autoPausedAt: 1774247285000,
      profileId: undefined,
    })
  })
})
