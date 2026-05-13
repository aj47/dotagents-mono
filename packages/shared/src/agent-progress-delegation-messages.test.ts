import { describe, expect, it } from 'vitest'
import {
  createAgentDelegationProgressMessages,
  formatAgentDelegationConversationTranscript,
  formatAgentDelegationConversationTimestamp,
  getAgentDelegationCardState,
  getAgentDelegationConversationMessageDisplayState,
  getAgentDelegationConversationMessageRoleState,
  getAgentDelegationConversationPreview,
  getAgentDelegationConversationPreviewState,
  getAgentDelegationConversationPreviewRows,
  getAgentDelegationConversationRenderItems,
  getAgentDelegationSummaryEntries,
  getAgentDelegationToolPreviewState,
  isAgentDelegationActiveStatus,
  type ACPSubAgentMessage,
  type AgentProgressStep,
} from './agent-progress'

describe('createAgentDelegationProgressMessages', () => {
  it('keeps the latest update for each delegated run and surfaces status details', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-1-start',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 100,
        delegation: {
          runId: 'run-1',
          agentName: 'Planner',
          task: 'Draft a plan',
          status: 'running',
          progressMessage: 'Searching sources',
          startTime: 100,
        },
      },
      {
        id: 'delegation-1-done',
        type: 'thinking',
        title: 'Delegating',
        status: 'completed',
        timestamp: 200,
        delegation: {
          runId: 'run-1',
          agentName: 'Planner',
          task: 'Draft a plan',
          status: 'completed',
          resultSummary: 'Built a 5-step plan',
          startTime: 100,
          endTime: 200,
        },
      },
      {
        id: 'delegation-2-fail',
        type: 'thinking',
        title: 'Delegating',
        status: 'error',
        timestamp: 210,
        delegation: {
          runId: 'run-2',
          agentName: 'Research',
          task: 'Find latest changelog',
          status: 'failed',
          error: 'Timeout',
          startTime: 205,
          endTime: 210,
        },
      },
    ]

    const messages = createAgentDelegationProgressMessages(steps)

    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({
      id: 'delegation-run-1',
      role: 'assistant',
      variant: 'delegation',
      timestamp: 200,
      delegation: {
        runId: 'run-1',
        agentName: 'Planner',
      },
    })
    expect(messages[0]?.content).toContain('Delegated to Planner · Completed')
    expect(messages[0]?.content).toContain('Built a 5-step plan')
    expect(messages[1]?.content).toContain('Delegated to Research · Failed')
    expect(messages[1]?.content).toContain('Timeout')
  })

  it('normalizes structured and legacy delegated tool metadata into one renderable stream', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-mixed',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 500,
        delegation: {
          runId: 'run-mixed',
          agentName: 'Worker',
          task: 'Investigate issue',
          status: 'running',
          startTime: 500,
          conversation: [
            {
              role: 'assistant',
              content: '',
              toolCalls: [
                { name: 'rg', arguments: { pattern: 'subagent' } },
                { name: 'read_file', arguments: { path: 'README.md' } },
              ],
              toolResults: [{ success: true, content: '1 hit' }],
              timestamp: 501,
            },
            {
              role: 'tool',
              content: 'Using tool: ls\nInput: {"path":"."}',
              timestamp: 502,
            },
            {
              role: 'tool',
              content: 'Tool result: {"files":["README.md"]}',
              timestamp: 503,
            },
          ],
        },
      },
    ]

    const messages = createAgentDelegationProgressMessages(steps)

    expect(messages[0]?.toolCalls).toEqual([
      { name: 'rg', arguments: { pattern: 'subagent' } },
      { name: 'read_file', arguments: { path: 'README.md' } },
      { name: 'ls', arguments: { path: '.' } },
    ])
    expect(messages[0]?.toolResults).toEqual([
      { success: true, content: '1 hit', error: undefined },
      { success: true, content: '{"files":["README.md"]}', error: undefined },
    ])
    expect(messages[0]?.toolExecutions).toEqual([
      { toolCall: { name: 'rg', arguments: { pattern: 'subagent' } }, result: { success: true, content: '1 hit', error: undefined } },
      { toolCall: { name: 'read_file', arguments: { path: 'README.md' } } },
      { toolCall: { name: 'ls', arguments: { path: '.' } }, result: { success: true, content: '{"files":["README.md"]}', error: undefined } },
    ])
  })

  it('keeps legacy tool messages with metadata and empty content pending', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'delegation-pending-legacy-tool',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 700,
        delegation: {
          runId: 'run-pending-legacy-tool',
          agentName: 'Worker',
          task: 'Run tool',
          status: 'running',
          startTime: 700,
          conversation: [
            {
              role: 'tool',
              toolName: 'read_file',
              toolInput: { path: 'README.md' },
              content: '',
              timestamp: 701,
            },
          ],
        },
      },
    ]

    const messages = createAgentDelegationProgressMessages(steps)

    expect(messages[0]?.toolCalls).toEqual([
      { name: 'read_file', arguments: { path: 'README.md' } },
    ])
    expect(messages[0]?.toolResults).toBeUndefined()
    expect(messages[0]?.toolExecutions).toEqual([
      { toolCall: { name: 'read_file', arguments: { path: 'README.md' } } },
    ])
  })

  it('builds shared delegated conversation render items for mixed message and tool rows', () => {
    const conversation: ACPSubAgentMessage[] = [
      {
        role: 'assistant',
        content: 'I am checking the renderer layout.',
        toolCalls: [{ name: 'rg', arguments: { pattern: 'SubAgentConversationPanel' } }],
        toolResults: [{ success: true, content: '1 hit' }],
        timestamp: 801,
      },
      {
        role: 'tool',
        content: 'Using tool: ls\nInput: {"path":"apps/mobile"}',
        timestamp: 802,
      },
      {
        role: 'tool',
        content: 'Tool result: listed files',
        timestamp: 803,
      },
    ]

    expect(getAgentDelegationConversationRenderItems(conversation, 'running')).toEqual([
      {
        kind: 'message',
        key: 'msg-structured-0',
        message: conversation[0],
      },
      {
        kind: 'tool_execution',
        key: 'tool-structured-0',
        execution: {
          timestamp: 801,
          calls: [{ name: 'rg', arguments: { pattern: 'SubAgentConversationPanel' } }],
          results: [{ success: true, content: '1 hit', error: undefined }],
        },
      },
      {
        kind: 'tool_execution',
        key: 'tool-1-2',
        execution: {
          timestamp: 803,
          calls: [{ name: 'ls', arguments: { path: 'apps/mobile' } }],
          results: [{ success: true, content: 'listed files', error: undefined }],
        },
      },
    ])
  })

  it('uses terminal delegated status to stop pending tool spinners without captured results', () => {
    const conversation: ACPSubAgentMessage[] = [
      {
        role: 'tool',
        content: 'Using tool: read_file\nInput: {"path":"README.md"}',
        timestamp: 901,
      },
    ]

    expect(getAgentDelegationConversationRenderItems(conversation, 'running')[0]).toEqual({
      kind: 'tool_execution',
      key: 'tool-0',
      execution: {
        timestamp: 901,
        calls: [{ name: 'read_file', arguments: { path: 'README.md' } }],
        results: [undefined],
      },
    })

    expect(getAgentDelegationConversationRenderItems(conversation, 'failed')[0]).toEqual({
      kind: 'tool_execution',
      key: 'tool-0',
      execution: {
        timestamp: 901,
        calls: [{ name: 'read_file', arguments: { path: 'README.md' } }],
        results: [{
          success: false,
          content: '',
          error: 'Delegation failed before a tool result was captured.',
        }],
      },
    })
  })

  it('shares delegated conversation role labels and transcript formatting', () => {
    const conversation: ACPSubAgentMessage[] = [
      { role: 'user', content: 'Inspect the chat surface.', timestamp: 1 },
      { role: 'assistant', content: 'Checking the shared render state.', timestamp: 2 },
      { role: 'tool', content: 'Using tool: rg\nInput: {"pattern":"roleState"}', timestamp: 3 },
    ]

    expect(getAgentDelegationConversationMessageRoleState(conversation[0]!, 'Worker')).toEqual({
      label: 'Task',
      tone: 'user',
    })
    expect(getAgentDelegationConversationMessageRoleState(conversation[1]!, 'Worker')).toEqual({
      label: 'Worker',
      tone: 'assistant',
    })
    expect(getAgentDelegationConversationMessageRoleState(conversation[2]!, 'Worker')).toEqual({
      label: 'rg',
      tone: 'tool',
    })
    expect(formatAgentDelegationConversationTranscript(conversation, 'Worker')).toBe(
      '[Task]\nInspect the chat surface.\n\n---\n\n' +
      '[Worker]\nChecking the shared render state.\n\n---\n\n' +
      '[rg]\nUsing tool: rg\nInput: {"pattern":"roleState"}',
    )
  })

  it('shares delegated conversation message display state for expanded message cards', () => {
    const toolMessage: ACPSubAgentMessage = {
      role: 'tool',
      toolName: 'read_file',
      toolInput: { path: 'README.md' },
      content: 'Tool result: {"ok":true}',
      timestamp: 1_700_000_000_000,
    }
    const assistantMessage: ACPSubAgentMessage = {
      role: 'assistant',
      content: 'short',
      timestamp: 1_700_000_060_000,
    }

    expect(getAgentDelegationConversationMessageDisplayState(toolMessage, 'Worker', {
      longContentThreshold: 8,
    })).toEqual({
      role: {
        label: 'read_file',
        tone: 'tool',
      },
      timestampLabel: formatAgentDelegationConversationTimestamp(toolMessage.timestamp),
      isToolMessage: true,
      content: '{\n  "ok": true\n}',
      isLongContent: true,
      shouldShowToggle: true,
      toolSummary: '{\n  "ok": true\n}',
      serializedToolInput: '{\n  "path": "README.md"\n}',
      rawToolPayload: 'Tool result: {"ok":true}',
      shouldShowRawToolPayload: true,
    })
    expect(getAgentDelegationConversationMessageDisplayState(assistantMessage, 'Worker', {
      longContentThreshold: 8,
    })).toEqual({
      role: {
        label: 'Worker',
        tone: 'assistant',
      },
      timestampLabel: formatAgentDelegationConversationTimestamp(assistantMessage.timestamp),
      isToolMessage: false,
      content: 'short',
      isLongContent: false,
      shouldShowToggle: false,
      toolSummary: null,
      serializedToolInput: null,
      rawToolPayload: null,
      shouldShowRawToolPayload: false,
    })
  })

  it('classifies delegated run statuses for shared live chrome', () => {
    expect(isAgentDelegationActiveStatus('pending')).toBe(true)
    expect(isAgentDelegationActiveStatus('spawning')).toBe(true)
    expect(isAgentDelegationActiveStatus('running')).toBe(true)
    expect(isAgentDelegationActiveStatus('completed')).toBe(false)
    expect(isAgentDelegationActiveStatus('failed')).toBe(false)
    expect(isAgentDelegationActiveStatus('cancelled')).toBe(false)
  })

  it('builds shared delegated summary entries from the latest run updates', () => {
    const steps: AgentProgressStep[] = [
      {
        id: 'planner-start',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 100,
        delegation: {
          runId: 'run-planner',
          agentName: 'Planner',
          task: 'Draft the implementation plan',
          status: 'running',
          progressMessage: 'Reading files',
          startTime: 90,
          conversation: [
            { role: 'assistant', content: 'Checking the renderer.', timestamp: 95 },
          ],
        },
      },
      {
        id: 'planner-done',
        type: 'thinking',
        title: 'Delegating',
        status: 'completed',
        timestamp: 160,
        delegation: {
          runId: 'run-planner',
          agentName: 'Planner',
          task: 'Draft the implementation plan',
          status: 'completed',
          resultSummary: 'Plan ready',
          startTime: 90,
          endTime: 155,
          conversation: [
            { role: 'assistant', content: 'Plan ready.', timestamp: 150 },
            { role: 'tool', toolName: 'read_file', content: 'Tool result: {"ok":true}', timestamp: 155 },
          ],
        },
      },
      {
        id: 'review-running',
        type: 'thinking',
        title: 'Delegating',
        status: 'in_progress',
        timestamp: 180,
        delegation: {
          runId: 'run-review',
          agentName: 'Reviewer',
          task: 'Review the patch',
          status: 'running',
          startTime: 170,
        },
      },
    ]

    expect(getAgentDelegationSummaryEntries(steps, { maxSubtitleLength: 16 })).toEqual([
      {
        delegation: steps[2]!.delegation!,
        statusLabel: 'Running',
        subtitle: 'Review the patch',
        sourceLabel: 'Delegated run',
        trackingLabel: null,
        activityTimestamp: 180,
        messageCount: 0,
        isActive: true,
      },
      {
        delegation: steps[1]!.delegation!,
        statusLabel: 'Completed',
        subtitle: 'Plan ready',
        sourceLabel: 'Delegated run',
        trackingLabel: null,
        activityTimestamp: 160,
        messageCount: 2,
        isActive: false,
      },
    ])
  })

  it('selects compact delegated conversation preview rows for mobile cards', () => {
    const assistantTimestamp = 1_700_000_000_000
    const toolInputTimestamp = assistantTimestamp + 60_000
    const toolResultTimestamp = toolInputTimestamp + 60_000

    const conversation: ACPSubAgentMessage[] = [
      {
        role: 'user',
        content: 'Inspect the issue and report back with the likely fix.',
        timestamp: assistantTimestamp - 60_000,
      },
      {
        role: 'assistant',
        content: 'I found the problem in the renderer layout and I am checking the shared presentation state.',
        timestamp: assistantTimestamp,
      },
      {
        role: 'tool',
        toolName: 'rg',
        content: '',
        toolInput: { pattern: 'delegationConversationPreview', path: 'apps/mobile' },
        timestamp: toolInputTimestamp,
      },
      {
        role: 'tool',
        toolName: 'rg',
        content: 'apps/mobile/src/screens/ChatScreen.tsx:4210',
        timestamp: toolResultTimestamp,
      },
    ]

    const previewState = getAgentDelegationConversationPreviewState(conversation, 'Worker', {
      maxRows: 3,
      maxLength: 42,
    })
    const rows = getAgentDelegationConversationPreviewRows(conversation, 'Worker', {
      maxRows: 3,
      maxLength: 42,
    })

    expect(rows).toEqual([
      {
        role: 'assistant',
        roleLabel: 'Worker',
        content: 'I found the problem in the renderer layou…',
        timestamp: assistantTimestamp,
        timestampLabel: formatAgentDelegationConversationTimestamp(assistantTimestamp),
      },
      {
        role: 'tool',
        roleLabel: 'rg',
        content: '{"pattern":"delegationConversationPreview…',
        timestamp: toolInputTimestamp,
        timestampLabel: formatAgentDelegationConversationTimestamp(toolInputTimestamp),
      },
      {
        role: 'tool',
        roleLabel: 'rg',
        content: 'apps/mobile/src/screens/ChatScreen.tsx:42…',
        timestamp: toolResultTimestamp,
        timestampLabel: formatAgentDelegationConversationTimestamp(toolResultTimestamp),
      },
    ])
    expect(previewState).toEqual({
      rows,
      hiddenCount: 1,
    })
    expect(getAgentDelegationConversationPreviewState(conversation, 'Worker', {
      maxRows: 3,
      maxLength: 42,
      includeAll: true,
    })).toEqual({
      rows: [
        {
          role: 'user',
          roleLabel: 'Task',
          content: 'Inspect the issue and report back with th…',
          timestamp: assistantTimestamp - 60_000,
          timestampLabel: formatAgentDelegationConversationTimestamp(assistantTimestamp - 60_000),
        },
        ...rows,
      ],
      hiddenCount: 0,
    })
  })

  it('builds shared delegated card state for mobile and desktop summaries', () => {
    const delegation = {
      runId: 'run-card',
      agentName: 'Worker',
      task: 'Inspect card state',
      status: 'running' as const,
      progressMessage: 'Checking previews',
      startTime: 1_700_000_000_000,
      conversation: [
        {
          role: 'assistant' as const,
          content: 'I am checking how this card should summarize delegated activity.',
          timestamp: 1_700_000_010_000,
        },
        {
          role: 'tool' as const,
          toolName: 'read_file',
          content: 'Tool result: {"ok":true}',
          timestamp: 1_700_000_020_000,
        },
      ],
    }
    const toolEntries = [
      { id: 'read', label: 'read_file README.md' },
      { id: 'test', label: 'run focused test' },
      { id: 'typecheck', label: 'typecheck mobile' },
    ]

    expect(getAgentDelegationCardState(delegation, toolEntries, {
      maxSubtitleLength: 80,
      conversationPreviewMaxRows: 1,
      conversationPreviewMaxLength: 24,
      toolPreviewMaxRows: 2,
    })).toEqual({
      presentation: {
        statusLabel: 'Running',
        subtitle: 'Checking previews',
        sourceLabel: 'Delegated run',
        trackingLabel: null,
        activityTimestamp: 1_700_000_020_000,
        messageCount: 2,
        isActive: true,
      },
      conversationPreview: {
        rows: [
          {
            role: 'tool',
            roleLabel: 'read_file',
            content: '{ "ok": true }',
            timestamp: 1_700_000_020_000,
            timestampLabel: formatAgentDelegationConversationTimestamp(1_700_000_020_000),
          },
        ],
        hiddenCount: 1,
      },
      toolPreview: {
        rows: toolEntries.slice(0, 2),
        hiddenCount: 1,
      },
    })
  })

  it('uses parsed delegated tool content in shared conversation previews', () => {
    const resultMessage: ACPSubAgentMessage = {
      role: 'tool',
      toolName: 'read_file',
      content: 'Tool result: {"ok":true}',
      timestamp: 1_700_000_000_000,
    }
    const inputMessage: ACPSubAgentMessage = {
      role: 'tool',
      toolName: 'read_file',
      content: '',
      toolInput: { path: 'README.md' },
      timestamp: 1_700_000_060_000,
    }

    expect(getAgentDelegationConversationPreviewState([resultMessage], 'Worker', {
      maxRows: 1,
      maxLength: 80,
    }).rows).toEqual([
      {
        role: 'tool',
        roleLabel: 'read_file',
        content: '{ "ok": true }',
        timestamp: resultMessage.timestamp,
        timestampLabel: formatAgentDelegationConversationTimestamp(resultMessage.timestamp),
      },
    ])
    expect(getAgentDelegationConversationPreview([resultMessage], 'Worker', 80)).toBe(
      'read_file: { "ok": true }',
    )
    expect(getAgentDelegationConversationPreview([inputMessage], 'Worker', 80)).toBe(
      'read_file: {"path":"README.md"}',
    )
  })

  it('formats delegated conversation timestamps like the desktop message header', () => {
    const timestamp = 1_700_000_000_000

    expect(formatAgentDelegationConversationTimestamp(timestamp)).toBe(
      new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    )
    expect(formatAgentDelegationConversationTimestamp(0)).toBeNull()
    expect(formatAgentDelegationConversationTimestamp(Number.NaN)).toBeNull()
    expect(formatAgentDelegationConversationTimestamp(null)).toBeNull()
  })

  it('creates delegated tool preview state with visible rows and hidden counts', () => {
    const entries = [
      { id: 'search' },
      { id: 'read-file' },
      { id: 'edit-file' },
      { id: 'test' },
    ]

    expect(getAgentDelegationToolPreviewState(entries, { maxRows: 2 })).toEqual({
      rows: entries.slice(0, 2),
      hiddenCount: 2,
    })
    expect(getAgentDelegationToolPreviewState(entries, { maxRows: 2, includeAll: true })).toEqual({
      rows: entries,
      hiddenCount: 0,
    })
    expect(getAgentDelegationToolPreviewState(entries, { maxRows: 0 })).toEqual({
      rows: [],
      hiddenCount: 4,
    })
    expect(getAgentDelegationToolPreviewState(undefined, { maxRows: 2 })).toEqual({
      rows: [],
      hiddenCount: 0,
    })
  })
})
