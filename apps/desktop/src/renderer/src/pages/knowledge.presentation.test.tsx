import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const knowledgeSource = readFileSync(new URL("./knowledge.tsx", import.meta.url), "utf8")

describe("knowledge page presentation", () => {
  it("uses shared knowledge note editor presentation in the edit dialog", () => {
    expect(knowledgeSource).toContain("APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.editDescription")
    expect(knowledgeSource).toContain("APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.context.helper")
    expect(knowledgeSource).toContain("APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.title.requiredLabel")
    expect(knowledgeSource).toContain("APP_SHELL_KNOWLEDGE_NOTE_EDITOR_PRESENTATION.fields.references.placeholder")
    expect(knowledgeSource).toContain("getAppShellEditorActionLabel(\"knowledgeNote\", true)")
    expect(knowledgeSource).not.toContain("Update canonical note fields for this knowledge note.")
    expect(knowledgeSource).not.toContain("Tags (comma-separated)")
    expect(knowledgeSource).not.toContain("Detailed note body")
  })
})
