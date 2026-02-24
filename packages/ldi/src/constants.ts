/**
 * @dotagents/ldi — Constants and defaults
 */

import { resolve } from "path"

export const DEFAULT_SLOT = "default"
export const DEFAULT_SETTLE_TIME = 4
export const DEFAULT_RELOWER_INTERVAL = 0
export const EXEC_TIMEOUT_START = 60_000
export const EXEC_TIMEOUT_DEFAULT = 10_000

export const SUPPORTED_BROWSERS = [
  "google-chrome",
  "chromium-browser",
  "chromium",
  "brave-browser",
] as const

/** X11 tools required by the Linux backend */
export const REQUIRED_LINUX_DEPS = ["wmctrl", "xprop", "xdpyinfo"] as const

/**
 * Resolve the path to the bundled LDI bash script.
 * Used by the Linux/X11 backend.
 */
export function getScriptPath(): string {
  return resolve(__dirname, "..", "scripts", "ldi")
}
