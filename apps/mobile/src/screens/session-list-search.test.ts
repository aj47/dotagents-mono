import { describe, expect, it } from 'vitest';

import type { Session } from '../types/session';

import { filterSessionSearchResults, filterSessionsByArchiveMode } from './session-list-search';

function createSession(overrides: Partial<Session>): Session {
  return {
    id: overrides.id ?? 'session-default',
    title: overrides.title ?? 'Untitled',
    createdAt: overrides.createdAt ?? 1,
    updatedAt: overrides.updatedAt ?? 1,
    isPinned: overrides.isPinned,
    messages: overrides.messages ?? [],
    serverConversationId: overrides.serverConversationId,
    isArchived: overrides.isArchived,
    metadata: overrides.metadata,
    serverMetadata: overrides.serverMetadata,
  };
}

describe('filterSessionSearchResults', () => {
  it('returns all sessions in recency order when the query is empty', () => {
    const results = filterSessionSearchResults([
      createSession({ id: 'older', title: 'Older', updatedAt: 10 }),
      createSession({ id: 'newer', title: 'Newer', updatedAt: 20 }),
    ], '   ');

    expect(results.map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('keeps pinned chats above newer unpinned matches', () => {
    const results = filterSessionSearchResults([
      createSession({ id: 'fresh-unpinned', title: 'Project follow-up', updatedAt: 50 }),
      createSession({ id: 'older-pinned', title: 'Pinned project notes', updatedAt: 10, isPinned: true }),
    ], 'project');

    expect(results.map((item) => item.id)).toEqual(['older-pinned', 'fresh-unpinned']);
  });

  it('matches loaded message text and surfaces a contextual snippet when the preview does not match', () => {
    const results = filterSessionSearchResults([
      createSession({
        id: 'deep-match',
        title: 'Project notes',
        updatedAt: 30,
        messages: [
          { id: 'm1', role: 'user', content: 'Start project', timestamp: 1 },
          { id: 'm2', role: 'assistant', content: 'Remember to buy oranges before the next demo walkthrough.', timestamp: 2 },
          { id: 'm3', role: 'assistant', content: 'Done.', timestamp: 3 },
        ],
      }),
    ], 'oranges');

    expect(results).toHaveLength(1);
    expect(results[0]?.matchedField).toBe('message');
    expect(results[0]?.searchPreview).toContain('oranges');
  });

  it('matches stub sessions using cached server preview metadata', () => {
    const results = filterSessionSearchResults([
      createSession({
        id: 'stub-session',
        title: 'Desktop sync',
        updatedAt: 40,
        serverConversationId: 'conv-1',
        serverMetadata: {
          messageCount: 8,
          lastMessage: 'Shared follow-up',
          preview: 'Need to revisit the Codex ACP setup tomorrow.',
        },
      }),
    ], 'codex');

    expect(results).toHaveLength(1);
    expect(results[0]?.matchedField).toBe('preview');
    expect(results[0]?.searchPreview).toContain('Codex ACP setup');
  });
});

describe('filterSessionsByArchiveMode', () => {
  it('keeps the normal chats list focused on unarchived sessions', () => {
    const results = filterSessionsByArchiveMode([
      createSession({ id: 'active-chat', title: 'Active' }),
      createSession({ id: 'archived-chat', title: 'Archived', isArchived: true }),
    ], 'active');

    expect(results.map((item) => item.id)).toEqual(['active-chat']);
  });

  it('keeps archived chats reachable for unarchive and delete actions', () => {
    const results = filterSessionsByArchiveMode([
      createSession({ id: 'active-chat', title: 'Active' }),
      createSession({ id: 'archived-chat', title: 'Archived', isArchived: true }),
    ], 'archived');

    expect(results.map((item) => item.id)).toEqual(['archived-chat']);
  });
});
