/**
 * @dotagents/ldi — Type definitions
 *
 * Cross-platform types for the Live Desktop Integrator.
 * Platform-specific backends implement the LdiBackend interface.
 */

export interface LdiStartOptions {
  /** Named slot (default: "default") */
  slot?: string
  /** Window settle time in seconds (default: 4) */
  settle?: number
  /** Re-lower watchdog interval in seconds (0 = off, Linux only) */
  relower?: number
  /** Browser binary override */
  browser?: string
  /** X11 display (Linux only, default: $DISPLAY or :1) */
  display?: string
  /** Extra Chrome/browser flags */
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

/**
 * Backend interface for platform-specific LDI implementations.
 *
 * Each platform (Linux/X11, macOS, Windows) provides its own backend
 * that implements this interface. The LdiClient auto-selects the
 * appropriate backend based on the current platform.
 */
export interface LdiBackend {
  /** Platform identifier (e.g. "linux-x11", "macos", "windows") */
  readonly name: string

  /** Check if this backend's dependencies are available */
  checkDependencies(): Promise<LdiPlatformCheck>

  /** Start a URL as a desktop background layer */
  start(url: string, options?: LdiStartOptions): Promise<LdiStartResult>

  /** Stop a running backdrop */
  stop(slot?: string): Promise<LdiStopResult>

  /** Get status of a slot */
  status(slot?: string): Promise<LdiSlotStatus>

  /** List all configured slots */
  list(): Promise<LdiSlotInfo[]>

  /** Stop and restart a backdrop */
  restart(url: string, options?: LdiStartOptions): Promise<LdiStartResult>
}
