import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => {
      return process.env.TMPDIR || process.env.TEMP || process.env.TMP || "/tmp"
    }),
  },
}))

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

  it("tracks transient ACP session title overrides and clears them with the session mapping", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setAcpToAppSessionMapping("delegated-session-1", "app-session-1")
    sessionState.setAcpSessionTitleOverride("delegated-session-1", "  Delegated research  ")

    expect(sessionState.getAcpSessionTitleOverride("delegated-session-1")).toBe("Delegated research")

    sessionState.clearAcpToAppSessionMapping("delegated-session-1")
    expect(sessionState.getAcpSessionTitleOverride("delegated-session-1")).toBeUndefined()
  })

  it("resolves nested delegated sessions to their root app session", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.registerKnownAppSessionId("app-session-1")
    sessionState.setAcpToAppSessionMapping("level-2-subsession", "app-session-1")
    sessionState.setAcpToAppSessionMapping("level-3-subsession", "level-2-subsession")

    expect(sessionState.getRootAppSessionForAcpSession("level-3-subsession")).toBe("app-session-1")
    expect(sessionState.getRootAppSessionForAcpSession("level-2-subsession")).toBe("app-session-1")
    expect(sessionState.getRootAppSessionForAcpSession("unknown-session")).toBeUndefined()
  })

  it("does not treat unresolved delegated chain nodes as app sessions", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setAcpToAppSessionMapping("unresolved-level-3-subsession", "unresolved-level-2-subsession")
    sessionState.setAcpToAppRunIdMapping("unresolved-level-2-subsession", "run-unresolved-2")

    expect(sessionState.getRootAppSessionForAcpSession("unresolved-level-3-subsession")).toBeUndefined()
  })

  it("does not infer app sessions from unknown terminal mapping values", async () => {
    const sessionState = await import("./acp-session-state")

    sessionState.setAcpToAppSessionMapping("inferred-level-3-subsession", "inferred-level-2-subsession")

    expect(sessionState.getRootAppSessionForAcpSession("inferred-level-3-subsession")).toBeUndefined()
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
})
