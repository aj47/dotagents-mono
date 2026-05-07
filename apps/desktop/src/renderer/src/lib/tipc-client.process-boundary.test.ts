import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const tipcClientSource = readFileSync(new URL("./tipc-client.ts", import.meta.url), "utf8")
const sharedRendererHandlersSource = readFileSync(
  new URL("../../../shared/renderer-handlers.ts", import.meta.url),
  "utf8",
)
const webTsconfigSource = readFileSync(
  new URL("../../../../tsconfig.web.json", import.meta.url),
  "utf8",
)

describe("renderer TIPC process boundary", () => {
  it("keeps renderer IPC types in shared desktop code", () => {
    expect(tipcClientSource).toContain('from "@shared/tipc-client-types"')
    expect(tipcClientSource).toContain('from "@shared/renderer-handlers"')
    expect(tipcClientSource).not.toContain("../../../main/tipc")
    expect(tipcClientSource).not.toContain("../../../main/renderer-handlers")
    expect(sharedRendererHandlersSource).toContain("export type RendererHandlers")
    expect(sharedRendererHandlersSource).toContain('from "./agent-session-types"')
    expect(sharedRendererHandlersSource).not.toContain("../main")
    expect(sharedRendererHandlersSource).not.toContain("agent-session-tracker")
    expect(webTsconfigSource).not.toContain('"src/main/*.ts"')
  })
})
