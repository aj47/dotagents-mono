import { beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const loadAcpSessionState = async (dataFolder: string) => {
  vi.resetModules()
  vi.doMock("./config", () => ({ dataFolder }))
  vi.doMock("./debug", () => ({ logApp: vi.fn() }))
  return import("./acp-session-state")
}

describe("acp-session-state persistence", () => {
  let dataFolder: string

  beforeEach(() => {
    dataFolder = mkdtempSync(join(tmpdir(), "acp-session-state-"))
  })

  it("restores persisted conversation to ACP session mappings after restart", async () => {
    const firstLoad = await loadAcpSessionState(dataFolder)
    firstLoad.setSessionForConversation("conversation-1", "acp-session-1", "test-agent")

    const secondLoad = await loadAcpSessionState(dataFolder)

    expect(secondLoad.getSessionForConversation("conversation-1")).toEqual(
      expect.objectContaining({ sessionId: "acp-session-1", agentName: "test-agent" }),
    )

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("ignores malformed persisted conversation-session entries on import", async () => {
    writeFileSync(
      join(dataFolder, "acp-session-state.json"),
      JSON.stringify({
        version: 1,
        conversationSessions: [{ conversationId: "broken-entry" }],
      }),
    )

    const sessionState = await loadAcpSessionState(dataFolder)

    expect(sessionState.getAllSessions().size).toBe(0)

    rmSync(dataFolder, { recursive: true, force: true })
  })

  it("ignores persisted state when conversationSessions is not an array", async () => {
    writeFileSync(
      join(dataFolder, "acp-session-state.json"),
      JSON.stringify({
        version: 1,
        conversationSessions: { broken: true },
      }),
    )

    const sessionState = await loadAcpSessionState(dataFolder)

    expect(sessionState.getAllSessions().size).toBe(0)

    rmSync(dataFolder, { recursive: true, force: true })
  })
})
