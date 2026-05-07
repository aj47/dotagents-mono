import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-panel-client.ts", import.meta.url), "utf8")
const textInputPanelSource = readFileSync(
  new URL("../components/text-input-panel.tsx", import.meta.url),
  "utf8",
)
const overlayFollowUpInputSource = readFileSync(
  new URL("../components/overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const agentProgressSource = readFileSync(new URL("../components/agent-progress.tsx", import.meta.url), "utf8")
const useStoreSyncSource = readFileSync(new URL("../hooks/use-store-sync.ts", import.meta.url), "utf8")

describe("desktop panel renderer client", () => {
  it("centralizes panel IPC channels", () => {
    expect(clientSource).toContain("tipcClient.setPanelFocusable(request)")
    expect(clientSource).toContain("tipcClient.getFloatingPanelVisibility()")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps focused text-input surfaces off direct panel focusability IPC", () => {
    const combinedSource = [textInputPanelSource, overlayFollowUpInputSource, agentProgressSource].join("\n")

    expect(textInputPanelSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(overlayFollowUpInputSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(agentProgressSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(combinedSource).not.toContain("tipcClient.setPanelFocusable(")
  })

  it("keeps store sync off direct floating panel visibility IPC", () => {
    expect(useStoreSyncSource).toContain("desktopPanelClient.getFloatingPanelVisibility()")
    expect(useStoreSyncSource).not.toContain("tipcClient.getFloatingPanelVisibility(")
  })
})
