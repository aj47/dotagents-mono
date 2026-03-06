import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")

describe("audio player layout", () => {
  it("keeps compact playback chrome readable in narrow session cards", () => {
    expect(audioPlayerSource).toContain("const compactStatusLabel = hasAudio")
    expect(audioPlayerSource).toContain("const compactStatusDetail = hasAudio")
    expect(audioPlayerSource).toContain(
      '"flex min-w-0 max-w-full flex-wrap items-start gap-2 rounded-md bg-muted/40 px-2 py-1.5"'
    )
    expect(audioPlayerSource).toContain('className="mt-0.5 h-8 w-8 shrink-0 p-0"')
    expect(audioPlayerSource).toContain('className="min-w-0 flex-1 space-y-0.5 text-left"')
    expect(audioPlayerSource).toContain(
      'className="text-xs font-medium leading-relaxed text-foreground break-words [overflow-wrap:anywhere]"'
    )
    expect(audioPlayerSource).toContain(
      '"min-w-0 text-[11px] leading-relaxed text-muted-foreground break-words [overflow-wrap:anywhere]"'
    )
    expect(audioPlayerSource).toContain('hasAudio && duration > 0 && "font-mono tabular-nums"')
    expect(audioPlayerSource).toContain('aria-live="polite"')
  })

  it("wraps full audio controls and protects secondary controls under zoom", () => {
    expect(audioPlayerSource).toContain('className={cn("min-w-0 max-w-full space-y-2 rounded-lg bg-muted/50 p-3", className)}')
    expect(audioPlayerSource).toContain('className="flex flex-wrap items-center gap-3"')
    expect(audioPlayerSource).toContain('className="min-w-0 flex-1 space-y-1"')
    expect(audioPlayerSource).toContain('className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"')
    expect(audioPlayerSource).toContain('className="ml-auto flex min-w-0 max-w-full items-center gap-2"')
    expect(audioPlayerSource).toContain('className="min-w-[5rem] max-w-[8rem] flex-1"')
  })
})