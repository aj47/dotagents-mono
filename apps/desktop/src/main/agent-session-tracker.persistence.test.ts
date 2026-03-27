import { beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const loadTracker = async (dataFolder: string) => {
  vi.resetModules()
  const clearSessionUserResponse = vi.fn()
  vi.doMock("./config", () => ({ dataFolder }))
  vi.doMock("./debug", () => ({ logApp: vi.fn() }))
  vi.doMock("./window", () => ({ WINDOWS: new Map() }))
  vi.doMock("@egoist/tipc/main", () => ({ getRendererHandlers: vi.fn(() => ({})) }))
  vi.doMock("./session-user-response-store", () => ({ clearSessionUserResponse }))
  const mod = await import("./agent-session-tracker")
  return {
    ...mod,
    clearSessionUserResponse,
  }
}

describe("agent-session-tracker persistence", () => {
  let dataFolder: string

  beforeEach(() => {
    dataFolder = mkdtempSync(join(tmpdir(), "agent-session-tracker-"))
  })

  it("restores a completed session so it can be revived after restart", async () => {
    const firstLoad = await loadTracker(dataFolder)
    const sessionId = firstLoad.agentSessionTracker.startSession(
      "conversation-1",
      "Persist me",
      true,
      { profileName: "augustus" } as any,
    )
    firstLoad.agentSessionTracker.completeSession(sessionId, "done")

    const secondLoad = await loadTracker(dataFolder)

    expect(secondLoad.agentSessionTracker.findSessionByConversationId("conversation-1")).toBe(sessionId)
    expect(secondLoad.agentSessionTracker.getSessionProfileSnapshot(sessionId)).toEqual(
      expect.objectContaining({ profileName: "augustus" }),
    )
    expect(secondLoad.agentSessionTracker.reviveSession(sessionId, false)).toBe(true)
    expect(secondLoad.agentSessionTracker.getSession(sessionId)).toEqual(
      expect.objectContaining({ id: sessionId, status: "active" }),
    )

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("reclassifies active sessions as stopped after restart", async () => {
    const firstLoad = await loadTracker(dataFolder)
    const sessionId = firstLoad.agentSessionTracker.startSession("conversation-2", "Interrupted run", true)

    const secondLoad = await loadTracker(dataFolder)

    expect(secondLoad.agentSessionTracker.getActiveSessions()).toHaveLength(0)
    expect(secondLoad.agentSessionTracker.findCompletedSession(sessionId)).toEqual(
      expect.objectContaining({ id: sessionId, status: "stopped" }),
    )

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("normalizes malformed interrupted session timestamps during restore", async () => {
    writeFileSync(
      join(dataFolder, "agent-session-state.json"),
      JSON.stringify({
        version: 1,
        activeSessions: [
          {
            id: "corrupted-active",
            conversationId: "conversation-2",
            conversationTitle: "Interrupted run",
            status: "active",
            startTime: "bad-start",
            endTime: "bad-end",
            lastActivity: 42,
          },
        ],
        completedSessions: [],
      }),
      "utf8",
    )

    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(123456)

    try {
      const { agentSessionTracker } = await loadTracker(dataFolder)

      expect(agentSessionTracker.getActiveSessions()).toHaveLength(0)
      expect(agentSessionTracker.findCompletedSession("corrupted-active")).toEqual(
        expect.objectContaining({
          id: "corrupted-active",
          status: "stopped",
          startTime: 123456,
          endTime: 123456,
          lastActivity: "Interrupted by app restart",
        }),
      )
    } finally {
      dateNowSpy.mockRestore()
      rmSync(dataFolder, { recursive: true, force: true })
    }
  })

  it("keeps the newest completed sessions when restoring more than the max persisted count", async () => {
    const completedSessions = Array.from({ length: 20 }, (_, index) => ({
      id: `older-${index + 1}`,
      conversationId: `older-conversation-${index + 1}`,
      conversationTitle: `Older ${index + 1}`,
      status: "completed" as const,
      startTime: (index + 1) * 1000,
      endTime: (index + 1) * 1000,
      lastActivity: `Older activity ${index + 1}`,
    })).concat(
      Array.from({ length: 4 }, (_, index) => ({
        id: `newest-${index + 1}`,
        conversationId: `newest-conversation-${index + 1}`,
        conversationTitle: `Newest ${index + 1}`,
        status: "completed" as const,
        startTime: (index + 21) * 1000,
        endTime: (index + 21) * 1000,
        lastActivity: `Newest activity ${index + 1}`,
      })),
    )

    writeFileSync(
      join(dataFolder, "agent-session-state.json"),
      JSON.stringify({
        version: 1,
        activeSessions: [],
        completedSessions,
      }),
      "utf8",
    )

    const { agentSessionTracker } = await loadTracker(dataFolder)

    expect(
      agentSessionTracker.getRecentSessions(4).map((session) => session.conversationTitle),
    ).toEqual(["Newest 4", "Newest 3", "Newest 2", "Newest 1"])

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("clears persisted user responses for completed sessions trimmed during restore", async () => {
    const completedSessions = Array.from({ length: 22 }, (_, index) => ({
      id: `session-${index + 1}`,
      conversationId: `conversation-${index + 1}`,
      conversationTitle: `Session ${index + 1}`,
      status: "completed" as const,
      startTime: (index + 1) * 1000,
      endTime: (index + 1) * 1000,
      lastActivity: `Activity ${index + 1}`,
    }))

    writeFileSync(
      join(dataFolder, "agent-session-state.json"),
      JSON.stringify({
        version: 1,
        activeSessions: [],
        completedSessions,
      }),
      "utf8",
    )

    const { agentSessionTracker, clearSessionUserResponse } = await loadTracker(dataFolder)

    expect(agentSessionTracker.getRecentSessions(20)).toHaveLength(20)
    expect(clearSessionUserResponse).toHaveBeenCalledTimes(2)
    expect(clearSessionUserResponse).toHaveBeenCalledWith("session-1")
    expect(clearSessionUserResponse).toHaveBeenCalledWith("session-2")

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("clears persisted user responses for every tracked session during clearAllSessions", async () => {
    const { agentSessionTracker, clearSessionUserResponse } = await loadTracker(dataFolder)

    const activeSessionId = agentSessionTracker.startSession("conversation-active", "Active")
    const completedSessionId = agentSessionTracker.startSession("conversation-completed", "Completed")
    agentSessionTracker.completeSession(completedSessionId, "done")

    clearSessionUserResponse.mockClear()
    agentSessionTracker.clearAllSessions()

    expect(clearSessionUserResponse).toHaveBeenCalledTimes(2)
    expect(clearSessionUserResponse).toHaveBeenCalledWith(activeSessionId)
    expect(clearSessionUserResponse).toHaveBeenCalledWith(completedSessionId)
    expect(agentSessionTracker.getActiveSessions()).toHaveLength(0)
    expect(agentSessionTracker.getRecentSessions(20)).toHaveLength(0)

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("treats malformed persisted timestamps as the oldest completed sessions", async () => {
    const completedSessions = [
      {
        id: "corrupted-1",
        conversationId: "corrupted-conversation-1",
        conversationTitle: "Corrupted 1",
        status: "completed" as const,
        startTime: "bad-start" as unknown as number,
        endTime: "bad-end" as unknown as number,
        lastActivity: "Corrupted activity 1",
      },
      {
        id: "corrupted-2",
        conversationId: "corrupted-conversation-2",
        conversationTitle: "Corrupted 2",
        status: "completed" as const,
        startTime: "still-bad" as unknown as number,
        endTime: "still-bad" as unknown as number,
        lastActivity: "Corrupted activity 2",
      },
      ...Array.from({ length: 22 }, (_, index) => ({
        id: `valid-${index + 1}`,
        conversationId: `valid-conversation-${index + 1}`,
        conversationTitle: `Valid ${index + 1}`,
        status: "completed" as const,
        startTime: (index + 1) * 1000,
        endTime: (index + 1) * 1000,
        lastActivity: `Valid activity ${index + 1}`,
      })),
    ]

    writeFileSync(
      join(dataFolder, "agent-session-state.json"),
      JSON.stringify({
        version: 1,
        activeSessions: [],
        completedSessions,
      }),
      "utf8",
    )

    const { agentSessionTracker } = await loadTracker(dataFolder)
    const restoredIds = agentSessionTracker.getRecentSessions(20).map((session) => session.id)

    expect(restoredIds).not.toContain("corrupted-1")
    expect(restoredIds).not.toContain("corrupted-2")
    expect(restoredIds.slice(0, 4)).toEqual(["valid-22", "valid-21", "valid-20", "valid-19"])

    rmSync(dataFolder, { recursive: true, force: true })
  })
})
