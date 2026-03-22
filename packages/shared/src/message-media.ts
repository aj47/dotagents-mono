export type MarkdownMediaKind = 'image' | 'video'

export type MarkdownMediaMatch = {
  match: string
  altText: string
  label: string
  url: string
  kind: MarkdownMediaKind
}

export type MarkdownVideoSegment =
  | { kind: 'markdown'; content: string }
  | { kind: 'video'; label: string; url: string }

const MARKDOWN_MEDIA_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/gi

export const VIDEO_MARKDOWN_ALT_PREFIX = 'video:'

const normalizeMarkdownAltText = (altText?: string | null) => (altText || '').trim()

export function escapeMarkdownMediaAltText(value: string): string {
  return value.replace(/[\[\]\\]/g, '').trim()
}

export function isVideoMarkdownAltText(altText?: string | null): boolean {
  return normalizeMarkdownAltText(altText).toLowerCase().startsWith(VIDEO_MARKDOWN_ALT_PREFIX)
}

export function getMarkdownMediaKind(altText?: string | null): MarkdownMediaKind {
  return isVideoMarkdownAltText(altText) ? 'video' : 'image'
}

export function getMarkdownMediaLabel(altText?: string | null): string {
  const normalized = normalizeMarkdownAltText(altText)
  if (!normalized) {
    return ''
  }
  if (!isVideoMarkdownAltText(normalized)) {
    return normalized
  }
  return normalized.slice(VIDEO_MARKDOWN_ALT_PREFIX.length).trim()
}

export function buildMarkdownMediaTag(kind: MarkdownMediaKind, label: string, url: string): string {
  const safeLabel = escapeMarkdownMediaAltText(label)
  if (kind === 'video') {
    return `![${safeLabel ? `video: ${safeLabel}` : 'video'}](${url})`
  }
  return `![${safeLabel}](${url})`
}

export function replaceMarkdownMedia(
  content: string,
  replacer: (match: MarkdownMediaMatch) => string
): string {
  if (!content) {
    return content
  }

  return content.replace(MARKDOWN_MEDIA_REGEX, (match, altText: string, url: string) => (
    replacer({
      match,
      altText,
      label: getMarkdownMediaLabel(altText),
      url,
      kind: getMarkdownMediaKind(altText),
    })
  ))
}

export function countMarkdownMedia(content: string): { images: number; videos: number } {
  const counts = { images: 0, videos: 0 }
  replaceMarkdownMedia(content, ({ kind, match }) => {
    if (kind === 'video') {
      counts.videos += 1
    } else {
      counts.images += 1
    }
    return match
  })
  return counts
}

export function splitContentByMarkdownVideos(content: string): MarkdownVideoSegment[] {
  if (!content) {
    return [{ kind: 'markdown', content }]
  }

  const segments: MarkdownVideoSegment[] = []
  const regex = new RegExp(MARKDOWN_MEDIA_REGEX.source, 'gi')
  let lastIndex = 0
  let match: RegExpExecArray | null = null

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, altText = '', url = ''] = match
    if (!isVideoMarkdownAltText(altText)) {
      continue
    }

    if (match.index > lastIndex) {
      segments.push({ kind: 'markdown', content: content.slice(lastIndex, match.index) })
    }

    segments.push({
      kind: 'video',
      label: getMarkdownMediaLabel(altText),
      url,
    })
    lastIndex = match.index + fullMatch.length
  }

  if (segments.length === 0) {
    return [{ kind: 'markdown', content }]
  }

  if (lastIndex < content.length) {
    segments.push({ kind: 'markdown', content: content.slice(lastIndex) })
  }

  return segments
}
