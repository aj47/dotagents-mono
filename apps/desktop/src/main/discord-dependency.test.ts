import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"
import {
  DISCORD_UNAVAILABLE_ERROR,
  getDiscordDependencyStatus,
  isDiscordDependencyMissingError,
} from "./discord-dependency"

const discordServiceSource = readFileSync(new URL("./discord-service.ts", import.meta.url), "utf8")

describe("discord dependency helpers", () => {
  it("maps missing discord.js errors to an unavailable status", () => {
    const error = Object.assign(
      new Error("Cannot find package 'discord.js' imported from /tmp/index.js"),
      { code: "ERR_MODULE_NOT_FOUND" },
    )

    expect(isDiscordDependencyMissingError(error)).toBe(true)
    expect(getDiscordDependencyStatus(() => {
      throw error
    })).toEqual({
      available: false,
      error: DISCORD_UNAVAILABLE_ERROR,
    })
  })

  it("surfaces unexpected resolver failures", () => {
    const error = new Error("resolver exploded")

    expect(getDiscordDependencyStatus(() => {
      throw error
    })).toEqual({
      available: false,
      error: "resolver exploded",
    })
  })

  it("catches ignored Discord message handler rejections", () => {
    expect(discordServiceSource).toContain("void this.handleMessage(message).catch(")
  })
})
