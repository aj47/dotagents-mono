import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar hover close control", () => {
  it("shows the active-session stop button on hover and focus-within", () => {
    expect(sidebarSource).toContain('title="Stop this agent session"')
    expect(sidebarSource).toContain('aria-label="Stop this agent session"')
    expect(sidebarSource).toContain('type="button"')
    expect(sidebarSource).toContain('group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100')
    expect(sidebarSource).toContain('text-muted-foreground transition-all hover:bg-destructive/20 hover:text-destructive')
  })
})
