export type KnowledgeNoteContext = 'auto' | 'search-only';

export type KnowledgeNoteEntryType = 'note' | 'entry' | 'overview';

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
