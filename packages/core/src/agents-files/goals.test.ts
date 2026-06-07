import fs from "fs"
import os from "os"
import path from "path"
import { describe, expect, it } from "vitest"
import { getAgentsLayerPaths } from "./modular-config"
import { goalIdToFilePath, loadGoalsLayer, parseGoalMarkdown, stringifyGoalMarkdown, writeGoalFile } from "./goals"
import type { Goal } from "../types"

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g_publish_video",
    title: "Publish video",
    description: "Finish and publish the video.",
    level: "goal",
    priority: 2,
    status: "active",
    parentId: undefined,
    successCriteria: "Video published",
    signalToWatch: "views",
    abandonIf: "No outline in 14 days",
    createdAt: 1780790000000,
    updatedAt: 1780790000001,
    lastTouchedAt: 1780790000002,
    createdBy: "agent",
    createdFrom: "loop_daily_planning",
    provenance: "Daily planning found a missing focus.",
    linkedTaskIds: ["daily-goal-planning"],
    notes: "Important",
    body: "Long-form context",
    ...overrides,
  }
}

describe("agents-files/goals", () => {
  it("roundtrips goal frontmatter and body", () => {
    const markdown = stringifyGoalMarkdown(makeGoal())
    const parsed = parseGoalMarkdown(markdown)

    expect(markdown).toContain("kind: goal")
    expect(parsed).toEqual(makeGoal())
  })

  it("loads and writes goals from a layer", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-goals-"))
    const layer = getAgentsLayerPaths(path.join(dir, ".agents"))
    const goal = makeGoal({ id: "g_layer_goal" })

    writeGoalFile(layer, goal)

    expect(fs.existsSync(goalIdToFilePath(layer, goal.id))).toBe(true)
    const loaded = loadGoalsLayer(layer)
    expect(loaded.goals).toEqual([goal])
    expect(loaded.originById.get(goal.id)?.filePath).toBe(goalIdToFilePath(layer, goal.id))
  })

  it("uses safe defaults for older sparse files", () => {
    const parsed = parseGoalMarkdown("Body only", { fallbackId: "g_sparse" })

    expect(parsed?.id).toBe("g_sparse")
    expect(parsed?.title).toBe("g_sparse")
    expect(parsed?.level).toBe("goal")
    expect(parsed?.priority).toBe(3)
    expect(parsed?.status).toBe("active")
    expect(parsed?.createdBy).toBe("aj")
    expect(parsed?.createdFrom).toBe("manual")
  })
})
