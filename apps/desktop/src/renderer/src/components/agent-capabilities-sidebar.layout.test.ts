import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentCapabilitiesSidebarSource = readFileSync(
  new URL("./agent-capabilities-sidebar.tsx", import.meta.url),
  "utf8",
)

describe("agent capabilities sidebar layout", () => {
  it("keeps per-agent rows discoverable and labeled under narrow sidebar widths", () => {
    expect(agentCapabilitiesSidebarSource).toContain(
      'const AGENT_ROW_TOGGLE_BUTTON_CLASS_NAME =',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      '"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      'const AGENT_ROW_EDIT_BUTTON_CLASS_NAME =',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      'const AGENT_ROW_TITLE_CLASS_NAME =',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      'className="flex min-w-0 flex-1 items-start gap-1.5"',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      'aria-label={`${isAgentExpanded ? "Collapse" : "Expand"} ${agentLabel} capabilities`}',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      'aria-label={`Edit ${agentLabel}`}',
    )
    expect(agentCapabilitiesSidebarSource).toContain(
      '<Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0 h-3.5">{agent.connection.type}</Badge>',
    )
    expect(agentCapabilitiesSidebarSource).not.toContain(
      'className="truncate flex-1 text-left focus:outline-none hover:underline"',
    )
    expect(agentCapabilitiesSidebarSource).not.toContain(
      'className="shrink-0 focus:outline-none"',
    )
    expect(agentCapabilitiesSidebarSource).not.toContain('className="ml-auto text-[10px] px-1 py-0 h-3.5"')
  })
})