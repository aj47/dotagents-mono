const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

async function loadEmergencyStopCoreModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'emergency-stop-core.ts')
  ).href

  return import(moduleUrl)
}

test('runEmergencyStopAll cancels approvals first and keeps ACP cleanup best-effort', async () => {
  const { runEmergencyStopAll } = await loadEmergencyStopCoreModule()
  const callOrder = []
  const errors = []
  const originalConsoleError = console.error
  console.error = (...args) => {
    errors.push(args)
  }

  try {
    const state = {
      agentSessions: new Map([['session-1', {}], ['session-2', {}]]),
      isAgentModeActive: true,
      agentIterationCount: 3,
    }

    const result = await runEmergencyStopAll({
      toolApprovalManager: {
        cancelAllApprovals: () => callOrder.push('cancelAllApprovals'),
        cancelSessionApprovals: (sessionId) => callOrder.push(`cancelSessionApprovals:${sessionId}`),
      },
      agentSessionStateManager: {
        stopAllSessions: () => callOrder.push('stopAllSessions'),
        cleanupSession: (sessionId) => callOrder.push(`cleanupSession:${sessionId}`),
      },
      agentSessionTracker: {
        getActiveSessions: () => [{ id: 'session-1', conversationId: 'conv-1', conversationTitle: 'Session 1' }],
        stopSession: (sessionId) => callOrder.push(`stopSession:${sessionId}`),
      },
      messageQueueService: {
        pauseQueue: (conversationId) => callOrder.push(`pauseQueue:${conversationId}`),
      },
      emitAgentProgress: async (update) => {
        callOrder.push(`emitAgentProgress:${update.sessionId}`)
      },
      llmRequestAbortManager: {
        abortAll: () => callOrder.push('abortAll'),
      },
      agentProcessManager: {
        getActiveProcessCount: (() => {
          let calls = 0
          return () => (calls++ === 0 ? 2 : 0)
        })(),
        emergencyStop: () => callOrder.push('emergencyStop'),
      },
      state,
      clearSessionUserResponse: (sessionId) => callOrder.push(`clearSessionUserResponse:${sessionId}`),
      acpClientService: {
        cancelAllRuns: () => {
          callOrder.push('cancelAllRuns')
          throw new Error('cancel boom')
        },
      },
      acpProcessManager: {
        stopAllAgents: async () => {
          callOrder.push('stopAllAgents')
          throw new Error('stop boom')
        },
      },
      acpService: {
        shutdown: async () => {
          callOrder.push('shutdown')
          throw new Error('shutdown boom')
        },
      },
    })

    assert.deepEqual(result, { before: 2, after: 0 })
    assert.equal(callOrder[0], 'cancelAllApprovals')
    assert.ok(callOrder.includes('stopAllSessions'))
    assert.ok(callOrder.includes('pauseQueue:conv-1'))
    assert.ok(callOrder.includes('emitAgentProgress:session-1'))
    assert.ok(callOrder.includes('stopSession:session-1'))
    assert.ok(callOrder.includes('clearSessionUserResponse:session-1'))
    assert.ok(callOrder.includes('cleanupSession:session-2'))
    assert.ok(callOrder.includes('cancelAllRuns'))
    assert.ok(callOrder.includes('stopAllAgents'))
    assert.ok(callOrder.includes('shutdown'))
    assert.equal(state.isAgentModeActive, false)
    assert.equal(state.agentIterationCount, 0)
    assert.equal(errors.length, 3)
    assert.equal(errors[0][0], '[EmergencyStop] Error cancelling ACP runs:')
    assert.equal(errors[1][0], '[EmergencyStop] Error stopping ACP agents:')
    assert.equal(errors[2][0], '[EmergencyStop] Error shutting down ACP service:')
  } finally {
    console.error = originalConsoleError
  }
})