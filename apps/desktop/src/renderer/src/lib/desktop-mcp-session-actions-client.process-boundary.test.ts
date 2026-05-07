import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-mcp-session-actions-client.ts", import.meta.url), "utf8")
const overlayFollowUpInputSource = readFileSync(
  new URL("../components/overlay-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const tileFollowUpInputSource = readFileSync(
  new URL("../components/tile-follow-up-input.tsx", import.meta.url),
  "utf8",
)
const sessionActionDialogSource = readFileSync(
  new URL("../components/session-action-dialog.tsx", import.meta.url),
  "utf8",
)
const panelPageSource = readFileSync(new URL("../pages/panel.tsx", import.meta.url), "utf8")
const onboardingPageSource = readFileSync(new URL("../pages/onboarding.tsx", import.meta.url), "utf8")

describe("desktop MCP session actions renderer client", () => {
  it("centralizes MCP text and voice continuation IPC", () => {
    expect(clientSource).toContain("tipcClient.createMcpTextInput(request)")
    expect(clientSource).toContain("tipcClient.createMcpRecording(request)")
    expect(clientSource).toContain("tipcClient.triggerMcpRecording(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps follow-up inputs, session dialog, panel page, and onboarding off direct MCP session action IPC", () => {
    const combinedSource = [
      overlayFollowUpInputSource,
      tileFollowUpInputSource,
      sessionActionDialogSource,
      panelPageSource,
      onboardingPageSource,
    ].join("\n")

    expect(overlayFollowUpInputSource).toContain("desktopMcpSessionActionsClient.createMcpTextInput({")
    expect(overlayFollowUpInputSource).toContain("desktopMcpSessionActionsClient.triggerMcpRecording({")
    expect(tileFollowUpInputSource).toContain("desktopMcpSessionActionsClient.createMcpTextInput({")
    expect(tileFollowUpInputSource).toContain("desktopMcpSessionActionsClient.triggerMcpRecording({")
    expect(sessionActionDialogSource).toContain("desktopMcpSessionActionsClient.createMcpTextInput({")
    expect(sessionActionDialogSource).toContain("desktopMcpSessionActionsClient.createMcpRecording({")
    expect(panelPageSource).toContain("desktopMcpSessionActionsClient.createMcpTextInput({")
    expect(panelPageSource).toContain("desktopMcpSessionActionsClient.createMcpRecording({")
    expect(onboardingPageSource).toContain("desktopMcpSessionActionsClient.createMcpTextInput({")
    expect(combinedSource).not.toContain("tipcClient.createMcpTextInput(")
    expect(combinedSource).not.toContain("tipcClient.createMcpRecording(")
    expect(combinedSource).not.toContain("tipcClient.triggerMcpRecording(")
  })
})
