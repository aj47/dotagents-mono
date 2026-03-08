const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'sessions.tsx'),
  'utf8'
);

test('desktop pending session continuation failures stay visible with local recovery', () => {
  assert.match(sessionsSource, /type PendingContinuationFeedback = \{/);
  assert.match(sessionsSource, /Couldn't reopen that past session/);
  assert.match(sessionsSource, /Retry opening/);
  assert.match(sessionsSource, /Session startup timed out/);
  assert.match(sessionsSource, /Try sending your follow-up again\./);
  assert.match(sessionsSource, /const showPendingFeedbackTile =/);
  assert.match(sessionsSource, /const showPendingContinuationInlineFeedback =/);
  assert.match(sessionsSource, /setPendingConversationId\(\s*pendingContinuationFeedback\.conversationId/);
});