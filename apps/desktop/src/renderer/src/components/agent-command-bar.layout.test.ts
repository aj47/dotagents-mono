import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const commandBarSource = readFileSync(
  new URL("./agent-command-bar.tsx", import.meta.url),
  "utf8",
)

describe("agent command bar shortcuts", () => {
  it("uses modified bracket shortcuts for queue navigation instead of Tab", () => {
    expect(commandBarSource).toContain(
      "const PREVIOUS_ENTRY_SHORTCUT = `${SHORTCUT_MOD_PREFIX}[`",
    )
    expect(commandBarSource).toContain(
      "const NEXT_ENTRY_SHORTCUT = `${SHORTCUT_MOD_PREFIX}]`",
    )
    expect(commandBarSource).toContain('if (isPlainMod && e.key === "[")')
    expect(commandBarSource).toContain('if (isPlainMod && e.key === "]")')
    expect(commandBarSource).toContain('[NEXT_ENTRY_SHORTCUT, "next"]')
    expect(commandBarSource).toContain('[PREVIOUS_ENTRY_SHORTCUT, "prev"]')
    expect(commandBarSource).not.toContain('e.key === "Tab"')
    expect(commandBarSource).not.toContain('"Shift+Tab"')
  })
})
