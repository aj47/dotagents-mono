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

export type KnowledgeNoteActionResult = {
  statusCode: number
  body: unknown
}

type KnowledgeNoteMaybePromise<T> = T | Promise<T>

export interface KnowledgeNoteActionDiagnostics {
  logError(source: string, message: string, error: unknown): void
}

export interface KnowledgeNoteActionService {
  getAllNotes(): KnowledgeNoteMaybePromise<KnowledgeNote[]>
  getNote(id: string): KnowledgeNoteMaybePromise<KnowledgeNote | null | undefined>
  deleteNote(id: string): KnowledgeNoteMaybePromise<boolean>
  createNote(request: KnowledgeNoteCreateRequest): KnowledgeNote
  saveNote(note: KnowledgeNote): KnowledgeNoteMaybePromise<boolean>
  updateNote(id: string, request: KnowledgeNoteUpdateRequest): KnowledgeNoteMaybePromise<boolean>
}

export interface KnowledgeNoteActionOptions {
  service: KnowledgeNoteActionService
  diagnostics: KnowledgeNoteActionDiagnostics
}

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

function knowledgeNoteActionOk(body: unknown, statusCode = 200): KnowledgeNoteActionResult {
  return {
    statusCode,
    body,
  }
}

function knowledgeNoteActionError(statusCode: number, message: string): KnowledgeNoteActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

function getUnknownErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return fallback
}

export async function getKnowledgeNotesAction(
  options: KnowledgeNoteActionOptions,
): Promise<KnowledgeNoteActionResult> {
  try {
    const notes = await options.service.getAllNotes()
    return knowledgeNoteActionOk(buildKnowledgeNotesResponse(notes))
  } catch (caughtError) {
    options.diagnostics.logError("knowledge-note-actions", "Failed to get knowledge notes", caughtError)
    return knowledgeNoteActionError(500, "Failed to get knowledge notes")
  }
}

export async function getKnowledgeNoteAction(
  id: string | undefined,
  options: KnowledgeNoteActionOptions,
): Promise<KnowledgeNoteActionResult> {
  try {
    const note = await options.service.getNote(id ?? "")
    if (!note) {
      return knowledgeNoteActionError(404, "Knowledge note not found")
    }

    return knowledgeNoteActionOk(buildKnowledgeNoteResponse(note))
  } catch (caughtError) {
    options.diagnostics.logError("knowledge-note-actions", "Failed to get knowledge note", caughtError)
    return knowledgeNoteActionError(500, getUnknownErrorMessage(caughtError, "Failed to get knowledge note"))
  }
}

export async function deleteKnowledgeNoteAction(
  id: string | undefined,
  options: KnowledgeNoteActionOptions,
): Promise<KnowledgeNoteActionResult> {
  try {
    const noteId = id ?? ""
    const note = await options.service.getNote(noteId)
    if (!note) {
      return knowledgeNoteActionError(404, "Knowledge note not found")
    }

    const success = await options.service.deleteNote(noteId)
    if (!success) {
      return knowledgeNoteActionError(500, "Failed to persist knowledge note deletion")
    }

    return knowledgeNoteActionOk(buildKnowledgeNoteDeleteResponse(noteId))
  } catch (caughtError) {
    options.diagnostics.logError("knowledge-note-actions", "Failed to delete knowledge note", caughtError)
    return knowledgeNoteActionError(500, getUnknownErrorMessage(caughtError, "Failed to delete knowledge note"))
  }
}

export async function createKnowledgeNoteAction(
  body: unknown,
  options: KnowledgeNoteActionOptions,
): Promise<KnowledgeNoteActionResult> {
  try {
    const parsedRequest = parseKnowledgeNoteCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return knowledgeNoteActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const note = options.service.createNote(parsedRequest.request)

    const success = await options.service.saveNote(note)
    if (!success) {
      return knowledgeNoteActionError(500, "Failed to save knowledge note")
    }

    const savedNote = await options.service.getNote(note.id)
    if (!savedNote) {
      return knowledgeNoteActionError(500, "Failed to load saved knowledge note")
    }

    return knowledgeNoteActionOk(buildKnowledgeNoteResponse(savedNote), 201)
  } catch (caughtError) {
    options.diagnostics.logError("knowledge-note-actions", "Failed to create knowledge note", caughtError)
    return knowledgeNoteActionError(500, getUnknownErrorMessage(caughtError, "Failed to create knowledge note"))
  }
}

export async function updateKnowledgeNoteAction(
  id: string | undefined,
  body: unknown,
  options: KnowledgeNoteActionOptions,
): Promise<KnowledgeNoteActionResult> {
  try {
    const parsedRequest = parseKnowledgeNoteUpdateRequestBody(body)
    if (parsedRequest.ok === false) {
      return knowledgeNoteActionError(parsedRequest.statusCode, parsedRequest.error)
    }

    const noteId = id ?? ""
    const existing = await options.service.getNote(noteId)
    if (!existing) {
      return knowledgeNoteActionError(404, "Knowledge note not found")
    }

    const success = await options.service.updateNote(noteId, parsedRequest.request)
    if (!success) {
      return knowledgeNoteActionError(500, "Failed to update knowledge note")
    }

    const updated = await options.service.getNote(noteId)
    if (!updated) {
      return knowledgeNoteActionError(500, "Failed to load updated knowledge note")
    }

    return knowledgeNoteActionOk(buildKnowledgeNoteMutationResponse(updated))
  } catch (caughtError) {
    options.diagnostics.logError("knowledge-note-actions", "Failed to update knowledge note", caughtError)
    return knowledgeNoteActionError(500, getUnknownErrorMessage(caughtError, "Failed to update knowledge note"))
  }
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
