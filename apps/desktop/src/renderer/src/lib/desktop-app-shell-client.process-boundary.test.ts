import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-app-shell-client.ts", import.meta.url), "utf8")
const mainSource = readFileSync(new URL("../main.tsx", import.meta.url), "utf8")
const themeContextSource = readFileSync(new URL("../contexts/theme-context.tsx", import.meta.url), "utf8")

describe("desktop app shell renderer client", () => {
  it("centralizes app shell IPC channels", () => {
    expect(clientSource).toContain("tipcClient.showContextMenu(request)")
    expect(clientSource).toContain("tipcClient.broadcastThemeChange?.({ themeMode })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps app shell UI off direct app shell IPC channels", () => {
    const combinedSource = [mainSource, themeContextSource].join("\n")

    expect(mainSource).toContain("desktopAppShellClient.showContextMenu({")
    expect(themeContextSource).toContain("desktopAppShellClient.broadcastThemeChange(themeMode)")
    expect(combinedSource).not.toContain("tipcClient.showContextMenu(")
    expect(combinedSource).not.toContain("tipcClient.broadcastThemeChange")
  })
})
