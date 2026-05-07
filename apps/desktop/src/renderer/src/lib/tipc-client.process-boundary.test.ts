import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcClientSource = readFileSync(new URL("./tipc-client.ts", import.meta.url), "utf8")
const sharedRendererHandlersSource = readFileSync(
  new URL("../../../shared/renderer-handlers.ts", import.meta.url),
  "utf8",
)
const mainRendererHandlersSource = readFileSync(
  new URL("../../../main/renderer-handlers.ts", import.meta.url),
  "utf8",
)

describe("renderer TIPC process boundary", () => {
  it("keeps renderer handler event types in shared desktop code", () => {
    expect(tipcClientSource).toContain('from "@shared/renderer-handlers"')
    expect(tipcClientSource).not.toContain("../../../main/renderer-handlers")
    expect(sharedRendererHandlersSource).toContain("export type RendererHandlers")
    expect(sharedRendererHandlersSource).toContain('from "./agent-session-types"')
    expect(sharedRendererHandlersSource).not.toContain("../main")
    expect(sharedRendererHandlersSource).not.toContain("agent-session-tracker")
    expect(mainRendererHandlersSource).toContain('export type { RendererHandlers } from "@shared/renderer-handlers"')
  })
})
