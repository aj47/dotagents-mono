import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const slashCommandMenuSource = readFileSync(new URL("./slash-command-menu.tsx", import.meta.url), "utf8")
const predefinedPromptsMenuSource = readFileSync(new URL("./predefined-prompts-menu.tsx", import.meta.url), "utf8")

describe("command menu renderer clients", () => {
  it("keeps prompt command menus off direct skills and loops IPC channels", () => {
    const combinedSource = `${slashCommandMenuSource}\n${predefinedPromptsMenuSource}`

    expect(combinedSource).toContain("desktopSkillsClient.getSkills()")
    expect(combinedSource).toContain("desktopLoopsClient.getLoops()")
    expect(combinedSource).toContain("desktopLoopsClient.triggerLoop(")
    expect(combinedSource).not.toContain("tipcClient.getSkills(")
    expect(combinedSource).not.toContain("tipcClient.getLoops(")
    expect(combinedSource).not.toContain("tipcClient.triggerLoop")
  })
})
