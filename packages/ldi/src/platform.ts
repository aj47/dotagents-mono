/**
 * @dotagents/ldi — Platform and dependency detection
 */

import { execFile } from "child_process"
import type { LdiPlatformCheck } from "./types"
import { REQUIRED_DEPS, SUPPORTED_BROWSERS } from "./constants"

function which(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("which", [binary], (error) => {
      resolve(!error)
    })
  })
}

/**
 * Check whether the current platform supports LDI.
 * Returns a detailed result with missing dependencies if any.
 */
export async function checkPlatform(): Promise<LdiPlatformCheck> {
  const platform = process.platform

  if (platform !== "linux") {
    return {
      supported: false,
      platform,
      reason: `LDI requires Linux with X11. Current platform: ${platform}`,
    }
  }

  if (!process.env.DISPLAY) {
    return {
      supported: false,
      platform,
      reason: "No X11 display found ($DISPLAY is not set)",
    }
  }

  const missingDeps: string[] = []

  // Check required X11 tools
  for (const dep of REQUIRED_DEPS) {
    const found = await which(dep)
    if (!found) {
      missingDeps.push(dep)
    }
  }

  // Check for at least one supported browser
  let hasBrowser = false
  for (const browser of SUPPORTED_BROWSERS) {
    const found = await which(browser)
    if (found) {
      hasBrowser = true
      break
    }
  }

  if (!hasBrowser) {
    missingDeps.push("chrome/chromium (no supported browser found)")
  }

  if (missingDeps.length > 0) {
    return {
      supported: false,
      platform,
      reason: `Missing dependencies: ${missingDeps.join(", ")}`,
      missingDeps,
    }
  }

  return { supported: true, platform }
}
