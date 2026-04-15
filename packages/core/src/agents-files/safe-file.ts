import fs from "fs"
import path from "path"
import { createHash } from "crypto"

export type SafeWriteOptions = {
  encoding?: BufferEncoding
  backupDir?: string
  maxBackups?: number
  /**
   * When true, skip the write entirely if the on-disk content already equals
   * `data`. Avoids unnecessary backups, mtime churn, and clobbering files that
   * the user may have edited to the same value we were about to write.
   */
  skipIfUnchanged?: boolean
}

export function readTextFileIfExistsSync(filePath: string, encoding: BufferEncoding = "utf8"): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, encoding)
  } catch {
    return null
  }
}

function ensureDirSync(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

function backupPrefixForPath(filePath: string): string {
  const base = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, "_")
  const hash = createHash("sha1").update(filePath).digest("hex").slice(0, 12)
  return `${base}.${hash}`
}

function listBackupsForPath(backupDir: string, filePath: string): string[] {
  const prefix = backupPrefixForPath(filePath)
  try {
    const entries = fs.readdirSync(backupDir)
    return entries
      .filter((name) => name.startsWith(`${prefix}.`) && name.endsWith(".bak"))
      .sort()
      .reverse()
      .map((name) => path.join(backupDir, name))
  } catch {
    return []
  }
}

function rotateBackups(backupDir: string, filePath: string, maxBackups: number): void {
  if (maxBackups <= 0) return
  const backups = listBackupsForPath(backupDir, filePath)
  for (const stale of backups.slice(maxBackups)) {
    try {
      fs.rmSync(stale, { force: true })
    } catch {
      // ignore
    }
  }
}

function atomicReplaceSync(tmpPath: string, targetPath: string): void {
  if (process.platform !== "win32" || !fs.existsSync(targetPath)) {
    fs.renameSync(tmpPath, targetPath)
    return
  }

  const oldPath = `${targetPath}.old-${process.pid}-${Date.now()}`
  fs.renameSync(targetPath, oldPath)
  try {
    fs.renameSync(tmpPath, targetPath)
  } catch (error) {
    // Best-effort restore of original
    try {
      if (!fs.existsSync(targetPath) && fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, targetPath)
      }
    } catch {
      // ignore
    }
    throw error
  }

  try {
    fs.rmSync(oldPath, { force: true })
  } catch {
    // ignore
  }
}

/**
 * Atomically write a file, optionally creating a timestamped backup of the previous content.
 */
export function safeWriteFileSync(targetPath: string, data: string | Buffer, options: SafeWriteOptions = {}): void {
  const encoding = options.encoding ?? (typeof data === "string" ? "utf8" : undefined)
  const backupDir = options.backupDir
  const maxBackups = options.maxBackups ?? 10

  if (options.skipIfUnchanged && fs.existsSync(targetPath)) {
    try {
      if (typeof data === "string") {
        const existing = fs.readFileSync(targetPath, { encoding: encoding ?? "utf8" })
        if (existing === data) return
      } else {
        const existing = fs.readFileSync(targetPath)
        if (existing.length === data.length && existing.equals(data)) return
      }
    } catch {
      // Fall through and write normally if the compare failed.
    }
  }

  ensureDirSync(path.dirname(targetPath))

  if (backupDir && fs.existsSync(targetPath)) {
    ensureDirSync(backupDir)
    const prefix = backupPrefixForPath(targetPath)
    const ts = new Date().toISOString().replace(/[:.]/g, "-")
    const backupPath = path.join(backupDir, `${prefix}.${ts}.bak`)
    try {
      fs.copyFileSync(targetPath, backupPath)
      rotateBackups(backupDir, targetPath, maxBackups)
    } catch {
      // Backup is best-effort; continue with the write.
    }
  }

  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`
  try {
    if (typeof data === "string") {
      fs.writeFileSync(tmpPath, data, { encoding: encoding ?? "utf8" })
    } else {
      fs.writeFileSync(tmpPath, data)
    }
    atomicReplaceSync(tmpPath, targetPath)
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true })
    } catch {
      // ignore
    }
  }
}

export function safeWriteJsonFileSync(
  targetPath: string,
  value: unknown,
  options: SafeWriteOptions & { pretty?: boolean } = {}
): void {
  const pretty = options.pretty !== false
  const json = pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value)
  safeWriteFileSync(targetPath, json, { ...options, encoding: "utf8" })
}

/**
 * Read a JSON file. If parsing fails, attempts to recover from the latest backup (if configured).
 */
export function safeReadJsonFileSync<T>(
  filePath: string,
  options: { backupDir?: string; defaultValue: T }
): T {
  const raw = readTextFileIfExistsSync(filePath, "utf8")
  if (raw === null) return options.defaultValue

  try {
    return JSON.parse(raw) as T
  } catch {
    // Attempt auto-recovery from latest backup
    if (!options.backupDir) return options.defaultValue
    const backups = listBackupsForPath(options.backupDir, filePath)
    for (const backupPath of backups) {
      const backupRaw = readTextFileIfExistsSync(backupPath, "utf8")
      if (!backupRaw) continue
      try {
        const parsed = JSON.parse(backupRaw) as T
        // Restore the last known-good content to the primary file.
        try {
          safeWriteFileSync(filePath, backupRaw, {
            backupDir: options.backupDir,
            maxBackups: 10,
            encoding: "utf8",
          })
        } catch {
          // ignore restore failure
        }
        return parsed
      } catch {
        continue
      }
    }
    return options.defaultValue
  }
}
