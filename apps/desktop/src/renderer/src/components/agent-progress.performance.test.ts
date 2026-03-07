import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const sessionsPageSource = readFileSync(new URL("../pages/sessions.tsx", import.meta.url), "utf8")

describe("agent progress streaming performance guardrails", () => {
  it("does not subscribe every tile to the full progress map for close-button state", () => {
    expect(agentProgressSource).toContain("const agentProgressById = useAgentStore.getState().agentProgressById")
    expect(agentProgressSource).not.toContain("const agentProgressById = useAgentStore((s) => s.agentProgressById)")
  })

  it("limits non-focused tile transcripts to a recent preview during session-grid rendering", () => {
    expect(agentProgressSource).toContain("const TILE_TRANSCRIPT_PREVIEW_ITEMS = 6")
    expect(agentProgressSource).toContain("const shouldLimitTileTranscript = !isFocused && !isExpanded")
    expect(agentProgressSource).toContain("Showing latest {tileDisplayItems.length} of {displayItems.length} updates")
  })

  it("memoizes session tiles so unrelated streamed chunks do not re-render the full grid", () => {
    expect(sessionsPageSource).toContain("const SessionProgressTile = React.memo(function SessionProgressTile")
    expect(sessionsPageSource).toContain("<SessionProgressTile")
    expect(sessionsPageSource).toContain("const handleFocusSession = useCallback(async (sessionId: string) =>")
    expect(sessionsPageSource).toContain("const handleDismissSession = useCallback(async (sessionId: string) =>")
  })
})