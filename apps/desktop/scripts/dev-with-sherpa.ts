/**
 * NOTE: This file should be run via `npx tsx scripts/dev-with-sherpa.ts`
 * or through the npm script `pnpm dev`. Do not invoke directly.
 *
 * Development launcher that configures environment for sherpa-onnx native module.
 *
 * The sherpa-onnx-node package requires platform-specific native libraries.
 * On macOS, DYLD_LIBRARY_PATH must be set before the process starts.
 * On Linux, LD_LIBRARY_PATH must be set before the process starts.
 *
 * This script finds the sherpa-onnx libraries and launches electron-vite with
 * the correct environment variables.
 */

import { spawn, spawnSync, type ChildProcess } from "child_process"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { fileURLToPath } from "url"
import {
  createGitDevSelfRecovery,
  shouldRecoverFromChildClose,
} from "../src/main/dev-self-recovery/git-recovery"

const FORCE_KILL_TIMEOUT_MS = 5000
const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const DEBUG_FLAGS = ["-d", "--debug", "--debug-all", "-da", "-dl", "--debug-llm", "-dt", "--debug-tools", "-dui", "--debug-ui", "-dapp", "--debug-app", "-dk", "--debug-keybinds", "-dmcp", "--debug-mcp", "-dacp", "--debug-acp"]

type WindowsProcessTreeTerminator = (pid: number) => {
  status: number | null
  error?: Error
}

function terminateWin32ProcessTree(pid: number) {
  return spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], {
    stdio: "ignore",
    windowsHide: true,
  })
}

export function getDevCommand(userArgs: string[]): {
  command: string
  args: string[]
} {
  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    args: ["exec", "electron-vite", "dev", "--watch", "--", ...userArgs],
  }
}

export function getSharedWatchCommand(): {
  command: string
  args: string[]
  cwd: string
} {
  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    args: ["--filter", "@dotagents/shared", "dev"],
    cwd: WORKSPACE_ROOT,
  }
}

export function buildDevEnvironment(
  baseEnv: Partial<NodeJS.ProcessEnv> = process.env,
  userArgs: string[] = [],
): NodeJS.ProcessEnv {
  const env = { ...baseEnv } as NodeJS.ProcessEnv
  env.DOTAGENTS_DEV_SELF_RECOVERY = "1"
  env.DOTAGENTS_DEV_SELF_RECOVERY_REPO_ROOT = WORKSPACE_ROOT

  const hasDebugFlag = userArgs.some((arg) => DEBUG_FLAGS.includes(arg))
  if (hasDebugFlag) {
    if (!env.REMOTE_DEBUGGING_PORT) {
      env.REMOTE_DEBUGGING_PORT = "9333"
    }
    if (!env.ELECTRON_EXTRA_LAUNCH_ARGS?.includes("--inspect")) {
      const existing = env.ELECTRON_EXTRA_LAUNCH_ARGS || ""
      env.ELECTRON_EXTRA_LAUNCH_ARGS = existing ? `${existing} --inspect=9339` : "--inspect=9339"
    }
  }

  return env
}

function applySherpaLibraryEnvironment(env: NodeJS.ProcessEnv, sherpaPath: string | null): void {
  if (!sherpaPath) return
  const prependUniquePathEntry = (current: string): string => {
    const entries = current.split(path.delimiter).filter(Boolean)
    const normalizedSherpaPath = path.normalize(sherpaPath)
    const alreadyPresent = entries.some((entry) => path.normalize(entry) === normalizedSherpaPath)
    if (alreadyPresent) return current
    return [sherpaPath, ...entries].join(path.delimiter)
  }

  if (os.platform() === "darwin") {
    const current = env.DYLD_LIBRARY_PATH || ""
    env.DYLD_LIBRARY_PATH = prependUniquePathEntry(current)
    console.log(`[dev-with-sherpa] DYLD_LIBRARY_PATH=${env.DYLD_LIBRARY_PATH}`)
  } else if (os.platform() === "linux") {
    const current = env.LD_LIBRARY_PATH || ""
    env.LD_LIBRARY_PATH = prependUniquePathEntry(current)
    console.log(`[dev-with-sherpa] LD_LIBRARY_PATH=${env.LD_LIBRARY_PATH}`)
  }
}

function logDebugEnvironmentChanges(baseEnv: NodeJS.ProcessEnv, env: NodeJS.ProcessEnv, userArgs: string[]): void {
  const hasDebugFlag = userArgs.some((arg) => DEBUG_FLAGS.includes(arg))
  if (!hasDebugFlag) return

  if (!baseEnv.REMOTE_DEBUGGING_PORT && env.REMOTE_DEBUGGING_PORT === "9333") {
    console.log("[dev-with-sherpa] Debug mode: auto-setting REMOTE_DEBUGGING_PORT=9333")
  }
  if (!baseEnv.ELECTRON_EXTRA_LAUNCH_ARGS?.includes("--inspect") && env.ELECTRON_EXTRA_LAUNCH_ARGS?.includes("--inspect=9339")) {
    console.log("[dev-with-sherpa] Debug mode: auto-setting --inspect=9339")
  }
}

export function getSignalExitCode(signal: NodeJS.Signals): number {
  switch (signal) {
    case "SIGINT":
      return 130
    case "SIGTERM":
      return 143
    default:
      return 1
  }
}

export function terminateChildProcessTree(
  child: Pick<ChildProcess, "pid" | "kill">,
  signal: NodeJS.Signals,
  platform = process.platform,
  terminateWindowsProcessTree: WindowsProcessTreeTerminator = terminateWin32ProcessTree,
): boolean {
  if (!child.pid) return false

  if (platform === "win32") {
    // On Windows we launch with shell:true so child.pid is typically the shell wrapper.
    // taskkill /T /F is the most reliable way to tear down the full child tree.
    const result = terminateWindowsProcessTree(child.pid)
    const error = result.error as NodeJS.ErrnoException | undefined

    if (!error && result.status === 0) {
      return true
    }

    if (error?.code === "ENOENT") {
      return child.kill(signal)
    }

    return false
  }

  try {
    process.kill(-child.pid, signal)
    return true
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === "ESRCH") {
      return false
    }

    return child.kill(signal)
  }
}

function normalizeExecutionPath(entry: string, cwd: string): string | null {
  if (!entry || entry.startsWith("-")) return null

  try {
    const resolvedPath = entry.startsWith("file:")
      ? fileURLToPath(entry)
      : path.resolve(cwd, entry)

    return path.normalize(resolvedPath)
  } catch {
    return null
  }
}

export function isDirectExecution(
  argv = process.argv,
  metaUrl = import.meta.url,
  cwd = process.cwd(),
): boolean {
  const modulePath = path.normalize(fileURLToPath(metaUrl))
  const moduleBaseName = path.basename(modulePath, path.extname(modulePath))

  return argv.slice(1).some((entry) => {
    const candidatePath = normalizeExecutionPath(entry, cwd)
    if (!candidatePath) return false
    if (candidatePath === modulePath) return true

    return path.basename(candidatePath, path.extname(candidatePath)) === moduleBaseName
  })
}

function findSherpaLibraryPath(): string | null {
  const platform = os.platform() === "win32" ? "win" : os.platform()
  const arch = os.arch()
  const platformPackage = `sherpa-onnx-${platform}-${arch}`

  // Check pnpm virtual store first (most common in monorepo)
  const pnpmBase = path.join(process.cwd(), "node_modules", ".pnpm")
  if (fs.existsSync(pnpmBase)) {
    try {
      const dirs = fs.readdirSync(pnpmBase)
      const platformDir = dirs.find((d) => d.startsWith(`${platformPackage}@`))
      if (platformDir) {
        const libPath = path.join(pnpmBase, platformDir, "node_modules", platformPackage)
        if (fs.existsSync(libPath)) {
          return libPath
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Check standard node_modules
  const standardPath = path.join(process.cwd(), "node_modules", platformPackage)
  if (fs.existsSync(standardPath)) {
    return standardPath
  }

  // Check root monorepo node_modules
  const rootPnpmBase = path.join(process.cwd(), "..", "..", "node_modules", ".pnpm")
  if (fs.existsSync(rootPnpmBase)) {
    try {
      const dirs = fs.readdirSync(rootPnpmBase)
      const platformDir = dirs.find((d) => d.startsWith(`${platformPackage}@`))
      if (platformDir) {
        const libPath = path.join(rootPnpmBase, platformDir, "node_modules", platformPackage)
        if (fs.existsSync(libPath)) {
          return libPath
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return null
}

export function spawnDesktopDevChild(env: NodeJS.ProcessEnv, userArgs: string[]): ChildProcess {
  const { command, args } = getDevCommand(userArgs)
  console.log(`[dev-with-sherpa] Running: ${command} ${args.join(" ")}`)

  return spawn(command, args, {
    env,
    stdio: "inherit",
    detached: process.platform !== "win32",
    shell: process.platform === "win32",
  })
}

function main(): void {
  const userArgs = process.argv.slice(2)
  const sherpaPath = findSherpaLibraryPath()

  // Set up environment
  const env = buildDevEnvironment(process.env, userArgs)
  console.log(`[dev-with-sherpa] Dev self-recovery enabled for repo: ${env.DOTAGENTS_DEV_SELF_RECOVERY_REPO_ROOT}`)

  if (sherpaPath) {
    console.log(`[dev-with-sherpa] Found sherpa-onnx libraries: ${sherpaPath}`)
    applySherpaLibraryEnvironment(env, sherpaPath)
  } else {
    console.warn("[dev-with-sherpa] Could not find sherpa-onnx libraries.")
    console.warn("[dev-with-sherpa] Parakeet local STT may not work correctly.")
  }

  // Auto-enable CDP debug ports when any debug flag is passed
  logDebugEnvironmentChanges(process.env, env, userArgs)

  const sharedWatch = getSharedWatchCommand()
  const devSelfRecovery = createGitDevSelfRecovery({
    repoRoot: WORKSPACE_ROOT,
    logger: {
      info: (...args) => console.log("[dev-self-recovery]", ...args),
      warn: (...args) => console.warn("[dev-self-recovery]", ...args),
      error: (...args) => console.error("[dev-self-recovery]", ...args),
    },
  })
  devSelfRecovery.startCleanBaselinePolling()

  console.log(`[dev-with-sherpa] Running shared watch: ${sharedWatch.command} ${sharedWatch.args.join(" ")}`)
  const sharedChild = spawn(sharedWatch.command, sharedWatch.args, {
    cwd: sharedWatch.cwd,
    env,
    stdio: "inherit",
    detached: process.platform !== "win32",
    shell: process.platform === "win32",
  })

  let child = spawnDesktopDevChild(env, userArgs)
  let restartedAfterRecovery = false

  let shutdownSignal: NodeJS.Signals | null = null
  let forceKillTimer: ReturnType<typeof setTimeout> | undefined

  const stopRecoveryPolling = () => {
    devSelfRecovery.stopCleanBaselinePolling()
  }

  const exitAfterDesktopChildClose = (code: number | null, signal: NodeJS.Signals | null) => {
    if (!shutdownSignal) {
      terminateChildProcessTree(sharedChild, "SIGTERM")
    }

    stopRecoveryPolling()

    if (code !== null) {
      process.exit(code)
    }

    if (signal) {
      process.exit(getSignalExitCode(signal))
    }

    if (shutdownSignal) {
      process.exit(getSignalExitCode(shutdownSignal))
    }

    process.exit(0)
  }

  const restartDesktopChildAfterRecovery = () => {
    restartedAfterRecovery = true
    child = spawnDesktopDevChild(env, userArgs)
    attachDesktopChildHandlers(child)
  }

  const maybeRecoverAndRestart = (trigger: { kind: string; [key: string]: unknown }): boolean => {
    if (restartedAfterRecovery) return false

    const result = devSelfRecovery.maybeRecover(trigger)
    if (!result.recovered) {
      console.warn(`[dev-with-sherpa] Dev self-recovery skipped: ${result.reason}`)
      return false
    }

    console.warn(`[dev-with-sherpa] Dev self-recovery completed; backup saved to ${result.backupDir}`)
    console.warn("[dev-with-sherpa] Restarting desktop dev child once after recovery...")
    restartDesktopChildAfterRecovery()
    return true
  }

  function attachDesktopChildHandlers(desktopChild: ChildProcess) {
    desktopChild.on("close", (code, signal) => {
      if (forceKillTimer) {
        clearTimeout(forceKillTimer)
      }

      if (shouldRecoverFromChildClose({ code, signal, shutdownSignal })) {
        if (maybeRecoverAndRestart({ kind: "electron-vite-exit", code, signal })) {
          return
        }
      }

      exitAfterDesktopChildClose(code, signal)
    })

    desktopChild.on("error", (err) => {
      if (!shutdownSignal && !restartedAfterRecovery && devSelfRecovery.hasRecoverableChanges()) {
        if (maybeRecoverAndRestart({ kind: "electron-vite-error", message: err.message })) {
          return
        }
      }

      console.error("[dev-with-sherpa] Failed to start:", err)
      terminateChildProcessTree(sharedChild, "SIGTERM")
      stopRecoveryPolling()
      process.exit(1)
    })
  }

  const shutdown = (signal: NodeJS.Signals) => {
    if (shutdownSignal) return

    shutdownSignal = signal
    console.log(`[dev-with-sherpa] Received ${signal}; stopping desktop + shared watch process trees...`)

    terminateChildProcessTree(sharedChild, signal)
    terminateChildProcessTree(child, signal)

    forceKillTimer = setTimeout(() => {
      console.warn(
        `[dev-with-sherpa] Process trees still alive after ${FORCE_KILL_TIMEOUT_MS}ms; sending SIGKILL`,
      )
      terminateChildProcessTree(sharedChild, "SIGKILL")
      terminateChildProcessTree(child, "SIGKILL")
    }, FORCE_KILL_TIMEOUT_MS)
    forceKillTimer.unref()
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => shutdown(signal))
  }

  attachDesktopChildHandlers(child)

  sharedChild.on("error", (err) => {
    console.error("[dev-with-sherpa] Failed to start shared watch:", err)
    terminateChildProcessTree(child, "SIGTERM")
    stopRecoveryPolling()
    process.exit(1)
  })
}

if (isDirectExecution()) {
  main()
}
