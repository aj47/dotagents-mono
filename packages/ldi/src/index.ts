/**
 * @dotagents/ldi
 *
 * Live Desktop Integrator — render any URL as a desktop background layer.
 * Cross-platform architecture with pluggable backends.
 *
 * Currently supported: Linux/X11
 * Planned: macOS, Windows
 */

export { LdiClient } from "./ldi-client"
export { checkPlatform } from "./platform"
export { createBackend, LinuxX11Backend } from "./backends"
export {
  getScriptPath,
  DEFAULT_SLOT,
  SUPPORTED_BROWSERS,
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
