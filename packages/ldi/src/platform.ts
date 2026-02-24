/**
 * @dotagents/ldi — Cross-platform detection
 *
 * Determines which LDI backends are available on the current system.
 */

import type { LdiPlatformCheck } from "./types"
import { createBackend } from "./backends"

/**
 * Check whether the current platform supports LDI.
 * Creates a temporary backend to check dependencies, then discards it.
 */
export async function checkPlatform(): Promise<LdiPlatformCheck> {
  const backend = createBackend()

  if (!backend) {
    return {
      supported: false,
      platform: process.platform,
      reason: `No LDI backend available for ${process.platform}. Supported: Linux/X11 (macOS and Windows coming soon)`,
    }
  }

  return backend.checkDependencies()
}
