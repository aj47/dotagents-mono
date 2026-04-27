export type PanelSize = { width: number; height: number }

export const isPanelSize = (value: unknown): value is PanelSize =>
  !!value &&
  typeof value === "object" &&
  "width" in value &&
  "height" in value &&
  typeof (value as { width: unknown }).width === "number" &&
  typeof (value as { height: unknown }).height === "number" &&
  Number.isFinite((value as { width: number }).width) &&
  Number.isFinite((value as { height: number }).height)

export const getNativePanelResizeSize = (
  startSize: PanelSize,
  delta: PanelSize,
  minimumSize: PanelSize,
  viewportScale = 1,
) => ({
  width: Math.max(minimumSize.width, Math.round(startSize.width + delta.width * viewportScale)),
  height: Math.max(minimumSize.height, Math.round(startSize.height + delta.height * viewportScale)),
})
