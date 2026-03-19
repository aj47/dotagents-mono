import { beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync } from "fs"
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
})