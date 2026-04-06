import { createRequire } from "module"

const discordRequire = createRequire(import.meta.url)

export const DISCORD_UNAVAILABLE_ERROR =
  "Discord support is unavailable because the optional discord.js package is not installed in this build."

export type DiscordDependencyStatus = {
  available: boolean
  error?: string
}

export function isDiscordDependencyMissingError(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code)
    : ""
  const message = error instanceof Error ? error.message : String(error)

  return code === "MODULE_NOT_FOUND"
    || code === "ERR_MODULE_NOT_FOUND"
    || message.includes("Cannot find package 'discord.js'")
    || message.includes("Cannot find module 'discord.js'")
}

export function getDiscordDependencyStatus(
  resolveDependency: (specifier: string) => string = discordRequire.resolve,
): DiscordDependencyStatus {
  try {
    resolveDependency("discord.js")
    return { available: true }
  } catch (error) {
    if (isDiscordDependencyMissingError(error)) {
      return {
        available: false,
        error: DISCORD_UNAVAILABLE_ERROR,
      }
    }

    return {
      available: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
