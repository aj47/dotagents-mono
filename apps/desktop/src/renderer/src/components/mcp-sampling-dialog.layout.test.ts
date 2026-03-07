import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const samplingDialogSource = readFileSync(new URL("./mcp-sampling-dialog.tsx", import.meta.url), "utf8")

describe("mcp sampling dialog layout", () => {
  it("keeps long server names, model hints, and preference rows readable on narrow widths", () => {
    expect(samplingDialogSource).toContain('className="max-w-[min(32rem,calc(100vw-2rem))]"')
    expect(samplingDialogSource).toContain('className="break-words [overflow-wrap:anywhere]"')
    expect(samplingDialogSource).toContain('className="flex flex-wrap items-start justify-between gap-2"')
    expect(samplingDialogSource).toContain('className="inline-flex max-w-full items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary break-words [overflow-wrap:anywhere]"')
    expect(samplingDialogSource).toContain('className="flex flex-wrap items-start justify-between gap-2 text-xs"')
  })
})