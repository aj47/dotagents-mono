import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./panel-drag-bar.tsx", import.meta.url), "utf8")

describe("desktop floating panel drag bar", () => {
  it("keeps the drag bar interactive so custom drag persistence can run", () => {
    expect(source).toContain('onMouseDown={handleMouseDown}')
    expect(source).toContain('savePanelCustomPosition({')
    expect(source).toContain('WebkitAppRegion: "no-drag"')
    expect(source).toContain("drag regions ignore pointer events")
  })
})