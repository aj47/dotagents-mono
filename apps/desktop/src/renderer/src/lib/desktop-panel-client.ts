import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopPanelFocusableRequest {
  focusable: boolean
  andFocus?: boolean
}

export interface DesktopPanelVisibility {
  visible: boolean
}

export const desktopPanelClient = {
  setPanelFocusable(request: DesktopPanelFocusableRequest): Promise<void> {
    return tipcClient.setPanelFocusable(request) as Promise<void>
  },

  getFloatingPanelVisibility(): Promise<DesktopPanelVisibility> {
    return tipcClient.getFloatingPanelVisibility() as Promise<DesktopPanelVisibility>
  },
}
