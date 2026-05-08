import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const slashCommandMenuSource = readFileSync(
  new URL("./slash-command-menu.tsx", import.meta.url),
  "utf8",
)

describe("slash command menu repeat-task support", () => {
  it("loads repeat tasks into the shared slash-command list", () => {
    expect(slashCommandMenuSource).toContain("buildPromptLibraryCommandItems")
    expect(slashCommandMenuSource).toContain("filterPromptLibraryCommandItems")
    expect(slashCommandMenuSource).toContain("promptDescriptionMaxLength: 80")
    expect(slashCommandMenuSource).toContain("getTaskDescription: getRepeatTaskRunNowDescription")
    expect(slashCommandMenuSource).toContain('queryKey: ["loops"]')
    expect(slashCommandMenuSource).toContain("queryFn: () => desktopLoopsClient.getLoops()")
    expect(slashCommandMenuSource).toContain("type PromptLibraryCommandItem")
  })

  it("triggers repeat tasks instead of inserting them into the composer", () => {
    expect(slashCommandMenuSource).toContain('if (item.type === "loop")')
    expect(slashCommandMenuSource).toContain("const result = await desktopLoopsClient.triggerLoop(item.id)")
    expect(slashCommandMenuSource).toContain('toast.success(`Running "${item.name}"...`)')
    expect(slashCommandMenuSource).toContain('toast.error("Failed to trigger task")')
  })
})
