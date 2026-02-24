/**
 * @dotagents/ldi
 *
 * Live Desktop Integrator — render any URL as a desktop background layer.
 * TypeScript wrapper around the LDI bash script for Linux/X11.
 */

export { LdiClient } from "./ldi-client"
export { checkPlatform } from "./platform"
export { getScriptPath, DEFAULT_SLOT, SUPPORTED_BROWSERS, REQUIRED_DEPS } from "./constants"
export type {
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "./types"
