import { describe, it, expect } from 'vitest'
import {
  generateSessionId,
  generateMessageId,
  generateSessionTitle,
  generateConversationTitleFromMessage,
  normalizeConversationTitleText,
  sortSessionsByPinnedFirst,
  orderConversationHistoryByPinnedFirst,
  sanitizeSessionText,
  sessionToListItem,
  createSessionSearchSnippet,
  filterSessionSearchResults,
  filterSessionsByArchiveMode,
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

// ── generateConversationTitleFromMessage ─────────────────────────────────────

describe('generateConversationTitleFromMessage', () => {
  it('uses markdown image alt text for title generation', () => {
    expect(generateConversationTitleFromMessage('![Screen selection](assets://conversation-image/conv_1/image.png)'))
      .toBe('Screen selection')
  })

  it('falls back to Image for image-only messages without alt text', () => {
    expect(generateConversationTitleFromMessage('![](assets://conversation-image/conv_1/image.png)')).toBe('Image')
  })

  it('normalizes display image placeholders for direct data image titles', () => {
    expect(generateConversationTitleFromMessage('![](data:image/png;base64,abc)')).toBe('Image')
    expect(generateConversationTitleFromMessage('![diagram](data:image/png;base64,abc)')).toBe('Image: diagram')
  })

  it('truncates generated conversation titles with an ellipsis', () => {
    expect(generateConversationTitleFromMessage('a'.repeat(60), { maxChars: 50 })).toBe(`${'a'.repeat(50)}...`)
  })
})

// ── normalizeConversationTitleText ───────────────────────────────────────────

describe('normalizeConversationTitleText', () => {
  it('trims whitespace and surrounding quotes', () => {
    expect(normalizeConversationTitleText('  "Build mobile parity"  ')).toBe('Build mobile parity')
  })

  it('applies word and character limits', () => {
    expect(normalizeConversationTitleText('one two three four five', { maxWords: 3 })).toBe('one two three')
    expect(normalizeConversationTitleText('abcdefghijklmnopqrstuvwxyz', { maxChars: 10 })).toBe('abcdefghij')
  })

  it('sanitizes inline image payloads in titles', () => {
    expect(normalizeConversationTitleText('![diagram](data:image/png;base64,abc)')).toBe('[Image: diagram]')
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

// ── orderConversationHistoryByPinnedFirst ───────────────────────────────────

describe('orderConversationHistoryByPinnedFirst', () => {
  it('moves pinned sessions ahead while preserving each group existing order', () => {
    const sessions = [
      { id: 'session-4', updatedAt: 40 },
      { id: 'session-3', updatedAt: 30 },
      { id: 'session-2', updatedAt: 20 },
      { id: 'session-1', updatedAt: 10 },
    ]

    const ordered = orderConversationHistoryByPinnedFirst(
      sessions,
      new Set(['session-3', 'session-1']),
    )

    expect(ordered.map((session) => session.id)).toEqual([
      'session-3',
      'session-1',
      'session-4',
      'session-2',
    ])
  })

  it('returns the original array when no pinned session IDs are configured', () => {
    const sessions = [{ id: 'session-1' }, { id: 'session-2' }]

    expect(orderConversationHistoryByPinnedFirst(sessions, new Set())).toBe(sessions)
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

// ── session search helpers ──────────────────────────────────────────────────

function createSearchSession(overrides: Partial<Session>): Session {
  return {
    id: overrides.id ?? 'session-default',
    title: overrides.title ?? 'Untitled',
    createdAt: overrides.createdAt ?? 1,
    updatedAt: overrides.updatedAt ?? 1,
    isPinned: overrides.isPinned,
    isArchived: overrides.isArchived,
    messages: overrides.messages ?? [],
    serverConversationId: overrides.serverConversationId,
    metadata: overrides.metadata,
    serverMetadata: overrides.serverMetadata,
  }
}

describe('createSessionSearchSnippet', () => {
  it('surfaces context around a matching query', () => {
    const snippet = createSessionSearchSnippet(
      `Before ${'a'.repeat(80)} oranges ${'b'.repeat(80)} after`,
      'oranges',
      60,
    )

    expect(snippet).toContain('oranges')
    expect(snippet.startsWith('…')).toBe(true)
    expect(snippet.endsWith('…')).toBe(true)
  })

  it('sanitizes media payloads in snippets', () => {
    expect(createSessionSearchSnippet('Look ![pic](data:image/png;base64,abc)', 'image'))
      .toBe('Look [Image]')
  })
})

describe('filterSessionSearchResults', () => {
  it('returns all sessions in pinned-first recency order when the query is empty', () => {
    const results = filterSessionSearchResults([
      createSearchSession({ id: 'older', title: 'Older', updatedAt: 10 }),
      createSearchSession({ id: 'newer', title: 'Newer', updatedAt: 20 }),
      createSearchSession({ id: 'pinned', title: 'Pinned', updatedAt: 5, isPinned: true }),
    ], '   ')

    expect(results.map((item) => item.id)).toEqual(['pinned', 'newer', 'older'])
  })

  it('keeps pinned chats above newer unpinned matches', () => {
    const results = filterSessionSearchResults([
      createSearchSession({ id: 'fresh-unpinned', title: 'Project follow-up', updatedAt: 50 }),
      createSearchSession({ id: 'older-pinned', title: 'Pinned project notes', updatedAt: 10, isPinned: true }),
    ], 'project')

    expect(results.map((item) => item.id)).toEqual(['older-pinned', 'fresh-unpinned'])
  })

  it('matches loaded message text and surfaces a contextual snippet when the preview does not match', () => {
    const results = filterSessionSearchResults([
      createSearchSession({
        id: 'deep-match',
        title: 'Project notes',
        updatedAt: 30,
        messages: [
          { id: 'm1', role: 'user', content: 'Start project', timestamp: 1 },
          { id: 'm2', role: 'assistant', content: 'Remember to buy oranges before the next demo walkthrough.', timestamp: 2 },
          { id: 'm3', role: 'assistant', content: 'Done.', timestamp: 3 },
        ],
      }),
    ], 'oranges')

    expect(results).toHaveLength(1)
    expect(results[0]?.matchedField).toBe('message')
    expect(results[0]?.searchPreview).toContain('oranges')
  })

  it('matches stub sessions using cached server preview metadata', () => {
    const results = filterSessionSearchResults([
      createSearchSession({
        id: 'stub-session',
        title: 'Desktop sync',
        updatedAt: 40,
        serverConversationId: 'conv-1',
        serverMetadata: {
          messageCount: 8,
          lastMessage: 'Shared follow-up',
          preview: 'Need to revisit the Codex ACP setup tomorrow.',
        },
      }),
    ], 'codex')

    expect(results).toHaveLength(1)
    expect(results[0]?.matchedField).toBe('preview')
    expect(results[0]?.searchPreview).toContain('Codex ACP setup')
  })
})

describe('filterSessionsByArchiveMode', () => {
  it('keeps the normal chats list focused on unarchived sessions', () => {
    const results = filterSessionsByArchiveMode([
      createSearchSession({ id: 'active-chat', title: 'Active' }),
      createSearchSession({ id: 'archived-chat', title: 'Archived', isArchived: true }),
    ], 'active')

    expect(results.map((item) => item.id)).toEqual(['active-chat'])
  })

  it('keeps archived chats reachable for unarchive and delete actions', () => {
    const results = filterSessionsByArchiveMode([
      createSearchSession({ id: 'active-chat', title: 'Active' }),
      createSearchSession({ id: 'archived-chat', title: 'Archived', isArchived: true }),
    ], 'archived')

    expect(results.map((item) => item.id)).toEqual(['archived-chat'])
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
