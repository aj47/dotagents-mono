import { useQuery } from "@tanstack/react-query"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { LoadingSpinner } from "@renderer/components/ui/loading-spinner"
import { SettingsDragBar } from "@renderer/components/settings-drag-bar"
import { ActiveAgentsSidebar } from "@renderer/components/active-agents-sidebar"
import { AgentCapabilitiesSidebar } from "@renderer/components/agent-capabilities-sidebar"
import { SandboxSlotIndicator } from "@renderer/components/sandbox-slot-switcher"
import { SessionActionDialog, type SessionActionDialogMode } from "@renderer/components/session-action-dialog"
import { useSelectedAgentId } from "@renderer/components/agent-selector"

import { PastSessionsDialog } from "@renderer/components/past-sessions-dialog"
import { useSidebar, SIDEBAR_DIMENSIONS } from "@renderer/hooks/use-sidebar"
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { ttsManager } from "@renderer/lib/tts-manager"
import { applySelectedAgentToNextSession as applySelectedAgentForNextSession } from "@renderer/lib/apply-selected-agent"
import { useAgentStore } from "@renderer/stores"
import {
  Clock,
  PanelLeftClose,
  PanelLeft,
  Volume2,
  VolumeX,
  OctagonX,
  Loader2,
  Plug2,
  Plus,
  Mic,
} from "lucide-react"

type NavLinkItem = {
  text: string
  href: string
  icon: string | React.ComponentType<{ className?: string }>
}

interface AgentSession {
  id: string
  conversationId?: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  startTime?: number
  endTime?: number
  isSnoozed?: boolean
}

interface AgentSessionsResponse {
  activeSessions: AgentSession[]
  recentSessions: AgentSession[]
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
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsExpanded, setSettingsExpanded] = useState(true)
  const [pastSessionsDialogOpen, setPastSessionsDialogOpen] = useState(false)
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false)
  const [sessionActionDialog, setSessionActionDialog] = useState<SessionActionDialogState | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useSelectedAgentId()
  const { isCollapsed, width, isResizing, toggleCollapse, handleResizeStart } =
    useSidebar()
  const configQuery = useConfigQuery()
  const saveConfigMutation = useSaveConfigMutation()
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)
  const setScrollToSessionId = useAgentStore((s) => s.setScrollToSessionId)
  const agentProgressById = useAgentStore((s) => s.agentProgressById)

  const { data: sessionData, refetch: refetchSessionData } =
    useQuery<AgentSessionsResponse>({
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

  const whatsappEnabled = configQuery.data?.whatsappEnabled ?? false
  const isGlobalTTSEnabled = configQuery.data?.ttsEnabled ?? true
  const trackedActiveSessions = sessionData?.activeSessions ?? []
  const recentSessions = sessionData?.recentSessions ?? []
  const collapsedActiveSessions = useMemo(() => {
    const recentStatusById = new Map(
      recentSessions.map((session) => [session.id, session.status] as const),
    )
    const mergedSessions = new Map(
      trackedActiveSessions.map((session) => [session.id, session] as const),
    )

    for (const [sessionId, progress] of agentProgressById.entries()) {
      const recentStatus = recentStatusById.get(sessionId)
      if (recentStatus === "stopped" || recentStatus === "error") {
        continue
      }

      const existingSession = mergedSessions.get(sessionId)
      const firstHistoryTimestamp = progress.conversationHistory?.[0]?.timestamp
      const lastHistoryTimestamp = progress.conversationHistory?.[
        progress.conversationHistory.length - 1
      ]?.timestamp

      mergedSessions.set(sessionId, {
        id: sessionId,
        conversationId: progress.conversationId ?? existingSession?.conversationId,
        conversationTitle:
          progress.conversationTitle ?? existingSession?.conversationTitle,
        status: "active",
        startTime:
          existingSession?.startTime ??
          firstHistoryTimestamp ??
          lastHistoryTimestamp ??
          Date.now(),
        endTime: existingSession?.endTime,
        isSnoozed: progress.isSnoozed ?? existingSession?.isSnoozed,
      })
    }

    return Array.from(mergedSessions.values()).sort((a, b) => {
      const aProgress = agentProgressById.get(a.id)
      const bProgress = agentProgressById.get(b.id)
      const aTimestamp =
        aProgress?.conversationHistory?.[aProgress.conversationHistory.length - 1]
          ?.timestamp ??
        a.endTime ??
        a.startTime ??
        0
      const bTimestamp =
        bProgress?.conversationHistory?.[bProgress.conversationHistory.length - 1]
          ?.timestamp ??
        b.endTime ??
        b.startTime ??
        0
      return bTimestamp - aTimestamp
    })
  }, [trackedActiveSessions, recentSessions, agentProgressById])
  const collapsedPreviewSessions = useMemo(
    () => collapsedActiveSessions.slice(0, 3),
    [collapsedActiveSessions],
  )
  const clearInactiveSessions = useCallback(() => {
    navigate("/")
    window.dispatchEvent(new Event("sessions:clear-inactive"))
  }, [navigate])

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

  const handleStartTextSession = useCallback(async () => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    openSessionActionDialog({ mode: "text" })
  }, [applySelectedAgentToNextSession, openSessionActionDialog])

  const handleStartVoiceSession = useCallback(async () => {
    const applied = await applySelectedAgentToNextSession()
    if (!applied) return
    openSessionActionDialog({ mode: "voice" })
  }, [applySelectedAgentToNextSession, openSessionActionDialog])

  const handleStartPromptSession = useCallback(
    async (content: string) => {
      const applied = await applySelectedAgentToNextSession()
      if (!applied) return
      openSessionActionDialog({ mode: "text", initialText: content })
    },
    [applySelectedAgentToNextSession, openSessionActionDialog],
  )

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
        ttsManager.stopAll("collapsed-sidebar-global-tts-disabled")
        try {
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
      ttsManager.stopAll("collapsed-sidebar-emergency-stop")
      try {
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

  const handleCollapsedSessionClick = useCallback(
    (sessionId: string) => {
      navigate("/", { state: { clearPendingConversation: true } })
      setFocusedSessionId(sessionId)
      setScrollToSessionId(sessionId)
    },
    [navigate, setFocusedSessionId, setScrollToSessionId],
  )

  const settingsNavLinks: NavLinkItem[] = [
    {
      text: "General",
      href: "/settings",
      icon: "i-mingcute-settings-3-line",
    },
    {
      text: "Models",
      href: "/settings/models",
      icon: "i-mingcute-brain-line",
    },
    {
      text: "Providers",
      href: "/settings/providers",
      icon: Plug2,
    },
    {
      text: "Knowledge",
      href: "/knowledge",
      icon: "i-mingcute-book-2-line",
    },

    {
      text: "Capabilities",
      href: "/settings/capabilities",
      icon: "i-mingcute-tool-line",
    },
    // Only show WhatsApp settings when enabled
    ...(whatsappEnabled
      ? [
          {
            text: "WhatsApp",
            href: "/settings/whatsapp",
            icon: "i-mingcute-message-4-line",
          },
        ]
      : []),
    {
      text: "Repeat Tasks",
      href: "/settings/repeat-tasks",
      icon: "i-mingcute-refresh-3-line",
    },
  ]

  // Route aliases that should highlight the same nav item
  // Maps route paths to their primary nav link href
  const routeAliases: Record<string, string> = {
    "/settings/general": "/settings",
    "/settings/mcp-tools": "/settings/capabilities",
    "/settings/skills": "/settings/capabilities",
    "/settings/remote-server": "/settings",
    "/settings/loops": "/settings/repeat-tasks",
    "/settings/agents": "/settings/agents",
  }

  const isAgentsActive =
    location.pathname === "/settings/agents" ||
    location.pathname.startsWith("/settings/agents")

  // Check if current path matches the nav link (including aliases)
  const isNavLinkActive = (linkHref: string): boolean => {
    const currentPath = location.pathname
    // Exact match
    if (currentPath === linkHref) return true
    // Check if current path is an alias that maps to this link
    const aliasTarget = routeAliases[currentPath]
    return aliasTarget === linkHref
  }

  useEffect(() => {
    return rendererHandlers.navigate.listen((url) => {
      navigate(url)
    })
  }, [])

  const renderNavLink = (link: NavLinkItem) => {
    const isActive = isNavLinkActive(link.href)
    const icon = typeof link.icon === "string"
      ? <span className={cn(link.icon, "h-4 w-4 shrink-0")}></span>
      : <link.icon className="h-4 w-4 shrink-0" />

    return (
      <NavLink
        key={link.text}
        to={link.href}
        role="button"
        draggable={false}
        title={isCollapsed ? link.text : undefined}
        aria-label={isCollapsed ? link.text : undefined}
        aria-current={isActive ? "page" : undefined}
        onClick={(e) => {
          e.preventDefault()
          navigate(link.href)
        }}
        className={() => {
          return cn(
            "flex h-7 items-center rounded-md px-2 font-medium transition-all duration-200",
            isCollapsed ? "justify-center" : "gap-2",
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )
        }}
      >
        {icon}
        {!isCollapsed && (
          <span className="truncate font-medium">{link.text}</span>
        )}
      </NavLink>
    )
  }

  const sidebarWidth = isCollapsed ? SIDEBAR_DIMENSIONS.width.collapsed : width

  const isSessionsActive =
    location.pathname === "/" ||
    (!location.pathname.startsWith("/settings") &&
      !location.pathname.startsWith("/onboarding") &&
      !location.pathname.startsWith("/setup") &&
      !location.pathname.startsWith("/panel") &&
      !location.pathname.startsWith("/knowledge"))

  return (
    <>
      <PastSessionsDialog
        open={pastSessionsDialogOpen}
        onOpenChange={setPastSessionsDialogOpen}
      />

      <div className="flex h-dvh">
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
              isCollapsed ? "justify-center" : "justify-between",
              // On macOS, add top padding to clear the traffic-light window controls
              process.env.IS_MAC ? "pb-1 pt-7" : "pb-1 pt-2",
              isCollapsed ? "px-1" : "px-2",
            )}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleGlobalTTS}
                  disabled={!configQuery.data || saveConfigMutation.isPending}
                  className={cn(
                    "text-muted-foreground hover:bg-accent/50 hover:text-foreground shrink-0 rounded p-1 transition-colors disabled:opacity-50",
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
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isGlobalTTSEnabled ? (
                    <Volume2 className="h-3.5 w-3.5" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleEmergencyStopAll}
                  disabled={isEmergencyStopping}
                  className="text-destructive hover:bg-destructive/10 shrink-0 rounded p-1 transition-colors disabled:opacity-50"
                  title="Emergency stop all agent sessions"
                  aria-label="Emergency stop all agent sessions"
                >
                  {isEmergencyStopping ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <OctagonX className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}

            <button
              onClick={toggleCollapse}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </header>

          {/* Scrollable area: Settings + Sessions scroll together */}
          {isCollapsed ? (
            /* Collapsed: Sessions quick actions first, then settings shortcuts */
            <div className="mt-2 px-1">
              <div className="grid gap-1">
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
                  onClick={() => setPastSessionsDialogOpen(true)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                    pastSessionsDialogOpen
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                  title="Past Sessions"
                  aria-label="Past Sessions"
                  aria-pressed={pastSessionsDialogOpen || undefined}
                >
                  <Clock className="h-4 w-4" />
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

                <NavLink
                  to="/settings/agents?view=list"
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                    isAgentsActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                  title="Agents"
                  aria-label="Agents"
                  aria-current={isAgentsActive ? "page" : undefined}
                >
                  <span className="i-mingcute-group-line h-4 w-4"></span>
                </NavLink>

                {collapsedPreviewSessions.map((session) => {
                  const isFocused = focusedSessionId === session.id
                  const sessionProgress = agentProgressById.get(session.id)
                  const hasPendingApproval =
                    !!sessionProgress?.pendingToolApproval
                  const isSnoozed =
                    sessionProgress?.isSnoozed ?? false
                  const isVisiblyActive = isFocused || !isSnoozed
                  const statusDotColor = hasPendingApproval
                    ? "bg-amber-500"
                    : !isVisiblyActive
                      ? "bg-muted-foreground"
                      : "bg-blue-500"
                  const title =
                    session.conversationTitle?.trim() || "Untitled session"
                  const initial = title.charAt(0).toUpperCase()

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleCollapsedSessionClick(session.id)}
                      className={cn(
                        "group relative flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                        isFocused
                          ? "text-foreground bg-blue-500/15"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                      title={title}
                      aria-label={`Open session ${title}`}
                    >
                      <span className="text-xs font-semibold">{initial}</span>
                      <span
                        className={cn(
                          "border-background absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border",
                          statusDotColor,
                          isVisiblyActive && !hasPendingApproval && "animate-pulse",
                        )}
                      />
                    </button>
                  )
                })}

                {collapsedActiveSessions.length >
                  collapsedPreviewSessions.length && (
                  <button
                    type="button"
                    onClick={() => navigate("/")}
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

              {/* Settings Section - collapsed quick navigation */}
              <div className="mt-2 grid gap-1">
                {settingsNavLinks.map((link) => {
                  const isActive = isNavLinkActive(link.href)
                  const icon = typeof link.icon === "string"
                    ? <span className={cn(link.icon, "h-4 w-4")}></span>
                    : <link.icon className="h-4 w-4" />

                  return (
                    <NavLink
                      key={link.text}
                      to={link.href}
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(link.href)
                      }}
                      className={cn(
                        "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                      title={link.text}
                      aria-label={link.text}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {icon}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Expanded: Settings and Sessions share one scrollable container */
            <div className="scrollbar-none mt-2 min-h-0 flex-1 overflow-y-auto">
              {/* Sandbox slot indicator */}
              <div className="px-2 mt-1">
                <SandboxSlotIndicator />
              </div>

              {/* Sessions Section - shows sessions list */}
              <ActiveAgentsSidebar
                onOpenPastSessionsDialog={() => setPastSessionsDialogOpen(true)}
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
                onStartTextSession={handleStartTextSession}
                onStartVoiceSession={handleStartVoiceSession}
                onStartPromptSession={handleStartPromptSession}
                onClearInactiveSessions={isSessionsActive ? clearInactiveSessions : undefined}
                inactiveSessionCount={0}
              />

              {/* Agents Section - capability management */}
              <AgentCapabilitiesSidebar />

              {/* Settings Section - Collapsible, collapsed by default */}
              <div className="px-2">
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200",
                    "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "transition-transform duration-200",
                      settingsExpanded
                        ? "i-mingcute-down-line"
                        : "i-mingcute-right-line",
                    )}
                  ></span>
                  <span className="i-mingcute-settings-3-line"></span>
                  <span className="truncate">Settings</span>
                </button>

                {settingsExpanded && (
                  <div className="mt-1 grid gap-0.5 text-sm">
                    {settingsNavLinks.map(renderNavLink)}
                  </div>
                )}
              </div>

              {/* Logo/version pushed down by menu content, scrolls naturally */}
              <div className="flex flex-col items-center pb-4 pt-2 space-y-2">
                <LoadingSpinner size="lg" />
                <div>DotAgents</div>
                <div className="text-xs">{process.env.APP_VERSION}</div>
              </div>
            </div>
          )}

          {/* Spacer to push footer down when collapsed */}
          {isCollapsed && <div className="flex-1" />}

          {/* Loading spinner at the bottom of the sidebar - collapsed only */}
          {isCollapsed && (
            <div className="shrink-0">
              <div className="flex flex-col items-center pb-4 pt-2 space-y-1">
                <LoadingSpinner size="sm" />
              </div>
            </div>
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
          {/* Draggable top bar for Mac - allows window dragging while content scrolls */}
          {process.env.IS_MAC && <SettingsDragBar />}

          {/* Scrollable content area */}
          <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            <Outlet
              context={{
                onOpenPastSessionsDialog: () => setPastSessionsDialogOpen(true),
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

      {sessionActionDialog && (
        <SessionActionDialog
          open={true}
          mode={sessionActionDialog.mode}
          initialText={sessionActionDialog.initialText}
          conversationId={sessionActionDialog.conversationId}
          sessionId={sessionActionDialog.sessionId}
          fromTile={sessionActionDialog.fromTile}
          continueConversationTitle={sessionActionDialog.continueConversationTitle}
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
