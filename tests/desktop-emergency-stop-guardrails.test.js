const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'emergency-stop-core.ts'),
  'utf8'
);

test('emergency stop cancels all pending approvals up front so every entrypoint denies prompts consistently', () => {
  assert.match(source, /try \{\s*deps\.toolApprovalManager\.cancelAllApprovals\(\)/);
  assert.match(source, /Error cancelling all pending approvals during emergency stop/);
});

test('emergency stop isolates active-session failures so one broken session does not block the rest', () => {
  assert.match(source, /const activeSessions = deps\.agentSessionTracker\.getActiveSessions\(\)/);
  assert.match(source, /for \(const session of activeSessions\) \{/);
  assert.match(source, /try \{\s*deps\.toolApprovalManager\.cancelSessionApprovals\(session\.id\)/);
  assert.match(source, /try \{\s*deps\.messageQueueService\.pauseQueue\(session\.conversationId\)/);
  assert.match(source, /try \{\s*await deps\.emitAgentProgress\(/);
  assert.match(source, /try \{\s*deps\.agentSessionTracker\.stopSession\(session\.id\)/);
  assert.match(source, /Error emitting final progress update during emergency stop/);
  assert.match(source, /Error marking session as stopped in tracker/);
});

test('emergency stop snapshots session ids before cleanup and keeps cleanup best-effort per session', () => {
  assert.match(source, /const sessionIds = Array\.from\(deps\.state\.agentSessions\.keys\(\)\)/);
  assert.match(source, /for \(const sessionId of sessionIds\) \{/);
  assert.match(source, /try \{\s*deps\.clearSessionUserResponse\(sessionId\)/);
  assert.match(source, /try \{\s*deps\.agentSessionStateManager\.cleanupSession\(sessionId\)/);
  assert.match(source, /Error clearing session user response/);
  assert.match(source, /Error cleaning up session state/);
});

test('emergency stop keeps ACP-wide cancellation and shutdown best-effort', () => {
  assert.match(source, /try \{\s*deps\.acpClientService\.cancelAllRuns\(\)/);
  assert.match(source, /Error cancelling ACP runs/);
  assert.match(source, /try \{\s*await deps\.acpProcessManager\.stopAllAgents\(\)/);
  assert.match(source, /Error stopping ACP agents/);
  assert.match(source, /try \{\s*await deps\.acpService\.shutdown\(\)/);
  assert.match(source, /Error shutting down ACP service/);
});