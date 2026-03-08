import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsGeneralSource = readFileSync(
  new URL("./settings-general.tsx", import.meta.url),
  "utf8",
)

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

function expectSourceToContain(fragment: string) {
  expect(compact(settingsGeneralSource)).toContain(compact(fragment))
}

describe("settings general controlled config bindings", () => {
  it("keeps config-backed switches controlled so saved state updates resync the UI", () => {
    expectSourceToContain("checked={configQuery.data.launchAtLogin ?? false}")
    expectSourceToContain("checked={configQuery.data.streamerModeEnabled ?? false}")
    expectSourceToContain("checked={configQuery.data.transcriptionPreviewEnabled}")
    expectSourceToContain("checked={configQuery.data.ttsEnabled ?? false}")
    expectSourceToContain("checked={configQuery.data.ttsAutoPlay ?? true}")
    expectSourceToContain("checked={configQuery.data?.panelDragEnabled ?? true}")
  })

  it("keeps config-backed shortcut selectors controlled so route/query refreshes cannot leave stale selections onscreen", () => {
    expectSourceToContain("value={shortcut}")
    expectSourceToContain('value={configQuery.data?.toggleVoiceDictationHotkey || "fn"}')
  })

  it("shows visible feedback if disabling desktop TTS cannot stop speech in other windows", () => {
    expectSourceToContain('console.error("Failed to stop TTS in all windows:", error)')
    expectSourceToContain(
      'toast.error(`Disabled TTS for this window, but failed to stop speech in other windows. ${getActionErrorMessage(error, "Please retry if audio is still playing.")}`)'
    )
  })
})