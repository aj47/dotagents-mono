import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsSkillsSource = readFileSync(new URL("./settings-skills.tsx", import.meta.url), "utf8")

describe("settings skills page layout", () => {
  it("lets skill names keep readable width under tighter settings constraints", () => {
    expect(settingsSkillsSource).toContain(
      'className={`flex flex-wrap items-start gap-2 rounded-lg border bg-card px-3 py-2 ${isSelectMode ? "cursor-pointer hover:bg-accent/50" : ""} ${isSelectMode && isSkillSelected ? "border-primary bg-primary/5" : ""}`}',
    )
    expect(settingsSkillsSource).toContain(
      'className="flex min-w-0 flex-[1_1_16rem] items-start gap-3"',
    )
    expect(settingsSkillsSource).toContain(
      'className="min-w-0 flex-1 break-words font-medium leading-tight [overflow-wrap:anywhere]"',
    )
  })

  it("lets the action strip wrap below the title lane instead of forcing truncation", () => {
    expect(settingsSkillsSource).toContain(
      'className="flex w-full max-w-full flex-wrap items-center justify-end gap-1 sm:ml-auto sm:w-auto"',
    )
    const shrinkSafeActions = settingsSkillsSource.match(/className="shrink-0"/g)

    expect(shrinkSafeActions).not.toBeNull()
    expect(shrinkSafeActions?.length).toBeGreaterThanOrEqual(4)
  })

  it("gives icon-only skill actions explicit labels and tooltips", () => {
    expect(settingsSkillsSource).toContain('const skillLabel = skill.name || "skill"')
    expect(settingsSkillsSource).toContain('aria-label={`${isSkillSelected ? "Deselect" : "Select"} ${skillLabel}`}')
    expect(settingsSkillsSource).toContain('title={`Edit ${skillLabel}`}')
    expect(settingsSkillsSource).toContain('aria-label={`Edit ${skillLabel}`}')
    expect(settingsSkillsSource).toContain('title={`Reveal ${skillLabel} skill file in Finder/Explorer`}')
    expect(settingsSkillsSource).toContain('aria-label={`Reveal ${skillLabel} skill file`}')
    expect(settingsSkillsSource).toContain('title={`Export ${skillLabel}`}')
    expect(settingsSkillsSource).toContain('aria-label={`Export ${skillLabel}`}')
    expect(settingsSkillsSource).toContain('title={`Delete ${skillLabel}`}')
    expect(settingsSkillsSource).toContain('aria-label={`Delete ${skillLabel}`}')
  })
})