import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const markdownRendererSource = readFileSync(new URL("./markdown-renderer.tsx", import.meta.url), "utf8")

describe("markdown renderer layout", () => {
  it("keeps long links, inline code, and fenced code blocks readable in narrow tiles", () => {
    expect(markdownRendererSource).toContain("className={markdownContentSurface.linkClassName}")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.inlineCodeClassName}")
    expect(markdownRendererSource).toContain("getMarkdownCodeBlockCopyDesktopRenderState")
    expect(markdownRendererSource).toContain("const codeBlockCopyRenderState = getMarkdownCodeBlockCopyDesktopRenderState(copied)")
    expect(markdownRendererSource).toContain("const codeBlockCopySurface = codeBlockCopyRenderState.surface")
    expect(markdownRendererSource).toContain("className={codeBlockCopySurface.codeBlockPreClassName}")
    expect(markdownRendererSource).toContain("className={codeBlockCopySurface.codeBlockCopyButtonClassName}")
    expect(markdownRendererSource).toContain("className={codeBlockCopyRenderState.iconClassName}")
    expect(markdownRendererSource).not.toContain(
      'className="break-words text-primary underline underline-offset-2 hover:text-primary/80 [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).not.toContain(
      'className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]"'
    )
    expect(markdownRendererSource).not.toContain('className="h-3.5 w-3.5 text-green-500"')
    expect(markdownRendererSource).not.toContain('className="h-3.5 w-3.5 text-muted-foreground"')
  })

  it("uses compact prose spacing for assistant markdown and think sections", () => {
    expect(markdownRendererSource).toContain("getMarkdownContentDesktopSurfaceState")
    expect(markdownRendererSource).toContain("const markdownContentSurface = getMarkdownContentDesktopSurfaceState()")
    expect(markdownRendererSource).toContain("const COMPACT_PROSE_CLASS_NAME = markdownContentSurface.compactProseClassName")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.paragraphClassName}")
    expect(markdownRendererSource).toContain("markdownContentSurface.heading1CollapsedClassName")
    expect(markdownRendererSource).toContain("markdownContentSurface.heading1ExpandedClassName")
    expect(markdownRendererSource).not.toContain('className="my-1 leading-normal text-foreground"')
    expect(markdownRendererSource).not.toContain("MARKDOWN_CONTENT_SURFACE_PRESENTATION")
  })

  it("reuses the overflow-safe markdown chrome for think sections and table content", () => {
    expect(markdownRendererSource).toContain("components={sharedMarkdownComponents}")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.tableWrapperClassName}")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.tableClassName}")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.tableHeaderCellClassName}")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.tableCellClassName}")
    expect(markdownRendererSource).not.toContain(
      'className="mb-3 max-w-full overflow-x-auto rounded-lg border border-border/80"'
    )
    expect(markdownRendererSource).not.toContain(
      'className="border-b border-r border-border px-3 py-2 align-top last:border-r-0 [overflow-wrap:anywhere]"'
    )
  })

  it("uses shared think-section presentation for desktop markdown chrome", () => {
    expect(markdownRendererSource).toContain("getMarkdownThinkSectionDesktopSurfaceState")
    expect(markdownRendererSource).toContain("getMarkdownThinkSectionControlState")
    expect(markdownRendererSource).toContain("const thinkSectionSurface = getMarkdownThinkSectionDesktopSurfaceState()")
    expect(markdownRendererSource).toContain("getMarkdownThinkSectionAccessibilityLabel(collapsed)")
    expect(markdownRendererSource).toContain("getMarkdownThinkSectionDisplayLabel(collapsed)")
    expect(markdownRendererSource).toContain("getMarkdownRenderOptions")
    expect(markdownRendererSource).toContain("splitMarkdownContent(content, getMarkdownRenderOptions())")
    expect(markdownRendererSource).toContain("const thinkControl = getMarkdownThinkSectionControlState(part.content, index, {")
    expect(markdownRendererSource).toContain("key={thinkControl.key}")
    expect(markdownRendererSource).toContain("isCollapsed: thinkControl.isCollapsed")
    expect(markdownRendererSource).toContain("onToggle: thinkControl.onToggle")
    expect(markdownRendererSource).toContain('if (part.type === "video")')
    expect(markdownRendererSource).not.toContain("const keyBase = getThinkKey")
    expect(markdownRendererSource).not.toContain("const isControlled = !!(isThinkExpanded && onToggleThink)")
    expect(markdownRendererSource).not.toContain('collapsed ? "Thinking" : "Hide thinking"')
    expect(markdownRendererSource).not.toContain("const parseThinkSections")
    expect(markdownRendererSource).not.toContain("const thinkRegex = /<think>")
    expect(markdownRendererSource).not.toContain("MARKDOWN_THINK_SECTION_SURFACE_PRESENTATION")
    expect(markdownRendererSource).not.toContain('"my-1 border-amber-200/60 bg-amber-50/50')
  })

  it("uses shared video attachment presentation for desktop markdown video links", () => {
    expect(markdownRendererSource).toContain("getChatVideoAttachmentDesktopRenderState")
    expect(markdownRendererSource).toContain("const videoAttachmentRenderState = getChatVideoAttachmentDesktopRenderState({ src, label })")
    expect(markdownRendererSource).toContain("const videoAttachmentSurface = videoAttachmentRenderState.surface")
    expect(markdownRendererSource).toContain("aria-label={videoAttachmentRenderState.loadButton.accessibilityLabel}")
    expect(markdownRendererSource).toContain("isMarkdownContentVideoLinkUrl(href)")
    expect(markdownRendererSource).toContain("export const markdownUrlTransform = transformMarkdownContentUrl")
    expect(markdownRendererSource).toContain("export const isAllowedMarkdownLinkUrl = isAllowedMarkdownContentLinkUrl")
    expect(markdownRendererSource).toContain("videoAttachmentRenderState.displayLabel")
    expect(markdownRendererSource).toContain("videoAttachmentRenderState.subtitle")
    expect(markdownRendererSource).not.toContain("getChatVideoAttachmentDesktopSurfaceState")
    expect(markdownRendererSource).not.toContain("getChatVideoAttachmentCopyState")
    expect(markdownRendererSource).not.toContain("getVideoAttachmentLoadAccessibilityLabel")
    expect(markdownRendererSource).not.toContain("ALLOWED_RECORDING_ASSET_URL_REGEX")
    expect(markdownRendererSource).not.toContain("allowRecordingAssetUrls: true")
    expect(markdownRendererSource).not.toContain("CHAT_VIDEO_ATTACHMENT_SURFACE_PRESENTATION")
    expect(markdownRendererSource).not.toContain("CHAT_VIDEO_ATTACHMENT_PRESENTATION")
    expect(markdownRendererSource).not.toContain("Loads only when you click play")
    expect(markdownRendererSource).not.toContain("not-prose my-3 block overflow-hidden rounded-lg border border-border bg-muted/20")
  })

  it("marks rendered markdown as selectable so response text and code can be copied", () => {
    expect(markdownRendererSource).toContain(
      "const SELECTABLE_MARKDOWN_CLASS_NAME = markdownContentSurface.selectableClassName"
    )
    expect(markdownRendererSource).toContain(
      'className={SELECTABLE_MARKDOWN_CLASS_NAME}'
    )
    expect(markdownRendererSource).toContain("SELECTABLE_MARKDOWN_CLASS_NAME")
    expect(markdownRendererSource).toContain("codeBlockCopyRenderState.label")
    expect(markdownRendererSource).toContain("getMarkdownCodeBlockFeedbackResetDelayMs()")
    expect(markdownRendererSource).not.toContain("MARKDOWN_CONTENT_PRESENTATION")
    expect(markdownRendererSource).not.toContain("getMarkdownCodeBlockCopyLabel(copied)")
    expect(markdownRendererSource).not.toContain('title={copied ? "Copied!" : "Copy code"}')
    expect(markdownRendererSource).not.toContain("setCopied(false), 2000")
  })

  it("uses shared markdown image fallback copy on desktop", () => {
    expect(markdownRendererSource).toContain("getMarkdownImageFallbackLabel(alt)")
    expect(markdownRendererSource).toContain("alt={imageLabel}")
    expect(markdownRendererSource).toContain("className={markdownContentSurface.imageClassName}")
    expect(markdownRendererSource).not.toContain('alt={alt || "Image"}')
    expect(markdownRendererSource).not.toContain(
      'className="mb-3 max-h-[28rem] w-full rounded-md border border-border bg-muted/20 object-contain"'
    )
  })
})
