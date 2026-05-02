/**
 * Local Trace Logger
 *
 * Opt-in local-only trace logging for agent sessions, LLM generations and
 * tool/MCP spans. Writes events to a JSONL file on disk so users can inspect
 * traces without running Langfuse Cloud or self-hosting.
 *
 * Behaviour:
 * - Disabled by default; controlled by `config.localTraceLoggingEnabled`.
 * - Writes to `config.localTraceLogPath` if set, otherwise
 *   `<dataFolder>/traces/traces.jsonl`.
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

let resolvedLogPath: string | null = null
let directoryEnsured = false

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
 * Resolve the path traces should be written to.
 * Honours `config.localTraceLogPath` if set, otherwise falls back to
 * `<dataFolder>/traces/traces.jsonl`.
 */
export function getLocalTraceLogPath(): string {
  if (resolvedLogPath) return resolvedLogPath
  let configured: string | undefined
  try {
    configured = configStore.get().localTraceLogPath
  } catch {
    configured = undefined
  }
  resolvedLogPath = configured && configured.trim().length > 0
    ? configured
    : path.join(dataFolder, "traces", "traces.jsonl")
  return resolvedLogPath
}

/**
 * Reset the cached log path. Call when configuration changes.
 */
export function resetLocalTraceLogger(): void {
  resolvedLogPath = null
  directoryEnsured = false
}

function ensureLogDirectory(filePath: string): void {
  if (directoryEnsured) return
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  directoryEnsured = true
}

/**
 * Append one event to the local JSONL trace log. No-op when disabled.
 *
 * Errors are caught and logged to console — local logging must never
 * break agent execution.
 */
export function appendLocalTraceEvent(event: Omit<LocalTraceEvent, "timestamp">): void {
  if (!isLocalTraceLoggingEnabled()) return

  const filePath = getLocalTraceLogPath()
  try {
    ensureLogDirectory(filePath)
    const record: LocalTraceEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8")

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
