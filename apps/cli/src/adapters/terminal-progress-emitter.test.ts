import { describe, it, expect, vi } from 'vitest';
import type { AgentProgressUpdate } from '@dotagents/shared';
import { TerminalProgressEmitter } from './terminal-progress-emitter';

describe('TerminalProgressEmitter', () => {
  it('notifies progress listeners when emitAgentProgress is called', () => {
    const emitter = new TerminalProgressEmitter();
    const listener = vi.fn();
    emitter.onProgress(listener);

    const update = { conversationId: 'test-123' } as AgentProgressUpdate;
    emitter.emitAgentProgress(update);

    expect(listener).toHaveBeenCalledWith(update);
  });

  it('notifies session listeners when emitSessionUpdate is called', () => {
    const emitter = new TerminalProgressEmitter();
    const listener = vi.fn();
    emitter.onSessionUpdate(listener);

    const data = { activeSessions: [{ id: '1' }], recentSessions: [] };
    emitter.emitSessionUpdate(data);

    expect(listener).toHaveBeenCalledWith(data);
  });

  it('notifies queue listeners when emitQueueUpdate is called', () => {
    const emitter = new TerminalProgressEmitter();
    const listener = vi.fn();
    emitter.onQueueUpdate(listener);

    const data = { conversationId: 'conv-1', queue: [], isPaused: false };
    emitter.emitQueueUpdate(data);

    expect(listener).toHaveBeenCalledWith(data);
  });

  it('notifies event listeners when emitEvent is called', () => {
    const emitter = new TerminalProgressEmitter();
    const listener = vi.fn();
    emitter.onEvent(listener);

    emitter.emitEvent('test-channel', { foo: 'bar' });

    expect(listener).toHaveBeenCalledWith('test-channel', { foo: 'bar' });
  });

  it('unsubscribe function removes the listener', () => {
    const emitter = new TerminalProgressEmitter();
    const listener = vi.fn();
    const unsubscribe = emitter.onProgress(listener);

    unsubscribe();

    emitter.emitAgentProgress({
      conversationId: 'test',
    } as AgentProgressUpdate);
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple listeners', () => {
    const emitter = new TerminalProgressEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.onProgress(listener1);
    emitter.onProgress(listener2);

    const update = { conversationId: 'test' } as AgentProgressUpdate;
    emitter.emitAgentProgress(update);

    expect(listener1).toHaveBeenCalledWith(update);
    expect(listener2).toHaveBeenCalledWith(update);
  });

  it('dispose clears all listeners', () => {
    const emitter = new TerminalProgressEmitter();
    const progressListener = vi.fn();
    const sessionListener = vi.fn();
    const queueListener = vi.fn();
    const eventListener = vi.fn();

    emitter.onProgress(progressListener);
    emitter.onSessionUpdate(sessionListener);
    emitter.onQueueUpdate(queueListener);
    emitter.onEvent(eventListener);

    emitter.dispose();

    emitter.emitAgentProgress({
      conversationId: 'test',
    } as AgentProgressUpdate);
    emitter.emitSessionUpdate({ activeSessions: [], recentSessions: [] });
    emitter.emitQueueUpdate({
      conversationId: 'test',
      queue: [],
      isPaused: false,
    });
    emitter.emitEvent('channel', {});

    expect(progressListener).not.toHaveBeenCalled();
    expect(sessionListener).not.toHaveBeenCalled();
    expect(queueListener).not.toHaveBeenCalled();
    expect(eventListener).not.toHaveBeenCalled();
  });

  it('emitConversationHistoryChanged emits a generic event', () => {
    const emitter = new TerminalProgressEmitter();
    const listener = vi.fn();
    emitter.onEvent(listener);

    emitter.emitConversationHistoryChanged();

    expect(listener).toHaveBeenCalledWith(
      'conversation-history-changed',
      {}
    );
  });
});
