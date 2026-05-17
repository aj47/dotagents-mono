/**
 * Connection recovery types and utilities for DotAgents apps
 * Platform-agnostic - does NOT include ConnectionRecoveryManager which uses React Native AppState
 */

import { REMOTE_SERVER_API_PATHS } from './remote-server-api';

export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export const CONNECTION_STATUS_INDICATOR_PRESENTATION = {
  labels: {
    connected: 'Connected',
    connecting: 'Connecting...',
    reconnecting: 'Reconnecting...',
    disconnected: 'Disconnected',
    failed: 'Connection failed',
    unknown: 'Unknown',
  },
} as const;

export const CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION = {
  mobile: {
    container: {
      accessibilityRole: 'text',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      compactPaddingVertical: 2,
      compactPaddingHorizontal: 4,
    },
    dotContainer: {
      position: 'relative',
      size: 10,
      marginRight: 6,
    },
    dot: {
      position: 'absolute',
      size: 8,
      borderRadius: 4,
      offset: 1,
      pulsingOpacity: 1,
    },
    pulse: {
      position: 'absolute',
      size: 10,
      borderRadius: 5,
      top: 0,
      left: 0,
      minOpacity: 0.3,
      maxOpacity: 0.8,
      durationMs: 800,
      useNativeDriver: true,
    },
    text: {
      fontSize: 12,
      fontWeight: '500',
      colorToken: 'mutedForeground',
    },
    statusColorTokenByStatus: {
      connected: 'success',
      connecting: 'warning',
      reconnecting: 'warning',
      disconnected: 'mutedForeground',
      failed: 'destructive',
    },
  },
} as const;

export type ConnectionStatusIndicatorMobileColorToken =
  (typeof CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.statusColorTokenByStatus)[ConnectionStatus];

export type ConnectionStatusIndicatorMobileSurfaceColorToken =
  | ConnectionStatusIndicatorMobileColorToken
  | typeof CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.text.colorToken;

export type ConnectionStatusIndicatorMobileSurfaceColorPalette =
  Readonly<Record<ConnectionStatusIndicatorMobileSurfaceColorToken, string>>;

export interface ConnectionStatusIndicatorMobileSurfaceColors {
  textColor: string;
  statusColorByStatus: Record<ConnectionStatus, string>;
}

export interface ConnectionStatusIndicatorMobileVisualColors {
  dot: {
    backgroundColor: string;
  };
  pulse: {
    backgroundColor: string;
  };
  text: {
    color: string;
  };
}

export interface ConnectionStatusIndicatorMobilePulseAnimationState {
  minOpacity: number;
  maxOpacity: number;
  durationMs: number;
  useNativeDriver: boolean;
}

export interface ConnectionStatusIndicatorMobileRenderStateInput {
  status: ConnectionStatus;
  retryCount?: number;
  compact?: boolean;
  colors: ConnectionStatusIndicatorMobileSurfaceColorPalette;
}

export interface ConnectionStatusIndicatorMobileRenderState {
  surface: typeof CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile;
  statusText: string;
  accessibilityLabel: string;
  accessibilityRole: typeof CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.container.accessibilityRole;
  isPulsing: boolean;
  shouldRenderPulse: boolean;
  shouldRenderText: boolean;
  colors: ConnectionStatusIndicatorMobileVisualColors;
  animation: ConnectionStatusIndicatorMobilePulseAnimationState;
}

type ConnectionStatusIndicatorMobileSurface =
  typeof CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile;

export interface ConnectionStatusIndicatorMobileStyleSlotsInput {
  renderState: Pick<ConnectionStatusIndicatorMobileRenderState, 'surface' | 'colors'>;
}

export interface ConnectionStatusIndicatorMobileStyleSlots {
  container: {
    flexDirection: ConnectionStatusIndicatorMobileSurface['container']['flexDirection'];
    alignItems: ConnectionStatusIndicatorMobileSurface['container']['alignItems'];
    paddingVertical: number;
    paddingHorizontal: number;
  };
  containerCompact: {
    paddingVertical: number;
    paddingHorizontal: number;
  };
  dotContainer: {
    position: ConnectionStatusIndicatorMobileSurface['dotContainer']['position'];
    width: number;
    height: number;
    marginRight: number;
  };
  dot: {
    width: number;
    height: number;
    borderRadius: number;
    position: ConnectionStatusIndicatorMobileSurface['dot']['position'];
    top: number;
    left: number;
  };
  dotPulsing: {
    opacity: number;
  };
  dotPulse: {
    width: number;
    height: number;
    borderRadius: number;
    opacity: number;
    position: ConnectionStatusIndicatorMobileSurface['pulse']['position'];
    top: number;
    left: number;
  };
  dotColor: {
    backgroundColor: string;
  };
  pulseColor: {
    backgroundColor: string;
  };
  text: {
    fontSize: number;
    fontWeight: ConnectionStatusIndicatorMobileSurface['text']['fontWeight'];
  };
  textColor: {
    color: string;
  };
}

export interface ConnectionStatusIndicatorMobileStylesLike {
  container: unknown;
  containerCompact: unknown;
  dotContainer: unknown;
  dot: unknown;
  dotPulsing: unknown;
  dotPulse: unknown;
  dotColor: unknown;
  pulseColor: unknown;
  text: unknown;
  textColor: unknown;
}

export interface ConnectionStatusIndicatorMobilePropsPartsInput<
  TStyles extends ConnectionStatusIndicatorMobileStylesLike = ConnectionStatusIndicatorMobileStylesLike,
  TAnimatedStyle = unknown,
> {
  renderState: ConnectionStatusIndicatorMobileRenderState;
  styles: TStyles;
  pulseAnimatedStyle: TAnimatedStyle;
  compact: boolean;
}

export interface ConnectionStatusIndicatorMobilePropsParts<
  TStyles extends ConnectionStatusIndicatorMobileStylesLike = ConnectionStatusIndicatorMobileStylesLike,
  TAnimatedStyle = unknown,
> {
  container: {
    style: Array<TStyles['container'] | TStyles['containerCompact'] | false>;
    accessibilityLabel: string;
    accessibilityRole: ConnectionStatusIndicatorMobileRenderState['accessibilityRole'];
  };
  dotContainer: {
    style: TStyles['dotContainer'];
  };
  dot: {
    style: Array<TStyles['dot'] | TStyles['dotColor'] | TStyles['dotPulsing'] | false>;
  };
  pulse: {
    style: Array<TStyles['dotPulse'] | TStyles['pulseColor'] | TAnimatedStyle>;
  } | null;
  text: {
    style: Array<TStyles['text'] | TStyles['textColor']>;
    text: string;
  } | null;
}

export function getConnectionStatusIndicatorMobileSurfaceState(): typeof CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile {
  return CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile;
}

export function getConnectionStatusIndicatorMobileSurfaceColors(
  colors: ConnectionStatusIndicatorMobileSurfaceColorPalette,
): ConnectionStatusIndicatorMobileSurfaceColors {
  const surface = CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile;

  return {
    textColor: colors[surface.text.colorToken],
    statusColorByStatus: {
      connected: colors[surface.statusColorTokenByStatus.connected],
      connecting: colors[surface.statusColorTokenByStatus.connecting],
      reconnecting: colors[surface.statusColorTokenByStatus.reconnecting],
      disconnected: colors[surface.statusColorTokenByStatus.disconnected],
      failed: colors[surface.statusColorTokenByStatus.failed],
    },
  };
}

export function getConnectionStatusIndicatorMobileVisualColors(
  state: ConnectionStatus,
  colors: ConnectionStatusIndicatorMobileSurfaceColorPalette,
): ConnectionStatusIndicatorMobileVisualColors {
  const surfaceColors = getConnectionStatusIndicatorMobileSurfaceColors(colors);
  const statusColor = surfaceColors.statusColorByStatus[state];

  return {
    dot: {
      backgroundColor: statusColor,
    },
    pulse: {
      backgroundColor: statusColor,
    },
    text: {
      color: surfaceColors.textColor,
    },
  };
}

export function getConnectionStatusIndicatorMobileRenderState({
  status,
  retryCount = 0,
  compact = false,
  colors,
}: ConnectionStatusIndicatorMobileRenderStateInput): ConnectionStatusIndicatorMobileRenderState {
  const statusText = formatConnectionStatusIndicatorLabel(status, retryCount);
  const isPulsing = isConnectionStatusIndicatorPulsing(status);

  return {
    surface: getConnectionStatusIndicatorMobileSurfaceState(),
    statusText,
    accessibilityLabel: statusText,
    accessibilityRole: getConnectionStatusIndicatorMobileSurfaceState().container.accessibilityRole,
    isPulsing,
    shouldRenderPulse: isPulsing,
    shouldRenderText: !compact,
    colors: getConnectionStatusIndicatorMobileVisualColors(status, colors),
    animation: getConnectionStatusIndicatorMobilePulseAnimationState(),
  };
}

export function getConnectionStatusIndicatorMobilePulseAnimationState(): ConnectionStatusIndicatorMobilePulseAnimationState {
  const pulse = CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse;

  return {
    minOpacity: pulse.minOpacity,
    maxOpacity: pulse.maxOpacity,
    durationMs: pulse.durationMs,
    useNativeDriver: pulse.useNativeDriver,
  };
}

export function createConnectionStatusIndicatorMobileStyleSlots({
  renderState,
}: ConnectionStatusIndicatorMobileStyleSlotsInput): ConnectionStatusIndicatorMobileStyleSlots {
  const surface = renderState.surface;
  const colors = renderState.colors;

  return {
    container: {
      flexDirection: surface.container.flexDirection,
      alignItems: surface.container.alignItems,
      paddingVertical: surface.container.paddingVertical,
      paddingHorizontal: surface.container.paddingHorizontal,
    },
    containerCompact: {
      paddingVertical: surface.container.compactPaddingVertical,
      paddingHorizontal: surface.container.compactPaddingHorizontal,
    },
    dotContainer: {
      position: surface.dotContainer.position,
      width: surface.dotContainer.size,
      height: surface.dotContainer.size,
      marginRight: surface.dotContainer.marginRight,
    },
    dot: {
      width: surface.dot.size,
      height: surface.dot.size,
      borderRadius: surface.dot.borderRadius,
      position: surface.dot.position,
      top: surface.dot.offset,
      left: surface.dot.offset,
    },
    dotPulsing: {
      opacity: surface.dot.pulsingOpacity,
    },
    dotPulse: {
      width: surface.pulse.size,
      height: surface.pulse.size,
      borderRadius: surface.pulse.borderRadius,
      opacity: surface.pulse.minOpacity,
      position: surface.pulse.position,
      top: surface.pulse.top,
      left: surface.pulse.left,
    },
    dotColor: {
      backgroundColor: colors.dot.backgroundColor,
    },
    pulseColor: {
      backgroundColor: colors.pulse.backgroundColor,
    },
    text: {
      fontSize: surface.text.fontSize,
      fontWeight: surface.text.fontWeight,
    },
    textColor: {
      color: colors.text.color,
    },
  };
}

export function createConnectionStatusIndicatorMobilePropsParts<
  TStyles extends ConnectionStatusIndicatorMobileStylesLike,
  TAnimatedStyle,
>({
  renderState,
  styles,
  pulseAnimatedStyle,
  compact,
}: ConnectionStatusIndicatorMobilePropsPartsInput<TStyles, TAnimatedStyle>): ConnectionStatusIndicatorMobilePropsParts<TStyles, TAnimatedStyle> {
  return {
    container: {
      style: [styles.container, compact && styles.containerCompact],
      accessibilityLabel: renderState.accessibilityLabel,
      accessibilityRole: renderState.accessibilityRole,
    },
    dotContainer: {
      style: styles.dotContainer,
    },
    dot: {
      style: [
        styles.dot,
        styles.dotColor,
        renderState.isPulsing && styles.dotPulsing,
      ],
    },
    pulse: renderState.shouldRenderPulse
      ? {
          style: [
            styles.dotPulse,
            styles.pulseColor,
            pulseAnimatedStyle,
          ],
        }
      : null,
    text: renderState.shouldRenderText
      ? {
          style: [styles.text, styles.textColor],
          text: renderState.statusText,
        }
      : null,
  };
}

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

export function createStreamingCheckpoint(now: () => number = Date.now): StreamingCheckpoint {
  return {
    content: '',
    conversationId: undefined,
    lastUpdateTime: now(),
    progressCount: 0,
  };
}

export function updateStreamingCheckpoint(
  checkpoint: StreamingCheckpoint | null | undefined,
  content: string,
  conversationId?: string,
  now: () => number = Date.now,
): StreamingCheckpoint {
  const timestamp = now();
  const currentCheckpoint = checkpoint ?? {
    content: '',
    conversationId: undefined,
    lastUpdateTime: timestamp,
    progressCount: 0,
  };

  return {
    ...currentCheckpoint,
    content: content || !currentCheckpoint.content ? content : currentCheckpoint.content,
    lastUpdateTime: timestamp,
    progressCount: currentCheckpoint.progressCount + 1,
    ...(conversationId ? { conversationId } : {}),
  };
}

export function applyStreamingCheckpointFailure(
  state: RecoveryState,
  checkpoint: StreamingCheckpoint | null | undefined,
): RecoveryState {
  if (!checkpoint) return { ...state };

  return {
    ...state,
    ...(checkpoint.content ? { partialContent: checkpoint.content } : {}),
    ...(checkpoint.conversationId ? { conversationId: checkpoint.conversationId } : {}),
  };
}

export function clearRecoveryContent(state: RecoveryState): RecoveryState {
  const { partialContent: _partialContent, conversationId: _conversationId, ...rest } = state;
  return rest;
}

export function hasRecoverablePartialContent(state: RecoveryState): boolean {
  return !!(state.partialContent && state.partialContent.length > 0);
}

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

export function formatConnectionStatusIndicatorLabel(
  status: ConnectionStatus,
  retryCount: number = 0,
): string {
  if (status === 'reconnecting') {
    return retryCount > 0
      ? `Reconnecting (${retryCount})...`
      : CONNECTION_STATUS_INDICATOR_PRESENTATION.labels.reconnecting;
  }

  return CONNECTION_STATUS_INDICATOR_PRESENTATION.labels[status]
    ?? CONNECTION_STATUS_INDICATOR_PRESENTATION.labels.unknown;
}

export function isConnectionStatusIndicatorPulsing(status: ConnectionStatus): boolean {
  return status === 'connecting' || status === 'reconnecting';
}

export function getConnectionStatusIndicatorMobileColorToken(
  status: ConnectionStatus,
): ConnectionStatusIndicatorMobileColorToken {
  return CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.statusColorTokenByStatus[status]
    ?? CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.statusColorTokenByStatus.disconnected;
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

  // Try the models endpoint first (OpenAI-compatible)
  const modelsUrl = `${normalizedUrl}${REMOTE_SERVER_API_PATHS.models}`;

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

    clearTimeout(timeoutId);
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
    clearTimeout(timeoutId);
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
  }
}
