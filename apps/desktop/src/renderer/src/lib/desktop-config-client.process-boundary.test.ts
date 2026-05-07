import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-config-client.ts", import.meta.url), "utf8")
const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")
const useStoreSyncSource = readFileSync(new URL("../hooks/use-store-sync.ts", import.meta.url), "utf8")

describe("desktop config renderer client", () => {
  it("centralizes config IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getConfig()")
    expect(clientSource).toContain("tipcClient.saveConfig({ config })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps shared config hooks off direct config IPC channels", () => {
    const combinedSource = [queriesSource, useStoreSyncSource].join("\n")

    expect(queriesSource).toContain("desktopConfigClient.getConfig()")
    expect(queriesSource).toContain("desktopConfigClient.saveConfig(config)")
    expect(useStoreSyncSource).toContain("desktopConfigClient.getConfig()")
    expect(useStoreSyncSource).toContain("desktopConfigClient.saveConfig({")
    expect(combinedSource).not.toContain("tipcClient.getConfig(")
    expect(combinedSource).not.toContain("tipcClient.saveConfig(")
  })
})
