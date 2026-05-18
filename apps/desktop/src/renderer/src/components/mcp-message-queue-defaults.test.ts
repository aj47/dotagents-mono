import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const SOURCES = [
  ["overlay follow-up input", "./overlay-follow-up-input.tsx"],
  ["tile follow-up input", "./tile-follow-up-input.tsx"],
  ["agent progress", "./agent-progress.tsx"],
] as const
const sessionPresentationSource = readFileSync(
  new URL("../../../../../../packages/shared/src/session-presentation.ts", import.meta.url),
  "utf8",
)

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8")
}

describe("MCP message queue renderer defaults", () => {
  it("routes the queue default through session presentation", () => {
    expect(sessionPresentationSource).toContain("DEFAULT_MCP_MESSAGE_QUEUE_ENABLED")
    expect(sessionPresentationSource).toContain("export function resolveChatRuntimeMessageQueueEnabled")
    expect(sessionPresentationSource).toContain(
      "return config?.messageQueueEnabled ?? config?.mcpMessageQueueEnabled ?? DEFAULT_MCP_MESSAGE_QUEUE_ENABLED",
    )
  })

  it.each(SOURCES)("uses the shared chat runtime queue resolver in %s", (_label, relativePath) => {
    const source = readSource(relativePath)

    expect(source).not.toContain("DEFAULT_MCP_MESSAGE_QUEUE_ENABLED")
    expect(source).toContain("resolveChatRuntimeMessageQueueEnabled")
    expect(source).toContain(
      "const isQueueEnabled = resolveChatRuntimeMessageQueueEnabled(configQuery.data)",
    )
  })
})
