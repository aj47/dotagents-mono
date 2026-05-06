import type { Config } from "@shared/types"
import {
  getDiscordLifecycleAction as getSharedDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId as getSharedDiscordResolvedDefaultProfileId,
  getDiscordResolvedToken as getSharedDiscordResolvedToken,
  getMaskedDiscordBotToken as getSharedMaskedDiscordBotToken,
  type DiscordEnvironmentLike,
} from "@dotagents/shared/discord-config"

export {
  DEFAULT_DISCORD_ENABLED,
  DEFAULT_DISCORD_DM_ENABLED,
  DEFAULT_DISCORD_LOG_MESSAGES,
  DEFAULT_DISCORD_REQUIRE_MENTION,
  DISCORD_SECRET_MASK,
} from "@dotagents/shared/discord-config"

export type {
  DiscordConfigSource,
  DiscordLifecycleAction,
} from "@dotagents/shared/discord-config"

export function getDiscordResolvedToken(
  config: Pick<Config, "discordBotToken">,
  env: DiscordEnvironmentLike = process.env,
) {
  return getSharedDiscordResolvedToken(config, env)
}

export function getDiscordResolvedDefaultProfileId(
  config: Pick<Config, "discordDefaultProfileId">,
  env: DiscordEnvironmentLike = process.env,
) {
  return getSharedDiscordResolvedDefaultProfileId(config, env)
}

export function getMaskedDiscordBotToken(
  config: Pick<Config, "discordBotToken">,
  env: DiscordEnvironmentLike = process.env,
): string {
  return getSharedMaskedDiscordBotToken(config, env)
}

export function getDiscordLifecycleAction(
  prev: Pick<Config, "discordEnabled" | "discordBotToken">,
  next: Pick<Config, "discordEnabled" | "discordBotToken">,
  env: DiscordEnvironmentLike = process.env,
) {
  return getSharedDiscordLifecycleAction(prev, next, env)
}
