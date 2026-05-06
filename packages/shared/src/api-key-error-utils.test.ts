import { describe, it, expect } from 'vitest'
import {
  isEmptyResponseError,
  isEmptyResponseErrorMessage,
  isLocalConfigurationErrorMessage,
  isMissingApiKeyErrorMessage,
  isRateLimitError,
  isRetryableLlmProviderError,
} from './api-key-error-utils'

describe('isMissingApiKeyErrorMessage', () => {
  it('returns true for "API key is required"', () => {
    expect(isMissingApiKeyErrorMessage('API key is required')).toBe(true)
  })

  it('returns true for "API key is required for openai"', () => {
    expect(isMissingApiKeyErrorMessage('API key is required for openai')).toBe(true)
  })

  it('returns true for "api key is required for groq" (case-insensitive)', () => {
    expect(isMissingApiKeyErrorMessage('api key is required for groq')).toBe(true)
  })

  it('returns true for "API key is required some-provider.v2"', () => {
    expect(isMissingApiKeyErrorMessage('API key is required some-provider.v2')).toBe(true)
  })

  it('returns false for unrelated error messages', () => {
    expect(isMissingApiKeyErrorMessage('Connection timed out')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isMissingApiKeyErrorMessage('')).toBe(false)
  })

  it('returns true when the message is embedded in a longer string', () => {
    expect(isMissingApiKeyErrorMessage('Error: API key is required for anthropic. Please configure it.')).toBe(true)
  })
})

describe('isLocalConfigurationErrorMessage', () => {
  it('includes missing API key messages', () => {
    expect(isLocalConfigurationErrorMessage('API key is required for openai')).toBe(true)
  })

  it('detects deterministic local provider configuration errors', () => {
    expect(isLocalConfigurationErrorMessage('Unknown provider: acme')).toBe(true)
    expect(isLocalConfigurationErrorMessage('Base URL is required')).toBe(true)
    expect(isLocalConfigurationErrorMessage('Access token is required')).toBe(true)
    expect(isLocalConfigurationErrorMessage('Session token is required')).toBe(true)
    expect(isLocalConfigurationErrorMessage('Remote API is not configured')).toBe(true)
  })

  it('leaves transient errors retryable by this classifier', () => {
    expect(isLocalConfigurationErrorMessage('Connection timed out')).toBe(false)
    expect(isLocalConfigurationErrorMessage('Rate limit exceeded')).toBe(false)
    expect(isLocalConfigurationErrorMessage('Empty response')).toBe(false)
  })
})

describe('isEmptyResponseErrorMessage', () => {
  it('detects empty provider response messages', () => {
    expect(isEmptyResponseErrorMessage('LLM returned empty response')).toBe(true)
    expect(isEmptyResponseErrorMessage('empty content from provider')).toBe(true)
    expect(isEmptyResponseErrorMessage('Provider returned no text')).toBe(true)
    expect(isEmptyResponseErrorMessage('Provider returned no content')).toBe(true)
  })

  it('leaves unrelated transient errors to other classifiers', () => {
    expect(isEmptyResponseErrorMessage('Connection timed out')).toBe(false)
    expect(isEmptyResponseErrorMessage('Rate limit exceeded')).toBe(false)
  })
})

describe('isEmptyResponseError', () => {
  it('detects Error objects with empty response messages', () => {
    expect(isEmptyResponseError(new Error('LLM returned empty response'))).toBe(true)
  })

  it('ignores non-Error values', () => {
    expect(isEmptyResponseError('LLM returned empty response')).toBe(false)
  })
})

describe('isRateLimitError', () => {
  it('detects structured 429 status errors', () => {
    expect(
      isRateLimitError(Object.assign(new Error('Too many requests'), { statusCode: 429 }))
    ).toBe(true)
    expect(
      isRateLimitError(Object.assign(new Error('Too many requests'), { status: 429 }))
    ).toBe(true)
  })

  it('detects message-based rate limit errors', () => {
    expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true)
    expect(isRateLimitError(new Error('Provider returned 429 Too Many Requests'))).toBe(true)
  })

  it('ignores non-rate-limit errors and non-Error values', () => {
    expect(isRateLimitError(new Error('Connection timed out'))).toBe(false)
    expect(
      isRateLimitError(Object.assign(new Error('Bad request'), { statusCode: 400 }))
    ).toBe(false)
    expect(isRateLimitError('Rate limit exceeded')).toBe(false)
  })
})

describe('isRetryableLlmProviderError', () => {
  it('rejects non-error values, aborts, and local configuration errors', () => {
    expect(isRetryableLlmProviderError('Network failed')).toBe(false)
    expect(
      isRetryableLlmProviderError(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
    ).toBe(false)
    expect(isRetryableLlmProviderError(new Error('API key is required for openai'))).toBe(false)
    expect(isRetryableLlmProviderError(new Error('Unknown provider: acme'))).toBe(false)
  })

  it('preserves empty-response retries even for structured 4xx errors', () => {
    expect(
      isRetryableLlmProviderError(
        Object.assign(new Error('LLM returned empty response'), { statusCode: 401 })
      )
    ).toBe(true)
  })

  it('honors explicit provider retryability after empty-response handling', () => {
    expect(
      isRetryableLlmProviderError(Object.assign(new Error('Bad request'), { isRetryable: false }))
    ).toBe(false)
    expect(
      isRetryableLlmProviderError(
        Object.assign(new Error('Transient provider issue'), { isRetryable: true })
      )
    ).toBe(true)
  })

  it('handles structured status codes with non-transient 4xx filtering', () => {
    expect(
      isRetryableLlmProviderError(Object.assign(new Error('Timeout'), { statusCode: 408 }))
    ).toBe(true)
    expect(
      isRetryableLlmProviderError(Object.assign(new Error('Too many requests'), { status: 429 }))
    ).toBe(true)
    expect(
      isRetryableLlmProviderError(Object.assign(new Error('Unauthorized'), { statusCode: 401 }))
    ).toBe(false)
    expect(
      isRetryableLlmProviderError(Object.assign(new Error('Server error'), { statusCode: 503 }))
    ).toBe(true)
  })

  it('only retries unstructured stream errors for known Codex transient signatures', () => {
    expect(
      isRetryableLlmProviderError(new Error('stream error while parsing provider payload'))
    ).toBe(false)
    expect(isRetryableLlmProviderError(new Error('ChatGPT Codex stream error'))).toBe(true)
    expect(isRetryableLlmProviderError(new Error('ChatGPT Codex response failed'))).toBe(true)
    expect(isRetryableLlmProviderError(new Error('ChatGPT Codex response.failed'))).toBe(true)
  })

  it('retries by default when no deterministic failure signal is present', () => {
    expect(isRetryableLlmProviderError(new Error('Connection timed out'))).toBe(true)
  })
})
