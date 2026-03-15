import type { AgentProgressUpdate } from '@dotagents/shared';

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
   * Desktop implementations should handle panel auto-show logic.
   */
  emitAgentProgress(update: AgentProgressUpdate): void;

  /**
   * Emit a session list update (active + recent sessions).
   * In desktop this broadcasts via tipc to all renderer windows.
   */
  emitSessionUpdate(data: {
    activeSessions: unknown[];
    recentSessions: unknown[];
  }): void;

  /**
   * Emit a message queue update for a specific conversation.
   */
  emitQueueUpdate(data: {
    conversationId: string;
    queue: unknown[];
    isPaused: boolean;
  }): void;

  /**
   * Emit a generic event to the UI layer.
   * Useful for one-off notifications that don't fit the above categories.
   */
  emitEvent(channel: string, data: unknown): void;

  /**
   * Notify the UI that conversation history has changed (e.g., from remote server).
   * Optional — only needed when remote server modifies conversations.
   */
  emitConversationHistoryChanged?(): void;
}
