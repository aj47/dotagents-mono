import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { parseSkillMarkdown } from "@dotagents/core"

describe("bundled dotagents config skill", () => {
  it("ships a parseable bundled config-admin skill with canonical .agents guidance", () => {
    const skillPath = path.resolve(
      process.cwd(),
      "resources/bundled-skills/dotagents-config-admin/SKILL.md",
    )

    expect(fs.existsSync(skillPath)).toBe(true)

    const raw = fs.readFileSync(skillPath, "utf8")
    const parsed = parseSkillMarkdown(raw, { filePath: skillPath })

    expect(parsed).not.toBeNull()
    expect(parsed?.id).toBe("dotagents-config-admin")
    expect(parsed?.name).toBe("dotagents-config-admin")
    expect(parsed?.description).toContain("DotAgents configuration")
    expect(parsed?.instructions).toContain("~/.agents/")
    expect(parsed?.instructions).toContain("./.agents/")
    expect(parsed?.instructions).toContain("dotagents-settings.json")
    expect(parsed?.instructions).toContain("agents/<id>/agent.md")
    expect(parsed?.instructions).toContain("tasks/<id>/task.md")
    expect(parsed?.instructions).toContain("Create new repeat tasks in `~/.agents/tasks/` by default")
    expect(parsed?.instructions).toContain("Use `./.agents/tasks/` only when intentionally overriding or shadowing a global repeat task")
  })
})