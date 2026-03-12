import { useQuery } from "@tanstack/react-query"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { LoadingSpinner } from "@renderer/components/ui/loading-spinner"
import { SettingsDragBar } from "@renderer/components/settings-drag-bar"
import { ActiveAgentsSidebar } from "@renderer/components/active-agents-sidebar"
import { HomeSettingsDialog } from "@renderer/components/home-settings-dialog"

import { PastSessionsDialog } from "@renderer/components/past-sessions-dialog"
import { useSidebar, SIDEBAR_DIMENSIONS } from "@renderer/hooks/use-sidebar"
import {
  useConfigQuery,
  useSaveConfigMutation,
} from "@renderer/lib/query-client"
import { ttsManager } from "@renderer/lib/tts-manager"
import { useAgentStore } from "@renderer/stores"
import {
  Clock,
  PanelLeftClose,
  PanelLeft,
  Volume2,
  VolumeX,
  OctagonX,
  Loader2,
  Settings2,
} from "lucide-react"

interface AgentSession {
  id: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  isSnoozed?: boolean
}

interface AgentSessionsResponse {
  activeSessions: AgentSession[]
}

export const Component = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [pastSessionsDialogOpen, setPastSessionsDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false)
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

  const isGlobalTTSEnabled = configQuery.data?.ttsEnabled ?? true
  const collapsedActiveSessions = sessionData?.activeSessions ?? []
  const collapsedPreviewSessions = useMemo(
    () => collapsedActiveSessions.slice(0, 3),
    [collapsedActiveSessions],
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
      navigate("/")
      setFocusedSessionId(sessionId)
      setScrollToSessionId(sessionId)
    },
    [navigate, setFocusedSessionId, setScrollToSessionId],
  )

  useEffect(() => {
    return rendererHandlers.navigate.listen((url) => {
      navigate(url)
    })
  }, [navigate])

  const sidebarWidth = isCollapsed ? SIDEBAR_DIMENSIONS.width.collapsed : width

  const isSessionsActive =
    location.pathname === "/" ||
    (!location.pathname.startsWith("/settings") &&
      !location.pathname.startsWith("/onboarding") &&
      !location.pathname.startsWith("/setup") &&
      !location.pathname.startsWith("/panel") &&
      !location.pathname.startsWith("/memories"))

  return (
    <>
      <HomeSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
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
                  onClick={() => setSettingsDialogOpen(true)}
                  className={cn(
                    "text-muted-foreground hover:bg-accent/50 hover:text-foreground shrink-0 rounded p-1 transition-colors",
                  )}
                  title="Open settings"
                  aria-label="Open settings"
                >
                  <Settings2 className="h-3.5 w-3.5" />
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

          {/* Scrollable area: sessions remain primary while settings stay behind the cog modal */}
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
                  onClick={() => setSettingsDialogOpen(true)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md transition-all duration-200",
                    settingsDialogOpen
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                  title="Open settings"
                  aria-label="Open settings"
                  aria-pressed={settingsDialogOpen || undefined}
                >
                  <Settings2 className="h-4 w-4" />
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

                {collapsedPreviewSessions.map((session) => {
                  const isFocused = focusedSessionId === session.id
                  const sessionProgress = agentProgressById.get(session.id)
                  const hasPendingApproval =
                    !!sessionProgress?.pendingToolApproval
                  const isSnoozed =
                    sessionProgress?.isSnoozed ?? session.isSnoozed ?? false
                  const statusDotColor = hasPendingApproval
                    ? "bg-amber-500"
                    : isSnoozed
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
                          !isSnoozed && !hasPendingApproval && "animate-pulse",
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
            </div>
          ) : (
            /* Expanded: keep the sidebar focused on live sessions; settings move behind the cog modal */
            <div className="scrollbar-none mt-2 min-h-0 flex-1 overflow-y-auto">
              {/* Sessions Section - shows sessions list */}
              <ActiveAgentsSidebar
                onOpenPastSessionsDialog={() => setPastSessionsDialogOpen(true)}
              />

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
                    onOpenSettingsDialog: () => setSettingsDialogOpen(true),
                sidebarWidth,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
