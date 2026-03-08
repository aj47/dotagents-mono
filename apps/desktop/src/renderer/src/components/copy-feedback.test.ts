import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")

describe("desktop session copy failure feedback", () => {
  it("shows visible clipboard-copy failure feedback in AgentProgress", () => {
    expect(agentProgressSource).toContain('function getCopyErrorMessage(label: string, error: unknown): string')
    expect(agentProgressSource).toContain('const copyLabel = message.role === "user" ? "prompt" : "response"')
    expect(agentProgressSource).toContain('console.error("Failed to copy response:", err)')
    expect(agentProgressSource).toContain('toast.error(getCopyErrorMessage(copyLabel, err))')
  })

  it("shows visible clipboard-copy failure feedback in SessionTile", () => {
    expect(sessionTileSource).toContain('function getCopyErrorMessage(label: string, error: unknown): string')
    expect(sessionTileSource).toContain('console.error("Failed to copy message:", err)')
    expect(sessionTileSource).toContain('toast.error(getCopyErrorMessage("prompt", err))')
  })
})

