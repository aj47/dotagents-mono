import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { Button } from "@renderer/components/ui/button"
import { ArtifactRunner } from "@renderer/components/artifact-runner"
import { ChevronLeft, RefreshCw, Trash2 } from "lucide-react"

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
    <div className="flex h-full w-full flex-col overflow-hidden">
      {!artifact ? (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <div className="text-sm font-semibold">Artifacts</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => listQuery.refetch()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No artifacts yet. Ask your agent to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/artifacts/${item.id}`)}
                    className="flex flex-col items-start gap-1 rounded-md border border-border bg-card/40 p-3 text-left hover:bg-muted/40"
                  >
                    <div className="w-full truncate text-sm font-medium">{item.title}</div>
                    <div className="w-full truncate text-[11px] text-muted-foreground">
                      v{item.currentVersion} · {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => navigate("/artifacts")}
              title="Back to all artifacts"
            >
              <ChevronLeft className="h-4 w-4" />
              All
            </Button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{artifact.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">
                {artifact.id} · v{artifact.currentVersion}
              </div>
            </div>
            <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(artifact.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {currentFiles ? (
              <ArtifactRunner
                files={currentFiles}
                onFormSubmit={handleFormSubmit}
                fill
                className="flex-1"
              />
            ) : null}
            {lastSubmission ? (
              <div className="m-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
                <div className="mb-1 font-semibold">Last form submission</div>
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(lastSubmission, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
