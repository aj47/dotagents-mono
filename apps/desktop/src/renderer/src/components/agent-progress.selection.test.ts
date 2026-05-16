import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(
  new URL("./agent-progress.tsx", import.meta.url),
  "utf8",
)
const markdownRendererSource = readFileSync(
  new URL("./markdown-renderer.tsx", import.meta.url),
  "utf8",
)
const tailwindSource = readFileSync(
  new URL("../css/tailwind.css", import.meta.url),
  "utf8",
)

describe("agent progress text selection", () => {
  it("restores selectable response text despite the global select-none baseline", () => {
    expect(tailwindSource).toContain(".markdown-selectable")
    expect(tailwindSource).toContain("user-select: text")
    expect(agentProgressSource).toContain(
      "function hasActiveTextSelection(container?: HTMLElement | null): boolean {",
    )
    expect(agentProgressSource).toContain(
      "hasActiveTextSelection(event.currentTarget)",
    )
    expect(agentProgressSource).toContain(
      "desktopChatMessageSurface.markdownClassName",
    )
    expect(agentProgressSource).toContain("normalizeMarkdownThoughtContent")
    expect(agentProgressSource).toContain('from "@dotagents/shared/session-presentation"')
    expect(agentProgressSource).not.toContain('from "@dotagents/shared/markdown-render-parts"')
    expect(agentProgressSource).toContain(
      "<MarkdownRenderer content={effectiveContent.trim()} collapsed={messageContentRenderState.isCollapsed} />",
    )
    expect(markdownRendererSource).toContain(
      "const SELECTABLE_MARKDOWN_CLASS_NAME = markdownContentSurface.selectableClassName",
    )
    expect(markdownRendererSource).toContain(
      "className={SELECTABLE_MARKDOWN_CLASS_NAME}",
    )
  })
})
