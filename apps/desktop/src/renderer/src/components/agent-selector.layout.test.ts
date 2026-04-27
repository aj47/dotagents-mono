import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentSelectorSource = readFileSync(new URL("./agent-selector.tsx", import.meta.url), "utf8")

describe("agent selector layout", () => {
  it("keeps the compact trigger bounded and readable in dense session chrome", () => {
    expect(agentSelectorSource).toContain(
      'className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background shadow-sm overflow-hidden hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"'
    )
    expect(agentSelectorSource).toContain('title={displayName}')
    expect(agentSelectorSource).toContain('aria-label={`Selected agent: ${displayName}`}')
    expect(agentSelectorSource).toContain('<Facehash name={displayAgent.id} size={28}')
    expect(agentSelectorSource).toContain('<Bot className="h-4 w-4 text-muted-foreground" />')
  })

  it("protects long agent names and descriptions inside the dropdown", () => {
    expect(agentSelectorSource).toContain(
      'className="max-h-[300px] w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto"'
    )
    expect(agentSelectorSource).toContain('className="min-w-0 items-center gap-2"')
    expect(agentSelectorSource).toContain('className="h-5 w-5 shrink-0 rounded overflow-hidden flex items-center justify-center"')
    expect(agentSelectorSource).toContain('className="min-w-0 flex-1 truncate text-sm font-medium"')
    expect(agentSelectorSource).toContain('className={cn("h-3.5 w-3.5 shrink-0"')
  })
})