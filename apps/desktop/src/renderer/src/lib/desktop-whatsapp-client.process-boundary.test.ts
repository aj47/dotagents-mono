import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-whatsapp-client.ts", import.meta.url), "utf8")
const settingsWhatsAppSource = readFileSync(new URL("../pages/settings-whatsapp.tsx", import.meta.url), "utf8")

describe("desktop WhatsApp renderer client", () => {
  it("centralizes desktop WhatsApp IPC channels behind shared operator result types", () => {
    expect(clientSource).toContain("OperatorActionResponse")
    expect(clientSource).toContain("OperatorWhatsAppIntegrationSummary")
    expect(clientSource).toContain("tipcClient.whatsappGetStatus()")
    expect(clientSource).toContain("tipcClient.whatsappConnect()")
    expect(clientSource).toContain("tipcClient.whatsappDisconnect()")
    expect(clientSource).toContain("tipcClient.whatsappLogout()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps settings WhatsApp UI off direct WhatsApp IPC channels", () => {
    expect(settingsWhatsAppSource).toContain("desktopWhatsAppClient.getStatus()")
    expect(settingsWhatsAppSource).toContain("desktopWhatsAppClient.connect()")
    expect(settingsWhatsAppSource).toContain("desktopWhatsAppClient.disconnect()")
    expect(settingsWhatsAppSource).toContain("desktopWhatsAppClient.logout()")
    expect(settingsWhatsAppSource).not.toContain("tipcClient.whatsappGetStatus(")
    expect(settingsWhatsAppSource).not.toContain("tipcClient.whatsappConnect(")
    expect(settingsWhatsAppSource).not.toContain("tipcClient.whatsappDisconnect(")
    expect(settingsWhatsAppSource).not.toContain("tipcClient.whatsappLogout(")
  })
})
