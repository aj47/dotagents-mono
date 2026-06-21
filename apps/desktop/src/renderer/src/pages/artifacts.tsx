import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Copy,
  ExternalLink,
  Eye,
  File,
  FileCode2,
  FileImage,
  FileText,
  FolderOpen,
  Loader2,
  Music,
  RefreshCw,
  Search,
  Video,
} from "lucide-react"
import type {
  ArtifactKind,
  ArtifactListResponse,
  ArtifactRecord,
} from "@shared/types"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import { Badge } from "@renderer/components/ui/badge"
import { MarkdownRenderer } from "@renderer/components/markdown-renderer"
import { useResizable } from "@renderer/hooks/use-resizable"
import { cn } from "@renderer/lib/utils"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"

const KIND_OPTIONS: Array<{ label: string; value: ArtifactKind | "all" }> = [
  { label: "All", value: "all" },
  { label: "Markdown", value: "markdown" },
  { label: "Text", value: "text" },
  { label: "HTML", value: "html" },
  { label: "Images", value: "image" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "PDF", value: "pdf" },
  { label: "URLs", value: "url" },
  { label: "Files", value: "file" },
  { label: "Unknown", value: "unknown" },
]

const kindLabel: Record<ArtifactKind, string> = {
  markdown: "Markdown",
  text: "Text",
  html: "HTML",
  image: "Image",
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  url: "URL",
  file: "File",
  unknown: "Unknown",
}

type JsonPreview =
  | { type: "json"; formatted: string }
  | {
      type: "jsonl"
      records: Array<{ line: number; formatted: string }>
      invalidLine?: number
    }
  | { type: "raw"; error?: string }

const ARTIFACT_LIST_WIDTH_DEFAULT = 360
const ARTIFACT_LIST_WIDTH_MIN = 288
const ARTIFACT_LIST_WIDTH_MAX = 720
const COMPACT_PREVIEW_HEIGHT_DEFAULT = 260
const COMPACT_PREVIEW_HEIGHT_MIN = 144
const COMPACT_PREVIEW_HEIGHT_MAX = 560

function getArtifactExtension(artifact: ArtifactRecord): string {
  const candidates = [
    artifact.localPath,
    artifact.name,
    artifact.normalizedReference,
    artifact.originalReference,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const normalized = candidate!.split(/[?#]/, 1)[0]
    const match = normalized.match(/\.([a-z0-9]+)$/i)
    if (match) return match[1].toLowerCase()
  }
  return ""
}

function getJsonPreview(artifact: ArtifactRecord, content: string): JsonPreview {
  const extension = getArtifactExtension(artifact)

  if (extension === "json") {
    try {
      return {
        type: "json",
        formatted: JSON.stringify(JSON.parse(content), null, 2),
      }
    } catch (error) {
      return {
        type: "raw",
        error: error instanceof Error ? error.message : "Invalid JSON",
      }
    }
  }

  if (extension !== "jsonl") return { type: "raw" }

  const records: Array<{ line: number; formatted: string }> = []
  const lines = content.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line) continue
    try {
      records.push({
        line: index + 1,
        formatted: JSON.stringify(JSON.parse(line), null, 2),
      })
    } catch {
      return { type: "jsonl", records, invalidLine: index + 1 }
    }
  }
  return { type: "jsonl", records }
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
}

function KindIcon({
  kind,
  className,
}: {
  kind: ArtifactKind
  className?: string
}) {
  const iconClassName = cn("h-4 w-4", className)
  if (kind === "image") return <FileImage className={iconClassName} />
  if (kind === "video") return <Video className={iconClassName} />
  if (kind === "audio") return <Music className={iconClassName} />
  if (kind === "markdown" || kind === "text" || kind === "pdf")
    return <FileText className={iconClassName} />
  if (kind === "html") return <FileCode2 className={iconClassName} />
  return <File className={iconClassName} />
}

function formatBytes(bytes?: number): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatTimestamp(timestamp?: number): string {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return ""
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getArtifactSummary(artifact: ArtifactRecord): string {
  return artifact.localPath ?? artifact.excerpt ?? artifact.url ?? ""
}

function getArtifactMeta(artifact: ArtifactRecord): string {
  return [
    kindLabel[artifact.kind],
    artifact.conversationTitle || "Untitled session",
    artifact.sizeBytes !== undefined ? formatBytes(artifact.sizeBytes) : "",
    formatTimestamp(artifact.updatedAt),
  ]
    .filter(Boolean)
    .join(" / ")
}

function JsonArtifactPreview({
  preview,
  content,
}: {
  preview: JsonPreview
  content: string
}) {
  if (preview.type === "json") {
    return (
      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
        {preview.formatted}
      </pre>
    )
  }

  if (preview.type === "jsonl" && preview.records.length > 0) {
    return (
      <div className="space-y-2">
        {preview.records.map((record) => (
          <details
            key={record.line}
            className="rounded-md border bg-background/70"
          >
            <summary className="text-muted-foreground cursor-pointer px-2 py-1 text-[11px]">
              Line {record.line}
            </summary>
            <pre className="border-t px-2 py-2 text-xs leading-relaxed">
              {record.formatted}
            </pre>
          </details>
        ))}
        {preview.invalidLine !== undefined && (
          <div className="text-destructive text-xs">
            JSONL parsing stopped at line {preview.invalidLine}; showing parsed
            records above.
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {preview.type === "jsonl" && preview.invalidLine !== undefined && (
        <div className="text-destructive mb-3 text-xs">
          Could not parse JSONL line {preview.invalidLine}; showing raw text.
        </div>
      )}
      {preview.type === "raw" && preview.error && (
        <div className="text-destructive mb-3 text-xs">
          Could not parse JSON: {preview.error}
        </div>
      )}
      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
        {content}
      </pre>
    </>
  )
}

function ArtifactRowThumbnail({ artifact }: { artifact: ArtifactRecord }) {
  if (artifact.kind !== "image" || !artifact.previewUrl) {
    return (
      <KindIcon kind={artifact.kind} className="text-muted-foreground shrink-0" />
    )
  }

  return (
    <span className="bg-muted/30 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border">
      <img
        src={artifact.previewUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </span>
  )
}

function ArtifactPreview({ artifact }: { artifact: ArtifactRecord }) {
  const textQuery = useQuery({
    queryKey: ["artifact-text", artifact.id],
    queryFn: async () => tipcClient.readArtifactText({ id: artifact.id }),
    enabled: artifact.canReadText,
  })

  if (artifact.kind === "url" || (artifact.url && !artifact.previewUrl)) {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4">
        <div className="bg-muted/20 w-full rounded-md border p-3">
          <div className="flex items-start gap-3">
            <ExternalLink className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium">{artifact.name}</h3>
              <p className="text-muted-foreground mt-1 break-all text-xs">
                {artifact.url}
              </p>
              {artifact.excerpt && (
                <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
                  {artifact.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (artifact.kind === "image" && artifact.previewUrl) {
    return (
      <div className="bg-muted/20 flex min-h-0 flex-1 items-center justify-center p-3">
        <img
          src={artifact.previewUrl}
          alt={artifact.name}
          className="max-h-full max-w-full rounded border object-contain"
        />
      </div>
    )
  }

  if (artifact.kind === "video" && artifact.previewUrl) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-3">
        <video
          src={artifact.previewUrl}
          controls
          playsInline
          preload="metadata"
          className="max-h-full max-w-full"
        />
      </div>
    )
  }

  if (artifact.kind === "audio" && artifact.previewUrl) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <audio src={artifact.previewUrl} controls className="w-full max-w-xl" />
      </div>
    )
  }

  if (
    (artifact.kind === "pdf" || artifact.kind === "html") &&
    artifact.previewUrl
  ) {
    return (
      <iframe
        src={artifact.previewUrl}
        title={artifact.name}
        sandbox={artifact.kind === "html" ? "" : undefined}
        className="bg-background min-h-0 flex-1 border-0"
      />
    )
  }

  if (artifact.canReadText) {
    if (textQuery.isLoading) {
      return (
        <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading preview
        </div>
      )
    }

    if (textQuery.isError) {
      return (
        <div className="text-destructive p-4 text-sm">
          Unable to read this artifact preview.
        </div>
      )
    }

    const content = textQuery.data?.content ?? ""
    const jsonPreview = getJsonPreview(artifact, content)
    if (artifact.kind === "markdown") {
      return (
        <div className="artifact-preview min-h-0 flex-1 overflow-auto p-4 [&_.prose]:!text-xs [&_.prose_h1]:!text-base [&_.prose_h2]:!text-sm [&_.prose_h3]:!text-xs [&_.prose_p]:!leading-relaxed [&_.prose_pre]:!text-[11px]">
          <MarkdownRenderer content={content} />
          {textQuery.data?.truncated && (
            <div className="text-muted-foreground mt-3 text-xs">
              Preview truncated.
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <JsonArtifactPreview preview={jsonPreview} content={content} />
        {textQuery.data?.truncated && (
          <div className="text-muted-foreground mt-3 text-xs">
            Preview truncated.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm">
      Preview unavailable for this artifact type.
    </div>
  )
}

export const Component = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<ArtifactKind | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCompactPreview, setShowCompactPreview] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const consumedRefreshNonce = useRef(0)
  const debouncedQuery = useDebouncedValue(query.trim(), 200)
  const {
    width: listWidth,
    isResizing: isListResizing,
    handleWidthResizeStart,
  } = useResizable({
    initialWidth: ARTIFACT_LIST_WIDTH_DEFAULT,
    minWidth: ARTIFACT_LIST_WIDTH_MIN,
    maxWidth: ARTIFACT_LIST_WIDTH_MAX,
    storageKey: "artifacts-list-panel",
  })
  const {
    height: compactPreviewHeight,
    isResizing: isCompactPreviewResizing,
    handleHeightResizeStart,
  } = useResizable({
    initialHeight: COMPACT_PREVIEW_HEIGHT_DEFAULT,
    minHeight: COMPACT_PREVIEW_HEIGHT_MIN,
    maxHeight: COMPACT_PREVIEW_HEIGHT_MAX,
    storageKey: "artifacts-compact-preview",
  })

  const artifactsQuery = useQuery<ArtifactListResponse>({
    queryKey: ["artifacts", debouncedQuery, kind, refreshNonce],
    queryFn: async () => {
      const forceRefresh = refreshNonce > consumedRefreshNonce.current
      consumedRefreshNonce.current = refreshNonce
      return tipcClient.listArtifacts({
        query: debouncedQuery,
        kind,
        limit: 500,
        maxConversations: 200,
        forceRefresh,
      })
    },
    refetchOnWindowFocus: false,
  })

  const artifacts = artifactsQuery.data?.artifacts ?? []
  const scanSummary = artifactsQuery.data
    ? `Scanned ${artifactsQuery.data.scannedConversationCount.toLocaleString()} of ${artifactsQuery.data.totalConversationCount.toLocaleString()} conversations`
    : "Scanning recent conversations"
  const selectedArtifact = useMemo(() => {
    if (selectedId) {
      const selected = artifacts.find((artifact) => artifact.id === selectedId)
      if (selected) return selected
    }
    return artifacts[0] ?? null
  }, [artifacts, selectedId])

  const handleCopy = async (artifact: ArtifactRecord) => {
    await tipcClient.writeClipboard({
      text: artifact.localPath ?? artifact.url ?? artifact.originalReference,
    })
    toast.success("Artifact reference copied")
  }

  const handleOpen = async (artifact: ArtifactRecord) => {
    await tipcClient.openArtifact({ id: artifact.id })
  }

  const handleReveal = async (artifact: ArtifactRecord) => {
    await tipcClient.showArtifactInFolder({ id: artifact.id })
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold leading-none">Artifacts</h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Conversation files and links. {scanSummary}.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshNonce((value) => value + 1)}
            disabled={artifactsQuery.isFetching}
            className="border"
          >
            {artifactsQuery.isFetching ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[18rem] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artifacts..."
              className="h-8 rounded-md pl-8"
            />
          </label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as ArtifactKind | "all")}
          >
            <SelectTrigger className="h-8 w-[9rem] rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(18rem,var(--artifact-list-width))_minmax(0,1fr)] xl:grid-rows-1",
          showCompactPreview
            ? "grid-rows-[var(--artifact-compact-preview-height)_minmax(0,1fr)]"
            : "grid-rows-1",
        )}
        style={
          {
            "--artifact-list-width": `${listWidth}px`,
            "--artifact-compact-preview-height": `${compactPreviewHeight}px`,
          } as CSSProperties
        }
      >
        <div className="relative flex min-h-0 flex-col border-r">
          {selectedArtifact && (
            <div className="bg-muted/20 flex shrink-0 items-center gap-2 border-b px-4 py-2 xl:hidden">
              <KindIcon
                kind={selectedArtifact.kind}
                className="text-muted-foreground shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">
                  {selectedArtifact.name}
                </div>
                <div className="text-muted-foreground truncate text-[11px]">
                  {kindLabel[selectedArtifact.kind]} /{" "}
                  {selectedArtifact.conversationTitle || "Untitled session"}
                </div>
              </div>
              <Button
                variant={showCompactPreview ? "secondary" : "ghost"}
                size="sm-icon"
                title="Toggle preview"
                aria-label="Toggle preview"
                onClick={() => setShowCompactPreview((value) => !value)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm-icon"
                title="Copy reference"
                aria-label="Copy reference"
                onClick={() => void handleCopy(selectedArtifact)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {selectedArtifact.canReveal && (
                <Button
                  variant="ghost"
                  size="sm-icon"
                  title="Reveal in folder"
                  aria-label="Reveal in folder"
                  onClick={() => void handleReveal(selectedArtifact)}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              )}
              {selectedArtifact.canOpen && (
                <Button
                  variant="ghost"
                  size="sm-icon"
                  title="Open artifact"
                  aria-label="Open artifact"
                  onClick={() => void handleOpen(selectedArtifact)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {artifactsQuery.isLoading ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading artifacts
            </div>
          ) : artifacts.length === 0 ? (
            <div className="text-muted-foreground p-4 text-sm">
              No artifacts found.
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              {artifacts.map((artifact) => {
                const active = selectedArtifact?.id === artifact.id
                const summary = getArtifactSummary(artifact)
                return (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => setSelectedId(artifact.id)}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 border-b px-4 text-left transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <ArtifactRowThumbnail artifact={artifact} />
                    <span className="grid min-w-0 flex-1 grid-cols-[minmax(8rem,1fr)_minmax(7rem,0.8fr)] items-center gap-3 md:grid-cols-[minmax(9rem,0.9fr)_minmax(8rem,0.75fr)_minmax(0,1.35fr)]">
                      <span className="truncate text-sm font-semibold">
                        {artifact.name}
                      </span>
                      <span className="text-muted-foreground truncate text-[11px]">
                        {getArtifactMeta(artifact)}
                      </span>
                      <span className="text-muted-foreground hidden truncate text-xs md:block">
                        {summary}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div
            role="separator"
            aria-orientation="vertical"
            title="Drag to resize artifact list"
            className={cn(
              "absolute right-0 top-0 z-10 hidden h-full w-1 cursor-col-resize transition-colors xl:block",
              isListResizing ? "bg-primary/50" : "hover:bg-primary/30",
            )}
            onMouseDown={handleWidthResizeStart}
          />
        </div>

        <div
          className={cn(
            "bg-muted/10 relative min-h-0 min-w-0 flex-col border-t xl:flex xl:border-t-0",
            showCompactPreview ? "flex" : "hidden",
          )}
          style={
            showCompactPreview
              ? { height: "var(--artifact-compact-preview-height)" }
              : undefined
          }
        >
          <div
            role="separator"
            aria-orientation="horizontal"
            title="Drag to resize preview"
            className={cn(
              "absolute left-0 top-0 z-10 h-1 w-full cursor-row-resize transition-colors xl:hidden",
              isCompactPreviewResizing ? "bg-primary/50" : "hover:bg-primary/30",
            )}
            onMouseDown={handleHeightResizeStart}
          />
          {selectedArtifact ? (
            <>
              <div className="bg-background flex shrink-0 items-start gap-2 border-b px-3 py-2">
                <KindIcon
                  kind={selectedArtifact.kind}
                  className="text-muted-foreground mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start gap-2">
                    <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {selectedArtifact.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-md px-1.5 py-0 text-[10px]"
                    >
                      {kindLabel[selectedArtifact.kind]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1 line-clamp-2 break-all text-[11px]">
                    {selectedArtifact.normalizedReference}
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
                    <button
                      className="hover:text-foreground min-w-0 truncate"
                      onClick={() =>
                        navigate(`/${selectedArtifact.conversationId}`)
                      }
                    >
                      {selectedArtifact.conversationTitle || "Untitled session"}
                    </button>
                    <span className="shrink-0">
                      / {selectedArtifact.source}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm-icon"
                  title="Copy reference"
                  aria-label="Copy reference"
                  onClick={() => void handleCopy(selectedArtifact)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {selectedArtifact.canReveal && (
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    title="Reveal in folder"
                    aria-label="Reveal in folder"
                    onClick={() => void handleReveal(selectedArtifact)}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                )}
                {selectedArtifact.canOpen && (
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    title="Open artifact"
                    aria-label="Open artifact"
                    onClick={() => void handleOpen(selectedArtifact)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <ArtifactPreview artifact={selectedArtifact} />
            </>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Select an artifact.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
