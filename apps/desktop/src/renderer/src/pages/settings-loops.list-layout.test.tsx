import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsLoopsSource = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

function getSection(source: string, startMarker: string, endMarker: string): string {
  const startIndex = source.indexOf(startMarker)
  const endIndex = source.indexOf(endMarker)

  expect(startIndex).toBeGreaterThanOrEqual(0)
  expect(endIndex).toBeGreaterThan(startIndex)

  return source.slice(startIndex, endIndex)
}

describe("desktop repeat-task list layout", () => {
  it("renders enabled repeat tasks before disabled repeat tasks", () => {
    const stateSection = getSection(settingsLoopsSource, "  const loops: LoopConfig[]", "  const handleCreate")
    const listSection = getSection(settingsLoopsSource, "  const renderLoopList = () => (", "  const renderEditForm")

    expect(stateSection).toContain("const orderedLoops = [...loops].sort")
    expect(stateSection).toContain("Number(b.enabled) - Number(a.enabled)")
    expect(listSection).toContain("{orderedLoops.map")
  })

  it("keeps the enabled toggle in the compact task action row", () => {
    const listSection = getSection(settingsLoopsSource, "  const renderLoopList = () => (", "  const renderEditForm")

    expect(listSection).toContain('className="flex shrink-0 items-center gap-1"')
    expect(listSection).toContain('aria-label={`${loop.enabled ? "Disable" : "Enable"} ${loop.name}`}')
    expect(listSection).toContain('className="h-6 gap-1 px-1.5 text-xs"')
    expect(listSection).not.toContain('<Label className="text-xs">{loop.enabled ? "Enabled" : "Disabled"}</Label>')
  })
})