import { beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

vi.mock("./config", () => ({
  dataFolder: mkdtempSync(join(tmpdir(), "dotagents-agent-session-tracker-test-")),
}))

vi.mock("./window", () => ({
  WINDOWS: new Map(),
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: () => ({
    agentSessionsUpdated: { send: vi.fn() },
  }),
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

vi.mock("./session-user-response-store", () => ({
  clearSessionUserResponse: vi.fn(),
}))

describe("AgentSessionTracker", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("clears stale error metadata when an errored session is revived and completed", async () => {
    const { agentSessionTracker } = await import("./agent-session-tracker")

    agentSessionTracker.clearAllSessions()
    agentSessionTracker.clearCompletedSessions()

    const sessionId = agentSessionTracker.startSession("conv-1", "Conversation")
    agentSessionTracker.errorSession(sessionId, "auth_unavailable: no auth available")

    expect(agentSessionTracker.getRecentSessions(1)[0]?.errorMessage).toBe("auth_unavailable: no auth available")

    expect(agentSessionTracker.reviveSession(sessionId, true)).toBe(true)
    expect(agentSessionTracker.getSession(sessionId)?.status).toBe("active")
    expect(agentSessionTracker.getSession(sessionId)?.errorMessage).toBeUndefined()
    expect(agentSessionTracker.getSession(sessionId)?.endTime).toBeUndefined()

    agentSessionTracker.completeSession(sessionId, "done")

    const revivedCompletion = agentSessionTracker.getRecentSessions(1)[0]
    expect(revivedCompletion?.status).toBe("completed")
    expect(revivedCompletion?.errorMessage).toBeUndefined()
  })

  it("revives errored sessions from recent history back into the active list", async () => {
    const { agentSessionTracker } = await import("./agent-session-tracker")

    agentSessionTracker.clearAllSessions()
    agentSessionTracker.clearCompletedSessions()

    const sessionId = agentSessionTracker.startSession("conv-2", "Recoverable conversation")
    agentSessionTracker.errorSession(sessionId, "auth_unavailable: no auth available")

    expect(agentSessionTracker.getActiveSessions()).toHaveLength(0)
    expect(agentSessionTracker.getSession(sessionId)).toBeUndefined()
    expect(agentSessionTracker.findCompletedSession(sessionId)?.status).toBe("error")
    expect(agentSessionTracker.getRecentSessions(1)).toHaveLength(1)

    expect(agentSessionTracker.reviveSession(sessionId, false)).toBe(true)
    expect(agentSessionTracker.getSession(sessionId)?.status).toBe("active")
    expect(agentSessionTracker.getSession(sessionId)?.errorMessage).toBeUndefined()
    expect(agentSessionTracker.findCompletedSession(sessionId)).toBeUndefined()

    agentSessionTracker.clearAllSessions()
    agentSessionTracker.clearCompletedSessions()
  })

  it("updates active and recent session titles for a renamed conversation", async () => {
    const { agentSessionTracker } = await import("./agent-session-tracker")

    agentSessionTracker.clearAllSessions()
    agentSessionTracker.clearCompletedSessions()

    const activeSessionId = agentSessionTracker.startSession("conv-shared", "Old title")
    const completedSessionId = agentSessionTracker.startSession("conv-shared", "Old title")
    const unrelatedSessionId = agentSessionTracker.startSession("conv-other", "Other title")
    agentSessionTracker.completeSession(completedSessionId, "done")

    expect(
      agentSessionTracker.updateConversationTitleForConversation("conv-shared", "New title"),
    ).toBe(2)

    expect(agentSessionTracker.getSession(activeSessionId)?.conversationTitle).toBe("New title")
    expect(agentSessionTracker.findCompletedSession(completedSessionId)?.conversationTitle).toBe("New title")
    expect(agentSessionTracker.getSession(unrelatedSessionId)?.conversationTitle).toBe("Other title")

    agentSessionTracker.clearAllSessions()
    agentSessionTracker.clearCompletedSessions()
  })
})