import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsGeneralSource = readFileSync(
  new URL("./settings-general.tsx", import.meta.url),
  "utf8",
)

describe("settings general page layout", () => {
  it("stacks Langfuse helper and status copy beneath their primary controls", () => {
    expect(settingsGeneralSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1 sm:max-w-[360px]"',
    )
    expect(settingsGeneralSource).toContain(
      'className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsGeneralSource).toContain(
      'className="flex w-full min-w-0 flex-col items-start gap-1.5 text-left sm:max-w-[360px]"',
    )
    expect(settingsGeneralSource).toContain(
      'className="flex flex-wrap items-center gap-2"',
    )
  })

  it("gives Langfuse credential and URL rows a wider value lane before the page fully stacks", () => {
    expect(settingsGeneralSource).toContain(
      'const langfuseWideValueControlClassName =',
    )
    expect(settingsGeneralSource).toContain(
      '"px-3 [&>div:first-child]:sm:max-w-[30%] [&>div:last-child]:sm:max-w-[70%]"',
    )

    const langfuseWideRowMatches = settingsGeneralSource.match(
      /className=\{langfuseWideValueControlClassName\}/g,
    )

    expect(langfuseWideRowMatches).toHaveLength(4)
  })

  it("lets shortcut toggle and select rows wrap instead of overflowing their value lane under zoom", () => {
    const wrapSafeShortcutRows = settingsGeneralSource.match(
      /className="flex flex-wrap items-start gap-2"/g,
    )
    const shrinkSafeShortcutSelects = settingsGeneralSource.match(
      /<SelectTrigger className="w-full max-w-40">/g,
    )

    expect(wrapSafeShortcutRows).toHaveLength(3)
    expect(shrinkSafeShortcutSelects).toHaveLength(3)
    expect(settingsGeneralSource).toContain(
      'className="min-w-0 flex-1 text-sm leading-5 text-muted-foreground"',
    )
  })
})