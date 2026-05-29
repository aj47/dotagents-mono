/**
 * Langfuse Service
 * Provides observability and monitoring for LLM calls and agent operations.
 *
 * Key features:
 * - LLM call tracing with token counts and costs
 * - Agent session traces
 * - MCP tool call instrumentation
 * - Optional/configurable (won't block functionality if not configured)
 * - Langfuse is an OPTIONAL dependency - this module handles its absence gracefully
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
  flushLocalTraceLogger,
  isLocalTraceLoggingEnabled,
  resetLocalTraceLogger,
} from "./local-trace-logger"

// Singleton Langfuse instance
let langfuseInstance: LangfuseInstance | null = null

// Active traces and spans for linking
const activeTraces = new Map<string, LangfuseTraceClient>()
const activeSpans = new Map<string, LangfuseSpanClient>()
const activeGenerations = new Map<string, LangfuseGenerationClient>()

// Reverse-link maps from span/generation id back to their owning langfuse trace id.
// These let force-close paths (abort, reinit, shutdown) iterate the active spans
// and generations that belong to a given trace without needing the caller to track
// them. Entries are added on creation and removed on end.
const spanTraceLinks = new Map<string, string>()
const generationTraceLinks = new Map<string, string>()

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
 * Whether trace instrumentation should run at all.
 *
 * Local trace logging is intentionally independent of Langfuse Cloud, so callers
 * should use this when deciding whether to create trace/generation/span events.
 */
export function isTracingEnabled(): boolean {
  return isLangfuseEnabled() || isLocalTraceLoggingEnabled()
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
 * Reinitialize Langfuse when config changes.
 *
 * Any active spans/generations are force-closed with ERROR level before the
 * Langfuse instance is shut down so consumers see a clear terminal event
 * instead of orphaned in-flight records.
 */
export async function reinitializeLangfuse(): Promise<void> {
  // Snapshot then iterate so endToolSpan/endLLMGeneration can mutate the maps.
  for (const spanId of Array.from(activeSpans.keys())) {
    endToolSpan(spanId, {
      level: "ERROR",
      statusMessage: "Langfuse reinitialized",
    })
  }
  for (const generationId of Array.from(activeGenerations.keys())) {
    endLLMGeneration(generationId, {
      output: "",
      level: "ERROR",
      statusMessage: "Langfuse reinitialized",
    })
  }

  if (langfuseInstance) {
    try {
      await langfuseInstance.shutdownAsync()
    } catch (error) {
      console.error("[Langfuse] Failed to shut down on reinit:", error)
    }
    langfuseInstance = null
  }
  // Clear all active traces/spans and reverse links
  activeTraces.clear()
  activeSpans.clear()
  activeGenerations.clear()
  spanTraceLinks.clear()
  generationTraceLinks.clear()
  // Local trace logger caches the resolved path; reset so config changes apply.
  resetLocalTraceLogger()
}

/**
 * Create a new trace for an agent session
 *
 * Langfuse concepts:
 * - sessionId: Groups multiple traces together (e.g., a conversation thread)
 * - trace id: Individual trace within a session (e.g., one agent interaction)
 * - userId: The user who initiated the trace
 * - tags: Categorization labels for filtering in the Langfuse dashboard
 * - release: Application version for tracking across releases
 *
 * @param traceId - Unique ID for this trace (our internal sessionId)
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
 * Get an existing trace by session ID
 */
export function getAgentTrace(sessionId: string): LangfuseTraceClient | null {
  return activeTraces.get(sessionId) || null
}

/**
 * End a trace with output
 */
export function endAgentTrace(
  sessionId: string,
  options: {
    output?: string
    metadata?: Record<string, unknown>
  }
): void {
  appendLocalTraceEvent({
    type: "trace.end",
    traceId: sessionId,
    output: options.output,
    metadata: options.metadata,
  })

  const trace = activeTraces.get(sessionId)
  if (!trace) return

  try {
    trace.update({
      output: options.output,
      metadata: options.metadata,
    })
    activeTraces.delete(sessionId)
  } catch (error) {
    console.error("[Langfuse] Failed to end trace:", error)
  }
}

/**
 * Create a span for a tool call.
 *
 * @param traceId The per-run Langfuse trace id, NOT a DotAgents session id.
 *   Each agent RUN has its own UUID, generated in `processTranscriptWithAgentMode`
 *   or `processTranscriptWithACPAgent`. The DotAgents session id (long-lived
 *   across many runs in the same UI session) lives on the trace metadata
 *   under `agentSessionId`.
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

  // Remember the reverse link unconditionally so force-close paths work even
  // when langfuse cloud is not configured (local-trace-only mode).
  spanTraceLinks.set(spanId, traceId)

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
 *
 * Idempotent: if the span has already been ended (e.g. by `forceCloseActiveTrace`
 * during an abort), this is a no-op so callers don't have to track lifecycle
 * state themselves.
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
  // If neither the langfuse span client nor the reverse trace link is around,
  // the span has already been ended (or was never opened). Drop the event so
  // we don't emit duplicate span.end lines after a force-close.
  const span = activeSpans.get(spanId)
  const hasLink = spanTraceLinks.has(spanId)
  if (!span && !hasLink) return

  appendLocalTraceEvent({
    type: "span.end",
    spanId,
    output: options.output,
    metadata: options.metadata,
    level: options.level,
    statusMessage: options.statusMessage,
  })

  spanTraceLinks.delete(spanId)

  if (!span) return

  try {
    span.end({
      output: options.output,
      metadata: options.metadata,
      level: options.level,
      statusMessage: options.statusMessage,
    })
    activeSpans.delete(spanId)
  } catch (error) {
    console.error("[Langfuse] Failed to end span:", error)
  }
}

/**
 * Create a generation for an LLM call.
 *
 * @param traceId The per-run Langfuse trace id, NOT a DotAgents session id.
 *   When null, the generation is created as an orphan (no parent trace), which
 *   is the correct behaviour for callers that have no agent run associated
 *   (e.g. MCP sampling). When set, it must be the run-scoped UUID generated
 *   by `processTranscriptWithAgentMode` / `processTranscriptWithACPAgent`.
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

  // Remember the reverse link unconditionally so force-close paths work even
  // when langfuse cloud is not configured (local-trace-only mode).
  if (traceId) {
    generationTraceLinks.set(generationId, traceId)
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
 *
 * Idempotent: if the generation has already been ended (e.g. via
 * `forceCloseActiveTrace` during an abort), this is a no-op.
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
  const generation = activeGenerations.get(generationId)
  const hasLink = generationTraceLinks.has(generationId)
  if (!generation && !hasLink) return

  appendLocalTraceEvent({
    type: "generation.end",
    generationId,
    output: options.output,
    usage: options.usage,
    metadata: options.metadata,
    level: options.level,
    statusMessage: options.statusMessage,
  })

  generationTraceLinks.delete(generationId)

  if (!generation) return

  try {
    generation.end({
      output: options.output,
      usage: options.usage,
      metadata: options.metadata,
      level: options.level,
      statusMessage: options.statusMessage,
    })
    activeGenerations.delete(generationId)
  } catch (error) {
    console.error("[Langfuse] Failed to end generation:", error)
  }
}

/**
 * Force-close any active spans and generations attached to a trace.
 *
 * Used when an agent run is aborted or otherwise terminates abnormally so the
 * trace doesn't leave dangling in-flight events. Does NOT end the trace itself
 * — callers must still call `endAgentTrace` to finalize the trace.
 *
 * Subsequent normal end calls (e.g. from `mcp-service.endSpanAndReturn`) for
 * the same span ids are no-ops, since `endToolSpan` / `endLLMGeneration` are
 * idempotent.
 */
export function forceCloseActiveTrace(
  traceId: string,
  reason: { statusMessage: string; level?: "ERROR" | "WARNING" }
): void {
  const level = reason.level ?? "ERROR"

  // Snapshot keys first because endToolSpan/endLLMGeneration mutate the maps.
  const spanIds: string[] = []
  for (const [spanId, owningTraceId] of spanTraceLinks.entries()) {
    if (owningTraceId === traceId) spanIds.push(spanId)
  }
  for (const spanId of spanIds) {
    endToolSpan(spanId, {
      output: { error: reason.statusMessage },
      level,
      statusMessage: reason.statusMessage,
    })
  }

  const generationIds: string[] = []
  for (const [generationId, owningTraceId] of generationTraceLinks.entries()) {
    if (owningTraceId === traceId) generationIds.push(generationId)
  }
  for (const generationId of generationIds) {
    endLLMGeneration(generationId, {
      output: "",
      level,
      statusMessage: reason.statusMessage,
    })
  }
}

/**
 * Best-effort cleanup at app shutdown.
 *
 * Force-closes any active spans, generations, and traces, flushes pending
 * local + langfuse events, then shuts down the langfuse client. Safe to call
 * multiple times.
 */
export async function shutdownLangfuse(): Promise<void> {
  for (const spanId of Array.from(activeSpans.keys())) {
    endToolSpan(spanId, {
      level: "ERROR",
      statusMessage: "App shutdown",
    })
  }
  // Also catch any links left over (e.g. local-trace-only mode where the
  // langfuse activeSpans map is empty but link entries still exist).
  for (const spanId of Array.from(spanTraceLinks.keys())) {
    endToolSpan(spanId, {
      level: "ERROR",
      statusMessage: "App shutdown",
    })
  }

  for (const generationId of Array.from(activeGenerations.keys())) {
    endLLMGeneration(generationId, {
      output: "",
      level: "ERROR",
      statusMessage: "App shutdown",
    })
  }
  for (const generationId of Array.from(generationTraceLinks.keys())) {
    endLLMGeneration(generationId, {
      output: "",
      level: "ERROR",
      statusMessage: "App shutdown",
    })
  }

  // Snapshot trace ids first because endAgentTrace mutates activeTraces.
  const traceIds = Array.from(activeTraces.keys())
  for (const traceId of traceIds) {
    endAgentTrace(traceId, {
      output: "",
      metadata: { shutdown: true },
    })
  }

  await flushLangfuse()

  if (langfuseInstance) {
    try {
      await langfuseInstance.shutdownAsync()
    } catch (error) {
      console.error("[Langfuse] Failed to shut down:", error)
    }
    langfuseInstance = null
  }
}

/**
 * Flush all pending events to Langfuse
 */
export async function flushLangfuse(): Promise<void> {
  await flushLocalTraceLogger()

  const langfuse = getLangfuse()
  if (!langfuse) return

  try {
    await langfuse.flushAsync()
  } catch (error) {
    console.error("[Langfuse] Failed to flush:", error)
  }
}
