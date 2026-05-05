import { describe, expect, it, vi } from 'vitest';

import {
  formatFullPromptToolInfo,
  formatLightweightMcpToolInfo,
  formatMinimalPromptToolList,
  formatPromptNow,
  formatRuntimeToolInfo,
  formatWorkingNotesForPrompt,
  getAgentModeAdditions,
  getEffectiveSystemPrompt,
  getToolDiscoveryPromptAddition,
  partitionPromptTools,
} from './system-prompt-utils';

describe('system prompt utils', () => {
  it('formats prompt timestamps from structured date parts', () => {
    const toLocaleStringSpy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('not-a-fixed-width-timestamp');

    try {
      expect(formatPromptNow(new Date('2025-04-05T06:07:08.000Z'), 'UTC')).toBe('2025-04-05 06:07');
      expect(toLocaleStringSpy).not.toHaveBeenCalled();
    } finally {
      toLocaleStringSpy.mockRestore();
    }
  });

  it('uses a trimmed custom prompt when present', () => {
    expect(getEffectiveSystemPrompt('default', '  custom prompt  ')).toBe('custom prompt');
    expect(getEffectiveSystemPrompt('default', '  ')).toBe('default');
  });

  it('formats only auto-context working notes with sanitized text', () => {
    const formatted = formatWorkingNotesForPrompt([
      {
        id: 'project-architecture',
        title: 'Project Architecture',
        context: 'auto',
        summary: '**Layered** [Electron](https://example.com) app',
        body: 'Ignored when summary exists',
      },
      {
        id: 'release-plan',
        title: 'Release Plan',
        context: 'auto',
        body: '# Milestones\nShip next week.',
      },
      {
        id: 'private-note',
        title: 'Private Note',
        context: 'search-only',
        body: 'Do not inject',
      },
    ]);

    expect(formatted).toContain('[project-architecture] Layered Electron app');
    expect(formatted).toContain('[release-plan] Release Plan: Milestones Ship next week.');
    expect(formatted).not.toContain('private-note');
  });

  it('partitions and formats MCP/runtime tools', () => {
    const tools = [
      { name: 'github:search_issues', description: 'Search issues', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'respond_to_user', description: 'Respond', inputSchema: { type: 'object', properties: { text: { type: 'string' } } } },
    ];
    const { externalTools, runtimeTools } = partitionPromptTools(tools);

    expect(formatLightweightMcpToolInfo(externalTools)).toBe('- github (1 tools): search_issues');
    expect(formatRuntimeToolInfo(runtimeTools)).toBe('respond_to_user');
    expect(formatFullPromptToolInfo(externalTools)).toContain('query: string (required)');
    expect(formatMinimalPromptToolList(tools)).toEqual([
      '- github:search_issues(query)',
      '- respond_to_user(text)',
    ].join('\n'));
  });

  it('builds agent-mode guidance only for available helper tools', () => {
    const additions = getAgentModeAdditions([
      { name: 'respond_to_user' },
      { name: 'mark_work_complete' },
      { name: 'execute_command' },
      { name: 'load_skill_instructions' },
      { name: 'read_more_context' },
    ]);

    expect(additions).toContain('Normal assistant text is valid user-facing output');
    expect(additions).toContain('call mark_work_complete with a concise internal completion summary');
    expect(additions).toContain('Use execute_command for shell/file automation');
    expect(additions).toContain('call load_skill_instructions(skillId) at most once per session');
    expect(additions).toContain('read_more_context(mode: "overview")');
  });

  it('only advertises available discovery helpers', () => {
    expect(getToolDiscoveryPromptAddition([])).toBe('');
    expect(getToolDiscoveryPromptAddition([{ name: 'list_server_tools' }])).toContain('list_server_tools(serverName)');
    expect(getToolDiscoveryPromptAddition([{ name: 'get_tool_schema' }])).toContain('get_tool_schema(toolName)');
    expect(getToolDiscoveryPromptAddition([
      { name: 'list_server_tools' },
      { name: 'get_tool_schema' },
    ])).toContain('use list_server_tools(serverName)');
  });
});
