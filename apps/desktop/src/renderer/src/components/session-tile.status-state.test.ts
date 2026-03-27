import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")

describe("session tile status state", () => {
  it("keeps tracked active sessions in the running state until the tracker marks them finished", () => {
    expect(sessionTileSource).toContain('const progressLifecycleState = session.status === "active"')
    expect(sessionTileSource).toContain('? "running"')
    expect(sessionTileSource).toContain(': (progress?.isComplete ? "complete" : "running")')
    expect(sessionTileSource).toContain("normalizeAgentConversationState(progress.conversationState, progressLifecycleState)")
  })
})