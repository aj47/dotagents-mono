import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const chatScreenSource = readFileSync(new URL('./ChatScreen.tsx', import.meta.url), 'utf8');
const messageQueuePanelSource = readFileSync(new URL('../ui/MessageQueuePanel.tsx', import.meta.url), 'utf8');
const messageQueueStoreSource = readFileSync(new URL('../store/message-queue.ts', import.meta.url), 'utf8');

describe('mobile queue action feedback', () => {
  it('surfaces alerts when visible queue actions become stale', () => {
    expect(chatScreenSource).toContain("const removed = messageQueue.removeFromQueue(currentConversationId, messageId)");
    expect(chatScreenSource).toContain("Alert.alert('Unable to remove queued message', 'This queued message is already processing or no longer exists.')");
    expect(chatScreenSource).toContain("const updated = messageQueue.updateText(currentConversationId, messageId, text)");
    expect(chatScreenSource).toContain("Alert.alert('Unable to save queued message', 'This queued message changed before your edit could be saved.')");
    expect(chatScreenSource).toContain("const reset = messageQueue.resetToPending(currentConversationId, messageId)");
    expect(chatScreenSource).toContain("Alert.alert('Unable to retry queued message', 'This queued message is no longer retryable.')");
    expect(chatScreenSource).toContain("const markedProcessing = messageQueue.markProcessing(currentConversationId, nextMessage.id)");
    expect(chatScreenSource).toContain("Alert.alert('Unable to retry queued message', 'The queued message changed before retry could start.')");
    expect(chatScreenSource).toContain("const cleared = messageQueue.clearQueue(currentConversationId)");
    expect(chatScreenSource).toContain("Alert.alert('Unable to clear queued messages', 'Wait for the current queued message to finish, or refresh if the queue already changed.')");
  });

  it('keeps queued-message edit mode open when save fails', () => {
    expect(messageQueuePanelSource).toContain('onUpdate: (messageId: string, text: string) => boolean;');
    expect(messageQueuePanelSource).toContain('const didUpdate = onUpdate(trimmed);');
    expect(messageQueuePanelSource).toContain('if (!didUpdate) {');
    expect(messageQueuePanelSource).toContain('return;');
  });

  it('returns a boolean when clearing the queue so callers can report failures', () => {
    expect(messageQueueStoreSource).toContain('clearQueue: (conversationId: string) => boolean;');
    expect(messageQueueStoreSource).toContain('const clearQueue = useCallback((conversationId: string): boolean => {');
    expect(messageQueueStoreSource).toContain('if (!queue) return false;');
    expect(messageQueueStoreSource).toContain("if (queue.some(m => m.status === 'processing')) return false;");
    expect(messageQueueStoreSource).toContain('return true;');
  });
});