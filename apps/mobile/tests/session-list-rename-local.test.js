const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionListSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

const sessionStoreSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'store', 'sessions.ts'),
  'utf8'
);

const settingsApiSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);

test('mobile chat list can rename local and linked desktop conversations without shared presentation imports', () => {
  assert.match(sessionListSource, /const \[renameSession, setRenameSession\] = useState<SessionListItem \| null>\(null\)/);
  assert.match(sessionListSource, /const handleOpenRenameSession = useCallback/);
  assert.match(sessionListSource, /settingsClient\.updateConversation\(serverConversationId, \{ title: nextTitle \}\)/);
  assert.match(sessionListSource, /await sessionStore\.renameSessionTitle\(renameSession\.id, updatedTitle\)/);
  assert.match(sessionListSource, /<Text style=\{styles\.renameModalTitle\}>Rename chat<\/Text>/);
  assert.match(sessionListSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Save chat title'\)\}/);
  assert.match(sessionListSource, /Choose action for "\$\{session\.title\}":[\s\S]*?1\. Rename/);
  assert.match(sessionListSource, /\{ text: 'Rename', onPress: \(\) => handleOpenRenameSession\(session\) \}/);
  assert.doesNotMatch(sessionListSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(sessionListSource, /conversationListSurface/);
});

test('session store persists renamed chat titles locally', () => {
  assert.match(sessionStoreSource, /renameSessionTitle: \(id: string, title: string\) => Promise<void>;/);
  assert.match(sessionStoreSource, /export function normalizeSessionTitleText/);
  assert.match(sessionStoreSource, /const renameSessionTitle = useCallback/);
  assert.match(sessionStoreSource, /title: normalizedTitle/);
  assert.match(sessionStoreSource, /await saveSessions\(sessionsToSave\)/);
  assert.match(settingsApiSource, /async updateConversation\(id: string, data: UpdateConversationRequest\)/);
});
