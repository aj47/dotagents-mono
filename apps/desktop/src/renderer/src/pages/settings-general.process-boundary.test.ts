import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

function getSettingsGeneralSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "settings-general.tsx"), "utf8")
}

function getSettingsGeneralClientSource(): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  return readFileSync(path.join(testDir, "../lib/desktop-settings-general-client.ts"), "utf8")
}

describe("settings general process boundary", () => {
  it("centralizes settings-general desktop IPC channels behind a renderer client", () => {
    const source = getSettingsGeneralSource()
    const clientSource = getSettingsGeneralClientSource()

    expect(clientSource).toContain("tipcClient.isLangfuseInstalled()")
    expect(clientSource).toContain("tipcClient.getExternalAgents()")
    expect(clientSource).toContain("tipcClient.resizePanelToNormal({})")
    expect(clientSource).toContain("tipcClient.showPanelWindow({})")
    expect(clientSource).toContain("tipcClient.resetFloatingPanel({})")
    expect(clientSource).toContain("tipcClient.stopAllTts()")
    expect(clientSource).toContain("tipcClient.setPanelPosition({ position })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
    expect(source).toContain("desktopSettingsGeneralClient.isLangfuseInstalled()")
    expect(source).toContain("desktopSettingsGeneralClient.getExternalAgents()")
    expect(source).toContain("desktopSettingsGeneralClient.showFloatingPanel()")
    expect(source).toContain("desktopSettingsGeneralClient.resetFloatingPanel()")
    expect(source).toContain("desktopSettingsGeneralClient.stopAllTts()")
    expect(source).toContain("desktopSettingsGeneralClient.setPanelPosition(value)")
    expect(source).not.toContain("tipcClient.")
    expect(source).not.toContain('ipcRenderer.invoke("isLangfuseInstalled")')
  })
})
