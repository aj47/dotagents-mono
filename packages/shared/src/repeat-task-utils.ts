import type {
  Loop,
  LoopDeleteResponse,
  LoopMutationResponse,
  LoopRunResponse,
  LoopsResponse,
  LoopToggleResponse,
} from "./api-types"

export type RepeatTaskScheduleMode = "continuous" | "interval" | "daily" | "weekly"

export type RepeatTaskSchedule =
  | { type: "daily"; times: string[] }
  | { type: "weekly"; times: string[]; daysOfWeek: number[] }

export type RepeatTaskCadence = {
  intervalMinutes: number
  runContinuously?: boolean
  schedule?: RepeatTaskSchedule | null
}

export type RepeatTaskScheduleParseResult =
  | { ok: true; schedule?: RepeatTaskSchedule | null }
  | { ok: false; error: string }

export type RepeatTaskRequestParseResult<T> =
  | { ok: true; request: T }
  | { ok: false; statusCode: 400; error: string }

export type RepeatTaskCreateRequest = {
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  profileId?: string
  runOnStartup: boolean
  speakOnTrigger: boolean
  continueInSession: boolean
  lastSessionId?: string
  runContinuously: boolean
  maxIterations?: number
  schedule?: RepeatTaskSchedule | null
}

export type RepeatTaskUpdateRequest = {
  name?: string
  prompt?: string
  intervalMinutes?: number
  enabled?: boolean
  profileId?: string | null
  runOnStartup?: boolean
  speakOnTrigger?: boolean
  continueInSession?: boolean
  lastSessionId?: string | null
  runContinuously?: boolean
  maxIterations?: number | null
  schedule?: RepeatTaskSchedule | null
}

export type RepeatTaskRecord = {
  id: string
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  profileId?: string
  runOnStartup?: boolean
  speakOnTrigger?: boolean
  continueInSession?: boolean
  lastSessionId?: string
  runContinuously?: boolean
  maxIterations?: number
  schedule?: RepeatTaskSchedule
}

export type RepeatTaskApiRecord = RepeatTaskRecord & {
  lastRunAt?: number
}

export type RepeatTaskLayerRecord = {
  id: string
}

export type RepeatTaskStatusLike = {
  id?: string
  lastRunAt?: number
  isRunning?: boolean
  nextRunAt?: number
}

export type RepeatTaskApiFormatOptions = {
  profileName?: string
  status?: RepeatTaskStatusLike
}

export type RepeatTasksResponseOptions = {
  statuses?: RepeatTaskStatusLike[]
  getProfileName?: (profileId?: string) => string | undefined
}

export type RepeatTaskIntervalMsResult = {
  delayMs: number
  intervalMinutes: number
  wasClamped: boolean
}

export type RepeatTaskNextDelayResult = {
  delayMs: number
  nextRunAt?: number
  invalidSchedule: boolean
  clampedIntervalMinutes?: number
}

export type RepeatTaskActionResult = {
  statusCode: number
  body: unknown
}

type RepeatTaskMaybePromise<T> = T | Promise<T>

export interface RepeatTaskActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface RepeatTaskLoopService<TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord> {
  getLoops(): TLoop[]
  getLoopStatuses(): RepeatTaskStatusLike[]
  getLoop(id: string): TLoop | undefined
  saveLoop(loop: TLoop): boolean
  startLoop(id: string): void
  stopLoop(id: string): void
  triggerLoop(id: string): RepeatTaskMaybePromise<boolean>
  getLoopStatus(id: string): RepeatTaskStatusLike | undefined
  deleteLoop(id: string): boolean
}

export interface RepeatTaskConfigLike<TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord> {
  loops?: TLoop[]
}

export interface RepeatTaskActionOptions<
  TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop> = RepeatTaskConfigLike<TLoop>,
> {
  loadLoopService(): RepeatTaskMaybePromise<RepeatTaskLoopService<TLoop> | null | undefined>
  getConfig(): TConfig
  saveConfig(config: TConfig): void
  createId(): string
  getProfileName?: (profileId?: string) => string | undefined
  diagnostics: RepeatTaskActionDiagnostics
}

export const REPEAT_TASK_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
export const DEFAULT_REPEAT_TASK_SCHEDULE_TIMES = ["09:00"] as const
export const DEFAULT_REPEAT_TASK_WEEKDAYS = [1, 2, 3, 4, 5] as const
export const TASK_SESSION_TITLE_PREFIX = "[Repeat] "

export function formatRepeatTaskTitle(taskName: string): string {
  return `${TASK_SESSION_TITLE_PREFIX}${taskName}`
}

export function hasRepeatTaskTitlePrefix(title: string | undefined | null): boolean {
  return typeof title === "string" && title.startsWith(TASK_SESSION_TITLE_PREFIX)
}

export function mergeRepeatTaskLayers<TTask extends RepeatTaskLayerRecord>(
  globalTasks: readonly TTask[],
  workspaceTasks: readonly TTask[],
): TTask[] {
  const mergedById = new Map<string, TTask>()
  for (const task of globalTasks) {
    mergedById.set(task.id, task)
  }
  for (const task of workspaceTasks) {
    mergedById.set(task.id, task)
  }
  return Array.from(mergedById.values())
}

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function parseTimeToHM(time: string): { h: number; m: number } | null {
  if (!TIME_RE.test(time)) return null
  const [h, m] = time.split(":").map(Number)
  return { h, m }
}

function getRequestRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 1
}

function validateOptionalBoolean(value: unknown, fieldName: string): string | undefined {
  return value !== undefined && typeof value !== "boolean"
    ? `${fieldName} must be a boolean when provided`
    : undefined
}

function validateOptionalStringOrNull(value: unknown, fieldName: string): string | undefined {
  return value !== undefined && value !== null && typeof value !== "string"
    ? `${fieldName} must be a string when provided`
    : undefined
}

function validateOptionalPositiveIntegerOrNull(value: unknown, fieldName: string): string | undefined {
  return value !== undefined && value !== null && !isPositiveInteger(value)
    ? `${fieldName} must be a finite integer >= 1 when provided`
    : undefined
}

export function sanitizeScheduleTimes(times: string[]): string[] {
  const out: string[] = []
  for (const time of times) {
    const trimmed = time.trim()
    if (TIME_RE.test(trimmed) && !out.includes(trimmed)) out.push(trimmed)
  }
  return out.sort()
}

export function parseRepeatTaskScheduleInput(raw: unknown): RepeatTaskScheduleParseResult {
  if (raw === undefined) return { ok: true, schedule: undefined }
  if (raw === null) return { ok: true, schedule: null }
  if (typeof raw !== "object") return { ok: false, error: "schedule must be an object, null, or omitted" }

  const obj = raw as Record<string, unknown>
  if (obj.type !== "daily" && obj.type !== "weekly") {
    return { ok: false, error: "schedule.type must be 'daily' or 'weekly'" }
  }
  if (!Array.isArray(obj.times) || obj.times.length === 0) {
    return { ok: false, error: "schedule.times must be a non-empty array" }
  }

  const times: string[] = []
  for (const time of obj.times) {
    if (typeof time !== "string" || !TIME_RE.test(time.trim())) {
      return { ok: false, error: "schedule.times must all be HH:MM (24h) strings" }
    }
    const trimmed = time.trim()
    if (!times.includes(trimmed)) times.push(trimmed)
  }
  times.sort()

  if (obj.type === "daily") {
    return { ok: true, schedule: { type: "daily", times } }
  }

  if (!Array.isArray(obj.daysOfWeek) || obj.daysOfWeek.length === 0) {
    return { ok: false, error: "schedule.daysOfWeek must be a non-empty array for weekly schedules" }
  }
  const daysOfWeek: number[] = []
  for (const day of obj.daysOfWeek) {
    const value = typeof day === "number" ? day : Number(day)
    if (!Number.isInteger(value) || value < 0 || value > 6) {
      return { ok: false, error: "schedule.daysOfWeek values must be integers 0..6 (Sun..Sat)" }
    }
    if (!daysOfWeek.includes(value)) daysOfWeek.push(value)
  }
  daysOfWeek.sort((a, b) => a - b)

  return { ok: true, schedule: { type: "weekly", times, daysOfWeek } }
}

export function parseRepeatTaskCreateRequestBody(
  body: unknown,
): RepeatTaskRequestParseResult<RepeatTaskCreateRequest> {
  const requestBody = getRequestRecord(body)
  const name = typeof requestBody.name === "string" ? requestBody.name.trim() : ""
  const prompt = typeof requestBody.prompt === "string" ? requestBody.prompt.trim() : ""
  if (!name || !prompt) {
    return { ok: false, statusCode: 400, error: "name and prompt are required and must be non-empty strings" }
  }

  if (requestBody.intervalMinutes !== undefined && !isPositiveInteger(requestBody.intervalMinutes)) {
    return { ok: false, statusCode: 400, error: "intervalMinutes must be a finite integer >= 1 when provided" }
  }
  if (requestBody.enabled !== undefined && typeof requestBody.enabled !== "boolean") {
    return { ok: false, statusCode: 400, error: "enabled must be a boolean when provided" }
  }
  if (requestBody.profileId !== undefined && requestBody.profileId !== null && typeof requestBody.profileId !== "string") {
    return { ok: false, statusCode: 400, error: "profileId must be a string when provided" }
  }
  for (const fieldName of ["runOnStartup", "speakOnTrigger", "continueInSession", "runContinuously"] as const) {
    const error = validateOptionalBoolean(requestBody[fieldName], fieldName)
    if (error) return { ok: false, statusCode: 400, error }
  }
  {
    const error = validateOptionalStringOrNull(requestBody.lastSessionId, "lastSessionId")
    if (error) return { ok: false, statusCode: 400, error }
  }
  {
    const error = validateOptionalPositiveIntegerOrNull(requestBody.maxIterations, "maxIterations")
    if (error) return { ok: false, statusCode: 400, error }
  }

  const scheduleResult = parseRepeatTaskScheduleInput(requestBody.schedule)
  if (scheduleResult.ok === false) {
    return { ok: false, statusCode: 400, error: scheduleResult.error }
  }

  const runContinuously = requestBody.runContinuously === true
  const continueInSession = requestBody.continueInSession === true
  const lastSessionId = typeof requestBody.lastSessionId === "string"
    ? requestBody.lastSessionId.trim() || undefined
    : undefined
  return {
    ok: true,
    request: {
      name,
      prompt,
      intervalMinutes: typeof requestBody.intervalMinutes === "number" ? requestBody.intervalMinutes : 60,
      enabled: typeof requestBody.enabled === "boolean" ? requestBody.enabled : true,
      profileId: typeof requestBody.profileId === "string" ? requestBody.profileId.trim() || undefined : undefined,
      runOnStartup: requestBody.runOnStartup === true,
      speakOnTrigger: requestBody.speakOnTrigger === true,
      continueInSession,
      ...(continueInSession && lastSessionId ? { lastSessionId } : {}),
      runContinuously,
      ...(typeof requestBody.maxIterations === "number" ? { maxIterations: requestBody.maxIterations } : {}),
      ...(!runContinuously && scheduleResult.schedule ? { schedule: scheduleResult.schedule } : {}),
    },
  }
}

export function parseRepeatTaskUpdateRequestBody(
  body: unknown,
): RepeatTaskRequestParseResult<RepeatTaskUpdateRequest> {
  const requestBody = getRequestRecord(body)
  const request: RepeatTaskUpdateRequest = {}

  if (requestBody.name !== undefined && (typeof requestBody.name !== "string" || requestBody.name.trim() === "")) {
    return { ok: false, statusCode: 400, error: "name must be a non-empty string when provided" }
  }
  if (requestBody.prompt !== undefined && (typeof requestBody.prompt !== "string" || requestBody.prompt.trim() === "")) {
    return { ok: false, statusCode: 400, error: "prompt must be a non-empty string when provided" }
  }
  if (requestBody.intervalMinutes !== undefined && !isPositiveInteger(requestBody.intervalMinutes)) {
    return { ok: false, statusCode: 400, error: "intervalMinutes must be a finite integer >= 1 when provided" }
  }
  if (requestBody.enabled !== undefined && typeof requestBody.enabled !== "boolean") {
    return { ok: false, statusCode: 400, error: "enabled must be a boolean when provided" }
  }
  if (requestBody.profileId !== undefined && requestBody.profileId !== null && typeof requestBody.profileId !== "string") {
    return { ok: false, statusCode: 400, error: "profileId must be a string when provided" }
  }
  for (const fieldName of ["runOnStartup", "speakOnTrigger", "continueInSession", "runContinuously"] as const) {
    const error = validateOptionalBoolean(requestBody[fieldName], fieldName)
    if (error) return { ok: false, statusCode: 400, error }
  }
  {
    const error = validateOptionalStringOrNull(requestBody.lastSessionId, "lastSessionId")
    if (error) return { ok: false, statusCode: 400, error }
  }
  {
    const error = validateOptionalPositiveIntegerOrNull(requestBody.maxIterations, "maxIterations")
    if (error) return { ok: false, statusCode: 400, error }
  }

  const scheduleResult = parseRepeatTaskScheduleInput(requestBody.schedule)
  if (scheduleResult.ok === false) {
    return { ok: false, statusCode: 400, error: scheduleResult.error }
  }

  if (typeof requestBody.name === "string") request.name = requestBody.name.trim()
  if (typeof requestBody.prompt === "string") request.prompt = requestBody.prompt.trim()
  if (typeof requestBody.intervalMinutes === "number") request.intervalMinutes = requestBody.intervalMinutes
  if (typeof requestBody.enabled === "boolean") request.enabled = requestBody.enabled
  if (requestBody.profileId !== undefined) {
    request.profileId = typeof requestBody.profileId === "string"
      ? requestBody.profileId.trim() || null
      : null
  }
  if (typeof requestBody.runOnStartup === "boolean") request.runOnStartup = requestBody.runOnStartup
  if (typeof requestBody.speakOnTrigger === "boolean") request.speakOnTrigger = requestBody.speakOnTrigger
  if (typeof requestBody.continueInSession === "boolean") request.continueInSession = requestBody.continueInSession
  if (requestBody.lastSessionId !== undefined) {
    request.lastSessionId = typeof requestBody.lastSessionId === "string"
      ? requestBody.lastSessionId.trim() || null
      : null
  }
  if (typeof requestBody.runContinuously === "boolean") request.runContinuously = requestBody.runContinuously
  if (requestBody.maxIterations !== undefined) {
    request.maxIterations = typeof requestBody.maxIterations === "number" ? requestBody.maxIterations : null
  }
  if (scheduleResult.schedule !== undefined) request.schedule = scheduleResult.schedule

  return { ok: true, request }
}

export function buildRepeatTaskFromCreateRequest(
  id: string,
  request: RepeatTaskCreateRequest,
): RepeatTaskRecord {
  return {
    id,
    name: request.name,
    prompt: request.prompt,
    intervalMinutes: request.intervalMinutes,
    enabled: request.enabled,
    profileId: request.profileId || undefined,
    runOnStartup: request.runOnStartup,
    speakOnTrigger: request.speakOnTrigger,
    continueInSession: request.continueInSession,
    ...(request.continueInSession && request.lastSessionId ? { lastSessionId: request.lastSessionId } : {}),
    runContinuously: request.runContinuously,
    ...(request.maxIterations !== undefined ? { maxIterations: request.maxIterations } : {}),
    ...(!request.runContinuously && request.schedule && request.schedule !== null ? { schedule: request.schedule } : {}),
  }
}

export function applyRepeatTaskUpdate<T extends RepeatTaskRecord>(
  existing: T,
  request: RepeatTaskUpdateRequest,
): T {
  const updated = {
    ...existing,
    ...(request.name !== undefined && { name: request.name }),
    ...(request.prompt !== undefined && { prompt: request.prompt }),
    ...(request.intervalMinutes !== undefined && { intervalMinutes: request.intervalMinutes }),
    ...(request.enabled !== undefined && { enabled: request.enabled }),
    ...(request.profileId !== undefined && { profileId: request.profileId || undefined }),
    ...(request.runOnStartup !== undefined && { runOnStartup: request.runOnStartup }),
    ...(request.speakOnTrigger !== undefined && { speakOnTrigger: request.speakOnTrigger }),
    ...(request.continueInSession !== undefined && { continueInSession: request.continueInSession }),
    ...(request.runContinuously !== undefined && { runContinuously: request.runContinuously }),
  } as T

  if (request.maxIterations === null) {
    delete updated.maxIterations
  } else if (request.maxIterations !== undefined) {
    updated.maxIterations = request.maxIterations
  }

  if (updated.continueInSession) {
    if (request.lastSessionId === null) {
      delete updated.lastSessionId
    } else if (typeof request.lastSessionId === "string") {
      updated.lastSessionId = request.lastSessionId
    }
  } else {
    delete updated.lastSessionId
  }

  if (updated.runContinuously) {
    delete updated.schedule
  } else if (request.schedule === null) {
    delete updated.schedule
  } else if (request.schedule !== undefined) {
    updated.schedule = request.schedule
    updated.runContinuously = false
  }

  return updated
}

export function formatRepeatTaskForApi(
  loop: RepeatTaskApiRecord,
  options: RepeatTaskApiFormatOptions = {},
): Loop {
  return {
    id: loop.id,
    name: loop.name,
    prompt: loop.prompt,
    intervalMinutes: loop.intervalMinutes,
    enabled: loop.enabled,
    profileId: loop.profileId,
    profileName: options.profileName,
    runOnStartup: loop.runOnStartup,
    speakOnTrigger: loop.speakOnTrigger,
    continueInSession: loop.continueInSession,
    lastSessionId: loop.lastSessionId,
    runContinuously: loop.runContinuously,
    maxIterations: loop.maxIterations,
    lastRunAt: options.status?.lastRunAt ?? loop.lastRunAt,
    isRunning: options.status?.isRunning ?? false,
    nextRunAt: options.status?.nextRunAt,
    schedule: loop.schedule,
  }
}

export function buildRepeatTasksResponse(
  loops: RepeatTaskApiRecord[],
  options: RepeatTasksResponseOptions = {},
): LoopsResponse {
  const statusById = new Map((options.statuses ?? [])
    .filter((status): status is RepeatTaskStatusLike & { id: string } => typeof status.id === "string")
    .map((status) => [status.id, status]))

  return {
    loops: loops.map(loop => formatRepeatTaskForApi(loop, {
      profileName: options.getProfileName?.(loop.profileId),
      status: statusById.get(loop.id),
    })),
  }
}

export function buildRepeatTaskResponse(
  loop: RepeatTaskApiRecord,
  options: RepeatTaskApiFormatOptions = {},
): { loop: Loop } {
  return { loop: formatRepeatTaskForApi(loop, options) }
}

export function buildRepeatTaskMutationResponse(
  loop: RepeatTaskApiRecord,
  options: RepeatTaskApiFormatOptions = {},
): LoopMutationResponse {
  return { success: true, loop: formatRepeatTaskForApi(loop, options) }
}

export function buildRepeatTaskToggleResponse(id: string, enabled: boolean): LoopToggleResponse {
  return { success: true, id, enabled }
}

export function buildRepeatTaskRunResponse(id: string): LoopRunResponse {
  return { success: true, id }
}

export function buildRepeatTaskDeleteResponse(id: string): LoopDeleteResponse {
  return { success: true, id }
}

function repeatTaskActionOk(body: unknown, statusCode = 200): RepeatTaskActionResult {
  return {
    statusCode,
    body,
  }
}

function repeatTaskActionError(statusCode: number, message: string): RepeatTaskActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return fallback
}

export async function getRepeatTasksAction<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(options: RepeatTaskActionOptions<TLoop, TConfig>): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await options.loadLoopService()
    const loops = loopService?.getLoops() ?? (options.getConfig().loops || [])
    const statuses = loopService?.getLoopStatuses() ?? []

    return repeatTaskActionOk(buildRepeatTasksResponse(loops, {
      statuses,
      getProfileName: options.getProfileName,
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to get repeat tasks", caughtError)
    return repeatTaskActionError(500, "Failed to get repeat tasks")
  }
}

export async function toggleRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop, TConfig>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    const loopService = await options.loadLoopService()

    if (loopService) {
      const existing = loopService.getLoop(taskId)
      if (!existing) {
        return repeatTaskActionError(404, "Repeat task not found")
      }

      const updated = { ...existing, enabled: !existing.enabled }
      const saved = loopService.saveLoop(updated)
      if (!saved) {
        return repeatTaskActionError(500, "Failed to persist repeat task toggle")
      }

      if (updated.enabled) {
        loopService.startLoop(taskId)
      } else {
        loopService.stopLoop(taskId)
      }

      return repeatTaskActionOk(buildRepeatTaskToggleResponse(taskId, updated.enabled))
    }

    const cfg = options.getConfig()
    const loops = cfg.loops || []
    const loopIndex = loops.findIndex(loop => loop.id === id)

    if (loopIndex === -1) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    const updatedLoops = [...loops]
    updatedLoops[loopIndex] = {
      ...updatedLoops[loopIndex],
      enabled: !updatedLoops[loopIndex].enabled,
    }

    options.saveConfig({ ...cfg, loops: updatedLoops } as TConfig)

    return repeatTaskActionOk(buildRepeatTaskToggleResponse(taskId, updatedLoops[loopIndex].enabled))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to toggle repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to toggle repeat task"))
  }
}

export async function runRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop, TConfig>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    const loopService = await options.loadLoopService()

    if (loopService) {
      const loopExists = loopService.getLoop(taskId)
      if (!loopExists) {
        return repeatTaskActionError(404, "Repeat task not found")
      }

      const triggered = await loopService.triggerLoop(taskId)

      if (!triggered) {
        return repeatTaskActionError(409, "Task is already running")
      }

      return repeatTaskActionOk(buildRepeatTaskRunResponse(taskId))
    }

    return repeatTaskActionError(503, "Repeat task service is unavailable")
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to run repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to run repeat task"))
  }
}

export async function createRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(body: unknown, options: RepeatTaskActionOptions<TLoop, TConfig>): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return repeatTaskActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const newLoop = buildRepeatTaskFromCreateRequest(options.createId(), parsedRequest.request) as TLoop

    const loopService = await options.loadLoopService()
    if (loopService) {
      const saved = loopService.saveLoop(newLoop)
      if (!saved) {
        return repeatTaskActionError(500, "Failed to persist repeat task")
      }

      if (newLoop.enabled) {
        loopService.startLoop(newLoop.id)
      }
    } else {
      const cfg = options.getConfig()
      const loops = [...(cfg.loops || []), newLoop]
      options.saveConfig({ ...cfg, loops } as TConfig)
    }

    const savedLoop = loopService?.getLoop(newLoop.id) ?? newLoop
    return repeatTaskActionOk(buildRepeatTaskResponse(savedLoop, {
      profileName: options.getProfileName?.(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to create repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to create repeat task"))
  }
}

export async function updateRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(id: string | undefined, body: unknown, options: RepeatTaskActionOptions<TLoop, TConfig>): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskUpdateRequestBody(body)
    if (parsedRequest.ok === false) {
      return repeatTaskActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const taskId = id ?? ""
    const loopService = await options.loadLoopService()
    let existing: TLoop | undefined
    let cfg: TConfig | undefined
    let loops: TLoop[] = []
    let loopIndex = -1

    if (loopService) {
      existing = loopService.getLoop(taskId)
    } else {
      cfg = options.getConfig()
      loops = cfg.loops || []
      loopIndex = loops.findIndex(loop => loop.id === id)
      existing = loopIndex >= 0 ? loops[loopIndex] : undefined
    }

    if (!existing) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    const updated = applyRepeatTaskUpdate(existing, parsedRequest.request)

    if (loopService) {
      const saved = loopService.saveLoop(updated)
      if (!saved) {
        return repeatTaskActionError(500, "Failed to persist repeat task")
      }

      if (updated.enabled) {
        loopService.stopLoop(taskId)
        loopService.startLoop(taskId)
      } else {
        loopService.stopLoop(taskId)
      }
    } else if (cfg && loopIndex >= 0) {
      const updatedLoops = [...loops]
      updatedLoops[loopIndex] = updated
      options.saveConfig({ ...cfg, loops: updatedLoops } as TConfig)
    }

    const savedLoop = loopService?.getLoop(taskId) ?? updated
    return repeatTaskActionOk(buildRepeatTaskMutationResponse(savedLoop, {
      profileName: options.getProfileName?.(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to update repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to update repeat task"))
  }
}

export async function deleteRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop, TConfig>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    const loopService = await options.loadLoopService()

    if (loopService) {
      const existing = loopService.getLoop(taskId)
      if (!existing) {
        return repeatTaskActionError(404, "Repeat task not found")
      }

      const deleted = loopService.deleteLoop(taskId)
      if (!deleted) {
        return repeatTaskActionError(500, "Failed to delete repeat task")
      }

      return repeatTaskActionOk(buildRepeatTaskDeleteResponse(taskId))
    }

    const cfg = options.getConfig()
    const loops = cfg.loops || []
    const loopIndex = loops.findIndex(loop => loop.id === id)

    if (loopIndex === -1) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    const updatedLoops = loops.filter(loop => loop.id !== id)
    options.saveConfig({ ...cfg, loops: updatedLoops } as TConfig)

    return repeatTaskActionOk(buildRepeatTaskDeleteResponse(taskId))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to delete repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to delete repeat task"))
  }
}

export function describeSchedule(schedule: RepeatTaskSchedule): string {
  const times = schedule.times.join(", ")
  if (schedule.type === "daily") return `Daily at ${times}`
  const days = schedule.daysOfWeek.map((day) => REPEAT_TASK_DAY_LABELS[day] ?? String(day)).join(", ")
  return `${days} at ${times}`
}

export function isContinuousRepeatTask(loop: Pick<RepeatTaskCadence, "runContinuously">): boolean {
  return loop.runContinuously === true
}

export function getRepeatTaskIntervalMs(intervalMinutes: number): RepeatTaskIntervalMsResult {
  const safeMinutes = Number.isFinite(intervalMinutes) && intervalMinutes >= 1
    ? Math.floor(intervalMinutes)
    : 1

  return {
    delayMs: safeMinutes * 60 * 1000,
    intervalMinutes: safeMinutes,
    wasClamped: safeMinutes !== intervalMinutes,
  }
}

/**
 * Compute the next scheduled run timestamp (ms since epoch) strictly after `now`,
 * interpreting all times in the machine's local timezone. Returns null if the
 * schedule is malformed (no valid times, or weekly with no valid days).
 */
export function computeNextScheduledRun(
  schedule: RepeatTaskSchedule,
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

export function getNextRepeatTaskDelayMs(
  loop: RepeatTaskCadence,
  now: number = Date.now(),
): RepeatTaskNextDelayResult {
  if (isContinuousRepeatTask(loop)) {
    return { delayMs: 0, invalidSchedule: false }
  }

  let invalidSchedule = false
  if (loop.schedule) {
    const nextRunAt = computeNextScheduledRun(loop.schedule, now)
    if (nextRunAt !== null) {
      return {
        delayMs: Math.max(1000, nextRunAt - now),
        nextRunAt,
        invalidSchedule: false,
      }
    }
    invalidSchedule = true
  }

  const interval = getRepeatTaskIntervalMs(loop.intervalMinutes)
  return {
    delayMs: interval.delayMs,
    invalidSchedule,
    ...(interval.wasClamped ? { clampedIntervalMinutes: interval.intervalMinutes } : {}),
  }
}

export function describeRepeatTaskScheduleForLog(loop: RepeatTaskCadence): string {
  if (isContinuousRepeatTask(loop)) return "continuous"
  if (!loop.schedule) return `interval: ${loop.intervalMinutes}m`
  const times = loop.schedule.times.join(", ")
  if (loop.schedule.type === "daily") return `schedule: daily at ${times}`
  const days = loop.schedule.daysOfWeek.map((d) => REPEAT_TASK_DAY_LABELS[d] ?? String(d)).join(",")
  return `schedule: weekly ${days} at ${times}`
}

export function formatLoopInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }
  const days = Math.floor(minutes / 1440)
  const remainingMinutes = minutes % 1440
  if (remainingMinutes === 0) return `${days}d`
  const hours = Math.floor(remainingMinutes / 60)
  const minutesPart = remainingMinutes % 60
  if (hours === 0) return `${days}d ${minutesPart}m`
  if (minutesPart === 0) return `${days}d ${hours}h`
  return `${days}d ${hours}h ${minutesPart}m`
}

export function describeLoopCadence(loop: RepeatTaskCadence): string {
  if (loop.runContinuously) return "Continuous"
  return loop.schedule ? describeSchedule(loop.schedule) : `Every ${formatLoopInterval(loop.intervalMinutes)}`
}

export function formatLoopIntervalDraft(minutes?: number): string {
  const normalizedMinutes = typeof minutes === "number" && Number.isFinite(minutes)
    ? Math.floor(minutes)
    : 0

  return normalizedMinutes >= 1 ? String(normalizedMinutes) : "1"
}

export function parseLoopIntervalDraft(draft: string): number | null {
  const trimmedDraft = draft.trim()
  if (!/^[0-9]+$/.test(trimmedDraft)) return null

  const parsed = Number(trimmedDraft)
  if (!Number.isInteger(parsed) || parsed < 1) return null

  return parsed
}

export function getLoopScheduleMode(loop: { runContinuously?: boolean; schedule?: RepeatTaskSchedule | null }): RepeatTaskScheduleMode {
  return loop.runContinuously ? "continuous" : (loop.schedule?.type ?? "interval")
}

export function getLoopScheduleTimes(loop: { schedule?: RepeatTaskSchedule | null }): string[] {
  return loop.schedule?.times.length ? [...loop.schedule.times] : [...DEFAULT_REPEAT_TASK_SCHEDULE_TIMES]
}

export function getLoopScheduleDaysOfWeek(loop: { schedule?: RepeatTaskSchedule | null }): number[] {
  return loop.schedule?.type === "weekly"
    ? [...loop.schedule.daysOfWeek]
    : [...DEFAULT_REPEAT_TASK_WEEKDAYS]
}
