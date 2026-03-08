import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const appLayoutSource = fs.readFileSync(
  path.resolve(__dirname, "./app-layout.tsx"),
  "utf8",
)

describe("AppLayout emergency stop feedback", () => {
  it("warns when disabling global TTS cannot stop speech in other windows", () => {
    expect(appLayoutSource).toContain("await tipcClient.stopAllTts()")
    expect(appLayoutSource).toContain(
      "Disabled TTS for this window, but failed to stop speech in other windows.",
    )
  })

  it("shows a visible error when the global emergency stop action fails", () => {
    expect(appLayoutSource).toContain("await tipcClient.emergencyStopAgent()")
    expect(appLayoutSource).toContain("Failed to stop all agent sessions.")
    expect(appLayoutSource).toContain(
      'title="Emergency stop all agent sessions"',
    )
    expect(appLayoutSource).toContain(
      'aria-label="Emergency stop all agent sessions"',
    )
  })
})
