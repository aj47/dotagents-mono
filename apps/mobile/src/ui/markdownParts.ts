import { isRenderableVideoUrl } from '@dotagents/shared';

export type MarkdownRenderPart =
  | { type: 'markdown'; content: string }
  | { type: 'video'; label?: string; url: string }
  | { type: 'think'; content: string };

// NOTE: Splitting markdown around video links may break contiguous constructs (lists, fenced code blocks)
// when a video link appears inline. This is an accepted trade-off for now; video links in agent messages
// rarely appear mid-structure.
function splitVideoLinks(content: string): MarkdownRenderPart[] {
  // Create a new regex instance per call to avoid /g lastIndex state leaking between invocations.
  const videoLinkRegex = /(^|[^!])\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: MarkdownRenderPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = videoLinkRegex.exec(content)) !== null) {
    const [fullMatch, prefix, label, url] = match;
    if (!isRenderableVideoUrl(url)) continue;

    const matchStart = (match.index ?? 0) + prefix.length;
    if (matchStart > lastIndex) {
      parts.push({ type: 'markdown', content: content.slice(lastIndex, matchStart) });
    }
    parts.push({ type: 'video', label, url });
    lastIndex = (match.index ?? 0) + fullMatch.length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'markdown', content }];
}

export function splitMarkdownContent(content: string): MarkdownRenderPart[] {
  const parts: MarkdownRenderPart[] = [];
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  let currentIndex = 0;
  let match: RegExpExecArray | null;

  const pushMarkdown = (value: string) => {
    if (!value.trim()) return;
    parts.push(
      ...splitVideoLinks(value).filter(part => part.type !== 'markdown' || part.content.trim().length > 0)
    );
  };

  while ((match = thinkRegex.exec(content)) !== null) {
    if (match.index > currentIndex) {
      pushMarkdown(content.slice(currentIndex, match.index));
    }

    parts.push({ type: 'think', content: match[1].trim() });
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < content.length) {
    pushMarkdown(content.slice(currentIndex));
  }

  return parts.length > 0 ? parts : [{ type: 'markdown', content }];
}