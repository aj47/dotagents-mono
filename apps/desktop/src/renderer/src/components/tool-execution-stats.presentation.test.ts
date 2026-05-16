import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const toolExecutionStatsSource = readFileSync(
  new URL("./tool-execution-stats.tsx", import.meta.url),
  "utf8",
)
const sessionPresentationSource = readFileSync(
  new URL("../../../../../../packages/shared/src/session-presentation.ts", import.meta.url),
  "utf8",
)

describe("tool execution stats presentation", () => {
  it("routes desktop formatting helpers through the shared session presentation facade", () => {
    expect(toolExecutionStatsSource).toContain('from "@dotagents/shared/session-presentation"')
    expect(toolExecutionStatsSource).not.toContain('from "@dotagents/shared/tool-execution-display"')
    expect(sessionPresentationSource).toContain("formatToolExecutionDuration")
    expect(sessionPresentationSource).toContain("formatToolExecutionTokens")
    expect(sessionPresentationSource).toContain("truncateToolExecutionSubagentId")
  })
})
