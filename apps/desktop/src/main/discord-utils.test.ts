import { describe, expect, it } from "vitest"
import {
  canUseMutatingSlashCommand,
  canUseReadOnlySlashCommand,
  getDiscordConversationId,
  getDiscordConversationKey,
  getDiscordMessageRejectionReason,
  splitDiscordMessageContent,
} from "@dotagents/shared/discord-utils"

describe("discord utils", () => {
  it("builds deterministic conversation ids for DMs, channels, and threads", () => {
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true })).toBe("discord_dm_dm-1")
    expect(getDiscordConversationId({ channelId: "chan-1", guildId: "guild-1", isDirectMessage: false })).toBe("discord_gguild-1_cchan-1")
    expect(getDiscordConversationId({ channelId: "chan-1", guildId: "guild-1", threadId: "thread-1", isDirectMessage: false })).toBe("discord_gguild-1_cchan-1_tthread-1")
  })

  it("forks into a new conversation id when a session epoch > 0 is supplied", () => {
    // Epoch 0 / undefined is the backward-compatible default: the id matches
    // the legacy (pre-session) format so every existing channel keeps its
    // historical conversation history.
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true, epoch: 0 })).toBe("discord_dm_dm-1")
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true, epoch: undefined })).toBe("discord_dm_dm-1")

    // Epoch 1+ appends `_s<epoch>` so /new starts a fresh conversation.
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true, epoch: 1 })).toBe("discord_dm_dm-1_s1")
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true, epoch: 42 })).toBe("discord_dm_dm-1_s42")

    // Works for guild channels and threads too.
    expect(getDiscordConversationId({ channelId: "chan-1", guildId: "guild-1", isDirectMessage: false, epoch: 2 })).toBe("discord_gguild-1_cchan-1_s2")
    expect(getDiscordConversationId({ channelId: "chan-1", guildId: "guild-1", threadId: "thread-1", isDirectMessage: false, epoch: 3 })).toBe("discord_gguild-1_cchan-1_tthread-1_s3")

    // Defensive: a negative epoch (should never happen) falls back to the
    // base key rather than corrupting the conversation id.
    expect(getDiscordConversationId({ channelId: "dm-1", isDirectMessage: true, epoch: -1 })).toBe("discord_dm_dm-1")
  })

  it("derives a stable per-location key used to look up the session epoch", () => {
    // The base key is identical to the legacy conversation id (epoch 0), so
    // config entries written under this key are backward-compatible with the
    // IDs used by every channel that predates the epoch feature.
    expect(getDiscordConversationKey({ channelId: "dm-1", isDirectMessage: true })).toBe("discord_dm_dm-1")
    expect(getDiscordConversationKey({ channelId: "chan-1", guildId: "guild-1", isDirectMessage: false })).toBe("discord_gguild-1_cchan-1")
    expect(getDiscordConversationKey({ channelId: "chan-1", guildId: "guild-1", threadId: "thread-1", isDirectMessage: false })).toBe("discord_gguild-1_cchan-1_tthread-1")

    // DM and guild channels with the same channelId do NOT collide — the DM
    // branch uses a distinct prefix. This matters because a bot can end up
    // with a DM channel id that numerically matches a guild channel id.
    expect(getDiscordConversationKey({ channelId: "same-id", isDirectMessage: true }))
      .not.toBe(getDiscordConversationKey({ channelId: "same-id", guildId: "guild-1", isDirectMessage: false }))

    // Threads and their parent channels resolve to distinct keys so /new in
    // a thread does not reset the parent channel's session, and vice versa.
    expect(getDiscordConversationKey({ channelId: "chan-1", guildId: "guild-1", threadId: "thread-1", isDirectMessage: false }))
      .not.toBe(getDiscordConversationKey({ channelId: "chan-1", guildId: "guild-1", isDirectMessage: false }))
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

  it("exempts Discord application owners from the DM allowlist (bootstrap path)", () => {
    // Without the owner bypass: the owner gets locked out by their own
    // DM allowlist as soon as it's non-empty, breaking the bootstrap flow
    // where the owner DMs the bot to add other users via `/dm allow`.
    expect(getDiscordMessageRejectionReason({
      authorId: "owner-1",
      channelId: "dm-1",
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      dmAllowUserIds: ["other-user"],
    })).toBe("user not in DM allowlist")

    // With the owner bypass: same input, but the author is in
    // applicationOwnerIds → allowed through.
    expect(getDiscordMessageRejectionReason({
      authorId: "owner-1",
      channelId: "dm-1",
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      dmAllowUserIds: ["other-user"],
      applicationOwnerIds: new Set(["owner-1", "team-member-2"]),
    })).toBe(null)

    // The bypass does NOT override `dmEnabled=false` — owners still
    // respect the explicit "DMs disabled" setting (treating that as
    // operator intent, not a misconfiguration).
    expect(getDiscordMessageRejectionReason({
      authorId: "owner-1",
      channelId: "dm-1",
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: false,
      dmAllowUserIds: ["other-user"],
      applicationOwnerIds: new Set(["owner-1"]),
    })).toBe("direct messages are disabled")

    // The bypass does NOT promote a non-owner just because the
    // applicationOwnerIds set is non-empty.
    expect(getDiscordMessageRejectionReason({
      authorId: "stranger",
      channelId: "dm-1",
      isDirectMessage: true,
      mentioned: false,
      nameMentioned: false,
      requireMention: true,
      dmEnabled: true,
      dmAllowUserIds: ["other-user"],
      applicationOwnerIds: new Set(["owner-1"]),
    })).toBe("user not in DM allowlist")
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
