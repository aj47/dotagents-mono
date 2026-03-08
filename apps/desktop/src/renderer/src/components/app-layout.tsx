import { useQuery } from "@tanstack/react-query"
import { rendererHandlers, tipcClient } from "@renderer/lib/tipc-client"
import { cn } from "@renderer/lib/utils"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { LoadingSpinner } from "@renderer/components/ui/loading-spinner"
import { SettingsDragBar } from "@renderer/components/settings-drag-bar"
import { ActiveAgentsSidebar } from "@renderer/components/active-agents-sidebar"
import { AgentCapabilitiesSidebar } from "@renderer/components/agent-capabilities-sidebar"

import { PastSessionsDialog } from "@renderer/components/past-sessions-dialog"
import {
  getSidebarResizeKeyboardAdjustment,
  isSidebarResizeResetKey,
  SIDEBAR_DIMENSIONS,
  SIDEBAR_KEYBOARD_RESIZE_STEP,
  useSidebar,
} from "@renderer/hooks/use-sidebar"
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
} from "lucide-react"

type NavLinkItem = {
  text: string
  href: string
  icon: string
}

interface AgentSession {
  id: string
  conversationTitle?: string
  status: "active" | "completed" | "error" | "stopped"
  isSnoozed?: boolean
}

interface AgentSessionsResponse {
  activeSessions: AgentSession[]
}

function isPanelSize(value: unknown): value is { width: number; height: number } {
  return !!value &&
    typeof value === "object" &&
    "width" in value &&
    "height" in value &&
    typeof (value as { width: unknown }).width === "number" &&
    typeof (value as { height: unknown }).height === "number"
}

function isPanelVisibilityState(value: unknown): value is { visible: boolean } {
  return !!value &&
    typeof value === "object" &&
    "visible" in value &&
    typeof (value as { visible: unknown }).visible === "boolean"
}

export const Component = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsExpanded, setSettingsExpanded] = useState(true)
  const [pastSessionsDialogOpen, setPastSessionsDialogOpen] = useState(false)
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false)
  const [panelWidth, setPanelWidth] = useState<number | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const {
    isCollapsed,
    width,
    isResizing,
    resizeDelta,
    toggleCollapse,
    handleResizeStart,
    adjustWidthBy: adjustSidebarWidthBy,
    reset: resetSidebar,
  } =
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

  useEffect(() => {
    let isMounted = true

    const loadInitialPanelState = async () => {
      const [initialPanelSize, initialPanelVisibility] = await Promise.allSettled([
        tipcClient.getPanelSize(),
        tipcClient.getPanelVisibility(),
      ])

      if (
        isMounted &&
        initialPanelSize.status === "fulfilled" &&
        isPanelSize(initialPanelSize.value)
      ) {
        setPanelWidth(initialPanelSize.value.width)
      } else if (initialPanelSize.status === "rejected") {
        console.error(
          "Failed to load panel size for sessions layout context:",
          initialPanelSize.reason,
        )
      }

      if (
        isMounted &&
        initialPanelVisibility.status === "fulfilled" &&
        typeof initialPanelVisibility.value === "boolean"
      ) {
        setPanelVisible(initialPanelVisibility.value)
      } else if (initialPanelVisibility.status === "rejected") {
        console.error(
          "Failed to load panel visibility for sessions layout context:",
          initialPanelVisibility.reason,
        )
      }
    }

    void loadInitialPanelState()

    const unlistenPanelSize = rendererHandlers.onPanelSizeChanged.listen((size) => {
      if (isPanelSize(size)) {
        setPanelWidth(size.width)
      }
    })
    const unlistenPanelVisibility = rendererHandlers.onPanelVisibilityChanged.listen((payload) => {
      if (isPanelVisibilityState(payload)) {
        setPanelVisible(payload.visible)
      }
    })

    return () => {
      isMounted = false
      unlistenPanelSize()
      unlistenPanelVisibility()
    }
  }, [])

  const whatsappEnabled = configQuery.data?.whatsappEnabled ?? false
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
      text: "Memories",
      href: "/memories",
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
    "/settings/providers": "/settings/models",
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
    return (
      <NavLink
        key={link.text}
        to={link.href}
        role="button"
        draggable={false}
        title={isCollapsed ? link.text : undefined}
        aria-label={isCollapsed ? link.text : undefined}
        aria-current={isActive ? "page" : undefined}
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
        <span className={cn(link.icon, "shrink-0")}></span>
        {!isCollapsed && (
          <span className="truncate font-medium">{link.text}</span>
        )}
      </NavLink>
    )
  }

  const sidebarWidth = isCollapsed ? SIDEBAR_DIMENSIONS.width.collapsed : width
  const SIDEBAR_TILING_HINT_DEADBAND_PX = 12

  const isSessionsActive =
    location.pathname === "/" ||
    (!location.pathname.startsWith("/settings") &&
      !location.pathname.startsWith("/onboarding") &&
      !location.pathname.startsWith("/setup") &&
      !location.pathname.startsWith("/panel") &&
      !location.pathname.startsWith("/memories"))

  const showSidebarResizeHint = isSessionsActive && isResizing
  const sidebarResizeImpactLabel =
    resizeDelta > SIDEBAR_TILING_HINT_DEADBAND_PX
      ? "Less room for tiled sessions"
      : resizeDelta < -SIDEBAR_TILING_HINT_DEADBAND_PX
        ? "More room for tiled sessions"
        : "Sidebar width affects tiled session space"
  const sidebarResizeHintClassName =
    resizeDelta > SIDEBAR_TILING_HINT_DEADBAND_PX
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : resizeDelta < -SIDEBAR_TILING_HINT_DEADBAND_PX
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "border-border/70 bg-background/95 text-muted-foreground"
  const sidebarResizeKeyboardHint =
    `Use Left and Right Arrow to resize by ${SIDEBAR_KEYBOARD_RESIZE_STEP}px. Press Enter or double-click to reset to the default width.`
  const sidebarResizeHandleTitle = isSessionsActive
    ? `Drag to resize sidebar. ${sidebarResizeKeyboardHint} Wider sidebar leaves less room for tiled sessions.`
    : `Drag to resize sidebar. ${sidebarResizeKeyboardHint}`
  const handleSidebarResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const keyboardAdjustment = getSidebarResizeKeyboardAdjustment(event.key)
      if (keyboardAdjustment !== 0) {
        event.preventDefault()
        event.stopPropagation()
        adjustSidebarWidthBy(keyboardAdjustment)
        return
      }

      if (isSidebarResizeResetKey(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        resetSidebar()
      }
    },
    [adjustSidebarWidthBy, resetSidebar],
  )

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

              {/* Settings Section - collapsed quick navigation */}
              <div className="mt-2 grid gap-1">
                {settingsNavLinks.map((link) => {
                  const isActive = isNavLinkActive(link.href)
                  return (
                    <NavLink
                      key={link.text}
                      to={link.href}
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
                      <span className={link.icon}></span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Expanded: Settings and Sessions share one scrollable container */
            <div className="scrollbar-none mt-2 min-h-0 flex-1 overflow-y-auto">
              {/* Sessions Section - shows sessions list */}
              <ActiveAgentsSidebar
                onOpenPastSessionsDialog={() => setPastSessionsDialogOpen(true)}
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
            </div>
          )}

          {/* Spacer to push footer down when collapsed */}
          {isCollapsed && <div className="flex-1" />}

          {/* Loading spinner at the bottom of the sidebar */}
          <div className="shrink-0">
            <div
              className={cn(
                "flex flex-col items-center pb-4 pt-2",
                isCollapsed ? "space-y-1" : "space-y-2",
              )}
            >
              <LoadingSpinner size={isCollapsed ? "sm" : "lg"} />
              {!isCollapsed && (
                <>
                  <div>DotAgents</div>
                  <div className="text-xs">{process.env.APP_VERSION}</div>
                </>
              )}
            </div>
          </div>

          {/* Resize handle - only visible when not collapsed */}
          {!isCollapsed && (
            <>
              {showSidebarResizeHint && (
                <div
                  className={cn(
                    "pointer-events-none absolute left-full top-16 z-20 ml-2 flex max-w-48 items-start gap-2 rounded-md border px-2 py-1.5 text-[11px] shadow-sm backdrop-blur-sm",
                    sidebarResizeHintClassName,
                  )}
                  data-sidebar-resize-impact-hint
                >
                  <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current/80" />
                  <div className="min-w-0">
                    <div className="font-medium leading-tight">{sidebarResizeImpactLabel}</div>
                    <div className="mt-0.5 text-[10px] leading-tight opacity-80">
                      {`Sidebar ${Math.round(sidebarWidth)}px wide`}
                    </div>
                    <div className="mt-1 text-[10px] leading-tight opacity-75">
                      Double-click rail to reset to default width
                    </div>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "group/sidebar-resize absolute right-0 top-0 h-full w-3 cursor-col-resize transition-colors focus-visible:outline-none",
                  isResizing ? "bg-blue-500/6" : "focus-visible:bg-blue-500/8",
                )}
                data-sidebar-resize-handle
                data-sidebar-resize-resettable
                tabIndex={0}
                aria-keyshortcuts="ArrowLeft ArrowRight Enter"
                onMouseDown={handleResizeStart}
                onKeyDown={handleSidebarResizeKeyDown}
                onDoubleClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  resetSidebar()
                }}
                title={sidebarResizeHandleTitle}
                aria-label={sidebarResizeHandleTitle}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-3 right-1 w-px rounded-full bg-border/60 transition-all duration-200",
                    isResizing
                      ? "bg-blue-500/90 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                      : "opacity-55 group-hover/sidebar-resize:opacity-100 group-hover/sidebar-resize:bg-blue-500/55 group-focus-visible/sidebar-resize:opacity-100 group-focus-visible/sidebar-resize:bg-blue-500/70",
                  )}
                />
              </div>
            </>
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
                panelVisible,
                panelWidth,
                resetSidebar,
                sidebarWidth,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
