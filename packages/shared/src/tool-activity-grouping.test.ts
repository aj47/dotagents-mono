import { describe, it, expect } from 'vitest'
import {
  getToolActivitySummaryLine,
  groupToolActivity,
  TOOL_GROUP_PREVIEW_COUNT,
  TOOL_GROUP_MIN_SIZE,
  type GroupableMessage,
} from './tool-activity-grouping'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const userMsg = (content = 'hello'): GroupableMessage => ({ role: 'user', content })
const assistantMsg = (content = 'Sure, here is the answer.'): GroupableMessage => ({ role: 'assistant', content })
const toolOnlyAssistant = (toolNames: string[]): GroupableMessage => ({
  role: 'assistant',
  content: '',
  toolCalls: toolNames.map((name) => ({ name, arguments: {} })),
})
const toolResultMsg = (success = true): GroupableMessage => ({
  role: 'tool',
  content: 'result',
  toolResults: [{ success, content: 'ok', error: success ? undefined : 'fail' }],
})
const respondToUserMsg = (): GroupableMessage => ({
  role: 'assistant',
  content: '',
  toolCalls: [{ name: 'respond_to_user', arguments: { text: 'Hi!' } }],
})

describe('getToolActivitySummaryLine', () => {
  it('summarises tool calls', () => {
    expect(getToolActivitySummaryLine(toolOnlyAssistant(['read_file', 'write_file'])))
      .toBe('🔧 read_file, write_file')
  })

  it('summarises successful tool results', () => {
    expect(getToolActivitySummaryLine(toolResultMsg(true))).toBe('✅ 1 result')
  })

  it('summarises failed tool results', () => {
    expect(getToolActivitySummaryLine(toolResultMsg(false))).toBe('⚠️ 1 result')
  })
})

// ---------------------------------------------------------------------------
// groupToolActivity
// ---------------------------------------------------------------------------

describe('groupToolActivity', () => {
  it('returns no groups for an empty list', () => {
    const { groups } = groupToolActivity([])
    expect(groups).toHaveLength(0)
  })

  it('does not group a single tool message', () => {
    const { groups } = groupToolActivity([toolOnlyAssistant(['read_file'])])
    expect(groups).toHaveLength(0)
  })

  it('groups consecutive tool-only messages', () => {
    const msgs: GroupableMessage[] = [
      userMsg(),
      toolOnlyAssistant(['read_file']),
      toolResultMsg(),
      toolOnlyAssistant(['write_file']),
      assistantMsg('Done!'),
    ]
    const { groups, groupByIndex } = groupToolActivity(msgs)
    expect(groups).toHaveLength(1)
    expect(groups[0].startIndex).toBe(1)
    expect(groups[0].endIndex).toBe(3)
    expect(groups[0].count).toBe(3)
    expect(groupByIndex.has(0)).toBe(false) // user
    expect(groupByIndex.has(4)).toBe(false) // final assistant
    expect(groupByIndex.get(1)).toBe(groups[0])
    expect(groupByIndex.get(2)).toBe(groups[0])
    expect(groupByIndex.get(3)).toBe(groups[0])
  })

  it('breaks group at user messages', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['a']),
      toolResultMsg(),
      userMsg(),
      toolOnlyAssistant(['b']),
      toolResultMsg(),
    ]
    const { groups } = groupToolActivity(msgs)
    expect(groups).toHaveLength(2)
    expect(groups[0].endIndex).toBe(1)
    expect(groups[1].startIndex).toBe(3)
  })

  it('preview shows last N entries for the trailing tool group only', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['step1']),
      toolResultMsg(),
      toolOnlyAssistant(['step2']),
      toolResultMsg(),
      toolOnlyAssistant(['step3']),
    ]
    const { groups } = groupToolActivity(msgs)
    expect(groups).toHaveLength(1)
    expect(groups[0].previewLines).toHaveLength(TOOL_GROUP_PREVIEW_COUNT)
    // Should be the LAST 3 entries
    expect(groups[0].previewLines[0]).toContain('step2')
    expect(groups[0].previewLines[2]).toContain('step3')
  })

  it('does not show preview lines once a later assistant response exists', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['read_file']),
      toolResultMsg(),
      assistantMsg('Done!'),
    ]

    const { groups } = groupToolActivity(msgs)

    expect(groups).toHaveLength(1)
    expect(groups[0].previewLines).toEqual([])
  })

  it('only previews the most recent pending tool run when multiple groups exist', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['first']),
      toolResultMsg(),
      assistantMsg('First done'),
      toolOnlyAssistant(['second-1']),
      toolResultMsg(),
      toolOnlyAssistant(['second-2']),
    ]

    const { groups } = groupToolActivity(msgs)

    expect(groups).toHaveLength(2)
    expect(groups[0].previewLines).toEqual([])
    expect(groups[1].previewLines).toHaveLength(TOOL_GROUP_PREVIEW_COUNT)
    expect(groups[1].previewLines[0]).toContain('second-1')
    expect(groups[1].previewLines[2]).toContain('second-2')
  })

  it('does not group assistant messages with real content', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['a']),
      assistantMsg('Here is the answer'),
      toolOnlyAssistant(['b']),
    ]
    const { groups } = groupToolActivity(msgs)
    // Each side of the real-content assistant is only 1 message, below min size
    expect(groups).toHaveLength(0)
  })

  it('constants have expected values', () => {
    expect(TOOL_GROUP_PREVIEW_COUNT).toBe(3)
    expect(TOOL_GROUP_MIN_SIZE).toBe(2)
  })

  it('breaks group at respond_to_user messages', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['a']),
      toolResultMsg(),
      respondToUserMsg(),
      toolOnlyAssistant(['b']),
      toolResultMsg(),
    ]
    const { groups } = groupToolActivity(msgs)
    expect(groups).toHaveLength(2)
  })
})
