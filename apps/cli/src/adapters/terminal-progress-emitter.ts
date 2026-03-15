import type { AgentProgressUpdate } from '@dotagents/shared';
import type { ProgressEmitter } from '@dotagents/core';

/**
 * Terminal-based ProgressEmitter implementation.
 *
 * In the CLI, progress is communicated through an event bus
 * that TUI components subscribe to via React state. This acts
 * as the bridge between the core engine and the TUI layer.
 */

export type ProgressListener = (update: AgentProgressUpdate) => void;
export type SessionListener = (data: {
  activeSessions: unknown[];
  recentSessions: unknown[];
}) => void;
export type QueueListener = (data: {
  conversationId: string;
  queue: unknown[];
  isPaused: boolean;
}) => void;
export type EventListener = (channel: string, data: unknown) => void;

export class TerminalProgressEmitter implements ProgressEmitter {
  private progressListeners = new Set<ProgressListener>();
  private sessionListeners = new Set<SessionListener>();
  private queueListeners = new Set<QueueListener>();
  private eventListeners = new Set<EventListener>();

  emitAgentProgress(update: AgentProgressUpdate): void {
    for (const listener of this.progressListeners) {
      listener(update);
    }
  }

  emitSessionUpdate(data: {
    activeSessions: unknown[];
    recentSessions: unknown[];
  }): void {
    for (const listener of this.sessionListeners) {
      listener(data);
    }
  }

  emitQueueUpdate(data: {
    conversationId: string;
    queue: unknown[];
    isPaused: boolean;
  }): void {
    for (const listener of this.queueListeners) {
      listener(data);
    }
  }

  emitEvent(channel: string, data: unknown): void {
    for (const listener of this.eventListeners) {
      listener(channel, data);
    }
  }

  emitConversationHistoryChanged(): void {
    this.emitEvent('conversation-history-changed', {});
  }

  /** Subscribe to agent progress updates. Returns an unsubscribe function. */
  onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  /** Subscribe to session updates. Returns an unsubscribe function. */
  onSessionUpdate(listener: SessionListener): () => void {
    this.sessionListeners.add(listener);
    return () => this.sessionListeners.delete(listener);
  }

  /** Subscribe to queue updates. Returns an unsubscribe function. */
  onQueueUpdate(listener: QueueListener): () => void {
    this.queueListeners.add(listener);
    return () => this.queueListeners.delete(listener);
  }

  /** Subscribe to generic events. Returns an unsubscribe function. */
  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /** Remove all listeners. */
  dispose(): void {
    this.progressListeners.clear();
    this.sessionListeners.clear();
    this.queueListeners.clear();
    this.eventListeners.clear();
  }
}
