export interface DiscordMessageGateInput {
  authorId: string
  channelId: string
  guildId?: string | null
  isDirectMessage: boolean
  mentioned: boolean
  nameMentioned: boolean
  requireMention: boolean
  dmEnabled: boolean
  allowUserIds?: string[]
  allowGuildIds?: string[]
  allowChannelIds?: string[]
  allowRoleIds?: string[]
  dmAllowUserIds?: string[]
  /** Role IDs the message author has in the current guild */
  authorRoleIds?: string[]
  /**
   * Discord application owner IDs (auto-detected from
   * `client.application.owner`). Owners always bypass the DM allowlist
   * check, so a fresh install can be bootstrapped: the owner DMs the bot,
   * gets a reply, and runs `/dm allow @other` to grant access to
   * additional users.
   *
   * Owners do NOT bypass `dmEnabled=false`, `allowUserIds`, `allowRoleIds`,
   * `allowChannelIds`, or `allowGuildIds` — those represent explicit
   * operator intent to lock the bot down, and silently overriding them
   * would be a surprising security regression.
   */
  applicationOwnerIds?: ReadonlySet<string>
}

/**
 * Check if the bot's name (or aliases) is mentioned in the message text,
 * without requiring a Discord @tag.
 */
export function isBotNameMentioned(
  content: string,
  botUsername?: string,
  botDisplayName?: string,
): boolean {
  if (!content) return false
  const lower = content.toLowerCase()

  const names: string[] = []
  if (botUsername) names.push(botUsername.toLowerCase())
  if (botDisplayName && botDisplayName.toLowerCase() !== botUsername?.toLowerCase()) {
    names.push(botDisplayName.toLowerCase())
  }

  for (const name of names) {
    if (name.length < 2) continue
    // Match as a whole word (bounded by non-alphanumeric chars or start/end)
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i")
    if (re.test(lower)) return true
  }
  return false
}

function normalizeIds(values: string[] | undefined): string[] {
  return (values || []).map((value) => value.trim()).filter(Boolean)
}

/**
 * Shape describing the Discord location a message was sent from. The same
 * object is used for both the conversation ID (the stable key the agent uses
 * to persist conversation history) and the session epoch lookup key.
 */
export interface DiscordConversationLocation {
  channelId: string
  guildId?: string | null
  threadId?: string | null
  isDirectMessage: boolean
}

/**
 * Base key used to look up a per-location session epoch in
 * `config.discordConversationEpochs`. Unlike `getDiscordConversationId`, this
 * key is epoch-agnostic — it describes the physical Discord location only, not
 * the logical session iteration.
 *
 * The key has the same shape as the legacy (epoch-0) conversation ID, so any
 * existing channel that has never been `/new`'d keeps its historical ID.
 */
export function getDiscordConversationKey(input: DiscordConversationLocation): string {
  if (input.isDirectMessage) {
    return `discord_dm_${input.channelId}`
  }

  const base = `discord_g${input.guildId || "unknown"}_c${input.channelId}`
  return input.threadId ? `${base}_t${input.threadId}` : base
}

/**
 * Deterministic conversation ID for a Discord message location.
 *
 * When the optional `epoch` is undefined, 0, or negative, the function returns
 * the legacy base key so existing channels keep their historical conversation
 * history (backward compatible). When epoch > 0, the suffix `_s<epoch>` is
 * appended, forking the conversation into a fresh session while leaving the
 * previous session's history intact in the agent's conversation store.
 *
 * The epoch is incremented by the `/new` slash command (see
 * `handleNewCommand` in discord-service.ts).
 */
export function getDiscordConversationId(
  input: DiscordConversationLocation & { epoch?: number },
): string {
  const base = getDiscordConversationKey(input)
  const epoch = input.epoch ?? 0
  return epoch > 0 ? `${base}_s${epoch}` : base
}

export function splitDiscordMessageContent(content: string, maxLength: number = 1900): string[] {
  const normalized = content.trim()
  if (!normalized) return []
  if (normalized.length <= maxLength) return [normalized]

  const chunks: string[] = []
  let remaining = normalized

  while (remaining.length > maxLength) {
    const slice = remaining.slice(0, maxLength)
    const newlineBreak = slice.lastIndexOf("\n")
    const spaceBreak = slice.lastIndexOf(" ")
    const breakIndex = newlineBreak > maxLength * 0.6 ? newlineBreak : (spaceBreak > maxLength * 0.75 ? spaceBreak : -1)
    const chunk = remaining.slice(0, breakIndex > 0 ? breakIndex : maxLength).trim()
    chunks.push(chunk)
    remaining = remaining.slice(chunk.length).trim()
  }

  if (remaining) {
    chunks.push(remaining)
  }

  return chunks
}

/**
 * Input for the slash command authorization helpers.
 *
 * The Discord bot's privilege model has two tiers:
 *   1. **Application owner** — whoever created the bot in the Discord
 *      developer portal (or, for Team-owned apps, every team member).
 *      Auto-detected on `ready` via `client.application.fetch()` and
 *      cached in `DiscordService.applicationOwnerIds`. Owners can do
 *      anything — read state and mutate access lists.
 *   2. **DM allowlist** — users explicitly added via `/dm allow @user`
 *      by an owner. These users can DM the bot and invoke read-only
 *      slash commands (`/status`, `/logs`, `/whoami`) but CANNOT mutate
 *      access lists. This prevents the transitive-escalation chain
 *      where a single allowlisted user could grant admin to any other
 *      user and effectively become root.
 */
export interface DiscordSlashCommandAuthInput {
  userId: string
  applicationOwnerIds: ReadonlySet<string>
  dmAllowUserIds?: string[]
}

/**
 * Can the caller use read-only slash commands (`/status`, `/logs`,
 * `/whoami`)? Owners always can. Anyone on the DM allowlist also can.
 */
export function canUseReadOnlySlashCommand(input: DiscordSlashCommandAuthInput): boolean {
  if (input.applicationOwnerIds.has(input.userId)) return true
  const dmAllowList = normalizeIds(input.dmAllowUserIds)
  return dmAllowList.includes(input.userId)
}

/**
 * Can the caller use mutating slash commands (`/dm allow|deny|on|off`,
 * `/access allow-x|deny-x`, `/mention on|off`, `/stop`)? ONLY application
 * owners can. This closes the transitive escalation chain where anyone
 * on the DM allowlist could otherwise promote other users to admin.
 */
export function canUseMutatingSlashCommand(
  input: Pick<DiscordSlashCommandAuthInput, "userId" | "applicationOwnerIds">,
): boolean {
  return input.applicationOwnerIds.has(input.userId)
}

export function getDiscordMessageRejectionReason(input: DiscordMessageGateInput): string | null {
  const allowUserIds = normalizeIds(input.allowUserIds)
  const allowGuildIds = normalizeIds(input.allowGuildIds)
  const allowChannelIds = normalizeIds(input.allowChannelIds)
  const allowRoleIds = normalizeIds(input.allowRoleIds)
  const dmAllowUserIds = normalizeIds(input.dmAllowUserIds)

  if (input.isDirectMessage) {
    if (!input.dmEnabled) {
      return "direct messages are disabled"
    }
    // DM user allowlist — when set, only these users can DM the bot.
    // Discord application owners are exempt so a fresh install can be
    // bootstrapped (the owner DMs the bot, gets a reply, and uses
    // `/dm allow @other` to grant access to additional users). Without
    // this bypass an owner who forgot to add their own ID to the DM
    // allowlist is silently locked out — the exact scenario flagged in
    // PR #305 review.
    const isApplicationOwner = !!input.applicationOwnerIds?.has(input.authorId)
    if (
      dmAllowUserIds.length > 0 &&
      !dmAllowUserIds.includes(input.authorId) &&
      !isApplicationOwner
    ) {
      return "user not in DM allowlist"
    }
  } else {
    if (input.requireMention && !input.mentioned && !input.nameMentioned) {
      return "bot mention required"
    }
    if (allowGuildIds.length > 0 && (!input.guildId || !allowGuildIds.includes(input.guildId))) {
      return "guild not allowlisted"
    }
    // Role-based filtering — if role allowlist is set, user must have at least one matching role
    if (allowRoleIds.length > 0) {
      const authorRoles = normalizeIds(input.authorRoleIds)
      if (!authorRoles.some((roleId) => allowRoleIds.includes(roleId))) {
        return "user does not have an allowlisted role"
      }
    }
  }

  if (allowUserIds.length > 0 && !allowUserIds.includes(input.authorId)) {
    return "user not allowlisted"
  }

  if (allowChannelIds.length > 0 && !allowChannelIds.includes(input.channelId)) {
    return "channel not allowlisted"
  }

  return null
}