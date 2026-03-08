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

  it("keeps the section header readable and clickable when the sidebar gets cramped", () => {
    expect(activeAgentsSidebarSource).toContain(
      'const SIDEBAR_HEADER_ROW_CLASS_NAME =',
    )
    expect(activeAgentsSidebarSource).toContain(
      '"hover:bg-accent/50 hover:text-foreground flex w-full items-center gap-1 rounded-md px-0.5 py-1 transition-all duration-200"',
    )
    expect(activeAgentsSidebarSource).toContain(
      'const SIDEBAR_HEADER_LABEL_CLASS_NAME = "min-w-0 flex-1 truncate text-left"',
    )
    expect(activeAgentsSidebarSource).toContain(
      '<span className={SIDEBAR_HEADER_LABEL_CLASS_NAME}>Sessions</span>',
    )
    expect(activeAgentsSidebarSource).toContain(
      'const SIDEBAR_HEADER_AUX_BUTTON_CLASS_NAME =',
    )
    expect(activeAgentsSidebarSource).not.toContain(
      '<span className="i-mingcute-grid-line h-3.5 w-3.5"></span>',
    )
  })
})