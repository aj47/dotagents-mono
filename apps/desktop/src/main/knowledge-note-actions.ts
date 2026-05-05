import {
  createKnowledgeNoteAction,
  deleteKnowledgeNoteAction,
  getKnowledgeNoteAction,
  getKnowledgeNotesAction,
  updateKnowledgeNoteAction,
  type KnowledgeNoteActionOptions,
} from "@dotagents/shared/knowledge-note-form"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { knowledgeNotesService } from "./knowledge-notes-service"

export type KnowledgeNoteActionResult = MobileApiActionResult

const knowledgeNoteActionOptions: KnowledgeNoteActionOptions = {
  service: {
    getAllNotes: () => knowledgeNotesService.getAllNotes(),
    getNote: (id) => knowledgeNotesService.getNote(id),
    deleteNote: (id) => knowledgeNotesService.deleteNote(id),
    createNote: (request) => knowledgeNotesService.createNote(request),
    saveNote: (note) => knowledgeNotesService.saveNote(note),
    updateNote: (id, request) => knowledgeNotesService.updateNote(id, request),
  },
  diagnostics: diagnosticsService,
}

export async function getKnowledgeNotes(): Promise<KnowledgeNoteActionResult> {
  return getKnowledgeNotesAction(knowledgeNoteActionOptions)
}

export async function getKnowledgeNote(id: string | undefined): Promise<KnowledgeNoteActionResult> {
  return getKnowledgeNoteAction(id, knowledgeNoteActionOptions)
}

export async function deleteKnowledgeNote(id: string | undefined): Promise<KnowledgeNoteActionResult> {
  return deleteKnowledgeNoteAction(id, knowledgeNoteActionOptions)
}

export async function createKnowledgeNote(body: unknown): Promise<KnowledgeNoteActionResult> {
  return createKnowledgeNoteAction(body, knowledgeNoteActionOptions)
}

export async function updateKnowledgeNote(
  id: string | undefined,
  body: unknown,
): Promise<KnowledgeNoteActionResult> {
  return updateKnowledgeNoteAction(id, body, knowledgeNoteActionOptions)
}
