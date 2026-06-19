import type { RendererHandlers } from "./renderer-handlers"
import { logApp } from "./debug"

const CONVERSATION_HISTORY_CHANGED_DEBOUNCE_MS = 250

let conversationHistoryChangedTimer: ReturnType<typeof setTimeout> | null = null

async function emitConversationHistoryChanged(): Promise<void> {
  try {
    const [{ getRendererHandlers }, { WINDOWS }] = await Promise.all([
      import("@egoist/tipc/main"),
      import("./window"),
    ])

    for (const windowId of ["main", "panel"] as const) {
      const win = WINDOWS.get(windowId)
      if (!win) continue

      try {
        getRendererHandlers<RendererHandlers>(win.webContents)
          .conversationHistoryChanged?.send()
      } catch {
        // Renderer may not be ready or may have been destroyed during shutdown.
      }
    }
  } catch (error) {
    logApp("[ConversationService] Failed to notify renderer of conversation history change:", error)
  }
}

export function scheduleConversationHistoryChanged(): void {
  if (conversationHistoryChangedTimer) {
    clearTimeout(conversationHistoryChangedTimer)
  }

  conversationHistoryChangedTimer = setTimeout(() => {
    conversationHistoryChangedTimer = null
    void emitConversationHistoryChanged()
  }, CONVERSATION_HISTORY_CHANGED_DEBOUNCE_MS)
}
