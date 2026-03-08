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
})