import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Copy,
  ExternalLink,
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

function ArtifactPreview({ artifact }: { artifact: ArtifactRecord }) {
  const textQuery = useQuery({
    queryKey: ["artifact-text", artifact.id],
    queryFn: async () => tipcClient.readArtifactText({ id: artifact.id }),
    enabled: artifact.canReadText,
  })

  if (artifact.kind === "url") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="bg-muted/20 w-full max-w-xl rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium">{artifact.name}</h3>
              <p className="text-muted-foreground mt-1 break-all text-xs">
                {artifact.url}
              </p>
              {artifact.excerpt && (
                <p className="text-muted-foreground mt-3 text-sm">
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
    if (artifact.kind === "markdown") {
      return (
        <div className="min-h-0 flex-1 overflow-auto p-4">
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
        <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
          {content}
        </pre>
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

  const artifactsQuery = useQuery<ArtifactListResponse>({
    queryKey: ["artifacts", query, kind],
    queryFn: async () =>
      tipcClient.listArtifacts({
        query,
        kind,
        limit: 500,
        maxConversations: 200,
      }),
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold">Artifacts</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Files and links referenced by agent conversations and tool
              results. {scanSummary}.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => artifactsQuery.refetch()}
            disabled={artifactsQuery.isFetching}
          >
            {artifactsQuery.isFetching ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="relative min-w-[16rem] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search artifacts..."
              className="h-8 pl-8"
            />
          </label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as ArtifactKind | "all")}
          >
            <SelectTrigger className="h-8 w-[10rem]">
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

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
        <div className="min-h-0 border-r">
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
            <div className="h-full overflow-auto">
              {artifacts.map((artifact) => {
                const active = selectedArtifact?.id === artifact.id
                return (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => setSelectedId(artifact.id)}
                    className={cn(
                      "flex w-full items-start gap-2 border-b px-3 py-2 text-left transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <KindIcon
                      kind={artifact.kind}
                      className="text-muted-foreground mt-0.5 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {artifact.name}
                      </span>
                      <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                        <span className="truncate">
                          {artifact.conversationTitle}
                        </span>
                        {artifact.sizeBytes !== undefined && (
                          <span>{formatBytes(artifact.sizeBytes)}</span>
                        )}
                        <span>{formatTimestamp(artifact.updatedAt)}</span>
                      </span>
                      {artifact.excerpt && (
                        <span className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                          {artifact.excerpt}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          {selectedArtifact ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
                <KindIcon
                  kind={selectedArtifact.kind}
                  className="text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">
                      {selectedArtifact.name}
                    </h2>
                    <Badge variant="secondary" className="shrink-0">
                      {kindLabel[selectedArtifact.kind]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-0.5 truncate text-xs">
                    {selectedArtifact.normalizedReference}
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
              <div className="text-muted-foreground flex shrink-0 items-center gap-2 border-b px-4 py-1.5 text-xs">
                <button
                  className="hover:text-foreground truncate"
                  onClick={() =>
                    navigate(`/${selectedArtifact.conversationId}`)
                  }
                >
                  {selectedArtifact.conversationTitle}
                </button>
                <span>/{selectedArtifact.source}</span>
                {selectedArtifact.messageTimestamp && (
                  <span>
                    {formatTimestamp(selectedArtifact.messageTimestamp)}
                  </span>
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
