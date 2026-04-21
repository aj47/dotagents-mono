/**
 * Repeat Task Service
 * Manages scheduled repeat tasks that run at regular intervals.
 *
 * Tasks are stored as individual `.agents/tasks/<task-id>/task.md` files
 * (global + optional workspace overlay). Legacy `config.json` loops are
 * migrated on first load.
 */

import fs from "fs"
import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import { getRendererHandlers } from "@egoist/tipc/main"
import { logApp } from "./debug"
import { conversationService } from "./conversation-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { agentProfileService, createSessionSnapshotFromProfile } from "./agent-profile-service"
import type { LoopConfig, SessionProfileSnapshot } from "../shared/types"
import type { RendererHandlers } from "./renderer-handlers"
import { WINDOWS } from "./window"
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

export function isContinuousLoop(loop: Pick<LoopConfig, "runContinuously">): boolean {
  return loop.runContinuously === true
}

class LoopService {
  private static instance: LoopService | null = null
  private activeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private loopNextRunAt: Map<string, number> = new Map()
  private executingLoops: Set<string> = new Set()
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
    const nextLoops = idx >= 0
      ? this.loops.map((existingLoop, existingIdx) => existingIdx === idx ? loop : existingLoop)
      : [...this.loops, loop]

    const saved = this.saveTask(loop, nextLoops)
    if (!saved) {
      return false
    }

    this.loops = nextLoops
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

  async triggerLoop(loopId: string): Promise<boolean> {
    const loop = this.getLoop(loopId)
    if (!loop) {
      logApp(`[LoopService] Cannot trigger loop ${loopId}: not found`)
      return false
    }

    if (this.executingLoops.has(loopId)) {
      logApp(`[LoopService] Skip manual trigger for "${loop.name}" (${loopId}): already executing`)
      return false
    }

    logApp(`[LoopService] Manually triggering loop "${loop.name}" (${loopId})`)
    // Reschedule after manual run if the loop is enabled so we don't lose the timer
    const shouldReschedule = loop.enabled && this.activeTimers.has(loopId)
    await this.executeLoop(loopId, { rescheduleAfterRun: shouldReschedule })
    return true
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

  private async executeLoop(loopId: string, options: { rescheduleAfterRun: boolean }): Promise<void> {
    const loop = this.getLoop(loopId)

    if (!loop) {
      logApp(`[LoopService] Cannot execute loop ${loopId}: not found`)
      return
    }

    if (this.executingLoops.has(loopId)) {
      logApp(`[LoopService] Skip execution for "${loop.name}" (${loopId}): already executing`)
      return
    }

    this.executingLoops.add(loopId)
    this.clearScheduledTimer(loopId)

    logApp(`[LoopService] Executing loop "${loop.name}" (${loopId})`)

    try {
      // Update lastRunAt in memory and persist
      loop.lastRunAt = Date.now()
      this.saveTask(loop)

      let profileSnapshot: SessionProfileSnapshot | undefined
      if (loop.profileId) {
        const profile = agentProfileService.getById(loop.profileId)
        if (profile) {
          profileSnapshot = createSessionSnapshotFromProfile(profile)
        }
      }

      const conversationTitle = `[Repeat] ${loop.name}`
      // Always start snoozed so the panel stays hidden during execution.
      // When `speakOnTrigger` is set, we unsnooze *after* the loop completes
      // so the renderer's TTS auto-play gate fires on the finished response
      // without popping the panel open for the entire run.
      const startSnoozed = true

      let conversationId: string | undefined
      let sessionId: string | undefined

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
        sessionId = agentSessionTracker.startSession(
          conversationId,
          conversationTitle,
          startSnoozed,
          profileSnapshot,
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
      await runAgentLoopSession(loop.prompt, conversationId, sessionId, startSnoozed)

      // When `speakOnTrigger` is set, unsnooze the now-completed session and
      // show the panel so the renderer's TTS auto-play gate fires for the
      // assistant response. The session ran silently in the background; this
      // wakes it up only after the result is ready.
      if (loop.speakOnTrigger && sessionId) {
        // Clear stale TTS tracking keys for this session in all renderer
        // windows.  For continueInSession loops the sessionId is reused across
        // runs, so keys from the previous run would still be in the module-level
        // played-set and cause hasTTSPlayed() to block the new auto-play.
        const { WINDOWS: wins } = await import("./window")
        for (const win of wins.values()) {
          try {
            getRendererHandlers<RendererHandlers>(win.webContents).clearSessionTTSKeys?.send(sessionId)
          } catch {}
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
    } catch (error) {
      logApp(`[LoopService] Error executing loop "${loop.name}":`, error)
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
