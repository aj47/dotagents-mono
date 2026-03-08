import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("./app-layout.tsx", import.meta.url), "utf8")

describe("app layout settings navigation", () => {
  it("visually nests expanded settings children and gives the active child route a clearer selected state", () => {
    expect(appLayoutSource).toContain("const SETTINGS_CHILD_NAV_LINK_CLASS_NAME =")
    expect(appLayoutSource).toContain(
      '"flex h-8 w-full items-center rounded-md border px-2 text-sm font-medium transition-all duration-200"',
    )
    expect(appLayoutSource).toContain("const SETTINGS_CHILD_NAV_LINK_ACTIVE_CLASS_NAME =")
    expect(appLayoutSource).toContain(
      '"border-border/70 bg-accent/80 text-foreground shadow-sm"',
    )
    expect(appLayoutSource).toContain("const SETTINGS_CHILD_NAV_LINK_INACTIVE_CLASS_NAME =")
    expect(appLayoutSource).toContain(
      '"border-transparent text-muted-foreground hover:border-border/50 hover:bg-accent/40 hover:text-foreground"',
    )
    expect(appLayoutSource).toContain(
      'className="mt-1 ml-2 border-l border-border/50 pl-3 text-sm"',
    )
    expect(appLayoutSource).toContain('className="grid gap-1"')
  })
})