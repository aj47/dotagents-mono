import { getRendererHandlers } from "@egoist/tipc/main"
import { agentSessionTracker } from "./agent-session-tracker"
import type { RendererHandlers } from "@shared/renderer-handlers"
import { WINDOWS, minimizeAgentModeAndHidePanelWindow } from "./window"

function broadcastSessionSnoozed(sessionId: string, isSnoozed: boolean): void {
  for (const win of WINDOWS.values()) {
    try {
      getRendererHandlers<RendererHandlers>(win.webContents).setAgentSessionSnoozed?.send({
        sessionId,
        isSnoozed,
      })
    } catch {}
  }
}

export function setTrackedAgentSessionSnoozed(
  sessionId: string,
  isSnoozed: boolean,
): void {
  if (isSnoozed) {
    agentSessionTracker.snoozeSession(sessionId)
  } else {
    agentSessionTracker.unsnoozeSession(sessionId)
  }

  broadcastSessionSnoozed(sessionId, isSnoozed)
}

export function snoozeAgentSessionsAndHidePanelWindow(
  sessionIds?: string[],
): string[] {
  const ids = Array.from(
    new Set(
      (sessionIds && sessionIds.length > 0
        ? sessionIds
        : agentSessionTracker.getActiveSessions().map((session) => session.id))
        .filter((sessionId): sessionId is string => typeof sessionId === "string" && sessionId.length > 0),
    ),
  )

  for (const sessionId of ids) {
    setTrackedAgentSessionSnoozed(sessionId, true)
  }

  minimizeAgentModeAndHidePanelWindow()
  return ids
}
