import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const mcpConfigManagerSource = readFileSync(new URL("./mcp-config-manager.tsx", import.meta.url), "utf8")

describe("mcp config manager layout", () => {
  it("keeps the add or edit server dialog wrap-safe under narrower settings widths and font zoom", () => {
    expect(mcpConfigManagerSource).toContain('className="max-w-[min(64rem,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto"')
    expect(mcpConfigManagerSource).toContain('className="mb-4 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4"')
    expect(mcpConfigManagerSource).toContain('className="w-full justify-center gap-1"')
    expect(mcpConfigManagerSource).toContain('className="grid gap-4 sm:grid-cols-2"')
    expect(mcpConfigManagerSource).toContain('className="flex min-h-10 items-center space-x-2 pt-0 sm:pt-6"')
  })

  it("lets MCP example cards wrap content and keep their CTA visible instead of crowding a single row", () => {
    expect(mcpConfigManagerSource).toContain('className="flex flex-wrap items-start justify-between gap-3"')
    expect(mcpConfigManagerSource).toContain('className="min-w-0 flex-1"')
    expect(mcpConfigManagerSource).toContain('className="text-sm font-medium break-words [overflow-wrap:anywhere]"')
    expect(mcpConfigManagerSource).toContain('className="mt-1 text-xs text-muted-foreground break-words [overflow-wrap:anywhere]"')
    expect(mcpConfigManagerSource).toContain('className="w-full sm:w-auto"')
  })

  it("keeps collapsed MCP server rows identifiable when status badges and actions compete for narrow space", () => {
    expect(mcpConfigManagerSource).toContain('className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"')
    expect(mcpConfigManagerSource).toContain('className="flex min-w-0 flex-[1_1_16rem] flex-wrap items-start gap-x-2 gap-y-1.5"')
    expect(mcpConfigManagerSource).toContain('className="min-w-0 flex-[1_1_10rem] break-words font-medium leading-tight [overflow-wrap:anywhere]"')
    expect(mcpConfigManagerSource).toContain('className="flex max-w-full shrink-0 flex-wrap items-center gap-1"')
    expect(mcpConfigManagerSource).toContain('className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1"')
  })
})