import { describe, expect, it } from "vitest"

import {
  addAgentProfileConversationMessage,
  clearAgentProfileConversationId,
  getAgentProfileConversation,
  removeAgentProfileConversation,
  setAgentProfileConversation,
} from "./agent-profile-conversations"

describe("agent profile conversations", () => {
  it("gets an existing conversation or an empty list", () => {
    const conversations = {
      profile: [{ role: "user", content: "hello" }],
    }

    expect(getAgentProfileConversation(conversations, "profile")).toEqual([{ role: "user", content: "hello" }])
    expect(getAgentProfileConversation(conversations, "missing")).toEqual([])
  })

  it("sets and appends conversation messages without mutating the original map", () => {
    const conversations = {
      profile: [{ role: "user", content: "hello" }],
    }

    const replaced = setAgentProfileConversation(conversations, "profile", [{ role: "assistant", content: "hi" }])
    expect(replaced).toEqual({
      profile: [{ role: "assistant", content: "hi" }],
    })
    expect(conversations.profile).toEqual([{ role: "user", content: "hello" }])

    const appended = addAgentProfileConversationMessage(replaced, "profile", { role: "user", content: "again" })
    expect(appended.profile).toEqual([
      { role: "assistant", content: "hi" },
      { role: "user", content: "again" },
    ])
  })

  it("removes a profile conversation", () => {
    expect(removeAgentProfileConversation({
      keep: [{ content: "stay" }],
      remove: [{ content: "gone" }],
    }, "remove")).toEqual({
      keep: [{ content: "stay" }],
    })
  })

  it("clears profile conversation ids immutably", () => {
    const profile = { id: "profile", conversationId: "conv-1", displayName: "Profile" }
    expect(clearAgentProfileConversationId(profile)).toEqual({
      id: "profile",
      conversationId: undefined,
      displayName: "Profile",
    })
    expect(profile.conversationId).toBe("conv-1")
  })
})
