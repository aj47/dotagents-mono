import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  GitBranch,
  Link2,
  Loader2,
  Pencil,
  Search,
  Tag,
  Trash2,
} from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { buildKnowledgeNoteSections } from "@renderer/lib/knowledge-note-groups"
import { MarkdownRenderer } from "@renderer/components/markdown-renderer"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Card, CardContent } from "@renderer/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@renderer/components/ui/dialog"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import type { KnowledgeNote, KnowledgeNoteContext, KnowledgePageType } from "@shared/types"

const contextBadgeClasses: Record<KnowledgeNoteContext, string> = {
  auto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "search-only": "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
}


const pageTypeLabels: Record<KnowledgePageType, string> = {
  note: "Note",
  topic: "Topic",
  entity: "Entity",
  project: "Project",
  idea: "Idea",
  opportunity: "Opportunity",
  daily: "Daily",
  source: "Source",
}

const pageTypeBadgeClasses: Record<KnowledgePageType, string> = {
  note: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  topic: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  entity: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  project: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  idea: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  opportunity: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  daily: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  source: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
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

type RelatedNote = {
  note: KnowledgeNote
  score: number
}

const toCommaSeparated = (values?: string[]) => values?.join(", ") ?? ""
const toLineSeparated = (values?: string[]) => values?.join("\n") ?? ""
const parseCommaSeparated = (input: string) => input.split(",").map((value) => value.trim()).filter(Boolean)
const parseReferenceList = (input: string) => input.split(/[\n,]/).map((value) => value.trim()).filter(Boolean)
const summarizeNote = (note: KnowledgeNote) => (note.summary?.trim() || note.body.trim()).slice(0, 180)
const toEditForm = (note: KnowledgeNote): EditFormState => ({
  title: note.title,
  context: note.context,
  summary: note.summary ?? "",
  body: note.body,
  tagsInput: toCommaSeparated(note.tags),
  referencesInput: toLineSeparated(note.references),
})

function normalizeToken(value: string): string {
  return value.trim().toLowerCase()
}

function titleizePath(value: string): string {
  return value
    .split("/")
    .map((segment) => segment.split(/[-_]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "))
    .join(" / ")
}

function buildNoteTokens(note: KnowledgeNote): Set<string> {
  const tokens = new Set<string>()
  for (const tag of note.tags ?? []) {
    const token = normalizeToken(tag)
    if (token) tokens.add(`tag:${token}`)
  }
  for (const ref of note.references ?? []) {
    const token = normalizeToken(ref)
    if (token) tokens.add(`ref:${token}`)
  }
  if (note.group) tokens.add(`group:${normalizeToken(note.group)}`)
  if (note.series) tokens.add(`series:${normalizeToken(note.series)}`)
  return tokens
}

function buildRelatedNotes(note: KnowledgeNote, notes: KnowledgeNote[]): RelatedNote[] {
  const sourceTokens = buildNoteTokens(note)
  if (sourceTokens.size === 0) return []

  const related: RelatedNote[] = []
  for (const candidate of notes) {
    if (candidate.id === note.id) continue
    const candidateTokens = buildNoteTokens(candidate)
    let score = 0

    for (const token of sourceTokens) {
      if (!candidateTokens.has(token)) continue
      if (token.startsWith("tag:")) score += 3
      else if (token.startsWith("ref:")) score += 2
      else if (token.startsWith("group:")) score += 2
      else if (token.startsWith("series:")) score += 1
    }

    if (score > 0) related.push({ note: candidate, score })
  }

  return related
    .sort((a, b) => b.score - a.score || b.note.updatedAt - a.note.updatedAt)
    .slice(0, 4)
}

function matchesRelationFilter(note: KnowledgeNote, relationFilter: string): boolean {
  if (!relationFilter) return true
  const [type, rawValue] = relationFilter.split(":", 2)
  const targetValue = normalizeToken(rawValue ?? "")
  if (!type || !targetValue) return true

  if (type === "tag") return note.tags.some((tag) => normalizeToken(tag) === targetValue)
  if (type === "reference") return (note.references ?? []).some((ref) => normalizeToken(ref) === targetValue)
  if (type === "group") return normalizeToken(note.group ?? "") === targetValue
  if (type === "series") return normalizeToken(note.series ?? "") === targetValue
  return true
}

function NoteSidebar({
  note,
  notes,
  relationFilter,
  onSelectRelation,
}: {
  note: KnowledgeNote | null
  notes: KnowledgeNote[]
  relationFilter: string
  onSelectRelation: (value: string) => void
}) {
  const relatedNotes = useMemo(() => (note ? buildRelatedNotes(note, notes) : []), [note, notes])

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-card/40 p-8 text-center text-sm text-muted-foreground">
        Pick a note to read it like a page.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-6 py-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={cn("border", contextBadgeClasses[note.context])}>{note.context}</Badge>
          <Badge className={cn("border", pageTypeBadgeClasses[note.pageType ?? "note"])}>{pageTypeLabels[note.pageType ?? "note"]}</Badge>
          {note.group ? <Badge variant="outline">{titleizePath(note.group)}</Badge> : null}
          {note.series ? <Badge variant="outline">{titleizePath(note.series)}</Badge> : null}
        </div>
        <h2 className="text-2xl font-semibold leading-tight">{note.title}</h2>
        {note.summary ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{note.summary}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl">
          <MarkdownRenderer content={note.body} className="text-[15px] leading-7" />
        </div>
      </div>

      <div className="border-t bg-muted/20 px-6 py-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Metadata</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><FolderOpen className="h-4 w-4" />{pageTypeLabels[note.pageType ?? "note"]}</div>
              {note.references?.length ? <div className="flex items-center gap-2"><FileText className="h-4 w-4" />{note.references.length} references</div> : null}
              {note.backlinks?.length ? <div className="flex items-center gap-2"><Link2 className="h-4 w-4" />{note.backlinks.length} backlinks</div> : null}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tags</div>
            <div className="flex flex-wrap gap-2">
              {note.tags.length ? note.tags.map((tag) => (
                <button key={tag} className="inline-flex" onClick={() => onSelectRelation(`tag:${tag}`)}>
                  <Badge variant={relationFilter === `tag:${tag}` ? "default" : "outline"} className="gap-1"><Tag className="h-3 w-3" />{tag}</Badge>
                </button>
              )) : <span className="text-sm text-muted-foreground">No tags</span>}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Backlinks & Related</div>
            <div className="space-y-2">
              {note.backlinks?.length ? <div className="mb-3 flex flex-wrap gap-2">{note.backlinks.map((backlink) => <Badge key={backlink} variant="secondary">{backlink}</Badge>)}</div> : null}
              {relatedNotes.length ? relatedNotes.map(({ note: related, score }) => (
                <div key={related.id} className="rounded-xl border bg-background/80 px-3 py-2">
                  <div className="truncate text-sm font-medium">{related.title}</div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{summarizeNote(related)}</span>
                    <Badge variant="outline">{score}</Badge>
                  </div>
                </div>
              )) : <span className="text-sm text-muted-foreground">No related notes</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Component() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [activeQuery, setActiveQuery] = useState("")
  const [contextFilter, setContextFilter] = useState<"all" | KnowledgeNoteContext>("all")
  const [pageTypeFilter, setPageTypeFilter] = useState<"all" | KnowledgePageType>("all")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [collapsedSeries, setCollapsedSeries] = useState<Set<string>>(new Set())
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [relationFilter, setRelationFilter] = useState("")

  const knowledgeNotesQuery = useQuery({ queryKey: ["knowledgeNotes"], queryFn: async () => tipcClient.getAllKnowledgeNotes() })
  const searchMutation = useMutation({ mutationFn: async (query: string) => (!query.trim() ? null : tipcClient.searchKnowledgeNotes({ query })) })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => tipcClient.deleteKnowledgeNote({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
      toast.success("Note deleted")
      setDeleteConfirmId(null)
      setSelectedNoteId((current) => current === deleteConfirmId ? null : current)
    },
    onError: (error: Error) => toast.error(`Failed to delete: ${error.message}`),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<KnowledgeNote, "id" | "createdAt">> }) => tipcClient.updateKnowledgeNote({ id, updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledgeNotes"] })
      toast.success("Note updated")
      setEditingNote(null)
      setEditForm(null)
    },
    onError: (error: Error) => toast.error(`Failed to update: ${error.message}`),
  })

  const knowledgeNotes = useMemo<KnowledgeNote[]>(() => {
    const baseNotes = activeQuery.trim() ? (searchMutation.data ?? []) : (knowledgeNotesQuery.data ?? [])
    return [...baseNotes].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [activeQuery, knowledgeNotesQuery.data, searchMutation.data])

  useEffect(() => {
    const trimmed = searchInput.trim()
    const handle = window.setTimeout(() => {
      setActiveQuery(trimmed)
      if (trimmed) searchMutation.mutate(trimmed)
      else searchMutation.reset()
    }, 180)
    return () => window.clearTimeout(handle)
  }, [searchInput])

  const filteredNotes = useMemo(() => knowledgeNotes.filter((note) => {
    if (contextFilter !== "all" && note.context !== contextFilter) return false
    if (pageTypeFilter !== "all" && (note.pageType ?? "note") !== pageTypeFilter) return false
    if (!matchesRelationFilter(note, relationFilter)) return false
    return true
  }), [contextFilter, knowledgeNotes, pageTypeFilter, relationFilter])

  const sections = useMemo(() => buildKnowledgeNoteSections(filteredNotes), [filteredNotes])
  const selectedNote = useMemo(() => {
    if (selectedNoteId) {
      const explicit = filteredNotes.find((note) => note.id === selectedNoteId) ?? knowledgeNotes.find((note) => note.id === selectedNoteId)
      if (explicit) return explicit
    }
    return filteredNotes[0] ?? null
  }, [filteredNotes, knowledgeNotes, selectedNoteId])

  useEffect(() => {
    if (!selectedNoteId && filteredNotes[0]) setSelectedNoteId(filteredNotes[0].id)
  }, [filteredNotes, selectedNoteId])

  const handleToggleGroup = (key: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleToggleSeries = (key: string) => {
    setCollapsedSeries((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEdit = (note: KnowledgeNote) => {
    setEditingNote(note)
    setEditForm(toEditForm(note))
  }

  const handleSaveEdit = () => {
    if (!editingNote || !editForm) return
    if (!editForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    updateMutation.mutate({
      id: editingNote.id,
      updates: {
        title: editForm.title.trim(),
        context: editForm.context,
        summary: editForm.summary.trim() || undefined,
        body: editForm.body.trim(),
        tags: parseCommaSeparated(editForm.tagsInput),
        references: parseReferenceList(editForm.referencesInput),
      },
    })
  }

  const isLoading = knowledgeNotesQuery.isLoading || searchMutation.isPending
  const hasError = knowledgeNotesQuery.isError

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge</h1>
          <p className="mt-1 text-sm text-muted-foreground">Readable notes first. Search, browse sections, and open a page.</p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Badge variant="outline">{filteredNotes.length} visible</Badge>
          {relationFilter ? <Badge variant="secondary">{relationFilter}</Badge> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search notes..."
          wrapperClassName="min-w-[260px] max-w-xl flex-1"
          endContent={isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
        />
        {contextFilterOptions.map((option) => (
          <Button key={option.value} type="button" variant={contextFilter === option.value ? "default" : "outline"} size="sm" onClick={() => setContextFilter(option.value)}>
            {option.label}
          </Button>
        ))}
        {(["all", "topic", "entity", "project", "idea", "opportunity"] as const).map((pageType) => (
          <Button key={pageType} type="button" variant={pageTypeFilter === pageType ? "default" : "outline"} size="sm" onClick={() => setPageTypeFilter(pageType)}>
            {pageType === "all" ? "All types" : pageTypeLabels[pageType]}
          </Button>
        ))}
        {relationFilter ? <Button variant="outline" size="sm" onClick={() => setRelationFilter("")}>Clear filter</Button> : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-auto rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Library</div>
          </div>

          <div className="p-3">
            {hasError ? <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">Failed to load notes.</div> : null}
            {!hasError && filteredNotes.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No notes match your current filters.</div> : null}

            <div className="space-y-3">
              {sections.map((section) => {
                const isGroupCollapsed = collapsedGroups.has(section.key)
                return (
                  <div key={section.key} className="rounded-xl border bg-background/40">
                    <button className="flex w-full items-center justify-between px-3 py-2 text-left" onClick={() => handleToggleGroup(section.key)}>
                      <div className="flex items-center gap-2">
                        {isGroupCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{section.notes.length + section.seriesSections.reduce((sum, item) => sum + item.notes.length, 0)}</Badge>
                    </button>

                    {isGroupCollapsed ? null : (
                      <div className="space-y-2 border-t p-2">
                        {section.notes.map((note) => (
                          <Card key={note.id} className={cn("cursor-pointer rounded-xl border transition-colors hover:bg-accent/30", selectedNote?.id === note.id && "border-primary/40 bg-accent/20")} onClick={() => setSelectedNoteId(note.id)}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="mb-1 flex flex-wrap items-center gap-2"><Badge className={cn("border", pageTypeBadgeClasses[note.pageType ?? "note"])}>{pageTypeLabels[note.pageType ?? "note"]}</Badge></div>
                                  <div className="truncate text-sm font-medium">{note.title}</div>
                                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{summarizeNote(note)}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(note) }}><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(note.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {section.seriesSections.map((series) => {
                          const isSeriesCollapsed = collapsedSeries.has(series.key)
                          return (
                            <div key={series.key} className="rounded-xl border bg-card/70">
                              <button className="flex w-full items-center justify-between px-3 py-2 text-left" onClick={() => handleToggleSeries(series.key)}>
                                <div className="flex items-center gap-2">
                                  {isSeriesCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{series.label}</span>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{series.notes.length}</Badge>
                              </button>
                              {isSeriesCollapsed ? null : (
                                <div className="space-y-2 border-t p-2">
                                  {series.notes.map((note) => (
                                    <Card key={note.id} className={cn("cursor-pointer rounded-xl border transition-colors hover:bg-accent/30", selectedNote?.id === note.id && "border-primary/40 bg-accent/20")} onClick={() => setSelectedNoteId(note.id)}>
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="mb-1 flex flex-wrap items-center gap-2"><Badge className={cn("border", pageTypeBadgeClasses[note.pageType ?? "note"])}>{pageTypeLabels[note.pageType ?? "note"]}</Badge></div>
                                            <div className="truncate text-sm font-medium">{note.title}</div>
                                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{summarizeNote(note)}</div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(note) }}><Pencil className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(note.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <NoteSidebar note={selectedNote} notes={knowledgeNotes} relationFilter={relationFilter} onSelectRelation={setRelationFilter} />
      </div>

      <Dialog open={!!editingNote} onOpenChange={(open) => { if (!open) { setEditingNote(null); setEditForm(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update this knowledge note.</DialogDescription>
          </DialogHeader>
          {editForm ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Context</Label><div className="flex flex-wrap gap-2">{contextFilterOptions.filter((option) => option.value !== "all").map((option) => <Button key={option.value} type="button" variant={editForm.context === option.value ? "default" : "outline"} size="sm" onClick={() => setEditForm({ ...editForm, context: option.value as KnowledgeNoteContext })}>{option.label}</Button>)}</div></div>
              <div className="space-y-2"><Label>Summary</Label><Textarea value={editForm.summary} onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })} rows={3} /></div>
              <div className="space-y-2"><Label>Body</Label><Textarea value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} rows={8} /></div>
              <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={editForm.tagsInput} onChange={(e) => setEditForm({ ...editForm, tagsInput: e.target.value })} /></div>
              <div className="space-y-2"><Label>References (comma or newline separated)</Label><Textarea value={editForm.referencesInput} onChange={(e) => setEditForm({ ...editForm, referencesInput: e.target.value })} rows={3} /></div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingNote(null); setEditForm(null) }}>Cancel</Button>
            <Button className="gap-2" onClick={handleSaveEdit} disabled={updateMutation.isPending || !editForm}>{updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Delete Note</DialogTitle>
            <DialogDescription>Are you sure you want to delete this note? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" className="gap-2" onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
