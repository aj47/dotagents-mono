const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'emergency-stop.ts'),
  'utf8'
);

test('emergency stop isolates active-session failures so one broken session does not block the rest', () => {
  assert.match(source, /const activeSessions = agentSessionTracker\.getActiveSessions\(\)/);
  assert.match(source, /for \(const session of activeSessions\) \{/);
  assert.match(source, /try \{\s*toolApprovalManager\.cancelSessionApprovals\(session\.id\)/);
  assert.match(source, /try \{\s*messageQueueService\.pauseQueue\(session\.conversationId\)/);
  assert.match(source, /try \{\s*await emitAgentProgress\(/);
  assert.match(source, /try \{\s*agentSessionTracker\.stopSession\(session\.id\)/);
  assert.match(source, /Error emitting final progress update during emergency stop/);
  assert.match(source, /Error marking session as stopped in tracker/);
});

test('emergency stop snapshots session ids before cleanup and keeps cleanup best-effort per session', () => {
  assert.match(source, /const sessionIds = Array\.from\(state\.agentSessions\.keys\(\)\)/);
  assert.match(source, /for \(const sessionId of sessionIds\) \{/);
  assert.match(source, /try \{\s*clearSessionUserResponse\(sessionId\)/);
  assert.match(source, /try \{\s*agentSessionStateManager\.cleanupSession\(sessionId\)/);
  assert.match(source, /Error clearing session user response/);
  assert.match(source, /Error cleaning up session state/);
});