const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8',
);

test('mobile chat list exposes active and archived chat views locally', () => {
  assert.match(source, /const \[sessionListMode, setSessionListMode\] = useState<'active' \| 'archived'>\('active'\)/);
  assert.match(source, /archivedSessionCount/);
  assert.match(source, /sessionListMode === 'archived' \? !!s\.isArchived : !s\.isArchived/);
  assert.match(source, /accessibilityLabel="Chat archive filter"/);
  assert.match(source, /Archived \(\$\{archivedSessionCount\}\)/);
  assert.match(source, /setSessionListMode\(mode\)/);
});

test('archived rows can be restored without importing shared presentation modules', () => {
  assert.match(source, /void handleToggleSessionArchived\(item\.id\)/);
  assert.match(source, /Unarchive/);
  assert.match(source, /Moves this chat back to the active chats list/);
  assert.doesNotMatch(source, /@dotagents\/shared\/conversation-list-presentation/);
  assert.doesNotMatch(source, /@dotagents\/shared\/app-shell/);
});
