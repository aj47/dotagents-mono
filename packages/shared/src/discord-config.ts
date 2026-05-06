export const DISCORD_SECRET_MASK = "••••••••"
export const DEFAULT_DISCORD_ENABLED = false
export const DEFAULT_DISCORD_DM_ENABLED = true
export const DEFAULT_DISCORD_REQUIRE_MENTION = true
export const DEFAULT_DISCORD_LOG_MESSAGES = false

export type DiscordConfigSource = "config" | "env"
export type DiscordLifecycleAction = "noop" | "start" | "stop" | "restart"
export type DiscordConversationEpochs = Record<string, number>

export interface DiscordIntegrationSettingsConfig {
  discordEnabled?: boolean
  discordBotToken?: string
  discordDmEnabled?: boolean
  discordRequireMention?: boolean
  discordAllowUserIds?: string[]
  discordAllowGuildIds?: string[]
  discordAllowChannelIds?: string[]
  discordAllowRoleIds?: string[]
  discordDmAllowUserIds?: string[]
  discordOperatorAllowUserIds?: string[]
  discordOperatorAllowGuildIds?: string[]
  discordOperatorAllowChannelIds?: string[]
  discordOperatorAllowRoleIds?: string[]
  discordDefaultProfileId?: string
  discordLogMessages?: boolean
}

export interface DiscordIntegrationRuntimeStateConfig {
  discordConversationEpochs?: DiscordConversationEpochs
}

export interface DiscordIntegrationConfig extends DiscordIntegrationSettingsConfig, DiscordIntegrationRuntimeStateConfig {}

export interface DiscordEnvironmentLike {
  [key: string]: string | undefined | null
  DOTAGENTS_DISCORD_BOT_TOKEN?: string | null
  DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID?: string | null
}

export interface DiscordTokenConfigLike {
  discordBotToken?: string | null
}

export interface DiscordDefaultProfileConfigLike {
  discordDefaultProfileId?: string | null
}

export interface DiscordLifecycleConfigLike extends DiscordTokenConfigLike {
  discordEnabled?: boolean | null
}

function trimValue(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getDiscordResolvedToken(
  config: DiscordTokenConfigLike,
  env: DiscordEnvironmentLike = {},
): { token?: string; source?: DiscordConfigSource } {
  const configToken = trimValue(config.discordBotToken)
  if (configToken) {
    return { token: configToken, source: "config" }
  }

  const envToken = trimValue(env.DOTAGENTS_DISCORD_BOT_TOKEN)
  if (envToken) {
    return { token: envToken, source: "env" }
  }

  return {}
}

export function getDiscordResolvedDefaultProfileId(
  config: DiscordDefaultProfileConfigLike,
  env: DiscordEnvironmentLike = {},
): { profileId?: string; source?: DiscordConfigSource } {
  const configProfileId = trimValue(config.discordDefaultProfileId)
  if (configProfileId) {
    return { profileId: configProfileId, source: "config" }
  }

  const envProfileId = trimValue(env.DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID)
  if (envProfileId) {
    return { profileId: envProfileId, source: "env" }
  }

  return {}
}

export function getMaskedDiscordBotToken(
  config: DiscordTokenConfigLike,
  env: DiscordEnvironmentLike = {},
): string {
  return getDiscordResolvedToken(config, env).token ? DISCORD_SECRET_MASK : ""
}

export function getDiscordLifecycleAction(
  prev: DiscordLifecycleConfigLike,
  next: DiscordLifecycleConfigLike,
  env: DiscordEnvironmentLike = {},
): DiscordLifecycleAction {
  const prevEnabled = !!prev.discordEnabled
  const nextEnabled = !!next.discordEnabled

  const prevToken = getDiscordResolvedToken(prev, env).token
  const nextToken = getDiscordResolvedToken(next, env).token

  if (nextEnabled && !nextToken && prevToken) {
    return "stop"
  }

  if (!prevEnabled && nextEnabled) {
    return "start"
  }

  if (prevEnabled && !nextEnabled) {
    return "stop"
  }

  if (prevEnabled && nextEnabled && prevToken !== nextToken) {
    return "restart"
  }

  return "noop"
}
