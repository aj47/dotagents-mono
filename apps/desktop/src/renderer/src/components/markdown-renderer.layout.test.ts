import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const markdownRendererSource = readFileSync(new URL("./markdown-renderer.tsx", import.meta.url), "utf8")

describe("markdown renderer layout", () => {
  it("keeps long links, inline code, and fenced code blocks readable in narrow tiles", () => {
    expect(markdownRendererSource).toContain(
      'className="break-words text-primary underline underline-offset-2 hover:text-primary/80 [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).toContain(
      'className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).toContain(
      'className="group/codeblock relative mb-3 max-w-full overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-3 dark:border-white/10 dark:bg-white/5"'
    )
  })

  it("uses compact prose spacing for assistant markdown and think sections", () => {
    expect(markdownRendererSource).toContain("prose-p:my-1")
    expect(markdownRendererSource).toContain("prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2")
    expect(markdownRendererSource).toContain('className="my-1 leading-normal text-foreground"')
  })

  it("reuses the overflow-safe markdown chrome for think sections and table content", () => {
    expect(markdownRendererSource).toContain("components={sharedMarkdownComponents}")
    expect(markdownRendererSource).toContain(
      'className="mb-3 max-w-full overflow-x-auto rounded-lg border border-border/80"'
    )
    expect(markdownRendererSource).toContain(
      'className="w-max min-w-full border-collapse text-sm"'
    )
    expect(markdownRendererSource).toContain(
      'className="border-b border-r border-border px-3 py-2 align-top last:border-r-0 [overflow-wrap:anywhere]"'
    )
  })

  it("marks rendered markdown as selectable so response text and code can be copied", () => {
    expect(markdownRendererSource).toContain(
      'const SELECTABLE_MARKDOWN_CLASS_NAME = "markdown-selectable"'
    )
    expect(markdownRendererSource).toContain(
      'className={SELECTABLE_MARKDOWN_CLASS_NAME}'
    )
    expect(markdownRendererSource).toContain("SELECTABLE_MARKDOWN_CLASS_NAME")
  })

  it("keeps the image lightbox zoomable and pannable", () => {
    expect(markdownRendererSource).toContain('aria-label="Zoom in image preview"')
    expect(markdownRendererSource).toContain('aria-label="Zoom out image preview"')
    expect(markdownRendererSource).toContain('aria-label="Reset image preview zoom"')
    expect(markdownRendererSource).toContain("onWheel={handleLightboxWheel}")
    expect(markdownRendererSource).toContain("onPointerDown={handleLightboxPointerDown}")
    expect(markdownRendererSource).toContain(
      "translate3d(${zoom.offsetX}px, ${zoom.offsetY}px, 0) scale(${zoom.scale})"
    )
  })

  it("exposes a download action in the image lightbox controls", () => {
    expect(markdownRendererSource).toContain('aria-label="Download image"')
    expect(markdownRendererSource).toContain('title="Download image"')
    expect(markdownRendererSource).toContain("handleDownload")
    expect(markdownRendererSource).toContain("deriveImageDownloadFileName")
    expect(markdownRendererSource).toContain('link.download = fileName')
  })
})
