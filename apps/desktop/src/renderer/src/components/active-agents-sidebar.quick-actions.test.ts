import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(
  new URL("./active-agents-sidebar.tsx", import.meta.url),
  "utf8",
)

describe("active agents sidebar quick actions", () => {
  it("renders session start controls alongside the session list", () => {
    expect(sidebarSource).toContain("Start Session")
    expect(sidebarSource).toContain("<AgentSelector")
    expect(sidebarSource).toContain('aria-label="Start with text"')
    expect(sidebarSource).toContain('aria-label="Start with voice"')
    expect(sidebarSource).toContain("<PredefinedPromptsMenu")
  })

  it("routes sidebar start actions back through the sessions page", () => {
    expect(sidebarSource).toContain('params.set("start", mode)')
    expect(sidebarSource).toContain(
      'navigate({ pathname: "/", search: `?${params.toString()}` })',
    )
  })
})
