import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const overlayFollowUpInputSource = readFileSync(
  new URL("./overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)

describe("overlay follow-up input layout", () => {
  it("wraps composer controls safely for narrow panel widths", () => {
    expect(overlayFollowUpInputSource).toContain(
      'className="flex w-full flex-wrap items-center gap-2"',
    )
    expect(overlayFollowUpInputSource).toContain(
      '"min-w-0 flex-[1_1_10rem] text-sm bg-transparent border-0 outline-none"',
    )
    expect(overlayFollowUpInputSource).toContain(
      'className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-2"',
    )
  })

  it("keeps long agent names truncatable in the compact overlay header", () => {
    expect(overlayFollowUpInputSource).toContain(
      'className="flex min-w-0 items-center gap-1 text-[10px] text-primary/70"',
    )
    expect(overlayFollowUpInputSource).toContain(
      'className="min-w-0 truncate" title={`Agent: ${agentName}`}',
    )
  })
})