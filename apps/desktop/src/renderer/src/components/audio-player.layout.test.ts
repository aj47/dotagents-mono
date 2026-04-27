import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")

describe("audio player layout", () => {
  it("recovers blocked autoplay on the next user gesture", () => {
    expect(audioPlayerSource).toContain("function isAutoplayPolicyBlockedError")
    expect(audioPlayerSource).toContain("const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)")
    expect(audioPlayerSource).toContain('window.addEventListener("pointerdown", retryPlayback, { once: true, capture: true })')
    expect(audioPlayerSource).toContain('window.addEventListener("keydown", retryPlayback, { once: true, capture: true })')
    expect(audioPlayerSource).toContain('void playAudio("autoplay-retry")')
  })

  it("keeps compact playback chrome readable in narrow session cards", () => {
    expect(audioPlayerSource).toContain("const compactStatusLabel = hasAudio")
    expect(audioPlayerSource).toContain("const compactStatusDetail = hasAudio")
    expect(audioPlayerSource).toContain(
      '"inline-flex items-center"'
    )
    expect(audioPlayerSource).toContain('"shrink-0 rounded p-1 transition-colors hover:bg-muted"')
    expect(audioPlayerSource).toContain("Autoplay blocked — press any key or click to listen")
    expect(audioPlayerSource).toContain("Press any key or click once to start playback")
    expect(audioPlayerSource).toContain("<audio ref={audioRef} />")
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