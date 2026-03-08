import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionGridSource = readFileSync(
  new URL("./session-grid.tsx", import.meta.url),
  "utf8",
)

describe("session grid layout helpers", () => {
  it("exports the responsive stacked-layout helper consumed by the sessions page", () => {
    expect(sessionGridSource).toContain(
      "export function isResponsiveStackedTileLayout(",
    )
    expect(sessionGridSource).toContain(
      'if (layoutMode === "1x1" || sessionCount <= 1 || containerWidth <= 0)',
    )
    expect(sessionGridSource).toContain(
      "requestedColumnCount * TILE_DIMENSIONS.width.min",
    )
  })

  it("reports grid measurements back to the sessions page for adaptive layout hints", () => {
    expect(sessionGridSource).toContain(
      "export interface SessionGridMeasurements {",
    )
    expect(sessionGridSource).toContain(
      "onMeasurementsChange?: (measurements: SessionGridMeasurements) => void",
    )
    expect(sessionGridSource).toContain(
      "onMeasurementsChange?.({ containerWidth, containerHeight, gap })",
    )
  })
})