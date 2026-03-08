import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsProvidersSource = readFileSync(
  new URL("./settings-providers.tsx", import.meta.url),
  "utf8",
)

describe("settings providers page layout", () => {
  it("keeps the top-level provider sections in a single shrink-safe column", () => {
    expect(settingsProvidersSource).toContain('className="grid grid-cols-1 gap-4 min-w-0"')
  })

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

  it("renders local model download errors as wrap-safe alert cards", () => {
    expect(settingsProvidersSource).toContain(
      'const LOCAL_MODEL_DOWNLOAD_ERROR_CARD_CLASS_NAME =',
    )
    expect(settingsProvidersSource).toContain('role="alert"')
    expect(settingsProvidersSource).toContain('[overflow-wrap:anywhere]')
    expect(settingsProvidersSource).toContain('className="w-full sm:w-auto"')

    const localModelErrorMatches = settingsProvidersSource.match(
      /return <LocalModelDownloadError error=\{status\.error\} onRetry=\{handleDownload\} \/>/g,
    )

    expect(localModelErrorMatches).toHaveLength(3)
  })
})