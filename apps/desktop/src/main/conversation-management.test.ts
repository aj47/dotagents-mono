import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Conversation, ConversationHistoryItem } from "@shared/types"

const mocks = vi.hoisted(() => ({
  addMessageToConversation: vi.fn(),
  createConversation: vi.fn(),
  configGet: vi.fn(),
  configSave: vi.fn(),
  getConversationHistory: vi.fn(),
  renameConversationTitle: vi.fn(),
  loadConversation: vi.fn(),
  saveConversation: vi.fn(),
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
    addMessageToConversation: mocks.addMessageToConversation,
    createConversation: mocks.createConversation,
    getConversationHistory: mocks.getConversationHistory,
    loadConversation: mocks.loadConversation,
    renameConversationTitle: mocks.renameConversationTitle,
    saveConversation: mocks.saveConversation,
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

  it("shares conversation history load/save/create/add helpers through one module", async () => {
    const history: ConversationHistoryItem[] = [
      {
        id: "conv-1",
        title: "Conversation one",
        createdAt: 1,
        updatedAt: 2,
        messageCount: 3,
        lastMessage: "latest",
        preview: "latest",
      },
    ]
    const conversation: Conversation = {
      id: "conv-1",
      title: "Conversation one",
      createdAt: 1,
      updatedAt: 2,
      messages: [],
    }
    const createdConversation: Conversation = {
      id: "conv-2",
      title: "Created conversation",
      createdAt: 3,
      updatedAt: 4,
      messages: [],
    }
    const updatedConversation: Conversation = {
      ...conversation,
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "Hello",
          timestamp: 5,
        },
      ],
    }

    mocks.getConversationHistory.mockResolvedValue(history)
    mocks.loadConversation.mockResolvedValue(conversation)
    mocks.createConversation.mockResolvedValue(createdConversation)
    mocks.addMessageToConversation.mockResolvedValue(updatedConversation)

    const {
      addManagedMessageToConversation,
      createManagedConversation,
      getManagedConversation,
      getManagedConversationHistory,
      saveManagedConversation,
    } = await import("./conversation-management")

    await expect(getManagedConversationHistory()).resolves.toEqual(history)
    await expect(getManagedConversation("conv-1")).resolves.toEqual(
      conversation,
    )
    await saveManagedConversation(conversation, { preserveTimestamp: true })
    await expect(
      createManagedConversation("Draft reply", "assistant"),
    ).resolves.toEqual(createdConversation)
    await expect(
      addManagedMessageToConversation("conv-1", "Hello", "user"),
    ).resolves.toEqual(updatedConversation)

    expect(mocks.getConversationHistory).toHaveBeenCalledOnce()
    expect(mocks.loadConversation).toHaveBeenCalledWith("conv-1")
    expect(mocks.saveConversation).toHaveBeenCalledWith(conversation, true)
    expect(mocks.createConversation).toHaveBeenCalledWith(
      "Draft reply",
      "assistant",
    )
    expect(mocks.addMessageToConversation).toHaveBeenCalledWith(
      "conv-1",
      "Hello",
      "user",
      undefined,
      undefined,
    )
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

    const { renameConversationTitleAndSyncSession } =
      await import("./conversation-management")
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
    const { deleteConversationAndSyncSessionState } =
      await import("./conversation-management")

    await deleteConversationAndSyncSessionState("conv-1")

    expect(mocks.deleteConversation).toHaveBeenCalledWith("conv-1")
    expect(mocks.configSave).toHaveBeenCalledWith({
      pinnedSessionIds: ["conv-2"],
      archivedSessionIds: ["conv-3"],
    })
  })

  it("clears pinned and archived session state when deleting all conversations", async () => {
    const { deleteAllConversationsAndSyncSessionState } =
      await import("./conversation-management")

    await deleteAllConversationsAndSyncSessionState()

    expect(mocks.deleteAllConversations).toHaveBeenCalledOnce()
    expect(mocks.configSave).toHaveBeenCalledWith({
      pinnedSessionIds: [],
      archivedSessionIds: [],
    })
  })
})
