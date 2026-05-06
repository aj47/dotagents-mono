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

export type KnowledgeNoteIdSuffixGenerator = () => string;

export function slugifyKnowledgeNoteId(value: string, maxLength = 64): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

export function createReadableKnowledgeNoteId(
  candidates: Array<string | null | undefined>,
  createSuffix: KnowledgeNoteIdSuffixGenerator,
): string {
  const base = candidates
    .map((value) => slugifyKnowledgeNoteId(value ?? ''))
    .find(Boolean) || 'note';
  return `${base}-${createSuffix()}`;
}
