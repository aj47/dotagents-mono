import { app } from "electron"
import type { DesktopShellConfig } from "../shared/types"

export function applyDesktopShellSettings(prev: DesktopShellConfig, next: DesktopShellConfig): void {
  try {
    if ((process.env.NODE_ENV === "production" || !process.env.ELECTRON_RENDERER_URL) && process.platform !== "linux") {
      app.setLoginItemSettings({
        openAtLogin: !!next.launchAtLogin,
        openAsHidden: true,
      })
    }
  } catch (_e) {
    // best-effort only
  }

  if (process.env.IS_MAC) {
    try {
      const prevHideDock = !!prev.hideDockIcon
      const nextHideDock = !!next.hideDockIcon

      if (prevHideDock !== nextHideDock) {
        if (nextHideDock) {
          app.setActivationPolicy("accessory")
          app.dock.hide()
        } else {
          app.dock.show()
          app.setActivationPolicy("regular")
        }
      }
    } catch (_e) {
      // best-effort only
    }
  }
}
