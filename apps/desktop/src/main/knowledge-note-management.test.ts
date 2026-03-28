import { describe, expect, it, vi } from "vitest"
import type { KnowledgeNote } from "@shared/types"

const mockKnowledgeNotesService = vi.hoisted(() => ({
  getAllNotes: vi.fn(),
  getNote: vi.fn(),
  searchNotes: vi.fn(),
  createNote: vi.fn(),
  createNoteFromSummary: vi.fn(),
  saveNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  deleteMultipleNotes: vi.fn(),
  deleteAllNotes: vi.fn(),
}))

vi.mock("./knowledge-notes-service", () => ({
  knowledgeNotesService: mockKnowledgeNotesService,
}))

import {
  createManagedKnowledgeNote,
  deleteAllManagedKnowledgeNotes,
  deleteManagedKnowledgeNote,
  deleteMultipleManagedKnowledgeNotes,
  getManagedKnowledgeNote,
  getManagedKnowledgeNotes,
  saveManagedKnowledgeNoteFromSummary,
  searchManagedKnowledgeNotes,
  updateManagedKnowledgeNote,
} from "./knowledge-note-management"

function createNote(overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id: "note-1",
    title: "Architecture decisions",
    context: "search-only",
    updatedAt: 200,
    createdAt: 100,
    tags: ["docs"],
    body: "Record service boundaries",
    summary: "Service boundaries",
    references: ["docs/architecture.md"],
    ...overrides,
  }
}

describe("knowledge note management", () => {
  it("lists, gets, and searches notes through one shared helper", async () => {
    const note = createNote()
    mockKnowledgeNotesService.getAllNotes.mockResolvedValue([note])
    mockKnowledgeNotesService.getNote.mockResolvedValue(note)
    mockKnowledgeNotesService.searchNotes.mockResolvedValue([note])

    await expect(getManagedKnowledgeNotes()).resolves.toEqual([note])
    await expect(getManagedKnowledgeNote("note-1")).resolves.toEqual(note)
    await expect(searchManagedKnowledgeNotes("service")).resolves.toEqual([
      note,
    ])
  })

  it("creates notes from unknown payloads and reloads the persisted note", async () => {
    const createdNote = createNote({
      title: "Project architecture",
      body: "Keep transport boundaries explicit",
      context: "auto",
      tags: ["docs", "platform"],
      references: ["docs/architecture.md"],
    })

    mockKnowledgeNotesService.createNote.mockReturnValue(createdNote)
    mockKnowledgeNotesService.saveNote.mockResolvedValue(true)
    mockKnowledgeNotesService.getNote.mockResolvedValue(createdNote)

    await expect(
      createManagedKnowledgeNote({
        title: "  Project architecture  ",
        body: "  Keep transport boundaries explicit  ",
        context: "auto",
        tags: ["docs", 3, "platform"],
        references: ["docs/architecture.md", false],
      }),
    ).resolves.toEqual({
      success: true,
      note: createdNote,
    })

    expect(mockKnowledgeNotesService.createNote).toHaveBeenCalledWith({
      id: undefined,
      title: "Project architecture",
      body: "Keep transport boundaries explicit",
      summary: undefined,
      context: "auto",
      tags: ["docs", "platform"],
      references: ["docs/architecture.md"],
    })
  })

  it("reports no_durable_content for summary saves without treating them as failures", async () => {
    mockKnowledgeNotesService.createNoteFromSummary.mockReturnValue(null)

    await expect(
      saveManagedKnowledgeNoteFromSummary({
        summary: {
          id: "summary-1",
          sessionId: "session-1",
          stepNumber: 1,
          timestamp: 123,
          actionSummary: "Nothing durable here.",
        },
      }),
    ).resolves.toEqual({
      success: true,
      note: null,
      reason: "no_durable_content",
    })
  })

  it("returns explicit validation, not-found, and persist errors for note mutations", async () => {
    mockKnowledgeNotesService.getNote.mockResolvedValueOnce(null)
    await expect(
      updateManagedKnowledgeNote("missing-note", { body: "Updated body" }),
    ).resolves.toEqual({
      success: false,
      errorCode: "not_found",
      error: "Knowledge note not found",
    })

    await expect(
      createManagedKnowledgeNote({
        body: "",
      }),
    ).resolves.toEqual({
      success: false,
      errorCode: "invalid_input",
      error: "body is required and must be a non-empty string",
    })

    mockKnowledgeNotesService.getNote.mockResolvedValueOnce(createNote())
    mockKnowledgeNotesService.deleteNote.mockResolvedValue(false)
    await expect(deleteManagedKnowledgeNote("note-1")).resolves.toEqual({
      success: false,
      errorCode: "persist_failed",
      error: "Failed to persist knowledge note deletion",
    })

    mockKnowledgeNotesService.deleteAllNotes.mockResolvedValue({
      deletedCount: 2,
      error: "Failed to delete note note-2",
    })
    await expect(deleteAllManagedKnowledgeNotes()).resolves.toEqual({
      success: false,
      errorCode: "persist_failed",
      error: "Failed to delete note note-2",
    })
  })

  it("bulk deletes notes through the shared mutation helper", async () => {
    mockKnowledgeNotesService.deleteMultipleNotes.mockResolvedValue({
      deletedCount: 2,
    })

    await expect(
      deleteMultipleManagedKnowledgeNotes(["note-1", "note-2"]),
    ).resolves.toEqual({
      success: true,
      deletedCount: 2,
    })

    mockKnowledgeNotesService.deleteMultipleNotes.mockResolvedValue({
      deletedCount: 1,
      error: "Failed to delete note note-2",
    })

    await expect(
      deleteMultipleManagedKnowledgeNotes(["note-1", "note-2"]),
    ).resolves.toEqual({
      success: false,
      errorCode: "persist_failed",
      error: "Failed to delete note note-2",
    })
  })
})
