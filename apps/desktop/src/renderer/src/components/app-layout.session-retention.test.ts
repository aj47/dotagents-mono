import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(
  new URL("./app-layout.tsx", import.meta.url),
  "utf8",
)

describe("app layout session retention", () => {
  it("keeps store-backed sessions in the collapsed active preview list", () => {
    expect(appLayoutSource).toContain(
      "const trackedActiveSessions = sessionData?.activeSessions ?? []",
    )
    expect(appLayoutSource).toContain(
      "for (const [sessionId, progress] of agentProgressById.entries())",
    )
    expect(appLayoutSource).toContain("status: progress.isComplete")
    expect(appLayoutSource).toContain(
      "const isVisiblyActive = isFocused || !isSnoozed",
    )
  })

  it("shows compact multi-character labels for collapsed session previews", () => {
    expect(appLayoutSource).toContain(
      'const collapsedTitle = title.replace(/\\s+/g, " ")',
    )
    expect(appLayoutSource).toContain(
      "rounded-md px-0.5 transition-all duration-200",
    )
    expect(appLayoutSource).toContain(
      "line-clamp-2 max-w-[calc(100%-0.375rem)] text-center text-[7px] font-medium leading-[0.55rem] tracking-tight [overflow-wrap:anywhere]",
    )
    expect(appLayoutSource).toContain(
      "const handleCollapsedSessionsOverviewClick = useCallback(() => {",
    )
    expect(appLayoutSource).toContain("setSavedConversationsDialogOpen(true)")
    expect(appLayoutSource).toContain("handleCollapsedSessionsOverviewClick()")
    expect(appLayoutSource).toContain(
      "const handleCollapsedSessionClick = useCallback(",
    )
    expect(appLayoutSource).toContain("setScrollToSessionId(sessionId)")
    expect(appLayoutSource).toContain("aria-label={`Open session ${title}`}")
    expect(appLayoutSource).not.toContain(
      "const initial = title.charAt(0).toUpperCase()",
    )
  })

  it("archives the focused session from Ctrl+W using the backing conversation id", () => {
    expect(appLayoutSource).toContain(
      "const handleArchiveFocusedSession = useCallback(async () => {",
    )
    expect(appLayoutSource).toContain("store.focusedSessionId")
    expect(appLayoutSource).toContain("store.expandedSessionId")
    expect(appLayoutSource).toContain("store.viewedConversationId")
    expect(appLayoutSource).toContain("if (archiveCandidates.length === 0)")
    expect(appLayoutSource).toContain("const fallbackCandidates = Array.from(")
    expect(appLayoutSource).toContain("addSessionCandidate(fallback.sessionId)")
    expect(appLayoutSource).toContain(
      "progress?.conversationId ?? trackedSession?.conversationId",
    )
    expect(appLayoutSource).toContain(
      "store.toggleArchiveSession(conversationId)",
    )
    expect(appLayoutSource).not.toContain(
      'toast.message("No focused session to archive")',
    )
    expect(appLayoutSource).toContain(
      "if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)",
    )
    expect(appLayoutSource).toContain(
      'if (event.key.toLowerCase() !== "w") return',
    )
    expect(appLayoutSource).toContain("void handleArchiveFocusedSession()")
  })

  it("opens the archived conversations view from sidebar buttons", () => {
    expect(appLayoutSource).toContain("savedConversationsArchivedOnOpen")
    expect(appLayoutSource).toContain(
      "initialArchivedOnly={savedConversationsArchivedOnOpen}",
    )
    expect(appLayoutSource).toContain(
      "const handleOpenArchivedConversationsDialog = useCallback(() => {",
    )
    expect(appLayoutSource).toContain(
      "openSavedConversationsDialog({ archivedOnly: true })",
    )
    expect(appLayoutSource).toContain('title="Archived sessions"')
  })

  it("lets normal sessions fill the sidebar without pinned app navigation", () => {
    expect(appLayoutSource).toContain(
      "Normal sidebar: sessions fill the available sidebar height.",
    )
    expect(appLayoutSource).not.toContain("Sidebar footer - pinned app navigation")
    expect(appLayoutSource).not.toContain("const sidebarFooterLinks")
    expect(appLayoutSource).toContain(
      "mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
    )
    expect(appLayoutSource).toContain('className="min-h-full"')
    expect(appLayoutSource).not.toContain(
      "sessions and settings scroll together",
    )
  })
})
