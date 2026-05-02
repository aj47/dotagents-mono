/**
 * Local Trace Logger
 *
 * Opt-in local-only trace logging for agent sessions, LLM generations and
 * tool/MCP spans. Writes each trace/session to its own JSONL file on disk so
 * users can inspect traces without running Langfuse Cloud or self-hosting.
 *
 * Behaviour:
 * - Disabled by default; controlled by `config.localTraceLoggingEnabled`.
 * - Writes per-session files under `config.localTraceLogPath` if set, otherwise
 *   `<dataFolder>/traces/<traceId>.jsonl`.
 * - Each call appends one JSON object per line. Failures are swallowed and
 *   logged to console — they never block agent execution.
 * - Independent of Langfuse: works whether the langfuse package is installed
 *   or not, and whether `langfuseEnabled` is true or false.
 */

import fs from "fs"
import path from "path"
import { configStore, dataFolder } from "./config"
import { isDebugLLM, logLLM } from "./debug"

export type LocalTraceEventType =
  | "trace.start"
  | "trace.end"
  | "generation.start"
  | "generation.end"
  | "span.start"
  | "span.end"

export interface LocalTraceEvent {
  type: LocalTraceEventType
  timestamp: string
  traceId?: string
  generationId?: string
  spanId?: string
  name?: string
  model?: string
  modelParameters?: Record<string, unknown>
  input?: unknown
  output?: unknown
  metadata?: Record<string, unknown>
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR"
  statusMessage?: string
}

let resolvedLogDirectory: string | null = null
const ensuredDirectories = new Set<string>()
const spanTraceIds = new Map<string, string>()
const generationTraceIds = new Map<string, string>()

/**
 * Whether local trace logging is opted into via config.
 */
export function isLocalTraceLoggingEnabled(): boolean {
  try {
    const config = configStore.get()
    return config.localTraceLoggingEnabled === true
  } catch {
    return false
  }
}

/**
 * Resolve the directory traces should be written to.
 * Honours `config.localTraceLogPath` if set, otherwise falls back to
 * `<dataFolder>/traces`.
 */
export function getLocalTraceLogDirectory(): string {
  if (resolvedLogDirectory) return resolvedLogDirectory
  let configured: string | undefined
  try {
    configured = configStore.get().localTraceLogPath
  } catch {
    configured = undefined
  }
  resolvedLogDirectory = configured && configured.trim().length > 0
    ? resolveConfiguredTraceDirectory(configured)
    : path.join(dataFolder, "traces")
  return resolvedLogDirectory
}

/**
 * Resolve the per-session JSONL path for a trace ID.
 */
export function getLocalTraceLogPath(traceId?: string): string {
  const fileName = `${sanitizeTraceFileName(traceId || "unlinked")}.jsonl`
  return path.join(getLocalTraceLogDirectory(), fileName)
}

/**
 * Reset the cached log path. Call when configuration changes.
 */
export function resetLocalTraceLogger(): void {
  resolvedLogDirectory = null
  ensuredDirectories.clear()
  spanTraceIds.clear()
  generationTraceIds.clear()
}

function ensureLogDirectory(filePath: string): void {
  const dir = path.dirname(filePath)
  if (ensuredDirectories.has(dir)) return
  fs.mkdirSync(dir, { recursive: true })
  ensuredDirectories.add(dir)
}

function resolveConfiguredTraceDirectory(configuredPath: string): string {
  const trimmed = configuredPath.trim()
  return path.extname(trimmed).toLowerCase() === ".jsonl"
    ? path.dirname(trimmed)
    : trimmed
}

function sanitizeTraceFileName(traceId: string): string {
  const sanitized = traceId.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180)
  return sanitized || "unlinked"
}

function resolveEventTraceId(event: Omit<LocalTraceEvent, "timestamp">): string | undefined {
  if (event.traceId) return event.traceId
  if (event.spanId) return spanTraceIds.get(event.spanId)
  if (event.generationId) return generationTraceIds.get(event.generationId)
  return undefined
}

function rememberEventTraceLink(record: LocalTraceEvent): void {
  if (record.traceId && record.spanId && record.type === "span.start") {
    spanTraceIds.set(record.spanId, record.traceId)
  }
  if (record.traceId && record.generationId && record.type === "generation.start") {
    generationTraceIds.set(record.generationId, record.traceId)
  }
  if (record.spanId && record.type === "span.end") {
    spanTraceIds.delete(record.spanId)
  }
  if (record.generationId && record.type === "generation.end") {
    generationTraceIds.delete(record.generationId)
  }
}

/**
 * Append one event to the local JSONL trace log. No-op when disabled.
 *
 * Errors are caught and logged to console — local logging must never
 * break agent execution.
 */
export function appendLocalTraceEvent(event: Omit<LocalTraceEvent, "timestamp">): void {
  if (!isLocalTraceLoggingEnabled()) return

  const traceId = resolveEventTraceId(event)
  const filePath = getLocalTraceLogPath(traceId)
  try {
    ensureLogDirectory(filePath)
    const record: LocalTraceEvent = {
      ...event,
      traceId,
      timestamp: new Date().toISOString(),
    }
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8")
    rememberEventTraceLink(record)

    if (isDebugLLM()) {
      logLLM("[LocalTrace] appended", {
        type: record.type,
        traceId: record.traceId,
        path: filePath,
      })
    }
  } catch (error) {
    console.error("[LocalTrace] Failed to append event:", error)
  }
}
