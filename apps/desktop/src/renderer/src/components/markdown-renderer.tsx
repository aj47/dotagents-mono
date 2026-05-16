import React, { useState, useId, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { ChevronDown, ChevronRight, Brain, Copy, CheckCheck, PlayCircle } from "lucide-react"
import {
  getChatVideoAttachmentDesktopRenderState,
  isAllowedMarkdownImageUrl as isSharedAllowedMarkdownImageUrl,
} from "@dotagents/shared/conversation-media-assets"
import {
  getMarkdownCodeBlockCopyLabel,
  getMarkdownCodeBlockFeedbackResetDelayMs,
  getMarkdownContentDesktopSurfaceState,
  getMarkdownImageFallbackLabel,
  getMarkdownRenderOptions,
  getMarkdownThinkSectionControlState,
  getMarkdownThinkSectionDesktopSurfaceState,
  getMarkdownThinkSectionAccessibilityLabel,
  getMarkdownThinkSectionDisplayLabel,
  isAllowedMarkdownContentLinkUrl,
  isMarkdownContentVideoLinkUrl,
  splitMarkdownContent,
  transformMarkdownContentUrl,
  type MarkdownThinkSectionControlOptions,
} from "@dotagents/shared/markdown-render-parts"
import { cn } from "@renderer/lib/utils"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import "highlight.js/styles/github.css"

import { logExpand, logUI } from "@renderer/lib/debug"

interface MarkdownRendererProps extends MarkdownThinkSectionControlOptions {
  content: string
  className?: string
  collapsed?: boolean
}

interface ThinkSectionProps {
  content: string
  defaultCollapsed?: boolean
  isCollapsed?: boolean
  onToggle?: () => void
}

const markdownContentSurface = getMarkdownContentDesktopSurfaceState()

const COMPACT_PROSE_CLASS_NAME = markdownContentSurface.compactProseClassName

const thinkSectionSurface = getMarkdownThinkSectionDesktopSurfaceState()

const COMPACT_THINK_PROSE_CLASS_NAME =
  `${COMPACT_PROSE_CLASS_NAME} ${thinkSectionSurface.proseAccentClassName}`

const SELECTABLE_MARKDOWN_CLASS_NAME = markdownContentSurface.selectableClassName

export const isAllowedMarkdownLinkUrl = isAllowedMarkdownContentLinkUrl

const VideoAttachmentCard = ({
  src,
  label,
}: {
  src: string
  label?: string
}) => {
  const [loaded, setLoaded] = useState(false)
  const videoAttachmentRenderState = getChatVideoAttachmentDesktopRenderState({ src, label })
  const videoAttachmentSurface = videoAttachmentRenderState.surface

  return (
    <span className={videoAttachmentSurface.cardClassName}>
      {loaded ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className={videoAttachmentSurface.videoClassName}
          onError={() => {
            logUI("[MarkdownRenderer] video failed to render", {
              label: videoAttachmentRenderState.displayLabel,
              srcPreview: src.slice(0, 64),
            })
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className={videoAttachmentSurface.loadButtonClassName}
          aria-label={videoAttachmentRenderState.loadButton.accessibilityLabel}
        >
          <span className={videoAttachmentSurface.playIconWrapperClassName}>
            <PlayCircle className={videoAttachmentSurface.playIconClassName} />
          </span>
          <span className={videoAttachmentSurface.textWrapperClassName}>
            <span className={videoAttachmentSurface.titleClassName}>
              {videoAttachmentRenderState.displayLabel}
            </span>
            <span className={videoAttachmentSurface.subtitleClassName}>
              {videoAttachmentRenderState.subtitle}
            </span>
          </span>
        </button>
      )}
    </span>
  )
}

export const isAllowedMarkdownImageUrl = (rawUrl?: string) => {
  return isSharedAllowedMarkdownImageUrl(rawUrl)
}

export const markdownUrlTransform = transformMarkdownContentUrl

const markdownLinkComponent = ({
  children,
  href,
}: {
  children?: React.ReactNode
  href?: string
}) => {
  if (isMarkdownContentVideoLinkUrl(href)) {
    return <VideoAttachmentCard src={href} label={extractTextContent(children)} />
  }

  if (isAllowedMarkdownLinkUrl(href)) {
    return (
      <a
        href={href}
        className={markdownContentSurface.linkClassName}
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
  const imageLabel = getMarkdownImageFallbackLabel(alt)

  return (
    <img
      src={src}
      alt={imageLabel}
      loading="lazy"
      decoding="async"
      onError={() => {
        logUI("[MarkdownRenderer] image failed to render", {
          alt: imageLabel,
          srcPreview: src.slice(0, 64),
        })
      }}
      className={markdownContentSurface.imageClassName}
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
  const copyLabel = getMarkdownCodeBlockCopyLabel(copied)

  const handleCopy = useCallback(async () => {
    const text = extractTextContent(children).replace(/\n$/, "")
    try {
      await copyTextToClipboard(text)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(
        () => setCopied(false),
        getMarkdownCodeBlockFeedbackResetDelayMs(),
      )
    } catch {
      /* clipboard write failed – swallow */
    }
  }, [children])

  return (
    <pre className={markdownContentSurface.codeBlockPreClassName}>
      <button
        type="button"
        onClick={handleCopy}
        className={markdownContentSurface.codeBlockCopyButtonClassName}
        title={copyLabel}
        aria-label={copyLabel}
      >
        {copied ? (
          <CheckCheck className={markdownContentSurface.codeBlockCopiedIconClassName} />
        ) : (
          <Copy className={markdownContentSurface.codeBlockCopyIconClassName} />
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
          className={markdownContentSurface.inlineCodeClassName}
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={markdownContentSurface.codeBlockClassName}
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
    <div className={markdownContentSurface.tableWrapperClassName}>
      <table className={markdownContentSurface.tableClassName}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className={markdownContentSurface.tableHeaderCellClassName}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className={markdownContentSurface.tableCellClassName}>
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
        thinkSectionSurface.containerBaseClassName,
        collapsed
          ? thinkSectionSurface.containerCollapsedClassName
          : thinkSectionSurface.containerExpandedClassName,
      )}
    >
      <button
        onClick={handleToggle}
        className={cn(
          thinkSectionSurface.headerBaseClassName,
          collapsed
            ? thinkSectionSurface.headerCollapsedClassName
            : thinkSectionSurface.headerExpandedClassName,
        )}
        aria-expanded={!collapsed}
        aria-label={getMarkdownThinkSectionAccessibilityLabel(collapsed)}
        aria-controls={`think-content-${uid}`}
      >
        {collapsed ? (
          <ChevronRight className={thinkSectionSurface.chevronCollapsedClassName} />
        ) : (
          <ChevronDown className={thinkSectionSurface.chevronExpandedClassName} />
        )}
        <Brain className={cn(
          thinkSectionSurface.iconBaseClassName,
          collapsed ? thinkSectionSurface.iconCollapsedClassName : thinkSectionSurface.iconExpandedClassName,
        )} />
        <span className={cn(
          thinkSectionSurface.labelBaseClassName,
          collapsed ? thinkSectionSurface.labelCollapsedClassName : thinkSectionSurface.labelExpandedClassName,
        )}>
          {getMarkdownThinkSectionDisplayLabel(collapsed)}
        </span>
      </button>

      {!collapsed && (
        <div
          id={`think-content-${uid}`}
          className={thinkSectionSurface.contentClassName}
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

const MarkdownRendererBase: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  collapsed,
  getThinkKey,
  isThinkExpanded,
  onToggleThink,
}) => {
  const parts = splitMarkdownContent(content, getMarkdownRenderOptions())

  return (
    <div
      className={cn(COMPACT_PROSE_CLASS_NAME, className)}
    >
      {parts.map((part, index) => {
        if (part.type === "think") {
          const thinkControl = getMarkdownThinkSectionControlState(part.content, index, {
            getThinkKey,
            isThinkExpanded,
            onToggleThink,
          })
          return (
            <ThinkSection
              key={thinkControl.key}
              content={part.content}
              defaultCollapsed={true}
              {...(thinkControl.isControlled ? {
                isCollapsed: thinkControl.isCollapsed,
                onToggle: thinkControl.onToggle,
              } : {})}
            />
          )
        }

        if (part.type === "video") {
          return (
            <VideoAttachmentCard
              key={`video-${index}-${part.url}`}
              src={part.url}
              label={part.label}
            />
          )
        }

        if (part.type === "markdown") {
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
                    <h1 className={collapsed ? markdownContentSurface.heading1CollapsedClassName : markdownContentSurface.heading1ExpandedClassName}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className={collapsed ? markdownContentSurface.heading2CollapsedClassName : markdownContentSurface.heading2ExpandedClassName}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className={collapsed ? markdownContentSurface.heading3CollapsedClassName : markdownContentSurface.heading3ExpandedClassName}>
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className={markdownContentSurface.paragraphClassName}>
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className={markdownContentSurface.unorderedListClassName}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className={markdownContentSurface.orderedListClassName}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className={markdownContentSurface.listItemClassName}>{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className={markdownContentSurface.blockquoteClassName}>
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

        return null
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
