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
 * - Each call queues one JSON object per line. Filesystem failures are logged
 *   asynchronously and never break agent execution.
 * - Independent of Langfuse: works whether the langfuse package is installed
 *   or not, and whether `langfuseEnabled` is true or false.
 */

import fs from "fs"
import path from "path"
import { configStore, dataFolder } from "./config"
import { isDebugLLM, logLLM } from "./debug"
import { DEFAULT_LOCAL_TRACE_LOGGING_ENABLED } from "@dotagents/shared/observability-config"

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
const pendingWrites = new Map<string, Promise<void>>()
const spanTraceIds = new Map<string, string>()
const generationTraceIds = new Map<string, string>()

/**
 * Whether local trace logging is opted into via config.
 */
export function isLocalTraceLoggingEnabled(): boolean {
  try {
    const config = configStore.get()
    return (config.localTraceLoggingEnabled ?? DEFAULT_LOCAL_TRACE_LOGGING_ENABLED) === true
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
  spanTraceIds.clear()
  generationTraceIds.clear()
}

export async function flushLocalTraceLogger(): Promise<void> {
  while (pendingWrites.size > 0) {
    await Promise.all(Array.from(pendingWrites.values()))
  }
}

async function writeLocalTraceEvent(filePath: string, record: LocalTraceEvent): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.appendFile(filePath, JSON.stringify(record) + "\n", "utf8")

  if (isDebugLLM()) {
    logLLM("[LocalTrace] appended", {
      type: record.type,
      traceId: record.traceId,
      path: filePath,
    })
  }
}

function queueLocalTraceWrite(filePath: string, record: LocalTraceEvent): void {
  const previousWrite = pendingWrites.get(filePath) ?? Promise.resolve()
  const queuedWrite = previousWrite
    .catch(() => undefined)
    .then(() => writeLocalTraceEvent(filePath, record))
    .catch((error) => {
      console.error("[LocalTrace] Failed to append event:", error)
    })

  pendingWrites.set(filePath, queuedWrite)
  void queuedWrite.finally(() => {
    if (pendingWrites.get(filePath) === queuedWrite) {
      pendingWrites.delete(filePath)
    }
  })
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
 * Writes are queued asynchronously. Errors are logged to console — local
 * logging must never break agent execution.
 */
export function appendLocalTraceEvent(event: Omit<LocalTraceEvent, "timestamp">): void {
  if (!isLocalTraceLoggingEnabled()) return

  const traceId = resolveEventTraceId(event)
  const filePath = getLocalTraceLogPath(traceId)
  const record: LocalTraceEvent = {
    ...event,
    traceId,
    timestamp: new Date().toISOString(),
  }
  rememberEventTraceLink(record)
  queueLocalTraceWrite(filePath, record)
}
