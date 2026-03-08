import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const modelPresetManagerSource = readFileSync(
  new URL("./model-preset-manager.tsx", import.meta.url),
  "utf8",
)

describe("model preset manager layout", () => {
  it("wraps header actions and keeps preset labels shrink-safe in narrow providers columns", () => {
    expect(modelPresetManagerSource).toContain(
      'className="flex flex-wrap items-start justify-between gap-2"',
    )
    expect(modelPresetManagerSource).toContain(
      'className="min-w-[min(100%,10rem)] flex-[1_1_10rem] leading-5"',
    )
    expect(modelPresetManagerSource).toContain(
      'className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2"',
    )
    expect(modelPresetManagerSource.match(/className="h-7 shrink-0 gap-1\.5 px-2 text-\[11px\]"/g)).toHaveLength(2)
    expect(modelPresetManagerSource).toContain(
      'className="flex w-full min-w-0 items-center gap-2"',
    )
    expect(modelPresetManagerSource).toContain(
      'className="min-w-0 flex-1 truncate"',
    )
    expect(modelPresetManagerSource).toContain(
      'className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"',
    )
  })
})