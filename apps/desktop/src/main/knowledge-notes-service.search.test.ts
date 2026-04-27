import { beforeEach, describe, expect, it, vi } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"

const mockPaths = vi.hoisted(() => ({
  globalAgentsFolder: "",
}))

vi.mock("electron", () => ({
  app: { getPath: vi.fn(() => "/tmp") },
}))

vi.mock("./config", () => ({
  globalAgentsFolder: mockPaths.globalAgentsFolder,
  resolveWorkspaceAgentsFolder: () => null,
}))

vi.mock("./debug", () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

describe("KnowledgeNotesService search", () => {
  beforeEach(() => {
    vi.resetModules()
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotagents-knowledge-search-"))
    mockPaths.globalAgentsFolder = path.join(tempDir, ".agents")
  })

  it("finds notes with fuzzy token matching and ranks stronger title matches first", async () => {
    const now = Date.now()
    const { KnowledgeNotesService } = await import("./knowledge-notes-service")
    const service = new KnowledgeNotesService()

    await service.saveNote({
      id: "harness-strategy",
      title: "Harness Engineering Strategy",
      context: "search-only",
      updatedAt: now,
      tags: ["strategy"],
      body: "Direction for harness engineering and evaluation work.",
    })
    await service.saveNote({
      id: "random",
      title: "Random Note",
      context: "search-only",
      updatedAt: now + 1,
      tags: [],
      body: "A weaker body-only mention of harness work.",
    })

    const results = await service.searchNotes("harnes enginering")

    expect(results.map((note) => note.id)).toContain("harness-strategy")
    expect(results[0].id).toBe("harness-strategy")
  })

  it("applies date, context, and explicit sort filters server-side", async () => {
    const now = Date.now()
    const { KnowledgeNotesService } = await import("./knowledge-notes-service")
    const service = new KnowledgeNotesService()

    await service.saveNote({
      id: "new-auto",
      title: "Zeta Strategy",
      context: "auto",
      updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      createdAt: now - 10,
      tags: ["strategy"],
      body: "New auto strategy",
    })
    await service.saveNote({
      id: "old-auto",
      title: "Alpha Strategy",
      context: "auto",
      updatedAt: now - 60 * 24 * 60 * 60 * 1000,
      createdAt: now - 20,
      tags: ["strategy"],
      body: "Old auto strategy",
    })
    await service.saveNote({
      id: "new-search-only",
      title: "Beta Strategy",
      context: "search-only",
      updatedAt: now - 1,
      tags: ["strategy"],
      body: "New search-only strategy",
    })

    await expect(service.searchNotes("strategy", { context: "auto", dateFilter: "7d" }))
      .resolves.toEqual([expect.objectContaining({ id: "new-auto" })])

    await expect(service.searchNotes("strategy", { context: "auto", sort: "title-asc" }))
      .resolves.toEqual([
        expect.objectContaining({ id: "old-auto" }),
        expect.objectContaining({ id: "new-auto" }),
      ])

    await expect(service.getAllNotes({ sort: "title-asc", limit: 2 }))
      .resolves.toEqual([
        expect.objectContaining({ id: "old-auto" }),
        expect.objectContaining({ id: "new-search-only" }),
      ])
  })
})
