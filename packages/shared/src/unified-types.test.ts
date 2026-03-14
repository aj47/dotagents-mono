import { describe, it, expect } from 'vitest'
import type { ModelPreset } from './providers'
import type { QueuedMessage, MessageQueue } from './types'
import { RESPOND_TO_USER_TOOL } from './chat-utils'

/**
 * Type-level and runtime tests for unified types that serve as the single
 * source of truth across desktop, mobile, and shared packages.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Compile-time assertion that T is assignable. */
function assertType<T>(_value: T): void {
  // intentionally empty — compile-time check only
}

// ── ModelPreset ──────────────────────────────────────────────────────────────

describe('ModelPreset', () => {
  it('accepts a minimal preset (shared/mobile shape — no apiKey)', () => {
    const preset: ModelPreset = {
      id: 'builtin-openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
    }
    assertType<ModelPreset>(preset)
    expect(preset.id).toBe('builtin-openai')
    expect(preset.apiKey).toBeUndefined()
  })

  it('accepts a preset with apiKey (desktop shape)', () => {
    const preset: ModelPreset = {
      id: 'builtin-openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test-key',
      isBuiltIn: true,
    }
    assertType<ModelPreset>(preset)
    expect(preset.apiKey).toBe('sk-test-key')
  })

  it('accepts all desktop-specific fields as optional', () => {
    const preset: ModelPreset = {
      id: 'custom-1',
      name: 'Custom Provider',
      baseUrl: 'https://custom.api.com/v1',
      apiKey: 'key-123',
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mcpToolsModel: 'gpt-4o',
      transcriptProcessingModel: 'gpt-4o-mini',
      summarizationModel: 'gpt-3.5-turbo',
    }
    assertType<ModelPreset>(preset)
    expect(preset.mcpToolsModel).toBe('gpt-4o')
    expect(preset.summarizationModel).toBe('gpt-3.5-turbo')
  })

  it('accepts mobile shape with isBuiltIn as boolean', () => {
    const preset: ModelPreset = {
      id: 'builtin-groq',
      name: 'Groq',
      baseUrl: 'https://api.groq.com/v1',
      isBuiltIn: true,
    }
    assertType<ModelPreset>(preset)
    expect(preset.isBuiltIn).toBe(true)
  })

  it('accepts empty apiKey string (desktop convention)', () => {
    const preset: ModelPreset = {
      id: 'builtin-together',
      name: 'Together AI',
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: '',
      isBuiltIn: true,
    }
    assertType<ModelPreset>(preset)
    expect(preset.apiKey).toBe('')
  })
})

// ── QueuedMessage ────────────────────────────────────────────────────────────

describe('QueuedMessage', () => {
  it('accepts a basic queued message (shared shape)', () => {
    const msg: QueuedMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      text: 'Hello world',
      createdAt: Date.now(),
      status: 'pending',
    }
    assertType<QueuedMessage>(msg)
    expect(msg.status).toBe('pending')
    expect(msg.sessionId).toBeUndefined()
  })

  it('accepts a queued message with sessionId (desktop shape)', () => {
    const msg: QueuedMessage = {
      id: 'msg-2',
      conversationId: 'conv-1',
      sessionId: 'sess-42',
      text: 'A queued message',
      createdAt: Date.now(),
      status: 'processing',
    }
    assertType<QueuedMessage>(msg)
    expect(msg.sessionId).toBe('sess-42')
  })

  it('accepts all optional fields (errorMessage, addedToHistory)', () => {
    const msg: QueuedMessage = {
      id: 'msg-3',
      conversationId: 'conv-2',
      sessionId: 'sess-99',
      text: 'Failed message',
      createdAt: Date.now(),
      status: 'failed',
      errorMessage: 'Network error',
      addedToHistory: true,
    }
    assertType<QueuedMessage>(msg)
    expect(msg.errorMessage).toBe('Network error')
    expect(msg.addedToHistory).toBe(true)
  })

  it('supports all valid status values', () => {
    const statuses: QueuedMessage['status'][] = ['pending', 'processing', 'cancelled', 'failed']
    expect(statuses).toHaveLength(4)
  })
})

// ── MessageQueue ─────────────────────────────────────────────────────────────

describe('MessageQueue', () => {
  it('accepts a queue with messages', () => {
    const queue: MessageQueue = {
      conversationId: 'conv-1',
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          text: 'First',
          createdAt: Date.now(),
          status: 'pending',
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          sessionId: 'sess-1',
          text: 'Second',
          createdAt: Date.now(),
          status: 'processing',
        },
      ],
    }
    assertType<MessageQueue>(queue)
    expect(queue.messages).toHaveLength(2)
  })
})

// ── RESPOND_TO_USER_TOOL ─────────────────────────────────────────────────────

describe('RESPOND_TO_USER_TOOL', () => {
  it('equals "respond_to_user"', () => {
    expect(RESPOND_TO_USER_TOOL).toBe('respond_to_user')
  })

  it('is a string constant', () => {
    expect(typeof RESPOND_TO_USER_TOOL).toBe('string')
  })
})
