/**
 * @dotagents/ldi — LDI Client
 *
 * TypeScript wrapper around the LDI bash script.
 * All methods shell out to the bundled script and parse structured results.
 */

import { execFile } from "child_process"
import { access, constants } from "fs/promises"
import type {
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "./types"
import {
  DEFAULT_SLOT,
  EXEC_TIMEOUT_START,
  EXEC_TIMEOUT_DEFAULT,
  getScriptPath,
} from "./constants"
import { checkPlatform } from "./platform"

export class LdiClient {
  private scriptPath: string

  constructor(options?: { scriptPath?: string }) {
    this.scriptPath = options?.scriptPath ?? getScriptPath()
  }

  /**
   * Check if the current platform supports LDI.
   */
  async checkPlatform(): Promise<LdiPlatformCheck> {
    return checkPlatform()
  }

  /**
   * Verify the bundled script exists and is executable.
   */
  async verifyScript(): Promise<boolean> {
    try {
      await access(this.scriptPath, constants.X_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * Start a URL as a desktop background layer.
   */
  async start(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    const slot = options?.slot ?? DEFAULT_SLOT
    const args = this.buildArgs("start", url, options)

    try {
      const stdout = await this.exec(args, EXEC_TIMEOUT_START)
      const pid = this.extractPid(stdout)
      const windowId = this.extractWindowId(stdout)
      const hasError = stdout.includes("ERROR:")

      return {
        success: !hasError,
        slot,
        pid,
        windowId,
        error: hasError ? this.extractError(stdout) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        slot,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Stop a running backdrop.
   */
  async stop(slot?: string): Promise<LdiStopResult> {
    const targetSlot = slot ?? DEFAULT_SLOT
    const args = this.buildArgs("stop", undefined, { slot: targetSlot })

    try {
      await this.exec(args)
      return { success: true, slot: targetSlot }
    } catch (error) {
      return {
        success: false,
        slot: targetSlot,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get the status of a slot.
   */
  async status(slot?: string): Promise<LdiSlotStatus> {
    const targetSlot = slot ?? DEFAULT_SLOT
    const args = this.buildArgs("status", undefined, { slot: targetSlot })

    try {
      const stdout = await this.exec(args)
      const running = stdout.includes("Running")
      const pid = this.extractPid(stdout)
      const url = this.extractUrl(stdout)
      const windowId = this.extractWindowId(stdout)

      return { slot: targetSlot, running, pid, url, windowId }
    } catch {
      // status command exits non-zero when slot is not running
      return { slot: targetSlot, running: false }
    }
  }

  /**
   * List all configured slots.
   */
  async list(): Promise<LdiSlotInfo[]> {
    const args = ["list"]

    try {
      const stdout = await this.exec(args)
      return this.parseSlotList(stdout)
    } catch {
      return []
    }
  }

  /**
   * Restart a backdrop (stop + start).
   */
  async restart(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    const slot = options?.slot ?? DEFAULT_SLOT
    const args = this.buildArgs("restart", url, options)

    try {
      const stdout = await this.exec(args, EXEC_TIMEOUT_START)
      const pid = this.extractPid(stdout)
      const windowId = this.extractWindowId(stdout)
      const hasError = stdout.includes("ERROR:")

      return {
        success: !hasError,
        slot,
        pid,
        windowId,
        error: hasError ? this.extractError(stdout) : undefined,
      }
    } catch (error) {
      return {
        success: false,
        slot,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // --- Private helpers ---

  private buildArgs(command: string, url?: string, options?: LdiStartOptions): string[] {
    const args: string[] = [command]

    if (url) {
      args.push(url)
    }

    if (options?.slot) {
      args.push("--slot", options.slot)
    }
    if (options?.settle !== undefined) {
      args.push("--settle", String(options.settle))
    }
    if (options?.relower !== undefined) {
      args.push("--relower", String(options.relower))
    }
    if (options?.browser) {
      args.push("--browser", options.browser)
    }
    if (options?.display) {
      args.push("--display", options.display)
    }
    if (options?.chromeFlags && options.chromeFlags.length > 0) {
      args.push("--chrome-flags", options.chromeFlags.join(" "))
    }

    return args
  }

  private exec(args: string[], timeout = EXEC_TIMEOUT_DEFAULT): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        this.scriptPath,
        args,
        { timeout, env: { ...process.env } },
        (error, stdout, stderr) => {
          if (error) {
            const message = stderr.trim() || error.message
            reject(new Error(message))
            return
          }
          resolve(stdout)
        },
      )
    })
  }

  private extractPid(output: string): number | undefined {
    const match = output.match(/PID\s+(\d+)/)
    return match ? parseInt(match[1], 10) : undefined
  }

  private extractWindowId(output: string): string | undefined {
    const match = output.match(/[Ww]indow(?:\s+found)?:\s+(0x[0-9a-f]+)/i)
    return match ? match[1] : undefined
  }

  private extractUrl(output: string): string | undefined {
    const match = output.match(/URL:\s+(.+)/)
    return match ? match[1].trim() : undefined
  }

  private extractError(output: string): string {
    const match = output.match(/ERROR:\s*(.+)/)
    return match ? match[1].trim() : "Unknown error"
  }

  private parseSlotList(output: string): LdiSlotInfo[] {
    const slots: LdiSlotInfo[] = []
    const lines = output.split("\n").filter((l) => l.trim())

    for (const line of lines) {
      // Format: "  slot-name      running    http://..."
      const parts = line.trim().split(/\s{2,}/)
      if (parts.length >= 2) {
        const slot = parts[0]
        const status = parts[1] === "running" ? "running" : "stopped"
        const url = parts[2] || undefined

        // Skip non-slot lines like "No slots found"
        if (slot && !slot.startsWith("No ")) {
          slots.push({ slot, status, url })
        }
      }
    }

    return slots
  }
}
