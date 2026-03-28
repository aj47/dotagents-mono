import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  configGet: vi.fn(),
  configSave: vi.fn(),
  renameConversationTitle: vi.fn(),
  deleteConversation: vi.fn(),
  deleteAllConversations: vi.fn(),
  getActiveSessions: vi.fn(),
  updateSession: vi.fn(),
}))

vi.mock("./config", () => ({
  configStore: {
    get: mocks.configGet,
    save: mocks.configSave,
  },
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    renameConversationTitle: mocks.renameConversationTitle,
    deleteConversation: mocks.deleteConversation,
    deleteAllConversations: mocks.deleteAllConversations,
  },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getActiveSessions: mocks.getActiveSessions,
    updateSession: mocks.updateSession,
  },
}))

describe("conversation-management", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mocks.configGet.mockReturnValue({
      pinnedSessionIds: ["conv-1", "conv-2"],
      archivedSessionIds: ["conv-3", "conv-1"],
    })
    mocks.getActiveSessions.mockReturnValue([])
  })

  it("shares title updates across every tracked session for the same conversation", async () => {
    mocks.renameConversationTitle.mockResolvedValue({
      id: "conv-1",
      title: "Renamed conversation",
    })
    mocks.getActiveSessions.mockReturnValue([
      { id: "session-1", conversationId: "conv-1" },
      { id: "session-2", conversationId: "conv-2" },
      { id: "session-3", conversationId: "conv-1" },
    ])

    const { renameConversationTitleAndSyncSession } = await import(
      "./conversation-management"
    )
    const updatedConversation = await renameConversationTitleAndSyncSession(
      "conv-1",
      "Renamed conversation",
    )

    expect(updatedConversation).toEqual({
      id: "conv-1",
      title: "Renamed conversation",
    })
    expect(mocks.renameConversationTitle).toHaveBeenCalledWith(
      "conv-1",
      "Renamed conversation",
    )
    expect(mocks.updateSession).toHaveBeenCalledTimes(2)
    expect(mocks.updateSession).toHaveBeenCalledWith("session-1", {
      conversationTitle: "Renamed conversation",
    })
    expect(mocks.updateSession).toHaveBeenCalledWith("session-3", {
      conversationTitle: "Renamed conversation",
    })
  })

  it("removes deleted conversations from pinned and archived session state", async () => {
    const { deleteConversationAndSyncSessionState } = await import(
      "./conversation-management"
    )

    await deleteConversationAndSyncSessionState("conv-1")

    expect(mocks.deleteConversation).toHaveBeenCalledWith("conv-1")
    expect(mocks.configSave).toHaveBeenCalledWith({
      pinnedSessionIds: ["conv-2"],
      archivedSessionIds: ["conv-3"],
    })
  })

  it("clears pinned and archived session state when deleting all conversations", async () => {
    const { deleteAllConversationsAndSyncSessionState } = await import(
      "./conversation-management"
    )

    await deleteAllConversationsAndSyncSessionState()

    expect(mocks.deleteAllConversations).toHaveBeenCalledOnce()
    expect(mocks.configSave).toHaveBeenCalledWith({
      pinnedSessionIds: [],
      archivedSessionIds: [],
    })
  })
})
