import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryService } from './memory-service'
import { ServiceContainer, ServiceTokens } from './service-container'
import { MockPathResolver } from './testing/mock-path-resolver'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('MemoryService', () => {
  let testDir: string
  let container: ServiceContainer

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-test-'))
    const globalAgentsDir = path.join(testDir, '.agents')
    fs.mkdirSync(path.join(globalAgentsDir, 'memories'), { recursive: true })

    // Set up the container with a mock path resolver
    container = new ServiceContainer()
    container.register(ServiceTokens.PathResolver, new MockPathResolver(testDir))
  })

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  describe('createMemoryFromSummary', () => {
    it('returns null for empty summary', () => {
      const service = new MemoryService()
      const result = service.createMemoryFromSummary({
        sessionId: 'test-session',
        memoryCandidates: [],
        decisionsMade: [],
        keyFindings: [],
        tags: [],
      } as any)
      expect(result).toBeNull()
    })

    it('creates memory from valid summary with durable candidates', () => {
      const service = new MemoryService()
      const result = service.createMemoryFromSummary({
        sessionId: 'test-session',
        memoryCandidates: ['preference: dark mode enabled'],
        decisionsMade: [],
        keyFindings: ['User prefers dark mode'],
        tags: ['ui'],
      } as any)
      expect(result).not.toBeNull()
      expect(result?.content).toContain('preference: dark mode enabled')
      expect(result?.tags).toContain('preference')
      expect(result?.tags).toContain('ui')
    })

    it('creates memory from decisions when no candidates', () => {
      const service = new MemoryService()
      const result = service.createMemoryFromSummary({
        sessionId: 'test-session',
        memoryCandidates: [],
        decisionsMade: ['Chose TypeScript over JavaScript'],
        keyFindings: [],
        tags: [],
      } as any)
      expect(result).not.toBeNull()
      expect(result?.content).toContain('Chose TypeScript over JavaScript')
    })

    it('creates memory from key findings as fallback', () => {
      const service = new MemoryService()
      const result = service.createMemoryFromSummary({
        sessionId: 'test-session',
        memoryCandidates: [],
        decisionsMade: [],
        keyFindings: ['The API rate limit is 100 req/min'],
        tags: [],
      } as any)
      expect(result).not.toBeNull()
      expect(result?.content).toContain('API rate limit')
    })
  })
})
