import { beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const loadTracker = async (dataFolder: string) => {
  vi.resetModules()
  vi.doMock("./config", () => ({ dataFolder }))
  vi.doMock("./debug", () => ({ logApp: vi.fn() }))
  vi.doMock("./window", () => ({ WINDOWS: new Map() }))
  vi.doMock("@egoist/tipc/main", () => ({ getRendererHandlers: vi.fn(() => ({})) }))
  vi.doMock("./session-user-response-store", () => ({ clearSessionUserResponse: vi.fn() }))
  return import("./agent-session-tracker")
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
})
