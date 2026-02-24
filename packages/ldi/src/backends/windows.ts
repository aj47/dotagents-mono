/**
 * Windows backend for LDI
 *
 * Uses Chrome in --app mode with PowerShell for screen resolution
 * detection and window management. Pure TypeScript — no native
 * compilation required.
 *
 * Window management:
 * - Screen resolution detected via PowerShell (System.Windows.Forms)
 * - Chrome launched with --window-position and --window-size flags
 * - Window repositioned at runtime via PowerShell (user32.dll SetWindowPos)
 * - Process lifecycle managed via Node.js child_process + taskkill
 * - State files (PID, metadata) stored in %LOCALAPPDATA%\ldi\ or ~/.local/state/ldi/
 *
 * Note: Windows does not expose a public desktop-layer API for
 * third-party windows. The backdrop window is positioned and sized
 * to fill the screen and sent behind other windows via SetWindowPos
 * with HWND_BOTTOM.
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
import { DEFAULT_SLOT, WINDOWS_BROWSER_PATHS, EXEC_TIMEOUT_DEFAULT } from "../constants"

function getLdiDir(): string {
  if (process.env.LDI_DIR) return process.env.LDI_DIR
  // Prefer %LOCALAPPDATA%\ldi on Windows
  const localAppData = process.env.LOCALAPPDATA
  if (localAppData) return join(localAppData, "ldi")
  return join(homedir(), ".local", "state", "ldi")
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

function powershell(script: string, timeout = EXEC_TIMEOUT_DEFAULT): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message))
          return
        }
        resolve(stdout.trim())
      },
    )
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

/**
 * Force-kill a process via taskkill. Used as a fallback when
 * the graceful SIGTERM doesn't terminate the process.
 */
function taskkill(pid: number): Promise<void> {
  return new Promise((resolve) => {
    execFile("taskkill", ["/F", "/PID", String(pid)], () => {
      // Best-effort — resolve regardless of exit code
      resolve()
    })
  })
}

export class WindowsBackend implements LdiBackend {
  readonly name = "windows"

  async checkDependencies(): Promise<LdiPlatformCheck> {
    if (process.platform !== "win32") {
      return {
        supported: false,
        platform: process.platform,
        reason: `Windows backend requires win32. Current platform: ${process.platform}`,
      }
    }

    const browser = this.findBrowser()
    if (!browser) {
      return {
        supported: false,
        platform: "win32",
        reason: "No supported browser found. Install Google Chrome, Chromium, or Brave.",
        missingDeps: ["chrome/chromium (no supported browser found)"],
      }
    }

    return { supported: true, platform: "win32" }
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

      // Send window to bottom of Z-order via PowerShell
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
          // On Windows, SIGTERM is the only signal available via process.kill()
          try {
            process.kill(pid, "SIGTERM")
          } catch {
            // May fail if process already exited
          }
          await sleep(1000)
          if (isProcessRunning(pid)) {
            await taskkill(pid)
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
    for (const browserPath of WINDOWS_BROWSER_PATHS) {
      // Expand environment variables in paths
      const expanded = browserPath.replace(/%([^%]+)%/g, (_, name) => process.env[name] ?? "")
      if (existsSync(expanded)) {
        return expanded
      }
    }
    return null
  }

  private async getScreenResolution(): Promise<{ width: number; height: number }> {
    try {
      const output = await powershell(
        "Add-Type -AssemblyName System.Windows.Forms; " +
          "[System.Windows.Forms.Screen]::PrimaryScreen.Bounds | " +
          "Select-Object Width,Height | ConvertTo-Json",
      )
      const parsed = JSON.parse(output)
      if (parsed.Width && parsed.Height) {
        return { width: parsed.Width, height: parsed.Height }
      }
    } catch {
      // Fallback below
    }

    // Fallback: wmic (deprecated but still available on most Windows)
    try {
      const output = await powershell(
        "Get-CimInstance Win32_VideoController | " +
          "Select-Object -First 1 CurrentHorizontalResolution,CurrentVerticalResolution | " +
          "ConvertTo-Json",
      )
      const parsed = JSON.parse(output)
      if (parsed.CurrentHorizontalResolution && parsed.CurrentVerticalResolution) {
        return {
          width: parsed.CurrentHorizontalResolution,
          height: parsed.CurrentVerticalResolution,
        }
      }
    } catch {
      // Use default
    }

    return { width: 1920, height: 1080 }
  }

  private async positionWindow(pid: number, width: number, height: number): Promise<void> {
    // Use PowerShell to find the window by PID and reposition it via Win32 API
    const script = [
      "Add-Type @'",
      "using System;",
      "using System.Runtime.InteropServices;",
      "public class Win32 {",
      '  [DllImport("user32.dll")] public static extern bool SetWindowPos(',
      "    IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);",
      '  [DllImport("user32.dll")] public static extern bool EnumWindows(',
      "    EnumWindowsProc lpEnumFunc, IntPtr lParam);",
      '  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(',
      "    IntPtr hWnd, out uint lpdwProcessId);",
      "  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);",
      "}",
      "'@",
      `$targetPid = ${pid}`,
      "$hwnd = [IntPtr]::Zero",
      "[Win32]::EnumWindows({",
      "  param($h, $p)",
      "  $procId = 0",
      "  [Win32]::GetWindowThreadProcessId($h, [ref]$procId) | Out-Null",
      "  if ($procId -eq $targetPid) { $script:hwnd = $h; return $false }",
      "  return $true",
      "}, [IntPtr]::Zero) | Out-Null",
      "if ($hwnd -ne [IntPtr]::Zero) {",
      "  $HWND_BOTTOM = [IntPtr]::new(1)",
      "  $SWP_NOACTIVATE = 0x0010",
      `  [Win32]::SetWindowPos($hwnd, $HWND_BOTTOM, 0, 0, ${width}, ${height}, $SWP_NOACTIVATE) | Out-Null`,
      "}",
    ].join("\n")

    try {
      await powershell(script)
    } catch {
      // Window positioning is best-effort — may fail if the window
      // hasn't fully initialized or if permissions are restricted
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
