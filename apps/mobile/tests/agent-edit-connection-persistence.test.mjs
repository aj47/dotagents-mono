import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyConnectionTypeChange,
  buildAgentConnectionRequestFields,
} from '../src/screens/agent-edit-connection-utils.ts';

test('clears hidden remote URL state when switching away from remote', () => {
  const nextFormData = applyConnectionTypeChange({
    connectionType: 'remote',
    connectionCommand: 'node',
    connectionArgs: 'agent.js --acp',
    connectionBaseUrl: ' https://remote.example/v1 ',
    connectionCwd: '/tmp/agent',
  }, 'acp');

  assert.equal(nextFormData.connectionType, 'acp');
  assert.equal(nextFormData.connectionBaseUrl, '');
  assert.equal(nextFormData.connectionCommand, 'node');
  assert.equal(nextFormData.connectionArgs, 'agent.js --acp');
  assert.equal(nextFormData.connectionCwd, '/tmp/agent');
});

test('omits hidden Base URL fields from ACP saves while preserving visible local launch fields', () => {
  const requestFields = buildAgentConnectionRequestFields({
    connectionType: 'acp',
    connectionCommand: ' node ',
    connectionArgs: ' agent.js --acp ',
    connectionBaseUrl: 'https://stale-hidden.example/v1',
    connectionCwd: ' /workspace/agent ',
  });

  assert.deepEqual(requestFields, {
    connectionType: 'acp',
    connectionCommand: 'node',
    connectionArgs: 'agent.js --acp',
    connectionCwd: '/workspace/agent',
  });
  assert.equal('connectionBaseUrl' in requestFields, false);
});

test('sends only the visible remote Base URL for remote saves', () => {
  const requestFields = buildAgentConnectionRequestFields({
    connectionType: 'remote',
    connectionCommand: 'node',
    connectionArgs: 'agent.js --acp',
    connectionBaseUrl: ' https://remote.example/v1 ',
    connectionCwd: '/workspace/agent',
  });

  assert.deepEqual(requestFields, {
    connectionType: 'remote',
    connectionBaseUrl: 'https://remote.example/v1',
  });
  assert.equal('connectionCommand' in requestFields, false);
  assert.equal('connectionArgs' in requestFields, false);
  assert.equal('connectionCwd' in requestFields, false);
});