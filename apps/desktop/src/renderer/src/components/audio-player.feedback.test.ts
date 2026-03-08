import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./audio-player.tsx", import.meta.url), "utf8")

describe("desktop audio player playback feedback", () => {
  it("surfaces autoplay, media-load, and manual playback failures visibly", () => {
    expect(source).toContain("const [playbackError, setPlaybackError] = useState<string | null>(null)")
    expect(source).toContain('setPlaybackError("Audio playback failed. The generated audio could not be loaded.")')
    expect(source).toContain('setPlaybackError(`Couldn\'t start audio automatically. ${getActionErrorMessage(error, "Press play to try again.")}`)')
    expect(source).toContain('setPlaybackError(`Couldn\'t play audio. ${getActionErrorMessage(playError, "Press play to try again.")}`)')
    expect(source).toContain('text-[11px] leading-relaxed text-red-600 break-words [overflow-wrap:anywhere] dark:text-red-400')
    expect(source).toContain('<span className="font-medium">Audio playback failed:</span> {playbackError}')
  })

  it("clears stale playback errors before retrying or when audio changes", () => {
    expect(source).toContain("setPlaybackError(null)")
    expect(source).toContain("if (!audioData) {")
    expect(source).toContain("await onGenerateAudio()")
    expect(source).toContain("await ttsManager.playExclusive(audioRef.current, {")
  })
})