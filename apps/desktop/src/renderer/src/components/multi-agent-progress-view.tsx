import React, { useEffect, useMemo } from "react"
import { cn } from "@renderer/lib/utils"
import { AgentProgress } from "@renderer/components/agent-progress"
import type { AgentProgressUpdate } from "@dotagents/shared/agent-progress"
import { useTheme } from "@renderer/contexts/theme-context"
import { useAgentStore } from "@renderer/stores"
import { tipcClient } from "@renderer/lib/tipc-client"
import { Minimize2 } from "lucide-react"
import { Button } from "./ui/button"

interface MultiAgentProgressViewProps {
  className?: string
  variant?: "default" | "overlay"
  showBackgroundSpinner?: boolean
}

/**
 * Extract creation timestamp from session ID format: `session_{timestamp}_{random}`
 * Falls back to 0 if parsing fails.
 */
const getSessionCreationTime = (sessionId: string): number => {
  const parts = sessionId.split("_")
  if (parts.length >= 2) {
    const ts = Number(parts[1])
    if (Number.isFinite(ts)) return ts
  }
  return 0
}

export function MultiAgentProgressView({
  className,
  variant = "overlay",
  showBackgroundSpinner = true,
}: MultiAgentProgressViewProps) {
  const { isDark } = useTheme()
  const agentProgressById = useAgentStore((s) => s.agentProgressById)
  const focusedSessionId = useAgentStore((s) => s.focusedSessionId)
  const setFocusedSessionId = useAgentStore((s) => s.setFocusedSessionId)

  // Derive a stable key from the set of visible session IDs so the tab list
  // only recomputes when sessions are added/removed/snoozed, NOT on every
  // progress tick (which would cause tab reordering while the user is reading).
  const visibleSessionIds = useMemo(() => {
    return Array.from(agentProgressById?.entries() ?? [])
      .filter(([_, progress]) => progress && !progress.isSnoozed)
      .map(([id]) => id)
      .sort() // deterministic order for key comparison
      .join(",")
  }, [agentProgressById])

  const activeSessions = useMemo(() => {
    return Array.from(agentProgressById?.entries() ?? [])
      .filter(([_, progress]) => progress && !progress.isSnoozed)
      .sort((a, b) => {
        // Sort by session creation time (embedded in ID), newest first.
        // This is stable across progress updates, preventing tab reordering.
        return getSessionCreationTime(b[0]) - getSessionCreationTime(a[0])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed by visibleSessionIds
  }, [visibleSessionIds])

  // Auto-set focusedSessionId when there's no valid focus.
  // This prevents focus stealing: once set, focusedSessionId stays pinned
  // to the user's current session even when new sessions arrive.
  useEffect(() => {
    if (activeSessions.length === 0) return

    // Already focused on a valid, visible session — nothing to do
    if (
      focusedSessionId &&
      agentProgressById?.get(focusedSessionId) &&
      !agentProgressById.get(focusedSessionId)!.isSnoozed
    ) {
      return
    }

    // Pin focus to the first (newest) visible session
    const firstSessionId = activeSessions[0]?.[0]
    if (firstSessionId) {
      setFocusedSessionId(firstSessionId)
    }
  }, [activeSessions, focusedSessionId, agentProgressById, setFocusedSessionId])

  if (activeSessions.length === 0) {
    return null
  }

  const displaySessionId = (
    focusedSessionId && agentProgressById?.get(focusedSessionId) && !agentProgressById.get(focusedSessionId)!.isSnoozed
  ) ? focusedSessionId : (activeSessions[0]?.[0] || null)

  const focusedProgress = displaySessionId ? agentProgressById?.get(displaySessionId) : undefined

  const getSessionTitle = (progress: AgentProgressUpdate): string => {
    if (progress.conversationTitle) {
      return progress.conversationTitle
    }

    const startIndex = typeof progress.sessionStartIndex === "number" ? progress.sessionStartIndex : 0
    const sessionHistory = progress.conversationHistory?.slice(startIndex) || []
    const userMessage = sessionHistory.find(m => m.role === "user")
    if (userMessage?.content) {
      return userMessage.content.length > 30
        ? userMessage.content.substring(0, 30) + "..."
        : userMessage.content
    }
    return `Session ${progress.sessionId.substring(0, 8)}`
  }

  const handleHidePanel = async () => {
    await tipcClient.snoozeAgentSessionsAndHidePanelWindow({
      sessionIds: activeSessions.map(([sessionId]) => sessionId),
    })
  }



  return (
    <div className={cn(
      "relative flex h-full w-full flex-col",
      isDark ? "dark" : "",
      className
    )}>
      {/* Tab bar - only show if multiple sessions */}
      {activeSessions.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-background/95 px-2 py-1.5 backdrop-blur-sm">
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {activeSessions.map(([sessionId]) => {
              // Read fresh progress from live map for up-to-date titles
              const progress = agentProgressById?.get(sessionId)
              if (!progress) return null
              const isActive = sessionId === (displaySessionId || focusedSessionId)

              return (
                <button
                  key={sessionId}
                  onClick={() => setFocusedSessionId(sessionId)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all",
                    "hover:bg-accent/50",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                  title={getSessionTitle(progress)}
                >
                  <span className="max-w-[120px] truncate">
                    {getSessionTitle(progress)}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Hide panel button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleHidePanel}
            title="Hide panel - sessions continue in background"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Active session progress panel */}
      <div className="relative flex-1 overflow-hidden">
        {focusedProgress && displaySessionId && (
          <AgentProgress
            key={displaySessionId}
            progress={focusedProgress}
            variant={variant}
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  )
}
