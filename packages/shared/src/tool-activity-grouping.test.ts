import { describe, it, expect } from 'vitest'
import {
  formatCollapsedToolActivityGroupAccessibilityLabel,
  formatToolActivityGroupCollapseAccessibilityLabel,
  formatToolActivityGroupCount,
  formatToolActivityGroupPreviewLine,
  formatToolActivityGroupToolCallCount,
  getToolActivityGroupCopyState,
  getToolActivityGroupDesktopSurfaceState,
  getToolActivityGroupMobileLeadingIconColors,
  getToolActivityGroupMobileLeadingIconState,
  getToolActivityGroupMobileRenderState,
  getToolActivityGroupMobileSurfaceColors,
  getToolActivityGroupMobileSurfaceRenderState,
  getToolActivityGroupMobileSurfaceState,
  getToolActivityGroupMobileToggleIconColors,
  getToolActivityGroupMobileToggleIconState,
  getToolActivityGroupExpansionInheritanceItems,
  getToolActivityGroupRenderState,
  getToolActivityGroupStateKey,
  getToolActivityGroupSummaryState,
  getToolActivityRunSummary,
  getToolActivitySummaryLine,
  getToolActivityToolCallPreview,
  groupToolActivity,
  TOOL_ACTIVITY_GROUP_PRESENTATION,
  TOOL_ACTIVITY_GROUP_STATE_KEY_PREFIX,
  TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION,
  TOOL_GROUP_PREVIEW_COUNT,
  TOOL_GROUP_MIN_SIZE,
  type ToolActivityGroupSourceMessage,
} from './tool-activity-grouping'

type GroupableMessage = ToolActivityGroupSourceMessage

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
      .toBe('read_file, write_file')
  })

  it('uses shared compact tool-call previews for execute_command results', () => {
    expect(getToolActivityToolCallPreview(
      { name: 'execute_command', arguments: { command: 'git status --short' } },
      { success: true, content: ' M README.md' },
    )).toBe('git status --short:M README.md')
    expect(getToolActivitySummaryLine({
      role: 'assistant',
      content: '',
      toolCalls: [{ name: 'execute_command', arguments: { command: 'pnpm test' } }],
      toolResults: [{ success: true, content: 'passed' }],
    })).toBe('pnpm test:passed')
  })

  it('omits successful tool results from collapsed tool-name previews', () => {
    expect(getToolActivitySummaryLine(toolResultMsg(true))).toBe('')
  })

  it('omits failed tool results from collapsed tool-name previews', () => {
    expect(getToolActivitySummaryLine(toolResultMsg(false))).toBe('')
  })

  it('uses shared plain-copy fallback labels when tool metadata is absent', () => {
    expect(getToolActivitySummaryLine({ role: 'tool', content: '' })).toBe(
      TOOL_ACTIVITY_GROUP_PRESENTATION.fallbackToolResultLabel,
    )
    expect(getToolActivitySummaryLine({ role: 'assistant', content: '' })).toBe(
      TOOL_ACTIVITY_GROUP_PRESENTATION.fallbackAssistantLabel,
    )
    expect(TOOL_ACTIVITY_GROUP_PRESENTATION.fallbackToolResultLabel).toBe('tool result')
    expect(TOOL_ACTIVITY_GROUP_PRESENTATION.fallbackAssistantLabel).toBe('assistant')
  })
})

describe('getToolActivityRunSummary', () => {
  it('summarises tool calls and result previews for renderer-specific grouped runs', () => {
    expect(getToolActivityRunSummary([
      {
        toolCalls: [{ name: 'read_file', arguments: { path: 'README.md' } }],
        toolResults: [{ success: true, content: 'contents' }],
      },
      {
        toolCalls: [{ name: 'execute_command', arguments: { command: 'git status --short' } }],
        toolResults: [{ success: true, content: ' M package.json' }],
      },
    ])).toEqual({
      toolCallCount: 2,
      previewLines: ['read_file', 'git status --short:M package.json'],
    })
  })

  it('keeps total call count while limiting preview source items', () => {
    expect(getToolActivityRunSummary([
      { toolCalls: [{ name: 'first', arguments: {} }] },
      { toolCalls: [{ name: 'second', arguments: {} }] },
      { fallbackSummaryLine: 'tool result' },
    ], { maxItems: 2 })).toEqual({
      toolCallCount: 2,
      previewLines: ['second', 'tool result'],
    })
  })
})

describe('tool activity group presentation', () => {
  it('formats shared group counts and accessibility labels', () => {
    expect(formatToolActivityGroupCount(1)).toBe('1 tool activity')
    expect(formatToolActivityGroupCount(2)).toBe('2 tool activities')
    expect(formatToolActivityGroupToolCallCount(1)).toBe('1 tool call')
    expect(formatToolActivityGroupToolCallCount(2)).toBe('2 tool calls')
    expect(formatToolActivityGroupPreviewLine(['read_file', 'write_file'])).toBe('read_file, write_file')
    expect(formatToolActivityGroupPreviewLine(['  ', 'write_file'])).toBe('write_file')
    expect(formatToolActivityGroupPreviewLine([])).toBe(TOOL_ACTIVITY_GROUP_PRESENTATION.collapsedFallbackLabel)
    expect(formatToolActivityGroupPreviewLine([], 'Activity')).toBe('Activity')
    expect(TOOL_ACTIVITY_GROUP_STATE_KEY_PREFIX).toBe('tool-activity-group:')
    expect(getToolActivityGroupStateKey(3)).toBe('tool-activity-group:3')
    expect(getToolActivityGroupStateKey('message-1')).toBe('tool-activity-group:message-1')
    expect(getToolActivityGroupStateKey({
      startIndex: 4,
      endIndex: 6,
      count: 3,
      toolCallCount: 2,
      previewLines: ['read_file'],
    })).toBe('tool-activity-group:4')
    expect(getToolActivityGroupExpansionInheritanceItems([{
      startIndex: 4,
      endIndex: 6,
      count: 3,
      toolCallCount: 2,
      previewLines: ['read_file'],
    }])).toEqual([{
      groupKey: 'tool-activity-group:4',
      inheritedKey: 4,
    }])
    expect(getToolActivityGroupRenderState({
      group: {
        startIndex: 4,
        endIndex: 6,
        count: 3,
        toolCallCount: 2,
        previewLines: ['read_file'],
      },
      itemIndex: 4,
      groupState: {},
    })).toMatchObject({
      groupKey: 'tool-activity-group:4',
      isExpanded: false,
      isFirstItem: true,
      isLastItem: false,
      shouldSkipCollapsedItem: false,
      shouldRenderCollapsedHeader: true,
      shouldRenderExpandedHeader: false,
      shouldRenderExpandedFooter: false,
      summary: {
        previewText: 'read_file',
        toolCallCount: 2,
        shouldShowToolCallCount: true,
      },
    })
    expect(getToolActivityGroupRenderState({
      group: {
        startIndex: 4,
        endIndex: 6,
        count: 3,
        toolCallCount: 2,
        previewLines: ['read_file'],
      },
      itemIndex: 6,
      groupState: { 'tool-activity-group:4': true },
    })).toMatchObject({
      isExpanded: true,
      isFirstItem: false,
      isLastItem: true,
      shouldSkipCollapsedItem: false,
      shouldRenderCollapsedHeader: false,
      shouldRenderExpandedHeader: false,
      shouldRenderExpandedFooter: true,
    })
    expect(getToolActivityGroupRenderState({
      group: {
        startIndex: 4,
        endIndex: 6,
        count: 3,
        toolCallCount: 2,
        previewLines: ['read_file'],
      },
      itemIndex: 5,
      groupState: {},
    }).shouldSkipCollapsedItem).toBe(true)
    expect(getToolActivityGroupRenderState({
      group: {
        startIndex: 4,
        endIndex: 6,
        count: 3,
        toolCallCount: 2,
        previewLines: ['read_file'],
      },
      itemIndex: 5,
      groupState: {},
      inheritedState: { 4: true },
    })).toMatchObject({
      isExpanded: true,
      shouldSkipCollapsedItem: false,
    })
    expect(formatCollapsedToolActivityGroupAccessibilityLabel(2)).toBe('2 tool activities, collapsed. Tap to expand.')
    expect(formatToolActivityGroupCollapseAccessibilityLabel(2)).toBe('Collapse 2 tool activities')
    expect(getToolActivityGroupSummaryState({
      activityCount: 2,
      toolCallCount: 1,
      previewLines: ['read_file'],
    })).toEqual({
      activityCount: 2,
      activityCountLabel: '2 tool activities',
      previewText: 'read_file',
      toolCallCount: 1,
      toolCallCountLabel: '1 tool call',
      shouldShowToolCallCount: true,
      collapsedAccessibilityLabel: '2 tool activities, collapsed. Tap to expand.',
      collapseAccessibilityLabel: 'Collapse 2 tool activities',
    })
    expect(getToolActivityGroupSummaryState({
      activityCount: 1,
      previewLines: [],
    })).toMatchObject({
      previewText: TOOL_ACTIVITY_GROUP_PRESENTATION.collapsedFallbackLabel,
      toolCallCount: 0,
      toolCallCountLabel: '',
      shouldShowToolCallCount: false,
    })
    expect(TOOL_ACTIVITY_GROUP_PRESENTATION.collapsedFallbackLabel).toBe('Tool activity')
    expect(TOOL_ACTIVITY_GROUP_PRESENTATION.collapseFromBottomLabel).toBe('Collapse group')
    expect(getToolActivityGroupCopyState()).toBe(TOOL_ACTIVITY_GROUP_PRESENTATION)
  })

  it('shares compact group surface presentation for desktop and mobile', () => {
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.desktop.headerClassName).toContain('px-2.5 py-1')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.desktop.previewClassName).toContain('truncate')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.desktop.footerButtonClassName).toContain('text-sky-700')
    expect(getToolActivityGroupDesktopSurfaceState()).toBe(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.desktop)
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.collapsed).toEqual({
      paddingVertical: 4,
      paddingHorizontal: 'xs',
      borderRadius: 'sm',
      borderWidth: 1,
      borderAlpha: 0.18,
      borderLeftWidth: 2,
      borderLeftAlpha: 0.42,
      backgroundAlpha: 0.04,
      colorToken: 'info',
      marginBottom: 2,
      accessibilityRole: 'button',
    })
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.name).toBe('construct-outline')
    expect(getToolActivityGroupMobileLeadingIconState()).toEqual({
      name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.name,
      size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.size,
      colorToken: 'info',
      opacity: 0.82,
    })
    expect(getToolActivityGroupMobileLeadingIconColors({
      info: '#3b82f6',
      mutedForeground: '#737373',
    })).toEqual({
      color: 'rgba(59, 130, 246, 0.82)',
    })
    expect(getToolActivityGroupMobileSurfaceState()).toBe(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile)
    const toolActivityGroupSurfaceRenderStateColors = {
      info: '#3b82f6',
      mutedForeground: '#737373',
    }
    expect(getToolActivityGroupMobileSurfaceColors(toolActivityGroupSurfaceRenderStateColors)).toEqual({
      collapsed: {
        borderColor: 'rgba(59, 130, 246, 0.18)',
        borderLeftColor: 'rgba(59, 130, 246, 0.42)',
        backgroundColor: 'rgba(59, 130, 246, 0.04)',
      },
      countBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        color: '#3b82f6',
      },
      preview: {
        color: '#737373',
      },
      footerText: {
        color: '#3b82f6',
      },
    })
    expect(
      getToolActivityGroupMobileSurfaceRenderState({
        colors: toolActivityGroupSurfaceRenderStateColors,
      }),
    ).toEqual({
      surface: getToolActivityGroupMobileSurfaceState(),
      colors: getToolActivityGroupMobileSurfaceColors(toolActivityGroupSurfaceRenderStateColors),
    })
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.headerRow).toMatchObject({
      flexDirection: 'row',
      alignItems: 'center',
      overflow: 'hidden',
    })
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.collapsed.accessibilityRole).toBe('button')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.countBadge.minWidth).toBe(18)
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.countBadge.fontFamilyByPlatform.ios).toBe('Menlo')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.countBadge).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
    })
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName).toBe('chevron-down')
    expect(getToolActivityGroupMobileToggleIconState({ isExpanded: false })).toEqual({
      isExpanded: false,
      placement: 'header',
      name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName,
      size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.size,
      colorToken: 'mutedForeground',
      opacity: 0.7,
    })
    expect(getToolActivityGroupMobileToggleIconState({ isExpanded: true })).toEqual({
      isExpanded: true,
      placement: 'header',
      name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName,
      size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.size,
      colorToken: 'mutedForeground',
      opacity: 0.7,
    })
    expect(getToolActivityGroupMobileToggleIconColors({ isExpanded: false }, {
      info: '#3b82f6',
      mutedForeground: '#737373',
    })).toEqual({
      color: 'rgba(115, 115, 115, 0.7)',
    })
    expect(getToolActivityGroupMobileToggleIconState({ isExpanded: true, placement: 'footer' })).toEqual({
      isExpanded: true,
      placement: 'footer',
      name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName,
      size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.size,
      colorToken: 'info',
      opacity: 0.7,
    })
    expect(getToolActivityGroupMobileToggleIconColors({ isExpanded: true, placement: 'footer' }, {
      info: '#3b82f6',
      mutedForeground: '#737373',
    })).toEqual({
      color: 'rgba(59, 130, 246, 0.7)',
    })
    expect(getToolActivityGroupMobileRenderState({
      group: {
        startIndex: 4,
        endIndex: 6,
        count: 3,
        toolCallCount: 2,
        previewLines: ['read_file'],
      },
      itemIndex: 4,
      groupState: {},
      colors: {
        info: '#3b82f6',
        mutedForeground: '#737373',
      },
    })).toMatchObject({
      copy: TOOL_ACTIVITY_GROUP_PRESENTATION,
      surface: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile,
      colors: getToolActivityGroupMobileSurfaceColors({
        info: '#3b82f6',
        mutedForeground: '#737373',
      }),
      isExpanded: false,
      shouldRenderCollapsedHeader: true,
      leadingIcon: {
        name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.name,
        size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.icon.size,
        color: 'rgba(59, 130, 246, 0.82)',
      },
      headerToggleIcon: {
        name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.collapsedName,
        size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.size,
        color: 'rgba(115, 115, 115, 0.7)',
      },
      footerToggleIcon: {
        name: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName,
        size: TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.size,
        color: 'rgba(59, 130, 246, 0.7)',
      },
      collapsedHeader: {
        accessibilityRole: 'button',
        accessibilityLabel: '3 tool activities, collapsed. Tap to expand.',
        accessibilityState: { expanded: false },
        ariaExpanded: false,
      },
      expandedHeader: {
        accessibilityRole: 'button',
        accessibilityLabel: 'Collapse 3 tool activities',
        accessibilityState: { expanded: true },
        ariaExpanded: true,
      },
      footerButton: {
        label: TOOL_ACTIVITY_GROUP_PRESENTATION.collapseFromBottomLabel,
        accessibilityRole: 'button',
        accessibilityLabel: 'Collapse 3 tool activities',
      },
    })
    expect(getToolActivityGroupMobileRenderState({
      group: {
        startIndex: 4,
        endIndex: 6,
        count: 3,
        toolCallCount: 2,
        previewLines: ['read_file'],
      },
      itemIndex: 4,
      groupState: { 'tool-activity-group:4': true },
      colors: {
        info: '#3b82f6',
        mutedForeground: '#737373',
      },
    }).headerToggleIcon.name).toBe(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.toggleIcon.expandedName)
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.footerButton.flexDirection).toBe('row')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.footerButton.accessibilityRole).toBe('button')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.preview.numberOfLines).toBe(1)
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.preview.ellipsizeMode).toBe('tail')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.preview.colorToken).toBe('mutedForeground')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.preview.fontFamilyByPlatform.default).toBe('monospace')
    expect(TOOL_ACTIVITY_GROUP_SURFACE_PRESENTATION.mobile.preview.minWidth).toBe(0)
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
    expect(groups[0].toolCallCount).toBe(2)
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

  it('preview shows the last N entries for a collapsed tool group', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['step1']),
      toolResultMsg(),
      toolOnlyAssistant(['step2']),
      toolResultMsg(),
      toolOnlyAssistant(['step3']),
    ]
    const { groups } = groupToolActivity(msgs)
    expect(groups).toHaveLength(1)
    expect(groups[0].previewLines).toEqual(['step1, step2, step3'])
    expect(groups[0].toolCallCount).toBe(3)
  })

  it('tracks tool calls separately from grouped activity messages', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['read_file']),
      toolResultMsg(),
      toolOnlyAssistant(['write_file', 'edit_file']),
      toolResultMsg(),
    ]

    const { groups } = groupToolActivity(msgs)

    expect(groups).toHaveLength(1)
    expect(groups[0].count).toBe(4)
    expect(groups[0].toolCallCount).toBe(3)
  })

  it('keeps preview lines once a later assistant response exists', () => {
    const msgs: GroupableMessage[] = [
      toolOnlyAssistant(['read_file']),
      toolResultMsg(),
      assistantMsg('Done!'),
    ]

    const { groups } = groupToolActivity(msgs)

    expect(groups).toHaveLength(1)
    expect(groups[0].previewLines).toEqual(['read_file'])
  })

  it('previews every collapsed tool run when multiple groups exist', () => {
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
    expect(groups[0].previewLines).toEqual(['first'])
    expect(groups[1].previewLines).toEqual(['second-1, second-2'])
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
    expect(TOOL_GROUP_PREVIEW_COUNT).toBe(8)
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
