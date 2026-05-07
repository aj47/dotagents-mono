import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sidebarSource = readFileSync(new URL("./active-agents-sidebar.tsx", import.meta.url), "utf8")

describe("active agents sidebar task section", () => {
  it("renders repeat-task sessions in one collapsible Tasks section", () => {
    expect(sidebarSource).toContain('queryKey: ["loops"]')
    expect(sidebarSource).toContain("function getRepeatTaskTitleHints(task: LoopConfig)")
    expect(sidebarSource).toContain("formatRepeatTaskTitle(task.name)")
    expect(sidebarSource).toContain("repeatTaskTitleHints")
    expect(sidebarSource).toContain("const taskSidebarSessions = useMemo(")
    expect(sidebarSource).toContain("...pinnedTaskSidebarSessions")
    expect(sidebarSource).toContain("...unpinnedTaskSidebarSessions")
    expect(sidebarSource).toContain("{hasTaskSessions && (")
    expect(sidebarSource).toContain('<span className="select-none">Tasks</span>')
    expect(sidebarSource).not.toContain("Pinned tasks")
    expect(sidebarSource).not.toContain("Hide tasks section")
  })

  it("renders Tasks above regular sessions with separate pagination", () => {
    const tasksHeaderIndex = sidebarSource.indexOf("{hasTaskSessions && (")
    const sessionsHeaderIndex = sidebarSource.indexOf('<span className="select-none">Sessions</span>')
    const sessionsListIndex = sidebarSource.lastIndexOf("orderedUngroupedUserSidebarSessions.map((entry)")

    expect(tasksHeaderIndex).toBeGreaterThan(-1)
    expect(sessionsHeaderIndex).toBeGreaterThan(-1)
    expect(sessionsListIndex).toBeGreaterThan(-1)
    expect(tasksHeaderIndex).toBeLessThan(sessionsHeaderIndex)
    expect(sessionsHeaderIndex).toBeLessThan(sessionsListIndex)
    expect(sidebarSource).toContain("hasMoreTaskSessions")
    expect(sidebarSource).toContain("Load more tasks")
    expect(sidebarSource).toContain("Show more")
  })

  it("preserves backend repeat-task markers when merging live progress", () => {
    expect(sidebarSource).toContain("isRepeatTask?: boolean")
    expect(sidebarSource).toContain("isRepeatTask: existingSession?.isRepeatTask")
  })

  it("recognizes saved task conversations whose titles are humanized from task slugs or headings", () => {
    expect(sidebarSource).toContain("toTitleCaseTaskName(task.name, { dropConnectorWords: true })")
    expect(sidebarSource).toContain("function getFirstMarkdownHeading")
    expect(sidebarSource).toContain("firstHeading ? `${firstHeading} Run` : null")
    expect(sidebarSource).toContain("flatMap(getRepeatTaskTitleHints)")
  })

  it("forces task rows to remain one line", () => {
    expect(sidebarSource).toContain("forceSingleLine?: boolean")
    expect(sidebarSource).toContain("reorderContainerGroupId?: string | null")
    expect(sidebarSource).toContain("const forceSingleLine = options.forceSingleLine ?? false")
    expect(sidebarSource).toContain("!forceSingleLine &&")
    expect(sidebarSource).toContain("visibleTaskSidebarSessions.map((entry, idx) =>")
    expect(sidebarSource).toContain("renderSessionRow(entry, tasksOffset + idx, { forceSingleLine: true })")
  })

  it("supports dragging session groups to reorder them", () => {
    expect(sidebarSource).toContain("SIDEBAR_GROUP_DRAG_MIME")
    expect(sidebarSource).toContain("const [draggingGroupId, setDraggingGroupId]")
    expect(sidebarSource).toContain("handleGroupHeaderDragOver")
    expect(sidebarSource).toContain("handleGroupHeaderDrop")
    expect(sidebarSource).toContain("reorderSidebarSessionGroups(")
    expect(sidebarSource).toContain('title="Drag to reorder group"')
  })

  it("distinguishes task rows from regular sessions with section headings", () => {
    expect(sidebarSource).toContain('<span className="select-none">Tasks</span>')
    expect(sidebarSource).toContain('<span className="select-none">Sessions</span>')
    expect(sidebarSource).not.toContain("violet")
  })

  it("uses compact unindented sidebar section headings", () => {
    const tasksHeaderIndex = sidebarSource.indexOf('<span className="select-none">Tasks</span>')
    const sessionsHeaderIndex = sidebarSource.indexOf('<span className="select-none">Sessions</span>')
    const savedConversationsIndex = sidebarSource.indexOf('aria-label="Saved conversations"')

    expect(tasksHeaderIndex).toBeGreaterThan(-1)
    expect(sessionsHeaderIndex).toBeGreaterThan(-1)
    expect(savedConversationsIndex).toBeGreaterThan(-1)
    expect(tasksHeaderIndex).toBeLessThan(sessionsHeaderIndex)
    expect(sessionsHeaderIndex).toBeLessThan(savedConversationsIndex)
    expect(sidebarSource).toContain('-ml-2 mt-1 flex items-center gap-1 px-1.5 pb-0.5 pt-1 text-[10px]')
    expect(sidebarSource).toContain('"-ml-2 flex items-center gap-1 px-1.5 pb-0.5 pt-1 text-[10px]')
    expect(sidebarSource).toContain('<Clock className="h-3.5 w-3.5" />')
    expect(sidebarSource).not.toContain("i-mingcute-grid-line")
    expect(sidebarSource).not.toContain("text-sm font-medium transition-all duration-200")
  })

  it("keeps active task rows visible when historical task rows are collapsed", () => {
    expect(sidebarSource).toContain("const activeTaskSidebarSessions = useMemo(")
    expect(sidebarSource).toContain("const progress = agentProgressById.get(entry.session.id)")
    expect(sidebarSource).toContain("!entry.isSavedConversation &&")
    expect(sidebarSource).toContain('entry.session.status === "active" &&')
    expect(sidebarSource).toContain("progress?.isComplete !== true")
    expect(sidebarSource).toContain("tasksSectionExpanded ? paginatedTaskSidebarSessions : activeTaskSidebarSessions")
    expect(sidebarSource).toContain("const tasksListVisible = visibleTaskSidebarSessions.length > 0")
  })

  it("lets the session list size naturally instead of keeping a collapsed gap", () => {
    expect(sidebarSource).not.toContain("max-h-[45vh]")
    expect(sidebarSource).toContain("mt-1 space-y-0.5 overflow-visible")
  })

  it("defaults regular sessions to five rows and supports shrinking below the default", () => {
    expect(sidebarSource).toContain("const DEFAULT_VISIBLE_SIDEBAR_SESSIONS = 5")
    expect(sidebarSource).toContain("const SIDEBAR_PAST_SESSIONS_PAGE_SIZE = 5")
    expect(sidebarSource).toContain("const MIN_VISIBLE_SIDEBAR_ITEMS = 1")
    expect(sidebarSource).toContain("DEFAULT_VISIBLE_SIDEBAR_SESSIONS - activeUserSidebarSessionCount")
    expect(sidebarSource).toContain("useState<number | null>(null)")
    expect(sidebarSource).toContain("visibleSavedConversationCount ?? defaultSavedConversationRows")
    expect(sidebarSource).toContain("Math.max(next, minimumVisibleSavedConversationRows)")
    expect(sidebarSource).not.toContain("handleSidebarSessionsScroll")
    expect(sidebarSource).not.toContain("onScroll=")
  })

  it("renders show less to the right of show more", () => {
    const showMoreIndex = sidebarSource.lastIndexOf("Show more")
    const showLessIndex = sidebarSource.lastIndexOf("Show less")

    expect(sidebarSource).toContain("const canShowLessSavedConversations =")
    expect(sidebarSource).toContain("visiblePageableSavedConversationCount > minimumVisibleSavedConversationRows")
    expect(sidebarSource).toContain("const showLessSavedConversations = useCallback")
    expect(sidebarSource).toContain("hasMoreSavedConversations || canShowLessSavedConversations")
    expect(showMoreIndex).toBeGreaterThan(-1)
    expect(showLessIndex).toBeGreaterThan(showMoreIndex)
  })
})