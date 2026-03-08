import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tileFollowUpInputSource = readFileSync(new URL("./tile-follow-up-input.tsx", import.meta.url), "utf8")
const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")

describe("tile follow-up input layout", () => {
  it("collapses unfocused grid tiles into a lighter focus-first reply affordance", () => {
    expect(tileFollowUpInputSource).toContain("preferCompact?: boolean")
    expect(tileFollowUpInputSource).toContain("onRequestFocus?: () => void")
    expect(tileFollowUpInputSource).toContain("const TILE_FOLLOW_UP_COMPACT_WIDTH = 360")
    expect(tileFollowUpInputSource).toContain("const shouldUseCompactPrompt = preferCompact && !hasMessageContent")
    expect(tileFollowUpInputSource).toContain("const shouldStackComposerActions = isCompactLayout && !shouldUseCompactPrompt")
    expect(tileFollowUpInputSource).toContain('ref={containerRef}')
    expect(tileFollowUpInputSource).toContain('className="border-t bg-muted/10 px-2 py-1.5"')
    expect(tileFollowUpInputSource).toContain('Focus this session to continue the conversation')
    expect(tileFollowUpInputSource).toContain('Focus this session to view session details')
    expect(tileFollowUpInputSource).toContain('const compactPromptCompactActionLabel = isInitializingSession')
    expect(tileFollowUpInputSource).toContain('? "Open"')
    expect(tileFollowUpInputSource).toContain('? "View"')
    expect(tileFollowUpInputSource).toContain(': "Reply"')
    expect(tileFollowUpInputSource).toContain('Focus to type')
    expect(tileFollowUpInputSource).toContain('Focus to view')
    expect(tileFollowUpInputSource).toContain('{isCompactLayout ? (')
    expect(tileFollowUpInputSource).toContain('rounded-full border border-border/50 bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80')
    expect(tileFollowUpInputSource).toContain('{compactPromptCompactActionLabel}')
    expect(agentProgressSource).toContain('preferCompact={!isFocused && !isExpanded}')
    expect(agentProgressSource).toContain('onRequestFocus={onFocus}')
  })

  it("keeps the full inline composer once the tile is focused or has draft content", () => {
    expect(tileFollowUpInputSource).toContain('"flex flex-col gap-1.5 border-t bg-muted/20 px-2 py-1.5"')
    expect(tileFollowUpInputSource).toContain(
      'className={cn("flex w-full gap-2", shouldStackComposerActions ? "flex-col items-stretch" : "items-center")}'
    )
    expect(tileFollowUpInputSource).toContain(
      'shouldStackComposerActions && "rounded-md border border-border/50 bg-background/70 px-2 py-1"'
    )
    expect(tileFollowUpInputSource).toContain(
      'shouldStackComposerActions && "w-full justify-end border-t border-border/40 pt-1.5"'
    )
    expect(tileFollowUpInputSource).not.toContain('agentName')
    expect(tileFollowUpInputSource).toContain('onClick={(e) => e.stopPropagation()}')
    expect(tileFollowUpInputSource).toContain('const hasMessageContent = text.trim().length > 0 || imageAttachments.length > 0')
  })
})