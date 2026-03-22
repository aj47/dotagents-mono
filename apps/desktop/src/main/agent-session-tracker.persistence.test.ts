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

  it("keeps the newest restored completed sessions when persisted state exceeds the cap", async () => {
    const persistedSessions = Array.from({ length: 24 }, (_, index) => {
      const itemNumber = index + 1
      const isNewest = itemNumber > 20

      return {
        id: isNewest ? `newest-${itemNumber - 20}` : `older-${itemNumber}`,
        conversationId: isNewest ? `newest-conv-${itemNumber - 20}` : `older-conv-${itemNumber}`,
        conversationTitle: isNewest ? `Newest ${itemNumber - 20}` : `Older ${itemNumber}`,
        status: "completed" as const,
        startTime: isNewest ? 5000 + itemNumber : 1000 + itemNumber,
        endTime: isNewest ? 5000 + itemNumber : 1000 + itemNumber,
      }
    })

    writeFileSync(
      join(dataFolder, "agent-session-state.json"),
      JSON.stringify({
        version: 1,
        activeSessions: [],
        completedSessions: persistedSessions,
      }),
      "utf8",
    )

    const trackerLoad = await loadTracker(dataFolder)
    const recentSessionTitles = trackerLoad.agentSessionTracker
      .getRecentSessions(4)
      .map((session) => session.conversationTitle)

    expect(recentSessionTitles).toEqual([
      "Newest 4",
      "Newest 3",
      "Newest 2",
      "Newest 1",
    ])
    expect(trackerLoad.agentSessionTracker.findCompletedSession("newest-4")).toEqual(
      expect.objectContaining({ conversationTitle: "Newest 4" }),
    )
    expect(trackerLoad.agentSessionTracker.findCompletedSession("older-1")).toBeUndefined()

    rmSync(dataFolder, { recursive: true, force: true })
  })
})
