import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getDiscordServiceSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "discord-service.ts"), "utf8")
}

describe("discord service defaults", () => {
  it("uses shared Discord integration defaults for gates, logs, and status", () => {
    const source = getDiscordServiceSource()

    expect(source).toContain("cfg.discordEnabled ?? DEFAULT_DISCORD_ENABLED")
    expect(source).toContain("configStore.get().discordEnabled ?? DEFAULT_DISCORD_ENABLED")
    expect(source).toContain("!(cfg.discordEnabled ?? DEFAULT_DISCORD_ENABLED)")
    expect(source).toContain("cfg.discordRequireMention ?? DEFAULT_DISCORD_REQUIRE_MENTION")
    expect(source).toContain("cfg.discordDmEnabled ?? DEFAULT_DISCORD_DM_ENABLED")
    expect(source).toContain("cfg.discordLogMessages ?? DEFAULT_DISCORD_LOG_MESSAGES")
  })
})
