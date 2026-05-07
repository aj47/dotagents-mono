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

describe("desktop panel renderer client", () => {
  it("centralizes panel focusability IPC channels", () => {
    expect(clientSource).toContain("tipcClient.setPanelFocusable(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps focused text-input surfaces off direct panel focusability IPC", () => {
    const combinedSource = [textInputPanelSource, overlayFollowUpInputSource].join("\n")

    expect(textInputPanelSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(overlayFollowUpInputSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(combinedSource).not.toContain("tipcClient.setPanelFocusable(")
  })
})
