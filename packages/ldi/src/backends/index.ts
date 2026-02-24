/**
 * Backend factory — auto-selects the appropriate LDI backend
 * based on the current platform.
 *
 * Supported:
 * - Linux/X11: LinuxX11Backend (uses bundled bash script)
 * - macOS: MacOSBackend (uses osascript + Chrome --app mode)
 *
 * Planned:
 * - Windows: WindowsBackend (PR #3)
 */

import type { LdiBackend } from "../types"
import { LinuxX11Backend } from "./linux-x11"
import { MacOSBackend } from "./macos"

export interface BackendOptions {
  scriptPath?: string
}

/**
 * Create the appropriate backend for the current platform.
 * Returns null if no backend is available.
 */
export function createBackend(options?: BackendOptions): LdiBackend | null {
  switch (process.platform) {
    case "linux":
      if (process.env.DISPLAY) {
        return new LinuxX11Backend({ scriptPath: options?.scriptPath })
      }
      return null

    case "darwin":
      return new MacOSBackend()

    // case "win32":
    //   return new WindowsBackend()  // PR #3

    default:
      return null
  }
}

export { LinuxX11Backend }
export { MacOSBackend }
