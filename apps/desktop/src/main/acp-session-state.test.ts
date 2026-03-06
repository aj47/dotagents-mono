import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

describe("acp-session-state", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("clears client token mappings even when no app session mapping exists", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setAcpClientSessionTokenMapping("client-token-only", "acp-token-only")
    expect(sessionState.getAcpSessionForClientSessionToken("client-token-only")).toBe("acp-token-only")

    sessionState.clearAcpToAppSessionMapping("acp-token-only")

    expect(sessionState.getAcpSessionForClientSessionToken("client-token-only")).toBeUndefined()
    expect(sessionState.getAppSessionForAcpSession("acp-token-only")).toBeUndefined()
    expect(sessionState.getAppRunIdForAcpSession("acp-token-only")).toBeUndefined()
  })

  it("resolves pending app-session mappings for injected MCP tokens and clears them", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setPendingAcpClientSessionTokenMapping("pending-client-token", "app-session-1")
    expect(sessionState.getPendingAppSessionForClientSessionToken("pending-client-token")).toBe("app-session-1")

    sessionState.clearAcpClientSessionTokenMapping("pending-client-token")

    expect(sessionState.getPendingAppSessionForClientSessionToken("pending-client-token")).toBeUndefined()
    expect(sessionState.getAcpSessionForClientSessionToken("pending-client-token")).toBeUndefined()
  })
})
