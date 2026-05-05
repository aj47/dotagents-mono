import {
  buildKnowledgeNoteDeleteResponse,
  buildKnowledgeNoteMutationResponse,
  buildKnowledgeNoteResponse,
  buildKnowledgeNotesResponse,
  parseKnowledgeNoteCreateRequestBody,
  parseKnowledgeNoteUpdateRequestBody,
} from "@dotagents/shared/knowledge-note-form"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { knowledgeNotesService } from "./knowledge-notes-service"

export type KnowledgeNoteActionResult = MobileApiActionResult

function ok(body: unknown, statusCode = 200): KnowledgeNoteActionResult {
  return {
    statusCode,
    body,
  }
}

function error(statusCode: number, message: string): KnowledgeNoteActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export async function getKnowledgeNotes(): Promise<KnowledgeNoteActionResult> {
  try {
    const notes = await knowledgeNotesService.getAllNotes()
    return ok(buildKnowledgeNotesResponse(notes))
  } catch (caughtError) {
    diagnosticsService.logError("knowledge-note-actions", "Failed to get knowledge notes", caughtError)
    return error(500, "Failed to get knowledge notes")
  }
}

export async function getKnowledgeNote(id: string | undefined): Promise<KnowledgeNoteActionResult> {
  try {
    const note = await knowledgeNotesService.getNote(id ?? "")
    if (!note) {
      return error(404, "Knowledge note not found")
    }

    return ok(buildKnowledgeNoteResponse(note))
  } catch (caughtError: any) {
    diagnosticsService.logError("knowledge-note-actions", "Failed to get knowledge note", caughtError)
    return error(500, caughtError?.message || "Failed to get knowledge note")
  }
}

export async function deleteKnowledgeNote(id: string | undefined): Promise<KnowledgeNoteActionResult> {
  try {
    const note = await knowledgeNotesService.getNote(id ?? "")
    if (!note) {
      return error(404, "Knowledge note not found")
    }

    const success = await knowledgeNotesService.deleteNote(id ?? "")
    if (!success) {
      return error(500, "Failed to persist knowledge note deletion")
    }

    return ok(buildKnowledgeNoteDeleteResponse(id ?? ""))
  } catch (caughtError: any) {
    diagnosticsService.logError("knowledge-note-actions", "Failed to delete knowledge note", caughtError)
    return error(500, caughtError?.message || "Failed to delete knowledge note")
  }
}

export async function createKnowledgeNote(body: unknown): Promise<KnowledgeNoteActionResult> {
  try {
    const parsedRequest = parseKnowledgeNoteCreateRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const note = knowledgeNotesService.createNote(parsedRequest.request)

    const success = await knowledgeNotesService.saveNote(note)
    if (!success) {
      return error(500, "Failed to save knowledge note")
    }

    const savedNote = await knowledgeNotesService.getNote(note.id)
    if (!savedNote) {
      return error(500, "Failed to load saved knowledge note")
    }

    return ok(buildKnowledgeNoteResponse(savedNote), 201)
  } catch (caughtError: any) {
    diagnosticsService.logError("knowledge-note-actions", "Failed to create knowledge note", caughtError)
    return error(500, caughtError?.message || "Failed to create knowledge note")
  }
}

export async function updateKnowledgeNote(
  id: string | undefined,
  body: unknown,
): Promise<KnowledgeNoteActionResult> {
  try {
    const parsedRequest = parseKnowledgeNoteUpdateRequestBody(body)
    if (parsedRequest.ok === false) {
      return error(parsedRequest.statusCode, parsedRequest.error)
    }

    const existing = await knowledgeNotesService.getNote(id ?? "")
    if (!existing) {
      return error(404, "Knowledge note not found")
    }

    const success = await knowledgeNotesService.updateNote(
      id ?? "",
      parsedRequest.request,
    )
    if (!success) {
      return error(500, "Failed to update knowledge note")
    }

    const updated = await knowledgeNotesService.getNote(id ?? "")
    if (!updated) {
      return error(500, "Failed to load updated knowledge note")
    }

    return ok(buildKnowledgeNoteMutationResponse(updated))
  } catch (caughtError: any) {
    diagnosticsService.logError("knowledge-note-actions", "Failed to update knowledge note", caughtError)
    return error(500, caughtError?.message || "Failed to update knowledge note")
  }
}
