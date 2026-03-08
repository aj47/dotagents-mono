import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsProvidersSource = readFileSync(
  new URL("./settings-providers.tsx", import.meta.url),
  "utf8",
)

describe("settings providers page layout", () => {
  it("wraps provider section headers and active-usage badges safely", () => {
    const headerRowMatches = settingsProvidersSource.match(
      /className="flex w-full flex-wrap items-start gap-2 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-muted\/30"/g,
    )
    const titleRowMatches = settingsProvidersSource.match(
      /className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold"/g,
    )
    const badgeRowMatches = settingsProvidersSource.match(
      /className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1\.5"/g,
    )

    expect(headerRowMatches).toHaveLength(9)
    expect(titleRowMatches).toHaveLength(9)
    expect(badgeRowMatches).toHaveLength(6)
  })
})