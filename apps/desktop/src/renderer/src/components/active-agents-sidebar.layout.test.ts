import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const activeAgentsSidebarSource = readFileSync(
  new URL("./active-agents-sidebar.tsx", import.meta.url),
  "utf8",
)
const compactActiveAgentsSidebarSource = activeAgentsSidebarSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactActiveAgentsSidebarSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("active agents sidebar layout", () => {
  it("gives archived sidebar sessions a compact two-line title preview instead of a single clipped line", () => {
    expectSourceToContain(
      `className={cn(
        "text-muted-foreground flex items-start gap-1.5 rounded px-1.5 py-1.5 text-left text-xs transition-all",`,
    )
    expectSourceToContain('title={session.conversationTitle || "Untitled session"}')
    expectSourceToContain('className="mt-0.5 h-3 w-3 shrink-0 opacity-50"')
    expectSourceToContain(
      'className="min-w-0 flex-1 line-clamp-2 text-[11px] leading-snug break-words [overflow-wrap:anywhere]"',
    )
    expect(compactActiveAgentsSidebarSource).not.toContain('className="flex-1truncate"')
  })
})