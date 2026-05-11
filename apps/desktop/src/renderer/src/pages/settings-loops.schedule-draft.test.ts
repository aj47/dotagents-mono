import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsLoopsSource = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

describe("settings loops schedule drafts", () => {
  it("uses the shared repeat task schedule draft helper", () => {
    expect(settingsLoopsSource).toContain("updateRepeatTaskScheduleTimeAt(editing.scheduleTimes, idx, e.target.value)")
    expect(settingsLoopsSource).toContain("removeRepeatTaskScheduleTimeAt(editing.scheduleTimes, idx)")
    expect(settingsLoopsSource).toContain("addRepeatTaskScheduleTime(editing.scheduleTimes)")
    expect(settingsLoopsSource).toContain("toggleRepeatTaskScheduleDayOfWeek(editing.scheduleDaysOfWeek, dayIdx)")
    expect(settingsLoopsSource).not.toContain("sanitizeScheduleTimes")
    expect(settingsLoopsSource).not.toContain("let schedule: LoopSchedule")
    expect(settingsLoopsSource).not.toContain("const next = [...editing.scheduleTimes]")
    expect(settingsLoopsSource).not.toContain("editing.scheduleTimes.filter((_, i) => i !== idx)")
    expect(settingsLoopsSource).not.toContain("editing.scheduleDaysOfWeek.filter((d) => d !== dayIdx)")
    expect(settingsLoopsSource).not.toContain("buildRepeatTaskScheduleFromDraft")
  })

  it("uses shared repeat task execution defaults in the edit form", () => {
    expect(settingsLoopsSource).toContain("DEFAULT_REPEAT_TASK_EDIT_FORM_DATA")
    expect(settingsLoopsSource).toContain("formatRepeatTaskEditFormData(loop)")
    expect(settingsLoopsSource).toContain("useState<RepeatTaskEditFormData | null>(null)")
    expect(settingsLoopsSource).toContain("buildRepeatTaskEditFormSavePayload(editing")
    expect(settingsLoopsSource).toContain("APP_SHELL_LOOP_EDITOR_PRESENTATION.description")
    expect(settingsLoopsSource).toContain("APP_SHELL_LOOP_EDITOR_PRESENTATION.fields.prompt.placeholder")
    expect(settingsLoopsSource).toContain("APP_SHELL_LOOP_EDITOR_PRESENTATION.sessionPicker.desktopHelper")
    expect(settingsLoopsSource).toContain("...(payload.profileId ? { profileId: payload.profileId } : {})")
    expect(settingsLoopsSource).toContain("...(payload.maxIterations ? { maxIterations: payload.maxIterations } : {})")
    expect(settingsLoopsSource).toContain("REPEAT_TASK_INTERVAL_PRESETS")
    expect(settingsLoopsSource).not.toContain("const INTERVAL_PRESETS")
    expect(settingsLoopsSource).not.toContain("interface EditingLoop")
    expect(settingsLoopsSource).not.toContain("const emptyLoop")
    expect(settingsLoopsSource).not.toContain("intervalMinutesDraft")
    expect(settingsLoopsSource).not.toContain("resolveRepeatTaskIntervalMinutesDraft")
    expect(settingsLoopsSource).not.toContain("Set the prompt, schedule, and startup behavior.")
  })
})
