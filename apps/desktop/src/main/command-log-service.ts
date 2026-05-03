/**
 * Per-session execute_command transcript logger.
 *
 * Phase 1 of the per-session shell work tracked in issue #445: keep the current
 * stateless execution model for `execute_command`, but persist the full
 * stdout/stderr and metadata for every invocation to a per-session log file
 * outside the assistant context. The assistant-facing tool result remains
 * truncated; users can open the on-disk log for the unfiltered transcript.
 *
 * Logs live under `<dataFolder>/shell-logs/<sessionId>.log`. Each entry is one
 * JSON object per line (newline-delimited JSON) so the file can be tailed,
 * grepped, and parsed without a full reader.
 */

import { promises as fs } from "fs"
import path from "path"

let cachedLogsDir: string | null = null

async function resolveLogsDir(): Promise<string | null> {
  if (cachedLogsDir) return cachedLogsDir

  // Avoid importing electron in non-electron contexts (e.g. plain Node tests
  // that exercise this module directly). The override below covers tests that
  // need a deterministic location.
  try {
    const { dataFolder } = await import("./config")
    cachedLogsDir = path.join(dataFolder, "shell-logs")
    return cachedLogsDir
  } catch {
    return null
  }
}

/**
 * Override the on-disk location used for command logs. Intended for tests; the
 * desktop app derives the path from `dataFolder` automatically.
 */
export function setCommandLogDirForTesting(dir: string | null): void {
  cachedLogsDir = dir
}

function sanitizeSessionId(sessionId: string): string {
  // Strip path separators and other characters that could escape the logs dir.
  // The transformation is deterministic so the same session always maps to the
  // same file.
  return sessionId.replace(/[^A-Za-z0-9._-]/g, "_")
}

export interface CommandLogEntry {
  sessionId: string
  command: string
  cwd: string
  startedAt: string
  durationMs: number
  exitCode: number | null
  timedOut: boolean
  stdout: string
  stderr: string
  skillName?: string
  error?: string
}

/**
 * Append a single command transcript entry to the session's log file.
 *
 * Failures are swallowed: logging is a best-effort UX feature and must never
 * break command execution. The function returns the path that was written when
 * the entry was persisted, or `null` when logging was skipped or failed.
 */
export async function appendCommandLogEntry(entry: CommandLogEntry): Promise<string | null> {
  if (!entry.sessionId) return null

  const logsDir = await resolveLogsDir()
  if (!logsDir) return null

  const fileName = `${sanitizeSessionId(entry.sessionId)}.log`
  const filePath = path.join(logsDir, fileName)

  try {
    await fs.mkdir(logsDir, { recursive: true })
    const line = JSON.stringify(entry) + "\n"
    await fs.appendFile(filePath, line, "utf8")
    return filePath
  } catch {
    return null
  }
}

/**
 * Read the full transcript for a session as parsed entries. Lines that fail to
 * parse are skipped rather than aborting the read so a partially-written tail
 * does not hide valid history.
 */
export async function readCommandLog(sessionId: string): Promise<CommandLogEntry[]> {
  const logsDir = await resolveLogsDir()
  if (!logsDir) return []

  const filePath = path.join(logsDir, `${sanitizeSessionId(sessionId)}.log`)
  let raw: string
  try {
    raw = await fs.readFile(filePath, "utf8")
  } catch {
    return []
  }

  const entries: CommandLogEntry[] = []
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    try {
      entries.push(JSON.parse(line) as CommandLogEntry)
    } catch {
      // Skip malformed lines rather than failing the whole read.
    }
  }
  return entries
}

/**
 * Resolve the on-disk path for a session log without reading it. Useful for
 * the UI affordance described in the issue ("download/copy raw transcript").
 */
export async function getCommandLogPath(sessionId: string): Promise<string | null> {
  const logsDir = await resolveLogsDir()
  if (!logsDir) return null
  return path.join(logsDir, `${sanitizeSessionId(sessionId)}.log`)
}
