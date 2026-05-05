import type {
  KnowledgeNote,
  KnowledgeNoteCreateRequest,
  KnowledgeNoteDeleteResponse,
  KnowledgeNoteMutationResponse,
  KnowledgeNoteResponse,
  KnowledgeNotesResponse,
  KnowledgeNoteUpdateRequest,
} from "./api-types"

export type KnowledgeNoteReferenceInputFormat = "comma" | "line"

export type KnowledgeNoteCreateParseResult =
  | { ok: true; request: KnowledgeNoteCreateRequest }
  | { ok: false; statusCode: 400; error: string }

export type KnowledgeNoteUpdateParseResult =
  | { ok: true; request: KnowledgeNoteUpdateRequest }
  | { ok: false; statusCode: 400; error: string }

function isRequestObject(body: unknown): body is Record<string, unknown> {
  return !!body && typeof body === "object" && !Array.isArray(body)
}

function stringArrayOrEmpty(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function uniqueTrimmed(parts: string[]): string[] {
  const values: string[] = []
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed && !values.includes(trimmed)) values.push(trimmed)
  }
  return values
}

export function formatKnowledgeNoteTagsInput(tags?: string[]): string {
  return tags?.join(", ") ?? ""
}

export function formatKnowledgeNoteReferencesInput(
  references?: string[],
  format: KnowledgeNoteReferenceInputFormat = "line",
): string {
  return references?.join(format === "comma" ? ", " : "\n") ?? ""
}

export function parseKnowledgeNoteTagsInput(input: string): string[] {
  return uniqueTrimmed(input.split(","))
}

export function parseKnowledgeNoteReferencesInput(input: string): string[] {
  return uniqueTrimmed(input.split(/[\n,]/))
}

export function serializeKnowledgeNoteForApi(note: KnowledgeNote): KnowledgeNote {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    summary: note.summary,
    context: note.context,
    tags: note.tags,
    references: note.references,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    group: note.group,
    series: note.series,
    entryType: note.entryType,
  }
}

export function buildKnowledgeNotesResponse(notes: KnowledgeNote[]): KnowledgeNotesResponse {
  return { notes: notes.map(serializeKnowledgeNoteForApi) }
}

export function buildKnowledgeNoteResponse(note: KnowledgeNote): KnowledgeNoteResponse {
  return { note: serializeKnowledgeNoteForApi(note) }
}

export function buildKnowledgeNoteMutationResponse(note: KnowledgeNote): KnowledgeNoteMutationResponse {
  return { success: true, note: serializeKnowledgeNoteForApi(note) }
}

export function buildKnowledgeNoteDeleteResponse(id: string): KnowledgeNoteDeleteResponse {
  return { success: true, id }
}

export function parseKnowledgeNoteCreateRequestBody(body: unknown): KnowledgeNoteCreateParseResult {
  if (!isRequestObject(body)) {
    return { ok: false, statusCode: 400, error: "Request body must be a JSON object" }
  }

  const noteBody = typeof body.body === "string" ? body.body.trim() : ""
  if (!noteBody) {
    return { ok: false, statusCode: 400, error: "body is required and must be a non-empty string" }
  }

  return {
    ok: true,
    request: {
      id: typeof body.id === "string" && body.id.trim() ? body.id.trim() : undefined,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined,
      body: noteBody,
      summary: typeof body.summary === "string" && body.summary.trim() ? body.summary.trim() : undefined,
      context: body.context === "auto" || body.context === "search-only" ? body.context : "search-only",
      tags: stringArrayOrEmpty(body.tags),
      references: stringArrayOrEmpty(body.references),
    },
  }
}

export function parseKnowledgeNoteUpdateRequestBody(body: unknown): KnowledgeNoteUpdateParseResult {
  if (!isRequestObject(body)) {
    return { ok: false, statusCode: 400, error: "Request body must be a JSON object" }
  }

  const request: KnowledgeNoteUpdateRequest = {}

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return { ok: false, statusCode: 400, error: "title must be a non-empty string when provided" }
    }
    request.title = body.title.trim()
  }
  if (body.body !== undefined) {
    if (typeof body.body !== "string" || body.body.trim() === "") {
      return { ok: false, statusCode: 400, error: "body must be a non-empty string when provided" }
    }
    request.body = body.body.trim()
  }
  if (body.summary !== undefined) {
    if (typeof body.summary !== "string") {
      return { ok: false, statusCode: 400, error: "summary must be a string when provided" }
    }
    request.summary = body.summary.trim() || undefined
  }
  if (body.context !== undefined) {
    if (body.context === "auto" || body.context === "search-only") {
      request.context = body.context
    } else {
      return { ok: false, statusCode: 400, error: "context must be one of: auto, search-only" }
    }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || !body.tags.every((tag): tag is string => typeof tag === "string")) {
      return { ok: false, statusCode: 400, error: "tags must be an array of strings when provided" }
    }
    request.tags = body.tags
  }
  if (body.references !== undefined) {
    if (!Array.isArray(body.references) || !body.references.every((ref): ref is string => typeof ref === "string")) {
      return { ok: false, statusCode: 400, error: "references must be an array of strings when provided" }
    }
    request.references = body.references
  }

  return { ok: true, request }
}
