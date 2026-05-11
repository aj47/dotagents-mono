import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const dialogSource = readFileSync(new URL("./past-sessions-dialog.tsx", import.meta.url), "utf8")

describe("saved conversations dialog presentation", () => {
  it("uses shared conversation list presentation helpers", () => {
    expect(dialogSource).toContain("@dotagents/shared/conversation-list-presentation")
    expect(dialogSource).toContain("APP_CONVERSATION_LIST_SECTION_LABELS[entry.kind]")
    expect(dialogSource).toContain("getConversationListItemAccessibilityLabel")
    expect(dialogSource).toContain("normalizeConversationListPreviewText")
  })
})
