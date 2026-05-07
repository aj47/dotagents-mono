import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-permissions-client.ts", import.meta.url), "utf8")
const setupSource = readFileSync(new URL("../pages/setup.tsx", import.meta.url), "utf8")
const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")

describe("desktop permissions renderer client", () => {
  it("centralizes desktop setup permission IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getMicrophoneStatus()")
    expect(clientSource).toContain("tipcClient.isAccessibilityGranted()")
    expect(clientSource).toContain("tipcClient.requestAccesssbilityAccess()")
    expect(clientSource).toContain("tipcClient.requestMicrophoneAccess()")
    expect(clientSource).toContain("tipcClient.openMicrophoneInSystemPreferences()")
    expect(clientSource).toContain("tipcClient.restartApp()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps setup UI and microphone query off direct setup permission IPC channels", () => {
    expect(setupSource).toContain("desktopPermissionsClient.isAccessibilityGranted()")
    expect(setupSource).toContain("desktopPermissionsClient.requestAccessibilityAccess()")
    expect(setupSource).toContain("desktopPermissionsClient.requestMicrophoneAccess()")
    expect(setupSource).toContain("desktopPermissionsClient.openMicrophoneSettings()")
    expect(setupSource).toContain("desktopPermissionsClient.restartApp()")
    expect(queriesSource).toContain("desktopPermissionsClient.getMicrophoneStatus()")

    expect(setupSource).not.toContain("tipcClient.isAccessibilityGranted(")
    expect(setupSource).not.toContain("tipcClient.requestAccesssbilityAccess(")
    expect(setupSource).not.toContain("tipcClient.requestMicrophoneAccess(")
    expect(setupSource).not.toContain("tipcClient.openMicrophoneInSystemPreferences(")
    expect(setupSource).not.toContain("tipcClient.restartApp(")
    expect(queriesSource).not.toContain("tipcClient.getMicrophoneStatus(")
  })
})
