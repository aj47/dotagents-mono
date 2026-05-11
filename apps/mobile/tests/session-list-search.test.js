const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('adds a mobile chat search field with a search-specific empty state', () => {
  assert.match(screenSource, /placeholder=\{APP_CONVERSATION_LIST_COPY\.searchPlaceholder\}/);
  assert.match(screenSource, /accessibilityHint=\{APP_CONVERSATION_LIST_COPY\.searchAccessibilityHint\}/);
  assert.match(screenSource, /getConversationListEmptyState\(\{[\s\S]*?hasActiveSearch: true,/);
  assert.match(screenSource, /ListEmptyComponent=\{hasActiveSearch \? SearchEmptyState : EmptyState\}/);
});

test('shows matched message snippets in search results when available', () => {
  assert.match(screenSource, /normalizeConversationListPreviewText\(item\.searchPreview \?\? item\.preview\)/);
});
