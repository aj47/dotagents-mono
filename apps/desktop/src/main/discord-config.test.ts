import { describe, expect, it } from "vitest"
import {
  DISCORD_SECRET_MASK,
  getDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId,
  getDiscordResolvedToken,
  getMaskedDiscordBotToken,
} from "./discord-config"

describe("discord config helpers", () => {
  it("resolves token and default profile from config first, then environment", () => {
    expect(getDiscordResolvedToken({ discordBotToken: "cfg-token" })).toEqual({ token: "cfg-token", source: "config" })
    expect(getDiscordResolvedToken({ discordBotToken: "" }, { DOTAGENTS_DISCORD_BOT_TOKEN: "env-token" } as unknown as NodeJS.ProcessEnv)).toEqual({ token: "env-token", source: "env" })

    expect(getDiscordResolvedDefaultProfileId({ discordDefaultProfileId: "profile-1" })).toEqual({ profileId: "profile-1", source: "config" })
    expect(getDiscordResolvedDefaultProfileId({ discordDefaultProfileId: "" }, { DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID: "env-profile" } as unknown as NodeJS.ProcessEnv)).toEqual({ profileId: "env-profile", source: "env" })
  })

  it("masks any configured Discord token without exposing the raw value", () => {
    expect(getMaskedDiscordBotToken({ discordBotToken: "cfg-token" })).toBe(DISCORD_SECRET_MASK)
    expect(getMaskedDiscordBotToken({ discordBotToken: "" }, { DOTAGENTS_DISCORD_BOT_TOKEN: "env-token" } as unknown as NodeJS.ProcessEnv)).toBe(DISCORD_SECRET_MASK)
    expect(getMaskedDiscordBotToken({ discordBotToken: "" }, {} as unknown as NodeJS.ProcessEnv)).toBe("")
  })

  it("computes the correct Discord lifecycle action for config changes", () => {
    expect(getDiscordLifecycleAction({ discordEnabled: false, discordBotToken: "" }, { discordEnabled: true, discordBotToken: "token" })).toBe("start")
    expect(getDiscordLifecycleAction({ discordEnabled: true, discordBotToken: "old" }, { discordEnabled: true, discordBotToken: "new" })).toBe("restart")
    expect(getDiscordLifecycleAction({ discordEnabled: true, discordBotToken: "token" }, { discordEnabled: false, discordBotToken: "token" })).toBe("stop")
    expect(getDiscordLifecycleAction({ discordEnabled: true, discordBotToken: "token" }, { discordEnabled: true, discordBotToken: "token" })).toBe("noop")
  })

  it("treats clearing the bot token while enabled as an implicit stop", () => {
    // Clearing the token should not trigger restart (which would fail with
    // "Discord bot token is required" while leaving discordEnabled=true).
    // Instead it should stop the bot cleanly.
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "token" },
        { discordEnabled: true, discordBotToken: "" },
      ),
    ).toBe("stop")
    // Whitespace-only also counts as cleared.
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "token" },
        { discordEnabled: true, discordBotToken: "   " },
      ),
    ).toBe("stop")
    // Both empty stays noop (no previous token to stop).
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "" },
        { discordEnabled: true, discordBotToken: "" },
      ),
    ).toBe("noop")
  })
})