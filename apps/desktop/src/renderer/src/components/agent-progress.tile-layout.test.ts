import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const agentProgressSource = readFileSync(new URL("./agent-progress.tsx", import.meta.url), "utf8")
const acpSessionBadgeSource = readFileSync(new URL("./acp-session-badge.tsx", import.meta.url), "utf8")

describe("agent progress tile layout", () => {
  it("wraps the tile header chrome for narrow session widths and zoomed text", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-start gap-2 px-3 py-2 border-b bg-muted/30 flex-shrink-0 cursor-pointer"'
    )
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 items-start gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1"')
  })

  it("wraps the tile footer metadata row and preserves trailing status visibility", () => {
    expect(agentProgressSource).toContain('className="flex flex-wrap items-center justify-between gap-2"')
    expect(agentProgressSource).toContain('className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1"')
    expect(agentProgressSource).toContain('<ACPSessionBadge info={acpSessionInfo} className="min-w-0 max-w-full" />')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap">Step')
  })

  it("lets the tile chat-summary switcher and delegation preview adapt to narrow widths", () => {
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-1 border-b border-border/30 bg-muted/5 px-2.5 py-1.5"'
    )
    expect(agentProgressSource).toContain(
      '"inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"'
    )
    expect(agentProgressSource).toContain('<span className="truncate">Summary</span>')
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 flex flex-1 items-center gap-2"')
    expect(agentProgressSource).toContain(
      'className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-600 dark:text-gray-400"'
    )
  })

  it("caps ACP session badges to the available tile width and truncates long labels", () => {
    expect(acpSessionBadgeSource).toContain(
      '"inline-flex max-w-full min-w-0 flex-wrap items-center gap-1.5 cursor-help"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-medium"'
    )
    expect(acpSessionBadgeSource).toContain(
      'className="max-w-full min-w-0 text-[10px] px-1.5 py-0 font-mono"'
    )
    expect(acpSessionBadgeSource).toContain('className="truncate"')
  })

  it("keeps tile message-stream tool execution rows readable at narrow widths and zoom", () => {
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain(
      '"flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 text-[11px] cursor-pointer hover:bg-muted/30"'
    )
    expect(agentProgressSource).toContain('className="min-w-0 shrink truncate font-mono font-medium"')
    expect(agentProgressSource).toContain('className="min-w-0 flex-1 truncate text-[10px] font-mono opacity-50"')
    expect(agentProgressSource).toContain('className="mb-1 flex flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="ml-auto flex shrink-0 flex-wrap items-center gap-2"')
    expect(agentProgressSource).toContain('className="shrink-0 whitespace-nowrap opacity-50 text-[10px]"')
  })

  it("wraps expanded tool detail chrome and caps tool output blocks inside narrow tiles", () => {
    expect(agentProgressSource).toContain(
      'className="mb-1 ml-3 mt-0.5 space-y-1 border-l border-border/50 pl-2 text-[10px]"'
    )
    expect(agentProgressSource).toContain(
      'className="flex flex-wrap items-center justify-between gap-1.5"'
    )
    expect(agentProgressSource).toContain(
      'className="mt-1 ml-3 space-y-1 border-l border-border/50 pl-2"'
    )
    expect(agentProgressSource).toContain(
      'overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full max-h-32 scrollbar-thin text-[10px]'
    )
  })
})
