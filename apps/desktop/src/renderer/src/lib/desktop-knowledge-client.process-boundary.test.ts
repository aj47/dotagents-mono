import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const clientSource = readFileSync(new URL("./desktop-knowledge-client.ts", import.meta.url), "utf8")
const knowledgePageSource = readFileSync(new URL("../pages/knowledge.tsx", import.meta.url), "utf8")
const agentSummaryViewSource = readFileSync(
  new URL("../components/agent-summary-view.tsx", import.meta.url),
  "utf8",
)

describe("desktop knowledge renderer client", () => {
  it("centralizes desktop knowledge IPC channels behind shared knowledge types", () => {
    expect(clientSource).toContain("KnowledgeNote")
    expect(clientSource).toContain("KnowledgeNotesOverview")
    expect(clientSource).toContain("tipcClient.getKnowledgeNotesOverview(filter)")
    expect(clientSource).toContain("tipcClient.getKnowledgeNotesByGroup(filter)")
    expect(clientSource).toContain("tipcClient.getAllKnowledgeNotes(filter)")
    expect(clientSource).toContain("tipcClient.searchKnowledgeNotes(request)")
    expect(clientSource).toContain("tipcClient.updateKnowledgeNote(request)")
    expect(clientSource).toContain("tipcClient.deleteKnowledgeNote({ id })")
    expect(clientSource).toContain("tipcClient.deleteMultipleKnowledgeNotes({ ids })")
    expect(clientSource).toContain("tipcClient.deleteAllKnowledgeNotes()")
    expect(clientSource).toContain("tipcClient.openKnowledgeFolder()")
    expect(clientSource).toContain("tipcClient.openWorkspaceKnowledgeFolder()")
    expect(clientSource).toContain("tipcClient.saveKnowledgeNoteFromSummary(request)")
    expect(clientSource).not.toContain("window.electron.ipcRenderer")
  })

  it("keeps knowledge UI off direct knowledge IPC channels", () => {
    const combinedSource = [knowledgePageSource, agentSummaryViewSource].join("\n")

    expect(knowledgePageSource).toContain("desktopKnowledgeClient.getOverview(")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.getNotesByGroup(")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.getAllNotes(")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.searchNotes(")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.updateNote(")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.deleteNote(id)")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.deleteMultipleNotes(ids)")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.deleteAllNotes()")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.openKnowledgeFolder()")
    expect(knowledgePageSource).toContain("desktopKnowledgeClient.openWorkspaceKnowledgeFolder()")
    expect(agentSummaryViewSource).toContain("desktopKnowledgeClient.saveNoteFromSummary({")
    expect(combinedSource).not.toContain("tipcClient.getKnowledgeNotesOverview(")
    expect(combinedSource).not.toContain("tipcClient.getKnowledgeNotesByGroup(")
    expect(combinedSource).not.toContain("tipcClient.getAllKnowledgeNotes(")
    expect(combinedSource).not.toContain("tipcClient.searchKnowledgeNotes(")
    expect(combinedSource).not.toContain("tipcClient.updateKnowledgeNote(")
    expect(combinedSource).not.toContain("tipcClient.deleteKnowledgeNote(")
    expect(combinedSource).not.toContain("tipcClient.deleteMultipleKnowledgeNotes(")
    expect(combinedSource).not.toContain("tipcClient.deleteAllKnowledgeNotes(")
    expect(combinedSource).not.toContain("tipcClient.openKnowledgeFolder(")
    expect(combinedSource).not.toContain("tipcClient.openWorkspaceKnowledgeFolder(")
    expect(combinedSource).not.toContain("tipcClient.saveKnowledgeNoteFromSummary(")
  })
})
