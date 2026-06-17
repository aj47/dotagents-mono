import { useQuery, useQueryClient } from "@tanstack/react-query"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@renderer/components/ui/button"
import { AppBottomBar } from "@renderer/components/app-bottom-bar"
import { ActiveAgentsSidebar } from "@renderer/components/active-agents-sidebar"
import { SandboxSlotIndicator } from "@renderer/components/sandbox-slot-switcher"
import {
  SessionActionDialog,
  type SessionActionDialogMode,
} from "@renderer/components/session-action-dialog"
import { ShortcutReferenceDialog } from "@renderer/components/shortcut-reference-dialog"
import { SettingsSidebarNavigation } from "@renderer/components/settings-navigation"
import { useSelectedAgentId } from "@renderer/components/agent-selector"

import { SavedConversationsDialog } from "@renderer/components/past-sessions-dialog"
import { useSidebar, SIDEBAR_DIMENSIONS } from "@renderer/hooks/use-sidebar"
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { useTTSPlaybackController } from "@renderer/lib/tts-playback-controller"
import { applySelectedAgentToNextSession as applySelectedAgentForNextSession } from "@renderer/lib/apply-selected-agent"
import { hasUnreadAgentResponse } from "@renderer/lib/sidebar-sessions"
import { isConsolidatedSettingsRoute } from "@renderer/lib/settings-navigation"
import { useAgentStore } from "@renderer/stores"
import {
  Clock,
  Archive,
  PanelLeftClose,
  PanelLeft,
  Volume2,
  VolumeX,
  OctagonX,
  Loader2,
  Plus,
  Mic,
} from "lucide-react"
import { toast } from "sonner"

interface AgentSession {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime?: number
  endTime?: number
  isSnoozed?: boolean
}

interface SessionListResponse {
  activeSessions: AgentSession[]
  recentCompletedSessions?: AgentSession[]
  recentSessions?: AgentSession[]
}

type SessionActionDialogState = {
  mode: SessionActionDialogMode
  initialText?: string
  conversationId?: string
  sessionId?: string
  fromTile?: boolean
  continueConversationTitle?: string
  agentName?: string
  onSubmitted?: () => void
}

export const Component = () => {
  useTTSPlaybackController()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [savedConversationsDialogOpen, setSavedConversationsDialogOpen] =
    useState(false)
  const [savedConversationsHotkeyOpen, setSavedConversationsHotkeyOpen] =
    useState(false)
  const [
    savedConversationsArchivedOnOpen,
    setSavedConversationsArchivedOnOpen,
  ] = useState(false)
  const [shortcutReferenceDialogOpen, setShortcutReferenceDialogOpen] =
    useState(false)
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false)
  const [sessionActionDialog, setSessionActionDialog] =
    useState<SessionActionDialogState | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useSelectedAgentId()
  const { isCollapsed, width, isResizing, toggleCollapse, handleResizeStart } =
    useSidebar()
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const setScrollToSessionId = useAgentStore((s) => s.setScrollToSessionId)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const agentResponseReadAtBySessionId = useAgentStore(
    (s) => s.agentResponseReadAtBySessionId,
  )

  const { data: sessionData, refetch: refetchSessionData } =
    useQuery<SessionListResponse>({
      queryKey: ["agentSessions"],
      queryFn: async () => {
        return await tipcClient.getAgentSessions()
      },
      enabled: isCollapsed,
      refetchOnWindowFocus: false,
    })

  useEffect(() => {
    const unlisten = rendererHandlers.agentSessionsUpdated.listen(() => {
      if (isCollapsed) {
        refetchSessionData()
      }
    })
    return unlisten
  }, [isCollapsed, refetchSessionData])

  const isGlobalTTSEnabled = configQuery.data?.ttsEnabled ?? true
  const trackedActiveSessions = sessionData?.activeSessions ?? []
  const collapsedActiveSessions = useMemo(() => {
    const mergedSessions = new Map(
      trackedActiveSessions.map((session) => [session.id, session] as const),
    )

    for (const [sessionId, progress] of agentProgressById.entries()) {
      const existingSession = mergedSessions.get(sessionId)
      const firstHistoryTimestamp = progress.conversationHistory?.[0]?.timestamp
      const lastHistoryTimestamp =
        progress.conversationHistory?.[progress.conversationHistory.length - 1]
          ?.timestamp

      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId:
          progress.conversationId ?? existingSession?.conversationId,
        conversationTitle:
          progress.conversationTitle ?? existingSession?.conversationTitle,
        status: progress.isComplete
          ? "completed"
          : (existingSession?.status ?? "active"),
        startTime:
          existingSession?.startTime ??
          firstHistoryTimestamp ??
          lastHistoryTimestamp ??
          Date.now(),
        endTime:
          existingSession?.endTime ??
          (progress.isComplete ? lastHistoryTimestamp : undefined),
        isSnoozed: progress.isSnoozed ?? existingSession?.isSnoozed,
      })
    }

    return Array.from(mergedSessions.values()).sort((a, b) => {
      const aProgress = agentProgressById.get(a.id)
      const bProgress = agentProgressById.get(b.id)
      const aTimestamp =
        aProgress?.conversationHistory?.[
          aProgress.conversationHistory.length - 1
        ]?.timestamp ??
        a.endTime ??
        a.startTime ??
        0
      const bTimestamp =
        bProgress?.conversationHistory?.[
          bProgress.conversationHistory.length - 1
        ]?.timestamp ??
        b.endTime ??
        b.startTime ??
        0
      return bTimestamp - aTimestamp
    })
  }, [trackedActiveSessions, agentProgressById])
  const collapsedPreviewSessions = useMemo(
    () => collapsedActiveSessions.slice(0, 3),
    [collapsedActiveSessions],
  )
  const clearInactiveSessions = useCallback(() => {
    navigate("/")
    window.dispatchEvent(new Event("sessions:clear-inactive"))
  }, [navigate])

  const openSavedConversationsDialog = useCallback(
    (options?: { archivedOnly?: boolean; focusSearch?: boolean }) => {
      setSavedConversationsArchivedOnOpen(options?.archivedOnly ?? false)
      setSavedConversationsHotkeyOpen(options?.focusSearch ?? false)
      setSavedConversationsDialogOpen(true)
    },
    [],
  )

  const handleArchiveFocusedSession = useCallback(async () => {
    const store = useAgentStore.getState()

    let sessionDataSnapshot = queryClient.getQueryData<SessionListResponse>([
      "agentSessions",
    ])

    if (!sessionDataSnapshot) {
      try {
        sessionDataSnapshot = await tipcClient.getAgentSessions()
      } catch (error) {
        console.error("Failed to load sessions before archiving:", error)
      }
    }

    const trackedSessions = [
      ...(sessionDataSnapshot?.activeSessions ?? []),
      ...(sessionDataSnapshot?.recentCompletedSessions ??
        sessionDataSnapshot?.recentSessions ??
        []),
    ]
    const sessionById = new Map(
      trackedSessions.map((session) => [session.id, session] as const),
    )

    const archiveCandidates: Array<{
      sessionId?: string
      conversationId?: string
    }> = []
    const seenArchiveCandidateKeys = new Set<string>()
    const addSessionCandidate = (sessionId: string | null | undefined) => {
      if (!sessionId) return
      const key = `session:${sessionId}`
      if (seenArchiveCandidateKeys.has(key)) return
      seenArchiveCandidateKeys.add(key)
      archiveCandidates.push({ sessionId })
    }
    const addConversationCandidate = (
      conversationId: string | null | undefined,
    ) => {
      if (!conversationId) return
      const key = `conversation:${conversationId}`
      if (seenArchiveCandidateKeys.has(key)) return
      seenArchiveCandidateKeys.add(key)
      archiveCandidates.push({ conversationId })
    }

    addSessionCandidate(store.focusedSessionId)
    addSessionCandidate(store.expandedSessionId)
    addConversationCandidate(store.viewedConversationId)

    const getCandidateTimestamp = (
      progress: ReturnType<typeof store.agentProgressById.get>,
      trackedSession: AgentSession | undefined,
    ) => {
      const history = progress?.conversationHistory
      const lastHistoryTimestamp = history?.[history.length - 1]?.timestamp
      return (
        lastHistoryTimestamp ??
        trackedSession?.endTime ??
        trackedSession?.startTime ??
        0
      )
    }

    if (archiveCandidates.length === 0) {
      const fallbackCandidates = Array.from(
        new Set([
          ...trackedSessions.map((session) => session.id),
          ...store.agentProgressById.keys(),
        ]),
      )
        .map((sessionId) => {
          const progress = store.agentProgressById.get(sessionId)
          const trackedSession = sessionById.get(sessionId)
          const conversationId =
            progress?.conversationId ?? trackedSession?.conversationId
          const isActive = progress
            ? !progress.isComplete && !progress.isSnoozed
            : trackedSession?.status === "active"
          return {
            sessionId,
            conversationId,
            isActive,
            timestamp: getCandidateTimestamp(progress, trackedSession),
          }
        })
        .filter((candidate) => {
          return (
            !!candidate.conversationId &&
            !store.archivedSessionIds.has(candidate.conversationId)
          )
        })
        .sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
          return b.timestamp - a.timestamp
        })

      for (const fallback of fallbackCandidates) {
        addSessionCandidate(fallback.sessionId)
      }
    }

    for (const candidate of archiveCandidates) {
      const sessionId = candidate.sessionId
      const progress = sessionId
        ? store.agentProgressById.get(sessionId)
        : undefined
      const trackedSession = sessionId ? sessionById.get(sessionId) : undefined
      const conversationId =
        candidate.conversationId ??
        progress?.conversationId ??
        trackedSession?.conversationId

      if (!conversationId) continue

      if (!store.archivedSessionIds.has(conversationId)) {
        store.toggleArchiveSession(conversationId)
      }

      const canDismiss =
        progress?.isComplete === true ||
        (trackedSession?.status !== undefined &&
          trackedSession.status !== "active")

      if (sessionId && canDismiss) {
        try {
          await tipcClient.clearAgentSessionProgress({ sessionId })
          await queryClient.invalidateQueries({ queryKey: ["agentSessions"] })
        } catch (error) {
          console.error("Failed to dismiss archived session:", error)
        }
      }

      toast.success("Session archived")
      return
    }

    toast.message("No session with a saved conversation to archive")
  }, [queryClient])

  const applySelectedAgentToNextSession = useCallback(
    async (options?: { silent?: boolean }) => {
      return applySelectedAgentForNextSession({
        selectedAgentId,
        setSelectedAgentId,
        silent: options?.silent,
      })
    },
    [selectedAgentId, setSelectedAgentId],
  )

  useEffect(() => {
    void applySelectedAgentToNextSession({ silent: true })
  }, [applySelectedAgentToNextSession])

  const openSessionActionDialog = useCallback(
    (dialogState: SessionActionDialogState) => {
      setSessionActionDialog(dialogState)
    },
    [],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isEditable =
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"

      if (isEditable) return
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey)
        return
      if (event.key.toLowerCase() !== "k") return

      event.preventDefault()
      event.stopPropagation()
      openSavedConversationsDialog({ focusSearch: true })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [openSavedConversationsDialog])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isEditable =
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"

      if (isEditable) return
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
        return
      if (event.key.toLowerCase() !== "w") return

      event.preventDefault()
      event.stopPropagation()
      void handleArchiveFocusedSession()
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [handleArchiveFocusedSession])

  const handleOpenArchivedConversationsDialog = useCallback(() => {
    openSavedConversationsDialog({ archivedOnly: true })
  }, [openSavedConversationsDialog])

  const handleStartTextSession = useCallback(async () => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    openSessionActionDialog({ mode: "text" })
  }, [applySelectedAgentToNextSession, openSessionActionDialog])

  const handleStartVoiceSession = useCallback(
    async (options?: {
      conversationId?: string
      continueConversationTitle?: string
    }) => {
      const applied = await applySelectedAgentToNextSession()
      if (!applied) return
      openSessionActionDialog({
        mode: "voice",
        conversationId: options?.conversationId,
        continueConversationTitle: options?.continueConversationTitle,
      })
    },
    [applySelectedAgentToNextSession, openSessionActionDialog],
  )

  const handleStartPromptSession = useCallback(
    async (content: string) => {
      const applied = await applySelectedAgentToNextSession()
      if (!applied) return
      openSessionActionDialog({ mode: "text", initialText: content })
    },
    [applySelectedAgentToNextSession, openSessionActionDialog],
  )

  useEffect(() => {
    const handleMainWindowNewChatKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isEditable =
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"

      if (isEditable || sessionActionDialog || shortcutReferenceDialogOpen)
        return

      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toLowerCase().includes("mac")
      const hasNewChatModifier = isMac
        ? event.metaKey && !event.ctrlKey
        : event.ctrlKey && !event.metaKey

      if (!hasNewChatModifier || event.altKey || event.shiftKey) return
      if (event.key.toLowerCase() !== "n") return

      event.preventDefault()
      event.stopPropagation()
      void handleStartTextSession()
    }

    window.addEventListener("keydown", handleMainWindowNewChatKeyDown, true)
    return () =>
      window.removeEventListener("keydown", handleMainWindowNewChatKeyDown, true)
  }, [handleStartTextSession, sessionActionDialog, shortcutReferenceDialogOpen])

  const saveConfig = useCallback(
    (partial: Record<string, unknown>) => {
      if (!configQuery.data) return

      saveConfigMutation.mutate({
        config: {
          ...configQuery.data,
          ...partial,
        },
      })
    },
    [configQuery.data, saveConfigMutation],
  )

  const handleToggleGlobalTTS = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()

      const nextEnabled = !(configQuery.data?.ttsEnabled ?? true)
      if (!nextEnabled) {
        try {
          await tipcClient.controlTTSPlayback({
            type: "stop",
            reason: "collapsed-sidebar-global-tts-disabled",
          })
          await tipcClient.stopAllTts()
        } catch (error) {
          console.error("Failed to stop TTS in all windows:", error)
        }
      }
      saveConfig({ ttsEnabled: nextEnabled })
    },
    [configQuery.data?.ttsEnabled, saveConfig],
  )

  const handleEmergencyStopAll = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isEmergencyStopping) return

      setIsEmergencyStopping(true)
      try {
        await tipcClient.controlTTSPlayback({
          type: "stop",
          reason: "collapsed-sidebar-emergency-stop",
        })
        await tipcClient.stopAllTts()
      } catch (error) {
        console.error("Failed to stop TTS in all windows:", error)
      }

      try {
        await tipcClient.emergencyStopAgent()
        setFocusedSessionId(null)
      } catch (error) {
        console.error("Failed to trigger emergency stop:", error)
      } finally {
        setIsEmergencyStopping(false)
      }
    },
    [isEmergencyStopping, setFocusedSessionId],
  )

  const handleCollapsedSessionsOverviewClick = useCallback(() => {
    openSavedConversationsDialog()
  }, [openSavedConversationsDialog])

  const handleCollapsedSessionClick = useCallback(
    (sessionId: string) => {
      navigate("/", { state: { clearPendingConversation: true } })
      setFocusedSessionId(sessionId)
      setScrollToSessionId(sessionId)
    },
    [navigate, setFocusedSessionId, setScrollToSessionId],
  )

  useEffect(() => {
    return rendererHandlers.navigate.listen((url) => {
      navigate(url)
    })
  }, [])

  const sidebarWidth = isCollapsed ? SIDEBAR_DIMENSIONS.width.collapsed : width
  const isSettingsSidebarMode = isConsolidatedSettingsRoute(location.pathname)

  const isSessionsActive =
    location.pathname === "/" ||
    (!location.pathname.startsWith("/settings") &&
      !location.pathname.startsWith("/onboarding") &&
      !location.pathname.startsWith("/setup") &&
      !location.pathname.startsWith("/panel") &&
      !location.pathname.startsWith("/knowledge"))

  return (
    <>
      <SavedConversationsDialog
        open={savedConversationsDialogOpen}
        autoFocusSearch={savedConversationsHotkeyOpen}
        initialArchivedOnly={savedConversationsArchivedOnOpen}
        onAutoFocusSearchHandled={() => setSavedConversationsHotkeyOpen(false)}
        onOpenChange={(open) => {
          setSavedConversationsDialogOpen(open)
          if (!open) {
            setSavedConversationsHotkeyOpen(false)
          }
        }}
      />

      <div className="flex h-dvh flex-col">
        <div className="flex min-h-0 flex-1">
          {/* Sidebar with dynamic width */}
          <div
            className={cn(
              "bg-background relative flex shrink-0 flex-col border-r",
              !isResizing && "transition-all duration-200",
              isResizing && "select-none",
            )}
            style={{ width: sidebarWidth }}
          >
            {/* Header with collapse toggle */}
            <header
              className={cn(
                "flex shrink-0 items-center",
                isCollapsed
                  ? "justify-center"
                  : isSettingsSidebarMode
                    ? "justify-end"
                    : "justify-between",
                // On macOS, add top padding to clear the traffic-light window controls
                process.env.IS_MAC ? "app-drag-region pb-1 pt-7" : "pb-1 pt-2",
                isCollapsed ? "px-1" : "px-2",
              )}
            >
              {!isCollapsed && !isSettingsSidebarMode && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm-icon"
                    onClick={handleToggleGlobalTTS}
                    disabled={!configQuery.data || saveConfigMutation.isPending}
                    className="app-no-drag-region text-muted-foreground hover:bg-accent/50 hover:text-foreground shrink-0 disabled:opacity-50"
                    title={
                      isGlobalTTSEnabled
                        ? "Disable global TTS"
                        : "Enable global TTS"
                    }
                    aria-label={
                      isGlobalTTSEnabled
                        ? "Disable global TTS"
                        : "Enable global TTS"
                    }
                  >
                    {saveConfigMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isGlobalTTSEnabled ? (
                      <Volume2 className="h-3.5 w-3.5" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm-icon"
                    onClick={handleEmergencyStopAll}
                    disabled={isEmergencyStopping}
                    className="app-no-drag-region text-destructive hover:bg-destructive/10 shrink-0 disabled:opacity-50"
                    title="Emergency stop all agent sessions"
                    aria-label="Emergency stop all agent sessions"
                  >
                    {isEmergencyStopping ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <OctagonX className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm-icon"
                onClick={toggleCollapse}
                className={cn(
                  "app-no-drag-region shrink-0",
                  "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <PanelLeft className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                )}
              </Button>
            </header>

            {/* Main sidebar body */}
            {isCollapsed ? (
              /* Collapsed sidebar: session controls stay above bottom app navigation. */
              <div className="flex min-h-0 flex-1 flex-col px-1">
                <div className="mt-2 grid gap-1">
                  <button
                    type="button"
                    onClick={handleToggleGlobalTTS}
                    disabled={!configQuery.data || saveConfigMutation.isPending}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      "text-muted-foreground hover:bg-accent/50 hover:text-foreground disabled:opacity-50",
                    )}
                    title={
                      isGlobalTTSEnabled
                        ? "Disable global TTS"
                        : "Enable global TTS"
                    }
                    aria-label={
                      isGlobalTTSEnabled
                        ? "Disable global TTS"
                        : "Enable global TTS"
                    }
                  >
                    {saveConfigMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isGlobalTTSEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleEmergencyStopAll}
                    disabled={isEmergencyStopping}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      "text-destructive hover:bg-destructive/10 disabled:opacity-50",
                    )}
                    title="Emergency stop all agent sessions"
                    aria-label="Emergency stop all agent sessions"
                  >
                    {isEmergencyStopping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <OctagonX className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openSavedConversationsDialog()}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      savedConversationsDialogOpen &&
                        !savedConversationsArchivedOnOpen
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                    title="Saved conversations"
                    aria-label="Saved conversations"
                    aria-pressed={
                      savedConversationsDialogOpen &&
                      !savedConversationsArchivedOnOpen
                        ? true
                        : undefined
                    }
                  >
                    <Clock className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenArchivedConversationsDialog}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      savedConversationsDialogOpen &&
                        savedConversationsArchivedOnOpen
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                    title="Archived sessions"
                    aria-label="Archived sessions"
                    aria-pressed={
                      savedConversationsDialogOpen &&
                      savedConversationsArchivedOnOpen
                        ? true
                        : undefined
                    }
                  >
                    <Archive className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleStartTextSession()}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                    title="Start with text"
                    aria-label="Start with text"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleStartVoiceSession()}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                    title="Start with voice"
                    aria-label="Start with voice"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <NavLink
                    to="/"
                    end
                    onClick={(e) => {
                      e.preventDefault()
                      handleCollapsedSessionsOverviewClick()
                    }}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                      isSessionsActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                    title="Sessions"
                    aria-label="Sessions"
                    aria-current={isSessionsActive ? "page" : undefined}
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="i-mingcute-chat-3-line"></span>
                      {collapsedActiveSessions.length > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                          {collapsedActiveSessions.length > 9
                            ? "9+"
                            : collapsedActiveSessions.length}
                        </span>
                      )}
                    </div>
                  </NavLink>

                  {collapsedPreviewSessions.map((session) => {
                    const isFocused = focusedSessionId === session.id
                    const sessionProgress = agentProgressById.get(session.id)
                    const hasPendingApproval =
                      !!sessionProgress?.pendingToolApproval
                    const isSnoozed = sessionProgress?.isSnoozed ?? false
                    const hasUnreadResponse = hasUnreadAgentResponse(
                      sessionProgress,
                      agentResponseReadAtBySessionId.get(session.id),
                      isFocused,
                    )
                    const isVisiblyActive = isFocused || !isSnoozed
                    const isInProgress =
                      session.status === "active" &&
                      !(sessionProgress?.isComplete ?? false)
                    const statusDotColor = hasPendingApproval
                      ? "bg-amber-500"
                      : hasUnreadResponse
                        ? "bg-blue-500"
                        : isInProgress
                          ? "bg-sky-500"
                          : !isVisiblyActive
                            ? "bg-muted-foreground"
                            : "bg-green-500"
                    const title =
                      session.conversationTitle?.trim() ||
                      "Untitled conversation"
                    const collapsedTitle = title.replace(/\s+/g, " ")

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleCollapsedSessionClick(session.id)}
                        className={cn(
                          "group relative flex h-8 w-full items-center justify-center rounded-md px-0.5 transition-all duration-200",
                          isFocused
                            ? "text-foreground bg-blue-500/15"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        )}
                        title={title}
                        aria-label={`Open session ${title}`}
                      >
                        <span className="line-clamp-2 max-w-[calc(100%-0.375rem)] text-center text-[7px] font-medium leading-[0.55rem] tracking-tight [overflow-wrap:anywhere]">
                          {collapsedTitle}
                        </span>
                        <span
                          className={cn(
                            "border-background absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border",
                            statusDotColor,
                            (isInProgress ||
                              isVisiblyActive ||
                              hasUnreadResponse) &&
                              !hasPendingApproval &&
                              "animate-pulse",
                          )}
                        />
                      </button>
                    )
                  })}

                  {collapsedActiveSessions.length >
                    collapsedPreviewSessions.length && (
                    <button
                      type="button"
                      onClick={handleCollapsedSessionsOverviewClick}
                      className={cn(
                        "flex h-8 w-full items-center justify-center rounded-md text-[10px] font-semibold transition-all duration-200",
                        "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                      title={`View ${collapsedActiveSessions.length - collapsedPreviewSessions.length} more sessions`}
                      aria-label="View more sessions"
                    >
                      +
                      {collapsedActiveSessions.length -
                        collapsedPreviewSessions.length}
                    </button>
                  )}
                </div>

                <div className="min-h-2 flex-1" />
              </div>
            ) : isSettingsSidebarMode ? (
              <div className="min-h-0 flex-1">
                <SettingsSidebarNavigation onBackToApp={() => navigate("/")} />
              </div>
            ) : (
              <>
                {/* Normal sidebar: sessions fill the available sidebar height. */}
                <div className="scrollbar-none mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  {/* Sandbox slot indicator */}
                  <div className="mt-1 shrink-0 px-2">
                    <SandboxSlotIndicator />
                  </div>

                  {/* Sessions Section - shows sessions list */}
                  <ActiveAgentsSidebar
                    className="min-h-full"
                    onOpenSavedConversationsDialog={() =>
                      openSavedConversationsDialog()
                    }
                    onOpenArchivedConversationsDialog={
                      handleOpenArchivedConversationsDialog
                    }
                    selectedAgentId={selectedAgentId}
                    onSelectAgent={setSelectedAgentId}
                    onStartTextSession={handleStartTextSession}
                    onStartVoiceSession={handleStartVoiceSession}
                    onStartPromptSession={handleStartPromptSession}
                    onClearInactiveSessions={
                      isSessionsActive ? clearInactiveSessions : undefined
                    }
                    inactiveSessionCount={0}
                  />
                </div>
              </>
            )}

            {/* Resize handle - only visible when not collapsed */}
            {!isCollapsed && (
              <div
                className={cn(
                  "absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors",
                  "hover:bg-primary/20",
                  isResizing && "bg-primary/30",
                )}
                onMouseDown={handleResizeStart}
                title="Drag to resize sidebar"
              />
            )}
          </div>

          {/* Main content area */}
          <div className="bg-background flex min-w-0 grow flex-col">
            {/* Scrollable content area */}
            <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
              <Outlet
                context={{
                  onOpenSavedConversationsDialog: () =>
                    openSavedConversationsDialog(),
                  sidebarWidth,
                  selectedAgentId,
                  setSelectedAgentId,
                  onStartTextSession: handleStartTextSession,
                  onStartVoiceSession: handleStartVoiceSession,
                  onStartPromptSession: handleStartPromptSession,
                  openSessionActionDialog,
                }}
              />
            </div>
          </div>
        </div>

        <AppBottomBar
          onOpenShortcutReference={() => setShortcutReferenceDialogOpen(true)}
        />
      </div>

      <ShortcutReferenceDialog
        open={shortcutReferenceDialogOpen}
        onOpenChange={setShortcutReferenceDialogOpen}
      />

      {sessionActionDialog && (
        <SessionActionDialog
          open={true}
          mode={sessionActionDialog.mode}
          initialText={sessionActionDialog.initialText}
          conversationId={sessionActionDialog.conversationId}
          sessionId={sessionActionDialog.sessionId}
          fromTile={sessionActionDialog.fromTile}
          continueConversationTitle={
            sessionActionDialog.continueConversationTitle
          }
          agentName={sessionActionDialog.agentName}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          onSubmitted={sessionActionDialog.onSubmitted}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setSessionActionDialog(null)
            }
          }}
        />
      )}
    </>
  )
}
