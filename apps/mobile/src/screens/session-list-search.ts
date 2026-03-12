import { sanitizeSessionText } from '@dotagents/shared';

import { sessionToListItem, type Session, type SessionListItem } from '../types/session';

export type SessionSearchResult = SessionListItem & {
  matchedField?: 'title' | 'preview' | 'message';
  searchPreview?: string;
};

function normalizeSearchValue(value: string): string {
  return sanitizeSessionText(value).toLowerCase();
}

function createSearchSnippet(text: string, normalizedQuery: string, maxLength: number = 140): string {
  const sanitized = sanitizeSessionText(text);
  if (!sanitized) return '';

  const normalizedText = sanitized.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedQuery);
  if (matchIndex < 0 || sanitized.length <= maxLength) {
    return sanitized.slice(0, maxLength);
  }

  const contextRadius = Math.max(24, Math.floor((maxLength - normalizedQuery.length) / 2));
  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(sanitized.length, matchIndex + normalizedQuery.length + contextRadius);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < sanitized.length ? '…' : '';
  return `${prefix}${sanitized.slice(start, end).trim()}${suffix}`;
}

function findSearchMatch(session: Session, normalizedQuery: string): Omit<SessionSearchResult, keyof SessionListItem> | null {
  const listItem = sessionToListItem(session);

  if (normalizeSearchValue(listItem.title).includes(normalizedQuery)) {
    return { matchedField: 'title' };
  }

  if (normalizeSearchValue(listItem.preview).includes(normalizedQuery)) {
    return {
      matchedField: 'preview',
      searchPreview: createSearchSnippet(listItem.preview, normalizedQuery),
    };
  }

  for (let index = session.messages.length - 1; index >= 0; index -= 1) {
    const message = session.messages[index];
    if (!normalizeSearchValue(message.content).includes(normalizedQuery)) continue;

    return {
      matchedField: 'message',
      searchPreview: createSearchSnippet(message.content, normalizedQuery),
    };
  }

  return null;
}

export function filterSessionSearchResults(sessions: Session[], searchQuery: string): SessionSearchResult[] {
  const normalizedQuery = normalizeSearchValue(searchQuery);
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  if (!normalizedQuery) {
    return sortedSessions.map(sessionToListItem);
  }

  return sortedSessions.flatMap((session) => {
    const listItem = sessionToListItem(session);
    const match = findSearchMatch(session, normalizedQuery);
    if (!match) return [];
    return [{ ...listItem, ...match }];
  });
}