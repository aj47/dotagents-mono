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

test('past sessions clear-all failures stay inline inside the destructive confirmation', () => {
  assert.match(source, /const \[deleteAllErrorMessage, setDeleteAllErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(source, /Couldn't delete your past sessions yet\. Your history is still available, so you can try again\./);
  assert.match(source, /\{deleteAllErrorMessage && \(/);
});