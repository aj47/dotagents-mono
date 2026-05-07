import type { PanelPoint, PanelSize } from "@dotagents/shared/api-types"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopPanelFocusableRequest {
  focusable: boolean
  andFocus?: boolean
}

export interface DesktopPanelVisibility {
  visible: boolean
}

export type DesktopPanelMode = "normal" | "agent" | "textInput"

export interface DesktopPanelModeSizeRequest extends PanelSize {
  mode: DesktopPanelMode
}

export const desktopPanelClient = {
  setPanelFocusable(request: DesktopPanelFocusableRequest): Promise<void> {
    return tipcClient.setPanelFocusable(request) as Promise<void>
  },

  getFloatingPanelVisibility(): Promise<DesktopPanelVisibility> {
    return tipcClient.getFloatingPanelVisibility() as Promise<DesktopPanelVisibility>
  },

  getPanelPosition(): Promise<PanelPoint> {
    return tipcClient.getPanelPosition() as Promise<PanelPoint>
  },

  updatePanelPosition(position: PanelPoint): Promise<void> {
    return tipcClient.updatePanelPosition(position) as Promise<void>
  },

  savePanelCustomPosition(position: PanelPoint): Promise<void> {
    return tipcClient.savePanelCustomPosition(position) as Promise<void>
  },

  getPanelSize(): Promise<PanelSize> {
    return tipcClient.getPanelSize() as Promise<PanelSize>
  },

  setPanelMode(mode: DesktopPanelMode): Promise<void> {
    return tipcClient.setPanelMode({ mode }) as Promise<void>
  },

  resizePanelForWaveformPreview(showPreview: boolean): Promise<void> {
    return tipcClient.resizePanelForWaveformPreview({ showPreview }) as Promise<void>
  },

  updatePanelSize(size: PanelSize): Promise<PanelSize> {
    return tipcClient.updatePanelSize(size) as Promise<PanelSize>
  },

  savePanelCustomSize(size: PanelSize): Promise<PanelSize> {
    return tipcClient.savePanelCustomSize(size) as Promise<PanelSize>
  },

  getPanelMode(): Promise<string> {
    return tipcClient.getPanelMode() as Promise<string>
  },

  savePanelModeSize(
    request: DesktopPanelModeSizeRequest,
  ): Promise<{ mode: DesktopPanelMode; size: PanelSize }> {
    return tipcClient.savePanelModeSize(request) as Promise<{
      mode: DesktopPanelMode
      size: PanelSize
    }>
  },
}
