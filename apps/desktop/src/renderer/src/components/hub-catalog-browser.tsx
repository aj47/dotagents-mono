import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { HubCatalogItem } from "@dotagents/shared"
import { buildHubBundleInstallUrl } from "@dotagents/shared"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { copyTextToClipboard } from "@renderer/lib/clipboard"
import { tipcClient } from "@renderer/lib/tipc-client"
import { Download, Loader2, Package, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"

interface HubCatalogResponse {
  version: 1
  updatedAt: string
  items: HubCatalogItem[]
}

interface HubCatalogBrowserProps {
  onPreviewInstall: (input: {
    filePath: string
    item: HubCatalogItem
    downloadedFrom: string
  }) => void
}

function formatUpdatedAt(updatedAt: string): string {
  const parsed = new Date(updatedAt)
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown"
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function buildCountBadges(item: HubCatalogItem): string[] {
  const { componentCounts } = item
  const counts: string[] = []

  if (componentCounts.agentProfiles > 0) counts.push(`${componentCounts.agentProfiles} agents`)
  if (componentCounts.mcpServers > 0) counts.push(`${componentCounts.mcpServers} MCP`)
  if (componentCounts.skills > 0) counts.push(`${componentCounts.skills} skills`)
  if (componentCounts.repeatTasks > 0) counts.push(`${componentCounts.repeatTasks} tasks`)
  if (componentCounts.knowledgeNotes > 0) counts.push(`${componentCounts.knowledgeNotes} notes`)

  return counts
}

export function HubCatalogBrowser({ onPreviewInstall }: HubCatalogBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const catalogQuery = useQuery({
    queryKey: ["hubCatalog"],
    queryFn: async () => (await tipcClient.getHubCatalog()) as HubCatalogResponse,
    staleTime: 5 * 60 * 1000,
  })

  const previewInstallMutation = useMutation({
    mutationFn: async (item: HubCatalogItem) => {
      return await tipcClient.downloadHubCatalogBundle({
        artifactUrl: item.artifact.url,
        fileName: item.artifact.fileName,
        catalogId: item.id,
      })
    },
    onSuccess: (result, item) => {
      onPreviewInstall({
        filePath: result.filePath,
        item,
        downloadedFrom: result.downloadedFrom,
      })
      toast.success(`Prepared ${item.name} for preview`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to prepare Hub bundle: ${error.message}`)
    },
  })

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()
    const items = catalogQuery.data?.items ?? []

    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) => {
      const haystack = [
        item.name,
        item.summary,
        item.author.displayName,
        item.author.handle,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [catalogQuery.data?.items, searchTerm])

  const copyInstallLink = async (item: HubCatalogItem) => {
    try {
      await copyTextToClipboard(buildHubBundleInstallUrl(item.artifact.url))
      toast.success(`Install link copied for ${item.name}`)
    } catch {
      toast.error("Failed to copy install link")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-muted-foreground" />
              Community Hub
            </div>
            <p className="text-sm text-muted-foreground">
              Browse curated starter bundles from the DotAgents Hub and preview them in the existing conflict-aware import flow.
            </p>
            <p className="text-xs text-muted-foreground">
              Catalog updated: {catalogQuery.data ? formatUpdatedAt(catalogQuery.data.updatedAt) : "Loading..."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-8"
                placeholder="Search bundles, tags, or authors"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void catalogQuery.refetch()}
              disabled={catalogQuery.isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${catalogQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {catalogQuery.isLoading ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 font-medium text-foreground/80">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span>Loading Hub catalog...</span>
          </div>
        </div>
      ) : catalogQuery.isError ? (
        <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-5 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load the Hub catalog.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {catalogQuery.error instanceof Error ? catalogQuery.error.message : "Please try again."}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center">
          <p className="text-sm font-medium">No bundles match that search.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another keyword or clear the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredItems.map((item) => {
            const isPreparing = previewInstallMutation.isPending && previewInstallMutation.variables?.id === item.id

            return (
              <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{item.name}</h3>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        bundle
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {formatUpdatedAt(item.updatedAt)}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {buildCountBadges(item).map((label) => (
                    <Badge key={label} variant="outline" className="text-[10px]">
                      {label}
                    </Badge>
                  ))}
                </div>

                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{item.author.displayName}</span>
                    {item.author.handle ? ` • ${item.author.handle}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => void copyInstallLink(item)}
                    >
                      Copy Install Link
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => previewInstallMutation.mutate(item)}
                      disabled={previewInstallMutation.isPending}
                    >
                      {isPreparing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {isPreparing ? "Preparing..." : "Preview Install"}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
