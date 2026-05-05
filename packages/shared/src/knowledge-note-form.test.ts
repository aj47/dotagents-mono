import { describe, expect, it } from "vitest"
import type { KnowledgeNote } from "./api-types"

import {
  buildKnowledgeNoteDeleteResponse,
  buildKnowledgeNoteMutationResponse,
  buildKnowledgeNoteResponse,
  buildKnowledgeNotesResponse,
  formatKnowledgeNoteReferencesInput,
  formatKnowledgeNoteTagsInput,
  parseKnowledgeNoteCreateRequestBody,
  parseKnowledgeNoteReferencesInput,
  parseKnowledgeNoteTagsInput,
  parseKnowledgeNoteUpdateRequestBody,
  serializeKnowledgeNoteForApi,
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
  })
})
