import { getRendererHandlers } from "@egoist/tipc/main"
import type { RendererHandlers } from "../shared/renderer-handlers"
import { logApp } from "./debug"
import { WINDOWS } from "./window"

export type StopAllTtsPlaybackResult = {
  success: true
  windowsNotified: number
  totalWindows: number
}

export function stopAllTtsPlayback(): StopAllTtsPlaybackResult {
  let windowsNotified = 0
  for (const [id, win] of WINDOWS.entries()) {
    try {
      const stopAllTtsHandler = getRendererHandlers<RendererHandlers>(win.webContents).stopAllTts
      if (!stopAllTtsHandler) continue
      stopAllTtsHandler.send()
      windowsNotified += 1
    } catch (error) {
      logApp(`[tts-playback-actions] stopAllTts send to ${id} failed:`, error)
    }
  }

  logApp("[tts-playback-actions] stopAllTts broadcast complete", {
    windowsNotified,
    totalWindows: WINDOWS.size,
  })

  return { success: true, windowsNotified, totalWindows: WINDOWS.size }
}
