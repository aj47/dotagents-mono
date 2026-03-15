import { describe, it, expect, vi, beforeEach } from "vitest"
import { AgentSessionTracker, setAgentSessionTrackerProgressEmitter } from "./agent-session-tracker"
import type { ProgressEmitter } from "./interfaces/progress-emitter"

// Mock debug module to avoid side effects
vi.mock("./debug", () => ({
  logApp: vi.fn(),
  logLLM: vi.fn(),
  logTools: vi.fn(),
  logMCP: vi.fn(),
  logACP: vi.fn(),
  logUI: vi.fn(),
  logKeybinds: vi.fn(),
}))

// Mock session-user-response-store
vi.mock("./session-user-response-store", () => ({
  clearSessionUserResponse: vi.fn(),
}))

describe("AgentSessionTracker", () => {
  let tracker: AgentSessionTracker
  let mockEmitter: ProgressEmitter

  beforeEach(() => {
    tracker = new AgentSessionTracker()
    mockEmitter = {
      emitAgentProgress: vi.fn(),
      emitSessionUpdate: vi.fn(),
      emitQueueUpdate: vi.fn(),
      emitEvent: vi.fn(),
    }
    setAgentSessionTrackerProgressEmitter(mockEmitter)
  })

  it("should start a session and emit update", () => {
    const sessionId = tracker.startSession("conv-1", "Test Session")
    expect(sessionId).toBeTruthy()
    expect(sessionId).toContain("session_")
    expect(mockEmitter.emitSessionUpdate).toHaveBeenCalledTimes(1)

    const activeSessions = tracker.getActiveSessions()
    expect(activeSessions).toHaveLength(1)
    expect(activeSessions[0].conversationId).toBe("conv-1")
    expect(activeSessions[0].conversationTitle).toBe("Test Session")
    expect(activeSessions[0].status).toBe("active")
    expect(activeSessions[0].isSnoozed).toBe(true) // default snoozed
  })

  it("should start session with custom snooze state", () => {
    const sessionId = tracker.startSession("conv-1", "Test", false)
    const session = tracker.getSession(sessionId)
    expect(session?.isSnoozed).toBe(false)
  })

  it("should update a session and emit update", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    vi.mocked(mockEmitter.emitSessionUpdate).mockClear()

    tracker.updateSession(sessionId, { conversationTitle: "Updated Title" })
    expect(mockEmitter.emitSessionUpdate).toHaveBeenCalledTimes(1)

    const session = tracker.getSession(sessionId)
    expect(session?.conversationTitle).toBe("Updated Title")
  })

  it("should complete a session and move to recent", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    vi.mocked(mockEmitter.emitSessionUpdate).mockClear()

    tracker.completeSession(sessionId, "Done")
    expect(mockEmitter.emitSessionUpdate).toHaveBeenCalledTimes(1)

    const activeSessions = tracker.getActiveSessions()
    expect(activeSessions).toHaveLength(0)

    const recentSessions = tracker.getRecentSessions()
    expect(recentSessions).toHaveLength(1)
    expect(recentSessions[0].status).toBe("completed")
    expect(recentSessions[0].lastActivity).toBe("Done")
  })

  it("should stop a session and move to recent", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    tracker.stopSession(sessionId)

    const activeSessions = tracker.getActiveSessions()
    expect(activeSessions).toHaveLength(0)

    const recentSessions = tracker.getRecentSessions()
    expect(recentSessions).toHaveLength(1)
    expect(recentSessions[0].status).toBe("stopped")
  })

  it("should handle error sessions", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    tracker.errorSession(sessionId, "Something went wrong")

    const recentSessions = tracker.getRecentSessions()
    expect(recentSessions).toHaveLength(1)
    expect(recentSessions[0].status).toBe("error")
    expect(recentSessions[0].errorMessage).toBe("Something went wrong")
  })

  it("should snooze and unsnooze sessions", () => {
    const sessionId = tracker.startSession("conv-1", "Test", false)
    expect(tracker.isSessionSnoozed(sessionId)).toBe(false)

    tracker.snoozeSession(sessionId)
    expect(tracker.isSessionSnoozed(sessionId)).toBe(true)

    tracker.unsnoozeSession(sessionId)
    expect(tracker.isSessionSnoozed(sessionId)).toBe(false)
  })

  it("should find session by conversation ID", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    expect(tracker.findSessionByConversationId("conv-1")).toBe(sessionId)
    expect(tracker.findSessionByConversationId("conv-2")).toBeUndefined()
  })

  it("should find session by conversation ID in completed sessions", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    tracker.completeSession(sessionId)
    expect(tracker.findSessionByConversationId("conv-1")).toBe(sessionId)
  })

  it("should revive a completed session", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    tracker.completeSession(sessionId)

    const revived = tracker.reviveSession(sessionId)
    expect(revived).toBe(true)

    const session = tracker.getSession(sessionId)
    expect(session?.status).toBe("active")
    expect(session?.endTime).toBeUndefined()
  })

  it("should get profile snapshot for a session", () => {
    const snapshot = { profileId: "p-1", profileName: "Test Profile" }
    const sessionId = tracker.startSession("conv-1", "Test", true, snapshot as any)
    expect(tracker.getSessionProfileSnapshot(sessionId)?.profileName).toBe("Test Profile")
  })

  it("should remove completed session", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    tracker.completeSession(sessionId)

    const removed = tracker.removeCompletedSession(sessionId)
    expect(removed).toBe(true)
    expect(tracker.getRecentSessions()).toHaveLength(0)
  })

  it("should clear completed sessions with filter", () => {
    const s1 = tracker.startSession("conv-1", "Test 1")
    const s2 = tracker.startSession("conv-2", "Test 2")
    tracker.completeSession(s1)
    tracker.completeSession(s2)

    tracker.clearCompletedSessions((session) => session.conversationId === "conv-1")

    const recent = tracker.getRecentSessions()
    expect(recent).toHaveLength(1)
    expect(recent[0].conversationId).toBe("conv-2")
  })

  it("should emit session update with active and recent sessions", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    vi.mocked(mockEmitter.emitSessionUpdate).mockClear()

    tracker.completeSession(sessionId, "Done")

    expect(mockEmitter.emitSessionUpdate).toHaveBeenCalledWith({
      activeSessions: [],
      recentSessions: expect.arrayContaining([
        expect.objectContaining({ conversationId: "conv-1", status: "completed" }),
      ]),
    })
  })

  it("should handle no ProgressEmitter without crashing", () => {
    setAgentSessionTrackerProgressEmitter(null as any)
    // These should not throw
    const freshTracker = new AgentSessionTracker()
    setAgentSessionTrackerProgressEmitter(null as unknown as ProgressEmitter)
    const sessionId = freshTracker.startSession("conv-1", "Test")
    freshTracker.completeSession(sessionId)
  })

  it("should get conversation ID for active and completed sessions", () => {
    const sessionId = tracker.startSession("conv-1", "Test")
    expect(tracker.getConversationIdForSession(sessionId)).toBe("conv-1")

    tracker.completeSession(sessionId)
    expect(tracker.getConversationIdForSession(sessionId)).toBe("conv-1")
  })
})
