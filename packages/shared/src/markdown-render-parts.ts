import {
  extractMarkdownLinkReferences,
  isMarkdownVideoLinkUrl,
  type MarkdownVideoLinkOptions,
} from "./conversation-media-assets"

export type MarkdownRenderPart =
  | { type: "markdown"; content: string }
  | { type: "video"; label?: string; url: string }
  | { type: "think"; content: string }

export type SplitMarkdownContentOptions = MarkdownVideoLinkOptions

function splitVideoLinks(
  content: string,
  options: SplitMarkdownContentOptions = {},
): MarkdownRenderPart[] {
  const parts: MarkdownRenderPart[] = []
  let lastIndex = 0

  for (const reference of extractMarkdownLinkReferences(content)) {
    if (!isMarkdownVideoLinkUrl(reference.url, options)) continue

    if (reference.linkIndex > lastIndex) {
      parts.push({ type: "markdown", content: content.slice(lastIndex, reference.linkIndex) })
    }
    parts.push({ type: "video", label: reference.label, url: reference.url })
    lastIndex = reference.index + reference.fullMatch.length
  }

  if (lastIndex < content.length) {
    parts.push({ type: "markdown", content: content.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: "markdown", content }]
}

export function splitMarkdownContent(
  content: string,
  options: SplitMarkdownContentOptions = {},
): MarkdownRenderPart[] {
  const parts: MarkdownRenderPart[] = []
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
  let currentIndex = 0
  let match: RegExpExecArray | null

  const pushMarkdown = (value: string) => {
    if (!value.trim()) return
    parts.push(
      ...splitVideoLinks(value, options).filter((part) => part.type !== "markdown" || part.content.trim().length > 0),
    )
  }

  while ((match = thinkRegex.exec(content)) !== null) {
    if (match.index > currentIndex) {
      pushMarkdown(content.slice(currentIndex, match.index))
    }

    parts.push({ type: "think", content: match[1].trim() })
    currentIndex = match.index + match[0].length
  }

  if (currentIndex < content.length) {
    pushMarkdown(content.slice(currentIndex))
  }

  return parts.length > 0 ? parts : [{ type: "markdown", content }]
}
