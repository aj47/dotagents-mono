import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tileFollowUpInputSource = readFileSync(
  new URL("./tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)

describe("tile follow-up input layout", () => {
  it("wraps composer controls safely for narrow session tiles", () => {
    expect(tileFollowUpInputSource).toContain(
      'cn("flex w-full flex-wrap items-center", preferCompact ? "gap-1" : "gap-1.5")',
    )
    expect(tileFollowUpInputSource).toContain(
      '"min-w-0 flex-[1_1_7rem] text-sm bg-transparent border-0 outline-none"',
    )
    expect(tileFollowUpInputSource).toContain(
      'preferCompact ? "w-full justify-end gap-1" : "ml-auto shrink-0 gap-1.5"',
    )
  })

  it("supports compact compare-tile mode without letting the footer controls overflow", () => {
    expect(tileFollowUpInputSource).toContain("preferCompact?: boolean")
    expect(tileFollowUpInputSource).toContain("onRequestFocus?: () => void")
    expect(tileFollowUpInputSource).toContain("const COMPACT_TILE_INPUT_WIDTH = 240")
    expect(tileFollowUpInputSource).toContain("const shouldUseCompactLayout = preferCompact || isNarrow")
    expect(tileFollowUpInputSource).toContain('setIsNarrow(width < COMPACT_TILE_INPUT_WIDTH)')
    expect(tileFollowUpInputSource).toContain(
      'shouldUseCompactLayout\n              ? "min-w-0 flex-[1_1_100%] text-sm bg-transparent border-0 outline-none"',
    )
    expect(tileFollowUpInputSource).toContain('onMouseDown={handleInputInteraction}')
    expect(tileFollowUpInputSource).toContain('onFocusCapture={handleInputInteraction}')
  })

  it("keeps long agent names truncatable in the compact tile header", () => {
    expect(tileFollowUpInputSource).toContain(
      'className="flex min-w-0 items-center gap-1 text-[10px] text-primary/70"',
    )
    expect(tileFollowUpInputSource).toContain(
      'className="min-w-0 truncate" title={`Agent: ${agentName}`}',
    )
  })
})