import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const overlayFollowUpInputSource = readFileSync(
  new URL("./overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const sessionPresentationSource = readFileSync(
  new URL("../../../../../../packages/shared/src/session-presentation.ts", import.meta.url),
  "utf8",
)

describe("overlay follow-up input layout", () => {
  it("wraps composer controls safely for narrow panel widths", () => {
    expect(overlayFollowUpInputSource).toContain(
      "const desktopComposerSurface = getChatComposerDesktopSurfaceState().followUp",
    )
    expect(overlayFollowUpInputSource).toContain(
      "className={desktopComposerSurface.overlayInputRowClassName}",
    )
    expect(overlayFollowUpInputSource).toContain(
      "className={desktopComposerSurface.overlayInputWrapperClassName}",
    )
    expect(overlayFollowUpInputSource).toContain(
      "className={desktopComposerSurface.textInputClassName}",
    )
    expect(overlayFollowUpInputSource).toContain(
      "className={desktopComposerSurface.overlayActionsClassName}",
    )
    expect(sessionPresentationSource).toContain(
      'overlayInputRowClassName: "flex w-full flex-wrap items-center gap-2"',
    )
    expect(sessionPresentationSource).toContain(
      'overlayInputWrapperClassName: "relative min-w-0 flex-[1_1_10rem]"',
    )
    expect(sessionPresentationSource).toContain(
      'textInputClassName: "w-full text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 focus:ring-0"',
    )
    expect(sessionPresentationSource).toContain(
      'overlayActionsClassName: "ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-2"',
    )
  })

  it("keeps long agent names truncatable in the compact overlay header", () => {
    expect(overlayFollowUpInputSource).toContain(
      "className={desktopComposerSurface.agentIndicatorClassName}",
    )
    expect(overlayFollowUpInputSource).toContain(
      "className={desktopComposerSurface.agentNameClassName} title={`Agent: ${agentName}`}",
    )
    expect(sessionPresentationSource).toContain(
      'agentIndicatorClassName: "flex min-w-0 items-center gap-1 text-[10px] text-primary/70"',
    )
    expect(sessionPresentationSource).toContain(
      'agentNameClassName: "min-w-0 truncate"',
    )
  })
})
