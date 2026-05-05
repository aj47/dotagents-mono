import { sanitizeConfigStringList } from './config-list-input';

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
   * `allowChannelIds`, or `allowGuildIds` - those represent explicit
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
  return sanitizeConfigStringList(values)
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
 * key is epoch-agnostic - it describes the physical Discord location only, not
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
 *   1. Application owner - whoever created the bot in the Discord developer
 *      portal, or every team member for Team-owned apps. Owners can do
 *      anything: read state and mutate access lists.
 *   2. DM allowlist - users explicitly added via `/dm allow @user` by an
 *      owner. These users can DM the bot and invoke read-only slash commands
 *      (`/status`, `/logs`, `/whoami`) but cannot mutate access lists.
 */
export interface DiscordSlashCommandAuthInput {
  userId: string
  applicationOwnerIds: ReadonlySet<string>
  dmAllowUserIds?: string[]
}

export interface DiscordOperatorAccessInput {
  authorId: string
  channelId: string
  guildId?: string | null
  parentChannelId?: string | null
  isThread?: boolean
  authorRoleIds?: string[]
  allowUserIds?: string[]
  allowGuildIds?: string[]
  allowChannelIds?: string[]
  allowRoleIds?: string[]
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
 * `/access allow-x|deny-x`, `/mention on|off`, `/stop`)? Only application
 * owners can.
 */
export function canUseMutatingSlashCommand(
  input: Pick<DiscordSlashCommandAuthInput, "userId" | "applicationOwnerIds">,
): boolean {
  return input.applicationOwnerIds.has(input.userId)
}

function getDiscordOperatorChannelId(
  input: Pick<DiscordOperatorAccessInput, 'channelId' | 'parentChannelId' | 'isThread'>,
): string {
  return input.isThread ? (input.parentChannelId || input.channelId) : input.channelId
}

export function getDiscordOperatorAccessRejectionReason(input: DiscordOperatorAccessInput): string | null {
  const allowUserIds = normalizeIds(input.allowUserIds)
  const allowGuildIds = normalizeIds(input.allowGuildIds)
  const allowChannelIds = normalizeIds(input.allowChannelIds)
  const allowRoleIds = normalizeIds(input.allowRoleIds)

  if (allowUserIds.length === 0 && allowGuildIds.length === 0 && allowChannelIds.length === 0 && allowRoleIds.length === 0) {
    return "Discord operator commands are disabled. Configure discordOperatorAllowUserIds (or guild/channel/role) to enable them."
  }

  if (allowRoleIds.length > 0) {
    const authorRoles = normalizeIds(input.authorRoleIds)
    if (authorRoles.some((roleId) => allowRoleIds.includes(roleId))) {
      return null
    }
  }

  if (allowUserIds.length > 0 && allowUserIds.includes(input.authorId)) {
    return null
  }

  if (allowGuildIds.length > 0 && input.guildId && allowGuildIds.includes(input.guildId)) {
    const operatorChannelId = getDiscordOperatorChannelId(input)
    if (allowChannelIds.length > 0 && !allowChannelIds.includes(operatorChannelId)) {
      return "channel is not in the Discord operator allowlist"
    }
    return null
  }

  if (allowRoleIds.length > 0) {
    return "user does not have an operator-allowlisted role"
  }
  if (allowUserIds.length > 0) {
    return "user is not in the Discord operator allowlist"
  }
  if (allowGuildIds.length > 0) {
    return "guild is not in the Discord operator allowlist"
  }

  const operatorChannelId = getDiscordOperatorChannelId(input)
  if (allowChannelIds.length > 0 && !allowChannelIds.includes(operatorChannelId)) {
    return "channel is not in the Discord operator allowlist"
  }

  return null
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
