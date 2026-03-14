import { app } from "electron"
import os from "os"
import type { PathResolver } from "@dotagents/core"

/**
 * Electron-specific PathResolver implementation.
 * Maps PathResolver methods to Electron's `app.getPath()` calls.
 */
export class ElectronPathResolver implements PathResolver {
  getUserDataPath(): string {
    return app.getPath("userData")
  }

  getConfigPath(): string {
    return app.getPath("userData")
  }

  getAppDataPath(): string {
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
