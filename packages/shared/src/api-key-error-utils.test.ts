import { describe, it, expect } from 'vitest'
import {
  isEmptyResponseError,
  isEmptyResponseErrorMessage,
  isLocalConfigurationErrorMessage,
  isMissingApiKeyErrorMessage,
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
