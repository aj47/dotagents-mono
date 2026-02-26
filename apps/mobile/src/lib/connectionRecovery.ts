/**
 * Connection recovery for React Native mobile app
 *
 * Types and pure functions are re-exported from @dotagents/shared.
 * Only ConnectionRecoveryManager is defined here because it uses React Native AppState.
 */

import { AppState, AppStateStatus } from 'react-native';

// Re-export types and pure functions from shared package
export {
  calculateBackoff,
  isRetryableError,
  delay,
  formatConnectionStatus,
  checkServerConnection,
  DEFAULT_RECOVERY_CONFIG,
} from '@dotagents/shared';

export type {
  ConnectionStatus,
  ConnectionRecoveryConfig,
  RecoveryState,
  StreamingCheckpoint,
  OnStatusChange,
  ConnectionCheckResult,
} from '@dotagents/shared';

// Import types needed for the class implementation
import type {
  ConnectionStatus,
  ConnectionRecoveryConfig,
  RecoveryState,
  StreamingCheckpoint,
  OnStatusChange,
} from '@dotagents/shared';
import { DEFAULT_RECOVERY_CONFIG, calculateBackoff } from '@dotagents/shared';

export class ConnectionRecoveryManager {
  private config: ConnectionRecoveryConfig;
  private state: RecoveryState;
  private onStatusChange?: OnStatusChange;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();
  private checkpoint: StreamingCheckpoint | null = null;

  constructor(
    config: Partial<ConnectionRecoveryConfig> = {},
    onStatusChange?: OnStatusChange
  ) {
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.onStatusChange = onStatusChange;
    this.state = {
      status: 'disconnected',
      retryCount: 0,
      isAppActive: AppState.currentState === 'active',
    };

    this.setupAppStateListener();
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    const wasActive = this.state.isAppActive;
    const isNowActive = nextAppState === 'active';
    
    this.state.isAppActive = isNowActive;
    
    console.log('[ConnectionRecovery] App state changed:', {
      wasActive,
      isNowActive,
      currentStatus: this.state.status,
    });

    // If app returned to foreground and we were disconnected, trigger recovery
    if (!wasActive && isNowActive && this.state.status === 'disconnected') {
      console.log('[ConnectionRecovery] App returned to foreground, may need recovery');
      this.updateStatus('reconnecting');
    }
  };

  private updateStatus(status: ConnectionStatus, error?: string): void {
    this.state.status = status;
    if (error) this.state.lastError = error;
    
    console.log('[ConnectionRecovery] Status update:', {
      status,
      retryCount: this.state.retryCount,
      error,
    });
    
    this.onStatusChange?.({ ...this.state });
  }

  getState(): RecoveryState {
    return { ...this.state };
  }

  startHeartbeat(onHeartbeatMissed: () => void): void {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();

    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;

      // Only check heartbeat when app is active
      if (!this.state.isAppActive) return;

      if (timeSinceLastHeartbeat > this.config.connectionTimeoutMs) {
        console.log('[ConnectionRecovery] Heartbeat missed:', {
          timeSinceLastHeartbeat,
          threshold: this.config.connectionTimeoutMs,
        });
        onHeartbeatMissed();
      }
    }, this.config.heartbeatIntervalMs);
  }

  recordHeartbeat(): void {
    this.lastHeartbeat = Date.now();
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  markConnected(): void {
    this.state.retryCount = 0;
    this.state.lastError = undefined;
    this.updateStatus('connected');
  }

  markDisconnected(error?: string): void {
    this.updateStatus('disconnected', error);
  }

  shouldRetry(): boolean {
    return this.state.retryCount < this.config.maxRetries && this.state.isAppActive;
  }

  prepareRetry(): number {
    this.state.retryCount++;
    this.updateStatus('reconnecting');
    return calculateBackoff(
      this.state.retryCount - 1,
      this.config.initialDelayMs,
      this.config.maxDelayMs
    );
  }

  markFailed(error: string): void {
    // Preserve conversationId even when content is empty so manual retry can resume the same conversation.
    // This handles cases where the server sent a conversationId but the stream failed before any text arrived.
    if (this.checkpoint) {
      if (this.checkpoint.content) {
        this.state.partialContent = this.checkpoint.content;
      }
      if (this.checkpoint.conversationId) {
        this.state.conversationId = this.checkpoint.conversationId;
      }
    }
    this.updateStatus('failed', error);
  }

  reset(): void {
    this.state.retryCount = 0;
    this.state.lastError = undefined;
    this.state.partialContent = undefined;
    this.state.conversationId = undefined;
    this.checkpoint = null;
    this.updateStatus('connecting');
  }

  cleanup(): void {
    this.stopHeartbeat();
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.checkpoint = null;
  }

  // Checkpoint management for message recovery

  /**
   * Initialize a new streaming checkpoint at the start of a request.
   */
  initCheckpoint(): void {
    this.checkpoint = {
      content: '',
      conversationId: undefined,
      lastUpdateTime: Date.now(),
      progressCount: 0,
    };
  }

  /**
   * Update the checkpoint with new streaming content.
   * Call this whenever new content is received during streaming.
   *
   * To prevent losing partial content from earlier attempts during flaky-network scenarios,
   * this method only updates the content field if:
   * 1. The new content is non-empty, OR
   * 2. The checkpoint has no existing content (e.g., at the start of a request)
   *
   * This ensures that if a later retry fails before any tokens arrive, we don't
   * overwrite the partial response captured from an earlier attempt.
   */
  updateCheckpoint(content: string, conversationId?: string): void {
    if (!this.checkpoint) {
      this.initCheckpoint();
    }
    // Only update content if new content is non-empty or checkpoint has no content yet.
    // This preserves partial content from earlier attempts when retries fail early.
    if (content || !this.checkpoint!.content) {
      this.checkpoint!.content = content;
    }
    this.checkpoint!.lastUpdateTime = Date.now();
    this.checkpoint!.progressCount++;
    if (conversationId) {
      this.checkpoint!.conversationId = conversationId;
    }
  }

  /**
   * Get the current checkpoint data.
   * Returns null if no checkpoint exists.
   */
  getCheckpoint(): StreamingCheckpoint | null {
    return this.checkpoint ? { ...this.checkpoint } : null;
  }

  /**
   * Clear the checkpoint (call after successful completion).
   */
  clearCheckpoint(): void {
    this.checkpoint = null;
    this.state.partialContent = undefined;
    this.state.conversationId = undefined;
  }

  /**
   * Check if there's recoverable partial content from a failed request.
   */
  hasRecoverableContent(): boolean {
    return !!(this.state.partialContent && this.state.partialContent.length > 0);
  }

  /**
   * Get the partial content from a failed request (for display to user).
   */
  getPartialContent(): string | undefined {
    return this.state.partialContent;
  }

  /**
   * Get the conversation ID from a failed request (for retry).
   */
  getRecoveryConversationId(): string | undefined {
    return this.state.conversationId;
  }
}

