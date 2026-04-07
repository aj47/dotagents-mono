import { describe, expect, it } from "vitest"
import {
  canUseMutatingSlashCommand,
  canUseReadOnlySlashCommand,
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

  it("restricts slash command mutations to Discord application owners only", () => {
    const ownerIds = new Set(["owner-1", "team-member-2"])
    const dmAllowUserIds = ["user-a", "user-b"]

    // Owners can both read and mutate
    expect(canUseReadOnlySlashCommand({ userId: "owner-1", applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(true)
    expect(canUseMutatingSlashCommand({ userId: "owner-1", applicationOwnerIds: ownerIds })).toBe(true)
    expect(canUseReadOnlySlashCommand({ userId: "team-member-2", applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(true)
    expect(canUseMutatingSlashCommand({ userId: "team-member-2", applicationOwnerIds: ownerIds })).toBe(true)

    // Allowlisted users can read but NOT mutate — this is the key fix.
    // Without this, any allowlisted user could transitively grant admin via
    // `/dm allow @other_user` and escalate to owner-equivalent privileges.
    expect(canUseReadOnlySlashCommand({ userId: "user-a", applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(true)
    expect(canUseMutatingSlashCommand({ userId: "user-a", applicationOwnerIds: ownerIds })).toBe(false)

    // Unknown users can do neither
    expect(canUseReadOnlySlashCommand({ userId: "randomer", applicationOwnerIds: ownerIds, dmAllowUserIds })).toBe(false)
    expect(canUseMutatingSlashCommand({ userId: "randomer", applicationOwnerIds: ownerIds })).toBe(false)

    // Empty owner set + empty allowlist = locked down (fresh install safety)
    expect(canUseReadOnlySlashCommand({ userId: "anyone", applicationOwnerIds: new Set(), dmAllowUserIds: [] })).toBe(false)
    expect(canUseMutatingSlashCommand({ userId: "anyone", applicationOwnerIds: new Set() })).toBe(false)

    // Whitespace entries in dmAllowUserIds are filtered, but trimmed values
    // are accepted (matches the normalization other allowlists use throughout
    // discord-utils.ts).
    expect(canUseReadOnlySlashCommand({
      userId: "user-a",
      applicationOwnerIds: new Set(),
      dmAllowUserIds: ["  ", "", "user-a "],
    })).toBe(true)
    // But an entry that's only whitespace never matches a real userId.
    expect(canUseReadOnlySlashCommand({
      userId: "nobody",
      applicationOwnerIds: new Set(),
      dmAllowUserIds: ["  ", ""],
    })).toBe(false)
  })
})