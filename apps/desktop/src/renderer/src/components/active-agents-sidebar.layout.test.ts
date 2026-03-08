import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const activeAgentsSidebarSource = readFileSync(
  new URL("./active-agents-sidebar.tsx", import.meta.url),
  "utf8",
)

describe("active agents sidebar layout", () => {
  it("keeps cramped sidebar session rows distinguishable and recoverable", () => {
    expect(activeAgentsSidebarSource).toContain(
      'const SIDEBAR_SESSION_TITLE_CLASS_NAME =',
    )
    expect(activeAgentsSidebarSource).toContain(
      '"min-w-0 flex-1 leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]"',
    )
    expect(activeAgentsSidebarSource).toContain(
      '<p className={SIDEBAR_SESSION_TITLE_CLASS_NAME} title={sessionTitle}>',
    )
    expect(activeAgentsSidebarSource).toContain(
      "const displaySessionTitle = hasPendingApproval",
    )
    expect(activeAgentsSidebarSource).toContain('title={displaySessionTitle}')
    expect(activeAgentsSidebarSource).not.toContain('className="flex-1 truncate"')
    expect(activeAgentsSidebarSource).not.toContain('"truncate",')
  })
})