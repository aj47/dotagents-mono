const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('adds a mobile chat search field with a search-specific empty state', () => {
  assert.match(screenSource, /placeholder='Search chats\.\.\.'/);
  assert.match(screenSource, /accessibilityHint="Search chat titles, previews, and loaded message text\."/);
  assert.match(screenSource, /<Text style=\{styles\.emptyTitle\}>No matching chats<\/Text>/);
  assert.match(screenSource, /ListEmptyComponent=\{hasActiveSearch \? SearchEmptyState : EmptyState\}/);
});

test('shows matched message snippets in search results when available', () => {
  assert.match(screenSource, /const rawPreview = \(item\.searchPreview \?\? item\.preview\) \|\| 'No messages yet';/);
  assert.match(screenSource, /const sessionPreviewText = rawPreview\.startsWith\('tool: \['\) \|\| rawPreview\.includes\('\{"success":'\)/);
});
