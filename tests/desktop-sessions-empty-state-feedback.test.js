const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'sessions.tsx'),
  'utf8'
);

test('desktop empty sessions state keeps history reachable and shows loading feedback', () => {
  assert.match(sessionsSource, /onOpenPastSessionsDialog\?: \(\) => void/);
  assert.match(sessionsSource, /variant="outline"[\s\S]*onClick=\{onOpenPastSessionsDialog\}[\s\S]*Past Sessions/);
  assert.match(sessionsSource, /const isRecentSessionsLoading =[\s\S]*conversationHistoryQuery\.isLoading[\s\S]*conversationHistoryQuery\.isFetching[\s\S]*!conversationHistoryQuery\.data/);
  assert.match(sessionsSource, /Loading recent sessions\.\.\./);
  assert.match(sessionsSource, /Recent sessions couldn&apos;t load right now\./);
});