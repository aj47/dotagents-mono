import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const audioPlayerSource = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")

describe("audio player autoplay recovery", () => {
  it("tracks autoplay blocks and retries after the next user gesture", () => {
    expect(audioPlayerSource).toContain("function isAutoplayPolicyBlockedError")
    expect(audioPlayerSource).toContain("const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)")
    expect(audioPlayerSource).toContain('void playAudio("auto")')
    expect(audioPlayerSource).toContain('window.addEventListener("pointerdown", retryPlayback, { once: true, capture: true })')
    expect(audioPlayerSource).toContain('window.addEventListener("keydown", retryPlayback, { once: true, capture: true })')
    expect(audioPlayerSource).toContain('setHasAutoPlayed(false)')
    expect(audioPlayerSource).toContain('setIsAutoplayBlocked(false)')
    expect(audioPlayerSource).toContain('if (source !== "manual" && isAutoplayPolicyBlockedError(playError))')
  })
})
