export type PanelSize = { width: number; height: number }

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const PANEL_VIEWPORT_SCALE_SNAP_EPSILON = 0.05

export const getPanelViewportScale = (
  nativePanelSize: PanelSize,
  cssViewportSize: PanelSize,
) => {
  if (
    !Number.isFinite(nativePanelSize.width) ||
    !Number.isFinite(nativePanelSize.height) ||
    !Number.isFinite(cssViewportSize.width) ||
    !Number.isFinite(cssViewportSize.height) ||
    nativePanelSize.width <= 0 ||
    nativePanelSize.height <= 0 ||
    cssViewportSize.width <= 0 ||
    cssViewportSize.height <= 0
  ) return 1

  const widthScale = nativePanelSize.width / cssViewportSize.width
  const heightScale = nativePanelSize.height / cssViewportSize.height
  // Prefer the smaller axis and snap near-1 values to avoid false zoom
  // detection from outer-window border/chrome differences.
  const rawScale = clamp(Math.min(widthScale, heightScale), 0.5, 3)
  return Math.abs(rawScale - 1) <= PANEL_VIEWPORT_SCALE_SNAP_EPSILON ? 1 : rawScale
}