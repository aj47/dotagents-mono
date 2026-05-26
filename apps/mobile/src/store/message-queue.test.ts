import { describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  createContext: vi.fn((defaultValue) => ({ defaultValue })),
  useCallback: vi.fn((callback) => callback),
  useContext: vi.fn((context) => context.defaultValue),
  useRef: vi.fn((value) => ({ current: value })),
  useState: vi.fn((initialValue) => [initialValue, vi.fn()]),
}));

import { useMessageQueue } from './message-queue';

describe('useMessageQueue', () => {
  it('exposes the next pending message immediately after a processing item is removed', () => {
    const messageQueue = useMessageQueue();
    const firstMessage = messageQueue.enqueue('conversation-1', 'first follow-up');
    const secondMessage = messageQueue.enqueue('conversation-1', 'second follow-up');

    expect(messageQueue.markProcessing('conversation-1', firstMessage.id)).toBe(true);
    expect(messageQueue.markProcessed('conversation-1', firstMessage.id)).toBe(true);
    expect(messageQueue.peek('conversation-1')?.id).toBe(secondMessage.id);
  });
});
