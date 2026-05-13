const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionListSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('deletes linked desktop conversations before removing mobile chat rows', () => {
  assert.match(sessionListSource, /serverConversationId = sessionStore\.sessions\.find/);
  assert.match(sessionListSource, /settingsClient && serverConversationId/);
  assert.match(sessionListSource, /settingsClient\.deleteConversation\(serverConversationId\)/);
  assert.match(sessionListSource, /await sessionStore\.deleteSession\(session\.id\)/);
});

test('renames linked desktop conversations before updating mobile chat titles', () => {
  assert.match(sessionListSource, /const \[renameSession, setRenameSession\] = useState<SessionListItem \| null>\(\s*null,\s*\)/);
  assert.match(sessionListSource, /normalizeConversationTitleText\(renameTitleDraft,\s*\{\s*maxChars:\s*80,\s*\}\)/);
  assert.match(sessionListSource, /settingsClient\.updateConversation\(\s*serverConversationId,\s*\{\s*title:\s*nextTitle\s*\},\s*\)/);
  assert.match(sessionListSource, /await sessionStore\.renameSessionTitle\(renameSession\.id, updatedTitle\)/);
  assert.match(sessionListSource, /conversationListSurface\.renameDialog\.title/);
});

test('clear all chats deletes connected desktop conversations before clearing local chats', () => {
  assert.match(settingsSource, /settingsClient\.deleteAllConversations\(\)/);
  assert.match(settingsSource, /connected desktop server/);
  assert.match(settingsSource, /await sessionStore\.clearAllSessions\(\)/);
});
