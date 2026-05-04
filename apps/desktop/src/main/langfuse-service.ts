/**
 * Langfuse Service
 * Provides observability and monitoring for LLM calls and agent operations.
 *
 * Key features:
 * - LLM call tracing with token counts and costs
 * - Agent session traces (one trace per agent run, grouped by conversation in Langfuse sessions)
 * - MCP tool call instrumentation
 * - Optional/configurable (won't block functionality if not configured)
 * - Langfuse is an OPTIONAL dependency - this module handles its absence gracefully
 *
 * Trace identity model (issue #441):
 * - Langfuse `sessionId` = DotAgents conversation ID (groups multi-turn conversations)
 * - Langfuse `traceId`   = unique per agent run (derived from agent session ID + runId)
 * - Observations         = LLM generations, MCP tool spans, etc., attached to the per-run trace
 */

import { configStore } from "./config"
import { isDebugLLM, logLLM } from "./debug"
import {
  Langfuse,
  isInstalled,
  type LangfuseInstance,
  type LangfuseTraceClient,
  type LangfuseSpanClient,
  type LangfuseGenerationClient,
} from "./langfuse-loader"
import {
  appendLocalTraceEvent,
  isLocalTraceLoggingEnabled,
  resetLocalTraceLogger,
} from "./local-trace-logger"

// Singleton Langfuse instance
let langfuseInstance: LangfuseInstance | null = null

// Active traces and observations for linking and force-close.
const activeTraces = new Map<string, LangfuseTraceClient>()
const activeSpans = new Map<string, LangfuseSpanClient>()
const activeGenerations = new Map<string, LangfuseGenerationClient>()

// Reverse index: which spans/generations belong to which trace (for force-close on abort).
const traceSpanIds = new Map<string, Set<string>>()
const traceGenerationIds = new Map<string, Set<string>>()

// Active per-run trace ID per agent session, so deeper subsystems (mcp-service)
// can resolve the right trace without changing every call signature.
const sessionRunTraceIds = new Map<string, string>()

/**
 * Check if Langfuse package is installed and available
 */
export function isLangfuseInstalled(): boolean {
  return isInstalled
}

/**
 * Check if Langfuse is enabled and configured.
 * Returns false if:
 * - langfuse package is not installed
 * - langfuseEnabled is false in config
 * - API keys are not configured
 */
export function isLangfuseEnabled(): boolean {
  if (!isInstalled) return false
  const config = configStore.get()
  return !!(config.langfuseEnabled && config.langfuseSecretKey && config.langfusePublicKey)
}

/**
 * Should we record any tracing observations? True if either remote Langfuse is
 * enabled or local trace logging is opted in. Local tracing must work even when
 * remote upload is disabled (issue #441).
 */
export function shouldRecordObservations(): boolean {
  return isLangfuseEnabled() || isLocalTraceLoggingEnabled()
}

/**
 * Build a per-run Langfuse trace ID from the long-lived agent session ID and
 * the run number. Stable for a given (session, run) pair so debug tooling can
 * cross-reference local trace files with remote traces.
 */
export function makeLangfuseTraceId(opts: {
  agentSessionId: string
  runId: number
}): string {
  return `${opts.agentSessionId}__run_${opts.runId}`
}

/**
 * Register the active per-run trace ID for an agent session. Used by mcp-service
 * to attach tool spans to the right per-run trace without threading the trace ID
 * through every call signature.
 */
export function setActiveRunTrace(sessionId: string, traceId: string): void {
  sessionRunTraceIds.set(sessionId, traceId)
}

/**
 * Look up the active per-run trace ID for an agent session, if any.
 */
export function getActiveRunTrace(sessionId: string): string | undefined {
  return sessionRunTraceIds.get(sessionId)
}

/**
 * Clear the active per-run trace ID for a session, but only if it still matches
 * the trace ID the caller owns. Avoids races where a newer run has already set
 * its own trace.
 */
export function clearActiveRunTrace(sessionId: string, traceId: string): void {
  if (sessionRunTraceIds.get(sessionId) === traceId) {
    sessionRunTraceIds.delete(sessionId)
  }
}

/**
 * Get or create the Langfuse instance
 */
export function getLangfuse(): LangfuseInstance | null {
  if (!isLangfuseEnabled() || !Langfuse) {
    return null
  }

  if (langfuseInstance) {
    return langfuseInstance
  }

  const config = configStore.get()

  try {
    langfuseInstance = new Langfuse({
      secretKey: config.langfuseSecretKey!,
      publicKey: config.langfusePublicKey!,
      baseUrl: config.langfuseBaseUrl || "https://cloud.langfuse.com",
      flushAt: 5, // Flush after 5 events for responsiveness
      flushInterval: 1000, // Flush every 1 second
    })

    if (isDebugLLM()) {
      logLLM("Langfuse initialized", {
        baseUrl: config.langfuseBaseUrl || "https://cloud.langfuse.com",
      })
    }

    return langfuseInstance
  } catch (error) {
    console.error("[Langfuse] Failed to initialize:", error)
    return null
  }
}

/**
 * Reinitialize Langfuse when config changes
 */
export function reinitializeLangfuse(): void {
  if (langfuseInstance) {
    langfuseInstance.shutdownAsync().catch(console.error)
    langfuseInstance = null
  }
  // Force-close any still-open per-trace observations before clearing state
  // so local trace files don't end up with unbalanced events.
  for (const traceId of Array.from(activeTraces.keys())) {
    forceCloseTraceOperations(traceId, {
      level: "ERROR",
      statusMessage: "Langfuse reinitialized before run completed",
    })
  }
  activeTraces.clear()
  activeSpans.clear()
  activeGenerations.clear()
  traceSpanIds.clear()
  traceGenerationIds.clear()
  sessionRunTraceIds.clear()
  // Local trace logger caches the resolved path; reset so config changes apply.
  resetLocalTraceLogger()
}

/**
 * Create a new per-run Langfuse trace.
 *
 * Langfuse concepts:
 * - sessionId: Groups multiple traces together (e.g., a conversation thread)
 * - trace id: A single agent run (one request/operation, in Langfuse data-model terms)
 * - userId: The user who initiated the trace
 * - tags: Categorization labels for filtering in the Langfuse dashboard
 * - release: Application version for tracking across releases
 *
 * @param traceId - Unique ID for this trace (per agent run, see makeLangfuseTraceId)
 * @param options - Trace configuration options
 */
export function createAgentTrace(
  traceId: string,
  options: {
    name?: string
    userId?: string
    sessionId?: string  // Langfuse session ID (groups traces together, e.g., conversation ID)
    metadata?: Record<string, unknown>
    input?: string
    tags?: string[]
    release?: string
  }
): LangfuseTraceClient | null {
  appendLocalTraceEvent({
    type: "trace.start",
    traceId,
    name: options.name || "Agent Session",
    input: options.input,
    metadata: {
      ...options.metadata,
      userId: options.userId,
      sessionId: options.sessionId,
      tags: options.tags,
      release: options.release,
    },
  })

  const langfuse = getLangfuse()
  if (!langfuse) return null

  try {
    const trace = langfuse.trace({
      id: traceId,
      name: options.name || "Agent Session",
      userId: options.userId,
      sessionId: options.sessionId,  // This groups traces in Langfuse's Sessions view
      metadata: options.metadata,
      input: options.input,
      tags: options.tags,
      release: options.release,
    })
    activeTraces.set(traceId, trace)

    if (isDebugLLM()) {
      logLLM("[Langfuse] Created trace", {
        traceId,
        sessionId: options.sessionId,
        name: options.name,
        hasTags: !!options.tags?.length,
      })
    }

    return trace
  } catch (error) {
    console.error("[Langfuse] Failed to create trace:", error)
    return null
  }
}

/**
 * Get an existing trace by trace ID.
 */
export function getAgentTrace(traceId: string): LangfuseTraceClient | null {
  return activeTraces.get(traceId) || null
}

/**
 * End a trace with output. Also drops the per-trace observation index so the
 * trace can no longer be force-closed retroactively.
 */
export function endAgentTrace(
  traceId: string,
  options: {
    output?: string
    metadata?: Record<string, unknown>
  }
): void {
  appendLocalTraceEvent({
    type: "trace.end",
    traceId,
    output: options.output,
    metadata: options.metadata,
  })

  const trace = activeTraces.get(traceId)
  if (trace) {
    try {
      trace.update({
        output: options.output,
        metadata: options.metadata,
      })
    } catch (error) {
      console.error("[Langfuse] Failed to end trace:", error)
    }
  }
  activeTraces.delete(traceId)
  traceSpanIds.delete(traceId)
  traceGenerationIds.delete(traceId)
}

/**
 * Create a span for a tool call.
 */
export function createToolSpan(
  traceId: string,
  spanId: string,
  options: {
    name: string
    input?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
): LangfuseSpanClient | null {
  appendLocalTraceEvent({
    type: "span.start",
    traceId,
    spanId,
    name: options.name,
    input: options.input,
    metadata: options.metadata,
  })

  // Index the span against its trace so abort/finalize can force-close it.
  let spanSet = traceSpanIds.get(traceId)
  if (!spanSet) {
    spanSet = new Set()
    traceSpanIds.set(traceId, spanSet)
  }
  spanSet.add(spanId)

  const trace = activeTraces.get(traceId)
  if (!trace) return null

  try {
    const span = trace.span({
      name: options.name,
      input: options.input,
      metadata: options.metadata,
    })
    activeSpans.set(spanId, span)
    return span
  } catch (error) {
    console.error("[Langfuse] Failed to create span:", error)
    return null
  }
}

/**
 * End a tool span with output.
 */
export function endToolSpan(
  spanId: string,
  options: {
    output?: unknown
    metadata?: Record<string, unknown>
    level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR"
    statusMessage?: string
  }
): void {
  appendLocalTraceEvent({
    type: "span.end",
    spanId,
    output: options.output,
    metadata: options.metadata,
    level: options.level,
    statusMessage: options.statusMessage,
  })

  const span = activeSpans.get(spanId)
  if (span) {
    try {
      span.end({
        output: options.output,
        metadata: options.metadata,
        level: options.level,
        statusMessage: options.statusMessage,
      })
    } catch (error) {
      console.error("[Langfuse] Failed to end span:", error)
    }
  }
  activeSpans.delete(spanId)
  // Drop reverse index entry too.
  for (const [traceId, set] of traceSpanIds) {
    if (set.delete(spanId) && set.size === 0) {
      traceSpanIds.delete(traceId)
    }
  }
}

/**
 * Create a generation for an LLM call.
 */
export function createLLMGeneration(
  traceId: string | null,
  generationId: string,
  options: {
    name: string
    model: string
    modelParameters?: Record<string, unknown>
    input: unknown
    metadata?: Record<string, unknown>
  }
): LangfuseGenerationClient | null {
  appendLocalTraceEvent({
    type: "generation.start",
    traceId: traceId ?? undefined,
    generationId,
    name: options.name,
    model: options.model,
    modelParameters: options.modelParameters,
    input: options.input,
    metadata: options.metadata,
  })

  if (traceId) {
    let genSet = traceGenerationIds.get(traceId)
    if (!genSet) {
      genSet = new Set()
      traceGenerationIds.set(traceId, genSet)
    }
    genSet.add(generationId)
  }

  const langfuse = getLangfuse()
  if (!langfuse) return null

  try {
    // If we have a trace, create the generation under it
    const trace = traceId ? activeTraces.get(traceId) : null

    // Cast metadata to any to satisfy Langfuse's flexible type
    const generation = trace
      ? trace.generation({
          name: options.name,
          model: options.model,
          modelParameters: options.modelParameters as any,
          input: options.input,
          metadata: options.metadata as any,
        })
      : langfuse.generation({
          name: options.name,
          model: options.model,
          modelParameters: options.modelParameters as any,
          input: options.input,
          metadata: options.metadata as any,
        })

    activeGenerations.set(generationId, generation)
    return generation
  } catch (error) {
    console.error("[Langfuse] Failed to create generation:", error)
    return null
  }
}

/**
 * End an LLM generation with output and usage metrics.
 */
export function endLLMGeneration(
  generationId: string,
  options: {
    output?: string
    usage?: {
      promptTokens?: number
      completionTokens?: number
      totalTokens?: number
    }
    metadata?: Record<string, unknown>
    level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR"
    statusMessage?: string
  }
): void {
  appendLocalTraceEvent({
    type: "generation.end",
    generationId,
    output: options.output,
    usage: options.usage,
    metadata: options.metadata,
    level: options.level,
    statusMessage: options.statusMessage,
  })

  const generation = activeGenerations.get(generationId)
  if (generation) {
    try {
      generation.end({
        output: options.output,
        usage: options.usage,
        metadata: options.metadata,
        level: options.level,
        statusMessage: options.statusMessage,
      })
    } catch (error) {
      console.error("[Langfuse] Failed to end generation:", error)
    }
  }
  activeGenerations.delete(generationId)
  for (const [traceId, set] of traceGenerationIds) {
    if (set.delete(generationId) && set.size === 0) {
      traceGenerationIds.delete(traceId)
    }
  }
}

/**
 * Force-close any spans/generations still open under the given trace, emitting
 * matching `span.end` / `generation.end` events with the supplied error metadata.
 *
 * Intended for run finalization (abort/stop/reinitialize/shutdown) so local
 * trace files don't end up with unbalanced lifecycle events.
 */
export function forceCloseTraceOperations(
  traceId: string,
  options: {
    level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR"
    statusMessage?: string
  } = {},
): { closedSpans: number; closedGenerations: number } {
  const level = options.level ?? "ERROR"
  const status = options.statusMessage ?? "Run ended before observation completed"

  const spans = traceSpanIds.get(traceId)
  const generations = traceGenerationIds.get(traceId)

  let closedSpans = 0
  let closedGenerations = 0

  if (spans) {
    for (const spanId of Array.from(spans)) {
      endToolSpan(spanId, {
        level,
        statusMessage: status,
      })
      closedSpans++
    }
  }

  if (generations) {
    for (const generationId of Array.from(generations)) {
      endLLMGeneration(generationId, {
        level,
        statusMessage: status,
      })
      closedGenerations++
    }
  }

  return { closedSpans, closedGenerations }
}

/**
 * Flush all pending events to Langfuse
 */
export async function flushLangfuse(): Promise<void> {
  const langfuse = getLangfuse()
  if (!langfuse) return

  try {
    await langfuse.flushAsync()
  } catch (error) {
    console.error("[Langfuse] Failed to flush:", error)
  }
}

/**
 * Shutdown Langfuse, awaiting any in-flight events. Use at app shutdown.
 */
export async function shutdownLangfuse(): Promise<void> {
  if (!langfuseInstance) return
  try {
    await langfuseInstance.shutdownAsync()
  } catch (error) {
    console.error("[Langfuse] Failed to shutdown:", error)
  } finally {
    langfuseInstance = null
  }
}
