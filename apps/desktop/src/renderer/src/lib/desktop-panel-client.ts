import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopPanelFocusableRequest {
  focusable: boolean
  andFocus?: boolean
}

export const desktopPanelClient = {
  setPanelFocusable(request: DesktopPanelFocusableRequest): Promise<void> {
    return tipcClient.setPanelFocusable(request) as Promise<void>
  },
}
