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

  it("clears pending token mappings when promoting them to ACP session mappings", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setPendingAcpClientSessionTokenMapping("pending-client-token", "app-session-2")
    sessionState.setAcpClientSessionTokenMapping("pending-client-token", "acp-session-2")

    expect(sessionState.getAcpSessionForClientSessionToken("pending-client-token")).toBe("acp-session-2")
    expect(sessionState.getPendingAppSessionForClientSessionToken("pending-client-token")).toBeUndefined()
  })

  it("sets and gets session for conversation", async () => {
    const sessionState = await import("./acp-session-state")

    expect(sessionState.getSessionForConversation("conv-1")).toBeUndefined()

    sessionState.setSessionForConversation("conv-1", "session-1", "test-agent")

    const session = sessionState.getSessionForConversation("conv-1")
    expect(session).toBeDefined()
    expect(session!.sessionId).toBe("session-1")
    expect(session!.agentName).toBe("test-agent")
  })

  it("clears session for conversation", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setSessionForConversation("conv-1", "session-1", "test-agent")
    expect(sessionState.getSessionForConversation("conv-1")).toBeDefined()

    sessionState.clearSessionForConversation("conv-1")
    expect(sessionState.getSessionForConversation("conv-1")).toBeUndefined()
  })

  it("maps ACP session to app session and run ID", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setAcpToAppSessionMapping("acp-session-1", "app-session-1", 42)

    expect(sessionState.getAppSessionForAcpSession("acp-session-1")).toBe("app-session-1")
    expect(sessionState.getAppRunIdForAcpSession("acp-session-1")).toBe(42)
  })

  it("clears all sessions", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setSessionForConversation("conv-1", "session-1", "agent-1")
    sessionState.setSessionForConversation("conv-2", "session-2", "agent-2")

    const allBefore = sessionState.getAllSessions()
    expect(allBefore.size).toBe(2)

    sessionState.clearAllSessions()

    const allAfter = sessionState.getAllSessions()
    expect(allAfter.size).toBe(0)
  })
})
