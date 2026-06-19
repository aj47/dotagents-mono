/**
 * Repeat Task Service
 * Manages scheduled repeat tasks that run at regular intervals.
 *
 * Tasks are stored as individual `.agents/tasks/<task-id>/task.md` files
 * (global + optional workspace overlay). Legacy `config.json` loops are
 * migrated on first load.
 */

import fs from "fs"
import path from "path"
import { createHash } from "crypto"
import { configStore, dataFolder, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { getRendererHandlers } from "@egoist/tipc/main"
import { logApp } from "./debug"
import { conversationService } from "./conversation-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { agentProfileService, createSessionSnapshotFromProfile } from "./agent-profile-service"
import type {
  ConversationRepeatTaskRole,
  ConversationRepeatTaskSource,
  LoopConfig,
  SessionProfileSnapshot,
} from "../shared/types"
import { formatRepeatTaskTitle } from "../shared/repeat-tasks"
import type { RendererHandlers } from "./renderer-handlers"
import { WINDOWS } from "./window"
import { desktopTTSPlaybackCoordinator } from "./tts-playback-coordinator"
import { getAgentsLayerPaths } from "./agents-files/modular-config"
import {
  getTasksDir,
  loadTasksLayer,
  writeTaskFile,
  writeAllTaskFiles,
  deleteTaskFiles,
} from "./agents-files/tasks"

export interface LoopStatus {
  id: string
  name: string
  enabled: boolean
  isRunning: boolean
  lastRunAt?: number
  nextRunAt?: number
  intervalMinutes: number
  schedule?: LoopConfig["schedule"]
}

export interface LoopTriggerOptions {
  clientSessionId?: string
}

export interface LoopExecutionResult {
  loopId: string
  conversationId?: string
  sessionId?: string
}

export function isContinuousLoop(loop: Pick<LoopConfig, "runContinuously">): boolean {
  return loop.runContinuously === true
}

const REPEAT_TASK_PROVENANCE_BACKFILL_MARKER = "repeat-task-conversation-provenance-v3.json"
const REPEAT_TASK_PROVENANCE_BACKFILL_VERSION = 3

interface RepeatTaskProvenanceBackfillMarker {
  version: typeof REPEAT_TASK_PROVENANCE_BACKFILL_VERSION
  backfilledAt: number
  updatedCount: number
  taskSignatures: Record<string, string>
}

const DEFAULT_CRITIQUE_PASS_PROMPT = [
  "You are the built-in critic for this repeat-task run.",
  "Review the worker agent's latest answer against the original task prompt.",
  "Inspect any local files, artifact paths, or URLs explicitly referenced in the original prompt or worker answer when they are available and material to the review.",
  "Judge the produced artifacts and decisions, not just the worker's summary.",
  "Be concrete and skeptical: identify factual gaps, unsupported assumptions, missed requirements, weak reasoning, artifact defects, and risky actions.",
  "Return concise critique only. Do not rewrite the full answer.",
].join("\n")

function buildCritiquePassPrompt(loop: LoopConfig, workerResult: string): string {
  return `${DEFAULT_CRITIQUE_PASS_PROMPT}\n\nOriginal repeat-task prompt:\n${loop.prompt}\n\nWorker agent's latest answer:\n${workerResult}`
}

function buildWorkerRevisionPrompt(critique: string): string {
  return [
    "The built-in critic reviewed your previous answer for this repeat-task run.",
    "Use the critique below to produce the final revised answer.",
    "Address valid issues, correct mistakes, fill important gaps, and keep the final answer focused on the original task.",
    "Do not mention the critique process unless it is necessary for the result.",
    "",
    "Critique:",
    critique,
  ].join("\n")
}

function getLatestAssistantMessageContent(conversation: { messages: Array<{ role: string; content?: string }> } | null | undefined): string {
  const messages = conversation?.messages ?? []
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message.role === "assistant" && typeof message.content === "string" && message.content.trim()) {
      return message.content.trim()
    }
  }
  return ""
}

function buildRepeatTaskConversationSource(
  loop: Pick<LoopConfig, "id" | "name">,
  runId: string,
  role: ConversationRepeatTaskRole,
): ConversationRepeatTaskSource {
  return {
    type: "repeat_task_run",
    taskId: loop.id,
    taskName: loop.name,
    runId,
    role,
  }
}

function getRepeatTaskBackfillSignature(loop: Pick<LoopConfig, "name" | "prompt">): string {
  return createHash("sha256")
    .update(JSON.stringify({
      name: loop.name.trim(),
      prompt: loop.prompt.trim(),
    }))
    .digest("hex")
}

function normalizeRepeatTaskBackfillPrompt(prompt: string): string {
  return prompt.replace(/\r\n/g, "\n").trim()
}

class LoopService {
  private static instance: LoopService | null = null
  private activeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private loopNextRunAt: Map<string, number> = new Map()
  private executingLoops: Set<string> = new Set()
  private repeatTaskBackfillTimer: ReturnType<typeof setTimeout> | null = null
  private isStopping: boolean = false
  /** In-memory cache of all tasks (merged from global + workspace layers). */
  private loops: LoopConfig[] = []

  static getInstance(): LoopService {
    if (!LoopService.instance) {
      LoopService.instance = new LoopService()
    }
    return LoopService.instance
  }

  private constructor() {
    this.loadFromDisk()
    this.scheduleRepeatTaskConversationBackfill()
  }

  private scheduleRepeatTaskConversationBackfill(): void {
    if (this.repeatTaskBackfillTimer) {
      clearTimeout(this.repeatTaskBackfillTimer)
    }

    this.repeatTaskBackfillTimer = setTimeout(() => {
      this.repeatTaskBackfillTimer = null
      void this.backfillRepeatTaskConversationSources()
    }, 250)
  }

  private async backfillRepeatTaskConversationSources(): Promise<void> {
    if (this.loops.length === 0) return
    const markerPath = path.join(dataFolder, REPEAT_TASK_PROVENANCE_BACKFILL_MARKER)
    const marker = this.readRepeatTaskProvenanceBackfillMarker(markerPath)

    const pendingSources = this.loops.flatMap((loop) => {
      const signature = getRepeatTaskBackfillSignature(loop)
      if (marker.taskSignatures[loop.id] === signature) {
        return []
      }
      return [{
        taskId: loop.id,
        taskName: loop.name,
        prompt: loop.prompt,
        role: "worker" as const,
        signature,
      }]
    })

    if (pendingSources.length === 0) return

    const promptCounts = new Map<string, number>()
    for (const loop of this.loops) {
      const prompt = normalizeRepeatTaskBackfillPrompt(loop.prompt)
      if (!prompt) continue
      promptCounts.set(prompt, (promptCounts.get(prompt) ?? 0) + 1)
    }

    const safePendingSources = pendingSources.filter((source) => {
      const prompt = normalizeRepeatTaskBackfillPrompt(source.prompt)
      return prompt && promptCounts.get(prompt) === 1
    })
    const skippedAmbiguousCount = pendingSources.length - safePendingSources.length
    if (skippedAmbiguousCount > 0) {
      logApp(`[LoopService] Skipped repeat-task provenance backfill for ${skippedAmbiguousCount} task(s) with ambiguous prompts`)
    }
    if (safePendingSources.length === 0) return

    const backfillRepeatTaskSourcesByPrompt = (conversationService as {
      backfillRepeatTaskSourcesByPrompt?: typeof conversationService.backfillRepeatTaskSourcesByPrompt
    }).backfillRepeatTaskSourcesByPrompt
    if (typeof backfillRepeatTaskSourcesByPrompt !== "function") return

    try {
      const updatedCount = await backfillRepeatTaskSourcesByPrompt.call(
        conversationService,
        safePendingSources.map((source) => ({
          taskId: source.taskId,
          taskName: source.taskName,
          prompt: source.prompt,
          role: source.role,
        })),
      )
      const nextTaskSignatures = { ...marker.taskSignatures }
      for (const source of safePendingSources) {
        nextTaskSignatures[source.taskId] = source.signature
      }
      fs.mkdirSync(dataFolder, { recursive: true })
      fs.writeFileSync(
        markerPath,
        JSON.stringify({
          version: REPEAT_TASK_PROVENANCE_BACKFILL_VERSION,
          backfilledAt: Date.now(),
          updatedCount: marker.updatedCount + updatedCount,
          taskSignatures: nextTaskSignatures,
        } satisfies RepeatTaskProvenanceBackfillMarker, null, 2),
      )
    } catch (error) {
      logApp("[LoopService] Failed to backfill repeat-task conversation provenance:", error)
    }
  }

  private readRepeatTaskProvenanceBackfillMarker(markerPath: string): RepeatTaskProvenanceBackfillMarker {
    const fallback: RepeatTaskProvenanceBackfillMarker = {
      version: REPEAT_TASK_PROVENANCE_BACKFILL_VERSION,
      backfilledAt: 0,
      updatedCount: 0,
      taskSignatures: {},
    }

    if (!fs.existsSync(markerPath)) return fallback

    try {
      const marker = JSON.parse(fs.readFileSync(markerPath, "utf8")) as Partial<RepeatTaskProvenanceBackfillMarker>
      if (
        marker.version === REPEAT_TASK_PROVENANCE_BACKFILL_VERSION &&
        typeof marker.updatedCount === "number" &&
        marker.taskSignatures &&
        typeof marker.taskSignatures === "object" &&
        !Array.isArray(marker.taskSignatures)
      ) {
        return {
          version: REPEAT_TASK_PROVENANCE_BACKFILL_VERSION,
          backfilledAt: typeof marker.backfilledAt === "number" ? marker.backfilledAt : 0,
          updatedCount: marker.updatedCount,
          taskSignatures: marker.taskSignatures,
        }
      }
    } catch (error) {
      logApp("[LoopService] Failed to read repeat-task conversation provenance backfill marker:", error)
    }

    return fallback
  }

  // ============================================================================
  // Persistence — load / save / delete
  // ============================================================================

  /** Load tasks from .agents/tasks/ (global + workspace), migrating from config.json if needed. */
  private loadFromDisk(): void {
    const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
    const globalResult = loadTasksLayer(globalLayer)

    const workspaceDir = resolveWorkspaceAgentsFolder()
    let workspaceTasks: LoopConfig[] = []
    if (workspaceDir) {
      const workspaceLayer = getAgentsLayerPaths(workspaceDir)
      workspaceTasks = loadTasksLayer(workspaceLayer).tasks
    }

    if (globalResult.tasks.length > 0 || workspaceTasks.length > 0) {
      // Merge: workspace overrides global by ID
      const mergedById = new Map<string, LoopConfig>()
      for (const t of globalResult.tasks) mergedById.set(t.id, t)
      for (const t of workspaceTasks) mergedById.set(t.id, t) // workspace wins
      this.loops = Array.from(mergedById.values())
      logApp(`[LoopService] Loaded ${this.loops.length} task(s) from .agents/tasks/`)
      return
    }

    // Migration: if config.json has loops but .agents/tasks/ is empty, migrate
    const legacyLoops = configStore.get().loops || []
    if (legacyLoops.length > 0) {
      this.loops = [...legacyLoops]
      try {
        writeAllTaskFiles(globalLayer, legacyLoops, { onlyIfMissing: true, maxBackups: 10 })
        logApp(`[LoopService] Migrated ${legacyLoops.length} task(s) from config.json to .agents/tasks/`)
      } catch (error) {
        logApp("[LoopService] Error migrating tasks to modular files:", error)
      }
      return
    }

    this.loops = []
  }

  /** Persist a single task to the global .agents/tasks/ layer. */
  private saveTask(task: LoopConfig, loopsSnapshot: LoopConfig[] = this.loops): boolean {
    let savedTaskFile = true
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      writeTaskFile(globalLayer, task, { maxBackups: 10 })
    } catch (error) {
      savedTaskFile = false
      logApp("[LoopService] Error saving task file:", error)
    }
    // Shadow: keep config.json in sync for backward compatibility
    if (savedTaskFile) {
      this.syncToConfigJson(loopsSnapshot)
    }
    return savedTaskFile
  }

  /** Remove a task's files from the global .agents/tasks/ layer. */
  private removeTaskFiles(taskId: string): void {
    try {
      const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
      deleteTaskFiles(globalLayer, taskId)
    } catch (error) {
      logApp("[LoopService] Error deleting task files:", error)
    }
    this.syncToConfigJson()
  }

  /** Shadow-write all loops back to config.json for backward compatibility. */
  private syncToConfigJson(loopsSnapshot: LoopConfig[] = this.loops): boolean {
    try {
      const config = configStore.get()
      configStore.save({ ...config, loops: loopsSnapshot })
      return true
    } catch {
      // best-effort
      return false
    }
  }

  // ============================================================================
  // Public API — CRUD
  // ============================================================================

  /** Get all loops. */
  getLoops(): LoopConfig[] {
    return this.loops
  }

  /** Get a single loop by ID. */
  getLoop(loopId: string): LoopConfig | undefined {
    return this.loops.find((l) => l.id === loopId)
  }

  /** Save (create or update) a loop. */
  saveLoop(loop: LoopConfig): boolean {
    const idx = this.loops.findIndex((l) => l.id === loop.id)
    const existingLoop = idx >= 0 ? this.loops[idx] : undefined
    const shouldBackfillAfterSave =
      !existingLoop ||
      getRepeatTaskBackfillSignature(existingLoop) !== getRepeatTaskBackfillSignature(loop)
    const nextLoops = idx >= 0
      ? this.loops.map((existingLoop, existingIdx) => existingIdx === idx ? loop : existingLoop)
      : [...this.loops, loop]

    const saved = this.saveTask(loop, nextLoops)
    if (!saved) {
      return false
    }

    this.loops = nextLoops
    if (shouldBackfillAfterSave) {
      this.scheduleRepeatTaskConversationBackfill()
    }
    return true
  }

  /** Delete a loop. */
  deleteLoop(loopId: string): boolean {
    const idx = this.loops.findIndex((l) => l.id === loopId)
    if (idx === -1) return false
    this.loops.splice(idx, 1)
    this.stopLoop(loopId)
    this.removeTaskFiles(loopId)
    return true
  }

  /** Reload tasks from disk (for external changes). */
  reload(): void {
    this.loadFromDisk()
    this.scheduleRepeatTaskConversationBackfill()
  }

  /** Reload tasks from disk and rebuild scheduling state for external file changes. */
  reloadAndRestartAllLoops(): void {
    this.stopAllLoops()
    this.reload()
    this.resumeScheduling()
    this.startAllLoops()
  }

  // ============================================================================
  // Scheduling
  // ============================================================================

  startAllLoops(): void {
    logApp(`[LoopService] Starting all loops. Found ${this.loops.length} configured loops.`)

    for (const loop of this.loops) {
      if (loop.enabled) {
        this.startLoop(loop.id)
      }
    }
  }

  stopAllLoops(): void {
    this.isStopping = true
    logApp(`[LoopService] Stopping all loops. Active timers: ${this.activeTimers.size}`)
    for (const [loopId] of this.activeTimers) {
      this.stopLoop(loopId)
    }
  }

  resumeScheduling(): void {
    this.isStopping = false
  }

  /**
   * Durably stop any continuously-running tasks so they do not auto-resume.
   *
   * Emergency stop is treated as an explicit cancel signal: each affected
   * continuous loop is disabled (`enabled = false`) in memory AND persisted,
   * its active timer is cleared, and the renderer is notified so the UI
   * reflects the new state. The user must re-enable the task to start it
   * again.
   *
   * Persistence-failure safety: the in-memory `this.loops` entry is mutated
   * BEFORE we attempt to persist, so an in-flight `executeLoop()` cannot
   * pass the `latestLoop?.enabled` check in its `finally` block and
   * reschedule, even if the on-disk write fails. Without this ordering, a
   * failed `saveLoop()` would leave the in-memory record enabled and the
   * continuous task would auto-resume — exactly the bug we're fixing.
   *
   * Non-continuous (interval / scheduled) tasks are intentionally left alone —
   * their next run is governed by a wall-clock schedule, not by the
   * just-interrupted execution.
   *
   * Returns the IDs of the loops that were disabled.
   */
  emergencyStopContinuousLoops(): string[] {
    const disabled: string[] = []

    for (let i = 0; i < this.loops.length; i++) {
      const loop = this.loops[i]
      if (!isContinuousLoop(loop)) continue
      if (!loop.enabled) continue

      const updated: LoopConfig = { ...loop, enabled: false }

      // Mutate in-memory state FIRST. This is the critical guard against
      // auto-resume: `executeLoop()`'s finally re-reads via `getLoop()`,
      // so even if the persistence call below fails, the reschedule check
      // will see `enabled: false` and skip rescheduling.
      this.loops[i] = updated

      // Clear any pending timer for this loop.
      this.stopLoop(loop.id)
      disabled.push(loop.id)

      // Best-effort persistence. `saveTask` already swallows write errors
      // and returns false; we log loudly so the failure is investigable
      // but do not unwind the in-memory cancel.
      const persisted = this.saveTask(updated)
      if (!persisted) {
        logApp(
          `[LoopService] Emergency stop: failed to persist disabled state for "${loop.name}" (${loop.id}); in-memory cancel still blocks auto-resume`,
        )
      } else {
        logApp(`[LoopService] Emergency stop disabled continuous loop "${loop.name}" (${loop.id})`)
      }
    }

    if (disabled.length > 0) {
      notifyLoopsFolderChanged()
    }

    return disabled
  }

  startLoop(loopId: string): boolean {
    const loop = this.getLoop(loopId)
    if (!loop) {
      logApp(`[LoopService] Cannot start loop ${loopId}: not found`)
      return false
    }

    if (!loop.enabled) {
      logApp(`[LoopService] Not starting loop ${loopId}: disabled`)
      return false
    }

    this.clearScheduledTimer(loopId)

    logApp(`[LoopService] Started loop "${loop.name}" (${loopId}), ${describeLoopSchedule(loop)}`)

    if (loop.runOnStartup || isContinuousLoop(loop)) {
      const reason = isContinuousLoop(loop) ? "continuous" : "runOnStartup"
      logApp(`[LoopService] Loop "${loop.name}" starts immediately (${reason})`)
      setImmediate(() => {
        void this.executeLoop(loopId, { rescheduleAfterRun: true })
      })
    } else {
      this.scheduleNextRun(loopId, this.getNextDelayMs(loop))
    }

    return true
  }

  stopLoop(loopId: string): boolean {
    const hadTimer = this.activeTimers.has(loopId)
    this.clearScheduledTimer(loopId)

    if (!hadTimer) {
      logApp(`[LoopService] Stop requested for ${loopId}: no scheduled timer`)
      return false
    }

    logApp(`[LoopService] Stopped loop ${loopId}`)
    return true
  }

  async triggerLoop(loopId: string, options: LoopTriggerOptions = {}): Promise<LoopExecutionResult | null> {
    const loop = this.getLoop(loopId)
    if (!loop) {
      logApp(`[LoopService] Cannot trigger loop ${loopId}: not found`)
      return null
    }

    if (this.executingLoops.has(loopId)) {
      logApp(`[LoopService] Skip manual trigger for "${loop.name}" (${loopId}): already executing`)
      return null
    }

    logApp(`[LoopService] Manually triggering loop "${loop.name}" (${loopId})`)
    // Reschedule after manual run if the loop is enabled so we don't lose the timer
    const shouldReschedule = loop.enabled && this.activeTimers.has(loopId)
    return await this.executeLoop(loopId, {
      rescheduleAfterRun: shouldReschedule,
      clientSessionId: options.clientSessionId,
    })
  }

  getLoopStatuses(): LoopStatus[] {
    return this.loops.map((loop) => ({
      id: loop.id,
      name: loop.name,
      enabled: loop.enabled,
      isRunning: this.executingLoops.has(loop.id),
      lastRunAt: loop.lastRunAt,
      nextRunAt: this.loopNextRunAt.get(loop.id),
      intervalMinutes: loop.intervalMinutes,
      schedule: loop.schedule,
    }))
  }

  getLoopStatus(loopId: string): LoopStatus | undefined {
    const loop = this.getLoop(loopId)
    if (!loop) {
      return undefined
    }

    return {
      id: loop.id,
      name: loop.name,
      enabled: loop.enabled,
      isRunning: this.executingLoops.has(loop.id),
      lastRunAt: loop.lastRunAt,
      nextRunAt: this.loopNextRunAt.get(loop.id),
      intervalMinutes: loop.intervalMinutes,
      schedule: loop.schedule,
    }
  }

  private async executeLoop(loopId: string, options: { rescheduleAfterRun: boolean; clientSessionId?: string }): Promise<LoopExecutionResult | null> {
    const loop = this.getLoop(loopId)

    if (!loop) {
      logApp(`[LoopService] Cannot execute loop ${loopId}: not found`)
      return null
    }

    if (this.executingLoops.has(loopId)) {
      logApp(`[LoopService] Skip execution for "${loop.name}" (${loopId}): already executing`)
      return null
    }

    this.executingLoops.add(loopId)
    this.clearScheduledTimer(loopId)

    logApp(`[LoopService] Executing loop "${loop.name}" (${loopId})`)
    let conversationId: string | undefined
    let sessionId: string | undefined

    try {
      // Update lastRunAt in memory and persist
      loop.lastRunAt = Date.now()
      this.saveTask(loop)
      const repeatTaskRunId = `${loop.id}:${loop.lastRunAt}`
      const workerRepeatTaskSource = buildRepeatTaskConversationSource(loop, repeatTaskRunId, "worker")

      let profileSnapshot: SessionProfileSnapshot | undefined
      if (loop.profileId) {
        const profile = agentProfileService.getById(loop.profileId)
        if (profile) {
          profileSnapshot = createSessionSnapshotFromProfile(profile)
        }
      }

      const conversationTitle = formatRepeatTaskTitle(loop.name)
      // Always start snoozed so the panel stays hidden during execution.
      // When `speakOnTrigger` is set, we unsnooze *after* the loop completes
      // so the renderer's TTS auto-play gate fires on the finished response
      // without popping the panel open for the entire run.
      const startSnoozed = true

      // Try to resume a prior session if `continueInSession` is enabled and
      // we have a `lastSessionId` (either auto-tracked from the previous run
      // or user-pinned via the settings UI).
      //
      // Order of operations matters: we must confirm the prior conversation
      // is loadable and the session is revivable BEFORE mutating the
      // conversation — otherwise a stale/evicted session would leave an
      // orphaned user prompt in the old conversation while this iteration
      // falls back to a brand-new session.
      if (loop.continueInSession && loop.lastSessionId) {
        const priorSessionId = loop.lastSessionId
        const priorConversationId = agentSessionTracker.getConversationIdForSession(priorSessionId)
        if (priorConversationId) {
          // Read-only existence check first; no mutation yet.
          const priorConversation = await conversationService.loadConversation(priorConversationId)
          if (priorConversation && agentSessionTracker.reviveSession(priorSessionId, startSnoozed)) {
            // Both the conversation and the session are intact; now it's safe
            // to append the new prompt.
            const appended = await conversationService.addMessageToConversation(
              priorConversationId,
              loop.prompt,
              "user",
            )
            if (appended) {
              conversationId = priorConversationId
              sessionId = priorSessionId
              await conversationService.renameConversationTitle(
                conversationId,
                conversationTitle,
                "system",
              )
              await conversationService.markConversationRepeatTaskSource(conversationId, workerRepeatTaskSource)
              agentSessionTracker.updateSession(sessionId, {
                conversationTitle,
                isRepeatTask: true,
                repeatTask: workerRepeatTaskSource,
              })
              logApp(`[LoopService] Resumed session ${sessionId} for loop "${loop.name}" (snoozed=${startSnoozed})`)
            } else {
              // Append failed after we'd already revived the session; put it
              // back into the completed set so we don't leak an "active"
              // session with no run/completion update attached to it.
              agentSessionTracker.completeSession(priorSessionId)
              logApp(`[LoopService] Append failed after revive for loop "${loop.name}"; re-completed session ${priorSessionId}`)
            }
          }
        }
        // On any failure above we fall through to the fresh-session branch;
        // the final `saveLoop` below overwrites `lastSessionId` with the new
        // one, so no separate "clear stale pointer" write is needed.
      }

      // Otherwise (or on fallback) create a fresh conversation + session.
      if (!sessionId || !conversationId) {
        const conversation = await conversationService.createConversation(loop.prompt, "user")
        conversationId = conversation.id
        if (options.clientSessionId) {
          conversation.clientSessionId = options.clientSessionId
          await conversationService.saveConversation(conversation, true)
        }
        await conversationService.renameConversationTitle(
          conversationId,
          conversationTitle,
          "system",
        )
        await conversationService.markConversationRepeatTaskSource(conversationId, workerRepeatTaskSource)
        sessionId = agentSessionTracker.startSession(
          conversationId,
          conversationTitle,
          startSnoozed,
          profileSnapshot,
          { isRepeatTask: true, repeatTask: workerRepeatTaskSource },
        )
        logApp(`[LoopService] Created session ${sessionId} for loop "${loop.name}" (snoozed=${startSnoozed})`)
      }

      if (loop.continueInSession) {
        const latest = this.getLoop(loopId)
        if (latest && latest.lastSessionId !== sessionId) {
          this.saveLoop({ ...latest, lastSessionId: sessionId })
        }
      }

      // Reuse the main agent execution flow.
      const { runAgentLoopSession } = await import("./tipc")
      const workerResult = await runAgentLoopSession(
        loop.prompt,
        conversationId,
        sessionId,
        startSnoozed,
        loop.maxIterations,
        { conversationTitle },
      )

      if (loop.critiquePass) {
        const critiquePrompt = buildCritiquePassPrompt(loop, workerResult)
        const criticConversation = await conversationService.createConversation(critiquePrompt, "user")
        const criticTitle = formatRepeatTaskTitle(`${loop.name} critique`)
        await conversationService.renameConversationTitle(
          criticConversation.id,
          criticTitle,
          "system",
        )
        const criticRepeatTaskSource = buildRepeatTaskConversationSource(loop, `${repeatTaskRunId}:critic`, "critic")
        await conversationService.markConversationRepeatTaskSource(criticConversation.id, criticRepeatTaskSource)

        let criticProfileSnapshot: SessionProfileSnapshot | undefined
        if (loop.criticProfileId) {
          const criticProfile = agentProfileService.getById(loop.criticProfileId)
          if (criticProfile) {
            criticProfileSnapshot = createSessionSnapshotFromProfile(criticProfile)
          } else {
            logApp(`[LoopService] Critic profile "${loop.criticProfileId}" not found for loop "${loop.name}"; using default agent`)
          }
        }

        const criticSessionId = agentSessionTracker.startSession(
          criticConversation.id,
          criticTitle,
          startSnoozed,
          criticProfileSnapshot,
          { isRepeatTask: true, repeatTask: criticRepeatTaskSource },
        )
        logApp(`[LoopService] Created critic session ${criticSessionId} for loop "${loop.name}"`)

        const critiqueResult = await runAgentLoopSession(
          critiquePrompt,
          criticConversation.id,
          criticSessionId,
          startSnoozed,
          loop.maxIterations,
          { conversationTitle: criticTitle },
        )
        const critiqueConversation = await conversationService.loadConversation(criticConversation.id)
        const critique = getLatestAssistantMessageContent(critiqueConversation) || critiqueResult.trim()

        if (critique) {
          const revisionPrompt = buildWorkerRevisionPrompt(critique)
          if (agentSessionTracker.reviveSession(sessionId, startSnoozed)) {
            agentSessionTracker.updateSession(sessionId, {
              conversationTitle,
              isRepeatTask: true,
              repeatTask: workerRepeatTaskSource,
            })

            const appendedRevision = await conversationService.addMessageToConversation(
              conversationId,
              revisionPrompt,
              "user",
            )

            if (appendedRevision) {
              await runAgentLoopSession(
                revisionPrompt,
                conversationId,
                sessionId,
                startSnoozed,
                loop.maxIterations,
                { conversationTitle },
              )
              logApp(`[LoopService] Fed critique pass back into worker session ${sessionId} for loop "${loop.name}"`)
            } else {
              agentSessionTracker.completeSession(sessionId)
              logApp(`[LoopService] Failed to append critique pass revision prompt for loop "${loop.name}"`)
            }
          } else {
            logApp(`[LoopService] Worker session ${sessionId} was not revivable for loop "${loop.name}"; skipping critique pass revision`)
          }
        } else {
          logApp(`[LoopService] Critic produced no critique for loop "${loop.name}"`)
        }
      }

      // When `speakOnTrigger` is set, unsnooze the now-completed session and
      // show the panel so the renderer's TTS auto-play gate fires for the
      // assistant response. The session ran silently in the background; this
      // wakes it up only after the result is ready.
      if (loop.speakOnTrigger && sessionId) {
        desktopTTSPlaybackCoordinator.clearSessionKeys(sessionId)

        // Clear stale TTS tracking keys for this session in all renderer
        // windows.  For continueInSession loops the sessionId is reused across
        // runs, so keys from the previous run would still be in the module-level
        // played-set and cause hasTTSPlayed() to block the new auto-play.
        const { WINDOWS: wins } = await import("./window")
        for (const [id, win] of wins.entries()) {
          try {
            getRendererHandlers<RendererHandlers>(win.webContents).clearSessionTTSKeys?.send(sessionId)
          } catch (e) {
            logApp(`[LoopService] clearSessionTTSKeys send to ${id} failed:`, e)
          }
        }

        const { setTrackedAgentSessionSnoozed } = await import("./floating-panel-session-state")
        setTrackedAgentSessionSnoozed(sessionId, false)

        // Show the panel and focus the completed session so the renderer
        // renders the CompactMessage with isSnoozed=false, triggering TTS.
        const { showPanelWindow, resizePanelForAgentMode, getWindowRendererHandlers } = await import("./window")
        resizePanelForAgentMode()
        showPanelWindow({ markOpenedWithMain: false })
        try {
          getWindowRendererHandlers("panel")?.focusAgentSession.send(sessionId)
        } catch (e) {
          logApp(`[LoopService] Failed to focus session ${sessionId} after speakOnTrigger unsnooze:`, e)
        }
        logApp(`[LoopService] Unsnoozed session ${sessionId} for loop "${loop.name}" (speakOnTrigger)`)
      }

      return { loopId, conversationId, sessionId }
    } catch (error) {
      logApp(`[LoopService] Error executing loop "${loop.name}":`, error)
      return { loopId, conversationId, sessionId }
    } finally {
      this.executingLoops.delete(loopId)

      if (options.rescheduleAfterRun && !this.isStopping) {
        const latestLoop = this.getLoop(loopId)
        if (latestLoop?.enabled) {
          this.scheduleNextRun(loopId, this.getNextDelayMs(latestLoop))
        }
      }
    }
  }

  private scheduleNextRun(loopId: string, delayMs: number): void {
    this.clearScheduledTimer(loopId)
    this.loopNextRunAt.set(loopId, Date.now() + delayMs)

    const timer = setTimeout(() => {
      this.activeTimers.delete(loopId)
      this.loopNextRunAt.delete(loopId)
      void this.executeLoop(loopId, { rescheduleAfterRun: true })
    }, delayMs)

    this.activeTimers.set(loopId, timer)
  }

  private clearScheduledTimer(loopId: string): void {
    const timer = this.activeTimers.get(loopId)
    if (timer) {
      clearTimeout(timer)
    }
    this.activeTimers.delete(loopId)
    this.loopNextRunAt.delete(loopId)
  }

  private getNextDelayMs(loop: LoopConfig, now: number = Date.now()): number {
    if (isContinuousLoop(loop)) {
      return 0
    }

    if (loop.schedule) {
      const nextRun = computeNextScheduledRun(loop.schedule, now)
      if (nextRun !== null) {
        return Math.max(1000, nextRun - now)
      }
      logApp(`[LoopService] Loop ${loop.id} has invalid schedule; falling back to interval`)
    }
    return this.getIntervalMs(loop)
  }

  private getIntervalMs(loop: LoopConfig): number {
    const safeMinutes = Number.isFinite(loop.intervalMinutes) && loop.intervalMinutes >= 1
      ? Math.floor(loop.intervalMinutes)
      : 1

    if (safeMinutes !== loop.intervalMinutes) {
      logApp(`[LoopService] Loop ${loop.id} has invalid interval (${loop.intervalMinutes}), clamping to ${safeMinutes} minute(s)`)
    }

    return safeMinutes * 60 * 1000
  }
}

export const loopService = LoopService.getInstance()

// ============================================================================
// Schedule helpers
// ============================================================================

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function parseTimeToHM(time: string): { h: number; m: number } | null {
  if (!TIME_RE.test(time)) return null
  const [h, m] = time.split(":").map(Number)
  return { h, m }
}

/**
 * Compute the next scheduled run timestamp (ms since epoch) strictly after `now`,
 * interpreting all times in the machine's local timezone. Returns null if the
 * schedule is malformed (no valid times, or weekly with no valid days).
 */
export function computeNextScheduledRun(
  schedule: NonNullable<LoopConfig["schedule"]>,
  now: number,
): number | null {
  const hmList: Array<{ h: number; m: number }> = []
  for (const t of schedule.times) {
    const hm = parseTimeToHM(t)
    if (hm) hmList.push(hm)
  }
  if (hmList.length === 0) return null

  const allowedDays = schedule.type === "weekly"
    ? new Set(schedule.daysOfWeek.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))
    : null
  if (allowedDays && allowedDays.size === 0) return null

  // Scan up to 8 days ahead (covers a full week plus today).
  const base = new Date(now)
  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset)
    if (allowedDays && !allowedDays.has(day.getDay())) continue
    for (const { h, m } of hmList) {
      const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0).getTime()
      if (candidate > now) return candidate
    }
  }
  return null
}

function describeLoopSchedule(loop: LoopConfig): string {
  if (isContinuousLoop(loop)) return "continuous"
  if (!loop.schedule) return `interval: ${loop.intervalMinutes}m`
  const s = loop.schedule
  const times = s.times.join(", ")
  if (s.type === "daily") return `schedule: daily at ${times}`
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const days = s.daysOfWeek.map((d) => dayNames[d] ?? String(d)).join(",")
  return `schedule: weekly ${days} at ${times}`
}

function notifyLoopsFolderChanged(): void {
  const windows = [WINDOWS.get("main"), WINDOWS.get("panel")]
  for (const win of windows) {
    if (!win) continue
    try {
      const handlers = getRendererHandlers<RendererHandlers>(win.webContents)
      handlers.loopsFolderChanged?.send()
    } catch {
      // Window may not be ready yet, ignore.
    }
  }
}

let tasksWatchers: fs.FSWatcher[] = []
let tasksDebounceTimer: ReturnType<typeof setTimeout> | null = null
const TASKS_DEBOUNCE_MS = 500

function getCanonicalTasksDirs(): string[] {
  const globalLayer = getAgentsLayerPaths(globalAgentsFolder)
  const globalTasksDir = getTasksDir(globalLayer)
  const dirs = [globalTasksDir]

  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  if (workspaceAgentsFolder) {
    const workspaceLayer = getAgentsLayerPaths(workspaceAgentsFolder)
    dirs.push(getTasksDir(workspaceLayer))
  }

  return dirs
}

function handleTasksWatcherEvent(eventType: string, filename: string | null): void {
  const isUnknownChange = !filename
  const isTaskFile = filename?.endsWith("task.md") || filename?.endsWith(".md")
  const isDirectory = filename ? !filename.includes(".") : false

  if (!isUnknownChange && !isTaskFile && !isDirectory) return

  logApp(`[LoopService] Tasks folder changed: ${eventType} ${filename ?? "(unknown)"}`)

  if (tasksDebounceTimer) {
    clearTimeout(tasksDebounceTimer)
  }

  tasksDebounceTimer = setTimeout(() => {
    tasksDebounceTimer = null
    if (process.platform === "linux" && (isDirectory || isUnknownChange)) {
      refreshLinuxTaskWatchers()
    }

    try {
      loopService.reloadAndRestartAllLoops()
    } catch (error) {
      logApp("[LoopService] Failed to reload repeat tasks after external change:", error)
    }

    notifyLoopsFolderChanged()
  }, TASKS_DEBOUNCE_MS)
}

function setupTasksWatcher(dirPath: string): fs.FSWatcher | null {
  try {
    const watcher = fs.watch(dirPath, (eventType, filename) => {
      handleTasksWatcherEvent(eventType, filename)
    })

    watcher.on("error", (error) => {
      logApp(`[LoopService] Tasks folder watcher error for ${dirPath}:`, error)
    })

    return watcher
  } catch (error) {
    logApp(`[LoopService] Failed to watch tasks folder ${dirPath}:`, error)
    return null
  }
}

function refreshLinuxTaskWatchers(): void {
  if (process.platform !== "linux") return

  stopTasksFolderWatcher()

  const dirs = getCanonicalTasksDirs()
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    const rootWatcher = setupTasksWatcher(dir)
    if (rootWatcher) tasksWatchers.push(rootWatcher)

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const watcher = setupTasksWatcher(`${dir}/${entry.name}`)
        if (watcher) tasksWatchers.push(watcher)
      }
    } catch {
      // best-effort
    }
  }
}

export function startTasksFolderWatcher(): void {
  if (tasksWatchers.length > 0) {
    logApp("[LoopService] Tasks folder watcher already running")
    return
  }

  const dirs = getCanonicalTasksDirs()

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })

    try {
      if (process.platform === "linux") {
        const rootWatcher = setupTasksWatcher(dir)
        if (rootWatcher) tasksWatchers.push(rootWatcher)

        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          const watcher = setupTasksWatcher(`${dir}/${entry.name}`)
          if (watcher) tasksWatchers.push(watcher)
        }
      } else {
        const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
          handleTasksWatcherEvent(eventType, filename)
        })

        watcher.on("error", (error) => {
          logApp(`[LoopService] Tasks folder watcher error for ${dir}:`, error)
        })

        tasksWatchers.push(watcher)
      }

      logApp(`[LoopService] Started watching tasks folder: ${dir}`)
    } catch (error) {
      logApp(`[LoopService] Failed to start tasks folder watcher for ${dir}:`, error)
    }
  }
}

export function stopTasksFolderWatcher(): void {
  for (const watcher of tasksWatchers) {
    try {
      watcher.close()
    } catch {
      // Ignore close errors.
    }
  }

  if (tasksWatchers.length > 0) {
    logApp(`[LoopService] Stopped ${tasksWatchers.length} tasks folder watcher(s)`)
    tasksWatchers = []
  }

  if (tasksDebounceTimer) {
    clearTimeout(tasksDebounceTimer)
    tasksDebounceTimer = null
  }
}
