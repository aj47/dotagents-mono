import { describe, expect, it } from "vitest"

import { parseTaskMarkdown, stringifyTaskMarkdown } from "./tasks"

describe("task markdown persistence", () => {
  it("preserves maxIterations when stringifying and parsing repeat tasks", () => {
    const markdown = stringifyTaskMarkdown({
      id: "x-social-listener",
      name: "X Social Listener",
      prompt: "Listen for X opportunities",
      intervalMinutes: 60,
      enabled: true,
      maxIterations: 15,
      runOnStartup: true,
    })

    expect(markdown).toContain("maxIterations: 15")

    expect(parseTaskMarkdown(markdown)).toEqual({
      id: "x-social-listener",
      name: "X Social Listener",
      prompt: "Listen for X opportunities",
      intervalMinutes: 60,
      enabled: true,
      maxIterations: 15,
      runOnStartup: true,
      profileId: undefined,
      lastRunAt: undefined,
    })
  })

  it("ignores invalid maxIterations values from hand-edited task files", () => {
    const markdown = `---
id: x-social-listener
name: X Social Listener
intervalMinutes: 60
enabled: true
maxIterations: nope
---

Listen for X opportunities`

    expect(parseTaskMarkdown(markdown)).toEqual({
      id: "x-social-listener",
      name: "X Social Listener",
      prompt: "Listen for X opportunities",
      intervalMinutes: 60,
      enabled: true,
      maxIterations: undefined,
      profileId: undefined,
      runOnStartup: undefined,
      lastRunAt: undefined,
    })
  })
})
