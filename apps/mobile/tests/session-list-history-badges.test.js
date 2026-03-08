const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionListSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('session list exposes compacted and partial history badges for conversations with compaction metadata', () => {
  assert.match(sessionListSource, /type SessionHistoryBadgeInfo = \{/);
  assert.match(sessionListSource, /const getSessionHistoryBadge = \(/);
  assert.match(sessionListSource, /partialReason === 'legacy_summary_without_raw_messages'/);
  assert.match(sessionListSource, /label: 'History partial'/);
  assert.match(sessionListSource, /label: 'History compacted'/);
  assert.match(sessionListSource, /storedRawMessageCount \?\? session\.compaction\.representedMessageCount/);
});

test('session list renders the history badge row and folds badge detail into accessibility copy', () => {
  assert.match(sessionListSource, /const historyBadge = getSessionHistoryBadge\(item\);/);
  assert.match(sessionListSource, /historyBadge\?\.accessibilityLabel/);
  assert.match(sessionListSource, /accessibilityLabel=\{`\$\{item\.title\}, \$\{sessionAccessibilityParts\.join\(', '\)\}`\}/);
  assert.match(sessionListSource, /\{historyBadge && \(/);
  assert.match(sessionListSource, /style=\{styles\.sessionBadgeRow\}/);
  assert.match(sessionListSource, /sessionHistoryBadgeWarning:/);
  assert.match(sessionListSource, /sessionHistoryBadgePrimary:/);
});

test('session list lets users filter chats by compacted versus partial history state', () => {
  assert.match(sessionListSource, /type SessionHistoryFilter = 'all' \| 'compacted' \| 'partial';/);
  assert.match(sessionListSource, /const getSessionHistoryFilter = \(/);
  assert.match(sessionListSource, /const \[historyFilter, setHistoryFilter\] = useState<SessionHistoryFilter>\('all'\);/);
  assert.match(sessionListSource, /const filteredSessions = useMemo\(\(\) => \{/);
  assert.match(sessionListSource, /return sessions\.filter\(\(session\) => getSessionHistoryFilter\(session\) === historyFilter\);/);
  assert.match(sessionListSource, /\['all', 'All'\],/);
  assert.match(sessionListSource, /\['compacted', 'Compacted'\],/);
  assert.match(sessionListSource, /\['partial', 'Partial'\],/);
  assert.match(sessionListSource, /style=\{\[\s*styles\.historyFilterChip,/);
  assert.match(sessionListSource, /data=\{filteredSessions\}/);
});

test('session list shows active-versus-total history counts when a compacted chat has hidden earlier messages', () => {
  assert.match(sessionListSource, /type SessionHistoryCountSummary = \{/);
  assert.match(sessionListSource, /const getSessionHistoryCountSummary = \(/);
  assert.match(sessionListSource, /representedCount <= session\.messageCount/);
  assert.match(sessionListSource, /label: `\$\{session\.messageCount\.toLocaleString\(\)\} active · \$\{representedCount\.toLocaleString\(\)\} total`/);
  assert.match(sessionListSource, /historyCountSummary\?\.accessibilityLabel/);
  assert.match(sessionListSource, /historyCountSummary\?\.label/);
});