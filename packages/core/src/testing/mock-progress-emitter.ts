import type { AgentProgressUpdate } from '@dotagents/shared/agent-progress';
import type { ProgressEmitter } from '../interfaces/progress-emitter';

/**
 * Mock ProgressEmitter for testing.
 * Records all emitted events for later assertion.
 */
export class MockProgressEmitter implements ProgressEmitter {
  readonly progressUpdates: AgentProgressUpdate[] = [];
  readonly sessionUpdates: Array<{
    type: 'created' | 'updated' | 'deleted' | 'renamed';
    sessionId: string;
    [key: string]: unknown;
  }> = [];
  readonly queueUpdates: Array<{ conversationId: string; queue: unknown[] }> = [];
  readonly events: Array<{ channel: string; data: unknown }> = [];

  emitAgentProgress(update: AgentProgressUpdate): void {
    this.progressUpdates.push(update);
  }

  emitSessionUpdate(data: {
    type: 'created' | 'updated' | 'deleted' | 'renamed';
    sessionId: string;
    [key: string]: unknown;
  }): void {
    this.sessionUpdates.push(data);
  }

  emitQueueUpdate(conversationId: string, queue: unknown[]): void {
    this.queueUpdates.push({ conversationId, queue });
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
