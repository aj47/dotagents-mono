import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { Button } from "@renderer/components/ui/button"
import { ArtifactRunner } from "@renderer/components/artifact-runner"
import { cn } from "@renderer/lib/utils"
import { Trash2, RefreshCw, ExternalLink } from "lucide-react"

const ARTIFACTS_LIST_KEY = ["artifacts", "list"] as const

function useArtifactsList() {
  return useQuery({
    queryKey: ARTIFACTS_LIST_KEY,
    queryFn: async () => (await tipcClient.listArtifacts()) ?? [],
    refetchOnWindowFocus: false,
  })
}

function useArtifact(id: string | undefined) {
  return useQuery({
    queryKey: ["artifacts", "get", id] as const,
    queryFn: async () => (id ? await tipcClient.getArtifact({ id }) : null),
    enabled: !!id,
    refetchOnWindowFocus: false,
  })
}

export const Component = () => {
  const params = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listQuery = useArtifactsList()
  const artifactQuery = useArtifact(params.id)
  const [lastSubmission, setLastSubmission] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const unlistenChanged = rendererHandlers.artifactsChanged.listen(() => {
      queryClient.invalidateQueries({ queryKey: ["artifacts"] })
    })
    const unlistenOpen = rendererHandlers.openArtifact.listen((data) => {
      navigate(`/artifacts/${data.id}`)
    })
    return () => {
      unlistenChanged()
      unlistenOpen()
    }
  }, [navigate, queryClient])

  const items = listQuery.data ?? []
  const artifact = artifactQuery.data ?? null
  const currentFiles = useMemo(() => {
    if (!artifact) return null
    const current =
      artifact.versions.find((v) => v.version === artifact.currentVersion) ??
      artifact.versions[artifact.versions.length - 1]
    return current?.files ?? null
  }, [artifact])

  const handleDelete = useCallback(
    async (id: string) => {
      await tipcClient.deleteArtifact({ id })
      if (params.id === id) navigate("/artifacts")
      queryClient.invalidateQueries({ queryKey: ["artifacts"] })
    },
    [navigate, params.id, queryClient],
  )

  const handleFormSubmit = useCallback((payload: Record<string, unknown>) => {
    setLastSubmission(payload)
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-border bg-card/40">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Artifacts</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => listQuery.refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground">
              No artifacts yet. Ask your agent to create one.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/artifacts/${item.id}`)}
                className={cn(
                  "flex w-full items-start gap-2 border-b border-border/60 px-3 py-2 text-left hover:bg-muted/40",
                  params.id === item.id && "bg-muted/70",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    v{item.currentVersion} · {new Date(item.updatedAt).toLocaleString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {!artifact ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select an artifact or ask your agent to create one.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{artifact.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {artifact.id} · v{artifact.currentVersion}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(artifact.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {currentFiles ? (
                <ArtifactRunner files={currentFiles} onFormSubmit={handleFormSubmit} />
              ) : null}
              {lastSubmission ? (
                <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs">
                  <div className="mb-1 font-semibold">Last form submission</div>
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(lastSubmission, null, 2)}</pre>
                </div>
              ) : null}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
