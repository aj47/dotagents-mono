import test from 'node:test'
import assert from 'node:assert/strict'

import { sanitizeAgentProfileConnection } from './agent-profile-connection-sanitize.ts'

test('normalizes legacy local ACP connections while dropping stale hidden baseUrl data during save sanitization', () => {
  const connection = sanitizeAgentProfileConnection(
    { connectionType: 'acp' },
    {
      type: 'acp',
      command: 'auggie',
      args: ['--acp'],
      baseUrl: 'https://stale-hidden.example/v1',
      cwd: '/workspace/agent',
    },
  )

  assert.deepEqual(connection, {
    type: 'acpx',
    command: 'auggie',
    args: ['--acp'],
    cwd: '/workspace/agent',
  })
  assert.equal('baseUrl' in connection, false)
})

test('keeps only remote URL data for remote connections', () => {
  const connection = sanitizeAgentProfileConnection(
    { connectionType: 'remote' },
    {
      type: 'remote',
      command: 'should-not-persist',
      baseUrl: 'https://remote.example/v1',
      cwd: '/workspace/agent',
    },
  )

  assert.deepEqual(connection, {
    type: 'remote',
    baseUrl: 'https://remote.example/v1',
  })
  assert.equal('command' in connection, false)
  assert.equal('cwd' in connection, false)
})

test('treats blank visible fields as explicit clears instead of preserving stale saved values', () => {
  const connection = sanitizeAgentProfileConnection(
    {
      connectionType: 'remote',
      connectionBaseUrl: '   ',
    },
    {
      type: 'remote',
      baseUrl: 'https://remote.example/v1',
    },
  )

  assert.deepEqual(connection, {
    type: 'remote',
  })
  assert.equal('baseUrl' in connection, false)
})
