import type { Config } from "@shared/types"

export const DISCORD_SECRET_MASK = "••••••••"

export type DiscordConfigSource = "config" | "env"
export type DiscordLifecycleAction = "noop" | "start" | "stop" | "restart"

function trimValue(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getDiscordResolvedToken(
  config: Pick<Config, "discordBotToken">,
  env: NodeJS.ProcessEnv = process.env,
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
  config: Pick<Config, "discordDefaultProfileId">,
  env: NodeJS.ProcessEnv = process.env,
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
  config: Pick<Config, "discordBotToken">,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return getDiscordResolvedToken(config, env).token ? DISCORD_SECRET_MASK : ""
}

export function getDiscordLifecycleAction(
  prev: Pick<Config, "discordEnabled" | "discordBotToken">,
  next: Pick<Config, "discordEnabled" | "discordBotToken">,
): DiscordLifecycleAction {
  const prevEnabled = !!prev.discordEnabled
  const nextEnabled = !!next.discordEnabled

  if (!prevEnabled && nextEnabled) {
    return "start"
  }

  if (prevEnabled && !nextEnabled) {
    return "stop"
  }

  if (prevEnabled && nextEnabled) {
    const prevToken = trimValue(prev.discordBotToken)
    const nextToken = trimValue(next.discordBotToken)
    if (prevToken !== nextToken) {
      return "restart"
    }
  }

  return "noop"
}