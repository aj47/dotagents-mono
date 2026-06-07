import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const pastSessionsDialogSource = readFileSync(
  new URL("./past-sessions-dialog.tsx", import.meta.url),
  "utf8",
)

describe("saved conversations dialog layout", () => {
  it("keeps the toolbar and session rows usable under narrow widths", () => {
    expect(pastSessionsDialogSource).toContain(
      'className="flex shrink-0 flex-wrap items-center gap-2"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="relative min-w-0 flex-1"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="flex flex-wrap items-start gap-2"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="min-w-0 flex-1 truncate font-medium"',
    )
    expect(pastSessionsDialogSource).toContain(
      'className="text-muted-foreground mt-0.5 line-clamp-2 break-words text-xs leading-relaxed [overflow-wrap:anywhere]"',
    )
    expect(pastSessionsDialogSource).toContain("{entry.isPinned && (")
  })

  it("wraps delete-all confirmation actions instead of clipping them under zoom", () => {
    expect(pastSessionsDialogSource).toContain(
      'className="flex flex-wrap items-center justify-end gap-2"',
    )
  })

  it("keeps per-session row actions keyboard-accessible", () => {
    const compactSource = pastSessionsDialogSource.replace(/\s+/g, " ")
    expect(pastSessionsDialogSource).toContain(
      "focus-visible:bg-accent/50 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    )
    expect(pastSessionsDialogSource).toContain(
      'className="ml-auto grid shrink-0 place-items-center self-start"',
    )
    expect(pastSessionsDialogSource).toContain(
      "group-focus-within:opacity-0 group-hover:opacity-0",
    )
    expect(compactSource).toContain(
      "group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
    )
    expect(pastSessionsDialogSource).toContain("focus-visible:ring-ring")
    expect(pastSessionsDialogSource).toContain("focus-visible:ring-offset-1")
    expect(pastSessionsDialogSource).toContain(
      "aria-label={`Delete ${entry.title}`}",
    )
  })

  it("includes a keyboard-accessible pin action and pinned-first sort for saved conversations", () => {
    expect(pastSessionsDialogSource).toContain(
      "orderConversationHistoryByPinnedFirst",
    )
    expect(pastSessionsDialogSource).toContain(
      "const activeConversationsQuery = useQuery<SessionListResponse>({",
    )
    const compactSource = pastSessionsDialogSource.replace(/\s+/g, " ")
    expect(compactSource).toContain(
      'entry.kind === "active" ? "Active conversations" : showArchivedOnly ? "Archived conversations" : "Saved conversations"',
    )
    expect(pastSessionsDialogSource).toContain(
      "orderConversationHistoryByPinnedFirst(",
    )
    expect(pastSessionsDialogSource).toContain("KEYBOARD_SHORTCUT_HINT")
    expect(pastSessionsDialogSource).toContain("PIN_SHORTCUT_HINT")
    expect(pastSessionsDialogSource).toContain("VOICE_SHORTCUT_HINT")
    expect(pastSessionsDialogSource).toContain(
      'aria-label={`${entry.isPinned ? "Unpin" : "Pin"} ${entry.title}`}',
    )
    expect(compactSource).toContain(
      "onKeyDown={ stopConversationRowKeyPropagation }",
    )
    expect(compactSource).toContain(
      'data-highlighted={ highlightedConversationId === entry.key ? "true" : undefined }',
    )
    expect(pastSessionsDialogSource).not.toContain(
      "inline-flex max-w-full items-center gap-1 rounded-full border border-border/60 bg-accent/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground",
    )
    expect(pastSessionsDialogSource).not.toContain("CheckCircle2")
  })

  it("can open directly into an archived-only conversations view", () => {
    expect(pastSessionsDialogSource).toContain("initialArchivedOnly = false")
    expect(pastSessionsDialogSource).toContain("const [showArchivedOnly, setShowArchivedOnly] = useState(initialArchivedOnly)")
    expect(pastSessionsDialogSource).toContain("setShowArchivedOnly(initialArchivedOnly)")
    expect(pastSessionsDialogSource).toContain("const archivedConversationCount = useMemo(")
    expect(pastSessionsDialogSource).toContain("showArchivedOnly ? conversation.isArchived : !conversation.isArchived")
    expect(pastSessionsDialogSource).toContain('title="Show archived conversations"')
    expect(pastSessionsDialogSource).toContain("No archived conversations found")
  })

  it("keeps search matches ordered newest-to-oldest after filtering", () => {
    const compactSource = pastSessionsDialogSource.replace(/\s+/g, " ")
    expect(compactSource).toContain(
      "if (a.kindPriority !== b.kindPriority) return a.kindPriority - b.kindPriority if (b.conversation.updatedAt !== a.conversation.updatedAt)",
    )
    expect(compactSource).toContain(
      "return b.conversation.updatedAt - a.conversation.updatedAt } if (b.rank !== a.rank) return b.rank - a.rank",
    )
  })

  it("searches user prompts and agent final responses beyond row snippets", () => {
    const compactSource = pastSessionsDialogSource.replace(/\s+/g, " ")
    expect(compactSource).toContain(
      'type SearchableConversationField = | "title" | "preview" | "lastMessage" | "searchText"',
    )
    expect(pastSessionsDialogSource).toContain(
      "function getConversationSearchText(",
    )
    expect(pastSessionsDialogSource).toContain(
      'message.role === "user" || message.role === "assistant"',
    )
    expect(pastSessionsDialogSource).toContain(
      "for (const event of progress?.responseEvents ?? [])",
    )
    expect(pastSessionsDialogSource).toContain("getCachedActiveSearchIndex(")
    expect(pastSessionsDialogSource).toContain("createLazySearchIndex(() => ({")
    expect(pastSessionsDialogSource).toContain(
      "rawScore >= DEFAULT_FUZZY_THRESHOLD",
    )
  })

  it("debounces expensive conversation search and builds indexes lazily", () => {
    const compactSource = pastSessionsDialogSource.replace(/\s+/g, " ")
    expect(pastSessionsDialogSource).toContain("const SEARCH_DEBOUNCE_MS = 120")
    expect(pastSessionsDialogSource).toContain(
      "const MAX_CONVERSATION_SEARCH_TEXT_CHARS = 8000",
    )
    expect(pastSessionsDialogSource).toContain("function useDebouncedValue<T>(")
    expect(pastSessionsDialogSource).toContain(
      "const debouncedSearchQuery = useDebouncedValue(",
    )
    expect(pastSessionsDialogSource).toContain(
      "const normalizedSearchQuery = useMemo(",
    )
    expect(pastSessionsDialogSource).toContain("activeSearchIndexCacheRef")
    expect(pastSessionsDialogSource).toContain("baseSavedConversationEntries")
    expect(pastSessionsDialogSource).toContain("conversation.getSearchIndex()")
    expect(pastSessionsDialogSource).toContain(
      'allowFuzzy: field !== "searchText"',
    )
    expect(compactSource).toContain(
      'field === "searchText" && normalizedQuery.length < MIN_SEARCH_TEXT_QUERY_CHARS',
    )
  })

  it("does not build search indexes when browsing without a query", () => {
    const compactSource = pastSessionsDialogSource.replace(/\s+/g, " ")
    const noSearchBranchIndex = compactSource.indexOf(
      "if (!normalizedSearchQuery) { return all.slice(0, SEARCH_RESULT_LIMIT) }",
    )
    const searchIndexUseIndex = compactSource.indexOf(
      "conversation.getSearchIndex()",
    )

    expect(noSearchBranchIndex).toBeGreaterThan(-1)
    expect(searchIndexUseIndex).toBeGreaterThan(-1)
    expect(noSearchBranchIndex).toBeLessThan(searchIndexUseIndex)
  })
})
