import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionsSource = readFileSync(new URL("./sessions.tsx", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("../../../main/tipc.ts", import.meta.url), "utf8")

function compact(source: string) {
  return source.replace(/\s+/g, "")
}

describe("sessions tile focus recovery", () => {
  it("rolls back optimistic focused-session state and shows feedback when panel focus cannot be established", () => {
    const compactSessionsSource = compact(sessionsSource)

    expect(compactSessionsSource).toContain(compact("const previousFocusedSessionId = focusedSessionId"))
    expect(compactSessionsSource).toContain(compact("const focusResult = await tipcClient.focusAgentSession({ sessionId })"))
    expect(compactSessionsSource).toContain(compact("if (focusResult && \"success\" in focusResult && focusResult.success === false)"))
    expect(compactSessionsSource).toContain(compact("setFocusedSessionId(previousFocusedSessionId ?? null)"))
    expect(compactSessionsSource).toContain(compact("toast.error(details ? `Failed to focus session. ${details}` : \"Failed to focus session\")"))
    expect(compactSessionsSource).toContain(compact("toast.error(getSessionActionErrorMessage(\"Failed to open session\", error))"))
  })

  it("teaches the main-process focusAgentSession route to report panel-unavailable failures instead of always claiming success", () => {
    const compactTipcSource = compact(tipcSource)

    expect(compactTipcSource).toContain(compact("const panelRendererHandlers = getWindowRendererHandlers(\"panel\")"))
    expect(compactTipcSource).toContain(compact("if (!panelRendererHandlers?.focusAgentSession)"))
    expect(compactTipcSource).toContain(compact('error: "Panel window is unavailable."'))
    expect(compactTipcSource).toContain(compact("panelRendererHandlers.focusAgentSession.send(input.sessionId)"))
    expect(compactTipcSource).toContain(compact("return { success: false, error: getErrorMessage(e) }"))
  })
})