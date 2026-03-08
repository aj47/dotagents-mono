import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")

describe("desktop tool approval failure feedback", () => {
  it("shows visible approval failure feedback in AgentProgress", () => {
    expect(agentProgressSource).toContain('import { toast } from "sonner"')
    expect(agentProgressSource).toContain(
      'function getActionErrorMessage(error: unknown, fallback: string): string',
    )
    expect(agentProgressSource).toContain("if (!result.success)")
    expect(agentProgressSource).toContain('throw new Error("This tool approval is no longer pending.")')
    expect(agentProgressSource).toContain(
      'console.error("[Tool Approval UI] Failed to approve tool call:", error)',
    )
    expect(agentProgressSource).toContain(
      '`Failed to approve tool call. ${getActionErrorMessage(error, "Please try again.")}`',
    )
    expect(agentProgressSource).toContain(
      'console.error("[Tool Approval UI] Failed to deny tool call:", error)',
    )
    expect(agentProgressSource).toContain(
      '`Failed to deny tool call. ${getActionErrorMessage(error, "Please try again.")}`',
    )
  })

  it("shows the same visible approval failure feedback in SessionTile", () => {
    expect(sessionTileSource).toContain('import { toast } from "sonner"')
    expect(sessionTileSource).toContain(
      'function getActionErrorMessage(error: unknown, fallback: string): string',
    )
    expect(sessionTileSource).toContain("if (!result.success)")
    expect(sessionTileSource).toContain('throw new Error("This tool approval is no longer pending.")')
    expect(sessionTileSource).toContain('console.error("Failed to approve tool call:", error)')
    expect(sessionTileSource).toContain(
      '`Failed to approve tool call. ${getActionErrorMessage(error, "Please try again.")}`',
    )
    expect(sessionTileSource).toContain('console.error("Failed to deny tool call:", error)')
    expect(sessionTileSource).toContain(
      '`Failed to deny tool call. ${getActionErrorMessage(error, "Please try again.")}`',
    )
  })
})