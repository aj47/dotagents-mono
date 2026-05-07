import type { ThemePreferenceValue } from "@dotagents/shared/theme-preference"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopContextMenuRequest {
  x: number
  y: number
  selectedText?: string
  messageContext?: {
    content: string
    role: "user" | "assistant" | "tool"
    messageId: string
  }
}

export const desktopAppShellClient = {
  showContextMenu(request: DesktopContextMenuRequest): Promise<void> {
    return tipcClient.showContextMenu(request) as Promise<void>
  },

  broadcastThemeChange(themeMode: ThemePreferenceValue): Promise<void> {
    return tipcClient.broadcastThemeChange?.({ themeMode }) ?? Promise.resolve()
  },
}
