import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("./app-layout.tsx", import.meta.url), "utf8")

describe("app layout outlet context", () => {
  it("passes a one-way sidebar collapse action into routed pages so local layout-pressure recovery can reclaim sessions width", () => {
    expect(appLayoutSource).toContain("setCollapsed,")
    expect(appLayoutSource).toContain("collapseSidebar: () => setCollapsed(true)")
    expect(appLayoutSource).toContain("sidebarWidth,")
  })
})