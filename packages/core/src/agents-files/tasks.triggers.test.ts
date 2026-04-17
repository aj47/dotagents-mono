import { describe, it, expect } from "vitest"
import { parseTaskMarkdown, stringifyTaskMarkdown } from "./tasks"
import type { LoopConfig } from "../types"

describe("tasks frontmatter - triggers", () => {
  it("parses triggers list", () => {
    const md = [
      "---",
      "kind: task",
      "id: t1",
      "name: My Task",
      "intervalMinutes: 60",
      "enabled: true",
      "triggers: onSessionEnd, onToolCall",
      "---",
      "prompt body",
    ].join("\n")

    const task = parseTaskMarkdown(md)
    expect(task).not.toBeNull()
    expect(task!.triggers).toEqual(["onSessionEnd", "onToolCall"])
    expect(task!.triggerConfig).toBeUndefined()
  })

  it("parses triggerConfig JSON", () => {
    const md = [
      "---",
      "kind: task",
      "id: t1",
      "name: My Task",
      "intervalMinutes: 60",
      "enabled: true",
      "triggers: onToolCall",
      `triggerConfig: {"toolName":"web_search","minIntervalMs":2000,"maxRunsPerSession":5,"maxTriggerDepth":2,"excludeTriggered":false}`,
      "---",
      "prompt body",
    ].join("\n")

    const task = parseTaskMarkdown(md)
    expect(task).not.toBeNull()
    expect(task!.triggerConfig).toEqual({
      toolName: "web_search",
      minIntervalMs: 2000,
      maxRunsPerSession: 5,
      maxTriggerDepth: 2,
      excludeTriggered: false,
    })
  })

  it("ignores unknown trigger names", () => {
    const md = [
      "---",
      "kind: task",
      "id: t1",
      "name: My Task",
      "intervalMinutes: 60",
      "enabled: true",
      "triggers: onSessionEnd, onBogus, onAppStart",
      "---",
      "",
    ].join("\n")

    const task = parseTaskMarkdown(md)
    expect(task!.triggers).toEqual(["onSessionEnd", "onAppStart"])
  })

  it("round-trips triggers and triggerConfig through stringify/parse", () => {
    const original: LoopConfig = {
      id: "t1",
      name: "My Task",
      prompt: "do the thing",
      intervalMinutes: 30,
      enabled: true,
      triggers: ["onSessionEnd", "onUserMessage"],
      triggerConfig: {
        profileId: "researcher",
        minIntervalMs: 1500,
        excludeTriggered: false,
      },
    }

    const md = stringifyTaskMarkdown(original)
    const parsed = parseTaskMarkdown(md)
    expect(parsed).not.toBeNull()
    expect(parsed!.triggers).toEqual(["onSessionEnd", "onUserMessage"])
    expect(parsed!.triggerConfig).toEqual({
      profileId: "researcher",
      minIntervalMs: 1500,
      excludeTriggered: false,
    })
  })

  it("omits triggers/triggerConfig from frontmatter when absent (backward compat)", () => {
    const legacy: LoopConfig = {
      id: "t1",
      name: "Legacy",
      prompt: "x",
      intervalMinutes: 60,
      enabled: true,
    }
    const md = stringifyTaskMarkdown(legacy)
    expect(md).not.toMatch(/triggers:/)
    expect(md).not.toMatch(/triggerConfig:/)
    const parsed = parseTaskMarkdown(md)
    expect(parsed!.triggers).toBeUndefined()
    expect(parsed!.triggerConfig).toBeUndefined()
  })
})
