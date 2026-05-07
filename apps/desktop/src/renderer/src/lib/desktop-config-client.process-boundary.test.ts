import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-config-client.ts", import.meta.url), "utf8")
const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")
const useStoreSyncSource = readFileSync(new URL("../hooks/use-store-sync.ts", import.meta.url), "utf8")
const agentProgressSource = readFileSync(
  new URL("../components/agent-progress.tsx", import.meta.url),
  "utf8",
)
const sessionActionDialogSource = readFileSync(
  new URL("../components/session-action-dialog.tsx", import.meta.url),
  "utf8",
)
const panelPageSource = readFileSync(new URL("../pages/panel.tsx", import.meta.url), "utf8")
const onboardingPageSource = readFileSync(new URL("../pages/onboarding.tsx", import.meta.url), "utf8")

describe("desktop config renderer client", () => {
  it("centralizes config IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getConfig()")
    expect(clientSource).toContain("tipcClient.saveConfig({ config })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps shared config hooks and agent controls off direct config IPC channels", () => {
    const combinedSource = [
      queriesSource,
      useStoreSyncSource,
      agentProgressSource,
      sessionActionDialogSource,
      panelPageSource,
      onboardingPageSource,
    ].join("\n")

    expect(queriesSource).toContain("desktopConfigClient.getConfig()")
    expect(queriesSource).toContain("desktopConfigClient.saveConfig(config)")
    expect(useStoreSyncSource).toContain("desktopConfigClient.getConfig()")
    expect(useStoreSyncSource).toContain("desktopConfigClient.saveConfig({")
    expect(agentProgressSource).toContain("desktopConfigClient.saveConfig({")
    expect(sessionActionDialogSource).toContain("desktopConfigClient.getConfig()")
    expect(panelPageSource).toContain("desktopConfigClient.getConfig()")
    expect(onboardingPageSource).toContain("desktopConfigClient.getConfig()")
    expect(combinedSource).not.toContain("tipcClient.getConfig(")
    expect(combinedSource).not.toContain("tipcClient.saveConfig(")
  })
})
