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
    expect(sidebarSource).toContain("visibleTaskSidebarSessions.map((entry) =>")
    expect(sidebarSource).toContain("renderSessionRow(entry, { forceSingleLine: true })")
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

  it("keeps runtime task rows visible when historical task rows are collapsed", () => {
    expect(sidebarSource).toContain("const runtimeTaskSidebarSessions = useMemo(")
    expect(sidebarSource).toContain("return !entry.isSavedConversation")
    expect(sidebarSource).toContain("tasksSectionExpanded ? paginatedTaskSidebarSessions : runtimeTaskSidebarSessions")
    expect(sidebarSource).toContain("const tasksListVisible = visibleTaskSidebarSessions.length > 0")
  })

  it("keeps hotkey targets aligned with switchable sidebar rows and visible badges", () => {
    const hotkeySessionsIndex = sidebarSource.indexOf("const sidebarHotkeySessions = useMemo")
    const hotkeyIndexIndex = sidebarSource.indexOf("const hotkeyIndexBySessionId = useMemo")
    const hotkeySessionsBlock = sidebarSource.slice(hotkeySessionsIndex, hotkeyIndexIndex)

    expect(hotkeySessionsIndex).toBeGreaterThan(-1)
    expect(hotkeyIndexIndex).toBeGreaterThan(hotkeySessionsIndex)
    expect(hotkeySessionsBlock).toContain("...visibleTaskSidebarSessions")
    expect(hotkeySessionsBlock).toContain("...visibleGroupedUserSidebarSessions")
    expect(hotkeySessionsBlock).toContain("return !entry.isSavedConversation || !!entry.session.conversationId")
    expect(hotkeySessionsBlock).not.toContain("isExpanded")
    expect(sidebarSource).not.toContain("const isSidebarHotkeyEligible = useCallback")
    expect(sidebarSource).toContain("const hotkeyIndexBySessionId = useMemo")
    expect(sidebarSource).toContain("sidebarHotkeySessions.forEach((entry, idx) =>")
    expect(sidebarSource).toContain("const canShowHotkeyBadge =")
    expect(sidebarSource).toContain("!isNestedSubagent")
    expect(sidebarSource).toContain("to open this conversation")
    expect(sidebarSource).toContain("canShowHotkeyBadge && (sessionPreview || lastMessageMinutesAgo)")
  })

  it("captures sidebar hotkeys before focused controls can stop propagation", () => {
    expect(sidebarSource).toContain("function getSidebarHotkeyDigit(event: KeyboardEvent): number | null")
    expect(sidebarSource).toContain("event.code.match(/^(?:Digit|Numpad)([1-9])$/u)")
    expect(sidebarSource).toContain("Number.parseInt(event.key, 10)")
    expect(sidebarSource).toContain("if (!isMod || e.altKey || e.shiftKey) return")
    expect(sidebarSource).toContain("const digit = getSidebarHotkeyDigit(e)")
    expect(sidebarSource).toContain('window.addEventListener("keydown", handleKeyDown, true)')
    expect(sidebarSource).toContain('window.removeEventListener("keydown", handleKeyDown, true)')
  })

  it("lets the session list flex into available sidebar height", () => {
    expect(sidebarSource).not.toContain("max-h-[45vh]")
    expect(sidebarSource).toContain("sessionListRef")
    expect(sidebarSource).toContain("sessionListContentRef")
    expect(sidebarSource).toContain("flex h-full min-h-full flex-col")
    expect(sidebarSource).toContain("mt-1 min-h-0 flex-1 overflow-visible")
    expect(sidebarSource).toContain('className="space-y-0.5"')
  })

  it("uses five regular session rows as the floor and auto-fills empty sidebar space", () => {
    expect(sidebarSource).toContain("const DEFAULT_VISIBLE_SIDEBAR_SESSIONS = 5")
    expect(sidebarSource).toContain("const SIDEBAR_PAST_SESSIONS_PAGE_SIZE = 5")
    expect(sidebarSource).toContain("const MIN_VISIBLE_SIDEBAR_ITEMS = 1")
    expect(sidebarSource).toContain("const SIDEBAR_SESSION_ROW_ESTIMATE_PX = 28")
    expect(sidebarSource).toContain("DEFAULT_VISIBLE_SIDEBAR_SESSIONS - activeUserSidebarSessionCount")
    expect(sidebarSource).toContain("useState<number | null>(null)")
    expect(sidebarSource).toContain("const [autoVisibleSavedConversationCount, setAutoVisibleSavedConversationCount]")
    expect(sidebarSource).toContain("requestedSavedConversationCount")
    expect(sidebarSource).toContain("autoVisibleSavedConversationCount")
    expect(sidebarSource).toContain("displayedSavedConversationCount")
    expect(sidebarSource).toContain("const contentHeight = contentElement.getBoundingClientRect().height")
    expect(sidebarSource).toContain("availableHeight - contentHeight")
    expect(sidebarSource).toContain("heightDelta < SIDEBAR_SESSION_ROW_ESTIMATE_PX")
    expect(sidebarSource).toContain("visiblePageableSavedConversationCount + additionalRows")
    expect(sidebarSource).toContain("Math.max(")
    expect(sidebarSource).toContain("previousCount")
    expect(sidebarSource).toContain("new ResizeObserver(updateAutoVisibleRows)")
    expect(sidebarSource).not.toContain("Math.ceil(heightDelta / SIDEBAR_SESSION_ROW_ESTIMATE_PX)")
    expect(sidebarSource).not.toContain("handleSidebarSessionsScroll")
    expect(sidebarSource).not.toContain("onScroll=")
  })

  it("renders show less to the right of show more", () => {
    const showMoreIndex = sidebarSource.lastIndexOf("Show more")
    const showLessIndex = sidebarSource.lastIndexOf("Show less")

    expect(sidebarSource).toContain("const canShowLessSavedConversations =")
    expect(sidebarSource).toContain("const minimumRequestedSavedConversationRows = Math.max")
    expect(sidebarSource).toContain("requestedSavedConversationCount > minimumRequestedSavedConversationRows")
    expect(sidebarSource).toContain("displayedSavedConversationCount")
    expect(sidebarSource).toContain("const showLessSavedConversations = useCallback")
    expect(sidebarSource).toContain("hasMoreSavedConversations || canShowLessSavedConversations")
    expect(showMoreIndex).toBeGreaterThan(-1)
    expect(showLessIndex).toBeGreaterThan(showMoreIndex)
  })
})
