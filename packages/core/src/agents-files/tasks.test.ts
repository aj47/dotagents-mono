import { describe, expect, it } from "vitest"
import { parseTaskMarkdown, stringifyTaskMarkdown } from "./tasks"

describe("task metadata persistence", () => {
  it("serializes loop circuit-breaker metadata into task frontmatter", () => {
    const markdown = stringifyTaskMarkdown({
      id: "burning-loop",
      name: "Burning Loop",
      prompt: "Trigger the failure path",
      intervalMinutes: 60,
      enabled: false,
      consecutiveFailures: 3,
      lastFailureAt: 1774242000000,
      lastError: "Configured ACP main agent \"missing-loop-agent\" not found.",
      autoPausedAt: 1774242060000,
    })

    expect(markdown).toContain("consecutiveFailures: 3")
    expect(markdown).toContain("lastFailureAt: 1774242000000")
    expect(markdown).toContain('lastError: Configured ACP main agent "missing-loop-agent" not found.')
    expect(markdown).toContain("autoPausedAt: 1774242060000")
  })

  it("parses loop circuit-breaker metadata from task frontmatter", () => {
    const task = parseTaskMarkdown(`---
kind: task
id: burning-loop
name: Burning Loop
intervalMinutes: 60
enabled: false
consecutiveFailures: 2
lastFailureAt: 1774242000000
lastError: Configured ACP main agent "missing-loop-agent" not found.
autoPausedAt: 1774242060000
---

Trigger the failure path.
`)

    expect(task).toEqual(expect.objectContaining({
      id: "burning-loop",
      consecutiveFailures: 2,
      lastFailureAt: 1774242000000,
      lastError: 'Configured ACP main agent "missing-loop-agent" not found.',
      autoPausedAt: 1774242060000,
    }))
  })
})
