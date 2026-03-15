import type { AgentProgressUpdate } from '@dotagents/shared';
import type { ProgressEmitter } from '../interfaces/progress-emitter';

/**
 * Mock ProgressEmitter for testing.
 * Records all emitted events for later assertion.
 */
export class MockProgressEmitter implements ProgressEmitter {
  readonly progressUpdates: AgentProgressUpdate[] = [];
  readonly sessionUpdates: Array<{
    activeSessions: unknown[];
    recentSessions: unknown[];
  }> = [];
  readonly queueUpdates: Array<{ conversationId: string; queue: unknown[]; isPaused: boolean }> = [];
  readonly events: Array<{ channel: string; data: unknown }> = [];

  emitAgentProgress(update: AgentProgressUpdate): void {
    this.progressUpdates.push(update);
  }

  emitSessionUpdate(data: {
    activeSessions: unknown[];
    recentSessions: unknown[];
  }): void {
    this.sessionUpdates.push(data);
  }

  emitQueueUpdate(data: {
    conversationId: string;
    queue: unknown[];
    isPaused: boolean;
  }): void {
    this.queueUpdates.push(data);
  }

  emitEvent(channel: string, data: unknown): void {
    this.events.push({ channel, data });
  }

  /** Reset all recorded events. */
  reset(): void {
    this.progressUpdates.length = 0;
    this.sessionUpdates.length = 0;
    this.queueUpdates.length = 0;
    this.events.length = 0;
  }
}
