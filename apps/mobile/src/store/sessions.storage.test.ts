import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../types/session';
import { compactSessionsForStorageQuota } from './sessions';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('compactSessionsForStorageQuota', () => {
  it('compacts server-linked sessions into lazy-loadable metadata stubs', () => {
    const sessions: Session[] = [{
      id: 'linked',
      title: 'Linked conversation',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'hello', timestamp: 100 },
        { id: 'm2', role: 'assistant', content: 'large tool-heavy response', timestamp: 200 },
      ],
    }];

    const compacted = compactSessionsForStorageQuota(sessions);

    expect(compacted[0]).toMatchObject({
      id: 'linked',
      serverConversationId: 'conv-1',
      messages: [],
      serverMetadata: {
        messageCount: 2,
        lastMessage: 'large tool-heavy response',
        preview: 'large tool-heavy response',
      },
    });
  });

  it('keeps local-only sessions intact because they cannot be lazy-loaded from the server', () => {
    const sessions: Session[] = [{
      id: 'local',
      title: 'Local draft',
      createdAt: 100,
      updatedAt: 200,
      messages: [
        { id: 'm1', role: 'user', content: 'not synced yet', timestamp: 100 },
      ],
    }];

    expect(compactSessionsForStorageQuota(sessions)).toEqual(sessions);
  });
});
