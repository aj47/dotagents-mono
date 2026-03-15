import type { BrowserWindow } from "electron"
import { getRendererHandlers } from "@egoist/tipc/main"
import type { RendererHandlers } from "../renderer-handlers"
import type { ProgressEmitter } from "@dotagents/core"
import type { AgentProgressUpdate } from "@dotagents/shared"

// Lazy reference to WINDOWS — avoids circular imports at module load time.
// The WINDOWS map is set externally via setWindowsMap().
let _windowsMap: Map<string, BrowserWindow> | null = null

export function setProgressEmitterWindowsMap(map: Map<string, BrowserWindow>): void {
  _windowsMap = map
}

/**
 * Broadcast a renderer handler call to all open BrowserWindows.
 */
function broadcastToWindows(
  fn: (handlers: ReturnType<typeof getRendererHandlers<RendererHandlers>>) => void,
): void {
  if (!_windowsMap) return
  for (const win of _windowsMap.values()) {
    if (win.isDestroyed()) continue
    try {
      const handlers = getRendererHandlers<RendererHandlers>(win.webContents)
      fn(handlers)
    } catch {
      // Silently ignore — window may have been destroyed between check and send
    }
  }
}

/**
 * Electron-specific ProgressEmitter implementation.
 * Broadcasts agent progress, session updates, and queue updates
 * to all renderer BrowserWindows via tipc.
 */
export class ElectronProgressEmitter implements ProgressEmitter {
  emitAgentProgress(update: AgentProgressUpdate): void {
    broadcastToWindows((handlers) => {
      handlers.agentProgressUpdate.send(update)
    })
  }

  emitSessionUpdate(data: {
    activeSessions: unknown[]
    recentSessions: unknown[]
  }): void {
    broadcastToWindows((handlers) => {
      handlers.agentSessionsUpdated.send(data as any)
    })
  }

  emitQueueUpdate(data: {
    conversationId: string
    queue: unknown[]
    isPaused: boolean
  }): void {
    broadcastToWindows((handlers) => {
      handlers.onMessageQueueUpdate.send(data as any)
    })
  }

  emitEvent(channel: string, data: unknown): void {
    broadcastToWindows((handlers) => {
      // Map well-known channels to specific renderer handlers
      if (channel === "skillsFolderChanged") {
        handlers.skillsFolderChanged.send()
      } else if (channel === "transcriptionPreviewUpdate") {
        handlers.transcriptionPreviewUpdate.send(data as any)
      } else if (channel === "clearAgentProgress") {
        handlers.clearAgentProgress.send()
      }
      // Unknown channels are silently dropped (no-op)
    })
  }

  emitConversationHistoryChanged(): void {
    broadcastToWindows((handlers) => {
      handlers.conversationHistoryChanged.send()
    })
  }
}
