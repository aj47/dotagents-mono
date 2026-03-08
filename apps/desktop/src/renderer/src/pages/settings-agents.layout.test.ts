import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsAgentsSource = readFileSync(new URL("./settings-agents.tsx", import.meta.url), "utf8")

describe("settings agents layout", () => {
  it("wraps the advanced system prompt warning row so caution text stays readable beside reset actions", () => {
    expect(settingsAgentsSource).toContain('className="flex flex-wrap items-start justify-between gap-2"')
    expect(settingsAgentsSource).toContain('className="min-w-0 flex-1 text-xs leading-relaxed text-amber-600 dark:text-amber-500"')
    expect(settingsAgentsSource).toContain('className="h-6 shrink-0 self-start px-2 text-xs"')
  })
})