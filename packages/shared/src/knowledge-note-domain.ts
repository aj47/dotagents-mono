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
export type NormalizeKnowledgeNoteForStorageOptions = {
  now?: number;
  createSuffix?: KnowledgeNoteIdSuffixGenerator;
};
export type KnowledgeNoteSearchIndexEntry = {
  note: KnowledgeNote;
  title: string;
  summary: string;
  body: string;
  tags: string;
  metadata: string;
  allText: string;
};

const VALID_CONTEXT_VALUES = new Set<KnowledgeNoteContext>(['auto', 'search-only']);
const VALID_ENTRY_TYPE_VALUES = new Set<KnowledgeNoteEntryType>(['note', 'entry', 'overview']);
const LEGACY_NOTE_META_PREFIX = '<!-- dotagents-memory-meta:';
const DAY_MS = 24 * 60 * 60 * 1000;

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

export function normalizeKnowledgeNoteSingleLine(text: string | undefined | null): string {
  return (text ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeKnowledgeNoteStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeKnowledgeNotePathValue(value: string | undefined | null): string | undefined {
  const normalized = (value ?? '')
    .trim()
    .replace(/\\+/g, '/')
    .split('/')
    .map(normalizeKnowledgeNoteSingleLine)
    .filter(Boolean)
    .join('/');

  return normalized || undefined;
}

export function titleizeKnowledgeNotePath(value: string): string {
  return value
    .split('/')
    .map((segment) =>
      segment
        .split(/[-_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    )
    .join(' / ');
}

export function stripLegacyKnowledgeNoteMetadata(body: string): string {
  const trimmed = body.trim();
  const prefixIndex = trimmed.lastIndexOf(LEGACY_NOTE_META_PREFIX);
  if (prefixIndex < 0) return trimmed;

  const suffixIndex = trimmed.indexOf('-->', prefixIndex);
  if (suffixIndex < 0) return trimmed;

  return trimmed.slice(0, prefixIndex).trim();
}

function createDefaultKnowledgeNoteIdSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function normalizeKnowledgeNoteForStorage(
  note: KnowledgeNote,
  options: NormalizeKnowledgeNoteForStorageOptions = {},
): KnowledgeNote {
  const now = options.now ?? Date.now();
  const createSuffix = options.createSuffix ?? createDefaultKnowledgeNoteIdSuffix;
  const providedId = normalizeKnowledgeNoteSingleLine(note.id ?? '');
  const id = providedId
    || slugifyKnowledgeNoteId(note.title || 'note')
    || createReadableKnowledgeNoteId([note.title, note.summary], createSuffix);
  const visibleBody = stripLegacyKnowledgeNoteMetadata(note.body ?? '');
  const title = normalizeKnowledgeNoteSingleLine(note.title || visibleBody || note.summary || id).slice(0, 120) || id;
  const context = VALID_CONTEXT_VALUES.has(note.context) ? note.context : 'search-only';
  const createdAt = typeof note.createdAt === 'number' && Number.isFinite(note.createdAt) ? note.createdAt : now;
  const updatedAt = typeof note.updatedAt === 'number' && Number.isFinite(note.updatedAt) ? note.updatedAt : createdAt;
  const summary = normalizeKnowledgeNoteSingleLine(note.summary ?? '') || undefined;
  const body = visibleBody || summary || title;
  const group = normalizeKnowledgeNotePathValue(note.group);
  const series = normalizeKnowledgeNotePathValue(note.series);
  const entryType = VALID_ENTRY_TYPE_VALUES.has(note.entryType as KnowledgeNoteEntryType)
    ? note.entryType
    : undefined;
  const references = Array.from(new Set(normalizeKnowledgeNoteStringArray(note.references)));

  return {
    id,
    title,
    context,
    createdAt,
    updatedAt,
    tags: Array.from(new Set(normalizeKnowledgeNoteStringArray(note.tags))),
    body,
    summary,
    group,
    series,
    entryType,
    references: references.length > 0 ? references : undefined,
  };
}

export function toPublicKnowledgeNote(note: KnowledgeNote): KnowledgeNote {
  return {
    ...note,
    body: stripLegacyKnowledgeNoteMetadata(note.body ?? ''),
  };
}

export function getKnowledgeNoteTimestamp(note: KnowledgeNote, field: 'updated' | 'created'): number {
  const fallback = typeof note.updatedAt === 'number' && Number.isFinite(note.updatedAt) ? note.updatedAt : 0;
  if (field === 'updated') return fallback;
  return typeof note.createdAt === 'number' && Number.isFinite(note.createdAt) ? note.createdAt : fallback;
}

export function matchesKnowledgeNoteDateFilter(
  note: KnowledgeNote,
  filter: KnowledgeNoteDateFilter | undefined,
  now = Date.now(),
): boolean {
  if (!filter || filter === 'all') return true;
  const updatedAt = getKnowledgeNoteTimestamp(note, 'updated');
  const ageMs = now - updatedAt;
  if (ageMs < 0) return true;
  if (filter === '7d') return ageMs <= 7 * DAY_MS;
  if (filter === '30d') return ageMs <= 30 * DAY_MS;
  if (filter === '90d') return ageMs <= 90 * DAY_MS;
  if (filter === 'year') return ageMs <= 365 * DAY_MS;
  return true;
}

export function sortKnowledgeNotes(
  notes: KnowledgeNote[],
  sort: KnowledgeNoteSort | undefined,
  relevanceScores?: Map<string, number>,
): KnowledgeNote[] {
  const effectiveSort = sort ?? 'updated-desc';
  return [...notes].sort((a, b) => {
    if (effectiveSort === 'relevance') {
      const scoreDiff = (relevanceScores?.get(b.id) ?? 0) - (relevanceScores?.get(a.id) ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return getKnowledgeNoteTimestamp(b, 'updated') - getKnowledgeNoteTimestamp(a, 'updated');
    }
    if (effectiveSort === 'updated-asc') return getKnowledgeNoteTimestamp(a, 'updated') - getKnowledgeNoteTimestamp(b, 'updated');
    if (effectiveSort === 'created-desc') return getKnowledgeNoteTimestamp(b, 'created') - getKnowledgeNoteTimestamp(a, 'created');
    if (effectiveSort === 'created-asc') return getKnowledgeNoteTimestamp(a, 'created') - getKnowledgeNoteTimestamp(b, 'created');
    if (effectiveSort === 'title-asc') return a.title.localeCompare(b.title);
    if (effectiveSort === 'title-desc') return b.title.localeCompare(a.title);
    return getKnowledgeNoteTimestamp(b, 'updated') - getKnowledgeNoteTimestamp(a, 'updated');
  });
}

export function normalizeKnowledgeNoteSearchText(text: string | undefined): string {
  return (text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildKnowledgeNoteSearchIndex(notes: KnowledgeNote[]): KnowledgeNoteSearchIndexEntry[] {
  return notes.map((rawNote) => {
    const note = toPublicKnowledgeNote(rawNote);
    const title = normalizeKnowledgeNoteSearchText(note.title);
    const summary = normalizeKnowledgeNoteSearchText(note.summary);
    const body = normalizeKnowledgeNoteSearchText(note.body);
    const tags = normalizeKnowledgeNoteSearchText(note.tags.join(' '));
    const metadata = normalizeKnowledgeNoteSearchText([
      note.id,
      note.context,
      note.group,
      note.series,
      note.entryType,
      ...(note.references ?? []),
    ].filter(Boolean).join(' '));

    return { note, title, summary, body, tags, metadata, allText: [title, tags, summary, metadata, body].join(' ') };
  });
}

function fuzzySubsequenceScore(text: string, token: string): number {
  if (token.length < 3 || !text) return 0;
  let tokenIndex = 0;
  let firstMatch = -1;
  let lastMatch = -1;
  for (let i = 0; i < text.length && tokenIndex < token.length; i++) {
    if (text[i] !== token[tokenIndex]) continue;
    if (firstMatch < 0) firstMatch = i;
    lastMatch = i;
    tokenIndex++;
  }
  if (tokenIndex < token.length || firstMatch < 0) return 0;
  const span = Math.max(1, lastMatch - firstMatch + 1);
  const density = token.length / span;
  return density >= 0.45 ? 0.35 + density * 0.35 : 0;
}

function tokenScore(field: string, token: string): number {
  if (!field || !token) return 0;
  if (field.split(' ').includes(token)) return 1.2;
  if (field.includes(token)) return 1;
  if (field.split(' ').some((word) => word.startsWith(token))) return 0.9;
  return fuzzySubsequenceScore(field, token);
}

export function scoreKnowledgeNoteSearchEntry(entry: KnowledgeNoteSearchIndexEntry, query: string): number {
  const normalizedQuery = normalizeKnowledgeNoteSearchText(query);
  if (!normalizedQuery) return 0;

  const tokens = Array.from(new Set(normalizedQuery.split(' ').filter(Boolean)));
  let score = entry.allText.includes(normalizedQuery) ? 8 : 0;
  let matchedTokens = 0;
  const fields: Array<[string, number]> = [
    [entry.title, 12],
    [entry.tags, 10],
    [entry.summary, 6],
    [entry.metadata, 4],
    [entry.body, 2],
  ];

  for (const token of tokens) {
    const best = fields.reduce((max, [field, weight]) => Math.max(max, tokenScore(field, token) * weight), 0);
    if (best > 0) matchedTokens++;
    score += best;
  }

  if (matchedTokens === tokens.length) return score;
  if (tokens.length > 2 && matchedTokens >= Math.ceil(tokens.length * 0.75) && score >= 8) return score * 0.75;
  return 0;
}
