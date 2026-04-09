import { describe, it, expect, vi } from 'vitest'
import {
  calculateBackoff,
  isRetryableError,
  normalizeApiBaseUrl,
  delay,
  formatConnectionStatus,
  DEFAULT_RECOVERY_CONFIG,
  checkServerConnection,
  checkDotAgentsServerConnection,
} from './connection-recovery'
import type { RecoveryState, ConnectionStatus } from './connection-recovery'

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

// ── checkDotAgentsServerConnection ──────────────────────────────────────────

describe('checkDotAgentsServerConnection', () => {
  it('returns error for empty base URL', async () => {
    const result = await checkDotAgentsServerConnection('', 'key')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Base URL is required')
  })

  it('returns error for empty API key', async () => {
    const result = await checkDotAgentsServerConnection('https://example.com/v1', '')
    expect(result.success).toBe(false)
    expect(result.error).toContain('API Key is required')
  })

  it('reports a missing DotAgents settings API as an invalid backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ error: 'Not found' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await checkDotAgentsServerConnection('https://example.com/v1', 'test-key')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/settings',
      expect.objectContaining({ method: 'GET' })
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('/v1/settings')

    vi.unstubAllGlobals()
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
