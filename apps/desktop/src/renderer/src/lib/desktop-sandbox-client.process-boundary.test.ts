import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-sandbox-client.ts", import.meta.url), "utf8")
const switcherSource = readFileSync(new URL("../components/sandbox-slot-switcher.tsx", import.meta.url), "utf8")

describe("desktop sandbox renderer client", () => {
  it("centralizes sandbox slot IPC channels", () => {
    expect(clientSource).toContain("tipcClient.getSandboxState()")
    expect(clientSource).toContain("tipcClient.saveBaseline()")
    expect(clientSource).toContain("tipcClient.switchToSlot({ name })")
    expect(clientSource).toContain("tipcClient.restoreBaseline()")
    expect(clientSource).toContain("tipcClient.saveCurrentAsSlot({ name })")
    expect(clientSource).toContain("tipcClient.deleteSlot({ name })")
    expect(clientSource).toContain("tipcClient.renameSlot({ oldName, newName })")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps sandbox slot UI off direct sandbox IPC channels", () => {
    expect(switcherSource).toContain("desktopSandboxClient.getSandboxState()")
    expect(switcherSource).toContain("desktopSandboxClient.saveBaseline()")
    expect(switcherSource).toContain("desktopSandboxClient.switchToSlot(slotName)")
    expect(switcherSource).toContain("desktopSandboxClient.restoreBaseline()")
    expect(switcherSource).toContain("desktopSandboxClient.saveCurrentAsSlot(newSlotName.trim())")
    expect(switcherSource).toContain("desktopSandboxClient.deleteSlot(slotName)")
    expect(switcherSource).toContain("desktopSandboxClient.renameSlot(oldName, renameValue.trim())")
    expect(switcherSource).not.toContain("tipcClient.getSandboxState(")
    expect(switcherSource).not.toContain("tipcClient.saveBaseline(")
    expect(switcherSource).not.toContain("tipcClient.switchToSlot(")
    expect(switcherSource).not.toContain("tipcClient.restoreBaseline(")
    expect(switcherSource).not.toContain("tipcClient.saveCurrentAsSlot(")
    expect(switcherSource).not.toContain("tipcClient.deleteSlot(")
    expect(switcherSource).not.toContain("tipcClient.renameSlot(")
  })
})
