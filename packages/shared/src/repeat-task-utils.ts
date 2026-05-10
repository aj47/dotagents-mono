import type {
  Loop,
  LoopDeleteResponse,
  LoopExportMarkdownResponse,
  LoopBulkRuntimeActionResponse,
  LoopImportMarkdownRequest,
  LoopMutationResponse,
  LoopRuntimeActionResponse,
  LoopRuntimeStatus,
  LoopRunResponse,
  LoopStatusesResponse,
  LoopsResponse,
  LoopToggleResponse,
} from "./api-types"
import {
  DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS,
  DEFAULT_REPEAT_TASK_IMPORT_MARKDOWN_PLACEHOLDER,
  DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
  DEFAULT_REPEAT_TASK_SCHEDULE_TIMES,
  DEFAULT_REPEAT_TASK_WEEKDAYS,
} from "./repeat-task-defaults"
import { parseTaskMarkdown, stringifyTaskMarkdown } from "./repeat-task-markdown"

export {
  DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS,
  DEFAULT_REPEAT_TASK_IMPORT_MARKDOWN_PLACEHOLDER,
  DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
  DEFAULT_REPEAT_TASK_SCHEDULE_TIMES,
  DEFAULT_REPEAT_TASK_WEEKDAYS,
} from "./repeat-task-defaults"

export type RepeatTaskScheduleMode = "continuous" | "interval" | "daily" | "weekly"

export type RepeatTaskSchedule =
  | { type: "daily"; times: string[] }
  | { type: "weekly"; times: string[]; daysOfWeek: number[] }

export type RepeatTaskCadence = {
  intervalMinutes: number
  runContinuously?: boolean
  schedule?: RepeatTaskSchedule | null
}

export type RepeatTaskRunNowDescriptionLike = RepeatTaskCadence & {
  enabled: boolean
}

export type RepeatTaskScheduleParseResult =
  | { ok: true; schedule?: RepeatTaskSchedule | null }
  | { ok: false; error: string }

export type RepeatTaskScheduleDraft = {
  scheduleMode: RepeatTaskScheduleMode
  scheduleTimes: string[]
  scheduleDaysOfWeek: number[]
}

export type RepeatTaskEditFormData = {
  name: string
  prompt: string
  intervalMinutes: string
  enabled: boolean
  profileId: string
  runOnStartup: boolean
  speakOnTrigger: boolean
  continueInSession: boolean
  lastSessionId: string
  maxIterations: string
  scheduleMode: RepeatTaskScheduleMode
  scheduleTimes: string[]
  scheduleDaysOfWeek: number[]
}

export type RepeatTaskScheduleDraftError = "missing-schedule-times" | "missing-weekly-days"

export type RepeatTaskScheduleDraftResult =
  | { ok: true; schedule: RepeatTaskSchedule | null; runContinuously: boolean }
  | { ok: false; error: RepeatTaskScheduleDraftError }

export type RepeatTaskEditFormSaveError =
  | "missing-required-fields"
  | "invalid-interval-minutes"
  | "invalid-max-iterations"
  | RepeatTaskScheduleDraftError

export type RepeatTaskEditFormSavePayload = {
  name: string
  prompt: string
  intervalMinutes: number
  enabled: boolean
  profileId: string
  runOnStartup: boolean
  speakOnTrigger: boolean
  continueInSession: boolean
  lastSessionId: string
  maxIterations: number | null
  runContinuously: boolean
  schedule: RepeatTaskSchedule | null
}

export type RepeatTaskEditFormSaveOptions = {
  existingIntervalMinutes?: number | null
  fallbackIntervalMinutes?: number
}

export type RepeatTaskEditFormSaveResult =
  | { ok: true; payload: RepeatTaskEditFormSavePayload }
  | { ok: false; error: RepeatTaskEditFormSaveError; message: string }

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

export type RepeatTaskImportMarkdownRequest = LoopImportMarkdownRequest

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

export type RepeatTaskEditFormSource = Pick<
  Loop,
  | "name"
  | "prompt"
  | "intervalMinutes"
  | "enabled"
  | "profileId"
  | "runOnStartup"
  | "speakOnTrigger"
  | "continueInSession"
  | "lastSessionId"
  | "maxIterations"
  | "runContinuously"
  | "schedule"
>

export type RepeatTaskLayerRecord = {
  id: string
}

export type RepeatTaskStatusLike = {
  id?: string
  name?: string
  enabled?: boolean
  lastRunAt?: number
  isRunning?: boolean
  nextRunAt?: number
  intervalMinutes?: number
  schedule?: RepeatTaskSchedule
}

export type RepeatTaskRuntimeTimestampFormatOptions = {
  locale?: string | string[]
  dateTimeFormatOptions?: Intl.DateTimeFormatOptions
}

export type RepeatTaskRuntimeDescriptionLike = {
  enabled: boolean
  isRunning?: boolean
  nextRunAt?: number
}

export type RepeatTaskRuntimeMergeTarget = RepeatTaskRuntimeDescriptionLike & {
  name: string
  lastRunAt?: number
  intervalMinutes: number
  schedule?: RepeatTaskSchedule | null
}

export type RepeatTaskIdLike = {
  id: string
}

export type RepeatTaskEnabledLike = RepeatTaskIdLike & {
  enabled: boolean
}

export type RepeatTaskSessionLike = {
  id: string
  conversationId?: string | null
  parentSessionId?: string | null
  conversationTitle?: string | null
  isRepeatTask?: boolean
}

export type RepeatTaskSessionDedupeLike = RepeatTaskSessionLike & {
  status?: string
  startTime?: number
  endTime?: number
}

export type RepeatTaskTitleHintSource = {
  name: string
  prompt?: string | null
}

export type RepeatTaskTitleHints = ReadonlySet<string>

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

export type RepeatTaskIntervalDraftResolutionOptions = {
  existingIntervalMinutes?: number | null
  fallbackIntervalMinutes: number
}

export type RepeatTaskIntervalDraftResolution = {
  parsedIntervalMinutes: number | null
  intervalMinutes: number
  isValid: boolean
}

export type RepeatTaskIntervalPreset = {
  label: string
  value: number
}

export type RepeatTaskIdGenerator = () => string

export interface RepeatTaskRuntimeIdOptions {
  now?: () => number
  random?: () => number
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

export const DEFAULT_REPEAT_TASK_EDIT_FORM_DATA: RepeatTaskEditFormData = {
  name: "",
  prompt: "",
  intervalMinutes: String(DEFAULT_REPEAT_TASK_INTERVAL_MINUTES),
  enabled: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.enabled,
  profileId: "",
  runOnStartup: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
  speakOnTrigger: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
  continueInSession: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession,
  lastSessionId: "",
  maxIterations: "",
  scheduleMode: "interval",
  scheduleTimes: [...DEFAULT_REPEAT_TASK_SCHEDULE_TIMES],
  scheduleDaysOfWeek: [...DEFAULT_REPEAT_TASK_WEEKDAYS],
}

export const REPEAT_TASK_INTERVAL_PRESETS: readonly RepeatTaskIntervalPreset[] = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
]

export interface RepeatTaskActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface RepeatTaskLoopService<TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord> {
  getLoops(): TLoop[]
  getLoopStatuses(): RepeatTaskStatusLike[]
  getLoop(id: string): TLoop | undefined
  saveLoop(loop: TLoop): boolean
  startAllLoops?(): void
  stopAllLoops?(): void
  resumeScheduling?(): void
  startLoop(id: string): boolean | void
  stopLoop(id: string): boolean | void
  triggerLoop(id: string): RepeatTaskMaybePromise<boolean>
  getLoopStatus(id: string): RepeatTaskStatusLike | undefined
  deleteLoop(id: string): boolean
}

export interface RepeatTaskConfigLike<TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord> {
  loops?: TLoop[]
}

export interface RepeatTaskActionOptions<
  TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord,
> {
  service: RepeatTaskActionService<TLoop>
  diagnostics: RepeatTaskActionDiagnostics
}

export interface RepeatTaskActionService<TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord> {
  loadLoopService(): RepeatTaskMaybePromise<RepeatTaskLoopService<TLoop> | null | undefined>
  getFallbackLoops(): TLoop[]
  saveFallbackLoops(loops: TLoop[]): void
  createId(): string
  getProfileName?: (profileId?: string) => string | undefined
}

export interface RepeatTaskActionServiceOptions<
  TLoop extends RepeatTaskApiRecord = RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop> = RepeatTaskConfigLike<TLoop>,
> {
  loadLoopService(): RepeatTaskMaybePromise<RepeatTaskLoopService<TLoop> | null | undefined>
  getConfig(): TConfig
  saveConfig(config: TConfig): void
  createId(): string
  getProfileName?: (profileId?: string) => string | undefined
}

export function createRepeatTaskActionService<
  TLoop extends RepeatTaskApiRecord,
  TConfig extends RepeatTaskConfigLike<TLoop>,
>(options: RepeatTaskActionServiceOptions<TLoop, TConfig>): RepeatTaskActionService<TLoop> {
  const service: RepeatTaskActionService<TLoop> = {
    loadLoopService: () => options.loadLoopService(),
    getFallbackLoops: () => options.getConfig().loops || [],
    saveFallbackLoops: (loops) => {
      options.saveConfig({ ...options.getConfig(), loops } as TConfig)
    },
    createId: () => options.createId(),
  }

  if (options.getProfileName) {
    service.getProfileName = options.getProfileName
  }

  return service
}

export interface RepeatTaskRouteActions {
  getRepeatTasks(): Promise<RepeatTaskActionResult>
  getRepeatTaskStatuses(): Promise<RepeatTaskActionResult>
  toggleRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult>
  runRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult>
  startAllRepeatTasks(): Promise<RepeatTaskActionResult>
  stopAllRepeatTasks(): Promise<RepeatTaskActionResult>
  startRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult>
  stopRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult>
  createRepeatTask(body: unknown): Promise<RepeatTaskActionResult>
  importRepeatTaskFromMarkdown(body: unknown): Promise<RepeatTaskActionResult>
  exportRepeatTaskToMarkdown(id: string | undefined): Promise<RepeatTaskActionResult>
  updateRepeatTask(id: string | undefined, body: unknown): Promise<RepeatTaskActionResult>
  deleteRepeatTask(id: string | undefined): Promise<RepeatTaskActionResult>
}

export const REPEAT_TASK_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
export const TASK_SESSION_TITLE_PREFIX = "[Repeat] "
const REPEAT_TASK_NAME_CONNECTOR_WORDS = new Set(["a", "an", "and", "for", "of", "the", "to"])

export function formatRepeatTaskTitle(taskName: string): string {
  return `${TASK_SESSION_TITLE_PREFIX}${taskName}`
}

export function slugifyRepeatTaskName(name: string, maxLength = 64): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength)
}

export function createRepeatTaskIdFromName(name: string, createFallbackId: RepeatTaskIdGenerator): string {
  return slugifyRepeatTaskName(name) || createFallbackId()
}

export function createRepeatTaskRuntimeId(options: RepeatTaskRuntimeIdOptions = {}): string {
  const now = options.now ?? Date.now
  const random = options.random ?? Math.random
  return `loop_${now()}_${random().toString(36).slice(2, 11)}`
}

function toTitleCaseRepeatTaskName(value: string, options: { dropConnectorWords?: boolean } = {}): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => !options.dropConnectorWords || !REPEAT_TASK_NAME_CONNECTOR_WORDS.has(word.toLowerCase()))
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}

function getFirstRepeatTaskMarkdownHeading(value: string | null | undefined): string | null {
  const heading = value
    ?.split(/\r?\n/u)
    .map((line) => line.match(/^#\s+(.+)$/u)?.[1]?.trim())
    .find((line): line is string => !!line)
  return heading ?? null
}

export function getRepeatTaskTitleHints(task: RepeatTaskTitleHintSource): string[] {
  const hints = new Set<string>()
  const addHint = (value?: string | null) => {
    const trimmed = value?.trim()
    if (trimmed) hints.add(trimmed)
  }

  addHint(task.name)
  addHint(formatRepeatTaskTitle(task.name))
  addHint(toTitleCaseRepeatTaskName(task.name))
  addHint(toTitleCaseRepeatTaskName(task.name, { dropConnectorWords: true }))

  const firstHeading = getFirstRepeatTaskMarkdownHeading(task.prompt)
  addHint(firstHeading)
  addHint(firstHeading ? `${firstHeading} Run` : null)

  return Array.from(hints)
}

export function hasRepeatTaskTitlePrefix(title: string | undefined | null): boolean {
  return typeof title === "string" && title.startsWith(TASK_SESSION_TITLE_PREFIX)
}

export function isRepeatTaskSession(
  session: RepeatTaskSessionLike,
  repeatTaskTitleHints?: RepeatTaskTitleHints,
): boolean {
  if (session.isRepeatTask) return true
  if (hasRepeatTaskTitlePrefix(session.conversationTitle)) return true
  const title = session.conversationTitle?.trim()
  return !!title && !!repeatTaskTitleHints?.has(title)
}

export function isRepeatTaskSessionForTasks(
  session: RepeatTaskSessionLike,
  tasks: readonly RepeatTaskTitleHintSource[],
  options: { firstUserMessage?: string | null } = {},
): boolean {
  const titleHints = new Set(tasks.flatMap(getRepeatTaskTitleHints))
  if (isRepeatTaskSession(session, titleHints)) return true

  const firstUserMessage = options.firstUserMessage?.trim()
  return !!firstUserMessage && tasks.some((task) => task.prompt?.trim() === firstUserMessage)
}

export function partitionRepeatTaskAndUserEntries<
  T extends { session: RepeatTaskSessionLike },
>(
  entries: T[],
  repeatTaskTitleHints?: RepeatTaskTitleHints,
): { userEntries: T[]; taskEntries: T[] } {
  const taskSessionIds = new Set(
    entries
      .filter((entry) => isRepeatTaskSession(entry.session, repeatTaskTitleHints))
      .map((entry) => entry.session.id),
  )
  const userEntries: T[] = []
  const taskEntries: T[] = []
  for (const entry of entries) {
    const parentSessionId = entry.session.parentSessionId?.trim()
    if (
      isRepeatTaskSession(entry.session, repeatTaskTitleHints) ||
      (parentSessionId && taskSessionIds.has(parentSessionId))
    ) {
      taskEntries.push(entry)
    } else {
      userEntries.push(entry)
    }
  }
  return { userEntries, taskEntries }
}

function getRepeatTaskEntryDedupeKey(session: RepeatTaskSessionLike): string | null {
  const title = session.conversationTitle?.trim()
  if (!title) return null
  return title.startsWith(TASK_SESSION_TITLE_PREFIX)
    ? title.slice(TASK_SESSION_TITLE_PREFIX.length).trim().toLowerCase()
    : title.toLowerCase()
}

function getRepeatTaskEntryTimestamp(session: RepeatTaskSessionDedupeLike): number {
  return Math.max(session.endTime ?? 0, session.startTime ?? 0)
}

function isRepeatTaskSubagentLikeEntry(session: RepeatTaskSessionLike): boolean {
  if (session.id.startsWith("subsession_")) return true
  const parentSessionId = session.parentSessionId?.trim()
  return !!parentSessionId && parentSessionId !== session.id
}

function isBetterRepeatTaskEntry<T extends { session: RepeatTaskSessionDedupeLike }>(
  candidate: T,
  current: T,
): boolean {
  const candidateIsSubagent = isRepeatTaskSubagentLikeEntry(candidate.session)
  const currentIsSubagent = isRepeatTaskSubagentLikeEntry(current.session)
  if (candidateIsSubagent !== currentIsSubagent) return !candidateIsSubagent

  const candidateIsActive = candidate.session.status === "active"
  const currentIsActive = current.session.status === "active"
  if (candidateIsActive !== currentIsActive) return candidateIsActive
  return getRepeatTaskEntryTimestamp(candidate.session) > getRepeatTaskEntryTimestamp(current.session)
}

export function dedupeRepeatTaskEntriesByTitle<
  T extends { session: RepeatTaskSessionDedupeLike },
>(taskEntries: T[]): T[] {
  if (taskEntries.length <= 1) return taskEntries

  const selectedByTitle = new Map<string, T>()
  for (const entry of taskEntries) {
    const key = getRepeatTaskEntryDedupeKey(entry.session)
    if (!key) continue
    const current = selectedByTitle.get(key)
    if (!current || isBetterRepeatTaskEntry(entry, current)) {
      selectedByTitle.set(key, entry)
    }
  }

  return taskEntries.filter((entry) => {
    const key = getRepeatTaskEntryDedupeKey(entry.session)
    return !key || selectedByTitle.get(key) === entry
  })
}

export function partitionPinnedAndUnpinnedRepeatTaskEntries<
  T extends { session: Pick<RepeatTaskSessionLike, "id" | "conversationId" | "parentSessionId"> },
>(
  taskEntries: T[],
  pinnedSessionIds: ReadonlySet<string>,
): { pinnedTaskEntries: T[]; unpinnedTaskEntries: T[] } {
  if (taskEntries.length === 0 || pinnedSessionIds.size === 0) {
    return { pinnedTaskEntries: [], unpinnedTaskEntries: taskEntries }
  }

  const pinnedTaskSessionIds = new Set(
    taskEntries
      .filter((entry) => {
        const conversationId = entry.session.conversationId
        return !!conversationId && pinnedSessionIds.has(conversationId)
      })
      .map((entry) => entry.session.id),
  )
  const pinnedTaskEntries: T[] = []
  const unpinnedTaskEntries: T[] = []
  for (const entry of taskEntries) {
    const conversationId = entry.session.conversationId
    const parentSessionId = entry.session.parentSessionId?.trim()
    if (
      (conversationId && pinnedSessionIds.has(conversationId)) ||
      (parentSessionId && pinnedTaskSessionIds.has(parentSessionId))
    ) {
      pinnedTaskEntries.push(entry)
    } else {
      unpinnedTaskEntries.push(entry)
    }
  }
  return { pinnedTaskEntries, unpinnedTaskEntries }
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

function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
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

export function updateRepeatTaskScheduleTimeAt(
  scheduleTimes: readonly string[],
  index: number,
  time: string,
): string[] {
  return scheduleTimes.map((entry, entryIndex) => (entryIndex === index ? time : entry))
}

export function removeRepeatTaskScheduleTimeAt(
  scheduleTimes: readonly string[],
  index: number,
): string[] {
  return scheduleTimes.filter((_, entryIndex) => entryIndex !== index)
}

export function addRepeatTaskScheduleTime(
  scheduleTimes: readonly string[],
  time: string = DEFAULT_REPEAT_TASK_SCHEDULE_TIMES[0],
): string[] {
  return [...scheduleTimes, time]
}

export function toggleRepeatTaskScheduleDayOfWeek(
  scheduleDaysOfWeek: readonly number[],
  day: number,
): number[] {
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return [...scheduleDaysOfWeek]
  }

  if (scheduleDaysOfWeek.includes(day)) {
    return scheduleDaysOfWeek.filter((entry) => entry !== day)
  }

  return Array.from(new Set([...scheduleDaysOfWeek, day])).sort((a, b) => a - b)
}

export function buildRepeatTaskScheduleFromDraft(
  draft: RepeatTaskScheduleDraft,
): RepeatTaskScheduleDraftResult {
  if (draft.scheduleMode === "interval" || draft.scheduleMode === "continuous") {
    return {
      ok: true,
      schedule: null,
      runContinuously: draft.scheduleMode === "continuous",
    }
  }

  const times = sanitizeScheduleTimes(draft.scheduleTimes)
  if (times.length === 0) {
    return { ok: false, error: "missing-schedule-times" }
  }

  if (draft.scheduleMode === "weekly") {
    const daysOfWeek = Array.from(new Set(
      draft.scheduleDaysOfWeek.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    )).sort((a, b) => a - b)

    if (daysOfWeek.length === 0) {
      return { ok: false, error: "missing-weekly-days" }
    }

    return {
      ok: true,
      schedule: { type: "weekly", times, daysOfWeek },
      runContinuously: false,
    }
  }

  return {
    ok: true,
    schedule: { type: "daily", times },
    runContinuously: false,
  }
}

export function getRepeatTaskEditFormSaveErrorMessage(error: RepeatTaskEditFormSaveError): string {
  switch (error) {
    case "missing-required-fields":
      return "Name and prompt are required"
    case "invalid-interval-minutes":
      return "Interval must be a positive whole number of minutes"
    case "invalid-max-iterations":
      return "Max iterations must be a positive whole number"
    case "missing-schedule-times":
      return "Add at least one time in HH:MM format"
    case "missing-weekly-days":
      return "Select at least one day of the week"
    default:
      return "Unable to save repeat task"
  }
}

export function buildRepeatTaskEditFormSavePayload(
  formData: RepeatTaskEditFormData,
  options: RepeatTaskEditFormSaveOptions = {},
): RepeatTaskEditFormSaveResult {
  const name = formData.name.trim()
  const prompt = formData.prompt.trim()
  if (!name || !prompt) {
    const error: RepeatTaskEditFormSaveError = "missing-required-fields"
    return { ok: false, error, message: getRepeatTaskEditFormSaveErrorMessage(error) }
  }

  const intervalResolution = resolveRepeatTaskIntervalMinutesDraft(formData.intervalMinutes, {
    existingIntervalMinutes: options.existingIntervalMinutes,
    fallbackIntervalMinutes: options.fallbackIntervalMinutes ?? DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
  })
  if (formData.scheduleMode === "interval" && !intervalResolution.isValid) {
    const error: RepeatTaskEditFormSaveError = "invalid-interval-minutes"
    return { ok: false, error, message: getRepeatTaskEditFormSaveErrorMessage(error) }
  }

  const maxIterationsInput = formData.maxIterations.trim()
  const maxIterations = maxIterationsInput ? parseLoopIntervalDraft(maxIterationsInput) : null
  if (maxIterationsInput && maxIterations === null) {
    const error: RepeatTaskEditFormSaveError = "invalid-max-iterations"
    return { ok: false, error, message: getRepeatTaskEditFormSaveErrorMessage(error) }
  }

  const scheduleResult = buildRepeatTaskScheduleFromDraft({
    scheduleMode: formData.scheduleMode,
    scheduleTimes: formData.scheduleTimes,
    scheduleDaysOfWeek: formData.scheduleDaysOfWeek,
  })
  if (scheduleResult.ok === false) {
    return {
      ok: false,
      error: scheduleResult.error,
      message: getRepeatTaskEditFormSaveErrorMessage(scheduleResult.error),
    }
  }

  return {
    ok: true,
    payload: {
      name,
      prompt,
      intervalMinutes: intervalResolution.intervalMinutes,
      enabled: formData.enabled,
      profileId: formData.profileId.trim(),
      runOnStartup: formData.runOnStartup,
      speakOnTrigger: formData.speakOnTrigger,
      continueInSession: formData.continueInSession,
      lastSessionId: formData.lastSessionId.trim(),
      maxIterations,
      runContinuously: scheduleResult.runContinuously,
      schedule: scheduleResult.schedule,
    },
  }
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

  const runContinuously = typeof requestBody.runContinuously === "boolean"
    ? requestBody.runContinuously
    : DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runContinuously
  const continueInSession = typeof requestBody.continueInSession === "boolean"
    ? requestBody.continueInSession
    : DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession
  const lastSessionId = typeof requestBody.lastSessionId === "string"
    ? requestBody.lastSessionId.trim() || undefined
    : undefined
  return {
    ok: true,
    request: {
      name,
      prompt,
      intervalMinutes: typeof requestBody.intervalMinutes === "number" ? requestBody.intervalMinutes : DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
      enabled: typeof requestBody.enabled === "boolean" ? requestBody.enabled : DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.enabled,
      profileId: typeof requestBody.profileId === "string" ? requestBody.profileId.trim() || undefined : undefined,
      runOnStartup: typeof requestBody.runOnStartup === "boolean"
        ? requestBody.runOnStartup
        : DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
      speakOnTrigger: typeof requestBody.speakOnTrigger === "boolean"
        ? requestBody.speakOnTrigger
        : DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
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

export function parseRepeatTaskImportMarkdownRequestBody(
  body: unknown,
): RepeatTaskRequestParseResult<RepeatTaskImportMarkdownRequest> {
  const record = getRequestRecord(body)
  const content = getOptionalString(record.content)
  if (!content || !content.trim()) {
    return { ok: false, statusCode: 400, error: "Repeat task Markdown content is required" }
  }

  return { ok: true, request: { content } }
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

export function formatRepeatTaskStatusForApi(status: RepeatTaskStatusLike): LoopRuntimeStatus {
  return {
    id: status.id ?? "",
    name: status.name,
    enabled: status.enabled,
    isRunning: status.isRunning ?? false,
    lastRunAt: status.lastRunAt,
    nextRunAt: status.nextRunAt,
    intervalMinutes: status.intervalMinutes,
    schedule: status.schedule,
  }
}

export function buildRepeatTaskStatusesResponse(statuses: RepeatTaskStatusLike[]): LoopStatusesResponse {
  return {
    statuses: statuses
      .filter((status): status is RepeatTaskStatusLike & { id: string } => typeof status.id === "string")
      .map(formatRepeatTaskStatusForApi),
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

export function buildRepeatTaskRuntimeActionResponse(
  id: string,
  status?: RepeatTaskStatusLike,
): LoopRuntimeActionResponse {
  return {
    success: true,
    id,
    ...(status ? { status: formatRepeatTaskStatusForApi(status) } : {}),
  }
}

export function buildRepeatTaskBulkRuntimeActionResponse(
  action: LoopBulkRuntimeActionResponse["action"],
  count: number,
  statuses: RepeatTaskStatusLike[],
): LoopBulkRuntimeActionResponse {
  return {
    success: true,
    action,
    count,
    statuses: buildRepeatTaskStatusesResponse(statuses).statuses,
  }
}

export function buildRepeatTaskExportMarkdownResponse(loopId: string, markdown: string): LoopExportMarkdownResponse {
  return { success: true, loopId, markdown }
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
>(options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await options.service.loadLoopService()
    const loops = loopService?.getLoops() ?? options.service.getFallbackLoops()
    const statuses = loopService?.getLoopStatuses() ?? []

    return repeatTaskActionOk(buildRepeatTasksResponse(loops, {
      statuses,
      getProfileName: options.service.getProfileName,
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to get repeat tasks", caughtError)
    return repeatTaskActionError(500, "Failed to get repeat tasks")
  }
}

export async function getRepeatTaskStatusesAction<
  TLoop extends RepeatTaskApiRecord,
>(options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await options.service.loadLoopService()
    const statuses = loopService?.getLoopStatuses() ?? []

    return repeatTaskActionOk(buildRepeatTaskStatusesResponse(statuses))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to get repeat task statuses", caughtError)
    return repeatTaskActionError(500, "Failed to get repeat task statuses")
  }
}

export async function toggleRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    const loopService = await options.service.loadLoopService()

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

    const loops = options.service.getFallbackLoops()
    const loopIndex = loops.findIndex(loop => loop.id === id)

    if (loopIndex === -1) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    const updatedLoops = [...loops]
    updatedLoops[loopIndex] = {
      ...updatedLoops[loopIndex],
      enabled: !updatedLoops[loopIndex].enabled,
    }

    options.service.saveFallbackLoops(updatedLoops)

    return repeatTaskActionOk(buildRepeatTaskToggleResponse(taskId, updatedLoops[loopIndex].enabled))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to toggle repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to toggle repeat task"))
  }
}

export async function runRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    const loopService = await options.service.loadLoopService()

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

export async function startRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    if (!taskId) {
      return repeatTaskActionError(400, "Repeat task id is required")
    }

    const loopService = await options.service.loadLoopService()
    if (!loopService) {
      return repeatTaskActionError(503, "Repeat task service is unavailable")
    }

    const loop = loopService.getLoop(taskId)
    if (!loop) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    if (!loop.enabled) {
      return repeatTaskActionError(409, "Repeat task is disabled")
    }

    const started = loopService.startLoop(taskId) !== false
    if (!started) {
      return repeatTaskActionError(409, "Repeat task could not be started")
    }

    return repeatTaskActionOk(buildRepeatTaskRuntimeActionResponse(taskId, loopService.getLoopStatus(taskId)))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to start repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to start repeat task"))
  }
}

function getRepeatTaskScheduledCount(statuses: RepeatTaskStatusLike[]): number {
  return statuses.filter((status) => status.isRunning || status.nextRunAt !== undefined).length
}

export async function startAllRepeatTasksAction<
  TLoop extends RepeatTaskApiRecord,
>(options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await options.service.loadLoopService()
    if (!loopService) {
      return repeatTaskActionError(503, "Repeat task service is unavailable")
    }

    const targetCount = loopService.getLoops().filter((loop) => loop.enabled).length
    loopService.resumeScheduling?.()
    if (loopService.startAllLoops) {
      loopService.startAllLoops()
    } else {
      for (const loop of loopService.getLoops()) {
        if (loop.enabled) loopService.startLoop(loop.id)
      }
    }

    return repeatTaskActionOk(
      buildRepeatTaskBulkRuntimeActionResponse("start-all", targetCount, loopService.getLoopStatuses()),
    )
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to start all repeat tasks", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to start all repeat tasks"))
  }
}

export async function stopAllRepeatTasksAction<
  TLoop extends RepeatTaskApiRecord,
>(options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const loopService = await options.service.loadLoopService()
    if (!loopService) {
      return repeatTaskActionError(503, "Repeat task service is unavailable")
    }

    const statusesBefore = loopService.getLoopStatuses()
    const targetCount = getRepeatTaskScheduledCount(statusesBefore)
    if (loopService.stopAllLoops) {
      loopService.stopAllLoops()
    } else {
      for (const status of statusesBefore) {
        if (typeof status.id === "string" && (status.isRunning || status.nextRunAt !== undefined)) {
          loopService.stopLoop(status.id)
        }
      }
    }

    return repeatTaskActionOk(
      buildRepeatTaskBulkRuntimeActionResponse("stop-all", targetCount, loopService.getLoopStatuses()),
    )
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to stop all repeat tasks", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to stop all repeat tasks"))
  }
}

export async function stopRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    if (!taskId) {
      return repeatTaskActionError(400, "Repeat task id is required")
    }

    const loopService = await options.service.loadLoopService()
    if (!loopService) {
      return repeatTaskActionError(503, "Repeat task service is unavailable")
    }

    if (!loopService.getLoop(taskId)) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    loopService.stopLoop(taskId)

    return repeatTaskActionOk(buildRepeatTaskRuntimeActionResponse(taskId, loopService.getLoopStatus(taskId)))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to stop repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to stop repeat task"))
  }
}

export async function createRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(body: unknown, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return repeatTaskActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const newLoop = buildRepeatTaskFromCreateRequest(options.service.createId(), parsedRequest.request) as TLoop

    const loopService = await options.service.loadLoopService()
    if (loopService) {
      const saved = loopService.saveLoop(newLoop)
      if (!saved) {
        return repeatTaskActionError(500, "Failed to persist repeat task")
      }

      if (newLoop.enabled) {
        loopService.startLoop(newLoop.id)
      }
    } else {
      options.service.saveFallbackLoops([...options.service.getFallbackLoops(), newLoop])
    }

    const savedLoop = loopService?.getLoop(newLoop.id) ?? newLoop
    return repeatTaskActionOk(buildRepeatTaskResponse(savedLoop, {
      profileName: options.service.getProfileName?.(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to create repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to create repeat task"))
  }
}

export async function importRepeatTaskFromMarkdownAction<
  TLoop extends RepeatTaskApiRecord,
>(body: unknown, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskImportMarkdownRequestBody(body)
    if (parsedRequest.ok === false) {
      return repeatTaskActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const parsedTask = parseTaskMarkdown(parsedRequest.request.content, { fallbackId: options.service.createId() })
    if (!parsedTask) {
      return repeatTaskActionError(400, "Invalid repeat task Markdown")
    }

    const importedTask = parsedTask as TLoop
    const loopService = await options.service.loadLoopService()
    if (loopService) {
      const saved = loopService.saveLoop(importedTask)
      if (!saved) {
        return repeatTaskActionError(500, "Failed to persist repeat task")
      }

      loopService.stopLoop(importedTask.id)
      if (importedTask.enabled) {
        loopService.startLoop(importedTask.id)
      }
    } else {
      const loops = options.service.getFallbackLoops()
      const existingIndex = loops.findIndex(loop => loop.id === importedTask.id)
      const nextLoops = existingIndex >= 0
        ? loops.map((loop, index) => index === existingIndex ? importedTask : loop)
        : [...loops, importedTask]
      options.service.saveFallbackLoops(nextLoops)
    }

    const savedLoop = loopService?.getLoop(importedTask.id) ?? importedTask
    return repeatTaskActionOk(buildRepeatTaskMutationResponse(savedLoop, {
      profileName: options.service.getProfileName?.(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to import repeat task from Markdown", caughtError)
    return repeatTaskActionError(400, getUnknownErrorMessage(caughtError, "Failed to import repeat task"))
  }
}

export async function exportRepeatTaskToMarkdownAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    if (!taskId) {
      return repeatTaskActionError(400, "Repeat task id is required")
    }

    const loopService = await options.service.loadLoopService()
    const loop = loopService?.getLoop(taskId) ?? options.service.getFallbackLoops().find(task => task.id === taskId)
    if (!loop) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    return repeatTaskActionOk(buildRepeatTaskExportMarkdownResponse(taskId, stringifyTaskMarkdown(loop)))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to export repeat task to Markdown", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to export repeat task"))
  }
}

export async function updateRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, body: unknown, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const parsedRequest = parseRepeatTaskUpdateRequestBody(body)
    if (parsedRequest.ok === false) {
      return repeatTaskActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const taskId = id ?? ""
    const loopService = await options.service.loadLoopService()
    let existing: TLoop | undefined
    let loops: TLoop[] = []
    let loopIndex = -1

    if (loopService) {
      existing = loopService.getLoop(taskId)
    } else {
      loops = options.service.getFallbackLoops()
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
    } else if (loopIndex >= 0) {
      const updatedLoops = [...loops]
      updatedLoops[loopIndex] = updated
      options.service.saveFallbackLoops(updatedLoops)
    }

    const savedLoop = loopService?.getLoop(taskId) ?? updated
    return repeatTaskActionOk(buildRepeatTaskMutationResponse(savedLoop, {
      profileName: options.service.getProfileName?.(savedLoop.profileId),
      status: loopService?.getLoopStatus(savedLoop.id),
    }))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to update repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to update repeat task"))
  }
}

export async function deleteRepeatTaskAction<
  TLoop extends RepeatTaskApiRecord,
>(id: string | undefined, options: RepeatTaskActionOptions<TLoop>): Promise<RepeatTaskActionResult> {
  try {
    const taskId = id ?? ""
    const loopService = await options.service.loadLoopService()

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

    const loops = options.service.getFallbackLoops()
    const loopIndex = loops.findIndex(loop => loop.id === id)

    if (loopIndex === -1) {
      return repeatTaskActionError(404, "Repeat task not found")
    }

    const updatedLoops = loops.filter(loop => loop.id !== id)
    options.service.saveFallbackLoops(updatedLoops)

    return repeatTaskActionOk(buildRepeatTaskDeleteResponse(taskId))
  } catch (caughtError) {
    options.diagnostics.logError("repeat-task-actions", "Failed to delete repeat task", caughtError)
    return repeatTaskActionError(500, getUnknownErrorMessage(caughtError, "Failed to delete repeat task"))
  }
}

export function createRepeatTaskRouteActions<
  TLoop extends RepeatTaskApiRecord,
>(options: RepeatTaskActionOptions<TLoop>): RepeatTaskRouteActions {
  return {
    getRepeatTasks: () => getRepeatTasksAction(options),
    getRepeatTaskStatuses: () => getRepeatTaskStatusesAction(options),
    toggleRepeatTask: (id) => toggleRepeatTaskAction(id, options),
    runRepeatTask: (id) => runRepeatTaskAction(id, options),
    startAllRepeatTasks: () => startAllRepeatTasksAction(options),
    stopAllRepeatTasks: () => stopAllRepeatTasksAction(options),
    startRepeatTask: (id) => startRepeatTaskAction(id, options),
    stopRepeatTask: (id) => stopRepeatTaskAction(id, options),
    createRepeatTask: (body) => createRepeatTaskAction(body, options),
    importRepeatTaskFromMarkdown: (body) => importRepeatTaskFromMarkdownAction(body, options),
    exportRepeatTaskToMarkdown: (id) => exportRepeatTaskToMarkdownAction(id, options),
    updateRepeatTask: (id, body) => updateRepeatTaskAction(id, body, options),
    deleteRepeatTask: (id) => deleteRepeatTaskAction(id, options),
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

export function getRepeatTaskRunNowDescription(loop: RepeatTaskRunNowDescriptionLike): string {
  return `Run repeat task now • ${describeLoopCadence(loop)}${loop.enabled ? "" : " • Disabled"}`
}

export function formatRepeatTaskRuntimeTimestamp(
  timestamp?: number,
  options: RepeatTaskRuntimeTimestampFormatOptions = {},
): string | undefined {
  if (!timestamp) return undefined
  return new Date(timestamp).toLocaleString(options.locale, options.dateTimeFormatOptions)
}

export function formatRepeatTaskRuntimeTimestampOrFallback(
  timestamp?: number,
  fallback = "Never",
  options?: RepeatTaskRuntimeTimestampFormatOptions,
): string {
  return formatRepeatTaskRuntimeTimestamp(timestamp, options) ?? fallback
}

export function describeRepeatTaskRuntime(
  loop: RepeatTaskRuntimeDescriptionLike,
  options?: { timestampFormatOptions?: RepeatTaskRuntimeTimestampFormatOptions },
): string {
  if (loop.isRunning) return "Running now"
  const nextRunTime = formatRepeatTaskRuntimeTimestamp(loop.nextRunAt, options?.timestampFormatOptions)
  if (nextRunTime) return `Next: ${nextRunTime}`
  if (!loop.enabled) return "Disabled"
  return "No scheduled run"
}

export function applyRepeatTaskRuntimeStatus<TLoop extends RepeatTaskRuntimeMergeTarget>(
  loop: TLoop,
  status?: RepeatTaskStatusLike,
): TLoop {
  if (!status) return loop
  return {
    ...loop,
    name: status.name ?? loop.name,
    enabled: status.enabled ?? loop.enabled,
    isRunning: status.isRunning ?? loop.isRunning,
    lastRunAt: status.lastRunAt,
    nextRunAt: status.nextRunAt,
    intervalMinutes: status.intervalMinutes ?? loop.intervalMinutes,
    schedule: status.schedule ?? loop.schedule,
  }
}

export function applyRepeatTaskRuntimeStatuses<TLoop extends RepeatTaskRuntimeMergeTarget & { id: string }>(
  loops: readonly TLoop[],
  statuses: readonly RepeatTaskStatusLike[] = [],
): TLoop[] {
  const statusesById = new Map(statuses.map((status) => [status.id, status]))
  return loops.map((loop) => applyRepeatTaskRuntimeStatus(loop, statusesById.get(loop.id)))
}

export function applyRepeatTaskRuntimeStatusInList<TLoop extends RepeatTaskRuntimeMergeTarget & RepeatTaskIdLike>(
  loops: readonly TLoop[],
  loopId: string,
  status?: RepeatTaskStatusLike,
): TLoop[] {
  return loops.map((loop) => (
    loop.id === loopId ? applyRepeatTaskRuntimeStatus(loop, status) : loop
  ))
}

export function setRepeatTaskEnabledInList<TLoop extends RepeatTaskEnabledLike>(
  loops: readonly TLoop[],
  loopId: string,
  enabled: boolean,
): TLoop[] {
  return loops.map((loop) => (
    loop.id === loopId ? { ...loop, enabled } : loop
  ))
}

export function removeRepeatTaskFromList<TLoop extends RepeatTaskIdLike>(
  loops: readonly TLoop[],
  loopId: string,
): TLoop[] {
  return loops.filter((loop) => loop.id !== loopId)
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

export function resolveRepeatTaskIntervalMinutesDraft(
  draft: string,
  options: RepeatTaskIntervalDraftResolutionOptions,
): RepeatTaskIntervalDraftResolution {
  const parsedIntervalMinutes = parseLoopIntervalDraft(draft)
  return {
    parsedIntervalMinutes,
    intervalMinutes: parsedIntervalMinutes ?? options.existingIntervalMinutes ?? options.fallbackIntervalMinutes,
    isValid: parsedIntervalMinutes !== null,
  }
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

export function formatRepeatTaskEditFormData(loop: RepeatTaskEditFormSource): RepeatTaskEditFormData {
  return {
    name: loop.name,
    prompt: loop.prompt,
    intervalMinutes: String(loop.intervalMinutes),
    enabled: loop.enabled,
    profileId: loop.profileId || "",
    runOnStartup: loop.runOnStartup ?? DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
    speakOnTrigger: loop.speakOnTrigger ?? DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
    continueInSession: loop.continueInSession ?? DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession,
    lastSessionId: loop.lastSessionId || "",
    maxIterations: loop.maxIterations ? String(loop.maxIterations) : "",
    scheduleMode: getLoopScheduleMode(loop),
    scheduleTimes: getLoopScheduleTimes(loop),
    scheduleDaysOfWeek: getLoopScheduleDaysOfWeek(loop),
  }
}
