import { describe, it, expect, beforeEach, vi } from 'vitest'
import { findBestModelMatch } from './models-dev-service'
import { ServiceContainer, ServiceTokens } from './service-container'
import { MockPathResolver } from './testing/mock-path-resolver'

// We need to mock the internal state for findBestModelMatch
// Since it reads from in-memory cache, we test the normalizeModelName and matching logic

describe('models-dev-service', () => {
  describe('findBestModelMatch', () => {
    it('returns undefined when cache is not loaded', () => {
      // By default, in-memory cache is null
      const result = findBestModelMatch('gpt-4o')
      expect(result).toBeUndefined()
    })
  })
})
