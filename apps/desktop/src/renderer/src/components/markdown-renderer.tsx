import React, { useState, useId } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { ChevronDown, ChevronRight, Brain } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import "highlight.js/styles/github.css"

import { logExpand, logUI } from "@renderer/lib/debug"

interface MarkdownRendererProps {
  content: string
  className?: string
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

const ALLOWED_MARKDOWN_DATA_IMAGE_URL_REGEX =
  /^data:image\/(?:png|apng|gif|jpe?g|webp|bmp|avif)(?:;|,)/

export const isAllowedMarkdownLinkUrl = (rawUrl?: string) => {
  if (!rawUrl) return false

  const url = rawUrl.trim().toLowerCase()

  // Allow in-app anchors and common safe external link schemes.
  if (
    url.startsWith("#") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  ) {
    return true
  }

  return false
}

export const isAllowedMarkdownImageUrl = (rawUrl?: string) => {
  if (!rawUrl) return false

  const url = rawUrl.trim().toLowerCase()
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    ALLOWED_MARKDOWN_DATA_IMAGE_URL_REGEX.test(url)
  )
}

export const markdownUrlTransform = (url: string, key?: string) => {
  const isImageSrc = key === "src"
  const isAllowed = isImageSrc
    ? isAllowedMarkdownImageUrl(url)
    : isAllowedMarkdownLinkUrl(url)
  return isAllowed ? url : ""
}

const markdownLinkComponent = ({
  children,
  href,
}: {
  children?: React.ReactNode
  href?: string
}) => {
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

const sharedMarkdownComponents = {
  a: markdownLinkComponent,
  img: markdownImageComponent,
  code: ({ children, ...props }: any) => {
    const inline = !props.className
    if (inline) {
      return (
        <code
          className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]"
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
  pre: ({ children }) => (
    <pre className="mb-3 max-w-full overflow-x-auto rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
      {children}
    </pre>
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
    <div className="my-4 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
        aria-expanded={!collapsed}
        aria-controls={`think-content-${uid}`}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
        <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {collapsed ? "Show thinking process" : "Hide thinking process"}
        </span>
      </button>

      {!collapsed && (
        <div
          id={`think-content-${uid}`}
          className="px-3 pb-3 text-sm text-amber-900 dark:text-amber-100"
        >
          <div className="prose prose-sm prose-amber dark:prose-invert max-w-none">
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

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  getThinkKey,
  isThinkExpanded,
  onToggleThink,
}) => {
  const parts = parseThinkSections(content)

  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
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
            <ReactMarkdown
              key={`text-${index}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              urlTransform={markdownUrlTransform}
              components={{
                ...sharedMarkdownComponents,
                // Custom components for better styling
                h1: ({ children }) => (
                  <h1 className="mb-3 text-xl font-bold text-foreground">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 text-lg font-semibold text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 text-base font-medium text-foreground">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed text-foreground break-words [overflow-wrap:anywhere]">
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
          )
        }
      })}
    </div>
  )
}
