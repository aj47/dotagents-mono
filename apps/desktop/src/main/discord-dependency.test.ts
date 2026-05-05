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

  it("does not import remote server lifecycle just to run an agent reply", () => {
    expect(discordServiceSource).toContain('import { runAgent } from "./remote-agent-runner"')
    expect(discordServiceSource).not.toContain('import { runAgent } from "./remote-server"')
  })

  it("awaits in-flight startPromise in stop() to close the enable→disable race", () => {
    // Regression guard for the race described in PR #305 review:
    // startInternal() assigns `this.client` only after `client.login()`
    // resolves, so if stop() doesn't wait for a pending startPromise, a
    // quick enable→disable (or token rotation → restart) can leave the
    // bot connected with stale settings because stop() runs before
    // `this.client` is assigned, then login completes and assigns it
    // behind stop()'s back.
    //
    // We pin the guard via source-text inspection because DiscordService
    // is a singleton tightly coupled to main-process services (configStore,
    // remote-server, agent-profile-service, …), which makes a proper
    // behavioral test cost far more than the invariant is worth here.
    const stopMatch = discordServiceSource.match(/async stop\([\s\S]*?^  \}/m)
    expect(stopMatch, "expected to find stop() body").not.toBeNull()
    const stopBody = stopMatch?.[0] ?? ""
    expect(stopBody).toContain("if (this.startPromise)")
    expect(stopBody).toContain("await this.startPromise")
    // The await must happen before we touch this.client so that by the
    // time we read/destroy `this.client`, startInternal() has either
    // fully completed (client set, destroy cleans up) or fully failed
    // (nothing to tear down).
    const startPromiseIdx = stopBody.indexOf("await this.startPromise")
    const clientDestroyIdx = stopBody.indexOf("this.client.destroy()")
    expect(startPromiseIdx).toBeGreaterThan(-1)
    expect(clientDestroyIdx).toBeGreaterThan(-1)
    expect(startPromiseIdx).toBeLessThan(clientDestroyIdx)
  })
})
