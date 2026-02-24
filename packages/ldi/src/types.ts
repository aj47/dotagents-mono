/**
 * @dotagents/ldi — Type definitions
 */

export interface LdiStartOptions {
  /** Named slot (default: "default") */
  slot?: string
  /** Window settle time in seconds (default: 4) */
  settle?: number
  /** Re-lower watchdog interval in seconds (0 = off) */
  relower?: number
  /** Browser binary override */
  browser?: string
  /** X11 display (default: $DISPLAY or :1) */
  display?: string
  /** Extra Chrome flags */
  chromeFlags?: string[]
}

export interface LdiStartResult {
  success: boolean
  slot: string
  pid?: number
  windowId?: string
  error?: string
}

export interface LdiStopResult {
  success: boolean
  slot: string
  error?: string
}

export interface LdiSlotStatus {
  slot: string
  running: boolean
  pid?: number
  url?: string
  windowId?: string
}

export interface LdiSlotInfo {
  slot: string
  status: "running" | "stopped"
  url?: string
}

export interface LdiPlatformCheck {
  supported: boolean
  platform: string
  reason?: string
  missingDeps?: string[]
}
