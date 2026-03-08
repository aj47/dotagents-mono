import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")

describe("conversation delete query cache handling", () => {
  it("clears the deleted conversation cache entry before refreshing history", () => {
    expect(source).toContain("onSuccess: (_, conversationId) => {")
    expect(source).toContain("queryClient.setQueryData([\"conversation\", conversationId], null)")
    expect(source).toContain("queryClient.invalidateQueries({ queryKey: [\"conversation-history\"] })")
  })
})