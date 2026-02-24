/**
 * @dotagents/ldi — LDI Client
 *
 * Cross-platform facade for managing desktop background layers.
 * Auto-selects the appropriate platform backend, or accepts a
 * custom backend via constructor.
 */

import { access, constants } from "fs/promises"
import type {
  LdiBackend,
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "./types"
import { DEFAULT_SLOT, getScriptPath } from "./constants"
import { createBackend } from "./backends"

export class LdiClient {
  private backend: LdiBackend | null

  constructor(options?: { backend?: LdiBackend; scriptPath?: string }) {
    this.backend = options?.backend ?? createBackend({ scriptPath: options?.scriptPath })
  }

  /**
   * Check if the current platform supports LDI.
   */
  async checkPlatform(): Promise<LdiPlatformCheck> {
    if (!this.backend) {
      return {
        supported: false,
        platform: process.platform,
        reason: `No LDI backend available for ${process.platform}`,
      }
    }
    return this.backend.checkDependencies()
  }

  /**
   * Verify the bundled script exists and is executable (Linux backend).
   */
  async verifyScript(): Promise<boolean> {
    try {
      await access(getScriptPath(), constants.X_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the active backend name, or null if unsupported.
   */
  get backendName(): string | null {
    return this.backend?.name ?? null
  }

  /**
   * Start a URL as a desktop background layer.
   */
  async start(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    if (!this.backend) {
      return {
        success: false,
        slot: options?.slot ?? DEFAULT_SLOT,
        error: `No LDI backend available for ${process.platform}`,
      }
    }
    return this.backend.start(url, options)
  }

  /**
   * Stop a running backdrop.
   */
  async stop(slot?: string): Promise<LdiStopResult> {
    if (!this.backend) {
      return {
        success: false,
        slot: slot ?? DEFAULT_SLOT,
        error: `No LDI backend available for ${process.platform}`,
      }
    }
    return this.backend.stop(slot)
  }

  /**
   * Get the status of a slot.
   */
  async status(slot?: string): Promise<LdiSlotStatus> {
    if (!this.backend) {
      return { slot: slot ?? DEFAULT_SLOT, running: false }
    }
    return this.backend.status(slot)
  }

  /**
   * List all configured slots.
   */
  async list(): Promise<LdiSlotInfo[]> {
    if (!this.backend) {
      return []
    }
    return this.backend.list()
  }

  /**
   * Restart a backdrop (stop + start).
   */
  async restart(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    if (!this.backend) {
      return {
        success: false,
        slot: options?.slot ?? DEFAULT_SLOT,
        error: `No LDI backend available for ${process.platform}`,
      }
    }
    return this.backend.restart(url, options)
  }
}
