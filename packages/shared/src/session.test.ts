import { describe, it, expect } from 'vitest'
import {
  generateSessionId,
  generateMessageId,
  generateSessionTitle,
  orderItemsByPinnedFirst,
  sanitizeSessionIdList,
  setSessionIdMembership,
  sortSessionsByPinnedFirst,
  sanitizeSessionText,
  sessionToListItem,
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

// ── orderItemsByPinnedFirst ──────────────────────────────────────────────────

describe('orderItemsByPinnedFirst', () => {
  it('moves pinned items to the front while preserving each group order', () => {
    const ordered = orderItemsByPinnedFirst(
      [
        { id: 'session-4', isPinned: false },
        { id: 'session-3', isPinned: true },
        { id: 'session-2', isPinned: false },
        { id: 'session-1', isPinned: true },
      ],
      (session) => session.isPinned,
    )

    expect(ordered.map((session) => session.id)).toEqual([
      'session-3',
      'session-1',
      'session-4',
      'session-2',
    ])
  })

  it('returns a shallow copy when every item is in the same pin group', () => {
    const sessions = [{ id: 'session-1' }, { id: 'session-2' }]
    const ordered = orderItemsByPinnedFirst(sessions, () => false)

    expect(ordered).toEqual(sessions)
    expect(ordered).not.toBe(sessions)
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

// ── sanitizeSessionIdList ────────────────────────────────────────────────────

describe('sanitizeSessionIdList', () => {
  it('returns only string entries from array input', () => {
    expect(
      sanitizeSessionIdList(['session-1', 2, null, 'session-2'])
    ).toEqual(['session-1', 'session-2'])
  })

  it('returns an empty array for non-array input', () => {
    expect(sanitizeSessionIdList('session-1')).toEqual([])
  })
})

// ── setSessionIdMembership ───────────────────────────────────────────────────

describe('setSessionIdMembership', () => {
  it('adds missing session ids when enabling membership', () => {
    expect(
      setSessionIdMembership(['session-1'], 'session-2', true)
    ).toEqual(['session-1', 'session-2'])
  })

  it('removes existing session ids when disabling membership', () => {
    expect(
      setSessionIdMembership(['session-1', 'session-2'], 'session-1', false)
    ).toEqual(['session-2'])
  })

  it('does not duplicate ids when enabling an existing membership', () => {
    expect(
      setSessionIdMembership(['session-1'], 'session-1', true)
    ).toEqual(['session-1'])
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
