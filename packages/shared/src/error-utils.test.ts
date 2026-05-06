import { describe, expect, it } from 'vitest'

import { cleanErrorMessage, getErrorMessage, normalizeError } from './error-utils'

describe('error-utils', () => {
  it('returns fallback for nullish thrown values', () => {
    expect(getErrorMessage(null, 'Fallback message')).toBe('Fallback message')
    expect(getErrorMessage(undefined, 'Fallback message')).toBe('Fallback message')
  })

  it('keeps explicit non-nullish error strings', () => {
    expect(getErrorMessage('Network timeout', 'Fallback message')).toBe('Network timeout')
  })

  it('unwraps nested error objects to show the user-facing message', () => {
    expect(
      getErrorMessage({ error: { message: 'Invalid API key' } }, 'Fallback message'),
    ).toBe('Invalid API key')
  })

  it('falls back to cause and errors arrays when top-level messages are empty', () => {
    const errorWithCause = new Error('') as Error & { cause?: unknown }
    errorWithCause.cause = new Error('Tunnel connection failed')
    const aggregateLikeError = { errors: [{ message: 'Primary provider unavailable' }] }

    expect(getErrorMessage(errorWithCause, 'Fallback message')).toBe('Tunnel connection failed')
    expect(getErrorMessage(aggregateLikeError, 'Fallback message')).toBe('Primary provider unavailable')
  })

  it('uses the fallback when Error.cause forms a cycle', () => {
    const error = new Error('') as Error & { cause?: unknown }
    error.cause = error

    expect(getErrorMessage(error, 'Fallback message')).toBe('Fallback message')
  })

  it('skips cyclic Error.errors entries and still finds later nested messages', () => {
    const error = new Error('') as Error & { errors?: unknown[] }
    error.errors = [error, new Error('Primary provider unavailable')]

    expect(getErrorMessage(error, 'Fallback message')).toBe('Primary provider unavailable')
  })

  it('uses the fallback when a blank Error only stringifies to its constructor name', () => {
    expect(getErrorMessage(new Error(''), 'Fallback message')).toBe('Fallback message')
    expect(getErrorMessage(new TypeError(''), 'Fallback message')).toBe('Fallback message')
  })

  it('normalizes nullish values to Error with fallback message', () => {
    const normalizedNull = normalizeError(null, 'Request failed')
    const normalizedUndefined = normalizeError(undefined, 'Request failed')

    expect(normalizedNull).toBeInstanceOf(Error)
    expect(normalizedNull.message).toBe('Request failed')
    expect(normalizedUndefined).toBeInstanceOf(Error)
    expect(normalizedUndefined.message).toBe('Request failed')
  })

  it('normalizes nested error objects to a readable Error message', () => {
    const normalized = normalizeError({ error: { message: 'Provider returned 401' } }, 'Request failed')

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized.message).toBe('Provider returned 401')
  })

  it('rewraps blank Error instances with a readable nested cause message', () => {
    const original = new TypeError('') as TypeError & { cause?: unknown }
    original.cause = new Error('Streaming request failed')

    const normalized = normalizeError(original, 'Fallback message')

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized).not.toBe(original)
    expect(normalized.name).toBe('TypeError')
    expect(normalized.message).toBe('Streaming request failed')
    expect((normalized as Error & { cause?: unknown }).cause).toBe(original)
  })

  it('rewraps blank Error instances with the fallback message when no nested details exist', () => {
    const original = new Error('')

    const normalized = normalizeError(original, 'Fallback message')

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized).not.toBe(original)
    expect(normalized.message).toBe('Fallback message')
    expect((normalized as Error & { cause?: unknown }).cause).toBe(original)
  })

  it('cleans stack traces from user-facing error messages', () => {
    expect(cleanErrorMessage([
      'CodeExecutionTimeoutError: Code execution timed out',
      '    at run (/tmp/tool.ts:12:3)',
      '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
      '',
      'Additional context',
    ].join('\n'))).toBe('CodeExecutionTimeoutError: Code execution timed out\nAdditional context')
  })

  it('collapses duplicated error class prefixes and truncates long messages', () => {
    expect(cleanErrorMessage('ProviderError: ProviderError: unavailable')).toBe('ProviderError: unavailable')

    const cleaned = cleanErrorMessage('x'.repeat(600))
    expect(cleaned).toHaveLength(503)
    expect(cleaned.endsWith('...')).toBe(true)
  })
})
