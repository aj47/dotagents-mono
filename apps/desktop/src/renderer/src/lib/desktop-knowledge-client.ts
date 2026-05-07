import type {
  KnowledgeNote,
  KnowledgeNoteContext,
  KnowledgeNoteDateFilter,
  KnowledgeNoteSort,
} from "@dotagents/shared/knowledge-note-domain"
import type { KnowledgeNotesOverview } from "@dotagents/shared/knowledge-note-grouping"
import { tipcClient } from "@renderer/lib/tipc-client"

export interface DesktopKnowledgeNotesFilter {
  context?: KnowledgeNoteContext
  dateFilter?: KnowledgeNoteDateFilter
  sort?: KnowledgeNoteSort
  limit?: number
}

export interface DesktopKnowledgeNotesOverviewFilter {
  context?: KnowledgeNoteContext
  dateFilter?: KnowledgeNoteDateFilter
}

export interface DesktopKnowledgeNotesGroupFilter extends DesktopKnowledgeNotesFilter {
  groupKey: string
  seriesKey?: string
}

export interface DesktopKnowledgeNotesSearchRequest extends DesktopKnowledgeNotesFilter {
  query: string
}

export interface DesktopKnowledgeNoteUpdateRequest {
  id: string
  updates: Partial<Omit<KnowledgeNote, "id" | "createdAt">>
}

export interface DesktopKnowledgeFolderActionResult {
  success: boolean
  error?: string
}

export const desktopKnowledgeClient = {
  getOverview(filter: DesktopKnowledgeNotesOverviewFilter): Promise<KnowledgeNotesOverview> {
    return tipcClient.getKnowledgeNotesOverview(filter) as Promise<KnowledgeNotesOverview>
  },

  getNotesByGroup(filter: DesktopKnowledgeNotesGroupFilter): Promise<KnowledgeNote[]> {
    return tipcClient.getKnowledgeNotesByGroup(filter) as Promise<KnowledgeNote[]>
  },

  getAllNotes(filter: DesktopKnowledgeNotesFilter): Promise<KnowledgeNote[]> {
    return tipcClient.getAllKnowledgeNotes(filter) as Promise<KnowledgeNote[]>
  },

  searchNotes(request: DesktopKnowledgeNotesSearchRequest): Promise<KnowledgeNote[]> {
    return tipcClient.searchKnowledgeNotes(request) as Promise<KnowledgeNote[]>
  },

  updateNote(request: DesktopKnowledgeNoteUpdateRequest): Promise<boolean> {
    return tipcClient.updateKnowledgeNote(request) as Promise<boolean>
  },

  deleteNote(id: string): Promise<boolean> {
    return tipcClient.deleteKnowledgeNote({ id }) as Promise<boolean>
  },

  deleteMultipleNotes(ids: string[]): Promise<number> {
    return tipcClient.deleteMultipleKnowledgeNotes({ ids }) as Promise<number>
  },

  deleteAllNotes(): Promise<number> {
    return tipcClient.deleteAllKnowledgeNotes() as Promise<number>
  },

  openKnowledgeFolder(): Promise<DesktopKnowledgeFolderActionResult> {
    return tipcClient.openKnowledgeFolder() as Promise<DesktopKnowledgeFolderActionResult>
  },

  openWorkspaceKnowledgeFolder(): Promise<DesktopKnowledgeFolderActionResult> {
    return tipcClient.openWorkspaceKnowledgeFolder() as Promise<DesktopKnowledgeFolderActionResult>
  },
}
