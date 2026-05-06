import React, { useState, useId, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { ChevronDown, ChevronRight, Brain, Copy, CheckCheck, PlayCircle } from "lucide-react"
import {
  getVideoAssetLabel,
  isAllowedMarkdownImageUrl as isSharedAllowedMarkdownImageUrl,
  isAllowedMarkdownLinkUrl as isSharedAllowedMarkdownLinkUrl,
  isRenderableVideoUrl,
  transformMarkdownUrl,
} from "@dotagents/shared/conversation-media-assets"
import { cn } from "@renderer/lib/utils"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import "highlight.js/styles/github.css"

import { logExpand, logUI } from "@renderer/lib/debug"

interface MarkdownRendererProps {
  content: string
  className?: string
  collapsed?: boolean
  getThinkKey?: (content: string, index: number) => string
  isThinkExpanded?: (key: string) => boolean
  onToggleThink?: (key: string) => void
}

interface ThinkSectionProps {
  content: string
  defaultCollapsed?: boolean
  isCollapsed?: boolean
  onToggle?: () => void
}

const COMPACT_PROSE_CLASS_NAME =
  "prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:mb-2 prose-headings:mt-2 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-pre:my-2 prose-img:my-2"

const COMPACT_THINK_PROSE_CLASS_NAME =
  `${COMPACT_PROSE_CLASS_NAME} prose-amber`

const SELECTABLE_MARKDOWN_CLASS_NAME = "markdown-selectable"

const ALLOWED_RECORDING_ASSET_URL_REGEX = /^assets:\/\/recording\//

export const isAllowedMarkdownLinkUrl = (rawUrl?: string) => {
  return isSharedAllowedMarkdownLinkUrl(rawUrl, { allowRecordingAssetUrls: true })
}

const isDesktopRenderableVideoUrl = (rawUrl?: string) => {
  if (!rawUrl) return false
  const url = rawUrl.trim().toLowerCase()
  return isRenderableVideoUrl(rawUrl) || ALLOWED_RECORDING_ASSET_URL_REGEX.test(url)
}

const VideoAttachmentCard = ({
  src,
  label,
}: {
  src: string
  label?: string
}) => {
  const [loaded, setLoaded] = useState(false)
  const displayLabel = getVideoAssetLabel(label, src)

  return (
    <span className="not-prose my-3 block overflow-hidden rounded-lg border border-border bg-muted/20">
      {loaded ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className="block max-h-[30rem] w-full bg-black"
          onError={() => {
            logUI("[MarkdownRenderer] video failed to render", {
              label: displayLabel,
              srcPreview: src.slice(0, 64),
            })
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40"
          aria-label={`Load video ${displayLabel}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PlayCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{displayLabel}</span>
            <span className="block text-xs text-muted-foreground">Loads only when you click play</span>
          </span>
        </button>
      )}
    </span>
  )
}

export const isAllowedMarkdownImageUrl = (rawUrl?: string) => {
  return isSharedAllowedMarkdownImageUrl(rawUrl)
}

export const markdownUrlTransform = (url: string, key?: string) => {
  return transformMarkdownUrl(url, key, { allowRecordingAssetUrls: true })
}

const markdownLinkComponent = ({
  children,
  href,
}: {
  children?: React.ReactNode
  href?: string
}) => {
  if (href && isDesktopRenderableVideoUrl(href)) {
    return <VideoAttachmentCard src={href} label={extractTextContent(children)} />
  }

  if (isAllowedMarkdownLinkUrl(href)) {
    return (
      <a
        href={href}
        className="break-words text-primary underline underline-offset-2 hover:text-primary/80 [overflow-wrap:anywhere]"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return <>{children}</>
}

const markdownImageComponent = ({
  src,
  alt,
}: {
  src?: string
  alt?: string
}) => {
  if (!src || !isAllowedMarkdownImageUrl(src)) return null

  return (
    <img
      src={src}
      alt={alt || "Image"}
      loading="lazy"
      decoding="async"
      onError={() => {
        logUI("[MarkdownRenderer] image failed to render", {
          alt: alt || "Image",
          srcPreview: src.slice(0, 64),
        })
      }}
      className="mb-3 max-h-[28rem] w-full rounded-md border border-border bg-muted/20 object-contain"
    />
  )
}

/** Extract the text content from a React element tree (for copy-to-clipboard). */
function extractTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractTextContent).join("")
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode }
    return extractTextContent(props.children)
  }
  return ""
}

/** Wrapper that adds a copy button to fenced code blocks. */
const CodeBlockWithCopy: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(async () => {
    const text = extractTextContent(children).replace(/\n$/, "")
    try {
      await copyTextToClipboard(text)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard write failed – swallow */
    }
  }, [children])

  return (
    <pre className="group/codeblock relative mb-3 max-w-full overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-3 dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-border/50 bg-background/80 p-1 opacity-0 transition-opacity hover:bg-muted group-hover/codeblock:opacity-100 focus:opacity-100"
        title={copied ? "Copied!" : "Copy code"}
        aria-label={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <CheckCheck className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {children}
    </pre>
  )
}

const sharedMarkdownComponents = {
  a: markdownLinkComponent,
  img: markdownImageComponent,
  code: ({ children, ...props }: any) => {
    const inline = !props.className
    if (inline) {
      return (
        <code
          className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className="block min-w-max font-mono text-[0.8125rem] leading-5 text-current"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <CodeBlockWithCopy>{children}</CodeBlockWithCopy>
  ),
  table: ({ children }) => (
    <div className="mb-3 max-w-full overflow-x-auto rounded-lg border border-border/80">
      <table className="w-max min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="whitespace-nowrap border-b border-r border-border bg-muted/50 px-3 py-2 text-left align-top font-semibold last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-r border-border px-3 py-2 align-top last:border-r-0 [overflow-wrap:anywhere]">
      {children}
    </td>
  ),
}

const ThinkSection: React.FC<ThinkSectionProps> = ({
  content,
  defaultCollapsed = true,
  isCollapsed,
  onToggle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const collapsed = isCollapsed ?? internalCollapsed

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      const prev = internalCollapsed
      setInternalCollapsed(!prev)
      logExpand("ThinkSection", "toggle", { fromCollapsed: prev, toCollapsed: !prev })
    }
  }

  const uid = useId()

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border transition-colors",
        collapsed
          ? "my-1 border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20"
          : "my-3 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
      )}
    >
      <button
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center gap-1.5 text-left transition-colors",
          collapsed
            ? "px-2 py-0.5 hover:bg-amber-100/60 dark:hover:bg-amber-900/20"
            : "px-3 py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30",
        )}
        aria-expanded={!collapsed}
        aria-controls={`think-content-${uid}`}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        )}
        <Brain className={cn(
          "shrink-0 text-amber-600 dark:text-amber-400",
          collapsed ? "h-3 w-3" : "h-3.5 w-3.5",
        )} />
        <span className={cn(
          "truncate text-amber-800 dark:text-amber-200",
          collapsed ? "text-[11px] font-medium opacity-70" : "text-sm font-medium",
        )}>
          {collapsed ? "Thinking" : "Hide thinking"}
        </span>
      </button>

      {!collapsed && (
        <div
          id={`think-content-${uid}`}
          className="px-3 pb-3 text-sm text-amber-900 dark:text-amber-100"
        >
          <div
            className={cn(
              COMPACT_THINK_PROSE_CLASS_NAME,
              SELECTABLE_MARKDOWN_CLASS_NAME,
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              urlTransform={markdownUrlTransform}
              components={sharedMarkdownComponents}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

const parseThinkSections = (content: string) => {
  const parts: Array<{ type: "text" | "think"; content: string }> = []
  let currentIndex = 0

  // Regex to match <think>...</think> tags (including multiline)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
  let match

  while ((match = thinkRegex.exec(content)) !== null) {
    // Add text before the think section
    if (match.index > currentIndex) {
      const textBefore = content.slice(currentIndex, match.index)
      if (textBefore.trim()) {
        parts.push({ type: "text", content: textBefore })
      }
    }

    // Add the think section content (without the tags)
    parts.push({ type: "think", content: match[1].trim() })
    currentIndex = match.index + match[0].length
  }

  // Add remaining text after the last think section
  if (currentIndex < content.length) {
    const remainingText = content.slice(currentIndex)
    if (remainingText.trim()) {
      parts.push({ type: "text", content: remainingText })
    }
  }

  // If no think sections found, return the original content as text
  if (parts.length === 0) {
    parts.push({ type: "text", content })
  }

  return parts
}

const MarkdownRendererBase: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  collapsed,
  getThinkKey,
  isThinkExpanded,
  onToggleThink,
}) => {
  const parts = parseThinkSections(content)

  return (
    <div
      className={cn(COMPACT_PROSE_CLASS_NAME, className)}
    >
      {parts.map((part, index) => {
        if (part.type === "think") {
          const keyBase = getThinkKey ? getThinkKey(part.content, index) : `think-${index}`
          const isControlled = !!(isThinkExpanded && onToggleThink)
          const expanded = isControlled ? !!isThinkExpanded!(keyBase) : undefined
          return (
            <ThinkSection
              key={keyBase}
              content={part.content}
              defaultCollapsed={true}
              {...(isControlled ? { isCollapsed: !expanded, onToggle: () => onToggleThink!(keyBase) } : {})}
            />
          )
        } else {
          return (
            <div
              key={`text-${index}`}
              className={SELECTABLE_MARKDOWN_CLASS_NAME}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                urlTransform={markdownUrlTransform}
                components={{
                  ...sharedMarkdownComponents,
                  // Custom components for better styling
                  h1: ({ children }) => (
                    <h1 className={collapsed ? "text-sm font-normal text-foreground" : "mb-3 text-xl font-bold text-foreground"}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className={collapsed ? "text-sm font-normal text-foreground" : "mb-2 text-lg font-semibold text-foreground"}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className={collapsed ? "text-sm font-normal text-foreground" : "mb-2 text-base font-medium text-foreground"}>
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-1 leading-normal text-foreground">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 list-outside list-disc space-y-1 pl-5 text-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-outside list-decimal space-y-1 pl-5 text-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="break-words pl-0.5 text-foreground">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="mb-3 border-l-4 border-muted-foreground pl-4 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {part.content}
              </ReactMarkdown>
            </div>
          )
        }
      })}
    </div>
  )
}

export const MarkdownRenderer = React.memo(MarkdownRendererBase, (prev, next) => (
  prev.content === next.content &&
  prev.className === next.className &&
  prev.collapsed === next.collapsed &&
  prev.getThinkKey === next.getThinkKey &&
  prev.isThinkExpanded === next.isThinkExpanded &&
  prev.onToggleThink === next.onToggleThink
))
