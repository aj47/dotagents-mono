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
import { tipcClient } from "@renderer/lib/tipc-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { KnowledgeNote, KnowledgeNoteContext } from "@shared/types"
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
import { buildKnowledgeNoteSections } from "@renderer/lib/knowledge-note-groups"

const contextBadgeClasses: Record<KnowledgeNoteContext, string> = {
  auto: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "search-only": "bg-slate-500/20 text-slate-700 dark:text-slate-300",
}

const contextFilterOptions: { label: string; value: "all" | KnowledgeNoteContext }[] = [
  { label: "All", value: "all" },
  { label: "Search only", value: "search-only" },
  { label: "Auto", value: "auto" },
]

type EditFormState = {
  title: string
  context: KnowledgeNoteContext
  summary: string
  body: string
  tagsInput: string
  referencesInput: string
}

const toCommaSeparated = (values?: string[]) => values?.join(", ") ?? ""
const toLineSeparated = (values?: string[]) => values?.join("\n") ?? ""
const parseCommaSeparated = (input: string) => input.split(",").map((value) => value.trim()).filter(Boolean)
const parseReferenceList = (input: string) => input.split(/[\n,]/).map((value) => value.trim()).filter(Boolean)
const summarizeNote = (note: KnowledgeNote) => (note.summary?.trim() || note.body.trim()).slice(0, 140)
const toEditForm = (note: KnowledgeNote): EditFormState => ({
  title: note.title,
  context: note.context,
  summary: note.summary ?? "",
  body: note.body,
  tagsInput: toCommaSeparated(note.tags),
  referencesInput: toLineSeparated(note.references),
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
        className="flex cursor-pointer items-start gap-2 px-3 py-2"
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

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium">{note.title}</h3>
            <Badge className={cn("px-1.5 py-0 text-[10px]", contextBadgeClasses[note.context])}>
              {note.context}
            </Badge>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{summarizeNote(note)}</p>
        </div>

        <div className="flex items-center gap-1">
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
              ? "This note is always included in model context. Keep auto notes to a small, high-signal set."
              : "Search-only notes are only used when retrieved. Promote to auto only when this note should always be in context."}
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

export function Component() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [contextFilter, setContextFilter] = useState<"all" | KnowledgeNoteContext>("all")
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(new Set())
  const [collapsedSeriesKeys, setCollapsedSeriesKeys] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [promotingNoteId, setPromotingNoteId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, contextFilter])

  const knowledgeNotesQuery = useQuery({
    queryKey: ["knowledgeNotes"],
    queryFn: async () => tipcClient.getAllKnowledgeNotes(),
  })

  const agentsFoldersQuery = useQuery({
    queryKey: ["agentsFolders"],
    queryFn: async () => tipcClient.getAgentsFolders(),
    staleTime: Infinity,
  })

  const searchMutation = useMutation({
    mutationFn: async (query: string) => (!query.trim() ? null : tipcClient.searchKnowledgeNotes({ query })),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => tipcClient.deleteKnowledgeNote({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
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
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
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
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
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
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
      toast.success(`Deleted ${deletedCount} notes`)
      setSelectedIds(new Set())
      setBulkDeleteConfirm(false)
    },
    onError: (error: Error) => toast.error(`Failed to delete: ${error.message}`),
  })

  const deleteAllMutation = useMutation({
    mutationFn: async () => tipcClient.deleteAllKnowledgeNotes(),
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
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

  const knowledgeNotes = knowledgeNotesQuery.data || []
  const displayKnowledgeNotes = searchMutation.data ?? knowledgeNotes
  const filteredKnowledgeNotes =
    contextFilter === "all"
      ? displayKnowledgeNotes
      : displayKnowledgeNotes.filter((note) => note.context === contextFilter)

  const groupedKnowledgeNotes = useMemo(
    () => buildKnowledgeNoteSections(filteredKnowledgeNotes),
    [filteredKnowledgeNotes],
  )

  useEffect(() => {
    const validGroupKeys = new Set(groupedKnowledgeNotes.map((group) => group.key))
    const validSeriesKeys = new Set(
      groupedKnowledgeNotes.flatMap((group) => group.seriesSections.map((section) => section.key)),
    )
    setCollapsedGroupKeys((prev) => new Set([...prev].filter((key) => validGroupKeys.has(key))))
    setCollapsedSeriesKeys((prev) => new Set([...prev].filter((key) => validSeriesKeys.has(key))))
  }, [groupedKnowledgeNotes])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    query.trim() ? searchMutation.mutate(query) : searchMutation.reset()
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

    const references = parseReferenceList(editForm.referencesInput)
    updateMutation.mutate({
      id: editingNote.id,
      updates: {
        title,
        context: editForm.context,
        summary: editForm.summary.trim() || undefined,
        body,
        tags: parseCommaSeparated(editForm.tagsInput),
        references: references.length ? references : undefined,
        updatedAt: Date.now(),
      },
    })
  }

  const handlePromoteToAuto = (id: string) => {
    const note = knowledgeNotes.find((entry) => entry.id === id)
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

  const filteredIds = new Set(filteredKnowledgeNotes.map((note) => note.id))
  const visibleSelectedCount = [...selectedIds].filter((id) => filteredIds.has(id)).length

  const handleSelectAll = () =>
    visibleSelectedCount === filteredKnowledgeNotes.length && filteredKnowledgeNotes.length > 0
      ? setSelectedIds((prev) => {
          const next = new Set(prev)
          filteredKnowledgeNotes.forEach((note) => next.delete(note.id))
          return next
        })
      : setSelectedIds((prev) => new Set([...prev, ...filteredKnowledgeNotes.map((note) => note.id)]))

  const autoCount = knowledgeNotes.filter((note) => note.context === "auto").length
  const searchOnlyCount = knowledgeNotes.filter((note) => note.context === "search-only").length
  const allSelected =
    filteredKnowledgeNotes.length > 0 && visibleSelectedCount === filteredKnowledgeNotes.length
  const someSelected = visibleSelectedCount > 0 && visibleSelectedCount < filteredKnowledgeNotes.length

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

        {knowledgeNotes.length ? (
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{knowledgeNotes.length} notes</span>
              <Badge className={cn("text-xs", contextBadgeClasses["search-only"])}>
                {searchOnlyCount} search-only
              </Badge>
              {autoCount ? (
                <Badge className={cn("text-xs", contextBadgeClasses.auto)}>{autoCount} auto</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Use <span className="font-medium">auto</span> sparingly for high-signal notes that should always be
              in context.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              className="pl-9"
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
          <div className="flex flex-wrap items-center gap-1.5">
            {contextFilterOptions.map((option) => (
              <Button
                key={option.value}
                variant={contextFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setContextFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {filteredKnowledgeNotes.length ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
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
              {selectedIds.size ? `${selectedIds.size} selected` : "Select all"}
            </span>
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
            {knowledgeNotes.length ? (
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

        {knowledgeNotesQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredKnowledgeNotes.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center sm:px-6">
            <h3 className="text-base font-medium">No notes yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {searchQuery
                ? "No notes match your search. Try a different query."
                : "Save notes from agent sessions to build your knowledge workspace."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedKnowledgeNotes.map((group) => {
              const isGroupCollapsed = collapsedGroupKeys.has(group.key)
              const totalNotes =
                group.notes.length +
                group.seriesSections.reduce((sum, section) => sum + section.notes.length, 0)

              return (
                <div key={group.key} className="space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-medium text-foreground hover:bg-accent/40"
                    onClick={() => toggleGroupCollapsed(group.key)}
                  >
                    {isGroupCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{group.label}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {totalNotes}
                    </Badge>
                  </button>

                  {isGroupCollapsed ? null : (
                    <>
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

                      {group.seriesSections.map((section) => {
                        const isSeriesCollapsed = collapsedSeriesKeys.has(section.key)
                        return (
                          <div
                            key={section.key}
                            className="space-y-2 rounded-lg border border-dashed bg-muted/10 p-2"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                              onClick={() => toggleSeriesCollapsed(section.key)}
                            >
                              {isSeriesCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              <FolderUp className="h-3.5 w-3.5" />
                              <span>{section.label}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {section.notes.length}
                              </Badge>
                            </button>

                            {isSeriesCollapsed ? null : (
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
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
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
              onClick={() => deleteMultipleMutation.mutate([...selectedIds].filter((id) => filteredIds.has(id)))}
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
              Are you sure you want to delete ALL {knowledgeNotes.length} notes? This action cannot be undone.
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
