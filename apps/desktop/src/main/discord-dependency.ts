import { createRequire } from "module"
import path from "path"

const discordRequire = createRequire(import.meta.url)
const DISCORD_PACKAGE = "discord.js"

export const DISCORD_UNAVAILABLE_ERROR =
  "Discord support needs discord.js. Install Discord support from Settings, then connect again."

export type DiscordDependencyStatus = {
  available: boolean
  error?: string
}

export function getDiscordRuntimeDependencyPath(): string {
  const electron = discordRequire("electron") as typeof import("electron")
  return path.join(electron.app.getPath("userData"), "discord-runtime")
}

function getDiscordRuntimeRequire() {
  return createRequire(path.join(getDiscordRuntimeDependencyPath(), "package.json"))
}

function resolveDiscordDependencyFromRuntime(): string {
  return getDiscordRuntimeRequire().resolve(DISCORD_PACKAGE)
}

export function resolveDiscordDependency(): string {
  try {
    return discordRequire.resolve(DISCORD_PACKAGE)
  } catch (error) {
    if (!isDiscordDependencyMissingError(error)) throw error
  }

  return resolveDiscordDependencyFromRuntime()
}

export function requireDiscordDependency(): typeof import("discord.js") {
  try {
    return discordRequire(DISCORD_PACKAGE) as typeof import("discord.js")
  } catch (error) {
    if (!isDiscordDependencyMissingError(error)) throw error
  }

  return getDiscordRuntimeRequire()(DISCORD_PACKAGE) as typeof import("discord.js")
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
  resolveDependency: (specifier: string) => string = () => resolveDiscordDependency(),
): DiscordDependencyStatus {
  try {
    resolveDependency(DISCORD_PACKAGE)
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
