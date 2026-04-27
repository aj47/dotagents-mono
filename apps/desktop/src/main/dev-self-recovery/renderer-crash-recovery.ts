import { spawnSync } from "child_process"
import path from "path"
import type { BrowserWindow } from "electron"
import {
  createGitDevSelfRecovery,
  isRecoverableRendererGoneReason,
  type GitDevSelfRecoveryController,
  type GitDevSelfRecoveryLogger,
} from "./git-recovery"

type BrowserWindowLike = Pick<BrowserWindow, "webContents">

interface RendererCrashRecoveryOptions {
  env?: Partial<NodeJS.ProcessEnv>
  isProd?: boolean
  repoRoot?: string | null
  logger?: GitDevSelfRecoveryLogger
  createController?: (repoRoot: string, logger: GitDevSelfRecoveryLogger) => GitDevSelfRecoveryController
}

let singletonController: GitDevSelfRecoveryController | null = null
let recoveryInProgress = false

function importMetaProd(): boolean {
  const meta = import.meta as unknown as { env?: { PROD?: boolean } }
  return Boolean(meta.env?.PROD)
}

function prefixedLogger(logger: GitDevSelfRecoveryLogger = console): GitDevSelfRecoveryLogger {
  return {
    info: (...args: unknown[]) => logger.info("[renderer-crash-recovery]", ...args),
    warn: (...args: unknown[]) => logger.warn("[renderer-crash-recovery]", ...args),
    error: (...args: unknown[]) => logger.error("[renderer-crash-recovery]", ...args),
  }
}

function resolveRepoRootFromGit(): string | null {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    windowsHide: true,
  })

  if (result.status !== 0) return null
  return path.resolve(result.stdout.trim())
}

export function resetRendererCrashRecoveryForTests(): void {
  singletonController?.stopCleanBaselinePolling()
  singletonController = null
  recoveryInProgress = false
}

export function getRendererCrashRecoveryRepoRoot(options: RendererCrashRecoveryOptions = {}): string | null {
  if (options.repoRoot) return path.resolve(options.repoRoot)

  const env = options.env ?? process.env
  if (env.DOTAGENTS_DEV_SELF_RECOVERY_REPO_ROOT) {
    return path.resolve(env.DOTAGENTS_DEV_SELF_RECOVERY_REPO_ROOT)
  }

  return resolveRepoRootFromGit()
}

export function isRendererCrashRecoveryEnabled(options: RendererCrashRecoveryOptions = {}): boolean {
  const env = options.env ?? process.env
  const isProd = options.isProd ?? importMetaProd()

  if (isProd) return false
  return env.DOTAGENTS_DEV_SELF_RECOVERY === "1" || Boolean(env.ELECTRON_RENDERER_URL)
}

function getController(options: RendererCrashRecoveryOptions): GitDevSelfRecoveryController | null {
  if (singletonController) return singletonController

  const logger = prefixedLogger(options.logger)
  const repoRoot = getRendererCrashRecoveryRepoRoot(options)
  if (!repoRoot) {
    logger.warn("Skipping setup: no git repo root could be resolved")
    return null
  }

  singletonController = options.createController
    ? options.createController(repoRoot, logger)
    : createGitDevSelfRecovery({ repoRoot, logger })
  singletonController.startCleanBaselinePolling()

  return singletonController
}

export function setupRendererCrashRecovery(
  win: BrowserWindowLike,
  windowId: string,
  options: RendererCrashRecoveryOptions = {},
): boolean {
  const logger = prefixedLogger(options.logger)

  if (!isRendererCrashRecoveryEnabled(options)) {
    return false
  }

  const controller = getController(options)
  if (!controller) return false

  win.webContents.on("render-process-gone", (_event, details) => {
    const reason = String(details.reason)
    if (!isRecoverableRendererGoneReason(reason)) {
      logger.info(`Ignoring renderer exit for ${windowId}: ${reason}`)
      return
    }

    if (recoveryInProgress) {
      logger.warn(`Ignoring renderer crash for ${windowId}: recovery already in progress`)
      return
    }

    if (!controller.hasRecoverableChanges()) {
      logger.info(`Ignoring renderer crash for ${windowId}: no recoverable git changes`)
      return
    }

    recoveryInProgress = true
    try {
      const result = controller.maybeRecover({
        kind: "renderer-process-gone",
        windowId,
        reason,
      })

      if (result.recovered === true) {
        logger.warn(`Recovered after renderer crash in ${windowId}; backup saved to ${result.backupDir}`)
      } else {
        logger.warn(`Renderer crash recovery skipped for ${windowId}: ${result.reason}`)
      }
    } finally {
      recoveryInProgress = false
    }
  })

  return true
}