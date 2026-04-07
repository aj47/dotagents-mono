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
  env: NodeJS.ProcessEnv = process.env,
): DiscordLifecycleAction {
  const prevEnabled = !!prev.discordEnabled
  const nextEnabled = !!next.discordEnabled

  // Resolve effective tokens through `getDiscordResolvedToken` so the
  // env-var fallback (`DOTAGENTS_DISCORD_BOT_TOKEN`) is honored. Without
  // this, clearing `discordBotToken` in config while the env var is still
  // set would falsely look like a token removal and trigger an unnecessary
  // stop, leaving the bot disconnected even though a valid token is still
  // available via the env. Headless installs and CI flows that ship the
  // token via env are the primary beneficiaries.
  const prevToken = getDiscordResolvedToken(prev, env).token
  const nextToken = getDiscordResolvedToken(next, env).token

  // Treat clearing the token (across both config and env) as an implicit
  // stop. Returning "restart" here would trigger a stop+start where
  // start() then immediately fails with "Discord bot token is required"
  // while the integration stays enabled, leaving the UI in a confusing
  // half-broken state during token rotation or removal flows. The bot
  // remains `discordEnabled=true` (the user's explicit setting) but is no
  // longer running until a new token is saved.
  if (nextEnabled && !nextToken && prevToken) {
    return "stop"
  }

  if (!prevEnabled && nextEnabled) {
    return "start"
  }

  if (prevEnabled && !nextEnabled) {
    return "stop"
  }

  if (prevEnabled && nextEnabled) {
    if (prevToken !== nextToken) {
      return "restart"
    }
  }

  return "noop"
}