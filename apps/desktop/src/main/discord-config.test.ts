import { describe, expect, it } from "vitest"
import {
  DEFAULT_DISCORD_DM_ENABLED,
  DEFAULT_DISCORD_LOG_MESSAGES,
  DEFAULT_DISCORD_REQUIRE_MENTION,
  DISCORD_SECRET_MASK,
  getDiscordLifecycleAction,
  getDiscordResolvedDefaultProfileId,
  getDiscordResolvedToken,
  getMaskedDiscordBotToken,
} from "./discord-config"

describe("discord config helpers", () => {
  it("re-exports shared Discord integration defaults", () => {
    expect(DEFAULT_DISCORD_DM_ENABLED).toBe(true)
    expect(DEFAULT_DISCORD_REQUIRE_MENTION).toBe(true)
    expect(DEFAULT_DISCORD_LOG_MESSAGES).toBe(false)
  })

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
    // The default `env` parameter is `process.env`. To prevent these
    // assertions from being affected by an ambient
    // DOTAGENTS_DISCORD_BOT_TOKEN in the developer's shell, all calls in
    // this test pass an empty env explicitly.
    const emptyEnv = {} as unknown as NodeJS.ProcessEnv

    // Clearing the token should not trigger restart (which would fail with
    // "Discord bot token is required" while leaving discordEnabled=true).
    // Instead it should stop the bot cleanly.
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "token" },
        { discordEnabled: true, discordBotToken: "" },
        emptyEnv,
      ),
    ).toBe("stop")
    // Whitespace-only also counts as cleared.
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "token" },
        { discordEnabled: true, discordBotToken: "   " },
        emptyEnv,
      ),
    ).toBe("stop")
    // Both empty stays noop (no previous token to stop).
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "" },
        { discordEnabled: true, discordBotToken: "" },
        emptyEnv,
      ),
    ).toBe("noop")
  })

  it("honors DOTAGENTS_DISCORD_BOT_TOKEN env fallback in lifecycle decisions", () => {
    // The scenario from the PR #305 review: clearing `discordBotToken` in
    // config while a valid env-provided token is still active should NOT
    // trigger a stop, because the resolved token is still valid via env.
    const envWithToken = { DOTAGENTS_DISCORD_BOT_TOKEN: "env-token" } as unknown as NodeJS.ProcessEnv

    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "config-token" },
        { discordEnabled: true, discordBotToken: "" },
        envWithToken,
      ),
    ).toBe("restart") // config-token → env-token, both valid: just restart with the new token

    // Both prev and next resolve to the same env token → noop, even though
    // `discordBotToken` in config differs (one set, one cleared).
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "" },
        { discordEnabled: true, discordBotToken: "" },
        envWithToken,
      ),
    ).toBe("noop")

    // No env, no prev token, but next has a config token → that's the
    // first time the bot has any token at all. Combined with
    // discordEnabled=true on both sides, it's a restart-equivalent
    // (transition from "enabled but no token" to "enabled with token").
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "" },
        { discordEnabled: true, discordBotToken: "config-token" },
        {} as unknown as NodeJS.ProcessEnv,
      ),
    ).toBe("restart")

    // Env token cleared between prev and next while config token also
    // cleared → real stop, because nothing resolves to a valid token.
    expect(
      getDiscordLifecycleAction(
        { discordEnabled: true, discordBotToken: "" },
        { discordEnabled: true, discordBotToken: "" },
        { DOTAGENTS_DISCORD_BOT_TOKEN: "" } as unknown as NodeJS.ProcessEnv,
      ),
    ).toBe("noop")
  })
})
