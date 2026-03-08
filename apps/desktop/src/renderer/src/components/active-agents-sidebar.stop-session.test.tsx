import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const sidebarSource = fs.readFileSync(
  path.resolve(__dirname, "./active-agents-sidebar.tsx"),
  "utf8",
)

describe("ActiveAgentsSidebar session-action feedback", () => {
  it("shows a visible error when stopping a session fails", () => {
    expect(sidebarSource).toContain(
      'toast.error(details ? `Failed to stop session. ${details}` : "Failed to stop session")',
    )
  })

  it("rolls back local snooze state and shows a visible error when minimizing fails", () => {
    expect(sidebarSource).toContain("setSessionSnoozed(sessionId, false)")
    expect(sidebarSource).toContain(
      'toast.error(details ? `Failed to minimize session. ${details}` : "Failed to minimize session")',
    )
  })

  it("shows a partial-failure error when minimize succeeds but hiding the panel fails", () => {
    expect(sidebarSource).toContain("await tipcClient.hidePanelWindow({})")
    expect(sidebarSource).toContain(
      "Session minimized, but failed to hide the panel",
    )
  })

  it("restores the previous focus and shows a visible error when restoring a snoozed session fails", () => {
    expect(sidebarSource).toContain(
      "setFocusedSessionId(previousFocusedSessionId ?? null)",
    )
    expect(sidebarSource).toContain(
      'toast.error(details ? `Failed to restore session. ${details}` : "Failed to restore session")',
    )
  })

  it("shows a visible error when restore succeeds but panel focus sync fails", () => {
    expect(sidebarSource).toContain(
      "await tipcClient.focusAgentSession({ sessionId })",
    )
    expect(sidebarSource).toContain(
      "Session restored, but failed to sync panel focus",
    )
  })
})
