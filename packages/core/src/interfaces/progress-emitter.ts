import type { AgentProgressUpdate } from '@dotagents/shared/agent-progress';

/**
 * ProgressEmitter — abstracts how agent progress events are pushed to the UI layer.
 *
 * Desktop (Electron): sends via tipc to BrowserWindow renderer processes.
 * CLI: updates TUI components via React state or event bus.
 */
export interface ProgressEmitter {
  /**
   * Emit an agent progress update to all connected UI surfaces.
   * In desktop this broadcasts via tipc to all renderer windows.
   */
  emitAgentProgress(update: AgentProgressUpdate): void;

  /**
   * Emit a session list update (e.g., new session created, session renamed).
   */
  emitSessionUpdate(data: {
    type: 'created' | 'updated' | 'deleted' | 'renamed';
    sessionId: string;
    [key: string]: unknown;
  }): void;

  /**
   * Emit a message queue update for a specific conversation.
   */
  emitQueueUpdate(conversationId: string, queue: unknown[]): void;

  /**
   * Emit a generic event to the UI layer.
   * Useful for one-off notifications that don't fit the above categories.
   */
  emitEvent(channel: string, data: unknown): void;
}
