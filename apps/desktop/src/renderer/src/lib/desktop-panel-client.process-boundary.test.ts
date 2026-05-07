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
const panelDragBarSource = readFileSync(new URL("../components/panel-drag-bar.tsx", import.meta.url), "utf8")
const panelResizeWrapperSource = readFileSync(
  new URL("../components/panel-resize-wrapper.tsx", import.meta.url),
  "utf8",
)
const resizeHandleSource = readFileSync(new URL("../components/resize-handle.tsx", import.meta.url), "utf8")
const panelPageSource = readFileSync(new URL("../pages/panel.tsx", import.meta.url), "utf8")

describe("desktop panel renderer client", () => {
  it("centralizes panel IPC channels", () => {
    expect(clientSource).toContain("rendererHandlers.onPanelSizeChanged.listen(listener)")
    expect(clientSource).toContain("rendererHandlers.panelVisibilityChanged.listen(listener)")
    expect(clientSource).toContain("tipcClient.setPanelFocusable(request)")
    expect(clientSource).toContain("tipcClient.getFloatingPanelVisibility()")
    expect(clientSource).toContain("tipcClient.getPanelPosition()")
    expect(clientSource).toContain("tipcClient.updatePanelPosition(position)")
    expect(clientSource).toContain("tipcClient.savePanelCustomPosition(position)")
    expect(clientSource).toContain("tipcClient.getPanelSize()")
    expect(clientSource).toContain("tipcClient.setPanelMode({ mode })")
    expect(clientSource).toContain("tipcClient.resizePanelForWaveformPreview({ showPreview })")
    expect(clientSource).toContain("tipcClient.showPanelWindow({})")
    expect(clientSource).toContain("tipcClient.hidePanelWindow({})")
    expect(clientSource).toContain("tipcClient.clearTextInputState({})")
    expect(clientSource).toContain("tipcClient.updatePanelSize(size)")
    expect(clientSource).toContain("tipcClient.savePanelCustomSize(size)")
    expect(clientSource).toContain("tipcClient.getPanelMode()")
    expect(clientSource).toContain("tipcClient.savePanelModeSize(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps focused text-input surfaces off direct panel focusability IPC", () => {
    const combinedSource = [textInputPanelSource, overlayFollowUpInputSource, agentProgressSource, panelPageSource].join("\n")

    expect(textInputPanelSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(overlayFollowUpInputSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(agentProgressSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(panelPageSource).toContain("desktopPanelClient.setPanelFocusable({")
    expect(combinedSource).not.toContain("tipcClient.setPanelFocusable(")
  })

  it("keeps store sync off direct floating panel visibility IPC", () => {
    expect(useStoreSyncSource).toContain("desktopPanelClient.onPanelVisibilityChanged(")
    expect(useStoreSyncSource).toContain("desktopPanelClient.getFloatingPanelVisibility()")
    expect(useStoreSyncSource).not.toContain("rendererHandlers.panelVisibilityChanged")
    expect(useStoreSyncSource).not.toContain("tipcClient.getFloatingPanelVisibility(")
  })

  it("keeps drag and resize surfaces off direct panel geometry IPC", () => {
    const combinedSource = [panelDragBarSource, panelResizeWrapperSource, resizeHandleSource].join("\n")

    expect(panelDragBarSource).toContain("desktopPanelClient.updatePanelPosition({")
    expect(panelDragBarSource).toContain("desktopPanelClient.savePanelCustomPosition({")
    expect(panelDragBarSource).toContain("desktopPanelClient.getPanelPosition()")
    expect(panelResizeWrapperSource).toContain("desktopPanelClient.getPanelSize()")
    expect(panelResizeWrapperSource).toContain("desktopPanelClient.onPanelSizeChanged(")
    expect(panelResizeWrapperSource).toContain("desktopPanelClient.updatePanelSize(")
    expect(panelResizeWrapperSource).toContain("desktopPanelClient.getPanelMode()")
    expect(panelResizeWrapperSource).toContain("desktopPanelClient.savePanelModeSize({")
    expect(panelResizeWrapperSource).toContain("desktopPanelClient.savePanelCustomSize(")
    expect(resizeHandleSource).toContain("desktopPanelClient.getPanelSize()")
    expect(combinedSource).not.toContain("tipcClient.getPanelPosition(")
    expect(combinedSource).not.toContain("rendererHandlers.onPanelSizeChanged")
    expect(combinedSource).not.toContain("tipcClient.updatePanelPosition(")
    expect(combinedSource).not.toContain("tipcClient.savePanelCustomPosition(")
    expect(combinedSource).not.toContain("tipcClient.getPanelSize(")
    expect(combinedSource).not.toContain("tipcClient.updatePanelSize(")
    expect(combinedSource).not.toContain("tipcClient.getPanelMode(")
    expect(combinedSource).not.toContain("tipcClient.savePanelModeSize(")
    expect(combinedSource).not.toContain("tipcClient.savePanelCustomSize(")
  })

  it("keeps panel page mode and size plumbing off direct panel IPC", () => {
    expect(panelPageSource).toContain("desktopPanelClient.setPanelMode(mode)")
    expect(panelPageSource).toContain("desktopPanelClient.getPanelSize()")
    expect(panelPageSource).toContain("desktopPanelClient.onPanelSizeChanged(updateNativePanelSize)")
    expect(panelPageSource).toContain("desktopPanelClient.resizePanelForWaveformPreview(hasPreview)")
    expect(panelPageSource).not.toContain("tipcClient.setPanelMode(")
    expect(panelPageSource).not.toContain("tipcClient.getPanelSize(")
    expect(panelPageSource).not.toContain("rendererHandlers.onPanelSizeChanged")
    expect(panelPageSource).not.toContain("tipcClient.resizePanelForWaveformPreview(")
  })

  it("keeps panel page window visibility and text-input state off direct panel IPC", () => {
    expect(panelPageSource).toContain("desktopPanelClient.showPanelWindow()")
    expect(panelPageSource).toContain("desktopPanelClient.hidePanelWindow()")
    expect(panelPageSource).toContain("desktopPanelClient.clearTextInputState()")
    expect(panelPageSource).not.toContain("tipcClient.showPanelWindow(")
    expect(panelPageSource).not.toContain("tipcClient.hidePanelWindow(")
    expect(panelPageSource).not.toContain("tipcClient.clearTextInputState(")
  })
})
