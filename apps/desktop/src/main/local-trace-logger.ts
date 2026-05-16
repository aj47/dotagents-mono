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

const MAX_TRACE_STRING_CHARS = 4_000
const MAX_TRACE_ARRAY_ITEMS = 20
const MAX_TRACE_OBJECT_KEYS = 60
const MAX_TRACE_DEPTH = 8
const MAX_TRACE_EVENT_CHARS = 75_000
const TRACE_SUMMARY_PREVIEW_CHARS = 2_000

type TraceSanitizationStats = {
  truncatedStrings: number
  truncatedArrays: number
  truncatedObjects: number
  circularReferences: number
  maxDepthTruncations: number
  compactedEvents: number
  serializedCharsAfterSanitization?: number
}

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
  resolvedLogDirectory =
    configured && configured.trim().length > 0
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

async function writeLocalTraceEvent(
  filePath: string,
  record: LocalTraceEvent,
): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  await fs.promises.appendFile(
    filePath,
    stringifyLocalTraceRecord(record) + "\n",
    "utf8",
  )

  if (isDebugLLM()) {
    logLLM("[LocalTrace] appended", {
      type: record.type,
      traceId: record.traceId,
      path: filePath,
    })
  }
}

function stringifyLocalTraceRecord(record: LocalTraceEvent): string {
  try {
    return JSON.stringify(record)
  } catch (error) {
    return JSON.stringify({
      type: record.type,
      timestamp: record.timestamp,
      traceId: record.traceId,
      generationId: record.generationId,
      spanId: record.spanId,
      name: record.name,
      level: "ERROR",
      statusMessage: `Failed to serialize local trace event: ${error instanceof Error ? error.message : String(error)}`,
    } satisfies LocalTraceEvent)
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

function resolveEventTraceId(
  event: Omit<LocalTraceEvent, "timestamp">,
): string | undefined {
  if (event.traceId) return event.traceId
  if (event.spanId) return spanTraceIds.get(event.spanId)
  if (event.generationId) return generationTraceIds.get(event.generationId)
  return undefined
}

function rememberEventTraceLink(record: LocalTraceEvent): void {
  if (record.traceId && record.spanId && record.type === "span.start") {
    spanTraceIds.set(record.spanId, record.traceId)
  }
  if (
    record.traceId &&
    record.generationId &&
    record.type === "generation.start"
  ) {
    generationTraceIds.set(record.generationId, record.traceId)
  }
  if (record.spanId && record.type === "span.end") {
    spanTraceIds.delete(record.spanId)
  }
  if (record.generationId && record.type === "generation.end") {
    generationTraceIds.delete(record.generationId)
  }
}

function createTraceSanitizationStats(): TraceSanitizationStats {
  return {
    truncatedStrings: 0,
    truncatedArrays: 0,
    truncatedObjects: 0,
    circularReferences: 0,
    maxDepthTruncations: 0,
    compactedEvents: 0,
  }
}

function hasTraceSanitization(stats: TraceSanitizationStats): boolean {
  return (
    stats.truncatedStrings > 0 ||
    stats.truncatedArrays > 0 ||
    stats.truncatedObjects > 0 ||
    stats.circularReferences > 0 ||
    stats.maxDepthTruncations > 0 ||
    stats.compactedEvents > 0
  )
}

function truncateTraceString(
  text: string,
  stats: TraceSanitizationStats,
  limit = MAX_TRACE_STRING_CHARS,
): string {
  if (text.length <= limit) return text

  stats.truncatedStrings += 1
  const marker = `\n\n[local trace truncated: ${text.length - limit} chars omitted from ${text.length}]\n\n`
  const available = Math.max(0, limit - marker.length)
  const headLength = Math.ceil(available / 2)
  const tailLength = Math.floor(available / 2)

  return `${text.slice(0, headLength)}${marker}${text.slice(text.length - tailLength)}`
}

function selectArrayEntries(
  value: unknown[],
  stats: TraceSanitizationStats,
): unknown[] {
  if (value.length <= MAX_TRACE_ARRAY_ITEMS) return value

  stats.truncatedArrays += 1
  const headCount = Math.ceil(MAX_TRACE_ARRAY_ITEMS / 2)
  const tailCount = Math.floor(MAX_TRACE_ARRAY_ITEMS / 2)
  return [
    ...value.slice(0, headCount),
    {
      __localTraceTruncatedItems: value.length - MAX_TRACE_ARRAY_ITEMS,
    },
    ...value.slice(value.length - tailCount),
  ]
}

function selectObjectEntries(
  value: Record<string, unknown>,
  stats: TraceSanitizationStats,
): Array<[string, unknown]> {
  const entries = Object.entries(value)
  if (entries.length <= MAX_TRACE_OBJECT_KEYS) return entries

  stats.truncatedObjects += 1
  return [
    ...entries.slice(0, MAX_TRACE_OBJECT_KEYS),
    ["__localTraceTruncatedKeys", entries.length - MAX_TRACE_OBJECT_KEYS],
  ]
}

function sanitizeTraceValue(
  value: unknown,
  stats: TraceSanitizationStats,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (typeof value === "string") {
    return truncateTraceString(value, stats)
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (typeof value === "symbol" || typeof value === "function") {
    return `[${typeof value}]`
  }

  if (depth >= MAX_TRACE_DEPTH) {
    stats.maxDepthTruncations += 1
    return summarizeTraceValue(value)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateTraceString(value.message, stats),
      stack: value.stack ? truncateTraceString(value.stack, stats) : undefined,
    }
  }

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return {
      __localTraceSummary: "Buffer",
      byteLength: value.byteLength,
    }
  }

  if (ArrayBuffer.isView(value)) {
    return {
      __localTraceSummary: value.constructor.name,
      byteLength: value.byteLength,
    }
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      stats.circularReferences += 1
      return "[Circular]"
    }

    seen.add(value)
    const sanitized = selectArrayEntries(value, stats).map((item) =>
      sanitizeTraceValue(item, stats, depth + 1, seen),
    )
    seen.delete(value)
    return sanitized
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      stats.circularReferences += 1
      return "[Circular]"
    }

    seen.add(value)
    const result: Record<string, unknown> = {}
    for (const [key, entryValue] of selectObjectEntries(
      value as Record<string, unknown>,
      stats,
    )) {
      result[key] = sanitizeTraceValue(entryValue, stats, depth + 1, seen)
    }
    seen.delete(value)
    return result
  }

  return String(value)
}

function summarizeTraceValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length <= TRACE_SUMMARY_PREVIEW_CHARS) return value
    return `${value.slice(0, TRACE_SUMMARY_PREVIEW_CHARS)}\n\n[local trace summary: ${value.length - TRACE_SUMMARY_PREVIEW_CHARS} chars omitted from ${value.length}]`
  }

  if (Array.isArray(value)) {
    return {
      __localTraceSummary: "Array",
      length: value.length,
      sample: value.slice(0, 3).map((item) => summarizeTraceValue(item)),
    }
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>)
    return {
      __localTraceSummary: value.constructor?.name || "Object",
      keys: keys.slice(0, 20),
      omittedKeys: Math.max(0, keys.length - 20),
    }
  }

  return value
}

function compactOversizedTraceRecord(
  record: LocalTraceEvent,
  stats: TraceSanitizationStats,
): LocalTraceEvent {
  stats.compactedEvents += 1

  const compacted: LocalTraceEvent = {
    type: record.type,
    timestamp: record.timestamp,
    traceId: record.traceId,
    generationId: record.generationId,
    spanId: record.spanId,
    name: record.name,
    model: record.model,
    modelParameters: record.modelParameters,
    metadata: {
      localTraceSanitization: stats,
      originalMetadata: record.metadata
        ? summarizeTraceValue(record.metadata)
        : undefined,
    },
    usage: record.usage,
    level: record.level,
    statusMessage: record.statusMessage,
  }

  if (record.input !== undefined) {
    compacted.input = summarizeTraceValue(record.input)
  }
  if (record.output !== undefined) {
    compacted.output = summarizeTraceValue(record.output)
  }

  return compacted
}

function withTraceSanitizationMetadata(
  record: LocalTraceEvent,
  stats: TraceSanitizationStats,
): LocalTraceEvent {
  if (!hasTraceSanitization(stats)) return record

  const metadata =
    record.metadata &&
    typeof record.metadata === "object" &&
    !Array.isArray(record.metadata)
      ? { ...record.metadata }
      : record.metadata === undefined
        ? {}
        : { originalMetadata: record.metadata }

  return {
    ...record,
    metadata: {
      ...metadata,
      localTraceSanitization: stats,
    },
  }
}

function sanitizeLocalTraceRecord(record: LocalTraceEvent): LocalTraceEvent {
  const stats = createTraceSanitizationStats()
  const sanitized = sanitizeTraceValue(record, stats) as LocalTraceEvent
  let withMetadata = withTraceSanitizationMetadata(sanitized, stats)
  let serialized = stringifyLocalTraceRecord(withMetadata)

  if (serialized.length <= MAX_TRACE_EVENT_CHARS) {
    return withMetadata
  }

  stats.serializedCharsAfterSanitization = serialized.length
  withMetadata = compactOversizedTraceRecord(withMetadata, stats)
  serialized = stringifyLocalTraceRecord(withMetadata)

  if (serialized.length <= MAX_TRACE_EVENT_CHARS) {
    return withMetadata
  }

  return {
    type: record.type,
    timestamp: record.timestamp,
    traceId: record.traceId,
    generationId: record.generationId,
    spanId: record.spanId,
    name: record.name,
    level: "WARNING",
    statusMessage: "Local trace event exceeded size cap and was compacted.",
    metadata: {
      localTraceSanitization: {
        ...stats,
        serializedCharsAfterCompaction: serialized.length,
      },
    },
  }
}

/**
 * Append one event to the local JSONL trace log. No-op when disabled.
 *
 * Writes are queued asynchronously. Errors are logged to console — local
 * logging must never break agent execution.
 */
export function appendLocalTraceEvent(
  event: Omit<LocalTraceEvent, "timestamp">,
): void {
  if (!isLocalTraceLoggingEnabled()) return

  const traceId = resolveEventTraceId(event)
  const filePath = getLocalTraceLogPath(traceId)
  const record: LocalTraceEvent = {
    ...event,
    traceId,
    timestamp: new Date().toISOString(),
  }
  rememberEventTraceLink(record)
  queueLocalTraceWrite(filePath, sanitizeLocalTraceRecord(record))
}
