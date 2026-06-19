import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { parseSkillMarkdown, parseTaskMarkdown } from "@dotagents/core"

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
  })

  it("does not ship the document-processing docx skill", () => {
    const skillPath = path.resolve(
      process.cwd(),
      "resources/bundled-skills/document-processing/docx/SKILL.md",
    )

    expect(fs.existsSync(skillPath)).toBe(false)
  })
})

describe("bundled create-repeat-task skill", () => {
  const skillDir = path.resolve(
    process.cwd(),
    "resources/bundled-skills/create-repeat-task",
  )
  const skillPath = path.join(skillDir, "SKILL.md")
  const examplesPath = path.join(skillDir, "examples.md")

  it("ships a parseable SKILL.md that triggers on repeat-task language and documents the runtime flags", () => {
    expect(fs.existsSync(skillPath)).toBe(true)

    const raw = fs.readFileSync(skillPath, "utf8")
    const parsed = parseSkillMarkdown(raw, { filePath: skillPath })

    expect(parsed).not.toBeNull()
    expect(parsed?.id).toBe("create-repeat-task")
    expect(parsed?.name).toBe("create-repeat-task")

    // Trigger language so the agent loads it for the right prompts.
    expect(parsed?.description).toMatch(/repeat task/i)
    expect(parsed?.description).toMatch(/recurring task/i)
    expect(parsed?.description).toMatch(/continuous/i)
    expect(parsed?.description).toMatch(/same session/i)
    expect(parsed?.description).toMatch(/TTS/)

    // Canonical paths and frontmatter fields surfaced in instructions.
    expect(parsed?.instructions).toContain("~/.agents/tasks/")
    expect(parsed?.instructions).toContain("task.md")
    expect(parsed?.instructions).toContain("kind: task")
    expect(parsed?.instructions).toContain("intervalMinutes")
    expect(parsed?.instructions).toContain("runContinuously")
    expect(parsed?.instructions).toContain("continueInSession")
    expect(parsed?.instructions).toContain("speakOnTrigger")
    expect(parsed?.instructions).toContain("runOnStartup")
    expect(parsed?.instructions).toContain("schedule")
    expect(parsed?.instructions).toContain("profileId")
    expect(parsed?.instructions).toContain("critiquePass")

    // Prompt design guidance keeps scheduler mechanics out of the body.
    expect(parsed?.instructions).toContain("Frontmatter vs prompt boundary")
    expect(parsed?.instructions).toContain("Do not restate cadence")
    expect(parsed?.instructions).toContain("On each run")
    expect(parsed?.instructions).toContain("durable state")
    expect(parsed?.instructions).toContain("companion skill")
    expect(parsed?.instructions).toContain("per-run quota")
  })

  it("ships an examples.md whose task frontmatter blocks all parse as valid LoopConfigs", () => {
    expect(fs.existsSync(examplesPath)).toBe(true)

    const raw = fs.readFileSync(examplesPath, "utf8")

    // Pull every fenced ```markdown ... ``` block — they each contain a task.md template.
    const blocks = Array.from(raw.matchAll(/```markdown\n([\s\S]*?)```/g)).map(
      (m) => m[1],
    )
    expect(blocks.length).toBeGreaterThanOrEqual(8)

    const parsedTasks = blocks.map((body, i) => {
      const task = parseTaskMarkdown(body, { fallbackId: `example-${i}` })
      expect(task, `example block #${i} should parse`).not.toBeNull()
      return task!
    })

    // Every example must declare an id and a non-empty prompt body.
    for (const task of parsedTasks) {
      expect(task.id.length).toBeGreaterThan(0)
      expect(task.prompt.length).toBeGreaterThan(0)
      expect(task.intervalMinutes).toBeGreaterThanOrEqual(1)
    }

    // The example set must demonstrate each of the headline runtime modes.
    expect(parsedTasks.some((t) => t.runContinuously === true)).toBe(true)
    expect(parsedTasks.some((t) => t.continueInSession === true)).toBe(true)
    expect(parsedTasks.some((t) => t.speakOnTrigger === true)).toBe(true)
    expect(parsedTasks.some((t) => t.runOnStartup === true)).toBe(true)
    expect(parsedTasks.some((t) => t.schedule?.type === "daily")).toBe(true)
    expect(parsedTasks.some((t) => t.schedule?.type === "weekly")).toBe(true)
    expect(parsedTasks.some((t) => t.critiquePass === true)).toBe(true)
    expect(parsedTasks.some((t) => t.enabled === false)).toBe(true)

    const inventoryBuilder = parsedTasks.find((t) => t.id === "video-packaging")
    expect(inventoryBuilder).toBeTruthy()
    expect(inventoryBuilder?.continueInSession).toBe(true)
    expect(inventoryBuilder?.critiquePass).toBe(true)
    expect(inventoryBuilder?.prompt).toContain("On each run")
    expect(inventoryBuilder?.prompt).toContain("source-ledger.md")
    expect(inventoryBuilder?.prompt).toContain("Per-run contract")
    expect(inventoryBuilder?.prompt).not.toMatch(/Every 20 minutes/i)
  })
})

describe("bundled skill initialization", () => {
  it("refreshes existing bundled skills so task creation guidance does not stay stale", () => {
    const sourcePath = path.resolve(process.cwd(), "src/main/skills-service.ts")
    const source = fs.readFileSync(sourcePath, "utf8")

    expect(source).toContain("fs.rmSync(destPath, { recursive: true, force: true })")
    expect(source).toContain("Refreshed bundled skill")
    expect(source).not.toContain("Bundled skill already exists, skipping")
  })
})
