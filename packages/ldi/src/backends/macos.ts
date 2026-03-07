/**
 * macOS backend for LDI
 *
 * Uses Chrome in --app mode with AppleScript (osascript) for window
 * management. Pure TypeScript — no bash script or native compilation.
 *
 * Window management:
 * - Screen resolution detected via osascript or system_profiler
 * - Window positioned and sized via AppleScript System Events
 * - Process lifecycle managed directly through Node.js child_process
 * - State files (PID, metadata) stored in ~/.local/state/ldi/
 *
 * Note: macOS does not support true desktop-level window layers from
 * outside the owning process. The backdrop window is positioned and
 * sized to fill the screen but relies on the user or a watchdog to
 * keep it behind other windows.
 */

import { spawn, execFile } from "child_process"
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  readdirSync,
  openSync,
  closeSync,
} from "fs"
import { join } from "path"
import { homedir } from "os"
import type {
  LdiBackend,
  LdiStartOptions,
  LdiStartResult,
  LdiStopResult,
  LdiSlotStatus,
  LdiSlotInfo,
  LdiPlatformCheck,
} from "../types"
import { DEFAULT_SLOT, MACOS_BROWSER_PATHS, EXEC_TIMEOUT_DEFAULT } from "../constants"

function getLdiDir(): string {
  return process.env.LDI_DIR ?? join(homedir(), ".local", "state", "ldi")
}

function slotDir(): string {
  return join(getLdiDir(), "slots")
}

function slotPidFile(slot: string): string {
  return join(slotDir(), `${slot}.pid`)
}

function slotMetaFile(slot: string): string {
  return join(slotDir(), `${slot}.meta`)
}

function slotLogFile(slot: string): string {
  return join(slotDir(), `${slot}.log`)
}

function slotDataDir(slot: string): string {
  return join(getLdiDir(), "chrome-data", slot)
}

function execAsync(cmd: string, args: string[], timeout = EXEC_TIMEOUT_DEFAULT): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message))
        return
      }
      resolve(stdout)
    })
  })
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MacOSBackend implements LdiBackend {
  readonly name = "macos"

  async checkDependencies(): Promise<LdiPlatformCheck> {
    if (process.platform !== "darwin") {
      return {
        supported: false,
        platform: process.platform,
        reason: `macOS backend requires darwin. Current platform: ${process.platform}`,
      }
    }

    const browser = this.findBrowser()
    if (!browser) {
      return {
        supported: false,
        platform: "darwin",
        reason: "No supported browser found. Install Google Chrome, Chromium, or Brave.",
        missingDeps: ["chrome/chromium (no supported browser found)"],
      }
    }

    return { supported: true, platform: "darwin" }
  }

  async start(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    const slot = options?.slot ?? DEFAULT_SLOT

    try {
      if (this.isSlotRunning(slot)) {
        await this.stop(slot)
        await sleep(1000)
      }

      const browserPath = options?.browser ?? this.findBrowser()
      if (!browserPath) {
        return { success: false, slot, error: "No supported browser found" }
      }

      const { width, height } = await this.getScreenResolution()
      const dataDir = slotDataDir(slot)

      mkdirSync(slotDir(), { recursive: true })
      mkdirSync(dataDir, { recursive: true })

      const flags = [
        `--app=${url}`,
        `--window-size=${width},${height}`,
        `--window-position=0,0`,
        `--user-data-dir=${dataDir}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-sync",
        "--disable-translate",
        "--disable-infobars",
        "--disable-session-crashed-bubble",
        "--disable-features=TranslateUI",
        "--autoplay-policy=no-user-gesture-required",
        "--hide-crash-restore-bubble",
      ]

      if (options?.chromeFlags) {
        flags.push(...options.chromeFlags)
      }

      const logFile = slotLogFile(slot)
      const logFd = openSync(logFile, "w")
      const child = spawn(browserPath, flags, {
        detached: true,
        stdio: ["ignore", logFd, logFd],
      })
      child.unref()
      closeSync(logFd)

      const pid = child.pid
      if (!pid) {
        return { success: false, slot, error: "Failed to get browser PID" }
      }

      writeFileSync(slotPidFile(slot), String(pid))
      writeFileSync(
        slotMetaFile(slot),
        JSON.stringify(
          {
            slot,
            url,
            browser: browserPath,
            pid,
            resolution: `${width}x${height}`,
            started: new Date().toISOString(),
          },
          null,
          2,
        ),
      )

      // Wait for the window to appear
      const settleTime = (options?.settle ?? 4) * 1000
      await sleep(settleTime)

      // Position the window via AppleScript
      await this.positionWindow(pid, width, height)

      return { success: true, slot, pid }
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

    try {
      const pidFile = slotPidFile(targetSlot)
      if (existsSync(pidFile)) {
        const pid = parseInt(readFileSync(pidFile, "utf-8").trim(), 10)
        if (pid && isProcessRunning(pid)) {
          process.kill(pid, "SIGTERM")
          await sleep(1000)
          if (isProcessRunning(pid)) {
            process.kill(pid, "SIGKILL")
          }
        }
        try {
          unlinkSync(pidFile)
        } catch {
          // best-effort cleanup
        }
      }

      const metaFile = slotMetaFile(targetSlot)
      if (existsSync(metaFile)) {
        try {
          unlinkSync(metaFile)
        } catch {
          // best-effort cleanup
        }
      }

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

    if (!this.isSlotRunning(targetSlot)) {
      return { slot: targetSlot, running: false }
    }

    const pid = this.readPid(targetSlot)
    const meta = this.readMeta(targetSlot)

    return {
      slot: targetSlot,
      running: true,
      pid: pid ?? undefined,
      url: meta?.url,
    }
  }

  async list(): Promise<LdiSlotInfo[]> {
    const dir = slotDir()
    if (!existsSync(dir)) return []

    const slots: LdiSlotInfo[] = []
    const seen = new Set<string>()

    for (const file of readdirSync(dir)) {
      const match = file.match(/^(.+)\.(pid|meta)$/)
      if (!match) continue

      const slotName = match[1]
      if (seen.has(slotName)) continue
      seen.add(slotName)

      const running = this.isSlotRunning(slotName)
      const meta = this.readMeta(slotName)

      slots.push({
        slot: slotName,
        status: running ? "running" : "stopped",
        url: meta?.url,
      })
    }

    return slots
  }

  async restart(url: string, options?: LdiStartOptions): Promise<LdiStartResult> {
    await this.stop(options?.slot)
    await sleep(1000)
    return this.start(url, options)
  }

  // --- Private helpers ---

  private findBrowser(): string | null {
    for (const browserPath of MACOS_BROWSER_PATHS) {
      if (existsSync(browserPath)) {
        return browserPath
      }
    }
    return null
  }

  private async getScreenResolution(): Promise<{ width: number; height: number }> {
    // Primary: AppleScript Finder desktop bounds
    try {
      const output = await execAsync("osascript", [
        "-e",
        'tell application "Finder" to get bounds of window of desktop',
      ])
      // Returns: "0, 0, 1920, 1080"
      const parts = output.trim().split(", ")
      if (parts.length >= 4) {
        return {
          width: parseInt(parts[2], 10),
          height: parseInt(parts[3], 10),
        }
      }
    } catch {
      // Fallback below
    }

    // Fallback: system_profiler
    try {
      const output = await execAsync("system_profiler", ["SPDisplaysDataType"])
      const match = output.match(/Resolution:\s*(\d+)\s*x\s*(\d+)/)
      if (match) {
        return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) }
      }
    } catch {
      // Use default
    }

    return { width: 1920, height: 1080 }
  }

  private async positionWindow(pid: number, width: number, height: number): Promise<void> {
    const script = [
      'tell application "System Events"',
      `  set targetProcs to every process whose unix id is ${pid}`,
      "  if (count of targetProcs) > 0 then",
      "    tell first item of targetProcs",
      "      if (count of windows) > 0 then",
      `        set position of window 1 to {0, 0}`,
      `        set size of window 1 to {${width}, ${height}}`,
      "      end if",
      "    end tell",
      "  end if",
      "end tell",
    ].join("\n")

    try {
      await execAsync("osascript", ["-e", script])
    } catch {
      // Window positioning is best-effort — may fail if Accessibility
      // permissions haven't been granted for the calling process
    }
  }

  private isSlotRunning(slot: string): boolean {
    const pid = this.readPid(slot)
    return pid !== null && isProcessRunning(pid)
  }

  private readPid(slot: string): number | null {
    const pidFile = slotPidFile(slot)
    if (!existsSync(pidFile)) return null
    try {
      const content = readFileSync(pidFile, "utf-8").trim()
      const pid = parseInt(content, 10)
      return isNaN(pid) ? null : pid
    } catch {
      return null
    }
  }

  private readMeta(slot: string): { url?: string; browser?: string } | null {
    const metaFile = slotMetaFile(slot)
    if (!existsSync(metaFile)) return null
    try {
      return JSON.parse(readFileSync(metaFile, "utf-8"))
    } catch {
      return null
    }
  }
}
