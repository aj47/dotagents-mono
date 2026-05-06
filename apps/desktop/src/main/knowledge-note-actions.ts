import {
  createKnowledgeNoteAction,
  deleteAllKnowledgeNotesAction,
  deleteKnowledgeNoteAction,
  deleteMultipleKnowledgeNotesAction,
  getKnowledgeNoteAction,
  getKnowledgeNotesAction,
  searchKnowledgeNotesAction,
  updateKnowledgeNoteAction,
  type KnowledgeNoteActionOptions,
} from "@dotagents/shared/knowledge-note-form"
import type { MobileApiActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { diagnosticsService } from "./diagnostics"
import { knowledgeNotesService } from "./knowledge-notes-service"

export type KnowledgeNoteActionResult = MobileApiActionResult

const knowledgeNoteActionOptions: KnowledgeNoteActionOptions = {
  service: {
    getAllNotes: (filter) => knowledgeNotesService.getAllNotes(filter),
    getNote: (id) => knowledgeNotesService.getNote(id),
    searchNotes: (query, filter) => knowledgeNotesService.searchNotes(query, filter),
    deleteNote: (id) => knowledgeNotesService.deleteNote(id),
    deleteMultipleNotes: (ids) => knowledgeNotesService.deleteMultipleNotes(ids),
    deleteAllNotes: () => knowledgeNotesService.deleteAllNotes(),
    createNote: (request) => knowledgeNotesService.createNote(request),
    saveNote: (note) => knowledgeNotesService.saveNote(note),
    updateNote: (id, request) => knowledgeNotesService.updateNote(id, request),
  },
  diagnostics: diagnosticsService,
}

export async function getKnowledgeNotes(query?: unknown): Promise<KnowledgeNoteActionResult> {
  return getKnowledgeNotesAction(query, knowledgeNoteActionOptions)
}

export async function getKnowledgeNote(id: string | undefined): Promise<KnowledgeNoteActionResult> {
  return getKnowledgeNoteAction(id, knowledgeNoteActionOptions)
}

export async function searchKnowledgeNotes(body: unknown): Promise<KnowledgeNoteActionResult> {
  return searchKnowledgeNotesAction(body, knowledgeNoteActionOptions)
}

export async function deleteKnowledgeNote(id: string | undefined): Promise<KnowledgeNoteActionResult> {
  return deleteKnowledgeNoteAction(id, knowledgeNoteActionOptions)
}

export async function deleteMultipleKnowledgeNotes(body: unknown): Promise<KnowledgeNoteActionResult> {
  return deleteMultipleKnowledgeNotesAction(body, knowledgeNoteActionOptions)
}

export async function deleteAllKnowledgeNotes(): Promise<KnowledgeNoteActionResult> {
  return deleteAllKnowledgeNotesAction(knowledgeNoteActionOptions)
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
