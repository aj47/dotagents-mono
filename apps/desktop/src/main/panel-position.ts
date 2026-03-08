import { screen } from "electron"
import { configStore } from "./config"

export type PanelPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "custom"

export interface PanelSize {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export interface PanelBounds extends PanelSize, Position {}

export type PanelResizeAnchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right"

const PANEL_MARGIN = 10

function isLeftAnchoredPanelResize(anchor: PanelResizeAnchor | null | undefined): boolean {
  return anchor === "left" || anchor === "top-left" || anchor === "bottom-left"
}

function isTopAnchoredPanelResize(anchor: PanelResizeAnchor | null | undefined): boolean {
  return anchor === "top" || anchor === "top-left" || anchor === "top-right"
}

export function calculateAnchoredPanelPosition({
  currentBounds,
  nextSize,
  resizeAnchor,
}: {
  currentBounds: PanelBounds
  nextSize: PanelSize
  resizeAnchor?: PanelResizeAnchor | null
}): Position {
  return {
    x: isLeftAnchoredPanelResize(resizeAnchor)
      ? currentBounds.x + currentBounds.width - nextSize.width
      : currentBounds.x,
    y: isTopAnchoredPanelResize(resizeAnchor)
      ? currentBounds.y + currentBounds.height - nextSize.height
      : currentBounds.y,
  }
}

export function calculatePanelPosition(
  size: PanelSize,
  _mode: "normal" | "agent" | "textInput" = "normal",
): Position {
  const config = configStore.get()
  const position = config.panelPosition || "top-right"

  if (position === "custom" && config.panelCustomPosition) {
    return config.panelCustomPosition
  }

  const currentScreen = screen.getDisplayNearestPoint(
    screen.getCursorScreenPoint(),
  )
  const screenSize = currentScreen.workArea

  return calculatePositionForPreset(position, screenSize, size)
}

export function calculatePositionForPreset(
  position: PanelPosition,
  screenSize: { x: number; y: number; width: number; height: number },
  size: PanelSize,
): Position {
  const margin = PANEL_MARGIN

  switch (position) {
    case "top-left":
      return {
        x: screenSize.x + margin,
        y: screenSize.y + margin,
      }

    case "top-center":
      return {
        x: Math.floor(screenSize.x + (screenSize.width - size.width) / 2),
        y: screenSize.y + margin,
      }

    case "top-right":
      return {
        x: Math.floor(screenSize.x + (screenSize.width - size.width) - margin),
        y: screenSize.y + margin,
      }

    case "bottom-left":
      return {
        x: screenSize.x + margin,
        y: Math.floor(
          screenSize.y + (screenSize.height - size.height) - margin,
        ),
      }

    case "bottom-center":
      return {
        x: Math.floor(screenSize.x + (screenSize.width - size.width) / 2),
        y: Math.floor(
          screenSize.y + (screenSize.height - size.height) - margin,
        ),
      }

    case "bottom-right":
      return {
        x: Math.floor(screenSize.x + (screenSize.width - size.width) - margin),
        y: Math.floor(
          screenSize.y + (screenSize.height - size.height) - margin,
        ),
      }

    case "custom":
    default:
      return {
        x: Math.floor(screenSize.x + (screenSize.width - size.width) - margin),
        y: screenSize.y + margin,
      }
  }
}

export function saveCustomPosition(position: Position): void {
  const config = configStore.get()
  configStore.save({
    ...config,
    panelPosition: "custom",
    panelCustomPosition: position,
  })
}

export function updatePanelPosition(position: PanelPosition): void {
  const config = configStore.get()
  configStore.save({
    ...config,
    panelPosition: position,
  })
}

export function constrainPositionToScreen(
  position: Position,
  size: PanelSize,
  screenSize?: { x: number; y: number; width: number; height: number },
): Position {
  if (!screenSize) {
    const currentScreen = screen.getDisplayNearestPoint(
      screen.getCursorScreenPoint(),
    )
    screenSize = currentScreen.workArea
  }

  const constrainedPosition = { ...position }

  constrainedPosition.x = Math.max(
    screenSize.x,
    Math.min(
      constrainedPosition.x,
      screenSize.x + screenSize.width - size.width,
    ),
  )

  constrainedPosition.y = Math.max(
    screenSize.y,
    Math.min(
      constrainedPosition.y,
      screenSize.y + screenSize.height - size.height,
    ),
  )

  return constrainedPosition
}
