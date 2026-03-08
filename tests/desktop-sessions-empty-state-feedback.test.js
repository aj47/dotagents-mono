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

test('desktop empty sessions state falls back to a readable title for recent history rows', () => {
  assert.match(sessionsSource, /import \{ getConversationHistoryDisplayTitle \} from "@renderer\/lib\/conversation-history-display"/);
  assert.match(sessionsSource, /const sessionDisplayTitle = getConversationHistoryDisplayTitle\(session\)/);
  assert.match(sessionsSource, /title=\{sessionDisplayTitle\}/);
  assert.match(sessionsSource, /<span className="flex-1 truncate">\{sessionDisplayTitle\}<\/span>/);
});