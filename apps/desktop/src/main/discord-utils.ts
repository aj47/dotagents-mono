export interface DiscordMessageGateInput {
  authorId: string
  channelId: string
  guildId?: string | null
  isDirectMessage: boolean
  mentioned: boolean
  requireMention: boolean
  dmEnabled: boolean
  allowUserIds?: string[]
  allowGuildIds?: string[]
  allowChannelIds?: string[]
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

  if (input.isDirectMessage) {
    if (!input.dmEnabled) {
      return "direct messages are disabled"
    }
  } else {
    if (input.requireMention && !input.mentioned) {
      return "bot mention required"
    }
    if (allowGuildIds.length > 0 && (!input.guildId || !allowGuildIds.includes(input.guildId))) {
      return "guild not allowlisted"
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