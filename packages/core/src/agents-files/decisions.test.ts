import fs from "fs"
import os from "os"
import path from "path"
import { describe, expect, it } from "vitest"
import { getAgentsLayerPaths } from "./modular-config"
import {
  decisionIdToFilePath,
  loadDecisionsLayer,
  parseDecisionMarkdown,
  stringifyDecisionMarkdown,
  writeDecisionFile,
} from "./decisions"
import type { Decision } from "../types"

function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: "d_video_angle",
    type: "yn",
    status: "pending",
    question: "Use this video angle?",
    recommendation: "yes",
    why: "Clearer thumbnail.",
    risk: "Less technical depth.",
    goalId: "g_publish_video",
    taskId: "daily-goal-planning",
    createdAt: 1780790000000,
    updatedAt: 1780790000001,
    answeredAt: null,
    expiresAt: 1780876400000,
    defaultAction: "continue_research",
    answer: null,
    answerSource: null,
    urgent: true,
    revertEffortHours: 4,
    pathChanging: true,
    irreversible: false,
    history: [{ at: 1780790000000, type: "created", by: "agent", note: "blocked" }],
    body: "Supporting context",
    ...overrides,
  }
}

describe("agents-files/decisions", () => {
  it("roundtrips decision frontmatter and body", () => {
    const markdown = stringifyDecisionMarkdown(makeDecision())
    const parsed = parseDecisionMarkdown(markdown)

    expect(markdown).toContain("kind: decision")
    expect(parsed).toEqual(makeDecision())
  })

  it("loads and writes decisions from a layer", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-decisions-"))
    const layer = getAgentsLayerPaths(path.join(dir, ".agents"))
    const decision = makeDecision({ id: "d_layer_decision" })

    writeDecisionFile(layer, decision)

    expect(fs.existsSync(decisionIdToFilePath(layer, decision.id))).toBe(true)
    const loaded = loadDecisionsLayer(layer)
    expect(loaded.decisions).toEqual([decision])
    expect(loaded.originById.get(decision.id)?.filePath).toBe(decisionIdToFilePath(layer, decision.id))
  })

  it("uses safe defaults for older sparse files", () => {
    const parsed = parseDecisionMarkdown("Body only", { fallbackId: "d_sparse" })

    expect(parsed?.id).toBe("d_sparse")
    expect(parsed?.type).toBe("yn")
    expect(parsed?.status).toBe("pending")
    expect(parsed?.urgent).toBe(false)
    expect(parsed?.revertEffortHours).toBe(0)
    expect(parsed?.history).toEqual([])
  })
})
