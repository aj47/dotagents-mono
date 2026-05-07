import type { ThemePreferenceValue } from "@dotagents/shared/theme-preference"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"

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

export interface DesktopDisplayErrorRequest {
  title?: string
  message: string
}

export interface DesktopDebugFlags {
  llm: boolean
  tools: boolean
  keybinds: boolean
  app: boolean
  ui: boolean
  all: boolean
}

export const desktopAppShellClient = {
  showContextMenu(request: DesktopContextMenuRequest): Promise<void> {
    return tipcClient.showContextMenu(request) as Promise<void>
  },

  broadcastThemeChange(themeMode: ThemePreferenceValue): Promise<void> {
    return tipcClient.broadcastThemeChange?.({ themeMode }) ?? Promise.resolve()
  },

  onThemeChanged(listener: (themeMode: string) => void): () => void {
    return rendererHandlers.themeChanged.listen(listener)
  },

  onNavigate(listener: (url: string) => void): () => void {
    return rendererHandlers.navigate.listen(listener)
  },

  displayError(request: DesktopDisplayErrorRequest): Promise<void> {
    return tipcClient.displayError(request) as Promise<void>
  },

  writeClipboard(text: string): Promise<void> {
    return tipcClient.writeClipboard({ text }) as Promise<void>
  },

  getDebugFlags(): Promise<DesktopDebugFlags> {
    return tipcClient.getDebugFlags() as Promise<DesktopDebugFlags>
  },
}
