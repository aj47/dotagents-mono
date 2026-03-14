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

export function getDiscordConversationId(input: {
  channelId: string
  guildId?: string | null
  threadId?: string | null
  isDirectMessage: boolean
}): string {
  if (input.isDirectMessage) {
    return `discord_dm_${input.channelId}`
  }

  const base = `discord_g${input.guildId || "unknown"}_c${input.channelId}`
  return input.threadId ? `${base}_t${input.threadId}` : base
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
    // DM user allowlist — when set, only these users can DM the bot
    if (dmAllowUserIds.length > 0 && !dmAllowUserIds.includes(input.authorId)) {
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