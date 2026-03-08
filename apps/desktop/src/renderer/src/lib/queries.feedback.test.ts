import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./queries.ts", import.meta.url), "utf8")

describe("conversation delete query cache handling", () => {
  it("clears the deleted conversation cache entry before refreshing history", () => {
    expect(source).toContain("const clearDeletedConversationSelection = (conversationId?: string) => {")
    expect(source).toContain("const { currentConversationId, endConversation } = useConversationStore.getState()")
    expect(source).toContain("if (conversationId && currentConversationId !== conversationId) return")
    expect(source).toContain("clearDeletedConversationSelection(conversationId)")
    expect(source).toContain("onSuccess: (_, conversationId) => {")
    expect(source).toContain("queryClient.setQueryData([\"conversation\", conversationId], null)")
    expect(source).toContain("queryClient.invalidateQueries({ queryKey: [\"conversation-history\"] })")
  })

  it("clears any active conversation selection when all history is deleted", () => {
    expect(source).toContain("clearDeletedConversationSelection()")
    expect(source).toContain("queryClient.invalidateQueries({ queryKey: [\"conversation\"] })")
  })
})