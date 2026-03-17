import { TILE_DIMENSIONS } from "@renderer/hooks/use-resizable"

export type TileLayoutMode = `${number}x${number}`

export const DEFAULT_TILE_LAYOUT_MODES: TileLayoutMode[] = ["1x2", "2x2", "1x1"]
export const COLLAPSED_TILE_ROW_HEIGHT = 48

const LAYOUT_MODE_REGEX = /^(\d+)x(\d+)$/
const MULTI_COLUMN_SAFETY_PX = 2

export function parseTileLayoutMode(layoutMode: TileLayoutMode) {
  const match = layoutMode.match(LAYOUT_MODE_REGEX)
  if (!match) {
    return { rows: 1, columns: 1 }
  }

  return {
    rows: Math.max(1, Number(match[1]) || 1),
    columns: Math.max(1, Number(match[2]) || 1),
  }
}

export function isMaximizedTileLayout(layoutMode: TileLayoutMode) {
  const { rows, columns } = parseTileLayoutMode(layoutMode)
  return rows === 1 && columns === 1
}

export function calculateTileWidth(containerWidth: number, gap: number, layoutMode: TileLayoutMode): number {
  if (containerWidth <= 0) return TILE_DIMENSIONS.width.default

  const { columns } = parseTileLayoutMode(layoutMode)
  if (columns === 1) {
    return Math.max(TILE_DIMENSIONS.width.min, containerWidth)
  }

  const totalGap = gap * Math.max(0, columns - 1)
  const width = Math.floor((containerWidth - totalGap - MULTI_COLUMN_SAFETY_PX) / columns)
  return Math.max(TILE_DIMENSIONS.width.min, width)
}

export function calculateTileHeight(containerHeight: number, gap: number, layoutMode: TileLayoutMode): number {
  if (containerHeight <= 0) return TILE_DIMENSIONS.height.default

  const { rows } = parseTileLayoutMode(layoutMode)
  if (rows === 1) {
    return Math.max(TILE_DIMENSIONS.height.min, containerHeight)
  }

  const totalGap = gap * Math.max(0, rows - 1)
  const height = Math.floor((containerHeight - totalGap) / rows)
  return Math.max(TILE_DIMENSIONS.height.min, height)
}

export function isTileLayoutModeViable(
  containerWidth: number,
  containerHeight: number,
  gap: number,
  layoutMode: TileLayoutMode,
  threshold: "default" | "min" = "default",
) {
  if (containerWidth <= 0 || containerHeight <= 0) return true

  const { rows, columns } = parseTileLayoutMode(layoutMode)
  const minWidth = threshold === "min" ? TILE_DIMENSIONS.width.min : TILE_DIMENSIONS.width.default
  const minHeight = threshold === "min" ? TILE_DIMENSIONS.height.min : TILE_DIMENSIONS.height.default

  const rawWidth = columns === 1
    ? containerWidth
    : Math.floor((containerWidth - gap * Math.max(0, columns - 1) - MULTI_COLUMN_SAFETY_PX) / columns)

  const rawHeight = rows === 1
    ? containerHeight
    : Math.floor((containerHeight - gap * Math.max(0, rows - 1)) / rows)

  return rawWidth >= minWidth && rawHeight >= minHeight
}

export function getAvailableTileLayoutModes(containerWidth: number, containerHeight: number, gap: number): TileLayoutMode[] {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return DEFAULT_TILE_LAYOUT_MODES
  }

  const maxColumns = Math.max(1, Math.floor((containerWidth + gap) / (TILE_DIMENSIONS.width.default + gap)))
  const maxRows = Math.max(1, Math.floor((containerHeight + gap) / (TILE_DIMENSIONS.height.default + gap)))

  const layouts: TileLayoutMode[] = []

  for (let rows = 1; rows <= maxRows; rows += 1) {
    for (let columns = 1; columns <= maxColumns; columns += 1) {
      if (rows === 1 && columns === 1) continue

      const layoutMode = `${rows}x${columns}` as TileLayoutMode
      if (!isTileLayoutModeViable(containerWidth, containerHeight, gap, layoutMode, "default")) continue

      layouts.push(layoutMode)
    }
  }

  layouts.sort((a, b) => {
    const left = parseTileLayoutMode(a)
    const right = parseTileLayoutMode(b)
    const capacityDelta = left.rows * left.columns - right.rows * right.columns
    if (capacityDelta !== 0) return capacityDelta
    const columnDelta = right.columns - left.columns
    if (columnDelta !== 0) return columnDelta
    return left.rows - right.rows
  })

  return [...layouts, "1x1"]
}

export function getTileLayoutLabel(layoutMode: TileLayoutMode) {
  if (isMaximizedTileLayout(layoutMode)) return "Maximized"

  const { rows, columns } = parseTileLayoutMode(layoutMode)
  if (rows === 1) return `${columns} columns`
  if (columns === 1) return `${rows} rows`
  return `${columns}×${rows} grid`
}

export function getTileGridRowSpan(tileHeight: number, gap: number) {
  return Math.max(1, Math.ceil((tileHeight + gap) / (COLLAPSED_TILE_ROW_HEIGHT + gap)))
}