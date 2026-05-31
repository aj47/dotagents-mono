import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../types/session';
import { generateSessionTitle } from '../types/session';
import { compactSessionsForStorageQuota, shouldApplyServerGeneratedSessionTitle } from './sessions';

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

describe('shouldApplyServerGeneratedSessionTitle', () => {
  it('allows a server-generated title to replace the mobile first-message fallback', () => {
    const session: Session = {
      id: 'session-1',
      title: 'what did we do today',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
        { id: 'm2', role: 'assistant', content: 'We debugged hands-free mode.', timestamp: 200 },
      ],
    };

    expect(shouldApplyServerGeneratedSessionTitle(session, 'conv-1', 'Hands-Free Debugging Recap')).toBe(true);
  });

  it('preserves an explicit local title', () => {
    const session: Session = {
      id: 'session-1',
      title: 'My custom title',
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: 'what did we do today', timestamp: 100 },
      ],
    };

    expect(shouldApplyServerGeneratedSessionTitle(session, 'conv-1', 'Hands-Free Debugging Recap')).toBe(false);
  });

  it('does not treat the desktop first-message fallback as a generated title', () => {
    const firstMessage = 'can you refresh me on the demo for snyk we discussed today';
    const session: Session = {
      id: 'session-1',
      title: generateSessionTitle(firstMessage),
      createdAt: 100,
      updatedAt: 200,
      serverConversationId: 'conv-1',
      messages: [
        { id: 'm1', role: 'user', content: firstMessage, timestamp: 100 },
      ],
    };

    expect(
      shouldApplyServerGeneratedSessionTitle(
        session,
        'conv-1',
        `${firstMessage.slice(0, 50)}...`,
      ),
    ).toBe(false);
  });
});
