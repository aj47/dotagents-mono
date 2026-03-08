import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const setupSource = readFileSync(new URL("./setup.tsx", import.meta.url), "utf8")

describe("setup page layout", () => {
  it("keeps the fixed permission window scroll-safe and wrap-safe under tighter space", () => {
    expect(setupSource).toContain('className="app-drag-region flex h-dvh overflow-y-auto"')
    expect(setupSource).toContain(
      'className="mx-auto my-auto w-full max-w-3xl space-y-6 px-6 py-8 sm:px-10 sm:py-10"',
    )
    expect(setupSource).toContain(
      'className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"',
    )
    expect(setupSource).toContain('className="min-w-0 flex-1"')
    expect(setupSource).toContain(
      'className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 break-words [overflow-wrap:anywhere]"',
    )
    expect(setupSource).toContain(
      'className="flex w-full shrink-0 items-center sm:w-auto sm:justify-end"',
    )
    expect(setupSource).toContain('className="w-full sm:w-auto"')
    expect(setupSource).toContain(
      'className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-green-500/10 px-3 py-2 font-medium text-green-600 dark:bg-green-500/15 dark:text-green-300 sm:w-auto"',
    )
  })
})