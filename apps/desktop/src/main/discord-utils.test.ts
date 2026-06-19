import { describe, expect, it } from "vitest"
import {
  buildDiscordAttachmentPromptBlock,
  canUseMutatingSlashCommand,
  canUseReadOnlySlashCommand,
  extractDiscordMarkdownImages,
  getDiscordConversationId,
  getDiscordConversationKey,
  getDiscordMessageRejectionReason,
  getSupportedDiscordAttachmentImageMimeType,
  isBotNameMentioned,
  markDiscordBotReply,
  shouldAllowDiscordNoReply,
  shouldProcessDiscordMessageType,
  splitDiscordMessageContent,
  stripDiscordMarkdownImages,
  summarizeDiscordEmbedImages,
  summarizeDiscordAttachments,
} from "./discord-utils"

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

  it("treats plain-text bot name callouts as direct address", () => {
    expect(isBotNameMentioned("jinx can u see this", "Jinx", "Jinx")).toBe(true)
    expect(isBotNameMentioned("im talking to u jinx", "Jinx", "Jinx")).toBe(true)
    expect(isBotNameMentioned("that jinxed the deploy", "Jinx", "Jinx")).toBe(false)

    expect(shouldAllowDiscordNoReply({
      isDirectMessage: false,
      atMentioned: false,
      nameMentioned: true,
    })).toBe(false)
  })

  it("keeps short follow-ups after a bot reply out of no-reply mode", () => {
    const replies = new Map<string, number>()
    markDiscordBotReply(replies, "discord_g1_c2", 1_000)

    expect(shouldAllowDiscordNoReply({
      isDirectMessage: false,
      atMentioned: false,
      nameMentioned: false,
      lastBotReplyAt: replies.get("discord_g1_c2"),
      now: 1_000 + 30_000,
    })).toBe(false)

    expect(shouldAllowDiscordNoReply({
      isDirectMessage: false,
      atMentioned: false,
      nameMentioned: false,
      lastBotReplyAt: replies.get("discord_g1_c2"),
      now: 1_000 + 3 * 60_000,
    })).toBe(true)
  })

  it("filters Discord system thread events before message processing", () => {
    expect(shouldProcessDiscordMessageType(0)).toBe(true)
    expect(shouldProcessDiscordMessageType(19)).toBe(true)
    expect(shouldProcessDiscordMessageType(18)).toBe(false)
    expect(shouldProcessDiscordMessageType(21)).toBe(false)
    expect(shouldProcessDiscordMessageType("0")).toBe(false)
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

  it("detects Discord image attachment mime types from content type or filename", () => {
    expect(getSupportedDiscordAttachmentImageMimeType({
      name: "screenshot.bin",
      contentType: "image/png; charset=binary",
    })).toBe("image/png")
    expect(getSupportedDiscordAttachmentImageMimeType({
      name: "photo.JPG",
      contentType: null,
    })).toBe("image/jpeg")
    expect(getSupportedDiscordAttachmentImageMimeType({
      name: "notes.txt",
      contentType: "text/plain",
    })).toBeUndefined()
  })

  it("summarizes Discord attachments and skips entries without URLs", () => {
    const attachments = summarizeDiscordAttachments([
      {
        id: "a1",
        name: "diagram.png",
        url: "https://cdn.discordapp.com/diagram.png",
        contentType: "image/png",
        size: 123,
      },
      {
        id: "a2",
        name: "missing-url.txt",
        url: "",
        contentType: "text/plain",
        size: 10,
      },
    ])

    expect(attachments).toEqual([
      {
        id: "a1",
        name: "diagram.png",
        url: "https://cdn.discordapp.com/diagram.png",
        contentType: "image/png",
        size: 123,
        imageMimeType: "image/png",
      },
    ])
  })

  it("summarizes image embeds as attachment fallbacks", () => {
    const summaries = summarizeDiscordEmbedImages([
      {
        title: "Preview",
        image: { url: "https://cdn.discordapp.com/attachments/1/screenshot.png?ex=1" },
      },
      {
        thumbnail: { proxyURL: "https://media.discordapp.net/attachments/1/thumb.webp" },
      },
      {
        url: "https://example.com/no-image",
      },
    ])

    expect(summaries).toHaveLength(2)
    expect(summaries[0]).toMatchObject({
      name: "screenshot.png",
      url: "https://cdn.discordapp.com/attachments/1/screenshot.png?ex=1",
      imageMimeType: "image/png",
    })
    expect(summaries[1]).toMatchObject({
      name: "thumb.webp",
      imageMimeType: "image/webp",
    })
  })

  it("extracts and strips outbound Discord markdown images", () => {
    const content = [
      "Here are previews.",
      "![One](assets://conversation-image/conv/file.png)",
      "![Two](data:image/png;base64,AAAA)",
      "Done.",
    ].join("\n\n")

    expect(extractDiscordMarkdownImages(content)).toEqual([
      { alt: "One", url: "assets://conversation-image/conv/file.png" },
      { alt: "Two", url: "data:image/png;base64,AAAA" },
    ])
    expect(stripDiscordMarkdownImages(content)).toBe("Here are previews.\n\nDone.")
  })

  it("builds compact Discord attachment prompt blocks with optional image markdown", () => {
    const block = buildDiscordAttachmentPromptBlock([
      {
        id: "a1",
        name: "screen\nshot.png",
        url: "https://cdn.discordapp.com/screenshot.png",
        contentType: "image/png",
        size: 200,
        imageMimeType: "image/png",
      },
      {
        id: "a2",
        name: "notes\"injection.txt",
        url: "https://cdn.discordapp.com/notes.txt",
        contentType: "text/plain",
        size: 50,
      },
    ], new Map([["a1", "assets://conversation-image/conv/screenshot.png"]]))

    expect(block).toContain("<discord_attachments>")
    expect(block).toContain('name="screen shot.png"')
    expect(block).toContain('name="notes injection.txt"')
    expect(block).not.toContain('notes"injection')
    expect(block).toContain('type="image/png"')
    expect(block).toContain('url="https://cdn.discordapp.com/notes.txt"')
    expect(block).toContain("![screen shot.png](assets://conversation-image/conv/screenshot.png)")
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
