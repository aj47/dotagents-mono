import { app } from "electron"
import type { BrowserWindow } from "electron"
import { configStore } from "./config"
import { logApp } from "./debug"

export function ensureAppSwitcherPresence(reason: string): void {
  if (!process.env.IS_MAC) return

  try {
    const cfg = configStore.get()
    if (cfg.hideDockIcon === true) return

    app.setActivationPolicy("regular")
    if (!app.dock?.isVisible?.()) {
      app.dock?.show()
    }
  } catch (error) {
    logApp(`[${reason}] Failed to ensure app switcher visibility:`, error)
  }
}

export function showAndFocusMainWindow(
  win: Pick<BrowserWindow, "isMinimized" | "restore" | "show" | "focus">,
  reason: string,
): void {
  ensureAppSwitcherPresence(reason)

  try {
    if (process.env.IS_MAC) {
      app.show()
    }
  } catch (error) {
    logApp(`[${reason}] Failed to show app before focusing main window:`, error)
  }

  try {
    if (win.isMinimized()) {
      win.restore()
    }
  } catch (error) {
    logApp(`[${reason}] Failed to restore minimized main window:`, error)
  }

  win.show()
  win.focus()
}