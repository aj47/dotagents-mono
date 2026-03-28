import { describe, expect, it } from "vitest"
import { resolveConversationHistorySelection } from "./conversation-history-selection"

const history = [
  {
    id: "conv_alpha123",
    title: "Alpha conversation",
    createdAt: 1,
    updatedAt: 10,
    messageCount: 4,
    lastMessage: "alpha",
    preview: "alpha preview",
  },
  {
    id: "conv_alpine456",
    title: "Alpine conversation",
    createdAt: 2,
    updatedAt: 20,
    messageCount: 5,
    lastMessage: "alpine",
    preview: "alpine preview",
  },
  {
    id: "conv_beta789",
    title: "Beta conversation",
    createdAt: 3,
    updatedAt: 30,
    messageCount: 6,
    lastMessage: "beta",
    preview: "beta preview",
  },
] as const

describe("resolveConversationHistorySelection", () => {
  it("resolves an exact conversation id match", () => {
    const result = resolveConversationHistorySelection(history, "conv_beta789")

    expect(result.selectedConversation?.id).toBe("conv_beta789")
    expect(result.ambiguousConversations).toBeUndefined()
  })

  it("resolves a unique id prefix", () => {
    const result = resolveConversationHistorySelection(history, "conv_be")

    expect(result.selectedConversation?.id).toBe("conv_beta789")
    expect(result.ambiguousConversations).toBeUndefined()
  })

  it("returns ambiguous matches for a non-unique prefix", () => {
    const result = resolveConversationHistorySelection(history, "conv_al")

    expect(result.selectedConversation).toBeUndefined()
    expect(
      result.ambiguousConversations?.map((conversation) => conversation.id),
    ).toEqual(["conv_alpha123", "conv_alpine456"])
  })

  it("returns no selection for an unknown query", () => {
    const result = resolveConversationHistorySelection(history, "conv_missing")

    expect(result.selectedConversation).toBeUndefined()
    expect(result.ambiguousConversations).toBeUndefined()
  })
})
