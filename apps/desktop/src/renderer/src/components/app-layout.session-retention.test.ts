import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const appLayoutSource = readFileSync(new URL("./app-layout.tsx", import.meta.url), "utf8")

describe("app layout session retention", () => {
  it("keeps store-backed sessions in the collapsed active preview list", () => {
    expect(appLayoutSource).toContain("const trackedActiveSessions = sessionData?.activeSessions ?? []")
    expect(appLayoutSource).toContain("const recentCompletedSessions =")
    expect(appLayoutSource).toContain("sessionData?.recentCompletedSessions ?? sessionData?.recentSessions ?? []")
    expect(appLayoutSource).toContain("for (const [sessionId, progress] of agentProgressById.entries())")
    expect(appLayoutSource).toContain('status: "active"')
    expect(appLayoutSource).toContain("const isVisiblyActive = isFocused || !isSnoozed")
  })

  it("shows compact multi-character labels for collapsed session previews", () => {
    expect(appLayoutSource).toContain('const collapsedTitle = title.replace(/\\s+/g, " ")')
    expect(appLayoutSource).toContain('rounded-md px-0.5 transition-all duration-200')
    expect(appLayoutSource).toContain(
      'max-w-[calc(100%-0.375rem)] line-clamp-2 text-center text-[8px] font-medium leading-[0.6rem] tracking-tight [overflow-wrap:anywhere]',
    )
    expect(appLayoutSource).not.toContain('const initial = title.charAt(0).toUpperCase()')
  })

  it("lets settings move up when the expanded session list shrinks", () => {
    expect(appLayoutSource).toContain("sessions and settings scroll together")
    expect(appLayoutSource).toContain("mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden")
    expect(appLayoutSource).toContain('className="shrink-0"')
  })
})