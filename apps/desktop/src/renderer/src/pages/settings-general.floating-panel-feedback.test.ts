import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsGeneralSource = readFileSync(new URL("./settings-general.tsx", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("../../../main/tipc.ts", import.meta.url), "utf8")

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

describe("settings general floating panel feedback", () => {
  it("shows an error instead of a success toast when the panel window is unavailable", () => {
    const compactSettingsGeneralSource = compact(settingsGeneralSource)

    expect(compactSettingsGeneralSource).toContain(compact("const showResult = await tipcClient.showPanelWindow({})"))
    expect(compactSettingsGeneralSource).toContain(compact('if (showResult && "success" in showResult && showResult.success === false)'))
    expect(compactSettingsGeneralSource).toContain(compact('toast.error(showResult.error || "Failed to show floating panel")'))
    expect(compactSettingsGeneralSource).toContain(compact('toast.success("Floating panel shown")'))
  })

  it("teaches the main-process showPanelWindow route to report panel-unavailable failures", () => {
    const compactTipcSource = compact(tipcSource)

    expect(compactTipcSource).toContain(compact('const panelWindow = WINDOWS.get("panel")'))
    expect(compactTipcSource).toContain(compact('if (!panelWindow || panelWindow.isDestroyed())'))
    expect(compactTipcSource).toContain(compact('return { success: false, error: "Panel window is unavailable." }'))
    expect(compactTipcSource).toContain(compact('return { success: false, error: getErrorMessage(error) }'))
  })
})