import React, { useState, useId, useCallback, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  ChevronDown,
  ChevronRight,
  Brain,
  Copy,
  CheckCheck,
  Download,
  PlayCircle,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { getVideoAssetLabel, isRenderableVideoUrl } from "@dotagents/shared"
import { cn } from "@renderer/lib/utils"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { toast } from "sonner"
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
const LIGHTBOX_CONTROL_BUTTON_CLASS_NAME =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-35"
const COLLAPSED_MARKDOWN_PREVIEW_CHARS = 1200

const ALLOWED_MARKDOWN_DATA_IMAGE_URL_REGEX =
  /^data:image\/(?:png|apng|gif|jpe?g|webp|bmp|avif)(?:;|,)/
const ALLOWED_CONVERSATION_IMAGE_ASSET_URL_REGEX =
  /^assets:\/\/conversation-image\//
const ALLOWED_CONVERSATION_VIDEO_ASSET_URL_REGEX =
  /^assets:\/\/conversation-video\//
const ALLOWED_RECORDING_ASSET_URL_REGEX = /^assets:\/\/recording\//
const LOCAL_ARTIFACT_URL_PREFIX = "artifact://local-file?path="
const LOCAL_ARTIFACT_URL_REGEX = /^artifact:\/\/local-file\?path=/
const LOCAL_ARTIFACT_PATH_TEXT_REGEX =
  /^((?:~|\/(?!\/))[^\s"'`<>),\]}]+\.(?:html?|md|markdown|mdx|txt|log|json|jsonl|csv|tsv|xml|ya?ml|pdf|png|apng|gif|jpe?g|webp|bmp|avif|svg|mp4|m4v|webm|mov|ogv|mp3|wav|m4a|aac|flac|ogg|oga|opus))$/i
const LOCAL_ARTIFACT_PATH_REGEX =
  /(^|[\s([{])((?:~|\/(?!\/))[^\s"'`<>),\]}]+\.(?:html?|md|markdown|mdx|txt|log|json|jsonl|csv|tsv|xml|ya?ml|pdf|png|apng|gif|jpe?g|webp|bmp|avif|svg|mp4|m4v|webm|mov|ogv|mp3|wav|m4a|aac|flac|ogg|oga|opus))(?:([,.;:!?])(?=$|\s)|(?=$|\s|[)\]}]))/gi

export const isAllowedMarkdownLinkUrl = (rawUrl?: string) => {
  if (!rawUrl) return false

  const url = rawUrl.trim().toLowerCase()

  // Allow in-app anchors and common safe external link schemes.
  if (
    url.startsWith("#") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    LOCAL_ARTIFACT_URL_REGEX.test(url) ||
    ALLOWED_CONVERSATION_VIDEO_ASSET_URL_REGEX.test(url) ||
    ALLOWED_RECORDING_ASSET_URL_REGEX.test(url) ||
    url.startsWith("mailto:")
  ) {
    return true
  }

  return false
}

const isDesktopRenderableVideoUrl = (rawUrl?: string) => {
  if (!rawUrl) return false
  const url = rawUrl.trim().toLowerCase()
  return isRenderableVideoUrl(rawUrl) || ALLOWED_RECORDING_ASSET_URL_REGEX.test(url)
}

const encodeLocalArtifactUrl = (filePath: string) =>
  LOCAL_ARTIFACT_URL_PREFIX + encodeURIComponent(filePath)

const decodeLocalArtifactUrl = (href: string) => {
  if (!LOCAL_ARTIFACT_URL_REGEX.test(href)) return null
  const pathParam = href.slice(LOCAL_ARTIFACT_URL_PREFIX.length)
  try {
    return decodeURIComponent(pathParam)
  } catch {
    return null
  }
}

const escapeMarkdownLinkText = (text: string) =>
  text.replace(/([\\[\]])/g, "\\$1")

export const getLocalArtifactPathFromInlineText = (text: string) => {
  const match = text.trim().match(LOCAL_ARTIFACT_PATH_TEXT_REGEX)
  return match?.[1] ?? null
}

export const linkifyLocalArtifactPaths = (content: string) => {
  const fenceParts = content.split(/(```[\s\S]*?```)/g)

  return fenceParts
    .map((fencePart) => {
      if (fencePart.startsWith("```")) return fencePart

      return fencePart
        .split(/(`[^`\n]+`)/g)
        .map((part) => {
          if (part.startsWith("`")) return part
          return part.replace(
            LOCAL_ARTIFACT_PATH_REGEX,
            (
              match,
              prefix: string,
              filePath: string,
              trailing = "",
              offset: number,
              fullText: string,
            ) => {
              if (prefix.endsWith("(") && fullText[offset - 1] === "]") {
                return match
              }
              return (
                prefix +
                "[" +
                escapeMarkdownLinkText(filePath) +
                "](" +
                encodeLocalArtifactUrl(filePath) +
                ")" +
                trailing
              )
            },
          )
        })
        .join("")
    })
    .join("")
}

const LocalArtifactLink = ({
  path,
  children,
  className,
}: {
  path: string
  children?: React.ReactNode
  className?: string
}) => (
  <a
    href={encodeLocalArtifactUrl(path)}
    className={cn(
      "break-words text-primary underline underline-offset-2 hover:text-primary/80 [overflow-wrap:anywhere]",
      className,
    )}
    title={"Open " + path}
    onClick={(event) => {
      event.preventDefault()
      void import("@renderer/lib/tipc-client")
        .then(({ tipcClient }) =>
          tipcClient.openArtifactPath({ path }),
        )
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to open artifact",
          )
        })
    }}
  >
    {children}
  </a>
)
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
  if (!rawUrl) return false

  const url = rawUrl.trim().toLowerCase()
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    ALLOWED_CONVERSATION_IMAGE_ASSET_URL_REGEX.test(url) ||
    ALLOWED_MARKDOWN_DATA_IMAGE_URL_REGEX.test(url)
  )
}

export const markdownUrlTransform = (url: string, key?: string) => {
  const isAllowed =
    key === "src"
      ? isAllowedMarkdownImageUrl(url)
      : key === "href"
        ? isAllowedMarkdownLinkUrl(url)
        : isAllowedMarkdownImageUrl(url) || isAllowedMarkdownLinkUrl(url)
  return isAllowed ? url : ""
}

type ImageZoomState = {
  scale: number
  offsetX: number
  offsetY: number
}

const IMAGE_ZOOM_MIN_SCALE = 1
const IMAGE_ZOOM_MAX_SCALE = 5
const IMAGE_ZOOM_STEP = 0.5
const DEFAULT_IMAGE_ZOOM_STATE: ImageZoomState = {
  scale: IMAGE_ZOOM_MIN_SCALE,
  offsetX: 0,
  offsetY: 0,
}

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const IMAGE_MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/apng": "apng",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
}

const FILENAME_DISALLOWED_CHARS_REGEX = /[\\/:*?"<>|\x00-\x1f]+/g
const FILENAME_HAS_EXTENSION_REGEX = /\.[a-z0-9]{1,8}$/i

const sanitizeDownloadBasename = (raw: string): string => {
  const collapsed = raw
    .replace(FILENAME_DISALLOWED_CHARS_REGEX, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+/, "")
  return collapsed.slice(0, 128)
}

const extensionFromMimeType = (mimeType?: string): string => {
  if (!mimeType) return ""
  const primary = mimeType.split(";")[0]?.trim().toLowerCase() ?? ""
  return IMAGE_MIME_TO_EXTENSION[primary] ?? ""
}

export const deriveImageDownloadFileName = (
  src: string,
  alt?: string,
  mimeType?: string,
): string => {
  const fallbackExtension = extensionFromMimeType(mimeType) || "png"

  try {
    const url = new URL(src)
    if (url.protocol !== "data:") {
      const segments = url.pathname.split("/").filter(Boolean)
      const last = segments[segments.length - 1]
      if (last) {
        let decoded = last
        try {
          decoded = decodeURIComponent(last)
        } catch {
          // Fall back to the raw segment.
        }
        const sanitized = sanitizeDownloadBasename(decoded)
        if (sanitized && FILENAME_HAS_EXTENSION_REGEX.test(sanitized)) {
          return sanitized
        }
        if (sanitized) {
          return `${sanitized}.${fallbackExtension}`
        }
      }
    }
  } catch {
    // Not a parseable URL (e.g., relative or malformed); fall through.
  }

  if (alt) {
    const sanitized = sanitizeDownloadBasename(alt)
    if (sanitized) {
      return FILENAME_HAS_EXTENSION_REGEX.test(sanitized)
        ? sanitized
        : `${sanitized}.${fallbackExtension}`
    }
  }

  return `image.${fallbackExtension}`
}

const getContainedImageSize = (
  viewport: HTMLDivElement | null,
  image: HTMLImageElement | null,
) => {
  if (!viewport || !image || !image.naturalWidth || !image.naturalHeight) {
    return null
  }

  const viewportRect = viewport.getBoundingClientRect()
  if (viewportRect.width <= 0 || viewportRect.height <= 0) return null

  const fitScale = Math.min(
    1,
    viewportRect.width / image.naturalWidth,
    viewportRect.height / image.naturalHeight,
  )

  return {
    viewportWidth: viewportRect.width,
    viewportHeight: viewportRect.height,
    width: image.naturalWidth * fitScale,
    height: image.naturalHeight * fitScale,
  }
}

const clampImageZoomState = (
  state: ImageZoomState,
  viewport: HTMLDivElement | null,
  image: HTMLImageElement | null,
): ImageZoomState => {
  const scale = clampNumber(
    state.scale,
    IMAGE_ZOOM_MIN_SCALE,
    IMAGE_ZOOM_MAX_SCALE,
  )

  if (scale <= IMAGE_ZOOM_MIN_SCALE) {
    return { ...DEFAULT_IMAGE_ZOOM_STATE }
  }

  const imageSize = getContainedImageSize(viewport, image)
  if (!imageSize) {
    return {
      scale,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
    }
  }

  const maxOffsetX = Math.max(
    0,
    (imageSize.width * scale - imageSize.viewportWidth) / 2,
  )
  const maxOffsetY = Math.max(
    0,
    (imageSize.height * scale - imageSize.viewportHeight) / 2,
  )

  return {
    scale,
    offsetX: clampNumber(state.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clampNumber(state.offsetY, -maxOffsetY, maxOffsetY),
  }
}

const containsChatImageChild = (children: React.ReactNode): boolean => {
  // react-markdown passes link children as React elements whose .type is the
  // `img` override (markdownImageComponent), not the eventual ChatImage. Match
  // both so the unwrap fires whether react-markdown built the tree or a caller
  // constructed ChatImage directly.
  return React.Children.toArray(children).some(
    (c) =>
      React.isValidElement(c) &&
      (c.type === ChatImage || c.type === markdownImageComponent),
  )
}

const markdownLinkComponent = ({
  children,
  href,
}: {
  children?: React.ReactNode
  href?: string
}) => {
  const localArtifactPath = href ? decodeLocalArtifactUrl(href) : null
  if (localArtifactPath) {
    return (
      <LocalArtifactLink path={localArtifactPath}>
        {children}
      </LocalArtifactLink>
    )
  }

  if (href && isDesktopRenderableVideoUrl(href)) {
    return <VideoAttachmentCard src={href} label={extractTextContent(children)} />
  }

  if (isAllowedMarkdownLinkUrl(href)) {
    // Skip the wrapping <a> whenever a ChatImage appears in the link's
    // children (image-only or mixed-content like [![](img) caption](href))
    // so the focusable lightbox button is never nested inside an anchor.
    if (containsChatImageChild(children)) {
      return <>{children}</>
    }
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

const ChatImage = ({ src, alt }: { src: string; alt?: string }) => {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState<ImageZoomState>(DEFAULT_IMAGE_ZOOM_STATE)
  const [isDragging, setIsDragging] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const lightboxImageRef = useRef<HTMLImageElement | null>(null)
  const dragStartRef = useRef<{
    pointerId: number
    clientX: number
    clientY: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const dragMovedRef = useRef(false)
  const label = alt || "Image"

  const resetZoom = useCallback(() => {
    dragStartRef.current = null
    dragMovedRef.current = false
    setIsDragging(false)
    setZoom({ ...DEFAULT_IMAGE_ZOOM_STATE })
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      resetZoom()
      setOpen(nextOpen)
    },
    [resetZoom],
  )

  const updateZoom = useCallback(
    (scaleDelta: number, anchor?: { clientX: number; clientY: number }) => {
      setZoom((current) => {
        const viewport = viewportRef.current
        const image = lightboxImageRef.current
        const nextScale = clampNumber(
          current.scale + scaleDelta,
          IMAGE_ZOOM_MIN_SCALE,
          IMAGE_ZOOM_MAX_SCALE,
        )

        if (!anchor || !viewport) {
          return clampImageZoomState(
            {
              ...current,
              scale: nextScale,
            },
            viewport,
            image,
          )
        }

        const viewportRect = viewport.getBoundingClientRect()
        const pointX =
          anchor.clientX - viewportRect.left - viewportRect.width / 2
        const pointY =
          anchor.clientY - viewportRect.top - viewportRect.height / 2
        const localX = (pointX - current.offsetX) / current.scale
        const localY = (pointY - current.offsetY) / current.scale

        return clampImageZoomState(
          {
            scale: nextScale,
            offsetX: pointX - localX * nextScale,
            offsetY: pointY - localY * nextScale,
          },
          viewport,
          image,
        )
      })
    },
    [],
  )

  const handleLightboxWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault()
      updateZoom(e.deltaY > 0 ? -IMAGE_ZOOM_STEP : IMAGE_ZOOM_STEP, {
        clientX: e.clientX,
        clientY: e.clientY,
      })
    },
    [updateZoom],
  )

  const handleLightboxPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || zoom.scale <= IMAGE_ZOOM_MIN_SCALE) return

      e.preventDefault()
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Synthetic events in tests may not have an active pointer capture.
      }

      dragStartRef.current = {
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
        offsetX: zoom.offsetX,
        offsetY: zoom.offsetY,
      }
      dragMovedRef.current = false
      setIsDragging(true)
    },
    [zoom.offsetX, zoom.offsetY, zoom.scale],
  )

  const handleLightboxPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const dragStart = dragStartRef.current
      if (!dragStart || dragStart.pointerId !== e.pointerId) return

      const deltaX = e.clientX - dragStart.clientX
      const deltaY = e.clientY - dragStart.clientY
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        dragMovedRef.current = true
      }

      setZoom((current) =>
        clampImageZoomState(
          {
            ...current,
            offsetX: dragStart.offsetX + deltaX,
            offsetY: dragStart.offsetY + deltaY,
          },
          viewportRef.current,
          lightboxImageRef.current,
        ),
      )
    },
    [],
  )

  const handleLightboxPointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const dragStart = dragStartRef.current
      if (!dragStart || dragStart.pointerId !== e.pointerId) return

      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // See setPointerCapture guard above.
      }
      dragStartRef.current = null
      setIsDragging(false)
    },
    [],
  )

  const handleLightboxClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        e.target === e.currentTarget &&
        zoom.scale <= IMAGE_ZOOM_MIN_SCALE &&
        !dragMovedRef.current
      ) {
        setOpen(false)
      }
      dragMovedRef.current = false
    },
    [zoom.scale],
  )

  const handleLightboxDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (zoom.scale > IMAGE_ZOOM_MIN_SCALE) {
        resetZoom()
        return
      }

      updateZoom(IMAGE_ZOOM_STEP * 2, {
        clientX: e.clientX,
        clientY: e.clientY,
      })
    },
    [resetZoom, updateZoom, zoom.scale],
  )

  const handleImageLoad = useCallback(() => {
    setZoom((current) =>
      clampImageZoomState(
        current,
        viewportRef.current,
        lightboxImageRef.current,
      ),
    )
  }, [])

  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    if (isDownloading) return
    setIsDownloading(true)
    let objectUrl: string | null = null
    try {
      const response = await fetch(src)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      const fileName = deriveImageDownloadFileName(src, alt, blob.type)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = fileName
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      logUI("[MarkdownRenderer] image download failed", {
        alt: label,
        srcPreview: src.slice(0, 64),
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      if (objectUrl) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(objectUrl as string)
          } catch {
            // Already revoked.
          }
        }, 0)
      }
      setIsDownloading(false)
    }
  }, [alt, isDownloading, label, src])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Open ${label} at full size`}
          className="mb-3 block w-full cursor-zoom-in overflow-hidden rounded-md border border-border bg-muted/20 p-0 text-left transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src={src}
            alt={label}
            loading="lazy"
            decoding="async"
            onError={() => {
              logUI("[MarkdownRenderer] image failed to render", {
                alt: label,
                srcPreview: src.slice(0, 64),
              })
            }}
            className="block max-h-[28rem] w-full object-contain"
          />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:p-6">
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Full-size preview of {label}
          </DialogPrimitive.Description>
          <div
            ref={viewportRef}
            className={cn(
              "relative flex h-full w-full touch-none select-none items-center justify-center overflow-hidden",
              zoom.scale > IMAGE_ZOOM_MIN_SCALE
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-zoom-in",
            )}
            onWheel={handleLightboxWheel}
            onPointerDown={handleLightboxPointerDown}
            onPointerMove={handleLightboxPointerMove}
            onPointerUp={handleLightboxPointerEnd}
            onPointerCancel={handleLightboxPointerEnd}
            onClick={handleLightboxClick}
            onDoubleClick={handleLightboxDoubleClick}
          >
            <img
              ref={lightboxImageRef}
              src={src}
              alt={label}
              className={cn(
                "block max-h-full max-w-full object-contain will-change-transform",
                !isDragging && "transition-transform duration-150 ease-out",
              )}
              style={{
                transform: `translate3d(${zoom.offsetX}px, ${zoom.offsetY}px, 0) scale(${zoom.scale})`,
              }}
              draggable={false}
              onLoad={handleImageLoad}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 z-[1] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 p-1 text-white shadow-lg backdrop-blur">
            <button
              type="button"
              className={LIGHTBOX_CONTROL_BUTTON_CLASS_NAME}
              aria-label="Zoom out image preview"
              title="Zoom out"
              disabled={zoom.scale <= IMAGE_ZOOM_MIN_SCALE}
              onClick={() => updateZoom(-IMAGE_ZOOM_STEP)}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-12 select-none px-2 text-center text-xs font-medium tabular-nums text-white/90">
              {Math.round(zoom.scale * 100)}%
            </span>
            <button
              type="button"
              className={LIGHTBOX_CONTROL_BUTTON_CLASS_NAME}
              aria-label="Zoom in image preview"
              title="Zoom in"
              disabled={zoom.scale >= IMAGE_ZOOM_MAX_SCALE}
              onClick={() => updateZoom(IMAGE_ZOOM_STEP)}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={LIGHTBOX_CONTROL_BUTTON_CLASS_NAME}
              aria-label="Reset image preview zoom"
              title="Reset"
              disabled={
                zoom.scale <= IMAGE_ZOOM_MIN_SCALE &&
                zoom.offsetX === 0 &&
                zoom.offsetY === 0
              }
              onClick={resetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="mx-1 h-5 w-px bg-white/20" aria-hidden="true" />
            <button
              type="button"
              className={LIGHTBOX_CONTROL_BUTTON_CLASS_NAME}
              aria-label="Download image"
              title="Download image"
              disabled={isDownloading}
              onClick={() => {
                void handleDownload()
              }}
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition-opacity hover:bg-black/80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const markdownImageComponent = ({
  src,
  alt,
}: {
  src?: string
  alt?: string
}) => {
  if (!src || !isAllowedMarkdownImageUrl(src)) return null

  return <ChatImage src={src} alt={alt} />
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
      const localArtifactPath = getLocalArtifactPathFromInlineText(
        extractTextContent(children),
      )
      const inlineCode = (
        <code
          className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[0.8125rem] text-current dark:bg-white/10 [overflow-wrap:anywhere]"
          {...props}
        >
          {children}
        </code>
      )
      if (localArtifactPath) {
        return (
          <LocalArtifactLink
            path={localArtifactPath}
            className="font-mono text-[0.8125rem]"
          >
            {inlineCode}
          </LocalArtifactLink>
        )
      }
      return (
        inlineCode
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
              {linkifyLocalArtifactPaths(content)}
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

const buildCollapsedMarkdownPreview = (content: string) => {
  const normalized = content
    .replace(/<think>[\s\S]*?<\/think>/gi, " Thinking ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, altText: string) => {
      const alt = altText?.trim()
      return alt ? ` Image: ${alt} ` : " Image "
    })
    .replace(/(^|[^!])\[([^\]]+)\]\([^)]+\)/g, "$1$2")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, ""),
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  if (normalized.length <= COLLAPSED_MARKDOWN_PREVIEW_CHARS) return normalized
  return `${normalized.slice(0, COLLAPSED_MARKDOWN_PREVIEW_CHARS - 3).trimEnd()}...`
}

const MarkdownRendererBase: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  collapsed,
  getThinkKey,
  isThinkExpanded,
  onToggleThink,
}) => {
  if (collapsed) {
    const preview = buildCollapsedMarkdownPreview(content)
    return (
      <div
        className={cn(COMPACT_PROSE_CLASS_NAME, className, SELECTABLE_MARKDOWN_CLASS_NAME)}
      >
        <p className="my-1 whitespace-pre-wrap leading-normal text-foreground">
          {preview}
        </p>
      </div>
    )
  }

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
                {linkifyLocalArtifactPaths(part.content)}
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
