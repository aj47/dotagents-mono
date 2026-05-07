import { getRendererHandlers } from "@egoist/tipc/main"
import { diagnosticsService } from "./diagnostics"
import type { RendererHandlers } from "@shared/renderer-handlers"
import { WINDOWS } from "./window"

// Track webContents IDs that already have a pending did-finish-load notification queued,
// to avoid registering multiple once-listeners if notifyConversationHistoryChanged() is
// called several times while a window is still loading.
const pendingNotificationWebContentsIds = new Set<number>()

/**
 * Notify all renderer windows that conversation history has changed.
 * Used after remote server creates or modifies conversations (e.g. from mobile).
 * Defers the notification if the window's renderer is still loading to avoid dropped events.
 * Uses pendingNotificationWebContentsIds to deduplicate deferred listeners.
 */
export function notifyConversationHistoryChanged(): void {
  const notifiedWebContentsIds = new Set<number>()
  for (const windowId of ["main", "panel"] as const) {
    const win = WINDOWS.get(windowId)
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
      continue
    }
    if (notifiedWebContentsIds.has(win.webContents.id)) {
      continue
    }

    notifiedWebContentsIds.add(win.webContents.id)
    const sendNotification = () => {
      pendingNotificationWebContentsIds.delete(win.webContents.id)
      try {
        getRendererHandlers<RendererHandlers>(win.webContents).conversationHistoryChanged?.send()
      } catch (err) {
        diagnosticsService.logWarning("remote-server", `Failed to notify ${windowId} window about conversation history changes: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (win.webContents.isLoading()) {
      // Only register a did-finish-load listener if one isn't already pending for this webContents,
      // to avoid listener buildup when called multiple times during window load.
      if (!pendingNotificationWebContentsIds.has(win.webContents.id)) {
        pendingNotificationWebContentsIds.add(win.webContents.id)
        win.webContents.once("did-finish-load", sendNotification)
        // If the window is destroyed before it finishes loading, clean up to prevent
        // the webContents ID from being permanently retained in the pending set.
        win.webContents.once("destroyed", () => {
          pendingNotificationWebContentsIds.delete(win.webContents.id)
        })
      }
    } else {
      sendNotification()
    }
  }
}
