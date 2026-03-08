import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tileFollowUpInputSource = readFileSync(
  new URL("./tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)

describe("tile follow-up input layout", () => {
  it("honors compact tile mode by wrapping the composer under narrow compare widths", () => {
    expect(tileFollowUpInputSource).toContain("preferCompact?: boolean")
    expect(tileFollowUpInputSource).toContain('className={cn("flex w-full items-center gap-2", preferCompact && "flex-wrap items-start")}')
    expect(tileFollowUpInputSource).toContain('preferCompact ? "min-w-0 flex-[1_1_10rem]" : "flex-1"')
    expect(tileFollowUpInputSource).toContain('className={cn("flex max-w-full shrink-0 items-center", preferCompact ? "w-full flex-wrap justify-end gap-1.5" : "gap-2")}')
  })

  it("requests tile focus before interacting with compact composer controls", () => {
    expect(tileFollowUpInputSource).toContain("onRequestFocus?: () => void")
    expect(tileFollowUpInputSource).toContain("const requestTileFocus = () => {")
    expect(tileFollowUpInputSource).toContain("onClick={requestTileFocus}")
    expect(tileFollowUpInputSource).toContain("onFocus={requestTileFocus}")
    expect(tileFollowUpInputSource).toContain("onMouseDown={handleControlMouseDown}")
  })
})