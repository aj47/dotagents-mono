import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsProvidersSource = readFileSync(
  new URL("./settings-providers.tsx", import.meta.url),
  "utf8",
)

const headerButtonMatches =
  settingsProvidersSource.match(/className=\{PROVIDER_SECTION_HEADER_BUTTON_CLASS_NAME\}/g) ?? []
const headerTitleMatches =
  settingsProvidersSource.match(/className=\{PROVIDER_SECTION_HEADER_TITLE_CLASS_NAME\}/g) ?? []
const usageBadgeMatches =
  settingsProvidersSource.match(/className=\{PROVIDER_SECTION_USAGE_BADGES_CLASS_NAME\}/g) ?? []

describe("settings providers layout", () => {
  it("lets provider section headers wrap so provider labels and usage badges do not have to compete on one rigid row", () => {
    expect(settingsProvidersSource).toContain(
      'const PROVIDER_SECTION_HEADER_BUTTON_CLASS_NAME =',
    )
    expect(settingsProvidersSource).toContain(
      '"flex w-full flex-wrap items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/30"',
    )
    expect(settingsProvidersSource).toContain(
      'const PROVIDER_SECTION_HEADER_TITLE_CLASS_NAME =',
    )
    expect(settingsProvidersSource).toContain(
      '"flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold"',
    )
    expect(settingsProvidersSource).toContain(
      'const PROVIDER_SECTION_USAGE_BADGES_CLASS_NAME =',
    )
    expect(settingsProvidersSource).toContain(
      '"ml-auto flex max-w-full flex-wrap items-center justify-start gap-1.5 sm:justify-end"',
    )
    expect(headerButtonMatches).toHaveLength(9)
    expect(headerTitleMatches).toHaveLength(9)
    expect(usageBadgeMatches).toHaveLength(6)
    expect(settingsProvidersSource).not.toContain(
      'className="px-3 py-2 flex items-center justify-between w-full hover:bg-muted/30 transition-colors cursor-pointer"',
    )
  })
})

