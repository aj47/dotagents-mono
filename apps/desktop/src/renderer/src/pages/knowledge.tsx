import { useEffect, useMemo, useState } from "react"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Badge } from "@renderer/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { Textarea } from "@renderer/components/ui/textarea"
import { Label } from "@renderer/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select"
import { tipcClient } from "@renderer/lib/tipc-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteDateFilter,
  KnowledgeNoteGroupSummary,
  KnowledgeNoteSort,
  KnowledgeNotesOverview,
} from "@shared/types"
import { toast } from "sonner"
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  FolderUp,
  Loader2,
  MinusSquare,
  Pencil,
  Search,
  Square,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { buildKnowledgeNoteSections } from "@dotagents/shared/knowledge-note-grouping"
import {
  formatKnowledgeNoteReferencesInput,
  formatKnowledgeNoteTagsInput,
  parseKnowledgeNoteReferencesInput,
  parseKnowledgeNoteTagsInput,
} from "@dotagents/shared/knowledge-note-form"

const contextBadgeClasses: Record<KnowledgeNoteContext, string> = {
  auto: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "search-only": "bg-slate-500/20 text-slate-700 dark:text-slate-300",
}

const contextFilterOptions: { label: string; value: "all" | KnowledgeNoteContext }[] = [
  { label: "All", value: "all" },
  { label: "Search only", value: "search-only" },
  { label: "Auto", value: "auto" },
]

const dateFilterOptions: { label: string; value: KnowledgeNoteDateFilter }[] = [
  { label: "Any time", value: "all" },
  { label: "Past 7 days", value: "7d" },
  { label: "Past 30 days", value: "30d" },
  { label: "Past 90 days", value: "90d" },
  { label: "Past year", value: "year" },
]

const sortOptions: { label: string; value: KnowledgeNoteSort }[] = [
  { label: "Best match", value: "relevance" },
  { label: "Updated newest", value: "updated-desc" },
  { label: "Updated oldest", value: "updated-asc" },
  { label: "Created newest", value: "created-desc" },
  { label: "Created oldest", value: "created-asc" },
  { label: "Title A-Z", value: "title-asc" },
  { label: "Title Z-A", value: "title-desc" },
]

type KnowledgeViewMode = "grouped" | "flat"

type EditFormState = {
  title: string
  context: KnowledgeNoteContext
  summary: string
  body: string
  tagsInput: string
  referencesInput: string
}

const summarizeNote = (note: KnowledgeNote) => (note.summary?.trim() || note.body.trim()).slice(0, 140)
const toEditForm = (note: KnowledgeNote): EditFormState => ({
  title: note.title,
  context: note.context,
  summary: note.summary ?? "",
  body: note.body,
  tagsInput: formatKnowledgeNoteTagsInput(note.tags),
  referencesInput: formatKnowledgeNoteReferencesInput(note.references),
})

function KnowledgeNoteCard({
  note,
  onDelete,
  onEdit,
  onPromoteToAuto,
  isPromotingToAuto,
  isSelected,
  onToggleSelect,
}: {
  note: KnowledgeNote
  onDelete: (id: string) => void
  onEdit: (note: KnowledgeNote) => void
  onPromoteToAuto: (id: string) => void
  isPromotingToAuto: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const formattedDate = new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  )

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-all duration-200 hover:bg-accent/5",
        isSelected && "ring-2 ring-primary/50",
      )}
    >
      <div
        className="flex cursor-pointer flex-wrap items-start gap-2 px-3 py-2 sm:flex-nowrap"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          className="mt-0.5 text-muted-foreground hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            onToggleSelect(note.id)
          }}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>

        <button className="mt-0.5 text-muted-foreground hover:text-foreground">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 max-w-full truncate text-sm font-medium">{note.title}</h3>
            <Badge className={cn("px-1.5 py-0 text-[10px]", contextBadgeClasses[note.context])}>
              {note.context}
            </Badge>
            <span className="flex basis-full items-center gap-1 text-[11px] text-muted-foreground sm:basis-auto">
              <Calendar className="h-3 w-3" />
              Updated {formattedDate}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{summarizeNote(note)}</p>
        </div>

        <div className="ml-8 flex w-full items-center justify-end gap-1 sm:ml-0 sm:w-auto sm:justify-start">
          {note.context === "search-only" ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              onClick={(event) => {
                event.stopPropagation()
                onPromoteToAuto(note.id)
              }}
              disabled={isPromotingToAuto}
            >
              {isPromotingToAuto ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Promote to auto
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(note)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(note.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded ? (
        <div className="ml-7 space-y-3 border-t px-3 pb-3 pt-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            {note.references?.length ? (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {note.references.length} reference{note.references.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {note.context === "auto"
              ? "This note is prioritized for automatic context selection, but not every auto note is included in every run. Keep auto notes to a small, high-signal set."
              : "Search-only notes are only used when retrieved. Promote to auto only when this note should be prioritized for automatic context selection."}
          </p>

          {note.summary ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Summary</h4>
              <p className="whitespace-pre-wrap text-sm">{note.summary}</p>
            </div>
          ) : null}

          <div>
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Body</h4>
            <p className="whitespace-pre-wrap text-sm">{note.body}</p>
          </div>

          {note.tags.length ? (
            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Tag className="h-3 w-3" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {note.references?.length ? (
            <div>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <FileText className="h-3 w-3" />
                References
              </h4>
              <ul className="space-y-1">
                {note.references.map((reference) => (
                  <li key={reference} className="break-all text-sm text-muted-foreground">
                    {reference}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function GroupPanel({
  group,
  contextFilter,
  dateFilter,
  sortOption,
  isCollapsed,
  onToggleCollapse,
  collapsedSeriesKeys,
  onToggleSeriesCollapse,
  onNotesLoaded,
  selectedIds,
  onToggleSelect,
  onDelete,
  onEdit,
  onPromoteToAuto,
  promotingNoteId,
  isPromoteToAutoPending,
}: {
  group: KnowledgeNoteGroupSummary
  contextFilter: KnowledgeNoteContext | undefined
  dateFilter: KnowledgeNoteDateFilter
  sortOption: KnowledgeNoteSort
  isCollapsed: boolean
  onToggleCollapse: () => void
  collapsedSeriesKeys: Set<string>
  onToggleSeriesCollapse: (key: string) => void
  onNotesLoaded: (notes: KnowledgeNote[]) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (note: KnowledgeNote) => void
  onPromoteToAuto: (id: string) => void
  promotingNoteId: string | null
  isPromoteToAutoPending: boolean
}) {
  // Only fetch the group's notes once it's expanded. React Query caches across expand/collapse.
  const notesQuery = useQuery({
    queryKey: ["knowledgeNotesByGroup", group.key, contextFilter ?? "all", dateFilter, sortOption],
    queryFn: async () =>
      tipcClient.getKnowledgeNotesByGroup({
        groupKey: group.key,
        context: contextFilter,
        dateFilter,
        sort: sortOption,
      }),
    enabled: !isCollapsed,
  })

  useEffect(() => {
    if (notesQuery.data) onNotesLoaded(notesQuery.data)
  }, [notesQuery.data])

  const directNotes = notesQuery.data ?? []

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-medium text-foreground hover:bg-accent/40"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span>{group.label}</span>
        <Badge variant="secondary" className="text-[10px]">
          {group.totalCount}
        </Badge>
      </button>

      {isCollapsed ? null : notesQuery.isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {directNotes.map((note) => (
              <KnowledgeNoteCard
                key={note.id}
                note={note}
                onDelete={onDelete}
                onEdit={onEdit}
                onPromoteToAuto={onPromoteToAuto}
                isPromotingToAuto={promotingNoteId === note.id && isPromoteToAutoPending}
                isSelected={selectedIds.has(note.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>

          {group.seriesSummaries.map((series) => (
            <SeriesPanel
              key={series.key}
              groupKey={group.key}
              series={series}
              contextFilter={contextFilter}
              dateFilter={dateFilter}
              sortOption={sortOption}
              isCollapsed={collapsedSeriesKeys.has(series.key)}
              onToggleCollapse={() => onToggleSeriesCollapse(series.key)}
              onNotesLoaded={onNotesLoaded}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onDelete={onDelete}
              onEdit={onEdit}
              onPromoteToAuto={onPromoteToAuto}
              promotingNoteId={promotingNoteId}
              isPromoteToAutoPending={isPromoteToAutoPending}
            />
          ))}
        </>
      )}
    </div>
  )
}

function SeriesPanel({
  groupKey,
  series,
  contextFilter,
  dateFilter,
  sortOption,
  isCollapsed,
  onToggleCollapse,
  onNotesLoaded,
  selectedIds,
  onToggleSelect,
  onDelete,
  onEdit,
  onPromoteToAuto,
  promotingNoteId,
  isPromoteToAutoPending,
}: {
  groupKey: string
  series: { key: string; label: string; count: number }
  contextFilter: KnowledgeNoteContext | undefined
  dateFilter: KnowledgeNoteDateFilter
  sortOption: KnowledgeNoteSort
  isCollapsed: boolean
  onToggleCollapse: () => void
  onNotesLoaded: (notes: KnowledgeNote[]) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (note: KnowledgeNote) => void
  onPromoteToAuto: (id: string) => void
  promotingNoteId: string | null
  isPromoteToAutoPending: boolean
}) {
  const notesQuery = useQuery({
    queryKey: ["knowledgeNotesByGroup", groupKey, series.key, contextFilter ?? "all", dateFilter, sortOption],
    queryFn: async () =>
      tipcClient.getKnowledgeNotesByGroup({
        groupKey,
        seriesKey: series.key,
        context: contextFilter,
        dateFilter,
        sort: sortOption,
      }),
    enabled: !isCollapsed,
  })

  useEffect(() => {
    if (notesQuery.data) onNotesLoaded(notesQuery.data)
  }, [notesQuery.data])

  return (
    <div className="space-y-2 rounded-lg border border-dashed bg-muted/10 p-2">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
        onClick={onToggleCollapse}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        <FolderUp className="h-3.5 w-3.5" />
        <span>{series.label}</span>
        <Badge variant="secondary" className="text-[10px]">
          {series.count}
        </Badge>
      </button>

      {isCollapsed ? null : notesQuery.isLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {(notesQuery.data ?? []).map((note) => (
            <KnowledgeNoteCard
              key={note.id}
              note={note}
              onDelete={onDelete}
              onEdit={onEdit}
              onPromoteToAuto={onPromoteToAuto}
              isPromotingToAuto={promotingNoteId === note.id && isPromoteToAutoPending}
              isSelected={selectedIds.has(note.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Component() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [contextFilter, setContextFilter] = useState<"all" | KnowledgeNoteContext>("all")
  const [dateFilter, setDateFilter] = useState<KnowledgeNoteDateFilter>("all")
  const [sortOption, setSortOption] = useState<KnowledgeNoteSort>("relevance")
  const [viewMode, setViewMode] = useState<KnowledgeViewMode>("grouped")
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(new Set())
  const [collapsedSeriesKeys, setCollapsedSeriesKeys] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [promotingNoteId, setPromotingNoteId] = useState<string | null>(null)

  // Notes loaded into memory via expanded group panels — keyed by note id.
  // Used for selection, promote, and bulk operations.
  const [loadedNotesById, setLoadedNotesById] = useState<Map<string, KnowledgeNote>>(new Map())

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, contextFilter, dateFilter, sortOption, viewMode])

  useEffect(() => {
    setLoadedNotesById(new Map())
  }, [contextFilter, dateFilter, sortOption])

  const overviewQuery = useQuery({
    queryKey: ["knowledgeNotesOverview", contextFilter, dateFilter],
    queryFn: async () =>
      tipcClient.getKnowledgeNotesOverview({
        context: contextFilter === "all" ? undefined : contextFilter,
        dateFilter,
      }),
  })

  const invalidateKnowledgeQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["knowledgeNotesOverview"] })
    queryClient.invalidateQueries({ queryKey: ["knowledgeNotesByGroup"] })
    queryClient.invalidateQueries({ queryKey: ["knowledgeNotesFlat"] })
  }

  const agentsFoldersQuery = useQuery({
    queryKey: ["agentsFolders"],
    queryFn: async () => tipcClient.getAgentsFolders(),
    staleTime: Infinity,
  })

  const flatNotesQuery = useQuery({
    queryKey: ["knowledgeNotesFlat", contextFilter, dateFilter, sortOption],
    queryFn: async () =>
      tipcClient.getAllKnowledgeNotes({
        context: contextFilter === "all" ? undefined : contextFilter,
        dateFilter,
        sort: sortOption,
        limit: 1000,
      }),
    enabled: viewMode === "flat" && !searchQuery.trim(),
  })

  const searchMutation = useMutation({
    mutationFn: async ({ query }: { query: string }) =>
      !query.trim()
        ? null
        : tipcClient.searchKnowledgeNotes({
          query,
          context: contextFilter === "all" ? undefined : contextFilter,
          dateFilter,
          sort: sortOption,
          limit: 500,
        }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => tipcClient.deleteKnowledgeNote({ id }),
    onSuccess: () => {
      invalidateKnowledgeQueries()
      toast.success("Note deleted")
      setDeleteConfirmId(null)
    },
    onError: (error: Error) => toast.error(`Failed to delete: ${error.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<KnowledgeNote, "id" | "createdAt">>
    }) => tipcClient.updateKnowledgeNote({ id, updates }),
    onSuccess: () => {
      invalidateKnowledgeQueries()
      if (searchQuery.trim()) {
        searchMutation.mutate({ query: searchQuery })
      }
      toast.success("Note updated")
      setEditingNote(null)
      setEditForm(null)
    },
    onError: (error: Error) => toast.error(`Failed to update: ${error.message}`),
  })

  const promoteToAutoMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) =>
      tipcClient.updateKnowledgeNote({
        id,
        updates: {
          context: "auto",
          updatedAt: Date.now(),
        },
      }),
    onMutate: ({ id }) => {
      setPromotingNoteId(id)
    },
    onSuccess: () => {
      invalidateKnowledgeQueries()
      if (searchQuery.trim()) {
        searchMutation.mutate({ query: searchQuery })
      }
      toast.success("Note promoted to auto context")
    },
    onError: (error: Error) => {
      toast.error(`Failed to promote note: ${error.message}`)
    },
    onSettled: () => {
      setPromotingNoteId(null)
    },
  })

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: string[]) => tipcClient.deleteMultipleKnowledgeNotes({ ids }),
    onSuccess: (deletedCount) => {
      invalidateKnowledgeQueries()
      toast.success(`Deleted ${deletedCount} notes`)
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
    },
    onError: (error: Error) => toast.error(`Failed to delete: ${error.message}`),
  })

  const deleteAllMutation = useMutation({
    mutationFn: async () => tipcClient.deleteAllKnowledgeNotes(),
    onSuccess: (deletedCount) => {
      invalidateKnowledgeQueries()
      toast.success(`Deleted ${deletedCount} notes`)
      setSelectedIds(new Set())
      setDeleteAllConfirm(false)
    },
    onError: (error: Error) => toast.error(`Failed to delete: ${error.message}`),
  })

  const openKnowledgeFolderMutation = useMutation({
    mutationFn: async () => tipcClient.openKnowledgeFolder(),
    onSuccess: (result) => {
      if (!result?.success) toast.error(result?.error || "Failed to open notes folder")
    },
    onError: (error: Error) => toast.error(`Failed to open notes folder: ${error.message}`),
  })

  const openWorkspaceKnowledgeFolderMutation = useMutation({
    mutationFn: async () => tipcClient.openWorkspaceKnowledgeFolder(),
    onSuccess: (result) => {
      if (!result?.success) toast.error(result?.error || "Failed to open workspace notes folder")
    },
    onError: (error: Error) => toast.error(`Failed to open workspace notes folder: ${error.message}`),
  })

  const overview: KnowledgeNotesOverview | undefined = overviewQuery.data
  const overviewGroups: KnowledgeNoteGroupSummary[] = overview?.groups ?? []
  const totalCount = overview?.total ?? 0
  const autoCount = overview?.autoCount ?? 0
  const searchOnlyCount = overview?.searchOnlyCount ?? 0

  const isSearching = !!searchQuery.trim()
  const isFlatView = viewMode === "flat"
  const searchResults = searchMutation.data ?? []
  const searchFilteredResults = useMemo(
    () =>
      contextFilter === "all"
        ? searchResults
        : searchResults.filter((note) => note.context === contextFilter),
    [searchResults, contextFilter],
  )
  const groupedSearchResults = useMemo(
    () => buildKnowledgeNoteSections(searchFilteredResults),
    [searchFilteredResults],
  )
  const flatNotes = flatNotesQuery.data ?? []

  const registerLoadedNotes = (notes: KnowledgeNote[]) => {
    setLoadedNotesById((prev) => {
      const next = new Map(prev)
      for (const note of notes) next.set(note.id, note)
      return next
    })
  }

  // Seed all groups as collapsed on first load of the overview (or when groups change).
  useEffect(() => {
    if (!overview) return
    const allGroupKeys = new Set(overviewGroups.map((group) => group.key))
    const allSeriesKeys = new Set(
      overviewGroups.flatMap((group) => group.seriesSummaries.map((series) => series.key)),
    )
    setCollapsedGroupKeys((prev) => {
      // Preserve user-expanded state for existing groups; new groups start collapsed.
      const next = new Set<string>()
      for (const key of allGroupKeys) {
        if (prev.size === 0) {
          next.add(key)
        } else if (prev.has(key)) {
          next.add(key)
        }
      }
      // Any fully new groups not in prev: default collapsed
      for (const key of allGroupKeys) if (!prev.has(key)) next.add(key)
      return next
    })
    setCollapsedSeriesKeys((prev) => {
      const next = new Set<string>()
      for (const key of allSeriesKeys) {
        if (prev.size === 0 || !prev.has(key)) next.add(key)
        else next.add(key)
      }
      return next
    })
  }, [overview])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      searchMutation.reset()
      return undefined
    }
    searchMutation.reset()
    const timer = window.setTimeout(() => {
      searchMutation.mutate({ query })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [searchQuery, contextFilter, dateFilter, sortOption])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleEdit = (note: KnowledgeNote) => {
    setEditingNote(note)
    setEditForm(toEditForm(note))
  }

  const handleSaveEdit = () => {
    if (!editingNote || !editForm) return

    const title = editForm.title.trim()
    const body = editForm.body.trim()
    if (!title || !body) {
      toast.error("Title and body are required")
      return
    }

    const references = parseKnowledgeNoteReferencesInput(editForm.referencesInput)
    updateMutation.mutate({
      id: editingNote.id,
      updates: {
        title,
        context: editForm.context,
        summary: editForm.summary.trim() || undefined,
        body,
        tags: parseKnowledgeNoteTagsInput(editForm.tagsInput),
        references: references.length ? references : undefined,
        updatedAt: Date.now(),
      },
    })
  }

  const handlePromoteToAuto = (id: string) => {
    const note =
      loadedNotesById.get(id) ??
      searchResults.find((entry) => entry.id === id) ??
      flatNotes.find((entry) => entry.id === id)
    if (!note || note.context === "auto") return
    promoteToAutoMutation.mutate({ id })
  }

  const handleToggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleGroupCollapsed = (key: string) =>
    setCollapsedGroupKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const toggleSeriesCollapsed = (key: string) =>
    setCollapsedSeriesKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  // Visible notes depend on whether we're searching or browsing groups.
  // When browsing, only loaded (expanded) notes are selectable.
  const visibleNotes = isSearching ? searchFilteredResults : isFlatView ? flatNotes : Array.from(loadedNotesById.values())
  const visibleIds = new Set(visibleNotes.map((note) => note.id))
  const visibleSelectedCount = [...selectedIds].filter((id) => visibleIds.has(id)).length

  const handleSelectAll = () =>
    visibleSelectedCount === visibleNotes.length && visibleNotes.length > 0
      ? setSelectedIds((prev) => {
          const next = new Set(prev)
          visibleNotes.forEach((note) => next.delete(note.id))
          return next
        })
      : setSelectedIds((prev) => new Set([...prev, ...visibleNotes.map((note) => note.id)]))

  const allSelected = visibleNotes.length > 0 && visibleSelectedCount === visibleNotes.length
  const someSelected = visibleSelectedCount > 0 && visibleSelectedCount < visibleNotes.length

  return (
    <div className="modern-panel h-full overflow-y-auto overflow-x-hidden px-5 py-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Knowledge</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Knowledge notes stored as plain files under <span className="font-mono">.agents/knowledge/</span>
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openKnowledgeFolderMutation.mutate()}
              disabled={openKnowledgeFolderMutation.isPending}
            >
              <FolderOpen className="h-4 w-4" />
              Open Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openWorkspaceKnowledgeFolderMutation.mutate()}
              disabled={
                !agentsFoldersQuery.data?.workspace?.knowledgeDir ||
                openWorkspaceKnowledgeFolderMutation.isPending
              }
            >
              <FolderUp className="h-4 w-4" />
              Workspace Files
            </Button>
          </div>
        </div>

        {totalCount ? (
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{totalCount} notes</span>
              <Badge className={cn("text-xs", contextBadgeClasses["search-only"])}>
                {searchOnlyCount} search-only
              </Badge>
              {autoCount ? (
                <Badge className={cn("text-xs", contextBadgeClasses.auto)}>{autoCount} auto</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Use <span className="font-medium">auto</span> sparingly for high-signal notes that should be
              prioritized for automatic context selection.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="relative w-full min-w-0 md:max-w-md md:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery ? (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                onClick={() => handleSearch("")}
              >
                <X className="h-3 w-3" />
              </Button>
            ) : null}
          </div>
          <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {contextFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={contextFilter === option.value ? "default" : "outline"}
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setContextFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              variant={viewMode === "grouped" ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setViewMode("grouped")}
            >
              Grouped
            </Button>
            <Button
              variant={viewMode === "flat" ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setViewMode("flat")}
            >
              Ungrouped
            </Button>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-wrap md:items-center">
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as KnowledgeNoteDateFilter)}>
              <SelectTrigger className="h-8 w-full border bg-background md:w-[130px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as KnowledgeNoteSort)}>
              <SelectTrigger className="h-8 w-full border bg-background md:w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visibleNotes.length || totalCount ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
            {visibleNotes.length ? (
              <>
                <button className="text-muted-foreground hover:text-foreground" onClick={handleSelectAll}>
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : someSelected ? (
                    <MinusSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size
                    ? `${selectedIds.size} selected`
                    : isSearching
                      ? "Select all results"
                      : isFlatView
                        ? "Select all sorted"
                        : "Select all loaded"}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                {isFlatView ? "No notes match the active filters" : "Expand a group to load notes"}
              </span>
            )}
            <div className="flex-1" />
            {selectedIds.size ? (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={deleteMultipleMutation.isPending}
              >
                {deleteMultipleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Selected ({selectedIds.size})
              </Button>
            ) : null}
            {totalCount ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteAllConfirm(true)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            ) : null}
          </div>
        ) : null}

        {overviewQuery.isLoading || (isFlatView && flatNotesQuery.isLoading && !isSearching) ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (isSearching && isFlatView) || (!isSearching && isFlatView) ? (
          visibleNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center sm:px-6">
              <h3 className="text-base font-medium">No matching notes</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                No notes match the active search and filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleNotes.map((note) => (
                <KnowledgeNoteCard
                  key={note.id}
                  note={note}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onEdit={handleEdit}
                  onPromoteToAuto={handlePromoteToAuto}
                  isPromotingToAuto={promotingNoteId === note.id && promoteToAutoMutation.isPending}
                  isSelected={selectedIds.has(note.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          )
        ) : isSearching ? (
          searchFilteredResults.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center sm:px-6">
              <h3 className="text-base font-medium">No matching notes</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                No notes match your search. Try a different query.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedSearchResults.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-sm font-medium text-foreground">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{group.label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {group.notes.length +
                        group.seriesSections.reduce((sum, section) => sum + section.notes.length, 0)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {group.notes.map((note) => (
                      <KnowledgeNoteCard
                        key={note.id}
                        note={note}
                        onDelete={(id) => setDeleteConfirmId(id)}
                        onEdit={handleEdit}
                        onPromoteToAuto={handlePromoteToAuto}
                        isPromotingToAuto={
                          promotingNoteId === note.id && promoteToAutoMutation.isPending
                        }
                        isSelected={selectedIds.has(note.id)}
                        onToggleSelect={handleToggleSelect}
                      />
                    ))}
                  </div>
                  {group.seriesSections.map((section) => (
                    <div
                      key={section.key}
                      className="space-y-2 rounded-lg border border-dashed bg-muted/10 p-2"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <FolderUp className="h-3.5 w-3.5" />
                        <span>{section.label}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {section.notes.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {section.notes.map((note) => (
                          <KnowledgeNoteCard
                            key={note.id}
                            note={note}
                            onDelete={(id) => setDeleteConfirmId(id)}
                            onEdit={handleEdit}
                            onPromoteToAuto={handlePromoteToAuto}
                            isPromotingToAuto={
                              promotingNoteId === note.id && promoteToAutoMutation.isPending
                            }
                            isSelected={selectedIds.has(note.id)}
                            onToggleSelect={handleToggleSelect}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        ) : overviewGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center sm:px-6">
            <h3 className="text-base font-medium">No notes yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Save notes from agent sessions to build your knowledge workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {overviewGroups.map((group) => (
              <GroupPanel
                key={group.key}
                group={group}
                contextFilter={contextFilter === "all" ? undefined : contextFilter}
                dateFilter={dateFilter}
                sortOption={sortOption}
                isCollapsed={collapsedGroupKeys.has(group.key)}
                onToggleCollapse={() => toggleGroupCollapsed(group.key)}
                collapsedSeriesKeys={collapsedSeriesKeys}
                onToggleSeriesCollapse={toggleSeriesCollapsed}
                onNotesLoaded={registerLoadedNotes}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onDelete={(id) => setDeleteConfirmId(id)}
                onEdit={handleEdit}
                onPromoteToAuto={handlePromoteToAuto}
                promotingNoteId={promotingNoteId}
                isPromoteToAutoPending={promoteToAutoMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNote(null)
            setEditForm(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update canonical note fields for this knowledge note.</DialogDescription>
          </DialogHeader>

          {editForm ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                  placeholder="Project architecture"
                />
              </div>

              <div className="space-y-2">
                <Label>Context</Label>
                <div className="flex flex-wrap gap-2">
                  {contextFilterOptions
                    .filter((option) => option.value !== "all")
                    .map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={editForm.context === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setEditForm({ ...editForm, context: option.value as KnowledgeNoteContext })
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep <span className="font-medium">auto</span> notes limited to high-signal context.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={editForm.summary}
                  onChange={(event) => setEditForm({ ...editForm, summary: event.target.value })}
                  placeholder="Short note summary"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={editForm.body}
                  onChange={(event) => setEditForm({ ...editForm, body: event.target.value })}
                  placeholder="Detailed note body"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editForm.tagsInput}
                  onChange={(event) => setEditForm({ ...editForm, tagsInput: event.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="space-y-2">
                <Label>References (comma or newline separated)</Label>
                <Textarea
                  value={editForm.referencesInput}
                  onChange={(event) =>
                    setEditForm({ ...editForm, referencesInput: event.target.value })
                  }
                  placeholder="docs/architecture.md"
                  rows={3}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNote(null)
                setEditForm(null)
              }}
            >
              Cancel
            </Button>
            <Button className="gap-2" onClick={handleSaveEdit} disabled={updateMutation.isPending || !editForm}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Note
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete {visibleSelectedCount} Notes
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {visibleSelectedCount} selected notes? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => deleteMultipleMutation.mutate([...selectedIds].filter((id) => visibleIds.has(id)))}
              disabled={deleteMultipleMutation.isPending}
            >
              {deleteMultipleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete {visibleSelectedCount} Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete All Notes
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL {totalCount} notes? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete All Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
