const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('avoids redundant desktop emoji chrome in stub session rows', () => {
  assert.doesNotMatch(screenSource, /💻/);
  assert.match(screenSource, /\{isStub \? ' · from desktop' : ''\}/);
});

test('keeps session rows to a compact two-line layout with inline metadata', () => {
  assert.match(screenSource, /<Text style=\{styles\.sessionPreview\} numberOfLines=\{1\}>[\s\S]*?<Text style=\{styles\.sessionPreviewMeta\}>/);
  assert.doesNotMatch(screenSource, /styles\.sessionMeta/);
});

test('does not append raw tool payload text into session previews when merging tool results', () => {
  assert.doesNotMatch(screenSource, /lastMessage\.content = \(lastMessage\.content \|\| ''\) \+\s*\(lastMessage\.content \? '\\n' : ''\) \+ historyMsg\.content/);
});

test('keeps the session title row shrinkable for narrow mobile widths', () => {
  assert.match(screenSource, /sessionTitleRow:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?marginRight:\s*8,/);
  assert.match(screenSource, /sessionTitle:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
});

test('moves new chat into the navigation header and removes the old inline action row', () => {
  assert.match(screenSource, /style=\{styles\.headerNewChatButton\}/);
  assert.match(screenSource, />\+ New Chat<\/Text>/);
  assert.doesNotMatch(screenSource, /styles\.clearButton/);
});

test('keeps pin controls in chat rows and removes the helper copy under search', () => {
  assert.match(screenSource, /item\.isPinned \? 'Pinned' : 'Pin'/);
  assert.match(screenSource, /styles\.sessionPinButton/);
  assert.doesNotMatch(screenSource, /styles\.searchHelperText/);
});

test('keeps archived chats reachable from the session list', () => {
  assert.match(screenSource, /sessionListMode/);
  assert.match(screenSource, /filterSessionsByArchiveMode\(results, sessionListMode\)/);
  assert.match(screenSource, /Archived\$\{sessionArchiveCount > 0/);
  assert.match(screenSource, /Unarchive/);
});
