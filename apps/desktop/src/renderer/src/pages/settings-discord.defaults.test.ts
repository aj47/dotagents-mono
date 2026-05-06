import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsDiscordSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-discord.tsx"), "utf8")
}

describe("settings discord defaults", () => {
  it("uses shared Discord integration defaults", () => {
    const source = getSettingsDiscordSource()

    expect(source).toContain("DEFAULT_DISCORD_DM_ENABLED")
    expect(source).toContain("DEFAULT_DISCORD_REQUIRE_MENTION")
    expect(source).toContain("DEFAULT_DISCORD_LOG_MESSAGES")
  })
})
