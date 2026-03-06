import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { scripts?: Record<string, string> }

describe("desktop package scripts", () => {
  it("uses pnpm instead of npm run inside package scripts", () => {
    const scriptEntries = Object.entries(packageJson.scripts ?? {})
    const npmRunPattern = /(^|[;&|()\s])npm run\b/

    for (const [name, command] of scriptEntries) {
      expect(command, `script ${name} should avoid npm run`).not.toMatch(npmRunPattern)
    }
  })
})