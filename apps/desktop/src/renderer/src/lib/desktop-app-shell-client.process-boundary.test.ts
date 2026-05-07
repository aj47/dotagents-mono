import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-app-shell-client.ts", import.meta.url), "utf8")
const mainSource = readFileSync(new URL("../main.tsx", import.meta.url), "utf8")
const themeContextSource = readFileSync(new URL("../contexts/theme-context.tsx", import.meta.url), "utf8")
const panelPageSource = readFileSync(new URL("../pages/panel.tsx", import.meta.url), "utf8")
const clipboardSource = readFileSync(new URL("./clipboard.ts", import.meta.url), "utf8")
const debugSource = readFileSync(new URL("./debug.ts", import.meta.url), "utf8")

describe("desktop app shell renderer client", () => {
  it("centralizes app shell IPC channels", () => {
    expect(clientSource).toContain("tipcClient.showContextMenu(request)")
    expect(clientSource).toContain("tipcClient.broadcastThemeChange?.({ themeMode })")
    expect(clientSource).toContain("tipcClient.displayError(request)")
    expect(clientSource).toContain("tipcClient.writeClipboard({ text })")
    expect(clientSource).toContain("tipcClient.getDebugFlags()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps app shell UI and helpers off direct app shell IPC channels", () => {
    const combinedSource = [
      mainSource,
      themeContextSource,
      panelPageSource,
      clipboardSource,
      debugSource,
    ].join("\n")

    expect(mainSource).toContain("desktopAppShellClient.showContextMenu({")
    expect(themeContextSource).toContain("desktopAppShellClient.broadcastThemeChange(themeMode)")
    expect(panelPageSource).toContain("desktopAppShellClient.displayError({")
    expect(clipboardSource).toContain("desktopAppShellClient.writeClipboard(text)")
    expect(debugSource).toContain("desktopAppShellClient.getDebugFlags()")
    expect(combinedSource).not.toContain("tipcClient.showContextMenu(")
    expect(combinedSource).not.toContain("tipcClient.broadcastThemeChange")
    expect(combinedSource).not.toContain("tipcClient.displayError(")
    expect(combinedSource).not.toContain("tipcClient.writeClipboard(")
    expect(combinedSource).not.toContain("tipcClient.getDebugFlags(")
  })
})
