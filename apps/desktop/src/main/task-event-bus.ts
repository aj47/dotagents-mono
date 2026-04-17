/**
 * TaskEventBus — central hub for event-triggered tasks.
 *
 * Emits typed events from existing choke points (session lifecycle, tool calls,
 * user messages, app boot) and routes them to LoopService-registered handlers.
 * All loop-prevention / debounce / per-session cap logic lives here so the
 * emission sites and LoopService stay simple.
 */

import { logApp } from "./debug"
import type { LoopTriggerConfig, LoopTriggerEvent } from "../shared/types"

// ============================================================================
// Event payload types
// ============================================================================

export interface BaseEventPayload {
  sessionId?: string
  conversationId?: string
  profileId?: string
  /** triggerDepth of the source session, if any. */
  triggerDepth?: number
  /** triggeringLoopId of the source session, if any. */
  triggeringLoopId?: string
  timestamp: number
}

export interface SessionEndPayload extends BaseEventPayload {
  status: "completed" | "stopped" | "error"
  finalActivity?: string
  errorMessage?: string
}

export interface ToolCallPayload extends BaseEventPayload {
  toolName: string
  toolArguments?: Record<string, unknown>
  isError?: boolean
}

export interface UserMessagePayload extends BaseEventPayload {
  content: string
}

export interface AppStartPayload {
  timestamp: number
}

export type EventPayloadMap = {
  onSessionEnd: SessionEndPayload
  onToolCall: ToolCallPayload
  onUserMessage: UserMessagePayload
  onAppStart: AppStartPayload
}

// ============================================================================
// Handler registration
// ============================================================================

export interface TaskEventHandler<E extends LoopTriggerEvent = LoopTriggerEvent> {
  loopId: string
  event: E
  config: LoopTriggerConfig | undefined
  fire: (payload: EventPayloadMap[E]) => Promise<void>
}

// ============================================================================
// Defaults & constants
// ============================================================================

const DEFAULT_MIN_INTERVAL_MS = 1000
const DEFAULT_MAX_TRIGGER_DEPTH = 1
const DEFAULT_MAX_RUNS_PER_SESSION_SESSION_END = 1
const DEFAULT_MAX_RUNS_PER_SESSION_OTHER = 10
const GLOBAL_PENDING_CEILING = 50

function getMaxRunsPerSession(event: LoopTriggerEvent, cfg: LoopTriggerConfig | undefined): number {
  if (cfg?.maxRunsPerSession !== undefined) return cfg.maxRunsPerSession
  return event === "onSessionEnd"
    ? DEFAULT_MAX_RUNS_PER_SESSION_SESSION_END
    : DEFAULT_MAX_RUNS_PER_SESSION_OTHER
}

function getMaxTriggerDepth(cfg: LoopTriggerConfig | undefined): number {
  return cfg?.maxTriggerDepth ?? DEFAULT_MAX_TRIGGER_DEPTH
}

function getMinIntervalMs(cfg: LoopTriggerConfig | undefined): number {
  return cfg?.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS
}

function getExcludeTriggered(cfg: LoopTriggerConfig | undefined): boolean {
  return cfg?.excludeTriggered ?? true
}


// ============================================================================
// Filter logic
// ============================================================================

function matchesFilters<E extends LoopTriggerEvent>(
  event: E,
  payload: EventPayloadMap[E],
  cfg: LoopTriggerConfig | undefined,
  loopId: string,
): { ok: true } | { ok: false; reason: string } {
  const p = payload as BaseEventPayload & Partial<ToolCallPayload>

  // Self-trigger guard: task cannot fire on events from its own spawned session.
  if (p.triggeringLoopId && p.triggeringLoopId === loopId) {
    return { ok: false, reason: "self-trigger" }
  }

  // Causality depth guard.
  const depth = p.triggerDepth ?? 0
  const maxDepth = getMaxTriggerDepth(cfg)
  if (depth > maxDepth) {
    return { ok: false, reason: `depth ${depth} > maxTriggerDepth ${maxDepth}` }
  }

  // excludeTriggered (default true): on session-end, skip sessions that came
  // from a task. Applies only when the source session has a triggeringLoopId.
  if (event === "onSessionEnd" && getExcludeTriggered(cfg) && p.triggeringLoopId) {
    return { ok: false, reason: "excludeTriggered" }
  }

  // profileId filter.
  if (cfg?.profileId && p.profileId !== cfg.profileId) {
    return { ok: false, reason: `profileId ${p.profileId} != ${cfg.profileId}` }
  }

  // toolName filter (onToolCall only).
  if (event === "onToolCall" && cfg?.toolName) {
    if ((p as ToolCallPayload).toolName !== cfg.toolName) {
      return { ok: false, reason: `toolName ${(p as ToolCallPayload).toolName} != ${cfg.toolName}` }
    }
  }

  return { ok: true }
}

// ============================================================================
// TaskEventBus singleton
// ============================================================================

class TaskEventBus {
  private static instance: TaskEventBus | null = null
  private handlers: Map<LoopTriggerEvent, TaskEventHandler[]> = new Map()
  /** Last-fire timestamp per `${loopId}::${event}` for per-handler debounce. */
  private lastFiredByLoop: Map<string, number> = new Map()
  /** Per-(loopId, sessionId) run counter. */
  private runsByLoopSession: Map<string, number> = new Map()
  /** Count of in-flight handler invocations for the global ceiling. */
  private pendingCount = 0

  static getInstance(): TaskEventBus {
    if (!TaskEventBus.instance) TaskEventBus.instance = new TaskEventBus()
    return TaskEventBus.instance
  }

  private constructor() {}

  /**
   * Replace all handlers for a given loopId. Called on LoopService reload.
   * Pass an empty array to unsubscribe a loop entirely.
   */
  setHandlersForLoop(loopId: string, handlers: TaskEventHandler[]): void {
    // Remove existing entries for this loopId across all event buckets.
    for (const [ev, list] of this.handlers.entries()) {
      const filtered = list.filter((h) => h.loopId !== loopId)
      this.handlers.set(ev, filtered)
    }
    // Insert new handlers.
    for (const h of handlers) {
      const bucket = this.handlers.get(h.event) ?? []
      bucket.push(h)
      this.handlers.set(h.event, bucket)
    }
  }

  /** Unregister all handlers (used on shutdown / full clear). */
  clearAllHandlers(): void {
    this.handlers.clear()
    this.lastFiredByLoop.clear()
    this.runsByLoopSession.clear()
  }

  /** Reset per-session counters when a session ends (called from onSessionEnd). */
  private resetSessionCounters(sessionId: string | undefined): void {
    if (!sessionId) return
    for (const key of Array.from(this.runsByLoopSession.keys())) {
      if (key.endsWith(`::${sessionId}`)) this.runsByLoopSession.delete(key)
    }
  }

  /** Emit an event to all subscribed handlers. Fire-and-forget. */
  emit<E extends LoopTriggerEvent>(event: E, payload: EventPayloadMap[E]): void {
    const bucket = this.handlers.get(event)
    if (!bucket || bucket.length === 0) {
      if (event === "onSessionEnd") {
        this.resetSessionCounters((payload as SessionEndPayload).sessionId)
      }
      return
    }

    for (const handler of bucket) {
      void this.dispatch(handler, payload as EventPayloadMap[LoopTriggerEvent])
    }

    // Reset per-session counters AFTER dispatching, so onSessionEnd fires can
    // still consult counters from mid-session events.
    if (event === "onSessionEnd") {
      this.resetSessionCounters((payload as SessionEndPayload).sessionId)
    }
  }

  private async dispatch(
    handler: TaskEventHandler,
    payload: EventPayloadMap[LoopTriggerEvent],
  ): Promise<void> {
    const { loopId, event, config, fire } = handler

    const filter = matchesFilters(event, payload, config, loopId)
    if (!filter.ok) {
      const reason = (filter as { ok: false; reason: string }).reason
      logApp(`[TaskEventBus] Skip loop ${loopId} on ${event}: ${reason}`)
      return
    }

    // Debounce — keyed by (loopId, event) so two different events subscribed
    // by the same loop don't suppress each other within minIntervalMs.
    const now = Date.now()
    const debounceKey = `${loopId}::${event}`
    const last = this.lastFiredByLoop.get(debounceKey) ?? 0
    const minInterval = getMinIntervalMs(config)
    if (now - last < minInterval) {
      logApp(`[TaskEventBus] Skip loop ${loopId} on ${event}: debounce (${now - last}ms < ${minInterval}ms)`)
      return
    }

    // Global pending ceiling: refuse BEFORE consuming per-session quota so a
    // dropped-under-load fire doesn't permanently eat budget.
    if (this.pendingCount >= GLOBAL_PENDING_CEILING) {
      logApp(`[TaskEventBus] Drop loop ${loopId} on ${event}: global pending ceiling ${this.pendingCount}/${GLOBAL_PENDING_CEILING}`)
      return
    }

    // Per-session run cap.
    const sessionId = (payload as BaseEventPayload).sessionId
    if (sessionId) {
      const key = `${loopId}::${sessionId}`
      const runs = this.runsByLoopSession.get(key) ?? 0
      const maxRuns = getMaxRunsPerSession(event, config)
      if (runs >= maxRuns) {
        logApp(`[TaskEventBus] Skip loop ${loopId} on ${event}: session cap ${runs}/${maxRuns}`)
        return
      }
      this.runsByLoopSession.set(key, runs + 1)
    }

    this.lastFiredByLoop.set(debounceKey, now)
    this.pendingCount++

    try {
      await fire(payload)
    } catch (err) {
      logApp(`[TaskEventBus] Handler for loop ${loopId} (${event}) threw: ${err}`)
    } finally {
      this.pendingCount--
    }
  }

  // --------------------------------------------------------------------------
  // Test-only inspection helpers. Not exported; accessed via __testUtils below.
  // --------------------------------------------------------------------------

  _debugHandlerCount(event: LoopTriggerEvent): number {
    return (this.handlers.get(event) ?? []).length
  }

  _debugRunsForSession(loopId: string, sessionId: string): number {
    return this.runsByLoopSession.get(`${loopId}::${sessionId}`) ?? 0
  }

  _debugResetAll(): void {
    this.clearAllHandlers()
    this.pendingCount = 0
  }
}

export const taskEventBus = TaskEventBus.getInstance()
