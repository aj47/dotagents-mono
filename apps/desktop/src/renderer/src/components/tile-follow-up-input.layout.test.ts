import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tileFollowUpInputSource = readFileSync(
  new URL("./tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)

describe("tile follow-up input layout", () => {
  it("wraps composer controls safely for narrow session tiles", () => {
    expect(tileFollowUpInputSource).toContain(
      'className="flex w-full flex-wrap items-center gap-1.5"',
    )
    expect(tileFollowUpInputSource).toContain(
      '"min-w-0 flex-[1_1_7rem] text-sm bg-transparent border-0 outline-none"',
    )
    expect(tileFollowUpInputSource).toContain(
      'className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-1.5"',
    )
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