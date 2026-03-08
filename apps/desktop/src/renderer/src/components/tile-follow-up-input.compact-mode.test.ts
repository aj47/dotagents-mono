import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tileFollowUpInputSource = readFileSync(
  new URL("./tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const compactTileFollowUpInputSource = tileFollowUpInputSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactTileFollowUpInputSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("tile follow-up input compact mode", () => {
  it("collapses non-focused tile composers into a lighter one-line affordance until the user engages it", () => {
    expectSourceToContain("preferCompact?: boolean")
    expectSourceToContain(
      'const [isCompactExpanded, setIsCompactExpanded] = useState(!preferCompact)',
    )
    expectSourceToContain("const showCompactComposer =")
    expectSourceToContain(
      'preferCompact &&',
    )
    expectSourceToContain(
      '"flex items-center gap-1.5 border-t bg-muted/10 px-2 py-1.5"',
    )
    expectSourceToContain('return "Queue follow-up…"')
    expectSourceToContain('return "Continue in tile…"')
    expectSourceToContain("window.requestAnimationFrame(() => {")
    expectSourceToContain("inputRef.current?.focus()")
  })

  it("treats compact-composer engagement as a tile-focus action and re-collapses empty composers when the tile returns to compact mode", () => {
    expectSourceToContain("onRequestFocus?: () => void")
    expectSourceToContain("onRequestFocus,")
    expectSourceToContain("const requestTileFocus = () => {")
    expectSourceToContain("onRequestFocus?.()")
    expectSourceToContain("useEffect(() => {")
    expectSourceToContain("if (!preferCompact || hasMessageContent || isInitializingSession || isSubmitting || sendMutation.isPending) {")
    expectSourceToContain("setIsCompactExpanded(false)")
    expectSourceToContain("requestTileFocus()")
    expectSourceToContain("onFocusCapture={requestTileFocus}")
  })

  it("collapses compact draft composers back into a lighter preview row when the user leaves the tile, without discarding the draft", () => {
    expectSourceToContain("const COMPACT_DRAFT_PREVIEW_LIMIT = 48")
    expectSourceToContain("function getCompactDraftPreview(text: string): string {")
    expectSourceToContain("const compactComposerSummaryLabel = compactDraftPreview")
    expectSourceToContain('`Draft: ${compactDraftPreview}`')
    expectSourceToContain('`Draft with ${compactAttachmentLabel}`')
    expectSourceToContain("const activeElement = document.activeElement")
    expectSourceToContain("if (activeElement && formRef.current?.contains(activeElement)) {")
    expectSourceToContain("const handleCompactComposerBlur = (e: React.FocusEvent<HTMLFormElement>) => {")
    expectSourceToContain("const nextFocusedElement = e.relatedTarget as Node | null")
    expectSourceToContain("onBlur={handleCompactComposerBlur}")
    expectSourceToContain("title={compactComposerTitle}")
  })
})