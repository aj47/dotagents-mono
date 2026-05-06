export type KnowledgeNoteContext = 'auto' | 'search-only';

export type KnowledgeNoteEntryType = 'note' | 'entry' | 'overview';

export type KnowledgeNoteSort =
  | 'relevance'
  | 'updated-desc'
  | 'updated-asc'
  | 'created-desc'
  | 'created-asc'
  | 'title-asc'
  | 'title-desc';

export type KnowledgeNoteDateFilter = 'all' | '7d' | '30d' | '90d' | 'year';

export interface KnowledgeNote {
  id: string;
  title: string;
  context: KnowledgeNoteContext;
  body: string;
  summary?: string;
  tags: string[];
  references?: string[];
  createdAt?: number;
  updatedAt: number;
  group?: string;
  series?: string;
  entryType?: KnowledgeNoteEntryType;
}
