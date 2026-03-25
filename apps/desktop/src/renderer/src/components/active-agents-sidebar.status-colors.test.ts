import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar status colors", () => {
  it("uses green for running sessions and gray for idle sessions", () => {
    expect(sidebarSource).toContain(': conversationState === "running"')
    expect(sidebarSource).toContain('? "bg-green-500"')
    expect(sidebarSource).toContain(': "bg-muted-foreground"')
  })

  it("uses gray for completed past sessions", () => {
    expect(sidebarSource).toContain('session.status === "error"')
    expect(sidebarSource).toContain(': "bg-muted-foreground"')
  })
})
