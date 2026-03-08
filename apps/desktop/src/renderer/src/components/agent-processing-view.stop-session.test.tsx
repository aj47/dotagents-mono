import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const processingViewSource = fs.readFileSync(
  path.resolve(__dirname, "./agent-processing-view.tsx"),
  "utf8",
)

describe("AgentProcessingView stop-session fallback", () => {
  it("falls back to emergency stop and shows visible feedback when the pending-session stop fails", () => {
    expect(processingViewSource).toContain("if (sessionId) {")
    expect(processingViewSource).toContain(
      "await tipcClient.stopAgentSession({ sessionId })",
    )
    expect(processingViewSource).toContain(
      "await tipcClient.emergencyStopAgent()",
    )
    expect(processingViewSource).toContain(
      'const stopPath = sessionId ? "stopAgentSession" : "emergencyStopAgent"',
    )
    expect(processingViewSource).toContain(
      '`Failed to stop agent. ${getActionErrorMessage(error, "Please try again.")}`',
    )
  })
})
