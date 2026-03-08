import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(
  new URL("./settings-agents.tsx", import.meta.url),
  "utf8",
)

describe("settings agents page layout", () => {
  it("wraps capability section headers and bulk actions safely", () => {
    const headerRowMatches = settingsAgentsSource.match(
      /className="flex w-full flex-wrap items-start gap-2 px-4 py-3"/g,
    )
    const sectionActionMatches = settingsAgentsSource.match(
      /className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"/g,
    )
    const bulkActionMatches = settingsAgentsSource.match(
      /className="flex flex-wrap items-center justify-end gap-1"/g,
    )
    const headerButtonMatches = settingsAgentsSource.match(
      /className="-mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0\.5 text-left transition-colors hover:bg-muted\/50"/g,
    )
    const badgeMatches = settingsAgentsSource.match(
      /className="shrink-0 text-xs"/g,
    )

    expect(headerRowMatches).toHaveLength(3)
    expect(sectionActionMatches).toHaveLength(3)
    expect(bulkActionMatches).toHaveLength(3)
    expect(headerButtonMatches).toHaveLength(3)
    expect(badgeMatches).toHaveLength(3)
    expect(settingsAgentsSource).toContain('className="h-6 shrink-0 px-2 text-[11px]"')
  })

  it("sizes agent cards from the real content column instead of viewport breakpoints", () => {
    expect(settingsAgentsSource).toContain(
      'className="grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-3 pb-12"',
    )
    expect(settingsAgentsSource).not.toContain(
      'className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 pb-12"',
    )
  })

  it("lets create-agent quick setup presets wrap under tighter widths and larger text", () => {
    expect(settingsAgentsSource).toContain('className="flex flex-wrap gap-2"')
  })

  it("lets the ACP auto-spawn toggle wrap instead of overflowing narrow settings widths", () => {
    expect(settingsAgentsSource).toContain('className="flex flex-wrap items-start gap-x-4 gap-y-3 pt-2"')
    expect(settingsAgentsSource.match(/className="flex items-start gap-2"/g)).toHaveLength(2)
    expect(settingsAgentsSource).not.toContain('className="flex items-center gap-4 pt-2"')
  })
})
