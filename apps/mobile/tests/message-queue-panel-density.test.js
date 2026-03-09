const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MessageQueuePanel.tsx'),
  'utf8'
);

test('mobile queued-message rows use text-first actions with explicit accessibility labels', () => {
  assert.match(source, /<Text style=\{styles\.retryActionText\}>Retry<\/Text>/);
  assert.match(source, /<Text style=\{styles\.editActionText\}>Edit<\/Text>/);
  assert.match(source, /<Text style=\{styles\.removeActionText\}>Remove<\/Text>/);
  assert.match(source, /accessibilityLabel="Retry queued message"/);
  assert.match(source, /accessibilityLabel="Edit queued message"/);
  assert.match(source, /accessibilityLabel="Remove queued message"/);
  assert.doesNotMatch(source, /<Ionicons name="refresh" size=\{16\} color=\{theme\.colors\.foreground\} \/>/);
  assert.doesNotMatch(source, /<Ionicons name="pencil" size=\{16\} color=\{theme\.colors\.foreground\} \/>/);
  assert.doesNotMatch(source, /<Ionicons name="close" size=\{16\} color=\{theme\.colors\.foreground\} \/>/);
});

test('mobile queued-message actions keep wrap-safe chip sizing instead of a tiny side icon rail', () => {
  assert.match(source, /actions:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?gap:\s*8,[\s\S]*?marginTop:\s*6,/);
  assert.match(source, /actionButton:\s*\{[\s\S]*?alignSelf:\s*'flex-start',[\s\S]*?minHeight:\s*28,[\s\S]*?paddingHorizontal:\s*8,[\s\S]*?paddingVertical:\s*4,[\s\S]*?borderRadius:\s*999,/);
  assert.match(source, /hitSlop=\{\{ top: 8, bottom: 8, left: 8, right: 8 \}\}/);
});