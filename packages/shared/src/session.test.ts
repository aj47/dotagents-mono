import { describe, it, expect } from 'vitest'
import {
  generateSessionId,
  generateMessageId,
  generateSessionTitle,
  sortSessionsByPinnedFirst,
  sanitizeSessionText,
  sessionToListItem,
  buildConversationPreview,
  isStubSession,
} from './session'
import type { Session } from './session'

// ── generateSessionId ────────────────────────────────────────────────────────

describe('generateSessionId', () => {
  it('returns a string starting with "session_"', () => {
    const id = generateSessionId()
    expect(id).toMatch(/^session_/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateSessionId()))
    expect(ids.size).toBe(20)
  })

  it('contains a timestamp component', () => {
    const id = generateSessionId()
    const parts = id.split('_')
    expect(parts.length).toBe(3)
    const timestamp = Number(parts[1])
    expect(timestamp).toBeGreaterThan(0)
    expect(timestamp).toBeLessThanOrEqual(Date.now())
  })
})

// ── generateMessageId ────────────────────────────────────────────────────────

describe('generateMessageId', () => {
  it('returns a string starting with "msg_"', () => {
    expect(generateMessageId()).toMatch(/^msg_/)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateMessageId()))
    expect(ids.size).toBe(20)
  })
})

// ── generateSessionTitle ─────────────────────────────────────────────────────

describe('generateSessionTitle', () => {
  it('returns "New Chat" for empty message', () => {
    expect(generateSessionTitle('')).toBe('New Chat')
  })

  it('returns trimmed message when short', () => {
    expect(generateSessionTitle('Hello there!')).toBe('Hello there!')
  })

  it('truncates long messages with ellipsis', () => {
    const longMsg = 'a'.repeat(60)
    const title = generateSessionTitle(longMsg)
    expect(title.length).toBeLessThanOrEqual(50)
    expect(title).toContain('...')
  })

  it('sanitizes markdown images in title', () => {
    const msg = 'Check this out ![img](data:image/png;base64,abc123) cool'
    const title = generateSessionTitle(msg)
    expect(title).toContain('[Image]')
    expect(title).not.toContain('data:image')
  })
})

// ── sortSessionsByPinnedFirst ────────────────────────────────────────────────

describe('sortSessionsByPinnedFirst', () => {
  it('returns empty array for empty input', () => {
    expect(sortSessionsByPinnedFirst([])).toEqual([])
  })

  it('sorts pinned sessions before unpinned', () => {
    const sessions = [
      { updatedAt: 100, isPinned: false },
      { updatedAt: 200, isPinned: true },
      { updatedAt: 300, isPinned: false },
    ]
    const sorted = sortSessionsByPinnedFirst(sessions)
    expect(sorted[0].isPinned).toBe(true)
    expect(sorted[0].updatedAt).toBe(200)
  })

  it('sorts by updatedAt within the same pin group', () => {
    const sessions = [
      { updatedAt: 100, isPinned: false },
      { updatedAt: 300, isPinned: false },
      { updatedAt: 200, isPinned: false },
    ]
    const sorted = sortSessionsByPinnedFirst(sessions)
    expect(sorted[0].updatedAt).toBe(300)
    expect(sorted[1].updatedAt).toBe(200)
    expect(sorted[2].updatedAt).toBe(100)
  })

  it('does not mutate the original array', () => {
    const sessions = [
      { updatedAt: 100, isPinned: false },
      { updatedAt: 200, isPinned: true },
    ]
    const original = [...sessions]
    sortSessionsByPinnedFirst(sessions)
    expect(sessions).toEqual(original)
  })
})

// ── sanitizeSessionText ──────────────────────────────────────────────────────

describe('sanitizeSessionText', () => {
  it('returns trimmed text', () => {
    expect(sanitizeSessionText('  hello  ')).toBe('hello')
  })

  it('collapses whitespace', () => {
    expect(sanitizeSessionText('hello   world\n\ntest')).toBe('hello world test')
  })

  it('replaces markdown images with [Image]', () => {
    expect(sanitizeSessionText('See ![pic](https://example.com/img.png) here')).toBe('See [Image] here')
  })

  it('replaces data URL images with [Image]', () => {
    expect(sanitizeSessionText('![](data:image/png;base64,abc)')).toBe('[Image]')
  })

  it('replaces markdown video links with [Video]', () => {
    expect(sanitizeSessionText('Watch [demo](assets://conversation-video/conv_1/abcdef1234567890.mp4) now')).toBe('Watch [Video] now')
  })
})

// ── sessionToListItem ────────────────────────────────────────────────────────

describe('sessionToListItem', () => {
  it('converts a session with messages to list item', () => {
    const session: Session = {
      id: 'test-1',
      title: 'Test Session',
      createdAt: 1000,
      updatedAt: 2000,
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1000 },
        { id: 'msg-2', role: 'assistant', content: 'Hi there', timestamp: 1500 },
      ],
    }
    const item = sessionToListItem(session)
    expect(item.id).toBe('test-1')
    expect(item.title).toBe('Test Session')
    expect(item.messageCount).toBe(2)
    expect(item.lastMessage).toBe('Hi there')
  })

  it('ignores internal respond_to_user wrapper messages when deriving list preview', () => {
    const session: Session = {
      id: 'test-respond-to-user',
      title: 'Test Session',
      createdAt: 1000,
      updatedAt: 2000,
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1000 },
        { id: 'msg-2', role: 'assistant', content: '', timestamp: 1100, toolCalls: [{ name: 'respond_to_user', arguments: { text: 'Hi there' } }] },
        { id: 'msg-3', role: 'tool', content: '[respond_to_user] {"success":true}', timestamp: 1200 },
        { id: 'msg-4', role: 'assistant', content: 'Hi there', timestamp: 1300 },
      ],
    }
    const item = sessionToListItem(session)
    expect(item.lastMessage).toBe('Hi there')
    expect(item.preview).toBe('Hi there')
  })

  it('uses serverMetadata for stub sessions', () => {
    const session: Session = {
      id: 'stub-1',
      title: 'Stub Session',
      createdAt: 1000,
      updatedAt: 2000,
      messages: [],
      serverMetadata: {
        messageCount: 5,
        lastMessage: 'Last message',
        preview: 'Preview text',
      },
    }
    const item = sessionToListItem(session)
    expect(item.messageCount).toBe(5)
    expect(item.lastMessage).toBe('Last message')
    expect(item.preview).toBe('Preview text')
  })
})

// ── buildConversationPreview ────────────────────────────────────────────────

describe('buildConversationPreview', () => {
  it('builds a role-prefixed preview from the first three messages', () => {
    expect(buildConversationPreview([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'Tell me more' },
      { role: 'assistant', content: 'Hidden fourth message' },
    ])).toBe('user: Hello | assistant: Hi there | user: Tell me more')
  })

  it('sanitizes media payloads before truncating message snippets', () => {
    expect(buildConversationPreview([
      { role: 'user', content: 'Look ![pic](data:image/png;base64,abc)' },
      { role: 'assistant', content: 'Watch [clip](assets://conversation-video/conv_1/demo.mp4)' },
    ])).toBe('user: Look [Image] | assistant: Watch [Video]')
  })

  it('honors message and preview length limits', () => {
    expect(buildConversationPreview([
      { role: 'user', content: 'abcdef' },
      { role: 'assistant', content: 'ghijkl' },
    ], {
      maxMessageChars: 3,
      maxPreviewChars: 20,
    })).toBe('user: abc | assistan...')
  })
})

// ── isStubSession ────────────────────────────────────────────────────────────

describe('isStubSession', () => {
  it('returns false for session with messages', () => {
    const session: Session = {
      id: 'test',
      title: 'Test',
      createdAt: 0,
      updatedAt: 0,
      messages: [{ id: 'msg-1', role: 'user', content: 'Hi', timestamp: 0 }],
    }
    expect(isStubSession(session)).toBe(false)
  })

  it('returns true for stub session with server metadata', () => {
    const session: Session = {
      id: 'test',
      title: 'Test',
      createdAt: 0,
      updatedAt: 0,
      messages: [],
      serverConversationId: 'conv-1',
      serverMetadata: { messageCount: 3, lastMessage: 'Hi', preview: 'Preview' },
    }
    expect(isStubSession(session)).toBe(true)
  })

  it('returns false for empty session without server info', () => {
    const session: Session = {
      id: 'test',
      title: 'Test',
      createdAt: 0,
      updatedAt: 0,
      messages: [],
    }
    expect(isStubSession(session)).toBe(false)
  })
})
