import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getHeadlessCliSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "headless-cli.ts"), "utf8")
}

describe("headless CLI Discord commands", () => {
  it("documents and handles Discord configuration commands", () => {
    const source = getHeadlessCliSource()

    expect(source).toContain("/profiles")
    expect(source).toContain("/discord status")
    expect(source).toContain("/discord enable")
    expect(source).toContain("/discord disable")
    expect(source).toContain("/discord token <token>")
    expect(source).toContain("/discord profile <id|clear>")
    expect(source).toContain("/discord logs [count]")
    expect(source).toContain("await handleDiscordCommand")
    expect(source).toContain("await saveDiscordConfig({ discordEnabled: true }")
    expect(source).toContain("await saveDiscordConfig({ discordDefaultProfileId: profile.id }")
  })
})