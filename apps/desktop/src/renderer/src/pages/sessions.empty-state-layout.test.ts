import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")
const compactSessionsSource = sessionsSource.replace(/\s+/g, "")

function expectSourceToContain(fragment: string) {
  expect(compactSessionsSource).toContain(fragment.replace(/\s+/g, ""))
}

describe("sessions empty-state layout", () => {
  it("keeps the start actions and recent-session recovery path visible with tighter vertical spacing", () => {
    expectSourceToContain(
      'className="flex flex-col items-center justify-center px-6 py-4 text-center"',
    )
    expectSourceToContain('className="bg-muted mb-2 rounded-full p-3"')
    expectSourceToContain('className="mt-4 w-full max-w-lg text-left"')
  })

  it("lets recent-session rows show more session identity under narrow empty-state widths", () => {
    expectSourceToContain(
      'const RECENT_SESSION_ROW_CLASS_NAME = "hover:bg-accent/50 group flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors"',
    )
    expectSourceToContain(
      'const RECENT_SESSION_TITLE_CLASS_NAME = "min-w-0 flex-1 leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]"',
    )
    expectSourceToContain('title={session.title}')
    expectSourceToContain('className="text-muted-foreground shrink-0 pt-0.5 text-[10px] tabular-nums"')
  })
})