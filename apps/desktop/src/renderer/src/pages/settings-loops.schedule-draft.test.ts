import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsLoopsSource = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

describe("settings loops schedule drafts", () => {
  it("uses the shared repeat task schedule draft helper", () => {
    expect(settingsLoopsSource).toContain("buildRepeatTaskScheduleFromDraft")
    expect(settingsLoopsSource).not.toContain("sanitizeScheduleTimes")
    expect(settingsLoopsSource).not.toContain("let schedule: LoopSchedule")
  })

  it("uses shared repeat task execution defaults in the edit form", () => {
    expect(settingsLoopsSource).toContain("DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS")
    expect(settingsLoopsSource).toContain("runOnStartup: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.runOnStartup")
    expect(settingsLoopsSource).toContain("speakOnTrigger: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.speakOnTrigger")
    expect(settingsLoopsSource).toContain("continueInSession: DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS.continueInSession")
  })
})
