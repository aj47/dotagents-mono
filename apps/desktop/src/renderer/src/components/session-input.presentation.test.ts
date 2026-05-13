import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(
  new URL("./session-input.tsx", import.meta.url),
  "utf8",
)

describe("desktop session input presentation", () => {
  it("uses shared session-start copy through the app shell accessor", () => {
    expect(source).toContain("getAppShellSessionStartCopyState")
    expect(source).toContain(
      "const sessionStartCopy = getAppShellSessionStartCopyState()",
    )
    expect(source).toContain("getAppShellSessionStartDesktopSurfaceState")
    expect(source).toContain(
      "const sessionStartDesktopSurface = getAppShellSessionStartDesktopSurfaceState()",
    )
    expect(source).toContain("sessionStartCopy.agentSelectorLabel")
    expect(source).toContain("sessionStartCopy.textInputPlaceholder")
    expect(source).toContain("sessionStartCopy.newTextActionLabel")
    expect(source).toContain("sessionStartCopy.voiceActionLabel")
    expect(source).toContain("sessionStartCopy.recordingActionLabel")
    expect(source).toContain("sessionStartCopy.idleDescription")
    expect(source).toContain("sessionStartExpandedSurface.containerClassName")
    expect(source).toContain("sessionStartExpandedSurface.textAreaClassName")
    expect(source).toContain("sessionStartIdleSurface.containerClassName")
    expect(source).toContain("sessionStartIdleSurface.descriptionClassName")
    expect(source).not.toContain("APP_SHELL_SESSION_START_PRESENTATION")
    expect(source).not.toContain("Recording...")
    expect(source).not.toContain(
      '"min-h-[60px] max-h-[120px] flex-1 resize-none"',
    )
  })
})
