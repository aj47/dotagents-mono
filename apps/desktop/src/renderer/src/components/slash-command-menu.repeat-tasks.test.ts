import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const slashCommandMenuSource = readFileSync(
  new URL("./slash-command-menu.tsx", import.meta.url),
  "utf8",
)

describe("slash command menu repeat-task support", () => {
  it("loads repeat tasks into the shared slash-command list", () => {
    expect(slashCommandMenuSource).toContain("getPromptLibrarySkillContent(s)")
    expect(slashCommandMenuSource).toContain("getPromptLibrarySkillDescription(s)")
    expect(slashCommandMenuSource).toContain('queryKey: ["loops"]')
    expect(slashCommandMenuSource).toContain('queryFn: () => tipcClient.getLoops() as Promise<LoopConfig[]>')
    expect(slashCommandMenuSource).toContain('type: "loop" as const')
    expect(slashCommandMenuSource).toContain('Run repeat task now • Every ${formatLoopInterval(loop.intervalMinutes)}')
  })

  it("triggers repeat tasks instead of inserting them into the composer", () => {
    expect(slashCommandMenuSource).toContain('if (item.type === "loop")')
    expect(slashCommandMenuSource).toContain('const result = await tipcClient.triggerLoop?.({ loopId: item.id })')
    expect(slashCommandMenuSource).toContain('toast.success(`Running "${item.name}"...`)')
    expect(slashCommandMenuSource).toContain('toast.error("Failed to trigger task")')
  })
})
