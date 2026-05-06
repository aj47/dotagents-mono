import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const SOURCES = [
  ["overlay follow-up input", "./overlay-follow-up-input.tsx"],
  ["tile follow-up input", "./tile-follow-up-input.tsx"],
  ["agent progress", "./agent-progress.tsx"],
] as const

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

describe("MCP message queue renderer defaults", () => {
  it.each(SOURCES)("uses the shared queue default in %s", (_label, relativePath) => {
    const source = readSource(relativePath)

    expect(source).toContain("DEFAULT_MCP_MESSAGE_QUEUE_ENABLED")
    expect(source).toContain(
      "configQuery.data?.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED",
    )
  })
})
