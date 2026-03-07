/**
 * @dotagents/ldi — Constants and defaults
 */

import { resolve } from "path"

export const DEFAULT_SLOT = "default"
export const DEFAULT_SETTLE_TIME = 4
export const DEFAULT_RELOWER_INTERVAL = 0
export const EXEC_TIMEOUT_START = 60_000
export const EXEC_TIMEOUT_DEFAULT = 10_000

/** Linux browser binary names (resolved via `which`) */
export const SUPPORTED_BROWSERS = [
  "google-chrome",
  "chromium-browser",
  "chromium",
  "brave-browser",
] as const

/** macOS browser paths (resolved via `existsSync`) */
export const MACOS_BROWSER_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
] as const

/** Windows browser paths (with %env% placeholders expanded at runtime) */
export const WINDOWS_BROWSER_PATHS = [
  "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe",
  "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe",
  "%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe",
  "%ProgramFiles%\\Chromium\\Application\\chrome.exe",
  "%LOCALAPPDATA%\\Chromium\\Application\\chrome.exe",
  "%ProgramFiles%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
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
