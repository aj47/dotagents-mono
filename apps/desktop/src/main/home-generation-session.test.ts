import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcSource = readFileSync(new URL("./tipc.ts", import.meta.url), "utf8")
const homeServiceSource = readFileSync(new URL("./home-experience-service.ts", import.meta.url), "utf8")

describe("home generation session routing", () => {
  it("starts homepage generation as a foreground tracked agent session", () => {
    expect(tipcSource).toContain("async function startHomeGenerationSession")
    expect(tipcSource).toContain("conversationService.createConversationWithId(")
    expect(tipcSource).toContain("agentSessionTracker.startSession(")
    expect(tipcSource).toContain("processWithAgentMode(")
    expect(tipcSource).toContain("startSnoozed: false")
    expect(tipcSource).toContain("shouldFocusPanelSession: true")
    expect(tipcSource).toContain("activeHomeGenerationStart")
    expect(tipcSource).toContain('status: "already-running"')
    expect(tipcSource).toContain("homeExperienceService.parseGeneratedHomeResponse(rawResponse)")
    expect(tipcSource).toContain("homeExperienceService.saveHomeDraft({")
    expect(tipcSource).toContain('status: "started"')
  })

  it("keeps the exact homepage JSON contract in the agent prompt", () => {
    expect(homeServiceSource).toContain("use the available agent tools for at least one relevant read-only inspection")
    expect(homeServiceSource).toContain("Do not assume the home must be conversation-focused")
    expect(homeServiceSource).toContain("data visualization, charts, project orchestration")
    expect(homeServiceSource).toContain("video playback/review/editing surfaces")
    expect(homeServiceSource).toContain("If a primitive is missing, create or extend it locally")
    expect(homeServiceSource).toContain("Mode: create a new generated home")
    expect(homeServiceSource).toContain("Mode: edit the current generated home")
    expect(homeServiceSource).toContain("Current generated home source to edit")
    expect(homeServiceSource).toContain("Your final assistant message must be JSON only")
    expect(homeServiceSource).toContain("Return JSON only with this exact shape")
    expect(homeServiceSource).toContain('"tsx": "export default function Home')
  })
})
