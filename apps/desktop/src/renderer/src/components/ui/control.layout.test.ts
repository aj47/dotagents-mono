import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const controlSource = readFileSync(new URL("./control.tsx", import.meta.url), "utf8")

describe("ControlGroup layout", () => {
  it("makes collapsible group headers full-width interactive rows with visible focus state", () => {
    expect(controlSource).toContain(
      'className="group mb-3 flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"',
    )
    expect(controlSource).toContain("aria-expanded={!collapsed}")
    expect(controlSource).toContain('<span className="text-sm font-semibold break-words">{title}</span>')
  })
})