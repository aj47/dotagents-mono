import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sessionTileSource = readFileSync(new URL("./session-tile.tsx", import.meta.url), "utf8")

describe("SessionTile error display", () => {
  it("only injects runtime error messages into the transcript while the session is errored", () => {
    expect(sessionTileSource).toContain('if (session.status === "error" && session.errorMessage) {')
  })
})