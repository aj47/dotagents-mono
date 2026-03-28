/**
 * Connection recovery types and utilities for DotAgents apps
 * Platform-agnostic - does NOT include ConnectionRecoveryManager which uses React Native AppState
 */

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type ConnectionRecoveryConfig = {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  heartbeatIntervalMs: number;
  connectionTimeoutMs: number;
};

export const DEFAULT_RECOVERY_CONFIG: ConnectionRecoveryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  heartbeatIntervalMs: 30000,
  connectionTimeoutMs: 30000,
};

export type RecoveryState = {
  status: ConnectionStatus;
  retryCount: number;
  lastError?: string;
  isAppActive: boolean;
  /** Partial content received before connection was lost (for message recovery) */
  partialContent?: string;
  /** Conversation ID for resuming after reconnection */
  conversationId?: string;
};

/**
 * Checkpoint for tracking streaming progress during a request.
 * Used to recover partial responses when network fails mid-stream.
 */
export type StreamingCheckpoint = {
  /** Partial content accumulated so far */
  content: string;
  /** Conversation ID from server (if received) */
  conversationId?: string;
  /** Timestamp of last received data */
  lastUpdateTime: number;
  /** Number of progress updates received */
  progressCount: number;
};

export type OnStatusChange = (state: RecoveryState) => void;

export function calculateBackoff(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff: delay = initial * 2^attempt
  const exponentialDelay = initialDelayMs * Math.pow(2, attempt);
  // Add jitter (±20%)
  const jitter = exponentialDelay * (0.8 + Math.random() * 0.4);
  return Math.min(jitter, maxDelayMs);
}

export function isRetryableError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  const lowered = message.toLowerCase();

  // Non-retryable patterns - user-initiated cancellations should not trigger retry
  const nonRetryablePatterns = [
    'cancelled',
    'canceled',
    'user abort',
    'abortcontroller',
  ];

  if (nonRetryablePatterns.some(pattern => lowered.includes(pattern))) {
    return false;
  }

  const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'aborted',
    'sse connection',
    'fetch failed',
    'failed to fetch',
    'network request failed',
    'unable to resolve host',
    'socket',
    'econnrefused',
    'econnreset',
    'etimedout',
    'enetunreach',
    'internet',
  ];

  return retryablePatterns.some(pattern => lowered.includes(pattern));
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const LOCAL_API_ADDRESS_PATTERN = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|\[(::1|f[cd][0-9a-f]{1,4}:|fe[89ab][0-9a-f]:)[^\]]*\])/i;

export function normalizeApiBaseUrl(baseUrl: string): string {
  let normalizedUrl = baseUrl.trim();
  if (!normalizedUrl) return '';

  const hasScheme = /^https?:\/\//i.test(normalizedUrl);
  const isLocalAddress = LOCAL_API_ADDRESS_PATTERN.test(normalizedUrl.replace(/^https?:\/\//i, ''));

  if (!hasScheme) {
    normalizedUrl = isLocalAddress ? `http://${normalizedUrl}` : `https://${normalizedUrl}`;
  }

  normalizedUrl = normalizedUrl.replace(/\/+$/, '');

  try {
    const parsedUrl = new URL(normalizedUrl);
    const trimmedPath = parsedUrl.pathname.replace(/\/+$/, '');
    parsedUrl.pathname = !trimmedPath || trimmedPath === '/' ? '/v1' : trimmedPath;
    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    return normalizedUrl;
  }
}

export type ConnectionCheckResult = {
  success: boolean;
  error?: string;
  statusCode?: number;
  responseTime?: number;
  normalizedUrl?: string;
};

export function formatConnectionStatus(state: RecoveryState): string {
  switch (state.status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'reconnecting':
      return `Reconnecting... (attempt ${state.retryCount})`;
    case 'disconnected':
      return 'Disconnected';
    case 'failed':
      return `Connection failed: ${state.lastError || 'Unknown error'}`;
    default:
      return 'Unknown';
  }
}

/**
 * Check connectivity to a remote server by making a test request.
 * This is used to verify the connection before allowing users to proceed from settings.
 *
 * @param baseUrl - The API base URL to check (e.g., https://api.openai.com/v1)
 * @param apiKey - The API key to use for authentication
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns ConnectionCheckResult with success status and optional error
 */
export async function checkServerConnection(
  baseUrl: string,
  apiKey: string,
  timeoutMs: number = 10000
): Promise<ConnectionCheckResult> {
  const startTime = Date.now();

  // Validate inputs
  if (!baseUrl || !baseUrl.trim()) {
    return { success: false, error: 'Base URL is required' };
  }

  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'API Key is required' };
  }

  // Trim the API key for use in requests
  const trimmedApiKey = apiKey.trim();

  // Normalize the base URL, including adding /v1 for root-level OpenAI-compatible endpoints
  const normalizedUrl = normalizeApiBaseUrl(baseUrl);

  // Try the /models endpoint first (OpenAI-compatible)
  const modelsUrl = `${normalizedUrl}/models`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${trimmedApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        responseTime,
        normalizedUrl,
      };
    }

    // Handle specific error codes
    if (response.status === 401) {
      return {
        success: false,
        error: 'Invalid API key. Please check your credentials.',
        statusCode: response.status,
        responseTime,
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'Access forbidden. Your API key may not have the required permissions.',
        statusCode: response.status,
        responseTime,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        error: 'Endpoint not found. Please check your base URL (e.g., should end with /v1).',
        statusCode: response.status,
        responseTime,
      };
    }

    if (response.status >= 500) {
      return {
        success: false,
        error: `Server error (${response.status}). The server may be temporarily unavailable.`,
        statusCode: response.status,
        responseTime,
      };
    }

    // Try to get error message from response body
    let errorMessage = `Server returned status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    return {
      success: false,
      error: errorMessage,
      statusCode: response.status,
      responseTime,
    };
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const err = error as Error & { name?: string };

    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timed out. Please check your network and server URL.',
        responseTime,
      };
    }

    // Parse common network errors
    const errorMessage = err.message?.toLowerCase() || '';

    if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
        responseTime,
      };
    }

    if (errorMessage.includes('unable to resolve host') || errorMessage.includes('dns')) {
      return {
        success: false,
        error: 'Could not resolve server address. Please check the URL.',
        responseTime,
      };
    }

    if (errorMessage.includes('connection refused') || errorMessage.includes('econnrefused')) {
      return {
        success: false,
        error: 'Connection refused. Is the server running?',
        responseTime,
      };
    }

    return {
      success: false,
      error: err.message || 'Unknown connection error',
      responseTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
