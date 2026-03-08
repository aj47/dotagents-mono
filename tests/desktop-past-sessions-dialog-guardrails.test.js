const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'past-sessions-dialog.tsx'),
  'utf8'
);

test('past sessions single-delete asks for confirmation and keeps retry guidance inline', () => {
  assert.match(source, /confirm\(`Delete "\$\{session\.title\}"\? This session will be removed from Past Sessions\.`\)/);
  assert.match(source, /const \[deleteSessionError, setDeleteSessionError\] = useState<PastSessionListItem \| null>\(null\)/);
  assert.match(source, /\{`Couldn't delete "\$\{deleteSessionError\.title\}" yet\.`\}/);
  assert.match(source, /The session is still available, so you can try again\./);
  assert.match(source, /Retry delete/);
});

test('past sessions row keyboard shortcuts ignore inner controls and show row-scoped delete progress', () => {
  assert.match(source, /if \(e\.target !== e\.currentTarget\) return/);
  assert.match(source, /pendingDeleteSessionId === session\.id \? "Deleting session" : "Delete session"/);
  assert.match(source, /<Loader2 className="h-3\.5 w-3\.5 animate-spin" \/>/);
});

test('past sessions rows use a display-title fallback so blank history titles stay actionable', () => {
  assert.match(source, /import \{ getConversationHistoryDisplayTitle \} from "@renderer\/lib\/conversation-history-display"/);
  assert.match(source, /getConversationHistoryDisplayTitle\(session\)\.toLowerCase\(\)\.includes\(q\)/);
  assert.match(source, /const sessionDisplayTitle = getConversationHistoryDisplayTitle\(session\)/);
  assert.match(source, /\{ id: session\.id, title: sessionDisplayTitle \}/);
  assert.match(source, /aria-label=\{pendingDeleteSessionId === session\.id \? `Deleting \$\{sessionDisplayTitle\}` : `Delete \$\{sessionDisplayTitle\}`\}/);
});

test('past sessions clear-all failures stay inline inside the destructive confirmation', () => {
  assert.match(source, /const \[deleteAllErrorMessage, setDeleteAllErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(source, /Couldn't delete your past sessions yet\. Your history is still available, so you can try again\./);
  assert.match(source, /\{deleteAllErrorMessage && \(/);
});

test('past sessions distinguish blocking load failures from refresh failures and keep retry local', () => {
  assert.match(source, /const isLoadingPastSessions = conversationHistoryQuery\.isLoading && !conversationHistoryQuery\.data/);
  assert.match(source, /const hasPastSessionsLoadError = conversationHistoryQuery\.isError && !conversationHistoryQuery\.data/);
  assert.match(source, /const hasPastSessionsRefreshError = conversationHistoryQuery\.isError && allPastSessions\.length > 0/);
  assert.match(source, /Past sessions couldn&apos;t refresh/);
  assert.match(source, /titles and previews may be stale until refresh succeeds\./);
  assert.match(source, /Couldn&apos;t load past sessions/);
  assert.match(source, /void conversationHistoryQuery\.refetch\(\)/);
  assert.ok((source.match(/Retry loading/g) || []).length >= 2);
});

test('past sessions search empty state explains there are no matches and offers clear search', () => {
  assert.match(source, /const trimmedSearchQuery = searchQuery\.trim\(\)/);
  assert.match(source, /const hasSearchQuery = trimmedSearchQuery\.length > 0/);
  assert.match(source, /No sessions match/);
  assert.match(source, /Clear search/);
  assert.match(source, /onClick=\{\(\) => setSearchQuery\(""\)\}/);
});