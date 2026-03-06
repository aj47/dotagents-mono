import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentSelectorSource = readFileSync(new URL("./agent-selector.tsx", import.meta.url), "utf8")

describe("agent selector layout", () => {
  it("keeps the compact trigger bounded and readable in dense session chrome", () => {
    expect(agentSelectorSource).toContain(
      '"min-w-0 max-w-[min(13rem,calc(100vw-2rem))] justify-between gap-1.5 text-xs font-normal"'
    )
    expect(agentSelectorSource).toContain('title={displayName}')
    expect(agentSelectorSource).toContain('className="h-3.5 w-3.5 shrink-0 text-muted-foreground"')
    expect(agentSelectorSource).toContain('className="min-w-0 flex-1 truncate text-left"')
    expect(agentSelectorSource).toContain('className="h-3 w-3 shrink-0 text-muted-foreground"')
  })

  it("protects long agent names and descriptions inside the dropdown", () => {
    expect(agentSelectorSource).toContain(
      'className="max-h-[300px] w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto"'
    )
    expect(agentSelectorSource).toContain('className="min-w-0 items-start gap-2"')
    expect(agentSelectorSource).toContain('className={cn("mt-0.5 h-3.5 w-3.5 shrink-0"')
    expect(agentSelectorSource).toContain('className="min-w-0 flex-1 space-y-0.5"')
    expect(agentSelectorSource).toContain('className="truncate text-sm font-medium"')
    expect(agentSelectorSource).toContain(
      'className="line-clamp-2 text-xs leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]"'
    )
  })
})