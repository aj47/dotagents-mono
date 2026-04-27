import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { queryClient } from "@renderer/lib/queries"
import { Button } from "./ui/button"
import { ArtifactRunner } from "./artifact-runner"

interface ArtifactPreviewProps {
  id: string
  /** Max iframe height in px when expanded. Defaults to 480. */
  maxHeight?: number
}

/**
 * Inline renderer for an artifact id, intended to appear right under the
 * create_artifact / update_artifact tool call in a session transcript.
 *
 * Collapsible so it doesn't dominate the conversation; an "Open" button
 * navigates to the full /artifacts/:id view.
 */
export function ArtifactPreview({ id, maxHeight = 480 }: ArtifactPreviewProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ["artifacts", "get", id] as const,
    queryFn: async () => (await tipcClient.getArtifact({ id })) ?? null,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const unlisten = rendererHandlers.artifactsChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["artifacts", "get", id] })
    })
    return () => {
      unlisten()
    }
  }, [id])

  const currentFiles = useMemo(() => {
    if (!data) return null
    const current =
      data.versions.find((v) => v.version === data.currentVersion) ??
      data.versions[data.versions.length - 1]
    return current?.files ?? null
  }, [data])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/artifacts/${id}`)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((v) => !v)
  }

  if (isLoading && !data) {
    return (
      <div className="mt-2 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 text-[11px] text-muted-foreground">
        Loading artifact…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mt-2 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 text-[11px] text-muted-foreground">
        Artifact not found: {id}
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-md border border-border/40 bg-card/40">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onClick={handleToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          title={expanded ? "Collapse preview" : "Expand preview"}
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{data.title}</div>
            <div className="text-[10px] text-muted-foreground">
              v{data.currentVersion} · artifact
            </div>
          </div>
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 gap-1 px-2 text-[11px]"
          onClick={handleOpen}
          title="Open in Artifacts page"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </Button>
      </div>
      {expanded && currentFiles ? (
        <div className="border-t border-border/40 p-1.5">
          <ArtifactRunner files={currentFiles} maxHeight={maxHeight} />
        </div>
      ) : null}
    </div>
  )
}
