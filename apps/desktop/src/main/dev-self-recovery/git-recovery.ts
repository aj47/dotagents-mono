import { spawnSync, type SpawnSyncReturns } from "child_process"
import fs from "fs"
import path from "path"

export const RECOVERABLE_RENDERER_GONE_REASONS = new Set([
  "crashed",
  "oom",
  "launch-failed",
  "integrity-failure",
])

const DEFAULT_POLL_INTERVAL_MS = 2000
const RECOVERY_DIR_NAME = "dotagents-dev-recovery"
const LOCK_FILE_NAME = ".lock"
const STALE_LOCK_MAX_AGE_MS = 30 * 60 * 1000

export type GitDevSelfRecoveryTrigger =
  | string
  | {
      kind: string
      [key: string]: unknown
    }

export type GitCommandResult = Pick<SpawnSyncReturns<Buffer>, "status" | "signal" | "error"> & {
  stdout: Buffer
  stderr: Buffer
}

export type GitRunner = (args: string[], cwd: string) => GitCommandResult

export type GitDevSelfRecoveryLogger = Pick<Console, "info" | "warn" | "error">

export type GitDevSelfRecoveryResult =
  | {
      recovered: true
      backupDir: string
      statusAfter: string
      warning?: string
    }
  | {
      recovered: false
      reason:
        | "unarmed"
        | "locked"
        | "invalid-repo"
        | "clean"
        | "backup-failed"
        | "reset-failed"
        | "clean-failed"
        | "post-check-failed"
      backupDir?: string
      error?: string
    }

export interface GitDevSelfRecoveryController {
  startCleanBaselinePolling(intervalMs?: number): void
  stopCleanBaselinePolling(): void
  refreshCleanBaseline(): boolean
  hasRecoverableChanges(): boolean
  maybeRecover(trigger: GitDevSelfRecoveryTrigger): GitDevSelfRecoveryResult
}

interface CleanBaseline {
  head: string
  repoRoot: string
  observedAt: string
}

interface RecoveryOptions {
  repoRoot: string
  runGit?: GitRunner
  now?: () => Date
  logger?: GitDevSelfRecoveryLogger
  copyFile?: (source: string, destination: string) => void
  mkdir?: (dir: string) => void
  writeFile?: (file: string, data: string | Buffer) => void
}

interface RepoSnapshot {
  repoRoot: string
  gitDir: string
  head: string
  status: Buffer
}

interface BackupResult {
  ok: true
  backupDir: string
  dryRunDeletePreview: string
}

type BackupFailure = {
  ok: false
  backupDir?: string
  error: string
}

export function isRecoverableRendererGoneReason(reason: string): boolean {
  return RECOVERABLE_RENDERER_GONE_REASONS.has(reason)
}

export function shouldRecoverFromChildClose({
  code,
  signal,
  shutdownSignal,
}: {
  code: number | null
  signal: NodeJS.Signals | null
  shutdownSignal: NodeJS.Signals | null
}): boolean {
  if (shutdownSignal) return false
  if (signal) return false
  return code !== null && code !== 0
}

function defaultRunGit(args: string[], cwd: string): GitCommandResult {
  return spawnSync("git", args, {
    cwd,
    encoding: "buffer",
    maxBuffer: 100 * 1024 * 1024,
    windowsHide: true,
  }) as GitCommandResult
}

function normalizeGitOutput(output: Buffer): string {
  return output.toString("utf8").replace(/\0/g, "\n").trim()
}

function commandError(command: string[], result: GitCommandResult): string {
  const stderr = normalizeGitOutput(result.stderr)
  const suffix = stderr ? `: ${stderr}` : ""
  const signal = result.signal ? ` signal=${result.signal}` : ""
  const error = result.error ? ` error=${result.error.message}` : ""
  return `git ${command.join(" ")} failed with status ${String(result.status)}${signal}${error}${suffix}`
}

function realpathIfPossible(value: string): string {
  try {
    return fs.realpathSync(value)
  } catch {
    return path.resolve(value)
  }
}

function safeTriggerLabel(trigger: GitDevSelfRecoveryTrigger): string {
  const label = typeof trigger === "string" ? trigger : trigger.kind
  return label.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown"
}

function timestampForPath(now: Date): string {
  return now.toISOString().replace(/[:.]/g, "-")
}

function splitNulList(output: Buffer): string[] {
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === "EPERM") return true
    return false
  }
}

function ensureRelativeGitPath(relativePath: string): void {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Refusing absolute untracked path: ${relativePath}`)
  }

  const normalized = path.normalize(relativePath)
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`Refusing untracked path outside repo: ${relativePath}`)
  }
}

export function createGitDevSelfRecovery(options: RecoveryOptions): GitDevSelfRecoveryController {
  const repoRoot = path.resolve(options.repoRoot)
  const runGit = options.runGit ?? defaultRunGit
  const now = options.now ?? (() => new Date())
  const logger = options.logger ?? console
  const copyFile = options.copyFile ?? ((source, destination) => fs.copyFileSync(source, destination))
  const mkdir = options.mkdir ?? ((dir) => fs.mkdirSync(dir, { recursive: true }))
  const writeFile = options.writeFile ?? ((file, data) => fs.writeFileSync(file, data))

  let baseline: CleanBaseline | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const runRequiredGit = (args: string[], cwd = repoRoot): GitCommandResult => {
    const result = runGit(args, cwd)
    if (result.status !== 0) {
      throw new Error(commandError(args, result))
    }
    return result
  }

  const resolveGitDir = (): string => {
    const absoluteResult = runGit(["rev-parse", "--absolute-git-dir"], repoRoot)
    if (absoluteResult.status === 0) {
      const absolute = normalizeGitOutput(absoluteResult.stdout)
      if (!absolute) {
        throw new Error("git rev-parse --absolute-git-dir returned an empty path")
      }
      return realpathIfPossible(absolute)
    }

    const relative = normalizeGitOutput(runRequiredGit(["rev-parse", "--git-dir"]).stdout)
    if (!relative) {
      throw new Error("git rev-parse --git-dir returned an empty path")
    }
    const resolved = path.isAbsolute(relative) ? relative : path.resolve(repoRoot, relative)
    return realpathIfPossible(resolved)
  }

  const validateRepo = (): RepoSnapshot => {
    const topLevel = normalizeGitOutput(runRequiredGit(["rev-parse", "--show-toplevel"]).stdout)
    const expected = realpathIfPossible(repoRoot)
    const actual = realpathIfPossible(topLevel)

    if (actual !== expected) {
      throw new Error(`Expected git repo root ${expected}, got ${actual}`)
    }

    const gitDir = resolveGitDir()
    const head = normalizeGitOutput(runRequiredGit(["rev-parse", "HEAD"]).stdout)
    const status = runRequiredGit(["status", "--porcelain=v1", "-z"]).stdout

    return { repoRoot: actual, gitDir, head, status }
  }

  const recoveryRoot = (gitDir: string) => path.join(gitDir, RECOVERY_DIR_NAME)
  const lockFile = (gitDir: string) => path.join(recoveryRoot(gitDir), LOCK_FILE_NAME)

  const lockMetadata = () =>
    `${JSON.stringify({ pid: process.pid, createdAt: now().toISOString() })}\n`

  const isLockStale = (lockPath: string): boolean => {
    try {
      const stat = fs.statSync(lockPath)
      if (Date.now() - stat.mtimeMs > STALE_LOCK_MAX_AGE_MS) {
        return true
      }

      const raw = fs.readFileSync(lockPath, "utf8").trim()
      if (!raw) return false
      const parsed = JSON.parse(raw) as { pid?: unknown }
      if (typeof parsed.pid === "number" && Number.isInteger(parsed.pid) && parsed.pid > 0) {
        return !processExists(parsed.pid)
      }
      return false
    } catch {
      return false
    }
  }

  const acquireLock = (gitDir: string): number | null => {
    mkdir(recoveryRoot(gitDir))
    const lockPath = lockFile(gitDir)

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const fd = fs.openSync(lockPath, "wx")
        fs.writeFileSync(fd, lockMetadata())
        return fd
      } catch (error) {
        const err = error as NodeJS.ErrnoException
        if (err.code !== "EEXIST") {
          throw error
        }

        if (!isLockStale(lockPath)) {
          return null
        }

        try {
          fs.unlinkSync(lockPath)
        } catch (unlinkError) {
          const unlinkErr = unlinkError as NodeJS.ErrnoException
          if (unlinkErr.code !== "ENOENT") {
            return null
          }
        }
      }
    }

    return null
  }

  const releaseLock = (fd: number, gitDir: string): void => {
    try {
      fs.closeSync(fd)
    } finally {
      try {
        fs.unlinkSync(lockFile(gitDir))
      } catch {
        // best-effort cleanup
      }
    }
  }

  const runGitToFile = (args: string[], outputPath: string): void => {
    const result = runRequiredGit(args)
    writeFile(outputPath, result.stdout)
  }

  const writeMetadata = (backupDir: string, metadata: Record<string, unknown>): void => {
    writeFile(path.join(backupDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`)
  }

  const createBackup = (
    trigger: GitDevSelfRecoveryTrigger,
    snapshot: RepoSnapshot,
  ): BackupResult | BackupFailure => {
    const backupDir = path.join(
      recoveryRoot(snapshot.gitDir),
      `${timestampForPath(now())}-${process.pid}-${safeTriggerLabel(trigger)}`,
    )

    try {
      mkdir(backupDir)
      mkdir(path.join(backupDir, "untracked"))

      runGitToFile(["diff", "--binary", "HEAD", "--"], path.join(backupDir, "tracked-head.patch"))
      runGitToFile(["diff", "--binary", "--"], path.join(backupDir, "tracked-worktree.patch"))
      runGitToFile(["diff", "--cached", "--binary", "--"], path.join(backupDir, "tracked-index.patch"))

      const untrackedResult = runRequiredGit(["ls-files", "--others", "--exclude-standard", "-z"])
      const untrackedFiles = splitNulList(untrackedResult.stdout)
      writeFile(path.join(backupDir, "untracked-files.txt"), `${untrackedFiles.join("\n")}\n`)

      for (const relativePath of untrackedFiles) {
        ensureRelativeGitPath(relativePath)
        const source = path.join(repoRoot, relativePath)
        const destination = path.join(backupDir, "untracked", relativePath)
        mkdir(path.dirname(destination))
        const sourceStats = fs.lstatSync(source)
        if (sourceStats.isSymbolicLink()) {
          const target = fs.readlinkSync(source)
          fs.symlinkSync(target, destination)
          continue
        }
        copyFile(source, destination)
      }

      const dryRunResult = runRequiredGit(["clean", "-fdn", "--", "."])
      const dryRunDeletePreview = dryRunResult.stdout.toString("utf8")

      writeMetadata(backupDir, {
        trigger,
        baseline,
        backupCreatedAt: now().toISOString(),
        repoRoot: snapshot.repoRoot,
        currentHead: snapshot.head,
        statusBefore: normalizeGitOutput(snapshot.status),
        untrackedFiles,
        dryRunDeletePreview,
      })

      return { ok: true, backupDir, dryRunDeletePreview }
    } catch (error) {
      return { ok: false, backupDir, error: error instanceof Error ? error.message : String(error) }
    }
  }

  const updateCleanBaseline = (snapshot: RepoSnapshot): void => {
    baseline = {
      head: snapshot.head,
      repoRoot: snapshot.repoRoot,
      observedAt: now().toISOString(),
    }
    logger.info(`[git-recovery] Clean baseline observed at ${baseline.head}`)
  }

  return {
    startCleanBaselinePolling(intervalMs = DEFAULT_POLL_INTERVAL_MS): void {
      this.refreshCleanBaseline()
      if (pollTimer) return

      pollTimer = setInterval(() => {
        this.refreshCleanBaseline()
      }, intervalMs)
      pollTimer.unref?.()
    },

    stopCleanBaselinePolling(): void {
      if (!pollTimer) return
      clearInterval(pollTimer)
      pollTimer = null
    },

    refreshCleanBaseline(): boolean {
      try {
        const snapshot = validateRepo()
        if (snapshot.status.length !== 0) return false
        updateCleanBaseline(snapshot)
        return true
      } catch (error) {
        logger.warn(`[git-recovery] Skipping clean baseline refresh: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }
    },

    hasRecoverableChanges(): boolean {
      if (!baseline) return false

      try {
        const snapshot = validateRepo()
        return snapshot.status.length !== 0
      } catch (error) {
        logger.warn(`[git-recovery] Cannot check recoverable changes: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }
    },

    maybeRecover(trigger: GitDevSelfRecoveryTrigger): GitDevSelfRecoveryResult {
      if (!baseline) {
        logger.info("[git-recovery] Recovery skipped: no clean baseline observed yet")
        return { recovered: false, reason: "unarmed" }
      }

      let fd: number | null = null
      let gitDirForLock: string | null = null
      try {
        gitDirForLock = resolveGitDir()
        fd = acquireLock(gitDirForLock)
        if (fd === null) {
          logger.warn("[git-recovery] Recovery skipped: another recovery is already running")
          return { recovered: false, reason: "locked" }
        }

        const snapshot = validateRepo()
        if (snapshot.status.length === 0) {
          updateCleanBaseline(snapshot)
          return { recovered: false, reason: "clean" }
        }

        const backup = createBackup(trigger, snapshot)
        if (backup.ok === false) {
          logger.error(`[git-recovery] Backup failed; aborting recovery: ${backup.error}`)
          return { recovered: false, reason: "backup-failed", backupDir: backup.backupDir, error: backup.error }
        }

        const resetResult = runGit(["reset", "--hard", "HEAD"], repoRoot)
        if (resetResult.status !== 0) {
          const error = commandError(["reset", "--hard", "HEAD"], resetResult)
          logger.error(`[git-recovery] ${error}`)
          return { recovered: false, reason: "reset-failed", backupDir: backup.backupDir, error }
        }

        const cleanResult = runGit(["clean", "-fd", "--", "."], repoRoot)
        if (cleanResult.status !== 0) {
          const error = commandError(["clean", "-fd", "--", "."], cleanResult)
          logger.error(`[git-recovery] ${error}`)
          return { recovered: false, reason: "clean-failed", backupDir: backup.backupDir, error }
        }

        const postCheck = runGit(["status", "--porcelain=v1", "-z"], repoRoot)
        if (postCheck.status !== 0) {
          const error = commandError(["status", "--porcelain=v1", "-z"], postCheck)
          logger.error(`[git-recovery] ${error}`)
          return { recovered: false, reason: "post-check-failed", backupDir: backup.backupDir, error }
        }

        const statusAfter = normalizeGitOutput(postCheck.stdout)
        if (statusAfter) {
          const warning = "Working tree is still dirty after dev self-recovery"
          logger.warn(`[git-recovery] ${warning}: ${statusAfter}`)
          return { recovered: true, backupDir: backup.backupDir, statusAfter, warning }
        }

        baseline = {
          head: snapshot.head,
          repoRoot: snapshot.repoRoot,
          observedAt: now().toISOString(),
        }

        logger.warn(`[git-recovery] Recovered dev working tree; backup saved to ${backup.backupDir}`)
        return { recovered: true, backupDir: backup.backupDir, statusAfter }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.warn(`[git-recovery] Recovery skipped: ${message}`)
        return { recovered: false, reason: "invalid-repo", error: message }
      } finally {
        if (fd !== null && gitDirForLock) releaseLock(fd, gitDirForLock)
      }
    },
  }
}
