import { describe, expect, it } from 'vitest';

import {
  applyConnectionTypeChange,
  buildAgentConnectionRequestFields,
} from './agent-edit-connection-utils';

describe('agent-edit connection persistence helpers', () => {
  it('clears hidden remote URL state when switching away from remote', () => {
    const nextFormData = applyConnectionTypeChange({
      connectionType: 'remote',
      connectionCommand: 'node',
      connectionArgs: 'agent.js --acp',
      connectionBaseUrl: ' https://remote.example/v1 ',
      connectionCwd: '/tmp/agent',
    }, 'acpx');

    expect(nextFormData).toMatchObject({
      connectionType: 'acpx',
      connectionBaseUrl: '',
      connectionCommand: 'node',
      connectionArgs: 'agent.js --acp',
      connectionCwd: '/tmp/agent',
    });
  });

  it('omits hidden Base URL fields from acpx saves while preserving visible local launch fields', () => {
    const requestFields = buildAgentConnectionRequestFields({
      connectionType: 'acpx',
      connectionCommand: ' node ',
      connectionArgs: ' agent.js --acp ',
      connectionBaseUrl: 'https://stale-hidden.example/v1',
      connectionCwd: ' /workspace/agent ',
    });

    expect(requestFields).toEqual({
      connectionType: 'acpx',
      connectionCommand: 'node',
      connectionArgs: 'agent.js --acp',
      connectionCwd: '/workspace/agent',
    });
    expect('connectionBaseUrl' in requestFields).toBe(false);
  });

  it('sends only the visible remote Base URL for remote saves', () => {
    const requestFields = buildAgentConnectionRequestFields({
      connectionType: 'remote',
      connectionCommand: 'node',
      connectionArgs: 'agent.js --acp',
      connectionBaseUrl: ' https://remote.example/v1 ',
      connectionCwd: '/workspace/agent',
    });

    expect(requestFields).toEqual({
      connectionType: 'remote',
      connectionBaseUrl: 'https://remote.example/v1',
    });
    expect('connectionCommand' in requestFields).toBe(false);
    expect('connectionArgs' in requestFields).toBe(false);
    expect('connectionCwd' in requestFields).toBe(false);
  });
});
