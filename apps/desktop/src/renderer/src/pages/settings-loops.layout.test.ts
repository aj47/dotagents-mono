import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsLoopsSource = readFileSync(new URL("./settings-loops.tsx", import.meta.url), "utf8")

describe("settings loops page layout", () => {
  it("wraps repeat-task row actions safely under tighter settings widths", () => {
    expect(settingsLoopsSource).toContain('className="flex flex-wrap items-start gap-3"')
    expect(settingsLoopsSource).toContain('className="min-w-[min(100%,16rem)] flex-[1_1_16rem]"')
    expect(settingsLoopsSource).toContain(
      'className="ml-auto flex max-w-full flex-[0_1_auto] flex-wrap items-center justify-end gap-1"',
    )
    expect(settingsLoopsSource).toContain('className="h-7 shrink-0 gap-1.5 px-2"')
    expect(settingsLoopsSource).toContain('className="h-7 w-7 shrink-0"')
    expect(settingsLoopsSource).not.toContain('sm:w-auto')
  })

  it("lets repeat-task names, prompts, and schedule metadata wrap intentionally", () => {
    expect(settingsLoopsSource).toContain(
      'className="flex flex-wrap items-start gap-x-2 gap-y-1"',
    )
    expect(settingsLoopsSource).toContain(
      'className="min-w-[min(100%,12rem)] flex-[1_1_12rem] break-words font-medium leading-snug [overflow-wrap:anywhere]"',
    )
    expect(settingsLoopsSource).toContain(
      'className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]"',
    )
    expect(settingsLoopsSource).toContain(
      'className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground"',
    )
    expect(settingsLoopsSource).toContain('className="mt-2 flex flex-wrap items-center gap-2"')
    expect(settingsLoopsSource).toContain('className="break-words [overflow-wrap:anywhere]">Last run: {formatLastRun(lastRunAt)}</div>')
  })
})