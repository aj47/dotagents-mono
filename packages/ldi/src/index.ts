/**
 * @dotagents/ldi
 *
 * Live Desktop Integrator — render any URL as a desktop background layer.
 * Cross-platform architecture with pluggable backends.
 *
 * Supported: Linux/X11, macOS
 * Planned: Windows
 */

export { LdiClient } from "./ldi-client"
export { checkPlatform } from "./platform"
export { createBackend, LinuxX11Backend, MacOSBackend } from "./backends"
export {
  getScriptPath,
  DEFAULT_SLOT,
  SUPPORTED_BROWSERS,
  MACOS_BROWSER_PATHS,
  REQUIRED_LINUX_DEPS,
} from "./constants"
export type {
  LdiBackend,
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "./types"
