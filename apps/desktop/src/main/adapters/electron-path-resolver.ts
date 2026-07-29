import { app } from "electron"
import os from "os"
import type { PathResolver } from "@dotagents/core"

/**
 * Electron-specific PathResolver implementation.
 * Maps PathResolver methods to Electron's `app.getPath()` calls.
 */
export class ElectronPathResolver implements PathResolver {
  getUserDataPath(): string {
    if (process.env.DOTAGENTS_USER_DATA_DIR?.trim()) {
      return process.env.DOTAGENTS_USER_DATA_DIR.trim()
    }
    return app.getPath("userData")
  }

  getConfigPath(): string {
    if (process.env.DOTAGENTS_USER_DATA_DIR?.trim()) {
      return process.env.DOTAGENTS_USER_DATA_DIR.trim()
    }
    return app.getPath("userData")
  }

  getAppDataPath(): string {
    if (process.env.DOTAGENTS_APP_DATA_DIR?.trim()) {
      return process.env.DOTAGENTS_APP_DATA_DIR.trim()
    }
    return app.getPath("appData")
  }

  getTempPath(): string {
    return app.getPath("temp")
  }

  getHomePath(): string {
    return os.homedir()
  }

  getDesktopPath(): string {
    return app.getPath("desktop")
  }

  getDownloadsPath(): string {
    return app.getPath("downloads")
  }

  getLogsPath(): string {
    return app.getPath("logs")
  }
}
