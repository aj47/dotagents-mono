import { describe, expect, it } from "vitest"

import {
  applyRepeatTaskUpdate,
  applyRepeatTaskRuntimeStatus,
  createRepeatTaskAction,
  buildRepeatTaskMutationResponse,
  buildRepeatTaskDeleteResponse,
  buildRepeatTaskResponse,
  buildRepeatTaskFromCreateRequest,
  buildRepeatTaskRuntimeActionResponse,
  buildRepeatTaskRunResponse,
  buildRepeatTaskExportMarkdownResponse,
  buildRepeatTaskStatusesResponse,
  buildRepeatTasksResponse,
  buildRepeatTaskToggleResponse,
  buildRepeatTaskScheduleFromDraft,
  computeNextScheduledRun,
  createRepeatTaskIdFromName,
  DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS,
  DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
  dedupeRepeatTaskEntriesByTitle,
  deleteRepeatTaskAction,
  describeLoopCadence,
  describeRepeatTaskRuntime,
  describeRepeatTaskScheduleForLog,
  describeSchedule,
  formatRepeatTaskRuntimeTimestamp,
  formatRepeatTaskRuntimeTimestampOrFallback,
  formatRepeatTaskTitle,
  formatLoopInterval,
  formatLoopIntervalDraft,
  getNextRepeatTaskDelayMs,
  getRepeatTaskTitleHints,
  getRepeatTaskIntervalMs,
  getRepeatTaskRunNowDescription,
  getLoopScheduleDaysOfWeek,
  getLoopScheduleMode,
  getLoopScheduleTimes,
  getRepeatTaskStatusesAction,
  getRepeatTasksAction,
  importRepeatTaskFromMarkdownAction,
  exportRepeatTaskToMarkdownAction,
  isContinuousRepeatTask,
  mergeRepeatTaskLayers,
  parseLoopIntervalDraft,
  parseRepeatTaskCreateRequestBody,
  parseRepeatTaskImportMarkdownRequestBody,
  parseRepeatTaskScheduleInput,
  parseRepeatTaskUpdateRequestBody,
  formatRepeatTaskForApi,
  hasRepeatTaskTitlePrefix,
  isRepeatTaskSession,
  partitionPinnedAndUnpinnedRepeatTaskEntries,
  partitionRepeatTaskAndUserEntries,
  runRepeatTaskAction,
  sanitizeScheduleTimes,
  startRepeatTaskAction,
  stopRepeatTaskAction,
  resolveRepeatTaskIntervalMinutesDraft,
  slugifyRepeatTaskName,
  TASK_SESSION_TITLE_PREFIX,
  toggleRepeatTaskAction,
  updateRepeatTaskAction,
} from "./repeat-task-utils"

describe("repeat task schedule helpers", () => {
  it("formats and detects repeat-task session titles", () => {
    expect(TASK_SESSION_TITLE_PREFIX).toBe("[Repeat] ")
    expect(formatRepeatTaskTitle("Daily standup")).toBe("[Repeat] Daily standup")
    expect(hasRepeatTaskTitlePrefix("[Repeat] Daily standup")).toBe(true)
    expect(hasRepeatTaskTitlePrefix("Daily standup")).toBe(false)
    expect(hasRepeatTaskTitlePrefix(undefined)).toBe(false)
  })

  it("creates repeat task ids from task names with fallback id generation", () => {
    expect(slugifyRepeatTaskName("  Daily Summary!  ")).toBe("daily-summary")
    expect(slugifyRepeatTaskName("Noon / Evening Review", 8)).toBe("noon-eve")
    expect(createRepeatTaskIdFromName("Daily Summary", () => "fallback")).toBe("daily-summary")
    expect(createRepeatTaskIdFromName("!!!", () => "fallback")).toBe("fallback")
  })

  it("builds repeat task title hints from names and prompt headings", () => {
    expect(getRepeatTaskTitleHints({
      name: "conversation-knowledge_review",
      prompt: "Intro\n# Daily Knowledge Run\nBody",
    })).toEqual([
      "conversation-knowledge_review",
      "[Repeat] conversation-knowledge_review",
      "Conversation Knowledge Review",
      "Daily Knowledge Run",
      "Daily Knowledge Run Run",
    ])

    expect(getRepeatTaskTitleHints({
      name: "summary of the day",
      prompt: "No heading",
    })).toEqual([
      "summary of the day",
      "[Repeat] summary of the day",
      "Summary Of The Day",
      "Summary Day",
    ])
  })

  it("detects repeat-task sessions from title prefixes, title hints, or backend flags", () => {
    expect(isRepeatTaskSession({ id: "s", conversationTitle: "[Repeat] Daily standup" })).toBe(true)
    expect(isRepeatTaskSession({ id: "s", conversationTitle: "Daily standup" })).toBe(false)
    expect(isRepeatTaskSession({ id: "s", isRepeatTask: true })).toBe(true)
    expect(isRepeatTaskSession(
      { id: "s", conversationTitle: "Conversation Knowledge Review" },
      new Set(["Conversation Knowledge Review"]),
    )).toBe(true)
  })

  it("partitions repeat-task entries and keeps child subagents with task parents", () => {
    const entries = [
      { session: { id: "u1", conversationTitle: "Hello" } },
      { session: { id: "parent-task", conversationTitle: "[Repeat] Cron" } },
      { session: { id: "task-subagent", parentSessionId: "parent-task" } },
      { session: { id: "u2", conversationTitle: "Quick question" } },
    ]

    const { userEntries, taskEntries } = partitionRepeatTaskAndUserEntries(entries)

    expect(userEntries.map((entry) => entry.session.id)).toEqual(["u1", "u2"])
    expect(taskEntries.map((entry) => entry.session.id)).toEqual(["parent-task", "task-subagent"])
  })

  it("dedupes repeat-task entries by normalized title while preferring active or newest runs", () => {
    expect(dedupeRepeatTaskEntriesByTitle([
      { session: { id: "active", conversationTitle: "[Repeat] Chess Trainer", status: "active", startTime: 300 } },
      { session: { id: "stopped", conversationTitle: "[Repeat] Chess Trainer", status: "stopped", startTime: 200, endTime: 250 } },
    ]).map((entry) => entry.session.id)).toEqual(["active"])

    expect(dedupeRepeatTaskEntriesByTitle([
      { session: { id: "older", conversationTitle: "Knowledge Review", status: "completed", startTime: 100, endTime: 150 } },
      { session: { id: "newer", conversationTitle: "Knowledge Review", status: "completed", startTime: 200, endTime: 250 } },
    ]).map((entry) => entry.session.id)).toEqual(["newer"])
  })

  it("partitions pinned repeat-task entries and keeps child subagents with pinned task parents", () => {
    const entries = [
      { session: { id: "parent-task", conversationId: "c1" } },
      { session: { id: "task-subagent", conversationId: "c2", parentSessionId: "parent-task" } },
      { session: { id: "other-task", conversationId: "c3" } },
    ]

    const { pinnedTaskEntries, unpinnedTaskEntries } =
      partitionPinnedAndUnpinnedRepeatTaskEntries(entries, new Set(["c1"]))

    expect(pinnedTaskEntries.map((entry) => entry.session.id)).toEqual(["parent-task", "task-subagent"])
    expect(unpinnedTaskEntries.map((entry) => entry.session.id)).toEqual(["other-task"])
  })

  it("merges global and workspace task layers by id with workspace overrides", () => {
    expect(mergeRepeatTaskLayers(
      [
        { id: "global-only", name: "Global Only" },
        { id: "overridden", name: "Global Version" },
      ],
      [
        { id: "overridden", name: "Workspace Version" },
        { id: "workspace-only", name: "Workspace Only" },
      ],
    )).toEqual([
      { id: "global-only", name: "Global Only" },
      { id: "overridden", name: "Workspace Version" },
      { id: "workspace-only", name: "Workspace Only" },
    ])
  })

  it("sanitizes, dedupes, and sorts HH:MM schedule times", () => {
    expect(sanitizeScheduleTimes([" 09:00 ", "25:00", "09:00", "17:30", "7:00"])).toEqual(["09:00", "17:30"])
  })

  it("describes daily and weekly schedules", () => {
    expect(describeSchedule({ type: "daily", times: ["09:00", "17:00"] })).toBe("Daily at 09:00, 17:00")
    expect(describeSchedule({ type: "weekly", times: ["09:00"], daysOfWeek: [1, 3, 5] })).toBe("Mon, Wed, Fri at 09:00")
    expect(describeRepeatTaskScheduleForLog({ intervalMinutes: 15, runContinuously: true })).toBe("continuous")
    expect(describeRepeatTaskScheduleForLog({ intervalMinutes: 15 })).toBe("interval: 15m")
    expect(describeRepeatTaskScheduleForLog({
      intervalMinutes: 15,
      schedule: { type: "weekly", times: ["09:00"], daysOfWeek: [1, 3, 5] },
    })).toBe("schedule: weekly Mon,Wed,Fri at 09:00")
  })

  it("formats repeat task intervals compactly", () => {
    expect(formatLoopInterval(15)).toBe("15m")
    expect(formatLoopInterval(60)).toBe("1h")
    expect(formatLoopInterval(75)).toBe("1h 15m")
    expect(formatLoopInterval(1440)).toBe("1d")
    expect(formatLoopInterval(1500)).toBe("1d 1h")
    expect(formatLoopInterval(1505)).toBe("1d 1h 5m")
  })

  it("describes loop cadence consistently", () => {
    expect(describeLoopCadence({ intervalMinutes: 15 })).toBe("Every 15m")
    expect(describeLoopCadence({ intervalMinutes: 15, runContinuously: true })).toBe("Continuous")
    expect(describeLoopCadence({ intervalMinutes: 15, schedule: { type: "daily", times: ["09:00"] } })).toBe("Daily at 09:00")
    expect(getRepeatTaskRunNowDescription({ intervalMinutes: 15, enabled: true })).toBe("Run repeat task now • Every 15m")
    expect(getRepeatTaskRunNowDescription({
      intervalMinutes: 15,
      enabled: false,
      schedule: { type: "daily", times: ["09:00"] },
    })).toBe("Run repeat task now • Daily at 09:00 • Disabled")
  })

  it("formats repeat task runtime status for shared desktop and mobile surfaces", () => {
    const timestamp = Date.UTC(2026, 0, 5, 9, 30)
    const timestampFormatOptions = {
      locale: "en-US",
      dateTimeFormatOptions: {
        timeZone: "UTC",
        hour: "numeric",
        minute: "2-digit",
      },
    } as const

    expect(formatRepeatTaskRuntimeTimestamp(timestamp, timestampFormatOptions)).toBe("9:30 AM")
    expect(formatRepeatTaskRuntimeTimestamp(undefined, timestampFormatOptions)).toBeUndefined()
    expect(formatRepeatTaskRuntimeTimestampOrFallback(undefined, "Never", timestampFormatOptions)).toBe("Never")
    expect(describeRepeatTaskRuntime({ enabled: true, isRunning: true })).toBe("Running now")
    expect(describeRepeatTaskRuntime({ enabled: true, nextRunAt: timestamp }, { timestampFormatOptions })).toBe("Next: 9:30 AM")
    expect(describeRepeatTaskRuntime({ enabled: false })).toBe("Disabled")
    expect(describeRepeatTaskRuntime({ enabled: true })).toBe("No scheduled run")
  })

  it("applies repeat task runtime status updates without app-specific merge logic", () => {
    const loop = {
      name: "Daily Review",
      enabled: true,
      isRunning: false,
      lastRunAt: 10,
      nextRunAt: 20,
      intervalMinutes: 15,
      schedule: null,
    }

    expect(applyRepeatTaskRuntimeStatus(loop)).toBe(loop)
    expect(applyRepeatTaskRuntimeStatus(loop, {
      name: "Daily Review Updated",
      enabled: false,
      isRunning: true,
      lastRunAt: 30,
      nextRunAt: 40,
      intervalMinutes: 60,
      schedule: { type: "daily", times: ["09:00"] },
    })).toEqual({
      name: "Daily Review Updated",
      enabled: false,
      isRunning: true,
      lastRunAt: 30,
      nextRunAt: 40,
      intervalMinutes: 60,
      schedule: { type: "daily", times: ["09:00"] },
    })
  })

  it("computes local repeat task scheduling timestamps and delay fallbacks", () => {
    const mondayAt0830 = new Date(2026, 0, 5, 8, 30, 0, 0).getTime()
    const mondayAt0900 = new Date(2026, 0, 5, 9, 0, 0, 0).getTime()
    const mondayAt1700 = new Date(2026, 0, 5, 17, 0, 0, 0).getTime()
    const tuesdayAt0900 = new Date(2026, 0, 6, 9, 0, 0, 0).getTime()

    expect(computeNextScheduledRun({ type: "daily", times: ["09:00", "17:00"] }, mondayAt0830)).toBe(mondayAt0900)
    expect(computeNextScheduledRun({ type: "daily", times: ["09:00"] }, mondayAt0900)).toBe(tuesdayAt0900)
    expect(computeNextScheduledRun({ type: "weekly", times: ["17:00"], daysOfWeek: [1] }, mondayAt0830)).toBe(mondayAt1700)
    expect(computeNextScheduledRun({ type: "weekly", times: ["bad"], daysOfWeek: [1] }, mondayAt0830)).toBeNull()
    expect(computeNextScheduledRun({ type: "weekly", times: ["09:00"], daysOfWeek: [9] }, mondayAt0830)).toBeNull()

    expect(isContinuousRepeatTask({ runContinuously: true })).toBe(true)
    expect(getRepeatTaskIntervalMs(0.5)).toEqual({
      delayMs: 60_000,
      intervalMinutes: 1,
      wasClamped: true,
    })
    expect(getNextRepeatTaskDelayMs({ intervalMinutes: 15, runContinuously: true }, mondayAt0830)).toEqual({
      delayMs: 0,
      invalidSchedule: false,
    })
    expect(getNextRepeatTaskDelayMs({
      intervalMinutes: 15,
      schedule: { type: "daily", times: ["09:00"] },
    }, mondayAt0830)).toEqual({
      delayMs: 30 * 60 * 1000,
      nextRunAt: mondayAt0900,
      invalidSchedule: false,
    })
    expect(getNextRepeatTaskDelayMs({
      intervalMinutes: 0,
      schedule: { type: "weekly", times: [], daysOfWeek: [] },
    }, mondayAt0830)).toEqual({
      delayMs: 60_000,
      invalidSchedule: true,
      clampedIntervalMinutes: 1,
    })
  })

  it("parses and formats editable interval drafts", () => {
    expect(formatLoopIntervalDraft(0)).toBe("1")
    expect(formatLoopIntervalDraft(60.8)).toBe("60")
    expect(parseLoopIntervalDraft("60")).toBe(60)
    expect(parseLoopIntervalDraft("")).toBeNull()
    expect(parseLoopIntervalDraft("1.5")).toBeNull()
    expect(parseLoopIntervalDraft("0")).toBeNull()
    expect(resolveRepeatTaskIntervalMinutesDraft(" 45 ", { fallbackIntervalMinutes: 15 })).toEqual({
      parsedIntervalMinutes: 45,
      intervalMinutes: 45,
      isValid: true,
    })
    expect(resolveRepeatTaskIntervalMinutesDraft("", {
      existingIntervalMinutes: 30,
      fallbackIntervalMinutes: 15,
    })).toEqual({
      parsedIntervalMinutes: null,
      intervalMinutes: 30,
      isValid: false,
    })
    expect(resolveRepeatTaskIntervalMinutesDraft("", { fallbackIntervalMinutes: 15 })).toEqual({
      parsedIntervalMinutes: null,
      intervalMinutes: 15,
      isValid: false,
    })
  })

  it("derives schedule form defaults from an existing loop", () => {
    const weekly = { runContinuously: false, schedule: { type: "weekly" as const, times: ["10:00"], daysOfWeek: [2] } }
    expect(getLoopScheduleMode(weekly)).toBe("weekly")
    expect(getLoopScheduleTimes(weekly)).toEqual(["10:00"])
    expect(getLoopScheduleDaysOfWeek(weekly)).toEqual([2])

    const interval = { intervalMinutes: 15, schedule: null }
    expect(getLoopScheduleMode(interval)).toBe("interval")
    expect(getLoopScheduleTimes(interval)).toEqual(["09:00"])
    expect(getLoopScheduleDaysOfWeek(interval)).toEqual([1, 2, 3, 4, 5])
  })

  it("builds repeat task schedules from editable drafts", () => {
    expect(buildRepeatTaskScheduleFromDraft({
      scheduleMode: "interval",
      scheduleTimes: [],
      scheduleDaysOfWeek: [],
    })).toEqual({ ok: true, schedule: null, runContinuously: false })
    expect(buildRepeatTaskScheduleFromDraft({
      scheduleMode: "continuous",
      scheduleTimes: ["09:00"],
      scheduleDaysOfWeek: [1],
    })).toEqual({ ok: true, schedule: null, runContinuously: true })
    expect(buildRepeatTaskScheduleFromDraft({
      scheduleMode: "daily",
      scheduleTimes: [" 17:00 ", "bad", "09:00", "09:00"],
      scheduleDaysOfWeek: [],
    })).toEqual({ ok: true, schedule: { type: "daily", times: ["09:00", "17:00"] }, runContinuously: false })
    expect(buildRepeatTaskScheduleFromDraft({
      scheduleMode: "weekly",
      scheduleTimes: ["09:00"],
      scheduleDaysOfWeek: [5, 1, 1, 8],
    })).toEqual({
      ok: true,
      schedule: { type: "weekly", times: ["09:00"], daysOfWeek: [1, 5] },
      runContinuously: false,
    })
    expect(buildRepeatTaskScheduleFromDraft({
      scheduleMode: "daily",
      scheduleTimes: ["9:00"],
      scheduleDaysOfWeek: [],
    })).toEqual({ ok: false, error: "missing-schedule-times" })
    expect(buildRepeatTaskScheduleFromDraft({
      scheduleMode: "weekly",
      scheduleTimes: ["09:00"],
      scheduleDaysOfWeek: [],
    })).toEqual({ ok: false, error: "missing-weekly-days" })
  })

  it("parses remote repeat task schedule input", () => {
    expect(parseRepeatTaskScheduleInput(undefined)).toEqual({ ok: true, schedule: undefined })
    expect(parseRepeatTaskScheduleInput(null)).toEqual({ ok: true, schedule: null })
    expect(parseRepeatTaskScheduleInput({ type: "daily", times: ["17:00", "09:00", "09:00"] })).toEqual({
      ok: true,
      schedule: { type: "daily", times: ["09:00", "17:00"] },
    })
    expect(parseRepeatTaskScheduleInput({ type: "weekly", times: ["09:00"], daysOfWeek: ["5", 1, 1] })).toEqual({
      ok: true,
      schedule: { type: "weekly", times: ["09:00"], daysOfWeek: [1, 5] },
    })
    expect(parseRepeatTaskScheduleInput({ type: "weekly", times: ["9:00"], daysOfWeek: [1] })).toEqual({
      ok: false,
      error: "schedule.times must all be HH:MM (24h) strings",
    })
    expect(parseRepeatTaskScheduleInput({ type: "weekly", times: ["09:00"], daysOfWeek: [7] })).toEqual({
      ok: false,
      error: "schedule.daysOfWeek values must be integers 0..6 (Sun..Sat)",
    })
  })

  it("parses repeat task create requests and builds records", () => {
    const parsed = parseRepeatTaskCreateRequestBody({
      name: " Morning check ",
      prompt: " summarize overnight work ",
      profileId: " agent-profile ",
      schedule: { type: "daily", times: ["17:00", "09:00"] },
    })

    expect(parsed).toEqual({
      ok: true,
      request: {
        name: "Morning check",
        prompt: "summarize overnight work",
        intervalMinutes: DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
        enabled: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.enabled,
        profileId: "agent-profile",
        runOnStartup: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
        speakOnTrigger: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
        continueInSession: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession,
        runContinuously: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runContinuously,
        schedule: { type: "daily", times: ["09:00", "17:00"] },
      },
    })
    if (!parsed.ok) throw new Error("expected create request to parse")

    expect(buildRepeatTaskFromCreateRequest("loop_1", parsed.request)).toEqual({
      id: "loop_1",
      name: "Morning check",
      prompt: "summarize overnight work",
      intervalMinutes: DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
      enabled: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.enabled,
      profileId: "agent-profile",
      runOnStartup: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup,
      speakOnTrigger: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger,
      continueInSession: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession,
      runContinuously: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runContinuously,
      schedule: { type: "daily", times: ["09:00", "17:00"] },
    })

    const advancedParsed = parseRepeatTaskCreateRequestBody({
      name: "Advanced",
      prompt: "run it",
      runOnStartup: true,
      speakOnTrigger: true,
      continueInSession: true,
      lastSessionId: " session-1 ",
      maxIterations: 5,
      runContinuously: true,
    })
    expect(advancedParsed).toEqual({
      ok: true,
      request: {
        name: "Advanced",
        prompt: "run it",
        intervalMinutes: DEFAULT_REPEAT_TASK_INTERVAL_MINUTES,
        enabled: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.enabled,
        profileId: undefined,
        runOnStartup: true,
        speakOnTrigger: true,
        continueInSession: true,
        lastSessionId: "session-1",
        runContinuously: true,
        maxIterations: 5,
      },
    })
  })

  it("validates repeat task create requests", () => {
    expect(parseRepeatTaskCreateRequestBody({})).toEqual({
      ok: false,
      statusCode: 400,
      error: "name and prompt are required and must be non-empty strings",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", intervalMinutes: 0 })).toEqual({
      ok: false,
      statusCode: 400,
      error: "intervalMinutes must be a finite integer >= 1 when provided",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", enabled: "yes" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "enabled must be a boolean when provided",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", profileId: 1 })).toEqual({
      ok: false,
      statusCode: 400,
      error: "profileId must be a string when provided",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", runContinuously: "yes" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "runContinuously must be a boolean when provided",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", runOnStartup: "yes" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "runOnStartup must be a boolean when provided",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", maxIterations: 1.5 })).toEqual({
      ok: false,
      statusCode: 400,
      error: "maxIterations must be a finite integer >= 1 when provided",
    })
    expect(parseRepeatTaskCreateRequestBody({ name: "n", prompt: "p", schedule: "daily" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "schedule must be an object, null, or omitted",
    })
  })

  it("parses repeat task updates and applies them without losing existing fields", () => {
    const existing = {
      id: "loop_1",
      name: "Old",
      prompt: "old prompt",
      intervalMinutes: 30,
      enabled: true,
      profileId: "profile_1",
      continueInSession: true,
      lastSessionId: "session_1",
      maxIterations: 10,
      runContinuously: false,
      schedule: { type: "daily" as const, times: ["09:00"] },
      lastRunAt: 123,
    }
    const parsed = parseRepeatTaskUpdateRequestBody({
      name: " New ",
      profileId: "",
      continueInSession: false,
      maxIterations: null,
      schedule: { type: "weekly", times: ["08:00"], daysOfWeek: ["5", 1] },
    })

    expect(parsed).toEqual({
      ok: true,
      request: {
        name: "New",
        profileId: null,
        continueInSession: false,
        maxIterations: null,
        schedule: { type: "weekly", times: ["08:00"], daysOfWeek: [1, 5] },
      },
    })
    if (!parsed.ok) throw new Error("expected update request to parse")

    const updated = applyRepeatTaskUpdate(existing, parsed.request)
    expect(updated).toMatchObject({
      id: "loop_1",
      name: "New",
      prompt: "old prompt",
      intervalMinutes: 30,
      enabled: true,
      continueInSession: false,
      runContinuously: false,
      schedule: { type: "weekly", times: ["08:00"], daysOfWeek: [1, 5] },
      lastRunAt: 123,
    })
    expect(updated.profileId).toBeUndefined()
    expect(updated.lastSessionId).toBeUndefined()
    expect(updated.maxIterations).toBeUndefined()
  })

  it("applies repeat task schedule clearing and continuous updates", () => {
    const existing = {
      id: "loop_1",
      name: "Loop",
      prompt: "prompt",
      intervalMinutes: 30,
      enabled: true,
      runContinuously: false,
      schedule: { type: "daily" as const, times: ["09:00"] },
    }

    expect(applyRepeatTaskUpdate(existing, { schedule: null })).toEqual({
      id: "loop_1",
      name: "Loop",
      prompt: "prompt",
      intervalMinutes: 30,
      enabled: true,
      runContinuously: false,
    })
    expect(applyRepeatTaskUpdate(existing, { runContinuously: true })).toEqual({
      id: "loop_1",
      name: "Loop",
      prompt: "prompt",
      intervalMinutes: 30,
      enabled: true,
      runContinuously: true,
    })
    expect(applyRepeatTaskUpdate(existing, {})).toEqual(existing)
  })

  it("validates repeat task update requests", () => {
    expect(parseRepeatTaskUpdateRequestBody({ name: "" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "name must be a non-empty string when provided",
    })
    expect(parseRepeatTaskUpdateRequestBody({ prompt: "" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "prompt must be a non-empty string when provided",
    })
    expect(parseRepeatTaskUpdateRequestBody({ intervalMinutes: 1.5 })).toEqual({
      ok: false,
      statusCode: 400,
      error: "intervalMinutes must be a finite integer >= 1 when provided",
    })
    expect(parseRepeatTaskUpdateRequestBody({ enabled: "yes" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "enabled must be a boolean when provided",
    })
    expect(parseRepeatTaskUpdateRequestBody({ profileId: false })).toEqual({
      ok: false,
      statusCode: 400,
      error: "profileId must be a string when provided",
    })
    expect(parseRepeatTaskUpdateRequestBody({ runContinuously: "yes" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "runContinuously must be a boolean when provided",
    })
    expect(parseRepeatTaskImportMarkdownRequestBody({ content: "   " })).toEqual({
      ok: false,
      statusCode: 400,
      error: "Repeat task Markdown content is required",
    })
    expect(parseRepeatTaskImportMarkdownRequestBody({ content: "  ---\nkind: task\n---\nRun" })).toEqual({
      ok: true,
      request: { content: "  ---\nkind: task\n---\nRun" },
    })
  })

  it("formats repeat tasks for the remote API", () => {
    const loop = {
      id: "loop_1",
      name: "Morning check",
      prompt: "summarize overnight work",
      intervalMinutes: 60,
      enabled: true,
      profileId: "profile_1",
      runOnStartup: true,
      speakOnTrigger: false,
      continueInSession: true,
      lastSessionId: "session_1",
      runContinuously: false,
      maxIterations: 7,
      lastRunAt: 100,
      schedule: { type: "daily" as const, times: ["09:00"] },
    }

    expect(formatRepeatTaskForApi(loop, {
      profileName: "Research Agent",
      status: { lastRunAt: 200, isRunning: true, nextRunAt: 300 },
    })).toEqual({
      id: "loop_1",
      name: "Morning check",
      prompt: "summarize overnight work",
      intervalMinutes: 60,
      enabled: true,
      profileId: "profile_1",
      profileName: "Research Agent",
      runOnStartup: true,
      speakOnTrigger: false,
      continueInSession: true,
      lastSessionId: "session_1",
      runContinuously: false,
      maxIterations: 7,
      lastRunAt: 200,
      isRunning: true,
      nextRunAt: 300,
      schedule: { type: "daily", times: ["09:00"] },
    })

    expect(buildRepeatTaskResponse(loop).loop).toMatchObject({
      id: "loop_1",
      lastRunAt: 100,
      isRunning: false,
    })
    expect(buildRepeatTaskMutationResponse(loop).success).toBe(true)
    expect(buildRepeatTaskToggleResponse("loop_1", false)).toEqual({
      success: true,
      id: "loop_1",
      enabled: false,
    })
    expect(buildRepeatTaskRunResponse("loop_1")).toEqual({
      success: true,
      id: "loop_1",
    })
    expect(buildRepeatTaskExportMarkdownResponse("loop_1", "---\nkind: task\n---\nRun")).toEqual({
      success: true,
      loopId: "loop_1",
      markdown: "---\nkind: task\n---\nRun",
    })
    expect(buildRepeatTaskDeleteResponse("loop_1")).toEqual({
      success: true,
      id: "loop_1",
    })
  })

  it("builds repeat task list responses with statuses and profile names", () => {
    const loops = [
      {
        id: "loop_1",
        name: "One",
        prompt: "first",
        intervalMinutes: 15,
        enabled: true,
        profileId: "profile_1",
      },
      {
        id: "loop_2",
        name: "Two",
        prompt: "second",
        intervalMinutes: 30,
        enabled: false,
        lastRunAt: 10,
      },
    ]

    expect(buildRepeatTasksResponse(loops, {
      statuses: [
        { id: "loop_1", lastRunAt: 20, isRunning: true, nextRunAt: 40 },
        { id: "missing", lastRunAt: 99, isRunning: true },
      ],
      getProfileName: profileId => profileId === "profile_1" ? "Research Agent" : undefined,
    })).toEqual({
      loops: [
        {
          id: "loop_1",
          name: "One",
          prompt: "first",
          intervalMinutes: 15,
          enabled: true,
          profileId: "profile_1",
          profileName: "Research Agent",
          runOnStartup: undefined,
          speakOnTrigger: undefined,
          continueInSession: undefined,
          lastSessionId: undefined,
          runContinuously: undefined,
          maxIterations: undefined,
          lastRunAt: 20,
          isRunning: true,
          nextRunAt: 40,
          schedule: undefined,
        },
        {
          id: "loop_2",
          name: "Two",
          prompt: "second",
          intervalMinutes: 30,
          enabled: false,
          profileId: undefined,
          profileName: undefined,
          runOnStartup: undefined,
          speakOnTrigger: undefined,
          continueInSession: undefined,
          lastSessionId: undefined,
          runContinuously: undefined,
          maxIterations: undefined,
          lastRunAt: 10,
          isRunning: false,
          nextRunAt: undefined,
          schedule: undefined,
        },
      ],
    })
  })

  it("runs shared repeat task route actions through loop service adapters", async () => {
    const loop = {
      id: "loop_1",
      name: "Morning check",
      prompt: "summarize overnight work",
      intervalMinutes: 60,
      enabled: true,
      profileId: "profile_1",
    }
    const loopsById = new Map([[loop.id, loop]])
    const statuses = [{ id: "loop_1", lastRunAt: 20, isRunning: false, nextRunAt: 40 }]
    const started: string[] = []
    const stopped: string[] = []
    const triggered: string[] = []
    const loopService = {
      getLoops: () => Array.from(loopsById.values()),
      getLoopStatuses: () => statuses,
      getLoop: (id: string) => loopsById.get(id),
      saveLoop: (nextLoop: typeof loop) => {
        loopsById.set(nextLoop.id, nextLoop)
        return true
      },
      startLoop: (id: string) => {
        started.push(id)
      },
      stopLoop: (id: string) => {
        stopped.push(id)
      },
      triggerLoop: (id: string) => {
        triggered.push(id)
        return true
      },
      getLoopStatus: (id: string) => statuses.find(status => status.id === id),
      deleteLoop: (id: string) => loopsById.delete(id),
    }
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }
    const options = {
      loadLoopService: async () => loopService,
      getConfig: () => ({ loops: [] }),
      saveConfig: () => {
        throw new Error("unexpected config save")
      },
      createId: () => "loop_new",
      getProfileName: (profileId?: string) => profileId === "profile_1" ? "Research Agent" : undefined,
      diagnostics,
    }

    await expect(getRepeatTasksAction(options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTasksResponse([loop], {
        statuses,
        getProfileName: options.getProfileName,
      }),
    })
    await expect(getRepeatTaskStatusesAction(options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskStatusesResponse(statuses),
    })
    await expect(startRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskRuntimeActionResponse("loop_1", statuses[0]),
    })
    await expect(stopRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskRuntimeActionResponse("loop_1", statuses[0]),
    })
    await expect(toggleRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskToggleResponse("loop_1", false),
    })
    await expect(runRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskRunResponse("loop_1"),
    })
    await expect(createRepeatTaskAction({
      name: "New task",
      prompt: "Do it",
      enabled: true,
    }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: { loop: { id: "loop_new", name: "New task", prompt: "Do it", enabled: true } },
    })
    await expect(importRepeatTaskFromMarkdownAction({
      content: "---\nkind: task\nid: loop_imported\nname: Imported task\nintervalMinutes: 30\nenabled: true\n---\nImported prompt",
    }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, loop: { id: "loop_imported", name: "Imported task", prompt: "Imported prompt", enabled: true } },
    })
    await expect(exportRepeatTaskToMarkdownAction("loop_1", options)).resolves.toMatchObject({
      statusCode: 200,
      body: {
        success: true,
        loopId: "loop_1",
        markdown: expect.stringContaining("name: Morning check"),
      },
    })
    await expect(updateRepeatTaskAction("loop_1", { name: "Updated", enabled: true }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, loop: { id: "loop_1", name: "Updated", enabled: true } },
    })
    await expect(deleteRepeatTaskAction("loop_new", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskDeleteResponse("loop_new"),
    })
    expect(started).toEqual(["loop_1", "loop_new", "loop_imported", "loop_1"])
    expect(stopped).toEqual(["loop_1", "loop_1", "loop_imported", "loop_1"])
    expect(triggered).toEqual(["loop_1"])
  })

  it("runs shared repeat task route actions against fallback config storage", async () => {
    const loop = {
      id: "loop_1",
      name: "Morning check",
      prompt: "summarize overnight work",
      intervalMinutes: 60,
      enabled: true,
    }
    let config = { loops: [loop] }
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }
    const options = {
      loadLoopService: async () => null,
      getConfig: () => config,
      saveConfig: (nextConfig: typeof config) => {
        config = nextConfig
      },
      createId: () => "loop_new",
      diagnostics,
    }

    await expect(toggleRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskToggleResponse("loop_1", false),
    })
    expect(config.loops[0].enabled).toBe(false)

    await expect(getRepeatTaskStatusesAction(options)).resolves.toEqual({
      statusCode: 200,
      body: { statuses: [] },
    })
    await expect(startRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 503,
      body: { error: "Repeat task service is unavailable" },
    })
    await expect(stopRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 503,
      body: { error: "Repeat task service is unavailable" },
    })
    await expect(runRepeatTaskAction("loop_1", options)).resolves.toEqual({
      statusCode: 503,
      body: { error: "Repeat task service is unavailable" },
    })
    await expect(createRepeatTaskAction({ name: "New task", prompt: "Do it" }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: { loop: { id: "loop_new", name: "New task" } },
    })
    await expect(importRepeatTaskFromMarkdownAction({
      content: "---\nkind: task\nid: loop_imported\nname: Imported\n---\nImported prompt",
    }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, loop: { id: "loop_imported", name: "Imported" } },
    })
    await expect(exportRepeatTaskToMarkdownAction("loop_imported", options)).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, loopId: "loop_imported", markdown: expect.stringContaining("Imported prompt") },
    })
    await expect(updateRepeatTaskAction("loop_new", { prompt: "Updated prompt" }, options)).resolves.toMatchObject({
      statusCode: 200,
      body: { success: true, loop: { id: "loop_new", prompt: "Updated prompt" } },
    })
    await expect(deleteRepeatTaskAction("loop_new", options)).resolves.toEqual({
      statusCode: 200,
      body: buildRepeatTaskDeleteResponse("loop_new"),
    })
  })

  it("logs shared repeat task failures and preserves route error mapping", async () => {
    const caughtFailure = new Error("storage failed")
    const loggedErrors: unknown[] = []
    const diagnostics = {
      logError: (source: string, message: string, caughtError: unknown) => {
        loggedErrors.push({ source, message, caughtError })
      },
    }

    await expect(getRepeatTasksAction({
      loadLoopService: () => {
        throw caughtFailure
      },
      getConfig: () => ({ loops: [] }),
      saveConfig: () => undefined,
      createId: () => "loop_new",
      diagnostics,
    })).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to get repeat tasks" },
    })
    await expect(toggleRepeatTaskAction("missing", {
      loadLoopService: () => null,
      getConfig: () => ({ loops: [] }),
      saveConfig: () => undefined,
      createId: () => "loop_new",
      diagnostics,
    })).resolves.toEqual({
      statusCode: 404,
      body: { error: "Repeat task not found" },
    })
    expect(loggedErrors).toEqual([
      {
        source: "repeat-task-actions",
        message: "Failed to get repeat tasks",
        caughtError: caughtFailure,
      },
    ])
  })
})
