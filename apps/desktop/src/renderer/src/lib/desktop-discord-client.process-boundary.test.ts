import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-discord-client.ts", import.meta.url), "utf8")
const settingsDiscordSource = readFileSync(new URL("../pages/settings-discord.tsx", import.meta.url), "utf8")

describe("desktop discord renderer client", () => {
  it("centralizes desktop Discord IPC channels behind shared operator result types", () => {
    expect(clientSource).toContain("OperatorActionResponse")
    expect(clientSource).toContain("OperatorDiscordIntegrationSummary")
    expect(clientSource).toContain("OperatorDiscordLogEntry")
    expect(clientSource).toContain("tipcClient.discordGetStatus()")
    expect(clientSource).toContain("tipcClient.discordGetLogs()")
    expect(clientSource).toContain("tipcClient.discordConnect()")
    expect(clientSource).toContain("tipcClient.discordDisconnect()")
    expect(clientSource).toContain("tipcClient.discordClearLogs()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps settings Discord UI off direct Discord IPC channels", () => {
    expect(settingsDiscordSource).toContain("desktopDiscordClient.getStatus()")
    expect(settingsDiscordSource).toContain("desktopDiscordClient.getLogs()")
    expect(settingsDiscordSource).toContain("desktopDiscordClient.connect()")
    expect(settingsDiscordSource).toContain("desktopDiscordClient.disconnect()")
    expect(settingsDiscordSource).toContain("desktopDiscordClient.clearLogs()")
    expect(settingsDiscordSource).not.toContain("tipcClient.discordGetStatus(")
    expect(settingsDiscordSource).not.toContain("tipcClient.discordGetLogs(")
    expect(settingsDiscordSource).not.toContain("tipcClient.discordConnect(")
    expect(settingsDiscordSource).not.toContain("tipcClient.discordDisconnect(")
    expect(settingsDiscordSource).not.toContain("tipcClient.discordClearLogs(")
  })
})
