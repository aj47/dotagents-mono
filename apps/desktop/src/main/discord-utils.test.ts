import { describe, expect, it } from "vitest"
import {
  getDiscordConversationId,
  getDiscordMessageRejectionReason,
  splitDiscordMessageContent,
} from "./discord-utils"

describe("discord utils", () => {
  it("builds deterministic conversation ids for DMs, channels, and threads", () => {
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true })).toBe("discord_dm_dm-1")
    expect(getDiscordConversationId({ channelId: "chan-1", guildId: "guild-1", isDirectMessage: false })).toBe("discord_gguild-1_cchan-1")
    expect(getDiscordConversationId({ channelId: "chan-1", guildId: "guild-1", threadId: "thread-1", isDirectMessage: false })).toBe("discord_gguild-1_cchan-1_tthread-1")
  })

  it("rejects messages that fail DM, mention, or allowlist rules", () => {
    expect(getDiscordMessageRejectionReason({
      authorId: "user-1",
      channelId: "dm-1",
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: false,
    })).toBe("direct messages are disabled")

    expect(getDiscordMessageRejectionReason({
      authorId: "user-1",
      channelId: "chan-1",
      guildId: "guild-1",
      isDirectMessage: false,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
    })).toBe("bot mention required")

    expect(getDiscordMessageRejectionReason({
      authorId: "user-1",
      channelId: "chan-1",
      guildId: "guild-1",
      isDirectMessage: false,
      mentioned: true,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      allowGuildIds: ["guild-2"],
    })).toBe("guild not allowlisted")
  })

  it("chunks long Discord replies without exceeding the limit", () => {
    const chunks = splitDiscordMessageContent(`${"a".repeat(1200)}\n${"b".repeat(1200)}`, 1900)
    expect(chunks.length).toBe(2)
    expect(chunks.every((chunk) => chunk.length <= 1900)).toBe(true)
  })
})