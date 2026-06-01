/**
 * Session Command Runtime — durable per-session command logging.
 *
 * Records every `execute_command` invocation with full stdout/stderr and
 * metadata to disk, scoped per session. Assistant-facing tool results stay
 * bounded for context safety; this service is the source of truth for the
 * complete transcript.
 *
 * See issue #445 for the full design. This module implements Phase 1
 * (mandatory logging) without persistent PTY or live streaming.
 */

import { promises as fs } from "fs"
import path from "path"

import { logApp } from "./debug"

export interface SessionCommandLogStartParams {
  sessionId: string
  command: string
  cwd: string
  shell: string
  timeoutMs?: number
}

export interface SessionCommandLogFinishParams {
  exitCode: number | null
  signal?: string | null
  stdout: string
  stderr: string
  errorMessage?: string
  timedOut?: boolean
}

export interface SessionCommandLogHandle {
  sessionId: string
  commandId: string
  metadataPath: string
  stdoutPath: string
  stderrPath: string
  finalize(params: SessionCommandLogFinishParams): Promise<void>
}

export interface SessionCommandLogMetadata {
  sessionId: string
  commandId: string
  command: string
  cwd: string
  shell: string
  timeoutMs?: number
  startedAt: string
  endedAt?: string
  durationMs?: number
  exitCode?: number | null
  signal?: string | null
  timedOut?: boolean
  errorMessage?: string
  stdoutPath: string
  stderrPath: string
  stdoutBytes?: number
  stderrBytes?: number
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    || "session"
}

let dataFolderOverride: string | null = null

async function getSessionCommandsDir(sessionId: string): Promise<string> {
  const root = dataFolderOverride ?? (await import("./config")).dataFolder
  return path.join(root, "runtime", "sessions", sanitizePathSegment(sessionId), "commands")
}

let commandCounter = 0

function generateCommandId(): string {
  commandCounter += 1
  const time = Date.now().toString(36)
  const counter = commandCounter.toString(36).padStart(4, "0")
  const noise = Math.random().toString(36).slice(2, 8)
  return `cmd_${time}_${counter}_${noise}`
}

async function writeFileSafe(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, contents, "utf8")
}

export async function startSessionCommandLog(params: SessionCommandLogStartParams): Promise<SessionCommandLogHandle> {
  const { sessionId, command, cwd, shell, timeoutMs } = params
  const commandId = generateCommandId()
  const dir = await getSessionCommandsDir(sessionId)
  const metadataPath = path.join(dir, `${commandId}.json`)
  const stdoutPath = path.join(dir, `${commandId}.stdout.log`)
  const stderrPath = path.join(dir, `${commandId}.stderr.log`)
  const startedAt = new Date().toISOString()
  const startMs = Date.now()

  const initialMetadata: SessionCommandLogMetadata = {
    sessionId,
    commandId,
    command,
    cwd,
    shell,
    timeoutMs,
    startedAt,
    stdoutPath,
    stderrPath,
  }

  try {
    await writeFileSafe(metadataPath, JSON.stringify(initialMetadata, null, 2))
  } catch (error) {
    logApp("[session-command-runtime] failed to write initial metadata", {
      sessionId,
      commandId,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return {
    sessionId,
    commandId,
    metadataPath,
    stdoutPath,
    stderrPath,
    async finalize(finish: SessionCommandLogFinishParams) {
      const endedAt = new Date().toISOString()
      const durationMs = Date.now() - startMs
      const stdoutBytes = Buffer.byteLength(finish.stdout, "utf8")
      const stderrBytes = Buffer.byteLength(finish.stderr, "utf8")

      try {
        await writeFileSafe(stdoutPath, finish.stdout)
        await writeFileSafe(stderrPath, finish.stderr)
      } catch (error) {
        logApp("[session-command-runtime] failed to write command logs", {
          sessionId,
          commandId,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      const finalMetadata: SessionCommandLogMetadata = {
        ...initialMetadata,
        endedAt,
        durationMs,
        exitCode: finish.exitCode,
        signal: finish.signal ?? null,
        timedOut: finish.timedOut,
        errorMessage: finish.errorMessage,
        stdoutBytes,
        stderrBytes,
      }

      try {
        await writeFileSafe(metadataPath, JSON.stringify(finalMetadata, null, 2))
      } catch (error) {
        logApp("[session-command-runtime] failed to finalize metadata", {
          sessionId,
          commandId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  }
}

export function __setSessionCommandRuntimeDataFolderForTests(folder: string | null): void {
  dataFolderOverride = folder
}

export function __resetSessionCommandRuntimeForTests(): void {
  commandCounter = 0
}
