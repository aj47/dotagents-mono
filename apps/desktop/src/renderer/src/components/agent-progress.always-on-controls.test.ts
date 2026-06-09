import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("agent progress always-on controls", () => {
  it("renders goal editing and reset controls in the main always-on status band", () => {
    expect(agentProgressSource).toContain("const renderAlwaysOnStatusBand = (compact = false)")
    expect(agentProgressSource).toContain("Goal")
    expect(agentProgressSource).toContain("Set always-on goal")
    expect(agentProgressSource).toContain("Save always-on goal")
    expect(agentProgressSource).toContain("Clear and restart always-on session")
    expect(agentProgressSource).toContain("tipcClient.updateAlwaysOnSessionGoal")
    expect(agentProgressSource).toContain("tipcClient.resetAlwaysOnSession")
  })

  it("renders pending always-on questions in the main chat view", () => {
    expect(agentProgressSource).toContain("const renderAlwaysOnQuestionPanel = (compact = false)")
    expect(agentProgressSource).toContain("Needs answer")
    expect(agentProgressSource).toContain("getAlwaysOnQuestionContext(question, alwaysOnRecentLogEntries)")
    expect(agentProgressSource).toContain("question.recommendation")
    expect(agentProgressSource).toContain("tipcClient.answerAlwaysOnQuestion")
    expect(agentProgressSource).toContain("Name the next workstream or exact defect")
  })

  it("keeps always-on sections collapsible with logs expanded by default", () => {
    expect(agentProgressSource).toContain("const [alwaysOnSectionCollapsed, setAlwaysOnSectionCollapsed] = useState")
    expect(agentProgressSource).toContain("status: true")
    expect(agentProgressSource).toContain("question: true")
    expect(agentProgressSource).toContain("log: false")
    expect(agentProgressSource).toContain("toggleAlwaysOnSection(\"question\")")
    expect(agentProgressSource).toContain("toggleAlwaysOnSection(\"log\")")
    expect(agentProgressSource).toContain("Collapse action log")
  })
})
