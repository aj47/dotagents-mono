/**
 * Linux/X11 backend for LDI
 *
 * Wraps the bundled bash script that uses wmctrl, xprop, and Chrome
 * to render URLs as desktop background windows.
 */

import { execFile } from "child_process"
import type {
  LdiBackend,
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "../types"
import {
  DEFAULT_SLOT,
  EXEC_TIMEOUT_START,
  EXEC_TIMEOUT_DEFAULT,
  REQUIRED_LINUX_DEPS,
  SUPPORTED_BROWSERS,
  getScriptPath,
} from "../constants"

function which(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("which", [binary], (error) => {
      resolve(!error)
    })
  })
}

export class LinuxX11Backend implements LdiBackend {
  readonly name = "linux-x11"
  private scriptPath: string

  constructor(options?: { scriptPath?: string }) {
    this.scriptPath = options?.scriptPath ?? getScriptPath()
  }

  async checkDependencies(): Promise<LdiPlatformCheck> {
    if (process.platform !== "linux") {
      return {
        supported: false,
        platform: process.platform,
        reason: `Linux/X11 backend requires Linux. Current platform: ${process.platform}`,
      }
    }

    if (!process.env.DISPLAY) {
      return {
        supported: false,
        platform: process.platform,
        reason: "No X11 display found ($DISPLAY is not set)",
      }
    }

    const missingDeps: string[] = []

    for (const dep of REQUIRED_LINUX_DEPS) {
      const found = await which(dep)
      if (!found) {
        missingDeps.push(dep)
      }
    }

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
        platform: process.platform,
        reason: `Missing dependencies: ${missingDeps.join(", ")}`,
        missingDeps,
      }
    }

    return { supported: true, platform: process.platform }
  }

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

  async list(): Promise<LdiSlotInfo[]> {
    const args = ["list"]

    try {
      const stdout = await this.exec(args)
      return this.parseSlotList(stdout)
    } catch {
      return []
    }
  }

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
