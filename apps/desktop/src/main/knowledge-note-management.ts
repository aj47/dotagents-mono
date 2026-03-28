import type {
  AgentStepSummary,
  KnowledgeNote,
  KnowledgeNoteContext,
} from "@shared/types"
import { knowledgeNotesService } from "./knowledge-notes-service"

export type ManagedKnowledgeNoteErrorCode =
  | "invalid_input"
  | "not_found"
  | "persist_failed"
  | "load_failed"

type ManagedKnowledgeNoteFailure = {
  success: false
  errorCode: ManagedKnowledgeNoteErrorCode
  error: string
}

type ManagedKnowledgeNoteSuccess<T> = {
  success: true
} & T

export type ManagedKnowledgeNoteMutationResult<T> =
  | ManagedKnowledgeNoteSuccess<T>
  | ManagedKnowledgeNoteFailure

type ParseFailure = {
  ok: false
  errorCode: ManagedKnowledgeNoteErrorCode
  error: string
}

type ParseResult<T> = { ok: true; value: T } | ParseFailure

export type ManagedKnowledgeNoteCreateInput = {
  id?: unknown
  title?: unknown
  body?: unknown
  summary?: unknown
  context?: unknown
  tags?: unknown
  references?: unknown
}

export type ManagedKnowledgeNoteUpdateInput = {
  title?: unknown
  body?: unknown
  summary?: unknown
  context?: unknown
  tags?: unknown
  references?: unknown
}

function createFailure(
  errorCode: ManagedKnowledgeNoteErrorCode,
  error: string,
): ManagedKnowledgeNoteFailure {
  return { success: false, errorCode, error }
}

function createParseFailure(
  errorCode: ManagedKnowledgeNoteErrorCode,
  error: string,
): ParseFailure {
  return { ok: false, errorCode, error }
}

function isParseFailure<T>(result: ParseResult<T>): result is ParseFailure {
  return result.ok === false
}

export function isManagedKnowledgeNoteFailure<T>(
  result: ManagedKnowledgeNoteMutationResult<T>,
): result is ManagedKnowledgeNoteFailure {
  return result.success === false
}

function serializeManagedKnowledgeNote(note: KnowledgeNote): KnowledgeNote {
  return {
    ...note,
    tags: [...note.tags],
    references: note.references ? [...note.references] : undefined,
  }
}

function normalizeOptionalString(
  value: unknown,
  options: {
    fieldName: string
    allowEmpty?: boolean
  },
): ParseResult<string | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined }
  }

  if (typeof value !== "string") {
    return createParseFailure(
      "invalid_input",
      `${options.fieldName} must be a string when provided`,
    )
  }

  const normalized = value.trim()
  if (!normalized && !options.allowEmpty) {
    return createParseFailure(
      "invalid_input",
      `${options.fieldName} must be a non-empty string when provided`,
    )
  }

  return { ok: true, value: normalized || undefined }
}

function normalizeOptionalContext(
  value: unknown,
): ParseResult<KnowledgeNoteContext | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined }
  }

  if (value === "auto" || value === "search-only") {
    return { ok: true, value }
  }

  return createParseFailure(
    "invalid_input",
    "context must be one of: auto, search-only",
  )
}

function normalizeCreateStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeUpdateStringArray(
  value: unknown,
  fieldName: string,
): ParseResult<string[] | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined }
  }

  if (
    !Array.isArray(value) ||
    !value.every((item): item is string => typeof item === "string")
  ) {
    return createParseFailure(
      "invalid_input",
      `${fieldName} must be an array of strings when provided`,
    )
  }

  return {
    ok: true,
    value: value.map((item) => item.trim()).filter(Boolean),
  }
}

export async function getManagedKnowledgeNotes(): Promise<KnowledgeNote[]> {
  return (await knowledgeNotesService.getAllNotes()).map(
    serializeManagedKnowledgeNote,
  )
}

export async function getManagedKnowledgeNote(
  id: string,
): Promise<KnowledgeNote | null> {
  const note = await knowledgeNotesService.getNote(id)
  return note ? serializeManagedKnowledgeNote(note) : null
}

export async function searchManagedKnowledgeNotes(
  query: string,
): Promise<KnowledgeNote[]> {
  return (await knowledgeNotesService.searchNotes(query)).map(
    serializeManagedKnowledgeNote,
  )
}

export async function saveManagedKnowledgeNoteFromSummary(input: {
  summary: AgentStepSummary
  title?: string
  userNotes?: string
  tags?: string[]
  conversationTitle?: string
  conversationId?: string
}): Promise<
  | { success: true; note: KnowledgeNote | null; reason?: "no_durable_content" }
  | { success: false; note: null; reason: "persist_failed" }
> {
  const note = knowledgeNotesService.createNoteFromSummary(
    input.summary,
    input.title,
    input.userNotes,
    input.tags,
    input.conversationTitle,
    input.conversationId,
  )

  if (!note) {
    return {
      success: true,
      note: null,
      reason: "no_durable_content",
    }
  }

  const success = await knowledgeNotesService.saveNote(note)
  if (!success) {
    return {
      success: false,
      note: null,
      reason: "persist_failed",
    }
  }

  const savedNote = await knowledgeNotesService.getNote(note.id)
  return {
    success: true,
    note: savedNote
      ? serializeManagedKnowledgeNote(savedNote)
      : serializeManagedKnowledgeNote(note),
  }
}

export async function saveManagedKnowledgeNote(
  note: KnowledgeNote,
): Promise<ManagedKnowledgeNoteMutationResult<{ note: KnowledgeNote }>> {
  const success = await knowledgeNotesService.saveNote(note)
  if (!success) {
    return createFailure("persist_failed", "Failed to save knowledge note")
  }

  const savedNote = await knowledgeNotesService.getNote(note.id)
  if (!savedNote) {
    return createFailure("load_failed", "Failed to load saved knowledge note")
  }

  return {
    success: true,
    note: serializeManagedKnowledgeNote(savedNote),
  }
}

export async function createManagedKnowledgeNote(
  input: ManagedKnowledgeNoteCreateInput,
): Promise<ManagedKnowledgeNoteMutationResult<{ note: KnowledgeNote }>> {
  const body = typeof input.body === "string" ? input.body.trim() : ""
  if (!body) {
    return createFailure(
      "invalid_input",
      "body is required and must be a non-empty string",
    )
  }

  const titleResult = normalizeOptionalString(input.title, {
    fieldName: "title",
    allowEmpty: true,
  })
  if (isParseFailure(titleResult)) {
    return createFailure(titleResult.errorCode, titleResult.error)
  }

  const summaryResult = normalizeOptionalString(input.summary, {
    fieldName: "summary",
    allowEmpty: true,
  })
  if (isParseFailure(summaryResult)) {
    return createFailure(summaryResult.errorCode, summaryResult.error)
  }

  const contextResult = normalizeOptionalContext(input.context)
  if (isParseFailure(contextResult)) {
    return createFailure(contextResult.errorCode, contextResult.error)
  }

  const note = knowledgeNotesService.createNote({
    id:
      typeof input.id === "string" && input.id.trim()
        ? input.id.trim()
        : undefined,
    title: titleResult.value,
    body,
    summary: summaryResult.value,
    context: contextResult.value ?? "search-only",
    tags: normalizeCreateStringArray(input.tags),
    references: normalizeCreateStringArray(input.references),
  })

  return saveManagedKnowledgeNote(note)
}

export async function updateManagedKnowledgeNote(
  id: string,
  updates: ManagedKnowledgeNoteUpdateInput,
): Promise<ManagedKnowledgeNoteMutationResult<{ note: KnowledgeNote }>> {
  const existing = await knowledgeNotesService.getNote(id)
  if (!existing) {
    return createFailure("not_found", "Knowledge note not found")
  }

  const titleResult = normalizeOptionalString(updates.title, {
    fieldName: "title",
    allowEmpty: false,
  })
  if (isParseFailure(titleResult)) {
    return createFailure(titleResult.errorCode, titleResult.error)
  }

  const bodyResult = normalizeOptionalString(updates.body, {
    fieldName: "body",
    allowEmpty: false,
  })
  if (isParseFailure(bodyResult)) {
    return createFailure(bodyResult.errorCode, bodyResult.error)
  }

  const summaryResult = normalizeOptionalString(updates.summary, {
    fieldName: "summary",
    allowEmpty: true,
  })
  if (isParseFailure(summaryResult)) {
    return createFailure(summaryResult.errorCode, summaryResult.error)
  }

  const contextResult = normalizeOptionalContext(updates.context)
  if (isParseFailure(contextResult)) {
    return createFailure(contextResult.errorCode, contextResult.error)
  }

  const tagsResult = normalizeUpdateStringArray(updates.tags, "tags")
  if (isParseFailure(tagsResult)) {
    return createFailure(tagsResult.errorCode, tagsResult.error)
  }

  const referencesResult = normalizeUpdateStringArray(
    updates.references,
    "references",
  )
  if (isParseFailure(referencesResult)) {
    return createFailure(referencesResult.errorCode, referencesResult.error)
  }

  const saveSucceeded = await knowledgeNotesService.updateNote(id, {
    ...(titleResult.value !== undefined ? { title: titleResult.value } : {}),
    ...(bodyResult.value !== undefined ? { body: bodyResult.value } : {}),
    ...(updates.summary !== undefined ? { summary: summaryResult.value } : {}),
    ...(contextResult.value !== undefined
      ? { context: contextResult.value }
      : {}),
    ...(tagsResult.value !== undefined ? { tags: tagsResult.value } : {}),
    ...(referencesResult.value !== undefined
      ? { references: referencesResult.value }
      : {}),
  })

  if (!saveSucceeded) {
    return createFailure("persist_failed", "Failed to update knowledge note")
  }

  const updatedNote = await knowledgeNotesService.getNote(id)
  if (!updatedNote) {
    return createFailure("load_failed", "Failed to load updated knowledge note")
  }

  return {
    success: true,
    note: serializeManagedKnowledgeNote(updatedNote),
  }
}

export async function deleteManagedKnowledgeNote(
  id: string,
): Promise<ManagedKnowledgeNoteMutationResult<{ id: string }>> {
  const existing = await knowledgeNotesService.getNote(id)
  if (!existing) {
    return createFailure("not_found", "Knowledge note not found")
  }

  const success = await knowledgeNotesService.deleteNote(id)
  if (!success) {
    return createFailure(
      "persist_failed",
      "Failed to persist knowledge note deletion",
    )
  }

  return {
    success: true,
    id,
  }
}

export async function deleteMultipleManagedKnowledgeNotes(
  ids: string[],
): Promise<ManagedKnowledgeNoteMutationResult<{ deletedCount: number }>> {
  const result = await knowledgeNotesService.deleteMultipleNotes(ids)
  if (result.error) {
    return createFailure("persist_failed", result.error)
  }

  return {
    success: true,
    deletedCount: result.deletedCount,
  }
}

export async function deleteAllManagedKnowledgeNotes(): Promise<
  ManagedKnowledgeNoteMutationResult<{ deletedCount: number }>
> {
  const result = await knowledgeNotesService.deleteAllNotes()
  if (result.error) {
    return createFailure("persist_failed", result.error)
  }

  return {
    success: true,
    deletedCount: result.deletedCount,
  }
}
