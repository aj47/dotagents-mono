import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-mcp-dialogs-client.ts", import.meta.url), "utf8")
const samplingDialogSource = readFileSync(
  new URL("../components/mcp-sampling-dialog.tsx", import.meta.url),
  "utf8",
)
const elicitationDialogSource = readFileSync(
  new URL("../components/mcp-elicitation-dialog.tsx", import.meta.url),
  "utf8",
)

describe("desktop MCP dialogs renderer client", () => {
  it("centralizes MCP dialog response IPC channels", () => {
    expect(clientSource).toContain('rendererHandlers["mcp:sampling-request"].listen(listener)')
    expect(clientSource).toContain('rendererHandlers["mcp:elicitation-request"].listen(listener)')
    expect(clientSource).toContain('rendererHandlers["mcp:elicitation-complete"].listen(listener)')
    expect(clientSource).toContain("tipcClient.resolveSampling({ requestId, approved })")
    expect(clientSource).toContain("tipcClient.resolveElicitation({")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps MCP dialogs off direct response IPC channels", () => {
    const combinedSource = [samplingDialogSource, elicitationDialogSource].join("\n")

    expect(samplingDialogSource).toContain(
      "desktopMcpDialogsClient.onSamplingRequest(",
    )
    expect(elicitationDialogSource).toContain(
      "desktopMcpDialogsClient.onElicitationRequest(",
    )
    expect(elicitationDialogSource).toContain(
      "desktopMcpDialogsClient.onElicitationComplete(",
    )
    expect(samplingDialogSource).toContain(
      "desktopMcpDialogsClient.resolveSampling(request.requestId, approved)",
    )
    expect(elicitationDialogSource).toContain(
      "desktopMcpDialogsClient.resolveElicitation(request.requestId, {",
    )
    expect(combinedSource).not.toContain("tipcClient.resolveSampling(")
    expect(combinedSource).not.toContain("tipcClient.resolveElicitation(")
    expect(combinedSource).not.toContain('rendererHandlers["mcp:')
  })
})
