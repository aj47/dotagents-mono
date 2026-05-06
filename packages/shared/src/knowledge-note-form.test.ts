import { describe, expect, it } from "vitest"
import type { KnowledgeNote } from "./api-types"

import {
  buildKnowledgeNotesDeleteAllResponse,
  buildKnowledgeNotesDeleteMultipleResponse,
  buildKnowledgeNoteDeleteResponse,
  buildKnowledgeNoteMutationResponse,
  buildKnowledgeNoteResponse,
  buildKnowledgeNotesResponse,
  createKnowledgeNoteAction,
  deleteAllKnowledgeNotesAction,
  deleteKnowledgeNoteAction,
  deleteMultipleKnowledgeNotesAction,
  formatKnowledgeNoteReferencesInput,
  formatKnowledgeNoteTagsInput,
  getKnowledgeNoteAction,
  getKnowledgeNotesAction,
  parseKnowledgeNoteCreateRequestBody,
  parseKnowledgeNotesDeleteMultipleRequestBody,
  parseKnowledgeNotesListRequestQuery,
  parseKnowledgeNoteReferencesInput,
  parseKnowledgeNoteSearchRequestBody,
  parseKnowledgeNoteTagsInput,
  parseKnowledgeNoteUpdateRequestBody,
  searchKnowledgeNotesAction,
  serializeKnowledgeNoteForApi,
  updateKnowledgeNoteAction,
} from "./knowledge-note-form"

describe("knowledge note form helpers", () => {
  it("formats tag and reference arrays for editor inputs", () => {
    expect(formatKnowledgeNoteTagsInput(["project", "preference"])).toBe("project, preference")
    expect(formatKnowledgeNoteReferencesInput(["docs/a.md", "https://example.com"])).toBe("docs/a.md\nhttps://example.com")
    expect(formatKnowledgeNoteReferencesInput(["docs/a.md", "https://example.com"], "comma")).toBe("docs/a.md, https://example.com")
  })

  it("parses comma-separated tags with trimming and de-duping", () => {
    expect(parseKnowledgeNoteTagsInput(" project, preference, project, , follow-up ")).toEqual([
      "project",
      "preference",
      "follow-up",
    ])
  })

  it("parses references separated by commas or newlines", () => {
    expect(parseKnowledgeNoteReferencesInput("docs/a.md\nhttps://example.com, docs/a.md\n notes/b.md ")).toEqual([
      "docs/a.md",
      "https://example.com",
      "notes/b.md",
    ])
  })

  it("parses create request bodies for the remote knowledge note API", () => {
    expect(parseKnowledgeNoteCreateRequestBody({
      id: " note-1 ",
      title: " Title ",
      body: " Body ",
      summary: " Summary ",
      context: "auto",
      tags: ["a", 1, "b"],
      references: ["ref", false],
    })).toEqual({
      ok: true,
      request: {
        id: "note-1",
        title: "Title",
        body: "Body",
        summary: "Summary",
        context: "auto",
        tags: ["a", "b"],
        references: ["ref"],
      },
    })

    expect(parseKnowledgeNoteCreateRequestBody({ body: " " })).toEqual({
      ok: false,
      statusCode: 400,
      error: "body is required and must be a non-empty string",
    })
  })

  it("parses update request bodies for the remote knowledge note API", () => {
    expect(parseKnowledgeNoteUpdateRequestBody({
      title: " Title ",
      body: " Body ",
      summary: " ",
      context: "search-only",
      tags: ["tag"],
      references: ["ref"],
    })).toEqual({
      ok: true,
      request: {
        title: "Title",
        body: "Body",
        summary: undefined,
        context: "search-only",
        tags: ["tag"],
        references: ["ref"],
      },
    })

    expect(parseKnowledgeNoteUpdateRequestBody({ tags: ["ok", 1] })).toEqual({
      ok: false,
      statusCode: 400,
      error: "tags must be an array of strings when provided",
    })
  })

  it("parses search request bodies for the remote knowledge note API", () => {
    expect(parseKnowledgeNoteSearchRequestBody({
      query: " project notes ",
      context: "auto",
      dateFilter: "30d",
      sort: "updated-desc",
      limit: 25.8,
    })).toEqual({
      ok: true,
      request: {
        query: "project notes",
        context: "auto",
        dateFilter: "30d",
        sort: "updated-desc",
        limit: 25,
      },
    })

    expect(parseKnowledgeNoteSearchRequestBody({ query: " " })).toEqual({
      ok: false,
      statusCode: 400,
      error: "query is required and must be a non-empty string",
    })
    expect(parseKnowledgeNoteSearchRequestBody({ query: "notes", sort: "newest" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "sort must be one of: relevance, updated-desc, updated-asc, created-desc, created-asc, title-asc, title-desc",
    })
  })

  it("parses list query filters for the remote knowledge note API", () => {
    expect(parseKnowledgeNotesListRequestQuery({
      context: "search-only",
      dateFilter: "7d",
      sort: "title-asc",
      limit: "12.8",
    })).toEqual({
      ok: true,
      request: {
        context: "search-only",
        dateFilter: "7d",
        sort: "title-asc",
        limit: 12,
      },
    })

    expect(parseKnowledgeNotesListRequestQuery(undefined)).toEqual({ ok: true, request: {} })
    expect(parseKnowledgeNotesListRequestQuery({ context: "all" })).toEqual({
      ok: false,
      statusCode: 400,
      error: "context must be one of: auto, search-only",
    })
  })

  it("parses delete-multiple request bodies for the remote knowledge note API", () => {
    expect(parseKnowledgeNotesDeleteMultipleRequestBody({
      ids: [" note-1 ", "note-2", "note-1", "", 1],
    })).toEqual({
      ok: true,
      request: {
        ids: ["note-1", "note-2"],
      },
    })

    expect(parseKnowledgeNotesDeleteMultipleRequestBody({ ids: [] })).toEqual({
      ok: false,
      statusCode: 400,
      error: "ids must be a non-empty array of strings",
    })
  })

  it("serializes knowledge notes to the shared API shape", () => {
    const note: KnowledgeNote = {
      id: "note-1",
      title: "Title",
      context: "search-only",
      body: "Body",
      summary: "Summary",
      tags: ["tag"],
      references: ["ref"],
      createdAt: 1,
      updatedAt: 2,
      group: "Group",
      series: "Series",
      entryType: "entry",
    }
    const serialized = {
      id: "note-1",
      title: "Title",
      context: "search-only",
      body: "Body",
      summary: "Summary",
      tags: ["tag"],
      references: ["ref"],
      createdAt: 1,
      updatedAt: 2,
      group: "Group",
      series: "Series",
      entryType: "entry",
    }

    expect(serializeKnowledgeNoteForApi(note)).toEqual(serialized)
    expect(buildKnowledgeNotesResponse([note])).toEqual({ notes: [serialized] })
    expect(buildKnowledgeNoteResponse(note)).toEqual({ note: serialized })
    expect(buildKnowledgeNoteMutationResponse(note)).toEqual({ success: true, note: serialized })
    expect(buildKnowledgeNoteDeleteResponse("note-1")).toEqual({ success: true, id: "note-1" })
    expect(buildKnowledgeNotesDeleteMultipleResponse(["note-1"], 1)).toEqual({
      success: true,
      deletedCount: 1,
      ids: ["note-1"],
    })
    expect(buildKnowledgeNotesDeleteAllResponse(3)).toEqual({ success: true, deletedCount: 3 })
  })

  it("runs shared knowledge note route actions through service adapters", async () => {
    const note: KnowledgeNote = {
      id: "note-1",
      title: "Title",
      context: "search-only",
      body: "Body",
      tags: ["tag"],
      references: [],
      createdAt: 1,
      updatedAt: 2,
    }
    const createdNote: KnowledgeNote = {
      ...note,
      id: "note-2",
      title: "Created",
      body: "Created body",
      createdAt: 3,
      updatedAt: 3,
    }
    const updatedNote: KnowledgeNote = {
      ...note,
      title: "Updated",
      updatedAt: 4,
    }
    const notesById = new Map<string, KnowledgeNote>([[note.id, note]])
    const service = {
      getAllNotes: async (filter: any) => {
        expect(filter).toEqual({
          context: "search-only",
          dateFilter: "7d",
          sort: "title-asc",
          limit: 12,
        })
        return Array.from(notesById.values())
      },
      getNote: async (id: string) => notesById.get(id),
      searchNotes: async (query: string, filter: any) => {
        expect(query).toBe("body")
        expect(filter).toEqual({
          context: "auto",
          dateFilter: "30d",
          sort: "updated-desc",
          limit: 25,
        })
        return [note]
      },
      deleteNote: async (id: string) => notesById.delete(id),
      deleteMultipleNotes: async (ids: string[]) => {
        expect(ids).toEqual(["note-3", "note-4"])
        return { deletedCount: 2 }
      },
      deleteAllNotes: async () => ({ deletedCount: notesById.size }),
      createNote: (request: any) => {
        expect(request.body).toBe("Created body")
        return createdNote
      },
      saveNote: async (nextNote: KnowledgeNote) => {
        notesById.set(nextNote.id, nextNote)
        return true
      },
      updateNote: async (id: string, request: any) => {
        expect(id).toBe("note-1")
        expect(request.title).toBe("Updated")
        notesById.set(id, updatedNote)
        return true
      },
    }
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }
    const options = { service, diagnostics }

    await expect(getKnowledgeNotesAction({
      context: "search-only",
      dateFilter: "7d",
      sort: "title-asc",
      limit: "12",
    }, options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNotesResponse([note]),
    })
    await expect(getKnowledgeNoteAction("note-1", options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNoteResponse(note),
    })
    await expect(searchKnowledgeNotesAction({
      query: " body ",
      context: "auto",
      dateFilter: "30d",
      sort: "updated-desc",
      limit: 25,
    }, options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNotesResponse([note]),
    })
    await expect(createKnowledgeNoteAction({ body: " Created body " }, options)).resolves.toEqual({
      statusCode: 201,
      body: buildKnowledgeNoteResponse(createdNote),
    })
    await expect(updateKnowledgeNoteAction("note-1", { title: " Updated " }, options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNoteMutationResponse(updatedNote),
    })
    await expect(deleteKnowledgeNoteAction("note-2", options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNoteDeleteResponse("note-2"),
    })
    await expect(deleteMultipleKnowledgeNotesAction({
      ids: [" note-3 ", "note-4", "note-3"],
    }, options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNotesDeleteMultipleResponse(["note-3", "note-4"], 2),
    })
    await expect(deleteAllKnowledgeNotesAction(options)).resolves.toEqual({
      statusCode: 200,
      body: buildKnowledgeNotesDeleteAllResponse(1),
    })
  })

  it("returns shared knowledge note route validation and state errors", async () => {
    const note: KnowledgeNote = {
      id: "note-1",
      title: "Title",
      context: "search-only",
      body: "Body",
      tags: [],
      references: [],
      createdAt: 1,
      updatedAt: 2,
    }
    const diagnostics = {
      logError: () => {
        throw new Error("unexpected diagnostics log")
      },
    }
    const options = {
      diagnostics,
      service: {
        getAllNotes: () => [],
        getNote: (id: string) => id === "note-1" ? note : undefined,
        searchNotes: () => [],
        deleteNote: () => false,
        deleteMultipleNotes: () => ({ deletedCount: 0, error: "Failed to delete note note-1" }),
        deleteAllNotes: () => ({ deletedCount: 0, error: "Failed to delete all notes" }),
        createNote: () => note,
        saveNote: () => false,
        updateNote: () => false,
      },
    }

    await expect(getKnowledgeNoteAction("missing", options)).resolves.toEqual({
      statusCode: 404,
      body: { error: "Knowledge note not found" },
    })
    await expect(deleteKnowledgeNoteAction("missing", options)).resolves.toEqual({
      statusCode: 404,
      body: { error: "Knowledge note not found" },
    })
    await expect(createKnowledgeNoteAction({}, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "body is required and must be a non-empty string" },
    })
    await expect(createKnowledgeNoteAction({ body: "Body" }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to save knowledge note" },
    })
    await expect(updateKnowledgeNoteAction("note-1", { tags: ["ok", 1] }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "tags must be an array of strings when provided" },
    })
    await expect(updateKnowledgeNoteAction("missing", { title: "Updated" }, options)).resolves.toEqual({
      statusCode: 404,
      body: { error: "Knowledge note not found" },
    })
    await expect(updateKnowledgeNoteAction("note-1", { title: "Updated" }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to update knowledge note" },
    })
    await expect(deleteKnowledgeNoteAction("note-1", options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to persist knowledge note deletion" },
    })
    await expect(deleteMultipleKnowledgeNotesAction({ ids: [] }, options)).resolves.toEqual({
      statusCode: 400,
      body: { error: "ids must be a non-empty array of strings" },
    })
    await expect(deleteMultipleKnowledgeNotesAction({ ids: ["note-1"] }, options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to delete note note-1" },
    })
    await expect(deleteAllKnowledgeNotesAction(options)).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to delete all notes" },
    })
  })

  it("logs shared knowledge note route failures and returns route errors", async () => {
    const caughtFailure = new Error("storage failed")
    const loggedErrors: unknown[] = []
    const diagnostics = {
      logError: (source: string, message: string, caughtError: unknown) => {
        loggedErrors.push({ source, message, caughtError })
      },
    }

    await expect(getKnowledgeNotesAction(undefined, {
      diagnostics,
      service: {
        getAllNotes: () => {
          throw caughtFailure
        },
        getNote: () => undefined,
        searchNotes: () => {
          throw new Error("unexpected search")
        },
        deleteNote: () => false,
        deleteMultipleNotes: () => ({ deletedCount: 0 }),
        deleteAllNotes: () => ({ deletedCount: 0 }),
        createNote: () => {
          throw new Error("unexpected create")
        },
        saveNote: () => false,
        updateNote: () => false,
      },
    })).resolves.toEqual({
      statusCode: 500,
      body: { error: "Failed to get knowledge notes" },
    })
    expect(loggedErrors).toEqual([
      {
        source: "knowledge-note-actions",
        message: "Failed to get knowledge notes",
        caughtError: caughtFailure,
      },
    ])
  })
})
