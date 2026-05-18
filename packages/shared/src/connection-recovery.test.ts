import { describe, it, expect, vi } from 'vitest'
import {
  applyStreamingCheckpointFailure,
  calculateBackoff,
  clearRecoveryContent,
  CONNECTION_STATUS_INDICATOR_PRESENTATION,
  CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION,
  createConnectionStatusIndicatorMobilePropsParts,
  createConnectionStatusIndicatorMobileStyleSheetSlots,
  createConnectionStatusIndicatorMobileStyleSlots,
  createStreamingCheckpoint,
  formatConnectionStatusIndicatorLabel,
  getConnectionStatusIndicatorMobileColorToken,
  getConnectionStatusIndicatorMobilePulseAnimationState,
  getConnectionStatusIndicatorMobileRenderState,
  getConnectionStatusIndicatorMobileSurfaceColors,
  getConnectionStatusIndicatorMobileSurfaceState,
  getConnectionStatusIndicatorMobileVisualColors,
  updateStreamingCheckpoint,
  hasRecoverablePartialContent,
  isConnectionStatusIndicatorPulsing,
  isRetryableError,
  normalizeApiBaseUrl,
  delay,
  formatConnectionStatus,
  DEFAULT_RECOVERY_CONFIG,
  checkServerConnection,
} from './connection-recovery'
import type { RecoveryState, ConnectionStatus } from './connection-recovery'

// ── streaming checkpoints ───────────────────────────────────────────────────

describe('streaming checkpoints', () => {
  it('creates and updates checkpoints while preserving prior content on empty retries', () => {
    let now = 1000
    const getNow = () => now

    let checkpoint = createStreamingCheckpoint(getNow)
    expect(checkpoint).toEqual({
      content: '',
      conversationId: undefined,
      lastUpdateTime: 1000,
      progressCount: 0,
    })

    now = 1100
    checkpoint = updateStreamingCheckpoint(checkpoint, 'partial answer', 'conversation-1', getNow)
    expect(checkpoint).toEqual({
      content: 'partial answer',
      conversationId: 'conversation-1',
      lastUpdateTime: 1100,
      progressCount: 1,
    })

    now = 1200
    checkpoint = updateStreamingCheckpoint(checkpoint, '', undefined, getNow)
    expect(checkpoint).toEqual({
      content: 'partial answer',
      conversationId: 'conversation-1',
      lastUpdateTime: 1200,
      progressCount: 2,
    })
  })

  it('copies recoverable checkpoint data into recovery state on failure', () => {
    const state: RecoveryState = {
      status: 'reconnecting',
      retryCount: 2,
      isAppActive: true,
    }

    const failedState = applyStreamingCheckpointFailure(state, {
      content: 'partial answer',
      conversationId: 'conversation-1',
      lastUpdateTime: 1000,
      progressCount: 2,
    })

    expect(failedState).toEqual({
      ...state,
      partialContent: 'partial answer',
      conversationId: 'conversation-1',
    })
    expect(hasRecoverablePartialContent(failedState)).toBe(true)
    expect(clearRecoveryContent(failedState)).toEqual(state)
  })

  it('preserves conversation id even when checkpoint content is empty', () => {
    const state: RecoveryState = {
      status: 'reconnecting',
      retryCount: 1,
      isAppActive: true,
    }

    expect(applyStreamingCheckpointFailure(state, {
      content: '',
      conversationId: 'conversation-1',
      lastUpdateTime: 1000,
      progressCount: 1,
    })).toEqual({
      ...state,
      conversationId: 'conversation-1',
    })
  })
})

// ── calculateBackoff ─────────────────────────────────────────────────────────

describe('calculateBackoff', () => {
  it('returns a value greater than 0 for attempt 0', () => {
    const result = calculateBackoff(0, 1000, 10000)
    expect(result).toBeGreaterThan(0)
  })

  it('increases exponentially with attempt number', () => {
    // Run multiple times to account for jitter
    const results = Array.from({ length: 20 }, () => ({
      attempt0: calculateBackoff(0, 1000, 100000),
      attempt3: calculateBackoff(3, 1000, 100000),
    }))
    const avgAttempt0 = results.reduce((sum, r) => sum + r.attempt0, 0) / results.length
    const avgAttempt3 = results.reduce((sum, r) => sum + r.attempt3, 0) / results.length
    expect(avgAttempt3).toBeGreaterThan(avgAttempt0)
  })

  it('never exceeds maxDelayMs', () => {
    for (let i = 0; i < 50; i++) {
      const result = calculateBackoff(10, 1000, 5000)
      expect(result).toBeLessThanOrEqual(5000)
    }
  })

  it('adds jitter (±20%) to the delay', () => {
    // Collect many samples and verify they are not all identical
    const results = new Set(Array.from({ length: 50 }, () => calculateBackoff(0, 1000, 100000)))
    expect(results.size).toBeGreaterThan(1)
  })
})

// ── isRetryableError ─────────────────────────────────────────────────────────

describe('isRetryableError', () => {
  it('returns true for network errors', () => {
    expect(isRetryableError('Network request failed')).toBe(true)
    expect(isRetryableError(new Error('network error'))).toBe(true)
  })

  it('returns true for timeout errors', () => {
    expect(isRetryableError('Connection timeout')).toBe(true)
    expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true)
  })

  it('returns true for connection refused', () => {
    expect(isRetryableError('ECONNREFUSED')).toBe(true)
  })

  it('returns true for fetch failures', () => {
    expect(isRetryableError('Failed to fetch')).toBe(true)
  })

  it('returns false for user cancellations', () => {
    expect(isRetryableError('User cancelled')).toBe(false)
    expect(isRetryableError('Request was cancelled')).toBe(false)
    expect(isRetryableError('AbortController aborted')).toBe(false)
  })

  it('returns false for unrelated errors', () => {
    expect(isRetryableError('Invalid JSON')).toBe(false)
    expect(isRetryableError('Syntax error')).toBe(false)
  })

  it('handles Error objects', () => {
    expect(isRetryableError(new Error('SSE connection lost'))).toBe(true)
  })
})

// ── normalizeApiBaseUrl ──────────────────────────────────────────────────────

describe('normalizeApiBaseUrl', () => {
  it('returns empty for empty input', () => {
    expect(normalizeApiBaseUrl('')).toBe('')
    expect(normalizeApiBaseUrl('   ')).toBe('')
  })

  it('adds https:// for remote addresses', () => {
    const result = normalizeApiBaseUrl('api.openai.com/v1')
    expect(result).toBe('https://api.openai.com/v1')
  })

  it('adds http:// for local addresses', () => {
    const result = normalizeApiBaseUrl('localhost:3000/v1')
    expect(result).toBe('http://localhost:3000/v1')
  })

  it('adds /v1 path when no path is provided', () => {
    const result = normalizeApiBaseUrl('https://api.openai.com')
    expect(result).toBe('https://api.openai.com/v1')
  })

  it('preserves existing /v1 path', () => {
    const result = normalizeApiBaseUrl('https://api.openai.com/v1')
    expect(result).toBe('https://api.openai.com/v1')
  })

  it('strips trailing slashes', () => {
    const result = normalizeApiBaseUrl('https://api.openai.com/v1/')
    expect(result).toBe('https://api.openai.com/v1')
  })

  it('handles 192.168.x.x as local', () => {
    const result = normalizeApiBaseUrl('192.168.1.100:3210/v1')
    expect(result).toBe('http://192.168.1.100:3210/v1')
  })

  it('preserves custom paths', () => {
    const result = normalizeApiBaseUrl('https://api.example.com/custom/path')
    expect(result).toBe('https://api.example.com/custom/path')
  })
})

// ── formatConnectionStatus ───────────────────────────────────────────────────

describe('formatConnectionStatus', () => {
  it('formats connected state', () => {
    const state: RecoveryState = { status: 'connected', retryCount: 0, isAppActive: true }
    expect(formatConnectionStatus(state)).toBe('Connected')
  })

  it('formats connecting state', () => {
    const state: RecoveryState = { status: 'connecting', retryCount: 0, isAppActive: true }
    expect(formatConnectionStatus(state)).toBe('Connecting...')
  })

  it('formats reconnecting state with attempt count', () => {
    const state: RecoveryState = { status: 'reconnecting', retryCount: 2, isAppActive: true }
    expect(formatConnectionStatus(state)).toBe('Reconnecting... (attempt 2)')
  })

  it('formats failed state with error', () => {
    const state: RecoveryState = { status: 'failed', retryCount: 3, lastError: 'Timeout', isAppActive: true }
    expect(formatConnectionStatus(state)).toBe('Connection failed: Timeout')
  })

  it('formats disconnected state', () => {
    const state: RecoveryState = { status: 'disconnected', retryCount: 0, isAppActive: true }
    expect(formatConnectionStatus(state)).toBe('Disconnected')
  })
})

describe('connection status indicator presentation', () => {
  it('centralizes compact mobile indicator copy and surface tokens', () => {
    expect(CONNECTION_STATUS_INDICATOR_PRESENTATION.labels.connected).toBe('Connected')
    expect(CONNECTION_STATUS_INDICATOR_PRESENTATION.labels.failed).toBe('Connection failed')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.container.accessibilityRole).toBe('text')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.container.flexDirection).toBe('row')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.container.alignItems).toBe('center')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.dotContainer.position).toBe('relative')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.dot.position).toBe('absolute')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.dot.size).toBe(8)
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.dot.pulsingOpacity).toBe(1)
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse.position).toBe('absolute')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse.top).toBe(0)
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse.left).toBe(0)
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse.minOpacity).toBe(0.3)
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse.maxOpacity).toBe(0.8)
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.pulse.useNativeDriver).toBe(true)
    expect(getConnectionStatusIndicatorMobilePulseAnimationState()).toEqual({
      minOpacity: 0.3,
      maxOpacity: 0.8,
      durationMs: 800,
      useNativeDriver: true,
    })
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.statusColorTokenByStatus.connected).toBe('success')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.statusColorTokenByStatus.failed).toBe('destructive')
    expect(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile.text.colorToken).toBe('mutedForeground')
    expect(getConnectionStatusIndicatorMobileSurfaceState()).toBe(CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile)
    expect(getConnectionStatusIndicatorMobileSurfaceColors({
      destructive: '#dc2626',
      mutedForeground: '#737373',
      success: '#16a34a',
      warning: '#f59e0b',
    })).toEqual({
      textColor: '#737373',
      statusColorByStatus: {
        connected: '#16a34a',
        connecting: '#f59e0b',
        reconnecting: '#f59e0b',
        disconnected: '#737373',
        failed: '#dc2626',
      },
    })
  })

  it('formats compact status labels and pulse/color states', () => {
    expect(formatConnectionStatusIndicatorLabel('connected')).toBe('Connected')
    expect(formatConnectionStatusIndicatorLabel('connecting')).toBe('Connecting...')
    expect(formatConnectionStatusIndicatorLabel('reconnecting')).toBe('Reconnecting...')
    expect(formatConnectionStatusIndicatorLabel('reconnecting', 2)).toBe('Reconnecting (2)...')
    expect(formatConnectionStatusIndicatorLabel('disconnected')).toBe('Disconnected')
    expect(formatConnectionStatusIndicatorLabel('failed')).toBe('Connection failed')
    expect(isConnectionStatusIndicatorPulsing('connecting')).toBe(true)
    expect(isConnectionStatusIndicatorPulsing('reconnecting')).toBe(true)
    expect(isConnectionStatusIndicatorPulsing('connected')).toBe(false)
    expect(getConnectionStatusIndicatorMobileColorToken('connected')).toBe('success')
    expect(getConnectionStatusIndicatorMobileColorToken('connecting')).toBe('warning')
    expect(getConnectionStatusIndicatorMobileColorToken('disconnected')).toBe('mutedForeground')
    expect(getConnectionStatusIndicatorMobileColorToken('failed')).toBe('destructive')
    expect(getConnectionStatusIndicatorMobileVisualColors('failed', {
      destructive: '#dc2626',
      mutedForeground: '#737373',
      success: '#16a34a',
      warning: '#f59e0b',
    })).toEqual({
      dot: {
        backgroundColor: '#dc2626',
      },
      pulse: {
        backgroundColor: '#dc2626',
      },
      text: {
        color: '#737373',
      },
    })
    expect(getConnectionStatusIndicatorMobileRenderState({
      status: 'reconnecting',
      retryCount: 2,
      compact: false,
      colors: {
        destructive: '#dc2626',
        mutedForeground: '#737373',
        success: '#16a34a',
        warning: '#f59e0b',
      },
    })).toEqual({
      surface: CONNECTION_STATUS_INDICATOR_SURFACE_PRESENTATION.mobile,
      statusText: 'Reconnecting (2)...',
      accessibilityLabel: 'Reconnecting (2)...',
      accessibilityRole: 'text',
      isPulsing: true,
      shouldRenderPulse: true,
      shouldRenderText: true,
      colors: {
        dot: {
          backgroundColor: '#f59e0b',
        },
        pulse: {
          backgroundColor: '#f59e0b',
        },
        text: {
          color: '#737373',
        },
      },
      animation: {
        minOpacity: 0.3,
        maxOpacity: 0.8,
        durationMs: 800,
        useNativeDriver: true,
      },
    })
    expect(getConnectionStatusIndicatorMobileRenderState({
      status: 'connected',
      compact: true,
      colors: {
        destructive: '#dc2626',
        mutedForeground: '#737373',
        success: '#16a34a',
        warning: '#f59e0b',
      },
    })).toMatchObject({
      statusText: 'Connected',
      isPulsing: false,
      shouldRenderPulse: false,
      shouldRenderText: false,
    })
  })

  it('creates native mobile style slots and props parts from the shared indicator state', () => {
    const renderState = getConnectionStatusIndicatorMobileRenderState({
      status: 'connecting',
      compact: false,
      colors: {
        destructive: '#dc2626',
        mutedForeground: '#737373',
        success: '#16a34a',
        warning: '#f59e0b',
      },
    })
    const styleSlots = createConnectionStatusIndicatorMobileStyleSlots({ renderState })
    expect(createConnectionStatusIndicatorMobileStyleSheetSlots({ renderState })).toEqual(styleSlots)

    expect(styleSlots).toMatchObject({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      containerCompact: {
        paddingVertical: 2,
        paddingHorizontal: 4,
      },
      dotContainer: {
        position: 'relative',
        width: 10,
        height: 10,
        marginRight: 6,
      },
      dot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        top: 1,
        left: 1,
      },
      dotPulsing: {
        opacity: 1,
      },
      dotPulse: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        opacity: 0.3,
        top: 0,
        left: 0,
      },
      dotColor: {
        backgroundColor: '#f59e0b',
      },
      pulseColor: {
        backgroundColor: '#f59e0b',
      },
      text: {
        fontSize: 12,
        fontWeight: '500',
      },
      textColor: {
        color: '#737373',
      },
    })

    const pulseAnimatedStyle = { opacity: 'animated-opacity' }
    const propsParts = createConnectionStatusIndicatorMobilePropsParts({
      renderState,
      styles: styleSlots,
      pulseAnimatedStyle,
      compact: false,
    })

    expect(propsParts.container).toEqual({
      props: {
        style: [styleSlots.container, false],
        accessibilityLabel: 'Connecting...',
        accessibilityRole: 'text',
      },
    })
    expect(propsParts.dot.props.style).toEqual([
      styleSlots.dot,
      styleSlots.dotColor,
      styleSlots.dotPulsing,
    ])
    expect(propsParts.pulse?.props.style).toEqual([
      styleSlots.dotPulse,
      styleSlots.pulseColor,
      pulseAnimatedStyle,
    ])
    expect(propsParts.text).toEqual({
      text: 'Connecting...',
      props: {
        style: [styleSlots.text, styleSlots.textColor],
      },
    })
  })
})

// ── DEFAULT_RECOVERY_CONFIG ──────────────────────────────────────────────────

describe('DEFAULT_RECOVERY_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_RECOVERY_CONFIG.maxRetries).toBe(3)
    expect(DEFAULT_RECOVERY_CONFIG.initialDelayMs).toBe(1000)
    expect(DEFAULT_RECOVERY_CONFIG.maxDelayMs).toBe(10000)
    expect(DEFAULT_RECOVERY_CONFIG.heartbeatIntervalMs).toBe(30000)
    expect(DEFAULT_RECOVERY_CONFIG.connectionTimeoutMs).toBe(30000)
  })
})

// ── checkServerConnection ────────────────────────────────────────────────────

describe('checkServerConnection', () => {
  it('returns error for empty base URL', async () => {
    const result = await checkServerConnection('', 'key')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Base URL is required')
  })

  it('returns error for empty API key', async () => {
    const result = await checkServerConnection('https://api.openai.com/v1', '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('API Key is required')
  })

  it('returns error for whitespace-only API key', async () => {
    const result = await checkServerConnection('https://api.openai.com/v1', '   ')
    expect(result.success).toBe(false)
    expect(result.error).toContain('API Key is required')
  })
})

// ── delay ────────────────────────────────────────────────────────────────────

describe('delay', () => {
  it('resolves after specified time', async () => {
    const start = Date.now()
    await delay(50)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40) // allow some tolerance
  })
})
