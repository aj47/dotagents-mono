/**
 * LDI Service — Desktop integration for Live Desktop Integrator
 *
 * Singleton service that manages LDI backdrops from the main process.
 * Gracefully no-ops on unsupported platforms (macOS, Windows).
 */

import { LdiClient } from "@dotagents/ldi"
import type {
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "@dotagents/ldi"
import { logApp } from "./debug"

class LdiService {
  private static instance: LdiService | null = null

  static getInstance(): LdiService {
    if (!LdiService.instance) {
      LdiService.instance = new LdiService()
    }
    return LdiService.instance
  }

  private client: LdiClient
  private initialized = false
  private platformCheck: LdiPlatformCheck | null = null

  private constructor() {
    this.client = new LdiClient()
  }

  /**
   * Initialize the service: check platform and log readiness.
   * Idempotent — safe to call multiple times.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.platformCheck = await this.client.checkPlatform()

    if (this.platformCheck.supported) {
      const scriptOk = await this.client.verifyScript()
      if (scriptOk) {
        logApp("[LDI] Service initialized — platform supported, script verified")
      } else {
        logApp("[LDI] Service initialized — platform supported, but script not found")
        this.platformCheck = {
          ...this.platformCheck,
          supported: false,
          reason: "Bundled LDI script not found or not executable",
        }
      }
    } else {
      logApp(`[LDI] Service initialized — not supported: ${this.platformCheck.reason}`)
    }

    this.initialized = true
  }

  /**
   * Check if LDI is supported on this platform.
   */
  isSupported(): LdiPlatformCheck {
    return this.platformCheck ?? {
      supported: false,
      platform: process.platform,
      reason: "Service not yet initialized",
    }
  }

  /**
   * Start a URL as a desktop background layer.
   */
  async startBackdrop(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    await this.initialize()
    if (!this.platformCheck?.supported) {
      return {
        success: false,
        slot: options?.slot ?? "default",
        error: this.platformCheck?.reason ?? "Platform not supported",
      }
    }

    logApp(`[LDI] Starting backdrop: ${url} (slot: ${options?.slot ?? "default"})`)
    const result = await this.client.start(url, options)

    if (result.success) {
      logApp(`[LDI] Backdrop started — slot: ${result.slot}, PID: ${result.pid}`)
    } else {
      logApp(`[LDI] Failed to start backdrop: ${result.error}`)
    }

    return result
  }

  /**
   * Stop a running backdrop.
   */
  async stopBackdrop(slot?: string): Promise<LdiStopResult> {
    await this.initialize()
    if (!this.platformCheck?.supported) {
      return {
        success: false,
        slot: slot ?? "default",
        error: this.platformCheck?.reason ?? "Platform not supported",
      }
    }

    logApp(`[LDI] Stopping backdrop (slot: ${slot ?? "default"})`)
    return this.client.stop(slot)
  }

  /**
   * Get the status of a backdrop slot.
   */
  async getStatus(slot?: string): Promise<LdiSlotStatus> {
    await this.initialize()
    if (!this.platformCheck?.supported) {
      return { slot: slot ?? "default", running: false }
    }

    return this.client.status(slot)
  }

  /**
   * List all backdrop slots.
   */
  async listBackdrops(): Promise<LdiSlotInfo[]> {
    await this.initialize()
    if (!this.platformCheck?.supported) {
      return []
    }

    return this.client.list()
  }

  /**
   * Restart a backdrop (stop + start).
   */
  async restartBackdrop(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    await this.initialize()
    if (!this.platformCheck?.supported) {
      return {
        success: false,
        slot: options?.slot ?? "default",
        error: this.platformCheck?.reason ?? "Platform not supported",
      }
    }

    logApp(`[LDI] Restarting backdrop: ${url} (slot: ${options?.slot ?? "default"})`)
    return this.client.restart(url, options)
  }
}

export const ldiService = LdiService.getInstance()
